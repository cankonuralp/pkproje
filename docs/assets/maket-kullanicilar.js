/* ══ probata MAKET M1 — Kullanıcı ve Rol (modül 1) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════
   Kaynak: pkproje.md §2 (çoklu rol; ekran yetkisi rollerin birleşimi; onaylayan kendi raporunu onaylayabilir; müşteri
   hesabı e-postayla), §3.4 karar 30 (hareket kaydı rol × modülde yöneticiye), 5. tur ("kim hangi modülü görebilecek sonradan
   belirleriz" → rol yetkileri tablosu ÖNERİ). Ekranlar: kullanıcılar (#/) · rol yetkileri (#/roller) · kullanıcı (#/k/<id>) ·
   davet penceresi (#/davet[/<personel>]). Kullanıcı hesabı personel kaydına bağlıdır (varsayım). Veri ortak, UYDURMA. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet;
  var HESAP = { etkin: { ad: "Etkin", rozet: "a-rozet-tamam" }, davet: { ad: "Davet bekliyor", rozet: "a-rozet-bekliyor" }, pasif: { ad: "Pasif", rozet: "a-rozet-notr" } };
  var hesaplilar = function () { return MV.PERSONEL.filter(function (p) { return !!p.hesap; }); };
  var rolRozet = function (r) { return '<span class="a-rozet a-rozet-notr">' + MV.rol(r).ad + "</span>"; };

  /* ── KULLANICILAR LİSTESİ ─────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("k", { ad: "Kullanıcılarda ara", ipucu: "Ad, e-posta", birim: "kullanıcı",
    /* roller birbirini dışlamaz (bir kişinin birden çok rolü olabilir) → "ve" anlamlı: iki role birden sahip olanlar */
    cipler: MV.ROLLER.map(function (r) { return { k: r.k, ad: r.ad, test: function (p) { return p.hesap.roller.indexOf(r.k) >= 0; } }; }),
    seciciler: [{ k: "durum", ad: "Görünüm", bas: "acik", secenek: function () { return [["acik", "Etkin ve davetli"], ["pasif", "Pasif"], ["hepsi", "Hepsi"]]; },
      gecer: function (p, v) { return v === "hepsi" || (v === "acik" ? p.hesap.durum !== "pasif" : p.hesap.durum === "pasif"); } }],
    metin: function (p) { return [p.ad, p.eposta].join(" "); }, imkansiz: "" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "ad", baslik: "Ad soyad", kart: "ust", sira: 1, hucre: function (p) { return '<a class="a-no" href="#/k/' + p.id + '">' + kacis(p.ad) + "</a>" + kirp(p.eposta, "a-alt-satir"); } },
    { k: "roller", baslik: "Roller", kart: "govde", sira: 2, hucre: function (p) { return '<span class="a-rozetler">' + p.hesap.roller.map(rolRozet).join("") + "</span>"; } },
    { k: "son", baslik: "Son giriş", kart: "govde", sira: 3, hucre: function (p) {
      var h = p.hesap;
      return '<span class="a-kart-etiket">' + (h.durum === "davet" ? "Davet gönderildi" : "Son giriş") + "</span>" + '<span class="a-tarih-saat">' + MK.zamanYaz(h.durum === "davet" ? h.davet : h.son) + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) { return rozet(HESAP[p.hesap.durum]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "k", kayitlar: hesaplilar(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); }); },
      bosVeri: { ikon: "users", baslik: "Kullanıcı yok", metin: "“Kullanıcı davet et” ile personele giriş hesabı açılır." },
      tablo: { baslik: "Kullanıcılar", sinif: "a-tablo-kullanici", sutunlar: SUTUN, href: function (p) { return "#/k/" + p.id; } } });
  }

  /* ── ROL YETKİLERİ (ÖNERİ): modüller menünün kendisinden (MK.MENU), düzeyler ortak veriden (MV.MATRIS) ───────── */
  function matrisSatirlari() {
    var l = [];
    MK.MENU.forEach(function (g) { g.ogeler.forEach(function (o) { l.push({ ad: o[0], ikon: o[1], no: o[2], grup: g.grup }); }); });
    l.push({ ad: "Hareket kaydı", ikon: "shield-check", no: "hareket", grup: "Denetim izi" });
    return l;
  }
  var duzeyHtml = function (d) { var x = MV.DUZEY[d]; return d === "yok" ? '<span class="a-deger-yok">—</span>' : rozet(x); };
  var MATRIS_SUTUN = [{ k: "modul", baslik: "Modül", kart: "ust", sira: 1, hucre: function (m) {
    return '<span class="a-hucre-satir">' + ikon(m.ikon, "a-ikon-kucuk") + '<span><span class="a-ekipman-ad">' + m.ad + '</span><span class="a-alt-satir">' + m.grup + "</span></span></span>";
  } }].concat(MV.ROLLER.map(function (r, i) {
    return { k: "r" + i, baslik: r.ad, kart: "govde", sira: 2 + i, hucre: function (m) { return '<span class="a-kart-etiket">' + r.ad + "</span>" + duzeyHtml(MV.MATRIS[m.no][i]); } };
  }));
  function rollerCiz() {
    $("a-roller").innerHTML =
      MK.serit("bilgi", "circle-alert", "Önerilen başlangıç düzeni: hangi rolün hangi modülü göreceği henüz kararlaştırılmadı. Bir kişinin birden çok rolü varsa en geniş düzey geçerlidir.") +
      '<p class="a-bolum-aciklama a-lejant">' + ["yaz", "gor", "brans", "kendi"].map(function (d) {
        return rozet(MV.DUZEY[d]) + " " + { yaz: "görür ve değiştirir", gor: "görür", brans: "yalnız kendi branşının kayıtları", kendi: "yalnız kendi kayıtları" }[d];
      }).join(" · ") + " · — görmez</p>" +
      '<div class="a-liste-kap">' + MK.tablo({ baslik: "Rol yetkileri", sinif: "a-tablo-matris", sutunlar: MATRIS_SUTUN, kayitlar: matrisSatirlari() }) + "</div>";
  }

  /* ── KULLANICI SAYFASI ─────────────────────────────────────────────────────────────────────────── */
  var SECILI = null;   /* sayfadaki rol onay kutularının kaydedilmemiş hâli */
  function birlesim(roller) {   /* ekran yetkisi = rollerin birleşimi (en geniş düzey) */
    var s = {};
    Object.keys(MV.MATRIS).forEach(function (no) {
      var en = "yok";
      MV.ROLLER.forEach(function (r, i) { if (roller.indexOf(r.k) >= 0 && MV.DUZEY[MV.MATRIS[no][i]].sira > MV.DUZEY[en].sira) en = MV.MATRIS[no][i]; });
      s[no] = en;
    });
    return s;
  }
  function yuz(o) {
    return '<a class="a-yuz" href="' + o.href + '"><span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" +
      (o.not ? '<span class="a-yuz-not">' + o.not + "</span>" : "") + "</a>";
  }
  function kullaniciCiz(p) {
    if (!p || !p.hesap) {
      $("a-nesne").innerHTML = MK.kirinti([["Kullanıcılar", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Kullanıcı bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Kullanıcı bulunamadı", metin: "Bu adreste giriş hesabı olan kişi yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Kullanıcılara dön</a>" });
      return;
    }
    var h = p.hesap, sec = SECILI || h.roller, yetkili = MV.yetkiliOlabilir(p), degisti = sec.slice().sort().join() !== h.roller.slice().sort().join();
    var b = birlesim(sec), gorulen = MK.MENU.reduce(function (n, g) { return n + g.ogeler.filter(function (o) { return b[o[2]] !== "yok"; }).length; }, 0);
    var e = MV.kabulEksik(p), pasif = h.durum === "pasif";
    var tuslar = h.durum === "etkin" ? MK.tus({ eylem: "sifirla", ad: "Parola sıfırlama bağlantısı", ikon: "key-round", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pasiflestir", ad: "Hesabı pasifleştir", ikon: "ban", sinif: "a-tus-ikincil" })
      : h.durum === "davet" ? MK.tus({ eylem: "davet-yinele", ad: "Daveti yeniden gönder", ikon: "send", sinif: "a-tus-ikincil" })
      : MK.tus({ eylem: "etkinlestir", ad: "Hesabı yeniden etkinleştir", ikon: "refresh-cw", sinif: "a-tus-ikincil" });
    $("a-nesne").innerHTML = MK.kirinti([["Kullanıcılar", "#/"], [p.ad]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(HESAP[h.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("mail", "a-ikon-kucuk") + "<span>" + kacis(p.eposta) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + tuslar + "</div></div>" +
      '<div class="a-yuzler">' +
        yuz({ ikon: "id-card", ad: "Personel kartı", sayi: MV.bransAd(MV.meslek(p.meslek).b), href: "personel.html#/p/" + p.id, not: MV.meslekAd(p) }) +
        yuz({ ikon: "layers", ad: "Görebildiği modül", sayi: gorulen + " / 17", href: "#/roller", not: "rollerin birleşimi" }) +
        yuz({ ikon: "log-in", ad: h.durum === "davet" ? "Davet gönderildi" : "Son giriş", sayi: MK.gunKisa(h.durum === "davet" ? h.davet : h.son), href: "#/k/" + p.id,
          not: (h.durum === "davet" ? h.davet : h.son).slice(11, 16) }) +
      "</div>" +
      (pasif ? '<div class="a-serit-kap">' + MK.serit("bilgi", "ban", "Hesap pasif: giriş yapamaz; roller korunur, kayıtları ve imzaladığı raporlar yerinde kalır.") + "</div>" : "") +
      '<section class="a-bolum" aria-labelledby="a-b-rol"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-rol">Roller</h2><span class="a-sayac"><b>' + sec.length + "</b> rol</span></div>" +
        '<p class="a-bolum-aciklama">Bir kişinin birden çok rolü olabilir; görebildiği ekranlar rollerin birleşimidir. Onaylayan yönetici kendi hazırladığı raporu da onaylayabilir.</p>' +
        '<ul class="a-secim-listesi">' + MV.ROLLER.map(function (r) {
          var kapali = pasif || (r.k === "inspector" && !yetkili);
          return '<li><label class="a-secim-satir"><input type="checkbox" data-rol="' + r.k + '"' + (sec.indexOf(r.k) >= 0 ? " checked" : "") + (kapali ? " disabled" : "") + ">" +
            '<span class="a-secim-metin"><span class="a-ekipman-ad">' + r.ad + '</span><span class="a-alt-satir">' +
            (r.k === "inspector" && !yetkili ? "Meslek (" + kacis(MV.meslekAd(p)) + ") yetkili kişi mesleği değil; verilemez." : r.acik) + "</span></span></label></li>";
        }).join("") + "</ul>" +
        (sec.indexOf("inspector") >= 0 && e && e.length ? '<div class="a-bolum-serit">' + MK.serit("uyari", "triangle-alert", "Inspector rolü var ama plan kabul edemez: " + kacis(e.join(" · ")) + ". Personel kartında tamamlanır.") + "</div>" : "") +
        (pasif ? "" : '<div class="a-form-eylem"><p class="a-adim-not">' + (degisti ? "Kaydedilmemiş değişiklik var." : "Değişiklik yok.") + "</p>" +
          (degisti ? MK.tus({ eylem: "rol-geri", ad: "Vazgeç", sinif: "a-tus-ikincil" }) : "") +
          MK.tus({ eylem: "rol-kaydet", ad: "Rolleri kaydet", ikon: "check", kapali: !degisti || !sec.length }) + "</div>") +
      "</section>" +
      '<section class="a-bolum" aria-labelledby="a-b-gor"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gor">Görebildiği modüller</h2><span class="a-sayac">önerilen rol yetkilerine göre</span></div><dl class="a-bilgi">' +
        MK.MENU.map(function (g) {
          var l = g.ogeler.filter(function (o) { return b[o[2]] !== "yok"; }).map(function (o) { return o[0] + ' <span class="a-alt-inline">' + MV.DUZEY[b[o[2]]].ad.toLocaleLowerCase("tr") + "</span>"; });
          return MK.bilgi(g.grup, l.length ? l.join(" · ") : '<span class="a-deger-yok">—</span>', true);
        }).join("") + (b.hareket !== "yok" ? MK.bilgi("Denetim izi", "Hareket kaydı <span class=\"a-alt-inline\">görür</span>", true) : "") +
      "</dl></section>";
  }

  /* ── DAVET PENCERESİ: personel kaydı olan ama hesabı olmayan kişiye (varsayım: hesap personele bağlı) ───────── */
  var D = null;
  var davetEdilebilir = function () { return MV.PERSONEL.filter(function (p) { return !p.hesap && p.durum === "etkin"; }); };
  function davetCiz(odak) {
    var p = D.kisi ? MV.kisi(D.kisi) : null, yetkili = p ? MV.yetkiliOlabilir(p) : true;
    var eposta = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(D.eposta), hazir = p && eposta && D.roller.length;
    $("a-davet-govde").innerHTML = '<div class="a-form">' +
      '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="d-kisi">Personel <span class="a-zorunlu">zorunlu</span></label>' +
        MK.secim({ id: "d-kisi", ad: "Personel", deger: D.kisi, secenekler: davetEdilebilir().map(function (x) { return [x.id, x.ad, MV.meslekAd(x)]; }), ipucu: "Kişi seçin", tanim: "d-kisi-ipucu" }) +
        '<p class="a-ipucu" id="d-kisi-ipucu">Giriş hesabı olmayan personel. Listede olmayan kişi önce Personel ekranına eklenir.</p></div>' +
      '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="d-eposta">E-posta <span class="a-zorunlu">zorunlu</span></label>' +
        '<input class="a-girdi a-girdi-eposta" id="d-eposta" type="email" inputmode="email" autocomplete="off" maxlength="120" value="' + kacis(D.eposta) + '"' + (D.eposta && !eposta ? ' aria-invalid="true"' : "") + ' aria-describedby="d-eposta-ipucu">' +
        '<p class="a-ipucu' + (D.eposta && !eposta ? " a-ipucu-uyari" : "") + '" id="d-eposta-ipucu">' + (D.eposta && !eposta ? "E-posta biçimi geçersiz." : "Davet bağlantısı bu adrese gider; kişi parolasını kendisi belirler.") + "</p></div>" +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Roller <span class="a-zorunlu">en az bir</span></p><ul class="a-secim-listesi">' +
        MV.ROLLER.map(function (r) {
          var kapali = r.k === "inspector" && !yetkili;
          return '<li><label class="a-secim-satir"><input type="checkbox" data-davet-rol="' + r.k + '"' + (D.roller.indexOf(r.k) >= 0 ? " checked" : "") + (kapali ? " disabled" : "") + ">" +
            '<span class="a-secim-metin"><span class="a-ekipman-ad">' + r.ad + '</span><span class="a-alt-satir">' + (kapali ? "Meslek yetkili kişi mesleği değil; verilemez." : r.acik) + "</span></span></label></li>";
        }).join("") + "</ul></div></div>";
    $("a-davet-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "davet-gonder", ad: "Davet gönder", ikon: "send", kapali: !hazir });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function davetAc(kisi) {
    var p = kisi ? MV.kisi(kisi) : null;
    D = { kisi: p && !p.hesap ? p.id : "", eposta: p && !p.hesap ? p.eposta : "", roller: [] };
    davetCiz(); if (!$("a-davet-pencere").open) $("a-davet-pencere").showModal();
    $("d-kisi").focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/roller") return { v: "roller" };
    if ((m = /^#\/k\/([a-z0-9]+)$/.exec(h))) return { v: "kullanici", id: m[1] };
    if ((m = /^#\/davet(?:\/([a-z0-9]+))?$/.exec(h))) return { v: "liste", davet: true, id: m[1] };
    return { v: "liste" };
  }
  var sonKisi = null;
  function goster(odakla) {
    var r = rota(), p = r.v === "kullanici" ? MV.kisi(r.id) : null;
    if (r.v !== "kullanici" || sonKisi !== r.id) SECILI = null;
    sonKisi = r.id || null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-roller-gorunum").hidden = r.v !== "roller"; $("a-nesne").hidden = r.v !== "kullanici";
    if (r.v === "liste") listeCiz(); else if (r.v === "roller") rollerCiz(); else kullaniciCiz(p);
    document.title = (r.v === "roller" ? "Rol yetkileri" : r.v === "kullanici" ? (p ? p.ad : "Kullanıcı bulunamadı") : "Kullanıcılar") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.davet) davetAc(r.id); else if ($("a-davet-pencere").open) $("a-davet-pencere").close();
  }
  MK.goster = goster;

  var X = MK.eylem;
  X["davet-ac"] = function () { davetAc(); };
  X["davet-gonder"] = function () {
    var p = MV.kisi(D.kisi); if (!p || !D.roller.length) return;
    p.hesap = { durum: "davet", roller: D.roller.slice(), davet: MK.simdi() }; p.eposta = D.eposta;
    $("a-davet-pencere").close(); location.hash = "#/k/" + p.id;
    MK.bildir(p.ad + " davet edildi; bağlantı " + p.eposta + " adresine gönderildi.");
  };
  var aktif = function () { return MV.kisi(rota().id); };
  X["rol-kaydet"] = function () { var p = aktif(); p.hesap.roller = SECILI.slice(); SECILI = null; kullaniciCiz(p); MK.bildir("Roller kaydedildi; kişi bir sonraki girişinde yeni ekranları görür."); };
  X["rol-geri"] = function () { SECILI = null; kullaniciCiz(aktif()); };
  X.sifirla = function () { MK.bildir("Parola sıfırlama bağlantısı " + aktif().eposta + " adresine gönderildi."); };
  X["davet-yinele"] = function () { var p = aktif(); p.hesap.davet = MK.simdi(); kullaniciCiz(p); MK.bildir("Davet yeniden gönderildi."); };
  X.pasiflestir = function () { var p = aktif(); p.hesap.durum = "pasif"; SECILI = null; kullaniciCiz(p); MK.bildir(p.ad + " pasifleştirildi; açık oturumları kapandı."); };
  X.etkinlestir = function () { var p = aktif(); p.hesap.durum = "etkin"; kullaniciCiz(p); MK.bildir(p.ad + " yeniden etkin."); };
  MK.onSecim = function (id, deger) {
    if (id !== "d-kisi") return;
    var p = MV.kisi(deger); D.kisi = deger; D.eposta = p.eposta || "";
    if (!MV.yetkiliOlabilir(p)) D.roller = D.roller.filter(function (r) { return r !== "inspector"; });
    davetCiz();
  };
  MK.onGirdi = function (e) { if (e.target.id === "d-eposta") { D.eposta = e.target.value.trim(); var yer = e.target.selectionStart; davetCiz("d-eposta"); $("d-eposta").setSelectionRange(yer, yer); } };
  document.addEventListener("change", function (e) {
    var t = e.target, r;
    if ((r = t.dataset && t.dataset.rol)) {
      var p = aktif(); SECILI = (SECILI || p.hesap.roller).slice();
      var i = SECILI.indexOf(r); if (t.checked && i < 0) SECILI.push(r); else if (!t.checked && i >= 0) SECILI.splice(i, 1);
      SECILI = MV.ROLLER.map(function (x) { return x.k; }).filter(function (k) { return SECILI.indexOf(k) >= 0; });
      kullaniciCiz(p); var g = document.querySelector('[data-rol="' + r + '"]'); if (g) g.focus();
    } else if ((r = t.dataset && t.dataset.davetRol)) {
      var j = D.roller.indexOf(r); if (t.checked && j < 0) D.roller.push(r); else if (!t.checked && j >= 0) D.roller.splice(j, 1);
      davetCiz(); var d = document.querySelector('[data-davet-rol="' + r + '"]'); if (d) d.focus();
    }
  });
  /* pencere kapanınca adres listeye döner (personel kartındaki "Davet et" #/davet/<id> ile açar) */
  $("a-davet-pencere").addEventListener("close", function () { if (rota().davet) history.replaceState(null, "", "#/"); });

  MK.kabuk({ modul: 1, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("k");
  MK.seciciCiz("k"); goster(false);
})();
