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
  /* M1 Kullanıcı ve Rol · Personel (2026-09-24) */
  m1: { sayfa: "maket/personel.html", durumlar: [
    { ad: "giriş", sayfa: "maket/giris.html", hash: "#/", kabuksuz: true },
    { ad: "giriş · boş gönderildi", sayfa: "maket/giris.html", hash: "#/", kabuksuz: true, adim: [["tikla", '[data-eylem="gir"]']] },
    { ad: "giriş · yanlış bilgi", sayfa: "maket/giris.html", hash: "#/hata", kabuksuz: true },
    { ad: "giriş · parola sıfırlama", sayfa: "maket/giris.html", hash: "#/unuttum", kabuksuz: true },
    { ad: "giriş · parola belirle, kural dışı", sayfa: "maket/giris.html", hash: "#/parola", kabuksuz: true, adim: [["yaz", "#g-p1", "kisa1"], ["tikla", '[data-eylem="belirle"]']] },
    { ad: "kullanıcılar · liste", sayfa: "maket/kullanicilar.html", hash: "#/" },
    { ad: "kullanıcılar · rol yetkileri", sayfa: "maket/kullanicilar.html", hash: "#/roller" },
    { ad: "kullanıcı · iki rol, plan kabulü eksik", sayfa: "maket/kullanicilar.html", hash: "#/k/ec" },
    { ad: "kullanıcı · rol değişti, kaydedilmedi", sayfa: "maket/kullanicilar.html", hash: "#/k/mk", adim: [["tikla", '[data-rol="planlama"]']] },
    { ad: "kullanıcı · davet bekliyor", sayfa: "maket/kullanicilar.html", hash: "#/k/ok" },
    { ad: "kullanıcı · pasif", sayfa: "maket/kullanicilar.html", hash: "#/k/ns" },
    { ad: "davet penceresi", sayfa: "maket/kullanicilar.html", hash: "#/davet/by", adim: [["tikla", '[data-davet-rol="inspector"]']] },
    { ad: "personel · liste", hash: "#/" },
    { ad: "personel · kart (inspector, eksiksiz)", hash: "#/p/mk" },
    { ad: "personel · kart (EKİPNET eksik)", hash: "#/p/ec" },
    { ad: "personel · kart (planlama, yetkili meslek değil)", hash: "#/p/za" },
    { ad: "personel · yeni form, boş gönderildi (hatalar)", hash: "#/yeni", adim: [["tikla", '[data-eylem="kaydet"]']] },
    { ad: "personel · düzenle (teknisyen seçildi)", hash: "#/p/ke/duzenle" },
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
    { ad: "menüden hazır maket → bağlantı (Personel)", hash: "#/", bekle: 'document.querySelector(\'#a-menu a[href="personel.html"]\') !== null' },
  ],
  m1: [
    { ad: "personel: sayaç görünüme dürüst (15 çalışan)", sayfa: "maket/personel.html", hash: "#/", bekle: 'document.querySelector("#a-sayac").textContent === "15 kişi" && document.querySelectorAll("#a-liste tbody tr").length === 15' },
    { ad: "personel: Inspector çipi 9 / 15", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-cip="inspector"]']], bekle: 'document.querySelector("#a-sayac").textContent === "9 / 15 kişi"' },
    { ad: "personel: Ayrılanlar görünümü süzgeç sayılmaz, Temizle korur", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-secici-ac="durum"]'], ["tikla", '[data-sec="durum"][data-deger="ayrilan"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 kişi" && document.querySelector(".a-temizle").disabled' },
    { ad: "personel: Mekanik ve Elektrik → imkânsız, sebep", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '[data-cip="m"]'], ["tikla", '[data-cip="e"]'], ["tikla", '[data-kip="ve"]']], bekle: '/hem mekanik hem elektrik/.test(document.querySelector("#a-liste .a-bos-baslik").textContent)' },
    { ad: "personel: satır tıklanınca kart açılır", sayfa: "maket/personel.html", hash: "#/", adim: [["tikla", '#a-liste tr[data-href="#/p/mk"] td[data-alan="meslek"]']], bekle: 'location.hash === "#/p/mk" && document.querySelector("#a-nesne h1").textContent === "Mert Kaya"' },
    { ad: "personel formu: teknikerde oda sicil zorunlu değil, iskele seçilemez", sayfa: "maket/personel.html", hash: "#/yeni", adim: [["tikla", "#f-meslek"], ["tikla", '[data-secim="f-meslek"][data-deger="mak-tek"]']], bekle: '/Teknikerde boş/.test(document.querySelector("#f-oda-ipucu").textContent) && document.querySelector(\'[data-yetki="iskele"]\').disabled && !document.querySelector(\'[data-yetki="kaldirma"]\').disabled' },
    { ad: "personel formu: teknisyen → uyarı, hiçbir yetki seçilemez", sayfa: "maket/personel.html", hash: "#/yeni", adim: [["tikla", "#f-meslek"], ["tikla", '[data-secim="f-meslek"][data-deger="teknisyen"]']], bekle: '/Teknisyen yetkili kişi olamaz/.test(document.querySelector("#a-form-gorunum .a-serit-uyari").textContent) && [...document.querySelectorAll("[data-yetki]")].every(e => e.disabled)' },
    { ad: "personel formu: geçerli kayıt karta düşer", sayfa: "maket/personel.html", hash: "#/yeni", adim: [["yaz", "#f-ad", "Deniz Er"], ["yaz", "#f-basla", "01.10.2026"], ["tikla", "#f-meslek"], ["tikla", '[data-secim="f-meslek"][data-deger="elk-tek"]'], ["yaz", "#f-diploma", "2020/11111"], ["tikla", '[data-yetki="elektrik"]'], ["tikla", '[data-eylem="kaydet"]']], bekle: '/^#\\/p\\//.test(location.hash) && document.querySelector("#a-nesne h1").textContent === "Deniz Er"' },
    { ad: "kullanıcılar: Inspector ve Planlama → yalnız çift rollü (1 / 13)", sayfa: "maket/kullanicilar.html", hash: "#/", adim: [["tikla", '[data-cip="inspector"]'], ["tikla", '[data-cip="planlama"]'], ["tikla", '[data-kip="ve"]']], bekle: 'document.querySelector("#a-sayac").textContent === "1 / 13 kullanıcı"' },
    { ad: "kullanıcı: rol eklenir, kaydedilir", sayfa: "maket/kullanicilar.html", hash: "#/k/mk", adim: [["tikla", '[data-rol="planlama"]'], ["tikla", '[data-eylem="rol-kaydet"]']], bekle: 'MV.kisi("mk").hesap.roller.join() === "planlama,inspector" && /Roller kaydedildi/.test(document.querySelector("#a-bildirim-metin").textContent)' },
    { ad: "kullanıcı: teknisyen olmayan planlamacıya Inspector verilemez", sayfa: "maket/kullanicilar.html", hash: "#/k/za", bekle: 'document.querySelector(\'[data-rol="inspector"]\').disabled' },
    { ad: "davet: kişi + rol → davet bekliyor", sayfa: "maket/kullanicilar.html", hash: "#/davet/by", adim: [["tikla", '[data-davet-rol="inspector"]'], ["tikla", '[data-eylem="davet-gonder"]']], bekle: 'location.hash === "#/k/by" && /Davet bekliyor/.test(document.querySelector("#a-nesne .a-nesne-baslik").textContent)' },
    { ad: "davet: rolsüz gönderilemez", sayfa: "maket/kullanicilar.html", hash: "#/davet/by", bekle: 'document.querySelector(\'[data-eylem="davet-gonder"]\').disabled' },
    { ad: "giriş: boş gönderim alanları işaretler", sayfa: "maket/giris.html", hash: "#/", adim: [["tikla", '[data-eylem="gir"]']], bekle: 'document.querySelector("#g-eposta").getAttribute("aria-invalid") === "true" && document.activeElement.id === "g-eposta"' },
    { ad: "giriş: yanlış parola → hesap var mı söylenmez", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-eposta", "biri@firma.example"], ["yaz", "#g-parola", "hata123"], ["tikla", '[data-eylem="gir"]']], bekle: 'location.hash === "#/hata" && /E-posta ya da parola yanlış/.test(document.querySelector(".a-serit").textContent)' },
    { ad: "giriş: parola göster/gizle", sayfa: "maket/giris.html", hash: "#/", adim: [["yaz", "#g-parola", "gizli1"], ["tikla", '[data-eylem="goster"]']], bekle: 'document.querySelector("#g-parola").type === "text" && document.querySelector("#g-parola").value === "gizli1"' },
    { ad: "giriş: sıfırlama gönderildi", sayfa: "maket/giris.html", hash: "#/unuttum", adim: [["yaz", "#g-eposta", "biri@firma.example"], ["tikla", '[data-eylem="sifirla"]']], bekle: 'location.hash === "#/gonderildi" && /kayıtlıysa/.test(document.querySelector(".a-serit").textContent)' },
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
      if (gen === 1080 && d === t.durumlar.filter(x => !x.kabuksuz)[0]) {
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
      /* adres değişimi (hashchange) eşzamansız: sonuç en çok 2 sn beklenir */
      try { await adimlar(s, d.adim); ok = !!(await s.waitForFunction(`(() => { try { return ${d.bekle}; } catch (x) { return false; } })()`, { timeout: 2000 }).catch(() => null)); } catch (e) { hata = String(e.message || e); }
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
