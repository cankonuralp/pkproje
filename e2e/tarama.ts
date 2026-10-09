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
   Bulgular toplanır, sonda tek listede düşer (ilk hatada durmaz — hepsi bir koşuda görünsün). Gezilmez: /api, PDF, çıkış, giriş, indirme. */
import AxeBuilder from "@axe-core/playwright";
import type { ConsoleMessage, Page, Response } from "@playwright/test";

export interface Bulgu { sayfa: string; tur: string; ayrinti: string }

const ATLA = [/^\/api\//, /\/pdf(\/|$)/, /^\/giris/, /^\/cikis/, /^\/yonetim\/cikis/, /^\/_next\//, /\.(pdf|xlsx|zip|csv|png|jpe?g|svg|ico)$/i];
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** aynı kalıptaki adres bir kez gezilir (her plan / rapor / personel sayfası değil, birer tanesi) */
export const kalip = (yol: string) => yol.replace(UUID, ":id").replace(/\/\d+(?=\/|$)/g, "/:n");

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

/** sayfadan ekrandan taşan öğeler (en geniş üç) */
function tasanlar(): string[] {
  const g = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth <= g + 1) return [];
  return [...document.querySelectorAll<HTMLElement>("body *")]
    .filter((e) => e.getBoundingClientRect().right > g + 1 && e.checkVisibility())
    .map((e) => ({ e, r: e.getBoundingClientRect().right }))
    .sort((a, b) => b.r - a.r).slice(0, 3)
    .map(({ e, r }) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""} sağ kenar ${Math.round(r)} > ${g}`);
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
export async function siteyiTara(page: Page, baslangic: string[], { enCok = 90, sure = 15 * 60_000 } = {}) {
  const bulgular: Bulgu[] = [], dengesiz: Bulgu[] = [];
  const kuyruk = [...baslangic], gorulen = new Set(baslangic.map(kalip)), gezilen: string[] = [];
  const bitis = Date.now() + sure;
  let yer = "";
  const sayfaHatasi = (h: Error) => { bulgular.push({ sayfa: yer, tur: "sayfa hatası", ayrinti: h.message.slice(0, 300) }); };
  const konsol = (m: ConsoleMessage) => { if (m.type() === "error") bulgular.push({ sayfa: yer, tur: "konsol hatası", ayrinti: m.text().slice(0, 300) }); };
  const yanitlar = (r: Response) => {
    const u = new URL(r.url());
    if (u.origin === new URL(page.url() || "http://x").origin && r.status() >= 500) bulgular.push({ sayfa: yer, tur: `sunucu ${r.status()}`, ayrinti: u.pathname });
  };
  page.on("pageerror", sayfaHatasi);
  page.on("console", konsol);
  page.on("response", yanitlar);
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
      /* 446: önce yalnız rapor (deneme makinesinin günlüğünde) — bulunanlar düzeltilince bulguya (kilide) çevrilir */
      for (const x of await page.evaluate(dengesizKartlar)) dengesiz.push({ sayfa: yer, tur: "dengesiz kartlar", ayrinti: x });
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
  }
  return { bulgular, gezilen, kalan: kuyruk, dengesiz };
}

/** bulguları okunur tek metin (düşen testin iletisi) */
export const bulguMetni = (b: Bulgu[]) => b.map((x) => `[${x.tur}] ${x.sayfa}: ${x.ayrinti}`).join("\n");
