/* SALT OKUNUR maket ölçümü — tarayıcı konsolunda / önizleme bölmesinde çalışır, sayfayı DEĞİŞTİRMEZ.
   Anayasa 11.7–11.8: yatay taşma 0 · sert kırpma 0 · etkileşimli çakışma 0 · ekran dışı 0 · dokunma hedefi.
   Kalıp 10: liste kabı içeriği doldurur. Süzgeç bu projede sabit İKİ satır (üst: arama+seçiciler, alt: çipler).
   2. tur (2026-09-23): görünen görünüm ölçülür — liste (#/) ya da plan içi (#/plan/<id>). Plan içinde ek ölçü:
   görünen birincil tuş sayısı (nesne sayfası: tek birincil, anayasa 2.7) ve telefonda yapışkan eylem çubuğu.
   ⛔ Eş zamanlı yazılır (anayasa 11.8): gizli bölmede rAF/setTimeout beklemesi zaman aşımına düşer. */
(() => {
  const r = {};
  const kok = document.documentElement, cs = getComputedStyle(kok);
  r.genislik = innerWidth;
  r.tema = kok.getAttribute("data-tema");
  r.gorunum = document.getElementById("a-plan") && !document.getElementById("a-plan").hidden ? "plan" : "liste";
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
  /* yanlış alarm sınıfları (2026-09-23 ölçüldü): (a) ekran okuyucu için kırpılarak gizlenmiş atanın içi,
     (b) ekran kenarına bilerek taşan öğeler (aşağıda BILEREK). */
  const gizliAtada = e => { for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.position === "absolute" && s.clip === "rect(0px, 0px, 0px, 0px)") return true; } return false; };
  /* 2. tur (2026-09-23): bilerek taşma adla değil KAYNAKLA ayrılır. Telefonda çip şeridi ve plan içinin yapışkan eylem
     çubuğu negatif kenar boşluğuyla ekran kenarına uzanır; ilk sürüm yalnız `.a-suzgec`i muaf tutuyordu, yeni kaplar
     (#a-liste-gorunum, #a-plan) aynı yanlış alarmı verdi. Kural: taşma, bilerek taşan öğeler DIŞINDAKİ bir torundan
     geliyorsa sayılır. */
  const BILEREK = ".a-cipler, .a-eylem-cubugu-alt";
  const metinSag = n => { const x = document.createRange(); x.selectNodeContents(n); return x.getBoundingClientRect().right; };
  const gercekTasma = e => { const sag = e.getBoundingClientRect().left + e.clientLeft + e.clientWidth + 1;
    return [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim() && metinSag(n) > sag)
      || [...e.querySelectorAll("*")].some(d => !d.closest(BILEREK) && gorunur(d) && d.getBoundingClientRect().right > sag); };
  r.tasanMetin = [...document.querySelectorAll("body *")].filter(e => gorunur(e) && e.textContent.trim() && !e.closest(".a-cipler") && !e.closest(".a-gizli") && !gizliAtada(e)
    && !["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(e.tagName) && getComputedStyle(e).overflowX === "visible" && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && gercekTasma(e))
    .map(e => (e.className || e.id || e.tagName) + ":" + (e.scrollWidth - e.clientWidth) + "px");
  r.ucNoktaKirpma = kirpik.filter(k => k.ellipsis).length;
  r.ucNoktaBasliksiz = kirpik.filter(k => k.ellipsis && !k.baslik).map(k => k.ad);
  const et = [...document.querySelectorAll("button, a[href], input, textarea")].filter(e => gorunur(e) && !e.closest("dialog:not([open])"));
  const esik = Math.min(r.tusY, 40) - 0.5;
  r.kucukHedef = et.filter(e => !e.closest(".a-kip") && !e.classList.contains("a-ara-sil") && e.getBoundingClientRect().height < esik)
    .map(e => (e.className || e.tagName) + ":" + Math.round(e.getBoundingClientRect().height));
  let cakisma = 0; const bs = et.map(e => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const [a, A] = bs[i], [b, B] = bs[j]; if (a.contains(b) || b.contains(a)) continue;
    /* telefonda yapışkan alt çubuk içeriğin ÜSTÜNDE durur (tasarım gereği); altında kalan öğe kaydırınca açılır */
    if (a.closest(".a-eylem-cubugu-alt") !== b.closest(".a-eylem-cubugu-alt")) continue;
    const x = Math.min(A.right, B.right) - Math.max(A.left, B.left), y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (x > 1 && y > 1) cakisma++;
  }
  r.cakisma = cakisma;
  /* 2026-09-23 (2. tur) hata sınıfı: kırpılarak gizlenmiş kabın (a-gizli deseni) içinde etkileşimli öğe = görünmez ama
     odaklanır/tıklanır. Kart kipinde gizlenen tablo başlığındaki sıralama tuşları böyle kalmıştı. */
  r.gizliEtkilesimli = [...document.querySelectorAll("button, a[href], input, textarea")]
    .filter(e => !e.closest("dialog:not([open])") && getComputedStyle(e).display !== "none" && e.getClientRects().length && gizliAtada(e))
    .map(e => (e.className || e.tagName) + "[" + e.textContent.trim().slice(0, 20) + "]");
  /* 2026-09-23 (2. tur, 375'te gözle): arama ipucu "Proje, müşteri, adres" kutuya sığmayıp "adr" diye kesildi; giriş
     kutuları yukarıdaki denetimlerin dışında olduğu için ölçüm görmedi → ipucu metni kutunun iç genişliğiyle kıyaslanır. */
  const tuval = document.createElement("canvas").getContext("2d");
  r.ipucuKesik = [...document.querySelectorAll("input[placeholder], textarea[placeholder]")].filter(gorunur).filter(e => {
    const s = getComputedStyle(e); tuval.font = s.fontWeight + " " + s.fontSize + " " + s.fontFamily;
    return tuval.measureText(e.placeholder).width > e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 1;
  }).map(e => e.id + ":" + e.placeholder);
  r.ekranDisi = et.filter(e => { if (e.closest(".a-cipler") || e.closest(".a-cubuk")) return false; const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; }).length;
  const tus = [...document.querySelectorAll(".a-tus")].filter(gorunur).map(e => e.getBoundingClientRect());
  r.tusGenislik = tus.length ? [Math.round(Math.min(...tus.map(b => b.width))), Math.round(Math.max(...tus.map(b => b.width)))] : null;
  r.tusYukseklik = tus.length ? Math.round(tus[0].height) : null;
  const ic = document.querySelector(".a-icerik").getBoundingClientRect();
  const li = [...document.querySelectorAll(".a-liste-kap")].filter(gorunur)[0];
  const pad = parseFloat(getComputedStyle(document.querySelector(".a-icerik")).paddingLeft);
  r.icerik = Math.round(ic.width); r.liste = li ? Math.round(li.getBoundingClientRect().width) : null;
  r.kenarFarki = li ? Math.round(ic.width - 2 * pad - li.getBoundingClientRect().width) : null;
  const th = li && li.querySelector(".a-tablo thead");
  r.listeKipi = !th ? "(liste yok)" : getComputedStyle(th).display === "none" ? "kart" : "tablo";
  const sz = document.querySelector(".a-suzgec");
  const szc = sz && gorunur(sz) ? [...sz.children].filter(gorunur) : [];
  r.suzgecSatirSayisi = new Set(szc.map(e => Math.round(e.getBoundingClientRect().top))).size;
  const tr = li && li.querySelector(".a-tablo tbody tr");
  r.satirYukseklik = tr ? Math.round(tr.getBoundingClientRect().height) : null;
  /* 2026-09-23 hata sınıfı: `hidden` özniteliği sınıfın display kuralıyla ezilebilir → gizli sanılan öğe görünür kalır */
  r.gorunenGizli = [...document.querySelectorAll("[hidden]")].filter(e => e.getBoundingClientRect().width > 0).map(e => e.id || e.className);
  if (r.gorunum === "plan") {
    r.birincilSayisi = [...document.querySelectorAll("#a-plan .a-tus-birincil")].filter(gorunur).length;
    const alt = document.querySelector("#a-plan .a-eylem-cubugu-alt");
    r.altCubuk = alt && gorunur(alt) ? getComputedStyle(alt).position + ":" + Math.round(innerHeight - alt.getBoundingClientRect().bottom) + "px" : "yok";
  }
  r.yaziTipi = document.fonts.check("600 15px Sora") ? "Sora yüklü" : "Sora YOK";
  return r;
})()
