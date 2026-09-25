/* ══ probata MAKET M2 — Müşteri ve Tesis (modül 3) · 2. TUR, ONAY BEKLİYOR (2026-09-25) ═════════════════════════════════
   Kaynak: pkproje.md §2 (müşteri e-postayla girer; bir müşterinin birden çok tesisi; tesis = raporun adresi), §4.2 1.7.1
   (raporda işyerinin ünvanı, SGK sicil no, adres, sözleşme no), §7 (SGK işyeri sicil no TESİSTE), §3.2 (plan: müşteri →
   tesis; İSG-KATİP kişi × tesis; öneri 8: imzada bilgi rapora kopyalanır). Ekranlar: liste (#/) · müşteri (#/m/<id>) · tesis
   (#/t/<id>) · pencereler: müşteri ekle/düzenle · tesis ekle/düzenle · ek giriş ekle · pasif yap / yeniden etkinleştir.
   Bakış: planlama ekibi. Veri ortak (maket-veri.js), UYDURMA.
   2. tur (2026-09-25, reisim: "Tüm önerilerin uygundur" — sorular 44–50, pkproje.md §9 on üçüncü tur) + genel ilke (38/39: teknik
   ayrıntı yok, kural uyarıdır engel değil):
   · 33 → müşteri girişi KENDİLİĞİNDEN açılır: müşterinin e-postası kullanıcı adı, sistemin ürettiği parola o adrese gider; personel
     "Müşteri gözüyle bak" ile müşterinin gördüğünü açar, "Parolayı yeniden gönder" ile yardım eder. Davet yok.
   · 44 → ana giriş bütün tesisleri görür; kişiye özel EK GİRİŞ bütün ya da seçili tesislerle sınırlanır.
   · 45 / 46 → vergi no ve SGK sicil no ZORUNLU DEĞİL: eksikse kayıt olur, sayfada uyarı çıkar; aynısı başka kayıtta varsa pencere
     uyarır, "Yine de kaydet" ile kaydedilir. SGK no raporda gerekir → rapor imzalanırken yeniden hatırlatılır (M9).
   · 47 → tesis tek müşteriye ait; aynı adreste iki işletme = iki tesis.
   · 48 → silme yok, PASİF: listeden kalkar (Görünüm: Pasif), raporları ve arşivi kalır, yeniden etkinleştirilir.
   · 49 → "kontrolü yaklaşan" eşiği firma ayarı, başlangıç 30 gün (YAKIN).
   · 50 → il ve ilçe aramalı seçim listesinden (81 il; makette ilçe listesi verideki 6 ilde).
   · Çakışma: İSG-KATİP kayıtları tesiste yalnız görünür, girişi M5'te; "Açık plan için" sütunu uyarıdır, kilit değil. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var BUGUN = MK.BUGUN, YAKIN = 30;   /* firma ayarı (49); başlangıç 30 gün */
  var HESAP = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, gonderildi: { ad: "Parola gönderildi", rozet: "a-rozet-bekliyor" },
    yok: { ad: "E-posta yok", rozet: "a-rozet-bekliyor" }, pasif: { ad: "Kapalı", rozet: "a-rozet-notr" } };
  var PASIF = { ad: "Pasif", rozet: "a-rozet-notr" };
  var kalan = function (t) { return MK.gunFarki(BUGUN, t); };
  var etkinTesisler = function (m) { return MV.tesisleri(m.id).filter(function (t) { return !t.pasif; }); };
  var ekipmanSayisi = function (m) { return etkinTesisler(m).reduce(function (n, t) { return n + t.ekipman; }, 0); };
  var enYakin = function (m) { return etkinTesisler(m).map(function (t) { return t.sonraki; }).sort()[0]; };
  var yakin = function (tarih) { return !!tarih && kalan(tarih) <= YAKIN; };
  var isgsiz = function (m) { return etkinTesisler(m).filter(function (t) { return !MV.isgTesis(t.id).length; }); };
  var ekGiris = function (m) { return MV.musteriKullanicilari(m.id); };
  /* eksik bilgi: kayıt ENGELLENMEZ, sayfada uyarı (45, 46; M1'deki eksik bilgi uyarısıyla aynı dil) */
  var eksikMusteri = function (m) { return [!m.vno && "vergi no", !m.eposta && "e-posta"].filter(Boolean); };
  var eksikTesis = function (t) { return [!t.sgk && "SGK işyeri sicil no", !t.adres && "adres", !t.il && "il", !t.ilce && "ilçe"].filter(Boolean); };
  var eksikVar = function (m) { return eksikMusteri(m).length > 0 || etkinTesisler(m).some(function (t) { return eksikTesis(t).length > 0; }); };
  var yok = '<span class="a-deger-yok">—</span>';
  /* "kontrol tarihi" metni: geçmiş · bugün · N gün (eşik içi uyarı rengi) */
  function tarihHtml(t) {
    if (!t) return yok;
    var k = kalan(t), not = k < 0 ? -k + " gün geçti" : k === 0 ? "Bugün" : k + " gün";
    return '<span class="a-tarih-gun">' + MK.tarihYaz(t) + '</span><span class="' + (k <= YAKIN ? "a-uyari-metin" : "a-tarih-saat") + '">' + not + "</span>";
  }
  var adBag = function (href, metin, alt) { return '<a class="a-ad-bag" href="' + href + '">' + kirp(metin) + "</a>" + (alt ? '<span class="a-alt-satir">' + alt + "</span>" : ""); };

  /* ── MÜŞTERİLER LİSTESİ ─────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("m", { ad: "Müşterilerde ara", ipucu: "Ünvan, vergi no, tesis, il", birim: "müşteri",
    cipler: [
      { k: "yakin", ad: "Kontrolü " + YAKIN + " gün içinde", test: function (m) { return yakin(enYakin(m)); } },
      { k: "isgsiz", ad: "İSG-KATİP kaydı olmayan tesis", test: function (m) { return isgsiz(m).length > 0; } },
      { k: "girmedi", ad: "Müşteri girişi kullanılmadı", test: function (m) { return m.giris.durum !== "etkin"; } },
      { k: "eksik", ad: "Bilgisi eksik", test: eksikVar },
      { k: "uygunsuz", ad: "Açık uygunsuzluk", test: function (m) { return MV.acikUygunsuz(m.id) > 0; } }
    ],
    seciciler: [
      { k: "il", ad: "İl", secenek: function () {
        return [["tumu", "Tümü"]].concat(MV.TESISLER.map(function (t) { return t.il; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; })
          .sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (x) { return [x, x]; }));
      }, gecer: function (m, v) { return v === "tumu" || MV.tesisleri(m.id).some(function (t) { return t.il === v; }); } },
      /* görünüm anahtarı (kalıp 8): pasif müşteri listeden kalkar, burada görünür (48) */
      { k: "gorunum", ad: "Görünüm", bas: "etkin", secenek: function () { return [["etkin", "Etkin müşteriler"], ["pasif", "Pasif müşteriler"], ["hepsi", "Hepsi"]]; },
        gecer: function (m, v) { return v === "hepsi" || (v === "pasif") === !!m.pasif; } }
    ],
    metin: function (m) { return [m.unvan, m.kisa, m.vno].concat(MV.tesisleri(m.id).map(function (t) { return t.ad + " " + t.ilce + " " + t.il; })).join(" "); },
    imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "unvan", baslik: "Müşteri", kart: "ust", sira: 1, hucre: function (m) { return adBag("#/m/" + m.id, m.unvan, m.vno ? "VKN " + m.vno : '<span class="a-uyari-metin">Vergi no eksik</span>'); } },
    { k: "tesis", baslik: "Tesisler", kart: "govde", sira: 2, hucre: function (m) {
      var t = etkinTesisler(m), iller = t.map(function (x) { return x.il; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span><span class="a-sayi">' + t.length + " tesis</span>" + '<span class="a-alt-satir">' + (iller.join(" · ") || "—") + "</span></span></span>";
    } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 3, hucre: function (m) { return '<span class="a-sayi"><span class="a-kart-etiket">Ekipman</span>' + ekipmanSayisi(m) + "</span>"; } },
    { k: "giris", baslik: "Müşteri girişi", kart: "govde", sira: 4, hucre: function (m) {
      var g = m.giris;
      return '<span class="a-kart-etiket">Müşteri girişi</span>' + (g.durum === "etkin" ? '<span class="a-tarih-saat">Son giriş ' + MK.gunKisa(g.son) + "</span>"
        : '<span class="a-uyari-metin">' + (g.durum === "yok" ? "E-posta yok" : "Henüz girmedi") + "</span>");
    } },
    { k: "sonraki", baslik: "En yakın kontrol", kart: "govde", sira: 5, hucre: function (m) { return '<span class="a-kart-etiket">En yakın kontrol</span>' + tarihHtml(enYakin(m)); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (m) {
      if (m.pasif) return rozet(PASIF);
      var e = isgsiz(m).length, u = MV.acikUygunsuz(m.id);   /* 2026-09-24 (M11): uygunsuzluk kayıtlarından */
      return (u ? rozet({ ad: u + " açık uygunsuzluk", rozet: "a-rozet-red" }) : "") +
        (e ? '<span class="a-uyari-metin">' + e + " tesiste İSG-KATİP yok</span>" : "") + (!u && !e ? yok : "");
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
  var pasifTus = function (x) { return MK.tus({ eylem: x.pasif ? "etkinlestir" : "pasif-ac", ad: x.pasif ? "Yeniden etkinleştir" : "Pasif yap", ikon: x.pasif ? "undo-2" : "ban", sinif: "a-tus-ikincil" }); };
  var pasifSerit = function (x, ne) {
    return x.pasif ? '<div class="a-serit-kap">' + MK.serit("bilgi", "ban", "<b>Pasif</b> · " + MK.tarihYaz(x.pasif) + " · " + ne + " listelerden kalktı; raporları ve arşivi duruyor. “Yeniden etkinleştir” ile geri gelir.") + "</div>" : "";
  };

  /* ── MÜŞTERİ SAYFASI ───────────────────────────────────────────────────────────────────────────── */
  var TESIS_SUTUN = [
    { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (t) { return adBag("#/t/" + t.id, t.ad); } },
    { k: "adres", baslik: "Adres", kart: "govde", sira: 2, hucre: function (t) {
      if (!t.adres) return '<span class="a-kart-etiket">Adres</span><span class="a-uyari-metin">Adres eksik</span>';
      var il = [t.ilce, t.il].filter(Boolean).join(" / ");
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' + kirp(t.adres, "a-adres-sokak", t.adres + (il ? ", " + il : "")) + '<span class="a-adres-il">' + (il || "—") + "</span></span></span>";
    } },
    { k: "sgk", baslik: "SGK işyeri sicil no", kart: "govde", sira: 3, hucre: function (t) {
      return '<span class="a-kart-etiket">SGK işyeri sicil no</span>' + (t.sgk ? '<span class="a-kod a-kod-uzun">' + t.sgk + "</span>" : '<span class="a-uyari-metin">Eksik</span>');
    } },
    { k: "isg", baslik: "İSG-KATİP", kart: "govde", sira: 4, hucre: function (t) {
      var n = MV.isgTesis(t.id).length; return '<span class="a-kart-etiket">İSG-KATİP</span>' + (n ? '<span class="a-sayi">' + n + " kayıt</span>" : '<span class="a-uyari-metin">Kayıt yok</span>');
    } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 5, hucre: function (t) { return '<span class="a-sayi"><span class="a-kart-etiket">Ekipman</span>' + t.ekipman + "</span>"; } },
    { k: "sonraki", baslik: "Sonraki kontrol", kart: "rozet", sira: 1, hucre: function (t) { return t.pasif ? rozet(PASIF) : tarihHtml(t.sonraki); } }
  ];
  var KULLANICI_SUTUN = [
    { k: "ad", baslik: "Ad soyad", kart: "ust", sira: 1, hucre: function (k) { return '<span class="a-ekipman-ad">' + kacis(k.ad) + "</span>" + kirp(k.eposta, "a-alt-satir"); } },
    { k: "tesis", baslik: "Gördüğü tesisler", kart: "govde", sira: 2, hucre: function (k) {
      return '<span class="a-kart-etiket">Gördüğü tesisler</span>' + (k.tesis === "hepsi" ? "Bütün tesisler" : kacis(k.tesis.map(function (id) { return MV.tesis(id).ad; }).join(", ")));
    } },
    { k: "son", baslik: "Son giriş", kart: "govde", sira: 3, hucre: function (k) {
      /* henüz girmediyse sütunda giriş tarihi yok: "Girmedi" + parolanın gittiği gün (tabloda başlık "Son giriş" kalır) */
      if (k.durum === "gonderildi") return '<span class="a-kart-etiket">Son giriş</span><span><span class="a-uyari-metin">Girmedi</span><span class="a-tarih-saat">parola ' + MK.zamanYaz(k.gonderildi) + "</span></span>";
      return '<span class="a-kart-etiket">Son giriş</span><span class="a-tarih-saat">' + MK.zamanYaz(k.son) + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (k) { return rozet(HESAP[k.durum]); } }
  ];
  function girisHtml(m) {
    var g = m.pasif ? { durum: "pasif" } : m.giris, ek = ekGiris(m);
    var durum = g.durum === "pasif" ? "Müşteri pasif; giriş kapalı" : g.durum === "etkin" ? "Son giriş " + MK.zamanYaz(g.son) : g.durum === "gonderildi" ? "Parola " + MK.zamanYaz(g.gonderildi) + " tarihinde gönderildi; henüz girmedi" : "Müşterinin e-postası yok";
    return '<section class="a-bolum" aria-labelledby="a-b-giris"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-giris">Müşteri girişi</h2>' + rozet(HESAP[g.durum]) + "</div>" +
      '<p class="a-bolum-aciklama">Müşteri eklenince giriş kendiliğinden açılır: kullanıcı adı müşterinin e-postası, parolayı sistem üretip o adrese gönderir. Müşteri yalnız kendi raporlarını görür ve indirir.</p>' +
      '<dl class="a-bilgi">' + bilgi("Kullanıcı adı", g.durum === "yok" ? '<span class="a-uyari-metin">E-posta yazılınca giriş açılır</span>' : kacis(m.eposta), true) + bilgi("Durum", durum, true) + bilgi("Gördüğü tesisler", "Bütün tesisler") + "</dl>" +
      (g.durum === "pasif" ? "" : '<div class="a-bolum-eylem">' + (g.durum === "yok" ? MK.tus({ eylem: "musteri-duzenle", ad: "E-posta yaz", ikon: "pencil", sinif: "a-tus-ikincil" })
        : '<a class="a-tus a-tus-ikincil" href="musteri.html#/?musteri=' + m.id + '">' + ikon("eye", "a-ikon-kucuk") + "Müşteri gözüyle bak</a>" +
          MK.tus({ eylem: "parola-gonder", ad: "Parolayı yeniden gönder", ikon: "send", sinif: "a-tus-ikincil" })) + "</div>") +
      '<div class="a-alt-bas a-alt-bas-ic"><h3 class="a-alt-baslik">Ek girişler</h3><span class="a-sayac"><b>' + ek.length + "</b> kişi</span>" +
        (m.pasif ? "" : MK.tus({ eylem: "kullanici-ac", ad: "Ek giriş ekle", ikon: "user-plus", sinif: "a-tus-ikincil a-bolum-tus" })) + "</div>" +
      '<p class="a-bolum-aciklama">Müşterinin çalışanlarına kişiye özel giriş; bütün tesisleri ya da yalnız seçilenleri görür.</p>' +
      '<div class="a-liste-kap">' + (ek.length ? MK.tablo({ baslik: "Ek girişler", sinif: "a-tablo-mkullanici", sutunlar: KULLANICI_SUTUN, kayitlar: ek })
        : '<p class="a-bos-satir">Ek giriş yok; müşteri ana girişle bütün tesislerini görür.</p>') + "</div></section>";
  }
  function musteriCiz(m) {
    if (!m) return bulunamadi("Müşteri bulunamadı");
    var t = MV.tesisleri(m.id).slice().sort(function (a, b) { return (a.pasif ? 1 : 0) - (b.pasif ? 1 : 0); }), et = etkinTesisler(m);
    var acikPlan = et.filter(function (x) { return x.pid && ["bekliyor", "kabul", "denetimde"].indexOf(x.pdurum) >= 0; }).length, e = eksikMusteri(m);
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"], [m.kisa]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(m.unvan) + "</h1>" + (m.pasif ? rozet(PASIF) : "") + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + (m.vd ? kacis(m.vd) + " VD · " : "") + (m.vno ? "VKN " + m.vno : "Vergi no yok") + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + pasifTus(m) + MK.tus({ eylem: "musteri-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil" }) + (m.pasif ? "" : planAc("#/?musteri=" + m.id)) + "</div></div>" +
      pasifSerit(m, "Müşteri") +
      (e.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Eksik bilgi: " + e.join(" · ") + ". Kayıt engellenmez; teklif, fatura ve müşteri girişi için gerekir.") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "map-pin", ad: "Tesis", sayi: et.length, not: et.map(function (x) { return x.il; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(" · ") || "tesis yok" }) +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: ekipmanSayisi(m), hedef: 7, hash: "#/?musteri=" + m.id, ne: "Ekipmanlar" }) +
        yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: acikPlan, hedef: 13, hash: "", ne: "Planlar", not: "kabul bekleyen ve süren" }) +
        yuz({ ikon: "triangle-alert", ad: "Açık uygunsuzluk", sayi: MV.acikUygunsuz(m.id), hedef: "musteri", hash: "#/uygunsuz?musteri=" + m.id, ne: "Müşteri paneli", uyari: MV.acikUygunsuz(m.id) > 0, not: MV.acikUygunsuz(m.id) ? "müşteri panelinde gördüğü" : "yok" }) +
        /* 2026-09-24 (toplu bakış öncesi): faz 2 maketleri geldi → teklif, iş sözleşmesi ve açık alacak yüzleri */
        (function () {
          var tk = MV.TEKLIFLER.filter(function (x) { return x.m === m.id; }), sz = MV.IS_SOZLESMELERI.filter(function (x) { return x.m === m.id; });
          var fl = MV.FATURALAR.filter(function (f) { return f.m === m.id; }), kalanPara = fl.reduce(function (n, f) { return n + MV.faturaKalan(f); }, 0);
          var gec = fl.filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }).length, yur = sz.filter(function (x) { return MV.isDurum(x) === "yururlukte"; }).length;
          return yuz({ ikon: "file-text", ad: "Teklif", sayi: tk.length, hedef: 11, hash: "#/?musteri=" + m.id, ne: "Teklifler", not: tk.filter(function (x) { return x.durum === "kabul"; }).length + " kabul edildi" }) +
            yuz({ ikon: "file-signature", ad: "İş sözleşmesi", sayi: sz.length, hedef: "is-sozlesmesi", hash: "#/?musteri=" + m.id, ne: "İş sözleşmeleri",
              not: sz.some(function (x) { return MV.isDurum(x) === "imza"; }) ? "imza bekleyen var" : yur ? yur + " yürürlükte" : "yürürlükte yok", uyari: sz.some(function (x) { return MV.isDurum(x) === "imza"; }) }) +
            yuz({ ikon: "wallet", ad: "Açık alacak", sayi: kalanPara > 0 ? MV.para(kalanPara) : "—", hedef: fl.length ? 18 : null, hash: "#/faturalar?musteri=" + m.id, ne: "Muhasebe",
              not: gec ? gec + " faturanın vadesi geçti" : fl.length ? fl.length + " fatura" : "fatura yok", uyari: gec > 0 });
        })() +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-bilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bilgi">Müşteri bilgileri</h2></div><dl class="a-bilgi">' +
        bilgi("Ünvan", kacis(m.unvan), true) + bilgi("Kısa ad", kacis(m.kisa)) + bilgi("Vergi dairesi", m.vd ? kacis(m.vd) : yok) +
        bilgi("Vergi no", m.vno ? '<span class="a-kod">' + m.vno + "</span>" : '<span class="a-yuz-uyari">Boş</span>') +
        bilgi("E-posta", m.eposta ? kacis(m.eposta) : '<span class="a-yuz-uyari">Boş</span>', true) + bilgi("İlgili kişi", m.ilgili ? kacis(m.ilgili) : yok, true) + bilgi("Müşteri olduğu tarih", MK.tarihYaz(m.acilis)) +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-tesis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tesis">Tesisler</h2><span class="a-sayac"><b>' + et.length + "</b> tesis" + (t.length > et.length ? " · " + (t.length - et.length) + " pasif" : "") + "</span>" +
        (m.pasif ? "" : MK.tus({ eylem: "tesis-ac", ad: "Tesis ekle", ikon: "plus", sinif: "a-tus-ikincil a-bolum-tus" })) + "</div>" +
        '<p class="a-bolum-aciklama">Bir tesis tek müşteriye aittir; aynı adreste iki ayrı işletme varsa iki tesis açılır.</p>' +
        '<div class="a-liste-kap">' + (t.length ? MK.tablo({ baslik: "Tesisler", sinif: "a-tablo-tesis", sutunlar: TESIS_SUTUN, kayitlar: t, href: function (x) { return "#/t/" + x.id; } })
          : '<p class="a-bos-satir">Bu müşterinin tesisi yok. Plan, rapor ve İSG-KATİP kaydı tesise bağlıdır; önce tesis eklenir.</p>') + "</div></section>" +
      girisHtml(m);
  }

  /* ── TESİS SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  var ISG_SUTUN = function (t) {
    return [
      { k: "kisi", baslik: "Inspector", kart: "ust", sira: 1, hucre: function (x) { var p = MV.kisi(x.k); return '<a class="a-ad-bag" href="personel.html#/p/' + p.id + '">' + kirp(p.ad) + "</a>"; } },
      { k: "no", baslik: "Sözleşme no", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Sözleşme no</span><span class="a-kod">' + x.no + "</span>"; } },
      { k: "onay", baslik: "Onay tarihi", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Onay tarihi</span>' + MK.tarihYaz(x.onay); } },
      { k: "durum", baslik: "Açık plan için", kart: "rozet", sira: 1, hucre: function (x) {
        if (!MV.acikPlan(t)) return yok;
        var uygun = MV.isgUygun(x.onay, t.ptarih);   /* onay ≤ kontrol − 1 gün (§4.4); İSG-KATİP sayfasıyla tek kural — UYARI, kilit değil */
        return rozet(uygun ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Geç onay", rozet: "a-rozet-bekliyor" }) + (uygun ? "" : '<span class="a-uyari-metin">en geç ' + MK.gunKisa(new Date(new Date(t.ptarih + "T12:00:00") - 864e5).toISOString()) + "</span>");
      } }
    ];
  };
  function tesisCiz(t) {
    if (!t) return bulunamadi("Tesis bulunamadı");
    var m = MV.musteri(t.m), isg = MV.isgTesis(t.id), k = kalan(t.sonraki), e = eksikTesis(t);
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"], [m.kisa, "#/m/" + m.id], [t.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(t.ad) + "</h1>" + (t.pasif ? rozet(PASIF) : "") + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<a class="a-baglanti" href="#/m/' + m.id + '">' + kacis(m.unvan) + "</a></p></div>" +
        '<div class="a-eylem-cubugu">' + pasifTus(t) + MK.tus({ eylem: "tesis-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil" }) + (t.pasif ? "" : planAc("#/?tesis=" + t.id)) + "</div></div>" +
      pasifSerit(t, "Tesis") +
      (e.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Eksik bilgi: " + e.join(" · ") + ". Kayıt engellenmez; raporun işyeri bölümünde gerekir, rapor imzalanırken yeniden hatırlatılır.") + "</div>" : "") +
      '<div class="a-yuzler">' +
        yuz({ ikon: "wrench", ad: "Ekipman", sayi: t.ekipman, hedef: 7, hash: "#/?tesis=" + t.id, ne: "Ekipmanlar", not: "kalıcı kayıt, kodla" }) +
        yuz({ ikon: "scroll-text", ad: "İSG-KATİP kaydı", sayi: isg.length, hedef: 12, hash: "#/isg?tesis=" + t.id, ne: "Sözleşmeler · İSG-KATİP", uyari: !isg.length, not: isg.length ? "inspector başına" : "plan kabulünde uyarı" }) +
        yuz({ ikon: "clock", ad: "Son kontrol", sayi: t.son ? MK.gunKisa(t.son) : "—", not: t.son ? MK.ayYil(t.son) : "ilk kontrol" }) +
        yuz({ ikon: "alarm-clock", ad: "Sonraki kontrol", sayi: MK.gunKisa(t.sonraki), not: k < 0 ? -k + " gün geçti" : k === 0 ? "bugün" : k + " gün sonra", uyari: k <= YAKIN }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-tbilgi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-tbilgi">Tesis bilgileri</h2></div>' +
        '<div class="a-serit-kap">' + MK.serit("bilgi", "file-text", "Raporun işyeri bölümü (ünvan, SGK sicil no, adres) bu kayıttan dolar; imzalanan rapor o günkü bilgiyi saklar, sonradan değişmez.") + "</div>" +
        '<dl class="a-bilgi">' + bilgi("İşyeri ünvanı", kacis(m.unvan), true) + bilgi("Adres", t.adres ? kacis(t.adres) : '<span class="a-yuz-uyari">Boş</span>', true) +
          bilgi("SGK işyeri sicil no", t.sgk ? '<span class="a-kod a-kod-uzun">' + t.sgk + "</span>" : '<span class="a-yuz-uyari">Boş</span>', "cift") + bilgi("İl", t.il || yok) + bilgi("İlçe", t.ilce || yok) + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-isg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-isg">İSG-KATİP kayıtları</h2><span class="a-sayac"><b>' + isg.length + "</b> kayıt</span>" +
        MK.git({ hedef: 12, hash: "#/isg?tesis=" + t.id, ad: "İSG-KATİP'te aç", ikon: "arrow-right", sinif: "a-tus-ikincil a-bolum-tus", ne: "İSG-KATİP kaydı" }) + "</div>" +
        '<p class="a-bolum-aciklama">Kayıtlar İSG-KATİP ekranında girilir, burada görünür. Onay tarihi kontrolden en geç bir gün önce olmalı; geç kalırsa plan kabulünde uyarı çıkar.</p>' +
        '<div class="a-liste-kap">' + (isg.length ? MK.tablo({ baslik: "İSG-KATİP kayıtları", sinif: "a-tablo-isg", sutunlar: ISG_SUTUN(t), kayitlar: isg })
          : '<p class="a-bos-satir">Bu tesis için İSG-KATİP kaydı yok; bu tesiste açılan plan kabul edilirken uyarı çıkar.</p>') + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-plan"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-plan">Planlar</h2></div>' +
        (t.pid ? '<dl class="a-bilgi">' + bilgi("Proje no", '<a class="a-no" href="planlarim.html#/plan/' + t.pid + '">' + t.plan + "</a>") + bilgi("Başlangıç", MK.gunYaz(t.ptarih)) +
          bilgi("Durum", rozet(MV.PLAN_DURUM[t.pdurum])) + "</dl>" : '<p class="a-bos-satir">Bu tesiste açık ya da geçmiş plan yok.</p>') + "</section>";
  }
  function bulunamadi(b) {
    $("a-nesne").innerHTML = MK.kirinti([["Müşteriler", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">' + b + "</h1>" +
      MK.bos({ ikon: "circle-alert", baslik: b, metin: "Bu adreste kayıt yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Müşterilere dön</a>" });
  }

  /* ── PENCERELER: müşteri · tesis · ek giriş · pasif (tek pencere, içerik türe göre) ─────────────────────────
     W.hata = kaydı durduran (yalnız ad ve biçim) · W.uyari = kaydı DURDURMAYAN (aynı vergi / sicil no başka kayıtta);
     uyarı varken ilk "Kaydet" uyarıyı gösterir, ikinci tık ("Yine de kaydet") kaydeder (45, 46). */
  var W = null;
  var eposta = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  function denetle() {
    var h = {}, u = {}, d = W.d;
    if (W.tur === "musteri") {
      if (d.unvan.trim().length < 3) h.unvan = "Ünvan yazılmalı.";
      if (d.vno && !/^\d{10,11}$/.test(d.vno)) h.vno = "Vergi no 10 hane (şahıs şirketinde 11 hane); boş bırakılabilir.";
      else if (d.vno) { var v = MV.MUSTERILER.filter(function (m) { return m.vno === d.vno && m.id !== W.id; })[0]; if (v) u.vno = "Bu vergi no " + v.kisa + " müşterisinde de kayıtlı. Aynı müşteri olabilir."; }
      if (d.eposta && !eposta(d.eposta)) h.eposta = "E-posta biçimi geçersiz.";
    } else if (W.tur === "tesis") {
      if (d.ad.trim().length < 2) h.ad = "Tesis adı yazılmalı.";
      if (d.sgk && !/^\d{26}$/.test(d.sgk)) h.sgk = "SGK işyeri sicil no 26 hane rakam; boş bırakılabilir.";
      else if (d.sgk) { var s = MV.TESISLER.filter(function (x) { return x.sgk === d.sgk && x.id !== W.id; })[0]; if (s) u.sgk = "Bu sicil no " + MV.musteri(s.m).kisa + " / " + s.ad + " tesisinde de kayıtlı. Aynı tesis olabilir."; }
    } else if (W.tur === "kullanici") {
      if (d.ad.trim().split(/\s+/).length < 2) h.ad = "Ad ve soyad yazılmalı.";
      if (!eposta(d.eposta)) h.eposta = "E-posta biçimi geçersiz.";
      else if (MV.MUSTERI_KULLANICI.some(function (k) { return k.eposta === d.eposta; }) || MV.MUSTERILER.some(function (m) { return m.eposta === d.eposta; })) h.eposta = "Bu e-postayla bir müşteri girişi zaten var.";
      if (d.kapsam === "secili" && !d.tesis.length) h.tesis = "En az bir tesis seçilmeli.";
    }
    return { h: h, u: u };
  }
  var ilSecenek = function () { return MV.ILLER.slice().sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (x) { return [x, x]; }); };
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, u = W.uyari || {}, A = function (id, etiket, deger, o) {
      o = o || {};
      var ip = u[id] ? '<span class="a-ipucu-dikkat">' + u[id] + "</span>" : o.ipucu;
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: ip, hata: h[id],
        girdi: o.girdi || MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var govde, kaydet = { ad: "Kaydet", ikon: "check" }, uyariVar = Object.keys(u).length > 0;
    if (W.tur === "musteri") {
      $("a-pencere-baslik").textContent = W.id ? "Müşteriyi düzenle" : "Müşteri ekle";
      govde = (uyariVar ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Aynı bilgi başka bir kayıtta da var. Doğruysa “Yine de kaydet”.") + "</div>" : "") +
        '<div class="a-form">' + A("unvan", "Ünvan", d.unvan, { zorunlu: true, genis: true, ek: ' maxlength="160"', ipucu: "Resmî ünvan; raporun işyeri bölümünde yazar." }) +
        A("kisa", "Kısa ad", d.kisa, { ek: ' maxlength="40"', ipucu: "Listelerde görünür." }) + A("vd", "Vergi dairesi", d.vd, { ek: ' maxlength="40"' }) +
        A("vno", "Vergi no", d.vno, { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="11"', ipucu: "Boşsa kayıt olur, müşteri sayfasında hatırlatılır." }) +
        A("eposta", "E-posta", d.eposta, { sinif: "a-girdi-eposta", genis: true, ek: ' type="email" inputmode="email" maxlength="120"',
          ipucu: W.id ? "Müşteri girişinin kullanıcı adı; faturalar da bu adrese." : "Kaydedince müşteri girişi bu adresle açılır, parola bu adrese gider." }) +
        A("ilgili", "İlgili kişi", d.ilgili, { genis: true, ek: ' maxlength="80"', ipucu: "Ad ve görev." }) + "</div>";
    } else if (W.tur === "tesis") {
      $("a-pencere-baslik").textContent = W.id ? "Tesisi düzenle" : "Tesis ekle";
      var ilceler = MV.ILCELER[d.il];
      govde = '<p class="a-pencere-ozet"><b>' + kacis(MV.musteri(W.m).unvan) + "</b></p>" +
        (uyariVar ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Aynı bilgi başka bir kayıtta da var. Doğruysa “Yine de kaydet”.") + "</div>" : "") +
        '<div class="a-form">' +
        A("ad", "Tesis adı", d.ad, { zorunlu: true, genis: true, ek: ' maxlength="80"', ipucu: "Müşterinin kendi kullandığı ad (ör. Merkez Fabrika)." }) +
        A("adres", "Adres", d.adres, { genis: true, ek: ' maxlength="160"', ipucu: "Raporda yazar." }) +
        A("il", "İl", "", { girdi: MK.secim({ id: "w-il", ad: "İl", deger: d.il, secenekler: ilSecenek(), ipucu: "İl seçin" }) }) +
        A("ilce", "İlçe", d.ilce, { girdi: !d.il ? '<input class="a-girdi a-girdi-oku" id="w-ilce" readonly value="Önce il seçin" aria-describedby="w-ilce-ipucu">'
          : ilceler ? MK.secim({ id: "w-ilce", ad: "İlçe", deger: d.ilce, secenekler: ilceler.map(function (x) { return [x, x]; }), ipucu: "İlçe seçin" }) : null,
          ek: ' maxlength="40"' }) +
        A("sgk", "SGK işyeri sicil no", d.sgk, { genis: true, sinif: "a-girdi-sgk", ek: ' inputmode="numeric" maxlength="26"', ipucu: "26 hane. Boşsa kayıt olur; rapor imzalanırken hatırlatılır." }) + "</div>";
    } else if (W.tur === "kullanici") {
      $("a-pencere-baslik").textContent = "Ek giriş ekle";
      var t = etkinTesisler(MV.musteri(W.m));
      kaydet = { ad: "Girişi aç, parolayı gönder", ikon: "send" };
      govde = '<p class="a-pencere-ozet"><b>' + kacis(MV.musteri(W.m).unvan) + "</b><br>Kişiye özel giriş; parolayı sistem üretip bu e-postaya gönderir.</p>" + '<div class="a-form">' +
        A("ad", "Ad soyad", d.ad, { zorunlu: true, ek: ' maxlength="80"' }) + A("eposta", "E-posta", d.eposta, { zorunlu: true, sinif: "a-girdi-eposta", ek: ' type="email" inputmode="email" maxlength="120"' }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Gördüğü tesisler</p>' +
          '<label class="a-onay-kutusu"><input type="radio" name="w-kapsam" data-kapsam="hepsi"' + (d.kapsam === "hepsi" ? " checked" : "") + "><span>Bütün tesisler<span class=\"a-alt-satir\">Sonradan eklenen tesis de görünür.</span></span></label>" +
          '<label class="a-onay-kutusu"><input type="radio" name="w-kapsam" data-kapsam="secili"' + (d.kapsam === "secili" ? " checked" : "") + "><span>Seçili tesisler</span></label>" +
          (d.kapsam === "secili" ? '<ul class="a-secim-listesi">' + t.map(function (x) {
            return '<li><label class="a-secim-satir"><input type="checkbox" data-tesis="' + x.id + '"' + (d.tesis.indexOf(x.id) >= 0 ? " checked" : "") + '><span class="a-secim-metin"><span class="a-ekipman-ad">' + kacis(x.ad) + '</span><span class="a-alt-satir">' + [x.ilce, x.il].filter(Boolean).join(" / ") + "</span></span></label></li>";
          }).join("") + "</ul>" : "") +
          (h.tesis ? '<p class="a-ipucu a-ipucu-uyari" id="w-tesis-ipucu">' + h.tesis + "</p>" : "") + "</div></div>";
    } else {   /* pasif yap / yeniden etkinleştir (48) */
      var x = W.hedef, ad = W.kim === "musteri" ? x.unvan : MV.musteri(x.m).kisa + " / " + x.ad;
      $("a-pencere-baslik").textContent = x.pasif ? "Yeniden etkinleştir" : "Pasif yap";
      kaydet = x.pasif ? { ad: "Etkinleştir", ikon: "undo-2" } : { ad: "Pasif yap", ikon: "ban" };
      govde = '<p class="a-pencere-ozet"><b>' + kacis(ad) + "</b></p>" + (x.pasif
        ? "<p>Kayıt listelere geri döner; yeniden plan ve teklif açılabilir." + (W.kim === "musteri" ? " Müşteri girişi yeniden açılır." : "") + "</p>"
        : '<ul class="a-kosullar">' + ["Silinmez: raporları, planları ve arşivi olduğu gibi kalır.", "Listelerden kalkar; yeni plan ve teklif açılmaz."]
          .concat(W.kim === "musteri" ? ["Müşteri girişi kapanır; bütün tesisleri de pasif olur."] : []).concat(["İstenince yeniden etkinleştirilir."])
          .map(function (x) { return "<li>" + ikon("check", "a-ikon-kucuk") + "<span>" + x + "</span></li>"; }).join("") + "</ul>");
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
      MK.tus({ eylem: "pencere-kaydet", ad: uyariVar ? "Yine de kaydet" : kaydet.ad, ikon: kaydet.ikon });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function pencereAc(tur, o) {
    o = o || {};
    var m = o.m ? MV.musteri(o.m) : null, t = o.t ? MV.tesis(o.t) : null;
    W = { tur: tur, id: o.id || null, m: o.m || (t && t.m), hata: {}, uyari: {}, kim: o.kim, hedef: o.hedef, d:
      tur === "musteri" ? (m && o.id ? { unvan: m.unvan, kisa: m.kisa, vd: m.vd, vno: m.vno, eposta: m.eposta, ilgili: m.ilgili } : { unvan: "", kisa: "", vd: "", vno: "", eposta: "", ilgili: "" })
      : tur === "tesis" ? (t ? { ad: t.ad, adres: t.adres, ilce: t.ilce, il: t.il, sgk: t.sgk } : { ad: "", adres: "", ilce: "", il: "", sgk: "" })
      : { ad: "", eposta: "", kapsam: "hepsi", tesis: [] } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input:not([readonly]), .a-secim-tus"); if (ilk) ilk.focus();
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
  var yenile = function () { goster(false); };
  X["musteri-ac"] = function () { pencereAc("musteri"); };
  X["musteri-duzenle"] = function () { var r = sayfa(); pencereAc("musteri", { m: r.id, id: r.id }); };
  X["tesis-ac"] = function () { pencereAc("tesis", { m: sayfa().id }); };
  X["tesis-duzenle"] = function () { var r = sayfa(); pencereAc("tesis", { t: r.id, id: r.id }); };
  X["kullanici-ac"] = function () { pencereAc("kullanici", { m: sayfa().id }); };
  X["pasif-ac"] = X["etkinlestir"] = function () {
    var r = sayfa(), musteri = r.v === "musteri";
    pencereAc("pasif", { kim: musteri ? "musteri" : "tesis", hedef: musteri ? MV.musteri(r.id) : MV.tesis(r.id), m: musteri ? r.id : null, t: musteri ? null : r.id });
  };
  X["parola-gonder"] = function () {
    var m = MV.musteri(sayfa().id);
    if (m.giris.durum !== "etkin") m.giris.gonderildi = MK.simdi();
    MK.bildir("Yeni parola " + m.eposta + " adresine gönderildi.");
    yenile();
  };
  X["pencere-kaydet"] = function () {
    var dn = denetle(), onay = W.uyariGoruldu;
    W.hata = dn.h;
    var hk = Object.keys(W.hata);
    if (hk.length) { W.uyari = {}; pencereCiz("w-" + hk[0]); return; }
    /* uyarı ilk kez görünüyorsa göster ve dur; aynı uyarıyla ikinci tık kaydeder */
    var uk = Object.keys(dn.u);
    if (uk.length && !(onay && JSON.stringify(dn.u) === JSON.stringify(W.uyari))) { W.uyari = dn.u; W.uyariGoruldu = true; pencereCiz("w-" + uk[0]); return; }
    var d = W.d, hedef, ileti;
    if (W.tur === "musteri") {
      var m = W.id ? MV.musteri(W.id) : { id: "m" + (MV.MUSTERILER.length + 1), acilis: BUGUN, uygunsuz: 0, giris: { durum: "yok" } };
      Object.assign(m, { unvan: d.unvan.trim(), kisa: d.kisa.trim() || d.unvan.trim().split(" ").slice(0, 2).join(" "), vd: d.vd.trim(), vno: d.vno, eposta: d.eposta.trim(), ilgili: d.ilgili.trim() });
      var yeniGiris = m.eposta && m.giris.durum === "yok";
      if (yeniGiris) m.giris = { durum: "gonderildi", gonderildi: MK.simdi() };
      if (!m.eposta) m.giris = { durum: "yok" };
      if (!W.id) MV.MUSTERILER.push(m);
      hedef = "#/m/" + m.id;
      ileti = (W.id ? "Müşteri güncellendi." : m.kisa + " eklendi.") + (yeniGiris ? " Müşteri girişi açıldı, parola " + m.eposta + " adresine gönderildi." : !m.eposta && !W.id ? " E-posta yok; müşteri girişi e-posta yazılınca açılır." : "");
    } else if (W.tur === "tesis") {
      var t = W.id ? MV.tesis(W.id) : { id: "t" + (MV.TESISLER.length + 1), m: W.m, ekipman: 0, son: "", sonraki: BUGUN };
      Object.assign(t, { ad: d.ad.trim(), adres: d.adres.trim(), ilce: d.ilce.trim(), il: d.il, sgk: d.sgk });
      if (!W.id) MV.TESISLER.push(t);
      hedef = "#/t/" + t.id; ileti = W.id ? "Tesis güncellendi." : t.ad + " eklendi.";
    } else if (W.tur === "kullanici") {
      MV.MUSTERI_KULLANICI.push({ m: W.m, ad: d.ad.trim(), eposta: d.eposta, tesis: d.kapsam === "hepsi" ? "hepsi" : d.tesis.slice(), durum: "gonderildi", gonderildi: MK.simdi() });
      hedef = "#/m/" + W.m; ileti = d.ad.trim() + " için giriş açıldı; parola " + d.eposta + " adresine gönderildi.";
    } else {
      var x = W.hedef, ac = !!x.pasif;
      x.pasif = ac ? null : BUGUN;
      if (W.kim === "musteri") {
        MV.tesisleri(x.id).forEach(function (ts) { if (!ac) ts.pasif = ts.pasif || BUGUN; else if (ts.pasif === x.pasifTesis) ts.pasif = null; });
        x.pasifTesis = ac ? null : BUGUN;
      }
      hedef = location.hash; ileti = ac ? "Yeniden etkinleştirildi." : "Pasif yapıldı; kayıtları duruyor.";
    }
    $("a-pencere").close();
    if (location.hash === hedef) goster(false); else location.hash = hedef;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan;
    if (k && W) { W.d[k] = k === "vno" || k === "sgk" ? e.target.value.replace(/\s+/g, "") : e.target.value; if (W.uyari[k]) { W.uyari = {}; W.uyariGoruldu = false; } }
  };
  MK.onSecim = function (id, deger) {
    if (!W) return;
    if (id === "w-il") { if (W.d.il !== deger) W.d.ilce = ""; W.d.il = deger; pencereCiz("w-il"); }
    else if (id === "w-ilce") { W.d.ilce = deger; pencereCiz("w-ilce"); }
  };
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
