/* E-İMZA YERİ (2026-10-16; sunum 595 madde 25 — reisim: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin"; K7 "ikisi"):
   imzaya hazırlanan KESİN PDF'e BOŞ imza alanı (AcroForm /FT /Sig, görünür widget) — e-imza aracı imzayı o alana işler. Yer formatın
   (tanim.ts gorunum.eimza):
   · "hucre" (varsayılan): belgedeki İmza hücresi — çizici (belge.ts) hücreye görünmez bir bağlantı işareti koyar (EIMZA_ISARETI); Chromium onu
     sayfasıyla ve tam dikdörtgeniyle bağlantı açıklaması olarak basar (sayfa kırılmasından sonraki gerçek yer). Burada işaret kaldırılır, yerine
     imza alanı konur; hücre yoksa (formatta İmza satırı yok) alan konmaz;
   · "kutu": SON sayfada formatın verdiği yer (mm, sayfanın sol üstünden; A4 210 × 297);
   · "gorunmez": alan yok — araç görünmez imza atar.
   2026-10-17 (İ5 — reisim: "e imza yerleri onanan ve onaylayan olarak olsun"): İKİ yer — onaylanan (EIMZA_ISARETI, muayene uzmanı) ve isteğe bağlı
   onaylayan (EIMZA_ISARETI_2, teknik yönetici; imzaAlaniKoy'un üçüncü bağımsız değişkeni): iki ayrı boş imza alanı, imza sırası yok. Kutu "her"
   sayfada: TEK alanın her sayfada birer görünür parçası (ebeveyn /FT /Sig + /Kids çocuk widget'lar — PDF standardı; görünümün her sayfada
   çizilmesi imza aracına bağlı).
   Her durumda belgedeki işaret bağlantıları kaldırılır. Çıktı klasik xref'li, nesne akışsız (imza-pdf.ts imzaliPdfGecerli'nin denetlediği biçim);
   imzalanınca aracın alanı doldurması (yalnız /V, /AP …) orada izinli. Saf: Chromium yok (pdf-lib). */
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFString } from "pdf-lib";

/** belge.ts'nin İmza hücresine koyduğu işaret (özel adres biçimi — dış adres değil; tarayıcı yalnız bağlantı açıklaması olarak basar) */
export const EIMZA_ISARETI = "probata-eimza:uzman";
/** 2026-10-17 (İ5): onaylayanın (teknik yönetici) İmza hücresinin işareti */
export const EIMZA_ISARETI_2 = "probata-eimza:teknik";
/** alanın adı (e-imza aracında görünen) */
export const EIMZA_ALAN_ADI = "Muayene uzmani imzasi";
export const EIMZA_ALAN_ADI_2 = "Teknik yonetici imzasi";
export type EimzaYeri = { yer: "hucre" } | { yer: "gorunmez" } | { yer: "kutu"; x: number; y: number; en: number; boy: number; sayfa?: "her" };
const MM = 72 / 25.4;

/** imzasız kesin PDF → aynı belge + boş imza alanı / alanları (yerinde); işaret bağlantıları kalkar. yeri2: onaylayanın yeri (yoksa ikinci alan yok) */
export async function imzaAlaniKoy(pdf: Uint8Array, yeri: EimzaYeri, yeri2: EimzaYeri | null = null): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const sayfalar = doc.getPages();
  type Yer = { sayfa: number; rect: [number, number, number, number] };
  const hucreler = new Map<string, Yer>();
  sayfalar.forEach((p, i) => {
    const annots = p.node.Annots();
    if (!annots) return;
    for (let j = annots.size() - 1; j >= 0; j--) {
      const a = annots.lookupMaybe(j, PDFDict);
      const uri = a?.lookupMaybe(PDFName.of("A"), PDFDict)?.lookup(PDFName.of("URI"));
      const metin = uri instanceof PDFString || uri instanceof PDFHexString ? uri.decodeText() : null;
      if (metin !== EIMZA_ISARETI && metin !== EIMZA_ISARETI_2) continue;
      const r = a!.lookupMaybe(PDFName.of("Rect"), PDFArray)?.asRectangle();
      /* işaret başına ilk sayfadaki ilk işaret (hücre iki sayfaya bölünmez — belge.css; bölünürse üst parça) */
      if (!hucreler.has(metin) && r && r.width > 4 && r.height > 4) hucreler.set(metin, { sayfa: i, rect: [r.x + 1, r.y + 1, r.x + r.width - 1, r.y + r.height - 1] });
      /* açıklama ve eylemi dolaylı nesneyse dosyadan da silinir (pdf-lib başvurusuz nesneyi de yazar — işaret metni belgede kalmasın) */
      const oge = annots.get(j), eylem = a!.get(PDFName.of("A"));
      annots.remove(j);
      if (eylem instanceof PDFRef) doc.context.delete(eylem);
      if (oge instanceof PDFRef) doc.context.delete(oge);
    }
  });
  const kutuYerleri = (k: Extract<EimzaYeri, { yer: "kutu" }>): Yer[] => {
    if (!sayfalar.length) return [];
    const son = sayfalar.length - 1;
    return (k.sayfa === "her" ? sayfalar.map((_, i) => i) : [son]).map((i) => {
      const { width: G, height: Y } = sayfalar[i].getSize();
      const x = Math.min(Math.max(k.x, 0), 200) * MM, ust = Math.min(Math.max(k.y, 0), 287) * MM;
      const en = Math.min(Math.max(k.en, 20), 210) * MM, boy = Math.min(Math.max(k.boy, 10), 100) * MM;
      return { sayfa: i, rect: [x, Math.max(0, Y - ust - boy), Math.min(G, x + en), Y - ust] };
    });
  };
  const yuvarla = (r: Yer["rect"]) => r.map((n) => Math.round(n * 100) / 100);
  const koy = (y: EimzaYeri | null, isaret: string, ad: string) => {
    if (!y) return;
    const h = hucreler.get(isaret);
    const yerler = y.yer === "hucre" ? (h ? [h] : []) : y.yer === "kutu" ? kutuYerleri(y) : [];
    if (!yerler.length) return;
    if (yerler.length === 1) {
      /* tek parça: alan ve görünüm aynı nesne (bugünkü biçim) */
      const p = sayfalar[yerler[0].sayfa];
      const alan = doc.context.register(doc.context.obj({ Type: "Annot", Subtype: "Widget", FT: "Sig", T: PDFString.of(ad), F: 4, Rect: yuvarla(yerler[0].rect), P: p.ref }));
      p.node.addAnnot(alan);
      doc.catalog.getOrCreateAcroForm().addField(alan);
      return;
    }
    /* her sayfa: ebeveyn alan (değer burada) + sayfa başına çocuk görünüm */
    const ebeveyn = doc.context.obj({ FT: "Sig", T: PDFString.of(ad) });
    const ebeveynRef = doc.context.register(ebeveyn);
    const cocuklar = yerler.map(({ sayfa, rect }) => {
      const p = sayfalar[sayfa];
      const w = doc.context.register(doc.context.obj({ Type: "Annot", Subtype: "Widget", F: 4, Rect: yuvarla(rect), P: p.ref, Parent: ebeveynRef }));
      p.node.addAnnot(w);
      return w;
    });
    ebeveyn.set(PDFName.of("Kids"), doc.context.obj(cocuklar));
    doc.catalog.getOrCreateAcroForm().addField(ebeveynRef);
  };
  koy(yeri, EIMZA_ISARETI, EIMZA_ALAN_ADI);
  koy(yeri2, EIMZA_ISARETI_2, EIMZA_ALAN_ADI_2);
  return doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
}
