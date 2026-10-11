/* OLUMSUZ KANIT — her kilit gerçekten yakalıyor mu (EKSIKLER 9; anayasa 13.11: kaynak diskte DEĞİŞTİRİLMEZ, gerçek
   dosya bellekte okunur, bozulur, kilidin denetim işlevine verilir; işlev bulgu vermeli). `npm run test:negatif`.
   Her satır bir kilide karşılık gelir; kilit eklenince buraya da bozan satırı eklenir. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KALIP } from "../../src/styles/kalip.ts";
import { MODUL_GRUPLARI } from "../../src/modules/moduller.ts";
import {
  bantDisiDaraltma, ciftIdler, ciftSeciciler, ciftTanimliDegiskenler, daralmisSerit, degiskenDegeri, dosyalar, eksikIkonlar, girdiYaziHatalari, kalipDisiEsikler,
  hamYazma, kiraciDisiErisim, kullanilanIkonlar, maketIkonlari, maketMenusu, oku, parantezHatasi, rlsEksikTablolar, tanimsizDegiskenler, testKapisiEksikleri, tokenGovdesi, pdfPaketEksikleri,
  swEksikleri, baglantiRengiEksikleri, cekmeceBoyuHatasi, vhYukseklikHatalari, cerceveIzniEksikleri, suzgecsizListeler, SUZGECSIZ_BOLUMLER, takipSeridiEksikleri,
  yuzenEzmeleri, yonlendirmeYarislari,
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

test("ham yazma: modülde UPDATE / INSERT / DELETE yakalanır, çekirdekte serbest", () => {
  assert.deepEqual(hamYazma([{ ad: "src/modules/personel/server/kaydet.ts", metin: "db.sorgu(`UPDATE hesap SET roller = $1`)" }]), ["src/modules/personel/server/kaydet.ts"]);
  assert.deepEqual(hamYazma([{ ad: "src/app/x/page.tsx", metin: "insert into denetim_izi (kim) values (1)" }]), ["src/app/x/page.tsx"]);
  assert.deepEqual(hamYazma([{ ad: "src/modules/x.ts", metin: "DELETE FROM oturum" }]), ["src/modules/x.ts"]);
  assert.deepEqual(hamYazma([{ ad: "src/server/db/yazici.ts", metin: "UPDATE hesap SET ad = $1" }]), []);
});

test("RLS: göçte FORCE ya da politika eksik tablo yakalanır", () => {
  const sql = dosyalar("src/server/db/gocler", [".sql"]).map(oku);
  assert.deepEqual(rlsEksikTablolar(sql), []);
  assert.equal(rlsEksikTablolar(sql.map((s) => s.replace("ALTER TABLE denetim_izi FORCE ROW LEVEL SECURITY;", ""))).length, 1);
  /* 2026-10-04 (309): sahte tablonun adı "plan" idi; göç 0023 gerçek plan tablosunu RLS'li kurunca aynı ad yakalanmaz oldu → hiç olmayan ad */
  const yeniTablo = "CREATE TABLE IF NOT EXISTS sahte_kiraci_tablosu (\n  id uuid PRIMARY KEY,\n  firma_id uuid NOT NULL\n);";
  assert.equal(rlsEksikTablolar([...sql, yeniTablo]).length, 1);
});

test("test kapısı: derleme betiği testsiz kalınca, yayın denetimden kopunca ya da bir genişlik uçtan ucadan düşünce yakalanır", () => {
  const paket = oku("package.json");
  const ci = oku(".github/workflows/ci.yml");
  assert.deepEqual(testKapisiEksikleri(paket, ci), []);
  assert.equal(testKapisiEksikleri(paket.replace('"npm test && node scripts/next.ts build"', '"node scripts/next.ts build"'), ci).length, 1);
  /* 2026-10-06: yayın işinin denetim şartı aynı commit'in yeşil ci koşusu — "success" yerine her biten koşu sayılırsa yakalanır */
  assert.equal(testKapisiEksikleri(paket, ci.replace("status=success", "status=completed")).length, 1);
  /* 2026-10-08: uçtan uca genişlikleri ayrı işlerde — telefon matristen düşerse yakalanır */
  assert.deepEqual(testKapisiEksikleri(paket, ci.replace("proje: [masaustu, tablet, telefon]", "proje: [masaustu, tablet]")), ["CI'da uçtan uca telefon yok"]);
  /* 468: site taraması parçalardan çıkarılıp kendi işi kalkınca yakalanır */
  assert.deepEqual(testKapisiEksikleri(paket, ci.replace("parca: [1, 2, 3, tarama]", "parca: [1, 2, 3]")), ["CI'da site taraması parçalardan çıkarılmış ama kendi işi yok"]);
});

test("pdf paketi: Chromium eklenen bir sayfadan maxDuration kalkınca yakalanır (Chromium bütün sayfalara düşerdi)", () => {
  const sayfalar = dosyalar("src/app", [".ts", ".tsx"]).filter((d) => /\/(page|route)\.tsx?$/.test(d)).map((ad) => ({ ad, metin: oku(ad) }));
  const cfg = oku("next.config.ts");
  assert.deepEqual(pdfPaketEksikleri(cfg, sayfalar), []);
  const bozuk = sayfalar.map((d) => (d.ad === "src/app/(uygulama)/araclar/page.tsx" ? { ...d, metin: d.metin.replace("export const maxDuration = 60;", "") } : d));
  assert.deepEqual(pdfPaketEksikleri(cfg, bozuk), ["/araclar: maxDuration = 60 yok"]);
});

/* 395: çevrimdışı servis çalışanı — depo sürümü ayrışınca, API yolu saklanınca, GET / köken denetimi kalkınca, CSP izni kalkınca yakalanır */
test("servis çalışanı: depo şeması ayrışınca, API saklanınca, GET denetimi ya da CSP izni kalkınca yakalanır", () => {
  const sw = oku("public/sw.js"), depo = oku("src/components/cevrimdisi/depo.ts"), proxy = oku("src/proxy.ts");
  assert.deepEqual(swEksikleri(sw, depo, proxy), []);
  assert.deepEqual(swEksikleri(sw.replace("const SURUM = 2;", "const SURUM = 3;"), depo, proxy), ["depo şeması farklı: SURUM (sw 3 · depo 2)"]);
  assert.ok(swEksikleri(sw.replace("const SAYFA_YOLLARI = [", "const SAYFA_YOLLARI = [/^\\/api\\//, "), depo, proxy).includes("saklanmaması gereken yol saklanıyor: /api/islem"));
  assert.deepEqual(swEksikleri(sw.replace('if (r.method !== "GET") return;', ""), depo, proxy), ["yalnız GET denetimi yok"]);
  assert.deepEqual(swEksikleri(sw, depo, proxy.replace(`"worker-src 'self'",`, "")), ["CSP worker-src 'self' yok"]);
  /* saklama yanıtı bekletirse (sayfa bitmeden tarayıcıya hiçbir şey gitmez) yakalanır */
  assert.deepEqual(swEksikleri(sw.replace("e.waitUntil(sayfaSakla(yol, y.clone()).catch(() => undefined));", "await sayfaSakla(yol, y.clone()).catch(() => undefined);"), depo, proxy),
    ["saklama yanıtı bekletiyor (waitUntil değil)"]);
  /* sayfanın uygulama dosyaları saklanmazsa (önceden indirilen sayfa bağlantısız görünür ama çalışmaz) yakalanır */
  assert.deepEqual(swEksikleri(sw.replace("  await dosyalariSakla(new TextDecoder().decode(govde)).catch(() => undefined);\n", ""), depo, proxy),
    ["saklanan sayfanın uygulama dosyaları önce saklanmıyor"]);
  /* dosya önbelleği tam adresle (sorgu dizgisiyle) aranırsa yakalanır */
  assert.deepEqual(swEksikleri(sw.replace("caches.match(anahtarAdresi(r.url))", "caches.match(r)"), depo, proxy), ["dosya önbelleği sorgu dizgisine bağlı"]);
  /* 401: sayfa sayısı sınırı kalkarsa yakalanır */
  assert.deepEqual(swEksikleri(sw.replace("  await sayfalariKirp(db);\n", ""), depo, proxy), ["saklanan sayfa sayısı sınırsız"]);
});

/* 412: bağlantı rengi — Planlar'ın proje no'su renksiz sınıfa (.kod) dönünce ve temel.css bağlantı tabanı silinince yakalanır */
test("bağlantı rengi: renksiz sınıflı bağlantı ve silinen bağlantı tabanı yakalanır", () => {
  const tsx = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  const temel = oku("src/styles/temel.css");
  assert.deepEqual(baglantiRengiEksikleri(tsx, oku, temel), []);
  const liste = "src/modules/planlar/ui/PlanListesi.tsx";
  const bozuk = tsx.map((d) => (d.ad === liste ? { ...d, metin: d.metin.replace("<Link className={stil.no}", "<Link className={stil.kod}") } : d));
  assert.deepEqual(baglantiRengiEksikleri(bozuk, oku, temel), [`${liste}: .kod bağlantısında renk yok (src/modules/planlar/ui/planlar.module.css)`]);
  assert.deepEqual(baglantiRengiEksikleri(tsx, oku, temel.replace("color: var(--onay-yazi); text-underline-offset", "text-underline-offset")),
    ["temel.css: :where(a) bağlantı tabanında renk yok"]);
});

/* 419: çekmece boyu — yan menü yüksekliği yalnız 100vh'ye dönünce yakalanır (telefonda son modül ekran dışında kalıyordu) */
test("çekmece boyu: yan menü yüksekliği 100vh'ye dönünce yakalanır", () => {
  assert.equal(cekmeceBoyuHatasi(kabuk), null);
  assert.equal(cekmeceBoyuHatasi(kabuk.replace("height: 100vh; height: 100dvh;", "height: 100vh;")), ".cubuk yüksekliği 100vh — görünen boy (100dvh) olmalı");
});

/* 421: vh yükseklik — levhanın en büyük yüksekliğinden dvh kalkınca yakalanır */
test("vh yükseklik: telefondaki levhanın dvh'si kalkınca yakalanır", () => {
  const ad = "src/components/pencere/Pencere.module.css", metin = oku(ad);
  assert.deepEqual(vhYukseklikHatalari([{ ad, metin }]), []);
  const bozuk = vhYukseklikHatalari([{ ad, metin: metin.replace("max-height: 88vh; max-height: 88dvh;", "max-height: 88vh;") }]);
  assert.equal(bozuk.length, 1);
  assert.match(bozuk[0], /Pencere\.module\.css: \.pencere max-height: 88vh$/);
});

/* 472: çerçeve izni — her sayfaya gömme izni verilince, yol genişleyince, X-Frame-Options koşulsuzlaşınca, sayfanın kapısı kalkınca yakalanır */
test("çerçeve izni: koşulsuz 'self', geniş yol, koşulsuz SAMEORIGIN ya da kapısız sayfa yakalanır", () => {
  const proxy = oku("src/proxy.ts"), sayfa = oku("src/app/(cerceve)/ekipman-turleri/[id]/sablon/[sid]/saha/page.tsx");
  assert.deepEqual(cerceveIzniEksikleri(proxy, sayfa), []);
  assert.deepEqual(cerceveIzniEksikleri(proxy.replace("`frame-ancestors ${cerceve ? \"'self'\" : \"'none'\"}`,", "\"frame-ancestors 'self'\","), sayfa), ["frame-ancestors koşulsuz"]);
  assert.ok(cerceveIzniEksikleri(proxy.replace(String.raw`/^\/ekipman-turleri\/[^/]+\/sablon\/[^/]+\/saha$/`, String.raw`/^\/ekipman-turleri\//`), sayfa)
    .includes("gömme izni fazla geniş: /ekipman-turleri/a/sablon/b/kurucu"));
  assert.ok(cerceveIzniEksikleri(proxy.replace(String.raw`\/saha$/`, String.raw`\/saha/`), sayfa).includes("gömme izni fazla geniş: /ekipman-turleri/a/sablon/b/saha/c"));
  assert.deepEqual(cerceveIzniEksikleri(proxy.replace(`cerceve ? "SAMEORIGIN" : "DENY"`, `"SAMEORIGIN"`), sayfa), ["X-Frame-Options koşulsuz"]);
  assert.deepEqual(cerceveIzniEksikleri(proxy, sayfa.replace("if (!o) return <Yetkisiz />;", "")), ["çerçeve sayfasında modül kapısı yok"]);
});

/* 480: yan menü sayısının sebebi — sayfa başlığından şerit kalkınca, kabuk bağlamı kalkınca, bir balon sayıyla (sebepsiz) kurulunca yakalanır */
test("sebep şeridi: SayfaBasi şeridi çizmeyince, kabuk bağlamı vermeyince, sebepsiz balon kurulunca yakalanır", () => {
  const sayfa = oku("src/components/sayfa/Sayfa.tsx"), kabuk = oku("src/components/kabuk/Kabuk.tsx"), takip = oku("src/modules/anasayfa/server/takip.ts");
  assert.deepEqual(takipSeridiEksikleri(sayfa, kabuk, takip), []);
  assert.deepEqual(takipSeridiEksikleri(sayfa.replace("<TakipSeridi />", ""), kabuk, takip), ["SayfaBasi şeridi çizmiyor"]);
  assert.deepEqual(takipSeridiEksikleri(sayfa, kabuk.replace("<TakipBaglami.Provider value={balon}>{children}</TakipBaglami.Provider>", "{children}"), takip),
    ["kabuk sayıları bağlamla vermiyor"]);
  assert.deepEqual(takipSeridiEksikleri(sayfa, kabuk, `${takip}\nkoy(99, 1, 0, { kirmizi: "x", sari: "" });\n`), ["sebepsiz balon: 1"]);
});

/* 481: süzgeçsiz liste — sayfanın ana listesi süzgeçsiz <Liste>'ye dönünce ve izinli bölümün sayısı artınca yakalanır */
test("süzgeç kapsamı: ana liste süzgeçsize dönünce, izinli bölüm artınca yakalanır", () => {
  const tsx = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(suzgecsizListeler(tsx, SUZGECSIZ_BOLUMLER), []);
  const izin = "src/modules/talepler/ui/IzinTalepleri.tsx", ana = "src/modules/anasayfa/ui/AnaSayfa.tsx";
  const bozuk = tsx.map((d) => (d.ad === izin ? { ...d, metin: d.metin.replace("<SuzgecliListe s={s} on=\"izn\"", "<Liste") } : d));
  assert.deepEqual(suzgecsizListeler(bozuk, SUZGECSIZ_BOLUMLER), ["modules/talepler/ui/IzinTalepleri.tsx: sayfa başlıklı bileşende süzgeçsiz <Liste> (1)"]);
  const fazla = tsx.map((d) => (d.ad === ana ? { ...d, metin: `${d.metin}\n<Liste />` } : d));
  assert.deepEqual(suzgecsizListeler(fazla, SUZGECSIZ_BOLUMLER), ["modules/anasayfa/ui/AnaSayfa.tsx: süzgeçsiz liste sayısı arttı (3 → 4)"]);
});

/* 486: yüzen katman ezmesi — tablodaki eski "akışta açıl" kuralı geri gelince, kendi dosyasında konum fixed'ten başka olunca yakalanır */
test("yüzen katman: başka CSS listeye inince ve kendi konumu fixed olmayınca yakalanır", () => {
  const css = dosyalar("src", [".css"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(yuzenEzmeleri(css), []);
  const tablo = "src/modules/raporlar/ui/raporlar.module.css", kendi = "src/components/secim/Secim.module.css";
  const ezme = '.olcumTablo [data-secim-kap] [role="listbox"] { position: static; }';
  const geri = css.map((d) => (d.ad === tablo ? { ...d, metin: `${d.metin} ${ezme}` } : d));
  assert.deepEqual(yuzenEzmeleri(geri), [`${tablo}: .olcumTablo [data-secim-kap] [role="listbox"]`]);
  const akista = css.map((d) => (d.ad === kendi ? { ...d, metin: d.metin.replace(".liste, .takvim { position: fixed;", ".liste, .takvim { position: absolute;") } : d));
  assert.equal(yuzenEzmeleri(akista).length, 1);
});

/* 486: yönlendirme + tazeleme yarışı — Dökümanlar'ın yükleme penceresine eski desen ("push; refresh") geri gelince yakalanır; "else" ile serbest */
test("yönlendirme yarışı: router.push ardından router.refresh geri gelince yakalanır", () => {
  const tsx = dosyalar("src", [".tsx", ".ts"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(yonlendirmeYarislari(tsx), []);
  const ad = "src/modules/dokumanlar/ui/Pencereler.tsx";
  const eski = "if (!oneri) router.push(`/dokumanlar/standart/${r.id}`);";
  const bozuk = tsx.map((d) => (d.ad === ad ? { ...d, metin: d.metin.replace(eski, `${eski}\n    router.refresh();`) } : d));
  assert.equal(yonlendirmeYarislari(bozuk).length, 1);
  assert.match(yonlendirmeYarislari(bozuk)[0], /^src\/modules\/dokumanlar\/ui\/Pencereler\.tsx: \d+$/);
  assert.deepEqual(yonlendirmeYarislari([{ ad: "x.tsx", metin: "if (a) router.push(b); else router.refresh();" }]), []);
  assert.equal(yonlendirmeYarislari([{ ad: "x.tsx", metin: "router.push(`/a/${f(x)}`); // not\n router.refresh();" }]).length, 1);
});

