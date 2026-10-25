/* NEREDEN GELDİ: 432 — reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme kısmına elle ya
   da listeden mail girilebilecek". Veritabanısız kilitler: adres süzgeci (küçük harf, biçim, tekrar), plan e-postasının metni (ekibe kabul / red çağrısı,
   bilgilendirilene bilgi; iç kimlik yok), sağlayıcı bağdaştırıcısı (536: firmanın anahtarı yoksa YOK; yerel sunucuya karşı: 2xx gönderildi, 4xx kalıcı ret,
   429 / 5xx yeniden denenir; istek biçimi, cevap / gizli kopya), Kimden kuralı (536: kimden.ts). Kuyruk ve gönderim veritabanında: tests/planlar.test.ts "432". Olumsuz kanıt: tests/bozan/eposta.bozan.ts. */
import assert from "node:assert/strict";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { after, before, test } from "node:test";
import { onBilgiDosyaAdi, onBilgiEpostasi, planEpostasi } from "../src/modules/planlar/sema.ts";
import { adresler, ekAdi } from "../src/server/eposta/eposta.ts";
import { bekleyenleriGonder, EK_BOZUK, EK_OKUNAMADI, EK_YOK } from "../src/server/eposta/gonder.ts";
import { ALAN_BICIMI, ALAN_DOGRULANMADI, alanAdi, alanSadelestir, gonderenYolu, kimdenKur } from "../src/server/eposta/kimden.ts";
import { epostaSaglayicisi, istekGovdesi } from "../src/server/eposta/saglayici.ts";
import { oku } from "./yardimci/denetimler.ts";
import { ozet, sahteDepo, sahteGonderim, sahteKuyruk, satir } from "./yardimci/sahte-eposta-vt.ts";

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

/* NEREDEN GELDİ: 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri
   için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"; "ön bilgilendirme formunu plan açılınca müşteriye e-postayla
   gönder"; göç 0105). Kilitlenenler: sağlayıcıya ek Resend biçiminde (attachments: filename + base64) yalnız varsa; ekli e-postada ekin baytları
   depodan okunup özeti kayıttakiyle aynıysa gider — dosya kaydı yoksa "hata", depo okunamaz ya da içerik bozuksa bekler (deneme + 1, 5'te "hata");
   hiçbir durumda sağlayıcıya EKSİZ gitmez; ekin adı denetim karakteri / tırnak / yol ayracı taşımaz; ön bilgilendirme e-postasının metni.
   Olumsuz kanıt: tests/bozan/eposta.bozan.ts 7–8. */
test("sağlayıcı: ek Resend biçiminde (attachments: filename + base64) yalnız varsa; ekli istekte bekleme 30 sn", async () => {
  const e = { kimden: "\"Deneme\" <bilgi@deneme.example>", kime: "ali@deneme.example", cevap: null, gizli: null, konu: "Konu", metin: "Metin" };
  assert.deepEqual(istekGovdesi(e), { from: e.kimden, to: ["ali@deneme.example"], subject: "Konu", text: "Metin" }, "eksiz istekte attachments yok");
  const icerik = new TextEncoder().encode("%PDF-1.7 deneme");
  assert.deepEqual(istekGovdesi({ ...e, ek: { ad: "P-1026-001-on-bilgilendirme-formu.pdf", icerik } }).attachments,
    [{ filename: "P-1026-001-on-bilgilendirme-formu.pdf", content: Buffer.from(icerik).toString("base64") }]);
  const s = epostaSaglayicisi("deneme-anahtar", { PROBATA_EPOSTA_UC: `${uc}/emails/200` })!;
  assert.deepEqual(await s.gonder({ ...e, ek: { ad: "form.pdf", icerik } }), { tamam: true });
  const g = gelen.at(-1)!.govde as { attachments: { filename: string; content: string }[] };
  assert.equal(Buffer.from(g.attachments[0].content, "base64").toString(), "%PDF-1.7 deneme", "sağlayıcıya giden ek baytları aynen");
  assert.match(oku("src/server/eposta/saglayici.ts"), /const sn = e\.ek \? 30 : 10;/);
});

test("ekin adı: denetim karakteri, tırnak ve yol ayracı atılır, en çok 200 karakter", () => {
  assert.equal(ekAdi(" a/b\\c\"d\r\ne.pdf "), "a b c d e.pdf");
  assert.equal(ekAdi("x".repeat(300)).length, 200);
  assert.equal(ekAdi(" \u0000 "), "");
});

test("ekli e-posta: ek depodan okunup özeti tutarsa gider; kayıt yoksa hata, depo okunamaz / bozuksa bekler; sağlayıcıya EKSİZ gitmez", async () => {
  const pdf = new TextEncoder().encode("%PDF-1.7 ön bilgilendirme");
  const D = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  const satirlar = [
    satir(D(1), { dosya: D(1), ad: "form.pdf" }),   // ek tamam
    satir(D(2), { dosya: D(2), ad: "form.pdf" }),   // dosya kaydı yok
    satir(D(3), { dosya: D(3), ad: "form.pdf" }),   // depo okunamaz
    satir(D(4), { dosya: D(4), ad: "form.pdf" }),   // özet tutmaz
    satir(D(5), { dosya: D(3), ad: "form.pdf" }, 4),   // depo okunamaz, 5. deneme
    satir(D(6), null),                               // eksiz e-posta
  ];
  const k = sahteKuyruk(satirlar, {
    [D(1)]: { anahtar: "a1", sha256: ozet(pdf) }, [D(3)]: { anahtar: "a3", sha256: ozet(pdf) }, [D(4)]: { anahtar: "a4", sha256: ozet(pdf) },
  });
  const g = sahteGonderim();
  const o = await bekleyenleriGonder(k.db, g.ayar, { depo: sahteDepo({ a1: pdf, a4: new TextEncoder().encode("%PDF-1.7 başka") }) });
  assert.deepEqual(o, { gonderilen: 2, bekleyen: 2, hatali: 2 });
  assert.deepEqual(g.giden.map((x) => [x.kime.slice(0, 4), x.ek ? new TextDecoder().decode(x.ek.icerik) : null, x.ek?.ad ?? null]),
    [["0000", "%PDF-1.7 ön bilgilendirme", "form.pdf"], ["0000", null, null]], "yalnız eki okunan ve eksiz e-posta sağlayıcıya gider");
  assert.equal(g.giden.length, 2);
  assert.equal(k.son(D(1))?.durum, "gonderildi");
  assert.deepEqual(k.son(D(2)), { durum: "hata", deneme: 1, son_hata: EK_YOK });
  assert.deepEqual(k.son(D(3)), { deneme: 1, son_hata: EK_OKUNAMADI }, "bekler (durum değişmez), deneme sayılır");
  assert.deepEqual(k.son(D(4)), { deneme: 1, son_hata: EK_BOZUK });
  assert.deepEqual(k.son(D(5)), { durum: "hata", deneme: 5, son_hata: EK_OKUNAMADI }, "5. denemede hata");
  assert.equal(k.son(D(6))?.durum, "gonderildi");
  /* yalnız ek adı ya da yalnız kimlik (veritabanı CHECK'i izin vermez; yine de eksiz gitmez) */
  const k2 = sahteKuyruk([{ ...satir(D(7), null), ek_ad: "form.pdf" }], {});
  const g2 = sahteGonderim();
  assert.deepEqual(await bekleyenleriGonder(k2.db, g2.ayar, { depo: sahteDepo({}) }), { gonderilen: 0, bekleyen: 0, hatali: 1 });
  assert.equal(g2.giden.length, 0);
});

test("ön bilgilendirme e-postası: konu firma + tesis, gövdede proje no, tarih aralığı, adres; düz metin, kimlik ve bağlantı yok", () => {
  const e = onBilgiEpostasi({ firma: "Deneme Muayene", musteri: "Deneme Sanayi A.Ş.", tesis: "Merkez", no: "P-1026-007", adres: "Deneme Cad. 1, Çankaya / Ankara",
    baslangic: "2026-10-12", bitis: "2026-10-13" });
  assert.equal(e.konu, "Deneme Muayene: Merkez periyodik kontrol ön bilgilendirme formu");
  assert.ok(e.govde.startsWith("Sayın Deneme Sanayi A.Ş.,") && e.govde.includes("ön bilgilendirme formu ektedir"));
  assert.ok(e.govde.includes("Proje no: P-1026-007") && e.govde.includes("Tarih: 12.10.2026 – 13.10.2026") && e.govde.includes("Adres: Deneme Cad. 1"));
  assert.ok(!/<|https?:/.test(e.govde), "düz metin, bağlantı yok");
  const t = onBilgiEpostasi({ firma: "F", musteri: "M", tesis: "T", no: "P-1", adres: null, baslangic: "2026-10-12", bitis: "2026-10-12" });
  assert.ok(t.govde.includes("Tarih: 12.10.2026\n") && !t.govde.includes("Adres:"));
  assert.equal(onBilgiDosyaAdi("P-1026-007"), "P-1026-007-on-bilgilendirme-formu.pdf");
});
