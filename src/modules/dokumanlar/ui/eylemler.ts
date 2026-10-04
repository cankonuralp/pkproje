"use server";
/* DÖKÜMANLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, sürüm ve dosya denetimi modül işlevinde (dokumanlar.ts). */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { dokumanKaldir, dokumanKaydet, DosyaHatasi, standartKaldir, standartYukle, type Yazma } from "../server/dokumanlar";

export interface PencereDurumu { tamam?: boolean; id?: string; guncel?: string | null; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma & { guncel?: string | null }): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id, guncel: r.guncel } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
const yazi = (x: unknown) => (typeof x === "string" ? x : "");
async function pdfOku(f: FormDataEntryValue | null): Promise<{ ad: string; bayt: Uint8Array } | "buyuk" | null> {
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}
async function dosyali(is: () => Promise<PencereDurumu>): Promise<PencereDurumu> {
  try { return await is(); } catch (h) { if (h instanceof DosyaHatasi) return { hatalar: { dosya: h.message } }; throw h; }
}

export async function standartYukleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  const girdi = { no: yazi(form.get("no")), surum: yazi(form.get("surum")), konu: yazi(form.get("konu")) };
  return dosyali(async () => cevir(await oturumIslemi(o, (db) => standartYukle(db, depo(), o, o.kiraci.firmaId, girdi, d))));
}

export async function standartKaldirEylemi(id: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => standartKaldir(db, o, yazi(id), Number(surum))));
}

export async function dokumanKaydetEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  const id = yazi(form.get("id")) || null;
  const girdi = { ad: yazi(form.get("ad")), tur: yazi(form.get("tur")), kod: yazi(form.get("kod")), rev: yazi(form.get("rev")) };
  return dosyali(async () => cevir(await oturumIslemi(o, (db) => dokumanKaydet(db, depo(), o, o.kiraci.firmaId, id, Number(form.get("surum") ?? 0), girdi, d))));
}

export async function dokumanKaldirEylemi(id: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => dokumanKaldir(db, o, yazi(id), Number(surum))));
}
