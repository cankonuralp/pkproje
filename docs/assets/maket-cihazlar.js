/* ══ probata MAKET M4 — Ölçüm Cihazı (modül 8) + kalibrasyon uyarısı (modül 20, kısım) · 2. TUR, ONAY BEKLİYOR (2026-09-26) ═
   Kaynak: pkproje.md §3 (cihazlar personele zimmetlenir; raporda cihaz SEÇİLMEZ, zimmetten gelir; kalibrasyonu geçmiş cihaz varsa
   rapor açılır ama yönetici onayına gönderilemez — sunucuda da; bitişe 30 gün kala uyarı), §3.1 modül 8 (ad, seri no, envanter no,
   kalibrasyon tarihi, sertifika, ara kontrol), §4.2 1.7.4 (raporda ölçüm aletleri: ad, seri no, kalibrasyon bilgileri), §4.9 (17020:
   kalibrasyon + ara kontrol kayıtları; kalibrasyon ≠ doğrulama). Uyarı YALNIZ ekranda (şerit, çip); e-posta / anlık bildirim YOK
   (anayasa 1.3). Ekranlar: liste (#/) · cihaz (#/c/<id>) · pencereler: cihaz ekle / düzenle · kalibrasyon kaydı · ara kontrol. UYDURMA veri.
   2. tur (2026-09-26, reisim: "cihazlar modülünde cihazlar eklensin tıklanınca kimde olduğu gözüksün kod verilebilsin kalibrasyon tarihi
   takip edilebilsin asıl hedefler bunlar diğer söylediğin iş kolaylaştırıcı işlemleride ekle" · "59 hariç dediklerini kabul ediyorum"):
   · asıl hedefler öne: cihaz sayfasının başında KİMDE (+ "Teslim et") ve kalibrasyon bitişi; cihaz KODU firmanın verdiği etiket, düzenlenir.
   · 59 → kalibrasyonu geçmiş cihaz zimmette kalabilir, o kişinin raporu onaya GÖNDERİLEMEZ (reisim: "kalibrasyon önemli o durumda
     göndermeyi engellesin").
   · 58 → rapor anında denetçi zimmetindeki cihazlardan seçer; cihaz türüne uygun olanlar önceden işaretli (M8'de).
   · 60 → ara kontrol İSTEĞE BAĞLI: cihazda açıksa görünür; periyot firma ayarı (başlangıç 6 ay).
   · 65 → kalibrasyon uyarı eşiği firma ayarı (başlangıç 30 gün; ESIK), cihaz başına değil. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, SZ = MK.SZ;
  var BUGUN = MK.BUGUN, ESIK = MV.esik("kal");   /* firma ayarı (65; Firma ayarları, 202) */
  var KAL = { gecerli: { ad: "Geçerli", rozet: "a-rozet-tamam" }, yakin: { ad: ESIK + " gün içinde bitiyor", rozet: "a-rozet-bekliyor" },
    gecti: { ad: "Kalibrasyonu geçti", rozet: "a-rozet-red" }, lab: { ad: "Kalibrasyonda", rozet: "a-rozet-kabul" } };
  var cihazlar = function () { return MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz"; }); };
  var kalan = function (t) { return MK.gunFarki(BUGUN, t); };
  /* ara kontrol programları (2026-09-28, T7): hesap ortak veride (MV.araProgram); burada en yakın program ve gecikme */
  var araEn = function (v) { return MV.araProgram(v).sort(function (a, b) { return a.sonraki < b.sonraki ? -1 : 1; })[0] || null; };
  var araGecti = function (v) { return MV.araProgram(v).some(function (p) { return p.durum === "gecti"; }); };
  var siklikAd = function (v) { return (v.araSiklik || []).map(function (k) { return MV.araSiklik(k).ad; }).join(" · "); };
  var kimdeHtml = function (k) {
    return k === "depo" ? '<span class="a-hucre-satir">' + ikon("warehouse", "a-ikon-kucuk") + "Depo</span>" : k === "lab" ? '<span class="a-hucre-satir">' + ikon("flask-conical", "a-ikon-kucuk") + "Kalibrasyonda</span>"
      : '<a class="a-ad-bag" href="' + MK.adres(2, "#/p/" + k) + '">' + kirp(MV.kisi(k).ad) + "</a>";
  };
  function kalanHtml(t, esik) {
    var k = kalan(t), not = k < 0 ? -k + " gün geçti" : k === 0 ? "Bugün bitiyor" : k + " gün";
    return '<span class="a-tarih-gun">' + MK.tarihYaz(t) + '</span><span class="' + (k < 0 ? "a-uyari-metin a-hata-metin" : k <= esik ? "a-uyari-metin" : "a-tarih-saat") + '">' + not + "</span>";
  }

  /* ── LİSTE + UYARI ŞERİDİ ─────────────────────────────────────────────────────────────────────── */
  MK.suzgecTanimla("c", { ad: "Cihazlarda ara", ipucu: "Cihaz kodu, cihaz, kişi", birim: "cihaz",
    cipler: [
      { k: "gecti", ad: "Kalibrasyonu geçmiş", grup: "kal", test: function (v) { return MV.kalDurum(v) === "gecti"; } },
      { k: "yakin", ad: ESIK + " gün içinde bitiyor", grup: "kal", test: function (v) { return MV.kalDurum(v) === "yakin"; } },
      { k: "lab", ad: "Kalibrasyonda", grup: "kal", test: function (v) { return MV.kalDurum(v) === "lab"; } },
      { k: "ara", ad: "Ara kontrol gecikti", test: araGecti },
      { k: "depo", ad: "Depoda", test: function (v) { return MV.kimde(v.id) === "depo"; } }
    ],
    seciciler: [
      { k: "tur", ad: "Cihaz türü", secenek: function () { return [["tumu", "Tümü"]].concat(MV.CIHAZ_TURLERI.map(function (t) { return [t.k, t.ad]; })); }, gecer: function (v, d) { return d === "tumu" || v.cihazTur === d; } },
      { k: "kimde", ad: "Kimde", secenek: function () {
        var l = cihazlar().map(function (v) { return MV.kimde(v.id); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
        return [["tumu", "Tümü"]].concat(l.map(function (x) { return [x, MV.yerAdi(x)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], "tr"); }));
      }, gecer: function (v, d) { return d === "tumu" || MV.kimde(v.id) === d; } }
    ],
    metin: function (v) { return [v.env, v.ad, v.marka, v.seri, MV.yerAdi(MV.kimde(v.id))].join(" "); },
    imkansiz: "Bir cihazın kalibrasyonu aynı anda iki durumda olamaz" }, function () { listeCiz(); });
  var SUTUN = [
    { k: "env", baslik: "Cihaz kodu", kart: "ust", sira: 1, hucre: function (v) { return '<a class="a-no" href="#/c/' + v.id + '">' + v.env + "</a>"; } },
    { k: "ad", baslik: "Cihaz", kart: "govde", sira: 2, hucre: function (v) { return kirp(v.ad, "a-ekipman-ad") + kirp(v.marka + " " + v.model + " · seri " + v.seri, "a-alt-satir"); } },
    { k: "kimde", baslik: "Kimde", kart: "govde", sira: 3, hucre: function (v) { return '<span class="a-kart-etiket">Kimde</span>' + kimdeHtml(MV.kimde(v.id)); } },
    { k: "bitis", baslik: "Kalibrasyon bitişi", kart: "govde", sira: 4, hucre: function (v) { return '<span class="a-kart-etiket">Kalibrasyon bitişi</span>' + kalanHtml(v.bitis, ESIK); } },
    { k: "ara", baslik: "Ara kontrol", kart: "govde", sira: 5, hucre: function (v) {
      var p = araEn(v);
      if (!p) return '<span class="a-kart-etiket">Ara kontrol</span><span class="a-deger-yok">Takip edilmiyor</span>';
      return '<span class="a-kart-etiket">Ara kontrol</span><span class="a-tarih-gun">' + kacis(siklikAd(v)) + "</span>" +
        '<span class="' + (p.kalan < 0 ? "a-uyari-metin" : "a-tarih-saat") + '">' + (p.kalan < 0 ? "Sonraki " + -p.kalan + " gün gecikti" : "Sonraki " + MK.gunKisa(p.sonraki)) + "</span>";
    } },
    { k: "durum", baslik: "Kalibrasyon", kart: "rozet", sira: 1, hucre: function (v) { return rozet(KAL[MV.kalDurum(v)]); } }
  ];
  function uyariCiz() {
    var l = cihazlar(), gecti = l.filter(function (v) { return MV.kalDurum(v) === "gecti"; }), yakin = l.filter(function (v) { return MV.kalDurum(v) === "yakin"; });
    var zimmette = gecti.filter(function (v) { return ["depo", "lab"].indexOf(MV.kimde(v.id)) < 0; });
    $("a-uyari").innerHTML = (gecti.length || yakin.length) ? '<div class="a-uyari-serit">' +
      (gecti.length ? '<div class="a-serit a-serit-hata">' + ikon("circle-x", "a-ikon-kucuk") + "<span><b>" + gecti.length + " cihazın kalibrasyonu geçti</b>" +
        (zimmette.length ? " · " + zimmette.map(function (v) { return v.env + " " + MV.kisi(MV.kimde(v.id)).ad; }).join(", ") + " zimmetinde: bu kişilerin raporları onaya gönderilemez." : "") +
        '</span><button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="cip-uygula" data-deger="gecti">Göster</button></div>' : "") +
      (yakin.length ? '<div class="a-serit a-serit-uyari">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span><b>" + yakin.length + " cihazın kalibrasyonu " + ESIK + " gün içinde bitiyor</b> · " +
        yakin.map(function (v) { return v.env + " (" + MK.gunKisa(v.bitis) + ")"; }).join(", ") + '</span><button class="a-tus a-tus-ikincil a-serit-tus" type="button" data-eylem="cip-uygula" data-deger="yakin">Göster</button></div>' : "") +
      "</div>" : "";
  }
  function listeCiz() {
    uyariCiz();
    MK.listeCiz({ on: "c", kayitlar: cihazlar(), sayacId: "a-sayac", listeId: "a-liste",
      sirala: function (l) { return l.slice().sort(function (a, b) { return a.bitis < b.bitis ? -1 : a.bitis > b.bitis ? 1 : 0; }); },
      bosVeri: { ikon: "gauge", baslik: "Ölçüm cihazı yok", metin: "“Cihaz ekle” ile ilk cihaz ve kalibrasyon bilgisi kaydedilir." },
      tablo: { baslik: "Ölçüm cihazları", sinif: "a-tablo-cihaz", sutunlar: SUTUN, href: function (v) { return "#/c/" + v.id; } } });
  }

  /* ── CİHAZ SAYFASI ─────────────────────────────────────────────────────────────────────────────── */
  var KAL_SUTUN = [
    { k: "tarih", baslik: "Kalibrasyon", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-tarih-gun">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "bitis", baslik: "Geçerlilik bitişi", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Geçerlilik bitişi</span>' + MK.tarihYaz(x.bitis); } },
    { k: "lab", baslik: "Laboratuvar", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Laboratuvar</span>' + kirp(x.lab); } },
    { k: "sertifika", baslik: "Sertifika no", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Sertifika no</span><span class="a-kod">' + x.sertifika + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) { return rozet(x.sonuc === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Uygun değil", rozet: "a-rozet-red" }); } },
    /* yüklenen sertifika PDF'i açılır (reisim 2026-09-27: "eklenen herhangi bir pdf daha sonradan açılıp incelenebilir olsun") */
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
      /* 2026-09-28: kayıt kendi yüklenen sertifikasını açar (örnek kayıtta sertifika numarasından ad); kayıt düzenlenir, silinir */
      var i = aktif().kal.indexOf(x);
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + MK.pdfTus(kalDosya(x), "Sertifikayı aç") +
        MK.tus({ eylem: "kal-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil", veri: { i: i } }) +
        '<button class="a-ikon-tus" type="button" data-eylem="kal-sil" data-i="' + i + '" aria-label="' + kacis(x.sertifika) + ' kaydını sil" title="Sil">' + ikon("x") + "</button></div></div>";
    } }
  ];
  var kalDosya = function (x) { return x.dosya || x.sertifika.toLowerCase() + ".pdf"; };
  var ARA_SUTUN = [
    { k: "tarih", baslik: "Tarih", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-tarih-gun">' + MK.tarihYaz(x.tarih) + "</span>"; } },
    { k: "siklik", baslik: "Sıklık", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Sıklık</span>' + (x.siklik ? kacis(MV.araSiklik(x.siklik).ad) : '<span class="a-deger-yok">—</span>'); } },
    { k: "kim", baslik: "Yapan", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Yapan</span>' + (x.kim ? kacis(MV.kisi(x.kim).ad) : '<span class="a-deger-yok">—</span>'); } },
    { k: "yontem", baslik: "Yöntem", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Yöntem</span>' + (x.yontem ? kirp(x.yontem) : '<span class="a-deger-yok">—</span>'); } },
    { k: "sonuc", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: function (x) {
      var d = ARA_DURUM[araDurumu(x)]; if (d) return rozet(d);
      return rozet(x.sonuc === "Uygun" ? { ad: "Uygun", rozet: "a-rozet-tamam" } : { ad: "Uygun değil", rozet: "a-rozet-red" }); } },
    /* planlı kayıt "Yapıldı" ile tamamlanır; her kayıt silinir (2026-09-28) */
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (x) {
      var i = aktif().ara.indexOf(x);
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + (x.planli ? MK.tus({ eylem: "ara-yapildi", ad: "Yapıldı", ikon: "check", sinif: "a-tus-ikincil", veri: { i: i } }) : "") +
        '<button class="a-ikon-tus" type="button" data-eylem="arakayit-sil" data-i="' + i + '" aria-label="' + MK.tarihYaz(x.tarih) + ' kaydını sil" title="Sil">' + ikon("x") + "</button></div></div>"; } }
  ];
  function yuz(o) {
    var ic = '<span class="a-yuz-ust">' + ikon(o.ikon, "a-ikon-kucuk") + o.ad + '</span><span class="a-yuz-sayi">' + o.sayi + "</span>" + (o.not ? '<span class="a-yuz-not' + (o.uyari ? " a-yuz-uyari" : "") + '">' + o.not + "</span>" : "");
    return o.href ? '<a class="a-yuz" href="' + o.href + '">' + ic + "</a>" : '<div class="a-yuz">' + ic + "</div>";
  }
  var SON_CIHAZ = null;
  function cihazCiz(v) {
    if (!v || v.tur !== "cihaz") {
      $("a-nesne").innerHTML = MK.kirinti([["Ölçüm cihazları", "#/"]]) + '<h1 class="a-gizli" tabindex="-1">Cihaz bulunamadı</h1>' +
        MK.bos({ ikon: "circle-alert", baslik: "Cihaz bulunamadı", metin: "Bu adreste kayıtlı ölçüm cihazı yok.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Cihazlara dön</a>" });
      return;
    }
    if (SON_CIHAZ !== v.id) { MK.suzgecSifirla("a"); SON_CIHAZ = v.id; }   /* başka cihaza geçince ara kontrol süzgeci baştan */
    var d = MV.kalDurum(v), kim = MV.kimde(v.id), k = kalan(v.bitis), as = araEn(v), t = MV.cihazTuru(v.cihazTur), h = MV.hareketler(v.id);
    var serit = d === "gecti" ? MK.serit("hata", "circle-x", "Kalibrasyonu " + MK.tarihEk(v.bitis, "de") + " bitti." + (kim !== "depo" && kim !== "lab" ? " " + kacis(MV.kisi(kim).ad) + " zimmetinde: bu cihazın geldiği raporlar yönetici onayına gönderilemez. Kalibrasyona gönderin ya da zimmetten alın." : ""))
      : d === "yakin" ? MK.serit("uyari", "triangle-alert", "Kalibrasyon " + MK.tarihEk(v.bitis, "de") + " bitiyor (" + k + " gün). Bitince bu cihazın geldiği raporlar onaya gönderilemez.")
      : d === "lab" ? MK.serit("bilgi", "flask-conical", "Kalibrasyonda (" + MK.tarihEk(h[0].tarih, "den") + " beri). Yeni sertifika gelince kalibrasyon kaydı eklenir, cihaz depoya döner.") : "";
    $("a-nesne").innerHTML = MK.kirinti([["Ölçüm cihazları", "#/"], [v.env]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + v.env + " · " + kacis(v.ad) + "</h1>" + rozet(KAL[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("gauge", "a-ikon-kucuk") + "<span>" + kacis(v.marka + " " + v.model) + " · seri " + v.seri + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "cihaz-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil" }) +
        (kim === "lab" ? "" : MK.git({ hedef: 9, hash: "#/teslim/" + v.id, ad: "Teslim et", ikon: "arrow-right-left", sinif: "a-tus-ikincil", ne: "Zimmetler" })) +
        MK.tus({ eylem: "kal-ac", ad: "Kalibrasyon kaydı ekle", ikon: "plus" }) + "</div></div>" +
      (serit ? '<div class="a-serit-kap">' + serit + "</div>" : "") +
      '<div class="a-yuzler">' +
        /* 2. tur: asıl hedefler başta — kimde, kalibrasyon */
        yuz({ ikon: kim === "depo" ? "warehouse" : kim === "lab" ? "flask-conical" : "user", ad: "Kimde", sayi: MV.yerAdi(kim), href: MK.adres(9, "#/v/" + v.id), not: h[0] ? "teslim " + MK.gunKisa(h[0].tarih) + " · geçmiş" : "hareket yok" }) +
        yuz({ ikon: "badge-check", ad: "Kalibrasyon bitişi", sayi: MK.gunKisa(v.bitis), not: k < 0 ? -k + " gün geçti" : k + " gün kaldı", uyari: k <= ESIK }) +
        (as ? yuz({ ikon: "list-checks", ad: "Sonraki ara kontrol", sayi: MK.gunKisa(as.sonraki), not: as.kalan < 0 ? -as.kalan + " gün gecikti" : as.ad, uyari: as.kalan < 0 }) : "") +
        yuz({ ikon: "file-text", ad: "Raporlarda", sayi: v.rapor, not: "son 12 ayda imzalı rapor" }) +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-b-cihaz"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-cihaz">Cihaz bilgileri</h2></div><dl class="a-bilgi">' +
        bilgi("Cihaz", kacis(v.ad)) + bilgi("Marka / model", kacis(v.marka + " " + v.model)) + bilgi("Seri no", '<span class="a-kod">' + v.seri + "</span>") +
        bilgi("Cihaz kodu", '<span class="a-kod">' + v.env + "</span>") + bilgi("Ölçüm aralığı", kacis(v.aralik)) +
        bilgi("Kullanıldığı ekipman türleri", MV.cihazTurKullanan(t.k).length ? kacis(MV.cihazTurKullanan(t.k).map(function (x) { return x.ad; }).join(" · ")) : '<span class="a-deger-yok">Henüz hiçbir ekipman türünde seçilmedi</span>', true) +
      "</dl></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kal"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kal" tabindex="-1">Kalibrasyon kayıtları</h2><span class="a-sayac"><b>' + v.kal.length + "</b> kayıt</span></div>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Kalibrasyon kayıtları", sinif: "a-tablo-kal", sutunlar: KAL_SUTUN, kayitlar: v.kal }) + "</div></section>" +
      /* ARA KONTROLLER (2026-09-28, T7): programlar (sıklık · sonraki), kayıtlar (yapılan ve planlanan; süzgeçli, sayfalı), otomatik bakım
         oluştur, kayıtların PDF'i. Programı olmayan cihazda da bölüm var (program buradan kurulur). */
      '<section class="a-bolum" aria-labelledby="a-b-ara"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ara" tabindex="-1">Ara kontroller</h2><span class="a-sayac" id="a-sayac-a"></span>' +
        '<div class="a-bolum-tuslar">' + MK.tus({ eylem: "ara-pdf", ad: "PDF indir", ikon: "download", sinif: "a-tus-ikincil" }) +
          MK.tus({ eylem: "oto-ac", ad: "Otomatik bakım oluştur", ikon: "calendar-check", sinif: "a-tus-ikincil" }) +
          MK.tus({ eylem: "ara-ac", ad: "Ara kontrol ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div></div>" +
        (MV.araProgram(v).length ? '<ul class="a-kosullar">' + MV.araProgram(v).map(function (p) {
          return '<li class="' + (p.durum === "gecti" ? "a-kosul-eksik" : "a-kosul-bilgi") + '">' + ikon(p.durum === "gecti" ? "triangle-alert" : "list-checks", "a-ikon-kucuk") +
            "<span><b>" + kacis(p.ad) + "</b> · sonraki " + MK.tarihYaz(p.sonraki) + (p.kalan < 0 ? " · " + -p.kalan + " gün gecikti" : "") + "</span>" +
            '<button class="a-ikon-tus" type="button" data-eylem="program-sil" data-k="' + p.k + '" aria-label="' + kacis(p.ad) + ' programını kaldır" title="Kaldır">' + ikon("x") + "</button></li>";
        }).join("") + "</ul>" : '<p class="a-bos-satir">Ara kontrol takip edilmiyor.</p>') +
        '<div id="a-suzgec-a">' + MK.suzgecHtml("a") + '</div><div class="a-liste-kap" id="a-liste-a"></div><div id="a-sayfa-a"></div></section>';
    MK.suzgecKur("a");
  }
  /* ara kontrol kayıtları: gecikenler, sonra yaklaşan planlılar, sonra yapılanlar (en yeni üstte) */
  var araDurumu = function (x) { return !x.planli ? "yapildi" : kalan(x.tarih) < 0 ? "gecikti" : "planli"; };
  var ARA_DURUM = { yapildi: null, planli: { ad: "Planlı", rozet: "a-rozet-notr" }, gecikti: { ad: "Gecikti", rozet: "a-rozet-red" } };
  MK.suzgecTanimla("a", { ad: "Ara kontrollerde ara", ipucu: "", birim: "kayıt", sayfa: 20,
    alanlar: [{ k: "tarih", ad: "Tarih", ipucu: "10.2026", metin: function (x) { return MK.tarihYaz(x.tarih); } }],
    cipler: [
      { k: "yapildi", ad: "Yapıldı", grup: "d", test: function (x) { return araDurumu(x) === "yapildi"; } },
      { k: "planli", ad: "Planlı", grup: "d", test: function (x) { return araDurumu(x) === "planli"; } },
      { k: "gecikti", ad: "Gecikti", grup: "d", test: function (x) { return araDurumu(x) === "gecikti"; } }
    ],
    seciciler: [{ k: "siklik", ad: "Sıklık", secenek: function () { return [["tumu", "Tümü"]].concat(MV.ARA_SIKLIK.map(function (x) { return [x.k, x.ad]; })); },
      gecer: function (x, d) { return d === "tumu" || x.siklik === d; } }],
    metin: function (x) { return x.yontem || ""; }, imkansiz: "Bir kayıt aynı anda iki durumda olamaz" }, function () { araListe(); });
  var ARA_SIRA = { gecikti: 0, planli: 1, yapildi: 2 };
  function araListe() {
    var v = aktif(); if (!v || !$("a-liste-a")) return;
    MK.listeCiz({ on: "a", kayitlar: v.ara, sayacId: "a-sayac-a", listeId: "a-liste-a", sayfaId: "a-sayfa-a",
      sirala: function (l) { return l.slice().sort(function (a, b) { var da = araDurumu(a), db = araDurumu(b); return ARA_SIRA[da] - ARA_SIRA[db] || (da === "yapildi" ? (a.tarih < b.tarih ? 1 : -1) : (a.tarih < b.tarih ? -1 : 1)); }); },
      bosVeri: '<p class="a-bos-satir">Ara kontrol kaydı yok.</p>',
      tablo: { baslik: "Ara kontroller", sinif: "a-tablo-ara", sutunlar: ARA_SUTUN } });
  }

  /* ── PENCERELER: cihaz ekle · kalibrasyon kaydı · ara kontrol ─────────────────────────────────────── */
  var W = null;
  var tarihGecerli = function (s) { return /^\d{2}\.\d{2}\.\d{4}$/.test(s); };
  var iso = function (s) { return s.split(".").reverse().join("-"); };
  function denetle() {
    var h = {}, d = W.d;
    if (W.tur === "cihaz") {
      if (!/^[A-Z0-9-]{3,12}$/.test(d.env)) h.env = "Cihaz kodu 3–12 hane (A–Z, 0–9, tire).";
      else if (MV.VARLIKLAR.some(function (v) { return v.env === d.env && v !== W.v; })) h.env = d.env + " başka bir cihazda kayıtlı.";
      if (!d.cihazTur) h.cihazTur = "Cihaz türü seçilmeli.";
      if (!d.seri.trim()) h.seri = "Seri no yazılmalı (raporda zorunlu).";
      if (!W.v && !tarihGecerli(d.bitis)) h.bitis = "Tarih GG.AA.YYYY.";
    } else if (W.tur === "kal") {
      if (!tarihGecerli(d.tarih)) h.tarih = "Tarih GG.AA.YYYY.";
      if (!tarihGecerli(d.bitis)) h.bitis = "Tarih GG.AA.YYYY.";
      else if (tarihGecerli(d.tarih) && iso(d.bitis) <= iso(d.tarih)) h.bitis = "Geçerlilik bitişi kalibrasyon tarihinden sonra olmalı.";
      if (d.lab.trim().length < 3) h.lab = "Laboratuvar yazılmalı.";
      if (!d.sertifika.trim()) h.sertifika = "Sertifika no yazılmalı (raporda yazar).";
      if (!d.dosya) h.dosya = "Sertifika dosyası eklenmeli.";
    } else if (W.tur === "oto") {
      if (!tarihGecerli(d.bas)) h.bas = "Tarih GG.AA.YYYY.";
      if (!tarihGecerli(d.bit)) h.bit = "Tarih GG.AA.YYYY.";
      else if (tarihGecerli(d.bas) && iso(d.bit) <= iso(d.bas)) h.bit = "Bitiş başlangıçtan sonra olmalı.";
      else if (tarihGecerli(d.bas) && MK.gunFarki(iso(d.bas), iso(d.bit)) > 731) h.bit = "En çok 2 yıllık bakım oluşturulur.";
      d.satir.forEach(function (s, i) {
        if (d.satir.some(function (y, j) { return j < i && y.siklik === s.siklik; })) h["oto-siklik-" + i] = "Bu sıklık " + (d.satir.map(function (y) { return y.siklik; }).indexOf(s.siklik) + 1) + ". bakımda seçili.";
        if (s.yontem.trim().length < 3) h["oto-yontem-" + i] = "Yöntem yazılmalı.";
      });
    } else if (W.tur === "tur") {
      var ad = d.ad.trim().toLocaleLowerCase("tr");
      if (ad.length < 3) h.ad = "Tür adı yazılmalı.";
      else if (MV.CIHAZ_TURLERI.some(function (t) { return t.k !== W.k && t.ad.toLocaleLowerCase("tr") === ad; })) h.ad = "Bu adla tür var.";
    } else {
      if (!tarihGecerli(d.tarih)) h.tarih = "Tarih GG.AA.YYYY.";
      if (d.yontem.trim().length < 3) h.yontem = "Yöntem yazılmalı.";
    }
    return h;
  }
  function radyo(ad, deger, secenekler) {
    return secenekler.map(function (x) { return '<label class="a-onay-kutusu"><input type="radio" name="w-' + ad + '" data-radyo="' + ad + '" value="' + x[0] + '"' + (deger === x[0] ? " checked" : "") + "><span>" + x[1] + "</span></label>"; }).join("");
  }
  function pencereCiz(odak) {
    var d = W.d, h = W.hata, A = function (id, etiket, deger, o) {
      o = o || {};
      return MK.alan({ id: "w-" + id, etiket: etiket, zorunlu: o.zorunlu, genis: o.genis, ipucu: o.ipucu, hata: h[id],
        girdi: o.girdi || MK.girdi({ id: "w-" + id, alan: id, deger: deger, sinif: o.sinif, ek: o.ek, hata: h[id] }) });
    };
    var tarih = ' inputmode="numeric" maxlength="10" placeholder="GG.AA.YYYY"', govde;
    if (W.tur === "cihaz") {
      $("a-pencere-baslik").textContent = W.v ? W.v.env + " · düzenle" : "Cihaz ekle";
      govde = '<div class="a-form">' + A("env", "Cihaz kodu", d.env, { zorunlu: true, sinif: "a-girdi-sicil", ek: ' maxlength="12"', ipucu: "Firmanın cihaza verdiği kod (etiket); eşsiz." }) +
        A("cihazTur", "Cihaz türü", "", { zorunlu: true, girdi: MK.secim({ id: "w-cihazTur", ad: "Cihaz türü", deger: d.cihazTur, secenekler: MV.CIHAZ_TURLERI.map(function (t) { return [t.k, t.ad]; }), ipucu: "Tür seçin", gecersiz: !!h.cihazTur, tanim: "w-cihazTur-ipucu" }),
          ipucu: d.cihazTur ? (MV.cihazTurKullanan(d.cihazTur).length ? "Rapora gelir: " + MV.cihazTurKullanan(d.cihazTur).map(function (x) { return x.ad; }).join(", ") : "Ekipman türünde seçilince rapora gelir (Ekipman türleri).") : "Rapora, bu cihazı seçen ekipman türlerinde gelir." }) +
        A("marka", "Marka / model", d.marka, { ek: ' maxlength="60"' }) + A("seri", "Seri no", d.seri, { zorunlu: true, sinif: "a-girdi-seri", ek: ' maxlength="30"' }) +
        A("aralik", "Ölçüm aralığı", d.aralik, { ek: ' maxlength="60" placeholder="ör. 0–1000 V"' }) +
        (W.v ? "" : A("bitis", "Kalibrasyon geçerlilik bitişi", d.bitis, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih, ipucu: "Sertifikadaki tarih; sertifika kalibrasyon kaydıyla eklenir." })) +
        /* ara kontrol sıklıkları (T7): isteğe bağlı, birden çok seçilir; hiçbiri seçilmezse takip edilmez */
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Ara kontrol sıklığı</p>' + MV.ARA_SIKLIK.map(function (x) {
          return '<label class="a-onay-kutusu"><input type="checkbox" data-siklik="' + x.k + '"' + (d.siklik.indexOf(x.k) >= 0 ? " checked" : "") + "><span>" + x.ad + "</span></label>";
        }).join("") + "</div></div>";
    } else if (W.tur === "oto") {
      /* OTOMATİK BAKIM OLUŞTUR (T7; reisim: "başlangıç ve bitiş tarihi, kaç adet ara bakım, sıklığı … örneğin 3 bakım günlük, haftalık, aylık"):
         her satır bir sıklık; aralıktaki planlı ara kontroller üretilir, o sıklığın aralıktaki eski planlıları yerini bırakır */
      $("a-pencere-baslik").textContent = W.v.env + " · otomatik bakım oluştur";
      govde = '<div class="a-form">' + A("bas", "Başlangıç", d.bas, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        A("bit", "Bitiş", d.bit, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Ara bakım sayısı</p><div class="a-radyo-satir">' + radyo("adet", String(d.satir.length), [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]) + "</div></div>" +
        d.satir.map(function (s, i) {
          return A("oto-siklik-" + i, (i + 1) + ". bakım · sıklık", "", { zorunlu: true, girdi: MK.secim({ id: "w-oto-siklik-" + i, ad: (i + 1) + ". bakım sıklığı", deger: s.siklik,
              secenekler: MV.ARA_SIKLIK.map(function (x) { return [x.k, x.ad]; }), gecersiz: !!h["oto-siklik-" + i] }) }) +
            A("oto-yontem-" + i, (i + 1) + ". bakım · yöntem", s.yontem, { zorunlu: true, ek: ' maxlength="100"' });
        }).join("") + "</div>";
    } else if (W.tur === "turler") {
      /* CİHAZ TÜRLERİ (T7; reisim: "ölçüm cihazlarına cihaz türü ekleme"): firma kendi türlerini ekler, düzenler; cihazı olmayan tür silinir */
      $("a-pencere-baslik").textContent = "Cihaz türleri";
      govde = '<ul class="a-secim-listesi">' + MV.CIHAZ_TURLERI.map(function (t) {
        var n = cihazlar().filter(function (v) { return v.cihazTur === t.k; }).length;
        return '<li class="a-tur-satir"><span class="a-tur-ad"><b>' + kacis(t.ad) + '</b><span class="a-alt-satir">' + MV.cihazTurKullanan(t.k).length + " ekipman türünde · " + n + " cihaz</span></span>" +
          '<span class="a-eylem-tuslar">' + MK.tus({ eylem: "tur-duzenle", ad: "Düzenle", ikon: "pencil", sinif: "a-tus-ikincil", veri: { k: t.k } }) +
          (n ? "" : '<button class="a-ikon-tus" type="button" data-eylem="tur-sil" data-k="' + t.k + '" aria-label="' + kacis(t.ad) + ' türünü sil" title="Sil">' + ikon("x") + "</button>") + "</span></li>";
      }).join("") + "</ul>";
    } else if (W.tur === "tur") {
      $("a-pencere-baslik").textContent = W.k ? MV.cihazTuru(W.k).ad + " · düzenle" : "Cihaz türü ekle";
      /* N3 (2026-09-30): yalnız ad; hangi ekipman türünde kullanılacağı Ekipman türleri'nde seçilir */
      govde = '<div class="a-form">' + A("ad", "Tür adı", d.ad, { zorunlu: true, genis: true, ek: ' maxlength="60"' }) + "</div>";
    } else if (W.tur === "kal") {
      $("a-pencere-baslik").textContent = W.v.env + (W.i === null || W.i === undefined ? " · kalibrasyon kaydı" : " · kalibrasyon kaydını düzenle");
      govde = '<p class="a-pencere-ozet"><b>' + W.v.env + " · " + kacis(W.v.ad) + "</b><br>Mevcut bitiş " + MK.tarihYaz(W.v.bitis) + ".</p>" +
        '<div class="a-form">' + A("tarih", "Kalibrasyon tarihi", d.tarih, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        A("bitis", "Geçerlilik bitişi", d.bitis, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih, ipucu: "Sertifikadaki tarih." }) +
        A("lab", "Laboratuvar", d.lab, { zorunlu: true, genis: true, ek: ' maxlength="80"' }) + A("sertifika", "Sertifika no", d.sertifika, { zorunlu: true, sinif: "a-girdi-seri", ek: ' maxlength="30"' }) +
        '<div class="a-alan-grup"><p class="a-etiket">Sertifika dosyası <span class="a-zorunlu">zorunlu</span></p>' +
          '<div class="a-dosya">' + (d.dosya ? MK.dosyaAlan({ ad: d.dosya, degistir: "dosya-sec", sil: "dosya-kaldir" }) : MK.tus({ eylem: "dosya-sec", ad: "Dosya seç", ikon: "file-plus", sinif: "a-tus-ikincil" })) + "</div>" +
          (h.dosya ? '<p class="a-ipucu a-ipucu-uyari">' + h.dosya + "</p>" : "") + "</div>" +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sonuç</p>' + radyo("sonuc", d.sonuc, [["Uygun", "Uygun — cihaz kullanılabilir"], ["Uygun değil", "Uygun değil — cihaz kullanımdan çekilir"]]) + "</div></div>";
    } else {
      /* ara kontrol kaydı: yeni ya da planlı olanın "Yapıldı"sı; sıklık cihazın programlarından, ya da programsız tek seferlik */
      $("a-pencere-baslik").textContent = W.v.env + (W.i !== null ? " · planlı ara kontrol yapıldı" : " · ara kontrol");
      govde = '<div class="a-form">' + A("tarih", "Tarih", d.tarih, { zorunlu: true, sinif: "a-girdi-sicil", ek: tarih }) +
        A("siklik", "Sıklık", "", { girdi: MK.secim({ id: "w-siklik", ad: "Sıklık", deger: d.siklik,
          secenekler: (W.v.araSiklik || []).map(function (k) { return [k, MV.araSiklik(k).ad]; }).concat([["", "Programsız (tek seferlik)"]]) }) }) +
        A("yontem", "Yöntem", d.yontem, { zorunlu: true, genis: true, ek: ' maxlength="100"', ipucu: "Ör. referans direnç / ağırlıkla karşılaştırma." }) +
        '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Sonuç</p>' + radyo("sonuc", d.sonuc, [["Uygun", "Uygun"], ["Uygun değil", "Uygun değil — kalibrasyona gönderilir"]]) + "</div></div>";
    }
    $("a-pencere-govde").innerHTML = govde;
    $("a-pencere-alt").innerHTML = W.tur === "turler" ? MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "tur-ekle", ad: "Cihaz türü ekle", ikon: "plus" })
      : MK.tus(W.tur === "tur" ? { eylem: "turler-ac", ad: "Geri", ikon: "arrow-left", sinif: "a-tus-ikincil" } : { eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "pencere-kaydet", ad: W.tur === "oto" ? "Oluştur" : "Kaydet", ikon: "check" });
    if (odak) { var el = $(odak); if (el) el.focus(); }
  }
  var gga = function (isoT) { return isoT.split("-").reverse().join("."); };
  function pencereAc(tur, v, i) {
    var kk = tur === "kal" && i !== undefined ? v.kal[i] : null, pl = tur === "ara" && i !== undefined ? v.ara[i] : null, bugun = gga(BUGUN);
    if (kk) { W = { tur: tur, v: v, i: i, hata: {}, d: { tarih: gga(kk.tarih), bitis: gga(kk.bitis), lab: kk.lab, sertifika: kk.sertifika, dosya: kalDosya(kk), sonuc: kk.sonuc } }; }
    /* planlı ara kontrol "Yapıldı": tarih bugün (plan günü geçmediyse plan günü), sıklık ve yöntem plandan */
    else if (pl) W = { tur: tur, v: v, i: i, hata: {}, d: { tarih: pl.tarih < BUGUN ? bugun : gga(pl.tarih), siklik: pl.siklik || "", yontem: pl.yontem || "", sonuc: "Uygun" } };
    else if (tur === "oto") {
      var sira = (v.araSiklik || []).concat(MV.ARA_SIKLIK.map(function (x) { return x.k; })).filter(function (k, j, a) { return a.indexOf(k) === j; });
      var bir = new Date(BUGUN + "T12:00:00"); bir.setFullYear(bir.getFullYear() + 1); bir.setDate(bir.getDate() - 1);   /* bir yıl: bitiş dahil */
      W = { tur: tur, v: v, i: null, hata: {}, sira: sira, d: { bas: bugun, bit: gga(bir.toISOString().slice(0, 10)), satir: [{ siklik: sira[0], yontem: "Referans değerle karşılaştırma" }] } };
    } else if (tur === "turler") W = { tur: tur, v: null, i: null, hata: {}, d: {} };
    else if (tur === "tur") { var t = i ? MV.cihazTuru(i) : null; W = { tur: tur, v: null, i: null, k: t ? t.k : null, hata: {}, d: { ad: t ? t.ad : "", g: t ? t.g.slice() : [] } }; }
    else W = { tur: tur, v: tur === "cihaz" ? (v || null) : v || null, i: null, hata: {}, d: tur === "cihaz" ? (v ? { env: v.env, cihazTur: v.cihazTur, marka: (v.marka + " " + v.model).trim(), seri: v.seri, aralik: v.aralik, bitis: "", siklik: (v.araSiklik || []).slice() }
      : { env: "", cihazTur: "", marka: "", seri: "", aralik: "", bitis: "", siklik: [] })
      : tur === "kal" ? { tarih: bugun, bitis: "", lab: v.kal[0] ? v.kal[0].lab : "", sertifika: "", dosya: "", sonuc: "Uygun" }
      : { tarih: bugun, siklik: (v.araSiklik || [])[0] || "", yontem: "Referans değerle karşılaştırma", sonuc: "Uygun" } };
    pencereCiz(); if (!$("a-pencere").open) $("a-pencere").showModal();
    var ilk = $("a-pencere-govde").querySelector("input, button"); if (ilk) ilk.focus();
  }

  /* ── GÖRÜNÜM ────────────────────────────────────────────────────────────────────────────────────────── */
  function rota() {
    var h = location.hash, m;
    if (h === "#/yeni") return { v: "liste", pencere: "cihaz" };
    if ((m = /^#\/c\/([a-z0-9]+)(\/kalibrasyon)?$/.exec(h))) return { v: "cihaz", id: m[1], pencere: m[2] ? "kal" : null };
    return { v: "liste" };
  }
  function goster(odakla) {
    var r = rota(), v = r.id ? MV.varlik(r.id) : null;
    $("a-liste-gorunum").hidden = r.v !== "liste"; $("a-nesne").hidden = r.v === "liste";
    if (r.v === "liste") listeCiz(); else cihazCiz(v);
    document.title = (r.v === "liste" ? "Ölçüm cihazları" : v ? v.env + " · " + v.ad : "Cihaz bulunamadı") + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik > :not([hidden]) h1"); if (h) h.focus({ preventScroll: true }); }
    if (r.pencere) pencereAc(r.pencere, v); else if ($("a-pencere").open) $("a-pencere").close();
  }
  MK.goster = goster;
  var X = MK.eylem, aktif = function () { return MV.varlik(rota().id); };
  X["cihaz-ac"] = function () { pencereAc("cihaz"); };
  X["cihaz-duzenle"] = function () { pencereAc("cihaz", aktif()); };
  X["kal-ac"] = function () { pencereAc("kal", aktif()); };
  X["ara-ac"] = function () { pencereAc("ara", aktif()); };
  /* ── ARA KONTROL İŞLEMLERİ (T7) ── */
  var araBolum = function () { var b = $("a-b-ara"); if (b) b.focus(); };
  X["ara-yapildi"] = function (el) { pencereAc("ara", aktif(), +el.dataset.i); };
  X["arakayit-sil"] = function (el) {
    var v = aktif(), x = v.ara[+el.dataset.i];
    MK.onayla({ baslik: "Ara kontrol kaydını sil", metin: MK.tarihYaz(x.tarih) + (x.siklik ? " · " + MV.araSiklik(x.siklik).ad : "") + (x.planli ? " planlı ara kontrolü" : " ara kontrol kaydı") + " silinir.", tamam: function () {
      v.ara.splice(v.ara.indexOf(x), 1); goster(false); araBolum(); MK.bildir("Ara kontrol kaydı silindi.");
    } });
  };
  X["program-sil"] = function (el) {
    var v = aktif(), k = el.dataset.k, s = MV.araSiklik(k), n = v.ara.filter(function (x) { return x.planli && x.siklik === k; }).length;
    MK.onayla({ baslik: s.ad + " ara kontrolü kaldır", metin: "Cihaz bu sıklıkta takip edilmez" + (n ? "; planlanan " + n + " ara kontrol silinir" : "") + ". Yapılan kayıtlar kalır.", tus: "Kaldır", tamam: function () {
      v.araSiklik = (v.araSiklik || []).filter(function (x) { return x !== k; });
      v.ara = v.ara.filter(function (x) { return !(x.planli && x.siklik === k); });
      goster(false); araBolum(); MK.bildir(s.ad + " ara kontrol kaldırıldı.");
    } });
  };
  X["oto-ac"] = function () { pencereAc("oto", aktif()); };
  /* ara kontrol kayıtlarının PDF'i: süzgeçten geçen YAPILMIŞ kayıtlar, tarih sırasıyla; temel format (firma formatı §3.7 satır 12) */
  X["ara-pdf"] = function () {
    var v = aktif(), l = MK.taban("a", v.ara).filter(function (x) { return !x.planli && MK.cipGecer("a", x); }).sort(function (a, b) { return a.tarih < b.tarih ? -1 : 1; });
    if (!l.length) { MK.bildir("PDF için yapılmış ara kontrol kaydı yok (filtreyi değiştirin)."); return; }
    MK.pdfGoster({ dosya: v.env.toLowerCase() + "-ara-kontroller.pdf", baslik: v.env + " · ara kontrol kayıtları", icerik: MB.araKontrolFormu({ v: v, kayitlar: l, tarih: BUGUN }) });
  };
  /* ── CİHAZ TÜRLERİ (T7) ── */
  X["turler-ac"] = function () { pencereAc("turler"); };
  /* tür listesi değişti: pencere tür listesine döner, liste ve "Cihaz türü" seçicisi yenilenir (pencere açık kalır) */
  function turlerYenile() { MK.seciciCiz("c"); listeCiz(); pencereAc("turler"); var t = document.querySelector('#a-pencere [data-eylem="tur-ekle"]'); if (t) t.focus(); }
  X["tur-ekle"] = function () { pencereAc("tur"); };
  X["tur-duzenle"] = function (el) { pencereAc("tur", null, el.dataset.k); };
  X["tur-sil"] = function (el) {
    var t = MV.cihazTuru(el.dataset.k);
    MK.onayla({ baslik: "Cihaz türünü sil", metin: t.ad + " silinir; ekipman türlerinin kullanacağı cihazlardan da çıkar.", tamam: function () {
      MV.CIHAZ_TURLERI.splice(MV.CIHAZ_TURLERI.indexOf(t), 1);
      MV.KATALOG.forEach(function (e) { if (e.cihaz) e.cihaz = e.cihaz.filter(function (k) { return k !== t.k; }); });
      turlerYenile(); MK.bildir(t.ad + " silindi.");
    } });
  };
  /* kalibrasyon kayıtları en yeni üstte; cihazın geçerlilik bitişi en yeni kaydın bitişi (kayıt kalmadıysa kalibrasyonsuz = geçmiş) */
  function kalSirala(v) { v.kal.sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }); v.bitis = v.kal.length ? v.kal[0].bitis : "2000-01-01"; }
  X["kal-duzenle"] = function (el) { pencereAc("kal", aktif(), +el.dataset.i); };
  X["kal-sil"] = function (el) {
    var v = aktif(), x = v.kal[+el.dataset.i];
    MK.onayla({ baslik: "Kalibrasyon kaydını sil", metin: x.sertifika + " kaydı ve sertifikası silinir.", tamam: function () {
      v.kal.splice(v.kal.indexOf(x), 1); if (x.dosya) MK.dosyaSil(x.dosya); kalSirala(v); goster(false);
      var b = $("a-b-kal"); if (b) b.focus(); MK.bildir(x.sertifika + " kaydı silindi.");
    } });
  };
  X["dosya-kaldir"] = function () { if (!W) return; W.d.dosya = ""; pencereCiz(); var t = document.querySelector('#a-pencere [data-eylem="dosya-sec"]'); if (t) t.focus(); };
  X["cip-uygula"] = function (el) { var s = SZ.c; s.secili = [el.dataset.deger]; s.kip = "veya"; s.sayfa = 1; listeCiz(); var c = document.querySelector('[data-cip="' + el.dataset.deger + '"]'); if (c) c.focus(); };
  X["dosya-sec"] = function () {   /* 2026-09-27: gerçek dosya penceresi (PDF, en çok 10 MB); seçilen dosya "Aç" ile açılır */
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 10, ornek: "sertifika-" + W.v.env.toLowerCase() + "-2026.pdf" }, function (ad) { if (!W) return; W.d.dosya = ad; delete W.hata.dosya; pencereCiz(); });
  };
  X["pencere-kaydet"] = function () {
    W.hata = denetle(); var hk = Object.keys(W.hata);
    if (hk.length) { pencereCiz(hk[0] === "dosya" ? null : "w-" + hk[0]); return; }
    var d = W.d, v = W.v, hedef, ileti;
    if (W.tur === "cihaz" && v) {
      /* programı kaldırılan sıklığın planlı kayıtları gider; yapılanlar kalır */
      v.ara = v.ara.filter(function (x) { return !x.planli || d.siklik.indexOf(x.siklik) >= 0; });
      Object.assign(v, { env: d.env, cihazTur: d.cihazTur, ad: MV.cihazTuru(d.cihazTur).ad, marka: d.marka.trim() || "—", model: "", seri: d.seri.trim(), aralik: d.aralik.trim() || "—",
        araSiklik: siraliSiklik(d.siklik) });
      hedef = "#/c/" + v.id; ileti = "Cihaz güncellendi.";
    } else if (W.tur === "cihaz") {
      v = { id: "v" + (MV.VARLIKLAR.length + 1), tur: "cihaz", ad: MV.cihazTuru(d.cihazTur).ad, cihazTur: d.cihazTur, env: d.env, marka: d.marka.trim() || "—", model: "", seri: d.seri.trim(), aralik: d.aralik.trim() || "—",
        bitis: iso(d.bitis), araSiklik: siraliSiklik(d.siklik), kal: [], ara: [], rapor: 0 };
      MV.VARLIKLAR.push(v); hedef = "#/c/" + v.id; ileti = v.env + " depoya kaydedildi; sertifikası kalibrasyon kaydıyla eklenir.";
    } else if (W.tur === "kal") {
      var kay = { tarih: iso(d.tarih), bitis: iso(d.bitis), lab: d.lab.trim(), sertifika: d.sertifika.trim(), sonuc: d.sonuc, dosya: d.dosya };
      if (W.i !== null) v.kal[W.i] = kay; else v.kal.unshift(kay);
      kalSirala(v);
      if (W.i === null && MV.kimde(v.id) === "lab") MV.ZIMMET.push({ id: "z" + (MV.ZIMMET.length + 1), v: v.id, tarih: MK.simdi(), eden: "lab", alan: "depo", foto: 1, not: "Kalibrasyondan döndü.", onay: null, yetkili: "za" });
      hedef = "#/c/" + v.id; ileti = "Kalibrasyon kaydedildi; geçerlilik " + MK.tarihYaz(v.bitis) + ".";
    } else if (W.tur === "oto") {
      var bas = iso(d.bas), bit = iso(d.bit), sayi = [];
      d.satir.forEach(function (s) {
        v.ara = v.ara.filter(function (x) { return !(x.planli && x.siklik === s.siklik && x.tarih >= bas && x.tarih <= bit); });
        var n = 0;
        for (var t = bas; t <= bit; t = MV.araIleri(t, s.siklik)) { v.ara.push({ tarih: t, siklik: s.siklik, kim: null, yontem: s.yontem.trim(), sonuc: null, planli: true }); n++; }
        sayi.push(MV.araSiklik(s.siklik).ad.toLocaleLowerCase("tr") + " " + n);
      });
      v.araSiklik = siraliSiklik((v.araSiklik || []).concat(d.satir.map(function (s) { return s.siklik; })));
      hedef = "#/c/" + v.id; ileti = "Planlı ara kontroller oluşturuldu: " + sayi.join(", ") + ".";
    } else if (W.tur === "tur") {
      var tt = W.k ? MV.cihazTuru(W.k) : null;
      if (tt) { tt.ad = d.ad.trim(); tt.g = d.g.slice(); cihazlar().forEach(function (x) { if (x.cihazTur === tt.k) x.ad = tt.ad; }); }
      else { var no = 1; while (MV.cihazTuru("ct" + no)) no++; MV.CIHAZ_TURLERI.push({ k: "ct" + no, ad: d.ad.trim(), g: d.g.slice() }); }
      var ad = d.ad.trim(); turlerYenile(); MK.bildir(ad + (tt ? " güncellendi." : " eklendi; cihaz eklerken seçilir."));
      return;
    } else {
      var kayit = { tarih: iso(d.tarih), siklik: d.siklik || null, kim: "co", yontem: d.yontem.trim(), sonuc: d.sonuc };
      if (W.i !== null) v.ara[W.i] = kayit; else v.ara.push(kayit);
      hedef = "#/c/" + v.id; ileti = W.i !== null ? "Planlı ara kontrol yapıldı olarak kaydedildi." : "Ara kontrol kaydedildi.";
    }
    $("a-pencere").close();
    if (location.hash === hedef) goster(false); else location.hash = hedef;
    MK.bildir(ileti);
  };
  MK.onGirdi = function (e) {
    var k = e.target.dataset && e.target.dataset.alan, m; if (!k || !W) return;
    if ((m = /^oto-yontem-(\d)$/.exec(k))) W.d.satir[+m[1]].yontem = e.target.value;
    else W.d[k] = k === "env" ? e.target.value.toUpperCase() : e.target.value;
  };
  MK.onSecim = function (id, deger) {
    var m; if (!W) return;
    if (id === "w-cihazTur") { W.d.cihazTur = deger; delete W.hata.cihazTur; pencereCiz(); }
    else if (id === "w-siklik") { W.d.siklik = deger; pencereCiz(); }
    else if ((m = /^w-oto-siklik-(\d)$/.exec(id))) { W.d.satir[+m[1]].siklik = deger; W.hata = {}; pencereCiz(id); }
  };
  /* sıklık listesi her zaman ARA_SIKLIK sırasında (günlük → 6 ayda bir), tekrar yok */
  function siraliSiklik(l) { return MV.ARA_SIKLIK.map(function (x) { return x.k; }).filter(function (k) { return l.indexOf(k) >= 0; }); }
  var degistir = function (l, k, var_) { var i = l.indexOf(k); if (var_ && i < 0) l.push(k); if (!var_ && i >= 0) l.splice(i, 1); };
  document.addEventListener("change", function (e) {
    var ds = e.target.dataset || {}; if (!W) return;
    if (ds.radyo === "adet") {   /* bakım sayısı: satır eklenir (sıradaki kullanılmayan sıklık) ya da sondan çıkar */
      var n = +e.target.value, sat = W.d.satir;
      while (sat.length > n) sat.pop();
      while (sat.length < n) { var bos = W.sira.filter(function (k) { return !sat.some(function (s) { return s.siklik === k; }); })[0]; sat.push({ siklik: bos, yontem: "Referans değerle karşılaştırma" }); }
      W.hata = {}; pencereCiz(); var r = document.querySelector('#a-pencere [data-radyo="adet"][value="' + n + '"]'); if (r) r.focus();
    } else if (ds.radyo) W.d[ds.radyo] = e.target.value;
    if (ds.siklik) degistir(W.d.siklik, ds.siklik, e.target.checked);
    if (ds.grup) { degistir(W.d.g, ds.grup, e.target.checked); delete W.hata.g; }
  });
  $("a-pencere").addEventListener("close", function () { var r = rota(); if (r.pencere) history.replaceState(null, "", r.v === "liste" ? "#/" : "#/c/" + r.id); });

  MK.kabuk({ modul: 8, kullanici: { bas: "CÖ", ad: "Can Öztürk", rol: "Elektrik yönetici" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("c");
  MK.seciciCiz("c"); goster(false);
})();
