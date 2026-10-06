/* ONAYLAR › DİĞER BELGELER (333; göç 0044; maket onaylar.html #/diger "Görüntüle · Geri gönder · Onayla ve imzala", pkproje §11 230, 264, 265):
   kişinin imzasına gönderilen belgeler (bordro, eğitim formu, zimmet formu, araç teslim tutanağı). Her kişi YALNIZ KENDİ belgelerini görür ve
   karar verir (hesabının personeli = belgenin imzalayacak kişisi) — Onaylar düzeyinden bağımsız: planlama ve muhasebe de kendi bordrosunu imzalar.
   İmza raporun son imzasıyla aynı yol: imzasız PDF'i indir → e-imza aracıyla imzala → imzalı PDF'i yükle; sunucu imzalı PDF'in ilk baytlarının
   gönderilen PDF'in kendisi olduğuna ve ekin yalnız imza taşıdığına bakar (raporlar/imza-pdf.ts). Mobil imza sonraki fazda.
   Gönderme öteki modüllerden (belge-baglanti.ts; yetki çağıranda). Veritabanı da korur: kararı yalnız imzacı verir, karar verilmiş belge değişmez. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle, kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli, hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { canDo, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { personelKartiGorur } from "../../personel/server/kart-baglanti.ts";
import { imzaliPdfGecerli } from "../../raporlar/imza-pdf.ts";
import type { BelgeDurumu, BelgeTuru } from "../sema.ts";

/** dosya modülleri: gönderilen (imzasız) PDF ve imzalı PDF — kayıt = belge */
export const BELGE_DOSYA = "belge_onay", BELGE_IMZALI = "belge_onay_imzali";
export const BELGE = tablo({ ad: "belge_onay", sutunlar: ["tur", "ad", "personel_id", "kaynak_id", "ay", "dosya", "durum", "imzali_dosya"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const IMZA_GECERSIZ = "Yüklenen PDF bu belgenin gönderilen PDF'i değil ya da imza taşımıyor.";

export interface Kisi extends YetkiHesabi { ad: string }
export interface BelgeSatiri {
  id: string; surum: number; tur: BelgeTuru; ad: string; gonderen: string; gonderildi: string;
  durum: BelgeDurumu; karar: string | null;
  /** gönderilen (imzasız) PDF ve imzalıysa imzalı PDF */
  dosya: string; imzaliDosya: string | null;
}
/** personel: hesap bir personel kaydına bağlı mı (değilse kimse ona belge gönderemez) */
export interface DigerBelgeler { personel: boolean; belgeler: BelgeSatiri[]; bekleyen: number }
export type BelgeYazma =
  | { durum: "tamam"; id: string; bildirim: string }
  | { durum: "gecersiz"; hatalar: { dosya: string } }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const iso = (d: Date | null) => (d ? d.toISOString() : null);

/** kişinin imzasına gönderilen belgeler: bekleyenler üstte, sonra en yeni (maket digerCiz) */
export async function digerBelgeler(db: Sorgulayici, kim: Kisi): Promise<DigerBelgeler> {
  const p = await hesabinPersoneli(db, kim.id);
  if (!p) return { personel: false, belgeler: [], bekleyen: 0 };
  const l = (await db.sorgu<{ id: string; surum: number; tur: BelgeTuru; ad: string; gonderen: string | null; gonderildi: Date; durum: BelgeDurumu;
    karar: Date | null; dosya: string; imzali_dosya: string | null }>(
    `SELECT id::text, surum, tur, ad, gonderen::text, gonderildi, durum, karar, dosya::text, imzali_dosya::text FROM belge_onay
     WHERE personel_id = $1 AND dosya IS NOT NULL ORDER BY (durum = 'bekliyor') DESC, gonderildi DESC LIMIT 500`, [p])).rows;
  const adlar = await hesapAdlari(db, l.map((x) => x.gonderen));
  const belgeler = l.map((x) => ({
    id: x.id, surum: x.surum, tur: x.tur, ad: x.ad, gonderen: adlar.get(x.gonderen ?? "") ?? "—", gonderildi: x.gonderildi.toISOString(),
    durum: x.durum, karar: iso(x.karar), dosya: x.dosya, imzaliDosya: x.imzali_dosya,
  }));
  return { personel: true, belgeler, bekleyen: belgeler.filter((x) => x.durum === "bekliyor").length };
}

/** imzasını bekleyen belge sayısı (sekme, ana sayfa) */
export async function bekleyenBelgeSayisi(db: Sorgulayici, kim: YetkiHesabi): Promise<number> {
  const p = await hesabinPersoneli(db, kim.id);
  if (!p) return 0;
  return Number((await db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM belge_onay WHERE personel_id = $1 AND durum = 'bekliyor' AND dosya IS NOT NULL", [p])).rows[0].n);
}

/** kendi bekleyen belgesi (yoksa / başkasınınsa null — varlığı sızmaz) */
async function kendiBelgesi(db: Sorgulayici, kim: Kisi, id: string) {
  if (!UUID.test(id)) return null;
  const p = await hesabinPersoneli(db, kim.id);
  if (!p) return null;
  return (await db.sorgu<{ id: string; surum: number; ad: string; durum: BelgeDurumu; dosya: string | null }>(
    "SELECT id::text, surum, ad, durum, dosya::text FROM belge_onay WHERE id = $1 AND personel_id = $2", [id, p])).rows[0] ?? null;
}
const KARAR_VAR: Record<BelgeDurumu, string> = { bekliyor: "", imzali: "Belge zaten imzalandı.", geri: "Belge geri gönderildi; artık imzalanmaz.",
  iptal: "Belge iptal edildi (yenisi gönderildi ya da kaynağı değişti); artık imzalanmaz." };

/** Geri gönder: yalnız imzalayacak kişi, belge beklerken (maket belge-geri) */
export async function belgeGeriGonder(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<BelgeYazma> {
  const b = await kendiBelgesi(db, kim, id);
  if (!b || !b.dosya) return { durum: "yok" };
  if (b.durum !== "bekliyor") return { durum: "red", neden: KARAR_VAR[b.durum] };
  if (!Number.isSafeInteger(surum) || surum !== b.surum) return { durum: "cakisma" };
  const g = await guncelle(db, BELGE, id, surum, { durum: "geri" }, { kim: kim.ad, ne: "belge_onay.geri", gerekce: b.ad });
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: g.durum };
  return { durum: "tamam", id, bildirim: `${b.ad} geri gönderildi.` };
}

/** Onayla ve imzala: imzalı PDF'i yükle — yalnız imzalayacak kişi, belge beklerken; imzalı PDF gönderilen PDF'in imzalanmış hâli olmalı */
export async function belgeImzaliYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number,
  dosya: { ad: string; bayt: Uint8Array } | null): Promise<BelgeYazma> {
  const b = await kendiBelgesi(db, kim, id);
  if (!b || !b.dosya) return { durum: "yok" };
  if (b.durum !== "bekliyor") return { durum: "red", neden: KARAR_VAR[b.durum] };
  if (!Number.isSafeInteger(surum) || surum !== b.surum) return { durum: "cakisma" };
  if (!dosya) return { durum: "gecersiz", hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  const ham = await kayitDosyasi(db, BELGE_DOSYA, id, b.dosya);
  if (!ham) return { durum: "red", neden: "Gönderilen PDF bulunamadı." };
  if (!imzaliPdfGecerli(await depo.oku(ham.anahtar, db), dosya.bayt)) return { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } };
  const y = await dosyaYukle(db, depo, { firmaId, modul: BELGE_IMZALI, kayitId: id, ad: `${b.ad}-imzali.pdf`, bayt: dosya.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF çok büyük (en çok 25 MB)." : IMZA_GECERSIZ } };
  const iz: Iz = { kim: kim.ad, ne: "belge_onay.imza", gerekce: b.ad };
  const g = await guncelle(db, BELGE, id, surum, { durum: "imzali", imzali_dosya: y.id }, iz);
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: g.durum };
  return { durum: "tamam", id, bildirim: `${b.ad} onaylandı ve imzalandı.` };
}

/** dosya erişimi (src/server/dosya/erisim.ts): belgenin imzacısı, gönderen, Personel'de "yaz" düzeyi; bordroda Muhasebe'yi gören; eğitim
    formunda Eğitimler'i ("gör" ve üstü), araç tutanağında Araçlar'ı ("gör" ve üstü) bütün kayıtlarıyla gören (342, 345); zimmet formunda kişinin
    kartını gören (Personel'in kart kuralı — kart "İmzalı formu aç" ile aynı; 340–345 incelemesi) */
export async function belgeDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId)) return false;
  const b = (await db.sorgu<{ personel_id: string; gonderen: string | null; tur: BelgeTuru }>(
    "SELECT personel_id::text, gonderen::text, tur FROM belge_onay WHERE id = $1", [kayitId])).rows[0];
  if (!b) return false;
  const hepsi = (m: Parameters<typeof duzey>[1]) => ["gor", "yaz"].includes(duzey(kisi, m));
  if (b.gonderen === kisi.id || duzey(kisi, 2) === "yaz" || (b.tur === "bordro" && canDo(kisi, 18, "gor"))
    || (b.tur === "egitim" && hepsi(10)) || (b.tur === "arac" && hepsi(23))) return true;
  if (b.tur === "zimmet" && (await personelKartiGorur(db, kisi, b.personel_id))) return true;
  return (await hesabinPersoneli(db, kisi.id)) === b.personel_id;
}
