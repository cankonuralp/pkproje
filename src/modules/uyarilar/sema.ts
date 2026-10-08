/* UYARILAR — türler ve adres eşlemesi (saf; istemci ve sunucu aynı tanımı kullanır — 331) */
/* sak (387): saklama süresi dolacak imzalı raporlar — yalnız firma yöneticisine (KOD-GECIS ENGEL 11 "30 gün önce firma yöneticisine liste") */
export type UyariTuru = "kal" | "egt" | "arac" | "sak";
export const UYARI_TUR: Record<UyariTuru, { ad: string; ikon: string }> = {
  kal: { ad: "Kalibrasyon", ikon: "gauge" }, egt: { ad: "Eğitim tekrarı", ikon: "graduation-cap" }, arac: { ad: "Araç belgesi", ikon: "car" },
  sak: { ad: "Saklama süresi", ikon: "archive" },
};
/** adresteki ?tur= → çip (maket ?tur=kalibrasyon|egitim) */
export const ADRES_TUR: Record<string, UyariTuru> = { kalibrasyon: "kal", egitim: "egt", arac: "arac", saklama: "sak" };
/** görünürlük: "kendi" düzeyinde (ben = kişinin personeli) yalnız kendisindeki / kendisinin uyarısı; değilse hepsi */
export const uyariGorunur = (ben: string | null, kisiId: string | null | undefined) => ben === null || (!!kisiId && kisiId === ben);
