/* ══ probata MAKET M1 — Personel (modül 1 + 2) · 2. TUR, ONAY BEKLİYOR (2026-09-25) ═════════════════════════════════
   1. tur (toplu maket, 2026-09-24): Kullanıcılar ve Personel iki ayrı ekrandı. Reisim'in M1 cevapları (2026-09-25):
   · 159 "birleşsin" + 33 "kullanıcı hesabı her zaman personele bağlı olsun" → Kullanıcılar ekranı kalktı; giriş hesabı, roller ve
     rol yetkileri buradadır (kişinin kartında "Giriş hesabı ve roller", sayfada "Rol yetkileri" sekmesi).
   · 32 "başlangıç olarak uygun ama admin istediği gibi rollerin yetkilerini değiştirebilmeli" → rol yetkileri tablosu düzenlenir.
   · 34 "yönetici geçici parola verir, daha sonra kullanıcı parolasını değiştirebilir" → davet yok; "Giriş hesabı aç" / "Yeni geçici
     parola" parolayı bir kez gösterir.
   · 38 "bu kadar teknik detaya girme" + 39 "sadece uyarsın, ama yapılabilir olsun" → Ek-III grup yetkilendirmesi (17020 yetkinlik
     tablosu) kalktı; eksik bilgi plan kabulünü ENGELLEMEZ, uyarı olarak görünür (MV.eksikBilgi). Form alanlarında zorunluluk
     yalnız ad, işe başlama ve meslek.
   · 40 "Eğitimler ile yürüyecek ama personel özlük dosyaları ve zimmetleri personelde olacak" → kartta Zimmetindekiler ve Özlük
     dosyası; eğitim sertifikaları Eğitimler'de.
   · 43 ayrılan personel silinmez (uygun).
   Ekranlar: liste (#/) · rol yetkileri (#/roller) · kart (#/p/<id>) · giriş hesabı penceresi (#/p/<id>/hesap) · özlük belgesi
   penceresi (#/p/<id>/belge) · form (#/yeni, #/p/<id>/duzenle). Üreticiler ortak (maket-ortak.js), veri ortak (maket-veri.js), UYDURMA.
   Bakış: firma yöneticisi (rol yetkilerini, hesapları ve özlük dosyasını o yönetir). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi;
  var P = MV.PERSONEL;

  var DURUM = { etkin: { ad: "Çalışıyor", rozet: "a-rozet-tamam" }, ayrildi: { ad: "Ayrıldı", rozet: "a-rozet-notr" } };
  var HESAP = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, ilk: { ad: "İlk giriş bekleniyor", rozet: "a-rozet-bekliyor" }, pasif: { ad: "Kapalı", rozet: "a-rozet-notr" } };
  var bransHtml = function (b) { return b ? '<span class="a-hucre-satir">' + ikon(b === "m" ? "cog" : "zap", "a-ikon-kucuk") + MV.bransAd(b) + "</span>" : '<span class="a-deger-yok">—</span>'; };
  var inspector = function (p) { return !!p.hesap && p.hesap.roller.indexOf("inspector") >= 0; };
  var bransi = function (p) { return MV.meslek(p.meslek).b; };
  var rolRozet = function (r) { return '<span class="a-rozet a-rozet-notr">' + MV.rol(r).ad + "</span>"; };
  var epostaGecerli = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var modulSayisi = MK.MENU.reduce(function (n, g) { return n + g.ogeler.length; }, 0);

  /* ── SÜZGEÇ (kalıp 15 üretici; kalıp 8: çipler ve/veya; Çalışanlar/Ayrılanlar görünüm anahtarı → seçici, anahtar almaz) ── */
  MK.suzgecTanimla("p", { ad: "Personelde ara", ipucu: "Ad, meslek, EKİPNET", birim: "kişi",
    cipler: [
      { k: "inspector", ad: "Inspector", test: inspector },
      { k: "eksik", ad: "Bilgisi eksik", test: function (p) { return MV.eksikBilgi(p).length > 0; } },
      { k: "m", ad: "Mekanik", grup: "brans", test: function (p) { return bransi(p) === "m"; } },
      { k: "e", ad: "Elektrik", grup: "brans", test: function (p) { return bransi(p) === "e"; } },
      { k: "hesapsiz", ad: "Giriş hesabı yok", test: function (p) { return !p.hesap; } }
    ],
    seciciler: [
      { k: "rol", ad: "Rol", secenek: function () { return [["tumu", "Tümü"]].concat(MV.ROLLER.map(function (r) { return [r.k, r.ad]; })); },
        gecer: function (p, v) { return v === "tumu" || (!!p.hesap && p.hesap.roller.indexOf(v) >= 0); } },
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
    { k: "meslek", baslik: "Meslek", kart: "govde", sira: 2, hucre: function (p) { return kirp(MV.meslekAd(p)); } },
    { k: "brans", baslik: "Branş", kart: "govde", sira: 3, hucre: function (p) { return bransHtml(bransi(p)); } },
    { k: "ekipnet", baslik: "EKİPNET no", kart: "govde", sira: 4, hucre: function (p) {
      return '<span class="a-kart-etiket">EKİPNET no</span>' + (p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : inspector(p) ? '<span class="a-uyari-metin">Boş</span>' : '<span class="a-deger-yok">—</span>');
    } },
    { k: "roller", baslik: "Giriş hesabı ve roller", kart: "govde", sira: 5, hucre: function (p) {
      var h = p.hesap, e = MV.eksikBilgi(p);
      return (h ? '<span class="a-rozetler">' + h.roller.map(rolRozet).join("") + "</span>" + (h.durum !== "etkin" ? '<span class="a-alt-satir">' + HESAP[h.durum].ad + "</span>" : "")
        : '<span class="a-deger-yok">Giriş hesabı yok</span>') +
        (e.length ? '<span class="a-uyari-metin" title="' + kacis(e.join(" · ")) + '">Eksik: ' + kacis(e[0]) + (e.length > 1 ? " +" + (e.length - 1) : "") + "</span>" : "");
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

  /* ── ROL YETKİLERİ — başlangıç düzeni öneri (32), firma yöneticisi değiştirir. Modüller menünün kendisinden (MK.MENU). ──────
     Firma yöneticisinin Personel yetkisi sabit: kendini (ve firmayı) hesap yönetiminden kilitleyemez. */
  var R = { duzen: false, taslak: null };
  var DUZEY_SEC = [["yaz", "Değiştirir"], ["gor", "Görür"], ["brans", "Branşı"], ["kendi", "Kendi"], ["yok", "Görmez"]];
  var kopya = function (m) { return JSON.parse(JSON.stringify(m)); };
  var ayni = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var kilitli = function (no, i) { return no === 2 && MV.ROLLER[i].k === "yonetici"; };
  function matrisSatirlari() {
    var l = [];
    MK.MENU.forEach(function (g) { g.ogeler.forEach(function (o) { l.push({ ad: o[0], ikon: o[1], no: o[2], grup: g.grup }); }); });
    l.push({ ad: "Hareket kaydı", ikon: "shield-check", no: "hareket", grup: "Kim, ne zaman, ne yaptı" });
    return l;
  }
  function degisenSayi() {
    var n = 0;
    Object.keys(MV.MATRIS).forEach(function (no) { MV.MATRIS[no].forEach(function (d, i) { if (R.taslak[no][i] !== d) n++; }); });
    return n;
  }
  var duzeyHtml = function (d) { return d === "yok" ? '<span class="a-deger-yok">—</span>' : rozet(MV.DUZEY[d]); };
  var MATRIS_SUTUN = [{ k: "modul", baslik: "Modül", kart: "ust", sira: 1, hucre: function (m) {
    return '<span class="a-hucre-satir">' + ikon(m.ikon, "a-ikon-kucuk") + '<span><span class="a-ekipman-ad">' + m.ad + '</span><span class="a-alt-satir">' + m.grup + "</span></span></span>";
  } }].concat(MV.ROLLER.map(function (r, i) {
    return { k: "r" + i, baslik: r.ad, kart: "govde", sira: 2 + i, hucre: function (m) {
      var d = (R.duzen ? R.taslak : MV.MATRIS)[m.no][i], et = '<span class="a-kart-etiket">' + r.ad + "</span>";
      if (!R.duzen) return et + duzeyHtml(d);
      if (kilitli(m.no, i)) return et + '<span class="a-matris-sabit">' + duzeyHtml(d) + '<span class="a-alt-satir">sabit</span></span>';
      return et + MK.secim({ id: "m-" + m.no + "-" + i, ad: m.ad + " · " + r.ad, deger: d, secenekler: DUZEY_SEC });
    } };
  }));
  function rollerCiz() {
    var n = R.duzen ? degisenSayi() : 0, oneri = ayni(R.duzen ? R.taslak : MV.MATRIS, MV.MATRIS_ONERI);
    $("a-roller-bas").innerHTML = '<h1 tabindex="-1">Personel</h1>' +
      (R.duzen ? "" : MK.tus({ eylem: "rol-duzenle", ad: "Rol yetkilerini düzenle", ikon: "pencil", sinif: "a-tus-birincil a-bolum-tus" }));
    $("a-roller").innerHTML =
      MK.serit("bilgi", "circle-alert", (oneri ? "Önerilen başlangıç düzeni. " : "Firmanın kendi düzeni. ") +
        "Firma yöneticisi her rolün her modülde neyi göreceğini değiştirebilir; bir kişinin birden çok rolü varsa en geniş düzey geçerlidir.") +
      '<p class="a-bolum-aciklama a-lejant">' + ["yaz", "gor", "brans", "kendi"].map(function (d) {
        return rozet(MV.DUZEY[d]) + " " + { yaz: "görür ve değiştirir", gor: "görür", brans: "yalnız kendi branşının kayıtları", kendi: "yalnız kendi kayıtları" }[d];
      }).join(" · ") + " · — görmez</p>" +
      /* 375 ölçümü (2026-09-25): üç tuş alttaki yapışkan çubuğa sığmıyordu → "önerilen düzene dön" tablonun üstünde */
      (R.duzen ? '<div class="a-eylem-cubugu a-eylem-sol a-matris-arac">' + MK.tus({ eylem: "matris-oneri", ad: "Önerilen düzene dön", ikon: "undo-2", sinif: "a-tus-ikincil", kapali: ayni(R.taslak, MV.MATRIS_ONERI) }) + "</div>" : "") +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Rol yetkileri", sinif: "a-tablo-matris", sutunlar: MATRIS_SUTUN, kayitlar: matrisSatirlari() }) + "</div>" +
      (R.duzen ? '<div class="a-form-eylem"><p class="a-adim-not">' + (n ? n + " değişiklik kaydedilmedi." : "Değişiklik yok.") + "</p>" +
        MK.tus({ eylem: "matris-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "matris-kaydet", ad: "Kaydet", ikon: "check", kapali: !n }) + "</div>" : "");
  }

  /* ── PERSONEL KARTI (anayasa 2.7 nesne sayfası: kırıntı + kimlik + tıklanır bilgi yüzleri + tek birincil tuş) ── */
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" +
      (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    if (o.eylem) return '<a class="a-yuz" href="#" data-eylem="' + o.eylem + '">' + ic + "</a>";
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<a class="a-yuz" href="#" data-eylem="modul" data-ne="' + o.modul + '">' + ic + "</a>";
  }
  var sayfa = function (no) { return MK.sayfaAdresi(no); };
  var zimmetleri = function (p) { return MV.VARLIKLAR.filter(function (v) { return MV.kimde(v.id) === p.id; }); };
  function yuzler(p) {
    var s = p.sayilar, h = p.hesap, z = zimmetleri(p);
    return '<div class="a-yuzler">' +
      yuz({ ikon: "key-round", ad: "Giriş hesabı", sayi: h ? h.roller.length + " rol" : "Yok", eylem: "hesaba-git",
        not: h ? (h.durum === "etkin" ? h.roller.map(function (r) { return MV.rol(r).kisa; }).join(" · ") : HESAP[h.durum].ad) : "Hesap aç", uyari: !!h && h.durum === "ilk" }) +
      yuz({ ikon: "scroll-text", ad: "İSG-KATİP kaydı", sayi: MV.ISG.filter(function (x) { return x.k === p.id && !x.onceki; }).length, modul: "Sözleşmeler · İSG-KATİP", href: sayfa(12) && sayfa(12) + "#/isg?kisi=" + p.id, not: "tesis başına" }) +
      yuz({ ikon: "package", ad: "Zimmetinde", sayi: z.length, eylem: "zimmete-git", not: "cihaz, araç ve diğer" }) +
      /* eğitim sayıları eğitim kayıtlarından (M10/M16); tekrarı geçen ayrıca söylenir */
      (function () { var eg = MV.egitimleri(p.id), gecti = eg.filter(function (x) { return MV.egitimDurum(x) === "gecti"; }).length, yakin = eg.filter(function (x) { return MV.egitimDurum(x) === "yakin"; }).length;
        return yuz({ ikon: "graduation-cap", ad: "Eğitim", sayi: eg.length, modul: "Eğitimler", href: sayfa(10) && sayfa(10) + "#/?kisi=" + p.id,
          not: gecti ? gecti + " tekrarı geçti" : yakin ? yakin + " tekrarı 60 gün içinde" : "tekrarı yakın yok", uyari: gecti + yakin > 0 }); })() +
      (inspector(p) ? yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: s.plan, href: "planlarim.html", not: "kabul bekleyen ve süren" }) : "") +
      "</div>";
  }

  /* giriş hesabı ve roller (1 ve 159: Kullanıcılar ekranının yerine) */
  var SECILI = null;   /* kaydedilmemiş rol seçimi */
  function birlesim(roller) {   /* ekran yetkisi = rollerin birleşimi (en geniş düzey) */
    var s = {};
    Object.keys(MV.MATRIS).forEach(function (no) {
      var en = "yok";
      MV.ROLLER.forEach(function (r, i) { if (roller.indexOf(r.k) >= 0 && MV.DUZEY[MV.MATRIS[no][i]].sira > MV.DUZEY[en].sira) en = MV.MATRIS[no][i]; });
      s[no] = en;
    });
    return s;
  }
  function rolListesi(sec, ozn, kapali, p) {
    var yetkili = MV.yetkiliOlabilir(p);
    return '<ul class="a-secim-listesi">' + MV.ROLLER.map(function (r) {
      var uyar = r.k === "inspector" && !yetkili;
      return '<li><label class="a-secim-satir"><input type="checkbox" ' + ozn + '="' + r.k + '"' + (sec.indexOf(r.k) >= 0 ? " checked" : "") + (kapali ? " disabled" : "") + ">" +
        '<span class="a-secim-metin"><span class="a-ekipman-ad">' + r.ad + '</span><span class="a-alt-satir' + (uyar ? " a-uyari-metin" : "") + '">' +
        (uyar ? "Uyarı: meslek (" + kacis(MV.meslekAd(p)) + ") yetkili kişi meslekleri arasında değil. Verilebilir; kartta uyarı görünür." : r.acik) + "</span></span></label></li>";
    }).join("") + "</ul>";
  }
  function hesapHtml(p) {
    var h = p.hesap, bas = '<div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-hesap" tabindex="-1">Giriş hesabı ve roller</h2>';
    if (!h) return '<section class="a-bolum" aria-labelledby="a-b-hesap">' + bas + "</div>" +
      '<p class="a-bolum-aciklama">Giriş hesabı yok. Hesap açılınca geçici bir parola oluşur; kişiye siz iletirsiniz, kişi ilk girişten sonra parolasını değiştirebilir.</p>' +
      (p.durum === "etkin" ? '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "hesap-ac", ad: "Giriş hesabı aç", ikon: "key-round" }) + "</div>"
        : MK.serit("bilgi", "ban", "Ayrılan personele hesap açılmaz.")) + "</section>";
    var sec = SECILI || h.roller, pasif = h.durum === "pasif", degisti = sec.slice().sort().join() !== h.roller.slice().sort().join();
    var b = birlesim(sec), gorulen = MK.MENU.reduce(function (n, g) { return n + g.ogeler.filter(function (o) { return b[o[2]] !== "yok"; }).length; }, 0);
    var tuslar = pasif ? (p.durum === "etkin" ? MK.tus({ eylem: "hesap-yeniden", ad: "Hesabı yeniden aç", ikon: "refresh-cw", sinif: "a-tus-ikincil" }) : "")
      : MK.tus({ eylem: "hesap-ac", ad: "Yeni geçici parola", ikon: "key-round", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "hesap-kapat", ad: "Hesabı kapat", ikon: "ban", sinif: "a-tus-ikincil" });
    return '<section class="a-bolum" aria-labelledby="a-b-hesap">' + bas + '<div class="a-eylem-cubugu a-bolum-tus">' + tuslar + "</div></div>" +
      '<dl class="a-bilgi">' + bilgi("Durum", rozet(HESAP[h.durum])) + bilgi("Giriş e-postası", kacis(p.eposta), true) +
        bilgi(h.durum === "ilk" ? "Geçici parola verildi" : "Son giriş", MK.zamanYaz(h.durum === "ilk" ? h.verildi : h.son)) +
        bilgi("Görebildiği modül", gorulen + " / " + modulSayisi) + "</dl>" +
      (pasif ? '<div class="a-bolum-serit">' + MK.serit("bilgi", "ban", "Hesap kapalı: giriş yapamaz; roller korunur, kayıtları ve imzaladığı raporlar yerinde kalır.") + "</div>" : "") +
      '<p class="a-etiket a-etiket-ust">Roller</p>' + rolListesi(sec, "data-rol", pasif, p) +
      /* bölüm içi çubuk: telefonda yapışkan DEĞİL (form sayfası çubuğu değil; ölçüm 2026-09-25: rol satırlarının üstüne biniyordu) */
      (pasif ? "" : '<div class="a-bolum-eylem"><p class="a-adim-not">' + (degisti ? "Kaydedilmemiş değişiklik var." : "Bir kişinin birden çok rolü olabilir.") + "</p>" +
        (degisti ? MK.tus({ eylem: "rol-geri", ad: "Vazgeç", sinif: "a-tus-ikincil" }) : "") +
        MK.tus({ eylem: "rol-kaydet", ad: "Rolleri kaydet", ikon: "check", kapali: !degisti || !sec.length }) + "</div>") +
      "</section>";
  }

  /* zimmetindekiler (40): o anda kişide olan varlıklar; hareketler ve teslim Zimmetler modülünde */
  var VARLIK_IKON = { cihaz: "gauge", arac: "truck", diger: "package" };
  var ZIMMET_SUTUN = [
    { k: "varlik", baslik: "Varlık", kart: "ust", sira: 1, hucre: function (v) {
      /* kısa kimlik (envanter / plaka) bağlantı, ad ve marka altında — uzun ad telefonda bölünür (ölçüm 2026-09-25: 375'te 93 px taşıyordu) */
      return '<span class="a-hucre-satir">' + ikon(VARLIK_IKON[v.tur], "a-ikon-kucuk") + '<span class="a-hucre-metin"><a class="a-no" href="zimmetler.html#/v/' + v.id + '">' + kacis(v.plaka || v.env) + "</a>" +
        '<span class="a-alt-satir">' + kacis(v.ad + " · " + [v.marka, v.model].filter(Boolean).join(" ")) + "</span></span></span>";
    } },
    { k: "teslim", baslik: "Teslim alındı", kart: "govde", sira: 2, hucre: function (v) {
      var z = MV.hareketler(v.id)[0];
      return '<span class="a-kart-etiket">Teslim alındı</span><span class="a-tarih-saat">' + MK.tarihYaz(z.tarih) + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (v) {
      var k = MV.kalDurum(v);
      return k === "gecti" ? rozet({ ad: "Kalibrasyonu geçti", rozet: "a-rozet-red" }) : k === "yakin" ? rozet({ ad: "Kalibrasyon 30 gün içinde", rozet: "a-rozet-bekliyor" })
        : rozet({ ad: "Kullanımda", rozet: "a-rozet-tamam" });
    } }
  ];
  /* imzalı zimmet teslim formu (reisim 2026-09-25): PDF çıkar → imzalanır → taranır → buraya yüklenir. Zimmet değişince form eskir. */
  /* reisim 2026-09-25: "imzalı zimmet formuna tıklayınca açılmalı, sadece yüklü olduğu bilgisi yeterli değil" → şeridin yanında "Aç" */
  function zimmetFormuDurum(p, z) {
    var f = MV.zimmetFormu(p.id), guncel = MV.zimmetFormuGuncel(p.id, z.map(function (v) { return v.id; }));
    var ac = f ? '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + "/zimmet-imzali/" + f.no + '">' + ikon("file-check", "a-ikon-kucuk") + "İmzalı formu aç</a>" : "";
    if (!z.length && !f) return "";
    if (f && guncel) return MK.serit("onay", "file-check", "İmzalı zimmet formu yüklü: <b>" + f.no + "</b> · " + MK.tarihYaz(f.tarih) + " · " + f.kapsam.length + " varlık.") + ac;
    if (f) return MK.serit("uyari", "triangle-alert", "İmzalı form (" + f.no + ", " + MK.tarihYaz(f.tarih) + ") eskidi: zimmet o tarihten sonra değişti. Yeni formu yazdırıp imzalatın ve taramasını yükleyin.") + ac;
    return MK.serit("uyari", "triangle-alert", "İmzalı zimmet formu yok. Formu yazdırıp imzalatın ve taramasını yükleyin.");
  }
  function zimmetHtml(p) {
    var z = zimmetleri(p);
    return '<section class="a-bolum" aria-labelledby="a-b-zimmet"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zimmet" tabindex="-1">Zimmetindekiler</h2>' +
        '<span class="a-sayac"><b>' + z.length + "</b> varlık</span>" +
        '<div class="a-eylem-cubugu a-bolum-tus">' + (z.length ? '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + '/zimmet-formu">' + ikon("file-signature", "a-ikon-kucuk") + "Zimmet formu</a>" : "") +
          '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + '/zimmet-gecmisi">' + ikon("history", "a-ikon-kucuk") + "Zimmet geçmişi</a></div></div>" +
      '<div class="a-zimmet-form-durum">' + zimmetFormuDurum(p, z) + "</div>" +
      (z.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Zimmetindekiler", sinif: "a-tablo-kzimmet", sutunlar: ZIMMET_SUTUN, kayitlar: z }) + "</div>"
        : '<p class="a-bos-satir">Zimmetinde varlık yok.</p>') + "</section>";
  }

  /* özlük dosyası (40): kişinin belgeleri; yalnız firma yöneticisi görür (KVKK: özlük bilgisi). Eğitim sertifikaları Eğitimler'de. */
  var BELGE_TUR = [["is", "İş sözleşmesi"], ["diploma", "Diploma"], ["oda", "Oda kaydı"], ["ekipnet", "EKİPNET kayıt belgesi"], ["kimlik", "Kimlik belgesi"],
    ["saglik", "Sağlık raporu"], ["diger", "Diğer"]];
  var belgeAd = function (k) { return BELGE_TUR.filter(function (x) { return x[0] === k; })[0][1]; };
  function ozluk(p) {
    if (!p.ozluk) {   /* örnek: işe girişte iş sözleşmesi + kaydında var olan mesleki belgeler (tarih işe başlama) */
      p.ozluk = [{ tur: "is", tarih: p.basla, dosya: "is-sozlesmesi.pdf" }];
      ["diploma", "oda", "ekipnet"].forEach(function (k) { if (p.belge && p.belge[k]) p.ozluk.push({ tur: k, tarih: p.basla, dosya: k + ".pdf" }); });
    }
    return p.ozluk;
  }
  var OZLUK_SUTUN = [
    { k: "belge", baslik: "Belge", kart: "ust", sira: 1, hucre: function (b) {
      return '<span class="a-hucre-satir">' + ikon("file-check", "a-ikon-kucuk") + '<span class="a-hucre-metin">' + kirp(belgeAd(b.tur)) + (b.aciklama ? kirp(b.aciklama, "a-alt-satir") : "") + "</span></span>";
    } },
    { k: "tarih", baslik: "Eklendi", kart: "govde", sira: 2, hucre: function (b) { return '<span class="a-kart-etiket">Eklendi</span><span class="a-tarih-saat">' + MK.tarihYaz(b.tarih) + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function () {
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.tus({ eylem: "kapsam-disi", ad: "Aç", ikon: "file-text", sinif: "a-tus-ikincil", veri: { ne: "Belgeyi açma" } }) + "</div></div>";
    } }
  ];
  function ozlukHtml(p) {
    var l = ozluk(p);
    return '<section class="a-bolum" aria-labelledby="a-b-ozluk"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ozluk">Özlük dosyası</h2>' +
        '<span class="a-sayac"><b>' + l.length + "</b> belge</span>" +
        '<div class="a-eylem-cubugu a-bolum-tus">' + MK.tus({ eylem: "belge-ekle", ad: "Belge ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div></div>" +
      '<p class="a-bolum-aciklama">Yalnız firma yöneticisi görür. Eğitim sertifikaları Eğitimler modülünde tutulur (yukarıdaki Eğitim kutusu).</p>' +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Özlük dosyası", sinif: "a-tablo-ozluk", sutunlar: OZLUK_SUTUN, kayitlar: l }) + "</div></section>";
  }

  /* zimmet teslim formu görünümü: temel format önizlemesi (PDF'in iskeleti) + imzalı taramayı yükle */
  var formNo = function (p) { return "ZF-0926-" + ("00" + (15 + MV.PERSONEL.indexOf(p))).slice(-3); };
  var teslimEden = function () { return MV.kisi("za"); };
  function zimmetFormuCiz(p) {
    var z = zimmetleri(p), guncel = MV.zimmetFormuGuncel(p.id, z.map(function (v) { return v.id; }));
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad, "#/p/" + p.id], ["Zimmet formu"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">Zimmet teslim formu</h1>' +
        (guncel ? rozet({ ad: "İmzalısı yüklü", rozet: "a-rozet-tamam" }) : rozet({ ad: "İmza bekliyor", rozet: "a-rozet-bekliyor" })) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("user", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " · " + z.length + " varlık</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "kapsam-disi", ad: "PDF indir", ikon: "file-text", sinif: "a-tus-ikincil", veri: { ne: "PDF indirme (sunucuda üretilir)" } }) +
          MK.tus({ eylem: "zform-yukle", ad: "İmzalı taramayı yükle", ikon: "file-plus" }) + "</div></div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "circle-alert", "Temel format. Firma kendi formunu isterse o firmaya özel düzenlenir. Sıra: PDF indir → yazdır, iki taraf imzalar → taramayı (PDF ya da fotoğraf) yükle.") + "</div>" +
      MB.zimmetFormu({ p: p, varliklar: z, no: formNo(p), tarih: MK.BUGUN, eden: teslimEden() });
  }

  /* imzalı formun açılışı: yüklenen tarama (makette: formun o tarihteki kapsamıyla, imzalı hâli) */
  function imzaliFormCiz(p, no) {
    var f = (MV.ZIMMET_FORMLARI[p.id] || []).filter(function (x) { return x.no === no; })[0];
    if (!f) { kartCiz(p); return; }
    var son = MV.zimmetFormu(p.id) === f, guncel = son && MV.zimmetFormuGuncel(p.id, zimmetleri(p).map(function (v) { return v.id; }));
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad, "#/p/" + p.id], ["İmzalı zimmet formu"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">İmzalı zimmet formu · ' + f.no + "</h1>" +
        (guncel ? rozet({ ad: "Güncel", rozet: "a-rozet-tamam" }) : rozet({ ad: son ? "Eskidi" : "Önceki form", rozet: son ? "a-rozet-bekliyor" : "a-rozet-notr" })) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-check", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " · " + MK.tarihYaz(f.tarih) + " · " + f.kapsam.length + " varlık · " + kacis(f.dosya) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "kapsam-disi", ad: "Dosyayı indir", ikon: "file-text", sinif: "a-tus-ikincil", veri: { ne: "Tarama dosyasını indirme" } }) +
          '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + '/zimmet-gecmisi">' + ikon("history", "a-ikon-kucuk") + "Zimmet geçmişi</a></div></div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "circle-alert", "Makette taramanın yerine formun imzalı hâli gösterilir; uygulamada yüklenen PDF ya da fotoğraf burada açılır (yalnız firma içinde, kısa ömürlü bağlantı).") + "</div>" +
      MB.zimmetFormu({ p: p, varliklar: f.kapsam.map(MV.varlik), no: f.no, tarih: f.tarih, eden: teslimEden(), imzali: true });
  }
  /* zimmet geçmişi (reisim 2026-09-25): hangi varlık hangi tarihte verildi, hangi tarihte kime / nereye geri alındı */
  var yer = function (k) { return k === "depo" ? "Depoya iade" : k === "lab" ? "Kalibrasyona gönderildi" : "devredildi · " + MV.kisi(k).ad; };
  var GECMIS_SUTUN = [
    { k: "varlik", baslik: "Varlık", kart: "ust", sira: 1, hucre: function (g) {
      var v = g.v;
      return '<span class="a-hucre-satir">' + ikon(VARLIK_IKON[v.tur], "a-ikon-kucuk") + '<span class="a-hucre-metin"><a class="a-no" href="zimmetler.html#/v/' + v.id + '">' + kacis(v.plaka || v.env) + "</a>" +
        '<span class="a-alt-satir">' + kacis(v.ad) + "</span></span></span>";
    } },
    { k: "verildi", baslik: "Verildi", kart: "govde", sira: 2, hucre: function (g) {
      return '<span class="a-kart-etiket">Verildi</span><span><span class="a-tarih-saat">' + MK.tarihYaz(g.verildi.tarih) + "</span>" +
        '<span class="a-alt-satir">' + (g.verildi.eden === "depo" ? "depodan" : "devir · " + kacis(MV.kisi(g.verildi.eden).ad)) + "</span></span>";
    } },
    { k: "alindi", baslik: "Geri alındı", kart: "govde", sira: 3, hucre: function (g) {
      return '<span class="a-kart-etiket">Geri alındı</span>' + (g.alindi ? '<span><span class="a-tarih-saat">' + MK.tarihYaz(g.alindi.tarih) + '</span><span class="a-alt-satir">' + kacis(yer(g.alindi.alan)) + "</span></span>"
        : rozet({ ad: "Hâlâ kişide", rozet: "a-rozet-tamam" }));
    } },
    { k: "not", baslik: "Not", kart: "govde", sira: 4, hucre: function (g) {
      var n = (g.alindi && g.alindi.not) || g.verildi.not;
      return '<span class="a-kart-etiket">Not</span>' + (n ? kirp(n) : '<span class="a-deger-yok">—</span>');
    } }
  ];
  var FORM_SUTUN = [
    { k: "varlik", baslik: "Form", kart: "ust", sira: 1, hucre: function (f) { return '<a class="a-no" href="#/p/' + f.kisi + "/zimmet-imzali/" + f.no + '">' + f.no + "</a>"; } },
    { k: "verildi", baslik: "Tarih", kart: "govde", sira: 2, hucre: function (f) { return '<span class="a-kart-etiket">Tarih</span><span class="a-tarih-saat">' + MK.tarihYaz(f.tarih) + "</span>"; } },
    { k: "alindi", baslik: "Kapsam", kart: "govde", sira: 3, hucre: function (f) { return '<span class="a-kart-etiket">Kapsam</span>' + f.kapsam.length + " varlık"; } },
    { k: "not", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (f) {
      return '<div class="a-eylem"><div class="a-eylem-tuslar"><a class="a-tus a-tus-ikincil" href="#/p/' + f.kisi + "/zimmet-imzali/" + f.no + '">' + ikon("file-check", "a-ikon-kucuk") + "Aç</a></div></div>";
    } }
  ];
  function zimmetGecmisiCiz(p) {
    var g = MV.zimmetGecmisi(p.id), formlar = (MV.ZIMMET_FORMLARI[p.id] || []).map(function (f) { return Object.assign({ kisi: p.id }, f); });
    var kiside = g.filter(function (x) { return !x.alindi; }).length;
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad, "#/p/" + p.id], ["Zimmet geçmişi"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">Zimmet geçmişi</h1></div>' +
        '<p class="a-nesne-alt">' + ikon("user", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " · " + g.length + " teslim · " + kiside + " varlık hâlâ kişide</span></p></div></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-zg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zg">Verilenler ve geri alınanlar</h2><span class="a-sayac">yeniden eskiye</span></div>' +
        (g.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Zimmet geçmişi", sinif: "a-tablo-zgecmis", sutunlar: GECMIS_SUTUN, kayitlar: g }) + "</div>"
          : '<p class="a-bos-satir">Bu kişiye hiç varlık teslim edilmemiş.</p>') + "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-zf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zf">İmzalı zimmet formları</h2><span class="a-sayac"><b>' + formlar.length + "</b> form</span></div>" +
        (formlar.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "İmzalı zimmet formları", sinif: "a-tablo-zgecmis", sutunlar: FORM_SUTUN, kayitlar: formlar }) + "</div>"
          : '<p class="a-bos-satir">Yüklenmiş imzalı form yok.</p>') + "</section>";
  }

  function kartCiz(p) {
    if (!p) {
      $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Kişi bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Kişi bulunamadı", metin: "Bu adresteki personel kaydı yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Personele dön</a>" });
      return;
    }
    var m = MV.meslek(p.meslek), e = MV.eksikBilgi(p), yok = '<span class="a-deger-yok">—</span>';
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(DURUM[p.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("id-card", "a-ikon-kucuk") + "<span>" + kacis(MV.meslekAd(p)) + (m.b ? " · " + MV.bransAd(m.b) : "") + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-birincil" href="#/p/' + p.id + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a></div></div>" +
      yuzler(p) +
      (e.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Eksik bilgi: " + kacis(e.join(" · ")) + ". Plan kabulünde uyarı olarak görünür; kabul engellenmez.") + "</div>" : "") +
      '<section class="a-bolum" aria-labelledby="a-b-kimlik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kimlik">Kimlik ve sicil</h2></div><dl class="a-bilgi">' +
        bilgi("Meslek", kacis(MV.meslekAd(p))) + bilgi("Branş", MV.bransAd(m.b)) +
        bilgi("Diploma no", p.diploma ? '<span class="a-kod">' + p.diploma + "</span>" : yok) +
        bilgi("Oda sicil no", p.oda ? '<span class="a-kod">' + p.oda + "</span>" : yok) +
        bilgi("EKİPNET kayıt no", p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : inspector(p) ? '<span class="a-yuz-uyari">Boş</span>' : yok) +
        bilgi("E-posta", p.eposta ? kacis(p.eposta) : yok, true) +
        bilgi("İşe başlama", MK.tarihYaz(p.basla)) + (p.durum === "ayrildi" ? bilgi("Ayrılış", MK.tarihYaz(p.ayrildi)) : "") +
      "</dl></section>" +
      hesapHtml(p) + zimmetHtml(p) + ozlukHtml(p);
  }

  /* ── GİRİŞ HESABI PENCERESİ: hesap aç (e-posta + roller) · yeni geçici parola · parola bir kez gösterilir (34) ─────────── */
  var W = null, sayac = 0;
  function parolaUret(p) {   /* maket: kişiye ve sıraya bağlı sabit, tahmin edilemez görünümlü 13 karakter (harf + rakam) */
    var A = "ABCDEFGHJKMNPRSTUVYZ", a = "abcdefghjkmnprstuvyz", d = "23456789", h = 7, s = p.id + ":" + (++sayac), c = "";
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var al = function (k) { h = (h * 1103515245 + 12345) >>> 0; return k.charAt(h % k.length); };
    [[A, a, d, a], [A, d, a, a], [d, A, a, d]].forEach(function (g, j) { c += (j ? "-" : "") + g.map(al).join(""); });
    return c;
  }
  function hesapPencereCiz(odak) {
    var p = MV.kisi(W.kisi), govde, alt;
    if (W.mod === "parola") {
      $("a-hesap-baslik").textContent = W.yeni ? "Giriş hesabı açıldı" : "Yeni geçici parola";
      govde = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · " + kacis(p.eposta) + "</p>" +
        '<p class="a-etiket">Geçici parola</p><p class="a-gecici-parola" id="h-parola"><span class="a-kod">' + W.parola + "</span></p>" +
        MK.serit("uyari", "triangle-alert", "Bu parola yalnız şimdi gösterilir; kişiye siz iletin. Kişi ilk girişten sonra parolasını değiştirebilir. Unutulursa yeni geçici parola verilir.");
      alt = MK.tus({ eylem: "parola-kopyala", ad: "Kopyala", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kapat", ad: "Tamam", ikon: "check" });
    } else if (W.mod === "yeni") {
      $("a-hesap-baslik").textContent = "Yeni geçici parola";
      govde = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · " + kacis(p.eposta) + "</p>" +
        '<p class="a-bolum-aciklama">Yeni geçici parola oluşunca eski parola geçersiz olur ve açık oturumlar kapanır. Parola bir kez gösterilir.</p>';
      alt = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "parola-olustur", ad: "Parola oluştur", ikon: "key-round" });
    } else {
      var eg = epostaGecerli(W.eposta), hazir = eg && W.roller.length;
      $("a-hesap-baslik").textContent = "Giriş hesabı aç";
      govde = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · " + kacis(MV.meslekAd(p)) + "</p>" +
        '<div class="a-form">' +
        MK.alan({ id: "h-eposta", etiket: "Giriş e-postası", zorunlu: true, genis: true, hata: W.eposta && !eg ? "E-posta biçimi geçersiz." : "",
          ipucu: "Kişi bu adresle girer.", girdi: '<input class="a-girdi a-girdi-eposta" id="h-eposta" type="email" inputmode="email" autocomplete="off" maxlength="120" value="' + kacis(W.eposta) + '"' +
            (W.eposta && !eg ? ' aria-invalid="true"' : "") + ' aria-describedby="h-eposta-ipucu">' }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Roller <span class="a-zorunlu">en az bir</span></p>' + rolListesi(W.roller, "data-hrol", false, p) + "</div></div>";
      alt = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "hesap-onayla", ad: "Hesabı aç ve parola oluştur", ikon: "key-round", kapali: !hazir });
    }
    $("a-hesap-govde").innerHTML = govde; $("a-hesap-alt").innerHTML = alt;
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function hesapPencereAc(p) {
    W = { kisi: p.id, mod: p.hesap ? "yeni" : "ac", eposta: p.eposta || "", roller: [] };
    hesapPencereCiz();
    if (!$("a-hesap-pencere").open) $("a-hesap-pencere").showModal();
    var ilk = $("h-eposta") || $("a-hesap-alt").querySelector(".a-tus-birincil"); if (ilk) ilk.focus();
  }

  /* ── ÖZLÜK BELGESİ PENCERESİ ───────────────────────────────────────────────────────────────────────── */
  var B = null;
  function belgeCiz(odak) {
    var p = MV.kisi(B.kisi);
    $("a-belge-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · özlük dosyası</p>" + '<div class="a-form">' +
      MK.alan({ id: "b-tur", etiket: "Belge", zorunlu: true, genis: true, girdi: MK.secim({ id: "b-tur", ad: "Belge", deger: B.tur, secenekler: BELGE_TUR, ipucu: "Belge seçin" }) }) +
      MK.alan({ id: "b-aciklama", etiket: "Açıklama", genis: true, ipucu: "İsteğe bağlı (ör. yenileme tarihi).", girdi: MK.girdi({ id: "b-aciklama", deger: B.aciklama, ek: ' maxlength="80"' }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Dosya <span class="a-zorunlu">zorunlu</span></p>' +
        '<div class="a-dosya-sec">' + MK.tus({ eylem: "dosya-sec", ad: B.dosya ? "Başka dosya seç" : "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
        '<span class="a-dosya-ad" id="b-dosya">' + (B.dosya ? kacis(B.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
        '<p class="a-ipucu">PDF ya da fotoğraf; yalnız firma içinde açılır.</p></div></div>';
    $("a-belge-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "belge-kaydet", ad: "Ekle", ikon: "check", kapali: !(B.tur && B.dosya) });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function belgeAc(p) {
    B = { kisi: p.id, tur: "", aciklama: "", dosya: "" };
    belgeCiz(); if (!$("a-belge-pencere").open) $("a-belge-pencere").showModal();
    $("b-tur").focus();
  }

  /* ── FORM (kalıp 10: bölümler kolon; kalıp 3: alan veri tipine göre; kalıp 19: seçim alanı; kalıp 2: tuşlar sağda) ──
     39: zorunlu yalnız ad, işe başlama, meslek; mesleki numaralar boş kalabilir (kartta uyarı olur). */
  var F = null;
  function formAc(p) {
    F = p ? { id: p.id, ad: p.ad, eposta: p.eposta, basla: p.basla.split("-").reverse().join("."), meslek: p.meslek, meslekMetin: p.meslekMetin || "", diploma: p.diploma, oda: p.oda, ekipnet: p.ekipnet, hata: {} }
      : { id: null, ad: "", eposta: "", basla: "", meslek: "", meslekMetin: "", diploma: "", oda: "", ekipnet: "", hata: {} };
  }
  function alan(id, etiket, girdi, ipucu, zorunlu, genis) { return MK.alan({ id: "f-" + id, etiket: etiket, girdi: girdi, ipucu: ipucu, hata: F.hata[id], zorunlu: zorunlu, genis: genis }); }
  function girdi(id, sinif, deger, ek) { return MK.girdi({ id: "f-" + id, alan: id, deger: deger, sinif: sinif, ek: ek, hata: F.hata[id] }); }
  function formCiz(odak) {
    var p = F.id ? MV.kisi(F.id) : null, m = F.meslek ? MV.meslek(F.meslek) : null;
    var baslik = p ? p.ad + " · düzenle" : "Yeni personel";
    var meslekSec = MV.MESLEKLER.map(function (x) { return [x.k, x.ad, MV.bransAd(x.b)]; });
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
          (m && !m.g.length ? MK.serit("uyari", "triangle-alert", "Bu meslek yetkili kişi meslekleri arasında değil: inspector rolü verilirse kartta uyarı görünür.") : "") +
          '<div class="a-form">' +
          alan("meslek", "Meslek", MK.secim({ id: "f-meslek", ad: "Meslek", deger: F.meslek, secenekler: meslekSec, ipucu: "Meslek seçin", gecersiz: !!F.hata.meslek, tanim: "f-meslek-ipucu" }), "", true, true) +
          (F.meslek === "diger" ? alan("meslekMetin", "Meslek adı", girdi("meslekMetin", "", F.meslekMetin, ' maxlength="60"'), "", true, true) : "") +
          alan("brans", "Branş", '<input class="a-girdi a-girdi-oku a-girdi-sicil" id="f-brans" readonly value="' + (m ? MV.bransAd(m.b) : "—") + '" aria-describedby="f-brans-ipucu">', "Meslekten gelir.", false) +
          alan("diploma", "Diploma no", girdi("diploma", "a-girdi-sicil", F.diploma, ' maxlength="20"'), "", false) +
          alan("oda", "Oda sicil no", girdi("oda", "a-girdi-sicil", F.oda, ' maxlength="20" inputmode="numeric"'), "", false) +
          alan("ekipnet", "EKİPNET kayıt no", girdi("ekipnet", "a-girdi-sicil", F.ekipnet, ' maxlength="20" inputmode="numeric"'), "Inspector'da boşsa uyarı görünür.", false) +
        "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b4"><h2 id="f-b4">Giriş hesabı</h2>' +
          '<p class="a-bolum-aciklama">' + (p && p.hesap ? "Hesap var: " + p.hesap.roller.map(function (r) { return MV.rol(r).ad; }).join(", ") + ". Roller ve parola kişinin kartında değişir."
            : p ? "Bu kişinin giriş hesabı yok; kartındaki “Giriş hesabı aç” geçici parola verir." : "Kaydettikten sonra kişinin kartındaki “Giriş hesabı aç” geçici parola verir.") + "</p>" +
        "</section>" +
      "</div>" +
      '<div class="a-form-eylem"><p class="a-adim-not">Zorunlu alanlar işaretli.</p>' +
        '<a class="a-tus a-tus-ikincil" href="' + (p ? "#/p/" + p.id : "#/") + '">Vazgeç</a>' +
        MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function denetle() {
    var h = {};
    if (F.ad.trim().split(/\s+/).length < 2) h.ad = "Ad ve soyad yazılmalı.";
    if (F.eposta && !epostaGecerli(F.eposta)) h.eposta = "E-posta biçimi geçersiz.";
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(F.basla)) h.basla = "Tarih GG.AA.YYYY biçiminde olmalı.";
    if (!F.meslek) h.meslek = "Meslek seçilmeli.";
    if (F.meslek === "diger" && !F.meslekMetin.trim()) h.meslekMetin = "Meslek adı yazılmalı.";
    return h;
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/roller") return { v: "roller" };
    if (h === "#/yeni") return { v: "form" };
    if ((m = /^#\/p\/([a-z0-9]+)\/duzenle$/.exec(h))) return { v: "form", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-formu$/.exec(h))) return { v: "zform", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-gecmisi$/.exec(h))) return { v: "zgecmis", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-imzali\/([A-Z0-9-]+)$/.exec(h))) return { v: "zimzali", id: m[1], no: m[2] };
    if ((m = /^#\/p\/([a-z0-9]+)\/(hesap|belge)$/.exec(h))) return { v: "kart", id: m[1], pencere: m[2] };
    if ((m = /^#\/p\/([a-z0-9]+)$/.exec(h))) return { v: "kart", id: m[1] };
    return { v: "liste" };
  }
  var sonKisi = null;
  function goster(odakla) {
    var r = rota(), p = r.id ? MV.kisi(r.id) : null;
    if (r.v !== "kart" || sonKisi !== r.id) SECILI = null;
    if (r.v !== "roller") { R.duzen = false; R.taslak = null; }
    sonKisi = r.id || null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-roller-gorunum").hidden = r.v !== "roller";
    $("a-nesne").hidden = ["kart", "zform", "zgecmis", "zimzali"].indexOf(r.v) < 0; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") listeCiz();
    else if (r.v === "roller") rollerCiz();
    else if (r.v === "kart") kartCiz(p);
    else if (r.v === "zform") { if (p) zimmetFormuCiz(p); else kartCiz(null); }
    else if (r.v === "zgecmis") { if (p) zimmetGecmisiCiz(p); else kartCiz(null); }
    else if (r.v === "zimzali") { if (p) imzaliFormCiz(p, r.no); else kartCiz(null); }
    else { if (!F || F.id !== (r.id || null) || odakla) formAc(p); formCiz(); }
    document.title = (r.v === "liste" ? "Personel" : r.v === "roller" ? "Rol yetkileri" : r.v === "kart" ? (p ? p.ad : "Kişi bulunamadı") : r.v === "zform" ? (p ? p.ad + " · zimmet formu" : "Kişi bulunamadı") : r.v === "zgecmis" ? (p ? p.ad + " · zimmet geçmişi" : "Kişi bulunamadı") :
      r.v === "zimzali" ? (p ? p.ad + " · imzalı zimmet formu" : "Kişi bulunamadı") : (p ? p.ad + " · düzenle" : "Yeni personel")) + " · probata maket";
    if (odakla && !r.pencere) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere === "hesap" && p) { if (!$("a-hesap-pencere").open) hesapPencereAc(p); } else if ($("a-hesap-pencere").open) $("a-hesap-pencere").close();
    if (r.pencere === "belge" && p) { if (!$("a-belge-pencere").open) belgeAc(p); } else if ($("a-belge-pencere").open) $("a-belge-pencere").close();
  }
  MK.goster = goster;

  var X = MK.eylem, aktif = function () { return MV.kisi(rota().id); };
  var bolumeGit = function (id) { var h = $(id); if (h) { h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); } };
  X["hesaba-git"] = function () { bolumeGit("a-b-hesap"); };
  X["zform-yukle"] = function () {   /* maket: dosya seçimi yerine örnek dosya; formdaki varlıklar kapsam olarak saklanır */
    var p = aktif();
    (MV.ZIMMET_FORMLARI[p.id] = MV.ZIMMET_FORMLARI[p.id] || []).unshift({ no: formNo(p), tarih: MK.BUGUN, kapsam: zimmetleri(p).map(function (v) { return v.id; }), dosya: "zimmet-formu-imzali.pdf" });
    location.hash = "#/p/" + p.id; MK.bildir("İmzalı zimmet formu yüklendi (" + formNo(p) + ")."); setTimeout(function () { bolumeGit("a-b-zimmet"); }, 0);
  };
  X["zimmete-git"] = function () { bolumeGit("a-b-zimmet"); };
  X["hesap-ac"] = function () { location.hash = "#/p/" + aktif().id + "/hesap"; };
  X["belge-ekle"] = function () { location.hash = "#/p/" + aktif().id + "/belge"; };
  X["rol-kaydet"] = function () { var p = aktif(); p.hesap.roller = SECILI.slice(); SECILI = null; kartCiz(p); bolumeGit("a-b-hesap"); MK.bildir("Roller kaydedildi; yeni yetkiler hemen geçerli."); };
  X["rol-geri"] = function () { SECILI = null; kartCiz(aktif()); bolumeGit("a-b-hesap"); };
  X["hesap-kapat"] = function () { var p = aktif(); p.hesap.durum = "pasif"; SECILI = null; kartCiz(p); bolumeGit("a-b-hesap"); MK.bildir(p.ad + ": hesap kapatıldı, açık oturumları sonlandı."); };
  X["hesap-yeniden"] = function () { var p = aktif(); p.hesap.durum = "etkin"; kartCiz(p); bolumeGit("a-b-hesap"); MK.bildir(p.ad + ": hesap yeniden açıldı. Parolasını hatırlamıyorsa yeni geçici parola verin."); };
  X["hesap-onayla"] = function () {
    var p = MV.kisi(W.kisi); if (!epostaGecerli(W.eposta) || !W.roller.length) return;
    p.eposta = W.eposta; p.hesap = { durum: "ilk", roller: W.roller.slice(), verildi: MK.simdi() };
    W.parola = parolaUret(p); W.mod = "parola"; W.yeni = true; hesapPencereCiz(); $("a-hesap-alt").querySelector(".a-tus-birincil").focus();
  };
  X["parola-olustur"] = function () {
    var p = MV.kisi(W.kisi); p.hesap.durum = "ilk"; p.hesap.verildi = MK.simdi();
    W.parola = parolaUret(p); W.mod = "parola"; W.yeni = false; hesapPencereCiz(); $("a-hesap-alt").querySelector(".a-tus-birincil").focus();
  };
  X["parola-kopyala"] = function () {
    try { navigator.clipboard.writeText(W.parola); } catch (x) {}
    MK.bildir("Geçici parola panoya kopyalandı.");
  };
  X["dosya-sec"] = function () { B.dosya = B.tur ? B.tur + "-" + MK.BUGUN + ".pdf" : "belge-" + MK.BUGUN + ".pdf"; belgeCiz(); $("a-belge-alt").querySelector(".a-tus-birincil").focus(); };
  X["belge-kaydet"] = function () {
    var p = MV.kisi(B.kisi); if (!B.tur || !B.dosya) return;
    ozluk(p).push({ tur: B.tur, aciklama: B.aciklama.trim(), tarih: MK.BUGUN, dosya: B.dosya });
    $("a-belge-pencere").close(); MK.bildir(belgeAd(B.tur) + " özlük dosyasına eklendi.");
  };
  X["rol-duzenle"] = function () { R.duzen = true; R.taslak = kopya(MV.MATRIS); rollerCiz(); var s = document.querySelector("#a-roller .a-secim-tus"); if (s) s.focus(); };
  X["matris-vazgec"] = function () { R.duzen = false; R.taslak = null; rollerCiz(); $("a-roller-bas").querySelector(".a-tus").focus(); };
  X["matris-oneri"] = function () { R.taslak = kopya(MV.MATRIS_ONERI); rollerCiz(); MK.bildir("Önerilen düzen yüklendi; kaydedince geçerli olur."); };
  X["matris-kaydet"] = function () {
    var n = degisenSayi(); MV.MATRIS = R.taslak; R.duzen = false; R.taslak = null; rollerCiz(); $("a-roller-bas").querySelector(".a-tus").focus();
    MK.bildir("Rol yetkileri kaydedildi (" + n + " değişiklik); o rollerdeki kişiler için hemen geçerli.");
  };
  MK.onSecim = function (id, deger) {
    var m;
    if (id === "f-meslek") { F.meslek = deger; delete F.hata.meslek; formCiz(); }
    else if (id === "b-tur") { B.tur = deger; belgeCiz(); }
    else if ((m = /^m-(\w+)-(\d)$/.exec(id))) { R.taslak[m[1]][+m[2]] = deger; rollerCiz(); }
  };
  MK.onGirdi = function (e) {
    var t = e.target, k = t.dataset && t.dataset.alan;
    if (k) { F[k] = t.value; return; }
    if (t.id === "h-eposta") { W.eposta = t.value.trim(); var yer = t.selectionStart; hesapPencereCiz("h-eposta"); $("h-eposta").setSelectionRange(yer, yer); }
    else if (t.id === "b-aciklama") B.aciklama = t.value;
  };
  document.addEventListener("change", function (e) {
    var t = e.target, r;
    if ((r = t.dataset && t.dataset.rol)) {
      var p = aktif(); SECILI = (SECILI || p.hesap.roller).slice();
      var i = SECILI.indexOf(r); if (t.checked && i < 0) SECILI.push(r); else if (!t.checked && i >= 0) SECILI.splice(i, 1);
      SECILI = MV.ROLLER.map(function (x) { return x.k; }).filter(function (k) { return SECILI.indexOf(k) >= 0; });
      kartCiz(p); var g = document.querySelector('[data-rol="' + r + '"]'); if (g) g.focus();
    } else if ((r = t.dataset && t.dataset.hrol)) {
      var j = W.roller.indexOf(r); if (t.checked && j < 0) W.roller.push(r); else if (!t.checked && j >= 0) W.roller.splice(j, 1);
      W.roller = MV.ROLLER.map(function (x) { return x.k; }).filter(function (k) { return W.roller.indexOf(k) >= 0; });
      hesapPencereCiz(); var d = document.querySelector('[data-hrol="' + r + '"]'); if (d) d.focus();
    }
  });
  MK.eylem.kaydet = function () {
    F.hata = denetle();
    var hatalar = Object.keys(F.hata);
    if (hatalar.length) { formCiz(); var ilk = $("f-" + hatalar[0]); if (ilk) ilk.focus(); return; }
    var kayit = { ad: F.ad.trim(), eposta: F.eposta.trim(), basla: F.basla.split(".").reverse().join("-"), meslek: F.meslek, meslekMetin: F.meslekMetin.trim(),
      diploma: F.diploma.trim(), oda: F.oda.trim(), ekipnet: F.ekipnet.trim() };
    var p = F.id ? MV.kisi(F.id) : null;
    if (p) Object.assign(p, kayit);
    else { p = Object.assign({ id: "y" + P.length, durum: "etkin", hesap: null, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } }, kayit); P.push(p); }
    F = null; location.hash = "#/p/" + p.id;
    MK.bildir(kayit.ad + " kaydedildi.");
  };
  /* pencere kapanınca adres karta döner, kart yeni hâli gösterir (açılan hesap, eklenen belge) */
  ["a-hesap-pencere", "a-belge-pencere"].forEach(function (id) {
    $(id).addEventListener("close", function () {
      var r = rota(); if (!r.pencere) return;
      history.replaceState(null, "", "#/p/" + r.id); kartCiz(MV.kisi(r.id));
      bolumeGit(id === "a-hesap-pencere" ? "a-b-hesap" : "a-b-ozluk");
    });
  });

  MK.kabuk({ modul: 2, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("p");
  MK.seciciCiz("p"); goster(false);
})();
