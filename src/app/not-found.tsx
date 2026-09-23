import type { Metadata } from "next";
import { BosDurum } from "../components/bos/BosDurum";

/* başlık kalıbı düzenin kendi bölümüne uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: "Sayfa bulunamadı · probata" } };

export default function Bulunamadi() {
  return <BosDurum ikon="circle-alert" baslik="Sayfa bulunamadı" metin="Bu adreste bir ekran yok." eylem={{ href: "/", etiket: "Planlar'a dön", ikon: "arrow-left" }} />;
}
