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
     anasayfa olmalı"); modül değil, giriş sonrası açılan sayfa — MENU sabitine girmez.
     2026-09-28 (reisim: "talepler kısmı olsun denetçi izin talebi masraf formu ekleme"): Talepler (21) Personel grubunda.
     2026-09-28 (reisim: "dökümanlar modülü olsun standartlar bunun altında olsun, eğitimler, muayene kriterleri, standartlar ve diğer
     dökümanlar bu kısımda tutulsun"): Standartlar (4) → Dökümanlar; Eğitimler (10) menüden kalktı, Dökümanlar'ın sekmesi (sayfası kalır). */
  var MENU = [
    { grup: "İş takibi", ogeler: [["Planlar", "calendar-check", 13], ["Raporlar", "file-text", 14], ["Onaylar", "badge-check", 15], ["Uyarılar", "alarm-clock", 20]] },
    { grup: "Müşteri", ogeler: [["Müşteriler", "building-2", 3], ["Teklifler", "file-pen-line", 11], ["Sözleşmeler", "scroll-text", 12]] },
    { grup: "Varlık", ogeler: [["Ölçüm cihazları", "gauge", 8], ["Zimmetler", "package", 9]] },
    { grup: "Personel", ogeler: [["Personel", "users", 2], ["Talepler", "inbox", 21]] },
    { grup: "Finans", ogeler: [["Muhasebe", "wallet", 18], ["Performans", "chart-column", 19]] },
    { grup: "Tanımlar", ogeler: [["Ekipman türleri", "layers", 5], ["Dökümanlar", "book-open", 4]] }
  ];
  /* hazır maketler: menüden tıklanınca gidilir (toplu bakışta tıklanır prototip, MAKET-PLANI §3.3); olmayan → bildirim */
  var SAYFALAR = { 13: "planlarim.html", 2: "personel.html", 3: "musteriler.html", 5: "ekipman-turleri.html", 8: "olcum-cihazlari.html", 9: "zimmetler.html", 12: "sozlesmeler.html", 4: "standartlar.html", 14: "raporlar.html", 15: "onaylar.html", 20: "uyarilar.html", 11: "teklifler.html", 18: "muhasebe.html", 19: "performans.html", 10: "egitimler.html", 21: "talepler.html" };
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
          return "<li><a " + a + ">" + ikon(x[1]) + '<span class="a-menu-ad" title="' + x[0] + '">' + x[0] + "</span>" +
            (o.sayac && o.sayac[x[2]] ? '<span class="a-menu-sayi" id="a-menu-sayi-' + x[2] + '" title="' + o.sayac[x[2]] + '"></span>' : "") +
            '<span class="a-menu-takip" id="a-menu-takip-' + x[2] + '">' + takipHtml(x[2]) + "</span></a></li>";
        }).join("") + "</ul>";
    }).join("");
  }
  /* takip balonları (2026-09-28, T6; reisim: "cihazlarda süresi geçen cihaz sayısı kırmızı balon, yaklaşan sarı balon, sorunsuz cihazlar
     yeşil balon … diğer modüllerde de benzer takip"): sayılar ortak veriden (MV.takip), her sayfada aynı; 0 olan balon çizilmez; değişince
     (tıklama, yazma) yenilenir. Daraltılmış menüde yalnız en önemli renk görünür. */
  var TAKIP_RENK = [["kirmizi", "a-balon-kirmizi"], ["sari", "a-balon-sari"], ["yesil", "a-balon-yesil"]];
  function takipHtml(no) {
    var t = typeof MV !== "undefined" && MV.takip ? MV.takip(no) : null; if (!t) return "";
    return TAKIP_RENK.filter(function (r) { return t[r[0]]; }).map(function (r) {
      return '<span class="a-balon ' + r[1] + '" title="' + t[r[0]] + " " + t.ad[r[0]] + '">' + t[r[0]] + '<span class="a-gizli"> ' + t.ad[r[0]] + "</span></span>"; }).join("");
  }
  MK.takipCiz = function () { MENU.forEach(function (g) { g.ogeler.forEach(function (x) { var e = $("a-menu-takip-" + x[2]); if (e) { var h = takipHtml(x[2]); if (e.innerHTML !== h) e.innerHTML = h; } }); }); };
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
        '<div class="a-cubuk-alt"><span>Maket · uydurma veri</span><button class="a-cubuk-sifirla" type="button" data-eylem="maket-sifirla">Denemeleri sıfırla</button></div></aside>' +
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
        /* kullanıcının kendi işlemleri (2026-09-28; reisim: "her kullanıcı profilinden yapacak masraf ve izin formu doldurmak gibi gerekli
           işlemleri"): ada basınca Taleplerim · İzin talebi · Masraf formu (Talepler modülü, işe bağlı ya da genel masraf) */
        '<div class="a-secici a-kullanici-secici"><button class="a-kullanici" type="button" data-secici-ac="kullanici" aria-haspopup="menu" aria-expanded="false" aria-label="' + kacis(o.kullanici.ad) + ' · kendi işlemlerim">' +
          '<span class="a-avatar" aria-hidden="true">' + kacis(o.kullanici.bas) + "</span>" +
          '<span class="a-kullanici-yazi"><span class="a-kullanici-ad">' + kacis(o.kullanici.ad) + '</span><span class="a-kullanici-rol">' + kacis(o.kullanici.rol) + "</span></span></button>" +
          '<div class="a-secici-liste" role="menu" aria-label="Kendi işlemlerim" hidden>' +
            [["#/", "Taleplerim"], ["#/yeni/izin", "İzin talebi"], ["#/yeni/masraf", "Masraf formu"]].map(function (x) { return '<a class="a-secenek" role="menuitem" href="' + MK.adres(21, x[0]) + '">' + x[1] + "</a>"; }).join("") +
          "</div></div>" +
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
     Her süzgeç bir kısa adla (on) tanımlanır: tanim = { ad, ipucu, birim, cipler, seciciler, metin(kayıt), imkansiz, sayfa?, alanlar? }.
     alanlar (alan alan arama kutuları) varsa genel arama kutusu çizilmez (§3.8 kural 6).
     Satır: arama → yüklem çipleri + ve/veya (kalıp 8) → seçiciler + Temizle sağda. Telefonda seçiciler levhada.
     Çiplerin `grup`u aynıysa birbirini dışlar: "ve" ile ikisi seçilince sonuç imkânsızdır, sebebi söylenir.
     yenile: süzgeç değişince çağrılır (liste, çipler, sayaç ve sayfalayıcı yeniden çizilir; arama kutusu yerinde kalır). */
  var SZ_TANIM = {}, SZ = MK.SZ = {}, YENILE = {};
  function yeniSz(on) {
    var s = { ara: "", secili: [], kip: "veya", sec: {}, sayfa: 1, alan: {} };
    (SZ_TANIM[on].alanlar || []).forEach(function (x) { s.alan[x.k] = ""; });
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
      /* alan alan arama; genel aramanın yerinde, ilk sırada (reisim 2026-09-28: "ekipman türüne rapor numarasına göre ayrı ayrı arayabilmeliyim"): tanim.alanlar = [{ k, ad, ipucu, metin(kayıt) }] */
      (t.alanlar ? '<div class="a-suzgec-alanlar" style="flex-basis:' + t.alanlar.length * 212 + 'px">' + t.alanlar.map(function (x) {
        return '<label class="a-alan-ara"><span class="a-alan-ara-ad">' + x.ad + '</span><input class="a-girdi" type="search" data-alan-ara="' + on + "|" + x.k + '" placeholder="' + (x.ipucu || "") + '" autocomplete="off"></label>';
      }).join("") + "</div>" : "") +
      /* alan kutuları olan listede genel "ara" kutusu yok (§3.8 kural 6, reisim 2026-09-28) */
      (t.alanlar ? "" : '<label class="a-ara"><span class="a-gizli">' + t.ad + "</span>" + ikon("search") +
        '<input type="search" data-ara="' + on + '" placeholder="' + t.ipucu + '" autocomplete="off">' +
        '<button class="a-ara-sil" type="button" data-eylem="ara-sil" aria-label="Aramayı temizle">' + ikon("x", "a-ikon-kucuk") + "</button></label>") +
      (secicili ? '<button class="a-suzgec-tus" type="button" data-eylem="levha-ac" aria-haspopup="dialog">' + ikon("sliders-horizontal") +
        'Süzgeç <span class="a-suzgec-rozet" hidden></span></button>' : "") +
      (t.cipler.length ? '<div class="a-cipler" role="group" aria-label="' + t.birim + ' durumu süzgeci"></div>' : "") +
      '<div class="a-suzgec-sag"><div class="a-seciciler"></div>' +
        '<button class="a-temizle" type="button" data-eylem="temizle">' + ikon("filter-x", "a-ikon-kucuk") + "Temizle</button></div>" +
      "</div></details>";
  };
  /* uygulanan süzgeç sayısı: arama + seçili çipler + seçiciler (sıralama ve görünüm anahtarı sayılmaz) */
  function kutuSay(on) {
    var k = kap(on), y = k && k.closest(".a-suzgec-kutu") && k.closest(".a-suzgec-kutu").querySelector(".a-suzgec-say"); if (!y) return;
    var n = (SZ[on].ara.trim() ? 1 : 0) + SZ[on].secili.length + aktifSecici(on) + alanSay(on);
    y.hidden = !n; y.textContent = n ? n + " süzgeç uygulandı" : "";
  }
  /* seçicinin başlangıç değeri `bas` (verilmezse "tumu"). `bas` taşıyan seçici GÖRÜNÜM ANAHTARIDIR (ör. Çalışanlar /
     Ayrılanlar / Hepsi, kalıp 8: "süzgeç değil görünüm anahtarı"): süzgeç sayılmaz, Temizle onu sıfırlamaz (sıralama gibi) */
  var aktifSecici = function (on) { return SZ_TANIM[on].seciciler.filter(function (x) { return !x.siralama && !x.bas && SZ[on].sec[x.k] !== "tumu"; }).length; };
  var alanSay = function (on) { var a = SZ[on].alan || {}; return Object.keys(a).filter(function (k) { return a[k].trim(); }).length; };
  var suzgecVar = MK.suzgecVar = function (on) { var s = SZ[on]; return !!s.ara.trim() || s.secili.length > 0 || aktifSecici(on) > 0 || alanSay(on) > 0; };
  MK.taban = function (on, kayitlar) {   /* çipler HARİÇ her şey; çip sayıları buradan (dürüst sayaç, anayasa 2.8) */
    var t = SZ_TANIM[on], s = SZ[on], a = MK.tr(s.ara.trim());
    return kayitlar.filter(function (k) {
      if (a && MK.tr(t.metin(k)).indexOf(a) < 0) return false;
      if ((t.alanlar || []).some(function (x) { var v = MK.tr((s.alan[x.k] || "").trim()); return v && MK.tr(x.metin(k)).indexOf(v) < 0; })) return false;
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
    var az = s.secili.length < 2, ck = k.querySelector(".a-cipler");
    if (ck) ck.innerHTML = SZ_TANIM[on].cipler.map(function (c) {
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
    var k = kap(on); if (k) { var ga = k.querySelector("[data-ara]"); if (ga) { ga.value = ""; k.querySelector(".a-ara").classList.remove("a-dolu"); } k.querySelectorAll("[data-alan-ara]").forEach(function (g) { g.value = ""; }); }
  }
  /* süzgeç satırını durumdan yeniden kurar (sayfa yeniden çizilince arama kutusu değeri, seçiciler ve liste) */
  MK.suzgecKur = function (on) {
    var k = kap(on); if (!k) return;
    var g = k.querySelector("[data-ara]"); if (g) { g.value = SZ[on].ara; k.querySelector(".a-ara").classList.toggle("a-dolu", !!SZ[on].ara); }
    k.querySelectorAll("[data-alan-ara]").forEach(function (x) { x.value = SZ[on].alan[x.dataset.alanAra.split("|")[1]] || ""; });
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
      '<p class="a-bos-baslik">' + d.baslik + "</p>" + (d.metin ? '<p class="a-bos-metin">' + d.metin + "</p>" : "") + (d.eylem || "") + "</div>";
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
  var PDF = { o: null };
  function pdfPencere() {
    var d = $("a-pdf"); if (d) return d;
    d = document.createElement("dialog"); d.className = "a-pencere a-pencere-pdf"; d.id = "a-pdf"; d.setAttribute("aria-labelledby", "a-pdf-baslik");
    d.innerHTML = '<div class="a-pencere-bas"><h2 id="a-pdf-baslik"></h2><button class="a-ikon-tus" type="button" data-eylem="pencere-kapat" aria-label="Kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-pencere-govde" id="a-pdf-govde"></div><div class="a-pencere-alt" id="a-pdf-alt"></div>';
    document.body.appendChild(d); return d;
  }
  /* örnek kaydın dosyası (makette dosyası yok): sayfa iskeleti, KÂĞIT üreticisiyle aynı A4 sayfalar */
  function ornekSayfalar(n, ad) {
    var satir = function (k, uzun) { var h = ""; for (var i = 0; i < k; i++) h += '<span class="a-pdf-satir' + (uzun && i % 3 === 2 ? " a-pdf-satir-kisa" : "") + '"></span>'; return h; };
    var h = ""; for (var i = 1; i <= n; i++) h += '<div class="rb-sayfa a-ornek-sayfa" role="img" aria-label="' + kacis(ad) + ", sayfa " + i + '"><div class="a-pdf-bas"><span class="a-pdf-logo">Logo</span><span class="a-pdf-bas-yazi">' + satir(2) + "</span></div>" + satir(30, true) + "</div>";
    return h;
  }
  /* 2026-09-28 (reisim: "ön izlemede yukarıda istemediğim şeyler var … pdf indir dediğimde inen şey ön izlemeden çok farklı"): pencerede
     yalnız başlık + kâğıt; dosya adı satırı, sayfa sayacı ve sayfa okları kalktı (kâğıt kayarak okunur). İndirilen PDF pencerede görünen
     sayfaların kendisi (MK.kagitPdf). Seçilen gerçek dosya kendisi gösterilir ve aynen iner. */
  function pdfCiz() {
    var o = PDF.o, yuklu = MK.DOSYA[o.dosya];
    $("a-pdf-baslik").textContent = o.baslik || o.dosya;
    $("a-pdf-govde").innerHTML = yuklu ? (/pdf/.test(yuklu.tur) ? '<iframe class="a-pdf-cerceve" src="' + yuklu.url + '" title="' + kacis(o.dosya) + '"></iframe>'
        : /^image\//.test(yuklu.tur) ? '<img class="a-pdf-resim" src="' + yuklu.url + '" alt="' + kacis(o.dosya) + '">'
        : '<p class="a-bos-satir">Bu dosya türü burada önizlenemez; “İndir” ile açın.</p>')
      : '<div class="a-kagit" data-ad="' + kacis(o.baslik || o.dosya) + '">' + (o.icerik ? kagitKaynak(o.icerik) : ornekSayfalar(o.sayfa || 2, o.dosya)) + "</div>";
    $("a-pdf-alt").innerHTML = MK.tus({ eylem: "pdf-indir", ad: "İndir", ikon: "download", sinif: "a-tus-ikincil" }) +
      (o.eposta ? MK.tus({ eylem: "pdf-eposta", ad: "E-postayla ilet", ikon: "mail", sinif: "a-tus-ikincil" }) : "") + MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
    kagitKur();
  }
  MK.pdfGoster = function (o) {
    PDF.o = o;
    var d = pdfPencere(); pdfCiz(); if (!d.open) d.showModal(); $("a-pdf-govde").scrollTop = 0;
    $("a-pdf-alt").querySelector(".a-tus-birincil").focus({ preventScroll: true });
  };
  MK.eylem = MK.eylem || {};
  MK.eylem["pdf-goster"] = function (el) { MK.pdfGoster({ dosya: el.dataset.dosya }); };
  /* İndir: seçilen gerçek dosya aynen iner; öteki her şey pencerede görünen kâğıdın PDF'i */
  MK.eylem["pdf-indir"] = function () {
    var o = PDF.o, d = MK.DOSYA[o.dosya], ad = /\.pdf$/i.test(o.dosya) ? o.dosya : (o.baslik || o.dosya) + ".pdf";
    if (d && d.dosya) MK.indir(o.dosya, d.dosya); else if (d && d.url) MK.indirUrl(o.dosya, d.url);
    else { var k = document.querySelector("#a-pdf-govde > .a-kagit-cerceve"); MK.bildir("PDF hazırlanıyor…"); MK.kagitPdf(k).then(function (b) { MK.indir(ad, b); MK.SON_INDIRME.sayfa = b.sayfa; MK.SON_INDIRME.onizleme = k.sayfaSayisi; }, function (e) { MK.bildir("PDF hazırlanamadı: " + (e && e.message || e)); }); }
  };

  /* E-POSTAYLA İLET (2026-09-28, T8; reisim: "son hali hem sisteme kaydolduğu gibi mail olarakta iletilecek tıklayınca mail uygulaması
     açılacak") — TEK MEKANİZMA, her PDF'e açılır: MK.pdfGoster({ …, eposta: { kime: [adres], konu, govde } }). Pencerede görünen PDF'in
     kendisi gider: dokunmatik cihazda paylaşım menüsü (dosya ekli; e-posta uygulaması seçilir); bilgisayarda PDF iner ve e-posta
     uygulaması alıcı, konu ve metinle açılır — tarayıcı e-postaya kendisi dosya ekleyemez, inen PDF eklenir (bildirim bunu söyler). */
  var mailtoAdres = function (e) { return "mailto:" + e.kime.map(encodeURIComponent).join(",") + "?subject=" + encodeURIComponent(e.konu) + "&body=" + encodeURIComponent(e.govde); };
  MK.eylem["pdf-eposta"] = function () {
    var o = PDF.o, e = o.eposta, ad = /\.pdf$/i.test(o.dosya) ? o.dosya : (o.baslik || o.dosya) + ".pdf", yuklu = MK.DOSYA[o.dosya];
    var gonder = function (b) {
      var f = new File([b], ad, { type: "application/pdf" }), mt = mailtoAdres(e);
      MK.SON_EPOSTA = { kime: e.kime.slice(), konu: e.konu, mailto: mt, dosya: ad, boyut: b.size };
      if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [f] })) {
        MK.SON_EPOSTA.yol = "paylas"; navigator.share({ files: [f], title: e.konu, text: e.govde }).catch(function () { /* kullanıcı vazgeçti */ }); return;
      }
      MK.SON_EPOSTA.yol = "mailto"; MK.indir(ad, b);
      var a = document.createElement("a"); a.href = mt; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
      MK.bildir(ad + " indirildi; e-posta uygulaması açılıyor — indirilen PDF'i ekleyin.");
    };
    if (yuklu && yuklu.dosya) { gonder(yuklu.dosya); return; }
    if (yuklu && yuklu.url) { fetch(yuklu.url).then(function (r) { return r.blob(); }).then(gonder); return; }
    var k = document.querySelector("#a-pdf-govde > .a-kagit-cerceve"); MK.bildir("PDF hazırlanıyor…");
    MK.kagitPdf(k).then(gonder, function (h) { MK.bildir("PDF hazırlanamadı: " + (h && h.message || h)); });
  };

  /* ── KÂĞIT: belge → A4 sayfalar → PDF (2026-09-28, TEK MEKANİZMA; reisim: "özel değil genel düşün … geçici çözümler üretme").
     Rapor, sözleşme, teklif, fatura özeti, zimmet formu, saha formu, örnek dosya — hepsi aynı yoldan: kaynak HTML sayfanın kendi
     stilleriyle, AÇIK temada, ayrı bir çerçevede (iframe) A4 sayfalara (794 × 1123 px) dizilir; sayfaya sığmayan içerik bir sonraki sayfaya
     geçer (tablo satır satır bölünür, başlığı yeni sayfada tekrarlanır; resmî belgenin başlık tablosu her sayfada). İndir aynı çerçevedeki
     sayfaları görüntüye çevirip PDF'e yazar → önizleme ile inen dosya birebir aynıdır. Çerçeve kabının genişliğine sığar (küçülür, kaydırma
     yok). Kaynak ekranda gizli durur (metin aranabilir); görünen yalnız kâğıt. Yazdırma penceresi yolu (MK.yazdir'in eski hâli) kalktı:
     telefonda gizli çerçeve yerine bütün sayfayı basıyordu. Dış kütüphane yok; html2canvas sitenin kendi kökeninden (vendor, sürümlü). */
  var KAGIT_G = 794, KAGIT_Y = 1123, KAGIT_KENAR = 16;
  var kokYol = (function () { var sc = document.currentScript; return sc ? sc.src.replace(/assets\/maket-ortak\.js.*$/, "") : "../"; })();
  function kagitBelge(f, html, ad) {
    var stil = [].map.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return '<link rel="stylesheet" href="' + l.href + '">'; }).join("");
    var d = f.contentDocument; d.open();
    d.write('<!doctype html><html lang="tr" data-tema="acik"><head><meta charset="utf-8"><title>' + kacis(ad) + "</title>" + stil +
      "<style>html,body{margin:0;padding:0;overflow:hidden;background:var(--zemin)}#a-sayfalar{width:" + (KAGIT_G + 2 * KAGIT_KENAR) + "px;padding:" + KAGIT_KENAR + "px " + KAGIT_KENAR + "px 0;box-sizing:border-box;transform-origin:0 0}" +
      "#a-sayfalar .rb-sayfa{height:" + KAGIT_Y + "px;min-height:0;overflow:hidden;margin:0 0 " + KAGIT_KENAR + "px}.a-serbest{font:inherit}</style></head>" +
      '<body class="a-yazdir-govde"><div id="a-kaynak" hidden>' + html + '</div><div id="a-sayfalar"></div></body></html>');
    d.close();
  }
  /* sayfalama: kaynaktaki her .rb-sayfa bir sayfa dizisi başlatır (ilk çocuğu .rb-bas ise her sayfada tekrar); rb-sayfa yoksa bütün içerik
     tek dizi (.a-serbest). Taşan düğüm bölünebiliyorsa (blok kap, tablo) çocukları tek tek yerleşir; bölünemiyorsa yeni sayfaya geçer. */
  function sayfala(d) {
    var kaynak = d.getElementById("a-kaynak"), hedef = d.getElementById("a-sayfalar"), w = d.defaultView;
    var diziler = [].slice.call(kaynak.querySelectorAll(".rb-sayfa"));
    if (!diziler.length) { var s0 = d.createElement("div"); s0.className = "rb-sayfa a-serbest"; while (kaynak.firstChild) s0.appendChild(kaynak.firstChild); kaynak.appendChild(s0); diziler = [s0]; }
    var BOLUNMEZ = /^(TR|P|H[1-6]|LI|IMG|SVG|THEAD|BUTTON|LABEL|SPAN|B|I|S|A|DT|DD|CAPTION|COLGROUP|INPUT|TEXTAREA|SELECT)$/;
    var bolunur = function (n) { if (n.nodeType !== 1 || BOLUNMEZ.test(n.tagName) || n.children.length < 2) return false; var g = w.getComputedStyle(n).display; return !/flex|grid|inline|table-row$/.test(g); };
    var basKopya = function (a, c) { if (a.tagName === "TABLE") [].forEach.call(a.children, function (x) { if (/^(COLGROUP|THEAD|CAPTION)$/.test(x.tagName)) c.appendChild(x.cloneNode(true)); }); };
    diziler.forEach(function (src) {
      var bas = src.firstElementChild && src.firstElementChild.classList.contains("rb-bas") ? src.firstElementChild : null, sayfa;
      var yeni = function () { sayfa = d.createElement("div"); sayfa.className = src.className; sayfa.dolu = 0; hedef.appendChild(sayfa); if (bas) sayfa.appendChild(bas.cloneNode(true)); return sayfa; };
      var tasti = function () { return sayfa.scrollHeight > sayfa.clientHeight + 1; };
      var devam = function (parent) {   /* yeni sayfada aynı kap zinciri (boş kopyalar) */
        var l = []; for (var e = parent; e !== sayfa; e = e.parentNode) l.unshift(e);
        var p = yeni(); l.forEach(function (e) { var c = e.cloneNode(false); basKopya(e, c); p.appendChild(c); p = c; }); return p;
      };
      var ekle = function (n, parent) {
        var bos = n.nodeType === 3 && !n.textContent.trim();
        parent.appendChild(n); if (bos || !tasti()) { if (!bos) sayfa.dolu++; return parent; }
        var boy = n.nodeType === 1 ? n.offsetHeight : 0; parent.removeChild(n);
        /* sayfanın üçte birinden kısa blok bölünmez, bütün olarak sonraki sayfaya geçer (bölüm başlığı gövdesinden ayrılmaz) */
        if (bolunur(n) && !(sayfa.dolu && boy <= KAGIT_Y / 3)) {
          var kab = n.cloneNode(false); basKopya(n, kab); parent.appendChild(kab);
          if (tasti() && sayfa.dolu) { parent.removeChild(kab); parent = devam(parent); kab = n.cloneNode(false); basKopya(n, kab); parent.appendChild(kab); }
          var p = kab; [].slice.call(n.childNodes).forEach(function (c) { if (!(n.tagName === "TABLE" && /^(COLGROUP|THEAD|CAPTION)$/.test(c.tagName))) p = ekle(c, p); });
          return p.parentNode;
        }
        if (!sayfa.dolu) { parent.appendChild(n); sayfa.dolu++; return parent; }   /* boş sayfaya da sığmıyor: kesilir, sonsuz döngü yok */
        var np = devam(parent); np.appendChild(n); sayfa.dolu++; return np;
      };
      var p = yeni(); [].slice.call(src.childNodes).forEach(function (c) { if (c !== bas) p = ekle(c, p); });
    });
    kaynak.remove();
    return hedef.children.length;
  }
  /* kâğıdı kabına sığdır: sayfalar ölçeklenir, çerçeve yüksekliği ölçekli içerik kadar */
  function kagitSigdir(f) {
    var d = f.contentDocument, h = d && d.getElementById("a-sayfalar"); if (!h || !f.clientWidth) return;
    var tam = KAGIT_G + 2 * KAGIT_KENAR, k = Math.min(1, f.clientWidth / tam);
    h.style.transform = k < 1 ? "scale(" + k + ")" : ""; h.style.marginLeft = k < 1 ? "0" : Math.max(0, (f.clientWidth - tam) / 2) + "px";
    f.style.height = Math.ceil(h.offsetHeight * k) + "px";
  }
  var kagitIzle = window.ResizeObserver ? new ResizeObserver(function (l) { l.forEach(function (x) { kagitSigdir(x.target); }); }) : null;
  /* içerik ekrandan kopyalandıysa (ör. açık belgeyi PDF'e gönderen tuşlar) içindeki kâğıt çerçeveleri atılır, gizli kaynaklar açılır */
  function kagitKaynak(html) {
    var t = document.createElement("div"); t.innerHTML = html;
    [].forEach.call(t.querySelectorAll(".a-kagit-cerceve"), function (f) { f.remove(); });
    [].forEach.call(t.querySelectorAll("[data-kagit]"), function (k) { k.removeAttribute("data-kagit"); k.hidden = false; });
    return t.innerHTML;
  }
  function kagitAc(kap) {
    var html = kagitKaynak(kap.innerHTML), ad = kap.getAttribute("data-ad") || document.title;
    kap.setAttribute("data-kagit", ""); kap.hidden = true;
    var f = document.createElement("iframe"); f.className = "a-kagit-cerceve"; f.title = ad; f.setAttribute("scrolling", "no");
    kap.parentNode.insertBefore(f, kap.nextSibling); kagitBelge(f, html, ad);
    var d = f.contentDocument, links = [].slice.call(d.querySelectorAll('link[rel="stylesheet"]'));
    f.hazir = Promise.all(links.map(function (l) { return l.sheet ? 1 : new Promise(function (ok) { l.onload = l.onerror = ok; }); }))
      /* kaynak gizliyken yazı tipleri kendiliğinden inmez: sayfalamadan önce açıkça yüklenir (yoksa yedek yazı tipiyle ölçülür, sonra kayar) */
      .then(function () { return d.fonts ? Promise.all(["12px Carlito", "bold 12px Carlito", "italic 12px Carlito", "14px Sora", "bold 14px Sora"].map(function (y) { return d.fonts.load(y, "Aağİış"); })).then(function () { return d.fonts.ready; }) : 1; })
      .then(function () { f.sayfaSayisi = sayfala(d); kagitSigdir(f); if (kagitIzle) kagitIzle.observe(f); return f; });
    return f;
  }
  /* kâğıt nerede olursa olsun kendiliğinden kurulur: .a-kagit (pencere içeriği) ya da çıplak belge (.rb-belge resmî format, .a-belge temel
     format; Raporlar, Onaylar, müşteri portalı, sözleşme, zimmet formu, şablon önizlemesi) — kaynağın içindeki belge ikinci kez kurulmaz */
  function kagitKur() {
    [].forEach.call(document.querySelectorAll(".a-kagit:not([data-kagit]), .rb-belge:not([data-kagit]), .a-belge:not([data-kagit])"), function (k) {
      if (k.parentNode && k.parentNode.closest && k.parentNode.closest(".a-kagit, [data-kagit]")) return;
      kagitAc(k);
    });
  }
  if (window.MutationObserver) new MutationObserver(kagitKur).observe(document.documentElement, { childList: true, subtree: true });
  var kutuphane = {};
  function yukle(yol, ad) {
    if (window[ad]) return Promise.resolve(window[ad]);
    return kutuphane[yol] || (kutuphane[yol] = new Promise(function (ok, red) { var sc = document.createElement("script"); sc.src = kokYol + yol; sc.onload = function () { ok(window[ad]); }; sc.onerror = function () { red(new Error(yol + " yüklenemedi")); }; document.head.appendChild(sc); }));
  }
  /* görüntülerden PDF (her sayfa bir JPEG, A4 595,28 × 841,89 pt) */
  function pdfYaz(sayfalar) {
    var te = new TextEncoder(), parca = [], uz = 0, ofs = [];
    var yaz = function (x) { var b = typeof x === "string" ? te.encode(x) : x; parca.push(b); uz += b.length; };
    var nesne = function (no, govde, akis) { ofs[no] = uz; yaz(no + " 0 obj\n" + govde); if (akis) { yaz("\nstream\n"); yaz(akis); yaz("\nendstream"); } yaz("\nendobj\n"); };
    var n = sayfalar.length, kids = []; for (var i = 0; i < n; i++) kids.push((3 + i * 3) + " 0 R");
    yaz("%PDF-1.4\n");
    nesne(1, "<< /Type /Catalog /Pages 2 0 R >>"); nesne(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
    sayfalar.forEach(function (s, i) {
      var sy = 3 + i * 3, im = sy + 1, ic = sy + 2, cz = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
      nesne(sy, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 " + im + " 0 R >> >> /Contents " + ic + " 0 R >>");
      nesne(im, "<< /Type /XObject /Subtype /Image /Width " + s.w + " /Height " + s.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + s.jpeg.length + " >>", s.jpeg);
      nesne(ic, "<< /Length " + cz.length + " >>", cz);
    });
    var x = uz, top = 3 + n * 3; yaz("xref\n0 " + top + "\n0000000000 65535 f \n");
    for (var j = 1; j < top; j++) yaz(("000000000" + ofs[j]).slice(-10) + " 00000 n \n");
    yaz("trailer\n<< /Size " + top + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF");
    var blob = new Blob(parca, { type: "application/pdf" }); blob.sayfa = n; return blob;
  }
  /* kâğıt çerçevesi → PDF Blob; sayfalar ölçeksiz (1:1) çizilir, çözünürlük 2× (ölçümde 1×) */
  MK.kagitPdf = function (f) {
    if (!f) return Promise.reject(new Error("belge yok"));
    return Promise.all([f.hazir, yukle("vendor/html2canvas-1.4.1/html2canvas.min.js", "html2canvas")]).then(function (v) {
      var h2c = v[1], sayfalar = [].slice.call(f.contentDocument.querySelectorAll("#a-sayfalar > .rb-sayfa")), olcek = window.MAKET_ORNEK ? 1 : 2, sonuc = [];
      return sayfalar.reduce(function (zincir, s) {
        return zincir.then(function () {
          return h2c(s, { scale: olcek, backgroundColor: "#ffffff", logging: false, windowWidth: KAGIT_G + 2 * KAGIT_KENAR,
            onclone: function (kd) { var hh = kd.getElementById("a-sayfalar"); hh.style.transform = ""; hh.style.marginLeft = "0"; } })
            .then(function (c) { return new Promise(function (ok) { c.toBlob(function (b) { b.arrayBuffer().then(function (a) { sonuc.push({ w: c.width, h: c.height, jpeg: new Uint8Array(a) }); ok(); }); }, "image/jpeg", 0.92); }); });
        });
      }, Promise.resolve()).then(function () { return pdfYaz(sonuc); });
    });
  };

  /* ── DOSYA: seç · indir · yazdır · Excel (reisim 2026-09-27: "maket site nasıl çalışması gerekiyorsa çalışsın maket olduğu için çalışmayan
     yerler de dahil"). Seçilen dosya TARAYICIDA kalır (sunucuya gitmez, sayfa yenilenince gider); adıyla MK.DOSYA'da tutulur, "Aç" onu gösterir.
     Otomatik ölçüm (MAKET_ORNEK) dosya penceresini açamaz: örnek ad kullanılır. Dış kütüphane yok (anayasa: dış CDN yok). */
  MK.DOSYA = {};
  /* 2026-09-28 (reisim: "imzalı zimmet diye dosya ekledim … tıklayınca yüklediğim tarama değil … iskelet pdf çıkıyor … yüklediğim taramayı
     silemiyorum … yüklenilen şeyler düzenlenebilir silinebilir olmalı"): yüklenen dosya sayfalar arası KALICI (tarayıcının IndexedDB'si;
     "Denemeleri sıfırla" onu da siler) — kayıtta adı, depoda kendisi. Aynı adla ikinci dosya gelirse ad ayrışır ("… (2).pdf"). */
  var DDB = null, DDB_AD = "probata-maket-dosya";
  var ddbIs = function (kip, f) { try { if (DDB) f(DDB.transaction("d", kip).objectStore("d")); } catch (e) { /* depolama kapalı: bu oturumda çalışır */ } };
  try {
    var ddbIstek = indexedDB.open(DDB_AD, 1);
    ddbIstek.onupgradeneeded = function () { ddbIstek.result.createObjectStore("d"); };
    ddbIstek.onsuccess = function () {
      DDB = ddbIstek.result; var geldi = 0;
      ddbIs("readonly", function (st) {
        var c = st.openCursor();
        c.onsuccess = function () {
          var k = c.result;
          if (k) { if (!MK.DOSYA[k.key]) { MK.DOSYA[k.key] = { url: URL.createObjectURL(k.value.blob), tur: k.value.tur, boyut: k.value.boyut, dosya: k.value.blob }; geldi++; } k.continue(); }
          else if (geldi && MK.goster) MK.goster(false);   /* dosyalar yüklendi: onları gösteren yerler yeniden çizilir */
        };
      });
    };
  } catch (e) { /* IndexedDB yok: dosya yalnız bu sayfada kalır */ }
  var benzersiz = function (ad) { if (!MK.DOSYA[ad]) return ad; var m = /^(.*?)(\.[^.]*)?$/.exec(ad), i = 2; while (MK.DOSYA[m[1] + " (" + i + ")" + (m[2] || "")]) i++; return m[1] + " (" + i + ")" + (m[2] || ""); };
  MK.dosyaSil = function (ad) { var d = MK.DOSYA[ad]; if (!d) return; if (d.url) URL.revokeObjectURL(d.url); delete MK.DOSYA[ad]; ddbIs("readwrite", function (st) { st.delete(ad); }); };
  /* yüklenen dosya alanı — TEK ÜRETİCİ: ad · Aç (dosyanın kendisi) · Değiştir · Sil. o = { ad, degistir: eylem, sil: eylem, veri, oku (yalnız Aç) } */
  MK.dosyaAlan = function (o) {
    if (!o.ad) return "";
    return '<span class="a-dosya-kayit"><span class="a-dosya-ad">' + ikon("file-text", "a-ikon-kucuk") + kacis(o.ad) + "</span>" + MK.pdfTus(o.ad) +
      (o.oku ? "" : MK.tus({ eylem: o.degistir, ad: "Değiştir", ikon: "upload", sinif: "a-tus-ikincil", veri: o.veri }) +
        '<button class="a-ikon-tus" type="button" data-eylem="' + o.sil + '"' + Object.keys(o.veri || {}).map(function (k) { return " data-" + k + '="' + kacis(o.veri[k]) + '"'; }).join("") +
        ' aria-label="' + kacis(o.ad) + ' sil" title="Sil">' + ikon("x") + "</button>") + "</span>";
  };
  /* silme onayı — TEK ÜRETİCİ: MK.onayla({ baslik, metin, tus: "Sil", tamam: fn }). Başka pencerenin üstünde de açılır. */
  var ONAY = null;
  MK.onayla = function (o) {
    var d = $("a-onay-pencere");
    if (!d) {
      d = document.createElement("dialog"); d.className = "a-pencere"; d.id = "a-onay-pencere"; d.setAttribute("aria-labelledby", "a-onay-baslik");
      d.innerHTML = '<div class="a-pencere-bas"><h2 id="a-onay-baslik"></h2><button class="a-ikon-tus" type="button" data-eylem="pencere-kapat" aria-label="Kapat">' + ikon("x") + "</button></div>" +
        '<div class="a-pencere-govde" id="a-onay-govde"></div><div class="a-pencere-alt" id="a-onay-alt"></div>';
      document.body.appendChild(d);
    }
    ONAY = o; $("a-onay-baslik").textContent = o.baslik; $("a-onay-govde").innerHTML = '<p class="a-pencere-metin">' + o.metin + "</p>";
    $("a-onay-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "onay-tamam", ad: o.tus || "Sil" });
    d.showModal(); $("a-onay-alt").querySelector('[data-eylem="pencere-kapat"]').focus();
  };
  MK.eylem = MK.eylem || {};
  MK.eylem["onay-tamam"] = function () { var o = ONAY; ONAY = null; $("a-onay-pencere").close(); if (o && o.tamam) o.tamam(); };
  /* yüklenen dosyanın kendisi sayfanın içinde (PDF çerçeve, resim); dosya yoksa (örnek kayıt) yedek içerik */
  MK.dosyaOnizle = function (ad, yedek) {
    var d = MK.DOSYA[ad]; if (!d) return yedek || "";
    return /pdf/.test(d.tur) ? '<iframe class="a-pdf-cerceve" src="' + d.url + '" title="' + kacis(ad) + '"></iframe>'
      : /^image\//.test(d.tur) ? '<img class="a-pdf-resim" src="' + d.url + '" alt="' + kacis(ad) + '">' : '<p class="a-bos-satir">' + kacis(ad) + "</p>";
  };
  MK.dosyaSec = function (o, cb) {   /* o = { kabul, ornek, kamera, coklu, enCokMB } · cb(ad, File|null) her dosya için */
    if (window.MAKET_ORNEK) { cb(o.ornek, null); return; }
    [].forEach.call(document.querySelectorAll("input[data-mk-dosya]"), function (e) { e.remove(); });
    var g = document.createElement("input"); g.type = "file"; g.hidden = true; g.setAttribute("data-mk-dosya", "");
    if (o.kabul) g.accept = o.kabul; if (o.kamera) g.setAttribute("capture", "environment"); if (o.coklu) g.multiple = true;
    g.addEventListener("change", function () {
      [].slice.call(g.files || []).forEach(function (f) {
        if (o.enCokMB && f.size > o.enCokMB * 1048576) { MK.bildir(f.name + " " + o.enCokMB + " MB'tan büyük; eklenmedi."); return; }
        var ad = benzersiz(f.name);
        MK.DOSYA[ad] = { url: URL.createObjectURL(f), tur: f.type, boyut: f.size, dosya: f };
        ddbIs("readwrite", function (st) { st.put({ tur: f.type, boyut: f.size, blob: f }, ad); });
        cb(ad, f);
      });
      g.remove();
    });
    document.body.appendChild(g); g.click();
  };
  /* 2026-09-27: seçilen gerçek fotoğraf küçük resim olarak görünür, basınca görüntüleyicide açılır; örnek kayıtta simge */
  /* sil = { eylem, veri } verilirse her fotoğrafın köşesinde "Sil" (2026-09-28: "yüklenilen şeyler düzenlenebilir silinebilir olmalı");
     eyleme data-i = fotoğrafın sırası (0'dan) gider */
  MK.fotolar = function (n, adlar, etiket, sil) {
    var s = ""; for (var i = 1; i <= n; i++) {
      var ad = adlar && adlar[i - 1], d = ad && MK.DOSYA[ad], ne = (etiket ? etiket + " fotoğraf " : "Fotoğraf ") + i;
      var f = d ? '<button class="a-foto a-foto-resim" type="button" data-eylem="pdf-goster" data-dosya="' + kacis(ad) + '" aria-label="' + kacis(ne) + '"><img src="' + d.url + '" alt=""><span class="a-foto-no">' + i + "</span></button>"
        : '<span class="a-foto" role="img" aria-label="' + kacis(ne) + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>";
      s += sil ? '<span class="a-foto-kap">' + f + '<button class="a-ikon-tus a-foto-sil" type="button" data-eylem="' + sil.eylem + '" data-i="' + (i - 1) + '"' +
        Object.keys(sil.veri || {}).map(function (k) { return " data-" + k + '="' + kacis(sil.veri[k]) + '"'; }).join("") + ' aria-label="' + kacis(ne) + ' sil" title="Sil">' + ikon("x") + "</button></span>" : f;
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
  /* belge PDF'i: önizleme penceresinde açılır, "İndir" gördüğün sayfaların PDF'ini indirir (KÂĞIT). Ad eski çağıranlar için korunur. */
  MK.yazdir = function (baslik, html) { MK.pdfGoster({ dosya: baslik + ".pdf", baslik: baslik, icerik: html }); };
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

  /* ── KALICI MAKET (2026-09-28, Kalem M; reisim: "tüm site maket üzerinde aktif çalışabilsin her fonksiyonu test edicem") ─────────
     TEK MEKANİZMA: maketteki her değişiklik bu tarayıcıda saklanır, sayfa değişince ve yeniden açılınca sürer. İki kaynak:
     (1) ortak veri MV — her sayfa açılışında tohum kurulduktan sonra kayıtlı fark YERİNDE geri yüklenir (dizide kayıt kimliği id · no · kod · k
         ile eşlenir, nesne kimliği korunur; silinen kayıt silinir, sıra korunur); yazarken yalnız tohumdan farklı koleksiyonlar tutulur.
     (2) modülün kendi durumu — MK.kalici(ad, al, ver): Planlar ve saha raporu gibi yerel kayıt tutan modüller kaydolur.
     Kayıt anı: her tıklama, yazma, seçim, adres değişimi ve bildirimden hemen sonra; sayfadan çıkarken. Yalnız bu tarayıcıda (sunucu yok);
     "Sıfırla" (yan menünün altı) tohum veriye döner. Tohum verinin yapısı değişince VERI_SURUM artırılır → eski kayıt kullanılmaz.
     ⛔ Yalnız makette: gerçek uygulamada kayıt sunucuda (pkproje.md §8), bu mekanizma koda taşınmaz. */
  var DEPO_AD = "probata-maket", VERI_SURUM = "2026-09-28-4";
  var depo = (function () { try { var d = JSON.parse(localStorage.getItem(DEPO_AD) || "null"); return d && d.surum === VERI_SURUM ? d : null; } catch (e) { return null; } })() ||
    { surum: VERI_SURUM, mv: {}, modul: {} };
  var MVK = null, TABAN = {}, MODUL = {}, sifirlandi = false, yazZaman = null;
  var nesneMi = function (x) { return x && typeof x === "object" && !Array.isArray(x); };
  function anahtar(l) {
    var ad = ["id", "no", "kod", "k"];
    for (var i = 0; i < ad.length; i++) {
      var g = {}, ok = l.length > 0 && l.every(function (x) { if (!nesneMi(x) || x[ad[i]] === undefined || x[ad[i]] === null || g[x[ad[i]]]) return false; g[x[ad[i]]] = 1; return true; });
      if (ok) return ad[i];
    }
    return null;
  }
  function birlestir(kap, ad, yeni) {   /* kap[ad] := yeni, kimlik korunarak */
    var eski = kap[ad];
    if (Array.isArray(eski) && Array.isArray(yeni)) {
      var an = anahtar(eski.length ? eski : yeni), h = {};
      if (an) eski.forEach(function (x) { h[x[an]] = x; });
      var son = yeni.map(function (y, i) {
        var e = an ? (nesneMi(y) ? h[y[an]] : null) : eski[i];
        if (nesneMi(e) && nesneMi(y)) { nesneBirlestir(e, y); return e; }
        return y;
      });
      eski.length = 0; son.forEach(function (x) { eski.push(x); }); return;
    }
    if (nesneMi(eski) && nesneMi(yeni)) { nesneBirlestir(eski, yeni); return; }
    kap[ad] = yeni;
  }
  function nesneBirlestir(e, y) {
    Object.keys(e).forEach(function (k) { if (!(k in y) && typeof e[k] !== "function") delete e[k]; });
    Object.keys(y).forEach(function (k) { birlestir(e, k, y[k]); });
  }
  /* maket-veri.js sonunda çağrılır: tohumun izi alınır, kayıtlı fark yüklenir */
  MK.kaliciMV = function (mv) {
    MVK = mv;
    Object.keys(mv).forEach(function (k) { var v = mv[k]; if (v && typeof v === "object") { try { TABAN[k] = JSON.stringify(v); } catch (e) { /* döngülü: saklanmaz */ } } });
    Object.keys(depo.mv).forEach(function (k) { if (k in TABAN) { try { birlestir(mv, k, depo.mv[k]); } catch (e) { delete depo.mv[k]; } } });
  };
  MK.kalici = function (ad, al, ver) {
    MODUL[ad] = al;
    if (depo.modul[ad] !== undefined) { try { ver(depo.modul[ad]); } catch (e) { delete depo.modul[ad]; } }
  };
  function kaliciYaz() {
    if (sifirlandi) return;
    clearTimeout(yazZaman); yazZaman = null;
    if (MVK) Object.keys(TABAN).forEach(function (k) { try { var j = JSON.stringify(MVK[k]); if (j !== TABAN[k]) depo.mv[k] = JSON.parse(j); else delete depo.mv[k]; } catch (e) { /* atla */ } });
    Object.keys(MODUL).forEach(function (ad) { try { depo.modul[ad] = MODUL[ad](); } catch (e) { /* atla */ } });
    try { localStorage.setItem(DEPO_AD, JSON.stringify(depo)); } catch (e) { /* depolama kapalı ya da dolu: maket bu oturumda çalışır, kalıcı değil */ }
    if (MK.takipCiz) MK.takipCiz();   /* veri değişti: yan menü balonları */
  }
  MK.kaliciYaz = function () { if (!sifirlandi) { clearTimeout(yazZaman); yazZaman = setTimeout(kaliciYaz, 150); } };
  MK.kaliciVar = function () { return Object.keys(depo.mv).length + Object.keys(depo.modul).length > 0; };
  ["click", "input", "change", "keyup"].forEach(function (o) { document.addEventListener(o, MK.kaliciYaz, true); });
  window.addEventListener("hashchange", MK.kaliciYaz);
  window.addEventListener("pagehide", function () { if (yazZaman) kaliciYaz(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && yazZaman) kaliciYaz(); });
  MK.eylem = MK.eylem || {};
  /* sıfırla: iki adım (ilk basış onay ister), sonra tohum veriyle yeniden açılır */
  MK.eylem["maket-sifirla"] = function (el) {
    if (!el.dataset.onay) { el.dataset.onay = "1"; el.textContent = "Onayla: bütün denemeler silinir"; return; }
    sifirlandi = true; clearTimeout(yazZaman);
    try { localStorage.removeItem(DEPO_AD); } catch (e) { /* yok */ }
    try { if (DDB) DDB.close(); indexedDB.deleteDatabase(DDB_AD); } catch (e) { /* yok */ }
    location.reload();
  };

  /* ── BİLDİRİM · ÇEKMECE · DARALTMA · TEMA ───────────────────────────────────────────────────────── */
  var bildirimZaman;
  MK.bildir = function (m) {
    $("a-bildirim-metin").textContent = m; $("a-bildirim").classList.add("a-gorunur"); MK.kaliciYaz();   /* her sonuç bildirimi bir değişikliktir */
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
    if (t.dataset && t.dataset.alanAra) {   /* alan alan arama: aynı biçimde yerinde */
      var a = t.dataset.alanAra.split("|"); SZ[a[0]].alan[a[1]] = t.value; SZ[a[0]].sayfa = 1; yenile(a[0]); return;
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
