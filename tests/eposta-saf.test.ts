/* NEREDEN GELDİ: 432 — reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme kısmına elle ya
   da listeden mail girilebilecek". Veritabanısız kilitler: adres süzgeci (küçük harf, biçim, tekrar), plan e-postasının metni (ekibe kabul / red çağrısı,
   bilgilendirilene bilgi; iç kimlik yok), sağlayıcı bağdaştırıcısı (536: firmanın anahtarı yoksa YOK; yerel sunucuya karşı: 2xx gönderildi, 4xx kalıcı ret,
   429 / 5xx yeniden denenir; istek biçimi, cevap / gizli kopya), Kimden kuralı (536: kimden.ts). Kuyruk ve gönderim veritabanında: tests/planlar.test.ts "432". Olumsuz kanıt: tests/bozan/eposta.bozan.ts. */
import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { after, before, test } from "node:test";
import { planEpostasi } from "../src/modules/planlar/sema.ts";
import { adresler } from "../src/server/eposta/eposta.ts";
import { ALAN_BICIMI, ALAN_DOGRULANMADI, alanAdi, alanSadelestir, gonderenYolu, kimdenKur } from "../src/server/eposta/kimden.ts";
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
  /* FV11 (§5.8): açık User-Agent; kuyruk satırının kimliğiyle Idempotency-Key (yeniden denemede ikinci kez gitmez) — kimlik yoksa başlık yok */
  assert.equal(gelen[0].baslik["user-agent"], "probata");
  assert.equal(gelen[0].baslik["idempotency-key"], undefined);
  await s(200).gonder({ ...e, kimlik: "6f9619ff-8b86-4011-b42d-00c04fc964ff" });
  assert.equal(gelen.at(-1)!.baslik["idempotency-key"], "eposta/6f9619ff-8b86-4011-b42d-00c04fc964ff");
  await s(200).gonder({ ...e, kimlik: "kotu\r\nbaslik" });
  assert.equal(gelen.at(-1)!.baslik["idempotency-key"], undefined, "biçimsiz kimlik başlığa girmez");
  assert.deepEqual(gelen[0].govde, { from: "\"Deneme Bir\" <bir@deneme.example>", to: ["ali@deneme.example"], subject: "Konu", text: "Metin" });
  await s(200).gonder({ ...e, cevap: "bir@kisisel.example", gizli: "bir@kisisel.example" });
  assert.deepEqual(gelen.at(-1)!.govde, { from: e.kimden, to: ["ali@deneme.example"], subject: "Konu", text: "Metin", reply_to: ["bir@kisisel.example"], bcc: ["bir@kisisel.example"] },
    "cevap ve gizli kopya yalnız varsa gider");
  const kapali = epostaSaglayicisi("k", { PROBATA_EPOSTA_UC: "http://127.0.0.1:1/emails" })!;
  assert.deepEqual(await kapali.gonder(e), { tamam: false, neden: "Sağlayıcıya bağlanılamadı.", kalici: false });
});

/* NEREDEN GELDİ: 536 — reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli" → "A seçeneğini kabul ediyorum" → maket "onaylıyorum";
   FIRMA-VT FV11 (2026-10-16, K2): gönderim probata'nın Resend hesabından, Yönetim'in eklediği ve doğruladığı alan adıyla; kişisel adresli çalışan
   firmanın GENEL adresinden (<yerel>@alan) kişinin adıyla; otomatik e-postanın cevabı Rapor e-postasına. Önceki "Rapor e-postası alan dışındaysa
   bekler" kuralı kalktı (genel adres hep alan adında — 0099 CHECK); yerine "alan adı doğrulanmadıysa bekler". */
test("Kimden: doğrulanmamış alan adı bekler; alan adındaki kişi kendi adresinden; değilse genel adresten kişinin adıyla, cevap kişiye; otomatikte firma adıyla, cevap Rapor e-postasına", () => {
  const f = { alan: "deneme.example", genel: "Bilgi@Deneme.example", dogrulandi: true, firmaAd: "Deneme Muayene", kopya: false, rapor: "Rapor@Deneme.example" };
  assert.deepEqual(kimdenKur(f, { ad: "Deneme Bir", eposta: "Bir@Deneme.Example" }),
    { tamam: true, kimden: "\"Deneme Bir\" <bir@deneme.example>", cevap: null, gizli: null });
  assert.deepEqual(kimdenKur(f, { ad: "Deneme İki", eposta: "iki@kisisel.example" }),
    { tamam: true, kimden: "\"Deneme İki · Deneme Muayene\" <bilgi@deneme.example>", cevap: "iki@kisisel.example", gizli: null });
  assert.deepEqual(kimdenKur(f, null), { tamam: true, kimden: "\"Deneme Muayene\" <bilgi@deneme.example>", cevap: "rapor@deneme.example", gizli: null },
    "otomatik e-posta: cevap Rapor e-postasına");
  assert.equal((kimdenKur({ ...f, rapor: "bilgi@deneme.example" }, null) as { cevap: string | null }).cevap, null, "Rapor e-postası genel adresse ayrı cevap yok");
  assert.equal((kimdenKur({ ...f, rapor: null }, null) as { cevap: string | null }).cevap, null);
  assert.equal((kimdenKur({ ...f, rapor: "rapor@kisisel.example" }, null) as { cevap: string | null }).cevap, "rapor@kisisel.example", "cevap adresi alan dışında olabilir");
  const kopyali = { ...f, kopya: true };
  assert.deepEqual(kimdenKur(kopyali, { ad: "Deneme Bir", eposta: "bir@deneme.example" }),
    { tamam: true, kimden: "\"Deneme Bir\" <bir@deneme.example>", cevap: null, gizli: "bir@deneme.example" }, "gizli kopya gönderene");
  assert.deepEqual(kimdenKur(kopyali, { ad: "Deneme İki", eposta: "iki@kisisel.example" }),
    { tamam: true, kimden: "\"Deneme İki · Deneme Muayene\" <bilgi@deneme.example>", cevap: "iki@kisisel.example", gizli: "iki@kisisel.example" });
  assert.equal((kimdenKur(kopyali, null) as { gizli: string | null }).gizli, null, "otomatikte kopya kimseye gitmez");
  /* alan adı doğrulanmadı (ya da kayıt bozuk: genel adres alan dışında, alan biçimsiz) → herkes bekler, alan adındaki kişi de */
  for (const bozuk of [{ dogrulandi: false }, { genel: "bilgi@baska.example" }, { alan: "" }, { alan: "Deneme.Example" }]) {
    for (const g of [null, { ad: "Deneme Bir", eposta: "bir@deneme.example" }, { ad: "Deneme İki", eposta: "iki@kisisel.example" }]) {
      assert.deepEqual(kimdenKur({ ...f, ...bozuk }, g), { tamam: false, neden: ALAN_DOGRULANMADI }, JSON.stringify([bozuk, g]));
    }
  }
  /* alt alan adı ayrı alan adıdır; benzer ad eşleşmez */
  assert.equal(gonderenYolu("bir@posta.deneme.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("bir@deneme.example.kotu.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("bir@xdeneme.example", "deneme.example"), "genel");
  assert.equal(gonderenYolu("", "deneme.example"), "yok");
  assert.equal(gonderenYolu("bir@deneme.example", ""), "genel", "alan adı yoksa kimse kendi adresinden göndermez");
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
