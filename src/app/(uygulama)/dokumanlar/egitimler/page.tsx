/* DÖKÜMANLAR › Eğitimler (maket egitimler.html #/) — personel eğitim kayıtları ve tekrar tarihleri. Kapı sunucuda (modül 10, Eğitimler);
   denetçi ("kendi") yalnız kendi kayıtlarını görür. 2026-10-25 (belge doldurma): katılım formunda "Belgeyi doldur" (katilimDoldurulur). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { bugunTr, egitimDegistirir, egitimListesi, katilimDoldurulur } from "../../../../modules/egitimler/server/egitimler";
import { EgitimListesi } from "../../../../modules/egitimler/ui/EgitimListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = { no: 10 };   // Eğitimler: modül kaydında ayrı menü değil, Dökümanlar sekmesi (2026-09-28); yetkisi modül 10
export const metadata: Metadata = { title: "Eğitimler" };
/* 352: PDF basan sunucu eylemi bu sayfada koşar (başsız Chromium) — süre ayarı PDF uçlarıyla aynı: Vercel aynı ayarlı uçları tek işlevde toplar,
   Chromium yalnız o işlevde kalır (öteki sayfaların ortak işlevi 74 MB → küçük; her yayın Functions Storage kotasına daha az ekler) */
export const maxDuration = 60;

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ kisi?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const [l, doldur] = await oturumIslemi(o, async (db) => [await egitimListesi(db, o), await katilimDoldurulur(db, o)] as const);
  if (!l) return <Yetkisiz />;
  const { kisi } = await searchParams;
  return <EgitimListesi kayitlar={l.kayitlar} turler={l.turler} kisiler={l.kisiler} esik={l.esik} bugun={bugunTr()} yaz={egitimDegistirir(o)}
    kisi={typeof kisi === "string" ? kisi : undefined} doldur={doldur} />;
}
