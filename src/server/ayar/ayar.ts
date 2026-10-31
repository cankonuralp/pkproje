/* FİRMA AYARLARI (KOD-GECIS §7; maket firma-ayarlari) — bölüm başına biçim ve BAŞLANGIÇ DEĞERİ burada, tek kaynak. Okuma: kayıtlı değer başlangıçla
   birleşir ve şemadan geçer (bozuk / eski kayıt uygulamayı düşürmez, başlangıç değerine döner). Yazma: güvenli yazıcı (sürüm kilidi, yalnız değişen,
   denetim izi). Yetki (Firma ayarları modülü, canDo 22) çağıran eylemde. Bölümler modüllerle büyür; sırlar ayrı (sir.ts). */
import { z } from "../../sema/ortak.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import { ekle, guncelle, izYaz, tablo, type GuncelleSonucu, type Iz } from "../db/yazici.ts";
import type { Depo } from "../dosya/depo.ts";
import { DUZEYLER } from "../yetki/tanim.ts";

const onek = z.string().regex(/^[A-Z]{1,4}$/, "Önek: 1–4 büyük harf");
const kimlik = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/).nullable();
const gun = (en: number, cok: number) => z.number().int().min(en).max(cok);
/** varsayılan tarafsızlık beyanı (maket planlarim BEYAN; TS EN ISO/IEC 17020) */
export const VARSAYILAN_BEYAN = "Bu planı TS EN ISO/IEC 17020 kurallarına uygun, bağımsız ve tarafsız yürüteceğimi; muayene edilen kuruluşla tarafsızlığımı " +
  "etkileyecek ticari, mali ya da kişisel bir ilişkim ve çıkar çatışmam olmadığını; sonuçları yalnız teknik bulgulara dayanarak doğru ve eksiksiz " +
  "raporlayacağımı beyan ederim.";

export const AYAR_BOLUMLERI = {
  /** Firma bilgileri (334; maket firmaBilgiCiz): belge nüshası (2) · rapor başlığındaki künye — ticari ad (boşsa firma kaydındaki ad), adres,
      rapor e-postası, akreditasyon no · logo (dosya; raporların ve belgelerin başlığına) · telefon (595 madde 14: sayfa altı yazısının {tel}'i) */
  firma_bilgileri: z.object({
    nusha: gun(1, 5).default(2),
    ad: z.string().trim().max(120).default(""),
    adres: z.string().trim().max(200).default(""),
    eposta: z.string().trim().max(120).refine((e) => e === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).default(""),
    tel: z.string().trim().max(30).default(""),
    akr: z.string().trim().max(20).default(""),
    logo: kimlik.default(null),
  }),
  /** Zimmet teslim formu (196): firma adına teslim edenin başlangıç değeri (personel; formda değiştirilebilir) */
  zimmet: z.object({ teslim_eden: kimlik.default(null) }),
  /** firmanın belge şablonları (334): ön bilgilendirme formu (N1; yoksa temel format <firma kodu>-FR-OBF-01) ve bordro formatı (BB5) — dosya kimlikleri */
  belge_sablon: z.object({ on_bilgi: kimlik.default(null), bordro_format: kimlik.default(null) }),
  /** İmza yöntemi (mobil / e-imza) · 2026-10-17 teknik: teknik yönetici onaydaki raporu imzalayarak onaylar, sonra muayene uzmanı imzalar (göç 0102;
      kapalıyken bugünkü akış — raporlar/server/raporlar.ts teknikImzaAcik) */
  imza: z.object({ yontem: z.enum(["mobil", "e_imza"]).default("mobil"), teknik: z.boolean().default(false) }),
  /** Mesai takibi (212, AA2): normal 480 dk, mesai 180 dk, yıllık fazla çalışma ≤ 270 saat, günlük ≤ 660 dk. Normal 1–1440, mesai 0–1440
      (onaylı maket: 660'ı aşan toplam uyarıdır, engel değil — 334 incelemesi; günlük üst sınır gunluk_ust_dk hakkı keser) */
  mesai: z.object({
    acik: z.boolean().default(false),
    normal_dk: gun(1, 1440).default(480),
    mesai_dk: gun(0, 1440).default(180),
    yillik_fazla_saat: gun(0, 270).default(270),
    gunluk_ust_dk: gun(60, 660).default(660),
    /* 2026-10-31 (reisim: "hep Firma ayarlarından başlasın kullanıcı değiştirmek isterse değiştirir"): mesai başlangıcı — S.A.Y'ın saat planı buradan
       başlar; mesai takibi kapalıyken de geçerli */
    baslangic: z.string().regex(/^([01]d|2[0-3]):[0-5]d$/).default("09:00"),
  }),
  /** Uyarı eşikleri (gün) */
  uyari_esikleri: z.object({
    kalibrasyon: gun(1, 365).default(30),
    kontrolu_yaklasan_tesis: gun(1, 365).default(30),
    plan_kontrolu_geliyor: gun(1, 365).default(30),
    egitim: gun(1, 365).default(60),
  }),
  /** Numara önekleri (§3.7 satır 8; rapor numarasının firma kodu firma kaydında) */
  numara: z.object({ proje: onek.default("P"), teklif: onek.default("T"), sozlesme: onek.default("IS"), gider: onek.default("G"), izin: onek.default("I") }),
  /** Saklama süresi (ENGEL 11): en az 5 yıl, firma 6–20'ye uzatabilir */
  saklama: z.object({ yil: gun(5, 20).default(5) }),
  /** Yapay zekâ (aç / kapa, kişi başı aylık sınır); API anahtarı sırlarda. 336 (maket yzCiz, Y1): model ve kişi başı aylık sınır ABD doları (null =
      sınırsız; başlangıç 20). kisi_aylik_sinir eski alan, kullanılmıyor. */
  yapay_zeka: z.object({
    acik: z.boolean().default(false), kisi_aylik_sinir: gun(0, 100000).default(200),
    /* 2026-10-14 (reisim: "tek seçenek claude haiku 5.5 olsun"): tek model Haiku 5.5 — eski kayıttaki Sonnet / Opus okumada Haiku'ya döner (ayarOku
       alan alan kurtarır), ilk kayıtta Haiku yazılır */
    model: z.enum(["haiku"]).default("haiku"),
    /* 2026-10-25 (reisim: "kişi başı sınırı 5 dolar olsun default"): başlangıç 5 $ (önce 20); kayıtlı değer olduğu gibi kalır */
    sinir: z.number().min(0).max(10000).nullable().default(5),
  }),
  /** Raporların ikinci kopyası (336 "Bulut kaydı"; 2026-10-12 sunum D3): hizmet ("" = kapalı), ana klasör, klasör düzeni — imzalı raporlar ve aylık
      yedek firmanın Google Drive / OneDrive'ına; hesap bağlantısı ve kendiliğinden kopya yayına çıkışta (K7). Eski Dropbox / Yandex / SFTP değeri kapalıya döner. */
  bulut: z.object({
    saglayici: z.enum(["", "gdrive", "onedrive"]).default(""),
    kok: z.string().trim().min(1).max(80).default("probata Raporlar"),
    duzen: z.enum(["mt", "mty", "my"]).default("mt"),
  }),
  /** E-posta (536; maket postaCiz): gönderene gizli kopya (başlangıçta kapalı). FIRMA-VT FV11 (2026-10-16, K2 + K3): gönderen alan adı ve gönderme
      anahtarı Yönetim'den (firma_gonderim + sır eposta_anahtari — firmada kilitli); eski kayıttaki "alan" okunurken atılır. Gönderim
      src/server/eposta/firma.ts. */
  eposta: z.object({
    kopya: z.boolean().default(false),
  }),
  /** Tarafsızlık ve çıkar çatışması beyanı (§3.7 satır 3; karar 26): kalite el kitabındaki metin; boşsa varsayılan. Kabul anındaki metin plana yazılır */
  beyan: z.object({ metin: z.string().trim().min(20).max(4000).default(VARSAYILAN_BEYAN) }),
  /** Müşteriye açık personel belgeleri (323; maket firma-ayarlari "Müşteriye açık personel belgeleri", P3): müşteri panelinin "Muayene personeli"
      sekmesinde görünen türler — özlük türleri, seçili eğitim türlerinin sertifikaları, ekipman atama belgesi. Başlangıç: yalnız EKİPNET; eğitim
      sertifikası yok (maketteki gibi tür başına açılır, "hepsi" yok; sonradan eklenen tür kapalı başlar — 320–323 incelemesi). Veritabanı işlevi
      musteri_personel_belgeleri ayar yokken aynısını uygular (0035, kilit testi) */
  musteri_belge: z.object({
    ozluk: z.array(z.string().regex(/^[a-z0-9]{2,12}$/)).max(40).default(["ekipnet"]),
    egitim: z.array(z.string().regex(/^[0-9a-f-]{36}$/)).max(100).default([]),
    atama: z.boolean().default(false),
  }),
  /** Firmanın eklediği özlük belge türleri (335; maket Z5 "Belge türü ekle"): anahtar ekN, ad, kişisel veri mi; en çok 30 tür. Personel'de özlük
      belgesi yüklerken seçilir, müşteriye açılabilir (başlangıçta kapalı); kaldırma yalnız o türde belge yokken. son: verilmiş en büyük N — kaldırılan
      türün anahtarı bir daha VERİLMEZ (335 incelemesi: yeniden verilince eski seçim / eski belge yeni türün adıyla müşteriye açılabiliyordu) */
  belge_tur_ek: z.object({
    turler: z.array(z.object({ k: z.string().regex(/^ek[1-9][0-9]{0,2}$/), ad: z.string().trim().min(2).max(60), kisisel: z.boolean().default(false) })).max(30).default([]),
    son: z.number().int().min(0).max(999).default(0),
  }),
  /** Sabit giderler (328; maket MV.SABIT_GIDER — araç kira, ofis kirası, ofis giderleri, vergi ve harçlar …): ad, aylık tutar (KURUŞ), not.
      Gelir-gider ve kârlılığın genel gider payı buradan; başlangıçta boş (firma girer — Firma ayarları) */
  sabit_gider: z.object({
    kalemler: z.array(z.object({ ad: z.string().trim().min(2).max(60), aylik: z.number().int().min(0).max(100_000_000_000), not: z.string().trim().max(80).default("") }))
      .max(30).default([]),
  }),
  /** Rol yetkileri (Personel › Rol yetkileri; reisim 32): modül → rol sırasıyla 6 düzey. Boş = önerilen düzen. Okuma / yazma src/server/yetki/matris.ts */
  rol_yetki: z.object({ matris: z.record(z.string().regex(/^(\d{1,2}|hareket)$/), z.array(z.enum(DUZEYLER)).length(6)).default({}) }),
  /** 437 · hazır kurulum (rapor-format/server/kurulum.ts): kurulmuş Bakanlık şablonları — bir şablon bir kez kurulur; ekranda yok, kişi yazmaz ·
      438: pdf — Bakanlık şablonlu PDF'siz türlere resmî PDF taraması yapıldı · 440: baglanti — boş standart / ölçüm cihazı taraması yapıldı ·
      450: varsayilan — formatı hiç olmayan türlere Ek-III grubuna göre hazır format taraması yapıldı */
  kurulum: z.object({ bakanlik: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{1,23}$/)).max(100).default([]), pdf: z.boolean().default(false),
    baglanti: z.boolean().default(false), varsayilan: z.boolean().default(false) }),
} as const;
export type AyarBolumu = keyof typeof AYAR_BOLUMLERI;
export type Ayar<B extends AyarBolumu> = z.infer<(typeof AYAR_BOLUMLERI)[B]>;

const FIRMA_AYAR = tablo({ ad: "firma_ayar", sutunlar: ["bolum", "deger"] });

/** başlangıç değeri (hiç kaydedilmemiş bölüm) */
export const baslangic = <B extends AyarBolumu>(b: B): Ayar<B> => AYAR_BOLUMLERI[b].parse({}) as Ayar<B>;

/** bölümü okur: kayıtlıyla başlangıç birleşir; şemaya uymayan alan başlangıç değerine döner. surum: kaydedilmemişse -1 */
export async function ayarOku<B extends AyarBolumu>(db: Sorgulayici, b: B): Promise<{ deger: Ayar<B>; surum: number; id: string | null }> {
  if (!Object.hasOwn(AYAR_BOLUMLERI, b)) throw new Error("Bilinmeyen ayar bölümü");
  const r = (await db.sorgu<{ id: string; deger: Record<string, unknown>; surum: number }>("SELECT id::text, deger, surum FROM firma_ayar WHERE bolum = $1", [b])).rows[0];
  return { deger: ayarCoz(b, r?.deger ?? {}), surum: r?.surum ?? -1, id: r?.id ?? null };
}

/** kayıtlı değer → bölüm: başlangıçla birleşir; şemaya uymayan alan başlangıç değerine döner (alan alan kurtarılır). 2026-10-25: Yönetim'in firma
    özeti (göç 0106 firma_yonetim_ozet — ham yapay zekâ ayarı) de buradan geçer */
export function ayarCoz<B extends AyarBolumu>(b: B, kayitli: Record<string, unknown>): Ayar<B> {
  const sema = AYAR_BOLUMLERI[b];
  const tam = sema.safeParse(kayitli);
  if (tam.success) return tam.data as Ayar<B>;
  const bas = baslangic(b) as Record<string, unknown>;
  return Object.fromEntries(Object.keys(bas).map((k) => {
    const deneme = sema.safeParse({ ...bas, [k]: kayitli[k] });
    return [k, deneme.success ? (deneme.data as Record<string, unknown>)[k] : bas[k]];
  })) as Ayar<B>;
}

export type AyarYazSonucu = GuncelleSonucu | { durum: "gecersiz"; hatalar: Record<string, string> };

/** anahtar sırasından bağımsız JSON (veritabanının jsonb'si anahtarları kendi sırasıyla döndürür; şemanın çıktısı şema sırasıyla) */
const kanonik = (v: unknown): unknown => Array.isArray(v) ? v.map(kanonik)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined)
    .map((k) => [k, kanonik((v as Record<string, unknown>)[k])])) : v ?? null;

/** bölümü yazar: istemcinin gördüğü sürümle (kaydedilmemişse -1); şemadan geçmeyen değer yazılmaz */
export async function ayarYaz<B extends AyarBolumu>(db: Sorgulayici, b: B, surum: number, yeni: unknown, iz: Iz): Promise<AyarYazSonucu> {
  if (!Object.hasOwn(AYAR_BOLUMLERI, b)) throw new Error("Bilinmeyen ayar bölümü");
  const s = AYAR_BOLUMLERI[b].safeParse(yeni);
  if (!s.success) return { durum: "gecersiz", hatalar: Object.fromEntries(s.error.issues.map((i) => [i.path.join("."), i.message])) };
  const mevcut = await ayarOku(db, b);
  if (mevcut.id === null) {
    if (surum !== -1) return { durum: "cakisma", guncelSurum: -1 };
    try {
      const { surum: yeniSurum } = await ekle(db, FIRMA_AYAR, { bolum: b, deger: s.data }, iz);
      return { durum: "tamam", surum: yeniSurum, degisen: ["deger"] };
    } catch (h) {
      /* aynı anda ilk kez kaydeden ikinci kişi: benzersizlik → çakışma (sessiz ezme yok) */
      if ((h as { code?: string }).code === "23505") return { durum: "cakisma", guncelSurum: 0 };
      throw h;
    }
  }
  if (surum < 0) return { durum: "cakisma", guncelSurum: mevcut.surum };   // ekran "hiç kaydedilmemiş" gördü, bu arada başkası kaydetti
  /* değer aynıysa yazılmaz, sürüm artmaz (anahtar sırası farkı değişiklik sayılmaz — 334 incelemesi: aynı değer kaydı "değişmedi" demeli) */
  if (surum === mevcut.surum && JSON.stringify(kanonik(mevcut.deger)) === JSON.stringify(kanonik(s.data))) return { durum: "degisiklik_yok", surum };
  return guncelle(db, FIRMA_AYAR, mevcut.id, surum, { deger: s.data }, iz);
}

/** belgenin sahibi muayene firması: adı ve rapor kodu (kiracının kendi satırı; RLS firma_kendi) — rapor belgesinin başlığı ve form kodu */
export async function firmaKunyesi(db: Sorgulayici): Promise<{ ad: string; kod: string }> {
  return (await db.sorgu<{ ad: string; kod: string }>("SELECT ad, rapor_kodu AS kod FROM firma")).rows[0] ?? { ad: "-", kod: "XX" };
}

/** belge başlığının künyesi (334; maket MB.logo / resmiBas): ticari ad (ayar; boşsa firma kaydı), rapor kodu, adres, e-posta, akreditasyon no,
    nüsha ve logo — logo veri adresi olarak gömülür (belge dış adrese gitmez) */
export interface BelgeKunyesi { ad: string; kod: string; nusha: number; adres: string | null; eposta: string | null; tel: string | null; akr: string | null; logo: string | null }
export async function firmaBelgeKunyesi(db: Sorgulayici, depo: Depo | null): Promise<BelgeKunyesi> {
  const f = await firmaKunyesi(db), b = (await ayarOku(db, "firma_bilgileri")).deger;
  let logo: string | null = null;
  if (b.logo && depo) {
    const d = (await db.sorgu<{ anahtar: string; tur: string }>("SELECT anahtar, tur FROM dosya WHERE id = $1 AND modul = $2 AND cop IS NULL", [b.logo, AYAR_DOSYA])).rows[0];
    /* depoda okunamayan logo (silinmiş / taşınmış nesne) belgeyi düşürmez: logo yeri boş çıkar (334 incelemesi) */
    if (d && (d.tur === "image/png" || d.tur === "image/jpeg")) {
      try { logo = `data:${d.tur};base64,${Buffer.from(await depo.oku(d.anahtar, db)).toString("base64")}`; } catch { logo = null; }
    }
  }
  return { ad: b.ad || f.ad, kod: f.kod, nusha: b.nusha, adres: b.adres || null, eposta: b.eposta || null, tel: b.tel || null, akr: b.akr || null, logo };
}

/** firma ayarlarının dosyaları (logo, ön bilgilendirme formu, bordro formatı): kayıt = firma */
export const AYAR_DOSYA = "firma_ayar";

/** firmanın belge türleri kilidi (335 incelemesi): tür ekle / kaldır, müşteriye açık belgelerin kaydı ve firmanın eklediği türde özlük belgesi
    ekleme birbirini bekler — kaldırma sayımı ile ekleme yarışmaz, kaldırılan tür seçimde kalmaz. İşlem bitince bırakılır. */
export async function belgeTurKilidi(db: Sorgulayici): Promise<void> {
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended('belge_tur:' || gecerli_firma()::text, 0))");
}

/** firma kodu (rapor numarasının başı; açılmış raporun numarası değişmez): yalnız kendi firması, 2 büyük harf A–Z (0045 sütun yetkisi).
    Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). İyimser kilit: istemcinin gördüğü kod hâlâ kayıtlıysa yazılır (sessiz ezme yok — 334
    incelemesi); koşul satır kilidi altında yeniden denetlenir, izdeki eski değer gerçek geçiştir */
export async function firmaKoduYaz(db: Sorgulayici, kod: string, gorulen: string, iz: Iz): Promise<"tamam" | "degisiklik_yok" | "cakisma"> {
  if (!/^[A-Z]{2}$/.test(kod) || !/^[A-Z]{2}$/.test(gorulen)) throw new Error("Geçersiz firma kodu");
  if (kod === gorulen) return (await firmaKunyesi(db)).kod === kod ? "degisiklik_yok" : "cakisma";
  const r = await db.sorgu<{ id: string }>("UPDATE firma SET rapor_kodu = $1 WHERE id = gecerli_firma() AND rapor_kodu = $2 RETURNING id::text", [kod, gorulen]);
  if (!r.rowCount) return (await firmaKunyesi(db)).kod === kod ? "degisiklik_yok" : "cakisma";
  await izYaz(db, { ...iz, nesne: "firma", nesneId: r.rows[0].id, eski: { rapor_kodu: gorulen }, yeni: { rapor_kodu: kod } });
  return "tamam";
}
