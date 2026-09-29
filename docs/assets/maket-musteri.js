/* ══ probata MAKET M11 — Müşteri Paneli (modül 17) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════════════════════════════════
   Kaynak: pkproje.md §1 (reisim: "müşteriye bir id parola verilecek ve girdiğinde kendi raporlarına oradan erişebilecek ama sadece kendi
   raporlarını görüp indirecek"), §1.1 ("uygunsuzları indir seçeneği olacak ve tüm uygunsuz raporları excel olarak indirip görebilecek ve
   exceldeki ilgili yere tıklayınca rapora gidebilecek … önceliğimiz müşteri kolaylığı"), §3 (imzasız yayın yok), §3.2 madde 6 (uygunsuzluk
   ayrı kayıt; Excel buradan beslenir, PDF'ten okunmaz), anayasa 5.1 (kalıcı herkese açık dosya bağlantısı yok). Kabuk: müşteri kabuğu
   (MK.kabuk o.musteri; firmanın menüsü yok). Kullanıcı: Ada Makina'dan Serkan Ateş (bütün tesisler). ?musteri=<id>: firma ekranından o
   müşterinin gördüğünü açar. Ekranlar: raporlar (#/) · uygunsuzluklar (#/uygunsuz) · rapor (#/r/<no>, PDF) · Excel önizlemesi (#/excel). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, SZ = MK.SZ;
  var q = (function () { var m = /[?&]musteri=(m\d+)/.exec(location.hash); return m && MV.musteri(m[1]) ? m[1] : "m1"; })();
  var M = MV.musteri(q), KUL = MV.musteriKullanicilari(M.id).filter(function (x) { return x.durum === "etkin"; })[0];
  var tesisleri = function () { return KUL ? (KUL.tesis === "hepsi" ? MV.tesisleri(M.id) : MV.tesisleri(M.id).filter(function (t) { return KUL.tesis.indexOf(t.id) >= 0; })) : []; };
  var tid = function () { return tesisleri().map(function (t) { return t.id; }); };
  /* YALNIZ imzalı raporlar (imzasız yayın yok) ve yalnız kullanıcının tesisleri */
  /* revize edilen raporda yalnız son imzalı sürüm (193, 2026-09-29; MV.musteriSurumu) */
  var raporlar = function () { var ts = tid(); return MV.RAPORLAR.map(MV.musteriSurumu).filter(function (r) { return r && ts.indexOf(r.tesis) >= 0; }); };
  var uygunsuzlar = function () { var ts = tid(); return MV.uygunsuzluklar(M.id).filter(function (u) { return ts.indexOf(u.tesis) >= 0; }); };
  var sonraki = function (r) { var e = MV.ekipman(r.kod), d = new Date(r.olustu.slice(0, 10) + "T12:00:00"); d.setMonth(d.getMonth() + MV.tur(e.tur).periyot); return d.toISOString().slice(0, 10); };
  var sonucHtml = function (s) { return '<span class="a-onceki' + (s === "Uygun" ? "" : s === "Hafif kusurlu" ? " a-sonuc-uyari" : " a-sonuc-hata") + '">' + s + "</span>"; };

  /* ── RAPORLAR ─────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("m", { ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", sayfa: 20,
    cipler: [
      { k: "kusurlu", ad: "Uygunsuz", test: function (r) { return r.sonuc !== "Uygun"; } },
      { k: "yakin", ad: "Sonraki kontrol 60 gün içinde", test: function (r) { return MK.gunFarki(MK.BUGUN, sonraki(r)) <= 60; } }
    ],
    seciciler: [
      { k: "tesis", ad: "Tesis", secenek: function () { return [["tumu", "Tümü"]].concat(tesisleri().map(function (t) { return [t.id, t.ad]; })); }, gecer: function (r, v) { return v === "tumu" || r.tesis === v; } },
      { k: "yil", ad: "Yıl", secenek: function () { return [["tumu", "Tümü"], ["2026", "2026"], ["2025", "2025"]]; }, gecer: function (r, v) { return v === "tumu" || r.olustu.slice(0, 4) === v; } }
    ],
    metin: function (r) { var e = MV.ekipman(r.kod); return [r.no, e.kod, MV.tur(e.tur).ad, MV.tesis(r.tesis).ad].join(" "); },
    imkansiz: "" }, function () { raporCiz(); });
  var R_SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<a class="a-no" href="#/r/' + r.no + '">' + MV.surumNo(r) + "</a>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = MV.ekipman(r.kod); return '<span class="a-hucre-satir"><span class="a-kod">' + e.kod + "</span>" + kirp(MV.tur(e.tur).ad) + "</span>"; } },
    { k: "tesis", baslik: "Tesis", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Tesis</span>' + kirp(MV.tesis(r.tesis).ad); } },
    { k: "tarih", baslik: "Kontrol", kart: "govde", sira: 4, hucre: function (r) { return '<span class="a-kart-etiket">Kontrol</span>' + MK.tarihYaz(r.olustu); } },
    { k: "sonraki", baslik: "Sonraki kontrol", kart: "govde", sira: 5, hucre: function (r) {
      var s = sonraki(r), k = MK.gunFarki(MK.BUGUN, s);
      return '<span class="a-kart-etiket">Sonraki kontrol</span><span><span class="a-tarih-gun">' + MK.tarihYaz(s) + "</span>" + (k <= 60 ? '<span class="a-uyari-metin">' + (k < 0 ? -k + " gün geçti" : k + " gün") + "</span>" : "") + "</span>";
    } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (r) { return sonucHtml(MV.sonucAd(r)); } }
  ];
  function raporCiz() {
    MK.listeCiz({ on: "m", kayitlar: raporlar(), sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.olustu < b.olustu ? 1 : -1; }); },
      bosVeri: { ikon: "file-text", baslik: "Henüz rapor yok", metin: "Raporlar imzalandığında burada görünür ve indirilebilir." },
      tablo: { baslik: "Raporlarınız", sinif: "a-tablo-mrapor", sutunlar: R_SUTUN, href: function (r) { return "#/r/" + r.no; } } });
  }

  /* ── UYGUNSUZLUKLAR ─────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("u", { ad: "Uygunsuzluklarda ara", ipucu: "Ekipman, kriter", birim: "uygunsuzluk",
    cipler: [
      { k: "acik", ad: "Açık", grup: "durum", test: function (u) { return u.durum === "acik"; } },
      { k: "giderildi", ad: "Giderildi", grup: "durum", test: function (u) { return u.durum === "giderildi"; } },
      { k: "agir", ad: "Ağır ya da kusurlu", test: function (u) { return u.sinif !== "Hafif"; } }
    ],
    seciciler: [{ k: "tesis", ad: "Tesis", secenek: function () { return [["tumu", "Tümü"]].concat(tesisleri().map(function (t) { return [t.id, t.ad]; })); }, gecer: function (u, v) { return v === "tumu" || u.tesis === v; } }],
    metin: function (u) { return [u.e.kod, u.t.ad, u.kriter, u.aciklama, u.rapor.no].join(" "); },
    imkansiz: "Bir uygunsuzluk hem açık hem giderilmiş olamaz" }, function () { uygunsuzCiz(); });
  var SINIF = { Hafif: "a-rozet-bekliyor", "Ağır": "a-rozet-red", Kusurlu: "a-rozet-red" };
  var U_SUTUN = [
    { k: "ekipman", baslik: "Ekipman", kart: "ust", sira: 1, hucre: function (u) { return '<span class="a-kod">' + u.e.kod + "</span>" + kirp(u.t.ad + " · " + MV.tesis(u.tesis).ad, "a-alt-satir"); } },
    { k: "kusur", baslik: "Kusur", kart: "govde", sira: 2, hucre: function (u) { return '<span class="a-kart-etiket">Kusur</span><span>' + rozet({ ad: u.sinif, rozet: SINIF[u.sinif] }) + " " + kacis(u.kriter) + '<span class="a-alt-satir">' + kacis(u.aciklama) + "</span></span>"; } },
    { k: "rapor", baslik: "Rapor", kart: "govde", sira: 3, hucre: function (u) { return '<span class="a-kart-etiket">Rapor</span><a class="a-no" href="#/r/' + u.rapor.no + '">' + u.rapor.no + "</a>"; } },
    { k: "tarih", baslik: "Tespit", kart: "govde", sira: 4, hucre: function (u) { return '<span class="a-kart-etiket">Tespit</span>' + MK.tarihYaz(u.tarih); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (u) {
      return rozet(u.durum === "acik" ? { ad: "Açık", rozet: "a-rozet-red" } : { ad: "Giderildi", rozet: "a-rozet-tamam" }) + (u.kapatan ? '<span class="a-alt-satir">' + MK.gunKisa(u.kapatan.olustu) + " kontrolünde</span>" : "");
    } }
  ];
  function uygunsuzCiz() {
    MK.listeCiz({ on: "u", kayitlar: uygunsuzlar(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0; }); },
      bosVeri: { ikon: "circle-check", baslik: "Uygunsuzluk yok", metin: "İmzalı raporlarınızda uygunsuz bulunan ekipman yok." },
      tablo: { baslik: "Uygunsuzluklar", sinif: "a-tablo-uygunsuz", sutunlar: U_SUTUN, href: function (u) { return "#/r/" + u.rapor.no; } } });
    $("a-sayfa").innerHTML = "";
  }

  /* ── RAPOR (PDF önizlemesi) ─────────────────────────────────────────────────────────────────────────── */
  function raporSayfa(r) {
    r = MV.musteriSurumu(r);
    var ok = r && tid().indexOf(r.tesis) >= 0;
    if (!ok) {   /* başka müşterinin ya da imzasız rapor: VAR OLDUĞU BİLE söylenmez */
      $("a-nesne").innerHTML = MK.kirinti([["Raporlarınız", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Rapor bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Rapor bulunamadı", metin: "Bu adreste size açık bir rapor yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Raporlara dön</a>" });
      return;
    }
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), u = uygunsuzlar().filter(function (x) { return x.rapor === r; })[0];
    $("a-nesne").innerHTML = MK.kirinti([["Raporlarınız", "#/"], [MV.surumNo(r)]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + MV.surumNo(r) + "</h1>" + sonucHtml(MV.sonucAd(r)) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("wrench", "a-ikon-kucuk") + '<span><span class="a-kod">' + e.kod + "</span> · " + kacis(t.ad) + " · " + kacis(MV.tesis(r.tesis).ad) + " · kontrol " + MK.tarihYaz(r.olustu) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF indir", ikon: "file-text" }) + "</div></div>" +
      (r._yerine ? '<div class="a-serit-kap">' + MK.serit("bilgi", "file-pen-line", "Bu rapor " + kacis(MV.surumNo(r)) + ", " + kacis(r._yerine) + " raporunun yerine geçer.") + "</div>" : "") +
      (u ? '<div class="a-serit-kap">' + MK.serit(u.durum === "acik" ? "uyari" : "onay", u.durum === "acik" ? "triangle-alert" : "circle-check",
        (u.durum === "acik" ? "Açık uygunsuzluk · " : "Giderildi · ") + kacis(u.sinif) + ": " + kacis(u.kriter) + (u.durum === "acik" ? (u.sinif === "Hafif" ? " — sonraki kontrole kadar giderilmeli." : " — giderilene kadar kullanılamaz; giderilince ikinci kontrol istenir.") : "")) + "</div>" : "") +
      MB.belge(t, MV.raporBelge(r));
  }

  /* ── PLANLANAN KONTROLLER (reisim 81) · SÖZLEŞMELER (reisim 134: görünür, panelden imza atılmaz) ───────────────────────── */
  function planCiz() {
    var l = tesisleri().map(function (t) { return { t: t, acik: MV.acikPlan(t) }; });
    var SUT = [
      { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (x) { return kirp(x.t.ad) + kirp(x.t.ilce + " / " + x.t.il, "a-alt-satir"); } },
      { k: "plan", baslik: "Planlanan kontrol", kart: "govde", sira: 2, hucre: function (x) {
        return '<span class="a-kart-etiket">Planlanan kontrol</span>' + (x.acik ? '<span><span class="a-tarih-gun">' + MK.gunYaz(x.t.ptarih) + '</span><span class="a-tarih-saat">' + (x.t.pbitTarih && x.t.pbitTarih !== x.t.ptarih ? "– " + MK.gunYaz(x.t.pbitTarih) : "") + "</span></span>" : '<span class="a-deger-yok">Yok</span>'); } },
      { k: "sonraki", baslik: "Sonraki kontrol", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Sonraki kontrol</span>' + MK.tarihYaz(x.t.sonraki); } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return x.acik ? rozet(MV.PLAN_DURUM[x.t.pdurum]) : '<span class="a-deger-yok">—</span>'; } }
    ];
    $("a-sayac").innerHTML = "<b>" + l.filter(function (x) { return x.acik; }).length + "</b> planlı";
    $("a-liste").innerHTML = MK.tablo({ baslik: "Planlanan kontroller", sinif: "a-tablo-mplan", sutunlar: SUT, kayitlar: l });
  }
  var SOZ_DURUM = { imza: { ad: "İmza bekliyor", rozet: "a-rozet-bekliyor" }, yururlukte: { ad: "Yürürlükte", rozet: "a-rozet-tamam" }, suresi: { ad: "Süresi doldu", rozet: "a-rozet-notr" } };
  var sozlesmeler = function () { var ts = tid(); return MV.IS_SOZLESMELERI.filter(function (x) { return x.m === M.id && x.tesisler.some(function (t) { return ts.indexOf(t) >= 0; }); }); };
  function sozCiz() {
    var l = sozlesmeler(), ek = q !== "m1" ? "?musteri=" + q : "";
    var SUT = [
      { k: "no", baslik: "Sözleşme", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/s/' + x.no + ek + '">' + x.no + "</a>"; } },
      { k: "tesis", baslik: "Tesisler", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Tesisler</span>' + kirp(x.tesisler.map(function (t) { return MV.tesis(t).ad; }).join(", ")); } },
      { k: "donem", baslik: "Dönem", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Dönem</span>' + MK.tarihYaz(x.baslangic) + " – " + MK.tarihYaz(x.bitis); } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(SOZ_DURUM[MV.isDurum(x)]); } }
    ];
    $("a-sayac").innerHTML = "<b>" + l.length + "</b> sözleşme";
    $("a-liste").innerHTML = l.length ? MK.tablo({ baslik: "Sözleşmeler", sinif: "a-tablo-msoz", sutunlar: SUT, kayitlar: l, href: function (x) { return "#/s/" + x.no + ek; } })
      : MK.bos({ ikon: "scroll-text", baslik: "Sözleşme yok", metin: "Size açılmış bir sözleşme yok." });
  }
  function sozSayfa(x) {
    var ek = q !== "m1" ? "?musteri=" + q : "";
    if (!x || sozlesmeler().indexOf(x) < 0) {
      $("a-nesne").innerHTML = MK.kirinti([["Sözleşmeler", "#/sozlesme" + ek]]) + '<h1 class="a-gizli" tabindex="-1">Sözleşme bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Sözleşme bulunamadı", metin: "Bu adreste size açık bir sözleşme yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/sozlesme' + ek + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Sözleşmelere dön</a>" });
      return;
    }
    $("a-nesne").innerHTML = MK.kirinti([["Sözleşmeler", "#/sozlesme" + ek], [x.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + x.no + "</h1>" + rozet(SOZ_DURUM[MV.isDurum(x)]) + "</div></div>" +
        (x.dosya ? '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "PDF indir", ikon: "file-text" }) + "</div>" : "") + "</div>" +
      MB.isSozlesmesi({ x: x });
  }

  /* ── "UYGUNSUZLARI İNDİR" (Excel) ÖNİZLEMESİ ───────────────────────────────────────────────────────────── */
  function excelAc() {
    var l = uygunsuzlar().filter(function (u) { return u.durum === "acik"; });
    $("a-pencere-baslik").textContent = "Uygunsuzları indir (Excel)";
    $("a-pencere-govde").innerHTML = '<p class="a-bolum-aciklama"><b>' + l.length + " açık uygunsuzluk</b> · " + kacis(M.unvan) + " · " + MK.tarihYaz(MK.BUGUN) + "</p>" +
      /* önizleme iki sütun (telefonda da okunur); dosyanın kendisinde her alan ayrı sütun */
      '<table class="a-belge-tablo"><thead><tr><th scope="col">Uygunsuzluk</th><th scope="col">Rapor</th></tr></thead><tbody>' +
      l.map(function (u) { return '<tr><td><span class="a-kod">' + u.e.kod + "</span> " + kacis(u.t.ad) + '<span class="a-alt-satir">' + kacis(MV.tesis(u.tesis).ad) + " · " + kacis(u.sinif) + " · " + kacis(u.kriter) + "</span>" +
        '</td><td><a class="a-no" href="#/r/' + u.rapor.no + '">' + u.rapor.no + "</a></td></tr>"; }).join("") + "</tbody></table>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "excel-indir", ad: "İndir (.xlsx)", ikon: "file-check" });
    if (!$("a-pencere").open) $("a-pencere").showModal();
    document.querySelector('[data-eylem="excel-indir"]').focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/excel") return { v: "uygunsuz", pencere: true };
    if (h === "#/uygunsuz") return { v: "uygunsuz" };
    if (h === "#/plan") return { v: "plan" };
    if (h === "#/sozlesme") return { v: "sozlesme" };
    if ((m = /^#\/s\/([A-Za-z0-9-]+)$/.exec(h))) return { v: "soz", no: m[1] };
    if ((m = /^#\/r\/([A-Za-z0-9-]+)$/.exec(h))) return { v: "rapor", no: m[1] };
    return { v: "rapor-liste" };
  }
  function goster(odakla) {
    var r = rota(), liste = r.v !== "rapor" && r.v !== "soz", musteriEk = q !== "m1" ? "?musteri=" + q : "";
    $("a-liste-gorunum").hidden = !liste; $("a-nesne").hidden = liste;
    if (liste) {
      var u = r.v === "uygunsuz", pl = r.v === "plan", sz = r.v === "sozlesme", acik = uygunsuzlar().filter(function (x) { return x.durum === "acik"; }).length;
      $("a-liste-gorunum").querySelector("h1").textContent = u ? "Uygunsuzluklar" : pl ? "Planlanan kontroller" : sz ? "Sözleşmeler" : "Raporlarınız";
      $("a-alt").innerHTML = kacis(M.unvan) + " · " + (KUL ? (KUL.tesis === "hepsi" ? "bütün tesisler" : tesisleri().map(function (t) { return t.ad; }).join(", ")) : "kullanıcı yok");
      var sekme = function (h, ad, akt, ek) { return '<a class="a-sekme" href="#/' + h + musteriEk + '"' + (akt ? ' aria-current="page"' : "") + ">" + ad + (ek || "") + "</a>"; };
      $("a-sekmeler").innerHTML = sekme("", "Raporlar", !u && !pl && !sz) + sekme("uygunsuz", "Uygunsuzluklar", u, ' <span class="a-cip-sayi">' + acik + "</span>") +
        sekme("plan", "Planlanan kontroller", pl) + sekme("sozlesme", "Sözleşmeler", sz);
      $("a-uyari").innerHTML = !KUL ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Bu müşterinin giriş yapan kullanıcısı yok.") + "</div>" : "";
      document.querySelector('[data-eylem="excel-ac"]').hidden = !u;
      if (pl || sz) { $("a-suzgec-kap").innerHTML = ""; $("a-sayfa").innerHTML = ""; if (pl) planCiz(); else sozCiz(); }
      else { $("a-suzgec-kap").innerHTML = MK.suzgecHtml(u ? "u" : "m"); MK.suzgecKur(u ? "u" : "m"); }
    } else if (r.v === "soz") sozSayfa(MV.isSozlesmesi(r.no));
    else raporSayfa(MV.rapor(r.no));
    document.title = (r.v === "rapor" || r.v === "soz" ? r.no : r.v === "uygunsuz" ? "Uygunsuzluklar" : r.v === "plan" ? "Planlanan kontroller" : r.v === "sozlesme" ? "Sözleşmeler" : "Raporlarınız") + " · müşteri paneli · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere) excelAc(); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem;
  X["excel-ac"] = excelAc;
  /* 2026-09-27: açık uygunsuzluklar gerçek .xlsx (kayıtlardan; PDF'ten okunmaz) */
  X["excel-indir"] = function () {
    var l = uygunsuzlar().filter(function (u) { return u.durum === "acik"; });
    $("a-pencere").close();
    MK.indir("uygunsuzluklar-" + MK.BUGUN + ".xlsx", MK.xlsx("Uygunsuzluklar", [["Ekipman kodu", "Ekipman türü", "Tesis", "Sınıf", "Kriter", "Açıklama", "Rapor no", "Kontrol tarihi"]].concat(l.map(function (u) {
      return [u.e.kod, u.t.ad, MV.tesis(u.tesis).ad, u.sinif, u.kriter, u.aciklama, u.rapor.no, MK.tarihYaz(u.tarih)]; }))));
  };
  /* imzalı rapor ya da sözleşme belgesi yazdırma penceresinden PDF olur */
  X["pdf"] = function () {
    var r = rota();
    if (r.v === "soz") MK.yazdir(r.no, MB.isSozlesmesi({ x: MV.isSozlesmesi(r.no) }));
    else { var rp = MV.musteriSurumu(MV.rapor(r.no)); if (!rp) return; MK.yazdir(MV.surumNo(rp), MB.belge(MV.tur(MV.ekipman(rp.kod).tur), MV.raporBelge(rp))); }
  };
  $("a-pencere").addEventListener("close", function () { if (rota().pencere) history.replaceState(null, "", "#/uygunsuz" + (q !== "m1" ? "?musteri=" + q : "")); });

  MK.kabuk({ musteri: { ad: M.kisa, firma: MV.FIRMA.ad }, kullanici: KUL ? { bas: MV.bas(KUL.ad), ad: KUL.ad, rol: M.kisa } : { bas: "—", ad: "Portal kullanıcısı yok", rol: M.kisa } });
  goster(false);
})();
