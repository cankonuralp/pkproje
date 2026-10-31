/* FOTOĞRAF ÖN OKUMA — istek ve cevap (2026-10-31; reisim: "Fotoğraf ön okuma: her fotoğraf bir kez, paralel ve küçük bir çağrıyla okunur, sonuç saklanır.
   Ana konuşmaya metin ve pafta girer"; sunum L4). SAF. Fotoğraf yüklenince bir kez: sınıfı (B02), okunabilen yazısı, kısa tarifi; yapılandırılmış çıktı,
   düşük derinlik, küçük cevap sınırı. Uydurma yok: okunamayan yazı boş. Kilit tests/say-on-okuma.test.ts. */
import { MODEL_KIMLIGI, type OkumaIstegi, type YzModel } from "../../server/yz/okuma.ts";
import { SINIF_ADI, type FotoSinifi, type OnOkuma } from "./malzeme.ts";

export const ON_OKUMA_YANIT = 1_500;
const SINIFLAR = Object.keys(SINIF_ADI) as FotoSinifi[];
const SISTEM = [
  "Periyodik kontrol (iş ekipmanı muayenesi) sahasından gelen tek bir fotoğrafa bakıyorsun. Cevabın verilen JSON şemasına uyan tek nesnedir.",
  `sinif: ${SINIFLAR.map((k) => `${k} = ${SINIF_ADI[k]}`).join(", ")}. Ekipmanın kendisi büyük kısmıyla görünüyorsa E; yazılı plaka / CE etiketi T;`,
  "kapasite ya da uyarı levhası L; ekran görüntüsü, liste, belge S.",
  "yazi: fotoğrafta OKUYABİLDİĞİN yazılar (marka, model, seri no, imal yılı, kapasite, kod …) aynen, en çok 300 karakter; okuyamadığını yazma, uydurma.",
  "tarif: ne göründüğü, en çok 100 karakter (ör. \"iki kolonlu araç kaldırma lifti, kırmızı\").",
].join("\n");

export function onOkumaIstegi(model: YzModel, resim: Uint8Array, mime: string): OkumaIstegi {
  const sema = {
    type: "object", additionalProperties: false, required: ["sinif", "yazi", "tarif"],
    properties: { sinif: { type: "string", enum: SINIFLAR }, yazi: { type: "string" }, tarif: { type: "string" } },
  };
  return {
    govde: {
      model: MODEL_KIMLIGI[model], max_tokens: ON_OKUMA_YANIT, system: SISTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: sema } },
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mime === "image/png" ? "image/png" : "image/jpeg", data: Buffer.from(resim).toString("base64") } },
        { type: "text", text: "Bu fotoğrafı sınıflandır, okuyabildiğin yazıyı ve kısa tarifini ver." },
      ] }],
    },
  };
}

const temiz = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
/** cevaptan ön okuma (bozuksa null) ve kullanım */
export function onOkumaCoz(govde: unknown): { okuma: OnOkuma | null; usage: Record<string, unknown> | undefined } {
  const g = (govde && typeof govde === "object" ? govde : {}) as { content?: { type?: unknown; text?: unknown }[]; usage?: Record<string, unknown> };
  const metin = (g.content ?? []).filter((b) => b.type === "text" && typeof b.text === "string").map((b) => b.text as string).join("");
  try {
    const x = JSON.parse(metin) as Record<string, unknown>;
    const sinif = typeof x.sinif === "string" && (SINIFLAR as string[]).includes(x.sinif) ? x.sinif as FotoSinifi : null;
    return { okuma: sinif ? { sinif, yazi: temiz(x.yazi, 300), tarif: temiz(x.tarif, 100) } : null, usage: g.usage };
  } catch { return { okuma: null, usage: g.usage }; }
}
