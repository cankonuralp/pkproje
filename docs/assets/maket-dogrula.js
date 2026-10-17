/* ══ probata MAKET — Rapor doğrulama sayfası · ONAY BEKLİYOR (IMZA-SERVISI.md §4, ES1 — 2026-10-17) ═══════════════════════════════════════
   Reisim: "doğrulamaya tıklayınca nereye gidecek mesela müşteri" · "eğer bu belgede varsa bizde koyucaz" (incelenen gerçek imzalı belgenin
   beş katmanı) · "şimdilik bu kararları erteleyelim … sırayla yapıp bitir". Raporun alt şeridindeki karekod bu sayfayı açar; oturum yok.
   Bugünkü sayfa (595 K8): rapor no, firma, ekipman, kontrol tarihi, sonuç, e-imza zamanı, revizyon. Eklenenler:
   · İMZALAR — her imza için görevi, imza saati (zaman damgasından), nitelikli sertifika; imzacının ADI karar bekliyor (bugünkü kural: kişi yok)
     → maket seçeneğiyle iki hâl de görülür;
   · GÜVENCE KATMANLARI — kimlik · bütünlük · imza saati · iptal denetimi · arşiv damgası; sade Türkçe, teknik ad yalnız "Ayrıntılar"da;
     değerler sunucudaki çözümleyiciden (src/server/imza/pdf-imzalar.ts) gelir;
   · ELİNİZDEKİ PDF BU MU? — dosya cihazdan çıkmaz: parmak izi (SHA-256) tarayıcıda çıkarılır, sayfanın bildiği e-imzalı kopyaların parmak
     izleriyle karşılaştırılır (arşiv damgası tazelenince dosya değişir — eski kopyalar da tanınır). Makette karşılaştırılacak gerçek dosya yok:
     seçilen her PDF'in parmak izi gerçekten hesaplanır ve "değil" çıkar; öteki sonuçlar maket seçenekleriyle görülür.
   Hâller: #/ · #/revizyon · #/bekliyor · #/yok. Veri uydurma; firma, kişi, numara gerçek değil. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon;
  var R = {
    firma: "Örnek Muayene Ltd. Şti.", adres: "ornek.probata.com.tr", no: "EL-2610-0042-01", yeniNo: "EL-2610-0042-02",
    tur: "Elektrik tesisatı", ekipman: "ANA PANO-1", kontrol: "2026-10-15", sonuc: "Uygun", imza: "2026-10-17T14:32", yeniImza: "2026-10-19T10:05",
    arsiv: "2026-10-17T14:40", tazeleme: "2031-10-17",
    imzalar: [
      { gorev: "Muayene uzmanı", ad: "Ayşe Demir", zaman: "2026-10-17T14:32", saglayici: "Deneme Sertifika Hizmet Sağlayıcısı" },
      { gorev: "Teknik yönetici", ad: "Hakan Polat", zaman: "2026-10-17T14:38", saglayici: "Deneme Sertifika Hizmet Sağlayıcısı" },
    ],
  };
  var S = { adlar: false, karsilastirma: null, iz: null, dosya: null };
  var maskele = function (ad) { return ad.split(" ").map(function (p) { return p[0] + "***"; }).join(" "); };
  var zaman = MK.zamanYaz;

  function durum() { var h = location.hash || "#/"; return h === "#/revizyon" ? "revizyon" : h === "#/bekliyor" ? "bekliyor" : h === "#/yok" ? "yok" : "gecerli"; }

  function bas() {
    return '<header class="a-dgr-bas">' +
      '<img class="a-dgr-logo a-isaret-acik" src="../marka/probata-yatay-renkli.svg" alt="probata" width="112" height="28">' +
      '<img class="a-dgr-logo a-isaret-koyu" src="../marka/probata-yatay-koyu-zemin.svg" alt="probata" width="112" height="28">' +
      '<span class="a-dgr-adres">' + R.adres + "</span></header>";
  }
  function sonuc(d) {
    if (d === "gecerli") return '<div class="a-dgr-sonuc a-dgr-sonuc-tamam">' + ikon("shield-check") +
      "<div><p class=\"a-dgr-sonuc-baslik\">E-imzalı · geçerli</p><p>Bu rapor nitelikli e-imzayla imzalandı ve imzalandığından beri değişmedi.</p></div></div>";
    if (d === "revizyon") return '<div class="a-dgr-sonuc a-dgr-sonuc-red">' + ikon("history") +
      '<div><p class="a-dgr-sonuc-baslik">Yeni revizyonu var</p><p>Bu raporun yerine geçen <b>' + R.yeniNo + "</b> " + zaman(R.yeniImza) +
      "'da e-imzalandı. Geçerli olan yeni revizyondur.</p></div></div>";
    return '<div class="a-dgr-sonuc a-dgr-sonuc-bekliyor">' + ikon("clock") +
      "<div><p class=\"a-dgr-sonuc-baslik\">İmza bekleniyor</p><p><b>" + R.no + "</b> numaralı rapor " + R.firma +
      " tarafından imzaya hazırlandı; e-imzalı hâli henüz yüklenmedi. İmzasız kopya geçerli değildir.</p></div></div>";
  }
  function kimlik() {
    return '<section class="a-dgr-kart" aria-labelledby="dgr-rapor"><h2 id="dgr-rapor">Rapor</h2><dl class="a-dgr-liste">' +
      "<dt>Rapor no</dt><dd>" + R.no + "</dd><dt>Muayene firması</dt><dd>" + R.firma + "</dd>" +
      "<dt>Ekipman</dt><dd>" + R.tur + " · " + R.ekipman + "</dd><dt>Kontrol tarihi</dt><dd>" + MK.tarihNo(R.kontrol) + "</dd>" +
      "<dt>Sonuç</dt><dd>" + R.sonuc + "</dd><dt>E-imza</dt><dd>" + zaman(R.imza) + "</dd></dl></section>";
  }
  function imzalar() {
    return '<section class="a-dgr-kart" aria-labelledby="dgr-imzalar"><h2 id="dgr-imzalar">İmzalar <span class="a-dgr-sayi">' + R.imzalar.length + "</span></h2>" +
      '<ul class="a-dgr-imzalar">' + R.imzalar.map(function (i) {
        return '<li class="a-dgr-imza">' + ikon("file-signature") + "<div><p class=\"a-dgr-imza-gorev\">" + i.gorev +
          (S.adlar ? " · " + kacis(i.ad) : ' · <span title="Adı gösterilmez">' + maskele(i.ad) + "</span>") + "</p>" +
          "<p>" + zaman(i.zaman) + " · nitelikli elektronik sertifika · " + kacis(i.saglayici) + "</p></div></li>";
      }).join("") + "</ul></section>";
  }
  var KATMANLAR = [
    { ad: "Kimlik", metin: "İki imza da 5070 sayılı Kanun'a göre nitelikli elektronik sertifikayla atıldı." },
    { ad: "Bütünlük", metin: "İmzadan sonra raporda değişiklik yapılmadı." },
    { ad: "İmza saati", metin: function () { return "İmza saatleri zaman damgası sunucusundan alındı (" + zaman(R.imza) + ")."; } },
    { ad: "İptal denetimi", metin: "İmza anında sertifikalar iptal edilmemişti; kanıtı raporun içinde." },
    { ad: "Arşiv damgası", metin: function () { return "Rapor " + zaman(R.arsiv) + "'da arşiv damgasıyla mühürlendi; damga " + MK.tarihNo(R.tazeleme) + " öncesinde tazelenir."; } },
  ];
  function katmanlar(d) {
    return '<section class="a-dgr-kart" aria-labelledby="dgr-katman"><h2 id="dgr-katman">Güvence katmanları</h2>' +
      (d === "revizyon" ? '<p class="a-dgr-not">Bu revizyon imzalandığı gün geçerliydi; katmanlar bu revizyonundur.</p>' : "") +
      '<ul class="a-dgr-katmanlar">' + KATMANLAR.map(function (k) {
        var m = typeof k.metin === "function" ? k.metin() : k.metin;
        return '<li class="a-dgr-katman">' + ikon("circle-check", "a-dgr-tik") + '<div><p class="a-dgr-katman-ad">' + k.ad + "</p><p>" + m + "</p></div></li>";
      }).join("") + "</ul>" +
      '<details class="a-dgr-ayrinti"><summary>Ayrıntılar</summary><dl class="a-dgr-liste">' +
      "<dt>İmza biçimi</dt><dd>PAdES (ETSI EN 319 142) · uzun süreli doğrulanabilir (B-LTA)</dd>" +
      "<dt>Özet</dt><dd>SHA-256</dd><dt>Zaman damgası</dt><dd>Deneme Zaman Damgası Sunucusu (RFC 3161)</dd>" +
      "<dt>İptal kanıtı</dt><dd>2 OCSP cevabı, 1 iptal listesi (raporun DSS bölümünde)</dd></dl></details></section>";
  }
  /* karşılaştırma sonucu */
  var SONUCLAR = {
    ayni: ["onay", "circle-check", "Bu dosya bu raporun e-imzalı kopyası."],
    eski: ["onay", "circle-check", "Bu dosya bu raporun e-imzalı kopyası; daha sonra arşiv damgası tazelendi. İçerik aynı."],
    imzasiz: ["uyari", "triangle-alert", "Bu, raporun imzasız kopyası; geçerli değildir. E-imzalı kopyayı müşteri panelinden indirin."],
    degil: ["hata", "circle-x", "Bu dosya bu raporun e-imzalı kopyası değil. Değiştirilmiş ya da başka bir belge olabilir."],
  };
  function karsilastir() {
    var s = S.karsilastirma && SONUCLAR[S.karsilastirma];
    return '<section class="a-dgr-kart" aria-labelledby="dgr-pdf"><h2 id="dgr-pdf">Elinizdeki PDF bu mu?</h2>' +
      "<p>Elinizdeki PDF'i seçin. Dosya bu cihazdan çıkmaz; yalnız parmak izi bu raporun e-imzalı kopyasıyla karşılaştırılır.</p>" +
      '<label class="a-dgr-birak" id="dgr-birak">' + ikon("upload") + "<span><b>PDF seç</b><span class=\"a-dgr-birak-ek\"> ya da buraya bırakın</span></span>" +
      '<input type="file" accept="application/pdf,.pdf" id="dgr-dosya" class="a-dgr-gizli"></label>' +
      (S.dosya ? '<p class="a-dgr-iz">' + ikon("scan-text", "a-ikon-kucuk") + kacis(S.dosya) + (S.iz ? " · parmak izi " + S.iz.slice(0, 8) + "…" + S.iz.slice(-6) : " · okunuyor…") + "</p>" : "") +
      '<div aria-live="polite">' + (s ? MK.serit(s[0], s[1], s[2]) : "") + "</div></section>";
  }
  function maketSecenekleri(d) {
    var a = function (h, ad) { return '<a href="' + h + '"' + ((location.hash || "#/") === h ? ' aria-current="page"' : "") + ">" + ad + "</a>"; };
    var t = function (k, ad) { return '<button type="button" class="a-dgr-mtus" data-eylem="ornek" data-k="' + k + '"' + (S.karsilastirma === k ? ' aria-pressed="true"' : ' aria-pressed="false"') + ">" + ad + "</button>"; };
    return '<aside class="a-dgr-maket" aria-label="Maket seçenekleri"><p><b>Maket</b> · uydurma veri</p>' +
      '<p class="a-dgr-mgrup">Durum: ' + a("#/", "Geçerli") + a("#/revizyon", "Yeni revizyon") + a("#/bekliyor", "İmza bekleniyor") + a("#/yok", "Bulunamadı") + "</p>" +
      (d === "yok" ? "" :
        '<p class="a-dgr-mgrup">İmzacı adı: <button type="button" class="a-dgr-mtus" data-eylem="adlar" aria-pressed="' + S.adlar + '">' + (S.adlar ? "Açık — gizle" : "Gizli — göster") + "</button></p>" +
        '<p class="a-dgr-mgrup">PDF sonucu: ' + t("ayni", "Aynı dosya") + t("eski", "Eski kopya") + t("imzasiz", "İmzasız kopya") + t("degil", "Değil") + "</p>") +
      "</aside>";
  }
  function ciz() {
    var d = durum(), h = "";
    if (d === "yok") {
      h = '<section class="a-dgr-kart"><h1 tabindex="-1">Rapor doğrulama</h1>' + MK.serit("hata", "circle-alert",
        "Bu doğrulama kodu bulunamadı. Karekodu raporun kendisinden okuttuğunuzdan ve adresin tam olduğundan emin olun.") + "</section>";
    } else {
      h = '<div class="a-dgr-ust"><h1 tabindex="-1">Rapor doğrulama</h1><p class="a-dgr-firma">' + R.firma + "</p></div>" + sonuc(d) +
        (d === "bekliyor" ? karsilastir() : kimlik() + imzalar() + katmanlar(d) + karsilastir());
    }
    $("a-dgr").innerHTML = bas() + '<div class="a-dgr-govde">' + h +
      '<p class="a-dgr-alt">Bu sayfa raporun varlığını ve durumunu doğrular; raporun kendisi gösterilmez. E-imzalı kopya müşterinin panelindedir.</p>' +
      maketSecenekleri(d) + "</div>";
  }
  function dosyaOku(f) {
    if (!f) return;
    S.dosya = f.name; S.iz = null; S.karsilastirma = null; ciz();
    f.arrayBuffer().then(function (b) { return crypto.subtle.digest("SHA-256", b); }).then(function (h) {
      S.iz = Array.prototype.map.call(new Uint8Array(h), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      /* makette bilinen e-imzalı kopya yok: gerçek bir dosya her zaman "değil" */
      S.karsilastirma = "degil"; ciz();
    }).catch(function () { S.iz = null; S.karsilastirma = "degil"; ciz(); });
  }
  document.addEventListener("change", function (e) { if (e.target.id === "dgr-dosya") dosyaOku(e.target.files && e.target.files[0]); });
  document.addEventListener("dragover", function (e) { if (e.target.closest && e.target.closest("#dgr-birak")) { e.preventDefault(); $("dgr-birak").classList.add("a-dgr-birak-ustte"); } });
  document.addEventListener("dragleave", function (e) { if (e.target.closest && e.target.closest("#dgr-birak")) $("dgr-birak").classList.remove("a-dgr-birak-ustte"); });
  document.addEventListener("drop", function (e) {
    if (!(e.target.closest && e.target.closest("#dgr-birak"))) return;
    e.preventDefault(); dosyaOku(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  var X = MK.eylem;
  X.adlar = function () { S.adlar = !S.adlar; ciz(); };
  X.ornek = function (el) { S.karsilastirma = el.getAttribute("data-k"); S.dosya = null; S.iz = null; ciz(); };
  MK.goster = function () { S.karsilastirma = null; S.dosya = null; S.iz = null; ciz(); var h1 = document.querySelector(".a-dgr h1"); if (h1) h1.focus({ preventScroll: true }); };
  ciz();
})();
