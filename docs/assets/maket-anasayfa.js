/* ══ probata MAKET M1 — Ana sayfa · 2. TUR, ONAY BEKLİYOR (2026-09-25) ════════════════════════════════════════════════
   Reisim (M1, soru 41): "Role göre ama herkes için bir anasayfa olmalı." → girişten sonra herkes Ana sayfa'ya gelir; içerik
   kişinin rolüne göre: o gün yapılacak işler (tıklanır bilgi yüzleri) + bir iş listesi. Birden çok rolü olan kişi her rolün
   bölümünü alt alta görür (makette tek rol seçilir). Sayılar öteki maketlerin ORTAK verisinden (MV): planlar tesis kayıtlarında,
   raporlar MV.RAPORLAR, cihaz ve zimmet MV.VARLIKLAR, eğitim MV.EGITIMLER. Bildirim yok (anayasa 1.3): yalnız ekranda.
   Arayüzde hitap yok (anayasa 0.11): "Günaydın" yazılmaz. Veri UYDURMA; "bugün" 23 Eylül 2026. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, rozet = MK.rozet, BUGUN = MK.BUGUN;
  /* makette her rolün temsilcisi (ortak veriden) */
  var KISI = { planlama: "za", inspector: "mk", mekyon: "sy", elkyon: "co", yonetici: "ad" };
  var ACIK = ["bekliyor", "kabul", "denetimde"];
  var planlar = function (f) { return MV.TESISLER.filter(function (t) { return t.pid && (!f || f(t)); }).sort(function (a, b) { return a.ptarih < b.ptarih ? -1 : a.ptarih > b.ptarih ? 1 : a.pid - b.pid; }); };
  var raporBrans = function (r) { return MV.tur(MV.ekipman(r.kod).tur).b; };
  var kalUyari = function () { return MV.VARLIKLAR.filter(function (v) { var k = MV.kalDurum(v); return k === "gecti" || k === "yakin"; }); };
  var saatFarki = function (a) { var d = (new Date(MK.simdi() + ":00") - new Date(a + ":00")) / 36e5; return d < 24 ? Math.max(1, Math.round(d)) + " saattir" : Math.round(d / 24) + " gündür"; };

  function yuz(o) {
    return '<a class="a-yuz" href="' + o.href + '"><span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" +
      (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "") + "</a>";
  }
  var planSatir = function (t) {
    return { no: t.plan, tesis: t.ad, musteri: MV.musteri(t.m).kisa, tarih: t.ptarih, saat: t.psaat, durum: t.pdurum, ekip: t.pekip, href: "planlarim.html#/plan/" + t.pid };
  };
  var PLAN_SUTUN = [
    { k: "plan", baslik: "Plan", kart: "ust", sira: 1, hucre: function (p) {
      return '<a class="a-no" href="' + p.href + '">' + p.no + '</a><span class="a-alt-satir">' + kacis(p.musteri + " · " + p.tesis) + "</span>";
    } },
    { k: "tarih", baslik: "Başlangıç", kart: "govde", sira: 2, hucre: function (p) {
      return '<span class="a-kart-etiket">Başlangıç</span><span class="a-tarih-saat">' + MK.gunYaz(p.tarih) + (p.saat ? " · " + p.saat[0] : "") + "</span>" +
        (p.tarih === BUGUN ? '<span class="a-bugun">Bugün</span>' : "");
    } },
    { k: "ekip", baslik: "Inspector", kart: "govde", sira: 3, hucre: function (p) {
      return '<span class="a-kart-etiket">Inspector</span>' + kacis(p.ekip.map(function (k) { return MV.kisi(k).ad; }).join(", "));
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) { return rozet(MV.PLAN_DURUM[p.durum]); } }
  ];
  var KUYRUK_SUTUN = [
    { k: "plan", baslik: "Rapor", kart: "ust", sira: 1, hucre: function (r) {
      var e = MV.ekipman(r.kod);
      return '<a class="a-no" href="onaylar.html#/r/' + r.no + '">' + r.no + '</a><span class="a-alt-satir">' + kacis(e.kod + " · " + MV.tur(e.tur).ad) + "</span>";
    } },
    { k: "tarih", baslik: "Gönderildi", kart: "govde", sira: 2, hucre: function (r) {
      return '<span class="a-kart-etiket">Gönderildi</span><span class="a-tarih-saat">' + MK.zamanYaz(r.gonderildi) + '</span><span class="a-alt-satir">' + saatFarki(r.gonderildi) + " bekliyor</span>";
    } },
    { k: "ekip", baslik: "Inspector", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Inspector</span>' + kacis(MV.kisi(r.kisi).ad); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(MV.RAPOR_DURUM.onayda); } }
  ];
  var TESIS_SUTUN = [
    { k: "plan", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (t) {
      return '<a class="a-no" href="musteriler.html#/t/' + t.id + '">' + kacis(t.ad) + '</a><span class="a-alt-satir">' + kacis(MV.musteri(t.m).kisa + " · " + t.il) + "</span>";
    } },
    { k: "tarih", baslik: "Sonraki kontrol", kart: "govde", sira: 2, hucre: function (t) {
      var k = MK.gunFarki(BUGUN, t.sonraki);
      return '<span class="a-kart-etiket">Sonraki kontrol</span><span class="a-tarih-saat">' + MK.tarihYaz(t.sonraki) + "</span>" +
        '<span class="a-alt-satir' + (k < 0 ? " a-uyari-metin" : "") + '">' + (k < 0 ? -k + " gün geçti" : k === 0 ? "bugün" : k + " gün kaldı") + "</span>";
    } },
    { k: "ekip", baslik: "Ekipman", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">Ekipman</span>' + t.ekipman; } },
    { k: "durum", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (t) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar"><a class="a-tus a-tus-birincil" href="plan-ac.html#/?tesis=' + t.id + '">' + ikon("calendar-check", "a-ikon-kucuk") + "Plan aç</a></div></div>";
    } }
  ];
  function liste(baslik, sinif, sutunlar, kayitlar, bos, tum) {
    return '<section class="a-bolum" aria-labelledby="a-b-liste"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-liste">' + baslik + "</h2>" +
        '<span class="a-sayac"><b>' + kayitlar.length + "</b></span>" + (tum ? '<div class="a-eylem-cubugu a-bolum-tus">' + tum + "</div>" : "") + "</div>" +
      (kayitlar.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: baslik, sinif: "a-tablo-ana " + sinif, sutunlar: sutunlar, kayitlar: kayitlar }) + "</div>"
        : '<p class="a-bos-satir">' + bos + "</p>") + "</section>";
  }
  var tumu = function (href, ad) { return '<a class="a-tus a-tus-ikincil" href="' + href + '">' + ad + ikon("arrow-right", "a-ikon-kucuk") + "</a>"; };

  /* ── ROL BÖLÜMLERİ ──────────────────────────────────────────────────────────────────────────────────── */
  var BOLUM = {
    inspector: function (k) {
      var benim = function (t) { return t.pekip.indexOf(k) >= 0; };
      var bekleyen = planlar(function (t) { return benim(t) && t.pdurum === "bekliyor"; }), denetim = planlar(function (t) { return benim(t) && t.pdurum === "denetimde"; });
      var rap = MV.RAPORLAR.filter(function (r) { return r.kisi === k; }), taslak = rap.filter(function (r) { return r.durum === "taslak"; }), geri = taslak.filter(function (r) { return r.geri; });
      var imza = rap.filter(function (r) { return r.durum === "onaylandi"; });
      var z = MV.VARLIKLAR.filter(function (v) { return MV.kimde(v.id) === k; }), zk = z.filter(function (v) { var d = MV.kalDurum(v); return d === "gecti" || d === "yakin"; });
      return '<div class="a-yuzler">' +
        yuz({ ikon: "calendar-check", ad: "Kabul bekleyen plan", sayi: bekleyen.length, href: "planlarim.html", not: bekleyen.length ? "en yakını " + MK.gunKisa(bekleyen[0].ptarih) : "yok", uyari: bekleyen.length > 0 }) +
        yuz({ ikon: "play", ad: "Denetimdeki plan", sayi: denetim.length, href: "planlarim.html", not: denetim.length ? denetim[0].plan : "yok" }) +
        yuz({ ikon: "file-pen-line", ad: "Taslak rapor", sayi: taslak.length, href: "raporlar.html", not: geri.length ? geri.length + " geri gönderildi" : "onaya gönderilmedi", uyari: geri.length > 0 }) +
        yuz({ ikon: "file-signature", ad: "Son imzanı bekleyen", sayi: imza.length, href: "raporlar.html#/imza", not: "onaylandı, imza bekliyor", uyari: imza.length > 0 }) +
        yuz({ ikon: "package", ad: "Zimmetinde", sayi: z.length, href: "zimmetler.html#/?kisi=" + k, not: zk.length ? zk.length + " cihazın kalibrasyonu uyarıda" : "uyarı yok", uyari: zk.length > 0 }) +
        "</div>" +
        liste("Açık planların", "a-tablo-anaplan", PLAN_SUTUN, planlar(function (t) { return benim(t) && ACIK.indexOf(t.pdurum) >= 0; }).map(planSatir),
          "Açık planın yok.", tumu("planlarim.html", "Planlar"));
    },
    planlama: function () {
      var bekleyen = planlar(function (t) { return t.pdurum === "bekliyor"; }), red = planlar(function (t) { return t.pdurum === "red"; });
      var bugun = planlar(function (t) { return t.ptarih === BUGUN && ACIK.indexOf(t.pdurum) >= 0; });
      var isgEksik = 0;
      planlar(function (t) { return ACIK.indexOf(t.pdurum) >= 0; }).forEach(function (t) {
        t.pekip.forEach(function (k) { var x = MV.isgTesis(t.id).filter(function (y) { return y.k === k; })[0]; if (!x || !MV.isgUygun(x.onay, t.ptarih) || (x.bitis && x.bitis < t.ptarih)) isgEksik++; });
      });
      var yaklasan = MV.TESISLER.filter(function (t) { return !MV.acikPlan(t) && MK.gunFarki(BUGUN, t.sonraki) <= 30; })
        .sort(function (a, b) { return a.sonraki < b.sonraki ? -1 : 1; });
      return '<div class="a-yuzler">' +
        yuz({ ikon: "calendar-check", ad: "Kabul bekleyen plan", sayi: bekleyen.length, href: "planlarim.html", not: "inspector'ın kabulünde" }) +
        yuz({ ikon: "circle-x", ad: "Reddedilen plan", sayi: red.length, href: "planlarim.html", not: red.length ? "yeniden planlanmalı" : "yok", uyari: red.length > 0 }) +
        yuz({ ikon: "clock", ad: "Bugün başlayan plan", sayi: bugun.length, href: "planlarim.html", not: MK.gunYaz(BUGUN) }) +
        yuz({ ikon: "scroll-text", ad: "İSG-KATİP eksiği", sayi: isgEksik, href: "sozlesmeler.html", not: isgEksik ? "açık planlarda" : "yok", uyari: isgEksik > 0 }) +
        "</div>" +
        liste("Kontrolü 30 gün içinde gelen tesisler", "a-tablo-anatesis", TESIS_SUTUN, yaklasan, "Kontrolü yaklaşan tesis yok.", tumu("musteriler.html", "Müşteriler"));
    },
    yonetici: function () {
      var acik = planlar(function (t) { return ACIK.indexOf(t.pdurum) >= 0; });
      var onayda = MV.RAPORLAR.filter(function (r) { return r.durum === "onayda"; }), imza = MV.RAPORLAR.filter(function (r) { return r.durum === "onaylandi"; });
      var eg = MV.EGITIMLER.filter(function (x) { var d = MV.egitimDurum(x); return d === "gecti" || d === "yakin"; });
      var eksik = MV.PERSONEL.filter(function (p) { return p.durum === "etkin" && MV.eksikBilgi(p).length; });
      return '<div class="a-yuzler">' +
        yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: acik.length, href: "planlarim.html", not: "kabul bekleyen, kabul edilen, denetimde" }) +
        yuz({ ikon: "badge-check", ad: "Onayda rapor", sayi: onayda.length, href: "onaylar.html", not: "branş yöneticilerinde" }) +
        yuz({ ikon: "file-signature", ad: "Son imza bekleyen", sayi: imza.length, href: "raporlar.html", not: "inspector'larda" }) +
        yuz({ ikon: "alarm-clock", ad: "Uyarı", sayi: kalUyari().length + eg.length, href: "uyarilar.html", not: kalUyari().length + " kalibrasyon · " + eg.length + " eğitim tekrarı", uyari: true }) +
        yuz({ ikon: "users", ad: "Bilgisi eksik personel", sayi: eksik.length, href: "personel.html", not: eksik.length ? eksik.map(function (p) { return p.ad; }).join(", ") : "yok", uyari: eksik.length > 0 }) +
        "</div>" +
        liste("Bugün başlayan planlar", "a-tablo-anaplan", PLAN_SUTUN, planlar(function (t) { return t.ptarih === BUGUN && ACIK.indexOf(t.pdurum) >= 0; }).map(planSatir),
          "Bugün başlayan plan yok.", tumu("planlarim.html", "Planlar"));
    }
  };
  /* branş yöneticisi: kendi branşının onay kuyruğu (en eski üstte, M9 ile aynı sıra) */
  function yoneticiBolumu(b, k) {
    return function () {
      var kuyruk = MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && raporBrans(r) === b; }).sort(function (x, y) { return x.gonderildi < y.gonderildi ? -1 : 1; });
      var geri = MV.RAPORLAR.filter(function (r) { return r.geri && r.geri.kim === k; });
      var kal = kalUyari().filter(function (v) { return MV.cihazTuru(v.cihazTur).g.some(function (g) { return MV.grup(g).b === b; }); });
      var imza = MV.RAPORLAR.filter(function (r) { return r.durum === "onaylandi" && raporBrans(r) === b; });
      return '<div class="a-yuzler">' +
        yuz({ ikon: "badge-check", ad: "Onayını bekleyen", sayi: kuyruk.length, href: "onaylar.html", not: kuyruk.length ? "en eskisi " + saatFarki(kuyruk[0].gonderildi) : "yok", uyari: kuyruk.length > 0 }) +
        yuz({ ikon: "undo-2", ad: "Geri gönderdiğin", sayi: geri.length, href: "raporlar.html", not: "düzeltme bekliyor" }) +
        yuz({ ikon: "file-signature", ad: "Son imza bekleyen", sayi: imza.length, href: "raporlar.html", not: MV.bransAd(b) + " raporları" }) +
        yuz({ ikon: "gauge", ad: "Kalibrasyon uyarısı", sayi: kal.length, href: "olcum-cihazlari.html", not: MV.bransAd(b) + " cihazları", uyari: kal.length > 0 }) +
        "</div>" +
        liste("Onay kuyruğu", "a-tablo-anakuyruk", KUYRUK_SUTUN, kuyruk.slice(0, 5), "Onay bekleyen rapor yok.", tumu("onaylar.html", "Onaylar"));
    };
  }
  BOLUM.mekyon = yoneticiBolumu("m", "sy");
  BOLUM.elkyon = yoneticiBolumu("e", "co");

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  var rolu = function () { var m = /^#\/(\w+)$/.exec(location.hash); return m && BOLUM[m[1]] ? m[1] : "yonetici"; };
  function ciz(odakla) {
    var r = rolu(), p = MV.kisi(KISI[r]);
    $("a-icerik").innerHTML =
      '<div class="a-sayfa-bas"><h1 tabindex="-1">Ana sayfa</h1><span class="a-sayac">' + MK.gunYaz(BUGUN) + " · " + kacis(p.ad) + "</span>" +
        /* M6 2. tur (80): "Plan aç" yalnız plan açma yetkisi olana (planlama ekibi, firma yöneticisi) */
        (r === "planlama" || r === "yonetici" ? '<a class="a-tus a-tus-birincil a-bolum-tus" href="plan-ac.html#/">' + ikon("calendar-check", "a-ikon-kucuk") + "Plan aç</a>" : "") + "</div>" +
      '<div class="a-pano-anahtar"><span class="a-etiket a-etiket-satir">Makette bakış</span><div class="a-sekmeler" role="group" aria-label="Rol">' +
        MV.ROLLER.map(function (x) { return '<a class="a-sekme" href="#/' + x.k + '"' + (x.k === r ? ' aria-current="page"' : "") + ">" + x.ad + "</a>"; }).join("") + "</div></div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "circle-alert", "Girişten sonra herkes buraya gelir; içerik kişinin rolüne göre değişir. Birden çok rolü olan her rolün bölümünü alt alta görür. (Rol seçimi yalnız makette.)") + "</div>" +
      BOLUM[r](KISI[r]);
    var u = document.querySelector(".a-kullanici");
    if (u) { u.querySelector(".a-avatar").textContent = MV.bas(p.ad); u.querySelector(".a-kullanici-ad").textContent = p.ad; u.querySelector(".a-kullanici-rol").textContent = MV.rol(r).ad; }
    document.title = "Ana sayfa · " + MV.rol(r).ad + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); $("a-icerik").querySelector("h1").focus({ preventScroll: true }); }
  }
  MK.goster = function (odakla) { ciz(odakla); };
  MK.kabuk({ modul: "ana", kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  ciz(false);
})();
