/* ══ probata MAKET — ORTAK ÜRETİCİLER (toplu maket çalışması, 2026-09-24) ═══════════════════════════════════════
   MAKET-PLANI.md §3.2: kabuk ve ortak parçalar TEK üreticiden (anayasa 2.9, kalıp 15–16). Planlar maketinin (5. tur, onaylı)
   kabuğu, süzgeç satırı, liste (tablo ↔ kart, eşik 600: kart yalnız telefonda), sayfalayıcı, boş durum, bildirim ve olay dağıtıcısı buraya AYNEN
   taşındı; Planlar'a özgü olan docs/assets/maket.js'te kaldı. Yeni maketler yalnız bu üreticileri kullanır, ikinci aile açmaz.
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3). ⛔ "Bugün" sabit: 2026-09-23 16:40 — ölçüm her açılışta aynı sonucu versin.
   Sayfa sözleşmesi: <head>'de maket-tema.js; gövdede <main class="a-icerik" id="a-icerik"> (+ sayfanın pencereleri);
   sonra bu dosya ve sayfanın betiği. Sayfa MK.kabuk({...}) çağırır; kabuk (yan menü, üst çubuk, perde, süzgeç levhası,
   bildirim) etrafına kurulur. */
(function () {
  "use strict";
  var MK = window.MK = {};
  var IKON = "../vendor/lucide-1.47.0/ikonlar.svg#i-";
  MK.BUGUN = "2026-09-23"; MK.SAAT = "16:40";

  /* ── YARDIMCILAR ─────────────────────────────────────────────────────────────────────────────────────── */
  var $ = MK.$ = function (id) { return document.getElementById(id); };
  var kacis = MK.kacis = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ikon = MK.ikon = function (ad, sinif) { return '<svg class="a-ikon' + (sinif ? " " + sinif : "") + '" aria-hidden="true"><use href="' + IKON + ad + '"/></svg>'; };
  /* 2026-09-27 (reisim: "Her yerde aynı 23.09.2026 formatı gibi olsun"): bütün tarihler GG.AA.YYYY, saatli olanlar GG.AA.YYYY SS:DD;
     gün adı ve ay adı yazılmaz. Eski adlar (gunYaz, gunKisa, ayYil, tarihYaz) aynı biçime bağlandı — tek kaynak MK.tarihNo. */
  MK.tarihNo = function (iso) { return iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4); };
  MK.gunYaz = MK.gunKisa = MK.ayYil = MK.tarihYaz = MK.tarihNo;
  MK.zamanYaz = function (z) { return MK.tarihNo(z) + " " + z.slice(11, 16); };
  MK.simdi = function () { return MK.BUGUN + "T" + MK.SAAT; };
  /* iki tarih arası gün (b − a); "bugün"e göre kalan gün için gunFarki(MK.BUGUN, x) */
  MK.gunFarki = function (a, b) { return Math.round((new Date(b.slice(0, 10) + "T12:00:00") - new Date(a.slice(0, 10) + "T12:00:00")) / 864e5); };
  MK.tr = function (s) { return String(s).toLocaleLowerCase("tr"); };
  /* kırpma zinciri (kalıp 4): yaprak blok + üç nokta + tam metin title'da */
  MK.kirp = function (metin, sinif, baslik) { return '<span class="a-kirp' + (sinif ? " " + sinif : "") + '" title="' + kacis(baslik || metin) + '">' + kacis(metin) + "</span>"; };
  MK.rozet = function (d) { return '<span class="a-rozet ' + d.rozet + '">' + d.ad + "</span>"; };
  MK.serit = function (tur, ik, metin, id) {
    return '<div class="a-serit a-serit-' + tur + '"' + (id ? ' id="' + id + '"' : "") + ">" + ikon(ik, "a-ikon-kucuk") + "<span>" + metin + "</span></div>";
  };
  /* genis: true → telefonda tam satır · "tam" → her bantta tam satır (tablo taşıyan alan) · "cift" → her bantta iki sütun (bölünmez uzun kimlik, ör. 26 haneli SGK DETSİS no) */
  MK.bilgi = function (etiket, deger, genis) { return '<div class="a-bilgi-oge' + (genis === "tam" ? " a-bilgi-genis a-bilgi-tam" : genis === "cift" ? " a-bilgi-genis a-bilgi-cift" : genis ? " a-bilgi-genis" : "") + '"><dt>' + etiket + "</dt><dd>" + deger + "</dd></div>"; };
  /* genel tuş: o = { eylem, ad, ikon, sinif (varsayılan birincil), kapali, sebepId, veri: { id: … } → data-id } */
  MK.tus = function (o) {
    var veri = Object.keys(o.veri || {}).map(function (k) { return " data-" + k + '="' + kacis(o.veri[k]) + '"'; }).join("");
    return '<button class="a-tus ' + (o.sinif || "a-tus-birincil") + '" type="button"' + (o.eylem ? ' data-eylem="' + o.eylem + '"' : "") + veri +
      (o.kapali ? " disabled" + (o.sebepId ? ' aria-describedby="' + o.sebepId + '"' : "") : "") + ">" + (o.ikon ? ikon(o.ikon, "a-ikon-kucuk") : "") + o.ad + "</button>";
  };
  /* kırıntı: [["Personel", "#/"], ["Mert Kaya"]] — son öge bulunulan yer */
  MK.kirinti = function (l) {
    return '<nav class="a-kirinti" aria-label="Konum">' + l.map(function (x, i) {
      var ayrac = i ? ikon("chevron-right", "a-ikon-kucuk") : "";   /* her ara öğeden önce ayraç (bağlantılar bitişmez) */
      if (i === l.length - 1 && l.length > 1) return ayrac + '<span aria-current="page">' + kacis(x[0]) + "</span>";
      return ayrac + '<a href="' + x[1] + '">' + (i === 0 ? ikon("arrow-left", "a-ikon-kucuk") : "") + kacis(x[0]) + "</a>";
    }).join("") + "</nav>";
  };

  /* ── YAN MENÜ — TEK KAYNAK ─────────────────────────────────────────────────────────────────────────────
     Reisim 2026-09-23: "diğer modüller nerde onlarda gözüksün"; ad: "planlar raporlar zimmetler gibi genel isimler".
     pkproje.md §3.1'in firma panelinde ekranı olan modülleri; ekranı olmayanlar yok: 6 Rapor Şablonları (kodda), 16 PDF
     Üretimi (sunucu işi), 17 Müşteri Paneli (müşterinin kendi girişi). Uygulamanın modül kaydı bununla birebir
     (tests/moduller.test.ts). 2026-09-24: maket.js'ten buraya taşındı.
     2026-09-25 (M1 2. tur, reisim: "159 birleşsin", "kullanıcı hesabı her zaman personele bağlı olsun"): Kullanıcılar (1) menüden
     kalktı, hesap ve roller Personel'in içinde → 16 modül. Menünün üstünde gruptan bağımsız "Ana sayfa" (reisim 41: "herkes için bir
     anasayfa olmalı"); modül değil, giriş sonrası açılan sayfa — MENU sabitine girmez. */
  var MENU = [
    { grup: "İş takibi", ogeler: [["Planlar", "calendar-check", 13], ["Raporlar", "file-text", 14], ["Onaylar", "badge-check", 15], ["Uyarılar", "alarm-clock", 20]] },
    { grup: "Müşteri", ogeler: [["Müşteriler", "building-2", 3], ["Teklifler", "file-pen-line", 11], ["Sözleşmeler", "scroll-text", 12]] },
    { grup: "Varlık", ogeler: [["Ölçüm cihazları", "gauge", 8], ["Zimmetler", "package", 9]] },
    { grup: "Personel", ogeler: [["Personel", "users", 2], ["Eğitimler", "graduation-cap", 10]] },
    { grup: "Finans", ogeler: [["Muhasebe", "wallet", 18], ["Performans", "chart-column", 19]] },
    { grup: "Tanımlar", ogeler: [["Ekipman türleri", "layers", 5], ["Standartlar", "book-open", 4]] }
  ];
  /* hazır maketler: menüden tıklanınca gidilir (toplu bakışta tıklanır prototip, MAKET-PLANI §3.3); olmayan → bildirim */
  var SAYFALAR = { 13: "planlarim.html", 2: "personel.html", 3: "musteriler.html", 5: "ekipman-turleri.html", 8: "olcum-cihazlari.html", 9: "zimmetler.html", 12: "sozlesmeler.html", 4: "standartlar.html", 14: "raporlar.html", 15: "onaylar.html", 20: "uyarilar.html", 11: "teklifler.html", 18: "muhasebe.html", 19: "performans.html", 10: "egitimler.html" };
  MK.sayfaAdresi = function (no) { return SAYFALAR[no] || null; };
  /* menü dışı maket ekranları (ör. plan açma); hazır olunca buraya yazılır, bağlantılar kendiliğinden açılır */
  var EK_SAYFALAR = { ana: "anasayfa.html", giris: "giris.html", "plan-ac": "plan-ac.html", rapor: "rapor.html", musteri: "musteri.html", "is-sozlesmesi": "sozlesmeler.html" };
  MK.adres = function (anahtar, hash) { var a = SAYFALAR[anahtar] || EK_SAYFALAR[anahtar]; return a ? a + (hash || "") : null; };
  /* hazırsa bağlantı-tuş, değilse "henüz tasarlanmadı" bildirimi veren tuş (maket dışına gidilmez) */
  MK.git = function (o) {
    var h = MK.adres(o.hedef, o.hash), ic = (o.ikon ? ikon(o.ikon, "a-ikon-kucuk") : "") + o.ad, sinif = "a-tus " + (o.sinif || "a-tus-ikincil");
    return h ? '<a class="' + sinif + '" href="' + h + '">' + ic + "</a>"
      : '<button class="' + sinif + '" type="button" data-eylem="modul" data-ne="' + kacis(o.ne || o.ad) + '">' + ic + "</button>";
  };
  MK.MENU = MENU;   /* salt okunur: rol yetkileri tablosu modülleri menünün kendisinden sayar (ikinci liste yok) */

  function menuHtml(o) {
    var ana = o.modul === "ana";
    return '<ul class="a-menu-liste" aria-label="Ana sayfa"><li><a ' + (ana ? 'href="#/" aria-current="page"' : 'href="anasayfa.html"') + ">" + ikon("house") +
      '<span class="a-menu-ad">Ana sayfa</span></a></li></ul>' + MENU.map(function (g, i) {
      return '<p class="a-menu-grup" id="a-menu-grup-' + i + '">' + g.grup + '</p><ul class="a-menu-liste" aria-labelledby="a-menu-grup-' + i + '">' +
        g.ogeler.map(function (x) {
          var bu = x[2] === o.modul, adres = SAYFALAR[x[2]];
          var a = bu ? 'href="#/" aria-current="page"' : adres ? 'href="' + adres + '"' : 'href="#" data-eylem="modul" data-ne="' + x[0] + '"';
          return "<li><a " + a + ">" + ikon(x[1]) + '<span class="a-menu-ad">' + x[0] + "</span>" +
            (o.sayac && o.sayac[x[2]] ? '<span class="a-menu-sayi" id="a-menu-sayi-' + x[2] + '" title="' + o.sayac[x[2]] + '"></span>' : "") + "</a></li>";
        }).join("") + "</ul>";
    }).join("");
  }
  /* menü sayacı (ör. kabul bekleyen plan): 0 ya da gösterilmeyecekse gizli */
  MK.menuSayi = function (no, n) { var s = $("a-menu-sayi-" + no); if (s) { s.textContent = n || ""; s.hidden = !n; } };

  /* ── KABUK — Planlar maketinin kabuğu (5. tur + 6. tur daraltma), aynen ───────────────────────────────────
     o = { modul: §3.1 no, kullanici: { bas, ad, rol }, sayac: { no: "ipucu" } }. <main id="a-icerik"> kabuğun içine alınır. */
  var I = function (ad) { return '<svg class="a-ikon" aria-hidden="true"><use href="' + IKON + ad + '"/></svg>'; };
  MK.kabuk = function (o) {
    var ana = $("a-icerik"), kok = document.createElement("div");
    kok.className = "a-kabuk"; kok.id = "a-kabuk";
    /* 2026-09-24 (M11): MÜŞTERİ PANELİ kabuğu — firmanın modül menüsü yok; üst çubukta marka, tema ve müşteri kullanıcısı.
       o.musteri = { ad: müşteri kısa adı, firma: muayene firmasının adı }. Aynı üst çubuk sınıfları (ikinci aile yok).
       2026-09-26 (reisim 112): üst çubukta muayene firmasının logosu (makette logo yeri + firma adı), probata logosu yok. */
    if (o.musteri) {
      kok.className = "a-kabuk a-kabuk-musteri";
      kok.innerHTML = '<div class="a-govde"><header class="a-ust">' +
          '<span class="a-ust-firma-logo" role="img" aria-label="' + kacis(o.musteri.firma || "Firma") + ' logosu">Logo</span>' +
          '<span class="a-ust-panel">' + kacis(o.musteri.firma || "Müşteri paneli") + '</span><div class="a-ust-bosluk"></div>' +
          '<button class="a-ikon-tus" type="button" data-eylem="tema" id="a-tema-tus" aria-label="Temayı değiştir">' +
            '<svg class="a-ikon a-tema-ay" aria-hidden="true"><use href="' + IKON + 'moon"/></svg><svg class="a-ikon a-tema-gunes" aria-hidden="true"><use href="' + IKON + 'sun"/></svg></button>' +
          '<div class="a-kullanici"><span class="a-avatar" aria-hidden="true">' + kacis(o.kullanici.bas) + "</span>" +
            '<span class="a-kullanici-yazi"><span class="a-kullanici-ad">' + kacis(o.kullanici.ad) + '</span><span class="a-kullanici-rol">' + kacis(o.kullanici.rol) + "</span></span></div>" +
        "</header></div>";
      document.body.insertBefore(kok, ana);
      kok.querySelector(".a-govde").appendChild(ana);
      document.body.insertAdjacentHTML("beforeend",
        '<dialog class="a-pencere" id="a-levha" aria-labelledby="a-levha-baslik"><div class="a-pencere-bas"><h2 id="a-levha-baslik">Süzgeç</h2>' +
          '<button class="a-ikon-tus" type="button" data-eylem="levha-kapat" aria-label="Kapat">' + I("x") + "</button></div>" +
          '<div class="a-pencere-govde" id="a-levha-govde"></div><div class="a-pencere-alt">' +
          '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Temizle</button>' +
          '<button class="a-tus a-tus-birincil" type="button" data-eylem="levha-kapat" id="a-levha-uygula">Sonuçları göster</button></div></dialog>' +
        '<div class="a-bildirim" id="a-bildirim" role="status" aria-live="polite">' + I("circle-check") + '<span id="a-bildirim-metin"></span></div>');
      temaEtiketi(); return;
    }
    kok.innerHTML =
      '<aside class="a-cubuk" id="a-cubuk" aria-label="Ana menü"><div class="a-cubuk-bas">' +
        '<img class="a-cubuk-logo" src="../marka/probata-yatay-koyu-zemin.svg" alt="probata" width="148" height="37">' +
        '<img class="a-cubuk-isaret" src="../marka/probata-isaret-koyu-zemin.svg" alt="probata" width="25" height="32">' +
        '<button class="a-ikon-tus a-cubuk-kapat" type="button" data-eylem="cekmece-kapat" aria-label="Menüyü kapat">' + I("x") + "</button></div>" +
        '<nav class="a-menu" id="a-menu" aria-label="Modüller">' + menuHtml(o) + "</nav>" +
        '<div class="a-cubuk-alt">Maket · uydurma veri</div></aside>' +
      '<div class="a-perde" data-eylem="cekmece-kapat"></div>' +
      '<div class="a-govde"><header class="a-ust">' +
        '<button class="a-menu-tus" type="button" data-eylem="cekmece-ac" aria-label="Menüyü aç" aria-controls="a-cubuk" aria-expanded="false">' + I("menu") + "</button>" +
        /* masaüstünde (≥ 1280) yan menüyü daraltır/genişletir; tablet/telefondaki ☰ ile aynı yer, aynı simge
           (reisim 2026-09-24: "standart üç alt alta çizgi görünümü olsun") */
        '<button class="a-ikon-tus a-daralt-tus" type="button" data-eylem="menu-daralt" aria-label="Menüyü daralt" aria-controls="a-cubuk" aria-expanded="true">' + I("menu") + "</button>" +
        '<img class="a-ust-isaret a-isaret-acik" src="../marka/probata-isaret-renkli.svg" alt="probata" width="25" height="32">' +
        '<img class="a-ust-isaret a-isaret-koyu" src="../marka/probata-isaret-koyu-zemin.svg" alt="probata" width="25" height="32">' +
        '<div class="a-ust-bosluk"></div>' +
        '<button class="a-ikon-tus" type="button" data-eylem="tema" id="a-tema-tus" aria-label="Temayı değiştir">' +
          '<svg class="a-ikon a-tema-ay" aria-hidden="true"><use href="' + IKON + 'moon"/></svg><svg class="a-ikon a-tema-gunes" aria-hidden="true"><use href="' + IKON + 'sun"/></svg></button>' +
        '<div class="a-kullanici"><span class="a-avatar" aria-hidden="true">' + kacis(o.kullanici.bas) + "</span>" +
          '<span class="a-kullanici-yazi"><span class="a-kullanici-ad">' + kacis(o.kullanici.ad) + '</span><span class="a-kullanici-rol">' + kacis(o.kullanici.rol) + "</span></span></div>" +
      "</header></div>";
    document.body.insertBefore(kok, ana);
    kok.querySelector(".a-govde").appendChild(ana);
    /* süzgeç levhası (telefonda seçiciler) ve bildirim — her sayfada bir tane */
    document.body.insertAdjacentHTML("beforeend",
      '<dialog class="a-pencere" id="a-levha" aria-labelledby="a-levha-baslik"><div class="a-pencere-bas"><h2 id="a-levha-baslik">Süzgeç</h2>' +
        '<button class="a-ikon-tus" type="button" data-eylem="levha-kapat" aria-label="Kapat">' + I("x") + "</button></div>" +
        '<div class="a-pencere-govde" id="a-levha-govde"></div><div class="a-pencere-alt">' +
        '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Temizle</button>' +
        '<button class="a-tus a-tus-birincil" type="button" data-eylem="levha-kapat" id="a-levha-uygula">Sonuçları göster</button></div></dialog>' +
      '<div class="a-bildirim" id="a-bildirim" role="status" aria-live="polite">' + I("circle-check") + '<span id="a-bildirim-metin"></span></div>');
    menuDar(MENU_DAR); temaEtiketi();
  };

  /* ══ SÜZGEÇ — TEK ÜRETİCİ (kalıp 15) ════════════════════════════════════════════════════════════════
     Her süzgeç bir kısa adla (on) tanımlanır: tanim = { ad, ipucu, birim, cipler, seciciler, metin(kayıt), imkansiz, sayfa? }.
     Satır: arama → yüklem çipleri + ve/veya (kalıp 8) → seçiciler + Temizle sağda. Telefonda seçiciler levhada.
     Çiplerin `grup`u aynıysa birbirini dışlar: "ve" ile ikisi seçilince sonuç imkânsızdır, sebebi söylenir.
     yenile: süzgeç değişince çağrılır (liste, çipler, sayaç ve sayfalayıcı yeniden çizilir; arama kutusu yerinde kalır). */
  var SZ_TANIM = {}, SZ = MK.SZ = {}, YENILE = {};
  function yeniSz(on) {
    var s = { ara: "", secili: [], kip: "veya", sec: {}, sayfa: 1 };
    SZ_TANIM[on].seciciler.forEach(function (x) { s.sec[x.k] = x.siralama ? "varsayilan" : x.bas || "tumu"; });
    return s;
  }
  MK.suzgecTanimla = function (on, tanim, yenile) { SZ_TANIM[on] = tanim; SZ[on] = yeniSz(on); YENILE[on] = yenile; };
  MK.suzgecSifirla = function (on) { SZ[on] = yeniSz(on); };
  MK.suzgecTanimi = function (on) { return SZ_TANIM[on]; };
  var kap = MK.kap = function (on) { return document.querySelector('.a-suzgec[data-sz="' + on + '"]'); };
  /* süzgeç kutusu açılır kapanır (reisim 2026-09-27: "filtreler sekmesi de açılıp kapanır bir sekme"): başlıkta uygulanan süzgeç sayısı;
     kapalıyken de sayı görünür. Açık / kapalı tercih bu tarayıcıda sayfa başına hatırlanır (kolaylık; okunamazsa açık gelir). */
  var kutuAcik = function (on) { try { return localStorage.getItem("probata-suzgec-" + location.pathname + "-" + on) !== "kapali"; } catch (e) { return true; } };
  document.addEventListener("toggle", function (e) {
    var d = e.target; if (!d.classList || !d.classList.contains("a-suzgec-kutu")) return;
    try { localStorage.setItem("probata-suzgec-" + location.pathname + "-" + d.dataset.kutu, d.open ? "acik" : "kapali"); } catch (x) { /* depolama kapalı: tercih hatırlanmaz */ }
  }, true);
  MK.suzgecHtml = function (on) {
    var t = SZ_TANIM[on], secicili = t.seciciler.length > 0;
    return '<details class="a-suzgec-kutu" data-kutu="' + on + '"' + (kutuAcik(on) ? " open" : "") + '><summary class="a-suzgec-bas">' + ikon("sliders-horizontal", "a-ikon-kucuk") +
      '<span class="a-suzgec-baslik">Süzgeçler</span><span class="a-suzgec-say" hidden></span>' + ikon("chevron-down", "a-ikon-kucuk a-acilir-ok") + "</summary>" +
      '<div class="a-suzgec" data-sz="' + on + '"' + (secicili ? "" : " data-secicisiz") + ">" +
      '<label class="a-ara"><span class="a-gizli">' + t.ad + "</span>" + ikon("search") +
        '<input type="search" data-ara="' + on + '" placeholder="' + t.ipucu + '" autocomplete="off">' +
        '<button class="a-ara-sil" type="button" data-eylem="ara-sil" aria-label="Aramayı temizle">' + ikon("x", "a-ikon-kucuk") + "</button></label>" +
      (secicili ? '<button class="a-suzgec-tus" type="button" data-eylem="levha-ac" aria-haspopup="dialog">' + ikon("sliders-horizontal") +
        'Süzgeç <span class="a-suzgec-rozet" hidden></span></button>' : "") +
      '<div class="a-cipler" role="group" aria-label="' + t.birim + ' durumu süzgeci"></div>' +
      '<div class="a-suzgec-sag"><div class="a-seciciler"></div>' +
        '<button class="a-temizle" type="button" data-eylem="temizle">' + ikon("filter-x", "a-ikon-kucuk") + "Temizle</button></div></div></details>";
  };
  /* uygulanan süzgeç sayısı: arama + seçili çipler + seçiciler (sıralama ve görünüm anahtarı sayılmaz) */
  function kutuSay(on) {
    var k = kap(on), y = k && k.closest(".a-suzgec-kutu") && k.closest(".a-suzgec-kutu").querySelector(".a-suzgec-say"); if (!y) return;
    var n = (SZ[on].ara.trim() ? 1 : 0) + SZ[on].secili.length + aktifSecici(on);
    y.hidden = !n; y.textContent = n ? n + " süzgeç uygulandı" : "";
  }
  /* seçicinin başlangıç değeri `bas` (verilmezse "tumu"). `bas` taşıyan seçici GÖRÜNÜM ANAHTARIDIR (ör. Çalışanlar /
     Ayrılanlar / Hepsi, kalıp 8: "süzgeç değil görünüm anahtarı"): süzgeç sayılmaz, Temizle onu sıfırlamaz (sıralama gibi) */
  var aktifSecici = function (on) { return SZ_TANIM[on].seciciler.filter(function (x) { return !x.siralama && !x.bas && SZ[on].sec[x.k] !== "tumu"; }).length; };
  var suzgecVar = MK.suzgecVar = function (on) { var s = SZ[on]; return !!s.ara.trim() || s.secili.length > 0 || aktifSecici(on) > 0; };
  MK.taban = function (on, kayitlar) {   /* çipler HARİÇ her şey; çip sayıları buradan (dürüst sayaç, anayasa 2.8) */
    var t = SZ_TANIM[on], s = SZ[on], a = MK.tr(s.ara.trim());
    return kayitlar.filter(function (k) {
      if (a && MK.tr(t.metin(k)).indexOf(a) < 0) return false;
      return t.seciciler.every(function (x) { return x.gecer(k, s.sec[x.k]); });
    });
  };
  MK.cipGecer = function (on, k) {
    var s = SZ[on]; if (!s.secili.length) return true;
    var sonuc = s.secili.map(function (c) { return SZ_TANIM[on].cipler.filter(function (x) { return x.k === c; })[0].test(k); });
    return s.kip === "ve" ? sonuc.every(Boolean) : sonuc.some(Boolean);
  };
  MK.imkansiz = function (on) {
    if (SZ[on].kip !== "ve") return false;
    var gruplar = {};
    SZ[on].secili.forEach(function (c) { var g = SZ_TANIM[on].cipler.filter(function (x) { return x.k === c; })[0].grup; if (g) gruplar[g] = (gruplar[g] || 0) + 1; });
    return Object.keys(gruplar).some(function (g) { return gruplar[g] >= 2; });
  };
  MK.cipCiz = function (on, tb) {
    var s = SZ[on], k = kap(on); if (!k) return;
    var az = s.secili.length < 2;
    k.querySelector(".a-cipler").innerHTML = SZ_TANIM[on].cipler.map(function (c) {
      return '<button class="a-cip" type="button" data-cip="' + c.k + '" aria-pressed="' + (s.secili.indexOf(c.k) >= 0) + '">' + kacis(c.ad) +
        ' <span class="a-cip-sayi">' + tb.filter(c.test).length + "</span></button>";
    }).join("") + (SZ_TANIM[on].cipler.length >= 2 ? '<div class="a-kip" role="group" aria-label="Seçili çipleri birleştirme" aria-disabled="' + az + '"' +
      ' title="veya: seçili çiplerden herhangi birine uyanlar · ve: hepsine uyanlar">' +
      '<button type="button" data-kip="veya" aria-pressed="' + (s.kip === "veya") + '"' + (az ? " disabled" : "") + ">veya</button>" +
      '<button type="button" data-kip="ve" aria-pressed="' + (s.kip === "ve") + '"' + (az ? " disabled" : "") + ">ve</button></div>" : "");
    k.querySelector(".a-temizle").disabled = !suzgecVar(on);
    kutuSay(on);
  };
  var seciciCiz = MK.seciciCiz = function (on) {
    var k = kap(on); if (!k) return;
    k.querySelector(".a-seciciler").innerHTML = SZ_TANIM[on].seciciler.map(function (x) {
      var sec = x.secenek(), gor = sec.filter(function (o) { return o[0] === SZ[on].sec[x.k]; })[0] || sec[0];
      return '<div class="a-secici' + (x.siralama ? " a-secici-sira" : "") + '" data-secici="' + x.k + '">' +
        '<button class="a-secici-tus" type="button" aria-haspopup="listbox" aria-expanded="false" data-secici-ac="' + x.k + '">' +
        '<span class="a-secici-etiket">' + x.ad + '</span><span class="a-secici-deger">' + kacis(gor[1]) + "</span>" + ikon("chevron-down", "a-ikon-kucuk") + "</button>" +
        '<div class="a-secici-liste" role="listbox" aria-label="' + x.ad + '" hidden>' +
        sec.map(function (o) {
          return '<button class="a-secenek" type="button" role="option" aria-selected="' + (o[0] === SZ[on].sec[x.k]) + '" data-sec="' + x.k + '" data-deger="' + kacis(o[0]) + '">' +
            ikon("check", "a-ikon-kucuk") + '<span class="a-kirp">' + kacis(o[1]) + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    var r = k.querySelector(".a-suzgec-rozet"), n = aktifSecici(on);
    if (r) { r.hidden = !n; r.textContent = n || ""; }
    if ($("a-levha").open && $("a-levha").dataset.sz === on) levhaCiz(on);
  };
  function levhaCiz(on) {
    $("a-levha").dataset.sz = on;
    $("a-levha-govde").innerHTML = SZ_TANIM[on].seciciler.map(function (x) {
      return '<div class="a-levha-grup"><p class="a-levha-grup-ad">' + x.ad + '</p><div class="a-levha-secenekler">' +
        x.secenek().map(function (o) {
          return '<button class="a-cip" type="button" aria-pressed="' + (o[0] === SZ[on].sec[x.k]) + '" data-sec="' + x.k + '" data-deger="' + kacis(o[0]) + '">' + kacis(o[1]) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
  }
  function temizle(on) {
    var eski = SZ[on].sec, t = SZ_TANIM[on]; SZ[on] = yeniSz(on);
    t.seciciler.forEach(function (x) { if (x.siralama || x.bas) SZ[on].sec[x.k] = eski[x.k]; });   /* sıralama ve görünüm süzgeç değildir, kalır */
    var k = kap(on); if (k) { k.querySelector("[data-ara]").value = ""; k.querySelector(".a-ara").classList.remove("a-dolu"); }
  }
  /* süzgeç satırını durumdan yeniden kurar (sayfa yeniden çizilince arama kutusu değeri, seçiciler ve liste) */
  MK.suzgecKur = function (on) {
    var k = kap(on); if (!k) return;
    var g = k.querySelector("[data-ara]"); g.value = SZ[on].ara; k.querySelector(".a-ara").classList.toggle("a-dolu", !!SZ[on].ara);
    seciciCiz(on); YENILE[on]();
  };
  /* sayaç: süzgeç açıkken "3 / 12 birim" (anayasa 2.8) */
  MK.sayac = function (on, gorunen, toplam) {
    var b = SZ_TANIM[on].birim;
    return suzgecVar(on) ? "<b>" + gorunen + "</b> / " + toplam + " " + b : "<b>" + toplam + "</b> " + b;
  };

  /* ── TEK LİSTE ÜRETİCİSİ + SAYFALAYICI ───────────────────────────────────────────────────────────────
     Liste kabı eşiğin üstünde tablo, altında kart (maket.css @container liste). Sütun: k · baslik · kart (ust | rozet |
     govde | eylem) · sira (kartta diziliş) · hucre(kayıt). o = { baslik, sinif, sutunlar, kayitlar, sz (sıralanırsa süzgeç
     adı; sütun başlığı sıralar), href(kayıt) }. Sayfalama yalnız istenen yerde (kalıp 10). */
  MK.tablo = function (o) {
    var bas = o.sutunlar.map(function (s) {
      if (s.gizliBaslik) return '<th scope="col"><span class="a-gizli">' + s.baslik + "</span></th>";
      if (!o.sz || s.siralanmaz) return '<th scope="col">' + s.baslik + "</th>";
      var v = SZ[o.sz].sec.sira, yon = v === s.k + "-artan" ? "ascending" : v === s.k + "-azalan" ? "descending" : "";
      return '<th scope="col"' + (yon ? ' aria-sort="' + yon + '"' : "") + '><button class="a-sirala" type="button" data-sirala="' + s.k + '">' +
        s.baslik + ikon(yon === "ascending" ? "arrow-up" : yon === "descending" ? "arrow-down" : "arrow-up-down", "a-ikon-kucuk") + "</button></th>";
    }).join("");
    var govde = o.kayitlar.map(function (r) {
      var href = o.href ? o.href(r) : "";
      return "<tr" + (href ? ' data-href="' + href + '"' : "") + ">" + o.sutunlar.map(function (s) {
        return '<td data-alan="' + s.k + '" data-kart="' + s.kart + '" style="--sira:' + s.sira + '">' + s.hucre(r) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<table class="a-tablo ' + o.sinif + '"' + (o.sz ? ' data-sz="' + o.sz + '"' : "") + '><caption class="a-gizli">' + o.baslik + "</caption><colgroup>" +
      o.sutunlar.map(function (s) { return '<col class="a-k-' + s.k + '">'; }).join("") + "</colgroup>" +
      "<thead><tr>" + bas + "</tr></thead><tbody>" + govde + "</tbody></table>";
  };
  MK.sayfalayici = function (on, toplam, sayfa) {
    if (!toplam) return "";
    var boy = SZ_TANIM[on].sayfa, n = Math.ceil(toplam / boy), bas = (sayfa - 1) * boy + 1, son = Math.min(toplam, sayfa * boy);
    var h = '<nav class="a-sayfalar" data-sz="' + on + '" aria-label="' + SZ_TANIM[on].birim + ' sayfaları"><span class="a-sayfa-bilgi">' + bas + "–" + son + " / " + toplam + "</span>";
    if (n > 1) {
      h += '<div class="a-sayfa-tuslar"><button class="a-sayfa" type="button" data-sayfa="' + (sayfa - 1) + '" aria-label="Önceki sayfa"' + (sayfa === 1 ? " disabled" : "") + ">" + ikon("chevron-left", "a-ikon-kucuk") + "</button>";
      /* 7'den fazla sayfada: ilk · … · bulunulan ±1 · … · son; telefonda ±1 komşular gizlenir → tek satır
         (2026-09-24: 143 ekipman = 15 sayfa, 15 tuş iki satıra taşıyordu). 7 ve altı sayfada hepsi (Planlar aynen). */
      var goster = function (i) { return n <= 7 || i === 1 || i === n || Math.abs(i - sayfa) <= 1; };
      for (var i = 1; i <= n; i++) {
        var komsu = n > 7 && Math.abs(i - sayfa) === 1 && i !== 1 && i !== n;
        if (goster(i)) h += '<button class="a-sayfa' + (komsu ? " a-sayfa-komsu" : "") + '" type="button" data-sayfa="' + i + '"' + (i === sayfa ? ' aria-current="page"' : "") + ' aria-label="Sayfa ' + i + '">' + i + "</button>";
        else if (goster(i - 1)) h += '<span class="a-sayfa-ara" aria-hidden="true">…</span>';
      }
      h += '<button class="a-sayfa" type="button" data-sayfa="' + (sayfa + 1) + '" aria-label="Sonraki sayfa"' + (sayfa === n ? " disabled" : "") + ">" + ikon("chevron-right", "a-ikon-kucuk") + "</button></div>";
    }
    return h + "</nav>";
  };
  /* Sıralama seçicisi yalnız KART kipinde satırda görünür: kip CSS'in kendi kararından okunur (kartta başlık yok). */
  var KIP_LISTE = {};
  MK.listeKipi = function (on, listeId) {
    if (listeId) KIP_LISTE[on] = listeId;
    var th = document.querySelector("#" + KIP_LISTE[on] + " thead"), k = kap(on);
    if (th && k) k.setAttribute("data-liste-kip", getComputedStyle(th).display === "none" ? "kart" : "tablo");
  };
  /* boş durum: d = { ikon, baslik, metin, eylem (html), hata } — üç hâl: veri yok · süzgeç boş · hata */
  MK.bos = function (d, on) {
    return '<div class="a-bos' + (d.hata ? " a-bos-hata" : "") + '" role="status"' + (on ? ' data-sz="' + on + '"' : "") + '><div class="a-bos-ikon">' + ikon(d.ikon) + "</div>" +
      '<p class="a-bos-baslik">' + d.baslik + '</p><p class="a-bos-metin">' + d.metin + "</p>" + (d.eylem || "") + "</div>";
  };
  MK.bosSuzgec = function (on) {
    return MK.imkansiz(on)
      ? MK.bos({ ikon: "circle-alert", baslik: SZ_TANIM[on].imkansiz, metin: "“ve” seçiliyken aynı gruptan iki çip birlikte hiçbir kayda uymaz. “veya” ile ikisine uyanlar birlikte listelenir.", eylem: '<button class="a-tus a-tus-ikincil" type="button" data-kip="veya">“veya”ya geç</button>' }, on)
      : MK.bos({ ikon: "search", baslik: "Süzgece uyan " + SZ_TANIM[on].birim + " yok", metin: "Arama ya da süzgeç değiştirilince liste yeniden dolar.", eylem: '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Süzgeci temizle</button>' }, on);
  };
  /* bir süzgeçli listeyi baştan sona çizer (çipler, sayaç, liste, sayfalayıcı): o = { on, kayitlar, sayacId, listeId,
     sayfaId?, tablo: {…MK.tablo}, bosVeri (MK.bos nesnesi ya da html), sirala(liste)? } */
  MK.listeCiz = function (o) {
    var s = SZ[o.on], tb = MK.taban(o.on, o.kayitlar), liste = tb.filter(function (k) { return MK.cipGecer(o.on, k); });
    if (o.sirala) liste = o.sirala(liste);
    MK.cipCiz(o.on, tb);
    /* dürüst sayaç (anayasa 2.8): toplam, görünüm anahtarının (başlangıç değerli seçici, ör. Çalışanlar) İÇİNDEKİ kayıtlar —
       2026-09-24 ölçümde yakalandı: 15 kişi listelenirken "16 kişi" yazıyordu (ayrılan kişi de sayılıyordu) */
    var gorunum = SZ_TANIM[o.on].seciciler.filter(function (x) { return x.bas; });
    var toplam = o.kayitlar.filter(function (k) { return gorunum.every(function (x) { return x.gecer(k, s.sec[x.k]); }); }).length;
    if (o.sayacId) $(o.sayacId).innerHTML = MK.sayac(o.on, liste.length, toplam);
    var boy = SZ_TANIM[o.on].sayfa, ic;
    if (boy) { var n = Math.max(1, Math.ceil(liste.length / boy)); if (s.sayfa > n) s.sayfa = n; }
    if (!o.kayitlar.length) ic = typeof o.bosVeri === "string" ? o.bosVeri : MK.bos(o.bosVeri);
    else if (!toplam) ic = MK.bos({ ikon: "inbox", baslik: "Bu görünümde " + SZ_TANIM[o.on].birim + " yok", metin: "Görünüm değiştirilince liste yeniden dolar." }, o.on);
    else if (!liste.length) ic = MK.bosSuzgec(o.on);
    else { var t = Object.assign({}, o.tablo, { kayitlar: boy ? liste.slice((s.sayfa - 1) * boy, s.sayfa * boy) : liste }); ic = MK.tablo(t); }
    $(o.listeId).innerHTML = ic;
    if (o.sayfaId) $(o.sayfaId).innerHTML = boy && liste.length ? MK.sayfalayici(o.on, liste.length, s.sayfa) : "";
    if (o.tablo.sz) MK.listeKipi(o.on, o.listeId);
    return liste;
  };

  /* ── FORM ALANI — TEK ÜRETİCİ (kalıp 3: alan veri tipine göre, sınıfla) ─────────────
     alan({ id, etiket, girdi (html), hata, uyari, sonuc, zorunlu (true | metin), genis }) — alanın altında YALNIZ hata, kaydı durdurmayan
     uyarı ya da canlı sonuç yazılır; açıklayıcı ipucu (eski `ipucu`) çizilmez (reisim 2026-09-26: "alt tarafa yazılmış küçük mesajlar
     istemiyorum"). · girdi({ id, alan (veri anahtarı), deger,
     sinif, ek (öznitelikler), hata }) — girdi `data-alan` taşır; sayfa MK.onGirdi'de e.target.dataset.alan'ı okur. */
  MK.alan = function (o) {
    return '<div class="a-alan-grup' + (o.genis ? " a-alan-genis" : "") + '"><label class="a-etiket" for="' + o.id + '">' + o.etiket +
      (o.zorunlu ? ' <span class="a-zorunlu">' + (o.zorunlu === true ? "zorunlu" : o.zorunlu) + "</span>" : "") + "</label>" + o.girdi +
      (o.hata ? '<p class="a-ipucu a-ipucu-uyari" id="' + o.id + '-ipucu">' + o.hata + "</p>"
        : o.uyari ? '<p class="a-ipucu" id="' + o.id + '-ipucu"><span class="a-ipucu-dikkat">' + o.uyari + "</span></p>"
        : o.sonuc ? '<p class="a-ipucu" id="' + o.id + '-ipucu">' + o.sonuc + "</p>" : "") + "</div>";
  };
  MK.girdi = function (o) {
    return '<input class="a-girdi' + (o.sinif ? " " + o.sinif : "") + '" id="' + o.id + '"' + (o.alan ? ' data-alan="' + o.alan + '"' : "") + ' autocomplete="off" value="' + kacis(o.deger || "") + '"' +
      (o.hata ? ' aria-invalid="true"' : "") + ' aria-describedby="' + o.id + '-ipucu"' + (o.ek || "") + ">";
  };

  /* ── SEÇİM ALANI (kalıp 19: yerli açılır liste YOK) — formdaki tek seçim: düğme + temalı liste ──────────────
     secim({ id, ad, deger, secenekler: [[deger, etiket, ek?]], ipucu }) — seçilince MK.onSecim(id, deger) çağrılır. */
  MK.secim = function (o) {
    var gor = o.secenekler.filter(function (x) { return x[0] === o.deger; })[0];
    return '<div class="a-secici a-secim" data-secim-kap="' + o.id + '"><button class="a-girdi a-secim-tus" type="button" id="' + o.id + '" aria-haspopup="listbox" aria-expanded="false" data-secim-ac="' + o.id + '"' +
      (o.gecersiz ? ' aria-invalid="true"' : "") + (o.tanim ? ' aria-describedby="' + o.tanim + '"' : "") + ">" +
      '<span class="a-kirp' + (gor ? "" : " a-secim-bos") + '" title="' + kacis(gor ? gor[1] : o.ipucu || "Seçin") + '">' + kacis(gor ? gor[1] : o.ipucu || "Seçin") + "</span>" + ikon("chevron-down", "a-ikon-kucuk") + "</button>" +
      '<div class="a-secici-liste a-secim-liste" role="listbox" aria-label="' + kacis(o.ad) + '" hidden>' +
      /* kalıp 19: 8'den fazla seçenekte arama kutusu (yazdıkça süzer; eşleşme yoksa söyler) */
      (o.secenekler.length > 8 ? '<input class="a-girdi a-secim-ara" type="search" data-secim-ara="' + o.id + '" placeholder="Ara" aria-label="' + kacis(o.ad) + ' içinde ara" autocomplete="off">' +
        '<p class="a-bos-satir a-secim-yok" hidden>Bu adla seçenek yok.</p>' : "") +
      o.secenekler.map(function (x) {
        return '<button class="a-secenek" type="button" role="option" aria-selected="' + (x[0] === o.deger) + '" data-secim="' + o.id + '" data-deger="' + kacis(x[0]) + '">' +
          ikon("check", "a-ikon-kucuk") + '<span class="a-kirp" title="' + kacis(x[1]) + '">' + kacis(x[1]) + "</span>" + (x[2] ? '<span class="a-secenek-ek">' + kacis(x[2]) + "</span>" : "") + "</button>";
      }).join("") + "</div></div>";
  };

  /* ── TARİH / SAAT ALANI (reisim 2026-09-27: "tıklayınca tarih seçtiren bi takvim açılsın ve saat dakika seçebileceğim bir kısım olsun
     otomatik dolu gelsin ama tıklayınca seçerek değiştirebileyim"; ardından örnek ekranla: "tarih ve saat ayrı el ile de girilebiliyo
     yandaki küçük ikonlara basınca seçiledebiliyor el ile yazınca saat için aşağıda ilgili saatler çıkıyor").
     zaman({ id, ad, deger ("YYYY-MM-DD" ya da "YYYY-MM-DDTHH:MM"), saat: true }) → tarih (GG.AA.YYYY, yazılır ya da takvimden) ·
     saatliyse saat ve dakika ayrı alan (yazılır; yazarken uyan değerler altta listelenir; simgeyle tam liste). Geçerli her değişiklikte
     MK.onZaman(id, deger); sayfa yeniden çizmez, başka alanı MK.zamanAyarla(id, deger) ile günceller. Yerli tarih girdisi yok (kalıp 19). */
  var AY_UZUN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var iki = function (n) { return ("0" + n).slice(-2); };
  var tarihOku = function (s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s).trim()); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2] ? null : iso;
  };
  function zamanIc(k) {
    var d = k.dataset.deger, ay = k.dataset.ay, y = +ay.slice(0, 4), m = +ay.slice(5, 7) - 1;
    var ilk = (new Date(y, m, 1).getDay() + 6) % 7, gunSay = new Date(y, m + 1, 0).getDate(), h = "";
    for (var i = 0; i < ilk; i++) h += "<span></span>";
    for (var g = 1; g <= gunSay; g++) {
      var iso = y + "-" + iki(m + 1) + "-" + iki(g);
      h += '<button type="button" class="a-zaman-gun' + (iso === MK.BUGUN ? " a-zaman-bugun" : "") + '" data-zaman-gun="' + iso + '" aria-pressed="' + (!!d && d.slice(0, 10) === iso) + '" aria-label="' + MK.tarihNo(iso) + '">' + g + "</button>";
    }
    return '<div class="a-zaman-bas">' + '<button type="button" class="a-ikon-tus" data-zaman-ay="-1" aria-label="Önceki ay">' + ikon("chevron-left") + "</button>" +
      '<span class="a-zaman-ay">' + AY_UZUN[m] + " " + y + '</span><button type="button" class="a-ikon-tus" data-zaman-ay="1" aria-label="Sonraki ay">' + ikon("chevron-right") + "</button></div>" +
      '<div class="a-zaman-gunler">' + ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(function (x) { return '<span class="a-zaman-gun-ad" aria-hidden="true">' + x + "</span>"; }).join("") + h + "</div>" +
      /* reisim 2026-09-27: "takvimin altında bu gün tuşu olsun ve direk bu günü seçtirtsin" */
      '<div class="a-zaman-alt"><button type="button" class="a-tus a-tus-ikincil" data-zaman-gun="' + MK.BUGUN + '">Bugün</button></div>';
  }
  /* saat (00–23) ya da dakika (00–59) alanı: yazılır; liste yazılana uyanları gösterir */
  var parca = function (id, p, deger, ad) {
    var n = p === "s" ? 24 : 60, sec = "";
    for (var i = 0; i < n; i++) sec += '<button class="a-secenek" type="button" role="option" aria-selected="' + (iki(i) === deger) + '" data-zaman-sec="' + iki(i) + '">' + iki(i) + "</button>";
    return '<div class="a-secici a-zaman-parca" data-parca="' + p + '"><input class="a-girdi a-zaman-girdi" id="' + id + "-" + p + '" data-zaman-parca="' + p + '" value="' + deger +
      '" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="' + ad + (p === "s" ? " saati" : " dakikası") + '">' +
      '<button class="a-zaman-ikon" type="button" data-zaman-liste="' + p + '" aria-haspopup="listbox" aria-expanded="false" aria-label="' + (p === "s" ? "Saat" : "Dakika") + ' seç">' + ikon("clock", "a-ikon-kucuk") + "</button>" +
      '<div class="a-secici-liste a-parca-liste" role="listbox" aria-label="' + (p === "s" ? "Saat" : "Dakika") + '" hidden>' + sec + "</div></div>";
  };
  MK.zaman = function (o) {
    var d = o.deger || "";
    return '<div class="a-zaman' + (o.saat ? " a-zaman-saatli" : "") + '" data-zaman="' + o.id + '" data-deger="' + d + '" data-saat="' + (o.saat ? 1 : 0) + '" data-ay="' + (d || MK.BUGUN).slice(0, 7) + '">' +
      '<div class="a-secici a-zaman-tarih"><input class="a-girdi a-zaman-girdi" id="' + o.id + '" data-zaman-tarih value="' + (d ? MK.tarihNo(d) : "") + '" inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY" autocomplete="off"' +
        (o.tanim ? ' aria-describedby="' + o.tanim + '"' : "") + ">" +
        '<button class="a-zaman-ikon" type="button" data-zaman-ac aria-haspopup="dialog" aria-expanded="false" aria-label="Takvimden seç">' + ikon("calendar", "a-ikon-kucuk") + "</button>" +
        '<div class="a-secici-liste a-zaman-liste" role="dialog" aria-label="' + kacis(o.ad) + '" hidden></div></div>' +
      (o.saat ? parca(o.id, "s", d ? d.slice(11, 13) : "", o.ad) + '<span class="a-zaman-iki" aria-hidden="true">:</span>' + parca(o.id, "d", d ? d.slice(14, 16) : "", o.ad) : "") + "</div>";
  };
  MK.zamanAyarla = function (id, d) {
    var k = document.querySelector('[data-zaman="' + id + '"]'); if (!k) return;
    k.dataset.deger = d; k.dataset.ay = (d || MK.BUGUN).slice(0, 7);
    var t = k.querySelector("[data-zaman-tarih]"); if (document.activeElement !== t) t.value = d ? MK.tarihNo(d) : "";
    if (k.dataset.saat === "1") ["s", "d"].forEach(function (p) {
      var g = k.querySelector('[data-zaman-parca="' + p + '"]'); if (document.activeElement !== g) g.value = d ? (p === "s" ? d.slice(11, 13) : d.slice(14, 16)) : "";
    });
    var l = k.querySelector(".a-zaman-liste"); if (!l.hidden) l.innerHTML = zamanIc(k);
  };
  var zamanYay = function (k, yeni) { k.dataset.deger = yeni; k.dataset.ay = yeni.slice(0, 7); if (MK.onZaman) MK.onZaman(k.dataset.zaman, yeni); };
  var saatliDeger = function (k, gun, s, dk) { var d = k.dataset.deger || MK.simdi(); return k.dataset.saat === "1" ? gun + "T" + (s || d.slice(11, 13)) + ":" + (dk || d.slice(14, 16)) : gun; };
  /* yazma: tarih geçerli olunca, saat / dakika iki hane ve aralıkta olunca değer yayılır; saat yazarken uyan değerler listelenir */
  function zamanYaz(t) {
    var k = t.closest("[data-zaman]"); if (!k) return false;
    if (t.dataset.zamanTarih !== undefined) {
      var g = tarihOku(t.value);
      if (g) { t.removeAttribute("aria-invalid"); zamanYay(k, saatliDeger(k, g)); } else if (t.value.length >= 10) t.setAttribute("aria-invalid", "true");
      return true;
    }
    if (t.dataset.zamanParca) {
      var p = t.dataset.zamanParca, kap = t.closest(".a-secici"), l = kap.querySelector(".a-parca-liste"), v = t.value.replace(/\D/g, ""), n = 0;
      l.querySelectorAll(".a-secenek").forEach(function (b) { var uy = !v || b.dataset.zamanSec.indexOf(v) === 0; b.hidden = !uy; if (uy) n++; });
      listeleriKapat(kap); l.hidden = !v || !n; kap.querySelector("[data-zaman-liste]").setAttribute("aria-expanded", String(!l.hidden));
      /* reisim 2026-09-27: "yazarken 09 bile yazsam aşağıda 09 u önermeye devam edecek oradan seçebileceğim" — liste açık kalır */
      if (v.length === 2 && +v < (p === "s" ? 24 : 60)) {
        var d = k.dataset.deger || MK.simdi(), gun = d.slice(0, 10);
        zamanYay(k, p === "s" ? saatliDeger(k, gun, v) : saatliDeger(k, gun, null, v));
      }
      return true;
    }
    return false;
  }
  /* saat / dakika alanından odak çıkınca öneri listesi kapanır (Tab ile ayrılınca açık kalmasın) */
  document.addEventListener("focusout", function (e) {
    var kap = e.target.closest && e.target.closest(".a-zaman-parca"); if (!kap) return;
    if (!e.relatedTarget || kap.contains(e.relatedTarget)) return;   /* dışarı tıklama ayrıca kapatır; Safari tıklanan tuşa odak vermez */
    kap.querySelector(".a-parca-liste").hidden = true; kap.querySelector("[data-zaman-liste]").setAttribute("aria-expanded", "false");
  });
  /* tıklamalar: true dönerse iş bitti */
  function zamanTikla(e) {
    var el = e.target.closest("[data-zaman-ac],[data-zaman-gun],[data-zaman-ay],[data-zaman-liste],[data-zaman-sec]"); if (!el) return false;
    var k = el.closest("[data-zaman]"), kap = el.closest(".a-secici");
    if (el.dataset.zamanAc !== undefined) {
      var l = kap.querySelector(".a-zaman-liste"), ac = l.hidden; listeleriKapat(kap);
      if (ac) { k.dataset.ay = (k.dataset.deger || MK.BUGUN).slice(0, 7); l.innerHTML = zamanIc(k); }
      l.hidden = !ac; el.setAttribute("aria-expanded", String(ac));
      if (ac) (l.querySelector('[data-zaman-gun][aria-pressed="true"]') || l.querySelector(".a-zaman-bugun") || l.querySelector("[data-zaman-gun]")).focus();
      return true;
    }
    if (el.dataset.zamanAy) {
      var t = new Date(+k.dataset.ay.slice(0, 4), +k.dataset.ay.slice(5, 7) - 1 + +el.dataset.zamanAy, 1);
      k.dataset.ay = t.getFullYear() + "-" + iki(t.getMonth() + 1); kap.querySelector(".a-zaman-liste").innerHTML = zamanIc(k);
      kap.querySelector('[data-zaman-ay="' + el.dataset.zamanAy + '"]').focus(); return true;
    }
    if (el.dataset.zamanGun) {
      zamanYay(k, saatliDeger(k, el.dataset.zamanGun)); MK.zamanAyarla(k.dataset.zaman, k.dataset.deger);
      listeleriKapat(null); kap.querySelector("[data-zaman-ac]").focus(); return true;
    }
    if (el.dataset.zamanListe) {
      var pl = kap.querySelector(".a-parca-liste"), pac = pl.hidden; listeleriKapat(kap);
      pl.querySelectorAll(".a-secenek").forEach(function (b) { b.hidden = false; });
      pl.hidden = !pac; el.setAttribute("aria-expanded", String(pac));
      if (pac) { var s = pl.querySelector('[aria-selected="true"]') || pl.querySelector(".a-secenek"); s.focus(); }
      return true;
    }
    if (el.dataset.zamanSec) {
      var pp = kap.dataset.parca, gun2 = (k.dataset.deger || MK.simdi()).slice(0, 10);
      zamanYay(k, pp === "s" ? saatliDeger(k, gun2, el.dataset.zamanSec) : saatliDeger(k, gun2, null, el.dataset.zamanSec));
      MK.zamanAyarla(k.dataset.zaman, k.dataset.deger);
      kap.querySelectorAll(".a-secenek").forEach(function (b) { b.setAttribute("aria-selected", String(b === el)); });
      listeleriKapat(null); kap.querySelector("[data-zaman-parca]").focus(); return true;
    }
    return false;
  }

  /* ── PDF GÖRÜNTÜLEYİCİ (reisim 2026-09-27: "Sistemde herhangi bir yere eklenen herhangi bir pdf daha sonradan açılıp incelenebilir
     olsun sdaece yüklemek olmaz") — TEK ÜRETİCİ: yüklenen her dosyanın yanında "Aç"; indirmeden sayfa sayfa incelenir. Pencere
     gerektiğinde bir kez kurulur; başka pencerenin üstünde de açılır. Seçilen gerçek dosya kendisi, örnek kaydın dosyası sayfa iskeleti olarak gösterilir.
     pdfTus(dosya, ad?) → "Aç" tuşu · MK.pdfGoster({ dosya, baslik, icerik (varsa gerçek önizleme, ör. MB.belge), sayfa }) */
  MK.pdfTus = function (dosya, ad, sinif) { return MK.tus({ eylem: "pdf-goster", ad: ad || "Aç", ikon: "eye", sinif: sinif || "a-tus-ikincil", veri: { dosya: dosya } }); };
  var PDF = { sayfa: 1, toplam: 1, o: null };
  function pdfPencere() {
    var d = $("a-pdf"); if (d) return d;
    d = document.createElement("dialog"); d.className = "a-pencere a-pencere-pdf"; d.id = "a-pdf"; d.setAttribute("aria-labelledby", "a-pdf-baslik");
    d.innerHTML = '<div class="a-pencere-bas"><h2 id="a-pdf-baslik"></h2><button class="a-ikon-tus" type="button" data-eylem="pencere-kapat" aria-label="Kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-pencere-govde" id="a-pdf-govde"></div><div class="a-pencere-alt" id="a-pdf-alt"></div>';
    document.body.appendChild(d); return d;
  }
  function pdfCiz() {
    var o = PDF.o, yuklu = MK.DOSYA[o.dosya];
    /* seçilen gerçek dosya: PDF tarayıcının kendi görüntüleyicisinde (sayfalar orada), fotoğraf resim olarak */
    if (yuklu) {
      $("a-pdf-baslik").textContent = o.baslik || o.dosya;
      $("a-pdf-govde").innerHTML = '<div class="a-pdf-arac"><span class="a-pdf-dosya">' + ikon("file-text", "a-ikon-kucuk") + "<span>" + kacis(o.dosya) + "</span></span></div>" +
        (/pdf/.test(yuklu.tur) ? '<iframe class="a-pdf-cerceve" src="' + yuklu.url + '" title="' + kacis(o.dosya) + '"></iframe>'
          : /^image\//.test(yuklu.tur) ? '<img class="a-pdf-resim" src="' + yuklu.url + '" alt="' + kacis(o.dosya) + '">'
          : '<p class="a-bos-satir">Bu dosya türü burada önizlenemez; “İndir” ile açın.</p>');
      $("a-pdf-alt").innerHTML = MK.tus({ eylem: "pdf-indir", ad: "İndir", ikon: "download", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
      return;
    }
    var o = PDF.o, satir = function (n, uzun) { var h = ""; for (var i = 0; i < n; i++) h += '<span class="a-pdf-satir' + (uzun && i % 3 === 2 ? " a-pdf-satir-kisa" : "") + '"></span>'; return h; };
    $("a-pdf-baslik").textContent = o.baslik || o.dosya;
    $("a-pdf-govde").innerHTML = '<div class="a-pdf-arac"><span class="a-pdf-dosya">' + ikon("file-text", "a-ikon-kucuk") + "<span>" + kacis(o.dosya) + "</span></span>" +
        '<span class="a-pdf-sayfa-no">Sayfa ' + PDF.sayfa + " / " + PDF.toplam + "</span>" +
        '<button class="a-ikon-tus" type="button" data-eylem="pdf-sayfa" data-yon="-1" aria-label="Önceki sayfa"' + (PDF.sayfa === 1 ? " disabled" : "") + ">" + ikon("chevron-left") + "</button>" +
        '<button class="a-ikon-tus" type="button" data-eylem="pdf-sayfa" data-yon="1" aria-label="Sonraki sayfa"' + (PDF.sayfa === PDF.toplam ? " disabled" : "") + ">" + ikon("chevron-right") + "</button></div>" +
      (o.icerik && PDF.sayfa === 1 ? o.icerik : '<div class="a-pdf-sayfa" role="img" aria-label="' + kacis(o.dosya) + ", sayfa " + PDF.sayfa + '">' +
        '<div class="a-pdf-bas"><span class="a-pdf-logo">Logo</span><span class="a-pdf-bas-yazi">' + satir(2) + "</span></div>" + satir(14, true) + "</div>");
    $("a-pdf-alt").innerHTML = MK.tus({ eylem: "pdf-indir", ad: "İndir", ikon: "download", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
  }
  MK.pdfGoster = function (o) {
    PDF.o = o; PDF.sayfa = 1; PDF.toplam = o.sayfa || 2;
    var d = pdfPencere(); pdfCiz(); if (!d.open) d.showModal(); $("a-pdf-govde").scrollTop = 0;
    $("a-pdf-alt").querySelector(".a-tus-birincil").focus({ preventScroll: true });
  };
  MK.eylem = MK.eylem || {};
  MK.eylem["pdf-goster"] = function (el) { MK.pdfGoster({ dosya: el.dataset.dosya }); };
  MK.eylem["pdf-sayfa"] = function (el) { PDF.sayfa = Math.min(PDF.toplam, Math.max(1, PDF.sayfa + +el.dataset.yon)); pdfCiz(); var t = document.querySelector('#a-pdf [data-eylem="pdf-sayfa"][data-yon="' + el.dataset.yon + '"]'); (t && !t.disabled ? t : $("a-pdf-alt").querySelector(".a-tus-birincil")).focus(); };
  /* İndir: seçilen gerçek dosya aynen iner; belge (rapor, form) yazdırma penceresinden PDF olur; örnek kayıt dosyası maket PDF'i olarak iner */
  MK.eylem["pdf-indir"] = function () {
    var o = PDF.o, d = MK.DOSYA[o.dosya];
    if (d && d.dosya) MK.indir(o.dosya, d.dosya); else if (d && d.url) MK.indirUrl(o.dosya, d.url); else if (o.icerik) MK.yazdir(o.baslik || o.dosya, o.icerik); else MK.indir(o.dosya, MK.ornekPdf(o.dosya));
  };

  /* ── DOSYA: seç · indir · yazdır · Excel (reisim 2026-09-27: "maket site nasıl çalışması gerekiyorsa çalışsın maket olduğu için çalışmayan
     yerler de dahil"). Seçilen dosya TARAYICIDA kalır (sunucuya gitmez, sayfa yenilenince gider); adıyla MK.DOSYA'da tutulur, "Aç" onu gösterir.
     Otomatik ölçüm (MAKET_ORNEK) dosya penceresini açamaz: örnek ad kullanılır. Dış kütüphane yok (anayasa: dış CDN yok). */
  MK.DOSYA = {};
  MK.dosyaSec = function (o, cb) {   /* o = { kabul, ornek, kamera, coklu, enCokMB } · cb(ad, File|null) her dosya için */
    if (window.MAKET_ORNEK) { cb(o.ornek, null); return; }
    [].forEach.call(document.querySelectorAll("input[data-mk-dosya]"), function (e) { e.remove(); });
    var g = document.createElement("input"); g.type = "file"; g.hidden = true; g.setAttribute("data-mk-dosya", "");
    if (o.kabul) g.accept = o.kabul; if (o.kamera) g.setAttribute("capture", "environment"); if (o.coklu) g.multiple = true;
    g.addEventListener("change", function () {
      [].slice.call(g.files || []).forEach(function (f) {
        if (o.enCokMB && f.size > o.enCokMB * 1048576) { MK.bildir(f.name + " " + o.enCokMB + " MB'tan büyük; eklenmedi."); return; }
        MK.DOSYA[f.name] = { url: URL.createObjectURL(f), tur: f.type, boyut: f.size, dosya: f }; cb(f.name, f);
      });
      g.remove();
    });
    document.body.appendChild(g); g.click();
  };
  /* 2026-09-27: seçilen gerçek fotoğraf küçük resim olarak görünür, basınca görüntüleyicide açılır; örnek kayıtta simge */
  MK.fotolar = function (n, adlar, etiket) {
    var s = ""; for (var i = 1; i <= n; i++) {
      var ad = adlar && adlar[i - 1], d = ad && MK.DOSYA[ad], ne = (etiket ? etiket + " fotoğraf " : "Fotoğraf ") + i;
      s += d ? '<button class="a-foto a-foto-resim" type="button" data-eylem="pdf-goster" data-dosya="' + kacis(ad) + '" aria-label="' + kacis(ne) + '"><img src="' + d.url + '" alt=""><span class="a-foto-no">' + i + "</span></button>"
        : '<span class="a-foto" role="img" aria-label="' + kacis(ne) + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>";
    }
    return s;
  };
  /* ekrandaki tablo → satırlar (kart etiketi ve gizli yazı hariç; "12.500,00 TL" sayı olur) — Excel'e aktarılan liste ekrandakiyle aynı */
  MK.tablodanSatirlar = function (tablo) {
    var metin = function (h) {
      var k = h.cloneNode(true); [].forEach.call(k.querySelectorAll(".a-kart-etiket, .a-gizli, button, svg"), function (e) { e.remove(); });
      [].forEach.call(k.querySelectorAll(".a-alt-satir"), function (e) { e.textContent = " · " + e.textContent; });
      var t = k.textContent.replace(/\s+/g, " ").replace(/^ · /, "").trim(), m = /^(−|-)?%?([\d.]+(,\d+)?)( TL)?$/.exec(t);
      return m ? (m[1] ? -1 : 1) * parseFloat(m[2].replace(/\./g, "").replace(",", ".")) : t;
    };
    return [[].map.call(tablo.querySelectorAll("thead th"), metin)].concat([].map.call(tablo.querySelectorAll("tbody tr"), function (tr) { return [].map.call(tr.children, metin); }));
  };
  MK.indir = function (ad, blob) {
    var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = ad; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
    MK.SON_INDIRME = { ad: ad, tur: blob.type, boyut: blob.size }; MK.bildir(ad + " indirildi.");
  };
  /* sitedeki bir dosya (ör. Bakanlığın resmî PDF'leri, docs/maket/belgeler/) adresinden iner */
  MK.indirUrl = function (ad, url) {
    var a = document.createElement("a"); a.href = url; a.download = ad; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
    MK.SON_INDIRME = { ad: ad, tur: "application/pdf", url: url }; MK.bildir(ad + " indirildi.");
  };
  /* belge → tarayıcının yazdırma penceresi ("PDF olarak kaydet"); sayfanın kendi stilleriyle, açık temada */
  MK.yazdir = function (baslik, html) {
    var f = document.createElement("iframe"); f.className = "a-yazdir"; f.tabIndex = -1; f.setAttribute("aria-hidden", "true"); f.title = baslik;
    document.body.appendChild(f);
    var stil = [].map.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return '<link rel="stylesheet" href="' + l.href + '">'; }).join("");
    var d = f.contentDocument; d.open();
    d.write('<!doctype html><html lang="tr" data-tema="acik"><head><meta charset="utf-8"><title>' + kacis(baslik) + "</title>" + stil +
      "<style>@page{margin:12mm}body{margin:0;background:#fff}</style></head><body class=\"a-yazdir-govde\">" + html + "</body></html>");
    d.close();
    MK.SON_INDIRME = { ad: baslik + ".pdf", tur: "yazdir" };
    if (window.MAKET_ORNEK) { f.remove(); MK.bildir(baslik + ": yazdırma penceresi açıldı."); return; }
    setTimeout(function () { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(function () { f.remove(); }, 1000); }, 500);
    MK.bildir("Yazdırma penceresinde “PDF olarak kaydet”i seçin.");
  };
  /* ── ZIP (sıkıştırmasız yazma; okurken deflate tarayıcının DecompressionStream'i ile) ── */
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  var crc32 = function (b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zipYaz(dosyalar) {   /* [[ad, metin]] → Uint8Array */
    var te = new TextEncoder(), parca = [], merkez = [], ofs = 0;
    var u16 = function (v) { return [v & 255, (v >>> 8) & 255]; }, u32 = function (v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; };
    dosyalar.forEach(function (x) {
      var ad = te.encode(x[0]), veri = te.encode(x[1]), c = crc32(veri);
      var yerel = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(veri.length), u32(veri.length), u16(ad.length), u16(0));
      parca.push(new Uint8Array(yerel), ad, veri);
      merkez.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(veri.length), u32(veri.length),
        u16(ad.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(ofs))), ad);
      ofs += yerel.length + ad.length + veri.length;
    });
    var mb = merkez.reduce(function (n, x) { return n + x.length; }, 0);
    var son = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(dosyalar.length), u16(dosyalar.length), u32(mb), u32(ofs), u16(0)));
    var hepsi = parca.concat(merkez, [son]), t = hepsi.reduce(function (n, x) { return n + x.length; }, 0), out = new Uint8Array(t), i = 0;
    hepsi.forEach(function (x) { out.set(x, i); i += x.length; });
    return out;
  }
  var xe = function (v) { return String(v).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); };
  /* satırlar (ilki başlık) → .xlsx Blob; sayı hücresi sayı olarak yazılır */
  MK.xlsx = function (sayfa, satirlar) {
    var sutun = function (i) { var s = ""; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    var govde = satirlar.map(function (r, ri) {
      return '<row r="' + (ri + 1) + '">' + r.map(function (h, ci) {
        var ref = sutun(ci) + (ri + 1);
        return typeof h === "number" ? '<c r="' + ref + '"><v>' + h + "</v></c>" : '<c r="' + ref + '" t="inlineStr"' + (ri === 0 ? ' s="1"' : "") + "><is><t>" + xe(h == null ? "" : h) + "</t></is></c>";
      }).join("") + "</row>";
    }).join("");
    var z = zipYaz([
      ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xe(sayfa.slice(0, 31)) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ["xl/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ["xl/worksheets/sheet1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + govde + "</sheetData></worksheet>"]
    ]);
    return new Blob([z], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  };
  /* .xlsx / .csv → Promise<satırlar (metin dizisi)>; Excel tarih sayısı gün.ay.yıl'a çevrilir (MK.excelTarih) */
  var inflate = function (b) { return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (x) { return new Uint8Array(x); }); };
  function zipOku(buf) {
    var v = new DataView(buf), b = new Uint8Array(buf), e = -1, td = new TextDecoder();
    for (var i = b.length - 22; i >= 0; i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) return Promise.reject(new Error("zip değil"));
    var n = v.getUint16(e + 10, true), p = v.getUint32(e + 16, true), l = {};
    for (var k = 0; k < n; k++) {
      var yon = v.getUint16(p + 10, true), boy = v.getUint32(p + 20, true), an = v.getUint16(p + 28, true), ex = v.getUint16(p + 30, true), ko = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      var ad = td.decode(b.subarray(p + 46, p + 46 + an)), bas = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), veri = b.subarray(bas, bas + boy);
      l[ad] = yon === 0 ? Promise.resolve(veri) : inflate(veri);
      p += 46 + an + ex + ko;
    }
    return Promise.resolve(l);
  }
  MK.excelTarih = function (x) {
    var s = String(x).trim(); if (!/^\d{5}(\.\d+)?$/.test(s)) return s;
    var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 864e5); return MK.tarihNo(d.toISOString().slice(0, 10));
  };
  MK.tabloOku = function (dosya) {
    return dosya.arrayBuffer().then(function (buf) {
      if (/\.(csv|txt)$/i.test(dosya.name)) {
        var m = new TextDecoder().decode(buf).replace(/^\uFEFF/, ""), ayr = (m.split("\n")[0].match(/;/g) || []).length ? ";" : m.indexOf("\t") >= 0 ? "\t" : ",";
        return m.split(/\r?\n/).filter(function (x) { return x.trim(); }).map(function (x) { return x.split(ayr).map(function (h) { return h.replace(/^"|"$/g, "").trim(); }); });
      }
      return zipOku(buf).then(function (z) {
        var td = new TextDecoder(), dp = new DOMParser(), ad = Object.keys(z).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
        if (!ad) throw new Error("sayfa yok");
        return Promise.all([z["xl/sharedStrings.xml"] || Promise.resolve(null), z[ad]]).then(function (x) {
          var ortak = x[0] ? [].map.call(dp.parseFromString(td.decode(x[0]), "application/xml").getElementsByTagName("si"), function (si) { return si.textContent; }) : [];
          var doc = dp.parseFromString(td.decode(x[1]), "application/xml");
          return [].map.call(doc.getElementsByTagName("row"), function (row) {
            var r = [];
            [].forEach.call(row.getElementsByTagName("c"), function (c) {
              var ref = (c.getAttribute("r") || "").replace(/\d+/g, ""), ci = 0; for (var j = 0; j < ref.length; j++) ci = ci * 26 + ref.charCodeAt(j) - 64; ci = ref ? ci - 1 : r.length;
              var t = c.getAttribute("t"), vEl = c.getElementsByTagName("v")[0], val = t === "s" ? ortak[+(vEl && vEl.textContent)] : t === "inlineStr" ? c.textContent : vEl ? vEl.textContent : "";
              while (r.length < ci) r.push(""); r[ci] = (val == null ? "" : String(val)).trim();
            });
            return r;
          }).filter(function (r) { return r.some(function (h) { return h; }); });
        });
      });
    });
  };
  /* örnek kayıt dosyası (makette dosyası olmayan) → tek sayfalık maket PDF'i (PDF'in standart yazı tipinde Türkçe harf yok: sadeleşir) */
  MK.ornekPdf = function (ad) {
    var sade = function (t) { return String(t).replace(/[çÇğĞıİöÖşŞüÜ]/g, function (c) { return { "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "İ": "I", "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U" }[c]; }).replace(/[()\\]/g, "").replace(/[^\x20-\x7e]/g, "?"); };
    var akis = "BT /F1 16 Tf 56 780 Td (" + sade(ad) + ") Tj 0 -28 Td /F1 11 Tf (probata maket - ornek dosya; gercek dosya uygulamada yuklenen dosyadir.) Tj ET";
    var ob = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Length " + akis.length + " >>\nstream\n" + akis + "\nendstream"];
    var m = "%PDF-1.4\n", ofs = [];
    ob.forEach(function (o, i) { ofs.push(m.length); m += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
    var x = m.length; m += "xref\n0 " + (ob.length + 1) + "\n0000000000 65535 f \n" + ofs.map(function (o) { return ("000000000" + o).slice(-10) + " 00000 n \n"; }).join("") +
      "trailer\n<< /Size " + (ob.length + 1) + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF";
    return new Blob([m], { type: "application/pdf" });
  };

  /* ── BİLDİRİM · ÇEKMECE · DARALTMA · TEMA ───────────────────────────────────────────────────────── */
  var bildirimZaman;
  MK.bildir = function (m) {
    $("a-bildirim-metin").textContent = m; $("a-bildirim").classList.add("a-gorunur");
    clearTimeout(bildirimZaman); bildirimZaman = setTimeout(function () { $("a-bildirim").classList.remove("a-gorunur"); }, 2800);
  };
  function listeleriKapat(haric) {
    document.querySelectorAll(".a-secici").forEach(function (s) {
      if (s === haric) return;
      var l = s.querySelector(".a-secici-liste"), t = s.querySelector("[aria-expanded]");
      if (l) l.hidden = true; if (t) t.setAttribute("aria-expanded", "false");
    });
  }
  /* Yan menü daraltma (reisim 2026-09-23: "sol taraf açılıp kapanabilir olsun kapatılınca sadece logolar kalsın").
     Yalnız geniş bantta (≥ 1280) etkili — CSS daralmış hâli o banda bağlar; orta/dar bantta çekmece aynen (anayasa 2.11).
     Daralmışken ad görünmez (ekran okuyucu okur), üstüne gelince ipucu (title). Tercih bu cihazda saklanır.
     İpucu YALNIZ daralmış şerit görünürken: orta/dar bantta çekmece adı zaten yazar, ipucu aynı adı tekrarlardı
     (canlı ölçümde 1080'de 17 çift ad yakalandı, 2026-09-23) → bant değişince yeniden hesaplanır. */
  var MENU_DAR = false, GENIS_BANT = window.matchMedia("(min-width: 1280px)");
  try { MENU_DAR = localStorage.getItem("probata-menu") === "dar"; } catch (x) {}
  function menuIpucu() {
    var serit = MENU_DAR && GENIS_BANT.matches;
    document.querySelectorAll("#a-menu a").forEach(function (a) {
      if (serit) a.setAttribute("title", a.querySelector(".a-menu-ad").textContent); else a.removeAttribute("title");
    });
  }
  function menuDar(dar) {
    MENU_DAR = dar;
    var k = $("a-kabuk"); if (!k) return;
    k.classList.toggle("a-kabuk-dar", dar);
    var tus = document.querySelector(".a-daralt-tus");
    tus.setAttribute("aria-expanded", String(!dar));
    tus.setAttribute("aria-label", dar ? "Menüyü genişlet" : "Menüyü daralt");
    menuIpucu();
    try { localStorage.setItem("probata-menu", dar ? "dar" : "genis"); } catch (x) {}
  }
  GENIS_BANT.addEventListener("change", menuIpucu);
  function cekmece(ac) {
    $("a-kabuk").classList.toggle("a-cekmece-acik", ac);
    document.querySelector(".a-menu-tus").setAttribute("aria-expanded", String(ac));
  }
  function temaEtiketi() {
    var t = $("a-tema-tus"); if (!t) return;
    t.setAttribute("aria-label", document.documentElement.getAttribute("data-tema") === "koyu" ? "Açık temaya geç" : "Koyu temaya geç");
  }
  var szOf = function (el) { var z = el.closest("[data-sz]"); return z ? z.dataset.sz : null; };
  function yenile(on) { if (YENILE[on]) YENILE[on](); }

  /* ── OLAY DAĞITICI — tek dinleyici; sayfa kendi işlerini MK.eylem[ad] ve kancalarla ekler ─────────────────
     MK.onTikla(e) → true dönerse iş bitti (sayfaya özgü öznitelikler) · MK.eylem[ad](el, e) · MK.onGirdi(e) ·
     MK.onTus(e) → true dönerse iş bitti · MK.onSecim(id, deger) · MK.goster(odakla) adres değişince. */
  MK.eylem = MK.eylem || {};   /* ortak eylemler (PDF görüntüleyici) önce kaydolur */
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".a-secici")) listeleriKapat(null);
    if (zamanTikla(e)) return;
    if (MK.onTikla && MK.onTikla(e)) return;
    var el = e.target.closest("[data-cip],[data-kip],[data-sec],[data-secici-ac],[data-secim-ac],[data-secim],[data-sirala],[data-sayfa],[data-eylem]");
    if (!el) {
      var satir = e.target.closest("tr[data-href]");   /* tıklanır satır / kart: tuşa ya da bağlantıya basılmadıysa kayda girer */
      if (satir && !e.target.closest("a, button, label, input")) location.hash = satir.getAttribute("data-href");
      return;
    }
    var on = szOf(el);
    if (el.dataset.cip) {
      var i = SZ[on].secili.indexOf(el.dataset.cip);
      if (i >= 0) SZ[on].secili.splice(i, 1); else SZ[on].secili.push(el.dataset.cip);
      SZ[on].sayfa = 1; yenile(on); return;
    }
    if (el.dataset.kip) { if (!el.disabled) { SZ[on].kip = el.dataset.kip; SZ[on].sayfa = 1; yenile(on); } return; }
    if (el.dataset.sirala) {
      var k = el.dataset.sirala, v = SZ[on].sec.sira;
      SZ[on].sec.sira = v === k + "-artan" ? k + "-azalan" : v === k + "-azalan" ? "varsayilan" : k + "-artan";
      seciciCiz(on); yenile(on);
      var yeni = document.querySelector('.a-tablo[data-sz="' + on + '"] [data-sirala="' + k + '"]'); if (yeni) yeni.focus();
      return;
    }
    if (el.dataset.sayfa) {
      if (el.disabled) return;
      SZ[on].sayfa = +el.dataset.sayfa; yenile(on);
      var sy = document.querySelector('.a-sayfalar[data-sz="' + on + '"] .a-sayfa[aria-current="page"]'); if (sy) sy.focus();
      return;
    }
    if (el.dataset.seciciAc || el.dataset.secimAc) {
      var kp = el.closest(".a-secici"), l = kp.querySelector(".a-secici-liste"), acik = l.hidden;
      listeleriKapat(kp); l.hidden = !acik; el.setAttribute("aria-expanded", String(acik));
      if (acik) (l.querySelector(".a-secim-ara") || l.querySelector('[aria-selected="true"]') || l.querySelector(".a-secenek")).focus();
      return;
    }
    if (el.dataset.secim) {
      var sk = el.closest(".a-secici"); listeleriKapat(null);
      if (MK.onSecim) MK.onSecim(el.dataset.secim, el.dataset.deger);
      var dt = $(el.dataset.secim) || (sk && sk.querySelector(".a-secim-tus")); if (dt) dt.focus();
      return;
    }
    if (el.dataset.sec) { SZ[on].sec[el.dataset.sec] = el.dataset.deger; SZ[on].sayfa = 1; seciciCiz(on); if ($("a-levha").open) levhaCiz(on); yenile(on); return; }
    if (el.tagName === "A" && el.dataset.eylem) e.preventDefault();   /* maket içi bağlantı adresi (#) değiştirmez */
    var ad = el.dataset.eylem;
    switch (ad) {
      case "cekmece-ac": cekmece(true); return;
      case "menu-daralt": menuDar(!MENU_DAR); return;
      case "cekmece-kapat": cekmece(false); return;
      case "tema":
        var tema = document.documentElement.getAttribute("data-tema") === "koyu" ? "acik" : "koyu";
        document.documentElement.setAttribute("data-tema", tema);
        try { localStorage.setItem("probata-tema", tema); } catch (x) {}
        temaEtiketi(); return;
      case "ara-sil":
        SZ[on].ara = ""; SZ[on].sayfa = 1; var ak = kap(on); ak.querySelector("[data-ara]").value = ""; ak.querySelector(".a-ara").classList.remove("a-dolu");
        yenile(on); ak.querySelector("[data-ara]").focus(); return;
      case "temizle":
        on = on || $("a-levha").dataset.sz; temizle(on); seciciCiz(on); if ($("a-levha").open) levhaCiz(on); yenile(on); return;
      case "levha-ac": levhaCiz(on); $("a-levha").showModal(); return;
      case "levha-kapat": $("a-levha").close(); return;
      case "pencere-kapat": var d = el.closest("dialog"); if (d) d.close(); return;
      case "modul": cekmece(false); MK.bildir("Maket: " + el.dataset.ne + " ekranı henüz tasarlanmadı."); return;
      case "kapsam-disi": MK.bildir("Maket: " + el.dataset.ne + " bu maketin kapsamında değil."); return;
    }
    if (MK.eylem[ad]) MK.eylem[ad](el, e);
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.ara) {   /* arama: yalnız liste yeniden çizilir, kutu yerinde kalır (odak çalınmaz) */
      var on = t.dataset.ara; SZ[on].ara = t.value; SZ[on].sayfa = 1; t.closest(".a-ara").classList.toggle("a-dolu", !!t.value); yenile(on); return;
    }
    if (zamanYaz(t)) return;   /* tarih / saat alanı */
    if (t.dataset && t.dataset.secimAra) {   /* seçim alanının arama kutusu: seçenekleri süzer */
      var q = MK.tr(t.value.trim()), l = t.closest(".a-secici-liste"), n = 0;
      l.querySelectorAll(".a-secenek").forEach(function (b) { var g = !q || MK.tr(b.textContent).indexOf(q) >= 0; b.hidden = !g; if (g) n++; });
      l.querySelector(".a-secim-yok").hidden = n > 0; return;
    }
    if (MK.onGirdi) MK.onGirdi(e);
  });
  /* odak çerçevesi (reisim 2026-09-27: "seçili alanların etrafında çerçeve kalıyor"): fareyle / dokunarak kullanılırken kalın çerçeve
     çizilmez (yazı alanında yalnız kenar koyulaşır); klavyeyle (Tab, oklar) gezinilince çerçeve geri gelir — erişilebilirlik korunur */
  document.addEventListener("pointerdown", function () { document.documentElement.setAttribute("data-giris", "fare"); }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Tab" || e.key.indexOf("Arrow") === 0) document.documentElement.setAttribute("data-giris", "klavye"); }, true);
  document.addEventListener("keydown", function (e) {
    if (MK.onTus && MK.onTus(e)) return;
    if (e.key !== "Escape") return;
    var acik = document.querySelector('.a-secici [aria-expanded="true"]');
    if (acik) { e.preventDefault(); listeleriKapat(null); acik.focus(); return; }
    var kb = $("a-kabuk"); if (kb && kb.classList.contains("a-cekmece-acik")) cekmece(false);
  }, true);
  window.addEventListener("hashchange", function () { if (MK.goster) MK.goster(true); });
  window.addEventListener("resize", function () { Object.keys(KIP_LISTE).forEach(function (on) { if ($(KIP_LISTE[on])) MK.listeKipi(on); }); });
})();
