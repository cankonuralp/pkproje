/* ══ probata MAKET M12 — Teklifler (modül 11, faz 2) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ══════════════════════════════════
   Kaynak: pkproje.md §1.1 (akış: "teklif verildi → teklif kabul edildi → sözleşmeler yapıldı → planlama"), §3.1 modül 11 (müşteri, tesis,
   kalemler: ekipman türü × adet × birim fiyat, durum), §3.2 madde 5 (her rapor teklif kalemine bağlanır; Performans'taki kazanç buradan).
   Ekranlar: liste (#/) · teklif sayfası (#/t/<no>: kalemler, KDV, raporlanan adet; duruma göre eylem) · form (#/yeni, #/t/<no>/duzenle:
   fiyat listesinden birim fiyat, "tesisteki ekipmandan doldur") · red gerekçesi penceresi. Kabulden sonra: iş sözleşmesi (M13) → plan aç (M6).
   Kullanıcı: Zeynep Arslan (planlama ekibi). Tutarlar ÖRNEK, TL, KDV hariç; KDV %20. UYDURMA veri.
   2026-09-27 (reisim: "teklif hazırlarken kayıtlı olmayan müşterilere de hazırlayabilmeliyim … el ile müşteri girişinde ilgili bilgiler
   istensin, adres vb teklif pdf i müşteriden(pk firması) alınacak ve bu kısım alınan pdf e göre değişebilir"): teklif kayıtlı olmayan
   müşteriye de hazırlanır (t.aday: ünvan, vergi, adres, il/ilçe, e-posta, telefon, yetkili); kabul edilince "Müşteri olarak kaydet" ile
   müşteri ve tesis açılır, sonra iş sözleşmesi ve plan. Teklif PDF'inin biçimi PK firmasının verdiği PDF'e göre kurulur. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var T = MV.TEKLIFLER, para = MV.para;
  var DURUM = { taslak: { ad: "Taslak", rozet: "a-rozet-notr" }, gonderildi: { ad: "Gönderildi", rozet: "a-rozet-kabul" }, kabul: { ad: "Kabul edildi", rozet: "a-rozet-tamam" },
    red: { ad: "Reddedildi", rozet: "a-rozet-red" }, suresi: { ad: "Süresi doldu", rozet: "a-rozet-bekliyor" } };
  var bitis = function (t) { var d = new Date((t.gonderildi || t.tarih) + "T12:00:00"); d.setDate(d.getDate() + t.gecerlilik); return d.toISOString().slice(0, 10); };
  /* 120 (2026-09-26): KDV varsayılan %20, teklifte değiştirilebilir (t.kdv) */
  var oran = function (t) { return t && t.kdv != null ? t.kdv : MV.KDV; };
  var kdvli = function (n, o) { return Math.round(n * (100 + (o == null ? MV.KDV : o))) / 100; };
  /* kayıtlı olmayan müşteri (aday): adı ve yeri teklifin kendisinde */
  var musteriAd = function (t) { return t.m ? MV.musteri(t.m).kisa : t.aday.unvan; };
  var yerAd = function (t) { return t.m ? MV.teklifTesisleri(t).map(function (x) { return MV.tesis(x).ad; }).join(", ") : t.aday.ilce + " / " + t.aday.il; };
  var ADAY_BOS = { unvan: "", vd: "", vno: "", adres: "", il: "", ilce: "", eposta: "", tel: "", yetkili: "" };
  /* örnek: kayıtlı olmayan müşteriye gönderilmiş teklif (UYDURMA) */
  T.push({ no: "T-0926-" + ("00" + (T.filter(function (x) { return x.no.indexOf("T-0926-") === 0; }).length + 1)).slice(-3), m: null, tesis: null, durum: "gonderildi",
    tarih: "2026-09-22", gonderildi: "2026-09-22", sonuc: null, gerekce: "", gecerlilik: 30, hazirlayan: "za",
    aday: { unvan: "Aday Kalıp Sanayi Ltd. Şti.", vd: "Tuzla", vno: "", adres: "Aydınlı Mahallesi Sanayi Caddesi No: 7", il: "İstanbul", ilce: "Tuzla",
      eposta: "satinalma@aday-kalip.example", tel: "", yetkili: "Cem Aksoy · Satın alma" },
    kalemler: [{ tur: "FL", adet: 2, fiyat: MV.FIYAT.FL }, { tur: "KK", adet: 1, fiyat: MV.FIYAT.KK }, { tur: "HT", adet: 3, fiyat: MV.FIYAT.HT }] });

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
      var l = T.map(function (t) { return t.m; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
    }, gecer: function (t, v) { return v === "tumu" || t.m === v; } }],
    metin: function (t) { return t.m ? [t.no, MV.tesis(t.tesis).ad, MV.musteri(t.m).kisa, MV.musteri(t.m).unvan].join(" ") : [t.no, t.aday.unvan, t.aday.il, t.aday.ilce].join(" "); },
    imkansiz: "Bir teklif aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Teklif no", kart: "ust", sira: 1, hucre: function (t) { return '<a class="a-no" href="#/t/' + t.no + '">' + t.no + '</a><span class="a-alt-satir">' + MK.tarihYaz(t.tarih) + "</span>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (t) { return "<span>" + kirp(musteriAd(t)) + kirp(t.m ? MV.tesis(t.tesis).ad : "Kayıtlı olmayan müşteri", "a-alt-satir") + "</span>"; } },
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
    var m = t.m ? MV.musteri(t.m) : null, top = MV.teklifTutar(t), kabul = t.durum === "kabul";
    var eylem = MK.tus({ eylem: "pdf", ad: "PDF", ikon: "file-text", sinif: "a-tus-ikincil" }) +
      (t.durum === "taslak" ? '<a class="a-tus a-tus-ikincil" href="#/t/' + t.no + '/duzenle">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a>" + MK.tus({ eylem: "gonder", ad: "Gönderildi olarak işaretle", ikon: "send" }) : "") +
      (t.durum === "gonderildi" ? '<a class="a-tus a-tus-ikincil" href="#/t/' + t.no + '/red">' + ikon("ban", "a-ikon-kucuk") + "Reddedildi</a>" + MK.tus({ eylem: "kabul", ad: "Kabul edildi", ikon: "check" }) : "") +
      (kabul && !m ? MK.tus({ eylem: "musteri-kaydet", ad: "Müşteri olarak kaydet", ikon: "user-plus" }) : "") +
      (kabul && m ? MK.git({ hedef: "is-sozlesmesi", hash: "#/yeni?teklif=" + t.no, ad: "İş sözleşmesi", ikon: "file-signature", ne: "İş sözleşmesi" }) +
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
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + (m ? '<a class="a-baglanti" href="' + MK.adres(3, "#/m/" + m.id) + '">' + kacis(m.unvan) + "</a>" : kacis(t.aday.unvan) + " " + rozet({ ad: "Kayıtlı değil", rozet: "a-rozet-bekliyor" })) +
          " · " + kacis(yerAd(t)) + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + eylem + "</div></div>" +
      (t.durum === "red" ? '<div class="a-serit-kap">' + MK.serit("hata", "ban", "Reddedildi " + MK.tarihYaz(t.sonuc) + ": “" + kacis(t.gerekce) + "”") + "</div>" : "") +
      (t.durum === "suresi" ? '<div class="a-serit-kap">' + MK.serit("uyari", "clock", "Geçerlilik " + MK.tarihYaz(bitis(t)) + " tarihinde doldu.") + "</div>" : "") +
      (kabul ? '<div class="a-serit-kap">' + MK.serit("onay", "circle-check", "Kabul edildi " + MK.tarihYaz(t.sonuc) + "." + (m ? "" : " Müşteri kayıtlı değil: “Müşteri olarak kaydet” ile müşteri ve tesis açılır, sonra iş sözleşmesi ve plan.")) + "</div>" : "") +
      '<div class="a-serit-kap"><dl class="a-bilgi">' + bilgi("Hazırlanan", MK.tarihYaz(t.tarih) + '<span class="a-alt-satir">' + kacis(MV.kisi(t.hazirlayan).ad) + "</span>") +
        bilgi("Gönderildi", t.gonderildi ? MK.tarihYaz(t.gonderildi) : '<span class="a-deger-yok">Henüz değil</span>') +
        bilgi("Geçerlilik", t.gecerlilik + " gün" + (t.gonderildi ? '<span class="a-alt-satir">' + MK.tarihEk(bitis(t), "e") + " kadar</span>" : "")) +
        bilgi("İlgili kişi", kacis(m ? m.ilgili : t.aday.yetkili || "-")) + "</dl></div>" +
      /* kayıtlı olmayan müşterinin elle girilen bilgileri */
      (m ? "" : '<section class="a-bolum" aria-labelledby="a-b-aday"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-aday">Müşteri bilgileri</h2></div><dl class="a-satirlar">' +
        [["Ünvan", t.aday.unvan], ["Vergi dairesi / no", [t.aday.vd, t.aday.vno].filter(Boolean).join(" · ")], ["Adres", t.aday.adres + ", " + t.aday.ilce + " / " + t.aday.il],
          ["E-posta", t.aday.eposta], ["Telefon", t.aday.tel], ["Yetkili", t.aday.yetkili]].map(function (x) { return '<div class="a-satir"><dt>' + x[0] + "</dt><dd>" + (x[1] ? kacis(x[1]) : "-") + "</dd></div>"; }).join("") + "</dl></section>") +
      '<section class="a-bolum" aria-labelledby="a-b-kalem"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kalem">Kalemler</h2><span class="a-sayac"><b>' + t.kalemler.length + "</b> tür" +
        (t.ekipmanlar && t.ekipmanlar.length ? " · <b>" + t.ekipmanlar.length + "</b> ekipman (Excel'den)" : "") + "</span>" +
        (excelKaynak(t).l.length ? '<div class="a-eylem-cubugu a-bolum-tus">' + MK.tus({ eylem: "excel-disa", ad: "Excel'e aktar", ikon: "download", sinif: "a-tus-ikincil" }) + "</div>" : "") + "</div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Teklif kalemleri", sinif: kabul ? "a-tablo-kalem a-tablo-kalem-rapor" : "a-tablo-kalem", sutunlar: KS, kayitlar: t.kalemler }) + "</div>" +
        '<dl class="a-bilgi a-bolum-serit">' + bilgi("Ara toplam", para(top)) + bilgi("KDV %" + oran(t), para(kdvli(top, oran(t)) - top)) + bilgi("Genel toplam", "<b>" + para(kdvli(top, oran(t))) + "</b>") +
          (kabul ? bilgi("Raporlanan tutar", para(raporlu)) : "") + "</dl></section>";
  }

  /* ── FORM ─────────────────────────────────────────────────────────────────────────────────────────── */
  var F = null;
  function formAc(t, kopya) {
    var k = t || kopya;
    F = { no: t ? t.no : null, ekipmanlar: k && k.ekipmanlar ? k.ekipmanlar.map(function (x) { return Object.assign({}, x); }) : [], tip: k && k.aday ? "aday" : "kayitli", aday: Object.assign({}, ADAY_BOS, k && k.aday ? k.aday : {}), m: k && k.m ? k.m : "", tesis: k && k.tesis ? k.tesis : "", ek: k && k.m ? MV.teklifTesisleri(k).slice(1) : [], kdv: String(oran(k)), gecerlilik: k ? String(k.gecerlilik) : "", not: "", hata: {},
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
        '<section class="a-form-bolum" aria-labelledby="f-b1"><h2 id="f-b1">Müşteri ve tesis</h2>' +
          '<div class="a-sekmeler a-bolum-serit" role="group" aria-label="Müşteri">' + [["kayitli", "Kayıtlı müşteri"], ["aday", "Kayıtlı olmayan müşteri"]].map(function (x) {
            return '<button type="button" class="a-sekme" data-eylem="tip" data-deger="' + x[0] + '" aria-pressed="' + (F.tip === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>" +
          (F.tip === "aday" ? adayHtml(h) : '<div class="a-form">' +
          MK.alan({ id: "f-m", etiket: "Müşteri", zorunlu: true, hata: h.m, genis: true, ipucu: m ? kacis(m.unvan) : "", girdi: MK.secim({ id: "f-m", ad: "Müşteri", deger: F.m, secenekler: musteriler, ipucu: "Müşteri seçin", gecersiz: !!h.m, tanim: "f-m-ipucu" }) }) +
          MK.alan({ id: "f-tesis", etiket: "Tesis", zorunlu: true, hata: h.tesis, genis: true, ipucu: F.tesis ? MV.tesisKalemleri(F.tesis).reduce(function (n, k) { return n + k.adet; }, 0) + " kayıtlı ekipman" : "",
            girdi: m ? MK.secim({ id: "f-tesis", ad: "Tesis", deger: F.tesis, secenekler: MV.tesisleri(m.id).map(function (x) { return [x.id, x.ad, x.ilce + " / " + x.il]; }), ipucu: "Tesis seçin", gecersiz: !!h.tesis, tanim: "f-tesis-ipucu" })
              : '<input class="a-girdi a-girdi-oku" id="f-tesis" readonly value="Önce müşteri seçin" aria-describedby="f-tesis-ipucu">' }) +
          (m && F.tesis && MV.tesisleri(m.id).length > 1 ? '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Başka tesisler</p>' + MV.tesisleri(m.id).filter(function (x) { return x.id !== F.tesis; }).map(function (x) {
            return '<label class="a-onay-kutusu"><input type="checkbox" data-ektesis="' + x.id + '"' + (F.ek.indexOf(x.id) >= 0 ? " checked" : "") + "><span>" + kacis(x.ad) + "</span></label>"; }).join("") + "</div>" : "") +
          "</div>") + "</section>" +
        '<section class="a-form-bolum" aria-labelledby="f-b2"><h2 id="f-b2">Koşullar</h2><div class="a-form">' +
          MK.alan({ id: "f-gecerlilik", etiket: "Geçerlilik (gün)", zorunlu: true, hata: h.gecerlilik, ipucu: "Gönderildiği günden", girdi: MK.girdi({ id: "f-gecerlilik", alan: "gecerlilik", deger: F.gecerlilik, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3" placeholder="ör. 30"', hata: h.gecerlilik }) }) +
          MK.alan({ id: "f-kdv", etiket: "KDV (%)", zorunlu: true, hata: h.kdv, girdi: MK.girdi({ id: "f-kdv", alan: "kdv", deger: F.kdv, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="2"', hata: h.kdv }) }) +
          '<div class="a-alan-grup a-alan-genis"><label class="a-etiket" for="f-not">Not</label><textarea class="a-alan a-alan-ince" id="f-not" data-alan="not" maxlength="300" placeholder="Ödeme, ulaşım, ek koşullar">' + kacis(F.not) + "</textarea></div>" +
        "</div></section></div>" +
        '<section class="a-form-bolum a-alan-genis" aria-labelledby="f-b3"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="f-b3">Kalemler</h2></div>' +
          F.kalemler.map(function (k, i) {
            var a = +k.adet, f = sayi(k.fiyat);
            return '<div class="a-kalem">' +
              MK.alan({ id: "f-tur-" + i, etiket: "Ekipman türü", hata: h["tur-" + i], girdi: MK.secim({ id: "f-tur-" + i, ad: "Ekipman türü " + (i + 1), deger: k.tur, secenekler: turler, ipucu: "Tür seçin", gecersiz: !!h["tur-" + i], tanim: "f-tur-" + i + "-ipucu" }) }) +
              MK.alan({ id: "f-adet-" + i, etiket: "Adet", hata: h["adet-" + i], girdi: MK.girdi({ id: "f-adet-" + i, alan: "adet-" + i, deger: k.adet, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', hata: h["adet-" + i] }) }) +
              MK.alan({ id: "f-fiyat-" + i, etiket: "Birim fiyat (TL)", hata: h["fiyat-" + i], girdi: MK.girdi({ id: "f-fiyat-" + i, alan: "fiyat-" + i, deger: k.fiyat, sinif: "a-girdi-sicil", ek: ' inputmode="decimal" maxlength="10"', hata: h["fiyat-" + i] }) }) +
              '<div class="a-alan-grup"><p class="a-etiket">Tutar</p><p class="a-kalem-tutar" id="f-tutar-' + i + '">' + (a > 0 && f > 0 ? para(a * f) : "—") + "</p></div>" +
              MK.tus({ eylem: "kalem-sil", ad: "Kaldır", ikon: "x", sinif: "a-tus-ikincil a-kalem-sil", veri: { i: i }, kapali: F.kalemler.length === 1 }) + "</div>";
          }).join("") + (h.kalem ? '<p class="a-ipucu a-ipucu-uyari">' + h.kalem + "</p>" : "") +
          (F.ekipmanlar.length ? '<p class="a-bolum-aciklama a-bolum-serit">Excel\'den yüklenen ekipman listesi: <b>' + F.ekipmanlar.length + "</b> ekipman; teklifle saklanır.</p>" : "") +
          '<div class="a-eylem-cubugu a-bolum-serit">' + (F.tip === "aday" ? "" : MK.tus({ eylem: "doldur", ad: "Tesisteki ekipmandan doldur", ikon: "list-checks", sinif: "a-tus-ikincil", kapali: !F.tesis })) +
            /* 2026-09-30 (L1, reisim: "teklif verirken excel ile ekipman export etme olsun"; soru cevabı: içe + dışa) */
            MK.tus({ eylem: "excel-ice", ad: "Excel'den yükle", ikon: "upload", sinif: "a-tus-ikincil" }) +
            MK.tus({ eylem: "excel-disa", ad: "Excel'e aktar", ikon: "download", sinif: "a-tus-ikincil", kapali: !excelKaynak(null).l.length, sebepId: "f-excel-sebep" }) +
            MK.tus({ eylem: "kalem-ekle", ad: "Kalem ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>" +
          (excelKaynak(null).l.length ? "" : '<p class="a-ipucu" id="f-excel-sebep">Excel\'e aktarılacak ekipman yok: tesis seçin ya da Excel\'den yükleyin.</p>') +
          '<dl class="a-bilgi a-bolum-serit" id="f-toplam">' + toplamHtml(top) + "</dl></section>" +
      "</div>" +
      '<div class="a-form-eylem">' +
        '<a class="a-tus a-tus-ikincil" href="' + (F.no ? "#/t/" + F.no : "#/") + '">Vazgeç</a>' + MK.tus({ eylem: "kaydet", ad: "Kaydet", ikon: "check" }) + "</div>";
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  /* kayıtlı olmayan müşteri: bilgiler elle (reisim 2026-09-27: "el ile müşteri girişinde ilgili bilgiler istensin, adres vb") */
  function adayHtml(h) {
    var a = F.aday, A = function (k, etiket, o) {
      o = o || {};
      return MK.alan({ id: "f-a-" + k, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, hata: h["a-" + k],
        girdi: MK.girdi({ id: "f-a-" + k, alan: "a-" + k, deger: a[k], sinif: o.sinif, ek: o.ek, hata: h["a-" + k] }) });
    };
    return '<div class="a-form">' + A("unvan", "Firma ünvanı", { zorunlu: true, genis: true, ek: ' maxlength="160"' }) +
      A("vd", "Vergi dairesi", { ek: ' maxlength="40"' }) + A("vno", "Vergi no", { sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="11"' }) +
      A("adres", "Adres", { zorunlu: true, genis: true, ek: ' maxlength="160"' }) + A("il", "İl", { zorunlu: true, ek: ' maxlength="30"' }) + A("ilce", "İlçe", { ek: ' maxlength="40"' }) +
      A("eposta", "E-posta", { sinif: "a-girdi-eposta", ek: ' type="email" inputmode="email" maxlength="120"' }) + A("tel", "Telefon", { sinif: "a-girdi-sicil", ek: ' type="tel" inputmode="tel" maxlength="20"' }) +
      A("yetkili", "Yetkili kişi", { genis: true, ek: ' maxlength="80"' }) + "</div>";
  }
  var toplamHtml = function (top) { var o = /^\d{1,2}$/.test(F.kdv) ? +F.kdv : MV.KDV; return bilgi("Ara toplam", para(top)) + bilgi("KDV %" + o, para(kdvli(top, o) - top)) + bilgi("Genel toplam", "<b>" + para(kdvli(top, o)) + "</b>"); };
  function denetle() {
    var h = {}, gor = {};
    if (F.tip === "aday") {
      if (F.aday.unvan.trim().length < 3) h["a-unvan"] = "Ünvan yazılmalı.";
      if (F.aday.adres.trim().length < 5) h["a-adres"] = "Adres yazılmalı.";
      if (!F.aday.il.trim()) h["a-il"] = "İl yazılmalı.";
    } else {
      if (!F.m) h.m = "Müşteri seçilmeli.";
      if (!F.tesis) h.tesis = "Tesis seçilmeli.";
    }
    if (!/^\d{1,3}$/.test(F.gecerlilik) || +F.gecerlilik < 1) h.gecerlilik = "Gün, 1–999.";
    if (!/^\d{1,2}$/.test(F.kdv)) h.kdv = "0–99.";
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
    if (r.v === "liste") {
      /* 2026-09-24: müşteri sayfasındaki "Teklif" yüzü → o müşterinin teklifleri */
      var mq = /[?&]musteri=(m\d+)/.exec(location.hash); if (mq && MV.musteri(mq[1])) { MK.suzgecSifirla("t"); SZ.t.sec.musteri = mq[1]; }
      $("a-suzgec-kap").innerHTML = MK.suzgecHtml("t"); MK.suzgecKur("t");
    }
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
  MK.onTikla = function (e) {
    var c = e.target.closest("[data-ektesis]"); if (!c || !F) return false;
    var id = c.dataset.ektesis, i = F.ek.indexOf(id); if (c.checked && i < 0) F.ek.push(id); else if (!c.checked && i >= 0) F.ek.splice(i, 1);
    return true;
  };
  MK.onSecim = function (id, deger) {
    if (id === "f-m") { if (F.m !== deger) { F.m = deger; F.tesis = ""; F.ek = []; } delete F.hata.m; }
    else if (id === "f-tesis") { F.tesis = deger; F.ek = F.ek.filter(function (x) { return x !== deger; }); delete F.hata.tesis; }
    else if (/^f-tur-\d+$/.test(id)) { var i = +id.slice(6); F.kalemler[i].tur = deger; if (!F.kalemler[i].fiyat) F.kalemler[i].fiyat = MV.para(MV.FIYAT[deger]).replace(" TL", ""); delete F.hata["tur-" + i]; }
    formCiz(id);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan; if (!k) return;
    if (W && $("a-pencere").open) { W.gerekce = e.target.value; return; }
    if (!F) return;
    if (k.indexOf("a-") === 0) { F.aday[k.slice(2)] = e.target.value; return; }
    var m = /^(adet|fiyat)-(\d+)$/.exec(k);
    if (m) {   /* tutar ve toplam yazarken güncellenir; alan yeniden çizilmez (odak kaçmaz) */
      var x = F.kalemler[+m[2]]; x[m[1]] = e.target.value;
      var a = +x.adet, f = sayi(x.fiyat); $("f-tutar-" + m[2]).textContent = a > 0 && f > 0 ? para(a * f) : "—";
      $("f-toplam").innerHTML = toplamHtml(formTop());
    } else { F[k] = e.target.value; if (k === "kdv") $("f-toplam").innerHTML = toplamHtml(formTop()); }
  };
  var X = MK.eylem;
  X["yeni"] = function () { location.hash = "#/yeni"; };
  X["tip"] = function (el) { F.tip = el.dataset.deger; F.hata = {}; formCiz(); var b = document.querySelector('[data-eylem="tip"][data-deger="' + F.tip + '"]'); if (b) b.focus(); };
  /* kabul edilmiş, kayıtlı olmayan müşterinin teklifi: müşteri + tesis açılır (maket: bu sayfada; gerçekte Müşteriler modülünde kayıt) */
  X["musteri-kaydet"] = function () {
    var t = MV.teklif(rota().no), a = t.aday, mid = "m" + (MV.MUSTERILER.length + 1), tid = "t" + (MV.TESISLER.length + 1);
    MV.MUSTERILER.push({ id: mid, unvan: a.unvan, kisa: a.unvan.split(" ").slice(0, 2).join(" "), vd: a.vd, vno: a.vno, eposta: a.eposta, tel: a.tel, ilgili: a.yetkili, acilis: MK.BUGUN, uygunsuz: 0 });
    MV.TESISLER.push({ id: tid, m: mid, ad: "Merkez", adres: a.adres, ilce: a.ilce, il: a.il, ekipman: 0, son: "", sonraki: "" });
    t.m = mid; t.tesis = tid; teklifCiz(t); var h = document.querySelector("#a-nesne h1"); if (h) h.focus();
    MK.bildir(a.unvan + " müşteri olarak kaydedildi (tesis: Merkez). Sıradaki: iş sözleşmesi, sonra plan.");
  };
  X["kalem-ekle"] = function () { F.kalemler.push({ tur: "", adet: "1", fiyat: "" }); delete F.hata.kalem; formCiz("f-tur-" + (F.kalemler.length - 1)); };
  X["kalem-sil"] = function (el) { F.kalemler.splice(+el.dataset.i, 1); F.hata = {}; formCiz("f-tur-0"); };
  X["doldur"] = function () {
    var top = {};   /* çok tesisli teklifte kalemler bütün seçili tesislerden toplanır */
    [F.tesis].concat(F.ek).forEach(function (tid) { MV.tesisKalemleri(tid).forEach(function (k) { if (!top[k.tur]) top[k.tur] = { tur: k.tur, adet: 0, fiyat: k.fiyat }; top[k.tur].adet += k.adet; }); });
    F.kalemler = Object.keys(top).map(function (k) { var x = top[k]; return { tur: x.tur, adet: String(x.adet), fiyat: MV.para(x.fiyat).replace(" TL", "") }; }); F.hata = {};
    formCiz("f-tur-0"); MK.bildir(F.kalemler.length + " tür, tesisteki kayıtlı ekipmandan eklendi.");
  };
  X["kaydet"] = function () {
    F.hata = denetle(); var hk = Object.keys(F.hata);
    if (hk.length) { formCiz("f-" + hk[0]); return; }
    var kal = F.kalemler.map(function (k) { return { tur: k.tur, adet: +k.adet, fiyat: sayi(k.fiyat) }; }), t = F.no ? MV.teklif(F.no) : null;
    var aday = F.tip === "aday", tl = !aday && F.ek.length ? [F.tesis].concat(F.ek) : null;
    var ad = aday ? Object.keys(F.aday).reduce(function (o, x) { o[x] = F.aday[x].trim(); return o; }, {}) : null;
    var ekl = F.ekipmanlar.length ? F.ekipmanlar.slice() : null;
    if (t) Object.assign(t, { m: aday ? null : F.m, tesis: aday ? null : F.tesis, aday: ad, tesisler: tl, kdv: +F.kdv, gecerlilik: +F.gecerlilik, kalemler: kal, ekipmanlar: ekl });
    else {
      var n = T.filter(function (x) { return x.no.indexOf("T-0926-") === 0; }).length + 1;
      t = { no: "T-0926-" + ("00" + n).slice(-3), m: aday ? null : F.m, tesis: aday ? null : F.tesis, aday: ad, durum: "taslak", tarih: MK.BUGUN, gonderildi: null, sonuc: null, gerekce: "", tesisler: tl, kdv: +F.kdv, gecerlilik: +F.gecerlilik, hazirlayan: "za", kalemler: kal, ekipmanlar: ekl };
      T.push(t);
    }
    F = null; location.hash = "#/t/" + t.no; MK.bildir(t.no + " kaydedildi (taslak).");
  };
  X["gonder"] = function () { var t = MV.teklif(rota().no); t.durum = "gonderildi"; t.gonderildi = MK.BUGUN; teklifCiz(t); MK.bildir(t.no + " gönderildi olarak işaretlendi; geçerlilik " + MK.tarihEk(bitis(t), "e") + " kadar."); };
  X["kabul"] = function () {   /* AA8: onay penceresi */
    var t0 = MV.teklif(rota().no);
    MK.onayla({ baslik: "Teklif kabul edildi mi?", metin: t0.no + " kabul edildi olarak işaretlenir; sıradaki adım iş sözleşmesi.", tus: "Kabul edildi", tamam: function () { var t = MV.teklif(rota().no); t.durum = "kabul"; t.sonuc = MK.BUGUN; teklifCiz(t); MK.bildir(t.no + " kabul edildi. Sıradaki: iş sözleşmesi, sonra plan."); } });
  };
  X["red-kaydet"] = function () {
    if (W.gerekce.trim().length < 5) { W.hata = "Gerekçe yazılmalı."; redCiz("w-gerekce"); return; }
    var t = W.t; t.durum = "red"; t.sonuc = MK.BUGUN; t.gerekce = W.gerekce.trim(); $("a-pencere").close(); teklifCiz(t); MK.bildir(t.no + " reddedildi olarak kaydedildi.");
  };
  /* ── EXCEL (L1, 2026-09-30): ekipman listesi içe (tür başına adetle kalemlere) ve dışa (yüklenen liste, yoksa tesisin kayıtlı ekipmanı).
     Gerçek .xlsx / .csv okunur ve yazılır (MK.tabloOku, MK.xlsx); planın Excel'iyle aynı düzen (şablon, satır satır denetim). */
  var EX = null;
  function excelKaynak(t) {   /* t: teklif sayfası; null: form */
    var ekl = t ? t.ekipmanlar : F && F.ekipmanlar, tip = t ? (t.aday ? "aday" : "kayitli") : F && F.tip, tsl = t ? (t.m ? MV.teklifTesisleri(t) : []) : F && F.tesis ? [F.tesis].concat(F.ek) : [];
    if (ekl && ekl.length) return { l: ekl, ne: "Excel'den yüklenen liste" };
    if (tip === "aday" || !tsl.length) return { l: [], ne: "" };
    return { l: MV.EKIPMAN.filter(function (e) { return tsl.indexOf(e.tesis) >= 0; }).map(function (e) { return { kod: e.kod, tur: e.tur, konum: e.konum || "", seri: e.seri || "" }; }), ne: "tesisteki kayıtlı ekipman" };
  }
  var exTablo = function (bas, satirlar) {
    return '<table class="a-belge-tablo"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (r) { return "<tr>" + r.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  };
  function exPencere(baslik, govde, alt) {
    $("a-pencere").dataset.kip = "excel"; $("a-pencere-baslik").textContent = baslik; $("a-pencere-govde").innerHTML = govde; $("a-pencere-alt").innerHTML = alt;
    if (!$("a-pencere").open) $("a-pencere").showModal(); $("a-pencere-govde").scrollTop = 0;
  }
  var exAd = function (t) { return (t ? t.no : F.no || "yeni-teklif") + "-ekipmanlar.xlsx"; };
  X["excel-disa"] = function () {
    var r = rota(), t = r.v === "teklif" ? MV.teklif(r.no) : null, k = excelKaynak(t); if (!k.l.length) return;
    EX = { t: t, k: k };
    exPencere("Excel'e aktar", '<p class="a-pencere-ozet"><b>' + k.l.length + " ekipman</b> · " + k.ne + " · " + exAd(t) + "</p>" +
      '<div class="a-excel-kap">' + exTablo(["Ekipman", "Konum · seri no"], k.l.map(function (e) { var tr = MV.tur(e.tur);
        return [(e.kod ? '<span class="a-kod">' + kacis(e.kod) + "</span> " : "") + kacis(tr ? tr.ad : e.tur) + '<span class="a-alt-satir">' + (tr ? MV.bransAd(tr.b) : "") + "</span>", kacis(e.konum || "—") + '<span class="a-alt-satir">' + kacis(e.seri || "") + "</span>"]; })) + "</div>",
      MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "excel-indir", ad: "İndir", ikon: "download" }));
    $("a-pencere-alt").querySelector(".a-tus-birincil").focus({ preventScroll: true });
  };
  X["excel-indir"] = function () {
    if (!EX) return;
    MK.indir(exAd(EX.t), MK.xlsx("Ekipmanlar", [["Kod", "Ekipman türü", "Konum", "Seri no", "Branş", "Birim fiyat (TL)"]].concat(EX.k.l.map(function (e) {
      var tr = MV.tur(e.tur); return [e.kod || "", tr ? tr.ad : e.tur, e.konum || "", e.seri || "", tr ? MV.bransAd(tr.b) : "", tr ? MV.para(MV.FIYAT[tr.k]).replace(" TL", "") : ""];
    }))));
  };
  function exIceCiz() {
    var gecerli = EX.satirlar.filter(function (x) { return x.ok; });
    exPencere("Excel'den yükle", '<p class="a-pencere-ozet">Müşterinin ekipman listesi. Sütunlar: Kod · Ekipman türü · Konum · Seri no; yalnız tür zorunlu. Geçerli satırlar tür başına adetle kalemlere eklenir, fiyat fiyat listesinden.</p>' +
      '<div class="a-dosya-sec">' + MK.tus({ eylem: "excel-sablon", ad: "Şablonu indir", ikon: "file-spreadsheet", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "excel-sec", ad: EX.dosya ? "Başka dosya seç" : "Dosya seç", ikon: "upload", sinif: "a-tus-ikincil" }) +
        '<span class="a-dosya-ad">' + (EX.dosya ? kacis(EX.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
      (EX.dosya ? '<div class="a-excel-kap">' + exTablo(["Satır", "Ekipman", "Durum"], EX.satirlar.map(function (x, i) {
        return [String(i + 2), (x.kod ? '<span class="a-kod">' + kacis(x.kod) + "</span> " : "") + kacis(x.turAd) + '<span class="a-alt-satir">' + kacis(x.konum) + "</span>",
          x.ok ? rozet({ ad: "Eklenecek", rozet: "a-rozet-tamam" }) : '<span class="a-uyari-metin a-hata-metin">' + kacis(x.neden) + "</span>"];
      })) + "</div>" : ""),
      MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "excel-yukle", ad: "Kalemlere ekle" + (EX.dosya ? " (" + gecerli.length + ")" : ""), ikon: "upload", kapali: !EX.dosya || !gecerli.length }));
  }
  var exSatirlar = function (ham) {
    if (ham.length && /kod|tür/i.test((ham[0][0] || "") + (ham[0][1] || ""))) ham = ham.slice(1);
    var kodlar = {};
    return ham.filter(function (h) { return h.some(function (x) { return String(x || "").trim(); }); }).map(function (h) {
      var kod = String(h[0] || "").trim().toLocaleUpperCase("tr"), ta = String(h[1] || "").trim(), t = MV.KATALOG.filter(function (x) { return MK.tr(x.ad) === MK.tr(ta) || x.k === ta.toUpperCase(); })[0];
      var ayni = kod && kodlar[kod]; if (kod) kodlar[kod] = 1;
      return { kod: kod, turAd: ta || "—", tur: t ? t.k : "", konum: String(h[2] || "").trim(), seri: String(h[3] || "").trim(), ok: !!t && !ayni,
        neden: !ta ? "Tür yok, atlanır" : !t ? "Tür bulunamadı, atlanır" : ayni ? "Kod dosyada iki kez, atlanır" : "" };
    });
  };
  X["excel-ice"] = function () { EX = { dosya: "", satirlar: [] }; exIceCiz(); document.querySelector('#a-pencere [data-eylem="excel-sec"]').focus(); };
  X["excel-sablon"] = function () { MK.indir("teklif-ekipman-sablonu.xlsx", MK.xlsx("Ekipmanlar", [["Kod", "Ekipman türü", "Konum", "Seri no"], ["", "Hava tankı", "Kazan dairesi", "HT-24-118"]])); };
  var exOrnek = function () { return [["Kod", "Ekipman türü", "Konum", "Seri no"], ["", "Hava tankı", "Kazan dairesi", "HT-24-118"], ["", "Hava tankı", "Boya hattı", ""], ["FL-01", "Forklift", "Sevkiyat", "FL-22-431"],
    ["", "Elektrik iç tesisatı", "Fabrika binası", ""], ["", "Vinç kancası", "Depo", ""]]; };
  X["excel-sec"] = function () {
    MK.dosyaSec({ kabul: ".xlsx,.csv", ornek: "musteri-ekipman-listesi.xlsx" }, function (ad, f) {
      var sonra = function () { exIceCiz(); var y = document.querySelector('#a-pencere [data-eylem="excel-yukle"]'); if (y && !y.disabled) y.focus({ preventScroll: true }); };
      if (!f) { EX.dosya = ad; EX.satirlar = exSatirlar(exOrnek()); sonra(); return; }
      MK.tabloOku(f).then(function (ham) { EX.dosya = ad; EX.satirlar = exSatirlar(ham); sonra(); })
        .catch(function () { EX.dosya = ""; EX.satirlar = []; exIceCiz(); MK.bildir(ad + " okunamadı; .xlsx ya da .csv seçin."); });
    });
  };
  X["excel-yukle"] = function () {
    if (!EX || !F) return;
    var ok = EX.satirlar.filter(function (x) { return x.ok; }), atla = EX.satirlar.length - ok.length, sayac = {};
    ok.forEach(function (x) { sayac[x.tur] = (sayac[x.tur] || 0) + 1; F.ekipmanlar.push({ kod: x.kod, tur: x.tur, konum: x.konum, seri: x.seri }); });
    F.kalemler = F.kalemler.filter(function (k) { return k.tur; });   /* boş ilk satır kalkar */
    Object.keys(sayac).forEach(function (tk) {
      var k = F.kalemler.filter(function (y) { return y.tur === tk; })[0];
      if (k) k.adet = String((+k.adet || 0) + sayac[tk]); else F.kalemler.push({ tur: tk, adet: String(sayac[tk]), fiyat: MV.para(MV.FIYAT[tk]).replace(" TL", "") });
    });
    if (!F.kalemler.length) F.kalemler = [{ tur: "", adet: "1", fiyat: "" }];
    F.hata = {}; EX = null; $("a-pencere").close(); formCiz("f-tur-0");
    MK.bildir(ok.length + " ekipman " + Object.keys(sayac).length + " türle kalemlere eklendi" + (atla ? "; " + atla + " satır atlandı." : "."));
  };
  /* 2026-09-27: teklif yazdırma penceresinden PDF olur (uygulamada firmanın teklif formatıyla, §3.7) */
  X["pdf"] = function () { var n = $("a-nesne"); MK.yazdir(n.querySelector("h1").textContent, [].map.call(n.querySelectorAll(".a-nesne-bas, section.a-bolum"), function (e) { return e.outerHTML; }).join("")); };
  $("a-pencere").addEventListener("close", function () { if ($("a-pencere").open) return; W = null; var r = rota(); if (r.pencere) history.replaceState(null, "", "#/t/" + r.no); });

  MK.kabuk({ modul: 11, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  goster(false);
})();
