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
    /* Bakanlık formatlı tür (ZPKR01 · ZPKR02, 2026-09-27): ekipman detayları ve tespitler formattan; topraklamada ölçüm noktaları ve RCD
       satırları (noktalar önceki rapordan gelir, Zx her kontrolde yeniden ölçülür) */
    var F = MV.formatYapi(t); r.F = F; r.detay = {}; r.tespit = {}; r.metod = ""; r.termal = ""; r.nokta = []; r.rcdler = [];
    var ornekBilgi = function () {
      F.detay.forEach(function (x) { r.detay[x.k] = x.ornek; });
      F.tespit.forEach(function (x) { r.tespit[x.k] = Array.isArray(x.ornek) ? x.ornek.slice() : x.ornek; });
    };
    if (F && F.noktalar) {
      r.nokta = F.noktalar.map(function (n) { return { ad: n[0], egri: n[1], In: n[2], zx: "", rcd: n[4], priz: /priz/i.test(n[0]) }; });
      r.rcdler = F.rcd.map(function (x) { return { ad: x[0], tip: x[1], In: x[2], idn: x[3], id: "", td: "" }; });
    }
    if (F && e.onceki) F.detay.forEach(function (x) { r.detay[x.k] = x.ornek; });   /* önceki raporun ekipman detayları başlangıç, değiştirilebilir */
    var dolu = function () {
      cihazDoldur();
      r.kriter.forEach(function (x) { x.c = "uygun"; });
      r.test = ts.map(function (x) { return x.ornek; }); r.foto = 2; r.amac = "Üretim ve bakım"; r.sonuc = "kullanilir";
      if (F) {
        ornekBilgi(); r.metod = F.metot[0]; r.termal = F.gozle ? "hayir" : "";   /* termal kamera kullanılmadı → termal kamera maddeleri uygulanamaz */
        if (F.gozle) MV.kriterGruplari(t).reduce(function (i, g) { g[1].forEach(function (x, j) { if (g[0] === "Termal kamera") r.kriter[i + j].c = "uygulanamaz"; }); return i + g[1].length; }, 0);
        r.nokta.forEach(function (n, i) { n.zx = F.noktalar[i][3] || "0,34"; });
        r.rcdler.forEach(function (x, i) { x.id = F.rcd[i][4] || "220"; x.td = F.rcd[i][5] || "180"; });
      }
    };
    if (r.durum !== "taslak") { dolu(); r.gonderildi = r.olustu ? saatEkle(60 + k * 9) : null; }
    /* otomatik dolu: başlangıç rapor açıldığında, bitiş gönderildiğinde (taslakta şimdi), sonraki kontrol başlangıç + periyot */
    r.bas = r.olustu || r.basladi || MK.simdi(); r.bit = r.gonderildi || MK.simdi(); r.sonraki = sonrakiHesap(r); r.rtarih = r.bas.slice(0, 10);
    r.kayit = r.olustu ? saatEkle(30 + k * 6) : null;
    if (e.kod === "ET-1009") {   /* elektrik iç tesisatı (ZPKR02): yarıda; pano sigortaları okunmadı; inspector'ın zimmetinde kalibrasyonu geçmiş cihaz */
      ornekBilgi(); r.tespit = { degisiklik: "Yok", etiket: "Var" };
      [0, 1, 2].forEach(function (i) { r.kriter[i].c = i === 2 ? "uygundegil" : "uygun"; });
      r.kriter[2].foto = 1; r.kriter[2].derece = "hafif"; r.kriter[2].not = "Tali pano TP-2 duvara yalnız üstten sabitlenmiş; alt bağlantı yok.";
      r.test[0] = "0,21"; r.foto = 1; r.amac = "Aydınlatma, priz ve makine besleme devreleri";
      r.cihaz = ["v1", "v2", "v3"];   /* v3 = tesisat test cihazı OC-003, kalibrasyonu 18.09.2026'da geçti; zimmette geçerli başkası yok */
    }
    if (e.kod === "AT-1010") {   /* AG topraklama (ZPKR01): ölçümler yarıda; kapı motoru hattında Zx sınırı aşıyor, RCD yok → Not-2, ağır kusur */
      ornekBilgi(); r.metod = F.metot[0]; cihazDoldur();
      [0, 1, 2, 3, 4].forEach(function (i) { r.nokta[i].zx = F.noktalar[i][3]; });
      r.nokta.push({ ad: "Kapı motoru — sevkiyat", egri: "C", In: 10, zx: "2,6", rcd: "", priz: false });
      r.rcdler[0].id = F.rcd[0][4]; r.rcdler[0].td = F.rcd[0][5]; r.foto = 1;
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
  /* gerekli cihaz satırları: türün her cihaz türü için eklenen cihaz (yoksa v = null) */
  var cihazSatirlari = function (r) { var ci = cihazlar(r); return MV.turCihazlari(r.t).map(function (c) { return { c: c, v: ci.filter(function (v) { return v.cihazTur === c; })[0] || null }; }); };
  var gecmis = function (r) { return cihazlar(r).filter(function (v) { return MV.kalDurum(v) === "gecti"; }); };
  var eksikTur = function (r) { var gecerli = cihazlar(r).filter(function (v) { return MV.kalDurum(v) !== "gecti"; }).map(function (v) { return v.cihazTur; });
    return MV.turCihazlari(r.t).filter(function (c) { return gecerli.indexOf(c) < 0; }); };
  var testSonuc = function (x, v) { var n = sayi(v); return isNaN(n) ? null : x.op === "<=" ? n <= x.sinir : n >= x.sinir; };
  /* madde sonucu Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26); "sınır dışı" test değeri de uygun değil sayılır */
  var KRITER = [["uygun", "Uygun"], ["uygundegil", "Uygun değil"], ["uygulanamaz", "Uygulanamaz"]];
  var kusurlar = function (r) { return r.kriter.filter(function (x) { return x.c === "uygundegil"; }); };
  var sinirDisi = function (r) { return MV.testler(r.t).some(function (x, i) { return testSonuc(x, r.test[i]) === false; }); };
  /* topraklama (ZPKR01): RCD testi IΔ ≤ IΔn ve TΔ ≤ 200 ms; ölçüm noktası ağır kusurlu (Not-2, Not-5) ise uygun değil */
  var rcdSonuc = function (x) { var i = sayi(x.id), d = sayi(x.td); return isNaN(i) || isNaN(d) ? null : i <= x.idn && d <= 200; };
  var olcumKusur = function (r) { return r.nokta.some(function (n) { return MV.noktaHesap(n).agir; }) || r.rcdler.some(function (x) { return rcdSonuc(x) === false; }); };
  var uygunDegil = function (r) { return kusurlar(r).length > 0 || sinirDisi(r) || olcumKusur(r); };
  var elektrik = function (t) { return t.g === "elektrik"; };   /* pano sigortaları bölümü yalnız elektrik grubunda */
  var sigortali = function (r) { return elektrik(r.t) && (!r.F || !!r.F.gozle); };   /* topraklama formatında pano sigortası yok, ölçüm noktaları var */
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
    var F = r.F, dolu = function (v) { return Array.isArray(v) ? v.length > 0 : !!String(v || "").trim(); };
    var alan = F ? F.detay.map(function (x) { return r.detay[x.k]; }).concat(F.tespit.map(function (x) { return r.tespit[x.k]; })) : [];
    var gerekli = F ? F.detay.concat(F.tespit).filter(function (x) { return !/varsa/.test(x.ad); }).length : 0, girilenAlan = alan.filter(dolu).length;
    var derecesiz = MV.kusurSinifli(r.t) ? kusurlar(r).filter(function (x) { return !x.derece; }).length : 0;
    var zx = r.nokta.filter(function (n) { return !isNaN(sayi(n.zx)); }).length, rcdGir = r.rcdler.filter(function (x) { return rcdSonuc(x) !== null; }).length;
    return (F ? [
      { ok: girilenAlan >= gerekli, metin: Math.min(girilenAlan, gerekli) + " / " + gerekli + " ekipman bilgisi dolduruldu", bolum: "r-b2" },
      { ok: !!r.metod, metin: "Ölçüm metodu seçilmedi", bolum: "r-b5" },
      { ok: zx === r.nokta.length, metin: zx + " / " + r.nokta.length + " ölçüm noktasında Zx girildi", bolum: "r-b5", gizle: !F.noktalar },
      { ok: rcdGir === r.rcdler.length, metin: rcdGir + " / " + r.rcdler.length + " RCD testi girildi", bolum: "r-b5", gizle: !F.noktalar },
      { ok: !derecesiz, metin: derecesiz + " kusurun derecesi seçilmedi", bolum: "r-b4", gizle: !derecesiz }
    ] : [
      { ok: !!r.amac.trim(), metin: r.amac.trim() ? "Kullanım amacı yazıldı" : "Kullanım amacı yazılmadı", bolum: "r-b2" },
      { ok: !!(r.marka.trim() && r.seri.trim()), metin: "Ekipman bilgileri eksik (marka, seri no)", bolum: "r-b2" },
      { ok: !derecesiz, metin: derecesiz + " kusurun derecesi seçilmedi", bolum: "r-b4", gizle: !derecesiz }
    ]).concat([
      { ok: r.bit >= r.bas, metin: "Bitiş başlangıçtan önce", bolum: "r-b1" },
      { ok: !gecti.length && !eks.length, metin: cihazEngelMetin(r), bolum: "r-b3", engel: true },
      { ok: cev === r.kriter.length, metin: cev + " / " + r.kriter.length + " kriter cevaplandı", bolum: "r-b4", gizle: !r.kriter.length },
      { ok: !kusurNotsuz, metin: kusurNotsuz ? kusurNotsuz + " kusurun açıklaması yazılmadı" : "Kusur açıklamaları tamam", bolum: "r-b4", gizle: !kusurlar(r).length },
      { ok: girilen === ts.length, metin: girilen + " / " + ts.length + " test değeri girildi", bolum: "r-b5", gizle: !ts.length },
      { ok: !!r.sigorta && !oneri, metin: !r.sigorta ? "Pano sigortaları girilmedi" : oneri ? oneri + " sigorta önerisi onay bekliyor" : "Pano sigortaları onaylandı", bolum: "r-b6", gizle: !sigortali(r) },
      { ok: r.foto >= 1, metin: r.foto >= 1 ? r.foto + " fotoğraf" : "Fotoğraf yok (en az 1)", bolum: "r-b7" },
      /* sonuç seçilmezse gönderilince kriterlere göre konur (reisim 2026-09-27) — eksik sayılmaz */
      { ok: !(uygunDegil(r) && r.sonuc === "kullanilir"), metin: "Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”", bolum: "r-b8" }
    ]).filter(function (x) { return !x.gizle; });
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
  var ad2 = function (l, k) { return (l.filter(function (y) { return y[0] === k; })[0] || [])[1]; };
  var DERECE = [["hafif", "Hafif kusur"], ["agir", "Ağır kusur"]];
  var virgul = function (x) { return String(x).replace(".", ","); };
  /* madde numarası: formatlı türde bölüm.grup.madde (gözle kontrolün 1. grubunun 3. maddesi "5.1.3"), ötekinde sıra */
  function kriterNo(t, i) {
    var g = MV.kriterGruplari(t); if (!g) return String(i + 1);
    for (var a = 0; a < g.length; a++) { if (i < g[a][1].length) return MV.formatYapi(t).bolumler.kontrol + "." + (a + 1) + "." + (i + 1); i -= g[a][1].length; }
    return "";
  }
  function kriterHtml(r, oku, i) {
    var t = r.t, x = r.kriter[i], ad = MV.kriterler(t)[i], no = kriterNo(t, i), kus = x.c === "uygundegil";
    return '<div class="a-kriter" id="r-k' + i + '"><p class="a-kriter-ad" id="r-ka' + i + '"><span class="a-kriter-no">' + no + "</span><span>" + kacis(ad) + "</span></p>" +
      '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-kc" + i, ad2(KRITER, x.c)) : MK.secim({ id: "r-kc" + i, ad: "Madde " + no, deger: x.c, secenekler: KRITER, ipucu: "Seçin", tanim: "r-ka" + i })) + "</div>" +
      (kus ? '<div class="a-kriter-kusur">' +
        /* hafif / ağır yalnız Bakanlık formatı yürürlükteki türde (§4.5, Ek-III 1.9.1) */
        (MV.kusurSinifli(t) ? MK.alan({ id: "r-kd" + i, etiket: "Kusur derecesi", zorunlu: !oku,
          girdi: oku ? okuGirdi("r-kd" + i, ad2(DERECE, x.derece)) : MK.secim({ id: "r-kd" + i, ad: "Kusur derecesi", deger: x.derece || "", secenekler: DERECE, ipucu: "Seçin", tanim: "r-kd" + i + "-ipucu" }) }) : "") +
        MK.alan({ id: "r-kn" + i, etiket: "Kusur açıklaması", zorunlu: !oku,
          girdi: '<textarea class="a-alan a-alan-ince" id="r-kn' + i + '" data-alan="kn' + i + '" maxlength="300" aria-describedby="r-kn' + i + '-ipucu"' + (oku ? " readonly" : "") + ">" + kacis(x.not) + "</textarea>" }) +
        '<div class="a-fotolar">' + fotolar(x.foto || 0, x.fotoAd) + (oku ? "" : fotoMenu("kusur-foto", ' data-i="' + i + '"')) + "</div></div>" : "") + "</div>";
  }
  /* tek satırlık seçim (solda ad, sağda seçim): ölçüm metodu · termal kamera · sonuç */
  var tekSecim = function (id, ad, deger, secenekler, oku, genis) {
    return '<div class="a-kriter a-kriter-sonuc' + (genis ? " a-kriter-genis" : "") + '"><p class="a-kriter-ad" id="' + id + '-ad"><span>' + ad + "</span></p>" +
      '<div class="a-kriter-cevap">' + (oku ? okuGirdi(id, ad2(secenekler, deger)) : MK.secim({ id: id, ad: ad, deger: deger, secenekler: secenekler, ipucu: "Seçin", tanim: id + "-ad" })) + "</div></div>";
  };
  /* formattaki ekipman detayı ya da tespit alanı: secim (tek) · coklu (birden çok) · metin; grup "detay" (r-d-…) ya da "tespit" (r-s-…) */
  function bilgiAlan(r, oku, grup, x) {
    var id = "r-" + grup[0].replace("t", "s") + "-" + x.k, v = r[grup][x.k];
    if (oku) return satir(kacis(x.ad), x.tip === "coklu" ? ((v || []).length ? v.map(kacis).join("<br>") : "-") : (kacis(v) || "-"));
    if (x.tip === "secim") return satir(kacis(x.ad), MK.secim({ id: id, ad: x.ad, deger: v || "", secenekler: x.sec.map(function (s) { return [s, s]; }), ipucu: "Seçin" }), id);
    if (x.tip === "coklu") return satir(kacis(x.ad), '<div class="a-coklu" role="group" aria-label="' + kacis(x.ad) + '">' + x.sec.map(function (s, j) {
      return '<label class="a-onay-kutusu"><input type="checkbox" data-coklu="' + grup + "|" + x.k + "|" + j + '"' + ((v || []).indexOf(s) >= 0 ? " checked" : "") + "><span>" + kacis(s) + "</span></label>"; }).join("") + "</div>");
    return satir(kacis(x.ad), MK.girdi({ id: id, alan: grup[0].replace("t", "s") + "-" + x.k, deger: v, ek: ' maxlength="80"' }), id);
  }
  function ekipmanFormat(r, oku) {
    var F = r.F, e = r.e, n = F.bolumler.ekipman;
    return '<dl class="a-satirlar a-satirlar-form">' + satir("Kod", '<span class="a-kod">' + e.kod + "</span>") + satir("Ekipman türü", kacis(r.t.ad)) +
        metinAlan(r, oku, "konum", "Kullanım yeri", 60) +
        satir("Önceki kontrol", e.onceki ? MK.tarihYaz(e.onceki.tarih) + " · " + kacis(e.onceki.sonuc) + ' · <span class="a-rapor-no">' + e.onceki.rapor + "</span>" : "İlk kontrol") + "</dl>" +
      '<h3 class="a-kriter-grup">' + n + ".1 · Ekipman detayları</h3>" +
      '<dl class="a-satirlar a-satirlar-form">' + F.detay.map(function (x) { return bilgiAlan(r, oku, "detay", x); }).join("") + "</dl>" +
      '<h3 class="a-kriter-grup">' + n + ".2 · Tespitler</h3>" +
      '<dl class="a-satirlar a-satirlar-form">' + F.tespit.map(function (x) { return bilgiAlan(r, oku, "tespit", x); }).join("") + "</dl>";
  }
  /* 3 · TERMAL KAMERA (ZPKR02): isteğe bağlı; kullanıldıysa inspector'ın zimmetindeki geçerli termal kamera yazılır */
  function termalHtml(r, oku, CIHAZ) {
    var tk = MV.eklenebilirCihazlar(r.kisi, ["termal"])[0];
    return tekSecim("r-termal", "Termal kamera ile kontrol yapıldı mı?", r.termal, [["evet", "Evet"], ["hayir", "Hayır"]], oku) +
      (r.termal !== "evet" ? "" : tk ? '<div class="a-liste-kap a-bolum-serit">' + MK.tablo({ baslik: "Termal kamera", sinif: "a-tablo-olcum", sutunlar: CIHAZ.slice(0, 3), kayitlar: [tk] }) + "</div>"
        : '<p class="a-bos-satir a-bolum-serit">Zimmetinizde kalibrasyonu geçerli termal kamera yok.</p>');
  }
  var metodHtml = function (r, oku) { return tekSecim("r-metod", "Ölçüm metodu", r.metod, r.F.metot.map(function (m) { return [m, m]; }), oku, true); };
  /* topraklama ölçüm noktası: Ia = eğri çarpanı × In, Zs = 230 V / Ia, Ik1 = 230 V / Zx, uygunluk notu formata göre (MV.noktaHesap) */
  var notRozet = function (h) { return h.not === null ? '<span class="a-deger-yok">—</span>' : rozet({ ad: "Not-" + h.not + (h.agir ? " · ağır" : ""), rozet: h.agir ? "a-rozet-red" : "a-rozet-tamam" }); };
  var rcdRozet = function (s) { return s === null ? '<span class="a-deger-yok">—</span>' : rozet(s ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Yetersiz · ağır", rozet: "a-rozet-red" }); };
  function olcumHtml(r, oku) {
    var F = r.F, n = F.bolumler.kontrol;
    var kaldir = function (eylem, i, ad) { return oku ? "" : '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="' + eylem + '" data-i="' + i + '" aria-label="' + kacis(ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>"; };
    var ki = function (etiket) { return '<span class="a-kart-etiket">' + etiket + "</span>"; };
    var NOKTA = [
      { k: "ad", baslik: "Ölçüm noktası", kart: "ust", sira: 1, hucre: function (x) { return kacis(x.ad) + '<span class="a-alt-satir">' + x.egri + x.In + (x.rcd ? " · RCD " + x.rcd + " mA" : "") + "</span>"; } },
      { k: "zx", baslik: "Zx (Ω)", kart: "govde", sira: 2, hucre: function (x) { var i = r.nokta.indexOf(x);
        return ki("Zx (Ω)") + (oku ? (kacis(x.zx) || "-") : MK.girdi({ id: "r-zx" + i, alan: "zx" + i, deger: x.zx, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="6" aria-label="' + kacis(x.ad) + ' · Zx (Ω)"' })); } },
      { k: "zs", baslik: "Ia · Zs sınır", kart: "govde", sira: 3, hucre: function (x) { var h = MV.noktaHesap(x); return ki("Ia · Zs sınır") + h.ia + " A · " + virgul(h.zs) + " Ω"; } },
      { k: "ik", baslik: "Ik1", kart: "govde", sira: 4, hucre: function (x) { var h = MV.noktaHesap(x); return ki("Ik1") + '<span id="r-ik' + r.nokta.indexOf(x) + '">' + (h.ik ? h.ik + " A" : "—") + "</span>"; } },
      { k: "not", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return '<span id="r-not' + r.nokta.indexOf(x) + '">' + notRozet(MV.noktaHesap(x)) + "</span>"; } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) { return kaldir("nokta-kaldir", r.nokta.indexOf(x), x.ad); } }]);
    var RCD = [
      { k: "ad", baslik: "Pano", kart: "ust", sira: 1, hucre: function (x) { return kacis(x.ad) + '<span class="a-alt-satir">Tip ' + x.tip + " · " + x.In + " A · IΔn " + x.idn + " mA</span>"; } },
      { k: "id", baslik: "IΔ (mA)", kart: "govde", sira: 2, hucre: function (x) { var i = r.rcdler.indexOf(x);
        return ki("IΔ (mA)") + (oku ? (kacis(x.id) || "-") : MK.girdi({ id: "r-ri" + i, alan: "ri" + i, deger: x.id, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · IΔ (mA)"' })); } },
      { k: "td", baslik: "TΔ (ms)", kart: "govde", sira: 3, hucre: function (x) { var i = r.rcdler.indexOf(x);
        return ki("TΔ (ms)") + (oku ? (kacis(x.td) || "-") : MK.girdi({ id: "r-rt" + i, alan: "rt" + i, deger: x.td, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · TΔ (ms)"' })); } },
      { k: "not", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return '<span id="r-rs' + r.rcdler.indexOf(x) + '">' + rcdRozet(rcdSonuc(x)) + "</span>"; } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) { return kaldir("rcd-kaldir", r.rcdler.indexOf(x), x.ad); } }]);
    return metodHtml(r, oku) +
      '<h3 class="a-kriter-grup">' + n + ".1 · Çevrim empedansı ölçümleri</h3>" +
      (r.nokta.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Çevrim empedansı ölçümleri", sinif: "a-tablo-nokta", sutunlar: NOKTA, kayitlar: r.nokta }) + "</div>" : '<p class="a-bos-satir">Ölçüm noktası yok.</p>') +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "nokta-ekle", ad: "Nokta ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>") +
      '<h3 class="a-kriter-grup">' + n + ".2 · RCD testleri</h3>" +
      (r.rcdler.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "RCD testleri", sinif: "a-tablo-rcd", sutunlar: RCD, kayitlar: r.rcdler }) + "</div>" : '<p class="a-bos-satir">RCD yok.</p>') +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "rcd-ekle", ad: "RCD ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>");
  }
  /* kusur açıklamaları (formatlı tür): uygun değil maddeler, sınır dışı ölçümler, uygunsuz ölçüm noktaları ve RCD'ler tek listede */
  function kusurListe(r) {
    var l = [], F = r.F, t = r.t, kr = MV.kriterler(t);
    r.kriter.forEach(function (x, i) { if (x.c === "uygundegil") l.push([kriterNo(t, i) + " · " + kr[i], ad2(DERECE, x.derece) || "Derece seçilmedi", x.not || "Açıklama yazılmadı"]); });
    MV.testler(t).forEach(function (x, i) { if (testSonuc(x, r.test[i]) === false) l.push([x.ad, "Ağır kusur", r.test[i] + " " + x.birim + " · sınır " + MV.sinirYaz(x)]); });
    r.nokta.forEach(function (x) { var h = MV.noktaHesap(x); if (h.agir) l.push([x.ad, "Ağır kusur", "Not-" + h.not + ": " + F.notlar[h.not - 1]]); });
    r.rcdler.forEach(function (x) { if (rcdSonuc(x) === false) l.push([x.ad + " · RCD", "Ağır kusur", "RCD performans testi yetersiz (IΔ " + x.id + " mA · TΔ " + x.td + " ms)."]); });
    return l;
  }
  function kusurHtml(r) {
    var l = kusurListe(r);
    return (l.length ? '<ol class="a-kusur-liste">' + l.map(function (x) { return "<li><b>" + kacis(x[0]) + "</b> · " + kacis(x[1]) + '<span class="a-alt-satir">' + kacis(x[2]) + "</span></li>"; }).join("") + "</ol>"
        : '<p class="a-bos-satir">Kusur yok.</p>') +
      (r.F.agirKusur ? '<details class="a-format-liste"><summary>Ağır kusur sayılan durumlar</summary><ul>' + r.F.agirKusur.map(function (x) { return "<li>" + kacis(x) + "</li>"; }).join("") + "</ul></details>" : "");
  }
  function ciz(odak) {
    var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1], r = kod ? rapor(kod) : null;
    if (!r) {
      $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu ekipman için açılmış rapor yok. Rapor, plan içinde ekipmanın satırındaki “Rapor oluştur” ile açılır.",
          eylem: '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/plan/1") + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Plana dön</a>" });
      document.title = "Rapor bulunamadı · probata maket"; return;
    }
    var t = r.t, e = r.e, oku = r.durum !== "taslak", F = r.F;
    var PL = r.ts, p = MV.kisi(r.kisi), yon = MV.kisi(YON[t.b]), isg = MV.isgTesis(PL.id).filter(function (x) { return x.k === r.kisi; })[0], ci = cihazlar(r);
    var gecti = gecmis(r), eksik = eksikTur(r), mus = MV.musteri(PL.m);
    var cevaplanan = r.kriter.filter(function (x) { return x.c; }).length;
    var CIHAZ_SATIR = [
      { k: "tur", baslik: "Gerekli cihaz", kart: "ust", sira: 1, hucre: function (x) { return "<b>" + kacis(MV.cihazTuru(x.c).ad) + "</b>"; } },
      { k: "ad", baslik: "Cihaz", kart: "govde", sira: 2, hucre: function (x) {
        return '<span class="a-kart-etiket">Cihaz</span>' + (x.v ? '<span class="a-kod">' + x.v.env + "</span> · " + kacis(x.v.marka + " " + x.v.model) : oku ? '<span class="a-deger-yok">—</span>'
          : MK.tus({ eylem: "cihaz-ekle-ac", ad: "Cihaz ekle", ikon: "plus", sinif: "a-tus-ikincil", veri: { tur: x.c } })); } },
      { k: "no", baslik: "Cihaz no", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Cihaz no</span>' + (x.v ? '<span class="a-kod">' + x.v.seri + "</span>" : '<span class="a-deger-yok">—</span>'); } },
      { k: "kal", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 4, hucre: function (x) {
        if (!x.v) return '<span class="a-kart-etiket">Kalibrasyon tarihi</span><span class="a-deger-yok">—</span>';
        return '<span class="a-kart-etiket">Kalibrasyon tarihi</span>' + (MV.kalDurum(x.v) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(x.v.kal[0].tarih) + " · geçmiş</span>" : MK.tarihYaz(x.v.kal[0].tarih)); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
      return x.v ? '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="cihaz-kaldir" data-id="' + x.v.id + '" aria-label="' + kacis(x.v.ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>" : ""; } }]);
    var CIHAZ = [
      { k: "ad", baslik: "Cihaz", kart: "ust", sira: 1, hucre: function (v) { return kacis(v.ad); } },
      { k: "no", baslik: "Cihaz no", kart: "govde", sira: 2, hucre: function (v) { return '<span class="a-kart-etiket">Cihaz no</span><span class="a-kod">' + v.seri + "</span>"; } },
      { k: "kal", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 3, hucre: function (v) {
        return '<span class="a-kart-etiket">Kalibrasyon tarihi</span>' + (MV.kalDurum(v) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(v.kal[0].tarih) + "</span>" : MK.tarihYaz(v.kal[0].tarih)); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (v) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="cihaz-kaldir" data-id="' + v.id + '" aria-label="' + kacis(v.ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>"; } }]);
    /* bölüm numarası: formatlı türde formattaki sıra (iç tesisat 1–11, topraklama 1–9), ötekinde firmanın sabit sırası */
    var el = elektrik(t), no = function (k, v) { return F ? F.bolumler[k] : v; }, S = {};
    /* 1 · FİRMA BİLGİLERİ: türün rapor formatından bağımsız, her raporda aynı (reisim 2026-09-26); 2026-09-27 örnek ekranla: etiket solda,
       değer ya da alan sağda, satır satır; kontrol tarihleri de burada (ayrı "Kontrol bilgileri" bölümü kalktı). Kayıttan gelen değerler
       (firma, e-posta, adres, SGK DETSİS no, İSG-KATİP ID, rapor no) raporda değişmez (160); telefon ve ekipman bölümü elle. */
    /* 2026-09-27 (reisim): firma adı, e-posta, telefon, adres, rapor no inspector'da DEĞİŞMEZ — plan açılırken planlamacı girer ya da
       kendiliğinden oluşur; yanlışsa planlamacı Müşteriler'den düzeltir, inspector "Güncelle" ile güncel bilgiyi çeker.
       Formatlı türde kontrol metodu (türden, yalnız standartlar) formattaki gibi bu bölümde: "Periyodik kontrol metodu ve kapsamı". */
    S.firma = bolum(no("firma", 1), "r-b1", "Firma bilgileri", '<dl class="a-satirlar a-satirlar-form">' +
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
        (F ? satir("Periyodik kontrol metodu ve kapsamı", kacis(MV.metotYazi(t))) : "") +
        metinAlan(r, oku, "bolumAd", "Ekipman bölümü", 60) + "</dl>",
      oku ? "" : MK.tus({ eylem: "firma-guncelle", ad: "Güncelle", ikon: "refresh-cw", sinif: "a-tus-ikincil a-bolum-tus" }));
    /* 2 · EKİPMAN BİLGİLERİ elle girilir (reisim 2026-09-27: "otomatik girili gibi gözüküyor o kısım elle girilecek"); daha önce kontrol
       edilmiş ekipmanda son raporun değerleri başlangıç olarak gelir, değiştirilebilir; kod ve tür plandan. Formatlı türde alanlar formattan
       (2.1 ekipman detayları · 2.2 tespitler); marka, model, seri no formatta yok. */
    S.ekipman = bolum(no("ekipman", 2), "r-b2", "Ekipman bilgileri", F ? ekipmanFormat(r, oku) : '<dl class="a-satirlar a-satirlar-form">' +
        satir("Kod", '<span class="a-kod">' + e.kod + "</span>") + satir("Ekipman türü", kacis(t.ad)) +
        /* 2026-09-27 (reisim: "metod kısmı olsun ama sadece ekipman türü eklerken belirlene"): raporda seçilmez, türden okunur */
        satir("Kontrol metodu", kacis(MV.metotYazi(t))) +
        metinAlan(r, oku, "marka", "Marka", 40) + metinAlan(r, oku, "model", "Model", 40) + metinAlan(r, oku, "seri", "Seri no", 30) +
        metinAlan(r, oku, "imal", "İmal yılı", 4, ' inputmode="numeric"') + metinAlan(r, oku, "konum", "Kullanım yeri", 60) + metinAlan(r, oku, "amac", "Kullanım amacı", 120) +
        satir("Önceki kontrol", e.onceki ? MK.tarihYaz(e.onceki.tarih) + " · " + kacis(e.onceki.sonuc) + ' · <span class="a-rapor-no">' + e.onceki.rapor + "</span>" : "İlk kontrol") + "</dl>");
    S.termal = F && F.bolumler.termal ? bolum(F.bolumler.termal, "r-bt", "Termal kamera bilgileri", termalHtml(r, oku, CIHAZ)) : "";
    /* ÖLÇÜM CİHAZLARI (reisim 2026-09-28: "hangi cihaz kullanılacaksa o sabit yazsın, onun hizasında bilgileri … cihaz yoksa cihaz ekle
       tuşu olsun, kaldırınca komple satır silinmesin … sadece ilgili satırdaki cihaz"): türün her gerekli cihazı sabit bir satır; eklenen
       cihaz hizasında, eklenmemişse o satırda "Cihaz ekle" (pencerede yalnız o türden, zimmetteki geçerli cihazlar); kaldırınca satır kalır.
       Eksik ya da kalibrasyonu geçmiş cihazla rapor gönderilemez (tek engel). */
    S.cihaz = bolum(no("cihaz", 3), "r-b3", "Ölçüm cihazları", '<div class="a-liste-kap">' +
      MK.tablo({ baslik: "Ölçüm cihazları", sinif: "a-tablo-olcum a-tablo-gerekli", sutunlar: CIHAZ_SATIR, kayitlar: cihazSatirlari(r) }) + "</div>");
    S.tanim = F && F.tanimlar ? bolum(F.bolumler.tanim, "r-bd", "Test değerleri tanımları", '<dl class="a-satirlar">' +
      F.tanimlar.map(function (x) { return satir('<span class="a-kod">' + kacis(x[0]) + "</span>", kacis(x[1])); }).join("") + "</dl>") : "";
    /* muayene kriterleri: solda kriter, sağda seçim — Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26); formatlı türde formattaki
       gruplarla (iç tesisat: gözle kontrol, 7 grup) */
    var gr = MV.kriterGruplari(t), i0 = 0;
    S.kriter = !r.kriter.length ? "" : bolum(no("kontrol", 4), "r-b4", F ? "Gözle kontrol kriterleri" : "Muayene kriterleri",
      (gr ? gr.map(function (g, gi) {
        var h = '<h3 class="a-kriter-grup">' + F.bolumler.kontrol + "." + (gi + 1) + " · " + kacis(g[0]) + "</h3>" + g[1].map(function (x, j) { return kriterHtml(r, oku, i0 + j); }).join("");
        i0 += g[1].length; return h; }).join("") : r.kriter.map(function (x, i) { return kriterHtml(r, oku, i); }).join("")),
      '<span class="a-sayac" id="r-kriter-say"><b>' + cevaplanan + "</b> / " + r.kriter.length + " madde</span>");
    var testlerHtml = '<div class="a-form">' + MV.testler(t).map(function (x, i) {
      var s = testSonuc(x, r.test[i]);
      return MK.alan({ id: "r-t" + i, etiket: kacis(x.ad) + " (" + x.birim + ")", zorunlu: !oku, sonuc: '<span id="r-t' + i + '-sonuc">' + testIpucu(x, r.test[i]) + "</span>", hata: "",
        girdi: MK.girdi({ id: "r-t" + i, alan: "t" + i, deger: r.test[i], sinif: "a-girdi-sicil" + (oku ? " a-girdi-oku" : ""), ek: ' inputmode="decimal" maxlength="10"' + (oku ? " readonly" : "") + (s === false ? ' aria-invalid="true"' : "") }) });
    }).join("") + "</div>";
    S.test = !F ? bolum(5, "r-b5", "Test değerleri", testlerHtml)
      : F.gozle ? bolum(F.bolumler.fonksiyon, "r-b5", "Fonksiyon kontrol kriterleri ve testler", metodHtml(r, oku) + testlerHtml)
      : bolum(F.bolumler.kontrol, "r-b5", "Kontrol ve ölçümler", olcumHtml(r, oku));
    S.sigorta = sigortali(r) ? bolum(F ? F.bolumler.fonksiyon + ".4" : 6, "r-b6", F ? "Pano linye ve sigortaları" : "Pano sigortaları", sigortaHtml(r, oku)) : "";
    S.kusur = F ? bolum(F.bolumler.kusur, "r-bk", "Kusur açıklamaları", kusurHtml(r)) : "";
    /* fotoğraflar, sonuç ve yorum her raporda (reisim 2026-09-27); topraklama formatında fotoğraf bölümü yok → ek */
    S.foto = bolum(F ? F.bolumler.foto || "Ek" : el ? 7 : 6, "r-b7", "Fotoğraflar", '<div class="a-fotolar">' + fotolar(r.foto, r.fotoAd) + (oku ? "" : fotoMenu("foto-ekle")) + "</div>");
    /* sonuç ve kanaat muayene kriterleri gibi seçmeli: Uygun · Uygun değil; seçilmezse gönderilince kriterlere göre konur (reisim 2026-09-27);
       uygun değil madde varken "Uygun" uyarıdır, engel değil. Formatlı türde formatın sonuç cümlesi üstte. */
    S.sonuc = bolum(F ? F.bolumler.sonuc : el ? 8 : 7, "r-b8", "Sonuç ve kanaat", (F ? '<p class="a-format-metin">' + kacis(F.sonuc) + " …</p>" : "") +
      '<div class="a-kriter a-kriter-sonuc"><p class="a-kriter-ad" id="r-sonuc-ad"><span>Sonuç ve kanaat</span></p>' +
      '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-sonuc", ad2(SONUC, r.sonuc)) : MK.secim({ id: "r-sonuc", ad: "Sonuç ve kanaat", deger: r.sonuc, secenekler: SONUC, ipucu: "Seçin", tanim: "r-sonuc-ad" })) + "</div>" +
      (!oku && uygunDegil(r) && r.sonuc === "kullanilir" ? '<p class="a-ipucu a-ipucu-uyari a-kriter-uyari">Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”.</p>' : "") + "</div>");
    S.not = bolum(F ? F.bolumler.not : el ? 9 : 8, "r-b9", F ? "Notlar" : "Muayene uzmanı yorumu",
      '<textarea class="a-alan a-alan-ince" id="r-notlar" data-alan="notlar" maxlength="500" aria-label="' + (F ? "Notlar" : "Muayene uzmanı yorumu") + '"' + (oku ? " readonly" : "") + ">" + kacis(r.notlar) + "</textarea>" +
      (F && F.notlar ? '<details class="a-format-liste"><summary>Uygunluk notları (Not-1 … Not-' + F.notlar.length + ")</summary><ol>" + F.notlar.map(function (x) { return "<li>" + kacis(x) + "</li>"; }).join("") + "</ol></details>" : ""));
    /* yetkili kişi: raporu yazan inspector'ın personel kaydından (değişmez); imza son imzada */
    S.yetkili = F ? bolum(F.bolumler.yetkili, "r-by", "Yetkili kişi", '<dl class="a-satirlar">' + satir("Ad soyad", kacis(p.ad)) + satir("Meslek", kacis(MV.meslekAd(p))) +
      satir("Yetkili kişi kayıt no", '<span class="a-kod">' + p.ekipnet + "</span>") + satir("Nüsha sayısı", String(MV.FIRMA.nusha)) + "</dl>") : "";
    var SIRA = !F ? ["firma", "ekipman", "cihaz", "kriter", "test", "sigorta", "foto", "sonuc", "not"]
      : F.gozle ? ["firma", "ekipman", "termal", "cihaz", "kriter", "test", "sigorta", "kusur", "foto", "not", "sonuc", "yetkili"]
      : ["firma", "ekipman", "cihaz", "tanim", "test", "kusur", "not", "sonuc", "yetkili", "foto"];
    $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], [PL.plan || PL.ad, PL.pid ? MK.adres(13, "#/plan/" + PL.pid) : MK.adres(13, "#/")], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + e.kod + " · " + kacis(t.ad) + "</h1>" + rozet(DURUM[r.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + (F ? '<span class="a-kod">' + t.format + "</span> · " : "") + kacis(PL.ad) + " · " + kacis(MV.musteri(PL.m).kisa) + " · " + kacis(p.ad) + "</span></p></div></div>" +
      '<div class="a-uyari-serit">' +
        (r.geri && !oku ? MK.serit("uyari", "undo-2", "<b>Geri gönderildi</b> · " + kacis(MV.kisi(r.geri.kim).ad) + " · " + MK.zamanYaz(r.geri.zaman) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (oku ? MK.serit("bilgi", "lock", r.durum === "onayda" ? "Teknik yönetici onayında · " + kacis(yon.ad) + (r.gonderildi ? " · " + MK.zamanYaz(r.gonderildi) : "") : "Muayene uzmanı onayı · imza bekleniyor") : "") +
      "</div>" +
      (r.geriler.length ? bolum("", "r-geri", "Geri gönderme geçmişi", '<ol class="a-gecmis">' + r.geriler.map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + MK.zamanYaz(g.zaman) + '</span><span class="a-gecmis-ne"><b>' + kacis(MV.kisi(g.kim).ad) + "</b> · " + kacis(g.gerekce) + "</span></li>"; }).join("") + "</ol>",
        '<span class="a-sayac"><b>' + r.geriler.length + "</b> kez</span>") : "") +
      '<div class="a-rapor-bolumler">' + SIRA.map(function (k) { return S[k]; }).join("") + "</div>" +
      /* Kaydet + Onaya gönder: sayfa kaysa da görünür, altta yapışkan (reisim 2026-09-27: "ekranda sabit ekran kaysa da gözükecek şekilde,
         kaydet gönder diye iki tuş olsun") */
      (oku ? "" : '<div class="a-form-eylem a-rapor-eylem"><p class="a-adim-not" id="r-kayit">' + kayitMetin(r) + "</p>" +
        MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "onaya-gonder", ad: "Onaya gönder", ikon: "send", kapali: engelli(r), sebepId: "r-b3-b" }) + "</div>");
    document.title = e.kod + " · " + r.no + " · probata maket";
    if (odak) { var fo = $(odak); if (fo) fo.focus(); }
  }
  function testIpucu(x, v) {
    var s = testSonuc(x, v);
    return s === null ? "Sınır " + MV.sinirYaz(x) : s ? "Uygun · sınır " + MV.sinirYaz(x) : "Sınır dışı · " + MV.sinirYaz(x);
  }
  var kayitMetin = function (r) { return r.degisti ? "Kaydedilmemiş değişiklik var" : r.kayit ? "Son kayıt " + MK.zamanYaz(r.kayit) : "Henüz kaydedilmedi"; };
  var fotolar = MK.fotolar;
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
    } else if (W.tur === "nokta" || W.tur === "rcd") {   /* topraklama: ölçüm noktası ya da RCD ekle (ZPKR01 5.1 · 5.2) */
      var nk = W.tur === "nokta";
      $("a-pencere-baslik").textContent = nk ? "Ölçüm noktası ekle" : "RCD ekle";
      $("a-pencere-govde").innerHTML = '<div class="a-form">' +
        MK.alan({ id: "w-ad", etiket: nk ? "Ölçüm noktası" : "Pano", zorunlu: true, hata: h.ad, girdi: MK.girdi({ id: "w-ad", alan: "ad", deger: d.ad, ek: ' maxlength="60"', hata: h.ad }) }) +
        (nk ? MK.alan({ id: "w-egri", etiket: "Açma eğrisi", zorunlu: true, hata: h.egri, girdi: MK.secim({ id: "w-egri", ad: "Açma eğrisi", deger: d.egri, secenekler: [["B", "B"], ["C", "C"], ["D", "D"]], ipucu: "Seçin", gecersiz: !!h.egri, tanim: "w-egri-ipucu" }) })
          : MK.alan({ id: "w-tip", etiket: "RCD tipi", zorunlu: true, hata: h.tip, girdi: MK.secim({ id: "w-tip", ad: "RCD tipi", deger: d.tip, secenekler: [["AC", "AC"], ["A", "A"], ["F", "F"], ["B", "B"]], ipucu: "Seçin", gecersiz: !!h.tip, tanim: "w-tip-ipucu" }) })) +
        MK.alan({ id: "w-In", etiket: "Anma akımı In (A)", zorunlu: true, hata: h.In, girdi: MK.girdi({ id: "w-In", alan: "In", deger: d.In, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"', hata: h.In }) }) +
        (nk ? MK.alan({ id: "w-rcd", etiket: "RCD (mA)", girdi: MK.girdi({ id: "w-rcd", alan: "rcd", deger: d.rcd, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"' }) }) +
            MK.alan({ id: "w-priz", etiket: "Priz devresi", zorunlu: true, girdi: MK.secim({ id: "w-priz", ad: "Priz devresi", deger: d.priz, secenekler: [["evet", "Evet"], ["hayir", "Hayır"]], tanim: "w-priz-ipucu" }) })
          : MK.alan({ id: "w-idn", etiket: "IΔn (mA)", zorunlu: true, girdi: MK.secim({ id: "w-idn", ad: "IΔn", deger: d.idn, secenekler: [["30", "30"], ["100", "100"], ["300", "300"], ["500", "500"]], tanim: "w-idn-ipucu" }) })) +
        "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Ekle", ikon: "plus" });
    } else if (W.tur === "cihaz") {
      /* yalnız o satırın cihaz türünden, inspector'ın zimmetindeki kalibrasyonu geçerli cihazlar; yoksa söylenir (reisim 2026-09-28) */
      var ct = MV.cihazTuru(W.c), l = MV.eklenebilirCihazlar(W.r.kisi, [W.c]);
      $("a-pencere-baslik").textContent = "Cihaz ekle · " + ct.ad;
      $("a-pencere-govde").innerHTML = (h.sec ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", h.sec) + "</div>" : "") +
        (l.length ? '<fieldset class="a-cihaz-grup"><legend class="a-gizli">' + kacis(ct.ad) + "</legend>" + l.map(function (v) {
          return '<label class="a-onay-kutusu"><input type="radio" name="w-cihaz" data-cihaz-sec="' + v.id + '"' + (d.sec.indexOf(v.id) >= 0 ? " checked" : "") + '><span><b>' + kacis(v.ad) + '</b> · <span class="a-kod">' + v.seri +
            "</span> · kalibrasyon " + MK.tarihYaz(v.kal[0].tarih) + "</span></label>"; }).join("") + "</fieldset>"
          : '<p class="a-bos-satir">Zimmetinizde kalibrasyonu geçerli ' + kacis(ct.ad.toLocaleLowerCase("tr")) + " yok.</p>");
      $("a-pencere-alt").innerHTML = l.length ? MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "cihaz-ekle", ad: "Ekle", ikon: "plus" })
        : MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
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
    else if (o.tur === "nokta" || o.tur === "rcd") $("w-ad").focus();
    else $(o.x ? "w-tip" : "w-no").focus();
  }
  function pencereKaydet() {
    var d = W.d, h = {}, r = W.r;
    if (W.tur === "nokta" || W.tur === "rcd") {
      var nk = W.tur === "nokta";
      if (!d.ad.trim()) h.ad = "Adı yazılmalı.";
      if (nk && !d.egri) h.egri = "Eğri seçilmeli.";
      if (!nk && !d.tip) h.tip = "Tip seçilmeli.";
      if (!/^\d{1,4}$/.test(d.In.trim())) h.In = "Amper, tam sayı.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      if (nk) r.nokta.push({ ad: d.ad.trim(), egri: d.egri, In: +d.In, zx: "", rcd: d.rcd.trim(), priz: d.priz === "evet" });
      else r.rcdler.push({ ad: d.ad.trim(), tip: d.tip, In: +d.In, idn: +d.idn, id: "", td: "" });
      $("a-pencere").close(); degisti(r); ciz(nk ? "r-zx" + (r.nokta.length - 1) : "r-ri" + (r.rcdler.length - 1));
      MK.bildir((nk ? "Ölçüm noktası" : "RCD") + " eklendi: " + d.ad.trim() + "."); return;
    }
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
    var m = e.target.closest && e.target.closest("[data-coklu]");
    if (m) {   /* formattaki çoklu seçim (doğrudan dokunmaya karşı önlemler) */
      var a = m.dataset.coklu.split("|"), r = aktif(), x = r.F[a[0]].filter(function (y) { return y.k === a[1]; })[0], s = x.sec[+a[2]], l = r[a[0]][a[1]] = r[a[0]][a[1]] || [];
      if (m.checked && l.indexOf(s) < 0) l.push(s); if (!m.checked && l.indexOf(s) >= 0) l.splice(l.indexOf(s), 1);
      degisti(r); return;
    }
    var c = e.target.closest && e.target.closest("[data-cihaz-sec]"); if (!c || !W) return;
    if (c.checked) W.d.sec = [c.dataset.cihazSec];   /* satır başına tek cihaz */
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
    else if (/^[ds]-/.test(k)) r[k[0] === "d" ? "detay" : "tespit"][k.slice(2)] = e.target.value;
    else if (/^zx\d+$/.test(k)) {   /* ölçüm noktası: Ik1 ve not yerinde hesaplanır, odak kaçmaz */
      var n = r.nokta[+k.slice(2)], h; n.zx = e.target.value; h = MV.noktaHesap(n);
      $("r-ik" + k.slice(2)).textContent = h.ik ? h.ik + " A" : "—"; $("r-not" + k.slice(2)).innerHTML = notRozet(h);
    } else if (/^r[it]\d+$/.test(k)) {
      var x2 = r.rcdler[+k.slice(2)]; x2[k[1] === "i" ? "id" : "td"] = e.target.value; $("r-rs" + k.slice(2)).innerHTML = rcdRozet(rcdSonuc(x2));
    }
    degisti(r); ozetYenile(r);
  };
  /* yazarken yalnız gönder tuşu güncellenir (odak kaçmaz); eksikler yalnız "Onaya gönder"de pencerede sayılır (reisim 2026-09-26:
     "onaya göndermeden önce 8 eksik vb eksik yazan kısım olmasın") */
  function ozetYenile(r) { var t = document.querySelector('[data-eylem="onaya-gonder"]'); if (t) t.disabled = engelli(r); }
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) { W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return; }
    var r = aktif(); if (/^r-kc\d+$/.test(id)) { r.kriter[+id.slice(4)].c = deger; degisti(r); ciz(id); }
    else if (id === "r-sonuc") { r.sonuc = deger; degisti(r); ciz(id); }
    else if (/^r-kd\d+$/.test(id)) { r.kriter[+id.slice(4)].derece = deger; degisti(r); ciz(id); }
    else if (/^r-[ds]-/.test(id)) { r[id[2] === "d" ? "detay" : "tespit"][id.slice(4)] = deger; degisti(r); ciz(id); }
    else if (id === "r-metod" || id === "r-termal") { r[id.slice(2)] = deger; degisti(r); ciz(id); }
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
  /* kamera: telefonda doğrudan kamera açılır; galeri: birden çok fotoğraf seçilir (2026-09-27, gerçek dosya penceresi) */
  var fotoSec = function (el, ekle) {
    var galeri = el.dataset.kaynak === "galeri";
    MK.dosyaSec({ kabul: "image/*", kamera: !galeri, coklu: galeri, enCokMB: 15, ornek: "foto-" + Date.now() + ".jpg" }, function (ad) { ekle(ad, galeri ? "galeriden" : "kameradan"); });
  };
  X["foto-ekle"] = function (el) {
    fotoSec(el, function (ad, nereden) {
      var r = aktif(); r.foto++; (r.fotoAd = r.fotoAd || [])[r.foto - 1] = ad; degisti(r); ciz(); var t = document.querySelector('#r-b7 [data-secici-ac]'); if (t) t.focus();
      MK.bildir("Fotoğraf " + r.foto + " eklendi (" + nereden + ").");
    });
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
  X["cihaz-ekle-ac"] = function (el) { var r = aktif(); pencereAc({ tur: "cihaz", r: r, c: el.dataset.tur, d: { sec: [] } }); };
  X["cihaz-ekle"] = function () {
    var r = W.r; if (!W.d.sec.length) { W.hata = { sec: "Eklenecek cihazı seçin." }; pencereCiz(); var f = document.querySelector("#a-pencere [data-cihaz-sec]") || document.querySelector('#a-pencere [data-eylem="pencere-kapat"]'); if (f) f.focus(); return; }
    var c = W.c, v = MV.varlik(W.d.sec[0]);
    r.cihaz = r.cihaz.filter(function (id) { return MV.varlik(id).cihazTur !== c; }).concat([v.id]);
    $("a-pencere").close(); degisti(r); ciz("r-b3-b"); MK.bildir(v.ad + " " + v.seri + " eklendi.");
  };
  X["cihaz-kaldir"] = function (el) {
    var r = aktif(), v = MV.varlik(el.dataset.id); r.cihaz = r.cihaz.filter(function (x) { return x !== el.dataset.id; }); degisti(r);
    ciz(); var t = document.querySelector('#r-b3 [data-eylem="cihaz-ekle-ac"][data-tur="' + v.cihazTur + '"]'); if (t) t.focus();
    MK.bildir(v.ad + " rapordan kaldırıldı; satırı boş kaldı.");
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
  X["nokta-ekle"] = function () { pencereAc({ tur: "nokta", r: aktif(), d: { ad: "", egri: "", In: "", rcd: "", priz: "hayir" } }); };
  X["rcd-ekle"] = function () { pencereAc({ tur: "rcd", r: aktif(), d: { ad: "", tip: "", In: "", idn: "30" } }); };
  X["nokta-kaldir"] = function (el) { var r = aktif(), x = r.nokta.splice(+el.dataset.i, 1)[0]; degisti(r); ciz("r-b5-b"); MK.bildir(x.ad + " kaldırıldı."); };
  X["rcd-kaldir"] = function (el) { var r = aktif(), x = r.rcdler.splice(+el.dataset.i, 1)[0]; degisti(r); ciz("r-b5-b"); MK.bildir(x.ad + " RCD'si kaldırıldı."); };
  /* 90 (reisim 2026-09-26): eksik varken de gönderilir — eksikler uyarı penceresinde, "Yine de gönder"; tek engel kalibrasyonu geçmiş cihaz */
  X["onaya-gonder"] = function () {
    var r = aktif(); if (engelli(r)) return;
    var eks = eksikler(r).filter(function (x) { return !x.ok; });
    if (eks.length) { pencereAc({ tur: "gonder", r: r, d: {}, eks: eks }); return; }
    gonder(r);
  };
  X["yine-de-gonder"] = function () { var r = W.r; $("a-pencere").close(); gonder(r); };
  X["kusur-foto"] = function (el) {
    var i = +el.dataset.i;
    fotoSec(el, function (ad, nereden) {
      var r = aktif(), x = r.kriter[i]; x.foto = (x.foto || 0) + 1; (x.fotoAd = x.fotoAd || [])[x.foto - 1] = ad; degisti(r); ciz();
      var t = document.querySelector("#r-k" + i + " [data-secici-ac]"); if (t) t.focus();
      MK.bildir("Madde " + (i + 1) + " için fotoğraf eklendi (" + nereden + ").");
    });
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
