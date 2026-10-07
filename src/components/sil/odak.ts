/* ODAK KORUMA (365; 352–361 incelemesi, ANAYASA 2.x erişilebilirlik): Sil / Pasife al başarılı olunca tuşun satırı ya da tuşun kendisi yenilenen
   sayfadan kalkar, odak gövdeye düşer (ekran okuyucu bir şey duyurmaz, klavye kullanıcısı yerini kaybeder). Bu işlev kısa bir süre (yenileme bitene
   dek) bakar: odak gövdedeyse ya da kopmuş bir öğedeyse hedefe (seçici — ör. açık penceredeki "Cihaz türü ekle"), yoksa sayfanın başlığına taşır.
   Kullanıcı bu arada odağı kendisi bir yere koyduysa dokunmaz. */
const SURE_MS = 2000;

function hedefOgesi(hedef?: string): HTMLElement | null {
  const h = hedef ? document.querySelector<HTMLElement>(hedef) : null;
  if (h) return h;
  const b = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("h1");
  if (b && !b.hasAttribute("tabindex")) b.setAttribute("tabindex", "-1");
  return b;
}

export function odakKoru(hedef?: string): void {
  if (typeof window === "undefined") return;
  const bitis = performance.now() + SURE_MS;
  const bak = () => {
    const a = document.activeElement as HTMLElement | null;
    const kayip = !a || a === document.body || !a.isConnected || (a as HTMLButtonElement).disabled === true;
    if (kayip) hedefOgesi(hedef)?.focus();
    if (performance.now() < bitis) requestAnimationFrame(bak);
  };
  requestAnimationFrame(bak);
}
