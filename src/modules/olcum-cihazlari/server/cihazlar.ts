/* ÖLÇÜM CİHAZLARI — modülün dışa açılan işlevleri (maket olcum-cihazlari.html; modül 8). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 8): "gör" ve üstü listeyi ve cihaz sayfasını görür; DEĞİŞTİRMEK (cihaz ekle / düzenle, konum,
   kalibrasyon kaydı) yalnız "yaz" düzeyinde (önerilen düzende branş yöneticileri + firma yöneticisi). "Kendi" düzeyi (denetçi: kendi zimmeti)
   Zimmetler kalemi gelene kadar kayıt göstermez (varsayılan kapalı). Yazmalar güvenli yazıcıdan; sertifika tek dosya yolundan (yalnız PDF). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar, type Kullanim } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { CihazGirdisi, CihazTuruGirdisi, kalDurum, KalibrasyonGirdisi, YENI_TUR, type KalDurum } from "../sema.ts";
import { cihazTurKullanimi } from "../../ekipman-turleri/server/turler.ts";

const MODUL = 8;
export const DOSYA_MODULU = "olcum_cihazi";
const TUR = tablo({ ad: "cihaz_turu", sutunlar: ["ad"] });
const CIHAZ = tablo({ ad: "olcum_cihazi", sutunlar: ["kod", "tur_id", "marka", "model", "seri", "aralik", "konum", "pasif"] });
const KAL = tablo({ ad: "kalibrasyon", sutunlar: ["cihaz_id", "tarih", "bitis", "lab", "sertifika", "sonuc", "dosya_id", "kaldirildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface CihazTuru { id: string; ad: string }
export interface CihazSatiri {
  id: string; kod: string; turId: string; tur: string; marka: string | null; model: string | null; seri: string | null; aralik: string | null;
  konum: "depo" | "lab"; bitis: string | null; durum: KalDurum;
  /** 358: kullanımdan çekildiği gün (pasif cihaz listede "Pasif" görünümünde; rapor seçiminden, Zimmetler'den, uyarılardan kalkar) */
  pasif: string | null;
}
export interface KalibrasyonKaydi { id: string; tarih: string; bitis: string; lab: string; sertifika: string; sonuc: "uygun" | "uygun_degil"; dosyaId: string | null; surum: number }
export interface CihazKarti extends CihazSatiri { surum: number; kalibrasyonlar: KalibrasyonKaydi[] }

export type Yazma =
  | { durum: "tamam"; id: string; surum: number }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
/** "kendi" düzeyi (denetçi): yalnız kendi zimmetindeki cihazlar (Zimmetler modülünün "kimde" bilgisinden); kişisi yoksa hiçbiri */
async function kendiCihazlari(db: Sorgulayici, kim: YetkiHesabi): Promise<Set<string> | null> {
  if (duzey(kim, MODUL) !== "kendi") return null;
  const p = await hesabinPersoneli(db, kim.id);
  const k = await kimdeHaritasi(db);
  return new Set(p ? [...k.cihaz].filter(([, kisi]) => kisi === p).map(([id]) => id) : []);
}
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

type CihazDb = { id: string; kod: string; tur_id: string; tur: string; marka: string | null; model: string | null; seri: string | null; aralik: string | null; konum: "depo" | "lab"; bitis: string | null; surum: number; pasif: string | null };
/** geçerli bitiş (SQL; c = olcum_cihazi): kaldırılmamış "uygun" kalibrasyonların en geç bitişi. Toplu içe aktarılan cihazın sistem öncesi bitişi
    (0047 ilk_bitis) YALNIZ cihazın hiç kalibrasyon kaydı yokken — kayıt açılınca (sonucu "uygun değil" olsa da) devreden çıkar (karar 337; 337–339
    incelemesi: GREATEST "uygun değil" kaydı ve daha erken biten kaydı eziyordu). Uyarılar ve rapor belgesi de aynı kuralla (uyari-baglanti.ts). */
export const GECERLI_BITIS = `CASE WHEN EXISTS (SELECT 1 FROM kalibrasyon k WHERE k.cihaz_id = c.id AND k.firma_id = c.firma_id AND k.kaldirildi IS NULL)
    THEN (SELECT max(k.bitis) FROM kalibrasyon k WHERE k.cihaz_id = c.id AND k.firma_id = c.firma_id AND k.sonuc = 'uygun' AND k.kaldirildi IS NULL)
    ELSE c.ilk_bitis END`;
const CIHAZ_SEC = `SELECT c.id::text, c.kod, c.tur_id::text, t.ad AS tur, c.marka, c.model, c.seri, c.aralik, c.konum, c.surum, c.pasif::text AS pasif, (${GECERLI_BITIS})::text AS bitis
  FROM olcum_cihazi c JOIN cihaz_turu t ON t.id = c.tur_id AND t.firma_id = c.firma_id`;
const satir = (x: CihazDb, bugun: string, esik: number): CihazSatiri => ({
  id: x.id, kod: x.kod, turId: x.tur_id, tur: x.tur, marka: x.marka, model: x.model, seri: x.seri, aralik: x.aralik, konum: x.konum, bitis: x.bitis,
  durum: kalDurum(x.bitis, x.konum, bugun, esik), pasif: x.pasif,
});

/** öteki modüller için cihaz özeti (yetki ÇAĞIRANDA; Zimmetler kendi düzeyine göre süzer). Varsayılan yalnız etkinler; 362: `pasifDahil` — Zimmetler
    pasif cihazın geçmiş hareketlerini adıyla gösterir ve Görünüm: Pasif'te listeler (teslim edilmez). */
export async function cihazOzetleri(db: Sorgulayici, ayar: { pasifDahil?: boolean } = {}): Promise<(Pick<CihazSatiri, "id" | "kod" | "tur" | "konum" | "bitis"> & { pasif: boolean })[]> {
  return (await db.sorgu<CihazDb>(ayar.pasifDahil ? CIHAZ_SEC : `${CIHAZ_SEC} WHERE c.pasif IS NULL`)).rows
    .map((x) => ({ id: x.id, kod: x.kod, tur: x.tur, konum: x.konum, bitis: x.bitis, pasif: x.pasif !== null }));
}

/** Raporlar için: cihazlar türü, marka / model / seri ve geçerli kalibrasyon bitişiyle (yetki ÇAĞIRANDA; kimde olduğu Zimmetler'den). Varsayılan yalnız
    ETKİN cihazlar (seçim: rapora eklenecek cihaz); 358: `pasifDahil` raporda zaten olan cihazı ÇÖZMEK için (açık rapor ve rapor belgesi pasife alınmış
    cihazın kodunu ve kalibrasyonunu göstermeye devam eder — "eksik" / "—" olmaz). */
export async function raporCihazlari(db: Sorgulayici, ayar: { pasifDahil?: boolean } = {}): Promise<{ id: string; kod: string; turId: string; tur: string; marka: string | null; model: string | null;
  seri: string | null; konum: "depo" | "lab"; bitis: string | null; pasif: boolean }[]> {
  return (await db.sorgu<CihazDb>(ayar.pasifDahil ? CIHAZ_SEC : `${CIHAZ_SEC} WHERE c.pasif IS NULL`)).rows
    .map((x) => ({ id: x.id, kod: x.kod, turId: x.tur_id, tur: x.tur, marka: x.marka, model: x.model, seri: x.seri, konum: x.konum, bitis: x.bitis, pasif: x.pasif !== null }));
}

/** Raporlar (belge) için: cihazların son geçerli kalibrasyonu — tarih, bitiş, sertifika no (yetki ÇAĞIRANDA). Hiç kalibrasyon kaydı olmayan, toplu
    içe aktarılmış cihazda sistem öncesi bitiş (ilk_bitis; tarih ve sertifika yok — uydurulmaz): rapora eklemeyi ve ENGEL 2'yi geçen bitişle belge
    aynı kaynaktan (337–339 incelemesi). 340–345 incelemesi: gün verilince (muayene günü) ilk_bitis, o gün sistemde kalibrasyon kaydı yokken
    adaydır ve kayıtlardan seçilen o gün geçerli değilse onun yerine geçer — muayeneden SONRA girilen kalibrasyon imzalı rapora yazılmaz. */
export async function cihazKalibrasyonlari(db: Sorgulayici, idler: readonly string[], gun?: string | null): Promise<Map<string, { tarih: string | null; bitis: string; sertifika: string | null }>> {
  const l = idler.filter((x) => /^[0-9a-f-]{36}$/.test(x));
  if (!l.length) return new Map();
  /* gün verilirse o gün geçerli olan kalibrasyon önce (muayene günündeki — rapor belgesi); yoksa en geç bitişli */
  const g = gun && /^\d{4}-\d{2}-\d{2}$/.test(gun) ? gun : null;
  const m = new Map<string, { tarih: string | null; bitis: string; sertifika: string | null }>((await db.sorgu<{ cihaz_id: string; tarih: string; bitis: string; sertifika: string | null }>(
    `SELECT DISTINCT ON (cihaz_id) cihaz_id::text, tarih::text, bitis::text, sertifika FROM kalibrasyon
     WHERE cihaz_id = ANY ($1::uuid[]) AND sonuc = 'uygun' AND kaldirildi IS NULL
     ORDER BY cihaz_id, ($2::date IS NOT NULL AND tarih <= $2::date AND bitis >= $2::date) DESC, bitis DESC`, [l, g])).rows
    .map((x) => [x.cihaz_id, { tarih: x.tarih, bitis: x.bitis, sertifika: x.sertifika }]));
  for (const x of (await db.sorgu<{ id: string; bitis: string }>(
    `SELECT c.id::text, c.ilk_bitis::text AS bitis FROM olcum_cihazi c WHERE c.id = ANY ($1::uuid[]) AND c.ilk_bitis IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM kalibrasyon k WHERE k.cihaz_id = c.id AND k.firma_id = c.firma_id AND k.kaldirildi IS NULL
         AND ($2::date IS NULL OR k.tarih <= $2::date))`, [l, g])).rows) {
    const k = m.get(x.id);
    if (!k || (g && !(k.tarih !== null && k.tarih <= g && k.bitis >= g))) m.set(x.id, { tarih: null, bitis: x.bitis, sertifika: null });
  }
  return m;
}

/** öteki modüller için cihaz türleri (yetki ÇAĞIRANDA; Ekipman türleri bağlantısı) */
export async function cihazTuruOzetleri(db: Sorgulayici): Promise<CihazTuru[]> {
  return (await db.sorgu<CihazTuru>("SELECT id::text, ad FROM cihaz_turu")).rows.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

export async function cihazTurleri(db: Sorgulayici, kim: Kisi): Promise<CihazTuru[]> {
  if (!gorur(kim)) return [];
  return (await db.sorgu<CihazTuru>("SELECT id::text, ad FROM cihaz_turu")).rows.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

export async function cihazListesi(db: Sorgulayici, kim: Kisi): Promise<{ cihazlar: CihazSatiri[]; esik: number } | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const esik = await kalibrasyonEsigi(db);
  const kendi = await kendiCihazlari(db, kim);
  if (!gorur(kim) && !kendi) return { cihazlar: [], esik };
  const bugun = bugunTr();
  /* 358: pasif cihazlar da gelir — liste "Görünüm" seçicisiyle ayırır (varsayılan etkin; karar 48 deseni) */
  const r = await db.sorgu<CihazDb>(CIHAZ_SEC);
  return { cihazlar: r.rows.filter((x) => !kendi || kendi.has(x.id)).map((x) => satir(x, bugun, esik)).sort((a, b) => (a.bitis ?? "") < (b.bitis ?? "") ? -1 : (a.bitis ?? "") > (b.bitis ?? "") ? 1 : a.kod.localeCompare(b.kod)), esik };
}

export async function cihazKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<(CihazKarti & { esik: number }) | null> {
  if (!UUID.test(id)) return null;
  const kendi = await kendiCihazlari(db, kim);
  if (kendi ? !kendi.has(id) : !gorur(kim)) return null;
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

/* ── KESİN SİLME (357; reisim 2026-10-07: "denemek için bir kaç cihaz ekledim ama silemedim") — yalnız yöneticiler (canDo kayit_sil, modül 8) ve
   yalnız hiç KULLANILMAMIŞ cihaz (zimmet hareketi, raporun cihaz listesi — silinmiş taslak dahil —, zimmet formu yok; tanım veritabanında, göç 0054).
   Kalibrasyon kayıtları cihazla birlikte silinir, sertifikalar çöpe; denetim izine eski değerle. Kullanılmış cihaz silinmez (pasif: ayrı kalem). */
export type SilYaniti = { durum: "tamam"; ad: string } | { durum: "red"; neden: string } | { durum: "yok" } | { durum: "yetkisiz" };
const silebilir = (kim: Kisi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });

/** cihaz sayfası: "Sil" çizilir mi (silebilen kişi + kullanılmamış cihaz); cihazı değiştirene kullanım sayımları ("Pasife al" penceresi nedeni söyler) */
export async function cihazSilmeDurumu(db: Sorgulayici, kim: Kisi, id: string): Promise<{ sil: boolean; kullanim: Kullanim | null }> {
  if (!degistirir(kim) || !UUID.test(id)) return { sil: false, kullanim: null };
  const k = (await kullanimlar(db, "olcum_cihazi", [id])).get(id) ?? null;
  return { sil: silebilir(kim) && !k, kullanim: k };
}

export async function cihazSil(db: Sorgulayici, kim: Kisi, id: string): Promise<SilYaniti> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "olcum_cihazi", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Cihaz silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı.` };
  return r;
}

/* ── PASİF / ETKİNLEŞTİR (358; §9 elli üçüncü tur: kullanılmış kayıt silinmez, pasife alınır) — "yaz" düzeyi (cihazı değiştiren). Pasif cihaz listeden
   (Görünüm: Pasif), rapor seçiminden, Zimmetler'den ve kalibrasyon uyarılarından kalkar; kalibrasyon geçmişi, raporları ve belgeleri durur.
   ENGEL (veri bütünlüğü): cihaz depoda olmalı — kişinin zimmetindeyse pasif cihaz Zimmetler'den düşer, geri teslim alınamaz (çıkmaz kayıt); kalibrasyondaysa
   önce depoya alınır. Etkinleştir geri getirir. */
export type PasifYaniti = { durum: "tamam"; id: string; surum: number } | { durum: "red"; neden: string } | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
export async function cihazPasif(db: Sorgulayici, kim: Kisi, id: string, surum: number, pasif: boolean): Promise<PasifYaniti> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const c = (await db.sorgu<{ kod: string; konum: string; pasif: string | null }>("SELECT kod, konum, pasif::text FROM olcum_cihazi WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!c) return { durum: "yok" };
  if (pasif && !c.pasif) {
    if ((await kimdeHaritasi(db)).cihaz.get(id)) return { durum: "red", neden: `${c.kod} bir kişinin zimmetinde; önce Zimmetler'den depoya teslim alın.` };
    if (c.konum === "lab") return { durum: "red", neden: `${c.kod} kalibrasyonda; önce depoya alın.` };
  }
  const r = await guncelle(db, CIHAZ, id, surum, { pasif: pasif ? (c.pasif ?? bugunTr()) : null }, { kim: kim.ad, ne: pasif ? "cihaz.pasif" : "cihaz.etkinlestir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}

/* ── CİHAZ TÜRLERİ (359; maket olcum-cihazlari.html T7 "Cihaz türleri" — firma kendi türlerini ekler, düzenler; cihazı olmayan tür silinir ve ekipman
   türlerinin kullanacağı cihazlardan da çıkar). Görmek "gör", eklemek / ad değiştirmek "yaz", silmek yönetici (kayit_sil, modül 8) + kullanılmamış tür
   (cihazı yok — pasif dahil —, raporda tür olarak geçmiyor; tanım veritabanında, göç 0055). Kullanılmış tür için pasif yok: yalnız ad düzenlenir. */
export interface CihazTuruSatiri { id: string; ad: string; surum: number; cihaz: number; ekipmanTuru: number; sil: boolean }
export async function cihazTuruListesi(db: Sorgulayici, kim: Kisi): Promise<CihazTuruSatiri[]> {
  if (!gorur(kim)) return [];
  const turler = (await db.sorgu<{ id: string; ad: string; surum: number; cihaz: number }>(
    "SELECT t.id::text, t.ad, t.surum, (SELECT count(*)::int FROM olcum_cihazi c WHERE c.tur_id = t.id) AS cihaz FROM cihaz_turu t")).rows;
  const ekipman = await cihazTurKullanimi(db);
  const kullanim = silebilir(kim) ? await kullanimlar(db, "cihaz_turu", turler.map((t) => t.id)) : null;
  return turler.map((t) => ({ ...t, ekipmanTuru: ekipman.get(t.id) ?? 0, sil: !!kullanim && !kullanim.has(t.id) }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** tür ekle (id boş) ya da adını değiştir; ad firmada eşsiz (Türkçe büyük / küçük harf farkı yok sayılır — cihazKaydet ile aynı) */
export async function cihazTuruKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (id && (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM cihaz_turu WHERE id = $1", [id])).rowCount)) return { durum: "yok" };
  const g = dogrula(CihazTuruGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const tr = (x: string) => x.toLocaleLowerCase("tr");
  if ((await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM cihaz_turu")).rows.some((t) => t.id !== id && tr(t.ad) === tr(g.veri.ad))) {
    return { durum: "gecersiz", hatalar: { ad: `${g.veri.ad} adında bir tür zaten var.` } };
  }
  if (!id) return { durum: "tamam", ...(await ekle(db, TUR, { ad: g.veri.ad }, { kim: kim.ad, ne: "cihaz_turu.ekle" })) };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, TUR, id, surum, { ad: g.veri.ad }, { kim: kim.ad, ne: "cihaz_turu.guncelle" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}

/** kesin sil (359): yönetici + kullanılmamış tür; ekipman türlerinin cihaz listesinden de çıkar */
export async function cihazTuruSil(db: Sorgulayici, kim: Kisi, id: string): Promise<SilYaniti> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "cihaz_turu", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Tür silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı.` };
  return r;
}
