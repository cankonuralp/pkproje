/* ══ KİRACI ÇÖZÜMLEME — istek adresinden (Host) firmanın kısa adı ═══════════════════════════════════════════
   Her firma kendi alt alan adında çalışır: <kisa_ad>.probata.com.tr (pkproje.md §8.8). Yerelde <kisa_ad>.localhost.
   Yalnız TEK düzey alt alan kabul edilir; ana alanın kendisi ve derin alt alanlar kiracı değildir (null).
   ⛔ Dile bağlı harf katlama yok (anayasa 5.5): yalnız A–Z küçültülür; kalan her şey kurala uymazsa null. */

const ETIKET = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function kiraciAdiCoz(host: string, anaAlan: string): string | null {
  const ad = host.replace(/:\d+$/, "").replace(/[A-Z]/g, (h) => h.toLowerCase());
  const ana = anaAlan.replace(/[A-Z]/g, (h) => h.toLowerCase());
  if (!ad.endsWith("." + ana)) return null;
  const on = ad.slice(0, -(ana.length + 1));
  if (on.includes(".") || !ETIKET.test(on)) return null;
  return on;
}
