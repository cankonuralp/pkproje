/* BASILI FORMDAN ŞABLON — sunucu (2026-10-23; reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim
   istiyorum", "sürüm 2 ne işe yarıyor orda o zaman yüklemem ne işe yaradı"). Türün basılı format PDF'inden formatın tamamı kurulur ve türün TASLAĞI
   olur; kurucuda düzenlenir, Yayınla ile geçer (yayındaki sürüm değişmez).
   2026-10-24 YAPAY ZEKÂSIZ (reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?", "en baştan beri bunu istedim"):
   PDF tarayıcıda kendi içeriğinden okunur (ui/pdfOku.ts: pdf-sayfa.ts → pdf-izgara.ts); buraya okunan ızgara (BASILI ham — pdf-tipler.ts) gelir.
   İstemciden geldiği için VERİDİR: çeviricide (basili.ts basilidanTanim) parça parça denetlenir, tanım şemadan geçer; taslak istemcinin gördüğü
   taslak sürümüyle yazılır (görmediğini ezmez). Yapay zekâ ayırması, anahtar, maliyet yok.
   2026-10-24 (denetim): iki kısa işlem — basiliHazirla (yetki, tür, basılı format sürümü türde yüklü ve kaldırılmamış mı) ve basiliYaz (taslak);
   çeviri ARADA, veritabanı işleminin DIŞINDA (eylem: ui/eylemler.ts basilidanKurEylemi) — işlemci işi bağlantıyı açık tutmaz (işlemde boşta
   bekleme sınırı). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { basiliSurumVar, standartlariTureBagla, turOzeti } from "../../ekipman-turleri/server/turler.ts";
import { metindenStandartlar } from "../../dokumanlar/eslestir.ts";
import type { BasiliCeviri } from "../basili.ts";
import { formatDegistirir, taslakYaz, type Kisi } from "./formatlar.ts";

/** okunan ızgaranın (JSON) en çok boyu — eylem bunun üstünü reddeder */
export const BASILI_HAM_EN_COK = 2 * 1024 * 1024;

export type BasiliHazirlik = { durum: "hazir"; turAd: string } | { durum: "red"; neden: string };
export type BasiliSonucu = { durum: "tamam"; id: string; cevap: string; atilan: string[] } | { durum: "red"; neden: string } | { durum: "cakisma" };

const red = (neden: string): { durum: "red"; neden: string } => ({ durum: "red", neden });

/** 2026-10-26 (reisim: "verilen formatta yazanlara göre standart ekleme", "kütüphanede yok ise el ile ekleme yöntemi ile eklenecek otomatik
    olarak"): basılı formun yazılarında geçen standartlar türün kontrol metoduna bağlanır (Ekipman türleri'nin işlevi; kütüphanede olmayan elle
    eklenir). Dönen: yeni bağlanan numaralar. Şablon kurulduktan sonra, aynı işlemde. */
export async function basiliStandartlari(db: Sorgulayici, kim: Kisi, turId: string, ham: unknown): Promise<string[]> {
  const metinler: string[] = [];
  const topla = (x: unknown, derin: number) => {
    if (derin > 40 || metinler.length > 20_000) return;
    if (typeof x === "string") { if (/\d/.test(x)) metinler.push(x); return; }
    if (Array.isArray(x)) { for (const y of x) topla(y, derin + 1); return; }
    if (x && typeof x === "object") for (const y of Object.values(x)) topla(y, derin + 1);
  };
  topla(ham, 0);
  return standartlariTureBagla(db, kim, turId, metindenStandartlar(metinler));
}

/** çeviriden önce: yetki, tür ve sira (okunan basılı format PDF'inin sürümü) türün yüklü, kaldırılmamış sürümlerinden biri mi */
export async function basiliHazirla(db: Sorgulayici, kim: Kisi, turId: string, sira: number): Promise<BasiliHazirlik> {
  if (!formatDegistirir(kim)) return red("Bu işlem için yetkiniz yok.");
  if (!Number.isSafeInteger(sira) || sira < 1) return red("Basılı format sürümü geçersiz.");
  const tur = await turOzeti(db, turId);
  if (!tur) return red("Ekipman türü bulunamadı.");
  if (!(await basiliSurumVar(db, tur.id, sira))) return red("Basılı format sürümü bulunamadı.");
  return { durum: "hazir", turAd: tur.ad };
}

/** çevrilmiş tanım → türün taslağı (kaynağı notunda: basılı format sürümü) */
export async function basiliYaz(db: Sorgulayici, kim: Kisi, turId: string, sira: number, ceviri: BasiliCeviri, taslakSurumu: number | null): Promise<BasiliSonucu> {
  if (!formatDegistirir(kim)) return red("Bu işlem için yetkiniz yok.");
  const y = await taslakYaz(db, kim, turId, ceviri.tanim, `basılı format sürüm ${sira}`, taslakSurumu);
  if (y.durum === "tamam") return { durum: "tamam", id: y.id, cevap: ceviri.cevap, atilan: ceviri.atilan };
  if (y.durum === "cakisma") return { durum: "cakisma" };
  return red(y.durum === "yetkisiz" ? "Bu işlem için yetkiniz yok." : y.durum === "yok" ? "Ekipman türü bulunamadı." : "Form şablona çevrilemedi.");
}
