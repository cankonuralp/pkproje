/* ══ probata MAKET M3 — Ekipman türleri (modül 5) · 2. TUR, ONAYLANDI (2026-09-26) ═══════════════════════════════════
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
   · 2026-09-27 (yirmi dördüncü tur): türün kullanacağı ölçüm cihazları (düzenlenir; rapor bunları ister) · rapor bölümleri
     (formattan · standart · sabit)
   · 52 → yetkili meslekler bölümü yok (yetkisiz denetçide yalnız uyarı) · 53 → periyot türde, tek ekipmanın tarihi planda değişir ·
     54 → tahmini kontrol süresi isteğe bağlı.
   · 2026-10-13 (S.A.Y Chat, ön model ekran 12 — reisim: "yönergedeki etiket bilgisi satırlarını kullanıcı ekipman türlerinde düzenleyebilmeli,
     S.A.Y Chat ayarları diye bir kısım olsun"): tür sayfasında tıklayınca açılan "S.A.Y Chat ayarları" — mesaj satırları (sıra · telefonda yazan
     ad · rapordaki alan, formatın alanlarından · hazır değer · yukarı / aşağı · sil · Satır ekle) ve okunacak fotoğraf başlıkları (formatta
     fotoğraftan doldurması açık bölümlerden; aç / kapa · sil · Başlık ekle); sağda "Telefonda böyle görünür"; bölümün kendi Kaydet / Vazgeç'i.
     Yeni türde satırlar formatın ekipman bilgisi alanlarından hazır gelir. Değişiklik yeni kayıtlarda geçerli (kayıt tanım sürümünü taşır). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var FORMAT = { zorunlu: { ad: "zorunlu", rozet: "a-rozet-kabul" }, taslak: { ad: "taslak", rozet: "a-rozet-notr" } };
  var RF = { var: { ad: "Yüklendi", rozet: "a-rozet-tamam" }, yok: { ad: "Yüklenmedi", rozet: "a-rozet-bekliyor" } };
  var ekipmanSay = function (t) { return MV.EKIPMAN.filter(function (e) { return e.tur === t.k; }).length; };
  /* rapor formatı: firmanın yüklediği PDF'ler, en yenisi başta. Maket: rapor şablonu olan türde bir sürüm yüklenmiş sayılır. */
  MV.KATALOG.forEach(function (t) {
    if (t.pdf) return;
    var s = t.sablon ? t.sablon.split(" · ") : null, f = t.format && MV.raporFormati(t.format);
    /* 2026-09-27: Bakanlığın resmî formatı elimizde olan türde (ZPKR01, ZPKR02) o PDF'in kendisi */
    if (f) { t.pdf = [{ surum: f.k, tarih: MK.tarihNo(f.yururluk), dosya: f.dosya }]; return; }
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
      { k: "grup", ad: "Ek-III grubu", secenek: function () { return [["tumu", "Tümü"]].concat(MV.GRUPLAR.filter(function (g) { return !g.b || g.b === BR; }).map(function (g) { return [g.k, g.ad]; })); }, gecer: function (t, v) { return v === "tumu" || t.g === v; } }
    ],
    metin: function (t) { return [t.ad, t.k, t.format || ""].concat(t.std.map(function (s) { return MV.standart(s).no; })).join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "tur", baslik: "Tür", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-ad-bag" href="#/tur/' + t.k + '">' + kirp(t.ad) + '</a><span class="a-alt-satir">Kod ' + t.k + " · " + ekipmanSay(t) + " ekipman</span>"; } },
    { k: "grup", baslik: "Ek-III grubu", kart: "govde", sira: 2, hucre: function (t) { return '<span class="a-kart-etiket">Ek-III grubu</span>' + kirp(MV.grup(t.g).ad); } },
    { k: "periyot", baslik: "Periyot", kart: "govde", sira: 4, hucre: function (t) { return '<span class="a-sayi"><span class="a-kart-etiket">Periyot</span>' + t.periyot + " ay</span>"; } },
    { k: "format", baslik: "Bakanlık formatı", kart: "govde", sira: 5, hucre: function (t) {
      return '<span class="a-kart-etiket">Bakanlık formatı</span>' + (t.format ? '<span class="a-hucre-satir"><span class="a-kod">' + t.format + "</span>" + rozet(FORMAT[t.formatDurum]) + "</span>" : '<span class="a-deger-yok">Yayımlanmadı</span>');
    } },
    { k: "rapor", baslik: "Rapor formatı", kart: "rozet", sira: 1, hucre: function (t) {
      var p = guncel(t);
      return rozet(RF[p ? "var" : "yok"]) + (p ? '<span class="a-tarih-saat">' + kacis(p.surum) + " · " + kacis(p.tarih) + "</span>" : "");
    } }
  ];
  /* AA5 (2026-10-02): liste branşa göre iki sekme — Mekanik (#/) · Elektrik (#/elektrik); branş sütunu ve süzgeci gereksizleşti */
  var BR = "m";
  function sekmeCiz() {
    $("a-tur-sekmeler").innerHTML = [["m", "#/", "Mekanik"], ["e", "#/elektrik", "Elektrik"]].map(function (x) {
      return '<a class="a-sekme" href="' + x[1] + '"' + (BR === x[0] ? ' aria-current="page"' : "") + ">" + ikon(x[0] === "m" ? "cog" : "zap", "a-ikon-kucuk") + x[2] +
        ' <span class="a-cip-sayi">' + MV.KATALOG.filter(function (t) { return t.b === x[0]; }).length + "</span></a>"; }).join("");
  }
  function listeCiz() {
    sekmeCiz();
    MK.listeCiz({ on: "t", kayitlar: MV.KATALOG.filter(function (t) { return t.b === BR; }), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); }); },
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
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { /* 159: yeni yüklenen formatın rapor ekranı bizde hazırlanır; o sırada "Hazırlanıyor" */
        return rozet(x !== p ? { ad: "Önceki", rozet: "a-rozet-notr" } : x.dosya.indexOf(MK.BUGUN) >= 0 ? { ad: "Hazırlanıyor", rozet: "a-rozet-bekliyor" } : { ad: "Kullanımda", rozet: "a-rozet-tamam" }); } },
      /* her sürümün yüklenen PDF'i açılır, önceki sürümler dahil (reisim 2026-09-27) */
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
        /* 2026-09-28: sürüm silinir (kullanımdaki silinince bir önceki kullanıma girer) */
        return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.pdfTus(x.dosya) + '<button class="a-ikon-tus" type="button" data-eylem="format-sil" data-surum="' + kacis(x.surum) + '" aria-label="' + kacis(x.surum) + ' sil" title="Sil">' + ikon("x") + "</button></div></div>"; } }
    ];
  }
  /* ── S.A.Y CHAT AYARLARI (2026-10-13, ekran 12): taslak SCA (Kaydet'e kadar kaydedilmez); açık / kapalı hâli tür başına ─────────────── */
  var SCA = null, SC_ACIK = {};
  var scKopya = function (a) { return { satirlar: a.satirlar.map(function (x) { return Object.assign({}, x); }), okunacak: a.okunacak.map(function (x) { return Object.assign({}, x); }) }; };
  var scTaslak = function (t) { if (!SCA || SCA.k !== t.k) SCA = { k: t.k, d: scKopya(MV.sayChatAyar(t)), hata: null }; return SCA; };
  function scAyarHtml(t) {
    var kayitli = MV.sayChatAyar(t), x = SCA && SCA.k === t.k ? SCA : null, a = x ? x.d : kayitli, alan = MV.sayChatAlanlar(t), bas = MV.sayChatBasliklar(t), bm = {};
    bas.forEach(function (b) { bm[b[0]] = b; });
    var ok = a.okunacak.filter(function (o) { return bm[o.k]; }), acikSay = ok.filter(function (o) { return o.acik; }).length;
    var kalan = bas.filter(function (b) { return !a.okunacak.some(function (o) { return o.k === b[0]; }); });
    var satirlar = a.satirlar.map(function (st, i) {
      var hata = x && x.hata && x.hata.i === i;
      return '<li class="a-sca-satir"><span class="a-sc-no" aria-hidden="true">' + (i + 1) + "</span>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-sca-ad' + i + '">' + (i + 1) + ". satır · telefonda yazan</label>" +
          '<input class="a-girdi" id="a-sca-ad' + i + '" data-sca="ad" data-i="' + i + '" maxlength="30" autocomplete="off" value="' + kacis(st.ad) + '"' + (hata && x.hata.ne === "ad" ? ' aria-invalid="true"' : "") + "></div>" +
        '<div class="a-alan-grup"><p class="a-etiket" id="a-sca-alan' + i + '-e">Rapordaki alan</p>' + MK.secim({ id: "a-sca-alan" + i, ad: (i + 1) + ". satır · rapordaki alan", deger: st.alan, secenekler: alan, ipucu: "Alan seçin",
          gecersiz: hata && x.hata.ne === "alan" }) + "</div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-sca-hz' + i + '">Hazır değer <span class="a-alt-inline">isteğe bağlı</span></label>' +
          '<input class="a-girdi" id="a-sca-hz' + i + '" data-sca="hazir" data-i="' + i + '" maxlength="40" autocomplete="off" placeholder="yok" value="' + kacis(st.hazir || "") + '"></div>' +
        '<div class="a-sca-tuslar">' +
          '<button class="a-ikon-tus" type="button" data-eylem="sca-yukari" data-i="' + i + '" aria-label="' + (i + 1) + '. satırı yukarı al" title="Yukarı"' + (i ? "" : " disabled") + ">" + ikon("arrow-up") + "</button>" +
          '<button class="a-ikon-tus" type="button" data-eylem="sca-asagi" data-i="' + i + '" aria-label="' + (i + 1) + '. satırı aşağı al" title="Aşağı"' + (i < a.satirlar.length - 1 ? "" : " disabled") + ">" + ikon("arrow-down") + "</button>" +
          '<button class="a-ikon-tus" type="button" data-eylem="sca-sil" data-i="' + i + '" aria-label="' + (i + 1) + '. satırı sil" title="Sil">' + ikon("trash-2") + "</button></div></li>";
    }).join("");
    var okunacak = ok.map(function (o) {
      return '<li class="a-sca-ok"><span><b>' + kacis(bm[o.k][1]) + '</b><small class="a-alt-satir">' + bm[o.k][2] + "</small></span>" +
        '<button class="a-cip" type="button" data-eylem="sca-ok-ac" data-k="' + o.k + '" aria-pressed="' + o.acik + '">' + (o.acik ? "Açık" : "Kapalı") + "</button>" +
        '<button class="a-ikon-tus" type="button" data-eylem="sca-ok-sil" data-k="' + o.k + '" aria-label="' + kacis(bm[o.k][1]) + ' başlığını sil" title="Sil">' + ikon("trash-2") + "</button></li>";
    }).join("");
    var onizle = '<div class="a-sc-yonerge"><p class="a-sc-ara">Her satıra sırayla</p><ol>' + a.satirlar.map(function (st) { return "<li>" + (kacis(st.ad) || '<span class="a-deger-yok">ad yok</span>') + (st.hazir ? ' <span class="a-alt-inline">· ' + kacis(st.hazir) + "</span>" : "") + "</li>"; }).join("") + "</ol>" +
      '<p class="a-sc-etiket-durum">' + ikon("tag", "a-ikon-kucuk") + "Etiket fotoğrafı</p>" +
      (ok.filter(function (o) { return o.acik; }).length ? '<p class="a-sc-ara">Okunacak fotoğraflar</p><ul class="a-sca-onizle-ok">' + ok.filter(function (o) { return o.acik; }).map(function (o) { return "<li>" + ikon("scan-text", "a-ikon-kucuk") + kacis(bm[o.k][1]) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    return '<details class="a-bolum a-bolum-acilir" id="a-sca"' + (SC_ACIK[t.k] || x ? " open" : "") + '><summary class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-sca">S.A.Y Chat ayarları</h2>' +
        '<span class="a-sayac"><b>' + a.satirlar.length + "</b> satır · <b>" + acikSay + "</b> okunacak fotoğraf" + (x ? " · kaydedilmedi" : kayitli.hazirGeldi ? " · formattan hazır" : " · sürüm " + kayitli.surum) + "</span>" +
        ikon("chevron-down", "a-ikon-kucuk a-acilir-ok") + "</summary>" +
      '<div class="a-sca-govde"><div class="a-sca-sol">' +
        '<h3 class="a-sca-baslik">Mesaj satırları (etiket bilgileri)</h3><p class="a-ipucu">Denetçinin mesajında her satır sırayla bir alana yazılır. Satır adını, sırasını, rapordaki alanını ve hazır değerini değiştirin; satır ekleyin ya da silin.</p>' +
        '<ol class="a-sca-satirlar" aria-label="Mesaj satırları">' + satirlar + "</ol>" +
        MK.tus({ eylem: "sca-ekle", ad: "Satır ekle", ikon: "plus", sinif: "a-tus-ikincil" }) +
        '<p class="a-ipucu">Hazır değerli satır mesaj kutusunda dolu gelir; denetçi üstüne yazıp değiştirir. Yönergeden fazla yazılan satırlar nota eklenir. Değişiklik yeni kayıtlarda geçerli; gönderilmiş kayıtlar gönderildikleri andaki sırayla okunur.</p>' +
        '<h3 class="a-sca-baslik">Okunacak fotoğraflar (yapay zekâ)</h3><p class="a-ipucu">Kayıtta bu başlıklar altında fotoğraf eklenir (test tablosu, linye, ölçüm ekranı). Rapor yazılırken yapay zekâ okur, o bölümü öneri olarak doldurur. Başlıklar, rapor formatında fotoğraftan doldurması açık bölümlerden seçilir.</p>' +
        (okunacak ? '<ul class="a-sca-oklar">' + okunacak + "</ul>" : '<p class="a-bos-satir">Okunacak fotoğraf başlığı yok.</p>') +
        (kalan.length ? '<div class="a-alan-grup a-sca-ok-ekle"><p class="a-etiket" id="a-sca-ok-e">Başlık ekle</p>' + MK.secim({ id: "a-sca-ok", ad: "Okunacak fotoğraf başlığı ekle", deger: "", secenekler: kalan.map(function (b) { return [b[0], b[1], b[2]]; }), ipucu: "Başlık seçin" }) + "</div>"
          : '<p class="a-ipucu">Formatta fotoğraftan doldurması açık başka bölüm yok.</p>') +
      "</div>" +
      '<aside class="a-sca-sag" aria-label="Telefonda böyle görünür"><p class="a-sc-ara">' + ikon("smartphone", "a-ikon-kucuk") + " Telefonda böyle görünür</p>" + onizle + "</aside></div>" +
      '<div class="a-sc-tuslar a-sca-alt">' + MK.tus({ eylem: "sca-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil", kapali: !x }) + MK.tus({ eylem: "sca-kaydet", ad: "Kaydet", ikon: "check", kapali: !x }) + "</div></details>";
  }
  /* yeniden çizerken odak ve imleç yerinde (yazarken satır değişince) */
  function scCiz(t, odak) {
    var a = document.activeElement, id = odak || (a && a.id), ss = a && a.selectionStart, se = a && a.selectionEnd;
    turCiz(t);
    var el = id && document.getElementById(id); if (el) { el.focus({ preventScroll: true }); if (!odak) { try { el.setSelectionRange(ss, se); } catch (h) { /* girdi değil */ } } }
  }
  document.addEventListener("toggle", function (e) { var d = e.target; if (d.id === "a-sca") { var r = rota(); if (r.id) SC_ACIK[r.id] = d.open; } }, true);
  document.addEventListener("input", function (e) {
    var el = e.target, ne = el.dataset && el.dataset.sca; if (!ne) return;
    var t = MV.tur(rota().id); if (!t) return;
    var x = scTaslak(t); x.d.satirlar[+el.dataset.i][ne] = el.value; x.hata = null; scCiz(t);
  });
  function scTur() { return MV.tur(rota().id); }
  function turCiz(t) {
    if (!t) {
      $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Tür bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Tür bulunamadı", metin: "Bu adreste tür yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Türlere dön</a>" });
      return;
    }
    var g = MV.grup(t.g), n = ekipmanSay(t), onay = t.b === "m" ? "Mekanik yönetici" : "Elektrik yönetici", p = guncel(t);
    $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri · " + MV.bransAd(t.b), t.b === "e" ? "#/elektrik" : "#/"], [t.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(t.ad) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("layers", "a-ikon-kucuk") + "<span>Kod " + t.k + " · " + kacis(g.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="#/tur/' + t.k + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a>" +
          /* AA10: firmanın kendi formatını kurduğu ekran (§8.3, 2026-10-02 onaylı) */
          '<a class="a-tus a-tus-ikincil" href="#/tur/' + t.k + '/kurucu">' + ikon("layout-list", "a-ikon-kucuk") + "Format kurucu</a>" +
          '<a class="a-tus a-tus-birincil" href="#/tur/' + t.k + '/format">' + ikon("file-plus", "a-ikon-kucuk") + (p ? "Yeni format yükle" : "Rapor formatı yükle") + "</a></div></div>" +
      '<div class="a-yuzler">' +
        /* Ekipmanlar ekranı yok → sayı yalnız bilgi */
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: n, }) +
        yuz({ ikon: "file-text", ad: "Rapor formatı", sayi: p ? p.surum : "Yok", not: p ? "yüklendi " + p.tarih : "PDF yüklenmedi", uyari: !p }) +
        yuz({ ikon: "badge-check", ad: "Onay", sayi: MV.bransAd(t.b), not: onay + " onaylar" }) +
        yuz({ ikon: "alarm-clock", ad: "Periyot", sayi: t.periyot + " ay", not: t.sure ? "tahmini " + t.sure + " dk" : "sonraki kontrol önerisi" }) +
      "</div>" +
      /* rapor formatı: firmanın kendi PDF'i (reisim 2026-09-26). Sorular bu formattan gelir — kurgusu M8'de. */
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">Rapor formatı</h2>' +
        (p ? '<span class="a-sayac"><b>' + t.pdf.length + "</b> sürüm</span>" + MK.tus({ eylem: "pdf-ac", ad: "PDF'i aç", ikon: "eye", sinif: "a-tus-ikincil a-bolum-tus", veri: { k: t.k } }) : "") + "</div>" +
        (p ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Rapor formatı sürümleri", sinif: "a-tablo-pdf", sutunlar: pdfSutun(p), kayitlar: t.pdf }) + "</div>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "file-plus", "Bu türün rapor formatı yüklenmedi. PDF yüklenince bu türde rapor oluşturulur.") + "</div>") +
      "</section>" +
      /* kullanılacak ölçüm cihazları (reisim 2026-09-27: "ekipmana göre hangi cihazların kullanılacağı ekipman türlerinden belirlenecek");
         raporda bu türlerin her birinden kalibrasyonu geçerli bir cihaz eklenmeden rapor onaya gönderilemez */
      '<section class="a-bolum" aria-labelledby="a-b-cihaz"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-cihaz">Kullanılacak ölçüm cihazları</h2><span class="a-sayac"><b>' + t.cihaz.length + "</b> cihaz türü</span>" +
        '<a class="a-tus a-tus-ikincil a-bolum-tus" href="#/tur/' + t.k + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a></div>" +
        (t.cihaz.length ? '<ul class="a-kosullar">' + t.cihaz.map(function (c) { return '<li class="a-kosul-bilgi">' + ikon("gauge", "a-ikon-kucuk") + "<span>" + kacis(MV.cihazTuru(c).ad) + "</span></li>"; }).join("") + "</ul>"
          : '<p class="a-bos-satir">Cihaz türü seçilmedi.</p>') + "</section>" +
      /* 2026-10-13: S.A.Y Chat ayarları (ekran 12) — tıklayınca açılır */
      scAyarHtml(t) +
      /* rapor bölümleri (reisim 2026-09-27: "7-8-9. kısımlar da sabit ama muayene kriterleri test değerleri kısımlar firmanın verdiği pdf e göre
         düzenlenebilir olacak diğer kısımlarda düzenlenebilir olacak gerçi ama standart") */
      '<section class="a-bolum" aria-labelledby="a-b-bolum"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bolum">Rapor bölümleri</h2></div><dl class="a-satirlar">' +
        '<div class="a-satir"><dt>Bu türün formatından</dt><dd>Muayene kriterleri (' + MV.kriterler(t).length + " madde) · Test değerleri (" + MV.testler(t).length + ")" + (t.g === "elektrik" ? " · Pano sigortaları" : "") + "</dd></div>" +
        '<div class="a-satir"><dt>Standart</dt><dd>Firma bilgileri · Ekipman bilgileri · Ölçüm cihazları</dd></div>' +
        '<div class="a-satir"><dt>Her raporda sabit</dt><dd>Fotoğraflar · Sonuç ve kanaat · Muayene uzmanı yorumu</dd></div></dl></section>' +
      '<section class="a-bolum" aria-labelledby="a-b-kural"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kural">Kontrol kuralları</h2></div><dl class="a-bilgi">' +
        bilgi("Ek-III grubu", kacis(g.ad), true) + bilgi("Branş", MV.bransAd(t.b) + ' <span class="a-alt-inline">· onay ' + onay.toLocaleLowerCase("tr") + "</span>") +
        bilgi("Periyot", t.periyot + " ay") +
        bilgi("Tahmini kontrol süresi", t.sure ? t.sure + " dk" : '<span class="a-deger-yok">Girilmedi</span>') +
        bilgi("Bakanlık rapor formatı", t.format ? '<span class="a-kod">' + t.format + "</span> " + rozet(FORMAT[t.formatDurum]) +
          (MV.KONTROL_BELGELERI.filter(function (k) { return k.tur === t.k; }).map(function (k) { return '<span class="a-alt-satir">kontrol kriterleri <a class="a-baglanti" href="' + MK.adres(4, "#/k/" + k.k) + '">' + k.k + "</a></span>"; }).join("")) : '<span class="a-deger-yok">Yayımlanmadı</span>') +
        /* 2026-09-28 (reisim: ölçüm metodu "tür de belirlensin"): formatlı türde formattaki ölçüm metotlarından biri; raporda türden okunur */
        (MV.formatYapi(t) ? bilgi("Ölçüm metodu", t.olcumMetot ? kacis(t.olcumMetot) : '<span class="a-uyari-metin">Belirlenmemiş</span>') : "") +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-std"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-std">Kontrol metodu standartları</h2><span class="a-sayac"><b>' + t.std.length + "</b> standart</span>" +
        MK.git({ hedef: 4, hash: "#/?tur=" + t.k, ad: "Standart kütüphanesi", ikon: "book-open", sinif: "a-tus-ikincil a-bolum-tus", ne: "Standartlar" }) + "</div>" +
        (t.std.length ? '<ul class="a-kosullar">' + t.std.map(function (k) { var s = MV.standart(k); return '<li class="a-kosul-bilgi">' + ikon("book-open", "a-ikon-kucuk") + '<span><span class="a-kod">' + s.no + "</span> · " + kacis(s.konu) + "</span></li>"; }).join("") + "</ul>"
          : '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Standart seçilmemiş; raporda kontrol metodu “Üretici talimatı” yazar.") + "</div>") +
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
    else if (d.g === "ekdisi" && !d.b) h.b = "Ek-III dışı türde branş seçilmeli.";
    if (!/^\d{1,3}$/.test(String(d.periyot)) || +d.periyot < 1 || +d.periyot > 120) h.periyot = "Periyot 1–120 ay.";
    if (d.sure && !/^\d{1,3}$/.test(String(d.sure))) h.sure = "Dakika olarak; boş bırakılabilir.";
    return h;
  }
  function dosyaSec(d) {
    return '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Rapor formatı (PDF)</p>' +
      '<div class="a-dosya-sec" id="w-dosya">' + (d.dosya ? MK.dosyaAlan({ ad: d.dosya, degistir: "pdf-sec", sil: "pdf-kaldir" }) : MK.tus({ eylem: "pdf-sec", ad: "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
      (W.hata.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + W.hata.dosya + "</p>"
        : "") + "</div>";
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
        A("g", "Ek-III grubu", "", { zorunlu: true, girdi: MK.secim({ id: "w-g", ad: "Ek-III grubu", deger: d.g, secenekler: MV.GRUPLAR.map(function (g) { return [g.k, g.ad, g.b ? MV.bransAd(g.b) : "branş seçilir"]; }), ipucu: "Grup seçin", gecersiz: !!h.g, tanim: "w-g-ipucu" }), ipucu: d.g === "ekdisi" ? "Ek-III dışı: meslek kuralı uygulanmaz." : "Branş ve onaylayan yönetici gruptan gelir." }) +
        (d.g === "ekdisi" ? A("b", "Branş", "", { zorunlu: true, girdi: MK.secim({ id: "w-b", ad: "Branş", deger: d.b || "", secenekler: [["m", "Mekanik"], ["e", "Elektrik"]], ipucu: "Branş seçin", gecersiz: !!h.b, tanim: "w-b-ipucu" }), ipucu: "Onaylayan yönetici branştan gelir." }) : "") +
        A("periyot", "Periyot (ay)", d.periyot, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3" placeholder="ör. 12"', ipucu: "Sonraki kontrol önerisi bununla hesaplanır." }) +
        A("sure", "Tahmini kontrol süresi (dk)", d.sure, { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', ipucu: "İsteğe bağlı; plan saat önerisinde kullanılır." }) +
        (W.id ? "" : dosyaSec(d)) +
        (W.id && MV.formatYapi(MV.tur(W.id)) ? MK.alan({ id: "w-olcum", etiket: "Ölçüm metodu", genis: true, girdi: MK.secim({ id: "w-olcum", ad: "Ölçüm metodu", deger: d.olcum, ipucu: "Seçin",
          secenekler: MV.formatYapi(MV.tur(W.id)).metot.map(function (m) { return [m, m]; }) }) }) : "") +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Kullanılacak ölçüm cihazları</p>' +
          '<ul class="a-secim-listesi">' + MV.CIHAZ_TURLERI.map(function (c) {
            return '<li><label class="a-secim-satir"><input type="checkbox" data-cihaz-tur="' + c.k + '"' + (d.cihaz.indexOf(c.k) >= 0 ? " checked" : "") + '><span class="a-secim-metin">' + kacis(c.ad) + "</span></label></li>";
          }).join("") + "</ul></div>" +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Kontrol metodu standartları</p>' +
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
      : t ? { ad: t.ad, k: t.k, g: t.g, periyot: String(t.periyot), sure: t.sure ? String(t.sure) : "", std: t.std.slice(), cihaz: t.cihaz.slice(), dosya: "", olcum: t.olcumMetot || "", b: t.b }
      : { ad: "", k: "", g: "", periyot: "", sure: "",   /* AA11 (2026-10-02, reisim: "örnek yazılar yazılı olarak geliyor, silip bir şey yazmam gerekiyor"): yeni kayıtta alan boş, yalnız silik ipucu */
        std: [], cihaz: [], dosya: "" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input:not([readonly]), .a-tus"); if (ilk) ilk.focus();
  }
  var sonrakiSurum = function (t) { return "v" + (t.pdf.reduce(function (m, x) { return Math.max(m, +x.surum.slice(1) || 0); }, 0) + 1); };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "liste", pencere: "tur" };
    if (h === "#/elektrik") return { v: "liste", b: "e" };
    /* AA10 (2026-10-02): format kurucu — #/tur/<kod>/kurucu[/<bölüm>] */
    if ((m = /^#\/tur\/([A-Z]{2,3})\/kurucu(?:\/(\d+))?$/.exec(h))) return { v: "kurucu", id: m[1], sec: m[2] ? +m[2] : 0 };
    if ((m = /^#\/tur\/([A-Z]{2,3})(?:\/(duzenle|format))?$/.exec(h))) return { v: "tur", id: m[1], pencere: m[2] && MV.tur(m[1]) ? (m[2] === "format" ? "format" : "tur") : null };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), t = r.id ? MV.tur(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste" && r.pencere !== "tur") { BR = r.b || "m"; MK.seciciCiz("t"); }
    if (r.v === "liste") listeCiz(); else if (r.v === "kurucu" && t) MK.kurucuCiz(t, r.sec); else turCiz(t);
    document.title = (r.v === "liste" ? "Ekipman türleri · " + MV.bransAd(BR) : t ? (r.v === "kurucu" ? "Format kurucu · " : "") + t.ad : "Tür bulunamadı") + " · probata maket";
    /* 2026-10-03 (reisim: "Format tasarımcısında herhangi bir başlığa tıklayınca en başa atıyor, en başa atmasın başlığı düzenlediğimiz yere
       odaklansın (telefonda)"): aynı türün kurucusunda bölüm değişince sayfa başa gitmez; düzenleyici görünmüyorsa ona kayar, odak başlığında */
    var ayniKurucu = r.v === "kurucu" && SON && SON.v === "kurucu" && SON.id === r.id, bolumDegisti = ayniKurucu && SON.sec !== r.sec; SON = r;
    /* 2026-10-03: ortak kabuk aynı yerde alt adrese geçişte odakla = false verir (sayfa başa atmasın); bölüm değişince odak yine düzenleyicide */
    if ((odakla || bolumDegisti) && ayniKurucu) {
      var kb = $("a-kb-baslik"), ust = kb ? kb.getBoundingClientRect().top : 0;
      if (kb && (ust < 0 || ust > window.innerHeight * 0.5)) kb.scrollIntoView({ block: "start" });
      if (kb) kb.focus({ preventScroll: true });
    } else if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, r.id); else if ($("a-pencere").open) $("a-pencere").close();
  }
  var SON = null;
  MK.goster = goster;
  var X = MK.eylem;
  X["tur-ac"] = function () { location.hash = "#/yeni"; };
  /* S.A.Y Chat ayarları (ekran 12) */
  X["sca-ekle"] = function () { var t = scTur(), x = scTaslak(t); x.d.satirlar.push({ ad: "", alan: "", hazir: "" }); scCiz(t, "a-sca-ad" + (x.d.satirlar.length - 1)); };
  X["sca-sil"] = function (el) {
    var t = scTur(), x = scTaslak(t), i = +el.dataset.i, ad = x.d.satirlar[i].ad || (i + 1) + ". satır";
    if (x.d.satirlar.length === 1) { MK.bildir("En az bir satır kalmalı."); return; }
    x.d.satirlar.splice(i, 1); scCiz(t, x.d.satirlar[i] ? "a-sca-ad" + i : "a-sca-ad" + (i - 1)); MK.bildir(ad + " silindi; Kaydet ile geçerli olur.");
  };
  var scTasi = function (el, y) {
    var t = scTur(), x = scTaslak(t), i = +el.dataset.i, j = i + y, l = x.d.satirlar; if (j < 0 || j >= l.length) return;
    var a = l[i]; l[i] = l[j]; l[j] = a; scCiz(t); var b = document.querySelector('[data-eylem="' + el.dataset.eylem + '"][data-i="' + j + '"]:not([disabled])') || $("a-sca-ad" + j); if (b) b.focus();
  };
  X["sca-yukari"] = function (el) { scTasi(el, -1); };
  X["sca-asagi"] = function (el) { scTasi(el, 1); };
  X["sca-ok-ac"] = function (el) { var t = scTur(), x = scTaslak(t), o = x.d.okunacak.filter(function (y) { return y.k === el.dataset.k; })[0]; o.acik = !o.acik; scCiz(t); var b = document.querySelector('[data-eylem="sca-ok-ac"][data-k="' + o.k + '"]'); if (b) b.focus(); };
  X["sca-ok-sil"] = function (el) { var t = scTur(), x = scTaslak(t); x.d.okunacak = x.d.okunacak.filter(function (y) { return y.k !== el.dataset.k; }); scCiz(t); var o = $("a-sca-ok") || document.querySelector('[data-eylem="sca-kaydet"]'); if (o) o.focus(); };
  X["sca-vazgec"] = function () { var t = scTur(); SCA = null; SC_ACIK[t.k] = true; scCiz(t); var b = $("a-b-sca"); if (b) b.closest("summary").focus(); MK.bildir("Değişiklikler bırakıldı."); };
  X["sca-kaydet"] = function () {
    var t = scTur(), x = SCA && SCA.k === t.k ? SCA : null; if (!x) return;
    var i = -1, ne = "";
    x.d.satirlar.some(function (st, j) { if (!st.ad.trim()) { i = j; ne = "ad"; return true; } if (!st.alan) { i = j; ne = "alan"; return true; } return false; });
    if (i >= 0) { x.hata = { i: i, ne: ne }; scCiz(t, ne === "ad" ? "a-sca-ad" + i : "a-sca-alan" + i); MK.bildir((i + 1) + ". satırın " + (ne === "ad" ? "telefonda yazan adı" : "rapordaki alanı") + " boş."); return; }
    var eski = MV.SAY_CHAT_AYAR[t.k];
    MV.SAY_CHAT_AYAR[t.k] = { surum: eski ? eski.surum + 1 : 2, satirlar: x.d.satirlar.map(function (st) { return { ad: st.ad.trim(), alan: st.alan, hazir: (st.hazir || "").trim() }; }),
      okunacak: x.d.okunacak.map(function (o) { return { k: o.k, acik: !!o.acik }; }) };
    SCA = null; SC_ACIK[t.k] = true; scCiz(t); var b = $("a-b-sca"); if (b) b.closest("summary").focus();
    MK.bildir("S.A.Y Chat ayarları kaydedildi (sürüm " + MV.SAY_CHAT_AYAR[t.k].surum + "); yeni kayıtlarda geçerli.");
  };
  /* 2026-09-27: gerçek dosya penceresi; seçilen PDF "Aç" ile görüntülenir */
  X["pdf-sec"] = function () {
    var k = (W.id || W.d.k || "tur").toLowerCase();
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 20, ornek: k + "-rapor-formati-" + MK.BUGUN + ".pdf" }, function (ad) {
      if (!W) return; W.d.dosya = ad; delete W.hata.dosya; pencereCiz(); $("a-pencere-alt").querySelector(".a-tus-birincil").focus();
    });
  };
  /* PDF'i aç: makette yüklenen PDF'in yerine rapor belgesi (MB.belge) pencerede açılır. Ayrı "rapor şablonu önizlemesi" ekranı
     kalktı (reisim 2026-09-26, M7 A: türün rapor formatı PDF'i yeter). */
  X["pdf-ac"] = function (el) {
    var t = MV.tur(el.dataset.k);
    W = { tur: "pdf", id: t.k, hata: {}, d: {} };
    $("a-pencere-baslik").textContent = t.ad + " · rapor formatı " + t.pdf[0].surum;
    $("a-pencere-govde").innerHTML = MK.dosyaOnizle(t.pdf[0].dosya, MB.belge(t));   /* yüklenen PDF'in kendisi; örnek kayıtta rapor belgesi (2026-09-28) */
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" });
    if (!$("a-pencere").open) $("a-pencere").showModal();
    $("a-pencere-alt").querySelector(".a-tus").focus({ preventScroll: true }); $("a-pencere-govde").scrollTop = 0;
  };
  X["pdf-kaldir"] = function () { if (!W) return; W.d.dosya = ""; pencereCiz(); var e = document.querySelector('#a-pencere [data-eylem="pdf-sec"]'); if (e) e.focus(); };
  X["format-sil"] = function (el) {
    var t = MV.tur(rota().id), x = t.pdf.filter(function (y) { return y.surum === el.dataset.surum; })[0], kullanimda = x === t.pdf[0];
    MK.onayla({ baslik: "Rapor formatını sil", metin: x.surum + " silinir." + (kullanimda ? (t.pdf.length > 1 ? " Bir önceki sürüm (" + kacis(t.pdf[1].surum) + ") kullanıma girer." : " Tür rapor formatısız kalır.") : ""), tamam: function () {
      t.pdf.splice(t.pdf.indexOf(x), 1); MK.dosyaSil(x.dosya); goster(false); MK.bildir(x.surum + " silindi.");
    } });
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
      Object.assign(t, { ad: d.ad.trim(), g: d.g, b: g.b || d.b, periyot: +d.periyot, sure: d.sure ? +d.sure : null, std: d.std.slice(), cihaz: d.cihaz.slice() });
      if (d.olcum) t.olcumMetot = d.olcum;
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
  MK.onGirdi = function (e) { if (MK.kurucuGirdi && rota().v === "kurucu" && MK.kurucuGirdi(e)) return; var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = k === "k" ? e.target.value.toUpperCase().replace(/[^A-Z]/g, "") : e.target.value; };
  MK.onSecim = function (id, deger) {
    var m = /^a-sca-alan(\d+)$/.exec(id), t = scTur();
    if (m && t) { var x = scTaslak(t); x.d.satirlar[+m[1]].alan = deger; x.hata = null; scCiz(t, id); return; }
    if (id === "a-sca-ok" && t && deger) { var y = scTaslak(t); y.d.okunacak.push({ k: deger, acik: true }); scCiz(t, "a-sca-ok"); MK.bildir("Okunacak fotoğraf başlığı eklendi; Kaydet ile geçerli olur."); return; }
    if (W && id === "w-g") { W.d.g = deger; delete W.hata.g; pencereCiz("w-g"); } else if (W && id === "w-b") { W.d.b = deger; delete W.hata.b; pencereCiz("w-b"); } else if (W && id === "w-olcum") { W.d.olcum = deger; pencereCiz("w-olcum"); } };
  document.addEventListener("change", function (e) {
    var c = e.target.dataset && e.target.dataset.cihazTur;
    if (c && W) { var j = W.d.cihaz.indexOf(c); if (e.target.checked && j < 0) W.d.cihaz.push(c); else if (!e.target.checked && j >= 0) W.d.cihaz.splice(j, 1); return; }
    var s = e.target.dataset && e.target.dataset.std; if (!s || !W) return;
    var i = W.d.std.indexOf(s); if (e.target.checked && i < 0) W.d.std.push(s); else if (!e.target.checked && i >= 0) W.d.std.splice(i, 1);
  });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.id ? "#/tur/" + r.id : "#/"); });

  MK.kabuk({ modul: 5, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  $("a-tur-bilgi").innerHTML = "";
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t");
  MK.seciciCiz("t"); goster(false);
})();
