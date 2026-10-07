/* SÖZLEŞMELER — modülün dışa açılan işlevleri (maket sozlesmeler.html; modül 12, M5 + M13 2. tur). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 12): "gör" ve üstü bütün sözleşmeleri görür; DEĞİŞTİRMEK (sözleşme hazırla, imzalı PDF, İSG-KATİP ID,
   şablon) yalnız "yaz" düzeyinde (önerilen düzende planlama + firma yöneticisi). "Kendi" düzeyi (denetçi) yalnız kendi İSG-KATİP ID'si olan
   sözleşmeleri ve o sözleşmede yalnız kendi ID'lerini görür. Uyarı YALNIZ İSG-KATİP için (reisim 2026-09-26); açık plana bağlı uyarılar
   (ID eksik, geç onay, plan günü bitişten sonra) Planlar kaleminde. Yazmalar güvenli yazıcıdan; dosyalar tek dosya yolundan (yalnız PDF).
   Silme yok: kullanılmamış İSG-KATİP ID'si KALDIRILIR (kayıt kalır), kullanılmış yalnız düzeltilir. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import { kabulTeklifleri, teklifNumaralari } from "../../teklifler/server/sozlesme-baglanti.ts";
import { bitisHesapla, IsgGirdisi, SozlesmeGirdisi, sozlesmeDurumu, type SozlesmeDurumu } from "../sema.ts";

const MODUL = 12;
export const DOSYA = { sozlesme: "is_sozlesmesi", isg: "isg_katip", sablon: "sozlesme_sablon" } as const;
const SOZ = tablo({ ad: "is_sozlesmesi", sutunlar: ["no", "musteri_id", "baslangic", "bitis", "vade", "yenileme", "musteri_imza", "imzali_dosya", "teklif_id"] });
const KAPSAM = tablo({ ad: "is_sozlesmesi_tesis", sutunlar: ["sozlesme_id", "tesis_id"] });
const ISG = tablo({ ad: "isg_katip", sutunlar: ["tesis_id", "personel_id", "no", "onay", "bitis", "dosya_id", "onceki", "kaldirildi", "kullanildi"] });
const SABLON = tablo({ ad: "sozlesme_sablon", sutunlar: ["surum_no", "dosya_id", "kaldirildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface IsgSatiri { id: string; tesisId: string; personelId: string; personel: string; no: string; onay: string | null; bitis: string | null; dosyaId: string | null;
  kullanildi: string | null; surum: number; bitti: boolean }
export interface KapsamTesisi { id: string; ad: string; il: string | null; ilce: string | null; sgk: string | null; isg: IsgSatiri[] }
/** teklif: dayanak teklif (326; yoksa sistem öncesi) */
export interface SozlesmeSatiri {
  id: string; no: string; musteriId: string; musteri: string; tesisler: string[]; baslangic: string; bitis: string; durum: SozlesmeDurumu; kalan: number;
  yenileme: "yok" | "otomatik"; isgSayisi: number; isgKisileri: string[]; teklif: { id: string; no: string } | null;
}
export interface SozlesmeKarti extends SozlesmeSatiri {
  surum: number; unvan: string; vd: string | null; vno: string | null; firma: string; vade: number; firmaImza: string; musteriImza: string | null;
  imzaliDosya: string | null; kapsam: KapsamTesisi[]; olustu: string;
}
export interface SablonSatiri { id: string; surumNo: number; dosyaId: string; olustu: string; surum: number }

export type Yazma =
  | { durum: "tamam"; id: string; no?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const sozlesmeDegistirir = degistirir;
export const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;

/** "kendi" düzeyinde kişinin personel kimliği (yoksa boş dize); "gör" ve üstünde null; "yok" / "brans" kapalı */
async function kendiKisi(db: Sorgulayici, kim: YetkiHesabi): Promise<string | null | false> {
  const d = duzey(kim, MODUL);
  if (d === "yok" || d === "brans") return false;
  return d === "kendi" ? ((await hesabinPersoneli(db, kim.id)) ?? "") : null;
}

type SozDb = { id: string; no: string; musteri_id: string; baslangic: string; bitis: string; vade: number; yenileme: "yok" | "otomatik"; firma_imza: string;
  musteri_imza: string | null; imzali_dosya: string | null; teklif_id: string | null; surum: number; olustu: Date };
type IsgDb = { id: string; tesis_id: string; personel_id: string; no: string; onay: string | null; bitis: string | null; dosya_id: string | null; kullanildi: string | null; surum: number };

async function durum(db: Sorgulayici) {
  const sozlesmeler = (await db.sorgu<SozDb>(
    `SELECT id::text, no, musteri_id::text, baslangic::text, bitis::text, vade, yenileme, firma_imza::text, musteri_imza::text, imzali_dosya::text,
        teklif_id::text, surum, olustu FROM is_sozlesmesi`)).rows;
  const kapsam = (await db.sorgu<{ sozlesme_id: string; tesis_id: string }>("SELECT sozlesme_id::text, tesis_id::text FROM is_sozlesmesi_tesis")).rows;
  const isg = (await db.sorgu<IsgDb>(
    `SELECT id::text, tesis_id::text, personel_id::text, no, onay::text, bitis::text, dosya_id::text, kullanildi::text, surum FROM isg_katip
      WHERE NOT onceki AND kaldirildi IS NULL ORDER BY olustu`)).rows;
  const musteriler = await musteriOzetleri(db);
  const kisiler = await personelSecenekleri(db);
  const teklifNo = await teklifNumaralari(db, sozlesmeler.map((x) => x.teklif_id).filter((x): x is string => !!x));
  return { sozlesmeler, kapsam, isg, musteriler, kisiler, teklifNo };
}
type Durum = Awaited<ReturnType<typeof durum>>;

function isgSatiri(s: Durum, r: IsgDb, bugun: string): IsgSatiri {
  return { id: r.id, tesisId: r.tesis_id, personelId: r.personel_id, personel: s.kisiler.find((k) => k.id === r.personel_id)?.ad ?? "Ayrılan personel",
    no: r.no, onay: r.onay, bitis: r.bitis, dosyaId: r.dosya_id, kullanildi: r.kullanildi, surum: r.surum, bitti: !!r.bitis && r.bitis < bugun };
}

function satir(s: Durum, x: SozDb, bugun: string, ben: string | null): SozlesmeSatiri {
  const m = s.musteriler.find((y) => y.id === x.musteri_id);
  const tesisIdleri = s.kapsam.filter((k) => k.sozlesme_id === x.id).map((k) => k.tesis_id);
  const tesisler = m?.tesisler.filter((t) => tesisIdleri.includes(t.id)) ?? [];
  const isg = s.isg.filter((r) => tesisIdleri.includes(r.tesis_id) && (ben === null || r.personel_id === ben));
  return {
    id: x.id, no: x.no, musteriId: x.musteri_id, musteri: m?.kisa ?? "—", tesisler: tesisler.map((t) => t.ad), baslangic: x.baslangic, bitis: x.bitis,
    durum: sozlesmeDurumu(x.musteri_imza, x.bitis, bugun), kalan: gunFarki(bugun, x.bitis), yenileme: x.yenileme, isgSayisi: isg.length,
    isgKisileri: [...new Set(isg.map((r) => isgSatiri(s, r, bugun).personel))],
    teklif: x.teklif_id ? { id: x.teklif_id, no: s.teklifNo.get(x.teklif_id) ?? "—" } : null,
  };
}

export async function sozlesmeListesi(db: Sorgulayici, kim: Kisi): Promise<SozlesmeSatiri[] | null> {
  const k = await kendiKisi(db, kim);
  if (k === false) return duzey(kim, MODUL) === "yok" ? null : [];
  const s = await durum(db), bugun = bugunTr();
  return s.sozlesmeler.map((x) => satir(s, x, bugun, k)).filter((x) => k === null || x.isgSayisi > 0)
    .sort((a, b) => (a.baslangic < b.baslangic ? 1 : a.baslangic > b.baslangic ? -1 : b.no.localeCompare(a.no)));
}

export async function sozlesmeKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<SozlesmeKarti | null> {
  if (!UUID.test(id)) return null;
  const k = await kendiKisi(db, kim);
  if (k === false) return null;
  const s = await durum(db), bugun = bugunTr();
  const x = s.sozlesmeler.find((y) => y.id === id);
  if (!x) return null;
  const v = satir(s, x, bugun, k);
  if (k !== null && v.isgSayisi === 0) return null;
  const m = s.musteriler.find((y) => y.id === x.musteri_id);
  const tesisIdleri = s.kapsam.filter((y) => y.sozlesme_id === id).map((y) => y.tesis_id);
  const firma = (await db.sorgu<{ ad: string }>("SELECT ad FROM firma WHERE id = gecerli_firma()")).rows[0]?.ad ?? "";
  return {
    ...v, surum: x.surum, unvan: m?.unvan ?? "—", vd: m?.vd ?? null, vno: m?.vno ?? null, firma, vade: x.vade, firmaImza: x.firma_imza, musteriImza: x.musteri_imza,
    imzaliDosya: k === null ? x.imzali_dosya : null, olustu: x.olustu.toISOString(),
    kapsam: (m?.tesisler ?? []).filter((t) => tesisIdleri.includes(t.id)).map((t) => ({
      id: t.id, ad: t.ad, il: t.il, ilce: t.ilce, sgk: t.sgk,
      isg: s.isg.filter((r) => r.tesis_id === t.id && (k === null || r.personel_id === k)).map((r) => isgSatiri(s, r, bugun)).sort((a, b) => a.personel.localeCompare(b.personel, "tr")),
    })),
  };
}

/** form için: müşteriler + tesisleri (pasifler hariç), müşterilerin kabul edilmiş teklifleri (Dayanak teklif — 326) ve denetçi seçimi için
    çalışan personel; yalnız "yaz" */
export async function sozlesmeSecenekleri(db: Sorgulayici, kim: Kisi) {
  if (!degistirir(kim)) return null;
  const m = await musteriOzetleri(db);
  return {
    musteriler: m.filter((x) => !x.pasif).map((x) => ({ id: x.id, kisa: x.kisa, unvan: x.unvan, tesisler: x.tesisler.filter((t) => !t.pasif).map((t) => ({ id: t.id, ad: t.ad, il: t.il, ilce: t.ilce })) })),
    teklifler: (await kabulTeklifleri(db)).map((t) => ({ id: t.id, no: t.no, musteri: t.musteriId, tarih: t.tarih, tesisler: t.tesisler })),
    kisiler: (await personelSecenekleri(db)).map(({ id, ad }) => ({ id, ad })),
  };
}

/** Muhasebe için (327; maket MV.tesisSozlesmesi): tesisin verilen günde geçerli iş sözleşmesi (kapsamında, başlangıç ≤ gün ≤ bitiş; birden çoksa en
    son başlayan) — ödeme vadesi buradan; yoksa null. Yetki ÇAĞIRANDA. */
export async function tesisSozlesmesi(db: Sorgulayici, tesisId: string, gun: string): Promise<{ id: string; no: string; vade: number } | null> {
  if (!UUID.test(tesisId) || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return null;
  return (await db.sorgu<{ id: string; no: string; vade: number }>(
    `SELECT s.id::text, s.no, s.vade FROM is_sozlesmesi s JOIN is_sozlesmesi_tesis k ON k.firma_id = s.firma_id AND k.sozlesme_id = s.id
     WHERE k.tesis_id = $1 AND s.baslangic <= $2::date AND s.bitis >= $2::date ORDER BY s.baslangic DESC, s.no DESC LIMIT 1`, [tesisId, gun])).rows[0] ?? null;
}

/** öteki modüller için (Muhasebe fatura sayfası — 324–327 incelemesi: modül başka modülün tablosuna dokunmaz): sözleşme kimliği → numara. Yetki ÇAĞIRANDA. */
export async function sozlesmeNumaralari(db: Sorgulayici, idler: readonly string[]): Promise<Map<string, string>> {
  const l = [...new Set(idler.filter((x) => UUID.test(x)))];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ id: string; no: string }>("SELECT id::text, no FROM is_sozlesmesi WHERE id = ANY ($1::uuid[])", [l])).rows.map((x) => [x.id, x.no]));
}

/** sözleşme hazırla: numara (IS-AAYY-SIRA) işlem içinde; tesisler müşterinin, etkin tesisleri olmalı; firma imzası bugün, müşteri imzası bekler */
export async function sozlesmeHazirla(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(SozlesmeGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const m = (await musteriOzetleri(db)).find((x) => x.id === v.musteri && !x.pasif);
  if (!m) return { durum: "gecersiz", hatalar: { musteri: "Müşteri seçilmeli." } };
  if (v.tesisler.some((t) => !m.tesisler.some((y) => y.id === t && !y.pasif))) return { durum: "gecersiz", hatalar: { tesisler: "Tesisler bu müşterinin olmalı." } };
  /* dayanak teklif: aynı müşterinin kabul edilmiş teklifi (veritabanı da denetler — 0038) */
  if (v.teklif && !(await kabulTeklifleri(db, v.teklif)).some((t) => t.musteriId === v.musteri)) {
    return { durum: "gecersiz", hatalar: { teklif: "Teklif bu müşterinin kabul edilmiş teklifi olmalı." } };
  }
  const no = await numaraAl(db, "sozlesme", { simdi: new Date(`${v.baslangic}T12:00:00+03:00`) });
  const r = await ekle(db, SOZ, { no, musteri_id: v.musteri, baslangic: v.baslangic, bitis: bitisHesapla(v.baslangic, v.sure), vade: v.vade, yenileme: v.yenileme,
    teklif_id: v.teklif }, { kim: kim.ad, ne: "sozlesme.hazirla" });
  for (const t of v.tesisler) await ekle(db, KAPSAM, { sozlesme_id: r.id, tesis_id: t }, { kim: kim.ad, ne: "sozlesme.kapsam" });
  return { durum: "tamam", id: r.id, no };
}

/** imzalı sözleşme PDF'i: yükleyince müşteri imzası bugün ve yürürlükte; yeniden yükleme değiştirir; boş dosya = kaldır (imza bekliyor durumuna döner) */
export async function imzaliYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, dosya: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM is_sozlesmesi WHERE id = $1", [id])).rowCount) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  let dosyaId: string | null = null;
  if (dosya) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.sozlesme, kayitId: id, ad: dosya.ad, bayt: dosya.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk." } };
    dosyaId = y.id;
  }
  const r = await guncelle(db, SOZ, id, surum, { imzali_dosya: dosyaId, musteri_imza: dosyaId ? bugunTr() : null },
    { kim: kim.ad, ne: dosyaId ? "sozlesme.imzali_yukle" : "sozlesme.imzali_kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** İSG-KATİP ID ekle (id boş) ya da düzelt. Tesis sözleşmenin kapsamında olmalı; aynı tesis × denetçide geçerli kayıt varsa eskisi "önceki" olur. */
export async function isgKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, sozlesmeId: string, id: string | null, surum: number, girdi: unknown,
  pdf?: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(sozlesmeId)) return { durum: "yok" };
  const g = dogrula(IsgGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  if (!(await db.sorgu("SELECT 1 FROM is_sozlesmesi_tesis WHERE sozlesme_id = $1 AND tesis_id = $2", [sozlesmeId, v.tesis])).rowCount)
    return { durum: "gecersiz", hatalar: { tesis: "Tesis bu sözleşmenin kapsamında değil." } };
  let var_: IsgDb | undefined;
  if (id) {
    if (!UUID.test(id)) return { durum: "yok" };
    var_ = (await db.sorgu<IsgDb>("SELECT id::text, tesis_id::text, personel_id::text, no, onay::text, bitis::text, dosya_id::text, kullanildi::text, surum FROM isg_katip WHERE id = $1 AND NOT onceki AND kaldirildi IS NULL FOR UPDATE", [id])).rows[0];
    if (!var_) return { durum: "yok" };
    if (var_.tesis_id !== v.tesis || var_.personel_id !== v.personel) return { durum: "gecersiz", hatalar: { personel: "Düzeltmede tesis ve denetçi değişmez; yeni ID ekleyin." } };
    if (!surumGecerli(surum)) return { durum: "cakisma" };
  } else if (!(await personelSecenekleri(db)).some((k) => k.id === v.personel)) {
    return { durum: "gecersiz", hatalar: { personel: "Denetçi seçilmeli." } };
  }
  let dosyaId: string | null | false = var_?.dosya_id ?? null;
  if (pdf === null) dosyaId = null;
  const iz = { kim: kim.ad, ne: id ? "isg.duzelt" : "isg.ekle" };
  if (id) {
    if (pdf) dosyaId = await isgPdf(db, depo, kim, firmaId, id, pdf);
    if (dosyaId === false) return { durum: "gecersiz", hatalar: { dosya: "Dosya PDF değil, bozuk ya da 25 MB'tan büyük." } };
    const r = await guncelle(db, ISG, id, surum, { no: v.no, onay: v.onay, bitis: v.bitis, dosya_id: dosyaId }, iz);
    if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
    return { durum: "tamam", id };
  }
  const eski = (await db.sorgu<{ id: string; surum: number }>(
    "SELECT id::text, surum FROM isg_katip WHERE tesis_id = $1 AND personel_id = $2 AND NOT onceki AND kaldirildi IS NULL FOR UPDATE", [v.tesis, v.personel])).rows;
  for (const e of eski) await guncelle(db, ISG, e.id, e.surum, { onceki: true }, { kim: kim.ad, ne: "isg.onceki", gerekce: "yeni ID eklendi" });
  const r = await ekle(db, ISG, { tesis_id: v.tesis, personel_id: v.personel, no: v.no, onay: v.onay, bitis: v.bitis }, iz);
  if (pdf) {
    const d = await isgPdf(db, depo, kim, firmaId, r.id, pdf);
    if (d === false) throw new DosyaHatasi("Dosya PDF değil, bozuk ya da 25 MB'tan büyük.");
    await guncelle(db, ISG, r.id, r.surum, { dosya_id: d }, { kim: kim.ad, ne: "isg.pdf" });
  }
  return { durum: "tamam", id: r.id };
}
/** yeni ID ile birlikte gelen PDF reddedilirse ID de kaydedilmez (işlem düşer) */
export class DosyaHatasi extends Error {}

async function isgPdf(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, isgId: string, pdf: { ad: string; bayt: Uint8Array }): Promise<string | false> {
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.isg, kayitId: isgId, ad: pdf.ad, bayt: pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  return y.tamam ? y.id : false;
}

/** kullanılmamış ID kaldırılır (kayıt kalır); planda kullanılmışsa ret — yalnız düzeltilir (maket G) */
export async function isgKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const r0 = (await db.sorgu<{ kullanildi: string | null; no: string }>("SELECT kullanildi::text, no FROM isg_katip WHERE id = $1 AND kaldirildi IS NULL FOR UPDATE", [id])).rows[0];
  if (!r0) return { durum: "yok" };
  if (r0.kullanildi) return { durum: "red", neden: `${r0.no} bir planda kullanıldı; silinmez, yalnız düzeltilir.` };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, ISG, id, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "isg.kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** Planlar için: tesis × denetçinin geçerli ID'si (yetki ÇAĞIRANDA) */
export async function isgIdBul(db: Sorgulayici, tesisId: string, personelId: string): Promise<{ id: string; no: string; onay: string | null; bitis: string | null } | null> {
  if (!UUID.test(tesisId) || !UUID.test(personelId)) return null;
  return (await db.sorgu<{ id: string; no: string; onay: string | null; bitis: string | null }>(
    "SELECT id::text, no, onay::text, bitis::text FROM isg_katip WHERE tesis_id = $1 AND personel_id = $2 AND NOT onceki AND kaldirildi IS NULL", [tesisId, personelId])).rows[0] ?? null;
}

/** Planlar için (Plan aç): tesisin geçerli İSG-KATİP SÖZLEŞME ID'leri, denetçi başına. Yetki ÇAĞIRANDA. */
export async function tesisIsgKayitlari(db: Sorgulayici, tesisId: string): Promise<{ id: string; personelId: string; no: string; onay: string | null; bitis: string | null }[]> {
  if (!UUID.test(tesisId)) return [];
  return (await db.sorgu<{ id: string; personel_id: string; no: string; onay: string | null; bitis: string | null }>(
    "SELECT id::text, personel_id::text, no, onay::text, bitis::text FROM isg_katip WHERE tesis_id = $1 AND NOT onceki AND kaldirildi IS NULL", [tesisId])).rows
    .map((x) => ({ id: x.id, personelId: x.personel_id, no: x.no, onay: x.onay, bitis: x.bitis }));
}

/** Planlar için (Plan aç uyarısı "plan günü iş sözleşmesinin dışında", Ö5b): tesisi kapsayan iş sözleşmeleri. Yetki ÇAĞIRANDA. */
export async function tesisSozlesmeleri(db: Sorgulayici, tesisId: string): Promise<{ id: string; no: string; baslangic: string; bitis: string }[]> {
  if (!UUID.test(tesisId)) return [];
  return (await db.sorgu<{ id: string; no: string; baslangic: string; bitis: string }>(
    `SELECT s.id::text, s.no, s.baslangic::text, s.bitis::text FROM is_sozlesmesi s JOIN is_sozlesmesi_tesis k ON k.sozlesme_id = s.id AND k.firma_id = s.firma_id
      WHERE k.tesis_id = $1 ORDER BY s.baslangic DESC`, [tesisId])).rows;
}

/** Planlar için: İSG-KATİP ID'si bir planda kullanıldı (kullanılmış ID silinmez, yalnız düzeltilir — M5 G). İlk kullanım tarihi kalır. */
export async function isgKullanildi(db: Sorgulayici, kim: { ad: string }, isgId: string, tarih: string): Promise<void> {
  if (!UUID.test(isgId)) return;
  const r = (await db.sorgu<{ surum: number; kullanildi: string | null }>("SELECT surum, kullanildi::text FROM isg_katip WHERE id = $1 FOR UPDATE", [isgId])).rows[0];
  if (!r || r.kullanildi) return;
  const g = await guncelle(db, ISG, isgId, r.surum, { kullanildi: tarih }, { kim: kim.ad, ne: "isg.kullanildi" });
  if (g.durum === "cakisma" || g.durum === "yok") throw new Error("İSG-KATİP kaydı kullanıldı olarak işaretlenemedi");
}

export async function sablonlar(db: Sorgulayici, kim: Kisi): Promise<SablonSatiri[]> {
  if (!degistirir(kim)) return [];
  return (await db.sorgu<{ id: string; surum_no: number; dosya_id: string; olustu: Date; surum: number }>(
    "SELECT id::text, surum_no, dosya_id::text, olustu, surum FROM sozlesme_sablon WHERE kaldirildi IS NULL ORDER BY surum_no DESC")).rows
    .map((x) => ({ id: x.id, surumNo: x.surum_no, dosyaId: x.dosya_id, olustu: x.olustu.toISOString(), surum: x.surum }));
}

/** firmanın sözleşme şablonu (PDF), sürümlü; en yenisi kullanımda */
export async function sablonYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, dosya: { ad: string; bayt: Uint8Array }): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const n = (await db.sorgu<{ n: number }>("SELECT coalesce(max(surum_no), 0) + 1 AS n FROM sozlesme_sablon")).rows[0].n;
  /* şablon firmanın tek belgesi: dosya kaydı firmaya bağlanır (erişim yalnız "yaz" düzeyine) */
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.sablon, kayitId: firmaId, ad: dosya.ad, bayt: dosya.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk." } };
  return { durum: "tamam", id: (await ekle(db, SABLON, { surum_no: n, dosya_id: y.id }, { kim: kim.ad, ne: "sozlesme.sablon_yukle" })).id };
}

export async function sablonKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, SABLON, id, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "sozlesme.sablon_kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** dosya erişimi (src/server/dosya/erisim.ts) */
export async function sozlesmeDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId) || !["gor", "yaz"].includes(duzey(kisi, MODUL))) return false;
  return !!(await db.sorgu("SELECT 1 FROM is_sozlesmesi WHERE id = $1", [kayitId])).rowCount;
}
export async function isgDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId)) return false;
  const k = await kendiKisi(db, kisi);
  if (k === false) return false;
  const r = (await db.sorgu<{ p: string }>("SELECT personel_id::text AS p FROM isg_katip WHERE id = $1", [kayitId])).rows[0];
  return !!r && (k === null || r.p === k);
}
export async function sablonDosyasiGorulur(_db: Sorgulayici, kisi: YetkiHesabi): Promise<boolean> {
  return degistirir(kisi);
}

/* ── KESİN SİLME (369; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — yalnız yönetici (kayit_sil, modül 12) ve yalnız
   müşteri imzası hiç yüklenmemiş, faturası olmayan sözleşme (veritabanında, göç 0064); kapsam tesisleri birlikte. İmzalanmış sözleşme silinmez. */
const silebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });
/** sözleşme sayfası: "Sil" çizilir mi */
export async function sozlesmeSilinir(db: Sorgulayici, kim: YetkiHesabi, id: string): Promise<boolean> {
  return silebilir(kim) && /^[0-9a-f-]{36}$/.test(id) && !(await kullanimlar(db, "is_sozlesmesi", [id])).has(id);
}
export async function sozlesmeSil(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "is_sozlesmesi", id, kim.ad);
  if (r.durum === "kullanildi") {
    return { durum: "red", neden: r.kullanim.imzali ? "İmzalanmış sözleşme silinmez." : `Sözleşme silinemez: ${r.kullanim.fatura_kaydi ?? 0} faturada kullanıldı.` };
  }
  return r.durum === "tamam" ? { durum: "tamam", id, no: r.ad } : { durum: "yok" };
}
