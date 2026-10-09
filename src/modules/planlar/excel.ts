/* PLAN AÇ › EKİPMANLAR — EXCEL'DEN AKTARMA (465; reisim 2026-10-09, hata listesi 7: "ayrıca excelden aktarma gibi seçenekler de olmalı"). Saf
   (tarayıcıda ve testte aynı): okunan satırlar → plana elle eklenecek ekipmanlar. Sütunlar: Kod · Ekipman türü · Konum (kod ve tür zorunlu; tür
   adla ya da kodla; ilk satır başlıksa atlanır; boş satır yok sayılır). Kod biçimi ve sınırlar plan şemasıyla aynı (sema.ts kodBicimi, konum 60);
   tesiste kayıtlı kod (zaten plana girer), listede ya da dosyada tekrar eden kod gerekçesiyle atlanır. Eşsizlik sunucuda yeniden denetlenir.
   Dosya okuma tek okuyucudan (src/components/disa/oku.ts), şablon tek yazıcıdan (xlsx.ts). */
import { xlsxBayt } from "../../components/disa/xlsx.ts";
import { kodBicimi, kodNormal } from "./sema.ts";

export interface ExcelTuru { id: string; ad: string; kod?: string }
/** satir: dosyadaki satır numarası (Excel'deki gibi 1'den) */
export interface PlanExcelSatiri { satir: number; kod: string; turAd: string; tur: string; konum: string; ok: boolean; neden: string }

export const PLAN_SABLON_BASLIK = ["Kod", "Ekipman türü", "Konum"] as const;
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");
const buyuk = (s: string) => s.trim().toLocaleUpperCase("tr");
const hucre = (h: readonly string[], i: number) => String(h[i] ?? "").trim();

/** tesiste: tesiste kayıtlı kodlar (plana zaten girer) · listede: formda elle yazılmış kodlar */
export function planExcelSatirlari(ham: readonly (readonly string[])[], turler: readonly ExcelTuru[], tesiste: readonly string[] = [],
  listede: readonly string[] = []): PlanExcelSatiri[] {
  const adla = new Map(turler.map((t) => [kucuk(t.ad), t])), kodla = new Map(turler.filter((t) => t.kod).map((t) => [buyuk(t.kod!), t]));
  const turBul = (s: string) => adla.get(kucuk(s)) ?? kodla.get(buyuk(s));
  const baslik = ham.length > 0 && /kod|t[üu]r/i.test(`${ham[0][0] ?? ""} ${ham[0][1] ?? ""}`) && !turBul(hucre(ham[0], 1));
  const tesisKod = new Set(tesiste), listeKod = new Set(listede.filter(Boolean)), dosyada = new Set<string>();
  const l: PlanExcelSatiri[] = [];
  ham.forEach((h, i) => {
    if ((baslik && i === 0) || !h.some((x) => String(x ?? "").trim())) return;
    const kod = kodNormal(hucre(h, 0)), turAd = hucre(h, 1), konum = hucre(h, 2);
    const t = turBul(turAd), kb = kodBicimi(kod);
    const neden = !kod ? "Kod yok, atlanır" : kb ? `${kb.metin} Atlanır.` : !turAd ? "Tür yok, atlanır" : !t ? "Tür bulunamadı, atlanır"
      : konum.length > 60 ? "Konum en çok 60 karakter, atlanır" : tesisKod.has(kod) ? "Tesiste kayıtlı; zaten plana girer"
      : dosyada.has(kod) ? "Kod dosyada iki kez, atlanır" : listeKod.has(kod) ? "Kod listede zaten var, atlanır" : "";
    if (kod) dosyada.add(kod);
    l.push({ satir: i + 1, kod, turAd: turAd || "—", tur: t?.id ?? "", konum, ok: !neden, neden });
  });
  return l;
}

export const planSablonExceli = (ornekTur = "Hava tankı") => xlsxBayt("Ekipmanlar", [[...PLAN_SABLON_BASLIK], ["HT-0101", ornekTur, "Kazan dairesi"]]);
