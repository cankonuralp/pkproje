/* ONAYLAR ↔ GÖNDEREN MODÜLLER (333): Personel (bordro "Onaya gönder"; 344: zimmet teslim formu "İmzaya gönder" — kaynak zimmet_formu kaydı),
   Muhasebe ("Maaş bordrosu gönder"), Araçlar (342: teslim tutanağı, teslim alan kişinin imzasına — kaynak zimmet hareketi), ana sayfa — belge_onay tablosuna
   yalnız buradan yazılır / okunur. YETKİ ÇAĞIRANDA (gönderme hakkı belgenin kaynağına göre değişir: bordroda Personel "yaz" ya da Muhasebe "yaz").
   Gönderen ve zaman veritabanında damgalanır (0044). Gönderilen PDF imzalanabilir biçimde olmalı (imzalı hâli denetlenebilsin — imza-pdf.ts
   imzayaUygun); belge kendi dosyasını taşır (kaynağın dosyası değişse de imzalanan bayt değişmez).
   333 incelemesi: bordro belgesinin durumu DÖNEME değil KAYNAK bordro kaydına bağlı — aynı dönemin bordrosu yeniden yüklenince eski bordronun
   bekleyen belgesi iptal olur, yeni bordro yeniden gönderilir; kişi × dönem işlemleri danışma kilidiyle sıraya girer (eşzamanlı gönderim). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { SINIR, turBul } from "../../../server/dosya/tur.ts";
import { imzayaUygun } from "../../raporlar/imza-pdf.ts";
import { belgeEtkin, type BelgeDurumu, type BelgeTuru } from "../sema.ts";
import { BELGE, BELGE_DOSYA } from "./belgeler.ts";

export { bekleyenBelgeSayisi } from "./belgeler.ts";

export interface GonderilecekBelge {
  tur: BelgeTuru; ad: string; personelId: string; kaynakId: string | null; ay: string | null;
  pdf: { ad: string; bayt: Uint8Array };
}
/** uygunsuz: PDF değil, çok büyük ya da imzalanabilir biçimde değil · zaten: kaynağın (kaynaksızsa kişi × dönemin) etkin belgesi var */
export type GonderSonucu = { durum: "tamam"; id: string } | { durum: "uygunsuz"; neden: string } | { durum: "zaten" };

export const PDF_UYGUNSUZ = "Bu PDF e-imzaya uygun biçimde değil; belgeyi programından yeniden PDF olarak kaydedip yükleyin.";

/** kişi × dönem bordro işlemleri sıraya girer (işlem sonuna kadar; aynı işlemde yeniden alınabilir) */
export async function bordroKilidi(db: Sorgulayici, personelId: string, ay: string): Promise<void> {
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`bordro:${personelId}:${ay}`]);
}

/** gönderilecek PDF'in ön denetimi (yazmadan önce; toplu gönderimde hepsi önce denetlenir) */
export function belgePdfDenetle(bayt: Uint8Array): string | null {
  if (!bayt.length || turBul(bayt, ["pdf"]) !== "pdf") return "Dosya PDF değil ya da bozuk.";
  if (bayt.length > SINIR.pdf) return "PDF en çok 25 MB.";
  return imzayaUygun(bayt) ? null : PDF_UYGUNSUZ;
}

/** belgeyi kişinin imzasına gönder: kayıt → kendi dosyası → bağ (aynı işlemde; dosyasız belge veritabanında kalamaz) */
export async function belgeGonder(db: Sorgulayici, depo: Depo, kim: { id: string; ad: string }, firmaId: string, b: GonderilecekBelge): Promise<GonderSonucu> {
  const h = belgePdfDenetle(b.pdf.bayt);
  if (h) return { durum: "uygunsuz", neden: h };
  if (b.tur === "bordro" && b.ay) {
    await bordroKilidi(db, b.personelId, b.ay);
    const l = await bordroBelgeleri(db, [b.personelId], [b.ay]);
    if (belgeEtkin(guncelBordroBelgesi(l, b.personelId, b.ay, b.kaynakId)?.durum)) return { durum: "zaten" };
  }
  const iz = { kim: kim.ad, ne: "belge_onay.gonder", gerekce: b.ad };
  const r = await ekle(db, BELGE, { tur: b.tur, ad: b.ad, personel_id: b.personelId, kaynak_id: b.kaynakId, ay: b.ay }, iz);
  const y = await dosyaYukle(db, depo, { firmaId, modul: BELGE_DOSYA, kayitId: r.id, ad: b.pdf.ad, bayt: b.pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  /* ön denetimden geçen PDF'in yüklenememesi beklenmez: işlem düşer, yarım belge kalmaz */
  if (!y.tamam) throw new Error(`belge dosyası yüklenemedi: ${y.neden}`);
  const g = await guncelle(db, BELGE, r.id, r.surum, { dosya: y.id }, iz);
  if (g.durum !== "tamam") throw new Error("belge dosyası bağlanamadı");
  return { durum: "tamam", id: r.id };
}

export interface BordroBelgesi { id: string; personelId: string; ay: string; kaynakId: string | null; durum: BelgeDurumu; karar: string | null }
/** kişilerin bordro belgeleri (verilen dönemlerde), gönderim sırasıyla (eski önce) */
export async function bordroBelgeleri(db: Sorgulayici, personelIdleri: readonly string[], aylar?: readonly string[]): Promise<BordroBelgesi[]> {
  if (!personelIdleri.length) return [];
  return (await db.sorgu<{ id: string; personel_id: string; ay: string; kaynak_id: string | null; durum: BelgeDurumu; karar: Date | null }>(
    `SELECT id::text, personel_id::text, ay, kaynak_id::text, durum, karar FROM belge_onay
     WHERE tur = 'bordro' AND dosya IS NOT NULL AND personel_id = ANY ($1::uuid[]) AND ($2::text[] IS NULL OR ay = ANY ($2::text[]))
     ORDER BY gonderildi`, [personelIdleri, aylar ?? null])).rows
    .map((x) => ({ id: x.id, personelId: x.personel_id, ay: x.ay, kaynakId: x.kaynak_id, durum: x.durum, karar: x.karar ? x.karar.toISOString() : null }));
}
/** kişi × dönemin şimdiki bordrosunun belgesi: kaynağı verilen bordro (yoksa kaynaksız belge); etkin olan, yoksa en son gönderilen */
export function guncelBordroBelgesi(l: readonly BordroBelgesi[], personelId: string, ay: string, kaynakId: string | null): BordroBelgesi | null {
  const k = l.filter((x) => x.personelId === personelId && x.ay === ay && x.kaynakId === kaynakId);
  return k.find((x) => belgeEtkin(x.durum)) ?? k.at(-1) ?? null;
}

export interface KaynakBelgesi { ad: string; durum: BelgeDurumu; imzaliDosya: string | null; karar: string | null }
/** kaynakların belgesi (342 araç tutanağı, 344 zimmet formu): kaynak başına etkin belge (bekliyor / imzalı), yoksa en son gönderilen. İmzalıysa
    imzalı PDF'in kimliği (dosya erişimi belgeDosyasiGorulur: imzacı, gönderen, Personel "yaz"). Yetki ÇAĞIRANDA (kaynağı göremeyen kimliğini veremez). */
export async function kaynakBelgeleri(db: Sorgulayici, kaynakIdleri: readonly string[]): Promise<Map<string, KaynakBelgesi>> {
  const m = new Map<string, KaynakBelgesi>();
  if (!kaynakIdleri.length) return m;
  for (const x of (await db.sorgu<{ kaynak_id: string; ad: string; durum: BelgeDurumu; imzali_dosya: string | null; karar: Date | null }>(
    "SELECT kaynak_id::text, ad, durum, imzali_dosya::text, karar FROM belge_onay WHERE dosya IS NOT NULL AND kaynak_id = ANY ($1::uuid[]) ORDER BY gonderildi",
    [kaynakIdleri])).rows) {
    if (!belgeEtkin(m.get(x.kaynak_id)?.durum)) m.set(x.kaynak_id, { ad: x.ad, durum: x.durum, imzaliDosya: x.imzali_dosya, karar: x.karar?.toISOString() ?? null });
  }
  return m;
}
/** kaynakların yalnız belge durumu (araç tutanağı listesi) */
export async function kaynakBelgeDurumlari(db: Sorgulayici, kaynakIdleri: readonly string[]): Promise<Map<string, BelgeDurumu>> {
  return new Map([...(await kaynakBelgeleri(db, kaynakIdleri))].map(([k, v]) => [k, v.durum]));
}

/** kaynağı (bordro) değişen ya da kaldırılan kaydın BEKLEYEN belgesi iptal olur — kişi eski PDF'i imzalamasın. Dönen: iptal edilen sayı. Yetki ÇAĞIRANDA. */
export async function kaynakBelgesiniIptal(db: Sorgulayici, kim: { ad: string }, kaynakId: string): Promise<number> {
  let n = 0;
  for (const x of (await db.sorgu<{ id: string; surum: number; ad: string }>(
    "SELECT id::text, surum, ad FROM belge_onay WHERE kaynak_id = $1 AND durum = 'bekliyor'", [kaynakId])).rows) {
    const g = await guncelle(db, BELGE, x.id, x.surum, { durum: "iptal" }, { kim: kim.ad, ne: "belge_onay.iptal", gerekce: `${x.ad} — kaynağı değişti` });
    if (g.durum === "tamam") n++;
  }
  return n;
}
