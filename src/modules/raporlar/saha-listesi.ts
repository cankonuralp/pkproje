/* SAHA LİSTESİ — SAF KURALLAR (2026-11-08; sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2 — reisim: "rapor açıp tek tek ekipman için kontrol etmekten çok farksız
   değil daha hızlı olabilir", "yap"; K1–K6 önerilerle). Planın ekipmanları tek ekranda, satır başına Uygun / Değil; raporlar YAPAY ZEKÂSIZ, ücretsiz açılır.
   · Uygun: bütün maddeler uygun (önceki rapordan gelen seçim de ezilir), sonuç uygun.
   · Değil: seçilen maddeler uygun değil + not, kalanlar uygun, sonuç uygun değil. Formatın kontrol listesi yoksa not raporun yorumuna.
   · Formüllü madde yazılmaz (ilkCevaplar ile aynı). Ölçüm ve test değerleri raporda girilir (girilecekler).
   · K1: işaretsiz satırın raporu açılmaz (kalanlariUygun yalnız işaretsizleri işaretler).
   Tarayıcı ve sunucu ortak. Kilit tests/saha-listesi.test.ts, bozan tests/bozan/saha-listesi.bozan.ts. */
import type { Cevaplar, FormatTanimi } from "../../format/tanim.ts";
import { kimlik, z } from "../../sema/ortak.ts";

export const SAHA_NOT_EN_COK = 500, SAHA_MADDE_EN_COK = 20, SAHA_SOHBET_EN_COK = 10;
/** yeni ekipman penceresi: bir seferde en çok */
export const SAHA_SERI_EN_COK = 50;

/** kuyruktaki "rapor.saha": hangi planda hangi ekipmana (kayıt = cihazın geçici kimliği; gerçek kimliği ve numarayı sunucu verir) */
export const SahaRaporuGirdisi = z.object({
  plan: kimlik, ekipman: kimlik, sonuc: z.enum(["uygun", "degil"]),
  maddeler: z.array(z.string().min(1).max(64)).max(SAHA_MADDE_EN_COK).default([]),
  not: z.string().trim().max(SAHA_NOT_EN_COK).nullable().default(null),
  /** sohbetteki fotoğraflar (mesajın cihaz kimliği): raporun fotoğraflarına kopyalanır, mesaj işlendi işaretlenir */
  sohbet: z.array(kimlik).max(SAHA_SOHBET_EN_COK).default([]),
});
export type SahaRaporuGirdisi = z.output<typeof SahaRaporuGirdisi>;

/** yeni ekipman penceresi: tür + ortak marka / model + satır başına kullanım yeri; kodları sunucu verir (tesiste sıradaki) */
export const SahaEkipmanGirdisi = z.object({
  tur: kimlik, marka: z.string().trim().max(40).nullable().default(null), model: z.string().trim().max(40).nullable().default(null),
  yerler: z.array(z.string().trim().max(60)).min(1).max(SAHA_SERI_EN_COK),
});

export interface SahaIsareti { sonuc: "uygun" | "degil"; maddeler: string[]; not: string | null; sohbet: string[] }
export interface SahaMaddesi { id: string; bolum: string; grup: string; metin: string }

/** formatın işaretlenebilir kontrol maddeleri (formüllü olan ve olumsuz cevabı olmayan bölüm dışarıda) */
export function sahaMaddeleri(t: Pick<FormatTanimi, "bolumler">): SahaMaddesi[] {
  const l: SahaMaddesi[] = [];
  for (const b of t.bolumler) {
    if (b.blok !== "liste" || b.cevaplar.length < 2) continue;
    for (const g of b.gruplar) for (const m of g.maddeler) if (!m.formul?.trim()) l.push({ id: m.id, bolum: b.id, grup: g.ad, metin: m.metin });
  }
  return l;
}

const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
/** madde arama: yazılan sözcüklerin hepsi metinde ya da grup adında */
export function maddeAra(l: readonly SahaMaddesi[], ara: string): SahaMaddesi[] {
  const s = kucuk(ara).split(" ").filter(Boolean);
  if (!s.length) return [...l];
  return l.filter((m) => { const y = kucuk(`${m.metin} ${m.grup}`); return s.every((x) => y.includes(x)); });
}

/** raporun cevapları: Uygun → hepsi uygun; Değil → seçilenler olumsuz (cevap setinin 2. öğesi — motorun kusur tanımı) + not, kalanlar uygun; sonuç satırdan.
    bilinmeyen: formatta bulunamayan madde (format paketten sonra değiştiyse) — yazılmaz, not yoruma gider */
export function sahaCevaplari(t: Pick<FormatTanimi, "bolumler">, c: Cevaplar, g: Pick<SahaRaporuGirdisi, "sonuc" | "maddeler" | "not">): { cevaplar: Cevaplar; bilinmeyen: string[] } {
  const secili = new Set(g.sonuc === "degil" ? g.maddeler : []), bulunan = new Set<string>();
  const madde: Cevaplar["madde"] = { ...c.madde };
  for (const b of t.bolumler) {
    if (b.blok !== "liste") continue;
    for (const gr of b.gruplar) for (const m of gr.maddeler) {
      if (m.formul?.trim()) continue;
      if (secili.has(m.id) && b.cevaplar.length >= 2) {
        bulunan.add(m.id);
        madde[m.id] = { c: b.cevaplar[1]!, ...(g.not ? { not: g.not.slice(0, SAHA_NOT_EN_COK) } : {}) };
      } else madde[m.id] = { c: b.cevaplar[0]! };
    }
  }
  const bilinmeyen = [...secili].filter((x) => !bulunan.has(x));
  /* notun yazılacağı madde yoksa rapor yorumuna (not kaybolmaz) */
  const yorum = g.sonuc === "degil" && g.not && !bulunan.size ? g.not.slice(0, SAHA_NOT_EN_COK) : c.yorum;
  return { cevaplar: { ...c, madde, sonuc: g.sonuc === "uygun" ? "uygun" : "uygun_degil", yorum }, bilinmeyen };
}

/** raporda elle girilecekler: ölçüm ve test bölümlerinin adları (sonuç özeti) */
export function girilecekler(t: Pick<FormatTanimi, "bolumler">): string[] {
  return t.bolumler.flatMap((b) => (b.blok === "olcum" || b.blok === "test" ? [b.ad] : []));
}

/** "Kalanları uygun işaretle": yalnız işaretsiz satırlar; işaretli satıra dokunmaz */
export function kalanlariUygun(isaret: Readonly<Record<string, SahaIsareti>>, ekipmanlar: readonly string[]): Record<string, SahaIsareti> {
  const y = { ...isaret };
  for (const id of ekipmanlar) if (!y[id]) y[id] = { sonuc: "uygun", maddeler: [], not: null, sohbet: [] };
  return y;
}

const dakika = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
/** raporun başlangıç saati: mesai başlangıcı ya da kişinin o günkü son raporunun bitişi (hangisi geçse) — raporlar sırayla, çakışmasız dizilir */
export function sahaBaslangici(mesai: string, sonBitis: string | null): string {
  return sonBitis && dakika(sonBitis) > dakika(mesai) ? sonBitis : mesai;
}
