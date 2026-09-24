/* ══ probata MAKET M13 — Sözleşmeler: firmalar arası iş sözleşmesi (modül 12, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ════════
   Kaynak: pkproje.md §1.1 (akış: "teklif kabul edildi → sözleşmeler yapıldı (isg katip ve şirketler arası iş sözleşmesi) → planlama"),
   §3.1 modül 12 (firmalar arası iş sözleşmesi + İSG-KATİP kayıtları; İSG-KATİP kısmı M5, aynı menüde öteki sekme), §3.3 (faz 2).
   Ekranlar: liste (#/) · sözleşme sayfası (#/s/<no>: taraflar, kapsam tesisler + İSG-KATİP durumu, koşullar, imzalı belge, geçmiş) · form
   (#/yeni?teklif=<no>: teklif kabulünden). Kullanıcı: Zeynep Arslan (planlama). Süre, vade, yenileme VARSAYIM. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var S = MV.IS_SOZLESMELERI;
  var DURUM = { imza: { ad: "İmza bekliyor", rozet: "a-rozet-bekliyor" }, yururlukte: { ad: "Yürürlükte", rozet: "a-rozet-tamam" }, suresi: { ad: "Süresi doldu", rozet: "a-rozet-notr" } };
  var kalan = function (x) { return MK.gunFarki(MK.BUGUN, x.bitis); };
  var tesisAd = function (x) { return x.tesisler.map(function (t) { return MV.tesis(t).ad; }).join(", "); };
  /* yenileme teklifi: kapsamdaki bir tesis için sözleşme başladıktan sonra hazırlanmış, reddedilmemiş teklif */
  var yenilemeTeklifi = function (x) { return MV.TEKLIFLER.filter(function (t) { return x.tesisler.indexOf(t.tesis) >= 0 && t.tarih > x.baslangic && t.durum !== "red"; })[0]; };
  var TK_DURUM = { gonderildi: "gönderildi", taslak: "taslak", kabul: "kabul edildi", suresi: "süresi doldu" };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("s", { ad: "Sözleşmelerde ara", ipucu: "No, müşteri, tesis", birim: "sözleşme",
    cipler: [
      { k: "imza", ad: "İmza bekliyor", grup: "durum", test: function (x) { return MV.isDurum(x) === "imza"; } },
      { k: "yururlukte", ad: "Yürürlükte", grup: "durum", test: function (x) { return MV.isDurum(x) === "yururlukte"; } },
      { k: "suresi", ad: "Süresi doldu", grup: "durum", test: function (x) { return MV.isDurum(x) === "suresi"; } },
      { k: "biten", ad: "Bitişi 60 gün içinde", test: function (x) { var k = kalan(x); return MV.isDurum(x) === "yururlukte" && k <= 60; } }
    ],
    seciciler: [{ k: "musteri", ad: "Müşteri", secenek: function () {
      var l = S.map(function (x) { return x.m; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (x, v) { return v === "tumu" || x.m === v; } }],
    metin: function (x) { return [x.no, MV.musteri(x.m).kisa, MV.musteri(x.m).unvan, tesisAd(x), x.teklif || ""].join(" "); },
    imkansiz: "Bir sözleşme aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Sözleşme no", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/s/' + x.no + '">' + x.no + "</a>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (x) { return "<span>" + kirp(MV.musteri(x.m).kisa) + kirp(tesisAd(x), "a-alt-satir") + "</span>"; } },
    { k: "sure", baslik: "Süre", kart: "govde", sira: 3, hucre: function (x) {
      var k = kalan(x), d = MV.isDurum(x);
      return '<span class="a-kart-etiket">Süre</span><span><span class="a-tarih-gun">' + MK.gunKisa(x.baslangic) + " " + x.baslangic.slice(0, 4) + " – " + MK.tarihYaz(x.bitis) + "</span>" +
        (d === "yururlukte" ? '<span class="' + (k <= 60 ? "a-uyari-metin" : "a-tarih-saat") + '">' + k + " gün kaldı" + (x.yenileme === "otomatik" ? " · kendiliğinden yenilenir" : "") + "</span>" : "") + "</span>";
    } },
    { k: "teklif", baslik: "Dayanak teklif", kart: "govde", sira: 4, hucre: function (x) {
      return '<span class="a-kart-etiket">Dayanak teklif</span>' + (x.teklif ? '<a class="a-no" href="' + MK.adres(11, "#/t/" + x.teklif) + '">' + x.teklif + "</a>" : '<span class="a-deger-yok">Sistem öncesi</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(DURUM[MV.isDurum(x)]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "s", kayitlar: S, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { var o = { imza: 0, yururlukte: 1, suresi: 2 }; return l.slice().sort(function (a, b) { return o[MV.isDurum(a)] - o[MV.isDurum(b)] || (a.bitis < b.bitis ? -1 : 1); }); },
      bosVeri: { ikon: "file-signature", baslik: "İş sözleşmesi yok", metin: "Kabul edilen tekliften “İş sözleşmesi” ile hazırlanır." },
      tablo: { baslik: "İş sözleşmeleri", sinif: "a-tablo-issoz", sutunlar: SUTUN, href: function (x) { return "#/s/" + x.no; } } });
    var biten = S.filter(function (x) { return MV.isDurum(x) === "yururlukte" && kalan(x) <= 60 && x.yenileme !== "otomatik"; });
    $("a-uyari").innerHTML = biten.length ? '<div class="a-uyari-serit">' + biten.map(function (x) {
      var yeni = yenilemeTeklifi(x);
      return '<div class="a-serit a-serit-uyari">' + ikon("clock", "a-ikon-kucuk") + "<span><b>" + x.no + " · " + kacis(MV.musteri(x.m).kisa) + "</b> " + kalan(x) + " gün sonra bitiyor" +
        (yeni ? "; yenileme teklifi " + yeni.no + " (" + TK_DURUM[yeni.durum] + ")." : "; yenileme teklifi yok.") + "</span>" +
        (yeni ? '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(11, "#/t/" + yeni.no) + '">Teklif</a>' : '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">Teklif hazırla</a>') + "</div>";
    }).join("") + "</div>" : "";
  }

  /* ── SÖZLEŞME SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  function sozlesmeCiz(x) {
    if (!x) {
      $("a-nesne").innerHTML = MK.kirinti([["İş sözleşmeleri", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Sözleşme bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Sözleşme bulunamadı", metin: "Bu adreste sözleşme yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Sözleşmelere dön</a>" });
      return;
    }
    var m = MV.musteri(x.m), d = MV.isDurum(x), f = MV.FIRMA, k = kalan(x), yeni = d !== "imza" ? yenilemeTeklifi(x) : null;
    var KS = [
      { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (tid) { var t = MV.tesis(tid); return '<a class="a-ad-bag" href="' + MK.adres(3, "#/t/" + t.id) + '">' + kirp(t.ad) + "</a>" + kirp(t.ilce + " / " + t.il, "a-alt-satir"); } },
      { k: "isg", baslik: "İSG-KATİP", kart: "govde", sira: 2, hucre: function (tid) {
        var n = MV.isgTesis(tid).length; return '<span class="a-kart-etiket">İSG-KATİP</span>' + (n ? '<a class="a-baglanti" href="' + MK.adres(12, "#/isg?tesis=" + tid) + '">' + n + " kayıt</a>" : '<span class="a-uyari-metin">Kayıt yok</span>');
      } },
      { k: "plan", baslik: "Plan", kart: "govde", sira: 3, hucre: function (tid) {
        var t = MV.tesis(tid); return '<span class="a-kart-etiket">Plan</span>' + (t.pid ? '<a class="a-no" href="' + MK.adres(13, "#/plan/" + t.pid) + '">' + t.plan + "</a>" : MK.git({ hedef: "plan-ac", hash: "#/?tesis=" + tid, ad: "Plan aç", ikon: "calendar-check", ne: "Plan açma" }));
      } },
      { k: "durum", baslik: "Plan durumu", kart: "rozet", sira: 1, hucre: function (tid) { var t = MV.tesis(tid); return t.pid ? rozet(MV.PLAN_DURUM[t.pdurum]) : '<span class="a-deger-yok">—</span>'; } }
    ];
    var gecmis = [[x.imza.firma, "Firma imzaladı", MV.FIRMA.ad]];
    if (x.imza.musteri) gecmis.push([x.imza.musteri, "Müşteri imzaladı", m.unvan], [x.imza.musteri, "İmzalı sözleşme yüklendi", "Zeynep Arslan"]);
    if (d === "suresi") gecmis.push([x.bitis, "Süresi doldu", ""]);
    $("a-nesne").innerHTML = MK.kirinti([["İş sözleşmeleri", "#/"], [x.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + x.no + "</h1>" + rozet(DURUM[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(3, "#/m/" + m.id) + '">' + kacis(m.unvan) + "</a></span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "Sözleşme metni", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (d === "imza" ? MK.tus({ eylem: "imzali-yukle", ad: "İmzalı sözleşmeyi yükle", ikon: "file-check" }) : "") +
          (d !== "imza" && yeni ? '<a class="a-tus a-tus-ikincil" href="' + MK.adres(11, "#/t/" + yeni.no) + '">' + ikon("file-text", "a-ikon-kucuk") + "Yenileme teklifi " + yeni.no + "</a>" :
            d === "yururlukte" && k <= 60 && x.yenileme !== "otomatik" ? '<a class="a-tus a-tus-birincil" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">' + ikon("refresh-cw", "a-ikon-kucuk") + "Yenileme teklifi hazırla</a>" :
            d === "suresi" ? '<a class="a-tus a-tus-birincil" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">' + ikon("plus", "a-ikon-kucuk") + "Yeni teklif</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (d === "imza" ? MK.serit("uyari", "file-signature", "Firma imzaladı; müşteri imzası bekleniyor. İmzalı sözleşme yüklenince yürürlüğe girer. (Plan açılmıştı: soru 130.)") : "") +
        (d === "yururlukte" && k <= 60 ? MK.serit("uyari", "clock", k + " gün sonra bitiyor" + (x.yenileme === "otomatik" ? "; kendiliğinden yenilenir (fesih bildirimi yoksa)." :
          yeni ? "; yenileme teklifi " + yeni.no + " " + TK_DURUM[yeni.durum] + ", kabul edilince yeni sözleşme hazırlanır." : "; yenileme için teklif gerekir.")) : "") +
        (d === "suresi" ? MK.serit("bilgi", "history", "Süresi " + MK.tarihYaz(x.bitis) + " tarihinde doldu; bu tesis için yeni plan açılmadan önce yeni sözleşme gerekir.") : "") +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-taraf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-taraf">Taraflar ve koşullar</h2></div>' +
        '<dl class="a-bilgi">' + bilgi("Hizmet veren", kacis(f.ad) + '<span class="a-alt-satir">akreditasyon ' + f.akr + "</span>", true) +
          bilgi("Hizmet alan", kacis(m.unvan) + '<span class="a-alt-satir">' + kacis(m.vd) + " VD · " + m.vno + "</span>", true) +
          bilgi("Başlangıç", MK.tarihYaz(x.baslangic)) + bilgi("Bitiş", MK.tarihYaz(x.bitis) + (d === "yururlukte" ? '<span class="a-alt-satir">' + k + " gün kaldı</span>" : "")) +
          bilgi("Ödeme vadesi", x.vade + " gün") + bilgi("Yenileme", x.yenileme === "otomatik" ? "Kendiliğinden (fesih yoksa)" : "Yok · yeni teklif") +
          bilgi("Dayanak teklif", x.teklif ? '<a class="a-no" href="' + MK.adres(11, "#/t/" + x.teklif) + '">' + x.teklif + "</a>" : '<span class="a-deger-yok">Sistem öncesi</span>') +
          bilgi("İmzalı belge", x.dosya ? '<span class="a-kod">' + x.no + '.pdf</span><span class="a-alt-satir">yalnız firma içinde</span>' : '<span class="a-uyari-metin">Yüklenmedi</span>') + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kapsam"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kapsam">Kapsam</h2><span class="a-sayac"><b>' + x.tesisler.length + "</b> tesis</span></div>" +
        '<p class="a-bolum-aciklama">İş sözleşmesi firmalar arasında; her tesiste inspector ile işveren arasında ayrıca İSG-KATİP sözleşmesi gerekir (plan kabulü onu denetler).</p>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Kapsamdaki tesisler", sinif: "a-tablo-iskapsam", sutunlar: KS, kayitlar: x.tesisler }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-gecmis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gecmis">Geçmiş</h2></div>' +
        '<ol class="a-gecmis">' + gecmis.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; }).map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(g[0]) + '</span><span class="a-gecmis-ne"><b>' + g[1] + "</b>" + (g[2] ? ' <span class="a-gecmis-rol">' + kacis(g[2]) + "</span>" : "") + "</span></li>";
        }).join("") + "</ol></section>";
  }

  /* ── FORM ─────────────────────────────────────────────────────────────────────────────────────────── */
  var F = null;
  function formAc() {
    var q = /[?&]teklif=([A-Z0-9-]+)/.exec(location.hash), t = q ? MV.teklif(q[1]) : null;
    F = { teklif: t ? t.no : "", m: t ? t.m : "", tesisler: t ? [t.tesis] : [], baslangic: "24.09.2026", sure: "12", vade: "30", yenileme: "yok", hata: {} };
  }
  function formCiz(odak) {
    var h = F.hata, m = F.m ? MV.musteri(F.m) : null;
    var musteriler = MV.MUSTERILER.map(function (x) { return [x.id, x.kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); });
    var teklifler = m ? MV.TEKLIFLER.filter(function (t) { return t.m === m.id; }).map(function (t) { return [t.no, t.no, MV.tesis(t.tesis).ad]; }) : [];
    $("a-form-gorunum").innerHTML = MK.kirinti([["İş sözleşmeleri", "#/"], ["Yeni sözleşme"]]) + '<div class="a-sayfa-bas"><h1 tabindex="-1">Yeni iş sözleşmesi</h1></div>' +
      (Object.keys(h).length ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-alert", "Kaydedilmedi: " + Object.keys(h).length + " eksik düzeltilmeli.") + "</div>" : "") +
      '<div class="a-form-sayfa">' +
        '<section class="a-form-bolum" aria-labelledby="f-b1"><h2 id="f-b1">Müşteri ve kapsam</h2><div class="a-form">' +
          MK.alan({ id: "f-m", etiket: "Müşteri", zorunlu: true, genis: true, hata: h.m, ipucu: m ? kacis(m.unvan) : "", girdi: MK.secim({ id: "f-m", ad: "Müşteri", deger: F.m, secenekler: musteriler, ipucu: "Müşteri seçin", gecersiz: !!h.m, tanim: "f-m-ipucu" }) }) +
          MK.alan({ id: "f-teklif", etiket: "Dayanak teklif", genis: true, ipucu: "Kabul edilen teklif; fiyatlar oradan", girdi: m ? MK.secim({ id: "f-teklif", ad: "Dayanak teklif", deger: F.teklif, secenekler: teklifler, ipucu: "Teklif seçin", tanim: "f-teklif-ipucu" }) : '<input class="a-girdi a-girdi-oku" id="f-teklif" readonly value="Önce müşteri seçin" aria-describedby="f-teklif-ipucu">' }) +
          "</div>" +
          '<p class="a-etiket a-bolum-serit">Kapsamdaki tesisler <span class="a-zorunlu">en az bir</span></p>' +
          (m ? MV.tesisleri(m.id).map(function (t) { return '<label class="a-onay-kutusu"><input type="checkbox" id="f-t-' + t.id + '" data-tesis="' + t.id + '"' + (F.tesisler.indexOf(t.id) >= 0 ? " checked" : "") + "><span>" + kacis(t.ad) + '<span class="a-alt-satir">' + t.ilce + " / " + t.il + "</span></span></label>"; }).join("") : '<p class="a-bos-satir">Önce müşteri seçin.</p>') +
          (h.tesisler ? '<p class="a-ipucu a-ipucu-uyari">' + h.tesisler + "</p>" : "") + "</section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b2"><h2 id="f-b2">Süre ve ödeme</h2><div class="a-form">' +
          MK.alan({ id: "f-baslangic", etiket: "Başlangıç", zorunlu: true, hata: h.baslangic, ipucu: "GG.AA.YYYY", girdi: MK.girdi({ id: "f-baslangic", alan: "baslangic", deger: F.baslangic, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10"', hata: h.baslangic }) }) +
          MK.alan({ id: "f-sure", etiket: "Süre (ay)", zorunlu: true, hata: h.sure, ipucu: "Çoğu periyot 12 ay", girdi: MK.girdi({ id: "f-sure", alan: "sure", deger: F.sure, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="2"', hata: h.sure }) }) +
          MK.alan({ id: "f-vade", etiket: "Ödeme vadesi (gün)", zorunlu: true, hata: h.vade, ipucu: "Fatura tarihinden", girdi: MK.girdi({ id: "f-vade", alan: "vade", deger: F.vade, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', hata: h.vade }) }) +
          '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Yenileme</p><div class="a-sekmeler" role="group" aria-label="Yenileme">' +
            '<button type="button" class="a-sekme" data-yenileme="yok" aria-pressed="' + (F.yenileme === "yok") + '">Yeni teklifle</button>' +
            '<button type="button" class="a-sekme" data-yenileme="otomatik" aria-pressed="' + (F.yenileme === "otomatik") + '">Kendiliğinden</button></div></div>' +
        "</div>" + '<div class="a-bolum-serit">' + MK.serit("bilgi", "file-text", "Sözleşme metni firmanın şablonundan üretilir (makette yok); imzalanınca taranmış ya da e-imzalı PDF yüklenir.") + "</div></section>" +
      "</div>" +
      '<div class="a-form-eylem"><p class="a-adim-not">Kaydedince firma imzalı sayılır; müşteri imzası beklenir.</p><a class="a-tus a-tus-ikincil" href="#/">Vazgeç</a>' + MK.tus({ eylem: "kaydet", ad: "Sözleşmeyi hazırla", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak) || document.querySelector(odak); if (el) el.focus(); }
  }
  var tarihIso = function (s) { var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim()); if (!m) return null; var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  function denetle() {
    var h = {};
    if (!F.m) h.m = "Müşteri seçilmeli.";
    if (F.m && !F.tesisler.length) h.tesisler = "En az bir tesis seçilmeli.";
    if (!tarihIso(F.baslangic)) h.baslangic = "GG.AA.YYYY biçiminde geçerli bir tarih.";
    if (!/^\d{1,2}$/.test(F.sure) || +F.sure < 1 || +F.sure > 36) h.sure = "1–36 ay.";
    if (!/^\d{1,3}$/.test(F.vade) || +F.vade > 120) h.vade = "0–120 gün.";
    return h;
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/yeni") return { v: "form" };
    if ((m = /^#\/s\/([A-Z0-9-]+)$/.exec(h))) return { v: "soz", no: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota();
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v !== "soz"; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") {
      /* müşteri sayfasındaki "İş sözleşmesi" yüzü → o müşterinin sözleşmeleri */
      var mq = /[?&]musteri=(m\d+)/.exec(location.hash); if (mq && MV.musteri(mq[1])) { MK.suzgecSifirla("s"); SZ.s.sec.musteri = mq[1]; }
      $("a-suzgec-kap").innerHTML = MK.suzgecHtml("s"); MK.suzgecKur("s");
    }
    else if (r.v === "soz") sozlesmeCiz(MV.isSozlesmesi(r.no));
    else { if (!F || odakla) formAc(); formCiz(); }
    document.title = (r.v === "soz" ? r.no : r.v === "form" ? "Yeni iş sözleşmesi" : "İş sözleşmeleri") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) {
    if (id === "f-m") { if (F.m !== deger) { F.m = deger; F.tesisler = []; F.teklif = ""; } delete F.hata.m; }
    if (id === "f-teklif") { F.teklif = deger; var t = MV.teklif(deger); if (t && F.tesisler.indexOf(t.tesis) < 0) F.tesisler.push(t.tesis); delete F.hata.tesisler; }
    formCiz(id);
  };
  MK.onGirdi = function (e) { var k = e.target.dataset && e.target.dataset.alan; if (k && F) F[k] = e.target.value; };
  MK.onTikla = function (e) { var b = e.target.closest("[data-yenileme]"); if (!b || !F) return false; F.yenileme = b.dataset.yenileme; formCiz('[data-yenileme="' + F.yenileme + '"]'); return true; };
  document.addEventListener("change", function (e) {
    var t = e.target.dataset && e.target.dataset.tesis; if (!t || !F) return;
    var i = F.tesisler.indexOf(t); if (e.target.checked && i < 0) F.tesisler.push(t); else if (!e.target.checked && i >= 0) F.tesisler.splice(i, 1);
    delete F.hata.tesisler;
  });
  var X = MK.eylem;
  X["yeni"] = function () { location.hash = "#/yeni"; };
  X["kaydet"] = function () {
    F.hata = denetle(); var hk = Object.keys(F.hata);
    if (hk.length) { formCiz(hk[0] === "tesisler" ? "[data-tesis]" : "f-" + hk[0]); return; }
    var bas = tarihIso(F.baslangic), bit = new Date(bas + "T12:00:00"); bit.setMonth(bit.getMonth() + +F.sure); bit.setDate(bit.getDate() - 1);
    var ay = bas.slice(5, 7) + bas.slice(2, 4), n = S.filter(function (x) { return x.no.indexOf("IS-" + ay + "-") === 0; }).length + 1;
    var x = { no: "IS-" + ay + "-" + ("00" + n).slice(-3), m: F.m, tesisler: F.tesisler.slice(), teklif: F.teklif || null, baslangic: bas, bitis: bit.toISOString().slice(0, 10),
      imza: { firma: MK.BUGUN, musteri: null }, dosya: false, vade: +F.vade, yenileme: F.yenileme };
    S.push(x); F = null; location.hash = "#/s/" + x.no; MK.bildir(x.no + " hazırlandı; müşteri imzası bekleniyor.");
  };
  X["imzali-yukle"] = function () {
    var x = MV.isSozlesmesi(rota().no); x.imza.musteri = MK.BUGUN; x.dosya = true; sozlesmeCiz(x);
    MK.bildir(x.no + " imzalı sözleşme yüklendi; yürürlükte.");
  };
  X["pdf"] = function () { MK.bildir("Makette dosya yok. Uygulamada sözleşme metni firmanın şablonundan üretilir; imzalı kopya yalnız firma içinde, kısa ömürlü bağlantıyla açılır."); };

  MK.kabuk({ modul: 12, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  goster(false);
})();
