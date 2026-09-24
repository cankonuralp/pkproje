/* ══ probata MAKET M16 — Eğitim Takibi (modül 10, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1.1 ("personelin ilgili eğitimi ve tekrar süreleri sistem üzerinden takip edilebilecek"), §3.1 modül 10 (personel
   eğitimleri, belge, tekrar süresi, bitmeden uyarı — uyarı M10'da, yalnız ekranda), §7 (eğitim kaydı: personel, eğitim, belge, tekrar süresi).
   Ekranlar: kayıtlar (#/ ; ?kisi= personel kartından ve Uyarılar'dan) · eğitim türleri (#/turler) · kayıt ekle / tekrarı kaydet penceresi
   (#/yeni?kisi=&tur=) · kayıt penceresi (#/k/<id>: ayrıntı + aynı eğitimin önceki kayıtları). Tekrar kaydedilince eskisi "önceki" olur.
   Eğitim adları ve tekrar süreleri ÖRNEK (mevzuat karşılığı doğrulanmadı — soru). Kullanıcı: Ayşe Demir (firma yöneticisi). UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var E = MV.EGITIMLER, TUR = MV.EGITIM_TURLERI;
  var DURUM = { gecti: { ad: "Tekrarı geçti", rozet: "a-rozet-red" }, yakin: { ad: "60 gün içinde", rozet: "a-rozet-bekliyor" }, gecerli: { ad: "Geçerli", rozet: "a-rozet-tamam" } };
  var ONCEKI = { ad: "Önceki kayıt", rozet: "a-rozet-notr" };
  var kalan = function (x) { return MK.gunFarki(MK.BUGUN, x.tekrar); };
  var belgeAdi = function (x) { return "egitim-" + x.kisi + "-" + x.k + "-" + x.tarih.slice(0, 4) + ".pdf"; };
  var KISILER = MV.PERSONEL.filter(function (p) { return p.durum === "etkin"; });

  /* ── KAYITLAR ─────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("g", { ad: "Eğitimlerde ara", ipucu: "Kişi, eğitim", birim: "kayıt", sayfa: 20,
    cipler: [
      { k: "gecti", ad: "Tekrarı geçti", grup: "durum", test: function (x) { return !x.onceki && MV.egitimDurum(x) === "gecti"; } },
      { k: "yakin", ad: "60 gün içinde", grup: "durum", test: function (x) { return !x.onceki && MV.egitimDurum(x) === "yakin"; } },
      { k: "gecerli", ad: "Geçerli", grup: "durum", test: function (x) { return !x.onceki && MV.egitimDurum(x) === "gecerli"; } },
      { k: "belgesiz", ad: "Belgesi yok", test: function (x) { return !x.belge; } }
    ],
    seciciler: [
      { k: "kisi", ad: "Kişi", secenek: function () { return [["tumu", "Tümü"]].concat(KISILER.map(function (p) { return [p.id, p.ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); })); },
        gecer: function (x, v) { return v === "tumu" || x.kisi === v; } },
      { k: "tur", ad: "Eğitim", secenek: function () { return [["tumu", "Tümü"]].concat(TUR.map(function (t) { return [t.k, t.ad]; })); }, gecer: function (x, v) { return v === "tumu" || x.k === v; } },
      { k: "gorunum", ad: "Görünüm", bas: "guncel", secenek: function () { return [["guncel", "Güncel kayıtlar"], ["onceki", "Önceki kayıtlar"], ["hepsi", "Hepsi"]]; },
        gecer: function (x, v) { return v === "hepsi" || (v === "guncel" ? !x.onceki : !!x.onceki); } }
    ],
    metin: function (x) { var p = MV.kisi(x.kisi); return [p.ad, MV.meslekAd(p), MV.egitimTuru(x.k).ad, x.kurum].join(" "); },
    imkansiz: "Bir kayıt aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "kisi", baslik: "Personel", kart: "ust", sira: 1, hucre: function (x) { var p = MV.kisi(x.kisi); return '<a class="a-ad-bag" href="#/k/' + x.id + '">' + kacis(p.ad) + "</a>" + kirp(MV.meslekAd(p), "a-alt-satir"); } },
    { k: "egitim", baslik: "Eğitim", kart: "govde", sira: 2, hucre: function (x) { return "<span>" + kirp(MV.egitimTuru(x.k).ad) + kirp(x.kurum, "a-alt-satir") + "</span>"; } },
    { k: "tarih", baslik: "Alındı", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Alındı</span>' + MK.tarihYaz(x.tarih); } },
    { k: "tekrar", baslik: "Tekrar", kart: "govde", sira: 4, hucre: function (x) {
      var k = kalan(x), d = MV.egitimDurum(x);
      return '<span class="a-kart-etiket">Tekrar</span><span><span class="a-tarih-gun">' + MK.tarihYaz(x.tekrar) + "</span>" + (x.onceki ? '<span class="a-tarih-saat">yenilendi</span>'
        : '<span class="' + (d === "gecerli" ? "a-tarih-saat" : "a-uyari-metin") + '">' + (k < 0 ? -k + " gün geçti" : k + " gün kaldı") + "</span>") + "</span>";
    } },
    { k: "belge", baslik: "Belge", kart: "govde", sira: 5, hucre: function (x) { return '<span class="a-kart-etiket">Belge</span>' + (x.belge ? '<span class="a-hucre-satir">' + ikon("file-check", "a-ikon-kucuk") + "Var</span>" : '<span class="a-uyari-metin">Yok</span>'); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(x.onceki ? ONCEKI : DURUM[MV.egitimDurum(x)]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "g", kayitlar: E, sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tekrar < b.tekrar ? -1 : a.tekrar > b.tekrar ? 1 : MV.kisi(a.kisi).ad.localeCompare(MV.kisi(b.kisi).ad, "tr"); }); },
      bosVeri: { ikon: "graduation-cap", baslik: "Eğitim kaydı yok", metin: "“Eğitim kaydı ekle” ile kişi, eğitim ve tarih girilir; tekrar tarihi türden hesaplanır." },
      tablo: { baslik: "Eğitim kayıtları", sinif: "a-tablo-egitim", sutunlar: SUTUN, href: function (x) { return "#/k/" + x.id; } } });
    var gec = E.filter(function (x) { return !x.onceki && MV.egitimDurum(x) === "gecti"; }), yak = E.filter(function (x) { return !x.onceki && MV.egitimDurum(x) === "yakin"; });
    $("a-uyari").innerHTML = gec.length || yak.length ? '<div class="a-uyari-serit">' + MK.serit(gec.length ? "hata" : "uyari", "graduation-cap",
      (gec.length ? "<b>" + gec.length + " eğitimin tekrarı geçti</b> (" + gec.map(function (x) { return kacis(MV.kisi(x.kisi).ad) + " · " + MV.egitimTuru(x.k).ad; }).join(", ") + ")" + (yak.length ? "; " : ".") : "") +
      (yak.length ? yak.length + " eğitimin tekrarı 60 gün içinde." : "") + " Yalnız ekranda; Uyarılar'da da görünür.") + "</div>" : "";
  }

  /* ── EĞİTİM TÜRLERİ ─────────────────────────────────────────────────────────────────────────────────── */
  var T_SUTUN = [
    { k: "ad", baslik: "Eğitim", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-ad-bag" href="#/?tur=' + t.k + '">' + kacis(t.ad) + "</a>"; } },
    { k: "tekrar", baslik: "Tekrar süresi", kart: "govde", sira: 2, hucre: function (t) { return '<span class="a-kart-etiket">Tekrar süresi</span>' + t.tekrar + " ay"; } },
    { k: "kisi", baslik: "Kişi", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">Kişi</span><span class="a-sayi">' + E.filter(function (x) { return x.k === t.k && !x.onceki; }).length + "</span>"; } },
    { k: "durum", baslik: "Tekrarı yaklaşan", kart: "rozet", sira: 1, hucre: function (t) {
      var l = E.filter(function (x) { return x.k === t.k && !x.onceki && MV.egitimDurum(x) !== "gecerli"; }), gec = l.filter(function (x) { return MV.egitimDurum(x) === "gecti"; }).length;
      return l.length ? rozet({ ad: gec ? gec + " geçti" + (l.length > gec ? " · " + (l.length - gec) + " yakın" : "") : l.length + " yakın", rozet: gec ? "a-rozet-red" : "a-rozet-bekliyor" }) : '<span class="a-deger-yok">—</span>';
    } }
  ];
  function turCiz() {
    $("a-sayac").innerHTML = "<b>" + TUR.length + "</b> eğitim türü"; $("a-uyari").innerHTML = ""; $("a-suzgec-kap").innerHTML = ""; $("a-sayfa").innerHTML = "";
    $("a-liste").innerHTML = '<p class="a-bolum-aciklama">Tekrar süresi türde tanımlıdır; kayıt eklenince tekrar tarihi buradan hesaplanır. Adlar ve süreler örnek (soru 153).</p>' +
      MK.tablo({ baslik: "Eğitim türleri", sinif: "a-tablo-egitimtur", sutunlar: T_SUTUN, kayitlar: TUR, href: function (t) { return "#/?tur=" + t.k; } });
  }

  /* ── PENCERE: kayıt ekle · tekrarı kaydet · kayıt ─────────────────────────────────────────────────────── */
  var W = null;
  var tarihIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s).trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  var ayEkle = function (iso, n) { var d = new Date(iso + "T12:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
  var guncel = function (kisi, k) { return E.filter(function (x) { return x.kisi === kisi && x.k === k && !x.onceki; })[0]; };
  function formCiz(odak) {
    var d = W.d, h = W.hata, t = d.k ? MV.egitimTuru(d.k) : null, ti = tarihIso(d.tarih), eski = d.kisi && d.k ? guncel(d.kisi, d.k) : null;
    $("a-pencere-baslik").textContent = W.tekrar ? "Tekrarı kaydet" : "Eğitim kaydı ekle";
    $("a-pencere-govde").innerHTML = (eski ? '<div class="a-serit-kap">' + MK.serit("bilgi", "history", "Bu kişinin bu eğitimde güncel kaydı var (" + MK.tarihYaz(eski.tarih) + "); kaydedince o kayıt “önceki” olur.") + "</div>" : "") +
      '<div class="a-form">' +
        MK.alan({ id: "w-kisi", etiket: "Personel", zorunlu: true, hata: h.kisi, girdi: MK.secim({ id: "w-kisi", ad: "Personel", deger: d.kisi, secenekler: KISILER.map(function (p) { return [p.id, p.ad, MV.meslekAd(p)]; }), ipucu: "Kişi seçin", gecersiz: !!h.kisi, tanim: h.kisi ? "w-kisi-ipucu" : "" }) }) +
        MK.alan({ id: "w-k", etiket: "Eğitim", zorunlu: true, hata: h.k, ipucu: t ? "Tekrar süresi " + t.tekrar + " ay" : "", girdi: MK.secim({ id: "w-k", ad: "Eğitim", deger: d.k, secenekler: TUR.map(function (x) { return [x.k, x.ad, x.tekrar + " ay"]; }), ipucu: "Eğitim seçin", gecersiz: !!h.k, tanim: t || h.k ? "w-k-ipucu" : "" }) }) +
        MK.alan({ id: "w-tarih", etiket: "Eğitim tarihi", zorunlu: true, hata: h.tarih, ipucu: ti && t ? "Tekrar " + MK.tarihYaz(ayEkle(ti, t.tekrar)) : "GG.AA.YYYY",
          girdi: MK.girdi({ id: "w-tarih", alan: "tarih", deger: d.tarih, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.tarih }) }) +
        '<div class="a-alan-grup"><p class="a-etiket">Veren</p><div class="a-sekmeler" role="group" aria-label="Eğitimi veren">' +
          '<button type="button" class="a-sekme" data-kurum="Firma içi" aria-pressed="' + (d.kurum === "Firma içi") + '">Firma içi</button>' +
          '<button type="button" class="a-sekme" data-kurum="Dış eğitim kurumu" aria-pressed="' + (d.kurum === "Dış eğitim kurumu") + '">Dış kurum</button></div></div>' +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sertifika</p><div class="a-dosya">' +
          MK.tus({ eylem: "dosya-sec", ad: d.belge ? "Değiştir" : "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
          (d.belge ? '<span class="a-dosya-ad">sertifika.pdf</span>' : '<span class="a-dosya-ad a-deger-yok">İsteğe bağlı; yoksa listede “Belgesi yok”</span>') + "</div></div>" +
      "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" });
    if (odak) { var el = $(odak) || document.querySelector(odak); if (el) el.focus(); }
  }
  function kayitCiz(x) {
    var p = MV.kisi(x.kisi), t = MV.egitimTuru(x.k), d = MV.egitimDurum(x), k = kalan(x);
    var gecmis = E.filter(function (y) { return y.kisi === x.kisi && y.k === x.k && y !== x; }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; });
    $("a-pencere-baslik").textContent = t.ad;
    $("a-pencere-govde").innerHTML = '<div class="a-serit-kap">' + (x.onceki ? MK.serit("bilgi", "history", "Önceki kayıt: aynı eğitim " + MK.tarihYaz(guncel(x.kisi, x.k).tarih) + " tarihinde yenilendi.")
        : d === "gecerli" ? MK.serit("onay", "circle-check", "Geçerli; tekrar " + k + " gün sonra.") : MK.serit(d === "gecti" ? "hata" : "uyari", "clock", k < 0 ? "Tekrarı " + -k + " gün önce geçti." : "Tekrarı " + k + " gün sonra.")) + "</div>" +
      '<dl class="a-bilgi">' + bilgi("Personel", '<a class="a-baglanti" href="' + MK.adres(2, "#/p/" + p.id) + '">' + kacis(p.ad) + '</a><span class="a-alt-satir">' + kacis(MV.meslekAd(p)) + "</span>") +
        bilgi("Eğitim", kacis(t.ad) + '<span class="a-alt-satir">tekrar ' + t.tekrar + " ayda bir</span>") + bilgi("Tarih", MK.tarihYaz(x.tarih) + '<span class="a-alt-satir">' + kacis(x.kurum) + "</span>") +
        bilgi("Tekrar", MK.tarihYaz(x.tekrar)) + bilgi("Sertifika", x.belge ? '<span class="a-kod">' + belgeAdi(x) + '</span><span class="a-alt-satir">yalnız firma içinde, kısa ömürlü bağlantı</span>' : '<span class="a-uyari-metin">Yüklenmedi</span>', true) + "</dl>" +
      (gecmis.length ? '<p class="a-etiket a-bolum-serit">Bu eğitimin öteki kayıtları</p><ol class="a-gecmis">' + gecmis.map(function (y) {
        return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(y.tarih) + '</span><span class="a-gecmis-ne"><b>' + (y.onceki ? "Önceki kayıt" : "Güncel kayıt") + '</b> <span class="a-gecmis-rol">tekrar ' + MK.tarihYaz(y.tekrar) + "</span></span></li>"; }).join("") + "</ol>" : "");
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + (x.onceki ? "" : MK.tus({ eylem: "tekrar", ad: "Tekrarı kaydet", ikon: "refresh-cw", veri: { id: x.id } }));
  }
  function formAc(d, tekrar) {
    W = { tip: "form", tekrar: !!tekrar, d: Object.assign({ kisi: "", k: "", tarih: MK.BUGUN.slice(8, 10) + "." + MK.BUGUN.slice(5, 7) + "." + MK.BUGUN.slice(0, 4), kurum: "Firma içi", belge: false }, d), hata: {} };
    formCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    $(W.d.kisi && W.d.k ? "w-tarih" : W.d.kisi ? "w-k" : "w-kisi").focus();
  }
  function kayitAc(x) { W = { tip: "kayit", x: x }; kayitCiz(x); if (!$("a-pencere").open) $("a-pencere").showModal(); $("a-pencere-baslik").setAttribute("tabindex", "-1"); $("a-pencere-baslik").focus(); }
  var X = MK.eylem;
  X["yeni"] = function () { location.hash = "#/yeni" + (SZ.g.sec.kisi !== "tumu" ? "?kisi=" + SZ.g.sec.kisi : ""); };
  X["tekrar"] = function (el) { var x = E.filter(function (y) { return y.id === el.dataset.id; })[0]; history.replaceState(null, "", "#/yeni?kisi=" + x.kisi + "&tur=" + x.k); formAc({ kisi: x.kisi, k: x.k }, true); };
  X["dosya-sec"] = function () { W.d.belge = true; formCiz('[data-eylem="dosya-sec"]'); };
  X["kaydet"] = function () {
    var d = W.d, h = {}, ti = tarihIso(d.tarih);
    if (!d.kisi) h.kisi = "Personel seçilmeli.";
    if (!d.k) h.k = "Eğitim seçilmeli.";
    if (!ti) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    else if (ti > MK.BUGUN) h.tarih = "İleri tarihli eğitim kaydedilmez.";
    else if (ti < "2000-01-01") h.tarih = "2000'den önce olamaz.";
    else if (d.kisi && d.k && guncel(d.kisi, d.k) && ti <= guncel(d.kisi, d.k).tarih) h.tarih = "Güncel kayıttan (" + MK.tarihYaz(guncel(d.kisi, d.k).tarih) + ") sonra olmalı.";
    W.hata = h; var hk = Object.keys(h);
    if (hk.length) { formCiz("w-" + hk[0]); return; }
    var eski = guncel(d.kisi, d.k), t = MV.egitimTuru(d.k);
    var x = { id: "g" + (E.length + 1), kisi: d.kisi, k: d.k, tarih: ti, tekrar: ayEkle(ti, t.tekrar), belge: d.belge, kurum: d.kurum };
    if (eski) eski.onceki = true;   /* tek güncel kayıt kişi × eğitim; eskisi geçmişte kalır */
    E.push(x); $("a-pencere").close(); listeCiz();
    MK.bildir(MV.kisi(x.kisi).ad + " · " + t.ad + " kaydedildi; tekrar " + MK.tarihYaz(x.tekrar) + (eski ? ". Önceki kayıt geçmişte." : "."));
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W && W.tip === "form") W.d[k] = e.target.value; };
  MK.onSecim = function (id, deger) { if (!W || W.tip !== "form") return; W.d[id.slice(2)] = deger; delete W.hata[id.slice(2)]; formCiz(id); };
  MK.onTikla = function (e) { var b = e.target.closest("[data-kurum]"); if (!b || !W) return false; W.d.kurum = b.dataset.kurum; formCiz('[data-kurum="' + W.d.kurum + '"]'); return true; };
  $("a-pencere").addEventListener("close", function () { W = null; if (/^#\/(yeni|k\/)/.test(location.hash)) history.replaceState(null, "", "#/"); });

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m, q = function (k) { var x = new RegExp("[?&]" + k + "=([a-z0-9]+)").exec(h); return x ? x[1] : ""; };
    if (/^#\/turler/.test(h)) return { v: "tur" };
    if (/^#\/yeni/.test(h)) return { v: "kayit", pencere: "yeni", kisi: q("kisi"), tur: q("tur") };
    if ((m = /^#\/k\/(g[0-9]+)$/.exec(h))) return { v: "kayit", pencere: "kayit", id: m[1] };
    return { v: "kayit", kisi: q("kisi"), tur: q("tur") };
  }
  function goster(odakla) {
    var r = rota();
    $("a-sekme-kayit").removeAttribute("aria-current"); $("a-sekme-tur").removeAttribute("aria-current");
    $(r.v === "tur" ? "a-sekme-tur" : "a-sekme-kayit").setAttribute("aria-current", "page");
    if (r.v === "tur") turCiz();
    else {
      if (!r.pencere && (r.kisi || r.tur)) { MK.suzgecSifirla("g"); if (r.kisi && MV.kisi(r.kisi)) SZ.g.sec.kisi = r.kisi; if (r.tur && MV.egitimTuru(r.tur)) SZ.g.sec.tur = r.tur; }
      $("a-suzgec-kap").innerHTML = MK.suzgecHtml("g"); MK.suzgecKur("g");
    }
    if (r.pencere === "yeni") { if (!W) formAc({ kisi: MV.kisi(r.kisi) ? r.kisi : "", k: MV.egitimTuru(r.tur) ? r.tur : "" }, !!(r.kisi && r.tur)); }
    else if (r.pencere === "kayit") { var x = E.filter(function (y) { return y.id === r.id; })[0]; if (x) kayitAc(x); else { history.replaceState(null, "", "#/"); MK.bildir("Bu adreste kayıt yok."); } }
    else if ($("a-pencere").open) $("a-pencere").close();
    document.title = (r.v === "tur" ? "Eğitim türleri" : "Eğitimler") + " · probata maket";
    if (odakla && !r.pencere) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;

  MK.kabuk({ modul: 10, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  goster(false);
})();
