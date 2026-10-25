/* E-POSTA GÖNDERİMİ (432) — kuyruktaki "bekliyor" e-postaları sağlayıcıya verir, sonucu satıra yazar: gönderildi (zamanıyla) · yeniden denenecek
   (deneme + 1, neden) · kalıcı hata ya da 5 deneme dolunca "hata". Sağlayıcı yoksa satır bekler, neden yazılır (bir kez). Çağıran: plan açma
   eylemi yanıttan sonra (sonra.ts) ve gece işi (bekleyenleri yeniden dener). Kiracı bağlamında (çağıranın işlemi); yetki ÇAĞIRANDA.
   536: gönderim firmanın ayarıyla (firma.ts: firmanın Resend anahtarı, gönderen alan adı); Kimden satırdaki gönderen kişiden (kimden.ts) —
   Kimden kurulamıyorsa (FV11: alan adı doğrulanmadı) satır bekler, nedeni yazılır, deneme sayılmaz (doğrulanınca gider).
   2026-10-25 (belge doldurma, göç 0105): EKLİ e-posta — ekin baytları tek dosya yolunun kaydından (dosya bu firmada, çöpte değil) ve depodan okunur,
   özeti kayıttakiyle aynı olmalı. Ek okunamazsa e-posta EKSİZ GİTMEZ: depo okunamadı / içerik bozuk → bekler (deneme + 1, nedeni yazılır; 5'te
   "hata"), dosya kaydı yok ya da çöpte → "hata" (nedeniyle). */
import { createHash } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { guncelle } from "../db/yazici.ts";
import { depo as ortakDepo, type Depo } from "../dosya/depo.ts";
import { EPOSTA } from "./eposta.ts";
import type { FirmaGonderimAyari } from "./firma.ts";
import { kimdenKur } from "./kimden.ts";
import { SAGLAYICI_YOK, type GonderimEki } from "./saglayici.ts";

export const EN_COK_DENEME = 5;
const IZ = { kim: "probata", ne: "eposta.gonder" };
export const EK_YOK = "E-postanın eki bulunamadı (dosya kaldırılmış); e-posta eksiz gönderilmez.";
export const EK_OKUNAMADI = "E-postanın eki depodan okunamadı; e-posta eksiz gönderilmez, yeniden denenecek.";
export const EK_BOZUK = "E-postanın eki depodaki kayıtla uyuşmuyor; e-posta eksiz gönderilmez, yeniden denenecek.";

export interface GonderimOzeti { gonderilen: number; bekleyen: number; hatali: number }

type EkOkuma = { tamam: true; ek: GonderimEki } | { tamam: false; neden: string; kalici: boolean };
/** ekin baytları: tek dosya yolunun kaydı (RLS: bu firmanın), çöpte değil; içerik depodan, özeti kayıttakiyle aynı */
async function ekOku(db: Sorgulayici, depo: Depo, dosyaId: string, ad: string): Promise<EkOkuma> {
  const d = (await db.sorgu<{ anahtar: string; sha256: string | null }>("SELECT anahtar, sha256 FROM dosya WHERE id = $1 AND cop IS NULL", [dosyaId])).rows[0];
  if (!d) return { tamam: false, neden: EK_YOK, kalici: true };
  let icerik: Uint8Array;
  try { icerik = await depo.oku(d.anahtar, db); } catch { return { tamam: false, neden: EK_OKUNAMADI, kalici: false }; }
  if (!icerik.length || (d.sha256 && createHash("sha256").update(icerik).digest("hex") !== d.sha256)) return { tamam: false, neden: EK_BOZUK, kalici: false };
  return { tamam: true, ek: { ad, icerik } };
}

/** bekleyen e-postaları gönderir: kaynak verilirse yalnız o kaydınkiler, yoksa en eski `enCok` tanesi. depo: ekin okunacağı depo (verilmezse tek
    dosya yolunun deposu — yalnız ekli satırda kurulur) */
export async function bekleyenleriGonder(db: Sorgulayici, gonderim: FirmaGonderimAyari | null,
  secim: { kaynak?: string; kaynakId?: string; enCok?: number; depo?: Depo } = {}): Promise<GonderimOzeti> {
  const o: GonderimOzeti = { gonderilen: 0, bekleyen: 0, hatali: 0 };
  const l = (await db.sorgu<{ id: string; kime: string; konu: string; govde: string; deneme: number; son_hata: string | null; surum: number;
    gonderen_ad: string | null; gonderen_eposta: string | null; ek_dosya: string | null; ek_ad: string | null }>(
    `SELECT id::text, kime, konu, govde, deneme, son_hata, surum, gonderen_ad, gonderen_eposta, ek_dosya::text, ek_ad FROM eposta WHERE durum = 'bekliyor'
       AND ($1::text IS NULL OR (kaynak = $1 AND kaynak_id = $2::uuid)) ORDER BY olustu LIMIT $3 FOR UPDATE SKIP LOCKED`,
    [secim.kaynak ?? null, secim.kaynakId ?? null, Math.min(Math.max(secim.enCok ?? 50, 1), 200)])).rows;
  let depo = secim.depo ?? null;
  for (const e of l) {
    const k = gonderim ? kimdenKur(gonderim.firma, e.gonderen_ad && e.gonderen_eposta ? { ad: e.gonderen_ad, eposta: e.gonderen_eposta } : null) : null;
    if (!gonderim || !k || !k.tamam) {
      const neden = !k || k.tamam ? SAGLAYICI_YOK : k.neden;
      if (e.son_hata !== neden) await guncelle(db, EPOSTA, e.id, e.surum, { son_hata: neden }, IZ);
      o.bekleyen++;
      continue;
    }
    /* ekli e-posta: ek okunamazsa sağlayıcıya gitmez (eksiz gönderim yok) */
    let ek: GonderimEki | null = null;
    if (e.ek_dosya || e.ek_ad) {
      const r: EkOkuma = e.ek_dosya && e.ek_ad ? await ekOku(db, depo ??= ortakDepo(), e.ek_dosya, e.ek_ad) : { tamam: false, neden: EK_YOK, kalici: true };
      if (!r.tamam) {
        const deneme = e.deneme + 1, son = r.kalici || deneme >= EN_COK_DENEME;
        await guncelle(db, EPOSTA, e.id, e.surum, { durum: son ? "hata" : "bekliyor", deneme, son_hata: r.neden }, IZ);
        if (son) o.hatali++; else o.bekleyen++;
        continue;
      }
      ek = r.ek;
    }
    const s = await gonderim.saglayici.gonder({ kimden: k.kimden, kime: e.kime, cevap: k.cevap, gizli: k.gizli, konu: e.konu, metin: e.govde, kimlik: e.id, ek });
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
