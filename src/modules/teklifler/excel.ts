/* TEKLİFİN EKİPMAN LİSTESİ — EXCEL İÇE / DIŞA (maket teklifler.html "Excel'den yükle" / "Excel'e aktar", L1 2026-09-30; 325). Saf (tarayıcıda ve
   testte aynı): okunan satırlar → içe alınacak ekipmanlar (tür adla ya da kodla; ilk satır başlıksa atlanır; boş satır yok sayılır; kod dosyada ya
   da listede tekrar ederse, alan sınırı aşılırsa satır gerekçesiyle atlanır), kalemlere ekleme (tür başına adet; fiyat fiyat listesinden), dışa
   aktarma ve şablon. Dosya okuma tek okuyucudan (src/components/disa/oku.ts), yazma tek yazıcıdan (xlsx.ts). Sınırlar şemayla aynı
   (sema.ts TeklifGirdisi.ekipmanlar: kod 20, konum 80, seri 40, en çok 2 000 ekipman). */
import { xlsxBayt } from "../../components/disa/xlsx.ts";
import { paraGirdi } from "./sema.ts";

export interface ExcelTuru { id: string; ad: string; kod: string; brans: "m" | "e" }
export interface TeklifEkipmani { kod: string; tur: string; konum: string; seri: string }
/** satir: dosyadaki satır numarası (Excel'deki gibi 1'den) */
export interface ExcelSatiri { satir: number; kod: string; turAd: string; tur: string; konum: string; seri: string; ok: boolean; neden: string }

export const EKIPMAN_SINIR = 2000;
export const SABLON_BASLIK = ["Kod", "Ekipman türü", "Konum", "Seri no"] as const;
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");
const buyuk = (s: string) => s.trim().toLocaleUpperCase("tr");
const hucre = (h: readonly string[], i: number) => String(h[i] ?? "").trim();

/** okunan satırlar → içe alınacaklar (mevcut: formdaki liste — kodu orada olan satır da atlanır) */
export function excelSatirlari(ham: readonly (readonly string[])[], turler: readonly ExcelTuru[], mevcut: readonly TeklifEkipmani[] = []): ExcelSatiri[] {
  const adla = new Map(turler.map((t) => [kucuk(t.ad), t])), kodla = new Map(turler.map((t) => [buyuk(t.kod), t]));
  const turBul = (s: string) => adla.get(kucuk(s)) ?? kodla.get(buyuk(s));
  /* başlık: ilk satırda "kod" / "tür" geçer ve tür hücresi gerçek bir tür değil ("Türbin" adlı tür veri satırıdır) */
  const baslik = ham.length > 0 && /kod|t[üu]r/i.test(`${ham[0][0] ?? ""} ${ham[0][1] ?? ""}`) && !turBul(hucre(ham[0], 1));
  const listede = new Set(mevcut.map((e) => e.kod).filter(Boolean)), dosyada = new Set<string>();
  const l: ExcelSatiri[] = [];
  ham.forEach((h, i) => {
    if ((baslik && i === 0) || !h.some((x) => String(x ?? "").trim())) return;
    const kod = buyuk(hucre(h, 0)), turAd = hucre(h, 1), konum = hucre(h, 2), seri = hucre(h, 3);
    const t = turBul(turAd);
    const neden = !turAd ? "Tür yok, atlanır" : !t ? "Tür bulunamadı, atlanır" : kod.length > 20 ? "Kod en çok 20 karakter, atlanır"
      : konum.length > 80 ? "Konum en çok 80 karakter, atlanır" : seri.length > 40 ? "Seri no en çok 40 karakter, atlanır"
      : kod && dosyada.has(kod) ? "Kod dosyada iki kez, atlanır" : kod && listede.has(kod) ? "Kod listede zaten var, atlanır" : "";
    if (kod) dosyada.add(kod);
    l.push({ satir: i + 1, kod, turAd: turAd || "—", tur: t?.id ?? "", konum, seri, ok: !neden, neden });
  });
  return l;
}

/** kalem adedinin üst sınırı (sema.ts KalemGirdisi, 0037 teklif_kalem CHECK 1–999) */
export const ADET_UST = 999;
/** geçerli satırları listeye ve kalemlere ekler: tür başına adet (var olan kalemin adedi artar; yoksa fiyat listesinden yeni kalem); boş ilk kalem
    kalkar; liste sınırını ya da türün kalem adedi sınırını (999 — 324–327 incelemesi: aşan adetle teklif kaydedilemiyordu) aşan satır eklenmez
    (sayısı döner) */
export function kalemlereEkle<K extends { tur: string; adet: string; fiyat: string }>(kalemler: readonly K[], ekipmanlar: readonly TeklifEkipmani[],
  satirlar: readonly ExcelSatiri[], fiyat: (tur: string) => number | null): { kalemler: { tur: string; adet: string; fiyat: string }[]; ekipmanlar: TeklifEkipmani[];
  eklenen: number; turSayisi: number; atlanan: number } {
  const ok = satirlar.filter((x) => x.ok), yer = Math.max(0, EKIPMAN_SINIR - ekipmanlar.length);
  const mevcut = new Map(kalemler.filter((k) => k.tur).map((k) => [k.tur, Number(k.adet) || 0]));
  const sayac = new Map<string, number>(), alinan: ExcelSatiri[] = [];
  for (const x of ok) {
    const n = sayac.get(x.tur) ?? 0;
    if (alinan.length >= yer || (mevcut.get(x.tur) ?? 0) + n >= ADET_UST) continue;
    sayac.set(x.tur, n + 1); alinan.push(x);
  }
  const yeni: { tur: string; adet: string; fiyat: string }[] = kalemler.filter((k) => k.tur).map((k) => ({ tur: k.tur, adet: k.adet, fiyat: k.fiyat }));
  for (const [tur, n] of sayac) {
    const k = yeni.find((y) => y.tur === tur);
    if (k) k.adet = String((Number(k.adet) || 0) + n);
    else { const f = fiyat(tur); yeni.push({ tur, adet: String(n), fiyat: f ? paraGirdi(f) : "" }); }
  }
  return {
    kalemler: yeni.length ? yeni : [{ tur: "", adet: "1", fiyat: "" }],
    ekipmanlar: [...ekipmanlar, ...alinan.map((x) => ({ kod: x.kod, tur: x.tur, konum: x.konum, seri: x.seri }))],
    eklenen: alinan.length, turSayisi: sayac.size, atlanan: satirlar.length - alinan.length,
  };
}

/** dışa aktarma: Kod · Ekipman türü · Konum · Seri no · Branş · Birim fiyat (TL; teklifin kalemindeki, yoksa fiyat listesindeki) */
export function ekipmanExceli(liste: readonly TeklifEkipmani[], turler: readonly ExcelTuru[], fiyat: (tur: string) => number | null): Uint8Array {
  const tur = new Map(turler.map((t) => [t.id, t]));
  return xlsxBayt("Ekipmanlar", [[...SABLON_BASLIK, "Branş", "Birim fiyat (TL)"], ...liste.map((e) => {
    const t = tur.get(e.tur), f = fiyat(e.tur);
    return [e.kod, t?.ad ?? "", e.konum, e.seri, t ? (t.brans === "m" ? "Mekanik" : "Elektrik") : "", f ? paraGirdi(f) : ""];
  })]);
}

/** boş şablon (ilk satır başlık, ikinci örnek) */
export const sablonExceli = (ornekTur = "Hava tankı") => xlsxBayt("Ekipmanlar", [[...SABLON_BASLIK], ["", ornekTur, "Kazan dairesi", "HT-24-118"]]);
