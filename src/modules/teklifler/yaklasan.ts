/* YAKLAŞAN MUAYENELER — hesap, saf (2026-11-09; reisim: "senesi yaklaşan aranması gereken müşteriler için teklifler de teklif hazırla tuşunun yanına
   yaklaşan muayeneler tuşu olsun ve orada sadece gelecek muayenesine son 2 ay kalan müşteriler - tesisler gözüksün uyarı balonu olsun"). Ekipman başına
   sonraki muayene: son imzalı raporun sonraki kontrolü, yoksa sistem öncesi kontrol + tür periyodu (Ana sayfanın hesabı). Tesis listeye, bir ekipmanının
   tarihi son 2 aya girince düşer. Tarihi geçmiş ama teklifi yapılmamış tesis aranmadan listeden kaybolmasın diye 2 ay daha, "geçti" olarak kalır; daha
   eski tarih (müşteri başka firmaya gitmiş) sayılmaz. Bu dönem için verilmiş teklif varsa satır durur ama balon saymaz. */
import type { TeklifDurumu } from "./sema.ts";

/** muayeneye kaç ay kala listede */
export const YAKLASAN_AY = 2;
/** tarihi geçen tesis kaç ay daha listede */
export const GECEN_AY = 2;
/** teklif, muayene tarihinden en çok bu kadar ay önce hazırlandıysa bu dönemin teklifidir (önceki dönemin teklifi sayılmaz) */
export const TEKLIF_ARALIGI_AY = 3;

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
export const ayEkle = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
export const gunArasi = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

export interface EkipmanMuayenesi { tesisId: string; turId: string; sonraki: string | null }
export interface TesisMuayenesi { tesisId: string; sonraki: string; kalan: number; ekipman: number; toplam: number; turler: string[] }

/** tesis başına: aralığa giren ekipman sayısı, en yakın tarih, türler; tarihe göre sıralı. Açık planı olan tesis planli'den elenir. */
export function yaklasanTesisler(l: readonly EkipmanMuayenesi[], bugun: string, planli: ReadonlySet<string> = new Set()): TesisMuayenesi[] {
  const son = ayEkle(bugun, YAKLASAN_AY), bas = ayEkle(bugun, -GECEN_AY);
  const toplam = new Map<string, number>(), t = new Map<string, { sonraki: string; ekipman: number; turler: Set<string> }>();
  for (const e of l) {
    toplam.set(e.tesisId, (toplam.get(e.tesisId) ?? 0) + 1);
    if (!e.sonraki || e.sonraki > son || e.sonraki < bas) continue;
    const x = t.get(e.tesisId) ?? { sonraki: e.sonraki, ekipman: 0, turler: new Set<string>() };
    x.ekipman++; x.turler.add(e.turId);
    if (e.sonraki < x.sonraki) x.sonraki = e.sonraki;
    t.set(e.tesisId, x);
  }
  return [...t.entries()].filter(([id]) => !planli.has(id))
    .map(([tesisId, x]) => ({ tesisId, sonraki: x.sonraki, kalan: gunArasi(bugun, x.sonraki), ekipman: x.ekipman, toplam: toplam.get(tesisId) ?? x.ekipman, turler: [...x.turler] }))
    .sort((a, b) => a.sonraki.localeCompare(b.sonraki));
}

/** teklif bu muayene dönemi için mi: hazırlanma günü aralığın içinde */
export const buDonemTeklifi = (teklifTarihi: string, sonraki: string) => teklifTarihi >= ayEkle(sonraki, -TEKLIF_ARALIGI_AY);

/** müşteriye henüz geçerli teklif gitmedi: teklif yok, taslakta kaldı ya da süresi doldu → balon sayar. Gönderilmiş, kabul ya da red edilmiş teklif saymaz. */
export const teklifBekliyor = (d: TeklifDurumu | null) => d === null || d === "taslak" || d === "suresi";

/** balonun sayıları: tarihi geçen (kırmızı) ve yaklaşan (sarı), yalnız teklif bekleyenler */
export function yaklasanSayilari(l: readonly { kalan: number; bekliyor: boolean }[]) {
  const b = l.filter((x) => x.bekliyor);
  return { gecen: b.filter((x) => x.kalan < 0).length, yaklasan: b.filter((x) => x.kalan >= 0).length };
}

/** "24 gün kaldı" · "Bugün" · "5 gün geçti" */
export const kalanYazi = (k: number) => (k === 0 ? "Bugün" : k > 0 ? `${k} gün kaldı` : `${-k} gün geçti`);
