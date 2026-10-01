/* ══ probata MAKET M7 — Standart Kütüphanesi (modül 4) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═════════════════════════
   Kaynak: pkproje.md §3 (reisim 2026-09-22: "her firma kendi standardını kendisi yükler"; "ilgili dökümanı yüklerken hangi
   standarda göre yaptığını kendi seçecek"), §4.2 (Ek-III 1.7.1.1 metot: standart no/adı), §1.1 (reisim: "muayene personellerinin
   standartlara ulaşabilmesini istiyorum"). Ekranlar: liste (#/, ?tur=) · standart sayfası (#/s/<id>) · yükle / yeni sürüm penceresi.
   Standart telifli belgedir: firmanın kopyası, yalnız firma içinde okunur; kalıcı herkese açık bağlantı yok (anayasa 5.1).
   Kullanıcı: Selin Yıldız (mekanik yönetici — yükler ve değiştirir; herkes okur, rol × modül önerisi M1). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var S = MV.STANDARTLAR;
  var bul = function (k) { return S.filter(function (s) { return s.k === k; })[0]; };
  var ad = function (s) { return s.no + ":" + s.surum; };
  /* güncel sürümün türleri; önceki sürüm türlere bağlı değildir (türler yeni sürüme geçti) */
  var turleri = function (s) { return s.yerine ? [] : MV.standartTurleri(s.k); };
  var onceki = function (s) { return S.filter(function (x) { return x.yerine === s.k; }); };
  /* bu sürümle yazılmış imzalı raporlar: sürüm yüklendiği andan yerine yenisi gelene kadar (rapor kullandığı sürümü saklar) */
  function raporSayisi(s) {
    var guncel = s.yerine ? bul(s.yerine) : s, bas = s.yerine ? "" : (onceki(s)[0] || {}).bitti || "", son = s.bitti || "9999";
    return MV.EKIPMAN.filter(function (e) { return e.onceki && MV.tur(e.tur).std.indexOf(guncel.k) >= 0 && e.onceki.tarih >= bas && e.onceki.tarih < son; }).length;
  }
  var brans = function (s) { var t = turleri(s.yerine ? bul(s.yerine) : s); return t.some(function (x) { return x.b === "e"; }) ? "e" : t.length ? "m" : ""; };
  var DURUM = { guncel: { ad: "Güncel", rozet: "a-rozet-tamam" }, onceki: { ad: "Önceki sürüm", rozet: "a-rozet-notr" }, bos: { ad: "Türe atanmamış", rozet: "a-rozet-bekliyor" } };
  var durum = function (s) { return s.yerine ? DURUM.onceki : turleri(s).length ? DURUM.guncel : DURUM.bos; };
  var boyut = function (kb) { return kb >= 1024 ? (kb / 1024).toFixed(1).replace(".", ",") + " MB" : kb + " KB"; };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("s", { ad: "Standartlarda ara", ipucu: "No, konu, tür", birim: "standart",
    cipler: [
      { k: "bos", ad: "Türe atanmamış", test: function (s) { return !s.yerine && !turleri(s).length; } },
      { k: "m", ad: "Mekanik", grup: "brans", test: function (s) { return brans(s) === "m"; } },
      { k: "e", ad: "Elektrik", grup: "brans", test: function (s) { return brans(s) === "e"; } }
    ],
    seciciler: [
      { k: "tur", ad: "Tür", secenek: function () {
        return [["tumu", "Tümü"]].concat(MV.KATALOG.filter(function (t) { return t.std.length; }).map(function (t) { return [t.k, t.ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (s, v) { return v === "tumu" || MV.tur(v).std.indexOf(s.yerine || s.k) >= 0; } },
      { k: "gorunum", ad: "Görünüm", bas: "guncel", secenek: function () { return [["guncel", "Güncel sürümler"], ["onceki", "Önceki sürümler"], ["hepsi", "Hepsi"]]; },
        gecer: function (s, v) { return v === "hepsi" || (v === "guncel" ? !s.yerine : !!s.yerine); } }
    ],
    metin: function (s) { return [s.no, s.konu, s.surum].concat(turleri(s).map(function (t) { return t.ad; })).join(" "); },
    imkansiz: "Bir standart aynı anda iki branşa ait olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "std", baslik: "Standart", kart: "ust", sira: 1, hucre: function (s) { return '<a class="a-no" href="#/s/' + s.k + '">' + kacis(s.no) + "</a>" + kirp(s.konu, "a-alt-satir"); } },
    { k: "surum", baslik: "Sürüm", kart: "govde", sira: 2, hucre: function (s) { return '<span class="a-kart-etiket">Sürüm</span><span class="a-kod">' + kacis(s.surum) + "</span>"; } },
    { k: "tur", baslik: "Kullanan türler", kart: "govde", sira: 3, hucre: function (s) {
      var t = turleri(s);
      return '<span class="a-kart-etiket">Kullanan türler</span>' + (t.length ? "<span>" + t.length + " tür" + kirp(t.map(function (x) { return x.ad; }).join(", "), "a-alt-satir") + "</span>"
        : '<span class="a-deger-yok">' + (s.yerine ? "Yeni sürüme geçti" : "Yok") + "</span>");
    } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 4, hucre: function (s) { return '<span class="a-kart-etiket">Bu sürümle rapor</span><span class="a-sayi">' + raporSayisi(s) + "</span>"; } },
    { k: "yuklendi", baslik: "Yüklendi", kart: "govde", sira: 5, hucre: function (s) { return '<span class="a-kart-etiket">Yüklendi</span><span>' + MK.tarihYaz(s.tarih) + kirp(MV.kisi(s.yukleyen).ad, "a-alt-satir") + "</span>"; } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (s) { return rozet(durum(s)) + (s.yerine ? '<span class="a-alt-satir">' + MK.tarihEk(s.bitti, "e") + " kadar</span>" : ""); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "s", kayitlar: S, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.no.localeCompare(b.no, "tr", { numeric: true }) || b.surum.localeCompare(a.surum); }); },
      bosVeri: { ikon: "book-open", baslik: "Kütüphane boş", metin: "“Standart yükle” ile firmanın standart kopyası (PDF) eklenir; ekipman türlerinde kontrol metodu buradan seçilir." },
      tablo: { baslik: "Standartlar", sinif: "a-tablo-standart", sutunlar: SUTUN, href: function (s) { return "#/s/" + s.k; } } });
  }

  /* ── STANDART SAYFASI ────────────────────────────────────────────────────────────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function standartCiz(s) {
    if (!s) {
      $("a-nesne").innerHTML = MK.kirinti([["Standartlar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Standart bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Standart bulunamadı", metin: "Bu adreste kayıtlı standart yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Standartlara dön</a>" });
      return;
    }
    var t = turleri(s), yeni = s.yerine ? bul(s.yerine) : null, surumler = (yeni ? [yeni].concat(onceki(yeni)) : [s].concat(onceki(s)));
    $("a-nesne").innerHTML = MK.kirinti([["Standartlar", "#/"], [ad(s)]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(ad(s)) + "</h1>" + rozet(durum(s)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("book-open", "a-ikon-kucuk") + "<span>" + kacis(s.konu) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "oku", ad: "Oku", ikon: "eye", sinif: "a-tus-ikincil" }) +
          (s.yerine ? "" : MK.tus({ eylem: "surum-ac", ad: "Yeni sürüm yükle", ikon: "refresh-cw" })) +
          '<button class="a-ikon-tus" type="button" data-eylem="std-sil" aria-label="' + kacis(ad(s)) + ' sil" title="Sil">' + ikon("x") + "</button></div></div>" +
      (yeni ? '<div class="a-serit-kap">' + MK.serit("bilgi", "history", "Önceki sürüm: " + MK.tarihYaz(s.bitti) + " tarihinde yerine <a class=\"a-baglanti\" href=\"#/s/" + yeni.k + "\">" + kacis(ad(yeni)) + "</a> geçti. O tarihe kadar yazılan raporlar bu sürümü gösterir; dosya saklanır, silinmez.") + "</div>"
        : !t.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Hiçbir ekipman türüne atanmadı: raporda kontrol metodu olarak seçilemez. Atama tür sayfasından yapılır (Ekipman türleri).") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "layers", ad: "Kullanan tür", sayi: t.length, href: t.length === 1 ? MK.adres(5, "#/tur/" + t[0].k) : null, not: s.yerine ? "yeni sürüme geçti" : t.length ? "kontrol metodu" : "atanmadı", uyari: !s.yerine && !t.length }) +
        yuz({ ikon: "file-check", ad: "Bu sürümle rapor", sayi: raporSayisi(s), not: "imzalı raporlar" }) +
        yuz({ ikon: "file-text", ad: "Dosya", sayi: boyut(s.dosya.kb), not: "PDF" }) +
        yuz({ ikon: "user", ad: "Yükleyen", sayi: kirp(MV.kisi(s.yukleyen).ad), not: MK.tarihYaz(s.tarih) }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-tur"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tur">Kullanan ekipman türleri</h2><span class="a-sayac"><b>' + t.length + "</b> tür</span>" +
        MK.git({ hedef: 5, hash: "#/", ad: "Ekipman türleri", ikon: "layers", sinif: "a-tus-ikincil a-bolum-tus", ne: "Ekipman türleri" }) + "</div>" +
        (t.length ? '<ul class="a-kosullar">' + t.map(function (x) {
          return '<li class="a-kosul-bilgi">' + ikon("layers", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(5, "#/tur/" + x.k) + '">' + kacis(x.ad) + "</a> · " + MV.bransAd(x.b) + (x.format ? " · Bakanlık formatı " + x.format : "") + "</span></li>";
        }).join("") + "</ul>" : '<p class="a-bos-satir">' + (s.yerine ? "Önceki sürüm; türler güncel sürümü kullanır." : "Bu standart henüz hiçbir türde kontrol metodu değil.") + "</p>") + "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-surum"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-surum">Sürümler</h2><span class="a-sayac"><b>' + surumler.length + "</b> sürüm</span></div>" +
        '<ol class="a-gecmis">' + surumler.map(function (x) {
          return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(x.tarih) + '</span><span class="a-gecmis-ne"><b>' + (x.k === s.k ? kacis(ad(x)) : '<a class="a-baglanti" href="#/s/' + x.k + '">' + kacis(ad(x)) + "</a>") + "</b> " + rozet(durum(x)) +
            '<span class="a-not-metin">' + kacis(x.dosya.ad) + " · " + boyut(x.dosya.kb) + " · " + raporSayisi(x) + " rapor · yükleyen " + kacis(MV.kisi(x.yukleyen).ad) + (x.bitti ? " · " + MK.tarihEk(x.bitti, "e") + " kadar" : "") + "</span>" + MK.pdfTus(x.dosya.ad, "Aç", "a-tus-ikincil a-gecmis-tus") + "</span></li>";
        }).join("") + "</ol></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-rapor"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-rapor">Raporda</h2>' +
        "</div>" +
        '<dl class="a-bilgi">' + bilgi("Kontrol metodu", kacis(ad(yeni || s)), true) + "</dl></section>";
  }

  /* ── KONTROL KRİTERLERİ (2026-09-27, reisim: "kriterler de sistem de muhafaza edilecek ve standartlar modülü altında bir sekme de onlar da
     var olsunlar bunlar ilgili ekipmanın muayenesi ile alakalı tariflerdir") — Bakanlığın kontrol kriterleri belgeleri: maddeler, notlar, bağlı
     rapor formatı ve ekipman türü; PDF'i açılır. Belgeler kodda tutulur (şablonlar gibi); site içinde düzenlenmez. ───────────────── */
  var KB = MV.KONTROL_BELGELERI;
  var K_SUTUN = [
    { k: "kod", baslik: "Belge", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/k/' + x.k + '">' + x.k + "</a>" + kirp(x.ad, "a-alt-satir"); } },
    { k: "tur", baslik: "Ekipman türü", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Ekipman türü</span><a class="a-baglanti" href="' + MK.adres(5, "#/tur/" + x.tur) + '">' + kacis(MV.tur(x.tur).ad) + "</a>"; } },
    { k: "rapor", baslik: "Rapor formatı", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Rapor formatı</span><span class="a-kod">' + x.rapor + "</span>"; } },
    { k: "madde", baslik: "Madde", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Madde</span><span class="a-sayi">' + x.maddeler.length + "</span>"; } },
    { k: "yururluk", baslik: "Yürürlük", kart: "govde", sira: 5, hucre: function (x) { return '<span class="a-kart-etiket">Yürürlük</span><span>' + MK.tarihYaz(x.yururluk) + '<span class="a-alt-satir">yayım ' + MK.tarihYaz(x.yayim) + "</span></span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) { return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.pdfTus(x.dosya) + "</div></div>"; } }
  ];
  /* ── DİĞER DÖKÜMANLAR (2026-09-28): firmanın kendi belgeleri; yüklenir, açılır ─────────────────────────────────────── */
  var D_SUTUN = [
    { k: "ad", baslik: "Döküman", kart: "ust", sira: 1, hucre: function (d) { return "<b>" + kacis(d.ad) + "</b>" + (d.kod ? '<span class="a-alt-satir a-kod">' + d.kod + "</span>" : ""); } },
    { k: "tur", baslik: "Tür", kart: "govde", sira: 2, hucre: function (d) { return '<span class="a-kart-etiket">Tür</span>' + kacis(d.tur); } },
    { k: "rev", baslik: "Revizyon", kart: "govde", sira: 3, hucre: function (d) { return '<span class="a-kart-etiket">Revizyon</span>' + kacis(d.rev); } },
    { k: "tarih", baslik: "Yayım", kart: "govde", sira: 4, hucre: function (d) { return '<span class="a-kart-etiket">Yayım</span>' + MK.tarihYaz(d.tarih); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (d) { return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.dosyaAlan({ ad: d.dosya, degistir: "dok-degistir", sil: "dok-sil", veri: { k: d.k } }) + "</div></div>"; } }
  ];
  function digerCiz() {
    var l = MV.DOKUMANLAR.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; });
    $("a-sayac").innerHTML = "<b>" + l.length + "</b> döküman"; $("a-suzgec-kap").innerHTML = "";
    $("a-liste").innerHTML = MK.tablo({ baslik: "Diğer dökümanlar", sinif: "a-tablo-dokuman", sutunlar: D_SUTUN, kayitlar: l });
  }
  function kriterListeCiz() {
    $("a-sayac").innerHTML = "<b>" + KB.length + "</b> belge"; $("a-suzgec-kap").innerHTML = "";
    $("a-liste").innerHTML = MK.tablo({ baslik: "Kontrol kriterleri", sinif: "a-tablo-kriterbelge", sutunlar: K_SUTUN, kayitlar: KB, href: function (x) { return "#/k/" + x.k; } });
  }
  var M_SUTUN = [
    { k: "no", baslik: "No", kart: "ust", sira: 1, hucre: function (m) { return '<span class="a-kod">' + m[0] + "</span> <b>" + kacis(m[1]) + "</b>"; } },
    { k: "icerik", baslik: "İçerik", kart: "govde", sira: 2, hucre: function (m) { return "<span>" + kacis(m[2]) + "</span>"; } },
    { k: "kaynak", baslik: "Standart / yönetmelik", kart: "govde", sira: 3, hucre: function (m) { return '<span class="a-alt-inline">' + kacis(m[3]) + "</span>"; } }
  ];
  function kriterCiz(x) {
    if (!x) {
      $("a-nesne").innerHTML = MK.kirinti([["Muayene kriterleri", "#/kriterler"]]) + '<h1 class="a-gizli" tabindex="-1">Belge bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Belge bulunamadı", metin: "Bu adreste kontrol kriterleri belgesi yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/kriterler">' + ikon("arrow-left", "a-ikon-kucuk") + "Muayene kriterlerine dön</a>" });
      return;
    }
    var f = MV.raporFormati(x.rapor), t = MV.tur(x.tur);
    $("a-nesne").innerHTML = MK.kirinti([["Muayene kriterleri", "#/kriterler"], [x.k]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + x.k + "</h1>" + rozet({ ad: "Yürürlükte", rozet: "a-rozet-tamam" }) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("list-checks", "a-ikon-kucuk") + "<span>" + kacis(x.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.pdfTus(x.dosya, "Kriterleri aç") + MK.pdfTus(f.dosya, "Rapor formatını aç") + "</div></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-kbilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kbilgi">Belge</h2></div><dl class="a-bilgi">' +
        bilgi("Doküman kodu", '<span class="a-kod">' + x.k + "</span>") + bilgi("Yayım tarihi", MK.tarihYaz(x.yayim)) + bilgi("Yürürlük tarihi", MK.tarihYaz(x.yururluk)) + bilgi("Revizyon", "—") +
        bilgi("Ekipman türü", '<a class="a-baglanti" href="' + MK.adres(5, "#/tur/" + t.k) + '">' + kacis(t.ad) + "</a>") +
        bilgi("Rapor formatı", '<span class="a-kod">' + f.k + "</span> " + kacis(f.ad), true) + bilgi("Kapsam", kacis(x.kapsam), "tam") + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-madde"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-madde">Kontrol kriterleri</h2><span class="a-sayac"><b>' + x.maddeler.length + "</b> madde</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: x.k + " maddeleri", sinif: "a-tablo-kmadde", sutunlar: M_SUTUN, kayitlar: x.maddeler }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-knot"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-knot">Notlar</h2></div>' +
        '<ol class="a-kosullar">' + x.notlar.map(function (n, i) { return '<li class="a-kosul-bilgi">' + '<span class="a-kod">Not ' + (i + 1) + "</span><span>" + kacis(n) + "</span></li>"; }).join("") + "</ol></section>";
  }

  /* ── YÜKLE / YENİ SÜRÜM PENCERESİ ───────────────────────────────────────────────────────────────────── */
  var W = null;
  function denetle() {
    var h = {}, d = W.d, no = d.no.trim().replace(/\s+/g, " "), su = d.surum.trim();
    if (!/^[A-ZÇĞİÖŞÜ]{2,}[A-ZÇĞİÖŞÜ0-9 /.-]*\d[\d.-]*(-\d+)*$/.test(no)) h.no = "Standart numarası: ör. TS EN 280 ya da TS HD 60364-6.";
    if (!/^\d{4}(\+[A-Z]\d{1,2}(:\d{4})?)*$/.test(su)) h.surum = "Yıl ve varsa tadil: ör. 2016 ya da 2013+A1:2015.";
    else if (S.some(function (x) { return x.no === no && x.surum === su; })) h.surum = "Bu sürüm kütüphanede var.";
    if (!d.konu.trim()) h.konu = "Konu yazılmalı (raporda standart adı olarak görünür).";
    if (!d.dosya) h.dosya = "PDF dosyası eklenmeli.";
    return h;
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, s = W.s, ayni = !s && d.no.trim() ? S.filter(function (x) { return !x.yerine && x.no === d.no.trim().replace(/\s+/g, " "); })[0] : null;
    var sabit = function (id, v) { return '<input class="a-girdi a-girdi-oku" id="' + id + '" value="' + kacis(v) + '" readonly aria-describedby="' + id + '-ipucu">'; };
    $("a-pencere-baslik").textContent = s ? "Yeni sürüm yükle · " + s.no : "Standart yükle";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-no", etiket: "Standart no", zorunlu: !s, hata: h.no, ipucu: s ? "Numara aynı kalır" : "ör. TS EN 280",
        girdi: s ? sabit("w-no", s.no) : MK.girdi({ id: "w-no", alan: "no", deger: d.no, sinif: "a-girdi-sicil", ek: ' maxlength="40"', hata: h.no }) }) +
      MK.alan({ id: "w-surum", etiket: "Sürüm", zorunlu: true, hata: h.surum, ipucu: s ? "Kütüphanedeki: " + kacis(s.surum) : "Yıl ve tadil",
        girdi: MK.girdi({ id: "w-surum", alan: "surum", deger: d.surum, sinif: "a-girdi-sicil", ek: ' maxlength="20"', hata: h.surum }) }) +
      MK.alan({ id: "w-konu", etiket: "Konu", zorunlu: !s, hata: h.konu, genis: true, ipucu: s ? "" : "Raporun metot alanında numarayla birlikte yazılır",
        girdi: s ? sabit("w-konu", s.konu) : MK.girdi({ id: "w-konu", alan: "konu", deger: d.konu, ek: ' maxlength="120"', hata: h.konu }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Dosya <span class="a-zorunlu">zorunlu</span></p><div class="a-dosya">' +
        (d.dosya ? MK.dosyaAlan({ ad: d.dosya, degistir: "dosya-sec", sil: "dosya-kaldir" }) : MK.tus({ eylem: "dosya-sec", ad: "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
        (h.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + h.dosya + "</p>" : "") + "</div>" +
      "</div>" +
      '<div class="a-serit-kap a-uyari-serit" id="w-seritler" aria-live="polite">' + seritler(ayni) + "</div>" +
      "";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: s ? "Yeni sürümü yükle" : "Yükle", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function seritler(ayni) {
    var s = W.s || ayni;
    if (!s) return "";
    var t = turleri(s);
    return MK.serit("uyari", "history", (W.s ? "" : "Bu numara kütüphanede var (" + kacis(ad(s)) + "). ") + "Yüklenince " + kacis(ad(s)) + " önceki sürüm olur" +
      (t.length ? "; " + t.length + " tür (" + kacis(t.map(function (x) { return x.ad; }).join(", ")) + ") yeni sürümü kullanır" : "") + ". Yazılmış raporlar eski sürümü göstermeye devam eder.");
  }
  /* döküman yükle penceresi: ad, tür, kod, revizyon, PDF */
  function dokCiz(odak) {
    var d = W.d, h = W.hata;
    $("a-pencere-baslik").textContent = "Döküman yükle";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-ad", etiket: "Döküman adı", zorunlu: true, hata: h.ad, genis: true, girdi: MK.girdi({ id: "w-ad", alan: "ad", deger: d.ad, ek: ' maxlength="100"', hata: h.ad }) }) +
      MK.alan({ id: "w-tur", etiket: "Tür", zorunlu: true, hata: h.tur, girdi: MK.secim({ id: "w-tur", ad: "Tür", deger: d.tur, ipucu: "Tür seçin", gecersiz: !!h.tur, secenekler: MV.DOKUMAN_TUR.map(function (t) { return [t, t]; }) }) }) +
      MK.alan({ id: "w-kod", etiket: "Kod", girdi: MK.girdi({ id: "w-kod", alan: "kod", deger: d.kod, sinif: "a-girdi-sicil", ek: ' maxlength="20"' }) }) +
      MK.alan({ id: "w-rev", etiket: "Revizyon", girdi: MK.girdi({ id: "w-rev", alan: "rev", deger: d.rev, ek: ' maxlength="20"' }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Dosya <span class="a-zorunlu">zorunlu</span></p><div class="a-dosya">' +
        (d.dosya ? MK.dosyaAlan({ ad: d.dosya, degistir: "dok-dosya", sil: "dok-dosya-kaldir" }) : MK.tus({ eylem: "dok-dosya", ad: "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
        (h.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + h.dosya + "</p>" : "") + "</div></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "dok-kaydet", ad: "Yükle", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function dokAc() { W = { tip: "dok", hata: {}, d: { ad: "", tur: "", kod: "", rev: "", dosya: "" } }; dokCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-ad").focus(); }
  function pencereAc(s) {
    W = { s: s || null, hata: {}, d: { no: s ? s.no : "", surum: "", konu: s ? s.konu : "", dosya: "" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $(s ? "w-surum" : "w-no").focus();
  }
  function kaydet() {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz(hk[0] === "dosya" ? null : "w-" + hk[0]); if (hk[0] === "dosya") document.querySelector('[data-eylem="dosya-sec"]').focus(); return; }
    var d = W.d, no = d.no.trim().replace(/\s+/g, " "), eski = W.s || S.filter(function (x) { return !x.yerine && x.no === no; })[0];
    var yeni = { k: "y" + S.length, no: no, konu: d.konu.trim(), surum: d.surum.trim(), yukleyen: "sy", tarih: MK.BUGUN, dosya: { ad: d.dosya, kb: 3280 } };
    if (eski) {
      /* yeni sürüm eskinin kimliğini devralır (türler ona bağlı kalsın); eski kayıt yeni kimlikle "önceki" olur */
      var arsiv = Object.assign({}, eski, { k: "y" + S.length, yerine: eski.k, bitti: MK.BUGUN });
      onceki(eski).forEach(function (x) { x.yerine = eski.k; });
      Object.assign(eski, { surum: yeni.surum, tarih: yeni.tarih, yukleyen: yeni.yukleyen, dosya: yeni.dosya, konu: yeni.konu || eski.konu });
      S.push(arsiv); yeni = eski;
    } else S.push(yeni);
    $("a-pencere").close();
    location.hash = "#/s/" + yeni.k;
    MK.bildir(ad(yeni) + (eski ? " yüklendi; önceki sürüm saklandı." : " kütüphaneye eklendi."));
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/yukle") return { v: "liste", pencere: true };
    if (h === "#/kriterler") return { v: "kriterler" };
    if (h === "#/diger") return { v: "diger" };
    if (h === "#/diger/yukle") return { v: "diger", pencere: "dok" };
    if ((m = /^#\/k\/([A-Z0-9]+)$/.exec(h))) return { v: "kriter", id: m[1] };
    if ((m = /^#\/s\/([a-z0-9]+)\/surum$/.exec(h))) return { v: "std", id: m[1], pencere: true };
    if ((m = /^#\/s\/([a-z0-9]+)$/.exec(h))) return { v: "std", id: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), s = r.v === "std" ? bul(r.id) : null, liste = r.v === "liste" || r.v === "kriterler" || r.v === "diger";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    [["a-sekme-std", "liste"], ["a-sekme-krt", "kriterler"], ["a-sekme-dgr", "diger"]].forEach(function (x) { if (r.v === x[1]) $(x[0]).setAttribute("aria-current", "page"); else $(x[0]).removeAttribute("aria-current"); });
    document.querySelector("#a-liste-gorunum .a-sayfa-bas .a-bolum-tus").hidden = r.v !== "liste";   /* kriter belgeleri kodda; yükleme yok */
    $("a-dok-yukle").hidden = r.v !== "diger";
    if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("s"); MK.suzgecKur("s"); }
    else if (r.v === "kriterler") kriterListeCiz();
    else if (r.v === "diger") digerCiz();
    else if (r.v === "kriter") kriterCiz(MV.kontrolBelgesi(r.id));
    else standartCiz(s);
    document.title = (r.v === "liste" ? "Standartlar · Dökümanlar" : r.v === "kriterler" ? "Muayene kriterleri · Dökümanlar" : r.v === "diger" ? "Diğer dökümanlar · Dökümanlar" : r.v === "kriter" ? r.id : s ? ad(s) : "Standart bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere === "dok") { if (!W) dokAc(); }
    else if (r.pencere && (r.v === "liste" || (s && !s.yerine))) pencereAc(s); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["yukle-ac"] = function () { pencereAc(null); };
  X["dok-yukle-ac"] = function () { history.replaceState(null, "", "#/diger/yukle"); dokAc(); };
  X["dok-dosya"] = function () {
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 50, ornek: (W.d.kod || W.d.ad || "dokuman").replace(/\s+/g, "-") + ".pdf" }, function (ad) {
      if (!W) return; W.d.dosya = ad; delete W.hata.dosya; dokCiz(); document.querySelector('[data-eylem="dok-dosya"]').focus();
    });
  };
  X["dok-kaydet"] = function () {
    var d = W.d, h = {};
    if (!d.ad.trim()) h.ad = "Döküman adı yazılmalı."; if (!d.tur) h.tur = "Tür seçilmeli."; if (!d.dosya) h.dosya = "PDF dosyası eklenmeli.";
    W.hata = h; var hk = Object.keys(h); if (hk.length) { dokCiz(hk[0] === "dosya" ? null : "w-" + hk[0]); if (hk[0] === "dosya") document.querySelector('[data-eylem="dok-dosya"]').focus(); return; }
    var x = { k: "d" + (MV.DOKUMANLAR.length + 1), kod: d.kod.trim(), ad: d.ad.trim(), tur: d.tur, rev: d.rev.trim() || "—", tarih: MK.BUGUN, yukleyen: "sy", dosya: d.dosya };
    MV.DOKUMANLAR.push(x); $("a-pencere").close(); digerCiz(); MK.bildir(x.ad + " yüklendi.");
  };
  MK.onSecim = function (id, deger) { if (W && W.tip === "dok" && id === "w-tur") { W.d.tur = deger; delete W.hata.tur; dokCiz(id); } };
  X["surum-ac"] = function () { pencereAc(bul(rota().id)); };
  /* yüklenen standart PDF'i görüntüleyicide açılır (reisim 2026-09-27); sahada tablet ve telefonda da okunur */
  X["oku"] = function () { var s = bul(rota().id); MK.pdfGoster({ dosya: s.dosya.ad, baslik: ad(s), sayfa: 3 }); };
  X["dosya-sec"] = function () {
    var no = (W.s ? W.s.no : W.d.no.trim() || "Standart").replace(/\s+/g, "-");
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 50, ornek: no + "_" + (W.d.surum.trim() || "sürüm") + ".pdf" }, function (ad) {
      if (!W) return; W.d.dosya = ad; delete W.hata.dosya; pencereCiz(); document.querySelector('[data-eylem="dosya-sec"]').focus();
    });
  };
  X["pencere-kaydet"] = kaydet;
  /* 2026-09-28 (reisim: "yüklenilen şeyler düzenlenebilir silinebilir olmalı"): pencerede seçilen dosya kaldırılır; yüklenen standart sürümü
     ve döküman silinir. Güncel sürüm silinince bir önceki sürüm geri gelir; tek sürümse standart kütüphaneden ve türlerin kontrol metodundan çıkar. */
  X["dosya-kaldir"] = function () { if (!W) return; W.d.dosya = ""; pencereCiz(); document.querySelector('#a-pencere [data-eylem="dosya-sec"]').focus(); };
  X["dok-dosya-kaldir"] = function () { if (!W) return; W.d.dosya = ""; dokCiz(); document.querySelector('#a-pencere [data-eylem="dok-dosya"]').focus(); };
  var dokBul = function (el) { return MV.DOKUMANLAR.filter(function (x) { return x.k === el.dataset.k; })[0]; };
  X["dok-degistir"] = function (el) {
    var x = dokBul(el);
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 50, ornek: (x.kod || x.ad).replace(/\s+/g, "-") + "-2.pdf" }, function (a) { if (x.dosya && x.dosya !== a) MK.dosyaSil(x.dosya); x.dosya = a; x.tarih = MK.BUGUN; digerCiz(); MK.bildir(x.ad + " dosyası değiştirildi."); });
  };
  X["dok-sil"] = function (el) {
    var x = dokBul(el);
    MK.onayla({ baslik: "Dökümanı sil", metin: x.ad + " silinir.", tamam: function () { MV.DOKUMANLAR.splice(MV.DOKUMANLAR.indexOf(x), 1); MK.dosyaSil(x.dosya); digerCiz(); MK.bildir(x.ad + " silindi."); } });
  };
  X["std-sil"] = function () {
    var s = bul(rota().id), arsiv = s.yerine ? null : onceki(s).sort(function (a, b) { return a.bitti < b.bitti ? 1 : -1; })[0], t = turleri(s);
    var metin = s.yerine ? ad(s) + " (önceki sürüm) silinir." : arsiv ? ad(s) + " silinir; bir önceki sürüm (" + kacis(arsiv.surum) + ") yeniden güncel olur."
      : ad(s) + " kütüphaneden silinir." + (t.length ? " " + t.length + " ekipman türünün kontrol metodundan çıkar." : "");
    MK.onayla({ baslik: "Standardı sil", metin: metin, tamam: function () {
      MK.dosyaSil(s.dosya.ad);
      if (s.yerine) { S.splice(S.indexOf(s), 1); location.hash = "#/s/" + s.yerine; }
      else if (arsiv) { Object.assign(s, { surum: arsiv.surum, tarih: arsiv.tarih, yukleyen: arsiv.yukleyen, dosya: arsiv.dosya, konu: arsiv.konu }); S.splice(S.indexOf(arsiv), 1); goster(true); }
      else { t.forEach(function (x) { x.std = x.std.filter(function (k) { return k !== s.k; }); }); S.splice(S.indexOf(s), 1); location.hash = "#/"; }
      MK.bildir("Standart silindi.");
    } });
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k || !W) return;
    W.d[k] = e.target.value;
    if (k === "no") { var no = W.d.no.trim().replace(/\s+/g, " "); $("w-seritler").innerHTML = seritler(S.filter(function (x) { return !x.yerine && x.no === no; })[0]); }
  };
  $("a-pencere").addEventListener("close", function () {
    if ($("a-pencere").open) return;   /* kapanış olayı eşzamansız: yeniden açıldıysa yeni durum silinmez (2026-09-29) */
    W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "std" ? "#/s/" + r.id : r.v === "diger" ? "#/diger" : "#/");
  });

  MK.kabuk({ modul: 4, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  var q = sorgu(); if (q.tur && MV.tur(q.tur)) SZ.s.sec.tur = q.tur;   /* tür sayfasından */
  goster(false);
})();
