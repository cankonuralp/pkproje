/* GİRİŞ VE OTURUM ÇEKİRDEĞİ (09-E1–E4 · karar 34, 37) — sunucuda; istemci yalnız çerezdeki rasgele belirteci taşır.
   · Giriş firma bağlamında: alt alan adından çözülen firma → kiraciIcinde (RLS). Başka firmanın hesabı görünmez, denenemez.
   · Kilit (karar 37): hesapta 5 hata → 15 dk; aynı IP'den firmada 5 hata → 15 dk. Kilitliyken parola denetlenmez bile.
   · Yanıt hesabın var olup olmadığını söylemez (tek ileti, eşit süre).
   · Belirteç 32 bayt rasgele; veritabanında yalnız SHA-256 özeti. Hareketsizlik 12 saat, mutlak süre 14 gün (2026-10-04, teknik seçim).
   · Oturum okunurken roller ve durum HER SEFERİNDE hesaptan okunur — rol istemciden gelmez, düşürülen yetki hemen geçerlidir (09-E4). */
import { createHash, randomBytes } from "node:crypto";
import { kiraciIcinde, type Havuz } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import type { Rol } from "../yetki/tanim.ts";
import { parolaDogru, sahteDenetim } from "./parola.ts";

export const KILIT_ESIGI = 5;
export const KILIT_SURE_DK = 15;
export const HAREKETSIZ_SAAT = 12;
export const MUTLAK_GUN = 14;

export interface OturumHesabi { id: string; firmaId: string; ad: string; eposta: string; roller: Rol[]; durum: "ilk" | "etkin" }

export type GirisSonucu =
  | { tamam: true; belirtec: string; hesap: OturumHesabi; bitis: Date }
  | { tamam: false; neden: "hatali" | "kilitli"; kilitBitis?: Date };

export const belirtecOzeti = (b: string) => createHash("sha256").update(b, "utf8").digest("hex");
const BELIRTEC = /^[A-Za-z0-9_-]{43}$/;
const dk = (n: number) => n * 60_000;

interface HesapSatiri { id: string; firma_id: string; ad: string; eposta: string; roller: Rol[]; durum: string; parola_ozeti: string | null; hatali_deneme: number; kilit_bitis: Date | null }

export async function girisYap(havuz: Havuz, firmaId: string, g: { eposta: string; parola: string; ip: string; tarayici?: string; simdi?: Date }): Promise<GirisSonucu> {
  const simdi = g.simdi ?? new Date();
  const eposta = g.eposta.trim().toLowerCase();
  const ip = g.ip.slice(0, 64) || "bilinmiyor";
  return kiraciIcinde(havuz, firmaId, async (db) => {
    const ipKilit = (await db.sorgu<{ kilit_bitis: Date | null }>("SELECT kilit_bitis FROM giris_kilidi WHERE ip = $1 FOR UPDATE", [ip])).rows[0];
    if (ipKilit?.kilit_bitis && ipKilit.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli", kilitBitis: ipKilit.kilit_bitis }; }
    const h = (await db.sorgu<HesapSatiri>("SELECT id, firma_id, ad, eposta, roller, durum, parola_ozeti, hatali_deneme, kilit_bitis FROM hesap WHERE eposta = $1 FOR UPDATE", [eposta])).rows[0];
    if (h?.kilit_bitis && h.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli", kilitBitis: h.kilit_bitis }; }
    const dogru = h && h.parola_ozeti && h.durum !== "pasif" ? await parolaDogru(g.parola, h.parola_ozeti) : (await sahteDenetim(g.parola), false);
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
      if (h && h.durum !== "pasif") {
        const sayi = (h.kilit_bitis && h.kilit_bitis <= simdi ? 0 : h.hatali_deneme) + 1;
        await db.sorgu("UPDATE hesap SET hatali_deneme = $2, kilit_bitis = $3 WHERE id = $1",
          [h.id, sayi >= KILIT_ESIGI ? 0 : sayi, sayi >= KILIT_ESIGI ? kilit : null]);
        if (sayi >= KILIT_ESIGI) {
          await izYaz(db, { kim: h.eposta, ne: "giris.hesap_kilitlendi", nesne: "hesap", nesneId: h.id, ayrinti: { ip, bitis: kilit.toISOString() } });
          return { tamam: false, neden: "kilitli", kilitBitis: kilit };
        }
      }
      if (ipYeni >= KILIT_ESIGI) return { tamam: false, neden: "kilitli", kilitBitis: kilit };
      return { tamam: false, neden: "hatali" };
    }
    await db.sorgu("UPDATE hesap SET hatali_deneme = 0, kilit_bitis = NULL WHERE id = $1 AND (hatali_deneme <> 0 OR kilit_bitis IS NOT NULL)", [h.id]);
    await db.sorgu("DELETE FROM giris_kilidi WHERE ip = $1", [ip]);
    const belirtec = randomBytes(32).toString("base64url");
    const bitis = new Date(simdi.getTime() + MUTLAK_GUN * 86_400_000);
    await db.sorgu("INSERT INTO oturum (ozet, hesap_id, olustu, son_kullanim, bitis, ip, tarayici) VALUES ($1, $2, $3, $3, $4, $5, $6)",
      [belirtecOzeti(belirtec), h.id, simdi, bitis, ip, g.tarayici?.slice(0, 300) ?? null]);
    /* iz: giren hesap işlemin bağlamına yazılır → veritabanı "kim"i oradan damgalar (0003) */
    await db.sorgu("SELECT set_config('app.hesap_id', $1, true)", [h.id]);
    await izYaz(db, { kim: h.eposta, ne: "giris.yapildi", nesne: "hesap", nesneId: h.id, ayrinti: { ip } });
    return { tamam: true, belirtec, bitis, hesap: { id: h.id, firmaId: h.firma_id, ad: h.ad, eposta: h.eposta, roller: h.roller, durum: h.durum as "ilk" | "etkin" } };
  });
}

/** çerezdeki belirteçten oturumu okur; geçersiz / süresi dolmuş / pasif hesap → null (süresi dolan silinir). Roller hesaptan taze okunur. */
export async function oturumOku(havuz: Havuz, firmaId: string, belirtec: string | undefined, simdi = new Date()): Promise<OturumHesabi | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  const ozet = belirtecOzeti(belirtec);
  return kiraciIcinde(havuz, firmaId, async (db) => {
    const r = (await db.sorgu<HesapSatiri & { son_kullanim: Date; bitis: Date }>(
      `SELECT h.id, h.firma_id, h.ad, h.eposta, h.roller, h.durum, o.son_kullanim, o.bitis FROM oturum o JOIN hesap h ON h.id = o.hesap_id WHERE o.ozet = $1`, [ozet])).rows[0];
    if (!r) return null;
    const dolmus = r.bitis <= simdi || simdi.getTime() - r.son_kullanim.getTime() > HAREKETSIZ_SAAT * 3_600_000;
    if (dolmus || r.durum === "pasif") { await db.sorgu("DELETE FROM oturum WHERE ozet = $1", [ozet]); return null; }
    /* son kullanım dakikada bir yazılır (her istekte yazma yok — 09 veri tasarrufu) */
    if (simdi.getTime() - r.son_kullanim.getTime() > 60_000) await db.sorgu("UPDATE oturum SET son_kullanim = $2 WHERE ozet = $1", [ozet, simdi]);
    return { id: r.id, firmaId: r.firma_id, ad: r.ad, eposta: r.eposta, roller: r.roller, durum: r.durum as "ilk" | "etkin" };
  });
}

export async function cikisYap(havuz: Havuz, firmaId: string, belirtec: string | undefined): Promise<void> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return;
  await kiraciIcinde(havuz, firmaId, (db) => db.sorgu("DELETE FROM oturum WHERE ozet = $1", [belirtecOzeti(belirtec)]));
}
