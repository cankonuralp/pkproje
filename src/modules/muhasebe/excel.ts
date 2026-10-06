/* GİDERLER — EXCEL İÇE / DIŞA (328; maket muhasebe.html gider-excel-ice / gider-excel-disa / gider-excel-sablon; reisim 2026-09-27: "otel vb örnek
   excel atarım inport export yine buradada olacak" — sütunlar örnek Excel gelince ona göre, VARSAYIM). Saf: tarayıcıda (önizleme) ve sunucuda
   (kayıttan önce yeniden denetim) aynı. İçe: Tarih · Tür · Tutar (KDV dahil) · KDV oranı · Açıklama · Proje no; ilk satır başlıksa atlanır; boş satır
   yok sayılır; her satır gerekçesiyle denetlenir, yalnız geçerliler girer (elle girilen, ödendi). Dışa: listenin süzülen satırları; tutarlar SAYI hücresi.
   328 incelemesi (maket tutarOku / oranOku): sayı hücresi (nokta ondalıklı, virgülsüz — Excel'in sakladığı) her ondalıkta okunup kuruşa
   yuvarlanır, Türkçe yazım ("1.250,00") ortak şemayla; oran "20", "%20", "0,2" ya da yüzde biçimli hücre (0.2); tür yalnız kendi anahtarı
   ("constructor" gibi nesne özellikleri değil); tutar 1 milyar TL'yi aşamaz. */
import { xlsxBayt } from "../../components/disa/xlsx.ts";
import { tutar as tutarSema } from "../../sema/ortak.ts";
import { GIDER_DURUM, GIDER_TUR, GIDER_TUTAR_UST, giderKdv, KDV_ORAN, type GiderDurumu, type GiderTuru } from "./sema.ts";

export const GIDER_SABLON = ["Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "Açıklama", "Proje no"] as const;
export const GIDER_EXCEL_SINIR = 500;
export interface GiderExcelSatiri {
  satir: number; tarih: string | null; tarihYazi: string; tur: GiderTuru | null; turYazi: string; tutar: number | null; tutarYazi: string; oran: number;
  aciklama: string; projeNo: string; plan: string | null; ok: boolean; neden: string;
}
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");
/** "GG.AA.YYYY" ya da "YYYY-AA-GG" → YYYY-AA-GG; geçersizse null */
export function tarihOku(s: string): string | null {
  const t = s.trim();
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t) ?? null;
  const iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
  if (!iso) return null;
  const [y, a, g] = iso.split("-").map(Number), d = new Date(Date.UTC(y, a - 1, g));
  return d.getUTCFullYear() === y && d.getUTCMonth() === a - 1 && d.getUTCDate() === g ? iso : null;
}
/** tutar → KURUŞ: sayı hücresi ("1250.5", "999.996") ya da Türkçe yazım ("1.250,50", "3.200 TL", "12.500"); geçersizse null.
    329–332 incelemesi: metin hücresi ("TL" eki, boşluk) ve binlik öbekli yazım Türkçe okunur — Excel'in ham sayısında ondalık hiçbir zaman sıfırla
    bitmez ve iki nokta olmaz, bu yüzden "12.500" / "1.250.000" binliktir; tek öbekli, sıfırla bitmeyen "999.996" ham sayıdır (hesaplanmış hücre) */
export function tutarOku(s: string): number | null {
  const ham = s.trim(), metin = /TL$/i.test(ham) || /\s/.test(ham);
  const t = ham.replace(/\s|TL$/gi, "");
  const binlik = /^\d{1,3}(\.\d{3})+$/.test(t) && (/\..*\./.test(t) || /0$/.test(t));
  if (!metin && !binlik && /^\d+(\.\d+)?$/.test(t)) { const n = Math.round(Number(t) * 100); return Number.isSafeInteger(n) ? n : null; }
  const p = tutarSema.safeParse(t);
  return p.success ? p.data : null;
}
/** KDV oranı: "20", "%20", "0,2" ya da yüzde biçimli hücre (0.2) → 20; boşsa null */
export function oranOku(s: string): number | null {
  const t = s.replace("%", "").replace(",", ".").trim();
  if (t === "") return null;
  const n = Number(t);
  return !Number.isFinite(n) ? NaN : n > 0 && n < 1 ? Math.round(n * 100) : n;
}
/** okunan satırlar → içe alınacak giderler; planlar: proje no → plan kimliği; bugun: ileri tarih denetimi */
export function giderSatirlari(ham: readonly (readonly string[])[], planlar: ReadonlyMap<string, string>, bugun: string): GiderExcelSatiri[] {
  const baslik = ham.length > 0 && /tarih/i.test(ham[0][0] ?? "") && /t[üu]r/i.test(ham[0][1] ?? "");
  const turAd = new Map(Object.entries(GIDER_TUR).map(([k, [ad]]) => [kucuk(ad), k as GiderTuru]));
  const l: GiderExcelSatiri[] = [];
  ham.forEach((h, i) => {
    if ((baslik && i === 0) || !h.some((x) => String(x ?? "").trim())) return;
    const c = (n: number) => String(h[n] ?? "").trim();
    const tarihYazi = c(0), turYazi = c(1), tutarYazi = c(2), oranYazi = c(3), aciklama = c(4), projeNo = c(5).toLocaleUpperCase("tr");
    const tarih = tarihOku(tarihYazi);
    const tur = turAd.get(kucuk(turYazi)) ?? (Object.hasOwn(GIDER_TUR, turYazi) ? turYazi as GiderTuru : null);
    const t0 = tutarOku(tutarYazi), tutar = t0 !== null && t0 > 0 ? t0 : null;
    const o0 = oranOku(oranYazi), oran = o0 === null ? (tur ? GIDER_TUR[tur][1] : 20) : o0;
    const plan = projeNo ? planlar.get(projeNo) ?? null : null;
    const neden = !tarih ? "Tarih geçersiz (GG.AA.YYYY)" : tarih > bugun ? "İleri tarihli, atlanır" : !tur ? "Tür bulunamadı" : !tutar ? "Tutar geçersiz"
      : tutar > GIDER_TUTAR_UST ? "Tutar çok büyük"
      : !(KDV_ORAN as readonly number[]).includes(oran) ? "KDV oranı %20, %10, %1 ya da %0" : aciklama.length > 120 ? "Açıklama en çok 120 karakter"
      : projeNo && !plan ? "Proje no bulunamadı" : "";
    l.push({ satir: i + 1, tarih, tarihYazi, tur, turYazi, tutar, tutarYazi, oran, aciklama, projeNo, plan, ok: !neden, neden });
  });
  return l;
}
export const giderSablonu = () => xlsxBayt("Giderler", [[...GIDER_SABLON], ["05.10.2026", "Yakıt", "1.250,00", "20", "Deneme açıklama", ""]]);

export interface GiderDisSatiri { no: string; tarih: string; tur: GiderTuru; tutar: number; oran: number; aciklama: string | null; isNo: string | null; personel: string | null;
  durum: GiderDurumu; odeme: string | null; belge: boolean }
const tl = (k: number) => k / 100;   // sayı hücresi (toplanır, sıralanır)
const gun = (s: string | null) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "");
export function giderExceli(l: readonly GiderDisSatiri[]): Uint8Array {
  return xlsxBayt("Giderler", [["Gider no", "Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "KDV", "KDV hariç", "Açıklama", "Proje no", "Personel", "Durum", "Ödeme tarihi", "Belge"],
    ...l.map((g) => { const k = giderKdv(g.tutar, g.oran); return [g.no, gun(g.tarih), GIDER_TUR[g.tur][0], tl(g.tutar), g.oran, tl(k.kdv), tl(k.haric), g.aciklama ?? "",
      g.isNo ?? "", g.personel ?? "", GIDER_DURUM[g.durum][0], gun(g.odeme), g.belge ? "var" : "yok"]; })]);
}
