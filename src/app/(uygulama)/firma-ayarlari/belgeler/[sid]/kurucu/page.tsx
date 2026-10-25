/* BELGE KURUCU — 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"): belgenin
   TASLAK formatı rapor şablonunun kâğıdında düzenlenir (rapor-format/ui/BelgeKurucu.tsx). Kapı Firma ayarları "gör"; kayıt ve görme yetkisi
   rapor-format/server/belgeler.ts belgeFormatiOku (yoksa bulunamadı). Yalnız taslak ve yalnız "değiştirir": öteki durumda belge formatları listesine
   döner. Kayıt ve yayın denetimi modül işlevinde. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
/* kâğıt ve belge önizlemesi belgenin görünümüyle (.rb- sınıfları) */
import "../../../../../../belge/belge.css";
import { BELGE_KATALOGU } from "../../../../../../belge/katalog";
import { Yetkisiz } from "../../../../../../components/hata/Hata";
import { Kirinti } from "../../../../../../components/sayfa/Sayfa";
import { modulBul } from "../../../../../../modules/moduller";
import { belgeFormatiOku } from "../../../../../../modules/rapor-format/server/belgeler";
import { formatDegistirir } from "../../../../../../modules/rapor-format/server/formatlar";
import { BelgeKurucu } from "../../../../../../modules/rapor-format/ui/BelgeKurucu";
import { modulOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

const MODUL = modulBul("firma-ayarlari")!;
const LISTE = "/firma-ayarlari/belgeler";
export const metadata: Metadata = { title: "Belge kurucu" };

export default async function Sayfa({ params }: { params: Promise<{ sid: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { sid } = await params;
  const f = await oturumIslemi(o, (db) => belgeFormatiOku(db, o, sid));
  if (!f) notFound();
  if (f.durum !== "taslak" || !formatDegistirir(o)) redirect(LISTE);
  const ad = BELGE_KATALOGU[f.belge].ad;
  return (
    <>
      <Kirinti ogeler={[[MODUL.ad, "/firma-ayarlari"], ["Belge formatları", LISTE], [ad]]} />
      <BelgeKurucu belge={f.belge} format={{ id: f.id, surum: f.surum }} tanim={f.tanim} />
    </>
  );
}
