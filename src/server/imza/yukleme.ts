/* YÜKLENEN İMZALI PDF'İN KRİPTOGRAFİK DENETİMİ (IMZA-SERVISI.md ES1 — yükleme denetimi, 2026-10-17). Saf. Yapı denetiminin (src/modules/raporlar/imza-pdf.ts
   imzaliPdfGecerli — önek imzasız PDF'in kendisi, ek beyaz listede) ARDINDAN çalışır; eklenen her imza için:
   · imza özgün belgenin TAMAMINI kapsar (imzanın dışında kalan /Contents boşluğu önekten sonra);
   · bütünlük ve imza değeri sağlam (pdf-imzalar.ts); imza zaman damgası varsa o da sağlam; eklenen belge zaman damgası sağlam;
   · imzalayanın sertifikası imzalı signingCertificate özniteliğine BAĞLI (imzasız alanlar değiştirilerek başka sertifika gösterilemez), 5070
     nitelikli (qcStatements) ve YÜKLEME ANINDA geçerli (2026-10-18: zaman damgasının zamanı kullanılmaz — damga sunucusu güvenilir listeye bağlı
     değil, geriye tarihli damga basılabilir; imzalayanın bilgisayar saati /M de güvenilmez);
   · imzalayanın sertifikası iptal edilmemiş (2026-10-18 ilk hâli; 2026-10-23 probata-sign denetimi 2026-10-18, YÜKSEK — kanıtın zamanı): DSS'teki
     sağlam kanıtların hepsi zamanlarıyla (pdf-imzalar.ts iptalKanitlari) iptal.ts iptalKarari'na YÜKLEME ANINA göre verilir — damga anına
     güvenilmez (yukarıdaki gerekçe): yükleme anında ya da önce "iptal" diyen kanıt (iptal anı okunamasa da) ret, "geçerli" diyen başka kanıt
     bunu ezemez; çözümleyicinin damga anına göre kararı (i.iptal) "iptal" ise de ret. Kanıtı olmayan imza (DSS yok ya da kanıt o anı
     kanıtlamıyor) bugünkü gibi kabul — kanıtı ağdan almak probata'da yok (imza üretimiyle birlikte probata-sign'da);
   · imzadan sonra belgede izinsiz değişiklik yok (pdf-imzalar.ts sonrakiEkler — yapı denetimi de ayrıca bakar).
   Güvenilir kök listesi henüz yok (resmî kaynaktan teyitle eklenecek): uydurma ama "nitelikli" işaretli sertifikayı bu denetim tek başına
   yakalamaz; Adobe'nin kendi ürettiği kimlik gibi işaretsiz sertifikayı yakalar. Ret nedeni ekranda gösterilir (Türkçe, kısa). */
import { iptalKarari } from "./iptal.ts";
import { pdfImzalariniCozumle, type ImzaBilgisi } from "./pdf-imzalar.ts";
import { gecerliMi } from "./sertifika.ts";

const sagMi = (i: ImzaBilgisi) => i.butunluk === "tamam" && i.imzaDegeri === "tamam";
const tarih = (iso: string | null) => (iso ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short" }).format(new Date(iso)) : "?");

/** eklenen imzalar sağlam mı: değilse ekranda gösterilecek neden, sağlamsa null */
export function ekImzaNedeni(imzasiz: Uint8Array, imzali: Uint8Array, simdi: Date = new Date()): string | null {
  const c = pdfImzalariniCozumle(imzali, { simdi });
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
    /* 2026-10-18: zaman damgası sunucusu güvenilir listeye bağlı değil (liste yok) — herkes kendi damga sunucusuyla geriye tarihli damga
       basabilir; süresi dolmuş sertifika böyle "imza anında geçerli" görünüyordu. İmza anı olarak yükleme anı (imza ondan önce atıldı): sertifika
       ŞİMDİ geçerli olmalı */
    const an = simdi.toISOString();
    /* 2026-10-18 (probata-sign incelemesinin uyarısı) + 2026-10-23 (kanıtın zamanı): belgedeki iptal kanıtı (DSS — imzası ve bu sertifikaya ait
       olduğu doğrulanmış) yükleme anında ya da önce "iptal" diyorsa kabul yok; aynı gerekçeyle karar damga anına değil yükleme anına göre */
    if (i.iptal === "iptal" || iptalKarari(i.iptalKanitlari, an) === "iptal") return "PDF'teki imzanın sertifikası iptal edilmiş (belgedeki iptal kanıtına göre).";
    if (gecerliMi(s, an) !== true) return `İmzanın sertifikası geçerli değil (geçerlilik ${tarih(s.gecerlilikBas)} – ${tarih(s.gecerlilikSon)}).`;
  }
  return null;
}
