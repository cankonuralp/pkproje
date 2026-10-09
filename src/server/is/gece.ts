/* GECE İŞLERİ (378; KOD-GECIS K5, ARKA-UC §7, 09-G1) — /api/is/gece'yi zamanlayıcı günde bir çağırır. Bu dosyada çöp temizliği (A5); saklama
   süresi işi (387) Raporlar modülünde (src/modules/raporlar/server/saklama.ts), uç ikisini sırayla koşar. Çatı (iş kaydı, firma firma, süre):
   firmalar.ts. */
import type { Havuz } from "../db/kiraci.ts";
import { copTemizle } from "../dosya/cop.ts";
import type { Depo } from "../dosya/depo.ts";
import { firmalardaKos, type IsOzeti } from "./firmalar.ts";
import { bekleyenleriGonder } from "../eposta/gonder.ts";
import { epostaSaglayicisi } from "../eposta/saglayici.ts";

export type GeceOzeti = IsOzeti<{ silinen: number; bayt: number; bagli: number; oksuz: number }>;

export const GECE_SURE = 45_000;

export async function geceIsleri(havuz: Havuz, depo: Depo, sure = GECE_SURE): Promise<GeceOzeti> {
  return firmalardaKos(havuz, "cop_temizligi", sure, { silinen: 0, bayt: 0, bagli: 0, oksuz: 0 }, async (db) => {
    const r = await copTemizle(db, depo);
    return { sayilar: { silinen: r.silinen, bayt: r.bayt, bagli: r.bagli, oksuz: r.oksuz ?? 0 }, kalan: r.kalan };
  });
}

/** 432: kuyrukta bekleyen e-postaları yeniden dener (yanıttan sonra gönderilemeyenler; firma başına en eski 50) */
export type EpostaOzeti = IsOzeti<{ gonderilen: number; bekleyen: number; hatali: number }>;
export async function epostaIsi(havuz: Havuz, sure: number): Promise<EpostaOzeti> {
  const saglayici = epostaSaglayicisi();
  return firmalardaKos(havuz, "eposta_yeniden", sure, { gonderilen: 0, bekleyen: 0, hatali: 0 }, async (db) => {
    const o = await bekleyenleriGonder(db, saglayici, { enCok: 50 });
    return { sayilar: o, kalan: false };
  });
}
