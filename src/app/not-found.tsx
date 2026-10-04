import type { Metadata } from "next";
import { Bulunamadi } from "../components/hata/Hata";
import stil from "./tek-sayfa.module.css";

/* başlık kalıbı düzenin kendi bölümüne uygulanmaz (Next) → tam başlık burada. Kabuk dışında çizilir: bulunamayan adres oturum gerektirmez
   ve hangi adreslerin var olduğu oturumsuz kişiye sezdirilmez. */
export const metadata: Metadata = { title: { absolute: "Sayfa bulunamadı · probata" } };

export default function BulunamadiSayfasi() {
  return <main className={stil.tek}><Bulunamadi /></main>;
}
