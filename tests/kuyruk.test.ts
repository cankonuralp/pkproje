/* NEREDEN GELDİ: 394 — cihazdaki çevrimdışı çıkış kuyruğu (src/components/cevrimdisi/kuyruk.ts; ARKA-UC §4.3–4.4, 09-D1 / D2, maket Z4). Saf:
   tarayıcı deposu yok (bellek kipi), ağ taklitle. Kilitler:
   · aynı rapor için tek bekleyen iş (yeni Kaydet / Onaya gönder eskisinin yerine — ikisi sırayla gitse ikincisi kendisiyle çakışırdı);
   · sırayla gönderir; isteğin gövdesi: kimlik, iş türü, kayıt, yazan etiketi, cihazın gördüğü sürüm, form, cihaz zamanı;
   · sonuçlar görünür: tamam → çıkar (ekrana olay) · çakışma (güncel sürümle; "benimkini yaz" YENİ kimlikle güncel sürümden gider) · eksik ·
     başka hesap (sıradaki iş yine denenir);
   · ağ yok / oturum kapalı (401) / sunucu düştü (5xx): durur, iş bekler (sessiz kayıp yok); bilgi amaçlı işler bağlantılı kayıtla kalkar.
   Uçtan uca (gerçek tarayıcı, bağlantı gerçekten kesilerek): e2e/cevrimdisi.spec.ts. Olumsuz kanıt: tests/bozan/kuyruk.bozan.ts. */
import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";

type Istek = { id: string; tur: string; kayit: string; yazan: string; surum: number; girdi: unknown; zaman: string };
let istekler: Istek[] = [];
let cevap: (g: Istek) => Response | Promise<Response> = () => { throw new TypeError("Failed to fetch"); };
const olaylar: { kayit: string; durum: string }[] = [];
const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

let K: typeof import("../src/components/cevrimdisi/kuyruk.ts");
before(async () => {
  /* tarayıcının yerine: olay hedefi (window), ağ (fetch); depo yok → bellek kipi */
  const w = new EventTarget();
  w.addEventListener("probata-islem", (e) => { const d = (e as CustomEvent<{ kayit: string; durum: string }>).detail; olaylar.push({ kayit: d.kayit, durum: d.durum }); });
  Object.assign(globalThis, { window: w });
  globalThis.fetch = (async (_u: string, init: RequestInit) => {
    const g = JSON.parse(String(init.body)) as Istek;
    istekler.push(g);
    return cevap(g);
  }) as typeof fetch;
  K = await import("../src/components/cevrimdisi/kuyruk.ts");
  K.kuyrukYazani("etiketDeneme00000000000");
});
/** kendiliğinden başlayan gönderim bitene kadar */
async function sakin() { for (let i = 0; i < 50 && K.kuyrukAnlik().gonderiliyor; i++) await new Promise((c) => setTimeout(c, 5)); await new Promise((c) => setTimeout(c, 5)); }
async function bosalt() { for (const x of K.kuyrukAnlik().isler) await K.kuyruktanCikar(x.id); }
const agYok = () => { cevap = () => { throw new TypeError("Failed to fetch"); }; };
beforeEach(async () => { agYok(); await sakin(); await bosalt(); istekler = []; olaylar.length = 0; });
const ekle = async (kayit: string, tur: "rapor.kaydet" | "rapor.gonder", surum = 3, girdi: unknown = { x: kayit }) => {
  await K.kuyrugaEkle({ tur, kayit, surum, girdi, ad: `${tur} · ${kayit}` }); await sakin();
};

test("aynı rapor için tek bekleyen iş: yeni Kaydet / Onaya gönder eskisinin yerine; başka rapor ayrı; bellek kipinde söylenir", async () => {
  await ekle("R1", "rapor.kaydet");
  const ilk = K.kuyrukAnlik().isler[0].id;
  await ekle("R1", "rapor.gonder", 3, { x: "son" });
  await ekle("R2", "rapor.kaydet");
  const l = K.kuyrukAnlik().isler;
  assert.deepEqual(l.map((x) => [x.kayit, x.tur, x.durum]), [["R1", "rapor.gonder", "bekliyor"], ["R2", "rapor.kaydet", "bekliyor"]]);
  assert.notEqual(l[0].id, ilk, "yeni iş yeni kimlik");
  assert.equal(K.kuyrukAnlik().depoYok, true, "depo yok: kullanıcıya söylenir");
});

test("sırayla gönderir; gövde eksiksiz; tamam çıkar (olay), çakışma güncel sürümle kalır; 'benimkini yaz' YENİ kimlikle güncel sürümden", async () => {
  await ekle("R1", "rapor.kaydet", 3, { marka: "A" });
  await ekle("R2", "rapor.kaydet", 5, { marka: "B" });
  istekler = [];   // eklerken ağ yoktu (denemeler sayılmaz)
  cevap = (g) => json(g.kayit === "R1" ? { tekrar: false, sonuc: { durum: "tamam", id: "R1", bildirim: "x" } } : { tekrar: false, sonuc: { durum: "cakisma" }, guncel: 7 });
  assert.equal(await K.kuyrukGonder(), 1);
  assert.deepEqual(istekler.map((g) => [g.kayit, g.surum]), [["R1", 3], ["R2", 5]], "önce yazılan önce");
  const g = istekler[0];
  assert.match(g.id, /^[0-9a-f-]{36}$/);
  assert.deepEqual([g.tur, g.yazan, g.girdi], ["rapor.kaydet", "etiketDeneme00000000000", { marka: "A" }]);
  assert.ok(!Number.isNaN(Date.parse(g.zaman)));
  const l = K.kuyrukAnlik().isler;
  assert.deepEqual(l.map((x) => [x.kayit, x.durum]), [["R2", "cakisma"]]);
  assert.match(l[0].ileti ?? "", /başka yerde değiştirildi/);
  assert.deepEqual(olaylar, [{ kayit: "R1", durum: "tamam" }, { kayit: "R2", durum: "cakisma" }]);
  /* benimkini yaz */
  const eskiKimlik = istekler[1].id;
  istekler = [];
  cevap = () => json({ tekrar: false, sonuc: { durum: "tamam", id: "R2", bildirim: "x" } });
  await K.benimkiniYaz(l[0].id);
  await sakin();
  assert.equal(istekler.length, 1);
  assert.deepEqual([istekler[0].kayit, istekler[0].surum, istekler[0].girdi], ["R2", 7, { marka: "B" }]);
  assert.notEqual(istekler[0].id, eskiKimlik, "yeni kimlik");
  assert.equal(K.kuyrukAnlik().isler.length, 0);
});

test("ağ yok / oturum kapalı / sunucu düştü: durur, iş bekler; başka hesap ve eksik görünür, sıradaki iş yine denenir", async () => {
  await ekle("R1", "rapor.kaydet");
  await ekle("R2", "rapor.kaydet");
  /* ağ yok */
  assert.equal(await K.kuyrukGonder(), 0);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["bekliyor", "bekliyor"]);
  /* oturum kapalı: ilk istekte durur, ikinciyi denemez */
  istekler = [];
  cevap = () => json({ hata: "oturum" }, 401);
  await K.kuyrukGonder();
  assert.equal(istekler.length, 1);
  assert.equal(K.kuyrukAnlik().oturum, true);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["bekliyor", "bekliyor"]);
  /* sunucu düştü */
  istekler = [];
  cevap = () => new Response("x", { status: 503 });
  await K.kuyrukGonder();
  assert.equal(istekler.length, 1);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["bekliyor", "bekliyor"]);
  /* başka hesap: o iş kenara, sıradaki yine denenir (eksik) */
  istekler = [];
  cevap = (g) => (g.kayit === "R1" ? json({ hata: "baska_hesap" }, 409)
    : json({ tekrar: false, sonuc: { durum: "eksik", eksikler: [{ bolum: "b", alan: "a1", ad: "A" }, { bolum: "b", alan: "a2", ad: "B" }] } }));
  await K.kuyrukGonder();
  assert.equal(istekler.length, 2);
  assert.equal(K.kuyrukAnlik().oturum, false);
  const l = K.kuyrukAnlik().isler;
  assert.deepEqual(l.map((x) => [x.kayit, x.durum]), [["R1", "baska_hesap"], ["R2", "eksik"]]);
  assert.match(l[1].ileti ?? "", /2 zorunlu alan/);
  /* rapor bağlantılıyken kaydedilince bilgi amaçlı iş (eksik) kalkar; başka hesabın işi kalır */
  await K.kayitBilgileriniKapat("R2");
  await K.kayitBilgileriniKapat("R1");
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.kayit, x.durum]), [["R1", "baska_hesap"]]);
});
