/* FOTOĞRAF ÖN OKUMA — istek ve cevap (2026-10-31; reisim: "Fotoğraf ön okuma: her fotoğraf bir kez, paralel ve küçük bir çağrıyla okunur, sonuç saklanır.
   Ana konuşmaya metin ve pafta girer"; sunum L4). SAF. Fotoğraf yüklenince bir kez: sınıfı (B02), okunabilen yazısı, kısa tarifi; yapılandırılmış çıktı,
   düşük derinlik, küçük cevap sınırı. Uydurma yok: okunamayan yazı boş.
   2026-11-01 BÜYÜK İŞ ŞEMASI (reisim: "müşteriler 20-25-50-60 fotoğraflı işi de tek te yaptırmak isteyebilir … müşteriye göstermeden"): ön okuma etiket
   ALANLARINI da döner — marka, model, seri, imal, kapasite, diğer; her biri değer + emin / şüpheli. Fotoğrafın kendisi konuşmaya girmez, bu satır girer
   (malzeme.ts ekBasligi); S.A.Y foto_goster'i yalnız eksik / şüpheli alan için çağırır. Kilit tests/say-on-okuma.test.ts. */
import { MODEL_KIMLIGI, type OkumaIstegi, type YzModel } from "../../server/yz/okuma.ts";
import { ALAN_ADI, SINIF_ADI, type FotoSinifi, type OkunanAlan, type OkunanAlanAdi, type OnOkuma } from "./malzeme.ts";

export const ON_OKUMA_YANIT = 1_500;
/** alan değeri en çok bu kadar karakter; fotoğraf başına en çok bu kadar alan */
export const ALAN_DEGER_EN_COK = 60, ALAN_EN_COK = 12;
const SINIFLAR = Object.keys(SINIF_ADI) as FotoSinifi[];
const ALANLAR = Object.keys(ALAN_ADI) as OkunanAlanAdi[];
const SISTEM = [
  "Periyodik kontrol (iş ekipmanı muayenesi) sahasından gelen tek bir fotoğrafa bakıyorsun. Cevabın verilen JSON şemasına uyan tek nesnedir.",
  `sinif: ${SINIFLAR.map((k) => `${k} = ${SINIF_ADI[k]}`).join(", ")}. Ekipmanın kendisi büyük kısmıyla görünüyorsa E; yazılı plaka / CE etiketi T;`,
  "kapasite ya da uyarı levhası L; ekran görüntüsü, liste, belge S.",
  "yazi: fotoğrafta OKUYABİLDİĞİN yazılar (marka, model, seri no, imal yılı, kapasite, kod …) aynen, en çok 300 karakter; okuyamadığını yazma, uydurma.",
  "tarif: ne göründüğü, en çok 100 karakter (ör. \"iki kolonlu araç kaldırma lifti, kırmızı\"). Cihazın türünü açıkça adlandır; benzer ama farklı cihazları",
  "ayır: araç kaldırma lifti değil de tekerlek hizalama (rot) cihazı, fren / test hattı, rampa, vinç ise onu yaz; emin değilsen \"lift ya da hizalama cihazı, belirsiz\" de.",
  "alanlar: etikette / plakada / levhada okunan EKİPMAN BİLGİLERİ, her biri {ad, deger, emin}. ad: marka · model · seri (seri / üretici numarası) · imal (imal",
  "tarihi ya da yılı) · kapasite (taşıma / kaldırma kapasitesi, birimiyle) · diger (başka önemli değer, \"ad: değer\" biçiminde — ör. \"kaldırma yüksekliği: 1900 mm\").",
  `deger okunduğu gibi, en çok ${ALAN_DEGER_EN_COK} karakter. emin: harflerin hepsi net okunuyorsa true; bir kısmı bulanık, kapalı ya da tahminse false.`,
  "Okuyamadığın alanı yazma, uydurma; etiket / levha yoksa boş dizi [].",
].join("\n");

export function onOkumaIstegi(model: YzModel, resim: Uint8Array, mime: string): OkumaIstegi {
  const sema = {
    type: "object", additionalProperties: false, required: ["sinif", "yazi", "tarif", "alanlar"],
    properties: {
      sinif: { type: "string", enum: SINIFLAR }, yazi: { type: "string" }, tarif: { type: "string" },
      alanlar: { type: "array", items: { type: "object", additionalProperties: false, required: ["ad", "deger", "emin"],
        properties: { ad: { type: "string", enum: ALANLAR }, deger: { type: "string" }, emin: { type: "boolean" } } } },
    },
  };
  return {
    govde: {
      model: MODEL_KIMLIGI[model], max_tokens: ON_OKUMA_YANIT, system: SISTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: sema } },
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mime === "image/png" ? "image/png" : "image/jpeg", data: Buffer.from(resim).toString("base64") } },
        { type: "text", text: "Bu fotoğrafı sınıflandır, okuyabildiğin yazıyı, etiket alanlarını ve kısa tarifini ver." },
      ] }],
    },
  };
}

const temiz = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
/** cevaptaki alanlar süzülmüş: bilinen ad, boş olmayan değer, emin yalnız true ise; en çok ALAN_EN_COK */
export function alanlariCoz(x: unknown): OkunanAlan[] {
  if (!Array.isArray(x)) return [];
  const l: OkunanAlan[] = [];
  for (const a of x as { ad?: unknown; deger?: unknown; emin?: unknown }[]) {
    if (!a || typeof a !== "object" || typeof a.ad !== "string" || !(ALANLAR as string[]).includes(a.ad)) continue;
    const deger = temiz(a.deger, ALAN_DEGER_EN_COK);
    if (deger) l.push({ ad: a.ad as OkunanAlanAdi, deger, emin: a.emin === true });
    if (l.length >= ALAN_EN_COK) break;
  }
  return l;
}
/** cevaptan ön okuma (bozuksa null) ve kullanım */
export function onOkumaCoz(govde: unknown): { okuma: OnOkuma | null; usage: Record<string, unknown> | undefined } {
  const g = (govde && typeof govde === "object" ? govde : {}) as { content?: { type?: unknown; text?: unknown }[]; usage?: Record<string, unknown> };
  const metin = (g.content ?? []).filter((b) => b.type === "text" && typeof b.text === "string").map((b) => b.text as string).join("");
  try {
    const x = JSON.parse(metin) as Record<string, unknown>;
    const sinif = typeof x.sinif === "string" && (SINIFLAR as string[]).includes(x.sinif) ? x.sinif as FotoSinifi : null;
    return { okuma: sinif ? { sinif, yazi: temiz(x.yazi, 300), tarif: temiz(x.tarif, 100), alanlar: alanlariCoz(x.alanlar) } : null, usage: g.usage };
  } catch { return { okuma: null, usage: g.usage }; }
}
