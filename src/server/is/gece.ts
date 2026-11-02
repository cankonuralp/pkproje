/* GECE İŞLERİ (378; KOD-GECIS K5, ARKA-UC §7, 09-G1) — /api/is/gece'yi zamanlayıcı günde bir çağırır. Bu dosyada çöp temizliği (A5); saklama
   süresi işi (387) Raporlar modülünde (src/modules/raporlar/server/saklama.ts), uç ikisini sırayla koşar. Çatı (iş kaydı, firma firma, süre):
   firmalar.ts. FV6: her işin son parametresi havuzBul — firmanın adımı kendi havuzunda (gece ucu firma-havuzu.ts firmaHavuzuKimlikle verir). */
import type { Havuz } from "../db/kiraci.ts";
import { copTemizle } from "../dosya/cop.ts";
import type { Depo } from "../dosya/depo.ts";
import { firmalardaKos, type HavuzBul, type IsOzeti } from "./firmalar.ts";
import { firmaGonderimi } from "../eposta/firma.ts";
import { bekleyenleriGonder } from "../eposta/gonder.ts";
import { sirKullan } from "../ayar/sir.ts";
import { anthropicDosyaSil } from "../yz/akis.ts";
import { kapanisFirma, silinecekDosyalar, silinecekDosyaSil } from "../yz/konusma.ts";

/** 2026-11-02 (göç 0116 — reisim: "kullanıcı açsa da açmasa da 60 dakika geçince silinsin"): 60 dakikayı geçmiş, bitmiş S.A.Y konuşmaları kapanır (asıl
    süpürme veritabanında pg_cron ile 10 dakikada bir; burası pg_cron olmayan ortamın yedeği) ve kapanan konuşmaların hizmetteki ek dosyaları silinir */
export type KapanisOzeti = IsOzeti<{ kapanan: number; dosya: number }>;
export async function sayKapanisIsi(havuz: Havuz, sure: number, havuzBul?: HavuzBul): Promise<KapanisOzeti> {
  return firmalardaKos(havuz, "say_kapanis", sure, { kapanan: 0, dosya: 0 }, async (db) => {
    const kapanan = await kapanisFirma(db, 60);
    const l = await silinecekDosyalar(db);
    let dosya = 0;
    if (l.length) {
      const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
      if (anahtar) {
        for (const d of l) { await anthropicDosyaSil(d.dosya, anahtar); dosya++; }
        await silinecekDosyaSil(db, l.map((d) => d.id));
      }
    }
    return { sayilar: { kapanan, dosya }, kalan: l.length >= 200 };
  }, havuzBul);
}

export type GeceOzeti = IsOzeti<{ silinen: number; bayt: number; bagli: number; oksuz: number }>;

export const GECE_SURE = 45_000;

export async function geceIsleri(havuz: Havuz, depo: Depo, sure = GECE_SURE, havuzBul?: HavuzBul): Promise<GeceOzeti> {
  return firmalardaKos(havuz, "cop_temizligi", sure, { silinen: 0, bayt: 0, bagli: 0, oksuz: 0 }, async (db) => {
    const r = await copTemizle(db, depo);
    return { sayilar: { silinen: r.silinen, bayt: r.bayt, bagli: r.bagli, oksuz: r.oksuz ?? 0 }, kalan: r.kalan };
  }, havuzBul);
}

/** 432: kuyrukta bekleyen e-postaları yeniden dener (yanıttan sonra gönderilemeyenler; firma başına en eski 50) — 536: firmanın kendi gönderim ayarıyla */
export type EpostaOzeti = IsOzeti<{ gonderilen: number; bekleyen: number; hatali: number }>;
export async function epostaIsi(havuz: Havuz, sure: number, havuzBul?: HavuzBul): Promise<EpostaOzeti> {
  return firmalardaKos(havuz, "eposta_yeniden", sure, { gonderilen: 0, bekleyen: 0, hatali: 0 }, async (db) => {
    const o = await bekleyenleriGonder(db, await firmaGonderimi(db), { enCok: 50 });
    return { sayilar: o, kalan: false };
  }, havuzBul);
}

/** 568: veritabanı deposundaki eski nesneleri Supabase Storage'a taşır (firma başına en eski 100 nesne / 40 MB; geri okunup özeti tutan silinir —
    depo_nesne_tasindi). Depo taşımıyorsa (klasör, veritabanı) iş koşmaz: null. */
export type TasimaOzeti = IsOzeti<{ tasinan: number; bayt: number; hatali: number }>;
export async function depoTasimaIsi(havuz: Havuz, depo: Depo, sure: number, havuzBul?: HavuzBul): Promise<TasimaOzeti | null> {
  const tasi = depo.tasi;
  if (!tasi) return null;
  return firmalardaKos(havuz, "depo_tasima", sure, { tasinan: 0, bayt: 0, hatali: 0 }, async (db) => {
    const r = await tasi(db, { adet: 100, bayt: 40 * 1024 * 1024 });
    return { sayilar: { tasinan: r.tasinan, bayt: r.bayt, hatali: r.hatali }, kalan: r.kalan };
  }, havuzBul);
}
