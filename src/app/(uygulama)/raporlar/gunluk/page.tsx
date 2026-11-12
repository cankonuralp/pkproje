/* GÜNLÜK ÇİZELGE (2026-11-12; maket yerel/maket/turkak-modeli.html 5. bölüm — pkproje.md §11 T7): seçilen günde ölçülmüş kontroller — kim, hangi saatte,
   hangi ekipmanın başında. Kişi yalnız görebildiği raporların kontrollerini görür (denetçi kendi, branş yöneticisi branşı …); kural sunucuda
   (gunlukKontroller). Gün adresteki ?gun=YYYY-AA-GG; yoksa / bozuksa bugün (Türkiye). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Kirinti, SayfaBasi } from "../../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../../components/tus/Tus";
import { modulBul } from "../../../../modules/moduller";
import { gunlukKontroller } from "../../../../modules/raporlar/server/raporlar";
import { GunlukCizelge } from "../../../../modules/raporlar/ui/GunlukCizelge";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Günlük çizelge" };
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const UZUN = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
const kay = (gun: string, n: number) => new Date(Date.parse(`${gun}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ gun?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const istenen = (await searchParams).gun;
  const bugun = GUN.format(new Date());
  const gun = typeof istenen === "string" && /^\d{4}-\d{2}-\d{2}$/.test(istenen) && !Number.isNaN(Date.parse(`${istenen}T00:00:00Z`)) ? istenen : bugun;
  const l = await oturumIslemi(o, (db) => gunlukKontroller(db, o, gun));
  if (!l) return <Yetkisiz />;
  return (
    <>
      <Kirinti ogeler={[["Raporlar", "/raporlar"], ["Günlük çizelge"]]} />
      <SayfaBasi baslik={`Günlük çizelge · ${UZUN.format(new Date(`${gun}T00:00:00Z`))}`} tuslar={<>
        <TusBaglanti ikon="chevron-left" href={`/raporlar/gunluk?gun=${kay(gun, -1)}`}>Önceki gün</TusBaglanti>
        {gun < bugun && <TusBaglanti ikon="chevron-right" href={`/raporlar/gunluk?gun=${kay(gun, 1)}`}>Sonraki gün</TusBaglanti>}
      </>} />
      <GunlukCizelge key={gun} gun={gun} kontroller={l} />
    </>
  );
}
