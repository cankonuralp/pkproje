/* ══ probata MAKET — RAPOR BELGESİ, TEK ÜRETİCİ (M7 şablon önizlemesi · M9 onay ekranı, rapor görünümü, PDF) ══════════════════
   Sunucuda üretilen PDF'in iskeleti (§8.3); Ek-III 1.7'nin dokuz bölümü + fotoğraf eki (§4.2), başlıkta firma künyesi ve akreditasyon
   markası yeri (§4.8). MB.belge(tür, o): o yoksa BOŞ ŞABLON (her alanın nereden dolduğu yazılır), varsa dolu rapor —
   o = { e (ekipman), ts (tesis), m (müşteri), p (inspector), isg, cihaz[], tarih, bas, bit, sonraki, no, sonuc ("Uygun" | "Hafif kusurlu" |
   "Kusurlu"), metot (standart kimliği | "uretici" | "risk"), imza: { zaman } | null }. UYDURMA veri. (2026-09-24, M9'da maket-sablon.js'ten taşındı.) */
(function () {
  "use strict";
  var kacis = MK.kacis, ikon = MK.ikon, bilgi = MK.bilgi;
  var kaynak = function (k) { return '<span class="a-belge-kaynak">' + ikon("arrow-left", "a-ikon-kucuk") + k + "</span>"; };
  var bos = '<span class="a-deger-yok">—</span>';
  window.MB = {};
  MB.belge = function (t, o) {
    var f = MV.FIRMA, std = t.std.map(MV.standart), zorunlu = MV.kusurSinifli(t), grup = MV.grup(t.g);
    var d = function (deger, kay) { return o ? deger : bos + kaynak(kay); };
    var sonraki = o ? o.sonraki : null, hafif = o && /Hafif/.test(o.sonuc), kusurlu = o && /^Kusurlu/.test(o.sonuc);
    var metot = o && (o.metot === "uretici" ? "Üretici talimatı" : o.metot === "risk" ? "Risk değerlendirmesi" : MV.standart(o.metot || t.std[0]) ? (function (s) { return s.no + ":" + s.surum + " — " + s.konu; })(MV.standart(o.metot || t.std[0])) : "Üretici talimatı");
    /* hafif / ağır yalnız Bakanlık formatı yürürlükte olan türde (§4.5, Ek-III 1.9.1); öteki türde "Kusurlu" */
    var hafifAd = zorunlu ? "Hafif kusur" : "Kusurlu", agirAd = zorunlu ? "Ağır kusur" : "Kusurlu";
    var kriter = MV.kriterler(t), test = MV.testler(t);
    var formKod = zorunlu ? t.format : f.kisa + "-FR-" + t.k + "-" + t.sablon.split(" · ")[0].slice(1);
    return '<article class="a-belge" aria-label="Rapor önizlemesi">' +
      '<header class="a-belge-bas"><div class="a-belge-logo" role="img" aria-label="Firma logosu yeri">Logo</div>' +
        '<div class="a-belge-kunye"><b>' + kacis(f.ad) + "</b><span>" + kacis(f.adres) + "</span><span>" + kacis(f.eposta) + " · Akreditasyon no <span class=\"a-kod\">" + f.akr + "</span></span></div>" +
        '<div class="a-belge-logo" role="img" aria-label="Akreditasyon markası yeri">Akreditasyon markası</div></header>' +
      '<div class="a-belge-baslik"><h2>Periyodik kontrol raporu</h2><p>' + kacis(t.ad) + " · " + kacis(grup.ad) + "</p></div>" +
      '<dl class="a-bilgi">' + bilgi("Rapor no", o ? '<span class="a-kod">' + o.no + "</span>" : bos + kaynak("sunucu, rapor oluşturulurken")) +
        bilgi("Form", '<span class="a-kod">' + formKod + "</span>") +
        bilgi("Şablon sürümü", kacis(t.sablon)) + bilgi("Sayfa", "1 / 2") + "</dl>" +
      /* 1 · FİRMA BİLGİLERİ — türün rapor formatından bağımsız, her raporda aynı blok (reisim 2026-09-26: "1 genel bilgiler değil firma
         bilgileri olacak formattan bağımsız her rapor için ortak olacak"); değerler müşteri, tesis ve iş sözleşmesinden */
      bolum("1", "Firma bilgileri", '<dl class="a-bilgi">' +
        bilgi("Firma ünvanı", o ? kacis(o.m.unvan) : bos, true) +
        bilgi("Adres", o ? kacis(o.ts.adres + ", " + o.ts.ilce + " / " + o.ts.il) : bos, true) +
        bilgi("SGK tescil no", o ? '<span class="a-kod a-kod-uzun">' + o.ts.sgk + "</span>" : bos, "cift") +
        bilgi("İSG-KATİP sözleşme ID", o ? (o.isg ? '<span class="a-kod">' + o.isg.no + "</span>" : '<span class="a-uyari-metin">Yok</span>') : bos) + "</dl>") +
      bolum("2", "Kontrol bilgileri", '<dl class="a-bilgi">' +
        bilgi("Başlangıç", d(o && MK.tarihYaz(o.tarih) + " " + (o.bas || "09:12"), "saha: rapor açıldı")) +
        bilgi("Bitiş", d(o && MK.tarihYaz(o.tarih) + " " + (o.bit || "09:48"), "saha: onaya gönderildi")) +
        bilgi("Sonraki kontrol", d(o && sonraki && MK.tarihYaz(sonraki), "kontrol + tür periyodu")) +
        bilgi("Rapor tarihi", d(o && MK.tarihYaz(o.tarih), "son imza")) +
        bilgi("Kontrol metodu", o ? kacis(metot) : bos + kaynak(std.length ? "türün standartlarından seçilir" : "üretici talimatı ya da risk değerlendirmesi"), true) + "</dl>") +
      bolum("3", "Ekipman bilgileri", '<dl class="a-bilgi">' +
        bilgi("Ekipman", d(o && kacis(t.ad), "ekipman türü")) + bilgi("Kod", d(o && '<span class="a-kod">' + o.e.kod + "</span>", "ekipman kaydı")) +
        bilgi("Marka / model", d(o && kacis(o.e.marka + " " + o.e.model), "ekipman etiketi")) + bilgi("İmal yılı", d(o && o.e.imal, "ekipman etiketi")) +
        bilgi("Seri no", d(o && '<span class="a-kod">' + o.e.seri + "</span>", "ekipman etiketi")) + bilgi("Kullanım yeri", d(o && kacis(o.e.konum), "ekipman konumu")) +
        bilgi("Kullanım amacı", d(o && "Üretim ve sevkiyat", "saha")) + "</dl>") +
      bolum("4", "Test değerleri", tablo(["Ölçüm", "Değer", "Sınır"], test.map(function (x) { return [x.ad, o ? x.ornek + " " + x.birim : bos, MV.sinirYaz(x)]; }), o ? "" : "saha: inspector ölçer")) +
      bolum("5", "Ölçüm aletleri", o ? tablo(["Cihaz", "Seri no", "Kalibrasyon geçerlilik"], o.cihaz.length ? o.cihaz.map(function (v) { return [kacis(v.ad + " " + v.env), '<span class="a-kod">' + v.seri + "</span>", MK.tarihYaz(v.bitis)]; }) : [[bos, bos, bos]])
        : '<p class="a-bolum-aciklama">' + kaynak("inspector'ın zimmetindeki, bu grup için uygun cihazlar otomatik gelir (seçilmez)") + "</p>") +
      bolum("6", "Muayene kriterleri ve testler", tablo(["No", "Kriter", "Yapıldı", "Sonuç"], kriter.map(function (k, i) {
        return [String(i + 1), kacis(k), o ? "Yapıldı" : '<span class="a-belge-kutu"></span>Yapıldı · yapılmadı · uygulanamaz', o ? (hafif && i === 2 ? hafifAd : kusurlu && i === 1 ? agirAd : "Uygun") : bos];
      }), o ? "" : "saha: her madde ayrı")) +
      bolum("7", "Kusur açıklamaları", o ? (hafif || kusurlu ? "<p>" + (hafif ? hafifAd + ": madde 3'te okunabilirliği azaltan hasar." + (zorunlu ? " Sonraki kontrole kadar giderilmeli." : "") : agirAd + ": madde 2'de izin verilen sınırın üstünde aşınma. Giderilene kadar kullanılamaz.") + "</p>" : '<p class="a-deger-yok">Kusur yok.</p>')
        : '<p class="a-bolum-aciklama">' + (zorunlu ? "Her kusur ayrı yazılır; sınıf hafif ya da ağır." : "Her kusur ayrı yazılır.") + "</p>") +
      bolum("8", "Notlar", '<p class="a-deger-yok">—</p>') +
      bolum("9", "Sonuç ve kanaat", '<p class="a-belge-secenek"><span class="a-belge-kutu' + (o && !kusurlu ? " a-belge-kutu-dolu" : "") + '"></span>Kullanılabilir</p>' +
        '<p class="a-belge-secenek"><span class="a-belge-kutu' + (kusurlu ? " a-belge-kutu-dolu" : "") + '"></span>Kusur giderilene kadar kullanılamaz</p>') +
      bolum("10", "Yetkili kişi", '<dl class="a-bilgi">' +
        bilgi("Ad soyad", d(o && kacis(o.p.ad), "personel")) + bilgi("Meslek", d(o && kacis(MV.meslekAd(o.p)), "personel")) +
        bilgi("Diploma no", d(o && '<span class="a-kod">' + o.p.diploma + "</span>", "personel")) + bilgi("Oda sicil no", d(o && (o.p.oda ? '<span class="a-kod">' + o.p.oda + "</span>" : bos), "personel")) +
        bilgi("EKİPNET kayıt no", d(o && '<span class="a-kod">' + o.p.ekipnet + "</span>", "personel")) + bilgi("Nüsha sayısı", f.nusha + (o ? "" : kaynak("firma ayarı"))) + "</dl>" +
        '<div class="a-belge-imza">' + (!o ? "İmza" : o.imza ? "Güvenli elektronik imza · " + kacis(o.p.ad) + " · " + MK.zamanYaz(o.imza.zaman) : "İmzasız — inspector son imzayı atınca geçerli olur ve müşteriye açılır.") + "</div>") +
      bolum("Ek", "Fotoğraflar", '<div class="a-fotolar">' + [1, 2].map(function (i) { return '<span class="a-foto" role="img" aria-label="Fotoğraf ' + i + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>"; }).join("") + "</div>") +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + "</span><span>Sayfa 1 / 2</span></footer></article>";
  };
  /* bolum(no, başlık, iç) ya da bolum(no, başlık, sağdaki kısa bilgi, iç) — rapor belgesinde madde etiketi yok (2026-09-26) */
  function bolum(no, baslik, ek, ic) {
    if (ic === undefined) { ic = ek; ek = ""; }
    return '<section class="a-belge-bolum"><h3><span>' + no + " · " + baslik + "</span>" + (ek ? '<span class="a-belge-madde">' + ek + "</span>" : "") + "</h3>" + ic + "</section>";
  }
  function tablo(bas, satirlar, kay) {
    return '<table class="a-belge-tablo"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (s) { return "<tr>" + s.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" + (kay ? kaynak(kay) : "");
  }

  /* ── ZİMMET TESLİM FORMU — TEMEL FORMAT (reisim 2026-09-25: "zimmete varlık eklendikten sonra eklenen varlıkların PDF şeklinde
     çıkartılıp imzalanıp taramasının buraya koyulması için bir düzenek kurgula, bunun için temel bir format oluştur; müşteri formatı
     istemese biz müşteri isteği doğrultusunda bunu değiştiririz"). Firmaya göre değişen formatlardan biri (pkproje.md §3.7): firma kendi
     formunu isterse o firmaya özel üretilir, bu varsayılan kalır. o = { p (teslim alan), varliklar[], no, tarih, eden (teslim eden) }. */
  /* o.imzali: yüklenmiş taramanın yerine imzalı hâl (makette; imza alanında ad + tarih) */
  /* İŞ (HİZMET) SÖZLEŞMESİ — temel format KM-FR-SZL-01 (2026-09-26, reisim: "imzalı sözleşmeyi görüntüleme tuşu göremedim"): imzalı
     tarama makette bu önizlemeyle gösterilir. Firma kendi şablonunu yükleyebilir (§3.7 satır 5). */
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
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + " · temel format</span><span>Sayfa 1 / 1</span></footer></article>";
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
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + " · temel format</span><span>Sayfa 1 / 1</span></footer></article>";
  };
})();
