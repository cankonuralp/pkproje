"use server";
/* BELGE FORMATI SUNUCU EYLEMLERİ (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız") — rapor formatının eylemleriyle (eylemler.ts) aynı desen: kişi ve kiracı oturumdan; yetki, doğrulama modül işlevinde
   (server/belgeler.ts). İstemciden gelen kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir. Basılı formdan şablon: PDF tarayıcıda
   okunur (pdfOku.ts), buraya okunan ızgara gelir; çeviri (basili.ts) veritabanı işleminin DIŞINDA. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { BELGE_KATALOGU, belgeTuruMu } from "../../../belge/katalog";
import { basilidanTanim } from "../basili";
import { BASILI_HAM_EN_COK } from "../server/basili";
import { basiliBelgeye, belgeTaslakAc, belgeTaslakKaydet, belgeTaslakYaz, belgeTemeleDon, belgeYayinla } from "../server/belgeler";
import { formatDegistirir } from "../server/formatlar";
import type { FormatDurumuYaniti } from "./eylemler";

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu format siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
  kilitli: "Yayınlanmış sürüm değiştirilemez.",
} as const;
const BELGE_YOK = "Belge bulunamadı.";

/** oturumdaki kişi ya da kullanıcıya söylenecek ileti */
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const metin = (x: unknown) => (typeof x === "string" ? x : "");
const surumu = (x: unknown) => (x === null || x === undefined ? null : Number(x));

/** basılı form (tarayıcıda okunan ızgara) → belgenin taslağı; uyarilar: okumanın notu ve şablona alınamayan bölümler */
export async function belgeBasilidanKurEylemi(belge: string, ham: unknown, taslakSurumu: number | null): Promise<FormatDurumuYaniti & { surum?: number }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const b = metin(belge);
  if (!belgeTuruMu(b)) return { genel: BELGE_YOK };
  if (!formatDegistirir(o)) return { genel: SONUC.yetkisiz };
  let boy = Infinity;
  try { boy = Buffer.byteLength(JSON.stringify(ham) ?? ""); } catch { boy = Infinity; }
  if (!boy) return { genel: "Form okunamadı." };
  if (boy > BASILI_HAM_EN_COK) return { genel: "Form çok büyük; sayfaları ayırıp yeniden yükleyin." };
  const ad = BELGE_KATALOGU[b].ad;
  const ceviri = basilidanTanim(ham, ad);
  if (!ceviri) return { genel: "Form şablona çevrilemedi." };
  const r = await oturumIslemi(o, (db) => belgeTaslakYaz(db, o, b, basiliBelgeye(ceviri.tanim, ad), "basılı form", surumu(taslakSurumu)));
  if (r.durum === "gecersiz") return { genel: "Form şablona çevrilemedi." };
  if (r.durum !== "tamam") return { genel: SONUC[r.durum] };
  return { tamam: true, id: r.id, surum: r.surum,
    uyarilar: [ceviri.cevap, ...(ceviri.atilan.length ? [`Şablona alınamayan bölüm: ${ceviri.atilan.join(", ")}.`] : [])].filter(Boolean) };
}

/** taslak aç: boş ya da yayındaki sürümün kopyası */
export async function belgeTaslakAcEylemi(belge: string, kaynak: "bos" | "yayindaki", taslakSurumu: number | null): Promise<FormatDurumuYaniti & { surum?: number }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const b = metin(belge);
  if (!belgeTuruMu(b)) return { genel: BELGE_YOK };
  const r = await oturumIslemi(o, (db) => belgeTaslakAc(db, o, b, metin(kaynak), surumu(taslakSurumu)));
  if (r.durum === "tamam") return { tamam: true, id: r.id, surum: r.surum };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  if (r.durum === "yok" && kaynak === "yayindaki") return { genel: "Bu belgenin yayında formatı yok." };
  return { genel: SONUC[r.durum] };
}

/** Format kurucu: taslağın tanımını kaydet — şemadan geçmeyen ya da çok büyük tanım yazılmaz; yayınlanmış sürüm değişmez */
export async function belgeTaslakKaydetEylemi(id: string, surum: number, tanim: unknown): Promise<FormatDurumuYaniti & { surum?: number }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => belgeTaslakKaydet(db, o, metin(id), Number(surum), tanim));
  if (r.durum === "tamam") return { tamam: true, id: r.id, surum: r.surum };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** taslağı yayınla — yayındaki eskiye düşer; belge bundan sonra bu formatla çizilir */
export async function belgeYayinlaEylemi(id: string, surum: number, notu: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => belgeYayinla(db, o, metin(id), Number(surum), metin(notu)));
  if (r.durum === "tamam") return { tamam: true, id: metin(id), sira: r.sira };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** temel formata dön: yayındaki sürüm eskiye düşer; belge temel formatla çizilir */
export async function belgeTemeleDonEylemi(belge: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const b = metin(belge);
  if (!belgeTuruMu(b)) return { genel: BELGE_YOK };
  const r = await oturumIslemi(o, (db) => belgeTemeleDon(db, o, b));
  if (r.durum === "tamam") return { tamam: true };
  if (r.durum === "yok") return { genel: "Bu belgenin yayında formatı yok." };
  return { genel: SONUC[r.durum] };
}
