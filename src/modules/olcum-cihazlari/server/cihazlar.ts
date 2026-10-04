/* ÖLÇÜM CİHAZLARI — modülün dışa açılan işlevleri (maket olcum-cihazlari.html; modül 8). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 8): "gör" ve üstü listeyi ve cihaz sayfasını görür; DEĞİŞTİRMEK (cihaz ekle / düzenle, konum,
   kalibrasyon kaydı) yalnız "yaz" düzeyinde (önerilen düzende branş yöneticileri + firma yöneticisi). "Kendi" düzeyi (denetçi: kendi zimmeti)
   Zimmetler kalemi gelene kadar kayıt göstermez (varsayılan kapalı). Yazmalar güvenli yazıcıdan; sertifika tek dosya yolundan (yalnız PDF). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { CihazGirdisi, kalDurum, KalibrasyonGirdisi, YENI_TUR, type KalDurum } from "../sema.ts";

const MODUL = 8;
export const DOSYA_MODULU = "olcum_cihazi";
const TUR = tablo({ ad: "cihaz_turu", sutunlar: ["ad"] });
const CIHAZ = tablo({ ad: "olcum_cihazi", sutunlar: ["kod", "tur_id", "marka", "model", "seri", "aralik", "konum"] });
const KAL = tablo({ ad: "kalibrasyon", sutunlar: ["cihaz_id", "tarih", "bitis", "lab", "sertifika", "sonuc", "dosya_id", "kaldirildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface CihazTuru { id: string; ad: string }
export interface CihazSatiri {
  id: string; kod: string; turId: string; tur: string; marka: string | null; model: string | null; seri: string | null; aralik: string | null;
  konum: "depo" | "lab"; bitis: string | null; durum: KalDurum;
}
export interface KalibrasyonKaydi { id: string; tarih: string; bitis: string; lab: string; sertifika: string; sonuc: "uygun" | "uygun_degil"; dosyaId: string | null; surum: number }
export interface CihazKarti extends CihazSatiri { surum: number; kalibrasyonlar: KalibrasyonKaydi[] }

export type Yazma =
  | { durum: "tamam"; id: string; surum: number }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const cihazDegistirir = degistirir;
export const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;

/** dosya erişimi (src/server/dosya/erisim.ts): cihazı görebilen sertifikasını açar */
export async function cihazDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!gorur(kisi) || !UUID.test(kayitId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM olcum_cihazi WHERE id = $1", [kayitId])).rowCount;
}

export async function kalibrasyonEsigi(db: Sorgulayici): Promise<number> {
  return (await ayarOku(db, "uyari_esikleri")).deger.kalibrasyon;
}

type CihazDb = { id: string; kod: string; tur_id: string; tur: string; marka: string | null; model: string | null; seri: string | null; aralik: string | null; konum: "depo" | "lab"; bitis: string | null; surum: number };
/* geçerli bitiş: kaldırılmamış "uygun" kalibrasyonların en geç bitişi */
const CIHAZ_SEC = `SELECT c.id::text, c.kod, c.tur_id::text, t.ad AS tur, c.marka, c.model, c.seri, c.aralik, c.konum, c.surum,
    (SELECT max(k.bitis) FROM kalibrasyon k WHERE k.cihaz_id = c.id AND k.firma_id = c.firma_id AND k.sonuc = 'uygun' AND k.kaldirildi IS NULL)::text AS bitis
  FROM olcum_cihazi c JOIN cihaz_turu t ON t.id = c.tur_id AND t.firma_id = c.firma_id`;
const satir = (x: CihazDb, bugun: string, esik: number): CihazSatiri => ({
  id: x.id, kod: x.kod, turId: x.tur_id, tur: x.tur, marka: x.marka, model: x.model, seri: x.seri, aralik: x.aralik, konum: x.konum, bitis: x.bitis,
  durum: kalDurum(x.bitis, x.konum, bugun, esik),
});

export async function cihazTurleri(db: Sorgulayici, kim: Kisi): Promise<CihazTuru[]> {
  if (!gorur(kim)) return [];
  return (await db.sorgu<CihazTuru>("SELECT id::text, ad FROM cihaz_turu")).rows.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

export async function cihazListesi(db: Sorgulayici, kim: Kisi): Promise<{ cihazlar: CihazSatiri[]; esik: number } | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const esik = await kalibrasyonEsigi(db);
  if (!gorur(kim)) return { cihazlar: [], esik };
  const bugun = bugunTr();
  const r = await db.sorgu<CihazDb>(`${CIHAZ_SEC} WHERE c.pasif IS NULL`);
  return { cihazlar: r.rows.map((x) => satir(x, bugun, esik)).sort((a, b) => (a.bitis ?? "") < (b.bitis ?? "") ? -1 : (a.bitis ?? "") > (b.bitis ?? "") ? 1 : a.kod.localeCompare(b.kod)), esik };
}

export async function cihazKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<(CihazKarti & { esik: number }) | null> {
  if (!UUID.test(id) || !gorur(kim)) return null;
  const x = (await db.sorgu<CihazDb>(`${CIHAZ_SEC} WHERE c.id = $1`, [id])).rows[0];
  if (!x) return null;
  const esik = await kalibrasyonEsigi(db);
  const k = await db.sorgu<{ id: string; tarih: string; bitis: string; lab: string; sertifika: string; sonuc: "uygun" | "uygun_degil"; dosya_id: string | null; surum: number }>(
    "SELECT id::text, tarih, bitis, lab, sertifika, sonuc, dosya_id::text, surum FROM kalibrasyon WHERE cihaz_id = $1 AND kaldirildi IS NULL ORDER BY tarih DESC, olustu DESC", [id]);
  return { ...satir(x, bugunTr(), esik), surum: x.surum, esik, kalibrasyonlar: k.rows.map(({ dosya_id, ...r }) => ({ ...r, dosyaId: dosya_id })) };
}

/** cihaz ekle (id boş) ya da düzenle. Kod firmada eşsiz (etiket, düzenlenir). Yeni tür adı verilirse tür eklenir (aynı ad varsa o kullanılır). */
export async function cihazKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (id && (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM olcum_cihazi WHERE id = $1", [id])).rowCount)) return { durum: "yok" };
  const g = dogrula(CihazGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const ayni = (await db.sorgu("SELECT 1 FROM olcum_cihazi WHERE kod = $1 AND id <> $2", [v.kod, id ?? "00000000-0000-0000-0000-000000000000"])).rowCount;
  if (ayni) return { durum: "gecersiz", hatalar: { kod: `${v.kod} kodu başka bir cihazda kullanılıyor.` } };
  const iz: Iz = { kim: kim.ad, ne: id ? "cihaz.guncelle" : "cihaz.ekle" };
  let turId = v.tur;
  if (v.tur === YENI_TUR) {
    /* aynı ad (Türkçe büyük / küçük harf farkıyla) varsa o kullanılır — veritabanının lower()'ı yerele bağlı, karşılaştırma burada */
    const tr = (x: string) => x.toLocaleLowerCase("tr");
    const var_ = (await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM cihaz_turu")).rows.find((t) => tr(t.ad) === tr(v.yeniTur!));
    turId = var_?.id ?? (await ekle(db, TUR, { ad: v.yeniTur }, { kim: kim.ad, ne: "cihaz_turu.ekle" })).id;
  } else if (!(await db.sorgu("SELECT 1 FROM cihaz_turu WHERE id = $1", [v.tur])).rowCount) {
    return { durum: "gecersiz", hatalar: { tur: "Cihaz türü seçilmeli." } };
  }
  const degerler = { kod: v.kod, tur_id: turId, marka: v.marka, model: v.model, seri: v.seri, aralik: v.aralik };
  if (!id) return { durum: "tamam", ...(await ekle(db, CIHAZ, degerler, iz)) };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, CIHAZ, id, surum, degerler, iz);
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}

/** konum: kalibrasyona gönder (lab) / depoya al (depo). Kişi zimmeti Zimmetler kaleminde. */
export async function cihazKonum(db: Sorgulayici, kim: Kisi, id: string, surum: number, konum: "depo" | "lab"): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  if (konum !== "depo" && konum !== "lab") return { durum: "gecersiz", hatalar: { konum: "Geçersiz konum." } };
  const r = await guncelle(db, CIHAZ, id, surum, { konum }, { kim: kim.ad, ne: konum === "lab" ? "cihaz.kalibrasyona_gonder" : "cihaz.depoya_al" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}

/** kalibrasyon kaydı ekle; sertifika PDF'i isteğe bağlı (yalnız baytlardan PDF). Kalibrasyondaki cihaz kayıtla depoya döner (maket). */
export async function kalibrasyonEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, cihazId: string, girdi: unknown, sertifika?: { ad: string; bayt: Uint8Array }): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(cihazId)) return { durum: "yok" };
  const c = (await db.sorgu<{ konum: string; surum: number }>("SELECT konum, surum FROM olcum_cihazi WHERE id = $1 FOR UPDATE", [cihazId])).rows[0];
  if (!c) return { durum: "yok" };
  const g = dogrula(KalibrasyonGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  let dosyaId: string | null = null;
  if (sertifika && sertifika.bayt.length) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: cihazId, ad: sertifika.ad, bayt: sertifika.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk." } };
    dosyaId = y.id;
  }
  const v = g.veri;
  const r = await ekle(db, KAL, { cihaz_id: cihazId, tarih: v.tarih, bitis: v.bitis, lab: v.lab, sertifika: v.sertifika, sonuc: v.sonuc, dosya_id: dosyaId },
    { kim: kim.ad, ne: "cihaz.kalibrasyon_ekle" });
  if (c.konum === "lab") await guncelle(db, CIHAZ, cihazId, c.surum, { konum: "depo" }, { kim: kim.ad, ne: "cihaz.depoya_al", gerekce: "kalibrasyon kaydıyla" });
  return { durum: "tamam", ...r };
}

/** kalibrasyon kaydını kaldır (silinmez) */
export async function kalibrasyonKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, KAL, id, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "cihaz.kalibrasyon_kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}
