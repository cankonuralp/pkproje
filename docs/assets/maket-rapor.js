/* ══ probata MAKET M8 — Saha ve Rapor (modül 14) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "ekipmandan rapor oluştur deyip … checklistleri doldurup uygunluk belirleyip fotoğraf ekleyip raporu
   teknik yöneticisine onaya gönderecek"), §1.1 ("pano kontrollerinde her sigortanın tek tek elle yazılması … fotoğraftan sigorta bilgileri
   okuma"), §3 (kalibrasyonu geçmiş cihazla rapor açılır ama onaya gönderilemez; fotoğraf en az 1), §9 yirmi dördüncü tur (cihazlar
   türün listesinden, zimmetten eklenir; ekipman bilgileri elle; sonuç seçmeli, seçilmezse kriterlere göre; Kaydet + Onaya gönder hep
   görünür; bölümler her girişte kapalı; fotoğraf kameradan ya da galeriden; firma bilgileri salt okunur, Güncelle ile kayıttan),
   §4.2 (Ek-III 1.7), §4.5 (her kusur ayrı), §9 yirmi üçüncü tur (madde Uygun · Uygun değil · Uygulanamaz; sonuç Uygun · Uygun değil;
   başlangıç ve bitiş el ile; sonraki kontrol kendiliğinden, el ile değişir; bütün başlıklar açılır kapanır), §8.10 (sigorta okuma ÖNERİ; denetçi onaylamadan kaydedilmez). Önce tablet ve telefon.
   Örnekler Planlar'daki plan 1'in (P-0926-031, Merkez Fabrika, denetimde) raporları: aynı numara, aynı durum. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var DURUM = MV.RAPOR_DURUM;   /* reisim 2026-09-26: beş durum, tek kaynak MV (2026-09-28: imzaya gönderilen ve tamamlanan da, salt okunur) */
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
      olustu: k >= 0 ? saatEkle(10 + k * 6) : null, kisi: t.b === "e" ? "ea" : "mk", kriter: kr.map(function () { return { c: "uygun", not: "" }; }), test: ts.map(function () { return ""; }),
      foto: 0, amac: "", sonuc: "", notlar: "", sigorta: null, bas: "", bit: "", sonraki: "", sonrakiEl: false, bitEl: false, takip: "", rtarih: "", rtarihEl: false, bolumAd: "", cihaz: [], kayit: null, degisti: false,
      marka: e.onceki ? e.marka : "", model: e.onceki ? e.model : "", seri: e.onceki ? e.seri : "", imal: e.onceki ? String(e.imal) : "", konum: e.konum, geri: null, geriler: [], pano: false, gonderildi: null };
    /* eklenen ölçüm cihazları: türün her cihaz türünden zimmetteki ilk geçerli cihaz (doldurulmuş ve gönderilmiş raporlarda) */
    var cihazDoldur = function () { r.cihaz = MV.turCihazlari(t).map(function (c) { return MV.eklenebilirCihazlar(r.kisi, [c])[0]; }).filter(Boolean).map(function (v) { return v.id; }); };
    /* Bakanlık formatlı tür (ZPKR01 · ZPKR02, 2026-09-27): ekipman detayları ve tespitler formattan; topraklamada ölçüm noktaları ve RCD
       satırları (noktalar önceki rapordan gelir, Zx her kontrolde yeniden ölçülür) */
    r.sablon = t.sablon || "";   /* raporun açıldığı format sürümü (211) */
    var F = MV.formatYapi(t); r.F = F; r.detay = {}; r.tespit = {}; r.metod = t.olcumMetot || ""; r.nokta = []; r.rcdler = []; r.pd = []; r.zi = [];   /* ölçüm metodu türden (2026-09-28) */
    var ornekBilgi = function () {
      F.detay.forEach(function (x) { r.detay[x.k] = x.ornek; });
      F.tespit.forEach(function (x) { r.tespit[x.k] = Array.isArray(x.ornek) ? x.ornek.slice() : x.ornek; });
    };
    if (F && F.noktalar) {
      r.nokta = F.noktalar.map(function (n) { return { ad: n[0], egri: n[1], In: n[2], zx: "", rcd: n[4], priz: /priz/i.test(n[0]), rcdTip: n[4] ? "A" : "", rcdId: "", rcdTd: "" }; });
      r.rcdler = F.rcd.map(function (x) { return { ad: x[0], tip: x[1], In: x[2], idn: x[3], id: "", td: "", gecikme: x[6] || "", sonPano: x[7] || "" }; });
    }
    /* maddeler Uygun gelir (§3.8 kural 3); termal kamera türün cihazlarında yoksa termal kamera maddeleri uygulanamaz */
    if (F && F.gozle && MV.turCihazlari(t).indexOf("termal") < 0) MV.kriterGruplari(t).reduce(function (i, g) { g[1].forEach(function (x, j) { if (g[0] === "TERMAL KAMERA") r.kriter[i + j].c = "uygulanamaz"; }); return i + g[1].length; }, 0);
    if (F && e.onceki) F.detay.forEach(function (x) { r.detay[x.k] = x.ornek; });   /* önceki raporun ekipman detayları başlangıç, değiştirilebilir */
    var dolu = function () {
      cihazDoldur();
      r.kriter.forEach(function (x) { x.c = "uygun"; });
      r.test = ts.map(function (x) { return x.ornek; }); r.foto = 2; r.amac = "Üretim ve bakım"; r.sonuc = "kullanilir";
      if (F) {
        ornekBilgi();
        r.nokta.forEach(function (n, i) { n.zx = F.noktalar[i][3] || "0,34"; if (n.rcd) { n.rcdId = "22"; n.rcdTd = "25"; } });
        r.rcdler.forEach(function (x, i) { x.id = F.rcd[i][4] || "220"; x.td = F.rcd[i][5] || "180"; });
        if (F.linye) {   /* iç tesisat: 6.1 linye, 6.2 potansiyel dengeleme, 6.3 zemin izolasyonu formatın örnek satırlarıyla (onaylı) */
          r.pano = true; r.sigorta = F.linye.map(function (x) { return Object.assign({}, x, { guven: "yuksek", durum: "onayli" }); });
          r.pd = F.pd.map(function (x) { return Object.assign({}, x); }); r.zi = F.zi.map(function (x) { return Object.assign({}, x); });
        }
      }
    };
    if (r.durum !== "taslak") { dolu(); r.gonderildi = r.olustu ? saatEkle(60 + k * 9) : null; }
    /* otomatik dolu: başlangıç rapor açıldığında, bitiş gönderildiğinde (taslakta şimdi), sonraki kontrol başlangıç + periyot */
    r.bas = r.olustu || r.basladi || MK.simdi(); r.bit = r.gonderildi || MK.simdi(); r.sonraki = sonrakiHesap(r); r.rtarih = r.bas.slice(0, 10);
    r.kayit = r.olustu ? saatEkle(30 + k * 6) : null;
    /* örnek içerik yalnız ekipmanın tohum raporunda; aynı ekipmana sonradan açılan rapor boş başlar (2026-09-28, sınırsız rapor) */
    var tohum = MV.RAPORLAR.filter(function (x) { return x.kod === e.kod && x.plan; })[0];
    if (!tohum || tohum.no === r.no) {
      if (e.kod === "ET-1009") {   /* elektrik iç tesisatı (ZPKR02): yarıda; pano sigortaları okunmadı; denetçinin zimmetinde kalibrasyonu geçmiş cihaz */
        ornekBilgi(); r.tespit = { degisiklik: "Yok", etiket: "Var" };
        [0, 1, 2].forEach(function (i) { r.kriter[i].c = i === 2 ? "uygundegil" : "uygun"; });
        r.kriter[2].foto = 1; r.kriter[2].derece = "hafif";
        r.test[0] = "0,21"; r.foto = 1; r.amac = "Aydınlatma, priz ve makine besleme devreleri";
        r.cihaz = ["v1", "v2", "v3"];   /* v3 = tesisat test cihazı OC-003, kalibrasyonu 18.09.2026'da geçti; zimmette geçerli başkası yok */
      }
      if (e.kod === "AT-1010") {   /* AG topraklama (ZPKR01): ölçümler yarıda; kapı motoru hattında Zx sınırı aşıyor, RCD yok → Not-2, ağır kusur */
        ornekBilgi(); cihazDoldur();
        [0, 1, 2, 3, 4].forEach(function (i) { r.nokta[i].zx = F.noktalar[i][3]; }); r.nokta[1].rcdId = "22"; r.nokta[1].rcdTd = "25";
        r.nokta.push({ ad: "Kapı motoru — sevkiyat", egri: "C", In: 10, zx: "2,6", rcd: "", priz: false });
        r.rcdler[0].id = F.rcd[0][4]; r.rcdler[0].td = F.rcd[0][5];
        [1, 1, 1, 1, 4].forEach(function (v, i) { r.nokta[i].not = v; }); r.nokta[6].not = 2; r.rcdler[0].not = 1;   /* seçilmiş notlar (P2); Ofis prizleri yarıda */
      }
      /* plan 10 (2026-09-28; reisim: "en son attığım rapor formatına göre sonuç o şekilde gözükecek biçimde örnekler"): son formatlarla —
         ET-2001 Tamamlandı · Uygun · ET-2002 hafif kusur (formatın maddesi) · AT-2003 ağır kusur (Zx sınırı aşıyor, RCD yok → Not-2) ·
         ET-2004 yarıda · AT-2005 ilk kontrol, boş */
      if (e.kod === "ET-2002") { var ok = MV.ornekKusur(t, true), x = r.kriter[ok.i]; x.c = "uygundegil"; x.derece = "hafif"; x.foto = 1; r.sonuc = "kullanilamaz"; }
      if (e.kod === "AT-2003") { r.nokta.push({ ad: "Kapı motoru — sevkiyat", egri: "C", In: 10, zx: "2,6", rcd: "", priz: false, not: 2 }); r.sonuc = "kullanilamaz"; r.notlar = "Kapı motoru hattına 30 mA RCD takılması ya da koruma değerinin düşürülmesi önerilir."; }
      if (e.kod === "ET-2004") {
        ornekBilgi(); r.tespit = { degisiklik: "Yok", etiket: "Var" }; cihazDoldur();
        [0, 1, 2, 3, 4].forEach(function (i) { r.kriter[i].c = "uygun"; }); r.test[0] = "0,19"; r.test[1] = "0,17"; r.foto = 1;
      }
      if (e.kod === "AT-2005") cihazDoldur();
      if (e.kod === "KP-1004") dolu();   /* onaya hazır */
      /* 211 (2026-09-30): eski format sürümüyle açılmış rapor — o sürümde son madde yoktu; "Formatı güncelle" örneği */
      if (e.kod === "TP-1005") { r.sablon = "v1 · 01.06.2025"; r.kriter.pop(); }
      if (e.kod === "ZV-1007") {   /* branş yöneticisi geri gönderdi: test değerleri eksik */
        dolu(); r.test = ts.map(function () { return ""; }); r.foto = 1;
        r.geri = { kim: "sy", zaman: "2026-09-23T15:10", gerekce: "Yük deneyi değerleri yazılmamış: dinamik ve statik deney yüklerini girin." };
      }
    }
    return r;
  }
  /* SAYFALAR ARASI KALICI (2026-09-28, Kalem M): raporda yazılan her şey tarayıcıda saklanır (MK.kalici, numara başına); durum, geri
     gönderme ve gönderiliş ortak kayıttan (MV.RAPORLAR — Onaylar ve Raporlar aynı kaydı değiştirir) */
  var KAYIT = {}, YERLI = ["e", "t", "ts", "F"];
  var duz = function (r) { var o = {}; Object.keys(r).forEach(function (k) { if (YERLI.indexOf(k) < 0) o[k] = r[k]; }); return JSON.parse(JSON.stringify(o)); };
  MK.kalici("raporlar", function () { Object.keys(R).forEach(function (k) { if (R[k]) KAYIT[R[k].no] = duz(R[k]); }); return KAYIT; }, function (d) { KAYIT = d || {}; });
  /* bir ekipmanın birden çok raporu olabilir (2026-09-28: "Rapor oluştur" sınırsız): rapor numarası adreste (?no=) — önbellek kod + numara */
  function rapor(kod) {
    var e = MV.ekipman(kod), k = PLAN_EKP.indexOf(e), q = sorgu();
    if (!e) return null;
    if (k >= 0 && k < 10 && q.no && q.no !== MV.raporNo("0926", 786 + k)) k = -1;   /* aynı ekipmanın sonradan açılan raporu */
    if (k < 0 || k >= 10) { if (!q.no) return null; k = -1; }   /* Planlar'dan gelen öteki raporlar: numara ve durum adresten */
    var an = kod + "|" + (k >= 0 ? MV.raporNo("0926", 786 + k) : q.no);
    if (R[an]) return R[an];
    var r = raporKur(e, k, q), kay = MV.rapor(r.no);
    if (KAYIT[r.no]) Object.assign(r, KAYIT[r.no]);   /* bu tarayıcıda yazılanlar */
    if (kay) {   /* ortak kayıt: açılış ve gönderiliş zamanı, durum, geri gönderme (2026-09-28) */
      if (!KAYIT[r.no]) { r.olustu = kay.olustu; r.bas = kay.olustu; r.rtarih = kay.olustu.slice(0, 10); r.sonraki = sonrakiHesap(r); r.kayit = kay.olustu; }
      if (kay.gonderildi) { r.gonderildi = kay.gonderildi; if (!r.bitEl) r.bit = kay.gonderildi; }
      r.durum = kay.durum === "geri" ? "taslak" : DURUM[kay.durum] ? kay.durum : r.durum;
      if (r.durum === "taslak") { r.gonderildi = kay.gonderildi || null; if (kay.geri) r.geri = kay.geri; }
    }
    return (R[an] = r);
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
  var testSonuc = function (x, v) { if (!x.op) return null; var n = sayi(v); return isNaN(n) ? null : x.op === "<=" ? n <= x.sinir : n >= x.sinir; };
  var testDolu = function (x, v) { return x.metin ? !!String(v || "").trim() : !isNaN(sayi(v)); };
  /* madde sonucu Uygun · Uygun değil · Uygulanamaz (reisim 2026-09-26); "sınır dışı" test değeri de uygun değil sayılır */
  var KRITER = [["uygun", "Uygun"], ["uygundegil", "Uygun değil"], ["uygulanamaz", "Uygulanamaz"]];
  var kusurlar = function (r) { return r.kriter.filter(function (x) { return x.c === "uygundegil"; }); };
  var sinirDisi = function (r) { return MV.testler(r.t).some(function (x, i) { return testSonuc(x, r.test[i]) === false; }); };
  /* topraklama (ZPKR01) 5.1 · 5.2 sonucu: denetçinin seçtiği uygunluk notu (P2, 2026-09-30, reisim: "uygun uygunsuz olayınıda kaldıralım, onun
     yerine yan sekmede not1, not 2 not 3 diye 11 e kadar seçene olsun bakanlık formatını bozmayalım"). Otomatik Uygun / Yetersiz yok; notun
     anlamı formatın metninden: "Uygun." ya da "…uygundur." → kusur değil, "(Ağır kusur)" → ağır, öteki → kusur */
  var rcdSonuc = function (x) { return !(isNaN(sayi(x.id)) || isNaN(sayi(x.td))) || null; };   /* yalnız değer girildi mi (zorunlu alan) */
  var NOTLAR = function (r) { return r.F && r.F.notlar ? r.F.notlar.map(function (x, i) { return [String(i + 1), "Not-" + (i + 1)]; }) : []; };
  var notMetin = function (r, n) { return n && r.F && r.F.notlar ? r.F.notlar[n - 1] || "" : ""; };
  var notKusur = function (r, n) { var m = notMetin(r, n); return !!m && !/^Uygun\.|uygundur\.$/.test(m); };
  var notAgir = function (r, n) { return /Ağır kusur/.test(notMetin(r, n)); };
  var olcumKusur = function (r) { return r.nokta.concat(r.rcdler).some(function (x) { return notKusur(r, +x.not); }); };
  /* iç tesisat 6.1 · 6.2 · 6.3 satırları: formatın fonksiyon testi ağır kusur tanımlarıyla (MV.linyeHesap · pdHesap · ziHesap) */
  var ik3 = function (r) { var i = MV.testler(r.t).map(function (x) { return x.k; }).indexOf("ik3"); return i < 0 ? "" : r.test[i]; };
  var linyeSonuc = function (r, x) { return MV.linyeHesap(x, ik3(r)); };
  var noktaRcd = function (n) { return n.rcd ? !(isNaN(sayi(n.rcdId)) || isNaN(sayi(n.rcdTd))) || null : null; };   /* yalnız değer girildi mi (P2) */
  var fonkKusur = function (r) {
    return (r.sigorta || []).some(function (x) { var h = linyeSonuc(r, x); return h && !h.uygun; }) || r.pd.some(function (x) { var h = MV.pdHesap(x); return h && !h.uygun; }) ||
      r.zi.some(function (x) { var h = MV.ziHesap(x); return h && !h.uygun; });
  };
  /* önceki kontrolden devreden hafif kusurlar (V4, 2026-09-29): "Giderilmedi" denen bu raporun hafif kusuru olur */
  var devreden = function (r) { return MV.devredenKusurlar(r.e.kod, r.olustu || MK.simdi()); };
  var devam = function (r) { return devreden(r).filter(function (x) { return (r.devir || {})[x.id] === "devam"; }); };
  var uygunDegil = function (r) { return kusurlar(r).length > 0 || sinirDisi(r) || olcumKusur(r) || fonkKusur(r) || devam(r).length > 0; };
  var elektrik = function (t) { return t.g === "elektrik"; };   /* pano sigortaları bölümü yalnız elektrik grubunda */
  var sigortali = function (r) { return elektrik(r.t) && (!r.F || !!r.F.gozle); };   /* topraklama formatında pano sigortası yok, ölçüm noktaları var */
  /* ZORUNLU ALANLAR (§3.8 kural 5; reisim 2026-09-28: "Gönder derken gelen uyarı ekranı olmasın sadece eğer zorunlu doldurulması gereken yerler
     olmasına rağmen doldurulmadıysa pop-up şekilde zorunlu alanlar doldurulmadı … fotoğraf eklemek her raporda zorunlu"). Temel zorunlular:
     fotoğraf (en az 1), türün ölçüm cihazları (kalibrasyonu geçerli), uygun değil maddenin formatlı türde derecesi (açıklama alanı yok, O2), test ve
     ölçüm değerleri (isteğe bağlı olanlar hariç). Başka format başka zorunluluk getirir (§3.7 satır 13). Zorunlu olmayan eksik gönderimi durdurmaz. */
  /* P1 (2026-09-30, reisim: "fotoğraf olayını kaldıralım topraklama raporunda … bakanlık formatını bozmayalım"): formatında fotoğraf bölümü
     olmayan türde (ZPKR01) fotoğraf bölümü yok, zorunlu da değil; formatsız türde her raporda */
  var fotoVar = function (r) { return !r.F || !!r.F.bolumler.foto; };
  var otoSonuc = function (r) { return uygunDegil(r) ? "kullanilamaz" : "kullanilir"; };
  var SONUC = [["kullanilir", "Uygun"], ["kullanilamaz", "Uygun değil"]];
  var testZorunlu = function (x) { return !x.istege; };
  function zorunluEksik(r) {
    var ts = MV.testler(r.t), F = r.F, l = [];
    if (gecmis(r).length || eksikTur(r).length) l.push({ bolum: "r-b3", alan: "#r-b3 [data-eylem=cihaz-ekle-ac], #r-b3 .a-hata-metin" });
    kusurlar(r).forEach(function (x) { var i = r.kriter.indexOf(x);
      if (MV.kusurSinifli(r.t) && !x.derece) l.push({ bolum: "r-b4", alan: "#r-kd" + i });
      if (MV.kusurFotoZorunlu() && !(x.foto > 0)) l.push({ bolum: "r-b4", alan: "#r-kf" + i }); });
    ts.forEach(function (x, i) { if (testZorunlu(x) && !testDolu(x, r.test[i])) l.push({ bolum: "r-b5", alan: "#r-t" + i }); });
    if (F && F.noktalar) {
      r.nokta.forEach(function (n, i) { if (isNaN(sayi(n.zx))) l.push({ bolum: "r-b5", alan: "#r-zx" + i }); if (n.rcd && noktaRcd(n) === null) l.push({ bolum: "r-b5", alan: "#r-ni" + i });
        if (!n.not) l.push({ bolum: "r-b5", alan: "#r-nn" + i }); });
      r.rcdler.forEach(function (x, i) { if (rcdSonuc(x) === null) l.push({ bolum: "r-b5", alan: "#r-ri" + i }); if (!x.not) l.push({ bolum: "r-b5", alan: "#r-rn" + i }); });
    }
    if (fotoVar(r) && r.foto < 1) l.push({ bolum: "r-b7", alan: "#r-b7 .a-fotolar" });
    return l;
  }

  /* ── ÇİZİM ──────────────────────────────────────────────────────────────────────────────────────────── */
  /* her başlık açılır kapanır (reisim 2026-09-26); rapor her açılışta bütün bölümler KAPALI gelir (reisim 2026-09-27: "rapor açıldığında her
     giriş çıkışta tüm seçenekler kapalı gelsin"); açılan bölüm sayfada kaldıkça yeniden çizimde açık kalır */
  var ACIK = {};
  /* zorunlu alan boşken "Onaya gönder"e basılınca (§3.8 kural 5): UY = işaretlenen rapor, EKS = eksik bölümler (başlıkta "Eksik"), boş zorunlu
     alanlar kırmızı (aria-invalid). Doldurdukça işaret kalkar; gönderilince temizlenir. */
  var UY = null, EKS = {};
  var bolum = function (no, id, baslik, ic, ek) {
    return '<details class="a-form-bolum a-bolum-rapor a-bolum-acilir' + (EKS[id] ? " a-bolum-eksik" : "") + '" id="' + id + '"' + (ACIK[id] ? " open" : "") + '><summary class="a-alt-bas"><h2 class="a-alt-baslik" id="' + id + '-b" tabindex="-1">' +
      (no ? no + " · " : "") + baslik + "</h2>" + (EKS[id] ? rozet({ ad: "Eksik", rozet: "a-rozet-red" }) : "") + (ek || "") + ikon("chevron-down", "a-ikon-kucuk a-acilir-ok") + "</summary>" + ic + "</details>";
  };
  var uyar = function (r, bos) { return UY === r && bos; };
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
    return satir(etiket, oku ? (kacis(r[k]) || "-") : MK.girdi({ id: "r-" + k, alan: k, deger: r[k], ek: ' maxlength="' + en + '"' + (ek || ""),
      hata: false }), oku ? null : "r-" + k);
  };
  /* fotoğraf ekle: kameradan ya da galeriden (reisim 2026-09-27: "fotoğraf çek değil fotoğraf ekle yazsın galeriden de eklenebilsin");
     telefonda uygulama ikisini de sunar, makette küçük menü */
  /* simge: madde satırında yalnız kamera simgesi (2026-09-30, 213); id ve gecersiz zorunlu fotoğraf işaretine */
  var fotoMenu = function (eylem, veri, simge) {
    return '<div class="a-secici a-foto-menu">' + (simge ? '<button class="a-ikon-tus a-kusur-foto-tus" type="button" data-secici-ac="foto" id="' + simge.id + '" aria-haspopup="menu" aria-expanded="false" aria-label="' + simge.ad + '" title="Fotoğraf ekle"' + (simge.gecersiz ? ' aria-invalid="true"' : "") + ">" + ikon("camera") + "</button>"
      : '<button class="a-tus a-tus-ikincil" type="button" data-secici-ac="foto" aria-haspopup="menu" aria-expanded="false">' + ikon("camera", "a-ikon-kucuk") + "Fotoğraf ekle</button>") +
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
  var BILGI = {};   /* açık madde açıklamaları (sayfada kaldıkça) */
  function kriterHtml(r, oku, i) {
    var t = r.t, x = r.kriter[i], ad = MV.kriterler(t)[i], no = kriterNo(t, i), kus = x.c === "uygundegil";
    /* 214 (2026-09-30): madde adının yanında bilgi (i) — açılınca maddede neye bakılacağı ve türün standartları, maddenin altında */
    var bilgiAcik = !!BILGI[r.no + ":" + i];
    return '<div class="a-kriter" id="r-k' + i + '"><p class="a-kriter-ad" id="r-ka' + i + '"><span class="a-kriter-no">' + no + "</span><span>" + kacis(ad) +
      '<button class="a-ikon-tus a-madde-bilgi-tus" type="button" data-eylem="madde-bilgi" data-i="' + i + '" id="r-kb' + i + '" aria-expanded="' + bilgiAcik + '" aria-controls="r-kbi' + i + '" aria-label="Madde ' + no + ' açıklaması" title="Açıklama">' + ikon("info", "a-ikon-kucuk") + "</button></span></p>" +
      /* 2026-09-30 (213): "Uygun değil" maddede satırın içinde fotoğraf simgesi; fotoğraf açıklamasıyla kusur açıklamalarına girer; zorunluluk
         firma ayarı (MV.kusurFotoZorunlu, başlangıçta zorunlu) */
      '<div class="a-kriter-cevap' + (kus && !oku ? " a-kriter-cevap-foto" : "") + '">' + (kus && !oku ? fotoMenu("kusur-foto", ' data-i="' + i + '"', { id: "r-kf" + i, ad: "Madde " + no + " fotoğraf ekle", gecersiz: uyar(r, MV.kusurFotoZorunlu() && !(x.foto > 0)) }) : "") +
        (oku ? okuGirdi("r-kc" + i, ad2(KRITER, x.c)) : MK.secim({ id: "r-kc" + i, ad: "Madde " + no, deger: x.c, secenekler: KRITER, ipucu: "Seçin", tanim: "r-ka" + i, gecersiz: uyar(r, !x.c) })) + "</div>" +
      (bilgiAcik ? '<div class="a-madde-bilgi" id="r-kbi' + i + '">' + (MV.kriterAciklama(t, ad) ? "<p>" + kacis(MV.kriterAciklama(t, ad)) + "</p>" : '<p class="a-deger-yok">Bu madde için firma formatında açıklama tanımlı değil.</p>') +
        (t.std && t.std.length ? '<p class="a-alt-satir">Standart: ' + t.std.map(function (k) { var x = MV.standart(k); return x ? kacis(x.no + " — " + x.konu) : ""; }).filter(Boolean).join(" · ") + "</p>" : "") + "</div>" : "") +
      /* O2 (2026-09-30, reisim: "uygun değil işaretlenen durumlar için kusur açıklaması kısmı gelmesin, fotoğraf eklenirse fotoğrafın altına
         ilgili madde yazacak şekilde kusur açıklamaları kısmına gelsin"): açıklama alanı yok, madde metni kusurun kendisi. Formatlı türde
         fotoğraf Kusur açıklamaları bölümünde, altında madde; burada yalnız kısa bilgi. Bölümü olmayan türde fotoğraf maddenin altında kalır */
      (kus && kusurIc(r, oku, i, no) ? '<div class="a-kriter-kusur">' + kusurIc(r, oku, i, no) + "</div>" : "") + "</div>";
  }
  function kusurIc(r, oku, i, no) {
    var t = r.t, x = r.kriter[i];
    return (MV.kusurSinifli(t) ? MK.alan({ id: "r-kd" + i, etiket: "Kusur derecesi", zorunlu: !oku,   /* hafif / ağır yalnız Bakanlık formatlı türde (§4.5, Ek-III 1.9.1) */
        girdi: oku ? okuGirdi("r-kd" + i, ad2(DERECE, x.derece)) : MK.secim({ id: "r-kd" + i, ad: "Kusur derecesi", deger: x.derece || "", secenekler: DERECE, ipucu: "Seçin", tanim: "r-kd" + i + "-ipucu", gecersiz: uyar(r, !x.derece) }) }) : "") +
      (x.foto > 0 ? (r.F ? '<p class="a-ipucu a-kusur-foto-bilgi">' + ikon("camera", "a-ikon-kucuk") + x.foto + " fotoğraf · Kusur açıklamaları bölümünde</p>"
          : '<div class="a-fotolar">' + fotolar(x.foto, x.fotoAd, "Madde " + no, oku ? null : { eylem: "kusur-foto-sil", veri: { k: i } }) + "</div>")
        : !oku && MV.kusurFotoZorunlu() ? '<p class="a-ipucu' + (uyar(r, true) ? " a-ipucu-uyari" : "") + '">Fotoğraf zorunlu: satırdaki kamera simgesiyle ekleyin.</p>' : "");
  }
  /* ünlem menüsü (§3.8 kural 3, reisim 2026-09-28: "ünlem işareti olur ve oradan seçilerek hepsini uygun yap hepsini uygunsuz yap ya da
     hepsini uygulanamaz yap"): grubun başlığında, o grubun bütün maddelerini tek seferde işaretler; madde madde değiştirmek serbest */
  var TOPLU = [["uygun", "Hepsini uygun yap"], ["uygundegil", "Hepsini uygun değil yap"], ["uygulanamaz", "Hepsini uygulanamaz yap"]];
  /* buyuk: bölümün başlığında, başlık hizasında, bölüm açılmadan görünür yazılı tuş — bütün maddeler (2026-09-29, reisim: "muayene
     kriterleri oraya en son bir tuş ekledik hepsini uygun yap uygun değil yap veya uygulanamaz yap diye onun yerini değiştir muayene kriteri
     yazısının hizasında olsun … aşağı açılmadan da gözüksün") */
  var topluMenu = function (bas, son, ad, buyuk) {
    var id = buyuk ? "r-kth" : "r-kt" + bas;
    return '<div class="a-secici a-kriter-toplu' + (buyuk ? " a-bolum-tus" : "") + '">' +
      (buyuk ? '<button class="a-tus a-tus-ikincil a-tus-simge-tel" type="button" data-secici-ac="toplu" id="' + id + '" aria-haspopup="menu" aria-expanded="false" aria-label="Hepsini işaretle" title="Hepsini işaretle">' +
          ikon("circle-alert", "a-ikon-kucuk") + '<span class="a-tus-yazi">Hepsini işaretle</span>' + ikon("chevron-down", "a-ikon-kucuk a-tus-ok") + "</button>"
        : '<button class="a-ikon-tus" type="button" data-secici-ac="toplu" id="' + id + '" aria-haspopup="menu" aria-expanded="false" aria-label="' + ad.replace(/<[^>]*>/g, "") + ' · hepsini işaretle" title="Hepsini işaretle">' + ikon("circle-alert") + "</button>") +
      '<div class="a-secici-liste" role="menu" aria-label="Hepsini işaretle" hidden>' + TOPLU.map(function (x) {
        return '<button class="a-secenek" type="button" role="menuitem" data-eylem="kriter-toplu" data-deger="' + x[0] + '" data-bas="' + bas + '" data-son="' + son + '" data-odak="' + id + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
  };
  /* tek satırlık seçim (solda ad, sağda seçim): ölçüm metodu · termal kamera · sonuç */
  var tekSecim = function (id, ad, deger, secenekler, oku, genis, gecersiz) {
    return '<div class="a-kriter a-kriter-sonuc' + (genis ? " a-kriter-genis" : "") + '"><p class="a-kriter-ad" id="' + id + '-ad"><span>' + ad + "</span></p>" +
      '<div class="a-kriter-cevap">' + (oku ? okuGirdi(id, ad2(secenekler, deger)) : MK.secim({ id: id, ad: ad, deger: deger, secenekler: secenekler, ipucu: "Seçin", tanim: id + "-ad", gecersiz: !!gecersiz })) + "</div></div>";
  };
  /* formattaki ekipman detayı ya da tespit alanı: secim (tek) · coklu (birden çok) · metin; grup "detay" (r-d-…) ya da "tespit" (r-s-…) */
  function bilgiAlan(r, oku, grup, x) {
    var id = "r-" + grup[0].replace("t", "s") + "-" + x.k, v = r[grup][x.k], bos = false;   /* ekipman bilgileri zorunlu değil (§3.8 kural 5) */
    if (oku) return satir(kacis(x.ad), x.tip === "coklu" ? ((v || []).length ? v.map(kacis).join("<br>") : "-") : (kacis(v) || "-"));
    if (x.tip === "secim") return satir(kacis(x.ad), MK.secim({ id: id, ad: x.ad, deger: v || "", secenekler: x.sec.map(function (s) { return [s, s]; }), ipucu: "Seçin", gecersiz: bos }), id);
    if (x.tip === "coklu") return satir(kacis(x.ad), '<div class="a-coklu" role="group" aria-label="' + kacis(x.ad) + '">' + x.sec.map(function (s, j) {
      return '<label class="a-onay-kutusu"><input type="checkbox" data-coklu="' + grup + "|" + x.k + "|" + j + '"' + ((v || []).indexOf(s) >= 0 ? " checked" : "") + "><span>" + kacis(s) + "</span></label>"; }).join("") + "</div>");
    return satir(kacis(x.ad), MK.girdi({ id: id, alan: grup[0].replace("t", "s") + "-" + x.k, deger: v, ek: ' maxlength="80"', hata: bos }), id);
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
  /* 3 · TERMAL KAMERA (ZPKR02): hangi cihazın kullanılacağı yalnız ekipman türünden (reisim 2026-09-28: "zorunlu olan cihazlar bellidir türde
     belirtilmiştir belirtilmediyse neye göre zorunlu diyosun"). Türün cihazlarında termal kamera varsa Ölçüm cihazları'nda onun satırı olur ve
     buradan da eklenir; yoksa bu bölümde bir şey istenmez. Ayrı "kullanıldı mı" sorusu ve kendi uyarısı kalktı. */
  function termalHtml(r, oku) {
    var tv = cihazlar(r).filter(function (v) { return v.cihazTur === "termal"; })[0];
    if (MV.turCihazlari(r.t).indexOf("termal") < 0) return '<p class="a-bos-satir">Termal kamera yok.</p>';
    if (tv) return '<dl class="a-satirlar">' + satir("Cihaz", '<span class="a-kod">' + tv.env + "</span> · " + kacis(tv.marka + " " + tv.model)) + satir("Cihaz no", '<span class="a-kod">' + tv.seri + "</span>") +
      satir("Kalibrasyon tarihi", MV.kalDurum(tv) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(tv.kal[0].tarih) + " · geçmiş</span>" : MK.tarihYaz(tv.kal[0].tarih)) + "</dl>";
    return '<p class="a-bos-satir">Termal kamera eklenmedi.</p>' + (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "cihaz-ekle-ac", ad: "Termal kamera ekle", ikon: "plus", sinif: "a-tus-ikincil", veri: { tur: "termal" } }) + "</div>");
  }
  /* ölçüm metodu raporda seçilmez, ekipman türünden okunur (reisim 2026-09-28: "tür de belirlensin") */
  var metodHtml = function (r) {
    return '<dl class="a-satirlar"><div class="a-satir"><dt>Ölçüm metodu</dt><dd id="r-metod">' + (r.metod ? kacis(r.metod) : '<span class="a-uyari-metin">Ekipman türünde belirlenmemiş</span>') + "</dd></div></dl>";
  };
  /* topraklama ölçüm noktası: Ia = eğri çarpanı × In, Zs = 230 V / Ia, Ik1 = 230 V / Zx hesaplanır; uygunluk notunu denetçi seçer (P2) */
  var notSecim = function (r, oku, id, x, ad) {
    return '<span class="a-kart-etiket">Uygunluk notu</span>' + (oku ? (x.not ? "Not-" + x.not : '<span class="a-deger-yok">—</span>')
      : MK.secim({ id: id, ad: ad + " · uygunluk notu", deger: x.not ? String(x.not) : "", secenekler: NOTLAR(r), ipucu: "Seçin", gecersiz: uyar(r, !x.not) }));
  };
  /* 6.1 · 6.2 · 6.3 satır sonucu: değer yoksa —, uygun değilse nedeni başlıkta */
  var hesapRozet = function (h) { return !h ? '<span class="a-deger-yok">—</span>' : h.uygun ? rozet({ ad: "Uygun", rozet: "a-rozet-tamam" }) : '<span title="' + kacis(h.neden.join("; ")) + '">' + rozet({ ad: "Uygun değil · ağır", rozet: "a-rozet-red" }) + "</span>"; };
  function olcumHtml(r, oku) {
    var F = r.F, n = F.bolumler.kontrol;
    var kaldir = function (eylem, i, ad) { return oku ? "" : '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="' + eylem + '" data-i="' + i + '" aria-label="' + kacis(ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>"; };
    var ki = function (etiket) { return '<span class="a-kart-etiket">' + etiket + "</span>"; };
    var NOKTA = [
      { k: "ad", baslik: "Ölçüm noktası", kart: "ust", sira: 1, hucre: function (x) { return kacis(x.ad) + '<span class="a-alt-satir">' + x.egri + x.In + (x.rcd ? " · RCD " + (x.rcdTip || "A") + " " + x.rcd + " mA" : "") + "</span>"; } },
      { k: "zx", baslik: "Zx (Ω)", kart: "govde", sira: 2, hucre: function (x) { var i = r.nokta.indexOf(x);
        return ki("Zx (Ω)") + (oku ? (kacis(x.zx) || "-") : MK.girdi({ id: "r-zx" + i, alan: "zx" + i, deger: x.zx, sinif: "a-girdi-sicil", hata: uyar(r, !String(x.zx).trim()), ek: ' inputmode="decimal" maxlength="6" aria-label="' + kacis(x.ad) + ' · Zx (Ω)"' })); } },
      { k: "zs", baslik: "Ia · Zs sınır", kart: "govde", sira: 3, hucre: function (x) { var h = MV.noktaHesap(x); return ki("Ia · Zs sınır") + h.ia + " A · " + virgul(h.zs) + " Ω"; } },
      { k: "ik", baslik: "Ik1", kart: "govde", sira: 4, hucre: function (x) { var h = MV.noktaHesap(x); return ki("Ik1") + '<span id="r-ik' + r.nokta.indexOf(x) + '">' + (h.ik ? h.ik + " A" : "—") + "</span>"; } },
      /* RCD'li noktada RCD testi (IΔ, TΔ; formatın 5.1 sütunları) */
      { k: "rcdt", baslik: "RCD testi IΔ · TΔ", kart: "govde", sira: 5, hucre: function (x) {
        var i = r.nokta.indexOf(x), yan = uyar(r, noktaRcd(x) === null) ? ' aria-invalid="true"' : "";
        if (!x.rcd) return ki("RCD testi IΔ · TΔ") + '<span class="a-deger-yok">—</span>';
        return ki("RCD testi IΔ · TΔ") + (oku ? (kacis(x.rcdId) || "-") + " mA · " + (kacis(x.rcdTd) || "-") + " ms" : '<span class="a-cift-girdi">' +
          MK.girdi({ id: "r-ni" + i, alan: "ni" + i, deger: x.rcdId, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · RCD IΔ (mA)"' + yan }) +
          MK.girdi({ id: "r-nt" + i, alan: "nt" + i, deger: x.rcdTd, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · RCD TΔ (ms)"' + yan }) + "</span>"); } },
      { k: "not", baslik: "Uygunluk notu", kart: "govde", sira: 6, hucre: function (x) { return notSecim(r, oku, "r-nn" + r.nokta.indexOf(x), x, x.ad); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) { return kaldir("nokta-kaldir", r.nokta.indexOf(x), x.ad); } }]);
    var RCD = [
      { k: "ad", baslik: "Pano", kart: "ust", sira: 1, hucre: function (x) { return kacis(x.ad) + '<span class="a-alt-satir">Tip ' + x.tip + " · " + x.In + " A · IΔn " + x.idn + " mA" +
        (x.gecikme ? " · gecikme " + kacis(x.gecikme) + " ms" : "") + (x.sonPano ? " → " + kacis(x.sonPano) : "") + "</span>"; } },
      { k: "id", baslik: "IΔ (mA)", kart: "govde", sira: 2, hucre: function (x) { var i = r.rcdler.indexOf(x);
        return ki("IΔ (mA)") + (oku ? (kacis(x.id) || "-") : MK.girdi({ id: "r-ri" + i, alan: "ri" + i, deger: x.id, sinif: "a-girdi-sicil", hata: uyar(r, rcdSonuc(x) === null), ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · IΔ (mA)"' })); } },
      { k: "td", baslik: "TΔ (ms)", kart: "govde", sira: 3, hucre: function (x) { var i = r.rcdler.indexOf(x);
        return ki("TΔ (ms)") + (oku ? (kacis(x.td) || "-") : MK.girdi({ id: "r-rt" + i, alan: "rt" + i, deger: x.td, sinif: "a-girdi-sicil", hata: uyar(r, rcdSonuc(x) === null), ek: ' inputmode="decimal" maxlength="5" aria-label="' + kacis(x.ad) + ' · TΔ (ms)"' })); } },
      { k: "not", baslik: "Uygunluk notu", kart: "govde", sira: 4, hucre: function (x) { return notSecim(r, oku, "r-rn" + r.rcdler.indexOf(x), x, x.ad + " RCD"); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) { return kaldir("rcd-kaldir", r.rcdler.indexOf(x), x.ad); } }]);
    return metodHtml(r, oku) +
      '<h3 class="a-kriter-grup">' + n + ".1 · Çevrim empedansı ölçümleri</h3>" +
      (r.nokta.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Çevrim empedansı ölçümleri", sinif: "a-tablo-nokta", sutunlar: NOKTA, kayitlar: r.nokta }) + "</div>" : '<p class="a-bos-satir">Ölçüm noktası yok.</p>') +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "nokta-ekle", ad: "Nokta ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>") +
      '<h3 class="a-kriter-grup">' + n + ".2 · RCD testleri</h3>" +
      (r.rcdler.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "RCD testleri", sinif: "a-tablo-rcd", sutunlar: RCD, kayitlar: r.rcdler }) + "</div>" : '<p class="a-bos-satir">RCD yok.</p>') +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "rcd-ekle", ad: "RCD ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>");
  }
  /* 6.2 potansiyel dengeleme · 6.3 zemin izolasyonu (iç tesisat formatı; 2026-09-28): satır ekle / düzelt / kaldır, sonuç formatın
     ağır kusur tanımlarından (MV.pdHesap · ziHesap). Ekran uygulamanın düzeninde (reisim: "raporlama süreci attığım pdf gibi gözükmeyecek"). */
  var SATIR_ALAN = {
    pd: [["yer", "Potansiyel dengeleme yapılan bölüm", "Bölüm"], ["kesit", "İletken kesiti (mm²)", "Kesit (mm²)"], ["sure", "Süreklilik (Ω)", "Süreklilik (Ω)"],
      ["tkesit", "Tamamlayıcı iletken kesiti (mm²)", "Tamamlayıcı kesit (mm²)"], ["tsure", "Tamamlayıcı süreklilik (Ω)", "Tamamlayıcı süreklilik (Ω)"]],
    zi: [["yer", "İzolasyon halısının (zemin yalıtımının) yeri", "Yer"], ["en", "Eni (m)", "En (m)"], ["boy", "Boyu (m)", "Boy (m)"], ["direnc", "Zemin izolasyon direnci (kΩ)", "Direnç (kΩ)"]]
  };
  function satirHtml(r, oku, tur) {
    var l = r[tur], A = SATIR_ALAN[tur], hesap = tur === "pd" ? MV.pdHesap : MV.ziHesap;
    var SUT = [{ k: "yer", baslik: A[0][2], kart: "ust", sira: 1, hucre: function (x) { return kacis(x.yer); } }].concat(A.slice(1).map(function (a, j) {
      return { k: a[0], baslik: a[2], kart: "govde", sira: j + 2, hucre: function (x) { return '<span class="a-kart-etiket">' + a[2] + "</span>" + (x[a[0]] ? kacis(x[a[0]]) : '<span class="a-deger-yok">—</span>'); } };
    })).concat([{ k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return hesapRozet(hesap(x)); } }])
      .concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
        var i = l.indexOf(x);
        return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "satir-duzelt", ad: "Düzelt", ikon: "pencil", sinif: "a-tus-ikincil", veri: { tur: tur, i: i } }) +
          '<button class="a-ikon-tus" type="button" data-eylem="satir-kaldir" data-tur="' + tur + '" data-i="' + i + '" aria-label="' + kacis(x.yer) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>"; } }]);
    return (l.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: tur === "pd" ? "Potansiyel dengeleme iletkenleri" : "Zemin izolasyonu", sinif: "a-tablo-" + tur, sutunlar: SUT, kayitlar: l }) + "</div>"
        : '<p class="a-bos-satir">Satır yok.</p>') +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "satir-ekle", ad: tur === "pd" ? "Bölüm ekle" : "Yer ekle", ikon: "plus", sinif: "a-tus-ikincil", veri: { tur: tur } }) + "</div>");
  }
  /* kusur açıklamaları (formatlı tür): uygun değil maddeler, sınır dışı ölçümler, uygunsuz ölçüm noktaları ve RCD'ler tek listede */
  /* kusurlu maddenin fotoğraf adları (örnek kayıtta dosya yok: fotograf-N.jpg) — kusur açıklamalarında ve PDF'te fotoğrafa atıf */
  var fotoAdlari = function (x) { var l = []; for (var j = 0; j < (x.foto || 0); j++) l.push((x.fotoAd || [])[j] || "fotograf-" + (j + 1) + ".jpg"); return l; };
  function kusurListe(r) {
    var l = [], F = r.F, t = r.t, kr = MV.kriterler(t);
    r.kriter.forEach(function (x, i) { if (x.c === "uygundegil") l.push([kriterNo(t, i) + " · " + kr[i], ad2(DERECE, x.derece) || (MV.kusurSinifli(t) ? "Derece seçilmedi" : "Uygun değil"), "",
      fotoAdlari(x).join(", "), i]); });   /* açıklama yok (O2): madde metni kusurun kendisi; 5. öğe madde sırası (fotoğraf silme) */
    MV.testler(t).forEach(function (x, i) { if (testSonuc(x, r.test[i]) === false) l.push([x.ad, "Ağır kusur", r.test[i] + " " + x.birim + " · sınır " + MV.sinirYaz(x)]); });
    /* 5.1 · 5.2: seçilen uygunluk notu kusursa (P2) */
    r.nokta.forEach(function (x) { if (notKusur(r, +x.not)) l.push([x.ad, notAgir(r, +x.not) ? "Ağır kusur" : "Kusur", "Not-" + x.not + ": " + notMetin(r, +x.not)]); });
    r.rcdler.forEach(function (x) { if (notKusur(r, +x.not)) l.push([x.ad + " · RCD", notAgir(r, +x.not) ? "Ağır kusur" : "Kusur", "Not-" + x.not + ": " + notMetin(r, +x.not)]); });
    (r.sigorta || []).forEach(function (x) { var h = linyeSonuc(r, x); if (h && !h.uygun) l.push(["6.1 · " + x.no + " " + x.devre, "Ağır kusur", h.neden.join("; ") + "."]); });
    r.pd.forEach(function (x) { var h = MV.pdHesap(x); if (h && !h.uygun) l.push(["6.2 · " + x.yer, "Ağır kusur", h.neden.join("; ") + "."]); });
    r.zi.forEach(function (x) { var h = MV.ziHesap(x); if (h && !h.uygun) l.push(["6.3 · " + x.yer, "Ağır kusur", h.neden.join("; ") + "."]); });
    devam(r).forEach(function (x) { l.push([x.kriter + " (önceki kontrolden, " + x.rapor + ")", x.sinif, x.aciklama]); });
    return l;
  }
  function kusurHtml(r, oku) {
    var l = kusurListe(r);
    /* uygun değil işaretlenen her madde ve uygun olmayan ölçüm; kusur derecesi yazısı yok (reisim 2026-09-28: "hafif kusur ağır kusur vs yazmasın") */
    /* O2: fotoğraflı maddede önce fotoğraf, altında ilgili madde */
    return (l.length ? '<ol class="a-kusur-liste">' + l.map(function (x) { var k = x[4], m = k === undefined ? null : r.kriter[k];
      if (m && m.foto > 0) return '<li class="a-kusur-fotolu">' + fotolar(m.foto, m.fotoAd, "Madde " + kriterNo(r.t, k), oku ? null : { eylem: "kusur-foto-sil", veri: { k: k } }) +
        '<span class="a-kusur-madde">' + kacis(x[0]) + "</span></li>";
      return "<li><b>" + kacis(x[0]) + "</b>" + (x[2] ? '<span class="a-alt-satir">' + kacis(x[2]) + "</span>" : "") + "</li>"; }).join("") + "</ol>"
        : '<p class="a-bos-satir">Kusur yok.</p>') +
      (r.F.agirKusur ? '<details class="a-format-liste"><summary>Ağır kusur sayılan durumlar</summary><ul>' + r.F.agirKusur.map(function (x) { return "<li>" + kacis(x) + "</li>"; }).join("") + "</ul></details>" : "");
  }
  function ciz(odak) {
    var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1], r = kod ? rapor(kod) : null;
    /* pasif rapor saha ekranında açılmaz — eski bağlantı, geçmiş, açık sekme (2026-09-29, reisim: "Pasife alınan raporlar denetçilere
       gözükmesin sadece yöneticilere gözüksün") */
    var pasif = r && MV.rapor(r.no) && MV.rapor(r.no).pasif;
    if (!r || pasif) {
      $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: pasif ? "Bu rapor pasife alındı; yalnız yöneticiler görür." : "Bu ekipman için açılmış rapor yok. Rapor, plan içinde ekipmanın satırındaki “Rapor oluştur” ile açılır.",
          eylem: '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/plan/1") + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Plana dön</a>" });
      document.title = "Rapor bulunamadı · probata maket"; if (MK.sayGuncelle) MK.sayGuncelle(null, true); return;
    }
    var t = r.t, e = r.e, oku = r.durum !== "taslak", F = r.F;
    MK.MESAI_BU = oku ? null : (MV.tur(e.tur).sure || 0);   /* N6: günlük süre penceresinde "Bu rapor: N dk" */
    EKS = {}; if (UY === r && !oku) zorunluEksik(r).forEach(function (x) { EKS[x.bolum] = true; });
    var PL = r.ts, p = MV.kisi(r.kisi), yon = MV.kisi(YON[t.b]), isg = MV.isgTesis(PL.id).filter(function (x) { return x.k === r.kisi; })[0], ci = cihazlar(r);
    var gecti = gecmis(r), eksik = eksikTur(r), mus = MV.musteri(PL.m);
    var cevaplanan = r.kriter.filter(function (x) { return x.c; }).length;
    var CIHAZ_SATIR = [
      { k: "tur", baslik: "Gerekli cihaz", kart: "ust", sira: 1, hucre: function (x) { return "<b>" + kacis(MV.cihazTuru(x.c).ad) + "</b>"; } },
      { k: "ad", baslik: "Cihaz", kart: "govde", sira: 2, hucre: function (x) {
        return '<span class="a-kart-etiket">Cihaz</span>' + (x.v ? '<span class="a-kod">' + x.v.env + "</span> · " + kacis(x.v.marka + " " + x.v.model) : oku ? '<span class="a-deger-yok">—</span>'
          : MK.tus({ eylem: "cihaz-ekle-ac", ad: "Cihaz ekle", ikon: "plus", sinif: "a-tus-ikincil", veri: { tur: x.c } }) + (uyar(r, true) ? ' <span class="a-uyari-metin a-hata-metin">Eksik</span>' : "")); } },
      { k: "no", baslik: "Cihaz no", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Cihaz no</span>' + (x.v ? '<span class="a-kod">' + x.v.seri + "</span>" : '<span class="a-deger-yok">—</span>'); } },
      { k: "kal", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 4, hucre: function (x) {
        if (!x.v) return '<span class="a-kart-etiket">Kalibrasyon tarihi</span><span class="a-deger-yok">—</span>';
        return '<span class="a-kart-etiket">Kalibrasyon tarihi</span>' + (MV.kalDurum(x.v) === "gecti" ? '<span class="a-uyari-metin a-hata-metin">' + MK.tarihYaz(x.v.kal[0].tarih) + " · geçmiş</span>" : MK.tarihYaz(x.v.kal[0].tarih)); } }
    ].concat(oku ? [] : [{ k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
      return x.v ? '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-ikon-tus" type="button" data-eylem="cihaz-kaldir" data-id="' + x.v.id + '" aria-label="' + kacis(x.v.ad) + ' kaldır" title="Kaldır">' + ikon("x") + "</button></div></div>" : ""; } }]);
    /* bölüm numarası: formatlı türde formattaki sıra (iç tesisat 1–11, topraklama 1–9), ötekinde firmanın sabit sırası */
    var el = elektrik(t), no = function (k, v) { return F ? F.bolumler[k] : v; }, S = {};
    /* 1 · FİRMA BİLGİLERİ: türün rapor formatından bağımsız, her raporda aynı (reisim 2026-09-26); 2026-09-27 örnek ekranla: etiket solda,
       değer ya da alan sağda, satır satır; kontrol tarihleri de burada (ayrı "Kontrol bilgileri" bölümü kalktı). Kayıttan gelen değerler
       (firma, e-posta, adres, İSG-KATİP ID, rapor no) raporda değişmez (160); telefon ve ekipman bölümü elle.
       2026-09-29 (reisim: "Plan içeriğinde "SGK destis no:" ksımı yok olmalı"): SGK DETSİS no saha ekranında yok; tesis kaydından
       rapor PDF'ine gider (Ek-III zorunlu alanı, maket-belge.js). */
    /* 2026-09-27 (reisim): firma adı, e-posta, telefon, adres, rapor no denetçide DEĞİŞMEZ — plan açılırken planlamacı girer ya da
       kendiliğinden oluşur; yanlışsa planlamacı Müşteriler'den düzeltir, denetçi "Güncelle" ile güncel bilgiyi çeker.
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
        satir("İSG-KATİP sözleşme ID", isg ? '<span class="a-kod">' + isg.no + "</span>" : '<span class="a-uyari-metin">Yok</span>') +
        (F ? satir("Periyodik kontrol metodu ve kapsamı", kacis(MV.metotYazi(t))) : "") +
        metinAlan(r, oku, "bolumAd", "Ekipman bölümü", 60) + "</dl>",
      /* telefonda yalnız simge (2026-09-29, reisim: "hepsine uygula ve güncelle mobilde yazmamalı sadece işaretleri gözükmeli") */
      oku ? "" : '<button class="a-tus a-tus-ikincil a-bolum-tus a-tus-simge-tel" type="button" data-eylem="firma-guncelle" aria-label="Güncelle" title="Güncelle">' +
        ikon("refresh-cw", "a-ikon-kucuk") + '<span class="a-tus-yazi">Güncelle</span></button>');
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
    S.termal = F && F.bolumler.termal ? bolum(F.bolumler.termal, "r-bt", "Termal kamera bilgileri", termalHtml(r, oku)) : "";
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
        var ad = F.bolumler.kontrol + "." + (gi + 1) + " · " + kacis(g[0]);
        var h = '<div class="a-kriter-grup-bas"><h3 class="a-kriter-grup">' + ad + "</h3>" + (oku ? "" : topluMenu(i0, i0 + g[1].length, ad)) + "</div>" +
          g[1].map(function (x, j) { return kriterHtml(r, oku, i0 + j); }).join("");
        i0 += g[1].length; return h; }).join("")
        : r.kriter.map(function (x, i) { return kriterHtml(r, oku, i); }).join("")),
      '<span class="a-sayac" id="r-kriter-say"><b>' + cevaplanan + "</b> / " + r.kriter.length + " madde</span>" + (oku ? "" : topluMenu(0, r.kriter.length, "", true)));
    var testlerHtml = '<div class="a-form">' + MV.testler(t).map(function (x, i) {
      var s = testSonuc(x, r.test[i]);
      return MK.alan({ id: "r-t" + i, etiket: kacis(x.ad) + (x.birim ? " (" + x.birim + ")" : ""), zorunlu: !oku && testZorunlu(x), hata: "",
        girdi: MK.girdi({ id: "r-t" + i, alan: "t" + i, deger: r.test[i], sinif: "a-girdi-sicil" + (oku ? " a-girdi-oku" : ""), ek: (x.metin ? ' maxlength="20"' : ' inputmode="decimal" maxlength="10"') + (oku ? " readonly" : "") + (s === false || uyar(r, testZorunlu(x) && !testDolu(x, r.test[i])) ? ' aria-invalid="true"' : "") }) });
    }).join("") + "</div>";
    S.test = !F ? bolum(5, "r-b5", "Test değerleri", testlerHtml)
      : F.gozle ? bolum(F.bolumler.fonksiyon, "r-b5", "Fonksiyon kontrol kriterleri ve testler", metodHtml(r, oku) + testlerHtml)
      : bolum(F.bolumler.kontrol, "r-b5", "Kontrol ve ölçümler", olcumHtml(r, oku));
    S.sigorta = sigortali(r) ? bolum(F ? F.bolumler.fonksiyon + ".1" : 6, "r-b6", F ? "Pano linye ve sigortaları" : "Pano sigortaları", sigortaHtml(r, oku)) : "";
    S.pd = F && F.linye ? bolum(F.bolumler.fonksiyon + ".2", "r-bp", "Potansiyel dengeleme iletkenleri", satirHtml(r, oku, "pd")) : "";
    S.zi = F && F.linye ? bolum(F.bolumler.fonksiyon + ".3", "r-bz", "Zemin izolasyonu", satirHtml(r, oku, "zi")) : "";
    S.kusur = F ? bolum(F.bolumler.kusur, "r-bk", "Kusur açıklamaları", kusurHtml(r, oku)) : "";
    /* önceki kontrolden açık hafif kusurlar: her biri Giderildi / Giderilmedi; seçilmemesi gönderimi durdurmaz (kural uyarıdır) */
    var dv = devreden(r);
    S.devir = dv.length ? bolum("", "r-devir", MV.kusurSinifli(t) ? "Önceki kontrolden açık hafif kusurlar" : "Önceki kontrolden açık kusurlar", '<ol class="a-kusur-liste">' + dv.map(function (x, i) {
        var d = (r.devir || {})[x.id] || "", sec = [["giderildi", "Giderildi"], ["devam", "Giderilmedi"]];
        return "<li><b>" + kacis(x.kriter) + '</b><span class="a-alt-satir">' + kacis(x.aciklama) + " · " + x.rapor + " · " + MK.tarihYaz(x.tarih) + "</span>" +
          '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-dv" + i, ad2(sec, d) || "—") : MK.secim({ id: "r-dv" + i, ad: "Önceki hafif kusur " + (i + 1), deger: d, secenekler: sec, ipucu: "Seçin" })) + "</div></li>";
      }).join("") + "</ol>", '<span class="a-sayac"><b>' + dv.length + "</b> kusur</span>") : "";
    /* fotoğraflar, sonuç ve yorum her raporda (reisim 2026-09-27); formatında fotoğraf bölümü yoksa fotoğraf yok (P1) */
    S.foto = !fotoVar(r) ? "" : bolum(F ? F.bolumler.foto : el ? 7 : 6, "r-b7", "Fotoğraflar", '<div class="a-fotolar' + (uyar(r, r.foto < 1) ? " a-alan-eksik" : "") + '">' + (oku ? "" : fotoMenu("foto-ekle")) + fotolar(r.foto, r.fotoAd, "", oku ? null : { eylem: "foto-sil" }) + "</div>");
    /* sonuç ve kanaat muayene kriterleri gibi seçmeli: Uygun · Uygun değil; seçilmezse gönderilince kriterlere göre konur (reisim 2026-09-27);
       uygun değil madde varken "Uygun" uyarıdır, engel değil. Formatlı türde formatın sonuç cümlesi üstte. */
    S.sonuc = bolum(F ? F.bolumler.sonuc : el ? 8 : 7, "r-b8", "Sonuç ve kanaat", (F ? '<p class="a-format-metin" id="r-sonuc-metin">' + sonucCumle(r) + "</p>" : "") +
      '<div class="a-kriter a-kriter-sonuc"><p class="a-kriter-ad" id="r-sonuc-ad"><span>Sonuç ve kanaat</span></p>' +
      '<div class="a-kriter-cevap">' + (oku ? okuGirdi("r-sonuc", ad2(SONUC, r.sonuc)) : MK.secim({ id: "r-sonuc", ad: "Sonuç ve kanaat", deger: r.sonuc, secenekler: SONUC, ipucu: "Seçin", tanim: "r-sonuc-ad" })) + "</div>" +
      (!oku && uygunDegil(r) && r.sonuc === "kullanilir" ? '<p class="a-ipucu a-ipucu-uyari a-kriter-uyari">Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”.</p>' : "") + "</div>");
    S.not = bolum(F ? F.bolumler.not : el ? 9 : 8, "r-b9", F ? "Notlar" : "Muayene uzmanı yorumu",
      '<textarea class="a-alan a-alan-ince" id="r-notlar" data-alan="notlar" maxlength="500" aria-label="' + (F ? "Notlar" : "Muayene uzmanı yorumu") + '"' + (oku ? " readonly" : "") + ">" + kacis(r.notlar) + "</textarea>" +
      (F && F.notlar ? '<details class="a-format-liste"><summary>Uygunluk notları (Not-1 … Not-' + F.notlar.length + ")</summary><ol>" + F.notlar.map(function (x) { return "<li>" + kacis(x) + "</li>"; }).join("") + "</ol></details>" : ""));
    /* yetkili kişi: raporu yazan denetçinin personel kaydından (değişmez); imza son imzada */
    S.yetkili = F ? bolum(F.bolumler.yetkili, "r-by", "Yetkili kişi", '<dl class="a-satirlar">' + satir("Ad soyad", kacis(p.ad)) + satir("Meslek", kacis(MV.meslekAd(p))) +
      satir("Yetkili kişi kayıt no", '<span class="a-kod">' + p.ekipnet + "</span>") + satir("Nüsha sayısı", String(MV.FIRMA.nusha)) + "</dl>") : "";
    var SIRA = !F ? ["firma", "ekipman", "cihaz", "kriter", "test", "sigorta", "devir", "foto", "sonuc", "not"]
      : F.gozle ? ["firma", "ekipman", "termal", "cihaz", "kriter", "test", "sigorta", "pd", "zi", "devir", "kusur", "foto", "not", "sonuc", "yetkili"]
      : ["firma", "ekipman", "cihaz", "tanim", "test", "devir", "kusur", "not", "sonuc", "yetkili", "foto"];
    $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], [PL.plan || PL.ad, PL.pid ? MK.adres(13, "#/plan/" + PL.pid) : MK.adres(13, "#/")], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + e.kod + " · " + kacis(t.ad) + "</h1>" + rozet(DURUM[r.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + (F ? '<span class="a-kod">' + t.format + "</span> · " : "") + kacis(MV.musteri(PL.m).kisa) + " · " + kacis(PL.ad) + " · " + kacis(p.ad) + "</span></p>" +   /* L7: firma önce, tesis sonra */
        /* son kayıt başlıkta (2026-09-29: tuşlar çubuksuz, yazı tuşların arkasında kalmasın) */
        (oku ? "" : '<p class="a-adim-not a-rapor-kayit" id="r-kayit">' + kayitMetin(r) + "</p>") + "</div>" +
        /* Ön izle (reisim 2026-09-28: "en sağ üstte ön izleme tuşu olmalı PDF çıktısını ön izleyebilmeliyim ön izle halinde PDF halini indirebilmeliyim") */
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "on-izle", ad: "Ön izle", ikon: "eye", sinif: "a-tus-ikincil" }) + "</div></div>" +
      /* günlük süre (212): raporu yazan denetçinin bugünkü süresi, bu raporun süresi */
        /* N6 (2026-09-30): günlük süre üst çubukta (açılır; bu raporun süresi pencerede); burada yalnız süre dolunca neden */
        (!oku && MV.mesai().acik && MV.gunlukSure(r.kisi).dolu ? '<div class="a-rapor-mesai">' + MK.serit("uyari", "clock", "Günlük süre doldu; yeni rapor ve kopya oluşturulamaz.", "r-mesai-sebep") + "</div>" : "") +
      '<div class="a-uyari-serit">' + MV.durumSerit(MV.rapor(r.no)) +
        /* FORMATI GÜNCELLE (2026-09-30, 211): firmanın rapor formatı yenilendiyse açık raporda; eşleşen maddelerin cevabı korunur */
        (!oku && r.sablon && t.sablon && r.sablon !== t.sablon ? '<div class="a-serit a-serit-bilgi" id="r-format-serit">' + ikon("refresh-cw", "a-ikon-kucuk") +
          "<span>Bu rapor eski format sürümüyle açıldı (" + kacis(r.sablon) + "); güncel sürüm " + kacis(t.sablon) + ".</span>" +
          MK.tus({ eylem: "format-guncelle", ad: "Formatı güncelle", ikon: "refresh-cw", sinif: "a-tus-ikincil a-serit-tus" }) + "</div>" : "") +
        (r.kopya && r.durum === "taslak" ? MK.serit("bilgi", "copy", "Bilgiler " + '<span class="a-rapor-no">' + r.kopya + "</span> raporundan kopyalandı; test değerleri, fotoğraflar ve sonuç bu ekipman için girilir.") : "") +
        /* meslek uyarısı (V4; §3.2 öneri 2c → karar): engel değil */
        (!MV.meslekYetkili(r.kisi, t) ? MK.serit("uyari", "triangle-alert", "Mesleğiniz (" + kacis(MV.meslekAd(p)) + ") " + kacis(t.ad).toLocaleLowerCase("tr") + " için yetkili meslekler arasında değil. Rapor yazılabilir; teknik yönetici onayda görür.") : "") +
        /* ekipman ataması (L4, 2026-09-30): açık raporda, yazan bu türe atanmamışsa uyarı, engel değil; meslek uyarısı varsa o yeter */
        (!oku && MV.meslekYetkili(r.kisi, t) && !MV.atandi(r.kisi, t.k) ? MK.serit("uyari", "file-check", kacis(p.ad) + " " + kacis(t.ad).toLocaleLowerCase("tr") + " türüne atanmamış (Personel › Ekipman atamaları). Rapor yazılabilir; teknik yönetici onayda görür.") : "") +
        (r.geri && !oku ? MK.serit("uyari", "undo-2", "<b>Geri gönderildi</b> · " + kacis(MV.kisi(r.geri.kim).ad) + " · " + MK.zamanYaz(r.geri.zaman) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (oku ? MK.serit("bilgi", "lock", r.durum === "onayda" ? "Teknik yönetici onayında · " + kacis(yon.ad) + (r.gonderildi ? " · " + MK.zamanYaz(r.gonderildi) : "")
          : r.durum === "imzada" ? "İmzaya gönderildi" : r.durum === "imzali" ? "Tamamlandı · son imza atıldı, müşteriye açıldı" : "Muayene uzmanı imzası bekleniyor") : "") +
      "</div>" +
      (r.geriler.length ? bolum("", "r-geri", "Geri gönderme geçmişi", '<ol class="a-gecmis">' + r.geriler.map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + MK.zamanYaz(g.zaman) + '</span><span class="a-gecmis-ne"><b>' + kacis(MV.kisi(g.kim).ad) + "</b> · " + kacis(g.gerekce) + "</span></li>"; }).join("") + "</ol>",
        '<span class="a-sayac"><b>' + r.geriler.length + "</b> kez</span>") : "") +
      '<div class="a-rapor-bolumler">' + SIRA.map(function (k) { return S[k]; }).join("") + "</div>" +
      /* Kaydet + Onaya gönder: sayfa kaysa da görünür, altta yapışkan (reisim 2026-09-27: "ekranda sabit ekran kaysa da gözükecek şekilde,
         kaydet gönder diye iki tuş olsun"); 2026-09-29 (reisim: "Raporu komple silebilmek için sil tuşu olsun kaydet tuşunun yanında olsun. /
         Kaydet gönder sil tuşları sanki bir barın içinde gibi değil bağımsız dursunlar"): çubuk yok, tuşlar kendi gölgeleriyle; Sil düzenlenebilen
         her raporda (silinebilir) */
      /* 2026-09-30 (204–210): "Kaydet ve kopyala" her raporda (gönderilmişte "Kopyala" — kaydedilecek bir şey yok); telefonda bütün tuşlar
         tek "İşlemler" menüsünde (masaüstü ve tablette yan yana) */
      eylemHtml(r, oku);
    document.title = e.kod + " · " + r.no + " · probata maket";
    if (odak) { var fo = $(odak); if (fo) fo.focus(); }
    if (MK.sayGuncelle) MK.sayGuncelle(r, oku);
  }
  /* formatın sonuç cümlesi TAM (reisim 2026-09-28: "telefonda … ile bitiyor tam metin okunamıyor"): seçilen sonuçla biter, seçilmediyse iki seçenek */
  var sonucCumle = function (r) { return kacis(r.F.sonuc) + " " + (r.sonuc === "kullanilir" ? "<b>uygundur</b>" : r.sonuc === "kullanilamaz" ? "<b>uygun değildir</b>" : "uygundur / uygun değildir") + "."; };
  /* düzenlenebilen (Yeni ya da geri gönderilmiş) rapor denetçide silinir (2026-09-29, reisim: "oluşan rapor denetçi tarafından da
     silinebilsin"); gönderilen rapor salt okunur, tuşu yok */
  var silinebilir = function (r) { return r.durum === "taslak"; };
  function eylemHtml(r, oku) {
    /* Z2 (2026-10-02; ARKA-UC K6 · §5.3): S.A.Y düğmesi eylem çubuğunun solunda — yalnız düzenlenen (Yeni / geri gönderilmiş) raporda ve firma
       yapay zekâyı açtıysa; panel maket-say.js */
    var say = !oku && MV.yz().acik ? '<button class="a-tus a-tus-ikincil a-say-ac" type="button" data-eylem="say-ac" aria-haspopup="dialog" aria-controls="a-say" aria-expanded="' +
      !!(MK.sayAcik && MK.sayAcik()) + '" aria-label="S.A.Y — saha asistanı">' + ikon("message-circle", "a-ikon-kucuk") + '<span class="a-say-yazi">S.A.Y</span></button>' : "";
    var l = (oku ? [] : [silinebilir(r) ? ["rapor-sil-ac", "Sil", "x", "a-tus-ikincil a-tus-sil"] : null]).concat([
      ["kopya-ac", oku ? "Kopyala" : "Kaydet ve kopyala", "copy", "a-tus-ikincil"]]).concat(oku ? [] : [
      ["kaydet", "Kaydet", "check", "a-tus-ikincil"], ["onaya-gonder", "Onaya gönder", "send", "a-tus-birincil"]]).filter(Boolean);
    return '<div class="a-rapor-eylem">' + say + l.map(function (x) { return MK.tus({ eylem: x[0], ad: x[1], ikon: x[2], sinif: x[3] + " a-rapor-tus" }); }).join("") +
      '<div class="a-secici a-rapor-islemler"><button class="a-tus a-tus-birincil" type="button" data-secici-ac="islemler" id="r-islemler" aria-haspopup="menu" aria-expanded="false">' +
        ikon("ellipsis-vertical", "a-ikon-kucuk") + "İşlemler</button>" +
        '<div class="a-secici-liste" role="menu" aria-label="İşlemler" hidden>' + l.slice().reverse().map(function (x) {   /* menüde birincil üstte, Sil en altta */
          return '<button class="a-secenek' + (x[0] === "rapor-sil-ac" ? " a-tus-sil" : "") + '" type="button" role="menuitem" data-eylem="' + x[0] + '">' + x[1] + "</button>"; }).join("") +
      "</div></div></div>";
  }
  /* KAYDET VE KOPYALA (2026-09-30, 204–209): yeni ekipmanın kodu (zorunlu, firmada eşsiz), seri no ve kullanım yeri sorulur; tür aynı. Yeni
     ekipman bu raporun bilgileriyle açılır: ekipman bilgileri, ekipman detayları ve tespitler, ölçüm cihazları, madde cevapları kopyalanır;
     "Uygun değil" maddenin kusur açıklaması, derecesi ve fotoğrafı, test ve ölçüm değerleri, fotoğraflar, sonuç, notlar kopyalanmaz. Kopya
     her zaman Yeni; sonra yeni ekipmanın raporuna gidilir. */
  var kodDurumu = function (kod) {
    if (!kod) return "Ekipman kodunu yazın.";
    if (/[^A-Z0-9-]/.test(kod)) return "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok).";
    if (kod.length < 3 || kod.length > 20) return "Kod 3 ile 20 hane arasında olmalı.";
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kod)) return "Tire başta, sonda ya da art arda olamaz.";
    if (MV.ekipman(kod)) return kod + " firmada başka bir ekipmanda kayıtlı. Aynı kod iki ekipmana verilemez.";
    return "";
  };
  var siraOku = function (no) { var m = /^[^-]+-\d{4}-(\d+)-/.exec(no || ""); return m ? +m[1] : 0; };
  function kopyala(r, d) {
    var kod = d.kod, e = r.e, pid = r.ts.pid || (MV.rapor(r.no) || {}).plan, simdi = MK.simdi();
    MV.EKIPMAN.push({ kod: kod, tur: e.tur, tesis: e.tesis, konum: d.konum || r.konum || e.konum, onceki: null, ilk: true, plan: pid, marka: r.marka, model: r.model,
      imal: r.imal, seri: d.seri, eklendi: simdi, kopyaKaynak: e.kod });
    var sira = MV.RAPORLAR.reduce(function (m, x) { return Math.max(m, siraOku(x.no)); }, 0) + 1, no = MV.raporNo("0926", sira).replace(/^[^-]+/, MV.firmaKodu());
    MV.RAPORLAR.push({ no: no, kod: kod, tesis: e.tesis, plan: pid, kisi: r.kisi, olustu: simdi, durum: "taslak", sonuc: null, gonderildi: null, onay: null, imza: null, kopya: r.no });
    var p = MV.PLANLAR.filter(function (x) { return x.id === pid; })[0];
    if (p && Array.isArray(p.gecmis)) p.gecmis.push({ z: simdi, kim: r.kisi, ne: "Ekipman kopyalandı", ayrinti: e.kod + " → " + kod + " · " + no, s: p.gecmis.length });
    KAYIT[no] = JSON.parse(JSON.stringify({ marka: r.marka, model: r.model, imal: r.imal, amac: r.amac, bolumAd: r.bolumAd, detay: r.detay, tespit: r.tespit, cihaz: r.cihaz,
      kriter: MV.kriterler(r.t).map(function (ad, i) { var x = r.kriter[i]; return { c: x ? x.c : "uygun", not: "" }; }),   /* kopya güncel formatla açılır (211) */ konum: d.konum || r.konum, seri: d.seri, kayit: simdi, olustu: simdi, bas: simdi, kopya: r.no }));
    return { kod: kod, no: no };
  }
  var kayitMetin = function (r) { return r.degisti ? "Kaydedilmemiş değişiklik var" : r.kayit ? "Son kayıt " + MK.zamanYaz(r.kayit) : "Henüz kaydedilmedi"; };
  var fotolar = MK.fotolar;
  function sigortaHtml(r, oku) {
    var d = r.sigorta, bek = d ? d.filter(function (x) { return x.durum !== "onayli"; }) : [], dusuk = bek.filter(function (x) { return x.guven === "dusuk"; });
    var SUTUN = [
      { k: "no", baslik: "Sigorta", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-kod">' + x.no + "</span>" + kirp(x.devre, "a-alt-satir"); } },
      { k: "deger", baslik: "Koruma", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Koruma</span><span class="a-kod">' + x.tip + x.akim + "</span> · " + x.kutup + "P" + (x.icu ? " · " + x.icu + " kA" : ""); } },
      { k: "kesit", baslik: "Kesit", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Kesit</span>' + (x.faz || x.npen || x.pe ? [x.faz, x.npen, x.pe].map(function (v) { return v || "—"; }).join(" / ") + " mm²" : '<span class="a-deger-yok">—</span>'); } },
      { k: "ibiz", baslik: "Ib · Iz", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Ib · Iz</span>' + (x.ib || x.iz ? (x.ib || "—") + " · " + (x.iz || "—") + " A" : '<span class="a-deger-yok">—</span>'); } },
      { k: "rcd", baslik: "RCD", kart: "govde", sira: 5, hucre: function (x) { return '<span class="a-kart-etiket">RCD</span>' + (x.rcd ? x.rcd + " mA" + (x.id || x.td ? " · " + (x.id || "—") + " / " + (x.td || "—") + " ms" : "") : '<span class="a-deger-yok">—</span>'); } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) {
        /* onaylı satırda ölçümler girildiyse formatın sonucu (Uygun / Uygun değil · ağır), girilmediyse "Onaylı" */
        if (x.durum === "onayli") { var hs = linyeSonuc(r, x); return hs ? hesapRozet(hs) : rozet({ ad: "Onaylı", rozet: "a-rozet-tamam" }); }
        return rozet(x.guven === "dusuk" ? { ad: "Emin değil", rozet: "a-rozet-bekliyor" } : { ad: "Öneri", rozet: "a-rozet-notr" });
      } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
        return oku ? "" : '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "sigorta-ac", ad: x.durum === "onayli" ? "Düzelt" : "Kontrol et", ikon: "pencil", sinif: "a-tus-ikincil", veri: { no: x.no } }) + "</div></div>";
      } }
    ];
    return "" +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sigorta-oku", ad: d ? "Yeniden oku" : "Fotoğraftan oku", ikon: "camera", sinif: d ? "a-tus-ikincil" : "a-tus-birincil" }) +
        MK.tus({ eylem: "sigorta-ekle", ad: "Elle ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + (bek.length > dusuk.length ? MK.tus({ eylem: "sigorta-onayla", ad: "Önerileri onayla (" + (bek.length - dusuk.length) + ")", ikon: "check", sinif: "a-tus-ikincil" }) : "") + "</div>") +
      (r.pano ? '<div class="a-fotolar a-bolum-serit">' + fotolar(1, ["pano-fotografi.jpg"], "Pano") + "</div>" : "") +   /* küçük resim yok (2026-09-29) */
      (d ? '<div class="a-bolum-serit">' + (bek.length ? MK.serit(dusuk.length ? "uyari" : "bilgi", dusuk.length ? "triangle-alert" : "eye", d.length + " sigorta · <b>" + bek.length + "</b> onay bekliyor" + (dusuk.length ? " · " + dusuk.length + " satırda okuma emin değil: tek tek kontrol edin (toplu onaya girmez)." : ".")) : MK.serit("onay", "circle-check", d.length + " sigorta onaylandı.")) + "</div>" +
        '<div class="a-liste-kap a-bolum-serit">' + MK.tablo({ baslik: "Pano sigortaları", sinif: "a-tablo-sigorta", sutunlar: SUTUN, kayitlar: d }) + "</div>"
        : '<p class="a-bos-satir a-bolum-serit">Henüz sigorta girilmedi.</p>');
  }

  var LINYE_ALAN = [["icu", "Icu kısa devre kesme akımı (kA)"], ["faz", "Faz kesiti (mm²)"], ["npen", "N / PEN kesiti (mm²)"], ["pe", "PE kesiti (mm²)"],
    ["ib", "Ib yük akımı (A)"], ["iz", "Iz akım taşıma kapasitesi (A)"], ["id", "RCD testi IΔ (mA)"], ["td", "RCD testi TΔ (ms)"]];
  var ondalik = function (v) { return !String(v || "").trim() || /^\d+([.,]\d+)?$/.test(String(v).trim()); };
  /* ── PENCERE: sigorta satırı · satırlar · cihaz · zorunlu alanlar ────────────────────────────────────────────────────────── */
  var W = null;
  function pencereCiz(odak) {
    var d = W.d, h = W.hata;
    if (W.tur === "kopya") {
      var ek = W.r.e;
      $("a-pencere-baslik").textContent = (W.oku ? "Kopyala" : "Kaydet ve kopyala") + " · yeni ekipman";
      $("a-pencere-govde").innerHTML = '<p class="a-pencere-metin"><span class="a-kod">' + ek.kod + "</span> · " + kacis(W.r.t.ad) + " raporunun bilgileriyle yeni ekipman ve raporu açılır" +
          (W.oku ? "" : "; bu rapor önce kaydedilir") + ". Test değerleri, fotoğraflar ve sonuç kopyalanmaz.</p>" +
        '<div class="a-form">' +
        MK.alan({ id: "w-kod", etiket: "Ekipman kodu", zorunlu: true, hata: h.kod, girdi: MK.girdi({ id: "w-kod", alan: "kod", deger: d.kod, sinif: "a-girdi-kod", hata: h.kod, ek: ' maxlength="20" spellcheck="false" placeholder="' + ek.kod.replace(/\d+$/, "") + '…"' }) }) +
        /* N10 (2026-09-30, reisim: "ekipman kodu ve ekipman bölümü sorsun yeterli"): tür değişmez (yazıda), seri no sorulmaz (her formatta yok;
           varsa yeni raporda yazılır) */
        MK.alan({ id: "w-konum", etiket: "Ekipman bölümü (kullanım yeri)", girdi: MK.girdi({ id: "w-konum", alan: "konum", deger: d.konum, ek: ' maxlength="60"' }) }) + "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: W.oku ? "Kopyala" : "Kaydet ve kopyala", ikon: "copy" });
      if (odak) { var ko = $(odak); if (ko) { ko.focus(); if (ko.setSelectionRange) ko.setSelectionRange(ko.value.length, ko.value.length); } }
      return;
    }
    if (W.tur === "sigorta") {
      $("a-pencere-baslik").textContent = W.x ? "Sigorta " + W.x.no + (W.x.durum === "onayli" ? " · düzelt" : " · kontrol et") : "Sigorta ekle";
      $("a-pencere-govde").innerHTML = (W.x && W.x.guven === "dusuk" && W.x.durum !== "onayli" ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Okuma emin değil: etiketi panoda gözle kontrol edip değeri düzeltin.") + "</div>" : "") +
        '<div class="a-form">' +
        MK.alan({ id: "w-no", etiket: "Sigorta no", zorunlu: true, hata: h.no, girdi: MK.girdi({ id: "w-no", alan: "no", deger: d.no, sinif: "a-girdi-sicil", ek: ' maxlength="8"', hata: h.no }) }) +
        MK.alan({ id: "w-devre", etiket: "Devre", girdi: MK.girdi({ id: "w-devre", alan: "devre", deger: d.devre, ek: ' maxlength="60"' }) }) +
        MK.alan({ id: "w-tip", etiket: "Tip", zorunlu: true, hata: h.tip, girdi: MK.secim({ id: "w-tip", ad: "Tip", deger: d.tip, secenekler: [["B", "B"], ["C", "C"], ["D", "D"]], ipucu: "Tip seçin", gecersiz: !!h.tip, tanim: "w-tip-ipucu" }) }) +
        MK.alan({ id: "w-akim", etiket: "Anma akımı (A)", zorunlu: true, hata: h.akim, girdi: MK.girdi({ id: "w-akim", alan: "akim", deger: d.akim, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"', hata: h.akim }) }) +
        MK.alan({ id: "w-kutup", etiket: "Kutup", zorunlu: true, girdi: MK.secim({ id: "w-kutup", ad: "Kutup", deger: d.kutup, secenekler: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], tanim: "w-kutup-ipucu" }) }) +
        MK.alan({ id: "w-rcd", etiket: "Kaçak akım (mA)", girdi: MK.girdi({ id: "w-rcd", alan: "rcd", deger: d.rcd, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"' }) }) +
        /* formatın 6.1 linye sütunları (2026-09-28): etiketten Icu, ölçülen / projedeki kesitler, Ib, Iz, RCD testi — boş bırakılabilir */
        LINYE_ALAN.filter(function (a) { return a[0] !== "id" && a[0] !== "td" || String(d.rcd || "").trim(); }).map(function (a) {
          return MK.alan({ id: "w-" + a[0], etiket: a[1], hata: h[a[0]], girdi: MK.girdi({ id: "w-" + a[0], alan: a[0], deger: d[a[0]], sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="6"', hata: h[a[0]] }) }); }).join("") +
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
            (String(d.rcd || "").trim() ? MK.alan({ id: "w-rcdTip", etiket: "RCD tipi", girdi: MK.secim({ id: "w-rcdTip", ad: "RCD tipi", deger: d.rcdTip, secenekler: [["AC", "AC"], ["A", "A"], ["F", "F"], ["B", "B"]], tanim: "w-rcdTip-ipucu" }) }) : "") +
            MK.alan({ id: "w-priz", etiket: "Priz devresi", zorunlu: true, girdi: MK.secim({ id: "w-priz", ad: "Priz devresi", deger: d.priz, secenekler: [["evet", "Evet"], ["hayir", "Hayır"]], tanim: "w-priz-ipucu" }) })
          : MK.alan({ id: "w-idn", etiket: "IΔn (mA)", zorunlu: true, girdi: MK.secim({ id: "w-idn", ad: "IΔn", deger: d.idn, secenekler: [["30", "30"], ["100", "100"], ["300", "300"], ["500", "500"]], tanim: "w-idn-ipucu" }) }) +
            /* selektivite (formatın 5.2 sütunları) */
            MK.alan({ id: "w-gecikme", etiket: "Açma zamanı gecikmesi (ms)", hata: h.gecikme, girdi: MK.girdi({ id: "w-gecikme", alan: "gecikme", deger: d.gecikme, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="4"', hata: h.gecikme }) }) +
            MK.alan({ id: "w-sonPano", etiket: "Son tüketim noktasını besleyen pano", girdi: MK.girdi({ id: "w-sonPano", alan: "sonPano", deger: d.sonPano, ek: ' maxlength="60"' }) })) +
        "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Ekle", ikon: "plus" });
    } else if (W.tur === "pd" || W.tur === "zi") {
      var A = SATIR_ALAN[W.tur];
      $("a-pencere-baslik").textContent = (W.tur === "pd" ? "Potansiyel dengeleme" : "Zemin izolasyonu") + (W.i === null ? " · ekle" : " · düzelt");
      $("a-pencere-govde").innerHTML = '<div class="a-form">' + A.map(function (a, j) {
        return MK.alan({ id: "w-" + a[0], etiket: a[1], zorunlu: !j, hata: h[a[0]], girdi: MK.girdi({ id: "w-" + a[0], alan: a[0], deger: d[a[0]], sinif: j ? "a-girdi-sicil" : "", ek: j ? ' inputmode="decimal" maxlength="7"' : ' maxlength="60"', hata: h[a[0]] }) }); }).join("") + "</div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: W.i === null ? "Ekle" : "Kaydet", ikon: W.i === null ? "plus" : "check" });
    } else if (W.tur === "cihaz") {
      /* yalnız o satırın cihaz türünden, denetçinin zimmetindeki kalibrasyonu geçerli cihazlar; yoksa söylenir (reisim 2026-09-28) */
      var ct = MV.cihazTuru(W.c), l = MV.eklenebilirCihazlar(W.r.kisi, [W.c]);
      $("a-pencere-baslik").textContent = "Cihaz ekle · " + ct.ad;
      $("a-pencere-govde").innerHTML = (h.sec ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-x", h.sec) + "</div>" : "") +
        (l.length ? '<fieldset class="a-cihaz-grup"><legend class="a-gizli">' + kacis(ct.ad) + "</legend>" + l.map(function (v) {
          return '<label class="a-onay-kutusu"><input type="radio" name="w-cihaz" data-cihaz-sec="' + v.id + '"' + (d.sec.indexOf(v.id) >= 0 ? " checked" : "") + '><span><b>' + kacis(v.ad) + '</b> · <span class="a-kod">' + v.seri +
            "</span> · kalibrasyon " + MK.tarihYaz(v.kal[0].tarih) + "</span></label>"; }).join("") + "</fieldset>"
          : '<p class="a-bos-satir">Zimmetinizde kalibrasyonu geçerli ' + kacis(ct.ad.toLocaleLowerCase("tr")) + " yok.</p>" + cihazNerede(W.c, W.r.kisi));
      $("a-pencere-alt").innerHTML = l.length ? MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "cihaz-ekle", ad: "Ekle", ikon: "plus" })
        : MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
    } else if (W.tur === "zorunlu") {
      /* §3.8 kural 5 (reisim 2026-09-28): uyarı listesi yok; yalnız zorunlu alan boşsa bu pencere, kapanınca ilk eksik alana kayılır */
      $("a-pencere-baslik").textContent = "Zorunlu alanlar doldurulmadı";
      $("a-pencere-govde").innerHTML = '<p class="a-pencere-metin">Eksik alanlar kırmızıyla işaretlendi.</p>';
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Tamam" });
    }
    if (odak) { var el = $(odak); if (el) { el.focus(); if (el.setSelectionRange && el.type === "text") el.setSelectionRange(el.value.length, el.value.length); } }
  }
  /* zimmette yoksa bu türün cihazları nerede (2026-09-28, Kalem M; çıkmaz yok): kimde · kalibrasyon; geçerli olan için Zimmetler'de teslim
     penceresine bağlantı — teslim alındıktan sonra rapora dönünce bu pencerede listelenir (zimmet kaydı sayfalar arası kalıcı) */
  function cihazNerede(c, kisi) {
    var l = MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz" && v.cihazTur === c && MV.kimde(v.id) !== kisi; });
    if (!l.length) return '<p class="a-pencere-metin">Firmada bu türden cihaz kayıtlı değil.</p>';
    return '<ul class="a-kosullar">' + l.map(function (v) {
      var k = MV.kimde(v.id), yer = k === "depo" ? "Depoda" : k === "lab" ? "Kalibrasyonda" : MV.kisi(k) ? MV.kisi(k).ad + " zimmetinde" : k, gec = MV.kalDurum(v) === "gecti";
      return '<li class="a-kosul-bilgi">' + ikon(gec ? "circle-x" : "gauge", "a-ikon-kucuk") + '<span><span class="a-kod">' + v.env + "</span> · " + yer + (gec ? " · kalibrasyonu geçmiş" : "") + "</span>" +
        (gec || k === "lab" ? "" : '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(9, "#/teslim/" + v.id + "?alan=" + kisi) + '">Zimmet teslimi</a>') + "</li>"; }).join("") + "</ul>";
  }
  function pencereAc(o) {
    W = o; W.hata = {}; pencereCiz(); $("a-pencere").showModal();
    if (o.tur === "zorunlu") document.querySelector('#a-pencere-alt [data-eylem="pencere-kapat"]').focus();
    else if (o.tur === "cihaz") (document.querySelector("#a-pencere [data-cihaz-sec]") || document.querySelector('#a-pencere [data-eylem="pencere-kapat"]')).focus();
    else if (o.tur === "nokta" || o.tur === "rcd") $("w-ad").focus();
    else if (o.tur === "pd" || o.tur === "zi") $("w-yer").focus();
    else if (o.tur === "kopya") $("w-kod").focus();
    else $(o.x ? "w-tip" : "w-no").focus();
  }
  function pencereKaydet() {
    var d = W.d, h = {}, r = W.r;
    if (W.tur === "kopya") {
      d.kod = String(d.kod || "").replace(/\s+/g, "").replace(/[a-z]/g, function (c) { return c.toUpperCase(); });
      var kh = kodDurumu(d.kod); if (kh) { W.hata = { kod: kh }; pencereCiz("w-kod"); return; }
      if (MV.gunlukSure(r.kisi).dolu) { W.hata = { kod: "Günlük süre doldu (mesai takibi); bugün yeni rapor oluşturulamaz." }; pencereCiz("w-kod"); return; }   /* 212 */
      var pg = MV.planGunu(r.e.plan); if (pg && pg > MK.BUGUN) { W.hata = { kod: "Plan günü " + MK.tarihYaz(pg) + "; rapor o gün oluşturulabilir." }; pencereCiz("w-kod"); return; }   /* P1 */
      if (!W.oku) { r.kayit = MK.simdi(); r.degisti = false; }
      var y = kopyala(r, { kod: d.kod, seri: "", konum: String(d.konum || "").trim() });
      W = null; $("a-pencere").close(); MK.kaliciYaz();
      location.hash = "#/r/" + y.kod + "?no=" + y.no + "&durum=taslak";
      MK.bildir((r.degisti === false ? "Rapor kaydedildi; " : "") + y.kod + " açıldı: " + y.no + ". Bilgiler " + r.e.kod + " raporundan kopyalandı.");
      return;
    }
    if (W.tur === "pd" || W.tur === "zi") {
      var A = SATIR_ALAN[W.tur], tur = W.tur;
      if (!String(d.yer || "").trim()) h.yer = "Yazılmalı.";
      A.slice(1).forEach(function (a) { if (!ondalik(d[a[0]])) h[a[0]] = "Sayı yazın."; });
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      var x = {}; A.forEach(function (a) { x[a[0]] = String(d[a[0]] || "").trim(); });
      if (W.i === null) r[tur].push(x); else r[tur][W.i] = x;
      $("a-pencere").close(); degisti(r); ciz(tur === "pd" ? "r-bp-b" : "r-bz-b"); MK.bildir(x.yer + (W.i === null ? " eklendi." : " güncellendi.")); return;
    }
    if (W.tur === "nokta" || W.tur === "rcd") {
      var nk = W.tur === "nokta";
      if (!d.ad.trim()) h.ad = "Adı yazılmalı.";
      if (nk && !d.egri) h.egri = "Eğri seçilmeli.";
      if (!nk && !d.tip) h.tip = "Tip seçilmeli.";
      if (!/^\d{1,4}$/.test(d.In.trim())) h.In = "Amper, tam sayı.";
      if (!nk && !ondalik(d.gecikme)) h.gecikme = "Sayı yazın.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      if (nk) r.nokta.push({ ad: d.ad.trim(), egri: d.egri, In: +d.In, zx: "", rcd: d.rcd.trim(), priz: d.priz === "evet", rcdTip: d.rcd.trim() ? d.rcdTip || "A" : "", rcdId: "", rcdTd: "" });
      else r.rcdler.push({ ad: d.ad.trim(), tip: d.tip, In: +d.In, idn: +d.idn, id: "", td: "", gecikme: String(d.gecikme || "").trim(), sonPano: String(d.sonPano || "").trim() });
      $("a-pencere").close(); degisti(r); ciz(nk ? "r-zx" + (r.nokta.length - 1) : "r-ri" + (r.rcdler.length - 1));
      MK.bildir((nk ? "Ölçüm noktası" : "RCD") + " eklendi: " + d.ad.trim() + "."); return;
    }
    {
      if (!/^[A-Z]{1,2}\d{1,3}$/.test(d.no.trim())) h.no = "ör. F4";
      else if (r.sigorta && r.sigorta.some(function (x) { return x.no === d.no.trim() && x !== W.x; })) h.no = "Bu numara listede var.";
      if (!d.tip) h.tip = "Tip seçilmeli.";
      if (!/^\d{1,3}$/.test(d.akim.trim())) h.akim = "Amper, tam sayı.";
      LINYE_ALAN.forEach(function (a) { if (!ondalik(d[a[0]])) h[a[0]] = "Sayı yazın."; });
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      var x = W.x || { guven: "yuksek" }; Object.assign(x, { no: d.no.trim(), devre: d.devre.trim() || "—", tip: d.tip, akim: +d.akim, kutup: +d.kutup, rcd: d.rcd.trim(), durum: "onayli" });
      LINYE_ALAN.forEach(function (a) { x[a[0]] = String(d[a[0]] || "").trim(); }); if (!x.rcd) { x.id = ""; x.td = ""; }
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
    if (W && $("a-pencere").open) { var once = !!String(W.d.rcd || "").trim(); W.d[k] = e.target.value; if ((W.tur === "sigorta" || W.tur === "nokta") && k === "rcd" && once !== !!e.target.value.trim()) pencereCiz("w-rcd"); return; }
    var r = aktif(); if (!r) return;
    if (UY === r && e.target.value.trim() && !/^t\d+$/.test(k)) e.target.removeAttribute("aria-invalid");   /* doldurulan alanın işareti kalkar */
    if (["amac", "notlar", "bolumAd", "marka", "model", "seri", "imal", "konum"].indexOf(k) >= 0) r[k] = e.target.value;
    else if (/^t\d+$/.test(k)) {   /* test değeri: sınır dışıysa kırmızı, odak yerinde */
      var i = +k.slice(1), x = MV.testler(r.t)[i]; r.test[i] = e.target.value;
      if (testSonuc(x, r.test[i]) === false || UY === r && testZorunlu(x) && !testDolu(x, r.test[i])) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid");
    } else if (/^[ds]-/.test(k)) r[k[0] === "d" ? "detay" : "tespit"][k.slice(2)] = e.target.value;
    else if (/^zx\d+$/.test(k)) {   /* ölçüm noktası: Ik1 ve not yerinde hesaplanır, odak kaçmaz */
      var n = r.nokta[+k.slice(2)], h; n.zx = e.target.value; h = MV.noktaHesap(n);
      $("r-ik" + k.slice(2)).textContent = h.ik ? h.ik + " A" : "—";
    } else if (/^n[it]\d+$/.test(k)) {   /* ölçüm noktası RCD testi */
      var nn = r.nokta[+k.slice(2)]; nn[k[1] === "i" ? "rcdId" : "rcdTd"] = e.target.value;
    } else if (/^r[it]\d+$/.test(k)) {
      var x2 = r.rcdler[+k.slice(2)]; x2[k[1] === "i" ? "id" : "td"] = e.target.value;
    }
    degisti(r); ozetYenile(r);
  };
  /* zorunlu alan doldukça bölümün "Eksik" işareti kalkar (odak kaçmaz) */
  function ozetYenile(r) { if (UY !== r) return; var e = {}; zorunluEksik(r).forEach(function (x) { e[x.bolum] = true; });   /* yazdıkça bölüm işareti kalkar */
    document.querySelectorAll(".a-bolum-eksik").forEach(function (d) { if (!e[d.id]) { d.classList.remove("a-bolum-eksik"); var z = d.querySelector("summary .a-rozet-red"); if (z) z.remove(); } }); }
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) { W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return; }
    var r = aktif(); if (/^r-kc\d+$/.test(id)) { r.kriter[+id.slice(4)].c = deger; degisti(r); ciz(id); }
    else if (id === "r-sonuc") { r.sonuc = deger; degisti(r); ciz(id); }
    else if (/^r-kd\d+$/.test(id)) { r.kriter[+id.slice(4)].derece = deger; degisti(r); ciz(id); }
    else if (/^r-[nr]n\d+$/.test(id)) { r[id[2] === "n" ? "nokta" : "rcdler"][+id.slice(4)].not = +deger; degisti(r); ciz(id); }   /* uygunluk notu (P2) */
    else if (/^r-dv\d+$/.test(id)) { var x = devreden(r)[+id.slice(4)]; if (x) { (r.devir = r.devir || {})[x.id] = deger; degisti(r); ciz(id); } }
    else if (/^r-[ds]-/.test(id)) { r[id[2] === "d" ? "detay" : "tespit"][id.slice(4)] = deger; degisti(r); ciz(id); }
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
  /* ön izleme: rapordaki güncel değerlerle PDF belgesi (MB.belge, o.r = rapor); pencerede "İndir" PDF olarak kaydeder */
  function belgeVeri(r) {
    var isg = MV.isgTesis(r.ts.id).filter(function (x) { return x.k === r.kisi; })[0];
    return { e: r.e, ts: r.ts, m: MV.musteri(r.ts.m), p: MV.kisi(r.kisi), isg: isg, cihaz: cihazlar(r), tarih: r.rtarih || r.bas.slice(0, 10), bas: r.bas.slice(11, 16),
      bit: r.bit.slice(11, 16), sonraki: r.sonraki, no: r.no, sonuc: r.sonuc === "kullanilamaz" ? "Kusurlu" : "Uygun", imza: null, r: r, kusurlar: kusurListe(r) };
  }
  X["on-izle"] = function () { var r = aktif(); MK.pdfGoster({ dosya: r.no + ".pdf", baslik: r.no, icerik: MB.belge(r.t, belgeVeri(r)), sayfa: 1 }); };
  X["rapor-sil-ac"] = function () {   /* plan içinde de aynı (maket.js) */
    var r = aktif(); if (!silinebilir(r)) return;
    MK.onayla({ baslik: "Raporu sil", metin: '<span class="a-rapor-no">' + r.no + "</span> ve içine yazılan her şey (fotoğraflar" + (r.geriler.length || r.geri ? ", geri gönderme geçmişi" : "") + " dahil) silinir; geri alınamaz.", tus: "Sil", tamam: function () {
      var no = r.no, pid = r.ts.pid, i = MV.RAPORLAR.indexOf(MV.rapor(no));
      if (i >= 0) MV.RAPORLAR.splice(i, 1);
      [r.fotoAd || []].concat(r.kriter.map(function (x) { return x.fotoAd || []; })).forEach(function (l) { l.forEach(function (f) { if (f) MK.dosyaSil(f); }); });
      delete KAYIT[no]; Object.keys(R).forEach(function (k) { if (R[k] && R[k].no === no) delete R[k]; });
      MK.kaliciYaz(); location.href = MK.adres(13, pid ? "#/plan/" + pid : "#/");   /* rapor plandan da kalkar (Planlar ortak kayda bakar) */
    } });
  };
  X["madde-bilgi"] = function (el) { var r = aktif(), i = +el.dataset.i, k = r && r.no + ":" + i; if (!r) return; BILGI[k] = !BILGI[k]; ciz("r-kb" + i); };
  X["format-guncelle"] = function () {
    var r = aktif(); if (!r || r.durum !== "taslak") return;
    var yeni = MV.kriterler(r.t), once = r.kriter.length, eklenen = Math.max(0, yeni.length - once);
    r.kriter = yeni.map(function (ad, i) { return r.kriter[i] || { c: "uygun", not: "" }; });   /* eşleşen madde cevabını korur, yeni madde Uygun gelir (§3.8 kural 3) */
    r.sablon = r.t.sablon; degisti(r); ciz();
    var h = document.querySelector("h1"); if (h) h.focus();
    MK.bildir("Format güncellendi (" + r.sablon + "): " + (eklenen ? eklenen + " yeni madde eklendi (Uygun)" : "madde değişmedi") + "; cevaplar korundu.");
  };
  X["kopya-ac"] = function () {
    var r = aktif(); if (!r) return;
    pencereAc({ tur: "kopya", r: r, oku: r.durum !== "taslak", d: { kod: "", seri: "", konum: r.konum || "" } });
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
    r.sigorta = SIGORTA.map(function (s) { return { no: s[0], devre: s[1], tip: s[2], akim: s[3], kutup: s[4], rcd: s[5], icu: s[4] > 1 ? "10" : "6", faz: "", npen: "", pe: "", ib: "", iz: "", id: "", td: "", guven: s[6] || "yuksek", durum: "oneri" }; });
    ciz(); var t = document.querySelector('[data-eylem="sigorta-oku"]'); if (t) t.focus();
    MK.bildir("Pano fotoğrafından " + r.sigorta.length + " sigorta okundu; öneriler onayınızı bekliyor.");
  };
  X["sigorta-onayla"] = function () {
    var r = aktif(), n = 0; r.sigorta.forEach(function (x) { if (x.durum !== "onayli" && x.guven !== "dusuk") { x.durum = "onayli"; n++; } });
    ciz("r-b6-b"); MK.bildir(n + " öneri onaylandı; emin olunmayan satırlar tek tek kontrol edilir.");
  };
  X["sigorta-ac"] = function (el) {
    var r = aktif(), x = r.sigorta.filter(function (y) { return y.no === el.dataset.no; })[0];
    var d = { no: x.no, devre: x.devre, tip: x.tip, akim: String(x.akim), kutup: String(x.kutup), rcd: x.rcd }; LINYE_ALAN.forEach(function (a) { d[a[0]] = x[a[0]] || ""; });
    pencereAc({ tur: "sigorta", r: r, x: x, d: d });
  };
  X["sigorta-ekle"] = function () { var r = aktif(); pencereAc({ tur: "sigorta", r: r, x: null, d: { no: "F" + ((r.sigorta || []).length + 1), devre: "", tip: "", akim: "", kutup: "1", rcd: "", icu: "", faz: "", npen: "", pe: "", ib: "", iz: "", id: "", td: "" } }); };
  X["pencere-kaydet"] = pencereKaydet;
  X["satir-ekle"] = function (el) { var d = {}; SATIR_ALAN[el.dataset.tur].forEach(function (a) { d[a[0]] = ""; }); pencereAc({ tur: el.dataset.tur, r: aktif(), i: null, d: d }); };
  X["satir-duzelt"] = function (el) { var r = aktif(), x = r[el.dataset.tur][+el.dataset.i]; pencereAc({ tur: el.dataset.tur, r: r, i: +el.dataset.i, d: Object.assign({}, x) }); };
  X["satir-kaldir"] = function (el) { var r = aktif(), tur = el.dataset.tur, x = r[tur].splice(+el.dataset.i, 1)[0]; degisti(r); ciz(tur === "pd" ? "r-bp-b" : "r-bz-b"); MK.bildir(x.yer + " kaldırıldı."); };
  X["nokta-ekle"] = function () { pencereAc({ tur: "nokta", r: aktif(), d: { ad: "", egri: "", In: "", rcd: "", priz: "hayir", rcdTip: "A" } }); };
  X["rcd-ekle"] = function () { pencereAc({ tur: "rcd", r: aktif(), d: { ad: "", tip: "", In: "", idn: "30", gecikme: "", sonPano: "" } }); };
  X["nokta-kaldir"] = function (el) { var r = aktif(), x = r.nokta.splice(+el.dataset.i, 1)[0]; degisti(r); ciz("r-b5-b"); MK.bildir(x.ad + " kaldırıldı."); };
  X["rcd-kaldir"] = function (el) { var r = aktif(), x = r.rcdler.splice(+el.dataset.i, 1)[0]; degisti(r); ciz("r-b5-b"); MK.bildir(x.ad + " RCD'si kaldırıldı."); };
  /* Onaya gönder (§3.8 kural 5, reisim 2026-09-28): zorunlu alanlar doluysa doğrudan gönderilir; boşsa bölümler açılır, alanlar kırmızı,
     "Zorunlu alanlar doldurulmadı" penceresi; kapanınca ekran ilk eksik alana kayar */
  X["onaya-gonder"] = function () {
    var r = aktif(), eks = zorunluEksik(r);
    if (!eks.length) { gonder(r); return; }
    UY = r; eks.forEach(function (x) { ACIK[x.bolum] = true; }); ciz();
    pencereAc({ tur: "zorunlu", r: r, d: {}, eks: eks });
  };
  function eksikeGit(x) {
    var b = $(x.bolum); if (!b) return; b.open = true; ACIK[b.id] = true;
    var a = b.querySelector(x.alan) || b, sat = a.closest("tr"),
      g = a.matches("input, textarea, button") ? a : a.querySelector("input, textarea, button") || (sat && sat.querySelector("button")) || $(b.id + "-b");
    a.scrollIntoView({ block: "center" }); if (g) g.focus({ preventScroll: true });
  }
  $("a-pencere").addEventListener("close", function () { if (W && W.tur === "zorunlu") { var x = W.eks[0]; W = null; eksikeGit(x); } });
  X["kriter-toplu"] = function (el) {
    var r = aktif(), n = 0; for (var i = +el.dataset.bas; i < +el.dataset.son; i++) { if (r.kriter[i].c !== el.dataset.deger) n++; r.kriter[i].c = el.dataset.deger; }
    degisti(r); ciz(el.dataset.odak || "r-kt" + el.dataset.bas);
    MK.bildir((+el.dataset.son - +el.dataset.bas) + " madde " + ad2(KRITER, el.dataset.deger).toLocaleLowerCase("tr") + " işaretlendi.");
  };
  /* fotoğraf silinir (reisim 2026-09-28: "yüklenilen şeyler düzenlenebilir silinebilir olmalı"); onay penceresiyle */
  function fotoSil(o, i, ad, odak) {
    MK.onayla({ baslik: "Fotoğrafı sil", metin: ad + " silinir.", tamam: function () {
      var r = aktif(), f = (o.fotoAd || [])[i]; o.foto--; if (o.fotoAd) o.fotoAd.splice(i, 1); if (f) MK.dosyaSil(f); degisti(r); ciz(); var t = document.querySelector(odak); if (t) t.focus(); MK.bildir(ad + " silindi.");
    } });
  }
  X["foto-sil"] = function (el) { fotoSil(aktif(), +el.dataset.i, "Fotoğraf " + (+el.dataset.i + 1), "#r-b7 [data-secici-ac]"); };
  X["kusur-foto-sil"] = function (el) { var k = +el.dataset.k; fotoSil(aktif().kriter[k], +el.dataset.i, "Madde fotoğrafı " + (+el.dataset.i + 1), "#r-k" + k + " [data-secici-ac]"); };
  X["kusur-foto"] = function (el) {
    var i = +el.dataset.i;
    fotoSec(el, function (ad, nereden) {
      var r = aktif(), x = r.kriter[i]; x.foto = (x.foto || 0) + 1; (x.fotoAd = x.fotoAd || [])[x.foto - 1] = ad; degisti(r); ciz();
      var t = document.querySelector("#r-k" + i + " [data-secici-ac]"); if (t) t.focus();
      MK.bildir("Madde " + (i + 1) + " için fotoğraf eklendi (" + nereden + ").");
    });
  };
  /* ortak kayıttaki sonuç adı (Onaylar, Raporlar, Planlar bunu yazar): formatlı türde hafif / ağır, ötekinde Kusurlu */
  function sonucAdi(r) {
    if (r.sonuc !== "kullanilamaz") return "Uygun";
    var l = kusurListe(r), agir = l.some(function (x) { return /Ağır/.test(x[1]); }) || sinirDisi(r) || fonkKusur(r);   /* 5.1 · 5.2 ağırlığı notun metninden, listede (P2) */
    return !MV.kusurSinifli(r.t) ? "Kusurlu" : agir ? "Ağır kusurlu" : l.length ? "Hafif kusurlu" : "Kusurlu";
  }
  function gonder(r) {
    UY = null;
    var gri = r.geri; if (r.geri) r.geriler.unshift(r.geri);
    var oto = !r.sonuc; if (oto) r.sonuc = otoSonuc(r);   /* seçilmediyse kriterlere göre (reisim 2026-09-27) */
    r.durum = "onayda"; r.gonderildi = MK.simdi(); r.geri = null; r.kayit = r.gonderildi; r.degisti = false; if (!r.bitEl) r.bit = r.gonderildi;
    /* ortak kayda: Onaylar'ın kuyruğuna düşer, Planlar ve Raporlar durumu görür (Kalem M) */
    var kay = MV.rapor(r.no);
    if (!kay) { kay = { no: r.no, kod: r.e.kod, tesis: r.e.tesis, plan: r.e.plan || null, kisi: r.kisi, olustu: r.olustu || r.bas, onay: null, imza: null }; MV.RAPORLAR.push(kay); }
    /* süreç geçmişi (2026-09-29, 35. tur 166): ilk gönderim ve her geri gönderme → yeniden gönderim (performansta "Düzeltme" adımı) */
    var gri2 = gri || kay.geri;
    Object.assign(kay, { durum: "onayda", gonderildi: r.gonderildi, sonuc: sonucAdi(r), geri: null, devir: JSON.parse(JSON.stringify(r.devir || {})), ilkGonderim: kay.ilkGonderim || r.gonderildi,
      duzeltmeler: (kay.duzeltmeler || []).concat(gri2 ? [{ geri: gri2.zaman, gonderim: r.gonderildi }] : []) });
    ciz(); window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true });
    MK.bildir("Onaya gönderildi: " + MV.kisi(YON[r.t.b]).ad + ", " + MV.bransAd(r.t.b).toLocaleLowerCase("tr") + " branş yöneticisi." +
      (oto ? " Sonuç kriterlere göre: " + (r.sonuc === "kullanilir" ? "Uygun" : "Uygun değil") + "." : ""));
  }

  /* Z2: S.A.Y'ın okuyabildiği (yalnız açık rapor) ve öneriyi uygulayabildiği yollar — öneri, denetçinin seçimiyle aynı yoldan (MK.onSecim) yazılır */
  MK.sayBag = { rapor: aktif, eksik: zorunluEksik, git: eksikeGit, kusurlar: kusurlar, kriterNo: kriterNo, otoSonuc: otoSonuc, uygunDegil: uygunDegil,
    SONUC: SONUC, DERECE: DERECE, ad2: ad2, sinifli: function (r) { return MV.kusurSinifli(r.t); }, kriterAd: function (r, i) { return MV.kriterler(r.t)[i]; } };
  MK.goster = function (odakla) { ACIK = {}; UY = null; ciz(); if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true }); } };
  /* kabuk: raporu yazan denetçi (elektrik raporunu Elif Aydın, mekaniği Mert Kaya) */
  var ilk = aktif(), ben = MV.kisi(ilk ? ilk.kisi : "mk");
  MK.kabuk({ modul: 13, kullanici: { bas: MV.bas(ben.ad), ad: ben.ad, rol: "Denetçi" } });
  ciz();
})();
