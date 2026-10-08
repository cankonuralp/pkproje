/* probata SERVİS ÇALIŞANI (395; ARKA-UC §4.1 "Planlar listesi ve plan içi (indirilmiş planlar), raporu doldurma … çevrimdışı çalışır", K4 cihaz
   deposu şifreli; maket Z4) — tarayıcıda, firma adresinde. Yalnız aynı kökenden GET:
   · saha sayfaları (Ana sayfa, Planlar, plan içi, rapor): ÖNCE AĞ; gelen sayfa cihaz deposuna ŞİFRELİ yazılır (AES-GCM, uygulamanın kuyrukla aynı
     dışarı alınamaz anahtarı); ağ yoksa son saklanan açılır, o da yoksa "bu sayfa bu cihazda yok" sayfası;
   · uygulamanın kendi dosyaları (/_next/static, /vendor): önce ağ, ağ yoksa son saklanan (veri taşımaz, şifresiz önbellek);
   · /api, giriş, müşteri paneli, yönetim, POST (sunucu eylemleri, kuyruk) DOKUNULMAZ — hep ağ.
   Saklama yanıtı BEKLETMEZ (398 öncesi düzeltme): tarayıcı sayfayı / dosyayı ağdan geldiği gibi akarak alır, kopyası arka planda (waitUntil)
   saklanır — sayfa bitmeden hiçbir şey göstermeyen çalışan yavaş sunucuda sayfayı takılı bırakıyordu (CI 2177156, tablet ısınması).
   Saklanan sayfalar çıkışta ve cihazda başka kişi girince silinir (src/components/cevrimdisi/depo.ts). Depo şeması depo.ts ile ORTAK (aynı ad,
   sürüm, bölmeler — tests/sw.test.ts kilitler). */
/* global self, caches, indexedDB, crypto */

const VT = "probata-cevrimdisi";
const SURUM = 2;
const ISLER = "isler";
const ANAHTAR = "anahtar";
const SAYFALAR = "sayfalar";
const DURUM = "durum";
const STATIK = "probata-statik-1";
/** bağlantısız açılabilen sayfalar (sorgu dizgisi olmadan) */
const SAYFA_YOLLARI = [/^\/$/, /^\/planlar$/, /^\/planlar\/[0-9a-f-]{36}$/, /^\/raporlar\/[0-9a-f-]{36}$/];
const SAKLANAN_BASLIKLAR = ["content-type", "content-security-policy", "x-content-type-options", "referrer-policy", "x-frame-options"];

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad.startsWith("probata-statik-") && ad !== STATIK) await caches.delete(ad);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  /* sayfanın kendisi: gezinme ya da önceden indirme (396 — uygulama bağlantı varken kişinin planlarını açar) */
  const sayfaIstegi = r.mode === "navigate" || r.headers.get("x-probata-onindirme") === "1";
  if (sayfaIstegi && !u.search && SAYFA_YOLLARI.some((x) => x.test(u.pathname))) { e.respondWith(sayfa(e, r, u.pathname)); return; }
  if (u.pathname.startsWith("/_next/static/") || u.pathname.startsWith("/vendor/")) e.respondWith(statik(e, r));
});

async function statik(e, r) {
  try {
    const y = await fetch(r);
    if (y.ok) { const kopya = y.clone(); e.waitUntil(caches.open(STATIK).then((c) => c.put(r, kopya)).catch(() => undefined)); }
    return y;
  } catch (h) {
    const c = await caches.match(r);
    if (c) return c;
    throw h;
  }
}

async function sayfa(e, r, yol) {
  let y;
  try { y = await fetch(r); } catch {
    const s = await sayfaOku(yol).catch(() => null);
    return s ?? yokSayfasi();
  }
  /* yalnız sayfanın kendisi: girişe yönlenen (oturum düştü), hata, başka türde yanıt saklanmaz */
  if (y.ok && !y.redirected && y.type === "basic" && (y.headers.get("content-type") ?? "").startsWith("text/html")) {
    e.waitUntil(sayfaSakla(yol, y.clone()).catch(() => undefined));
  }
  return y;
}

function ac() {
  return new Promise((coz, red) => {
    const r = indexedDB.open(VT, SURUM);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(ISLER)) db.createObjectStore(ISLER, { keyPath: "id" });
      if (!db.objectStoreNames.contains(ANAHTAR)) db.createObjectStore(ANAHTAR);
      if (!db.objectStoreNames.contains(SAYFALAR)) db.createObjectStore(SAYFALAR);
      if (!db.objectStoreNames.contains(DURUM)) db.createObjectStore(DURUM);
    };
    r.onsuccess = () => coz(r.result);
    r.onerror = () => red(r.error);
  });
}
const istek = (q) => new Promise((coz, red) => { q.onsuccess = () => coz(q.result); q.onerror = () => red(q.error); });

/** kuyruğun anahtarı; yoksa sayfa saklanmaz (anahtarı uygulama üretir — depo.ts) */
async function anahtar(db) {
  return istek(db.transaction(ANAHTAR, "readonly").objectStore(ANAHTAR).get("ana"));
}

async function sayfaSakla(yol, y) {
  const db = await ac();
  let k = await anahtar(db);
  if (!k) {
    k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const t = db.transaction(ANAHTAR, "readwrite");
    const once = await istek(t.objectStore(ANAHTAR).get("ana"));
    if (once) k = once; else await istek(t.objectStore(ANAHTAR).put(k, "ana"));
  }
  const govde = new Uint8Array(await y.arrayBuffer());
  /* önce sayfanın uygulama dosyaları, sonra sayfa: sayfa saklandıysa dosyaları da cihazdadır */
  await dosyalariSakla(new TextDecoder().decode(govde)).catch(() => undefined);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sifreli = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, govde);
  const basliklar = SAKLANAN_BASLIKLAR.flatMap((ad) => { const d = y.headers.get(ad); return d ? [[ad, d]] : []; });
  await istek(db.transaction(SAYFALAR, "readwrite").objectStore(SAYFALAR).put({ iv, sifreli, basliklar, zaman: Date.now() }, yol));
}

/** sayfanın kullandığı uygulama dosyaları (betik, stil, yazı tipi — sayfanın içinde ve sunucu bileşeni verisinde adı geçen /_next/static yolları)
    önbellekte yoksa indirilir: önceden indirilen (hiç açılmamış) sayfa da bağlantısız ÇALIŞSIN — yalnız sayfayı saklamak yetmez, yeni yayından
    sonra dosya adları değişir ve sayfanın dosyası cihazda olmaz (CI 2177156, telefon: sayfa göründü, bağlanmadı). Önbellek sınırlı (en eski silinir). */
const STATIK_EN_COK = 600;
async function dosyalariSakla(html) {
  const yollar = new Set();
  for (const m of html.matchAll(/(?:\/_next\/)?(static\/(?:chunks|css|media)\/[^"'\s\\<>]+)/g)) yollar.add(`/_next/${m[1]}`);
  const c = await caches.open(STATIK);
  for (const yol of yollar) {
    const r = new Request(new URL(yol, self.location.origin).href);
    if (await c.match(r)) continue;
    let y;
    try { y = await fetch(r); } catch { return; }
    if (y.ok) await c.put(r, y);
  }
  const anahtarlar = await c.keys();
  for (const eski of anahtarlar.slice(0, Math.max(0, anahtarlar.length - STATIK_EN_COK))) await c.delete(eski);
}

async function sayfaOku(yol) {
  const db = await ac();
  const s = await istek(db.transaction(SAYFALAR, "readonly").objectStore(SAYFALAR).get(yol));
  const k = await anahtar(db);
  if (!s || !k) return null;
  const govde = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s.iv }, k, s.sifreli);
  return new Response(govde, { status: 200, headers: [...s.basliklar, ["x-probata-cevrimdisi", "1"]] });
}

function yokSayfasi() {
  const html = "<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    /* renkler src/styles/tokens.css'ten (--zemin, --yazi, --onay-yazi; açık + koyu) — bu sayfa uygulama stil dosyasını yükleyemez (bağlantı yok) */
    "<title>Bağlantı yok · probata</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:32px 16px;background:#F5F3EE;color:#0F2A3D}" +
    "main{max-width:520px;margin:0 auto}h1{font-size:22px}a{color:#137050;font-weight:600}" +
    "@media (prefers-color-scheme:dark){body{background:#081925;color:#F5F3EE}a{color:#45CC9E}}</style></head><body><main>" +
    "<h1>Bu sayfa bu cihazda yok</h1><p>İnternet bağlantısı yok ve bu sayfa daha önce bu cihazda açılmamış. Bağlantı gelince açılır.</p>" +
    "<p>Daha önce açtığınız saha sayfaları (Planlar, plan içi, raporlar) bağlantısız da açılır; raporda Kaydet ve Onaya gönder cihaza kaydedilir.</p>" +
    "<p><a href=\"/planlar\">Planlar</a></p></main></body></html>";
  return new Response(html, { status: 503, headers: {
    "content-type": "text/html; charset=utf-8", "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  } });
}
