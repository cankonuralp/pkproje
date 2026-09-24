/* ══ probata MAKET M9 — Raporlar · son imza · PDF (modül 14, 16) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════
   Kaynak: pkproje.md §3 (akış: rapor taslak → yönetici onayında → onaylandı / geri gönderildi → inspector son imza → müşteriye açıldı;
   imzasız yayın yok), §1.1 (reisim: "pdf imzalamaya gönderilebilecek … aracı firmalar ile de yapılabilir, indirilip … ara yazılımlar ile
   imzalamada seçilebilir, bu kısım ilgili modül tasarımı esnasında tekrar tartışılır"), §4.3 (5070 güvenli e-imza), §8.3 (PDF sunucuda).
   Kullanıcı: Mert Kaya (inspector) — kendi raporları (rol × modül önerisi "kendi", M1). Ekranlar: liste (#/) · rapor sayfası (#/r/<no>:
   durum geçmişi + PDF önizlemesi, MB.belge tek üretici) · son imza penceresi (#/imza; tekli ya da toplu). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var BEN = "mk";
  var benim = function () { return MV.RAPORLAR.filter(function (r) { return r.kisi === BEN; }); };
  var imzaBekleyen = function () { return benim().filter(function (r) { return r.durum === "onaylandi"; }); };
  var ekp = function (r) { return MV.ekipman(r.kod); };
  var yeniden = function (r) { return r.durum === "taslak"; };
  var raporEkrani = function (r) { return MK.adres("rapor", "#/r/" + r.kod + "?no=" + r.no + "&durum=" + r.durum); };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("r", { ad: "Raporlarda ara", ipucu: "Rapor no, kod, tesis", birim: "rapor", sayfa: 20,
    cipler: [
      { k: "taslak", ad: "Taslak", grup: "durum", test: function (r) { return r.durum === "taslak"; } },
      { k: "onayda", ad: "Onayda", grup: "durum", test: function (r) { return r.durum === "onayda"; } },
      { k: "imza", ad: "İmza bekliyor", grup: "durum", test: function (r) { return r.durum === "onaylandi"; } },
      { k: "acik", ad: "Müşteriye açık", grup: "durum", test: function (r) { return r.durum === "imzali"; } },
      { k: "geri", ad: "Geri gönderildi", test: function (r) { return !!r.geri && r.durum === "taslak"; } },
      { k: "kusurlu", ad: "Kusurlu", test: function (r) { return !!r.sonuc && r.sonuc !== "Uygun"; } }
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: function () {
        var l = benim().map(function (r) { return MV.tesis(r.tesis).m; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (r, v) { return v === "tumu" || MV.tesis(r.tesis).m === v; } },
      { k: "yil", ad: "Yıl", secenek: function () { return [["tumu", "Tümü"], ["2026", "2026"], ["2025", "2025"]]; }, gecer: function (r, v) { return v === "tumu" || r.olustu.slice(0, 4) === v; } }
    ],
    metin: function (r) { var e = ekp(r), ts = MV.tesis(r.tesis); return [r.no, e.kod, MV.tur(e.tur).ad, ts.ad, MV.musteri(ts.m).kisa].join(" "); },
    imkansiz: "Bir rapor aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<a class="a-no" href="#/r/' + r.no + '">' + r.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(r.olustu) + "</span>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = ekp(r); return '<span class="a-hucre-satir"><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad) + "</span>"; } },
    { k: "tesis", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: function (r) { var ts = MV.tesis(r.tesis); return "<span>" + kirp(ts.ad) + kirp(MV.musteri(ts.m).kisa, "a-alt-satir") + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "govde", sira: 4, hucre: function (r) {
      var s = MV.sonucAd(r); return '<span class="a-kart-etiket">Sonuç</span>' + (s ? '<span class="a-onceki' + (s === "Uygun" ? "" : s === "Kusurlu" ? " a-sonuc-hata" : " a-sonuc-uyari") + '">' + s + "</span>" : '<span class="a-deger-yok">—</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(MV.raporDurum(r)); } }
  ];
  function uyariCiz() {
    var l = imzaBekleyen(); MK.menuSayi(14, l.length);
    $("a-uyari").innerHTML = l.length ? '<div class="a-uyari-serit"><div class="a-serit a-serit-uyari">' + ikon("file-signature", "a-ikon-kucuk") +
      "<span><b>" + l.length + " rapor son imzanızı bekliyor</b> · onaylandı; imzalanınca müşteriye açılır.</span>" +
      MK.tus({ eylem: "imza-ac", ad: "İmzala (" + l.length + ")", sinif: "a-tus-ikincil a-serit-tus" }) + "</div></div>" : "";
  }
  function listeCiz() {
    uyariCiz();
    MK.listeCiz({ on: "r", kayitlar: benim(), sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { var o = { onaylandi: 0, taslak: 1, onayda: 2, imzali: 3 }; return l.slice().sort(function (a, b) { return o[a.durum] - o[b.durum] || (a.olustu < b.olustu ? 1 : -1); }); },
      bosVeri: { ikon: "file-text", baslik: "Rapor yok", metin: "Raporlar plan içinde ekipmanın satırından oluşturulur." },
      tablo: { baslik: "Raporlar", sinif: "a-tablo-raporlar", sutunlar: SUTUN, href: function (r) { return "#/r/" + r.no; } } });
  }

  /* ── RAPOR SAYFASI: durum geçmişi + PDF önizlemesi ─────────────────────────────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function gecmis(r) {
    var l = [[r.olustu, MV.kisi(r.kisi).ad, "Rapor oluşturuldu"]];
    if (r.geri) l.push([dkGeri(r), MV.kisi(r.kisi).ad, "Onaya gönderildi"], [r.geri.zaman, MV.kisi(r.geri.kim).ad, "Geri gönderildi", "“" + r.geri.gerekce + "”"]);
    if (r.gonderildi) l.push([r.gonderildi, MV.kisi(r.kisi).ad, "Onaya gönderildi"]);
    if (r.onay) l.push([r.onay.zaman, MV.kisi(r.onay.kim).ad, "Onaylandı", "branş yöneticisi"]);
    if (r.imza) l.push([r.imza.zaman, MV.kisi(r.kisi).ad, "İmzalandı", "güvenli elektronik imza"], [r.imza.zaman, "Sistem", "Müşteriye açıldı", "portal kullanıcıları indirebilir"]);
    return l.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0; });
  }
  var dkGeri = function (r) { return r.olustu.slice(0, 11) + "14:20"; };
  function raporCiz(r) {
    if (!r || r.kisi !== BEN) {
      $("a-nesne").innerHTML = MK.kirinti([["Raporlar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu adreste size ait rapor yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Raporlara dön</a>" });
      return;
    }
    var e = ekp(r), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), m = MV.musteri(ts.m), portal = MV.musteriKullanicilari(m.id).filter(function (x) { return x.durum === "etkin"; });
    var yon = MV.kisi(MV.YONETICI[t.b]);
    $("a-nesne").innerHTML = MK.kirinti([["Raporlar", "#/"], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + r.no + "</h1>" + rozet(MV.raporDurum(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(ts.ad) + " · " + kacis(m.kisa) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF indir", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (r.durum === "onaylandi" ? MK.tus({ eylem: "imza-ac", ad: "İmzala", ikon: "file-signature", veri: { no: r.no } }) : "") +
          (yeniden(r) ? '<a class="a-tus a-tus-birincil" href="' + raporEkrani(r) + '">' + ikon("pencil", "a-ikon-kucuk") + "Raporu düzenle</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (r.geri && r.durum === "taslak" ? MK.serit("uyari", "undo-2", "<b>Geri gönderildi</b> · " + kacis(MV.kisi(r.geri.kim).ad) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (r.durum === "onayda" ? MK.serit("bilgi", "clock", kacis(yon.ad) + " (" + MV.bransAd(t.b).toLocaleLowerCase("tr") + " branş yöneticisi) onayında; bu sırada düzenlenemez.") : "") +
        (r.durum === "onaylandi" ? MK.serit("uyari", "file-signature", "Onaylandı: son imzanız bekleniyor. İmzasız rapor müşteriye açılmaz.") : "") +
        (r.durum === "imzali" ? MK.serit("onay", "circle-check", "İmzalı ve müşteriye açık" + (portal.length ? ": " + portal.length + " portal kullanıcısı indirebilir." : "; müşterinin portal kullanıcısı yok.")) : "") +
      "</div>" +
      '<div class="a-yuzler">' +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: e.kod, href: MK.adres(7, "#/e/" + e.kod), not: MV.tur(e.tur).ad }) +
        yuz({ ikon: "calendar-check", ad: "Plan", sayi: r.plan ? ts.plan : "—", href: r.plan ? MK.adres(13, "#/plan/" + r.plan) : null, not: r.plan ? MK.tarihYaz(r.olustu) : "geçen yılın planı" }) +
        yuz({ ikon: r.sonuc && r.sonuc !== "Uygun" ? "triangle-alert" : "circle-check", ad: "Sonuç", sayi: MV.sonucAd(r) || "—", uyari: !!r.sonuc && r.sonuc !== "Uygun", not: r.sonuc ? "kriterlere göre" : "taslak" }) +
        yuz({ ikon: "users", ad: "Müşteri erişimi", sayi: r.durum === "imzali" ? "Açık" : "Kapalı", not: r.durum === "imzali" ? portal.length + " kullanıcı" : "imzadan sonra açılır" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-gecmis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gecmis">Durum geçmişi</h2></div>' +
        '<ol class="a-gecmis">' + gecmis(r).map(function (x) {
          return '<li><span class="a-gecmis-zaman">' + MK.zamanYaz(x[0]) + '</span><span class="a-gecmis-ne"><b>' + x[2] + '</b> <span class="a-gecmis-rol">' + kacis(x[1]) + "</span>" + (x[3] ? '<span class="a-not-metin">' + kacis(x[3]) + "</span>" : "") + "</span></li>";
        }).join("") + "</ol></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">PDF önizlemesi</h2><span class="a-sayac">' + (r.imza ? "imzalı" : "imzasız") + "</span></div>" +
        (r.durum === "taslak" ? '<p class="a-bos-satir">Taslak rapor: PDF onaylanıp imzalanınca üretilir. İçerik saha rapor ekranında.</p>' : MB.belge(t, MV.raporBelge(r))) + "</section>";
  }

  /* ── SON İMZA PENCERESİ: aracı imza servisi · indir, imzala, yükle (yöntem firma ayarı; soru) ───────────────── */
  var W = null;
  function pencereCiz(odak) {
    var l = W.l;
    $("a-pencere-baslik").textContent = l.length > 1 ? l.length + " raporu imzala" : "Raporu imzala";
    $("a-pencere-govde").innerHTML = '<div class="a-sekmeler" role="group" aria-label="İmza yöntemi">' +
        '<button type="button" class="a-sekme" data-yontem="servis" aria-pressed="' + (W.y === "servis") + '">İmza servisi</button>' +
        '<button type="button" class="a-sekme" data-yontem="dosya" aria-pressed="' + (W.y === "dosya") + '">İndir, imzala, yükle</button></div>' +
      '<ul class="a-kosullar">' + l.map(function (r) { var e = ekp(r); return '<li class="a-kosul-bilgi">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + e.kod + " · " + kacis(MV.tesis(r.tesis).ad) + "</span></li>"; }).join("") + "</ul>" +
      '<div class="a-serit-kap a-bolum-serit">' + (W.y === "servis"
        ? MK.serit("bilgi", "file-signature", "PDF'ler firmanın anlaştığı aracı imza servisine gider; güvenli elektronik imza (5070) sizin kartınız ya da mobil imzanızla atılır, imzalı PDF geri gelir.")
        : MK.serit("bilgi", "file-signature", "1 · PDF'leri indirin · 2 · kendi imza yazılımınızla güvenli elektronik imza atın · 3 · imzalı PDF'leri yükleyin. Sistem imzayı ve dosyanın değişmediğini doğrular.")) + "</div>" +
      (W.y === "dosya" ? '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF'leri indir", ikon: "file-text", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "imzali-yukle", ad: W.yuklendi ? "İmzalı PDF yüklendi (" + l.length + ")" : "İmzalı PDF'leri yükle", ikon: "file-check", sinif: "a-tus-ikincil" }) + "</div>" +
        (W.hata ? '<p class="a-ipucu a-ipucu-uyari">' + W.hata + "</p>" : "") : "");
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "imzala", ad: W.y === "servis" ? "İmzaya gönder" : "İmzayı tamamla", ikon: "file-signature" });
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
    var n = W.l.length, zaman = MK.simdi();
    W.l.forEach(function (r) { r.durum = "imzali"; r.imza = { zaman: zaman }; });
    var tek = n === 1 ? W.l[0] : null;
    $("a-pencere").close();
    if (tek && rota().v === "rapor") raporCiz(tek); else listeCiz();
    MK.menuSayi(14, imzaBekleyen().length);
    MK.bildir(n + " rapor imzalandı ve müşteriye açıldı.");
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
  X["imzali-yukle"] = function () { W.yuklendi = true; W.hata = ""; pencereCiz('[data-eylem="imzali-yukle"]'); };
  X["pdf"] = function () { MK.bildir("Makette dosya yok. Uygulamada PDF sunucuda üretilir, kısa ömürlü yetkili bağlantıyla iner."); };
  $("a-pencere").addEventListener("close", function () { W = null; if (rota().pencere) history.replaceState(null, "", "#/"); });

  MK.kabuk({ modul: 14, kullanici: { bas: "MK", ad: "Mert Kaya", rol: "Inspector" }, sayac: { 14: "İmzanızı bekleyen rapor" } });
  goster(false);
})();
