/* KÂĞITTA BÖLÜME KAYDIRMA (494 düzeltmesi) — eklenen / kopyalanan / seçilen bölüm görünüme gelir. Hareketi azalt tercihi açıksa (işletim
   sistemi ya da tarayıcı) yumuşak kaydırma yok, anında. Format kurucunun bütün kaydırmaları buradan (Kagit, FormatKurucu, Yapboz). */
export function bolumeKaydir(id: string): void {
  const azalt = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center", behavior: azalt ? "auto" : "smooth" }));
}
