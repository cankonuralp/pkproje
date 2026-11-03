/* KUYRUĞA TOPLAMA (2026-11-03; reisim: "yeni eklenenler eklensin yedeğe yeter") — son toplamadan BU YANA imzalanan raporlar ve yüklenen belgeler
   kuyruğa girer; bütün dosyalar taranmaz. İlk bağlanışta (toplama boş) bugüne kadarkilerin hepsi girer (sunum K4); gönderim parça parça. Bir saatlik
   örtüşme: geç biten işlemin satırı kaçmaz — kuyrukta dosya başına tek satır (aynı dosya ikinci kez girmez). */
import type { Sorgulayici } from "../db/kiraci.ts";
import { yedekRaporlari } from "../../modules/raporlar/server/yedek-baglanti.ts";
import { kuyrugaEkle, zamanYaz, type Baglanti, type KuyrukGirdisi } from "./kayit.ts";
import { adTemizle, BELGE_KLASORU, belgeAdi, belgeYolu, dosyaAdi, raporKlasoru, UZANTI, type KlasorDuzeni } from "./yol.ts";

const PARTI = 1000;
const ORTUSME_MS = 60 * 60 * 1000;

export async function kuyrugaTopla(db: Sorgulayici, b: Pick<Baglanti, "id" | "toplama">, a: { kok: string; duzen: KlasorDuzeni }, simdi: Date): Promise<number> {
  const sonra = b.toplama ? new Date(b.toplama.getTime() - ORTUSME_MS) : null;
  let n = 0;
  /* imzalı raporlar: PDF + raporda görünmeyen fotoğraflar (raporun klasörü) */
  for (let imlec = sonra; ;) {
    const l = await yedekRaporlari(db, imlec, PARTI);
    if (!l.length) break;
    const g: KuyrukGirdisi[] = [];
    for (const r of l) {
      const yol = raporKlasoru({ kok: a.kok, duzen: a.duzen, musteri: r.musteri, tesis: r.tesis, yil: r.yil, no: r.no });
      let okuma = 0, form = 0;
      for (const d of r.dosyalar) {
        const u = UZANTI[d.tur] ?? "bin";
        g.push({ dosyaId: d.id, yol, ad: d.ne === "pdf" ? dosyaAdi(r.gorunenNo, "pdf") : d.ne === "okuma" ? `okuma ${++okuma}.${u}` : `${adTemizle(r.gorunenNo)} form ${++form}.${u}` });
      }
    }
    n += await kuyrugaEkle(db, g);
    if (l.length < PARTI) break;
    imlec = l[l.length - 1]!.imzalandi;
  }
  /* yüklenen belgeler (Belgeler/<tür>) */
  const moduller = Object.keys(BELGE_KLASORU);
  for (let imlec: { t: Date; id: string } | null = null; ;) {
    const l: { id: string; modul: string; ad: string; tur: string; olustu: Date }[] = (await db.sorgu<{ id: string; modul: string; ad: string; tur: string; olustu: Date }>(
      `SELECT id::text, modul, ad, tur, olustu FROM dosya WHERE modul = ANY ($1::text[]) AND cop IS NULL AND olustu > coalesce($2::timestamptz, '-infinity')
         AND (olustu, id) > (coalesce($3::timestamptz, '-infinity'), coalesce($4::uuid, '00000000-0000-0000-0000-000000000000'))
       ORDER BY olustu, id LIMIT ${PARTI}`, [moduller, sonra, imlec?.t ?? null, imlec?.id ?? null])).rows;
    if (!l.length) break;
    n += await kuyrugaEkle(db, l.flatMap((d) => {
      const yol = belgeYolu(a.kok, d.modul);
      return yol ? [{ dosyaId: d.id, yol, ad: belgeAdi(d.ad, d.id, d.tur) }] : [];
    }));
    if (l.length < PARTI) break;
    imlec = { t: l[l.length - 1]!.olustu, id: l[l.length - 1]!.id };
  }
  await zamanYaz(db, b.id, "toplama", simdi);
  return n;
}
