/* GELİŞTİRME DÜZENİ — yalnız /vitrin ve altı (yayında 404: koruma DÜZENDE, altına eklenen her geliştirme sayfası da kapalı — 2026-10-04).
   Oturum ve veri yok; kabuk kullanıcısız. */
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Kabuk } from "../../components/kabuk/Kabuk";
import { vitrinAcik } from "./vitrin-acik";

export default async function GelistirmeDuzeni({ children }: { children: ReactNode }) {
  if (!(await vitrinAcik())) notFound();
  return <Kabuk>{children}</Kabuk>;
}
