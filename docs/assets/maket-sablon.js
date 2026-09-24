/* ══ probata MAKET M7 — Rapor şablonu önizlemesi (modül 6, kodda) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════
   Kaynak: pkproje.md §3 (reisim 2026-09-22: şablon firma × ekipman türü başına KODDA; "site üzerinden değil, kod ile manuel her firma
   için ayrı ayrı"; gerekmeyen bölüm boş kalabilir), §4.2 (Ek-III 1.7 bölümleri, 1.7.1 birebir), §4.8 (Bakanlık formatı: şeklen ve
   içerik olarak eksiksiz; akredite kuruluş logosu + ticari ad + TÜRKAK markası), §3.2 madde 1 (rapor zinciri; rapor şablon sürümünü
   saklar). İki görünüm: "Şablon" (her alan ve nereden dolduğu) · "Örnek rapor" (uydurma kayıtlarla dolu). PDF'in kendisi sunucuda
   üretilir (§8.3); bu sayfa onun iskeletidir, ekran genişliğine göre akar. Düzenleyici YOK. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, rozet = MK.rozet, bilgi = MK.bilgi;
  var FORMAT = { zorunlu: "Bakanlık formatı (zorunlu)", taslak: "Bakanlık formatı taslak — firma formatı" };
  /* kriter ve test listesi ortak veriden (MV.KRITER, MV.TESTLER; M8 saha raporuyla tek kaynak) */
  var kaynak = function (k) { return '<span class="a-belge-kaynak">' + ikon("arrow-left", "a-ikon-kucuk") + k + "</span>"; };
  var bos = '<span class="a-deger-yok">—</span>';

  function rota() {
    var m = /^#\/([A-Z]{2,3})(\/ornek)?$/.exec(location.hash);
    var ilk = MV.KATALOG.filter(function (t) { return t.sablon; })[0].k;
    return { tur: m && MV.tur(m[1]) ? m[1] : ilk, ornek: !!(m && m[2]) };
  }
  /* örnek rapor: BUGÜN bu şablon sürümüyle yazılsaydı — türün ilk kayıtlı ekipmanı, tesisi, güncel İSG-KATİP kaydı, geçen yılki
     inspector'ı ve onun zimmetindeki bu gruba uygun cihazlar; sonuç geçen yılki sonucun benzeri. Rapor no örnek (sunucu verir). */
  function ornekVeri(t) {
    var e = MV.EKIPMAN.filter(function (x) { return x.tur === t.k && x.onceki; })[0];
    if (!e) return null;
    var ts = MV.tesis(e.tesis), m = MV.musteri(ts.m), p = MV.kisi(e.onceki.kisi), isg = MV.isgTesis(ts.id).filter(function (x) { return x.k === p.id; })[0];
    var cihaz = MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz" && MV.kimde(v.id) === p.id && MV.cihazTuru(v.cihazTur).g.indexOf(t.g) >= 0; });
    var s = new Date(MK.BUGUN + "T12:00:00"); s.setMonth(s.getMonth() + t.periyot);
    return { e: e, ts: ts, m: m, p: p, isg: isg, cihaz: cihaz, tarih: MK.BUGUN, sonraki: s.toISOString().slice(0, 10), no: MV.raporNo("0926", 900 + MV.KATALOG.indexOf(t)) };
  }
  function belge(t, o) {
    var f = MV.FIRMA, std = t.std.map(MV.standart), zorunlu = MV.kusurSinifli(t), grup = MV.grup(t.g);
    var d = function (deger, kay) { return o ? deger : bos + kaynak(kay); };
    var sonraki = o ? o.sonraki : null, hafif = o && /Hafif/.test(o.e.onceki.sonuc), kusurlu = o && /^Kusurlu/.test(o.e.onceki.sonuc);
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
        bilgi("Form", '<span class="a-kod">' + formKod + "</span>" + (zorunlu ? '<span class="a-alt-satir">' + FORMAT.zorunlu + "</span>" : "")) +
        bilgi("Şablon sürümü", kacis(t.sablon)) + bilgi("Sayfa", "1 / 2") + "</dl>" +
      bolum("1", "Genel bilgiler", "Ek-III 1.7.1", '<dl class="a-bilgi">' +
        bilgi("İşyeri ünvanı", d(o && kacis(o.m.unvan), "müşteri kaydı"), true) +
        bilgi("SGK işyeri sicil no", d(o && '<span class="a-kod a-kod-uzun">' + o.ts.sgk + "</span>", "tesis kaydı"), "cift") +
        bilgi("Adres", d(o && kacis(o.ts.adres + ", " + o.ts.ilce + " / " + o.ts.il), "tesis kaydı"), true) +
        bilgi("Sözleşme no (İSG-KATİP)", d(o && (o.isg ? '<span class="a-kod">' + o.isg.no + "</span>" : '<span class="a-uyari-metin">Kayıt yok</span>'), "İSG-KATİP kaydı")) +
        bilgi("Başlangıç", d(o && MK.tarihYaz(o.tarih) + " 09:12", "saha: denetime başla")) +
        bilgi("Bitiş", d(o && MK.tarihYaz(o.tarih) + " 09:48", "saha: rapor tamam")) +
        bilgi("Sonraki kontrol", d(o && sonraki && MK.tarihYaz(sonraki), "kontrol + tür periyodu (" + t.periyot + " ay)")) +
        bilgi("Rapor tarihi", d(o && MK.tarihYaz(o.tarih), "son imza")) +
        bilgi("Kontrol metodu", o ? (std.length ? kacis(std[0].no + ":" + std[0].surum + " — " + std[0].konu) : "Üretici talimatı") :
          bos + kaynak(std.length ? "türün standartlarından seçilir: " + std.map(function (s) { return s.no; }).join(", ") : "standart yok → üretici talimatı / risk değerlendirmesi"), true) + "</dl>") +
      bolum("2", "Ekipman bilgileri", "Ek-III 1.7.2", '<dl class="a-bilgi">' +
        bilgi("Ekipman", d(o && kacis(t.ad), "ekipman türü")) + bilgi("Kod", d(o && '<span class="a-kod">' + o.e.kod + "</span>", "ekipman kaydı")) +
        bilgi("Marka / model", d(o && kacis(o.e.marka + " " + o.e.model), "ekipman etiketi")) + bilgi("İmal yılı", d(o && o.e.imal, "ekipman etiketi")) +
        bilgi("Seri no", d(o && '<span class="a-kod">' + o.e.seri + "</span>", "ekipman etiketi")) + bilgi("Kullanım yeri", d(o && kacis(o.e.konum), "ekipman konumu")) +
        bilgi("Kullanım amacı", d(o && "Üretim ve sevkiyat", "saha")) + "</dl>") +
      bolum("3", "Test değerleri", "Ek-III 1.7.3", tablo(["Ölçüm", "Değer", "Sınır"], test.map(function (x) { return [x.ad, o ? x.ornek + " " + x.birim : bos, MV.sinirYaz(x)]; }), o ? "" : "saha: inspector ölçer")) +
      bolum("4", "Ölçüm aletleri", "Ek-III 1.7.4", o ? tablo(["Cihaz", "Seri no", "Kalibrasyon geçerlilik"], o.cihaz.length ? o.cihaz.map(function (v) { return [kacis(v.ad + " " + v.env), '<span class="a-kod">' + v.seri + "</span>", MK.tarihYaz(v.bitis)]; }) : [[bos, bos, bos]])
        : '<p class="a-bolum-aciklama">' + kaynak("inspector'ın zimmetindeki, bu grup için uygun cihazlar otomatik gelir (seçilmez)") + "</p>") +
      bolum("5", "Muayene kriterleri ve testler", "Ek-III 1.7.5", tablo(["No", "Kriter", "Yapıldı", "Sonuç"], kriter.map(function (k, i) {
        return [String(i + 1), kacis(k), o ? "Yapıldı" : '<span class="a-belge-kutu"></span>Yapıldı · yapılmadı · uygulanamaz', o ? (hafif && i === 2 ? hafifAd : kusurlu && i === 1 ? agirAd : "Uygun") : bos];
      }), o ? "" : "saha: her madde ayrı, fiilen yapıldığı kayda geçer (14/A-1-ç)")) +
      bolum("6", "Kusur açıklamaları", "Ek-III 1.7.6", o ? (hafif || kusurlu ? "<p>" + (hafif ? hafifAd + ": madde 3'te okunabilirliği azaltan hasar." + (zorunlu ? " Sonraki kontrole kadar giderilmeli." : "") : agirAd + ": madde 2'de izin verilen sınırın üstünde aşınma. Giderilene kadar kullanılamaz.") + "</p>" : '<p class="a-deger-yok">Kusur yok.</p>')
        : '<p class="a-bolum-aciklama">' + (zorunlu ? "Her kusur ayrı yazılır; sınıf <b>hafif</b> ya da <b>ağır</b> (format yürürlükte, Ek-III 1.9.1)." : "Her kusur ayrı yazılır; bu türde Bakanlık formatı yürürlükte değil, hafif / ağır sınıflandırması yapılmaz.") + "</p>") +
      bolum("7", "Notlar", "Ek-III 1.7.7", '<p class="a-bolum-aciklama">Uygunsuzluk bu bölüme yazılamaz.</p>') +
      bolum("8", "Sonuç ve kanaat", "Ek-III 1.7.8", '<p class="a-belge-secenek"><span class="a-belge-kutu' + (o && !kusurlu ? " a-belge-kutu-dolu" : "") + '"></span>Kullanılabilir</p>' +
        '<p class="a-belge-secenek"><span class="a-belge-kutu' + (kusurlu ? " a-belge-kutu-dolu" : "") + '"></span>Kusur giderilene kadar kullanılamaz</p>') +
      bolum("9", "Yetkili kişi", "Ek-III 1.7.9", '<dl class="a-bilgi">' +
        bilgi("Ad soyad", d(o && kacis(o.p.ad), "personel")) + bilgi("Meslek", d(o && kacis(MV.meslekAd(o.p)), "personel")) +
        bilgi("Diploma no", d(o && '<span class="a-kod">' + o.p.diploma + "</span>", "personel")) + bilgi("Oda sicil no", d(o && (o.p.oda ? '<span class="a-kod">' + o.p.oda + "</span>" : bos), "personel")) +
        bilgi("EKİPNET kayıt no", d(o && '<span class="a-kod">' + o.p.ekipnet + "</span>", "personel")) + bilgi("Nüsha sayısı", f.nusha + (o ? "" : kaynak("firma ayarı"))) + "</dl>" +
        '<div class="a-belge-imza">' + (o ? "Güvenli elektronik imza · " + kacis(o.p.ad) + " · " + MK.tarihYaz(o.tarih) : "İmza · yöntem firma ayarı (5070 e-imza ya da ıslak imza + tarama). İmzasız rapor geçersiz.") + "</div>") +
      bolum("Ek", "Fotoğraflar", "rapor başına en az 1", '<div class="a-fotolar">' + [1, 2].map(function (i) { return '<span class="a-foto" role="img" aria-label="Fotoğraf ' + i + '">' + ikon("camera") + '<span class="a-foto-no">' + i + "</span></span>"; }).join("") + "</div>") +
      '<footer class="a-belge-alt"><span>' + kacis(f.ad) + " · " + formKod + "</span><span>Sayfa 1 / 2</span></footer></article>";
  }
  function bolum(no, baslik, madde, ic) { return '<section class="a-belge-bolum"><h3><span>' + no + " · " + baslik + '</span><span class="a-belge-madde">' + madde + "</span></h3>" + ic + "</section>"; }
  function tablo(bas, satirlar, kay) {
    return '<table class="a-belge-tablo"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (s) { return "<tr>" + s.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" + (kay ? kaynak(kay) : "");
  }

  function goster(odakla) {
    var r = rota(), t = MV.tur(r.tur), o = r.ornek && t.sablon ? ornekVeri(t) : null;
    var turler = MV.KATALOG.map(function (x) { return [x.k, x.ad, x.sablon ? x.sablon.split(" · ")[0] : "şablon yok"]; });
    $("a-sablon").innerHTML = MK.kirinti([["Ekipman türleri", MK.adres(5, "#/")], [t.ad, MK.adres(5, "#/tur/" + t.k)], ["Rapor şablonu"]]) +
      '<div class="a-sayfa-bas"><h1 tabindex="-1">Rapor şablonu · ' + kacis(t.ad) + "</h1></div>" +
      '<div class="a-form a-bolum-serit">' + MK.alan({ id: "s-tur", etiket: "Ekipman türü", ipucu: "Şablon firma × tür başına; tür değişince önizleme değişir",
        girdi: MK.secim({ id: "s-tur", ad: "Ekipman türü", deger: t.k, secenekler: turler, tanim: "s-tur-ipucu" }) }) + "</div>" +
      (!t.sablon ? '<div class="a-serit-kap a-bolum-serit">' + MK.serit("hata", "circle-x", "Bu tür için rapor şablonu yok: ekipman eklenebilir ama rapor açılamaz. Şablon firma × tür başına kodla eklenir, yazılım sürümüyle gelir.") + "</div>" +
        MK.bos({ ikon: "file-text", baslik: "Şablon yok", metin: kacis(t.ad) + " için önizlenecek şablon yok.", eylem: '<a class="a-tus a-tus-ikincil" href="' + MK.adres(5, "#/tur/" + t.k) + '">' + ikon("arrow-left", "a-ikon-kucuk") + "Tür sayfasına dön</a>" })
      : '<dl class="a-bilgi a-bolum-serit">' + bilgi("Sürüm", kacis(t.sablon.split(" · ")[0])) + bilgi("Yürürlük", kacis(t.sablon.split(" · ")[1])) +
          bilgi("Biçim", t.format ? '<span class="a-kod">' + t.format + "</span> " + rozet(t.formatDurum === "zorunlu" ? { ad: "Zorunlu", rozet: "a-rozet-tamam" } : { ad: "Taslak", rozet: "a-rozet-notr" }) : "Firma formatı · Ek-III 1.7") +
          bilgi("Kontrol metodu standartları", t.std.length ? t.std.map(function (k) { var s = MV.standart(k); return '<a class="a-baglanti" href="' + MK.adres(4, "#/s/" + s.k) + '">' + kacis(s.no) + "</a>"; }).join(" · ") : '<span class="a-uyari-metin">Standart yok</span>', true) + "</dl>" +
        '<div class="a-serit-kap">' + MK.serit("bilgi", "file-text", "Şablon kodda yazılır, site içinde düzenlenmez; değişiklik yeni sürümle gelir. Rapor açıldığı sürümü saklar: eski raporlar kendi sürümüyle açılır.") + "</div>" +
        '<nav class="a-sekmeler a-sekmeler-sayfa" aria-label="Önizleme görünümü"><a class="a-sekme" href="#/' + t.k + '"' + (r.ornek ? "" : ' aria-current="page"') + ">Şablon</a>" +
          '<a class="a-sekme" href="#/' + t.k + '/ornek"' + (r.ornek ? ' aria-current="page"' : "") + ">Örnek rapor</a></nav>" +
        (r.ornek && !o ? MK.bos({ ikon: "file-text", baslik: "Örnek rapor yok", metin: "Bu türde imzalı raporu olan ekipman yok; şablon görünümüne bakın." }) : belge(t, o)));
    document.title = "Rapor şablonu · " + t.ad + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik h1"); if (h) h.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) { if (id === "s-tur") { location.hash = "#/" + deger + (rota().ornek ? "/ornek" : ""); } };
  MK.kabuk({ modul: 5, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  goster(false);
})();
