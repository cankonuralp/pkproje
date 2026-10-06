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
      rapor e-postası, akreditasyon no · logo (dosya; raporların ve belgelerin başlığına) */
  firma_bilgileri: z.object({
    nusha: gun(1, 5).default(2),
    ad: z.string().trim().max(120).default(""),
    adres: z.string().trim().max(200).default(""),
    eposta: z.string().trim().max(120).refine((e) => e === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).default(""),
    akr: z.string().trim().max(20).default(""),
    logo: kimlik.default(null),
  }),
  /** Zimmet teslim formu (196): firma adına teslim edenin başlangıç değeri (personel; formda değiştirilebilir) */
  zimmet: z.object({ teslim_eden: kimlik.default(null) }),
  /** firmanın belge şablonları (334): ön bilgilendirme formu (N1; yoksa temel format KM-FR-OBF-01) ve bordro formatı (BB5) — dosya kimlikleri */
  belge_sablon: z.object({ on_bilgi: kimlik.default(null), bordro_format: kimlik.default(null) }),
  /** İmza yöntemi (mobil / e-imza) */
  imza: z.object({ yontem: z.enum(["mobil", "e_imza"]).default("mobil") }),
  /** Mesai takibi (212, AA2): normal 480 dk, mesai 180 dk, yıllık fazla çalışma ≤ 270 saat, günlük ≤ 660 dk */
  mesai: z.object({
    acik: z.boolean().default(false),
    normal_dk: gun(60, 660).default(480),
    mesai_dk: gun(0, 600).default(180),
    yillik_fazla_saat: gun(0, 270).default(270),
    gunluk_ust_dk: gun(60, 660).default(660),
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
  /** Yapay zekâ (aç / kapa, kişi başı aylık sınır); API anahtarı sırlarda. 336 (maket yzCiz, Y1): model (Opus / Sonnet) ve kişi başı aylık sınır
      ABD doları (null = sınırsız; başlangıç 20). kisi_aylik_sinir eski alan, kullanılmıyor. */
  yapay_zeka: z.object({
    acik: z.boolean().default(false), kisi_aylik_sinir: gun(0, 100000).default(200),
    model: z.enum(["opus", "sonnet"]).default("opus"),
    sinir: z.number().min(0).max(10000).nullable().default(20),
  }),
  /** Bulut kaydı (336; maket bulutCiz, Ö2): sağlayıcı, ana klasör, klasör düzeni — hesap bağlantısı ve kendiliğinden kayıt K5 */
  bulut: z.object({
    saglayici: z.enum(["", "gdrive", "onedrive", "dropbox", "yandex", "sftp"]).default(""),
    kok: z.string().trim().min(1).max(80).default("probata Raporlar"),
    duzen: z.enum(["mt", "mty", "my"]).default("mt"),
  }),
  /** Yedek (336; maket depoCiz — G2/G3: "elle yedekleme olmasın"): sıklık, saat (günlük / haftalık), yedeklerin saklanması (gün); aylık ilk yedek
      saklama süresi kadar. Yedek işi K5 (iş kuyruğu), firmanın deposu K7. */
  yedek: z.object({
    sik: z.enum(["saatlik", "gunluk", "haftalik"]).default("gunluk"),
    saat: z.string().regex(/^([01][0-9]|2[0-3])$/).default("03"),
    gun: z.union([z.literal(30), z.literal(90), z.literal(365)]).default(30),
  }),
  /** Tarafsızlık ve çıkar çatışması beyanı (§3.7 satır 3; karar 26): kalite el kitabındaki metin; boşsa varsayılan. Kabul anındaki metin plana yazılır */
  beyan: z.object({ metin: z.string().trim().min(20).max(4000).default(VARSAYILAN_BEYAN) }),
  /** Müşteriye açık personel belgeleri (323; maket firma-ayarlari "Müşteriye açık personel belgeleri", P3): müşteri panelinin "Muayene personeli"
      sekmesinde görünen türler — özlük türleri, seçili eğitim türlerinin sertifikaları, ekipman atama belgesi. Başlangıç: yalnız EKİPNET; eğitim
      sertifikası yok (maketteki gibi tür başına açılır, "hepsi" yok; sonradan eklenen tür kapalı başlar — 320–323 incelemesi). Veritabanı işlevi
      musteri_personel_belgeleri ayar yokken aynısını uygular (0035, kilit testi) */
  musteri_belge: z.object({
    ozluk: z.array(z.string().regex(/^[a-z0-9]{2,12}$/)).max(30).default(["ekipnet"]),
    egitim: z.array(z.string().regex(/^[0-9a-f-]{36}$/)).max(100).default([]),
    atama: z.boolean().default(false),
  }),
  /** Firmanın eklediği özlük belge türleri (335; maket Z5 "Belge türü ekle"): anahtar ek1–ek30, ad, kişisel veri mi. Personel'de özlük belgesi
      yüklerken seçilir, müşteriye açılabilir (başlangıçta kapalı); kaldırma yalnız o türde belge yokken */
  belge_tur_ek: z.object({
    turler: z.array(z.object({ k: z.string().regex(/^ek([1-9]|[12][0-9]|30)$/), ad: z.string().trim().min(2).max(60), kisisel: z.boolean().default(false) })).max(30).default([]),
  }),
  /** Sabit giderler (328; maket MV.SABIT_GIDER — araç kira, ofis kirası, ofis giderleri, vergi ve harçlar …): ad, aylık tutar (KURUŞ), not.
      Gelir-gider ve kârlılığın genel gider payı buradan; başlangıçta boş (firma girer — Firma ayarları) */
  sabit_gider: z.object({
    kalemler: z.array(z.object({ ad: z.string().trim().min(2).max(60), aylik: z.number().int().min(0).max(100_000_000_000), not: z.string().trim().max(80).default("") }))
      .max(30).default([]),
  }),
  /** Rol yetkileri (Personel › Rol yetkileri; reisim 32): modül → rol sırasıyla 6 düzey. Boş = önerilen düzen. Okuma / yazma src/server/yetki/matris.ts */
  rol_yetki: z.object({ matris: z.record(z.string().regex(/^(\d{1,2}|hareket)$/), z.array(z.enum(DUZEYLER)).length(6)).default({}) }),
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
  const sema = AYAR_BOLUMLERI[b];
  const kayitli = r?.deger ?? {};
  const tam = sema.safeParse(kayitli);
  if (tam.success) return { deger: tam.data as Ayar<B>, surum: r?.surum ?? -1, id: r?.id ?? null };
  /* alan alan kurtar: geçerli alan kalır, bozuk alan başlangıca döner */
  const bas = baslangic(b) as Record<string, unknown>;
  const kurtarilan = Object.fromEntries(Object.keys(bas).map((k) => {
    const deneme = sema.safeParse({ ...bas, [k]: kayitli[k] });
    return [k, deneme.success ? (deneme.data as Record<string, unknown>)[k] : bas[k]];
  }));
  return { deger: kurtarilan as Ayar<B>, surum: r?.surum ?? -1, id: r?.id ?? null };
}

export type AyarYazSonucu = GuncelleSonucu | { durum: "gecersiz"; hatalar: Record<string, string> };

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
  return guncelle(db, FIRMA_AYAR, mevcut.id, surum, { deger: s.data }, iz);
}

/** belgenin sahibi muayene firması: adı ve rapor kodu (kiracının kendi satırı; RLS firma_kendi) — rapor belgesinin başlığı ve form kodu */
export async function firmaKunyesi(db: Sorgulayici): Promise<{ ad: string; kod: string }> {
  return (await db.sorgu<{ ad: string; kod: string }>("SELECT ad, rapor_kodu AS kod FROM firma")).rows[0] ?? { ad: "-", kod: "XX" };
}

/** belge başlığının künyesi (334; maket MB.logo / resmiBas): ticari ad (ayar; boşsa firma kaydı), rapor kodu, adres, e-posta, akreditasyon no,
    nüsha ve logo — logo veri adresi olarak gömülür (belge dış adrese gitmez) */
export interface BelgeKunyesi { ad: string; kod: string; nusha: number; adres: string | null; eposta: string | null; akr: string | null; logo: string | null }
export async function firmaBelgeKunyesi(db: Sorgulayici, depo: Depo | null): Promise<BelgeKunyesi> {
  const f = await firmaKunyesi(db), b = (await ayarOku(db, "firma_bilgileri")).deger;
  let logo: string | null = null;
  if (b.logo && depo) {
    const d = (await db.sorgu<{ anahtar: string; tur: string }>("SELECT anahtar, tur FROM dosya WHERE id = $1 AND modul = $2 AND cop IS NULL", [b.logo, AYAR_DOSYA])).rows[0];
    if (d && (d.tur === "image/png" || d.tur === "image/jpeg")) logo = `data:${d.tur};base64,${Buffer.from(await depo.oku(d.anahtar)).toString("base64")}`;
  }
  return { ad: b.ad || f.ad, kod: f.kod, nusha: b.nusha, adres: b.adres || null, eposta: b.eposta || null, akr: b.akr || null, logo };
}

/** firma ayarlarının dosyaları (logo, ön bilgilendirme formu, bordro formatı): kayıt = firma */
export const AYAR_DOSYA = "firma_ayar";

/** firma kodu (rapor numarasının başı; açılmış raporun numarası değişmez): yalnız kendi firması, 2 büyük harf A–Z (0045 sütun yetkisi).
    Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). Değiştiyse true */
export async function firmaKoduYaz(db: Sorgulayici, kod: string, iz: Iz): Promise<boolean> {
  if (!/^[A-Z]{2}$/.test(kod)) throw new Error("Geçersiz firma kodu");
  const eski = (await firmaKunyesi(db)).kod;
  const r = await db.sorgu<{ id: string }>("UPDATE firma SET rapor_kodu = $1 WHERE id = gecerli_firma() AND rapor_kodu <> $1 RETURNING id::text", [kod]);
  if (!r.rowCount) return false;
  await izYaz(db, { ...iz, nesne: "firma", nesneId: r.rows[0].id, eski: { rapor_kodu: eski }, yeni: { rapor_kodu: kod } });
  return true;
}
