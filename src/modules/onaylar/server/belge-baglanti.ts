/* ONAYLAR ↔ GÖNDEREN MODÜLLER (333): Personel (bordro "Onaya gönder"), Muhasebe ("Maaş bordrosu gönder"), ana sayfa — belge_onay tablosuna
   yalnız buradan yazılır / okunur. YETKİ ÇAĞIRANDA (gönderme hakkı belgenin kaynağına göre değişir: bordroda Personel "yaz" ya da Muhasebe "yaz").
   Gönderen ve zaman veritabanında damgalanır (0044). Gönderilen PDF imzalanabilir biçimde olmalı (imzalı hâli denetlenebilsin — imza-pdf.ts
   imzayaUygun); belge kendi dosyasını taşır (kaynağın dosyası değişse de imzalanan bayt değişmez). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { SINIR, turBul } from "../../../server/dosya/tur.ts";
import { imzayaUygun } from "../../raporlar/imza-pdf.ts";
import type { BelgeDurumu, BelgeTuru } from "../sema.ts";
import { BELGE, BELGE_DOSYA } from "./belgeler.ts";

export { bekleyenBelgeSayisi } from "./belgeler.ts";

export interface GonderilecekBelge {
  tur: BelgeTuru; ad: string; personelId: string; kaynakId: string | null; ay: string | null;
  pdf: { ad: string; bayt: Uint8Array };
}
/** uygunsuz: PDF değil, çok büyük ya da imzalanabilir biçimde değil · zaten: aynı kişinin aynı dönem bordrosu gönderilmiş (geri gönderilen sayılmaz) */
export type GonderSonucu = { durum: "tamam"; id: string } | { durum: "uygunsuz"; neden: string } | { durum: "zaten" };

export const PDF_UYGUNSUZ = "Bu PDF e-imzaya uygun biçimde değil; belgeyi programından yeniden PDF olarak kaydedip yükleyin.";

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
  if (b.tur === "bordro" && b.ay && (await db.sorgu(
    "SELECT 1 FROM belge_onay WHERE tur = 'bordro' AND personel_id = $1 AND ay = $2 AND durum <> 'geri'", [b.personelId, b.ay])).rowCount) return { durum: "zaten" };
  const iz = { kim: kim.ad, ne: "belge_onay.gonder", gerekce: b.ad };
  const r = await ekle(db, BELGE, { tur: b.tur, ad: b.ad, personel_id: b.personelId, kaynak_id: b.kaynakId, ay: b.ay }, iz);
  const y = await dosyaYukle(db, depo, { firmaId, modul: BELGE_DOSYA, kayitId: r.id, ad: b.pdf.ad, bayt: b.pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  /* ön denetimden geçen PDF'in yüklenememesi beklenmez: işlem düşer, yarım belge kalmaz */
  if (!y.tamam) throw new Error(`belge dosyası yüklenemedi: ${y.neden}`);
  const g = await guncelle(db, BELGE, r.id, r.surum, { dosya: y.id }, iz);
  if (g.durum !== "tamam") throw new Error("belge dosyası bağlanamadı");
  return { durum: "tamam", id: r.id };
}

export interface BordroBelgesi { id: string; durum: BelgeDurumu; karar: string | null }
/** kişi × dönem bordro belgeleri: her (kişi, dönem) için etkin olan (bekliyor / imzalı), yoksa en son geri gönderilen. Anahtar "personelId|ay". */
export async function bordroBelgeleri(db: Sorgulayici, personelIdleri: readonly string[], aylar?: readonly string[]): Promise<Map<string, BordroBelgesi>> {
  const m = new Map<string, BordroBelgesi>();
  if (!personelIdleri.length) return m;
  const r = await db.sorgu<{ id: string; personel_id: string; ay: string; durum: BelgeDurumu; karar: Date | null }>(
    `SELECT id::text, personel_id::text, ay, durum, karar FROM belge_onay
     WHERE tur = 'bordro' AND dosya IS NOT NULL AND personel_id = ANY ($1::uuid[]) AND ($2::text[] IS NULL OR ay = ANY ($2::text[]))
     ORDER BY (durum <> 'geri'), gonderildi`, [personelIdleri, aylar ?? null]);
  /* sıra: geri gönderilenler önce, etkin olan sonra → sonuncu kazanır */
  for (const x of r.rows) m.set(`${x.personel_id}|${x.ay}`, { id: x.id, durum: x.durum, karar: x.karar ? x.karar.toISOString() : null });
  return m;
}
