/* FİRMA AYARLARI — form şemaları ve seçenekler (334; maket firma-ayarlari.html, maket-ayarlar.js; MV.ESIK, MV.IMZA_YONTEM, MV.YASAL). İstemci ve
   sunucu aynı şemayı kullanır; iletiler Türkçe. Değerler src/server/ayar/ayar.ts bölümlerine yazılır (tek kaynak, başlangıç değerleri orada). */
import { tutar, z } from "../../sema/ortak.ts";

/** bölümler (sol liste ve sayfa sırası — maket ayarCiz sırası; 334'te olanlar) */
export const AYAR_BASLIK = {
  firma: "Firma bilgileri", imza: "İmza yöntemi", zimmet: "Zimmet teslim formu", saklama: "Rapor saklama süresi", onbilgi: "Ön bilgilendirme formu",
  bordro: "Bordro formatı", mesai: "Mesai takibi", esik: "Uyarı eşikleri", kod: "Rapor numarası", sabit: "Sabit giderler",
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
/** firma kodu: 2 harf A–Z (rapor numarasının başı ve DB biçimi; Türkçe harf numaraya girmez) */
export const KodGirdisi = z.object({ kod: z.preprocess((v) => (typeof v === "string" ? v.trim().toLocaleUpperCase("tr") : v),
  z.string().regex(/^[A-Z]{2}$/, "2 harf olmalı (A–Z; ör. KM). Kaydedilmedi.")) });
export const SabitGiderGirdisi = z.object({
  kalemler: z.array(z.object({ ad: metin(60, "En çok 60 karakter."), aylik: tutar, not: metin(80, "En çok 80 karakter.") })).max(30, "En çok 30 kalem."),
});

/** dosya ayarları (logo, ön bilgilendirme formu, bordro formatı): ayar alanı, izinli türler, en çok boyut */
export const AYAR_DOSYASI = {
  logo: { bolum: "firma_bilgileri", alan: "logo", turler: ["png", "jpeg"], mb: 2, ad: "Firma logosu" },
  on_bilgi: { bolum: "belge_sablon", alan: "on_bilgi", turler: ["pdf"], mb: 10, ad: "Ön bilgilendirme formu" },
  bordro_format: { bolum: "belge_sablon", alan: "bordro_format", turler: ["pdf", "xlsx"], mb: 10, ad: "Bordro formatı" },
} as const;
export type AyarDosyasi = keyof typeof AYAR_DOSYASI;
