/* ══ probata MAKET — Talepler (modül 21) · ONAY BEKLİYOR (2026-09-28) ═══════════════════════════════════════════════════════════
   Kaynak: pkproje.md §9 otuzuncu tur (reisim: "Masraf formu ve personelin bireysel olarak isteyeceği şeyler sol panelde gözüksün masraf
   plana özel değil genel de olabilir sonuçta muhasebe modülü de denetçide gözükmeyeceği için talepler kısmı olsun denetçi izin talebi
   masraf formu ekleme ve ileride ekleyeceğimiz bir şey olursa buradan ekler").
   Kullanıcı: Mert Kaya (denetçi) — yalnız kendi talepleri. Talep türleri MV.TALEP_TURLERI (yenisi oraya eklenir):
   · İzin talebi → firma yöneticisinin onayına (onay ekranı sonra; öneri: Personel'de) · bekliyor → onaylandı / reddedildi
   · Masraf formu → Muhasebe'de "Onay bekliyor" (plan içinden gönderilenle aynı kayıt, MV.GIDERLER); iş seçilmezse genel masraf
   Bekleyen talep geri çekilebilir. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, rozet = MK.rozet, kirp = MK.kirp, para = MV.para;
  var BEN = "mk", X = MK.eylem, BUGUN = MK.BUGUN;
  var tno = MK.tarihYaz;

  /* ── KAYITLAR: izin talepleri + masraf formları tek listede ──────────────────────────────────────────── */
  function talepler() {
    var iz = MV.IZINLER.filter(function (x) { return x.kisi === BEN; }).map(function (x) { return { tip: "izin", no: x.no, zaman: x.gonderildi, x: x }; });
    var ms = MV.GIDERLER.filter(function (g) { return g.kisi === BEN && g.kaynak === "form"; }).map(function (g) { return { tip: "masraf", no: g.no, zaman: g.gonderildi, x: g }; });
    return iz.concat(ms);
  }
  var durum = function (t) { return t.tip === "izin" ? MV.IZIN_DURUM[t.x.durum] : MV.GIDER_DURUM[t.x.durum]; };
  var bekliyor = function (t) { return t.x.durum === "bekliyor"; };
  var turAd = function (t) { return t.tip === "izin" ? "İzin talebi" : "Masraf formu"; };
  var ayrinti = function (t) {
    var x = t.x;
    return t.tip === "izin" ? MV.izinTur(x.tur).ad + " · " + tno(x.bas) + (x.bit !== x.bas ? " – " + tno(x.bit) : "") + " · " + x.gun + " gün"
      : MV.giderTur(x.tur).ad + " · " + para(x.tutar) + " · " + (x.is ? x.is : "Genel");
  };
  MK.suzgecTanimla("t", { ad: "Taleplerde ara", ipucu: "Talep no, tür, açıklama", birim: "talep", sayfa: 20,
    cipler: [
      { k: "izin", ad: "İzin", grup: "tip", test: function (t) { return t.tip === "izin"; } },
      { k: "masraf", ad: "Masraf", grup: "tip", test: function (t) { return t.tip === "masraf"; } },
      { k: "bekliyor", ad: "Onay bekliyor", grup: "durum", test: bekliyor },
      { k: "sonuc", ad: "Sonuçlanan", grup: "durum", test: function (t) { return !bekliyor(t); } }
    ],
    seciciler: [
      { k: "yil", ad: "Yıl", secenek: function () { return [["tumu", "Tümü"], ["2026", "2026"], ["2025", "2025"]]; }, gecer: function (t, v) { return v === "tumu" || t.zaman.slice(0, 4) === v; } }
    ],
    metin: function (t) { return [t.no, turAd(t), ayrinti(t), t.x.aciklama || ""].join(" "); },
    imkansiz: "Bir talep aynı anda iki türde ya da iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Talep no", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-no" href="#/t/' + t.no + '">' + t.no + '</a><span class="a-alt-satir">' + MK.zamanYaz(t.zaman) + "</span>"; } },
    { k: "tur", baslik: "Talep", kart: "govde", sira: 2, hucre: function (t) { return "<span><b>" + turAd(t) + "</b>" + kirp(ayrinti(t), "a-alt-satir") + "</span>"; } },
    { k: "aciklama", baslik: "Açıklama", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">Açıklama</span>' + (t.x.aciklama ? kirp(t.x.aciklama) : '<span class="a-deger-yok">—</span>'); } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (t) { return rozet(durum(t)); } }
  ];
  function ozetCiz() {
    var o = MV.izinOzet(BEN), b = talepler().filter(bekliyor).length;
    var yuz = function (ad, sayi, not, ik) { return '<div class="a-yuz"><span class="a-yuz-ust">' + ikon(ik, "a-ikon-kucuk") + ad + '</span><span class="a-yuz-sayi">' + sayi + "</span>" + (not ? '<span class="a-yuz-not">' + not + "</span>" : "") + "</div>"; };
    $("a-ozet").innerHTML = yuz("Yıllık izin hakkı", o.hak + " gün", "2026", "calendar") + yuz("Kullanılan", o.kullanilan + " gün", o.bekleyen ? o.bekleyen + " gün onay bekliyor" : "", "calendar-check") +
      yuz("Kalan", o.kalan + " gün", "", "clock") + yuz("Onay bekleyen talep", String(b), "", "inbox");
  }
  function listeCiz() {
    ozetCiz();
    MK.listeCiz({ on: "t", kayitlar: talepler(), sayacId: "a-sayac", listeId: "a-liste", sayfaId: "a-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.zaman < b.zaman ? 1 : a.zaman > b.zaman ? -1 : 0; }); },
      bosVeri: { ikon: "inbox", baslik: "Talep yok", metin: "İzin talebi ya da masraf formu “Yeni talep” ile gönderilir." },
      tablo: { baslik: "Taleplerim", sinif: "a-tablo-talep", sutunlar: SUTUN, href: function (t) { return "#/t/" + t.no; } } });
  }

  /* ── PENCERE: izin talebi · masraf formu · talep ────────────────────────────────────────────────────── */
  var W = null;
  var sayiOku = function (v) { var t = String(v).trim(); return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : NaN; };
  /* işlerim: ekibinde olduğum planlar, en yeni üstte (masraf bir işe bağlanabilir; bağlanmazsa genel) */
  var islerim = function () { return MV.ISLER.filter(function (i) { return (i.ekip || []).indexOf(BEN) >= 0 && i.tarih <= BUGUN; }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }).slice(0, 12); };
  function izinCiz(odak) {
    var d = W.d, h = W.hata, g = d.bas && d.bit && d.bit >= d.bas ? MV.isGunu(d.bas, d.bit) : 0, o = MV.izinOzet(BEN);
    var asim = d.tur === "yillik" && g > o.kalan;
    $("a-pencere-baslik").textContent = "İzin talebi";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-tur", etiket: "İzin türü", zorunlu: true, hata: h.tur, girdi: MK.secim({ id: "w-tur", ad: "İzin türü", deger: d.tur, ipucu: "Tür seçin", gecersiz: !!h.tur, secenekler: MV.IZIN_TUR.map(function (t) { return [t.k, t.ad]; }) }) }) +
      MK.alan({ id: "w-bas", etiket: "Başlangıç", zorunlu: true, hata: h.bas, girdi: MK.zaman({ id: "w-bas", ad: "İzin başlangıcı", deger: d.bas }) }) +
      MK.alan({ id: "w-bit", etiket: "Bitiş", zorunlu: true, hata: h.bit, sonuc: g ? g + " iş günü" : "", uyari: asim ? g + " iş günü · kalan yıllık izin " + o.kalan + " gün" : "", girdi: MK.zaman({ id: "w-bit", ad: "İzin bitişi", deger: d.bit }) }) +
      MK.alan({ id: "w-aciklama", etiket: "Açıklama", genis: true, girdi: MK.girdi({ id: "w-aciklama", alan: "aciklama", deger: d.aciklama, ek: ' maxlength="160"' }) }) +
      (d.tur === "rapor" ? '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sağlık raporu</p><div class="a-dosya">' + (d.belge ? MK.dosyaAlan({ ad: d.belge, degistir: "belge-sec", sil: "belge-kaldir" }) : MK.tus({ eylem: "belge-sec", ad: "Belge ekle", ikon: "upload", sinif: "a-tus-ikincil" })) + "</div></div>" : "") + "</div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "izin-gonder", ad: "Gönder", ikon: "send" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function masrafCiz(odak) {
    var d = W.d, h = W.hata, n = sayiOku(d.tutar), k = n > 0 ? MV.giderKdv({ tutar: n, oran: +d.oran }) : null;
    $("a-pencere-baslik").textContent = "Masraf formu";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-is", etiket: "İş", genis: true, girdi: MK.secim({ id: "w-is", ad: "İş", deger: d.is, secenekler: [["", "Genel (işe bağlı değil)"]].concat(islerim().map(function (i) { return [i.no, i.no + " · " + MV.tesis(i.tesis).ad, MK.tarihYaz(i.tarih)]; })) }) }) +
      MK.alan({ id: "w-tarih", etiket: "Tarih", zorunlu: true, hata: h.tarih, girdi: MK.zaman({ id: "w-tarih", ad: "Masraf tarihi", deger: d.tarih }) }) +
      MK.alan({ id: "w-gtur", etiket: "Tür", zorunlu: true, hata: h.gtur, girdi: MK.secim({ id: "w-gtur", ad: "Tür", deger: d.gtur, gecersiz: !!h.gtur, ipucu: "Tür seçin", secenekler: MV.GIDER_TUR.map(function (t) { return [t[0], t[1]]; }) }) }) +
      MK.alan({ id: "w-tutar", etiket: "Tutar (KDV dahil)", zorunlu: true, hata: h.tutar, girdi: MK.girdi({ id: "w-tutar", alan: "tutar", deger: d.tutar, sinif: "a-girdi-sicil", ek: ' inputmode="decimal"', hata: h.tutar }) }) +
      MK.alan({ id: "w-oran", etiket: "KDV oranı", sonuc: k ? "KDV " + para(k.kdv) + " · KDV hariç " + para(k.haric) : "", girdi: MK.secim({ id: "w-oran", ad: "KDV oranı", deger: String(d.oran), secenekler: MV.KDV_ORAN.map(function (o) { return [String(o), "%" + o]; }) }) }) +
      MK.alan({ id: "w-aciklama", etiket: "Açıklama", genis: true, girdi: MK.girdi({ id: "w-aciklama", alan: "aciklama", deger: d.aciklama, ek: ' maxlength="120"' }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Fiş</p><div class="a-dosya">' + (d.belge ? MK.dosyaAlan({ ad: d.belge, degistir: "belge-sec", sil: "belge-kaldir" }) : MK.tus({ eylem: "belge-sec", ad: "Fiş ekle", ikon: "camera", sinif: "a-tus-ikincil" })) + "</div></div></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "masraf-gonder", ad: "Gönder", ikon: "send" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function talepCiz(t) {
    var x = t.x, sat = function (e, v) { return '<div class="a-satir"><dt>' + e + "</dt><dd>" + v + "</dd></div>"; };
    $("a-pencere-baslik").textContent = turAd(t) + " · " + t.no;
    $("a-pencere-govde").innerHTML = '<dl class="a-satirlar">' + sat("Durum", rozet(durum(t))) + sat("Gönderildi", MK.zamanYaz(t.zaman)) +
      (t.tip === "izin" ? sat("İzin türü", kacis(MV.izinTur(x.tur).ad)) + sat("Tarih", tno(x.bas) + (x.bit !== x.bas ? " – " + tno(x.bit) : "")) + sat("Süre", x.gun + " iş günü") +
          (x.onaylayan ? sat(x.durum === "red" ? "Reddeden" : "Onaylayan", kacis(MV.kisi(x.onaylayan).ad) + (x.karar ? " · " + MK.zamanYaz(x.karar) : "")) : "") + (x.red ? sat("Red gerekçesi", kacis(x.red)) : "")
        : sat("İş", x.is ? '<span class="a-kod">' + x.is + "</span>" : "Genel (işe bağlı değil)") + sat("Tarih", tno(x.tarih)) + sat("Tür", kacis(MV.giderTur(x.tur).ad)) +
          sat("Tutar (KDV dahil)", '<span class="a-sayi">' + para(x.tutar) + "</span> · %" + x.oran + " KDV") + (x.odeme ? sat("Ödendi", tno(x.odeme)) : "") + (x.red ? sat("Red gerekçesi", kacis(x.red)) : "")) +
      sat("Açıklama", x.aciklama ? kacis(x.aciklama) : "-") + /* bekleyen talebin eki değiştirilir / silinir; karar verilmişse yalnız açılır (2026-09-28) */
      (x.belge ? sat(t.tip === "izin" ? "Belge" : "Fiş", MK.dosyaAlan({ ad: x.belge, degistir: "talep-belge-degistir", sil: "talep-belge-sil", veri: { no: t.no }, oku: !bekliyor(t) }))
        : bekliyor(t) ? sat(t.tip === "izin" ? "Belge" : "Fiş", MK.tus({ eylem: "talep-belge-degistir", ad: t.tip === "izin" ? "Belge ekle" : "Fiş ekle", ikon: "upload", sinif: "a-tus-ikincil", veri: { no: t.no } })) : "") + "</dl>";
    /* T8: talebin formu (firma formatı; temel KM-FR-IZN-01 / MSR-01) PDF olarak açılır, indirilir, e-postayla iletilir */
    $("a-pencere-alt").innerHTML = (bekliyor(t) ? MK.tus({ eylem: "geri-cek", ad: "Talebi geri çek", ikon: "undo-2", sinif: "a-tus-ikincil", veri: { no: t.no } }) : "") +
      MK.tus({ eylem: "talep-pdf", ad: "PDF · e-posta", ikon: "file-text", sinif: "a-tus-ikincil", veri: { no: t.no } }) + MK.tus({ eylem: "pencere-kapat", ad: "Kapat" });
  }
  X["talep-pdf"] = function (el) {
    var t = talepler().filter(function (y) { return y.no === el.dataset.no; })[0]; if (!t) return;
    MB.talepPdfAc({ tip: t.tip, x: t.x, kime: MB.talepAlici(t.tip), gonderen: MV.kisi(BEN) });
  };
  function pencereAc(o, odak) { W = o; W.hata = W.hata || {}; if (o.tip === "izin") izinCiz(); else if (o.tip === "masraf") masrafCiz(); else talepCiz(o.t); if (!$("a-pencere").open) $("a-pencere").showModal(); var el = $(odak) || $("a-pencere-alt").querySelector(".a-tus-birincil"); if (el) el.focus(); }
  $("a-pencere").addEventListener("close", function () { if ($("a-pencere").open) return; W = null; if (/^#\/(yeni|t\/)/.test(location.hash)) history.replaceState(null, "", "#/"); });
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (!k || !W || !W.d) return; W.d[k] = e.target.value;
    if (k === "tutar" && W.tip === "masraf") { var n = sayiOku(W.d.tutar), p = $("w-oran-ipucu"); if (n > 0) { var kk = MV.giderKdv({ tutar: n, oran: +W.d.oran }); if (!p) { p = document.createElement("p"); p.className = "a-ipucu"; p.id = "w-oran-ipucu"; $("w-oran").closest(".a-alan-grup").appendChild(p); } p.textContent = "KDV " + para(kk.kdv) + " · KDV hariç " + para(kk.haric); } else if (p) p.remove(); } };
  MK.onSecim = function (id, deger) {
    if (!W || !W.d) return; var k = id.slice(2); W.d[k] = deger; delete W.hata[k];
    if (k === "gtur") W.d.oran = MV.giderTur(deger).kdv;
    if (W.tip === "izin") izinCiz(id); else masrafCiz(id);
  };
  MK.onZaman = function (id, deger) { if (!W || !W.d) return; var k = id.slice(2); W.d[k] = deger; delete W.hata[k]; if (W.tip === "izin") { if (k === "bas" && (!W.d.bit || W.d.bit < deger)) W.d.bit = deger; izinCiz(id); } };
  X["belge-sec"] = function () {
    var d = W.d, izin = W.tip === "izin";
    MK.dosyaSec({ kabul: "image/*,.pdf", enCokMB: 10, ornek: izin ? "saglik-raporu-" + (d.bas || BUGUN).replace(/-/g, "") + ".pdf" : "fis-" + (d.tarih || BUGUN).replace(/-/g, "") + "-" + (d.gtur || "masraf") + ".jpg" }, function (ad) {
      if (!W) return; d.belge = ad; if (izin) izinCiz(); else masrafCiz(); document.querySelector('#a-pencere [data-eylem="belge-sec"]').focus();
    });
  };
  X["belge-kaldir"] = function () { if (!W || !W.d) return; W.d.belge = ""; if (W.tip === "izin") izinCiz(); else masrafCiz(); document.querySelector('#a-pencere [data-eylem="belge-sec"]').focus(); };
  X["talep-belge-degistir"] = function () {
    var t = W.t, x = t.x;
    MK.dosyaSec({ kabul: "image/*,.pdf", enCokMB: 10, ornek: t.no.toLowerCase() + "-ek.pdf" }, function (ad) {
      if (!W) return; if (x.belge && x.belge !== ad) MK.dosyaSil(x.belge); x.belge = ad; talepCiz(t); var e = document.querySelector('#a-pencere [data-eylem="talep-belge-degistir"]'); if (e) e.focus(); MK.bildir("Ek kaydedildi.");
    });
  };
  X["talep-belge-sil"] = function () {
    var t = W.t, x = t.x;
    MK.onayla({ baslik: "Eki sil", metin: x.belge + " talepten silinir.", tamam: function () { MK.dosyaSil(x.belge); x.belge = ""; if (W) talepCiz(t); MK.bildir("Ek silindi."); } });
  };
  /* gönderilen talep aynı pencerede açılır (PDF · e-posta hemen elde); adres talebin adresi olur */
  function kayitliAc(no) { history.replaceState(null, "", "#/t/" + no); pencereAc({ tip: "talep", t: talepler().filter(function (y) { return y.no === no; })[0] }); }
  X["izin-gonder"] = function () {
    var d = W.d, h = {};
    if (!d.tur) h.tur = "İzin türü seçilmeli.";
    if (!d.bas) h.bas = "Başlangıç seçilmeli.";
    if (!d.bit) h.bit = "Bitiş seçilmeli."; else if (d.bas && d.bit < d.bas) h.bit = "Bitiş başlangıçtan önce olamaz.";
    W.hata = h; if (Object.keys(h).length) { izinCiz("w-" + Object.keys(h)[0]); return; }
    /* 2026-09-29 (V3): talep eden formu firmanın yöntemiyle (mobil imza / e-imza) imzalayarak gönderir */
    MK.imzaAl({ belge: "İzin talep formu", imzacilar: [MV.kisi(BEN).ad], tamam: function (im) {
      var x = { no: MV.izinNo(d.bas), kisi: BEN, tur: d.tur, bas: d.bas, bit: d.bit, gun: MV.isGunu(d.bas, d.bit), aciklama: d.aciklama.trim(), belge: d.belge, durum: "bekliyor", gonderildi: MK.simdi(), imza: im };
      MV.IZINLER.push(x); listeCiz(); kayitliAc(x.no);
      MK.bildir(x.no + " imzalandı ve gönderildi: " + x.gun + " iş günü " + MV.izinTur(x.tur).ad.toLocaleLowerCase("tr") + "; yöneticinin onayında.");
    } });
  };
  X["masraf-gonder"] = function () {
    var d = W.d, h = {}, n = sayiOku(d.tutar);
    if (!d.tarih) h.tarih = "Tarih seçilmeli."; else if (d.tarih > BUGUN) h.tarih = "İleri tarihli masraf gönderilmez.";
    if (!d.gtur) h.gtur = "Tür seçilmeli.";
    if (!(n > 0)) h.tutar = "Tutar sıfırdan büyük olmalı (ör. 1.250,00).";
    W.hata = h; if (Object.keys(h).length) { masrafCiz("w-" + Object.keys(h)[0]); return; }
    MK.imzaAl({ belge: "Masraf formu", imzacilar: [MV.kisi(BEN).ad], tamam: function (im) {
      var g = { no: MV.giderNo(d.tarih), tarih: d.tarih, tur: d.gtur, tutar: Math.round(n * 100) / 100, oran: +d.oran, is: d.is || null, kisi: BEN, aciklama: d.aciklama.trim(), belge: d.belge,
        kaynak: "form", durum: "bekliyor", gonderildi: MK.simdi(), odeme: null, onaylayan: null, kaydeden: BEN, imza: im };
      MV.GIDERLER.push(g); listeCiz(); kayitliAc(g.no);
      MK.bildir(g.no + " imzalandı, muhasebeye (" + MB.talepAlici("masraf").map(function (p) { return p.ad; }).join(", ") + ") gönderildi" + (g.is ? " (" + g.is + ")" : " (genel masraf)") + "; onaylanınca ödenir.");
    } });
  };
  X["geri-cek"] = function (el) {
    var t = talepler().filter(function (y) { return y.no === el.dataset.no; })[0]; if (!t || !bekliyor(t)) return;
    if (t.tip === "izin") MV.IZINLER.splice(MV.IZINLER.indexOf(t.x), 1); else MV.GIDERLER.splice(MV.GIDERLER.indexOf(t.x), 1);
    $("a-pencere").close(); listeCiz(); MK.bildir(t.no + " geri çekildi.");
  };

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function goster(odakla) {
    var h = location.hash, m;
    $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t"); MK.suzgecKur("t");
    if (/^#\/yeni\/izin/.test(h)) { if (!W) pencereAc({ tip: "izin", d: { tur: "", bas: "", bit: "", aciklama: "", belge: "" } }, "w-tur"); }
    else if (/^#\/yeni\/masraf/.test(h)) { if (!W) pencereAc({ tip: "masraf", d: { is: "", tarih: BUGUN, gtur: "", tutar: "", oran: 20, aciklama: "", belge: "" } }, "w-gtur"); }
    else if ((m = /^#\/t\/([A-Z0-9-]+)$/.exec(h))) { var t = talepler().filter(function (y) { return y.no === m[1]; })[0]; if (t) pencereAc({ tip: "talep", t: t }); else { history.replaceState(null, "", "#/"); MK.bildir("Bu adreste talep yok."); } }
    else if ($("a-pencere").open) $("a-pencere").close();
    if (odakla && !W) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.kabuk({ modul: 21, kullanici: { bas: "MK", ad: "Mert Kaya", rol: "Denetçi" } });
  goster(false);
})();
