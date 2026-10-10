/* NEREDEN GELDİ: reisim 2026-09-23 "diğer modüller nerde onlarda gözüksün" + "sekmelerin adı da öznellik içermesin
   planlar raporlar zimmetler gibi genel isimler olsun" — onaylı maketin (5. tur) menüsü. Uygulamanın menüsü (MODÜL
   KAYDI) makettekiyle birebir: grup, sıra, ad, ikon, §3.1 numarası. Her modülün kendi rota klasörü var, fazlası yok.
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts ("Planlar" → "Planlarım" yakalanır).
   2026-09-24 (toplu maket, MAKET-PLANI §3.2): maketin menüsü bütün maket sayfalarında tek üreticiden gelsin diye
   docs/assets/maket.js'ten docs/assets/maket-ortak.js'e taşındı → okunan dosya değişti, denetim aynı; ayrıca menü sabiti
   maket betiklerinde TEK yerde (ikinci kopya sessizce ayrışırdı).
   2026-09-25 (reisim, M1 cevapları: "159 birleşsin"): Kullanıcılar (1) Personel'e katıldı → 16 modül, menüde olmayanlar 1, 6, 16, 17
   (1'in ekranı Personel'in içinde). Beklenen sayılar bu karar için güncellendi; denetimin kendisi aynı.
   2026-09-26 (reisim, M3: "ekipmanlar ve ekipman türleri diye iki modüle gerek yok ekipman türleri yeterli"): Ekipmanlar (7) ayrı
   modül değil, ekipmanlar planın içinde → 15 modül, menüde olmayanlar 1, 6, 7, 16, 17. Denetim aynı, beklenen sayılar güncellendi.
   2026-09-28 (reisim: "talepler kısmı olsun denetçi izin talebi masraf formu ekleme"): 21 Talepler eklendi → 16 modül; numara aralığı
   1–21. Denetim aynı, beklenen sayılar güncellendi.
   2026-09-28 (reisim: "dökümanlar modülü olsun … eğitimler, muayene kriterleri, standartlar ve diğer dökümanlar bu kısımda"): 4 Standartlar
   → Dökümanlar, 10 Eğitimler Dökümanlar'ın içinde → 15 modül, menüde olmayanlar 1, 6, 7, 10, 16, 17. Denetim aynı.
   2026-09-30 (R1, reisim: "firma ayarları personel kısmının altında değil ayrı bir modül olsun"): 22 Firma ayarları eklendi → 16 modül;
   numara aralığı 1–22. Denetim aynı, beklenen sayılar güncellendi.
   2026-10-02 (AA4, reisim: "bir de araç takip modülü olsun hangi aracın kimde olduğu belli olsun takip edilebilsin"): 23 Araçlar eklendi
   (Varlık grubu) → 17 modül; numara aralığı 1–23. Denetim aynı, beklenen sayılar güncellendi.
   2026-10-03 (K0, reisim: "Makette eksik kalmadıysa koda geç"): ortak bileşenlerin uçtan uca denetimi için TEK modül dışı rota "vitrin"
   (yalnız geliştirmede açılır, yayında 404 — src/app/vitrin/page.tsx). İstisna adıyla yazıldı; başka modül dışı rota hâlâ yakalanır.
   2026-10-04 (K1, reisim: "site güvenliği … sızma"): rotalar gruplara ayrıldı — (uygulama) oturumlu, (acik) giriş, (gelistirme) vitrin. Denetim aynı
   (modül kaydı = uygulama rotaları); ek olarak açık rotalar adıyla sayılır ve uygulama düzeninin oturum istediği denetlenir. */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { MODULLER, MODUL_GRUPLARI } from "../src/modules/moduller.ts";
import { cerceveIzniEksikleri, dosyalar, KOK, maketMenusu, oku } from "./yardimci/denetimler.ts";

test("menü onaylı maketle birebir (grup · sıra · ad · ikon · §3.1 no)", () => {
  const maket = maketMenusu(oku("docs/assets/maket-ortak.js"));
  const uygulama = MODUL_GRUPLARI.map((g) => ({ grup: g.grup, ogeler: g.moduller.map((m) => [m.ad, m.ikon, m.no]) }));
  assert.equal(maket.length, 6);
  assert.deepEqual(uygulama, maket);
});

test("maket menüsü tek kaynakta: menü sabiti yalnız maket-ortak.js'te", () => {
  const assets = join(KOK, "docs", "assets");
  const tasiyan = readdirSync(assets).filter((ad) => ad.endsWith(".js") && readFileSync(join(assets, ad), "utf8").includes("var MENU = ["));
  assert.deepEqual(tasiyan, ["maket-ortak.js"]);
});

test("17 modül, numaralar tekil; menüde olmayanlar 1 (Personel'in içinde), 6, 7 (planın içinde), 10 (Dökümanlar'ın içinde), 16, 17", () => {
  const nolar = MODULLER.map((m) => m.no);
  assert.equal(nolar.length, 17);
  assert.equal(new Set(nolar).size, 17);
  const yok = Array.from({ length: 23 }, (_, i) => i + 1).filter((n) => !nolar.includes(n));
  assert.deepEqual(yok, [1, 6, 7, 10, 16, 17]);
});

/* 2026-10-04 (K1, giriş + oturum): rotalar üç grupta — (uygulama) oturum ister ve modül kaydıyla birebir; (acik) yalnız giriş; (gelistirme) yalnız
   vitrin (yayında 404). Oturumsuz açılan her rota adıyla burada: listeye eklenmeyen yeni bir açık rota testi düşürür (sızma kapısı). */
const ACIK_ROTALAR = ["giris"];
const GELISTIRME_ROTALARI = ["vitrin"];
/* 2026-10-04 (K1, dosya ucu): api/ yalnız tanımlı uçları taşır — her uç oturumu ve yetkiyi kendisi denetler (09-A2).
   2026-10-05 (316): olcum — PDF motorunun Vercel ölçümü, oturumsuz ama YALNIZ önizleme dağıtımında (aşağıdaki test kilitler; yayında 404)
   2026-10-06 (350, 09-G5): saglik — oturumsuz sağlık ucu; yalnız evet / hayır denetimleri ve sürüm (firma / kişi bilgisi yok — e2e/api.spec)
   2026-10-08 (378, K5): is — zamanlayıcı uçları (gece işi); oturumsuz ama YALNIZ CRON_SECRET'le (aşağıdaki test: ilk iş zamanliYetkili)
   2026-10-08 (392, 09-D2): islem — çevrimdışı kuyruğun tek seferlik işlem ucu; ilk iş aynı köken, oturum ister, yalnız POST (aşağıdaki test) */
const API_UCLARI = ["dosya", "is", "islem", "olcum", "saglik", "surum", "tanim"];
const klasorlerOf = (yol: string) => readdirSync(yol).filter((ad) => statSync(join(yol, ad)).isDirectory()).sort();

test("her modülün rota klasörü var ve src/app'te modül dışı rota yok", () => {
  const app = join(KOK, "src", "app");
  /* 2026-10-05 (319, 0030): müşteri paneli kendi rota grubunda — "(musteri)" (yalnız /portal; müşteri oturumu, kapısı aşağıdaki testte) */
  /* 2026-10-06 (348, KOD-GECIS Y1): probata yönetim sayfası kendi rota grubunda — "(yonetim)" (yalnız /yonetim: giriş adımları + oturumlu
     panel; yalnız yönetim adresinde, kapısı aşağıdaki testte) */
  /* 2026-10-10 (472, maket kararları k1–k4): "(cerceve)" — kabuksuz, yalnız kendi sayfamızın çerçevesinde açılan saha ekranı önizlemesi
     (/ekipman-turleri/<tür>/sablon/<sürüm>/saha; oturum ve modül kapısı aşağıdaki testte, gömme izni src/proxy.ts yalnız bu yolda) */
  assert.deepEqual(klasorlerOf(app), ["(acik)", "(cerceve)", "(gelistirme)", "(musteri)", "(uygulama)", "(yonetim)", "api"]);
  assert.deepEqual(klasorlerOf(join(app, "(cerceve)")), ["ekipman-turleri"]);
  assert.deepEqual(klasorlerOf(join(app, "(cerceve)", "ekipman-turleri", "[id]", "sablon", "[sid]")), ["saha"]);
  assert.deepEqual(klasorlerOf(join(app, "(musteri)")), ["portal"]);
  assert.deepEqual(klasorlerOf(join(app, "(yonetim)")), ["yonetim"]);
  /* 355: çıkış düz form isteği (route.ts, yalnız POST) — sunucu eyleminin yönlendirmesi yönetim adresini kaybediyordu */
  assert.deepEqual(klasorlerOf(join(app, "(yonetim)", "yonetim")), ["(panel)", "cikis", "giris"]);
  assert.deepEqual(klasorlerOf(join(app, "api")), API_UCLARI);
  const uygulama = join(app, "(uygulama)");
  const yollar = MODULLER.filter((m) => m.yol !== "").map((m) => m.yol).sort();
  assert.deepEqual(klasorlerOf(uygulama), yollar);
  for (const y of yollar) assert.ok(existsSync(join(uygulama, y, "page.tsx")), `${y}/page.tsx yok`);
  assert.ok(existsSync(join(uygulama, "page.tsx")), "Ana sayfa yok");
  assert.deepEqual(klasorlerOf(join(app, "(acik)")), ACIK_ROTALAR);
  assert.deepEqual(klasorlerOf(join(app, "(gelistirme)")), GELISTIRME_ROTALARI);
});

test("çerçeve sayfası (472): modül kapısı sayfada; gömme izni yalnız o yolda", () => {
  assert.deepEqual(cerceveIzniEksikleri(oku("src/proxy.ts"), oku("src/app/(cerceve)/ekipman-turleri/[id]/sablon/[sid]/saha/page.tsx")), []);
});

test("oturum kapısı: uygulama düzeni oturum ister, modül sayfası modül numarasıyla yetki denetler", () => {
  const duzen = oku("src/app/(uygulama)/layout.tsx");
  assert.match(duzen, /await oturumGerekli\(\)/);
  for (const m of MODULLER.filter((x) => x.yol !== "")) {
    const sayfa = oku(`src/app/(uygulama)/${m.yol}/page.tsx`);
    /* 2026-10-04: ekranı yapılan modül kendi sayfasını çizer; kapısı modulOturumu(<modül no>) — yetkisizse içerik çizilmez */
    assert.match(sayfa, /<ModulSayfasi modul=\{MODUL\}|await modulOturumu\(MODUL\.no\)[\s\S]*if \(!o\) return <Yetkisiz \/>/, m.yol);
  }
  assert.match(oku("src/components/modul/ModulSayfasi.tsx"), /modulGorur\(o, modul\.no/);
  /* modülün alt sayfaları (kart, form …) da aynı kapıdan: her page.tsx modül kapısını çağırır */
  /* 2026-10-06 (333, maket onaylar.html #/diger + muhasebe.html "Maaş bordrosu gönder": bordro BÜTÜN personelin imzasına gider — Onaylar'ı
     görmeyen planlama ve muhasebe de kendi belgesini imzalar): Diğer belgeler modülden bağımsız, oturum kapısından geçer; kayıt süzgeci sunucuda
     (yalnız hesabın kendi personelinin belgeleri — onaylar/server/belgeler.ts). İstisna YALNIZ bu sayfa. */
  const KISISEL = new Set(["src/app/(uygulama)/onaylar/diger/page.tsx"]);
  for (const ad of dosyalar("src/app/(uygulama)", [".tsx"]).filter((d) => d.endsWith("/page.tsx") && d.split("/").length > 5)) {
    if (KISISEL.has(ad)) {
      assert.match(oku(ad), /await oturumGerekli\(\)/, ad);
      assert.match(oku("src/modules/onaylar/server/belgeler.ts"), /const p = await hesabinPersoneli\(db, kim\.id\);[\s\S]*WHERE personel_id = \$1 AND dosya IS NOT NULL/, "Diğer belgeler yalnız kendi personelinin");
      continue;
    }
    assert.match(oku(ad), /await modulOturumu\(MODUL\.no\)[\s\S]*if \(!o\) return <Yetkisiz \/>/, ad);
  }
  /* 2026-10-04: geliştirme sayfaları yayında kapalı — koruma düzende (altına eklenen her sayfa kapsanır) */
  assert.match(oku("src/app/(gelistirme)/layout.tsx"), /if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/);
});

test("adresler ASCII ve tekil", () => {
  const yollar = MODULLER.map((m) => m.yol);
  assert.equal(new Set(yollar).size, yollar.length);
  for (const y of yollar) assert.match(y, /^[a-z0-9-]*$/);
});

/* 2026-10-04 (K2, reisim: "kaynak koddan rol değiştirme sızma"): "use server" dosyasından dışa açılan HER işlev istemciden çağrılabilen bir uçtur.
   Bu dosyalar yalnız adı "…Eylemi" olan eylemleri (ve tür tanımlarını) dışa açar; yardımcı işlev sızdırmaz. */
test("sunucu eylemi dosyaları yalnız '…Eylemi' işlevlerini dışa açar", () => {
  const eylemDosyalari = dosyalar("src", [".ts", ".tsx"]).filter((ad) => /^\s*(\/\*[\s\S]*?\*\/\s*)?["']use server["']/.test(oku(ad)));
  assert.ok(eylemDosyalari.length >= 1);
  for (const ad of eylemDosyalari) {
    const m = oku(ad);
    const disari = [...m.matchAll(/^export\s+(?:async\s+)?(function|const|let|var|class|default)\s*(\w*)/gm)].map((x) => `${x[1]} ${x[2]}`);
    assert.deepEqual(disari.filter((x) => !/^function \w+Eylemi$/.test(x)), [], ad);
    assert.ok(!/^export\s*\{/m.test(m), `${ad}: toplu dışa açma yok`);
  }
});

/* 2026-10-05 (316): ölçüm ucu oturumsuz — yalnız Vercel önizleme dağıtımında açık; denetim her şeyden önce, yayında ve yerelde 404 */
test("api/olcum yalnız önizleme dağıtımında: ilk iş VERCEL_ENV denetimi, değilse 404", () => {
  const kaynak = readFileSync(join(KOK, "src", "app", "api", "olcum", "pdf", "route.ts"), "utf8");
  const govde = kaynak.slice(kaynak.indexOf("export async function GET"));
  assert.match(govde, /^export async function GET\(\) \{\n {2}if \(process\.env\.VERCEL_ENV !== "preview"\) return new Response\("Bulunamadı", \{ status: 404/);
  assert.deepEqual(klasorlerOf(join(KOK, "src", "app", "api", "olcum")), ["pdf"]);
});

/* 2026-10-08 (378): zamanlayıcı ucu oturumsuz — yalnız CRON_SECRET'li istek; denetim her şeyden önce (iş koşmadan 401), yalnız GET */
test("api/is yalnız zamanlayıcının sırrıyla: ilk iş zamanliYetkili, değilse 401; yalnız GET", () => {
  assert.deepEqual(klasorlerOf(join(KOK, "src", "app", "api", "is")), ["gece"]);
  const kaynak = readFileSync(join(KOK, "src", "app", "api", "is", "gece", "route.ts"), "utf8");
  const govde = kaynak.slice(kaynak.indexOf("export async function GET"));
  assert.match(govde, /^export async function GET\(istek: Request\) \{\n {2}if \(!zamanliYetkili\(istek\.headers\.get\("authorization"\), process\.env\.CRON_SECRET\)\) \{\n {4}return Response\.json\(\{ hata: "Yetkisiz\." \}, \{ status: 401/);
  assert.doesNotMatch(kaynak, /export (async )?function (POST|PUT|PATCH|DELETE)/);
});

/* 2026-10-08 (392): çevrimdışı işlem ucu — ilk iş aynı köken (kiracılar arası sahte istek iş yapmadan 403), sonra JSON / sınır / biçim, oturum,
   işi yazan hesap = oturumdaki hesap; iş tek seferlik çatıdan (tekSeferlik) ve oturumun işleminde; yalnız POST */
test("api/islem: ilk iş aynı köken; oturum ve hesap denetimi işten önce; iş tek seferlik ve oturumun işleminde; yalnız POST", () => {
  const kaynak = readFileSync(join(KOK, "src", "app", "api", "islem", "route.ts"), "utf8");
  const govde = kaynak.slice(kaynak.indexOf("export async function POST"));
  assert.match(govde, /^export async function POST\(istek: Request\) \{\n {2}if \(!\(await ayniKoken\(\)\)\) return yanit\(\{ hata: "koken" \}, 403\);/);
  const sira = ["istekOturumu()", "b.yazan !== yazanEtiketi(o.id)", "oturumIslemi(o, async (db) => {", "await tekSeferlik(db,"].map((x) => govde.indexOf(x));
  assert.ok(sira.every((i, n) => i > 0 && (n === 0 || i > sira[n - 1])), `sıra: ${sira.join(", ")}`);
  assert.doesNotMatch(kaynak, /export (async )?function (GET|PUT|PATCH|DELETE)/);
});

/* 2026-10-06 (348; reisim: "rol değiştirme, sızma, veri çalma"): yönetim sayfası yalnız yönetim adresinde ve yönetim oturumuyla, veri yönetim
   işleminde (veritabanında yönetim rolü) — düzen ve her panel sayfası yönetim kapısını çağırır; firma / müşteri kapısı ve işlemi kullanılmaz. Giriş
   adımları başka adreste 404. Ara katman yönetim adresinde yalnız /yonetim'i, öteki adreslerde /yonetim'i hiç açmaz. */
test("yönetim kapısı: yalnız yönetim adresinde, panel yönetim oturumu ister, veri yönetim işleminde (veritabanında yönetim rolü)", () => {
  assert.match(oku("src/app/(yonetim)/yonetim/(panel)/layout.tsx"), /await yonetimOturumGerekli\(\)/);
  const sayfalar = dosyalar("src/app/(yonetim)", [".tsx", ".ts"]);
  assert.ok(sayfalar.filter((d) => d.endsWith("/page.tsx")).length >= 6);
  for (const ad of sayfalar) {
    const m = oku(ad);
    assert.doesNotMatch(m, /oturumIslemi|musteriIslemi|istekOturumu\(|musteriIstekOturumu|oturumGerekli\(\)(?<!yonetimOturumGerekli\(\))/, `${ad}: firma / müşteri kapısı`);
    if (ad.endsWith("/page.tsx") && ad.includes("/(panel)/")) assert.match(m, /await yonetimOturumGerekli\(\)/, ad);
    if (ad.endsWith("/page.tsx") && ad.includes("/giris/")) assert.match(m, /if \(!\(await yonetimAdresinde\(\)\)\) notFound\(\);/, ad);
  }
  for (const ad of sayfalar.filter((d) => /\/\(panel\)\/.*page\.tsx$/.test(d) && /firma(lar)?\(db/.test(oku(d)))) assert.match(oku(ad), /yonetimIslemi\(o,/, ad);
  const ara = oku("src/proxy.ts");
  assert.match(ara, /const yasak = yonetimde \? !YONETIM_YOLU\.test\(yol\) && !yol\.startsWith\("\/_next\/"\) : YONETIM_YOLU\.test\(yol\);/);
  assert.match(ara, /yasak \? NextResponse\.rewrite\(new URL\(YOK_YOLU/);
  /* 2026-10-06 (347–348 incelemesi): eşleştiricide istisna yok — önceden yükleme başlığıyla gelen istek de adres ayrımından geçer */
  assert.doesNotMatch(ara, /missing:/, "ara katman eşleştiricisinde istisna (missing) yok");
  assert.match(ara, /if \(onYukleme\) return yasak \? NextResponse\.rewrite\(new URL\(YOK_YOLU, istek\.url\)\) : NextResponse\.next\(\);/);
  assert.ok(ara.indexOf("const yasak =") < ara.indexOf("if (onYukleme)"), "adres ayrımı önceden yükleme dönüşünden önce");
  assert.match(oku("src/server/kiraci/istek.ts"), /if \(yonetimAdresiMi\(host\)\) return null;/);
  assert.match(oku("src/server/yonetim/istek.ts"), /if \(!\(await yonetimAdresinde\(\)\)\) notFound\(\);/);
  /* çıkış: yalnız POST, kapı istek.ts'te (adres + aynı köken) */
  const cikis = oku("src/app/(yonetim)/yonetim/cikis/route.ts");
  assert.match(cikis, /export async function POST\(/);
  assert.doesNotMatch(cikis, /export (async )?function (GET|PUT|PATCH|DELETE)\(/);
  assert.match(oku("src/server/yonetim/istek.ts"), /if \(!\(await yonetimAdresinde\(\)\)\) return "adres";\s+if \(!\(await ayniKoken\(\)\)\) return "koken";/);
});

/* 2026-10-05 (319, 0030; reisim: "rol değiştirme, sızma, veri çalma"): müşteri paneli yalnız müşteri oturumuyla ve veritabanında müşteri
   rolüyle okur — düzen ve her sayfa müşteri kapısını çağırır; personel işlemi (oturumIslemi) ya da personel oturumu kullanılmaz */
test("müşteri paneli kapısı: düzen ve her sayfa müşteri oturumu ister, veri müşteri işleminde (veritabanında müşteri rolü)", () => {
  assert.match(oku("src/app/(musteri)/layout.tsx"), /await musteriOturumGerekli\(\)/);
  const sayfalar = dosyalar("src/app/(musteri)", [".tsx", ".ts"]);
  assert.ok(sayfalar.some((d) => d.endsWith("/page.tsx")));
  for (const ad of sayfalar) {
    const m = oku(ad);
    assert.doesNotMatch(m, /oturumIslemi|istekOturumu\(|oturumGerekli\(\)(?<!musteriOturumGerekli\(\))/, `${ad}: personel kapısı`);
    if (ad.endsWith("/page.tsx")) assert.match(m, /await musteriOturumGerekli\(\)[\s\S]*musteriIslemi\(o,/, ad);
  }
});
