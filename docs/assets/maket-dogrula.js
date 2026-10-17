/* ══ probata MAKET — Rapor doğrulama sayfası · ONAY BEKLİYOR (IMZA-SERVISI.md §4, ES1 — 2026-10-17) ═══════════════════════════════════════
   Reisim: "doğrulamaya tıklayınca nereye gidecek mesela müşteri" · "eğer bu belgede varsa bizde koyucaz" (incelenen gerçek imzalı belgenin
   beş katmanı) · "şimdilik bu kararları erteleyelim … sırayla yapıp bitir". Raporun alt şeridindeki karekod bu sayfayı açar; oturum yok.
   2. tur (2026-10-17, reisim: "imzalayanların adı gözüksün, elimdeki pdf bu mu ? sorusu ve pdf yükleme alanı altında pdf in görüntüsü olsun ve
   bu ekrandaki şeyler açılır kapanır olsun" — örnek olarak incelenen aracı firmanın doğrulama sitesi):
   · AÇILIŞ — doğrulama kodu (karekoddan dolu gelir; kâğıttaki kısa kod elle de yazılır) + bilgilendirme onayı + "Belgeyi doğrula" (örnekteki
     akış). Onay kutusu işaretlenmeden basılırsa neden yazılır (tuş soluk değil);
   · İMZALAR — imzalayanın ADI, görevi, imza saati (zaman damgasından), nitelikli sertifika ve sağlayıcısı;
   · AÇILIR KAPANIR BÖLÜMLER — Rapor · İmzalar · Güvence katmanları · Elinizdeki PDF bu mu? · Raporun görüntüsü; kapalıyken başlıkta özet
     (ör. "5 / 5 sağlam"); "Hepsini aç / kapat";
   · ELİNİZDEKİ PDF BU MU? — dosya cihazdan çıkmaz: parmak izi (SHA-256) tarayıcıda çıkarılır, e-imzalı kopyaların parmak izleriyle
     karşılaştırılır (arşiv damgası tazelenince dosya değişir — eski kopyalar da tanınır). Makette seçilen her PDF'in parmak izi gerçekten
     hesaplanır ve "değil" çıkar; öteki sonuçlar maket seçenekleriyle görülür;
   · RAPORUN GÖRÜNTÜSÜ — yükleme alanının hemen altında e-imzalı raporun sayfaları: Küçült · Büyüt · Sola / sağa döndür · Sığdır; telefonda
     genişliğe sığar. Makette rapor uydurma (iki sayfa, ölçüm tablosu yok); uygulamada imzalı PDF'in sayfaları.
   Hâller: #/ açılış · #/gecerli · #/revizyon · #/bekliyor · #/yok. Veri uydurma; firma, kişi, numara gerçek değil. */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon;
  var R = {
    firma: "Örnek Muayene Ltd. Şti.", firmaAdres: "Organize Sanayi Bölgesi 3. Cadde No: 12, Örnek İlçe / Ankara", adres: "ornek.probata.com.tr",
    kod: "PBT7-K29Q-MX4C", no: "EL-2610-0042-01", yeniNo: "EL-2610-0042-02",
    musteri: "Deneme Plastik San. A.Ş.", tesis: "Deneme Plastik — Merkez fabrika", tesisAdres: "Deneme Mahallesi Fabrika Yolu No: 5, Örnek İlçe / Ankara",
    tur: "Elektrik tesisatı", ekipman: "ANA PANO-1", yer: "Ana bina zemin kat", kontrol: "2026-10-15", sonraki: "2027-10-15", sonuc: "Uygun",
    imza: "2026-10-17T14:32", yeniImza: "2026-10-19T10:05", arsiv: "2026-10-17T14:40", tazeleme: "2031-10-17",
    imzalar: [
      { gorev: "Muayene uzmanı", ad: "Ayşe Demir", meslek: "Elektrik mühendisi", zaman: "2026-10-17T14:32", saglayici: "Deneme Sertifika Hizmet Sağlayıcısı" },
      { gorev: "Teknik yönetici", ad: "Hakan Polat", meslek: "Elektrik mühendisi", zaman: "2026-10-17T14:38", saglayici: "Deneme Sertifika Hizmet Sağlayıcısı" },
    ],
  };
  var KRITERLER = ["Pano gövdesi, kapak ve kilit düzenleri", "Koruma iletkenleri ve eş potansiyel bağlantıları", "Kablo girişleri, rakorlar ve yalıtım",
    "Etiketleme ve uyarı işaretleri", "Kaçak akım koruma düzeninin varlığı ve test tuşu", "Termal görünüm (gözle, aşırı ısınma izi)"];
  var BOLUMLER = ["rapor", "imzalar", "katman", "pdf", "goruntu"];
  var S = { durum: null, kod: R.kod, onay: false, hata: "", karsilastirma: null, iz: null, dosya: null,
    acik: { rapor: true, imzalar: true, katman: false, pdf: true, goruntu: true }, olcek: null, aci: 0 };
  var zaman = MK.zamanYaz;

  function durum() {
    var h = window.__dgrDurum || location.hash || "#/";
    return h === "#/gecerli" ? "gecerli" : h === "#/revizyon" ? "revizyon" : h === "#/bekliyor" ? "bekliyor" : h === "#/yok" ? "yok" : "acilis";
  }
  function git(h) { if (window.__dgrDurum !== undefined) { window.__dgrDurum = h; MK.goster(true); } else location.hash = h; }

  function bas() {
    return '<header class="a-dgr-bas">' +
      '<img class="a-dgr-logo a-isaret-acik" src="../marka/probata-yatay-renkli.svg" alt="probata" width="112" height="28">' +
      '<img class="a-dgr-logo a-isaret-koyu" src="../marka/probata-yatay-koyu-zemin.svg" alt="probata" width="112" height="28">' +
      '<span class="a-dgr-adres">' + R.adres + "</span></header>";
  }
  /* AÇILIŞ: kod + bilgilendirme + onay */
  function acilis() {
    return '<section class="a-dgr-kart a-dgr-giris" aria-labelledby="dgr-baslik"><h1 id="dgr-baslik" tabindex="-1">Rapor doğrulama</h1>' +
      "<p>Raporun altındaki karekodu okuttuysanız kod hazır gelir. Kâğıttaki kodu da buraya yazabilirsiniz.</p>" +
      '<div class="a-alan-grup"><label class="a-etiket" for="dgr-kod">Doğrulama kodu</label>' +
      '<input class="a-girdi a-dgr-kod" id="dgr-kod" autocomplete="off" spellcheck="false" maxlength="40" value="' + kacis(S.kod) + '"></div>' +
      '<p class="a-dgr-yasal">Bu sayfa raporu elinde bulunduran ya da raporun ilgilisi olanların doğrulaması içindir. Yetkiniz olmadan başkasına ait bir ' +
      "raporu görüntülemeniz yasal sorumluluk doğurabilir.</p>" +
      '<label class="a-onay-kutusu" for="dgr-onay"><input type="checkbox" id="dgr-onay"' + (S.onay ? " checked" : "") + (S.hata ? ' aria-describedby="dgr-hata" aria-invalid="true"' : "") +
      "><span>Bilgilendirmeyi okudum, kabul ediyorum.</span></label>" +
      (S.hata ? '<p class="a-ipucu a-ipucu-uyari" id="dgr-hata">' + S.hata + "</p>" : "") +
      '<div class="a-dgr-tuslar">' + MK.tus({ eylem: "dogrula", ad: "Belgeyi doğrula", ikon: "shield-check" }) + "</div></section>";
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
  /* açılır kapanır bölüm: başlıkta özet, kapalıyken de durum görünür */
  function bolum(k, baslik, ozet, govde) {
    return '<details class="a-dgr-kart a-dgr-acilir" data-bolum="' + k + '"' + (S.acik[k] ? " open" : "") + ">" +
      '<summary><h2 id="dgr-' + k + '">' + baslik + "</h2>" + (ozet ? '<span class="a-dgr-ozet">' + ozet + "</span>" : "") +
      ikon("chevron-down", "a-dgr-ok") + '</summary><div class="a-dgr-icerik">' + govde + "</div></details>";
  }
  function rapor() {
    return bolum("rapor", "Rapor", MK.rozet({ rozet: "a-rozet-tamam", ad: R.sonuc }) + '<span class="a-dgr-ozet-yazi">' + R.no + "</span>",
      '<dl class="a-dgr-liste">' +
      "<dt>Rapor no</dt><dd>" + R.no + "</dd><dt>Muayene firması</dt><dd>" + R.firma + "</dd>" +
      "<dt>Ekipman</dt><dd>" + R.tur + " · " + R.ekipman + "</dd><dt>Kontrol tarihi</dt><dd>" + MK.tarihNo(R.kontrol) + "</dd>" +
      "<dt>Sonuç</dt><dd>" + R.sonuc + "</dd><dt>E-imza</dt><dd>" + zaman(R.imza) + "</dd></dl>");
  }
  function imzalar() {
    return bolum("imzalar", "İmzalar", '<span class="a-dgr-ozet-yazi">' + R.imzalar.length + " imza · nitelikli</span>",
      '<ul class="a-dgr-imzalar">' + R.imzalar.map(function (i) {
        return '<li class="a-dgr-imza">' + ikon("file-signature") + '<div><p class="a-dgr-imza-ad">' + kacis(i.ad) + "</p>" +
          '<p class="a-dgr-imza-gorev">' + i.gorev + " · " + i.meslek + "</p>" +
          "<p>" + zaman(i.zaman) + " · nitelikli elektronik sertifika · " + kacis(i.saglayici) + "</p></div></li>";
      }).join("") + "</ul>");
  }
  var KATMANLAR = [
    { ad: "Kimlik", metin: "İki imza da 5070 sayılı Kanun'a göre nitelikli elektronik sertifikayla atıldı." },
    { ad: "Bütünlük", metin: "İmzadan sonra raporda değişiklik yapılmadı." },
    { ad: "İmza saati", metin: function () { return "İmza saatleri zaman damgası sunucusundan alındı (" + zaman(R.imza) + ")."; } },
    { ad: "İptal denetimi", metin: "İmza anında sertifikalar iptal edilmemişti; kanıtı raporun içinde." },
    { ad: "Arşiv damgası", metin: function () { return "Rapor " + zaman(R.arsiv) + "'da arşiv damgasıyla mühürlendi; damga " + MK.tarihNo(R.tazeleme) + " öncesinde tazelenir."; } },
  ];
  function katmanlar(d) {
    return bolum("katman", "Güvence katmanları", MK.rozet({ rozet: "a-rozet-tamam", ad: KATMANLAR.length + " / " + KATMANLAR.length + " sağlam" }),
      (d === "revizyon" ? '<p class="a-dgr-not">Bu revizyon imzalandığı gün geçerliydi; katmanlar bu revizyonundur.</p>' : "") +
      '<ul class="a-dgr-katmanlar">' + KATMANLAR.map(function (k) {
        var m = typeof k.metin === "function" ? k.metin() : k.metin;
        return '<li class="a-dgr-katman">' + ikon("circle-check", "a-dgr-tik") + '<div><p class="a-dgr-katman-ad">' + k.ad + "</p><p>" + m + "</p></div></li>";
      }).join("") + "</ul>" +
      '<details class="a-dgr-ayrinti"><summary>' + ikon("chevron-right", "a-ikon-kucuk") + 'Ayrıntılar</summary><dl class="a-dgr-liste">' +
      "<dt>İmza biçimi</dt><dd>PAdES (ETSI EN 319 142) · uzun süreli doğrulanabilir (B-LTA)</dd>" +
      "<dt>Özet</dt><dd>SHA-256</dd><dt>Zaman damgası</dt><dd>Deneme Zaman Damgası Sunucusu (RFC 3161)</dd>" +
      "<dt>İptal kanıtı</dt><dd>2 OCSP cevabı, 1 iptal listesi (raporun DSS bölümünde)</dd></dl></details>");
  }
  /* karşılaştırma sonucu */
  var SONUCLAR = {
    ayni: ["onay", "circle-check", "Bu dosya bu raporun e-imzalı kopyası.", "a-rozet-tamam", "Aynı"],
    eski: ["onay", "circle-check", "Bu dosya bu raporun e-imzalı kopyası; daha sonra arşiv damgası tazelendi. İçerik aynı.", "a-rozet-tamam", "Aynı"],
    imzasiz: ["uyari", "triangle-alert", "Bu, raporun imzasız kopyası; geçerli değildir. E-imzalı kopyayı müşteri panelinden indirin.", "a-rozet-bekliyor", "İmzasız"],
    degil: ["hata", "circle-x", "Bu dosya bu raporun e-imzalı kopyası değil. Değiştirilmiş ya da başka bir belge olabilir.", "a-rozet-red", "Değil"],
  };
  function karsilastir() {
    var s = S.karsilastirma && SONUCLAR[S.karsilastirma];
    return bolum("pdf", "Elinizdeki PDF bu mu?", s ? MK.rozet({ rozet: s[3], ad: s[4] }) : "",
      "<p>Elinizdeki PDF'i seçin. Dosya bu cihazdan çıkmaz; yalnız parmak izi bu raporun e-imzalı kopyasıyla karşılaştırılır.</p>" +
      '<label class="a-dgr-birak" id="dgr-birak">' + ikon("upload") + "<span><b>PDF seç</b><span class=\"a-dgr-birak-ek\"> ya da buraya bırakın</span></span>" +
      '<input type="file" accept="application/pdf,.pdf" id="dgr-dosya" class="a-dgr-gizli"></label>' +
      (S.dosya ? '<p class="a-dgr-iz">' + ikon("scan-text", "a-ikon-kucuk") + kacis(S.dosya) + (S.iz ? " · parmak izi " + S.iz.slice(0, 8) + "…" + S.iz.slice(-6) : " · okunuyor…") + "</p>" : "") +
      '<div aria-live="polite">' + (s ? MK.serit(s[0], s[1], s[2]) : "") + "</div>");
  }

  /* ── RAPORUN GÖRÜNTÜSÜ: A4 sayfalar (rapor belgesinin görünümü, .rb-*), ölçek ve dönüş ── */
  var KAGIT_G = 794, KAGIT_Y = 1123;
  /* karekod yer tutucusu (görsel; uygulamada gerçek karekod): sabit desen + üç köşe işareti */
  function karekod() {
    var n = 25, h = "", t = 7;
    var kose = function (x, y) { return x < t && y < t || x >= n - t && y < t || x < t && y >= n - t; };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var dolu;
      if (kose(x, y)) { var a = x >= n - t ? x - (n - t) : x, b = y >= n - t ? y - (n - t) : y; dolu = a === 0 || b === 0 || a === 6 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); }
      else dolu = ((x * 7 + y * 13 + x * y) % 5) < 2;
      if (dolu) h += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg class="rb-karekod" viewBox="0 0 ' + n + " " + n + '" aria-hidden="true">' + h + "</svg>";
  }
  function sayfaBas() {
    return '<table class="rb-bas"><colgroup><col style="width:11%"><col style="width:29%"><col style="width:10%"><col style="width:28%"><col style="width:22%"></colgroup><tr>' +
      '<td class="rb-logo">LOGO</td><td class="rb-firma"><b>' + R.firma + "</b><br>" + R.firmaAdres + '</td><td class="rb-logo">AKR.</td>' +
      '<td class="rb-bas-ad">ELEKTRİK TESİSATI PERİYODİK KONTROL RAPORU</td>' +
      '<td class="rb-dok"><div><span>Doküman Kodu</span>: ORN-FR-ELK-01</div><div><span>Format sürümü</span>: 3</div><div><span>Rapor No</span>: ' + R.no + "</div>" +
      "<div><span>Rapor Tarihi</span>: " + MK.tarihNo(R.kontrol) + "</div></td></tr></table>";
  }
  function serit(sayfa, toplam) {
    return '<div class="rb-serit">' + karekod() + "<div><p>Bu rapor 5070 sayılı Elektronik İmza Kanunu'na uygun güvenli elektronik imza ile imzalanmıştır.</p>" +
      "<p>Doğrulama: karekod ya da " + R.adres + "/dogrula · kod <b>" + R.kod + "</b></p></div>" +
      '<p class="rb-serit-no">' + R.no + " · Sayfa " + sayfa + " / " + toplam + "</p></div>";
  }
  var satir = function (a, b, c, d) { return "<tr><td class=\"rb-e\">" + a + "</td><td>" + b + "</td>" + (c ? '<td class="rb-e">' + c + "</td><td>" + d + "</td>" : "") + "</tr>"; };
  function sayfalar() {
    var b = function (no, ad) { return '<tr><td class="rb-bb" colspan="4">' + no + ". " + ad + "</td></tr>"; };
    var s1 = '<div class="rb-sayfa">' + sayfaBas() +
      "<table>" + b(1, "FİRMA BİLGİLERİ") +
      satir("Firma adı", R.musteri, "Rapor numarası", R.no) + satir("Periyodik kontrol adresi", R.tesisAdres, "Rapor tarihi", MK.tarihNo(R.kontrol)) +
      satir("Başlangıç tarihi ve saati", MK.tarihNo(R.kontrol) + " 09:30", "Bitiş tarihi ve saati", MK.tarihNo(R.kontrol) + " 11:10") +
      satir("Bir sonraki periyodik kontrol tarihi", MK.tarihNo(R.sonraki), "Periyodik kontrol metodu", "TS HD 60364-6") + "</table>" +
      "<table>" + b(2, "EKİPMAN BİLGİLERİ") + satir("Ekipman kodu", R.ekipman, "Ekipman türü", R.tur) + satir("Kullanım yeri", R.yer, "Tesis", R.tesis) + "</table>" +
      '<table><colgroup><col style="width:8%"><col><col style="width:16%"></colgroup><tr><td class="rb-bb" colspan="3">3. MUAYENE KRİTERLERİ</td></tr>' +
      '<tr><td class="rb-e rb-orta">No</td><td class="rb-e">Kontrol maddesi</td><td class="rb-e">Sonuç</td></tr>' + KRITERLER.map(function (k, i) { return '<tr><td class="rb-orta">' + (i + 1) + "</td><td>" + k + "</td><td>Uygun</td></tr>"; }).join("") + "</table>" +
      "<table>" + '<tr><td class="rb-bb">4. KUSUR AÇIKLAMALARI</td></tr><tr><td>Kusur yok.</td></tr></table>' +
      serit(1, 2) + "</div>";
    var imza = function (i) {
      return '<tr><td class="rb-e">' + i.gorev + "</td><td>" + kacis(i.ad) + '</td><td class="rb-e">Mesleği</td><td>' + i.meslek + "</td></tr>" +
        '<tr><td class="rb-e">İmza</td><td colspan="3" class="rb-imza-yeri"><span class="rb-eimza">' + ikon("file-signature", "a-ikon-kucuk") +
        "E-imzalı · " + zaman(i.zaman) + "</span></td></tr>";
    };
    var s2 = '<div class="rb-sayfa">' + sayfaBas() +
      '<table><tr><td class="rb-bb">5. SONUÇ VE KANAAT</td></tr><tr><td>Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen ' +
      "elektrik tesisatının muayenesi sonrasında mevcut şartlar altında kullanımı <b>uygundur</b>.</td></tr></table>" +
      "<table>" + b(6, "YETKİLİ KİŞİLER VE İMZALAR") + R.imzalar.map(imza).join("") + "</table>" + serit(2, 2) + "</div>";
    return [s1, s2];
  }
  /* sığdır: kâğıt kabın iç genişliğine (iç boşluk çıkar); en çok %100, en az %30 */
  function sigdir() {
    var k = $("dgr-kagitlar"); if (!k) return 1;
    var ic = k.clientWidth - 2 * parseFloat(getComputedStyle(k).paddingLeft) - 2;
    return Math.min(1, Math.max(0.3, ic / (S.aci % 180 ? KAGIT_Y : KAGIT_G)));
  }
  function kagitlariYerlestir() {
    var k = $("dgr-kagitlar"); if (!k) return;
    var s = S.olcek || sigdir(), dik = S.aci % 180 !== 0, w = KAGIT_G * s, h = KAGIT_Y * s;
    var cev = { 0: "", 90: "translateX(" + h + "px) ", 180: "translate(" + w + "px," + h + "px) ", 270: "translateY(" + w + "px) " }[S.aci];
    k.querySelectorAll(".a-dgr-kagit").forEach(function (kutu) {
      kutu.style.width = (dik ? h : w) + "px"; kutu.style.height = (dik ? w : h) + "px";
      kutu.firstChild.style.transform = cev + "rotate(" + S.aci + "deg) scale(" + s + ")";
    });
    var y = $("dgr-yuzde"); if (y) y.textContent = "%" + Math.round(s * 100);
  }
  function goruntu(d) {
    var tus = function (eylem, ik, ad, yazi, sinif) { return '<button type="button" class="a-dgr-araci" data-eylem="' + eylem + '" aria-label="' + ad + '" title="' + ad + '">' +
      (ik ? ikon(ik, sinif) : '<span aria-hidden="true">' + yazi + "</span>") + "</button>"; };
    return bolum("goruntu", "Raporun görüntüsü", '<span class="a-dgr-ozet-yazi">2 sayfa</span>',
      (d === "revizyon" ? '<p class="a-dgr-not">Bu revizyonun görüntüsü; geçerli olan ' + R.yeniNo + ".</p>" : "") +
      '<div class="a-dgr-arac" role="toolbar" aria-label="Görüntü araçları">' + tus("kucult", "", "Küçült", "−") + '<span class="a-dgr-yuzde" id="dgr-yuzde" aria-live="polite">%100</span>' +
      tus("buyut", "plus", "Büyüt") + '<span class="a-dgr-arac-ara" aria-hidden="true"></span>' + tus("sola", "rotate-ccw", "Sola döndür") + tus("saga", "rotate-ccw", "Sağa döndür", "", "a-dgr-ayna") +
      '<button type="button" class="a-dgr-araci a-dgr-araci-yazi" data-eylem="sigdir">Sığdır</button></div>' +
      '<div class="a-dgr-kagitlar" id="dgr-kagitlar" tabindex="0" aria-label="E-imzalı raporun sayfaları">' +
      sayfalar().map(function (p) { return '<div class="a-dgr-kagit">' + p + "</div>"; }).join("") + "</div>");
  }

  function maketSecenekleri() {
    var simdi = window.__dgrDurum || location.hash || "#/";
    var a = function (h, ad) { return '<a href="' + h + '"' + (simdi === h ? ' aria-current="page"' : "") + ">" + ad + "</a>"; };
    var t = function (k, ad) { return '<button type="button" class="a-dgr-mtus" data-eylem="ornek" data-k="' + k + '" aria-pressed="' + (S.karsilastirma === k) + '">' + ad + "</button>"; };
    return '<aside class="a-dgr-maket" aria-label="Maket seçenekleri"><p><b>Maket</b> · uydurma veri</p>' +
      '<p class="a-dgr-mgrup">Durum: ' + a("#/", "Açılış") + a("#/gecerli", "Geçerli") + a("#/revizyon", "Yeni revizyon") + a("#/bekliyor", "İmza bekleniyor") + a("#/yok", "Bulunamadı") + "</p>" +
      '<p class="a-dgr-mgrup">PDF sonucu: ' + t("ayni", "Aynı dosya") + t("eski", "Eski kopya") + t("imzasiz", "İmzasız kopya") + t("degil", "Değil") + "</p></aside>";
  }
  function ciz() {
    var d = durum(), h = "";
    if (d === "acilis") h = acilis();
    else if (d === "yok") {
      h = '<section class="a-dgr-kart"><h1 tabindex="-1">Rapor doğrulama</h1>' + MK.serit("hata", "circle-alert",
        "Bu doğrulama kodu bulunamadı. Karekodu raporun kendisinden okuttuğunuzdan ya da kodu doğru yazdığınızdan emin olun.") +
        '<div class="a-dgr-tuslar"><a class="a-baglanti" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Kodu yeniden yaz</a></div></section>";
    } else {
      var hepsiAcik = BOLUMLER.every(function (k) { return S.acik[k]; });
      h = '<div class="a-dgr-ust"><div><h1 tabindex="-1">Rapor doğrulama</h1><p class="a-dgr-firma">' + R.firma + "</p></div>" +
        (d === "bekliyor" ? "" : '<button type="button" class="a-dgr-hepsi" data-eylem="hepsi">' + ikon(hepsiAcik ? "chevron-up" : "chevron-down", "a-ikon-kucuk") +
          (hepsiAcik ? "Hepsini kapat" : "Hepsini aç") + "</button>") + "</div>" + sonuc(d) +
        (d === "bekliyor" ? karsilastir() : rapor() + imzalar() + katmanlar(d) + karsilastir() + goruntu(d));
    }
    $("a-dgr").innerHTML = bas() + '<div class="a-dgr-govde">' + h +
      '<p class="a-dgr-alt">Bu sayfa raporun varlığını, imzalarını ve durumunu doğrular. Raporun e-imzalı PDF\'i müşterinin panelindedir.</p>' +
      maketSecenekleri() + "</div>";
    kagitlariYerlestir();
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
  document.addEventListener("change", function (e) {
    if (e.target.id === "dgr-dosya") dosyaOku(e.target.files && e.target.files[0]);
    if (e.target.id === "dgr-onay") { S.onay = e.target.checked; if (S.onay && S.hata) { S.hata = ""; ciz(); $("dgr-onay").focus(); } }
  });
  document.addEventListener("input", function (e) { if (e.target.id === "dgr-kod") S.kod = e.target.value; });
  /* bölüm açılıp kapanınca durum saklanır (yeniden çizimde korunur) — toggle kabarmaz, yakalama evresinde dinlenir */
  document.addEventListener("toggle", function (e) {
    var k = e.target.dataset && e.target.dataset.bolum; if (!k) return;
    S.acik[k] = e.target.open;
    if (k === "goruntu" && e.target.open) kagitlariYerlestir();
    var t = document.querySelector('[data-eylem="hepsi"]'); if (t) { var hepsiAcik = BOLUMLER.every(function (x) { return S.acik[x]; });
      t.innerHTML = ikon(hepsiAcik ? "chevron-up" : "chevron-down", "a-ikon-kucuk") + (hepsiAcik ? "Hepsini kapat" : "Hepsini aç"); }
  }, true);
  document.addEventListener("dragover", function (e) { if (e.target.closest && e.target.closest("#dgr-birak")) { e.preventDefault(); $("dgr-birak").classList.add("a-dgr-birak-ustte"); } });
  document.addEventListener("dragleave", function (e) { if (e.target.closest && e.target.closest("#dgr-birak")) $("dgr-birak").classList.remove("a-dgr-birak-ustte"); });
  document.addEventListener("drop", function (e) {
    if (!(e.target.closest && e.target.closest("#dgr-birak"))) return;
    e.preventDefault(); dosyaOku(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "dgr-kod") { e.preventDefault(); X.dogrula(); } });
  window.addEventListener("resize", function () { if (!S.olcek) kagitlariYerlestir(); });
  var X = MK.eylem;
  X.dogrula = function () {
    if (!S.onay) { S.hata = "Devam etmek için bilgilendirmeyi okuyup kutuyu işaretleyin."; ciz(); $("dgr-onay").focus(); return; }
    S.hata = "";
    git(S.kod.replace(/\s+/g, "").toUpperCase() === R.kod ? "#/gecerli" : "#/yok");
  };
  X.ornek = function (el) { S.karsilastirma = el.getAttribute("data-k"); S.dosya = null; S.iz = null; S.acik.pdf = true; ciz(); };
  X.hepsi = function () { var ac = !BOLUMLER.every(function (k) { return S.acik[k]; }); BOLUMLER.forEach(function (k) { S.acik[k] = ac; }); ciz(); };
  X.buyut = function () { S.olcek = Math.min(2, (S.olcek || sigdir()) * 1.25); kagitlariYerlestir(); };
  X.kucult = function () { S.olcek = Math.max(0.3, (S.olcek || sigdir()) / 1.25); kagitlariYerlestir(); };
  X.sigdir = function () { S.olcek = null; kagitlariYerlestir(); };
  X.saga = function () { S.aci = (S.aci + 90) % 360; kagitlariYerlestir(); };
  X.sola = function () { S.aci = (S.aci + 270) % 360; kagitlariYerlestir(); };
  MK.goster = function (odakla) {
    S.karsilastirma = null; S.dosya = null; S.iz = null; ciz();
    if (odakla !== false) { var h1 = document.querySelector(".a-dgr h1"); if (h1) h1.focus({ preventScroll: true }); }
  };
  ciz();
})();
