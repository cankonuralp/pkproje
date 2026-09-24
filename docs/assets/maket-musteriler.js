/* ══ probata MAKET M2 — Müşteri ve Tesis (modül 3) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════
   Kaynak: pkproje.md §2 (müşteri e-postayla girer; bir müşterinin birden çok tesisi; tesis = raporun adresi), §4.2 1.7.1
   (raporda işyerinin ünvanı, SGK sicil no, adres, sözleşme no zorunlu), §7 (SGK işyeri sicil no TESİSTE), §3.2 (plan: müşteri →
   tesis; İSG-KATİP kişi × tesis; öneri 8: imzada bilgi rapora kopyalanır). Ekranlar: liste (#/) · müşteri (#/m/<id>) · tesis
   (#/t/<id>) · pencereler: müşteri ekle/düzenle · tesis ekle/düzenle · müşteri kullanıcısı ekle. Bakış: planlama ekibi (öneri
   tablosunda Müşteriler'i değiştirir). Veri ortak (maket-veri.js), UYDURMA. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var BUGUN = MK.BUGUN;
  var HESAP = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, davet: { ad: "Davet bekliyor", rozet: "a-rozet-bekliyor" }, pasif: { ad: "Pasif", rozet: "a-rozet-notr" } };
  var kalan = function (t) { return MK.gunFarki(BUGUN, t); };
  var ekipmanSayisi = function (m) { return MV.tesisleri(m.id).reduce(function (n, t) { return n + t.ekipman; }, 0); };
  var enYakin = function (m) { return MV.tesisleri(m.id).map(function (t) { return t.sonraki; }).sort()[0]; };
  var yakin = function (tarih) { var k = kalan(tarih); return k <= 30; };
  var isgsiz = function (m) { return MV.tesisleri(m.id).filter(function (t) { return !MV.isgTesis(t.id).length; }); };
  var portal = function (m) { return MV.musteriKullanicilari(m.id).filter(function (k) { return k.durum !== "pasif"; }); };
  /* "kontrol tarihi" metni: geçmiş · bugün · N gün (30 gün içi uyarı rengi) */
  function tarihHtml(t) {
    if (!t) return '<span class="a-deger-yok">—</span>';
    var k = kalan(t), not = k < 0 ? -k + " gün geçti" : k === 0 ? "Bugün" : k + " gün";
    return '<span class="a-tarih-gun">' + MK.tarihYaz(t) + '</span><span class="' + (k <= 30 ? "a-uyari-metin" : "a-tarih-saat") + '">' + not + "</span>";
  }
  var adBag = function (href, metin, alt) { return '<a class="a-ad-bag" href="' + href + '">' + kirp(metin) + "</a>" + (alt ? '<span class="a-alt-satir">' + alt + "</span>" : ""); };

  /* ── MÜŞTERİLER LİSTESİ ─────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("m", { ad: "Müşterilerde ara", ipucu: "Ünvan, vergi no, tesis, il", birim: "müşteri",
    cipler: [
      { k: "yakin", ad: "Kontrolü 30 gün içinde", test: function (m) { return yakin(enYakin(m)); } },
      { k: "isgsiz", ad: "İSG-KATİP kaydı olmayan tesis", test: function (m) { return isgsiz(m).length > 0; } },
      { k: "portalsiz", ad: "Portal kullanıcısı yok", test: function (m) { return !portal(m).length; } },
      { k: "uygunsuz", ad: "Açık uygunsuzluk", test: function (m) { return MV.acikUygunsuz(m.id) > 0; } }
    ],
    seciciler: [{ k: "il", ad: "İl", secenek: function () {
      return [["tumu", "Tümü"]].concat(MV.TESISLER.map(function (t) { return t.il; }).filter(function (v, i, a) { return a.indexOf(v) === i; })
        .sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (x) { return [x, x]; }));
    }, gecer: function (m, v) { return v === "tumu" || MV.tesisleri(m.id).some(function (t) { return t.il === v; }); } }],
    metin: function (m) { return [m.unvan, m.kisa, m.vno].concat(MV.tesisleri(m.id).map(function (t) { return t.ad + " " + t.ilce + " " + t.il; })).join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "unvan", baslik: "Müşteri", kart: "ust", sira: 1, hucre: function (m) { return adBag("#/m/" + m.id, m.unvan, "VKN " + m.vno); } },
    { k: "tesis", baslik: "Tesisler", kart: "govde", sira: 2, hucre: function (m) {
      var t = MV.tesisleri(m.id), iller = t.map(function (x) { return x.il; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span><span class="a-sayi">' + t.length + " tesis</span>" + '<span class="a-alt-satir">' + iller.join(" · ") + "</span></span></span>";
    } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 3, hucre: function (m) { return '<span class="a-sayi"><span class="a-kart-etiket">Ekipman</span>' + ekipmanSayisi(m) + "</span>"; } },
    { k: "portal", baslik: "Portal", kart: "govde", sira: 4, hucre: function (m) {
      var n = portal(m).length;
      return '<span class="a-kart-etiket">Portal kullanıcısı</span>' + (n ? '<span class="a-sayi">' + n + " kullanıcı</span>" : '<span class="a-uyari-metin">Yok</span>');
    } },
    { k: "sonraki", baslik: "En yakın kontrol", kart: "govde", sira: 5, hucre: function (m) { return '<span class="a-kart-etiket">En yakın kontrol</span>' + tarihHtml(enYakin(m)); } },
    { k: "durum", baslik: "Uygunsuzluk", kart: "rozet", sira: 1, hucre: function (m) {
      var e = isgsiz(m).length;
      var u = MV.acikUygunsuz(m.id);   /* 2026-09-24 (M11): uygunsuzluk kayıtlarından (önceden sabit sayı) */
      return (u ? rozet({ ad: u + " açık uygunsuzluk", rozet: "a-rozet-red" }) : "") +
        (e ? '<span class="a-uyari-metin">' + e + " tesiste İSG-KATİP yok</span>" : "") + (!u && !e ? '<span class="a-deger-yok">—</span>' : "");
    } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "m", kayitlar: MV.MUSTERILER, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.unvan.localeCompare(b.unvan, "tr"); }); },
      bosVeri: { ikon: "building-2", baslik: "Müşteri yok", metin: "“Müşteri ekle” ile ilk müşteri ve tesisi kaydedilir." },
      tablo: { baslik: "Müşteriler", sinif: "a-tablo-musteri", sutunlar: SUTUN, href: function (m) { return "#/m/" + m.id; } } });
  }

  /* ── ORTAK: bilgi yüzü (tıklanırsa bağlantı; hedef hazır değilse bildirim) ─────────────────────────── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    if (!o.hedef) return '<div class="a-yuz">' + ic + "</div>";
    var h = MK.adres(o.hedef, o.hash);
    return h ? '<a class="a-yuz" href="' + h + '">' + ic + "</a>" : '<a class="a-yuz" href="#" data-eylem="modul" data-ne="' + o.ne + '">' + ic + "</a>";
  }
  var planAc = function (hash) { return MK.git({ hedef: "plan-ac", hash: hash, ad: "Plan aç", ikon: "calendar-check", sinif: "a-tus-birincil", ne: "Plan açma" }); };

  /* ── MÜŞTERİ SAYFASI ───────────────────────────────────────────────────────────────────────────── */
  var TESIS_SUTUN = [
    { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (t) { return adBag("#/t/" + t.id, t.ad); } },
    { k: "adres", baslik: "Adres", kart: "govde", sira: 2, hucre: function (t) {
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' + kirp(t.adres, "a-adres-sokak", t.adres + ", " + t.ilce + " / " + t.il) + '<span class="a-adres-il">' + t.ilce + " / " + t.il + "</span></span></span>";
    } },
    { k: "sgk", baslik: "SGK işyeri sicil no", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">SGK işyeri sicil no</span><span class="a-kod a-kod-uzun">' + t.sgk + "</span>"; } },
    { k: "isg", baslik: "İSG-KATİP", kart: "govde", sira: 4, hucre: function (t) {
      var n = MV.isgTesis(t.id).length; return '<span class="a-kart-etiket">İSG-KATİP</span>' + (n ? '<span class="a-sayi">' + n + " kayıt</span>" : '<span class="a-uyari-metin">Kayıt yok</span>');
    } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 5, hucre: function (t) { return '<span class="a-sayi"><span class="a-kart-etiket">Ekipman</span>' + t.ekipman + "</span>"; } },
    { k: "sonraki", baslik: "Sonraki kontrol", kart: "rozet", sira: 1, hucre: function (t) { return tarihHtml(t.sonraki); } }
  ];
  var KULLANICI_SUTUN = [
    { k: "ad", baslik: "Ad soyad", kart: "ust", sira: 1, hucre: function (k) { return '<span class="a-ekipman-ad">' + kacis(k.ad) + "</span>" + kirp(k.eposta, "a-alt-satir"); } },
    { k: "tesis", baslik: "Gördüğü tesisler", kart: "govde", sira: 2, hucre: function (k) {
      return '<span class="a-kart-etiket">Gördüğü tesisler</span>' + (k.tesis === "hepsi" ? "Bütün tesisler" : kacis(k.tesis.map(function (id) { return MV.tesis(id).ad; }).join(", ")));
    } },
    { k: "son", baslik: "Son giriş", kart: "govde", sira: 3, hucre: function (k) {
      return '<span class="a-kart-etiket">' + (k.durum === "davet" ? "Davet gönderildi" : "Son giriş") + '</span><span class="a-tarih-saat">' + MK.zamanYaz(k.durum === "davet" ? k.davet : k.son) + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (k) { return rozet(HESAP[k.durum]); } }
  ];
  function musteriCiz(m) {
    if (!m) return bulunamadi("Müşteri bulunamadı");
    var t = MV.tesisleri(m.id), acikPlan = t.filter(function (x) { return x.pid && ["bekliyor", "kabul", "denetimde"].indexOf(x.pdurum) >= 0; }).length;
    var kul = MV.musteriKullanicilari(m.id);
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"], [m.kisa]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(m.unvan) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(m.vd) + " VD · VKN " + m.vno + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "musteri-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil" }) + planAc("#/?musteri=" + m.id) + "</div></div>" +
      '<div class="a-yuzler">' +
        yuz({ ikon: "map-pin", ad: "Tesis", sayi: t.length, not: t.map(function (x) { return x.il; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" · ") }) +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: ekipmanSayisi(m), hedef: 7, hash: "#/?musteri=" + m.id, ne: "Ekipmanlar" }) +
        yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: acikPlan, hedef: 13, hash: "", ne: "Planlar", not: "kabul bekleyen ve süren" }) +
        yuz({ ikon: "triangle-alert", ad: "Açık uygunsuzluk", sayi: MV.acikUygunsuz(m.id), hedef: "musteri", hash: "#/uygunsuz?musteri=" + m.id, ne: "Müşteri paneli", uyari: MV.acikUygunsuz(m.id) > 0, not: MV.acikUygunsuz(m.id) ? "müşteri panelinde gördüğü" : "yok" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-bilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bilgi">Müşteri bilgileri</h2></div><dl class="a-bilgi">' +
        bilgi("Ünvan", kacis(m.unvan), true) + bilgi("Kısa ad", kacis(m.kisa)) + bilgi("Vergi dairesi", kacis(m.vd)) + bilgi("Vergi no", '<span class="a-kod">' + m.vno + "</span>") +
        bilgi("Fatura e-postası", kacis(m.eposta), true) + bilgi("İlgili kişi", kacis(m.ilgili), true) + bilgi("Müşteri olduğu tarih", MK.tarihYaz(m.acilis)) +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-tesis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tesis">Tesisler</h2><span class="a-sayac"><b>' + t.length + "</b> tesis</span>" +
        MK.tus({ eylem: "tesis-ac", ad: "Tesis ekle", ikon: "plus", sinif: "a-tus-ikincil a-bolum-tus" }) + "</div>" +
        '<div class="a-liste-kap">' + (t.length ? MK.tablo({ baslik: "Tesisler", sinif: "a-tablo-tesis", sutunlar: TESIS_SUTUN, kayitlar: t, href: function (x) { return "#/t/" + x.id; } })
          : '<p class="a-bos-satir">Bu müşterinin tesisi yok. Plan, rapor ve İSG-KATİP kaydı tesise bağlıdır; önce tesis eklenir.</p>') + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-portal"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-portal">Portal kullanıcıları</h2><span class="a-sayac"><b>' + kul.length + "</b> kullanıcı</span>" +
        MK.tus({ eylem: "kullanici-ac", ad: "Kullanıcı ekle", ikon: "user-plus", sinif: "a-tus-ikincil a-bolum-tus" }) + "</div>" +
        '<p class="a-bolum-aciklama">Müşteri tarafı raporlarını buradan açılan hesapla, e-postasıyla görür ve indirir; başka müşterinin hiçbir kaydını görmez.</p>' +
        '<div class="a-liste-kap">' + (kul.length ? MK.tablo({ baslik: "Portal kullanıcıları", sinif: "a-tablo-mkullanici", sutunlar: KULLANICI_SUTUN, kayitlar: kul })
          : '<p class="a-bos-satir">Portal kullanıcısı yok; imzalı raporlar müşteriye ancak hesap açılınca görünür.</p>') + "</div></section>";
  }

  /* ── TESİS SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  var ISG_SUTUN = function (t) {
    return [
      { k: "kisi", baslik: "Inspector", kart: "ust", sira: 1, hucre: function (x) { var p = MV.kisi(x.k); return '<a class="a-ad-bag" href="personel.html#/p/' + p.id + '">' + kirp(p.ad) + "</a>"; } },
      { k: "no", baslik: "Sözleşme no", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Sözleşme no</span><span class="a-kod">' + x.no + "</span>"; } },
      { k: "onay", baslik: "Onay tarihi", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Onay tarihi</span>' + MK.tarihYaz(x.onay); } },
      { k: "durum", baslik: "Açık plan için", kart: "rozet", sira: 1, hucre: function (x) {
        if (!MV.acikPlan(t)) return '<span class="a-deger-yok">—</span>';
        var uygun = MV.isgUygun(x.onay, t.ptarih);   /* onay ≤ kontrol − 1 gün (§4.4); İSG-KATİP sayfasıyla tek kural */
        return rozet(uygun ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Geç onay", rozet: "a-rozet-bekliyor" }) + (uygun ? "" : '<span class="a-uyari-metin">en geç ' + MK.gunKisa(new Date(new Date(t.ptarih + "T12:00:00") - 864e5).toISOString()) + "</span>");
      } }
    ];
  };
  function tesisCiz(t) {
    if (!t) return bulunamadi("Tesis bulunamadı");
    var m = MV.musteri(t.m), isg = MV.isgTesis(t.id), k = kalan(t.sonraki);
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"], [m.kisa, "#/m/" + m.id], [t.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(t.ad) + "</h1></div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<a class="a-baglanti" href="#/m/' + m.id + '">' + kacis(m.unvan) + "</a></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "tesis-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil" }) + planAc("#/?tesis=" + t.id) + "</div></div>" +
      '<div class="a-yuzler">' +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: t.ekipman, hedef: 7, hash: "#/?tesis=" + t.id, ne: "Ekipmanlar", not: "kalıcı kayıt, kodla" }) +
        yuz({ ikon: "scroll-text", ad: "İSG-KATİP kaydı", sayi: isg.length, hedef: 12, hash: "#/isg?tesis=" + t.id, ne: "Sözleşmeler · İSG-KATİP", uyari: !isg.length, not: isg.length ? "inspector başına" : "plan kabul edilemez" }) +
        yuz({ ikon: "clock", ad: "Son kontrol", sayi: t.son ? MK.gunKisa(t.son) : "—", not: t.son ? MK.ayYil(t.son) : "ilk kontrol" }) +
        yuz({ ikon: "alarm-clock", ad: "Sonraki kontrol", sayi: MK.gunKisa(t.sonraki), not: k < 0 ? -k + " gün geçti" : k === 0 ? "bugün" : k + " gün sonra", uyari: k <= 30 }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-tbilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tbilgi">Tesis bilgileri</h2></div>' +
        '<div class="a-serit-kap">' + MK.serit("bilgi", "file-text", "Raporun işyeri bölümü (ünvan, SGK sicil no, adres) bu kayıttan dolar; imzalanan rapor o günkü bilgiyi saklar, sonradan değişmez.") + "</div>" +
        '<dl class="a-bilgi">' + bilgi("İşyeri ünvanı", kacis(m.unvan), true) + bilgi("Adres", kacis(t.adres) + ", " + t.ilce + " / " + t.il, true) +
          bilgi("SGK işyeri sicil no", '<span class="a-kod a-kod-uzun">' + t.sgk + "</span>", "cift") + bilgi("İl", t.il) + bilgi("İlçe", t.ilce) + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-isg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-isg">İSG-KATİP kayıtları</h2><span class="a-sayac"><b>' + isg.length + "</b> kayıt</span>" +
        MK.git({ hedef: 12, hash: "#/isg/yeni?tesis=" + t.id, ad: "Kayıt ekle", ikon: "plus", sinif: "a-tus-ikincil a-bolum-tus", ne: "İSG-KATİP kaydı" }) + "</div>" +
        '<p class="a-bolum-aciklama">Sözleşme işveren ile inspector arasında, tesis başına; onay tarihi en geç kontrolden bir gün önce olmalı (plan kabulünde denetlenir).</p>' +
        '<div class="a-liste-kap">' + (isg.length ? MK.tablo({ baslik: "İSG-KATİP kayıtları", sinif: "a-tablo-isg", sutunlar: ISG_SUTUN(t), kayitlar: isg })
          : '<p class="a-bos-satir">Bu tesis için İSG-KATİP kaydı yok; bu tesiste açılan plan kabul edilemez.</p>') + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-plan"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-plan">Planlar</h2></div>' +
        (t.pid ? '<dl class="a-bilgi">' + bilgi("Proje no", '<a class="a-no" href="planlarim.html#/plan/' + t.pid + '">' + t.plan + "</a>") + bilgi("Başlangıç", MK.gunYaz(t.ptarih)) +
          bilgi("Durum", rozet(MV.PLAN_DURUM[t.pdurum])) + "</dl>" : '<p class="a-bos-satir">Bu tesiste açık ya da geçmiş plan yok.</p>') + "</section>";
  }
  function bulunamadi(b) {
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">' + b + "</h1>" +
      MK.bos({ ikon: "circle-alert", baslik: b, metin: "Bu adreste kayıt yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Müşterilere dön</a>" });
  }

  /* ── PENCERELER: müşteri · tesis · portal kullanıcısı (tek pencere, içerik türe göre) ───────────────────── */
  var W = null;
  var eposta = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  function denetle() {
    var h = {}, d = W.d;
    if (W.tur === "musteri") {
      if (d.unvan.trim().length < 3) h.unvan = "Ünvan yazılmalı.";
      if (!/^\d{10,11}$/.test(d.vno)) h.vno = "Vergi no 10 hane (şahıs şirketinde TC kimlik no 11 hane).";
      else { var v = MV.MUSTERILER.filter(function (m) { return m.vno === d.vno && m.id !== W.id; })[0]; if (v) h.vno = "Bu vergi no " + v.kisa + " müşterisinde kayıtlı; aynı müşteri iki kez açılmaz."; }
      if (d.eposta && !eposta(d.eposta)) h.eposta = "E-posta biçimi geçersiz.";
    } else if (W.tur === "tesis") {
      if (d.ad.trim().length < 2) h.ad = "Tesis adı yazılmalı.";
      if (d.adres.trim().length < 5) h.adres = "Adres yazılmalı (raporda görünür).";
      if (!d.ilce.trim()) h.ilce = "İlçe yazılmalı.";
      if (!d.il.trim()) h.il = "İl yazılmalı.";
      if (!/^\d{26}$/.test(d.sgk)) h.sgk = "SGK işyeri sicil no 26 hane rakam.";
      else { var s = MV.TESISLER.filter(function (x) { return x.sgk === d.sgk && x.id !== W.id; })[0]; if (s) h.sgk = "Bu sicil no " + MV.musteri(s.m).kisa + " / " + s.ad + " tesisinde kayıtlı."; }
    } else {
      if (d.ad.trim().split(/\s+/).length < 2) h.ad = "Ad ve soyad yazılmalı.";
      if (!eposta(d.eposta)) h.eposta = "E-posta biçimi geçersiz.";
      else if (MV.MUSTERI_KULLANICI.some(function (k) { return k.eposta === d.eposta; })) h.eposta = "Bu e-postayla bir portal kullanıcısı zaten var.";
      if (d.kapsam === "secili" && !d.tesis.length) h.tesis = "En az bir tesis seçilmeli.";
    }
    return h;
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var govde;
    if (W.tur === "musteri") {
      $("a-pencere-baslik").textContent = W.id ? "Müşteriyi düzenle" : "Müşteri ekle";
      govde = '<div class="a-form">' + A("unvan", "Ünvan", d.unvan, { zorunlu: true, genis: true, ek: ' maxlength="160"', ipucu: "Resmî ünvan; raporun işyeri bölümünde yazar." }) +
        A("kisa", "Kısa ad", d.kisa, { ek: ' maxlength="40"', ipucu: "Listelerde görünür." }) + A("vd", "Vergi dairesi", d.vd, { ek: ' maxlength="40"' }) +
        A("vno", "Vergi no", d.vno, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="11"', ipucu: "Müşteri bununla eşsiz." }) +
        A("eposta", "Fatura e-postası", d.eposta, { sinif: "a-girdi-eposta", genis: true, ek: ' type="email" inputmode="email" maxlength="120"' }) +
        A("ilgili", "İlgili kişi", d.ilgili, { genis: true, ek: ' maxlength="80"', ipucu: "Ad ve görev; iletişim bilgisi portal kullanıcısında." }) + "</div>";
    } else if (W.tur === "tesis") {
      $("a-pencere-baslik").textContent = W.id ? "Tesisi düzenle" : "Tesis ekle";
      govde = '<p class="a-pencere-ozet"><b>' + kacis(MV.musteri(W.m).unvan) + "</b></p>" + '<div class="a-form">' +
        A("ad", "Tesis adı", d.ad, { zorunlu: true, genis: true, ek: ' maxlength="80"', ipucu: "Müşterinin kendi kullandığı ad (ör. Merkez Fabrika)." }) +
        A("adres", "Adres", d.adres, { zorunlu: true, genis: true, ek: ' maxlength="160"' }) + A("ilce", "İlçe", d.ilce, { zorunlu: true, ek: ' maxlength="40"' }) +
        A("il", "İl", d.il, { zorunlu: true, ek: ' maxlength="40"' }) +
        A("sgk", "SGK işyeri sicil no", d.sgk, { zorunlu: true, genis: true, sinif: "a-girdi-sgk", ek: ' inputmode="numeric" maxlength="26"', ipucu: "26 hane; raporda zorunlu (Ek-III 1.7.1). Tesis bununla eşsiz." }) + "</div>";
    } else {
      $("a-pencere-baslik").textContent = "Portal kullanıcısı ekle";
      var t = MV.tesisleri(W.m);
      govde = '<p class="a-pencere-ozet"><b>' + kacis(MV.musteri(W.m).unvan) + "</b><br>Hesap e-postayla açılır; davet bağlantısıyla kişi parolasını kendisi belirler.</p>" + '<div class="a-form">' +
        A("ad", "Ad soyad", d.ad, { zorunlu: true, ek: ' maxlength="80"' }) + A("eposta", "E-posta", d.eposta, { zorunlu: true, sinif: "a-girdi-eposta", ek: ' type="email" inputmode="email" maxlength="120"' }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Gördüğü tesisler</p>' +
          '<label class="a-onay-kutusu"><input type="radio" name="w-kapsam" data-kapsam="hepsi"' + (d.kapsam === "hepsi" ? " checked" : "") + "><span>Bütün tesisler<span class=\"a-alt-satir\">Sonradan eklenen tesis de görünür.</span></span></label>" +
          '<label class="a-onay-kutusu"><input type="radio" name="w-kapsam" data-kapsam="secili"' + (d.kapsam === "secili" ? " checked" : "") + "><span>Seçili tesisler</span></label>" +
          (d.kapsam === "secili" ? '<ul class="a-secim-listesi">' + t.map(function (x) {
            return '<li><label class="a-secim-satir"><input type="checkbox" data-tesis="' + x.id + '"' + (d.tesis.indexOf(x.id) >= 0 ? " checked" : "") + '><span class="a-secim-metin"><span class="a-ekipman-ad">' + kacis(x.ad) + '</span><span class="a-alt-satir">' + x.ilce + " / " + x.il + "</span></span></label></li>";
          }).join("") + "</ul>" : "") +
          (h.tesis ? '<p class="a-ipucu a-ipucu-uyari" id="w-tesis-ipucu">' + h.tesis + "</p>" : "") + "</div></div>";
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
      MK.tus({ eylem: "pencere-kaydet", ad: W.tur === "kullanici" ? "Davet gönder" : "Kaydet", ikon: W.tur === "kullanici" ? "send" : "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(tur, o) {
    o = o || {};
    var m = o.m ? MV.musteri(o.m) : null, t = o.t ? MV.tesis(o.t) : null;
    W = { tur: tur, id: o.id || null, m: o.m || (t && t.m), hata: {}, d:
      tur === "musteri" ? (m && o.id ? { unvan: m.unvan, kisa: m.kisa, vd: m.vd, vno: m.vno, eposta: m.eposta, ilgili: m.ilgili } : { unvan: "", kisa: "", vd: "", vno: "", eposta: "", ilgili: "" })
      : tur === "tesis" ? (t ? { ad: t.ad, adres: t.adres, ilce: t.ilce, il: t.il, sgk: t.sgk } : { ad: "", adres: "", ilce: "", il: "", sgk: "" })
      : { ad: "", eposta: "", kapsam: "hepsi", tesis: [] } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input"); if (ilk) ilk.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "liste", pencere: "musteri" };
    if ((m = /^#\/m\/([a-z0-9]+)(?:\/(tesis-ekle|kullanici-ekle))?$/.exec(h))) return { v: "musteri", id: m[1], pencere: m[2] === "tesis-ekle" ? "tesis" : m[2] ? "kullanici" : null };
    if ((m = /^#\/t\/([a-z0-9]+)$/.exec(h))) return { v: "tesis", id: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota();
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else if (r.v === "musteri") musteriCiz(MV.musteri(r.id)); else tesisCiz(MV.tesis(r.id));
    var ad = r.v === "musteri" ? (MV.musteri(r.id) || {}).kisa : r.v === "tesis" ? (MV.tesis(r.id) || {}).ad : "";
    document.title = (r.v === "liste" ? "Müşteriler" : ad || "Bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, { m: r.id }); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;

  var X = MK.eylem, sayfa = function () { return rota(); };
  X["musteri-ac"] = function () { pencereAc("musteri"); };
  X["musteri-duzenle"] = function () { var r = sayfa(); pencereAc("musteri", { m: r.id, id: r.id }); };
  X["tesis-ac"] = function () { pencereAc("tesis", { m: sayfa().id }); };
  X["tesis-duzenle"] = function () { var r = sayfa(); pencereAc("tesis", { t: r.id, id: r.id }); };
  X["kullanici-ac"] = function () { pencereAc("kullanici", { m: sayfa().id }); };
  X["pencere-kaydet"] = function () {
    W.hata = denetle();
    var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    var d = W.d, hedef, ileti;
    if (W.tur === "musteri") {
      var m = W.id ? MV.musteri(W.id) : { id: "m" + (MV.MUSTERILER.length + 1), acilis: BUGUN, uygunsuz: 0 };
      Object.assign(m, { unvan: d.unvan.trim(), kisa: d.kisa.trim() || d.unvan.trim().split(" ").slice(0, 2).join(" "), vd: d.vd.trim(), vno: d.vno, eposta: d.eposta.trim(), ilgili: d.ilgili.trim() });
      if (!W.id) MV.MUSTERILER.push(m);
      hedef = "#/m/" + m.id; ileti = W.id ? "Müşteri güncellendi." : m.kisa + " eklendi; şimdi tesisi eklenir.";
    } else if (W.tur === "tesis") {
      var t = W.id ? MV.tesis(W.id) : { id: "t" + (MV.TESISLER.length + 1), m: W.m, ekipman: 0, son: "", sonraki: BUGUN };
      Object.assign(t, { ad: d.ad.trim(), adres: d.adres.trim(), ilce: d.ilce.trim(), il: d.il.trim(), sgk: d.sgk });
      if (!W.id) MV.TESISLER.push(t);
      hedef = "#/t/" + t.id; ileti = W.id ? "Tesis güncellendi." : t.ad + " eklendi.";
    } else {
      MV.MUSTERI_KULLANICI.push({ m: W.m, ad: d.ad.trim(), eposta: d.eposta, tesis: d.kapsam === "hepsi" ? "hepsi" : d.tesis.slice(), durum: "davet", davet: MK.simdi() });
      hedef = "#/m/" + W.m; ileti = d.ad.trim() + " davet edildi (" + d.eposta + ").";
    }
    $("a-pencere").close();
    if (location.hash === hedef) goster(false); else location.hash = hedef;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && W) W.d[k] = k === "vno" || k === "sgk" ? e.target.value.replace(/\s+/g, "") : e.target.value; };
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.kapsam) { W.d.kapsam = t.dataset.kapsam; pencereCiz(); $("a-pencere-govde").querySelector('[data-kapsam="' + W.d.kapsam + '"]').focus(); }
    else if (t.dataset.tesis) { var i = W.d.tesis.indexOf(t.dataset.tesis); if (t.checked && i < 0) W.d.tesis.push(t.dataset.tesis); else if (!t.checked && i >= 0) W.d.tesis.splice(i, 1); }
  });
  /* pencere kapanınca adres pencereyi açan sayfaya döner */
  $("a-pencere").addEventListener("close", function () {
    var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "liste" ? "#/" : "#/m/" + r.id);
  });

  MK.kabuk({ modul: 3, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("m");
  MK.seciciCiz("m"); goster(false);
})();
