/* ══ probata MAKET M3 — Ekipman (modül 7) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════════════════════════════
   Kaynak: pkproje.md §3 (ekipman kaydı kalıcı; sonraki yıl aynı ekipmana yeni rapor, önceki geçmişte), §3.4–3.5 (kod personelce
   etiketten, firmada eşsiz, çakışan kod kaydedilmez, değiştirme yalnız yönetici, eski kod geçmişte), §4.2 1.7.2.1 (etiket
   bilgileri: ad, marka, model, imal yılı, seri no, izlenebilirlik), §4.5 (ağır kusur → giderilene kadar kullanılamaz), §4.7
   (sonraki kontrol = periyot önerisi). Ekranlar: firma geneli liste (#/, ?tesis= · ?musteri= · ?tur=; 10'ar sayfa) · ekipman
   sayfası (#/e/<kod>) · pencereler: ekipman ekle · etiket bilgilerini düzenle · kodu değiştir. Veri ortak, UYDURMA. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var BUGUN = MK.BUGUN, SAYFA_BOYU = 10;   /* kalıp: ekipman 10'ar (src/styles/kalip.ts sayfa.ekipman) */
  var DURUM = {
    uygun: { ad: "Kullanılabilir", rozet: "a-rozet-tamam" }, kullanilamaz: { ad: "Kullanılamaz", rozet: "a-rozet-red" },
    gecikti: { ad: "Kontrolü geçti", rozet: "a-rozet-bekliyor" }, ilk: { ad: "İlk kontrol bekliyor", rozet: "a-rozet-notr" },
    onayda: { ad: "Raporu onayda", rozet: "a-rozet-kabul" }
  };
  var kalan = function (e) { var s = MV.sonrakiKontrol(e); return s ? MK.gunFarki(BUGUN, s) : null; };
  function durum(e) {
    if (e.ilk || !e.onceki) return "ilk";
    if (e.onceki.sonuc === "Kusurlu") return "kullanilamaz";   /* ağır kusur: giderilene kadar kullanılamaz (§4.5) */
    /* kontrol bu yıl yapıldı ama rapor henüz imzalanmadı (tesisin planı tamamlandı ya da sürüyor): "geçti" denmez */
    var ts = MV.tesis(e.tesis);
    if (kalan(e) < 0 && ts.pid && (ts.pdurum === "tamam" || ts.pdurum === "denetimde") && ts.ptarih >= MV.sonrakiKontrol(e)) return "onayda";
    return kalan(e) < 0 ? "gecikti" : "uygun";
  }
  var sonucSinif = function (s) { return s === "Uygun" ? "" : s === "Kusurlu" ? " a-sonuc-hata" : " a-sonuc-uyari"; };
  var tesisAd = function (e) { var t = MV.tesis(e.tesis); return MV.musteri(t.m).kisa + " / " + t.ad; };
  var q = (function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; })();

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("e", { ad: "Ekipmanlarda ara", ipucu: "Kod, tür, tesis, seri no", birim: "ekipman", sayfa: SAYFA_BOYU,
    cipler: [
      { k: "kullanilamaz", ad: "Kullanılamaz", test: function (e) { return durum(e) === "kullanilamaz"; } },
      { k: "hafif", ad: "Hafif kusurlu", test: function (e) { return !!e.onceki && e.onceki.sonuc === "Hafif kusurlu"; } },
      { k: "gecikti", ad: "Kontrolü geçmiş", grup: "tarih", test: function (e) { return durum(e) === "gecikti"; } },
      { k: "yakin", ad: "30 gün içinde", grup: "tarih", test: function (e) { var k = kalan(e); return k !== null && k >= 0 && k <= 30; } },
      { k: "ilk", ad: "İlk kontrol bekliyor", test: function (e) { return durum(e) === "ilk"; } }
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: function () { return [["tumu", "Tümü"]].concat(MV.MUSTERILER.map(function (m) { return [m.id, m.kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); })); },
        gecer: function (e, v) { return v === "tumu" || MV.tesis(e.tesis).m === v; } },
      { k: "tesis", ad: "Tesis", secenek: function () {
        var m = SZ.e.sec.musteri, l = MV.TESISLER.filter(function (t) { return m === "tumu" || t.m === m; });
        /* müşteri değişince başka müşterinin tesisi seçili kalmaz (liste sessizce boşalmasın) */
        if (SZ.e.sec.tesis !== "tumu" && !l.some(function (t) { return t.id === SZ.e.sec.tesis; })) SZ.e.sec.tesis = "tumu";
        return [["tumu", "Tümü"]].concat(l.map(function (t) { return [t.id, (m === "tumu" ? MV.musteri(t.m).kisa + " / " : "") + t.ad]; }));
      }, gecer: function (e, v) { return v === "tumu" || e.tesis === v; } },
      { k: "tur", ad: "Tür", secenek: function () {
        return [["tumu", "Tümü"]].concat(MV.KATALOG.filter(function (t) { return MV.EKIPMAN.some(function (e) { return e.tur === t.k; }); }).map(function (t) { return [t.k, t.ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (e, v) { return v === "tumu" || e.tur === v; } }
    ],
    metin: function (e) { return [e.kod, MV.tur(e.tur).ad, tesisAd(e), e.konum, e.seri].join(" "); },
    imkansiz: "Bir ekipmanın kontrolü hem geçmiş hem yaklaşıyor olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "kod", baslik: "Kod", kart: "ust", sira: 1, hucre: function (e) { return '<a class="a-no" href="#/e/' + e.kod + '">' + e.kod + "</a>"; } },
    { k: "tur", baslik: "Tür", kart: "govde", sira: 2, hucre: function (e) { return kirp(MV.tur(e.tur).ad, "a-ekipman-ad"); } },
    { k: "tesis", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: function (e) {
      var t = MV.tesis(e.tesis);
      return '<span class="a-hucre-satir">' + ikon("building-2", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' + kirp(t.ad) + kirp(MV.musteri(t.m).kisa, "a-alt-satir") + "</span></span>";
    } },
    { k: "konum", baslik: "Konum", kart: "govde", sira: 4, hucre: function (e) { return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + kirp(e.konum) + "</span>"; } },
    { k: "son", baslik: "Son kontrol", kart: "govde", sira: 5, hucre: function (e) {
      return '<span class="a-kart-etiket">Son kontrol</span>' + (e.onceki ? '<span class="a-onceki' + sonucSinif(e.onceki.sonuc) + '" title="' + e.onceki.rapor + '">' + MK.ayYil(e.onceki.tarih) + " · " + e.onceki.sonuc + "</span>" : '<span class="a-ilk">İlk kontrol</span>');
    } },
    { k: "sonraki", baslik: "Sonraki kontrol", kart: "govde", sira: 6, hucre: function (e) {
      var s = MV.sonrakiKontrol(e), k = kalan(e);
      return '<span class="a-kart-etiket">Sonraki kontrol</span>' + (s ? '<span class="a-tarih-gun">' + MK.tarihYaz(s) + '</span><span class="' + (k <= 30 ? "a-uyari-metin" : "a-tarih-saat") + '">' + (k < 0 ? -k + " gün geçti" : k === 0 ? "Bugün" : k + " gün") + "</span>" : '<span class="a-deger-yok">İlk kontrolde belirlenir</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (e) { return rozet(DURUM[durum(e)]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "e", kayitlar: MV.EKIPMAN, sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      bosVeri: { ikon: "wrench", baslik: "Ekipman yok", metin: "Ekipman, plan açılırken ya da sahada kodla eklenir." },
      tablo: { baslik: "Ekipmanlar", sinif: "a-tablo-ekipmanlar", sutunlar: SUTUN, href: function (e) { return "#/e/" + e.kod; } } });
  }

  /* ── EKİPMAN SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  function gecmis(e) {
    if (!e.onceki) return [];
    var l = [{ no: e.onceki.rapor, tarih: e.onceki.tarih, sonuc: e.onceki.sonuc, kisi: e.onceki.kisi }];
    if (e.imal < 2019) { var y = +e.onceki.tarih.slice(0, 4) - 1; l.push({ no: MV.raporNo("09" + String(y).slice(2), 300 + e.kod.length * 7 + e.imal % 50), tarih: y + e.onceki.tarih.slice(4), sonuc: "Uygun", kisi: "mk" }); }
    return l;
  }
  var RAPOR_SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<span class="a-rapor-no">' + r.no + "</span>"; } },
    { k: "tarih", baslik: "Kontrol tarihi", kart: "govde", sira: 2, hucre: function (r) { return '<span class="a-kart-etiket">Kontrol tarihi</span>' + MK.tarihYaz(r.tarih); } },
    { k: "kisi", baslik: "Inspector", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Inspector</span>' + kacis(MV.kisi(r.kisi).ad); } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (r) { return '<span class="a-onceki' + sonucSinif(r.sonuc) + '">' + r.sonuc + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function () {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "kapsam-disi", ad: "PDF'i gör", ikon: "file-text", sinif: "a-tus-ikincil", veri: { ne: "İmzalı rapor PDF'i" } }) + "</div></div>";
    } }
  ];
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function ekipmanCiz(e) {
    if (!e) {
      $("a-nesne").innerHTML = MK.kirinti([["Ekipmanlar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Ekipman bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Ekipman bulunamadı", metin: "Bu kodla kayıtlı ekipman yok; kod değiştiyse eski kodla aranınca yeni kayıt bulunur.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Ekipmanlara dön</a>" });
      return;
    }
    var t = MV.tur(e.tur), ts = MV.tesis(e.tesis), m = MV.musteri(ts.m), d = durum(e), s = MV.sonrakiKontrol(e), k = kalan(e), g = gecmis(e);
    $("a-nesne").innerHTML = MK.kirinti([["Ekipmanlar", "#/"], [e.kod]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + e.kod + " · " + kacis(t.ad) + "</h1>" + rozet(DURUM[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<a class="a-baglanti" href="' + MK.adres(3, "#/t/" + ts.id) + '">' + kacis(m.kisa + " / " + ts.ad) + "</a><span>· " + kacis(e.konum) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "kod-ac", ad: "Kodu değiştir", ikon: "pencil", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "etiket-ac", ad: "Etiket bilgilerini düzenle", ikon: "pencil" }) + "</div></div>" +
      (d === "kullanilamaz" ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", "Son kontrolde ağır kusur: giderilene kadar kullanılamaz. Giderilince ikinci kontrol raporu öncekine bağlı açılır (Ek-III 1.9).") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "clock", ad: "Son kontrol", sayi: e.onceki ? MK.gunKisa(e.onceki.tarih) : "—", not: e.onceki ? MK.ayYil(e.onceki.tarih) + " · " + e.onceki.sonuc : "ilk kontrol bekliyor", uyari: !!e.onceki && e.onceki.sonuc !== "Uygun" }) +
        yuz({ ikon: "alarm-clock", ad: "Sonraki kontrol", sayi: s ? MK.gunKisa(s) : "—", not: s ? (k < 0 ? -k + " gün geçti" : k === 0 ? "bugün" : k + " gün sonra") : "ilk kontrolde belirlenir", uyari: s && k <= 30 }) +
        yuz({ ikon: "file-text", ad: "İmzalı rapor", sayi: g.length, not: g.length ? "en yenisi " + MK.ayYil(g[0].tarih) : "henüz yok" }) +
        yuz({ ikon: "calendar-check", ad: "Tesisin planı", sayi: ts.pid ? ts.plan : "—", href: ts.pid ? MK.adres(13, "#/plan/" + ts.pid) : null, not: ts.pid ? MV.PLAN_DURUM[ts.pdurum].ad : "açık plan yok" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-etiket"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-etiket">Etiket bilgileri</h2><span class="a-sayac">Ek-III 1.7.2.1 · rapora buradan dolar</span></div><dl class="a-bilgi">' +
        bilgi("Ekipman", kacis(t.ad)) + bilgi("Marka", kacis(e.marka)) + bilgi("Model", '<span class="a-kod">' + kacis(e.model) + "</span>") + bilgi("İmal yılı", e.imal) +
        bilgi("Seri no", '<span class="a-kod">' + kacis(e.seri) + "</span>") + bilgi("İzlenebilirlik", "Etiketteki kod " + e.kod) + bilgi("Kullanım yeri", kacis(e.konum), true) +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-tur"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tur">Tür ve kontrol kuralları</h2>' +
        MK.git({ hedef: 5, hash: "#/tur/" + t.k, ad: "Türü aç", ikon: "layers", sinif: "a-tus-ikincil a-bolum-tus", ne: "Ekipman türleri" }) + '</div><dl class="a-bilgi">' +
        bilgi("Ek-III grubu", kacis(MV.grup(t.g).ad), true) + bilgi("Branş", MV.bransAd(t.b)) + bilgi("Periyot", t.periyot + " ay") +
        bilgi("Standart", t.std.length ? t.std.map(function (x) { return MV.standart(x).no; }).join(" · ") : '<span class="a-deger-yok">Seçilmemiş</span>', true) +
        bilgi("Bakanlık formatı", t.format ? t.format + ' <span class="a-alt-inline">' + t.formatDurum + "</span>" : '<span class="a-deger-yok">Yayımlanmadı</span>') +
        bilgi("Rapor şablonu", t.sablon ? t.sablon : '<span class="a-yuz-uyari">Yok — rapor açılamaz</span>') +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-rapor"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-rapor">Rapor geçmişi</h2><span class="a-sayac"><b>' + g.length + "</b> imzalı rapor</span></div>" +
        '<div class="a-liste-kap">' + (g.length ? MK.tablo({ baslik: "Rapor geçmişi", sinif: "a-tablo-gecmis", sutunlar: RAPOR_SUTUN, kayitlar: g })
          : '<p class="a-bos-satir">Bu ekipmanın imzalı raporu yok; ilk kontrol planda yapılır. Her yıl yeni rapor açılır, eskiler burada kalır.</p>') + "</div></section>" +
      (e.eskiKod ? '<section class="a-bolum" aria-labelledby="a-b-kod"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kod">Kod geçmişi</h2></div><ul class="a-kosullar">' +
        e.eskiKod.map(function (x) { return '<li class="a-kosul-bilgi">' + ikon("undo-2", "a-ikon-kucuk") + '<span><span class="a-kod">' + x.kod + "</span> → " + e.kod + " · " + MK.tarihYaz(x.tarih) + " · " + kacis(MV.kisi(x.kim).ad) + (x.gerekce ? " · " + kacis(x.gerekce) : "") + "</span></li>"; }).join("") +
        "</ul></section>" : "");
  }

  /* ── PENCERELER: ekipman ekle · etiket bilgileri · kodu değiştir ─────────────────────────────────────── */
  var W = null;
  function denetle() {
    var h = {}, d = W.d;
    if (W.tur === "ekle") {
      if (!d.tesis) h.tesis = "Tesis seçilmeli (ekipman tesisin kalıcı kaydıdır).";
      if (MV.kodDurum(d.kod).tur !== "tamam") h.kod = MV.kodDurum(d.kod).metin;
      if (!d.tur) h.tur = "Tür seçilmeli.";
    }
    if (W.tur === "kod") {
      if (MV.kodDurum(d.kod, W.e.kod).tur !== "tamam" || d.kod === W.e.kod) h.kod = d.kod === W.e.kod ? "Yeni kod eskisiyle aynı." : MV.kodDurum(d.kod).metin;
      if (d.gerekce.trim().length < 5) h.gerekce = "Gerekçe yazılmalı (kod geçmişinde kalır).";
    }
    if ((W.tur === "etiket" || W.tur === "ekle") && d.imal && !/^(19|20)\d{2}$/.test(d.imal)) h.imal = "Dört haneli yıl.";
    return h;
  }
  function pencereCiz(odak, imlec) {
    var d = W.d, h = W.hata, A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: o.girdi || MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var kodAlani = function () {
      var kd = MV.kodDurum(d.kod, W.e && W.e.kod);
      return '<div class="a-alan-grup"><label class="a-etiket" for="w-kod">' + (W.tur === "kod" ? "Yeni kod" : "Ekipman kodu") + ' <span class="a-zorunlu">zorunlu</span></label>' +
        '<input class="a-girdi a-girdi-kod" id="w-kod" data-alan="kod" autocomplete="off" spellcheck="false" maxlength="20" placeholder="HT-2040" value="' + kacis(d.kod) + '" aria-describedby="w-kod-ipucu" aria-invalid="' + (kd.tur === "hata") + '">' +
        '<p class="a-kod-durum a-kod-durum-' + kd.tur + '" id="w-kod-ipucu" role="status">' + ikon(kd.tur === "tamam" ? "circle-check" : kd.tur === "bos" ? "circle-alert" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(kd.metin) + "</span></p></div>";
    };
    var govde;
    if (W.tur === "ekle") {
      $("a-pencere-baslik").textContent = "Ekipman ekle";
      govde = '<div class="a-form">' +
        A("tesis", "Müşteri / tesis", "", { zorunlu: true, genis: true, girdi: MK.secim({ id: "w-tesis", ad: "Tesis", deger: d.tesis, secenekler: MV.TESISLER.map(function (t) { return [t.id, MV.musteri(t.m).kisa + " / " + t.ad, t.il]; }), ipucu: "Tesis seçin", gecersiz: !!h.tesis, tanim: "w-tesis-ipucu" }) }) +
        kodAlani() +
        A("tur", "Ekipman türü", "", { zorunlu: true, girdi: MK.secim({ id: "w-tur", ad: "Ekipman türü", deger: d.tur, secenekler: MV.KATALOG.map(function (t) { return [t.k, t.ad, MV.bransAd(t.b)]; }), ipucu: "Tür seçin", gecersiz: !!h.tur, tanim: "w-tur-ipucu" }),
          ipucu: d.tur ? "Branş " + MV.bransAd(MV.tur(d.tur).b) + (MV.tur(d.tur).sablon ? "" : " · bu türün rapor şablonu yok") : "Branş türden gelir." }) +
        A("seri", "Seri no", d.seri, { sinif: "a-girdi-seri", ek: ' maxlength="30"' }) + A("konum", "Konum / kullanım yeri", d.konum, { ek: ' maxlength="60"' }) + "</div>";
    } else if (W.tur === "etiket") {
      $("a-pencere-baslik").textContent = W.e.kod + " · etiket bilgileri";
      govde = '<div class="a-form">' + A("marka", "Marka", d.marka, { ek: ' maxlength="40"' }) + A("model", "Model", d.model, { ek: ' maxlength="40"' }) +
        A("imal", "İmal yılı", d.imal, { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"', ipucu: "Ekipmanın imal yılındaki standart esas alınır (Ek-III 1.4.1)." }) +
        A("seri", "Seri no", d.seri, { sinif: "a-girdi-seri", ek: ' maxlength="30"' }) + A("konum", "Kullanım yeri", d.konum, { genis: true, ek: ' maxlength="60"' }) + "</div>";
    } else {
      $("a-pencere-baslik").textContent = W.e.kod + " · kodu değiştir";
      govde = '<p class="a-pencere-ozet"><b>' + W.e.kod + "</b> · " + kacis(MV.tur(W.e.tur).ad) + "<br>Eski kod geçmişte kalır ve yeniden verilmez; raporlar yeni koda bağlı kalır. Yalnız yönetici değiştirir.</p>" +
        '<div class="a-form">' + kodAlani() +
        '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="w-gerekce">Gerekçe <span class="a-zorunlu">zorunlu</span></label>' +
        '<textarea class="a-alan" id="w-gerekce" data-alan="gerekce" maxlength="300" aria-describedby="w-gerekce-ipucu"' + (h.gerekce ? ' aria-invalid="true"' : "") + ">" + kacis(d.gerekce) + "</textarea>" +
        '<p class="a-ipucu' + (h.gerekce ? " a-ipucu-uyari" : "") + '" id="w-gerekce-ipucu">' + (h.gerekce || "Ör. etiket yenilendi, kod yanlış okunmuştu.") + "</p></div></div>";
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: W.tur === "kod" ? "Kodu değiştir" : "Kaydet", ikon: "check" });
    if (odak) { var el = $(odak); if (el) { el.focus(); if (typeof imlec === "number" && el.setSelectionRange) el.setSelectionRange(imlec, imlec); } }
  }
  function pencereAc(tur, e) {
    W = { tur: tur, e: e || null, hata: {}, d: tur === "ekle" ? { tesis: q.tesis || "", kod: "", tur: "", seri: "", konum: "", imal: "" }
      : tur === "etiket" ? { marka: e.marka, model: e.model, imal: String(e.imal), seri: e.seri, konum: e.konum } : { kod: "", gerekce: "" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input, button, textarea"); if (ilk) ilk.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/yeni") return { v: "liste", pencere: "ekle" };
    if ((m = /^#\/e\/([A-Z0-9-]+)(\/kod)?$/.exec(h))) return { v: "ekipman", kod: m[1], pencere: m[2] ? "kod" : null };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), e = r.kod ? MV.ekipman(r.kod) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else ekipmanCiz(e);
    document.title = (r.v === "liste" ? "Ekipmanlar" : e ? e.kod + " · " + MV.tur(e.tur).ad : "Ekipman bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, e); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem, aktif = function () { return MV.ekipman(rota().kod); };
  X["ekipman-ac"] = function () { pencereAc("ekle"); };
  X["etiket-ac"] = function () { pencereAc("etiket", aktif()); };
  X["kod-ac"] = function () { pencereAc("kod", aktif()); };
  X["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    var d = W.d, e = W.e, hedef, ileti;
    if (W.tur === "ekle") {
      e = { kod: d.kod, tur: d.tur, tesis: d.tesis, konum: d.konum.trim() || "Konum yazılmadı", onceki: null, ilk: true, marka: "—", model: "—", imal: "—", seri: d.seri.trim() || "—" };
      MV.EKIPMAN.push(e); hedef = "#/e/" + e.kod; ileti = e.kod + " eklendi; ilk kontrolü planda yapılır.";
    } else if (W.tur === "etiket") {
      Object.assign(e, { marka: d.marka.trim(), model: d.model.trim(), imal: +d.imal || e.imal, seri: d.seri.trim(), konum: d.konum.trim() });
      hedef = "#/e/" + e.kod; ileti = "Etiket bilgileri kaydedildi; imzalı raporlar eski bilgiyi saklar.";
    } else {
      (e.eskiKod = e.eskiKod || []).push({ kod: e.kod, tarih: BUGUN, kim: "sy", gerekce: d.gerekce.trim() });
      e.kod = d.kod; hedef = "#/e/" + e.kod; ileti = "Kod değişti: " + e.eskiKod[e.eskiKod.length - 1].kod + " → " + e.kod + ".";
    }
    $("a-pencere").close();
    if (location.hash === hedef) goster(false); else location.hash = hedef;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) {
    var t = e.target, k = t.dataset && t.dataset.alan; if (!k || !W) return;
    if (k === "kod") { var ham = t.value, nor = MV.kodNormal(ham), yer = Math.max(0, t.selectionStart - (ham.length - nor.length)); W.d.kod = nor; delete W.hata.kod; pencereCiz("w-kod", yer); return; }
    W.d[k] = t.value;
  };
  MK.onSecim = function (id, deger) { if (!W) return; if (id === "w-tesis") W.d.tesis = deger; if (id === "w-tur") W.d.tur = deger; delete W.hata[id.slice(2)]; pencereCiz(); };
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "liste" ? "#/" : "#/e/" + r.kod); });

  MK.kabuk({ modul: 7, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici · Inspector" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("e");
  /* adresten gelen süzgeç (tesis / müşteri / tür sayfasındaki yüzden): seçiciye yazılır, kaldırılabilir */
  if (q.musteri) SZ.e.sec.musteri = q.musteri;
  if (q.tesis) { SZ.e.sec.tesis = q.tesis; SZ.e.sec.musteri = MV.tesis(q.tesis) ? MV.tesis(q.tesis).m : "tumu"; }
  if (q.tur) SZ.e.sec.tur = q.tur;
  MK.seciciCiz("e"); goster(false);
})();
