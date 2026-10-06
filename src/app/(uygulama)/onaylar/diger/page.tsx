/* ONAYLAR › DİĞER BELGELER (333; maket onaylar.html #/diger): kişinin imzasına gönderilen belgeler. Onaylar düzeyinden bağımsız — her oturum
   YALNIZ kendi belgelerini görür (planlama ve muhasebe de kendi bordrosunu imzalar); Onaylar'ı görene sekmeler de çizilir. Süzgeç sunucuda. */
import type { Metadata } from "next";
import { digerBelgeler } from "../../../../modules/onaylar/server/belgeler";
import { onayListeleri } from "../../../../modules/onaylar/server/onaylar";
import { DigerBelgeler } from "../../../../modules/onaylar/ui/DigerBelgeler";
import { oturumGerekli, oturumIslemi } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Diğer belgeler · Onaylar" };

export default async function Sayfa() {
  const o = await oturumGerekli();
  const { v, sekmeler } = await oturumIslemi(o, async (db) => ({ v: await digerBelgeler(db, o), sekmeler: await onayListeleri(db, o) }));
  return <DigerBelgeler v={v} sekmeler={sekmeler} />;
}
