/* RAPORLAR ↔ PERFORMANS BAĞLANTISI (modül 19 → 14; 329 — maket performans.html: sayılan rapor "Yeni"den itibaren her rapor, silinen sayılmaz;
   tamamlanma süresi açılış → ilk imza; süreç adımları yazım / düzeltme / onay / son imza; geri gönderilen). Performans rapor tablolarına
   dokunmaz; buradan okur: verilen günden (dahil) ÖNCE açılmış silinmemiş raporların planı, yazan personel, türü, açılış günü ve zamanı, ilk ve
   son gönderim, onay, ilk imza ve geri gönderme → yeniden gönderim çiftleri (hareket kaydından). Rapor içeriği, numarası, yazan hesap DÖNMEZ.
   Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export interface PerformansRaporu {
  id: string; planId: string; personelId: string; turId: string; gun: string; olustu: string; ilkGonderim: string | null; gonderildi: string | null;
  onay: string | null; imza: string | null; imzali: boolean; geriler: { geri: string; gonderim: string | null }[];
}
const iso = (d: Date | null) => (d ? d.toISOString() : null);

export async function performansRaporlari(db: Sorgulayici, bit: string): Promise<PerformansRaporu[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bit)) return [];
  const l = (await db.sorgu<{ id: string; plan_id: string; personel_id: string; tur_id: string; gun: string; olustu: Date; ilk_gonderim: Date | null;
    gonderildi: Date | null; onay: Date | null; imza: Date | null }>(
    `SELECT r.id::text, r.plan_id::text, r.personel_id::text, r.tur_id::text, (r.olustu AT TIME ZONE 'Europe/Istanbul')::date::text AS gun, r.olustu,
        r.ilk_gonderim, r.gonderildi, r.onay,
        (SELECT min(s.imzalandi) FROM rapor_surumu s WHERE s.firma_id = r.firma_id AND s.rapor_id = r.id) AS imza
     FROM rapor r WHERE r.silindi IS NULL AND (r.olustu AT TIME ZONE 'Europe/Istanbul')::date <= $1::date`, [bit])).rows;
  if (!l.length) return [];
  const h = new Map<string, { ne: string; zaman: Date }[]>();
  for (const x of (await db.sorgu<{ r: string; ne: string; zaman: Date }>(
    "SELECT rapor_id::text AS r, ne, zaman FROM rapor_hareket WHERE ne IN ('geri', 'gonder') AND rapor_id = ANY ($1::uuid[]) ORDER BY zaman", [l.map((r) => r.id)])).rows) {
    h.set(x.r, [...(h.get(x.r) ?? []), x]);
  }
  return l.map((r) => {
    const geriler: { geri: string; gonderim: string | null }[] = [];
    for (const x of h.get(r.id) ?? []) {
      if (x.ne === "geri") geriler.push({ geri: x.zaman.toISOString(), gonderim: null });
      else { const acik = geriler.at(-1); if (acik && !acik.gonderim) acik.gonderim = x.zaman.toISOString(); }
    }
    return { id: r.id, planId: r.plan_id, personelId: r.personel_id, turId: r.tur_id, gun: r.gun, olustu: r.olustu.toISOString(), ilkGonderim: iso(r.ilk_gonderim),
      gonderildi: iso(r.gonderildi), onay: iso(r.onay), imza: iso(r.imza), imzali: !!r.imza, geriler };
  });
}
