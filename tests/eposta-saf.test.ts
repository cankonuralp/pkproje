/* NEREDEN GELDİ: 432 — reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme kısmına elle ya
   da listeden mail girilebilecek". Veritabanısız kilitler: adres süzgeci (küçük harf, biçim, tekrar), plan e-postasının metni (ekibe kabul / red çağrısı,
   bilgilendirilene bilgi; iç kimlik yok), sağlayıcı bağdaştırıcısı (anahtar / gönderen yoksa YOK; yerel sunucuya karşı: 2xx gönderildi, 4xx kalıcı ret,
   429 / 5xx yeniden denenir; istek biçimi). Kuyruk ve gönderim veritabanında: tests/planlar.test.ts "432". Olumsuz kanıt: tests/bozan/eposta.bozan.ts. */
import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { after, before, test } from "node:test";
import { planEpostasi } from "../src/modules/planlar/sema.ts";
import { adresler } from "../src/server/eposta/eposta.ts";
import { epostaSaglayicisi } from "../src/server/eposta/saglayici.ts";

test("adres süzgeci: küçük harf, biçimi bozuk ve tekrarlı adres düşer, sıra korunur", () => {
  assert.deepEqual(adresler([" Ali@Deneme.Example ", "ali@deneme.example", "yanlis", "a b@c.example", "veli@deneme", null, undefined, "", "ayse@x.example"]),
    ["ali@deneme.example", "ayse@x.example"]);
  assert.deepEqual(adresler([`${"a".repeat(250)}@x.example`]), [], "254'ten uzun");
});

test("plan e-postası: ekibe kabul / red çağrısı ve bağlantı, bilgilendirilene yalnız bilgi; tarih aralığı; satırlar düz metin", () => {
  const b = { firma: "Deneme Muayene", no: "P-2610-007", musteri: "Deneme", tesis: "Merkez", adres: "Deneme Cad. 1, Çankaya / Ankara", baslangic: "2026-10-12",
    bitis: "2026-10-13", ekip: ["Deneme Bir", "Deneme İki"], aciklama: "Giriş izni 08:00", baglanti: "https://deneme.probata.example/planlar/x" };
  const e = planEpostasi({ ...b, ekipten: true });
  assert.equal(e.konu, "Yeni plan P-2610-007 · Merkez · 12.10.2026 – 13.10.2026");
  assert.ok(e.govde.includes("Deneme Muayene sizin için yeni bir periyodik kontrol planı açtı."));
  assert.ok(e.govde.includes("Ekip: Deneme Bir, Deneme İki") && e.govde.includes("Açıklama: Giriş izni 08:00") && e.govde.includes("Adres: Deneme Cad. 1"));
  assert.ok(e.govde.includes("Planı görmek, kabul ya da reddetmek için: https://deneme.probata.example/planlar/x"));
  const i = planEpostasi({ ...b, bitis: b.baslangic, adres: null, aciklama: null, baglanti: null, ekipten: false });
  assert.equal(i.konu, "Bilgi: yeni plan P-2610-007 · Merkez · 12.10.2026");
  assert.ok(i.govde.includes("bilginize sunulur") && !i.govde.includes("Adres:") && !i.govde.includes("Açıklama:") && !i.govde.includes("http"));
  assert.ok(!e.govde.includes("<") && e.govde.split("\n").length > 8, "düz metin, satır satır");
  const bilgilendirilen = planEpostasi({ ...b, ekipten: false }).govde;
  assert.ok(bilgilendirilen.includes("Planı uygulamada görmek için (hesabınız varsa): https://") && !bilgilendirilen.includes("kabul ya da reddetmek"),
    "bilgilendirilene (müşteri olabilir) kabul / red çağrısı gitmez");
});

/* yerel sağlayıcı: yol başına durum kodu, gelen istek kaydedilir */
let uc = "";
const gelen: { yol: string; baslik: IncomingHttpHeaders; govde: unknown }[] = [];
const sunucu = createServer((istek, yanit) => {
  let g = ""; istek.on("data", (p) => { g += p; }).on("end", () => {
    gelen.push({ yol: istek.url ?? "", baslik: istek.headers, govde: JSON.parse(g || "{}") });
    const kod = Number((istek.url ?? "").split("/").pop()) || 200;
    yanit.writeHead(kod, { "content-type": "application/json" }).end("{}");
  });
});
before(async () => { await new Promise<void>((c) => sunucu.listen(0, "127.0.0.1", c)); uc = `http://127.0.0.1:${(sunucu.address() as { port: number }).port}`; });
after(() => new Promise<void>((c) => sunucu.close(() => c())));

test("sağlayıcı: anahtar ya da gönderen yoksa yok; 2xx gönderildi, 4xx kalıcı ret, 429 / 5xx yeniden denenir; istek Resend biçiminde, anahtar başlıkta", async () => {
  assert.equal(epostaSaglayicisi({}), null);
  assert.equal(epostaSaglayicisi({ PROBATA_EPOSTA_ANAHTAR: "k" }), null);
  assert.equal(epostaSaglayicisi({ PROBATA_EPOSTA_KIMDEN: "probata <b@x.example>" }), null);
  const s = (kod: number) => epostaSaglayicisi({ PROBATA_EPOSTA_ANAHTAR: "deneme-anahtar", PROBATA_EPOSTA_KIMDEN: "probata <b@x.example>", PROBATA_EPOSTA_UC: `${uc}/emails/${kod}` })!;
  const e = { kime: "ali@deneme.example", konu: "Konu", metin: "Metin" };
  assert.deepEqual(await s(200).gonder(e), { tamam: true });
  assert.deepEqual(await s(422).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 422).", kalici: true });
  assert.deepEqual(await s(429).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 429).", kalici: false });
  assert.deepEqual(await s(503).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 503).", kalici: false });
  assert.equal(gelen[0].baslik.authorization, "Bearer deneme-anahtar");
  assert.deepEqual(gelen[0].govde, { from: "probata <b@x.example>", to: ["ali@deneme.example"], subject: "Konu", text: "Metin" });
  const kapali = epostaSaglayicisi({ PROBATA_EPOSTA_ANAHTAR: "k", PROBATA_EPOSTA_KIMDEN: "g", PROBATA_EPOSTA_UC: "http://127.0.0.1:1/emails" })!;
  assert.deepEqual(await kapali.gonder(e), { tamam: false, neden: "Sağlayıcıya bağlanılamadı.", kalici: false });
});
