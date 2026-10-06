/* YÖNETİM DÜZENİ (348) — yalnız yönetim adresinde ve yönetim oturumuyla (yoksa yönetim girişine; başka adreste 404). Menüsüz kabuk. Veri her
   sayfada yönetim işleminde (veritabanında yönetim rolü). */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { YonetimKabugu } from "../../../../components/kabuk/YonetimKabugu";
import { yonetimOturumGerekli } from "../../../../server/yonetim/istek";

export const metadata: Metadata = { title: { default: "probata yönetim", template: "%s · probata yönetim" } };

export default async function YonetimDuzeni({ children }: { children: ReactNode }) {
  const o = await yonetimOturumGerekli();
  return <YonetimKabugu kullanici={{ ad: o.ad, rol: "Yönetim" }}>{children}</YonetimKabugu>;
}
