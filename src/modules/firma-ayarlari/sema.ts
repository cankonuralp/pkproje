/* FİRMA AYARLARI — form şemaları ve seçenekler (334; maket firma-ayarlari.html, maket-ayarlar.js; MV.ESIK, MV.IMZA_YONTEM, MV.YASAL). İstemci ve
   sunucu aynı şemayı kullanır; iletiler Türkçe. Değerler src/server/ayar/ayar.ts bölümlerine yazılır (tek kaynak, başlangıç değerleri orada). */
import { tutar, z } from "../../sema/ortak.ts";
import { ALAN_BICIMI, alanSadelestir } from "../../server/eposta/kimden.ts";

/** bölümler (sol liste ve sayfa sırası — maket ayarCiz sırası; 334'te olanlar) */
export const AYAR_BASLIK = {
  firma: "Firma bilgileri", imza: "İmza yöntemi", zimmet: "Zimmet teslim formu", saklama: "Rapor saklama süresi", onbilgi: "Ön bilgilendirme formu",
  bordro: "Bordro formatı", mesai: "Mesai takibi", esik: "Uyarı eşikleri", kod: "Rapor numarası", sabit: "Sabit giderler",
  fiyat: "Fiyat listesi", mbelge: "Müşteriye açık personel belgeleri",
  bulut: "Raporların ikinci kopyası", depo: "Supabase hesabı ve yedek", yz: "Yapay zekâ", eposta: "E-posta", ice: "Toplu içe aktarma (ilk kurulum)",
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
export const FiyatGirdisi = z.object({
  fiyatlar: z.record(z.string().regex(/^[0-9a-f-]{36}$/), z.string().max(20)),
  /** ekranın gördüğü fiyatlar (iyimser kilit; yetki vermez) */
  gorulen: z.record(z.string().regex(/^[0-9a-f-]{36}$/), z.string().max(20)),
});
/** müşteriye açık belge türleri: seçili anahtarlar (özlük türü, "atama", "eg:<eğitim türü>") */
export const MusteriBelgeGirdisi = z.object({ secili: z.array(z.string().max(40)).max(200) });
export const BelgeTuruGirdisi = z.object({
  ad: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string({ error: "Türün adını yazın." }).min(2, "Türün adını yazın.").max(60, "En çok 60 karakter.")),
  kisisel: z.boolean(),
});
/** müşteriye açılabilecek sabit türler (maket MV.musteriBelgeTur): [anahtar, ad, kişisel veri] — eğitim sertifikaları ve firmanın türleri arada */
export const MUSTERI_BELGE_BAS = [["ekipnet", "EKİPNET kayıt belgesi", false], ["diploma", "Diploma", false], ["oda", "Oda kaydı", false], ["atama", "Ekipman atama belgesi", false]] as const;
export const MUSTERI_BELGE_SON = [["kimlik", "Kimlik belgesi", true], ["saglik", "Sağlık raporu", true], ["is", "İş sözleşmesi", true], ["diger", "Diğer", true]] as const;

/* ── 336: yapay zekâ, bulut kaydı (2026-10-12: raporların ikinci kopyası), Supabase hesabı ve yedek (maket MV.YZ_MODEL, MV.BULUT_SAGLAYICI, MV.BULUT_DUZEN) ── */
/* 2026-10-12 (reisim: "yapay zekada da haiku … seçenekler olmalı daha uygun ücretlendirme için" → sunum Y1–Y4 kabul): Haiku 5.5 eklendi.
   2026-10-14 (reisim: "tek seçenek claude haiku 5.5 olsun"): TEK MODEL — Sonnet 5.5 ve Opus 5.5 kalktı, seçim yok; ekranda model adı ve fiyatı yazar
   (bütün yapay zekâ işleri bu modelle; fiyat src/server/yz/okuma.ts). */
export const YZ_MODEL = ["Claude Haiku 5.5", "1 milyon token: giriş $0,10, çıkış $0,50 · bir fotoğraftan okuma ≈ $0,0015"] as const;
/** [ad, verileri Türkiye dışında saklayabilir] — 2026-10-12 (sunum D3 kabul): "Raporların ikinci kopyası" ilk yayında yalnız Google Drive ve OneDrive;
    Dropbox, Yandex Disk ve kendi sunucusu istek gelirse */
export const BULUT_SAGLAYICI = {
  gdrive: ["Google Drive", true], onedrive: ["Microsoft OneDrive / SharePoint", true],
} as const;
export const BULUT_DUZEN = { mt: "Müşteri / Tesis", mty: "Müşteri / Tesis / Yıl", my: "Müşteri / Yıl" } as const;
/* 2026-10-12 (sunum D2 kabul): yedekte firma ayarı yok — Supabase'in günlük yedeği + probata'nın aylık arşiv yedeği kendiliğinden (eski sıklık / saat /
   saklama seçimleri kalktı). Supabase hesabı bağlama akışı (sunum D1; yayına çıkışta açılır) — Firma ayarları ve Yönetim aynı metni gösterir. */
export const SUPABASE_ADIMLAR = [
  "probata firmayı açar (Yönetim › Firma aç): adres ve ilk yöneticinin e-postası.",
  "Firma yöneticisi adrese girer, geçici parolayla kendi parolasını belirler.",
  "İlk iş “Supabase hesabını bağla”: Supabase'in kendi giriş ve izin ekranı açılır; yönetici Supabase hesabıyla girip izin verir. Anahtar kopyalanmaz, parola paylaşılmaz.",
  "probata, firmanın hesabında Frankfurt'ta proje kurar; tabloları ve güvenlik ayarlarını yükler (birkaç dakika). Firmanın verisi o andan itibaren yalnız orada.",
  "Yönetici Supabase'te Pro paketi (25 $/ay) ve ödeme yöntemini seçer; fatura doğrudan firmaya gelir.",
  "Bağlantı, kullanım ve yedek bu bölümde görünür; probata'da yalnız “hangi adres → hangi proje” kaydı kalır.",
] as const;
export const YzGirdisi = z.object({
  acik: z.boolean(),
  sinir: z.preprocess((v) => (typeof v === "string" ? v.trim().replace(",", ".") : v),
    z.string().regex(/^(\d{1,5}(\.\d{1,2})?)?$/, "Sayı yazılmalı (ör. 20). Kaydedilmedi.")).transform((s) => (s === "" ? null : Number(s)))
    .refine((n) => n === null || n <= 10000, "En çok 10.000 $."),
});
/** Anthropic API anahtarı (sk-ant- ile başlar); şifreli saklanır, ekranda son 4 hane */
export const AnahtarGirdisi = z.object({ anahtar: z.preprocess((v) => (typeof v === "string" ? v.trim() : v),
  z.string({ error: "Anahtarı yapıştırın." }).min(1, "Anahtarı yapıştırın.").regex(/^sk-ant-[A-Za-z0-9_-]{16,200}$/, "Geçerli bir Anthropic API anahtarı değil (sk-ant- ile başlar).")) });
export const BulutGirdisi = z.object({
  saglayici: z.enum(["", "gdrive", "onedrive"], { error: "Hizmet seçin." }),
  kok: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Ana klasör adı yazın.").max(80, "En çok 80 karakter.")
    .refine((s) => !/[\\/:*?"<>|]/.test(s), "Klasör adında \\ / : * ? \" < > | kullanılamaz.")),
  duzen: z.enum(["mt", "mty", "my"], { error: "Klasör düzeni seçin." }),
});

/* ── 536 E-POSTA (maket postaCiz 535; reisim "A": her firma kendi Resend hesabı; "kim mail gönder tuşuna basarsa onun mailinden gitmeli") ── */
export const RESEND_ADIMLAR = [
  "resend.com'da firma adına hesap açın (ayda 3.000, günde 100 e-postaya kadar ücretsiz).",
  "Domains › Add domain: firmanızın alan adı (ör. firmaniz.com.tr).",
  "Resend'in verdiği kayıtları alan adınızın yönetim paneline ekleyin (alan adını aldığınız firma); Resend “Verified” deyince hazır.",
  "API Keys › Create API key: izin “Sending access”.",
  "Anahtarı aşağıya yapıştırın, alan adını yazıp kaydedin; “Deneme e-postası gönder”e basın.",
] as const;
/** gönderen alan adı (Resend'de doğrulanmış; boş = bağlı değil) ve gönderene gizli kopya */
export const EpostaGirdisi = z.object({
  alan: z.preprocess((v) => (typeof v === "string" ? alanSadelestir(v) : v),
    z.string().max(100, "En çok 100 karakter.").refine((a) => a === "" || ALAN_BICIMI.test(a), "Alan adı okunamadı (ör. firmaniz.com.tr). Kaydedilmedi.")),
  kopya: z.boolean(),
});
/** Resend API anahtarı (re_ ile başlar); şifreli saklanır, ekranda son 4 hane */
export const ResendAnahtarGirdisi = z.object({ anahtar: z.preprocess((v) => (typeof v === "string" ? v.trim() : v),
  z.string({ error: "Anahtarı yapıştırın." }).min(1, "Anahtarı yapıştırın.").regex(/^re_[A-Za-z0-9_]{16,200}$/, "Geçerli bir Resend API anahtarı değil (re_ ile başlar).")) });

/** dosya ayarları (logo, ön bilgilendirme formu, bordro formatı): ayar alanı, izinli türler, en çok boyut */
export const AYAR_DOSYASI = {
  logo: { bolum: "firma_bilgileri", alan: "logo", turler: ["png", "jpeg"], mb: 2, ad: "Firma logosu" },
  on_bilgi: { bolum: "belge_sablon", alan: "on_bilgi", turler: ["pdf"], mb: 10, ad: "Ön bilgilendirme formu" },
  bordro_format: { bolum: "belge_sablon", alan: "bordro_format", turler: ["pdf", "xlsx"], mb: 10, ad: "Bordro formatı" },
} as const;
export type AyarDosyasi = keyof typeof AYAR_DOSYASI;
