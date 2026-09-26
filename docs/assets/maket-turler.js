/* ══ probata MAKET M3 — Ekipman türleri (modül 5) · 2. TUR, ONAY BEKLİYOR (2026-09-26) ═══════════════════════════════════
   Kaynak: pkproje.md §3.1 modül 5 (Ek-III grubu, branş, periyot, standart(lar), akreditasyon, Bakanlık format kodu), §4.7
   (periyot), §4.8 (formatlar), §3.2 madde 1 (rapor, firma × tür şablon sürümüyle açılır) ve 3 (onay branşa göre).
   Ekranlar: katalog (#/) · tür sayfası (#/tur/<kod>) · firma ayarları penceresi (#/tur/<kod>/duzenle). Bakış: mekanik yönetici.
   Veri UYDURMA; standart atamaları örnektir.
   2. tur (2026-09-26, reisim):
   · "ekipmanlar ve ekipman türleri diye iki modüle gerek yok ekipman türleri yeterli" · "planlar açıldığında ekipmanlar orada
     gözüküyor ya, oradan rapor oluştur diyoruz" → Ekipmanlar ekranı kalktı; ekipmanı denetçi sahada planın içinde ekler, sonraki
     yıllarda önceki raporundan "Rapor oluştur" ile yeni rapor açılır. Buradaki ekipman sayısı yalnız bilgi.
   · 51 "hayır bu işi denetçiler yapacak" → firma tür EKLEMEZ; türler ve rapor şablonları bizden (probata) gelir. Firma yalnız kendi
     ayarını değiştirir: periyot, tahmini kontrol süresi, kontrol metodu standartları.
   · 52 (öneri kabul) → yetkili meslekler bölümü kalktı; yetkisiz denetçi plana alınırsa yalnız uyarı (M1, M6).
   · 53 (öneri kabul) → periyot türde; bir ekipmanın sonraki kontrol tarihi planda / raporda elle değiştirilir (M8).
   · 54 (öneri kabul) → tahmini kontrol süresi isteğe bağlı.
   · Çakışma (öneri kabul) → rapor şablonunun yalnız adı ve önizleme bağlantısı; önizleme M7'de. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var FORMAT = { zorunlu: { ad: "zorunlu", rozet: "a-rozet-kabul" }, taslak: { ad: "taslak", rozet: "a-rozet-notr" } };
  /* listede sütun başlığı "Akreditasyon" der → rozet kısa; tür sayfasının başlığında bağlam için uzun ad */
  var AKR = { zorunlu: { ad: "Zorunlu", rozet: "a-rozet-kabul" }, "2027": { ad: "2027'den", rozet: "a-rozet-bekliyor" } };
  var AKR_UZUN = { zorunlu: { ad: "Akreditasyon zorunlu", rozet: "a-rozet-kabul" }, "2027": { ad: "Akreditasyon 2027'den", rozet: "a-rozet-bekliyor" } };
  var ekipmanSay = function (t) { return MV.EKIPMAN.filter(function (e) { return e.tur === t.k; }).length; };
  var bransHtml = function (b) { return '<span class="a-hucre-satir">' + ikon(b === "m" ? "cog" : "zap", "a-ikon-kucuk") + MV.bransAd(b) + "</span>"; };

  /* ── KATALOG ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("t", { ad: "Türlerde ara", ipucu: "Tür, kod, standart no", birim: "tür",
    cipler: [
      { k: "zorunlu", ad: "Bakanlık formatı zorunlu", test: function (t) { return t.formatDurum === "zorunlu"; } },
      { k: "akr", ad: "Akreditasyon gerekli", test: function (t) { return !!t.akr; } },
      { k: "sablonsuz", ad: "Rapor şablonu hazırlanıyor", test: function (t) { return !t.sablon; } },
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
    { k: "sablon", baslik: "Rapor şablonu", kart: "govde", sira: 6, hucre: function (t) {
      return '<span class="a-kart-etiket">Rapor şablonu</span>' + (t.sablon ? '<span class="a-tarih-saat">' + t.sablon + "</span>" : '<span class="a-uyari-metin">Hazırlanıyor</span>');
    } },
    { k: "akr", baslik: "Akreditasyon", kart: "rozet", sira: 1, hucre: function (t) { return t.akr ? rozet(AKR[t.akr]) : '<span class="a-deger-yok">—</span>'; } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "t", kayitlar: MV.KATALOG, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.b === b.b ? a.ad.localeCompare(b.ad, "tr") : a.b === "m" ? -1 : 1; }); },
      bosVeri: { ikon: "layers", baslik: "Katalogda tür yok", metin: "Türler rapor şablonlarıyla birlikte probata tarafından tanımlanır." },
      tablo: { baslik: "Ekipman türleri", sinif: "a-tablo-tur", sutunlar: SUTUN, href: function (t) { return "#/tur/" + t.k; } } });
  }

  /* ── TÜR SAYFASI ─────────────────────────────────────────────────────────────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function turCiz(t) {
    if (!t) {
      $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Tür bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Tür bulunamadı", metin: "Bu adreste katalogda tür yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Türlere dön</a>" });
      return;
    }
    var g = MV.grup(t.g), n = ekipmanSay(t), onay = t.b === "m" ? "Mekanik yönetici" : "Elektrik yönetici";
    var sure = t.sure ? t.sure + " dk" : '<span class="a-deger-yok">Girilmedi</span>';
    $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri", "#/"], [t.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(t.ad) + "</h1>" + (t.akr ? rozet(AKR_UZUN[t.akr]) : "") + "</div>" +
        '<p class="a-nesne-alt">' + ikon("layers", "a-ikon-kucuk") + "<span>Kod " + t.k + " · " + kacis(g.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="#/tur/' + t.k + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Ayarları düzenle</a></div></div>" +
      '<div class="a-yuzler">' +
        /* 2. tur: Ekipmanlar ekranı yok → sayı yalnız bilgi (tıklanmaz) */
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: n, not: "planlarda, bütün tesislerde" }) +
        yuz({ ikon: "badge-check", ad: "Onay", sayi: MV.bransAd(t.b), not: onay + " onaylar" }) +
        yuz({ ikon: "alarm-clock", ad: "Periyot", sayi: t.periyot + " ay", not: "sonraki kontrol önerisi" }) +
        yuz({ ikon: "clock", ad: "Tahmini süre", sayi: t.sure ? t.sure + " dk" : "—", not: t.sure ? "plan saat önerisi" : "girilmedi" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-kural"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kural">Kontrol kuralları</h2></div><dl class="a-bilgi">' +
        bilgi("Ek-III grubu", kacis(g.ad), true) + bilgi("Branş", MV.bransAd(t.b) + ' <span class="a-alt-inline">· onay ' + onay.toLocaleLowerCase("tr") + "</span>") +
        bilgi("Periyot", t.periyot + ' ay <span class="a-alt-inline">· tek ekipmanın tarihi planda değiştirilebilir</span>') +
        bilgi("Tahmini kontrol süresi", sure) +
        bilgi("Bakanlık rapor formatı", t.format ? '<span class="a-kod">' + t.format + "</span> " + rozet(FORMAT[t.formatDurum]) : '<span class="a-deger-yok">Yayımlanmadı</span>') +
        bilgi("Akreditasyon", t.akr === "zorunlu" ? "Zorunlu" : t.akr === "2027" ? "1 Ocak 2027'den zorunlu" : '<span class="a-deger-yok">Gerekmez</span>') +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-std"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-std">Kontrol metodu standartları</h2><span class="a-sayac"><b>' + t.std.length + "</b> standart</span>" +
        MK.git({ hedef: 4, hash: "#/?tur=" + t.k, ad: "Standart kütüphanesi", ikon: "book-open", sinif: "a-tus-ikincil a-bolum-tus", ne: "Standartlar" }) + "</div>" +
        (t.std.length ? '<ul class="a-kosullar">' + t.std.map(function (k) { var s = MV.standart(k); return '<li class="a-kosul-bilgi">' + ikon("book-open", "a-ikon-kucuk") + '<span><span class="a-kod">' + s.no + "</span> · " + kacis(s.konu) + "</span></li>"; }).join("") + "</ul>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Standart seçilmemiş: raporun kontrol metodu rapor anında yazılır.") + "</div>") +
      "</section>" +
      /* çakışma (M7): yalnız şablonun adı ve önizleme bağlantısı */
      '<section class="a-bolum" aria-labelledby="a-b-sablon"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-sablon">Rapor şablonu</h2>' +
        (t.sablon ? MK.git({ hedef: "sablon", hash: "#/" + t.k, ad: "Şablonu önizle", ikon: "file-text", sinif: "a-tus-ikincil a-bolum-tus", ne: "Rapor şablonu önizlemesi" }) : "") + "</div>" +
        (t.sablon ? '<p class="a-bolum-aciklama">' + kacis(t.sablon.split(" · ")[0]) + " · yürürlük " + kacis(t.sablon.split(" · ")[1]) + ". Eski raporlar kendi sürümüyle açılır.</p>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "file-text", "Bu türün rapor şablonu hazırlanıyor (probata). Hazır olunca bu türde rapor oluşturulur.") + "</div>") +
      "</section>";
  }

  /* ── FİRMA AYARLARI PENCERESİ (2. tur: tür eklenmez; ad, kod ve grup bizden gelir, değişmez) ────────────── */
  var W = null;
  function denetle() {
    var h = {}, d = W.d;
    if (!/^\d{1,3}$/.test(String(d.periyot)) || +d.periyot < 1 || +d.periyot > 120) h.periyot = "Periyot 1–120 ay.";
    if (d.sure && !/^\d{1,3}$/.test(String(d.sure))) h.sure = "Dakika olarak; boş bırakılabilir.";
    return h;
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, t = MV.tur(W.id), A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    $("a-pencere-baslik").textContent = "Ayarları düzenle";
    $("a-pencere-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(t.ad) + "</b> · kod " + t.k + "<br>Tür, kod ve grup probata'dan gelir; buradaki ayarlar yalnız firmanızın.</p>" +
      '<div class="a-form">' +
      A("periyot", "Periyot (ay)", d.periyot, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', ipucu: "Sonraki kontrol önerisi bununla hesaplanır." }) +
      A("sure", "Tahmini kontrol süresi (dk)", d.sure, { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', ipucu: "İsteğe bağlı; plan saat önerisinde kullanılır." }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Kontrol metodu standartları</p><p class="a-bolum-aciklama">Firmanın kütüphanesinden; hiçbiri seçilmezse metot rapor anında yazılır.</p>' +
        '<ul class="a-secim-listesi">' + MV.STANDARTLAR.map(function (s) {
          return '<li><label class="a-secim-satir"><input type="checkbox" data-std="' + s.k + '"' + (d.std.indexOf(s.k) >= 0 ? " checked" : "") + '><span class="a-secim-metin"><span class="a-kod">' + s.no + '</span><span class="a-alt-satir">' + kacis(s.konu) + "</span></span></label></li>";
        }).join("") + "</ul></div></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Kaydet", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(id) {
    var t = MV.tur(id);
    W = { id: id, hata: {}, d: { periyot: String(t.periyot), sure: t.sure ? String(t.sure) : "", std: t.std.slice() } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-periyot").focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if ((m = /^#\/tur\/([A-Z]{2,3})(\/duzenle)?$/.exec(h))) return { v: "tur", id: m[1], pencere: !!m[2] && !!MV.tur(m[1]) };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), t = r.id ? MV.tur(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else turCiz(t);
    document.title = (r.v === "liste" ? "Ekipman türleri" : t ? t.ad : "Tür bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.id); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  MK.eylem["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    var d = W.d, t = MV.tur(W.id);
    Object.assign(t, { periyot: +d.periyot, sure: d.sure ? +d.sure : null, std: d.std.slice() });
    $("a-pencere").close();
    location.hash = "#/tur/" + t.k;
    MK.bildir("Ayarlar kaydedildi; açık raporlar eski ayarla kalır, yeni raporlar yeni ayarla açılır.");
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = e.target.value.trim(); };
  document.addEventListener("change", function (e) {
    var s = e.target.dataset && e.target.dataset.std; if (!s) return;
    var i = W.d.std.indexOf(s); if (e.target.checked && i < 0) W.d.std.push(s); else if (!e.target.checked && i >= 0) W.d.std.splice(i, 1);
  });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", "#/tur/" + r.id); });

  MK.kabuk({ modul: 5, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  $("a-tur-bilgi").innerHTML = MK.serit("bilgi", "layers", "Türler ve rapor şablonları probata'dan gelir; periyot, tahmini süre ve standartlar firmanızın ayarıdır. Ekipmanlar planın içinde: denetçi sahada ekler, sonraki yıl önceki raporundan yeni rapor oluşturur.");
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t");
  MK.seciciCiz("t"); goster(false);
})();
