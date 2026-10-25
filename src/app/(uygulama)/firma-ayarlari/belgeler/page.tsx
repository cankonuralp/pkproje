/* FİRMA AYARLARI › BELGE FORMATLARI — 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız"): programın ürettiği belgelerin firmaya özgü formatları (rapor şablonunun aracıyla). Kapı Firma ayarları "gör"; liste ve görme
   yetkisi rapor-format/server/belgeler.ts belgeFormatlari (yoksa null → yetkisiz); tuşlar yalnız rapor şablonunu değiştirebilene
   (formatDegistirir) — karar yine sunucuda. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Kirinti } from "../../../../components/sayfa/Sayfa";
import { modulBul } from "../../../../modules/moduller";
import { belgeFormatlari } from "../../../../modules/rapor-format/server/belgeler";
import { formatDegistirir } from "../../../../modules/rapor-format/server/formatlar";
import { BelgeFormatlari } from "../../../../modules/rapor-format/ui/BelgeFormatlari";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("firma-ayarlari")!;
export const metadata: Metadata = { title: "Belge formatları" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => belgeFormatlari(db, o));
  if (!l) return <Yetkisiz />;
  return (
    <>
      <Kirinti ogeler={[[MODUL.ad, "/firma-ayarlari"], ["Belge formatları"]]} />
      <BelgeFormatlari ozetler={l} yaz={formatDegistirir(o)} />
    </>
  );
}
