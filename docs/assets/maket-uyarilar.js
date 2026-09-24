/* ══ probata MAKET M10 — Uyarılar (modül 20) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════════════════════════════
   Kaynak: pkproje.md §3 (kalibrasyon bitişine 30 gün kala uyarı; kalibrasyonu geçmiş cihazla rapor onaya gönderilemez), §3.1 modül 10 ve 20
   (eğitim tekrarı bitmeden uyarı), anayasa 1.3 (reisim demeden bildirim KURULMAZ: uyarı yalnız ekranda — bu liste, menü sayacı ve ilgili
   sayfalardaki şeritler; e-posta, SMS, anlık bildirim yok). Yalnız reisim'in istedikleri: KALİBRASYON BİTİŞİ ve EĞİTİM TEKRARI; ötekiler soru.
   Uyarı koşula bağlıdır: koşul kalkınca (kalibrasyon yenilenince, eğitim tekrarlanınca) kendiliğinden düşer; "okundu" yok (soru).
   Kullanıcı: Ayşe Demir (firma yöneticisi, hepsini görür; inspector yalnız kendisininkini — rol × modül önerisi). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var kalan = function (iso) { return MK.gunFarki(MK.BUGUN, iso); };
  var DURUM = { gecti: { ad: "Süresi geçti", rozet: "a-rozet-red" }, yakin: { ad: "Yaklaşıyor", rozet: "a-rozet-bekliyor" } };
  /* uyarılar kayıtlardan türetilir (ayrı "uyarı" kaydı yok): kalibrasyon ≤ 30 gün, eğitim tekrarı ≤ 60 gün */
  function uyarilar() {
    var l = [];
    MV.VARLIKLAR.forEach(function (v) {
      var d = MV.kalDurum(v); if (d !== "gecti" && d !== "yakin") return;
      var k = MV.kimde(v.id);
      l.push({ id: "k-" + v.id, tur: "kal", ikon: "gauge", konu: v.env + " · " + v.ad, alt: "Kalibrasyon", kisi: k, tarih: v.bitis, durum: d,
        href: MK.adres(8, "#/c/" + v.id), sonuc: d === "gecti" ? (k !== "depo" ? MV.kisi(k).ad + " raporlarını onaya gönderemez" : "depoda") : "30 gün içinde bitiyor" });
    });
    MV.EGITIMLER.forEach(function (x) {
      var d = MV.egitimDurum(x); if (d !== "gecti" && d !== "yakin") return;
      l.push({ id: "e-" + x.id, tur: "egt", ikon: "graduation-cap", konu: MV.egitimTuru(x.k).ad, alt: "Eğitim tekrarı", kisi: x.kisi, tarih: x.tekrar, durum: d,
        href: MK.adres(10, "#/?kisi=" + x.kisi) || MK.adres(2, "#/p/" + x.kisi), sonuc: d === "gecti" ? "tekrar gerekli" : "60 gün içinde" });
    });
    return l;
  }
  var kisiAd = function (k) { return MV.yerAdi(k); };

  MK.suzgecTanimla("u", { ad: "Uyarılarda ara", ipucu: "Cihaz, eğitim, kişi", birim: "uyarı",
    cipler: [
      { k: "kal", ad: "Kalibrasyon", grup: "tur", test: function (u) { return u.tur === "kal"; } },
      { k: "egt", ad: "Eğitim tekrarı", grup: "tur", test: function (u) { return u.tur === "egt"; } },
      { k: "gecti", ad: "Süresi geçmiş", test: function (u) { return u.durum === "gecti"; } }
    ],
    seciciler: [{ k: "kisi", ad: "Kişi", secenek: function () {
      var l = uyarilar().map(function (u) { return u.kisi; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, kisiAd(k)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (u, v) { return v === "tumu" || u.kisi === v; } }],
    metin: function (u) { return [u.konu, u.alt, kisiAd(u.kisi)].join(" "); },
    imkansiz: "Bir uyarı hem kalibrasyon hem eğitim olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "konu", baslik: "Uyarı", kart: "ust", sira: 1, hucre: function (u) {
      return '<span class="a-hucre-satir">' + ikon(u.ikon, "a-ikon-kucuk") + '<span class="a-adres"><a class="a-ad-bag" href="' + u.href + '">' + kirp(u.konu) + "</a>" + kirp(u.alt, "a-alt-satir") + "</span></span>";
    } },
    { k: "kisi", baslik: "Kimde / kim", kart: "govde", sira: 2, hucre: function (u) { return '<span class="a-kart-etiket">' + (u.tur === "kal" ? "Kimde" : "Kişi") + "</span>" + kirp(kisiAd(u.kisi)); } },
    { k: "tarih", baslik: "Bitiş / tekrar", kart: "govde", sira: 3, hucre: function (u) { return '<span class="a-kart-etiket">' + (u.tur === "kal" ? "Kalibrasyon bitişi" : "Tekrar tarihi") + "</span>" + MK.tarihYaz(u.tarih); } },
    { k: "kalan", baslik: "Kalan", kart: "govde", sira: 4, hucre: function (u) {
      var k = kalan(u.tarih);
      return '<span class="a-kart-etiket">Kalan</span><span><span class="' + (k < 0 ? "a-uyari-metin a-hata-metin" : "a-uyari-metin") + '">' + (k < 0 ? -k + " gün geçti" : k === 0 ? "bugün" : k + " gün") + '</span><span class="a-alt-satir">' + kacis(u.sonuc) + "</span></span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (u) { return rozet(DURUM[u.durum]); } }
  ];
  function listeCiz() {
    var l = uyarilar();
    MK.menuSayi(20, l.length);
    $("a-uyari").innerHTML = '<div class="a-serit-kap">' + MK.serit("bilgi", "alarm-clock", "Uyarılar yalnız ekranda: bu liste, menüdeki sayaç ve ilgili sayfalardaki şeritler. E-posta, SMS ya da anlık bildirim gönderilmez. Koşul kalkınca uyarı kendiliğinden düşer.") + "</div>";
    MK.listeCiz({ on: "u", kayitlar: l, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (x) { return x.slice().sort(function (a, b) { return a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : 0; }); },
      bosVeri: { ikon: "circle-check", baslik: "Uyarı yok", metin: "Kalibrasyonu 30 gün içinde biten cihaz ve tekrarı 60 gün içinde gelen eğitim yok." },
      tablo: { baslik: "Uyarılar", sinif: "a-tablo-uyari", sutunlar: SUTUN, href: function (u) { return u.href; } } });
    $("a-sayfa").innerHTML = "";
  }
  function goster(odakla) {
    $("a-suzgec-kap").innerHTML = MK.suzgecHtml("u"); MK.suzgecKur("u");
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik h1"); if (h) h.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.kabuk({ modul: 20, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" }, sayac: { 20: "Süresi geçen ya da yaklaşan" } });
  var q = /[?&]tur=(kalibrasyon|egitim)/.exec(location.hash);
  if (q) SZ.u.secili = [q[1] === "kalibrasyon" ? "kal" : "egt"];
  goster(false);
})();
