/* RAPORDA BEKLEYEN ÖNERİLER (525; göç 0086 rapor_oneri; pkproje §3.10 m.7, m.12) — S.A.Y Chat kaydından rapor yazılırken yapay zekânın okuduğu
   değerler raporun o bölümünde ÖNERİ olarak bekler (rapora yazılmaz); rapor ekranı açılınca bölümün öneri kartında görünür, "Uygula" / "Vazgeç"
   deyince silinir. tur "bilgi" (bolum ''): raporun üstündeki "S.A.Y Chat kaydından oluşturuldu" şeridinin metni. Kişiye özel (RLS: firma + yazan);
   yazma S.A.Y Chat'in rapor yazmasından — rapor yazılabilir mi orada denetlenir (alanOkunabilir / okunabilirOlcum / chatRaporuDoldur). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, sil, tablo } from "../../../server/db/yazici.ts";

const ONERI = tablo({ ad: "rapor_oneri", sutunlar: ["rapor_id", "bolum", "tur", "okunan"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BOLUM = /^[A-Za-z0-9_-]{0,60}$/;
export type OneriTuru = "alan" | "tablo" | "bilgi";
export interface RaporOnerisi { bolum: string; tur: OneriTuru; okunan: unknown }

export async function raporOneriYaz(db: Sorgulayici, kim: { ad: string }, raporId: string, bolum: string, tur: OneriTuru, okunan: unknown): Promise<void> {
  if (!UUID.test(raporId) || !BOLUM.test(bolum)) return;
  await ekle(db, ONERI, { rapor_id: raporId, bolum, tur, okunan: JSON.stringify(okunan) }, { kim: kim.ad, ne: "rapor.oneri", gerekce: bolum || "S.A.Y Chat" });
}

/** raporun yazana bekleyen önerileri (bölüm başına birleşik: aynı bölümün okumaları art arda) */
export async function raporOnerileri(db: Sorgulayici, raporId: string): Promise<RaporOnerisi[]> {
  if (!UUID.test(raporId)) return [];
  const l = (await db.sorgu<{ bolum: string; tur: OneriTuru; okunan: unknown }>(
    "SELECT bolum, tur, okunan FROM rapor_oneri WHERE rapor_id = $1 ORDER BY olustu, id", [raporId])).rows;
  const o: RaporOnerisi[] = [];
  for (const x of l) {
    const v = o.find((y) => y.bolum === x.bolum && y.tur === x.tur);
    if (v && Array.isArray(v.okunan) && Array.isArray(x.okunan)) v.okunan = [...v.okunan, ...x.okunan];
    else if (!v) o.push({ ...x });
  }
  return o;
}

/** "Uygula" / "Vazgeç" / şeridi kapat: bölümün bekleyen önerileri kalkar (yalnız kişinin kendisininkiler — RLS) */
export async function raporOneriSil(db: Sorgulayici, kim: { ad: string }, raporId: string, bolum: string): Promise<number> {
  if (!UUID.test(raporId) || !BOLUM.test(bolum)) return 0;
  const l = (await db.sorgu<{ id: string }>("SELECT id::text FROM rapor_oneri WHERE rapor_id = $1 AND bolum = $2", [raporId, bolum])).rows;
  let n = 0;
  for (const x of l) if (await sil(db, ONERI, x.id, { kim: kim.ad, ne: "rapor.oneri_kapat" })) n++;
  return n;
}
