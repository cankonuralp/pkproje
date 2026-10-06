/* FİRMA AYARLARI — form şemaları ve seçenekler (334; maket firma-ayarlari.html, maket-ayarlar.js; MV.ESIK, MV.IMZA_YONTEM, MV.YASAL). İstemci ve
   sunucu aynı şemayı kullanır; iletiler Türkçe. Değerler src/server/ayar/ayar.ts bölümlerine yazılır (tek kaynak, başlangıç değerleri orada). */
import { tutar, z } from "../../sema/ortak.ts";

/** bölümler (sol liste ve sayfa sırası — maket ayarCiz sırası; 334'te olanlar) */
export const AYAR_BASLIK = {
  firma: "Firma bilgileri", imza: "İmza yöntemi", zimmet: "Zimmet teslim formu", saklama: "Rapor saklama süresi", onbilgi: "Ön bilgilendirme formu",
  bordro: "Bordro formatı", mesai: "Mesai takibi", esik: "Uyarı eşikleri", kod: "Rapor numarası", sabit: "Sabit giderler",
  fiyat: "Fiyat listesi", mbelge: "Müşteriye açık personel belgeleri",
  bulut: "Bulut kaydı", depo: "Depolama ve yedek", yz: "Yapay zekâ",
} as const;
export type AyarKesimi = keyof typeof AYAR_BASLIK;

export const IMZA_YONTEM = { mobil: ["Mobil imza", "telefonda PIN, her belge ayrı"], e_imza: ["E-imza", "kart ve imza aracı, tek PIN"] } as const;
export const NUSHA = [1, 2, 3, 4] as const;
export const SAKLAMA_YIL = [5, 6, 7, 8, 9, 10, 15, 20] as const;
/** uyarı eşikleri (maket MV.ESIK): ad, açıklama, başlangıç, seçenekler (gün) */
export const ESIK = {
  kalibrasyon: ["Kalibrasyon bitişi", "cihazın kalibrasyonu bu kadar gün kala uyarı", 30, [15, 30, 45, 60, 90]],
  kontrolu_yaklasan_tesis: ["Kontrolü yaklaşan tesis", "müşteri listesi ve ana sayfada", 30, [15, 30, 45, 60, 90]],
  plan_kontrolu_geliyor: ["Plan açarken “kontrolü geliyor”", "sonraki kontrolü plan gününden en çok bu kadar gün sonra olan ekipman", 30, [15, 30, 45, 60, 90]],
  egitim: ["Eğitim tekrarı", "tekrar tarihine bu kadar gün kala uyarı", 60, [30, 45, 60, 90, 120]],
} as const;
export type EsikAdi = keyof typeof ESIK;
/** İş Kanunu (AA2): yıllık fazla çalışma en çok 270 saat (41. madde), günlük çalışma 11 saati (660 dk) aşamaz (63. madde) */
export const YASAL = { yillikSaat: 270, gunlukDk: 660 } as const;

const metin = (en: number, ileti: string) => z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().max(en, ileti));
const secim = <T extends readonly number[]>(l: T, ileti: string) => z.coerce.number().refine((n) => (l as readonly number[]).includes(n), ileti);

export const FirmaBilgiGirdisi = z.object({
  ad: metin(120, "En çok 120 karakter."), adres: metin(200, "En çok 200 karakter."),
  eposta: metin(120, "En çok 120 karakter.").refine((e) => e === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), "Geçerli bir e-posta yazın."),
  akr: metin(20, "En çok 20 karakter."), nusha: secim(NUSHA, "Nüsha sayısı seçin."),
});
export const ImzaGirdisi = z.object({ yontem: z.enum(["mobil", "e_imza"], { error: "İmza yöntemi seçin." }) });
export const ZimmetGirdisi = z.object({ teslim_eden: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^[0-9a-f-]{36}$/, "Kişi seçin.").nullable()) });
export const SaklamaGirdisi = z.object({ yil: secim(SAKLAMA_YIL, "Saklama süresi seçin.") });
const dk = (en: number, enCok: number, ileti: string) => z.preprocess((v) => (typeof v === "string" ? v.trim() : v),
  z.string().regex(/^\d{1,4}$/, ileti).transform(Number).refine((n) => n >= en && n <= enCok, ileti));
export const MesaiGirdisi = z.object({
  acik: z.boolean(),
  normal_dk: dk(1, 1440, "1–1440 arası dakika yazın."),
  mesai_dk: dk(0, 1440, "0–1440 arası dakika yazın."),
  yillik_fazla_saat: dk(0, YASAL.yillikSaat, "0–270 saat yazın (kanundaki üst sınır 270)."),
});
const esik = (k: EsikAdi) => secim(ESIK[k][3], "Eşik seçin.");
export const EsikGirdisi = z.object({
  kalibrasyon: esik("kalibrasyon"), kontrolu_yaklasan_tesis: esik("kontrolu_yaklasan_tesis"), plan_kontrolu_geliyor: esik("plan_kontrolu_geliyor"), egitim: esik("egitim"),
});
/** firma kodu: 2 harf A–Z (rapor numarasının başı ve DB biçimi; Türkçe harf numaraya girmez). Büyütme yerelden bağımsız (i → I; Türkçe yerelde
    "İ" olur ve reddedilirdi — 334 incelemesi, ortak.ts ekipmanKodu ile aynı). gorulen: ekranın gördüğü kod (iyimser kilit) */
export const kodBuyut = (s: string) => s.trim().toUpperCase();
const kodAlani = (ileti: string) => z.preprocess((v) => (typeof v === "string" ? kodBuyut(v) : v), z.string().regex(/^[A-Z]{2}$/, ileti));
export const KodGirdisi = z.object({ kod: kodAlani("2 harf olmalı (A–Z; ör. KM). Kaydedilmedi."), gorulen: kodAlani("Sayfayı yenileyin.") });
/** temel ön bilgilendirme formunun kodu (teklif belgesi teklifFormKodu gibi: firma kodu + form) */
export const onBilgiFormKodu = (kod: string) => `${kod}-FR-OBF-01`;
export const SabitGiderGirdisi = z.object({
  kalemler: z.array(z.object({ ad: metin(60, "En çok 60 karakter."), aylik: tutar, not: metin(80, "En çok 80 karakter.") })).max(30, "En çok 30 kalem."),
});

/** fiyat listesi (335): tür → TL (boş: fiyatsız; doluysa sıfırdan büyük) */
export const FiyatGirdisi = z.object({ fiyatlar: z.record(z.string().regex(/^[0-9a-f-]{36}$/), z.string().max(20)) });
/** müşteriye açık belge türleri: seçili anahtarlar (özlük türü, "atama", "eg:<eğitim türü>") */
export const MusteriBelgeGirdisi = z.object({ secili: z.array(z.string().max(40)).max(200) });
export const BelgeTuruGirdisi = z.object({
  ad: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string({ error: "Türün adını yazın." }).min(2, "Türün adını yazın.").max(60, "En çok 60 karakter.")),
  kisisel: z.boolean(),
});
/** müşteriye açılabilecek sabit türler (maket MV.musteriBelgeTur): [anahtar, ad, kişisel veri] — eğitim sertifikaları ve firmanın türleri arada */
export const MUSTERI_BELGE_BAS = [["ekipnet", "EKİPNET kayıt belgesi", false], ["diploma", "Diploma", false], ["oda", "Oda kaydı", false], ["atama", "Ekipman atama belgesi", false]] as const;
export const MUSTERI_BELGE_SON = [["kimlik", "Kimlik belgesi", true], ["saglik", "Sağlık raporu", true], ["is", "İş sözleşmesi", true], ["diger", "Diğer", true]] as const;

/* ── 336: yapay zekâ, bulut kaydı, yedek (maket MV.YZ_MODEL, MV.BULUT_SAGLAYICI, MV.BULUT_DUZEN, YEDEK_SIK, YEDEK_GUN) ── */
export const YZ_MODEL = { opus: ["Claude Opus 5.5", "daha doğru · 1 milyon token: giriş $4, çıkış $20"], sonnet: ["Claude Sonnet 5.5", "yarı fiyat · 1 milyon token: giriş $2, çıkış $10"] } as const;
/** [ad, verileri Türkiye dışında saklayabilir] */
export const BULUT_SAGLAYICI = {
  gdrive: ["Google Drive", true], onedrive: ["Microsoft OneDrive / SharePoint", true], dropbox: ["Dropbox", true], yandex: ["Yandex Disk", true],
  sftp: ["Kendi sunucunuz (SFTP / WebDAV)", false],
} as const;
export const BULUT_DUZEN = { mt: "Müşteri / Tesis", mty: "Müşteri / Tesis / Yıl", my: "Müşteri / Yıl" } as const;
export const YEDEK_SIK = { saatlik: "Saatlik", gunluk: "Günlük", haftalik: "Haftalık (Pazartesi)" } as const;
export const YEDEK_GUN = [30, 90, 365] as const;
export const YzGirdisi = z.object({
  acik: z.boolean(), model: z.enum(["opus", "sonnet"], { error: "Model seçin." }),
  sinir: z.preprocess((v) => (typeof v === "string" ? v.trim().replace(",", ".") : v),
    z.string().regex(/^(\d{1,5}(\.\d{1,2})?)?$/, "Sayı yazılmalı (ör. 20). Kaydedilmedi.")).transform((s) => (s === "" ? null : Number(s)))
    .refine((n) => n === null || n <= 10000, "En çok 10.000 $."),
});
/** Anthropic API anahtarı (sk-ant- ile başlar); şifreli saklanır, ekranda son 4 hane */
export const AnahtarGirdisi = z.object({ anahtar: z.preprocess((v) => (typeof v === "string" ? v.trim() : v),
  z.string({ error: "Anahtarı yapıştırın." }).min(1, "Anahtarı yapıştırın.").regex(/^sk-ant-[A-Za-z0-9_-]{16,200}$/, "Geçerli bir Anthropic API anahtarı değil (sk-ant- ile başlar).")) });
export const BulutGirdisi = z.object({
  saglayici: z.enum(["", "gdrive", "onedrive", "dropbox", "yandex", "sftp"], { error: "Bulut seçin." }),
  kok: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Ana klasör adı yazın.").max(80, "En çok 80 karakter.")
    .refine((s) => !/[\\/:*?"<>|]/.test(s), "Klasör adında \\ / : * ? \" < > | kullanılamaz.")),
  duzen: z.enum(["mt", "mty", "my"], { error: "Klasör düzeni seçin." }),
});
export const YedekGirdisi = z.object({
  sik: z.enum(["saatlik", "gunluk", "haftalik"], { error: "Sıklık seçin." }),
  saat: z.string().regex(/^([01][0-9]|2[0-3])$/, "Saat seçin."),
  gun: z.coerce.number().refine((n) => (YEDEK_GUN as readonly number[]).includes(n), "Saklama seçin."),
});

/** dosya ayarları (logo, ön bilgilendirme formu, bordro formatı): ayar alanı, izinli türler, en çok boyut */
export const AYAR_DOSYASI = {
  logo: { bolum: "firma_bilgileri", alan: "logo", turler: ["png", "jpeg"], mb: 2, ad: "Firma logosu" },
  on_bilgi: { bolum: "belge_sablon", alan: "on_bilgi", turler: ["pdf"], mb: 10, ad: "Ön bilgilendirme formu" },
  bordro_format: { bolum: "belge_sablon", alan: "bordro_format", turler: ["pdf", "xlsx"], mb: 10, ad: "Bordro formatı" },
} as const;
export type AyarDosyasi = keyof typeof AYAR_DOSYASI;
