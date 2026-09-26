/* ══ probata MAKET M3 — Ekipman türleri (modül 5) · 2. TUR, ONAY BEKLİYOR (2026-09-26) ═══════════════════════════════════
   Kaynak: pkproje.md §3.1 modül 5 (Ek-III grubu, branş, periyot, standart(lar), Bakanlık format kodu), §4.7 (periyot), §4.8
   (formatlar), §3.2 madde 3 (onay branşa göre). Ekranlar: katalog (#/) · tür sayfası (#/tur/<kod>) · pencereler: tür ekle (#/yeni) ·
   tür düzenle (#/tur/<kod>/duzenle) · rapor formatı yükle (#/tur/<kod>/format). Bakış: mekanik yönetici. Veri UYDURMA; standart
   atamaları örnektir.
   2. tur (2026-09-26, reisim):
   · "ekipmanlar ve ekipman türleri diye iki modüle gerek yok ekipman türleri yeterli" · "planlar açıldığında ekipmanlar orada
     gözüküyor ya, oradan rapor oluştur diyoruz" → Ekipmanlar ekranı kalktı; ekipmanı denetçi sahada planın içinde ekler, sonraki
     yıllarda önceki raporundan "Rapor oluştur" ile yeni rapor açılır. Buradaki ekipman sayısı yalnız bilgi.
   · "ekipman türü ekleme tuşu olsun ve her ekipmanın içinde türün formatını belirleyecek pdf i ekleme tuşu da olsun ... firma yükleyip
     kendi formatını belirleyebilsin, ve rapor oluştur diyince o rapor pdf deki formata göre sorular soracak ona göre rapor uygun uygun
     değil çıkacak" → firma tür EKLER ve her türe kendi RAPOR FORMATINI PDF olarak yükler (sürümlü; eski raporlar kendi sürümüyle).
     Soruların PDF'ten nasıl çıkacağı rapor modülünün (M8) sırası gelince kurgulanır (reisim: "şimdilik tam anlamıyla yapmana gerek yok").
   · "Akreditasyon zorunluluğu ile ilgili bir şey yazma" → akreditasyon sütunu, çipi, rozeti ve satırı kalktı.
   · 52 → yetkili meslekler bölümü yok (yetkisiz denetçide yalnız uyarı) · 53 → periyot türde, tek ekipmanın tarihi planda değişir ·
     54 → tahmini kontrol süresi isteğe bağlı. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var FORMAT = { zorunlu: { ad: "zorunlu", rozet: "a-rozet-kabul" }, taslak: { ad: "taslak", rozet: "a-rozet-notr" } };
  var RF = { var: { ad: "Yüklendi", rozet: "a-rozet-tamam" }, yok: { ad: "Yüklenmedi", rozet: "a-rozet-bekliyor" } };
  var ekipmanSay = function (t) { return MV.EKIPMAN.filter(function (e) { return e.tur === t.k; }).length; };
  var bransHtml = function (b) { return '<span class="a-hucre-satir">' + ikon(b === "m" ? "cog" : "zap", "a-ikon-kucuk") + MV.bransAd(b) + "</span>"; };
  /* rapor formatı: firmanın yüklediği PDF'ler, en yenisi başta. Maket: rapor şablonu olan türde bir sürüm yüklenmiş sayılır. */
  MV.KATALOG.forEach(function (t) {
    if (t.pdf) return;
    var s = t.sablon ? t.sablon.split(" · ") : null;
    t.pdf = s ? [{ surum: s[0], tarih: s[1], dosya: t.k.toLowerCase() + "-rapor-formati-" + s[0] + ".pdf" }] : [];
  });
  var guncel = function (t) { return t.pdf[0]; };

  /* ── KATALOG ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("t", { ad: "Türlerde ara", ipucu: "Tür, kod, standart no", birim: "tür",
    cipler: [
      { k: "pdfsiz", ad: "Rapor formatı yüklenmedi", test: function (t) { return !t.pdf.length; } },
      { k: "zorunlu", ad: "Bakanlık formatı zorunlu", test: function (t) { return t.formatDurum === "zorunlu"; } },
      { k: "stdsiz", ad: "Standart seçilmemiş", test: function (t) { return !t.std.length; } }
    ],
    seciciler: [
      { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; }, gecer: function (t, v) { return v === "tumu" || t.b === v; } },
      { k: "grup", ad: "Ek-III grubu", secenek: function () { return [["tumu", "Tümü"]].concat(MV.GRUPLAR.map(function (g) { return [g.k, g.ad]; })); }, gecer: function (t, v) { return v === "tumu" || t.g === v; } }
    ],
    metin: function (t) { return [t.ad, t.k, t.format || ""].concat(t.std.map(function (s) { return MV.standart(s).no; })).join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "tur", baslik: "Tür", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-ad-bag" href="#/tur/' + t.k + '">' + kirp(t.ad) + '</a><span class="a-alt-satir">Kod ' + t.k + " · " + ekipmanSay(t) + " ekipman</span>"; } },
    { k: "grup", baslik: "Ek-III grubu", kart: "govde", sira: 2, hucre: function (t) { return '<span class="a-kart-etiket">Ek-III grubu</span>' + kirp(MV.grup(t.g).ad); } },
    { k: "brans", baslik: "Branş", kart: "govde", sira: 3, hucre: function (t) { return bransHtml(t.b); } },
    { k: "periyot", baslik: "Periyot", kart: "govde", sira: 4, hucre: function (t) { return '<span class="a-sayi"><span class="a-kart-etiket">Periyot</span>' + t.periyot + " ay</span>"; } },
    { k: "format", baslik: "Bakanlık formatı", kart: "govde", sira: 5, hucre: function (t) {
      return '<span class="a-kart-etiket">Bakanlık formatı</span>' + (t.format ? '<span class="a-hucre-satir"><span class="a-kod">' + t.format + "</span>" + rozet(FORMAT[t.formatDurum]) + "</span>" : '<span class="a-deger-yok">Yayımlanmadı</span>');
    } },
    { k: "rapor", baslik: "Rapor formatı", kart: "rozet", sira: 1, hucre: function (t) {
      var p = guncel(t);
      return rozet(RF[p ? "var" : "yok"]) + (p ? '<span class="a-tarih-saat">' + kacis(p.surum) + " · " + kacis(p.tarih) + "</span>" : "");
    } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "t", kayitlar: MV.KATALOG, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.b === b.b ? a.ad.localeCompare(b.ad, "tr") : a.b === "m" ? -1 : 1; }); },
      bosVeri: { ikon: "layers", baslik: "Ekipman türü yok", metin: "“Tür ekle” ile ilk tür ve rapor formatı eklenir." },
      tablo: { baslik: "Ekipman türleri", sinif: "a-tablo-tur", sutunlar: SUTUN, href: function (t) { return "#/tur/" + t.k; } } });
  }

  /* ── TÜR SAYFASI ─────────────────────────────────────────────────────────────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return '<div class="a-yuz">' + ic + "</div>";
  }
  function pdfSutun(p) {
    return [
      { k: "surum", baslik: "Sürüm", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-ekipman-ad">' + kacis(x.surum) + "</span>" + kirp(x.dosya, "a-alt-satir"); } },
      { k: "tarih", baslik: "Yüklendi", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Yüklendi</span>' + kacis(x.tarih) + (x.not ? '<span class="a-alt-satir">' + kacis(x.not) + "</span>" : ""); } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(x === p ? { ad: "Kullanımda", rozet: "a-rozet-tamam" } : { ad: "Önceki", rozet: "a-rozet-notr" }); } }
    ];
  }
  function turCiz(t) {
    if (!t) {
      $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Tür bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Tür bulunamadı", metin: "Bu adreste tür yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Türlere dön</a>" });
      return;
    }
    var g = MV.grup(t.g), n = ekipmanSay(t), onay = t.b === "m" ? "Mekanik yönetici" : "Elektrik yönetici", p = guncel(t);
    $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri", "#/"], [t.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(t.ad) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("layers", "a-ikon-kucuk") + "<span>Kod " + t.k + " · " + kacis(g.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="#/tur/' + t.k + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a>" +
          '<a class="a-tus a-tus-birincil" href="#/tur/' + t.k + '/format">' + ikon("file-plus", "a-ikon-kucuk") + (p ? "Yeni format yükle" : "Rapor formatı yükle") + "</a></div></div>" +
      '<div class="a-yuzler">' +
        /* Ekipmanlar ekranı yok → sayı yalnız bilgi */
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: n, not: "planlarda, bütün tesislerde" }) +
        yuz({ ikon: "file-text", ad: "Rapor formatı", sayi: p ? p.surum : "Yok", not: p ? "yüklendi " + p.tarih : "PDF yüklenmedi", uyari: !p }) +
        yuz({ ikon: "badge-check", ad: "Onay", sayi: MV.bransAd(t.b), not: onay + " onaylar" }) +
        yuz({ ikon: "alarm-clock", ad: "Periyot", sayi: t.periyot + " ay", not: t.sure ? "tahmini " + t.sure + " dk" : "sonraki kontrol önerisi" }) +
      "</div>" +
      /* rapor formatı: firmanın kendi PDF'i (reisim 2026-09-26). Sorular bu formattan gelir — kurgusu M8'de. */
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">Rapor formatı</h2>' +
        (p ? '<span class="a-sayac"><b>' + t.pdf.length + "</b> sürüm</span>" + MK.tus({ eylem: "pdf-ac", ad: "PDF'i aç", ikon: "eye", sinif: "a-tus-ikincil a-bolum-tus", veri: { k: t.k } }) : "") + "</div>" +
        '<p class="a-bolum-aciklama">Firmanın bu tür için kullandığı rapor çıktısı. “Rapor oluştur” dendiğinde sorular bu formattan gelir, sonuç uygun ya da uygun değil çıkar. Eski raporlar kendi sürümüyle açılır.</p>' +
        (p ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Rapor formatı sürümleri", sinif: "a-tablo-pdf", sutunlar: pdfSutun(p), kayitlar: t.pdf }) + "</div>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "file-plus", "Bu türün rapor formatı yüklenmedi. PDF yüklenince bu türde rapor oluşturulur.") + "</div>") +
      "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kural"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kural">Kontrol kuralları</h2></div><dl class="a-bilgi">' +
        bilgi("Ek-III grubu", kacis(g.ad), true) + bilgi("Branş", MV.bransAd(t.b) + ' <span class="a-alt-inline">· onay ' + onay.toLocaleLowerCase("tr") + "</span>") +
        bilgi("Periyot", t.periyot + ' ay <span class="a-alt-inline">· tek ekipmanın tarihi planda değiştirilebilir</span>') +
        bilgi("Tahmini kontrol süresi", t.sure ? t.sure + " dk" : '<span class="a-deger-yok">Girilmedi</span>') +
        bilgi("Bakanlık rapor formatı", t.format ? '<span class="a-kod">' + t.format + "</span> " + rozet(FORMAT[t.formatDurum]) : '<span class="a-deger-yok">Yayımlanmadı</span>') +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-std"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-std">Kontrol metodu standartları</h2><span class="a-sayac"><b>' + t.std.length + "</b> standart</span>" +
        MK.git({ hedef: 4, hash: "#/?tur=" + t.k, ad: "Standart kütüphanesi", ikon: "book-open", sinif: "a-tus-ikincil a-bolum-tus", ne: "Standartlar" }) + "</div>" +
        (t.std.length ? '<ul class="a-kosullar">' + t.std.map(function (k) { var s = MV.standart(k); return '<li class="a-kosul-bilgi">' + ikon("book-open", "a-ikon-kucuk") + '<span><span class="a-kod">' + s.no + "</span> · " + kacis(s.konu) + "</span></li>"; }).join("") + "</ul>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Standart seçilmemiş: raporun kontrol metodu rapor anında yazılır.") + "</div>") +
      "</section>";
  }

  /* ── PENCERELER: tür ekle · tür düzenle · rapor formatı yükle ─────────────────────────────────────────── */
  var W = null;
  function denetle() {
    var h = {}, d = W.d;
    if (W.tur === "format") { if (!d.dosya) h.dosya = "PDF seçilmeli."; return h; }
    if (d.ad.trim().length < 3) h.ad = "Tür adı yazılmalı.";
    if (!W.id) {
      if (!/^[A-Z]{2,3}$/.test(d.k)) h.k = "Kod 2–3 büyük harf (A–Z); ekipman kodlarının öneki olur.";
      else if (MV.KATALOG.some(function (t) { return t.k === d.k; })) h.k = d.k + " kodu " + MV.tur(d.k).ad + " türünde kullanılıyor.";
    }
    if (!d.g) h.g = "Ek-III grubu seçilmeli (branş buradan gelir).";
    if (!/^\d{1,3}$/.test(String(d.periyot)) || +d.periyot < 1 || +d.periyot > 120) h.periyot = "Periyot 1–120 ay.";
    if (d.sure && !/^\d{1,3}$/.test(String(d.sure))) h.sure = "Dakika olarak; boş bırakılabilir.";
    return h;
  }
  function dosyaSec(d) {
    return '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Rapor formatı (PDF)</p>' +
      '<div class="a-dosya-sec">' + MK.tus({ eylem: "pdf-sec", ad: d.dosya ? "Başka dosya seç" : "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
      '<span class="a-dosya-ad" id="w-dosya">' + (d.dosya ? kacis(d.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
      (W.hata.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + W.hata.dosya + "</p>"
        : '<p class="a-ipucu">Rapor çıktısı nasıl görünsün istiyorsanız o PDF. ' + (W.tur === "format" ? "Eski raporlar önceki sürümle kalır." : "Sonra da yüklenebilir.") + "</p>") + "</div>";
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, t = W.id ? MV.tur(W.id) : null, A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: o.girdi || MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var govde, kaydet = "Kaydet";
    if (W.tur === "format") {
      $("a-pencere-baslik").textContent = t.pdf.length ? "Yeni rapor formatı yükle" : "Rapor formatı yükle";
      kaydet = "Yükle";
      govde = '<p class="a-pencere-ozet"><b>' + kacis(t.ad) + "</b> · kod " + t.k + (t.pdf.length ? "<br>Kullanımdaki sürüm " + kacis(t.pdf[0].surum) + "; yeni yüklenen sonraki raporlarda kullanılır." : "") + "</p>" +
        '<div class="a-form">' + dosyaSec(d) + A("not", "Sürüm notu", d.not, { genis: true, ek: ' maxlength="120"', ipucu: "İsteğe bağlı (ör. basınç testi bölümü eklendi)." }) + "</div>";
    } else {
      $("a-pencere-baslik").textContent = W.id ? t.ad + " · düzenle" : "Tür ekle";
      govde = '<div class="a-form">' +
        A("ad", "Tür adı", d.ad, { zorunlu: true, genis: true, ek: ' maxlength="60"' }) +
        A("k", "Kod", d.k, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' maxlength="3"' + (W.id ? " readonly" : ""), ipucu: W.id ? "Kod değişmez (ekipman kodlarında kullanılıyor)." : "2–3 harf; ekipman kodu öneki." }) +
        A("g", "Ek-III grubu", "", { zorunlu: true, girdi: MK.secim({ id: "w-g", ad: "Ek-III grubu", deger: d.g, secenekler: MV.GRUPLAR.map(function (g) { return [g.k, g.ad, MV.bransAd(g.b)]; }), ipucu: "Grup seçin", gecersiz: !!h.g, tanim: "w-g-ipucu" }), ipucu: "Branş ve onaylayan yönetici gruptan gelir." }) +
        A("periyot", "Periyot (ay)", d.periyot, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', ipucu: "Sonraki kontrol önerisi bununla hesaplanır." }) +
        A("sure", "Tahmini kontrol süresi (dk)", d.sure, { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', ipucu: "İsteğe bağlı; plan saat önerisinde kullanılır." }) +
        (W.id ? "" : dosyaSec(d)) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Kontrol metodu standartları</p><p class="a-bolum-aciklama">Firmanın kütüphanesinden; hiçbiri seçilmezse metot rapor anında yazılır.</p>' +
          '<ul class="a-secim-listesi">' + MV.STANDARTLAR.map(function (s) {
            return '<li><label class="a-secim-satir"><input type="checkbox" data-std="' + s.k + '"' + (d.std.indexOf(s.k) >= 0 ? " checked" : "") + '><span class="a-secim-metin"><span class="a-kod">' + s.no + '</span><span class="a-alt-satir">' + kacis(s.konu) + "</span></span></label></li>";
          }).join("") + "</ul></div></div>";
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: kaydet, ikon: W.tur === "format" ? "file-plus" : "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(tur, id) {
    var t = id ? MV.tur(id) : null;
    W = { tur: tur, id: id || null, hata: {}, d: tur === "format" ? { dosya: "", not: "" }
      : t ? { ad: t.ad, k: t.k, g: t.g, periyot: String(t.periyot), sure: t.sure ? String(t.sure) : "", std: t.std.slice(), dosya: "" }
      : { ad: "", k: "", g: "", periyot: "12", sure: "", std: [], dosya: "" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input:not([readonly]), .a-tus"); if (ilk) ilk.focus();
  }
  var sonrakiSurum = function (t) { return "v" + (t.pdf.reduce(function (m, x) { return Math.max(m, +x.surum.slice(1) || 0); }, 0) + 1); };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "liste", pencere: "tur" };
    if ((m = /^#\/tur\/([A-Z]{2,3})(?:\/(duzenle|format))?$/.exec(h))) return { v: "tur", id: m[1], pencere: m[2] && MV.tur(m[1]) ? (m[2] === "format" ? "format" : "tur") : null };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), t = r.id ? MV.tur(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else turCiz(t);
    document.title = (r.v === "liste" ? "Ekipman türleri" : t ? t.ad : "Tür bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, r.id); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["tur-ac"] = function () { location.hash = "#/yeni"; };
  /* maket: dosya penceresi yerine örnek dosya adı */
  X["pdf-sec"] = function () {
    var k = (W.id || W.d.k || "tur").toLowerCase();
    W.d.dosya = k + "-rapor-formati-" + MK.BUGUN + ".pdf"; delete W.hata.dosya;
    pencereCiz(); $("a-pencere-alt").querySelector(".a-tus-birincil").focus();
  };
  /* PDF'i aç: makette şablon önizlemesi (M7) PDF'in yerini tutar */
  X["pdf-ac"] = function (el) {
    var t = MV.tur(el.dataset.k), h = MK.adres("sablon", "#/" + t.k);
    if (t.sablon && h && t.pdf[0].dosya.indexOf(MK.BUGUN) < 0) location.href = h; else MK.bildir("Makette yeni yüklenen PDF açılmaz; uygulamada yüklenen dosya açılır.");
  };
  X["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz(hk[0] === "dosya" ? null : "w-" + hk[0]); return; }
    var d = W.d, t, ileti;
    if (W.tur === "format") {
      t = MV.tur(W.id);
      t.pdf.unshift({ surum: sonrakiSurum(t), tarih: MK.tarihYaz(MK.BUGUN), dosya: d.dosya, not: d.not.trim() });
      ileti = "Rapor formatı " + t.pdf[0].surum + " yüklendi; sonraki raporlar bu formatla oluşturulur.";
    } else {
      var g = MV.grup(d.g);
      t = W.id ? MV.tur(W.id) : { k: d.k, pdf: [] };
      Object.assign(t, { ad: d.ad.trim(), g: d.g, b: g.b, periyot: +d.periyot, sure: d.sure ? +d.sure : null, std: d.std.slice() });
      if (!W.id) {
        if (d.dosya) t.pdf.unshift({ surum: "v1", tarih: MK.tarihYaz(MK.BUGUN), dosya: d.dosya });
        MV.KATALOG.push(t);
      }
      ileti = W.id ? "Tür güncellendi; açık raporlar eski ayarla kalır." : t.ad + " eklendi" + (t.pdf.length ? " ve rapor formatı yüklendi." : "; rapor formatı yüklenince bu türde rapor oluşturulur.");
    }
    $("a-pencere").close();
    location.hash = "#/tur/" + t.k;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = k === "k" ? e.target.value.toUpperCase().replace(/[^A-Z]/g, "") : e.target.value; };
  MK.onSecim = function (id, deger) { if (W && id === "w-g") { W.d.g = deger; delete W.hata.g; pencereCiz("w-g"); } };
  document.addEventListener("change", function (e) {
    var s = e.target.dataset && e.target.dataset.std; if (!s || !W) return;
    var i = W.d.std.indexOf(s); if (e.target.checked && i < 0) W.d.std.push(s); else if (!e.target.checked && i >= 0) W.d.std.splice(i, 1);
  });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.id ? "#/tur/" + r.id : "#/"); });

  MK.kabuk({ modul: 5, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  $("a-tur-bilgi").innerHTML = MK.serit("bilgi", "file-text", "Her türe firmanızın rapor formatını PDF olarak yükleyin; denetçi “Rapor oluştur” dediğinde rapor bu formata göre hazırlanır. Ekipmanlar planın içinde görünür.");
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t");
  MK.seciciCiz("t"); goster(false);
})();
