import type { Metadata } from "next";
import { ModulSayfasi } from "../../../components/modul/ModulSayfasi";
import { modulBul } from "../../../modules/moduller";

const MODUL = modulBul("planlar")!;

export const metadata: Metadata = { title: MODUL.ad };

/* Planlar (referans ekran). Ekranı K3'te (saha omurgası) yapılır. */
export default function Sayfa() {
  return <ModulSayfasi modul={MODUL} />;
}
