/* NEREDEN GELDİ: FIRMA-VT.md §5.5, §7.4, FV8 (sunum 579 onaylı, 2026-10-15) — göçler Supabase Yönetim API'siyle uygulanacak; PAT Vercel ortamında,
   "uç adresi yalnız yerel" (§2 A4: PAT'i taşıyan istemcide uç değiştirme yalnız yerel adreste kabul edilmeli). SAF: yerel taklit
   (tests/yardimci/sahte-supabase-yonetim.ts). Kilitlenenler:
   · ayar: anahtar yoksa / biçimsizse HATA, iletide değer yok; uç varsayılan api.supabase.com; PROBATA_SUPABASE_YONETIM_UC yalnız yerel adres;
   · proje kimliği: ref (20 küçük harf / rakam); "yerel-…" yalnız yerel uçla; geçersiz kimlikle istek GİTMEZ;
   · istek: yalnız sorgu ucu, anahtar Bearer başlığında, gövde {"query"}; 201 → satırlar;
   · 429: Retry-After kadar bekler, en çok 3 kez, toplam bekleme 30 sn'yi aşmaz; başka hata yeniden denenmez (göç yan etkili);
   · hata SIRSIZ: durum + SQLSTATE; sunucunun iletisi (tablo adı, değer) ve anahtar iletide yok.
   2026-10-16 (FV10, kurulum makinesi): kurulum ayarı (örgüt yoksa / biçimsizse kapalı; projelerin Storage adresi YALNIZ yerel taklitte ve yerel
   adres) · proje uçları: proje aç — AB (eu-central-1, "specific"), küçük boy, ad ve sahip parolası denetimi (geçersizse istek GİTMEZ); liste; sağlık
   (hazır olana dek COMING_UP); yalnız TLS (uygulandığı yanıtla doğrulanır); havuzcu; gizli anahtar — adıyla bulunur, yoksa BİR kez açılır; kaldır.
   Olumsuz kanıt: tests/bozan/supabase-yonetim.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { bekleSuresi, kurulumAyari, projeGecerli, sqlDurumu, supabaseYonetimi, yonetimAyari, YonetimHatasi, YONETIM } from "../src/server/dis/supabase-yonetim.ts";
import { sahteYonetimKur, type SahteYonetim } from "./yardimci/sahte-supabase-yonetim.ts";

let s: SahteYonetim;
const REF = "abcdefghij0123456789";
before(async () => {
  s = await sahteYonetimKur();
  s.projeler.set(REF, async (sql) => (sql.startsWith("SELECT 1") ? [{ n: 1 }] : []));
  s.projeler.set("yerel-merkez", async () => [{ yer: "merkez" }]);
  s.projeler.set("bozuk00000000000000x", async () => { throw Object.assign(new Error("relation \"gizli_tablo\" already exists — değer 4111-1111"), { code: "42P07" }); });
});
after(async () => { await s?.kapat(); });
const ayar = (ek: Record<string, string> = {}) => yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url, ...ek });

test("ayar: anahtar yoksa / biçimsizse hata (değer iletide yok); uç varsayılan api.supabase.com; uç yalnız yerel adres", () => {
  assert.throws(() => yonetimAyari({}), /PROBATA_SUPABASE_YONETIM_ANAHTARI/);
  for (const k of ["kisa", "sbp_ boşluklu anahtar 0123456789abcdef"]) {
    assert.throws(() => yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: k }), (h: Error) => /biçimsiz/.test(h.message) && !h.message.includes(k));
  }
  const v = yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: "sbp_uydurmaAnahtarDegildir0123456789wxyz" });
  assert.deepEqual([v.uc, v.yerel], ["https://api.supabase.com", false]);
  for (const uc of ["https://api.supabase.com.kotu.example", "http://10.0.0.5:8080", "https://127.0.0.1:443", "http://127.0.0.1.example:80", "file:///x"]) {
    assert.throws(() => yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: uc }), /yalnız yerel/, uc);
  }
  assert.deepEqual([ayar().uc, ayar().yerel], [s.url, true]);
});

test("proje kimliği: ref; 'yerel-…' yalnız yerel uçla; geçersiz kimlikle istek gitmez", async () => {
  assert.ok(projeGecerli(REF, false));
  assert.ok(!projeGecerli("yerel-merkez", false) && projeGecerli("yerel-merkez", true));
  assert.ok(projeGecerli("yerel-6f9619ff-8b86-4011-b42d-00c04fc964ff", true));
  for (const p of ["ABCDEFGHIJ0123456789", "abc", "../x", `${REF}/../baska`, "yerel-baska"]) assert.ok(!projeGecerli(p, true), p);
  const once = s.istekler.length;
  await assert.rejects(supabaseYonetimi(ayar()).sorgu("../../v1/organizations", "SELECT 1"), /Geçersiz proje/);
  assert.equal(s.istekler.length, once, "istek gitmedi");
});

test("istek: sorgu ucu, Bearer anahtar, {query}; 201 → satırlar; yanlış anahtar 401 hatası", async () => {
  const y = supabaseYonetimi(ayar());
  assert.deepEqual(await y.sorgu(REF, "SELECT 1 AS n"), [{ n: 1 }]);
  /* 2026-10-16 (FV10): taklidin kaydı yöntem, yol ve gövdeyi de taşır — alanlar tek tek */
  const son = s.istekler.at(-1)!;
  assert.deepEqual([son.yontem, son.yol, son.proje, son.sql], ["POST", `/v1/projects/${REF}/database/query`, REF, "SELECT 1 AS n"]);
  assert.deepEqual(JSON.parse(son.govde), { query: "SELECT 1 AS n" });
  assert.deepEqual(await y.sorgu("yerel-merkez", "SELECT 2"), [{ yer: "merkez" }]);
  const yanlis = supabaseYonetimi({ ...ayar(), anahtar: "sbp_yanlis0123456789abcdef0123456789abcd" });
  await assert.rejects(yanlis.sorgu(REF, "SELECT 1"), (h: unknown) => h instanceof YonetimHatasi && h.durum === 401);
});

test("429: Retry-After kadar bekler ve sürdürür (en çok 3); dördüncüde hata; başka hata yeniden denenmez", async () => {
  const bekleyisler: number[] = [];
  const y = supabaseYonetimi(ayar(), { bekle: async (ms) => { bekleyisler.push(ms); } });
  s.sinir429 = 2;
  assert.deepEqual(await y.sorgu(REF, "SELECT 1 x"), [{ n: 1 }]);
  assert.deepEqual(bekleyisler, [0, 0], "Retry-After: 0");
  s.sinir429 = 4;
  await assert.rejects(y.sorgu(REF, "SELECT 1 y"), (h: unknown) => h instanceof YonetimHatasi && h.durum === 429);
  s.sinir429 = 0;
  const once = s.istekler.length;
  await assert.rejects(y.sorgu("bozuk00000000000000x", "CREATE TABLE x ()"));
  assert.equal(s.istekler.length, once + 1, "SQL hatası yeniden denenmedi");
  assert.equal(bekleSuresi("3"), 3000);
  assert.equal(bekleSuresi(new Date(Date.now() + 5000).toUTCString(), Date.now()) !== null, true);
  assert.equal(bekleSuresi(null), null);
  assert.ok(YONETIM.toplamBekleMs <= 30_000 && YONETIM.enCok429 === 3);
});

test("hata SIRSIZ: yalnız durum + SQLSTATE; sunucunun iletisi ve anahtar iletide yok", async () => {
  const y = supabaseYonetimi(ayar());
  const h = await y.sorgu("bozuk00000000000000x", "CREATE TABLE x ()").then(() => null, (e: unknown) => e as YonetimHatasi);
  assert.ok(h instanceof YonetimHatasi);
  assert.deepEqual([h.durum, h.kod], [400, "42P07"]);
  assert.equal(h.message, "Supabase yönetim API'si reddetti (400, 42P07)");
  assert.ok(!/gizli_tablo|4111|sbp_/.test(h.message + String(h.stack)), "ileti ve anahtar sızmadı");
  assert.equal(sqlDurumu("Failed to run sql query: ERROR:  42601: syntax error"), "42601");
  assert.equal(sqlDurumu("başka biçim"), null);
});

test("FV10 kurulum ayarı: örgüt yoksa / biçimsizse kapalı; projelerin Storage adresi yalnız yerel taklitte ve yerel adres", () => {
  const e = { PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url };
  assert.equal(kurulumAyari(e), null, "örgüt yok");
  assert.equal(kurulumAyari({ ...e, PROBATA_SUPABASE_ORGUT: "a b" }), null, "örgüt biçimsiz");
  assert.equal(kurulumAyari({ PROBATA_SUPABASE_ORGUT: "probata-deneme" }), null, "anahtar yok");
  const k = kurulumAyari({ ...e, PROBATA_SUPABASE_ORGUT: "probata-deneme", PROBATA_SUPABASE_DEPO_UC: "http://127.0.0.1:5999/" });
  assert.deepEqual([k?.orgut, k?.depoUc, k?.yonetim.yerel], ["probata-deneme", "http://127.0.0.1:5999", true]);
  assert.throws(() => kurulumAyari({ ...e, PROBATA_SUPABASE_ORGUT: "probata-deneme", PROBATA_SUPABASE_DEPO_UC: "https://depo.kotu.example" }), /yalnız yerel/);
  assert.throws(() => kurulumAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_ORGUT: "probata-deneme", PROBATA_SUPABASE_DEPO_UC: "http://127.0.0.1:5999" }),
    /yalnız yerel/, "gerçek uçla taklit deposu olmaz");
});

test("FV10 proje uçları: aç (AB, küçük boy; geçersiz girdide istek yok) · liste · sağlık · yalnız TLS · havuzcu · gizli anahtar bir kez · kaldır", async () => {
  s.projeKur = async () => ({ yurutucu: async () => [], havuzcu: [{ db_host: "127.0.0.1", db_port: 6543, db_name: "postgres", pool_mode: "transaction" }] });
  const y = supabaseYonetimi(ayar());
  const once = s.istekler.length;
  await assert.rejects(y.projeAc({ ad: "Büyük Harf", orgut: "probata-deneme", sahipParolasi: "x".repeat(32) }), /geçersiz/);
  await assert.rejects(y.projeAc({ ad: "probata-a-0f2c9a1e", orgut: "probata-deneme", sahipParolasi: "kisa" }), /geçersiz/);
  assert.equal(s.istekler.length, once, "geçersiz girdiyle istek gitmedi");
  const p = await y.projeAc({ ad: "probata-a-0f2c9a1e", orgut: "probata-deneme", sahipParolasi: "uydurma-sahip-parolasi-0123456789" });
  assert.match(p.id, /^yerel-/);
  assert.deepEqual([p.ad, p.durum], ["probata-a-0f2c9a1e", "COMING_UP"]);
  const ac = s.istekler.find((i) => i.yontem === "POST" && i.yol === "/v1/projects")!;
  assert.deepEqual(JSON.parse(ac.govde), { name: "probata-a-0f2c9a1e", organization_slug: "probata-deneme", db_pass: "uydurma-sahip-parolasi-0123456789",
    region_selection: { type: "specific", code: "eu-central-1" }, desired_instance_size: "micro" });
  assert.deepEqual((await y.projeler()).map((x) => x.ad), ["probata-a-0f2c9a1e"]);
  await assert.rejects(y.saglik(p.id, []), /servis/);
  await assert.rejects(y.saglik(p.id, ["db;drop"]), /servis/);
  const hazirMi = async () => (await y.saglik(p.id, ["db", "pooler", "storage"])).every((x) => x.durum === "ACTIVE_HEALTHY");
  assert.equal(await hazirMi(), false, "ilk yoklama COMING_UP");
  assert.equal(await hazirMi(), true);
  await y.sslZorla(p.id);
  assert.deepEqual(JSON.parse(s.istekler.at(-1)!.govde), { requestedConfig: { database: true } });
  assert.deepEqual(await y.havuzcu(p.id), [{ sunucu: "127.0.0.1", kapi: 6543, vt: "postgres", kip: "transaction" }]);
  const a1 = await y.gizliAnahtar(p.id, "probata_depo");
  const a2 = await y.gizliAnahtar(p.id, "probata_depo");
  assert.equal(a1, a2, "ikinci çağrı var olanı bulur");
  assert.match(a1, /^sb_secret_/);
  const anahtarAcma = s.istekler.filter((i) => i.yontem === "POST" && i.yol === `/v1/projects/${p.id}/api-keys`);
  assert.equal(anahtarAcma.length, 1, "gizli anahtar bir kez açıldı");
  assert.deepEqual(JSON.parse(anahtarAcma[0]!.govde), { type: "secret", name: "probata_depo", secret_jwt_template: { role: "service_role" } });
  await assert.rejects(y.gizliAnahtar(p.id, "Kotu Ad"), /Geçersiz anahtar adı/);
  await y.projeSil(p.id);
  assert.deepEqual(await y.projeler(), []);
  await assert.rejects(y.havuzcu(p.id), (h: unknown) => h instanceof YonetimHatasi && h.durum === 404);
});
