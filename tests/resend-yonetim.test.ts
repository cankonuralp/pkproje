/* NEREDEN GELDİ: FIRMA-VT.md §5.8, FV11 (sunum 579 onaylı, 2026-10-15; K2 — reisim: "resend için tek seçenek var ve o da firmaların kendi mail adresleri
   ile mail atılması"): probata'nın TEK Resend hesabında firmanın alan adı Yönetim'den eklenir. SAF: yerel taklit (tests/yardimci/sahte-resend.ts).
   Kilitlenenler:
   · ayar: anahtar yoksa null (Yönetim'de kapalı); biçimsizse HATA, iletide değer yok; uç varsayılan api.resend.com; PROBATA_RESEND_YONETIM_UC yalnız yerel;
   · istek: Bearer anahtar, açık User-Agent "probata", yönlendirme yok; alan adı ekle AB bölgesinde (eu-west-1); geçersiz alan / kimlik / anahtar adıyla
     istek GİTMEZ; gönderme anahtarı yalnız "sending_access" ve alan adına bağlı;
   · yanıt biçimi denetlenir (DNS kayıtları: tür, ad, değer, öncelik; en çok 20) — tutmazsa ResendBicimHatasi;
   · 429: Retry-After kadar bekler, en çok 3 kez; başka hata yeniden denenmez;
   · hata SIRSIZ: yalnız durum; sunucunun iletisi ve anahtar iletide yok.
   Yönetimin akışı gerçek PostgreSQL'de: tests/eposta-gonderim.test.ts. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { RESEND, ResendBicimHatasi, ResendHatasi, resendAyari, resendYonetimi } from "../src/server/dis/resend-yonetim.ts";
import { sahteResendKur, type SahteResend } from "./yardimci/sahte-resend.ts";

let r: SahteResend;
before(async () => { r = await sahteResendKur(); });
after(async () => { await r?.kapat(); });
const ayar = () => resendAyari({ PROBATA_RESEND_ANAHTARI: r.anahtar, PROBATA_RESEND_YONETIM_UC: r.url })!;

test("ayar: anahtar yoksa kapalı (null); biçimsizse hata (değer iletide yok); uç varsayılan api.resend.com; uç yalnız yerel adres", () => {
  assert.equal(resendAyari({}), null);
  assert.equal(resendAyari({ PROBATA_RESEND_ANAHTARI: "  " }), null);
  for (const k of ["kisa", "sk-ant-uydurmaAnahtarDegil0123456789", "re_ boşluklu anahtar 0123456789"]) {
    assert.throws(() => resendAyari({ PROBATA_RESEND_ANAHTARI: k }), (h: Error) => /biçimsiz/.test(h.message) && !h.message.includes(k));
  }
  const v = resendAyari({ PROBATA_RESEND_ANAHTARI: "re_uydurmaAnahtarDegildir0123" })!;
  assert.deepEqual([v.uc, v.yerel], ["https://api.resend.com", false]);
  for (const uc of ["https://api.resend.com.kotu.example", "http://10.0.0.5:8080", "https://127.0.0.1:443", "file:///x"]) {
    assert.throws(() => resendAyari({ PROBATA_RESEND_ANAHTARI: r.anahtar, PROBATA_RESEND_YONETIM_UC: uc }), /yalnız yerel/, uc);
  }
  assert.deepEqual([ayar().uc, ayar().yerel], [r.url, true]);
});

test("istek: alan adı ekle (AB), oku, doğrula, gönderme anahtarı (sending_access, alan adına bağlı); Bearer + User-Agent; geçersiz girdide istek yok", async () => {
  const y = resendYonetimi(ayar());
  const once = r.istekler.length;
  await assert.rejects(y.alanEkle("Kötü Alan"), /Geçersiz alan adı/);
  await assert.rejects(y.alan("../api-keys"), /Geçersiz Resend kimliği/);
  await assert.rejects(y.gondermeAnahtari("Kotu Ad", "6f9619ff-8b86-4011-b42d-00c04fc964ff"), /Geçersiz anahtar adı/);
  assert.equal(r.istekler.length, once, "geçersiz girdiyle istek gitmedi");
  const a = await y.alanEkle("deneme-istemci.example");
  assert.deepEqual(JSON.parse(r.istekler.at(-1)!.govde), { name: "deneme-istemci.example", region: "eu-west-1" });
  assert.equal(r.istekler.at(-1)!.ua, "probata");
  assert.deepEqual([a.ad, a.durum, a.kayitlar.length], ["deneme-istemci.example", "not_started", 3]);
  assert.deepEqual(a.kayitlar[0], { tur: "MX", ad: "send", deger: "feedback-smtp.eu-west-1.amazonses.com", oncelik: 10, durum: "not_started", kayit: "SPF" });
  assert.deepEqual((await y.alanlar()).map((x) => x.ad), ["deneme-istemci.example"]);
  await y.dogrula(a.id);
  assert.equal((await y.alan(a.id)).durum, "verified");
  const k = await y.gondermeAnahtari("probata-deneme-istemci", a.id);
  assert.match(k.anahtar, /^re_/);
  assert.deepEqual(JSON.parse(r.istekler.at(-1)!.govde), { name: "probata-deneme-istemci", permission: "sending_access", domain_id: a.id });
  assert.ok(r.istekler.every((i) => i.ua === "probata"), "her istekte açık User-Agent");
  const yanlis = resendYonetimi({ ...ayar(), anahtar: "re_yanlisAnahtarDegil0123456789" });
  await assert.rejects(yanlis.alanlar(), (h: unknown) => h instanceof ResendHatasi && h.durum === 401);
});

test("429: Retry-After kadar bekler ve sürdürür (en çok 3); dördüncüde hata; başka hata yeniden denenmez; hata iletisi sırsız", async () => {
  const bekleyisler: number[] = [];
  const y = resendYonetimi(ayar(), { bekle: async (ms) => { bekleyisler.push(ms); } });
  r.sinir429 = 2;
  await y.alanlar();
  assert.deepEqual(bekleyisler, [0, 0]);
  r.sinir429 = 4;
  await assert.rejects(y.alanlar(), (h: unknown) => h instanceof ResendHatasi && h.durum === 429);
  r.sinir429 = 0;
  r.hatalar.push({ yontem: "GET", yol: /^\/domains$/, durum: 500, kez: 1 });
  const once = r.istekler.length;
  const h = await y.alanlar().then(() => null, (e: unknown) => e as ResendHatasi);
  assert.equal(r.istekler.length, once + 1, "5xx yeniden denenmedi");
  assert.ok(h instanceof ResendHatasi && h.durum === 500);
  assert.equal(h.message, "Resend reddetti (500)");
  assert.ok(!/gizli_ayrinti|re_/.test(h.message + String(h.stack)), "sunucunun iletisi ve anahtar iletide yok");
  assert.ok(RESEND.enCok429 === 3 && RESEND.toplamBekleMs <= 15_000);
});

test("yanıt biçimi denetlenir: DNS kaydı biçimsiz ya da çok, kimlik bozuk → ResendBicimHatasi (değer kullanılmaz)", async () => {
  const yanitlar: unknown[] = [];
  const s = createServer((_i, y) => { y.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(yanitlar.shift() ?? {})); });
  await new Promise<void>((c) => s.listen(0, "127.0.0.1", c));
  try {
    const y = resendYonetimi({ uc: `http://127.0.0.1:${(s.address() as { port: number }).port}`, anahtar: "re_uydurmaAnahtarDegil0123456789", yerel: true });
    const id = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
    const kayit = { type: "TXT", name: "resend._domainkey", value: "p=x", status: "pending" };
    for (const bozuk of [
      { id, name: "a.example", status: "pending", records: [{ ...kayit, value: 42 }] },
      { id, name: "a.example", status: "pending", records: [{ ...kayit, type: "txt; rm" }] },
      { id, name: "a.example", status: "pending", records: Array.from({ length: 21 }, () => kayit) },
      { id: "../x", name: "a.example", status: "pending", records: [] },
      { id, name: "a.example" },
      [],
    ]) {
      yanitlar.push(bozuk);
      await assert.rejects(y.alan(id), (h: unknown) => h instanceof ResendBicimHatasi, JSON.stringify(bozuk).slice(0, 80));
    }
    yanitlar.push({ id: "x", token: "re_kisa" });
    await assert.rejects(y.gondermeAnahtari("probata-a", id), (h: unknown) => h instanceof ResendBicimHatasi, "biçimsiz anahtar");
    yanitlar.push({ id, name: "baska.example", status: "not_started", records: [] });
    await assert.rejects(y.alanEkle("a.example"), (h: unknown) => h instanceof ResendBicimHatasi, "başka alan adı döndü");
  } finally { await new Promise<void>((c) => s.close(() => c())); }
});
