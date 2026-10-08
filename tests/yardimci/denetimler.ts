/* ══ KİLİT DENETİMLERİ — saf işlevler ═══════════════════════════════════════════════════════════════════════
   tests/*.test.ts bunları GERÇEK dosyalarla çağırır ve "0 bulgu" bekler; tests/bozan/*.bozan.ts aynı işlevleri
   bellekte BOZULMUŞ kopyalarla çağırır ve bulgu bekler (olumsuz kanıt, EKSIKLER 9 + anayasa 13.11: kaynak diskte
   değiştirilmez). Bir denetim burada tek yerde durur; test ile olumsuz kanıt aynı mantığı sınar. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { MODULLER } from "../../src/modules/moduller.ts";

export const KOK = join(import.meta.dirname, "..", "..");
export const oku = (yol: string) => readFileSync(join(KOK, yol), "utf8");

/** klasörü gezer, uzantısı uyan dosyaları (köke göre göreli, / ayraçlı) döndürür */
export function dosyalar(klasor: string, uzantilar: readonly string[]): string[] {
  const sonuc: string[] = [];
  const gez = (d: string) => {
    for (const ad of readdirSync(join(KOK, d))) {
      const yol = join(d, ad);
      if (statSync(join(KOK, yol)).isDirectory()) gez(yol);
      else if (uzantilar.some((u) => ad.endsWith(u))) sonuc.push(relative(KOK, join(KOK, yol)).split(sep).join("/"));
    }
  };
  gez(klasor);
  return sonuc.sort();
}

/* ── CSS ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** yorumları ve dize içlerini boşaltır (parantez/seçici sayımı yanılmasın) */
export function cssTemizle(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
}

/** anayasa 3.1: açılan ve kapanan süslü parantez sayısı eşit, hiçbir noktada kapanan fazla değil */
export function parantezHatasi(css: string): string | null {
  let derinlik = 0;
  for (const h of cssTemizle(css)) {
    if (h === "{") derinlik++;
    else if (h === "}" && --derinlik < 0) return "fazladan kapanan parantez";
  }
  return derinlik === 0 ? null : `${derinlik} parantez kapanmamış`;
}

/** anayasa 2.9: kullanılan her var(--x) bir yerde tanımlı */
export function tanimsizDegiskenler(kullananMetinler: readonly string[], tanimlayanCssler: readonly string[]): string[] {
  const tanimli = new Set<string>();
  for (const css of tanimlayanCssler) for (const m of cssTemizle(css).matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) tanimli.add(m[1]!);
  const eksik = new Set<string>();
  for (const metin of kullananMetinler) {
    // yorumlardaki örnekler kullanım değildir (/* … */ ve satır başı // yorumları)
    const kod = metin.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    for (const m of kod.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) if (!tanimli.has(m[1]!)) eksik.add(m[1]!);
  }
  return [...eksik].sort();
}

/** kalıp 16 / anayasa 13.2'nin CSS karşılığı: medya dışında aynı seçici iki ayrı blokta yazılmaz (sessiz ezme) */
export function ciftSeciciler(css: string): string[] {
  const temiz = cssTemizle(css);
  const gorulen = new Map<string, number>();
  let derinlik = 0;
  let bas = 0;
  for (let i = 0; i < temiz.length; i++) {
    const h = temiz[i];
    if (h === "{") {
      if (derinlik === 0) {
        const secici = temiz.slice(bas, i).trim().replace(/\s+/g, " ");
        if (!secici.startsWith("@")) gorulen.set(secici, (gorulen.get(secici) ?? 0) + 1);
      }
      derinlik++;
    } else if (h === "}") {
      derinlik--;
      if (derinlik === 0) bas = i + 1;
    } else if (h === ";" && derinlik === 0) bas = i + 1;
  }
  return [...gorulen].filter(([, n]) => n > 1).map(([s]) => s).sort();
}

/** medya dışında aynı seçicinin bloklarında AYNI değişken iki kez tanımlı (sessiz ezme — çift bloğun asıl tehlikesi) */
export function ciftTanimliDegiskenler(css: string): string[] {
  const temiz = cssTemizle(css);
  const tanim = new Map<string, number>();
  let derinlik = 0, bas = 0, govdeBas = -1, secici = "";
  for (let i = 0; i < temiz.length; i++) {
    const h = temiz[i];
    if (h === "{") {
      if (derinlik === 0) { secici = temiz.slice(bas, i).trim().replace(/\s+/g, " "); govdeBas = i + 1; }
      derinlik++;
    } else if (h === "}") {
      derinlik--;
      if (derinlik === 0) {
        if (!secici.startsWith("@")) for (const m of temiz.slice(govdeBas, i).matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
          const anahtar = `${secici} ${m[1]}`;
          tanim.set(anahtar, (tanim.get(anahtar) ?? 0) + 1);
        }
        bas = i + 1;
      }
    } else if (h === ";" && derinlik === 0) bas = i + 1;
  }
  return [...tanim].filter(([, n]) => n > 1).map(([k]) => k).sort();
}

/* ── TSX ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** aynı sabit id iki yerde (sayfada iki öğe aynı id'yi alır) */
export function ciftIdler(metinler: readonly { ad: string; metin: string }[]): string[] {
  const sayac = new Map<string, string[]>();
  for (const { ad, metin } of metinler) for (const m of metin.matchAll(/\bid="([^"]+)"/g)) sayac.set(m[1]!, [...(sayac.get(m[1]!) ?? []), ad]);
  return [...sayac].filter(([, yerler]) => yerler.length > 1).map(([id, yerler]) => `${id} (${yerler.join(", ")})`).sort();
}

/* ── DEĞİŞKENLER VE KALIP ──────────────────────────────────────────────────────────────────────────────── */

/** :root'tan sonrası (yazı tipi tanımı ve baş yorumu hariç gövde) */
export function tokenGovdesi(css: string): string {
  const i = css.indexOf(":root {");
  return i < 0 ? "" : css.slice(i).replace(/\r\n/g, "\n");
}

/** verilen medya sorgusunun gövdesi (yorumsuz; parantez SAYILARAK bulunur — anayasa 3.1 / 3.9, lastIndexOf değil) */
export function medyaBlogu(css: string, medya: string): string | null {
  const temiz = cssTemizle(css);
  const i = temiz.indexOf(`@media ${medya}`);
  if (i < 0) return null;
  let derinlik = 0, j = temiz.indexOf("{", i);
  const bas = j;
  for (; j < temiz.length; j++) { if (temiz[j] === "{") derinlik++; else if (temiz[j] === "}" && --derinlik === 0) break; }
  return temiz.slice(bas, j);
}

/** bir blokta (:root taban kuralı ya da verilen medya sorgusu) değişkenin değeri */
export function degiskenDegeri(css: string, degisken: string, medya: string | null): string | null {
  let alan: string | null;
  if (medya) alan = medyaBlogu(css, medya);
  else {
    const temiz = cssTemizle(css);
    const i = temiz.indexOf(":root {");
    alan = temiz.slice(i, temiz.indexOf("}", i));
  }
  const m = alan?.match(new RegExp(`${degisken}\\s*:\\s*([^;]+);`));
  return m ? m[1]!.trim() : null;
}

/** yazı alanı yazı boyu (2026-09-25): alan boyunu YALNIZ `input, textarea, select { font-size: var(--boy-girdi); }` verir.
 *  Döner: bağlayan kural yoksa "bağlama kuralı yok", ondan SONRA yazı alanının boyunu başka değere çeken her kuralın seçicisi
 *  (`font:` kısaltması ya da başka `font-size`) — iPhone 16 px altında odakta sayfayı büyütür. */
export function girdiYaziHatalari(css: string): string[] {
  const temiz = cssTemizle(css);
  const bag = temiz.search(/(^|\n)input, textarea, select \{ font-size: var\(--boy-girdi\); \}/);
  if (bag < 0) return ["bağlama kuralı yok"];
  const hatalar: string[] = [];
  for (const m of temiz.slice(temiz.indexOf("}", bag) + 1).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const secici = m[1]!.trim(), govde = m[2]!;
    if (!/(^|[\s,>+~(])(input|textarea|select)(?![\w-])/.test(secici)) continue;
    if (/(^|[;\s])font\s*:/.test(govde) || /font-size\s*:(?!\s*var\(--boy-girdi\)\s*(;|$))/.test(govde)) hatalar.push(secici);
  }
  return hatalar;
}

/** kalıbın üç bandı dışında kalan genişlik eşikleri: izinli olanlar max-width (genis|orta) − 0,02 ve min-width genis|orta */
export function kalipDisiEsikler(css: string, bant: { orta: number; genis: number }): string[] {
  const izinli = new Set([`max-width: ${bant.genis - 0.02}px`, `max-width: ${bant.orta - 0.02}px`, `min-width: ${bant.genis}px`, `min-width: ${bant.orta}px`]);
  return [...cssTemizle(css).matchAll(/\((max|min)-width:\s*([\d.]+)px\)/g)].map((m) => `${m[1]}-width: ${m[2]}px`).filter((e) => !izinli.has(e));
}

/** daraltılmış yan menü şeridinin genişliği: verilen medya bloğundaki ilk "grid-template-columns: Npx minmax(0, 1fr)" */
export function daralmisSerit(css: string, medya: string): number | null {
  const m = medyaBlogu(css, medya)?.match(/grid-template-columns:\s*(\d+)px\s+minmax\(0,\s*1fr\)/);
  return m ? Number(m[1]) : null;
}

/** anayasa 2.11: daraltma işaretini (ör. data-menu="dar") taşıyan kural, izin verilen medya bloğunun DIŞINDA — tablet
 *  ve telefonda menü ikon şeridine dönüşmesin. Bulgu: blok dışındaki işaret sayısı. */
export function bantDisiDaraltma(css: string, isaret: string, medya: string): number {
  const temiz = cssTemizle(css);
  const blok = medyaBlogu(css, medya) ?? "";
  const say = (metin: string) => metin.split(isaret).length - 1;
  return say(temiz) - say(blok);
}

/* ── İKONLAR ──────────────────────────────────────────────────────────────────────────────────────────── */

/** modül kaydındaki ve TSX'teki bütün ikon adları */
export function kullanilanIkonlar(): string[] {
  const adlar = new Set(MODULLER.map((m) => m.ikon));
  for (const d of dosyalar("src", [".tsx"])) {
    const metin = oku(d);
    for (const m of metin.matchAll(/<Ikon\s+ad="([a-z0-9-]+)"/g)) adlar.add(m[1]!);
    for (const m of metin.matchAll(/\bikon="([a-z0-9-]+)"/g)) adlar.add(m[1]!);
    for (const m of metin.matchAll(/\bikon:\s*"([a-z0-9-]+)"/g)) adlar.add(m[1]!);
    for (const m of metin.matchAll(/ad=\{[^}]*"([a-z0-9-]+)"\s*:\s*"([a-z0-9-]+)"\s*\}/g)) { adlar.add(m[1]!); adlar.add(m[2]!); }
  }
  return [...adlar].sort();
}

/** maket betik/sayfalarındaki ikon adları: ikon("x") / I("x") çağrılarının içindeki dizeler (üçlü koşuldaki seçenekler dahil,
 *  karşılaştırılan değerler ve a- önekli sınıflar hariç), ikon: "x" alanları ve #i-x bağlantıları (2026-09-24) */
export function maketIkonlari(metinler: readonly string[]): string[] {
  const adlar = new Set<string>();
  for (const m of metinler) {
    for (const x of m.matchAll(/\b(?:ikon|I)\(([^)]*)\)/g)) for (const y of x[1]!.matchAll(/(===\s*)?"([a-z0-9-]+)"/g)) if (!y[1] && !y[2]!.startsWith("a-")) adlar.add(y[2]!);
    for (const x of m.matchAll(/\bikon:\s*"([a-z0-9-]+)"/g)) adlar.add(x[1]!);
    for (const x of m.matchAll(/#i-([a-z0-9-]+)/g)) adlar.add(x[1]!);
  }
  return [...adlar].sort();
}

/** ikon dosyasında olmayan adlar */
export function eksikIkonlar(adlar: readonly string[], ikonDosyasi: string): string[] {
  return adlar.filter((a) => !ikonDosyasi.includes(`id="i-${a}"`));
}

/* ── MENÜ ────────────────────────────────────────────────────────────────────────────────────────────── */

export interface MenuGrubu { grup: string; ogeler: [string, string, number][] }

/** onaylı maketin MENU sabiti (docs/assets/maket.js) */
export function maketMenusu(maketJs: string): MenuGrubu[] {
  const bas = maketJs.indexOf("var MENU = [");
  const son = maketJs.indexOf("];", bas);
  const blok = maketJs.slice(bas, son);
  return [...blok.matchAll(/\{ grup: "([^"]+)", ogeler: \[(.*?)\] \}/g)].map((m) => ({
    grup: m[1]!,
    ogeler: [...m[2]!.matchAll(/\["([^"]+)", "([^"]+)", (\d+)\]/g)].map((o) => [o[1]!, o[2]!, Number(o[3])] as [string, string, number]),
  }));
}

/* ── KİRACI SÜZGECİ ────────────────────────────────────────────────────────────────────────────────────── */

/** veritabanına src/server/db dışından doğrudan erişim (pg içe aktarma ya da .query çağrısı) */
export function kiraciDisiErisim(metinler: readonly { ad: string; metin: string }[]): string[] {
  return metinler
    .filter(({ ad }) => !ad.startsWith("src/server/db/"))
    .filter(({ metin }) => /from\s+["'](pg|embedded-postgres)["']/.test(metin) || /\.query\s*\(/.test(metin))
    .map(({ ad }) => ad);
}

/** ham yazma SQL'i (INSERT INTO · UPDATE … SET · DELETE FROM · TRUNCATE) yalnız çekirdekte (src/server/); modüller ve sayfalar güvenli
    yazıcıdan yazar (src/server/db/yazici.ts: sürüm kilidi + denetim izi — 09-D1, D3). K1 2026-10-04. */
export function hamYazma(metinler: readonly { ad: string; metin: string }[]): string[] {
  return metinler
    .filter(({ ad }) => !ad.startsWith("src/server/"))
    .filter(({ metin }) => /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/i.test(metin))
    .map(({ ad }) => ad);
}

/** firma_id taşıyan (ya da firma) her tablo: ENABLE + FORCE ROW LEVEL SECURITY + en az bir politika */
export function rlsEksikTablolar(sqlMetinleri: readonly string[]): string[] {
  const sql = sqlMetinleri.join("\n").replace(/--[^\n]*/g, "");
  const eksik: string[] = [];
  for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
    const [, tablo, govde] = m;
    if (tablo !== "firma" && !/\bfirma_id\b/.test(govde!)) continue;
    const ister = [
      new RegExp(`ALTER TABLE ${tablo} ENABLE ROW LEVEL SECURITY`),
      new RegExp(`ALTER TABLE ${tablo} FORCE ROW LEVEL SECURITY`),
      new RegExp(`CREATE POLICY \\w+ ON ${tablo}\\b`),
    ];
    const yok = ister.filter((r) => !r.test(sql));
    if (yok.length) eksik.push(`${tablo}: ${yok.map((r) => r.source.replace(/\\\w|\\b/g, "")).join(" · ")}`);
  }
  return eksik;
}

/* ── TEST KAPISI ───────────────────────────────────────────────────────────────────────────────────────── */

/** anayasa 0.3 + 13.6: fail 0 olmadan derleme/yayın yok — betikte ve CI'da mekanik */
export function testKapisiEksikleri(paketJson: string, ciYml: string): string[] {
  const eksik: string[] = [];
  const betikler = (JSON.parse(paketJson) as { scripts: Record<string, string> }).scripts;
  for (const ad of ["build", "build:onizleme"]) if (!betikler[ad]?.startsWith("npm test && ")) eksik.push(`package.json ${ad} testle başlamıyor`);
  const testSatiri = ciYml.indexOf("run: npm test");
  const derleSatiri = ciYml.indexOf("run: node scripts/next.ts build");
  if (testSatiri < 0) eksik.push("CI'da npm test yok");
  if (derleSatiri >= 0 && testSatiri > derleSatiri) eksik.push("CI'da derleme testten önce");
  /* 2026-10-06 (reisim: "githubdan hala bir sürü gereksiz yayınlar da gidiyor onlarıda durdur"): main'de denetim yeniden koşmaz (main'e yalnız kalem
     dalında yeşil geçmiş commit ileri sarılır); yayın işi "needs: denetim" yerine aynı SHA'nın BAŞARILI ci koşusunu GitHub'dan sorar, yoksa düşer.
     Şart aynı sıkılıkta: yeşil denetimi olmayan commit Pages'e çıkmaz. */
  if (!/yayin:[\s\S]*?needs:\s*denetim/.test(ciYml)
    && !/yayin:[\s\S]*?head_sha=\$\{\{ github\.sha \}\}&status=success[\s\S]*?select\(\.name == "ci"[\s\S]*?exit 1; fi[\s\S]*?node scripts\/onizleme\.ts/.test(ciYml)) {
    eksik.push("CI yayın işi denetime bağlı değil (needs: denetim ya da aynı commit'in yeşil denetimi şartı)");
  }
  /* 2026-10-08: uçtan uca üç genişlik ayrı işlerde, aynı anda (matris) — genişlik listeden düşerse o genişlik hiç denenmez, koşu yine yeşil görünür */
  const matris = /\bproje:\s*\[([^\]]*)\]/.exec(ciYml)?.[1].split(",").map((x) => x.trim()) ?? [];
  for (const g of ["masaustu", "tablet", "telefon"]) if (!matris.includes(g)) eksik.push(`CI'da uçtan uca ${g} yok`);
  if (!ciYml.includes("run: npm run test:e2e -- --project=${{ matrix.proje }}")) eksik.push("CI'da uçtan uca koşusu yok");
  return eksik;
}

/* ── PDF PAKETİ (352; Vercel Functions Storage kotası) ── next.config.ts outputFileTracingIncludes'taki (Chromium ikilisi eklenen) her uç
   `export const maxDuration = 60;` taşımalı: Vercel aynı ayarlı uçları tek işlevde toplar — biri eksikse Chromium varsayılan sayfa işlevine düşer
   (bütün sayfalar 74 MB). Ayrıca PDF basan modül eylemi (belge/pdf içe aktaran "use server" dosyası) kullanan sayfa da listede olmalı. */
export function pdfPaketEksikleri(nextConfig: string, sayfalar: readonly { ad: string; metin: string }[]): string[] {
  /* yalnız listenin kendisi okunur (411: başka ayarlardaki adresler — 409 /favicon.ico yönlendirmesi — uç sanılıyordu) */
  const bas = nextConfig.indexOf("outputFileTracingIncludes:"), son = bas < 0 ? -1 : nextConfig.indexOf("].map(", bas);
  const blok = bas < 0 || son < 0 ? "" : nextConfig.slice(bas, son);
  const liste = [...blok.matchAll(/(?:String\.raw`([^`]+)`|"(\/[^"]*)")/g)].map((m) => (m[1] ?? m[2]).replace(/\\/g, ""))
    .filter((u) => u.startsWith("/") && !u.startsWith("/./") && !u.includes("*"));
  const eksik: string[] = [];
  /* liste okunamazsa (biçim değişti) denetim boşa dönmesin */
  if (liste.length < 10) eksik.push(`next.config.ts PDF listesi okunamadı (${liste.length} uç)`);
  for (const u of liste) {
    /* rota → dosya: rota grupları "(…)" yok sayılır */
    const dosya = sayfalar.find((d) => {
      const m = /^src\/app\/(.*)\/(page|route)\.tsx?$/.exec(d.ad);
      return m && "/" + m[1].split("/").filter((p) => !/^\(.*\)$/.test(p)).join("/") === u;
    });
    if (!dosya) { eksik.push(`${u}: sayfa / uç dosyası yok`); continue; }
    if (!/^export const maxDuration = 60;$/m.test(dosya.metin)) eksik.push(`${u}: maxDuration = 60 yok`);
  }
  return eksik;
}

/* ── ÇEKMECE BOYU (419) ── yan menü (.cubuk) yüksekliği görünen ekran boyunda (dvh) olmalı: yalnız 100vh telefonda adres çubuğu gizliyken boydur,
   çubuk görünürken çekmecenin altı ekran dışında kalır — reisim Chrome'da en alttaki "Firma ayarları"na basamadı. Hata yoksa null. */
export function cekmeceBoyuHatasi(kabukCss: string): string | null {
  const govde = /(?:^|\n)\.cubuk \{([^}]*)\}/.exec(kabukCss)?.[1];
  if (govde === undefined) return ".cubuk kuralı bulunamadı";
  const boylar = [...govde.matchAll(/(?:^|[;\s])height:\s*([^;]+);/g)].map((m) => m[1].trim());
  return boylar.at(-1) === "100dvh" ? null : `.cubuk yüksekliği ${boylar.at(-1) ?? "yok"} — görünen boy (100dvh) olmalı`;
}

/* ── BAĞLANTI RENGİ (412) ── `<Link className={stil.x} href…>` / `<a className={stil.x} href…>`: x sınıfının CSS modülünde renk (color) olmalı —
   yoksa bağlantı tarayıcının mavisine düşer (411 görsel karşılaştırmasında Planlar'ın proje no'sunda görüldü; Raporlar, Onaylar, müşteri paneli
   aynıydı). Sınıfsız bağlantı temel.css'teki `:where(a)` tabanından renk alır: taban da denetlenir. */
export function baglantiRengiEksikleri(tsx: readonly { ad: string; metin: string }[], css: (yol: string) => string, temel: string): string[] {
  const eksik: string[] = [];
  if (!/:where\(a\)\s*\{[^}]*\bcolor\s*:/.test(temel)) eksik.push("temel.css: :where(a) bağlantı tabanında renk yok");
  for (const d of tsx) {
    const ice = new Map<string, string>();
    for (const m of d.metin.matchAll(/import (\w+) from "(\.{1,2}\/[^"]+\.module\.css)"/g)) {
      const yol = [...d.ad.split("/").slice(0, -1)];
      for (const p of m[2].split("/")) if (p === "..") yol.pop(); else if (p !== ".") yol.push(p);
      ice.set(m[1], yol.join("/"));
    }
    for (const m of d.metin.matchAll(/<(?:Link|a)\b[^>]*?className=\{(\w+)\.(\w+)\}[^>]*?href=|<(?:Link|a)\b[^>]*?href=[^>]*?className=\{(\w+)\.(\w+)\}/g)) {
      const [ad, sinif] = m[1] ? [m[1], m[2]] : [m[3], m[4]];
      const yol = ice.get(ad);
      if (!yol) continue;
      const govdeler = [...css(yol).matchAll(new RegExp(`\\.${sinif}(?![\\w-])[^{}]*\\{([^}]*)\\}`, "g"))].map((x) => x[1]);
      if (!govdeler.some((g) => /(^|[;\s])color\s*:/.test(g))) eksik.push(`${d.ad}: .${sinif} bağlantısında renk yok (${yol})`);
    }
  }
  return [...new Set(eksik)];
}

/* ── ÇEVRİMDIŞI SERVİS ÇALIŞANI (395) ── public/sw.js düz betik: cihaz deposunun şeması src/components/cevrimdisi/depo.ts ile ORTAK (ad, sürüm,
   bölmeler aynı olmalı — biri artarsa öteki eski şemayla açar); yalnız saha sayfaları saklanır (API, giriş, müşteri paneli, yönetim ASLA); yalnız
   aynı kökenden GET; sayfa CSP'si çalışana izin verir. */
export function swEksikleri(sw: string, depo: string, proxy: string): string[] {
  const eksik: string[] = [];
  const sabit = (m: string, ad: string) => new RegExp(`const ${ad} = ("[^"]+"|[0-9]+);`).exec(m)?.[1] ?? null;
  for (const ad of ["VT", "SURUM", "ISLER", "ANAHTAR", "SAYFALAR", "DURUM"]) {
    const a = sabit(sw, ad), b = sabit(depo, ad);
    if (!a || a !== b) eksik.push(`depo şeması farklı: ${ad} (sw ${a} · depo ${b})`);
  }
  const yollar = /const SAYFA_YOLLARI = (\[[^\n]*\]);/.exec(sw)?.[1];
  let ifadeler: RegExp[] = [];
  try { ifadeler = yollar ? (new Function(`return ${yollar};`)() as RegExp[]) : []; } catch { /* aşağıda eksik */ }
  if (!ifadeler.length) eksik.push("SAYFA_YOLLARI okunamadı");
  const kimlik = "0f8c2b9e-1d2a-4c3b-9e8f-7a6b5c4d3e2f";
  const eslesir = (y: string) => ifadeler.some((x) => x.test(y));
  for (const y of ["/", "/planlar", `/planlar/${kimlik}`, `/raporlar/${kimlik}`, `/raporlar/yeni/${kimlik}`]) if (!eslesir(y)) eksik.push(`saha sayfası saklanmıyor: ${y}`);
  for (const y of ["/api/islem", `/api/dosya/${kimlik}`, "/giris", "/portal", `/portal/r/${kimlik}`, "/yonetim", "/yonetim/giris", `/raporlar/${kimlik}/pdf`, "/muhasebe"]) {
    if (eslesir(y)) eksik.push(`saklanmaması gereken yol saklanıyor: ${y}`);
  }
  if (!sw.includes('if (r.method !== "GET") return;')) eksik.push("yalnız GET denetimi yok");
  if (!sw.includes("if (u.origin !== self.location.origin) return;")) eksik.push("yalnız aynı köken denetimi yok");
  if (!proxy.includes(`"worker-src 'self'"`)) eksik.push("CSP worker-src 'self' yok");
  /* saklama yanıtı bekletmez: sayfa / dosya tarayıcıya akarak gider, kopyası arka planda (CI 2177156 — bütün sayfayı bekleyen çalışan, yavaş
     sunucuda sayfayı takılı bıraktı) */
  if (/await\s+(sayfaSakla|c\.put|caches\.open)\(/.test(sw.replace(/async function dosyalariSakla[\s\S]*?\n}\n/, "")) || !sw.includes("e.waitUntil(sayfaSakla(")) {
    eksik.push("saklama yanıtı bekletiyor (waitUntil değil)");
  }
  /* saklanan sayfanın uygulama dosyaları da saklanır (CI 2177156: önceden indirilen sayfa bağlantısız göründü ama dosyası cihazda olmadığı için
     çalışmadı); sayfa kaydı dosyalardan SONRA yazılır */
  const sakla = /async function sayfaSakla[\s\S]*?\n}\n/.exec(sw)?.[0] ?? "";
  const dosyaYeri = sakla.indexOf("await dosyalariSakla("), kayitYeri = sakla.indexOf("objectStore(SAYFALAR).put(");
  if (dosyaYeri < 0 || kayitYeri < 0 || dosyaYeri > kayitYeri) eksik.push("saklanan sayfanın uygulama dosyaları önce saklanmıyor");
  /* 401: cihazdaki sayfa sayısı sınırlı (davranışı tests/sw.test.ts sahte depoyla sınar) */
  if (!sakla.includes("await sayfalariKirp(db);")) eksik.push("saklanan sayfa sayısı sınırsız");
  /* dosya önbelleği yolla (sorgu dizgisiz) anahtarlanır: geliştirmede her istekte değişen "?v=" yüzünden aynı dosya yeniden yeniden inmesin,
     bağlantısız açılışta bulunsun */
  if (!sw.includes("caches.match(anahtarAdresi(r.url))") || !sw.includes("c.put(anahtarAdresi(r.url), kopya)")) eksik.push("dosya önbelleği sorgu dizgisine bağlı");
  return eksik;
}
