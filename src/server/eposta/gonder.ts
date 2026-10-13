/* E-POSTA GÖNDERİMİ (432) — kuyruktaki "bekliyor" e-postaları sağlayıcıya verir, sonucu satıra yazar: gönderildi (zamanıyla) · yeniden denenecek
   (deneme + 1, neden) · kalıcı hata ya da 5 deneme dolunca "hata". Sağlayıcı yoksa satır bekler, neden yazılır (bir kez). Çağıran: plan açma
   eylemi yanıttan sonra (sonra.ts) ve gece işi (bekleyenleri yeniden dener). Kiracı bağlamında (çağıranın işlemi); yetki ÇAĞIRANDA.
   536: gönderim firmanın ayarıyla (firma.ts: firmanın Resend anahtarı, gönderen alan adı); Kimden satırdaki gönderen kişiden (kimden.ts) —
   Kimden kurulamıyorsa (Rapor e-postası alan adında değil) satır bekler, nedeni yazılır, deneme sayılmaz (ayar düzelince gider). */
import type { Sorgulayici } from "../db/kiraci.ts";
import { guncelle } from "../db/yazici.ts";
import { EPOSTA } from "./eposta.ts";
import type { FirmaGonderimAyari } from "./firma.ts";
import { kimdenKur } from "./kimden.ts";
import { SAGLAYICI_YOK } from "./saglayici.ts";

export const EN_COK_DENEME = 5;
const IZ = { kim: "probata", ne: "eposta.gonder" };

export interface GonderimOzeti { gonderilen: number; bekleyen: number; hatali: number }

/** bekleyen e-postaları gönderir: kaynak verilirse yalnız o kaydınkiler, yoksa en eski `enCok` tanesi */
export async function bekleyenleriGonder(db: Sorgulayici, gonderim: FirmaGonderimAyari | null, secim: { kaynak?: string; kaynakId?: string; enCok?: number } = {}): Promise<GonderimOzeti> {
  const o: GonderimOzeti = { gonderilen: 0, bekleyen: 0, hatali: 0 };
  const l = (await db.sorgu<{ id: string; kime: string; konu: string; govde: string; deneme: number; son_hata: string | null; surum: number;
    gonderen_ad: string | null; gonderen_eposta: string | null }>(
    `SELECT id::text, kime, konu, govde, deneme, son_hata, surum, gonderen_ad, gonderen_eposta FROM eposta WHERE durum = 'bekliyor'
       AND ($1::text IS NULL OR (kaynak = $1 AND kaynak_id = $2::uuid)) ORDER BY olustu LIMIT $3 FOR UPDATE SKIP LOCKED`,
    [secim.kaynak ?? null, secim.kaynakId ?? null, Math.min(Math.max(secim.enCok ?? 50, 1), 200)])).rows;
  for (const e of l) {
    const k = gonderim ? kimdenKur(gonderim.firma, e.gonderen_ad && e.gonderen_eposta ? { ad: e.gonderen_ad, eposta: e.gonderen_eposta } : null) : null;
    if (!gonderim || !k || !k.tamam) {
      const neden = !k || k.tamam ? SAGLAYICI_YOK : k.neden;
      if (e.son_hata !== neden) await guncelle(db, EPOSTA, e.id, e.surum, { son_hata: neden }, IZ);
      o.bekleyen++;
      continue;
    }
    const s = await gonderim.saglayici.gonder({ kimden: k.kimden, kime: e.kime, cevap: k.cevap, gizli: k.gizli, konu: e.konu, metin: e.govde });
    if (s.tamam) {
      await guncelle(db, EPOSTA, e.id, e.surum, { durum: "gonderildi", gonderildi: new Date(), deneme: e.deneme + 1, son_hata: null }, IZ);
      o.gonderilen++;
      continue;
    }
    const deneme = e.deneme + 1, son = s.kalici || deneme >= EN_COK_DENEME;
    await guncelle(db, EPOSTA, e.id, e.surum, { durum: son ? "hata" : "bekliyor", deneme, son_hata: s.neden.slice(0, 300) }, IZ);
    if (son) o.hatali++; else o.bekleyen++;
  }
  return o;
}
