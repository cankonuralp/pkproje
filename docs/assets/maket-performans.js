/* ══ probata MAKET M15 — Performans ve Raporlama (modül 19, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════════════════════
   Kaynak: pkproje.md §1.1 ("personellerin yaptığı işler, gün başı işler vb takip edilecek grafikleri oluşturulacak, gün başı rapor elde
   edilen kazanç vb … kısaca personel performans takip sistemi de olacak"), §3.1 modül 19 (personel bazında günlük iş, rapor sayısı, kazanç,
   grafik), §3.2 madde 5 (kazanç rapora bağlı teklif kaleminin birim fiyatından).
   Ekranlar: pano (#/: özet yüzler, gün başı / aylık rapor grafiği, personel başına kazanç, personel tablosu) · kişi (#/p/<id>: aynı ölçüler
   yalnız o kişi için + günlük iş listesi). Dönem (bu ay · bu yıl · geçen yıl) ve branş görünüm anahtarıdır (kalıp 8: süzgeç değil).
   Sayılar MV.RAPORLAR'dan türer (başka maketlerle aynı raporlar). Grafik dış kütüphanesiz, HTML + var olan renk değişkenleri.
   Kullanıcı: Ayşe Demir (firma yöneticisi). UYDURMA veri.
   2026-09-27 (reisim: "24 saat içinde tamamlandı olan 48 saat içinde tamamlandı olan ve 48 saatten uzun sürede tamamlandı olan raporlara
   dair veri tutularak garfik oluşturularak performans takibide yapılsın"): tamamlanma süresi = rapor açılışından "Tamamlandı"ya (son imza).
   Üç dilim yüz olarak; grafikte kişi başına "24 saat içinde" payı ve "48 saatten uzun" sayısı (her grafik tek seri: renk yalnız kimlik,
   dilimler yazıyla da); personel tablosunda üç sütun. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, SZ = MK.SZ;
  var DONEM = {
    ay: { ad: "Bu ay", bas: "2026-09-01", bit: MK.BUGUN, grup: "gun", alt: "01.09.2026–23.09.2026" },
    yil: { ad: "Bu yıl", bas: "2026-01-01", bit: MK.BUGUN, grup: "ay", alt: "01.01.2026–23.09.2026" },
    gecen: { ad: "Geçen yıl", bas: "2025-01-01", bit: "2025-12-31", grup: "ay", alt: "01.01.2025–31.12.2025" },
    /* 150 (2026-09-26): tarih aralığı — iki tarih yazılıp "Uygula"; 62 günden uzunsa aylık */
    aralik: { ad: "Tarih aralığı", bas: "2025-09-01", bit: MK.BUGUN, grup: "ay", alt: "" }
  };
  var tarihIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s || "").trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  var gg = function (iso) { return iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4); };
  var A = { bas: gg(DONEM.aralik.bas), bit: gg(DONEM.aralik.bit), hata: "" };
  var aralikKur = function () { var d = DONEM.aralik; d.grup = MK.gunFarki(d.bas, d.bit) > 62 ? "ay" : "gun"; d.alt = MK.tarihYaz(d.bas) + " – " + MK.tarihYaz(d.bit); };
  aralikKur();
  /* 148: denetçi yalnız kendi sayılarını görür, kazancını görmez (makette #/ben: Mert Kaya gözünden) */
  var BEN = /^#\/ben/.test(location.hash) ? "mk" : null;
  var BRANS = { tumu: "Tümü", m: "Mekanik", e: "Elektrik" };
  var D = { donem: "ay", brans: "tumu" };
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var tl = function (n) { return Math.round(n).toLocaleString("tr-TR") + " TL"; };
  var gun = function (r) { return r.olustu.slice(0, 10); };
  var rBrans = function (r) { return MV.tur(MV.ekipman(r.kod).tur).b; };
  var kBrans = function (p) { return MV.meslek(p.meslek).b; };
  /* sayılan rapor: "Yeni" durumundan itibaren her rapor (reisim 2026-09-29: "yeni durumundan itibaren her rapor performansı etkiler, taslak
     diye bir aşamamız yok zaten"); pasife alınan rapor sayılmaz */
  var sayilan = function (r) { return !r.pasif; };
  function raporlar(kisi) {
    var d = DONEM[D.donem];
    return MV.RAPORLAR.filter(function (r) { var g = gun(r); return sayilan(r) && g >= d.bas && g <= d.bit && (kisi ? r.kisi === kisi : D.brans === "tumu" || rBrans(r) === D.brans); });
  }
  function geriler(kisi) {
    var d = DONEM[D.donem];
    /* geri gönderilen: şu an geri duran ya da düzeltilip yeniden gönderilen (geçmişiyle) */
    return MV.RAPORLAR.filter(function (r) {
      var z = (r.duzeltmeler || []).map(function (x) { return x.geri; }).concat(r.geri ? [r.geri.zaman] : []);
      return z.some(function (g) { g = g.slice(0, 10); return g >= d.bas && g <= d.bit; }) && (kisi ? r.kisi === kisi : D.brans === "tumu" || rBrans(r) === D.brans); });
  }
  /* özet: rapor · çalışılan gün (kişi × gün) · gün başı ortalama · kazanç (birim fiyat, KDV hariç) · geri gönderilen */
  function ozet(rl, gl) {
    var gunler = {}; rl.forEach(function (r) { gunler[r.kisi + "|" + gun(r)] = 1; });
    var n = Object.keys(gunler).length, kazanc = rl.reduce(function (t, r) { return t + MV.raporFiyat(r).fiyat; }, 0);
    return { sure: sureOzet(rl), rapor: rl.length, gun: n, ort: n ? rl.length / n : 0, kazanc: kazanc, gunKazanc: n ? kazanc / n : 0, geri: gl.length,
      son: rl.reduce(function (s, r) { return gun(r) > s ? gun(r) : s; }, "") };
  }
  /* tamamlanma süresi (saat): açılış → son imza; dilim: 24 saat içinde · 24–48 saat · 48 saatten uzun */
  var sure = function (r) { return r.durum === "imzali" && r.imza ? (new Date(r.imza.zaman + ":00Z") - new Date(r.olustu + ":00Z")) / 36e5 : null; };
  function sureOzet(rl) {
    var o = { n: 0, h24: 0, h48: 0, h48p: 0 };
    rl.forEach(function (r) { var h = sure(r); if (h === null) return; o.n++; if (h <= 24) o.h24++; else if (h <= 48) o.h48++; else o.h48p++; });
    o.pay = o.n ? Math.round(o.h24 * 100 / o.n) : 0; return o;
  }
  var yuzde = function (a, n) { return n ? "%" + Math.round(a * 100 / n) : "—"; };
  function sureYuzler(so) {
    return '<section class="a-bolum" aria-labelledby="a-b-sure"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-sure">Tamamlanma süresi</h2><span class="a-sayac"><b>' + so.n + "</b> tamamlanan rapor</span></div>" +
      '<div class="a-yuzler">' + yuz("24 saat içinde", "circle-check", so.h24, yuzde(so.h24, so.n)) + yuz("24–48 saat", "clock", so.h48, yuzde(so.h48, so.n)) +
      yuz("48 saatten uzun", "triangle-alert", so.h48p, yuzde(so.h48p, so.n)) + "</div></section>";
  }
  var ortYaz = function (n) { return n ? n.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—"; };
  var yuz = function (ad, ik, sayi, not) { return '<div class="a-yuz"><span class="a-yuz-ust">' + ikon(ik, "a-ikon-kucuk") + ad + '</span><span class="a-yuz-sayi">' + sayi + "</span>" + (not ? '<span class="a-yuz-not">' + not + "</span>" : "") + "</div>"; };
  function yuzler(o) {
    return '<div class="a-yuzler">' + yuz("Rapor", "file-text", o.rapor) + yuz("Çalışılan gün", "calendar-check", o.gun) +
      yuz("Gün başı rapor", "gauge", ortYaz(o.ort)) + (BEN ? "" : yuz("Kazanç", "wallet", tl(o.kazanc), "gün başı " + (o.gun ? tl(o.gunKazanc) : "—"))) +
      yuz("Geri gönderilen", "undo-2", o.geri) + "</div>";
  }

  /* ── GRAFİK — tek üretici: DİKEY SÜTUNLAR (2026-09-28, T9; reisim: "sütun grafikleri yatay olmasın ve boşluklu olmasın"). Sütunlar
     yuvasını doldurur (aralarında yalnız 2 px ayraç), taban çizgisine oturur, üst ucu 4 px yuvarlak; yığında parçalar arası 2 px. Izgara
     silik (0 · yarı · üst). Değer: az sütunda (≤ 6) her sütunun üstünde, çokta yalnız en yüksekte; hepsi üzerine gelince ipucunda ve
     gizli tabloda (ekran okuyucu, kalıp). Etiket sütunun ortasına ölçülerek yerleşir; komşusuyla çakışan gizlenir (seyreltme), uçtaki
     kartın içine çekilir (grafikKur). Dış kütüphane yok. o = { baslik, ilkSutun, seriler: [[seri, ad]], satirlar: [{ etiket, tam?, parcalar:
     [[seri, değer]], deger (yazı), alt (yazı) }], enc? (ölçek üstü), tam? (tam sayılı veri), onEk? / birim? (değerin önü / arkası) } ────── */
  /* ölçeğin üstü: yuvarlak sayı (1 · 2 · 2,5 · 5 × 10ⁿ); tam sayılı veride (rapor sayısı) orta çizgi de tam sayı olur */
  function yuvarla(v, tam) {
    if (v <= 0) return tam ? 2 : 1; var u = Math.pow(10, Math.floor(Math.log10(v))), k = v / u;
    var adim = tam ? (u < 10 ? [2, 4, 6, 8, 10] : [1, 2, 3, 4, 5, 6, 8, 10]) : [1, 2, 2.5, 5, 10];
    return adim.filter(function (a) { return a >= k - 1e-9; })[0] * u;
  }
  var sayiKisa = function (n) { return n >= 1e6 ? (n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " mn" : n >= 1e4 ? Math.round(n / 1e3).toLocaleString("tr-TR") + " bin" : n.toLocaleString("tr-TR", { maximumFractionDigits: 1 }); };
  function grafik(o) {
    var toplam = function (s) { return s.parcalar.reduce(function (t, p) { return t + p[1]; }, 0); };
    var ust = o.enc || yuvarla(Math.max.apply(null, o.satirlar.map(toplam).concat([0])), o.tam), enYuksek = Math.max.apply(null, o.satirlar.map(toplam).concat([0]));
    var n = o.satirlar.length, hepsi = n <= 6, birim = o.birim || "", on = o.onEk || "";
    var sutunlar = o.satirlar.map(function (s) {
      var t = toplam(s), yaz = t > 0 && (hepsi || t === enYuksek);
      return '<div class="a-sutun"><span class="a-sutun-yigin" style="height:' + (t * 100 / ust).toFixed(2) + '%">' +
          (yaz ? '<span class="a-sutun-deger">' + on + sayiKisa(t) + birim + "</span>" : "") +
          s.parcalar.filter(function (p) { return p[1] > 0; }).map(function (p) { return '<span class="a-seri-' + p[0] + '" style="flex-grow:' + p[1] + '"></span>'; }).join("") + "</span>" +
        '<span class="a-sutun-ipucu"><b>' + kacis(s.tam || s.etiket) + "</b>" + s.deger + (s.alt ? "<br>" + s.alt : "") +
          (o.seriler.length > 1 ? "<br>" + o.seriler.map(function (x) { var p = s.parcalar.filter(function (y) { return y[0] === x[0]; })[0]; return x[1] + " " + (p ? p[1] : 0); }).join(" · ") : "") + "</span></div>";
    }).join("");
    return '<figure class="a-grafik"><div class="a-grafik-bas"><figcaption class="a-grafik-baslik">' + o.baslik + "</figcaption>" +
        (o.seriler.length > 1 ? '<ul class="a-grafik-lejant">' + o.seriler.map(function (s) { return '<li><span class="a-grafik-renk a-seri-' + s[0] + '"></span>' + s[1] + "</li>"; }).join("") + "</ul>" : "") + "</div>" +
      (n ? '<div class="a-sutun-cizim" aria-hidden="true">' +
          '<div class="a-sutun-eksen"><span style="bottom:100%">' + on + sayiKisa(ust) + birim + '</span><span style="bottom:50%">' + on + sayiKisa(ust / 2) + birim + '</span><span style="bottom:0">0</span></div>' +
          '<div class="a-sutun-alan">' + sutunlar + "</div>" +
          '<div class="a-sutun-etiketler">' + o.satirlar.map(function (s) { return "<span>" + kacis(s.etiket) + "</span>"; }).join("") + "</div></div>"
        : '<p class="a-bos-satir">Bu dönemde rapor yok.</p>') +
      '<div class="a-gizli"><table><caption>' + o.baslik + "</caption><thead><tr><th scope=\"col\">" + o.ilkSutun + '</th><th scope="col">Değer</th></tr></thead><tbody>' +
        o.satirlar.map(function (s) { return "<tr><th scope=\"row\">" + kacis(s.tam || s.etiket) + "</th><td>" + s.deger + (s.alt ? " · " + s.alt : "") + "</td></tr>"; }).join("") + "</tbody></table></div></figure>";
  }
  /* etiket yerleşimi: her etiket kendi sütununun ortasında; öncekiyle çakışan gizlenir, uçtaki kartın içine çekilir. İpucu sütunun iç
     tarafına açılır (soldaki yarı sağa, sağdaki yarı sola). Ekran boyu değişince yeniden. */
  function grafikKur() {
    document.querySelectorAll(".a-sutun-cizim").forEach(function (c) {
      var et = c.querySelector(".a-sutun-etiketler"), sut = c.querySelectorAll(".a-sutun"), kb = et.getBoundingClientRect(), son = -Infinity;
      [].forEach.call(et.children, function (x, i) {
        x.classList.remove("a-sutun-seyrek");
        var r = sut[i].getBoundingClientRect(), w = x.getBoundingClientRect().width, sol = Math.max(0, Math.min(kb.width - w, r.left + r.width / 2 - kb.left - w / 2));
        x.style.left = sol.toFixed(1) + "px";
        if (sol < son + 6) x.classList.add("a-sutun-seyrek"); else son = sol + w;
      });
      [].forEach.call(sut, function (x, i) { x.classList.toggle("a-sutun-sag", i >= sut.length / 2); });
    });
  }
  var kurZaman = null;
  window.addEventListener("resize", function () { clearTimeout(kurZaman); kurZaman = setTimeout(grafikKur, 100); });
  var ilkAd = function (p) { return p.ad.split(" ")[0]; };
  /* zaman grafiği: bu ay → rapor yazılan günler (gün başı); yıl → aylar (boş ay da görünür) */
  function zamanGrafigi(rl) {
    var d = DONEM[D.donem], gruplar = [];
    if (d.grup === "gun") {
      var g = {}; rl.forEach(function (r) { (g[gun(r)] = g[gun(r)] || []).push(r); });
      gruplar = Object.keys(g).sort().map(function (k) { return [k.slice(8, 10) + "." + k.slice(5, 7), g[k], MK.gunYaz(k)]; });
    } else {
      var y = +d.bas.slice(0, 4), a = +d.bas.slice(5, 7), son = d.bit.slice(0, 7), cokYil = d.bas.slice(0, 4) !== d.bit.slice(0, 4);
      for (var ay = y + "-" + ("0" + a).slice(-2); ay <= son; a = a === 12 ? (y++, 1) : a + 1, ay = y + "-" + ("0" + a).slice(-2)) {
        (function (ay, ad, kisa) { gruplar.push([kisa, rl.filter(function (r) { return gun(r).slice(0, 7) === ay; }), ad]); })(ay, AYLAR[a - 1] + (cokYil ? " " + y : ""), AYLAR[a - 1].slice(0, 3) + (cokYil ? " " + String(y).slice(2) : ""));
      }
    }
    return grafik({ baslik: d.grup === "gun" ? "Günlük rapor" : "Aylık rapor", tam: true, ilkSutun: d.grup === "gun" ? "Gün" : "Ay",
      seriler: [["m", "Mekanik"], ["e", "Elektrik"]],
      satirlar: gruplar.map(function (x) {
        var m = x[1].filter(function (r) { return rBrans(r) === "m"; }).length, e = x[1].length - m, k = x[1].reduce(function (t, r) { return t + MV.raporFiyat(r).fiyat; }, 0);
        return { etiket: x[0], tam: x[2], parcalar: [["m", m], ["e", e]], deger: x[1].length ? x[1].length + " rapor" : "—", alt: x[1].length && !BEN ? tl(k) : "" };
      }) });
  }

  /* ── PANO ──────────────────────────────────────────────────────────────────────────────────────────── */
  var KISILER = MV.PERSONEL.filter(function (p) { return p.durum === "etkin" && p.hesap && p.hesap.roller.indexOf("inspector") >= 0; });
  var kisiOz = function (p) { return ozet(raporlar(p.id), geriler(p.id)); };
  MK.suzgecTanimla("p", { ad: "Personelde ara", ipucu: "Ad, meslek", birim: "kişi", cipler: [],
    seciciler: [{ k: "gorunum", ad: "Görünüm", bas: "yazan", secenek: function () { return [["yazan", "Rapor yazanlar"], ["hepsi", "Bütün denetçiler"]]; },
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
    { k: "kazanc", baslik: "Kazanç", kart: "govde", sira: 5, hucre: function (p) { return '<span class="a-kart-etiket">Kazanç</span><span class="a-sayi">' + (p.o.kazanc ? tl(p.o.kazanc) : "—") + "</span>"; } },
    { k: "geri", baslik: "Geri gönderilen", kart: "govde", sira: 6, hucre: function (p) { return '<span class="a-kart-etiket">Geri gönderilen</span><span class="a-sayi' + (p.o.geri ? " a-uyari-metin" : "") + '">' + p.o.geri + "</span>"; } },
    { k: "h24", baslik: "24 saat içinde", kart: "govde", sira: 7, hucre: function (p) { var x = p.o.sure; return '<span class="a-kart-etiket">24 saat içinde</span><span class="a-sayi">' + (x.n ? yuzde(x.h24, x.n) + '</span><span class="a-alt-satir">' + x.h24 + " / " + x.n + "</span>" : "—</span>"); } },
    { k: "h48p", baslik: "48 saatten uzun", kart: "govde", sira: 8, hucre: function (p) { var x = p.o.sure; return '<span class="a-kart-etiket">48 saatten uzun</span><span class="a-sayi' + (x.h48p ? " a-uyari-metin" : "") + '">' + x.h48p + "</span>" + (x.n ? '<span class="a-alt-satir">24–48: ' + x.h48 + "</span>" : ""); } },
    { k: "son", baslik: "Son rapor", kart: "govde", sira: 9, hucre: function (p) { return '<span class="a-kart-etiket">Son rapor</span>' + (p.o.son ? MK.gunKisa(p.o.son) : '<span class="a-deger-yok">—</span>'); } }
  ];
  function kisiListeCiz() {
    var l = KISILER.filter(function (p) { return D.brans === "tumu" || kBrans(p) === D.brans; }).map(function (p) { return Object.assign({}, p, { o: kisiOz(p) }); });
    MK.listeCiz({ on: "p", kayitlar: l, sayacId: "a-p-sayac", listeId: "a-p-liste",
      sirala: function (x) {
        var v = SZ.p.sec.sira, k = v === "varsayilan" ? "kazanc" : v.replace(/-(artan|azalan)$/, ""), yon = v === "varsayilan" || /-azalan$/.test(v) ? -1 : 1;
        return x.slice().sort(function (a, b) { var p = k === "ad" ? a.ad : a.o[k], q = k === "ad" ? b.ad : b.o[k];
          return (k === "ad" ? p.localeCompare(q, "tr") : p < q ? -1 : p > q ? 1 : 0) * yon || a.ad.localeCompare(b.ad, "tr"); });
      },
      bosVeri: { ikon: "users", baslik: "Denetçi yok", metin: "Denetçi rolündeki personel burada görünür." },
      tablo: { baslik: "Personel performansı", sinif: "a-tablo-perf", sutunlar: K_SUTUN, sz: "p", href: function (p) { return "#/p/" + p.id; } } });
  }
  /* kişi sayfasında branş anahtarı yok (kişinin raporlarının hepsi; pano branşı orada uygulanmaz) */
  function anahtarlar(kisi) {
    return '<div class="a-pano-anahtar"><div class="a-sekmeler" role="group" aria-label="Dönem">' + Object.keys(DONEM).map(function (k) {
        return '<button type="button" class="a-sekme" data-donem="' + k + '" aria-pressed="' + (D.donem === k) + '">' + DONEM[k].ad + "</button>"; }).join("") + "</div>" +
      (D.donem === "aralik" ? '<div class="a-pano-aralik">' + MK.alan({ id: "p-bas", etiket: "Başlangıç", girdi: MK.girdi({ id: "p-bas", alan: "bas", deger: A.bas, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"', hata: A.hata }) }) +
        MK.alan({ id: "p-bit", etiket: "Bitiş", hata: A.hata, girdi: MK.girdi({ id: "p-bit", alan: "bit", deger: A.bit, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"', hata: A.hata }) }) +
        MK.tus({ eylem: "aralik-uygula", ad: "Uygula", sinif: "a-tus-ikincil" }) + "</div>" : "") +
      (kisi ? "" : '<div class="a-sekmeler" role="group" aria-label="Branş">' + Object.keys(BRANS).map(function (k) {
        return '<button type="button" class="a-sekme" data-brans="' + k + '" aria-pressed="' + (D.brans === k) + '">' + BRANS[k] + "</button>"; }).join("") + "</div>") +
      '<p class="a-pano-donem">' + DONEM[D.donem].alt + (!kisi && D.brans !== "tumu" ? " · " + BRANS[D.brans].toLocaleLowerCase("tr") : "") + "</p></div>";
  }
  function panoCiz() {
    var rl = raporlar(), o = ozet(rl, geriler());
    var kazanclar = KISILER.map(function (p) { return { p: p, o: kisiOz(p) }; }).filter(function (x) { return x.o.kazanc > 0; }).sort(function (a, b) { return b.o.kazanc - a.o.kazanc; });
    $("a-pano").innerHTML = '<div class="a-sayfa-bas"><h1 tabindex="-1">Performans</h1>' + MK.tus({ eylem: "excel", ad: "Excel'e aktar", ikon: "file-check", sinif: "a-tus-ikincil a-bolum-tus" }) + "</div>" + anahtarlar() + yuzler(o) +
      sureYuzler(o.sure) + '<div class="a-grafikler">' + sureGrafikleri() + "</div>" +
      '<div class="a-grafikler">' + zamanGrafigi(rl) +
        grafik({ baslik: "Personel başına kazanç", ilkSutun: "Personel", seriler: [["k", "Kazanç"]], satirlar: kazanclar.map(function (x) {
          return { etiket: ilkAd(x.p), tam: x.p.ad, parcalar: [["k", x.o.kazanc]], deger: tl(x.o.kazanc), alt: x.o.rapor + " rapor · " + x.o.gun + " gün" };
        }) }) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-kisi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kisi">Personel</h2><span class="a-sayac" id="a-p-sayac"></span></div>' +
        MK.suzgecHtml("p") + '<div class="a-liste-kap" id="a-p-liste"></div></section>';
    MK.suzgecKur("p");
  }

  /* tamamlanma süresi grafikleri: her biri TEK seri (renk yalnız kimlik; dilimler yazıda) — kişi başına 24 saat içinde payı ·
     48 saatten uzun sayısı; tamamlanan raporu olmayan kişi görünmez */
  function sureGrafikleri() {
    var l = KISILER.filter(function (p) { return D.brans === "tumu" || kBrans(p) === D.brans; }).map(function (p) { return { p: p, s: sureOzet(raporlar(p.id)) }; })
      .filter(function (x) { return x.s.n; }).sort(function (a, b) { return b.s.pay - a.s.pay || a.p.ad.localeCompare(b.p.ad, "tr"); });
    return grafik({ baslik: "24 saat içinde tamamlanan", ilkSutun: "Personel", enc: 100, onEk: "%", seriler: [["k", "24 saat içinde"]], satirlar: l.map(function (x) {
        return { etiket: ilkAd(x.p), tam: x.p.ad, parcalar: [["k", x.s.pay]], deger: "%" + x.s.pay, alt: x.s.h24 + " / " + x.s.n + " rapor" }; }) }) +
      grafik({ baslik: "48 saatten uzun süren (rapor)", ilkSutun: "Personel", tam: true, seriler: [["h", "48 saatten uzun"]], satirlar: l.slice().sort(function (a, b) { return b.s.h48p - a.s.h48p || a.p.ad.localeCompare(b.p.ad, "tr"); }).map(function (x) {
        return { etiket: ilkAd(x.p), tam: x.p.ad, parcalar: [["h", x.s.h48p]], deger: x.s.h48p + " rapor", alt: "24–48 saat: " + x.s.h48 }; }) });
  }

  /* KİŞİNİN RAPOR SÜRECİ (T9; reisim: "kişiye tıklanınca raporlama sürecine dair grafikleri gözükmüyor"): (1) tamamlanan raporların
     süre dağılımı — 24 saat içinde · 24–48 saat · 48 saatten uzun; (2) sürecin adımları, ortalama saat — yazım (açılış → onaya gönderim),
     onay (gönderim → yönetici onayı), son imza (onay → son imza); geri gönderilen raporda düzeltme (geri gönderme → yeniden gönderim;
     reisim 2026-09-29, 35. tur 166). Yalnız adımı tamamlanmış raporlar ortalamaya girer. */
  var saat = function (a, b) { return (new Date(b + ":00Z") - new Date(a + ":00Z")) / 36e5; };
  var saatYaz = function (h) { return h.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " saat"; };
  function surecGrafikleri(rl) {
    var so = sureOzet(rl), ort = function (l) { return l.length ? l.reduce(function (t, x) { return t + x; }, 0) / l.length : 0; };
    var yazim = rl.filter(function (r) { return r.ilkGonderim || r.gonderildi; }).map(function (r) { return saat(r.olustu, r.ilkGonderim || r.gonderildi); });
    var duzelt = []; rl.forEach(function (r) { (r.duzeltmeler || []).forEach(function (x) { duzelt.push(saat(x.geri, x.gonderim)); }); });
    var onay = rl.filter(function (r) { return r.gonderildi && r.onay; }).map(function (r) { return saat(r.gonderildi, r.onay.zaman); });
    var imza = rl.filter(function (r) { return r.onay && r.imza; }).map(function (r) { return saat(r.onay.zaman, r.imza.zaman); });
    var adim = function (ad, l) { var h = ort(l); return { etiket: ad, parcalar: [["k", Math.round(h * 10) / 10]], deger: l.length ? "ort. " + saatYaz(h) : "—", alt: l.length + " rapor" }; };
    return grafik({ baslik: "Tamamlanma süresi (rapor)", ilkSutun: "Süre", tam: true, seriler: [["k", "Rapor"]], satirlar: so.n ? [
        { etiket: "24 saat içinde", parcalar: [["k", so.h24]], deger: so.h24 + " rapor", alt: yuzde(so.h24, so.n) },
        { etiket: "24–48 saat", parcalar: [["k", so.h48]], deger: so.h48 + " rapor", alt: yuzde(so.h48, so.n) },
        { etiket: "48 saatten uzun", parcalar: [["h", so.h48p]], deger: so.h48p + " rapor", alt: yuzde(so.h48p, so.n) }] : [] }) +
      grafik({ baslik: "Rapor süreci · ortalama süre (saat)", ilkSutun: "Adım", seriler: [["k", "Ortalama saat"]], satirlar: yazim.length ?
        [adim("Yazım", yazim), adim("Düzeltme", duzelt), adim("Onay", onay), adim("Son imza", imza)] : [] });
  }

  /* ── KİŞİ ──────────────────────────────────────────────────────────────────────────────────────────── */
  var isNo = function (r) { var x = MV.ISLER.filter(function (i) { return i.raporlar.indexOf(r.no) >= 0; })[0]; return x ? x.no : null; };
  var G_SUTUN = [
    { k: "gun", baslik: "Gün", kart: "ust", sira: 1, hucre: function (g) { return MK.gunYaz(g.gun); } },
    { k: "is", baslik: "İş / tesis", kart: "govde", sira: 2, hucre: function (g) {
      var t = MV.tesis(g.tesis); return "<span>" + (g.is ? '<a class="a-no" href="' + MK.adres(18, "#/is/" + g.is) + '">' + g.is + "</a>" : '<span class="a-deger-yok">İş kaydı yok</span>') + kirp(MV.musteri(t.m).kisa + " · " + t.ad, "a-alt-satir") + "</span>";
    } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 3, hucre: function (g) { return '<span class="a-kart-etiket">Rapor</span><span class="a-sayi">' + g.rl.length + "</span>"; } },
    { k: "kazanc", baslik: "Kazanç", kart: "govde", sira: 4, hucre: function (g) { return '<span class="a-kart-etiket">Kazanç</span><span class="a-sayi">' + tl(g.kazanc) + "</span>"; } },
    { k: "durum", baslik: "İmzalı", kart: "rozet", sira: 1, hucre: function (g) {
      var n = g.rl.filter(function (r) { return r.durum === "imzali"; }).length;
      return MK.rozet({ ad: n + " / " + g.rl.length + " imzalı", rozet: n === g.rl.length ? "a-rozet-tamam" : n ? "a-rozet-kabul" : "a-rozet-notr" });
    } }
  ];
  function kisiCiz(p) {
    if (!p) {
      $("a-nesne").innerHTML = MK.kirinti([["Performans", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Kişi bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Kişi bulunamadı", metin: "Bu adreste denetçi yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Panoya dön</a>" });
      return;
    }
    var rl = raporlar(p.id), o = ozet(rl, geriler(p.id)), g = {};
    rl.forEach(function (r) { var k = gun(r) + "|" + r.tesis; (g[k] = g[k] || { gun: gun(r), tesis: r.tesis, is: isNo(r), rl: [], kazanc: 0 }); g[k].rl.push(r); g[k].kazanc += MV.raporFiyat(r).fiyat; });
    var GS = BEN ? G_SUTUN.filter(function (c) { return c.k !== "kazanc"; }) : G_SUTUN;
    var gunluk = Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.gun < b.gun ? 1 : -1; });
    $("a-nesne").innerHTML = (BEN ? "" : MK.kirinti([["Performans", "#/"], [p.ad]])) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("id-card", "a-ikon-kucuk") + "<span>" + kacis(MV.meslekAd(p)) + " · " + MV.bransAd(kBrans(p)) + "</span></p></div>" +
        (BEN ? "" : '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="' + MK.adres(2, "#/p/" + p.id) + '">' + ikon("user", "a-ikon-kucuk") + "Personel kartı</a></div>") + "</div>" +
      anahtarlar(true) + yuzler(o) + sureYuzler(o.sure) + '<div class="a-grafikler">' + zamanGrafigi(rl) + surecGrafikleri(rl) + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-gunluk"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gunluk">Günlük iş</h2><span class="a-sayac"><b>' + gunluk.length + "</b> gün × tesis</span></div>" +
        (gunluk.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Günlük iş", sinif: BEN ? "a-tablo-gunluk a-tablo-gunluk-ben" : "a-tablo-gunluk", sutunlar: GS, kayitlar: gunluk }) + "</div>" : '<p class="a-bos-satir">Bu dönemde rapor yok.</p>') + "</section>";
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() { if (BEN) return { v: "kisi", id: BEN }; var m = /^#\/p\/([a-z0-9]+)$/.exec(location.hash); return m ? { v: "kisi", id: m[1] } : { v: "pano" }; }
  function goster(odakla) {
    var r = rota();
    $("a-pano").hidden = r.v !== "pano"; $("a-nesne").hidden = r.v !== "kisi";
    var p = r.v === "kisi" ? KISILER.filter(function (x) { return x.id === r.id; })[0] : null;
    if (r.v === "pano") panoCiz(); else kisiCiz(p);
    grafikKur();
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

  var X = MK.eylem;
  X["aralik-uygula"] = function () {
    var b = tarihIso(A.bas), e = tarihIso(A.bit);
    A.hata = !b || !e ? "GG.AA.YYYY biçiminde iki tarih." : b > e ? "Başlangıç bitişten sonra olamaz." : e > MK.BUGUN ? "Bitiş bugünden sonra olamaz." : "";
    if (!A.hata) { DONEM.aralik.bas = b; DONEM.aralik.bit = e; aralikKur(); }
    goster(false); var t = document.querySelector(A.hata ? "#p-bas" : '[data-eylem="aralik-uygula"]'); if (t) t.focus();
  };
  X["excel"] = function () {   /* 2026-09-27: seçili dönemin personel tablosu, ekrandaki sütunlarla gerçek .xlsx */
    var t = document.querySelector(".a-tablo-perf"); if (!t) { MK.bildir("Aktarılacak satır yok."); return; }
    MK.indir("performans-" + MK.BUGUN + ".xlsx", MK.xlsx("Performans", MK.tablodanSatirlar(t)));
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k === "bas" || k === "bit") A[k] = e.target.value; };
  MK.kabuk({ modul: 19, kullanici: BEN ? { bas: "MK", ad: "Mert Kaya", rol: "Denetçi" } : { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
