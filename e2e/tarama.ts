/* SİTE TARAMASI (420) — reisim 2026-10-08: "mobilde bazı hatalara denk geldim … yan barda en aşağıya kaydırıp firma ayarları kısmına tıklayamadım;
   bu ve benzeri her türlü front back hatalarını toplu kontrol et". Oturumdaki kişinin gördüğü siteyi başlangıç adresinden bağlantı izleyerek gezer
   (aynı kalıptaki adres bir kez: kimlik → ":id") ve her sayfada:
     1. sunucu 5xx, sayfa hatası (yakalanmamış istisna), konsol hatası
     2. yatay taşma (sayfa ekrandan geniş — taşan öğeler adlarıyla)
     3. basılamayan öğe: görünür her tuş / bağlantı / alan ortalanıp merkezine bakılır — başka öğe üstündeyse (sabit tuş, şerit, perde) ya da
        ortalanamayıp ekran dışında kalıyorsa
     4. erişilebilirlik (axe, WCAG 2.1 A + AA, ciddi / kritik) açık VE koyu temada
     5. çekmece (orta / dar bant): her menü maddesi ekranın içinde ve basılabilir
     6. dengesiz kartlar (446; reisim 2026-10-09: "bi taraf uzun bi taraf kısa çok kötü, bunlar kabul edilemez siteyi gez … çok uzun bir şey ise
        bile kaydırabilir olsun kendi içinde"): aynı satırda yan yana duran kartlardan (kenarlı + zeminli kutu) biri ötekinden belirgin uzunsa
        (fark > 120 px ve oran > 1,4) — eşit boy (stretch) ya da uzun içerik kendi içinde kaydırılmalı
     7. açılır katmanlar (452; reisim 2026-10-09: "seçmeli yere tıklıyoruz tüm sayfa kayıyor", "bu ve benzeri kaymalar kabul edilemez siteyi tam
        teşekküllü tarama istiyorum"): sayfadaki ve sayfanın "… ekle / … düzenle / Yeni …" pencerelerindeki seçim listeleri ve takvimler açılır —
        açılınca hiçbir öğe yerinden oynamaz (sayfa / pencere itilmez, kaymaz), katman ekranın içinde ve tamamen görünür (kesilmez, örtülmez).
        Pencereler kaydedilmeden Esc ile kapatılır.
   Bulgular toplanır, sonda tek listede düşer (ilk hatada durmaz — hepsi bir koşuda görünsün). Gezilmez: /api, PDF, çıkış, giriş, indirme. */
import AxeBuilder from "@axe-core/playwright";
import type { ConsoleMessage, Dialog, Locator, Page, Response } from "@playwright/test";

export interface Bulgu { sayfa: string; tur: string; ayrinti: string }

const ATLA = [/^\/api\//, /\/pdf(\/|$)/, /^\/giris/, /^\/cikis/, /^\/yonetim\/cikis/, /^\/_next\//, /\.(pdf|xlsx|zip|csv|png|jpe?g|svg|ico)$/i];
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** aynı kalıptaki adres bir kez gezilir (her plan / rapor / personel sayfası değil, birer tanesi). 467: Bakanlık belge kodlu sayfalar (şablon
    önizlemesi /ekipman-turleri/sablon/ZPKR06, kriter belgesi /dokumanlar/kriterler/ZPKK06 …) da tek kalıp — dokuz format + dokuz kriter belgesiyle
    taramanın masaüstü parçası 50 dakikalık iş sınırını aştı; sayfaların çizicisi ortak, biri taranınca hepsi taranmış olur */
export const kalip = (yol: string) => yol.replace(UUID, ":id").replace(/\/\d+(?=\/|$)/g, "/:n").replace(/\/(?:ZP[KM][RK]|ZYD[RK])\d{2}(?=\/|$)/g, "/:kod");

/** sayfanın görünür, basılabilir öğelerinden üstü örtülü olanlar (tarayıcıda koşar) */
function ortuluOgeler(): { ad: string; neden: string }[] {
  const ad = (e: Element) => {
    const t = (e.getAttribute("aria-label") ?? (e as HTMLElement).innerText ?? e.getAttribute("title") ?? e.getAttribute("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 50);
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""} "${t}"`;
  };
  const sonuc: { ad: string; neden: string }[] = [];
  const ogeler = [...document.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=menuitem]")];
  for (const e of ogeler.slice(0, 250)) {
    if (e.closest("[inert], [aria-hidden=true], nextjs-portal")) continue;
    if (!e.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
    const once = e.getBoundingClientRect();
    if (once.width < 4 || once.height < 4) continue;                       // ekran okuyucuya açık gizli öğe (1 px) ya da boş
    e.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    const r = e.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) { sonuc.push({ ad: ad(e), neden: "ortalanamıyor, ekran dışında" }); continue; }
    const ust = document.elementFromPoint(x, y);
    if (!ust || ust === e || e.contains(ust) || ust.contains(e)) continue;
    const label = ust.closest("label");
    if (label && (label.contains(e) || (e.id && label.htmlFor === e.id))) continue;
    sonuc.push({ ad: ad(e), neden: `üstünde ${ad(ust)}` });
  }
  return sonuc;
}

/** 446: aynı satırda yan yana duran kartların boyu belirgin farklıysa (tarayıcıda koşar) — kap ve kartların başlığıyla */
function dengesizKartlar(): string[] {
  const kart = (e: Element) => {
    if (e.closest("dialog, [inert], [aria-hidden=true]")) return false;
    const s = getComputedStyle(e), r = e.getBoundingClientRect();
    if (r.width < 160 || r.height < 60 || s.display === "none" || s.visibility === "hidden") return false;
    const zemin = s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent";
    return (zemin && parseFloat(s.borderTopWidth) >= 1 && s.borderTopStyle !== "none") || s.boxShadow !== "none";
  };
  const ad = (e: Element) => {
    const b = e.querySelector("h1, h2, h3, legend, caption, [role=heading]");
    return `"${((b as HTMLElement | null)?.innerText ?? (e as HTMLElement).innerText ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
  };
  const sonuc: string[] = [];
  const kaplar = new Set<Element>();
  for (const e of document.querySelectorAll("main *")) if (e.parentElement) kaplar.add(e.parentElement);
  for (const kap of kaplar) {
    /* 452: sütunlu (gazete) yerleşimde kartlar alt alta oturur, kısa kartın altı boş kalmaz — dengesiz sayılmaz (Firma ayarları) */
    const ks = getComputedStyle(kap);
    if (ks.columnWidth !== "auto" || ks.columnCount !== "auto") continue;
    const l = [...kap.children].filter(kart).map((e) => ({ e, r: e.getBoundingClientRect() }));
    if (l.length < 2) continue;
    let en: { a: typeof l[0]; b: typeof l[0] } | null = null;
    for (const [i, a] of l.entries()) for (const b of l.slice(i + 1)) {
      const yanYana = Math.abs(a.r.top - b.r.top) <= 2 && (a.r.right <= b.r.left + 1 || b.r.right <= a.r.left + 1);
      if (!yanYana) continue;
      const [kisa, uzun] = a.r.height <= b.r.height ? [a, b] : [b, a];
      if (uzun.r.height - kisa.r.height > 120 && uzun.r.height / kisa.r.height > 1.4 && (!en || uzun.r.height - kisa.r.height > Math.abs(en.a.r.height - en.b.r.height))) en = { a: kisa, b: uzun };
    }
    if (en) {
      const sinif = typeof kap.className === "string" && kap.className ? "." + kap.className.split(" ")[0] : "";
      sonuc.push(`${kap.tagName.toLowerCase()}${sinif}: ${ad(en.b.e)} ${Math.round(en.b.r.height)} px, yanındaki ${ad(en.a.e)} ${Math.round(en.a.r.height)} px`);
    }
  }
  return sonuc;
}

/** sayfadan ekrandan taşan öğeler (en geniş üç; kendi kabında kayan — kesilen — öğe sayılmaz). 452: yana taşma denetleyen testler de kullanır */
export function tasanlar(): string[] {
  const g = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth <= g + 1) return [];
  const kesik = (e: HTMLElement) => {
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX;
      if (o !== "visible" && a.getBoundingClientRect().right <= g + 1) return true;
    }
    return false;
  };
  return [...document.querySelectorAll<HTMLElement>("body *")]
    .filter((e) => e.getBoundingClientRect().right > g + 1 && e.checkVisibility() && !kesik(e))
    .map((e) => ({ e, r: e.getBoundingClientRect().right }))
    .sort((a, b) => b.r - a.r).slice(0, 3)
    .map(({ e, r }) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""} sağ kenar ${Math.round(r)} > ${g}`)
    .concat(`sayfa genişliği ${document.documentElement.scrollWidth} > ${g}`);
}

/** 452: kökteki (pencere ya da sayfa) basılabilir öğelerin yerleri — açılır katman açılınca kıyaslanır (katmanın kendi içi hariç) */
function yerler(kokSecici: string): [string, number, number][] {
  const kok = document.querySelector(kokSecici) ?? document.body;
  const l: [string, number, number][] = [];
  for (const e of kok.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), textarea, [role=combobox], h1, h2, h3, label")) {
    if (e.closest("[popover]") || !e.checkVisibility()) continue;
    const r = e.getBoundingClientRect();
    l.push([`${e.tagName.toLowerCase()} "${(e.getAttribute("aria-label") ?? e.innerText ?? "").trim().replace(/\s+/g, " ").slice(0, 30)}"`, Math.round(r.left), Math.round(r.top)]);
    if (l.length >= 300) break;
  }
  return l;
}

/** 452: katman ekranın içinde ve tamamen görünür mü (orta ve köşelere yakın noktalarda üstte kendisi) */
function katmanGorunur(e: Element): string {
  const r = e.getBoundingClientRect();
  if (r.top < -0.5 || r.left < -0.5 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5) {
    return `ekrandan taşıyor (${Math.round(r.left)}, ${Math.round(r.top)}) – (${Math.round(r.right)}, ${Math.round(r.bottom)}), ekran ${innerWidth} × ${innerHeight}`;
  }
  for (const [x, y] of [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 6, r.top + 6], [r.right - 6, r.bottom - 6], [r.left + 6, r.bottom - 6], [r.right - 6, r.top + 6]]) {
    const ust = document.elementFromPoint(x, y);
    if (!ust || !e.contains(ust)) return `(${Math.round(x)}, ${Math.round(y)}) noktasında üstünde ${ust?.tagName.toLowerCase() ?? "hiçbir şey"} (kesik ya da örtülü)`;
  }
  return "";
}

/** 452: kökteki seçim listeleri ve takvimler (en çok 4): aç → yerinden oynayan öğe yok, katman tamamen görünür → Esc.
    486 (reisim 2026-10-10: "tip seçin kısmına tıklayınca saçma sapan başa atıp"): ilk dördün yanında her TABLONUN içindeki ilk seçim listesi de
    (en çok 3 tablo) — tablodaki eski CSS ezmesi listeyi sayfanın başına atıyordu, ilk dörde girmediği için tarama görmemişti */
async function katmanlariDene(page: Page, kok: Locator, kokSecici: string, yer: string, nerede: string, bulgular: Bulgu[]) {
  const SECICI = '[role=combobox]:not([disabled]), button[aria-label="Takvimden seç"]';
  const tetikler = kok.locator(SECICI), tablolar = kok.locator("table");
  const denenecek = Array.from({ length: Math.min(await tetikler.count(), 4) }, (_, i) => tetikler.nth(i));
  for (let j = 0; j < Math.min(await tablolar.count(), 3); j++) {
    const ic = tablolar.nth(j).locator(SECICI);
    if (await ic.count()) denenecek.push(ic.first());
  }
  for (const t of denenecek) {
    if (!(await t.isVisible().catch(() => false))) continue;
    await t.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    const ad = ((await t.getAttribute("aria-label")) ?? (await t.innerText().catch(() => ""))).trim().replace(/\s+/g, " ").slice(0, 40);
    const once = await page.evaluate(yerler, kokSecici);
    if (!(await t.click({ timeout: 3000 }).then(() => true, () => false))) continue;
    const katman = page.locator("[popover]:popover-open").last();
    if (!(await katman.waitFor({ state: "visible", timeout: 2000 }).then(() => true, () => false))) {
      bulgular.push({ sayfa: yer, tur: "açılır katman", ayrinti: `${nerede} "${ad}": üst katmanda açılmadı (akış içinde açılan liste sayfayı iter)` });
    } else {
      const sonra = await page.evaluate(yerler, kokSecici);
      const oynayan = once.filter((x, j) => sonra[j] && sonra[j][0] === x[0] && (Math.abs(sonra[j][1] - x[1]) > 1 || Math.abs(sonra[j][2] - x[2]) > 1));
      if (sonra.length !== once.length || oynayan.length) {
        bulgular.push({ sayfa: yer, tur: "açılır katman", ayrinti: `${nerede} "${ad}" açılınca öğeler yerinden oynadı: ${oynayan.slice(0, 3).map((x) => x[0]).join(", ") || `öğe sayısı ${once.length} → ${sonra.length}`}` });
      }
      const g = await katman.evaluate(katmanGorunur);
      if (g) bulgular.push({ sayfa: yer, tur: "açılır katman", ayrinti: `${nerede} "${ad}": ${g}` });
    }
    await page.keyboard.press("Escape");
    await katman.waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
  }
}

/** 452: sayfanın ve "… ekle / … düzenle / Yeni …" pencerelerinin (en çok 2; açılır, denenir, kaydedilmeden kapatılır) açılır katmanları */
async function acilirKatmanlar(page: Page, yer: string, bulgular: Bulgu[]) {
  await katmanlariDene(page, page.locator("main"), "main", yer, "sayfada", bulgular);
  /* kâğıt üstündeki "+ … ekle" (Format kurucu, 451) pencere açmaz, taslağa yazar — denenmez */
  const acanlar = page.locator("main button:not([type=submit]):not([disabled]):not(article button)").filter({ hasText: /(^|\s)(ekle|düzenle)\s*$|^\s*Yeni\s/i });
  const n = Math.min(await acanlar.count(), 2);
  for (let i = 0; i < n; i++) {
    const t = acanlar.nth(i);
    if (!(await t.isVisible().catch(() => false))) continue;
    const ad = (await t.innerText().catch(() => "")).trim().replace(/\s+/g, " ").slice(0, 40);
    if (!(await t.click({ timeout: 3000 }).then(() => true, () => false))) continue;
    const pencere = page.locator("dialog[open]").last();
    const acildi = await pencere.waitFor({ state: "visible", timeout: 1500 }).then(() => true, () => false);
    if (new URL(page.url()).pathname !== yer.split("?")[0]) { await page.goto(yer, { waitUntil: "load" }).catch(() => undefined); return; }
    if (!acildi) continue;
    await katmanlariDene(page, pencere, "dialog[open]", yer, `"${ad}" penceresinde`, bulgular);
    await page.keyboard.press("Escape");
    if (await pencere.isVisible().catch(() => false)) await pencere.getByRole("button", { name: /^(Vazgeç|Kapat)$/ }).first().click({ timeout: 2000 }).catch(() => undefined);
    await pencere.waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
  }
}

async function erisilebilirlik(page: Page, yer: string, tema: string, bulgular: Bulgu[]) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("nextjs-portal").analyze();
  for (const v of r.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
    bulgular.push({ sayfa: yer, tur: `erişilebilirlik (${tema})`, ayrinti: `${v.id}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}` });
  }
}

/** çekmece (orta / dar bant): her menü maddesi ekranın içinde ve basılabilir mi — en alttaki dahil (419) */
async function cekmece(page: Page, yer: string, bulgular: Bulgu[]) {
  const ac = page.getByRole("button", { name: "Menüyü aç" });
  if (!(await ac.isVisible())) return;
  await ac.click();
  await page.locator("#ana-menu").evaluate((e) => new Promise((tamam) => { if (getComputedStyle(e).transform === "none") tamam(null); else e.addEventListener("transitionend", () => tamam(null), { once: true }); setTimeout(tamam, 1500); }));
  const sorunlar = await page.locator("#ana-menu nav").evaluate((nav) => {
    const s: string[] = [];
    for (const a of nav.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      a.scrollIntoView({ block: "nearest", behavior: "instant" });
      const r = a.getBoundingClientRect();
      if (r.bottom > innerHeight + 0.5 || r.top < 0) { s.push(`"${a.innerText.trim()}" ekran dışında (alt ${Math.round(r.bottom)} > ${innerHeight})`); continue; }
      const ust = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!ust || !(ust === a || a.contains(ust))) s.push(`"${a.innerText.trim()}" basılamıyor — üstünde ${ust?.tagName.toLowerCase()}`);
    }
    return s;
  });
  for (const x of sorunlar) bulgular.push({ sayfa: yer, tur: "çekmece", ayrinti: x });
  await page.getByRole("button", { name: "Menüyü kapat" }).click();
}

/**
 * siteyi `baslangic`tan gezer; bulguları döndürür. `enCok` sayfa (kalıp) ve `sure` ms ile sınırlı — sınıra takılırsa gezilmeyenler de bulgu
 * değil, `kalan` olarak döner (sessiz kırpma yok).
 */
export async function siteyiTara(page: Page, baslangic: string[], { enCok = 90, sure = 20 * 60_000 } = {}) {
  const bulgular: Bulgu[] = [];
  const kuyruk = [...baslangic], gorulen = new Set(baslangic.map(kalip)), gezilen: string[] = [];
  const bitis = Date.now() + sure;
  let yer = "";
  const sayfaHatasi = (h: Error) => { bulgular.push({ sayfa: yer, tur: "sayfa hatası", ayrinti: h.message.slice(0, 300) }); };
  const konsol = (m: ConsoleMessage) => { if (m.type() === "error") bulgular.push({ sayfa: yer, tur: "konsol hatası", ayrinti: m.text().slice(0, 300) }); };
  const yanitlar = (r: Response) => {
    const u = new URL(r.url());
    if (u.origin === new URL(page.url() || "http://x").origin && r.status() >= 500) bulgular.push({ sayfa: yer, tur: `sunucu ${r.status()}`, ayrinti: u.pathname });
  };
  /* taslağı kirlenen sayfadan çıkarken tarayıcının "sayfadan ayrılınsın mı" sorusu: ayrılınır (tarama kayıt yapmaz) */
  const diyalog = (d: Dialog) => { void d.accept().catch(() => undefined); };
  page.on("pageerror", sayfaHatasi);
  page.on("console", konsol);
  page.on("response", yanitlar);
  page.on("dialog", diyalog);
  try {
    let cekmeceBakildi = false;
    while (kuyruk.length && gezilen.length < enCok && Date.now() < bitis) {
      yer = kuyruk.shift()!;
      const yanit = await page.goto(yer, { waitUntil: "load", timeout: 60_000 }).catch((h: Error) => { bulgular.push({ sayfa: yer, tur: "açılmadı", ayrinti: h.message.slice(0, 200) }); return null; });
      if (!yanit) continue;
      gezilen.push(yer);
      if (yanit.status() >= 400) { bulgular.push({ sayfa: yer, tur: `durum ${yanit.status()}`, ayrinti: "sayfa açılmadı" }); continue; }
      const bagli = await page.locator("html[data-hazir]").waitFor({ state: "attached", timeout: 30_000 }).then(() => true, () => false);
      if (!bagli) {
        bulgular.push({ sayfa: yer, tur: "bağlanmadı", ayrinti: "React sayfaya 30 sn'de bağlanmadı (html[data-hazir] yok)" });
        continue;
      }
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      /* geçiş efektleri kapalı: tema değişince renk geçişi sürerken ölçülen karşıtlık yanlış olmasın (uçtan uca sunucusunun CSP'si satır içi stile izin
         verir — geliştirme kipi, src/proxy.ts) */
      await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
      /* yeni adresler: aynı köken, yalnız yol; gezilmeyecekler ve görülen kalıplar dışarıda */
      const yollar = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
        .filter((a) => !a.hasAttribute("download") && a.target !== "_blank" && a.origin === location.origin).map((a) => a.pathname));
      for (const y of yollar) {
        const k = kalip(y);
        if (gorulen.has(k) || ATLA.some((r) => r.test(y))) continue;
        gorulen.add(k);
        kuyruk.push(y);
      }
      const tasan = await page.evaluate(tasanlar);
      if (tasan.length) bulgular.push({ sayfa: yer, tur: "yatay taşma", ayrinti: tasan.join(" · ") });
      for (const o of await page.evaluate(ortuluOgeler)) bulgular.push({ sayfa: yer, tur: "basılamıyor", ayrinti: `${o.ad} — ${o.neden}` });
      /* 446 → 452: ilk koşuda yalnız günlükteydi (tek bulgu: Firma ayarlarının sütunlu yerleşimi — sayılmaz); artık bulgu (kilit) */
      for (const x of await page.evaluate(dengesizKartlar)) bulgular.push({ sayfa: yer, tur: "dengesiz kartlar", ayrinti: x });
      await page.evaluate(() => scrollTo(0, 0));
      await acilirKatmanlar(page, yer, bulgular);
      await page.evaluate(() => scrollTo(0, 0));
      await erisilebilirlik(page, yer, "açık", bulgular);
      const tema = await page.evaluate(() => document.documentElement.getAttribute("data-tema"));
      await page.evaluate(() => document.documentElement.setAttribute("data-tema", "koyu"));
      await erisilebilirlik(page, yer, "koyu", bulgular);
      await page.evaluate((t) => document.documentElement.setAttribute("data-tema", t ?? "acik"), tema);
      if (!cekmeceBakildi) { cekmeceBakildi = true; await cekmece(page, yer, bulgular); }
    }
  } finally {
    page.off("pageerror", sayfaHatasi);
    page.off("console", konsol);
    page.off("response", yanitlar);
    page.off("dialog", diyalog);
  }
  return { bulgular, gezilen, kalan: kuyruk };
}

/** bulguları okunur tek metin (düşen testin iletisi) */
export const bulguMetni = (b: Bulgu[]) => b.map((x) => `[${x.tur}] ${x.sayfa}: ${x.ayrinti}`).join("\n");
