/* ══ probata MAKET M1 — Personel (modül 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════
   Kaynak: pkproje.md §2 (roller), §3.1 modül 2, §3.2 madde 2 (plan kabul ön koşulları), §4.6 (yetkili meslekler, birebir),
   §4.9 (17020 yetkinlik matrisi). Ekranlar: liste (#/) · personel kartı (#/p/<id>) · form (#/yeni, #/p/<id>/duzenle).
   Üreticiler ortak (maket-ortak.js): kabuk, süzgeç, liste, seçim alanı, bildirim. Veri ortak (maket-veri.js), UYDURMA.
   Bakış: firma yöneticisi (varsayım — kim hangi modülü görür henüz karar değil). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var P = MV.PERSONEL;

  var DURUM = { etkin: { ad: "Çalışıyor", rozet: "a-rozet-tamam" }, ayrildi: { ad: "Ayrıldı", rozet: "a-rozet-notr" } };
  var HESAP = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, davet: { ad: "Davet bekliyor", rozet: "a-rozet-bekliyor" }, pasif: { ad: "Pasif", rozet: "a-rozet-notr" } };
  var bransHtml = function (b) { return b ? '<span class="a-hucre-satir">' + ikon(b === "m" ? "cog" : "zap", "a-ikon-kucuk") + MV.bransAd(b) + "</span>" : '<span class="a-deger-yok">—</span>'; };
  var inspector = function (p) { return !!p.hesap && p.hesap.roller.indexOf("inspector") >= 0; };
  var bransi = function (p) { return MV.meslek(p.meslek).b; };

  /* ── SÜZGEÇ (kalıp 15 üretici; kalıp 8: çipler ve/veya; Çalışanlar/Ayrılanlar görünüm anahtarı → seçici, anahtar almaz) ── */
  MK.suzgecTanimla("p", { ad: "Personelde ara", ipucu: "Ad, meslek, EKİPNET", birim: "kişi",
    cipler: [
      { k: "inspector", ad: "Inspector", test: inspector },
      { k: "eksik", ad: "Plan kabulü eksik", test: function (p) { var e = MV.kabulEksik(p); return !!e && e.length > 0; } },
      { k: "m", ad: "Mekanik", grup: "brans", test: function (p) { return bransi(p) === "m"; } },
      { k: "e", ad: "Elektrik", grup: "brans", test: function (p) { return bransi(p) === "e"; } },
      { k: "hesapsiz", ad: "Giriş hesabı yok", test: function (p) { return !p.hesap; } }
    ],
    seciciler: [
      { k: "meslek", ad: "Meslek", secenek: function () {
        return [["tumu", "Tümü"]].concat(P.map(MV.meslekAd).filter(function (v, i, a) { return a.indexOf(v) === i; })
          .sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (m) { return [m, m]; }));
      }, gecer: function (p, v) { return v === "tumu" || MV.meslekAd(p) === v; } },
      { k: "durum", ad: "Görünüm", bas: "calisan", secenek: function () { return [["calisan", "Çalışanlar"], ["ayrilan", "Ayrılanlar"], ["hepsi", "Hepsi"]]; },
        gecer: function (p, v) { return v === "hepsi" || (v === "calisan" ? p.durum === "etkin" : p.durum === "ayrildi"); } }
    ],
    metin: function (p) { return [p.ad, MV.meslekAd(p), p.ekipnet, p.eposta].join(" "); },
    imkansiz: "Bir kişinin branşı hem mekanik hem elektrik olamaz" }, function () { listeCiz(); });

  var SUTUN = [
    { k: "ad", baslik: "Ad soyad", kart: "ust", sira: 1, hucre: function (p) {
      return '<a class="a-no" href="#/p/' + p.id + '">' + kacis(p.ad) + "</a>" + (p.eposta ? kirp(p.eposta, "a-alt-satir") : '<span class="a-alt-satir">E-posta yok</span>');
    } },
    { k: "meslek", baslik: "Meslek", kart: "govde", sira: 2, hucre: function (p) {
      return kirp(MV.meslekAd(p)) + (MV.yetkiliOlabilir(p) ? "" : '<span class="a-alt-satir">Yetkili kişi mesleği değil</span>');
    } },
    { k: "brans", baslik: "Branş", kart: "govde", sira: 3, hucre: function (p) { return bransHtml(bransi(p)); } },
    { k: "ekipnet", baslik: "EKİPNET no", kart: "govde", sira: 4, hucre: function (p) {
      return '<span class="a-kart-etiket">EKİPNET no</span>' + (p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : inspector(p) ? '<span class="a-uyari-metin">Eksik</span>' : '<span class="a-deger-yok">—</span>');
    } },
    { k: "roller", baslik: "Roller", kart: "govde", sira: 5, hucre: function (p) {
      var e = MV.kabulEksik(p);
      return (p.hesap ? '<span class="a-rozetler">' + p.hesap.roller.map(function (r) { return '<span class="a-rozet a-rozet-notr">' + MV.rol(r).ad + "</span>"; }).join("") + "</span>"
        : '<span class="a-deger-yok">Giriş hesabı yok</span>') +
        (e && e.length ? '<span class="a-uyari-metin" title="' + kacis(e.join(" · ")) + '">Plan kabul edemez: ' + kacis(e[0]) + (e.length > 1 ? " +" + (e.length - 1) : "") + "</span>" : "");
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) {
      return rozet(DURUM[p.durum]) + (p.durum === "ayrildi" ? '<span class="a-alt-satir">' + MK.tarihYaz(p.ayrildi) + "</span>" : "");
    } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "p", kayitlar: P, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); }); },
      bosVeri: { ikon: "users", baslik: "Personel kaydı yok", metin: "“Personel ekle” ile ilk kişi kaydedilir." },
      tablo: { baslik: "Personel", sinif: "a-tablo-personel", sutunlar: SUTUN, href: function (p) { return "#/p/" + p.id; } } });
  }

  /* ── PERSONEL KARTI (anayasa 2.7 nesne sayfası: kırıntı + kimlik + tıklanır bilgi yüzleri + tek birincil tuş) ── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" +
      (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<a class="a-yuz" href="#" data-eylem="modul" data-ne="' + o.modul + '">' + ic + "</a>";
  }
  var sayfa = function (no) { return MK.sayfaAdresi(no); };
  function yuzler(p) {
    var s = p.sayilar, h = p.hesap;
    return '<div class="a-yuzler">' +
      yuz({ ikon: "user-cog", ad: "Giriş hesabı", sayi: h ? h.roller.length + " rol" : "Yok", href: h ? "kullanicilar.html#/k/" + p.id : "kullanicilar.html#/davet/" + p.id,
        not: h ? (h.durum === "davet" ? "Davet bekliyor" : h.durum === "pasif" ? "Pasif" : h.roller.map(function (r) { return MV.rol(r).kisa; }).join(" · ")) : "Davet et", uyari: h && h.durum === "davet" }) +
      yuz({ ikon: "scroll-text", ad: "İSG-KATİP kaydı", sayi: MV.ISG.filter(function (x) { return x.k === p.id && !x.onceki; }).length, modul: "Sözleşmeler · İSG-KATİP", href: sayfa(12) && sayfa(12) + "#/isg?kisi=" + p.id, not: "tesis başına" }) +
      yuz({ ikon: "package", ad: "Zimmetinde", sayi: MV.VARLIKLAR.filter(function (v) { return MV.kimde(v.id) === p.id; }).length, modul: "Zimmetler", href: sayfa(9) && sayfa(9) + "#/?kisi=" + p.id, not: "cihaz, araç ve diğer" }) +
      /* 2026-09-24 (M10): eğitim sayıları eğitim kayıtlarından (MV.EGITIMLER); tekrarı geçen ayrıca söylenir */
      (function () { var eg = MV.egitimleri(p.id), gecti = eg.filter(function (x) { return MV.egitimDurum(x) === "gecti"; }).length, yakin = eg.filter(function (x) { return MV.egitimDurum(x) === "yakin"; }).length;
        return yuz({ ikon: "graduation-cap", ad: "Eğitim", sayi: eg.length, modul: "Eğitimler", href: sayfa(10) && sayfa(10) + "#/?kisi=" + p.id,
          not: gecti ? gecti + " tekrarı geçti" : yakin ? yakin + " tekrarı 60 gün içinde" : "tekrarı yakın yok", uyari: gecti + yakin > 0 }); })() +
      (inspector(p) ? yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: s.plan, href: "planlarim.html", not: "kabul bekleyen ve süren" }) : "") +
      "</div>";
  }
  var YETKI_SUTUN = [
    { k: "grup", baslik: "Ek-III grubu", kart: "ust", sira: 1, hucre: function (g) { return '<span class="a-hucre-satir">' + ikon(g.b === "m" ? "cog" : "zap", "a-ikon-kucuk") + '<span class="a-ekipman-ad">' + g.ad + "</span></span>"; } },
    { k: "meslek", baslik: "Meslek izin veriyor", kart: "govde", sira: 2, hucre: function (g) {
      return '<span class="a-kart-etiket">Meslek izin veriyor</span>' + (g.izin ? '<span class="a-hucre-satir">' + ikon("check", "a-ikon-kucuk") + "Evet</span>" : '<span class="a-deger-yok">Hayır</span>');
    } },
    { k: "yetki", baslik: "Firma yetkilendirmesi", kart: "govde", sira: 3, hucre: function (g) {
      return '<span class="a-kart-etiket">Firma yetkilendirmesi</span>' + (g.tarih ? rozet({ ad: MK.tarihYaz(g.tarih), rozet: "a-rozet-tamam" }) : g.izin ? '<span class="a-deger-yok">Yetkilendirilmedi</span>' : '<span class="a-deger-yok">—</span>');
    } }
  ];
  var BELGELER = [["diploma", "Diploma"], ["oda", "Oda kaydı (sicil belgesi)"], ["ekipnet", "EKİPNET kayıt belgesi"], ["egitim", "Yetkili kişi eğitim sertifikası (Bakanlık)"]];
  var BELGE_SUTUN = [
    { k: "belge", baslik: "Belge", kart: "ust", sira: 1, hucre: function (b) { return '<span class="a-hucre-satir">' + ikon("file-check", "a-ikon-kucuk") + kirp(b.ad) + "</span>"; } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (b) {
      return b.var ? rozet({ ad: b.tarih ? MK.tarihYaz(b.tarih) : "Yüklü", rozet: "a-rozet-tamam" }) : b.gerekmez ? rozet({ ad: "Gerekmez", rozet: "a-rozet-notr" }) : rozet({ ad: "Eksik", rozet: "a-rozet-bekliyor" });
    } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (b) {
      if (b.gerekmez) return "";
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "kapsam-disi", ad: b.var ? "Görüntüle" : "Yükle", ikon: b.var ? "file-text" : "plus", sinif: "a-tus-ikincil", veri: { ne: "Belge görüntüleme ve yükleme" } }) + "</div></div>";
    } }
  ];
  function kartCiz(p) {
    if (!p) {
      $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Kişi bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Kişi bulunamadı", metin: "Bu adresteki personel kaydı yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Personele dön</a>" });
      return;
    }
    var m = MV.meslek(p.meslek), tekniker = /tek$/.test(p.meslek), e = MV.kabulEksik(p);
    var gruplar = MV.GRUPLAR.map(function (g) { return { ad: g.ad, b: g.b, izin: m.g.indexOf(g.k) >= 0, tarih: p.yetki[g.k] }; });
    var kosul = function (tamam, metin) { return '<li class="' + (tamam ? "a-kosul-tamam" : "a-kosul-eksik") + '">' + ikon(tamam ? "circle-check" : "triangle-alert", "a-ikon-kucuk") + "<span>" + metin + "</span></li>"; };
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(DURUM[p.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("id-card", "a-ikon-kucuk") + "<span>" + kacis(MV.meslekAd(p)) + (m.b ? " · " + MV.bransAd(m.b) : "") + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-birincil" href="#/p/' + p.id + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a></div></div>" +
      yuzler(p) +
      '<section class="a-bolum" aria-labelledby="a-b-kimlik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kimlik">Kimlik ve sicil</h2></div><dl class="a-bilgi">' +
        bilgi("Meslek", kacis(MV.meslekAd(p))) + bilgi("Branş", MV.bransAd(m.b)) +
        bilgi("Diploma no", p.diploma ? '<span class="a-kod">' + p.diploma + "</span>" : '<span class="a-deger-yok">—</span>') +
        bilgi("Oda sicil no", p.oda ? '<span class="a-kod">' + p.oda + "</span>" : '<span class="a-deger-yok">' + (tekniker ? "Teknikerde zorunlu değil" : "—") + "</span>") +
        bilgi("EKİPNET kayıt no", p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : inspector(p) ? '<span class="a-yuz-uyari">Eksik</span>' : '<span class="a-deger-yok">—</span>') +
        bilgi("E-posta", p.eposta ? kacis(p.eposta) : '<span class="a-deger-yok">—</span>', true) +
        bilgi("İşe başlama", MK.tarihYaz(p.basla)) + (p.durum === "ayrildi" ? bilgi("Ayrılış", MK.tarihYaz(p.ayrildi)) : "") +
      "</dl></section>" +
      (inspector(p) ? '<section class="a-bolum" aria-labelledby="a-b-kabul"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kabul">Plan kabul ön koşulları</h2></div><ul class="a-kosullar">' +
        kosul(!!p.ekipnet, p.ekipnet ? "EKİPNET kayıt numarası var" : "EKİPNET kayıt numarası yok — plan kabul edilemez") +
        kosul(MV.yetkiliOlabilir(p), MV.yetkiliOlabilir(p) ? "Meslek Ek-III'te yetkili kişi mesleği" : "Meslek Ek-III'te yetkili kişi mesleği değil") +
        kosul(Object.keys(p.yetki).length > 0, Object.keys(p.yetki).length ? "En az bir gruba yetkilendirilmiş (" + Object.keys(p.yetki).length + ")" : "Hiçbir gruba yetkilendirilmemiş") +
        '<li class="a-kosul-bilgi">' + ikon("scroll-text", "a-ikon-kucuk") + "<span>İSG-KATİP kaydı her planda tesis için ayrıca denetlenir (onay tarihi en geç kontrolden bir gün önce).</span></li>" +
        "</ul>" + (e && e.length ? "" : "") + "</section>" : "") +
      (m.g.length ? '<section class="a-bolum" aria-labelledby="a-b-yetki"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-yetki">Yetkinlik</h2><span class="a-sayac">TS EN ISO/IEC 17020 · Ek-III grupları</span></div>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Yetkinlik", sinif: "a-tablo-yetkinlik", sutunlar: YETKI_SUTUN, kayitlar: gruplar }) + "</div></section>" : "") +
      (m.g.length ? '<section class="a-bolum" aria-labelledby="a-b-belge"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-belge">Belgeler</h2></div>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Belgeler", sinif: "a-tablo-belge", sutunlar: BELGE_SUTUN, kayitlar: BELGELER.map(function (b) {
          return { ad: b[1], var: !!p.belge[b[0]], tarih: b[0] === "egitim" ? p.belge.egitim : null, gerekmez: b[0] === "oda" && tekniker && !p.oda };
        }) }) + "</div></section>" : "");
  }

  /* ── FORM (kalıp 10: bölümler kolon; kalıp 3: alan veri tipine göre; kalıp 19: seçim alanı; kalıp 2: tuşlar sağda) ── */
  var F = null;
  function formAc(p) {
    F = p ? { id: p.id, ad: p.ad, eposta: p.eposta, basla: p.basla.split("-").reverse().join("."), meslek: p.meslek, meslekMetin: p.meslekMetin || "", diploma: p.diploma, oda: p.oda, ekipnet: p.ekipnet, yetki: Object.assign({}, p.yetki), hata: {} }
      : { id: null, ad: "", eposta: "", basla: "", meslek: "", meslekMetin: "", diploma: "", oda: "", ekipnet: "", yetki: {}, hata: {} };
  }
  /* ortak form üreticisi (MK.alan / MK.girdi); kimlik "f-" önekli, hata F.hata'dan */
  function alan(id, etiket, girdi, ipucu, zorunlu, genis) { return MK.alan({ id: "f-" + id, etiket: etiket, girdi: girdi, ipucu: ipucu, hata: F.hata[id], zorunlu: zorunlu, genis: genis }); }
  function girdi(id, sinif, deger, ek) { return MK.girdi({ id: "f-" + id, alan: id, deger: deger, sinif: sinif, ek: ek, hata: F.hata[id] }); }
  function formCiz(odak) {
    var p = F.id ? MV.kisi(F.id) : null, m = F.meslek ? MV.meslek(F.meslek) : null, tekniker = /tek$/.test(F.meslek);
    var baslik = p ? p.ad + " · düzenle" : "Yeni personel";
    var meslekSec = MV.MESLEKLER.map(function (x) { return [x.k, x.ad, x.g.length ? MV.bransAd(x.b) : "yetkili değil"]; });
    $("a-form-gorunum").innerHTML = MK.kirinti(p ? [["Personel", "#/"], [p.ad, "#/p/" + p.id], ["Düzenle"]] : [["Personel", "#/"], ["Yeni personel"]]) +
      '<div class="a-sayfa-bas"><h1 tabindex="-1">' + kacis(baslik) + "</h1></div>" +
      (Object.keys(F.hata).length ? MK.serit("hata", "circle-alert", "Kaydedilmedi: " + Object.keys(F.hata).length + " alan düzeltilmeli.", "f-ozet") : "") +
      '<div class="a-form-sayfa">' +
        '<section class="a-form-bolum" aria-labelledby="f-b1"><h2 id="f-b1">Kimlik</h2><div class="a-form">' +
          alan("ad", "Ad soyad", girdi("ad", "", F.ad, ' maxlength="80"'), "", true, true) +
          alan("eposta", "İş e-postası", girdi("eposta", "a-girdi-eposta", F.eposta, ' type="email" maxlength="120" inputmode="email"'), "Giriş hesabı bu adresle açılır.", false, true) +
          alan("basla", "İşe başlama", girdi("basla", "a-girdi-sicil", F.basla, ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"'), "", true) +
        "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b2"><h2 id="f-b2">Meslek ve sicil</h2>' +
          (m && !m.g.length ? MK.serit("uyari", "triangle-alert", "Bu meslek Ek-III'te yetkili kişi mesleği değil: yetkinlik ve Inspector rolü verilemez. (Teknisyen yetkili kişi olamaz.)") : "") +
          '<div class="a-form">' +
          alan("meslek", "Meslek", MK.secim({ id: "f-meslek", ad: "Meslek", deger: F.meslek, secenekler: meslekSec, ipucu: "Meslek seçin", gecersiz: !!F.hata.meslek, tanim: "f-meslek-ipucu" }), "Yetkili meslekler yönetmelikteki listeden.", true, true) +
          (F.meslek === "diger" ? alan("meslekMetin", "Meslek adı", girdi("meslekMetin", "", F.meslekMetin, ' maxlength="60"'), "", true, true) : "") +
          alan("brans", "Branş", '<input class="a-girdi a-girdi-oku a-girdi-sicil" id="f-brans" readonly value="' + (m ? MV.bransAd(m.b) : "—") + '" aria-describedby="f-brans-ipucu">', "Meslekten gelir.", false) +
          alan("diploma", "Diploma no", girdi("diploma", "a-girdi-sicil", F.diploma, ' maxlength="20"'), "", !!(m && m.g.length)) +
          alan("oda", "Oda sicil no", girdi("oda", "a-girdi-sicil", F.oda, ' maxlength="20" inputmode="numeric"'), tekniker ? "Teknikerde boş bırakılabilir." : "", !!(m && m.g.length && !tekniker)) +
          alan("ekipnet", "EKİPNET kayıt no", girdi("ekipnet", "a-girdi-sicil", F.ekipnet, ' maxlength="20" inputmode="numeric"'), "Inspector'ın plan kabulü bu numarayı ister.", false) +
        "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b3"><h2 id="f-b3">Yetkinlik</h2>' +
          '<p class="a-bolum-aciklama">Firmanın bu kişiyi yetkilendirdiği Ek-III grupları. Meslek izin vermeyen grup seçilemez.</p>' +
          MV.GRUPLAR.map(function (g) {
            var izin = !!m && m.g.indexOf(g.k) >= 0;
            return '<label class="a-onay-kutusu"><input type="checkbox" data-yetki="' + g.k + '"' + (F.yetki[g.k] ? " checked" : "") + (izin ? "" : " disabled") + "><span>" + g.ad +
              (izin ? (F.yetki[g.k] && F.yetki[g.k] !== "yeni" ? '<span class="a-alt-satir">Yetkilendirme ' + MK.tarihYaz(F.yetki[g.k]) + "</span>" : "") : '<span class="a-alt-satir">' + (m ? "Meslek izin vermiyor" : "Önce meslek seçin") + "</span>") + "</span></label>";
          }).join("") +
        "</section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b4"><h2 id="f-b4">Giriş hesabı</h2>' +
          '<p class="a-bolum-aciklama">' + (p && p.hesap ? "Hesap var: " + p.hesap.roller.map(function (r) { return MV.rol(r).ad; }).join(", ") + ". Roller Kullanıcılar ekranında değişir." : "Bu kişinin giriş hesabı yok. Kaydettikten sonra Kullanıcılar ekranından davet edilir.") + "</p>" +
          (p ? '<a class="a-tus a-tus-ikincil" href="kullanicilar.html#/' + (p.hesap ? "k/" : "davet/") + p.id + '">' + ikon(p.hesap ? "user-cog" : "user-plus", "a-ikon-kucuk") + (p.hesap ? "Kullanıcılar'da aç" : "Davet et") + "</a>" : "") +
        "</section>" +
      "</div>" +
      '<div class="a-form-eylem"><p class="a-adim-not">Zorunlu alanlar işaretli.</p>' +
        '<a class="a-tus a-tus-ikincil" href="' + (p ? "#/p/" + p.id : "#/") + '">Vazgeç</a>' +
        MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function denetle() {
    var h = {}, m = F.meslek ? MV.meslek(F.meslek) : null;
    if (F.ad.trim().split(/\s+/).length < 2) h.ad = "Ad ve soyad yazılmalı.";
    if (F.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(F.eposta)) h.eposta = "E-posta biçimi geçersiz.";
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(F.basla)) h.basla = "Tarih GG.AA.YYYY biçiminde olmalı.";
    if (!m) h.meslek = "Meslek seçilmeli.";
    if (F.meslek === "diger" && !F.meslekMetin.trim()) h.meslekMetin = "Meslek adı yazılmalı.";
    if (m && m.g.length && !F.diploma.trim()) h.diploma = "Yetkili kişi mesleğinde diploma no zorunlu.";
    if (m && m.g.length && !/tek$/.test(F.meslek) && !F.oda.trim()) h.oda = "Mühendis ve teknik öğretmende oda sicil no zorunlu.";
    if (F.ekipnet && !/^\d{4,12}$/.test(F.ekipnet)) h.ekipnet = "Yalnız rakam (4–12 hane) — biçim doğrulanacak.";
    return h;
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "form" };
    if ((m = /^#\/p\/([a-z0-9]+)\/duzenle$/.exec(h))) return { v: "form", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)$/.exec(h))) return { v: "kart", id: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), p = r.id ? MV.kisi(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v !== "kart"; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") listeCiz();
    else if (r.v === "kart") kartCiz(p);
    else { if (!F || F.id !== (r.id || null) || odakla) formAc(p); formCiz(); }
    document.title = (r.v === "liste" ? "Personel" : r.v === "kart" ? (p ? p.ad : "Kişi bulunamadı") : (p ? p.ad + " · düzenle" : "Yeni personel")) + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
  }
  MK.goster = goster;

  MK.onSecim = function (id, deger) {
    if (id === "f-meslek") {
      F.meslek = deger; delete F.hata.meslek;
      var m = MV.meslek(deger);   /* meslek izin vermeyen yetkiler düşer */
      Object.keys(F.yetki).forEach(function (g) { if (m.g.indexOf(g) < 0) delete F.yetki[g]; });
      formCiz();
    }
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k) { F[k] = e.target.value; } };
  document.addEventListener("change", function (e) {
    var g = e.target.dataset && e.target.dataset.yetki; if (!g) return;
    if (e.target.checked) F.yetki[g] = F.yetki[g] || "yeni"; else delete F.yetki[g];
  });
  MK.eylem.kaydet = function () {
    F.hata = denetle();
    var hatalar = Object.keys(F.hata);
    if (hatalar.length) { formCiz(); var ilk = $("f-" + hatalar[0]); if (ilk) ilk.focus(); return; }
    var yetki = {}; Object.keys(F.yetki).forEach(function (g) { yetki[g] = F.yetki[g] === "yeni" ? MK.BUGUN : F.yetki[g]; });
    var kayit = { ad: F.ad.trim(), eposta: F.eposta.trim(), basla: F.basla.split(".").reverse().join("-"), meslek: F.meslek, meslekMetin: F.meslekMetin.trim(),
      diploma: F.diploma.trim(), oda: F.oda.trim(), ekipnet: F.ekipnet.trim(), yetki: yetki };
    var p = F.id ? MV.kisi(F.id) : null;
    if (p) Object.assign(p, kayit);
    else { p = Object.assign({ id: "y" + P.length, durum: "etkin", hesap: null, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } }, kayit); P.push(p); }
    F = null; location.hash = "#/p/" + p.id;
    MK.bildir(kayit.ad + " kaydedildi.");
  };

  MK.kabuk({ modul: 2, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("p");
  MK.seciciCiz("p"); goster(false);
})();
