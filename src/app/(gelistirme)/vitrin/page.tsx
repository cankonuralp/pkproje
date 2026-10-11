/* VİTRİN — yalnız geliştirmede: ortak bileşenlerin (tuş · şerit · bildirim · onay penceresi …) tek sayfada çizildiği yer;
   e2e/bilesenler.spec.ts burayı ölçer. Modül değil, menüde yok; yayında (derleme) 404 — tests/moduller.test.ts istisnası. */
import { notFound } from "next/navigation";
import { VitrinIcerik } from "./VitrinIcerik";
import { vitrinAcik } from "../vitrin-acik";

export const metadata = { title: "Vitrin" };

export default async function Vitrin() {
  if (!(await vitrinAcik())) notFound();
  return <VitrinIcerik />;
}
