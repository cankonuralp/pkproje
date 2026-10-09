/* EKİPMAN TÜRLERİ (maket ekipman-turleri.html #/ · #/elektrik) — katalog, branş sekmesi adresten (?brans=e). Kapı sunucuda (modül 5).
   436: altında branşın hazır rapor formatları (Bakanlık ZPKR… + genel şablonlar; src/format/sablonlar.ts) — kullanan türler ve "Tür olarak ekle".
   437: liste okunmadan önce firmanın Bakanlık türleri kurulur (ilk açılışta; rapor-format/server/kurulum.ts). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { SABLONLAR } from "../../../format/sablonlar";
import { grupBul } from "../../../modules/ekipman-turleri/sema";
import { turDegistirir, turListesi } from "../../../modules/ekipman-turleri/server/turler";
import type { HazirFormat } from "../../../modules/ekipman-turleri/ui/HazirFormatlar";
import { formatDegistirir, sablonKullanimi, yayindakiSurumler } from "../../../modules/rapor-format/server/formatlar";
import { hazirKurulum } from "../../../modules/rapor-format/server/kurulum";
import { TurListesi } from "../../../modules/ekipman-turleri/ui/TurListesi";
import { modulBul } from "../../../modules/moduller";
import { havuz } from "../../../server/db/havuz";
import { depo } from "../../../server/dosya/depo";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ brans?: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const brans = (await searchParams).brans === "e" ? "e" : "m";
  await hazirKurulum(havuz(), depo(), o.kiraci.firmaId);
  const [l, kullanim, yayinda] = await oturumIslemi(o, async (db) => [await turListesi(db, o), await sablonKullanimi(db, o), await yayindakiSurumler(db, o)] as const);
  const liste = l ?? [];
  const sayilar = { m: liste.filter((t) => t.brans === "m").length, e: liste.filter((t) => t.brans === "e").length };
  const ad = new Map(liste.map((t) => [t.id, t.ad]));
  const hazir: HazirFormat[] = Object.entries(SABLONLAR).filter(([, s]) => grupBul(s.tur.grup)?.b === brans).map(([anahtar, s]) => ({
    anahtar, ad: s.ad, formKodu: s.tanim.gorunum.formKodu, baslik: s.tanim.gorunum.baslik, bakanlik: s.bakanlik, tur: s.tur,
    kullananlar: (kullanim?.[anahtar] ?? []).map((x) => ({ id: x.turId, ad: ad.get(x.turId) ?? "—", durum: x.durum })),
  })).sort((a, b) => Number(b.bakanlik) - Number(a.bakanlik) || a.anahtar.localeCompare(b.anahtar));
  return <TurListesi key={brans} kayitlar={liste.filter((t) => t.brans === brans)} brans={brans} sayilar={sayilar} ekleyebilir={turDegistirir(o)} yayinda={yayinda ?? {}}
    hazir={kullanim ? hazir : []} sablondanEkler={turDegistirir(o) && formatDegistirir(o)} />;
}
