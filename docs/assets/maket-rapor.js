/* ══ probata MAKET M8 — Saha ve Rapor (modül 14) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "ekipmandan rapor oluştur deyip … checklistleri doldurup uygunluk belirleyip fotoğraf ekleyip raporu
   teknik yöneticisine onaya gönderecek"), §1.1 ("pano kontrollerinde her sigortanın tek tek elle yazılması … fotoğraftan sigorta bilgileri
   okuma"), §3 (cihaz SEÇİLMEZ, zimmetten gelir; kalibrasyonu geçmiş cihazla rapor açılır ama onaya gönderilemez; fotoğraf en az 1),
   §4.2 (Ek-III 1.7), §4.5 (her kusur ayrı), §9 yirmi üçüncü tur (madde Uygun · Uygun değil · Uygulanamaz; sonuç Uygun · Uygun değil;
   başlangıç ve bitiş el ile; sonraki kontrol kendiliğinden, el ile değişir; bütün başlıklar açılır kapanır), §8.10 (sigorta okuma ÖNERİ; inspector onaylamadan kaydedilmez). Önce tablet ve telefon.
   Örnekler Planlar'daki plan 1'in (P-0926-031, Merkez Fabrika, denetimde) raporları: aynı numara, aynı durum. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var DURUM = { taslak: MV.RAPOR_DURUM.taslak, onayda: MV.RAPOR_DURUM.onayda, onaylandi: MV.RAPOR_DURUM.onaylandi };   /* reisim 2026-09-26: beş durum, tek kaynak MV */
  var YON = { m: "sy", e: "co" };   /* branş yöneticisi: onay türün branşına gider (§3.2 madde 3) */
  var sayi = function (v) { var x = parseFloat(String(v).replace(",", ".")); return /^\s*\d+([.,]\d+)?\s*$/.test(String(v)) ? x : NaN; };
  /* başlangıç ve bitiş el ile yazılır: GG.AA.YYYY SS:DD (reisim 2026-09-26: "başlangıç ve bitişe tarihleri ve saatleri el ile seçilebilir olsun") */
  var ztYaz = function (iso) { return iso ? iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4) + " " + iso.slice(11, 16) : ""; };
  var ztIso = function (s) {
    var m = /^(\d{2}\.\d{2}\.\d{4})\s+(\d{2}):(\d{2})$/.exec((s || "").trim()); if (!m || +m[2] > 23 || +m[3] > 59) return null;
    var g = tarihIso(m[1]); return g ? g + "T" + m[2] + ":" + m[3] : null;
  };
  var gg = function (iso) { return iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4); };
  /* sonraki kontrol = kontrol tarihi (başlangıç) + türün periyodu; el ile değiştirilirse o kalır */
  var sonrakiHesap = function (r) {
    var b = ztIso(r.bas); if (!b) return "";
    var d = new Date(b.slice(0, 10) + "T12:00:00"); d.setMonth(d.getMonth() + r.t.periyot); return gg(d.toISOString().slice(0, 10));
  };
  function tarihIso(s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2] ? null : iso;
  }

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
      foto: 0, metot: "", amac: "", sonuc: "", notlar: "", sigorta: null, bas: "", bit: "", sonraki: "", sonrakiEl: false, geri: null, geriler: [], pano: false, gonderildi: null };
    var dolu = function () {
      r.kriter.forEach(function (x) { x.c = "uygun"; });
      r.test = ts.map(function (x) { return x.ornek; }); r.foto = 2; r.metot = t.std[0] || "uretici"; r.amac = "Üretim ve bakım"; r.sonuc = "kullanilir";
    };
    if (r.durum !== "taslak") { dolu(); r.gonderildi = r.olustu ? saatEkle(60 + k * 9) : null; }
    r.bas = ztYaz(r.olustu || r.basladi); r.bit = ztYaz(r.gonderildi); r.sonraki = sonrakiHesap(r);
    if (e.kod === "ET-1009") {   /* elektrik iç tesisatı: yarıda; pano sigortaları okunmadı; inspector'ın zimmetinde kalibrasyonu geçmiş cihaz */
      [0, 1, 2].forEach(function (i) { r.kriter[i].c = i === 2 ? "uygundegil" : "uygun"; });
      r.kriter[2].foto = 1; r.kriter[2].not = "Priz devresindeki kaçak akım rölesinin test düğmesi çalışmıyor; açma süresi ölçümle doğrulandı.";
      r.test[0] = "0,8"; r.foto = 1; r.metot = t.std[0]; r.amac = "Aydınlatma, priz ve makine besleme devreleri";
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
  var cihazlar = function (r) { return MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz" && MV.kimde(v.id) === r.kisi && MV.cihazTuru(v.cihazTur).g.indexOf(r.t.g) >= 0; }); };
  var testSonuc = function (x, v) { var n = sayi(v); return isNaN(n) ? null : x.op === "<=" ? n <= x.sinir : n >= x.sinir; };
  /* madde sonucu Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26); "sınır dışı" test değeri de uygun değil sayılır */
  var KRITER = [["uygun", "Uygun"], ["uygundegil", "Uygun değil"], ["uygulanamaz", "Uygulanamaz"]];
  var kusurlar = function (r) { return r.kriter.filter(function (x) { return x.c === "uygundegil"; }); };
  var sinirDisi = function (r) { return MV.testler(r.t).some(function (x, i) { return testSonuc(x, r.test[i]) === false; }); };
  var uygunDegil = function (r) { return kusurlar(r).length > 0 || sinirDisi(r); };
  var elektrik = function (t) { return t.g === "elektrik"; };   /* pano sigortaları bölümü yalnız elektrik grubunda */
  var engelli = function (r) { return eksikler(r).some(function (x) { return x.engel && !x.ok; }); };
  function eksikler(r) {
    var ts = MV.testler(r.t), cev = r.kriter.filter(function (x) { return x.c; }).length, kusurNotsuz = kusurlar(r).filter(function (x) { return !x.not.trim(); }).length;
    var girilen = r.test.filter(function (v) { return !isNaN(sayi(v)); }).length, gecti = cihazlar(r).filter(function (v) { return MV.kalDurum(v) === "gecti"; });
    var oneri = r.sigorta ? r.sigorta.filter(function (x) { return x.durum !== "onayli"; }).length : 0;
    return [
      { ok: !!r.metot, metin: r.metot ? "Kontrol metodu seçildi" : "Kontrol metodu seçilmedi", bolum: "r-bk" },
      { ok: !!r.amac.trim(), metin: r.amac.trim() ? "Kullanım amacı yazıldı" : "Kullanım amacı yazılmadı", bolum: "r-b2" },
      { ok: !!ztIso(r.bas), metin: "Başlangıç tarihi ve saati yazılmadı", bolum: "r-bk" },
      { ok: !r.bit || !!ztIso(r.bit), metin: "Bitiş tarihi ve saati geçersiz", bolum: "r-bk" },
      { ok: !gecti.length, metin: gecti.length ? "Kalibrasyonu geçmiş cihaz: " + gecti.map(function (v) { return v.seri; }).join(", ") : "Ölçüm cihazlarının kalibrasyonu geçerli", bolum: "r-b3", engel: true },
      { ok: cev === r.kriter.length, metin: cev + " / " + r.kriter.length + " kriter cevaplandı", bolum: "r-b4" },
      { ok: !kusurNotsuz, metin: kusurNotsuz ? kusurNotsuz + " kusurun açıklaması yazılmadı" : "Kusur açıklamaları tamam", bolum: "r-b4", gizle: !kusurlar(r).length },
      { ok: girilen === ts.length, metin: girilen + " / " + ts.length + " test değeri girildi", bolum: "r-b5" },
      { ok: !elektrik(r.t) || (!!r.sigorta && !oneri), metin: !r.sigorta ? "Pano sigortaları girilmedi" : oneri ? oneri + " sigorta önerisi onay bekliyor" : "Pano sigortaları onaylandı", bolum: "r-b6", gizle: !elektrik(r.t) },
      { ok: r.foto >= 1, metin: r.foto >= 1 ? r.foto + " fotoğraf" : "Fotoğraf yok (en az 1)", bolum: "r-b7" },
      { ok: !!r.sonuc && !(uygunDegil(r) && r.sonuc === "kullanilir"), metin: !r.sonuc ? "Sonuç ve kanaat seçilmedi" : "Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”", bolum: "r-b8" }
    ].filter(function (x) { return !x.gizle; });
  }

  /* ── ÇİZİM ──────────────────────────────────────────────────────────────────────────────────────────── */
  /* her başlık açılır kapanır (reisim 2026-09-26: "muayene kriterleri, firma bilgileri cihazlar vb tüm başlıklar açılır kapanır olmalı");
     kapatılan bölüm yeniden çizimde kapalı kalır */
  var KAPALI = {};
  var bolum = function (no, id, baslik, ic, ek) {
    return '<details class="a-form-bolum a-bolum-rapor a-bolum-acilir" id="' + id + '"' + (KAPALI[id] ? "" : " open") + '><summary class="a-alt-bas"><h2 class="a-alt-baslik" id="' + id + '-b" tabindex="-1">' +
      (no ? no + " · " : "") + baslik + "</h2>" + (ek || "") + ikon("chevron-down", "a-ikon-kucuk a-acilir-ok") + "</summary>" + ic + "</details>";
  };
  document.addEventListener("toggle", function (e) { var d = e.target; if (d.classList && d.classList.contains("a-bolum-acilir")) KAPALI[d.id] = !d.open; }, true);
  var segmen = function (ad, k, deger, secenekler, kapali) {
    return '<div class="a-sekmeler" role="group" aria-label="' + kacis(ad) + '">' + secenekler.map(function (s) {
      return '<button type="button" class="a-sekme' + (s[2] ? " " + s[2] : "") + '" data-segmen="' + k + '" data-deger="' + s[0] + '" aria-pressed="' + (deger === s[0]) + '"' + (kapali ? " disabled" : "") + ">" + s[1] + "</button>";
    }).join("") + "</div>";
  };
  var okuGirdi = function (id, deger) { return '<input class="a-girdi a-girdi-oku" id="' + id + '" readonly value="' + kacis(deger || "—") + '">'; };
  /* tarih alanlarının hatası yazarken yerinde güncellenir (liste yeniden çizilmez, odak kaçmaz) */
  function tarihHata(r, k) {
    var v = (r[k] || "").trim(), b = ztIso(r.bas);
    if (k === "sonraki") { var i = tarihIso(v); return !v ? "" : !i ? "GG.AA.YYYY biciminde geçerli bir tarih." : b && i <= b.slice(0, 10) ? "Kontrol tarihinden sonra olmalı." : ""; }
    if (!v) return k === "bas" ? "Tarih ve saat yazın." : "";
    var z = ztIso(v); return !z ? "GG.AA.YYYY SS:DD biciminde." : k === "bit" && b && z < b ? "Bitiş başlangıçtan önce olamaz." : "";
  }
  function hataYaz(id, metin) {
    var g = $(id); if (!g) return; var kap = g.closest(".a-alan-grup"), p = kap.querySelector(".a-ipucu");
    if (metin) { g.setAttribute("aria-invalid", "true"); if (!p) { p = document.createElement("p"); p.className = "a-ipucu a-ipucu-uyari"; p.id = id + "-ipucu"; kap.appendChild(p); } p.textContent = metin; }
    else { g.removeAttribute("aria-invalid"); if (p) p.remove(); }
  }
  var tarihAlan = function (r, oku, k, etiket, bicim) {
    var id = "r-" + k, h = oku ? "" : tarihHata(r, k);
    return MK.alan({ id: id, etiket: etiket, zorunlu: !oku && k === "bas", hata: h,
      girdi: oku ? okuGirdi(id, r[k]) : MK.girdi({ id: id, alan: k, deger: r[k], sinif: "a-girdi-sicil", hata: h, ek: ' inputmode="numeric" maxlength="' + bicim.length + '" placeholder="' + bicim + '"' }) });
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
    var gecti = ci.filter(function (v) { return MV.kalDurum(v) === "gecti"; });
    var metotlar = t.std.map(function (k) { var s = MV.standart(k); return [k, s.no + ":" + s.surum, s.konu]; }).concat([["uretici", "Üretici talimatı"], ["risk", "Risk değerlendirmesi"]]);
    var metotAd = (metotlar.filter(function (x) { return x[0] === r.metot; })[0] || [])[1];
    var cevaplanan = r.kriter.filter(function (x) { return x.c; }).length;
    var CIHAZ = [
      { k: "ad", baslik: "Cihaz", kart: "ust", sira: 1, hucre: function (v) { return kacis(v.ad); } },
      { k: "no", baslik: "Cihaz no", kart: "govde", sira: 2, hucre: function (v) { return '<span class="a-kart-etiket">Cihaz no</span><span class="a-kod">' + v.seri + "</span>"; } },
      { k: "kal", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 3, hucre: function (v) {
        return '<span class="a-kart-etiket">Kalibrasyon tarihi</span>' + (MV.kalDurum(v) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(v.kal[0].tarih) + "</span>" : MK.tarihYaz(v.kal[0].tarih)); } }
    ];
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
      /* 1 · FİRMA BİLGİLERİ: türün rapor formatından bağımsız, her raporda aynı (reisim 2026-09-26) */
      bolum(1, "r-b1", "Firma bilgileri", '<dl class="a-bilgi">' +
          bilgi("Firma ünvanı", kacis(MV.musteri(PL.m).unvan), true) + bilgi("Adres", kacis(PL.adres + ", " + PL.ilce + " / " + PL.il), true) +
          bilgi("SGK destis no", '<span class="a-kod a-kod-uzun">' + PL.sgk + "</span>", "cift") +
          bilgi("İSG-KATİP sözleşme ID", isg ? '<span class="a-kod">' + isg.no + "</span>" : '<span class="a-uyari-metin">Yok</span>') + "</dl>") +
      bolum(2, "r-bk", "Kontrol bilgileri", '<div class="a-form">' +
          tarihAlan(r, oku, "bas", "Başlangıç", "GG.AA.YYYY SS:DD") + tarihAlan(r, oku, "bit", "Bitiş", "GG.AA.YYYY SS:DD") +
          tarihAlan(r, oku, "sonraki", "Sonraki kontrol", "GG.AA.YYYY") +
          MK.alan({ id: "r-metot", etiket: "Kontrol metodu", zorunlu: !oku, genis: true,
            girdi: oku ? okuGirdi("r-metot", metotAd) : MK.secim({ id: "r-metot", ad: "Kontrol metodu", deger: r.metot, secenekler: metotlar, ipucu: "Metot seçin", tanim: "r-metot-ipucu" }) }) +
        "</div>") +
      bolum(3, "r-b2", "Ekipman bilgileri", '<dl class="a-bilgi">' + bilgi("Kod", '<span class="a-kod">' + e.kod + "</span>") + bilgi("Marka / model", kacis(e.marka + " " + e.model)) +
          bilgi("Seri no", '<span class="a-kod">' + e.seri + "</span>") + bilgi("İmal yılı", e.imal) + bilgi("Kullanım yeri", kacis(e.konum)) +
          bilgi("Önceki kontrol", e.onceki ? MK.tarihYaz(e.onceki.tarih) + '<span class="a-alt-satir">' + kacis(e.onceki.sonuc) + " · <span class=\"a-rapor-no\">" + e.onceki.rapor + "</span></span>" : '<span class="a-deger-yok">İlk kontrol</span>') + "</dl>" +
        '<div class="a-form">' + MK.alan({ id: "r-amac", etiket: "Kullanım amacı", zorunlu: !oku, genis: true,
          girdi: MK.girdi({ id: "r-amac", alan: "amac", deger: r.amac, ek: ' maxlength="120"' + (oku ? " readonly" : ""), sinif: oku ? "a-girdi-oku" : "" }) }) + "</div>") +
      /* ölçüm cihazları: zimmetten gelir, seçilmez; tabloda yalnız cihaz · cihaz no · kalibrasyon tarihi (reisim 2026-09-26) */
      bolum(4, "r-b3", "Ölçüm cihazları", "" +
        (ci.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Ölçüm cihazları", sinif: "a-tablo-olcum", sutunlar: CIHAZ, kayitlar: ci }) + "</div>" : '<p class="a-bos-satir">Zimmette bu gruba uygun cihaz yok.</p>') +
        (gecti.length && !oku ? '<div class="a-bolum-serit">' + MK.serit("hata", "circle-x", "Kalibrasyonu geçmiş cihaz: " + gecti.map(function (v) { return kacis(v.ad) + " " + v.seri; }).join(", ") + ". Rapor doldurulabilir ama onaya gönderilemez.", "r-kal-engel") +
          '</div><div class="a-eylem-cubugu a-bolum-serit">' + MK.git({ hedef: 9, hash: "#/?kisi=" + r.kisi, ad: "Zimmetlerim", ikon: "package", ne: "Zimmetler" }) + "</div>" : "")) +
      /* muayene kriterleri: solda kriter, sağda seçim — Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26) */
      bolum(5, "r-b4", "Muayene kriterleri", "" +
        r.kriter.map(function (x, i) {
          var ad = MV.kriterler(t)[i], kus = x.c === "uygundegil", secAd = (KRITER.filter(function (y) { return y[0] === x.c; })[0] || [])[1];
          return '<div class="a-kriter" id="r-k' + i + '"><p class="a-kriter-ad" id="r-ka' + i + '"><span class="a-kriter-no">' + (i + 1) + "</span><span>" + kacis(ad) + "</span></p>" +
            '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-kc" + i, secAd) : MK.secim({ id: "r-kc" + i, ad: "Madde " + (i + 1), deger: x.c, secenekler: KRITER, ipucu: "Seçin", tanim: "r-ka" + i })) + "</div>" +
            (kus ? '<div class="a-kriter-kusur">' + MK.alan({ id: "r-kn" + i, etiket: "Kusur açıklaması", zorunlu: !oku,
              girdi: '<textarea class="a-alan a-alan-ince" id="r-kn' + i + '" data-alan="kn' + i + '" maxlength="300" aria-describedby="r-kn' + i + '-ipucu"' + (oku ? " readonly" : "") + ">" + kacis(x.not) + "</textarea>" }) +
              '<div class="a-fotolar">' + fotolar(x.foto || 0) + (oku ? "" : MK.tus({ eylem: "kusur-foto", ad: "Fotoğraf ekle", ikon: "camera", sinif: "a-tus-ikincil", veri: { i: i } })) + "</div></div>" : "") + "</div>";
        }).join(""), '<span class="a-sayac" id="r-kriter-say"><b>' + cevaplanan + "</b> / " + r.kriter.length + " madde</span>") +
      bolum(6, "r-b5", "Test değerleri", '<div class="a-form">' + MV.testler(t).map(function (x, i) {
          var s = testSonuc(x, r.test[i]);
          return MK.alan({ id: "r-t" + i, etiket: kacis(x.ad) + " (" + x.birim + ")", zorunlu: !oku, sonuc: '<span id="r-t' + i + '-sonuc">' + testIpucu(x, r.test[i]) + "</span>", hata: "",
            girdi: MK.girdi({ id: "r-t" + i, alan: "t" + i, deger: r.test[i], sinif: "a-girdi-sicil" + (oku ? " a-girdi-oku" : ""), ek: ' inputmode="decimal" maxlength="10"' + (oku ? " readonly" : "") + (s === false ? ' aria-invalid="true"' : "") }) });
        }).join("") + "</div>") +
      (elektrik(t) ? bolum(7, "r-b6", "Pano sigortaları", sigortaHtml(r, oku)) : "") +
      bolum(elektrik(t) ? 8 : 7, "r-b7", "Fotoğraflar", '<div class="a-fotolar">' + fotolar(r.foto) + (oku ? "" : MK.tus({ eylem: "foto-ekle", ad: "Fotoğraf çek", ikon: "camera", sinif: "a-tus-ikincil" })) + "</div>") +
      /* sonuç ve kanaat: Uygun · Uygun değil (reisim 2026-09-26); uygun değil madde varken "Uygun" uyarıdır, engel değil */
      bolum(elektrik(t) ? 9 : 8, "r-b8", "Sonuç ve kanaat", '<p class="a-bolum-aciklama" id="r-oneri">' + oneri(r) + "</p>" +
        segmen("Sonuç ve kanaat", "sonuc", r.sonuc, [["kullanilir", "Uygun", "a-sekme-onay"], ["kullanilamaz", "Uygun değil", "a-sekme-hata"]], oku) +
        (!oku && uygunDegil(r) && r.sonuc === "kullanilir" ? '<p class="a-ipucu a-ipucu-uyari">Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”.</p>' : "")) +
      bolum(elektrik(t) ? 10 : 9, "r-b9", "Muayene uzmanı yorumu", '<textarea class="a-alan a-alan-ince" id="r-notlar" data-alan="notlar" maxlength="500" aria-label="Muayene uzmanı yorumu"' + (oku ? " readonly" : "") + ">" + kacis(r.notlar) + "</textarea>") +
      "</div>" +
      (oku ? "" : '<div class="a-form-eylem"><p class="a-adim-not">Taslak her değişiklikte kaydedilir · son kayıt ' + MK.SAAT + "</p>" +
        MK.tus({ eylem: "onaya-gonder", ad: "Onaya gönder", ikon: "send", kapali: engelli(r), sebepId: "r-kal-engel" }) + "</div>");
    document.title = e.kod + " · " + r.no + " · probata maket";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function testIpucu(x, v) {
    var s = testSonuc(x, v);
    return s === null ? "Sınır " + MV.sinirYaz(x) : s ? "Uygun · sınır " + MV.sinirYaz(x) : "Sınır dışı · " + MV.sinirYaz(x);
  }
  function oneri(r) {
    if (sinirDisi(r)) return "Öneri: <b>Uygun değil</b> — sınır dışı test değeri var.";
    if (kusurlar(r).length) return "Öneri: <b>Uygun değil</b> — uygun değil madde var.";
    return "Öneri: <b>Uygun</b>.";
  }
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
    if (o.tur === "gonder") document.querySelector('[data-eylem="yine-de-gonder"]').focus(); else $(o.x ? "w-tip" : "w-no").focus();
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
  MK.onTikla = function (e) {
    var b = e.target.closest("[data-segmen]"); if (!b || b.disabled) return false;
    var r = aktif(), k = b.dataset.segmen, v = b.dataset.deger;
    if (k !== "sonuc") return false;
    r.sonuc = v;
    var sec = '[data-segmen="' + k + '"][data-deger="' + v + '"]';
    ciz(); var el = document.querySelector(sec); if (el) el.focus();
    return true;
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k) return;
    if (W && $("a-pencere").open) { W.d[k] = e.target.value; return; }
    var r = aktif(); if (!r) return;
    if (k === "amac" || k === "notlar") r[k] = e.target.value;
    else if (k === "bas" || k === "bit" || k === "sonraki") {
      r[k] = e.target.value;
      if (k === "sonraki") r.sonrakiEl = !!r.sonraki.trim();
      if (k === "bas" && !r.sonrakiEl && $("r-sonraki")) { r.sonraki = sonrakiHesap(r); $("r-sonraki").value = r.sonraki; }   /* sonraki kontrol kendiliğinden */
      ["bas", "bit", "sonraki"].forEach(function (x) { hataYaz("r-" + x, tarihHata(r, x)); });
    }
    else if (k[0] === "t" && k[1] !== undefined && /^t\d+$/.test(k)) {   /* test değeri: ipucu ve sonuç önerisi canlı, odak yerinde */
      var i = +k.slice(1), x = MV.testler(r.t)[i]; r.test[i] = e.target.value;
      $("r-t" + i + "-sonuc").textContent = testIpucu(x, r.test[i]);
      if (testSonuc(x, r.test[i]) === false) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid");
      $("r-oneri").innerHTML = oneri(r);
    } else if (/^kn\d+$/.test(k)) r.kriter[+k.slice(2)].not = e.target.value;
    ozetYenile(r);
  };
  /* yazarken yalnız gönder tuşu güncellenir (odak kaçmaz); eksikler yalnız "Onaya gönder"de pencerede sayılır (reisim 2026-09-26:
     "onaya göndermeden önce 8 eksik vb eksik yazan kısım olmasın") */
  function ozetYenile(r) { var t = document.querySelector('[data-eylem="onaya-gonder"]'); if (t) t.disabled = engelli(r); }
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) { W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return; }
    var r = aktif(); if (id === "r-metot") { r.metot = deger; ciz(id); }
    else if (/^r-kc\d+$/.test(id)) { r.kriter[+id.slice(4)].c = deger; ciz(id); }
  };
  var X = MK.eylem;
  X["foto-ekle"] = function () { var r = aktif(); r.foto++; ciz(); var t = document.querySelector('[data-eylem="foto-ekle"]'); if (t) t.focus(); MK.bildir("Fotoğraf " + r.foto + " eklendi."); };
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
    var r = aktif(), i = +el.dataset.i; r.kriter[i].foto = (r.kriter[i].foto || 0) + 1; ciz();
    var t = document.querySelector('[data-eylem="kusur-foto"][data-i="' + i + '"]'); if (t) t.focus();
    MK.bildir("Madde " + (i + 1) + " için fotoğraf eklendi.");
  };
  function gonder(r) {
    if (r.geri) r.geriler.unshift(r.geri);
    r.durum = "onayda"; r.gonderildi = MK.simdi(); r.geri = null; if (!ztIso(r.bit)) r.bit = ztYaz(r.gonderildi);
    ciz(); window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true });
    MK.bildir("Onaya gönderildi: " + MV.kisi(YON[r.t.b]).ad + ", " + MV.bransAd(r.t.b).toLocaleLowerCase("tr") + " branş yöneticisi.");
  }

  MK.goster = function (odakla) { ciz(); if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true }); } };
  /* kabuk: raporu yazan inspector (elektrik raporunu Elif Aydın, mekaniği Mert Kaya) */
  var ilk = aktif(), ben = MV.kisi(ilk ? ilk.kisi : "mk");
  MK.kabuk({ modul: 13, kullanici: { bas: MV.bas(ben.ad), ad: ben.ad, rol: "Inspector" } });
  ciz();
})();
