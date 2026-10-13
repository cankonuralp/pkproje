"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (523–525) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   Yetki, doğrulama ve sürüm denetimi modül işlevlerinde (server/). İstemcinin gönderdiği sürüm yalnız "hangi hâli gördüm" bilgisidir. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { sayChatAyarKaydet } from "../server/ayar";
import { anthropicCagir } from "../../../server/yz/okuma";
import { ETIKET_EN_BUYUK, etiketBirak, etiketHazirla, etiketKapat, type EtiketSonucu } from "../server/etiket";
import { chatRaporYaz, type KayitRaporSonucu } from "../server/rapor-yaz";
import { depo } from "../../../server/dosya/depo";
import { alanOkuBirak, alanOkuHazirla, alanOkuKullanimYaz } from "../../raporlar/server/alan-oku";
import { fotoOkuBirak, fotoOkuHazirla, fotoOkuKullanimYaz } from "../../raporlar/server/foto-oku";
import { raporOneriYaz } from "../../raporlar/server/oneri";
import type { TanimHatasi } from "../sema";

export type AyarKaydetSonucu = { durum: "tamam"; surum: number; ayni: boolean } | { durum: "hata"; hata: TanimHatasi } | { durum: "red"; neden: string };

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "S.A.Y Chat ayarları siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Ekipman türü bulunamadı.",
} as const;

async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

/** 523: Ekipman türleri › tür sayfası › S.A.Y Chat ayarları › Kaydet */
export async function chatAyarKaydetEylemi(turId: unknown, surum: unknown, girdi: unknown): Promise<AyarKaydetSonucu> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  if (typeof turId !== "string" || (surum !== null && !Number.isSafeInteger(surum))) return { durum: "red", neden: SONUC.yok };
  const r = await oturumIslemi(o, (db) => sayChatAyarKaydet(db, o, turId, surum as number | null, girdi));
  if (r.durum === "tamam" || r.durum === "degisiklik_yok") return { durum: "tamam", surum: r.surum, ayni: r.durum === "degisiklik_yok" };
  if (r.durum === "hata") return r;
  return { durum: "red", neden: SONUC[r.durum] };
}

/** 524: etiketten okuma (m.11) — fotoğraf + kaydın satır adları; okunanlar ekrana öneri olarak döner (kayda yazılmaz). Çağrı işlemin DIŞINDA. */
export async function chatEtiketOkuEylemi(form: FormData): Promise<EtiketSonucu> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  const f = form.get("foto");
  if (!(f instanceof File)) return { durum: "red", neden: "Etiket fotoğrafı seçin." };
  if (f.size > ETIKET_EN_BUYUK) return { durum: "red", neden: "Fotoğraf çok büyük (en çok 5 MB)." };
  let satirlar: unknown = null;
  try { satirlar = JSON.parse(String(form.get("satirlar") ?? "null")); } catch { satirlar = null; }
  const bayt = new Uint8Array(await f.arrayBuffer()), plan = String(form.get("plan") ?? "");
  const h = await oturumIslemi(o, (db) => etiketHazirla(db, o, plan, satirlar, bayt));
  if (h.durum !== "hazir") return h;
  const y = await anthropicCagir(h.istek, h.anahtar);
  if (y.durum === "hata") {
    await oturumIslemi(o, (db) => etiketBirak(db, h, y.ucret));
    return { durum: "red", neden: y.neden };
  }
  return oturumIslemi(o, (db) => etiketKapat(db, h, y.govde));
}

/** 525: bekleyen bir kaydın rapor taslağı (kendi işleminde; ekran kayıtları SIRAYLA gönderir — her istek kısa sürer) */
export async function chatRaporYazEylemi(planId: unknown, kayit: unknown, kod: unknown): Promise<KayitRaporSonucu> {
  const o = await oturum();
  const k = typeof kayit === "string" ? kayit : "";
  if (typeof o === "string") return { kayit: k, durum: "hata", neden: o };
  if (typeof planId !== "string") return { kayit: k, durum: "hata", neden: "Plan bulunamadı." };
  return oturumIslemi(o, (db) => chatRaporYaz(db, depo(), o, o.kiraci.firmaId, planId, { kayit: k, kod: typeof kod === "string" ? kod : null }));
}

/** 525: açılan raporun okuma fotoğrafını yapay zekâ okur (m.7) — okunanlar raporda bekler, rapor açılınca boş alanlara girer (542); çağrı işlemin DIŞINDA. Yetki, fotoğrafın
    o raporun o bölümündeki okuma fotoğrafı olması ve kota raporun okuma işlevlerinde. Dönen: okunan sayısı (okunamadıysa 0). */
export async function chatOkutEylemi(raporId: unknown, okuma: unknown): Promise<number> {
  const o = await oturum();
  const x = (okuma ?? {}) as { bolum?: unknown; dosya?: unknown; tur?: unknown };
  if (typeof o === "string" || typeof raporId !== "string" || typeof x.bolum !== "string" || typeof x.dosya !== "string") return 0;
  const d = depo(), bolum = x.bolum, kaynak = { dosya: x.dosya };
  if (x.tur === "tablo") {
    const h = await oturumIslemi(o, (db) => fotoOkuHazirla(db, d, o, raporId, bolum, kaynak));
    if (h.durum !== "hazir") return 0;
    const y = await anthropicCagir(h.istek, h.anahtar);
    if (y.durum === "hata") { await oturumIslemi(o, (db) => fotoOkuBirak(db, h, y.ucret)); return 0; }
    const k = await oturumIslemi(o, (db) => fotoOkuKullanimYaz(db, raporId, h, y.govde));
    if (!k.satirlar.length) return 0;
    await oturumIslemi(o, (db) => raporOneriYaz(db, o, raporId, bolum, "tablo", k.satirlar));
    return k.satirlar.length;
  }
  const h = await oturumIslemi(o, (db) => alanOkuHazirla(db, d, o, raporId, bolum, kaynak));
  if (h.durum !== "hazir") return 0;
  const y = await anthropicCagir(h.istek, h.anahtar);
  if (y.durum === "hata") { await oturumIslemi(o, (db) => alanOkuBirak(db, h, y.ucret)); return 0; }
  const k = await oturumIslemi(o, (db) => alanOkuKullanimYaz(db, raporId, h, y.govde));
  if (!k.okunan.length) return 0;
  await oturumIslemi(o, (db) => raporOneriYaz(db, o, raporId, bolum, "alan", k.okunan));
  return k.okunan.length;
}
