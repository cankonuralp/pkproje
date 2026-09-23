/* probata sunumu — tema anahtarı + cihaz çerçevesi ölçeği (2026-09-23)
   ⛔ Anayasa 2.10: ölçek 0 iken (görünmez yükleme) çerçeve boyutu yazılmaz; genişlik değişince yeniden hesaplanır.
   Çerçeveler maketi gerçek boyutunda gösterir; kaba sığmazsa küçültülür, asla büyütülmez. */
(function () {
  "use strict";
  var kok = document.documentElement;
  function tema() { return kok.getAttribute("data-tema") === "koyu" ? "koyu" : "acik"; }

  function cerceveleriYukle() {
    document.querySelectorAll(".s-cihaz-ic iframe").forEach(function (f) {
      var hedef = f.getAttribute("data-src") + "?tema=" + tema() + (f.getAttribute("data-hash") || "");   /* #/plan/<id> sorgudan SONRA */
      if (f.getAttribute("src") !== hedef) f.setAttribute("src", hedef);
    });
  }
  function olcekle() {
    document.querySelectorAll(".s-cihaz-ic").forEach(function (k) {
      var gen = +k.getAttribute("data-gen"), yuk = +k.getAttribute("data-yuk");
      var kap = k.parentElement.clientWidth;
      if (!kap) return;                                   /* görünmezken 0 → yazma */
      var o = Math.min(1, kap / gen);
      var f = k.querySelector("iframe");
      f.style.transform = "scale(" + o + ")";
      k.style.width = Math.round(gen * o) + "px";
      k.style.height = Math.round(yuk * o) + "px";
      k.setAttribute("data-olcek", o.toFixed(3));
    });
  }
  document.getElementById("s-tema").addEventListener("click", function () {
    var yeni = tema() === "koyu" ? "acik" : "koyu";
    kok.setAttribute("data-tema", yeni);
    try { localStorage.setItem("probata-tema", yeni); } catch (e) {}
    cerceveleriYukle();
  });
  if ("ResizeObserver" in window) new ResizeObserver(olcekle).observe(document.querySelector(".s-cihazlar"));
  window.addEventListener("resize", olcekle);
  cerceveleriYukle(); olcekle();
})();
