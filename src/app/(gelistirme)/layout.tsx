/* GELİŞTİRME DÜZENİ — yalnız /vitrin (yayında 404). Oturum ve veri yok; kabuk kullanıcısız. */
import type { ReactNode } from "react";
import { Kabuk } from "../../components/kabuk/Kabuk";

export default function GelistirmeDuzeni({ children }: { children: ReactNode }) {
  return <Kabuk>{children}</Kabuk>;
}
