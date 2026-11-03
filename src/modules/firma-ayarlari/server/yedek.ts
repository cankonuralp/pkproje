/* FİRMA AYARLARI › YEDEK (2026-11-03; sunum K1–K6 kabul) — firmanın kendi Google Drive / OneDrive hesabını bağlar, keser, "Şimdi yedekle". Yetki:
   Firma ayarları "yaz" (başlangıçta firma yöneticisi — sunum K5 "bağlayan ve kesen yalnız firma yöneticisi"). İş çekirdekte (src/server/yedek/):
   bağlantı, kuyruk, gönderim, aylık arşiv. Ana klasör ve klasör düzeni ayarın "bulut" bölümünde; bağlıyken değişmez (gönderilenlerin yeri dağılmasın). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ayarYaz } from "../../../server/ayar/ayar.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { baglanBaslat, baglantiKes, yedekSorunu } from "../../../server/yedek/baglan.ts";
import { baglantiOku } from "../../../server/yedek/kayit.ts";
import { BulutGirdisi } from "../sema.ts";
import { ayarlarYazar, type Kisi } from "./ayarlar.ts";

export type YedekYazma = { durum: "tamam"; bildirim: string; adres?: string } | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yetkisiz" };
const HIZMET = { gdrive: "Google Drive", onedrive: "OneDrive" } as const;

/** hesabı bağla: ana klasör ve düzen kaydedilir, izin ekranının adresi döner (tarayıcı oraya gider) */
export async function bulutBagla(db: Sorgulayici, kim: Kisi, kisaAd: string, surum: number, girdi: unknown): Promise<YedekYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(BulutGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const s = g.veri.saglayici;
  if (!s) return { durum: "gecersiz", hatalar: { saglayici: "Hizmet seçin." } };
  const b = await baglantiOku(db);
  if (b && (b.durum === "bagli" || b.durum === "dolu")) return { durum: "red", neden: `${HIZMET[b.saglayici]} zaten bağlı. Önce bağlantıyı kesin.` };
  const w = await ayarYaz(db, "bulut", surum, g.veri, { kim: kim.ad, ne: "firma_ayar.bulut" });
  if (w.durum === "cakisma") return { durum: "cakisma" };
  if (w.durum === "gecersiz") return { durum: "gecersiz", hatalar: w.hatalar ?? {} };
  const r = await baglanBaslat(db, { saglayici: s, hesapId: kim.id, kisaAd });
  if (!r) return { durum: "red", neden: `${HIZMET[s]} bağlantısı henüz açılmadı.` };
  return { durum: "tamam", bildirim: `${HIZMET[s]} izin ekranı açılıyor.`, adres: r.adres };
}

export async function bulutKes(db: Sorgulayici, kim: Kisi): Promise<YedekYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const b = await baglantiOku(db);
  if (!(await baglantiKes(db, kim.ad)) || !b) return { durum: "red", neden: "Bağlı hesap yok." };
  return { durum: "tamam", bildirim: `${HIZMET[b.saglayici]} bağlantısı kesildi; gönderilen dosyalar hesapta kalır.` };
}

/** "Şimdi yedekle": yalnız denetim (gönderimi eylem yanıttan sonra başlatır) */
export async function simdiYedekle(db: Sorgulayici, kim: Kisi): Promise<YedekYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const b = await baglantiOku(db);
  if (!b || b.durum === "kesildi") return { durum: "red", neden: "Bağlı hesap yok." };
  if (b.durum === "kopuk") return { durum: "red", neden: "Bağlantı koptu; önce yeniden bağlayın." };
  return { durum: "tamam", bildirim: "Yedekleme başladı." };
}

/** yan menü balonu: yedek gönderilemiyor (bağlantı koptu / hesap dolu) — yalnız ayarı değiştirebilene */
export async function yedekTakibi(db: Sorgulayici, kim: Kisi): Promise<boolean> {
  return ayarlarYazar(kim) && (await yedekSorunu(db));
}
