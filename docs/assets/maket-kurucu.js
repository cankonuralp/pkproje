/* ══ probata MAKET — Format kurucu (Ekipman türleri › tür › Format kurucu) · AA10, 2026-10-02 — §8.3 kararı onaylı (reisim: "Tamam yapalım") ══════════════
   Reisim (2026-10-02, §9 kırk sekizinci tur): "Bu söylediklerimi tek bir rapor özelinde değil, tüm raporları bu şekilde kurgulayabileceğim bir
   sistem tasarla ben müşteriye sunduğumda kendi rapor formatını yükleyip istediği gibi şekillendirebilecek kurgulayabileceği bir sistem
   tasarlamamız gerkeli yoksa her rapor format yüklemesinde tek tek benim uğraşmam gerekli." Tasarım: RAPOR-FORMAT.md (üç katman: yapı ·
   kurallar · görünüm; 10 blok; sürüm ve yayın). Bu ekran tasarımın tıklanır maketi: firma formatını kendisi kurar, saha ekranı ve PDF aynı
   tanımdan çizilir. Makette tanım yalnız bu tarayıcıda saklanır; saha raporu ekranı henüz bu tanımdan ÇİZİLMİYOR (motor kod aşamasında).
   Adres: #/tur/<kod>/kurucu[/<bölüm no>]. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, rozet = MK.rozet, X = MK.eylem;
  var BLOK = MV.FORMAT_BLOK;
  var F = null, T = null, SEC = 0;

  function bolumListe() {
    return '<ol class="a-kurucu-bolumler">' + F.bolumler.map(function (b, i) {
      return '<li class="a-kurucu-bolum' + (i === SEC ? " a-kurucu-secili" : "") + '"><a href="#/tur/' + T.k + "/kurucu/" + i + '"' + (i === SEC ? ' aria-current="true"' : "") + ">" +
          ikon(BLOK[b.blok].ikon, "a-ikon-kucuk") + '<span class="a-kurucu-bolum-ad"><b>' + (i + 1) + " · " + kacis(b.ad) + '</b><span class="a-alt-satir">' + BLOK[b.blok].ad +
          (b.kilit ? " · Bakanlık alanı" : "") + "</span></span></a>" +
        '<span class="a-kurucu-sira">' +
          '<button class="a-ikon-tus" type="button" data-eylem="kb-yukari" data-i="' + i + '" aria-label="' + kacis(b.ad) + ' yukarı"' + (i ? "" : " disabled") + ">" + ikon("arrow-up", "a-ikon-kucuk") + "</button>" +
          '<button class="a-ikon-tus" type="button" data-eylem="kb-asagi" data-i="' + i + '" aria-label="' + kacis(b.ad) + ' aşağı"' + (i < F.bolumler.length - 1 ? "" : " disabled") + ">" + ikon("arrow-down", "a-ikon-kucuk") + "</button></span></li>";
    }).join("") + "</ol>" +
      '<div class="a-secici a-kurucu-ekle"><button class="a-tus a-tus-ikincil" type="button" data-secici-ac="kb-ekle" aria-haspopup="menu" aria-expanded="false">' + ikon("plus", "a-ikon-kucuk") + "Bölüm ekle</button>" +
      '<div class="a-secici-liste" role="menu" aria-label="Bölüm türü" hidden>' + Object.keys(BLOK).map(function (k) {
        return '<button class="a-secenek" type="button" role="menuitem" data-eylem="kb-ekle" data-blok="' + k + '">' + ikon(BLOK[k].ikon, "a-ikon-kucuk") + "<span>" + BLOK[k].ad + "</span></button>";
      }).join("") + "</div></div>";
  }

  /* seçili bölümün düzenleyicisi — bloğa göre */
  function duzenleyici() {
    var b = F.bolumler[SEC]; if (!b) return '<p class="a-bos-satir">Bölüm yok; soldan ekleyin.</p>';
    var ust = '<div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-kb-baslik" tabindex="-1">' + (SEC + 1) + " · " + kacis(b.ad) + "</h2>" +
      (b.kilit ? rozet({ ad: "Bakanlık alanı · silinemez", rozet: "a-rozet-notr" }) : MK.tus({ eylem: "kb-sil", ad: "Bölümü sil", ikon: "trash-2", sinif: "a-tus-ikincil a-bolum-tus" })) + "</div>" +
      '<div class="a-form">' + MK.alan({ id: "kb-ad", etiket: "Bölüm adı", zorunlu: true, genis: true, girdi: MK.girdi({ id: "kb-ad", alan: "ad", deger: b.ad, ek: ' maxlength="80"' }) }) + "</div>";
    var ic = "";
    if (b.blok === "bilgi") ic = satirlar("Alanlar", b.alanlar, function (a, i) {
      return '<span class="a-kurucu-oge-ad">' + kacis(a.ad) + '</span><span class="a-alt-satir">' + MV.ALAN_TUR[a.tur] + (a.kaynak ? " · kayıttan (" + kacis(a.kaynak) + ")" : "") + "</span>";
    }, "Alan ekle", "kb-alan-ekle", true);
    else if (b.blok === "liste") ic = '<p class="a-kurucu-not">Cevap seti: <b>' + b.cevap.join(" · ") + "</b> · madde başına açıklama ve referans standart (raporda (i) penceresi)</p>" +
      satirlar("Maddeler", b.maddeler, function (m) { return '<span class="a-kurucu-oge-ad">' + kacis(m.no ? m.no + " " + m.metin : m.metin) + "</span>" + (m.std ? '<span class="a-alt-satir">' + kacis(m.std) + "</span>" : ""); }, "Madde ekle", "kb-madde-ekle", true);
    else if (b.blok === "olcum" || b.blok === "test") ic = satirlar(b.blok === "olcum" ? "Sütunlar" : "Değerler", b.sutunlar, function (s) {
      return '<span class="a-kurucu-oge-ad">' + kacis(s.ad) + (s.birim ? " (" + kacis(s.birim) + ")" : "") + '</span><span class="a-alt-satir">' + (s.kural ? "sınır: " + kacis(s.kural) + " → kendiliğinden Uygun / Uygun değil" : "sınır yok") + "</span>";
    }, b.blok === "olcum" ? "Sütun ekle" : "Değer ekle", "kb-sutun-ekle", true);
    else if (b.blok === "foto") ic = '<div class="a-form">' + MK.alan({ id: "kb-enaz", etiket: "En az fotoğraf", girdi: MK.girdi({ id: "kb-enaz", alan: "enaz", deger: String(b.enaz), sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="2"' }) }) +
      MK.alan({ id: "kb-encok", etiket: "En çok fotoğraf", girdi: MK.girdi({ id: "kb-encok", alan: "encok", deger: String(b.encok), sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="2"' }) }) + "</div>";
    else ic = '<p class="a-kurucu-not">' + BLOK[b.blok].aciklama + "</p>";
    return ust + ic;
  }
  function satirlar(baslik, l, ciz, ekle, eylem, silinir) {
    return '<p class="a-etiket">' + baslik + " (" + l.length + ")</p>" + (l.length ? '<ul class="a-kurucu-ogeler">' + l.map(function (x, i) {
      return "<li><span class=\"a-kurucu-oge\">" + ciz(x, i) + "</span>" + (silinir && !x.kilit ? '<button class="a-ikon-tus" type="button" data-eylem="kb-oge-sil" data-i="' + i + '" aria-label="' + kacis(x.ad || x.metin) + ' sil">' + ikon("x", "a-ikon-kucuk") + "</button>" : "") + "</li>";
    }).join("") + "</ul>" : '<p class="a-bos-satir">Henüz yok.</p>') +
      '<div class="a-kurucu-ekle-satir"><input class="a-girdi" id="kb-yeni" autocomplete="off" aria-label="' + kacis(ekle) + '" maxlength="120">' + MK.tus({ eylem: eylem, ad: ekle, ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>";
  }

  /* kurallar (format başına) — AA9'un iki kararı burada AÇ / KAPA olur, başlangıçta kapalı */
  function kurallar() {
    var k = F.kurallar, kutu = function (ad, metin, alt) {
      return '<label class="a-onay-kutusu"><input type="checkbox" data-kural="' + ad + '"' + (k[ad] ? " checked" : "") + "><span>" + metin + (alt ? '<span class="a-alt-satir">' + alt + "</span>" : "") + "</span></label>";
    };
    return '<section class="a-bolum a-kurucu-kurallar" aria-labelledby="a-kb-kural"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-kb-kural">Kurallar</h2></div>' +
      kutu("foto", "“Uygun değil” maddede fotoğraf zorunlu", "kapalıyken fotoğraf isteğe bağlı") +
      kutu("derece", "Kusur derecesi sorulsun (hafif / ağır)", "açıksa hafif kusur devri çalışır") +
      kutu("oneri", "Sonuç önerisi", "Uygun değil madde ya da sınır dışı ölçüm varsa sonuç “Uygun değil” önerilir") + "</section>";
  }

  /* canlı önizleme: saha ekranı (bölüm başlıkları ve ilk maddeler) — PDF önizlemesi tuşla */
  function onizleme() {
    return '<section class="a-bolum a-kurucu-onizle" aria-labelledby="a-kb-onizle"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-kb-onizle">Saha ekranı önizlemesi</h2></div>' +
      '<ol class="a-kurucu-saha">' + F.bolumler.map(function (b, i) {
        var alt = b.blok === "bilgi" ? b.alanlar.slice(0, 3).map(function (a) { return a.ad; }) : b.blok === "liste" ? b.maddeler.slice(0, 2).map(function (m) { return m.metin; }) :
          b.blok === "olcum" || b.blok === "test" ? b.sutunlar.map(function (s) { return s.ad; }) : [];
        return '<li><b>' + (i + 1) + " · " + kacis(b.ad) + "</b>" + (alt.length ? '<span class="a-alt-satir">' + kacis(alt.join(" · ")) + (b.blok === "liste" && b.maddeler.length > 2 ? " … +" + (b.maddeler.length - 2) : "") + "</span>" : "") + "</li>";
      }).join("") + "</ol></section>";
  }

  /* yayın öncesi denetim: boş bölüm, sınırı olmayan ölçüm sütunu, maddesiz liste */
  function denetim() {
    var l = [];
    F.bolumler.forEach(function (b, i) {
      var ad = (i + 1) + " · " + b.ad;
      if (b.blok === "liste" && !b.maddeler.length) l.push(ad + ": madde yok");
      if (b.blok === "bilgi" && !b.alanlar.length) l.push(ad + ": alan yok");
      if ((b.blok === "olcum" || b.blok === "test") && b.sutunlar.some(function (s) { return s.giris && !s.kural; })) l.push(ad + ": sınırı olmayan değer var (sonuç kendiliğinden hesaplanmaz)");
    });
    return l;
  }

  MK.kurucuCiz = function (t, sec) {
    T = t; F = MV.formatTanim(t); SEC = Math.max(0, Math.min(sec || 0, F.bolumler.length - 1));
    var d = denetim();
    $("a-nesne").innerHTML = MK.kirinti([["Ekipman türleri · " + MV.bransAd(t.b), t.b === "e" ? "#/elektrik" : "#/"], [t.ad, "#/tur/" + t.k], ["Format kurucu"]]) +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">Format kurucu · ' + kacis(t.ad) + "</h1>" +
        rozet(F.taslak ? { ad: "Taslak · v" + (F.surum + 1), rozet: "a-rozet-bekliyor" } : { ad: "Yayında · v" + F.surum, rozet: "a-rozet-tamam" }) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("layout-list", "a-ikon-kucuk") + "<span>" + F.bolumler.length + " bölüm · " + (t.format ? "Bakanlık formatı " + t.format + " (zorunlu alanlar kilitli)" : "firma formatı") + "</span></p></div>" +
        '<div class="a-eylem-cubugu">' + MK.tus({ eylem: "kb-pdf", ad: "PDF önizle", ikon: "file-text", sinif: "a-tus-ikincil" }) +
          MK.tus({ eylem: "kb-yayinla", ad: "Yayınla", ikon: "upload", kapali: !F.taslak, sebepId: F.taslak ? "" : "kb-yayin-sebep" }) + "</div></div>" +
      '<div class="a-serit-kap">' + MK.serit("bilgi", "info", "Firma formatını kendisi kurar; saha ekranı ve PDF bu tanımdan çizilir. Açık raporlar başladıkları sürümle kalır, yeni raporlar yayındaki sürümle açılır.") +
        (F.taslak && d.length ? MK.serit("uyari", "triangle-alert", "Yayından önce bakılacak: " + d.map(kacis).join(" · ")) : "") +
        (F.taslak ? "" : '<p class="a-gizli" id="kb-yayin-sebep">Değişiklik yok; yayındaki sürüm güncel.</p>') + "</div>" +
      '<div class="a-kurucu">' +
        '<nav class="a-kurucu-sol" aria-label="Bölümler">' + bolumListe() + "</nav>" +
        '<section class="a-bolum a-kurucu-orta" aria-labelledby="a-kb-baslik">' + duzenleyici() + "</section>" +
        '<div class="a-kurucu-sag">' + kurallar() + onizleme() + "</div>" +
      "</div>";
  };

  var degisti = function () { F.taslak = true; MV.FORMAT_TANIM = Object.assign({}, MV.FORMAT_TANIM); history.replaceState(null, "", "#/tur/" + T.k + "/kurucu/" + SEC); MK.kurucuCiz(T, SEC); };
  var odakla = function (q) { var e = document.querySelector(q); if (e) e.focus(); };
  X["kb-yukari"] = function (el) { var i = +el.dataset.i, l = F.bolumler; l.splice(i - 1, 0, l.splice(i, 1)[0]); SEC = i - 1; degisti(); odakla('[data-eylem="kb-yukari"][data-i="' + (i - 1) + '"]:not([disabled]), [data-eylem="kb-asagi"][data-i="' + (i - 1) + '"]'); };
  X["kb-asagi"] = function (el) { var i = +el.dataset.i, l = F.bolumler; l.splice(i + 1, 0, l.splice(i, 1)[0]); SEC = i + 1; degisti(); odakla('[data-eylem="kb-asagi"][data-i="' + (i + 1) + '"]:not([disabled]), [data-eylem="kb-yukari"][data-i="' + (i + 1) + '"]'); };
  X["kb-ekle"] = function (el) {
    var k = el.dataset.blok, b = MV.formatBlokYeni(k); F.bolumler.push(b); SEC = F.bolumler.length - 1; degisti(); history.replaceState(null, "", "#/tur/" + T.k + "/kurucu/" + SEC);
    odakla("#kb-ad"); MK.bildir(BLOK[k].ad + " bölümü eklendi (taslak).");
  };
  X["kb-sil"] = function () {
    var b = F.bolumler[SEC];
    MK.onayla({ baslik: "Bölüm silinsin mi?", metin: (SEC + 1) + " · " + b.ad + " taslaktan çıkar. Yayınlanana kadar raporlar etkilenmez.", tus: "Sil", tamam: function () {
      F.bolumler.splice(SEC, 1); SEC = Math.max(0, SEC - 1); degisti(); history.replaceState(null, "", "#/tur/" + T.k + "/kurucu/" + SEC); MK.bildir(b.ad + " bölümü silindi (taslak).");
    } });
  };
  var ogeListe = function (b) { return b.blok === "bilgi" ? b.alanlar : b.blok === "liste" ? b.maddeler : b.sutunlar; };
  var yeniOge = function (tur) {
    var v = ($("kb-yeni") || {}).value || ""; v = v.trim();
    if (!v) { MK.bildir("Önce adını yazın."); odakla("#kb-yeni"); return; }
    var b = F.bolumler[SEC];
    ogeListe(b).push(tur === "alan" ? { ad: v, tur: "metin" } : tur === "madde" ? { metin: v } : { ad: v, birim: "", giris: true, kural: "" });
    degisti(); odakla("#kb-yeni"); MK.bildir("“" + v + "” eklendi (taslak).");
  };
  X["kb-alan-ekle"] = function () { yeniOge("alan"); };
  X["kb-madde-ekle"] = function () { yeniOge("madde"); };
  X["kb-sutun-ekle"] = function () { yeniOge("sutun"); };
  X["kb-oge-sil"] = function (el) { var l = ogeListe(F.bolumler[SEC]), x = l.splice(+el.dataset.i, 1)[0]; degisti(); odakla("#kb-yeni"); MK.bildir("“" + (x.ad || x.metin) + "” çıkarıldı (taslak)."); };
  X["kb-pdf"] = function () { MK.pdfGoster({ dosya: T.k + "-format-v" + (F.surum + (F.taslak ? 1 : 0)) + ".pdf", baslik: T.ad + " · format " + (F.taslak ? "taslağı" : "v" + F.surum), icerik: MB.formatOnizle(T, F) }); };
  X["kb-yayinla"] = function () {
    var d = denetim();
    MK.onayla({ baslik: "v" + (F.surum + 1) + " yayınlansın mı?", metin: (d.length ? "Bakılacak " + d.length + " konu var (" + d.join(" · ") + "). " : "") + "Yeni raporlar bu sürümle açılır; açık raporlar kendi sürümünde kalır.", tus: "Yayınla", tamam: function () {
      F.surum++; F.taslak = false; F.yayin = MK.simdi(); MV.FORMAT_TANIM = Object.assign({}, MV.FORMAT_TANIM); MK.kurucuCiz(T, SEC); odakla('[data-eylem="kb-pdf"]'); MK.bildir(T.ad + " formatı v" + F.surum + " yayınlandı.");
    } });
  };
  MK.kurucuGirdi = function (e) {
    var t = e.target; if (!F) return false;
    if (t.dataset && t.dataset.kural) { F.kurallar[t.dataset.kural] = t.checked; degisti(); odakla('[data-kural="' + t.dataset.kural + '"]'); MK.bildir(t.checked ? "Kural açıldı (taslak)." : "Kural kapatıldı (taslak)."); return true; }
    if (t.id === "kb-ad") { F.bolumler[SEC].ad = t.value; F.taslak = true; return true; }
    if (t.id === "kb-enaz" || t.id === "kb-encok") { var n = parseInt(t.value, 10); if (n >= 0) { F.bolumler[SEC][t.id === "kb-enaz" ? "enaz" : "encok"] = n; F.taslak = true; } return true; }
    return false;
  };
})();
