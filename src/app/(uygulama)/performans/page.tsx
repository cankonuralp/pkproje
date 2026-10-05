/* PERFORMANS (maket performans.html #/ pano; 329; modül 19): dönem ve branş anahtarı, özet yüzler (rapor, çalışılan gün, gün başı, kazanç, geri
   gönderilen), tamamlanma süresi (24 / 48 saat), grafikler, personel tablosu. Denetçi ("kendi") kendi sayfasını görür (maket #/ben), kazançsız.
   Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { BosDurum } from "../../../components/bos/BosDurum";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { donemSecimi, performansKisi, performansPanosu } from "../../../modules/performans/server/performans";
import { KisiGorunumu, PanoGorunumu } from "../../../modules/performans/ui/Performans";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("performans")!;
export const metadata: Metadata = { title: MODUL.ad };
export default async function Sayfa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const s = donemSecimi(await searchParams);
  const v = await oturumIslemi(o, async (db) => {
    const p = await performansPanosu(db, o, s);
    if (p && "kendi" in p) return { kendi: p.kendi ? await performansKisi(db, o, p.kendi, s) : null };
    return { pano: p };
  });
  if ("pano" in v) return v.pano ? <PanoGorunumu v={v.pano} /> : <Yetkisiz />;
  if (!v.kendi) return <BosDurum ikon="user" baslik="Personel kaydı yok" metin="Hesabınız bir personel kaydına bağlı değil; performansınız burada görünmez." />;
  return <KisiGorunumu v={v.kendi} personelGor={modulGorur(o, 2)} isGor={modulGorur(o, 18)} />;
}
