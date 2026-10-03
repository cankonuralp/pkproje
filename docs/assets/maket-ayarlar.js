/* ══ probata MAKET · Firma ayarları (modül 22) — ONAY BEKLİYOR (R1, 2026-09-30) ═══════════════════════════════════════════════
   Reisim 2026-09-30: "firma ayarları personel kısmının altında değil ayrı bir modül olsun , ekran daha verimli kullanılsın." Önceden
   Personel'in 4. sekmesiydi (2026-09-29, 202: dağınık ayarlar tek yerde); içerik ve davranış aynı, buraya taşındı. Ekran: geniş ekranda
   solda bölüm listesi, bölümler iki sütunlu ızgarada (fiyat listesi ve sabit giderler tam genişlik, fiyatlar dört sütun); telefonda tek sütun.
   Yeni: Firma bilgileri (rapor başlığındaki künye: ticari ad, adres, e-posta, akreditasyon no, nüsha). Değişiklik bölümün Kaydet
   tuşuyla kaydedilir (Z1, 2026-10-02); geçersiz değer kaydedilmez, alanın altında söylenir (uyarı, engel değil). Görür ve değiştirir: firma yöneticisi (rol yetkileri, 22).
   Adres: #/ (tek görünüm; eski Personel #/ayarlar buraya yönlenir). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem;
  var personelSec = function () { return MV.PERSONEL.filter(function (x) { return x.durum === "etkin"; }).map(function (x) { return [x.id, x.ad, MV.meslekAd(x)]; }); };
  var varsayilanEden = MV.zimmetEden;
  /* firma künyesi (R1): rapor başlığı ve belgelerde görünür; boş bırakılırsa uyarı */
  var KUNYE = [["ad", "Ticari ad", 120, "Rapor başlığında ve belgelerde"], ["adres", "Adres", 200, ""], ["eposta", "Rapor e-postası", 120, "Müşteriye giden rapor ve bildirimler bu adresten"],
    ["akr", "Akreditasyon no", 20, "TÜRKAK markasının yanında"]];
  function firmaBilgiCiz() {
    var f = MV.FIRMA;
    return '<section class="a-bolum" aria-labelledby="a-b-firma"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-firma">Firma bilgileri</h2></div><div class="a-form">' +
      KUNYE.map(function (x) {
        return MK.alan({ id: "ay-k-" + x[0], etiket: x[1], genis: x[0] === "ad" || x[0] === "adres", uyari: String(f[x[0]] || "").trim() ? "" : "Boş: raporda bu alan boş çıkar.", sonuc: x[3],
          girdi: MK.girdi({ id: "ay-k-" + x[0], deger: f[x[0]] || "", ek: ' data-kunye="' + x[0] + '" maxlength="' + x[2] + '"' + (x[0] === "eposta" ? ' type="email" inputmode="email"' : "") }) });
      }).join("") +
      /* firma logosu (2026-10-03): yüklenince raporların ve belgelerin başlığına kendiliğinden gelir */
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Firma logosu</p>' + (f.logo ? '<div class="a-logo-satir">' +
          (MK.DOSYA[f.logo] ? '<img class="a-logo-onizle" src="' + MK.DOSYA[f.logo].url + '" alt="Firma logosu">' : "") +
          MK.dosyaAlan({ ad: f.logo, degistir: "logo-yukle", sil: "logo-sil" }) + "</div>"
        : MK.tus({ eylem: "logo-yukle", ad: "Logo yükle", ikon: "upload", sinif: "a-tus-ikincil" })) + "</div>" +
      '<div class="a-alan-grup"><label class="a-etiket" for="ay-nusha">Rapor nüsha sayısı</label>' + MK.secim({ id: "ay-nusha", ad: "Rapor nüsha sayısı", deger: String(f.nusha || 2), secenekler: [1, 2, 3, 4].map(function (n) { return [String(n), n + " nüsha"]; }), ipucu: "Seçin" }) + "</div>" +
      "</div></section>";
  }
  /* solda bölüm listesi (geniş ekran): bölümlerin başlıklarından; tıklayınca bölüme gider */
  function navCiz() {
    $("a-ayar-nav").innerHTML = '<ul class="a-ayar-nav-liste">' + Array.prototype.map.call(document.querySelectorAll("#a-ayarlar .a-alt-baslik"), function (h) {
      return '<li><a class="a-ayar-nav-oge" href="#' + h.id + '" data-bolum="' + h.id + '">' + kacis(h.textContent) + "</a></li>"; }).join("") + "</ul>";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-bolum]"); if (!a) return;
    e.preventDefault(); var h = $(a.dataset.bolum); if (h) { h.setAttribute("tabindex", "-1"); h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); }
  });
  /* ── FİRMA AYARLARI (2026-09-29; firma yöneticisinin rolü: "firma ayarları"): imza yöntemi — firma seçer (§9 otuz altıncı tur 178) ── */
  function ayarCiz() {
    var y = MV.imzaYontem();
    $("a-ayarlar").innerHTML = firmaBilgiCiz() + '<section class="a-bolum" aria-labelledby="a-b-imza"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-imza">İmza yöntemi</h2></div>' +
      '<div role="radiogroup" aria-labelledby="a-b-imza">' + Object.keys(MV.IMZA_YONTEM).map(function (k) {
        var x = MV.IMZA_YONTEM[k];
        return '<label class="a-onay-kutusu"><input type="radio" name="ay-imza" data-imza-yontem value="' + k + '"' + (y.k === k ? " checked" : "") + "><span>" + x.ad + " — " + x.etiket + "</span></label>";
      }).join("") + "</div></section>" +   /* raporun son imzası ve iç belgeler bu yöntemle; indir-imzala-yükle yedek yol her zaman açık */
      /* zimmet teslim formunda firma adına teslim edenin başlangıç değeri (196, 2026-09-29); formda değiştirilebilir, elle de yazılır */
      '<section class="a-bolum" aria-labelledby="a-b-zeden"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-zeden">Zimmet teslim formu</h2></div><div class="a-form">' +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-zeden">Teslim eden (başlangıç)</label>' + MK.secim({ id: "ay-zeden", ad: "Teslim eden (başlangıç)", deger: varsayilanEden(), secenekler: personelSec(), ipucu: "Seçin" }) + "</div></div></section>" +
      /* 5 yıl dolan raporlar (185, 2026-09-29): firma seçer — sistemde kalsın · bulut arşivine taşınsın · silinsin */
      (function () {
        var sk = MV.saklama();
        return '<section class="a-bolum" aria-labelledby="a-b-saklama"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-saklama">Saklama süresi dolan raporlar</h2></div>' +
          '<div class="a-form"><div class="a-alan-grup"><label class="a-etiket" for="ay-yil">Saklama süresi</label>' +
            MK.secim({ id: "ay-yil", ad: "Saklama süresi", deger: String(sk.yil), secenekler: [5, 6, 7, 8, 9, 10, 15, 20].map(function (y) { return [String(y), y + " yıl"]; }), ipucu: "Seçin" }) + "</div></div>" +
          '<div role="radiogroup" aria-labelledby="a-b-saklama">' + Object.keys(MV.SAKLAMA).map(function (k) {
            var x = MV.SAKLAMA[k];
            return '<label class="a-onay-kutusu"><input type="radio" name="ay-saklama" data-saklama value="' + k + '"' + (sk.yontem === k ? " checked" : "") + "><span>" + x.ad + " — " + x.etiket + "</span></label>";
          }).join("") + "</div>" +
          (TD("a-b-saklama", 'input[name="ay-saklama"]', sk.yontem) === "arsiv" ? MK.alan({ id: "ay-arsiv", etiket: "Arşiv yeri", girdi: '<input class="a-girdi" id="ay-arsiv" data-arsiv-yeri maxlength="200" value="' + kacis(sk.yer) + '" placeholder="Bulut sağlayıcısı ve klasör">',
              uyari: sk.yer.trim() ? "" : "Arşiv yeri girilmedi: yeri girilene kadar süresi dolan raporlar sistemde kalır." }) : "") + "</section>";
      })() + ayarDigerCiz();
    navCiz(); taslakYukle();
  }
  /* 202 (2026-09-29): dağınık firma ayarları tek yerde — uyarı eşikleri · rapor numarasının firma kodu · fiyat listesi · sabit giderler.
     Alandan çıkınca kaydedilir; geçersiz değer kaydedilmez, alanın altında söylenir (uyarı, engel değil: öteki alanlar çalışır) */
  var AY = { hata: {} };
  var tlYaz = function (n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  var tlOku = function (v) { var t = String(v).trim().replace(/\s*TL$/i, ""); return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : NaN; };
  function ayarDigerCiz() {
    var h = AY.hata, kod = MV.firmaKodu();
    /* AA9 (2026-10-02): "Rapor" bölümü (Uygun değilde fotoğraf zorunlu ayarı) kalktı — fotoğraf zorunlu değil */
    return "" +
      /* N1 (2026-09-30, reisim: "ön bilgilendirme formu her firmanın kendi formatına göre değişir"): firma PDF'ini yükler; müşteri kartındaki
         "Ön bilgilendirme formu gönder" bunu gönderir; yüklenmediyse temel format KM-FR-OBF-01 (§3.7 satır 15) */
      '<section class="a-bolum" aria-labelledby="a-b-obf"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-obf">Ön bilgilendirme formu</h2></div>' +
        (MV.FIRMA.onBilgiDosya ? '<div class="a-dosya-sec">' + MK.dosyaAlan({ ad: MV.FIRMA.onBilgiDosya, degistir: "obf-yukle", sil: "obf-sil" }) + "</div>"
          : '<p class="a-bolum-aciklama">Firma formatı yüklenmedi; müşteriye temel format (KM-FR-OBF-01) gider.</p><div class="a-eylem-cubugu a-eylem-sol">' +
            MK.tus({ eylem: "obf-yukle", ad: "Firma formatını yükle", ikon: "upload", sinif: "a-tus-ikincil" }) + "</div>") + "</section>" +
      /* 212 (2026-09-30): mesai takibi — aç/kapa, günlük normal ve mesai süresi (dk); raporun süresi ekipman türünün kontrol süresi */
      (function () {
        var m = MV.mesai();
        return '<section class="a-bolum" aria-labelledby="a-b-mesai"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-mesai">Mesai takibi</h2></div>' +
          '<label class="a-onay-kutusu"><input type="checkbox" data-mesai-acik' + (m.acik ? " checked" : "") + "><span>Açık — günlük süre dolunca yeni rapor oluşturulamaz</span></label>" +
          (TD("a-b-mesai", "input[data-mesai-acik]", m.acik) ? '<div class="a-form">' +
            MK.alan({ id: "ay-mesai-normal", etiket: "Günlük normal çalışma (dk)", hata: h["mesai-normal"], girdi: MK.girdi({ id: "ay-mesai-normal", deger: h["mesai-normal"] ? AY["mesai-normal"] : String(m.normal), sinif: "a-girdi-sicil", hata: h["mesai-normal"], ek: ' data-mesai="normal" inputmode="numeric" maxlength="4"' }) }) +
            MK.alan({ id: "ay-mesai-mesai", etiket: "Günlük mesai (dk)", hata: h["mesai-mesai"], girdi: MK.girdi({ id: "ay-mesai-mesai", deger: h["mesai-mesai"] ? AY["mesai-mesai"] : String(m.mesai), sinif: "a-girdi-sicil", hata: h["mesai-mesai"], ek: ' data-mesai="mesai" inputmode="numeric" maxlength="4"' }) }) +
            /* AA2 (2026-10-02): yıllık fazla çalışma sınırı (İş Kanunu 41: en çok 270 saat); günlük toplam 660 dk'yı aşarsa uyarı (63. madde) */
            MK.alan({ id: "ay-mesai-yillik", etiket: "Yıllık fazla çalışma sınırı (saat)", hata: h["mesai-yillik"], sonuc: h["mesai-yillik"] ? "" : "Kanunda en çok 270 saat. Dolan kişide o yıl mesai kullanılmaz.",
              girdi: MK.girdi({ id: "ay-mesai-yillik", deger: h["mesai-yillik"] ? AY["mesai-yillik"] : String(m.yillik), sinif: "a-girdi-sicil", hata: h["mesai-yillik"], ek: ' data-mesai="yillik" inputmode="numeric" maxlength="3"' }) }) +
            "</div>" + (m.normal + m.mesai > MV.YASAL.gunlukDk ? MK.serit("uyari", "triangle-alert", "Günlük toplam " + (m.normal + m.mesai) + " dk: İş Kanunu'na göre günlük çalışma 11 saati (660 dk) aşamaz.") : "") : "") +
          '<p class="a-ipucu">Raporun süresi ekipman türünün kontrol süresidir (Ekipman türleri). Önce normal süre, sonra mesai dolar. Fazla çalışma için çalışanın yılda bir yazılı onayı gerekir.</p></section>';
      })() +
      '<section class="a-bolum" aria-labelledby="a-b-esik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-esik">Uyarı eşikleri</h2></div><div class="a-form">' +
        Object.keys(MV.ESIK).map(function (k) {
          var x = MV.ESIK[k];
          return '<div class="a-alan-grup"><label class="a-etiket" for="ay-esik-' + k + '">' + x.ad + "</label>" +
            MK.secim({ id: "ay-esik-" + k, ad: x.ad, deger: String(MV.esik(k)), secenekler: x.secenek.map(function (g) { return [String(g), g + " gün"]; }), ipucu: "Seçin" }) +
            '<p class="a-ipucu">' + x.etiket + (MV.esik(k) === x.v ? "" : " · başlangıç " + x.v + " gün") + "</p></div>";
        }).join("") + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-b-kod"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-kod">Rapor numarası</h2></div><div class="a-form">' +
        MK.alan({ id: "ay-kod", etiket: "Firma kodu", hata: h.kod, sonuc: "Yeni rapor: " + kod + "-AAYY-SIRA-…; açılmış raporların numarası değişmez.",
          girdi: MK.girdi({ id: "ay-kod", deger: AY.kod != null ? AY.kod : kod, sinif: "a-girdi-sicil", hata: h.kod, ek: ' data-rapor-kod maxlength="4" autocapitalize="characters"' }) }) + "</div></section>" +
      '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-fiyat"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-fiyat">Fiyat listesi</h2></div>' +
        '<p class="a-ipucu">KDV hariç birim fiyat. Yeni teklif bu listeden dolar; teklif dışı rapor bu fiyatla faturalanır. Kabul edilmiş tekliflerin fiyatı değişmez.</p><div class="a-form a-ayar-fiyat">' +
        MV.KATALOG.map(function (x) {
          var id = "ay-fiyat-" + x.k;
          return MK.alan({ id: id, etiket: x.ad + " (TL)", hata: h["fiyat-" + x.k],
            girdi: MK.girdi({ id: id, deger: h["fiyat-" + x.k] ? AY["fiyat-" + x.k] : tlYaz(MV.FIYAT[x.k] || 0), sinif: "a-girdi-sicil", hata: h["fiyat-" + x.k], ek: ' data-fiyat="' + x.k + '" inputmode="decimal" maxlength="12"' }) });
        }).join("") + "</div></section>" +
      '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-sabit"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-sabit">Sabit giderler</h2></div>' +
        '<p class="a-ipucu">Aylık; Muhasebe\'nin gelir-gider özetinde her ay gider olarak düşer. Toplam ' + MV.para(MV.sabitToplam()) + ".</p>" +
        MV.SABIT_GIDER.map(function (x, i) {
          return '<div class="a-kalem a-kalem-sabit">' +
            MK.alan({ id: "ay-sg-ad-" + i, etiket: "Gider", uyari: x.ad.trim() ? "" : "Adı boş: özette adsız görünür.",
              girdi: MK.girdi({ id: "ay-sg-ad-" + i, deger: x.ad, ek: ' data-sg-ad="' + i + '" maxlength="60"' }) }) +
            MK.alan({ id: "ay-sg-tutar-" + i, etiket: "Aylık (TL)", hata: h["sg-" + i],
              girdi: MK.girdi({ id: "ay-sg-tutar-" + i, deger: h["sg-" + i] ? AY["sg-" + i] : tlYaz(x.aylik), sinif: "a-girdi-sicil", hata: h["sg-" + i], ek: ' data-sg-tutar="' + i + '" inputmode="decimal" maxlength="12"' }) }) +
            MK.alan({ id: "ay-sg-not-" + i, etiket: "Not", girdi: MK.girdi({ id: "ay-sg-not-" + i, deger: x.not || "", ek: ' data-sg-not="' + i + '" maxlength="80"' }) }) +
            MK.tus({ eylem: "sg-sil", ad: "Kaldır", ikon: "x", sinif: "a-tus-ikincil a-kalem-sil", veri: { i: i } }) + "</div>";
        }).join("") +
        '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sg-ekle", ad: "Sabit gider ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div></section>" + bulutCiz() + yzCiz() + personelBelgeCiz() + disaCiz();
  }

  X["sg-ekle"] = function () {
    var n = 1; while (MV.SABIT_GIDER.some(function (x) { return x.k === "sg" + n; })) n++;
    MV.SABIT_GIDER = MV.SABIT_GIDER.concat([{ k: "sg" + n, ad: "", aylik: 0, not: "" }]); ayarCiz(); $("ay-sg-ad-" + (MV.SABIT_GIDER.length - 1)).focus();
  };
  X["sg-sil"] = function (el) {
    var i = +el.dataset.i, x = MV.SABIT_GIDER[i]; MV.SABIT_GIDER = MV.SABIT_GIDER.filter(function (y, j) { return j !== i; }); AY.hata = {};
    var ts = TS["a-b-sabit"];   /* Z1: kaldırılan satırın taslağı düşer, alttaki satırların taslağı yeni sırasına kayar */
    if (ts) { var y = {}; Object.keys(ts).forEach(function (k) { var m = /^#ay-sg-(ad|tutar|not)-(\d+)$/.exec(k); if (!m) { y[k] = ts[k]; return; } var j = +m[2]; if (j !== i) y[j > i ? "#ay-sg-" + m[1] + "-" + (j - 1) : k] = ts[k]; }); TS["a-b-sabit"] = y; }
    ayarCiz(); var e = $("ay-sg-ad-" + Math.min(i, MV.SABIT_GIDER.length - 1)) || document.querySelector('[data-eylem="sg-ekle"]'); e.focus();
    MK.bildir((x.ad || "Adsız gider") + " kaldırıldı.");
  };
  X["obf-yukle"] = function () {
    MK.dosyaSec({ kabul: ".pdf", enCokMB: 10, ornek: "on-bilgilendirme-formu.pdf" }, function (ad) {
      MV.FIRMA.onBilgiDosya = ad; ayarCiz(); MK.bildir("Ön bilgilendirme formu yüklendi; müşterilere bu gider.");
      var b = document.querySelector('#a-b-obf ~ * [data-eylem="obf-yukle"], [data-eylem="obf-yukle"]'); if (b) b.focus();
    });
  };
  X["obf-sil"] = function () {
    MK.onayla({ baslik: "Ön bilgilendirme formunu kaldır", metin: "<b>" + kacis(MV.FIRMA.onBilgiDosya) + "</b> kaldırılır; müşterilere temel format gider.", tus: "Kaldır", tamam: function () {
      delete MV.FIRMA.onBilgiDosya; ayarCiz(); MK.bildir("Ön bilgilendirme formu kaldırıldı; temel format kullanılıyor."); var b = document.querySelector('[data-eylem="obf-yukle"]'); if (b) b.focus();
    } });
  };
  /* ── BULUT KAYDI (Ö2, 2026-10-01; reisim: "müşteriye göre kendi bulutuna kurabilir o buluta otomatik kayıt ettirebiliyor olmam lazım"):
     bulut hesabı bağlanır; rapor imzalanınca imzalı PDF müşterinin klasörüne kendiliğinden yazılır (MV.bulutaKaydet). Müşteri başına aç / kapa,
     klasör adı ve paylaşılan klasör müşteri kartında. Bulut yurt dışında saklıyorsa uyarı (engel değil). Makette bağlantı taklit. ───────── */
  function bulutCiz() {
    var b = MV.bulut(), sg = MV.BULUT_SAGLAYICI.filter(function (x) { return x[0] === b.saglayici; })[0];
    var ornek = MV.RAPORLAR.filter(function (r) { return r.durum === "imzali"; })[0];
    return '<section class="a-bolum" aria-labelledby="a-b-bulut"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bulut">Bulut kaydı</h2>' +
        '<span class="a-sayac">' + (b.bagli ? "bağlı" : "bağlı değil") + "</span></div>" +
      '<p class="a-ipucu">Rapor imzalanınca imzalı PDF müşterinin bulut klasörüne kendiliğinden kaydedilir. Müşteri başına aç / kapa ve klasör adı müşteri kartında.</p>' +
      '<div class="a-form">' +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-bulut-s">Bulut</label>' + MK.secim({ id: "ay-bulut-s", ad: "Bulut", deger: b.saglayici, secenekler: MV.BULUT_SAGLAYICI.map(function (x) { return [x[0], x[1]]; }), ipucu: "Seçin" }) + "</div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-bulut-d">Klasör düzeni</label>' + MK.secim({ id: "ay-bulut-d", ad: "Klasör düzeni", deger: b.duzen, secenekler: MV.BULUT_DUZEN }) + "</div>" +
        MK.alan({ id: "ay-bulut-kok", etiket: "Ana klasör", girdi: MK.girdi({ id: "ay-bulut-kok", deger: b.kok, ek: ' data-bulut-kok maxlength="80"' }) }) +
      "</div>" +
      (sg && sg[2] ? MK.serit("uyari", "triangle-alert", sg[1] + " verileri Türkiye dışında saklayabilir: raporlar yurt dışına çıkar (KVKK sorumluluğu firmanın). Kendi sunucunuz seçeneği veriyi Türkiye'de tutar.") : "") +
      '<div class="a-eylem-cubugu a-eylem-sol">' + (!b.saglayici ? "" : b.bagli
        ? '<span class="a-bulut-hesap">' + ikon("circle-check", "a-ikon-kucuk") + "Bağlı: " + kacis(b.hesap) + "</span>" + MK.tus({ eylem: "bulut-hepsi", ad: "İmzalı raporların hepsini gönder", ikon: "upload", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "bulut-kes", ad: "Bağlantıyı kes", ikon: "x", sinif: "a-tus-ikincil" })
        : MK.tus({ eylem: "bulut-bagla", ad: sg[1] + " hesabını bağla", ikon: "log-in" })) + "</div>" +
      (ornek ? '<p class="a-ipucu">Örnek yol: <span class="a-kod">' + kacis(MV.bulutYol(ornek)) + "</span></p>" : "") +
      (b.kayitlar.length ? '<p class="a-etiket a-disa-gecmis-bas">Son kayıtlar</p><ul class="a-disa-gecmis" id="a-bulut-kayit">' + b.kayitlar.slice(0, 5).map(function (x) {
        return "<li>" + MK.zamanYaz(x.zaman) + " · <b>" + kacis(x.no) + '</b> <span class="a-alt-satir">' + kacis(x.yol) + "</span></li>"; }).join("") + "</ul>" : "") +
      "</section>";
  }
  /* ── YAPAY ZEKÂ (Y1, 2026-10-02; ARKA-UC.md K1–K3 kabul — reisim: "Müşterinin token ekleyeceği yeri ekledin mi makete"): fotoğraftan okuma
     ve S.A.Y chat firmanın Anthropic API anahtarıyla; başlangıçta kapalı; açıkken yurt dışı uyarısı (09-G3 istisnası); model; kişi başı aylık
     sınır; bu ayın kişi başı kullanımı. Anahtar bir kez yazılır, bir daha gösterilmez (yalnız son 4 hane). ─────────────────────────────── */
  var YZ = { hata: "", yaz: false };
  function yzCiz() {
    var z = MV.yz(), kayitli = !!z.anahtar && !YZ.yaz;
    var sinirli = z.sinir !== "" && +z.sinir > 0;
    var SUT = [
      { k: "kisi", baslik: "Kişi", kart: "ust", sira: 1, hucre: function (x) { var p = MV.kisi(x.k); return kacis(p.ad) + (p.yzAnahtar ? '<span class="a-alt-satir">kendi anahtarı</span>' : ""); } },
      { k: "okuma", baslik: "Fotoğraftan okuma", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Fotoğraftan okuma</span>' + x.okuma; } },
      { k: "mesaj", baslik: "S.A.Y mesajı", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">S.A.Y mesajı</span>' + x.mesaj; } },
      { k: "usd", baslik: "Harcama", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Harcama</span>$' + x.usd.toFixed(2).replace(".", ","); } },
      { k: "durum", baslik: "Sınır", kart: "rozet", sira: 1, hucre: function (x) {
        if (MV.kisi(x.k).yzAnahtar) return '<span class="a-deger-yok">kendi hesabından</span>';
        if (!sinirli) return '<span class="a-deger-yok">sınırsız</span>';
        var o = x.usd / +z.sinir; return MK.rozet(o >= 1 ? { ad: "Doldu", rozet: "a-rozet-red" } : o >= 0.8 ? { ad: "%" + Math.round(o * 100), rozet: "a-rozet-bekliyor" } : { ad: "%" + Math.round(o * 100), rozet: "a-rozet-tamam" }); } }
    ];
    return '<section class="a-bolum" aria-labelledby="a-b-yz"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-yz">Yapay zekâ</h2>' +
        '<span class="a-sayac">' + (z.acik ? "açık" : "kapalı") + "</span></div>" +
      '<p class="a-ipucu">Fotoğraftan okuma (sigorta, topraklama noktası, etiket) ve rapor sayfasındaki S.A.Y sohbeti. Firmanın Anthropic hesabıyla çalışır; harcama o hesaptan.</p>' +
      '<div role="radiogroup" aria-labelledby="a-b-yz">' + [["0", "Kapalı"], ["1", "Açık"]].map(function (x) {
        return '<label class="a-onay-kutusu"><input type="radio" name="ay-yz" data-yz-acik value="' + x[0] + '"' + ((z.acik ? "1" : "0") === x[0] ? " checked" : "") + "><span>" + x[1] + "</span></label>"; }).join("") + "</div>" +
      (TD("a-b-yz", 'input[name="ay-yz"]', z.acik ? "1" : "0") !== "1" ? "" :
        MK.serit("uyari", "triangle-alert", "Fotoğraf ve maskelenmiş rapor bilgisi (müşteri adı, adres, kişi adı, numaralar gönderilmez) yurt dışına, Anthropic'e (ABD) gider. KVKK yurt dışı aktarım koşulları firmanın sorumluluğunda.") +
        '<div class="a-form">' +
          (kayitli
            ? '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">API anahtarı</p><p class="a-yz-anahtar">' + ikon("key-round", "a-ikon-kucuk") + '<span class="a-kod">' + kacis(z.anahtar) + "</span> kayıtlı</p>" +
                '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "yz-anahtar-degistir", ad: "Değiştir", ikon: "pencil", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "yz-anahtar-kaldir", ad: "Kaldır", ikon: "trash-2", sinif: "a-tus-ikincil" }) + "</div></div>"
            : MK.alan({ id: "ay-yz-anahtar", etiket: "API anahtarı", genis: true, hata: YZ.hata, sonuc: YZ.hata ? "" : "Anthropic Console'dan alınır (sk-ant- ile başlar). Şifreli saklanır, bir daha gösterilmez.",
                girdi: '<input class="a-girdi" id="ay-yz-anahtar" type="password" autocomplete="off" spellcheck="false" maxlength="200" aria-describedby="ay-yz-anahtar-ipucu"' + (YZ.hata ? ' aria-invalid="true"' : "") + ">" }) +
              '<div class="a-eylem-cubugu a-eylem-sol a-alan-genis">' + MK.tus({ eylem: "yz-anahtar-kaydet", ad: "Anahtarı kaydet", ikon: "check" }) + (z.anahtar ? MK.tus({ eylem: "yz-anahtar-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) : "") + "</div>") +
          '<div class="a-alan-grup"><label class="a-etiket" for="ay-yz-model">Model</label>' + MK.secim({ id: "ay-yz-model", ad: "Model", deger: z.model, secenekler: MV.YZ_MODEL }) + "</div>" +
          MK.alan({ id: "ay-yz-sinir", etiket: "Kişi başı aylık sınır ($)", hata: AY.hata["yz-sinir"], sonuc: AY.hata["yz-sinir"] ? "" : "Boş: sınırsız. Dolunca o ay yalnız yönetici artırır.",
            girdi: MK.girdi({ id: "ay-yz-sinir", deger: AY.hata["yz-sinir"] ? AY["yz-sinir"] : String(z.sinir), sinif: "a-girdi-sicil", hata: AY.hata["yz-sinir"], ek: ' data-yz-sinir inputmode="decimal" maxlength="6"' }) }) +
        "</div>" +
        (!z.anahtar ? MK.serit("uyari", "key-round", "Anahtar girilmedi: fotoğraftan okuma ve S.A.Y çalışmaz.") : "") +
        '<p class="a-etiket a-disa-gecmis-bas">Bu ay kullanım (kişi başına)</p>' +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Yapay zekâ kullanımı", sinif: "a-tablo-yz", sutunlar: SUT, kayitlar: MV.YZ_KULLANIM }) + "</div>" +
        '<p class="a-ipucu">Kendi anahtarını Hesabım\'da giren kullanıcı kendi Anthropic hesabından harcar; firmanın sınırı ona uygulanmaz.</p>') +
      "</section>";
  }
  var yzYaz = function (d) { MV.FIRMA.yz = Object.assign({}, MV.yz(), d); };
  X["yz-anahtar-kaydet"] = function () {
    var v = ($("ay-yz-anahtar") || {}).value || "";
    v = v.trim();
    if (!/^sk-ant-[A-Za-z0-9_-]{16,}$/.test(v)) { YZ.hata = v ? "Geçerli bir Anthropic API anahtarı değil (sk-ant- ile başlar)." : "Anahtarı yapıştırın."; ayarCiz(); $("ay-yz-anahtar").focus(); return; }
    /* Z1: taslakta "Açık" seçiliyken anahtar kaydedilirse açık da kaydedilir (anahtarı giren yapay zekâyı açmak istiyor) */
    var ta = TS["a-b-yz"] && TS["a-b-yz"]['input[name="ay-yz"]'], d = { anahtar: MV.anahtarIzi(v) };
    if (ta) { d.acik = ta.deger === "1"; delete TS["a-b-yz"]['input[name="ay-yz"]']; if (!Object.keys(TS["a-b-yz"]).length) delete TS["a-b-yz"]; }
    YZ.hata = ""; YZ.yaz = false; yzYaz(d); v = "";   /* yalnız son 4 hane tutulur */
    ayarCiz(); var b = document.querySelector('[data-eylem="yz-anahtar-degistir"]'); if (b) b.focus(); MK.bildir("API anahtarı kaydedildi.");
  };
  X["yz-anahtar-degistir"] = function () { YZ.yaz = true; YZ.hata = ""; ayarCiz(); $("ay-yz-anahtar").focus(); };
  X["yz-anahtar-vazgec"] = function () { YZ.yaz = false; YZ.hata = ""; ayarCiz(); var b = document.querySelector('[data-eylem="yz-anahtar-degistir"]'); if (b) b.focus(); };
  X["yz-anahtar-kaldir"] = function () {
    MK.onayla({ baslik: "API anahtarını kaldır", metin: "Fotoğraftan okuma ve S.A.Y, yeni anahtar girilene kadar çalışmaz (kendi anahtarı olanlar hariç).", tus: "Kaldır", tamam: function () {
      yzYaz({ anahtar: "" }); ayarCiz(); $("ay-yz-anahtar").focus(); MK.bildir("API anahtarı kaldırıldı.");
    } });
  };
  /* ── MÜŞTERİYE AÇIK PERSONEL BELGELERİ (P3, 2026-10-01; reisim: "o müşteriye giden muayene personelinin firmanın izin verdiği belgelerini
     görür (ekipnet belgesi isg belgeleri vs)"): müşteri panelinde "Muayene personeli" sekmesinde yalnız işaretli türler görünür ───────── */
  /* Z5 (2026-10-02, reisim: "bu kısımda eğer ben bir belge türü eklersem listeye ekleniyor mu" · "eklenmiyorsa eklensin"): "Belge türü ekle"
     firmaya yeni özlük belge türü ekler; Personel'de belge yüklerken seçilir, burada müşteriye açılabilir (başlangıçta kapalı). Kişisel veri
     işaretlenirse açılınca KVKK uyarısı. Kaldır: yalnız o türde yüklü belge yoksa. Ekleme ve kaldırma tuşla, hemen (taslağa girmez). */
  var BT = { ac: false, hata: "", ad: "", kisisel: false };
  var btKullanim = function (k) { return MV.PERSONEL.filter(function (p) { return MV.ozluk(p).some(function (b) { return b.tur === k; }); }).length; };
  function personelBelgeCiz() {
    var TUR = MV.musteriBelgeTur(), izin = MV.musteriBelgeIzni(), hassas = izin.filter(function (k) { return TUR.some(function (x) { return x[0] === k && x[2]; }); });
    return '<section class="a-bolum" aria-labelledby="a-b-mbelge"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-mbelge">Müşteriye açık personel belgeleri</h2>' +
        '<span class="a-sayac"><b>' + izin.length + "</b> tür</span></div>" +
      '<p class="a-ipucu">Müşteri panelinde "Muayene personeli" sekmesinde, o müşteriye giden muayene personelinin yalnız işaretli belgeleri görünür.</p>' +
      '<fieldset class="a-disa-bolumler"><legend class="a-gizli">Müşteriye açık belge türleri</legend>' + TUR.map(function (x) {
        var kutu = '<label class="a-onay-kutusu"><input type="checkbox" data-mbelge="' + x[0] + '"' + (izin.indexOf(x[0]) >= 0 ? " checked" : "") + "><span>" + kacis(x[1]) +
          (x[2] || x[3] ? ' <span class="a-alt-satir">' + [x[3] ? "firmanın eklediği" : "", x[2] ? "kişisel veri" : ""].filter(Boolean).join(" · ") + "</span>" : "") + "</span></label>";
        return !x[3] ? kutu : '<div class="a-belge-ek-satir">' + kutu + MK.tus({ eylem: "bt-kaldir", ad: "Kaldır", ikon: "x", sinif: "a-tus-ikincil", veri: { k: x[0] } }) + "</div>"; }).join("") + "</fieldset>" +
      (hassas.length ? MK.serit("uyari", "triangle-alert", "Kişisel veri içeren belge müşteriye açık: " + hassas.map(function (k) { return TUR.filter(function (x) { return x[0] === k; })[0][1]; }).join(", ") +
        ". Personelin açık rızası gerekebilir (KVKK); karar firmanın.") : "") +
      (BT.ac ? '<div class="a-form a-belge-ekle">' +
          MK.alan({ id: "ay-bt-ad", etiket: "Yeni belge türü", genis: true, hata: BT.hata, sonuc: BT.hata ? "" : "Personel'de özlük belgesi yüklerken seçilir; müşteriye açmak için listede işaretleyin.",
            girdi: MK.girdi({ id: "ay-bt-ad", deger: BT.ad, hata: BT.hata, ek: ' maxlength="60"' }) }) +
          '<label class="a-onay-kutusu a-alan-genis"><input type="checkbox" id="ay-bt-kisisel"' + (BT.kisisel ? " checked" : "") + "><span>Kişisel veri içerir (KVKK)</span></label>" +
          '<div class="a-eylem-cubugu a-eylem-sol a-alan-genis">' + MK.tus({ eylem: "bt-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "bt-ekle-kaydet", ad: "Türü ekle", ikon: "check" }) + "</div></div>"
        : '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "bt-ac", ad: "Belge türü ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div>") +
      "</section>";
  }
  X["logo-yukle"] = function () {
    MK.dosyaSec({ kabul: "image/png,image/jpeg,image/svg+xml", enCokMB: 2, ornek: "firma-logosu.png" }, function (ad) {
      var eski = MV.FIRMA.logo; MV.FIRMA.logo = ad; if (eski && eski !== ad) MK.dosyaSil(eski);
      ayarCiz(); var t = document.querySelector('[data-eylem="logo-yukle"]'); if (t) t.focus();
      MK.bildir("Firma logosu kaydedildi; raporların ve belgelerin başlığına gelir.");
    });
  };
  X["logo-sil"] = function () {
    MK.onayla({ baslik: "Logo kaldırılsın mı?", metin: "Raporların ve belgelerin başlığında logo yerinde boş kutu çıkar.", tus: "Kaldır", tamam: function () {
      var a = MV.FIRMA.logo; MV.FIRMA.logo = null; if (a) MK.dosyaSil(a); ayarCiz(); var t = document.querySelector('[data-eylem="logo-yukle"]'); if (t) t.focus(); MK.bildir("Firma logosu kaldırıldı.");
    } });
  };
  X["bt-ac"] = function () { BT = { ac: true, hata: "", ad: "", kisisel: false }; ayarCiz(); $("ay-bt-ad").focus(); };
  X["bt-vazgec"] = function () { BT.ac = false; ayarCiz(); document.querySelector('[data-eylem="bt-ac"]').focus(); };
  X["bt-ekle-kaydet"] = function () {
    var ad = ($("ay-bt-ad").value || "").trim(), kis = $("ay-bt-kisisel").checked, kk = function (v) { return v.toLocaleLowerCase("tr"); };
    BT.ad = ad; BT.kisisel = kis;
    BT.hata = !ad ? "Türün adını yazın." : MV.musteriBelgeTur().concat(MV.ozlukTur()).some(function (x) { return kk(x[1]) === kk(ad) || kk(x[1]) === kk(ad + " sertifikası"); }) ? "Bu adla bir belge türü zaten var." : "";
    if (BT.hata) { ayarCiz(); $("ay-bt-ad").focus(); return; }
    var n = 1; while (MV.belgeTurEk().some(function (x) { return x.k === "ek" + n; })) n++;
    MV.FIRMA.belgeTurEk = MV.belgeTurEk().concat([{ k: "ek" + n, ad: ad, kisisel: kis }]); BT = { ac: false, hata: "", ad: "", kisisel: false };
    ayarCiz(); document.querySelector('[data-mbelge="ek' + n + '"]').focus();
    MK.bildir(ad + " eklendi; Personel'de belge yüklerken seçilebilir. Müşteriye açmak için işaretleyip kaydedin.");
  };
  X["bt-kaldir"] = function (el) {
    var k = el.dataset.k, x = MV.belgeTurEk().filter(function (y) { return y.k === k; })[0], n = btKullanim(k);
    if (n) { MK.bildir(x.ad + " kaldırılamaz: " + n + " personelde bu türde yüklü belge var."); el.focus(); return; }
    MK.onayla({ baslik: "Belge türünü kaldır", metin: "<b>" + kacis(x.ad) + "</b> listeden ve müşteriye açık belgelerden kalkar.", tus: "Kaldır", tamam: function () {
      MV.FIRMA.belgeTurEk = MV.belgeTurEk().filter(function (y) { return y.k !== k; });
      if (MV.FIRMA.musteriBelge) MV.FIRMA.musteriBelge = MV.FIRMA.musteriBelge.filter(function (y) { return y !== k; });
      if (TS["a-b-mbelge"]) delete TS["a-b-mbelge"]['input[data-mbelge="' + k + '"]'];
      ayarCiz(); document.querySelector('[data-eylem="bt-ac"]').focus(); MK.bildir(x.ad + " kaldırıldı.");
    } });
  };
  var bulutYaz = function (d) { MV.FIRMA.bulut = Object.assign({}, MV.FIRMA.bulut, d); };
  X["bulut-bagla"] = function () {
    /* makette taklit: uygulamada sağlayıcının giriş penceresi açılır, izin verilince geri dönülür */
    bulutYaz({ bagli: true, hesap: MV.FIRMA.eposta || "rapor@firma.example" }); ayarCiz();
    var b = document.querySelector('[data-eylem="bulut-hepsi"]'); if (b) b.focus(); MK.bildir("Bulut bağlandı; bundan sonra imzalanan raporlar kendiliğinden kaydedilir.");
  };
  X["bulut-kes"] = function () {
    MK.onayla({ baslik: "Bulut bağlantısını kes", metin: "Raporlar artık buluta kaydedilmez; bulutta kaydedilmiş dosyalar silinmez.", tus: "Bağlantıyı kes", tamam: function () {
      bulutYaz({ bagli: false, hesap: "" }); ayarCiz(); var b = document.querySelector('[data-eylem="bulut-bagla"]'); if (b) b.focus(); MK.bildir("Bulut bağlantısı kesildi.");
    } });
  };
  X["bulut-hepsi"] = function () {
    var n = 0; MV.RAPORLAR.filter(function (r) { return r.durum === "imzali" && !r.pasif; }).forEach(function (r) { if (MV.bulutaKaydet(MV.musteriSurumu(r) || r)) n++; });
    ayarCiz(); var b = document.querySelector('[data-eylem="bulut-hepsi"]'); if (b) b.focus();
    MK.bildir(n + " imzalı rapor buluta gönderildi (kapalı müşteriler atlandı).");
  };
  /* ── VERİLERİ DIŞA AKTAR (S3, 2026-10-01; reisim: "16 olsun" — firma probata'yı bırakırken ya da yedek için bütün verisini tek seferde alır).
     Seçilen her bölüm ayrı Excel, hepsi tek ZIP. Uygulamada raporların ve yüklenen belgelerin PDF'leri de klasörlerde gelir, büyük firmada
     arka planda hazırlanır (iş kuyruğu), bağlantı kısa ömürlü ve yalnız firma yöneticisinin hesabıyla açılır (anayasa 5.1). Makette Excel'ler
     gerçekten iner; PDF yerine OKUBENI.txt. Her dışa aktarım kayda geçer (tarih, kim, bölümler). ─────────────────────────────────────────── */
  /* S4 (2026-10-01, reisim: "Sütun adları türkçe olsun ve örnek çıktı ver"): her tablonun sütunları tek tek, Türkçe adla; kimlik kodları okunur
     ada (müşteri, tesis, kişi, ekipman türü), tarihler GG.AA.YYYY, evet/hayır Türkçe. ATLA: başka tablonun kopyası olan iç alanlar (tesisin
     plan özeti, işin plan sırası). Listede olmayan yeni bir düz alan çıkarsa MK.disaCevrilmemis onu söyler (denetim). */
  var tarihYaz = function (v) { var t = String(v || ""); return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t) ? MK.zamanYaz(t) : /^\d{4}-\d{2}-\d{2}$/.test(t) ? MK.tarihYaz(t) : t; };
  var kisiAd = function (id) { var p = MV.kisi(id); return p ? p.ad : id === "depo" ? "Depo" : id === "lab" ? "Kalibrasyon laboratuvarı" : id || ""; };
  var BIC = {
    t: tarihYaz, kisi: kisiAd, kisiler: function (v) { return (Array.isArray(v) ? v : String(v || "").split(",")).filter(Boolean).map(kisiAd).join(", "); },
    musteri: function (id) { var m = MV.musteri(id); return m ? m.unvan : id || ""; }, tesis: function (id) { var x = MV.tesis(id); return x ? x.ad : id === "hepsi" ? "Bütün tesisler" : id || ""; },
    tesisler: function (v) { return (Array.isArray(v) ? v : String(v || "").split(",")).filter(Boolean).map(function (id) { var x = MV.tesis(id); return x ? x.ad : id; }).join(", "); },
    tur: function (k) { var x = MV.tur(k); return x ? x.ad : k || ""; }, meslek: function (k, o) { return o ? MV.meslekAd(o) : k; },
    egitim: function (k) { var x = MV.egitimTuru(k); return x ? x.ad : k; }, izin: function (k) { var x = MV.izinTur(k); return x ? x.ad : k; },
    gider: function (k) { return MV.giderTur(k).ad; }, cihaz: function (k) { var x = MV.CIHAZ_TURLERI.filter(function (c) { return c.k === k; })[0]; return x ? x.ad : k; },
    plan: function (k) { return (MV.PLAN_DURUM[k] || {}).ad || k; }, rapor: function (k) { return (MV.RAPOR_DURUM[k] || {}).ad || k; },
    izinDurum: function (k) { return (MV.IZIN_DURUM[k] || {}).ad || k; }, giderDurum: function (k) { return (MV.GIDER_DURUM[k] || {}).ad || k; },
    varlik: function (id) { var v = MV.varlik(id); return v ? v.ad + (v.env ? " (" + v.env + ")" : "") : id; },
    durum: function (k) { return { etkin: "Etkin", pasif: "Pasif", ayrildi: "Ayrıldı", hazir: "Parola gönderilmedi", kabul: "Kabul edildi", red: "Reddedildi", bekliyor: "Bekliyor", gonderildi: "Gönderildi", taslak: "Taslak" }[k] || k; },
    /* iç içe kayıtlar okunur tek hücreye */
    onceki: function (x) { return x && typeof x === "object" ? [tarihYaz(x.tarih), x.sonuc, x.rapor, kisiAd(x.kisi)].filter(Boolean).join(" · ") : x === true ? "Var" : x; },
    kimZaman: function (x) { return x && typeof x === "object" ? [tarihYaz(x.zaman), kisiAd(x.kim)].filter(Boolean).join(" · ") : tarihYaz(x); },
    geri: function (x) { return x && typeof x === "object" ? x.gerekce + " (" + [tarihYaz(x.zaman), kisiAd(x.kim)].filter(Boolean).join(" · ") + ")" : x; },
    sayi: function (x) { return Array.isArray(x) ? x.length : x; },
    ara: function (x) { var l = Array.isArray(x) ? x : x ? [x] : []; var y = l[l.length - 1]; return y && typeof y === "object" ? [tarihYaz(y.tarih), y.sonuc, kisiAd(y.kim)].filter(Boolean).join(" · ") : tarihYaz(y); },
    isg: function (x) { return x && typeof x === "object" ? [x.no, x.onay ? "onay " + tarihYaz(x.onay) : ""].filter(Boolean).join(" · ") : x === true ? "Var" : x; },
    rap: function (x) { return x && typeof x === "object" ? Object.keys(x).map(function (k) { return ((MV.RAPOR_DURUM[k] || {}).ad || k) + " " + x[k]; }).join(" · ") : x; },
    siklik: function (x) { return (Array.isArray(x) ? x : [x]).filter(Boolean).map(function (v) { return String(v).replace(/^(\d+)(ay|yil|gun)$/, function (m, n, b) { return n + " " + { ay: "ay", yil: "yıl", gun: "gün" }[b]; }); }).join(", "); },
    tutanak: function (x) { return x && typeof x === "object" ? [x.no, x.km != null ? MV.kmYaz(x.km) + " km" : "", x.yakit ? "yakıt " + MV.YAKIT_AD[x.yakit] : "", x.kontrol ? x.kontrol.length + " / " + MV.ARAC_KONTROL.length + " kalem" : ""].filter(Boolean).join(" · ") : x; },
    varlikTur: function (k) { return { cihaz: "Ölçüm cihazı", arac: "Araç", diger: "Diğer" }[k] || k; },
    kaynak: function (k) { return { form: "Masraf formu", muhasebe: "Muhasebe kaydı" }[k] || k; },
    yenileme: function (k) { return { yok: "Yok", otomatik: "Otomatik" }[k] || k; },
    ay: function (v) { var m = /^(\d{4})-(\d{2})$/.exec(String(v)); return m ? m[2] + "." + m[1] : v; },
    hesap: function (h) { return h && h.roller ? "Açık · " + h.roller.map(function (k) { return (MV.ROLLER.filter(function (r) { return r.k === k; })[0] || {}).ad || k; }).join(", ") : "Yok"; }
  };
  /* [alan, Türkçe sütun adı, biçim?] */
  var SUTUN = {
    musteriler: [["id", "Müşteri kodu"], ["unvan", "Unvan"], ["kisa", "Kısa ad"], ["vd", "Vergi dairesi"], ["vno", "Vergi no"], ["eposta", "E-posta"], ["ilgili", "İlgili kişi"], ["acilis", "Kayıt tarihi", "t"], ["uygunsuz", "Açık uygunsuzluk sayısı"]],
    tesisler: [["id", "Tesis kodu"], ["m", "Müşteri", "musteri"], ["ad", "Tesis adı"], ["adres", "Adres"], ["ilce", "İlçe"], ["il", "İl"], ["sgk", "SGK sicil no"], ["ekipman", "Ekipman sayısı"], ["son", "Son kontrol", "t"], ["sonraki", "Sonraki kontrol", "t"], ["plan", "Son plan no"]],
    "musteri-kullanicilari": [["m", "Müşteri", "musteri"], ["ad", "Ad soyad"], ["eposta", "E-posta"], ["tesis", "Gördüğü tesis", "tesis"], ["durum", "Hesap durumu", "durum"], ["son", "Son giriş", "t"], ["gonderildi", "Parola gönderildi", "t"]],
    ekipmanlar: [["kod", "Ekipman kodu"], ["tur", "Ekipman türü", "tur"], ["tesis", "Tesis", "tesis"], ["konum", "Bölüm (kullanım yeri)"], ["marka", "Marka"], ["model", "Model"], ["seri", "Seri no"], ["imal", "İmal yılı"], ["ilk", "İlk kontrol"], ["onceki", "Önceki kontrol", "onceki"], ["eskiKod", "Eski kod"], ["plan", "Plan sırası"]],
    planlar: [["no", "Plan no"], ["ad", "Proje / tesis adı"], ["musteri", "Müşteri"], ["adres", "Adres"], ["ilce", "İlçe"], ["il", "İl"], ["tarih", "Plan tarihi", "t"], ["bitTarih", "Bitiş tarihi", "t"], ["bas", "Başlangıç saati"], ["bit", "Bitiş saati"],
      ["ekip", "Denetçiler", "kisiler"], ["m", "Mekanik ekipman"], ["e", "Elektrik ekipmanı"], ["yeni", "Yeni ekipman"], ["disarida", "Kapsam dışı ekipman"], ["durum", "Durum", "plan"], ["acildi", "Açıldı", "t"], ["kabul", "Kabul edildi", "t"],
      ["basladi", "Denetime başlandı", "t"], ["bitti", "Tamamlandı", "t"], ["reddedildi", "Reddedildi", "t"], ["gerekce", "Red gerekçesi"], ["aciklama", "Açıklama"], ["eksik", "Eksik / uyarı"], ["isg", "İSG-KATİP", "isg"], ["ortak", "Ortak plan"], ["rap", "Raporlar (duruma göre)", "rap"], ["id", "Plan sırası"]],
    raporlar: [["no", "Rapor no"], ["kod", "Ekipman kodu"], ["tesis", "Tesis", "tesis"], ["plan", "Plan sırası"], ["kisi", "Denetçi", "kisi"], ["olustu", "Oluşturuldu", "t"], ["ilkGonderim", "İlk onaya gönderim", "t"], ["gonderildi", "Son onaya gönderim", "t"],
      ["durum", "Durum", "rapor"], ["sonuc", "Sonuç"], ["onay", "Onaylandı", "kimZaman"], ["imza", "İmzalandı", "kimZaman"], ["geri", "Geri gönderme gerekçesi", "geri"], ["duzeltmeler", "Düzeltme sayısı", "sayi"]],
    teklifler: [["no", "Teklif no"], ["m", "Müşteri", "musteri"], ["tesis", "Tesis", "tesis"], ["tarih", "Teklif tarihi", "t"], ["gonderildi", "Gönderildi", "t"], ["gecerlilik", "Geçerlilik (gün)"], ["durum", "Durum", "durum"], ["sonuc", "Karar tarihi", "t"], ["gerekce", "Red gerekçesi"], ["hazirlayan", "Hazırlayan", "kisi"]],
    "is-sozlesmeleri": [["no", "Sözleşme no"], ["m", "Müşteri", "musteri"], ["tesisler", "Tesisler", "tesisler"], ["teklif", "Teklif no"], ["baslangic", "Başlangıç", "t"], ["bitis", "Bitiş", "t"], ["vade", "Ödeme vadesi (gün)"], ["yenileme", "Yenileme", "yenileme"], ["dosya", "İmzalı sözleşme yüklü"]],
    "isg-katip": [["no", "İSG-KATİP sözleşme no"], ["t", "Tesis", "tesis"], ["k", "Denetçi", "kisi"], ["onay", "Onay tarihi", "t"], ["bitis", "Bitiş", "t"], ["girdi", "Giren", "kisi"], ["pdf", "Belge"], ["onceki", "Önceki dönemden"], ["id", "Kayıt no"]],
    personel: [["id", "Personel kodu"], ["ad", "Ad soyad"], ["meslek", "Meslek", "meslek"], ["diploma", "Diploma no"], ["oda", "Oda sicil no"], ["ekipnet", "EKİPNET no"], ["eposta", "E-posta"], ["imzaTel", "Mobil imza telefonu"], ["basla", "İşe başlama", "t"], ["ayrildi", "Ayrılış", "t"], ["durum", "Durum", "durum"], ["hesap", "Giriş hesabı · roller", "hesap"]],
    egitimler: [["kisi", "Personel", "kisi"], ["k", "Eğitim", "egitim"], ["tarih", "Eğitim tarihi", "t"], ["tekrar", "Tekrar tarihi", "t"], ["kurum", "Kurum"], ["belge", "Belge yüklü"], ["id", "Kayıt no"]],
    "ekipman-atamalari": [["k", "Personel", "kisi"], ["tur", "Ekipman türü", "tur"], ["tarih", "Atama tarihi", "t"], ["dosya", "Atama belgesi"], ["id", "Kayıt no"]],
    izinler: [["no", "Talep no"], ["kisi", "Personel", "kisi"], ["tur", "İzin türü", "izin"], ["bas", "Başlangıç", "t"], ["bit", "Bitiş", "t"], ["gun", "Gün"], ["aciklama", "Açıklama"], ["durum", "Durum", "izinDurum"], ["gonderildi", "Gönderildi", "t"], ["karar", "Karar", "t"], ["onaylayan", "Karar veren", "kisi"], ["belge", "Belge"]],
    "olcum-cihazlari": [["env", "Envanter no"], ["ad", "Ad"], ["tur", "Varlık türü", "varlikTur"], ["cihazTur", "Cihaz türü", "cihaz"], ["marka", "Marka"], ["model", "Model"], ["seri", "Seri no"], ["aralik", "Ölçüm aralığı"], ["bitis", "Kalibrasyon bitişi", "t"], ["araSiklik", "Ara kontrol sıklığı", "siklik"],
      ["ara", "Son ara kontrol", "ara"], ["rapor", "Kalibrasyon rapor no"], ["plaka", "Plaka"], ["yil", "Model yılı"],
      /* AA4 (2026-10-02): araç alanları */
      ["yakit", "Yakıt türü"], ["muayene", "Muayene bitişi", "t"], ["sigorta", "Trafik sigortası bitişi", "t"], ["kasko", "Kasko bitişi", "t"], ["bakimKm", "Sonraki bakım (km)"], ["id", "Kayıt no"]],
    "zimmet-hareketleri": [["tarih", "Tarih", "t"], ["v", "Varlık", "varlik"], ["eden", "Teslim eden", "kisi"], ["alan", "Teslim alan", "kisi"], ["foto", "Fotoğraf sayısı"], ["fotoAd", "Fotoğraf dosyaları"], ["not", "Not"], ["tutanak", "Araç teslim tutanağı", "tutanak"], ["onay", "Teslim alan onayı", "t"], ["yetkili", "Yetkili", "kisi"], ["id", "Kayıt no"]],
    isler: [["no", "İş (plan) no"], ["m", "Müşteri", "musteri"], ["tesis", "Tesis", "tesis"], ["tarih", "Tarih", "t"], ["pdurum", "Plan durumu", "plan"], ["ekip", "Denetçiler", "kisiler"], ["raporlar", "Raporlar"], ["faturalar", "Faturalar"]],
    faturalar: [["no", "Fatura no"], ["is", "İş (plan) no"], ["m", "Müşteri", "musteri"], ["tarih", "Fatura tarihi", "t"], ["vadeGun", "Vade (gün)"], ["vade", "Vade tarihi", "t"], ["raporlar", "Raporlar"], ["kaydeden", "Kaydeden", "kisi"]],
    giderler: [["no", "Gider no"], ["tarih", "Tarih", "t"], ["tur", "Tür", "gider"], ["tutar", "Tutar (KDV dahil)"], ["oran", "KDV oranı (%)"], ["is", "İş (plan) no"], ["kisi", "Personel", "kisi"], ["aciklama", "Açıklama"], ["belge", "Belge"],
      ["kaynak", "Kaynak", "kaynak"], ["gonderildi", "Gönderildi", "t"], ["durum", "Durum", "giderDurum"], ["onaylayan", "Onaylayan", "kisi"], ["odeme", "Ödeme tarihi", "t"], ["kaydeden", "Kaydeden", "kisi"]],
    bordrolar: [["kisi", "Personel", "kisi"], ["ay", "Ay", "ay"], ["brut", "Brüt (TL)"], ["net", "Net (TL)"], ["maliyet", "İşveren maliyeti (TL)"], ["dosya", "Bordro belgesi"], ["yuklendi", "Yüklendi", "t"], ["yukleyen", "Yükleyen", "kisi"]],
    "sabit-giderler": [["ad", "Gider"], ["aylik", "Aylık (TL)"], ["not", "Not"], ["k", "Kod"]],
    dokumanlar: [["kod", "Belge kodu"], ["ad", "Belge adı"], ["tur", "Tür"], ["rev", "Revizyon"], ["tarih", "Tarih", "t"], ["yukleyen", "Yükleyen", "kisi"], ["dosya", "Dosya"], ["k", "Kayıt no"]]
  };
  var ATLA = { tesisler: ["pid", "pdurum", "ptarih", "pekip", "psaat"], isler: ["pid"], personel: ["meslekMetin"] };   /* plan özetinin kopyası (asıl kayıt Planlar'da); meslekMetin Meslek sütununda */
  var basAd = function (tablo, k) { return (SUTUN[tablo] || []).some(function (x) { return x[0] === k; }) || (ATLA[tablo] || []).indexOf(k) >= 0; };
  var DIS = [
    ["musteri", "Müşteriler ve tesisler", function () { return [["musteriler", MV.MUSTERILER], ["tesisler", MV.TESISLER], ["musteri-kullanicilari", MV.MUSTERI_KULLANICI]]; }],
    ["ekipman", "Ekipmanlar", function () { return [["ekipmanlar", MV.EKIPMAN]]; }],
    ["plan", "Planlar", function () { return [["planlar", MV.PLANLAR]]; }],
    ["rapor", "Raporlar (liste ve PDF'ler)", function () { return [["raporlar", MV.RAPORLAR]]; }],
    ["teklif", "Teklifler ve sözleşmeler", function () { return [["teklifler", MV.TEKLIFLER], ["is-sozlesmeleri", MV.IS_SOZLESMELERI], ["isg-katip", MV.ISG]]; }],
    ["personel", "Personel, eğitimler, atamalar, izinler", function () { return [["personel", MV.PERSONEL], ["egitimler", MV.EGITIMLER], ["ekipman-atamalari", MV.ATAMALAR], ["izinler", MV.IZINLER]]; }],
    ["varlik", "Ölçüm cihazları ve zimmetler", function () { return [["olcum-cihazlari", MV.VARLIKLAR], ["zimmet-hareketleri", MV.ZIMMET]]; }],
    ["muhasebe", "Muhasebe (işler, faturalar, giderler, bordrolar)", function () { return [["isler", MV.ISLER], ["faturalar", MV.FATURALAR], ["giderler", MV.GIDERLER], ["bordrolar", MV.BORDROLAR], ["sabit-giderler", MV.SABIT_GIDER]]; }],
    ["dokuman", "Dökümanlar", function () { return [["dokumanlar", MV.DOKUMANLAR]]; }]
  ];
  var DS = { sec: null };
  var secili = function () { return DS.sec || DIS.map(function (x) { return x[0]; }); };
  var duzMu = function (v) { return v == null || typeof v !== "object" || (Array.isArray(v) && v.every(function (y) { return y == null || typeof y !== "object"; })); };
  /* tablo → satırlar: tanımlı sütunlar sırayla, değer biçimlenir (iç içe kayıtlar ayrı dosyada) */
  function satirlar(tablo, l) {
    var sut = SUTUN[tablo] || [];
    return [sut.map(function (x) { return x[1]; })].concat((l || []).map(function (o) { return sut.map(function (x) {
      var v = o[x[0]]; if ((v == null || v === "") && x[2] !== "hesap") return "";
      var c = x[2] ? BIC[x[2]](v, o) : v;
      if (c != null && typeof c === "object") c = Array.isArray(c) && c.every(function (y) { return y == null || typeof y !== "object"; }) ? c.join(", ") : "";   /* biçimsiz iç içe kayıt hücreye düşmez */
      return Array.isArray(c) ? c.join(", ") : typeof c === "boolean" ? (c ? "Evet" : "Hayır") : c == null ? "" : c; }); }));
  }
  /* denetim için: listede olmayan (çevrilmemiş) düz alanlar ve okunmayan hücreler ("[object …]", undefined, NaN) — boş olmalı */
  MK.disaCevrilmemis = function () {
    var l = []; DIS.forEach(function (x) { x[2]().forEach(function (d) {
      (d[1] || []).forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (duzMu(o[k]) && !basAd(d[0], k) && l.indexOf(d[0] + "." + k) < 0) l.push(d[0] + "." + k); }); });
      var sat = satirlar(d[0], d[1]);   /* okunmayan hücre de kusur sayılır */
      sat.slice(1).forEach(function (r) { r.forEach(function (h, i) { if (/\[object |undefined|NaN/.test(String(h)) && l.indexOf(d[0] + ":" + sat[0][i]) < 0) l.push(d[0] + ":" + sat[0][i]); }); }); }); });
    return l;
  };
  function disaCiz() {
    var s = secili(), gecmis = MV.FIRMA.disaAktarim || [];
    return '<section class="a-bolum" aria-labelledby="a-b-disa"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-disa">Verileri dışa aktar</h2></div>' +
      '<p class="a-ipucu">Firmanın kayıtları tek ZIP dosyasında: her bölüm ayrı Excel; raporların ve yüklenen belgelerin PDF\'leri klasörlerde. İndirme bağlantısı 24 saat geçerli, yalnız sizin hesabınızla açılır.</p>' +
      '<fieldset class="a-disa-bolumler"><legend class="a-gizli">Dışa aktarılacak bölümler</legend>' + DIS.map(function (x) {
        return '<label class="a-onay-kutusu"><input type="checkbox" data-disa="' + x[0] + '"' + (s.indexOf(x[0]) >= 0 ? " checked" : "") + "><span>" + x[1] + "</span></label>";
      }).join("") + "</fieldset>" +
      '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "disa-aktar", ad: "Dışa aktar (ZIP)", ikon: "download" }) + "</div>" +
      (gecmis.length ? '<p class="a-etiket a-disa-gecmis-bas">Son dışa aktarımlar</p><ul class="a-disa-gecmis">' + gecmis.slice(0, 5).map(function (g) {
        return "<li>" + MK.zamanYaz(g.zaman) + " · " + kacis(g.kisi) + ' <span class="a-alt-satir">' + g.bolum + " bölüm · " + kacis(g.ad) + "</span></li>"; }).join("") + "</ul>" : "") +
      "</section>";
  }
  X["disa-aktar"] = function () {
    var s = secili();
    if (!s.length) { MK.bildir("En az bir bölüm seçin."); var c = document.querySelector("[data-disa]"); if (c) c.focus(); return; }
    var gun = MK.BUGUN, dosyalar = [];
    DIS.filter(function (x) { return s.indexOf(x[0]) >= 0; }).forEach(function (x) {
      x[2]().forEach(function (d) { dosyalar.push([x[0] + "/" + d[0] + ".xlsx", MK.xlsxBayt(d[0], satirlar(d[0], d[1]))]); });
    });
    dosyalar.push(["OKUBENI.txt", "probata · " + MV.FIRMA.ad + " · veri dışa aktarımı · " + gun + "\r\nHer bölüm ayrı Excel dosyasında.\r\n" +
      (s.indexOf("rapor") >= 0 ? "Uygulamada raporların PDF'leri rapor/pdf/ klasörüne, yüklenen belgeler ilgili bölümün belgeler/ klasörüne konur (makette PDF üretilmez).\r\n" : "")]);
    var ad = "probata-" + MV.firmaKodu().toLocaleLowerCase("tr") + "-veriler-" + gun + ".zip";
    MK.indir(ad, MK.zip(dosyalar));
    var ben = MV.kisi(MK.BEN);
    MV.FIRMA.disaAktarim = [{ zaman: MK.simdi(), kisi: ben ? ben.ad : "—", bolum: s.length, ad: ad }].concat(MV.FIRMA.disaAktarim || []);
    ayarCiz(); var b = document.querySelector('[data-eylem="disa-aktar"]'); if (b) b.focus();
  };
  function secimUygula(id, deger) {
    var m;
    if (id === "ay-bulut-s") { bulutYaz({ saglayici: deger, bagli: false, hesap: "" }); ayarCiz(); $(id).focus(); MK.bildir("Bulut: " + MV.BULUT_SAGLAYICI.filter(function (x) { return x[0] === deger; })[0][1] + "; hesabı bağlayın."); return; }
    if (id === "ay-bulut-d") { bulutYaz({ duzen: deger }); ayarCiz(); $(id).focus(); MK.bildir("Klasör düzeni: " + MV.BULUT_DUZEN.filter(function (x) { return x[0] === deger; })[0][1] + "."); return; }
    if (id === "ay-nusha") { MV.FIRMA.nusha = +deger; ayarCiz(); $(id).focus(); MK.bildir("Rapor nüsha sayısı " + deger + "."); return; }
    if (id === "ay-yil") { var sk0 = MV.saklama(); MV.FIRMA.saklama = { yontem: sk0.yontem, yer: sk0.yer, yil: +deger }; ayarCiz(); $(id).focus(); MK.bildir("Saklama süresi " + deger + " yıl."); return; }   /* 5 taban: listede 5'ten kısa yok */
    if ((m = /^ay-esik-(\w+)$/.exec(id))) {
      var es = {}; Object.keys(MV.ESIK).forEach(function (k) { es[k] = MV.esik(k); }); es[m[1]] = +deger; MV.FIRMA.esik = es;
      MV.EGITIM_DURUM.yakin.ad = MV.esik("egitim") + " gün içinde"; ayarCiz(); $(id).focus();
      MK.bildir(MV.ESIK[m[1]].ad + " eşiği " + deger + " gün; uyarılar bu eşikle."); return;
    }
    if (id === "ay-yz-model") { yzYaz({ model: deger }); ayarCiz(); $(id).focus(); MK.bildir("Model: " + MV.YZ_MODEL.filter(function (x) { return x[0] === deger; })[0][1] + "."); return; }
    if (id === "ay-zeden") { MV.FIRMA.zimmetEden = deger; ayarCiz(); $(id).focus(); MK.bildir("Zimmet formunda teslim eden başlangıçta: " + MV.kisi(deger).ad + "."); return; }
  }
  function uygula(t) {
    if (t.hasAttribute && t.hasAttribute("data-bulut-kok")) { bulutYaz({ kok: t.value.trim() || "probata Raporlar" }); ayarCiz(); $("ay-bulut-kok").focus(); MK.bildir("Ana klasör kaydedildi."); return; }
    if (t.hasAttribute && t.hasAttribute("data-yz-acik")) {
      yzYaz({ acik: t.value === "1" }); YZ.hata = ""; ayarCiz(); var q0 = document.querySelector('[data-yz-acik][value="' + t.value + '"]'); if (q0) q0.focus();
      MK.bildir(t.value === "1" ? "Yapay zekâ açıldı." : "Yapay zekâ kapatıldı; fotoğraftan okuma ve S.A.Y görünmez."); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-yz-sinir")) {
      var sv = t.value.trim().replace(",", ".");
      if (sv !== "" && !(/^\d+(\.\d{1,2})?$/.test(sv))) { AY.hata["yz-sinir"] = "Sayı yazılmalı (ör. 20). Kaydedilmedi."; AY["yz-sinir"] = t.value; ayarCiz(); $("ay-yz-sinir").focus(); return; }
      delete AY.hata["yz-sinir"]; yzYaz({ sinir: sv === "" ? "" : +sv }); ayarCiz(); $("ay-yz-sinir").focus();
      MK.bildir(sv === "" ? "Kişi başı sınır kaldırıldı." : "Kişi başı aylık sınır $" + sv.replace(".", ",") + "."); return;
    }
    if (t.dataset && t.dataset.mbelge) {   /* P3: müşteriye açık personel belgesi türü */
      var mb = MV.musteriBelgeIzni().slice(), k = t.dataset.mbelge, ad = MV.musteriBelgeTur().filter(function (x) { return x[0] === k; })[0][1];
      if (t.checked && mb.indexOf(k) < 0) mb.push(k); else if (!t.checked) mb = mb.filter(function (x) { return x !== k; });
      MV.FIRMA.musteriBelge = MV.musteriBelgeTur().map(function (x) { return x[0]; }).filter(function (x) { return mb.indexOf(x) >= 0; });
      ayarCiz(); var c = document.querySelector('[data-mbelge="' + k + '"]'); if (c) c.focus();
      MK.bildir(ad + (t.checked ? " müşterilere açıldı." : " müşterilere kapatıldı.")); return;
    }
    if (t.dataset && t.dataset.disa) {   /* dışa aktarılacak bölüm seçimi */
      var sl = secili().slice(), j = sl.indexOf(t.dataset.disa); if (t.checked && j < 0) sl.push(t.dataset.disa); else if (!t.checked && j >= 0) sl.splice(j, 1);
      DS.sec = DIS.map(function (x) { return x[0]; }).filter(function (k) { return sl.indexOf(k) >= 0; }); return;
    }
    if (t.dataset && t.dataset.kunye) {   /* firma künyesi: alandan çıkınca kaydedilir */
      var kk = t.dataset.kunye, od0 = t.id; MV.FIRMA[kk] = t.value.trim(); ayarCiz(); var o0 = $(od0); if (o0) o0.focus();
      MK.bildir(KUNYE.filter(function (x) { return x[0] === kk; })[0][1] + " kaydedildi."); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-saklama")) {
      MV.FIRMA.saklama = { yontem: t.value, yer: MV.saklama().yer, yil: MV.saklama().yil }; ayarCiz(); var q = document.querySelector('[data-saklama][value="' + t.value + '"]'); if (q) q.focus();
      MK.bildir("5 yılı dolan raporlar: " + MV.SAKLAMA[t.value].ad.toLocaleLowerCase("tr") + "."); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-arsiv-yeri")) {   /* arşiv yeri: alandan çıkınca kaydedilir, uyarı güncellenir */
      MV.FIRMA.saklama = { yontem: "arsiv", yer: t.value.trim(), yil: MV.saklama().yil }; ayarCiz(); MK.bildir(t.value.trim() ? "Arşiv yeri kaydedildi." : "Arşiv yeri boş: süresi dolan raporlar sistemde kalır."); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-mesai-acik")) {
      var ms = MV.mesai(); MV.FIRMA.mesai = { acik: t.checked, normal: ms.normal, mesai: ms.mesai, yillik: ms.yillik }; ayarCiz(); var ma = document.querySelector("[data-mesai-acik]"); if (ma) ma.focus();
      MK.bildir(t.checked ? "Mesai takibi açık." : "Mesai takibi kapalı; günlük süre sınırı yok."); return;
    }
    if (t.dataset && t.dataset.mesai) {   /* 0–1440 dk tam sayı; geçersizse eski değer kalır */
      var mk = t.dataset.mesai, mv = t.value.trim(), mo = t.id, m0 = MV.mesai();
      if (/^\d{1,4}$/.test(mv) && +mv <= (mk === "yillik" ? MV.YASAL.yillikSaat : 1440) && (mk !== "normal" || +mv > 0)) { m0[mk] = +mv; MV.FIRMA.mesai = m0; delete AY.hata["mesai-" + mk]; ayarCiz(); MK.bildir(mk === "yillik" ? "Yıllık fazla çalışma sınırı " + mv + " saat." : (mk === "normal" ? "Günlük normal çalışma " : "Günlük mesai ") + mv + " dk."); }
      else { AY.hata["mesai-" + mk] = mk === "yillik" ? "0–270 saat yazın (kanundaki üst sınır 270). Kaydedilmedi." : mk === "normal" ? "1–1440 arası dakika yazın. Kaydedilmedi." : "0–1440 arası dakika yazın. Kaydedilmedi."; AY["mesai-" + mk] = t.value; ayarCiz(); }
      var mf = $(mo); if (mf) mf.focus(); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-rapor-kod")) {   /* 2–4 büyük harf; geçersizse eski kod kalır */
      var kd = t.value.trim().toLocaleUpperCase("tr");
      if (/^[A-ZÇĞİÖŞÜ]{2,4}$/.test(kd)) { MV.FIRMA.raporKod = kd; delete AY.hata.kod; AY.kod = null; ayarCiz(); MK.bildir("Firma kodu " + kd + "; yeni raporlar bu kodla numaralanır."); }
      else { AY.hata.kod = "2–4 harf olmalı (ör. KM). Kaydedilmedi; yeni raporlar " + MV.firmaKodu() + " ile numaralanır."; AY.kod = t.value; ayarCiz(); }
      return;
    }
    if (t.dataset && (t.dataset.fiyat || t.dataset.sgTutar)) {   /* tutar alanları: TL biçimi (1.250 ya da 1250,50); geçersizse eski değer kalır */
      var fk = t.dataset.fiyat, si = t.dataset.sgTutar, hk = fk ? "fiyat-" + fk : "sg-" + si, n = tlOku(t.value), odak = t.id;
      if (n > 0 || (si != null && n === 0)) { if (fk) MV.FIYAT[fk] = n; else MV.SABIT_GIDER[+si].aylik = n; delete AY.hata[hk]; delete AY[hk]; ayarCiz(); MK.bildir((fk ? MV.tur(fk).ad + " birim fiyatı " : MV.SABIT_GIDER[+si].ad + " aylık ") + MV.para(n) + "."); }
      else { AY.hata[hk] = "Tutar okunamadı (ör. 1.250 ya da 1250,50). Kaydedilmedi."; AY[hk] = t.value; ayarCiz(); }
      var o = $(odak); if (o) o.focus(); return;
    }
    if (t.dataset && (t.dataset.sgAd != null || t.dataset.sgNot != null)) {
      var sg = MV.SABIT_GIDER[+(t.dataset.sgAd != null ? t.dataset.sgAd : t.dataset.sgNot)], od = t.id;
      if (t.dataset.sgAd != null) sg.ad = t.value.trim(); else sg.not = t.value.trim();
      MV.SABIT_GIDER = MV.SABIT_GIDER.slice(); ayarCiz(); var o2 = $(od); if (o2) o2.focus(); MK.bildir("Sabit gider kaydedildi."); return;
    }
    if (t.hasAttribute && t.hasAttribute("data-imza-yontem")) {
      MV.FIRMA.imza = t.value; ayarCiz(); var s = document.querySelector('[data-imza-yontem][value="' + t.value + '"]'); if (s) s.focus();
      MK.bildir("İmza yöntemi: " + MV.imzaYontem().ad + ". Raporlar ve iç belgeler bu yöntemle imzalanır."); return;
    }
  }
  /* ── TASLAK + BÖLÜM KAYDET (Z1, 2026-10-02; reisim: "yapılan değişikliklerin yanına minik bir kaydet butonu koy yoksa kaydedildiği
     anlaşılmıyor"): değişiklik hemen kaydedilmez, bölümün taslağına yazılır; bölüm başlığının yanında Kaydet ve Vazgeç çıkar. Kaydet
     taslağı sırayla uygular (geçersiz değer yine kaydedilmez, alanın altında söylenir); Vazgeç kayıtlı değerlere döner. Yeniden çizimde
     taslak alanlara geri yazılır. Aç / kapa ile alan açan seçimler (yapay zekâ, mesai, arşiv) taslakta da alanlarını gösterir.
     Taslağa girmeyenler: dışa aktarılacak bölüm seçimi (Dışa aktar tuşu var), API anahtarı (kendi tuşu var), eylem tuşları. ─────── */
  var TS = {};
  var muaf = function (t) { return t.dataset.disa != null || t.id === "ay-yz-anahtar" || !!t.closest(".a-belge-ekle") || !t.closest("#a-ayarlar"); };
  var YENIDEN = ["data-yz-acik", "data-mesai-acik", "data-saklama"];   /* alan açıp kapatan seçimler: taslakta da yeniden çizilir */
  function secici(t) {
    if (t.type === "radio") return 'input[name="' + t.name + '"]';
    if (t.id) return "#" + t.id;
    return t.tagName.toLowerCase() + Array.prototype.filter.call(t.attributes, function (a) { return a.name.indexOf("data-") === 0; }).map(function (a) { return "[" + a.name + '="' + a.value + '"]'; }).join("");
  }
  function TD(b, k, varsayilan) { var x = TS[b] && TS[b][k]; return x ? x.deger : varsayilan; }
  function bolumIsaretle(sec) {
    if (!sec || sec.querySelector(".a-ayar-kaydet")) return;
    var b = sec.getAttribute("aria-labelledby");
    sec.querySelector(".a-alt-bas").insertAdjacentHTML("beforeend", '<span class="a-bolum-tuslar a-ayar-kaydet"><span class="a-ayar-kaydet-not">Kaydedilmedi</span>' +
      MK.tus({ eylem: "ayar-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil", veri: { bolum: b } }) + MK.tus({ eylem: "ayar-kaydet", ad: "Kaydet", ikon: "check", veri: { bolum: b } }) + "</span>");
  }
  function taslakEkle(t) {
    var sec = t.closest("section.a-bolum"), b = sec.getAttribute("aria-labelledby"), k = secici(t);
    (TS[b] = TS[b] || {})[k] = { tip: t.type === "radio" ? "radyo" : t.type === "checkbox" ? "kutu" : "girdi", deger: t.type === "checkbox" ? t.checked : t.value };
    bolumIsaretle(sec);
  }
  function secimGoster(id, deger) {
    var tus = $(id); if (!tus) return;
    var kap = tus.closest(".a-secici"), sec = kap.querySelector('[data-secim="' + id + '"][data-deger="' + deger + '"]');
    kap.querySelectorAll("[data-secim]").forEach(function (o) { o.setAttribute("aria-selected", String(o === sec)); });
    if (sec) { var s = tus.querySelector(".a-kirp"), a = sec.querySelector(".a-kirp").textContent; s.textContent = a; s.title = a; s.classList.remove("a-secim-bos"); }
  }
  function taslakYukle() {
    Object.keys(TS).forEach(function (b) {
      var sec = document.querySelector('#a-ayarlar section[aria-labelledby="' + b + '"]'); if (!sec) { delete TS[b]; return; }
      Object.keys(TS[b]).forEach(function (k) {
        var x = TS[b][k];
        if (x.tip === "secim") { secimGoster(x.id, x.deger); return; }
        var t = sec.querySelector(x.tip === "radyo" ? k + '[value="' + x.deger + '"]' : k); if (!t) return;
        if (x.tip === "kutu") t.checked = x.deger; else if (x.tip === "radyo") t.checked = true; else t.value = x.deger;
      });
      bolumIsaretle(sec);
    });
  }
  var baslikOdak = function (b) { var h = $(b); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); } };
  X["ayar-kaydet"] = function (el) {
    var b = el.dataset.bolum, l = TS[b] || {}, ad = $(b).textContent, mesaj = [], eski = MK.bildir;
    delete TS[b]; MK.bildir = function (m) { mesaj.push(m); };
    try {
      Object.keys(l).forEach(function (k) {
        var x = l[k];
        if (x.tip === "secim") { secimUygula(x.id, x.deger); return; }
        var t = document.querySelector('#a-ayarlar section[aria-labelledby="' + b + '"] ' + (x.tip === "radyo" ? k + '[value="' + x.deger + '"]' : k)); if (!t) return;
        if (x.tip === "kutu") t.checked = x.deger; else if (x.tip === "radyo") t.checked = true; else t.value = x.deger;
        uygula(t);
      });
    } finally { MK.bildir = eski; }
    ayarCiz();
    var hata = document.querySelector('#a-ayarlar section[aria-labelledby="' + b + '"] [aria-invalid="true"]');
    if (hata) { hata.focus(); MK.bildir(ad + ": bazı alanlar kaydedilmedi; nedeni alanın altında."); return; }
    baslikOdak(b); MK.bildir(mesaj.length === 1 ? mesaj[0] : ad + " kaydedildi.");
  };
  X["ayar-vazgec"] = function (el) {
    var b = el.dataset.bolum; delete TS[b]; ayarCiz(); baslikOdak(b); MK.bildir($(b).textContent + ": değişiklikler geri alındı.");
  };
  MK.onSecim = function (id, deger) {
    var tus = $(id), sec = tus && tus.closest("#a-ayarlar section.a-bolum"); if (!sec) return;
    var b = sec.getAttribute("aria-labelledby"); (TS[b] = TS[b] || {})["secim:" + id] = { tip: "secim", id: id, deger: deger };
    secimGoster(id, deger); bolumIsaretle(sec);
  };
  document.addEventListener("input", function (e) { var t = e.target; if (t.closest && !muaf(t) && t.type !== "search") bolumIsaretle(t.closest("section.a-bolum")); });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#a-ayarlar") || t.type === "search") return;
    if (muaf(t)) { uygula(t); return; }
    taslakEkle(t);
    if (YENIDEN.some(function (a) { return t.hasAttribute(a); })) { var k = secici(t), v = t.value; ayarCiz(); var q = document.querySelector(t.type === "radio" ? k + '[value="' + v + '"]' : k); if (q) q.focus(); }
  });
  MK.goster = function () { ayarCiz(); };
  MK.kabuk({ modul: 22, kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  ayarCiz();
})();
