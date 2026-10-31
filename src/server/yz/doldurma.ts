/* S.A.Y BELGE DOLDURMA (2026-10-31; reisim: "önerdiklerini kabul ediyorum" — kapsam tablosunun "belge doldurma" eksiği). Firmanın belge formatındaki
   elle doldurulan yerler (sözleşme, teklif, zimmet, araç tutanağı, eğitim katılımı, izin / masraf, fatura özeti, ön bilgilendirme, saha formu) S.A.Y'da
   her modülün "<belge>_doldur" işlemiyle yazılır: işlem modülün ekrandaki iki işlevini aynı kişiyle çağırır (doldurma verisi → yetki ve yerler;
   doldur → kayıt). Bu dosya ikisinin arasındaki ortak adım, SAF:
   · değer verilmezse yerleri listeler — ad, tür, zorunlu, seçenekler, DOLU MU (değerin kendisi modele gitmez: kişisel veri kuralı);
   · anahtar yerin kimliği ya da adı (büyük / küçük harf ayrımsız); tanınmayan ad yazmadan söylenir;
   · yeni değerler mevcutların ÜSTÜNE eklenir (S.A.Y değerleri görmeden yalnız istenen yeri yazar), sürüm okunan kayıttan. */
import { elleAlanlari } from "../../belge/doldurma.ts";
import type { FormatTanimi } from "../../format/tanim.ts";
import { yazmaCevabi, type IslemCevabi } from "./islem.ts";

export interface DoldurmaPaneli { tanim: FormatTanimi; degerler: Readonly<Record<string, string>>; surum: number | null }
export const DOLDURMA_YOK = "Bu belgenin yayındaki formatında elle doldurulan yer yok ya da bu kaydın belgesini doldurma yetkiniz yok.";
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");

/** yerleri listele ya da yazılacak değerleri hazırla */
export function doldurmaHazirla(p: DoldurmaPaneli | null, istek: Readonly<Record<string, string>> | undefined):
  { cevap: IslemCevabi } | { degerler: Record<string, string>; surum: number | null } {
  if (!p) return { cevap: { tamam: false, neden: DOLDURMA_YOK } };
  const alanlar = elleAlanlari(p.tanim);
  if (!alanlar.length) return { cevap: { tamam: false, neden: DOLDURMA_YOK } };
  const liste = alanlar.map((a) => ({
    yer: a.id, ad: a.ad, tur: a.alan, ...(a.zorunlu ? { zorunlu: true } : {}), ...(a.secenekler?.length ? { secenekler: a.secenekler } : {}),
    ...(a.birim ? { birim: a.birim } : {}), dolu: !!p.degerler[a.id]?.trim(),
  }));
  const girdiler = Object.entries(istek ?? {});
  if (!girdiler.length) return { cevap: { tamam: true, degisiklik: false, sonuc: { yerler: liste } } };
  const kimlikle = new Map(alanlar.map((a) => [a.id, a.id]));
  const adla = new Map<string, string | null>();
  for (const a of alanlar) adla.set(kucuk(a.ad), adla.has(kucuk(a.ad)) ? null : a.id);   // aynı adlı iki yer: ad yetmez, kimlik gerekir
  const degerler: Record<string, string> = { ...p.degerler };
  const tanimsiz: string[] = [];
  for (const [k, v] of girdiler) {
    const id = kimlikle.get(k) ?? adla.get(kucuk(k));
    if (!id) { tanimsiz.push(k); continue; }
    if (v.trim()) degerler[id] = v; else delete degerler[id];
  }
  if (tanimsiz.length) {
    return { cevap: { tamam: false, neden: `Belgede bu yer yok ya da aynı adlı birden çok yer var (kimliğiyle ver): ${tanimsiz.slice(0, 20).join(", ")}. Hiçbir şey yazılmadı.`,
      eksikler: liste.map((a) => `${a.yer}: ${a.ad}`).slice(0, 60) } };
  }
  return { degerler, surum: p.surum };
}

/** modülün doldurma sonucu → cevap (formatsız ve çakışma ekrandaki iletiyle aynı anlamda) */
export function doldurmaCevabi(r: { durum: string } & Record<string, unknown>, ad: string): IslemCevabi {
  if (r.durum === "formatsiz") return { tamam: false, neden: `${ad} için yayında format yok; doldurulacak yer yok.` };
  if (r.durum === "cakisma") return { tamam: false, neden: `${ad} bu arada başkası tarafından dolduruldu; işlemi yeniden çağır.` };
  return yazmaCevabi(r, { bildirim: `${ad}: elle doldurulan yerler kaydedildi.` });
}
