/* BULUT ÖLÇÜM SÜRÜCÜSÜ (MAKET-PLANI.md §5; 2026-09-24, M1) — SALT OKUNUR: docs/ dosyalarını değiştirmez, yalnız ölçer.
   Bulutta tarayıcı bölmesi yok → başsız Chromium + puppeteer-core (tools/bulut-hazirla.sh kurar; depoya bağımlılık GİRMEZ).
   Yöntem (anayasa 11.7–11.8, önceki turların ölçüm pratikleri):
   · docs/ `python3 -m http.server` ile sunulur (Pages gibi sabit dosya).
   · Her durum × genişlik × tema TAZE yüklenir, ayrı gizli oturumda (yerel depo — tema, menü tercihi — sızmaz).
   · 1920×1080 · 1080×810 · 375×812; açık + koyu (?tema=). 1080'de çekmece kapalı VE açık (anayasa 2.11).
   · Geçişler ve canlandırmalar kapatılır (takılı geçiş yanlış çakışma üretir).
   · tools/olc-maket.js aynen koşar (eş zamanlı betik); sonuç docs/assets/olcum/<maket>.json'a yazılır, ekran görüntüsü
     --goruntu klasörüne (depoya girmez).
   · Çekmece açıkken içerik perdenin altındadır: o durumda yalnız çekmece ölçülür (ekran içinde mi, ad kesik mi, madde
     boyu, menü kayıyor mu, son madde kaydırınca açılıyor mu).
   Olumsuz kanıt (--olumsuz): bilerek taşan / sert kırpılan / küçük / üst üste binen öğe eklenir, bulgu ÇIKMALI; çıkmazsa
   ölçüm yalancı demektir ve sürücü hata koduyla biter.
   Kullanım:  node tools/olc-bulut.mjs <maket> [--goruntu <klasör>] [--yazma]      (maket adları: DURUMLAR)
              node tools/olc-bulut.mjs --olumsuz
   Komutlar Node 24 ile: PATH=/opt/node24/bin:$PATH. */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const KOK = fileURLToPath(new URL("..", import.meta.url));
const OLC = readFileSync(join(KOK, "tools/olc-maket.js"), "utf8");
const puppeteer = createRequire("/opt/olcum/")("puppeteer-core");

/* ── Her maketin ölçülen durumları. adim: tıkla (seçici) · yaz (seçici, metin) · bekle yok (betik eş zamanlı). ── */
export const DURUMLAR = {
  planlar: { sayfa: "maket/planlarim.html", durumlar: [
    { ad: "liste", hash: "#/" },
    { ad: "plan içi · kabul bekliyor, ön koşul eksik", hash: "#/plan/4" },
    { ad: "plan içi · kabul edildi", hash: "#/plan/6" },
    { ad: "plan içi · denetimde", hash: "#/plan/1" },
    { ad: "plan içi · tamamlandı (22 rapor)", hash: "#/plan/9" },
    { ad: "plan içi · reddedildi", hash: "#/plan/7" },
    { ad: "ekipman ekle · çakışan kod", hash: "#/plan/1/ekle/HT-1001" },
    { ad: "ekipman ekle · tesiste kayıtlı", hash: "#/plan/1/ekle/FL-1013" },
    { ad: "reddet penceresi", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="reddet"], #a-plan .a-eylem-cubugu-alt [data-eylem="reddet"]']] },
  ] },
};

/* ── ETKİLEŞİM DENEMELERİ (--etkilesim): adımlar koşar, sonra `bekle` ifadesi sayfada doğru dönmeli. Gen verilmezse 1920. ── */
export const DENEMELER = {
  planlar: [
    { ad: "çip süzer, sayaç dürüst (4 / 9)", hash: "#/", adim: [["tikla", '[data-sz="l"] [data-cip="bekliyor"]']], bekle: 'document.querySelector("#a-sayac").textContent === "4 / 9 plan" && document.querySelectorAll("#a-liste tbody tr").length === 4' },
    { ad: "ve + aynı grup → imkânsız, sebep yazılır", hash: "#/", adim: [["tikla", '[data-cip="bekliyor"]'], ["tikla", '[data-cip="kabul"]'], ["tikla", '[data-kip="ve"]']], bekle: '/aynı anda iki durumda/.test(document.querySelector("#a-liste .a-bos-baslik").textContent)' },
    { ad: "sütun başlığı sıralar (Proje no artan)", hash: "#/", adim: [["tikla", '[data-sirala="no"]']], bekle: 'document.querySelector("#a-liste tbody tr .a-no").textContent === "P-0926-025" && document.querySelector("th[aria-sort]") !== null' },
    { ad: "arama süzer, kutu yerinde kalır", hash: "#/", adim: [["yaz", '[data-ara="l"]', "tekirdağ"]], bekle: 'document.querySelectorAll("#a-liste tbody tr").length === 2 && document.activeElement.dataset.ara === "l"' },
    { ad: "rapor sayfalayıcı 2. sayfa (21–22 / 22)", hash: "#/plan/9", adim: [["tikla", '[data-sz="r"] [data-sayfa="2"]']], bekle: 'document.querySelector(\'.a-sayfalar[data-sz="r"] .a-sayfa-bilgi\').textContent === "21–22 / 22"' },
    { ad: "telefonda levha: seçici değişir, rozet 1", gen: 375, hash: "#/", adim: [["tikla", '[data-sz="l"] [data-eylem="levha-ac"]'], ["tikla", '#a-levha [data-sec="brans"][data-deger="e"]'], ["tikla", '#a-levha [data-eylem="levha-kapat"]']], bekle: 'document.querySelector(\'[data-sz="l"] .a-suzgec-rozet\').textContent === "1" && !document.querySelector("#a-levha").open' },
    { ad: "levhada Temizle doğru süzgeci temizler (plan içi)", gen: 375, hash: "#/plan/1", adim: [["tikla", '[data-sz="e"] [data-eylem="levha-ac"]'], ["tikla", '#a-levha [data-sec="brans"][data-deger="e"]'], ["tikla", '#a-levha [data-eylem="temizle"]']], bekle: 'document.querySelector(\'[data-sz="e"] .a-suzgec-rozet\').hidden' },
    { ad: "tablette çekmece açılır, Esc kapatır", gen: 1080, hash: "#/", adim: [["tikla", ".a-menu-tus"], ["tus", "Escape"]], bekle: '!document.querySelector("#a-kabuk").classList.contains("a-cekmece-acik")' },
    { ad: "masaüstünde menü 64 px şeride daralır", hash: "#/", adim: [["tikla", ".a-daralt-tus"]], bekle: 'Math.round(document.querySelector(".a-cubuk").getBoundingClientRect().width) === 64' },
    { ad: "kabul et → Kabul edildi", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="kabul"]']], bekle: '/Kabul edildi/.test(document.querySelector("#a-plan .a-nesne-baslik").textContent)' },
    { ad: "reddet: gerekçesiz gönderilmez, gerekçeyle reddedilir", hash: "#/plan/3", adim: [["tikla", '#a-plan .a-adim-tuslar [data-eylem="reddet"]'], ["yaz", "#a-red-gerekce", "Aynı gün başka denetim"], ["tikla", "#a-red-onay"]], bekle: '/Reddedildi/.test(document.querySelector("#a-plan .a-nesne-baslik").textContent)' },
    { ad: "ekipman ekle: çakışan kod kaydedilmez", hash: "#/plan/1/ekle", adim: [["yaz", "#a-ekle-kod", "ht-1001"]], bekle: 'document.querySelector("#a-ekle-kod").value === "HT-1001" && document.querySelector(\'[data-eylem="yeni-kaydet"]\').disabled' },
    { ad: "ekipman ekle: yeni kod + tür → plana eklenir", hash: "#/plan/1", adim: [["tikla", '[data-eylem="ekle-ac"]'], ["yaz", "#a-ekle-kod", "ZZ-9001"], ["tikla", "#a-ekle-tur"], ["tikla", '[data-tur="FL"]'], ["tikla", '[data-eylem="yeni-kaydet"]']], bekle: '!document.querySelector("#a-ekle-pencere").open && [...document.querySelectorAll("#a-liste-e .a-kod")].some(e => e.textContent === "ZZ-9001")' },
    { ad: "menüden hazır olmayan modül → bildirim", hash: "#/", adim: [["tikla", '#a-menu [data-ne="Raporlar"]']], bekle: '/henüz tasarlanmadı/.test(document.querySelector("#a-bildirim-metin").textContent)' },
  ],
};

const GENISLIK = [[1920, 1080], [1080, 810], [375, 812]];
const TEMA = ["acik", "koyu"];
const SIFIR = ["tasma", "sertKirpma", "tasanMetin", "cakisma", "sonCakisma", "gizliEtkilesimli", "ekranDisi", "kucukHedef", "basliksizKirpma", "ipucuKesik", "kenarFarki", "gorunenGizli", "pencereKenar", "hizaKaymasi", "kartTutarsiz"];

function tarayici() {
  const aday = ["/opt/pw-browsers", "/opt/olcum"].filter(existsSync).flatMap(function ara(d) {
    return readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? ara(join(d, e.name)) : /^(headless_shell|chrome-headless-shell)$/.test(e.name) ? [join(d, e.name)] : []);
  });
  if (!aday.length) throw new Error("Başsız Chromium bulunamadı (tools/bulut-hazirla.sh).");
  return aday[0];
}

async function sunucu() {
  const kapi = 8700 + Math.floor(Math.random() * 200);
  const s = spawn("python3", ["-m", "http.server", String(kapi), "--bind", "127.0.0.1", "--directory", join(KOK, "docs")], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${kapi}/`); return { kapi, kapat: () => s.kill() }; } catch { await new Promise(r => setTimeout(r, 100)); } }
  s.kill(); throw new Error("sunucu açılmadı");
}

/* çekmece açıkken: yalnız çekmece (içerik perdenin altında, etkileşime kapalı) */
const CEKMECE = `(() => {
  const c = document.querySelector(".a-cubuk"), m = document.querySelector(".a-menu"), b = c.getBoundingClientRect();
  const tusY = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tus-y"));
  const linkler = [...m.querySelectorAll("a")];
  const r = { genislik: innerWidth, ekranIcinde: b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1,
    cekmeceGen: Math.round(b.width), madde: linkler.length,
    kesikAd: linkler.filter(a => { const s = a.querySelector(".a-menu-ad"); return s && s.scrollWidth > s.clientWidth + 1; }).length,
    kucukMadde: linkler.filter(a => a.getBoundingClientRect().height < tusY - 0.5).length,
    menuGorunur: Math.round(m.clientHeight), menuIcerik: Math.round(m.scrollHeight), yatayTasma: document.documentElement.scrollWidth - innerWidth };
  m.scrollTop = m.scrollHeight;
  const son = linkler[linkler.length - 1].getBoundingClientRect(), mb = m.getBoundingClientRect();
  r.sonMaddeAcilir = son.bottom <= mb.bottom + 1 && son.top >= mb.top - 1;
  m.scrollTop = 0;
  r.perde = getComputedStyle(document.querySelector(".a-perde")).opacity === "1";
  return r;
})()`;

async function adimlar(sayfa, liste) {
  for (const [ne, secici, metin] of liste || []) {
    if (ne === "tikla") await sayfa.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.getClientRects().length); if (!e) throw new Error("yok: " + s); if (e.focus) e.focus(); e.click(); }, secici);   /* gerçek tıklama gibi: önce odak */
    else if (ne === "yaz") await sayfa.evaluate((s, m) => { const e = document.querySelector(s); e.focus(); e.value = m; e.dispatchEvent(new Event("input", { bubbles: true })); }, secici, metin);
    else if (ne === "tus") await sayfa.keyboard.press(secici);
  }
}

async function ac(tar, taban, dosya, hash, gen, yuk, tema, adim) {
  const ctx = await tar.createBrowserContext();
  const s = await ctx.newPage();
  const hatalar = [];
  s.on("pageerror", e => hatalar.push(String(e.message || e)));
  s.on("console", m => { if (m.type() === "error") hatalar.push(m.text()); });
  s.on("requestfailed", r => hatalar.push("istek düştü: " + r.url()));
  s.on("response", r => { if (r.status() >= 400) hatalar.push(r.status() + " " + r.url()); });
  await s.setViewport({ width: gen, height: yuk, deviceScaleFactor: 1 });
  await s.goto(`${taban}/${dosya}?tema=${tema}${hash || ""}`, { waitUntil: "load" });
  await s.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await s.evaluate(() => document.fonts.ready);
  await adimlar(s, adim);
  return { s, ctx, hatalar };
}

const say = v => v === undefined || v === null ? null : Array.isArray(v) ? v.length : v;
function ozet(ad, gen, tema, r, hatalar) {
  return { ad, gen, tema, gorunum: r.gorunum, liste: r.listeKipi, pencere: r.pencere,
    tasma: r.yatayTasma, sertKirpma: say(r.sertKirpma), tasanMetin: say(r.tasanMetin), cakisma: r.cakisma, sonCakisma: say(r.sonCakisma),
    gizliEtkilesimli: say(r.gizliEtkilesimli), ekranDisi: r.ekranDisi, kucukHedef: say(r.kucukHedef), basliksizKirpma: say(r.ucNoktaBasliksiz),
    ipucuKesik: say(r.ipucuKesik), kenarFarki: r.kenarFarki, gorunenGizli: say(r.gorunenGizli), pencereKenar: say(r.pencereKenar),
    hizaKaymasi: r.hizaKaymasi, kartTutarsiz: r.kartTutarsiz, tusY: r.tusY, tusGen: r.tusGenislik, satirY: r.satirYukseklik,
    birincil: r.birincilSayisi ?? null, pencereGen: r.pencereGenislik ?? null, icerik: r.icerik, listeGen: r.liste, yaziTipi: r.yaziTipi,
    hata: hatalar.length, ayrinti: Object.fromEntries(["sertKirpma", "tasanMetin", "kucukHedef", "gizliEtkilesimli", "ucNoktaBasliksiz", "ipucuKesik", "gorunenGizli"].filter(k => Array.isArray(r[k]) && r[k].length).map(k => [k, r[k]])),
    hatalar };
}
const temizMi = d => SIFIR.every(k => d[k] === 0 || d[k] === null) && d.hata === 0 && d.yaziTipi === "Sora yüklü";

async function olc(ad, { goruntu, yazma }) {
  const t = DURUMLAR[ad]; if (!t) throw new Error("bilinmeyen maket: " + ad + " (" + Object.keys(DURUMLAR).join(", ") + ")");
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
  const surum = await tar.version();
  const durumlar = [], cekmece = [];
  try {
    for (const d of t.durumlar) for (const [gen, yuk] of GENISLIK) for (const tema of TEMA) {
      const { s, ctx, hatalar } = await ac(tar, taban, d.sayfa || t.sayfa, d.hash, gen, yuk, tema, d.adim);
      const r = await s.evaluate(OLC);
      const o = ozet(d.ad, gen, tema, r, hatalar); durumlar.push(o);
      const dosya = `${ad}-${String(durumlar.length).padStart(2, "0")}-${gen}-${tema}.png`;
      if (goruntu) await s.screenshot({ path: join(goruntu, dosya), fullPage: true });
      console.log(`${temizMi(o) ? "✓" : "✗"} ${gen} ${tema.padEnd(4)} ${d.ad}${temizMi(o) ? "" : "  → " + JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k, v]) => (SIFIR.includes(k) && v) || (k === "hata" && v) || k === "ayrinti" && Object.keys(v).length || k === "hatalar" && v.length || (k === "yaziTipi" && v !== "Sora yüklü"))))}`);
      /* 1080'de çekmece AÇIK (yalnız ilk durumda: kabuk her sayfada aynı üreticiden) */
      if (gen === 1080 && d === t.durumlar[0] && !d.kabuksuz) {
        await s.click(".a-menu-tus");
        const c = await s.evaluate(CEKMECE); c.tema = tema; cekmece.push(c);
        if (goruntu) await s.screenshot({ path: join(goruntu, `${ad}-cekmece-${tema}.png`) });
        const iyi = c.ekranIcinde && !c.kesikAd && !c.kucukMadde && c.sonMaddeAcilir && c.perde && c.yatayTasma === 0;
        console.log(`${iyi ? "✓" : "✗"} 1080 ${tema.padEnd(4)} çekmece açık · ${c.madde} madde · menü ${c.menuGorunur}/${c.menuIcerik} px${iyi ? "" : " → " + JSON.stringify(c)}`);
      }
      await ctx.close();
    }
  } finally { await tar.close(); sv.kapat(); }
  const temiz = durumlar.filter(temizMi).length;
  const iyiCekmece = cekmece.filter(c => c.ekranIcinde && !c.kesikAd && !c.kucukMadde && c.sonMaddeAcilir && c.perde && c.yatayTasma === 0).length;
  const sonuc = { maket: ad, sayfa: t.sayfa, tarih: new Date().toISOString().slice(0, 10), arac: `başsız ${surum} · puppeteer-core · tools/olc-bulut.mjs + tools/olc-maket.js`,
    yontem: "python3 http.server (docs/), her durum × genişlik × tema taze yükleme ve ayrı oturum, geçişler kapalı; 1920×1080 · 1080×810 · 375×812 × açık/koyu; 1080'de çekmece açık ayrıca.",
    toplam: durumlar.length, temiz, cekmece: { toplam: cekmece.length, temiz: iyiCekmece, olcumler: cekmece },
    durumlar: durumlar.map(({ hatalar, ...x }) => ({ ...x, hatalar: hatalar.slice(0, 5) })) };
  if (!yazma) {
    mkdirSync(join(KOK, "docs/assets/olcum"), { recursive: true });
    writeFileSync(join(KOK, `docs/assets/olcum/${ad}.json`), JSON.stringify(sonuc, null, 1) + "\n");
  }
  console.log(`\n${ad}: ${temiz}/${durumlar.length} durum temiz · çekmece ${iyiCekmece}/${cekmece.length}`);
  return temiz === durumlar.length && iyiCekmece === cekmece.length;
}

async function etkilesim(ad) {
  const t = DURUMLAR[ad], l = DENEMELER[ad] || [];
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox"] });
  let gecen = 0;
  try {
    for (const d of l) {
      const gen = d.gen || 1920, yuk = { 1920: 1080, 1080: 810, 375: 812 }[gen];
      let ok = false, hata = "";
      const { s, ctx, hatalar } = await ac(tar, taban, d.sayfa || t.sayfa, d.hash, gen, yuk, "acik", []).catch(e => ({ hatalar: [String(e)] }));
      try { await adimlar(s, d.adim); ok = await s.evaluate(d.bekle); } catch (e) { hata = String(e.message || e); }
      ok = ok && !hatalar.length;
      if (ok) gecen++;
      console.log(`${ok ? "✓" : "✗"} ${gen} ${d.ad}${ok ? "" : " → " + (hata || hatalar.join(" | ") || "beklenen sonuç yok")}`);
      if (ctx) await ctx.close();
    }
  } finally { await tar.close(); sv.kapat(); }
  console.log(`\n${ad}: etkileşim ${gecen}/${l.length}`);
  return gecen === l.length;
}

/* OLUMSUZ KANIT: ölçüm gerçekten yakalıyor mu — bilerek bozulmuş sayfa bulgu vermeli */
async function olumsuz() {
  const sv = await sunucu(), taban = `http://127.0.0.1:${sv.kapi}`;
  const tar = await puppeteer.launch({ executablePath: tarayici(), headless: true, args: ["--no-sandbox"] });
  let gecti = true;
  try {
    for (const [gen, yuk] of [[1920, 1080], [375, 812]]) {
      const { s, ctx } = await ac(tar, taban, "maket/planlarim.html", "#/", gen, yuk, "acik");
      await s.evaluate(() => {
        const ic = document.querySelector(".a-icerik");
        const genis = document.createElement("div"); genis.style.cssText = "width:3000px;height:10px"; ic.appendChild(genis);
        const kirpik = document.createElement("div"); kirpik.style.cssText = "width:60px;overflow:hidden;white-space:nowrap"; kirpik.textContent = "Bilerek kırpılan uzun bir metin"; ic.appendChild(kirpik);
        const kucuk = document.createElement("button"); kucuk.textContent = "k"; kucuk.style.cssText = "height:12px"; ic.appendChild(kucuk);
        const ust = document.createElement("button"); ust.textContent = "üst"; ust.className = "a-tus";
        const t = document.querySelector(".a-ara input").getBoundingClientRect();
        ust.style.cssText = `position:absolute;left:${t.left + window.scrollX}px;top:${t.top + window.scrollY}px`; document.body.appendChild(ust);
      });
      const r = await s.evaluate(OLC);
      const bulgu = { tasma: r.yatayTasma, sertKirpma: r.sertKirpma.length, kucukHedef: r.kucukHedef.length, cakisma: r.cakisma };
      const hepsi = Object.values(bulgu).every(v => v > 0);
      gecti = gecti && hepsi;
      console.log(`${hepsi ? "✓" : "✗"} ${gen}: bozulmuş sayfada bulgu → ${JSON.stringify(bulgu)} (hepsi > 0 olmalı)`);
      await ctx.close();
    }
  } finally { await tar.close(); sv.kapat(); }
  return gecti;
}

const arg = process.argv.slice(2);
const secenek = { goruntu: null, yazma: arg.includes("--yazma") };
const gi = arg.indexOf("--goruntu"); if (gi >= 0) { secenek.goruntu = arg[gi + 1]; mkdirSync(secenek.goruntu, { recursive: true }); }
const adlar = arg.filter((a, i) => !a.startsWith("--") && arg[i - 1] !== "--goruntu");
let tamam = true;
if (arg.includes("--olumsuz")) tamam = await olumsuz();
for (const ad of adlar) tamam = (arg.includes("--etkilesim") ? await etkilesim(ad) : await olc(ad, secenek)) && tamam;
process.exit(tamam ? 0 : 1);
