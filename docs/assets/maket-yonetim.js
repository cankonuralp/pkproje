/* ══ probata MAKET · Yönetim — firma açma (2026-10-03) — ÖRNEK, ONAY BEKLİYOR ══════════════════════════════════════════════════════
   Reisim 2026-10-03: "yeni firmaya hizmet için site açma işini nasıl yapabileceğimizi nasıl bi arapanel işimizi görür anlayamadım örnek göster".
   Firmaların göremediği, YALNIZ bizim (probata ekibi) kullandığımız küçük sayfa. Tek kod, tek sunucu: firma açmak = bir kayıt
   (ünvan, kısa kod, alt alan adı) + ilk firma yöneticisinin hesabı. Alt alan adı joker SSL ile hemen çalışır; ayrı kurulum yok.
   · #/ firmalar (adres, kısa kod, durum, açılış, kullanıcı) · #/yeni firma aç · #/f/<id> firma: bilgiler, ilk giriş bilgileri (geçici
     parola YALNIZ bir kez gösterilir), yöneticiye yeni geçici parola, dondur / etkinleştir (veri silinmez).
   Firmalar uydurma; yayında bu sayfa ayrı adreste (ör. yonetim.probata.com.tr), yalnız bizim hesaplarımızla ve iki adımlı girişle açılır.
   2026-10-03 (reisim: "yedekleme deposu olmadan şirket açılmasına izin verilmesin probata gün saklar gibi bir alternatif olamaz, müşteriler hukuken
   raporları 5 yıl arşivlemek durumunda"): firmanın KENDİ deposu (MK.depoAlanlar) bağlanıp denenmeden firma AÇILMAZ (engel); listede depo durumu. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem;
  var ALAN = "probata.com.tr";
  var AYRILMIS = ["www", "yonetim", "api", "mail", "destek", "probata", "test", "demo"];
  var DURUM = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, dondu: { ad: "Dondurulmuş", rozet: "a-rozet-red" } };
  var FIRMALAR = [
    { id: "f1", unvan: "Örnek Muayene ve Kontrol Ltd. Şti.", kod: "KM", alt: "ornek", durum: "etkin", acilis: "2026-09-01", kullanici: 16, yon: "Ayşe Demir", eposta: "ayse.demir@ornek-muayene.example", depo: { kova: "km-probata", uc: "https://depo.ornek.example", yer: "tr", durum: "bagli" } },
    { id: "f2", unvan: "Deneme Periyodik Kontrol A.Ş.", kod: "DP", alt: "deneme", durum: "etkin", acilis: "2026-09-15", kullanici: 7, yon: "Burak Tan", eposta: "burak.tan@deneme-kontrol.example", depo: { kova: "dp-arsiv", uc: "https://s3.deneme.example", yer: "ab", durum: "bagli" } },
    { id: "f3", unvan: "Örnek Test ve Muayene Ltd. Şti.", kod: "OT", alt: "ornektest", durum: "dondu", acilis: "2026-06-02", kullanici: 4, yon: "Selin Ak", eposta: "selin.ak@ornek-test.example", depo: { kova: "ot-yedek", uc: "https://depo.ornektest.example", yer: "tr", durum: "erisilemiyor" } }
  ];
  MK.kalici("yonetim", function () { return FIRMALAR; }, function (v) { if (Array.isArray(v)) FIRMALAR = v; });
  var DEPO_DURUM = { bagli: { ad: "Bağlı", rozet: "a-rozet-tamam" }, erisilemiyor: { ad: "Erişilemiyor", rozet: "a-rozet-red" } };
  var bosForm = function () { return { d: {}, hata: {}, elle: {}, depo: { yer: "tr" }, depoHata: {}, depoOk: false }; };
  var F = bosForm();   /* firma aç formu: değerler, hatalar, elle değiştirilen alanlar (öneri artık ezmez) */
  var PAROLA = {};                          /* firma no → bu oturumda bir kez gösterilecek geçici parola (kaydedilmez) */
  var firma = function (id) { return FIRMALAR.filter(function (f) { return f.id === id; })[0]; };
  var rozet = function (d) { return MK.rozet(DURUM[d]); };
  var depoRozet = function (f) { return MK.rozet(DEPO_DURUM[(f.depo || {}).durum || "erisilemiyor"]); };
  var adres = function (alt) { return alt + "." + ALAN; };

  /* ünvandan öneri: alt alan adı ilk kelime (Türkçe harf → a–z), kısa kod ilk iki kelimenin baş harfleri */
  var ascii = function (s) { return MK.tr(s).replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u"); };
  function oneri(unvan) {
    var k = ascii(unvan).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    var alt = (k[0] || "") + (k[0] && k[0].length < 4 && k[1] ? k[1] : "");
    return { alt: alt.slice(0, 30), kod: ((k[0] || "").charAt(0) + (k[1] || k[0] || "").charAt(k[1] ? 0 : 1)).toUpperCase() };
  }
  function parolaUret() {
    var h = "abcdefghjkmnpqrstuvwxyz", r = "23456789", s = "";
    for (var i = 0; i < 12; i++) s += (i % 4 === 3 ? r : h).charAt(Math.floor(Math.random() * (i % 4 === 3 ? r : h).length));
    return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
  }

  /* ── FİRMALAR ───────────────────────────────────────────────────────────────────────────────────── */
  var SUTUN = [
    { k: "firma", baslik: "Firma", kart: "ust", sira: 1, hucre: function (f) {
      return '<span class="a-hucre-satir">' + ikon("building-2", "a-ikon-kucuk") + '<span class="a-adres"><a class="a-ad-bag" href="#/f/' + f.id + '">' + kacis(f.unvan) + "</a>" +
        MK.kirp(adres(f.alt), "a-alt-satir") + "</span></span>";
    } },
    { k: "kod", baslik: "Kısa kod", kart: "govde", sira: 3, hucre: function (f) { return '<span class="a-kart-etiket">Kısa kod</span><span class="a-kod">' + kacis(f.kod) + "</span>"; } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 2, hucre: function (f) { return rozet(f.durum); } },
    { k: "depo", baslik: "Depo", kart: "govde", sira: 4, hucre: function (f) { return '<span class="a-kart-etiket">Depo</span>' + depoRozet(f); } },
    { k: "acilis", baslik: "Açılış", kart: "govde", sira: 5, hucre: function (f) { return '<span class="a-kart-etiket">Açılış</span>' + MK.tarihYaz(f.acilis); } },
    { k: "kullanici", baslik: "Kullanıcı", kart: "govde", sira: 6, hucre: function (f) { return '<span class="a-kart-etiket">Kullanıcı</span><span class="a-sayi">' + f.kullanici + "</span>"; } }
  ];
  function listeCiz() {
    var etkin = FIRMALAR.filter(function (f) { return f.durum === "etkin"; }).length;
    $("a-icerik").innerHTML =
      '<div class="a-sayfa-bas"><h1 tabindex="-1">Firmalar</h1><span class="a-sayac">' + FIRMALAR.length + " firma · " + etkin + " etkin</span>" +
        '<div class="a-eylem-cubugu a-bolum-tus"><a class="a-tus a-tus-birincil" href="#/yeni">' + ikon("plus", "a-ikon-kucuk") + "Firma aç</a></div></div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "shield-check", "Bu sayfa yalnız probata ekibine açık; firmalar ve müşteriler görmez.") + "</div>" +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Firmalar", sinif: "a-tablo-yfirma", sutunlar: SUTUN, kayitlar: FIRMALAR.slice().sort(function (a, b) { return a.acilis < b.acilis ? 1 : -1; }),
        href: function (f) { return "#/f/" + f.id; } }) + "</div>";
  }

  /* ── FİRMA AÇ ───────────────────────────────────────────────────────────────────────────────────── */
  function onizle() {
    var a = (F.d.alt || "").trim();
    return a ? "Adres: <strong>" + kacis(adres(a)) + "</strong>" : "Adres: …." + ALAN;
  }
  function formCiz(odak) {
    var d = F.d, h = F.hata, alan = function (id, k, etiket, ek, sonuc) {
      return MK.alan({ id: id, etiket: etiket, zorunlu: true, hata: h[k], sonuc: sonuc, girdi: MK.girdi({ id: id, alan: k, deger: d[k], hata: h[k], ek: ek || "" }) });
    };
    $("a-icerik").innerHTML = MK.kirinti([["Firmalar", "#/"], ["Firma aç"]]) +
      '<div class="a-sayfa-bas"><h1 tabindex="-1">Firma aç</h1></div>' +
      '<section class="a-bolum" aria-labelledby="y-b-firma"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-firma">Firma</h2></div><div class="a-form">' +
        MK.alan({ id: "y-unvan", etiket: "Ticari ünvan", zorunlu: true, genis: true, hata: h.unvan, girdi: MK.girdi({ id: "y-unvan", alan: "unvan", deger: d.unvan, hata: h.unvan, ek: ' maxlength="160"' }) }) +
        alan("y-alt", "alt", "Alt alan adı", ' maxlength="30" spellcheck="false" autocapitalize="off" inputmode="url"', h.alt ? "" : onizle()) +
        alan("y-kod", "kod", "Kısa kod (rapor no öneki)", ' maxlength="2" autocapitalize="characters"', h.kod ? "" : "Rapor no " + kacis((d.kod || "").toUpperCase() || "…") + "-… ile başlar") +
      "</div></section>" +
      '<section class="a-bolum" aria-labelledby="y-b-yon"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-yon">İlk firma yöneticisi</h2></div><div class="a-form">' +
        alan("y-yon", "yon", "Ad soyad", ' maxlength="80"') +
        alan("y-eposta", "eposta", "E-posta (giriş adı)", ' type="email" maxlength="120" spellcheck="false" autocapitalize="off"') +
      "</div></section>" +
      '<section class="a-bolum" aria-labelledby="y-b-depo"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-depo">Firmanın deposu (raporlar, fotoğraflar, yedekler)</h2>' +
        '<span class="a-sayac" id="y-depo-durum">' + (F.depoOk ? "bağlandı" : "bağlanmadı") + "</span></div>" +
        (h.depo ? MK.serit("hata", "circle-x", h.depo) : "") +
        MK.depoAlanlar("y-depo", F.depo, F.depoHata) +
        '<div class="a-eylem-cubugu a-eylem-sol">' + (F.depoOk ? '<span class="a-bulut-hesap">' + ikon("circle-check", "a-ikon-kucuk") + "Bağlandı: " + kacis(F.depo.kova) + "</span>" : MK.tus({ eylem: "y-depo-dene", ad: "Bağlan ve dene", ikon: "log-in", sinif: "a-tus-ikincil" })) + "</div></section>" +
      '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "firma-ac", ad: "Firmayı aç", ikon: "check" }) +
        '<a class="a-tus a-tus-ikincil" href="#/">Vazgeç</a></div>';
    if (odak) { var e = $(odak); if (e) e.focus(); }
  }
  MK.onGirdi = function (e) {
    var t = e.target, m = /^y-depo-(uc|kova|erisim|gizli)$/.exec(t.id || "");
    if (m) {   /* depo alanı değişti: bağlantı yeniden denenmeli */
      if (m[1] !== "gizli") F.depo[m[1]] = t.value;
      if (F.depoOk) { F.depoOk = false; formCiz(t.id); }
      return;
    }
    var k = t.dataset && t.dataset.alan; if (!k || !/^y-/.test(t.id)) return;
    F.d[k] = t.value; F.elle[k] = true;
    if (k === "unvan") {   /* elle değiştirilmemişse alt alan adı ve kısa kod ünvandan önerilir */
      var o = oneri(t.value);
      if (!F.elle.alt || !F.d.alt) { F.d.alt = o.alt; F.elle.alt = false; $("y-alt").value = o.alt; }
      if (!F.elle.kod || !F.d.kod) { F.d.kod = o.kod; F.elle.kod = false; $("y-kod").value = o.kod; }
    }
    if (k === "kod") { var b = t.value.toUpperCase(); if (b !== t.value) { t.value = b; F.d.kod = b; } }
    if (k === "alt") { var a = t.value.toLowerCase(); if (a !== t.value) { t.value = a; F.d.alt = a; } }
    var ia = $("y-alt-ipucu"); if (ia && !F.hata.alt) ia.innerHTML = onizle();
    var ik = $("y-kod-ipucu"); if (ik && !F.hata.kod) ik.innerHTML = "Rapor no " + kacis((F.d.kod || "").toUpperCase() || "…") + "-… ile başlar";
  };
  function denetle() {
    var d = F.d, h = {}, alt = (d.alt || "").trim(), kod = (d.kod || "").trim().toUpperCase();
    if (!(d.unvan || "").trim()) h.unvan = "Ticari ünvan yazılmalı.";
    if (!alt) h.alt = "Alt alan adı yazılmalı.";
    else if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(alt)) h.alt = "3–30 karakter; yalnız a–z, 0–9 ve tire (başta ve sonda tire olmaz).";
    else if (AYRILMIS.indexOf(alt) >= 0) h.alt = "“" + alt + "” bize ayrılmış; başka bir ad seçin.";
    else if (FIRMALAR.some(function (f) { return f.alt === alt; })) h.alt = adres(alt) + " kullanılıyor.";
    if (!kod) h.kod = "Kısa kod yazılmalı.";
    else if (!/^[A-Z]{2}$/.test(kod)) h.kod = "İki harf (A–Z).";
    else if (FIRMALAR.some(function (f) { return f.kod === kod; })) h.kod = kod + " başka bir firmada.";
    if (!(d.yon || "").trim()) h.yon = "Ad soyad yazılmalı.";
    if (!(d.eposta || "").trim()) h.eposta = "E-posta yazılmalı.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.eposta.trim())) h.eposta = "Geçerli bir e-posta değil.";
    if (!F.depoOk) h.depo = "Depo bağlanmadan firma açılamaz: deponun bilgilerini girip “Bağlan ve dene”ye basın. Raporlar 5 yıl, yedekler firmanın deposunda saklanır.";
    return h;
  }
  MK.onSecim = function (id, deger) {
    if (id !== "y-depo-yer") return;
    F.depo.yer = deger; F.depoOk = false; formCiz(id);
  };
  X["y-depo-dene"] = function () {
    var d = Object.assign({}, F.depo, { gizli: $("y-depo-gizli").value });
    F.depoHata = MK.depoDenetle(d); F.depoOk = !Object.keys(F.depoHata).length;
    if (F.depoOk) delete F.hata.depo;
    var ilk = ["uc", "kova", "erisim", "gizli"].filter(function (k) { return F.depoHata[k]; })[0];
    formCiz(ilk ? "y-depo-" + ilk : F.depoOk ? "firma-ac-tus" : "y-depo-uc");
    if (F.depoOk) { var b = document.querySelector('[data-eylem="firma-ac"]'); if (b) b.focus(); MK.bildir("Depo bağlandı: " + F.depo.kova.trim() + " (yazma ve okuma denendi)."); }
  };
  X["firma-ac"] = function () {
    F.hata = denetle();
    var ilk = ["unvan", "alt", "kod", "yon", "eposta", "depo"].filter(function (k) { return F.hata[k]; })[0];
    if (ilk) { formCiz(ilk === "depo" ? "y-depo-uc" : "y-" + ilk); return; }
    var d = F.d, alt = d.alt.trim();
    MK.onayla({ baslik: "Firma açılsın mı?", metin: adres(alt) + " hemen çalışır; " + d.yon.trim() + " ilk girişte geçici parolayla girip kendi parolasını belirler.", tus: "Firmayı aç",
      tamam: function () {
        var id = "f" + (FIRMALAR.reduce(function (m, f) { return Math.max(m, +f.id.slice(1)); }, 0) + 1);
        FIRMALAR.push({ id: id, unvan: d.unvan.trim(), kod: d.kod.trim().toUpperCase(), alt: alt, durum: "etkin", acilis: MK.raporBugun, kullanici: 1, yon: d.yon.trim(), eposta: d.eposta.trim(),
          depo: { kova: F.depo.kova.trim(), uc: F.depo.uc.trim(), yer: F.depo.yer || "tr", durum: "bagli" } });
        PAROLA[id] = parolaUret(); F = bosForm();
        location.hash = "#/f/" + id; MK.bildir("Firma açıldı: " + adres(alt));
      } });
  };

  /* ── FİRMA ──────────────────────────────────────────────────────────────────────────────────────── */
  function firmaCiz(f) {
    if (!f) {
      $("a-icerik").innerHTML = MK.kirinti([["Firmalar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Firma bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Firma bulunamadı", metin: "Bu adreste kayıtlı firma yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Firmalara dön</a>" });
      return;
    }
    var p = PAROLA[f.id], dondu = f.durum === "dondu";
    $("a-icerik").innerHTML = MK.kirinti([["Firmalar", "#/"], [f.unvan]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(f.unvan) + "</h1>" + rozet(f.durum) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(adres(f.alt)) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "yeni-parola", ad: "Yöneticiye yeni geçici parola", ikon: "key-round", sinif: "a-tus-ikincil", veri: { id: f.id }, kapali: dondu }) +
          MK.tus(dondu ? { eylem: "etkinlestir", ad: "Etkinleştir", ikon: "circle-check", veri: { id: f.id } } : { eylem: "dondur", ad: "Dondur", ikon: "ban", sinif: "a-tus-ikincil", veri: { id: f.id } }) + "</div></div>" +
      (dondu ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Dondurulmuş: firmanın kullanıcıları ve müşterileri giriş yapamaz; veriler silinmedi.") + "</div>" : "") +
      (p ? '<section class="a-bolum" aria-labelledby="y-b-giris"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-giris">İlk giriş bilgileri</h2></div>' +
          '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Geçici parola yalnız şimdi görünür; sayfadan çıkınca bir daha gösterilmez. Firma yöneticisine iletin; ilk girişte kendi parolasını belirler.") + "</div>" +
          '<dl class="a-bilgi">' + MK.bilgi("Adres", '<span class="a-kod">https://' + kacis(adres(f.alt)) + "</span>", "cift") + MK.bilgi("Giriş adı", kacis(f.eposta), "cift") + "</dl>" +
          '<p class="a-etiket">Geçici parola</p><p class="a-gecici-parola" id="y-parola"><span class="a-kod">' + kacis(p) + "</span></p>" +
          '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "y-parola-kopyala", ad: "Kopyala", ikon: "copy", sinif: "a-tus-ikincil", veri: { id: f.id } }) + "</div></section>" : "") +
      '<section class="a-bolum" aria-labelledby="y-b-bilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-bilgi">Firma bilgileri</h2></div><dl class="a-bilgi">' +
        MK.bilgi("Ticari ünvan", kacis(f.unvan), "cift") + MK.bilgi("Adres", '<span class="a-kod">' + kacis(adres(f.alt)) + "</span>", "cift") +
        MK.bilgi("Kısa kod", '<span class="a-kod">' + kacis(f.kod) + "</span>") + MK.bilgi("Açılış", MK.tarihYaz(f.acilis)) +
        MK.bilgi("İlk firma yöneticisi", kacis(f.yon) + '<span class="a-alt-satir">' + kacis(f.eposta) + "</span>") + MK.bilgi("Kullanıcı", String(f.kullanici)) +
        MK.bilgi("Depo", f.depo ? kacis(f.depo.kova) + " " + depoRozet(f) + '<span class="a-alt-satir">' + kacis(f.depo.uc) + " · " + MK.DEPO_YER.filter(function (x) { return x[0] === f.depo.yer; })[0][1] + "</span>" : depoRozet(f), "cift") +
      "</dl></section>" +
      (f.depo && f.depo.durum === "erisilemiyor" ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", "Depoya erişilemiyor: yeni fotoğraf ve raporlar cihazlarda bekliyor, yedek alınamıyor. Firma yöneticisi Firma ayarları › Depolama ve yedek'te uyarıyı görüyor.") + "</div>" : "") +
      '<section class="a-bolum" aria-labelledby="y-b-sonra"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="y-b-sonra">Sonrası firmanın kendi sitesinde</h2></div>' +
        '<ol class="a-yonetim-adim"><li>Firma yöneticisi adrese girer, geçici parolayla kendi parolasını belirler.</li>' +
        "<li>Firma ayarları: logo, künye, imza yöntemi, rapor formatları.</li>" +
        "<li>Firma ayarları › Toplu içe aktarma: müşteriler ve tesisler, ekipmanlar, ölçüm cihazları, personel, araçlar (Excel).</li>" +
        "<li>Personel'den öteki kullanıcıların hesapları açılır.</li></ol></section>";
  }
  X["y-parola-kopyala"] = function (el) {
    try { navigator.clipboard.writeText(PAROLA[el.dataset.id]); } catch (x) { /* pano kapalı */ }
    MK.bildir("Geçici parola panoya kopyalandı.");
  };
  X["yeni-parola"] = function (el) {
    var f = firma(el.dataset.id);
    MK.onayla({ baslik: "Yeni geçici parola oluşturulsun mu?", metin: f.yon + " şu anki parolasıyla giremez; yeni geçici parolayla girip kendi parolasını belirler.", tus: "Oluştur",
      tamam: function () { PAROLA[f.id] = parolaUret(); goster(false); var k = $("y-parola"); if (k) k.scrollIntoView({ block: "center" }); MK.bildir("Yeni geçici parola oluşturuldu."); } });
  };
  X["dondur"] = function (el) {
    var f = firma(el.dataset.id);
    MK.onayla({ baslik: "Firma dondurulsun mu?", metin: adres(f.alt) + " kapanır: firmanın kullanıcıları ve müşterileri giriş yapamaz. Veriler silinmez; istediğiniz an etkinleştirilir.", tus: "Dondur",
      tamam: function () { f.durum = "dondu"; delete PAROLA[f.id]; goster(false); MK.bildir("Firma donduruldu: " + adres(f.alt)); } });
  };
  X["etkinlestir"] = function (el) {
    var f = firma(el.dataset.id);
    f.durum = "etkin"; goster(false); MK.bildir("Firma etkinleştirildi: " + adres(f.alt));
  };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────── */
  function goster(odakla) {
    var h = location.hash, m, ad;
    if (h === "#/yeni") { formCiz(); ad = "Firma aç"; }
    else if ((m = /^#\/f\/([a-z0-9]+)$/.exec(h))) { var f = firma(m[1]); firmaCiz(f); ad = f ? f.unvan : "Firma bulunamadı"; }
    else { listeCiz(); ad = "Firmalar"; }
    Object.keys(PAROLA).forEach(function (id) { if (h !== "#/f/" + id) delete PAROLA[id]; });   /* sayfadan çıkınca parola bir daha gösterilmez */
    document.title = ad + " · probata yönetim (maket)";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.kabuk({ yonetim: "Yönetim", kullanici: { bas: "PB", ad: "probata ekibi", rol: "Yönetim" } });
  goster(false);
})();
