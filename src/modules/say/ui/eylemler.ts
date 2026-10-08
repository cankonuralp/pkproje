"use server";
/* S.A.Y SUNUCU EYLEMLERİ (380) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   İstemciden gelen yalnız soru metni, hızlı sorunun adı ve bulunulan sayfanın adresi (yer adı sunucuda modül kaydından çıkarılır — kayıt bilgisi
   taşımaz). Yapay zekâ çağrısı veritabanı işleminin dışında. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { anthropicCagir } from "../../../server/yz/okuma";
import type { SohbetIletisi } from "../../../server/yz/sohbet";
import { sayBirak, sayDurumu, sayGecmisi, sayHizli, saySorHazirla, saySorKaydet, sayTemizle, type SayDurum, type SayYaniti } from "../server/say";

const RED: SayYaniti = { durum: "red", neden: "Oturumunuz kapandı. Sayfayı yenileyip yeniden giriş yapın." };
const yolAl = (v: unknown) => (typeof v === "string" && v.startsWith("/") && v.length <= 300 ? v : "/");

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayDurumu(db)) : null;
}

export async function sayGecmisEylemi(): Promise<SohbetIletisi[]> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayGecmisi(db)) : [];
}

export async function sayHizliEylemi(hizli: unknown, yol: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  if (hizli !== "bekleyen" && hizli !== "sayfa") return { durum: "red", neden: "Bilinmeyen soru." };
  return oturumIslemi(o, (db) => sayHizli(db, o, hizli, yolAl(yol)));
}

export async function saySorEylemi(soru: unknown, yol: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  if (typeof soru !== "string") return { durum: "red", neden: "Sorunuzu yazın." };
  const h = await oturumIslemi(o, (db) => saySorHazirla(db, o, soru, yolAl(yol)));
  if (h.durum !== "hazir") return h;
  const y = await anthropicCagir(h.istek, h.anahtar);
  if (y.durum === "hata") {
    await oturumIslemi(o, (db) => sayBirak(db, h, y.ucret));
    return { durum: "red", neden: y.neden };
  }
  return oturumIslemi(o, (db) => saySorKaydet(db, h, y.govde));
}

export async function sayTemizleEylemi(): Promise<{ durum: "tamam"; silinen: number } | { durum: "red"; neden: string }> {
  const o = await oturum();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı." };
  return { durum: "tamam", silinen: await oturumIslemi(o, (db) => sayTemizle(db)) };
}
