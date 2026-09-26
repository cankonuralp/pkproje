/* ══ probata MAKET — ORTAK ÜRETİCİLER (toplu maket çalışması, 2026-09-24) ═══════════════════════════════════════
   MAKET-PLANI.md §3.2: kabuk ve ortak parçalar TEK üreticiden (anayasa 2.9, kalıp 15–16). Planlar maketinin (5. tur, onaylı)
   kabuğu, süzgeç satırı, liste (tablo ↔ kart, eşik 960), sayfalayıcı, boş durum, bildirim ve olay dağıtıcısı buraya AYNEN
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
  var GUN = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  /* tarih bölünmez (gün adı · gün · ay birlikte kalır) */
  MK.gunYaz = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return GUN[d.getDay()] + " " + d.getDate() + " " + AY[d.getMonth()]; };
  MK.gunKisa = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return d.getDate() + " " + AY[d.getMonth()]; };
  MK.ayYil = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return AY[d.getMonth()] + " " + d.getFullYear(); };
  /* tam tarih: gün ay yıl (belge ve bitiş tarihlerinde yıl şart) */
  MK.tarihYaz = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return d.getDate() + " " + AY[d.getMonth()] + " " + d.getFullYear(); };
  MK.zamanYaz = function (z) { return MK.gunKisa(z) + " " + z.slice(11, 16); };
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
  /* genis: true → telefonda tam satır · "cift" → her bantta iki sütun (bölünmez uzun kimlik, ör. 26 haneli SGK sicil no) */
  MK.bilgi = function (etiket, deger, genis) { return '<div class="a-bilgi-oge' + (genis === "cift" ? " a-bilgi-genis a-bilgi-cift" : genis ? " a-bilgi-genis" : "") + '"><dt>' + etiket + "</dt><dd>" + deger + "</dd></div>"; };
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
  var EK_SAYFALAR = { ana: "anasayfa.html", giris: "giris.html", "plan-ac": "plan-ac.html", sablon: "sablon.html", rapor: "rapor.html", musteri: "musteri.html", "is-sozlesmesi": "is-sozlesmeleri.html" };
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
       o.musteri = { ad: müşteri kısa adı }. Aynı üst çubuk sınıfları (ikinci aile yok). */
    if (o.musteri) {
      kok.className = "a-kabuk a-kabuk-musteri";
      kok.innerHTML = '<div class="a-govde"><header class="a-ust">' +
          '<img class="a-ust-logo a-ust-logo-acik" src="../marka/probata-yatay-renkli.svg" alt="probata" width="120" height="30">' +
          '<img class="a-ust-logo a-ust-logo-koyu" src="../marka/probata-yatay-koyu-zemin.svg" alt="probata" width="120" height="30">' +
          '<span class="a-ust-panel">Müşteri paneli</span><div class="a-ust-bosluk"></div>' +
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
  MK.suzgecHtml = function (on) {
    var t = SZ_TANIM[on], secicili = t.seciciler.length > 0;
    return '<div class="a-suzgec" data-sz="' + on + '"' + (secicili ? "" : " data-secicisiz") + ">" +
      '<label class="a-ara"><span class="a-gizli">' + t.ad + "</span>" + ikon("search") +
        '<input type="search" data-ara="' + on + '" placeholder="' + t.ipucu + '" autocomplete="off">' +
        '<button class="a-ara-sil" type="button" data-eylem="ara-sil" aria-label="Aramayı temizle">' + ikon("x", "a-ikon-kucuk") + "</button></label>" +
      (secicili ? '<button class="a-suzgec-tus" type="button" data-eylem="levha-ac" aria-haspopup="dialog">' + ikon("sliders-horizontal") +
        'Süzgeç <span class="a-suzgec-rozet" hidden></span></button>' : "") +
      '<div class="a-cipler" role="group" aria-label="' + t.birim + ' durumu süzgeci"></div>' +
      '<div class="a-suzgec-sag"><div class="a-seciciler"></div>' +
        '<button class="a-temizle" type="button" data-eylem="temizle">' + ikon("filter-x", "a-ikon-kucuk") + "Temizle</button></div></div>";
  };
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

  /* ── FORM ALANI — TEK ÜRETİCİ (kalıp 3: alan veri tipine göre, sınıfla; hata ipucunun yerine yazılır) ─────────────
     alan({ id, etiket, girdi (html), ipucu, hata, zorunlu (true | metin), genis }) · girdi({ id, alan (veri anahtarı), deger,
     sinif, ek (öznitelikler), hata }) — girdi `data-alan` taşır; sayfa MK.onGirdi'de e.target.dataset.alan'ı okur. */
  MK.alan = function (o) {
    return '<div class="a-alan-grup' + (o.genis ? " a-alan-genis" : "") + '"><label class="a-etiket" for="' + o.id + '">' + o.etiket +
      (o.zorunlu ? ' <span class="a-zorunlu">' + (o.zorunlu === true ? "zorunlu" : o.zorunlu) + "</span>" : "") + "</label>" + o.girdi +
      (o.hata ? '<p class="a-ipucu a-ipucu-uyari" id="' + o.id + '-ipucu">' + o.hata + "</p>" : o.ipucu ? '<p class="a-ipucu" id="' + o.id + '-ipucu">' + o.ipucu + "</p>" : "") + "</div>";
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
  MK.eylem = {};
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".a-secici")) listeleriKapat(null);
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
    if (t.dataset && t.dataset.secimAra) {   /* seçim alanının arama kutusu: seçenekleri süzer */
      var q = MK.tr(t.value.trim()), l = t.closest(".a-secici-liste"), n = 0;
      l.querySelectorAll(".a-secenek").forEach(function (b) { var g = !q || MK.tr(b.textContent).indexOf(q) >= 0; b.hidden = !g; if (g) n++; });
      l.querySelector(".a-secim-yok").hidden = n > 0; return;
    }
    if (MK.onGirdi) MK.onGirdi(e);
  });
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
