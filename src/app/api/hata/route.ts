/* TARAYICI HATASI UCU (567; 06-HATA-TAKIBI "yakalanmayan hata ve reddedilen söz küresel olarak yakalanır") — sayfanın hata dinleyicisi
   (components/hata/bildir.ts) ve hata sınırları (error.tsx) buraya yollar. Yalnız aynı kökenden; gövde en çok 16 KB ve biçimli; kişi ve firma
   İSTEMCİDEN ALINMAZ: oturumdan (hesap kimliği) ve adresten (alt alan adı). Maske, kırpma, gürültü ve sel sınırı kayıt yolunda (server/hata,
   göç 0093). Yanıt her zaman 204 — uç hiçbir bilgi döndürmez, yazılıp yazılmadığını söylemez. */
import { headers } from "next/headers";
import { z } from "zod";
import { hataKaydet } from "../../../server/hata/kaydet";
import { istekOturumu } from "../../../server/kimlik/istek";
import { ayniKoken } from "../../../server/kimlik/koken";
import { kiraciAdiCoz } from "../../../server/kiraci/coz";
import { anaAlan } from "../../../server/kiraci/istek";

export const dynamic = "force-dynamic";

const Govde = z.object({
  mesaj: z.string().min(1).max(2000),
  yer: z.string().max(500).optional(),
  yigin: z.string().max(8000).optional(),
  adres: z.string().max(500).optional(),
});
const BOS = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return BOS();
  const metin = await istek.text().catch(() => "");
  if (!metin || metin.length > 16_000) return BOS();
  let ham: unknown;
  try { ham = JSON.parse(metin); } catch { return BOS(); }
  const g = Govde.safeParse(ham);
  if (!g.success) return BOS();
  const h = await headers();
  const o = await istekOturumu().catch(() => null);
  await hataKaydet({
    kaynak: "istemci", ...g.data, alan: kiraciAdiCoz(h.get("host") ?? "", anaAlan()), hesap: o?.id ?? null, cihaz: h.get("user-agent"),
  });
  return BOS();
}
