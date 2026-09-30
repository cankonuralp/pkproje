/* ══ probata MAKET · Hesabım (R2, 2026-09-30) — ONAY BEKLİYOR ═══════════════════════════════════════════════════════════════════
   Reisim 2026-09-30: "giriş sayfası, profil , şifre değiştirme, hesap oluşturma, parolamı unuttum gibi temel şeyleri atladık". Giriş,
   parolamı unuttum ve geçici parolayla ilk giriş M1'de vardı (giris.html) ama hiçbir yerden bağlantısı yoktu; artık üst çubuktaki kullanıcı
   menüsünde Hesabım ve Çıkış yap var, Çıkış giriş sayfasına döner. Bu sayfa giriş yapan kişinin kendi hesabı:
   · kişisel bilgiler (Personel kaydından, salt okunur; değişikliği firma yöneticisi Personel kartında yapar) · mobil imza telefonu (kişi
     kendisi değiştirir; mobil imza isteği bu numaraya gider) · parola değiştir (kural girişteki gibi: en az 10 karakter, harf ve rakam;
     makette mevcut parolada "hata" geçerse yanlış sayılır) · oturum: çıkış.
   Anayasa 5.3: parola alanlarına genel tuş dinleyicisi dokunmaz; değerler yalnız "Parolayı değiştir"e basınca okunur. Adres: #/ */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, X = MK.eylem;
  var H = { hata: {}, tel: null };
  var ben = function () { return MV.kisi(MK.BEN); };
  var satir = function (dt, dd) { return '<div class="a-satir"><dt>' + dt + "</dt><dd>" + dd + "</dd></div>"; };
  function parola(id, etiket, ipucu, hata, oto) {
    return '<div class="a-alan-grup"><label class="a-etiket" for="' + id + '">' + etiket + "</label>" +
      '<input class="a-girdi" id="' + id + '" type="password" autocomplete="' + oto + '" maxlength="128" aria-describedby="' + id + '-ipucu"' + (hata ? ' aria-invalid="true"' : "") + ">" +
      '<p class="a-ipucu' + (hata ? " a-ipucu-uyari" : "") + '" id="' + id + '-ipucu">' + (hata || ipucu) + "</p></div>";
  }
  function ciz() {
    var p = ben(), h = H.hata;
    if (!p) { $("a-hesap").innerHTML = "<p class=\"a-bos-satir\">Hesap bulunamadı.</p>"; return; }
    var roller = (p.hesap && p.hesap.roller || []).map(function (k) { return (MV.ROLLER.filter(function (r) { return r.k === k; })[0] || {}).ad; }).filter(Boolean);
    $("a-hesap").innerHTML =
      '<section class="a-bolum" aria-labelledby="h-b-kisi"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="h-b-kisi">Kişisel bilgiler</h2></div>' +
        '<dl class="a-satirlar">' + satir("Ad soyad", kacis(p.ad)) + satir("E-posta (giriş adı)", kacis(p.eposta)) + satir("Meslek", kacis(MV.meslekAd(p))) +
          satir("Roller", roller.length ? kacis(roller.join(" · ")) : '<span class="a-deger-yok">—</span>') + satir("İşe başlama", MK.tarihYaz(p.basla)) + "</dl>" +
        '<p class="a-ipucu">Bu bilgileri firma yöneticisi Personel kartında değiştirir.</p>' +
        '<div class="a-form">' + MK.alan({ id: "h-tel", etiket: "Mobil imza telefonu", hata: h.tel, sonuc: h.tel ? "" : "Mobil imza isteği bu numaraya gider.",
          girdi: MK.girdi({ id: "h-tel", deger: H.tel != null ? H.tel : p.imzaTel || "", sinif: "a-girdi-sicil", hata: h.tel, ek: ' type="tel" inputmode="tel" maxlength="14" placeholder="05XX XXX XX XX" data-hesap-tel' }) }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="h-b-parola"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="h-b-parola">Parola</h2></div>' +
        '<div class="a-form a-form-tek">' + parola("h-p0", "Mevcut parola", "Değiştirmek için önce mevcut parolanız.", h.p0, "current-password") +
          parola("h-p1", "Yeni parola", "En az 10 karakter; harf ve rakam içerir.", h.p1, "new-password") +
          parola("h-p2", "Yeni parola (tekrar)", "Aynısını yazın.", h.p2, "new-password") + "</div>" +
        '<div class="a-eylem-cubugu a-eylem-sol">' + MK.tus({ eylem: "parola-degistir", ad: "Parolayı değiştir", ikon: "key-round" }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="h-b-oturum"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="h-b-oturum">Oturum</h2></div>' +
        '<dl class="a-satirlar">' + satir("Adres", "ornek.probata.com.tr") + satir("Bu cihaz", "Açık oturum") + "</dl>" +
        '<div class="a-eylem-cubugu a-eylem-sol"><a class="a-tus a-tus-ikincil" href="' + MK.adres("giris", "#/") + '" data-cikis>' + ikon("log-out", "a-ikon-kucuk") + "Çıkış yap</a></div></section>";
  }
  X["parola-degistir"] = function () {
    var p0 = $("h-p0").value, p1 = $("h-p1").value, p2 = $("h-p2").value, h = {};
    if (!p0) h.p0 = "Mevcut parolayı yazın.";
    else if (/hata/.test(p0)) h.p0 = "Mevcut parola yanlış.";   /* maket: "hata" geçen parola yanlış */
    if (p1.length < 10 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(p1) || !/\d/.test(p1)) h.p1 = "En az 10 karakter; harf ve rakam içermeli.";
    else if (p1 === p0) h.p1 = "Yeni parola mevcut paroladan farklı olmalı.";
    else if (p1 !== p2) h.p2 = "İki parola aynı değil.";
    H.hata = Object.assign({ tel: H.hata.tel }, h); ciz();
    var ilk = ["p0", "p1", "p2"].filter(function (k) { return h[k]; })[0];
    if (ilk) { $("h-p0").value = p0; $("h-p1").value = p1; $("h-p2").value = p2; $("h-" + ilk).focus(); return; }   /* yazılanlar kalır */
    $("h-p0").focus(); MK.bildir("Parolanız değiştirildi. Öteki cihazlardaki oturumlar kapatıldı.");
  };
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.hasAttribute || !t.hasAttribute("data-hesap-tel")) return;
    var v = t.value.trim(), p = ben();
    if (v && !/^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(v)) { H.hata.tel = "05XX XXX XX XX biçiminde yazılmalı. Kaydedilmedi."; H.tel = t.value; ciz(); $("h-tel").focus(); return; }
    delete H.hata.tel; H.tel = null; p.imzaTel = v; MV.PERSONEL = MV.PERSONEL.slice(); ciz(); $("h-tel").focus();
    MK.bildir(v ? "Mobil imza telefonu kaydedildi." : "Mobil imza telefonu kaldırıldı.");
  });
  MK.goster = function () { ciz(); };
  MK.kabuk({ modul: "hesap", kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  ciz();
})();
