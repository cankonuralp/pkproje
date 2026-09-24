/* ══ probata MAKET M15 — Performans ve Raporlama (modül 19, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════════════════════
   Kaynak: pkproje.md §1.1 ("personellerin yaptığı işler, gün başı işler vb takip edilecek grafikleri oluşturulacak, gün başı rapor elde
   edilen kazanç vb … kısaca personel performans takip sistemi de olacak"), §3.1 modül 19 (personel bazında günlük iş, rapor sayısı, kazanç,
   grafik), §3.2 madde 5 (kazanç rapora bağlı teklif kaleminin birim fiyatından).
   Ekranlar: pano (#/: özet yüzler, gün başı / aylık rapor grafiği, personel başına kazanç, personel tablosu) · kişi (#/p/<id>: aynı ölçüler
   yalnız o kişi için + günlük iş listesi). Dönem (bu ay · bu yıl · geçen yıl) ve branş görünüm anahtarıdır (kalıp 8: süzgeç değil).
   Sayılar MV.RAPORLAR'dan türer (başka maketlerle aynı raporlar). Grafik dış kütüphanesiz, HTML + var olan renk değişkenleri.
   Kullanıcı: Ayşe Demir (firma yöneticisi). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, SZ = MK.SZ;
  var DONEM = {
    ay: { ad: "Bu ay", bas: "2026-09-01", bit: MK.BUGUN, grup: "gun", alt: "1–23 Eylül 2026" },
    yil: { ad: "Bu yıl", bas: "2026-01-01", bit: MK.BUGUN, grup: "ay", alt: "Ocak–Eylül 2026" },
    gecen: { ad: "Geçen yıl", bas: "2025-01-01", bit: "2025-12-31", grup: "ay", alt: "Ocak–Aralık 2025" }
  };
  var BRANS = { tumu: "Tümü", m: "Mekanik", e: "Elektrik" };
  var D = { donem: "ay", brans: "tumu" };
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var tl = function (n) { return Math.round(n).toLocaleString("tr-TR") + " TL"; };
  var gun = function (r) { return r.olustu.slice(0, 10); };
  var rBrans = function (r) { return MV.tur(MV.ekipman(r.kod).tur).b; };
  var kBrans = function (p) { return MV.meslek(p.meslek).b; };
  /* sayılan rapor: onaya gönderilmiş ya da imzalı (hiç gönderilmemiş taslak sayılmaz — VARSAYIM, soru) */
  var sayilan = function (r) { return !!r.gonderildi || r.durum === "imzali"; };
  function raporlar(kisi) {
    var d = DONEM[D.donem];
    return MV.RAPORLAR.filter(function (r) { var g = gun(r); return sayilan(r) && g >= d.bas && g <= d.bit && (kisi ? r.kisi === kisi : D.brans === "tumu" || rBrans(r) === D.brans); });
  }
  function geriler(kisi) {
    var d = DONEM[D.donem];
    return MV.RAPORLAR.filter(function (r) { var g = r.geri && r.geri.zaman.slice(0, 10); return g && g >= d.bas && g <= d.bit && (kisi ? r.kisi === kisi : D.brans === "tumu" || rBrans(r) === D.brans); });
  }
  /* özet: rapor · çalışılan gün (kişi × gün) · gün başı ortalama · kazanç (birim fiyat, KDV hariç) · geri gönderilen */
  function ozet(rl, gl) {
    var gunler = {}; rl.forEach(function (r) { gunler[r.kisi + "|" + gun(r)] = 1; });
    var n = Object.keys(gunler).length, kazanc = rl.reduce(function (t, r) { return t + MV.raporFiyat(r).fiyat; }, 0);
    return { rapor: rl.length, gun: n, ort: n ? rl.length / n : 0, kazanc: kazanc, gunKazanc: n ? kazanc / n : 0, geri: gl.length,
      son: rl.reduce(function (s, r) { return gun(r) > s ? gun(r) : s; }, "") };
  }
  var ortYaz = function (n) { return n ? n.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—"; };
  var yuz = function (ad, ik, sayi, not) { return '<div class="a-yuz"><span class="a-yuz-ust">' + ikon(ik, "a-ikon-kucuk") + ad + '</span><span class="a-yuz-sayi">' + sayi + "</span>" + (not ? '<span class="a-yuz-not">' + not + "</span>" : "") + "</div>"; };
  function yuzler(o) {
    return '<div class="a-yuzler">' + yuz("Rapor", "file-text", o.rapor, "onaya gönderilen ya da imzalı") + yuz("Çalışılan gün", "calendar-check", o.gun, "kişi × gün") +
      yuz("Gün başı rapor", "gauge", ortYaz(o.ort), "ortalama") + yuz("Kazanç", "wallet", tl(o.kazanc), "KDV hariç · gün başı " + (o.gun ? tl(o.gunKazanc) : "—")) +
      yuz("Geri gönderilen", "undo-2", o.geri, "yönetici onayından dönen") + "</div>";
  }

  /* ── GRAFİK — tek üretici: yatay çubuk satırları (telefonda da okunur; dış kütüphane yok). satirlar: [{ etiket, parcalar: [[seri, değer]],
     deger (yazı), alt (yazı) }] · seriler: [[seri, ad]]. Ekran okuyucu için aynı veri gizli tabloda. ─────────────────────────────────── */
  function grafik(o) {
    var enc = Math.max.apply(null, o.satirlar.map(function (s) { return s.parcalar.reduce(function (t, p) { return t + p[1]; }, 0); }).concat([1]));
    return '<figure class="a-grafik"><div class="a-grafik-bas"><figcaption class="a-grafik-baslik">' + o.baslik + "</figcaption>" +
        (o.seriler.length > 1 ? '<ul class="a-grafik-lejant">' + o.seriler.map(function (s) { return '<li><span class="a-grafik-renk a-seri-' + s[0] + '"></span>' + s[1] + "</li>"; }).join("") + "</ul>" : "") + "</div>" +
      (o.satirlar.length ? '<div class="a-grafik-satirlar" aria-hidden="true">' + o.satirlar.map(function (s) {
        return '<div class="a-grafik-satir"><span class="a-grafik-etiket">' + kirp(s.etiket) + '</span><span class="a-grafik-cubuk">' +
          s.parcalar.filter(function (p) { return p[1] > 0; }).map(function (p) { return '<span class="a-seri-' + p[0] + '" style="width:' + (p[1] * 100 / enc).toFixed(2) + '%"></span>'; }).join("") +
          '</span><span class="a-grafik-deger">' + s.deger + (s.alt ? '<span class="a-alt-satir">' + s.alt + "</span>" : "") + "</span></div>";
      }).join("") + "</div>" : '<p class="a-bos-satir">Bu dönemde rapor yok.</p>') +
      '<table class="a-gizli"><caption>' + o.baslik + "</caption><thead><tr><th scope=\"col\">" + o.ilkSutun + '</th><th scope="col">Değer</th></tr></thead><tbody>' +
        o.satirlar.map(function (s) { return "<tr><th scope=\"row\">" + kacis(s.etiket) + "</th><td>" + s.deger + (s.alt ? " · " + s.alt : "") + "</td></tr>"; }).join("") + "</tbody></table></figure>";
  }
  /* zaman grafiği: bu ay → rapor yazılan günler (gün başı); yıl → aylar (boş ay da görünür) */
  function zamanGrafigi(rl) {
    var d = DONEM[D.donem], gruplar = [];
    if (d.grup === "gun") {
      var g = {}; rl.forEach(function (r) { (g[gun(r)] = g[gun(r)] || []).push(r); });
      gruplar = Object.keys(g).sort().map(function (k) { return [MK.gunYaz(k), g[k]]; });
    } else {
      var a0 = +d.bas.slice(5, 7), a1 = +d.bit.slice(5, 7), y = d.bas.slice(0, 4);
      for (var a = a0; a <= a1; a++) { var ay = y + "-" + ("0" + a).slice(-2); gruplar.push([AYLAR[a - 1], rl.filter(function (r) { return gun(r).slice(0, 7) === ay; })]); }
    }
    return grafik({ baslik: d.grup === "gun" ? "Gün başı rapor ve kazanç" : "Aylık rapor ve kazanç", ilkSutun: d.grup === "gun" ? "Gün" : "Ay",
      seriler: [["m", "Mekanik"], ["e", "Elektrik"]],
      satirlar: gruplar.map(function (x) {
        var m = x[1].filter(function (r) { return rBrans(r) === "m"; }).length, e = x[1].length - m, k = x[1].reduce(function (t, r) { return t + MV.raporFiyat(r).fiyat; }, 0);
        return { etiket: x[0], parcalar: [["m", m], ["e", e]], deger: x[1].length ? x[1].length + " rapor" : "—", alt: x[1].length ? tl(k) : "" };
      }) });
  }

  /* ── PANO ──────────────────────────────────────────────────────────────────────────────────────────── */
  var KISILER = MV.PERSONEL.filter(function (p) { return p.durum === "etkin" && p.hesap && p.hesap.roller.indexOf("inspector") >= 0; });
  var kisiOz = function (p) { return ozet(raporlar(p.id), geriler(p.id)); };
  MK.suzgecTanimla("p", { ad: "Personelde ara", ipucu: "Ad, meslek", birim: "kişi", cipler: [],
    seciciler: [{ k: "gorunum", ad: "Görünüm", bas: "yazan", secenek: function () { return [["yazan", "Rapor yazanlar"], ["hepsi", "Bütün inspector'lar"]]; },
      gecer: function (p, v) { return v === "hepsi" || p.o.rapor > 0 || p.o.geri > 0; } },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: function () {
      return [["varsayilan", "Kazanç (çoktan aza)"], ["rapor-azalan", "Rapor (çoktan aza)"], ["ort-azalan", "Gün başı (çoktan aza)"], ["ad-artan", "Ad (A–Z)"]].concat(
        ["varsayilan", "rapor-azalan", "ort-azalan", "ad-artan"].indexOf(SZ.p.sec.sira) < 0 ? [[SZ.p.sec.sira, "Sütun başlığından"]] : []);
    }, gecer: function () { return true; } }],
    metin: function (p) { return [p.ad, MV.meslekAd(p)].join(" "); }, imkansiz: "" }, function () { kisiListeCiz(); });
  var K_SUTUN = [
    { k: "ad", baslik: "Personel", kart: "ust", sira: 1, hucre: function (p) { return '<a class="a-ad-bag" href="#/p/' + p.id + '">' + kacis(p.ad) + "</a>" + kirp(MV.meslekAd(p), "a-alt-satir"); } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 2, hucre: function (p) { return '<span class="a-kart-etiket">Rapor</span><span class="a-sayi">' + p.o.rapor + "</span>"; } },
    { k: "gun", baslik: "Gün", kart: "govde", sira: 3, hucre: function (p) { return '<span class="a-kart-etiket">Çalışılan gün</span><span class="a-sayi">' + p.o.gun + "</span>"; } },
    { k: "ort", baslik: "Gün başı", kart: "govde", sira: 4, hucre: function (p) { return '<span class="a-kart-etiket">Gün başı rapor</span><span class="a-sayi">' + ortYaz(p.o.ort) + "</span>"; } },
    { k: "kazanc", baslik: "Kazanç (KDV hariç)", kart: "govde", sira: 5, hucre: function (p) { return '<span class="a-kart-etiket">Kazanç (KDV hariç)</span><span class="a-sayi">' + (p.o.kazanc ? tl(p.o.kazanc) : "—") + "</span>"; } },
    { k: "geri", baslik: "Geri gönderilen", kart: "govde", sira: 6, hucre: function (p) { return '<span class="a-kart-etiket">Geri gönderilen</span><span class="a-sayi' + (p.o.geri ? " a-uyari-metin" : "") + '">' + p.o.geri + "</span>"; } },
    { k: "son", baslik: "Son rapor", kart: "govde", sira: 7, hucre: function (p) { return '<span class="a-kart-etiket">Son rapor</span>' + (p.o.son ? MK.gunKisa(p.o.son) : '<span class="a-deger-yok">—</span>'); } }
  ];
  function kisiListeCiz() {
    var l = KISILER.filter(function (p) { return D.brans === "tumu" || kBrans(p) === D.brans; }).map(function (p) { return Object.assign({}, p, { o: kisiOz(p) }); });
    MK.listeCiz({ on: "p", kayitlar: l, sayacId: "a-p-sayac", listeId: "a-p-liste",
      sirala: function (x) {
        var v = SZ.p.sec.sira, k = v === "varsayilan" ? "kazanc" : v.replace(/-(artan|azalan)$/, ""), yon = v === "varsayilan" || /-azalan$/.test(v) ? -1 : 1;
        return x.slice().sort(function (a, b) { var p = k === "ad" ? a.ad : a.o[k], q = k === "ad" ? b.ad : b.o[k];
          return (k === "ad" ? p.localeCompare(q, "tr") : p < q ? -1 : p > q ? 1 : 0) * yon || a.ad.localeCompare(b.ad, "tr"); });
      },
      bosVeri: { ikon: "users", baslik: "Inspector yok", metin: "Inspector rolündeki personel burada görünür." },
      tablo: { baslik: "Personel performansı", sinif: "a-tablo-perf", sutunlar: K_SUTUN, sz: "p", href: function (p) { return "#/p/" + p.id; } } });
  }
  /* kişi sayfasında branş anahtarı yok (kişinin raporlarının hepsi; pano branşı orada uygulanmaz) */
  function anahtarlar(kisi) {
    return '<div class="a-pano-anahtar"><div class="a-sekmeler" role="group" aria-label="Dönem">' + Object.keys(DONEM).map(function (k) {
        return '<button type="button" class="a-sekme" data-donem="' + k + '" aria-pressed="' + (D.donem === k) + '">' + DONEM[k].ad + "</button>"; }).join("") + "</div>" +
      (kisi ? "" : '<div class="a-sekmeler" role="group" aria-label="Branş">' + Object.keys(BRANS).map(function (k) {
        return '<button type="button" class="a-sekme" data-brans="' + k + '" aria-pressed="' + (D.brans === k) + '">' + BRANS[k] + "</button>"; }).join("") + "</div>") +
      '<p class="a-pano-donem">' + DONEM[D.donem].alt + (!kisi && D.brans !== "tumu" ? " · " + BRANS[D.brans].toLocaleLowerCase("tr") : "") + "</p></div>";
  }
  function panoCiz() {
    var rl = raporlar(), o = ozet(rl, geriler());
    var kazanclar = KISILER.map(function (p) { return { p: p, o: kisiOz(p) }; }).filter(function (x) { return x.o.kazanc > 0; }).sort(function (a, b) { return b.o.kazanc - a.o.kazanc; });
    $("a-pano").innerHTML = '<div class="a-sayfa-bas"><h1 tabindex="-1">Performans</h1></div>' + anahtarlar() + yuzler(o) +
      '<div class="a-grafikler">' + zamanGrafigi(rl) +
        grafik({ baslik: "Personel başına kazanç", ilkSutun: "Personel", seriler: [["k", "Kazanç"]], satirlar: kazanclar.map(function (x) {
          return { etiket: x.p.ad, parcalar: [["k", x.o.kazanc]], deger: tl(x.o.kazanc), alt: x.o.rapor + " rapor · " + x.o.gun + " gün" };
        }) }) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-kisi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kisi">Personel</h2><span class="a-sayac" id="a-p-sayac"></span></div>' +
        '<p class="a-bolum-aciklama">Kazanç, raporun bağlı olduğu teklif kaleminin birim fiyatı (KDV hariç; teklif yoksa fiyat listesi) — raporu yazan inspector\'a yazılır.</p>' +
        MK.suzgecHtml("p") + '<div class="a-liste-kap" id="a-p-liste"></div></section>';
    MK.suzgecKur("p");
  }

  /* ── KİŞİ ──────────────────────────────────────────────────────────────────────────────────────────── */
  var isNo = function (r) { var x = MV.ISLER.filter(function (i) { return i.raporlar.indexOf(r.no) >= 0; })[0]; return x ? x.no : null; };
  var G_SUTUN = [
    { k: "gun", baslik: "Gün", kart: "ust", sira: 1, hucre: function (g) { return MK.gunYaz(g.gun); } },
    { k: "is", baslik: "İş / tesis", kart: "govde", sira: 2, hucre: function (g) {
      var t = MV.tesis(g.tesis); return "<span>" + (g.is ? '<a class="a-no" href="' + MK.adres(18, "#/is/" + g.is) + '">' + g.is + "</a>" : '<span class="a-deger-yok">İş kaydı yok</span>') + kirp(MV.musteri(t.m).kisa + " · " + t.ad, "a-alt-satir") + "</span>";
    } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 3, hucre: function (g) { return '<span class="a-kart-etiket">Rapor</span><span class="a-sayi">' + g.rl.length + "</span>"; } },
    { k: "kazanc", baslik: "Kazanç (KDV hariç)", kart: "govde", sira: 4, hucre: function (g) { return '<span class="a-kart-etiket">Kazanç (KDV hariç)</span><span class="a-sayi">' + tl(g.kazanc) + "</span>"; } },
    { k: "durum", baslik: "İmzalı", kart: "rozet", sira: 1, hucre: function (g) {
      var n = g.rl.filter(function (r) { return r.durum === "imzali"; }).length;
      return MK.rozet({ ad: n + " / " + g.rl.length + " imzalı", rozet: n === g.rl.length ? "a-rozet-tamam" : n ? "a-rozet-kabul" : "a-rozet-notr" });
    } }
  ];
  function kisiCiz(p) {
    if (!p) {
      $("a-nesne").innerHTML = MK.kirinti([["Performans", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Kişi bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Kişi bulunamadı", metin: "Bu adreste inspector yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Panoya dön</a>" });
      return;
    }
    var rl = raporlar(p.id), o = ozet(rl, geriler(p.id)), g = {};
    rl.forEach(function (r) { var k = gun(r) + "|" + r.tesis; (g[k] = g[k] || { gun: gun(r), tesis: r.tesis, is: isNo(r), rl: [], kazanc: 0 }); g[k].rl.push(r); g[k].kazanc += MV.raporFiyat(r).fiyat; });
    var gunluk = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.gun < b.gun ? 1 : -1; });
    $("a-nesne").innerHTML = MK.kirinti([["Performans", "#/"], [p.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("id-card", "a-ikon-kucuk") + "<span>" + kacis(MV.meslekAd(p)) + " · " + MV.bransAd(kBrans(p)) + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="' + MK.adres(2, "#/p/" + p.id) + '">' + ikon("user", "a-ikon-kucuk") + "Personel kartı</a></div></div>" +
      anahtarlar(true) + yuzler(o) + '<div class="a-grafikler a-grafikler-tek">' + zamanGrafigi(rl) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-gunluk"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gunluk">Günlük iş</h2><span class="a-sayac"><b>' + gunluk.length + "</b> gün × tesis</span></div>" +
        (gunluk.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Günlük iş", sinif: "a-tablo-gunluk", sutunlar: G_SUTUN, kayitlar: gunluk }) + "</div>" : '<p class="a-bos-satir">Bu dönemde rapor yok.</p>') + "</section>";
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() { var m = /^#\/p\/([a-z0-9]+)$/.exec(location.hash); return m ? { v: "kisi", id: m[1] } : { v: "pano" }; }
  function goster(odakla) {
    var r = rota();
    $("a-pano").hidden = r.v !== "pano"; $("a-nesne").hidden = r.v !== "kisi";
    var p = r.v === "kisi" ? KISILER.filter(function (x) { return x.id === r.id; })[0] : null;
    if (r.v === "pano") panoCiz(); else kisiCiz(p);
    document.title = (p ? p.ad + " · performans" : "Performans") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  /* dönem ve branş: görünüm anahtarı; basılınca aynı ekran yeniden çizilir, odak basılan tuşta kalır */
  MK.onTikla = function (e) {
    var b = e.target.closest("[data-donem],[data-brans]"); if (!b) return false;
    if (b.dataset.donem) D.donem = b.dataset.donem; else D.brans = b.dataset.brans;
    goster(false);
    var yeni = document.querySelector(b.dataset.donem ? '[data-donem="' + D.donem + '"]' : '[data-brans="' + D.brans + '"]'); if (yeni) yeni.focus();
    return true;
  };

  MK.kabuk({ modul: 19, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
