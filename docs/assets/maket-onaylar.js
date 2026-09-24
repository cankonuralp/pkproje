/* ══ probata MAKET M9 — Onaylar (modül 15) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "raporu teknik yöneticisine onaya gönderecek"), §3 (yönetici onayında → onaylandı / geri gönderildi),
   §3.2 madde 3 (onay türün BRANŞINA göre ilgili yöneticiye gider), §4.9 (17020: kayıtlar ne zaman, hangi metot, hangi öge — gözden
   geçirme). Kullanıcı: Selin Yıldız (mekanik branş yöneticisi) — kuyruğunda yalnız mekanik raporlar; elektrik Can Öztürk'te.
   Ekranlar: kuyruk (#/) · onay ekranı (#/r/<no>: gözden geçirme özeti + PDF önizlemesi, Onayla / Geri gönder) · geri gönder penceresi
   (#/r/<no>/geri; gerekçe zorunlu). Onaylanan rapor inspector'ın son imzasına gider; sıradaki rapor açılır. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var BEN = "sy", BRANS = "m";
  var brans = function (r) { return MV.tur(MV.ekipman(r.kod).tur).b; };
  var kuyruk = function () { return MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && brans(r) === BRANS; }).sort(function (a, b) { return a.gonderildi < b.gonderildi ? -1 : 1; }); };
  var oteki = function () { return MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && brans(r) !== BRANS; }); };
  var saatFarki = function (iso) { return Math.round((new Date(MK.simdi() + ":00Z") - new Date(iso + ":00Z")) / 36e5); };
  var bekleme = function (iso) { var h = saatFarki(iso); return h < 1 ? "az önce" : h < 24 ? h + " saattir" : Math.floor(h / 24) + " gündür"; };

  /* ── KUYRUK ────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("o", { ad: "Kuyrukta ara", ipucu: "Rapor no, kod, tesis", birim: "rapor",
    cipler: [
      { k: "kusurlu", ad: "Kusurlu", test: function (r) { return MV.sonucAd(r) !== "Uygun"; } },
      { k: "eski", ad: "24 saatten eski", test: function (r) { return saatFarki(r.gonderildi) >= 24; } }
    ],
    seciciler: [
      { k: "kisi", ad: "Inspector", secenek: function () {
        var l = kuyruk().map(function (r) { return r.kisi; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.kisi(k).ad]; }));
      }, gecer: function (r, v) { return v === "tumu" || r.kisi === v; } },
      { k: "tesis", ad: "Tesis", secenek: function () {
        var l = kuyruk().map(function (r) { return r.tesis; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (t) { return [t, MV.musteri(MV.tesis(t).m).kisa + " / " + MV.tesis(t).ad]; }));
      }, gecer: function (r, v) { return v === "tumu" || r.tesis === v; } }
    ],
    metin: function (r) { var e = MV.ekipman(r.kod), ts = MV.tesis(r.tesis); return [r.no, e.kod, MV.tur(e.tur).ad, ts.ad, MV.kisi(r.kisi).ad].join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { var ts = MV.tesis(r.tesis); return '<a class="a-no" href="#/r/' + r.no + '">' + r.no + "</a>" + kirp(MV.musteri(ts.m).kisa + " / " + ts.ad, "a-alt-satir"); } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = MV.ekipman(r.kod); return '<span class="a-hucre-satir"><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad) + "</span>"; } },
    { k: "kisi", baslik: "Inspector", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Inspector</span>' + kirp(MV.kisi(r.kisi).ad); } },
    { k: "gonderildi", baslik: "Gönderildi", kart: "govde", sira: 4, hucre: function (r) {
      var h = saatFarki(r.gonderildi);
      return '<span class="a-kart-etiket">Gönderildi</span><span><span class="a-tarih-gun">' + MK.zamanYaz(r.gonderildi) + '</span><span class="' + (h >= 24 ? "a-uyari-metin" : "a-tarih-saat") + '">' + bekleme(r.gonderildi) + " bekliyor</span></span>";
    } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (r) { var s = MV.sonucAd(r); return rozet(s === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: s, rozet: s === "Kusurlu" ? "a-rozet-red" : "a-rozet-bekliyor" }); } }
  ];
  function listeCiz() {
    var o = oteki();
    $("a-uyari").innerHTML = o.length ? '<div class="a-uyari-serit">' + MK.serit("bilgi", "users", "Elektrik raporları (" + o.length + ") elektrik branş yöneticisi Can Öztürk'ün kuyruğunda; onay türün branşına gider.") + "</div>" : "";
    MK.listeCiz({ on: "o", kayitlar: kuyruk(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.gonderildi < b.gonderildi ? -1 : 1; }); },
      bosVeri: { ikon: "circle-check", baslik: "Kuyruk boş", metin: "Onayınızı bekleyen rapor yok. Inspector'lar onaya gönderdikçe burada en eskisi üstte sıralanır." },
      tablo: { baslik: "Onay kuyruğu", sinif: "a-tablo-onay", sutunlar: SUTUN, href: function (r) { return "#/r/" + r.no; } } });
    $("a-sayfa").innerHTML = "";
  }

  /* ── ONAY EKRANI: gözden geçirme özeti + PDF önizlemesi ───────────────────────────────────────────────── */
  function ozet(r) {
    var b = MV.raporBelge(r), t = MV.tur(b.e.tur), kr = MV.kriterler(t), ts = MV.testler(t), gecti = b.cihaz.filter(function (v) { return MV.kalDurum(v) === "gecti"; });
    var s = MV.sonucAd(r), kusur = s !== "Uygun";
    return [
      [!!b.isg, b.isg ? "İSG-KATİP " + b.isg.no + " · onay " + MK.tarihYaz(b.isg.onay) : "İSG-KATİP kaydı yok"],
      [true, "Kontrol metodu: " + (MV.standart(b.metot) ? MV.standart(b.metot).no + ":" + MV.standart(b.metot).surum : "üretici talimatı")],
      [!kusur, kr.length + " kriter yapıldı" + (kusur ? " · " + (s === "Hafif kusurlu" ? "1 hafif kusur (açıklamalı)" : "1 kusur (açıklamalı)") : " · hepsi uygun")],
      [true, ts.length + " test değeri · hepsi sınır içinde"],
      [!gecti.length, b.cihaz.length + " ölçüm aleti" + (gecti.length ? " · kalibrasyonu geçmiş: " + gecti.map(function (v) { return v.env; }).join(", ") : " · kalibrasyonu geçerli")],
      [true, "2 fotoğraf"],
      [true, "Sonuç ve kanaat: " + (/^Kusurlu|Ağır/.test(s) && MV.kusurSinifli(t) ? "giderilene kadar kullanılamaz" : "kullanılabilir")]
    ];
  }
  function onayCiz(r) {
    if (!r || r.durum !== "onayda" || brans(r) !== BRANS) {
      $("a-nesne").innerHTML = MK.kirinti([["Onaylar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Rapor kuyrukta değil</h1>' +
        MK.bos({ ikon: "circle-check", baslik: "Rapor kuyrukta değil", metin: r ? "Bu rapor onayınızı beklemiyor (" + MV.raporDurum(r).ad.toLocaleLowerCase("tr") + ")." : "Bu adreste rapor yok.",
          eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Kuyruğa dön</a>" });
      return;
    }
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), q = kuyruk(), sira = q.indexOf(r);
    $("a-nesne").innerHTML = MK.kirinti([["Onaylar", "#/"], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + r.no + "</h1>" + rozet(MV.raporDurum(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(ts.ad) + " · " + kacis(MV.kisi(r.kisi).ad) + " · " + (sira + 1) + " / " + q.length + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "geri-ac", ad: "Geri gönder", ikon: "undo-2", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "onayla", ad: "Onayla", ikon: "check" }) + "</div></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-ozet"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ozet">Gözden geçirme</h2><span class="a-sayac">' + bekleme(r.gonderildi) + " bekliyor</span></div>" +
        '<ul class="a-kosullar">' + ozet(r).map(function (x) { return '<li class="' + (x[0] ? "a-kosul-tamam" : "a-kosul-eksik") + '">' + ikon(x[0] ? "circle-check" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x[1]) + "</span></li>"; }).join("") + "</ul></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">Rapor (PDF önizlemesi)</h2><span class="a-sayac">imzasız</span></div>' + MB.belge(t, MV.raporBelge(r)) + "</section>" +
      '<div class="a-eylem-cubugu a-eylem-cubugu-alt">' + MK.tus({ eylem: "geri-ac", ad: "Geri gönder", ikon: "undo-2", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "onayla", ad: "Onayla", ikon: "check" }) + "</div>";
  }
  var sonraki = function (r) { var q = kuyruk(), i = q.indexOf(r); return q[i + 1] || q[0] || null; };

  /* ── GERİ GÖNDER PENCERESİ ─────────────────────────────────────────────────────────────────────────── */
  var W = null;
  function pencereCiz(odak) {
    $("a-pencere-baslik").textContent = "Geri gönder · " + W.r.no;
    $("a-pencere-govde").innerHTML = '<div class="a-serit-kap">' + MK.serit("bilgi", "undo-2", "Rapor taslağa döner ve " + kacis(MV.kisi(W.r.kisi).ad) + " düzeltir; gerekçe raporun üstünde görünür ve geçmişte saklanır.") + "</div>" +
      '<div class="a-alan-grup"><label class="a-etiket" for="w-gerekce">Gerekçe <span class="a-zorunlu">zorunlu</span></label><textarea class="a-alan" id="w-gerekce" data-alan="gerekce" maxlength="400"' + (W.hata ? ' aria-invalid="true"' : "") +
        ' aria-describedby="w-gerekce-ipucu" placeholder="Hangi bölümde ne eksik ya da yanlış">' + kacis(W.gerekce) + "</textarea>" +
        '<p class="a-ipucu' + (W.hata ? " a-ipucu-uyari" : "") + '" id="w-gerekce-ipucu">' + (W.hata || "En az 10 karakter; inspector bu metni görür.") + "</p></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "geri-gonder", ad: "Geri gönder", ikon: "undo-2" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(r) { W = { r: r, gerekce: "", hata: "" }; pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-gerekce").focus(); }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var m = /^#\/r\/([A-Za-z0-9-]+)(\/geri)?$/.exec(location.hash);
    return m ? { v: "rapor", no: m[1], pencere: !!m[2] } : { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), rp = r.no ? MV.rapor(r.no) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("o"); MK.suzgecKur("o"); } else onayCiz(rp);
    MK.menuSayi(15, kuyruk().length);
    document.title = (r.v === "rapor" ? (rp ? rp.no + " · onay" : "Rapor bulunamadı") : "Onaylar") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere && rp && rp.durum === "onayda") pencereAc(rp); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["onayla"] = function () {
    var r = MV.rapor(rota().no), s = sonraki(r);
    r.durum = "onaylandi"; r.onay = { kim: BEN, zaman: MK.simdi() };
    s = s === r ? null : s;
    location.hash = s ? "#/r/" + s.no : "#/";
    MK.bildir(r.no + " onaylandı; " + MV.kisi(r.kisi).ad + " son imzayı atınca müşteriye açılır." + (s ? " Sıradaki rapor açıldı." : " Kuyruk boş."));
  };
  X["geri-ac"] = function () { pencereAc(MV.rapor(rota().no)); };
  X["geri-gonder"] = function () {
    if (W.gerekce.trim().length < 10) { W.hata = "Gerekçe en az 10 karakter olmalı: inspector neyi düzelteceğini bilmeli."; pencereCiz("w-gerekce"); return; }
    var r = W.r, s = sonraki(r);
    r.durum = "taslak"; r.geri = { kim: BEN, zaman: MK.simdi(), gerekce: W.gerekce.trim() }; r.gonderildi = null;
    $("a-pencere").close(); s = s === r ? null : s;
    location.hash = s ? "#/r/" + s.no : "#/";
    MK.bildir(r.no + " geri gönderildi; " + MV.kisi(r.kisi).ad + " raporun üstünde gerekçeyi görür.");
  };
  MK.onGirdi = function (e) { if (W && e.target.id === "w-gerekce") W.gerekce = e.target.value; };
  $("a-pencere").addEventListener("close", function () { W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", "#/r/" + r.no); });

  MK.kabuk({ modul: 15, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici · Inspector" }, sayac: { 15: "Onayınızı bekleyen rapor" } });
  goster(false);
})();
