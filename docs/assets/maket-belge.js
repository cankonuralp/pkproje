/* ══ probata MAKET — RAPOR BELGESİ, TEK ÜRETİCİ (M7 şablon önizlemesi · M9 onay ekranı, rapor görünümü, PDF) ══════════════════
   Sunucuda üretilen PDF'in iskeleti (§8.3); Ek-III 1.7'nin dokuz bölümü + fotoğraf eki (§4.2), başlıkta firma künyesi ve akreditasyon
   markası yeri (§4.8). MB.belge(tür, o): o yoksa BOŞ ŞABLON (her alanın nereden dolduğu yazılır), varsa dolu rapor —
   o = { e (ekipman), ts (tesis), m (müşteri), p (inspector), isg, cihaz[], tarih, bas, bit, sonraki, no, sonuc ("Uygun" | "Hafif kusurlu" |
   "Kusurlu"), imza: { zaman } | null }. UYDURMA veri. (2026-09-24, M9'da maket-sablon.js'ten taşındı.) */
(function () {
  "use strict";
  var kacis = MK.kacis, ikon = MK.ikon, bilgi = MK.bilgi;
  /* boş belgede alanın nereden dolduğu artık yazılmaz (reisim 2026-09-26: "alt tarafa yazılmış küçük mesajlar istemiyorum") */
  var kaynak = function () { return ""; };
  var bos = '<span class="a-deger-yok">—</span>';
  window.MB = {};
  MB.belge = function (t, o) {
    if (MV.formatYapi(t)) return resmiBelge(t, o, MV.formatYapi(t));   /* Bakanlık formatlı tür: resmî PDF'in birebir düzeni (2026-09-28) */
    var f = MV.FIRMA, std = t.std.map(MV.standart), zorunlu = MV.kusurSinifli(t), grup = MV.grup(t.g);
    var d = function (deger, kay) { return o ? deger : bos + kaynak(kay); };
    var sonraki = o ? o.sonraki : null, hafif = o && /Hafif/.test(o.sonuc), kusurlu = o && /^Kusurlu/.test(o.sonuc);
    /* o.r: saha raporunun kendisi (M8 "Ön izle", 2026-09-28) — değerler rapordan; boş alan "-" */
    var R = o && o.r, rv = function (v) { return v && String(v).trim() ? kacis(v) : "-"; };
    /* hafif / ağır yalnız Bakanlık formatı yürürlükte olan türde (§4.5, Ek-III 1.9.1); öteki türde "Kusurlu" */
    var hafifAd = "Uygun değil", agirAd = "Uygun değil";   /* reisim 2026-09-26: madde sonucu Uygun · Uygun değil · Uygulanamaz */
    var kriter = MV.kriterler(t), test = MV.testler(t), ok = MV.ornekKusur(t, hafif);
    var surum = t.pdf && t.pdf[0] ? t.pdf[0].surum : t.sablon ? t.sablon.split(" · ")[0] : "v1", formKod = zorunlu ? t.format : f.kisa + "-FR-" + t.k + "-" + surum.slice(1);
    return '<article class="a-belge" aria-label="Rapor önizlemesi">' +
      '<header class="a-belge-bas"><div class="a-belge-logo" role="img" aria-label="Firma logosu yeri">Logo</div>' +
        '<div class="a-belge-kunye"><b>' + kacis(f.ad) + "</b><span>" + kacis(f.adres) + "</span><span>" + kacis(f.eposta) + " · Akreditasyon no <span class=\"a-kod\">" + f.akr + "</span></span></div>" +
        '<div class="a-belge-logo" role="img" aria-label="Akreditasyon markası yeri">Akreditasyon markası</div></header>' +
      '<div class="a-belge-baslik"><h2>Periyodik kontrol raporu</h2><p>' + kacis(t.ad) + " · " + kacis(grup.ad) + "</p></div>" +
      '<dl class="a-bilgi">' + bilgi("Rapor no", o ? '<span class="a-kod">' + o.no + "</span>" : bos + kaynak("sunucu, rapor oluşturulurken"), true) +
        bilgi("Form", '<span class="a-kod">' + formKod + "</span>") +
        bilgi("Format sürümü", kacis(surum)) + "</dl>" +
      /* 1 · FİRMA BİLGİLERİ — türün rapor formatından bağımsız, her raporda aynı blok (reisim 2026-09-26: "1 genel bilgiler değil firma
         bilgileri olacak formattan bağımsız her rapor için ortak olacak"); değerler müşteri, tesis ve iş sözleşmesinden */
      bolum("1", "Firma bilgileri", '<dl class="a-bilgi">' +
        bilgi("Firma ünvanı", o ? kacis(o.m.unvan) : bos, true) +
        bilgi("Adres", o ? kacis(o.ts.adres + ", " + o.ts.ilce + " / " + o.ts.il) : bos, true) +
        bilgi("SGK DETSİS no", o ? '<span class="a-kod a-kod-uzun">' + o.ts.sgk + "</span>" : bos, "cift") +
        bilgi("İSG-KATİP sözleşme ID", o ? (o.isg ? '<span class="a-kod">' + o.isg.no + "</span>" : '<span class="a-uyari-metin">Yok</span>') : bos) + "</dl>") +
      bolum("2", "Kontrol bilgileri", '<dl class="a-bilgi">' +
        bilgi("Başlangıç", d(o && MK.tarihYaz(o.tarih) + " " + (o.bas || "09:12"), "saha: rapor açıldı")) +
        bilgi("Bitiş", d(o && MK.tarihYaz(o.tarih) + " " + (o.bit || "09:48"), "saha: onaya gönderildi")) +
        bilgi("Sonraki kontrol", d(o && sonraki && MK.tarihYaz(sonraki), "kontrol + tür periyodu")) +
        bilgi("Rapor tarihi", d(o && MK.tarihYaz(o.tarih), "son imza")) +
        /* 2026-09-27 (reisim): metot yalnız ekipman türünde belirlenir; belge türden okur */
        bilgi("Kontrol metodu", d(o && kacis(MV.metotYazi(t)), "ekipman türünde seçilir"), true) +
        "</dl>") +
      bolum("3", "Ekipman bilgileri", '<dl class="a-bilgi">' +
        bilgi("Ekipman", d(o && kacis(t.ad), "ekipman türü")) + bilgi("Kod", d(o && '<span class="a-kod">' + o.e.kod + "</span>", "ekipman kaydı")) +
        bilgi("Marka / model", d(o && (R ? rv((R.marka + " " + R.model).trim()) : kacis(o.e.marka + " " + o.e.model)), "ekipman etiketi")) + bilgi("İmal yılı", d(o && (R ? rv(R.imal) : o.e.imal), "ekipman etiketi")) +
        bilgi("Seri no", d(o && '<span class="a-kod">' + (R ? rv(R.seri) : o.e.seri) + "</span>", "ekipman etiketi")) + bilgi("Kullanım yeri", d(o && kacis(R ? R.konum : o.e.konum), "ekipman konumu")) +
        bilgi("Kullanım amacı", d(o && (R ? rv(R.amac) : "Üretim ve sevkiyat"), "saha")) + "</dl>") +
      bolum("4", "Test değerleri", tablo(["Ölçüm", "Değer", "Sınır"], test.map(function (x, i) { return [x.ad, R ? (R.test[i] ? kacis(R.test[i]) + " " + x.birim : "-") : o ? x.ornek + " " + x.birim : bos, MV.sinirYaz(x)]; }), o ? "" : "saha: inspector ölçer")) +
      bolum("5", "Ölçüm cihazları", o ? tablo(["Cihaz", "Cihaz no", "Kalibrasyon tarihi"], o.cihaz.length ? o.cihaz.map(function (v) { return [kacis(v.ad), '<span class="a-kod">' + v.seri + "</span>", MK.tarihYaz(v.kal[0].tarih)]; }) : [[bos, bos, bos]])
        : '<p class="a-bolum-aciklama">' + kaynak("inspector'ın zimmetindeki, bu grup için uygun cihazlar otomatik gelir (seçilmez)") + "</p>") +
      bolum("6", "Muayene kriterleri", tablo(["No", "Muayene kriteri", "Sonuç"], kriter.map(function (k, i) {
        return [String(i + 1), kacis(k), R ? sonucAd(R.kriter[i]) : o ? (hafif && i === ok.i ? hafifAd : kusurlu && i === ok.i ? agirAd : "Uygun") : '<span class="a-belge-kutu"></span>Uygun · uygun değil · uygulanamaz'];
      }), o ? "" : "saha: her madde ayrı")) +
      bolum("7", "Kusur açıklamaları", R ? kusurHtml(o.kusurlar) : o ? (hafif || kusurlu ? "<p>" + (hafif ? hafifAd + ": " + kacis(ok.aciklama.charAt(0).toLocaleLowerCase("tr") + ok.aciklama.slice(1)) + (zorunlu ? " Sonraki kontrole kadar giderilmeli." : "") : agirAd + ": " + kacis(ok.aciklama.charAt(0).toLocaleLowerCase("tr") + ok.aciklama.slice(1)) + " Giderilene kadar kullanılamaz.") + "</p>" : '<p class="a-deger-yok">Kusur yok.</p>')
        : '<p class="a-bolum-aciklama">' + (zorunlu ? "Her kusur ayrı yazılır; sınıf hafif ya da ağır." : "Her kusur ayrı yazılır.") + "</p>") +
      bolum("8", "Muayene uzmanı yorumu", R && R.notlar.trim() ? "<p>" + kacis(R.notlar) + "</p>" : '<p class="a-deger-yok">—</p>') +
      bolum("9", "Sonuç ve kanaat", sonucKutu(o, kusurlu)) +
      bolum("10", "Yetkili kişi", '<dl class="a-bilgi">' +
        bilgi("Ad soyad", d(o && kacis(o.p.ad), "personel")) + bilgi("Meslek", d(o && kacis(MV.meslekAd(o.p)), "personel")) +
        bilgi("Diploma no", d(o && '<span class="a-kod">' + o.p.diploma + "</span>", "personel")) + bilgi("Oda sicil no", d(o && (o.p.oda ? '<span class="a-kod">' + o.p.oda + "</span>" : bos), "personel")) +
        bilgi("EKİPNET kayıt no", d(o && '<span class="a-kod">' + o.p.ekipnet + "</span>", "personel")) + bilgi("Nüsha sayısı", f.nusha + (o ? "" : kaynak("firma ayarı"))) + "</dl>" +
        '<div class="a-belge-imza">' + (!o ? "İmza" : o.imza ? "Güvenli elektronik imza · " + kacis(o.p.ad) + " · " + MK.zamanYaz(o.imza.zaman) : "İmzasız — inspector son imzayı atınca geçerli olur ve müşteriye açılır.") + "</div>") +
      bolum("Ek", "Fotoğraflar", fotoHtml(R ? R.foto : 2)) +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + "</span></footer></article>";
  };
  /* ══ RESMÎ FORMAT ÇIKTISI (2026-09-28; reisim: "sana verdiğim pdfler gibi gözükmüyor … sanki uygulamanın temasına göre bir pdf oluşuyor
     birebir aynı pdf çıktısı olmalı final raporu") — ZPKR01 / ZPKR02 PDF'lerinin sayfa düzeni birebir: A4, siyah-beyaz, başlık tablosu (logo ·
     firma · akreditasyon · başlık · doküman bilgisi), pembe bölüm başlıkları, mavi etiket hücreleri, ○ / ● seçenekler, sayfa sayfa. Uygulama
     temasından bağımsız (renkler PDF'ten; .rb-* maket.css'te). o yoksa boş form; o.r varsa saha raporunun değerleri; yoksa örnek değerler. ══ */
  var RB_TANIM = ["Zx: Ölçülen çevrim empedansı.", "Zs: Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır çevrim empedansı.", "Rx: Ölçülen topraklama direnci.",
    "RA: Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır topraklama direnci.", "Ik: Devredeki toprak çevrim empedansına göre hesaplanan ya da ölçülen faz- toprak hata akımı.",
    "Ia: Aşırı akım koruma cihazının açma eğrisi tipine göre hesaplanan ani açma ya da otomatik açma akımı-RCD’ler için etiketinde yazılı beyan açma akımı (IΔn)",
    "IΔn: RCD (Artık akım anahtarı) için beyan açma akımı", "IΔ: RCD için test açma akımı", "TΔ: RCD için test açma zamanı-max: 200 ms.",
    "50V: Dokunma gerilimi sınır değeri (AG tesisat a.a da, normal, ya da kuru yerler)", "25V: Dokunma gerilimi sınır değeri (AG tesisat a.a da, tehlikenin yüksek olduğu yerler, ıslak hacimler, tarımsal alanlar vb.)",
    "230V: (Uo) Hesaplamalar için kullanılacak faz-toprak veya faz-nötr gerilimi", "Zs<230V/Ia: TN şebekeler için hesaplanan çevrim empedansı sınır değeri. (TN şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)",
    "RA<50V/Ia: TT şebekeler için hesaplanan topraklama direnci sınır değeri. (TT Şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)"];
  var RB_AGIR_GOZ = ["Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa,", "Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa,",
    "Pano elemanları bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse,", "PVC izoleli kablolarda ve pano elemanlarının dokunulabilen metal olmayan yüzeylerinde aşırı ısınma tespit edilmişse."];
  var RB_AGIR_FONK = ["<b>1.</b> Hesaplanan 3 fazlı kısa devre akımı, pano içinde bulunan herhangi bir aşırı akım koruma cihazı etiketinde yazan kısa devre kesme kapasitesinden (Icu) fazla ise,",
    "<b>2.</b> Aşırı akım koruma elemanı değerleri linye kesiti ile uyumsuz ise,", "<b>3.</b> El ulaşma mesafesindeki metal bölümler, ekipmanın toprak barası veya toprak ucuyla eş potansiyel değilse,",
    "<b>4.</b> RCD performans testi sonuçları yetersiz ise,", "<b>5.</b> Kablo şalter koordinasyonunun aşağıdaki uygunsuzluğu;",
    "Devre Tasarım Akımı (Ib), Devre Kesici Akımı (In) ve Kablo Akım Taşıma Kapasitesi (Iz) için Ib&lt;In&lt;Iz sağlanmadıysa,", "<b>6.</b> Zemin yalıtımının aşağıdaki uygunsuzlukları;",
    "b) El ulaşma mesafesinde bulunan zemin izolasyonu uygun boyutta değilse,  (EİTY Md. 33d)", "c) Zemin izolasyon direnci 50 kΩ’dan büyük değilse, (EİTY Md. 48)",
    "<b>7.</b> N/PEN iletkeni kesitinin ve kullanım yerinin aşağıdaki uygunsuzlukları;", "a) N/PEN kesiti ile faz iletkeni kesiti eşit değilse. (EİTY Md 57b3-ii-1)",
    "İstisna: N/PEN kesitinin faz iletkeninin kesitinden küçük olması durumunda (örneğin 3x70+35 mm<sup>2</sup> gibi) faz iletkenlerini koruyan devre kesici anma akımının, N/PEN iletkeni kesitine göre (örnekteki 35mm<sup>2</sup>’ye göre) belirlenmesi kuralı ihlal edildiyse (EİTY Md 57b3-ii-2)",
    "b) PEN iletkeni kesiti &gt;10 mm<sup>2</sup> değilse (EİTY Md 36)", "c) PEN iletkeni yangın tehlikesi olan yerlerden geçirilmemesi kuralı ihlal edildiyse (EİTY Md 64)",
    "d) PEN iletkeni Exproof tehlikeli bölge sınırları içinden geçirilmemesi kuralı ihlal edildiyse (IEC 60079-14)", "<b>8.</b> PE koruma iletkeni kesitinin aşağıdaki uygunsuzluğu;",
    "Koruma iletkeni kesiti ETTY Md. 9e1i’de verilen formülle yapılan hesap sonucuna ve ETTY Çizelge 8’de verilen tabloya uygun değilse,", "<b>9.</b> PD potansiyel dengeleme iletkeni kesitinin aşağıdaki uygunsuzluğu;",
    "6 mm<sup>2</sup> &lt; PD &lt; 25 mm<sup>2</sup> değilse,", "<b>10.</b> Tamamlayıcı potansiyel dengeleme: PD &gt; 4mm² değilse.", "Ağır kusur olarak değerlendirilir."];
  var RB_NOT = ["Uygun.", "Güvenlik şartı sağlanamadığından uygun değildir. <b>(Ağır kusur)</b>", "Topraklama bağlantısı yok kontrol edilmelidir. <b>(Ağır kusur)</b>",
    "Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.",
    "TT veya TN (TN-S veya TN-CS’nin S bölümü) şebeke sistemlerinde 32 A’e kadar genel kullanım priz tesisatlarında, 32 A’e kadar seyyar cihaz prizlerinde 30 mA artık akım cihazı RCD kullanımı zorunludur. 32 A’in üzerindeki devrelerde ise, doğal kaçak akımların kaçınılmaz olduğu durumlarda, uygun seçilmiş kaçak akım koruma cihazları (RCD), diğer elektrik çarpmasına karşı koruma önlemleriyle birlikte kullanılmalıdır. Doğal kaçakların bulunduğu bölümlere ilişkin teknik detay ve sebepler periyodik kontrol raporunun ilgili bölümlerinde belirtilmelidir. <b>(Ağır kusur)</b>",
    "32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir <b>(Ağır kusur)</b>",
    "Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.",
    "Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. <b>(Ağır kusur)</b>", "TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. <b>(Ağır kusur)</b>",
    "Priz üzerinde Nötr-Toprak birleşikliği (sıfırlama yapıldığı) tespit edildiğinden yetersiz. Tesis topraklama tipi TT ise sıfırlama yapılamaz. TN ise PEN iletken kesiti &lt;10 mm<sup>2</sup> olamayacağından 2,5 mm<sup>2</sup> prizde sıfırlama yapılamaz. <b>(Ağır kusur)</b>",
    "Pano gövde–kapak köprüsü olmadığından yetersizdir. <b>(Ağır kusur)</b>"];
  /* örnek (tamamlanmış örnek raporlar için; saha raporundan gelmeyen tablolar) — UYDURMA */
  var RB_LINYE = [["ADP · F1 Aydınlatma", "B", "1", "16", "6", "2,5", "2,5", "2,5", "10", "24", "", "", "Uygun"], ["ADP · F2 Priz", "C", "1", "16", "6", "2,5", "2,5", "2,5", "12", "24", "21", "18", "Uygun"],
    ["ADP · F3 Kompresör", "C", "3", "32", "10", "6", "6", "6", "25", "41", "", "", "Uygun"], ["TP-1 · F4 Havalandırma", "C", "3", "25", "10", "4", "4", "4", "18", "32", "", "", "Uygun"]];
  var RB_PD = [["Ana dağıtım odası metal kapı ve kasası", "16", "0,04", "", "", "Uygun"], ["Kompresör şasisi", "6", "0,07", "4", "0,05", "Uygun"]];
  var RB_ZI = [["ADP önü", "1,0", "2,0", "180", "Uygun"]];
  var SAYI_AD = ["sıfır", "bir", "iki", "üç", "dört", "beş"];

  function resmiBelge(t, o, F) {
    var f = MV.FIRMA, rf = MV.raporFormati(t.format), R = o && o.r, et = !!F.gozle;
    var ok = MV.ornekKusur(t, o && /Hafif/.test(o.sonuc)), kusurlu = o && o.sonuc !== "Uygun";
    var k = function (v) { return v === undefined || v === null ? "" : kacis(String(v)); };
    var bosSatir = function (n) { var h = ""; for (var i = 0; i < n; i++) h += "<td></td>"; return h; };
    /* değerler: saha raporu > örnek (o var) > boş (şablon) */
    var alan = function (grup, a) { return R ? R[grup][a.k] : o ? a.ornek : ""; };
    var dx = function (grup, key) { var a = F[grup].filter(function (x) { return x.k === key; })[0]; return a ? alan(grup, a) : ""; };
    var esit = function (a, b) { return String(a || "").toLocaleLowerCase("tr") === String(b || "").toLocaleLowerCase("tr"); };
    /* seçenek listesi: "Var" gibi düz metin ya da [değer, görünen ad]; seçilen ●, öteki ○ (PDF'teki gibi) */
    var sec = function (deger, liste, ayrac) { return liste.map(function (x) { var d = Array.isArray(x) ? x[0] : x, ad = Array.isArray(x) ? x[1] : x;
      var sn = Array.isArray(deger) ? deger.some(function (y) { return esit(y, d); }) : esit(deger, d);
      return '<span class="rb-sec">' + (sn ? "●" : "○") + " " + k(ad) + "</span>"; }).join(ayrac || " "); };
    var ht = function (tr, ad) { return tr ? ad : ""; };
    var tarih = function (iso) { return iso ? MK.tarihYaz(iso) : ""; };
    var tsaat = function (iso, saat) { return iso ? MK.tarihYaz(iso) + (saat ? " " + saat : "") : ""; };
    var ts = o ? o.ts : null;
    var bas = function () {
      return '<table class="rb-bas"><colgroup><col style="width:11%"><col style="width:29%"><col style="width:10%"><col style="width:28%"><col style="width:22%"></colgroup><tr>' +
        '<td class="rb-logo">' + (o ? "LOGO" : "") + '</td><td class="rb-firma">' + (o ? "<b>" + k(f.ad) + "</b><br>" + k(f.adres) : "") + '</td><td class="rb-logo">' + (o ? "AKR." : "") + "</td>" +
        '<td class="rb-bas-ad">' + k(rf.ad.toLocaleUpperCase("tr")) + "</td>" +
        '<td class="rb-dok"><div><span>Doküman Kodu</span>: ' + rf.k + '</div><div><span>Yayım Tarihi</span>: ' + tarih(rf.yayim) + '</div><div><span>Revizyon No</span>: -</div><div><span>Revizyon Tarihi</span>: -</div><div><span>Yürürlük Tarihi</span>: ' + tarih(rf.yururluk) + "</div></td></tr></table>";
    };
    var sayfa = function (ic) { return '<div class="rb-sayfa">' + bas() + ic + "</div>"; };
    var bolumBas = function (ad, sutun) { return '<tr><th class="rb-bb" colspan="' + (sutun || 1) + '">' + ad + "</th></tr>"; };
    /* 1 · FİRMA BİLGİLERİ (iki formatta aynı) */
    var firma = '<table class="rb-t"><colgroup><col style="width:19%"><col style="width:36%"><col style="width:28%"><col style="width:17%"></colgroup>' + bolumBas(et ? "1.FİRMA BİLGİLERİ" : "1. FİRMA BİLGİLERİ", 4) +
      '<tr><td class="rb-e">Firma Adı</td><td>' + (o ? k(o.m.unvan) : "") + '</td><td class="rb-e">Rapor Numarası</td><td>' + (o ? k(o.no) : "") + "</td></tr>" +
      '<tr><td class="rb-e" rowspan="5">Periyodik Kontrol Adresi</td><td rowspan="5">' + (ts ? k(ts.adres + ", " + ts.ilce + " / " + ts.il) : "") + '</td><td class="rb-e">Rapor Tarihi</td><td>' + (o ? tarih(o.tarih) : "") + "</td></tr>" +
      '<tr><td class="rb-e">İSG-KATİP Sözleşme ID</td><td>' + (o && o.isg ? k(o.isg.no) : "") + "</td></tr>" +
      '<tr><td class="rb-e">Periyodik Kontrol Başlangıç Tarihi ve Saati</td><td>' + (o ? tsaat(o.tarih, o.bas) : "") + "</td></tr>" +
      '<tr><td class="rb-e">Periyodik Kontrol Bitiş Tarihi ve Saati</td><td>' + (o ? tsaat(o.tarih, o.bit) : "") + "</td></tr>" +
      '<tr><td class="rb-e">Bir Sonraki Periyodik Kontrol Tarihi</td><td>' + (o ? tarih(o.sonraki) : "") + "</td></tr>" +
      '<tr><td class="rb-e">SGK Sicil Numarası</td><td colspan="3">' + (ts ? k(ts.sgk) : "") + "</td></tr>" +
      '<tr><td class="rb-e">Periyodik Kontrol Metodu ve Kapsamı</td><td colspan="3"><ul class="rb-liste">' + F.dayanak.map(function (x) { return "<li>" + k(x) + "</li>"; }).join("") + "</ul></td></tr></table>";
    /* ölçüm aletleri / termal kamera: iki cihaz yan yana, beş satır */
    var cihazTablo = function (baslik, l) {
      var satirlar = [["Cihaz adı", function (v) { return v.ad; }], ["Kalibrasyon tarihi", function (v) { return tarih(v.kal[0].tarih); }], ["Kalibrasyon geçerlilik tarihi", function (v) { return tarih(v.kal[0].bitis); }],
        ["Seri numarası", function (v) { return v.seri; }], ["Kalibrasyon numarası", function (v) { return v.kal[0].sertifika; }]];
      var ciftler = []; for (var i = 0; i < Math.max(2, l.length); i += 2) ciftler.push([l[i], l[i + 1]]);
      return '<table class="rb-t"><colgroup><col style="width:22%"><col style="width:28%"><col style="width:22%"><col style="width:28%"></colgroup>' + bolumBas(baslik, 4) +
        ciftler.map(function (c) { return satirlar.map(function (s) { return '<tr><td class="rb-e">' + s[0] + "</td><td>" + (c[0] ? k(s[1](c[0])) : "") + '</td><td class="rb-e">' + s[0] + "</td><td>" + (c[1] ? k(s[1](c[1])) : "") + "</td></tr>"; }).join(""); }).join("") + "</table>";
    };
    var cihazlar = o ? o.cihaz || [] : [];
    var kriterDeger = function (i, grupAd) {
      if (R) { var x = R.kriter[i]; return x && x.c ? { uygun: "Uygun", uygundegil: "Uygun Değil", uygulanamaz: "Uygulanamaz" }[x.c] + (x.c === "uygundegil" ? (x.derece === "agir" ? " **" : x.derece === "hafif" ? " *" : "") : "") : ""; }
      if (!o) return "";
      if (kusurlu && i === ok.i) return "Uygun Değil" + (/Hafif/.test(o.sonuc) ? " *" : " **");
      return grupAd === "TERMAL KAMERA" ? "Uygulanamaz" : "Uygun";
    };
    var kusurMetin = function () {
      var l = R ? o.kusurlar || [] : kusurlu ? [[ok.kriter, /Hafif/.test(o.sonuc) ? "Hafif kusur" : "Ağır kusur", ok.aciklama]] : [];
      return l.length ? l.map(function (x) { return "<div>" + (/Hafif/.test(x[1]) ? "* " : "** ") + "<b>" + k(x[0]) + "</b>: " + k(x[2]) + "</div>"; }).join("") : "";
    };
    var fotoKutu = function () { var n = R ? R.foto : o ? 2 : 0, h = ""; for (var i = 1; i <= n; i++) h += '<span class="rb-foto">Fotoğraf ' + i + "</span>"; return h; };
    var yetkili = function (num) {
      var p = o ? o.p : null, n = f.nusha;
      return '<table class="rb-t"><colgroup><col style="width:30%"><col style="width:40%"><col style="width:30%"></colgroup>' + bolumBas(num + ". PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY", 3) +
        '<tr><td class="rb-e">Adı Soyadı</td><td>' + (p ? k(p.ad) : "") + '</td><td class="rb-e rb-orta">İmzası</td></tr>' +
        '<tr><td class="rb-e">Mesleği</td><td>' + (p ? k(MV.meslekAd(p)) : "") + '</td><td rowspan="2" class="rb-imza">' + (o && o.imza ? "Güvenli elektronik imza<br>" + k(MK.zamanYaz(o.imza.zaman)) : "") + "</td></tr>" +
        '<tr><td class="rb-e">Yetkili Kişi Kayıt Numarası</td><td>' + (p ? k(p.ekipnet) : "") + "</td></tr></table>" +
        '<p class="rb-dip">Bu rapor ' + (o ? SAYI_AD[n] + " (" + n + ")" : "............(yazı (rakam))") + " nüsha olarak hazırlanmıştır.</p>";
    };
    var sonucSec = function (uygunMetin, degilMetin) {
      if (!o) return "<b>" + uygunMetin + "/" + degilMetin + "</b>";
      var uygun = R ? R.sonuc === "kullanilir" : !kusurlu, degil = R ? R.sonuc === "kullanilamaz" : kusurlu;
      return "<b>" + (degil ? "<s>" + uygunMetin + "</s>" : uygunMetin) + "/" + (uygun ? "<s>" + degilMetin + "</s>" : degilMetin) + "</b>";
    };

    if (et) {
      /* ════ ZPKR02 · ELEKTRİK İÇ TESİSATI (4 sayfa) ════ */
      var D = function (key) { return dx("detay", key); }, T = function (key) { return dx("tespit", key); };
      var faz = D("faz") || "";
      var detay = '<table class="rb-t rb-kucuk"><colgroup><col style="width:17%"><col style="width:12%"><col style="width:8%"><col style="width:16%"><col style="width:15%"><col style="width:16%"><col style="width:16%"></colgroup>' +
        bolumBas("2. EKİPMAN BİLGİLERİ", 7) + '<tr><th class="rb-ab" colspan="7">2.1. DETAY BİLGİLER</th></tr>' +
        '<tr><td class="rb-e">Enerji sağlayan kuruluş</td><td colspan="2">' + k(D("kurulus")) + '</td><td class="rb-e">Şebeke tipi</td><td colspan="3">' + sebekeSec(D("sebeke")) + "</td></tr>" +
        '<tr><td class="rb-e">Şebeke gerilimi</td><td colspan="2">' + k(D("gerilim")) + '</td><td class="rb-e">Tesise ait proje var mı?</td><td>' + sec(D("proje"), ["Var", "Yok"]) + '</td><td class="rb-e">Tek hat şeması var mı?</td><td>' + sec(D("tekhat"), ["Var", "Yok"]) + "</td></tr>" +
        '<tr><td class="rb-e">Kontrol nedeni</td><td colspan="2">' + sec(D("neden"), ["Periyodik Kontrol", "İlk Kontrol"], "<br>") + '</td><td class="rb-e">Topraklayıcı tipi</td><td colspan="3">' + sec(D("topraklayici"), ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"]) + "</td></tr>" +
        '<tr><td class="rb-e">Yapı cinsi</td><td colspan="2">' + sec(D("yapi"), ["Ev", "Ticari", "Endüstri", "Diğer"], "<br>") + '</td><td class="rb-e">Ekipmanın kullanım amacı</td><td>' + k(D("amac")) + '</td><td class="rb-e">Son kontrol tarihi</td><td>' + k(D("sonKontrol")) + "</td></tr>" +
        '<tr><td class="rb-e" rowspan="4">Faz iletkenlerinin sayısı ve tipi</td><td rowspan="4">' + sec(faz, [["AA · 1 faz, 2 tel", "AA"], ["AA · 1 faz, 2 tel", "1 faz, 2 tel"], ["AA · 1 faz, 3 tel", "1 faz, 3 tel"], ["AA · 2 faz, 3 tel", "2 faz, 3 tel"], ["AA · 3 faz, 3 tel", "3 faz, 3 tel"], ["AA · 3 faz, 4 tel", "3 faz, 4 tel"]].map(function (x, i) { return i === 0 ? [/^AA/.test(faz) ? faz : "—", "AA"] : x; }), "<br>") +
          '</td><td rowspan="4">' + sec(faz, [[/^DA/.test(faz) ? faz : "—", "DA"], ["DA · 2 kutup", "2 kutup"], ["DA · 3 kutup", "3 kutup"], ["Diğer", "Diğer"]], "<br>") + '</td><td class="rb-e" colspan="2">Temel topraklama direnci (Ω)</td><td colspan="2">' + k(D("temelDirenc")) + "</td></tr>" +
        '<tr><td class="rb-e" colspan="2">İlave topraklama elektrotu detayları (varsa)</td><td colspan="2">' + k(D("elektrot")) + "</td></tr>" +
        '<tr><td class="rb-e" colspan="2">Sistem topraklama iletkeni ve kesiti</td><td colspan="2">' + k(D("sistemIletken")) + "</td></tr>" +
        '<tr><td class="rb-e" colspan="2">Ana eşpotansiyel iletkeni ve kesiti</td><td colspan="2">' + k(D("anaEsp")) + "</td></tr>" +
        '<tr><td class="rb-e">Besleme kaynağı karakteristikleri</td><td colspan="4">' +
          "○ Nominal gerilim , U/Uo(1) " + nokta(D("kaynakU")) + " kV (1. Fazdan alınan değer)<br>○ Nominal frekans, f (1) " + nokta(D("kaynakF")) + " Hz<br>○ Hata Akımı Olasılığı, IF(1) " + nokta(D("kaynakIF")) + " kA<br>○ Dış çevrim empedansı ZE " + nokta(D("kaynakZE")) + " Ω" +
          '</td><td class="rb-e">TT-TN-S Şebeke için ana RCD anma akımı</td><td>' + k(D("anaRcd")) + "</td></tr>" +
        '<tr><td class="rb-e">Ana kesici karakteristikleri</td><td colspan="4">○ Tip ' + nokta(D("anaKesiciTip")) + "<br>○ Nominal Akım " + nokta(D("anaKesiciAkim")) + '</td><td class="rb-e">TT-TNS Şebeke için ana RCD test akımı (mA) ve süresi (ms)</td><td>' + k(D("anaRcdTest")) + "</td></tr>" +
        '<tr><th class="rb-ab" colspan="7">2.2. TESPİT EDİLEN BİLGİLER</th></tr>' +
        '<tr><td class="rb-e" colspan="4">Tesisatta kapsamlı değişiklik var mı? (&gt;%20)</td><td colspan="3">' + sec(T("degisiklik"), ["Var", "Yok"]) + "</td></tr>" +
        '<tr><td class="rb-e" colspan="4">Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı?</td><td colspan="3">' + sec(T("dkd"), ["Evet", "Hayır"]) + "</td></tr>" +
        '<tr><td class="rb-e" colspan="4">Tespit edilen bilgiler<br>(Doğrudan dokunmaya karşı koruma önlemleri)</td><td colspan="3">' + sec(T("dogrudan") || [], F.tespit.filter(function (x) { return x.k === "dogrudan"; })[0].sec, "<br>") + "</td></tr>" +
        '<tr><td class="rb-e" colspan="4">Bir önceki periyodik kontrol etiketi var mı?</td><td colspan="3">' + sec(T("etiket"), ["Var", "Yok"]) + "</td></tr></table>";
      var termal = cihazlar.filter(function (v) { return v.cihazTur === "termal"; });   /* türün cihazlarından eklenen termal kamera */
      var gruplar = MV.kriterGruplari(t), i0 = 0;
      var kriterTablo = '<table class="rb-t rb-kucuk"><colgroup><col style="width:32%"><col style="width:18%"><col style="width:32%"><col style="width:18%"></colgroup>' +
        '<tr><th class="rb-ust" colspan="4">TEST VE KONTROLLER</th></tr>' + bolumBas("5. KONTROL KRİTERLERİ VE TESTLER", 4) +
        '<tr><td class="rb-e" colspan="2"><b>Pano Adı/Ekipman Tanımlaması</b></td><td colspan="2">' + k(T("pano")) + "</td></tr>" +
        '<tr><th class="rb-e rb-orta">Kontrol Kriteri</th><th class="rb-e rb-orta">Değerlendirme</th><th class="rb-e rb-orta">Kontrol Kriteri</th><th class="rb-e rb-orta">Değerlendirme</th></tr>' +
        gruplar.map(function (g) {
          var l = g[1].map(function (ad, j) { return [ad, kriterDeger(i0 + j, g[0])]; }); i0 += g[1].length;
          if (g[0] === "TERMAL KAMERA") l = [["Fotoğraf tarihi", termal.length && o ? tarih(o.tarih) : ""], l[0], ["Fotoğraf no.", ""], l[1]];
          var h = '<tr><th class="rb-grup" colspan="4">' + g[0] + "</th></tr>";
          for (var a = 0; a < l.length; a += 2) h += '<tr><td class="rb-e">' + k(l[a][0]) + "</td><td>" + l[a][1] + '</td><td class="rb-e">' + (l[a + 1] ? k(l[a + 1][0]) : "") + "</td><td>" + (l[a + 1] ? l[a + 1][1] : "") + "</td></tr>";
          return h;
        }).join("") + "</table>" + '<p class="rb-dip">Pano/Ekipman sayısı fazla olan tesislerde birden fazla form kullanılmalıdır.</p>';
      var TS = MV.testler(t), tv = function (key) { var i = TS.map(function (x) { return x.k; }).indexOf(key); return i < 0 ? "" : R ? R.test[i] : o ? TS[i].ornek : ""; };
      var metot = R ? R.metod : o ? t.olcumMetot : "";
      var fonk = '<table class="rb-t"><colgroup><col style="width:30%"><col style="width:70%"></colgroup>' + bolumBas("6.FONKSİON KONTROL KRİTERLERİ VE TESTLER", 2) +
        '<tr><td class="rb-e">Ölçüm ve doğrulama metodu</td><td>' + sec(metot, F.metot, " &nbsp; &nbsp; ") + "</td></tr>" +
        '<tr><th class="rb-ab" colspan="2">6.1. AŞIRI AKIM CİHAZI / İLETKEN UYGUNLUĞU - GERİLİM KONTROLÜ - AŞIRI GERİM CİHAZLARI (DKD) KONTROLÜ - RCD TESTLERİ</th></tr>' +
        '<tr><td class="rb-e"><b>Pano (Ekipman) Adı-Etiketi veya Kodu</b></td><td>' + k(T("pano")) + "</td></tr></table>" +
        '<table class="rb-t"><colgroup><col style="width:19%"><col style="width:13%"><col style="width:16%"><col style="width:10%"><col style="width:10%"><col style="width:19%"><col style="width:13%"></colgroup>' +
        '<tr><td class="rb-e" rowspan="3">Panodan ölçülen faz-toprak çevrim empedansı (Zx) (Ω)</td><td rowspan="3">' + k(tv("zx")) + '</td><td class="rb-e" rowspan="3">Gerilimler</td><td class="rb-e">F-F(V) :</td><td>' + k(tv("ff")) +
          '</td><td class="rb-e" rowspan="3">Aşırı gerilim koruma (DKD) tipi</td><td rowspan="3">' + k(tv("dkdTip")) + "</td></tr>" +
        '<tr><td class="rb-e">L-N(V) :</td><td>' + k(tv("ln")) + '</td></tr><tr><td class="rb-e">N-PE(V):</td><td>' + k(tv("npe")) + "</td></tr>" +
        '<tr><td class="rb-e">Panodan ölçülen faz-nötr çevrim empedansı (ZLN) (Ω)</td><td>' + k(tv("zln")) + '</td><td class="rb-e">Hesaplanan 3 fazlı kısa devre akımı (kA)</td><td colspan="2">' + k(tv("ik3")) +
          '</td><td class="rb-e">Aşırı gerilim koruma (DKD) dayanma akımı (kA)</td><td>' + k(tv("dkdAkim")) + "</td></tr></table>";
      /* 6.1 linye tablosu: saha raporunda pano sigortaları (tip, akım, kutup, RCD) + L kaleminde kesitler */
      var linye = R ? (R.sigorta || []).map(function (x, i) { return [x.no + " · " + x.devre, x.tip, x.kutup, x.akim, x.icu || "", x.faz || "", x.npen || "", x.pe || "", x.ib || "", x.iz || "", x.id || "", x.td || "", x.not || ""]; }) : o ? RB_LINYE : [];
      var linyeTablo = '<table class="rb-t rb-kucuk rb-linye"><colgroup><col style="width:4%"><col style="width:20%"><col span="4" style="width:5.5%"><col span="5" style="width:6.5%"><col span="2" style="width:5%"><col style="width:6%"></colgroup>' +
        '<tr><th class="rb-e rb-dikey" rowspan="2"><span>No.</span></th><th class="rb-e" rowspan="2">Pano/Tablo numarası-Linye Adı-Etiketi</th><th class="rb-e" colspan="4">Aşırı Akım Koruma Cihazının</th><th class="rb-e" colspan="5">İletkenin</th><th class="rb-e" colspan="2">RCD Testi</th><th class="rb-e rb-dikey" rowspan="2"><span>Sonuç (Not)</span></th></tr>' +
        '<tr>' + ["Açma eğrisi tipi", "Kutup sayısı", "In(A)", "Icu Kısa devre kesme akımı", "Faz kesiti (mm²)", "N/PEN Kesiti (mm²)", "PE Koruma iletkeni kesiti (mm²)", "Ib Yük/Tasarım akımı (A)", "Iz Akım taşıma kapasitesi (A)", "IΔ (mA)", "TΔ (ms)"].map(function (x) { return '<th class="rb-e rb-dikey"><span>' + x + "</span></th>"; }).join("") + "</tr>" +
        doldur(linye, 7, 13).map(function (s, i) { return "<tr><td>" + (s ? i + 1 : "") + "</td>" + (s ? s.map(function (x) { return "<td>" + k(x) + "</td>"; }).join("") : bosSatir(13)) + "</tr>"; }).join("") + "</table>";
      var pd = R ? (R.pd || []) : o ? RB_PD : [], zi = R ? (R.zi || []) : o ? RB_ZI : [];
      var pdTablo = '<table class="rb-t rb-kucuk"><colgroup><col style="width:4%"><col style="width:30%"><col style="width:13%"><col style="width:17%"><col style="width:17%"><col style="width:16%"><col style="width:8%"></colgroup>' +
        '<tr><th class="rb-ab" colspan="7">6.2. POTANSİYEL DENGELEME İLETKENLERİ KONTROLÜ</th></tr><tr><th class="rb-e rb-dikey"><span>No.</span></th>' +
        ["Potansiyel dengeleme yapılan ilgili bölüm", "Potansiyel dengeleme iletkeni kesiti (mm²)", "Potansiyel dengeleme iletkeni süreklilik (Ω)", "Varsa tamamlayıcı potansiyel dengeleme iletkeni kesiti (mm²)", "Tamamlayıcı potansiyel dengeleme süreklilik (Ω)", "Sonuç (Not)"].map(function (x) { return '<th class="rb-e">' + x + "</th>"; }).join("") + "</tr>" +
        doldur(pd, 5, 6).map(function (s, i) { return "<tr><td>" + (s ? i + 1 : "") + "</td>" + (s ? s.map(function (x) { return "<td>" + k(x) + "</td>"; }).join("") : bosSatir(6)) + "</tr>"; }).join("") + "</table>";
      var ziTablo = '<table class="rb-t rb-kucuk"><colgroup><col style="width:4%"><col style="width:36%"><col style="width:17%"><col style="width:17%"><col style="width:13%"><col style="width:13%"></colgroup>' +
        '<tr><th class="rb-ab" colspan="6">6.3. ZEMİN İZOLASYONUNUN KONTROLÜ</th></tr><tr><th class="rb-e rb-dikey"><span>No.</span></th>' +
        ["İzolasyon halısının (Zemin yalıtımının) yeri", "Eni (m)", "Boyu (m)", "Zemin izolasyon direnci (kΩ)", "Sonuç (Uygunluk notu)"].map(function (x) { return '<th class="rb-e">' + x + "</th>"; }).join("") + "</tr>" +
        doldur(zi, 2, 5).map(function (s, i) { return "<tr><td>" + (s ? i + 1 : "") + "</td>" + (s ? s.map(function (x) { return "<td>" + k(x) + "</td>"; }).join("") : bosSatir(5)) + "</tr>"; }).join("") + "</table>" +
        '<p class="rb-dip">Nokta sayısı fazla olan tesislerde birden fazla form kullanılabilir. Ya da formun sadece 6. Bölümü çoğaltılabilir.</p>';
      var kutu = function (bas, ic, sinif) { return '<table class="rb-t">' + bolumBas(bas) + '<tr><td class="rb-kutu ' + (sinif || "") + '">' + ic + "</td></tr></table>"; };
      var sonuc = '<table class="rb-t">' + bolumBas("10. SONUÇ VE KANAAT") + '<tr><td class="rb-metin">' +
        "Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında " + sonucSec("kullanımı uygundur", "kullanımı uygun değildir") +
        ". TS HD 60364 standardına göre kullanımı uygun olmayan tesisatlar aşağıdaki şekilde işaretlenir:<br>Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir.<br>(*)Bu not, sadece hafif kusur tespit edilmesi durumunda yazılacaktır.<br><br>" +
        "<b>Ağır kusur tanımları:</b><br><b><i>Gözle Kontrol Bölümü</i></b><br>" + RB_AGIR_GOZ.map(function (x, i) { return "<b>" + (i + 1) + ".</b> " + x; }).join("<br>") + "<br><br><b>Fonksiyon Testleri Bölümü</b><br>" + RB_AGIR_FONK.join("<br>") +
        "<br><b>C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.</b><br><b>C2 – Potansiyel olarak tehlikeli – acil düzeltici eylem gerekli.</b><br><b>C3 – İyileştirme önerilir.</b><br>" +
        "Bu rapor “<i>Alçak Gerilim Topraklama Tesisatı Kontrol Raporu</i>” ile birlikte geçerlidir.<br>Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir. (Sadece hafif kusur tespit edilmesi durumunda yazılacaktır.)</td></tr></table>";
      return '<article class="rb-belge" aria-label="' + rf.k + ' rapor çıktısı">' +
        sayfa(firma + detay + cihazTablo("3. TERMAL KAMERA BİLGİLERİ", termal)) +
        sayfa(cihazTablo("4. ÖLÇÜM ALETLERİ BİLGİLERİ", cihazlar.filter(function (v) { return v.cihazTur !== "termal"; })) + kriterTablo + fonk) +
        sayfa(linyeTablo + pdTablo + ziTablo + kutu("7. KUSUR AÇIKLAMALARI", kusurMetin(), "rb-kutu-orta") +
          '<p class="rb-dip">Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır. Değerlendirme “Uygun”, “Uygun Değil” ve “Uygulanamaz” olarak yapılmıştır.</p>' +
          kutu("8. EKİPMAN FOTOĞRAFLARI", fotoKutu(), "rb-kutu-buyuk") + kutu("9. NOTLAR", R && R.notlar ? k(R.notlar) : "", "rb-kutu-kucuk")) +
        sayfa(sonuc + yetkili(11)) + "</article>";
    }
    /* ════ ZPKR01 · AG TOPRAKLAMA (2 sayfa) ════ */
    var A = function (key) { return dx("detay", key); }, B = function (key) { return dx("tespit", key); };
    var detay1 = '<table class="rb-t rb-kucuk"><colgroup><col style="width:17%"><col style="width:13%"><col style="width:22%"><col style="width:15%"><col style="width:17%"><col style="width:16%"></colgroup>' +
      bolumBas("2. EKİPMAN BİLGİLERİ", 6) + '<tr><th class="rb-ab" colspan="6">2.1. ETİKET VE DETAY BİLGİLERİ</th></tr>' +
      '<tr><td class="rb-e">Enerji sağlayan kuruluş</td><td>' + k(A("kurulus")) + '</td><td class="rb-e">Şebeke tipi</td><td colspan="3">' + sebekeSec(A("sebeke")) + "</td></tr>" +
      '<tr><td class="rb-e">Şebeke gerilimi</td><td>' + k(A("gerilim")) + '</td><td class="rb-e">Tesise ait proje var mı?</td><td>' + sec(A("proje"), ["Var", "Yok"]) + '</td><td class="rb-e">Tek hat şeması var mı?</td><td>' + sec(A("tekhat"), ["Var", "Yok"]) + "</td></tr>" +
      '<tr><td class="rb-e" rowspan="2">Kontrol nedeni</td><td rowspan="2">' + sec(A("neden"), ["Periyodik Kontrol", "İlk Kontrol"], "<br>") + '</td><td class="rb-e">Proje bilgileri</td><td colspan="3">' + k(A("projeBilgi")) + "</td></tr>" +
      '<tr><td class="rb-e">Topraklayıcı tipi</td><td colspan="3">' + sec(A("topraklayici"), ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"]) + "</td></tr>" +
      '<tr><td class="rb-e">Yapı cinsi</td><td>' + sec(A("yapi"), ["Ev", "Ticari", "Endüstri", "Diğer"], "<br>") + '</td><td class="rb-e">Ekipmanın kullanım amacı</td><td>' + k(A("amac")) + '</td><td class="rb-e">Son kontrol tarihi</td><td>' + k(A("sonKontrol")) + "</td></tr>" +
      '<tr><td class="rb-e">Dolaylı dokunmaya karşı koruma önlemi</td><td colspan="5">' + sec(A("dolayli"), F.detay.filter(function (x) { return x.k === "dolayli"; })[0].sec) + "</td></tr>" +
      '<tr><td class="rb-e">Hava durumu ve sıcaklığı</td><td colspan="2">' + k(A("hava")) + '</td><td class="rb-e">Zemin nem durumu</td><td colspan="2">' + k(A("zemin")) + "</td></tr>" +
      '<tr><th class="rb-ab" colspan="6">2.2. TESPİT EDİLEN BİLGİLER</th></tr>' +
      '<tr><td class="rb-e">Tesisatta kapsamlı değişiklik var mı?</td><td>' + sec(B("degisiklik"), ["Var", "Yok"]) + '</td><td class="rb-e">Bir önceki periyodik kontrol etiketi var mı?</td><td>' + sec(B("etiket"), ["Var", "Yok"]) +
        '</td><td class="rb-e">Pano/Ekipman tanımlaması</td><td>' + k(B("pano")) + "</td></tr></table>";
    var tanim = '<table class="rb-t">' + bolumBas("4. TEST DEĞERLERİ") + '<tr><td class="rb-metin rb-girinti">' + RB_TANIM.map(k).join("<br>") + "</td></tr></table>";
    var metot1 = R ? R.metod : o ? t.olcumMetot : "";
    var kontrol = '<table class="rb-t"><colgroup><col style="width:35%"><col style="width:65%"></colgroup>' + bolumBas("5. KONTROL KRİTERLERİ VE TESTLER", 2) + '<tr><th class="rb-orta" colspan="2">ÖLÇÜM METODU</th></tr>' +
      '<tr><td class="rb-e">Ölçüm ve doğrulama metodu</td><td>' + sec(metot1, F.metot, "<br>") + "</td></tr></table>";
    var noktalar = R ? R.nokta : o ? F.noktalar.map(function (n) { return { ad: n[0], egri: n[1], In: n[2], zx: n[3] || "0,34", rcd: n[4], priz: /priz/i.test(n[0]) }; }) : [];
    if (!R && kusurlu && !/Hafif/.test(o.sonuc)) noktalar = noktalar.concat([{ ad: "Kapı motoru — sevkiyat", egri: "C", In: 10, zx: "2,6", rcd: "" }]);
    var nTablo = '<table class="rb-t rb-kucuk"><colgroup><col style="width:5%"><col style="width:15%"><col style="width:5%"><col style="width:7%"><col style="width:7%"><col style="width:9%"><col style="width:10%"><col style="width:7%"><col style="width:11%"><col style="width:8%"><col style="width:8%"><col style="width:8%"></colgroup>' +
      '<tr><th class="rb-ab" colspan="12">5.1. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA YETERLİLİĞİ KONTROLÜ</th></tr>' +
      '<tr><th class="rb-e" rowspan="2">No</th><th class="rb-e" rowspan="2">Ölçüm noktası / Etiketi veya kodu</th><th class="rb-e" colspan="4">Koruma Elemanının</th><th class="rb-e" colspan="2">Ölçüm</th><th class="rb-e" rowspan="2">RCD tipi, dayanma akımı ve açma akımı In(A) / IΔn(mA)</th><th class="rb-e" colspan="2">RCD Testi</th><th class="rb-e" rowspan="2">Sonuç (Uygunluk notu)</th></tr>' +
      '<tr><th class="rb-e">In (A)</th><th class="rb-e">Açma eğrisi tipi</th><th class="rb-e">Açma akımı Ia (A)</th><th class="rb-e">Toprak kısa devre akımı Ik1 (A)</th><th class="rb-e">Ölçülen değer Zx/Rx (Ω)</th><th class="rb-e">Sınır değer Zs /RA (Ω)</th><th class="rb-e">Açma akımı IΔ (mA)</th><th class="rb-e">Açma zamanı TΔ (ms)</th></tr>' +
      doldur(noktalar, 2, 0).map(function (n, i) {
        if (!n) return "<tr>" + bosSatir(12) + "</tr>";
        var h = MV.noktaHesap(n);
        return "<tr><td>" + (i + 1) + "</td><td>" + k(n.ad) + "</td><td>" + k(n.In) + "</td><td>" + k(n.egri) + "</td><td>" + h.ia + "</td><td>" + (h.ik || "") + "</td><td>" + k(n.zx) + "</td><td>" + String(h.zs).replace(".", ",") + "</td><td>" +
          (n.rcd ? (n.rcdTip || "A") + " · " + n.In + " A / " + n.rcd + " mA" : "") + "</td><td>" + k(n.rcdId || "") + "</td><td>" + k(n.rcdTd || "") + "</td><td>" + (h.not ? "Not-" + h.not : "") + "</td></tr>";
      }).join("") + "</table>";
    var rcdl = R ? R.rcdler : o ? F.rcd.map(function (x) { return { ad: x[0], tip: x[1], In: x[2], idn: x[3], id: x[4] || "220", td: x[5] || "180" }; }) : [];
    var sTablo = '<table class="rb-t rb-kucuk"><colgroup><col style="width:6%"><col style="width:14%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:9%"><col style="width:14%"><col style="width:9%"><col style="width:9%"><col style="width:7%"><col style="width:8%"></colgroup>' +
      '<tr><th class="rb-ab" colspan="11">5.2.ARTIK AKIM ANAHTARLARI (RCD) SELEKTİVİTE KONTROLÜ</th></tr>' +
      '<tr><th class="rb-e" rowspan="2">No</th><th class="rb-e" rowspan="2">Son tüketim noktasını besleyen panodan N önceki panonun adı</th><th class="rb-e" colspan="4">Kullanılan RCD Etiket Bilgileri</th><th class="rb-e" rowspan="2">Son tüketim noktasını besleyen pano adı</th><th class="rb-e" colspan="3">Kullanılan RCD</th><th class="rb-e" rowspan="2">Sonuç (Uygunluk notu)</th></tr>' +
      '<tr><th class="rb-e">RCD Tipi</th><th class="rb-e">Dayanma akımı In (A)</th><th class="rb-e">Açma akımı IΔn (mA)</th><th class="rb-e">Açma zamanı gecikmesi (ms)</th><th class="rb-e">RCD Tipi</th><th class="rb-e">Açma akımı IΔn (mA)</th><th class="rb-e">Test açma zamanı TΔ (ms)</th></tr>' +
      [0, 1].concat(rcdl.length > 2 ? rcdl.slice(2).map(function (x, i) { return i + 2; }) : []).map(function (i) {
        var x = rcdl[i]; if (!x) return "<tr><td>N=" + (i + 1) + "</td>" + bosSatir(10) + "</tr>";
        var ok2 = x.id !== "" && x.td !== "" ? (parseFloat(String(x.id).replace(",", ".")) <= x.idn && parseFloat(String(x.td).replace(",", ".")) <= 200 ? "Not-1" : "Not-7") : "";
        return "<tr><td>N=" + (i + 1) + "</td><td>" + k(x.ad) + "</td><td>" + k(x.tip) + "</td><td>" + k(x.In) + "</td><td>" + k(x.idn) + "</td><td>" + k(x.gecikme || "") + "</td><td>" + k(x.sonPano || "") + "</td><td>" + k(x.tip) + "</td><td>" + k(x.idn) + "</td><td>" + k(x.td) + "</td><td>" + ok2 + "</td></tr>";
      }).join("") + "</table>";
    var kutu1 = function (bas, ic, sinif) { return '<table class="rb-t">' + bolumBas(bas) + '<tr><td class="rb-kutu ' + (sinif || "") + '">' + ic + "</td></tr></table>"; };
    var sonuc1 = '<table class="rb-t">' + bolumBas("8. SONUÇ VE KANAAT") + '<tr><td class="rb-metin rb-girinti">' +
      "Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen <b>AG Topraklama Tesisatı</b> muayenesi sonrasında mevcut şartlar altında <b>kullanımı 1 yıl süreyle;</b><br>" + sonucSec("UYGUNDUR ", " UYGUN DEĞİLDİR") + ".<br>" +
      "Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir.<br>(*)Bu not, sadece hafif kusur tespit edilmesi durumunda yazılacaktır.<br><br><b>Uygunluk notu ve ağır kusur açıklamaları:</b><br>" +
      RB_NOT.map(function (x, i) { return "<i>Not-" + (i + 1) + ":</i> " + x; }).join("<br>") + "</td></tr></table>";
    return '<article class="rb-belge" aria-label="' + rf.k + ' rapor çıktısı">' +
      sayfa(firma + detay1 + cihazTablo("3. ÖLÇÜM ALETLERİ BİLGİLERİ", cihazlar) + tanim + kontrol) +
      sayfa(nTablo + sTablo + kutu1("6. KUSUR AÇIKLAMALARI", kusurMetin(), "rb-kutu-ince") +
        '<p class="rb-dip">Nokta sayısı fazla olan tesislerde birden fazla form kullanılabilir. Ya da formun sadece 5. Bölümü çoğaltılabilir.<br>Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır. Değerlendirme “Uygun”, “Uygun Değil” ve “Uygulanamaz” olarak yapılmıştır.</p>' +
        kutu1("7. NOTLAR", R && R.notlar ? k(R.notlar) : "", "rb-kutu-ince") + sonuc1 + yetkili(9)) +
      (R ? sayfa('<table class="rb-t">' + bolumBas("EK · FOTOĞRAFLAR") + '<tr><td class="rb-kutu rb-kutu-buyuk">' + fotoKutu() + "</td></tr></table>") : "") + "</article>";
  }
  /* yardımcılar (resmî çıktı) */
  function nokta(v) { return v ? "<u>" + MK.kacis(String(v)) + "</u>" : "…………………"; }
  function sebekeSec(v) {
    var s = String(v || ""), tn = /^TN/.test(s), c = function (x, ad) { return '<span class="rb-sec">' + (x ? "●" : "○") + " " + ad + "</span>"; };
    return c(s === "TT", "TT") + " " + c(s === "IT", "IT") + " " + c(tn, "TN") + "<br>" + c(s === "TN-CS", "TN-CS") + " " + c(s === "TN-C", "TN-C") + " " + c(s === "TN-S", "TN-S");
  }
  /* en az n satır (boş satırlar null); ekSutun kullanılmaz, tablo kendisi doldurur */
  function doldur(l, n) { var r = l.slice(); while (r.length < n) r.push(null); return r; }
  /* saha raporundan (o.r) ön izleme yardımcıları */
  var SONUC_AD = { uygun: "Uygun", uygundegil: "Uygun değil", uygulanamaz: "Uygulanamaz" };
  function sonucAd(x) { return x && x.c ? SONUC_AD[x.c] + (x.c === "uygundegil" && x.derece ? " · " + (x.derece === "agir" ? "ağır" : "hafif") : "") : "-"; }
  function kusurHtml(l) {
    return l && l.length ? "<ol class=\"a-belge-notlar\">" + l.map(function (x) { return "<li><b>" + kacis(x[0]) + "</b> · " + kacis(x[1]) + ": " + kacis(x[2]) + "</li>"; }).join("") + "</ol>" : '<p class="a-deger-yok">Kusur yok.</p>';
  }
  function sonucKutu(o, kusurlu) {
    var R = o && o.r, uygun = R ? R.sonuc === "kullanilir" : o && !kusurlu, degil = R ? R.sonuc === "kullanilamaz" : kusurlu;
    return '<p class="a-belge-secenek"><span class="a-belge-kutu' + (uygun ? " a-belge-kutu-dolu" : "") + '"></span>Uygun</p>' +
      '<p class="a-belge-secenek"><span class="a-belge-kutu' + (degil ? " a-belge-kutu-dolu" : "") + '"></span>Uygun değil</p>';
  }
  function fotoHtml(n) {
    var l = []; for (var i = 1; i <= n; i++) l.push('<span class="a-foto" role="img" aria-label="Fotoğraf ' + i + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>");
    return l.length ? '<div class="a-fotolar">' + l.join("") + "</div>" : '<p class="a-deger-yok">Fotoğraf yok.</p>';
  }
  /* bolum(no, başlık, iç) ya da bolum(no, başlık, sağdaki kısa bilgi, iç) — rapor belgesinde madde etiketi yok (2026-09-26) */
  function bolum(no, baslik, ek, ic) {
    if (ic === undefined) { ic = ek; ek = ""; }
    return '<section class="a-belge-bolum"><h3><span>' + no + " · " + baslik + "</span>" + (ek ? '<span class="a-belge-madde">' + ek + "</span>" : "") + "</h3>" + ic + "</section>";
  }
  function tablo(bas, satirlar, kay, sinif) {
    return '<table class="a-belge-tablo' + (sinif ? " " + sinif : "") + '"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (s) { return "<tr>" + s.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" + (kay ? kaynak(kay) : "");
  }

  /* ── ZİMMET TESLİM FORMU — TEMEL FORMAT (reisim 2026-09-25: "zimmete varlık eklendikten sonra eklenen varlıkların PDF şeklinde
     çıkartılıp imzalanıp taramasının buraya koyulması için bir düzenek kurgula, bunun için temel bir format oluştur; müşteri formatı
     istemese biz müşteri isteği doğrultusunda bunu değiştiririz"). Firmaya göre değişen formatlardan biri (pkproje.md §3.7): firma kendi
     formunu isterse o firmaya özel üretilir, bu varsayılan kalır. o = { p (teslim alan), varliklar[], no, tarih, eden (teslim eden) }. */
  /* o.imzali: yüklenmiş taramanın yerine imzalı hâl (makette; imza alanında ad + tarih) */
  /* İŞ (HİZMET) SÖZLEŞMESİ — temel format KM-FR-SZL-01 (2026-09-26, reisim: "imzalı sözleşmeyi görüntüleme tuşu göremedim"): imzalı
     tarama makette bu önizlemeyle gösterilir. Firma kendi şablonunu yükleyebilir (§3.7 satır 5). */
  /* SAHA FORMU — temel format KM-FR-SAH-01 (reisim 2026-09-26: "plan tamamlandıktan sonra saha formu oluştur … yapılan ekipmanlar ve
     yapıldığına dair firma onayı için imza yerleri"). Firmaya göre değişen formatlardan (§3.7). o = { p (plan), ekipmanlar[], no, tarih, uzmanlar[] } */
  MB.sahaFormu = function (o) {
    var f = MV.FIRMA, p = o.p, formKod = f.kisa + "-FR-SAH-01";
    var satirlar = o.ekipmanlar.map(function (e, i) { return [String(i + 1), '<span class="a-kod">' + kacis(e.kod) + "</span>", kacis(e.tur.ad), kacis(e.konum)]; });
    return '<article class="a-belge" aria-label="Saha formu önizlemesi">' +
      '<header class="a-belge-bas"><div class="a-belge-logo" role="img" aria-label="Firma logosu yeri">Logo</div>' +
        '<div class="a-belge-kunye"><b>' + kacis(f.ad) + "</b><span>" + kacis(f.adres) + "</span></div></header>" +
      '<div class="a-belge-baslik"><h2>Saha formu</h2><p>' + kacis(p.musteri) + " · " + kacis(p.ad) + "</p></div>" +
      '<dl class="a-bilgi">' + bilgi("Form no", '<span class="a-kod">' + o.no + "</span>") + bilgi("Proje no", '<span class="a-kod">' + p.no + "</span>") +
        bilgi("Tarih", MK.tarihYaz(p.tarih) + (p.bitTarih && p.bitTarih !== p.tarih ? " – " + MK.tarihYaz(p.bitTarih) : "")) +
        bilgi("Adres", kacis(p.adres) + ", " + kacis(p.ilce) + " / " + kacis(p.il), true) + "</dl>" +
      bolum("1", "Kontrolü yapılan ekipmanlar", o.ekipmanlar.length + " ekipman", tablo(["#", "Kod", "Ekipman", "Konum"], satirlar)) +
      bolum("2", "Firma onayı", "", "<p>Yukarıda listelenen ekipmanların periyodik kontrolü tesisimizde yapılmıştır.</p>") +
      '<div class="a-belge-imzalar">' + [["Firma yetkilisi", "Ad soyad · unvan"], ["Muayene uzmanı", o.uzmanlar.join(", ")]].map(function (x) {
        return "<div><b>" + x[0] + "</b><span>" + kacis(x[1]) + '</span><div class="a-belge-imza">Tarih · imza' + (x[0] === "Firma yetkilisi" ? " · kaşe" : "") + "</div></div>";
      }).join("") + "</div>" +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + " · temel format</span></footer></article>";
  };
  MB.isSozlesmesi = function (o) {
    var f = MV.FIRMA, x = o.x, m = MV.musteri(x.m), formKod = f.kisa + "-FR-SZL-01";
    var satirlar = x.tesisler.map(function (tid, i) { var t = MV.tesis(tid); return [String(i + 1), "<b>" + kacis(t.ad) + "</b><br>" + kacis(t.adres || "") + '<br><span class="a-belge-madde">' + kacis([t.ilce, t.il].filter(Boolean).join(" / ")) + "</span>"]; });
    var imza = [["Hizmet veren", f.ad, x.imza.firma], ["Hizmet alan", m.unvan, x.imza.musteri]];
    return '<article class="a-belge" aria-label="İş sözleşmesi önizlemesi">' +
      '<header class="a-belge-bas"><div class="a-belge-logo" role="img" aria-label="Firma logosu yeri">Logo</div>' +
        '<div class="a-belge-kunye"><b>' + kacis(f.ad) + "</b><span>" + kacis(f.adres) + "</span></div></header>" +
      '<div class="a-belge-baslik"><h2>Periyodik kontrol hizmet sözleşmesi</h2><p>İş ekipmanlarının periyodik kontrolü</p></div>' +
      '<dl class="a-bilgi">' + bilgi("Sözleşme no", '<span class="a-kod">' + x.no + "</span>") + bilgi("Süre", MK.tarihYaz(x.baslangic) + " – " + MK.tarihYaz(x.bitis)) +
        bilgi("Hizmet alan", kacis(m.unvan)) + bilgi("Ödeme vadesi", x.vade + " gün") + "</dl>" +
      bolum("1", "Kapsamdaki tesisler", x.tesisler.length + " tesis", tablo(["#", "Tesis"], satirlar)) +
      bolum("2", "Konu ve koşullar", "",
        "<p>Hizmet veren, kapsamdaki tesislerde bulunan iş ekipmanlarının periyodik kontrollerini kabul edilen teklifteki kalem ve fiyatlarla yapar; " +
        "raporlar imzalandıktan sonra hizmet alanın erişimine açılır. Ödeme fatura tarihinden itibaren " + x.vade + " gün içinde yapılır.</p>") +
      '<div class="a-belge-imzalar">' + imza.map(function (y) {
        return "<div><b>" + y[0] + "</b><span>" + kacis(y[1]) + '</span><div class="a-belge-imza' + (y[2] ? " a-belge-imzali" : "") + '">' +
          (y[2] ? MK.tarihYaz(y[2]) + " · imzalı" : "Tarih · imza") + "</div></div>";
      }).join("") + "</div>" +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + " · temel format</span></footer></article>";
  };
  MB.zimmetFormu = function (o) {
    var f = MV.FIRMA, formKod = f.kisa + "-FR-ZMT-01";
    var tur = { cihaz: "Ölçüm cihazı", arac: "Araç", diger: "Diğer" };
    var satirlar = o.varliklar.map(function (v, i) {
      var z = MV.hareketler(v.id)[0];
      /* 4 sütun: 375'te 6 sütun 74 px taşıyordu (2026-09-25) → marka/model adın altında, not tarihin altında */
      return [String(i + 1), '<b>' + kacis(v.plaka || v.env) + "</b><br>" + kacis(v.ad) + '<br><span class="a-belge-madde">' + tur[v.tur] + " · " + kacis([v.marka, v.model].filter(Boolean).join(" ")) + "</span>",
        v.seri ? '<span class="a-kod">' + v.seri + "</span>" : v.plaka ? kacis(v.plaka) : "—",
        MK.tarihYaz(z.tarih) + (v.tur === "cihaz" ? '<br><span class="a-belge-madde">kalibrasyon ' + MK.tarihYaz(v.bitis) + "</span>" : v.tur === "arac" ? '<br><span class="a-belge-madde">km teslimde yazılır</span>' : "")];
    });
    return '<article class="a-belge" aria-label="Zimmet teslim formu önizlemesi">' +
      '<header class="a-belge-bas"><div class="a-belge-logo" role="img" aria-label="Firma logosu yeri">Logo</div>' +
        '<div class="a-belge-kunye"><b>' + kacis(f.ad) + "</b><span>" + kacis(f.adres) + "</span></div></header>" +
      '<div class="a-belge-baslik"><h2>Zimmet teslim formu</h2><p>Personele teslim edilen ölçüm cihazı, araç ve diğer iş varlıkları</p></div>' +
      '<dl class="a-bilgi">' + bilgi("Form no", '<span class="a-kod">' + o.no + "</span>") + bilgi("Tarih", MK.tarihYaz(o.tarih)) +
        bilgi("Teslim alan", kacis(o.p.ad) + '<span class="a-alt-satir">' + kacis(MV.meslekAd(o.p)) + "</span>") +
        bilgi("Teslim eden", kacis(o.eden.ad) + '<span class="a-alt-satir">firma adına</span>') + "</dl>" +
      bolum("1", "Zimmetlenen varlıklar", o.varliklar.length + " kalem",
        tablo(["#", "Varlık", "Seri no / plaka", "Teslim"], satirlar)) +
      bolum("2", "Taahhüt", "",
        '<p>Yukarıda listelenen varlıkları eksiksiz ve çalışır durumda teslim aldım. Özenle ve yalnız işim için kullanacağımı; kayıp, hasar ya da ' +
        'arızayı gecikmeden bildireceğimi; işten ayrılışımda ya da istendiğinde eksiksiz iade edeceğimi kabul ederim.</p>') +
      '<div class="a-belge-imzalar">' + [["Teslim eden", o.eden], ["Teslim alan", o.p]].map(function (x) {
        return "<div><b>" + x[0] + "</b><span>" + kacis(x[1].ad) + '</span><div class="a-belge-imza' + (o.imzali ? " a-belge-imzali" : "") + '">' +
          (o.imzali ? kacis(x[1].ad) + " · " + MK.tarihYaz(o.tarih) + " · imzalı" : "Tarih · imza") + "</div></div>";
      }).join("") + "</div>" +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + " · temel format</span></footer></article>";
  };

})();
