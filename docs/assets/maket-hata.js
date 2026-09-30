/* ══ probata MAKET · Yetkisiz sayfa ve Sayfa bulunamadı (S2, 2026-09-30) — ONAY BEKLİYOR ══════════════════════════════════════════
   Reisim 2026-09-30: "3 bu ekranları ekle" (yetkisiz sayfa · oturum süresi doldu · sayfa bulunamadı; oturum süresi doldu giriş sayfasında,
   giris.html#/oturum). Kabuk ve menü yerinde kalır, kişi kaybolmaz; yol gösteren tek cümle ve iki tuş. Hangi kaydın var olduğu SÖYLENMEZ
   (yetkisiz sayfada kaydın adı / numarası yazmaz). Adres: #/yetkisiz · #/ (ve bilinmeyen her adres) sayfa bulunamadı. */
(function () {
  "use strict";
  var $ = MK.$, ikon = MK.ikon;
  function ciz() {
    var y = location.hash === "#/yetkisiz";
    var ana = '<a class="a-tus a-tus-birincil" href="' + MK.adres("ana") + '">' + ikon("house", "a-ikon-kucuk") + "Ana sayfaya dön</a>";
    var geri = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="geri">' + ikon("arrow-left", "a-ikon-kucuk") + "Geri dön</button>";
    $("a-hata").innerHTML = MK.bos(y
      ? { ikon: "lock", baslik: "Bu sayfayı görme yetkiniz yok", metin: "Rolünüz bu bölümü kapsamıyor. Gerekiyorsa firma yöneticinizden yetki isteyin.", eylem: '<div class="a-bos-tuslar">' + ana + geri + "</div>" }
      : { ikon: "file-question-mark", baslik: "Sayfa bulunamadı", metin: "Adres yanlış yazılmış ya da kayıt kaldırılmış olabilir.", eylem: '<div class="a-bos-tuslar">' + ana + geri + "</div>" });
    document.title = (y ? "Yetkiniz yok" : "Sayfa bulunamadı") + " · probata maket";
  }
  MK.eylem.geri = function () { if (history.length > 1) history.back(); else location.href = MK.adres("ana"); };
  MK.goster = function (odakla) { ciz(); if (odakla) { var b = document.querySelector(".a-bos-baslik"); if (b) b.focus && b.focus(); } };
  MK.kabuk({ modul: "hata", kullanici: { bas: "AD", ad: "Ayşe Demir", rol: "Firma yöneticisi" } });
  ciz();
})();
