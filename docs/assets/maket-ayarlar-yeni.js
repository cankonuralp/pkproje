/* ══ probata MAKET · Firma ayarları — YENİ TASARIM (539, 2026-10-14) — ONAY BEKLİYOR ═════════════════════════════════════════════════
   Reisim 2026-10-14 (canlı ekranın görüntüsüyle): "burası ne ? sadece açıklama var çok saçma bi ekran … raporların ikinci kopyası ekranında açık
   kapalıyı seçince ekran komple kayıyo yani böyle bir tasarım sürdürülebilir değil … raporların ikinci kopyası değil yedek olarak görülmeli çok
   fazla yazı var ve kafa karıştırıcı bu ekranı komple toparla tıklayınca pop-up olarak açılarak seçimler yapılabilen küçük paneller haline çevir
   önce maket sunumu yap".
   EKRAN: konusuna göre gruplanmış KÜÇÜK PANELLER — ad, şu anki değerin tek satırlık özeti, gerekiyorsa durum rozeti. Panele basınca PENCERE açılır;
   seçim orada yapılır, Kaydet / Vazgeç pencerenin altında. Kurallar:
   1. Sayfa kaymaz: pencere sayfanın üstünde açılır; kaydedince yalnız panelin özeti değişir.
   2. Pencerede de kayma yok: seçim yapınca hiçbir şey belirip kaybolmaz — kapalıyken alanlar soluk durur (yerini korur), açılınca kullanılır;
      uyarı satırı hep aynı yerde, yalnız metni değişir.
   3. Yazı az: pencerede en çok bir kısa satır; uzun anlatım "Nasıl …?" başlığının altında, istenince açılır.
   4. "Raporların ikinci kopyası" ayrı bölüm değil: Yedek penceresinde "Ek yedek" (Kapalı · Google Drive · OneDrive).
   5. "Supabase hesabı ve yedek" ikiye ayrıldı: Depolama (hesap, dosya kullanımı) · Yedek (günlük, aylık, ek yedek).
   6. Kaydedilmemiş değişiklikle kapatılırsa sorulur. Geçersiz değer kaydedilmez, alanın altında söylenir; pencere açık kalır.
   Veri ortak uydurma (maket-veri.js); değişiklikler bu tarayıcıda kalır (kalıcı maket). Eski düzen: firma-ayarlari.html. Adres: #/ */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem;
  var F = MV.FIRMA;
  var tlYaz = function (n) { return (+n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  var tlOku = function (v) { var t = String(v).trim().replace(/\s*TL$/i, ""); return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : NaN; };
  var alanAdi = function (e) { var m = /@([^@\s]+)$/.exec(String(e || "").trim().toLocaleLowerCase("tr")); return m ? m[1] : ""; };
  var son4 = function (s) { return "…" + String(s).slice(-4); };
  var kopya = function (o) { return JSON.parse(JSON.stringify(o)); };
  /* değişken yol: "l.2.ad" → T.l[2].ad */
  var yolOku = function (o, yol) { return yol.split(".").reduce(function (x, k) { return x == null ? x : x[k]; }, o); };
  var yolYaz = function (o, yol, v) { var p = yol.split("."), son = p.pop(); p.reduce(function (x, k) { return x[k]; }, o)[son] = v; };

  /* ── ortak parçalar ── */
  var girdi = function (yol, T, H, ek) { return MK.girdi({ id: "pk-" + yol.replace(/\./g, "-"), deger: String(yolOku(T, yol) == null ? "" : yolOku(T, yol)), hata: H[yol], ek: ' data-t="' + yol + '"' + (ek || "") }); };
  var alan = function (yol, etiket, T, H, o) {
    o = o || {};
    return MK.alan({ id: "pk-" + yol.replace(/\./g, "-"), etiket: etiket, genis: o.genis, hata: H[yol], sonuc: o.sonuc, uyari: o.uyari, girdi: girdi(yol, T, H, o.ek) });
  };
  /* kapalıyken soluk (yeri korunur): girdi disabled */
  var kapaliEk = function (kapali) { return kapali ? " disabled" : ""; };
  var SECIM = {};
  var secim = function (yol, etiket, T, H, secenekler, o) {
    o = o || {};
    var id = "pk-" + yol.replace(/\./g, "-"); SECIM[id] = yol;
    var h = MK.secim({ id: id, ad: etiket, deger: String(yolOku(T, yol)), secenekler: secenekler, ipucu: "Seçin", gecersiz: !!H[yol], tanim: id + "-ipucu" });
    if (o.kapali) h = h.replace('<button class="a-girdi a-secim-tus"', '<button disabled class="a-girdi a-secim-tus"');
    return '<div class="a-alan-grup' + (o.genis ? " a-alan-genis" : "") + '"><label class="a-etiket" for="' + id + '">' + etiket + "</label>" + h +
      (H[yol] ? '<p class="a-ipucu a-ipucu-uyari" id="' + id + '-ipucu">' + H[yol] + "</p>" : o.sonuc ? '<p class="a-ipucu" id="' + id + '-ipucu">' + o.sonuc + "</p>" : "") + "</div>";
  };
  /* iki / üç seçenekli seçim (Kapalı · Açık …): yerinde düğmeler, seçilen basılı; seçim yeni alan açmaz */
  var segment = function (yol, etiket, T, secenekler) {
    var id = "pk-" + yol.replace(/\./g, "-");
    return '<p class="a-etiket" id="' + id + '-ad">' + etiket + '</p><div class="a-sekmeler a-pk-segment" role="radiogroup" aria-labelledby="' + id + '-ad">' +
      secenekler.map(function (x) {
        var sec = String(yolOku(T, yol)) === String(x[0]);
        return '<button class="a-sekme" type="button" role="radio" aria-checked="' + sec + '" aria-pressed="' + sec + '" data-eylem="pk-sec" data-t="' + yol + '" data-v="' + kacis(String(x[0])) + '" id="' + id + "-" + kacis(String(x[0])) + '">' + x[1] + "</button>";
      }).join("") + "</div>";
  };
  /* uzun anlatım istenince açılır */
  var yardim = function (baslik, html) { return '<details class="a-pk-yardim"><summary>' + ikon("info", "a-ikon-kucuk") + baslik + "</summary>" + html + "</details>"; };
  var not = function (metin) { return '<p class="a-pk-not">' + metin + "</p>"; };
  var anahtarAlan = function (T, H, ad, ipucu, kapali) {
    if (T.anahtar && !T.degistir) {
      return '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">' + ad + '</p><div class="a-pk-satir"><span class="a-yz-anahtar">' + ikon("key-round", "a-ikon-kucuk") +
        '<span class="a-kod">' + kacis(T.anahtar) + "</span> kayıtlı</span>" +
        MK.tus({ eylem: "pk-anahtar-degistir", ad: "Değiştir", ikon: "pencil", sinif: "a-tus-ikincil", kapali: kapali }) + "</div></div>";
    }
    return alan("yeni", ad, T, H, { genis: true, sonuc: ipucu, ek: ' type="password" spellcheck="false" maxlength="210"' + kapaliEk(kapali) });
  };

  /* ── PANELLER ── */
  var MBELGE = [["ekipnet", "EKİPNET kayıt belgesi"], ["diploma", "Diploma"], ["oda", "Oda kaydı"], ["atama", "Ekipman atama belgesi"],
    ["kimlik", "Kimlik belgesi", true], ["saglik", "Sağlık raporu", true], ["is", "İş sözleşmesi", true], ["diger", "Diğer", true]];
  var ICE_TUR = [["musteri", "Müşteriler ve tesisler"], ["ekipman", "Ekipmanlar"], ["cihaz", "Ölçüm cihazları"], ["personel", "Personel"], ["arac", "Araçlar"]];
  var BULUT = { "": "Kapalı", gdrive: "Google Drive", onedrive: "OneDrive" };
  var yz = function () { var x = F.yz || {}; return { acik: !!x.acik, anahtar: x.anahtar || "", sinir: x.sinir === "" ? "" : x.sinir != null ? String(x.sinir) : "20" }; };
  var posta = function () { var x = F.posta || {}; return { anahtar: x.anahtar || "", alan: x.alan || "", kopya: !!x.kopya }; };
  var ben = function () { return MV.kisi("ad") || MV.PERSONEL[0]; };

  var PANEL = {
    firma: {
      ad: "Firma bilgileri", ikon: "building-2",
      ozet: function () { return (F.ad || "Ticari ad girilmedi") + " · " + (F.nusha || 2) + " nüsha · logo " + (F.logo ? "var" : "yok"); },
      durum: function () { return !F.adres || !F.eposta ? { ad: "Eksik", rozet: "a-rozet-bekliyor" } : null; },
      taslak: function () { return { ad: F.ad || "", adres: F.adres || "", eposta: F.eposta || "", akr: F.akr || "", nusha: String(F.nusha || 2), logo: F.logo || "" }; },
      govde: function (T, H) {
        return not("Rapor başlığında ve belgelerde görünür.") + '<div class="a-form">' +
          alan("ad", "Ticari ad", T, H, { genis: true, ek: ' maxlength="120"' }) +
          alan("adres", "Adres", T, H, { genis: true, ek: ' maxlength="200"', uyari: T.adres.trim() ? "" : "Boş: raporda adres çıkmaz." }) +
          alan("eposta", "Rapor e-postası", T, H, { ek: ' type="email" inputmode="email" maxlength="120"', uyari: T.eposta.trim() ? "" : "Boş: raporda e-posta çıkmaz." }) +
          alan("akr", "Akreditasyon no", T, H, { ek: ' maxlength="20"' }) +
          secim("nusha", "Rapor nüsha sayısı", T, H, [1, 2, 3, 4].map(function (n) { return [String(n), n + " nüsha"]; })) +
          '<div class="a-alan-grup"><p class="a-etiket">Logo</p><div class="a-pk-satir">' +
            (T.logo ? (MK.DOSYA[T.logo] ? '<img class="a-logo-onizle" src="' + MK.DOSYA[T.logo].url + '" alt="Firma logosu">' : '<span class="a-kod">' + kacis(T.logo) + "</span>") +
              MK.tus({ eylem: "pk-logo", ad: "Değiştir", ikon: "upload", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pk-logo-sil", ad: "Kaldır", ikon: "trash-2", sinif: "a-tus-ikincil" })
              : MK.tus({ eylem: "pk-logo", ad: "Logo yükle", ikon: "upload", sinif: "a-tus-ikincil" })) + "</div></div>" +
          "</div>";
      },
      dogrula: function (T, H) { if (T.eposta.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(T.eposta.trim())) H.eposta = "Geçerli bir e-posta yazın."; },
      kaydet: function (T) { F.ad = T.ad.trim(); F.adres = T.adres.trim(); F.eposta = T.eposta.trim(); F.akr = T.akr.trim(); F.nusha = +T.nusha; if (T.logo) F.logo = T.logo; else delete F.logo; return "Firma bilgileri kaydedildi."; }
    },
    kod: {
      ad: "Rapor numarası", ikon: "list-ordered",
      ozet: function () { return MV.firmaKodu() + "-AAYY-SIRA (ör. " + MV.firmaKodu() + "-2610-0001)"; },
      taslak: function () { return { kod: MV.firmaKodu() }; },
      govde: function (T, H) {
        var k = String(T.kod).trim().toLocaleUpperCase("tr");
        return '<div class="a-form">' + alan("kod", "Firma kodu", T, H, { ek: ' maxlength="2" autocapitalize="characters"',
          sonuc: "Yeni rapor: " + kacis(k || "??") + "-2610-0001. Açılmış raporların numarası değişmez." }) + "</div>";
      },
      dogrula: function (T, H) { if (!/^[A-ZÇĞİÖŞÜ]{2}$/.test(String(T.kod).trim().toLocaleUpperCase("tr"))) H.kod = "2 harf olmalı (ör. KM)."; },
      kaydet: function (T) { F.raporKod = String(T.kod).trim().toLocaleUpperCase("tr"); return "Rapor numarası: yeni raporlar " + F.raporKod + " ile başlar."; }
    },
    imza: {
      ad: "İmza yöntemi", ikon: "file-signature",
      ozet: function () { return MV.imzaYontem().ad + " · " + MV.imzaYontem().etiket; },
      taslak: function () { return { imza: MV.imzaYontem().k }; },
      govde: function (T) {
        return not("Raporun son imzası ve iç belgeler bu yöntemle.") + '<div role="radiogroup" aria-label="İmza yöntemi" class="a-pk-secenekler">' + Object.keys(MV.IMZA_YONTEM).map(function (k) {
          var x = MV.IMZA_YONTEM[k];
          return '<label class="a-onay-kutusu"><input type="radio" name="pk-imza" data-t="imza" value="' + k + '"' + (T.imza === k ? " checked" : "") + "><span><b>" + x.ad + '</b><span class="a-alt-satir">' + x.etiket + "</span></span></label>";
        }).join("") + "</div>";
      },
      kaydet: function (T) { F.imza = T.imza; return "İmza yöntemi: " + MV.IMZA_YONTEM[T.imza].ad + "."; }
    },
    belge: {
      ad: "Belge şablonları", ikon: "file-text",
      ozet: function () { return "Ön bilgilendirme: " + (F.onBilgiDosya ? "firma formatı" : "temel format") + " · bordro: " + (F.bordroFormat ? "var" : "yok"); },
      taslak: function () { return { onBilgi: F.onBilgiDosya || "", bordro: F.bordroFormat || "" }; },
      govde: function (T) {
        var satir = function (k, ad, bos) {
          return '<div class="a-pk-belge"><p class="a-etiket">' + ad + '</p><div class="a-pk-satir">' +
            (T[k] ? '<span class="a-kod">' + ikon("file-text", "a-ikon-kucuk") + kacis(T[k]) + "</span>" + MK.tus({ eylem: "pk-belge", ad: "Değiştir", ikon: "upload", sinif: "a-tus-ikincil", veri: { k: k } }) +
                MK.tus({ eylem: "pk-belge-sil", ad: "Kaldır", ikon: "trash-2", sinif: "a-tus-ikincil", veri: { k: k } })
              : '<span class="a-deger-yok">' + bos + "</span>" + MK.tus({ eylem: "pk-belge", ad: "Yükle", ikon: "upload", sinif: "a-tus-ikincil", veri: { k: k } })) + "</div></div>";
        };
        return satir("onBilgi", "Ön bilgilendirme formu", "Temel format (" + MV.firmaKodu() + "-FR-OBF-01)") + satir("bordro", "Bordro formatı", "Yok — bordrolar kişi kişi yüklenir");
      },
      kaydet: function (T) {
        if (T.onBilgi) F.onBilgiDosya = T.onBilgi; else delete F.onBilgiDosya;
        if (T.bordro) F.bordroFormat = T.bordro; else delete F.bordroFormat;
        return "Belge şablonları kaydedildi.";
      }
    },
    mesai: {
      ad: "Mesai takibi", ikon: "clock",
      ozet: function () { var m = MV.mesai(); return m.acik ? "Açık · " + m.normal + " + " + m.mesai + " dk / gün" : "Kapalı"; },
      taslak: function () { var m = MV.mesai(); return { acik: m.acik ? "1" : "0", normal: String(m.normal), mesai: String(m.mesai), yillik: String(m.yillik) }; },
      govde: function (T, H) {
        var kapali = T.acik !== "1", top = (+T.normal || 0) + (+T.mesai || 0), asti = !kapali && top > MV.YASAL.gunlukDk;
        return segment("acik", "Mesai takibi", T, [["0", "Kapalı"], ["1", "Açık"]]) + '<div class="a-form">' +
          alan("normal", "Günlük normal (dk)", T, H, { ek: ' inputmode="numeric" maxlength="4"' + kapaliEk(kapali) }) +
          alan("mesai", "Günlük mesai (dk)", T, H, { ek: ' inputmode="numeric" maxlength="4"' + kapaliEk(kapali) }) +
          alan("yillik", "Yıllık fazla çalışma (saat)", T, H, { ek: ' inputmode="numeric" maxlength="3"' + kapaliEk(kapali) }) + "</div>" +
          /* uyarı satırı hep yerinde (kayma yok): aşınca metni değişir */
          '<p class="a-pk-durum-satir' + (asti ? " a-pk-uyari" : "") + '" id="pk-mesai-durum">' + (asti ? ikon("triangle-alert", "a-ikon-kucuk") + "Günlük toplam " + top + " dk: kanunda en çok 660 dk."
            : "Günlük toplam " + top + " dk (en çok 660). Süre dolunca yeni rapor oluşturulamaz.") + "</p>";
      },
      dogrula: function (T, H) {
        if (T.acik !== "1") return;
        var tam = function (k, en, cok, m) { if (!/^\d{1,4}$/.test(String(T[k]).trim()) || +T[k] < en || +T[k] > cok) H[k] = m; };
        tam("normal", 1, 1440, "1–1440 dk arası."); tam("mesai", 0, 1440, "0–1440 dk arası."); tam("yillik", 0, 270, "Kanunda en çok 270 saat.");
      },
      kaydet: function (T) { F.mesai = { acik: T.acik === "1", normal: +T.normal, mesai: +T.mesai, yillik: +T.yillik }; return T.acik === "1" ? "Mesai takibi açık." : "Mesai takibi kapalı."; }
    },
    esik: {
      ad: "Uyarı eşikleri", ikon: "alarm-clock",
      ozet: function () { return "Kalibrasyon " + MV.esik("kal") + " · tesis " + MV.esik("tesis") + " · eğitim " + MV.esik("egitim") + " gün"; },
      taslak: function () { var t = {}; Object.keys(MV.ESIK).forEach(function (k) { t[k] = String(MV.esik(k)); }); return t; },
      govde: function (T, H) {
        return not("Kaç gün kala uyarılsın.") + '<div class="a-form">' + Object.keys(MV.ESIK).map(function (k) {
          return secim(k, MV.ESIK[k].ad, T, H, MV.ESIK[k].secenek.map(function (g) { return [String(g), g + " gün"]; }));
        }).join("") + "</div>";
      },
      kaydet: function (T) { var e = {}; Object.keys(T).forEach(function (k) { e[k] = +T[k]; }); F.esik = e; return "Uyarı eşikleri kaydedildi."; }
    },
    zimmet: {
      ad: "Zimmet teslim formu", ikon: "package",
      ozet: function () { return "Teslim eden: " + (MV.kisi(MV.zimmetEden()) || { ad: "—" }).ad; },
      taslak: function () { return { eden: MV.zimmetEden() }; },
      govde: function (T, H) {
        return '<div class="a-form">' + secim("eden", "Teslim eden (başlangıç)", T, H, MV.PERSONEL.filter(function (x) { return x.durum === "etkin"; }).map(function (x) { return [x.id, x.ad, MV.meslekAd(x)]; }),
          { genis: true, sonuc: "Formda değiştirilebilir." }) + "</div>";
      },
      kaydet: function (T) { F.zimmetEden = T.eden; return "Zimmet formunda teslim eden: " + MV.kisi(T.eden).ad + "."; }
    },
    mbelge: {
      ad: "Müşteriye açık personel belgeleri", ikon: "id-card",
      ozet: function () { var n = (F.mbelge || ["ekipnet"]).length; return n ? n + " belge türü müşteriye açık" : "Hiçbiri açık değil"; },
      taslak: function () { return { secili: (F.mbelge || ["ekipnet"]).slice() }; },
      govde: function (T) {
        return not("Müşteri panelinde, kontrolü yapan personelin hangi belgeleri görünsün.") + '<fieldset class="a-pk-kutular"><legend class="a-gizli">Belge türleri</legend>' + MBELGE.map(function (x) {
          return '<label class="a-onay-kutusu"><input type="checkbox" data-mbelge="' + x[0] + '"' + (T.secili.indexOf(x[0]) >= 0 ? " checked" : "") + "><span>" + x[1] +
            (x[2] ? '<span class="a-alt-satir">kişisel veri</span>' : "") + "</span></label>";
        }).join("") + "</fieldset>";
      },
      kaydet: function (T) { F.mbelge = T.secili.slice(); return "Müşteriye açık belgeler kaydedildi (" + T.secili.length + " tür)."; }
    },
    fiyat: {
      ad: "Fiyat listesi", ikon: "calculator", genis: true,
      ozet: function () { var bos = MV.KATALOG.filter(function (x) { return !MV.FIYAT[x.k]; }).length; return MV.KATALOG.length + " ekipman türü" + (bos ? " · " + bos + " fiyatsız" : ""); },
      durum: function () { return MV.KATALOG.some(function (x) { return !MV.FIYAT[x.k]; }) ? { ad: "Fiyatsız tür var", rozet: "a-rozet-bekliyor" } : null; },
      taslak: function () { var f = {}; MV.KATALOG.forEach(function (x) { f[x.k] = MV.FIYAT[x.k] ? tlYaz(MV.FIYAT[x.k]) : ""; }); return { f: f }; },
      govde: function (T, H) {
        return not("KDV hariç birim fiyat; yeni teklifler bu listeden dolar.") + '<div class="a-form a-ayar-fiyat">' + MV.KATALOG.map(function (x) {
          return alan("f." + x.k, kacis(x.ad) + " (TL)", T, H, { ek: ' inputmode="decimal" maxlength="12"' });
        }).join("") + "</div>";
      },
      dogrula: function (T, H) { Object.keys(T.f).forEach(function (k) { if (String(T.f[k]).trim() && isNaN(tlOku(T.f[k]))) H["f." + k] = "Tutar, ör. 1.250,00."; }); },
      kaydet: function (T) { Object.keys(T.f).forEach(function (k) { var v = String(T.f[k]).trim(); if (v) MV.FIYAT[k] = tlOku(v); else delete MV.FIYAT[k]; }); return "Fiyat listesi kaydedildi."; }
    },
    sabit: {
      ad: "Sabit giderler", ikon: "receipt", genis: true,
      ozet: function () { return MV.SABIT_GIDER.length + " kalem · aylık " + MV.para(MV.sabitToplam()); },
      taslak: function () { return { l: MV.SABIT_GIDER.map(function (x) { return { k: x.k, ad: x.ad, aylik: tlYaz(x.aylik), not: x.not || "" }; }) }; },
      govde: function (T, H) {
        var top = T.l.reduce(function (n, x) { var v = tlOku(x.aylik); return n + (isNaN(v) ? 0 : v); }, 0);
        return not("Aylık; Muhasebe'nin gelir-gider özetine gider olarak düşer. Toplam " + MV.para(top) + ".") +
          T.l.map(function (x, i) {
            return '<div class="a-kalem a-kalem-sabit">' + alan("l." + i + ".ad", "Gider", T, H, { ek: ' maxlength="60"' }) + alan("l." + i + ".aylik", "Aylık (TL)", T, H, { ek: ' inputmode="decimal" maxlength="12"' }) +
              alan("l." + i + ".not", "Not", T, H, { ek: ' maxlength="80"' }) + MK.tus({ eylem: "pk-sg-sil", ad: "Kaldır", ikon: "x", sinif: "a-tus-ikincil a-kalem-sil", veri: { i: i } }) + "</div>";
          }).join("") + '<div class="a-eylem-cubugu a-eylem-sol a-bolum-serit">' + MK.tus({ eylem: "pk-sg-ekle", ad: "Gider ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>";
      },
      dogrula: function (T, H) { T.l.forEach(function (x, i) { if (!String(x.ad).trim()) H["l." + i + ".ad"] = "Adını yazın."; if (isNaN(tlOku(x.aylik))) H["l." + i + ".aylik"] = "Tutar, ör. 1.250,00."; }); },
      kaydet: function (T) { MV.SABIT_GIDER = T.l.map(function (x) { return { k: x.k, ad: x.ad.trim(), aylik: tlOku(x.aylik), not: x.not.trim() }; }); return "Sabit giderler kaydedildi."; }
    },
    yedek: {
      ad: "Yedek", ikon: "archive",
      ozet: function () { var b = MV.bulut(); return "Günlük + aylık yedek · ek yedek " + (b.saglayici ? BULUT[b.saglayici] : "kapalı"); },
      taslak: function () { var b = MV.bulut(); return { saglayici: b.saglayici, kok: b.kok, duzen: b.duzen, bagli: b.bagli, hesap: b.hesap }; },
      govde: function (T, H) {
        var kapali = !T.saglayici;
        return '<ul class="a-pk-durumlar">' +
            "<li>" + ikon("circle-check", "a-ikon-kucuk a-pk-tamam") + "<span><b>Günlük yedek</b>" + '<span class="a-alt-satir">Her gün kendiliğinden; son 7 güne dönülebilir.</span></span></li>' +
            "<li>" + ikon("circle-check", "a-ikon-kucuk a-pk-tamam") + "<span><b>Aylık arşiv yedeği</b>" + '<span class="a-alt-satir">Her ayın 1\'i; saklama süresi boyunca durur.</span></span></li>' +
          "</ul>" +
          segment("saglayici", "Ek yedek (imzalı raporların bir kopyası)", T, [["", "Kapalı"], ["gdrive", "Google Drive"], ["onedrive", "OneDrive"]]) +
          '<div class="a-form">' +
            alan("kok", "Ana klasör", T, H, { ek: ' maxlength="80"' + kapaliEk(kapali) }) +
            secim("duzen", "Klasör düzeni", T, H, MV.BULUT_DUZEN, { kapali: kapali }) +
          "</div>" +
          /* bağlantı satırı hep yerinde: kapalıyken soluk */
          '<div class="a-pk-satir a-pk-baglanti">' + (T.bagli && !kapali
            ? '<span class="a-pk-bagli">' + ikon("circle-check", "a-ikon-kucuk a-pk-tamam") + "Bağlı: " + kacis(T.hesap) + "</span>" + MK.tus({ eylem: "pk-bulut-kes", ad: "Bağlantıyı kes", ikon: "x", sinif: "a-tus-ikincil" })
            : MK.tus({ eylem: "pk-bulut-bagla", ad: (kapali ? "Hesabı" : BULUT[T.saglayici] + " hesabını") + " bağla", ikon: "log-in", sinif: "a-tus-ikincil", kapali: kapali })) + "</div>" +
          '<p class="a-pk-durum-satir">Google Drive ve OneDrive veriyi Türkiye dışında saklayabilir.</p>';
      },
      kaydet: function (T) {
        F.bulut = Object.assign({}, F.bulut || {}, { saglayici: T.saglayici, kok: String(T.kok).trim() || "probata Raporlar", duzen: T.duzen, bagli: !!T.saglayici && T.bagli, hesap: T.hesap });
        return T.saglayici ? "Ek yedek açık: " + BULUT[T.saglayici] + "." : "Ek yedek kapalı.";
      }
    },
    depolama: {
      ad: "Depolama", ikon: "warehouse", bilgi: true,
      ozet: function () { return "probata deneme projesi · 13 dosya · 4,8 MB"; },
      taslak: function () { return {}; },
      govde: function () {
        return '<dl class="a-bilgi a-pk-bilgi">' + MK.bilgi("Hesap", "probata deneme projesi (Frankfurt)", "tam") + MK.bilgi("Dosyalar", "13 dosya · 4,8 MB") +
            MK.bilgi("Paket", "Supabase Pro · 25 $/ay") + "</dl>" +
          not("Kendi Supabase hesabınız yayına çıkışta bağlanır; fatura doğrudan size gelir.") +
          yardim("Kendi hesabınızı nasıl bağlarsınız?", '<ol class="a-pk-adimlar"><li>“Supabase hesabını bağla”ya basın; Supabase\'in kendi giriş ekranı açılır.</li>' +
            "<li>Supabase hesabınızla girip izin verin (anahtar kopyalanmaz, parola paylaşılmaz).</li>" +
            "<li>probata hesabınızda Frankfurt'ta proje kurar (birkaç dakika).</li><li>Supabase'te Pro paketi ve ödeme yöntemini seçin.</li></ol>");
      }
    },
    saklama: {
      ad: "Rapor saklama süresi", ikon: "history",
      ozet: function () { return MV.saklama().yil + " yıl" + (MV.saklama().yil === 5 ? " (yasal en az)" : ""); },
      taslak: function () { return { yil: String(MV.saklama().yil) }; },
      govde: function (T, H) {
        return '<div class="a-form">' + secim("yil", "Saklama süresi", T, H, [5, 6, 7, 8, 9, 10, 15, 20].map(function (y) { return [String(y), y + " yıl" + (y === 5 ? " (yasal en az)" : "")]; }),
          { sonuc: "Süre dolunca imzalı raporlar silinir; 30 gün önce listelenir." }) + "</div>";
      },
      kaydet: function (T) { F.saklama = { yil: +T.yil }; return "Saklama süresi " + T.yil + " yıl."; }
    },
    yz: {
      ad: "Yapay zekâ", ikon: "sparkles",
      ozet: function () { var z = yz(); return z.acik ? "Açık · Claude Haiku 5.5 · kişi başı " + (z.sinir ? z.sinir + " $ / ay" : "sınırsız") : "Kapalı"; },
      durum: function () { var z = yz(); return z.acik && !z.anahtar ? { ad: "Anahtar yok", rozet: "a-rozet-bekliyor" } : null; },
      taslak: function () { var z = yz(); return { acik: z.acik ? "1" : "0", anahtar: z.anahtar, degistir: false, yeni: "", sinir: z.sinir }; },
      govde: function (T, H) {
        var kapali = T.acik !== "1";
        return segment("acik", "Fotoğraftan okuma ve S.A.Y", T, [["0", "Kapalı"], ["1", "Açık"]]) +
          '<div class="a-form">' +
            '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Model</p><p class="a-pk-deger' + (kapali ? " a-pk-soluk" : "") + '"><b>Claude Haiku 5.5</b>' +
              '<span class="a-alt-satir">1 milyon token: giriş $0,10, çıkış $0,50 · bir okuma ≈ $0,0015</span></p></div>' +
            anahtarAlan(T, H, "Anthropic API anahtarı", "sk-ant- ile başlar; şifreli saklanır, bir daha gösterilmez.", kapali) +
            alan("sinir", "Kişi başı aylık sınır ($)", T, H, { sonuc: "Boş: sınırsız.", ek: ' inputmode="decimal" maxlength="8"' + kapaliEk(kapali) }) +
          "</div>" +
          '<p class="a-pk-durum-satir">Fotoğraf ve maskelenmiş rapor bilgisi Anthropic\'e (ABD) gider.</p>' +
          yardim("Bu ay kim ne kadar kullandı?", '<ul class="a-pk-liste">' + MV.YZ_KULLANIM.map(function (x) {
            var p = MV.kisi(x.k); return "<li><b>" + kacis(p ? p.ad : x.k) + "</b><span>" + x.okuma + " okuma · " + x.mesaj + " mesaj · $" + x.usd.toFixed(2).replace(".", ",") + "</span></li>";
          }).join("") + "</ul>");
      },
      dogrula: function (T, H) {
        if (T.acik !== "1") return;
        var y = String(T.yeni).trim();
        if (y && !/^sk-ant-[A-Za-z0-9_-]{16,200}$/.test(y)) H.yeni = "Geçerli bir Anthropic API anahtarı değil (sk-ant- ile başlar).";
        else if (!y && (!T.anahtar || T.degistir)) H.yeni = "Açmak için anahtarı yapıştırın.";
        if (!/^(\d{1,5}([.,]\d{1,2})?)?$/.test(String(T.sinir).trim())) H.sinir = "Sayı yazın (ör. 20).";
      },
      kaydet: function (T) {
        var y = String(T.yeni).trim();
        F.yz = { acik: T.acik === "1", anahtar: y ? son4(y) : T.anahtar, sinir: String(T.sinir).trim().replace(",", ".") };
        return T.acik === "1" ? "Yapay zekâ açık (Claude Haiku 5.5)." : "Yapay zekâ kapalı.";
      }
    },
    eposta: {
      ad: "E-posta", ikon: "mail",
      ozet: function () { var p = posta(); return p.anahtar && p.alan ? "Bağlı · " + p.alan : "E-postalar sırada bekliyor"; },
      durum: function () { var p = posta(); return p.anahtar && p.alan ? null : { ad: "Bağlı değil", rozet: "a-rozet-bekliyor" }; },
      taslak: function () { var p = posta(); return { anahtar: p.anahtar, degistir: false, yeni: "", alan: p.alan, kopya: p.kopya ? "1" : "0" }; },
      govde: function (T, H) {
        var a = String(T.alan).trim().toLocaleLowerCase("tr"), hazir = !!T.anahtar && !T.degistir && !!a, kisi = ben();
        var kisiler = MV.PERSONEL.filter(function (x) { return x.durum === "etkin" && x.hesap; });
        return not("Kim gönder tuşuna basarsa e-posta onun adresinden gider.") + '<div class="a-form">' +
            anahtarAlan(T, H, "Resend API anahtarı", "re_ ile başlar; şifreli saklanır, bir daha gösterilmez.", false) +
            alan("alan", "Gönderen alan adı", T, H, { sonuc: "Resend'de doğrulanmış alan adı.", ek: ' inputmode="url" spellcheck="false" maxlength="100" placeholder="firmaniz.com.tr"' }) +
          "</div>" +
          segment("kopya", "Gönderene gizli kopya", T, [["0", "Kapalı"], ["1", "Açık"]]) +
          '<div class="a-pk-satir a-pk-baglanti">' + MK.tus({ eylem: "pk-posta-deneme", ad: "Deneme e-postası gönder", ikon: "send", sinif: "a-tus-ikincil", kapali: !hazir }) +
            '<span class="a-alt-inline">' + kacis(kisi.eposta || "") + "</span></div>" +
          yardim("Resend hesabı nasıl açılır?", '<ol class="a-pk-adimlar"><li>resend.com\'da firma adına hesap açın (ayda 3.000 e-postaya kadar ücretsiz).</li>' +
            "<li><b>Domains › Add domain</b>: firmanızın alan adı.</li><li>Resend'in verdiği kayıtları alan adınızın paneline ekleyin; “Verified” olunca hazır.</li>" +
            "<li><b>API Keys › Create API key</b> (Sending access); anahtarı buraya yapıştırın.</li></ol>") +
          yardim("Çalışanların e-postası nereden gider?", '<ul class="a-pk-liste">' + kisiler.map(function (x) {
            var kendi = !!a && alanAdi(x.eposta) === a;
            return "<li><b>" + kacis(x.ad) + "</b><span>" + (kendi ? "kendi adresinden" : "Rapor e-postasından, kişinin adıyla") + "</span></li>";
          }).join("") + "</ul>");
      },
      dogrula: function (T, H) {
        var y = String(T.yeni).trim(), a = String(T.alan).trim().toLocaleLowerCase("tr").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "");
        if (y && !/^re_[A-Za-z0-9_]{16,200}$/.test(y)) H.yeni = "Geçerli bir Resend API anahtarı değil (re_ ile başlar).";
        if (a && !/^(?=.{3,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(a)) H.alan = "Alan adı okunamadı (ör. firmaniz.com.tr).";
      },
      kaydet: function (T) {
        var y = String(T.yeni).trim(), a = String(T.alan).trim().toLocaleLowerCase("tr").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "");
        F.posta = Object.assign({}, F.posta || {}, { anahtar: y ? son4(y) : T.degistir ? "" : T.anahtar, alan: a, kopya: T.kopya === "1" });
        return F.posta.anahtar && a ? "E-posta bağlı: " + a + "." : "E-posta ayarı kaydedildi; anahtar ve alan adı girilince e-postalar gider.";
      }
    },
    ice: {
      ad: "Toplu içe aktarma", ikon: "file-spreadsheet", genis: true, tus: "İçe aktar",
      ozet: function () { return "Excel'den müşteri, ekipman, cihaz, personel, araç"; },
      taslak: function () { return { tur: "musteri", dosya: "" }; },
      govde: function (T, H) {
        return not("Şablonu indirin, doldurun, yükleyin; önce denetlenir, sonra tek seferde eklenir (geri alınabilir).") + '<div class="a-form">' +
            secim("tur", "Ne aktarılacak", T, H, ICE_TUR) +
            '<div class="a-alan-grup"><p class="a-etiket">Dosya</p><div class="a-pk-satir">' + MK.tus({ eylem: "pk-ice-sablon", ad: "Şablonu indir", ikon: "download", sinif: "a-tus-ikincil" }) +
              MK.tus({ eylem: "pk-ice-dosya", ad: T.dosya ? "Başka dosya" : "Dosya seç", ikon: "upload", sinif: "a-tus-ikincil" }) + "</div></div>" +
          "</div>" +
          /* denetim sonucu satırı hep yerinde */
          '<p class="a-pk-durum-satir' + (T.dosya ? "" : " a-pk-soluk") + '">' + (T.dosya ? ikon("circle-check", "a-ikon-kucuk a-pk-tamam") + "<b>" + kacis(T.dosya) + "</b>: 12 satır geçerli, 1 satır hatalı (3. satır: vergi no 10 hane olmalı) — geçerliler eklenir."
            : "Dosya seçilince satırlar burada denetlenir.") + "</p>";
      },
      dogrula: function (T, H) { if (!T.dosya) H.tur = "Önce dosya seçin."; },
      kaydet: function (T) { return ICE_TUR.filter(function (x) { return x[0] === T.tur; })[0][1] + ": 12 kayıt içe aktarıldı; geri alınabilir."; }
    }
  };
  var GRUPLAR = [
    { k: "firma", ad: "Firma", p: ["firma", "kod", "imza", "belge"] },
    { k: "calisma", ad: "Çalışma", p: ["mesai", "esik", "zimmet", "mbelge"] },
    { k: "para", ad: "Fiyat ve gider", p: ["fiyat", "sabit"] },
    { k: "veri", ad: "Veri ve yedek", p: ["yedek", "depolama", "saklama"] },
    { k: "baglanti", ad: "Bağlantılar", p: ["yz", "eposta"] },
    { k: "arac", ad: "Araçlar", p: ["ice"] }
  ];

  /* ── SAYFA: paneller ── */
  function panolarCiz() {
    $("a-panolar").innerHTML = GRUPLAR.map(function (g) {
      return '<section class="a-pg" aria-labelledby="a-pg-' + g.k + '"><h2 class="a-pg-baslik" id="a-pg-' + g.k + '">' + g.ad + '</h2><div class="a-pg-izgara">' +
        g.p.map(function (k) {
          var p = PANEL[k], d = p.durum ? p.durum() : null, oz = p.ozet();
          return '<button class="a-pk" type="button" data-eylem="pk-ac" data-pk="' + k + '" aria-haspopup="dialog" aria-describedby="a-pk-oz-' + k + '">' +
            '<span class="a-pk-ikon">' + ikon(p.ikon) + "</span>" +
            '<span class="a-pk-yazi"><span class="a-pk-ad">' + p.ad + '</span><span class="a-pk-ozet" id="a-pk-oz-' + k + '" title="' + kacis(oz) + '">' + kacis(oz) + "</span></span>" +
            '<span class="a-pk-sag">' + (d ? MK.rozet(d) : "") + ikon("chevron-right", "a-ikon-kucuk") + "</span></button>";
        }).join("") + "</div></section>";
    }).join("");
  }

  /* ── PENCERE ── */
  var P = null;   /* { k, T, H, ilk } */
  function pencere() {
    var d = $("a-pk-pencere");
    if (d) return d;
    d = document.createElement("dialog"); d.className = "a-pencere a-pk-pencere"; d.id = "a-pk-pencere"; d.setAttribute("aria-labelledby", "a-pk-baslik");
    d.innerHTML = '<div class="a-pencere-bas"><h2 id="a-pk-baslik"></h2><button class="a-ikon-tus" type="button" data-eylem="pk-kapat" aria-label="Kapat">' + ikon("x") + "</button></div>" +
      '<div class="a-pencere-govde" id="a-pk-govde"></div><div class="a-pencere-alt" id="a-pk-alt"></div>';
    /* Esc: kaydedilmemiş değişiklik varsa sorulur */
    d.addEventListener("cancel", function (e) { e.preventDefault(); kapat(); });
    document.body.appendChild(d);
    return d;
  }
  var kirli = function () { return !!P && JSON.stringify(P.T) !== P.ilk; };
  function ciz(odakId) {
    var p = PANEL[P.k];
    $("a-pk-baslik").innerHTML = '<span class="a-pk-baslik-ikon">' + ikon(p.ikon) + "</span>" + p.ad;
    $("a-pk-govde").innerHTML = p.govde(P.T, P.H);
    $("a-pk-alt").innerHTML = p.bilgi ? MK.tus({ eylem: "pk-kapat", ad: "Kapat", sinif: "a-tus-ikincil" })
      : MK.tus({ eylem: "pk-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "pk-kaydet", ad: p.tus || "Kaydet", ikon: "check" });
    if (odakId && $(odakId)) $(odakId).focus();
  }
  function ac(k) {
    P = { k: k, T: PANEL[k].taslak(), H: {} }; P.ilk = JSON.stringify(P.T);
    var d = pencere(); d.classList.toggle("a-pencere-form", !!PANEL[k].genis);
    ciz(); d.showModal();
    var ilk = $("a-pk-govde").querySelector("input:not([disabled]), button:not([disabled]), summary");
    (ilk || $("a-pk-alt").querySelector("button")).focus();
  }
  function kapatGercek() {
    var k = P && P.k; P = null; $("a-pk-pencere").close();
    var b = document.querySelector('[data-pk="' + k + '"]'); if (b) b.focus();
  }
  function kapat() {
    if (!kirli()) { kapatGercek(); return; }
    MK.onayla({ baslik: "Değişiklikler kaydedilmedi", metin: "Kapatırsanız bu penceredeki değişiklikler silinir.", tus: "Kapat", tamam: kapatGercek });
  }
  X["pk-ac"] = function (el) { ac(el.dataset.pk); };
  X["pk-kapat"] = function () { kapat(); };
  X["pk-kaydet"] = function () {
    var p = PANEL[P.k]; P.H = {};
    if (p.dogrula) p.dogrula(P.T, P.H);
    if (Object.keys(P.H).length) {
      ciz(); var h = $("a-pk-govde").querySelector('[aria-invalid="true"]') || $("a-pk-govde").querySelector("[data-t]"); if (h) h.focus();
      MK.bildir(p.ad + ": kaydedilmedi; nedeni alanın altında."); return;
    }
    if (!kirli() && !p.tus) { kapatGercek(); MK.bildir(p.ad + ": değişiklik yok."); return; }
    var k = P.k, m = p.kaydet(P.T); if (MK.kaliciYaz) MK.kaliciYaz();
    kapatGercek(); panolarCiz();
    /* odak yeniden çizilen panele (özeti değişti) */
    var b = document.querySelector('[data-pk="' + k + '"]'); if (b) b.focus();
    MK.bildir(m);
  };

  /* seçimler ve yazılanlar taslağa; seçim yeniden çizer (yerinde), yazı çizmez */
  X["pk-sec"] = function (el) { yolYaz(P.T, el.dataset.t, el.dataset.v); delete P.H[el.dataset.t]; ciz(el.id); };
  MK.onSecim = function (id, deger) { if (!P || !SECIM[id]) return; yolYaz(P.T, SECIM[id], deger); delete P.H[SECIM[id]]; ciz(id); };
  document.addEventListener("input", function (e) {
    var t = e.target; if (!P || !t.closest || !t.closest("#a-pk-govde")) return;
    if (t.dataset.t && t.type !== "radio" && t.type !== "checkbox") {
      yolYaz(P.T, t.dataset.t, t.value);
      if (P.k === "mesai" || P.k === "kod" || P.k === "sabit") {   /* toplam / örnek numara yazdıkça: yalnız durum satırı ve ipucu */
        var odak = t.id, s = t.selectionStart; ciz(odak); var y = $(odak); if (y && s != null) { try { y.setSelectionRange(s, s); } catch (x) { /* yok */ } }
      }
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!P || !t.closest || !t.closest("#a-pk-govde")) return;
    if (t.type === "radio" && t.dataset.t) { yolYaz(P.T, t.dataset.t, t.value); return; }
    if (t.dataset.mbelge) { var k = t.dataset.mbelge; P.T.secili = MBELGE.map(function (x) { return x[0]; }).filter(function (x) { return x === k ? t.checked : P.T.secili.indexOf(x) >= 0; }); }
  });
  X["pk-anahtar-degistir"] = function () { P.T.degistir = true; ciz("pk-yeni"); };
  X["pk-logo"] = function () { MK.dosyaSec({ kabul: ".png,.jpg,.jpeg", enCokMB: 2, ornek: "logo.png" }, function (ad) { P.T.logo = ad; ciz(); }); };
  X["pk-logo-sil"] = function () { P.T.logo = ""; ciz(); var b = $("a-pk-govde").querySelector('[data-eylem="pk-logo"]'); if (b) b.focus(); };
  X["pk-belge"] = function (el) {
    var k = el.dataset.k;
    MK.dosyaSec({ kabul: k === "bordro" ? ".pdf,.xlsx" : ".pdf", enCokMB: 10, ornek: k === "bordro" ? "bordro-formati.pdf" : "on-bilgilendirme-formu.pdf" }, function (ad) { P.T[k] = ad; ciz(); });
  };
  X["pk-belge-sil"] = function (el) { P.T[el.dataset.k] = ""; ciz(); };
  X["pk-sg-ekle"] = function () { var n = 1; while (P.T.l.some(function (x) { return x.k === "sg" + n; })) n++; P.T.l.push({ k: "sg" + n, ad: "", aylik: "0", not: "" }); ciz("pk-l-" + (P.T.l.length - 1) + "-ad"); };
  X["pk-sg-sil"] = function (el) { var i = +el.dataset.i; P.T.l.splice(i, 1); P.H = {}; ciz(); var b = $("pk-l-" + Math.min(i, P.T.l.length - 1) + "-ad") || $("a-pk-govde").querySelector('[data-eylem="pk-sg-ekle"]'); if (b) b.focus(); };
  X["pk-bulut-bagla"] = function () { P.T.bagli = true; P.T.hesap = "ayse.demir@firma.example"; ciz(); MK.bildir(BULUT[P.T.saglayici] + " hesabı bağlandı (makette taklit)."); };
  X["pk-bulut-kes"] = function () { P.T.bagli = false; P.T.hesap = ""; ciz(); };
  X["pk-posta-deneme"] = function () { MK.bildir("Deneme e-postası gönderildi: " + (ben().eposta || "") + " — kendi adresinizden (makette taklit)."); };
  X["pk-ice-sablon"] = function () { MK.bildir("Şablon indirildi (makette taklit)."); };
  X["pk-ice-dosya"] = function () { MK.dosyaSec({ kabul: ".xlsx,.csv", enCokMB: 10, ornek: "musteriler.xlsx" }, function (ad) { P.T.dosya = ad; delete P.H.tur; ciz(); }); };

  MK.goster = function () { panolarCiz(); };
  MK.kabuk({ modul: 22, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  panolarCiz();
})();
