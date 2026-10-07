"use server";
/* SÖZLEŞMELER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, kapsam ve dosya denetimi modül işlevinde (sozlesmeler.ts). */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { DosyaHatasi, imzaliYukle, isgKaldir, isgKaydet, sablonKaldir, sablonYukle, sozlesmeHazirla, sozlesmeSil, type Yazma } from "../server/sozlesmeler";

export interface PencereDurumu { tamam?: boolean; id?: string; no?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
const yazi = (x: unknown) => (typeof x === "string" ? x : "");
async function pdfOku(f: FormDataEntryValue | null): Promise<{ ad: string; bayt: Uint8Array } | "buyuk" | undefined> {
  if (!(f instanceof File) || f.size === 0) return undefined;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}

export async function sozlesmeHazirlaEylemi(girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const temiz = { musteri: yazi(g.musteri), tesisler: Array.isArray(g.tesisler) ? g.tesisler.map(yazi) : [], baslangic: yazi(g.baslangic), sure: yazi(g.sure), vade: yazi(g.vade), yenileme: yazi(g.yenileme),
    teklif: yazi(g.teklif) };
  return cevir(await oturumIslemi(o, (db) => sozlesmeHazirla(db, o, temiz)));
}

export async function imzaliYukleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  if (!d && form.get("kaldir") !== "1") return { hatalar: { dosya: "PDF seçilmeli." } };
  return cevir(await oturumIslemi(o, (db) => imzaliYukle(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), d ?? null)));
}

export async function isgKaydetEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  const id = yazi(form.get("id")) || null;
  const girdi = { tesis: yazi(form.get("tesis")), personel: yazi(form.get("personel")), no: yazi(form.get("no")), onay: yazi(form.get("onay")), bitis: yazi(form.get("bitis")) };
  const pdf = d ?? (form.get("pdfKaldir") === "1" ? null : undefined);
  try {
    return cevir(await oturumIslemi(o, (db) => isgKaydet(db, depo(), o, o.kiraci.firmaId, yazi(form.get("sozlesme")), id, Number(form.get("surum")), girdi, pdf)));
  } catch (h) {
    if (h instanceof DosyaHatasi) return { hatalar: { dosya: h.message } };
    throw h;
  }
}

export async function isgKaldirEylemi(id: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => isgKaldir(db, o, yazi(id), Number(surum))));
}

export async function sablonYukleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  if (!d) return { hatalar: { dosya: "Dosya seçilmeli." } };
  return cevir(await oturumIslemi(o, (db) => sablonYukle(db, depo(), o, o.kiraci.firmaId, d)));
}

export async function sablonKaldirEylemi(id: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => sablonKaldir(db, o, yazi(id), Number(surum))));
}

/** 369: imza bekleyen (hiç imzalanmamış) sözleşme kesin silinir — yalnız yönetici; karar sozlesmeler.ts / veritabanında */
export async function sozlesmeSilEylemi(id: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => sozlesmeSil(db, o, yazi(id))));
}
