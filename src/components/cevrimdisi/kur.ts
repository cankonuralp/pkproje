/* UYGULAMAYI KUR (2026-11-12; reisim: "ne gerekiyorsa yap uygulama dahil") — probata telefona / bilgisayara uygulama gibi kurulur
   (public/manifest.webmanifest). Kurulu uygulamanın cihazdaki verisini tarayıcı kolay silmez (iPhone'da Safari, 7 gün açılmayan sitenin verisini
   siler; ana ekrana eklenen uygulamanınkini silmez). Durum:
   · "kur": tarayıcı kurmayı sunuyor (Chrome / Edge — beforeinstallprompt yakalandı) → kur() tarayıcının penceresini açar;
   · "ios": iPhone / iPad Safari'de, henüz ana ekrana eklenmemiş → yolu söylenir (Paylaş › Ana Ekrana Ekle);
   · null: kurulu (ayrı pencerede çalışıyor) ya da tarayıcı desteklemiyor. */
type KurOlayi = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
export type KurDurumu = "kur" | "ios" | null;

let olay: KurOlayi | null = null;
const dinleyenler = new Set<() => void>();
const haber = () => { for (const f of dinleyenler) f(); };

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); olay = e as KurOlayi; haber(); });
  window.addEventListener("appinstalled", () => { olay = null; haber(); });
}

/** ayrı pencerede (kurulu uygulama olarak) mı çalışıyor */
export const kuruluMu = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
};
/** iPhone / iPad (iPadOS masaüstü kimliğiyle gelir: dokunmatik Mac) */
export const iosMu = (ua: string, dokunma: number): boolean => /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && dokunma > 1);

export const kurAbone = (f: () => void) => { dinleyenler.add(f); return () => { dinleyenler.delete(f); }; };
export const kurAnlik = (): KurDurumu => {
  if (typeof window === "undefined" || kuruluMu()) return null;
  if (olay) return "kur";
  return iosMu(navigator.userAgent, navigator.maxTouchPoints ?? 0) ? "ios" : null;
};
export const kurSunucuAnlik = (): KurDurumu => null;
/** tarayıcının kurma penceresini açar (yalnız "kur" durumunda; olay bir kez kullanılır) */
export async function uygulamayiKur(): Promise<void> {
  const e = olay;
  if (!e) return;
  olay = null;
  try { await e.prompt(); } finally { haber(); }
}
