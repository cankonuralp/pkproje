/* API SÜRÜMÜ (KOD-GECIS K1; ARKA-UC çevrimdışı istemci): her /api yanıtı `X-Probata-Api` başlığını taşır. Cihaz uygulaması (K6) isteğine
   `X-Probata-Istemci: <sürüm>` koyar; desteklenen en eski sürümden eskiyse 426 "uygulamayı güncelleyin" alır — eski istemci yeni şemaya yanlış veri
   yazmaz (09-D2). Tarayıcı başlık göndermez, her zaman güncel koddur. Sürüm yalnız geriye uyumsuz değişiklikte artar; artınca pkproje §11'e yazılır. */
export const API_SURUMU = 1;
export const EN_AZ_ISTEMCI = 1;

/** istemci başlığı: yoksa null (tarayıcı); varsa tam sayı olmalı */
export function istemciEskiMi(baslik: string | null): boolean {
  if (baslik === null) return false;
  const n = /^\d{1,6}$/.test(baslik) ? Number(baslik) : NaN;
  return !(n >= EN_AZ_ISTEMCI);
}
