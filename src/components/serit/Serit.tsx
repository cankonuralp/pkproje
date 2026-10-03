/* ŞERİT — tek üretici (kalıp 20 d: kural ihlali uyarıdır, engel değil — reisim 39). Tür: bilgi · uyari · onay · hata;
   isteğe bağlı sağda tek eylem (ör. "Güncelle", "Hepsini imzala"). Hata şeridi ekran okuyucuya hemen okunur (role=alert). */
import type { ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Serit.module.css";

export type SeritTuru = "bilgi" | "uyari" | "onay" | "hata";
const VARSAYILAN_IKON: Record<SeritTuru, string> = { bilgi: "info", uyari: "triangle-alert", onay: "circle-check", hata: "circle-x" };

export function Serit({ tur, ikon, children, eylem, id }: { tur: SeritTuru; ikon?: string; children: ReactNode; eylem?: ReactNode; id?: string }) {
  return (
    <div className={`${stil.serit} ${stil[tur]}`} id={id} role={tur === "hata" ? "alert" : undefined}>
      <Ikon ad={ikon ?? VARSAYILAN_IKON[tur]} kucuk />
      <span className={stil.metin}>{children}</span>
      {eylem && <span className={stil.eylem}>{eylem}</span>}
    </div>
  );
}
