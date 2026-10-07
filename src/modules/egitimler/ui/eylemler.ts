"use server";
/* EĞİTİMLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, tarih ve dosya denetimi modül işlevinde (egitimler.ts). */
import { egitimPdf } from "../../../belge/pdf";
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { DosyaHatasi, egitimKaydet, egitimKaydiSil, egitimTuruKaydet, egitimTuruSil, katilimFormuGonder, sertifikaYukle, type Yazma } from "../server/egitimler";

export interface PencereDurumu { tamam?: boolean; id?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu => (r.durum === "tamam" ? { tamam: true, id: r.id } : r.durum === "gecersiz" ? { hatalar: r.hatalar }
  : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] });
const yazi = (x: unknown) => (typeof x === "string" ? x : "");
async function pdfOku(f: FormDataEntryValue | null): Promise<{ ad: string; bayt: Uint8Array } | "buyuk" | null> {
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}

export async function egitimTuruKaydetEylemi(id: string | null, surum: number, girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  return cevir(await oturumIslemi(o, (db) => egitimTuruKaydet(db, o, typeof id === "string" ? id : null, Number(surum), { ad: yazi(g.ad), tekrar: yazi(g.tekrar) })));
}

export async function egitimKaydetEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  const girdi = { personel: yazi(form.get("personel")), tur: yazi(form.get("tur")), tarih: yazi(form.get("tarih")), kurum: yazi(form.get("kurum")) };
  try {
    return cevir(await oturumIslemi(o, (db) => egitimKaydet(db, depo(), o, o.kiraci.firmaId, girdi, d)));
  } catch (h) {
    if (h instanceof DosyaHatasi) return { hatalar: { dosya: h.message } };
    throw h;
  }
}

export async function sertifikaYukleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await pdfOku(form.get("dosya"));
  if (d === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  if (!d && form.get("kaldir") !== "1") return { hatalar: { dosya: "PDF seçilmeli." } };
  return cevir(await oturumIslemi(o, (db) => sertifikaYukle(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), d)));
}

/** katılım formunu katılanın imzasına gönder (345 — Onaylar › Diğer belgeler); yetki, kayıt ve PDF sunucuda */
export async function katilimFormuGonderEylemi(kayitId: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  try {
    return cevir(await oturumIslemi(o, (db) => katilimFormuGonder(db, depo(), o, o.kiraci.firmaId, yazi(kayitId), egitimPdf)));
  } catch (h) {
    if (h instanceof DosyaHatasi) return { genel: h.message };
    throw h;
  }
}

/** 371: kullanılmamış eğitim türü / kaydı kesin silinir (yalnız yönetici; karar egitimler.ts / veritabanında) */
export async function egitimTuruSilEylemi(id: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => egitimTuruSil(db, o, yazi(id))));
}
export async function egitimKaydiSilEylemi(id: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => egitimKaydiSil(db, o, yazi(id))));
}
