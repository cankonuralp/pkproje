/* MÜŞTERİ GİRİŞİ VE OTURUMU (0030; karar 33, 35 — müşteri de aynı adresten, aynı ekrandan girer; 09-E1–E5). Personel girişinin kurallarıyla:
   · Giriş firma bağlamında (alt alan adı → firma → RLS); yanıt girişin var olup olmadığını söylemez (tek ileti, eşit süre).
   · Kilit (karar 37): girişte 5 hata → 15 dk; aynı IP'den firmada 5 hata → 15 dk (personel girişiyle ortak IP sayacı).
   · Pasif giriş ya da pasif müşteri giremez; oturum her istekte girişten, müşteriden ve tesis kapsamından TAZE okunur (kapsam daralınca hemen).
   · Belirteç 32 bayt rasgele, veritabanında yalnız SHA-256 özeti; süreler personelinkiyle aynı.
   Müşterinin VERİ işlemleri ayrı rolde koşar (src/server/db/kiraci.ts musteri seçeneği → probata_musteri, kısıtlayıcı politikalar). */
import { randomBytes } from "node:crypto";
import { kiraciIcinde, type Havuz } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import { belirtecOzeti, HAREKETSIZ_SAAT, HATIRLA_HAREKETSIZ_GUN, KILIT_ESIGI, KILIT_SURE_DK, MUTLAK_GUN } from "./oturum.ts";
import { parolaDogru, parolaOzeti, sahteDenetim } from "./parola.ts";

export interface MusteriOturumHesabi {
  id: string; firmaId: string; musteriId: string; ad: string; eposta: string;
  /** tesis kapsamı: null = bütün tesisler */
  tesisler: string[] | null;
  durum: "ilk" | "etkin"; hatirla: boolean;
  /** müşterinin kısa adı (kabukta) */
  musteriAd: string;
}
export type MusteriGirisSonucu =
  | { tamam: true; belirtec: string; hesap: MusteriOturumHesabi; bitis: Date }
  | { tamam: false; neden: "hatali" | "kilitli"; kilitBitis?: Date };

const BELIRTEC = /^[A-Za-z0-9_-]{43}$/;
const dk = (n: number) => n * 60_000;

/** bu e-posta firmada bir müşteri girişi mi (aynı giriş ekranı hangi hesaba bakacağını buradan bilir). Var olup olmadığı istemciye söylenmez. */
export async function musteriGirisiMi(havuz: Havuz, firmaId: string, eposta: string): Promise<boolean> {
  const e = eposta.trim().toLowerCase();
  return kiraciIcinde(havuz, firmaId, async (db) => (await db.sorgu("SELECT 1 FROM musteri_hesap WHERE eposta = $1", [e])).rowCount === 1);
}

interface Satir {
  id: string; firma_id: string; musteri_id: string; ad: string; eposta: string; tesisler: string[] | null; durum: string; parola_ozeti: string | null;
  hatali_deneme: number; kilit_bitis: Date | null; musteri_pasif: string | null; kisa: string;
}
const SEC = `SELECT h.id::text, h.firma_id::text, h.musteri_id::text, h.ad, h.eposta, h.tesisler::text[] AS tesisler, h.durum, h.parola_ozeti, h.hatali_deneme,
  h.kilit_bitis, m.pasif AS musteri_pasif, m.kisa FROM musteri_hesap h JOIN musteri m ON m.id = h.musteri_id`;
const hesapOf = (h: Satir, hatirla: boolean): MusteriOturumHesabi => ({
  id: h.id, firmaId: h.firma_id, musteriId: h.musteri_id, ad: h.ad, eposta: h.eposta, tesisler: h.tesisler, durum: h.durum as "ilk" | "etkin", hatirla, musteriAd: h.kisa,
});

export async function musteriGirisYap(havuz: Havuz, firmaId: string, g: { eposta: string; parola: string; ip: string; tarayici?: string; hatirla?: boolean; simdi?: Date }): Promise<MusteriGirisSonucu> {
  const simdi = g.simdi ?? new Date();
  const eposta = g.eposta.trim().toLowerCase();
  const ip = g.ip.slice(0, 64) || "bilinmiyor";
  return kiraciIcinde(havuz, firmaId, async (db) => {
    const ipKilit = (await db.sorgu<{ kilit_bitis: Date | null }>("SELECT kilit_bitis FROM giris_kilidi WHERE ip = $1 FOR UPDATE", [ip])).rows[0];
    if (ipKilit?.kilit_bitis && ipKilit.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli", kilitBitis: ipKilit.kilit_bitis }; }
    const h = (await db.sorgu<Satir>(`${SEC} WHERE h.eposta = $1 FOR UPDATE OF h`, [eposta])).rows[0];
    if (h?.kilit_bitis && h.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli", kilitBitis: h.kilit_bitis }; }
    const girebilir = !!h && !!h.parola_ozeti && (h.durum === "ilk" || h.durum === "etkin") && !h.musteri_pasif;
    const dogru = girebilir ? await parolaDogru(g.parola, h.parola_ozeti!) : (await sahteDenetim(g.parola), false);
    if (!dogru || !h) {
      const kilit = new Date(simdi.getTime() + dk(KILIT_SURE_DK));
      const ipYeni = (await db.sorgu<{ hatali_deneme: number }>(
        `INSERT INTO giris_kilidi (ip, hatali_deneme, son) VALUES ($1, 1, $2)
         ON CONFLICT (firma_id, ip) DO UPDATE SET hatali_deneme = CASE WHEN giris_kilidi.kilit_bitis IS NOT NULL AND giris_kilidi.kilit_bitis <= $2 THEN 1 ELSE giris_kilidi.hatali_deneme + 1 END,
           kilit_bitis = NULL, son = $2 RETURNING hatali_deneme`, [ip, simdi])).rows[0].hatali_deneme;
      if (ipYeni >= KILIT_ESIGI) {
        await db.sorgu("UPDATE giris_kilidi SET kilit_bitis = $2, hatali_deneme = 0 WHERE ip = $1", [ip, kilit]);
        await izYaz(db, { kim: "bilinmiyor", ne: "giris.ip_kilitlendi", ayrinti: { ip, bitis: kilit.toISOString() } });
      }
      if (h && girebilir) {
        const sayi = (h.kilit_bitis && h.kilit_bitis <= simdi ? 0 : h.hatali_deneme) + 1;
        await db.sorgu("UPDATE musteri_hesap SET hatali_deneme = $2, kilit_bitis = $3 WHERE id = $1",
          [h.id, sayi >= KILIT_ESIGI ? 0 : sayi, sayi >= KILIT_ESIGI ? kilit : null]);
        if (sayi >= KILIT_ESIGI) {
          await izYaz(db, { kim: h.eposta, ne: "musteri_giris.kilitlendi", nesne: "musteri_hesap", nesneId: h.id, ayrinti: { ip, bitis: kilit.toISOString() } });
          return { tamam: false, neden: "kilitli", kilitBitis: kilit };
        }
      }
      if (ipYeni >= KILIT_ESIGI) return { tamam: false, neden: "kilitli", kilitBitis: kilit };
      return { tamam: false, neden: "hatali" };
    }
    await db.sorgu("UPDATE musteri_hesap SET hatali_deneme = 0, kilit_bitis = NULL, son_giris = $2 WHERE id = $1", [h.id, simdi]);
    /* IP sayacı SIFIRLANMAZ (319 incelemesi): sayaç personel ve müşteri girişlerinde ortak — firma dışından bir müşteri kendi doğru girişiyle
       personel hesaplarına yönelik denemelerin IP kilidini silemesin; sayaç kilit dolunca kendiliğinden düşer */
    const belirtec = randomBytes(32).toString("base64url");
    const bitis = new Date(simdi.getTime() + MUTLAK_GUN * 86_400_000);
    await db.sorgu("INSERT INTO musteri_oturum (ozet, musteri_hesap_id, olustu, son_kullanim, bitis, ip, tarayici, hatirla) VALUES ($1, $2, $3, $3, $4, $5, $6, $7)",
      [belirtecOzeti(belirtec), h.id, simdi, bitis, ip, g.tarayici?.slice(0, 300) ?? null, g.hatirla === true]);
    await izYaz(db, { kim: h.eposta, ne: "musteri_giris.yapildi", nesne: "musteri_hesap", nesneId: h.id, ayrinti: { ip } });
    return { tamam: true, belirtec, bitis, hesap: hesapOf(h, g.hatirla === true) };
  });
}

/** çerezdeki belirteçten müşteri oturumu; geçersiz / süresi dolmuş / pasif giriş / pasif müşteri → null (süresi dolan silinir) */
export async function musteriOturumOku(havuz: Havuz, firmaId: string, belirtec: string | undefined, simdi = new Date()): Promise<MusteriOturumHesabi | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  const ozet = belirtecOzeti(belirtec);
  return kiraciIcinde(havuz, firmaId, async (db) => {
    const r = (await db.sorgu<Satir & { son_kullanim: Date; bitis: Date; hatirla: boolean }>(
      `${SEC.replace("FROM musteri_hesap h", ", o.son_kullanim, o.bitis, o.hatirla FROM musteri_oturum o JOIN musteri_hesap h ON h.id = o.musteri_hesap_id")} WHERE o.ozet = $1`,
      [ozet])).rows[0];
    if (!r) return null;
    const hareketsizSinir = r.hatirla ? HATIRLA_HAREKETSIZ_GUN * 86_400_000 : HAREKETSIZ_SAAT * 3_600_000;
    const dolmus = r.bitis <= simdi || simdi.getTime() - r.son_kullanim.getTime() > hareketsizSinir;
    if (dolmus || (r.durum !== "ilk" && r.durum !== "etkin") || r.musteri_pasif) { await db.sorgu("DELETE FROM musteri_oturum WHERE ozet = $1", [ozet]); return null; }
    if (simdi.getTime() - r.son_kullanim.getTime() > 60_000) await db.sorgu("UPDATE musteri_oturum SET son_kullanim = $2 WHERE ozet = $1", [ozet, simdi]);
    return hesapOf(r, r.hatirla);
  });
}

export async function musteriCikis(havuz: Havuz, firmaId: string, belirtec: string | undefined): Promise<void> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return;
  await kiraciIcinde(havuz, firmaId, (db) => db.sorgu("DELETE FROM musteri_oturum WHERE ozet = $1", [belirtecOzeti(belirtec)]));
}

export type MusteriParolaSonucu = { tamam: true; belirtec: string; bitis: Date } | { tamam: false; neden: "mevcut_yanlis" | "ayni" | "yok" };

/** müşteri parolasını değiştirir (geçici parolayla ilk girişte mevcut parola sorulmaz). Açık oturumlar düşer (0030 tetiği), bu cihaza yeni oturum. */
export async function musteriParolaDegistir(havuz: Havuz, firmaId: string, hesapId: string, p: { yeni: string; mevcut?: string; ip: string; tarayici?: string; hatirla?: boolean; simdi?: Date }): Promise<MusteriParolaSonucu> {
  const simdi = p.simdi ?? new Date();
  const ozet = await parolaOzeti(p.yeni);
  return kiraciIcinde(havuz, firmaId, async (db) => {
    const h = (await db.sorgu<{ eposta: string; durum: string; parola_ozeti: string | null }>(
      "SELECT eposta, durum, parola_ozeti FROM musteri_hesap WHERE id = $1 FOR UPDATE", [hesapId])).rows[0];
    if (!h || (h.durum !== "ilk" && h.durum !== "etkin") || !h.parola_ozeti) return { tamam: false, neden: "yok" } as const;
    if (h.durum !== "ilk" || p.mevcut !== undefined) {
      if (p.mevcut === undefined || !(await parolaDogru(p.mevcut, h.parola_ozeti))) return { tamam: false, neden: "mevcut_yanlis" } as const;
    }
    if (await parolaDogru(p.yeni, h.parola_ozeti)) return { tamam: false, neden: "ayni" } as const;
    await db.sorgu("UPDATE musteri_hesap SET parola_ozeti = $2, durum = 'etkin', hatali_deneme = 0, kilit_bitis = NULL, surum = surum + 1 WHERE id = $1", [hesapId, ozet]);
    const belirtec = randomBytes(32).toString("base64url");
    const bitis = new Date(simdi.getTime() + MUTLAK_GUN * 86_400_000);
    await db.sorgu("INSERT INTO musteri_oturum (ozet, musteri_hesap_id, olustu, son_kullanim, bitis, ip, tarayici, hatirla) VALUES ($1, $2, $3, $3, $4, $5, $6, $7)",
      [belirtecOzeti(belirtec), hesapId, simdi, bitis, p.ip.slice(0, 64) || "bilinmiyor", p.tarayici?.slice(0, 300) ?? null, p.hatirla === true]);
    await izYaz(db, { kim: h.eposta, ne: "musteri_giris.parola_degisti", nesne: "musteri_hesap", nesneId: hesapId, ayrinti: { ilk: h.durum === "ilk" } });
    return { tamam: true, belirtec, bitis } as const;
  });
}
