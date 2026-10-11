"use server";
/* ZİMMETLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, "kimde" ve fotoğraf denetimi modül işlevinde (zimmet.ts).
   Teslim eden istemciden alınmaz (sunucu o anki "kimde"yi yazar). */
import { refresh } from "next/cache";
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { demirbasEkle, demirbasPasif, demirbasSil, FotoHatasi, teslimEt, type Yazma } from "../server/zimmet";

export interface PencereDurumu { tamam?: boolean; id?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };

export async function teslimEtEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const fotolar: { ad: string; bayt: Uint8Array }[] = [];
  for (const f of form.getAll("foto")) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > 8 << 20) return { hatalar: { foto: "Fotoğraf en çok 8 MB." } };
    fotolar.push({ ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) });
  }
  const girdi = { varlik: String(form.get("varlik") ?? ""), alan: String(form.get("alan") ?? ""), zaman: String(form.get("zaman") ?? ""), notu: String(form.get("notu") ?? "") };
  try {
    const y = cevir(await oturumIslemi(o, (db) => teslimEt(db, depo(), o, o.kiraci.firmaId, girdi, fotolar)));
    /* 486: başarıda istemci yönlendiricisi SUNUCUDA tazelenir (next/cache refresh — 377 / 381 deseni): istemcide router.push ardından router.refresh bekleyen yönlendirmeyi iptal edebiliyordu (deneme makinesinde telefon: standart yüklendi, sayfa listede kaldı) */
    if (y.tamam) refresh();
    return y;
  } catch (h) {
    if (h instanceof FotoHatasi) return { hatalar: { foto: h.message } };
    throw h;
  }
}

export async function demirbasEkleEylemi(girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  return cevir(await oturumIslemi(o, (db) => demirbasEkle(db, o, { kod: String(g.kod ?? ""), ad: String(g.ad ?? "") })));
}

/** kesin sil (362): yalnız yönetici, yalnız hiç kullanılmamış demirbaş — karar zimmet.ts / veritabanında */
export async function demirbasSilEylemi(id: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => demirbasSil(db, o, String(id)));
  return r.durum === "tamam" ? { tamam: true } : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
}

/** pasife al / etkinleştir (362): "yaz" düzeyi; zimmetteki demirbaş pasife alınmaz (sunucuda) */
export async function demirbasPasifEylemi(id: string, surum: number, pasif: boolean): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => demirbasPasif(db, o, String(id), Number(surum), pasif === true));
  return r.durum === "tamam" ? { tamam: true } : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
}
