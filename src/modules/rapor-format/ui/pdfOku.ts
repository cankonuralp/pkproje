/* BASILI FORMDAN ŞABLON — PDF'in tarayıcıda okunması (2026-10-24; reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka
   çalışıyor ?", "en baştan beri bunu istedim"). Firmanın basılı formu KENDİ içeriğinden okunur: pdf.js belgeyi açar (components/pdf/pdfjs.ts —
   eval kapalı, XFA kapalı, işçi kendi kökenimizden), pdf-sayfa.ts sayfaların yazılarını / çizgilerini / dolgularını / resimlerini, pdf-izgara.ts
   formun ızgarasını çıkarır. Çıktı (BASILI ham) sunucuya gider (eylemler.ts basilidanKurEylemi), orada şemadan geçer ve türün taslağı olur.
   Ağ yok, dosya bu işte başka yere gitmez. Yalnız tarayıcıda. */
import { PDF_ACMA, pdfjsYukle } from "../../../components/pdf/pdfjs";
import { pdfIzgara } from "../pdf-izgara";
import { pdfSayfalari } from "../pdf-sayfa";
import type { BasiliHam } from "../pdf-tipler";

/** PDF'in baytları → BASILI ham. Verilen bayt dizisi değişmez (pdf.js'e kopyası gider — işçiye aktarılınca boşalır). Okunamazsa hata fırlatır
    (iletisi pdfOkumaHatasi ile). */
export async function pdfdenHam(veri: ArrayBuffer | Uint8Array): Promise<BasiliHam> {
  const pdfjs = await pdfjsYukle();
  const data = veri instanceof Uint8Array ? veri.slice() : new Uint8Array(veri.slice(0));
  const gorev = pdfjs.getDocument({ data, ...PDF_ACMA });
  try {
    const belge = await gorev.promise;
    const sayfalar = await pdfSayfalari(belge, pdfjs);
    /* yazısız PDF (taranmış sayfa görüntüsü): formun ızgarası çıkmaz — boş şablon kurulmaz, nedeni söylenir */
    if (!sayfalar.some((x) => x.yazilar.some((y) => y.s.trim()))) throw Object.assign(new Error("PDF'te yazı yok"), { name: "YazisizPdf" });
    return pdfIzgara(sayfalar);
  } finally {
    await gorev.destroy();
  }
}

/** okuma hatasının kullanıcıya iletisi */
export function pdfOkumaHatasi(h: unknown): string {
  const ad = h && typeof h === "object" && "name" in h ? String((h as { name: unknown }).name) : "";
  if (ad === "PasswordException") return "PDF parolalı; parolasız sürümünü yükleyin.";
  if (ad === "InvalidPDFException") return "PDF okunamadı: dosya bozuk ya da PDF değil.";
  if (ad === "YazisizPdf") return "PDF'te okunacak yazı yok (taranmış görüntü olabilir). Formun bilgisayarda kaydedilmiş PDF'ini yükleyin.";
  return "PDF okunamadı.";
}
