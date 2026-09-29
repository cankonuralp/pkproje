/* ══ probata MAKET M9 — Onaylar (modül 15) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "raporu teknik yöneticisine onaya gönderecek"), §3 (yönetici onayında → onaylandı / geri gönderildi),
   §3.2 madde 3 (onay türün BRANŞINA göre ilgili yöneticiye gider), §4.9 (17020: kayıtlar ne zaman, hangi metot, hangi öge — gözden
   geçirme). Kullanıcı: Selin Yıldız (mekanik branş yöneticisi) — kuyruğunda yalnız mekanik raporlar; elektrik Can Öztürk'te.
   Ekranlar: kuyruk (#/) · onay ekranı (#/r/<no>: gözden geçirme özeti + PDF önizlemesi, Onayla / Geri gönder) · geri gönder penceresi
   (#/r/<no>/geri; gerekçe zorunlu). Onaylanan rapor inspector'ın son imzasına gider; sıradaki rapor açılır.
   Tüm raporlar (#/tum, 2026-09-29, reisim: "herhangi bir süreçteki rapor imzalanıp tamamlanmış hariç teknik yönetici tarafından durumu
   değiştirilebilsin imzalanıp tamamlanan rapor revizeye gönderilebilsin"): branşın bütün raporları; tamamlanmamış raporda "Durumu değiştir",
   tamamlanan raporda "Revizeye gönder" (yeni sürüm R1, R2 …; önceki imzalı sürüm saklanır). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var BEN = "sy", BENIM = "m", BRANS = "m";   /* 100: branş yöneticisi yokken başka branşın kuyruğu vekil olarak açılır (?brans=e) */
  var brans = function (r) { return MV.tur(MV.ekipman(r.kod).tur).b; };
  var kuyruk = function () { return MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && brans(r) === BRANS; }).sort(function (a, b) { return a.gonderildi < b.gonderildi ? 1 : -1; }); };   /* en yeni üstte (reisim 2026-09-26) */
  /* pasif raporlar (2026-09-28, T2; reisim: "inspector pasife alabilir … aktif etme ve silme yalnız yönetici"): branşın pasif raporları */
  var pasifler = function () { return MV.RAPORLAR.filter(function (r) { return r.pasif && brans(r) === BENIM; }).sort(function (a, b) { return a.pasifZaman < b.pasifZaman ? 1 : -1; }); };
  /* 190 (2026-09-29): Tüm raporlar seçili branşın — kendi branşı ya da vekil olduğu branş (#/tum?brans=e) */
  var tumu = function () { return MV.RAPORLAR.filter(function (r) { return !r.pasif && brans(r) === BRANS; }); };
  var TUM_BRANS = null;
  var tumAdres = function () { return BRANS === BENIM ? "#/tum" : "#/tum?brans=" + BRANS; };
  var saatFarki = function (iso) { return Math.round((new Date(MK.simdi() + ":00Z") - new Date(iso + ":00Z")) / 36e5); };
  var bekleme = function (iso) { var h = saatFarki(iso); return h < 1 ? "az önce" : h < 24 ? h + " saattir" : Math.floor(h / 24) + " gündür"; };

  /* ── KUYRUK ────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("o", { ad: "Kuyrukta ara", ipucu: "Rapor no, kod, tesis", birim: "rapor",
    cipler: [
      { k: "kusurlu", ad: "Kusurlu", test: function (r) { return MV.sonucAd(r) !== "Uygun"; } },
      { k: "eski", ad: "24 saatten eski", test: function (r) { return saatFarki(r.gonderildi) >= 24; } }
    ],
    seciciler: [
      { k: "kisi", ad: "Inspector", secenek: function () {
        var l = kuyruk().map(function (r) { return r.kisi; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.kisi(k).ad]; }));
      }, gecer: function (r, v) { return v === "tumu" || r.kisi === v; } },
      { k: "tesis", ad: "Tesis", secenek: function () {
        var l = kuyruk().map(function (r) { return r.tesis; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (t) { return [t, MV.musteri(MV.tesis(t).m).kisa + " / " + MV.tesis(t).ad]; }));
      }, gecer: function (r, v) { return v === "tumu" || r.tesis === v; } }
    ],
    metin: function (r) { var e = MV.ekipman(r.kod), ts = MV.tesis(r.tesis); return [r.no, e.kod, MV.tur(e.tur).ad, ts.ad, MV.kisi(r.kisi).ad].join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { var ts = MV.tesis(r.tesis); return '<a class="a-no" href="#/r/' + r.no + '">' + r.no + "</a>" + kirp(MV.musteri(ts.m).kisa + " / " + ts.ad, "a-alt-satir"); } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = MV.ekipman(r.kod); return '<span class="a-hucre-satir"><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad) + "</span>"; } },
    { k: "kisi", baslik: "Inspector", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Inspector</span>' + kirp(MV.kisi(r.kisi).ad); } },
    { k: "gonderildi", baslik: "Gönderildi", kart: "govde", sira: 4, hucre: function (r) {
      var h = saatFarki(r.gonderildi);
      return '<span class="a-kart-etiket">Gönderildi</span><span><span class="a-tarih-gun">' + MK.zamanYaz(r.gonderildi) + '</span><span class="' + (h >= 24 ? "a-uyari-metin" : "a-tarih-saat") + '">' + bekleme(r.gonderildi) + " bekliyor</span></span>";
    } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (r) { var s = MV.sonucAd(r); return rozet(s === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: s, rozet: /^(Kusurlu|Ağır)/.test(s) ? "a-rozet-red" : "a-rozet-bekliyor" }); } }
  ];
  function sekmeler(gor) {   /* gor: "kuyruk" · "tum" · "pasif" */
    $("a-uyari").innerHTML = '<div class="a-sekmeler a-bolum-serit" role="group" aria-label="Kuyruk">' + ["m", "e"].map(function (b) {
      var n = MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && brans(r) === b; }).length;
      return '<a class="a-sekme" href="' + (b === BENIM ? "#/" : "#/?brans=" + b) + '" aria-pressed="' + (gor === "kuyruk" && BRANS === b) + '">' + MV.bransAd(b) + (b === BENIM ? "" : " · vekil") + " <b>" + n + "</b></a>";
    }).join("") + '<a class="a-sekme" href="' + tumAdres() + '" aria-pressed="' + (gor === "tum") + '">Tüm raporlar' + (BRANS === BENIM ? "" : " · " + MV.bransAd(BRANS).toLocaleLowerCase("tr") + " vekil") + " <b>" + tumu().length + "</b></a>" +
      '<a class="a-sekme" href="#/pasif" aria-pressed="' + (gor === "pasif") + '">Pasif raporlar <b>' + pasifler().length + "</b></a></div>";
  }
  var PASIF_SUTUN = [SUTUN[0], SUTUN[1], SUTUN[2],
    { k: "pasif", baslik: "Pasife alındı", kart: "govde", sira: 4, hucre: function (r) { return '<span class="a-kart-etiket">Pasife alındı</span><span class="a-tarih-gun">' + MK.zamanYaz(r.pasifZaman) + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "rapor-sil-ac", ad: "Sil", sinif: "a-tus-ikincil", veri: { no: r.no } }) +
        MK.tus({ eylem: "rapor-aktif", ad: "Aktif et", ikon: "undo-2", sinif: "a-tus-ikincil", veri: { no: r.no } }) + "</div></div>"; } }];
  function pasifCiz() {
    var l = pasifler(); sekmeler("pasif"); $("a-suzgec-kap").innerHTML = ""; $("a-sayfa").innerHTML = "";
    $("a-sayac").innerHTML = "<b>" + l.length + "</b> rapor";
    $("a-liste").innerHTML = l.length ? MK.tablo({ baslik: "Pasif raporlar", sinif: "a-tablo-onay", sutunlar: PASIF_SUTUN, kayitlar: l })
      : MK.bos({ ikon: "circle-check", baslik: "Pasif rapor yok", metin: "" });
  }
  function listeCiz() {
    sekmeler("kuyruk");
    MK.listeCiz({ on: "o", kayitlar: kuyruk(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.gonderildi < b.gonderildi ? 1 : -1; }); },
      bosVeri: { ikon: "circle-check", baslik: "Kuyruk boş", metin: "Onayınızı bekleyen rapor yok. Inspector'lar onaya gönderdikçe burada en eskisi üstte sıralanır." },
      tablo: { baslik: "Onay kuyruğu", sinif: "a-tablo-onay", sutunlar: SUTUN, href: function (r) { return "#/r/" + r.no; } } });
    $("a-sayfa").innerHTML = "";
  }

  /* ── TÜM RAPORLAR: branşın bütün (pasif olmayan) raporları; durum seçici, rapor no ve tesis ayrı aranır ───────────────── */
  var DURUMLAR = ["taslak", "onayda", "onaylandi", "imzada", "imzali"];
  var durumAd = function (d) { return MV.RAPOR_DURUM[d].ad; };
  MK.suzgecTanimla("t", { ad: "Raporlarda ara", ipucu: "", birim: "rapor", cipler: [], sayfa: 20,
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "KM-0926-…", metin: function (r) { return r.no; } },
      { k: "tesis", ad: "Tesis", ipucu: "Tesis ya da müşteri", metin: function (r) { var ts = MV.tesis(r.tesis); return MV.musteri(ts.m).kisa + " " + ts.ad; } }
    ],
    seciciler: [
      { k: "durum", ad: "Durum", secenek: function () { return [["tumu", "Tümü"]].concat(DURUMLAR.map(function (d) { return [d, durumAd(d)]; })); },
        gecer: function (r, v) { return v === "tumu" || r.durum === v; } },
      { k: "kisi", ad: "Inspector", secenek: function () {
        var l = tumu().map(function (r) { return r.kisi; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.kisi(k).ad]; }));
      }, gecer: function (r, v) { return v === "tumu" || r.kisi === v; } }
    ],
    metin: function (r) { return r.no; }, imkansiz: "" }, function () { tumCiz(); });
  var TUM_SUTUN = [SUTUN[0], SUTUN[1], SUTUN[2],
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(MV.raporDurum(r)); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + (r.durum === "imzali"
        ? MK.tus({ eylem: "revize-ac", ad: "Revizeye gönder", ikon: "file-pen-line", sinif: "a-tus-ikincil", veri: { no: r.no } })
        : MK.tus({ eylem: "durum-ac", ad: "Durumu değiştir", ikon: "refresh-cw", sinif: "a-tus-ikincil", veri: { no: r.no } })) + "</div></div>"; } }];
  function tumCiz() {
    sekmeler("tum");
    MK.listeCiz({ on: "t", kayitlar: tumu(), sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.olustu < b.olustu ? 1 : -1; }); },
      bosVeri: { ikon: "inbox", baslik: "Rapor yok", metin: "" },
      tablo: { baslik: "Tüm raporlar", sinif: "a-tablo-onay", sutunlar: TUM_SUTUN, href: function (r) { return "#/r/" + r.no; } } });
  }

  /* ── ONAY EKRANI: gözden geçirme özeti + PDF önizlemesi ───────────────────────────────────────────────── */
  function ozet(r) {
    var b = MV.raporBelge(r), t = MV.tur(b.e.tur), kr = MV.kriterler(t), ts = MV.testler(t), F = MV.formatYapi(t), gecti = b.cihaz.filter(function (v) { return MV.kalDurum(v) === "gecti"; });
    var s = MV.sonucAd(r), kusur = s !== "Uygun";
    return [
      [!!b.isg, b.isg ? "İSG-KATİP " + b.isg.no + " · onay " + MK.tarihYaz(b.isg.onay) : "İSG-KATİP kaydı yok"],
      [true, "Kontrol metodu: " + MV.metotYazi(t)],   /* türden (2026-09-27) */
      /* topraklama formatında (ZPKR01) madde yok: ölçüm noktaları ve RCD testleri (2026-09-27) */
      kr.length ? [!kusur, kr.length + " kriter yapıldı" + (kusur ? " · " + "1 uygun değil madde" : " · hepsi uygun")]
        : [!kusur, F.noktalar.length + " ölçüm noktası · " + F.rcd.length + " RCD testi" + (kusur ? " · 1 uygun değil nokta" : " · hepsi uygun")],
      ts.length ? [true, ts.length + " test değeri · hepsi sınır içinde"] : null,
      [!gecti.length, b.cihaz.length + " ölçüm cihazı" + (gecti.length ? " · kalibrasyonu geçmiş: " + gecti.map(function (v) { return v.seri; }).join(", ") : " · kalibrasyonu geçerli")],
      [true, "2 fotoğraf"],
      /* V4 (2026-09-29): önceki kontrolden devreden hafif kusurlar ve inspector'ın mesleği — ikisi de uyarı, engel değil */
      (function () {
        var dv = MV.devredenKusurlar(r.kod, r.olustu); if (!dv.length) return null;
        var d = r.devir || {}, gm = dv.filter(function (x) { return d[x.id] === "devam"; }).length, gd = dv.filter(function (x) { return d[x.id] === "giderildi"; }).length;
        return [!gm && gd === dv.length, "Önceki kontrolden " + dv.length + " hafif kusur · " + [gd ? gd + " giderildi" : "", gm ? gm + " giderilmedi" : "", dv.length - gd - gm ? (dv.length - gd - gm) + " işaretlenmedi" : ""].filter(Boolean).join(" · ")];
      })(),
      [MV.meslekYetkili(r.kisi, t), "Inspector: " + MV.kisi(r.kisi).ad + " · " + MV.meslekAd(MV.kisi(r.kisi)) + (MV.meslekYetkili(r.kisi, t) ? "" : " · bu türe yetkili meslekler arasında değil")],
      [true, "Sonuç ve kanaat: " + (/^Kusurlu|Ağır/.test(s) && MV.kusurSinifli(t) ? "giderilene kadar kullanılamaz" : "kullanılabilir")]
    ].filter(Boolean);
  }
  function onayCiz(r) {
    if (r && r.durum !== "onayda") { raporCiz(r); return; }
    if (!r) {
      $("a-nesne").innerHTML = MK.kirinti([["Onaylar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu adreste rapor yok.",
          eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Kuyruğa dön</a>" });
      return;
    }
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), q = kuyruk(), sira = q.indexOf(r);
    $("a-nesne").innerHTML = MK.kirinti([["Onaylar", "#/"], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + r.no + "</h1>" + rozet(MV.raporDurum(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(ts.ad) + " · " + kacis(MV.kisi(r.kisi).ad) + " · " + (sira + 1) + " / " + q.length + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "durum-ac", ad: "Durumu değiştir", ikon: "refresh-cw", sinif: "a-tus-ikincil", veri: { no: r.no } }) +
          MK.tus({ eylem: "geri-ac", ad: "Geri gönder", ikon: "undo-2", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "onayla", ad: "Onayla", ikon: "check" }) + "</div></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-ozet"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ozet">Gözden geçirme</h2><span class="a-sayac">' + bekleme(r.gonderildi) + " bekliyor</span></div>" +
        '<ul class="a-kosullar">' + ozet(r).map(function (x) { return '<li class="' + (x[0] ? "a-kosul-tamam" : "a-kosul-eksik") + '">' + ikon(x[0] ? "circle-check" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x[1]) + "</span></li>"; }).join("") + "</ul></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">Rapor (PDF önizlemesi)</h2><span class="a-sayac">imzasız</span></div>' + MB.belge(t, MV.raporBelge(r)) + "</section>" +
      '<div class="a-eylem-cubugu a-eylem-cubugu-alt">' + MK.tus({ eylem: "geri-ac", ad: "Geri gönder", ikon: "undo-2", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "onayla", ad: "Onayla", ikon: "check" }) + "</div>";
  }
  /* onay kuyruğunda olmayan rapor (2026-09-29): tamamlanmamışsa "Durumu değiştir", tamamlanmışsa "Revizeye gönder"; onaylanan raporda
     102'nin "Onayı geri al"ı da durur (tek tıkla kuyruğa döner) */
  function raporCiz(r) {
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), rv = r.revizyonlar && r.revizyonlar[0];
    $("a-nesne").innerHTML = MK.kirinti([["Onaylar", "#/"], ["Tüm raporlar", brans(r) === BENIM ? "#/tum" : "#/tum?brans=" + brans(r)], [r.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + r.no + (rv ? "-" + rv.ad : "") + "</h1>" + rozet(MV.raporDurum(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(ts.ad) + " · " + kacis(MV.kisi(r.kisi).ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + (r.durum === "imzali"
          ? MK.tus({ eylem: "revize-ac", ad: "Revizeye gönder", ikon: "file-pen-line", veri: { no: r.no } })
          : MK.tus({ eylem: "durum-ac", ad: "Durumu değiştir", ikon: "refresh-cw", sinif: r.durum === "onaylandi" ? "a-tus-ikincil" : "", veri: { no: r.no } }) +
            (r.durum === "onaylandi" ? MK.tus({ eylem: "onay-geri-al", ad: "Onayı geri al", ikon: "undo-2" }) : "")) + "</div></div>" +
      (MV.durumSerit(r) ? '<div class="a-uyari-serit">' + MV.durumSerit(r) + "</div>" : "") +
      (r.geri && r.durum === "taslak" ? '<div class="a-uyari-serit">' + MK.serit("uyari", "undo-2", "<b>" + (rv && rv.zaman === r.geri.zaman ? "Revizeye gönderildi (" + rv.ad + ")" : "Geri gönderildi") + "</b> · " +
        kacis(MV.kisi(r.geri.kim).ad) + " · " + MK.zamanYaz(r.geri.zaman) + ": “" + kacis(r.geri.gerekce) + "”") + "</div>" : "") +
      '<section class="a-bolum" aria-labelledby="a-b-pdf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-pdf">' + (r.imzaDosya ? "İmzalı PDF" : "Rapor (PDF önizlemesi)") + '</h2><span class="a-sayac">' + (r.imza ? "imzalı" : "imzasız") + "</span></div>" +
        (r.durum === "taslak" ? '<p class="a-bos-satir">Yeni: rapor inspector\'da, PDF yok.</p>' : MK.dosyaOnizle(r.imzaDosya, MB.belge(t, MV.raporBelge(r)))) + "</section>";
  }
  var sonraki = function (r) { var q = kuyruk(), i = q.indexOf(r); return q[i + 1] || q[0] || null; };

  /* ── PENCERELER: geri gönder · durumu değiştir · revizeye gönder (W.tip) ──────────────────────────────────── */
  var W = null;
  /* durumu değiştir: tamamlanmamış rapor Yeni / onayda / imza bekliyor durumlarından birine alınır; "Tamamlandı"ya yalnız imzayla geçilir.
     Yeni'ye alınan rapor inspector'a döner: gerekçe geri gönderimdeki gibi zorunlu (inspector neyi düzelteceğini bilmeli); ötekilerde isteğe bağlı */
  var HEDEF = ["taslak", "onayda", "onaylandi"];
  var gerekceZorunlu = function () { return W.tip !== "durum" || W.hedef === "taslak"; };
  function pencereCiz(odak) {
    var r = W.r, rv = (r.revizyonlar || []).length + 1;
    $("a-pencere-baslik").textContent = (W.tip === "durum" ? "Durumu değiştir · " : W.tip === "revize" ? "Revizeye gönder · " : "Geri gönder · ") + r.no;
    $("a-pencere-govde").innerHTML = "" +
      (W.tip === "durum" ? '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Şu an: ' + kacis(MV.raporDurum(r).ad) + "</p>" + HEDEF.filter(function (d) { return d !== r.durum; }).map(function (d) {
          return '<label class="a-onay-kutusu"><input type="radio" name="w-hedef" data-hedef value="' + d + '"' + (W.hedef === d ? " checked" : "") + "><span>" + kacis(durumAd(d)) + "</span></label>"; }).join("") +
          (W.hedefHata ? '<p class="a-ipucu a-ipucu-uyari" id="w-hedef-ipucu">' + W.hedefHata + "</p>" : "") + "</div>" : "") +
      (W.tip === "revize" ? '<p class="a-pencere-metin">Rapor ' + r.no + "-R" + rv + " olarak inspector'a döner; tamamlanan sürüm ve imzalı PDF'i saklanır. Rapor yeniden onay ve imzadan geçer.</p>" : "") +
      '<div class="a-alan-grup"><label class="a-etiket" for="w-gerekce">Gerekçe' + (gerekceZorunlu() ? ' <span class="a-zorunlu">zorunlu</span>' : "") + '</label><textarea class="a-alan" id="w-gerekce" data-alan="gerekce" maxlength="400"' + (W.hata ? ' aria-invalid="true"' : "") +
        ' aria-describedby="w-gerekce-ipucu" placeholder="' + (W.tip === "revize" ? "Raporda neyin düzeltileceği" : "Hangi bölümde ne eksik ya da yanlış") + '">' + kacis(W.gerekce) + "</textarea>" +
        '<p class="a-ipucu' + (W.hata ? " a-ipucu-uyari" : "") + '" id="w-gerekce-ipucu">' + (W.hata || "") + "</p></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
      (W.tip === "durum" ? MK.tus({ eylem: "durum-kaydet", ad: "Durumu değiştir", ikon: "refresh-cw" }) : W.tip === "revize" ? MK.tus({ eylem: "revize-gonder", ad: "Revizeye gönder", ikon: "file-pen-line" })
        : MK.tus({ eylem: "geri-gonder", ad: "Geri gönder", ikon: "undo-2" }));
    if (odak) { var el = typeof odak === "string" && odak.charAt(0) !== "#" && odak.charAt(0) !== "[" ? $(odak) : document.querySelector("#a-pencere " + odak); if (el) el.focus(); }
  }
  function pencereAc(r, tip) {
    W = { r: r, tip: tip || "geri", gerekce: "", hata: "", hedef: null, hedefHata: "" }; pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = document.querySelector("#a-pencere [data-hedef]") || $("w-gerekce"); ilk.focus();
  }
  /* durum değişikliği ve revize kayıt altında (r.durumGecmis: kim, ne zaman, eskisi, yenisi, gerekçe); ekranda geçmiş listesi yok (§11 98) */
  function gecmisYaz(r, yeni, gerekce, zaman) { (r.durumGecmis = r.durumGecmis || []).unshift({ kim: BEN, zaman: zaman, eski: r.durum, yeni: yeni, gerekce: gerekce }); }
  function inspectoraDon(r, gerekce, zaman) {   /* Yeni'ye dönen rapor: ilk gönderim korunur (performans: yazım süresi), gerekçe raporun üstünde */
    if (!r.ilkGonderim && r.gonderildi) r.ilkGonderim = r.gonderildi;
    r.durum = "taslak"; r.gonderildi = null; r.onay = null; r.imza = null; r.imzaGonderildi = null; r.geri = { kim: BEN, zaman: zaman, gerekce: gerekce };
  }
  function yenidenCiz(odak) {   /* pencere kapanınca bulunduğu yer yeniden çizilir; odak rapor başlığına ya da listedeki satıra */
    goster(false);
    var el = rota().v === "rapor" ? document.querySelector("#a-nesne h1") : document.querySelector('#a-liste a[href="#/r/' + odak + '"]') || document.querySelector('#a-uyari [href^="#/tum"]');
    if (el) el.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    BRANS = /[?&]brans=e/.test(location.hash) ? "e" : /[?&]brans=m/.test(location.hash) ? "m" : BRANS;
    if (location.hash === "#/" || location.hash === "") BRANS = BENIM;
    if (location.hash === "#/pasif") return { v: "liste", pasif: true };
    if (location.hash === "#/tum") { BRANS = BENIM; return { v: "liste", tum: true }; }
    if (/^#\/tum\?brans=[a-z]$/.test(location.hash)) return { v: "liste", tum: true };
    var m = /^#\/r\/([A-Za-z0-9-]+)(\/geri)?$/.exec(location.hash);
    return m ? { v: "rapor", no: m[1], pencere: !!m[2] } : { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), rp = r.no ? MV.rapor(r.no) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.tum && TUM_BRANS !== BRANS) { MK.suzgecSifirla("t"); TUM_BRANS = BRANS; }   /* branş değişince süzgeç (inspector, sayfa) baştan */
    if (r.pasif) pasifCiz(); else if (r.tum) { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t"); MK.suzgecKur("t"); }
    else if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("o"); MK.suzgecKur("o"); } else onayCiz(rp);
    document.title = (r.v === "rapor" ? (rp ? rp.no + " · onay" : "Rapor bulunamadı") : r.tum ? "Tüm raporlar · Onaylar" : "Onaylar") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere && rp && rp.durum === "onayda") pencereAc(rp, "geri"); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["onayla"] = function () {
    var r = MV.rapor(rota().no), s = sonraki(r);
    r.durum = "onaylandi"; r.onay = { kim: BEN, zaman: MK.simdi(), vekil: brans(r) !== BENIM };
    s = s === r ? null : s;
    location.hash = s ? "#/r/" + s.no : BRANS === BENIM ? "#/" : "#/?brans=" + BRANS;
    MK.bildir(r.no + " onaylandı; muayene uzmanı imzasında, " + MV.kisi(r.kisi).ad + " imzalayınca tamamlanır." + (s ? " Sıradaki rapor açıldı." : " Kuyruk boş."));
  };
  X["onay-geri-al"] = function () {
    var r = MV.rapor(rota().no); r.durum = "onayda"; r.onay = null; onayCiz(r);
    var h = document.querySelector("#a-nesne h1"); if (h) h.focus(); MK.bildir(r.no + " onayı geri alındı; rapor yeniden kuyrukta.");
  };
  X["rapor-aktif"] = function (el) {
    var r = MV.rapor(el.dataset.no); r.pasif = false; r.pasifKim = null; r.pasifZaman = null; pasifCiz();
    var s = document.querySelector('#a-uyari [href="#/pasif"]'); if (s) s.focus();
    MK.bildir(r.no + " yeniden aktif; " + MV.kisi(r.kisi).ad + " planında görür.");
  };
  X["rapor-sil-ac"] = function (el) {
    W = { sil: MV.rapor(el.dataset.no) };
    $("a-pencere-baslik").textContent = "Raporu sil · " + W.sil.no;
    $("a-pencere-govde").innerHTML = '<p class="a-pencere-metin">Rapor kalıcı olarak silinir; geri alınamaz.</p>';
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "rapor-sil", ad: "Sil" });
    $("a-pencere").showModal(); $("a-pencere-alt").querySelector('[data-eylem="pencere-kapat"]').focus();
  };
  X["rapor-sil"] = function () {
    var r = W.sil; MV.RAPORLAR.splice(MV.RAPORLAR.indexOf(r), 1); $("a-pencere").close(); pasifCiz();
    var s = document.querySelector('#a-uyari [href="#/pasif"]'); if (s) s.focus();
    MK.bildir(r.no + " silindi.");
  };
  X["geri-ac"] = function () { pencereAc(MV.rapor(rota().no)); };
  X["durum-ac"] = function (el) { pencereAc(MV.rapor(el.dataset.no), "durum"); };
  X["revize-ac"] = function (el) { pencereAc(MV.rapor(el.dataset.no), "revize"); };
  X["durum-kaydet"] = function () {
    var r = W.r, g = W.gerekce.trim(), z = MK.simdi(), eski = MV.raporDurum(r).ad;
    W.hedefHata = W.hedef ? "" : "Yeni durumu seçin."; W.hata = gerekceZorunlu() && g.length < 10 ? "Yeni'ye alınan rapor inspector'a döner: gerekçe en az 10 karakter olmalı." : "";
    if (W.hedefHata || W.hata) { pencereCiz(W.hedefHata ? "[data-hedef]" : "w-gerekce"); return; }
    gecmisYaz(r, W.hedef, g, z);
    if (W.hedef === "taslak") inspectoraDon(r, g, z);
    else {
      /* geri gönderilmiş rapor inspector düzeltmeden ileri alınırsa geri gönderim yine kayıtta kalır (performans: geri gönderilen) */
      if (r.geri) { r.duzeltmeler = (r.duzeltmeler || []).concat([{ geri: r.geri.zaman, gonderim: z }]); r.geri = null; }
      if (!r.gonderildi) r.gonderildi = z; if (!r.ilkGonderim) r.ilkGonderim = r.gonderildi;
      r.imzaGonderildi = null; r.imza = null;
      r.onay = W.hedef === "onaylandi" ? { kim: BEN, zaman: z, vekil: brans(r) !== BENIM } : null;
      r.durum = W.hedef;
    }
    $("a-pencere").close(); yenidenCiz(r.no);
    MK.bildir(r.no + ": " + eski + " → " + MV.raporDurum(r).ad + ".");
  };
  /* imzalı (tamamlanan) rapor revizeye: yeni sürüm (R1, R2 …) Yeni olarak inspector'a döner; tamamlanan sürüm ve imzalı PDF'i sürümde saklanır */
  X["revize-gonder"] = function () {
    var r = W.r, g = W.gerekce.trim(), z = MK.simdi();
    if (g.length < 10) { W.hata = "Gerekçe en az 10 karakter olmalı: inspector neyi düzelteceğini bilmeli."; pencereCiz("w-gerekce"); return; }
    r.revizyonlar = r.revizyonlar || [];
    r.revizyonlar.unshift({ ad: "R" + (r.revizyonlar.length + 1), zaman: z, kim: BEN, gerekce: g, onceki: { onay: r.onay, imza: r.imza, imzaDosya: r.imzaDosya || null, sonuc: r.sonuc } });
    gecmisYaz(r, "taslak", g, z); inspectoraDon(r, g, z); r.imzaDosya = null;
    $("a-pencere").close(); yenidenCiz(r.no);
    MK.bildir(r.no + "-" + r.revizyonlar[0].ad + " açıldı; " + MV.kisi(r.kisi).ad + " raporun üstünde gerekçeyi görür. Tamamlanan sürüm saklandı.");
  };
  X["geri-gonder"] = function () {
    if (W.gerekce.trim().length < 10) { W.hata = "Gerekçe en az 10 karakter olmalı: inspector neyi düzelteceğini bilmeli."; pencereCiz("w-gerekce"); return; }
    var r = W.r, s = sonraki(r);
    if (!r.ilkGonderim) r.ilkGonderim = r.gonderildi;   /* ilk gönderim korunur (performans: yazım süresi) */
    r.durum = "taslak"; r.geri = { kim: BEN, zaman: MK.simdi(), gerekce: W.gerekce.trim() }; r.gonderildi = null;
    $("a-pencere").close(); s = s === r ? null : s;
    location.hash = s ? "#/r/" + s.no : BRANS === BENIM ? "#/" : "#/?brans=" + BRANS;
    MK.bildir(r.no + " geri gönderildi; " + MV.kisi(r.kisi).ad + " raporun üstünde gerekçeyi görür.");
  };
  MK.onGirdi = function (e) {
    if (!W) return;
    if (e.target.id === "w-gerekce") W.gerekce = e.target.value;
    else if (e.target.hasAttribute("data-hedef")) { W.hedef = e.target.value; W.hedefHata = ""; if (W.hata && !gerekceZorunlu()) W.hata = ""; pencereCiz('[data-hedef][value="' + W.hedef + '"]'); }
  };
  $("a-pencere").addEventListener("close", function () { if ($("a-pencere").open) return; W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", "#/r/" + r.no); });

  MK.kabuk({ modul: 15, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici · Inspector" } });
  goster(false);
})();
