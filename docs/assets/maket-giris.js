/* ══ probata MAKET M1 — Giriş (modül 1) · ONAY BEKLİYOR (toplu maket, 2026-09-24) ═════════════════════════════════
   Kaynak: pkproje.md §2 (kiracı = alt alan adı; kullanıcı e-postayla), CLAUDE.md §2 (kimlik bizim kodumuzda), anayasa 5.3
   (parola alanında tam sessizlik: sayfaya genel tuş dinleyicisi parola alanına dokunmaz). Hâller: #/ · #/hata · #/unuttum ·
   #/gonderildi · #/gecici (geçici parolayla ilk giriş). Hangi hesabın var olduğu ASLA söylenmez (yanlış e-posta ile yanlış parola
   aynı ileti; sıfırlamada "kayıtlıysa gönderildi"). Kurallar ve süreler reisim onaylı (37: "uygun").
   2. tur (2026-09-25): 34 "yönetici geçici parola verir, daha sonra kullanıcı parolasını değiştirebilir" → davet bağlantısıyla parola
   belirleme kalktı; geçici parolayla girince değiştirme önerilir, "Şimdi değil" ile geçilebilir. 35 aynı alan adı (müşteri de buradan),
   36 firma logosu yok, 41 girişten sonra Ana sayfa. 33: müşterinin parolası sistemdeki e-postasına kendiliğinden gönderilir (M2). */
(function () {
  "use strict";
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon;
  var ADRES = "ornek.probata.com.tr";   /* uydurma firma alt alan adı (pkproje.md §8.12 biçimi) */
  var S = { eposta: "", parola: "", goster: false, hata: {}, p1: "", p2: "" };
  var epostaGecerli = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  function parolaAlani(id, etiket, deger, ipucu, hata, oto) {
    return '<div class="a-alan-grup"><label class="a-etiket" for="' + id + '">' + etiket + "</label>" +
      '<div class="a-parola"><input class="a-girdi" id="' + id + '" type="' + (S.goster ? "text" : "password") + '" autocomplete="' + oto + '" value="' + kacis(deger) + '"' +
        (hata ? ' aria-invalid="true"' : "") + ' aria-describedby="' + id + '-ipucu">' +
      '<button class="a-parola-goster" type="button" data-eylem="goster" aria-label="' + (S.goster ? "Parolayı gizle" : "Parolayı göster") + '" aria-pressed="' + S.goster + '">' + ikon(S.goster ? "eye-off" : "eye") + "</button></div>" +
      '<p class="a-ipucu' + (hata ? " a-ipucu-uyari" : "") + '" id="' + id + '-ipucu">' + (hata || ipucu) + "</p></div>";
  }
  function epostaAlani() {
    var h = S.hata.eposta;
    return '<div class="a-alan-grup"><label class="a-etiket" for="g-eposta">E-posta</label>' +
      '<input class="a-girdi a-girdi-eposta" id="g-eposta" type="email" inputmode="email" autocomplete="username" maxlength="120" value="' + kacis(S.eposta) + '"' + (h ? ' aria-invalid="true" aria-describedby="g-eposta-ipucu"' : "") + ">" +
      (h ? '<p class="a-ipucu a-ipucu-uyari" id="g-eposta-ipucu">' + h + "</p>" : "") + "</div>";
  }
  var bas = function (baslik) { return '<div><h1 tabindex="-1">' + baslik + '</h1><p class="a-giris-adres">' + ADRES + "</p></div>"; };
  function ciz() {
    var h = location.hash || "#/", f = $("a-giris-form");
    if (h === "#/unuttum" || h === "#/gonderildi") {
      f.innerHTML = bas("Parola sıfırlama") +
        (h === "#/gonderildi" ? MK.serit("onay", "circle-check", "Bu adres kayıtlıysa sıfırlama bağlantısı gönderildi. Bağlantı 30 dakika geçerli.") :
          '<p class="a-bolum-aciklama">Hesabın e-posta adresini yazın; parola belirleme bağlantısı o adrese gider.</p>') +
        (h === "#/gonderildi" ? "" : epostaAlani()) +
        '<div class="a-giris-tuslar">' + (h === "#/gonderildi" ? "" : MK.tus({ eylem: "sifirla", ad: "Bağlantı gönder", ikon: "send" })) +
          '<a class="a-baglanti" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Girişe dön</a></div>";
    } else if (h === "#/gecici") {
      var k = S.hata;
      f.innerHTML = bas("Parolayı değiştir") +
        MK.serit("bilgi", "key-round", "Geçici parolayla giriş yapıldı: <b>ozan.kurt@firma.example</b>. Parola şimdi ya da daha sonra değiştirilebilir.") +
        parolaAlani("g-p1", "Yeni parola", S.p1, "En az 10 karakter; harf ve rakam içerir.", k.p1, "new-password") +
        parolaAlani("g-p2", "Yeni parola (tekrar)", S.p2, "Aynısını yazın.", k.p2, "new-password") +
        '<div class="a-giris-tuslar">' + MK.tus({ eylem: "belirle", ad: "Kaydet ve devam et", ikon: "check" }) +
          '<a class="a-baglanti" href="anasayfa.html">Şimdi değil</a></div>';
    } else {
      f.innerHTML = bas("Giriş") +
        (h === "#/hata" ? MK.serit("hata", "circle-alert", "E-posta ya da parola yanlış. 5 hatalı denemeden sonra giriş 15 dakika kilitlenir.") : "") +
        epostaAlani() +
        parolaAlani("g-parola", "Parola", S.parola, "", S.hata.parola, "current-password") +
        '<div class="a-giris-tuslar">' + MK.tus({ eylem: "gir", ad: "Giriş yap", ikon: "log-in" }) +
          '<a class="a-baglanti" href="#/unuttum">Parolamı unuttum</a></div>' +
        '<p class="a-giris-ayrac">Müşteriler de aynı adresten girer; parolaları sistemde kayıtlı e-postalarına gönderilir.</p>';
    }
  }
  function goster(odakla) {
    S.hata = {}; ciz();
    if (odakla) { var h1 = document.querySelector(".a-giris-form h1"); if (h1) h1.focus({ preventScroll: true }); }
  }
  MK.goster = goster;
  MK.onGirdi = function (e) {
    var t = e.target;
    if (t.id === "g-eposta") S.eposta = t.value.trim();
    else if (t.id === "g-parola") S.parola = t.value;
    else if (t.id === "g-p1") S.p1 = t.value;
    else if (t.id === "g-p2") S.p2 = t.value;
  };
  var X = MK.eylem;
  X.goster = function (el) {
    var alan = el.parentNode.querySelector("input"), yer = alan.selectionStart;
    S.goster = !S.goster; var id = alan.id; ciz(); var y = $(id); y.focus(); try { y.setSelectionRange(yer, yer); } catch (x) {}
  };
  X.gir = function () {
    S.hata = {};
    if (!epostaGecerli(S.eposta)) S.hata.eposta = S.eposta ? "E-posta biçimi geçersiz." : "E-posta yazılmalı.";
    if (!S.parola) S.hata.parola = "Parola yazılmalı.";
    if (Object.keys(S.hata).length) { ciz(); $(S.hata.eposta ? "g-eposta" : "g-parola").focus(); return; }
    /* maket: "hata" içeren parola yanlış sayılır, "gecici" içeren geçici parola sayılır; öteki her şey Ana sayfa'ya girer */
    if (/hata/.test(S.parola)) { location.hash = "#/hata"; return; }
    if (/gecici/.test(S.parola)) { location.hash = "#/gecici"; return; }
    location.href = "anasayfa.html";
  };
  X.sifirla = function () {
    S.hata = {};
    if (!epostaGecerli(S.eposta)) { S.hata.eposta = S.eposta ? "E-posta biçimi geçersiz." : "E-posta yazılmalı."; ciz(); $("g-eposta").focus(); return; }
    location.hash = "#/gonderildi";
  };
  X.belirle = function () {
    S.hata = {};
    if (S.p1.length < 10 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(S.p1) || !/\d/.test(S.p1)) S.hata.p1 = "En az 10 karakter; harf ve rakam içermeli.";
    else if (S.p1 !== S.p2) S.hata.p2 = "İki parola aynı değil.";
    if (Object.keys(S.hata).length) { ciz(); $(S.hata.p1 ? "g-p1" : "g-p2").focus(); return; }
    location.href = "anasayfa.html";
  };
  document.addEventListener("keydown", function (e) {   /* Enter formu gönderir (yalnız Enter; parola içeriğine dokunulmaz) */
    if (e.key !== "Enter" || e.target.tagName !== "INPUT") return;
    var t = document.querySelector(".a-giris-tuslar .a-tus"); if (t) { e.preventDefault(); t.click(); }
  });
  goster(false);
})();
