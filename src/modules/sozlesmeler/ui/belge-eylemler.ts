"use server";
/* SÖZLEŞME BELGESİ SUNUCU EYLEMLERİ (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir
   olmalı, bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim") — elle doldurulan yerleri kaydet ve
   müşteriye gönder. Kişi ve kiracı oturumdan; yetki, doğrulama ve PDF seçimi modül işlevinde (sozlesmeler.ts). PDF başsız Chromium'la basılır: bu dosya
   yalnız sözleşme sayfasında (/sozlesmeler/[id] — maxDuration 60, next.config.ts PDF listesi); öteki Sözleşmeler sayfaları ./eylemler.ts'i kullanır.
   Kuyruğa yazılan e-postalar yanıttan sonra gönderilir (src/server/eposta/sonra.ts). */
import { sozlesmePdf } from "../../../belge/pdf";
import { depo } from "../../../server/dosya/depo";
import { epostalariSonraGonder } from "../../../server/eposta/sonra";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { DosyaHatasi, sozlesmeDoldur, sozlesmeGonder, type Yazma } from "../server/sozlesmeler";
import type { PencereDurumu } from "./eylemler";

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, adet: r.adet } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
const yazi = (x: unknown) => (typeof x === "string" ? x : "");

/** elle doldurulan yerler (hücre kimliği → değer); surum: görülen doldurma sürümü, hiç doldurulmamışsa null */
export async function sozlesmeDoldurEylemi(id: string, degerler: unknown, surum: number | null): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const s = surum === null || surum === undefined ? null : Number(surum);
  return cevir(await oturumIslemi(o, (db) => sozlesmeDoldur(db, o, yazi(id), degerler, s)));
}

/** sözleşme PDF'i ekli e-posta (alıcı başına); gönderen tuşa basan */
export async function sozlesmeGonderEylemi(id: string, kime: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const liste = Array.isArray(kime) ? kime.slice(0, 20).map(yazi) : [];
  try {
    const r = await oturumIslemi(o, (db) => sozlesmeGonder(db, depo(), o, o.kiraci.firmaId, yazi(id), { kime: liste }, sozlesmePdf));
    if (r.durum === "tamam" && r.adet) epostalariSonraGonder(o.kiraci, "sozlesme", r.id);
    return cevir(r);
  } catch (h) {
    if (h instanceof DosyaHatasi) return { genel: h.message };
    throw h;
  }
}
