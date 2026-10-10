/* SÜRÜM FARKI (471; reisim 2026-10-10, maket kararı k5 "evet": sürüm sayfasında önceki sürüme göre değişenler). İki format tanımı arasındaki
   değişiklikler okunur cümleler olarak: bölüm ve öğe (madde, grup, alan, sütun, değer) eklendi / çıkarıldı / adı değişti / ayarları değişti,
   cevap seti, kurallar, görünüm (form kodu, başlık, metot ve kapsam, genel muayene talimatı, madde cevabının biçimi). Öğeler KİMLİKLE eşlenir
   (kimlikler bütün tanımda tekil — ad değişse de aynı öğe). Saf; sürüm sayfası çizer. */
import type { Bolum, FormatTanimi } from "../../format/tanim.ts";
import { BLOK_ADI } from "./ui/ortak.ts";

export interface Fark { tur: "ekle" | "cikar" | "degis"; metin: string }
type OgeTuru = "Madde" | "Grup" | "Alan" | "Sütun" | "Değer";
interface Oge { tur: OgeTuru; ad: string; bolum: string; bolumId: string; govde: string }

const EN_COK = 200;
const tirnak = (s: string) => `“${s}”`;
const KURAL: Record<keyof FormatTanimi["kurallar"], string> = {
  foto: "“Uygun değil” maddede fotoğraf zorunlu", derece: "Kusur derecesi sorulur", oneri: "Sonuç önerisi",
};
const CEVAP_AD = { acilir: "Açılır liste", tus: "Yan yana tuşlar" } as const;

/** bölümün öğeleri (kimlik → öğe); govde: adı dışındaki ayarları (karşılaştırma için) */
function ogeler(t: FormatTanimi): Map<string, Oge> {
  const m = new Map<string, Oge>();
  const koy = (id: string, tur: OgeTuru, ad: string, b: Bolum, o: object) => {
    const { ...kalan } = o as Record<string, unknown>;
    delete kalan.ad; delete kalan.metin; delete kalan.maddeler; delete kalan.id;
    m.set(id, { tur, ad, bolum: b.ad, bolumId: b.id, govde: JSON.stringify(kalan) });
  };
  for (const b of t.bolumler) {
    if (b.blok === "liste") for (const g of b.gruplar) {
      if (g.ad) koy(g.id, "Grup", g.ad, b, g);
      for (const x of g.maddeler) koy(x.id, "Madde", x.metin, b, { ...x, grup: g.id });
    }
    if (b.blok === "bilgi") for (const a of b.alanlar) koy(a.id, "Alan", a.ad, b, a);
    if (b.blok === "olcum") for (const s of b.sutunlar) koy(s.id, "Sütun", s.ad, b, s);
    if (b.blok === "test") for (const d of b.degerler) koy(d.id, "Değer", d.ad, b, d);
  }
  return m;
}

/** bölümün öğeleri ve adı dışındaki ayarları (üst başlık, numarasızlık, alt başlık, en az, sonuç metni, imzalar, tablo hesabı, notlar …) */
function bolumGovdesi(b: Bolum): string {
  const { ...k } = b as Record<string, unknown>;
  for (const a of ["ad", "id", "gruplar", "alanlar", "sutunlar", "degerler", "cevaplar", "kilit"]) delete k[a];
  return JSON.stringify(k);
}

export function surumFarki(once: FormatTanimi, simdi: FormatTanimi): Fark[] {
  const l: Fark[] = [];
  const ekle = (tur: Fark["tur"], metin: string) => { if (l.length < EN_COK) l.push({ tur, metin }); };
  /* bölümler */
  const onceB = new Map(once.bolumler.map((b) => [b.id, b])), simdiB = new Map(simdi.bolumler.map((b) => [b.id, b]));
  for (const b of simdi.bolumler) {
    const o = onceB.get(b.id);
    if (!o) { ekle("ekle", `Bölüm eklendi: ${tirnak(b.ad)} (${BLOK_ADI[b.blok]})`); continue; }
    if (o.ad !== b.ad) ekle("degis", `Bölüm adı: ${tirnak(o.ad)} → ${tirnak(b.ad)}`);
    if (o.blok === "liste" && b.blok === "liste" && o.cevaplar.join("\n") !== b.cevaplar.join("\n")) {
      ekle("degis", `Cevap seti (${b.ad}): ${o.cevaplar.join(" / ")} → ${b.cevaplar.join(" / ")}`);
    }
    if (o.blok !== b.blok || bolumGovdesi(o) !== bolumGovdesi(b)) ekle("degis", `Bölüm ayarları değişti: ${tirnak(b.ad)}`);
  }
  for (const b of once.bolumler) if (!simdiB.has(b.id)) ekle("cikar", `Bölüm çıkarıldı: ${tirnak(b.ad)}`);
  const ortak = (x: FormatTanimi, y: Map<string, Bolum>) => x.bolumler.filter((b) => y.has(b.id)).map((b) => b.id).join("\n");
  if (ortak(once, simdiB) !== ortak(simdi, onceB)) ekle("degis", "Bölümlerin sırası değişti");
  /* öğeler */
  const onceO = ogeler(once), simdiO = ogeler(simdi);
  for (const [id, x] of simdiO) {
    const o = onceO.get(id);
    if (!o) { ekle("ekle", `${x.tur} eklendi (${x.bolum}): ${tirnak(x.ad)}`); continue; }
    if (o.ad !== x.ad) ekle("degis", `${x.tur} (${x.bolum}): ${tirnak(o.ad)} → ${tirnak(x.ad)}`);
    if (o.govde !== x.govde) ekle("degis", `${x.tur} ayarları değişti (${x.bolum}): ${tirnak(x.ad)}`);
  }
  for (const [id, o] of onceO) {
    /* çıkarılan bölümün öğeleri ayrıca sayılmaz (bölüm çıkarıldı satırı yeter) */
    if (!simdiO.has(id) && simdiB.has(o.bolumId)) ekle("cikar", `${o.tur} çıkarıldı (${o.bolum}): ${tirnak(o.ad)}`);
  }
  /* kurallar ve görünüm */
  for (const k of Object.keys(KURAL) as (keyof typeof KURAL)[]) {
    if (once.kurallar[k] !== simdi.kurallar[k]) ekle("degis", `Kural: ${KURAL[k]} — ${simdi.kurallar[k] ? "açıldı" : "kapandı"}`);
  }
  const g0 = once.gorunum, g1 = simdi.gorunum;
  if (g0.formKodu !== g1.formKodu) ekle("degis", `Doküman kodu: ${tirnak(g0.formKodu || "—")} → ${tirnak(g1.formKodu || "—")}`);
  if (g0.baslik !== g1.baslik) ekle("degis", `Belge başlığı: ${tirnak(g0.baslik || "—")} → ${tirnak(g1.baslik || "—")}`);
  if (g0.dayanak.join("\n") !== g1.dayanak.join("\n")) ekle("degis", "Metot ve kapsam (dayanak) değişti");
  if (g0.talimat !== g1.talimat) ekle("degis", "Genel muayene talimatı değişti");
  if (g0.cevap !== g1.cevap) ekle("degis", `Madde cevabı: ${CEVAP_AD[g0.cevap]} → ${CEVAP_AD[g1.cevap]}`);
  return l;
}
