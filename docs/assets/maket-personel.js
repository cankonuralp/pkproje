/* ══ probata MAKET M1 — Personel (modül 1 + 2) · 2. TUR, ONAYLANDI (2026-09-25) ═════════════════════════════════
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
      { k: "inspector", ad: "Denetçi", test: inspector },
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
      MK.serit("bilgi", "circle-alert", oneri ? "Önerilen başlangıç düzeni" : "Firmanın kendi düzeni") +
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
      yuz({ ikon: "scroll-text", ad: "İSG-KATİP kaydı", sayi: MV.ISG.filter(function (x) { return x.k === p.id && !x.onceki; }).length, modul: "Sözleşmeler · İSG-KATİP", href: sayfa(12) && sayfa(12) + "#/isg?kisi=" + p.id }) +
      yuz({ ikon: "package", ad: "Zimmetinde", sayi: z.length, eylem: "zimmete-git" }) +
      (inspector(p) ? yuz({ ikon: "file-check", ad: "Ekipman ataması", sayi: MV.atamalari(p.id).length, eylem: "atamaya-git", not: MV.atamalari(p.id).length ? "tür" : "atama yok", uyari: !MV.atamalari(p.id).length }) : "") +
      /* eğitim sayıları eğitim kayıtlarından (M10/M16); tekrarı geçen ayrıca söylenir */
      (function () { var eg = MV.egitimleri(p.id), gecti = eg.filter(function (x) { return MV.egitimDurum(x) === "gecti"; }).length, yakin = eg.filter(function (x) { return MV.egitimDurum(x) === "yakin"; }).length;
        return yuz({ ikon: "graduation-cap", ad: "Eğitim", sayi: eg.length, eylem: "egitime-git",
          not: gecti ? gecti + " tekrarı geçti" : yakin ? yakin + " tekrarı " + MV.esik("egitim") + " gün içinde" : "tekrarı yakın yok", uyari: gecti + yakin > 0 }); })() +
      (inspector(p) ? yuz({ ikon: "calendar-check", ad: "Açık plan", sayi: s.plan, href: "planlarim.html" }) : "") +
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
      '<p class="a-bolum-aciklama">Giriş hesabı yok.</p>' +
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
      (pasif ? '<div class="a-bolum-serit">' + MK.serit("bilgi", "ban", "Hesap kapalı: giriş yapamaz.") + "</div>" : "") +
      '<p class="a-etiket a-etiket-ust">Roller</p>' + rolListesi(sec, "data-rol", pasif, p) +
      /* bölüm içi çubuk: telefonda yapışkan DEĞİL (form sayfası çubuğu değil; ölçüm 2026-09-25: rol satırlarının üstüne biniyordu) */
      (pasif ? "" : '<div class="a-bolum-eylem"><p class="a-adim-not">' + (degisti ? "Kaydedilmemiş değişiklik var." : "") + "</p>" +
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
      return k === "gecti" ? rozet({ ad: "Kalibrasyonu geçti", rozet: "a-rozet-red" }) : k === "yakin" ? rozet({ ad: "Kalibrasyon " + MV.esik("kal") + " gün içinde", rozet: "a-rozet-bekliyor" })
        : rozet({ ad: "Kullanımda", rozet: "a-rozet-tamam" });
    } }
  ];
  /* imzalı zimmet teslim formu (reisim 2026-09-25): PDF çıkar → imzalanır → taranır → buraya yüklenir. Zimmet değişince form eskir. */
  /* reisim 2026-09-25: "imzalı zimmet formuna tıklayınca açılmalı, sadece yüklü olduğu bilgisi yeterli değil" → şeridin yanında "Aç" */
  function zimmetFormuDurum(p, z) {
    var f = MV.zimmetFormu(p.id), guncel = MV.zimmetFormuGuncel(p.id, z.map(function (v) { return v.id; }));
    var ac = f ? '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + "/zimmet-imzali/" + f.no + '">' + ikon("file-check", "a-ikon-kucuk") + "İmzalı formu aç</a>" : "";
    if (!z.length && !f) return "";
    var yol = MV.imzaYontem().kisa;   /* 2026-09-29 (V3): firmanın yöntemiyle imzalanır; ıslak imzalı tarama yedek yol */
    if (f && guncel) return MK.serit("onay", "file-check", "İmzalı zimmet formu: <b>" + f.no + "</b> · " + MK.tarihYaz(f.tarih) + " · " + f.kapsam.length + " varlık" + (f.imza ? " · " + MV.IMZA_YONTEM[f.imza.yontem].kisa : "") + ".") + ac;
    if (f) return MK.serit("uyari", "triangle-alert", "İmzalı form (" + f.no + ", " + MK.tarihYaz(f.tarih) + ") eskidi: zimmet o tarihten sonra değişti. Yeni formu " + yol + " ile imzalayın ya da ıslak imzalı taramasını yükleyin.") + ac;
    return MK.serit("uyari", "triangle-alert", "İmzalı zimmet formu yok. Formu " + yol + " ile imzalayın ya da ıslak imzalı taramasını yükleyin.");
  }
  /* EĞİTİMLER (2026-09-28, T10; reisim: "her personelin kartında eğitimler de gözükmeli"): kişinin güncel eğitim kayıtları — tekrarı
     geçen ve yaklaşan üstte; kayıt Eğitimler'de açılır, sertifika buradan açılır. Kayıt ekleme ve geçmiş Eğitimler'de (Dökümanlar içinde). */
  var EGITIM_SUTUN = [
    { k: "egitim", baslik: "Eğitim", kart: "ust", sira: 1, hucre: function (x) { return '<span><a class="a-ad-bag" href="' + MK.adres(10, "#/k/" + x.id) + '">' + kacis(MV.egitimTuru(x.k).ad) + "</a>" + kirp(x.kurum, "a-alt-satir") + "</span>"; } },
    { k: "tarih", baslik: "Alındı", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Alındı</span>' + MK.tarihYaz(x.tarih); } },
    { k: "tekrar", baslik: "Tekrar", kart: "govde", sira: 3, hucre: function (x) {
      var k = MK.gunFarki(MK.BUGUN, x.tekrar), d = MV.egitimDurum(x);
      return '<span class="a-kart-etiket">Tekrar</span><span><span class="a-tarih-gun">' + MK.tarihYaz(x.tekrar) + '</span><span class="' + (d === "gecerli" ? "a-tarih-saat" : "a-uyari-metin") + '">' + (k < 0 ? -k + " gün geçti" : k + " gün kaldı") + "</span></span>";
    } },
    { k: "belge", baslik: "Sertifika", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Sertifika</span>' + (x.belge ? MK.pdfTus(MV.egitimBelgeAdi(x), "Aç") : '<span class="a-uyari-metin">Yok</span>'); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(MV.EGITIM_DURUM[MV.egitimDurum(x)]); } }
  ];
  var EGITIM_SIRA = { gecti: 0, yakin: 1, gecerli: 2 };
  function egitimHtml(p) {
    var l = MV.egitimleri(p.id).filter(function (x) { return !x.onceki; }).sort(function (a, b) { return EGITIM_SIRA[MV.egitimDurum(a)] - EGITIM_SIRA[MV.egitimDurum(b)] || (a.tekrar < b.tekrar ? -1 : 1); });
    var ek = sayfa(10);
    return '<section class="a-bolum" aria-labelledby="a-b-egitim"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-egitim" tabindex="-1">Eğitimler</h2>' +
        '<span class="a-sayac"><b>' + l.length + "</b> eğitim</span>" +
        (ek ? '<div class="a-eylem-cubugu a-bolum-tus"><a class="a-tus a-tus-ikincil" href="' + ek + "#/?kisi=" + p.id + '">' + ikon("history", "a-ikon-kucuk") + "Eğitim geçmişi</a>" +
          '<a class="a-tus a-tus-ikincil" href="' + ek + "#/yeni?kisi=" + p.id + '">' + ikon("plus", "a-ikon-kucuk") + "Eğitim ekle</a></div>" : "") + "</div>" +
      (l.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Eğitimler", sinif: "a-tablo-kegitim", sutunlar: EGITIM_SUTUN, kayitlar: l }) + "</div>"
        : '<p class="a-bos-satir">Eğitim kaydı yok.</p>') + "</section>";
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

  /* EKİPMAN ATAMALARI (L4, 2026-09-30): denetçinin atandığı ekipman türleri + atama belgesi; belge görüntülenir, iner, değiştirilir; atama
     kaldırılır. Atanmadığı türde plan ve rapor yalnız uyarı. Yalnız denetçi rolündeki kişide. */
  var ATAMA_SUTUN = [
    { k: "tur", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: function (a) { var t = MV.tur(a.tur); return "<span>" + kirp(t.ad) + '<span class="a-alt-satir">' + MV.bransAd(t.b) + "</span></span>"; } },
    { k: "tarih", baslik: "Atama tarihi", kart: "govde", sira: 2, hucre: function (a) { return '<span class="a-kart-etiket">Atama tarihi</span><span class="a-tarih-saat">' + MK.tarihYaz(a.tarih) + "</span>"; } },
    { k: "belge", baslik: "Atama belgesi", kart: "govde", sira: 3, hucre: function (a) { return '<span class="a-kart-etiket">Atama belgesi</span><span class="a-dosya-ad">' + ikon("file-text", "a-ikon-kucuk") + kacis(a.dosya) + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (a) {
      var ad = MV.tur(a.tur).ad;
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.pdfTus(a.dosya, "Görüntüle") +
        '<button class="a-tus a-tus-ikincil" type="button" data-eylem="dosya-indir" data-dosya="' + kacis(a.dosya) + '" aria-label="' + kacis(ad) + ' atama belgesini indir">' + ikon("download", "a-ikon-kucuk") + "İndir</button>" +
        MK.tus({ eylem: "atama-degistir", ad: "Değiştir", ikon: "upload", sinif: "a-tus-ikincil", veri: { id: a.id } }) +
        '<button class="a-ikon-tus" type="button" data-eylem="atama-sil" data-id="' + a.id + '" aria-label="' + kacis(ad) + ' atamasını kaldır" title="Atamayı kaldır">' + ikon("x") + "</button></div></div>";
    } }
  ];
  function atamaHtml(p) {
    if (!inspector(p)) return "";
    var l = MV.atamalari(p.id).slice().sort(function (a, b) { var x = MV.tur(a.tur), y = MV.tur(b.tur); return x.b === y.b ? x.ad.localeCompare(y.ad, "tr") : x.b === "m" ? -1 : 1; });
    return '<section class="a-bolum" aria-labelledby="a-b-atama"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-atama" tabindex="-1">Ekipman atamaları</h2>' +
        '<span class="a-sayac"><b>' + l.length + "</b> tür</span>" +
        (p.durum === "etkin" ? '<div class="a-eylem-cubugu a-bolum-tus">' + MK.tus({ eylem: "atama-ekle", ad: "Atama ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>" : "") + "</div>" +
      (l.length ? '<div class="a-liste-kap">' + MK.tablo({ baslik: "Ekipman atamaları", sinif: "a-tablo-atama", sutunlar: ATAMA_SUTUN, kayitlar: l }) + "</div>"
        : '<div class="a-bolum-serit">' + MK.serit("uyari", "triangle-alert", "Hiçbir ekipman türüne atanmamış. Plan ve rapor açılabilir; uyarı görünür.") + "</div>") + "</section>";
  }

  /* özlük dosyası (40): kişinin belgeleri; yalnız firma yöneticisi görür (KVKK: özlük bilgisi). Eğitim sertifikaları Eğitimler'de. */
  /* P3 (2026-10-01): tür listesi ve özlük dosyası ortak veride (müşteri panelinde izinli belgeler de buradan); Z5: firmanın eklediği türler dahil */
  var belgeAd = function (k) { return MV.ozlukTur().filter(function (x) { return x[0] === k; })[0][1]; };
  var ozluk = MV.ozluk;
  var OZLUK_SUTUN = [
    { k: "belge", baslik: "Belge", kart: "ust", sira: 1, hucre: function (b) {
      return '<span class="a-hucre-satir">' + ikon("file-check", "a-ikon-kucuk") + '<span class="a-hucre-metin">' + kirp(belgeAd(b.tur)) + (b.aciklama ? kirp(b.aciklama, "a-alt-satir") : "") + "</span></span>";
    } },
    { k: "tarih", baslik: "Eklendi", kart: "govde", sira: 2, hucre: function (b) { return '<span class="a-kart-etiket">Eklendi</span><span class="a-tarih-saat">' + MK.tarihYaz(b.tarih) + "</span>"; } },
    /* yüklenen belge açılır (reisim 2026-09-27: "eklenen herhangi bir pdf daha sonradan açılıp incelenebilir olsun") */
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (b) {
      /* 2026-09-28: belge değiştirilir, silinir (reisim: "yüklenilen şeyler düzenlenebilir silinebilir olmalı") */
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.dosyaAlan({ ad: b.dosya || b.tur + ".pdf", degistir: "ozluk-degistir", sil: "ozluk-sil", veri: { i: ozluk(aktif()).indexOf(b) } }) + "</div></div>";
    } }
  ];
  function ozlukHtml(p) {
    var l = ozluk(p);
    return '<section class="a-bolum" aria-labelledby="a-b-ozluk"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ozluk">Özlük dosyası</h2>' +
        '<span class="a-sayac"><b>' + l.length + "</b> belge</span>" +
        '<div class="a-eylem-cubugu a-bolum-tus">' + MK.tus({ eylem: "belge-ekle", ad: "Belge ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div></div>" +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Özlük dosyası", sinif: "a-tablo-ozluk", sutunlar: OZLUK_SUTUN, kayitlar: l }) + "</div></section>";
  }

  /* ── MAAŞ VE BORDROLAR (2026-09-27, reisim: "personel ekranında maaşlar ve bordrolarda olacak oraya yüklenebilecek bordrolar") ──
     aylık bordro PDF'i + tutarları; maaş satırları son bordrodan; günlük maliyet iş kârlılığına girer (Muhasebe). Firma yöneticisi ve Muhasebe
     rolü görür (reisim 2026-09-29, 35. tur 174). */
  var para = MV.para;
  var bordroOnay = function (b) { return MV.BELGE_ONAY.filter(function (x) { return x.tur === "bordro" && x.kisi === b.kisi && x.ay === b.ay; })[0]; };
  var BORDRO_SUTUN = [
    { k: "ay", baslik: "Dönem", kart: "ust", sira: 1, hucre: function (b) { return "<span>" + MV.ayAd(b.ay) + '<span class="a-alt-satir">yüklendi ' + MK.tarihYaz(b.yuklendi) + "</span></span>"; } },
    { k: "brut", baslik: "Brüt", kart: "govde", sira: 2, hucre: function (b) { return '<span class="a-kart-etiket">Brüt</span><span class="a-sayi">' + para(b.brut) + "</span>"; } },
    { k: "net", baslik: "Net", kart: "govde", sira: 3, hucre: function (b) { return '<span class="a-kart-etiket">Net</span><span class="a-sayi">' + para(b.net) + "</span>"; } },
    { k: "maliyet", baslik: "İşverene maliyet", kart: "govde", sira: 4, hucre: function (b) { return '<span class="a-kart-etiket">İşverene maliyet</span><span class="a-sayi">' + para(b.maliyet) + "</span>"; } },
    /* AA3 (2026-10-02): bordro çalışanın onayına / imzasına gönderilir (Onaylar › Diğer); durum burada */
    { k: "onay", baslik: "Onay", kart: "rozet", sira: 1, hucre: function (b) { var o = bordroOnay(b);
      return !o ? rozet({ ad: "Gönderilmedi", rozet: "a-rozet-notr" })
        : rozet(o.durum === "imzali" ? { ad: "İmzalandı", rozet: "a-rozet-tamam" } : o.durum === "geri" ? { ad: "Geri gönderildi", rozet: "a-rozet-red" } : { ad: "Onay bekliyor", rozet: "a-rozet-bekliyor" }); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (b) { return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.dosyaAlan({ ad: b.dosya, degistir: "bordro-degistir", sil: "bordro-sil", veri: { ay: b.ay } }) +
      (bordroOnay(b) ? "" : MK.tus({ eylem: "bordro-onaya", ad: "Onaya gönder", ikon: "send", sinif: "a-tus-ikincil", veri: { ay: b.ay } })) + "</div></div>"; } }
  ];
  function maasHtml(p) {
    var l = MV.kisiBordrolari(p.id), s = l[0];
    return '<section class="a-bolum" aria-labelledby="a-b-maas"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-maas">Maaş ve bordrolar</h2>' +
        '<span class="a-sayac"><b>' + l.length + "</b> bordro</span>" +
        '<div class="a-eylem-cubugu a-bolum-tus">' + MK.tus({ eylem: "bordro-ekle", ad: "Bordro yükle", ikon: "upload", sinif: "a-tus-ikincil" }) + "</div></div>" +
      (s ? '<dl class="a-bilgi">' + bilgi("Brüt maaş", para(s.brut)) + bilgi("Net maaş", para(s.net)) +
          bilgi("İşverene maliyet", para(s.maliyet) + '<span class="a-alt-satir">aylık · ' + MV.ayAd(s.ay) + " bordrosu</span>") +
          bilgi("Günlük maliyet", para(MV.gunlukMaliyet(p.id)) + '<span class="a-alt-satir">' + MV.IS_GUNU + " iş günü · iş kârlılığına girer</span>") + "</dl>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Bordrolar", sinif: "a-tablo-bordro", sutunlar: BORDRO_SUTUN, kayitlar: l }) + "</div>"
        : '<p class="a-bos-satir">Bordro yüklenmedi.</p>') + "</section>";
  }
  var BR = null;
  /* R1: firma ayarları taşınınca burada tek tanım; eskiden sayfanın sonundaki ikinci tanım geçerliydi (0–2 ondalık, "TL" eki okunur), aynısı */
  var tlOku = function (v) { var t = String(v).trim().replace(/\s*TL$/i, ""); return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : NaN; };
  var tlYaz = function (n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  var bordroAylari = function () { var l = [], d = new Date(MK.BUGUN.slice(0, 7) + "-01T12:00:00"); for (var i = 0; i < 12; i++) { l.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() - 1); } return l; };
  function bordroCiz(odak) {
    var p = MV.kisi(BR.kisi), h = BR.hata, var_ = MV.kisiBordrolari(p.id).some(function (b) { return b.ay === BR.ay; });
    $("a-bordro-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · " + kacis(MV.meslekAd(p)) + "</p>" + '<div class="a-form">' +
      MK.alan({ id: "r-ay", etiket: "Dönem", zorunlu: true, genis: true, uyari: var_ ? "Bu dönemin bordrosu var; yenisi onun yerine geçer." : "",
        girdi: MK.secim({ id: "r-ay", ad: "Dönem", deger: BR.ay, secenekler: bordroAylari().map(function (a) { return [a, MV.ayAd(a)]; }) }) }) +
      MK.alan({ id: "r-brut", etiket: "Brüt (TL)", zorunlu: true, hata: h.brut, girdi: MK.girdi({ id: "r-brut", deger: BR.brut, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.brut }) }) +
      MK.alan({ id: "r-net", etiket: "Net (TL)", zorunlu: true, hata: h.net, girdi: MK.girdi({ id: "r-net", deger: BR.net, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.net }) }) +
      MK.alan({ id: "r-maliyet", etiket: "İşverene maliyet (TL)", zorunlu: true, hata: h.maliyet, girdi: MK.girdi({ id: "r-maliyet", deger: BR.maliyet, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.maliyet }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Bordro dosyası <span class="a-zorunlu">zorunlu</span></p>' +
        '<div class="a-dosya-sec">' + (BR.dosya ? MK.dosyaAlan({ ad: BR.dosya, degistir: "bordro-dosya", sil: "bordro-dosya-kaldir" }) : MK.tus({ eylem: "bordro-dosya", ad: "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
        (h.dosya ? '<p class="a-ipucu a-ipucu-uyari">' + h.dosya + "</p>" : "") + "</div></div>";
    $("a-bordro-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "bordro-kaydet", ad: "Yükle", ikon: "upload" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function bordroAc(p) {
    var s = MV.kisiBordrolari(p.id)[0], ay = bordroAylari()[1];   /* varsayılan: geçen ay */
    BR = { kisi: p.id, ay: ay, brut: s ? tlYaz(s.brut) : "", net: s ? tlYaz(s.net) : "", maliyet: s ? tlYaz(s.maliyet) : "", dosya: "", hata: {} };
    bordroCiz(); if (!$("a-bordro-pencere").open) $("a-bordro-pencere").showModal(); $("r-ay").focus();
  }

  /* zimmet teslim formu görünümü: temel format önizlemesi (PDF'in iskeleti) + imzalı taramayı yükle */
  var formNo = function (p) { return "ZF-0926-" + ("00" + (15 + MV.PERSONEL.indexOf(p))).slice(-3); };
  /* teslim eden / teslim alan (2026-09-29, 196; reisim: "teslim eden teslim alan kısmı el ile girilebilsin, listeden personel girilebilsin"):
     her biri listeden personel ya da "Listede yok — elle yaz". Teslim edenin başlangıcı Firma ayarları'ndaki kişi (yoksa firma yöneticisi). */
  var ELLE = "elle";
  var varsayilanEden = function () { return MV.zimmetEden(); };   /* R1: tanım maket-veri.js'te (Firma ayarları da kullanır) */
  var teslimEden = function () { return MV.kisi(varsayilanEden()); };
  var ZF = null;   /* açık formun seçimleri: { kisi (kart), eden: { k, ad }, alan: { k, ad } } — k: personel id ya da "elle" */
  function zfDurum(p) { if (!ZF || ZF.kisi !== p.id) ZF = { kisi: p.id, eden: { k: varsayilanEden(), ad: "" }, alan: { k: p.id, ad: "" } }; return ZF; }
  var zfAd = function (x) { return x.k === ELLE ? x.ad.trim() : MV.kisi(x.k).ad; };
  var zfKisi = function (x) { return x.k === ELLE ? { ad: x.ad.trim() || "—", alt: "" } : { ad: MV.kisi(x.k).ad, alt: MV.meslekAd(MV.kisi(x.k)) }; };
  var personelSec = function () { return MV.PERSONEL.filter(function (x) { return x.durum === "etkin"; }).map(function (x) { return [x.id, x.ad, MV.meslekAd(x)]; }); };
  function zfAlan(rol, etiket, x) {
    return '<div class="a-alan-grup"><label class="a-etiket" for="zf-' + rol + '">' + etiket + "</label>" +
      MK.secim({ id: "zf-" + rol, ad: etiket, deger: x.k, secenekler: personelSec().concat([[ELLE, "Listede yok — elle yaz"]]), ipucu: "Seçin" }) +
      (x.k === ELLE ? '<input class="a-girdi a-zf-elle" id="zf-' + rol + '-ad" data-zf="' + rol + '" maxlength="80" autocomplete="off" aria-label="' + etiket + ' adı soyadı" placeholder="Ad soyad" value="' + kacis(x.ad) + '">' : "") + "</div>";
  }
  function zimmetFormuCiz(p) {
    var z = zimmetleri(p), guncel = MV.zimmetFormuGuncel(p.id, z.map(function (v) { return v.id; }));
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad, "#/p/" + p.id], ["Zimmet formu"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">Zimmet teslim formu</h1>' +
        (guncel ? rozet({ ad: "İmzalı", rozet: "a-rozet-tamam" }) : rozet({ ad: "İmza bekliyor", rozet: "a-rozet-bekliyor" })) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("user", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " · " + z.length + " varlık</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "zform-pdf", ad: "PDF indir", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          MK.tus({ eylem: "zform-yukle", ad: "İmzalı taramayı yükle", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
          (z.length ? MK.tus({ eylem: "zform-imzala", ad: "İmzala (" + MV.imzaYontem().kisa + ")", ikon: "file-signature" }) : "") + "</div></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-zf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zf">Teslim</h2></div><div class="a-form">' +
        zfAlan("eden", "Teslim eden", zfDurum(p).eden) + zfAlan("alan", "Teslim alan", zfDurum(p).alan) + "</div></section>" +
      '<div id="zf-belge">' + zfBelge(p, z) + "</div>";
  }
  var zfBelge = function (p, z) { var d = zfDurum(p); return MB.zimmetFormu({ p: p, varliklar: z, no: formNo(p), tarih: MK.BUGUN, eden: zfKisi(d.eden), alan: zfKisi(d.alan) }); };

  /* imzalı formun açılışı: YÜKLENEN TARAMANIN KENDİSİ (reisim 2026-09-28: "tıklayınca yüklediğim tarama değil … iskelet pdf çıkıyor"); dosyası
     olmayan örnek kayıtta formun o tarihteki kapsamıyla imzalı hâli. Tarama değiştirilir ya da silinir ("yüklenilen şeyler düzenlenebilir
     silinebilir olmalı"). */
  function imzaliFormCiz(p, no) {
    var f = (MV.ZIMMET_FORMLARI[p.id] || []).filter(function (x) { return x.no === no; })[0];
    if (!f) { kartCiz(p); return; }
    var son = MV.zimmetFormu(p.id) === f, guncel = son && MV.zimmetFormuGuncel(p.id, zimmetleri(p).map(function (v) { return v.id; }));
    $("a-nesne").innerHTML = MK.kirinti([["Personel", "#/"], [p.ad, "#/p/" + p.id], ["İmzalı zimmet formu"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">İmzalı zimmet formu · ' + f.no + "</h1>" +
        (guncel ? rozet({ ad: "Güncel", rozet: "a-rozet-tamam" }) : rozet({ ad: son ? "Eskidi" : "Önceki form", rozet: son ? "a-rozet-bekliyor" : "a-rozet-notr" })) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("file-check", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " · " + MK.tarihYaz(f.tarih) + " · " + f.kapsam.length + " varlık · " + (f.imza ? MV.IMZA_YONTEM[f.imza.yontem].kisa : kacis(f.dosya)) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + (f.imza ? MK.tus({ eylem: "zform-sil", ad: "Sil", sinif: "a-tus-ikincil", veri: { no: f.no } })   /* elektronik imzalı: dosya yok, form silinebilir */
          : MK.dosyaAlan({ ad: f.dosya, degistir: "zform-degistir", sil: "zform-sil", veri: { no: f.no } })) +
          '<a class="a-tus a-tus-ikincil" href="#/p/' + p.id + '/zimmet-gecmisi">' + ikon("history", "a-ikon-kucuk") + "Zimmet geçmişi</a></div></div>" +
      MK.dosyaOnizle(f.dosya, MB.zimmetFormu({ p: p, varliklar: f.kapsam.map(MV.varlik), no: f.no, tarih: f.tarih, eden: f.eden || teslimEden(), alan: f.alan, imzali: true, imza: f.imza }));
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
      '<section class="a-bolum" aria-labelledby="a-b-zg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zg">Verilenler ve geri alınanlar</h2></div>' +
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
      (e.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Eksik bilgi: " + kacis(e.join(" · ")) + ".") + "</div>" : "") +
      '<section class="a-bolum" aria-labelledby="a-b-kimlik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kimlik">Kimlik ve sicil</h2></div><dl class="a-bilgi">' +
        bilgi("Meslek", kacis(MV.meslekAd(p))) + bilgi("Branş", MV.bransAd(m.b)) +
        bilgi("Diploma no", p.diploma ? '<span class="a-kod">' + p.diploma + "</span>" : yok) +
        bilgi("Oda sicil no", p.oda ? '<span class="a-kod">' + p.oda + "</span>" : yok) +
        bilgi("EKİPNET kayıt no", p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : inspector(p) ? '<span class="a-yuz-uyari">Boş</span>' : yok) +
        bilgi("E-posta", p.eposta ? kacis(p.eposta) : yok, true) +
        bilgi("Mobil imza telefonu", p.imzaTel ? '<span class="a-kod">' + kacis(p.imzaTel) + "</span>" : MV.imzaYontem().k === "mobil" && inspector(p) ? '<span class="a-yuz-uyari">Yok · mobil imzaya gönderilemez</span>' : yok) +
        bilgi("İşe başlama", MK.tarihYaz(p.basla)) + (p.durum === "ayrildi" ? bilgi("Ayrılış", MK.tarihYaz(p.ayrildi)) : "") +
      "</dl></section>" +
      maasHtml(p) + hesapHtml(p) + atamaHtml(p) + zimmetHtml(p) + egitimHtml(p) + ozlukHtml(p);
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
        "";
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

  /* ── EKİPMAN ATAMASI PENCERESİ (L4) ─────────────────────────────────────────────────────────────────── */
  var A = null;
  var ggIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  function atamaCiz(odak) {
    var p = MV.kisi(A.kisi), var_ = MV.atamalari(p.id).map(function (a) { return a.tur; });
    var turler = MV.KATALOG.filter(function (t) { return var_.indexOf(t.k) < 0; }).map(function (t) { return [t.k, t.ad, MV.bransAd(t.b)]; })
      .sort(function (a, b) { return a[2] === b[2] ? a[1].localeCompare(b[1], "tr") : a[2] < b[2] ? 1 : -1; });
    $("a-atama-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · " + kacis(MV.meslekAd(p)) + "</p>" + '<div class="a-form">' +
      MK.alan({ id: "at-tur", etiket: "Ekipman türü", zorunlu: true, genis: true, hata: A.hata.tur, girdi: MK.secim({ id: "at-tur", ad: "Ekipman türü", deger: A.tur, secenekler: turler, ipucu: "Tür seçin", gecersiz: !!A.hata.tur, tanim: "at-tur-ipucu" }) }) +
      MK.alan({ id: "at-tarih", etiket: "Atama tarihi", zorunlu: true, hata: A.hata.tarih, ipucu: "GG.AA.YYYY", girdi: MK.girdi({ id: "at-tarih", deger: A.tarih, sinif: "a-girdi-sicil", hata: A.hata.tarih, ek: ' inputmode="numeric" maxlength="10" data-takvim' }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Atama belgesi <span class="a-zorunlu">zorunlu</span></p>' +
        '<div class="a-dosya-sec" id="at-dosya">' + (A.dosya ? MK.dosyaAlan({ ad: A.dosya, degistir: "atama-dosya-sec", sil: "atama-dosya-kaldir" }) : MK.tus({ eylem: "atama-dosya-sec", ad: "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) +
        (A.hata.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="at-dosya-ipucu">' + A.hata.dosya + "</p>" : "") + "</div></div></div>";
    $("a-atama-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "atama-kaydet", ad: "Ata", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function atamaAc(p) {
    A = { kisi: p.id, tur: "", tarih: MK.tarihYaz(MK.BUGUN), dosya: "", hata: {} };
    atamaCiz(); if (!$("a-atama-pencere").open) $("a-atama-pencere").showModal();
    var s = $("at-tur"); if (s) s.focus();
  }

  /* ── ÖZLÜK BELGESİ PENCERESİ ───────────────────────────────────────────────────────────────────────── */
  var B = null;
  function belgeCiz(odak) {
    var p = MV.kisi(B.kisi);
    $("a-belge-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(p.ad) + "</b> · özlük dosyası</p>" + '<div class="a-form">' +
      MK.alan({ id: "b-tur", etiket: "Belge", zorunlu: true, genis: true, girdi: MK.secim({ id: "b-tur", ad: "Belge", deger: B.tur, secenekler: MV.ozlukTur(), ipucu: "Belge seçin" }) }) +
      MK.alan({ id: "b-aciklama", etiket: "Açıklama", genis: true, ipucu: "İsteğe bağlı (ör. yenileme tarihi).", girdi: MK.girdi({ id: "b-aciklama", deger: B.aciklama, ek: ' maxlength="80"' }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Dosya <span class="a-zorunlu">zorunlu</span></p>' +
        '<div class="a-dosya-sec" id="b-dosya">' + (B.dosya ? MK.dosyaAlan({ ad: B.dosya, degistir: "dosya-sec", sil: "belge-dosya-kaldir" }) : MK.tus({ eylem: "dosya-sec", ad: "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
        "</div></div>";
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
    F = p ? { id: p.id, ad: p.ad, eposta: p.eposta, imzaTel: p.imzaTel || "", basla: p.basla.split("-").reverse().join("."), meslek: p.meslek, meslekMetin: p.meslekMetin || "", diploma: p.diploma, oda: p.oda, ekipnet: p.ekipnet, hata: {} }
      : { id: null, ad: "", eposta: "", imzaTel: "", basla: "", meslek: "", meslekMetin: "", diploma: "", oda: "", ekipnet: "", hata: {} };
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
          /* 195 (2026-09-29): isteğe bağlı; yalnız mobil imza isteği için (KVKK: amaçla sınırlı, başka yerde gösterilmez) */
          alan("imzaTel", "Mobil imza telefonu", girdi("imzaTel", "a-girdi-sicil", F.imzaTel, ' type="tel" inputmode="tel" maxlength="14" placeholder="05XX XXX XX XX"'), "", false) +
          alan("basla", "İşe başlama", girdi("basla", "a-girdi-sicil", F.basla, ' inputmode="numeric" maxlength="10" data-takvim placeholder="GG.AA.YYYY"'), "", true) +
        "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b2"><h2 id="f-b2">Meslek ve sicil</h2>' +
          (m && !m.g.length ? MK.serit("uyari", "triangle-alert", "Bu meslek yetkili kişi meslekleri arasında değil.") : "") +
          '<div class="a-form">' +
          alan("meslek", "Meslek", MK.secim({ id: "f-meslek", ad: "Meslek", deger: F.meslek, secenekler: meslekSec, ipucu: "Meslek seçin", gecersiz: !!F.hata.meslek, tanim: "f-meslek-ipucu" }), "", true, true) +
          (F.meslek === "diger" ? alan("meslekMetin", "Meslek adı", girdi("meslekMetin", "", F.meslekMetin, ' maxlength="60"'), "", true, true) : "") +
          alan("brans", "Branş", '<input class="a-girdi a-girdi-oku a-girdi-sicil" id="f-brans" readonly value="' + (m ? MV.bransAd(m.b) : "—") + '" aria-describedby="f-brans-ipucu">', "Meslekten gelir.", false) +
          alan("diploma", "Diploma no", girdi("diploma", "a-girdi-sicil", F.diploma, ' maxlength="20"'), "", false) +
          alan("oda", "Oda sicil no", girdi("oda", "a-girdi-sicil", F.oda, ' maxlength="20" inputmode="numeric"'), "", false) +
          alan("ekipnet", "EKİPNET kayıt no", girdi("ekipnet", "a-girdi-sicil", F.ekipnet, ' maxlength="20" inputmode="numeric"'), "Denetçide boşsa uyarı görünür.", false) +
        "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b4"><h2 id="f-b4">Giriş hesabı</h2>' +
          '<p class="a-bolum-aciklama">' + (p && p.hesap ? "Roller: " + p.hesap.roller.map(function (r) { return MV.rol(r).ad; }).join(", ") : "Hesap yok") + "</p>" +
        "</section>" +
      "</div>" +
      '<div class="a-form-eylem">' +
        '<a class="a-tus a-tus-ikincil" href="' + (p ? "#/p/" + p.id : "#/") + '">Vazgeç</a>' +
        MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function denetle() {
    var h = {};
    if (F.ad.trim().split(/\s+/).length < 2) h.ad = "Ad ve soyad yazılmalı.";
    if (F.eposta && !epostaGecerli(F.eposta)) h.eposta = "E-posta biçimi geçersiz.";
    if (F.imzaTel && !/^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(F.imzaTel.trim())) h.imzaTel = "05XX XXX XX XX biçiminde yazılmalı.";
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(F.basla)) h.basla = "Tarih GG.AA.YYYY biçiminde olmalı.";
    if (!F.meslek) h.meslek = "Meslek seçilmeli.";
    if (F.meslek === "diger" && !F.meslekMetin.trim()) h.meslekMetin = "Meslek adı yazılmalı.";
    return h;
  }

  /* ── İZİN TALEPLERİ (2026-09-28; reisim: izin onayı firma yöneticisinde, Personel'de) — Talepler'den gelen izin talepleri; bekleyen üstte,
     yıllık izinde kişinin kalan hakkı yanında (aşıyorsa uyarı, engel değil). Onayla ya da gerekçeyle reddet; karar talep edenin Talepler'inde. ── */
  var IZIN_SUTUN = [
    { k: "no", baslik: "Talep no", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-kod">' + x.no + '</span><span class="a-alt-satir">' + MK.zamanYaz(x.gonderildi) + "</span>"; } },
    { k: "kisi", baslik: "Personel / izin", kart: "govde", sira: 2, hucre: function (x) {
      return '<span><a class="a-baglanti" href="#/p/' + x.kisi + '">' + kacis(MV.kisi(x.kisi).ad) + '</a><span class="a-alt-satir">' + kacis(MV.izinTur(x.tur).ad) + (x.aciklama ? " · " + kacis(x.aciklama) : "") + "</span></span>"; } },
    { k: "tarih", baslik: "Tarih", kart: "govde", sira: 3, hucre: function (x) {
      var o = MV.izinOzet(x.kisi), asim = x.tur === "yillik" && x.durum === "bekliyor" && x.gun > o.kalan;
      return '<span class="a-kart-etiket">Tarih</span><span>' + MK.tarihYaz(x.bas) + (x.bit !== x.bas ? " – " + MK.tarihYaz(x.bit) : "") + '<span class="a-alt-satir' + (asim ? " a-uyari-metin" : "") + '">' + x.gun + " iş günü" +
        (x.tur === "yillik" ? " · kalan yıllık izin " + o.kalan + " gün" : "") + "</span></span>"; } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(MV.IZIN_DURUM[x.durum]) + (x.red ? '<span class="a-alt-satir">' + kacis(x.red) + "</span>" : ""); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
      /* 35. tur 162: formun son hâli PDF · e-posta (talep edene) */
      var pdf = MK.tus({ eylem: "izin-pdf", ad: "PDF", ikon: "file-text", sinif: "a-tus-ikincil", veri: { no: x.no } });
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + pdf + (x.durum !== "bekliyor" ? "" : MK.tus({ eylem: "izin-reddet", ad: "Reddet", ikon: "x", sinif: "a-tus-ikincil", veri: { no: x.no } }) +
        MK.tus({ eylem: "izin-onayla", ad: "Onayla", ikon: "check", veri: { no: x.no } })) + "</div></div>"; } }
  ];
  function izinCiz() {
    var l = MV.IZINLER.slice().sort(function (a, b) { return (a.durum === "bekliyor" ? 0 : 1) - (b.durum === "bekliyor" ? 0 : 1) || (a.gonderildi < b.gonderildi ? 1 : -1); });
    var bek = l.filter(function (x) { return x.durum === "bekliyor"; }).length;
    $("a-izin-sayac").innerHTML = "<b>" + l.length + "</b> talep";
    $("a-izin-uyari").innerHTML = bek ? '<div class="a-uyari-serit">' + MK.serit("uyari", "inbox", "<b>" + bek + " izin talebi onayınızı bekliyor.</b>") + "</div>" : "";
    $("a-izin-liste").innerHTML = l.length ? MK.tablo({ baslik: "İzin talepleri", sinif: "a-tablo-izin", sutunlar: IZIN_SUTUN, kayitlar: l }) : MK.bos({ ikon: "inbox", baslik: "İzin talebi yok", metin: "Personel izin talebini Talepler'den gönderir." });
  }
  var IZ = null;
  function izinRedCiz(odak) {
    var x = IZ.x;
    $("a-izin-govde").innerHTML = '<p class="a-pencere-ozet"><b>' + kacis(MV.kisi(x.kisi).ad) + "</b> · " + kacis(MV.izinTur(x.tur).ad) + " · " + MK.tarihYaz(x.bas) + (x.bit !== x.bas ? " – " + MK.tarihYaz(x.bit) : "") + "</p>" +
      MK.alan({ id: "iz-gerekce", etiket: "Red gerekçesi", zorunlu: true, genis: true, hata: IZ.hata,
        girdi: '<textarea class="a-alan a-alan-ince" id="iz-gerekce" maxlength="200" aria-describedby="iz-gerekce-ipucu"' + (IZ.hata ? ' aria-invalid="true"' : "") + ">" + kacis(IZ.gerekce) + "</textarea>" });
    $("a-izin-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "izin-red-kaydet", ad: "Reddet", ikon: "x" });
    if (odak) $(odak).focus();
  }
  var izinBul = function (no) { return MV.IZINLER.filter(function (x) { return x.no === no; })[0]; };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/roller") return { v: "roller" };
    if (h === "#/izinler") return { v: "izinler" };
    if (h === "#/ayarlar") { location.replace(MK.adres(22)); return { v: "liste" }; }   /* R1: firma ayarları ayrı modül; eski adres yönlenir */
    if (h === "#/yeni") return { v: "form" };
    if ((m = /^#\/p\/([a-z0-9]+)\/duzenle$/.exec(h))) return { v: "form", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-formu$/.exec(h))) return { v: "zform", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-gecmisi$/.exec(h))) return { v: "zgecmis", id: m[1] };
    if ((m = /^#\/p\/([a-z0-9]+)\/zimmet-imzali\/([A-Z0-9-]+)$/.exec(h))) return { v: "zimzali", id: m[1], no: m[2] };
    if ((m = /^#\/p\/([a-z0-9]+)\/(hesap|belge|bordro|atama)$/.exec(h))) return { v: "kart", id: m[1], pencere: m[2] };
    if ((m = /^#\/p\/([a-z0-9]+)$/.exec(h))) return { v: "kart", id: m[1] };
    return { v: "liste" };
  }
  var sonKisi = null;
  function goster(odakla) {
    var r = rota(), p = r.id ? MV.kisi(r.id) : null;
    if (r.v !== "kart" || sonKisi !== r.id) SECILI = null;
    if (r.v !== "roller") { R.duzen = false; R.taslak = null; }
    sonKisi = r.id || null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-roller-gorunum").hidden = r.v !== "roller"; $("a-izin-gorunum").hidden = r.v !== "izinler";
    $("a-nesne").hidden = ["kart", "zform", "zgecmis", "zimzali"].indexOf(r.v) < 0; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") listeCiz();
    else if (r.v === "roller") rollerCiz();
    else if (r.v === "izinler") izinCiz();
    else if (r.v === "kart") kartCiz(p);
    else if (r.v === "zform") { if (p) zimmetFormuCiz(p); else kartCiz(null); }
    else if (r.v === "zgecmis") { if (p) zimmetGecmisiCiz(p); else kartCiz(null); }
    else if (r.v === "zimzali") { if (p) imzaliFormCiz(p, r.no); else kartCiz(null); }
    else { if (!F || F.id !== (r.id || null) || odakla) formAc(p); formCiz(); }
    document.title = (r.v === "liste" ? "Personel" : r.v === "roller" ? "Rol yetkileri" : r.v === "izinler" ? "İzin talepleri" : r.v === "kart" ? (p ? p.ad : "Kişi bulunamadı") : r.v === "zform" ? (p ? p.ad + " · zimmet formu" : "Kişi bulunamadı") : r.v === "zgecmis" ? (p ? p.ad + " · zimmet geçmişi" : "Kişi bulunamadı") :
      r.v === "zimzali" ? (p ? p.ad + " · imzalı zimmet formu" : "Kişi bulunamadı") : (p ? p.ad + " · düzenle" : "Yeni personel")) + " · probata maket";
    if (odakla && !r.pencere) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere === "hesap" && p) { if (!$("a-hesap-pencere").open) hesapPencereAc(p); } else if ($("a-hesap-pencere").open) $("a-hesap-pencere").close();
    if (r.pencere === "belge" && p) { if (!$("a-belge-pencere").open) belgeAc(p); } else if ($("a-belge-pencere").open) $("a-belge-pencere").close();
    if (r.pencere === "atama" && p) { if (!$("a-atama-pencere").open) atamaAc(p); } else if ($("a-atama-pencere").open) $("a-atama-pencere").close();
    if (r.pencere === "bordro" && p) { if (!$("a-bordro-pencere").open) bordroAc(p); } else if ($("a-bordro-pencere").open) $("a-bordro-pencere").close();
  }
  MK.goster = goster;

  var X = MK.eylem, aktif = function () { return MV.kisi(rota().id); };
  var bolumeGit = function (id) { var h = $(id); if (h) { h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); } };
  X["hesaba-git"] = function () { bolumeGit("a-b-hesap"); };
  X["izin-onayla"] = function (el) {
    var x = izinBul(el.dataset.no); if (!x || x.durum !== "bekliyor") return;
    /* 2026-09-29 (V3): onaylayan izin formunu firmanın yöntemiyle (mobil imza / e-imza) imzalar */
    MK.imzaAl({ belge: x.no + " izin talep formu", imzacilar: [MV.kisi("ad").ad], tamam: function (im) {
      x.durum = "onaylandi"; x.onaylayan = "ad"; x.karar = MK.simdi(); x.onayImza = im; izinCiz(); var h = document.querySelector("#a-izin-gorunum h1"); if (h) h.focus();
      MK.bildir(x.no + " onaylandı ve " + MV.IMZA_YONTEM[im.yontem].kisa + " ile imzalandı: " + MV.kisi(x.kisi).ad + ", " + x.gun + " iş günü " + MV.izinTur(x.tur).ad.toLocaleLowerCase("tr") + ".");
    } });
  };
  X["izin-pdf"] = function (el) { var x = izinBul(el.dataset.no); MB.talepPdfAc({ tip: "izin", x: x, kime: [MV.kisi(x.kisi)], gonderen: MV.kisi("ad") }); };
  X["izin-reddet"] = function (el) { IZ = { x: izinBul(el.dataset.no), gerekce: "", hata: "" }; izinRedCiz(); $("a-izin-pencere").showModal(); $("iz-gerekce").focus(); };
  X["izin-red-kaydet"] = function () {
    IZ.gerekce = $("iz-gerekce").value.trim(); if (!IZ.gerekce) { IZ.hata = "Gerekçe yazılmalı; talep eden görür."; izinRedCiz("iz-gerekce"); return; }
    var x = IZ.x; x.durum = "red"; x.red = IZ.gerekce; x.onaylayan = "ad"; x.karar = MK.simdi(); IZ = null; $("a-izin-pencere").close(); izinCiz();
    var h = document.querySelector("#a-izin-gorunum h1"); if (h) h.focus(); MK.bildir(x.no + " reddedildi; gerekçe talep edene iletildi.");
  };
  X["zform-yukle"] = function () {   /* 2026-09-27: gerçek dosya penceresi; formdaki varlıklar kapsam olarak saklanır */
    var p = aktif();
    if (zfEksik()) return;
    var d = zfDurum(p), eden = zfKisi(d.eden), alan = zfKisi(d.alan);
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: "zimmet-formu-imzali.pdf" }, function (ad) {
      (MV.ZIMMET_FORMLARI[p.id] = MV.ZIMMET_FORMLARI[p.id] || []).unshift({ no: formNo(p), tarih: MK.BUGUN, kapsam: zimmetleri(p).map(function (v) { return v.id; }), dosya: ad, eden: eden, alan: alan });
      location.hash = "#/p/" + p.id; MK.bildir("İmzalı zimmet formu yüklendi (" + formNo(p) + ")."); setTimeout(function () { bolumeGit("a-b-zimmet"); }, 0);
    });
  };
  /* 2026-09-29 (V3): zimmet teslim formu firmanın yöntemiyle (mobil imza / e-imza) imzalanır — önce teslim eden, sonra teslim alan */
  X["zform-imzala"] = function () {
    var p = aktif(), no = formNo(p); if (zfEksik()) return;
    var d = zfDurum(p), eden = zfKisi(d.eden), alan = zfKisi(d.alan);
    MK.imzaAl({ belge: no + " zimmet teslim formu", imzacilar: [eden.ad, alan.ad], tamam: function (im) {
      (MV.ZIMMET_FORMLARI[p.id] = MV.ZIMMET_FORMLARI[p.id] || []).unshift({ no: no, tarih: MK.BUGUN, kapsam: zimmetleri(p).map(function (v) { return v.id; }), dosya: null, imza: im, eden: eden, alan: alan });
      location.hash = "#/p/" + p.id; MK.bildir("Zimmet formu " + MV.IMZA_YONTEM[im.yontem].kisa + " ile imzalandı (" + no + ")."); setTimeout(function () { bolumeGit("a-b-zimmet"); }, 0);
    } });
  };
  /* elle yaz seçilip ad boş bırakıldıysa imza / yükleme yapılmaz, alan gösterilir (belgede adı olmayan imza satırı olmaz) */
  function zfEksik() {
    var d = ZF, bos = d && ["eden", "alan"].filter(function (r) { return d[r].k === ELLE && !d[r].ad.trim(); })[0];
    if (!bos) return false;
    var g = $("zf-" + bos + "-ad"); if (g) { g.setAttribute("aria-invalid", "true"); g.focus(); }
    MK.bildir((bos === "eden" ? "Teslim eden" : "Teslim alan") + " adını yazın."); return true;
  }
  var zformBul = function (el) { return (MV.ZIMMET_FORMLARI[aktif().id] || []).filter(function (x) { return x.no === el.dataset.no; })[0]; };
  X["zform-degistir"] = function (el) {
    var f = zformBul(el);
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: "zimmet-formu-imzali-2.pdf" }, function (ad) {
      if (ad !== f.dosya) MK.dosyaSil(f.dosya); f.dosya = ad; MK.goster(false); MK.bildir(f.no + " taraması değiştirildi.");
    });
  };
  X["zform-sil"] = function (el) {
    var p = aktif(), f = zformBul(el);
    MK.onayla({ baslik: f.imza ? "Formu sil" : "Taramayı sil", metin: f.no + " imzalı zimmet formu" + (f.imza ? "" : " ve taraması") + " silinir.", tamam: function () {
      var l = MV.ZIMMET_FORMLARI[p.id]; l.splice(l.indexOf(f), 1); if (f.dosya) MK.dosyaSil(f.dosya);
      location.hash = "#/p/" + p.id; MK.bildir(f.no + " silindi."); setTimeout(function () { bolumeGit("a-b-zimmet"); }, 0);
    } });
  };
  X["zimmete-git"] = function () { bolumeGit("a-b-zimmet"); };
  X["atamaya-git"] = function () { bolumeGit("a-b-atama"); };
  X["atama-ekle"] = function () { location.hash = "#/p/" + aktif().id + "/atama"; };
  X["atama-dosya-sec"] = function () {
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: "atama-" + (A.tur ? A.tur.toLowerCase() : "belgesi") + "-" + MK.BUGUN + ".pdf" }, function (ad) { if (!A) return; A.dosya = ad; delete A.hata.dosya; atamaCiz(); $("a-atama-alt").querySelector(".a-tus-birincil").focus(); });
  };
  X["atama-dosya-kaldir"] = function () { if (!A) return; A.dosya = ""; atamaCiz(); var b = document.querySelector('#at-dosya [data-eylem="atama-dosya-sec"]'); if (b) b.focus(); };
  X["atama-kaydet"] = function () {
    if (!A) return;
    var iso = ggIso(A.tarih); A.hata = {};
    if (!A.tur) A.hata.tur = "Ekipman türü seçilmeli.";
    if (!iso) A.hata.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    if (!A.dosya) A.hata.dosya = "Atama belgesi yüklenmeli.";
    var hk = Object.keys(A.hata); if (hk.length) { atamaCiz(hk[0] === "dosya" ? null : "at-" + hk[0]); if (hk[0] === "dosya") { var b = document.querySelector('#at-dosya [data-eylem="atama-dosya-sec"]'); if (b) b.focus(); } return; }
    MV.ATAMALAR.push({ id: "at" + (MV.ATAMALAR.length + 100), k: A.kisi, tur: A.tur, tarih: iso, dosya: A.dosya });
    var ad = MV.tur(A.tur).ad, kisi = A.kisi; A = null;
    location.hash = "#/p/" + kisi; MK.bildir(ad + " ataması eklendi; belgesi kartta.");
    setTimeout(function () { bolumeGit("a-b-atama"); }, 0);
  };
  X["atama-degistir"] = function (el) {
    var a = MV.ATAMALAR.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!a) return;
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: "atama-" + a.tur.toLowerCase() + "-" + MK.BUGUN + ".pdf" }, function (ad) {
      a.dosya = ad; kartCiz(aktif()); MK.bildir(MV.tur(a.tur).ad + " atama belgesi değiştirildi.");
      var b = document.querySelector('[data-eylem="atama-degistir"][data-id="' + a.id + '"]'); if (b) b.focus();
    });
  };
  X["atama-sil"] = function (el) {
    var i = MV.ATAMALAR.map(function (x) { return x.id; }).indexOf(el.dataset.id); if (i < 0) return;
    var a = MV.ATAMALAR[i], ad = MV.tur(a.tur).ad;
    MK.onayla({ baslik: "Atamayı kaldır", metin: "<b>" + kacis(ad) + "</b> ataması ve belgesi kaldırılır. Bu türde plan ve raporda uyarı görünür.", tus: "Kaldır", tamam: function () {
      MV.ATAMALAR.splice(MV.ATAMALAR.indexOf(a), 1); kartCiz(aktif()); MK.bildir(ad + " ataması kaldırıldı."); bolumeGit("a-b-atama");
    } });
  };
  X["egitime-git"] = function () { bolumeGit("a-b-egitim"); };
  /* 2026-09-27: zimmet teslim formu yazdırma penceresinden PDF olur (imzaya götürülür) */
  X["zform-pdf"] = function () { var n = $("a-nesne"); MK.yazdir(formNo(aktif()) + " · zimmet teslim formu", [].map.call(n.children, function (e) { return e.matches(".a-kirinti") ? "" : e.outerHTML; }).join("")); };
  X["hesap-ac"] = function () { location.hash = "#/p/" + aktif().id + "/hesap"; };
  X["belge-ekle"] = function () { location.hash = "#/p/" + aktif().id + "/belge"; };
  X["bordro-onaya"] = function (el) {
    var p = aktif(), b = MV.BORDROLAR.filter(function (x) { return x.kisi === p.id && x.ay === el.dataset.ay; })[0];
    MK.onayla({ baslik: "Bordroyu onaya gönder", metin: "<b>" + kacis(MV.ayAd(b.ay)) + "</b> bordrosu " + kacis(p.ad) + " kişisinin onayına gider; mobil imza ya da e-imzayla onaylar (Onaylar › Diğer).", tus: "Onaya gönder", tamam: function () {
      MV.BELGE_ONAY.push({ id: "bo" + (MV.BELGE_ONAY.length + 1), tur: "bordro", ad: MV.ayAd(b.ay) + " maaş bordrosu", kisi: p.id, gonderen: MK.BEN || "ga", gonderildi: MK.simdi(), durum: "bekliyor", ay: b.ay, dosya: b.dosya });
      MV.BELGE_ONAY = MV.BELGE_ONAY.slice(); kartCiz(p); bolumeGit("a-b-maas"); MK.bildir(MV.ayAd(b.ay) + " bordrosu " + p.ad + " onayına gönderildi.");
    } });
  };
  X["bordro-ekle"] = function () { location.hash = "#/p/" + aktif().id + "/bordro"; };
  X["bordro-dosya-kaldir"] = function () { if (!BR) return; BR.dosya = ""; bordroCiz(); document.querySelector('#a-bordro-pencere [data-eylem="bordro-dosya"]').focus(); };
  X["belge-dosya-kaldir"] = function () { if (!B) return; B.dosya = ""; belgeCiz(); document.querySelector('#a-belge-pencere [data-eylem="dosya-sec"]').focus(); };
  var yerinde = function (bolum, ileti) { kartCiz(aktif()); bolumeGit(bolum); MK.bildir(ileti); };
  X["ozluk-degistir"] = function (el) {
    var b = ozluk(aktif())[+el.dataset.i];
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: b.tur + "-" + MK.BUGUN + "-2.pdf" }, function (ad) { if (b.dosya && b.dosya !== ad) MK.dosyaSil(b.dosya); b.dosya = ad; b.tarih = MK.BUGUN; yerinde("a-b-ozluk", belgeAd(b.tur) + " değiştirildi."); });
  };
  X["ozluk-sil"] = function (el) {
    var l = ozluk(aktif()), b = l[+el.dataset.i];
    MK.onayla({ baslik: "Belgeyi sil", metin: belgeAd(b.tur) + " özlük dosyasından silinir.", tamam: function () { l.splice(l.indexOf(b), 1); if (b.dosya) MK.dosyaSil(b.dosya); yerinde("a-b-ozluk", belgeAd(b.tur) + " silindi."); } });
  };
  var bordroBul = function (el) { var k = aktif().id; return MV.BORDROLAR.filter(function (b) { return b.kisi === k && b.ay === el.dataset.ay; })[0]; };
  X["bordro-degistir"] = function (el) {
    var b = bordroBul(el);
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 10, ornek: "bordro-" + b.ay + "-" + b.kisi + "-2.pdf" }, function (ad) { if (b.dosya && b.dosya !== ad) MK.dosyaSil(b.dosya); b.dosya = ad; yerinde("a-b-maas", MV.ayAd(b.ay) + " bordrosu değiştirildi."); });
  };
  X["bordro-sil"] = function (el) {
    var b = bordroBul(el);
    MK.onayla({ baslik: "Bordroyu sil", metin: MV.ayAd(b.ay) + " bordrosu ve tutarları silinir.", tamam: function () { MV.BORDROLAR.splice(MV.BORDROLAR.indexOf(b), 1); if (b.dosya) MK.dosyaSil(b.dosya); yerinde("a-b-maas", MV.ayAd(b.ay) + " bordrosu silindi."); } });
  };
  X["bordro-dosya"] = function () {
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 10, ornek: "bordro-" + BR.ay + "-" + BR.kisi + ".pdf" }, function (ad) { if (!BR) return; BR.dosya = ad; delete BR.hata.dosya; bordroCiz(); $("a-bordro-alt").querySelector(".a-tus-birincil").focus(); });
  };
  X["bordro-kaydet"] = function () {
    var h = {}, n = { brut: tlOku(BR.brut), net: tlOku(BR.net), maliyet: tlOku(BR.maliyet) };
    ["brut", "net", "maliyet"].forEach(function (k) { if (!(n[k] > 0)) h[k] = "Tutar sıfırdan büyük olmalı (ör. 90.000,00)."; });
    if (!h.net && !h.brut && n.net > n.brut) h.net = "Net brütten büyük olamaz.";
    if (!BR.dosya) h.dosya = "Bordro dosyası seçilmeli.";
    BR.hata = h; var hk = Object.keys(h);
    if (hk.length) { bordroCiz(hk[0] === "dosya" ? null : "r-" + hk[0]); if (hk[0] === "dosya") document.querySelector('#a-bordro-pencere [data-eylem="bordro-dosya"]').focus(); return; }
    var p = MV.kisi(BR.kisi);
    MV.BORDROLAR = MV.BORDROLAR.filter(function (b) { return !(b.kisi === p.id && b.ay === BR.ay); });
    MV.BORDROLAR.push({ kisi: p.id, ay: BR.ay, brut: n.brut, net: n.net, maliyet: n.maliyet, dosya: BR.dosya, yuklendi: MK.BUGUN, yukleyen: "ad" });
    var ay = BR.ay; $("a-bordro-pencere").close(); MK.bildir(p.ad + ": " + MV.ayAd(ay) + " bordrosu yüklendi.");
  };
  X["rol-kaydet"] = function () { var p = aktif(); p.hesap.roller = SECILI.slice(); SECILI = null; kartCiz(p); bolumeGit("a-b-hesap"); MK.bildir("Roller kaydedildi; yeni yetkiler hemen geçerli."); };
  X["rol-geri"] = function () { SECILI = null; kartCiz(aktif()); bolumeGit("a-b-hesap"); };
  X["hesap-kapat"] = function () {   /* AA8: onay penceresi */
    var p = aktif();
    MK.onayla({ baslik: "Hesap kapatılsın mı?", metin: p.ad + " artık giriş yapamaz, açık oturumları sonlanır. Kayıtları silinmez; hesap yeniden açılabilir.", tus: "Hesabı kapat", tamam: function () {
      p.hesap.durum = "pasif"; SECILI = null; kartCiz(p); bolumeGit("a-b-hesap"); MK.bildir(p.ad + ": hesap kapatıldı, açık oturumları sonlandı.");
    } });
  };
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
  X["dosya-sec"] = function () {
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: B.tur ? B.tur + "-" + MK.BUGUN + ".pdf" : "belge-" + MK.BUGUN + ".pdf" }, function (ad) { if (!B) return; B.dosya = ad; belgeCiz(); $("a-belge-alt").querySelector(".a-tus-birincil").focus(); });
  };
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
    if (/^zf-(eden|alan)$/.test(id)) { var p0 = aktif(), r0 = id.slice(3); zfDurum(p0)[r0].k = deger; zimmetFormuCiz(p0); var e0 = deger === ELLE ? $(id + "-ad") : $(id); if (e0) e0.focus(); return; }
    if (id === "f-meslek") { F.meslek = deger; delete F.hata.meslek; formCiz(); }
    else if (id === "b-tur") { B.tur = deger; belgeCiz(); }
    else if (id === "at-tur" && A) { A.tur = deger; delete A.hata.tur; atamaCiz(id); }
    else if (id === "r-ay") { BR.ay = deger; bordroCiz(id); }
    else if ((m = /^m-(\w+)-(\d)$/.exec(id))) { R.taslak[m[1]][+m[2]] = deger; rollerCiz(); }
  };
  MK.onGirdi = function (e) {
    var t = e.target, k = t.dataset && t.dataset.alan;
    if (t.dataset && t.dataset.zf && ZF) { ZF[t.dataset.zf].ad = t.value; t.removeAttribute("aria-invalid"); var p1 = aktif(); $("zf-belge").innerHTML = zfBelge(p1, zimmetleri(p1)); return; }   /* belge önizlemesi yazdıkça, alan yerinde kalır */
    if (k) { F[k] = t.value; return; }
    if (t.id === "h-eposta") { W.eposta = t.value.trim(); var yer = t.selectionStart; hesapPencereCiz("h-eposta"); $("h-eposta").setSelectionRange(yer, yer); }
    else if (t.id === "b-aciklama") B.aciklama = t.value;
    else if (t.id === "at-tarih" && A) A.tarih = t.value;
    else if (BR && /^r-(brut|net|maliyet)$/.test(t.id)) BR[t.id.slice(2)] = t.value;
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
    var kayit = { ad: F.ad.trim(), eposta: F.eposta.trim(), imzaTel: F.imzaTel.trim(), basla: F.basla.split(".").reverse().join("-"), meslek: F.meslek, meslekMetin: F.meslekMetin.trim(),
      diploma: F.diploma.trim(), oda: F.oda.trim(), ekipnet: F.ekipnet.trim() };
    var p = F.id ? MV.kisi(F.id) : null;
    if (p) Object.assign(p, kayit);
    else { p = Object.assign({ id: "y" + P.length, durum: "etkin", hesap: null, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } }, kayit); P.push(p); }
    F = null; location.hash = "#/p/" + p.id;
    MK.bildir(kayit.ad + " kaydedildi.");
  };
  /* pencere kapanınca adres karta döner, kart yeni hâli gösterir (açılan hesap, eklenen belge) */
  ["a-hesap-pencere", "a-belge-pencere", "a-bordro-pencere"].forEach(function (id) {
    $(id).addEventListener("close", function () {
      var r = rota(); if (!r.pencere) return;
      history.replaceState(null, "", "#/p/" + r.id); kartCiz(MV.kisi(r.id));
      bolumeGit(id === "a-hesap-pencere" ? "a-b-hesap" : id === "a-bordro-pencere" ? "a-b-maas" : "a-b-ozluk");
    });
  });

  MK.kabuk({ modul: 2, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("p");
  MK.seciciCiz("p"); goster(false);
})();
