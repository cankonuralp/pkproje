/* ══ probata MAKET M7 — Rapor şablonu önizlemesi (modül 6, kodda) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═══════════════════
   Kaynak: pkproje.md §3 (reisim 2026-09-22: şablon firma × ekipman türü başına KODDA; "site üzerinden değil, kod ile manuel her firma
   için ayrı ayrı"; gerekmeyen bölüm boş kalabilir), §4.2 (Ek-III 1.7 bölümleri, 1.7.1 birebir), §4.8 (Bakanlık formatı: şeklen ve
   içerik olarak eksiksiz; akredite kuruluş logosu + ticari ad + TÜRKAK markası), §3.2 madde 1 (rapor zinciri; rapor şablon sürümünü
   saklar). İki görünüm: "Şablon" (her alan ve nereden dolduğu) · "Örnek rapor" (uydurma kayıtlarla dolu). PDF'in kendisi sunucuda
   üretilir (§8.3); bu sayfa onun iskeletidir, ekran genişliğine göre akar. Düzenleyici YOK. UYDURMA veri. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, rozet = MK.rozet, bilgi = MK.bilgi;
  /* belge maket-belge.js'ten (MB.belge; M9 onay ve rapor ekranlarıyla tek üretici); kriter ve test listesi ortak veriden */

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
    return { e: e, ts: ts, m: m, p: p, isg: isg, cihaz: cihaz, tarih: MK.BUGUN, sonraki: s.toISOString().slice(0, 10), no: MV.raporNo("0926", 900 + MV.KATALOG.indexOf(t)),
      sonuc: e.onceki.sonuc, imza: { zaman: MK.BUGUN + "T10:05" } };
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
        (r.ornek && !o ? MK.bos({ ikon: "file-text", baslik: "Örnek rapor yok", metin: "Bu türde imzalı raporu olan ekipman yok; şablon görünümüne bakın." }) : MB.belge(t, o)));
    document.title = "Rapor şablonu · " + t.ad + " · probata maket";
    if (odakla) { window.scrollTo(0, 0); var h = document.querySelector("#a-icerik h1"); if (h) h.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.onSecim = function (id, deger) { if (id === "s-tur") { location.hash = "#/" + deger + (rota().ornek ? "/ornek" : ""); } };
  MK.kabuk({ modul: 5, kullanici: { bas: "SY", ad: "Selin Yıldız", rol: "Mekanik yönetici" } });
  goster(false);
})();
