/* GİZLİLİK METNİ (2026-11-04; reisim: "senin işlerini yap bitir") — Google'ın izin ekranı (OAuth) ve Microsoft'un uygulama kaydı, programın herkese açık
   bir gizlilik sayfasını ister; firmanın kendi yedeği (Firma ayarları › Yedek → Google Drive / OneDrive) için şart. Sayfa src/app/(acik)/gizlilik
   (oturumsuz). Saf; Türkçe metin + Google'ın istediği "Limited Use" cümlesi İngilizce de. İletişim adresi ortamdan (PROBATA_ILETISIM_EPOSTA; depoda
   adres yok). Kilit tests/gizlilik.test.ts. */

export const GIZLILIK_SURUMU = "2026-11-04";

/** [başlık, maddeler] */
export const GIZLILIK: readonly (readonly [string, readonly string[]])[] = [
  ["probata nedir", [
    "probata, iş ekipmanı periyodik kontrol firmalarının teklif, plan, rapor, onay, fatura ve arşiv işlerini yürüttüğü bir web uygulamasıdır.",
    "Uygulamaya her firma kendi adresinden girer; bir firmanın kayıtlarını başka bir firma göremez.",
  ]],
  ["Hangi bilgiler işlenir", [
    "Firma kullanıcılarının adı, e-posta adresi ve rolleri; giriş için parolanın geri çevrilemez özeti (parolanın kendisi saklanmaz).",
    "Firmanın girdiği iş kayıtları: müşteriler, tesisler, ekipmanlar, planlar, raporlar, personel, ölçüm cihazları, sözleşmeler, teklifler, faturalar.",
    "Firmanın yüklediği dosyalar: imzalı raporlar, fotoğraflar, sertifikalar, sözleşmeler ve benzeri belgeler.",
    "Güvenlik için işlem kaydı (kim, ne zaman, ne yaptı) ve hata kaydı.",
  ]],
  ["Nerede saklanır", [
    "Veritabanı ve dosyalar Avrupa Birliği'nde (Frankfurt) barındırılır.",
    "Erişim anahtarları ve gizli bilgiler şifreli saklanır; bağlantılar şifrelidir.",
    "İmzalı raporlar firmanın belirlediği saklama süresi boyunca (en az 5 yıl) tutulur, süre dolunca silinir.",
    "Firma Google Drive ya da OneDrive bağladıysa bir yıldan eski raporların PDF'leri ve fotoğrafları, firmanın hesabında bulunduğu doğrulandıktan sonra probata'dan silinir; raporun kayıtlı bilgileri (ölçümler, sonuçlar, uygunsuzluklar) kalır. Her ekipmanın en son raporu silinmez.",
  ]],
  ["Google Drive ve OneDrive yedeği", [
    "Firma yöneticisi isterse Firma ayarları › Yedek'ten kendi Google Drive ya da OneDrive hesabını bağlar; bağlamak isteğe bağlıdır.",
    "probata bu hesaba yalnız kendi açtığı klasöre dosya yazar: Google Drive'da yalnız probata'nın oluşturduğu dosyalar (izin: drive.file), OneDrive'da yalnız uygulamanın kendi klasörü (izin: Files.ReadWrite.AppFolder). Hesaptaki öteki dosyaları göremez, okuyamaz, değiştiremez.",
    "Hesaptan yalnız hesabın e-posta adresi okunur; bu adres Yedek penceresinde hangi hesabın bağlı olduğunu göstermek için kullanılır.",
    "Yazılan dosyalar firmanın kendi kayıtlarıdır: imzalı raporlar, yüklenen belgeler ve firmanın verisinin yedeği. Bu bilgiler başka bir amaçla kullanılmaz, kimseyle paylaşılmaz, satılmaz, reklam için kullanılmaz.",
    "Erişim anahtarı şifreli saklanır. Firma yöneticisi bağlantıyı istediği an keser; anahtar silinir, yazılmış dosyalar firmanın hesabında kalır. İzin Google ya da Microsoft hesabının güvenlik ayarlarından da geri alınabilir.",
  ]],
  ["Hizmet sağlayıcılar", [
    "probata yalnız hizmetin çalışması için şu sağlayıcıları kullanır: barındırma (Vercel), veritabanı ve dosya deposu (Supabase), e-posta gönderimi (Resend), yapay zekâ özelliği açıksa yapay zekâ (Anthropic), firma bağlarsa yedek (Google Drive ya da Microsoft OneDrive).",
    "Yapay zekâ özelliğine verilen bilgiler cevap üretmek için Anthropic'e (ABD) gönderilir; ayrıntısı Kullanım koşulları'ndadır.",
    "Bilgiler bunların dışında kimseye satılmaz, kiralanmaz, verilmez.",
  ]],
  ["Firmanın payı", [
    "probata'ya girilen kişisel verilerin sorumlusu, onları giren firmadır. Firma, verisini girdiği kişileri (çalışanlar, müşteri temsilcileri) bilgilendirir.",
    "Kaydın düzeltilmesi ya da silinmesi için önce kaydı giren firmaya başvurulur.",
  ]],
];

/** Google API Hizmetleri Kullanıcı Verisi Politikası'nın istediği cümle (Google'ın inceleyicisi İngilizcesini arar) */
export const GOOGLE_SINIRLI_KULLANIM_TR =
  "probata'nın Google API'lerinden aldığı bilgileri kullanması ve başka bir uygulamaya aktarması, Sınırlı Kullanım (Limited Use) şartları dahil Google API Hizmetleri Kullanıcı Verisi Politikası'na uyar.";
export const GOOGLE_SINIRLI_KULLANIM_EN =
  "probata's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.";

/** iletişim adresi: ortamdan; biçimsizse gösterilmez */
export function iletisimAdresi(e: Record<string, string | undefined> = process.env): string | null {
  const a = (e.PROBATA_ILETISIM_EPOSTA ?? "").trim();
  return /^[^\s@<>"]{1,64}@[a-z0-9.-]{3,190}\.[a-z]{2,24}$/i.test(a) ? a : null;
}
