/* SALT OKUNUR maket ölçümü — tarayıcı konsolunda / önizleme bölmesinde çalışır, sayfayı DEĞİŞTİRMEZ.
   Anayasa 11.7–11.8: yatay taşma 0 · sert kırpma 0 · etkileşimli çakışma 0 · ekran dışı 0 · dokunma hedefi.
   Kalıp 10: liste kabı içeriği doldurur. Süzgeç bu projede sabit İKİ satır (üst: arama+seçiciler, alt: çipler).
   2. tur (2026-09-23): görünen görünüm ölçülür — liste (#/) ya da plan içi (#/plan/<id>). Plan içinde ek ölçü:
   görünen birincil tuş sayısı (nesne sayfası: tek birincil, anayasa 2.7) ve telefonda yapışkan eylem çubuğu.
   3. tur (2026-09-23): kalıcı pencere (modal) açıksa etkileşim ölçüleri YALNIZ pencerenin içinde yapılır (arka plan
   etkisizdir); pencerenin içindeki her blok pencereyi doldurur mu (kalıp 10, reisim sorusu 6) → pencereKenar.
   4. tur (2026-09-23): plan içi bir adım çizelgesi; listeler adımın içeriğinde durur (solda adım çizgisi) → kenarFarki
   listenin durduğu adım içeriğiyle kıyaslanır. Süzgeç satır sayısı sabit değil (kalıp 15: sığmayınca seçiciler alta).
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
  /* 4. tur (2026-09-23): kapalı <details>in içeriği kutu döndürür (313×1010 px ölçüldü) ama çizilmez → checkVisibility()
     ile ayıklanır; ilk sürüm katlı kapsam tablosunu görünür sayıp satır yüksekliğini ve kenar farkını ondan ölçüyordu. */
  const gorunur = e => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 1 && b.height > 1 && s.visibility !== "hidden" && s.display !== "none" && (!e.checkVisibility || e.checkVisibility()); };
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
  /* 2026-09-24 (toplu maket): form sayfasının telefondaki yapışkan tuş çubuğu (.a-form-eylem) aynı desen, aynı muafiyet */
  const BILEREK = ".a-cipler, .a-eylem-cubugu-alt, .a-form-eylem";
  const metinSag = n => { const x = document.createRange(); x.selectNodeContents(n); return x.getBoundingClientRect().right; };
  const gercekTasma = e => { const sag = e.getBoundingClientRect().left + e.clientLeft + e.clientWidth + 1;
    return [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim() && metinSag(n) > sag)
      || [...e.querySelectorAll("*")].some(d => !d.closest(BILEREK) && gorunur(d) && d.getBoundingClientRect().right > sag); };
  r.tasanMetin = [...document.querySelectorAll("body *")].filter(e => gorunur(e) && e.textContent.trim() && !e.closest(".a-cipler") && !e.closest(".a-gizli") && !gizliAtada(e)
    && !["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(e.tagName) && getComputedStyle(e).overflowX === "visible" && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && gercekTasma(e))
    .map(e => (e.className || e.id || e.tagName) + ":" + (e.scrollWidth - e.clientWidth) + "px");
  r.ucNoktaKirpma = kirpik.filter(k => k.ellipsis).length;
  r.ucNoktaBasliksiz = kirpik.filter(k => k.ellipsis && !k.baslik).map(k => k.ad);
  const modal = document.querySelector("dialog[open]");
  r.pencere = modal ? modal.id : null;
  const et = [...(modal || document).querySelectorAll("button, a[href], input, textarea")].filter(e => gorunur(e) && !e.closest("dialog:not([open])"));
  const esik = Math.min(r.tusY, 40) - 0.5;
  /* etiketin içindeki onay kutusu: dokunma hedefi etiketin tamamıdır (tıklama kutuyu işaretler) */
  const hedef = e => (e.type === "checkbox" || e.type === "radio") && e.closest("label") ? e.closest("label") : e;
  r.kucukHedef = et.filter(e => !e.closest(".a-kip") && !e.classList.contains("a-ara-sil") && hedef(e).getBoundingClientRect().height < esik)
    .map(e => (e.className || e.tagName) + ":" + Math.round(hedef(e).getBoundingClientRect().height));
  /* 3. tur (2026-09-23): yapışkan çubuk (üst çubuk, plan içinin ve pencerenin alt tuş çubuğu) kaydırılan içeriğin ÜSTÜNDEN
     geçer — tasarım gereği. Muafiyet adla değil kaynakla: farklı yapışkan atası olan iki öğe karşılaştırılmaz. Muafiyetin
     gerçek örtmeyi gizlemediği ayrıca ölçülür: sona kaydırınca (sonCakisma) çakışma 0 olmalı, yoksa son öğe hiç açılmaz. */
  const yapiskanAta = e => { for (let a = e; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === "sticky") return a; return null; };
  const cakismaSay = muaf => { let n = 0; const bs = et.map(e => [e, e.getBoundingClientRect(), yapiskanAta(e)]);
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const [a, A, ya] = bs[i], [b, B, yb] = bs[j]; if (a.contains(b) || b.contains(a)) continue;
      if (muaf && ya !== yb) continue;
      const x = Math.min(A.right, B.right) - Math.max(A.left, B.left), y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (x > 1 && y > 1) n++;
    } return n; };
  r.cakisma = cakismaSay(true);
  /* sonCakisma: ALT tuş çubuğu (plan içi telefonda, pencere altı) varsa kabı sona kaydır; çubuğun içindeki bir öğe ile
     dışındaki bir öğe hâlâ örtüşüyorsa son öğe hiç açılmıyor demektir. Kap kaydırılamıyorsa da sayılır (2026-09-23: ilk
     sürüm yalnız kaydırılabilen kapta sayıyordu; çubuğun kalıcı örtmesi kısa pencerede görünmez kalıyordu). */
  const altCubuk = modal ? modal.querySelector(".a-pencere-alt") : [...document.querySelectorAll(".a-eylem-cubugu-alt, .a-form-eylem")].find(e => getComputedStyle(e).position === "sticky");
  if (altCubuk && gorunur(altCubuk)) {
    const kap = modal || document.scrollingElement, eski = kap.scrollTop; kap.scrollTop = kap.scrollHeight;
    const ic = et.filter(e => altCubuk.contains(e)).map(e => e.getBoundingClientRect()), dis = et.filter(e => !altCubuk.contains(e)).map(e => e.getBoundingClientRect());
    r.sonCakisma = ic.reduce((n, A) => n + dis.filter(B => Math.min(A.right, B.right) - Math.max(A.left, B.left) > 1 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 1).length, 0);
    kap.scrollTop = eski;
  }
  /* 2026-09-23 (2. tur) hata sınıfı: kırpılarak gizlenmiş kabın (a-gizli deseni) içinde etkileşimli öğe = görünmez ama
     odaklanır/tıklanır. Kart kipinde gizlenen tablo başlığındaki sıralama tuşları böyle kalmıştı. */
  r.gizliEtkilesimli = [...(modal || document).querySelectorAll("button, a[href], input, textarea")]
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
  /* 2026-09-24 (toplu maket): kabuksuz sayfa (giriş ekranı) .a-icerik taşımaz → gövde kap sayılır */
  const icEl = document.querySelector(".a-icerik") || document.body;
  const ic = icEl.getBoundingClientRect();
  const li = [...document.querySelectorAll(".a-liste-kap")].filter(gorunur)[0];
  const pad = parseFloat(getComputedStyle(icEl).paddingLeft);
  r.icerik = Math.round(ic.width); r.liste = li ? Math.round(li.getBoundingClientRect().width) : null;
  const cerceve = li && li.closest(".a-adim-icerik");
  r.kenarFarki = li ? Math.round((cerceve ? cerceve.getBoundingClientRect().width : ic.width - 2 * pad) - li.getBoundingClientRect().width) : null;
  const th = li && li.querySelector(".a-tablo thead");
  r.listeKipi = !th ? "(liste yok)" : getComputedStyle(th).display === "none" ? "kart" : "tablo";
  const sz = document.querySelector(".a-suzgec");
  const szc = sz && gorunur(sz) ? [...sz.children].filter(gorunur) : [];
  r.suzgecSatirSayisi = new Set(szc.map(e => Math.round(e.getBoundingClientRect().top))).size;
  const tr = li && li.querySelector(".a-tablo tbody tr");
  r.satirYukseklik = tr ? Math.round(tr.getBoundingClientRect().height) : null;
  /* 2026-09-23 hata sınıfı: `hidden` özniteliği sınıfın display kuralıyla ezilebilir → gizli sanılan öğe görünür kalır */
  if (modal) {
    const g = modal.querySelector(".a-pencere-govde"), gs = getComputedStyle(g);
    const ic = g.clientWidth - parseFloat(gs.paddingLeft) - parseFloat(gs.paddingRight);
    r.pencereGenislik = Math.round(modal.getBoundingClientRect().width);
    /* gövdenin çocukları + düz BLOK kapların (ör. #a-ekle-govde) çocukları; esnek kutunun öğeleri (sekme anahtarı) içerik
       kadardır, sayılmaz (2026-09-23: ilk sürüm iki sekme düğmesini blok sanıp 583 px yanlış alarm verdi) */
    const kaplar = [...g.children].filter(c => c.tagName === "DIV" && getComputedStyle(c).display === "block");
    r.pencereKenar = Math.max(0, ...[...g.children, ...kaplar.flatMap(c => [...c.children])].filter(c => gorunur(c) && (c.tagName === "TEXTAREA" || ["block", "grid", "flex", "list-item"].includes(getComputedStyle(c).display)))
      .map(c => Math.round(Math.abs(ic - c.getBoundingClientRect().width))));
  }
  /* 4. tur (2026-09-23, gözle): hareket listesinde her satır kendi ızgarasını kurunca ikinci sütun "9 Eyl" / "21 Eyl"
     satırlarında kayıyordu. Aynı listenin satırlarında ikinci sütunun sol kenarı tek olmalı (1 px tolerans). */
  r.hizaKaymasi = [...document.querySelectorAll(".a-gecmis")].filter(gorunur).map(ol => {
    const x = [...ol.children].map(li => li.children[1]).filter(e => e && gorunur(e)).map(e => Math.round(e.getBoundingClientRect().left));
    return x.length ? Math.max(...x) - Math.min(...x) : 0;
  }).reduce((a, b) => Math.max(a, b), 0);
  /* 4. tur (2026-09-23, 375'te gözle): tablonun "ilk satırın üst kenarı yok" kuralı kart kipinde de işleyip İLK kartın tuş
     ayırıcısını siliyordu (3. turdan beri; kartlar tek tek bakılmadığı için görülmemişti). Kart kipinde aynı roldeki
     dolu hücrelerin üst kenarı ve iç boşluğu bütün kartlarda aynı olmalı. */
  r.kartTutarsiz = [...document.querySelectorAll(".a-tablo")].filter(gorunur).filter(tb => { const h = tb.querySelector("thead"); return h && getComputedStyle(h).display === "none"; })
    .reduce((n, tb) => { const gor = {};
      for (const td of tb.querySelectorAll("tbody td[data-kart]")) { if (!td.textContent.trim() || !gorunur(td)) continue;
        const s = getComputedStyle(td), k = td.dataset.kart + "|" + (td.className || ""), v = s.borderTopWidth + " " + s.paddingTop + " " + s.marginTop;
        (gor[k] = gor[k] || new Set()).add(v); }
      return n + Object.values(gor).filter(x => x.size > 1).length; }, 0);
  r.gorunenGizli = [...document.querySelectorAll("[hidden]")].filter(e => e.getBoundingClientRect().width > 0).map(e => e.id || e.className);
  if (r.gorunum === "plan") {
    r.birincilSayisi = [...document.querySelectorAll("#a-plan .a-tus-birincil")].filter(gorunur).length;
    const alt = document.querySelector("#a-plan .a-eylem-cubugu-alt");
    r.altCubuk = alt && gorunur(alt) ? getComputedStyle(alt).position + ":" + Math.round(innerHeight - alt.getBoundingClientRect().bottom) + "px" : "yok";
  }
  r.yaziTipi = document.fonts.check("600 15px Sora") ? "Sora yüklü" : "Sora YOK";
  return r;
})()
