/* E-İMZA YERİ (2026-10-16; sunum 595 madde 25 — reisim: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin"; K7 "ikisi"):
   imzaya hazırlanan KESİN PDF'e BOŞ imza alanı (AcroForm /FT /Sig, görünür widget) — e-imza aracı imzayı o alana işler. Yer formatın
   (tanim.ts gorunum.eimza):
   · "hucre" (varsayılan): belgedeki İmza hücresi — çizici (belge.ts) hücreye görünmez bir bağlantı işareti koyar (EIMZA_ISARETI); Chromium onu
     sayfasıyla ve tam dikdörtgeniyle bağlantı açıklaması olarak basar (sayfa kırılmasından sonraki gerçek yer). Burada işaret kaldırılır, yerine
     imza alanı konur; hücre yoksa (formatta İmza satırı yok) alan konmaz;
   · "kutu": SON sayfada formatın verdiği yer (mm, sayfanın sol üstünden; A4 210 × 297);
   · "gorunmez": alan yok — araç görünmez imza atar.
   Her durumda belgedeki işaret bağlantıları kaldırılır. Çıktı klasik xref'li, nesne akışsız (imza-pdf.ts imzaliPdfGecerli'nin denetlediği biçim);
   imzalanınca aracın alanı doldurması (yalnız /V, /AP …) orada izinli. Saf: Chromium yok (pdf-lib). */
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFString } from "pdf-lib";

/** belge.ts'nin İmza hücresine koyduğu işaret (özel adres biçimi — dış adres değil; tarayıcı yalnız bağlantı açıklaması olarak basar) */
export const EIMZA_ISARETI = "probata-eimza:uzman";
/** alanın adı (e-imza aracında görünen) */
export const EIMZA_ALAN_ADI = "Muayene uzmani imzasi";
export type EimzaYeri = { yer: "hucre" } | { yer: "gorunmez" } | { yer: "kutu"; x: number; y: number; en: number; boy: number };
const MM = 72 / 25.4;

/** imzasız kesin PDF → aynı belge + boş imza alanı (yerinde); işaret bağlantıları kalkar */
export async function imzaAlaniKoy(pdf: Uint8Array, yeri: EimzaYeri): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const sayfalar = doc.getPages();
  let hucre: { sayfa: number; rect: [number, number, number, number] } | null = null;
  sayfalar.forEach((p, i) => {
    const annots = p.node.Annots();
    if (!annots) return;
    for (let j = annots.size() - 1; j >= 0; j--) {
      const a = annots.lookupMaybe(j, PDFDict);
      const uri = a?.lookupMaybe(PDFName.of("A"), PDFDict)?.lookup(PDFName.of("URI"));
      const metin = uri instanceof PDFString || uri instanceof PDFHexString ? uri.decodeText() : null;
      if (metin !== EIMZA_ISARETI) continue;
      const r = a!.lookupMaybe(PDFName.of("Rect"), PDFArray)?.asRectangle();
      /* ilk sayfadaki ilk işaret (hücre iki sayfaya bölünmez — belge.css; bölünürse üst parça) */
      if (!hucre && r && r.width > 4 && r.height > 4) hucre = { sayfa: i, rect: [r.x + 1, r.y + 1, r.x + r.width - 1, r.y + r.height - 1] };
      /* açıklama ve eylemi dolaylı nesneyse dosyadan da silinir (pdf-lib başvurusuz nesneyi de yazar — işaret metni belgede kalmasın) */
      const oge = annots.get(j), eylem = a!.get(PDFName.of("A"));
      annots.remove(j);
      if (eylem instanceof PDFRef) doc.context.delete(eylem);
      if (oge instanceof PDFRef) doc.context.delete(oge);
    }
  });
  let yer: { sayfa: number; rect: [number, number, number, number] } | null = null;
  if (yeri.yer === "hucre") yer = hucre;
  else if (yeri.yer === "kutu" && sayfalar.length) {
    const son = sayfalar.length - 1, { width: G, height: Y } = sayfalar[son].getSize();
    const x = Math.min(Math.max(yeri.x, 0), 200) * MM, ust = Math.min(Math.max(yeri.y, 0), 287) * MM;
    const en = Math.min(Math.max(yeri.en, 20), 210) * MM, boy = Math.min(Math.max(yeri.boy, 10), 100) * MM;
    yer = { sayfa: son, rect: [x, Math.max(0, Y - ust - boy), Math.min(G, x + en), Y - ust] };
  }
  if (yer) {
    const p = sayfalar[yer.sayfa];
    const alan = doc.context.register(doc.context.obj({
      Type: "Annot", Subtype: "Widget", FT: "Sig", T: PDFString.of(EIMZA_ALAN_ADI), F: 4, Rect: yer.rect.map((n) => Math.round(n * 100) / 100), P: p.ref,
    }));
    p.node.addAnnot(alan);
    doc.catalog.getOrCreateAcroForm().addField(alan);
  }
  return doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
}
