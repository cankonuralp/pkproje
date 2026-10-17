/* YÜKLENEN İMZALI PDF'İN KRİPTOGRAFİK DENETİMİ (IMZA-SERVISI.md ES1 — yükleme denetimi, 2026-10-17). Saf. Yapı denetiminin (src/modules/raporlar/imza-pdf.ts
   imzaliPdfGecerli — önek imzasız PDF'in kendisi, ek beyaz listede) ARDINDAN çalışır; eklenen her imza için:
   · imza özgün belgenin TAMAMINI kapsar (imzanın dışında kalan /Contents boşluğu önekten sonra);
   · bütünlük ve imza değeri sağlam (pdf-imzalar.ts); imza zaman damgası varsa o da sağlam; eklenen belge zaman damgası sağlam;
   · imzalayanın sertifikası imzalı signingCertificate özniteliğine BAĞLI (imzasız alanlar değiştirilerek başka sertifika gösterilemez), 5070
     nitelikli (qcStatements) ve imza anında geçerli — imza anı: sağlam zaman damgası (sunucusu denetlenmiş) varsa onun zamanı, yoksa yükleme anı
     (imzalayanın bilgisayar saati /M güvenilmez);
   · imzadan sonra belgede izinsiz değişiklik yok (pdf-imzalar.ts sonrakiEkler — yapı denetimi de ayrıca bakar).
   Güvenilir kök listesi henüz yok (resmî kaynaktan teyitle eklenecek): uydurma ama "nitelikli" işaretli sertifikayı bu denetim tek başına
   yakalamaz; Adobe'nin kendi ürettiği kimlik gibi işaretsiz sertifikayı yakalar. Ret nedeni ekranda gösterilir (Türkçe, kısa). */
import { pdfImzalariniCozumle, type ImzaBilgisi } from "./pdf-imzalar.ts";
import { gecerliMi } from "./sertifika.ts";

const sagMi = (i: ImzaBilgisi) => i.butunluk === "tamam" && i.imzaDegeri === "tamam";
const tarih = (iso: string | null) => (iso ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short" }).format(new Date(iso)) : "?");

/** eklenen imzalar sağlam mı: değilse ekranda gösterilecek neden, sağlamsa null */
export function ekImzaNedeni(imzasiz: Uint8Array, imzali: Uint8Array, simdi: Date = new Date()): string | null {
  const c = pdfImzalariniCozumle(imzali);
  const ek = c.imzalar.filter((i) => i.kapsamSon > imzasiz.length);
  const imzalar = ek.filter((i) => i.tur === "imza");
  if (!imzalar.length) return "PDF'te doğrulanabilir bir e-imza bulunamadı. Kartınızdaki nitelikli sertifikayla imzalayıp yeniden yükleyin.";
  for (const i of ek) {
    if (i.boslukBas < imzasiz.length) return "PDF'teki imza belgenin tamamını kapsamıyor.";
    if (i.tur === "belge_damgasi") { if (!sagMi(i)) return "PDF'teki zaman damgası doğrulanamadı."; continue; }
    if (i.butunluk === "bozuk") return "PDF imzalandıktan sonra değiştirilmiş; imza bu belgeyi doğrulamıyor.";
    if (!sagMi(i)) return "PDF'teki e-imza doğrulanamadı (imza okunamadı ya da tutmuyor).";
    if (i.damga && (i.damga.iz !== "tamam" || i.damga.imza !== "tamam")) return "İmzadaki zaman damgası doğrulanamadı.";
    const s = i.imzalayan;
    if (!s) return "PDF'teki imzanın sertifikası okunamadı.";
    if (i.sertifikaBagi !== true) return "PDF'teki imzanın sertifikası imzaya bağlı değil (imzalayan sertifikası doğrulanamadı).";
    if (i.sonrakiEkler.durum === "degisiklik") return "PDF imzalandıktan sonra değiştirilmiş; imza bu belgeyi doğrulamıyor.";
    if (!s.nitelikli) return "PDF'teki imza nitelikli elektronik sertifikayla atılmamış (5070 sayılı Kanun). Kartınızdaki nitelikli sertifikayla imzalayın.";
    const an = i.damga?.zaman ?? simdi.toISOString();
    if (gecerliMi(s, an) !== true) return `İmzanın sertifikası imza anında geçerli değil (geçerlilik ${tarih(s.gecerlilikBas)} – ${tarih(s.gecerlilikSon)}).`;
  }
  return null;
}
