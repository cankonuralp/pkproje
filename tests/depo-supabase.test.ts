/* NEREDEN GELDİ: 568 — reisim 2026-10-15: "fotoğraflar neden veritabanından kota yiyor, storage'da olması gerekmiyor mu", "fotoğraflar neden hâlâ
   gizli link ile açılmıyor". Dosya içeriği Supabase Storage'a (PROBATA_DEPO=supabase; src/server/dosya/supabase.ts), veritabanı deposu (347) geçişte
   yedek; eski nesneleri gece işi taşır (göç 0094 depo_nesne_tasindi). Kilit (yerel Storage taklidi — tests/yardimci/sahte-depo.ts; GERÇEK
   PostgreSQL, iki firma):
   · ayar ortamdan, eksik / biçimsizse hata; bilinmeyen PROBATA_DEPO hata (sessiz düşüş yok);
   · kova yoksa bir kez ÖZEL kurulur; içerik türüyle, önbelleğe yazılmaz başlığıyla yüklenir; gizli anahtar her istekte; yazılan değişmez (ikinci
     yazma içeriği değiştirmez); anahtar biçimi denetlenir;
   · Storage'da olmayan nesne yedekten okunur; yedek yoksa hata; imzalı adres kısa ömürlü, indirme adı kodlu; olmayan nesnede null;
   · çöp silme Storage'dan ve yedekten;
   · TAŞIMA: firmanın en eski nesneleri, sınırla; geri okunan içeriğin özeti tutmazsa satır KALIR; başka firmanın satırına dokunmaz; işlev firma
     işleminde koşar; gece işi yalnız taşıyan depoda;
   · dosya ucu yalnız sayfa açılışında imzalı adrese yönlenir (fetch / çerçeve akar).
   Olumsuz kanıt: tests/bozan/depo-supabase.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { dosyaAnahtari } from "../src/server/dosya/anahtar.ts";
import { depoSec, klasorDepo, vtDepo, type Depo } from "../src/server/dosya/depo.ts";
import { dosyaSayfasi, dosyaYukle, gosterilir, IMZA_SURESI, sayfaAcilisi } from "../src/server/dosya/dosya.ts";
import { supabaseDepo, supabaseOrtami, type SupabaseDepo } from "../src/server/dosya/supabase.ts";
import { depoTasimaIsi } from "../src/server/is/gece.ts";
import { sahteDepoKur, type SahteDepo } from "./yardimci/sahte-depo.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, s: SahteDepo, A = "", B = "";
const bayt = (x: string) => new TextEncoder().encode(x);
const metin = (b: Uint8Array) => new TextDecoder().decode(b);
const PDF = bayt("%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF");
const anahtar = (firmaId: string, modul = "deneme") => dosyaAnahtari({ firmaId, modul, kayitId: randomUUID(), dosyaId: randomUUID() });
const yeniDepo = (yedek: Depo | null = vtDepo(() => havuz)): SupabaseDepo => supabaseDepo({ url: s.url, gizli: s.gizli, kova: "probata" }, yedek);

before(async () => {
  s = await sahteDepoKur();
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  [A, B] = (await sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('depo-a', 'Depo A', 'DA'), ('depo-b', 'Depo B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
});
after(async () => { await sahip?.end(); await havuz?.end(); await kume?.durdur(); await s?.kapat(); });

test("ayar ortamdan: eksik / biçimsiz adres, anahtar, kova hata; bilinmeyen depo türü hata", () => {
  assert.deepEqual(supabaseOrtami({ PROBATA_SUPABASE_URL: "https://abcdefgh.supabase.co/", PROBATA_SUPABASE_GIZLI: "x".repeat(40) }),
    { url: "https://abcdefgh.supabase.co", gizli: "x".repeat(40), kova: "probata" });
  for (const e of [
    { PROBATA_SUPABASE_URL: "https://kotu.example.com", PROBATA_SUPABASE_GIZLI: "x".repeat(40) },
    { PROBATA_SUPABASE_URL: "http://abcdefgh.supabase.co", PROBATA_SUPABASE_GIZLI: "x".repeat(40) },
    { PROBATA_SUPABASE_URL: "https://abcdefgh.supabase.co" },
    { PROBATA_SUPABASE_URL: "https://abcdefgh.supabase.co", PROBATA_SUPABASE_GIZLI: "x".repeat(40), PROBATA_SUPABASE_KOVA: "Kötü_Kova" },
  ]) assert.throws(() => supabaseOrtami(e), /PROBATA_SUPABASE/);
  assert.throws(() => depoSec({ PROBATA_DEPO: "s3" }), /PROBATA_DEPO/);
  assert.throws(() => depoSec({ PROBATA_DEPO: "supabase" }), /PROBATA_SUPABASE_URL/, "supabase seçilip ayar yoksa sessizce veritabanına düşmez");
  assert.equal(typeof depoSec({ PROBATA_DEPO: "", PROBATA_DEPO_KLASOR: "data/deneme-depo" }).imzaliAdres, "undefined", "klasör deposu imzalı adres vermez");
});

test("yaz / oku: kova bir kez ÖZEL kurulur; tür ve önbelleksiz başlıkla yüklenir; gizli anahtar her istekte; yazılan değişmez; anahtar denetlenir", async () => {
  const d = yeniDepo(null), k = anahtar(A);
  await d.yaz(k, bayt("içerik-1"), undefined, "image/png");
  assert.deepEqual([...s.kovalar], ["probata"]);
  assert.deepEqual(s.nesneler.get(`probata/${k}`) && { ...s.nesneler.get(`probata/${k}`)!, bayt: metin(s.nesneler.get(`probata/${k}`)!.bayt) },
    { bayt: "içerik-1", tur: "image/png", onbellek: "private, no-store" });
  await d.yaz(k, bayt("içerik-2"), undefined, "image/png");
  assert.equal(metin(await d.oku(k)), "içerik-1", "ikinci yazma içeriği değiştirmez");
  assert.equal(s.istekler.filter((x) => x === "POST /bucket").length, 1, "kova bir kez kurulur");
  for (const kotu of ["../x", `firma/${A}/../../etc/passwd`, "firma/x/y/z/w"]) {
    await assert.rejects(d.yaz(kotu, bayt("x")), /Geçersiz depo anahtarı/);
    await assert.rejects(d.oku(kotu), /Geçersiz depo anahtarı/);
  }
  await assert.rejects(d.oku(anahtar(A)), /Depoda böyle bir nesne yok/, "yedeksiz depoda olmayan nesne hata");
  /* yanlış anahtar: Storage reddeder, içerik dönmez, hata iletisinde anahtar yok */
  const yanlis = supabaseDepo({ url: s.url, gizli: "yanlis-anahtar-0123456789", kova: "probata" }, null);
  await assert.rejects(yanlis.oku(k), (e: Error) => /Depoya erişilemedi \(okuma: 403\)/.test(e.message) && !e.message.includes("yanlis-anahtar"));
});

test("geçiş: Storage'da olmayan nesne yedekten (veritabanı deposu) okunur; dosya yüklemesi Storage'a türüyle yazar, veritabanına içerik yazmaz", async () => {
  const vt = vtDepo(() => havuz), k = anahtar(A);
  await vt.yaz(k, bayt("eski-veritabanı"));
  const d = yeniDepo(vt);
  assert.equal(metin(await d.oku(k)), "eski-veritabanı");
  assert.equal(await d.imzaliAdres(k, 300, null), null, "Storage'da yoksa imzalı adres yok (uç içeriği kendisi akıtır)");
  const y = await kiraciIcinde(havuz, A, (db) => dosyaYukle(db, d, { firmaId: A, modul: "deneme", kayitId: randomUUID(), ad: "belge.pdf", bayt: PDF, izinli: ["pdf"], kim: "Deneme" }));
  assert.equal(y.tamam, true);
  const an = (await sahip.query<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id = $1", [y.tamam ? y.id : ""])).rows[0].anahtar;
  assert.equal(s.nesneler.get(`probata/${an}`)!.tur, "application/pdf");
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM depo_nesne WHERE anahtar = $1", [an])).rows[0].n, 0, "içerik veritabanına yazılmaz");
});

test("imzalı adres: kısa ömürlü, Storage kökünden; indirme adı kodlu; çöp silme Storage'dan ve yedekten", async () => {
  const d = yeniDepo(), k = anahtar(A);
  await d.yaz(k, PDF, undefined, "application/pdf");
  assert.equal(await d.imzaliAdres(k, 300, null), `${s.url}/storage/v1/object/sign/probata/${k}?token=sahte-jeton`);
  assert.equal(await d.imzaliAdres(k, 300, "Rapor ÇŞ 1.pdf"), `${s.url}/storage/v1/object/sign/probata/${k}?token=sahte-jeton&download=Rapor%20%C3%87%C5%9E%201.pdf`);
  /* çöp: hem Storage'daki hem yedekteki (dosya satırı olmayan) nesne silinir */
  const k2 = anahtar(A);
  await vtDepo(() => havuz).yaz(k2, bayt("yedekte"));
  await d.yaz(k2, bayt("storage'da"), undefined, "text/plain");
  await kiraciIcinde(havuz, A, (db) => d.copSil(k2, db));
  assert.equal(s.nesneler.has(`probata/${k2}`), false);
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM depo_nesne WHERE anahtar = $1", [k2])).rows[0].n, 0);
  await kiraciIcinde(havuz, A, (db) => d.copSil(k2, db));   // ikinci kez: sessiz
});

test("TAŞIMA: en eski nesneler sınırla Storage'a; geri okunan özet tutmazsa satır kalır; başka firmaya dokunmaz; işlev firma işleminde", async () => {
  await sahip.query("DELETE FROM depo_nesne");
  const vt = vtDepo(() => havuz), d = yeniDepo(vt);
  const a = [anahtar(A), anahtar(A), anahtar(A)], b = anahtar(B);
  for (const [i, k] of a.entries()) await vt.yaz(k, bayt(`A-${i}`));
  await vt.yaz(b, bayt("B-0"));
  await sahip.query("UPDATE depo_nesne SET olustu = now() - (interval '1 minute' * $2::int) WHERE anahtar = $1", [a[0], 3]);
  const r1 = await kiraciIcinde(havuz, A, (db) => d.tasi(db, { adet: 2, bayt: 1_000_000 }));
  assert.deepEqual(r1, { tasinan: 2, bayt: 6, hatali: 0, kalan: true });
  assert.equal(metin(s.nesneler.get(`probata/${a[0]}`)!.bayt), "A-0", "en eski önce");
  /* bozuk yükleme: özet tutmaz → satır kalır, içerik kaybolmaz */
  const kalan = (await sahip.query<{ anahtar: string }>("SELECT anahtar FROM depo_nesne WHERE firma_id = $1", [A])).rows.map((x) => x.anahtar);
  assert.equal(kalan.length, 1);
  s.bozukYukle = true;
  const r2 = await kiraciIcinde(havuz, A, (db) => d.tasi(db, { adet: 10, bayt: 1_000_000 }));
  assert.deepEqual(r2, { tasinan: 0, bayt: 0, hatali: 1, kalan: false });
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM depo_nesne WHERE anahtar = $1", [kalan[0]])).rows[0].n, 1, "satır kaldı");
  assert.equal(s.nesneler.has(`probata/${kalan[0]}`), false, "bozuk kopya Storage'dan kaldırıldı (okuma yedeğe düşer, sonraki gece yeniden yüklenir)");
  assert.equal(metin(await d.oku(kalan[0])), metin(await vt.oku(kalan[0])), "okunan içerik özgün içerik");
  /* B'ye dokunulmadı; B'nin işleminde A'nın anahtarı silinemez; işlev firma işlemi dışında koşmaz */
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM depo_nesne WHERE anahtar = $1", [b])).rows[0].n, 1);
  const ozet = createHash("sha256").update(bayt("A-0")).digest("hex");
  await vt.yaz(a[0].replace(/[0-9a-f]{8}$/, "00000000"), bayt("A-0"));
  const kA = a[0].replace(/[0-9a-f]{8}$/, "00000000");
  assert.equal((await kiraciIcinde(havuz, B, (db) => db.sorgu<{ t: boolean }>("SELECT depo_nesne_tasindi($1, $2) AS t", [kA, ozet]))).rows[0].t, false, "başka firma");
  assert.equal((await kiraciIcinde(havuz, A, (db) => db.sorgu<{ t: boolean }>("SELECT depo_nesne_tasindi($1, $2) AS t", [kA, "0".repeat(64)]))).rows[0].t, false, "özet tutmaz");
  assert.equal((await kiraciIcinde(havuz, A, (db) => db.sorgu<{ t: boolean }>("SELECT depo_nesne_tasindi($1, 'kotu') AS t", [kA]))).rows[0].t, false, "biçimsiz özet");
  await assert.rejects(havuz.query("SELECT depo_nesne_tasindi($1, $2)", [kA, ozet]), /firma işleminde/);
  assert.equal((await kiraciIcinde(havuz, A, (db) => db.sorgu<{ t: boolean }>("SELECT depo_nesne_tasindi($1, $2) AS t", [kA, ozet]))).rows[0].t, true);
  const p = (await sahip.query<{ p: boolean }>("SELECT has_function_privilege('public', 'depo_nesne_tasindi(text, text)', 'EXECUTE') AS p")).rows[0];
  assert.equal(p.p, false);
});

test("gece işi: yalnız taşıyan depoda koşar; firma firma, sayılarla", async () => {
  assert.equal(await depoTasimaIsi(havuz, klasorDepo("data/deneme-depo"), 10_000), null);
  assert.equal(await depoTasimaIsi(havuz, vtDepo(() => havuz), 10_000), null);
  await sahip.query("DELETE FROM depo_nesne");
  await vtDepo(() => havuz).yaz(anahtar(A), bayt("gece-A"));
  await vtDepo(() => havuz).yaz(anahtar(B), bayt("gece-B"));
  const o = (await depoTasimaIsi(havuz, yeniDepo(), 10_000))!;
  assert.equal(o.durum, "tamam");
  assert.equal(o.tasinan, 2);
  assert.equal((await sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM depo_nesne")).rows[0].n, 0);
});

test("dosya ucu yalnız sayfa açılışında imzalı adrese yönlenir; görsel / çerçeve / fetch akar", () => {
  assert.equal(sayfaAcilisi(new Headers({ "sec-fetch-dest": "document" })), true);
  for (const h of ["image", "iframe", "empty", "embed", ""]) assert.equal(sayfaAcilisi(new Headers(h ? { "sec-fetch-dest": h } : {})), false, h);
});

/* 575 (reisim 2026-10-15: "dediklerini yap" — süre 15 dk; süresi dolan bağlantı İngilizce hata yerine bizim sayfamıza): görsel / PDF açılışında adres
   bizim kalır, dosya sayfanın içinde imzalı adresten çizilir; yenileyince yeni adres. */
test("575 dosya sayfası: adres bizim, içerik yalnız Storage kökünden, betik yok, ad kaçışlı; süre 15 dakika; yalnız görsel ve PDF içeride", () => {
  assert.equal(IMZA_SURESI, 900);
  assert.deepEqual(["image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].map(gosterilir), [true, true, true, false]);
  const adres = "https://abcdefgh.supabase.co/storage/v1/object/sign/probata/firma/x?token=a&download=";
  const p = dosyaSayfasi({ ad: 'Rapor "1" <script>alert(1)</script>.pdf', tur: "application/pdf" }, adres);
  assert.match(p.govde, /<iframe src="https:\/\/abcdefgh\.supabase\.co\/storage\/v1\/object\/sign\/probata\/firma\/x\?token=a&amp;download=" title="Rapor &quot;1&quot; &lt;script&gt;/);
  assert.doesNotMatch(p.govde, /<script/i, "betik yok (ad kaçışlı)");
  assert.equal(p.basliklar["Content-Security-Policy"],
    "default-src 'none'; img-src https://abcdefgh.supabase.co; frame-src https://abcdefgh.supabase.co; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
  assert.deepEqual([p.basliklar["Cache-Control"], p.basliklar["Referrer-Policy"], p.basliklar["Content-Type"]], ["private, no-store", "no-referrer", "text/html; charset=utf-8"]);
  const r = dosyaSayfasi({ ad: "foto.jpg", tur: "image/jpeg" }, "https://abcdefgh.supabase.co/storage/v1/object/sign/probata/y?token=b");
  assert.match(r.govde, /<img src="https:\/\/abcdefgh\.supabase\.co\/storage\/v1\/object\/sign\/probata\/y\?token=b" alt="foto\.jpg">/);
  assert.doesNotMatch(r.govde, /<iframe/);
});
