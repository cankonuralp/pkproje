/* ══ KİLİT DENETİMLERİ — saf işlevler ═══════════════════════════════════════════════════════════════════════
   tests/*.test.ts bunları GERÇEK dosyalarla çağırır ve "0 bulgu" bekler; tests/bozan/*.bozan.ts aynı işlevleri
   bellekte BOZULMUŞ kopyalarla çağırır ve bulgu bekler (olumsuz kanıt, EKSIKLER 9 + anayasa 13.11: kaynak diskte
   değiştirilmez). Bir denetim burada tek yerde durur; test ile olumsuz kanıt aynı mantığı sınar. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
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
    /* 2026-10-14 (542): dokunmatikte modül sınıfının "font: inherit"i ezemesin diye temel.css'teki !important'lı bağlama da aynı değişkene bağlıdır */
    if (/(^|[;\s])font\s*:/.test(govde) || /font-size\s*:(?!\s*var\(--boy-girdi\)\s*(!important\s*)?(;|$))/.test(govde)) hatalar.push(secici);
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

/* ── MERKEZ HAVUZU KAPSAMI (FIRMA-VT §2 A6, §5.1 — FV3, 2026-10-15) ───────────────────────────────────────────────────────────────── */

/** merkez havuzunu (src/server/db/havuz.ts) içe aktarmasına İZİN verilen dosyalar ve gerekçesi. Kiracının işi KİRACININ havuzundan
    (src/server/db/firma-havuzu.ts kiraciHavuzu); merkezi kullanan her yer burada, gerekçesiyle — yeni bir dosya merkezi içe aktarırsa kilit düşer,
    listedeki bir dosya bırakırsa da (liste tam kalır). Kilit tests/havuz-kapsami.test.ts · olumsuz kanıt tests/bozan/havuz-kapsami.bozan.ts. */
export const MERKEZ_HAVUZU_IZNI: Readonly<Record<string, string>> = {
  "src/app/api/is/gece/route.ts": "gece işinin firma listesi ve iş kaydı merkezde (kendi projeli firmanın havuzu FV6)",
  "src/server/db/firma-havuzu.ts": "kiracı kaydının çözümü (firma_coz) merkezde; ortak firmanın havuzu merkezin kendisi",
  /* 2026-10-15 (FIRMA-VT FV4): merkezHavuzu() KULLANMAZ — yalnız ortamdanBaglanti; derleme adımında kendi kısa ömürlü havuzunu kurar ve kapatır */
  "src/server/db/goc-dagit.ts": "göç dağıtıcı (yayın kapısı, derleme adımı): merkez bağlantısı ortamdan (ortamdanBaglanti), goc_hedefleri merkezde",
  "src/server/dosya/depo.ts": "veritabanı deposu (vtDepo) yalnız ortak firmanın: db verilmezse anahtarın firmasının işlemi merkezde (kendi projeli firma FV5 yönlendiricisiyle kendi Storage'ında)",
  "src/server/duyuru/sonra.ts": "Bakanlık duyuruları merkezde (firmaya ait değil)",
  "src/server/hata/kaydet.ts": "hata kaydı merkezde (yalnız yönetim okur)",
  /* 2026-10-15 (FIRMA-VT FV7): firmanın veritabanını kiracının havuzundan denetler (kiraciHavuzu); merkezde yalnız merkezin denetimi ve projeler */
  "src/server/saglik.ts": "sağlık ucu merkezi denetler; proje yoklamasının hedefleri (goc_hedefleri) ve sonuç yazımı (son_saglik) merkezde",
  "src/server/yonetim/eylemler.ts": "yönetim girişi merkezde (yönetici, iki adım)",
  "src/server/yonetim/istek.ts": "yönetim oturumu ve yönetim işlemleri merkezde",
};

/** yorumlar atılır (yorumdaki söz içe aktarma sayılmaz); "://" bozulmaz */
const yorumsuz = (m: string) => m.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
/** içe aktarma belirteci → depo köküne göre yol (uzantısız); paket adıysa null. Göreli yol dosyanın klasöründen, "@/" src'den. */
function iceAktarilan(ad: string, belirtec: string): string | null {
  let yol: string;
  if (belirtec.startsWith("@/")) yol = "src/" + belirtec.slice(2);
  else if (belirtec.startsWith(".")) yol = posix.normalize(posix.join(posix.dirname(ad), belirtec));
  else return null;
  return yol.replace(/\.(ts|tsx|mts|js|mjs|cjs)$/, "").replace(/\/index$/, "");
}
/** merkez havuzunu içe aktaran dosyalar (sıralı): statik (from), yan etkili (import "…"), dinamik (import(…)), yeniden dışa açma, require */
export function merkezHavuzuIceAktaranlar(metinler: readonly { ad: string; metin: string }[]): string[] {
  const kalip = /\b(?:from|import)\s*\(?\s*["']([^"']+)["']|\brequire\s*\(\s*["']([^"']+)["']/g;
  return metinler
    .filter(({ ad, metin }) => [...yorumsuz(metin).matchAll(kalip)].some((m) => iceAktarilan(ad, m[1] ?? m[2]!) === "src/server/db/havuz"))
    .map(({ ad }) => ad).sort();
}
/** FIRMA-VT FV8 (2026-10-16): DIŞ HİZMET YÖNETİM ANAHTARLARI — Supabase Yönetim API'sinin PAT'i ve Resend ana anahtarı (FIRMA-VT §7: Vercel ortamında):
    · ortam adları (yorum dışında) YALNIZ src/server/dis/** ve scripts/** içinde;
    · src/server/dis/** dosyalarını (kendi içi dışında) YALNIZ izin listesindeki dosyalar içe aktarır — uygulamanın istek yolu, modüller, sayfalar ve
      tarayıcı zinciri değil (anahtar istemci paketine ya da istek işlevine taşınmaz). Liste tam: fazlası da eksiği de bulgu.
    Dönen: bulgu listesi. Kilit tests/yonetim-anahtari.test.ts · olumsuz kanıt tests/bozan/yonetim-anahtari.bozan.ts. */
export const DIS_IZNI: Readonly<Record<string, string>> = {
  "src/server/db/goc-dagit.ts": "göç dağıtıcı (Vercel derlemesi): 'uygula' kipinde Yönetim API istemcisini kurar",
  "src/server/db/goc-uygula.ts": "göç dağıtıcının 'uygula' kipi: göçleri Yönetim API yürütücüsüyle uygular",
  /* FV10 (2026-10-16): kurulum makinesi — yönetim sunucusunda, yönetim oturumuyla (yönetim adresi; tarayıcı zinciri değil) */
  "src/modules/yonetim/server/calistirici.ts": "kurulumun ortamı: Yönetim API istemcisi ve kurulum ayarı (örgüt, yerel Storage) — yalnız yönetim oturumunda",
  "src/modules/yonetim/server/kurulum.ts": "kurulum makinesi: projeyi Yönetim API'siyle açar, göçleri uygular, bağlar",
  "src/modules/yonetim/server/kurulum-hata.ts": "kurulum hatasının sınıfı: Yönetim API istemcisinin hata türlerini tanır",
  /* FV11 (2026-10-16): e-posta gönderimi — firmanın alan adı probata'nın Resend hesabına (yönetim oturumunda) */
  "src/modules/yonetim/server/eposta.ts": "e-posta gönderimi: alan adını Resend'e ekler, doğrular, gönderme anahtarını açar — yalnız yönetim oturumunda",
};
const DIS_ORTAM = /\bPROBATA_(?:SUPABASE_YONETIM_(?:ANAHTARI|UC)|SUPABASE_ORGUT|SUPABASE_DEPO_UC|RESEND_(?:ANAHTARI|YONETIM_UC))\b/;
export function yonetimAnahtariEksikleri(metinler: readonly { ad: string; metin: string }[]): string[] {
  const hata: string[] = [];
  const kalip = /\b(?:from|import)\s*\(?\s*["']([^"']+)["']|\brequire\s*\(\s*["']([^"']+)["']/g;
  const iceride = (ad: string) => ad.startsWith("src/server/dis/");
  const aktaranlar: string[] = [];
  for (const { ad, metin } of metinler) {
    const k = yorumsuz(metin);
    if (!iceride(ad) && !ad.startsWith("scripts/") && DIS_ORTAM.test(k)) hata.push(`${ad}: yönetim anahtarının ortam adı dış hizmet katmanı dışında`);
    if (!iceride(ad) && [...k.matchAll(kalip)].some((m) => (iceAktarilan(ad, m[1] ?? m[2]!) ?? "").startsWith("src/server/dis/"))) aktaranlar.push(ad);
  }
  const izin = Object.keys(DIS_IZNI);
  for (const ad of aktaranlar.sort()) if (!izin.includes(ad)) hata.push(`${ad}: dış hizmet istemcisini izinsiz içe aktarıyor`);
  for (const ad of izin) if (!aktaranlar.includes(ad)) hata.push(`${ad}: izin listesinde ama içe aktarmıyor (liste tam olmalı)`);
  return hata;
}

/** göç dağıtıcı (goc-dagit.ts) Yönetim API istemcisini ve "uygula"nın yazan kısmını statik (değer olarak) içe aktarıyor mu — yalnız tür içe aktarması
    ya da await import olmalı (sağlık modülü o dosyayı içe aktarır: statik içe aktarma uygulamanın paketine sokar). Dönen: bulgu listesi. */
export function dagitStatikYukleme(metin: string): string[] {
  const k = yorumsuz(metin);
  const hata: string[] = [];
  for (const m of k.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"(\.\.\/dis\/[^"]+|\.\/goc-uygula\.ts)";/gm)) if (!m[1]) hata.push(`statik içe aktarma: ${m[2]}`);
  if (!/await import\("\.\.\/dis\/supabase-yonetim\.ts"\)/.test(k)) hata.push("istemci dinamik yüklenmiyor");
  if (!/await import\("\.\/goc-uygula\.ts"\)/.test(k)) hata.push("uygula kipi dinamik yüklenmiyor");
  return hata;
}

/** kiracının işi merkez havuzuyla açılan dosyalar (kiraciIcinde(merkezHavuzu() …) — olmamalı: kiracının işi kiraciHavuzu'ndan */
export function merkezdeKiraciIsi(metinler: readonly { ad: string; metin: string }[]): string[] {
  return metinler.filter(({ metin }) => /\bkiraciIcinde\s*\(\s*merkezHavuzu\s*\(/.test(yorumsuz(metin))).map(({ ad }) => ad).sort();
}

/** isteğin kiracısı YALNIZ Host başlığından (09-E2; FIRMA-VT §3 karar 3.1): src/server/kiraci/istek.ts'te başlıklar BİR kez okunur, başlıktan yalnız
    "host"; çerez, sorgu dizesi, X-Forwarded-*, istek adresi, Referer / Origin ve başlığın öteki okuma yolları (entries, has, forEach …) yok; çözüm
    hosttanKiraci'ye yalnız host + ana alanla gider. Her eksik / fazla bir satır. Kilit tests/kiraci-coz.test.ts, tests/firma-vt.test.ts · olumsuz kanıt
    tests/bozan/kiraci-coz.bozan.ts. 2026-10-15 (FV3 incelemesi): önce firma-vt.test.ts içinde düz ifadelerdi, olumsuz kanıtı yoktu. */
export function kiraciBasligiEksikleri(metin: string): string[] {
  const k = yorumsuz(metin);
  const e: string[] = [];
  if (!/const host = \(await headers\(\)\)\.get\("host"\) \?\? "";/.test(k)) e.push("başlıktan host okunmuyor");
  const baslik = (k.match(/\bheaders\s*\(/g) ?? []).length;
  if (baslik !== 1) e.push(`başlıklar ${baslik} kez okunuyor (yalnız bir kez)`);
  const alan = (k.match(/\.get\s*\(/g) ?? []).length;
  if (alan !== 1) e.push(`${alan} alan okunuyor (yalnız host)`);
  const yasak = k.match(/cookies|searchParams|forwarded|nextUrl|x-probata|x-real|referer|origin|\.(?:entries|has|forEach|keys|values)\s*\(/gi);
  if (yasak) e.push(`kiracı başka kaynaktan: ${[...new Set(yasak.map((x) => x.toLowerCase()))].join(", ")}`);
  if (!/return hosttanKiraci\(host, anaAlan\(\), firmaKaydi\);/.test(k)) e.push("çözüm yalnız host + ana alanla değil");
  return e;
}

/** yönetim eylemleri kiracı kaydı önbelleğini boşaltır (FIRMA-VT §5.1, FV3): firma açma, dondurma, etkinleştirme, geçici parola BAŞARI yolunda
    firmaKayitlariniUnut'a uğrar — yoksa bu örnekte dondurulan firma 15 sn "etkin", yeni açılan firma 5 sn "yok" kalır. src/modules/yonetim/ui/eylemler.ts
    metninde: unut başarıda firmaKayitlariniUnut'u çağırır; yenileyerek unut'tan geçer; firma işlevini (firmaAc / firmaDurumu / yoneticiyeGeciciParola)
    çağıran her dışa açık eylem sonucunu unut ya da yenileyerek'ten geçirir (en az dört eylem). Kilit tests/havuz-kapsami.test.ts · olumsuz kanıt
    tests/bozan/havuz-kapsami.bozan.ts. 2026-10-15 (FV3 incelemesi): önce yalnız uçtan uca "Dondur → adres kapanır" adımı dolaylı yakalıyordu, o da
    zamanlamaya bağlıydı (olumlu kayıt 15 sn'de kendiliğinden bayatlar). */
export function yonetimOnbellekEksikleri(metin: string): string[] {
  const k = yorumsuz(metin);
  const e: string[] = [];
  if (!/const unut = \(y: YonetimYaniti\) => \{ if \(y\.tamam\) firmaKayitlariniUnut\(\); return y; \};/.test(k)) e.push("unut önbelleği boşaltmıyor");
  if (!/const yenileyerek = \(y: YonetimYaniti\) => \{ if \(unut\(y\)\.tamam\)/.test(k)) e.push("yenileyerek unut'tan geçmiyor");
  let firmaEylemi = 0;
  for (const p of k.split(/(?=export async function )/)) {
    const ad = /^export async function (\w+)/.exec(p)?.[1];
    /* 2026-10-16 (FIRMA-VT FV9): dondur / etkinleştir / geçici parola firma-tarafi.ts üzerinden (kendi projeli firmada firmanın veritabanında), yapay
       zekâ anahtarı eylemleri eklendi — onlar da önbelleği boşaltır */
    if (!ad || !/\b(?:firmaAc|firmaDurumu|yoneticiyeGeciciParola|firmaDurumuYonet|geciciParolaYonet|yzAnahtariYonet)\s*\(/.test(p)) continue;
    firmaEylemi++;
    /* 2026-10-16 (FV10): Firma aç iki yollu (ortak / kendi proje) — işlemi döndüren HER return sarılı olmalı (biri sarılı diye öteki kaçmasın) */
    if (!/\breturn (?:unut|yenileyerek)\(await islem\(/.test(p) || /\breturn\s+(?!unut\(|yenileyerek\()[^;\n]*\bawait islem\(/.test(p)) e.push(`${ad} önbelleği boşaltmıyor`);
  }
  if (firmaEylemi < 6) e.push(`firma eylemi ${firmaEylemi} (en az 6 bekleniyor)`);
  /* FV10: kendi projeli firmanın kurulumu bitince firma çözülür olur — olumsuz önbellek (5 sn) boşalmalı */
  if (!/if \(g\.durum === "tamam"\) \{ firmaKayitlariniUnut\(\); refresh\(\); \}/.test(k)) e.push("kurulum bitince önbellek boşalmıyor");
  return e;
}

/** ayrılmış alt alan adı listesi göçlerde birden çok işlevde (0050 yonetim_firma_ac, 0096 yonetim_firma_kayit_ac): her biri uygulamanın listesiyle
    (src/modules/yonetim/sema.ts AYRILMIS) aynı olmalı. `bulunan`: listeyi taşıyan göçler (sırayla), `farklar`: "<göç>: <liste>". FIRMA-VT FV2 incelemesi
    (2026-10-15): kilit yalnız 0050'nin kopyasına bakıyordu, 0096'daki üçüncü kopya kayabilirdi. */
export function ayrilmisAdListeleri(gocler: readonly { ad: string; metin: string }[], beklenen: readonly string[]): { bulunan: string[]; farklar: string[] } {
  const bulunan: string[] = [], farklar: string[] = [];
  for (const g of gocler) {
    for (const m of g.metin.matchAll(/p_kisa_ad = ANY \(ARRAY\[([^\]]+)\]\)/g)) {
      bulunan.push(g.ad);
      const liste = m[1]!.split(",").map((x) => x.trim().replace(/^'|'$/g, ""));
      if (liste.join(",") !== beklenen.join(",")) farklar.push(`${g.ad}: ${liste.join(",")}`);
    }
  }
  return { bulunan, farklar };
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
  /* 2026-10-25: Denetim üç işte (tip · test · negatif) — biri matristen düşerse o denetim hiç koşmaz, koşu yine yeşil görünür */
  const isler = /\bis:\s*\[([^\]]*)\]/.exec(ciYml)?.[1].split(",").map((x) => x.trim()) ?? [];
  for (const [is, satir] of [["tip", "run: npm run check"], ["tip", "run: npm run lint"], ["test", "run: npm test"], ["negatif", "run: npm run test:negatif"]] as const) {
    if (!isler.includes(is) || !ciYml.includes(satir)) eksik.push(`CI'da ${satir.slice(5)} yok`);
  }
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
  /* 468: site taraması parçalardan çıkarılınca kendi işi olmalı — yoksa tarama hiç koşmaz, koşu yine yeşil görünür */
  if (ciYml.includes("'haric'") && !/\bparca:\s*\[[^\]]*\btarama\b/.test(ciYml)) eksik.push("CI'da site taraması parçalardan çıkarılmış ama kendi işi yok");
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

/* ── ÇERÇEVE İZNİ (472) ── kurucunun saha ekranı önizlemesi kendi sayfamızın çerçevesinde açılır: gömme izni (frame-ancestors 'self' +
   SAMEORIGIN) YALNIZ /ekipman-turleri/<tür>/sablon/<sürüm>/saha yolunda; öteki her yol 'none' + DENY (tıklama hırsızlığı yok). Çerçeve sayfası
   oturum ve modül kapısını kendisi denetler. */
export function cerceveIzniEksikleri(proxy: string, sayfa: string): string[] {
  const eksik: string[] = [];
  const kaynak = /const CERCEVE_YOLU = \/(.+)\/;\n/.exec(proxy)?.[1];
  let yol: RegExp | null = null;
  try { yol = kaynak ? new RegExp(kaynak) : null; } catch { /* aşağıda */ }
  if (!yol) eksik.push("CERCEVE_YOLU okunamadı");
  else {
    if (!yol.test("/ekipman-turleri/a/sablon/b/saha")) eksik.push("saha önizlemesi gömülemiyor");
    for (const y of ["/ekipman-turleri/a/sablon/b/kurucu", "/ekipman-turleri/a/sablon/b", "/ekipman-turleri/a/sablon/b/saha/c", "/planlar", "/giris", "/x/ekipman-turleri/a/sablon/b/saha"]) {
      if (yol.test(y)) eksik.push(`gömme izni fazla geniş: ${y}`);
    }
  }
  if (!proxy.includes("const cerceve = !yasak && CERCEVE_YOLU.test(yol);")) eksik.push("çerçeve yolu denetimi yok");
  if (!proxy.includes("`frame-ancestors ${cerceve ? \"'self'\" : \"'none'\"}`,") || /"frame-ancestors 'self'"/.test(proxy)) eksik.push("frame-ancestors koşulsuz");
  if (!proxy.includes(`yanit.headers.set("X-Frame-Options", cerceve ? "SAMEORIGIN" : "DENY");`)) eksik.push("X-Frame-Options koşulsuz");
  if (!/const MODUL = modulBul\("ekipman-turleri"\)!/.test(sayfa) || !/await modulOturumu\(MODUL\.no\)[\s\S]*if \(!o\) return <Yetkisiz \/>/.test(sayfa)) eksik.push("çerçeve sayfasında modül kapısı yok");
  return eksik;
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

/* ── VH YÜKSEKLİK (421; 419'un hata sınıfı) ── `height` / `max-height` vh ile verilmişse aynı blokta ARDINDAN aynı özellik dvh ile gelmeli: telefonda
   vh adres çubuğu gizliyken boydur, çubuk görünürken kutunun altı (son menü maddesi, levhanın tuşları) ekran dışında kalır. min-height serbest
   (taşan içerik kaydırılır). Dönen: "dosya: seçici özellik: değer" listesi. */
export function vhYukseklikHatalari(dosyalarCss: readonly { ad: string; metin: string }[]): string[] {
  const hatalar: string[] = [];
  for (const d of dosyalarCss) {
    for (const blok of d.metin.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const bildirimler = [...blok[2].matchAll(/(?:^|[;{\s])((?:max-)?height)\s*:\s*([^;]+)/g)].map((m) => ({ ozellik: m[1], deger: m[2].trim() }));
      bildirimler.forEach((b, i) => {
        if (!/\d(?:\.\d+)?vh\b/.test(b.deger)) return;
        if (bildirimler.slice(i + 1).some((s) => s.ozellik === b.ozellik && /dvh\b/.test(s.deger))) return;
        hatalar.push(`${d.ad}: ${blok[1].trim()} ${b.ozellik}: ${b.deger}`);
      });
    }
  }
  return hatalar;
}

/* ── YAPIŞKAN ÜST (2026-10-12; reisim: "parça olarak kaydet yukarda kaldı … takip etsin sayfayı") ── sayfa pencereyle kayar, üst çubuk (kabuk .ust,
   --ust-y yüksekliğinde) yapışkan ve öndedir: sayfayı izleyen kutunun `top`'u çubuğu hesaba katmazsa kutunun tepesi çubuğun altında kalır (Onaylar ›
   Talepler ayrıntısı, Saha ekranının kullanım kutusu 12px'teydi). Kural: kabuk dışındaki her `position: sticky` + `top` bloğunda top var(--ust-y) içerir.
   İstisna: tablo başlığı (`th`) — kendi kaydırma kutusunun tepesine yapışır, sayfaya değil. Dönen: "dosya: seçici top: değer" listesi. */
export function yapiskanUstHatalari(dosyalarCss: readonly { ad: string; metin: string }[]): string[] {
  const hatalar: string[] = [];
  for (const d of dosyalarCss) {
    if (d.ad.replace(/\\/g, "/").includes("src/components/kabuk/")) continue;
    for (const blok of d.metin.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(?:^|[;\s])position\s*:\s*sticky\b/.test(blok[2])) continue;
      const top = /(?:^|[;\s])top\s*:\s*([^;]+)/.exec(blok[2]);
      if (!top) continue;
      const secici = blok[1].trim();
      if (secici.split(",").every((s) => /\bth$/.test(s.trim()))) continue;
      if (!/var\(--ust-y\)/.test(top[1])) hatalar.push(`${d.ad}: ${secici} top: ${top[1].trim()}`);
    }
  }
  return hatalar;
}

/** 481: süzgeçsiz <Liste> izni — dosya (src/'ye göre) → sayı ve gerekçe (sayfanın ana listesi değil: özet, rapor tablosu, kartın bölümü, pencere) */
export const SUZGECSIZ_BOLUMLER_GEREKCE: Record<string, [number, string]> = {
  "modules/anasayfa/ui/AnaSayfa.tsx": [3, "Ana sayfa özet listeleri (ilk 5; tamamı modülün süzgeçli listesinde)"],
  "modules/araclar/ui/AracListesi.tsx": [2, "araç kartının bölümleri: haftalık kilometre geçmişi, aracın tutanakları"],
  "modules/egitimler/ui/EgitimListesi.tsx": [1, "kayıt penceresinde kaydın geçmişi"],
  "modules/firma-ayarlari/ui/FirmaAyarlari.tsx": [2, "Yapay zekâ bölümündeki aylık kullanım tablosu; E-posta bölümündeki çalışanların e-postası nereden gider tablosu (536)"],
  "modules/muhasebe/ui/Giderler.tsx": [1, "iş kartındaki işin giderleri bölümü"],
  "modules/muhasebe/ui/Karlilik.tsx": [3, "gelir-gider rapor tabloları (dönem seçicisiyle)"],
  "modules/performans/ui/Performans.tsx": [1, "kişi sayfasının günlük iş bölümü (dönem seçicisiyle)"],
  "modules/personel/ui/RolYetkileri.tsx": [1, "rol × modül yetki tablosu (liste değil, matris)"],
};
export const SUZGECSIZ_BOLUMLER: Readonly<Record<string, number>> = Object.fromEntries(Object.entries(SUZGECSIZ_BOLUMLER_GEREKCE).map(([k, [n]]) => [k, n]));

/** 481 (kalıp 14–15): sayfa başlığı (SayfaBasi) çizen bileşende süzgeçsiz <Liste> — yalnız gerekçeli bölümlerde, en çok izin verilen sayıda.
    dosya adı src/'ye göre ("modules/…/X.tsx"); bulgu: izinsiz dosya, sayısı artan dosya, artık listesi olmayan izin satırı */
export function suzgecsizListeler(tsx: readonly { ad: string; metin: string }[], izin: Readonly<Record<string, number>>): string[] {
  const bulunan = new Map<string, number>();
  for (const d of tsx) {
    if (!d.metin.includes("<SayfaBasi")) continue;
    const n = (d.metin.match(/<Liste\b/g) ?? []).length;
    if (n) bulunan.set(d.ad.replace(/^src\//, ""), n);
  }
  const hata: string[] = [];
  for (const [ad, n] of bulunan) {
    if (!(ad in izin)) hata.push(`${ad}: sayfa başlıklı bileşende süzgeçsiz <Liste> (${n})`);
    else if (n > izin[ad]) hata.push(`${ad}: süzgeçsiz liste sayısı arttı (${izin[ad]} → ${n})`);
  }
  for (const ad of Object.keys(izin)) if (!bulunan.has(ad)) hata.push(`${ad}: artık süzgeçsiz liste yok — izinden çıkar`);
  return hata;
}

/** 480: yan menü sayısının sebebi — sayfa başlığı şeridi çizer, kabuk sayıları bağlamla verir, her balon sebepli kurulur */
export function takipSeridiEksikleri(sayfa: string, kabuk: string, takip: string): string[] {
  const hata: string[] = [];
  if (!/export function SayfaBasi[\s\S]{0,400}<TakipSeridi \/>/.test(sayfa)) hata.push("SayfaBasi şeridi çizmiyor");
  if (!/<TakipBaglami\.Provider value=\{balon\}>\{children\}<\/TakipBaglami\.Provider>/.test(kabuk)) hata.push("kabuk sayıları bağlamla vermiyor");
  const sebepli = [...takip.matchAll(/\bkoy\(\d+, \{/g)].length, hepsi = [...takip.matchAll(/\bkoy\(/g)].length;
  if (sebepli !== hepsi) hata.push(`sebepsiz balon: ${hepsi - sebepli}`);
  if (sebepli < 9) hata.push(`balonlu modül sayısı düştü: ${sebepli}`);
  return hata;
}

/** 486: yüzen katmanın (seçim listesi, takvim, saat önerileri — üst katman) biçemi YALNIZ kendi dosyasında. Başka CSS'te listbox / popover /
    seçim kabına (data-secim-kap) inen seçici katmanı akışa alabilir (452 öncesinden kalan "position: static" ezmesi Tip listesini sayfanın başına
    atıyordu). Kendi dosyasında .liste / .takvim konumu yalnız fixed. Dönen: "dosya: seçici" listesi. */
export function yuzenEzmeleri(dosyalarCss: readonly { ad: string; metin: string }[], kendi = "src/components/secim/Secim.module.css"): string[] {
  const hata: string[] = [];
  for (const d of dosyalarCss) {
    for (const blok of d.metin.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const secici = blok[1].trim().replace(/\s+/g, " ");
      if (d.ad === kendi) {
        const konum = /(?:^|[;\s])position\s*:\s*([a-z-]+)/.exec(blok[2])?.[1];
        if (konum && konum !== "fixed" && /\.(liste|takvim)\b/.test(secici)) hata.push(`${d.ad}: ${secici} (position: ${konum})`);
        continue;
      }
      if (/role=["']?listbox|\[popover|:popover-open|data-secim-kap/.test(secici)) hata.push(`${d.ad}: ${secici}`);
    }
  }
  return hata;
}

/** 486: yönlendirme + tazeleme yarışı — istemcide router.push'un hemen ardından router.refresh() bekleyen yönlendirmeyi iptal edebilir (deneme
    makinesinde telefon: standart yüklendi, sayfa listede kaldı). Tazeleme sunucu eyleminde (next/cache refresh — 377 / 381 deseni). Dönen:
    "dosya: satır" listesi. "else router.refresh()" (ya biri ya öteki) serbest. */
export function yonlendirmeYarislari(tsx: readonly { ad: string; metin: string }[]): string[] {
  const hata: string[] = [];
  for (const d of tsx) {
    for (const m of d.metin.matchAll(/router\.push\((?:[^;()]|\([^;()]*\))*\);?[ \t]*(?:\/\/[^\n]*)?\s*router\.refresh\(\)/g)) {
      hata.push(`${d.ad}: ${d.metin.slice(0, m.index).split("\n").length}`);
    }
  }
  return hata;
}

/** 489 (hata listesi 43 kararı): uçtan uca yayın derlemesinde iki gevşetme — YALNIZ PROBATA_E2E_YAYIN=1 ve YALNIZ yerel adreste (*.localhost /
    127.0.0.1): ara katmanda "upgrade-insecure-requests" yazılmaz, geliştirme vitrini açılır. Bayrak başka hiçbir dosyada okunmaz, Vercel ayarında
    yok. Dönen: bulgu listesi. */
export function e2eYayinBayragiEksikleri(p: { proxy: string; vitrinAcik: string; duzen: string; vercel: string; kaynaklar: readonly { ad: string; metin: string }[] }): string[] {
  const hata: string[] = [];
  const YEREL = String.raw`/(^|\.)localhost$|^127\.0\.0\.1$/`;
  if (!p.proxy.includes(`const yerelDeneme = process.env.PROBATA_E2E_YAYIN === "1" && ${YEREL}.test(istek.nextUrl.hostname);`)) hata.push("ara katman: bayrak yerel adresle sınırlı değil");
  if (!p.proxy.includes(`...(gelistirme || yerelDeneme ? [] : ["upgrade-insecure-requests"]),`)) hata.push("ara katman: upgrade-insecure-requests kuralı değişmiş");
  if (!p.vitrinAcik.includes(`if (process.env.NODE_ENV !== "production") return true;`) || !p.vitrinAcik.includes(`if (process.env.PROBATA_E2E_YAYIN !== "1") return false;`)
    || !p.vitrinAcik.includes(`return ${YEREL}.test(alan);`)) hata.push("vitrin kapısı: yayında kapalı / yalnız yerel adreste açık değil");
  if (!/if \(!\(await vitrinAcik\(\)\)\) notFound\(\);/.test(p.duzen)) hata.push("geliştirme düzeni kapıyı beklemiyor");
  if (p.vercel.includes("PROBATA_E2E_YAYIN")) hata.push("Vercel ayarında deneme bayrağı");
  const izinli = new Set(["src/proxy.ts", "src/app/(gelistirme)/vitrin-acik.ts"]);
  for (const d of p.kaynaklar) if (!izinli.has(d.ad) && d.metin.includes("PROBATA_E2E_YAYIN")) hata.push(`bayrak başka yerde okunuyor: ${d.ad}`);
  return hata;
}

/** FIRMA-VT FV4 (2026-10-15): YAYIN KAPISI — Vercel derleme komutu ÖNCE göç dağıtıcıyı koşar, "--zorunlu" (veritabanı ayarı derlemeye gelmezse
    "atlandı" değil 1 — VERCEL sistem değişkenine dayanmaz) ve "&&" ile (kapı 1 dönerse derleme koşmaz, yayın olmaz); kip vercel.json'a yazılmaz
    (ortam değişkeni PROBATA_GOC_DAGIT — "uygula" FV8'de Vercel ortamından); yalnız main yayınlanır, gece işi zamanlaması yerinde (kapı eklenirken
    ikisi bozulmadı); derleme günlüğü ve kaynak herkese açılmaz (vercel.json "public" yok — günlükte sorunlu firmanın kısa adı yazılır). Betik
    mantığı ortam ve bağımsız değişkenlerle çağırır, çıkış kodunu süreç koduna verir. Dönen: bulgu listesi. Kilit tests/goc-dagit-saf.test.ts ·
    olumsuz kanıt tests/bozan/goc-dagit-saf.bozan.ts. */
export function yayinKapisiEksikleri(p: { vercel: string; betik: string }): string[] {
  const hata: string[] = [];
  let v: { buildCommand?: unknown; git?: { deploymentEnabled?: Record<string, unknown> }; crons?: unknown };
  try { v = JSON.parse(p.vercel) as typeof v; } catch { return ["vercel.json okunamadı"]; }
  if (v.buildCommand !== "node scripts/goc-dagit.ts --zorunlu && node scripts/next.ts build") hata.push("derleme komutu göç kapısından geçmiyor");
  const de = v.git?.deploymentEnabled ?? {};
  if (de.main !== true || de["kalem/*"] !== false || de["**"] !== false) hata.push("yalnız main yayınlanmıyor (git.deploymentEnabled)");
  if (JSON.stringify(v.crons) !== JSON.stringify([{ path: "/api/is/gece", schedule: "15 1 * * *" }])) hata.push("gece işi zamanlaması değişmiş");
  if (p.vercel.includes("PROBATA_GOC_DAGIT")) hata.push("göç kipi vercel.json'da (ortam değişkeni olmalı)");
  if (Object.hasOwn(v, "public")) hata.push("derleme günlüğü / kaynak herkese açık (vercel.json public)");
  const betik = yorumsuz(p.betik);
  if (!/const kod = await gocDagit\(\{ ortam: process\.env, arguman: process\.argv\.slice\(2\), yaz: \(s\) => console\.log\(s\) \}\);/.test(betik)) {
    hata.push("betik göç dağıtıcıyı ortamla çağırmıyor");
  }
  if (!/process\.exitCode = kod;/.test(betik) || !/setTimeout\(\(\) => process\.exit\(kod\), \d+\)\.unref\(\);/.test(betik)) hata.push("betik çıkış kodunu sürece vermiyor");
  if (/process\.exit(?:Code)?\s*(?:=\s*0|\(0\))/.test(betik)) hata.push("betik 0 ile çıkıyor");
  return hata;
}

/** FIRMA-VT FV4 (2026-10-15): göç dağıtıcının "denetle" kipi SALT OKUNUR ve doğru kapılardan geçer (src/server/db/goc-dagit.ts metni): merkez
    havuzunu (merkezHavuzu) kullanmaz — kendi kısa ömürlü havuzu, sorgu süre sınırlı; yazma SQL'i yok (firma_vt.son_goc denetlemede yazılmaz — FV8);
    merkez merkezOku'dan (READ ONLY + vt_merkez_dogrula), hedefler ve firmalar READ ONLY işlemde; firma kiraciIcinde'den (vt_firma_dogrula — yanlış
    veritabanının göçü karşılaştırılmaz). Davranış gerçek PostgreSQL'de tests/goc-dagit.test.ts. Aynı gün FV4 incelemesi: ortam TEK kaynak — modül
    process.env okumaz, ana anahtar yalnız verilen ortamdan (anaAnahtar'ın varsayılanı process.env; undefined geçilirse o devreye girerdi). Dönen:
    bulgu listesi. Olumsuz kanıt tests/bozan/goc-dagit-saf.bozan.ts. */
export function gocDagitEksikleri(metin: string): string[] {
  const k = yorumsuz(metin);
  const hata: string[] = [];
  if (/\bmerkezHavuzu\b/.test(k)) hata.push("merkez havuzunu kullanıyor");
  if (/\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/i.test(k)) hata.push("denetlemede yazıyor");
  if ((k.match(/await db\.sorgu\("SET TRANSACTION READ ONLY"\);/g) ?? []).length !== 2) hata.push("hedef / firma işlemi salt okunur değil");
  if (!/\bmerkezOku\(merkez, /.test(k)) hata.push("merkez merkezOku'dan okunmuyor");
  if (!/\bkiraciIcinde\(havuz, h\.firma_id, /.test(k)) hata.push("firma vt_firma_dogrula'dan (kiraciIcinde) geçmiyor");
  if (!/query_timeout: GOC_DAGIT\.sorguMs/.test(k)) hata.push("sorgu süre sınırı yok");
  if (/\bprocess\.env\b/.test(k) || (k.match(/\banaAnahtar\(/g) ?? []).length !== 1 || !/\banaAnahtar\(e\.PROBATA_SIR_ANAHTARI \?\? ""\)/.test(k)) {
    hata.push("ortam tek kaynak değil (process.env ya da ana anahtarın varsayılanı)");
  }
  return hata;
}

/** FIRMA-VT FV7 (2026-10-15): SAĞLIK HER PROJEDE — uçların ve çekirdeğin kapıları (metinden; davranış tests/saglik-coklu*.test.ts):
    · /api/saglik (ucu): kiracı YALNIZ istekKiracisi'nden (Host) — istek nesnesi, başlık, çerez, sorgu okunmaz; çekirdeğe istekKiracisi verilir; yalnız
      GET; 503 / no-store;
    · /api/saglik/projeler (projeler): ilk iş zamanliYetkili — PROBATA_SAGLIK_SIR (duman testi; yalnız bu uç) ya da CRON_SECRET (zamanlayıcı), değilse
      401 (2026-10-15 FV7 incelemesi, en az yetki: önce yalnız CRON_SECRET — duman makinesindeki sır gece işlerini de açıyordu); yanıt YALNIZ {toplam,
      tamam, sorunlu} (öteki yanıtlar sabit metinli hata); yalnız GET; maxDuration 60 DEĞİL (PDF uçlarının Chromium paketli işlev grubuna girmesin — 352);
    · çekirdek (src/server/saglik.ts): firma denetimi kiracının havuzuyla (a.havuz(k) → yayında kiraciHavuzu), tek uçuşta ve süre sınırı tek uçuşun
      DIŞINDA (sureli(tekUcus(…)) — süresi dolan iş arkada sürerken yeni bağlantı açılmaz); merkez denetimi de öyle; yayında firma sonucu önbellekte
      (saglik() onbellek: firmaSonuclari — sağlam / sorunlu süreleri SAGLIK'ten); kısa ad (kisaAd / kisa_ad) ve hata iletisi (.message) hiç geçmez —
      ne yanıta ne son_saglik'e ne günlüğe; firmadan gelen göç bilgisi gocBilgisi'nden (biçim denetimi) geçer; kurulumu bitmemiş proje yoklanmaz;
      merkez okuma / yazma süre sınırlı (sureli … merkezMs); süresi dolan projenin arkadaki işi beklenir (bitmesiniBekle); sonuç sonSaglikYaz ile;
    · veritabanı (src/server/db/saglik.ts): firma kiraciIcinde'den (vt_firma_dogrula), SALT OKUNUR, sunucuda süre sınırlı; hedefler merkezOku'dan
      (vt_merkez_dogrula); hedef okuma ve yazma da sunucuda süre sınırlı (statement_timeout — üç yerde); yazma YALNIZ firma_vt.son_saglik /
      son_saglik_zaman (tek UPDATE, ekleme / silme yok).
    Dönen: bulgu listesi. Kilit tests/saglik-coklu-saf.test.ts · olumsuz kanıt tests/bozan/saglik-coklu-saf.bozan.ts. */
export function saglikUcuEksikleri(p: { ucu: string; projeler: string; cekirdek: string; vt: string }): string[] {
  const hata: string[] = [];
  const u = yorumsuz(p.ucu), pr = yorumsuz(p.projeler), c = yorumsuz(p.cekirdek), v = yorumsuz(p.vt);
  const yalnizGet = (m: string) => /export (async )?function GET\b/.test(m) && !/export (async )?function (POST|PUT|PATCH|DELETE)\b/.test(m);

  if (!/import \{ istekKiracisi \} from "\.\.\/\.\.\/\.\.\/server\/kiraci\/istek";/.test(u)) hata.push("sağlık ucu kiracıyı istekKiracisi'nden almıyor");
  if (!/export async function GET\(\) \{\n {2}const s = await saglik\(istekKiracisi\);/.test(u)) hata.push("sağlık ucu çekirdeği isteğin kiracısıyla çağırmıyor (ya da isteği okuyor)");
  if (/\b(headers|cookies)\s*\(|searchParams|nextUrl|\brequest\b/.test(u)) hata.push("sağlık ucu isteği / başlığı okuyor (kiracı yalnız Host'tan)");
  if (!/status: s\.durum === "tamam" \? 200 : 503, headers: \{ "Cache-Control": "no-store" \}/.test(u)) hata.push("sağlık ucu 503 / no-store değil");
  if (!yalnizGet(u)) hata.push("sağlık ucu yalnız GET değil");

  const govde = pr.slice(pr.indexOf("export async function GET"));
  if (!/^export async function GET\(istek: Request\) \{\n {2}const yetki = istek\.headers\.get\("authorization"\);\n {2}if \(!zamanliYetkili\(yetki, process\.env\.PROBATA_SAGLIK_SIR\) && !zamanliYetkili\(yetki, process\.env\.CRON_SECRET\)\) \{\n {4}return Response\.json\(\{ hata: "Yetkisiz\." \}, \{ status: 401/.test(govde)) {
    hata.push("proje sağlığı ucunun ilk işi zamanliYetkili değil");
  }
  if ((pr.match(/process\.env\.\w+/g) ?? []).sort().join(" ") !== "process.env.CRON_SECRET process.env.PROBATA_SAGLIK_SIR") hata.push("proje sağlığı ucu başka bir ortam sırrını okuyor");
  const yanitlar = [...pr.matchAll(/Response\.json\((\{[^}]*\})/g)].map((m) => m[1]!);
  const veri = yanitlar.filter((y) => !/^\{ hata: "[^"$`]+" \}$/.test(y));
  if (veri.length !== 1 || veri[0] !== "{ toplam: o.toplam, tamam: o.tamam, sorunlu: o.sorunlu }") hata.push("proje sağlığı yanıtı yalnız {toplam, tamam, sorunlu} değil");
  if (/\.\.\.\s*o\b/.test(pr)) hata.push("proje sağlığı yanıtı sonucu yayıyor");
  if (!yalnizGet(pr)) hata.push("proje sağlığı ucu yalnız GET değil");
  if (/export const maxDuration = 60;/.test(pr)) hata.push("proje sağlığı ucu PDF işlev grubunda (maxDuration 60)");
  if (!/"Cache-Control": "no-store"/.test(pr)) hata.push("proje sağlığı ucu no-store değil");

  if (!/const havuz = a\.havuz\(k\);/.test(c) || !/await sureli\(tekUcus\(havuz, `firma:\$\{firmaId\}`, \(\) => firmaSaglikOku\(havuz, firmaId, ms\)\), ms\);/.test(c)) {
    hata.push("firma denetimi kiracının havuzunda / tek uçuşta / süre sınırı tek uçuşun dışında değil");
  }
  if (!/await sureli\(tekUcus\(m, "merkez", \(\) => saglikOku\(m\)\), a\.merkezMs \?\? SAGLIK\.merkezMs\);/.test(c)) hata.push("merkez denetimi tek uçuşta / süre sınırlı değil");
  if (!/saglikDenetle\(\{ merkez: merkezHavuzu, kiraciBul, havuz: kiraciHavuzu, onbellek: firmaSonuclari \}\)/.test(c)) hata.push("yayında firma havuzu kiraciHavuzu değil ya da firma sonucu önbellekte değil");
  if (!/const firmaSonuclari = kayitOnbellegiKur<true>\(\{ olumluSn: SAGLIK\.olumluSn, olumsuzSn: SAGLIK\.olumsuzSn \}\);/.test(c)) hata.push("firma sonucunun önbellek süreleri SAGLIK'ten değil");
  if (!/goc: gocBilgisi\(y\.veri\)/.test(c)) hata.push("firmadan gelen göç bilgisi denetimsiz yazılıyor");
  if (!/await sureli\(projeHedefleri\(a\.merkez, merkezMs\), merkezMs\)/.test(c)) hata.push("hedeflerin okunması süre sınırlı değil");
  if (!/await bitmesiniBekle\(is, bitis - Date\.now\(\)\);/.test(c)) hata.push("süresi dolan projenin arkadaki işi beklenmiyor (eşzamanlılık sınırı aşılır)");
  if (/\bkisa_?[aA]d\b/.test(c)) hata.push("çekirdek kısa adı taşıyor (yanıt / son_saglik / günlük firma adı içermez)");
  if (/\.message\b/.test(c)) hata.push("çekirdek hata iletisini yazıyor (yalnız sınıflanmış neden)");
  if (!/\.filter\(\(h\) => h\.kurulumTamam\)/.test(c)) hata.push("kurulumu bitmemiş proje yoklanıyor");
  if (!/await sureli\(sonSaglikYaz\(a\.merkez, /.test(c)) hata.push("yoklama sonucu merkeze yazılmıyor (ya da yazma süre sınırsız)");

  if (!/return kiraciIcinde\(havuz, firmaId, async \(db\) => \{\n {4}await db\.sorgu\("SET TRANSACTION READ ONLY"\);\n {4}await db\.sorgu\("SELECT set_config\('statement_timeout', \$1, true\)"/.test(v)) {
    hata.push("firma veritabanı kiraciIcinde'den / salt okunur / süre sınırlı okunmuyor");
  }
  if (!/await merkezOku\(merkez, /.test(v)) hata.push("hedefler merkezOku'dan (vt_merkez_dogrula) okunmuyor");
  if ((v.match(/await db\.sorgu\("SELECT set_config\('statement_timeout', \$1, true\)", \[sureMetni\(sureMs\)\]\);/g) ?? []).length !== 3) {
    hata.push("firma okuma / hedef okuma / yazma sunucuda süre sınırlı değil");
  }
  const yazmalar = v.match(/\bINSERT\s+INTO\b|\bUPDATE\s+\w+(?:\s+\w+)?\s+SET\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/gi) ?? [];
  if (yazmalar.length !== 1 || !/UPDATE firma_vt v SET son_saglik = x\.s, son_saglik_zaman = now\(\)\n\s+FROM jsonb_to_recordset/.test(v)) {
    hata.push("veritabanı katmanı son_saglik / son_saglik_zaman dışında yazıyor");
  }
  return hata;
}

/** FIRMA-VT FV7 (2026-10-15, FV7 incelemesi): src/app/api/saglik altında YALNIZ iki dosya — oturumsuz sağlık ucu ve sırlı proje sağlığı ucu. Liste
    klasörün HER düzeyinden (dosyalar() özyinelemeli): daha derine eklenen bir uç (ör. projeler/<x>/route.ts) da yakalanır — önce yalnız ilk düzeydeki
    klasörlere bakılıyordu. Dönen: bulgu listesi. Kilit tests/saglik-coklu-saf.test.ts · olumsuz kanıt tests/bozan/saglik-coklu-saf.bozan.ts. */
export const SAGLIK_UC_DOSYALARI: readonly string[] = ["src/app/api/saglik/projeler/route.ts", "src/app/api/saglik/route.ts"];
export function saglikKlasoruEksikleri(liste: readonly string[]): string[] {
  return [
    ...liste.filter((d) => !SAGLIK_UC_DOSYALARI.includes(d)).map((d) => `sağlık klasöründe izinsiz dosya: ${d}`),
    ...SAGLIK_UC_DOSYALARI.filter((d) => !liste.includes(d)).map((d) => `sağlık ucu yok: ${d}`),
  ];
}


/** 527 / 531 (reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun" · "araçlar ve
    zimmetlerde de galeriden fotoğraf ekleme seçeneği ekle"): telefonda YALNIZ kamera açan girdi kalmaz. Kamera açan dosya girdisi (capture) yalnız iki
    yerde: ortak fotoğraf tuşu (components/foto/FotoTusu.tsx — kamera + galeri) ve S.A.Y ataç menüsü (Fotoğraf çek · Galeriden seç · Belge). FotoTusu'nda
    iki girdi: kamera (capture) ve galeri / bilgisayar (capture YOK, çoklu seçilebilir). kullananlar: dosya → en az kaç FotoTusu (S.A.Y Chat 4, araç
    teslim tutanağı 1, zimmet teslimi 1); onlarda doğrudan resim girdisi yok. Dönen: hata listesi (boş = tamam). */
/** fotoğraf tuşunu kullananlar: dosya → en az kaç FotoTusu */
export const FOTO_TUSU_KULLANANLAR: Readonly<Record<string, number>> = {
  "src/modules/say-chat/ui/SayChat.tsx": 4,
  "src/modules/araclar/ui/Pencereler.tsx": 1,
  "src/modules/zimmetler/ui/Pencereler.tsx": 1,
};
export function fotoTuslari(kaynaklar: readonly { ad: string; metin: string }[], fotoTusu: string, kullananlar: Readonly<Record<string, number>>): string[] {
  const hata: string[] = [];
  const izinli = new Set(["src/components/foto/FotoTusu.tsx", "src/modules/say/ui/SayAsistan.tsx"]);
  for (const d of kaynaklar) if (!izinli.has(d.ad) && /\bcapture=/.test(d.metin)) hata.push(`${d.ad}: kamera açan tek girdi (capture) — FotoTusu kullanılmalı`);
  for (const [ad, en] of Object.entries(kullananlar)) {
    const d = kaynaklar.find((x) => x.ad === ad);
    if (!d) { hata.push(`${ad}: dosya yok`); continue; }
    const n = (d.metin.match(/<FotoTusu\b/g) ?? []).length;
    if (n < en) hata.push(`${ad}: ${n} FotoTusu (en az ${en})`);
    if (/<input\b[^>]*type="file"[^>]*accept="image/.test(d.metin)) hata.push(`${ad}: doğrudan resim girdisi var (fotoğraf tuşu FotoTusu olmalı)`);
  }
  const girdiler = [...fotoTusu.matchAll(/<input\b[^>]*type="file"[^>]*>/g)].map((m) => m[0]);
  if (girdiler.length !== 2) hata.push(`FotoTusu.tsx: ${girdiler.length} dosya girdisi (kamera + galeri = 2)`);
  if (!girdiler.some((g) => /\bcapture=/.test(g))) hata.push("FotoTusu.tsx: kamera girdisi (capture) yok");
  const galeri = girdiler.filter((g) => !/\bcapture=/.test(g));
  if (!galeri.length) hata.push("FotoTusu.tsx: galeri / bilgisayar girdisi (capture'sız) yok");
  else if (!galeri.some((g) => /\bmultiple=\{coklu\}/.test(g))) hata.push("FotoTusu.tsx: galeri girdisi birden çok fotoğraf seçemiyor");
  if (!fotoTusu.includes("Galeriden / bilgisayardan seç")) hata.push("FotoTusu.tsx: \"Galeriden / bilgisayardan seç\" yazmıyor");
  return hata;
}

/* ── S.A.Y İŞLEM YÜRÜTÜCÜSÜNÜN ÇAĞRI YERİ (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a, B — "sunucu araçları istemciden gelen bilgiye
   güvenmez") ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   2026-10-23 (S.A.Y baştan — reisim: "direk claude da haiku nasıl çalışıyor ise direk o şekilde"): döngü src/modules/say/server/dongu.ts'te (eski
   eylemler.ts surdur); özellikler AYNI. Kilit kaynak metninden: yürütücü TEK yerden, yalnız yapay zekâ hizmetinin BU cevabındaki araç çağrılarıyla
   (ekranın getirdiği sonuçlar yürütücüden geçmez); işlemin ortamı oturumdan (ekranın ya da yapay zekânın girdisinden değil); aynı cevapta ekran
   aracından sonraki işlem ekranın işini bekler; hazırlık (server/say.ts) yürütücüye dokunmaz. Dönen: bulgular (boş = tamam). Olumsuz kanıt:
   tests/bozan/say-islem.bozan.ts. */
export function sayEylemDenetimi(dongu: string, sunucu: string): string[] {
  const b: string[] = [];
  const n = [...dongu.matchAll(/sunucuKomutu\(/g)].length;
  if (n !== 1) b.push(`dongu.ts: yürütücü ${n} yerden çağrılıyor (tek yer olmalı)`);
  if (!dongu.includes("const komutlar = aracCagrilari(icerik);")) b.push("dongu.ts: komutlar yapay zekâ hizmetinin bu çağrıdaki cevabından değil");
  if (!/for \(const c of komutlar\) \{[\s\S]{0,1200}?await sunucuKomutu\(ISLEM_KATALOGU, ortam, k, modulAdi\)/.test(dongu)) {
    b.push("dongu.ts: yürütücü yalnız bu çağrının komutlarıyla çağrılmıyor (ekranın sonuçları yeniden çalışabilir)");
  }
  if (/sunucuKomutu\([^)]*(sonuclar|ham|govde)/.test(dongu) || /islemYurut\(/.test(dongu)) b.push("dongu.ts: yürütücü başka yoldan / ekranın sonuçlarıyla çağrılıyor");
  const ortam = /function islemOrtami\([^]*?\n\}\n/.exec(dongu)?.[0] ?? "";
  if (!ortam) b.push("dongu.ts: islemOrtami yok");
  else {
    if (!ortam.includes("kim: o, firmaId: o.kiraci.firmaId, depo, kok: firmaAdresi(o.kiraci.kisaAd),")) b.push("dongu.ts: işlemin kişisi / firması oturumdan değil");
    if (/\bham\b|\bv\.|\bsonuclar\b|\bgirdi\b/.test(ortam)) b.push("dongu.ts: işlemin ortamı ekranın / yapay zekânın girdisinden okunuyor");
  }
  if (!/if \(ekranda\) \{ sonuclar\[c\.id\] = sonucIcerigi\(islemOzeti\(/.test(dongu)) b.push("dongu.ts: ekran aracından sonraki işlem ekranın işini beklemiyor (sıra)");
  if (/sunucuKomutu\(|islemYurut\(|from "[^"]*(islem-katalogu|yz\/islem)/.test(sunucu)) b.push("server/say.ts: hazırlık yürütücüye dokunuyor");
  return b;
}

/* ── S.A.Y İŞLEMLERİNİN GİRDİSİ MODÜLÜN ŞEMASINDAN (2026-10-16; 2. adım a, A — "girdi şeması modülün VAR OLAN zod şemasından; şema kopyalanmaz") ──
   Girdinin ÜST DÜZEY her alanı ya dışa açılmış bir modül şemasının (sema.ts, src/sema/ortak.ts, liste süzgeci) ağacındaki nesneyi içerir (kendisi
   ya da sarmaladığı — .partial(), .nullable(), .default(), z.array(kimlik) …), ya da aşağıdaki listede gerekçesiyle elle yazılmıştır (modül işlevi
   konumsal değer alır, şeması yok). Kopyalanmış alan (ör. MusteriGirdisi'nin alanları elle) listede değilse bulgu. */
type ZodDef = { _zod: { def: Record<string, unknown> } };
const zodMu = (x: unknown): x is ZodDef => !!x && typeof x === "object" && "_zod" in x;
/** zod şemasının ağacındaki bütün şema nesneleri (nesne alanları, sarmalayıcılar, boru, dizi, birleşim, kesişim, kayıt) */
export function zodAgaci(s: unknown, l = new Set<unknown>()): Set<unknown> {
  if (!zodMu(s) || l.has(s)) return l;
  l.add(s);
  const d = s._zod.def;
  if (d.shape && typeof d.shape === "object") for (const v of Object.values(d.shape as object)) zodAgaci(v, l);
  for (const k of ["innerType", "in", "out", "element", "left", "right", "valueType", "keyType"]) zodAgaci(d[k], l);
  for (const k of ["options", "items"]) if (Array.isArray(d[k])) for (const v of d[k] as unknown[]) zodAgaci(v, l);
  return l;
}
/** elle yazılan üst düzey alanlar: işlem → alan → gerekçe */
export const SAY_ELLE_ALANLAR: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  plan_kabul: { beyan_onay: "planKabul'un konumsal onayı (tuşta beyan onay kutusu)", beyan_ozet: "planKabul'un konumsal metni (plan_getir'deki beyan özeti)" },
  plan_ekipman_pasif: { pasif: "ekipmanPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  plan_kontrol_listesi: { tamam: "kontrolListesi'nin konumsal değeri (Tamamla / Yeniden aç)" },
  rapor_yaz: { girisler: "rapora_yaz aracının biçimi (komutDenetle aynı denetimden geçirir)", satir_ekle: "rapora_yaz'ın satir_ekle biçimi (komutDenetle)" },
  /* 2026-10-31 (kalem 3 — E4): ekranın "Fotoğraf ekle"sinde dosya tarayıcıdan gelir; S.A.Y'da konuşmanın F numarası ve formatın fotoğraf bölümü */
  /* 2026-10-31 (kalem 6): saat planı ve çok rapora yazma — S.A.Y'a özgü toplu işler (ekranda tek tek rapor saati / rapor girişi) */
  rapor_saat_plani: { gun: "planın kontrol günü (YYYY-AA-GG; saat-plani.ts denetler)", baslangic: "ilk raporun başlangıç saati (SS:DD)", ara_dk: "raporlar arası dakika" },
  raporlara_yaz: { girisler: "rapor_yaz'ın girisler biçimi (komutDenetle aynı denetimden geçirir), her rapora aynen" },
  /* 2026-10-31 (kalem 9 — M1 + M2): ekranın dosya seçicisinin yerine konuşmadaki ekin numarası (ekBelgesi — depodaki kopya) */
  personel_belge_ekle: { ne: "personel belge türü (ekrandaki sekme: özlük / atama / bordro / zimmet)", alanlar: "belge türünün alanları (modül şeması işlevde denetler)" },
  rapor_foto_ekle: { foto: "konuşmadaki fotoğrafın F numarası (ekin depodaki kopyası — fotoKopyasiOku)", bolum: "fotoEkle'nin hedef bölümü (formatın foto bölümü kimliği)" },
  musteri_kaydet: { onay: "musteriKaydet'in konumsal onayı (\"Yine de kaydet\")" },
  tesis_kaydet: { onay: "tesisKaydet'in konumsal onayı (\"Yine de kaydet\")" },
  /* 2026-10-16 (2. adım b) */
  musteri_pasif: { pasif: "musteriPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  tesis_pasif: { pasif: "tesisPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  teklif_musteri_kaydet: { onay: "teklifMusteriKaydet'in konumsal onayı (Müşteriler'in uyarısını görüp kaydet)" },
  cihaz_ara: { pasif: "liste süzgeci (ekrandaki Görünüm: Pasif)" },
  cihaz_konum: { konum: "cihazKonum'un konumsal değeri (Kalibrasyona gönder / Depoya al)" },
  cihaz_pasif: { pasif: "cihazPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  demirbas_pasif: { pasif: "demirbasPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  arac_ara: { pasif: "liste süzgeci (ekrandaki Görünüm: Pasif)" },
  arac_pasif: { pasif: "aracPasif'in konumsal değeri (Pasife al / Etkinleştir)" },
  standart_ara: { brans: "liste süzgeci (ekrandaki Mekanik / Elektrik sekmesi)" },
  tur_ara: { brans: "liste süzgeci (ekrandaki Mekanik / Elektrik sekmesi)" },
  uyari_ara: { gecmis: "liste süzgeci (yalnız süresi geçenler)" },
  /* 2026-10-31 (format parçası, S.A.Y Chat ayarı) */
  format_parcasi_kaydet: { bolum: "formatın bölümü (kimlik ya da ad — işlem tanımdan bulur)", ad: "parcaKaydet'in konumsal adı" },
  say_chat_ayar_kaydet: { tanim: "S.A.Y Chat tanımı (sayChatAyarKaydet sema.ts tanimDenetle ile formata göre denetler)" },
  /* 2026-10-31 (S.A.Y yükleme yuvaları) */
  firma_dosyasi_yukle: { ne: "ayarDosyasiYaz'ın konumsal dosya türü (AYAR_DOSYASI)" },
  ice_aktar_denetle: { dosya: "Girdi.dosya", satirlar: "Excel ekinin satırları (S.A.Y ekin metninden; Girdi.satirlar)" },
  ice_aktar: { dosya: "Girdi.dosya", satirlar: "Excel ekinin satırları (S.A.Y ekin metninden; Girdi.satirlar)" }, rapor_imzali_yukle: { teknik: "teknik yöneticinin yüklemesi (ekrandaki ayrı tuş)" },
  talep_belgesi_ekle: { tip: "konumsal tür (izin talebi / masraf formu)" },
  personel_belge_degistir: { ne: "ekranın sekmesi (özlük / atama)" }, personel_belge_kaldir: { ne: "ekranın sekmesi (özlük / atama / bordro / zimmet)" },
  talep_belge_doldur: { tip: "talepDoldur'un konumsal türü (izin talebi / masraf formu)" },
  talep_karar: { tip: "talepKarar'ın konumsal türü (izin talebi / masraf formu)", karar: "talepKarar'ın konumsal kararı (TALEP_KARARLARI: Onayla / Düzeltmeye geri / Reddet)" },
  sablondan_tur_ekle: { sablon: "sablondanTurEkle'nin konumsal şablon anahtarı (sablonBul denetler)" },
  format_taslak_duzenle: { islemler: "formati_duzenle aracının biçimi (say-kurucu.ts formatIslemleri her alanı denetler)" },
  /* 2026-10-31 (S.A.Y belge formatları) */
  belge_taslak_duzenle: { islemler: "formati_duzenle aracının biçimi (say-kurucu.ts formatIslemleri her alanı denetler)" },
  belge_taslak_ac: { kaynak: "belgeTaslakAc'ın konumsal başlangıcı (ekrandaki Boş / Yayındakinden)" },
  firma_ayari_kaydet: { kesim: "ayarKaydet'in konumsal bölüm adı (sır bölümü yok)", deger: "ayarKaydet'in bölüm değeri (bölümün şemasıyla ayarKaydet doğrular)" },
  performans_panosu: { donem: "performansPanosu'nun dönem seçimi (ekran süzgeci; donemCoz denetler)", brans: "performansPanosu'nun branş seçimi (ekran süzgeci)" },
  performans_kisi: { donem: "performansKisi'nin dönem seçimi (ekran süzgeci; donemCoz denetler)", brans: "performansKisi'nin branş seçimi (ekran süzgeci)" },
};
export function islemAlanlariDenetimi(islemler: readonly { ad: string; girdi: unknown }[], izinliSemalar: Iterable<unknown>,
  elle: Readonly<Record<string, Readonly<Record<string, string>>>>): string[] {
  const izinli = new Set<unknown>();
  for (const s of izinliSemalar) zodAgaci(s, izinli);
  const b: string[] = [];
  for (const t of islemler) {
    const shape = zodMu(t.girdi) && t.girdi._zod.def.shape && typeof t.girdi._zod.def.shape === "object" ? t.girdi._zod.def.shape as Record<string, unknown> : null;
    if (!shape) { b.push(`${t.ad}: girdi nesne şeması değil`); continue; }
    for (const [ad, alan] of Object.entries(shape)) {
      const turer = [...zodAgaci(alan)].some((x) => izinli.has(x));
      const gerekce = elle[t.ad]?.[ad];
      if (!turer && !gerekce) b.push(`${t.ad}.${ad}: modülün şemasından türemiyor (kopya?) ve elle alan listesinde yok`);
      if (turer && gerekce) b.push(`${t.ad}.${ad}: modülün şemasından türüyor — elle alan listesinden çıkmalı`);
    }
    for (const ad of Object.keys(elle[t.ad] ?? {})) if (!Object.hasOwn(shape, ad)) b.push(`${t.ad}.${ad}: elle alan listesinde ama girdide yok`);
  }
  return b;
}

/** 2026-10-17 İMZA ÜRETİMİ ÜRÜN KODUNDA YOK (reisim: "probatanın kaynak kodlarına bunları bulaştırma ileride probata ile bağ kurmamız gerekirse
    kurarız" — imza platformu ayrı proje probata-sign; probata'da yalnız yüklenen imzalı PDF'in okunması / denetimi, IMZA-SERVISI.md):
    · src/** hiçbir dosya tests/ altını içe aktarmaz (statik, yan etkili, dinamik, yeniden dışa açma, require; göreli ya da "@/") — testlerin imza
      verisi üreticisi (tests/yardimci/imza-uret/) ürüne giremez;
    · src/server/imza/** içinde imza ÜRETEN işlevlerin adları geçmez (yorum dahil) — CMS öznitelik kurucu (imzaliOznitelikler, damgaOzniteligi),
      yer tutucunun içerik yazıcısı (icerikYaz), artımlı ekin sözlük / akış yazıcıları (degerYaz, akisGovdesi) dahil;
    · artımlı ek yazıcısının adı genel ("ekle") — onu adıyla değil İZİYLE yakalarız: nesne, çapraz başvuru ve dosya sonu YAZIMI (okuyucu bunları
      yalnız arar, yazmaz; 2026-10-17 denetim bulgusu: eski kilit yazıcının geri gelişini görmüyordu);
    · src/server/imza/** AĞA ÇIKMAZ (2026-10-23 denetim bulgusu: kilit ağdan kanıt alan ya da istek kuran işlevi görmüyordu — iptal.ts'e
      `ocspIstegi` + fetch eklenince fail 0): probata-sign'ın ağ istemcilerinin adları (IMZA_AG_ADLARI — yorum dahil) ve ağ İZİ (yorumsuz metinde
      fetch, ağ modülü içe aktarması, XMLHttpRequest / WebSocket / EventSource) geçmez. Kanıtı ve damgayı ağdan almak imza üretiminin parçası;
    · tests/yardimci/imza-uret/** her dosya bu kuralı başında söyler.
    Dönen: bulgu listesi. Kilit tests/imza-ayrim.test.ts · olumsuz kanıt tests/bozan/imza-ayrim.bozan.ts. */
export const IMZA_URETEN_ADLAR = [
  "imzaHazirla", "imzaTamamla", "ltvEkle", "dssEkle", "belgeDamgasiEkle", "yerTutucuEkle", "imzaliVeriKur",
  "imzaliOznitelikler", "damgaOzniteligi", "icerikYaz", "degerYaz", "akisGovdesi",
] as const;
/** probata-sign'ın ağ istemcileri (2026-10-23 okundu: src/imza/iptal.ts ocspIstegi · iptalKaniti; zaman-damgasi.ts damgaIstegi · damgaCevabi ·
    damgaAl · damgaAgHatasi; kamusm.ts kimlikBasligi · kamusmDamgaAyari · kontorSor) — test verisi bunlara gerekmez, probata'da hiç yok.
    damgaAl ve iptalKaniti 2026-10-17'den beri IMZA_URETEN_ADLAR'daydı, buraya taşındı (yakalanmaları aynı, ileti "ağ istemcisi") */
export const IMZA_AG_ADLARI = [
  "ocspIstegi", "iptalKaniti", "damgaIstegi", "damgaCevabi", "damgaAl", "damgaAgHatasi", "kimlikBasligi", "kamusmDamgaAyari", "kontorSor",
] as const;
/** ağa çıkışın kaynaktaki izleri (yorumsuz metinde): fetch (çağrı, globalThis.fetch, varsayılan değer), ağ modülü içe aktarması (node: önekli ya da
    öneksiz http · https · http2 · net · tls · dns · dgram; undici · node-fetch · axios — statik, yan etkili, dinamik, require), tarayıcı ağ nesneleri */
export const IMZA_AG_IZLERI: readonly (readonly [string, RegExp])[] = [
  ["fetch", /\bfetch\b/],
  ["ağ modülü içe aktarması", /\b(?:from|import|require)\s*\(?\s*["'](?:node:)?(?:https?|http2|net|tls|dns|dgram|undici|node-fetch|axios)(?:\/[^"']*)?["']/],
  ["tarayıcı ağ nesnesi", /\b(?:XMLHttpRequest|WebSocket|EventSource)\b/],
];
/** PDF yazıcısının kaynaktaki izleri (yorumsuz metinde): "\nendobj\n" yazmak, boş xref girdisi "65535 f", "%%EOF\n" yazmak */
export const IMZA_YAZICI_IZLERI: readonly (readonly [string, RegExp])[] = [
  ["nesne yazımı (endobj)", /endobj\\n/],
  ["çapraz başvuru yazımı (65535 f)", /65535 f/],
  ["dosya sonu yazımı (%%EOF)", /%%EOF\\n/],
];
export const IMZA_URET_BASLIGI = "/* YALNIZ TEST VERİSİ ÜRETİR; ürün kodu bu klasörü import edemez — imza üretimi probata-sign'da";
export function imzaAyrimiEksikleri(metinler: readonly { ad: string; metin: string }[]): string[] {
  const hata: string[] = [];
  const kalip = /\b(?:from|import)\s*\(?\s*["']([^"']+)["']|\brequire\s*\(\s*["']([^"']+)["']/g;
  const adlar = new RegExp(`\\b(?:${IMZA_URETEN_ADLAR.join("|")})\\b`, "g");
  const agAdlari = new RegExp(`\\b(?:${IMZA_AG_ADLARI.join("|")})\\b`, "g");
  for (const { ad, metin } of metinler) {
    if (ad.startsWith("src/")) {
      for (const m of yorumsuz(metin).matchAll(kalip)) {
        const yol = iceAktarilan(ad, m[1] ?? m[2]!);
        if (yol !== null && posix.normalize(yol).startsWith("tests/")) hata.push(`${ad}: test klasörünü içe aktarıyor (${m[1] ?? m[2]})`);
      }
    }
    if (ad.startsWith("src/server/imza/")) {
      for (const a of new Set([...metin.matchAll(adlar)].map((m) => m[0]))) hata.push(`${ad}: imza üreten işlev (${a}) — imza üretimi probata-sign'da`);
      for (const a of new Set([...metin.matchAll(agAdlari)].map((m) => m[0]))) hata.push(`${ad}: ağ istemcisi (${a}) — kanıtı / damgayı ağdan almak probata-sign'da`);
      const kod = yorumsuz(metin);
      for (const [ne, iz] of IMZA_YAZICI_IZLERI) if (iz.test(kod)) hata.push(`${ad}: PDF yazıcısı izi (${ne}) — artımlı ek yazımı probata-sign'da`);
      for (const [ne, iz] of IMZA_AG_IZLERI) if (iz.test(kod)) hata.push(`${ad}: ağ izi (${ne}) — imza denetimi ağa çıkmaz, ağ istemcisi probata-sign'da`);
    }
    if (ad.startsWith("tests/yardimci/imza-uret/") && !metin.startsWith(IMZA_URET_BASLIGI)) hata.push(`${ad}: başında "yalnız test verisi" kuralı yok`);
  }
  return hata;
}

/** 2026-10-23 (basılı formdan şablon): yapılandırılmış çıktı şemasının karmaşıklığı — Anthropic sınırları: isteğe bağlı alan (required'da olmayan)
    toplam ≤ 24, birleşik türlü alan (anyOf ya da tür dizisi) toplam ≤ 16; aşan şema hizmette 400 ile düşer (taklit görmez). ekAlanli: ek alana
    kapalı olmayan nesne */
export function semaKarmasikligi(sema: unknown): { istegeBagli: number; birlesik: number; ekAlanli: number } {
  const k = { istegeBagli: 0, birlesik: 0, ekAlanli: 0 };
  const yuru = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    const s = x as { type?: unknown; properties?: Record<string, unknown>; required?: unknown; additionalProperties?: unknown; items?: unknown; anyOf?: unknown[] };
    if (s.type === "object" || s.properties) {
      const ozellik = s.properties ?? {}, gerekli = new Set(Array.isArray(s.required) ? s.required : []);
      k.istegeBagli += Object.keys(ozellik).filter((a) => !gerekli.has(a)).length;
      if (s.additionalProperties !== false) k.ekAlanli++;
      for (const v of Object.values(ozellik)) {
        const o = v as { anyOf?: unknown; type?: unknown };
        if (Array.isArray(o?.anyOf) || Array.isArray(o?.type)) k.birlesik++;
        yuru(v);
      }
    }
    if (s.items) yuru(s.items);
    if (Array.isArray(s.anyOf)) s.anyOf.forEach(yuru);
  };
  yuru(sema);
  return k;
}

/* 2026-10-25 (reisim: "model adı hiçbir yerde görünmesin"): yorumlar çıkarıldıktan sonra kalan koddaki (dizge, JSX metni) model adı geçişleri.
   Model kimliği küçük harfli ve tireli ("claude-haiku-5-5") olduğundan yalnız büyük harfle başlayan ad sayılır. */
export function modelAdiBulgulari(metin: string): string[] {
  const kod = metin.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[\s;{},(])\/\/.*$/gm, "$1");
  return kod.split("\n").map((s, i) => ({ s, i: i + 1 })).filter((x) => /\b(Haiku|Sonnet|Opus|Claude)\b/.test(x.s)).map((x) => `${x.i}: ${x.s.trim().slice(0, 80)}`);
}
