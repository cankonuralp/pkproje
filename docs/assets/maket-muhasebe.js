/* ══ probata MAKET M14 — Muhasebe (modül 18, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════════════════════════
   Kaynak: pkproje.md §3 (akış: "… inspector son imza → müşteriye açıldı → fatura → tahsilat → iş kapandı → arşiv"), §3.1 modül 18 (fatura,
   tahsilat, iş kapanışı), §3.2 madde 5 (her rapor teklif kalemine bağlanır; birim fiyat oradan), §7 (fatura / tahsilat).
   Ekranlar: işler (#/) · faturalar (#/faturalar) · iş sayfası (#/is/<proje no>: raporlar × birim fiyat, faturalar, geçmiş) · fatura sayfası
   (#/f/<no>: kalemler, KDV, tahsilatlar) · fatura kaydet penceresi (#/is/<no>/fatura) · tahsilat penceresi (#/f/<no>/tahsilat) ·
   giderler (#/giderler; 2026-09-27, reisim: "Giderleri ekle") · gider penceresi (#/giderler/yeni · #/g/<no> · iş sayfasından #/is/<no>/gider).
   Kullanıcı: Ayşe Demir (firma yöneticisi; rol × modül önerisinde muhasebe yalnız yöneticide — soru 33). e-Fatura / e-Arşiv firmanın kendi
   muhasebe programında kesilir, buraya numarası ve tarihi yazılır (VARSAYIM). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ, para = MV.para;
  var I = MV.ISLER, FT = MV.FATURALAR;
  var IS_DURUM = { gecikti: { ad: "Vadesi geçti", rozet: "a-rozet-red" }, hazir: { ad: "Faturaya hazır", rozet: "a-rozet-kabul" },
    tahsilat: { ad: "Tahsilat bekliyor", rozet: "a-rozet-bekliyor" }, rapor: { ad: "Rapor sürüyor", rozet: "a-rozet-notr" }, kapandi: { ad: "Kapandı", rozet: "a-rozet-tamam" } };
  var F_DURUM = { gecikti: { ad: "Vadesi geçti", rozet: "a-rozet-red" }, bekliyor: { ad: "Bekliyor", rozet: "a-rozet-bekliyor" },
    kismi: { ad: "Kısmi ödendi", rozet: "a-rozet-kabul" }, odendi: { ad: "Ödendi", rozet: "a-rozet-tamam" } };
  var YONTEM = ["Havale / EFT", "Çek", "Kredi kartı", "Nakit"];
  var oz = MV.isOzet, ft = MV.faturaTutar;
  var musteriSecici = function (l) { return { k: "musteri", ad: "Müşteri", secenek: function () {
    var m = l.map(function (x) { return x.m; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    return [["tumu", "Tümü"]].concat(m.map(function (id) { return [id, MV.musteri(id).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
  }, gecer: function (x, v) { return v === "tumu" || x.m === v; } }; };
  var vadeYaz = function (f) {
    var d = MV.faturaDurum(f), k = MK.gunFarki(MK.BUGUN, f.vade);
    return '<span><span class="a-tarih-gun">' + MK.tarihYaz(f.vade) + "</span>" + (d === "odendi" ? '<span class="a-tarih-saat">ödendi ' + MK.gunKisa(f.tahsilatlar[f.tahsilatlar.length - 1].tarih) + "</span>"
      : k < 0 ? '<span class="a-uyari-metin">' + -k + " gün geçti</span>" : '<span class="' + (k <= 7 ? "a-uyari-metin" : "a-tarih-saat") + '">' + k + " gün kaldı</span>") + "</span>";
  };
  var kalanYaz = function (n, gec) { return n > 0 ? '<span class="a-sayi' + (gec ? " a-uyari-metin" : "") + '">' + para(n) + "</span>" : '<span class="a-deger-yok">—</span>'; };

  /* ── İŞLER ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("i", { ad: "İşlerde ara", ipucu: "Proje no, müşteri, tesis", birim: "iş",
    cipler: ["gecikti", "hazir", "tahsilat", "rapor", "kapandi"].map(function (k) { return { k: k, ad: IS_DURUM[k].ad, grup: "durum", test: function (x) { return oz(x).durum === k; } }; }),
    seciciler: [musteriSecici(I)],
    metin: function (x) { return [x.no, MV.musteri(x.m).kisa, MV.musteri(x.m).unvan, MV.tesis(x.tesis).ad].concat(x.faturalar).join(" "); },
    imkansiz: "Bir iş aynı anda iki durumda olamaz" }, function () { isListeCiz(); });
  var IS_SUTUN = [
    { k: "no", baslik: "Proje no", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/is/' + x.no + '">' + x.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (x) { return "<span>" + kirp(MV.musteri(x.m).kisa) + kirp(MV.tesis(x.tesis).ad, "a-alt-satir") + "</span>"; } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 3, hucre: function (x) {
      var o = oz(x), fl = Object.keys(o.faturali).length;
      return '<span class="a-kart-etiket">Rapor</span><span><span class="a-sayi">' + o.imzali + " / " + o.toplam + ' imzalı</span><span class="a-alt-satir">' + fl + " faturalı</span></span>";
    } },
    { k: "tutar", baslik: "Raporlanan (KDV hariç)", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Raporlanan (KDV hariç)</span><span class="a-sayi">' + para(oz(x).raporlanan) + "</span>"; } },
    { k: "kalan", baslik: "Açık alacak", kart: "govde", sira: 5, hucre: function (x) { var o = oz(x); return '<span class="a-kart-etiket">Açık alacak</span>' + kalanYaz(o.kalan, o.durum === "gecikti"); } },
    /* 2026-09-27 (reisim: "kar hesaplanacak kar yüzdesi yazacak iş başına") */
    { k: "kar", baslik: "Kâr", kart: "govde", sira: 6, hucre: function (x) { return '<span class="a-kart-etiket">Kâr</span>' + karYaz(MV.isKarlilik(x)); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(IS_DURUM[oz(x).durum]); } }
  ];
  var yuzde = function (n) { return (n < 0 ? "−%" : "%") + Math.abs(n).toLocaleString("tr-TR", { maximumFractionDigits: 1 }); };
  var karYaz = function (k) { return '<span><span class="a-sayi' + (k.kar < 0 ? " a-uyari-metin" : "") + '">' + para(k.kar) + '</span><span class="a-alt-satir">' + yuzde(k.oran) + "</span></span>"; };
  function isListeCiz() {
    MK.listeCiz({ on: "i", kayitlar: I, sayacId: "a-sayac", listeId: "a-liste",
      /* 2026-09-26 (reisim: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun"): varsayılan sıra tarih, en yeni üstte */
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0; }); },
      bosVeri: { ikon: "wallet", baslik: "İş yok", metin: "Planın ilk raporu yazılınca iş burada görünür." },
      tablo: { baslik: "İşler", sinif: "a-tablo-is", sutunlar: IS_SUTUN, href: function (x) { return "#/is/" + x.no; } } });
  }

  /* ── FATURALAR ─────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("f", { ad: "Faturalarda ara", ipucu: "Fatura no, müşteri", birim: "fatura",
    cipler: ["gecikti", "bekliyor", "kismi", "odendi"].map(function (k) { return { k: k, ad: F_DURUM[k].ad, grup: "durum", test: function (f) { return MV.faturaDurum(f) === k; } }; }),
    seciciler: [musteriSecici(FT)],
    metin: function (f) { return [f.no, f.is, MV.musteri(f.m).kisa, MV.musteri(f.m).unvan].join(" "); },
    imkansiz: "Bir fatura aynı anda iki durumda olamaz" }, function () { faturaListeCiz(); });
  var F_SUTUN = [
    { k: "no", baslik: "Fatura no", kart: "ust", sira: 1, hucre: function (f) { return '<a class="a-no" href="#/f/' + f.no + '">' + f.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(f.tarih) + "</span>"; } },
    { k: "musteri", baslik: "Müşteri / iş", kart: "govde", sira: 2, hucre: function (f) { return "<span>" + kirp(MV.musteri(f.m).kisa) + kirp(f.is + " · " + MV.tesis(MV.isKaydi(f.is).tesis).ad, "a-alt-satir") + "</span>"; } },
    { k: "vade", baslik: "Vade", kart: "govde", sira: 3, hucre: function (f) { return '<span class="a-kart-etiket">Vade</span>' + vadeYaz(f); } },
    { k: "tutar", baslik: "Tutar (KDV dahil)", kart: "govde", sira: 4, hucre: function (f) { return '<span class="a-kart-etiket">Tutar (KDV dahil)</span><span class="a-sayi">' + para(ft(f).toplam) + "</span>"; } },
    { k: "kalan", baslik: "Kalan", kart: "govde", sira: 5, hucre: function (f) { return '<span class="a-kart-etiket">Kalan</span>' + kalanYaz(MV.faturaKalan(f), MV.faturaDurum(f) === "gecikti"); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (f) { return rozet(F_DURUM[MV.faturaDurum(f)]); } }
  ];
  function faturaListeCiz() {
    MK.listeCiz({ on: "f", kayitlar: FT, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0; }); },
      bosVeri: { ikon: "file-text", baslik: "Fatura yok", metin: "Faturaya hazır bir işin sayfasından “Fatura kaydet” ile eklenir." },
      tablo: { baslik: "Faturalar", sinif: "a-tablo-fatura", sutunlar: F_SUTUN, href: function (f) { return "#/f/" + f.no; } } });
  }
  /* listenin üstünde: vadesi geçen alacak ve faturaya hazır işler (yalnız ekranda; bildirim yok, anayasa 1.3) */
  function uyariCiz(on) {
    if (on === "g") { giderUyariCiz(); return; }
    var gec = FT.filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }), hazir = I.filter(function (x) { return oz(x).durum === "hazir"; });
    var top = gec.reduce(function (n, f) { return n + MV.faturaKalan(f); }, 0);
    $("a-uyari").innerHTML = gec.length || hazir.length ? '<div class="a-uyari-serit">' +
      (gec.length ? '<div class="a-serit a-serit-uyari">' + ikon("clock", "a-ikon-kucuk") + "<span><b>Vadesi geçen alacak:</b> " + gec.length + " fatura · " + para(top) + "</span>" +
        MK.tus({ eylem: "gecikenler", ad: "Faturalar", sinif: "a-tus-ikincil a-serit-tus" }) + "</div>" : "") +
      (hazir.length ? '<div class="a-serit a-serit-bilgi">' + ikon("file-check", "a-ikon-kucuk") + "<span><b>Faturaya hazır:</b> " + hazir.map(function (x) {
        return x.no + " · " + kacis(MV.musteri(x.m).kisa) + " (" + oz(x).hazir.length + " imzalı rapor)"; }).join(", ") + "</span>" +
        (hazir.length === 1 ? '<a class="a-tus a-tus-ikincil a-serit-tus" href="#/is/' + hazir[0].no + '">İş</a>' : MK.tus({ eylem: "hazirlar", ad: "İşler", sinif: "a-tus-ikincil a-serit-tus" })) + "</div>" : "") + "</div>" : "";
  }

  /* ── GİDERLER (2026-09-27, reisim: "Giderleri ekle") — fiş / fatura: tarih, tür, tutar (KDV dahil) + oran, belge (açılıp incelenir),
     isteğe bağlı iş ve personel. Belgesi olmayan gider kaydedilir, listede ve şeritte uyarı olarak görünür (engel değil). ─────────── */
  var GD = MV.GIDERLER, gTur = MV.giderTur, gKdv = MV.giderKdv, kr = function (n) { return Math.round(n * 100) / 100; };
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var giderSirala = function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : a.no < b.no ? 1 : -1; }); };
  var tekil = function (l) { return l.filter(function (v, i, a) { return v && a.indexOf(v) === i; }); };
  MK.suzgecTanimla("g", { ad: "Giderlerde ara", ipucu: "Gider no, iş, açıklama", birim: "gider",
    /* 2026-09-27 (reisim): masraf formu onay bekler → onaylanır (ödenecek) → ödendi */
    cipler: [
      { k: "bekliyor", ad: "Onay bekliyor", grup: "durum", test: function (g) { return g.durum === "bekliyor"; } },
      { k: "onaylandi", ad: "Ödenecek", grup: "durum", test: function (g) { return g.durum === "onaylandi"; } },
      { k: "belgesiz", ad: "Belgesi yok", test: function (g) { return !g.belge; } }
    ],
    seciciler: [
      { k: "bag", ad: "İş", secenek: function () { return [["tumu", "Tümü"], ["is", "İşe bağlı"], ["genel", "Genel"]]; },
        gecer: function (g, v) { return v === "tumu" || (v === "is") === !!g.is; } },
      { k: "tur", ad: "Tür", secenek: function () { return [["tumu", "Tümü"]].concat(MV.GIDER_TUR.map(function (t) { return [t[0], t[1]]; })); },
        gecer: function (g, v) { return v === "tumu" || g.tur === v; } },
      { k: "ay", ad: "Dönem", secenek: function () {
        return [["tumu", "Tümü"]].concat(tekil(GD.map(function (g) { return g.tarih.slice(0, 7); })).sort().reverse().map(function (a) { return [a, AYLAR[+a.slice(5, 7) - 1] + " " + a.slice(0, 4)]; }));
      }, gecer: function (g, v) { return v === "tumu" || g.tarih.slice(0, 7) === v; } },
      { k: "kisi", ad: "Personel", secenek: function () {
        return [["tumu", "Tümü"]].concat(tekil(GD.map(function (g) { return g.kisi; })).map(function (id) { return [id, MV.kisi(id).ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (g, v) { return v === "tumu" || g.kisi === v; } }
    ],
    metin: function (g) { var x = g.is && MV.isKaydi(g.is); return [g.no, gTur(g.tur).ad, g.aciklama, g.is || "", x ? MV.musteri(x.m).kisa : "", g.kisi ? MV.kisi(g.kisi).ad : ""].join(" "); },
    imkansiz: "Bir gider aynı anda iki durumda olamaz" }, function () { giderListeCiz(); });
  /* satırın adresi: iş sayfasındaysa pencere iş sayfasının üstünde açılır */
  var gHref = function (g) { var r = rota(); return r.v === "is" ? "#/is/" + r.no + "/gider/" + g.no : "#/g/" + g.no; };
  var G_NO = { k: "no", baslik: "Gider no", kart: "ust", sira: 1, hucre: function (g) { return '<a class="a-no" href="' + gHref(g) + '">' + g.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(g.tarih) + "</span>"; } };
  var G_TUR = { k: "tur", baslik: "Tür / açıklama", kart: "govde", sira: 2, hucre: function (g) { return "<span>" + kacis(gTur(g.tur).ad) + (g.aciklama ? kirp(g.aciklama, "a-alt-satir") : "") + "</span>"; } };
  var G_TUTAR = { k: "tutar", baslik: "Tutar (KDV dahil)", kart: "govde", sira: 4, hucre: function (g) {
    return '<span class="a-kart-etiket">Tutar (KDV dahil)</span><span><span class="a-sayi">' + para(g.tutar) + '</span><span class="a-alt-satir">KDV %' + g.oran + " · " + para(gKdv(g).kdv) + "</span></span>";
  } };
  var G_BELGE = { k: "belge", baslik: "Belge", kart: "eylem", sira: 9, hucre: function (g) {
    return '<div class="a-eylem"><div class="a-eylem-tuslar">' + (g.belge ? MK.pdfTus(g.belge) : '<span class="a-uyari-metin">Belge yok</span>') + "</div></div>";
  } };
  var G_DURUM = { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (g) {
    return rozet(MV.GIDER_DURUM[g.durum]) + '<span class="a-alt-satir">' + (g.durum === "odendi" && g.odeme ? MK.tarihYaz(g.odeme) : g.kaynak === "form" ? "masraf formu" : "muhasebe") + "</span>";
  } };
  var G_SUTUN = [G_NO, G_TUR,
    { k: "bag", baslik: "İş / personel", kart: "govde", sira: 3, hucre: function (g) {
      var x = g.is && MV.isKaydi(g.is), ad = g.kisi ? MV.kisi(g.kisi).ad : "";
      return "<span>" + (x ? '<a class="a-no" href="#/is/' + x.no + '">' + x.no + "</a>" + kirp(MV.musteri(x.m).kisa + (ad ? " · " + ad : ""), "a-alt-satir") : "Genel" + (ad ? kirp(ad, "a-alt-satir") : "")) + "</span>";
    } }, G_TUTAR, G_DURUM, G_BELGE];
  var GI_SUTUN = [G_NO, G_TUR,
    { k: "kisi", baslik: "Personel", kart: "govde", sira: 3, hucre: function (g) { return '<span class="a-kart-etiket">Personel</span>' + (g.kisi ? kacis(MV.kisi(g.kisi).ad) : '<span class="a-deger-yok">—</span>'); } },
    G_TUTAR, G_DURUM, G_BELGE];
  var giderToplam = function (l) {
    var t = l.reduce(function (n, g) { var k = gKdv(g); n.haric += k.haric; n.kdv += k.kdv; n.top += g.tutar; return n; }, { haric: 0, kdv: 0, top: 0 });
    return bilgi("KDV hariç", para(kr(t.haric))) + bilgi("KDV", para(kr(t.kdv))) + bilgi("Toplam", "<b>" + para(kr(t.top)) + "</b>");
  };
  function giderListeCiz() {
    var l = MK.listeCiz({ on: "g", kayitlar: GD, sayacId: "a-sayac", listeId: "a-liste", sirala: giderSirala,
      bosVeri: { ikon: "receipt", baslik: "Gider yok", metin: "“Gider ekle” ile fişi ya da faturası eklenir." },
      tablo: { baslik: "Giderler", sinif: "a-tablo-gider", sutunlar: G_SUTUN, href: gHref } });
    $("a-liste-alt").innerHTML = l.length ? '<dl class="a-bilgi a-bolum-serit">' + giderToplam(l) + "</dl>" : "";
  }
  var toplamTL = function (l) { return para(kr(l.reduce(function (n, g) { return n + g.tutar; }, 0))); };
  function giderUyariCiz() {
    var o = GD.filter(function (g) { return g.durum === "bekliyor"; }), b = GD.filter(function (g) { return !g.belge; });
    $("a-uyari").innerHTML = o.length || b.length ? '<div class="a-uyari-serit">' +
      (o.length ? '<div class="a-serit a-serit-bilgi">' + ikon("receipt", "a-ikon-kucuk") + "<span><b>Onay bekleyen masraf:</b> " + o.length + " · " + toplamTL(o) + "</span>" +
        MK.tus({ eylem: "g-cip", ad: "Göster", sinif: "a-tus-ikincil a-serit-tus", veri: { secilecek: "bekliyor" } }) + "</div>" : "") +
      (b.length ? '<div class="a-serit a-serit-uyari">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span><b>Belgesi yok:</b> " + b.length + " gider · " + toplamTL(b) + "</span>" +
        MK.tus({ eylem: "g-cip", ad: "Göster", sinif: "a-tus-ikincil a-serit-tus", veri: { secilecek: "belgesiz" } }) + "</div>" : "") + "</div>" : "";
  }

  /* ── KÂRLILIK (2026-09-27; hesap MV.isKarlilik, dağıtım yöntemi VARSAYIM — reisim ayrıntıyı verecek) ─────────────────────── */
  var sayiTr = function (n) { return n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }); };
  var KAR_SUTUN = [
    { k: "ad", baslik: "Kalem", kart: "ust", sira: 1, hucre: function (s) { return s.toplam ? "<b>" + s.ad + "</b>" : kacis(s.ad); } },
    { k: "ayrinti", baslik: "Ayrıntı", kart: "govde", sira: 2, hucre: function (s) { return '<span class="a-alt-inline">' + s.ayrinti + "</span>"; } },
    { k: "tutar", baslik: "Tutar", kart: "govde", sira: 3, hucre: function (s) {
      return '<span class="a-kart-etiket">Tutar</span><span class="a-sayi' + (s.tutar < 0 && s.toplam ? " a-uyari-metin" : "") + '">' + (s.eksi ? "− " : "") + para(s.tutar) + "</span>"; } }
  ];
  function karlilikHtml(k) {
    var satir = [
      { ad: "Gelir", ayrinti: k.rapor + " rapor · raporlanan, KDV hariç", tutar: k.gelir },
      { ad: "İşe bağlı masraflar", ayrinti: "KDV hariç, reddedilen hariç", tutar: k.dogrudan, eksi: true },
      { ad: "Inspector maliyeti", ayrinti: k.kisiler.length ? k.kisiler.map(function (x) { return kacis(MV.kisi(x.kisi).ad) + " " + sayiTr(x.gun) + " gün × " + para(x.gunluk); }).join(" · ") : "rapor yok", tutar: k.personel, eksi: true },
      { ad: "Genel gider payı", ayrinti: sayiTr(k.gun) + " kişi-gün × " + para(k.gunPay) + " (araç, ofis, vergi, genel masraf, diğer personel)", tutar: k.genel, eksi: true },
      { ad: "Kâr", ayrinti: yuzde(k.oran) + " · KDV hariç", tutar: k.kar, toplam: true }
    ];
    return '<section class="a-bolum" aria-labelledby="a-b-kar"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kar">Kârlılık</h2><span class="a-sayac"><b>' + yuzde(k.oran) + "</b> kâr</span></div>" +
      (k.tahmini ? '<div class="a-uyari-serit">' + MK.serit("bilgi", "history", MV.ayAd(k.ay) + " bordroları yüklenmedi; inspector maliyeti son bordrodan tahmini.") + "</div>" : "") +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Kârlılık", sinif: "a-tablo-karlilik", sutunlar: KAR_SUTUN, kayitlar: satir }) + "</div></section>";
  }
  /* GELİR-GİDER (2026-09-27, reisim: "gelir gidere göre bilançoda olacak"): ay seçilir; o ayın gelir (denetlenen işlerin raporlananı), maaşlar
     (bordro işverene maliyeti), masraflar ve sabit giderler; işlerin kârı. Bilanço (varlık / borç) firmanın muhasebe programında (VARSAYIM). */
  var GG = { ay: MK.BUGUN.slice(0, 7) };
  var ggAylar = function () { var l = [], d = new Date(MK.BUGUN.slice(0, 7) + "-01T12:00:00"); for (var i = 0; i < 13; i++) { l.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() - 1); } return l; };
  var GG_SUTUN = [
    { k: "no", baslik: "Proje no", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/is/' + x.no + '">' + x.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (x) { return "<span>" + kirp(MV.musteri(x.m).kisa) + kirp(MV.tesis(x.tesis).ad, "a-alt-satir") + "</span>"; } },
    { k: "gelir", baslik: "Gelir", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Gelir</span><span class="a-sayi">' + para(MV.isKarlilik(x).gelir) + "</span>"; } },
    { k: "gider", baslik: "Gider", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Gider</span><span class="a-sayi">' + para(MV.isKarlilik(x).gider) + "</span>"; } },
    { k: "kar", baslik: "Kâr", kart: "govde", sira: 5, hucre: function (x) { return '<span class="a-kart-etiket">Kâr</span>' + karYaz(MV.isKarlilik(x)); } }
  ];
  function ggCiz() {
    var d = MV.ayGelirGider(GG.ay), am = d.am;
    $("a-sayac").innerHTML = "<b>" + MV.ayAd(GG.ay) + "</b>";
    $("a-uyari").innerHTML = am.bordroVar ? "" : '<div class="a-uyari-serit">' + MK.serit("bilgi", "history", MV.ayAd(GG.ay) + " bordroları yüklenmedi; maaşlar son bordrodan tahmini.") + "</div>";
    $("a-suzgec-kap").innerHTML = '<div class="a-form a-gg-donem">' + MK.alan({ id: "gg-ay", etiket: "Dönem", girdi: MK.secim({ id: "gg-ay", ad: "Dönem", deger: GG.ay, secenekler: ggAylar().map(function (a) { return [a, MV.ayAd(a)]; }) }) }) + "</div>";
    var satir = [
      { ad: "Gelir", ayrinti: d.isler.length + " iş · raporlanan, KDV hariç", tutar: d.gelir },
      { ad: "Maaşlar", ayrinti: am.kisi + " kişi · bordro, işverene maliyet" + (am.bordroVar ? "" : " · tahmini"), tutar: kr(am.maasIns + am.maasDiger), eksi: true },
      { ad: "İşe bağlı masraflar", ayrinti: "KDV hariç", tutar: am.masraf, eksi: true },
      { ad: "Genel masraflar", ayrinti: "işe bağlı olmayan, KDV hariç", tutar: am.genel, eksi: true }
    ].concat(MV.SABIT_GIDER.map(function (x) { return { ad: x.ad, ayrinti: "sabit gider" + (x.not ? " · " + kacis(x.not) : ""), tutar: x.aylik, eksi: true }; }))
      .concat([{ ad: "Kâr", ayrinti: d.oran === null ? "gelir yok" : yuzde(d.oran), tutar: d.kar, toplam: true }]);
    $("a-gg").innerHTML = '<div class="a-yuzler">' + yuz("Gelir", "file-text", para(d.gelir), "KDV hariç · " + d.isler.length + " iş") + yuz("Gider", "receipt", para(d.gider), "maaş, masraf, sabit") +
        yuz("Kâr", "chart-column", para(d.kar), d.oran === null ? "gelir yok" : yuzde(d.oran), d.kar < 0) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-gg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gg">Gelir ve giderler</h2></div>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Gelir ve giderler", sinif: "a-tablo-karlilik", sutunlar: KAR_SUTUN, kayitlar: satir }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-ggis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ggis">İşlerin kârı</h2><span class="a-sayac"><b>' + d.isler.length + "</b> iş</span></div>" +
        (d.isler.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "İşlerin kârı", sinif: "a-tablo-iskar", sutunlar: GG_SUTUN, kayitlar: d.isler, href: function (x) { return "#/is/" + x.no; } }) + "</div>"
          : '<p class="a-bos-satir">Bu ay denetlenen iş yok.</p>') + "</section>";
  }

  /* ── İŞ SAYFASI ─────────────────────────────────────────────────────────────────────────────────────── */
  var AKTIF = null;
  MK.suzgecTanimla("r", { ad: "Raporlarda ara", ipucu: "Rapor no, ekipman", birim: "rapor", sayfa: 20,
    cipler: [
      { k: "hazir", ad: "Faturaya hazır", grup: "durum", test: function (r) { return r.durum === "imzali" && !oz(AKTIF).faturali[r.no]; } },
      { k: "faturali", ad: "Faturalandı", grup: "durum", test: function (r) { return !!oz(AKTIF).faturali[r.no]; } },
      { k: "surec", ad: "İmza sürecinde", grup: "durum", test: function (r) { return r.durum !== "imzali"; } }
    ],
    seciciler: [],
    metin: function (r) { var e = MV.ekipman(r.kod); return [r.no, e.kod, MV.tur(e.tur).ad, oz(AKTIF).faturali[r.no] || ""].join(" "); },
    imkansiz: "Bir rapor aynı anda iki durumda olamaz" }, function () { raporListeCiz(); });
  var R_SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<a class="a-no" href="' + MK.adres(14, "#/r/" + r.no) + '">' + r.no + "</a>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = MV.ekipman(r.kod); return '<span><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad, "a-alt-satir") + "</span>"; } },
    { k: "fiyat", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: function (r) {
      var f = MV.raporFiyat(r);
      return '<span class="a-kart-etiket">Birim fiyat</span><span><span class="a-sayi">' + para(f.fiyat) + "</span>" + (f.kaynak === "teklif" ? '<span class="a-alt-satir">teklif ' + f.teklif.no + "</span>"
        : f.kaynak === "disi" ? '<span class="a-alt-satir a-uyari-metin">teklif dışı · fiyat listesi</span>' : '<span class="a-alt-satir">fiyat listesi</span>') + "</span>";
    } },
    { k: "fatura", baslik: "Fatura", kart: "govde", sira: 4, hucre: function (r) {
      var no = oz(AKTIF).faturali[r.no];
      return '<span class="a-kart-etiket">Fatura</span>' + (no ? '<a class="a-no" href="#/f/' + no + '">' + no + "</a>" : r.durum === "imzali" ? '<span class="a-uyari-metin">Faturalanmadı</span>' : '<span class="a-deger-yok">—</span>');
    } },
    { k: "durum", baslik: "Rapor durumu", kart: "rozet", sira: 1, hucre: function (r) { return rozet(MV.raporDurum(r)); } }
  ];
  function raporListeCiz() {
    MK.listeCiz({ on: "r", kayitlar: AKTIF.raporlar.map(MV.rapor), sayacId: "a-r-sayac", listeId: "a-r-liste", sayfaId: "a-r-sayfa",
      bosVeri: { ikon: "file-text", baslik: "Rapor yok", metin: "Planın ilk raporu yazılınca burada görünür." },
      tablo: { baslik: "İşin raporları", sinif: "a-tablo-israpor", sutunlar: R_SUTUN } });
  }
  var FI_SUTUN = F_SUTUN.filter(function (s) { return s.k !== "musteri"; });
  var yuz = function (ad, ik, sayi, not, uyari) { return '<div class="a-yuz"><span class="a-yuz-ust">' + ikon(ik, "a-ikon-kucuk") + ad + '</span><span class="a-yuz-sayi">' + sayi + "</span>" + (not ? '<span class="a-yuz-not' + (uyari ? " a-yuz-uyari" : "") + '">' + not + "</span>" : "") + "</div>"; };
  function gecmisHtml(l) {
    return '<ol class="a-gecmis">' + l.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0; }).map(function (g) {
      return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(g[0]) + '</span><span class="a-gecmis-ne"><b>' + g[1] + "</b>" + (g[2] ? ' <span class="a-gecmis-rol">' + kacis(g[2]) + "</span>" : "") + "</span></li>";
    }).join("") + "</ol>";
  }
  function isCiz(x) {
    if (!x) { yok("İş bulunamadı", "Bu adreste iş yok.", "#/", "İşlere dön"); return; }
    var m = MV.musteri(x.m), ts = MV.tesis(x.tesis), o = oz(x), soz = MV.tesisSozlesmesi(x.tesis, x.tarih), acik = x.faturalar.map(MV.fatura).filter(function (f) { return MV.faturaKalan(f) > 0; });
    var teklif = x.raporlar.length ? MV.raporFiyat(MV.rapor(x.raporlar[0])).teklif : null;
    var gl = giderSirala(MV.isGiderleri(x.no)), k = MV.isKarlilik(x);
    var imzaSon = x.raporlar.map(MV.rapor).filter(function (r) { return r.imza; }).reduce(function (s, r) { return r.imza.zaman > s ? r.imza.zaman : s; }, "");
    var gecmis = [[x.tarih, "Denetim", x.ekip.map(function (k) { return MV.kisi(k).ad; }).join(", ")]];
    if (imzaSon) gecmis.push([imzaSon.slice(0, 10), o.imzali === o.toplam ? "Raporların hepsi imzalandı, müşteriye açıldı" : o.imzali + " rapor imzalandı, müşteriye açıldı", o.imzali + " / " + o.toplam]);
    x.faturalar.map(MV.fatura).forEach(function (f) {
      gecmis.push([f.tarih, "Fatura kaydedildi · " + f.no, para(ft(f).toplam) + " · " + MV.kisi(f.kaydeden).ad]);
      f.tahsilatlar.forEach(function (t) { gecmis.push([t.tarih, "Tahsilat · " + para(t.tutar), t.yontem]); });
    });
    if (o.kapandi) gecmis.push([o.kapandi, "İş kapandı", "arşiv"]);
    $("a-nesne").innerHTML = MK.kirinti([["Muhasebe", "#/"], [x.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + x.no + "</h1>" + rozet(IS_DURUM[o.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(3, "#/m/" + m.id) + '">' + kacis(m.kisa) + "</a> · " + kacis(ts.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + (x.pid ? '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/plan/" + x.pid) + '">' + ikon("calendar-check", "a-ikon-kucuk") + "Plan</a>" : "") +
          (acik.length ? '<a class="a-tus a-tus-ikincil" href="#/f/' + acik[0].no + '/tahsilat">' + ikon("wallet", "a-ikon-kucuk") + "Tahsilat ekle</a>" : "") +
          (o.hazir.length && hazirIsler(x).length > 1 ? '<a class="a-tus a-tus-ikincil" href="#/is/' + x.no + '/toplu-fatura">' + ikon("file-text", "a-ikon-kucuk") + "Toplu fatura (" + hazirIsler(x).length + " iş)</a>" : "") +
          (o.hazir.length ? '<a class="a-tus a-tus-birincil" href="#/is/' + x.no + '/fatura">' + ikon("file-plus", "a-ikon-kucuk") + "Fatura kaydet</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (o.durum === "gecikti" ? MK.serit("uyari", "clock", acik.filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }).map(function (f) {
          return f.no + " vadesi " + -MK.gunFarki(MK.BUGUN, f.vade) + " gün önce geçti; kalan " + para(MV.faturaKalan(f)) + "."; }).join(" ")) : "") +
        (o.hazir.length ? MK.serit("bilgi", "file-check", o.hazir.length + " rapor faturaya hazır" + (o.surec.length ? " · " + o.surec.length + " rapor imza sürecinde" : "")) : "") +
        (o.durum === "rapor" && !o.hazir.length ? MK.serit("bilgi", "history", x.pdurum === "tamam" ? o.surec.length + " rapor imza sürecinde" : "Plan " + MV.PLAN_DURUM[x.pdurum].ad.toLocaleLowerCase("tr")) : "") +
        (o.durum === "kapandi" ? MK.serit("onay", "circle-check", "İş kapandı " + MK.tarihYaz(o.kapandi) + ": bütün raporlar faturalandı ve tahsil edildi. Kayıt 5 yıl arşivde kalır.") : "") + "</div>" +
      '<div class="a-yuzler">' + yuz("Raporlanan", "file-text", para(o.raporlanan), "KDV hariç · " + o.toplam + " rapor") +
        yuz("Faturalanan", "file-check", para(o.faturalanan), "KDV dahil · " + x.faturalar.length + " fatura") +
        yuz("Tahsil edilen", "wallet", para(o.tahsil), "") + yuz("Açık alacak", "clock", para(o.kalan), o.durum === "gecikti" ? "vadesi geçti" : "", o.durum === "gecikti") +
        yuz("Kâr", "chart-column", yuzde(k.oran), para(k.kar) + " · KDV hariç", k.kar < 0) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-is"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-is">İş</h2></div><dl class="a-bilgi">' +
        bilgi("Denetim", MK.tarihYaz(x.tarih) + '<span class="a-alt-satir">' + x.ekip.map(function (k) { return MV.kisi(k).ad; }).join(", ") + "</span>") +
        bilgi("Birim fiyat", teklif ? '<a class="a-no" href="' + MK.adres(11, "#/t/" + teklif.no) + '">' + teklif.no + '</a><span class="a-alt-satir">kabul edilen teklif</span>' : "Fiyat listesi" + '<span class="a-alt-satir">teklif kaydı yok</span>') +
        bilgi("İş sözleşmesi", soz ? '<a class="a-no" href="' + MK.adres("is-sozlesmesi", "#/s/" + soz.no) + '">' + soz.no + "</a>" : '<span class="a-deger-yok">Kayıt yok</span>') +
        bilgi("Ödeme vadesi", (soz ? soz.vade : 30) + " gün" + '<span class="a-alt-satir">' + (soz ? "sözleşmeden" : "varsayılan") + "</span>") + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-rapor"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-rapor">Raporlar</h2><span class="a-sayac" id="a-r-sayac"></span></div>' +
        MK.suzgecHtml("r") + '<div class="a-liste-kap" id="a-r-liste"></div><div id="a-r-sayfa"></div></section>' +
      '<section class="a-bolum" aria-labelledby="a-b-fatura"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-fatura">Faturalar</h2><span class="a-sayac"><b>' + x.faturalar.length + "</b> fatura</span></div>" +
        (x.faturalar.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "İşin faturaları", sinif: "a-tablo-isfatura", sutunlar: FI_SUTUN, kayitlar: x.faturalar.map(MV.fatura), href: function (f) { return "#/f/" + f.no; } }) + "</div>"
          : '<p class="a-bos-satir">Henüz fatura yok.</p>') + "</section>" +
      /* 2026-09-27: işin gideri ve kârı (raporlanan − gider, KDV hariç) */
      '<section class="a-bolum" aria-labelledby="a-b-gider"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gider">Giderler</h2><span class="a-sayac"><b>' + gl.length + "</b> gider</span>" +
        '<a class="a-tus a-tus-ikincil a-bolum-tus" href="#/is/' + x.no + '/gider">' + ikon("plus", "a-ikon-kucuk") + "Gider ekle</a></div>" +
        (gl.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "İşin giderleri", sinif: "a-tablo-isgider", sutunlar: GI_SUTUN, kayitlar: gl, href: gHref }) + "</div>" : '<p class="a-bos-satir">Henüz gider yok.</p>') + "</section>" +
      karlilikHtml(k) +
      '<section class="a-bolum" aria-labelledby="a-b-gecmis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gecmis">Geçmiş</h2></div>' + gecmisHtml(gecmis) + "</section>";
    MK.suzgecKur("r");
  }

  /* ── FATURA SAYFASI ─────────────────────────────────────────────────────────────────────────────────── */
  var KALEM = [
    { k: "tur", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: function (k) { return kirp(MV.tur(k.tur).ad) + (k.disi ? '<span class="a-alt-satir a-uyari-metin">teklif dışı · fiyat listesi</span>' : ""); } },
    { k: "adet", baslik: "Adet", kart: "govde", sira: 2, hucre: function (k) { return '<span class="a-kart-etiket">Adet</span><span class="a-sayi">' + k.adet + "</span>"; } },
    { k: "fiyat", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: function (k) { return '<span class="a-kart-etiket">Birim fiyat</span>' + para(k.fiyat); } },
    { k: "tutar", baslik: "Tutar", kart: "govde", sira: 4, hucre: function (k) { return '<span class="a-kart-etiket">Tutar</span><span class="a-sayi">' + para(k.adet * k.fiyat) + "</span>"; } }
  ];
  var T_SUTUN = [
    { k: "tarih", baslik: "Tarih", kart: "ust", sira: 1, hucre: function (t) { return MK.tarihYaz(t.tarih); } },
    { k: "tutar", baslik: "Tutar", kart: "govde", sira: 2, hucre: function (t) { return '<span class="a-kart-etiket">Tutar</span><span class="a-sayi">' + para(t.tutar) + "</span>"; } },
    { k: "yontem", baslik: "Yöntem", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">Yöntem</span><span>' + kacis(t.yontem) + (t.not ? kirp(t.not, "a-alt-satir") : "") + "</span>"; } },
    { k: "kaydeden", baslik: "Kaydeden", kart: "govde", sira: 4, hucre: function (t) { return '<span class="a-kart-etiket">Kaydeden</span>' + kacis(MV.kisi(t.kaydeden).ad); } }
  ];
  var toplamlar = function (t) { return bilgi("Ara toplam", para(t.ara)) + bilgi("KDV %" + MV.KDV, para(t.kdv)) + bilgi("Genel toplam", "<b>" + para(t.toplam) + "</b>"); };
  function faturaCiz(f) {
    if (!f) { yok("Fatura bulunamadı", "Bu adreste fatura yok.", "#/faturalar", "Faturalara dön"); return; }
    var m = MV.musteri(f.m), x = MV.isKaydi(f.is), t = ft(f), d = MV.faturaDurum(f), kalan = MV.faturaKalan(f), soz = MV.tesisSozlesmesi(x.tesis, x.tarih);
    $("a-nesne").innerHTML = MK.kirinti([["Muhasebe", "#/"], ["Faturalar", "#/faturalar"], [f.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + f.no + "</h1>" + rozet(F_DURUM[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(m.unvan) + ' · <a class="a-baglanti" href="#/is/' + x.no + '">' + x.no + "</a></span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "Fatura özeti (PDF)", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (kalan > 0 ? '<a class="a-tus a-tus-birincil" href="#/f/' + f.no + '/tahsilat">' + ikon("wallet", "a-ikon-kucuk") + "Tahsilat ekle</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (d === "gecikti" ? MK.serit("uyari", "clock", "Vade " + MK.tarihYaz(f.vade) + " tarihinde geçti (" + -MK.gunFarki(MK.BUGUN, f.vade) + " gün); kalan " + para(kalan) + ".") : "") +
        (d === "odendi" ? MK.serit("onay", "circle-check", "Ödendi " + MK.tarihYaz(f.tahsilatlar[f.tahsilatlar.length - 1].tarih) + ".") : "") + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-fbilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-fbilgi">Fatura</h2></div><dl class="a-bilgi">' +
        bilgi("Alıcı", kacis(m.unvan) + '<span class="a-alt-satir">' + kacis(m.vd) + " VD · " + m.vno + "</span>", true) +
        bilgi("Fatura tarihi", MK.tarihYaz(f.tarih)) + bilgi("Vade", MK.tarihYaz(f.vade) + '<span class="a-alt-satir">' + f.vadeGun + " gün · " + (soz ? "sözleşme " + soz.no : "varsayılan") + "</span>") +
        (f.isler ? bilgi("İşler", f.isler.map(function (n) { return '<a class="a-no" href="#/is/' + n + '">' + n + "</a>"; }).join(", ") + '<span class="a-alt-satir">' + f.raporlar.length + " rapor</span>")
          : bilgi("İş", '<a class="a-no" href="#/is/' + x.no + '">' + x.no + '</a><span class="a-alt-satir">' + kacis(MV.tesis(x.tesis).ad) + " · " + f.raporlar.length + " rapor</span>")) +
        bilgi("Kaydeden", kacis(MV.kisi(f.kaydeden).ad)) + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kalem"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kalem">Kalemler</h2><span class="a-sayac"><b>' + MV.faturaKalemleri(f.raporlar).length + "</b> kalem</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Fatura kalemleri", sinif: "a-tablo-kalem a-tablo-fkalem", sutunlar: KALEM, kayitlar: MV.faturaKalemleri(f.raporlar) }) + "</div>" +
        '<dl class="a-bilgi a-bolum-serit">' + toplamlar(t) + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-tahsil"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tahsil">Tahsilatlar</h2><span class="a-sayac"><b>' + f.tahsilatlar.length + "</b> tahsilat</span></div>" +
        (f.tahsilatlar.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Tahsilatlar", sinif: "a-tablo-tahsilat", sutunlar: T_SUTUN, kayitlar: f.tahsilatlar.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }) }) + "</div>" : '<p class="a-bos-satir">Henüz tahsilat yok.</p>') +
        '<dl class="a-bilgi a-bolum-serit">' + bilgi("Tahsil edilen", para(MV.tahsil(f))) + bilgi("Kalan", "<b>" + para(kalan) + "</b>") + "</dl></section>";
  }
  function yok(baslik, metin, geri, geriAd) {
    $("a-nesne").innerHTML = MK.kirinti([["Muhasebe", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">' + baslik + "</h1>" +
      MK.bos({ ikon: "circle-alert", baslik: baslik, metin: metin, eylem: '<a class="a-tus a-tus-ikincil" href="' + geri + '">' + ikon("arrow-left", "a-ikon-kucuk") + geriAd + "</a>" });
  }

  /* ── PENCERELER: fatura kaydet · tahsilat ekle ──────────────────────────────────────────────────────── */
  var W = null;
  var tarihIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s).trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  var sayi = function (v) { var s = String(v).trim(); return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(s) ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : NaN; };
  var yaz = function (n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var bugun = MK.BUGUN.slice(8, 10) + "." + MK.BUGUN.slice(5, 7) + "." + MK.BUGUN.slice(0, 4);
  /* 136 (2026-09-26): fatura iş başına; istenirse müşteri başına toplu (aynı müşterinin faturaya hazır bütün işleri) */
  var hazirIsler = function (x) { return I.filter(function (y) { return y.m === x.m && oz(y).hazir.length; }); };
  var pencereRaporlari = function () { return W.isler.reduce(function (l, y) { return l.concat(oz(y).hazir.map(function (r) { return r.no; })); }, []); };
  function faturaPencere(odak) {
    var x = W.is, h = W.hata, soz = MV.tesisSozlesmesi(x.tesis, x.tarih), vg = soz ? soz.vade : 30, fi = tarihIso(W.tarih);
    var gecici = { raporlar: pencereRaporlari() }, o = { hazir: gecici.raporlar, surec: W.isler.reduce(function (l, y) { return l.concat(oz(y).surec); }, []) };
    var vade = fi ? (function () { var d = new Date(fi + "T12:00:00"); d.setDate(d.getDate() + vg); return d.toISOString().slice(0, 10); })() : null;
    $("a-pencere-baslik").textContent = W.isler.length > 1 ? "Toplu fatura · " + MV.musteri(x.m).kisa + " · " + W.isler.length + " iş" : "Fatura kaydet · " + x.no;
    $("a-pencere-govde").innerHTML = '<p class="a-bolum-aciklama"><b>' + o.hazir.length + "</b> imzalı rapor</p>" +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Faturaya girecek kalemler", sinif: "a-tablo-kalem a-tablo-fkalem", sutunlar: KALEM, kayitlar: MV.faturaKalemleri(gecici.raporlar) }) + "</div>" +
      '<dl class="a-bilgi a-bolum-serit">' + toplamlar(ft(gecici)) + "</dl>" +
      (o.surec.length ? '<div class="a-bolum-serit">' + MK.serit("uyari", "history", o.surec.length + " rapor imza sürecinde; bu faturaya girmez, imzalanınca sonraki faturaya kalır.") + "</div>" : "") +
      '<div class="a-form a-bolum-serit">' +
        MK.alan({ id: "w-no", etiket: "Fatura no", zorunlu: true, hata: h.no, girdi: MK.girdi({ id: "w-no", alan: "no", deger: W.no, ek: ' maxlength="16" spellcheck="false"', hata: h.no }) }) +
        MK.alan({ id: "w-tarih", etiket: "Fatura tarihi", zorunlu: true, hata: h.tarih, ipucu: vade ? "Vade " + MK.tarihYaz(vade) + " (" + vg + " gün, " + (soz ? "sözleşme " + soz.no : "varsayılan") + ")" : "GG.AA.YYYY",
          girdi: MK.girdi({ id: "w-tarih", alan: "tarih", deger: W.tarih, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.tarih }) }) + "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "fatura-kaydet", ad: "Faturayı kaydet", ikon: "check" });
    if (odak) $(odak).focus();
  }
  function tahsilatPencere(odak) {
    var f = W.f, h = W.hata, kalan = MV.faturaKalan(f);
    $("a-pencere-baslik").textContent = "Tahsilat ekle · " + f.no;
    $("a-pencere-govde").innerHTML = '<dl class="a-bilgi">' + bilgi("Müşteri", kacis(MV.musteri(f.m).kisa)) + bilgi("Fatura tutarı", para(ft(f).toplam)) + bilgi("Kalan", "<b>" + para(kalan) + "</b>") + "</dl>" +
      '<div class="a-form a-bolum-serit">' +
        MK.alan({ id: "w-tarih", etiket: "Tahsilat tarihi", zorunlu: true, hata: h.tarih, girdi: MK.girdi({ id: "w-tarih", alan: "tarih", deger: W.tarih, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.tarih }) }) +
        MK.alan({ id: "w-tutar", etiket: "Tutar (TL)", zorunlu: true, hata: h.tutar, ipucu: "Kısmi tahsilat olabilir; en çok kalan kadar", girdi: MK.girdi({ id: "w-tutar", alan: "tutar", deger: W.tutar, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.tutar }) }) +
        MK.alan({ id: "w-yontem", etiket: "Yöntem", zorunlu: true, girdi: MK.secim({ id: "w-yontem", ad: "Yöntem", deger: W.yontem, secenekler: YONTEM.map(function (y) { return [y, y]; }), ipucu: "Yöntem seçin" }) }) +
        MK.alan({ id: "w-not", etiket: "Açıklama", genis: true, ipucu: "İsteğe bağlı; ör. çek no, dekont açıklaması", girdi: MK.girdi({ id: "w-not", alan: "not", deger: W.not, ek: ' maxlength="120"' }) }) + "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "tahsilat-kaydet", ad: "Tahsilatı kaydet", ikon: "check" });
    if (odak) $(odak).focus();
  }
  /* gider penceresi (ekle / düzenle): tarih takvimle, tür seçilince KDV oranı türün varsayılanı; tutar yazılınca KDV canlı */
  var kdvMetin = function () { var n = sayi(W.tutar); if (!(n > 0)) return ""; var k = gKdv({ tutar: n, oran: +W.oran }); return "KDV " + para(k.kdv) + " · KDV hariç " + para(k.haric); };
  function kdvGuncelle() {
    var p = $("w-oran-ipucu"), m = kdvMetin();
    if (!m) { if (p) p.remove(); return; }
    if (!p) { p = document.createElement("p"); p.className = "a-ipucu"; p.id = "w-oran-ipucu"; $("w-oran").closest(".a-alan-grup").appendChild(p); }
    p.textContent = m;
  }
  function giderPencere(odak) {
    var h = W.hata, g = W.g;
    $("a-pencere-baslik").textContent = g ? "Gider · " + g.no : "Gider ekle" + (W.sabitIs ? " · " + W.sabitIs : "");
    /* reddetme: gerekçe yazılır (en az 5 karakter), inspector plan içinde görür */
    if (W.redKip) {
      $("a-pencere-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + g.no + "</b> · " + kacis(gTur(g.tur).ad) + " · " + para(g.tutar) + " · " + kacis(MV.kisi(g.kisi).ad) + "</p>" +
        '<div class="a-form">' + MK.alan({ id: "w-gerekce", etiket: "Red gerekçesi", zorunlu: true, genis: true, hata: h.gerekce,
          girdi: '<textarea class="a-alan a-alan-ince" id="w-gerekce" data-alan="gerekce" maxlength="200" aria-describedby="w-gerekce-ipucu"' + (h.gerekce ? ' aria-invalid="true"' : "") + ">" + kacis(W.gerekce) + "</textarea>" }) + "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "gider-red-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "gider-reddet", ad: "Reddet", ikon: "ban" });
      $(odak || "w-gerekce").focus(); return;
    }
    $("a-pencere-govde").innerHTML =
      (g ? '<p class="a-pencere-ozet">' + rozet(MV.GIDER_DURUM[g.durum]) + " " + (g.kaynak === "form" ? "Masraf formu · " + kacis(MV.kisi(g.kisi).ad) + " · gönderildi " + MK.zamanYaz(g.gonderildi) : "Muhasebe kaydı") +
        (g.durum === "odendi" && g.odeme ? " · ödendi " + MK.tarihYaz(g.odeme) : "") + (g.red ? '<br><span class="a-uyari-metin">Red gerekçesi: ' + kacis(g.red) + "</span>" : "") + "</p>" : "") +
      '<div class="a-form">' +
      MK.alan({ id: "w-tarih", etiket: "Tarih", zorunlu: true, hata: h.tarih, girdi: MK.zaman({ id: "w-tarih", ad: "Gider tarihi", deger: W.tarih }) }) +
      MK.alan({ id: "w-tur", etiket: "Tür", zorunlu: true, hata: h.tur, girdi: MK.secim({ id: "w-tur", ad: "Tür", deger: W.tur, gecersiz: !!h.tur, ipucu: "Tür seçin",
        secenekler: MV.GIDER_TUR.map(function (t) { return [t[0], t[1]]; }) }) }) +
      MK.alan({ id: "w-tutar", etiket: "Tutar (KDV dahil)", zorunlu: true, hata: h.tutar, girdi: MK.girdi({ id: "w-tutar", alan: "tutar", deger: W.tutar, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.tutar }) }) +
      MK.alan({ id: "w-oran", etiket: "KDV oranı", sonuc: kdvMetin(), girdi: MK.secim({ id: "w-oran", ad: "KDV oranı", deger: String(W.oran), secenekler: MV.KDV_ORAN.map(function (o) { return [String(o), "%" + o]; }) }) }) +
      MK.alan({ id: "w-aciklama", etiket: "Açıklama", genis: true, girdi: MK.girdi({ id: "w-aciklama", alan: "aciklama", deger: W.aciklama, ek: ' maxlength="120"' }) }) +
      MK.alan({ id: "w-is", etiket: "İş", girdi: MK.secim({ id: "w-is", ad: "İş", deger: W.is, secenekler: [["", "Genel gider"]].concat(I.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }).map(function (x) {
        return [x.no, x.no + " · " + MV.musteri(x.m).kisa, MK.tarihYaz(x.tarih)]; })) }) }) +
      MK.alan({ id: "w-kisi", etiket: "Personel", girdi: MK.secim({ id: "w-kisi", ad: "Personel", deger: W.kisi, secenekler: [["", "Seçilmedi"]].concat(MV.PERSONEL.filter(function (p) { return p.durum === "etkin"; })
        .map(function (p) { return [p.id, p.ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); })) }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Belge</p><div class="a-dosya">' + (W.belge ? MK.dosyaAlan({ ad: W.belge, degistir: "gider-belge", sil: "gider-belge-sil" })
        : MK.tus({ eylem: "gider-belge", ad: "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div></div>" +
      /* elle eklenen gider: firma ödediyse "Ödendi", sonra ödenecekse "Ödenecek" */
      (g ? "" : MK.alan({ id: "w-odeme", etiket: "Ödeme", girdi: MK.secim({ id: "w-odeme", ad: "Ödeme", deger: W.odeme, secenekler: [["odendi", "Ödendi"], ["onaylandi", "Ödenecek"]] }) })) + "</div>";
    /* yazılan ama geçersiz tarih yeniden çizimde kaybolmaz */
    if (W.tarihYazi) { $("w-tarih").value = W.tarihYazi; $("w-tarih").setAttribute("aria-invalid", "true"); }
    var d = g && g.durum;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
      /* 35. tur 162: masraf formunun son hâli PDF · e-posta (talep edene) */
      (g && g.kaynak === "form" ? MK.tus({ eylem: "gider-pdf", ad: "PDF · e-posta", ikon: "file-text", sinif: "a-tus-ikincil" }) : "") +
      (d === "bekliyor" ? MK.tus({ eylem: "gider-red-ac", ad: "Reddet", ikon: "ban", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "gider-kaydet", ad: "Onayla", ikon: "check", veri: { sonra: "onaylandi" } })
        : d === "onaylandi" ? MK.tus({ eylem: "gider-kaydet", ad: "Kaydet", ikon: "check", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "gider-kaydet", ad: "Ödendi", ikon: "wallet", veri: { sonra: "odendi" } })
        : MK.tus({ eylem: "gider-kaydet", ad: g ? "Kaydet" : "Gideri kaydet", ikon: "check" }));
    if (odak) $(odak).focus();
  }
  function giderAc(g, isNo) {
    W = { tip: "gider", g: g || null, sabitIs: g ? null : isNo || null, tarih: g ? g.tarih : MK.BUGUN, tarihYazi: "", tur: g ? g.tur : "", tutar: g ? yaz(g.tutar) : "", oran: g ? g.oran : 20,
      aciklama: g ? g.aciklama : "", is: g ? g.is || "" : isNo || "", kisi: g ? g.kisi || "" : "", belge: g ? g.belge : "", odeme: "odendi", redKip: false, gerekce: "", hata: {} };
    giderPencere(); if (!$("a-pencere").open) $("a-pencere").showModal();
    $("w-tur").focus();
  }
  function pencereAc(tip, nesne) {
    W = tip === "fatura" || tip === "toplu" ? { tip: "fatura", is: nesne, isler: tip === "toplu" ? hazirIsler(nesne) : [nesne], no: "", tarih: bugun, hata: {} } : { tip: tip, f: nesne, tarih: bugun, tutar: yaz(MV.faturaKalan(nesne)), yontem: YONTEM[0], not: "", hata: {} };
    (W.tip === "fatura" ? faturaPencere : tahsilatPencere)(); if (!$("a-pencere").open) $("a-pencere").showModal();
    $(W.tip === "fatura" ? "w-no" : "w-tutar").focus();
  }
  var X = MK.eylem;
  X["fatura-kaydet"] = function () {
    var x = W.is, h = {}, no = W.no.trim().toLocaleUpperCase("en"), fi = tarihIso(W.tarih);
    if (!no) h.no = "Fatura no yazılmalı.";
    else if (!/^[A-Z0-9]{3}20\d{2}\d{9}$/.test(no)) h.no = "3 harf ya da rakam + yıl + 9 hane (16 karakter).";
    else if (MV.fatura(no)) h.no = no + " zaten kayıtlı.";
    if (!fi) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    else if (fi > MK.BUGUN) h.tarih = "İleri tarihli fatura kaydedilmez.";
    else if (fi < x.tarih) h.tarih = "Denetimden (" + MK.tarihYaz(x.tarih) + ") önce olamaz.";
    W.hata = h; var hk = Object.keys(h);
    if (hk.length) { faturaPencere("w-" + hk[0]); return; }
    var soz = MV.tesisSozlesmesi(x.tesis, x.tarih), vg = soz ? soz.vade : 30, v = new Date(fi + "T12:00:00"); v.setDate(v.getDate() + vg);
    var f = { no: no, is: x.no, isler: W.isler.length > 1 ? W.isler.map(function (y) { return y.no; }) : null, m: x.m, tarih: fi, vadeGun: vg, vade: v.toISOString().slice(0, 10), raporlar: pencereRaporlari(), kaydeden: "ad", tahsilatlar: [] };
    FT.push(f); W.isler.forEach(function (y) { y.faturalar.push(f.no); }); $("a-pencere").close(); MK.suzgecSifirla("r"); isCiz(x);
    MK.bildir(f.no + " kaydedildi: " + f.raporlar.length + " rapor, " + para(ft(f).toplam) + " (KDV dahil).");
  };
  X["tahsilat-kaydet"] = function () {
    var f = W.f, h = {}, fi = tarihIso(W.tarih), n = sayi(W.tutar), kalan = MV.faturaKalan(f);
    if (!fi) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    else if (fi > MK.BUGUN) h.tarih = "İleri tarihli tahsilat kaydedilmez.";
    else if (fi < f.tarih) h.tarih = "Fatura tarihinden (" + MK.tarihYaz(f.tarih) + ") önce olamaz.";
    if (!(n > 0)) h.tutar = "Tutar sıfırdan büyük olmalı (ör. 1.250,00).";
    else if (n > kalan + 0.001) h.tutar = "Kalan " + para(kalan) + "; fazlası kaydedilmez.";
    W.hata = h; var hk = Object.keys(h);
    if (hk.length) { tahsilatPencere("w-" + hk[0]); return; }
    f.tahsilatlar.push({ tarih: fi, tutar: Math.round(n * 100) / 100, yontem: W.yontem, not: W.not.trim(), kaydeden: "ad" });
    var x = MV.isKaydi(f.is), o = oz(x); $("a-pencere").close(); faturaCiz(f);
    MK.bildir(para(n) + " tahsilat kaydedildi" + (MV.faturaKalan(f) <= 0 ? "; fatura ödendi" + (o.durum === "kapandi" ? ", " + x.no + " kapandı." : ".") : "; kalan " + para(MV.faturaKalan(f)) + "."));
  };
  X["gider-kaydet"] = function (el) {
    var sonra = el && el.dataset.sonra, h = {}, yazi = $("w-tarih").value, fi = tarihIso(yazi), n = sayi(W.tutar);
    if (!fi) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    else if (fi > MK.BUGUN) h.tarih = "İleri tarihli gider kaydedilmez.";
    if (!W.tur) h.tur = "Tür seçilmeli.";
    if (!(n > 0)) h.tutar = "Tutar sıfırdan büyük olmalı (ör. 1.250,00).";
    W.hata = h; W.tarihYazi = fi ? "" : yazi; var hk = Object.keys(h);
    if (hk.length) { giderPencere("w-" + hk[0]); return; }
    /* 2026-09-29 (V3): personelin masraf formu onaylanırken onaylayan firmanın yöntemiyle (mobil imza / e-imza) imzalar */
    if (sonra === "onaylandi" && W.g && W.g.kaynak === "form" && !W.imza) {
      MK.imzaAl({ belge: W.g.no + " masraf formu", imzacilar: [MV.kisi("ad").ad], tamam: function (im) { if (!W) return; W.imza = im; X["gider-kaydet"](el); } });
      return;
    }
    var yeni = !W.g, g = W.g || { no: MV.giderNo(fi), kaydeden: "ad", kaynak: "muhasebe", gonderildi: MK.simdi(), durum: W.odeme, onaylayan: "ad", odeme: W.odeme === "odendi" ? fi : null };
    g.tarih = fi; g.tur = W.tur; g.tutar = kr(n); g.oran = +W.oran; g.aciklama = W.aciklama.trim(); g.is = W.is || null; g.kisi = W.kisi || null; g.belge = W.belge;
    if (sonra === "onaylandi") { g.durum = "onaylandi"; g.onaylayan = "ad"; g.karar = MK.simdi(); if (W.imza) g.onayImza = W.imza; }
    if (sonra === "odendi") { g.durum = "odendi"; g.odeme = MK.BUGUN; }
    if (yeni) GD.push(g);
    var r = rota(); $("a-pencere").close();
    if (r.v === "is") isCiz(MV.isKaydi(r.no)); else { history.replaceState(null, "", "#/giderler"); uyariCiz("g"); MK.suzgecKur("g"); }
    MK.bildir(g.no + (sonra === "onaylandi" ? " onaylandı; ödenecek: " : sonra === "odendi" ? " ödendi: " : yeni ? " kaydedildi: " : " güncellendi: ") + para(g.tutar) + " (KDV dahil)" +
      (g.is ? ", " + g.is : "") + (g.belge ? "." : "; belge eklenmedi."));
  };
  /* EXCEL (reisim 2026-09-27: "otel vb örnek excel atarım inport export yine buradada olacak"): dışa aktarım süzülen listeyi alır; içe
     aktarımda satırlar denetlenir, geçerliler "Muhasebe" kaynağıyla girer. Sütunlar reisim'in örnek Excel'i gelince ona göre (VARSAYIM). */
  var belgeTablo = function (bas, satirlar) {
    return '<table class="a-belge-tablo"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (r) { return "<tr>" + r.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  };
  function excelAc(baslik, govde, alt) {
    $("a-pencere-baslik").textContent = baslik; $("a-pencere-govde").innerHTML = govde; $("a-pencere-alt").innerHTML = alt;
    if (!$("a-pencere").open) $("a-pencere").showModal(); $("a-pencere-govde").scrollTop = 0;
  }
  X["gider-excel-disa"] = function () {
    var l = giderSirala(MK.taban("g", GD).filter(function (g) { return MK.cipGecer("g", g); }));
    W = { tip: "excel" };
    excelAc("Excel'e aktar · Giderler", '<p class="a-pencere-ozet"><b>' + l.length + " gider</b> · giderler-" + MK.BUGUN.slice(0, 7) + ".xlsx · " + toplamTL(l) + "</p>" +
      '<div class="a-excel-kap">' + belgeTablo(["Gider", "Tutar · durum"], l.map(function (g) {
        return ['<span class="a-kod">' + g.no + "</span> " + kacis(gTur(g.tur).ad) + '<span class="a-alt-satir">' + MK.tarihYaz(g.tarih) + (g.is ? " · " + g.is : " · Genel") + "</span>",
          para(g.tutar) + '<span class="a-alt-satir">' + MV.GIDER_DURUM[g.durum].ad + "</span>"]; })) + "</div>",
      MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "gider-excel-indir", ad: "İndir", ikon: "download" }));
    $("a-pencere-alt").querySelector(".a-tus-birincil").focus({ preventScroll: true });
  };
  X["gider-excel-indir"] = function () {
    var l = giderSirala(MK.taban("g", GD).filter(function (g) { return MK.cipGecer("g", g); }));
    MK.indir("giderler-" + MK.BUGUN.slice(0, 7) + ".xlsx", MK.xlsx("Giderler", [["Gider no", "Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "KDV", "KDV hariç", "Açıklama", "Proje no", "Personel", "Durum", "Ödeme tarihi", "Belge"]]
      .concat(l.map(function (g) { var k = gKdv(g); return [g.no, MK.tarihYaz(g.tarih), gTur(g.tur).ad, g.tutar, g.oran, k.kdv, k.haric, g.aciklama, g.is || "", g.kisi ? MV.kisi(g.kisi).ad : "",
        MV.GIDER_DURUM[g.durum].ad, g.odeme ? MK.tarihYaz(g.odeme) : "", g.belge || ""]; }))));
  };
  function excelIceCiz() {
    var ok = W.satirlar.filter(function (x) { return x.ok; });
    excelAc("Excel'den yükle · Giderler", '<p class="a-pencere-ozet">Sütunlar: Tarih · Tür · Tutar (KDV dahil) · KDV oranı · Açıklama · Proje no. Her satır denetlenir, yalnız geçerli satırlar girer.</p>' +
      '<div class="a-dosya-sec">' + MK.tus({ eylem: "gider-excel-sablon", ad: "Şablonu indir", ikon: "file-spreadsheet", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "gider-excel-sec", ad: W.dosya ? "Başka dosya seç" : "Dosya seç", ikon: "upload", sinif: "a-tus-ikincil" }) +
        '<span class="a-dosya-ad">' + (W.dosya ? kacis(W.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
      (W.dosya ? '<div class="a-excel-kap">' + belgeTablo(["Satır", "Gider", "Durum"], W.satirlar.map(function (x, i) {
        return [String(i + 2), kacis(x.tur) + " · " + kacis(x.tutarYazi) + '<span class="a-alt-satir">' + kacis(x.tarihYazi) + " · " + kacis(x.aciklama) + "</span>",
          x.ok ? rozet({ ad: "Eklenecek", rozet: "a-rozet-tamam" }) : '<span class="a-uyari-metin a-hata-metin">' + kacis(x.neden) + "</span>"]; })) + "</div>" : ""),
      MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "gider-excel-yukle", ad: "Yükle" + (W.dosya ? " (" + ok.length + ")" : ""), ikon: "upload", kapali: !W.dosya || !ok.length }));
  }
  X["gider-excel-ice"] = function () { W = { tip: "excel", dosya: "", satirlar: [] }; excelIceCiz(); document.querySelector('#a-pencere [data-eylem="gider-excel-sec"]').focus(); };
  X["gider-excel-sablon"] = function () { MK.indir("gider-yukleme-sablonu.xlsx", MK.xlsx("Giderler", [["Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "Açıklama", "Proje no"], ["20.09.2026", "Konaklama", 3200, 10, "Otel, iki gece", "P-0926-025"]])); };
  /* maket: dosya penceresi yerine örnek dosya (uydurma satırlar); denetim formdakiyle aynı kural */
  /* Excel hücresi sayı olarak gelebilir ("1450.5"); yazıyla gelen Türkçe biçim ("1.450,50") de okunur. Oran "20", "%20" ya da "0,2" */
  var tutarOku = function (v) { var t = String(v || "").trim(); return /^\d+(\.\d+)?$/.test(t) && !/^\d{1,3}\.\d{3}$/.test(t) ? parseFloat(t) : sayi(t); };
  var oranOku = function (v) { var t = String(v == null ? "" : v).replace("%", "").replace(",", ".").trim(); if (t === "") return 20; var n = parseFloat(t); return n > 0 && n < 1 ? Math.round(n * 100) : n; };
  var giderSatirlari = function (ham) {
    if (ham.length && /tarih/i.test(ham[0][0] || "")) ham = ham.slice(1);
    return ham.map(function (h) {
      var tarihYazi = MK.excelTarih(h[0] || ""), t = MV.GIDER_TUR.filter(function (x) { return MK.tr(x[1]) === MK.tr(h[1] || ""); })[0], fi = tarihIso(tarihYazi), n = tutarOku(h[2]), oran = oranOku(h[3]);
      var neden = !t ? "Tür bulunamadı, atlanır" : !fi ? "Tarih geçersiz, atlanır" : fi > MK.BUGUN ? "İleri tarih, atlanır" : !(n > 0) ? "Tutar geçersiz, atlanır" :
        MV.KDV_ORAN.indexOf(oran) < 0 ? "KDV oranı geçersiz, atlanır" : h[5] && !MV.isKaydi(h[5]) ? "Proje no bulunamadı, atlanır" : "";
      return { tarihYazi: tarihYazi, tur: h[1] || "", tutarYazi: n > 0 ? yaz(n) : String(h[2] || ""), aciklama: h[4] || "", t: t, fi: fi, n: n, oran: oran, is: h[5] || null, ok: !neden, neden: neden };
    });
  };
  X["gider-excel-sec"] = function () {
    MK.dosyaSec({ kabul: ".xlsx,.csv", ornek: "giderler-eylul.xlsx" }, function (ad, f) {
      var bitir = function (ham) { W.dosya = ad; W.satirlar = giderSatirlari(ham); excelIceCiz(); var y = document.querySelector('#a-pencere [data-eylem="gider-excel-yukle"]'); if (y && !y.disabled) y.focus({ preventScroll: true }); };
      if (!f) { bitir([["20.09.2026", "Konaklama", "3.200,00", "10", "Otel, iki gece", "P-0926-025"], ["22.09.2026", "Yakıt", "1.450,00", "20", "Araç 2", ""],
        ["22.09.2026", "Kırtasiye", "180,00", "20", "Dosya ve kalem", ""], ["30.09.2026", "Yol", "95,00", "20", "Köprü geçişi", ""]]); return; }
      MK.tabloOku(f).then(bitir).catch(function () { MK.bildir(ad + " okunamadı; .xlsx ya da .csv seçin."); });
    });
  };
  X["gider-excel-yukle"] = function () {
    var ok = W.satirlar.filter(function (x) { return x.ok; }), atla = W.satirlar.length - ok.length;
    ok.forEach(function (x) {
      GD.push({ no: MV.giderNo(x.fi), tarih: x.fi, tur: x.t[0], tutar: kr(x.n), oran: x.oran, is: x.is, kisi: null, aciklama: x.aciklama, belge: "", kaynak: "muhasebe",
        gonderildi: MK.simdi(), durum: "odendi", odeme: x.fi, onaylayan: "ad", kaydeden: "ad" });
    });
    $("a-pencere").close(); uyariCiz("g"); MK.suzgecKur("g");
    MK.bildir(ok.length + " gider eklendi" + (atla ? "; " + atla + " satır atlandı." : "."));
  };
  X["gider-pdf"] = function () { var g = W.g; MB.talepPdfAc({ tip: "masraf", x: g, kime: [MV.kisi(g.kisi)], gonderen: MV.kisi("ad") }); };
  X["gider-red-ac"] = function () { W.redKip = true; W.hata = {}; giderPencere(); };
  X["gider-red-vazgec"] = function () { W.redKip = false; W.hata = {}; giderPencere("w-tur"); };
  X["gider-reddet"] = function () {
    if (W.gerekce.trim().length < 5) { W.hata = { gerekce: "Gerekçe en az 5 karakter; inspector plan içinde görür." }; giderPencere(); return; }
    var g = W.g, r = rota(); g.durum = "red"; g.red = W.gerekce.trim(); g.onaylayan = "ad";
    $("a-pencere").close();
    if (r.v === "is") isCiz(MV.isKaydi(r.no)); else { history.replaceState(null, "", "#/giderler"); uyariCiz("g"); MK.suzgecKur("g"); }
    MK.bildir(g.no + " reddedildi; gerekçe inspector'ın plan içinde görünür.");
  };
  X["gider-belge"] = function () {
    MK.dosyaSec({ kabul: "image/*,.pdf", enCokMB: 10, ornek: "fis-" + (W.tarih || MK.BUGUN).replace(/-/g, "") + "-" + (W.tur || "gider") + ".pdf" }, function (ad) {
      if (!W || W.tip !== "gider") return; W.belge = ad; giderPencere(); document.querySelector('#a-pencere [data-eylem="gider-belge"]').focus();
    });
  };
  X["gider-belge-sil"] = function () { if (!W || W.tip !== "gider") return; W.belge = ""; giderPencere(); document.querySelector('#a-pencere [data-eylem="gider-belge"]').focus(); };
  X["g-cip"] = function (el) { MK.suzgecSifirla("g"); SZ.g.secili = [el.dataset.secilecek]; MK.suzgecKur("g"); };
  X["gecikenler"] = function () { MK.suzgecSifirla("f"); SZ.f.secili = ["gecikti"]; location.hash = "#/faturalar"; };
  X["hazirlar"] = function () { MK.suzgecSifirla("i"); SZ.i.secili = ["hazir"]; if (location.hash === "#/" || location.hash === "") goster(false); else location.hash = "#/"; };
  /* fatura e-Fatura programında kesilir; burada fatura özeti (kalemler, KDV, tahsilat) yazdırılır / PDF olur */
  X["pdf"] = function () { var n = $("a-nesne"); MK.yazdir(n.querySelector("h1").textContent + " · fatura özeti", [].map.call(n.querySelectorAll(".a-nesne-bas, section.a-bolum"), function (e) { return e.outerHTML; }).join("")); };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) { W[k] = e.target.value; if (W.tip === "gider" && k === "tutar") kdvGuncelle(); } };
  MK.onZaman = function (id, d) { if (W && W.tip === "gider" && id === "w-tarih") { W.tarih = d; W.tarihYazi = ""; } };
  MK.onSecim = function (id, deger) {
    if (id === "gg-ay") { GG.ay = deger; ggCiz(); return; }
    if (!W) return;
    if (W.tip === "gider") {
      if (id === "w-tur") { W.tur = deger; W.oran = gTur(deger).kdv; delete W.hata.tur; }   /* tür seçilince oran türün varsayılanı; sonra değiştirilebilir */
      else if (id === "w-oran") W.oran = +deger;
      else if (id === "w-is") W.is = deger;
      else if (id === "w-kisi") W.kisi = deger;
      else if (id === "w-odeme") W.odeme = deger;
      giderPencere(id); return;
    }
    if (id === "w-yontem") { W.yontem = deger; tahsilatPencere(id); }
  };
  $("a-pencere").addEventListener("close", function () { if ($("a-pencere").open) return; W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "is" ? "#/is/" + r.no : r.v === "giderler" ? "#/giderler" : "#/f/" + r.no); });

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/faturalar") return { v: "faturalar" };
    if (h === "#/gelir-gider") return { v: "gelirgider" };
    if (h === "#/giderler" || h === "#/giderler/yeni") return { v: "giderler", pencere: h === "#/giderler/yeni" };
    if ((m = /^#\/g\/(G-\d{4}-\d{3})$/.exec(h))) return { v: "giderler", pencere: true, gno: m[1] };
    if ((m = /^#\/is\/(P-\d{4}-\d{3})(\/fatura|\/toplu-fatura|\/gider(?:\/(G-\d{4}-\d{3}))?)?$/.exec(h)))
      return { v: "is", no: m[1], pencere: !!m[2], toplu: m[2] === "/toplu-fatura", gider: !!m[2] && m[2].indexOf("/gider") === 0, gno: m[3] };
    if ((m = /^#\/f\/([A-Z0-9]+)(\/tahsilat)?$/.exec(h))) return { v: "fatura", no: m[1], pencere: !!m[2] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), liste = r.v === "liste" || r.v === "faturalar" || r.v === "giderler" || r.v === "gelirgider";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    $("a-gg").hidden = r.v !== "gelirgider"; $("a-liste").hidden = r.v === "gelirgider";
    if (r.v === "gelirgider") {
      ["a-sekme-is", "a-sekme-fatura", "a-sekme-gider"].forEach(function (id) { $(id).removeAttribute("aria-current"); }); $("a-sekme-gg").setAttribute("aria-current", "page");
      $("a-gider-tuslar").hidden = true; $("a-liste-alt").innerHTML = ""; if ($("a-pencere").open) $("a-pencere").close(); ggCiz();
    } else if (liste) {
      var on = r.v === "liste" ? "i" : r.v === "faturalar" ? "f" : "g";
      /* müşteri sayfasındaki "Açık alacak" yüzü → o müşterinin faturaları */
      var mq = /[?&]musteri=(m\d+)/.exec(location.hash); if (on !== "g" && mq && MV.musteri(mq[1])) { MK.suzgecSifirla(on); SZ[on].sec.musteri = mq[1]; }
      ["a-sekme-is", "a-sekme-fatura", "a-sekme-gider", "a-sekme-gg"].forEach(function (id) { $(id).removeAttribute("aria-current"); });
      $({ i: "a-sekme-is", f: "a-sekme-fatura", g: "a-sekme-gider" }[on]).setAttribute("aria-current", "page");
      $("a-gider-tuslar").hidden = on !== "g"; if (on !== "g") $("a-liste-alt").innerHTML = "";
      uyariCiz(on); $("a-suzgec-kap").innerHTML = MK.suzgecHtml(on); MK.suzgecKur(on);
      var g = r.gno && MV.gider(r.gno);
      if (r.pencere && (!r.gno || g)) { if (!W) giderAc(g); }
      else { if (r.pencere) history.replaceState(null, "", "#/giderler"); if ($("a-pencere").open) $("a-pencere").close(); }
    } else if (r.v === "is") {
      var x = MV.isKaydi(r.no); if (x !== AKTIF) { AKTIF = x; MK.suzgecSifirla("r"); }
      isCiz(x);
      if (r.gider && x && (!r.gno || MV.gider(r.gno))) { if (!W) giderAc(r.gno ? MV.gider(r.gno) : null, x.no); }
      else if (r.pencere && !r.gider && x && oz(x).hazir.length) { if (!W) pencereAc(r.toplu ? "toplu" : "fatura", x); }
      else { if (r.pencere) history.replaceState(null, "", "#/is/" + r.no); if ($("a-pencere").open) $("a-pencere").close(); }
    } else {
      var f = MV.fatura(r.no); faturaCiz(f);
      if (r.pencere && f && MV.faturaKalan(f) > 0) { if (!W) pencereAc("tahsilat", f); }
      else { if (r.pencere) history.replaceState(null, "", "#/f/" + r.no); if ($("a-pencere").open) $("a-pencere").close(); }
    }
    document.title = (r.v === "is" || r.v === "fatura" ? r.no : r.v === "faturalar" ? "Faturalar" : r.v === "giderler" ? "Giderler" : r.v === "gelirgider" ? "Gelir-gider" : "Muhasebe") + " · probata maket";
    if (odakla && !(r.pencere && W)) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;

  MK.kabuk({ modul: 18, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
