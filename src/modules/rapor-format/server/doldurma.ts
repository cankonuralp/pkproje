/* BELGE DOLDURMA KAYDI (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı,
   bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"). Bir belgenin (sözleşme, teklif, zimmet … —
   kayıt o belgenin kaydı) elle doldurulan yerlerinin değerleri: göç 0105 belge_doldurma — kayıt başına tek satır (hücre kimliği → değer), sürüm
   kilidiyle güncellenir, silinmez; hangi format sürümüyle doldurulduğu format_id. Değerler belgenin YAYINDAKİ formatının elle yerlerine göre
   denetlenir (src/belge/doldurma.ts elleDegerleriDenetle — yalnız o yerlerin kimlikleri, türüne göre biçim, tek değer en çok 2000 karakter, toplam
   200 000 bayt); yayında format yoksa belge temel formatla çizilir, doldurulacak yer yoktur ("formatsiz").
   · İkisi de YETKİSİZ: belgenin kaydını tutan modül (Sözleşmeler …) kendi yetkisini önce denetler, kaydın kimliğini kendisi verir. Kiracı RLS'te.
   · Aynı kaydın ilk doldurması firma × belge × kayıt danışma kilidiyle sıraya girer (iki ilk yazma çakışmaya düşer, tekillik hatasına değil).
   · Değerler büyük olabilir ve kişisel bilgi taşıyabilir → denetim izine değeri yazılmaz, yalnız "değişti". */
import { elleDegerleriDenetle } from "../../../belge/doldurma.ts";
import { belgeTuruMu, type BelgeTuru } from "../../../belge/katalog.ts";
import { FormatTanimi } from "../../../format/tanim.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";

const DOLDURMA = tablo({ ad: "belge_doldurma", sutunlar: ["belge", "kayit_id", "format_id", "degerler", "dolduran"], gizli: ["degerler"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* çakışma ve formatsız ayrı üyeler: çağıran durumu tek tek ayırınca (=== "cakisma", === "formatsiz") geriye "gecersiz" kalır */
export type DoldurmaSonucu =
  | { durum: "tamam"; surum: number }
  | { durum: "cakisma" }
  | { durum: "formatsiz" }
  | { durum: "gecersiz"; hatalar: Record<string, string> };

/** saklanmış değerlerden yalnız yazı olanlar (şema dışı satır boş sayılır) */
function degerleriOku(v: unknown): Record<string, string> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter((g): g is [string, string] => typeof g[1] === "string"));
}

/** kaydın elle doldurulan değerleri ve sürümü; doldurulmamışsa (ya da belge / kimlik geçersizse) null. YETKİSİZ. */
export async function belgeDoldurmasi(db: Sorgulayici, belge: BelgeTuru, kayitId: string): Promise<{ degerler: Record<string, string>; surum: number } | null> {
  if (!belgeTuruMu(belge) || typeof kayitId !== "string" || !UUID.test(kayitId)) return null;
  const r = (await db.sorgu<{ degerler: unknown; surum: number }>(
    "SELECT degerler, surum FROM belge_doldurma WHERE belge = $1 AND kayit_id = $2", [belge, kayitId])).rows[0];
  return r ? { degerler: degerleriOku(r.degerler), surum: r.surum } : null;
}

/** elle doldurulan değerleri kaydeder — istemcinin gördüğü sürümle (ilk doldurmada null). YETKİSİZ: çağıran modül kendi yetkisini önce denetler. */
export async function belgeDoldurmaKaydet(db: Sorgulayici, kim: { ad: string }, belge: BelgeTuru, kayitId: string, girdi: unknown, surum: number | null): Promise<DoldurmaSonucu> {
  if (!belgeTuruMu(belge)) return { durum: "gecersiz", hatalar: { belge: "Belge bulunamadı." } };
  if (typeof kayitId !== "string" || !UUID.test(kayitId)) return { durum: "gecersiz", hatalar: { kayit: "Kayıt bulunamadı." } };
  if (surum !== null && (!Number.isSafeInteger(surum) || surum < 0)) return { durum: "cakisma" };
  const f = (await db.sorgu<{ id: string; tanim: unknown }>(
    "SELECT id::text, tanim FROM belge_format WHERE belge = $1 AND durum = 'yayinda'", [belge])).rows[0];
  const t = f ? FormatTanimi.safeParse(f.tanim) : null;
  if (!f || !t?.success) return { durum: "formatsiz" };
  const d = elleDegerleriDenetle(t.data, girdi);
  if (!d.tamam) return { durum: "gecersiz", hatalar: d.hatalar };

  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended('belge_doldurma:' || gecerli_firma()::text || ':' || $1 || ':' || $2, 0))", [belge, kayitId]);
  const mevcut = (await db.sorgu<{ id: string }>(
    "SELECT id::text FROM belge_doldurma WHERE belge = $1 AND kayit_id = $2 FOR UPDATE", [belge, kayitId])).rows[0];
  const iz = { kim: kim.ad, ne: "belge_doldurma.kaydet", gerekce: belge };
  if (!mevcut) {
    if (surum !== null) return { durum: "cakisma" };   // istemci bir doldurma gördü — bu kayıtta yok
    const e = await ekle(db, DOLDURMA, { belge, kayit_id: kayitId, format_id: f.id, degerler: d.degerler, dolduran: kim.ad }, iz);
    return { durum: "tamam", surum: e.surum };
  }
  if (surum === null) return { durum: "cakisma" };     // istemci görmeden başkası doldurdu
  const g = await guncelle(db, DOLDURMA, mevcut.id, surum, { format_id: f.id, degerler: d.degerler, dolduran: kim.ad }, iz);
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: "cakisma" };
  return { durum: "tamam", surum: g.surum };
}
