/* ══ probata MAKET M9 — Raporlar · son imza · PDF (modül 14, 16) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════
   Kaynak: pkproje.md §3 (akış: rapor taslak → yönetici onayında → onaylandı / geri gönderildi → inspector son imza → müşteriye açıldı;
   imzasız yayın yok), §1.1 (reisim: "pdf imzalamaya gönderilebilecek … aracı firmalar ile de yapılabilir, indirilip … ara yazılımlar ile
   imzalamada seçilebilir, bu kısım ilgili modül tasarımı esnasında tekrar tartışılır"), §4.3 (5070 güvenli e-imza), §8.3 (PDF sunucuda).
   Kullanıcı: Mert Kaya (inspector) — kendi raporları (rol × modül önerisi "kendi", M1). Ekranlar: liste (#/) · rapor sayfası (#/r/<no>:
   PDF önizlemesi, MB.belge tek üretici; durum geçmişi 2026-09-28'de kalktı) · son imza penceresi (#/imza; tekli ya da toplu). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var BEN = "mk";
  var benim = function () { return MV.RAPORLAR.filter(function (r) { return r.kisi === BEN && !r.pasif; }); };   /* pasif rapor inspector'da görünmez (2026-09-28) */
  var imzaBekleyen = function () { return benim().filter(function (r) { return r.durum === "onaylandi"; }); };
  var ekp = function (r) { return MV.ekipman(r.kod); };
  var yeniden = function (r) { return r.durum === "taslak"; };
  var raporEkrani = function (r) { return MK.adres("rapor", "#/r/" + r.kod + "?no=" + r.no + "&durum=" + r.durum); };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  /* 2026-09-28 (reisim: "filtreleyip arama detaylı olmalı; ekipman türüne rapor numarasına göre ayrı ayrı arayabilmeliyim"): genel aramanın
     yanında alan alan arama (rapor no · ekipman kodu · ekipman türü · tesis); seçiciler müşteri, il, sonuç, yıl. Süzgeç ekranı örnekleri
     reisim'den gelecek; bu ilk düzen. */
  MK.suzgecTanimla("r", { ad: "Raporlarda ara", ipucu: "Hepsinde ara", birim: "rapor", sayfa: 20,
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. KM-0926-7", metin: function (r) { return r.no; } },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. ET-10", metin: function (r) { return ekp(r).kod; } },
      { k: "tur", ad: "Ekipman türü", ipucu: "ör. topraklama", metin: function (r) { var t = MV.tur(ekp(r).tur); return t.ad + " " + t.k; } },
      { k: "tesis", ad: "Tesis", ipucu: "ör. fabrika", metin: function (r) { return MV.tesis(r.tesis).ad; } }
    ],
    cipler: [
      { k: "taslak", ad: "Yeni", grup: "durum", test: function (r) { return r.durum === "taslak"; } },
      { k: "onayda", ad: "Teknik yönetici onayında", grup: "durum", test: function (r) { return r.durum === "onayda"; } },
      { k: "imza", ad: "Muayene uzmanı imzası", grup: "durum", test: function (r) { return r.durum === "onaylandi"; } },
      { k: "imzada", ad: "İmzaya gönderildi", grup: "durum", test: function (r) { return r.durum === "imzada"; } },
      { k: "acik", ad: "Tamamlandı", grup: "durum", test: function (r) { return r.durum === "imzali"; } },
      /* "Kusurlu" çipi kalktı (reisim 2026-09-28: "raporlar modülünde kusurlu tuşunu kaldır"); sonuç Sonuç seçicisinde */
      { k: "geri", ad: "Geri gönderilen", test: function (r) { return !!r.geri && r.durum === "taslak"; } }
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: function () {
        var l = benim().map(function (r) { return MV.tesis(r.tesis).m; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (r, v) { return v === "tumu" || MV.tesis(r.tesis).m === v; } },
      { k: "il", ad: "İl", secenek: function () {
        var l = benim().map(function (r) { return MV.tesis(r.tesis).il; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a.localeCompare(b, "tr"); });
        return [["tumu", "Tümü"]].concat(l.map(function (x) { return [x, x]; }));
      }, gecer: function (r, v) { return v === "tumu" || MV.tesis(r.tesis).il === v; } },
      { k: "sonuc", ad: "Sonuç", secenek: function () { return [["tumu", "Tümü"], ["Uygun", "Uygun"], ["Hafif kusurlu", "Hafif kusurlu"], ["Kusurlu", "Kusurlu"], ["Ağır kusurlu", "Ağır kusurlu"], ["yok", "Sonuç yok"]]; },
        gecer: function (r, v) { var s = MV.sonucAd(r); return v === "tumu" || (v === "yok" ? !s : s === v); } },
      { k: "yil", ad: "Yıl", secenek: function () { return [["tumu", "Tümü"], ["2026", "2026"], ["2025", "2025"]]; }, gecer: function (r, v) { return v === "tumu" || r.olustu.slice(0, 4) === v; } }
    ],
    metin: function (r) { var e = ekp(r), ts = MV.tesis(r.tesis); return [r.no, e.kod, MV.tur(e.tur).ad, ts.ad, MV.musteri(ts.m).kisa].join(" "); },
    imkansiz: "Bir rapor aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<a class="a-no" href="#/r/' + r.no + '">' + r.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(r.olustu) + "</span>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = ekp(r); return '<span class="a-hucre-satir"><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad) + "</span>"; } },
    { k: "tesis", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: function (r) { var ts = MV.tesis(r.tesis); return "<span>" + kirp(ts.ad) + kirp(MV.musteri(ts.m).kisa, "a-alt-satir") + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "govde", sira: 4, hucre: function (r) {
      var s = MV.sonucAd(r); return '<span class="a-kart-etiket">Sonuç</span>' + (s ? '<span class="a-onceki' + (s === "Uygun" ? "" : /^(Kusurlu|Ağır)/.test(s) ? " a-sonuc-hata" : " a-sonuc-uyari") + '">' + s + "</span>" : '<span class="a-deger-yok">—</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(MV.raporDurum(r)); } }
  ];
  function uyariCiz() {
    var l = imzaBekleyen();
    $("a-uyari").innerHTML = l.length ? '<div class="a-uyari-serit"><div class="a-serit a-serit-uyari">' + ikon("file-signature", "a-ikon-kucuk") +
      "<span><b>" + l.length + " rapor imzanızı bekliyor</b></span>" +
      MK.tus({ eylem: "imza-ac", ad: "İmzala (" + l.length + ")", sinif: "a-tus-ikincil a-serit-tus" }) + "</div></div>" : "";
  }
  function listeCiz() {
    uyariCiz();
    MK.listeCiz({ on: "r", kayitlar: benim(), sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      /* 2026-09-26 (reisim: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun"): varsayılan sıra tarih, en yeni üstte */
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.olustu < b.olustu ? 1 : a.olustu > b.olustu ? -1 : 0; }); },
      bosVeri: { ikon: "file-text", baslik: "Rapor yok", metin: "Raporlar plan içinde ekipmanın satırından oluşturulur." },
      tablo: { baslik: "Raporlar", sinif: "a-tablo-raporlar", sutunlar: SUTUN, href: function (r) { return "#/r/" + r.no; } } });
  }

  /* ── RAPOR SAYFASI: PDF önizlemesi (durum geçmişi 2026-09-28'de kalktı, reisim: "Raporlarda durum geçmişi olmamalı") ─────────────────────────────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function raporCiz(r) {
    if (!r || r.kisi !== BEN) {
      $("a-nesne").innerHTML = MK.kirinti([["Raporlar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu adreste size ait rapor yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Raporlara dön</a>" });
      return;
    }
    var e = ekp(r), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), m = MV.musteri(ts.m), portal = MV.musteriKullanicilari(m.id).filter(function (x) { return x.durum === "etkin"; });
    var yon = MV.kisi(MV.YONETICI[t.b]);
    $("a-nesne").innerHTML = MK.kirinti([["Raporlar", "#/"], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + r.no + (r.revizyonlar && r.revizyonlar.length ? "-" + r.revizyonlar[0].ad : "") + "</h1>" + rozet(MV.raporDurum(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(ts.ad) + " · " + kacis(m.kisa) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF indir", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (r.durum === "onaylandi" ? MK.tus({ eylem: "imza-ac", ad: "İmzala", ikon: "file-signature", veri: { no: r.no } }) : "") +
          (yeniden(r) ? '<a class="a-tus a-tus-birincil" href="' + raporEkrani(r) + '">' + ikon("pencil", "a-ikon-kucuk") + "Raporu düzenle</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (r.geri && r.durum === "taslak" ? MK.serit("uyari", "undo-2", "<b>" + (r.revizyonlar && r.revizyonlar[0] && r.revizyonlar[0].zaman === r.geri.zaman ? "Revizeye gönderildi (" + r.revizyonlar[0].ad + ")" : "Geri gönderildi") + "</b> · " + kacis(MV.kisi(r.geri.kim).ad) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (r.durum === "onayda" ? MK.serit("bilgi", "clock", "Onayda · " + kacis(yon.ad)) : "") +
        (r.durum === "onaylandi" ? MK.serit("uyari", "file-signature", "Muayene uzmanı imzası · imzanız bekleniyor") : "") +
        (r.durum === "imzada" ? MK.serit("bilgi", "file-signature", "İmzaya gönderildi") : "") +
        (r.durum === "imzali" ? MK.serit(portal.length ? "onay" : "uyari", "circle-check", "Tamamlandı · müşteriye açık" + (portal.length ? "" : " · müşterinin giriş yapan kullanıcısı yok")) : "") +
      "</div>" +
      '<div class="a-yuzler">' +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: e.kod, not: MV.tur(e.tur).ad }) +   /* 2026-09-26: Ekipmanlar ekranı yok (M3 2. tur) */
        yuz({ ikon: "calendar-check", ad: "Plan", sayi: r.plan ? ts.plan : "—", href: r.plan ? MK.adres(13, "#/plan/" + r.plan) : null, not: r.plan ? MK.tarihYaz(r.olustu) : "geçen yılın planı" }) +
        yuz({ ikon: r.sonuc && r.sonuc !== "Uygun" ? "triangle-alert" : "circle-check", ad: "Sonuç", sayi: MV.sonucAd(r) || "—", uyari: !!r.sonuc && r.sonuc !== "Uygun", not: r.sonuc ? "" : "taslak" }) +
        yuz({ ikon: "users", ad: "Müşteri erişimi", sayi: r.durum === "imzali" ? "Açık" : "Kapalı", not: r.durum === "imzali" ? portal.length + " kullanıcı" : "" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">' + (r.imzaDosya ? "İmzalı PDF" : "PDF önizlemesi") + '</h2><span class="a-sayac">' + (r.imza ? "imzalı" : "imzasız") + "</span>" +
          (r.imzaDosya ? '<div class="a-bolum-tus">' + MK.dosyaAlan({ ad: r.imzaDosya, degistir: "rapor-imza-degistir", sil: "rapor-imza-sil", veri: { no: r.no } }) + "</div>" : "") + "</div>" +
        (r.durum === "taslak" ? '<p class="a-bos-satir">Taslak: PDF yok.</p>' : MK.dosyaOnizle(r.imzaDosya, MB.belge(t, MV.raporBelge(r)))) + "</section>";
  }

  /* ── SON İMZA PENCERESİ: aracı imza servisi · indir, imzala, yükle (yöntem firma ayarı; soru) ───────────────── */
  var W = null;
  function pencereCiz(odak) {
    var l = W.l;
    $("a-pencere-baslik").textContent = l.length > 1 ? l.length + " raporu imzala" : "Raporu imzala";
    $("a-pencere-govde").innerHTML = '<div class="a-sekmeler" role="group" aria-label="İmza yöntemi">' +
        '<button type="button" class="a-sekme" data-yontem="servis" aria-pressed="' + (W.y === "servis") + '">İmza servisi</button>' +
        '<button type="button" class="a-sekme" data-yontem="dosya" aria-pressed="' + (W.y === "dosya") + '">İndir, imzala, yükle</button></div>' +
      '<ul class="a-kosullar">' + l.map(function (r) { var e = ekp(r); return '<li class="a-kosul-bilgi">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + e.kod + " · " + kacis(MV.tesis(r.tesis).ad) + "</span>" +
        (W.y === "dosya" && W.dosya && W.dosya[r.no] ? MK.dosyaAlan({ ad: W.dosya[r.no], degistir: "imzali-tek", sil: "imzali-kaldir", veri: { no: r.no } }) : "") + "</li>"; }).join("") + "</ul>" +
      '<div class="a-serit-kap a-bolum-serit">' + (W.y === "servis"
        ? MK.serit("bilgi", "file-signature", "Her rapor ayrı PDF olarak imza servisine gider ve ayrı imzalanır.")
        : MK.serit("bilgi", "file-signature", "Her rapor ayrı PDF: indirin, e-imzayla imzalayın, imzalı PDF'leri yükleyin.")) + "</div>" +
      (W.y === "dosya" ? '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF'leri indir", ikon: "file-text", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "imzali-yukle", ad: W.yuklendi ? "İmzalı PDF yüklendi (" + l.length + ")" : "İmzalı PDF'leri yükle", ikon: "file-check", sinif: "a-tus-ikincil" }) + "</div>" +
        (W.hata ? '<p class="a-ipucu a-ipucu-uyari">' + W.hata + "</p>" : "") : "");
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "imzala", ad: W.y === "servis" ? "İmza servisine gönder" : "İmzayı tamamla", ikon: "file-signature" });
    if (odak) { var el = document.querySelector(odak); if (el) el.focus(); }
  }
  function pencereAc(no) {
    var l = no ? imzaBekleyen().filter(function (r) { return r.no === no; }) : imzaBekleyen();
    if (!l.length) return;
    W = { l: l, y: "servis", yuklendi: false, hata: "" }; pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    document.querySelector('[data-yontem="servis"]').focus();
  }
  function imzala() {
    if (W.y === "dosya" && !W.yuklendi) { W.hata = "Önce imzalı PDF'leri yükleyin."; pencereCiz('[data-eylem="imzali-yukle"]'); return; }
    var n = W.l.length, zaman = MK.simdi(), servis = W.y === "servis";
    /* servis yolu: rapor "İmzaya gönderildi", imzalı PDF dönünce "Tamamlandı" · dosya yolu: imzalı PDF yüklendi → "Tamamlandı" */
    W.l.forEach(function (r) { if (servis) { r.durum = "imzada"; r.imzaGonderildi = zaman; } else { r.durum = "imzali"; r.imza = { zaman: zaman }; r.imzaDosya = W.dosya[r.no]; } });   /* yüklenen imzalı PDF raporda saklanır */
    var tek = n === 1 ? W.l[0] : null;
    $("a-pencere").close();
    if (tek && rota().v === "rapor") raporCiz(tek); else listeCiz();
   
    MK.bildir(servis ? n + " rapor imzaya gönderildi; her biri ayrı imzalanır." : n + " rapor imzalandı, tamamlandı ve müşteriye açıldı.");
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/imza") return { v: "liste", pencere: true };
    if ((m = /^#\/r\/([A-Za-z0-9-]+)$/.exec(h))) return { v: "rapor", no: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), rp = r.no ? MV.rapor(r.no) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("r"); MK.suzgecKur("r"); } else raporCiz(rp);
    document.title = (r.v === "rapor" ? (rp ? rp.no : "Rapor bulunamadı") : "Raporlar") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  MK.onTikla = function (e) {
    var b = e.target.closest("[data-yontem]"); if (!b || !W) return false;
    W.y = b.dataset.yontem; W.hata = ""; pencereCiz('[data-yontem="' + W.y + '"]'); return true;
  };
  var X = MK.eylem;
  X["imza-ac"] = function (el) { pencereAc(el.dataset.no || null); };
  X["imzala"] = imzala;
  /* 2026-09-27: imzalı PDF'ler gerçek dosya penceresinden (birden çok); dosya adında rapor no geçen o rapora, öteki sırayla eşlenir */
  X["imzali-yukle"] = function () {
    var secilen = [];
    MK.dosyaSec({ kabul: ".pdf", coklu: true, enCokMB: 20, ornek: "" }, function (ad) {
      if (!W) return;
      if (ad) secilen.push(ad);
      var eslesen = function (r) { return secilen.filter(function (x) { return x.indexOf(r.no) >= 0; })[0]; };
      var serbest = secilen.filter(function (x) { return !W.l.some(function (r) { return x.indexOf(r.no) >= 0; }); });
      W.dosya = {};
      W.l.forEach(function (r) { W.dosya[r.no] = ad ? eslesen(r) || serbest.shift() || null : r.no + "-imzali.pdf"; });
      var eksik = W.l.filter(function (r) { return !W.dosya[r.no]; }).length;
      W.yuklendi = !eksik; W.hata = eksik ? eksik + " raporun imzalı PDF'i eksik." : "";
      pencereCiz('[data-eylem="imzali-yukle"]');
    });
  };
  /* pencerede tek raporun imzalı PDF'i değiştirilir ya da kaldırılır (2026-09-28) */
  var imzaliSay = function () { var eksik = W.l.filter(function (r) { return !W.dosya[r.no]; }).length; W.yuklendi = !eksik; W.hata = eksik && W.dosya ? eksik + " raporun imzalı PDF'i eksik." : ""; };
  X["imzali-tek"] = function (el) {
    var no = el.dataset.no;
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 20, ornek: no + "-imzali-2.pdf" }, function (ad) { if (!W) return; W.dosya[no] = ad; imzaliSay(); pencereCiz('[data-eylem="imzali-yukle"]'); });
  };
  X["imzali-kaldir"] = function (el) { W.dosya[el.dataset.no] = null; imzaliSay(); pencereCiz('[data-eylem="imzali-yukle"]'); };
  /* tamamlanan raporun imzalı PDF'i değiştirilir; silinirse rapor yeniden imza bekler (2026-09-28) */
  X["rapor-imza-degistir"] = function (el) {
    var r = MV.rapor(el.dataset.no);
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 20, ornek: r.no + "-imzali-2.pdf" }, function (ad) { if (r.imzaDosya && r.imzaDosya !== ad) MK.dosyaSil(r.imzaDosya); r.imzaDosya = ad; raporCiz(r); MK.bildir("İmzalı PDF değiştirildi."); });
  };
  X["rapor-imza-sil"] = function (el) {
    var r = MV.rapor(el.dataset.no);
    MK.onayla({ baslik: "İmzalı PDF'i sil", metin: r.no + " imzalı PDF'i silinir; rapor yeniden muayene uzmanı imzası bekler ve müşteriye kapanır.", tamam: function () {
      if (r.imzaDosya) MK.dosyaSil(r.imzaDosya); r.imzaDosya = null; r.imza = null; r.durum = "onaylandi"; raporCiz(r);
      var h = document.querySelector("#a-nesne h1"); if (h) h.focus(); MK.bildir(r.no + " imzalı PDF'i silindi; imza bekliyor.");
    } });
  };
  /* 103 → 2026-09-29: imzalı raporu revizeye teknik yönetici gönderir (Onaylar · Tüm raporlar); inspector revize raporu Yeni olarak görür */
  /* toplu PDF (§3.8 kural 7; reisim 2026-09-28: "Raporlar ekranında ve planlarda … toplu pdf indirme tuşu olsun"): süzgeçten geçen
     raporların PDF'i tek dosyada, her rapor kendi sayfalarında; taslağın PDF'i yok */
  X["toplu-pdf"] = function () {
    var l = MK.taban("r", benim()).filter(function (r) { return MK.cipGecer("r", r) && r.durum !== "taslak"; }).sort(function (a, b) { return a.no < b.no ? -1 : 1; });
    if (!l.length) { MK.bildir("Süzgeçte PDF'i olan rapor yok; taslak rapor PDF'e girmez."); return; }
    MK.pdfGoster({ dosya: "raporlar-" + MK.BUGUN + ".pdf", baslik: l.length + " rapor", icerik: l.map(function (r) { return MB.belge(MV.tur(ekp(r).tur), MV.raporBelge(r)); }).join("") });
  };
  /* 2026-09-27: rapor belgesi yazdırma penceresinden PDF olur (uygulamada PDF sunucuda üretilir); imza penceresinde seçili raporların hepsi, her biri ayrı sayfa */
  X["pdf"] = function () {
    var l = $("a-pencere").open && W ? W.l : [MV.rapor(rota().no)];
    MK.yazdir(l.length > 1 ? l.length + " rapor" : l[0].no, l.map(function (r) { return MB.belge(MV.tur(ekp(r).tur), MV.raporBelge(r)); }).join(""));
  };
  $("a-pencere").addEventListener("close", function () { W = null; if (rota().pencere) history.replaceState(null, "", "#/"); });

  MK.kabuk({ modul: 14, kullanici: { bas: "MK", ad: "Mert Kaya", rol: "Inspector" } });
  goster(false);
})();
