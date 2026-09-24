/* probata MAKET — tema, çizimden ÖNCE (yanıp sönme olmasın). Her maket sayfası <head>'de, stil dosyalarından önce yükler.
   Öncelik: adres (?tema=) → bu tarayıcıda seçilen → sistem tercihi. Birincil tuş rengi kararlı (A), seçenek yok.
   2026-09-24 (toplu maket, M1): Planlar maketindeki satır içi betikten aynen ayrıldı — bütün maketler tek kaynaktan. */
(function () {
  var q = new URLSearchParams(location.search), d = document.documentElement, t = q.get("tema");
  try { if (!t) t = localStorage.getItem("probata-tema"); } catch (e) {}
  if (t === "acik" || t === "koyu") d.setAttribute("data-tema", t);
  else d.setAttribute("data-tema", matchMedia("(prefers-color-scheme: dark)").matches ? "koyu" : "acik");
})();
