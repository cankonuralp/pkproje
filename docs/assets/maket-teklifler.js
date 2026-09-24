/* ══ probata MAKET M12 — Teklifler (modül 11, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1.1 (akış: "teklif verildi → teklif kabul edildi → sözleşmeler yapıldı → planlama"), §3.1 modül 11 (müşteri, tesis,
   kalemler: ekipman türü × adet × birim fiyat, durum), §3.2 madde 5 (her rapor teklif kalemine bağlanır; Performans'taki kazanç buradan).
   Ekranlar: liste (#/) · teklif sayfası (#/t/<no>: kalemler, KDV, raporlanan adet; duruma göre eylem) · form (#/yeni, #/t/<no>/duzenle:
   fiyat listesinden birim fiyat, "tesisteki ekipmandan doldur") · red gerekçesi penceresi. Kabulden sonra: iş sözleşmesi (M13) → plan aç (M6).
   Kullanıcı: Zeynep Arslan (planlama ekibi). Tutarlar ÖRNEK, TL, KDV hariç; KDV %20. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var T = MV.TEKLIFLER, para = MV.para;
  var DURUM = { taslak: { ad: "Taslak", rozet: "a-rozet-notr" }, gonderildi: { ad: "Gönderildi", rozet: "a-rozet-kabul" }, kabul: { ad: "Kabul edildi", rozet: "a-rozet-tamam" },
    red: { ad: "Reddedildi", rozet: "a-rozet-red" }, suresi: { ad: "Süresi doldu", rozet: "a-rozet-bekliyor" } };
  var bitis = function (t) { var d = new Date((t.gonderildi || t.tarih) + "T12:00:00"); d.setDate(d.getDate() + t.gecerlilik); return d.toISOString().slice(0, 10); };
  var kdvli = function (n) { return Math.round(n * (100 + MV.KDV)) / 100; };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("t", { ad: "Tekliflerde ara", ipucu: "Teklif no, müşteri, tesis", birim: "teklif",
    cipler: [
      { k: "taslak", ad: "Taslak", grup: "durum", test: function (t) { return t.durum === "taslak"; } },
      { k: "gonderildi", ad: "Gönderildi", grup: "durum", test: function (t) { return t.durum === "gonderildi"; } },
      { k: "kabul", ad: "Kabul edildi", grup: "durum", test: function (t) { return t.durum === "kabul"; } },
      { k: "kapanan", ad: "Red ya da süresi doldu", grup: "durum", test: function (t) { return t.durum === "red" || t.durum === "suresi"; } },
      { k: "yakin", ad: "Geçerliliği 7 gün içinde bitiyor", test: function (t) { var k = MK.gunFarki(MK.BUGUN, bitis(t)); return t.durum === "gonderildi" && k >= 0 && k <= 7; } }
    ],
    seciciler: [{ k: "musteri", ad: "Müşteri", secenek: function () {
      var l = T.map(function (t) { return t.m; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (t, v) { return v === "tumu" || t.m === v; } }],
    metin: function (t) { var ts = MV.tesis(t.tesis); return [t.no, ts.ad, MV.musteri(t.m).kisa, MV.musteri(t.m).unvan].join(" "); },
    imkansiz: "Bir teklif aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Teklif no", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-no" href="#/t/' + t.no + '">' + t.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(t.tarih) + "</span>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (t) { return "<span>" + kirp(MV.musteri(t.m).kisa) + kirp(MV.tesis(t.tesis).ad, "a-alt-satir") + "</span>"; } },
    { k: "kalem", baslik: "Kalem", kart: "govde", sira: 3, hucre: function (t) { return '<span class="a-kart-etiket">Kalem</span>' + t.kalemler.length + " tür · " + t.kalemler.reduce(function (n, k) { return n + k.adet; }, 0) + " ekipman"; } },
    { k: "tutar", baslik: "Tutar (KDV hariç)", kart: "govde", sira: 4, hucre: function (t) { return '<span class="a-kart-etiket">Tutar (KDV hariç)</span><span class="a-sayi">' + para(MV.teklifTutar(t)) + "</span>"; } },
    { k: "gecerlilik", baslik: "Geçerlilik", kart: "govde", sira: 5, hucre: function (t) {
      var k = MK.gunFarki(MK.BUGUN, bitis(t));
      return '<span class="a-kart-etiket">Geçerlilik</span>' + (t.durum === "gonderildi" ? '<span><span class="a-tarih-gun">' + MK.tarihYaz(bitis(t)) + '</span><span class="' + (k <= 7 ? "a-uyari-metin" : "a-tarih-saat") + '">' + k + " gün kaldı</span></span>"
        : t.durum === "kabul" || t.durum === "red" ? '<span class="a-alt-satir">' + DURUM[t.durum].ad + " " + MK.gunKisa(t.sonuc) + "</span>" : '<span class="a-deger-yok">—</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (t) { return rozet(DURUM[t.durum]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "t", kayitlar: T, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0; }); },
      bosVeri: { ikon: "file-text", baslik: "Teklif yok", metin: "“Teklif hazırla” ile müşteri, tesis ve kalemler seçilir." },
      tablo: { baslik: "Teklifler", sinif: "a-tablo-teklif", sutunlar: SUTUN, href: function (t) { return "#/t/" + t.no; } } });
  }

  /* ── TEKLİF SAYFASI ─────────────────────────────────────────────────────────────────────────────────── */
  function teklifCiz(t) {
    if (!t) {
      $("a-nesne").innerHTML = MK.kirinti([["Teklifler", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Teklif bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Teklif bulunamadı", metin: "Bu adreste teklif yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Tekliflere dön</a>" });
      return;
    }
    var m = MV.musteri(t.m), ts = MV.tesis(t.tesis), top = MV.teklifTutar(t), kabul = t.durum === "kabul";
    var eylem = MK.tus({ eylem: "pdf", ad: "PDF", ikon: "file-text", sinif: "a-tus-ikincil" }) +
      (t.durum === "taslak" ? '<a class="a-tus a-tus-ikincil" href="#/t/' + t.no + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a>" + MK.tus({ eylem: "gonder", ad: "Gönderildi olarak işaretle", ikon: "send" }) : "") +
      (t.durum === "gonderildi" ? '<a class="a-tus a-tus-ikincil" href="#/t/' + t.no + '/red">' + ikon("ban", "a-ikon-kucuk") + "Reddedildi</a>" + MK.tus({ eylem: "kabul", ad: "Kabul edildi", ikon: "check" }) : "") +
      (kabul ? MK.git({ hedef: "is-sozlesmesi", hash: "#/is/yeni?teklif=" + t.no, ad: "İş sözleşmesi", ikon: "file-signature", ne: "İş sözleşmesi" }) +
        MK.git({ hedef: "plan-ac", hash: "#/?tesis=" + t.tesis, ad: "Plan aç", ikon: "calendar-check", sinif: "a-tus-birincil", ne: "Plan açma" }) : "") +
      (t.durum === "suresi" || t.durum === "red" ? '<a class="a-tus a-tus-birincil" href="#/yeni?kopya=' + t.no + '">' + ikon("plus", "a-ikon-kucuk") + "Yeni teklif (kopyala)</a>" : "");
    var KS = [
      { k: "tur", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: function (k) { var tr = MV.tur(k.tur); return kirp(tr.ad) + '<span class="a-alt-satir">' + MV.bransAd(tr.b) + " · periyot " + tr.periyot + " ay</span>"; } },
      { k: "adet", baslik: "Adet", kart: "govde", sira: 2, hucre: function (k) { return '<span class="a-kart-etiket">Adet</span><span class="a-sayi">' + k.adet + "</span>"; } },
      { k: "fiyat", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: function (k) { return '<span class="a-kart-etiket">Birim fiyat</span>' + para(k.fiyat); } },
      { k: "tutar", baslik: "Tutar", kart: "govde", sira: 4, hucre: function (k) { return '<span class="a-kart-etiket">Tutar</span><span class="a-sayi">' + para(k.adet * k.fiyat) + "</span>"; } }
    ].concat(kabul ? [{ k: "rapor", baslik: "Raporlanan", kart: "rozet", sira: 1, hucre: function (k) {
      var n = MV.kalemRaporlari(t, k.tur).length;
      return rozet({ ad: n + " / " + k.adet, rozet: n >= k.adet ? "a-rozet-tamam" : n ? "a-rozet-kabul" : "a-rozet-notr" });
    } }] : []);
    var raporlu = kabul ? t.kalemler.reduce(function (n, k) { return n + Math.min(k.adet, MV.kalemRaporlari(t, k.tur).length) * k.fiyat; }, 0) : 0;
    $("a-nesne").innerHTML = MK.kirinti([["Teklifler", "#/"], [t.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + t.no + "</h1>" + rozet(DURUM[t.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(3, "#/m/" + m.id) + '">' + kacis(m.unvan) + "</a> · " + kacis(ts.ad) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + eylem + "</div></div>" +
      (t.durum === "red" ? '<div class="a-serit-kap">' + MK.serit("hata", "ban", "Reddedildi " + MK.tarihYaz(t.sonuc) + ": “" + kacis(t.gerekce) + "”") + "</div>" : "") +
      (t.durum === "suresi" ? '<div class="a-serit-kap">' + MK.serit("uyari", "clock", "Geçerlilik " + MK.tarihYaz(bitis(t)) + " tarihinde doldu, müşteri yanıt vermedi. Yeniden göndermek için kopyalanır (numara yeni).") + "</div>" : "") +
      (kabul ? '<div class="a-serit-kap">' + MK.serit("onay", "circle-check", "Kabul edildi " + MK.tarihYaz(t.sonuc) + ". Sıradaki: iş sözleşmesi ve İSG-KATİP kaydı, sonra plan. Tesisin raporları bu kalemlere türüyle bağlanır.") + "</div>" : "") +
      '<div class="a-serit-kap"><dl class="a-bilgi">' + bilgi("Hazırlanan", MK.tarihYaz(t.tarih) + '<span class="a-alt-satir">' + kacis(MV.kisi(t.hazirlayan).ad) + "</span>") +
        bilgi("Gönderildi", t.gonderildi ? MK.tarihYaz(t.gonderildi) : '<span class="a-deger-yok">Henüz değil</span>') +
        bilgi("Geçerlilik", t.gecerlilik + " gün" + (t.gonderildi ? '<span class="a-alt-satir">' + MK.tarihYaz(bitis(t)) + "'e kadar</span>" : "")) +
        bilgi("İlgili kişi", kacis(m.ilgili)) + "</dl></div>" +
      '<section class="a-bolum" aria-labelledby="a-b-kalem"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kalem">Kalemler</h2><span class="a-sayac"><b>' + t.kalemler.length + "</b> tür</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Teklif kalemleri", sinif: kabul ? "a-tablo-kalem a-tablo-kalem-rapor" : "a-tablo-kalem", sutunlar: KS, kayitlar: t.kalemler }) + "</div>" +
        '<dl class="a-bilgi a-bolum-serit">' + bilgi("Ara toplam", para(top)) + bilgi("KDV %" + MV.KDV, para(kdvli(top) - top)) + bilgi("Genel toplam", "<b>" + para(kdvli(top)) + "</b>") +
          (kabul ? bilgi("Raporlanan tutar", para(raporlu) + '<span class="a-alt-satir">muhasebe ve performans buradan (§3.2 madde 5)</span>') : "") + "</dl></section>";
  }

  /* ── FORM ─────────────────────────────────────────────────────────────────────────────────────────── */
  var F = null;
  function formAc(t, kopya) {
    var k = t || kopya;
    F = { no: t ? t.no : null, m: k ? k.m : "", tesis: k ? k.tesis : "", gecerlilik: String(k ? k.gecerlilik : 30), not: "", hata: {},
      kalemler: k ? k.kalemler.map(function (x) { return { tur: x.tur, adet: String(x.adet), fiyat: String(x.fiyat) }; }) : [{ tur: "", adet: "1", fiyat: "" }] };
    var q = /[?&]tesis=(t\d+)/.exec(location.hash); if (!k && q && MV.tesis(q[1])) { F.tesis = q[1]; F.m = MV.tesis(q[1]).m; }
  }
  var sayi = function (v) { var n = parseFloat(String(v).replace(/\./g, "").replace(",", ".")); return /^\s*[\d.]+(,\d{1,2})?\s*$/.test(String(v)) ? n : NaN; };
  var formTop = function () { return F.kalemler.reduce(function (n, k) { var a = +k.adet, f = sayi(k.fiyat); return n + (a > 0 && f > 0 ? a * f : 0); }, 0); };
  function formCiz(odak) {
    var h = F.hata, m = F.m ? MV.musteri(F.m) : null;
    var musteriler = MV.MUSTERILER.map(function (x) { return [x.id, x.kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); });
    var turler = MV.KATALOG.map(function (x) { return [x.k, x.ad, para(MV.FIYAT[x.k])]; });
    var top = formTop();
    $("a-form-gorunum").innerHTML = MK.kirinti(F.no ? [["Teklifler", "#/"], [F.no, "#/t/" + F.no], ["Düzenle"]] : [["Teklifler", "#/"], ["Yeni teklif"]]) +
      '<div class="a-sayfa-bas"><h1 tabindex="-1">' + (F.no ? F.no + " · düzenle" : "Yeni teklif") + "</h1></div>" +
      (Object.keys(h).length ? '<div class="a-serit-kap">' + MK.serit("hata", "circle-alert", "Kaydedilmedi: " + Object.keys(h).length + " eksik düzeltilmeli.") + "</div>" : "") +
      '<div class="a-form-sayfa"><div class="a-form-sayfa a-alan-genis">' +
        '<section class="a-form-bolum" aria-labelledby="f-b1"><h2 id="f-b1">Müşteri ve tesis</h2><div class="a-form">' +
          MK.alan({ id: "f-m", etiket: "Müşteri", zorunlu: true, hata: h.m, genis: true, ipucu: m ? kacis(m.unvan) : "", girdi: MK.secim({ id: "f-m", ad: "Müşteri", deger: F.m, secenekler: musteriler, ipucu: "Müşteri seçin", gecersiz: !!h.m, tanim: "f-m-ipucu" }) }) +
          MK.alan({ id: "f-tesis", etiket: "Tesis", zorunlu: true, hata: h.tesis, genis: true, ipucu: F.tesis ? MV.tesisKalemleri(F.tesis).reduce(function (n, k) { return n + k.adet; }, 0) + " kayıtlı ekipman" : "",
            girdi: m ? MK.secim({ id: "f-tesis", ad: "Tesis", deger: F.tesis, secenekler: MV.tesisleri(m.id).map(function (x) { return [x.id, x.ad, x.ilce + " / " + x.il]; }), ipucu: "Tesis seçin", gecersiz: !!h.tesis, tanim: "f-tesis-ipucu" })
              : '<input class="a-girdi a-girdi-oku" id="f-tesis" readonly value="Önce müşteri seçin" aria-describedby="f-tesis-ipucu">' }) + "</div></section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b2"><h2 id="f-b2">Koşullar</h2><div class="a-form">' +
          MK.alan({ id: "f-gecerlilik", etiket: "Geçerlilik (gün)", zorunlu: true, hata: h.gecerlilik, ipucu: "Gönderildiği günden", girdi: MK.girdi({ id: "f-gecerlilik", alan: "gecerlilik", deger: F.gecerlilik, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', hata: h.gecerlilik }) }) +
          '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="f-not">Not</label><textarea class="a-alan a-alan-ince" id="f-not" data-alan="not" maxlength="300" placeholder="Ödeme, ulaşım, ek koşullar">' + kacis(F.not) + "</textarea></div>" +
        "</div></section></div>" +
        '<section class="a-form-bolum a-alan-genis" aria-labelledby="f-b3"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="f-b3">Kalemler</h2><span class="a-sayac">ekipman türü × adet × birim fiyat</span></div>' +
          '<p class="a-bolum-aciklama">Birim fiyat firmanın fiyat listesinden gelir, teklife özel değiştirilebilir. Raporlar kalemlere türüyle bağlanır.</p>' +
          F.kalemler.map(function (k, i) {
            var a = +k.adet, f = sayi(k.fiyat);
            return '<div class="a-kalem">' +
              MK.alan({ id: "f-tur-" + i, etiket: "Ekipman türü", hata: h["tur-" + i], girdi: MK.secim({ id: "f-tur-" + i, ad: "Ekipman türü " + (i + 1), deger: k.tur, secenekler: turler, ipucu: "Tür seçin", gecersiz: !!h["tur-" + i], tanim: "f-tur-" + i + "-ipucu" }) }) +
              MK.alan({ id: "f-adet-" + i, etiket: "Adet", hata: h["adet-" + i], girdi: MK.girdi({ id: "f-adet-" + i, alan: "adet-" + i, deger: k.adet, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', hata: h["adet-" + i] }) }) +
              MK.alan({ id: "f-fiyat-" + i, etiket: "Birim fiyat (TL)", hata: h["fiyat-" + i], girdi: MK.girdi({ id: "f-fiyat-" + i, alan: "fiyat-" + i, deger: k.fiyat, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="10"', hata: h["fiyat-" + i] }) }) +
              '<div class="a-alan-grup"><p class="a-etiket">Tutar</p><p class="a-kalem-tutar" id="f-tutar-' + i + '">' + (a > 0 && f > 0 ? para(a * f) : "—") + "</p></div>" +
              MK.tus({ eylem: "kalem-sil", ad: "Kaldır", ikon: "x", sinif: "a-tus-ikincil a-kalem-sil", veri: { i: i }, kapali: F.kalemler.length === 1 }) + "</div>";
          }).join("") + (h.kalem ? '<p class="a-ipucu a-ipucu-uyari">' + h.kalem + "</p>" : "") +
          '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "doldur", ad: "Tesisteki ekipmandan doldur", ikon: "list-checks", sinif: "a-tus-ikincil", kapali: !F.tesis }) +
            MK.tus({ eylem: "kalem-ekle", ad: "Kalem ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>" +
          '<dl class="a-bilgi a-bolum-serit" id="f-toplam">' + toplamHtml(top) + "</dl></section>" +
      "</div>" +
      '<div class="a-form-eylem"><p class="a-adim-not">Taslak olarak kaydedilir; gönderilince durum değişir.</p>' +
        '<a class="a-tus a-tus-ikincil" href="' + (F.no ? "#/t/" + F.no : "#/") + '">Vazgeç</a>' + MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  var toplamHtml = function (top) { return bilgi("Ara toplam", para(top)) + bilgi("KDV %" + MV.KDV, para(kdvli(top) - top)) + bilgi("Genel toplam", "<b>" + para(kdvli(top)) + "</b>"); };
  function denetle() {
    var h = {}, gor = {};
    if (!F.m) h.m = "Müşteri seçilmeli.";
    if (!F.tesis) h.tesis = "Tesis seçilmeli.";
    if (!/^\d{1,3}$/.test(F.gecerlilik) || +F.gecerlilik < 1) h.gecerlilik = "Gün, 1–999.";
    F.kalemler.forEach(function (k, i) {
      if (!k.tur) h["tur-" + i] = "Tür seçilmeli.";
      else if (gor[k.tur]) h["tur-" + i] = "Bu tür yukarıda var; adedini artırın.";
      gor[k.tur] = 1;
      if (!/^\d{1,3}$/.test(k.adet) || +k.adet < 1) h["adet-" + i] = "1–999.";
      if (!(sayi(k.fiyat) > 0)) h["fiyat-" + i] = "Tutar, ör. 1.250,00.";
    });
    return h;
  }

  /* ── RED PENCERESİ ─────────────────────────────────────────────────────────────────────────────────── */
  var W = null;
  function redCiz(odak) {
    $("a-pencere-baslik").textContent = "Reddedildi · " + W.t.no;
    $("a-pencere-govde").innerHTML = '<div class="a-alan-grup"><label class="a-etiket" for="w-gerekce">Müşterinin gerekçesi <span class="a-zorunlu">zorunlu</span></label>' +
      '<textarea class="a-alan" id="w-gerekce" data-alan="gerekce" maxlength="300"' + (W.hata ? ' aria-invalid="true"' : "") + ' aria-describedby="w-gerekce-ipucu" placeholder="ör. fiyat, zamanlama, başka firma">' + kacis(W.gerekce) + "</textarea>" +
      '<p class="a-ipucu' + (W.hata ? " a-ipucu-uyari" : "") + '" id="w-gerekce-ipucu">' + (W.hata || "Kayıtta kalır; sonraki teklifte görülür.") + "</p></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "red-kaydet", ad: "Reddedildi olarak kaydet", ikon: "ban" });
    if (odak) $(odak).focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/yeni") return { v: "form" };
    if ((m = /^#\/t\/([A-Z0-9-]+)\/duzenle$/.exec(h))) return { v: "form", no: m[1] };
    if ((m = /^#\/t\/([A-Z0-9-]+)\/red$/.exec(h))) return { v: "teklif", no: m[1], pencere: true };
    if ((m = /^#\/t\/([A-Z0-9-]+)$/.exec(h))) return { v: "teklif", no: m[1] };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), t = r.no ? MV.teklif(r.no) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v !== "teklif"; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") { $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t"); MK.suzgecKur("t"); }
    else if (r.v === "teklif") teklifCiz(t);
    else {
      if (t && t.durum !== "taslak") { location.replace("#/t/" + t.no); return; }   /* yalnız taslak düzenlenir */
      var kq = /[?&]kopya=([A-Z0-9-]+)/.exec(location.hash);
      if (!F || odakla) formAc(t, kq ? MV.teklif(kq[1]) : null); formCiz();
    }
    document.title = (r.v === "liste" ? "Teklifler" : r.v === "form" ? (r.no ? r.no + " · düzenle" : "Yeni teklif") : t ? t.no : "Teklif bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere && t && t.durum === "gonderildi") { W = { t: t, gerekce: "", hata: "" }; redCiz(); if (!$("a-pencere").open) $("a-pencere").showModal(); $("w-gerekce").focus(); }
    else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) {
    if (id === "f-m") { if (F.m !== deger) { F.m = deger; F.tesis = ""; } delete F.hata.m; }
    else if (id === "f-tesis") { F.tesis = deger; delete F.hata.tesis; }
    else if (/^f-tur-\d+$/.test(id)) { var i = +id.slice(6); F.kalemler[i].tur = deger; if (!F.kalemler[i].fiyat) F.kalemler[i].fiyat = MV.para(MV.FIYAT[deger]).replace(" TL", ""); delete F.hata["tur-" + i]; }
    formCiz(id);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k) return;
    if (W && $("a-pencere").open) { W.gerekce = e.target.value; return; }
    if (!F) return;
    var m = /^(adet|fiyat)-(\d+)$/.exec(k);
    if (m) {   /* tutar ve toplam yazarken güncellenir; alan yeniden çizilmez (odak kaçmaz) */
      var x = F.kalemler[+m[2]]; x[m[1]] = e.target.value;
      var a = +x.adet, f = sayi(x.fiyat); $("f-tutar-" + m[2]).textContent = a > 0 && f > 0 ? para(a * f) : "—";
      $("f-toplam").innerHTML = toplamHtml(formTop());
    } else F[k] = e.target.value;
  };
  var X = MK.eylem;
  X["yeni"] = function () { location.hash = "#/yeni"; };
  X["kalem-ekle"] = function () { F.kalemler.push({ tur: "", adet: "1", fiyat: "" }); delete F.hata.kalem; formCiz("f-tur-" + (F.kalemler.length - 1)); };
  X["kalem-sil"] = function (el) { F.kalemler.splice(+el.dataset.i, 1); F.hata = {}; formCiz("f-tur-0"); };
  X["doldur"] = function () {
    F.kalemler = MV.tesisKalemleri(F.tesis).map(function (k) { return { tur: k.tur, adet: String(k.adet), fiyat: MV.para(k.fiyat).replace(" TL", "") }; }); F.hata = {};
    formCiz("f-tur-0"); MK.bildir(F.kalemler.length + " tür, tesisteki kayıtlı ekipmandan eklendi.");
  };
  X["kaydet"] = function () {
    F.hata = denetle(); var hk = Object.keys(F.hata);
    if (hk.length) { formCiz("f-" + hk[0]); return; }
    var kal = F.kalemler.map(function (k) { return { tur: k.tur, adet: +k.adet, fiyat: sayi(k.fiyat) }; }), t = F.no ? MV.teklif(F.no) : null;
    if (t) Object.assign(t, { m: F.m, tesis: F.tesis, gecerlilik: +F.gecerlilik, kalemler: kal });
    else {
      var n = T.filter(function (x) { return x.no.indexOf("T-0926-") === 0; }).length + 1;
      t = { no: "T-0926-" + ("00" + n).slice(-3), m: F.m, tesis: F.tesis, durum: "taslak", tarih: MK.BUGUN, gonderildi: null, sonuc: null, gerekce: "", gecerlilik: +F.gecerlilik, hazirlayan: "za", kalemler: kal };
      T.push(t);
    }
    F = null; location.hash = "#/t/" + t.no; MK.bildir(t.no + " kaydedildi (taslak).");
  };
  X["gonder"] = function () { var t = MV.teklif(rota().no); t.durum = "gonderildi"; t.gonderildi = MK.BUGUN; teklifCiz(t); MK.bildir(t.no + " gönderildi olarak işaretlendi; geçerlilik " + MK.tarihYaz(bitis(t)) + "'e kadar."); };
  X["kabul"] = function () { var t = MV.teklif(rota().no); t.durum = "kabul"; t.sonuc = MK.BUGUN; teklifCiz(t); MK.bildir(t.no + " kabul edildi. Sıradaki: iş sözleşmesi, sonra plan."); };
  X["red-kaydet"] = function () {
    if (W.gerekce.trim().length < 5) { W.hata = "Gerekçe yazılmalı."; redCiz("w-gerekce"); return; }
    var t = W.t; t.durum = "red"; t.sonuc = MK.BUGUN; t.gerekce = W.gerekce.trim(); $("a-pencere").close(); teklifCiz(t); MK.bildir(t.no + " reddedildi olarak kaydedildi.");
  };
  X["pdf"] = function () { MK.bildir("Makette dosya yok. Uygulamada teklif PDF'i sunucuda üretilir; müşteriye iletim yöntemi soru."); };
  $("a-pencere").addEventListener("close", function () { W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", "#/t/" + r.no); });

  MK.kabuk({ modul: 11, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  goster(false);
})();
