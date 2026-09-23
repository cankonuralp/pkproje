/* SALT OKUNUR maket ölçümü — tarayıcı konsolunda / önizleme bölmesinde çalışır, sayfayı DEĞİŞTİRMEZ.
   Anayasa 11.7–11.8: yatay taşma 0 · sert kırpma 0 · etkileşimli çakışma 0 · ekran dışı 0 · dokunma hedefi.
   Kalıp 10: liste kabı içeriği doldurur. Süzgeç bu projede sabit İKİ satır (üst: arama+seçiciler, alt: çipler). */
(() => {
  const r = {};
  const kok = document.documentElement, cs = getComputedStyle(kok);
  r.genislik = innerWidth;
  r.tema = kok.getAttribute("data-tema");
  r.tusY = parseFloat(cs.getPropertyValue("--tus-y"));
  r.yatayTasma = kok.scrollWidth - innerWidth;
  /* 1 px ve altı: ekran okuyucu için bilerek gizlenmiş öğe (a-gizli, kart kipinde tablo başlığı) — görünür sayılmaz */
  const gorunur = e => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 1 && b.height > 1 && s.visibility !== "hidden" && s.display !== "none"; };
  const kirpik = [];
  for (const e of document.querySelectorAll("body *")) {
    if (!gorunur(e) || !e.textContent.trim()) continue;
    const s = getComputedStyle(e);
    if (s.overflowX === "visible" || e.scrollWidth <= e.clientWidth + 1) continue;
    if (e.closest(".a-cipler") || e.closest(".a-gizli")) continue;   /* çip şeridi telefonda bilerek kayar; a-gizli bilerek gizli */
    kirpik.push({ ad: e.className || e.tagName, ellipsis: s.textOverflow === "ellipsis", baslik: !!(e.title || e.closest("[title]")) });
  }
  r.sertKirpma = kirpik.filter(k => !k.ellipsis).map(k => k.ad);
  /* 2026-09-23: taşması GÖRÜNÜR metin de sayılır — kutusundan taşıp komşusunun altında kalan metin (375'te saat,
     rozetin altında "12:3" diye kesildi; ilk sürüm yalnız overflow:hidden kutuları saydığı için kaçırmıştı). */
  /* yanlış alarm sınıfları (2026-09-23 ölçüldü): (a) ekran okuyucu için kırpılarak gizlenmiş atanın içi (kart kipinde
     thead), (b) .a-suzgec: telefonda çip şeridi ekran kenarına bilerek taşar (negatif kenar boşluğu). */
  const gizliAtada = e => { for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.position === "absolute" && s.clip === "rect(0px, 0px, 0px, 0px)") return true; } return false; };
  r.tasanMetin = [...document.querySelectorAll("body *")].filter(e => gorunur(e) && e.textContent.trim() && !e.closest(".a-cipler") && !e.closest(".a-gizli") && !gizliAtada(e) && !e.matches(".a-suzgec")
    && !["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(e.tagName) && getComputedStyle(e).overflowX === "visible" && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0)
    .map(e => (e.className || e.tagName) + ":" + (e.scrollWidth - e.clientWidth) + "px");
  r.ucNoktaKirpma = kirpik.filter(k => k.ellipsis).length;
  r.ucNoktaBasliksiz = kirpik.filter(k => k.ellipsis && !k.baslik).map(k => k.ad);
  const et = [...document.querySelectorAll("button, a[href], input, textarea")].filter(e => gorunur(e) && !e.closest("dialog:not([open])"));
  const esik = Math.min(r.tusY, 40) - 0.5;
  r.kucukHedef = et.filter(e => !e.closest(".a-kip") && !e.classList.contains("a-ara-sil") && e.getBoundingClientRect().height < esik)
    .map(e => (e.className || e.tagName) + ":" + Math.round(e.getBoundingClientRect().height));
  let cakisma = 0; const bs = et.map(e => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const [a, A] = bs[i], [b, B] = bs[j]; if (a.contains(b) || b.contains(a)) continue;
    const x = Math.min(A.right, B.right) - Math.max(A.left, B.left), y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (x > 1 && y > 1) cakisma++;
  }
  r.cakisma = cakisma;
  r.ekranDisi = et.filter(e => { if (e.closest(".a-cipler") || e.closest(".a-cubuk")) return false; const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; }).length;
  const tus = [...document.querySelectorAll(".a-tus")].filter(gorunur).map(e => e.getBoundingClientRect());
  r.tusGenislik = tus.length ? [Math.round(Math.min(...tus.map(b => b.width))), Math.round(Math.max(...tus.map(b => b.width)))] : null;
  r.tusYukseklik = tus.length ? Math.round(tus[0].height) : null;
  const ic = document.querySelector(".a-icerik").getBoundingClientRect(), li = document.querySelector(".a-liste-kap").getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(document.querySelector(".a-icerik")).paddingLeft);
  r.icerik = Math.round(ic.width); r.liste = Math.round(li.width); r.kenarFarki = Math.round(ic.width - 2 * pad - li.width);
  const th = document.querySelector(".a-tablo thead");
  r.listeKipi = !th ? "(liste yok)" : getComputedStyle(th).position === "absolute" ? "kart" : "tablo";
  const sz = [...document.querySelector(".a-suzgec").children].filter(gorunur);
  r.suzgecSatirSayisi = new Set(sz.map(e => Math.round(e.getBoundingClientRect().top))).size;
  r.suzgecGenislik = sz.map(e => (e.className.split(" ")[0] || e.tagName) + ":" + Math.round(e.getBoundingClientRect().width)).join(" ");
  const tr = document.querySelector(".a-tablo tbody tr");
  r.satirYukseklik = tr ? Math.round(tr.getBoundingClientRect().height) : null;
  /* 2026-09-23 hata sınıfı: `hidden` özniteliği sınıfın display kuralıyla ezilebilir → gizli sanılan öğe görünür kalır */
  r.gorunenGizli = [...document.querySelectorAll("[hidden]")].filter(e => e.getBoundingClientRect().width > 0).map(e => e.id || e.className);
  r.yaziTipi = document.fonts.check("600 15px Sora") ? "Sora yüklü" : "Sora YOK";
  return r;
})()
