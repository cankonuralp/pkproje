/* PERSONEL ↔ MUHASEBE BAĞLANTISI (modül 18 → 2; 328 — maket muhasebe.html MV.ayMaliyet, MV.gunlukMaliyet: denetçi maliyeti ve genel gider payı).
   Muhasebe personel ve bordro tablolarına dokunmaz; buradan okur: kişiler (ad, başlama / ayrılma, denetçi mi — hesabında denetçi rolü) ve geçerli
   (kaldırılmamış) bordroların işverene maliyeti (KURUŞ). Maaşın kendisi (brüt / net) dönmez. Yetki ÇAĞIRANDA (muhasebe).
   333: Maaş bordrosu gönder — çalışan personel listesi ve Muhasebe'nin elle yüklediği bordronun Personel kartına yazılması. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { meslek } from "../sema.ts";
import { kaynakBelgesiniIptal } from "../../onaylar/server/belge-baglanti.ts";
import { DOSYA } from "./dosyalar.ts";

const BORDRO = tablo({ ad: "bordro", sutunlar: ["personel_id", "ay", "brut", "net", "maliyet", "dosya_id", "kaldirildi"] });

export interface MaliyetKisisi { id: string; ad: string; basla: string; ayrildi: string | null; denetci: boolean }
export interface MaliyetBordrosu { personelId: string; ay: string; maliyet: number }

export async function personelMaliyetleri(db: Sorgulayici): Promise<{ kisiler: MaliyetKisisi[]; bordrolar: MaliyetBordrosu[] }> {
  const kisiler = (await db.sorgu<{ id: string; ad: string; basla: string; ayrildi: string | null; denetci: boolean }>(
    `SELECT p.id::text, p.ad, p.basla::text, p.ayrildi::text,
        EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = p.firma_id AND h.personel_id = p.id AND 'denetci' = ANY (h.roller)) AS denetci
     FROM personel p ORDER BY p.ad`)).rows;
  const bordrolar = (await db.sorgu<{ personel_id: string; ay: string; maliyet: string }>(
    "SELECT personel_id::text, ay, maliyet::text FROM bordro WHERE kaldirildi IS NULL")).rows
    .map((b) => ({ personelId: b.personel_id, ay: b.ay, maliyet: Math.round(Number(b.maliyet) * 100) }));
  return { kisiler, bordrolar };
}

/* ── MAAŞ BORDROSU GÖNDER (333; maket muhasebe.html BB5, pkproje §11 265) ── */
export interface BordroKisisi { id: string; ad: string; meslek: string }
/** çalışan (etkin) personel, ada göre — Muhasebe'nin bordro gönderme listesi. Yetki ÇAĞIRANDA. */
export async function bordroKisileri(db: Sorgulayici): Promise<BordroKisisi[]> {
  const r = await db.sorgu<{ id: string; ad: string; meslek: string; meslek_metin: string | null }>(
    "SELECT id::text, ad, meslek, meslek_metin FROM personel WHERE durum = 'etkin'");
  return r.rows.map((p) => ({ id: p.id, ad: p.ad, meslek: p.meslek === "diger" ? p.meslek_metin ?? "Diğer meslek" : meslek(p.meslek)?.ad ?? "—" }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** kişilerin verilen dönemdeki şimdiki (kaldırılmamış) bordro kaydı: kişi → bordro kimliği. Yetki ÇAĞIRANDA. */
export async function donemBordrolari(db: Sorgulayici, personelIdleri: readonly string[], ay: string): Promise<Map<string, string>> {
  if (!personelIdleri.length) return new Map();
  return new Map((await db.sorgu<{ p: string; id: string }>(
    "SELECT personel_id::text AS p, id::text FROM bordro WHERE personel_id = ANY ($1::uuid[]) AND ay = $2 AND kaldirildi IS NULL", [personelIdleri, ay])).rows.map((x) => [x.p, x.id]));
}

/** Muhasebe'nin elle yüklediği bordro PDF'i kişinin Personel kartındaki bordrolarına yazılır (maket bg-gonder): dönemin bordrosu varsa yenisi
    aynı tutarlarla eklenir (eskisi kaldırılır, saklanır), yoksa son bordronun tutarlarıyla; hiç bordrosu yoksa (tutar bilinmiyor) yazılmaz → null.
    Dönen: bordro kaydının kimliği. Yetki ÇAĞIRANDA (Muhasebe "yaz"). */
export async function muhasebeBordroYaz(db: Sorgulayici, depo: Depo, kim: { id: string; ad: string }, firmaId: string, personelId: string, ay: string,
  pdf: { ad: string; bayt: Uint8Array }): Promise<string | null> {
  const kaynak = (await db.sorgu<{ id: string; ay: string; surum: number; brut: string; net: string; maliyet: string }>(
    `SELECT id::text, ay, surum, brut::text, net::text, maliyet::text FROM bordro WHERE personel_id = $1 AND kaldirildi IS NULL
     ORDER BY (ay = $2) DESC, ay DESC LIMIT 1 FOR UPDATE`, [personelId, ay])).rows[0];
  if (!kaynak) return null;
  const iz = { kim: kim.ad, ne: "bordro.muhasebe", gerekce: `${ay} bordrosu imzaya gönderildi` };
  if (kaynak.ay === ay) {
    await guncelle(db, BORDRO, kaynak.id, kaynak.surum, { kaldirildi: new Date().toISOString() }, { ...iz, ne: "bordro.kaldir", gerekce: "aynı dönemin yenisi yüklendi" });
    await kaynakBelgesiniIptal(db, kim, kaynak.id);
  }
  const r = await ekle(db, BORDRO, { personel_id: personelId, ay, brut: kaynak.brut, net: kaynak.net, maliyet: kaynak.maliyet }, iz);
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.bordro, kayitId: r.id, ad: pdf.ad, bayt: pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new Error(`bordro dosyası yüklenemedi: ${y.neden}`);
  const g = await guncelle(db, BORDRO, r.id, r.surum, { dosya_id: y.id }, { ...iz, ne: "bordro.belge" });
  if (g.durum !== "tamam") throw new Error("bordro dosyası bağlanamadı");
  return r.id;
}
