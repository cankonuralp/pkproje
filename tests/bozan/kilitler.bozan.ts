/* OLUMSUZ KANIT — her kilit gerçekten yakalıyor mu (EKSIKLER 9; anayasa 13.11: kaynak diskte DEĞİŞTİRİLMEZ, gerçek
   dosya bellekte okunur, bozulur, kilidin denetim işlevine verilir; işlev bulgu vermeli). `npm run test:negatif`.
   Her satır bir kilide karşılık gelir; kilit eklenince buraya da bozan satırı eklenir. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KALIP } from "../../src/styles/kalip.ts";
import { MODUL_GRUPLARI } from "../../src/modules/moduller.ts";
import {
  bantDisiDaraltma, ciftIdler, ciftSeciciler, ciftTanimliDegiskenler, daralmisSerit, degiskenDegeri, dosyalar, eksikIkonlar, girdiYaziHatalari, kalipDisiEsikler,
  kiraciDisiErisim, kullanilanIkonlar, maketIkonlari, maketMenusu, oku, parantezHatasi, rlsEksikTablolar, tanimsizDegiskenler, testKapisiEksikleri, tokenGovdesi,
} from "../yardimci/denetimler.ts";

const kabuk = oku("src/components/kabuk/Kabuk.module.css");
const tokens = oku("src/styles/tokens.css");

test("parantez: bir kapanış silinince yakalanır", () => {
  assert.equal(parantezHatasi(kabuk), null);
  assert.ok(parantezHatasi(kabuk.replace("}", "")));
});

test("tanımsız değişken: var(--olmayan) eklenince yakalanır", () => {
  const css = dosyalar("src", [".css"]).map(oku);
  assert.deepEqual(tanimsizDegiskenler([...css, ".x { color: var(--olmayan); }"], css), ["--olmayan"]);
});

test("çift seçici: kabuktaki bir kural ikinci kez yazılınca yakalanır", () => {
  assert.deepEqual(ciftSeciciler(kabuk), []);
  assert.deepEqual(ciftSeciciler(kabuk + "\n.logo { width: 140px; }\n"), [".logo"]);
});

test("değişken ezmesi: ikinci :root bloğu var olan değişkeni yeniden tanımlayınca yakalanır", () => {
  assert.deepEqual(ciftTanimliDegiskenler(tokens), []);
  assert.deepEqual(ciftTanimliDegiskenler(`${tokens}\n:root { --tus-y: 40px; }\n`), [":root --tus-y"]);
});

test("maket CSS (2026-09-24): Planlar'ın .a-sayfa-bas kuralı ikinci blokta yazılınca ve tanımsız değişken eklenince yakalanır", () => {
  const maket = oku("docs/assets/maket.css"), tok = oku("docs/assets/tokens.css");
  assert.deepEqual(ciftSeciciler(maket), []);
  assert.deepEqual(ciftSeciciler(maket + "\n.a-sayfa-bas { align-items: center; }\n"), [".a-sayfa-bas"]);
  assert.deepEqual(tanimsizDegiskenler([maket + "\n.a-yuz { color: var(--olmayan); }\n"], [tok, maket]).filter((d) => d !== "--sira"), ["--olmayan"]);
});

test("çift id: aynı sabit id iki dosyada geçince yakalanır", () => {
  const metinler = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.equal(ciftIdler([...metinler, { ad: "bozuk.tsx", metin: '<aside id="ana-menu" />' }]).length, 1);
});

test("tek kaynak: maketteki kopyada tek değer değişince yakalanır", () => {
  const docs = oku("docs/assets/tokens.css");
  assert.equal(tokenGovdesi(docs), tokenGovdesi(tokens));
  assert.notEqual(tokenGovdesi(docs.replace("--tus-y: 34px", "--tus-y: 36px")), tokenGovdesi(tokens));
});

test("kalıp sayısı: denetim yüksekliği 40'a dönünce yakalanır", () => {
  assert.equal(degiskenDegeri(tokens, "--tus-y", null), `${KALIP.tusY.fare}px`);
  assert.notEqual(degiskenDegeri(tokens.replace("--tus-y: 34px", "--tus-y: 40px"), "--tus-y", null), `${KALIP.tusY.fare}px`);
});

test("yazı alanı (2026-09-25): dokunmatikte 15'e dönünce, bağlama kuralı silinince, sonra bir alan küçültülünce yakalanır", () => {
  assert.equal(degiskenDegeri(tokens, "--boy-girdi", "(pointer: coarse)"), `${KALIP.yazi.girdiDokunmatik}px`);
  assert.notEqual(degiskenDegeri(tokens.replaceAll("--boy-girdi: 16px", "--boy-girdi: 15px"), "--boy-girdi", "(pointer: coarse)"), `${KALIP.yazi.girdiDokunmatik}px`);
  const temel = oku("src/styles/temel.css"), maket = oku("docs/assets/maket.css");
  assert.deepEqual(girdiYaziHatalari(temel), []);
  assert.deepEqual(girdiYaziHatalari(temel.replace("input, textarea, select { font-size: var(--boy-girdi); }", "")), ["bağlama kuralı yok"]);
  assert.deepEqual(girdiYaziHatalari(maket + "\n.a-ara input { font-size: var(--boy-kucuk); }\n"), [".a-ara input"]);
  assert.deepEqual(girdiYaziHatalari(maket + "\n.a-form textarea { font: inherit; }\n"), [".a-form textarea"]);
});

test("kalıp bandı: kabuğa kalıp dışı bir eşik (min-width 1200) eklenince yakalanır", () => {
  assert.deepEqual(kalipDisiEsikler(kabuk, KALIP.bant), []);
  assert.deepEqual(kalipDisiEsikler(kabuk + "\n@media (min-width: 1200px) { .logo { width: 120px; } }\n", KALIP.bant), ["min-width: 1200px"]);
});

test("daraltılmış şerit: 64 px 72'ye dönünce yakalanır (uygulama ve maket)", () => {
  const genis = `(min-width: ${KALIP.bant.genis}px)`;
  const maketCss = oku("docs/assets/maket.css");
  assert.equal(daralmisSerit(kabuk, genis), KALIP.kabuk.cubukDar);
  assert.notEqual(daralmisSerit(kabuk.replace("grid-template-columns: 64px", "grid-template-columns: 72px"), genis), KALIP.kabuk.cubukDar);
  assert.notEqual(daralmisSerit(maketCss.replace("grid-template-columns: 64px", "grid-template-columns: 72px"), genis), KALIP.kabuk.cubukDar);
});

test("anayasa 2.11: daraltma kuralı tablet bandına (geniş bant dışına) sızınca yakalanır", () => {
  const genis = `(min-width: ${KALIP.bant.genis}px)`;
  assert.equal(bantDisiDaraltma(kabuk, "data-menu", genis), 0);
  const sizan = kabuk + '\n@media (max-width: 1279.98px) { :global([data-menu="dar"]) .kabuk { grid-template-columns: 64px minmax(0, 1fr); } }\n';
  assert.equal(bantDisiDaraltma(sizan, "data-menu", genis), 1);
  const maketCss = oku("docs/assets/maket.css");
  assert.equal(bantDisiDaraltma(maketCss + "\n.a-kabuk-dar .a-menu-ad { display: none; }\n", ".a-kabuk-dar", genis), 1);
});

test("ikon: dosyada olmayan ikon kullanılınca yakalanır", () => {
  const ikonDosyasi = oku("public/vendor/lucide-1.47.0/ikonlar.svg");
  assert.deepEqual(eksikIkonlar(kullanilanIkonlar(), ikonDosyasi), []);
  assert.deepEqual(eksikIkonlar([...kullanilanIkonlar(), "olmayan-ikon"], ikonDosyasi), ["olmayan-ikon"]);
});

test("maket ikonu (2026-09-24): üçlü koşulda dosyada olmayan ikon kullanılınca yakalanır, karşılaştırılan değer ikon sayılmaz", () => {
  const svg = oku("docs/vendor/lucide-1.47.0/ikonlar.svg");
  const adlar = maketIkonlari(['ikon(d === "tamam" ? "circle-check" : "olmayan-ikon", "a-ikon-kucuk")']);
  assert.deepEqual(adlar, ["circle-check", "olmayan-ikon"]);
  assert.deepEqual(eksikIkonlar(adlar, svg), ["olmayan-ikon"]);
});

test("menü: 'Planlar' kişiye bağlı ada ('Planlarım') dönünce maketle ayrışır", () => {
  const maket = maketMenusu(oku("docs/assets/maket-ortak.js"));   /* 2026-09-24: menü ortak üreticiye taşındı */
  const uygulama = MODUL_GRUPLARI.map((g) => ({ grup: g.grup, ogeler: g.moduller.map((m) => [m.ad, m.ikon, m.no]) }));
  assert.deepEqual(uygulama, maket);
  const bozuk = structuredClone(uygulama);
  bozuk[0]!.ogeler[0]![0] = "Planlarım";
  assert.notDeepEqual(bozuk, maket);
});

test("kiracı süzgeci: sayfa pg içe aktarınca ya da sorgu yazınca yakalanır", () => {
  assert.deepEqual(kiraciDisiErisim([{ ad: "src/app/page.tsx", metin: 'import pg from "pg";' }]), ["src/app/page.tsx"]);
  assert.deepEqual(kiraciDisiErisim([{ ad: "src/modules/x.ts", metin: "await havuz.query('SELECT * FROM denetim_izi')" }]), ["src/modules/x.ts"]);
  assert.deepEqual(kiraciDisiErisim([{ ad: "src/server/db/kiraci.ts", metin: 'import pg from "pg"; x.query("")' }]), []);
});

test("RLS: göçte FORCE ya da politika eksik tablo yakalanır", () => {
  const sql = dosyalar("src/server/db/gocler", [".sql"]).map(oku);
  assert.deepEqual(rlsEksikTablolar(sql), []);
  assert.equal(rlsEksikTablolar(sql.map((s) => s.replace("ALTER TABLE denetim_izi FORCE ROW LEVEL SECURITY;", ""))).length, 1);
  const yeniTablo = "CREATE TABLE IF NOT EXISTS plan (\n  id uuid PRIMARY KEY,\n  firma_id uuid NOT NULL\n);";
  assert.equal(rlsEksikTablolar([...sql, yeniTablo]).length, 1);
});

test("test kapısı: derleme betiği testsiz kalınca ya da yayın denetimden kopunca yakalanır", () => {
  const paket = oku("package.json");
  const ci = oku(".github/workflows/ci.yml");
  assert.deepEqual(testKapisiEksikleri(paket, ci), []);
  assert.equal(testKapisiEksikleri(paket.replace('"npm test && node scripts/next.ts build"', '"node scripts/next.ts build"'), ci).length, 1);
  assert.equal(testKapisiEksikleri(paket, ci.replace("needs: denetim", "needs: []")).length, 1);
});
