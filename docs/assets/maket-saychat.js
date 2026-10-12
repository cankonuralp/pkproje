/* ══ probata MAKET — S.A.Y Chat (2026-10-13) · ONAY BEKLİYOR ═════════════════════════════════════════════════════════════════════════
   Kaynak: reisim'le bulut oturumunda 7 tur (2026-10-12), ön model docs/maket/say-chat-onmodel.html (12 ekran + "Konuşulan kurallar"); kararlar
   pkproje.md §3.10. Bu dosya ekran 1–10: 1 planın sohbeti · 2–5 fotoğraf ve ekipman seçimi (Plandan seç / Yeni ekle, branşa göre) · 6–7 yönerge,
   numaralı mesaj, okunacak fotoğraflar · 8 etiketten okuma (isteğe bağlı, kota uyarısı) · 9 geçmişten düzenleme · 10 bekleyenler için rapor yaz.
   (11 S.A.Y asistana fotoğraf / belge eki → maket-say.js · 12 tür ayarları → maket-turler.js.)
   · Yer: plan içinde, S.A.Y düğmesinin yanında "S.A.Y Chat"; o planın sohbeti açılır, geçmişi plana bağlı.
   · KİŞİYE ÖZEL: sohbeti yalnız kaydı yazan denetçi görür (plan sorumlusu, teknik yönetici, yönetici görmez). Makette "Makette bakış" ile planın
     denetçileri arasında geçilir — branşa göre listeler denensin diye (uygulamada herkes yalnız kendi sohbetini görür).
   · Bir kayıt = bir ekipman: fotoğraf çek → Ekipman seçin (Plandan seç: plandaki, branşına uygun, raporu yazılmamış · Yeni ekle: branşındaki,
     rapor formatı kurulmuş türler; rapor yazılırken plana eklenir) → yönerge + numaralı mesaj (n. satır = yönergenin n. maddesi; "-" ya da boş =
     bilinmiyor; fazla satırlar nota; hazır değerli satır dolu gelir) → okunacak fotoğraflar → Gönder. Satırları alana dağıtmak KURALLA (ücretsiz).
   · Yapay zekâ yalnız fotoğraf okur: etiket fotoğrafı (isteğe bağlı, eklerken kota uyarısıyla) · okunacak fotoğraflar (rapor yazılırken).
   · Çevrimdışıyken kayıt cihazda birikir ("Cihazda"), bağlantı gelince gider ("Gönderildi"); rapor yazmak internet ister (numara sunucuda).
   · Rapor yazılınca kayıt sohbetten silinir; ekipman fotoğrafları rapora geçer, etiket fotoğrafı konmaz, okunan fotoğraflar raporda okuma
     fotoğrafı olarak kalır (belgeye basılmaz). Tamamlanmış planda yeni rapor yok (519) — koşullarda söylenir.
   Makette fotoğrafın adı kayıtta kalır, görüntüsü yalnız bu oturumda (tarayıcının belleğinde). Veri UYDURMA. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem, P = function () { return MK.planIci; };
  if (!P()) return;   /* yalnız Planlar maketinde (plan içi) */

  var C = { acik: false, ekran: "sohbet", kim: {}, t: null, mod: null, kod: {}, sekme: "plan", ara: "", etiket: null };
  var GORUNTU = {}, sayac = 0;   /* dosya adı → görüntü (yalnız bu oturum) */
  var bos = function (v) { v = String(v == null ? "" : v).trim(); return !v || v === "-"; };
  var gorunurAd = function (ad) { return String(ad).replace(/^sc\d+-/, ""); };
  var plan = function () { return P().aktif(); };
  var brans = function (k) { var x = P().kisi(k); return !x ? null : x.brans === "Mekanik" ? "m" : x.brans === "Elektrik" ? "e" : null; };
  var denetciler = function (p) { return p.ekip.filter(function (k) { return brans(k); }); };
  var kayitlar = function (p, k) { return MV.SAY_CHAT.filter(function (x) { return x.plan === p.id && x.kisi === k; }); };
  function kim(p) {
    if (C.kim[p.id] && denetciler(p).indexOf(C.kim[p.id]) >= 0) return C.kim[p.id];
    var d = denetciler(p), varsa = d.filter(function (k) { return kayitlar(p, k).length; })[0];
    return varsa || (d.indexOf(MK.BEN) >= 0 ? MK.BEN : d[0]);
  }
  var turAd = function (k) { var t = MV.tur(k); return t ? t.ad : k; };
  var formatAd = function (k) { var t = MV.tur(k); return t && t.format ? t.format : "Firma"; };
  var ekipAd = function (x) { return x.ekipman.tip === "plan" ? x.ekipman.kod + " · " + turAd(x.ekipman.tur) : turAd(x.ekipman.tur) + " (yeni)"; };
  var saat = function (z) { return z ? z.slice(11, 16) : ""; };
  var basliklar = function (t) { var o = {}; MV.sayChatBasliklar(t).forEach(function (b) { o[b[0]] = b; }); return o; };
  var acikBasliklar = function (x) { var b = basliklar(MV.tur(x.ekipman.tur)); return (x.tanim.okunacak || []).filter(function (o) { return o.acik && b[o.k]; }).map(function (o) { return b[o.k]; }); };
  var okunacakSay = function (x) { return Object.keys(x.okunacak || {}).reduce(function (n, k) { return n + x.okunacak[k].length; }, 0); };
  /* kota (Firma ayarları › Yapay zekâ; kişi başı aylık sınır) */
  function kota(k) {
    var z = MV.yz(), u = MV.YZ_KULLANIM.filter(function (y) { return y.k === k; })[0], para = function (v) { return String(Math.round(v * 100) / 100).replace(".", ",") + " $"; };
    return "bu ay " + para(u ? u.usd : 0) + " / " + (z.sinir === "" || !(+z.sinir > 0) ? "sınırsız" : para(+z.sinir));
  }

  /* satırları alana dağıtma — KURAL (yapay zekâ yok): n. satır yönergenin n. maddesi; "-" ya da boş = bilinmiyor; fazla satırlar nota eklenir */
  function dagit(x) {
    var s = x.tanim.satirlar, l = [], fazla = [], deger = {};
    s.forEach(function (st, i) {
      var v = String(x.mesaj[i] || "").trim(), b = bos(v);
      l.push({ i: i, ad: st.ad, alan: st.alan, deger: b ? "" : v, hazir: !b && !!st.hazir && v === String(st.hazir).trim() });
      if (!b) deger[st.alan] = deger[st.alan] ? deger[st.alan] + " · " + v : v;
    });
    x.mesaj.slice(s.length).forEach(function (v, j) { if (!bos(v)) fazla.push({ i: s.length + j, deger: String(v).trim() }); });
    if (fazla.length) deger.yorum = [deger.yorum].concat(fazla.map(function (f) { return f.deger; })).filter(Boolean).join(" · ");
    return { satirlar: l, fazla: fazla, deger: deger };
  }
  function yeniKayit(p, k, foto) {
    return { id: "sc" + Date.now().toString(36) + (++sayac), plan: p.id, kisi: k, zaman: null, durum: "taslak", ekipman: null, foto: foto, etiket: null, mesaj: [], okunan: [], okunacak: {}, tanim: null };
  }
  /* tür seçilince yönerge o türün ayarından gelir; kayıt tanımı taşır (sonradan ayar değişse de kendi tanımıyla okunur); hazır değerli satır dolu */
  function tanimAta(x, turK) {
    var a = MV.sayChatAyar(MV.tur(turK));
    x.tanim = { surum: a.surum, satirlar: a.satirlar.map(function (s) { return Object.assign({}, s); }), okunacak: a.okunacak.map(function (o) { return Object.assign({}, o); }) };
    x.mesaj = x.tanim.satirlar.map(function (s) { return s.hazir || ""; }); x.okunan = [];
    var acik = x.tanim.okunacak.filter(function (o) { return o.acik; }).map(function (o) { return o.k; });
    Object.keys(x.okunacak).forEach(function (kk) { if (acik.indexOf(kk) < 0) delete x.okunacak[kk]; });
  }

  /* ── KABUK: düğme (S.A.Y'ın yanında) ve panel ───────────────────────────────────────────────────────────────────────────────────── */
  var grup = document.querySelector(".a-fab-grup");
  if (!grup) { grup = document.createElement("div"); grup.className = "a-fab-grup"; grup.setAttribute("data-katman", ""); document.body.appendChild(grup); }
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "a-say-fab a-sc-fab"; fab.id = "a-sc-fab"; fab.hidden = true; fab.setAttribute("data-eylem", "sc-ac");
  fab.setAttribute("aria-haspopup", "dialog"); fab.setAttribute("aria-controls", "a-saychat"); fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-label", "S.A.Y Chat — planın sohbeti");
  fab.innerHTML = '<span class="a-say-fab-ikon">' + ikon("message-square-text") + '</span><span class="a-say-fab-yazi">S.A.Y<small>Chat</small></span>';
  grup.appendChild(fab);
  var kap = document.createElement("aside");
  kap.className = "a-say a-saychat"; kap.id = "a-saychat"; kap.hidden = true; kap.setAttribute("data-katman", "");
  kap.setAttribute("role", "dialog"); kap.setAttribute("aria-labelledby", "a-sc-baslik");
  document.body.appendChild(kap);
  /* ekipman seçimi ve etiket okuma pencereleri */
  function pencere(id, baslikId) {
    var d = document.createElement("dialog"); d.className = "a-pencere"; d.id = id; d.setAttribute("aria-labelledby", baslikId);
    d.innerHTML = '<div class="a-pencere-bas"><h2 id="' + baslikId + '"></h2><button class="a-ikon-tus" type="button" data-eylem="pencere-kapat" aria-label="Kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-pencere-govde" id="' + id + '-govde"></div><div class="a-pencere-alt" id="' + id + '-alt"></div>';
    document.body.appendChild(d); return d;
  }
  var penEk = pencere("a-sc-pencere", "a-sc-pencere-baslik"), penEt = pencere("a-sc-etiket", "a-sc-etiket-baslik");

  var durumOk = function (p) { return p && (p.durum === "kabul" || p.durum === "denetimde" || p.durum === "tamam") && denetciler(p).length > 0; };
  function fabGuncelle() {
    var p = plan();
    if (C.acik && (!p || p.id !== C.plan)) kapat(true);
    fab.hidden = !durumOk(p) || C.acik; fab.setAttribute("aria-expanded", String(C.acik));
  }
  function ac() {
    var p = plan(); if (!durumOk(p)) return;
    if (MK.sayAcik && MK.sayAcik() && MK.sayKapat) MK.sayKapat(true);   /* aynı yerde iki panel olmasın */
    C.acik = true; C.plan = p.id; C.ekran = "sohbet"; C.t = null; kap.hidden = false; document.body.classList.add("a-say-acik"); ciz(); fabGuncelle();
    var o = kap.querySelector("[data-sc-ilk]") || kap.querySelector("[data-eylem=sc-kapat]"); if (o) o.focus();
  }
  function kapat(sessiz) {
    C.acik = false; C.t = null; kap.hidden = true; document.body.classList.remove("a-say-acik"); fabGuncelle(); if (!sessiz && !fab.hidden) fab.focus();
  }
  MK.sayChatAcik = function () { return C.acik; };
  MK.sayChatKapat = function () { if (C.acik) kapat(true); };
  window.addEventListener("hashchange", function () { setTimeout(fabGuncelle, 0); });
  document.addEventListener("click", function () { setTimeout(fabGuncelle, 0); });

  /* ── ÇİZİM ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
  function foto(ad, sil) {
    var u = GORUNTU[ad], g = gorunurAd(ad);
    return '<li class="a-sc-foto" title="' + kacis(g) + '">' + (u ? '<img src="' + u + '" alt="' + kacis(g) + '">' : ikon("camera") + '<span class="a-sc-foto-ad">' + kacis(g) + "</span>") +
      (sil ? '<button class="a-sc-foto-sil" type="button" data-eylem="sc-foto-sil" data-ne="' + sil + '" data-ad="' + kacis(ad) + '" aria-label="' + kacis(g) + ' kaldır" title="Kaldır">' + ikon("x", "a-ikon-kucuk") + "</button>" : "") + "</li>";
  }
  var dosyaTus = function (ne, ad, sinif, ik, ilk) {
    return '<label class="' + sinif + '"' + (ilk ? " data-sc-ilk" : "") + '><input type="file" accept="image/*" capture="environment" class="a-gizli" data-sc-dosya="' + ne + '">' + ikon(ik || "camera", "a-ikon-kucuk") + "<span>" + ad + "</span></label>";
  };
  var fotolar = function (l, ne, ekle) { return '<ul class="a-sc-fotolar">' + l.map(function (a) { return foto(a, ne); }).join("") + (ekle ? '<li>' + dosyaTus(ne === "foto" ? "foto" : ne, ekle, "a-sc-ekle") + "</li>" : "") + "</ul>"; };

  function kayitHtml(x) {
    var d = dagit(x), b = basliklar(MV.tur(x.ekipman.tur)), ok = Object.keys(x.okunacak || {}).filter(function (k) { return x.okunacak[k].length && b[k]; });
    var satir = d.satirlar.filter(function (s) { return s.deger && s.alan !== "yorum"; }).slice(0, 4).map(function (s) { return "<div><b>" + kacis(s.ad) + ":</b> " + kacis(s.deger) + "</div>"; });
    if (d.deger.yorum) satir.push("<div><b>Not:</b> " + kacis(d.deger.yorum) + "</div>");
    var gitti = x.durum === "gonderildi";
    return '<li class="a-sc-kayit">' + fotolar(x.foto.slice(0, 4), null) +
      '<p class="a-sc-kayit-bas"><span>' + kacis(ekipAd(x)) + "</span>" + MK.rozet({ ad: formatAd(x.ekipman.tur), rozet: "a-rozet-notr" }) + "</p>" +
      (satir.length ? '<div class="a-sc-ozet">' + satir.join("") + "</div>" : "") +
      (ok.length ? '<div class="a-sc-cipler">' + ok.map(function (k) { return '<span class="a-sc-cip">' + ikon("scan-text", "a-ikon-kucuk") + kacis(b[k][1]) + (x.okunacak[k].length > 1 ? " · " + x.okunacak[k].length : "") + "</span>"; }).join("") + "</div>" : "") +
      '<div class="a-sc-kayit-alt"><span class="a-sc-durum ' + (gitti ? "a-sc-durum-gitti" : "a-sc-durum-cihaz") + '">' + ikon(gitti ? "circle-check" : "wifi-off", "a-ikon-kucuk") +
        (gitti ? "Gönderildi" : "Cihazda") + " · " + saat(x.zaman) + "</span>" + MK.tus({ eylem: "sc-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil", veri: { id: x.id } }) + "</div></li>";
  }

  function sohbetHtml(p, k) {
    var l = kayitlar(p, k), cihazda = l.filter(function (x) { return x.durum === "cihazda"; }).length;
    return {
      govde: (MK.cevrimdisi() ? MK.serit("uyari", "wifi-off", "Çevrimdışı · " + (cihazda ? cihazda + " kayıt cihazda bekliyor; bağlantı gelince gider." : "kayıtlar cihazda birikir, bağlantı gelince gider.")) : "") +
        (l.length ? '<p class="a-sc-ara">Yalnız sizin bekleyen kayıtlarınız · raporu yazılanlar burada görünmez</p><ol class="a-sc-liste">' + l.map(kayitHtml).join("") + "</ol>" +
          '<div class="a-sc-tuslar">' + MK.tus({ eylem: "sc-rapor", ad: "Bekleyenler için rapor yaz (" + l.length + ")", ikon: "file-plus", sinif: "a-tus-ikincil" }) + "</div>"
          : '<p class="a-say-bos">Sahada her ekipman için bir kayıt: önce ekipmanın fotoğrafını çekin, sonra hangi ekipman olduğunu seçin ve yönergedeki sırayla mesajı yazın. ' +
            "İnternet olmasa da kayıt cihazda birikir; sonra “Bekleyenler için rapor yaz” ile rapor taslakları oluşur.</p>"),
      alt: '<div class="a-sc-yeni">' + dosyaTus("yeni", "Fotoğraf çek", "a-tus a-tus-birincil", "camera", true) + '<span class="a-say-not">Yeni kayıt: önce ekipmanın fotoğrafını çekin.</span></div>' +
        '<p class="a-say-not">Bu sohbeti yalnız siz görürsünüz; plan sorumlusu, teknik yönetici ve yönetici görmez.</p>'
    };
  }

  function secimHtml() {
    var x = C.t;
    return {
      govde: '<h3 class="a-sc-adim" tabindex="-1">' + (C.mod === "yeni" ? "Yeni kayıt · 1 / 2 · Hangi ekipman?" : "Ekipman") + "</h3>" +
        '<p class="a-sc-ara">Ekipman fotoğrafları</p>' + fotolar(x.foto, "foto", "+ ek") +
        '<p class="a-sc-ara">Bu hangi ekipman? Seçin.</p>' +
        (x.ekipman ? '<div class="a-sc-ekipman"><span><b>' + kacis(ekipAd(x)) + "</b>" + (x.ekipman.tip === "plan" ? '<small class="a-alt-satir">' + kacis(x.ekipman.konum || "") + " · plandan</small>" : '<small class="a-alt-satir">rapor yazılırken plana eklenir</small>') + "</span>" +
            MK.tus({ eylem: "sc-ekipman", ad: "Değiştir", ikon: "pencil", sinif: "a-tus-ikincil" }) + "</div>"
          : MK.tus({ eylem: "sc-ekipman", ad: "Ekipman seçin", ikon: "list-ordered", sinif: "a-tus-ikincil a-sc-genis" })) +
        '<p class="a-ipucu">Seçince yönerge o türün rapor formatına göre gelir.</p>',
      alt: '<div class="a-sc-tuslar">' + MK.tus({ eylem: "sc-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "sc-devam", ad: x.ekipman ? "Devam" : "Devam · önce ekipman seçin", ikon: "arrow-right", kapali: !x.ekipman }) + "</div>"
    };
  }

  function mesajHtml(x) {
    var s = x.tanim.satirlar, n = Math.max(s.length, x.mesaj.length) + 1, li = [];
    for (var i = 0; i < n; i++) {
      var st = s[i], v = x.mesaj[i] || "", hz = st && st.hazir && v === st.hazir, okd = (x.okunan || []).indexOf(i) >= 0;
      li.push('<li><span class="a-sc-no" aria-hidden="true">' + (i + 1) + '</span><input class="a-girdi" id="a-sc-s' + i + '" data-sc-satir="' + i + '" autocomplete="off" maxlength="200" value="' + kacis(v) + '"' +
        ' aria-label="' + (i + 1) + ". satır" + (st ? " (" + kacis(st.ad) + ")" : " (nota eklenir)") + '">' +
        (hz ? MK.rozet({ ad: "hazır", rozet: "a-rozet-notr" }) : okd ? MK.rozet({ ad: "okundu", rozet: "a-rozet-kabul" }) : "") + "</li>");
    }
    return '<ol class="a-sc-mesaj" aria-label="Mesaj · numaralı satırlar">' + li.join("") + "</ol>";
  }
  function dagilimHtml(x) {
    var d = dagit(x);
    return '<ul class="a-sc-dagilim" aria-label="Satırların düştüğü alanlar">' + d.satirlar.map(function (s) {
      var sag = s.alan === "yorum" ? (s.deger ? "→ uzman yorumu" : "boş") : !s.deger ? "boş" : s.hazir ? kacis(s.deger) + " · hazır" : '<span class="a-sc-tamam">✓</span>';
      return "<li><b>" + (s.i + 1) + "</b> " + kacis(s.ad) + " " + sag + "</li>";
    }).join("") + d.fazla.map(function (f) { return "<li><b>" + (f.i + 1) + "</b> fazla satır → nota eklenir</li>"; }).join("") + "</ul>";
  }
  function okunacakHtml(x) {
    var l = acikBasliklar(x);
    if (!l.length) return '<p class="a-ipucu">Bu türde okunacak fotoğraf başlığı yok (Ekipman türleri › S.A.Y Chat ayarları).</p>';
    return '<ul class="a-sc-okuma">' + l.map(function (b) {
      var f = x.okunacak[b[0]] || [];
      return '<li><div class="a-sc-okuma-bas"><span><b>' + kacis(b[1]) + '</b><small class="a-alt-satir">' + b[2] + " · " + (f.length ? f.length + " fotoğraf" : "fotoğraf yok") + "</small></span>" +
        dosyaTus("ok:" + b[0], f.length ? "Bir daha çek" : "Fotoğraf çek", "a-tus a-tus-ikincil") + "</div>" + (f.length ? fotolar(f, "ok:" + b[0]) : "") + "</li>";
    }).join("") + "</ul>" + MK.serit("bilgi", "sparkles", "<b>Rapor yazılırken yapay zekâ okur.</b> Değerler o bölüme öneri olarak düşer, siz onaylarsınız. Firmanın yapay zekâ kotasından harcar; çevrimdışıyken bekler. Bu fotoğraflar belgeye basılmaz.");
  }
  function formHtml() {
    var x = C.t, s = x.tanim.satirlar, yeni = C.mod === "yeni";
    var et = x.etiket ? '<p class="a-sc-etiket-durum">' + ikon("tag", "a-ikon-kucuk") + "Etiket fotoğrafı · " + (x.etiket.durum === "okundu" ? "okundu, mesaja yazıldı" : x.etiket.durum === "sirada" ? "okuma sırada (bağlantı bekleniyor)" : "okunmadı") +
      '<button class="a-ikon-tus" type="button" data-eylem="sc-etiket-sil" aria-label="Etiket fotoğrafını kaldır" title="Kaldır">' + ikon("x", "a-ikon-kucuk") + "</button></p>" : "";
    return {
      govde: '<h3 class="a-sc-adim" tabindex="-1">' + (yeni ? "Yeni kayıt · 2 / 2 · " : "Kaydı düzenle · ") + kacis(ekipAd(x)) + "</h3>" +
        (yeni ? "" : '<div class="a-sc-ekipman"><span><b>' + kacis(ekipAd(x)) + '</b><small class="a-alt-satir">' + (x.ekipman.tip === "plan" ? "plandan" : "rapor yazılırken plana eklenir") +
          (x.zaman ? " · " + (x.durum === "gonderildi" ? "gönderildi " : "cihazda ") + saat(x.zaman) : "") + "</small></span>" + MK.tus({ eylem: "sc-ekipman", ad: "Değiştir", ikon: "pencil", sinif: "a-tus-ikincil" }) + "</div>") +
        '<p class="a-sc-ara">O anki ekipman · fotoğraflar</p>' + fotolar(x.foto, "foto", "+ ek") +
        '<div class="a-sc-yonerge"><p class="a-sc-ara">Her satıra sırayla</p><ol>' + s.map(function (st) { return "<li>" + kacis(st.ad) + (st.hazir ? ' <span class="a-alt-inline">· ' + kacis(st.hazir) + "</span>" : "") + "</li>"; }).join("") + "</ol>" +
          dosyaTus("etiket", "Etiket fotoğrafı", "a-tus a-tus-ikincil", "tag") + "</div>" + et +
        '<p class="a-sc-ara" id="a-sc-mesaj-bas">Mesaj · etiket yazmayın; satır sırası yönergenin sırasıdır, bilinmeyene "-"</p>' + mesajHtml(x) + dagilimHtml(x) +
        '<p class="a-sc-ara">Yapay zekânın okuyacağı fotoğraflar</p>' + okunacakHtml(x),
      alt: '<div class="a-sc-tuslar">' + (yeni ? MK.tus({ eylem: "sc-geri", ad: "Geri", ikon: "arrow-left", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "sc-gonder", ad: "Gönder", ikon: "send" })
        : MK.tus({ eylem: "sc-sil", ad: "Kaydı sil", ikon: "trash-2", sinif: "a-tus-ikincil a-tus-sil" }) + MK.tus({ eylem: "sc-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "sc-kaydet", ad: "Kaydet", ikon: "check" })) + "</div>"
    };
  }

  /* ekran 10: bekleyenler için rapor yaz — önce koşullar (plan günü / tamamlanmış plan, günlük süre, internet, yapay zekâ ve kota) */
  function raporDurum(p, k) {
    var l = kayitlar(p, k), en = P().engel(p), gs = MV.gunlukSure(k), m = gs.m, sure = l.reduce(function (n, x) { return n + (MV.tur(x.ekipman.tur).sure || 0); }, 0);
    var ok = l.reduce(function (n, x) { return n + okunacakSay(x); }, 0), yzEngel = MV.yzHazir(k), kosul = [];
    kosul.push(en ? ["eksik", "circle-alert", en] : ["tamam", "circle-check", "Plan günü " + (p.tarih === MK.BUGUN ? "bugün" : "geldi")]);
    if (!m.acik) kosul.push(["bilgi", "clock", "Mesai takibi kapalı: günlük süre sınırı yok"]);
    else if (gs.dolu) kosul.push(["eksik", "clock", "Günlük süre doldu: bugün yeni rapor oluşturulamaz"]);
    else { var kalan = m.normal + gs.hak - gs.toplam; kosul.push(sure <= kalan ? ["tamam", "circle-check", "Günlük süre yetiyor: " + l.length + " rapor, " + sure + " dk"] : ["eksik", "clock", "Günlük süre yetmiyor: " + l.length + " rapor " + sure + " dk, kalan " + kalan + " dk — sığmayanlar açılmaz"]); }
    kosul.push(MK.cevrimdisi() ? ["eksik", "wifi-off", "İnternet gerekli: rapor numarası sunucuda verilir"] : ["tamam", "circle-check", "İnternet var: rapor numarası sunucuda verilir"]);
    if (ok) kosul.push(yzEngel ? ["bilgi", "sparkles", "Yapay zekâ kapalı: " + ok + " fotoğraf raporda saklanır, açılınca okunur"] : ["eksik-degil", "sparkles", "Yapay zekâ " + ok + " fotoğraf okuyacak: firmanın kotasından harcar (" + kota(k) + ")"]);
    return { l: l, kosul: kosul, engel: !!en || MK.cevrimdisi() || (m.acik && gs.dolu), yz: !yzEngel };
  }
  function raporHtml(p, k) {
    var r = raporDurum(p, k);
    return {
      govde: '<h3 class="a-sc-adim" tabindex="-1">Bekleyenler için rapor yaz</h3><p class="a-sc-ara">' + kacis(p.no) + " · " + r.l.length + " kayıt</p>" +
        '<ol class="a-sc-liste">' + r.l.map(function (x, i) {
          var d = dagit(x), alan = Object.keys(d.deger).filter(function (a) { return a !== "yorum"; }).length, b = basliklar(MV.tur(x.ekipman.tur));
          var okl = Object.keys(x.okunacak || {}).filter(function (kk) { return x.okunacak[kk].length && b[kk]; });
          var on = [x.ekipman.tip === "plan" ? "Plandaki ekipmana yazılacak" : "Plana yeni ekipman olarak eklenecek", alan + " alan dolacak", x.foto.length + " fotoğraf rapora geçecek",
            okl.length ? okunacakSay(x) + " fotoğraf " + (r.yz ? "yapay zekâyla okunacak" : "saklanacak") + " (" + okl.map(function (kk) { return b[kk][1]; }).join(", ") + ")" : "", d.deger.yorum ? "not → uzman yorumu" : ""].filter(Boolean);
          var kodAlan = "";
          if (x.ekipman.tip === "yeni") {
            /* kod yazıldıkça denetlenir; boşken "oluştur"a basıldıysa uyarı alanın altında da (C.kodHata) */
            var v = C.kod[x.id] || "", kd = v ? P().kodDurum(p, v) : C.kodHata === x.id ? P().kodDurum(p, "") : null, id = "a-sc-kod-" + x.id;
            kodAlan = '<div class="a-alan-grup"><label class="a-etiket" for="' + id + '">Ekipman kodu <span class="a-alt-inline">etiketteki; firmada eşsiz</span></label>' +
              '<input class="a-girdi a-girdi-sicil" id="' + id + '" data-sc-kod="' + x.id + '" maxlength="20" autocomplete="off" value="' + kacis(v) + '"' + (kd && kd.tur !== "tamam" ? ' aria-invalid="true" aria-describedby="' + id + '-i"' : "") + ">" +
              (kd ? '<p class="a-ipucu' + (kd.tur !== "tamam" ? " a-ipucu-uyari" : "") + '" id="' + id + '-i">' + kacis(kd.metin) + "</p>" : "") + "</div>";
          }
          return '<li class="a-sc-kayit"><p class="a-sc-kayit-bas"><span>' + (i + 1) + " · " + kacis(ekipAd(x)) + "</span>" + MK.rozet({ ad: formatAd(x.ekipman.tur), rozet: "a-rozet-notr" }) + "</p>" +
            '<p class="a-sc-ozet">' + kacis(on.join(" · ")) + "</p>" + kodAlan + "</li>";
        }).join("") + "</ol>" +
        '<p class="a-sc-ara">Oluşturmadan önce</p><ul class="a-kosullar">' + r.kosul.map(function (x) {
          return '<li class="' + (x[0] === "tamam" ? "a-kosul-tamam" : x[0] === "eksik" ? "a-kosul-eksik" : "a-kosul-bilgi") + '">' + ikon(x[1], "a-ikon-kucuk") + "<span>" + kacis(x[2]) + "</span></li>"; }).join("") + "</ul>" +
        '<p class="a-ipucu">Taslaklar sırayla açılır; kriterleri ve ölçümleri raporda doldurursunuz. Okunan değerler raporda öneri olarak bekler. Raporu oluşan kayıtlar sohbetten silinir; etiket fotoğrafı rapora konmaz.</p>',
      alt: '<div class="a-sc-tuslar">' + MK.tus({ eylem: "sc-geri", ad: "Geri", ikon: "arrow-left", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "sc-olustur", ad: r.l.length + " rapor taslağı oluştur", ikon: "file-plus", kapali: r.engel || !r.l.length }) + "</div>"
    };
  }

  function bekleyenleriGonder(p) {
    if (MK.cevrimdisi()) return;
    var n = 0;
    MV.SAY_CHAT.forEach(function (x) {
      if (x.durum === "cihazda") { x.durum = "gonderildi"; n++; }
      if (x.etiket && x.etiket.durum === "sirada" && !MV.yzHazir(x.kisi)) etiketOku(x);
    });
    if (n) { MV.SAY_CHAT = MV.SAY_CHAT.slice(); MK.bildir(n + " kayıt gönderildi (bağlantı geldi)."); }
  }
  function ciz() {
    var p = plan(); if (!p || !C.acik) return;
    bekleyenleriGonder(p);
    var k = kim(p), d = denetciler(p), ici = C.ekran === "sohbet" ? sohbetHtml(p, k) : C.ekran === "secim" ? secimHtml() : C.ekran === "form" ? formHtml() : raporHtml(p, k);
    kap.innerHTML = '<div class="a-say-bas">' + (C.ekran !== "sohbet" ? '<button class="a-ikon-tus" type="button" data-eylem="sc-sohbet" aria-label="Sohbete dön" title="Sohbete dön">' + ikon("arrow-left") + "</button>" : "") +
        '<span class="a-say-avatar">' + ikon("message-square-text") + '</span><div class="a-say-kimlik"><h2 id="a-sc-baslik">S.A.Y Chat</h2><p class="a-say-alt">' + kacis(p.no + " · " + p.musteri + " · " + p.ad) + "</p></div>" +
        '<button class="a-ikon-tus" type="button" data-eylem="sc-kapat" aria-label="S.A.Y Chat\'i kapat">' + ikon("x") + "</button></div>" +
      (d.length > 1 ? '<div class="a-sc-goz" role="group" aria-label="Makette bakış"><span>Makette bakış:</span>' + d.map(function (x) {
        var ki = P().kisi(x); return '<button class="a-cip" type="button" data-eylem="sc-kim" data-k="' + x + '" aria-pressed="' + (x === k) + '">' + kacis(ki.ad) + " · " + kacis(ki.brans) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="a-say-govde" id="a-sc-govde">' + ici.govde + '</div><div class="a-say-alt-kisim">' + ici.alt + "</div>";
  }
  /* yeniden çizerken odak ve imleç yerinde kalır (yazarken satır eklenince, dağılım değişince) */
  function cizKoru() {
    var a = document.activeElement, id = a && kap.contains(a) && a.id, s = id && a.selectionStart, e = id && a.selectionEnd, g = $("a-sc-govde"), y = g ? g.scrollTop : 0;
    ciz();
    var g2 = $("a-sc-govde"); if (g2) g2.scrollTop = y;
    if (id && $(id)) { $(id).focus({ preventScroll: true }); try { $(id).setSelectionRange(s, e); } catch (h) { /* girdi değil */ } }
  }
  function ekranaGec(ekran, odak) {
    C.ekran = ekran; ciz();
    var g = $("a-sc-govde"); if (g) g.scrollTop = 0;
    var o = odak ? kap.querySelector(odak) : kap.querySelector(".a-sc-adim") || kap.querySelector("[data-sc-ilk]"); if (o) o.focus();
  }

  /* ── EKİPMAN SEÇİMİ (ekran 2–5): Plandan seç · Yeni ekle — branşa göre ───────────────────────────────────────────────────────────── */
  function baskaKayitta(p, kod) { return MV.SAY_CHAT.some(function (x) { return x.plan === p.id && x.ekipman && x.ekipman.kod === kod && (!C.t || x.id !== C.t.id); }); }
  function secimListesi(p, k) {
    var br = brans(k), a = MK.tr(C.ara.trim());
    var uy = function (s) { return !a || MK.tr(s).indexOf(a) >= 0; };
    if (C.sekme === "plan") {
      var l = P().ekipmanlar(p).filter(function (e) { return !e.pasif && !e.raporlu && MV.tur(e.tur).b === br && !baskaKayitta(p, e.kod); });
      return { bilgi: MV.bransAd(br) + " branşı · raporu yazılmamış " + l.length + " ekipman", ara: "Kod, tür, yer",
        l: l.filter(function (e) { return uy(e.kod + " " + turAd(e.tur) + " " + e.konum); }).map(function (e) {
          return MK.tus({ eylem: "sc-sec", ad: "<span><b>" + kacis(e.kod) + "</b> · " + kacis(turAd(e.tur)) + "<small>" + kacis(e.konum) + "</small></span>" + MK.rozet({ ad: formatAd(e.tur), rozet: "a-rozet-notr" }), sinif: "a-sc-secenek", veri: { tip: "plan", kod: e.kod, tk: e.tur, konum: e.konum } }); }),
        bos: "Plandaki " + MV.bransAd(br).toLocaleLowerCase("tr") + " ekipmanların hepsinin raporu yazılmış ya da kayıtta. Planda olmayan ekipman için Yeni ekle." };
    }
    var t = MV.KATALOG.filter(function (x) { return x.b === br && x.sablon; });
    return { bilgi: MV.bransAd(br) + " branşı · rapor formatı olan " + t.length + " tür", ara: "Tür ara",
      l: t.filter(function (x) { return uy(x.ad + " " + x.k + " " + (x.format || "")); }).map(function (x) {
        return MK.tus({ eylem: "sc-sec", ad: "<span>" + kacis(x.ad) + "<small>rapor yazılırken plana yeni ekipman olarak eklenir</small></span>" + MK.rozet({ ad: x.format || "Firma", rozet: "a-rozet-notr" }), sinif: "a-sc-secenek", veri: { tip: "yeni", tk: x.k } }); }),
      bos: "Bu branşta rapor formatı kurulmuş tür yok." };
  }
  function secimCiz(odak) {
    var p = plan(), k = kim(p), s = secimListesi(p, k);
    $("a-sc-pencere-baslik").textContent = "Ekipman seçin";
    $("a-sc-pencere-govde").innerHTML = '<div class="a-sekmeler" role="group" aria-label="Ekipman nereden">' + [["plan", "Plandan seç"], ["yeni", "Yeni ekle"]].map(function (x) {
        return '<button class="a-sekme" type="button" data-eylem="sc-sekme" data-s="' + x[0] + '" aria-pressed="' + (C.sekme === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<p class="a-pencere-ozet">' + kacis(s.bilgi) + "</p>" +
      '<label class="a-gizli" for="a-sc-ara">' + s.ara + '</label><input class="a-girdi" id="a-sc-ara" type="search" autocomplete="off" placeholder="' + s.ara + '" value="' + kacis(C.ara) + '">' +
      (s.l.length ? '<ul class="a-sc-secim">' + s.l.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul>" : '<p class="a-bos-satir">' + kacis(C.ara ? "Aramaya uyan yok." : s.bos) + "</p>");
    $("a-sc-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" });
    if (odak) { var o = document.querySelector(odak); if (o) o.focus(); }
  }

  /* ── ETİKETTEN OKUMA (ekran 8): isteğe bağlı; eklerken kota uyarısı; okunanlar mesaja ÖNERİ (boş satıra, "okundu" işaretiyle) ───────── */
  var ETIKET_ALAN = ["e:marka", "e:model", "e:seri", "e:imal"];
  function etiketOku(x) {
    var e = x.ekipman.tip === "plan" ? MV.ekipman(x.ekipman.kod) : null;
    var oku = { "e:marka": e ? e.marka : "Örnek Marka", "e:model": e ? e.model : "X-100", "e:seri": e ? e.seri : "SN-10021", "e:imal": e && e.imal ? String(e.imal) : "" }, n = 0;
    x.okunan = x.okunan || [];
    x.tanim.satirlar.forEach(function (s, i) { if (ETIKET_ALAN.indexOf(s.alan) >= 0 && oku[s.alan] && bos(x.mesaj[i])) { x.mesaj[i] = oku[s.alan]; if (x.okunan.indexOf(i) < 0) x.okunan.push(i); n++; } });
    x.etiket.durum = "okundu"; MV.yzKullan(x.kisi, "okuma");
    return n;
  }
  function etiketCiz() {
    var x = C.t, h = MV.yzHazir(x.kisi);
    $("a-sc-etiket-baslik").textContent = "Etiket fotoğrafı";
    $("a-sc-etiket-govde").innerHTML = '<ul class="a-sc-fotolar">' + foto(C.etiket) + "</ul>" +
      (h ? MK.serit("uyari", "triangle-alert", kacis(h) + " Etiket okunmaz; mesajı siz yazın.")
        : MK.serit("uyari", "sparkles", "<b>Okuma yapay zekâ kullanır.</b> Firmanın kotasından harcar: okuma başına yaklaşık 0,1 cent; " + kota(x.kisi) + "." + (MK.cevrimdisi() ? " Bağlantı yok: okuma sırada bekler." : " Çevrimdışıyken okuma sırada bekler."))) +
      '<p class="a-pencere-metin">Okunan değerler mesaja öneri olarak yazılır, siz düzeltirsiniz. Etiket fotoğrafı rapora konmaz.</p>';
    $("a-sc-etiket-alt").innerHTML = MK.tus({ eylem: "sc-etiket-gec", ad: "Okumadan geç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "sc-etiket-oku", ad: "Oku ve mesaja yaz", ikon: "scan-text", kapali: !!h });
  }

  /* ── OLAYLAR ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
  X["sc-ac"] = function () { if (C.acik) kapat(); else ac(); };
  X["sc-kapat"] = function () { kapat(); };
  X["sc-sohbet"] = function () {
    if (C.t && C.mod === "yeni" && (C.t.foto.length || C.t.ekipman)) { MK.onayla({ baslik: "Kayıt bırakılsın mı?", metin: "Bu yeni kayıt gönderilmedi; fotoğrafları ve mesajı silinir.", tus: "Bırak", tamam: function () { C.t = null; ekranaGec("sohbet"); } }); return; }
    C.t = null; ekranaGec("sohbet");
  };
  X["sc-kim"] = function (el) { var p = plan(); C.kim[p.id] = el.dataset.k; C.t = null; C.ekran = "sohbet"; ciz(); var b = kap.querySelector('[data-eylem="sc-kim"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); };
  X["sc-ekipman"] = function () { C.sekme = C.t && C.t.ekipman && C.t.ekipman.tip === "yeni" ? "yeni" : "plan"; C.ara = ""; secimCiz(); penEk.showModal(); var o = penEk.querySelector('[data-eylem="sc-sekme"][aria-pressed="true"]'); if (o) o.focus(); };
  X["sc-sekme"] = function (el) { C.sekme = el.dataset.s; C.ara = ""; secimCiz('[data-eylem="sc-sekme"][data-s="' + C.sekme + '"]'); };
  X["sc-sec"] = function (el) {
    var x = C.t, onceki = x.ekipman && x.ekipman.tur, d = el.dataset;
    /* ⛔ data-tur değil data-tk: plan içinin tıklama yakalayıcısı (maket.js onTikla) data-tur taşıyan tuşu ekipman ekleme penceresine alır */
    x.ekipman = d.tip === "plan" ? { tip: "plan", kod: d.kod, tur: d.tk, konum: d.konum } : { tip: "yeni", kod: "", tur: d.tk };
    if (onceki !== d.tk || !x.tanim) tanimAta(x, d.tk);
    penEk.close(); ciz();
    var o = kap.querySelector(C.ekran === "secim" ? '[data-eylem="sc-devam"]' : '[data-eylem="sc-ekipman"]'); if (o) o.focus();
    MK.bildir(ekipAd(x) + " seçildi" + (onceki && onceki !== d.tk ? "; yönerge bu türe göre yenilendi." : "."));
  };
  X["sc-devam"] = function () { if (C.t && C.t.ekipman) ekranaGec("form"); };
  X["sc-geri"] = function () { ekranaGec(C.ekran === "rapor" ? "sohbet" : "secim"); };
  X["sc-vazgec"] = function () { if (C.mod === "yeni") { X["sc-sohbet"](); return; } C.t = null; ekranaGec("sohbet"); };
  X["sc-duzenle"] = function (el) {
    var x = MV.SAY_CHAT.filter(function (y) { return y.id === el.dataset.id; })[0]; if (!x) return;
    C.t = JSON.parse(JSON.stringify(x)); C.mod = "duzenle"; ekranaGec("form");
  };
  X["sc-foto-sil"] = function (el) {
    var x = C.t, ne = el.dataset.ne, ad = el.dataset.ad, l = ne === "foto" ? x.foto : x.okunacak[ne.slice(3)];
    if (!l) return; l.splice(l.indexOf(ad), 1); if (ne !== "foto" && !l.length) delete x.okunacak[ne.slice(3)];
    cizKoru(); MK.bildir(gorunurAd(ad) + " kaldırıldı.");
  };
  X["sc-etiket-sil"] = function () { C.t.etiket = null; cizKoru(); MK.bildir("Etiket fotoğrafı kaldırıldı."); };
  X["sc-etiket-gec"] = function () { C.t.etiket = { ad: C.etiket, durum: "okunmadi" }; penEt.close(); ciz(); MK.bildir("Etiket okunmadı; mesajı yönergedeki sırayla yazın."); var o = $("a-sc-s0"); if (o) o.focus(); };
  X["sc-etiket-oku"] = function () {
    var x = C.t; if (MV.yzHazir(x.kisi)) return;
    x.etiket = { ad: C.etiket, durum: "sirada" }; penEt.close();
    if (MK.cevrimdisi()) { ciz(); MK.bildir("Bağlantı yok: etiket okuması sırada; bağlantı gelince mesaja yazılır."); return; }
    var n = etiketOku(x); ciz(); MK.bildir(n ? "Etiketten " + n + " bilgi mesaja yazıldı (okundu işaretli); kontrol edip düzeltin." : "Etiket okundu; boş satır yoktu, mesaj değişmedi.");
    var o = $("a-sc-mesaj-bas"); if (o) o.scrollIntoView({ block: "start" });
  };
  function kaydiYaz(x) {
    x.zaman = MK.simdi(); x.durum = MK.cevrimdisi() ? "cihazda" : "gonderildi";
    var i = MV.SAY_CHAT.map(function (y) { return y.id; }).indexOf(x.id);
    if (i >= 0) MV.SAY_CHAT[i] = x; else MV.SAY_CHAT.push(x);
    MV.SAY_CHAT = MV.SAY_CHAT.slice();
  }
  X["sc-gonder"] = function () {
    var x = C.t; if (!x || !x.ekipman) return;
    if (!x.foto.length) { MK.bildir("En az bir ekipman fotoğrafı ekleyin."); return; }
    kaydiYaz(x); C.t = null; ekranaGec("sohbet", '[data-sc-ilk]');
    MK.bildir(x.durum === "cihazda" ? ekipAd(x) + " cihaza kaydedildi; bağlantı gelince gider." : ekipAd(x) + " gönderildi. Rapor yazılana kadar Düzenle ile değiştirilir.");
  };
  X["sc-kaydet"] = function () {
    var x = C.t; if (!x) return;
    if (!x.foto.length) { MK.bildir("En az bir ekipman fotoğrafı kalmalı."); return; }
    kaydiYaz(x); C.t = null; ekranaGec("sohbet"); MK.bildir(ekipAd(x) + " kaydı güncellendi.");
  };
  X["sc-sil"] = function () {
    var x = C.t; MK.onayla({ baslik: "Kaydı sil", metin: kacis(ekipAd(x)) + " kaydı, fotoğrafları ve mesajı silinir; geri alınamaz.", tus: "Sil", tamam: function () {
      MV.SAY_CHAT = MV.SAY_CHAT.filter(function (y) { return y.id !== x.id; }); C.t = null; ekranaGec("sohbet"); MK.bildir("Kayıt silindi."); } });
  };
  X["sc-rapor"] = function () { C.kod = {}; C.kodHata = null; ekranaGec("rapor"); };
  /* ekran 10 → taslaklar: plan içiyle aynı yol (MK.planIci.raporAc); mesajın alanları ve okunacak fotoğraflar raporun ortak kaydına (MV.RAPORLAR[x].chat)
     — saha raporu ekranı ilk açılışta uygular (maket-rapor.js chatUygula) */
  X["sc-olustur"] = function () {
    var p = plan(), k = kim(p), r = raporDurum(p, k); if (r.engel || !r.l.length) return;
    var hata = null, gorulen = {};
    r.l.forEach(function (x) {
      if (hata || x.ekipman.tip !== "yeni") return;
      var v = P().kodNormal(C.kod[x.id] || ""), kd = P().kodDurum(p, v);
      if (kd.tur !== "tamam") hata = { id: x.id, metin: kd.metin }; else if (gorulen[v]) hata = { id: x.id, metin: v + " başka bir kayda da yazıldı; kod firmada eşsiz olmalı." }; gorulen[v] = true;
    });
    if (hata) { C.kodHata = hata.id; cizKoru(); var g = $("a-sc-kod-" + hata.id); if (g) g.focus(); MK.bildir("Yeni ekipmanın kodu: " + hata.metin); return; }
    var acilan = [], kalan = 0;
    r.l.forEach(function (x) {
      var gs = MV.gunlukSure(k); if (gs.m.acik && gs.dolu) { kalan++; return; }
      var t = MV.tur(x.ekipman.tur), d = dagit(x), yeni = x.ekipman.tip === "yeni", kod = yeni ? P().kodNormal(C.kod[x.id]) : x.ekipman.kod;
      var rap = P().raporAc(p, kod, k, yeni ? { tur: t.k, konum: d.deger["e:konum"] || "" } : null), b = basliklar(t);
      var c = { ekipman: {}, detay: {}, test: {}, yorum: d.deger.yorum || "", foto: x.foto.slice(), okunacak: [], basliklar: {}, yz: r.yz, kayit: x.id };
      Object.keys(d.deger).forEach(function (a) { var v = d.deger[a]; if (a.indexOf("e:") === 0) c.ekipman[a.slice(2)] = v; else if (a.indexOf("d:") === 0) c.detay[a.slice(2)] = v; else if (a.indexOf("t:") === 0) c.test[a.slice(2)] = v; });
      Object.keys(x.okunacak || {}).forEach(function (kk) { if (x.okunacak[kk].length && b[kk]) { c.okunacak.push(kk); c.basliklar[kk] = b[kk][1]; if (r.yz) x.okunacak[kk].forEach(function () { MV.yzKullan(k, "okuma"); }); } });
      var kay = MV.rapor(rap.no); if (kay) kay.chat = c;
      acilan.push(rap.no + " · " + kod);
      MV.SAY_CHAT = MV.SAY_CHAT.filter(function (y) { return y.id !== x.id; });
    });
    MV.RAPORLAR = MV.RAPORLAR.slice(); P().ciz(); ekranaGec("sohbet");
    MK.bildir(acilan.length + " rapor taslağı oluşturuldu: " + acilan.join(", ") + (kalan ? ". " + kalan + " kayıt günlük süre dolduğu için bekliyor." : ". Raporlar plan içindeki listede; kayıtları sohbetten silindi."));
  };

  /* dosya seçimi: yeni kayıt · ekipman fotoğrafı · okunacak fotoğraf · etiket (görüntü bu oturumda; adı kayıtta) */
  function dosyaGeldi(el) {
    var f = el.files && el.files[0], ne = el.dataset.scDosya; el.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type || "")) { MK.bildir("Yalnız fotoğraf (JPEG, PNG) eklenir."); return; }
    var ad = "sc" + (++sayac) + "-" + f.name; try { GORUNTU[ad] = URL.createObjectURL(f); } catch (h) { /* görüntü yok: adıyla */ }
    var p = plan(); if (!p) return;
    if (ne === "yeni") { C.t = yeniKayit(p, kim(p), [ad]); C.mod = "yeni"; ekranaGec("secim"); return; }
    var x = C.t; if (!x) return;
    if (ne === "foto") { x.foto.push(ad); cizKoru(); MK.bildir(gorunurAd(ad) + " eklendi."); return; }
    if (ne === "etiket") { C.etiket = ad; etiketCiz(); penEt.showModal(); var o = penEt.querySelector('[data-eylem="sc-etiket-oku"]:not([disabled])') || penEt.querySelector('[data-eylem="sc-etiket-gec"]'); if (o) o.focus(); return; }
    if (ne.indexOf("ok:") === 0) { var kk = ne.slice(3); (x.okunacak[kk] = x.okunacak[kk] || []).push(ad); cizKoru(); MK.bildir(gorunurAd(ad) + " eklendi; rapor yazılırken okunur."); }
  }
  kap.addEventListener("change", function (e) { if (e.target.matches("input[type=file][data-sc-dosya]")) dosyaGeldi(e.target); });
  kap.addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset.scSatir !== undefined && C.t) {
      var i = +t.dataset.scSatir; C.t.mesaj[i] = t.value; C.t.okunan = (C.t.okunan || []).filter(function (j) { return j !== i; });
      while (C.t.mesaj.length && bos(C.t.mesaj[C.t.mesaj.length - 1]) && C.t.mesaj.length > C.t.tanim.satirlar.length) C.t.mesaj.pop();
      cizKoru();
    } else if (t.dataset.scKod !== undefined) { C.kod[t.dataset.scKod] = t.value; C.kodHata = null; cizKoru(); }
  });
  kap.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); kapat(); return; }
    if (e.key === "Enter" && e.target.dataset.scSatir !== undefined) { e.preventDefault(); var n = $("a-sc-s" + (+e.target.dataset.scSatir + 1)); if (n) n.focus(); }
  });
  penEk.addEventListener("input", function (e) { if (e.target.id === "a-sc-ara") { C.ara = e.target.value; var s = e.target.selectionStart; secimCiz("#a-sc-ara"); try { $("a-sc-ara").setSelectionRange(s, s); } catch (h) { /* yok */ } } });
  penEt.addEventListener("close", function () { C.etiket = null; });
  fabGuncelle();
})();
