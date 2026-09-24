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
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (s) { return rozet(durum(s)) + (s.yerine ? '<span class="a-alt-satir">' + MK.gunKisa(s.bitti) + "'e kadar</span>" : ""); } }
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
    var ornekTur = (yeni ? turleri(yeni) : t).filter(function (x) { return x.sablon; })[0];
    $("a-nesne").innerHTML = MK.kirinti([["Standartlar", "#/"], [ad(s)]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(ad(s)) + "</h1>" + rozet(durum(s)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("book-open", "a-ikon-kucuk") + "<span>" + kacis(s.konu) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "oku", ad: "Oku", ikon: "eye", sinif: "a-tus-ikincil" }) +
          (s.yerine ? "" : MK.tus({ eylem: "surum-ac", ad: "Yeni sürüm yükle", ikon: "refresh-cw" })) + "</div></div>" +
      (yeni ? '<div class="a-serit-kap">' + MK.serit("bilgi", "history", "Önceki sürüm: " + MK.tarihYaz(s.bitti) + " tarihinde yerine <a class=\"a-baglanti\" href=\"#/s/" + yeni.k + "\">" + kacis(ad(yeni)) + "</a> geçti. O tarihe kadar yazılan raporlar bu sürümü gösterir; dosya saklanır, silinmez.") + "</div>"
        : !t.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Hiçbir ekipman türüne atanmadı: raporda kontrol metodu olarak seçilemez. Atama tür sayfasından yapılır (Ekipman türleri).") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "layers", ad: "Kullanan tür", sayi: t.length, href: t.length === 1 ? MK.adres(5, "#/tur/" + t[0].k) : null, not: s.yerine ? "yeni sürüme geçti" : t.length ? "kontrol metodu" : "atanmadı", uyari: !s.yerine && !t.length }) +
        yuz({ ikon: "file-check", ad: "Bu sürümle rapor", sayi: raporSayisi(s), not: "imzalı raporlar" }) +
        yuz({ ikon: "file-text", ad: "Dosya", sayi: boyut(s.dosya.kb), not: "PDF · yalnız firma içinde" }) +
        yuz({ ikon: "user", ad: "Yükleyen", sayi: kirp(MV.kisi(s.yukleyen).ad), not: MK.tarihYaz(s.tarih) }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-tur"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tur">Kullanan ekipman türleri</h2><span class="a-sayac"><b>' + t.length + "</b> tür</span>" +
        MK.git({ hedef: 5, hash: "#/", ad: "Ekipman türleri", ikon: "layers", sinif: "a-tus-ikincil a-bolum-tus", ne: "Ekipman türleri" }) + "</div>" +
        '<p class="a-bolum-aciklama">Tür sayfasında kontrol metodu olarak atanır; raporda inspector türün standartlarından seçer.</p>' +
        (t.length ? '<ul class="a-kosullar">' + t.map(function (x) {
          return '<li class="a-kosul-bilgi">' + ikon("layers", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(5, "#/tur/" + x.k) + '">' + kacis(x.ad) + "</a> · " + MV.bransAd(x.b) + (x.format ? " · Bakanlık formatı " + x.format : "") + "</span></li>";
        }).join("") + "</ul>" : '<p class="a-bos-satir">' + (s.yerine ? "Önceki sürüm türlere bağlı değildir; türler güncel sürümü kullanır." : "Bu standart henüz hiçbir türde kontrol metodu değil.") + "</p>") + "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-surum"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-surum">Sürümler</h2><span class="a-sayac"><b>' + surumler.length + "</b> sürüm</span></div>" +
        '<ol class="a-gecmis">' + surumler.map(function (x) {
          return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(x.tarih) + '</span><span class="a-gecmis-ne"><b>' + (x.k === s.k ? kacis(ad(x)) : '<a class="a-baglanti" href="#/s/' + x.k + '">' + kacis(ad(x)) + "</a>") + "</b> " + rozet(durum(x)) +
            '<span class="a-not-metin">' + kacis(x.dosya.ad) + " · " + boyut(x.dosya.kb) + " · " + raporSayisi(x) + " rapor · yükleyen " + kacis(MV.kisi(x.yukleyen).ad) + (x.bitti ? " · " + MK.tarihYaz(x.bitti) + "'e kadar" : "") + "</span></span></li>";
        }).join("") + "</ol></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-rapor"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-rapor">Raporda</h2>' +
        (ornekTur ? MK.git({ hedef: "sablon", hash: "#/" + ornekTur.k, ad: "Şablonda gör", ikon: "file-text", sinif: "a-tus-ikincil a-bolum-tus", ne: "Rapor şablonu önizlemesi" }) : "") + "</div>" +
        '<dl class="a-bilgi">' + bilgi("Kontrol metodu (Ek-III 1.7.1.1)", kacis(ad(yeni || s)) + " — " + kacis(s.konu), true) +
          bilgi("Seçim", "Tür düzeyinde atanır, inspector rapor anında türün standartlarından seçer (öneri)", true) + "</dl></section>";
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
        MK.tus({ eylem: "dosya-sec", ad: d.dosya ? "Değiştir" : "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
        (d.dosya ? '<span class="a-dosya-ad">' + kacis(d.dosya) + "</span>" : '<span class="a-dosya-ad a-deger-yok">Dosya seçilmedi</span>') + "</div>" +
        (h.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + h.dosya + "</p>" : '<p class="a-ipucu" id="w-dosya-ipucu">PDF, en çok 50 MB.</p>') + "</div>" +
      "</div>" +
      '<div class="a-serit-kap a-uyari-serit" id="w-seritler" aria-live="polite">' + seritler(ayni) + "</div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "lock", "Standart telifli belgedir: firmanın satın aldığı kopya yüklenir. Yalnız firma kullanıcıları okur; dışarıya kalıcı bağlantı üretilmez.") + "</div>";
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
    if ((m = /^#\/s\/([a-z0-9]+)\/surum$/.exec(h))) return { v: "std", id: m[1], pencere: true };
    if ((m = /^#\/s\/([a-z0-9]+)$/.exec(h))) return { v: "std", id: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), s = r.id ? bul(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("s"); MK.suzgecKur("s"); }
    else standartCiz(s);
    document.title = (r.v === "liste" ? "Standartlar" : s ? ad(s) : "Standart bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere && (r.v === "liste" || (s && !s.yerine))) pencereAc(s); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["yukle-ac"] = function () { pencereAc(null); };
  X["surum-ac"] = function () { pencereAc(bul(rota().id)); };
  X["oku"] = function () { MK.bildir("Makette dosya yok. Uygulamada kısa ömürlü, yetkili bağlantıyla açılır; sahada tablet ve telefonda da okunur."); };
  X["dosya-sec"] = function () {
    var no = (W.s ? W.s.no : W.d.no.trim() || "Standart").replace(/\s+/g, "-");
    W.d.dosya = no + "_" + (W.d.surum.trim() || "sürüm") + ".pdf"; delete W.hata.dosya; pencereCiz();
    document.querySelector('[data-eylem="dosya-sec"]').focus();
  };
  X["pencere-kaydet"] = kaydet;
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k || !W) return;
    W.d[k] = e.target.value;
    if (k === "no") { var no = W.d.no.trim().replace(/\s+/g, " "); $("w-seritler").innerHTML = seritler(S.filter(function (x) { return !x.yerine && x.no === no; })[0]); }
  };
  $("a-pencere").addEventListener("close", function () {
    var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "std" ? "#/s/" + r.id : "#/");
  });

  MK.kabuk({ modul: 4, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  var q = sorgu(); if (q.tur && MV.tur(q.tur)) SZ.s.sec.tur = q.tur;   /* tür sayfasından */
  goster(false);
})();
