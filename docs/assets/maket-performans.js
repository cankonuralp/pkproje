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

  /* ── GRAFİK — tek üretici: yatay çubuk satırları (telefonda da okunur; dış kütüphane yok). satirlar: [{ etiket, parcalar: [[seri, değer]],
     deger (yazı), alt (yazı) }] · seriler: [[seri, ad]]. Ekran okuyucu için aynı veri gizli tabloda. ─────────────────────────────────── */
  function grafik(o) {
    var enc = o.enc || Math.max.apply(null, o.satirlar.map(function (s) { return s.parcalar.reduce(function (t, p) { return t + p[1]; }, 0); }).concat([1]));
    return '<figure class="a-grafik"><div class="a-grafik-bas"><figcaption class="a-grafik-baslik">' + o.baslik + "</figcaption>" +
        (o.seriler.length > 1 ? '<ul class="a-grafik-lejant">' + o.seriler.map(function (s) { return '<li><span class="a-grafik-renk a-seri-' + s[0] + '"></span>' + s[1] + "</li>"; }).join("") + "</ul>" : "") + "</div>" +
      (o.satirlar.length ? '<div class="a-grafik-satirlar" aria-hidden="true">' + o.satirlar.map(function (s) {
        return '<div class="a-grafik-satir"><span class="a-grafik-etiket">' + kirp(s.etiket) + '</span><span class="a-grafik-cubuk">' +
          s.parcalar.filter(function (p) { return p[1] > 0; }).map(function (p) { return '<span class="a-seri-' + p[0] + '" style="width:' + (p[1] * 100 / enc).toFixed(2) + '%"></span>'; }).join("") +
          '</span><span class="a-grafik-deger">' + s.deger + (s.alt ? '<span class="a-alt-satir">' + s.alt + "</span>" : "") + "</span></div>";
      }).join("") + "</div>" : '<p class="a-bos-satir">Bu dönemde rapor yok.</p>') +
      '<div class="a-gizli"><table><caption>' + o.baslik + "</caption><thead><tr><th scope=\"col\">" + o.ilkSutun + '</th><th scope="col">Değer</th></tr></thead><tbody>' +
        o.satirlar.map(function (s) { return "<tr><th scope=\"row\">" + kacis(s.etiket) + "</th><td>" + s.deger + (s.alt ? " · " + s.alt : "") + "</td></tr>"; }).join("") + "</tbody></table></div></figure>";
  }
  /* zaman grafiği: bu ay → rapor yazılan günler (gün başı); yıl → aylar (boş ay da görünür) */
  function zamanGrafigi(rl) {
    var d = DONEM[D.donem], gruplar = [];
    if (d.grup === "gun") {
      var g = {}; rl.forEach(function (r) { (g[gun(r)] = g[gun(r)] || []).push(r); });
      gruplar = Object.keys(g).sort().map(function (k) { return [MK.gunYaz(k), g[k]]; });
    } else {
      var y = +d.bas.slice(0, 4), a = +d.bas.slice(5, 7), son = d.bit.slice(0, 7), cokYil = d.bas.slice(0, 4) !== d.bit.slice(0, 4);
      for (var ay = y + "-" + ("0" + a).slice(-2); ay <= son; a = a === 12 ? (y++, 1) : a + 1, ay = y + "-" + ("0" + a).slice(-2)) {
        (function (ay, ad) { gruplar.push([ad, rl.filter(function (r) { return gun(r).slice(0, 7) === ay; })]); })(ay, AYLAR[a - 1] + (cokYil ? " " + y : ""));
      }
    }
    return grafik({ baslik: d.grup === "gun" ? "Gün başı rapor ve kazanç" : "Aylık rapor ve kazanç", ilkSutun: d.grup === "gun" ? "Gün" : "Ay",
      seriler: [["m", "Mekanik"], ["e", "Elektrik"]],
      satirlar: gruplar.map(function (x) {
        var m = x[1].filter(function (r) { return rBrans(r) === "m"; }).length, e = x[1].length - m, k = x[1].reduce(function (t, r) { return t + MV.raporFiyat(r).fiyat; }, 0);
        return { etiket: x[0], parcalar: [["m", m], ["e", e]], deger: x[1].length ? x[1].length + " rapor" : "—", alt: x[1].length && !BEN ? tl(k) : "" };
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
      bosVeri: { ikon: "users", baslik: "Inspector yok", metin: "Inspector rolündeki personel burada görünür." },
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
          return { etiket: x.p.ad, parcalar: [["k", x.o.kazanc]], deger: tl(x.o.kazanc), alt: x.o.rapor + " rapor · " + x.o.gun + " gün" };
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
    return grafik({ baslik: "24 saat içinde tamamlanan", ilkSutun: "Personel", enc: 100, seriler: [["k", "24 saat içinde"]], satirlar: l.map(function (x) {
        return { etiket: x.p.ad, parcalar: [["k", x.s.pay]], deger: "%" + x.s.pay, alt: x.s.h24 + " / " + x.s.n + " rapor" }; }) }) +
      grafik({ baslik: "48 saatten uzun süren", ilkSutun: "Personel", seriler: [["h", "48 saatten uzun"]], satirlar: l.slice().sort(function (a, b) { return b.s.h48p - a.s.h48p || a.p.ad.localeCompare(b.p.ad, "tr"); }).map(function (x) {
        return { etiket: x.p.ad, parcalar: [["h", x.s.h48p]], deger: x.s.h48p + " rapor", alt: "24–48 saat: " + x.s.h48 }; }) });
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
        MK.bos({ ikon: "circle-alert", baslik: "Kişi bulunamadı", metin: "Bu adreste inspector yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Panoya dön</a>" });
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
      anahtarlar(true) + yuzler(o) + sureYuzler(o.sure) + '<div class="a-grafikler a-grafikler-tek">' + zamanGrafigi(rl) + "</div>" +
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
  MK.kabuk({ modul: 19, kullanici: BEN ? { bas: "MK", ad: "Mert Kaya", rol: "Inspector" } : { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
