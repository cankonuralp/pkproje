/* SAHA LİSTESİ (2026-11-08; sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2): plan başına önceden inen sayfa (public/sw.js) — planın raporu olmayan ekipmanları, satır başına Uygun / Değil.
   Kapı modül 14 (Raporlar); rapor açabilme (plandaki denetçi, rapor_olustur) sunucuda — yeniRaporPaketi açamayana null döner. Burada hiçbir şey yazılmaz: raporlar kuyruktan açılır. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Kirinti, SayfaBasi } from "../../../../../components/sayfa/Sayfa";
import { turOzetleri } from "../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../modules/moduller";
import { ekipmanEklenebilir } from "../../../../../modules/planlar/server/plan-ici";
import { yeniRaporPaketi } from "../../../../../modules/raporlar/server/raporlar";
import { SahaListesi } from "../../../../../modules/raporlar/ui/SahaListesi";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Saha listesi" };

export default async function Sayfa({ params }: { params: Promise<{ plan: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { plan } = await params;
  const v = await oturumIslemi(o, async (db) => {
    const p = await yeniRaporPaketi(db, o, plan);
    if (!p) return null;
    return { p, turler: (await ekipmanEklenebilir(db, o, plan)) ? (await turOzetleri(db)).map((t) => ({ id: t.id, ad: t.ad })) : null };
  });
  if (!v) notFound();
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], [v.p.plan.no, `/planlar/${v.p.plan.id}`], ["Saha listesi"]]} />
      <SayfaBasi baslik="Saha listesi" />
      <SahaListesi p={v.p} turler={v.turler} />
    </>
  );
}
