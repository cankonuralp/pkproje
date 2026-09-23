/* SALT OKUNUR uygulama ölçümü — tarayıcıda (önizleme bölmesi) koşar, sayfayı DEĞİŞTİRMEZ. tools/olc-maket.js'in
   uygulamaya uyarlanmışı (maket sınıf adları yerine uygulamanın yapısı: aside · nav · header · main).
   Anayasa 11.7–11.8: yatay taşma 0 · sert kırpma 0 · taşan metin 0 · etkileşimli çakışma 0 · ekran dışı 0 · dokunma hedefi.
   Kalıp 10: içerik kabı doldurur (kenar farkı 0). İskelette eklenen: ekran dışında kalıp ODAKLANABİLEN öğe (kapalı çekmece
   klavyeyle gezilebiliyordu) · masaüstünde menü kaydırmasız sığıyor mu.
   ⛔ Eş zamanlı yazılır (anayasa 11.8): gizli bölmede zamanlayıcılar kısılır. */
(() => {
  const r = {};
  const kok = document.documentElement, cs = getComputedStyle(kok);
  r.genislik = innerWidth;
  r.tema = kok.getAttribute("data-tema");
  r.tusY = parseFloat(cs.getPropertyValue("--tus-y"));
  r.yatayTasma = Math.max(0, kok.scrollWidth - kok.clientWidth);
  const gorunur = (e) => {
    const b = e.getBoundingClientRect(), s = getComputedStyle(e);
    return b.width > 1 && b.height > 1 && s.visibility !== "hidden" && s.display !== "none" && (!e.checkVisibility || e.checkVisibility());
  };
  const gizliKirpik = (e) => e.closest(".gizli");
  const ad = (e) => (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 24);

  const kirpik = [];
  for (const e of document.querySelectorAll("body *")) {
    if (!gorunur(e) || !e.textContent.trim() || gizliKirpik(e)) continue;
    const s = getComputedStyle(e);
    if (s.overflowX === "visible" || e.scrollWidth <= e.clientWidth + 1) continue;
    kirpik.push({ ad: ad(e), ellipsis: s.textOverflow === "ellipsis", baslik: !!(e.title || e.closest("[title]")) });
  }
  r.sertKirpma = kirpik.filter((k) => !k.ellipsis).map((k) => k.ad);
  r.ucNoktaKirpma = kirpik.filter((k) => k.ellipsis).map((k) => k.ad);

  const metinSag = (n) => { const x = document.createRange(); x.selectNodeContents(n); return x.getBoundingClientRect().right; };
  r.tasanMetin = [...document.querySelectorAll("body *")].filter((e) => gorunur(e) && e.textContent.trim() && !gizliKirpik(e)
    && !["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(e.tagName) && getComputedStyle(e).overflowX === "visible"
    && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0
    && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() && metinSag(n) > e.getBoundingClientRect().right + 1))
    .map(ad);

  const et = [...document.querySelectorAll("a[href], button, input, textarea, select, [tabindex]")].filter(gorunur);
  const esik = Math.min(r.tusY, 40) - 0.5;
  r.kucukHedef = et.filter((e) => e.getBoundingClientRect().height < esik).map((e) => ad(e) + ":" + Math.round(e.getBoundingClientRect().height));
  r.ekranDisi = et.filter((e) => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; }).map(ad);
  const sabitAta = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === "sticky" || p === "fixed") return a; } return null; };
  let cakisma = 0;
  const bs = et.map((e) => [e, e.getBoundingClientRect(), sabitAta(e)]);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const [a, A, ya] = bs[i], [b, B, yb] = bs[j];
    if (a.contains(b) || b.contains(a) || ya !== yb) continue;
    if (Math.min(A.right, B.right) - Math.max(A.left, B.left) > 1 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 1) cakisma++;
  }
  r.cakisma = cakisma;

  // ekran dışında (görünmez) olduğu hâlde klavyeyle odaklanabilen öğe
  const odaklanir = [...document.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])")];
  r.gizliOdak = odaklanir.filter((e) => {
    const s = getComputedStyle(e), b = e.getBoundingClientRect();
    if (s.visibility === "hidden" || s.display === "none" || !e.getClientRects().length || e.closest("[inert]")) return false;
    return b.right <= 0 || b.left >= innerWidth;
  }).map(ad);

  const icerik = document.querySelector("main");
  if (icerik) {
    const ps = getComputedStyle(icerik);
    const ic = icerik.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    const bloklar = [...icerik.children].filter(gorunur).filter((c) => ["block", "flex", "grid"].includes(getComputedStyle(c).display));
    r.kenarFarki = bloklar.length ? Math.max(...bloklar.map((c) => Math.round(Math.abs(ic - c.getBoundingClientRect().width)))) : null;
  }
  const nav = document.querySelector("aside nav");
  r.menu = nav ? { madde: nav.querySelectorAll("a").length, gorunur: gorunur(nav), kayma: Math.max(0, nav.scrollHeight - nav.clientHeight) } : null;
  const aside = document.querySelector("aside");
  r.cekmece = aside ? getComputedStyle(aside).position : null;
  r.yaziTipi = document.fonts.check("600 14px Sora") ? "Sora yüklü" : "Sora YOK";
  return r;
})();
