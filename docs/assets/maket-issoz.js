/* ══ probata MAKET M5 + M13 — Sözleşmeler: iş sözleşmesi + İSG-KATİP bilgisi (modül 12) · 2. TUR, ONAY BEKLİYOR (2026-09-26) ════════
   Kaynak: pkproje.md §1.1 (akış: "teklif kabul edildi → sözleşmeler yapıldı (isg katip ve şirketler arası iş sözleşmesi) → planlama"),
   §3.1 modül 12. Ekranlar: liste (#/) · sözleşme sayfası (#/s/<no>: taraflar, kapsam, İSG-KATİP (tesis başına denetçi → sözleşme ID),
   geçmiş) · form (#/yeni?teklif=<no>) · pencereler: İSG-KATİP ID ekle / düzenle · sözleşme şablonu. Kullanıcı: Zeynep Arslan. UYDURMA veri.
   2. tur (2026-09-26, reisim: "sol panelde sözleşmeler olarak gözüken modülden ... isg katip sözleşmesi değildi, pk firma ile fabrika
   arasındaki sözleşmeden bahsediyorum, her firmanın kendi sözleşme formatı olabilir ... isg katip sözleşmesi pdf olarak isteğe bağlı buraya
   yüklenebilir olsun, isg katip sözleşme id ve sgk no buraya girilsin buradan raporlara otomatik çekilecek ... sözleşme id denetçiye göre
   değişir ... otomatik gelmeyen veriler el ile girilebilir olsun" + "Önerilerin hepsi uygun başla"):
   · A → ayrı "İSG-KATİP kayıtları" sekmesi KALKTI (M5 ile M13 birleşti); Sözleşmeler = iş sözleşmeleri.
   · B → SGK işyeri sicil no tek yerde, tesiste (M2); burada ve raporda oradan görünür.
   · C → sözleşmenin içinde tesis başına denetçi → sözleşme ID; plan açarken seçilen denetçinin ID'si buradan gelir, yoksa plan açan el ile
     yazar ("sözleşmeye de kaydet"; M6'nın sırası gelince). Rapor ID'yi plandan alır, raporda da düzeltilebilir.
   · D → her ID'nin yanında isteğe bağlı İSG-KATİP PDF'i · E → onay tarihi isteğe bağlı; geç onay yalnız UYARI (kabul engellenmez).
   · F → Sözleşmeler yetkisi olan herkes girer · G → hiçbir planda kullanılmamış ID silinir, kullanılmış yalnız düzeltilir.
   · H → firma kendi sözleşme şablonunu (PDF / Word) yükler, sürümlü; yüklemezse temel format. */
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

  /* ── İSG-KATİP: tesis başına denetçi → sözleşme ID ─────────────────────────────────────────────────── */
  var idKullanimi = function (r) { var t = MV.tesis(r.t); return t.pid && (t.pekip || []).indexOf(r.k) >= 0 ? t : null; };   /* ID hangi planda kullanılıyor */
  var gecOnay = function (r) { var t = MV.tesis(r.t); return !!r.onay && MV.acikPlan(t) && (t.pekip || []).indexOf(r.k) >= 0 && !MV.isgUygun(r.onay, t.ptarih); };
  /* açık planda görevli olup ID'si olmayan denetçiler: [tesis, kişi] */
  var idEksik = function (x) {
    var l = [];
    x.tesisler.forEach(function (tid) {
      var t = MV.tesis(tid); if (!MV.acikPlan(t)) return;
      (t.pekip || []).forEach(function (k) { if (!MV.isgTesis(tid).some(function (r) { return r.k === k; })) l.push([t, MV.kisi(k)]); });
    });
    return l;
  };
  var isgSayisi = function (x) { return x.tesisler.reduce(function (n, t) { return n + MV.isgTesis(t).length; }, 0); };
  /* tesisin sözleşmesi: bugün geçerli olan, yoksa en yenisi */
  var tesisinSozlesmesi = function (tid) {
    return MV.tesisSozlesmesi(tid, MK.BUGUN) || S.filter(function (x) { return x.tesisler.indexOf(tid) >= 0; }).sort(function (a, b) { return a.baslangic < b.baslangic ? 1 : -1; })[0];
  };

  /* ── LİSTE ─────────────────────────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("s", { ad: "Sözleşmelerde ara", ipucu: "No, müşteri, tesis, ID", birim: "sözleşme",
    cipler: [
      { k: "imza", ad: "İmza bekliyor", grup: "durum", test: function (x) { return MV.isDurum(x) === "imza"; } },
      { k: "yururlukte", ad: "Yürürlükte", grup: "durum", test: function (x) { return MV.isDurum(x) === "yururlukte"; } },
      { k: "suresi", ad: "Süresi doldu", grup: "durum", test: function (x) { return MV.isDurum(x) === "suresi"; } },
      { k: "biten", ad: "Bitişi 60 gün içinde", test: function (x) { var k = kalan(x); return MV.isDurum(x) === "yururlukte" && k <= 60; } },
      { k: "ideksik", ad: "İSG-KATİP ID'si eksik", test: function (x) { return idEksik(x).length > 0; } }
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: function () {
        var l = S.map(function (x) { return x.m; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (m) { return [m, MV.musteri(m).kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (x, v) { return v === "tumu" || x.m === v; } },
      /* personel kartındaki İSG-KATİP yüzünden gelir (?kisi=) */
      { k: "kisi", ad: "Denetçi", secenek: function () {
        var l = MV.ISG.filter(function (r) { return !r.onceki; }).map(function (r) { return r.k; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (k) { return [k, MV.kisi(k).ad]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (x, v) { return v === "tumu" || x.tesisler.some(function (t) { return MV.isgTesis(t).some(function (r) { return r.k === v; }); }); } }
    ],
    metin: function (x) { return [x.no, MV.musteri(x.m).kisa, MV.musteri(x.m).unvan, tesisAd(x), x.teklif || ""].concat(x.tesisler.map(function (t) { return MV.isgTesis(t).map(function (r) { return r.no; }).join(" "); })).join(" "); },
    imkansiz: "Bir sözleşme aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "no", baslik: "Sözleşme no", kart: "ust", sira: 1, hucre: function (x) { return '<a class="a-no" href="#/s/' + x.no + '">' + x.no + "</a>"; } },
    { k: "musteri", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: function (x) { return "<span>" + kirp(MV.musteri(x.m).kisa) + kirp(tesisAd(x), "a-alt-satir") + "</span>"; } },
    { k: "sure", baslik: "Süre", kart: "govde", sira: 3, hucre: function (x) {
      var k = kalan(x), d = MV.isDurum(x);
      return '<span class="a-kart-etiket">Süre</span><span><span class="a-tarih-gun">' + MK.gunKisa(x.baslangic) + " " + x.baslangic.slice(0, 4) + " – " + MK.tarihYaz(x.bitis) + "</span>" +
        (d === "yururlukte" ? '<span class="' + (k <= 60 ? "a-uyari-metin" : "a-tarih-saat") + '">' + k + " gün kaldı" + (x.yenileme === "otomatik" ? " · kendiliğinden yenilenir" : "") + "</span>" : "") + "</span>";
    } },
    { k: "isg", baslik: "İSG-KATİP", kart: "govde", sira: 4, hucre: function (x) {
      var n = isgSayisi(x), e = idEksik(x).length;
      return '<span class="a-kart-etiket">İSG-KATİP</span><span><span class="a-sayi">' + n + " ID</span>" + (e ? '<span class="a-uyari-metin">' + e + " denetçide eksik</span>" : "") + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (x) { return rozet(DURUM[MV.isDurum(x)]); } }
  ];
  function listeCiz() {
    MK.listeCiz({ on: "s", kayitlar: S, sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { var o = { imza: 0, yururlukte: 1, suresi: 2 }; return l.slice().sort(function (a, b) { return o[MV.isDurum(a)] - o[MV.isDurum(b)] || (a.bitis < b.bitis ? -1 : 1); }); },
      bosVeri: { ikon: "file-signature", baslik: "İş sözleşmesi yok", metin: "Kabul edilen tekliften “İş sözleşmesi” ile hazırlanır." },
      tablo: { baslik: "İş sözleşmeleri", sinif: "a-tablo-issoz", sutunlar: SUTUN, href: function (x) { return "#/s/" + x.no; } } });
    var biten = S.filter(function (x) { return MV.isDurum(x) === "yururlukte" && kalan(x) <= 60 && x.yenileme !== "otomatik"; });
    var eksik = S.filter(function (x) { return idEksik(x).length; });
    $("a-uyari").innerHTML = biten.length || eksik.length ? '<div class="a-uyari-serit">' +
      (eksik.length ? '<div class="a-serit a-serit-uyari">' + ikon("scroll-text", "a-ikon-kucuk") + "<span><b>Açık planda İSG-KATİP ID'si eksik</b> · " +
        eksik.map(function (x) { return idEksik(x).map(function (e) { return kacis(e[1].ad) + " (" + kacis(e[0].ad) + ")"; }).join(", "); }).join(", ") +
        ". Plan açarken el ile de girilebilir.</span>" + '<button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="cip-uygula" data-deger="ideksik">Göster</button></div>' : "") +
      biten.map(function (x) {
        var yeni = yenilemeTeklifi(x);
        return '<div class="a-serit a-serit-uyari">' + ikon("clock", "a-ikon-kucuk") + "<span><b>" + x.no + " · " + kacis(MV.musteri(x.m).kisa) + "</b> " + kalan(x) + " gün sonra bitiyor" +
          (yeni ? "; yenileme teklifi " + yeni.no + " (" + TK_DURUM[yeni.durum] + ")." : "; yenileme teklifi yok.") + "</span>" +
          (yeni ? '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(11, "#/t/" + yeni.no) + '">Teklif</a>' : '<a class="a-tus a-tus-ikincil a-serit-tus" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">Teklif hazırla</a>') + "</div>";
      }).join("") + "</div>" : "";
  }

  /* ── SÖZLEŞME SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  function isgBolum(x) {
    return '<section class="a-bolum" aria-labelledby="a-b-isg"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-isg">İSG-KATİP</h2><span class="a-sayac"><b>' + isgSayisi(x) + "</b> ID</span></div>" +
      '<p class="a-bolum-aciklama">Her tesiste denetçi başına sözleşme ID. Plan açarken seçilen denetçinin ID\'si buradan gelir, raporlara oradan geçer; yoksa plan açan el ile yazar. SGK işyeri sicil no tesis kaydından gelir.</p>' +
      x.tesisler.map(function (tid) {
        var t = MV.tesis(tid), l = MV.isgTesis(tid), eks = idEksik({ tesisler: [tid] });
        var SUT = [
          { k: "kisi", baslik: "Denetçi", kart: "ust", sira: 1, hucre: function (r) { return '<a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + r.k) + '">' + kirp(MV.kisi(r.k).ad) + "</a>"; } },
          { k: "no", baslik: "Sözleşme ID", kart: "govde", sira: 2, hucre: function (r) { return '<span class="a-kart-etiket">Sözleşme ID</span><span class="a-kod">' + kacis(r.no) + "</span>"; } },
          { k: "onay", baslik: "Onay tarihi", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-kart-etiket">Onay tarihi</span>' + (r.onay ? MK.tarihYaz(r.onay) : '<span class="a-deger-yok">—</span>'); } },
          { k: "pdf", baslik: "PDF", kart: "govde", sira: 4, hucre: function (r) { return '<span class="a-kart-etiket">PDF</span>' + (r.pdf ? kirp(r.pdf, "a-hucre-metin") : '<span class="a-deger-yok">Yok</span>'); } },
          { k: "durum", baslik: "Kullanım", kart: "rozet", sira: 1, hucre: function (r) {
            var p = idKullanimi(r);
            return (gecOnay(r) ? rozet({ ad: "Geç onay", rozet: "a-rozet-bekliyor" }) : "") + (p ? rozet({ ad: "Planda · " + p.plan, rozet: "a-rozet-kabul" }) : rozet({ ad: "Kullanılmadı", rozet: "a-rozet-notr" }));
          } },
          { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
            return '<div class="a-eylem"><div class="a-eylem-tuslar"><a class="a-tus a-tus-ikincil" href="#/s/' + x.no + "/isg/" + r.id + '">' + ikon("pencil", "a-ikon-kucuk") + "Düzenle</a>" +
              (idKullanimi(r) ? "" : MK.tus({ eylem: "isg-sil", ad: "Sil", ikon: "x", sinif: "a-tus-ikincil", veri: { id: r.id } })) + "</div></div>";
          } }
        ];
        return '<div class="a-alt-bas a-alt-bas-ic"><h3 class="a-alt-baslik">' + kacis(t.ad) + '</h3><span class="a-sayac">SGK işyeri sicil no <span class="a-kod">' + (t.sgk || "—") + "</span></span>" +
          '<a class="a-tus a-tus-ikincil a-bolum-tus" href="#/s/' + x.no + "/isg-ekle?tesis=" + tid + '">' + ikon("plus", "a-ikon-kucuk") + "ID ekle</a></div>" +
          (eks.length ? '<div class="a-serit-kap">' + MK.serit("uyari", "triangle-alert", "Açık planda ID'si yok: " + eks.map(function (e) { return kacis(e[1].ad); }).join(", ") + ". Buradan eklenebilir ya da plan açarken el ile girilir.") + "</div>" : "") +
          '<div class="a-liste-kap">' + (l.length ? MK.tablo({ baslik: "İSG-KATİP · " + t.ad, sinif: "a-tablo-isgid", sutunlar: SUT, kayitlar: l }) : '<p class="a-bos-satir">Bu tesiste ID yok.</p>') + "</div>";
      }).join("") + "</section>";
  }
  function sozlesmeCiz(x) {
    if (!x) {
      $("a-nesne").innerHTML = MK.kirinti([["Sözleşmeler", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Sözleşme bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Sözleşme bulunamadı", metin: "Bu adreste sözleşme yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Sözleşmelere dön</a>" });
      return;
    }
    var m = MV.musteri(x.m), d = MV.isDurum(x), f = MV.FIRMA, k = kalan(x), yeni = d !== "imza" ? yenilemeTeklifi(x) : null;
    var KS = [
      { k: "tesis", baslik: "Tesis", kart: "ust", sira: 1, hucre: function (tid) { var t = MV.tesis(tid); return '<a class="a-ad-bag" href="' + MK.adres(3, "#/t/" + t.id) + '">' + kirp(t.ad) + "</a>" + kirp(t.ilce + " / " + t.il, "a-alt-satir"); } },
      { k: "plan", baslik: "Plan", kart: "govde", sira: 2, hucre: function (tid) {
        var t = MV.tesis(tid); return '<span class="a-kart-etiket">Plan</span>' + (t.pid ? '<a class="a-no" href="' + MK.adres(13, "#/plan/" + t.pid) + '">' + t.plan + "</a>" : MK.git({ hedef: "plan-ac", hash: "#/?tesis=" + tid, ad: "Plan aç", ikon: "calendar-check", ne: "Plan açma" }));
      } },
      { k: "durum", baslik: "Plan durumu", kart: "rozet", sira: 1, hucre: function (tid) { var t = MV.tesis(tid); return t.pid ? rozet(MV.PLAN_DURUM[t.pdurum]) : '<span class="a-deger-yok">—</span>'; } }
    ];
    var gecmis = [[x.imza.firma, "Firma imzaladı", MV.FIRMA.ad]];
    if (x.imza.musteri) gecmis.push([x.imza.musteri, "Müşteri imzaladı", m.unvan], [x.imza.musteri, "İmzalı sözleşme yüklendi", "Zeynep Arslan"]);
    if (d === "suresi") gecmis.push([x.bitis, "Süresi doldu", ""]);
    $("a-nesne").innerHTML = MK.kirinti([["Sözleşmeler", "#/"], [x.no]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + x.no + "</h1>" + rozet(DURUM[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + '<span><a class="a-baglanti" href="' + MK.adres(3, "#/m/" + m.id) + '">' + kacis(m.unvan) + "</a></span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "pdf", ad: "Sözleşme metni", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          (d === "imza" ? MK.tus({ eylem: "imzali-yukle", ad: "İmzalı sözleşmeyi yükle", ikon: "file-check" }) : "") +
          (d !== "imza" && yeni ? '<a class="a-tus a-tus-ikincil" href="' + MK.adres(11, "#/t/" + yeni.no) + '">' + ikon("file-text", "a-ikon-kucuk") + "Yenileme teklifi " + yeni.no + "</a>" :
            d === "yururlukte" && k <= 60 && x.yenileme !== "otomatik" ? '<a class="a-tus a-tus-birincil" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">' + ikon("refresh-cw", "a-ikon-kucuk") + "Yenileme teklifi hazırla</a>" :
            d === "suresi" ? '<a class="a-tus a-tus-birincil" href="' + MK.adres(11, "#/yeni?tesis=" + x.tesisler[0]) + '">' + ikon("plus", "a-ikon-kucuk") + "Yeni teklif</a>" : "") + "</div></div>" +
      '<div class="a-uyari-serit">' +
        (d === "imza" ? MK.serit("uyari", "file-signature", "Firma imzaladı; müşteri imzası bekleniyor. İmzalı sözleşme yüklenince yürürlüğe girer.") : "") +
        (d === "yururlukte" && k <= 60 ? MK.serit("uyari", "clock", k + " gün sonra bitiyor" + (x.yenileme === "otomatik" ? "; kendiliğinden yenilenir (fesih bildirimi yoksa)." :
          yeni ? "; yenileme teklifi " + yeni.no + " " + TK_DURUM[yeni.durum] + ", kabul edilince yeni sözleşme hazırlanır." : "; yenileme için teklif gerekir.")) : "") +
        (d === "suresi" ? MK.serit("bilgi", "history", "Süresi " + MK.tarihYaz(x.bitis) + " tarihinde doldu; bu tesis için yeni plan açılmadan önce yeni sözleşme gerekir.") : "") +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-taraf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-taraf">Taraflar ve koşullar</h2></div>' +
        '<dl class="a-bilgi">' + bilgi("Hizmet veren", kacis(f.ad), true) +
          bilgi("Hizmet alan", kacis(m.unvan) + '<span class="a-alt-satir">' + kacis(m.vd) + " VD · " + m.vno + "</span>", true) +
          bilgi("Başlangıç", MK.tarihYaz(x.baslangic)) + bilgi("Bitiş", MK.tarihYaz(x.bitis) + (d === "yururlukte" ? '<span class="a-alt-satir">' + k + " gün kaldı</span>" : "")) +
          bilgi("Ödeme vadesi", x.vade + " gün") + bilgi("Yenileme", x.yenileme === "otomatik" ? "Kendiliğinden (fesih yoksa)" : "Yok · yeni teklif") +
          bilgi("Dayanak teklif", x.teklif ? '<a class="a-no" href="' + MK.adres(11, "#/t/" + x.teklif) + '">' + x.teklif + "</a>" : '<span class="a-deger-yok">Sistem öncesi</span>') +
          bilgi("İmzalı belge", x.dosya ? '<span class="a-kod">' + x.no + '.pdf</span><span class="a-alt-satir">yalnız firma içinde</span>' : '<span class="a-uyari-metin">Yüklenmedi</span>') + "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kapsam"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kapsam">Kapsam</h2><span class="a-sayac"><b>' + x.tesisler.length + "</b> tesis</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Kapsamdaki tesisler", sinif: "a-tablo-iskapsam", sutunlar: KS, kayitlar: x.tesisler }) + "</div></section>" +
      isgBolum(x) +
      '<section class="a-bolum" aria-labelledby="a-b-gecmis"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-gecmis">Geçmiş</h2></div>' +
        '<ol class="a-gecmis">' + gecmis.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; }).map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + MK.tarihYaz(g[0]) + '</span><span class="a-gecmis-ne"><b>' + g[1] + "</b>" + (g[2] ? ' <span class="a-gecmis-rol">' + kacis(g[2]) + "</span>" : "") + "</span></li>";
        }).join("") + "</ol></section>";
  }

  /* ── FORM (sözleşme hazırla) ─────────────────────────────────────────────────────────────────────── */
  var F = null;
  function formAc() {
    var q = /[?&]teklif=([A-Z0-9-]+)/.exec(location.hash), t = q ? MV.teklif(q[1]) : null;
    F = { teklif: t ? t.no : "", m: t ? t.m : "", tesisler: t ? [t.tesis] : [], baslangic: "24.09.2026", sure: "12", vade: "30", yenileme: "yok", hata: {} };
  }
  function formCiz(odak) {
    var h = F.hata, m = F.m ? MV.musteri(F.m) : null;
    var musteriler = MV.MUSTERILER.map(function (x) { return [x.id, x.kisa]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); });
    var teklifler = m ? MV.TEKLIFLER.filter(function (t) { return t.m === m.id; }).map(function (t) { return [t.no, t.no, MV.tesis(t.tesis).ad]; }) : [];
    var sb = MV.SOZ_SABLON[0];
    $("a-form-gorunum").innerHTML = MK.kirinti([["Sözleşmeler", "#/"], ["Yeni sözleşme"]]) + '<div class="a-sayfa-bas"><h1 tabindex="-1">Yeni iş sözleşmesi</h1></div>' +
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
        "</div>" + '<div class="a-bolum-serit">' + MK.serit("bilgi", "file-text", "Sözleşme metni " + (sb ? "firmanızın şablonundan (" + kacis(sb.surum) + ")" : "temel formattan") + " üretilir; imzalanınca taranmış ya da e-imzalı PDF yüklenir. İSG-KATİP ID'leri kaydettikten sonra sözleşme sayfasında eklenir.") + "</div></section>" +
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

  /* ── PENCERELER: İSG-KATİP ID ekle / düzenle · sözleşme şablonu ────────────────────────────────────── */
  MV.SOZ_SABLON = MV.SOZ_SABLON || [];   /* firmanın yüklediği şablon sürümleri, en yenisi başta; boşsa temel format */
  var W = null;
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, govde, kaydet;
    if (W.tur === "sablon") {
      $("a-pencere-baslik").textContent = "Sözleşme şablonu";
      var sb = MV.SOZ_SABLON;
      govde = '<p class="a-pencere-ozet">' + (sb.length ? "Kullanımda: <b>firmanızın şablonu " + kacis(sb[0].surum) + "</b> · " + kacis(sb[0].dosya) : "Kullanımda: <b>temel format</b> (KM-FR-SZL-01, probata)") +
        "<br>Yeni sözleşmeler bu şablondan üretilir; imzalanmış sözleşmeler kendi sürümüyle kalır.</p>" +
        (sb.length > 1 ? '<ul class="a-kosullar">' + sb.slice(1).map(function (x) { return "<li>" + ikon("history", "a-ikon-kucuk") + "<span>" + kacis(x.surum) + " · " + kacis(x.tarih) + " · önceki</span></li>"; }).join("") + "</ul>" : "") +
        '<div class="a-form"><div class="a-alan-grup a-alan-genis"><p class="a-etiket">Firmanın şablonu (PDF ya da Word)</p>' +
          '<div class="a-dosya-sec">' + MK.tus({ eylem: "dosya-sec", ad: d.dosya ? "Başka dosya seç" : "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
          '<span class="a-dosya-ad" id="w-dosya">' + (d.dosya ? kacis(d.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
          (h.dosya ? '<p class="a-ipucu a-ipucu-uyari" id="w-dosya-ipucu">' + h.dosya + "</p>" : '<p class="a-ipucu">Müşteri, tesis, süre ve ödeme bilgileri şablondaki yerlerine doldurulur.</p>') + "</div></div>";
      kaydet = { ad: "Yükle", ikon: "file-plus" };
    } else {
      var x = MV.isSozlesmesi(W.no), r = W.id ? MV.ISG.filter(function (i) { return i.id === W.id; })[0] : null;
      var tesisler = x.tesisler.map(function (tid) { return [tid, MV.tesis(tid).ad]; });
      var kisiler = MV.PERSONEL.filter(function (p) { return p.durum === "etkin"; }).map(function (p) { return [p.id, p.ad, MV.meslekAd(p)]; });
      var mevcut = !r && d.tesis && d.kisi ? MV.isgTesis(d.tesis).filter(function (i) { return i.k === d.kisi; })[0] : null;
      $("a-pencere-baslik").textContent = r ? "İSG-KATİP ID · düzenle" : "İSG-KATİP ID ekle";
      govde = '<p class="a-pencere-ozet"><b>' + x.no + "</b> · " + kacis(MV.musteri(x.m).kisa) + "</p>" + '<div class="a-form">' +
        MK.alan({ id: "w-tesis", etiket: "Tesis", zorunlu: true, hata: h.tesis, ipucu: d.tesis ? "SGK işyeri sicil no " + (MV.tesis(d.tesis).sgk || "girilmemiş") : "",
          girdi: r || tesisler.length === 1 ? '<input class="a-girdi a-girdi-oku" id="w-tesis" readonly value="' + kacis(MV.tesis(d.tesis).ad) + '" aria-describedby="w-tesis-ipucu">'
            : MK.secim({ id: "w-tesis", ad: "Tesis", deger: d.tesis, secenekler: tesisler, ipucu: "Tesis seçin", gecersiz: !!h.tesis, tanim: "w-tesis-ipucu" }) }) +
        MK.alan({ id: "w-kisi", etiket: "Denetçi", zorunlu: true, hata: h.kisi,
          girdi: r ? '<input class="a-girdi a-girdi-oku" id="w-kisi" readonly value="' + kacis(MV.kisi(r.k).ad) + '">' : MK.secim({ id: "w-kisi", ad: "Denetçi", deger: d.kisi, secenekler: kisiler, ipucu: "Kişi seçin", gecersiz: !!h.kisi, tanim: h.kisi ? "w-kisi-ipucu" : "" }) }) +
        MK.alan({ id: "w-no", etiket: "Sözleşme ID", zorunlu: true, hata: h.no, ipucu: "İSG-KATİP'teki sözleşme numarası; raporlara buradan geçer.", girdi: MK.girdi({ id: "w-no", alan: "no", deger: d.no, sinif: "a-girdi-seri", ek: ' maxlength="30"', hata: h.no }) }) +
        MK.alan({ id: "w-onay", etiket: "Onay tarihi", hata: h.onay, ipucu: "İsteğe bağlı; girilirse kontrolden sonraki onayda uyarı çıkar.", girdi: MK.girdi({ id: "w-onay", alan: "onay", deger: d.onay, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"', hata: h.onay }) }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">İSG-KATİP sözleşmesi (PDF)</p>' +
          '<div class="a-dosya-sec">' + MK.tus({ eylem: "dosya-sec", ad: d.pdf ? "Başka dosya seç" : "PDF seç", ikon: "file-plus", sinif: "a-tus-ikincil" }) +
          '<span class="a-dosya-ad" id="w-dosya">' + (d.pdf ? kacis(d.pdf) : '<span class="a-deger-yok">İsteğe bağlı</span>') + "</span></div></div></div>" +
        (mevcut ? '<div class="a-serit-kap">' + MK.serit("uyari", "history", kacis(MV.kisi(d.kisi).ad) + " için bu tesiste " + kacis(mevcut.no) + " var; yenisi kaydedilince o önceki kayıt olur.") + "</div>" : "");
      kaydet = { ad: "Kaydet", ikon: "check" };
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pencere-kaydet", ad: kaydet.ad, ikon: kaydet.ikon });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  var isoTR = function (iso) { return iso ? iso.split("-").reverse().join(".") : ""; };
  function pencereAc(r) {
    if (r.pencere === "sablon") W = { tur: "sablon", hata: {}, d: { dosya: "" } };
    else {
      var x = MV.isSozlesmesi(r.no), i = r.isg ? MV.ISG.filter(function (y) { return y.id === r.isg; })[0] : null;
      var qt = /[?&]tesis=(t\d+)/.exec(location.hash), qk = /[?&]kisi=([a-z]+)/.exec(location.hash);
      W = { tur: "isg", no: r.no, id: i ? i.id : null, hata: {}, d: i ? { tesis: i.t, kisi: i.k, no: i.no, onay: isoTR(i.onay), pdf: i.pdf || "" }
        : { tesis: qt && x.tesisler.indexOf(qt[1]) >= 0 ? qt[1] : x.tesisler.length === 1 ? x.tesisler[0] : "", kisi: qk && MV.kisi(qk[1]) ? qk[1] : "", no: "", onay: "", pdf: "" } };
    }
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input:not([readonly]), .a-secim-tus, .a-tus"); if (ilk) ilk.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash.replace(/\?.*$/, ""), m;
    if (h === "#/yeni") return { v: "form" };
    if (h === "#/sablon") return { v: "liste", pencere: "sablon" };
    if ((m = /^#\/s\/([A-Z0-9-]+)\/isg-ekle$/.exec(h))) return { v: "soz", no: m[1], pencere: "isg" };
    if ((m = /^#\/s\/([A-Z0-9-]+)\/isg\/(i\d+)$/.exec(h))) return { v: "soz", no: m[1], pencere: "isg", isg: m[2] };
    if ((m = /^#\/s\/([A-Z0-9-]+)$/.exec(h))) return { v: "soz", no: m[1] };
    if ((m = /^#\/isg(?:\/(yeni|i\d+))?$/.exec(h))) return { v: "eski", isg: m[1] };
    return { v: "liste" };
  }
  /* eski İSG-KATİP adresleri (tesis sayfası, plan açma, personel kartı, yer imleri) karşılığına gider */
  function eskiAdres(r) {
    var q = location.hash, qt = /[?&]tesis=(t\d+)/.exec(q), qk = /[?&]kisi=([a-z]+)/.exec(q), i = r.isg && r.isg !== "yeni" ? MV.ISG.filter(function (y) { return y.id === r.isg; })[0] : null;
    var tid = i ? i.t : qt ? qt[1] : null, x = tid ? tesisinSozlesmesi(tid) : null;
    if (x) return "#/s/" + x.no + (i ? "/isg/" + i.id : r.isg === "yeni" ? "/isg-ekle?tesis=" + tid + (qk ? "&kisi=" + qk[1] : "") : "");
    if (tid) return null;   /* sözleşmesi olmayan tesis: tesis sayfası */
    return qk ? "#/?kisi=" + qk[1] : "#/";
  }
  function goster(odakla) {
    var r = rota();
    if (r.v === "eski") {
      var hedef = eskiAdres(r), qt = /[?&]tesis=(t\d+)/.exec(location.hash);
      if (hedef === null) { location.replace(MK.adres(3, "#/t/" + qt[1])); return; }
      history.replaceState(null, "", hedef); r = rota();
    }
    if (r.v === "liste" && /[?&]kisi=([a-z]+)/.test(location.hash)) { var kq = /[?&]kisi=([a-z]+)/.exec(location.hash); MK.suzgecSifirla("s"); SZ.s.sec.kisi = kq[1]; }
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v !== "soz"; $("a-form-gorunum").hidden = r.v !== "form";
    if (r.v === "liste") {
      /* müşteri sayfasındaki "İş sözleşmesi" yüzü → o müşterinin sözleşmeleri */
      var mq = /[?&]musteri=(m\d+)/.exec(location.hash); if (mq && MV.musteri(mq[1])) { MK.suzgecSifirla("s"); SZ.s.sec.musteri = mq[1]; }
      $("a-suzgec-kap").innerHTML = MK.suzgecHtml("s"); MK.suzgecKur("s");
    }
    else if (r.v === "soz") sozlesmeCiz(MV.isSozlesmesi(r.no));
    else { if (!F || odakla) formAc(); formCiz(); }
    document.title = (r.v === "soz" ? r.no : r.v === "form" ? "Yeni iş sözleşmesi" : "Sözleşmeler") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var hh = document.querySelector("#a-icerik > :not([hidden]) h1"); if (hh) hh.focus({ preventScroll: true }); }
    if (r.pencere && (r.pencere === "sablon" || MV.isSozlesmesi(r.no))) pencereAc(r); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) {
    if (W && $("a-pencere").open) {
      if (id === "w-tesis") W.d.tesis = deger; if (id === "w-kisi") W.d.kisi = deger; delete W.hata[id.slice(2)]; pencereCiz(id); return;
    }
    if (id === "f-m") { if (F.m !== deger) { F.m = deger; F.tesisler = []; F.teklif = ""; } delete F.hata.m; }
    if (id === "f-teklif") { F.teklif = deger; var t = MV.teklif(deger); if (t && F.tesisler.indexOf(t.tesis) < 0) F.tesisler.push(t.tesis); delete F.hata.tesisler; }
    formCiz(id);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan;
    if (k && W && $("a-pencere").open) { W.d[k] = e.target.value; return; }
    if (k && F) F[k] = e.target.value;
  };
  MK.onTikla = function (e) { var b = e.target.closest("[data-yenileme]"); if (!b || !F) return false; F.yenileme = b.dataset.yenileme; formCiz('[data-yenileme="' + F.yenileme + '"]'); return true; };
  document.addEventListener("change", function (e) {
    var t = e.target.dataset && e.target.dataset.tesis; if (!t || !F) return;
    var i = F.tesisler.indexOf(t); if (e.target.checked && i < 0) F.tesisler.push(t); else if (!e.target.checked && i >= 0) F.tesisler.splice(i, 1);
    delete F.hata.tesisler;
  });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.no ? "#/s/" + r.no : "#/"); });
  var X = MK.eylem;
  X["yeni"] = function () { location.hash = "#/yeni"; };
  X["cip-uygula"] = function (el) { var s = SZ.s; s.secili = [el.dataset.deger]; s.kip = "veya"; s.sayfa = 1; MK.suzgecKur("s"); var c = document.querySelector('[data-cip="' + el.dataset.deger + '"]'); if (c) c.focus(); };
  X["dosya-sec"] = function () {   /* maket: dosya penceresi yerine örnek dosya adı */
    if (W.tur === "sablon") { W.d.dosya = "sozlesme-sablonu-" + MK.BUGUN + ".docx"; delete W.hata.dosya; }
    else W.d.pdf = "isg-katip-" + (W.d.no || "sozlesme").toLowerCase() + ".pdf";
    pencereCiz(); $("a-pencere-alt").querySelector(".a-tus-birincil").focus();
  };
  X["pencere-kaydet"] = function () {
    var d = W.d, h = {}, ileti;
    if (W.tur === "sablon") {
      if (!d.dosya) h.dosya = "Dosya seçilmeli.";
      W.hata = h; if (Object.keys(h).length) { pencereCiz(); return; }
      MV.SOZ_SABLON.unshift({ surum: "v" + (MV.SOZ_SABLON.length + 1), tarih: MK.tarihYaz(MK.BUGUN), dosya: d.dosya });
      $("a-pencere").close(); MK.bildir("Sözleşme şablonu " + MV.SOZ_SABLON[0].surum + " yüklendi; yeni sözleşmeler bu şablondan üretilir."); return;
    }
    if (!d.tesis) h.tesis = "Tesis seçilmeli.";
    if (!d.kisi) h.kisi = "Denetçi seçilmeli.";
    if (!d.no.trim()) h.no = "Sözleşme ID yazılmalı.";
    if (d.onay.trim() && !tarihIso(d.onay)) h.onay = "GG.AA.YYYY biçiminde; boş bırakılabilir.";
    W.hata = h; var hk = Object.keys(h);
    if (hk.length) { pencereCiz("w-" + hk[0]); return; }
    if (W.id) {
      var i = MV.ISG.filter(function (y) { return y.id === W.id; })[0];
      Object.assign(i, { no: d.no.trim(), onay: d.onay.trim() ? tarihIso(d.onay) : null, pdf: d.pdf || null }); ileti = "İSG-KATİP ID güncellendi.";
    } else {
      MV.ISG.filter(function (y) { return y.t === d.tesis && y.k === d.kisi && !y.onceki; }).forEach(function (y) { y.onceki = true; });
      MV.ISG.push({ id: "i" + (MV.ISG.length + 100), t: d.tesis, k: d.kisi, no: d.no.trim(), onay: d.onay.trim() ? tarihIso(d.onay) : null, pdf: d.pdf || null, girdi: "za" });
      ileti = MV.kisi(d.kisi).ad + " için ID eklendi; bu tesiste açılan planlara kendiliğinden gelir.";
    }
    $("a-pencere").close(); location.hash = "#/s/" + W.no; MK.bildir(ileti);
  };
  X["isg-sil"] = function (el) {
    var i = MV.ISG.filter(function (y) { return y.id === el.dataset.id; })[0]; if (!i || idKullanimi(i)) return;
    MV.ISG.splice(MV.ISG.indexOf(i), 1); sozlesmeCiz(MV.isSozlesmesi(rota().no)); MK.bildir(i.no + " silindi (hiçbir planda kullanılmamıştı).");
  };
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
  X["pdf"] = function () { MK.bildir("Makette dosya yok. Uygulamada sözleşme metni " + (MV.SOZ_SABLON.length ? "firmanızın şablonundan" : "temel formattan") + " üretilir; imzalı kopya yalnız firma içinde, kısa ömürlü bağlantıyla açılır."); };

  /* sözleşmesi olmayan tesisin eski adresi: kabuk kurulmadan tesis sayfasına (yarım kalan yükleme olmasın) */
  var ilk = rota();
  if (ilk.v === "eski" && eskiAdres(ilk) === null) { location.replace(MK.adres(3, "#/t/" + /[?&]tesis=(t\d+)/.exec(location.hash)[1])); return; }
  MK.kabuk({ modul: 12, kullanici: { bas: "ZA", ad: "Zeynep Arslan", rol: "Planlama ekibi" } });
  goster(false);
})();
