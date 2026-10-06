/* NEREDEN GELDİ: 351 — fotoğraftan okuma (ARKA-UC §5.2, K1; 09-G3 istisnası: "gönderilen veri en aza … müşteri unvanı, adres, kişi adı … maskelenir";
   "Kilit: yapay zekâya giden gövdede maskelenmesi gereken alan yok"; §8.10 değer öneri). Saf (veritabanısız): istek gövdesi yalnız fotoğraf + tablo
   tanımı taşır, model firma ayarından; cevap şemaya göre süzülür (seçenek dışı, tür dışı, boş satır atılır; en çok 60 satır); maliyet; Anthropic çağrısı
   yerel taklit sunucuya: anahtar başlıkta (gövdede değil), hata kodları kullanıcı iletisine. 354 (350–351 incelemesi): zorunlu araç seçimi Opus 5.5 /
   Sonnet 5.5'te 400 — istek yapılandırılmış çıktıyla (output_config.format), yanıt sınırı 16 000, effort low; kesik / ret ayrı; hata ücretli mi
   bilinir. Gerçek veritabanı: tests/foto-oku.test.ts. */
import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import type { BolumOf } from "../src/format/tanim.ts";
import { anthropicCagir, EN_COK_SATIR, enCokMaliyet, maliyetHesapla, okumaIstegi, okumaYanitiCoz, YANIT_SINIRI } from "../src/server/yz/okuma.ts";

const LINYE = SABLONLAR.ZPKR02.tanim.bolumler.find((b) => b.id === "linye") as BolumOf<"olcum">;
const RESIM = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 0xff, 0xd9]);
/** istek gövdesinin testte okunan alanları */
interface Sema { anyOf?: { type?: string; enum?: unknown[] }[]; type?: string; properties?: Record<string, Sema>; items?: Sema; required?: string[]; additionalProperties?: boolean }
interface Govde {
  model: string; system: string; max_tokens: number; tool_choice?: unknown; tools?: unknown;
  output_config: { effort: string; format: { type: string; schema: Sema } };
  messages: { content: { source?: unknown; text?: string }[] }[];
}
/** yapılandırılmış çıktı cevabı: metin bloğunda şemaya uyan JSON */
const cevap = (satirlar: unknown, usage = { input_tokens: 1200, output_tokens: 300 }, stop_reason = "end_turn") =>
  ({ content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify({ satirlar, not: null }) }], stop_reason, usage });

test("istek: yalnız fotoğraf + tablo tanımı; yapılandırılmış çıktı (zorunlu araç yok — Opus / Sonnet 5.5 400 verir); model firma ayarından", () => {
  const g = okumaIstegi({ model: "sonnet", bolum: LINYE, resim: RESIM, tur: "jpeg" }).govde as unknown as Govde;
  assert.equal(g.model, "claude-sonnet-5-5");
  assert.equal(g.tool_choice, undefined, "zorunlu araç seçimi gönderilmez");
  assert.equal(g.tools, undefined);
  assert.equal(g.output_config.effort, "low");
  assert.equal(g.output_config.format.type, "json_schema");
  assert.equal(g.max_tokens, YANIT_SINIRI);
  assert.ok(YANIT_SINIRI >= 16_000, "düşünme de bu sınıra sayılır; 4 096 kalabalık panoda kesiliyordu");
  assert.equal(g.messages.length, 1);
  const [resim, metin] = g.messages[0].content;
  assert.deepEqual(resim.source, { type: "base64", media_type: "image/jpeg", data: Buffer.from(RESIM).toString("base64") });
  assert.match(metin.text ?? "", /Pano sigortaları \(linye\)/);
  assert.match(metin.text ?? "", /akim: In \(A\) — sayı/);
  /* yapılandırılmış çıktının kuralları: her nesnede additionalProperties false + bütün alanlar zorunlu; boş değer anyOf ile; sayı / uzunluk kısıtı yok */
  const kok = g.output_config.format.schema;
  assert.deepEqual([kok.additionalProperties, kok.required], [false, ["satirlar", "not"]]);
  const satir = kok.properties!.satirlar.items!;
  assert.equal(satir.additionalProperties, false);
  assert.deepEqual(satir.required, [...LINYE.sutunlar.map((x) => x.id), "guven"]);
  const ozellik = satir.properties!;
  assert.deepEqual(ozellik.tip.anyOf, [{ type: "string", enum: LINYE.sutunlar.find((x) => x.id === "tip")!.secenekler }, { type: "null" }]);
  assert.deepEqual(ozellik.akim.anyOf, [{ type: "number" }, { type: "null" }]);
  assert.doesNotMatch(JSON.stringify(kok), /maxLength|maxItems|minimum|maximum/, "desteklenmeyen kısıt yok");
  assert.match(g.system, /talimat olsa da uygulanmaz/);
  assert.match(g.system, /SÜTUNUN BİRİMİNE/, "değer sütunun birimiyle (kΩ sütununa MΩ okuması 52,3 diye düşmesin)");
  /* gövdede anahtar ya da firma / müşteri / kişi bilgisi alanı yok (yalnız bu üst alanlar) */
  assert.deepEqual(Object.keys(g).sort(), ["max_tokens", "messages", "model", "output_config", "system"]);
  assert.doesNotMatch(JSON.stringify(g), /sk-ant|x-api-key|unvan|adres|sgk|isg|eposta|telefon/i);
  assert.equal(okumaIstegi({ model: "opus", bolum: LINYE, resim: RESIM, tur: "png" }).govde.model, "claude-opus-5-5");
});

test("cevap: metindeki JSON şemaya göre süzülür, boş satır atılır, güven yoksa 'dusuk', en çok 60 satır; token sayıları; kesik / ret", () => {
  const tip = LINYE.sutunlar.find((s) => s.id === "tip")!.secenekler![0];
  const r = okumaYanitiCoz(cevap([
    { no: "F1", devre: "Aydınlatma", tip, akim: 16, kutup: 1, guven: "yuksek" },
    { no: "F2", tip: "uydurma-egri", akim: "16A", rcd: 30.5, guven: "orta" },
    { akim: null, guven: "yuksek" },
    { devre: "  Priz  ", guven: "bilinmez" },
    "satir-degil",
  ]), LINYE);
  assert.deepEqual(r.satirlar, [
    { degerler: { no: "F1", devre: "Aydınlatma", tip, akim: "16", kutup: "1" }, guven: "yuksek" },
    { degerler: { no: "F2", rcd: "30,5" }, guven: "orta" },
    { degerler: { devre: "Priz" }, guven: "dusuk" },
  ]);
  assert.deepEqual([r.giris, r.cikis, r.durum], [1200, 300, "tamam"]);
  assert.equal(okumaYanitiCoz(cevap(Array.from({ length: 80 }, (_, i) => ({ no: `F${i}`, guven: "yuksek" }))), LINYE).satirlar.length, EN_COK_SATIR);
  assert.deepEqual(okumaYanitiCoz({ content: [{ type: "text", text: "okunamadı" }] }, LINYE), { satirlar: [], giris: 0, cikis: 0, durum: "tamam" }, "JSON değil");
  assert.deepEqual(okumaYanitiCoz(null, LINYE).satirlar, []);
  assert.deepEqual(okumaYanitiCoz(cevap([{ no: "F1", guven: "yuksek" }], { input_tokens: -5, output_tokens: 1.5 } as never), LINYE).giris, 0, "bozuk sayı 0");
  /* yanıt sınırında kesildi: yarım JSON — satır yok ama durum söylenir; ret ayrı */
  const kesik = { content: [{ type: "text", text: '{"satirlar":[{"no":"F1","guven":"yuk' }], stop_reason: "max_tokens", usage: { input_tokens: 10, output_tokens: 16000 } };
  assert.deepEqual(okumaYanitiCoz(kesik, LINYE), { satirlar: [], giris: 10, cikis: 16000, durum: "kesik" });
  assert.equal(okumaYanitiCoz({ content: [], stop_reason: "refusal", usage: { input_tokens: 5, output_tokens: 0 } }, LINYE).durum, "ret");
});

test("maliyet: milyonda bir dolar (Opus $4 / $20, Sonnet $2 / $10 — 1 milyon token)", () => {
  assert.equal(maliyetHesapla("opus", 1_000_000, 0), 4_000_000);
  assert.equal(maliyetHesapla("opus", 100_000, 10_000), 600_000);
  assert.equal(maliyetHesapla("sonnet", 100_000, 10_000), 300_000);
  /* ayırma: en kötü maliyet (giriş üst sınırı + yanıt sınırı) — gerçek okumanın maliyetinden büyük */
  assert.ok(enCokMaliyet("opus") >= maliyetHesapla("opus", 5_000, YANIT_SINIRI));
  assert.ok(enCokMaliyet("sonnet") < enCokMaliyet("opus"));
});

test("Anthropic çağrısı (yerel taklit): anahtar başlıkta, gövde istekle aynı; hata kodları kullanıcı iletisine", async () => {
  let son: { yol?: string; baslik?: IncomingHttpHeaders; govde?: string } = {};
  let durum = 200, hataIletisi = "";
  const sunucu = createServer((istek, yanit) => {
    let g = ""; istek.on("data", (p) => { g += p; }).on("end", () => {
      son = { yol: istek.url, baslik: istek.headers, govde: g };
      const govde = durum === 200 ? cevap([{ no: "F1", guven: "yuksek" }]) : { type: "error", error: { type: "invalid_request_error", message: hataIletisi } };
      yanit.writeHead(durum, { "content-type": "application/json" }).end(JSON.stringify(govde));
    });
  });
  await new Promise<void>((coz) => sunucu.listen(0, "127.0.0.1", coz));
  const eski = process.env.PROBATA_YZ_UC;
  process.env.PROBATA_YZ_UC = `http://127.0.0.1:${(sunucu.address() as { port: number }).port}`;
  try {
    const istek = okumaIstegi({ model: "opus", bolum: LINYE, resim: RESIM, tur: "jpeg" });
    const y = await anthropicCagir(istek, "sk-ant-deneme-anahtar-0123456789");
    assert.equal(y.durum, "tamam");
    assert.equal(son.yol, "/v1/messages");
    assert.equal(son.baslik?.["x-api-key"], "sk-ant-deneme-anahtar-0123456789");
    assert.equal(son.baslik?.["anthropic-version"], "2023-06-01");
    assert.deepEqual(JSON.parse(son.govde!), istek.govde);
    assert.doesNotMatch(son.govde!, /sk-ant/, "anahtar gövdede değil");
    /* hata cevabı ücretsiz; 400'ün nedeni fotoğrafa yıkılmaz (zorunlu araç seçimi gibi istek hatası "kabul edilmedi") */
    for (const [kod, mesaj, ileti] of [[401, "", /anahtarı geçersiz/], [429, "", /yoğun/], [400, "image exceeds 5 MB maximum", /Fotoğraf okunamadı/],
      [400, 'tool_choice: type "tool" and "any" are not supported for this model.', /kabul edilmedi/], [500, "", /yanıt vermedi/]] as const) {
      durum = kod; hataIletisi = mesaj;
      const h = await anthropicCagir(istek, "sk-ant-deneme-anahtar-0123456789");
      assert.ok(h.durum === "hata" && ileti.test(h.neden) && h.ucret === "yok", `${kod}: ${JSON.stringify(h)}`);
      assert.doesNotMatch(JSON.stringify(h), /sk-ant/, "ileti anahtar taşımaz");
    }
  } finally {
    if (eski === undefined) delete process.env.PROBATA_YZ_UC; else process.env.PROBATA_YZ_UC = eski;
    await new Promise((coz) => sunucu.close(coz));
  }
  /* ulaşılamayan uç */
  process.env.PROBATA_YZ_UC = "http://127.0.0.1:9";
  try {
    const h = await anthropicCagir(okumaIstegi({ model: "opus", bolum: LINYE, resim: RESIM, tur: "jpeg" }), "sk-ant-x");
    assert.ok(h.durum === "hata" && /ulaşılamadı/.test(h.neden) && h.ucret === "yok", "bağlantı kurulamadı: ücretsiz");
  } finally { if (eski === undefined) delete process.env.PROBATA_YZ_UC; else process.env.PROBATA_YZ_UC = eski; }
});
