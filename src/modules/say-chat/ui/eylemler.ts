"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (523–525) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   Yetki, doğrulama ve sürüm denetimi modül işlevlerinde (server/). İstemcinin gönderdiği sürüm yalnız "hangi hâli gördüm" bilgisidir. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { sayChatAyarKaydet } from "../server/ayar";
import { anthropicCagir } from "../../../server/yz/okuma";
import { ETIKET_EN_BUYUK, etiketBirak, etiketHazirla, etiketKapat, type EtiketSonucu } from "../server/etiket";
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
