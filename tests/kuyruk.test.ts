/* NEREDEN GELDİ: 394 — cihazdaki çevrimdışı çıkış kuyruğu (src/components/cevrimdisi/kuyruk.ts; ARKA-UC §4.3–4.4, 09-D1 / D2, maket Z4). Saf:
   tarayıcı deposu yok (bellek kipi), ağ taklitle. Kilitler:
   · aynı rapor için tek bekleyen iş (yeni Kaydet / Onaya gönder eskisinin yerine — ikisi sırayla gitse ikincisi kendisiyle çakışırdı);
   · sırayla gönderir; isteğin gövdesi: kimlik, iş türü, kayıt, yazan etiketi, cihazın gördüğü sürüm, form, cihaz zamanı;
   · sonuçlar görünür: tamam → çıkar (ekrana olay) · çakışma (güncel sürümle; "benimkini yaz" YENİ kimlikle güncel sürümden gider) · eksik ·
     başka hesap (sıradaki iş yine denenir);
   · ağ yok / oturum kapalı (401) / sunucu düştü (5xx): durur, iş bekler (sessiz kayıp yok); bilgi amaçlı işler bağlantılı kayıtla kalkar.
   · 398 fotoğraf: form işinin yerine geçmez; (405'ten beri işler girdiği sırayla gider); sürümü artırınca aynı raporun bekleyen işleri (yalnız kendi fotoğrafıyla
     değiştiyse) yeni sürüme taşınır; fotoğrafı gidemeyen raporun Onaya gönder'i bekler; fotoğraf çakışması "yeniden dene".
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

/* ── 398 FOTOĞRAF ── */
const ekleFoto = async (kayit: string, surum = 3, ad = "on.jpg", yer = "foto|") => {
  await K.kuyrugaEkle({ tur: "rapor.foto", kayit, surum, girdi: { bolum: "foto", madde: null, ad, veri: "AAAA" }, ad: `Fotoğraf · ${kayit} · ${ad}`, yer }); await sakin();
};
/** sunucu taklidi: rapor başına sürüm; fotoğraf o anki sürüme eklenir (önceki / sonraki döner), form işi sürüm tutarsa geçer, tutmazsa çakışma */
function sunucu(surumler: Record<string, number>, foto: (g: Istek) => object | null = () => null) {
  return (g: Istek) => {
    if (g.tur === "rapor.foto") {
      const ozel = foto(g);
      if (ozel) return json({ tekrar: false, sonuc: ozel });
      const once = surumler[g.kayit]++;
      return json({ tekrar: false, sonuc: { durum: "tamam", id: g.kayit, bildirim: "x", surum: { once, sonra: once + 1 } } });
    }
    if (g.surum !== surumler[g.kayit]) return json({ tekrar: false, sonuc: { durum: "cakisma" }, guncel: surumler[g.kayit] });
    surumler[g.kayit]++;
    return json({ tekrar: false, sonuc: { durum: "tamam", id: g.kayit, bildirim: "x" } });
  };
}

/* 2026-10-08 (405): işler GİRDİĞİ SIRAYLA gider (önce "fotoğraflar formdan önce" idi — kayıtlar arası sıra için değişti: planın kabulü, o plana
   açılan rapordan önce gitmeli); bu yüzden fotoğraflar kayıttan ÖNCE girilir, sürüm taşıma aynı şekilde sınanır, sonra kayıt-önce sırası */
test("fotoğraf: form işinin yerine geçmez; işler girdiği sırayla; fotoğraf sürümü artırınca bekleyen Kaydet yeni sürüme taşınır — arada başkası değiştirdiyse taşınmaz", async () => {
  await ekleFoto("R1", 3, "bir.jpg");
  await ekleFoto("R1", 3, "iki.jpg");
  await ekle("R1", "rapor.kaydet", 3, { marka: "A" });
  const l = K.kuyrukAnlik().isler;
  assert.deepEqual(l.map((x) => [x.tur, x.yer]), [["rapor.foto", "foto|"], ["rapor.foto", "foto|"], ["rapor.kaydet", null]], "fotoğraf eklenir, kaydın yerine geçmez");
  /* bağlantı geldi: iki fotoğraf, sonra kayıt — bekleyenler, sürüm yalnız kendi fotoğraflarıyla değiştiği için taşınır: kayıt 5'ten gider ve geçer */
  istekler = [];
  const s = { R1: 3 };
  cevap = sunucu(s);
  assert.equal(await K.kuyrukGonder(), 3);
  assert.deepEqual(istekler.map((g) => [g.tur, g.surum, (g.girdi as { ad?: string }).ad ?? null]), [["rapor.foto", 3, "bir.jpg"], ["rapor.foto", 4, "iki.jpg"], ["rapor.kaydet", 5, null]]);
  assert.equal(s.R1, 6);
  assert.equal(K.kuyrukAnlik().isler.length, 0);
  /* rapor bu arada başka yerde değişti (sunucuda 4): fotoğraf yine eklenir; kayıt taşınmaz, çakışma görünür (sessiz ezme yok) */
  agYok();
  await ekleFoto("R2", 3);
  await ekle("R2", "rapor.kaydet", 3, { marka: "B" });
  istekler = [];
  cevap = sunucu({ R2: 4 });
  await K.kuyrukGonder();
  assert.deepEqual(istekler.map((g) => [g.tur, g.surum]), [["rapor.foto", 3], ["rapor.kaydet", 3]]);
  /* kayıt fotoğraftan ÖNCE girildiyse önce o gider (sürümü tutar), fotoğraf ardından raporun o anki sürümüne eklenir */
  agYok();
  await ekle("R3", "rapor.kaydet", 7, { marka: "C" });
  await ekleFoto("R3", 7);
  istekler = [];
  const s3 = { R3: 7 };
  cevap = sunucu(s3);
  assert.equal(await K.kuyrukGonder(), 2);
  assert.deepEqual(istekler.map((g) => [g.tur, g.surum]), [["rapor.kaydet", 7], ["rapor.foto", 7]]);
  assert.equal(s3.R3, 9);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.tur, x.durum]), [["rapor.kaydet", "cakisma"]]);
});

test("Onaya gönder fotoğrafsız gitmez: raporun gidemeyen fotoğrafı varsa bekler (söylenir), fotoğraf kaldırılınca gider; fotoğraf çakışması 'yeniden dene'", async () => {
  await ekle("R3", "rapor.gonder", 2);
  await ekleFoto("R3", 2);
  istekler = [];
  cevap = sunucu({ R3: 2 }, () => ({ durum: "gecersiz", hatalar: { foto: "En çok 3 fotoğraf." } }));
  assert.equal(await K.kuyrukGonder(), 0);
  assert.deepEqual(istekler.map((g) => g.tur), ["rapor.foto"], "Onaya gönder gitmedi");
  const l = K.kuyrukAnlik().isler;
  assert.deepEqual(l.map((x) => [x.tur, x.durum, x.ileti]), [["rapor.gonder", "bekliyor", "Raporun fotoğrafları gidince gönderilecek."], ["rapor.foto", "hata", "En çok 3 fotoğraf."]]);
  /* kullanıcı gidemeyen fotoğrafı kaldırdı: Onaya gönder gider */
  istekler = [];
  await K.kuyruktanCikar(l[1].id);
  assert.equal(await K.kuyrukGonder(), 1);
  assert.deepEqual(istekler.map((g) => g.tur), ["rapor.gonder"]);
  /* fotoğraf eklenirken rapor aynı anda değişti: "yapılamadı" + yeniden dene YENİ kimlikle */
  agYok();
  await ekleFoto("R4", 1);
  istekler = [];
  cevap = sunucu({ R4: 1 }, () => ({ durum: "cakisma" }));
  await K.kuyrukGonder();
  const f = K.kuyrukAnlik().isler[0];
  assert.deepEqual([f.durum, f.ileti], ["hata", "Rapor fotoğraf eklenirken aynı anda değişti; yeniden deneyin."]);
  const eski = istekler[0].id;
  istekler = [];
  cevap = sunucu({ R4: 1 });
  await K.yenidenDene(f.id);
  await sakin();
  assert.equal(istekler.length, 1);
  assert.notEqual(istekler[0].id, eski);
  assert.equal(K.kuyrukAnlik().isler.length, 0);
});

test("400 plan kabul / red: aynı planın bekleyen işinin yerine geçer, rapor işlerine dokunmaz; çakışma ve 'yok' iletisi plan için", async () => {
  await ekle("R7", "rapor.kaydet", 1);
  await K.kuyrugaEkle({ tur: "plan.kabul", kayit: "P1", surum: 4, girdi: { beyanOnay: true, beyanOzet: "x" }, ad: "Plan kabulü · P1" }); await sakin();
  await K.kuyrugaEkle({ tur: "plan.red", kayit: "P1", surum: 4, girdi: { gerekce: "Deneme gerekçe" }, ad: "Plan reddi · P1" }); await sakin();
  await K.kuyrugaEkle({ tur: "plan.kabul", kayit: "P2", surum: 2, girdi: { beyanOnay: true, beyanOzet: "x" }, ad: "Plan kabulü · P2" }); await sakin();
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.kayit, x.tur]), [["R7", "rapor.kaydet"], ["P1", "plan.red"], ["P2", "plan.kabul"]]);
  istekler = [];
  cevap = (g) => json(g.kayit === "R7" ? { tekrar: false, sonuc: { durum: "tamam", id: "R7", bildirim: "x" } }
    : g.kayit === "P1" ? { tekrar: false, sonuc: { durum: "cakisma" }, guncel: 5 } : { tekrar: false, sonuc: { durum: "yok" } });
  assert.equal(await K.kuyrukGonder(), 1);
  assert.deepEqual(istekler.map((g) => [g.kayit, g.tur, g.surum]), [["R7", "rapor.kaydet", 1], ["P1", "plan.red", 4], ["P2", "plan.kabul", 2]]);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.kayit, x.durum, x.ileti]), [
    ["P1", "cakisma", "Plan bu cihazda işlenirken başka yerde değiştirildi."],
    ["P2", "hata", "Plan bulunamadı (silinmiş ya da size açık değil)."],
  ]);
});

test("404 bekleyen içerik: kaydın sunucuya yazılmamış son form içeriği (bekliyor / çakışma / yapılamadı); 'eksik'te ve fotoğrafta yok", async () => {
  await ekle("R8", "rapor.kaydet", 1, { ekipman: { marka: "İlk" } });
  await ekle("R8", "rapor.kaydet", 1, { ekipman: { marka: "Son" } });
  await ekleFoto("R8", 1);
  assert.deepEqual(await K.bekleyenIcerik("R8"), { girdi: { ekipman: { marka: "Son" } }, durum: "bekliyor", tur: "rapor.kaydet" });
  assert.equal(await K.bekleyenIcerik("R-yok"), null);
  /* sunucu kaydetti ama gönderilmedi ("eksik"): içerik sunucuda — cihazdaki gösterilmez */
  istekler = [];
  cevap = (g) => json(g.tur === "rapor.foto" ? { tekrar: false, sonuc: { durum: "tamam", id: "R8", bildirim: "x", surum: { once: 1, sonra: 2 } } }
    : { tekrar: false, sonuc: { durum: "eksik", eksikler: [{ bolum: "b", alan: "a", ad: "A" }] } });
  await K.kuyrukGonder();
  assert.equal(await K.bekleyenIcerik("R8"), null);
  /* çakışmada cihazdaki içerik gösterilir (kullanıcı hangisini seçeceğini görür) */
  agYok();
  await ekle("R9", "rapor.gonder", 4, { ekipman: { marka: "Cihazda" } });
  cevap = () => json({ tekrar: false, sonuc: { durum: "cakisma" }, guncel: 5 });
  await K.kuyrukGonder();
  assert.deepEqual(await K.bekleyenIcerik("R9"), { girdi: { ekipman: { marka: "Cihazda" } }, durum: "cakisma", tur: "rapor.gonder" });
});

test("405 yeni rapor: tek açılış işi; işleri rapor açılmadan gitmez; aynı planın kabulü bekliyorsa rapor ondan sonra; açılınca gerçek kimliğe bağlanır, sürüm taşınır", async () => {
  const GECICI = "11111111-1111-4111-8111-111111111111", PLAN = "22222222-2222-4222-8222-222222222222", EKP = "33333333-3333-4333-8333-333333333333";
  const GERCEK = "44444444-4444-4444-8444-444444444444", yer = `${PLAN}|${EKP}`;
  const yeniler: (string | null)[] = [];
  const dinle = (e: Event) => { yeniler.push((e as CustomEvent<{ yeni: string | null }>).detail.yeni); };
  (globalThis as unknown as { window: EventTarget }).window.addEventListener("probata-islem", dinle);
  await K.kuyrugaEkle({ tur: "plan.kabul", kayit: PLAN, surum: 2, girdi: { beyanOnay: true, beyanOzet: "x" }, ad: "Plan kabulü" }); await sakin();
  for (let i = 0; i < 2; i++) { await K.kuyrugaEkle({ tur: "rapor.olustur", kayit: GECICI, surum: 0, girdi: { plan: PLAN, ekipman: EKP }, ad: "Yeni rapor", yer }); await sakin(); }
  await ekleFoto(GECICI, 0);
  await ekle(GECICI, "rapor.kaydet", 0, { ekipman: { marka: "Yeni" } });
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.tur), ["plan.kabul", "rapor.olustur", "rapor.foto", "rapor.kaydet"], "açılış işi bir kez");
  /* planın kabulü gidemedi (çakışma): rapor açılmaz, işleri de gitmez */
  istekler = [];
  cevap = (g) => json(g.tur === "plan.kabul" ? { tekrar: false, sonuc: { durum: "cakisma" }, guncel: 3 } : { tekrar: false, sonuc: { durum: "tamam", id: GERCEK, bildirim: "x" } });
  await K.kuyrukGonder();
  assert.deepEqual(istekler.map((g) => g.tur), ["plan.kabul"]);
  /* rapor açılamadı (plan günü): işleri bekler, gitmez */
  await K.kuyruktanCikar(K.kuyrukAnlik().isler[0].id);
  istekler = [];
  cevap = () => json({ tekrar: false, sonuc: { durum: "red", neden: "Plan günü henüz gelmedi." } });
  await K.kuyrukGonder();
  assert.deepEqual(istekler.map((g) => g.tur), ["rapor.olustur"]);
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.tur, x.durum]), [["rapor.olustur", "hata"], ["rapor.foto", "bekliyor"], ["rapor.kaydet", "bekliyor"]]);
  /* yeniden denendi, açıldı: fotoğraf ve kayıt sunucunun verdiği kimlikle, kayıt fotoğrafın artırdığı sürümden */
  let surum = 0;
  cevap = (g) => {
    if (g.tur === "rapor.olustur") return json({ tekrar: false, sonuc: { durum: "tamam", id: GERCEK, bildirim: "x", surum: { once: 0, sonra: 0 } } });
    if (g.tur === "rapor.foto") { const once = surum++; return json({ tekrar: false, sonuc: { durum: "tamam", id: GERCEK, bildirim: "x", surum: { once, sonra: surum } } }); }
    return g.surum === surum ? (surum++, json({ tekrar: false, sonuc: { durum: "tamam", id: GERCEK, bildirim: "x" } })) : json({ tekrar: false, sonuc: { durum: "cakisma" }, guncel: surum });
  };
  istekler = [];
  yeniler.length = 0;
  await K.yenidenDene(K.kuyrukAnlik().isler[0].id);
  await sakin();
  assert.deepEqual(istekler.map((g) => [g.tur, g.kayit, g.surum]), [["rapor.olustur", GECICI, 0], ["rapor.foto", GERCEK, 0], ["rapor.kaydet", GERCEK, 1]]);
  assert.equal(K.kuyrukAnlik().isler.length, 0);
  assert.equal(yeniler[0], GERCEK, "olay yeni kimliği taşır");
  (globalThis as unknown as { window: EventTarget }).window.removeEventListener("probata-islem", dinle);
});
