/* ══ probata MAKET M8 — Saha ve Rapor (modül 14) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "ekipmandan rapor oluştur deyip … checklistleri doldurup uygunluk belirleyip fotoğraf ekleyip raporu
   teknik yöneticisine onaya gönderecek"), §1.1 ("pano kontrollerinde her sigortanın tek tek elle yazılması … fotoğraftan sigorta bilgileri
   okuma"), §3 (cihaz SEÇİLMEZ, zimmetten gelir; kalibrasyonu geçmiş cihazla rapor açılır ama onaya gönderilemez; fotoğraf en az 1),
   §4.2 (Ek-III 1.7), §4.5 (her kusur ayrı; hafif/ağır yalnız format yürürlükteyse; madde yapıldı/yapılmadı/uygulanamaz), §4.7 (sonraki
   kontrol: inspector gerekçeyle değiştirir), §8.10 (sigorta okuma ÖNERİ; inspector onaylamadan kaydedilmez). Önce tablet ve telefon.
   Örnekler Planlar'daki plan 1'in (P-0926-031, Merkez Fabrika, denetimde) raporları: aynı numara, aynı durum. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var DURUM = { taslak: { ad: "Taslak", rozet: "a-rozet-bekliyor" }, onayda: { ad: "Onayda", rozet: "a-rozet-kabul" }, onaylandi: { ad: "Onaylandı", rozet: "a-rozet-tamam" } };
  var YON = { m: "sy", e: "co" };   /* branş yöneticisi: onay türün branşına gider (§3.2 madde 3) */
  var sayi = function (v) { var x = parseFloat(String(v).replace(",", ".")); return /^\s*\d+([.,]\d+)?\s*$/.test(String(v)) ? x : NaN; };
  var tarihIso = function (s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2] ? null : iso;
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
    var t = MV.tur(e.tur), kr = MV.kriterler(t), ts = MV.testler(t), sinifli = MV.kusurSinifli(t);
    var s = new Date(MK.BUGUN + "T12:00:00"); s.setMonth(s.getMonth() + t.periyot);
    var ts0 = MV.tesis(e.tesis);
    var r = { e: e, t: t, k: k, ts: ts0, basladi: e.tesis === "t1" ? BASLADI : ts0.ptarih ? ts0.ptarih + "T" + (ts0.psaat ? ts0.psaat[0] : "09:00") : null, no: k >= 0 ? MV.raporNo("0926", 786 + k) : q.no || "—", durum: k >= 0 ? (k < 3 ? "onayda" : "taslak") : (DURUM[q.durum] ? q.durum : "onaylandi"),
      olustu: k >= 0 ? saatEkle(10 + k * 6) : null, kisi: t.b === "e" ? "ea" : "mk", kriter: kr.map(function () { return { d: "", s: "", not: "" }; }), test: ts.map(function () { return ""; }),
      foto: 0, metot: "", amac: "", sonuc: "", notlar: "", sigorta: null, sonraki: s.toISOString().slice(0, 10), gerekce: "", geri: null, gonderildi: null };
    var dolu = function () {
      r.kriter.forEach(function (x) { x.d = "yapildi"; x.s = "uygun"; });
      r.test = ts.map(function (x) { return x.ornek; }); r.foto = 2; r.metot = t.std[0] || "uretici"; r.amac = "Üretim ve bakım"; r.sonuc = "kullanilir";
    };
    if (r.durum !== "taslak") { dolu(); r.gonderildi = r.olustu ? saatEkle(60 + k * 9) : null; }
    if (e.kod === "ET-1009") {   /* elektrik iç tesisatı: yarıda; pano sigortaları okunmadı; inspector'ın zimmetinde kalibrasyonu geçmiş cihaz */
      [0, 1, 2].forEach(function (i) { r.kriter[i].d = "yapildi"; r.kriter[i].s = i === 2 ? (sinifli ? "hafif" : "kusurlu") : "uygun"; });
      r.kriter[2].not = "Priz devresindeki kaçak akım rölesinin test düğmesi çalışmıyor; açma süresi ölçümle doğrulandı.";
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
  var kusurlar = function (r) { return r.kriter.filter(function (x) { return x.d === "yapildi" && x.s && x.s !== "uygun"; }); };
  var agir = function (r) { return r.kriter.some(function (x) { return x.d === "yapildi" && (x.s === "agir"); }) || MV.testler(r.t).some(function (x, i) { return testSonuc(x, r.test[i]) === false; }); };
  var elektrik = function (t) { return t.g === "elektrik"; };   /* pano sigortaları bölümü yalnız elektrik grubunda */
  function eksikler(r) {
    var ts = MV.testler(r.t), cev = r.kriter.filter(function (x) { return x.d && (x.d !== "yapildi" || x.s); }).length, kusurNotsuz = kusurlar(r).filter(function (x) { return !x.not.trim(); }).length;
    var girilen = r.test.filter(function (v) { return !isNaN(sayi(v)); }).length, gecti = cihazlar(r).filter(function (v) { return MV.kalDurum(v) === "gecti"; });
    var oneri = r.sigorta ? r.sigorta.filter(function (x) { return x.durum !== "onayli"; }).length : 0;
    return [
      { ok: !!r.metot, metin: r.metot ? "Kontrol metodu seçildi" : "Kontrol metodu seçilmedi", bolum: "r-b1" },
      { ok: !!r.amac.trim(), metin: r.amac.trim() ? "Kullanım amacı yazıldı" : "Kullanım amacı yazılmadı", bolum: "r-b2" },
      { ok: !gecti.length, metin: gecti.length ? "Kalibrasyonu geçmiş cihaz zimmette: " + gecti.map(function (v) { return v.env; }).join(", ") : "Ölçüm aletlerinin kalibrasyonu geçerli", bolum: "r-b3" },
      { ok: cev === r.kriter.length, metin: cev + " / " + r.kriter.length + " kriter cevaplandı", bolum: "r-b4" },
      { ok: !kusurNotsuz, metin: kusurNotsuz ? kusurNotsuz + " kusurun açıklaması yazılmadı" : "Kusur açıklamaları tamam", bolum: "r-b4", gizle: !kusurlar(r).length },
      { ok: girilen === ts.length, metin: girilen + " / " + ts.length + " test değeri girildi", bolum: "r-b5" },
      { ok: !elektrik(r.t) || (!!r.sigorta && !oneri), metin: !r.sigorta ? "Pano sigortaları girilmedi" : oneri ? oneri + " sigorta önerisi onay bekliyor" : "Pano sigortaları onaylandı", bolum: "r-b6", gizle: !elektrik(r.t) },
      { ok: r.foto >= 1, metin: r.foto >= 1 ? r.foto + " fotoğraf" : "Fotoğraf yok (en az 1)", bolum: "r-b7" },
      { ok: !!r.sonuc && !(agir(r) && r.sonuc === "kullanilir"), metin: !r.sonuc ? "Sonuç ve kanaat seçilmedi" : agir(r) && r.sonuc === "kullanilir" ? "Ağır kusur varken “Kullanılabilir” seçilemez" : "Sonuç ve kanaat seçildi", bolum: "r-b8" }
    ].filter(function (x) { return !x.gizle; });
  }

  /* ── ÇİZİM ──────────────────────────────────────────────────────────────────────────────────────────── */
  var bolum = function (no, id, baslik, ic, ek) {
    return '<section class="a-form-bolum a-bolum-rapor" id="' + id + '" aria-labelledby="' + id + '-b"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="' + id + '-b" tabindex="-1">' + no + " · " + baslik + "</h2>" + (ek || "") + "</div>" + ic + "</section>";
  };
  var segmen = function (ad, k, deger, secenekler, kapali) {
    return '<div class="a-sekmeler" role="group" aria-label="' + kacis(ad) + '">' + secenekler.map(function (s) {
      return '<button type="button" class="a-sekme' + (s[2] ? " " + s[2] : "") + '" data-segmen="' + k + '" data-deger="' + s[0] + '" aria-pressed="' + (deger === s[0]) + '"' + (kapali ? " disabled" : "") + ">" + s[1] + "</button>";
    }).join("") + "</div>";
  };
  function ciz(odak) {
    var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1], r = kod ? rapor(kod) : null;
    if (!r) {
      $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu ekipman için açılmış rapor yok. Rapor, plan içinde ekipmanın satırındaki “Rapor oluştur” ile açılır.",
          eylem: '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/plan/1") + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Plana dön</a>" });
      document.title = "Rapor bulunamadı · probata maket"; return;
    }
    var t = r.t, e = r.e, oku = r.durum !== "taslak", sinifli = MV.kusurSinifli(t), eks = eksikler(r), eksik = eks.filter(function (x) { return !x.ok; });
    var PL = r.ts, p = MV.kisi(r.kisi), yon = MV.kisi(YON[t.b]), isg = MV.isgTesis(PL.id).filter(function (x) { return x.k === r.kisi; })[0], ci = cihazlar(r);
    var sonuclar = sinifli ? [["uygun", "Uygun", "a-sekme-onay"], ["hafif", "Hafif kusur", "a-sekme-uyari"], ["agir", "Ağır kusur", "a-sekme-hata"]] : [["uygun", "Uygun", "a-sekme-onay"], ["kusurlu", "Kusurlu", "a-sekme-hata"]];
    var metotlar = t.std.map(function (k) { var s = MV.standart(k); return [k, s.no + ":" + s.surum, s.konu]; }).concat([["uretici", "Üretici talimatı"], ["risk", "Risk değerlendirmesi"]]);
    var metotAd = (metotlar.filter(function (x) { return x[0] === r.metot; })[0] || [])[1];
    var cevaplanan = r.kriter.filter(function (x) { return x.d && (x.d !== "yapildi" || x.s); }).length;
    $("a-rapor").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], [PL.plan || PL.ad, PL.pid ? MK.adres(13, "#/plan/" + PL.pid) : MK.adres(13, "#/")], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + e.kod + " · " + kacis(t.ad) + "</h1>" + rozet(DURUM[r.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + r.no + "</span> · " + kacis(PL.ad) + " · " + kacis(MV.musteri(PL.m).kisa) + " · " + kacis(p.ad) + "</span></p></div></div>" +
      '<div class="a-uyari-serit">' +
        (r.geri && !oku ? MK.serit("uyari", "undo-2", "<b>Geri gönderildi</b> · " + kacis(MV.kisi(r.geri.kim).ad) + " · " + MK.zamanYaz(r.geri.zaman) + ": “" + kacis(r.geri.gerekce) + "”") : "") +
        (oku ? MK.serit("bilgi", "lock", r.durum === "onayda" ? "Onayda: " + kacis(yon.ad) + " (" + MV.bransAd(t.b).toLocaleLowerCase("tr") + " branş yöneticisi) onaylar ya da gerekçeyle geri gönderir. Bu sırada düzenlenemez." + (r.gonderildi ? " Gönderildi " + MK.zamanYaz(r.gonderildi) + "." : "") : "Onaylandı: inspector son imzayı atınca müşteriye açılır. Düzeltme revizyonla yapılır.") : "") +
      "</div>" +
      (oku ? "" : '<section class="a-form-bolum a-bolum-rapor" aria-labelledby="r-kontrol-b"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="r-kontrol-b">Onaya göndermeden önce</h2><span class="a-sayac" id="r-eksik-say">' +
        (eksik.length ? "<b>" + eksik.length + "</b> eksik" : "Hazır") + "</span></div>" +
        '<ul class="a-kosullar" id="r-kontrol">' + eks.map(function (x) {
          return '<li class="' + (x.ok ? "a-kosul-tamam" : "a-kosul-eksik") + '">' + ikon(x.ok ? "circle-check" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x.metin) + "</span>" +
            (x.ok ? "" : '<button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="bolume-git" data-hedef="' + x.bolum + '">Git</button>') + "</li>";
        }).join("") + "</ul></section>") +
      '<div class="a-rapor-bolumler">' +
      bolum(1, "r-b1", "Genel bilgiler", '<dl class="a-bilgi">' +
          bilgi("İşyeri", kacis(MV.musteri(PL.m).unvan), true) + bilgi("SGK işyeri sicil no", '<span class="a-kod a-kod-uzun">' + PL.sgk + "</span>", "cift") +
          bilgi("Sözleşme no (İSG-KATİP)", isg ? '<span class="a-kod">' + isg.no + "</span>" : '<span class="a-uyari-metin">Kayıt yok</span>') +
          bilgi("Başlangıç", (r.olustu || r.basladi) ? MK.zamanYaz(r.olustu || r.basladi) + '<span class="a-alt-satir">rapor açıldı</span>' : '<span class="a-deger-yok">—</span>') +
          bilgi("Bitiş", r.gonderildi ? MK.zamanYaz(r.gonderildi) : '<span class="a-deger-yok">Onaya gönderilince</span>') +
          bilgi("Sonraki kontrol", MK.tarihYaz(r.sonraki) + (r.gerekce ? '<span class="a-alt-satir">değiştirildi: ' + kacis(r.gerekce) + "</span>" : '<span class="a-alt-satir">bugün + ' + t.periyot + " ay</span>")) +
        "</dl>" +
        '<div class="a-form a-bolum-serit">' +
          MK.alan({ id: "r-metot", etiket: "Kontrol metodu", zorunlu: !oku, ipucu: "Türün standartları; yoksa üretici talimatı ya da risk değerlendirmesi (Ek-III 1.7.1.1)", genis: true,
            girdi: oku ? '<input class="a-girdi a-girdi-oku" id="r-metot" readonly value="' + kacis(metotAd || "—") + '" aria-describedby="r-metot-ipucu">' : MK.secim({ id: "r-metot", ad: "Kontrol metodu", deger: r.metot, secenekler: metotlar, ipucu: "Metot seçin", tanim: "r-metot-ipucu" }) }) +
        "</div>" +
        (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sonraki-ac", ad: "Sonraki kontrolü değiştir", ikon: "calendar-check", sinif: "a-tus-ikincil" }) + "</div>")) +
      bolum(2, "r-b2", "Ekipman", '<dl class="a-bilgi">' + bilgi("Kod", '<span class="a-kod">' + e.kod + "</span>") + bilgi("Marka / model", kacis(e.marka + " " + e.model)) +
          bilgi("Seri no", '<span class="a-kod">' + e.seri + "</span>") + bilgi("İmal yılı", e.imal) + bilgi("Kullanım yeri", kacis(e.konum)) +
          bilgi("Önceki kontrol", e.onceki ? MK.tarihYaz(e.onceki.tarih) + '<span class="a-alt-satir">' + kacis(e.onceki.sonuc) + " · <span class=\"a-rapor-no\">" + e.onceki.rapor + "</span></span>" : '<span class="a-deger-yok">İlk kontrol</span>') + "</dl>" +
        '<p class="a-bolum-aciklama a-bolum-serit">Etiket bilgisi ekipman kaydından gelir; farklıysa ekipman sayfasında düzeltilir (kayıt tüm raporlar için ortak).</p>' +
        '<div class="a-form">' + MK.alan({ id: "r-amac", etiket: "Kullanım amacı", zorunlu: !oku, genis: true, ipucu: "Ek-III 1.7.2.2 — tespit edilen bilgi",
          girdi: MK.girdi({ id: "r-amac", alan: "amac", deger: r.amac, ek: ' maxlength="120"' + (oku ? " readonly" : ""), sinif: oku ? "a-girdi-oku" : "" }) }) + "</div>") +
      bolum(3, "r-b3", "Ölçüm aletleri", '<p class="a-bolum-aciklama">Seçilmez: ' + kacis(p.ad) + " zimmetindeki, bu gruba (" + kacis(MV.grup(t.g).ad.toLocaleLowerCase("tr")) + ") uygun cihazlar kendiliğinden gelir.</p>" +
        (ci.length ? '<ul class="a-kosullar">' + ci.map(function (v) {
          var d = MV.kalDurum(v);
          return '<li class="' + (d === "gecti" ? "a-kosul-eksik" : "a-kosul-tamam") + '">' + ikon(d === "gecti" ? "circle-x" : d === "yakin" ? "triangle-alert" : "circle-check", "a-ikon-kucuk") +
            "<span><b>" + kacis(v.ad) + '</b> · <span class="a-kod">' + v.env + "</span> · seri " + v.seri + " · kalibrasyon " + MK.tarihYaz(v.bitis) + (d === "gecti" ? " — geçti: rapor onaya gönderilemez" : d === "yakin" ? " — 30 gün içinde bitiyor" : "") + "</span></li>";
        }).join("") + "</ul>" : '<p class="a-bos-satir">Zimmette bu gruba uygun cihaz yok.</p>') +
        (ci.some(function (v) { return MV.kalDurum(v) === "gecti"; }) && !oku ? '<div class="a-bolum-serit">' + MK.serit("hata", "circle-x", "Kalibrasyonu geçmiş cihaz zimmetinizde: rapor doldurulabilir ama onaya gönderilemez. Cihazı depoya teslim edin ya da kalibrasyona gönderin.") +
          '</div><div class="a-eylem-cubugu a-bolum-serit">' + MK.git({ hedef: 9, hash: "#/?kisi=" + r.kisi, ad: "Zimmetlerim", ikon: "package", ne: "Zimmetler" }) + "</div>" : "")) +
      bolum(4, "r-b4", "Muayene kriterleri", '<p class="a-bolum-aciklama">Her madde ayrı: fiilen yapıldı mı ve sonucu (14/A-1-ç, 14/A-1-d). ' +
          (sinifli ? "Bakanlık formatı " + t.format + " yürürlükte: kusur hafif ya da ağır." : "Bu türde Bakanlık formatı yürürlükte değil: hafif / ağır sınıflandırması yapılmaz.") + "</p>" +
        r.kriter.map(function (x, i) {
          var ad = MV.kriterler(t)[i], kus = x.d === "yapildi" && x.s && x.s !== "uygun";
          return '<div class="a-kriter" id="r-k' + i + '"><p class="a-kriter-ad"><span class="a-kriter-no">' + (i + 1) + "</span><span>" + kacis(ad) + "</span></p>" +
            '<div class="a-kriter-cevap">' + segmen("Madde " + (i + 1) + " yapıldı mı", "d" + i, x.d, [["yapildi", "Yapıldı"], ["yapilmadi", "Yapılmadı"], ["uygulanamaz", "Uygulanamaz"]], oku) +
              (x.d === "yapildi" ? segmen("Madde " + (i + 1) + " sonucu", "s" + i, x.s, sonuclar, oku) : "") + "</div>" +
            (kus ? MK.alan({ id: "r-kn" + i, etiket: "Kusur açıklaması", zorunlu: !oku, ipucu: "Her kusur ayrı yazılır; uygunsuzluk notlara yazılamaz",
              girdi: '<textarea class="a-alan a-alan-ince" id="r-kn' + i + '" data-alan="kn' + i + '" maxlength="300" aria-describedby="r-kn' + i + '-ipucu"' + (oku ? " readonly" : "") + ">" + kacis(x.not) + "</textarea>" }) : "") + "</div>";
        }).join(""), '<span class="a-sayac" id="r-kriter-say"><b>' + cevaplanan + "</b> / " + r.kriter.length + " madde</span>") +
      bolum(5, "r-b5", "Test değerleri", '<div class="a-form">' + MV.testler(t).map(function (x, i) {
          var s = testSonuc(x, r.test[i]);
          return MK.alan({ id: "r-t" + i, etiket: kacis(x.ad) + " (" + x.birim + ")", zorunlu: !oku, ipucu: '<span id="r-t' + i + '-sonuc">' + testIpucu(x, r.test[i]) + "</span>", hata: "",
            girdi: MK.girdi({ id: "r-t" + i, alan: "t" + i, deger: r.test[i], sinif: "a-girdi-sicil" + (oku ? " a-girdi-oku" : ""), ek: ' inputmode="decimal" maxlength="10"' + (oku ? " readonly" : "") + (s === false ? ' aria-invalid="true"' : "") }) });
        }).join("") + "</div>") +
      (elektrik(t) ? bolum(6, "r-b6", "Pano sigortaları", sigortaHtml(r, oku)) : "") +
      bolum(elektrik(t) ? 7 : 6, "r-b7", "Fotoğraflar", '<div class="a-fotolar">' + fotolar(r.foto) + (oku ? "" : MK.tus({ eylem: "foto-ekle", ad: "Fotoğraf çek", ikon: "camera", sinif: "a-tus-ikincil" })) + "</div>" +
        '<p class="a-ipucu">' + (r.foto ? r.foto + " fotoğraf · rapor başına en az 1 (onaya gönderirken denetlenir)" : "Rapor başına en az 1 fotoğraf zorunlu. Telefonda kamera açılır; masaüstünde dosya seçilir.") + "</p>") +
      bolum(elektrik(t) ? 8 : 7, "r-b8", "Sonuç ve kanaat", '<p class="a-bolum-aciklama" id="r-oneri">' + oneri(r, sinifli) + "</p>" +
        segmen("Sonuç ve kanaat", "sonuc", r.sonuc, [["kullanilir", "Kullanılabilir", "a-sekme-onay"], ["kullanilamaz", "Kullanılamaz", "a-sekme-hata"]], oku) +
        '<p class="a-ipucu">Kullanılamaz: kusur giderilene kadar (Ek-III 1.7.8, raporda açıkça yazılır).</p>' +
        (agir(r) && r.sonuc === "kullanilir" ? '<p class="a-ipucu a-ipucu-uyari">Ağır kusur ya da sınır dışı test değeri varken “Kullanılabilir” seçilemez.</p>' : "")) +
      bolum(elektrik(t) ? 9 : 8, "r-b9", "Notlar", '<textarea class="a-alan a-alan-ince" id="r-notlar" data-alan="notlar" maxlength="500" aria-label="Notlar" placeholder="Ek bilgi (uygunsuzluk buraya yazılamaz)"' + (oku ? " readonly" : "") + ">" + kacis(r.notlar) + "</textarea>") +
      "</div>" +
      (oku ? "" : '<div class="a-form-eylem"><p class="a-adim-not">Taslak her değişiklikte kaydedilir · son kayıt ' + MK.SAAT + "</p>" +
        MK.tus({ eylem: "onaya-gonder", ad: "Onaya gönder", ikon: "send", kapali: eksik.length > 0, sebepId: "r-eksik-say" }) + "</div>");
    document.title = e.kod + " · " + r.no + " · probata maket";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function testIpucu(x, v) {
    var s = testSonuc(x, v);
    return s === null ? "Sınır " + MV.sinirYaz(x) : s ? "Uygun · sınır " + MV.sinirYaz(x) : "Sınır dışı · " + MV.sinirYaz(x);
  }
  function oneri(r, sinifli) {
    var k = kusurlar(r);
    if (agir(r)) return "Öneri: <b>giderilene kadar kullanılamaz</b> — ağır kusur ya da sınır dışı test değeri var.";
    if (k.length) return sinifli ? "Öneri: <b>kullanılabilir</b> — hafif kusur sonraki kontrole kadar giderilmeli." : "Kusurlu madde var: kanaati siz belirleyin.";
    return "Öneri: <b>kullanılabilir</b> — kusur yok.";
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
    return '<p class="a-bolum-aciklama">Pano fotoğrafı çekilir; sigortalar görsel yapay zekâ ile okunur ve <b>öneri</b> olarak düşer. Siz kontrol edip onaylamadan rapora yazılmaz.</p>' +
      (oku ? "" : '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sigorta-oku", ad: d ? "Yeniden oku" : "Fotoğraftan oku", ikon: "camera", sinif: d ? "a-tus-ikincil" : "a-tus-birincil" }) +
        MK.tus({ eylem: "sigorta-ekle", ad: "Elle ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + (bek.length > dusuk.length ? MK.tus({ eylem: "sigorta-onayla", ad: "Önerileri onayla (" + (bek.length - dusuk.length) + ")", ikon: "check", sinif: "a-tus-ikincil" }) : "") + "</div>") +
      (d ? '<div class="a-bolum-serit">' + (bek.length ? MK.serit(dusuk.length ? "uyari" : "bilgi", dusuk.length ? "triangle-alert" : "eye", d.length + " sigorta · <b>" + bek.length + "</b> onay bekliyor" + (dusuk.length ? " · " + dusuk.length + " satırda okuma emin değil: tek tek kontrol edin (toplu onaya girmez)." : ".")) : MK.serit("onay", "circle-check", d.length + " sigorta onaylandı.")) + "</div>" +
        '<div class="a-liste-kap a-bolum-serit">' + MK.tablo({ baslik: "Pano sigortaları", sinif: "a-tablo-sigorta", sutunlar: SUTUN, kayitlar: d }) + "</div>"
        : '<p class="a-bos-satir a-bolum-serit">Henüz sigorta girilmedi.</p>');
  }

  /* ── PENCERE: sigorta satırı · sonraki kontrol ────────────────────────────────────────────────────────── */
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
    } else {
      $("a-pencere-baslik").textContent = "Sonraki kontrol tarihi";
      $("a-pencere-govde").innerHTML = '<div class="a-serit-kap">' + MK.serit("bilgi", "calendar-check", "Varsayılan: bugün + tür periyodu (" + W.r.t.periyot + " ay). Değiştirmek gerekçe ister; gerekçe raporda ve hareket kaydında görünür (§4.7).") + "</div>" +
        '<div class="a-form">' + MK.alan({ id: "w-tarih", etiket: "Sonraki kontrol", zorunlu: true, hata: h.tarih, girdi: MK.girdi({ id: "w-tarih", alan: "tarih", deger: d.tarih, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.tarih }) }) +
        '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="w-gerekce">Gerekçe <span class="a-zorunlu">zorunlu</span></label><textarea class="a-alan a-alan-ince" id="w-gerekce" data-alan="gerekce" maxlength="200"' + (h.gerekce ? ' aria-invalid="true"' : "") + ' aria-describedby="w-gerekce-ipucu">' + kacis(d.gerekce) + "</textarea>" +
          (h.gerekce ? '<p class="a-ipucu a-ipucu-uyari" id="w-gerekce-ipucu">' + h.gerekce + "</p>" : '<p class="a-ipucu" id="w-gerekce-ipucu">ör. üretici talimatı daha kısa periyot istiyor</p>') + "</div></div>";
      $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: "Kaydet", ikon: "check" });
    }
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(o) { W = o; W.hata = {}; pencereCiz(); $("a-pencere").showModal(); $(o.tur === "sigorta" ? (o.x ? "w-tip" : "w-no") : "w-tarih").focus(); }
  function pencereKaydet() {
    var d = W.d, h = {}, r = W.r;
    if (W.tur === "sigorta") {
      if (!/^[A-Z]{1,2}\d{1,3}$/.test(d.no.trim())) h.no = "ör. F4";
      else if (r.sigorta && r.sigorta.some(function (x) { return x.no === d.no.trim() && x !== W.x; })) h.no = "Bu numara listede var.";
      if (!d.tip) h.tip = "Tip seçilmeli.";
      if (!/^\d{1,3}$/.test(d.akim.trim())) h.akim = "Amper, tam sayı.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      var x = W.x || { guven: "yuksek" }; Object.assign(x, { no: d.no.trim(), devre: d.devre.trim() || "—", tip: d.tip, akim: +d.akim, kutup: +d.kutup, rcd: d.rcd.trim(), durum: "onayli" });
      if (!W.x) { r.sigorta = r.sigorta || []; r.sigorta.push(x); }
      $("a-pencere").close(); ciz("r-b6-b"); MK.bildir("Sigorta " + x.no + " onaylandı: " + x.tip + x.akim + ".");
    } else {
      var iso = tarihIso(d.tarih);
      if (!iso) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih."; else if (iso <= MK.BUGUN) h.tarih = "Bugünden sonra olmalı.";
      if (!d.gerekce.trim()) h.gerekce = "Varsayılandan farklı tarih gerekçe ister.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz("w-" + Object.keys(h)[0]); return; }
      r.sonraki = iso; r.gerekce = d.gerekce.trim(); $("a-pencere").close(); ciz("r-b1-b"); MK.bildir("Sonraki kontrol " + MK.tarihYaz(iso) + " oldu; gerekçe rapora yazıldı.");
    }
  }

  /* ── OLAYLAR ───────────────────────────────────────────────────────────────────────────────────────── */
  var aktif = function () { var kod = (/^#\/r\/([A-Z0-9-]+)/.exec(location.hash) || [])[1]; return kod ? rapor(kod) : null; };
  MK.onTikla = function (e) {
    var b = e.target.closest("[data-segmen]"); if (!b || b.disabled) return false;
    var r = aktif(), k = b.dataset.segmen, v = b.dataset.deger, id;
    if (k === "sonuc") { r.sonuc = v; id = null; }
    else { var i = +k.slice(1), x = r.kriter[i]; if (k[0] === "d") { x.d = v; if (v !== "yapildi") x.s = ""; } else x.s = v; }
    var sec = '[data-segmen="' + k + '"][data-deger="' + v + '"]';
    ciz(); var el = document.querySelector(sec); if (el) el.focus();
    return true;
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k) return;
    if (W && $("a-pencere").open) { W.d[k] = e.target.value; return; }
    var r = aktif(); if (!r) return;
    if (k === "amac" || k === "notlar") r[k] = e.target.value;
    else if (k[0] === "t" && k[1] !== undefined && /^t\d+$/.test(k)) {   /* test değeri: ipucu ve sonuç önerisi canlı, odak yerinde */
      var i = +k.slice(1), x = MV.testler(r.t)[i]; r.test[i] = e.target.value;
      $("r-t" + i + "-sonuc").textContent = testIpucu(x, r.test[i]);
      if (testSonuc(x, r.test[i]) === false) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid");
      $("r-oneri").innerHTML = oneri(r, MV.kusurSinifli(r.t));
    } else if (/^kn\d+$/.test(k)) r.kriter[+k.slice(2)].not = e.target.value;
    ozetYenile(r);
  };
  /* yazarken yalnız eksik sayısı ve gönder tuşu güncellenir (liste yeniden çizilmez; odak kaçmaz) */
  function ozetYenile(r) {
    var eks = eksikler(r), n = eks.filter(function (x) { return !x.ok; }).length, t = document.querySelector('[data-eylem="onaya-gonder"]');
    if ($("r-eksik-say")) $("r-eksik-say").innerHTML = n ? "<b>" + n + "</b> eksik" : "Hazır";
    if (t) t.disabled = n > 0;
    var ul = $("r-kontrol"); if (ul && document.activeElement && !ul.contains(document.activeElement)) {
      ul.innerHTML = eks.map(function (x) {
        return '<li class="' + (x.ok ? "a-kosul-tamam" : "a-kosul-eksik") + '">' + ikon(x.ok ? "circle-check" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x.metin) + "</span>" +
          (x.ok ? "" : '<button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="bolume-git" data-hedef="' + x.bolum + '">Git</button>') + "</li>";
      }).join("");
    }
  }
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) { W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return; }
    var r = aktif(); if (id === "r-metot") { r.metot = deger; ciz(id); }
  };
  var X = MK.eylem;
  X["bolume-git"] = function (el) { var h = $(el.dataset.hedef + "-b"); if (h) { h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); } };
  X["foto-ekle"] = function () { var r = aktif(); r.foto++; ciz(); var t = document.querySelector('[data-eylem="foto-ekle"]'); if (t) t.focus(); MK.bildir("Fotoğraf " + r.foto + " eklendi."); };
  X["sigorta-oku"] = function () {
    var r = aktif();
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
  X["sonraki-ac"] = function () { var r = aktif(); pencereAc({ tur: "sonraki", r: r, d: { tarih: r.sonraki.slice(8, 10) + "." + r.sonraki.slice(5, 7) + "." + r.sonraki.slice(0, 4), gerekce: r.gerekce } }); };
  X["pencere-kaydet"] = pencereKaydet;
  X["onaya-gonder"] = function () {
    var r = aktif(); if (eksikler(r).some(function (x) { return !x.ok; })) return;
    r.durum = "onayda"; r.gonderildi = MK.simdi(); r.geri = null;
    ciz(); window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true });
    MK.bildir("Onaya gönderildi: " + MV.kisi(YON[r.t.b]).ad + " (" + MV.bransAd(r.t.b).toLocaleLowerCase("tr") + " branş yöneticisi).");
  };

  MK.goster = function (odakla) { ciz(); if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-rapor h1"); if (h) h.focus({ preventScroll: true }); } };
  /* kabuk: raporu yazan inspector (elektrik raporunu Elif Aydın, mekaniği Mert Kaya) */
  var ilk = aktif(), ben = MV.kisi(ilk ? ilk.kisi : "mk");
  MK.kabuk({ modul: 13, kullanici: { bas: MV.bas(ben.ad), ad: ben.ad, rol: "Inspector" } });
  ciz();
})();
