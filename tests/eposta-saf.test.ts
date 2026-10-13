/* NEREDEN GELDİ: 432 — reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme kısmına elle ya
   da listeden mail girilebilecek". Veritabanısız kilitler: adres süzgeci (küçük harf, biçim, tekrar), plan e-postasının metni (ekibe kabul / red çağrısı,
   bilgilendirilene bilgi; iç kimlik yok), sağlayıcı bağdaştırıcısı (536: firmanın anahtarı yoksa YOK; yerel sunucuya karşı: 2xx gönderildi, 4xx kalıcı ret,
   429 / 5xx yeniden denenir; istek biçimi, cevap / gizli kopya), Kimden kuralı (536: kimden.ts). Kuyruk ve gönderim veritabanında: tests/planlar.test.ts "432". Olumsuz kanıt: tests/bozan/eposta.bozan.ts. */
import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { after, before, test } from "node:test";
import { planEpostasi } from "../src/modules/planlar/sema.ts";
import { adresler } from "../src/server/eposta/eposta.ts";
import { ALAN_BICIMI, alanAdi, alanSadelestir, GENEL_ALAN_DISI, gonderenYolu, kimdenKur } from "../src/server/eposta/kimden.ts";
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

test("sağlayıcı (536: firmanın kendi anahtarı): anahtar yoksa yok; 2xx gönderildi, 4xx kalıcı ret, 429 / 5xx yeniden denenir; istek Resend biçiminde, anahtar başlıkta", async () => {
  assert.equal(epostaSaglayicisi(null, {}), null);
  assert.equal(epostaSaglayicisi("   ", {}), null);
  assert.equal(epostaSaglayicisi(undefined, { PROBATA_EPOSTA_ANAHTAR: "ortak", PROBATA_EPOSTA_KIMDEN: "probata <b@x.example>" }), null, "ortamdaki ortak anahtar kullanılmaz");
  const s = (kod: number) => epostaSaglayicisi("deneme-anahtar", { PROBATA_EPOSTA_UC: `${uc}/emails/${kod}` })!;
  const e = { kimden: "\"Deneme Bir\" <bir@deneme.example>", kime: "ali@deneme.example", cevap: null, gizli: null, konu: "Konu", metin: "Metin" };
  assert.deepEqual(await s(200).gonder(e), { tamam: true });
  assert.deepEqual(await s(422).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 422).", kalici: true });
  assert.deepEqual(await s(429).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 429).", kalici: false });
  assert.deepEqual(await s(503).gonder(e), { tamam: false, neden: "Sağlayıcı reddetti (HTTP 503).", kalici: false });
  assert.equal(gelen[0].baslik.authorization, "Bearer deneme-anahtar");
  assert.deepEqual(gelen[0].govde, { from: "\"Deneme Bir\" <bir@deneme.example>", to: ["ali@deneme.example"], subject: "Konu", text: "Metin" });
  await s(200).gonder({ ...e, cevap: "bir@kisisel.example", gizli: "bir@kisisel.example" });
  assert.deepEqual(gelen.at(-1)!.govde, { from: e.kimden, to: ["ali@deneme.example"], subject: "Konu", text: "Metin", reply_to: ["bir@kisisel.example"], bcc: ["bir@kisisel.example"] },
    "cevap ve gizli kopya yalnız varsa gider");
  const kapali = epostaSaglayicisi("k", { PROBATA_EPOSTA_UC: "http://127.0.0.1:1/emails" })!;
  assert.deepEqual(await kapali.gonder(e), { tamam: false, neden: "Sağlayıcıya bağlanılamadı.", kalici: false });
});

/* NEREDEN GELDİ: 536 — reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli" → "A seçeneğini kabul ediyorum" → maket "onaylıyorum" */
test("Kimden: alan adındaki kişi kendi adresinden; değilse Rapor e-postasından kişinin adıyla, cevap kişiye; otomatikte firma adıyla; Rapor e-postası alan dışındaysa bekler", () => {
  const f = { alan: "deneme.example", genel: "Bilgi@Deneme.example", firmaAd: "Deneme Muayene", kopya: false };
  assert.deepEqual(kimdenKur(f, { ad: "Deneme Bir", eposta: "Bir@Deneme.Example" }),
    { tamam: true, kimden: "\"Deneme Bir\" <bir@deneme.example>", cevap: null, gizli: null });
  assert.deepEqual(kimdenKur(f, { ad: "Deneme İki", eposta: "iki@kisisel.example" }),
    { tamam: true, kimden: "\"Deneme İki · Deneme Muayene\" <bilgi@deneme.example>", cevap: "iki@kisisel.example", gizli: null });
  assert.deepEqual(kimdenKur(f, null), { tamam: true, kimden: "\"Deneme Muayene\" <bilgi@deneme.example>", cevap: null, gizli: null }, "otomatik e-posta");
  const kopyali = { ...f, kopya: true };
  assert.deepEqual(kimdenKur(kopyali, { ad: "Deneme Bir", eposta: "bir@deneme.example" }),
    { tamam: true, kimden: "\"Deneme Bir\" <bir@deneme.example>", cevap: null, gizli: "bir@deneme.example" }, "gizli kopya gönderene");
  assert.deepEqual(kimdenKur(kopyali, { ad: "Deneme İki", eposta: "iki@kisisel.example" }),
    { tamam: true, kimden: "\"Deneme İki · Deneme Muayene\" <bilgi@deneme.example>", cevap: "iki@kisisel.example", gizli: "iki@kisisel.example" });
  assert.deepEqual(kimdenKur(kopyali, null), { tamam: true, kimden: "\"Deneme Muayene\" <bilgi@deneme.example>", cevap: null, gizli: null }, "otomatikte kopya kimseye gitmez");
  /* alt alan adı ayrı alan adıdır; benzer ad eşleşmez */
  assert.equal(gonderenYolu("bir@posta.deneme.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("bir@deneme.example.kotu.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("bir@xdeneme.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("", "deneme.example"), "yok");
  assert.equal(gonderenYolu("bir@deneme.example", ""), "genel", "alan adı yoksa kimse kendi adresinden göndermez");
  /* Rapor e-postası alan adında değil (ya da yok) → kişisel adresli kişi ve otomatik e-posta bekler; alan adındaki kişi yine gönderir */
  for (const genel of [null, "bilgi@baska.example"]) {
    assert.deepEqual(kimdenKur({ ...f, genel }, { ad: "Deneme İki", eposta: "iki@kisisel.example" }), { tamam: false, neden: GENEL_ALAN_DISI });
    assert.deepEqual(kimdenKur({ ...f, genel }, null), { tamam: false, neden: GENEL_ALAN_DISI });
    assert.equal(kimdenKur({ ...f, genel }, { ad: "Deneme Bir", eposta: "bir@deneme.example" }).tamam, true);
  }
  /* görünen ad başlığı bozamaz: tırnak, açılı ayraç, satır sonu atılır */
  const k = kimdenKur(f, { ad: "Kötü\"\r\nBcc: x@y.example <z>", eposta: "bir@deneme.example" });
  assert.ok(k.tamam && !/["<>\r\n]/.test(k.kimden.replace(/^"|" <[^>]+>$/g, "")) && k.kimden.endsWith("<bir@deneme.example>"), JSON.stringify(k));
});

test("alan adı: sadeleştirme (http, www, yol, büyük harf) ve biçim", () => {
  assert.equal(alanSadelestir("  https://www.Deneme.Example/yol?x=1 "), "deneme.example");
  assert.equal(alanAdi(" Bir@Deneme.Example "), "deneme.example");
  assert.equal(alanAdi("bozuk"), "");
  for (const iyi of ["deneme.example", "a-b.deneme.example", "x1.co"]) assert.ok(ALAN_BICIMI.test(iyi), iyi);
  for (const kotu of ["deneme", "-a.example", "a..example", "a_b.example", "ÖRNEK.example", "a.example.", `${"a".repeat(64)}.example`]) assert.ok(!ALAN_BICIMI.test(kotu), kotu);
});
