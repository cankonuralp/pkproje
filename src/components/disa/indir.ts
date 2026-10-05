/* tarayıcıda üretilen dosyayı indirir (Excel, ZIP): bellekteki baytlardan geçici adres, tıklama, adres hemen bırakılır. Kalıcı / herkese açık
   bağlantı yok (anayasa 5.1) — dosya yalnız bu sekmede, kişinin zaten gördüğü veriden. */
export function baytIndir(ad: string, bayt: Uint8Array | readonly Uint8Array[], tur: string) {
  const url = URL.createObjectURL(new Blob((Array.isArray(bayt) ? bayt : [bayt]) as BlobPart[], { type: tur }));
  const a = document.createElement("a");
  a.href = url; a.download = ad; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** dosya adındaki gün (Türkiye takvimi): 2026-10-05 */
export const dosyaGunu = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
