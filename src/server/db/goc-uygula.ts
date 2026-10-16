/* ══ GÖÇ DAĞITICI — "uygula" KİPİ (FIRMA-VT §5.5; FV8 — 2026-10-16) ═══════════════════════════════════════════════════════════════════════════
   PROBATA_GOC_DAGIT=uygula ile Vercel derlemesinde (src/server/db/goc-dagit.ts gocDagit çağırır; denetle kipinin salt okunurluğu orada kilitli —
   yazan her şey bu dosyada). Göçler Supabase Yönetim API'siyle (src/server/dis/supabase-yonetim.ts yonetimApiYurutucu; PAT yalnız ortamda):
   1. KİLİT: merkezde is_basla('goc_dagitim') — ikinci derleme düşmez, kilit bırakılana dek bekler (bütün iş en çok 120 sn — gocDagit'in süre sınırı).
      Süreç ölürse kilit is_basla'nın kuralıyla bir saat sonra "takıldı" sayılır.
   2. ÖZET DENETİMİ önce HEPSİNDE: merkez + kurulumu bitmiş her kendi projeli firma (dondurulmuş dahil; bakımdaki listede yok — FV13; kurulumdaki
      atlanır — göçünü kurulum yapar). Bir projede uygulanmış göçün özeti tutmuyorsa ya da proje koddan ileride (kodda olmayan göç) HİÇBİRİNE
      başlanmaz.
   3. UYGULAMA sırayla: önce merkez, sonra açılış sırasıyla firmalar; her göç kendi isteğinde (BEGIN … COMMIT); ilk hatada DURULUR — sonraki projelere
      dokunulmaz, ileri giden projeler geri alınmaz (kural: göçler geriye uyumlu — "önce göç, sonra kod").
   4. SONUNDA yeniden DENETLE (goc-dagit.ts'nin salt okunur denetimi, aynı ölçüt); geçerse güncel kendi projeli firmaların firma_vt.son_goc /
      goc_sayisi'si yazılır (yönetim rolü — 0096'daki sütun hakkı; "son göç" UYGULANAN göçün kaydı). Kilit iş kaydına özetle (sayılar) bırakılır.
   Çıktı SIRSIZ: adıyla yalnız sorunlu proje (merkez ya da firmanın kısa adı), yalnız durum kodu + SQLSTATE; başarılı projeler sayıyla. Fırlatmaz:
   gocDagit her hatayı satır + 1'e çevirir. Kilit tests/goc-uygula.test.ts (PostgreSQL, iki küme, Yönetim API taklidi) · olumsuz kanıt
   tests/bozan/goc-uygula.bozan.ts. */
import { gocFarki, type GocDosyasi, type GocFarki } from "./goc.ts";
import { isBasla, isBitir } from "./is.ts";
import { yonetimIcinde, type Havuz } from "./kiraci.ts";
import { yonetimApiYurutucu, YonetimHatasi, type SupabaseYonetimi } from "../dis/supabase-yonetim.ts";

/** goc-dagit.ts'nin hedef satırının gereken kısmı */
export interface UygulamaHedefi { firmaId: string; kisaAd: string; ref: string | null; kurulumTamam: boolean }
/** goc-dagit.ts'nin salt okunur denetiminin sonucu: çıkış kodu + güncel bulunan kendi projeli firmalar */
export interface DenetimSonucu { kod: number; guncel: string[] }

export interface UygulamaAyari {
  merkez: Havuz;
  api: SupabaseYonetimi;
  /** Yönetim API'si yerel taklit mi — ref'siz (yerel) veritabanları "yerel-…" adıyla yalnız o zaman */
  yerel: boolean;
  /** merkezin Supabase projesi (PROBATA_VT_KULLANICI "probata_uygulama.<ref>"; yerel taklitte "yerel-merkez") */
  merkezProje: string;
  dosyalar: readonly GocDosyasi[];
  beklenen: { son: string; sayi: number };
  yaz: (satir: string) => void;
  /** hedefler (goc_hedefleri — salt okunur yönetim işlemi) */
  hedefler: () => Promise<UygulamaHedefi[]>;
  /** salt okunur denetim (goc-dagit.ts) — sonuç satırlarını kendisi yazar */
  denetle: () => Promise<DenetimSonucu>;
  /** süre doldu mu (gocDagit'in süre sınırı) — kilit beklemesi biter */
  durdu: () => boolean;
  /** kilit beklemesi aralığı (ms) */
  kilitBekleMs?: number;
}

const KILIT = "goc_dagitim";
/** API hatasının sırsız nedeni */
const apiNedeni = (h: unknown): string =>
  h instanceof YonetimHatasi ? `yönetim API'si ${h.durum}${h.kod ? `, SQLSTATE ${h.kod}` : ""}` : h instanceof Error && /zaman|timeout|abort/i.test(h.message) ? "yönetim API'si zaman aşımı" : "yönetim API'sine ulaşılamadı";

export async function gocUygula(a: UygulamaAyari): Promise<number> {
  const y = a.yaz;
  const son = a.dosyalar.at(-1)?.ad;
  if (son !== a.beklenen.son || a.dosyalar.length !== a.beklenen.sayi) {
    y("HATA: kodun göç dosyaları beklenen son göçle / sayıyla tutmuyor (son-goc.ts) — uygulanmadı.");
    return 1;
  }

  /* 1. kilit */
  let kilit: string | null = null;
  for (let ilk = true; !a.durdu(); ilk = false) {
    kilit = await isBasla(a.merkez, KILIT);
    if (kilit) break;
    if (ilk) y("başka bir derleme göç uyguluyor — kilit bekleniyor.");
    await new Promise((coz) => setTimeout(coz, a.kilitBekleMs ?? 1_000));
  }
  if (!kilit) { y("DURDU: göç kilidi alınamadı (süre doldu) — yayın yapılmaz."); return 1; }

  const ozet = { proje: 0, uygulanan: 0 };
  let durum: "tamam" | "hata" = "hata";
  try {
    /* 2. projeler + özet denetimi (hepsinde, uygulamadan önce) */
    const hedefler = await a.hedefler();
    const kurulumda = hedefler.filter((h) => !h.kurulumTamam).length;
    const projeler: { ad: string; proje: string }[] = [{ ad: "merkez", proje: a.merkezProje }];
    for (const h of hedefler.filter((x) => x.kurulumTamam)) {
      const proje = h.ref ?? (a.yerel ? `yerel-${h.firmaId}` : null);
      if (!proje) { y(`firma ${h.kisaAd}: proje kimliği (ref) yok — göç uygulanamaz.`); y("DURDU: hiçbir projeye göç uygulanmadı — yayın yapılmaz."); return 1; }
      projeler.push({ ad: `firma ${h.kisaAd}`, proje });
    }
    ozet.proje = projeler.length;
    const farklar: { ad: string; proje: string; f: GocFarki }[] = [];
    let sorun = 0;
    for (const p of projeler) {
      let kayitli: Map<string, string>;
      try { kayitli = await yonetimApiYurutucu(a.api, p.proje).kayitli(); } catch (h) { y(`${p.ad}: ULAŞILAMADI — ${apiNedeni(h)}`); sorun++; continue; }
      const f = gocFarki(kayitli, a.dosyalar);
      if (f.degismis.length) { y(`${p.ad}: ÖZET FARKI — ${f.degismis.length} uygulanmış göç değiştirilmiş (ilk ${f.degismis[0]})`); sorun++; }
      if (f.fazla.length) { y(`${p.ad}: KODDAN İLERİDE — kodda olmayan ${f.fazla.length} göç (ilk ${f.fazla[0]})`); sorun++; }
      farklar.push({ ...p, f });
    }
    if (sorun) { y("DURDU: hiçbir projeye göç uygulanmadı — yayın yapılmaz (değiştirilmiş göç yerine yeni göç yazılır)."); return 1; }
    const bekleyen = farklar.reduce((t, x) => t + x.f.eksik.length, 0);
    y(bekleyen ? `${bekleyen} göç uygulanacak (${farklar.filter((x) => x.f.eksik.length).length} projede)${kurulumda ? `, ${kurulumda} firma kurulumda (atlandı)` : ""}.`
      : `uygulanacak göç yok${kurulumda ? ` (${kurulumda} firma kurulumda — atlandı)` : ""}.`);

    /* 3. sırayla: merkez, sonra firmalar; ilk hatada dur */
    for (const p of farklar) {
      const yur = yonetimApiYurutucu(a.api, p.proje);
      for (const goc of p.f.eksik) {
        if (a.durdu()) { y("DURDU: süre doldu — kalan göçler uygulanmadı."); return 1; }
        try { await yur.uygula(goc); } catch (h) {
          y(`${p.ad}: ${goc.ad} UYGULANAMADI — ${apiNedeni(h)}`);
          y("DURDU: sonraki projelere dokunulmadı; ileri giden projeler geri alınmaz (göçler geriye uyumlu) — yayın yapılmaz.");
          return 1;
        }
        ozet.uygulanan++;
      }
    }
    if (bekleyen) y(`uygulandı: ${ozet.uygulanan} göç.`);

    /* 4. yeniden denetle; geçerse son göç kaydı */
    const d = await a.denetle();
    if (d.kod !== 0) return 1;
    if (d.guncel.length) {
      await yonetimIcinde(a.merkez, (db) => db.sorgu("UPDATE firma_vt SET son_goc = $2, goc_sayisi = $3 WHERE firma_id = ANY($1::uuid[])",
        [d.guncel, a.beklenen.son, a.beklenen.sayi]));
    }
    durum = "tamam";
    return 0;
  } finally {
    await isBitir(a.merkez, kilit, durum, ozet).catch(() => { /* kilit bir saat sonra "takıldı" sayılır */ });
  }
}
