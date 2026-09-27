/* ══ probata MAKET M8 — Saha ve Rapor (modül 14) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "ekipmandan rapor oluştur deyip … checklistleri doldurup uygunluk belirleyip fotoğraf ekleyip raporu
   teknik yöneticisine onaya gönderecek"), §1.1 ("pano kontrollerinde her sigortanın tek tek elle yazılması … fotoğraftan sigorta bilgileri
   okuma"), §3 (kalibrasyonu geçmiş cihazla rapor açılır ama onaya gönderilemez; fotoğraf en az 1), §9 yirmi dördüncü tur (cihazlar
   türün listesinden, zimmetten eklenir; ekipman bilgileri elle; sonuç seçmeli, seçilmezse kriterlere göre; Kaydet + Onaya gönder hep
   görünür; bölümler her girişte kapalı; fotoğraf kameradan ya da galeriden; firma bilgileri salt okunur, Güncelle ile kayıttan),
   §4.2 (Ek-III 1.7), §4.5 (her kusur ayrı), §9 yirmi üçüncü tur (madde Uygun · Uygun değil · Uygulanamaz; sonuç Uygun · Uygun değil;
   başlangıç ve bitiş el ile; sonraki kontrol kendiliğinden, el ile değişir; bütün başlıklar açılır kapanır), §8.10 (sigorta okuma ÖNERİ; inspector onaylamadan kaydedilmez). Önce tablet ve telefon.
   Örnekler Planlar'daki plan 1'in (P-0926-031, Merkez Fabrika, denetimde) raporları: aynı numara, aynı durum. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var DURUM = { taslak: MV.RAPOR_DURUM.taslak, onayda: MV.RAPOR_DURUM.onayda, onaylandi: MV.RAPOR_DURUM.onaylandi };   /* reisim 2026-09-26: beş durum, tek kaynak MV */
  var YON = { m: "sy", e: "co" };   /* branş yöneticisi: onay türün branşına gider (§3.2 madde 3) */
  var sayi = function (v) { var x = parseFloat(String(v).replace(",", ".")); return /^\s*\d+([.,]\d+)?\s*$/.test(String(v)) ? x : NaN; };
  /* başlangıç, bitiş ve sonraki kontrol takvimden seçilir, elle yazılmaz (reisim 2026-09-27: "tıklayınca tarih seçtiren bi takvim açılsın
     ve saat dakika seçebileceğim bir kısım olsun otomatik dolu gelsin"); değerler ISO: "YYYY-MM-DDTHH:MM" · sonraki "YYYY-MM-DD" */
  /* sonraki kontrol = kontrol tarihi (başlangıç) + türün periyodu; elle seçilirse o kalır */
  var sonrakiHesap = function (r) {
    if (!r.bas) return "";
    var d = new Date(r.bas.slice(0, 10) + "T12:00:00"); d.setMonth(d.getMonth() + r.t.periyot); return d.toISOString().slice(0, 10);
  };

  /* ── RAPORLAR: plan 1'in ilk 10 ekipmanı (Planlar'la aynı sıra ve numara: 3 onayda, 7 taslak) ─────────────────────────── */
  var BASLADI = "2026-09-23T09:04";   /* plan 1 denetime başladı (Planlar) */
  var PLAN_EKP = MV.EKIPMAN.filter(function (e) { return e.tesis === "t1" && e.plan === 1; });
  var saatEkle = function (dk) { var d = 9 * 60 + 4 + dk; return MK.BUGUN + "T" + ("0" + Math.floor(d / 60)).slice(-2) + ":" + ("0" + d % 60).slice(-2); };
  var SIGORTA = [
    ["F1", "Aydınlatma — üretim holü", "B", 16, 1, ""], ["F2", "Priz — bakım atölyesi", "C", 16, 1, "30"], ["F3", "Kompresör", "C", 32, 3, ""],
    ["F4", "Havalandırma", "C", 25, 3, "", "dusuk"], ["F5", "Ofis prizleri", "B", 20, 1, "30"], ["F6", "Yedek", "B", 10, 1, ""],
    ["F7", "Kapı motoru", "C", 10, 1, ""], ["F8", "Aydınlatma — depo", "B", 10, 1, "", "dusuk"], ["F9", "Pano fanı", "B", 6, 1, ""], ["F10", "Ana şalter", "C", 63, 4, ""]
  ];
  var R = {};
  function raporKur(e, k, q) {
    var t = MV.tur(e.tur), kr = MV.kriterler(t), ts = MV.testler(t);
    var ts0 = MV.tesis(e.tesis);
    var r = { e: e, t: t, k: k, ts: ts0, basladi: e.tesis === "t1" ? BASLADI : ts0.ptarih ? ts0.ptarih + "T" + (ts0.psaat ? ts0.psaat[0] : "09:00") : null, no: k >= 0 ? MV.raporNo("0926", 786 + k) : q.no || "—", durum: k >= 0 ? (k < 3 ? "onayda" : "taslak") : (DURUM[q.durum] ? q.durum : "onaylandi"),
      olustu: k >= 0 ? saatEkle(10 + k * 6) : null, kisi: t.b === "e" ? "ea" : "mk", kriter: kr.map(function () { return { c: "", not: "" }; }), test: ts.map(function () { return ""; }),
      foto: 0, amac: "", sonuc: "", notlar: "", sigorta: null, bas: "", bit: "", sonraki: "", sonrakiEl: false, bitEl: false, takip: "", rtarih: "", rtarihEl: false, bolumAd: "", cihaz: [], kayit: null, degisti: false,
      marka: e.onceki ? e.marka : "", model: e.onceki ? e.model : "", seri: e.onceki ? e.seri : "", imal: e.onceki ? String(e.imal) : "", konum: e.konum, geri: null, geriler: [], pano: false, gonderildi: null };
    /* eklenen ölçüm cihazları: türün her cihaz türünden zimmetteki ilk geçerli cihaz (doldurulmuş ve gönderilmiş raporlarda) */
    var cihazDoldur = function () { r.cihaz = MV.turCihazlari(t).map(function (c) { return MV.eklenebilirCihazlar(r.kisi, [c])[0]; }).filter(Boolean).map(function (v) { return v.id; }); };
    var dolu = function () {
      cihazDoldur();
      r.kriter.forEach(function (x) { x.c = "uygun"; });
      r.test = ts.map(function (x) { return x.ornek; }); r.foto = 2; r.amac = "Üretim ve bakım"; r.sonuc = "kullanilir";
    };
    if (r.durum !== "taslak") { dolu(); r.gonderildi = r.olustu ? saatEkle(60 + k * 9) : null; }
    /* otomatik dolu: başlangıç rapor açıldığında, bitiş gönderildiğinde (taslakta şimdi), sonraki kontrol başlangıç + periyot */
    r.bas = r.olustu || r.basladi || MK.simdi(); r.bit = r.gonderildi || MK.simdi(); r.sonraki = sonrakiHesap(r); r.rtarih = r.bas.slice(0, 10);
    r.kayit = r.olustu ? saatEkle(30 + k * 6) : null;
    if (e.kod === "ET-1009") {   /* elektrik iç tesisatı: yarıda; pano sigortaları okunmadı; inspector'ın zimmetinde kalibrasyonu geçmiş cihaz */
      [0, 1, 2].forEach(function (i) { r.kriter[i].c = i === 2 ? "uygundegil" : "uygun"; });
      r.kriter[2].foto = 1; r.kriter[2].not = "Priz devresindeki kaçak akım rölesinin test düğmesi çalışmıyor; açma süresi ölçümle doğrulandı.";
      r.test[0] = "0,8"; r.foto = 1; r.amac = "Aydınlatma, priz ve makine besleme devreleri";
      r.cihaz = ["v1", "v2", "v3"];   /* v3 = tesisat test cihazı OC-003, kalibrasyonu 18.09.2026'da geçti; zimmette geçerli başkası yok */
    }
    if (e.kod === "KP-1004") dolu();   /* onaya hazır */
    if (e.kod === "ZV-1007") {   /* branş yöneticisi geri gönderdi: test değerleri eksik */
      dolu(); r.test = ts.map(function () { return ""; }); r.foto = 1;
      r.geri = { kim: "sy", zaman: "2026-09-23T15:10", gerekce: "Yük deneyi değerleri yazılmamış: dinamik ve statik deney yüklerini girin." };
    }
    return r;
  }
  function rapor(kod) {
    if (R[kod]) return R[kod];
    var e = MV.ekipman(kod), k = PLAN_EKP.indexOf(e), q = sorgu();
    if (!e) return null;
    if (k < 0 || k >= 10) { if (!q.no) return null; k = -1; }   /* Planlar'dan gelen öteki raporlar: numara ve durum adresten */
    return (R[kod] = raporKur(e, k, q));
  }

  /* ── HESAPLAR ───────────────────────────────────────────────────────────────────────────────────────── */
  /* ölçüm cihazları (reisim 2026-09-27): eklenen cihazlar · eksik tür = türün listesinde olup geçerli cihazı eklenmemiş · geçmiş = eklenmiş
     ama kalibrasyonu geçmiş. Eksik ya da geçmiş varsa rapor onaya gönderilemez (tek engel). */
  var cihazlar = function (r) { return r.cihaz.map(MV.varlik); };
  var gecmis = function (r) { return cihazlar(r).filter(function (v) { return MV.kalDurum(v) === "gecti"; }); };
  var eksikTur = function (r) { var gecerli = cihazlar(r).filter(function (v) { return MV.kalDurum(v) !== "gecti"; }).map(function (v) { return v.cihazTur; });
    return MV.turCihazlari(r.t).filter(function (c) { return gecerli.indexOf(c) < 0; }); };
  var testSonuc = function (x, v) { var n = sayi(v); return isNaN(n) ? null : x.op === "<=" ? n <= x.sinir : n >= x.sinir; };
  /* madde sonucu Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26); "sınır dışı" test değeri de uygun değil sayılır */
  var KRITER = [["uygun", "Uygun"], ["uygundegil", "Uygun değil"], ["uygulanamaz", "Uygulanamaz"]];
  var kusurlar = function (r) { return r.kriter.filter(function (x) { return x.c === "uygundegil"; }); };
  var sinirDisi = function (r) { return MV.testler(r.t).some(function (x, i) { return testSonuc(x, r.test[i]) === false; }); };
  var uygunDegil = function (r) { return kusurlar(r).length > 0 || sinirDisi(r); };
  var elektrik = function (t) { return t.g === "elektrik"; };   /* pano sigortaları bölümü yalnız elektrik grubunda */
  var engelli = function (r) { return eksikler(r).some(function (x) { return x.engel && !x.ok; }); };
  function cihazEngelMetin(r) {
    var g = gecmis(r), e = eksikTur(r);
    return (e.length ? "Eklenmemiş cihaz: " + e.map(function (c) { return MV.cihazTuru(c).ad; }).join(", ") + ". " : "") +
      (g.length ? "Kalibrasyonu geçmiş cihaz: " + g.map(function (v) { return v.ad + " " + v.seri; }).join(", ") + ". " : "") + "Rapor onaya gönderilemez.";
  }
  var otoSonuc = function (r) { return uygunDegil(r) ? "kullanilamaz" : "kullanilir"; };
  var SONUC = [["kullanilir", "Uygun"], ["kullanilamaz", "Uygun değil"]];
  function eksikler(r) {
    var ts = MV.testler(r.t), cev = r.kriter.filter(function (x) { return x.c; }).length, kusurNotsuz = kusurlar(r).filter(function (x) { return !x.not.trim(); }).length;
    var girilen = r.test.filter(function (v) { return !isNaN(sayi(v)); }).length, gecti = gecmis(r), eks = eksikTur(r);
    var oneri = r.sigorta ? r.sigorta.filter(function (x) { return x.durum !== "onayli"; }).length : 0;
    return [
      { ok: !!r.amac.trim(), metin: r.amac.trim() ? "Kullanım amacı yazıldı" : "Kullanım amacı yazılmadı", bolum: "r-b2" },
      { ok: !!(r.marka.trim() && r.seri.trim()), metin: "Ekipman bilgileri eksik (marka, seri no)", bolum: "r-b2" },
      { ok: r.bit >= r.bas, metin: "Bitiş başlangıçtan önce", bolum: "r-b1" },
      { ok: !gecti.length && !eks.length, metin: cihazEngelMetin(r), bolum: "r-b3", engel: true },
      { ok: cev === r.kriter.length, metin: cev + " / " + r.kriter.length + " kriter cevaplandı", bolum: "r-b4" },
      { ok: !kusurNotsuz, metin: kusurNotsuz ? kusurNotsuz + " kusurun açıklaması yazılmadı" : "Kusur açıklamaları tamam", bolum: "r-b4", gizle: !kusurlar(r).length },
      { ok: girilen === ts.length, metin: girilen + " / " + ts.length + " test değeri girildi", bolum: "r-b5" },
      { ok: !elektrik(r.t) || (!!r.sigorta && !oneri), metin: !r.sigorta ? "Pano sigortaları girilmedi" : oneri ? oneri + " sigorta önerisi onay bekliyor" : "Pano sigortaları onaylandı", bolum: "r-b6", gizle: !elektrik(r.t) },
      { ok: r.foto >= 1, metin: r.foto >= 1 ? r.foto + " fotoğraf" : "Fotoğraf yok (en az 1)", bolum: "r-b7" },
      /* sonuç seçilmezse gönderilince kriterlere göre konur (reisim 2026-09-27) — eksik sayılmaz */
      { ok: !(uygunDegil(r) && r.sonuc === "kullanilir"), metin: "Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”", bolum: "r-b8" }
    ].filter(function (x) { return !x.gizle; });
  }

  /* ── ÇİZİM ──────────────────────────────────────────────────────────────────────────────────────────── */
  /* her başlık açılır kapanır (reisim 2026-09-26); rapor her açılışta bütün bölümler KAPALI gelir (reisim 2026-09-27: "rapor açıldığında her
     giriş çıkışta tüm seçenekler kapalı gelsin"); açılan bölüm sayfada kaldıkça yeniden çizimde açık kalır */
  var ACIK = {};
  var bolum = function (no, id, baslik, ic, ek) {
    return '<details class="a-form-bolum a-bolum-rapor a-bolum-acilir" id="' + id + '"' + (ACIK[id] ? " open" : "") + '><summary class="a-alt-bas"><h2 class="a-alt-baslik" id="' + id + '-b" tabindex="-1">' +
      (no ? no + " · " : "") + baslik + "</h2>" + (ek || "") + ikon("chevron-down", "a-ikon-kucuk a-acilir-ok") + "</summary>" + ic + "</details>";
  };
  document.addEventListener("toggle", function (e) { var d = e.target; if (d.classList && d.classList.contains("a-bolum-acilir")) ACIK[d.id] = d.open; }, true);
  var okuGirdi = function (id, deger) { return '<input class="a-girdi a-girdi-oku" id="' + id + '" readonly value="' + kacis(deger || "—") + '">'; };
  /* tarih uyarıları seçince yerinde güncellenir (yeniden çizim yok, seçici açık kalır); uyarıdır, engel değil */
  function tarihUyari(r, k) {
    return k === "bit" && r.bit < r.bas ? "Bitiş başlangıçtan önce." : k === "sonraki" && r.sonraki <= r.bas.slice(0, 10) ? "Kontrol tarihinden sonra olmalı." : "";
  }
  function uyariYaz(id, metin) {
    var g = $(id); if (!g) return; var kap = g.closest(".a-alan-grup, .a-satir dd"), p = kap.querySelector(".a-ipucu");
    if (metin) { g.setAttribute("aria-invalid", "true"); if (!p) { p = document.createElement("p"); p.className = "a-ipucu a-ipucu-uyari"; p.id = id + "-ipucu"; kap.appendChild(p); } p.textContent = metin; }
    else { g.removeAttribute("aria-invalid"); if (p) p.remove(); }
  }
  /* firma bilgileri satırı: solda etiket, sağda değer ya da alan (reisim 2026-09-27, örnek ekran) */
  var satir = function (etiket, deger, id) { return '<div class="a-satir"><dt>' + (id ? '<label for="' + id + '">' + etiket + "</label>" : etiket) + "</dt><dd>" + deger + "</dd></div>"; };
  var tarihAlan = function (r, oku, k, etiket, saat) {
    var id = "r-" + k, h = oku ? "" : tarihUyari(r, k);
    if (oku) return satir(etiket, r[k] ? (saat ? MK.zamanYaz(r[k]) : MK.tarihNo(r[k])) : "-");
    return satir(etiket, MK.zaman({ id: id, ad: etiket, deger: r[k], saat: saat, tanim: id + "-ipucu" }) + (h ? '<p class="a-ipucu a-ipucu-uyari" id="' + id + '-ipucu">' + h + "</p>" : ""), id);
  };
  var metinAlan = function (r, oku, k, etiket, en, ek) {
    return satir(etiket, oku ? (kacis(r[k]) || "-") : MK.girdi({ id: "r-" + k, alan: k, deger: r[k], ek: ' maxlength="' + en + '"' + (ek || "") }), oku ? null : "r-" + k);
  };
  /* fotoğraf ekle: kameradan ya da galeriden (reisim 2026-09-27: "fotoğraf çek değil fotoğraf ekle yazsın galeriden de eklenebilsin");
     telefonda uygulama ikisini de sunar, makette küçük menü */
  var fotoMenu = function (eylem, veri) {
    return '<div class="a-secici a-foto-menu"><button class="a-tus a-tus-ikincil" type="button" data-secici-ac="foto" aria-haspopup="menu" aria-expanded="false">' + ikon("camera", "a-ikon-kucuk") + "Fotoğraf ekle</button>" +
      '<div class="a-secici-liste" role="menu" aria-label="Fotoğraf kaynağı" hidden>' +
      '<button class="a-secenek" type="button" role="menuitem" data-eylem="' + eylem + '" data-kaynak="kamera"' + (veri || "") + ">Kamera ile çek</button>" +
      '<button class="a-secenek" type="button" role="menuitem" data-eylem="' + eylem + '" data-kaynak="galeri"' + (veri || "") + ">Galeriden seç</button></div></div>";
  };
  function ciz(odak) {
    var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1], r = kod ? rapor(kod) : null;
    if (!r) {
      $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu ekipman için açılmış rapor yok. Rapor, plan içinde ekipmanın satırındaki “Rapor oluştur” ile açılır.",
          eylem: '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/plan/1") + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Plana dön</a>" });
      document.title = "Rapor bulunamadı · probata maket"; return;
    }
    var t = r.t, e = r.e, oku = r.durum !== "taslak";
    var PL = r.ts, p = MV.kisi(r.kisi), yon = MV.kisi(YON[t.b]), isg = MV.isgTesis(PL.id).filter(function (x) { return x.k === r.kisi; })[0], ci = cihazlar(r);
    var gecti = gecmis(r), eksik = eksikTur(r), mus = MV.musteri(PL.m);
    var cevaplanan = r.kriter.filter(function (x) { return x.c; }).length;
    var CIHAZ = [
      { k: "ad", baslik: "Cihaz", kart: "ust", sira: 1, hucre: function (v) { return kacis(v.ad); } },
      { k: "no", baslik: "Cihaz no", kart: "govde", sira: 2, hucre: function (v) { return '<span class="a-kart-etiket">Cihaz no</span><span class="a-kod">' + v.seri + "</span>"; } },
      { k: "kal", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 3, hucre: function (v) {
        return '<span class="a-kart-etiket">Kalibrasyon tarihi</span>' + (MV.kalDurum(v) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(v.kal[0].tarih) + "</span>" : MK.tarihYaz(v.kal[0].tarih)); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (v) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="cihaz-kaldir" data-id="' + v.id + '" aria-label="' + kacis(v.ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>"; } }]);
    $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], [PL.plan || PL.ad, PL.pid ? MK.adres(13, "#/plan/" + PL.pid) : MK.adres(13, "#/")], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + e.kod + " · " + kacis(t.ad) + "</h1>" + rozet(DURUM[r.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + kacis(PL.ad) + " · " + kacis(MV.musteri(PL.m).kisa) + " · " + kacis(p.ad) + "</span></p></div></div>" +
      '<div class="a-uyari-serit">' +
        (r.geri && !oku ? MK.serit("uyari", "undo-2", "<b>Geri gönderildi</b> · " + kacis(MV.kisi(r.geri.kim).ad) + " · " + MK.zamanYaz(r.geri.zaman) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (oku ? MK.serit("bilgi", "lock", r.durum === "onayda" ? "Teknik yönetici onayında · " + kacis(yon.ad) + (r.gonderildi ? " · " + MK.zamanYaz(r.gonderildi) : "") : "Muayene uzmanı onayı · imza bekleniyor") : "") +
      "</div>" +
      (r.geriler.length ? bolum("", "r-geri", "Geri gönderme geçmişi", '<ol class="a-gecmis">' + r.geriler.map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + MK.zamanYaz(g.zaman) + '</span><span class="a-gecmis-ne"><b>' + kacis(MV.kisi(g.kim).ad) + "</b> · " + kacis(g.gerekce) + "</span></li>"; }).join("") + "</ol>",
        '<span class="a-sayac"><b>' + r.geriler.length + "</b> kez</span>") : "") +
      '<div class="a-rapor-bolumler">' +
      /* 1 · FİRMA BİLGİLERİ: türün rapor formatından bağımsız, her raporda aynı (reisim 2026-09-26); 2026-09-27 örnek ekranla: etiket solda,
         değer ya da alan sağda, satır satır; kontrol tarihleri de burada (ayrı "Kontrol bilgileri" bölümü kalktı). Kayıttan gelen değerler
         (firma, e-posta, adres, SGK DETSİS no, İSG-KATİP ID, rapor no) raporda değişmez (160); telefon ve ekipman bölümü elle. */
      /* 2026-09-27 (reisim): firma adı, e-posta, telefon, adres, rapor no inspector'da DEĞİŞMEZ — plan açılırken planlamacı girer ya da
         kendiliğinden oluşur; yanlışsa planlamacı Müşteriler'den düzeltir, inspector "Güncelle" ile güncel bilgiyi çeker */
      bolum(1, "r-b1", "Firma bilgileri", '<dl class="a-satirlar a-satirlar-form">' +
          satir("Firma adı", kacis(mus.unvan)) +
          satir("E-posta", kacis(mus.eposta)) +
          satir("Telefon", mus.tel ? kacis(mus.tel) : "-") +
          tarihAlan(r, oku, "bas", "Periyodik kontrol başlangıç tarihi ve saati", true) +
          tarihAlan(r, oku, "bit", "Periyodik kontrol bitiş tarihi ve saati", true) +
          tarihAlan(r, oku, "sonraki", "Bir sonraki periyodik kontrol tarihi", false) +
          tarihAlan(r, oku, "takip", "Takip kontrol tarihi", false) +
          satir("Adres", kacis(PL.adres + ", " + PL.ilce + " / " + PL.il)) +
          satir("Rapor no", '<span class="a-kod">' + r.no + "</span>") +
          tarihAlan(r, oku, "rtarih", "Rapor tarihi", false) +
          satir("SGK DETSİS no", '<span class="a-kod a-kod-uzun">' + PL.sgk + "</span>") +
          satir("İSG-KATİP sözleşme ID", isg ? '<span class="a-kod">' + isg.no + "</span>" : '<span class="a-uyari-metin">Yok</span>') +
          metinAlan(r, oku, "bolumAd", "Ekipman bölümü", 60) + "</dl>",
        oku ? "" : MK.tus({ eylem: "firma-guncelle", ad: "Güncelle", ikon: "refresh-cw", sinif: "a-tus-ikincil a-bolum-tus" })) +
      /* 2 · EKİPMAN BİLGİLERİ elle girilir (reisim 2026-09-27: "otomatik girili gibi gözüküyor o kısım elle girilecek"); daha önce kontrol
         edilmiş ekipmanda son raporun değerleri başlangıç olarak gelir, değiştirilebilir; kod ve tür plandan */
      bolum(2, "r-b2", "Ekipman bilgileri", '<dl class="a-satirlar a-satirlar-form">' +
          satir("Kod", '<span class="a-kod">' + e.kod + "</span>") + satir("Ekipman türü", kacis(t.ad)) +
          /* 2026-09-27 (reisim: "metod kısmı olsun ama sadece ekipman türü eklerken belirlene"): raporda seçilmez, türden okunur */
          satir("Kontrol metodu", MV.turMetot(t).map(function (m) { return '<span class="a-metot">' + (m.no ? '<span class="a-kod">' + m.no + "</span> " : "") + kacis(m.konu) + "</span>"; }).join("")) +
          metinAlan(r, oku, "marka", "Marka", 40) + metinAlan(r, oku, "model", "Model", 40) + metinAlan(r, oku, "seri", "Seri no", 30) +
          metinAlan(r, oku, "imal", "İmal yılı", 4, ' inputmode="numeric"') + metinAlan(r, oku, "konum", "Kullanım yeri", 60) + metinAlan(r, oku, "amac", "Kullanım amacı", 120) +
          satir("Önceki kontrol", e.onceki ? MK.tarihYaz(e.onceki.tarih) + " · " + kacis(e.onceki.sonuc) + ' · <span class="a-rapor-no">' + e.onceki.rapor + "</span>" : "İlk kontrol") + "</dl>") +
      /* 3 · ÖLÇÜM CİHAZLARI (reisim 2026-09-27): hangi cihazların kullanılacağı ekipman türünden; eksik ya da kalibrasyonu geçmiş cihaz
         varsa rapor gönderilemez; "Cihaz ekle" yalnız eksik varken, pencerede inspector'ın zimmetindeki geçerli cihazlar. Zimmetlerim tuşu yok. */
      bolum(3, "r-b3", "Ölçüm cihazları", "" +
        (ci.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Ölçüm cihazları", sinif: "a-tablo-olcum", sutunlar: CIHAZ, kayitlar: ci }) + "</div>" : '<p class="a-bos-satir">Cihaz eklenmedi.</p>') +
        ((gecti.length || eksik.length) && !oku ? '<div class="a-bolum-serit">' + MK.serit("hata", "circle-x", kacis(cihazEngelMetin(r)), "r-cihaz-engel") + "</div>" +
          (eksik.length ? '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "cihaz-ekle-ac", ad: "Cihaz ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>" : "") : "")) +
      /* muayene kriterleri: solda kriter, sağda seçim — Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26) */
      bolum(4, "r-b4", "Muayene kriterleri", "" +
        r.kriter.map(function (x, i) {
          var ad = MV.kriterler(t)[i], kus = x.c === "uygundegil", secAd = (KRITER.filter(function (y) { return y[0] === x.c; })[0] || [])[1];
          return '<div class="a-kriter" id="r-k' + i + '"><p class="a-kriter-ad" id="r-ka' + i + '"><span class="a-kriter-no">' + (i + 1) + "</span><span>" + kacis(ad) + "</span></p>" +
            '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-kc" + i, secAd) : MK.secim({ id: "r-kc" + i, ad: "Madde " + (i + 1), deger: x.c, secenekler: KRITER, ipucu: "Seçin", tanim: "r-ka" + i })) + "</div>" +
            (kus ? '<div class="a-kriter-kusur">' + MK.alan({ id: "r-kn" + i, etiket: "Kusur açıklaması", zorunlu: !oku,
              girdi: '<textarea class="a-alan a-alan-ince" id="r-kn' + i + '" data-alan="kn' + i + '" maxlength="300" aria-describedby="r-kn' + i + '-ipucu"' + (oku ? " readonly" : "") + ">" + kacis(x.not) + "</textarea>" }) +
              '<div class="a-fotolar">' + fotolar(x.foto || 0) + (oku ? "" : fotoMenu("kusur-foto", ' data-i="' + i + '"')) + "</div></div>" : "") + "</div>";
        }).join(""), '<span class="a-sayac" id="r-kriter-say"><b>' + cevaplanan + "</b> / " + r.kriter.length + " madde</span>") +
      bolum(5, "r-b5", "Test değerleri", '<div class="a-form">' + MV.testler(t).map(function (x, i) {
          var s = testSonuc(x, r.test[i]);
          return MK.alan({ id: "r-t" + i, etiket: kacis(x.ad) + " (" + x.birim + ")", zorunlu: !oku, sonuc: '<span id="r-t' + i + '-sonuc">' + testIpucu(x, r.test[i]) + "</span>", hata: "",
            girdi: MK.girdi({ id: "r-t" + i, alan: "t" + i, deger: r.test[i], sinif: "a-girdi-sicil" + (oku ? " a-girdi-oku" : ""), ek: ' inputmode="decimal" maxlength="10"' + (oku ? " readonly" : "") + (s === false ? ' aria-invalid="true"' : "") }) });
        }).join("") + "</div>") +
      (elektrik(t) ? bolum(6, "r-b6", "Pano sigortaları", sigortaHtml(r, oku)) : "") +
      /* 7 · 8 · 9 her raporda sabit (reisim 2026-09-27); kriterler ve test değerleri firmanın türe verdiği rapor formatına göre */
      bolum(elektrik(t) ? 7 : 6, "r-b7", "Fotoğraflar", '<div class="a-fotolar">' + fotolar(r.foto) + (oku ? "" : fotoMenu("foto-ekle")) + "</div>") +
      /* sonuç ve kanaat muayene kriterleri gibi seçmeli: Uygun · Uygun değil; seçilmezse gönderilince kriterlere göre konur (reisim 2026-09-27);
         uygun değil madde varken "Uygun" uyarıdır, engel değil */
      bolum(elektrik(t) ? 8 : 7, "r-b8", "Sonuç ve kanaat", '<div class="a-kriter a-kriter-sonuc"><p class="a-kriter-ad" id="r-sonuc-ad"><span>Sonuç ve kanaat</span></p>' +
        '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-sonuc", (SONUC.filter(function (y) { return y[0] === r.sonuc; })[0] || [])[1]) : MK.secim({ id: "r-sonuc", ad: "Sonuç ve kanaat", deger: r.sonuc, secenekler: SONUC, ipucu: "Seçin", tanim: "r-sonuc-ad" })) + "</div>" +
        (!oku && uygunDegil(r) && r.sonuc === "kullanilir" ? '<p class="a-ipucu a-ipucu-uyari a-kriter-uyari">Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”.</p>' : "") + "</div>") +
      bolum(elektrik(t) ? 9 : 8, "r-b9", "Muayene uzmanı yorumu", '<textarea class="a-alan a-alan-ince" id="r-notlar" data-alan="notlar" maxlength="500" aria-label="Muayene uzmanı yorumu"' + (oku ? " readonly" : "") + ">" + kacis(r.notlar) + "</textarea>") +
      "</div>" +
      /* Kaydet + Onaya gönder: sayfa kaysa da görünür, altta yapışkan (reisim 2026-09-27: "ekranda sabit ekran kaysa da gözükecek şekilde,
         kaydet gönder diye iki tuş olsun") */
      (oku ? "" : '<div class="a-form-eylem a-rapor-eylem"><p class="a-adim-not" id="r-kayit">' + kayitMetin(r) + "</p>" +
        MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "onaya-gonder", ad: "Onaya gönder", ikon: "send", kapali: engelli(r), sebepId: "r-cihaz-engel" }) + "</div>");
    document.title = e.kod + " · " + r.no + " · probata maket";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function testIpucu(x, v) {
    var s = testSonuc(x, v);
    return s === null ? "Sınır " + MV.sinirYaz(x) : s ? "Uygun · sınır " + MV.sinirYaz(x) : "Sınır dışı · " + MV.sinirYaz(x);
  }
  var kayitMetin = function (r) { return r.degisti ? "Kaydedilmemiş değişiklik var" : r.kayit ? "Son kayıt " + MK.zamanYaz(r.kayit) : "Henüz kaydedilmedi"; };
  var fotolar = function (n) { var s = ""; for (var i = 1; i <= n; i++) s += '<span class="a-foto" role="img" aria-label="Fotoğraf ' + i + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>"; return s; };
  function sigortaHtml(r, oku) {
    var d = r.sigorta, bek = d ? d.filter(function (x) { return x.durum !== "onayli"; }) : [], dusuk = bek.filter(function (x) { return x.guven === "dusuk"; });
    var SUTUN = [
      { k: "no", baslik: "Sigorta", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-kod">' + x.no + "</span>" + kirp(x.devre, "a-alt-satir"); } },
      { k: "deger", baslik: "Tip / akım", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Tip / akım</span><span class="a-kod">' + x.tip + x.akim + "</span>"; } },
      { k: "kutup", baslik: "Kutup", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Kutup</span>' + x.kutup; } },
      { k: "rcd", baslik: "Kaçak akım", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Kaçak akım</span>' + (x.rcd ? x.rcd + " mA" : '<span class="a-deger-yok">—</span>'); } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) {
        return rozet(x.durum === "onayli" ? { ad: "Onaylı", rozet: "a-rozet-tamam" } : x.guven === "dusuk" ? { ad: "Emin değil", rozet: "a-rozet-bekliyor" } : { ad: "Öneri", rozet: "a-rozet-notr" });
      } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
        return oku ? "" : '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "sigorta-ac", ad: x.durum === "onayli" ? "Düzelt" : "Kontrol et", ikon: "pencil", sinif: "a-tus-ikincil", veri: { no: x.no } }) + "</div></div>";
      } }
    ];
    return "" +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sigorta-oku", ad: d ? "Yeniden oku" : "Fotoğraftan oku", ikon: "camera", sinif: d ? "a-tus-ikincil" : "a-tus-birincil" }) +
        MK.tus({ eylem: "sigorta-ekle", ad: "Elle ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + (bek.length > dusuk.length ? MK.tus({ eylem: "sigorta-onayla", ad: "Önerileri onayla (" + (bek.length - dusuk.length) + ")", ikon: "check", sinif: "a-tus-ikincil" }) : "") + "</div>") +
      (r.pano ? '<div class="a-fotolar a-bolum-serit"><span class="a-foto" role="img" aria-label="Pano fotoğrafı">' + ikon("camera") + '<span class="a-foto-no">Pano</span></span></div>' : "") +
      (d ? '<div class="a-bolum-serit">' + (bek.length ? MK.serit(dusuk.length ? "uyari" : "bilgi", dusuk.length ? "triangle-alert" : "eye", d.length + " sigorta · <b>" + bek.length + "</b> onay bekliyor" + (dusuk.length ? " · " + dusuk.length + " satırda okuma emin değil: tek tek kontrol edin (toplu onaya girmez)." : ".")) : MK.serit("onay", "circle-check", d.length + " sigorta onaylandı.")) + "</div>" +
        '<div class="a-liste-kap a-bolum-serit">' + MK.tablo({ baslik: "Pano sigortaları", sinif: "a-tablo-sigorta", sutunlar: SUTUN, kayitlar: d }) + "</div>"
        : '<p class="a-bos-satir a-bolum-serit">Henüz sigorta girilmedi.</p>');
  }

  /* ── PENCERE: sigorta satırı · gönderirken eksikler ────────────────────────────────────────────────────────── */
  var W = null;
  function pencereCiz(odak) {
    var d = W.d, h = W.hata;
    if (W.tur === "sigorta") {
      $("a-pencere-baslik").textContent = W.x ? "Sigorta " + W.x.no + (W.x.durum === "onayli" ? " · düzelt" : " · kontrol et") : "Sigorta ekle";
      $("a-pencere-govde").innerHTML = (W.x && W.x.guven === "dusuk" && W.x.durum !== "onayli" ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Okuma emin değil: etiketi panoda gözle kontrol edip değeri düzeltin.") + "</div>" : "") +
        '<div class="a-form">' +
        MK.alan({ id: "w-no", etiket: "Sigorta no", zorunlu: true, hata: h.no, girdi: MK.girdi({ id: "w-no", alan: "no", deger: d.no, sinif: "a-girdi-sicil", ek: ' maxlength="8"', hata: h.no }) }) +
        MK.alan({ id: "w-devre", etiket: "Devre", girdi: MK.girdi({ id: "w-devre", alan: "devre", deger: d.devre, ek: ' maxlength="60"' }) }) +
        MK.alan({ id: "w-tip", etiket: "Tip", zorunlu: true, hata: h.tip, girdi: MK.secim({ id: "w-tip", ad: "Tip", deger: d.tip, secenekler: [["B", "B"], ["C", "C"], ["D", "D"]], ipucu: "Tip seçin", gecersiz: !!h.tip, tanim: "w-tip-ipucu" }) }) +
        MK.alan({ id: "w-akim", etiket: "Anma akımı (A)", zorunlu: true, hata: h.akim, girdi: MK.girdi({ id: "w-akim", alan: "akim", deger: d.akim, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"', hata: h.akim }) }) +
        MK.alan({ id: "w-kutup", etiket: "Kutup", zorunlu: true, girdi: MK.secim({ id: "w-kutup", ad: "Kutup", deger: d.kutup, secenekler: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], tanim: "w-kutup-ipucu" }) }) +
        MK.alan({ id: "w-rcd", etiket: "Kaçak akım (mA)", ipucu: "Yoksa boş", girdi: MK.girdi({ id: "w-rcd", alan: "rcd", deger: d.rcd, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"' }) }) +
        "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Kaydet ve onayla", ikon: "check" });
    } else if (W.tur === "cihaz") {
      /* inspector'ın zimmetindeki, eksik türden, kalibrasyonu geçmemiş cihazlar (reisim 2026-09-27) */
      var tr = eksikTur(W.r);
      $("a-pencere-baslik").textContent = "Cihaz ekle";
      $("a-pencere-govde").innerHTML = (h.sec ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", h.sec) + "</div>" : "") + tr.map(function (c) {
        var l = MV.eklenebilirCihazlar(W.r.kisi, [c]);
        return '<fieldset class="a-cihaz-grup"><legend>' + kacis(MV.cihazTuru(c).ad) + "</legend>" + (l.length ? l.map(function (v) {
          return '<label class="a-onay-kutusu"><input type="checkbox" data-cihaz-sec="' + v.id + '"' + (d.sec.indexOf(v.id) >= 0 ? " checked" : "") + '><span><b>' + kacis(v.ad) + '</b> · <span class="a-kod">' + v.seri +
            "</span> · kalibrasyon " + MK.tarihYaz(v.kal[0].tarih) + "</span></label>"; }).join("") : '<p class="a-bos-satir">Zimmetinizde kalibrasyonu geçerli ' + kacis(MV.cihazTuru(c).ad.toLocaleLowerCase("tr")) + " yok.</p>") + "</fieldset>";
      }).join("");
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "cihaz-ekle", ad: "Ekle", ikon: "plus" });
    } else if (W.tur === "gonder") {
      $("a-pencere-baslik").textContent = W.eks.length + " eksik var";
      $("a-pencere-govde").innerHTML = '<ul class="a-kosullar">' + W.eks.map(function (x) {
        return '<li class="a-kosul-eksik">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x.metin) + "</span></li>"; }).join("") + "</ul>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Tamamla", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "yine-de-gonder", ad: "Yine de gönder", ikon: "send" });
    }
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(o) {
    W = o; W.hata = {}; pencereCiz(); $("a-pencere").showModal();
    if (o.tur === "gonder") document.querySelector('[data-eylem="yine-de-gonder"]').focus();
    else if (o.tur === "cihaz") (document.querySelector("#a-pencere [data-cihaz-sec]") || document.querySelector('#a-pencere [data-eylem="pencere-kapat"]')).focus();
    else $(o.x ? "w-tip" : "w-no").focus();
  }
  function pencereKaydet() {
    var d = W.d, h = {}, r = W.r;
    {
      if (!/^[A-Z]{1,2}\d{1,3}$/.test(d.no.trim())) h.no = "ör. F4";
      else if (r.sigorta && r.sigorta.some(function (x) { return x.no === d.no.trim() && x !== W.x; })) h.no = "Bu numara listede var.";
      if (!d.tip) h.tip = "Tip seçilmeli.";
      if (!/^\d{1,3}$/.test(d.akim.trim())) h.akim = "Amper, tam sayı.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      var x = W.x || { guven: "yuksek" }; Object.assign(x, { no: d.no.trim(), devre: d.devre.trim() || "—", tip: d.tip, akim: +d.akim, kutup: +d.kutup, rcd: d.rcd.trim(), durum: "onayli" });
      if (!W.x) { r.sigorta = r.sigorta || []; r.sigorta.push(x); }
      $("a-pencere").close(); ciz("r-b6-b"); MK.bildir("Sigorta " + x.no + " onaylandı: " + x.tip + x.akim + ".");
    }
  }

  /* ── OLAYLAR ───────────────────────────────────────────────────────────────────────────────────────── */
  var aktif = function () { var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1]; return kod ? rapor(kod) : null; };
  /* değişiklik olunca kayıt satırı "kaydedilmemiş" der (yeniden çizimsiz) */
  function degisti(r) { r.degisti = true; var k = $("r-kayit"); if (k) k.textContent = kayitMetin(r); }
  document.addEventListener("change", function (e) {
    var c = e.target.closest && e.target.closest("[data-cihaz-sec]"); if (!c || !W) return;
    var id = c.dataset.cihazSec, i = W.d.sec.indexOf(id); if (c.checked && i < 0) W.d.sec.push(id); if (!c.checked && i >= 0) W.d.sec.splice(i, 1);
  });
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k) return;
    if (W && $("a-pencere").open) { W.d[k] = e.target.value; return; }
    var r = aktif(); if (!r) return;
    if (["amac", "notlar", "bolumAd", "marka", "model", "seri", "imal", "konum"].indexOf(k) >= 0) r[k] = e.target.value;
    else if (k[0] === "t" && k[1] !== undefined && /^t\d+$/.test(k)) {   /* test değeri: ipucu ve sonuç önerisi canlı, odak yerinde */
      var i = +k.slice(1), x = MV.testler(r.t)[i]; r.test[i] = e.target.value;
      $("r-t" + i + "-sonuc").textContent = testIpucu(x, r.test[i]);
      if (testSonuc(x, r.test[i]) === false) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid");
    } else if (/^kn\d+$/.test(k)) r.kriter[+k.slice(2)].not = e.target.value;
    degisti(r); ozetYenile(r);
  };
  /* yazarken yalnız gönder tuşu güncellenir (odak kaçmaz); eksikler yalnız "Onaya gönder"de pencerede sayılır (reisim 2026-09-26:
     "onaya göndermeden önce 8 eksik vb eksik yazan kısım olmasın") */
  function ozetYenile(r) { var t = document.querySelector('[data-eylem="onaya-gonder"]'); if (t) t.disabled = engelli(r); }
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) { W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return; }
    var r = aktif(); if (/^r-kc\d+$/.test(id)) { r.kriter[+id.slice(4)].c = deger; degisti(r); ciz(id); }
    else if (id === "r-sonuc") { r.sonuc = deger; degisti(r); ciz(id); }
  };
  MK.onZaman = function (id, deger) {
    var r = aktif(), k = id.slice(2); if (!r || !(k in r)) return;
    r[k] = deger; degisti(r);
    if (k === "sonraki") r.sonrakiEl = true;
    if (k === "bit") r.bitEl = true;
    if (k === "bas" && !r.sonrakiEl) { r.sonraki = sonrakiHesap(r); MK.zamanAyarla("r-sonraki", r.sonraki); }   /* sonraki kontrol kendiliğinden */
    ["bit", "sonraki"].forEach(function (x) { uyariYaz("r-" + x, tarihUyari(r, x)); });
    if (k === "bas" && !r.rtarihEl) { r.rtarih = r.bas.slice(0, 10); MK.zamanAyarla("r-rtarih", r.rtarih); }   /* rapor tarihi başlangıç günü */
    if (k === "rtarih") r.rtarihEl = true;
  };
  var X = MK.eylem;
  X["foto-ekle"] = function (el) {
    var r = aktif(); r.foto++; degisti(r); ciz(); var t = document.querySelector('#r-b7 [data-secici-ac]'); if (t) t.focus();
    MK.bildir("Fotoğraf " + r.foto + " eklendi (" + (el.dataset.kaynak === "galeri" ? "galeriden" : "kameradan") + ").");
  };
  X["kaydet"] = function () {
    var r = aktif(); r.kayit = MK.simdi(); r.degisti = false; $("r-kayit").textContent = kayitMetin(r);
    MK.bildir("Rapor kaydedildi.");
  };
  X["firma-guncelle"] = function (el, e) {
    if (e) e.preventDefault();   /* başlık çubuğundaki tuş bölümü açıp kapatmasın */
    ciz(); var t = document.querySelector('[data-eylem="firma-guncelle"]'); if (t) t.focus();
    MK.bildir("Firma bilgileri müşteri kaydından güncellendi.");
  };
  X["cihaz-ekle-ac"] = function () { var r = aktif(); pencereAc({ tur: "cihaz", r: r, d: { sec: [] } }); };
  X["cihaz-ekle"] = function () {
    var r = W.r; if (!W.d.sec.length) { W.hata = { sec: "Eklenecek cihazı seçin." }; pencereCiz(); var f = document.querySelector("#a-pencere [data-cihaz-sec]") || document.querySelector('#a-pencere [data-eylem="pencere-kapat"]'); if (f) f.focus(); return; }
    W.d.sec.forEach(function (id) { if (r.cihaz.indexOf(id) < 0) r.cihaz.push(id); });
    var n = W.d.sec.length; $("a-pencere").close(); degisti(r); ciz("r-b3-b"); MK.bildir(n + " cihaz eklendi.");
  };
  X["cihaz-kaldir"] = function (el) {
    var r = aktif(), v = MV.varlik(el.dataset.id); r.cihaz = r.cihaz.filter(function (x) { return x !== el.dataset.id; }); degisti(r); ciz("r-b3-b");
    MK.bildir(v.ad + " rapordan kaldırıldı.");
  };
  X["sigorta-oku"] = function () {
    var r = aktif();
    r.pano = true;
    r.sigorta = SIGORTA.map(function (s) { return { no: s[0], devre: s[1], tip: s[2], akim: s[3], kutup: s[4], rcd: s[5], guven: s[6] || "yuksek", durum: "oneri" }; });
    ciz(); var t = document.querySelector('[data-eylem="sigorta-oku"]'); if (t) t.focus();
    MK.bildir("Pano fotoğrafından " + r.sigorta.length + " sigorta okundu; öneriler onayınızı bekliyor.");
  };
  X["sigorta-onayla"] = function () {
    var r = aktif(), n = 0; r.sigorta.forEach(function (x) { if (x.durum !== "onayli" && x.guven !== "dusuk") { x.durum = "onayli"; n++; } });
    ciz("r-b6-b"); MK.bildir(n + " öneri onaylandı; emin olunmayan satırlar tek tek kontrol edilir.");
  };
  X["sigorta-ac"] = function (el) {
    var r = aktif(), x = r.sigorta.filter(function (y) { return y.no === el.dataset.no; })[0];
    pencereAc({ tur: "sigorta", r: r, x: x, d: { no: x.no, devre: x.devre, tip: x.tip, akim: String(x.akim), kutup: String(x.kutup), rcd: x.rcd } });
  };
  X["sigorta-ekle"] = function () { var r = aktif(); pencereAc({ tur: "sigorta", r: r, x: null, d: { no: "F" + ((r.sigorta || []).length + 1), devre: "", tip: "", akim: "", kutup: "1", rcd: "" } }); };
  X["pencere-kaydet"] = pencereKaydet;
  /* 90 (reisim 2026-09-26): eksik varken de gönderilir — eksikler uyarı penceresinde, "Yine de gönder"; tek engel kalibrasyonu geçmiş cihaz */
  X["onaya-gonder"] = function () {
    var r = aktif(); if (engelli(r)) return;
    var eks = eksikler(r).filter(function (x) { return !x.ok; });
    if (eks.length) { pencereAc({ tur: "gonder", r: r, d: {}, eks: eks }); return; }
    gonder(r);
  };
  X["yine-de-gonder"] = function () { var r = W.r; $("a-pencere").close(); gonder(r); };
  X["kusur-foto"] = function (el) {
    var r = aktif(), i = +el.dataset.i; r.kriter[i].foto = (r.kriter[i].foto || 0) + 1; degisti(r); ciz();
    var t = document.querySelector("#r-k" + i + " [data-secici-ac]"); if (t) t.focus();
    MK.bildir("Madde " + (i + 1) + " için fotoğraf eklendi (" + (el.dataset.kaynak === "galeri" ? "galeriden" : "kameradan") + ").");
  };
  function gonder(r) {
    if (r.geri) r.geriler.unshift(r.geri);
    var oto = !r.sonuc; if (oto) r.sonuc = otoSonuc(r);   /* seçilmediyse kriterlere göre (reisim 2026-09-27) */
    r.durum = "onayda"; r.gonderildi = MK.simdi(); r.geri = null; r.kayit = r.gonderildi; r.degisti = false; if (!r.bitEl) r.bit = r.gonderildi;
    ciz(); window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true });
    MK.bildir("Onaya gönderildi: " + MV.kisi(YON[r.t.b]).ad + ", " + MV.bransAd(r.t.b).toLocaleLowerCase("tr") + " branş yöneticisi." +
      (oto ? " Sonuç kriterlere göre: " + (r.sonuc === "kullanilir" ? "Uygun" : "Uygun değil") + "." : ""));
  }

  MK.goster = function (odakla) { ACIK = {}; ciz(); if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true }); } };
  /* kabuk: raporu yazan inspector (elektrik raporunu Elif Aydın, mekaniği Mert Kaya) */
  var ilk = aktif(), ben = MV.kisi(ilk ? ilk.kisi : "mk");
  MK.kabuk({ modul: 13, kullanici: { bas: MV.bas(ben.ad), ad: ben.ad, rol: "Inspector" } });
  ciz();
})();
