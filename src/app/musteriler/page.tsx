import type { Metadata } from "next";
import { ModulSayfasi } from "../../components/modul/ModulSayfasi";
import { modulBul } from "../../modules/moduller";

const MODUL = modulBul("musteriler")!;

export const metadata: Metadata = { title: MODUL.ad };

export default function Sayfa() {
  return <ModulSayfasi modul={MODUL} />;
}
