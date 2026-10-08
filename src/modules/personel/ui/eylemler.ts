"use server";
/* PERSONEL SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve doğrulama modül işlevinde (personel.ts). İstemciden gelen kimlik / sürüm
   yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; yetkiyi değiştirmez. */
import { refresh } from "next/cache";
import { zimmetPdf } from "../../../belge/pdf";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { personelAyrildi, personelEkle, personelGeriAl, personelGuncelle, personelSil } from "../server/personel";
import { matrisKaydet } from "../../../server/yetki/matris";
import { depo } from "../../../server/dosya/depo";
import type { Sorgulayici } from "../../../server/db/kiraci";
import {
  atamaBelgeDegistir, atamaEkle, atamaKaldir, bordroKaldir, bordroOnayaGonder, bordroYukle, DosyaHatasi, ozlukBelgeDegistir, ozlukEkle, ozlukKaldir, zimmetFormuGonder,
  zimmetFormuKaldir, zimmetFormuYukle,
  type Yazma as DosyaYazma,
} from "../server/dosyalar";
import { hesapAc, hesapKapat, hesapYenidenAc, rolleriKaydet, yeniGeciciParola, type HesapSonucu } from "../../../server/kimlik/hesapYonetimi";

export interface FormDurumu { hatalar?: Record<string, string>; genel?: string; yonlendir?: string }

const ALANLAR = ["ad", "eposta", "imzaTel", "basla", "meslek", "meslekMetin", "diploma", "oda", "ekipnet"] as const;
type Oturum = NonNullable<Awaited<ReturnType<typeof istekOturumu>>>;
type Belge = { ad: string; bayt: Uint8Array };
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu kayıt siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
} as const;

export async function personelKaydetEylemi(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { yonlendir: "/giris?neden=oturum" };
  const girdi = Object.fromEntries(ALANLAR.map((k) => [k, String(form.get(k) ?? "")]));
  const id = String(form.get("id") ?? "");
  const surum = Number(form.get("surum") ?? -1);
  const r = await oturumIslemi(o, (db) => (id ? personelGuncelle(db, o, id, surum, girdi) : personelEkle(db, o, girdi)));
  if (r.durum === "tamam") return { yonlendir: `/personel/${r.id}` };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/* ── giriş hesabı (karar 33–34): yetki ve kurallar src/server/kimlik/hesapYonetimi.ts içinde ── */
export interface HesapDurumu { tamam?: boolean; parola?: string; hatalar?: Record<string, string>; genel?: string }

async function hesapIslemi(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<HesapSonucu<{ parola?: string }>>): Promise<HesapDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  /* 381: başarılı hesap işleminde sayfa SUNUCUDA yenilenir (yeni hâl eylem yanıtıyla gelir) — istemcinin ayrı router.refresh() isteği sürerken
     gelen sonraki tıklama ("Rolleri kaydet" → "Hesabı kapat") onay penceresini kaybediyordu (CI e2e hesap.spec, defalarca; 377 ile aynı yarış) */
  if (r.durum === "tamam") { refresh(); return { tamam: true, parola: r.parola }; }
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  if (r.durum === "red") return { genel: r.neden };
  return { genel: r.durum === "yetkisiz" ? SONUC.yetkisiz : SONUC.yok };
}

export async function hesapAcEylemi(personelId: string, eposta: string, roller: string[]): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapAc(db, o, personelId, { eposta, roller })));
}
export async function geciciParolaEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => yeniGeciciParola(db, o, personelId)));
}
export async function hesapKapatEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapKapat(db, o, personelId)));
}
export async function hesapYenidenAcEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapYenidenAc(db, o, personelId)));
}
export async function rolleriKaydetEylemi(personelId: string, roller: string[]): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => rolleriKaydet(db, o, personelId, roller)));
}

/* ── rol yetkileri (maket personel.html #/roller; reisim 32): yetki ve temizleme src/server/yetki/matris.ts içinde ── */
export interface MatrisDurumu { tamam?: boolean; surum?: number; genel?: string }
export async function rolYetkiKaydetEylemi(surum: number, matris: unknown): Promise<MatrisDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await oturumIslemi(o, (db) => matrisKaydet(db, o, Number(surum), matris));
  if (r.durum === "tamam" || r.durum === "degisiklik_yok") return { tamam: true, surum: r.surum };
  if (r.durum === "yetkisiz") return { genel: SONUC.yetkisiz };
  if (r.durum === "cakisma") return { genel: SONUC.cakisma };
  return { genel: "Rol yetkileri kaydedilemedi: geçersiz değer." };
}

/* ── PERSONEL DOSYASI (özlük, ekipman ataması, bordro, imzalı zimmet formu): yetki, doğrulama ve dosya denetimi personel/server/dosyalar.ts içinde.
   Kişi ve kiracı oturumdan; istemciden gelen kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm". ── */
export interface DosyaDurumu { tamam?: boolean; bildirim?: string; hatalar?: Record<string, string>; genel?: string }
const yazi = (x: FormDataEntryValue | null) => (typeof x === "string" ? x : "");
async function pdfOku(f: FormDataEntryValue | null): Promise<{ ad: string; bayt: Uint8Array } | "buyuk" | null> {
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}
async function dosyaIslemi(form: FormData, is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>, belge: { ad: string; bayt: Uint8Array } | null) => Promise<DosyaYazma>): Promise<DosyaDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const b = await pdfOku(form.get("dosya"));
  if (b === "buyuk") return { hatalar: { dosya: "PDF en çok 25 MB." } };
  try {
    const r = await is(o, b);
    return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
  } catch (h) {
    if (h instanceof DosyaHatasi) return { hatalar: { dosya: h.message } };
    throw h;
  }
}
const ISLER = {
  ozluk: (db: Sorgulayici, o: Oturum, f: FormData, b: Belge | null) =>
    ozlukEkle(db, depo(), o, o.kiraci.firmaId, yazi(f.get("personel")), { tur: yazi(f.get("tur")), aciklama: yazi(f.get("aciklama")) }, b),
  atama: (db: Sorgulayici, o: Oturum, f: FormData, b: Belge | null) =>
    atamaEkle(db, depo(), o, o.kiraci.firmaId, yazi(f.get("personel")), { tur: yazi(f.get("tur")), tarih: yazi(f.get("tarih")) }, b),
  bordro: (db: Sorgulayici, o: Oturum, f: FormData, b: Belge | null) =>
    bordroYukle(db, depo(), o, o.kiraci.firmaId, yazi(f.get("personel")), { ay: yazi(f.get("ay")), brut: yazi(f.get("brut")), net: yazi(f.get("net")), maliyet: yazi(f.get("maliyet")) }, b),
  zimmet: (db: Sorgulayici, o: Oturum, f: FormData, b: Belge | null) => zimmetFormuYukle(db, depo(), o, o.kiraci.firmaId, yazi(f.get("personel")), b),
} as const;
const DEGISTIR = { ozluk: ozlukBelgeDegistir, atama: atamaBelgeDegistir } as const;
const KALDIR = { ozluk: ozlukKaldir, atama: atamaKaldir, bordro: bordroKaldir, zimmet: zimmetFormuKaldir } as const;

/** yeni kayıt + belge: tür formdan ("ozluk" | "atama" | "bordro" | "zimmet") */
export async function personelBelgeEkleEylemi(form: FormData): Promise<DosyaDurumu> {
  const ne = yazi(form.get("ne"));
  if (!(ne in ISLER)) return { genel: SONUC.yok };
  return dosyaIslemi(form, (o, b) => oturumIslemi(o, (db) => ISLER[ne as keyof typeof ISLER](db, o, form, b)));
}
/** var olan satırın belgesini değiştir */
export async function personelBelgeDegistirEylemi(form: FormData): Promise<DosyaDurumu> {
  const ne = yazi(form.get("ne"));
  if (!(ne in DEGISTIR)) return { genel: SONUC.yok };
  return dosyaIslemi(form, async (o, b) => (b ? oturumIslemi(o, (db) => DEGISTIR[ne as keyof typeof DEGISTIR](db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), b))
    : { durum: "gecersiz", hatalar: { dosya: "PDF seçilmeli." } }));
}
/** satırı kaldır (silinmez; saklanır) */
export async function personelBelgeKaldirEylemi(ne: string, id: string, surum: number): Promise<DosyaDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  if (!(ne in KALDIR) || typeof id !== "string") return { genel: SONUC.yok };
  const r = await oturumIslemi(o, (db) => KALDIR[ne as keyof typeof KALDIR](db, o, id, Number(surum)));
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
}

/** bordroyu kişinin imzasına gönder (333 — Onaylar › Diğer belgeler); yetki ve PDF denetimi sunucuda */
export async function bordroOnayaGonderEylemi(id: string): Promise<DosyaDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  if (typeof id !== "string") return { genel: SONUC.yok };
  const r = await oturumIslemi(o, (db) => bordroOnayaGonder(db, depo(), o, o.kiraci.firmaId, id));
  return r.durum === "tamam" ? { tamam: true } : r.durum === "red" ? { genel: r.neden } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
}

/** zimmet teslim formunu kişinin imzasına gönder (344 — Onaylar › Diğer belgeler); yetki, kapsam ve PDF sunucuda */
export async function zimmetFormuGonderEylemi(personelId: string): Promise<DosyaDurumu & { bildirim?: string }> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  if (typeof personelId !== "string") return { genel: SONUC.yok };
  try {
    const r = await oturumIslemi(o, (db) => zimmetFormuGonder(db, depo(), o, o.kiraci.firmaId, personelId, zimmetPdf));
    return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { genel: Object.values(r.hatalar)[0] ?? "Gönderilemedi." } : { genel: SONUC[r.durum] };
  } catch (h) {
    if (h instanceof DosyaHatasi) return { genel: h.message };
    throw h;
  }
}

/* ── 366: Ayrıldı · ayrılışı geri al · kesin sil (karar personel.ts'te) ── */
export interface KartDurumu { tamam?: boolean; hatalar?: Record<string, string>; genel?: string }
async function kartIslemi(is: (o: Oturum) => Promise<{ durum: string; hatalar?: Record<string, string>; neden?: string }>): Promise<KartDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  if (r.durum === "tamam") return { tamam: true };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  if (r.durum === "red") return { genel: r.neden };
  return { genel: SONUC[r.durum as keyof typeof SONUC] ?? SONUC.yok };
}
export async function personelAyrildiEylemi(id: string, surum: number, tarih: string): Promise<KartDurumu> {
  return kartIslemi((o) => oturumIslemi(o, (db) => personelAyrildi(db, o, String(id), Number(surum), String(tarih))));
}
export async function personelGeriAlEylemi(id: string, surum: number): Promise<KartDurumu> {
  return kartIslemi((o) => oturumIslemi(o, (db) => personelGeriAl(db, o, String(id), Number(surum))));
}
export async function personelSilEylemi(id: string): Promise<KartDurumu> {
  return kartIslemi((o) => oturumIslemi(o, (db) => personelSil(db, o, String(id))));
}
