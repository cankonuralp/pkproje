/* UYARILAR — türler ve adres eşlemesi (saf; istemci ve sunucu aynı tanımı kullanır — 331) */
export type UyariTuru = "kal" | "egt" | "arac";
export const UYARI_TUR: Record<UyariTuru, { ad: string; ikon: string }> = {
  kal: { ad: "Kalibrasyon", ikon: "gauge" }, egt: { ad: "Eğitim tekrarı", ikon: "graduation-cap" }, arac: { ad: "Araç belgesi", ikon: "car" },
};
/** adresteki ?tur= → çip (maket ?tur=kalibrasyon|egitim) */
export const ADRES_TUR: Record<string, UyariTuru> = { kalibrasyon: "kal", egitim: "egt", arac: "arac" };
/** görünürlük: "kendi" düzeyinde (ben = kişinin personeli) yalnız kendisindeki / kendisinin uyarısı; değilse hepsi */
export const uyariGorunur = (ben: string | null, kisiId: string | null | undefined) => ben === null || (!!kisiId && kisiId === ben);
