/* ══ probata MAKET M4 — Ölçüm Cihazı (modül 8) + kalibrasyon uyarısı (modül 20, kısım) · ONAY BEKLİYOR (2026-09-24) ══════
   Kaynak: pkproje.md §3 (cihazlar personele zimmetlenir; raporda cihaz SEÇİLMEZ, zimmetten gelir; kalibrasyonu geçmiş cihaz varsa
   rapor açılır ama yönetici onayına gönderilemez — sunucuda da; bitişe 30 gün kala uyarı), §3.1 modül 8 (ad, seri no, envanter no,
   kalibrasyon tarihi, sertifika, ara kontrol), §4.2 1.7.4 (raporda ölçüm aletleri: ad, seri no, kalibrasyon bilgileri), §4.9 (17020:
   kalibrasyon + ara kontrol kayıtları; kalibrasyon ≠ doğrulama). Uyarı YALNIZ ekranda (şerit, çip); e-posta / anlık bildirim YOK
   (anayasa 1.3). Ekranlar: liste (#/) · cihaz (#/c/<id>) · pencereler: cihaz ekle · kalibrasyon kaydı · ara kontrol. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var BUGUN = MK.BUGUN;
  var KAL = { gecerli: { ad: "Geçerli", rozet: "a-rozet-tamam" }, yakin: { ad: "30 gün içinde bitiyor", rozet: "a-rozet-bekliyor" },
    gecti: { ad: "Kalibrasyonu geçti", rozet: "a-rozet-red" }, lab: { ad: "Kalibrasyonda", rozet: "a-rozet-kabul" } };
  var cihazlar = function () { return MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz"; }); };
  var kalan = function (t) { return MK.gunFarki(BUGUN, t); };
  var araSonraki = function (v) { var d = new Date(v.araSon + "T12:00:00"); d.setMonth(d.getMonth() + v.araPeriyot); return d.toISOString().slice(0, 10); };
  var araGecti = function (v) { return kalan(araSonraki(v)) < 0; };
  var kimdeHtml = function (k) {
    return k === "depo" ? '<span class="a-hucre-satir">' + ikon("warehouse", "a-ikon-kucuk") + "Depo</span>" : k === "lab" ? '<span class="a-hucre-satir">' + ikon("flask-conical", "a-ikon-kucuk") + "Kalibrasyonda</span>"
      : '<a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + k) + '">' + kirp(MV.kisi(k).ad) + "</a>";
  };
  function kalanHtml(t, esik) {
    var k = kalan(t), not = k < 0 ? -k + " gün geçti" : k === 0 ? "Bugün bitiyor" : k + " gün";
    return '<span class="a-tarih-gun">' + MK.tarihYaz(t) + '</span><span class="' + (k < 0 ? "a-uyari-metin a-hata-metin" : k <= esik ? "a-uyari-metin" : "a-tarih-saat") + '">' + not + "</span>";
  }

  /* ── LİSTE + UYARI ŞERİDİ ─────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("c", { ad: "Cihazlarda ara", ipucu: "Envanter no, cihaz, kişi", birim: "cihaz",
    cipler: [
      { k: "gecti", ad: "Kalibrasyonu geçmiş", grup: "kal", test: function (v) { return MV.kalDurum(v) === "gecti"; } },
      { k: "yakin", ad: "30 gün içinde bitiyor", grup: "kal", test: function (v) { return MV.kalDurum(v) === "yakin"; } },
      { k: "lab", ad: "Kalibrasyonda", grup: "kal", test: function (v) { return MV.kalDurum(v) === "lab"; } },
      { k: "ara", ad: "Ara kontrol gecikti", test: araGecti },
      { k: "depo", ad: "Depoda", test: function (v) { return MV.kimde(v.id) === "depo"; } }
    ],
    seciciler: [
      { k: "tur", ad: "Cihaz türü", secenek: function () { return [["tumu", "Tümü"]].concat(MV.CIHAZ_TURLERI.map(function (t) { return [t.k, t.ad]; })); }, gecer: function (v, d) { return d === "tumu" || v.cihazTur === d; } },
      { k: "kimde", ad: "Kimde", secenek: function () {
        var l = cihazlar().map(function (v) { return MV.kimde(v.id); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (x) { return [x, MV.yerAdi(x)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (v, d) { return d === "tumu" || MV.kimde(v.id) === d; } }
    ],
    metin: function (v) { return [v.env, v.ad, v.marka, v.seri, MV.yerAdi(MV.kimde(v.id))].join(" "); },
    imkansiz: "Bir cihazın kalibrasyonu aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "env", baslik: "Envanter no", kart: "ust", sira: 1, hucre: function (v) { return '<a class="a-no" href="#/c/' + v.id + '">' + v.env + "</a>"; } },
    { k: "ad", baslik: "Cihaz", kart: "govde", sira: 2, hucre: function (v) { return kirp(v.ad, "a-ekipman-ad") + kirp(v.marka + " " + v.model + " · seri " + v.seri, "a-alt-satir"); } },
    { k: "kimde", baslik: "Kimde", kart: "govde", sira: 3, hucre: function (v) { return '<span class="a-kart-etiket">Kimde</span>' + kimdeHtml(MV.kimde(v.id)); } },
    { k: "bitis", baslik: "Kalibrasyon bitişi", kart: "govde", sira: 4, hucre: function (v) { return '<span class="a-kart-etiket">Kalibrasyon bitişi</span>' + kalanHtml(v.bitis, 30); } },
    { k: "ara", baslik: "Ara kontrol", kart: "govde", sira: 5, hucre: function (v) {
      var s = araSonraki(v), k = kalan(s);
      return '<span class="a-kart-etiket">Ara kontrol</span><span class="a-tarih-gun">' + MK.tarihYaz(v.araSon) + "</span>" +
        '<span class="' + (k < 0 ? "a-uyari-metin" : "a-tarih-saat") + '">' + (k < 0 ? "Sonraki " + -k + " gün gecikti" : "Sonraki " + MK.gunKisa(s)) + "</span>";
    } },
    { k: "durum", baslik: "Kalibrasyon", kart: "rozet", sira: 1, hucre: function (v) { return rozet(KAL[MV.kalDurum(v)]); } }
  ];
  function uyariCiz() {
    var l = cihazlar(), gecti = l.filter(function (v) { return MV.kalDurum(v) === "gecti"; }), yakin = l.filter(function (v) { return MV.kalDurum(v) === "yakin"; });
    var zimmette = gecti.filter(function (v) { return ["depo", "lab"].indexOf(MV.kimde(v.id)) < 0; });
    $("a-uyari").innerHTML = (gecti.length || yakin.length) ? '<div class="a-uyari-serit">' +
      (gecti.length ? '<div class="a-serit a-serit-hata">' + ikon("circle-x", "a-ikon-kucuk") + "<span><b>" + gecti.length + " cihazın kalibrasyonu geçti</b>" +
        (zimmette.length ? " · " + zimmette.map(function (v) { return v.env + " " + MV.kisi(MV.kimde(v.id)).ad; }).join(", ") + " zimmetinde: bu kişilerin raporları onaya gönderilemez." : "") +
        '</span><button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="cip-uygula" data-deger="gecti">Göster</button></div>' : "") +
      (yakin.length ? '<div class="a-serit a-serit-uyari">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span><b>" + yakin.length + " cihazın kalibrasyonu 30 gün içinde bitiyor</b> · " +
        yakin.map(function (v) { return v.env + " (" + MK.gunKisa(v.bitis) + ")"; }).join(", ") + '</span><button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="cip-uygula" data-deger="yakin">Göster</button></div>' : "") +
      "</div>" : "";
  }
  function listeCiz() {
    uyariCiz();
    MK.listeCiz({ on: "c", kayitlar: cihazlar(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.bitis < b.bitis ? -1 : a.bitis > b.bitis ? 1 : 0; }); },
      bosVeri: { ikon: "gauge", baslik: "Ölçüm cihazı yok", metin: "“Cihaz ekle” ile ilk cihaz ve kalibrasyon bilgisi kaydedilir." },
      tablo: { baslik: "Ölçüm cihazları", sinif: "a-tablo-cihaz", sutunlar: SUTUN, href: function (v) { return "#/c/" + v.id; } } });
  }

  /* ── CİHAZ SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  var KAL_SUTUN = [
    { k: "tarih", baslik: "Kalibrasyon", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-tarih-gun">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "bitis", baslik: "Geçerlilik bitişi", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Geçerlilik bitişi</span>' + MK.tarihYaz(x.bitis); } },
    { k: "lab", baslik: "Laboratuvar", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Laboratuvar</span>' + kirp(x.lab); } },
    { k: "sertifika", baslik: "Sertifika no", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Sertifika no</span><span class="a-kod">' + x.sertifika + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return rozet(x.sonuc === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Uygun değil", rozet: "a-rozet-red" }); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function () {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "kapsam-disi", ad: "Sertifikayı gör", ikon: "file-text", sinif: "a-tus-ikincil", veri: { ne: "Kalibrasyon sertifikası" } }) + "</div></div>";
    } }
  ];
  var ARA_SUTUN = [
    { k: "tarih", baslik: "Tarih", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-tarih-gun">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "kim", baslik: "Yapan", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Yapan</span>' + kacis(MV.kisi(x.kim).ad); } },
    { k: "yontem", baslik: "Yöntem", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Yöntem</span>' + kirp(x.yontem); } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return rozet(x.sonuc === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Uygun değil", rozet: "a-rozet-red" }); } }
  ];
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  function cihazCiz(v) {
    if (!v || v.tur !== "cihaz") {
      $("a-nesne").innerHTML = MK.kirinti([["Ölçüm cihazları", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Cihaz bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Cihaz bulunamadı", metin: "Bu adreste kayıtlı ölçüm cihazı yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Cihazlara dön</a>" });
      return;
    }
    var d = MV.kalDurum(v), kim = MV.kimde(v.id), k = kalan(v.bitis), as = araSonraki(v), t = MV.cihazTuru(v.cihazTur), h = MV.hareketler(v.id);
    var serit = d === "gecti" ? MK.serit("hata", "circle-x", "Kalibrasyonu " + MK.tarihYaz(v.bitis) + "'de bitti." + (kim !== "depo" && kim !== "lab" ? " " + kacis(MV.kisi(kim).ad) + " zimmetinde: bu cihazın geldiği raporlar yönetici onayına gönderilemez (sunucuda da denetlenir). Kalibrasyona gönderin ya da zimmetten alın." : ""))
      : d === "yakin" ? MK.serit("uyari", "triangle-alert", "Kalibrasyon " + MK.tarihYaz(v.bitis) + "'de bitiyor (" + k + " gün). Bitince bu cihazın geldiği raporlar onaya gönderilemez.")
      : d === "lab" ? MK.serit("bilgi", "flask-conical", "Kalibrasyonda (" + MK.tarihYaz(h[0].tarih) + "'den beri). Yeni sertifika gelince kalibrasyon kaydı eklenir, cihaz depoya döner.") : "";
    $("a-nesne").innerHTML = MK.kirinti([["Ölçüm cihazları", "#/"], [v.env]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + v.env + " · " + kacis(v.ad) + "</h1>" + rozet(KAL[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("gauge", "a-ikon-kucuk") + "<span>" + kacis(v.marka + " " + v.model) + " · seri " + v.seri + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.git({ hedef: 9, hash: "#/v/" + v.id, ad: "Zimmet geçmişi", ikon: "arrow-right-left", ne: "Zimmetler" }) +
        MK.tus({ eylem: "kal-ac", ad: "Kalibrasyon kaydı ekle", ikon: "plus" }) + "</div></div>" +
      (serit ? '<div class="a-serit-kap">' + serit + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "badge-check", ad: "Kalibrasyon bitişi", sayi: MK.gunKisa(v.bitis), not: k < 0 ? -k + " gün geçti" : k + " gün kaldı", uyari: k <= 30 }) +
        yuz({ ikon: "list-checks", ad: "Sonraki ara kontrol", sayi: MK.gunKisa(as), not: kalan(as) < 0 ? -kalan(as) + " gün gecikti" : "her " + v.araPeriyot + " ayda", uyari: kalan(as) < 0 }) +
        yuz({ ikon: kim === "depo" ? "warehouse" : kim === "lab" ? "flask-conical" : "user", ad: "Kimde", sayi: MV.yerAdi(kim), href: kim !== "depo" && kim !== "lab" ? MK.adres(2, "#/p/" + kim) : null, not: h[0] ? "teslim " + MK.gunKisa(h[0].tarih) : "" }) +
        yuz({ ikon: "file-text", ad: "Raporlarda", sayi: v.rapor, not: "son 12 ayda imzalı rapor" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-cihaz"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-cihaz">Cihaz bilgileri</h2><span class="a-sayac">rapora buradan dolar (Ek-III 1.7.4)</span></div><dl class="a-bilgi">' +
        bilgi("Cihaz", kacis(v.ad)) + bilgi("Marka / model", kacis(v.marka + " " + v.model)) + bilgi("Seri no", '<span class="a-kod">' + v.seri + "</span>") +
        bilgi("Envanter no", '<span class="a-kod">' + v.env + "</span>") + bilgi("Ölçüm aralığı", kacis(v.aralik)) +
        bilgi("Kullanıldığı ekipman grupları", t.g.map(function (g) { return MV.grup(g).ad; }).join(" · ") + ' <span class="a-alt-inline">· rapora yalnız bu gruplarda gelir (öneri)</span>', true) +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kal"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kal">Kalibrasyon kayıtları</h2><span class="a-sayac"><b>' + v.kal.length + "</b> kayıt</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Kalibrasyon kayıtları", sinif: "a-tablo-kal", sutunlar: KAL_SUTUN, kayitlar: v.kal }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-ara"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ara">Ara kontroller</h2><span class="a-sayac">kalibrasyonlar arasında cihazın doğruluğu</span>' +
        MK.tus({ eylem: "ara-ac", ad: "Ara kontrol ekle", ikon: "plus", sinif: "a-tus-ikincil a-bolum-tus" }) + "</div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Ara kontroller", sinif: "a-tablo-ara", sutunlar: ARA_SUTUN, kayitlar: v.ara }) + "</div></section>";
  }

  /* ── PENCERELER: cihaz ekle · kalibrasyon kaydı · ara kontrol ─────────────────────────────────────── */
  var W = null;
  var tarihGecerli = function (s) { return /^\d{2}\.\d{2}\.\d{4}$/.test(s); };
  var iso = function (s) { return s.split(".").reverse().join("-"); };
  function denetle() {
    var h = {}, d = W.d;
    if (W.tur === "cihaz") {
      if (!/^[A-Z0-9-]{3,12}$/.test(d.env)) h.env = "Envanter no 3–12 hane (A–Z, 0–9, tire).";
      else if (MV.VARLIKLAR.some(function (v) { return v.env === d.env; })) h.env = d.env + " başka bir cihazda kayıtlı.";
      if (!d.cihazTur) h.cihazTur = "Cihaz türü seçilmeli.";
      if (!d.seri.trim()) h.seri = "Seri no yazılmalı (raporda zorunlu).";
      if (!tarihGecerli(d.bitis)) h.bitis = "Tarih GG.AA.YYYY.";
    } else if (W.tur === "kal") {
      if (!tarihGecerli(d.tarih)) h.tarih = "Tarih GG.AA.YYYY.";
      if (!tarihGecerli(d.bitis)) h.bitis = "Tarih GG.AA.YYYY.";
      else if (tarihGecerli(d.tarih) && iso(d.bitis) <= iso(d.tarih)) h.bitis = "Geçerlilik bitişi kalibrasyon tarihinden sonra olmalı.";
      if (d.lab.trim().length < 3) h.lab = "Laboratuvar yazılmalı.";
      if (!d.sertifika.trim()) h.sertifika = "Sertifika no yazılmalı (raporda yazar).";
      if (!d.dosya) h.dosya = "Sertifika dosyası eklenmeli.";
    } else {
      if (!tarihGecerli(d.tarih)) h.tarih = "Tarih GG.AA.YYYY.";
      if (d.yontem.trim().length < 3) h.yontem = "Yöntem yazılmalı.";
    }
    return h;
  }
  function radyo(ad, deger, secenekler) {
    return secenekler.map(function (x) { return '<label class="a-onay-kutusu"><input type="radio" name="w-' + ad + '" data-radyo="' + ad + '" value="' + x[0] + '"' + (deger === x[0] ? " checked" : "") + "><span>" + x[1] + "</span></label>"; }).join("");
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: o.girdi || MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var tarih = ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"', govde;
    if (W.tur === "cihaz") {
      $("a-pencere-baslik").textContent = "Cihaz ekle";
      govde = '<div class="a-form">' + A("env", "Envanter no", d.env, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' maxlength="12"', ipucu: "Firmanın cihaz etiketi; eşsiz." }) +
        A("cihazTur", "Cihaz türü", "", { zorunlu: true, girdi: MK.secim({ id: "w-cihazTur", ad: "Cihaz türü", deger: d.cihazTur, secenekler: MV.CIHAZ_TURLERI.map(function (t) { return [t.k, t.ad]; }), ipucu: "Tür seçin", gecersiz: !!h.cihazTur, tanim: "w-cihazTur-ipucu" }),
          ipucu: d.cihazTur ? "Rapora gelir: " + MV.cihazTuru(d.cihazTur).g.map(function (g) { return MV.grup(g).ad; }).join(", ") : "Hangi ekipman gruplarında kullanıldığı türden gelir." }) +
        A("marka", "Marka / model", d.marka, { ek: ' maxlength="60"' }) + A("seri", "Seri no", d.seri, { zorunlu: true, sinif: "a-girdi-seri", ek: ' maxlength="30"' }) +
        A("aralik", "Ölçüm aralığı", d.aralik, { ek: ' maxlength="60"' }) + A("bitis", "Kalibrasyon geçerlilik bitişi", d.bitis, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih, ipucu: "Sertifikadaki tarih; ilk sertifika kaydı ayrıca eklenir." }) + "</div>" +
        '<div class="a-serit-kap">' + MK.serit("bilgi", "warehouse", "Yeni cihaz depoya girer; Zimmetler'den inspector'a teslim edilince raporlarına kendiliğinden gelir.") + "</div>";
    } else if (W.tur === "kal") {
      $("a-pencere-baslik").textContent = W.v.env + " · kalibrasyon kaydı";
      govde = '<p class="a-pencere-ozet"><b>' + W.v.env + " · " + kacis(W.v.ad) + "</b><br>Mevcut bitiş " + MK.tarihYaz(W.v.bitis) + ". Yeni kayıt en son geçerlilik tarihini günceller; eski sertifikalar kalır.</p>" +
        '<div class="a-form">' + A("tarih", "Kalibrasyon tarihi", d.tarih, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        A("bitis", "Geçerlilik bitişi", d.bitis, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih, ipucu: "Sertifikadaki tarih." }) +
        A("lab", "Laboratuvar", d.lab, { zorunlu: true, genis: true, ek: ' maxlength="80"' }) + A("sertifika", "Sertifika no", d.sertifika, { zorunlu: true, sinif: "a-girdi-seri", ek: ' maxlength="30"' }) +
        '<div class="a-alan-grup"><p class="a-etiket">Sertifika dosyası <span class="a-zorunlu">zorunlu</span></p>' +
          '<div class="a-dosya">' + MK.tus({ eylem: "dosya-sec", ad: d.dosya ? "Değiştir" : "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
          '<span class="a-dosya-ad' + (d.dosya ? "" : " a-deger-yok") + '">' + (d.dosya || "PDF, en çok 10 MB") + "</span></div>" +
          (h.dosya ? '<p class="a-ipucu a-ipucu-uyari">' + h.dosya + "</p>" : "") + "</div>" +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sonuç</p>' + radyo("sonuc", d.sonuc, [["Uygun", "Uygun — cihaz kullanılabilir"], ["Uygun değil", "Uygun değil — cihaz kullanımdan çekilir"]]) + "</div></div>";
    } else {
      $("a-pencere-baslik").textContent = W.v.env + " · ara kontrol";
      govde = '<div class="a-form">' + A("tarih", "Tarih", d.tarih, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        A("yontem", "Yöntem", d.yontem, { zorunlu: true, genis: true, ek: ' maxlength="100"', ipucu: "Ör. referans direnç / ağırlıkla karşılaştırma." }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sonuç</p>' + radyo("sonuc", d.sonuc, [["Uygun", "Uygun"], ["Uygun değil", "Uygun değil — kalibrasyona gönderilir"]]) + "</div></div>";
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Kaydet", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(tur, v) {
    W = { tur: tur, v: v || null, hata: {}, d: tur === "cihaz" ? { env: "", cihazTur: "", marka: "", seri: "", aralik: "", bitis: "" }
      : tur === "kal" ? { tarih: "23.09.2026", bitis: "", lab: v.kal[0].lab, sertifika: "", dosya: "", sonuc: "Uygun" } : { tarih: "23.09.2026", yontem: "Referans değerle karşılaştırma", sonuc: "Uygun" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input, button"); if (ilk) ilk.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "liste", pencere: "cihaz" };
    if ((m = /^#\/c\/([a-z0-9]+)(\/kalibrasyon)?$/.exec(h))) return { v: "cihaz", id: m[1], pencere: m[2] ? "kal" : null };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), v = r.id ? MV.varlik(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else cihazCiz(v);
    document.title = (r.v === "liste" ? "Ölçüm cihazları" : v ? v.env + " · " + v.ad : "Cihaz bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, v); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem, aktif = function () { return MV.varlik(rota().id); };
  X["cihaz-ac"] = function () { pencereAc("cihaz"); };
  X["kal-ac"] = function () { pencereAc("kal", aktif()); };
  X["ara-ac"] = function () { pencereAc("ara", aktif()); };
  X["cip-uygula"] = function (el) { var s = SZ.c; s.secili = [el.dataset.deger]; s.kip = "veya"; s.sayfa = 1; listeCiz(); var c = document.querySelector('[data-cip="' + el.dataset.deger + '"]'); if (c) c.focus(); };
  X["dosya-sec"] = function () { W.d.dosya = "sertifika-" + W.v.env.toLowerCase() + "-2026.pdf"; delete W.hata.dosya; pencereCiz(); };
  X["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz(hk[0] === "dosya" ? null : "w-" + hk[0]); return; }
    var d = W.d, v = W.v, hedef, ileti;
    if (W.tur === "cihaz") {
      v = { id: "v" + (MV.VARLIKLAR.length + 1), tur: "cihaz", ad: MV.cihazTuru(d.cihazTur).ad, cihazTur: d.cihazTur, env: d.env, marka: d.marka.trim() || "—", model: "", seri: d.seri.trim(), aralik: d.aralik.trim() || "—",
        bitis: iso(d.bitis), araSon: BUGUN, araPeriyot: 6, kal: [], ara: [], rapor: 0 };
      MV.VARLIKLAR.push(v); hedef = "#/c/" + v.id; ileti = v.env + " depoya kaydedildi; sertifikası kalibrasyon kaydıyla eklenir.";
    } else if (W.tur === "kal") {
      v.kal.unshift({ tarih: iso(d.tarih), bitis: iso(d.bitis), lab: d.lab.trim(), sertifika: d.sertifika.trim(), sonuc: d.sonuc }); v.bitis = iso(d.bitis);
      if (MV.kimde(v.id) === "lab") MV.ZIMMET.push({ id: "z" + (MV.ZIMMET.length + 1), v: v.id, tarih: MK.simdi(), eden: "lab", alan: "depo", foto: 1, not: "Kalibrasyondan döndü.", onay: null, yetkili: "za" });
      hedef = "#/c/" + v.id; ileti = "Kalibrasyon kaydedildi; geçerlilik " + MK.tarihYaz(v.bitis) + ".";
    } else {
      v.ara.unshift({ tarih: iso(d.tarih), kim: "co", yontem: d.yontem.trim(), sonuc: d.sonuc }); v.araSon = iso(d.tarih);
      hedef = "#/c/" + v.id; ileti = "Ara kontrol kaydedildi.";
    }
    $("a-pencere").close();
    if (location.hash === hedef) goster(false); else location.hash = hedef;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = k === "env" ? e.target.value.toUpperCase() : e.target.value; };
  MK.onSecim = function (id, deger) { if (W && id === "w-cihazTur") { W.d.cihazTur = deger; delete W.hata.cihazTur; pencereCiz(); } };
  document.addEventListener("change", function (e) { var r = e.target.dataset && e.target.dataset.radyo; if (r && W) W.d[r] = e.target.value; });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "liste" ? "#/" : "#/c/" + r.id); });

  MK.kabuk({ modul: 8, kullanici: { bas: "CÖ", ad: "Can Öztürk", rol: "Elektrik yönetici" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("c");
  MK.seciciCiz("c"); goster(false);
})();
