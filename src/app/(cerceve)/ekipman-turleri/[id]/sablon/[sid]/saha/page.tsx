/* SAHA EKRANI ÖNİZLEMESİ (472; reisim 2026-10-10, maket kararları k3–k4: kâğıtta yapılan değişiklik saha ekranında görünür, varsayılan aygıt
   tablet; 483: burada düzenleme yok — yalnız denetçinin göreceği ekran). Format kurucusunun (taslak) ve sürüm sayfasının çerçevesinde açılır:
   türün formatı GERÇEK saha ekranıyla (raporlar/ui/SahaRaporu, deneme kipi) UYDURMA bir raporda çizilir. Kurucunun canlı taslağı çerçeveye
   ileti olarak gelir (rapor-format/ui/SahaCerceve.tsx) — burada çizilen ilk hâl kaydedilmiş tanımdır. Veritabanına hiçbir şey yazılmaz.
   Kapı: Ekipman türleri modülünü gören (sürüm sayfası gibi); format bu türün değilse bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../../../components/hata/Hata";
import { kurucuyaHazirla } from "../../../../../../../format/duzen";
import { raporStandartlari } from "../../../../../../../modules/dokumanlar/server/dokumanlar";
import { turKarti } from "../../../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../../../modules/moduller";
import { formatAyrintisi } from "../../../../../../../modules/rapor-format/server/formatlar";
import { SahaCerceve } from "../../../../../../../modules/rapor-format/ui/SahaCerceve";
import { ornekBugun, ornekSahaRaporu } from "../../../../../../../modules/raporlar/ornek";
import { modulOturumu, oturumIslemi } from "../../../../../../../server/kimlik/istek";
import { formatKriterleri } from "../../../../../../../tanim/kriterler";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Saha ekranı önizlemesi" };

export default async function Sayfa({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id, sid } = await params;
  const [f, tur, standartlar] = await oturumIslemi(o, async (db) => {
    const f = await formatAyrintisi(db, o, sid);
    const tur = f && f.turId === id ? await turKarti(db, o, id) : null;
    return [f, tur, tur ? await raporStandartlari(db, o) : null] as const;
  });
  if (!f || !tur || !f.tanim) notFound();
  /* taslak kurucudaki gibi hazırlanır (ekipman bölümü, ölçüm cihazları bölümü) — kurucunun ilk iletisi gelene kadar aynı görünsün */
  const tanim = f.durum === "taslak" ? kurucuyaHazirla(f.tanim) : f.tanim;
  const v = ornekSahaRaporu(tanim, {
    id: tur.id, ad: tur.ad, kod: tur.kod, brans: tur.brans, periyot: tur.periyot, std: tur.standartlar.map((s) => s.no), cihaz: tur.cihazTurleri.map((c) => c.ad),
  }, ornekBugun(), { standartlar, kriterler: formatKriterleri(tanim) });
  return <SahaCerceve v={v} />;
}
