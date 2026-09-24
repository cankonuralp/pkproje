/* ══ probata MAKET M6 — Plan aç (modül 13, planlama ekibi) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════
   Kaynak: MAKET-PLANI M6 ("müşteri → tesis → tarih → inspector → ekipman kapsamı; proje no sunucuda"), pkproje.md §3.4 (plan
   bilgisi: proje no · başlangıç · adres · inspector · İSG-KATİP · açıklama + kapsam tür başına; tesiste kayıtlı ekipmanı plana
   planlama ekibi de alır — karar 22), §3.5 (proje no P-AAYY-SIRA, sunucu verir), §3.2 madde 2 (kabul ön koşulları: İSG-KATİP,
   EKİPNET, meslek × tür). Tek sayfa form: bölümler sırayla dolar, sağ altta özet; eksikler planı açmayı ENGELLEMEZ (varsayım),
   kabulü durdurur ve özette adıyla yazılır. Kullanıcı: planlama ekibinden Zeynep Arslan. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var ARALIK = 30;   /* "kontrolü geliyor": sonraki kontrol plan tarihinden en çok 30 gün sonra (varsayım; kalibrasyon uyarısıyla aynı eşik) */
  var sorgu = function () { var m = /\?(.*)$/.exec(location.hash), o = {}; (m ? m[1] : "").split("&").forEach(function (x) { var y = x.split("="); if (y[0]) o[y[0]] = decodeURIComponent(y[1] || ""); }); return o; };
  var tarihIso = function (s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((s || "").trim()); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00");
    return isNaN(d) || d.getDate() !== +m[1] || d.getMonth() + 1 !== +m[2] ? null : iso;
  };
  var gg = function (iso) { return iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4); };
  var saatOk = function (s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(s || ""); };
  var enGec = function (tarih) { return MK.gunKisa(new Date(new Date(tarih + "T12:00:00") - 864e5).toISOString()); };
  var sureYaz = function (dk) { return (dk >= 60 ? Math.floor(dk / 60) + " sa " : "") + (dk % 60 ? dk % 60 + " dk" : ""); };
  var bransAd = MV.bransAd;

  /* ── FORM DURUMU ──────────────────────────────────────────────────────────────────────────────────── */
  var F = null, SONUC = null;
  function formAc(q) {
    F = { musteri: "", tesis: "", tarih: "", bas: "09:00", bit: "12:00", aciklama: "", ekip: [], sec: {}, yeni: [], yeniTur: "", yeniAdet: "1", hata: {} };
    SZ.k.secili = []; SZ.k.ara = ""; SZ.k.sayfa = 1; SZ.k.sec.tur = "tumu";
    if (q.tesis && MV.tesis(q.tesis)) { F.musteri = MV.tesis(q.tesis).m; tesisSec(q.tesis); }
    else if (q.musteri && MV.musteri(q.musteri)) F.musteri = q.musteri;
  }
  /* tesis seçilince: tarih tesisin sonraki kontrolü (geçmişse bugün), kontrolü gelen ekipman seçili gelir (açık plandakiler hariç) */
  function tesisSec(tid) {
    var t = MV.tesis(tid); F.tesis = tid; F.ekip = []; F.yeni = []; F.sec = {};
    F.tarih = gg(t.sonraki >= MK.BUGUN ? t.sonraki : MK.BUGUN);
    ekipmanlar().forEach(function (e) { if (!acikta(e) && geldi(e)) F.sec[e.kod] = true; });
  }
  var planGunu = function () { return tarihIso(F.tarih) || MK.BUGUN; };
  var ekipmanlar = function () { return MV.EKIPMAN.filter(function (e) { return e.tesis === F.tesis; }); };
  /* ekipman başka AÇIK planın kapsamındaysa o plan (aynı ekipman iki açık planda olmaz — varsayım) */
  var acikta = function (e) { var t = MV.tesis(e.tesis); return e.plan && MV.acikPlan(t) && t.pid === e.plan ? t : null; };
  var geldi = function (e) { var s = MV.sonrakiKontrol(e); return !s || MK.gunFarki(planGunu(), s) <= ARALIK; };
  var secililer = function () { return ekipmanlar().filter(function (e) { return F.sec[e.kod]; }); };
  /* kapsam tür başına: kayıtlı (seçili) + sahada kaydedilecek yeni */
  function kapsam() {
    var m = {};
    secililer().forEach(function (e) { (m[e.tur] = m[e.tur] || { tur: MV.tur(e.tur), kayitli: 0, yeni: 0 }).kayitli++; });
    F.yeni.forEach(function (y) { (m[y.tur] = m[y.tur] || { tur: MV.tur(y.tur), kayitli: 0, yeni: 0 }).yeni += y.adet; });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return a.tur.b === b.tur.b ? a.tur.ad.localeCompare(b.tur.ad, "tr") : a.tur.b === "m" ? -1 : 1; });
  }
  var kapsamToplam = function (l) { return l.reduce(function (n, x) { return n + x.kayitli + x.yeni; }, 0); };

  /* ── INSPECTOR ADAYI: bu tesis ve tarih için kabul ön koşulları (§3.2 madde 2) + aynı gün başka plan ─────────── */
  var adaylar = function () { return MV.PERSONEL.filter(function (p) { return p.durum === "etkin" && p.hesap && p.hesap.roller.indexOf("inspector") >= 0; }); };
  /* türe yetkili: meslek Ek-III grubuna izin veriyor (2c öneri) VE firma o gruba yetkilendirmiş (17020 yetkinlik matrisi, M1) */
  var yetkili = function (p, tur) { return MV.meslek(p.meslek).g.indexOf(tur.g) >= 0 && !!p.yetki[tur.g]; };
  function cakismalar(k, gun) {
    return MV.TESISLER.filter(function (t) { return MV.acikPlan(t) && t.ptarih === gun && t.pekip.indexOf(k) >= 0; })
      .map(function (t) { return { t: t, ust: F.bas < t.psaat[1] && t.psaat[0] < F.bit }; });
  }
  function adayDurum(p) {
    var gun = tarihIso(F.tarih), x = MV.isgTesis(F.tesis).filter(function (y) { return y.k === p.id; })[0], e = [];
    var isg = !x ? { tur: "yok" } : gun && !MV.isgUygun(x.onay, gun) ? { tur: "gec", x: x } : { tur: "tamam", x: x };
    if (isg.tur === "yok") e.push("İSG-KATİP kaydı yok");
    else if (isg.tur === "gec") e.push("İSG-KATİP onayı geç (en geç " + enGec(gun) + ")");
    (MV.kabulEksik(p) || []).forEach(function (m) { e.push(m); });
    if (p.hesap.durum !== "etkin") e.push("Giriş daveti kabul edilmedi");
    var k = kapsam(), top = kapsamToplam(k), yet = k.reduce(function (n, x) { return n + (yetkili(p, x.tur) ? x.kayitli + x.yeni : 0); }, 0);
    return { isg: isg, eksik: e, cak: gun ? cakismalar(p.id, gun) : [], yet: yet, top: top };
  }

  /* ── KAPSAM LİSTESİ (tesisin kayıtlı ekipmanı; süzgeç ve 10'ar sayfa ortak üreticiden) ───────────────────────── */
  MK.suzgecTanimla("k", { ad: "Ekipmanlarda ara", ipucu: "Kod, tür, konum", birim: "ekipman", sayfa: 10,
    cipler: [
      { k: "geldi", ad: "Kontrolü geliyor", test: function (e) { return !acikta(e) && geldi(e); } },
      { k: "secili", ad: "Seçili", test: function (e) { return !!F.sec[e.kod]; } }
    ],
    seciciler: [{ k: "tur", ad: "Tür", secenek: function () {
      var l = ekipmanlar().map(function (e) { return e.tur; }).filter(function (k, i, a) { return a.indexOf(k) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.tur(k).ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (e, v) { return v === "tumu" || e.tur === v; } }],
    metin: function (e) { return [e.kod, MV.tur(e.tur).ad, e.konum].join(" "); },
    imkansiz: "" }, function () { kapsamListeCiz(); });
  var EKP_SUTUN = [
    { k: "sec", baslik: "Ekipman", kart: "ust", sira: 1, hucre: function (e) {
      var t = acikta(e);
      return '<label class="a-onay-kutusu"><input type="checkbox" id="p-e-' + e.kod + '" data-ekp="' + e.kod + '"' + (F.sec[e.kod] ? " checked" : "") + (t ? " disabled" : "") + ">" +
        '<span><span class="a-kod">' + e.kod + "</span>" + (t ? '<span class="a-alt-satir">' + t.plan + " kapsamında</span>" : "") + "</span></label>";
    } },
    { k: "tur", baslik: "Tür", kart: "govde", sira: 2, hucre: function (e) { var t = MV.tur(e.tur); return '<span class="a-kart-etiket">Tür</span><span>' + kirp(t.ad) + '<span class="a-alt-satir">' + bransAd(t.b) + "</span></span>"; } },
    { k: "konum", baslik: "Konum", kart: "govde", sira: 3, hucre: function (e) { return '<span class="a-kart-etiket">Konum</span>' + kirp(e.konum); } },
    { k: "sonraki", baslik: "Sonraki kontrol", kart: "govde", sira: 4, hucre: function (e) {
      var s = MV.sonrakiKontrol(e); return '<span class="a-kart-etiket">Sonraki kontrol</span>' + (s ? MK.tarihYaz(s) : '<span class="a-deger-yok">İlk kontrol</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (e) {
      if (acikta(e)) return rozet({ ad: "Açık planda", rozet: "a-rozet-notr" });
      if (!MV.sonrakiKontrol(e)) return rozet({ ad: "İlk kontrol", rozet: "a-rozet-bekliyor" });
      return geldi(e) ? rozet({ ad: "Kontrolü geliyor", rozet: "a-rozet-bekliyor" }) : '<span class="a-deger-yok">—</span>';
    } }
  ];
  function kapsamListeCiz() {
    if (!F.tesis || !$("p-kapsam-liste")) return;
    MK.listeCiz({ on: "k", kayitlar: ekipmanlar(), sayacId: "p-kapsam-sayac", listeId: "p-kapsam-liste", sayfaId: "p-kapsam-sayfa",
      sirala: function (l) { return l.slice().sort(function (a, b) { return (acikta(a) ? 1 : 0) - (acikta(b) ? 1 : 0) || (MV.sonrakiKontrol(a) || "").localeCompare(MV.sonrakiKontrol(b) || "") || a.kod.localeCompare(b.kod); }); },
      bosVeri: "<p class=\"a-bos-satir\">Bu tesiste kayıtlı ekipman yok; kapsam aşağıdaki yeni ekipmanla kurulur.</p>",
      tablo: { baslik: "Tesisteki ekipmanlar", sinif: "a-tablo-planekp", sutunlar: EKP_SUTUN } });
  }

  /* ── ÇİZİM ───────────────────────────────────────────────────────────────────────────────────────────── */
  function alan(id, etiket, girdi, ipucu, zorunlu, genis) { return MK.alan({ id: "p-" + id, etiket: etiket, girdi: girdi, ipucu: ipucu, hata: F.hata[id], zorunlu: zorunlu, genis: genis }); }
  function girdi(id, sinif, ek) { return MK.girdi({ id: "p-" + id, alan: id, deger: F[id], sinif: sinif, ek: ek, hata: F.hata[id] }); }
  var bolum = function (no, id, baslik, ic, genis, ek) {
    return '<section class="a-form-bolum' + (genis ? " a-alan-genis" : "") + '" aria-labelledby="p-b' + no + '"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="p-b' + no + '">' + no + " · " + baslik + "</h2>" + (ek || "") + "</div>" + ic + "</section>";
  };
  var hataP = function (k) { return F.hata[k] ? '<p class="a-ipucu a-ipucu-uyari" id="p-' + k + '-ipucu">' + F.hata[k] + "</p>" : ""; };
  function formCiz(odak) {
    var m = F.musteri ? MV.musteri(F.musteri) : null, t = F.tesis ? MV.tesis(F.tesis) : null;
    var musteriler = MV.MUSTERILER.map(function (x) { return [x.id, x.kisa, MV.tesisleri(x.id).length + " tesis"]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); });
    var tesisler = m ? MV.tesisleri(m.id).map(function (x) { return [x.id, x.ad, x.ilce + " / " + x.il]; }) : [];
    var hk = Object.keys(F.hata).length;
    $("a-form-gorunum").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], ["Plan aç"]]) +
      '<div class="a-sayfa-bas"><h1 tabindex="-1">Plan aç</h1></div>' +
      (hk ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-alert", "Plan açılmadı: " + hk + " eksik düzeltilmeli.", "p-ozet-hata") + "</div>" : "") +
      /* üstte iki kısa bölüm yan yana (iç ızgara: iki bölüm kabı doldurur, kalıp 10), altında üç geniş bölüm */
      '<div class="a-form-sayfa"><div class="a-form-sayfa a-alan-genis">' +
        bolum(1, "b1", "Müşteri ve tesis", '<div class="a-form">' +
          alan("musteri", "Müşteri", MK.secim({ id: "p-musteri", ad: "Müşteri", deger: F.musteri, secenekler: musteriler, ipucu: "Müşteri seçin", gecersiz: !!F.hata.musteri, tanim: "p-musteri-ipucu" }), m ? kacis(m.unvan) : "", true, true) +
          alan("tesis", "Tesis", m ? MK.secim({ id: "p-tesis", ad: "Tesis", deger: F.tesis, secenekler: tesisler, ipucu: "Tesis seçin", gecersiz: !!F.hata.tesis, tanim: "p-tesis-ipucu" })
            : '<input class="a-girdi a-girdi-oku" id="p-tesis" readonly value="Önce müşteri seçin" aria-describedby="p-tesis-ipucu">', t ? kacis(t.adres) + ", " + t.ilce + " / " + t.il : "", true, true) +
          "</div>" + (t ? tesisSeritleri(t) : "")) +
        bolum(2, "b2", "Tarih ve saat", '<div class="a-form">' +
          alan("tarih", "Başlangıç", girdi("tarih", "a-girdi-sicil", ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"'), t ? "Tesisin sonraki kontrolü " + MK.tarihYaz(t.sonraki) : "GG.AA.YYYY", true, true) +
          alan("bas", "Başlangıç saati", girdi("bas", "a-girdi-sicil", ' inputmode="numeric" maxlength="5"'), "SS:DD", true) +
          alan("bit", "Bitiş saati", girdi("bit", "a-girdi-sicil", ' inputmode="numeric" maxlength="5"'), '<span id="p-sure">' + sureIpucu() + "</span>", true) +
          '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="p-aciklama">Açıklama</label><textarea class="a-alan a-alan-ince" id="p-aciklama" data-alan="aciklama" maxlength="300" placeholder="Giriş izni, refakat, saatler">' + kacis(F.aciklama) + "</textarea>" +
            '<p class="a-ipucu">Plan içinde "Planlandı" adımında görünür; müşteri görmez.</p></div>' +
          "</div>") + "</div>" +
        bolum(3, "b3", "Inspector", '<div id="p-aday-kap"></div>', true) +
        bolum(4, "b4", "Kapsam", t ? kapsamHtml() : '<p class="a-bos-satir">Önce tesis seçin: tesisin kayıtlı ekipmanı burada listelenir, kontrolü gelenler seçili gelir.</p>', true,
          t ? '<span class="a-sayac" id="p-secili" aria-live="polite"></span>' : "") +
        bolum(5, "b5", "Özet ve kabul ön koşulları", '<div id="p-ozet-kap"></div>', true) +
      "</div>" +
      '<div class="a-form-eylem"><p class="a-adim-not">Proje no kaydedince verilir.</p>' +
        '<a class="a-tus a-tus-ikincil" href="' + MK.adres(13, "#/") + '">Vazgeç</a>' + MK.tus({ eylem: "plani-ac", ad: "Planı aç", ikon: "calendar-check" }) + "</div>";
    if (t) { $("a-suzgec-kap-k").innerHTML = MK.suzgecHtml("k"); MK.suzgecKur("k"); }
    bagimliCiz();
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function tesisSeritleri(t) {
    var s = "";
    if (MV.acikPlan(t)) s += MK.serit("uyari", "triangle-alert", "Bu tesiste açık plan var: <b>" + t.plan + "</b> · " + MK.gunKisa(t.ptarih) + " · " + MV.PLAN_DURUM[t.pdurum].ad + ". Kapsamındaki ekipman bu plana alınamaz.");
    if (!MV.isgTesis(t.id).length) s += MK.serit("uyari", "triangle-alert", "Bu tesiste hiçbir inspector'ın İSG-KATİP kaydı yok: plan açılır ama kayıt girilene kadar kabul edilemez.");
    return s ? '<div class="a-uyari-serit a-bolum-serit">' + s + "</div>" : "";
  }
  function sureIpucu() {
    var k = F.tesis ? kapsam() : [], dk = k.reduce(function (n, x) { return n + (x.kayitli + x.yeni) * (x.tur.sure || 0); }, 0);
    return dk ? "Kapsamın tahmini süresi " + sureYaz(dk) + " (tür sürelerinden)" : "SS:DD";
  }
  function kapsamHtml() {
    var turler = MV.KATALOG.map(function (x) { return [x.k, x.ad, bransAd(x.b)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); });
    return '<p class="a-bolum-aciklama">Tesiste kayıtlı ekipmandan plana alınacaklar. Kontrolü ' + ARALIK + " gün içinde gelenler ve ilk kontrolü yapılacaklar seçili gelir.</p>" +
      '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "kontrolu-gelen", ad: "Kontrolü gelenleri seç", ikon: "list-checks", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "secimi-temizle", ad: "Seçimi temizle", ikon: "x", sinif: "a-tus-ikincil" }) + "</div>" +
      '<div id="a-suzgec-kap-k"></div>' +
      '<p class="a-sayac" id="p-kapsam-sayac" aria-live="polite"></p>' +
      '<div class="a-liste-kap" id="p-kapsam-liste"></div><div id="p-kapsam-sayfa"></div>' +
      '<h3 class="a-alt-baslik a-bolum-serit">Sahada kaydedilecek yeni ekipman</h3>' +
      '<p class="a-bolum-aciklama">Tesiste henüz kaydı olmayan ekipman: tür ve adet planlanır, inspector sahada kodla kaydeder (Planlar · Ekipman ekle).</p>' +
      '<div class="a-form">' +
        alan("yeniTur", "Tür", MK.secim({ id: "p-yeniTur", ad: "Tür", deger: F.yeniTur, secenekler: turler, ipucu: "Tür seçin", gecersiz: !!F.hata.yeniTur, tanim: "p-yeniTur-ipucu" }), "", false) +
        alan("yeniAdet", "Adet", girdi("yeniAdet", "a-girdi-sicil", ' inputmode="numeric" maxlength="2"'), "", false) +
      "</div>" +
      '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "yeni-ekle", ad: "Kapsama ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>" +
      (F.yeni.length ? '<div class="a-uyari-serit a-bolum-serit">' + F.yeni.map(function (y) {
        var t = MV.tur(y.tur);
        return '<div class="a-serit a-serit-bilgi">' + ikon("plus", "a-ikon-kucuk") + "<span><b>" + kacis(t.ad) + " × " + y.adet + "</b> · " + bransAd(t.b) + " · sahada kodla kaydedilir</span>" +
          MK.tus({ eylem: "yeni-kaldir", ad: "Kaldır", sinif: "a-tus-ikincil a-serit-tus", veri: { tur: y.tur } }) + "</div>";
      }).join("") + "</div>" : "") + hataP("kapsam");
  }
  /* bölüm 3 ve 5 (+ seçili sayacı, süre ipucu): tarih, saat, seçim değişince yeniden çizilir; yazılan alana dokunmaz (odak kaçmaz) */
  var ADAY_SUTUN = [
    { k: "ad", baslik: "Inspector", kart: "ust", sira: 1, hucre: function (p) {
      return '<label class="a-onay-kutusu"><input type="checkbox" id="p-a-' + p.id + '" data-aday="' + p.id + '"' + (F.ekip.indexOf(p.id) >= 0 ? " checked" : "") + ">" +
        "<span>" + kacis(p.ad) + '<span class="a-alt-satir">' + kacis(MV.meslekAd(p)) + "</span></span></label>";
    } },
    { k: "isg", baslik: "İSG-KATİP (bu tesis)", kart: "govde", sira: 2, hucre: function (p, d) {
      return '<span class="a-kart-etiket">İSG-KATİP</span>' + (d.isg.tur === "yok" ? '<span class="a-uyari-metin">Kayıt yok</span>'
        : '<span><span class="a-kod">' + kacis(d.isg.x.no) + "</span>" + (d.isg.tur === "gec" ? '<span class="a-uyari-metin">Geç onay · ' + MK.gunKisa(d.isg.x.onay) + "</span>" : '<span class="a-alt-satir">onay ' + MK.gunKisa(d.isg.x.onay) + "</span>") + "</span>");
    } },
    { k: "ekipnet", baslik: "EKİPNET", kart: "govde", sira: 3, hucre: function (p) { return '<span class="a-kart-etiket">EKİPNET</span>' + (p.ekipnet ? '<span class="a-kod">' + p.ekipnet + "</span>" : '<span class="a-uyari-metin">Eksik</span>'); } },
    { k: "yet", baslik: "Kapsamda yetkili", kart: "govde", sira: 4, hucre: function (p, d) {
      return '<span class="a-kart-etiket">Kapsamda yetkili</span>' + (!d.top ? '<span class="a-deger-yok">—</span>' : d.yet ? d.yet + " / " + d.top + " ekipman" : '<span class="a-uyari-metin">Yetkili türü yok</span>');
    } },
    { k: "gun", baslik: "Aynı gün", kart: "govde", sira: 5, hucre: function (p, d) {
      return '<span class="a-kart-etiket">Aynı gün</span>' + (d.cak.length ? "<span>" + d.cak.map(function (c) {
        return '<span class="' + (c.ust ? "a-uyari-metin" : "a-alt-satir") + '">' + c.t.plan + " · " + c.t.psaat[0] + "–" + c.t.psaat[1] + (c.ust ? " (çakışıyor)" : "") + "</span>";
      }).join("") + "</span>" : '<span class="a-deger-yok">Başka plan yok</span>');
    } },
    { k: "durum", baslik: "Plan kabulü", kart: "rozet", sira: 1, hucre: function (p, d) {
      return d.eksik.length ? rozet({ ad: "Kabul edemez", rozet: "a-rozet-bekliyor" }) + '<span class="a-uyari-metin" title="' + kacis(d.eksik.join(" · ")) + '">' + kacis(d.eksik[0]) + (d.eksik.length > 1 ? " +" + (d.eksik.length - 1) : "") + "</span>"
        : rozet({ ad: "Kabul edebilir", rozet: "a-rozet-tamam" });
    } }
  ];
  function bagimliCiz(odak) {
    var t = F.tesis ? MV.tesis(F.tesis) : null, k = t ? kapsam() : [];
    if ($("p-secili")) $("p-secili").innerHTML = "<b>" + secililer().length + "</b> / " + ekipmanlar().length + " kayıtlı seçili" + (F.yeni.length ? " · <b>" + F.yeni.reduce(function (n, y) { return n + y.adet; }, 0) + "</b> yeni" : "");
    if ($("p-sure")) $("p-sure").textContent = sureIpucu();
    /* bölüm 3: adaylar; durum hücreleri aynı hesabı paylaşır */
    var D = {}; adaylar().forEach(function (p) { D[p.id] = adayDurum(p); });
    var sutun = ADAY_SUTUN.map(function (s) { return Object.assign({}, s, { hucre: function (p) { return s.hucre(p, D[p.id]); } }); });
    $("p-aday-kap").innerHTML = !t ? '<p class="a-bos-satir">Önce tesis seçin: inspector\'ların bu tesis ve tarih için kabul koşulları burada görünür.</p>'
      : '<p class="a-bolum-aciklama">Bir ya da birkaç inspector seçin. Eksiği olan da seçilebilir: plan açılır, eksik giderilene kadar o kişi kabul edemez.</p>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Inspector adayları", sinif: "a-tablo-aday", sutunlar: sutun, kayitlar: adaylar() }) + "</div>" + hataP("ekip");
    ozetCiz(t, k, D);
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  function ozetCiz(t, k, D) {
    if (!t) { $("p-ozet-kap").innerHTML = '<p class="a-bos-satir">Müşteri, tesis, tarih, inspector ve kapsam seçildikçe özet burada dolar.</p>'; return; }
    var gun = tarihIso(F.tarih), ekip = F.ekip.map(MV.kisi), top = kapsamToplam(k), sat = [];
    ekip.forEach(function (p) {
      var d = D[p.id];
      if (!d.eksik.length) sat.push('<li class="a-kosul-tamam">' + ikon("circle-check", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " kabul edebilir.</span></li>");
      else sat.push('<li class="a-kosul-eksik">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " kabul edemez: " + kacis(d.eksik.join(" · ")) + "." +
        (d.isg.tur !== "tamam" ? ' <a class="a-baglanti" href="' + MK.adres(12, "#/isg/" + (d.isg.x ? d.isg.x.id : "yeni?tesis=" + t.id + "&kisi=" + p.id)) + '">' + (d.isg.x ? "İSG-KATİP kaydını aç" : "İSG-KATİP kaydı ekle") + "</a>" : "") + "</span></li>");
      d.cak.filter(function (c) { return c.ust; }).forEach(function (c) {
        sat.push('<li class="a-kosul-eksik">' + ikon("clock", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + " aynı saatte " + c.t.plan + " planında (" + c.t.psaat[0] + "–" + c.t.psaat[1] + ", " + kacis(c.t.ad) + ").</span></li>");
      });
    });
    /* 2c (öneri): kapsamdaki her tür için ekipte yetkili biri olmalı */
    k.forEach(function (x) {
      if (ekip.length && !ekip.some(function (p) { return yetkili(p, x.tur); }))
        sat.push('<li class="a-kosul-eksik">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(x.tur.ad) + " (" + (x.kayitli + x.yeni) + "): ekipte bu türe yetkili kimse yok (" + MV.grup(x.tur.g).ad.toLocaleLowerCase("tr") + ").</span></li>");
    });
    var KSUTUN = [
      { k: "tur", baslik: "Tür", kart: "ust", sira: 1, hucre: function (x) { return kirp(x.tur.ad) + '<span class="a-alt-satir">' + bransAd(x.tur.b) + "</span>"; } },
      { k: "kayitli", baslik: "Kayıtlı", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Kayıtlı</span>' + x.kayitli; } },
      { k: "yeni", baslik: "Yeni", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Yeni</span>' + (x.yeni || '<span class="a-deger-yok">—</span>'); } },
      { k: "yetkili", baslik: "Ekipte yetkili", kart: "govde", sira: 4, hucre: function (x) {
        var l = ekip.filter(function (p) { return yetkili(p, x.tur); });
        return '<span class="a-kart-etiket">Ekipte yetkili</span>' + (!ekip.length ? '<span class="a-deger-yok">Inspector seçilmedi</span>' : l.length ? kirp(l.map(function (p) { return p.ad; }).join(", ")) : '<span class="a-uyari-metin">Yok</span>');
      } },
      { k: "toplam", baslik: "Planlanan", kart: "rozet", sira: 1, hucre: function (x) { return '<span class="a-sayi">' + (x.kayitli + x.yeni) + "</span>"; } }
    ];
    $("p-ozet-kap").innerHTML = '<dl class="a-bilgi">' +
        bilgi("Proje no", '<span class="a-kod">' + MV.sonrakiProjeNo() + '</span><span class="a-alt-satir">kaydedince sunucu verir</span>') +
        bilgi("Başlangıç", gun ? MK.gunYaz(gun) + '<span class="a-alt-satir">' + (saatOk(F.bas) && saatOk(F.bit) ? F.bas + "–" + F.bit : "saat eksik") + "</span>" : '<span class="a-deger-yok">Tarih eksik</span>') +
        bilgi("Ekip", ekip.length ? kacis(ekip.map(function (p) { return p.ad; }).join(", ")) : '<span class="a-deger-yok">Seçilmedi</span>', true) +
        bilgi("Kapsam", top ? top + " ekipman · " + k.length + " tür" : '<span class="a-deger-yok">Boş</span>') + "</dl>" +
      (k.length ? '<div class="a-liste-kap a-bolum-serit">' + MK.tablo({ baslik: "Kapsam tür başına", sinif: "a-tablo-kapsamozet", sutunlar: KSUTUN, kayitlar: k }) + "</div>" : "") +
      (sat.length ? '<ul class="a-kosullar a-bolum-serit" aria-label="Kabul ön koşulları">' + sat.join("") + "</ul>" : "") +
      '<div class="a-bolum-serit">' + MK.serit("bilgi", "calendar-check", "Plan açılınca ekipteki inspector'ların Planlar ekranına “Kabul bekliyor” olarak düşer; hareket kaydına yazılır. Bildirim gönderilmez.") + "</div>";
  }

  /* ── DENETİM VE KAYIT ─────────────────────────────────────────────────────────────────────────────────── */
  function denetle() {
    var h = {}, gun = tarihIso(F.tarih);
    if (!F.musteri) h.musteri = "Müşteri seçilmeli.";
    if (!F.tesis) h.tesis = "Tesis seçilmeli.";
    if (!gun) h.tarih = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    else if (gun < MK.BUGUN) h.tarih = "Geçmiş tarihe plan açılmaz (bugün " + MK.tarihYaz(MK.BUGUN) + ").";
    if (!saatOk(F.bas)) h.bas = "SS:DD biçiminde.";
    if (!saatOk(F.bit)) h.bit = "SS:DD biçiminde.";
    else if (saatOk(F.bas) && F.bit <= F.bas) h.bit = "Bitiş başlangıçtan sonra olmalı.";
    if (F.tesis && !F.ekip.length) h.ekip = "En az bir inspector seçilmeli.";
    if (F.tesis && !kapsamToplam(kapsam())) h.kapsam = "Kapsamda en az bir ekipman olmalı: kayıtlı ekipman seçin ya da yeni ekipman ekleyin.";
    return h;
  }
  var ODAK = { ekip: function () { var c = document.querySelector("[data-aday]"); return c && c.id; }, kapsam: function () { var c = document.querySelector("[data-ekp]:not(:disabled)"); return c ? c.id : "p-yeniTur"; } };
  function planiAc() {
    F.hata = denetle(); var hk = Object.keys(F.hata);
    if (hk.length) { formCiz(); var id = ODAK[hk[0]] ? ODAK[hk[0]]() : "p-" + hk[0], el = id && $(id); if (el) el.focus(); return; }
    var t = MV.tesis(F.tesis), k = kapsam(), D = {};
    F.ekip.forEach(function (id) { D[id] = adayDurum(MV.kisi(id)); });
    SONUC = { no: MV.sonrakiProjeNo(), t: t, gun: tarihIso(F.tarih), bas: F.bas, bit: F.bit, aciklama: F.aciklama.trim(), ekip: F.ekip.slice(), k: k, D: D };
    /* maket: tesis yeni planı taşır (sonraki proje no ilerler); Planlar maketinin listesine sayfalar arası kayıt TAŞINMAZ */
    if (!t.pid || !MV.acikPlan(t)) Object.assign(t, { plan: SONUC.no, pid: 90, pdurum: "bekliyor", ptarih: SONUC.gun, pekip: SONUC.ekip.slice(), psaat: [F.bas, F.bit] });
    F = null;
    location.hash = "#/acildi";
  }
  function sonucCiz() {
    var s = SONUC, t = s.t, m = MV.musteri(t.m), ekip = s.ekip.map(MV.kisi), eksik = ekip.filter(function (p) { return s.D[p.id].eksik.length; });
    var top = kapsamToplam(s.k);
    $("a-nesne").innerHTML = MK.kirinti([["Planlar", MK.adres(13, "#/")], ["Plan aç", "#/"], [s.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + s.no + " · " + kacis(t.ad) + "</h1>" + rozet(MV.PLAN_DURUM.bekliyor) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(m.unvan) + "</span></p></div>" +
        '<div class="a-eylem-cubugu"><a class="a-tus a-tus-ikincil" href="#/">' + ikon("plus", "a-ikon-kucuk") + "Yeni plan aç</a>" +
          '<a class="a-tus a-tus-birincil" href="' + MK.adres(13, "#/") + '">' + ikon("calendar-check", "a-ikon-kucuk") + "Planlar</a></div></div>" +
      '<div class="a-uyari-serit">' + MK.serit("onay", "circle-check", "Plan açıldı. " + kacis(ekip.map(function (p) { return p.ad; }).join(", ")) + " için Planlar ekranında “Kabul bekliyor”. Hareket kaydı: Zeynep Arslan · " + MK.zamanYaz(MK.simdi()) + ".") +
        eksik.map(function (p) {
          var d = s.D[p.id];
          return '<div class="a-serit a-serit-uyari">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span><b>" + kacis(p.ad) + "</b> kabul edemez: " + kacis(d.eksik.join(" · ")) + ".</span>" +
            (d.isg.tur !== "tamam" ? '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(12, "#/isg/" + (d.isg.x ? d.isg.x.id : "yeni?tesis=" + t.id + "&kisi=" + p.id)) + '">' + (d.isg.x ? "Kaydı aç" : "Kayıt ekle") + "</a>" : "") + "</div>";
        }).join("") + "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-plan"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-plan">Plan bilgisi</h2></div>' +
        '<dl class="a-bilgi">' + bilgi("Proje no", '<span class="a-kod">' + s.no + "</span>") + bilgi("Başlangıç", MK.gunYaz(s.gun) + '<span class="a-alt-satir">' + s.bas + "–" + s.bit + "</span>") +
          bilgi("Adres", kacis(t.adres) + ", " + t.ilce + " / " + t.il, true) + bilgi("Ekip", kacis(ekip.map(function (p) { return p.ad; }).join(", ")), true) +
          bilgi("Kapsam", top + " ekipman · " + s.k.length + " tür") + bilgi("Açıklama", s.aciklama ? kacis(s.aciklama) : '<span class="a-deger-yok">Yok</span>', true) + "</dl></section>" +
      '<p class="a-ipucu">Makette sayfalar arası kayıt taşınmaz: bu plan Planlar maketinin listesinde görünmez.</p>';
  }

  /* ── GÖRÜNÜM VE OLAYLAR ─────────────────────────────────────────────────────────────────────────────── */
  function goster(odakla) {
    var sonuc = /^#\/acildi$/.test(location.hash) && SONUC;
    if (/^#\/acildi$/.test(location.hash) && !SONUC) { history.replaceState(null, "", "#/"); }
    $("a-form-gorunum").hidden = !!sonuc; $("a-nesne").hidden = !sonuc;
    if (sonuc) sonucCiz();
    else { if (!F || odakla) formAc(sorgu()); formCiz(); }
    document.title = (sonuc ? SONUC.no + " açıldı" : "Plan aç") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) {
    var k = id.slice(2); delete F.hata[k];
    if (k === "musteri") { if (F.musteri !== deger) { F.musteri = deger; F.tesis = ""; F.ekip = []; F.sec = {}; F.yeni = []; } }
    else if (k === "tesis") { if (F.tesis !== deger) { SZ.k.secili = []; SZ.k.ara = ""; SZ.k.sayfa = 1; SZ.k.sec.tur = "tumu"; tesisSec(deger); } }
    else F[k] = deger;
    formCiz(id);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k || !F) return;
    F[k] = e.target.value;
    if (k === "tarih" || k === "bas" || k === "bit") { kapsamListeCiz(); bagimliCiz(); }   /* "kontrolü geliyor", İSG uygunluğu ve çakışma tarihe bağlı */
  };
  document.addEventListener("change", function (e) {
    var d = e.target.dataset || {};
    if (d.ekp) { if (e.target.checked) F.sec[d.ekp] = true; else delete F.sec[d.ekp]; delete F.hata.kapsam; bagimliCiz(); }
    else if (d.aday) {
      var i = F.ekip.indexOf(d.aday);
      if (e.target.checked && i < 0) F.ekip.push(d.aday); else if (!e.target.checked && i >= 0) F.ekip.splice(i, 1);
      delete F.hata.ekip; bagimliCiz(e.target.id);
    }
  });
  var X = MK.eylem;
  X["plani-ac"] = planiAc;
  X["kontrolu-gelen"] = function () { ekipmanlar().forEach(function (e) { if (!acikta(e) && geldi(e)) F.sec[e.kod] = true; }); kapsamListeCiz(); bagimliCiz(); };
  X["secimi-temizle"] = function () { F.sec = {}; kapsamListeCiz(); bagimliCiz(); };
  X["yeni-ekle"] = function () {
    var n = +F.yeniAdet;
    if (!F.yeniTur) F.hata.yeniTur = "Tür seçilmeli.";
    if (!(n >= 1 && n <= 99 && /^\d+$/.test(F.yeniAdet))) F.hata.yeniAdet = "1–99 arası adet.";
    if (F.hata.yeniTur || F.hata.yeniAdet) { formCiz(F.hata.yeniTur ? "p-yeniTur" : "p-yeniAdet"); return; }
    var v = F.yeni.filter(function (y) { return y.tur === F.yeniTur; })[0];
    if (v) v.adet = Math.min(99, v.adet + n); else F.yeni.push({ tur: F.yeniTur, adet: n });
    MK.bildir(MV.tur(F.yeniTur).ad + " × " + n + " kapsama eklendi.");
    F.yeniTur = ""; F.yeniAdet = "1"; delete F.hata.kapsam;
    formCiz("p-yeniTur");
  };
  X["yeni-kaldir"] = function (el) { F.yeni = F.yeni.filter(function (y) { return y.tur !== el.dataset.tur; }); formCiz("p-yeniTur"); };

  MK.kabuk({ modul: 13, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  goster(false);
})();
