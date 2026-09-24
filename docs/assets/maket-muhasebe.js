/* ══ probata MAKET M14 — Muhasebe (modül 18, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════════════════════════
   Kaynak: pkproje.md §3 (akış: "… inspector son imza → müşteriye açıldı → fatura → tahsilat → iş kapandı → arşiv"), §3.1 modül 18 (fatura,
   tahsilat, iş kapanışı), §3.2 madde 5 (her rapor teklif kalemine bağlanır; birim fiyat oradan), §7 (fatura / tahsilat).
   Ekranlar: işler (#/) · faturalar (#/faturalar) · iş sayfası (#/is/<proje no>: raporlar × birim fiyat, faturalar, geçmiş) · fatura sayfası
   (#/f/<no>: kalemler, KDV, tahsilatlar) · fatura kaydet penceresi (#/is/<no>/fatura) · tahsilat penceresi (#/f/<no>/tahsilat).
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
  var IS_SIRA = { gecikti: 0, hazir: 1, tahsilat: 2, rapor: 3, kapandi: 4 }, F_SIRA = { gecikti: 0, bekliyor: 1, kismi: 2, odendi: 3 };
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
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(IS_DURUM[oz(x).durum]); } }
  ];
  function isListeCiz() {
    MK.listeCiz({ on: "i", kayitlar: I, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return IS_SIRA[oz(a).durum] - IS_SIRA[oz(b).durum] || (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0); }); },
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
      sirala: function (l) { return l.slice().sort(function (a, b) { return F_SIRA[MV.faturaDurum(a)] - F_SIRA[MV.faturaDurum(b)] || (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0); }); },
      bosVeri: { ikon: "file-text", baslik: "Fatura yok", metin: "Faturaya hazır bir işin sayfasından “Fatura kaydet” ile eklenir." },
      tablo: { baslik: "Faturalar", sinif: "a-tablo-fatura", sutunlar: F_SUTUN, href: function (f) { return "#/f/" + f.no; } } });
  }
  /* listenin üstünde: vadesi geçen alacak ve faturaya hazır işler (yalnız ekranda; bildirim yok, anayasa 1.3) */
  function uyariCiz() {
    var gec = FT.filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }), hazir = I.filter(function (x) { return oz(x).durum === "hazir"; });
    var top = gec.reduce(function (n, f) { return n + MV.faturaKalan(f); }, 0);
    $("a-uyari").innerHTML = gec.length || hazir.length ? '<div class="a-uyari-serit">' +
      (gec.length ? '<div class="a-serit a-serit-uyari">' + ikon("clock", "a-ikon-kucuk") + "<span><b>Vadesi geçen alacak:</b> " + gec.length + " fatura · " + para(top) + "</span>" +
        MK.tus({ eylem: "gecikenler", ad: "Faturalar", sinif: "a-tus-ikincil a-serit-tus" }) + "</div>" : "") +
      (hazir.length ? '<div class="a-serit a-serit-bilgi">' + ikon("file-check", "a-ikon-kucuk") + "<span><b>Faturaya hazır:</b> " + hazir.map(function (x) {
        return x.no + " · " + kacis(MV.musteri(x.m).kisa) + " (" + oz(x).hazir.length + " imzalı rapor)"; }).join(", ") + "</span>" +
        (hazir.length === 1 ? '<a class="a-tus a-tus-ikincil a-serit-tus" href="#/is/' + hazir[0].no + '">İş</a>' : MK.tus({ eylem: "hazirlar", ad: "İşler", sinif: "a-tus-ikincil a-serit-tus" })) + "</div>" : "") + "</div>" : "";
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
          (o.hazir.length ? '<a class="a-tus a-tus-birincil" href="#/is/' + x.no + '/fatura">' + ikon("file-plus", "a-ikon-kucuk") + "Fatura kaydet</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (o.durum === "gecikti" ? MK.serit("uyari", "clock", acik.filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }).map(function (f) {
          return f.no + " vadesi " + -MK.gunFarki(MK.BUGUN, f.vade) + " gün önce geçti; kalan " + para(MV.faturaKalan(f)) + "."; }).join(" ")) : "") +
        (o.hazir.length ? MK.serit("bilgi", "file-check", o.hazir.length + " rapor imzalı ve faturalanmadı" + (o.surec.length ? "; " + o.surec.length + " rapor imza sürecinde, imzalanınca sonraki faturaya girer (soru 138)." : ".")) : "") +
        (o.durum === "rapor" && !o.hazir.length ? MK.serit("bilgi", "history", x.pdurum === "tamam" ? o.surec.length + " rapor onay ya da imza sürecinde; imzalanan rapor faturaya hazır olur." : "Plan " + MV.PLAN_DURUM[x.pdurum].ad.toLocaleLowerCase("tr") + "; rapor imzalandıkça faturaya hazır olur.") : "") +
        (o.durum === "kapandi" ? MK.serit("onay", "circle-check", "İş kapandı " + MK.tarihYaz(o.kapandi) + ": bütün raporlar faturalandı ve tahsil edildi. Kayıt 5 yıl arşivde kalır.") : "") + "</div>" +
      '<div class="a-yuzler">' + yuz("Raporlanan", "file-text", para(o.raporlanan), "KDV hariç · " + o.toplam + " rapor") +
        yuz("Faturalanan", "file-check", para(o.faturalanan), "KDV dahil · " + x.faturalar.length + " fatura") +
        yuz("Tahsil edilen", "wallet", para(o.tahsil), "") + yuz("Açık alacak", "clock", para(o.kalan), o.durum === "gecikti" ? "vadesi geçti" : "", o.durum === "gecikti") + "</div>" +
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
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "Fatura belgesi", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (kalan > 0 ? '<a class="a-tus a-tus-birincil" href="#/f/' + f.no + '/tahsilat">' + ikon("wallet", "a-ikon-kucuk") + "Tahsilat ekle</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (d === "gecikti" ? MK.serit("uyari", "clock", "Vade " + MK.tarihYaz(f.vade) + " tarihinde geçti (" + -MK.gunFarki(MK.BUGUN, f.vade) + " gün); kalan " + para(kalan) + ".") : "") +
        (d === "odendi" ? MK.serit("onay", "circle-check", "Ödendi " + MK.tarihYaz(f.tahsilatlar[f.tahsilatlar.length - 1].tarih) + ".") : "") + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-fbilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-fbilgi">Fatura</h2></div><dl class="a-bilgi">' +
        bilgi("Alıcı", kacis(m.unvan) + '<span class="a-alt-satir">' + kacis(m.vd) + " VD · " + m.vno + "</span>", true) +
        bilgi("Fatura tarihi", MK.tarihYaz(f.tarih)) + bilgi("Vade", MK.tarihYaz(f.vade) + '<span class="a-alt-satir">' + f.vadeGun + " gün · " + (soz ? "sözleşme " + soz.no : "varsayılan") + "</span>") +
        bilgi("İş", '<a class="a-no" href="#/is/' + x.no + '">' + x.no + '</a><span class="a-alt-satir">' + kacis(MV.tesis(x.tesis).ad) + " · " + f.raporlar.length + " rapor</span>") +
        bilgi("Kaydeden", kacis(MV.kisi(f.kaydeden).ad)) + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kalem"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kalem">Kalemler</h2><span class="a-sayac"><b>' + MV.faturaKalemleri(f.raporlar).length + "</b> kalem</span></div>" +
        '<p class="a-bolum-aciklama">İmzalı raporlardan: ekipman türü × rapor sayısı × birim fiyat (teklif kalemi).</p>' +
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
  function faturaPencere(odak) {
    var x = W.is, o = oz(x), h = W.hata, soz = MV.tesisSozlesmesi(x.tesis, x.tarih), vg = soz ? soz.vade : 30, fi = tarihIso(W.tarih);
    var gecici = { raporlar: o.hazir.map(function (r) { return r.no; }) };
    var vade = fi ? (function () { var d = new Date(fi + "T12:00:00"); d.setDate(d.getDate() + vg); return d.toISOString().slice(0, 10); })() : null;
    $("a-pencere-baslik").textContent = "Fatura kaydet · " + x.no;
    $("a-pencere-govde").innerHTML = '<p class="a-bolum-aciklama">Fatura firmanın muhasebe programında e-Fatura ya da e-Arşiv olarak kesilir; numarası ve tarihi buraya yazılır. Kalemler imzalı ve faturalanmamış ' + o.hazir.length + " rapordan.</p>" +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Faturaya girecek kalemler", sinif: "a-tablo-kalem a-tablo-fkalem", sutunlar: KALEM, kayitlar: MV.faturaKalemleri(gecici.raporlar) }) + "</div>" +
      '<dl class="a-bilgi a-bolum-serit">' + toplamlar(ft(gecici)) + "</dl>" +
      (o.surec.length ? '<div class="a-bolum-serit">' + MK.serit("uyari", "history", o.surec.length + " rapor imza sürecinde; bu faturaya girmez, imzalanınca sonraki faturaya kalır.") + "</div>" : "") +
      '<div class="a-form a-bolum-serit">' +
        MK.alan({ id: "w-no", etiket: "Fatura no", zorunlu: true, hata: h.no, ipucu: "16 karakter, ör. KMF2026000000018", girdi: MK.girdi({ id: "w-no", alan: "no", deger: W.no, ek: ' maxlength="16" spellcheck="false"', hata: h.no }) }) +
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
        MK.alan({ id: "w-tarih", etiket: "Tahsilat tarihi", zorunlu: true, hata: h.tarih, ipucu: "GG.AA.YYYY", girdi: MK.girdi({ id: "w-tarih", alan: "tarih", deger: W.tarih, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.tarih }) }) +
        MK.alan({ id: "w-tutar", etiket: "Tutar (TL)", zorunlu: true, hata: h.tutar, ipucu: "Kısmi tahsilat olabilir; en çok kalan kadar", girdi: MK.girdi({ id: "w-tutar", alan: "tutar", deger: W.tutar, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.tutar }) }) +
        MK.alan({ id: "w-yontem", etiket: "Yöntem", zorunlu: true, girdi: MK.secim({ id: "w-yontem", ad: "Yöntem", deger: W.yontem, secenekler: YONTEM.map(function (y) { return [y, y]; }), ipucu: "Yöntem seçin" }) }) +
        MK.alan({ id: "w-not", etiket: "Açıklama", genis: true, ipucu: "İsteğe bağlı; ör. çek no, dekont açıklaması", girdi: MK.girdi({ id: "w-not", alan: "not", deger: W.not, ek: ' maxlength="120"' }) }) + "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "tahsilat-kaydet", ad: "Tahsilatı kaydet", ikon: "check" });
    if (odak) $(odak).focus();
  }
  function pencereAc(tip, nesne) {
    W = tip === "fatura" ? { tip: tip, is: nesne, no: "", tarih: bugun, hata: {} } : { tip: tip, f: nesne, tarih: bugun, tutar: yaz(MV.faturaKalan(nesne)), yontem: YONTEM[0], not: "", hata: {} };
    (tip === "fatura" ? faturaPencere : tahsilatPencere)(); if (!$("a-pencere").open) $("a-pencere").showModal();
    $(tip === "fatura" ? "w-no" : "w-tutar").focus();
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
    var f = { no: no, is: x.no, m: x.m, tarih: fi, vadeGun: vg, vade: v.toISOString().slice(0, 10), raporlar: oz(x).hazir.map(function (r) { return r.no; }), kaydeden: "ad", tahsilatlar: [] };
    FT.push(f); x.faturalar.push(f.no); $("a-pencere").close(); MK.suzgecSifirla("r"); isCiz(x);
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
  X["gecikenler"] = function () { MK.suzgecSifirla("f"); SZ.f.secili = ["gecikti"]; location.hash = "#/faturalar"; };
  X["hazirlar"] = function () { MK.suzgecSifirla("i"); SZ.i.secili = ["hazir"]; if (location.hash === "#/" || location.hash === "") goster(false); else location.hash = "#/"; };
  X["pdf"] = function () { MK.bildir("Makette belge yok. Fatura firmanın muhasebe programında kesilir; e-Fatura / e-Arşiv belgesi oradan açılır (soru 135)."); };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W[k] = e.target.value; };
  MK.onSecim = function (id, deger) { if (W && id === "w-yontem") { W.yontem = deger; tahsilatPencere(id); } };
  $("a-pencere").addEventListener("close", function () { W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "is" ? "#/is/" + r.no : "#/f/" + r.no); });

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/faturalar") return { v: "faturalar" };
    if ((m = /^#\/is\/(P-\d{4}-\d{3})(\/fatura)?$/.exec(h))) return { v: "is", no: m[1], pencere: !!m[2] };
    if ((m = /^#\/f\/([A-Z0-9]+)(\/tahsilat)?$/.exec(h))) return { v: "fatura", no: m[1], pencere: !!m[2] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), liste = r.v === "liste" || r.v === "faturalar";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    if (liste) {
      var on = r.v === "liste" ? "i" : "f";
      /* müşteri sayfasındaki "Açık alacak" yüzü → o müşterinin faturaları */
      var mq = /[?&]musteri=(m\d+)/.exec(location.hash); if (mq && MV.musteri(mq[1])) { MK.suzgecSifirla(on); SZ[on].sec.musteri = mq[1]; }
      $("a-sekme-is").removeAttribute("aria-current"); $("a-sekme-fatura").removeAttribute("aria-current"); $(on === "i" ? "a-sekme-is" : "a-sekme-fatura").setAttribute("aria-current", "page");
      uyariCiz(); $("a-suzgec-kap").innerHTML = MK.suzgecHtml(on); MK.suzgecKur(on);
    } else if (r.v === "is") {
      var x = MV.isKaydi(r.no); if (x !== AKTIF) { AKTIF = x; MK.suzgecSifirla("r"); }
      isCiz(x);
      if (r.pencere && x && oz(x).hazir.length) { if (!W) pencereAc("fatura", x); }
      else { if (r.pencere) history.replaceState(null, "", "#/is/" + r.no); if ($("a-pencere").open) $("a-pencere").close(); }
    } else {
      var f = MV.fatura(r.no); faturaCiz(f);
      if (r.pencere && f && MV.faturaKalan(f) > 0) { if (!W) pencereAc("tahsilat", f); }
      else { if (r.pencere) history.replaceState(null, "", "#/f/" + r.no); if ($("a-pencere").open) $("a-pencere").close(); }
    }
    document.title = (r.v === "is" || r.v === "fatura" ? r.no : r.v === "faturalar" ? "Faturalar" : "Muhasebe") + " · probata maket";
    if (odakla && !(r.pencere && W)) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;

  MK.kabuk({ modul: 18, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
