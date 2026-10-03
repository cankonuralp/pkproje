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
      /* Rapor saklama süresi (185, 2026-09-29 → 2026-10-03 değişti, reisim: "2 olsun" — KOD-GECIS ENGEL 11): en az 5 yıl (yasal), firma 6–20 yıla
         uzatabilir; süre dolunca imzalı rapor PDF'leri ve aylık arşiv yedekleri FİRMANIN DEPOSUNDAN silinir, 30 gün önce liste. Eski seçenekler
         (sistemde kalsın / arşive taşınsın / silinsin) kalktı: raporlar zaten firmanın deposunda düzenli arşivleniyor. */
      (function () {
        var sk = MV.saklama();
        return '<section class="a-bolum" aria-labelledby="a-b-saklama"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-saklama">Rapor saklama süresi</h2></div>' +
          '<div class="a-form"><div class="a-alan-grup"><label class="a-etiket" for="ay-yil">Saklama süresi</label>' +
            MK.secim({ id: "ay-yil", ad: "Saklama süresi", deger: String(sk.yil), secenekler: [5, 6, 7, 8, 9, 10, 15, 20].map(function (y) { return [String(y), y + " yıl" + (y === 5 ? " (yasal en az)" : "")]; }), ipucu: "Seçin" }) + "</div></div>" +
          '<p class="a-ipucu">Süre dolunca imzalı rapor PDF\'leri ve aylık arşiv yedekleri deponuzdan silinir; silinecekler 30 gün önce size listelenir.</p></section>';
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
      /* BB5 (2026-10-03, reisim: "eğer bir format varsa format yoksa el ile yükleyip gönderme seçeneği olsun"): firmanın bordro formatı; Muhasebe ›
         Maaş bordrosu gönder kişinin bordrosunu bundan, son maaş bilgisiyle oluşturur. Yoksa bordrolar kişi kişi elle yüklenir. */
      '<section class="a-bolum" aria-labelledby="a-b-bordro"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-bordro">Bordro formatı</h2></div>' +
        (MV.FIRMA.bordroFormat ? '<div class="a-dosya-sec">' + MK.dosyaAlan({ ad: MV.FIRMA.bordroFormat, degistir: "bordro-format-yukle", sil: "bordro-format-sil" }) + "</div>"
          : '<p class="a-bolum-aciklama">Bordro formatı yüklenmedi; Muhasebe bordroları kişi kişi elle yükler.</p><div class="a-eylem-cubugu a-eylem-sol">' +
            MK.tus({ eylem: "bordro-format-yukle", ad: "Bordro formatını yükle", ikon: "upload", sinif: "a-tus-ikincil" }) + "</div>") + "</section>" +
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
      bulutCiz() +   /* 2026-10-03: dar bölümlerin yanına (tek kaldığında yanında boşluk kalıyordu) */
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
        '<div class="a-eylem-cubugu a-bolum-serit">' + MK.tus({ eylem: "sg-ekle", ad: "Sabit gider ekle", ikon: "plus", sinif: "a-tus-ikincil" }) + "</div></section>" + depoCiz() + yzCiz() + personelBelgeCiz() + iceCiz();
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
  X["bordro-format-yukle"] = function () {
    MK.dosyaSec({ kabul: ".pdf,.xlsx", enCokMB: 10, ornek: "bordro-formati.pdf" }, function (ad) {
      MV.FIRMA.bordroFormat = ad; ayarCiz(); MK.bildir("Bordro formatı yüklendi; Muhasebe bordroları bundan oluşturur.");
      var b = document.querySelector('[data-eylem="bordro-format-yukle"]'); if (b) b.focus();
    });
  };
  X["bordro-format-sil"] = function () {
    MK.onayla({ baslik: "Bordro formatını kaldır", metin: "<b>" + kacis(MV.FIRMA.bordroFormat) + "</b> kaldırılır; bordrolar kişi kişi elle yüklenir.", tus: "Kaldır", tamam: function () {
      delete MV.FIRMA.bordroFormat; ayarCiz(); MK.bildir("Bordro formatı kaldırıldı."); var b = document.querySelector('[data-eylem="bordro-format-yukle"]'); if (b) b.focus();
    } });
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
    return '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-yz"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-yz">Yapay zekâ</h2>' +
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
    return '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-mbelge"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-mbelge">Müşteriye açık personel belgeleri</h2>' +
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
  /* ── DEPOLAMA VE YEDEK (2026-10-03, KOD-GECIS G2 + G3) ────────────────────────────────────────────────────────────────────────────
     Reisim: "yedekleme işlemi de ayarlardan belirlenebilir olaun saatlik günlük gb" · "yedekleme deposu olmadan şirket açılmasına izin verilmesin
     probata gün saklar gibi bir alternatif olamaz, müşteriler hukuken raporları 5 yıl arşivlemek durumunda ona göre kurgula tekrar" · "elle
     yedekleme olmasın" · "kendi depolarında da yedekleri ve raporlar düzenli arşivlensin".
     Firmanın KENDİ S3 uyumlu deposu firma açılırken bağlanır (Yönetim › Firma aç; depo yoksa firma açılmaz) — burada kesilemez, yalnız
     DEĞİŞTİRİLİR (yeni depo denenir, dosyalar ve arşiv taşınır, doğrulanınca eski depo bırakılır). Düzenli arşiv kendiliğinden: imzalanan her
     raporun PDF'i depoda arsiv/raporlar/YIL/Müşteri/ altına yazılır; yedekler arsiv/yedek/ altına seçilen sıklıkla (saatlik / günlük /
     haftalık; elle yedek yok); her ayın ilk yedeği 5 yıl saklanır. 2026-10-03 (reisim: "depoda 5 sene sonra silcek şekilde kodla , müşteri deposunu
     bağladıktan sonra siler silmez kendi bilir"): bizim kod raporları ve aylık yedekleri 5 yıl dolmadan silmez, 5 yıl dolunca siler (30 gün önce
     liste); firmanın kendi deposunda elle sildiği dosya firmanın sorumluluğu (depo kilidi kullanılmaz).
     Depoya erişilemezse yükleme cihazlarda bekler, yedek alınamaz; şerit söyler. Makette bağlantı taklit (kova adında "hata" → reddedilir). */
  var YEDEK_SIK = [["saatlik", "Saatlik"], ["gunluk", "Günlük"], ["haftalik", "Haftalık (Pazartesi)"]];
  var YEDEK_GUN = [30, 90, 365];
  var DP = { ac: false, hata: {}, yer: "tr" };   /* depoyu değiştir formu (taslağa girmez: kendi tuşu var) */
  var gunEkle = function (g, n) { var d = new Date(g + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  var depo = function () { return MV.FIRMA.depo || { uc: "https://depo.ornek.example", kova: "km-probata", yer: "tr", durum: "bagli", son: MK.BUGUN + "T16:30" }; };
  var depoYaz = function (d) { MV.FIRMA.depo = Object.assign({}, depo(), d); };
  function yedek() {
    var y = Object.assign({ sik: "gunluk", saat: "03", gun: 30 }, MV.FIRMA.yedek || {});
    if (!y.kayitlar) y.kayitlar = [0, 1, 2].map(function (i) { return { zaman: gunEkle(MK.BUGUN, -i) + "T03:00", tur: "oto", mb: 46 - i }; })
      .concat([{ zaman: MK.BUGUN.slice(0, 8) + "01T03:00", tur: "ay", mb: 41 }, { zaman: gunEkle(MK.BUGUN.slice(0, 8) + "01", -31).slice(0, 8) + "01T03:00", tur: "ay", mb: 38 }]);
    return y;
  }
  var yedekYaz = function (d) { MV.FIRMA.yedek = Object.assign(yedek(), d); };
  function sonrakiYedek(y) {
    var simdi = MK.simdi(), g = MK.BUGUN;
    if (y.sik === "saatlik") { var s = +MK.SAAT.slice(0, 2) + 1; return s > 23 ? gunEkle(g, 1) + "T00:00" : g + "T" + ("0" + s).slice(-2) + ":00"; }
    if (y.sik === "gunluk") { var t = g + "T" + y.saat + ":00"; return t > simdi ? t : gunEkle(g, 1) + "T" + y.saat + ":00"; }
    var gun = (8 - new Date(g + "T12:00:00").getDay()) % 7, h = gunEkle(g, gun) + "T" + y.saat + ":00";   /* Pazartesi */
    return h > simdi ? h : gunEkle(g, gun + 7) + "T" + y.saat + ":00";
  }
  var mbYaz = function (mb) { return mb >= 1024 ? (mb / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " GB" : mb + " MB"; };
  var yerAd = function (k) { return MK.DEPO_YER.filter(function (x) { return x[0] === k; })[0][1]; };
  var Y_SUT = [
    { k: "zaman", baslik: "Zaman", kart: "ust", sira: 1, hucre: function (x) { return MK.zamanYaz(x.zaman); } },
    { k: "tur", baslik: "Tür", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-kart-etiket">Tür</span>' + (x.tur === "ay" ? "Aylık arşiv" : "Otomatik"); } },
    { k: "boyut", baslik: "Boyut", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-kart-etiket">Boyut</span><span class="a-sayi">' + mbYaz(x.mb) + "</span>"; } },
    { k: "yer", baslik: "Saklama", kart: "govde", sira: 4, hucre: function (x) { return '<span class="a-kart-etiket">Saklama</span>' + (x.tur === "ay" ? MV.saklama().yil + " yıl" : yedek().gun + " gün"); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 5, hucre: function (x) { return MK.tus({ eylem: "yedek-indir", ad: "İndir", ikon: "download", sinif: "a-tus-ikincil", veri: { zaman: x.zaman } }); } }
  ];
  function depoCiz() {
    var d = depo(), y = yedek(), ok = d.durum !== "erisilemiyor";
    var KUL = { mb: 3277, dosya: 1240, indir: 5939 };   /* uydurma: bu ayın ölçümü (09-B10) */
    var imzali = MV.RAPORLAR.filter(function (r) { return r.durum === "imzali" && !r.pasif; });
    var sonImza = imzali.map(function (r) { return (r.imza && r.imza.zaman) || ""; }).sort().pop();
    return '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-depo"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-depo">Depolama ve yedek</h2>' +
        '<span class="a-sayac">' + (ok ? "depo bağlı" : "depoya erişilemiyor") + "</span></div>" +
      (ok ? "" : MK.serit("hata", "circle-x", "Depoya erişilemiyor: yeni fotoğraf ve raporlar cihazlarda bekliyor, yedek alınamıyor. Anahtarları ve deponun ödemesini kontrol edin; gerekirse depoyu değiştirin.")) +
      '<p class="a-etiket">Firmanın deposu</p>' +
      '<dl class="a-bilgi">' + MK.bilgi("Depo", kacis(d.kova) + '<span class="a-alt-satir">' + kacis(d.uc) + " · " + yerAd(d.yer) + "</span>", "cift") +
        MK.bilgi("Durum", MK.rozet(ok ? { ad: "Erişilebilir", rozet: "a-rozet-tamam" } : { ad: "Erişilemiyor", rozet: "a-rozet-red" }) + '<span class="a-alt-satir">son deneme ' + MK.zamanYaz(d.son) + "</span>") +
        MK.bilgi("Kullanım", '<span class="a-sayi">' + mbYaz(KUL.mb) + "</span> · " + KUL.dosya.toLocaleString("tr-TR") + " dosya" + '<span class="a-alt-satir">bu ay indirme ' + mbYaz(KUL.indir) + "</span>") + "</dl>" +
      (d.yer === "diger" ? MK.serit("uyari", "triangle-alert", "Deponuz Türkiye ve AB dışında: fotoğraf, rapor ve yedekler oraya çıkar (KVKK sorumluluğu firmanın).") : "") +
      (DP.ac ? '<div class="a-depo-form"><p class="a-etiket">Yeni depo</p>' + MK.depoAlanlar("ay-depo", DP, DP.hata) +
            '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "depo-bagla", ad: "Bağlan, dene ve taşı", ikon: "log-in" }) + MK.tus({ eylem: "depo-vazgec", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + "</div></div>"
        : '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "depo-dene", ad: "Bağlantıyı dene", ikon: "refresh-cw", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "depo-degistir", ad: "Depoyu değiştir", ikon: "arrow-right-left", sinif: "a-tus-ikincil" }) + "</div>") +
      '<p class="a-etiket a-disa-gecmis-bas">Düzenli arşiv (kendiliğinden)</p>' +
      '<dl class="a-bilgi">' + MK.bilgi("Rapor arşivi", '<span class="a-kod a-depo-yol">' + kacis(d.kova) + "/arsiv/raporlar/YIL/Müşteri/</span>" + '<span class="a-alt-satir">imzalanan her rapor PDF\'i hemen yazılır</span>', "cift") +
        MK.bilgi("Arşivde", '<span class="a-sayi">' + imzali.length + "</span> imzalı rapor" + (sonImza ? '<span class="a-alt-satir">son ' + (sonImza.length > 10 ? MK.zamanYaz(sonImza) : MK.tarihYaz(sonImza)) + "</span>" : "")) +
        MK.bilgi("Otomatik silme", "Saklama süresi dolunca (" + MV.saklama().yil + " yıl)" + '<span class="a-alt-satir">raporlar ve aylık yedekler; silinecekler 30 gün önce size listelenir</span>') + "</dl>" +
      MK.serit("bilgi", "info", "probata saklama süresi dolmadan hiçbir dosyayı silmez. Deponuzda dosyaları kendiniz silerseniz geri getirilemez; bu sorumluluk firmanızındır.") +
      '<p class="a-etiket a-disa-gecmis-bas">Yedek (kendiliğinden)</p><div class="a-form a-ayar-yedek">' +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-yedek-sik">Sıklık</label>' + MK.secim({ id: "ay-yedek-sik", ad: "Yedek sıklığı", deger: y.sik, secenekler: YEDEK_SIK }) + "</div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-yedek-saat">Saat (günlük, haftalık)</label>' + MK.secim({ id: "ay-yedek-saat", ad: "Yedek saati", deger: y.saat, secenekler: Array.apply(null, Array(24)).map(function (x, i) { var s = ("0" + i).slice(-2); return [s, s + ":00"]; }) }) + "</div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="ay-yedek-gun">Yedeklerin saklanması</label>' + MK.secim({ id: "ay-yedek-gun", ad: "Yedeklerin saklanması", deger: String(y.gun), secenekler: YEDEK_GUN.map(function (g) { return [String(g), g + " gün"]; }) }) + "</div></div>" +
      '<dl class="a-bilgi">' + MK.bilgi("Yedek yeri", '<span class="a-kod a-depo-yol">' + kacis(d.kova) + "/arsiv/yedek/</span>", "cift") +
        MK.bilgi("Aylık arşiv yedeği", "Her ayın ilk yedeği " + MV.saklama().yil + " yıl") + MK.bilgi("Sonraki yedek", ok ? MK.zamanYaz(sonrakiYedek(y)) : '<span class="a-deger-yok">Depo bekleniyor</span>') + "</dl>" +
      '<p class="a-etiket a-disa-gecmis-bas">Son yedekler</p>' +
      '<div class="a-liste-kap" id="a-yedek-liste">' + MK.tablo({ baslik: "Son yedekler", sinif: "a-tablo-yedek", sutunlar: Y_SUT, kayitlar: y.kayitlar.slice(0, 6) }) + "</div></section>";
  }
  document.addEventListener("input", function (e) { var m = /^ay-depo-(uc|kova|erisim)$/.exec(e.target.id || ""); if (m) DP[m[1]] = e.target.value; });   /* yeniden çizimde yazılan kalır (gizli anahtar hariç) */
  X["depo-degistir"] = function () { DP = { ac: true, hata: {}, yer: "tr" }; ayarCiz(); $("ay-depo-uc").focus(); };
  X["depo-vazgec"] = function () { DP.ac = false; DP.hata = {}; ayarCiz(); document.querySelector('[data-eylem="depo-degistir"]').focus(); };
  X["depo-dene"] = function () {
    var d = depo(), ok = !/hata/.test(d.kova);   /* maket */
    depoYaz({ durum: ok ? "bagli" : "erisilemiyor", son: MK.simdi() }); ayarCiz(); document.querySelector('[data-eylem="depo-dene"]').focus();
    MK.bildir(ok ? "Depo erişilebilir: yazma ve okuma denendi." : "Depoya erişilemedi; anahtarları kontrol edin.");
  };
  X["depo-bagla"] = function () {
    var d = { uc: $("ay-depo-uc").value, kova: $("ay-depo-kova").value, erisim: $("ay-depo-erisim").value, gizli: $("ay-depo-gizli").value, yer: DP.yer };
    DP.uc = d.uc; DP.kova = d.kova; DP.erisim = d.erisim; DP.hata = MK.depoDenetle(d);
    var ilk = ["uc", "kova", "erisim", "gizli"].filter(function (k) { return DP.hata[k]; })[0];
    if (ilk || DP.hata.baglanti) { ayarCiz(); $(ilk ? "ay-depo-" + ilk : "ay-depo-uc").focus(); return; }
    var eski = depo().kova;
    MK.onayla({ baslik: "Depo değiştirilsin mi?", metin: "Bütün dosyalar, rapor arşivi ve yedekler " + d.kova.trim() + " deposuna taşınır; her dosya doğrulandıktan sonra " + eski + " bırakılır. Eski depodaki kopyalar silinmez.", tus: "Değiştir",
      tamam: function () {
        depoYaz({ uc: d.uc.trim(), kova: d.kova.trim(), yer: d.yer, durum: "bagli", son: MK.simdi(), anahtar: "…" + d.erisim.trim().slice(-4) });   /* gizli anahtar şifreli saklanır, bir daha gösterilmez (makette tutulmaz) */
        DP = { ac: false, hata: {}, yer: "tr" }; ayarCiz(); document.querySelector('[data-eylem="depo-degistir"]').focus();
        MK.bildir("Yeni depo bağlandı; dosyalar, arşiv ve yedekler arka planda taşınıyor.");
      } });
  };
  X["yedek-indir"] = function (el) {
    var z = el.dataset.zaman, ad = "probata-" + MV.firmaKodu().toLocaleLowerCase("tr") + "-yedek-" + z.replace("T", "-").replace(":", "") + ".zip";
    MK.indir(ad, MK.zip([["OKUBENI.txt", "probata · " + MV.FIRMA.ad + " · yedek " + MK.zamanYaz(z) + "\r\nUygulamada veritabanı dökümü ve dosya listesi bu pakette (makette örnek).\r\n"]]));
    MK.bildir("Yedek indiriliyor: " + ad);
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
  /* 2026-10-03 (reisim: "verileri dışa aktar seçeneğini de komple kaldır"): Verileri dışa aktar bölümü kalktı (S3, S4). */
  /* ── İLK KURULUM · TOPLU İÇE AKTARMA (2026-10-03, reisim: "ilk açılışta toplu excel yüklemeyi yapalım") ────────────────────────
     Firma eski listelerini Excel'den yükler: müşteri + tesis · ekipman · ölçüm cihazı · personel · araç. Her tür için şablon (sütunlar
     Türkçe, ilk satır başlık); her satır elle eklemedeki kurallarla denetlenir: eşsizlik ve zorunlu alan ENGEL (satır atlanır), öteki
     eksikler uyarı (satır girer, notu yazar). Yalnız geçerli satırlar içe aktarılır. Her içe aktarma kaydı tutulur; son içe aktarma, kayıtları
     henüz kullanılmadıysa (plan, rapor, zimmet, hesap…) "Geri al" ile kaldırılır. Sıra önerisi: önce müşteriler (ekipman tesise bağlanır).
     Uygulamada: sunucuda aynı denetim, tek işlem (hepsi ya da hiçbiri), denetim izine. */
  var IA = { tur: "musteri", dosya: "", satirlar: [] };
  var iaTr = function (s) { return MK.tr(String(s == null ? "" : s).trim()); };
  var iaTarih = function (v) { var s = MK.excelTarih(String(v == null ? "" : v).trim()), m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s); if (!m) return null;
    var iso = m[3] + "-" + m[2] + "-" + m[1], d = new Date(iso + "T12:00:00"); return isNaN(d) || d.getDate() !== +m[1] ? null : iso; };
  var iaPlaka = function (s) { return String(s || "").toLocaleUpperCase("tr").replace(/\s+/g, " ").trim(); };
  var iaKod = function (s) { return String(s || "").replace(/\s+/g, "").replace(/[a-z]/g, function (c) { return c.toUpperCase(); }); };   /* A–Z yalnız (5.5) */
  var iaTesis = function (unvan, tesisAd) {
    var m = MV.MUSTERILER.filter(function (x) { return iaTr(x.unvan) === iaTr(unvan) || iaTr(x.kisa) === iaTr(unvan); })[0];
    return m ? MV.TESISLER.filter(function (t) { return t.m === m.id && iaTr(t.ad) === iaTr(tesisAd); })[0] : null;
  };
  var YAKIT_IA = [["benzin", "Benzin"], ["dizel", "Dizel"], ["lpg", "LPG"], ["elektrik", "Elektrik"], ["hibrit", "Hibrit"]];
  var bul = function (l, v, alan) { return l.filter(function (x) { return iaTr(x[alan || "ad"]) === iaTr(v) || iaTr(x.k) === iaTr(v); })[0]; };
  /* tür: ad · şablon sütunları (* zorunlu) · örnek satır · satır denetimi (h → { ok, neden, uyari, ozet, kayit }) · içe aktarma · kullanıldı mı */
  var IA_TUR = {
    musteri: { ad: "Müşteriler ve tesisler", dosya: "musteriler", sutun: ["Müşteri ünvanı*", "Vergi dairesi", "Vergi no", "E-posta", "Tesis adı*", "Adres*", "İl*", "İlçe", "SGK DETSİS no"],
      ornek: [["Örnek Gıda San. A.Ş.", "Gebze", "1234567890", "isg@ornek-gida.example", "Merkez Fabrika", "OSB 3. Cadde No: 5", "Kocaeli", "Gebze", ""],
        ["Örnek Gıda San. A.Ş.", "Gebze", "1234567890", "isg@ornek-gida.example", "Depo", "OSB 9. Cadde No: 2", "Kocaeli", "Dilovası", ""],
        ["Deneme Metal Ltd.", "Tuzla", "", "", "Atölye", "Sanayi Sitesi B Blok No: 14", "İstanbul", "Tuzla", ""]],
      hatali: function () { return ["", "", "", "", "Şube", "Liman Yolu No: 3", "Kocaeli", "", ""]; },
      denetle: function (h, onceki) {
        var u = String(h[0] || "").trim(), t = String(h[4] || "").trim(), il = MV.ILLER.filter(function (x) { return iaTr(x) === iaTr(h[6]); })[0];
        var neden = !u ? "Müşteri ünvanı boş" : !t ? "Tesis adı boş" : !String(h[5] || "").trim() ? "Adres boş" : !il ? "İl bulunamadı" :
          iaTesis(u, t) ? "Bu tesis zaten kayıtlı" : onceki.some(function (o) { return o.ok && iaTr(o.u) === iaTr(u) && iaTr(o.t) === iaTr(t); }) ? "Dosyada aynı tesis iki kez" : "";
        var vno = String(h[2] || "").replace(/\D/g, ""), uy = [];
        if (!vno) uy.push("vergi no boş"); else if (MV.MUSTERILER.some(function (m) { return m.vno === vno && iaTr(m.unvan) !== iaTr(u); })) uy.push("vergi no başka müşteride");
        if (!String(h[8] || "").trim()) uy.push("SGK DETSİS no boş");
        var var_ = MV.MUSTERILER.filter(function (m) { return iaTr(m.unvan) === iaTr(u); })[0];
        if (var_) uy.push("müşteri kayıtlı, tesis ona eklenir");
        return { ok: !neden, neden: neden, uyari: uy.join(" · "), u: u, t: t, ozet: kacis(u) + " · " + kacis(t) + '<span class="a-alt-satir">' + kacis(il || String(h[6] || "")) + (h[7] ? " / " + kacis(h[7]) : "") + "</span>",
          h: h, il: il, vno: vno };
      },
      ekle: function (x, ids) {
        var m = MV.MUSTERILER.filter(function (k) { return iaTr(k.unvan) === iaTr(x.u); })[0];
        if (!m) { m = { id: "m" + (MV.MUSTERILER.length + 1), unvan: x.u, kisa: x.u.split(" ").slice(0, 2).join(" "), vd: String(x.h[1] || "").trim(), vno: x.vno, eposta: String(x.h[3] || "").trim(),
          tel: "", ilgili: "", acilis: MK.BUGUN, uygunsuz: 0, giris: { durum: String(x.h[3] || "").trim() ? "hazir" : "yok" } }; MV.MUSTERILER.push(m); ids.push("m:" + m.id); }
        var t = { id: "t" + (MV.TESISLER.length + 1), m: m.id, ad: x.t, adres: String(x.h[5]).trim(), ilce: String(x.h[7] || "").trim(), il: x.il, sgk: String(x.h[8] || "").replace(/\D/g, ""), ekipman: 0, son: "", sonraki: "" };
        MV.TESISLER.push(t); ids.push("t:" + t.id);
      } },
    ekipman: { ad: "Ekipmanlar", dosya: "ekipmanlar", sutun: ["Ekipman kodu*", "Ekipman türü*", "Müşteri ünvanı*", "Tesis adı*", "Kullanım yeri", "Marka", "Model", "Seri no", "İmal yılı"],
      ornek: [["HT-2001", "Hava tankı", "Ada Makina San. ve Tic. A.Ş.", "Depo", "Kompresör odası", "Örnek", "HT-500", "SN-1001", "2018"],
        ["FL-2002", "Forklift", "Ada Makina San. ve Tic. A.Ş.", "Depo", "Sevkiyat", "Örnek", "F25", "", ""]],
      hatali: function () { return [MV.EKIPMAN[0].kod, MV.tur(MV.EKIPMAN[0].tur).ad, "Ada Makina San. ve Tic. A.Ş.", "Depo", "", "", "", "", ""]; },
      denetle: function (h, onceki) {
        var kod = iaKod(h[0]), tur = bul(MV.KATALOG, h[1]), t = iaTesis(h[2], h[3]);
        var neden = !kod ? "Ekipman kodu boş" : !/^[A-Z0-9](?:[A-Z0-9]|-(?=[A-Z0-9])){2,19}$/.test(kod) ? "Kod: A–Z, 0–9, tire; 3–20 hane" :
          MV.ekipman(kod) ? "Bu kod kayıtlı" : onceki.some(function (o) { return o.ok && o.kod === kod; }) ? "Dosyada aynı kod iki kez" :
          !tur ? "Ekipman türü bulunamadı" : !t ? "Müşteri / tesis bulunamadı (önce müşterileri yükleyin)" : "";
        var yil = String(h[8] || "").trim();
        return { ok: !neden, neden: neden, uyari: yil && !/^\d{4}$/.test(yil) ? "imal yılı okunmadı, boş girer" : "", kod: kod, tur: tur, t: t, h: h,
          ozet: '<span class="a-kod">' + kacis(kod || String(h[0] || "")) + "</span> " + kacis(tur ? tur.ad : String(h[1] || "")) + '<span class="a-alt-satir">' + kacis(String(h[2] || "")) + " · " + kacis(String(h[3] || "")) + "</span>" };
      },
      ekle: function (x, ids) {
        var yil = String(x.h[8] || "").trim();
        MV.EKIPMAN.push({ kod: x.kod, tur: x.tur.k, tesis: x.t.id, konum: String(x.h[4] || "").trim(), onceki: null, ilk: true, marka: String(x.h[5] || "").trim(), model: String(x.h[6] || "").trim(),
          seri: String(x.h[7] || "").trim(), imal: /^\d{4}$/.test(yil) ? +yil : "" });
        x.t.ekipman = (x.t.ekipman || 0) + 1; ids.push("e:" + x.kod);
      } },
    cihaz: { ad: "Ölçüm cihazları", dosya: "olcum-cihazlari", sutun: ["Cihaz kodu*", "Cihaz türü*", "Marka", "Seri no", "Ölçüm aralığı", "Kalibrasyon bitişi*"],
      ornek: [["OC-201", "Topraklama ölçer", "Örnek", "CS-77001", "0–2000 Ω", "15.03.2027"], ["OC-202", "Multimetre", "Örnek", "CS-77002", "", "01.11.2026"]],
      hatali: function () { var c = MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz"; })[0]; return [c.env, c.ad, "", "", "", "01.01.2027"]; },
      denetle: function (h, onceki) {
        var env = String(h[0] || "").trim().toLocaleUpperCase("tr"), ct = bul(MV.CIHAZ_TURLERI, h[1]), bit = iaTarih(h[5]);
        var neden = !env ? "Cihaz kodu boş" : MV.VARLIKLAR.some(function (v) { return v.tur === "cihaz" && iaTr(v.env) === iaTr(env); }) ? "Bu cihaz kodu kayıtlı" :
          onceki.some(function (o) { return o.ok && o.env === env; }) ? "Dosyada aynı kod iki kez" : !ct ? "Cihaz türü bulunamadı" : !bit ? "Kalibrasyon bitişi GG.AA.YYYY olmalı" : "";
        return { ok: !neden, neden: neden, uyari: bit && bit < MK.BUGUN ? "kalibrasyonu geçmiş" : "", env: env, ct: ct, bit: bit, h: h,
          ozet: '<span class="a-kod">' + kacis(env || String(h[0] || "")) + "</span> " + kacis(ct ? ct.ad : String(h[1] || "")) + '<span class="a-alt-satir">Kalibrasyon ' + kacis(bit ? MK.tarihYaz(bit) : String(h[5] || "")) + "</span>" };
      },
      ekle: function (x, ids) {
        var v = { id: "v" + (MV.VARLIKLAR.length + 1), tur: "cihaz", ad: x.ct.ad, cihazTur: x.ct.k, env: x.env, marka: String(x.h[2] || "").trim() || "—", model: "", seri: String(x.h[3] || "").trim(),
          aralik: String(x.h[4] || "").trim() || "—", bitis: x.bit, araSiklik: [], kal: [], ara: [], rapor: 0 };
        while (MV.varlik(v.id)) v.id = "v" + (+v.id.slice(1) + 1);
        MV.VARLIKLAR.push(v); ids.push("v:" + v.id);
      } },
    personel: { ad: "Personel", dosya: "personel", sutun: ["Ad soyad*", "Meslek*", "İşe başlama*", "E-posta", "Diploma no", "Oda sicil no", "EKİPNET no"],
      ornek: [["Deniz Yılmaz", "Elektrik mühendisi", "01.03.2021", "deniz.yilmaz@firma.example", "", "", ""], ["Ece Kara", "Makine mühendisi", "15.06.2023", "", "", "", ""]],
      hatali: function () { return ["Can Yıldırım", "Muhasebeci", "01.01.2020", "", "", "", ""]; },
      denetle: function (h, onceki) {
        var ad = String(h[0] || "").trim(), ms = bul(MV.MESLEKLER, h[1]), bas = iaTarih(h[2]), ep = String(h[3] || "").trim();
        var neden = !ad ? "Ad soyad boş" : !ms ? "Meslek bulunamadı" : !bas ? "İşe başlama GG.AA.YYYY olmalı" : bas > MK.BUGUN ? "İşe başlama ileri tarih" :
          ep && MV.PERSONEL.some(function (p) { return iaTr(p.eposta) === iaTr(ep); }) ? "Bu e-posta başka personelde" :
          ep && onceki.some(function (o) { return o.ok && iaTr(o.ep) === iaTr(ep); }) ? "Dosyada aynı e-posta iki kez" : "";
        var uy = []; if (MV.PERSONEL.some(function (p) { return iaTr(p.ad) === iaTr(ad); })) uy.push("aynı adlı personel var"); if (!String(h[6] || "").trim()) uy.push("EKİPNET no boş");
        return { ok: !neden, neden: neden, uyari: uy.join(" · "), ad: ad, ms: ms, bas: bas, ep: ep, h: h,
          ozet: kacis(ad) + '<span class="a-alt-satir">' + kacis(ms ? ms.ad : String(h[1] || "")) + (bas ? " · " + MK.tarihYaz(bas) : "") + "</span>" };
      },
      ekle: function (x, ids) {
        var p = { id: "y" + MV.PERSONEL.length, ad: x.ad, eposta: x.ep, imzaTel: "", basla: x.bas, meslek: x.ms.k, meslekMetin: "", diploma: String(x.h[4] || "").trim(), oda: String(x.h[5] || "").trim(),
          ekipnet: String(x.h[6] || "").trim(), durum: "etkin", hesap: null, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } };
        while (MV.kisi(p.id)) p.id = "y" + (+p.id.slice(1) + 1);
        MV.PERSONEL.push(p); ids.push("p:" + p.id);
      } },
    arac: { ad: "Araçlar", dosya: "araclar", sutun: ["Plaka*", "Araç türü*", "Marka*", "Model*", "Model yılı*", "Yakıt*", "Kilometre", "Muayene bitişi", "Trafik sigortası bitişi", "Kasko bitişi"],
      ornek: [["34 ABC 101", "Hafif ticari araç", "Örnek", "Van", "2021", "Dizel", "68000", "10.05.2027", "01.02.2027", ""]],
      hatali: function () { var a = MV.VARLIKLAR.filter(function (v) { return v.tur === "arac"; })[0]; return [a.plaka, a.ad, a.marka, a.model, String(a.yil), "Dizel", "", "", "", ""]; },
      denetle: function (h, onceki) {
        var p = iaPlaka(h[0]), tur = ["Binek araç", "Hafif ticari araç", "Kamyonet", "Minibüs", "Kamyon"].filter(function (t) { return iaTr(t) === iaTr(h[1]); })[0],
          yk = YAKIT_IA.filter(function (y) { return iaTr(y[1]) === iaTr(h[5]) || y[0] === iaTr(h[5]); })[0], yil = +String(h[4] || "").trim(), km = String(h[6] || "").replace(/\D/g, "");
        var ayni = function (a, b) { return a.replace(/ /g, "") === b.replace(/ /g, ""); };
        var neden = !p ? "Plaka boş" : !/^\d{2} ?[A-ZÇĞİÖŞÜ]{1,3} ?\d{2,4}$/.test(p) ? "Plaka 34 ABC 123 biçiminde" :
          MV.VARLIKLAR.some(function (v) { return v.tur === "arac" && ayni(iaPlaka(v.plaka), p); }) ? "Bu plaka kayıtlı" : onceki.some(function (o) { return o.ok && ayni(o.p, p); }) ? "Dosyada aynı plaka iki kez" :
          !tur ? "Araç türü bulunamadı" : !String(h[2] || "").trim() || !String(h[3] || "").trim() ? "Marka ve model zorunlu" : !(yil >= 1980 && yil <= +MK.BUGUN.slice(0, 4) + 1) ? "Model yılı geçersiz" : !yk ? "Yakıt bulunamadı" : "";
        var bel = [7, 8, 9].map(function (i) { return String(h[i] || "").trim() ? iaTarih(h[i]) : ""; });
        return { ok: !neden, neden: neden, uyari: bel.some(function (b) { return b === null; }) ? "okunmayan belge tarihi boş girer" : "", p: p, tur: tur, yk: yk, yil: yil, km: km, bel: bel, h: h,
          ozet: '<span class="a-kod">' + kacis(p || String(h[0] || "")) + "</span> " + kacis(String(h[2] || "") + " " + String(h[3] || "")) + '<span class="a-alt-satir">' + kacis(tur || String(h[1] || "")) + "</span>" };
      },
      ekle: function (x, ids) {
        var n = 1; while (MV.varlik("a" + n)) n++;
        var v = { id: "a" + n, tur: "arac", ad: x.tur, plaka: x.p, marka: String(x.h[2]).trim(), model: String(x.h[3]).trim(), yil: x.yil, yakit: x.yk[0], muayene: x.bel[0] || "", sigorta: x.bel[1] || "", kasko: x.bel[2] || "", bakimKm: null };
        if (x.km) v.ilkKm = +x.km;
        MV.VARLIKLAR.push(v); ids.push("a:" + v.id);
      } }
  };
  /* geri alma: kayıt sonradan kullanıldıysa (plan, rapor, zimmet, hesap, km) geri alınmaz — elle silinir / pasife alınır */
  var kullanildi = function (r) {
    var t = r.slice(0, 1), id = r.slice(2);
    if (t === "m") return MV.TESISLER.some(function (x) { return x.m === id && (x.plan || MV.EKIPMAN.some(function (e) { return e.tesis === x.id; })); }) || (MV.TEKLIFLER || []).some(function (x) { return x.m === id; });
    if (t === "t") return MV.EKIPMAN.some(function (e) { return e.tesis === id; }) || MV.ACILAN_PLANLAR.some(function (p) { return p.tesis === id; });
    if (t === "e") return MV.RAPORLAR.some(function (x) { return x.kod === id; });
    if (t === "v" || t === "a") return MV.ZIMMET.some(function (z) { return z.v === id; }) || (MV.KM_KAYIT || []).some(function (k) { return k.v === id; });
    if (t === "p") { var p = MV.kisi(id); return !!(p && p.hesap) || MV.ZIMMET.some(function (z) { return z.alan === id || z.eden === id; }) || MV.RAPORLAR.some(function (x) { return x.kisi === id; }); }
    return false;
  };
  function iceCiz() {
    var T = IA_TUR[IA.tur], ok = IA.satirlar.filter(function (x) { return x.ok; }), gecmis = (MV.FIRMA.iceAktarim || []), son = gecmis[0];
    return '<section class="a-bolum a-ayar-genis" aria-labelledby="a-b-ice"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-b-ice">Toplu içe aktarma (ilk kurulum)</h2></div>' +
      '<div class="a-form"><div class="a-alan-grup"><label class="a-etiket" for="ay-ia-tur">Ne yüklenecek</label>' +
        MK.secim({ id: "ay-ia-tur", ad: "Ne yüklenecek", deger: IA.tur, secenekler: Object.keys(IA_TUR).map(function (k) { return [k, IA_TUR[k].ad]; }), ipucu: "Seçin" }) + "</div></div>" +
      '<p class="a-etiket a-ia-sutun">Sütunlar: ' + T.sutun.map(kacis).join(" · ") + "</p>" +
      '<div class="a-dosya-sec">' + MK.tus({ eylem: "ia-sablon", ad: "Şablonu indir", ikon: "file-spreadsheet", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "ia-sec", ad: IA.dosya ? "Başka dosya seç" : "Excel seç", ikon: "upload", sinif: "a-tus-ikincil" }) +
        '<span class="a-dosya-ad">' + (IA.dosya ? kacis(IA.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
      (IA.dosya ? '<p class="a-ia-ozet" id="a-ia-ozet"><b>' + ok.length + "</b> satır içe aktarılacak · <b>" + (IA.satirlar.length - ok.length) + "</b> satır atlanacak</p>" +
        '<div class="a-excel-kap">' + MK.tablo({ baslik: "Satır denetimi", sinif: "a-tablo-ia", sutunlar: [
          { k: "no", baslik: "Satır", hucre: function (x) { return String(x.no); } },
          { k: "kayit", baslik: "Kayıt", hucre: function (x) { return x.ozet; } },
          { k: "durum", baslik: "Durum", hucre: function (x) { return x.ok ? '<span class="a-rozet a-rozet-tamam">Eklenecek</span>' + (x.uyari ? '<span class="a-alt-satir a-uyari-metin">' + kacis(x.uyari) + "</span>" : "") :
            '<span class="a-uyari-metin a-hata-metin">' + kacis(x.neden) + "</span>"; } }], kayitlar: IA.satirlar }) + "</div>" +
        '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "ia-aktar", ad: "İçe aktar (" + ok.length + ")", ikon: "check", kapali: !ok.length }) +
          MK.tus({ eylem: "ia-temizle", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + "</div>" : "") +
      (gecmis.length ? '<p class="a-etiket a-disa-gecmis-bas">Son içe aktarımlar</p><ul class="a-disa-gecmis">' + gecmis.slice(0, 5).map(function (g, i) {
        return "<li>" + MK.zamanYaz(g.zaman) + " · " + kacis(IA_TUR[g.tur].ad) + " · " + g.adet + " kayıt" + (g.geri ? ' <span class="a-alt-satir">geri alındı</span>' : "") +
          (i === 0 && !g.geri ? " " + MK.tus({ eylem: "ia-geri", ad: "Geri al", ikon: "undo-2", sinif: "a-tus-ikincil a-tus-kucuk" }) : "") + "</li>"; }).join("") + "</ul>" : "") +
      "</section>";
  }
  var iaYenile = function (odak) { ayarCiz(); var e = odak && document.querySelector(odak); if (e) e.focus({ preventScroll: false }); };
  var iaSatirlar = function (ham) {
    if (ham.length && /\*|ünvan|kod|ad soyad|plaka/i.test(String(ham[0][0] || ""))) ham = ham.slice(1);
    ham = ham.filter(function (h) { return h.some(function (c) { return String(c == null ? "" : c).trim(); }); });
    var l = []; ham.forEach(function (h, i) { var x = IA_TUR[IA.tur].denetle(h, l); x.no = i + 2; x.id = String(i); l.push(x); }); return l;
  };
  X["ia-sablon"] = function () { var T = IA_TUR[IA.tur]; MK.indir(T.dosya + "-yukleme-sablonu.xlsx", MK.xlsx(T.ad, [T.sutun].concat(T.ornek))); };
  X["ia-sec"] = function () {
    MK.dosyaSec({ kabul: ".xlsx,.csv", ornek: IA_TUR[IA.tur].dosya + ".xlsx" }, function (ad, f) {
      var bitir = function (ham) { IA.dosya = ad; IA.satirlar = iaSatirlar(ham); iaYenile('[data-eylem="ia-aktar"]:not([disabled])') ; if (!document.activeElement || document.activeElement === document.body) iaYenile("#a-ia-ozet"); };
      /* maket: dosya penceresi yerine şablonun örnek satırları + denetimi göstermek için bir hatalı satır (şablonun kendisi temiz) */
      if (!f) { bitir([IA_TUR[IA.tur].sutun].concat(IA_TUR[IA.tur].ornek, [IA_TUR[IA.tur].hatali()])); return; }
      MK.tabloOku(f).then(bitir).catch(function () { MK.bildir(ad + " okunamadı; .xlsx ya da .csv seçin."); });
    });
  };
  X["ia-temizle"] = function () { IA.dosya = ""; IA.satirlar = []; iaYenile('[data-eylem="ia-sec"]'); };
  X["ia-aktar"] = function () {
    var T = IA_TUR[IA.tur], ok = IA.satirlar.filter(function (x) { return x.ok; }), atla = IA.satirlar.length - ok.length, ids = [];
    if (!ok.length) return;
    ok.forEach(function (x) { T.ekle(x, ids); });
    var ben = MV.kisi(MK.BEN);
    MV.FIRMA.iceAktarim = [{ zaman: MK.simdi(), tur: IA.tur, adet: ok.length, kim: ben ? ben.ad : "—", dosya: IA.dosya, ids: ids }].concat(MV.FIRMA.iceAktarim || []);
    IA.dosya = ""; IA.satirlar = [];
    iaYenile('[data-eylem="ia-geri"]');
    MK.bildir(T.ad + ": " + ok.length + " kayıt içe aktarıldı" + (atla ? "; " + atla + " satır atlandı." : "."));
  };
  X["ia-geri"] = function () {
    var g = (MV.FIRMA.iceAktarim || [])[0]; if (!g || g.geri) return;
    var dolu = g.ids.filter(kullanildi);
    if (dolu.length) { MK.bildir("Geri alınamaz: içe aktarılan " + dolu.length + " kayıt kullanılmaya başlandı (plan, rapor, zimmet ya da hesap). Kayıtları tek tek düzeltin ya da pasife alın."); return; }
    MK.onayla({ baslik: "İçe aktarmayı geri al", metin: kacis(IA_TUR[g.tur].ad) + ": " + g.adet + " kayıt kaldırılır.", tus: "Geri al", tamam: function () {
      g.ids.forEach(function (r) {
        var t = r.slice(0, 1), id = r.slice(2), sil = function (l, f) { var i = l.findIndex(f); if (i >= 0) l.splice(i, 1); };
        if (t === "m") sil(MV.MUSTERILER, function (x) { return x.id === id; });
        if (t === "t") sil(MV.TESISLER, function (x) { return x.id === id; });
        if (t === "e") { var e = MV.ekipman(id), ts = e && MV.tesis(e.tesis); if (ts) ts.ekipman = Math.max(0, (ts.ekipman || 1) - 1); sil(MV.EKIPMAN, function (x) { return x.kod === id; }); }
        if (t === "v" || t === "a") sil(MV.VARLIKLAR, function (x) { return x.id === id; });
        if (t === "p") sil(MV.PERSONEL, function (x) { return x.id === id; });
      });
      g.geri = MK.simdi();
      iaYenile("#a-b-ice"); MK.bildir(IA_TUR[g.tur].ad + ": içe aktarma geri alındı (" + g.adet + " kayıt).");
    } });
  };
  function secimUygula(id, deger) {
    var m;
    if (id === "ay-bulut-s") { bulutYaz({ saglayici: deger, bagli: false, hesap: "" }); ayarCiz(); $(id).focus(); MK.bildir("Bulut: " + MV.BULUT_SAGLAYICI.filter(function (x) { return x[0] === deger; })[0][1] + "; hesabı bağlayın."); return; }
    if (id === "ay-bulut-d") { bulutYaz({ duzen: deger }); ayarCiz(); $(id).focus(); MK.bildir("Klasör düzeni: " + MV.BULUT_DUZEN.filter(function (x) { return x[0] === deger; })[0][1] + "."); return; }
    if (id === "ay-yedek-sik") { yedekYaz({ sik: deger }); ayarCiz(); $(id).focus(); MK.bildir("Yedek: " + YEDEK_SIK.filter(function (x) { return x[0] === deger; })[0][1].toLocaleLowerCase("tr") + "."); return; }
    if (id === "ay-yedek-saat") { yedekYaz({ saat: deger }); ayarCiz(); $(id).focus(); MK.bildir("Yedek saati " + deger + ":00."); return; }
    if (id === "ay-yedek-gun") { yedekYaz({ gun: +deger }); ayarCiz(); $(id).focus(); MK.bildir("Yedekler " + deger + " gün saklanır."); return; }
    if (id === "ay-nusha") { MV.FIRMA.nusha = +deger; ayarCiz(); $(id).focus(); MK.bildir("Rapor nüsha sayısı " + deger + "."); return; }
    if (id === "ay-yil") { MV.FIRMA.saklama = { yil: +deger }; ayarCiz(); $(id).focus(); MK.bildir("Saklama süresi " + deger + " yıl."); return; }   /* 5 taban: listede 5'ten kısa yok */
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
    if (t.dataset && t.dataset.kunye) {   /* firma künyesi: alandan çıkınca kaydedilir */
      var kk = t.dataset.kunye, od0 = t.id; MV.FIRMA[kk] = t.value.trim(); ayarCiz(); var o0 = $(od0); if (o0) o0.focus();
      MK.bildir(KUNYE.filter(function (x) { return x[0] === kk; })[0][1] + " kaydedildi."); return;
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
  var muaf = function (t) { return t.id === "ay-yz-anahtar" || !!t.closest(".a-belge-ekle") || !!t.closest(".a-depo-form") || !t.closest("#a-ayarlar"); };
  var YENIDEN = ["data-yz-acik", "data-mesai-acik"];   /* alan açıp kapatan seçimler: taslakta da yeniden çizilir */
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
    if (id === "ay-depo-yer") { DP.yer = deger; ["uc", "kova", "erisim"].forEach(function (k) { var e = $("ay-depo-" + k); if (e) DP[k] = e.value; }); ayarCiz(); $(id).focus(); return; }   /* depoyu değiştir formu: taslağa girmez */
    if (id === "ay-ia-tur") { IA.tur = deger; IA.dosya = ""; IA.satirlar = []; iaYenile("#ay-ia-tur"); return; }   /* içe aktarma türü: bölüm kaydı değil */
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
