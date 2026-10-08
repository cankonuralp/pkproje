/* ÇEVRİMDIŞI PAKET (396; ARKA-UC §4.2 "kullanıcı çevrimiçiyken kabul ettiği / denetimdeki planların önümüzdeki 7 günü cihaza iner … ekranda
   'Çevrimdışı hazır: 3 plan · son eşitleme 08:42'"; maket Z4). Kişinin EKİBİNDE olduğu, kabul edilmiş ya da denetimdeki planlar (başlangıcı önümüzdeki
   7 gün içinde ya da başlamış) ve bu planlarda KENDİ yazdığı Yeni raporlar — cihaz bu sayfaları bağlantı varken önceden açar, servis çalışanı
   şifreli saklar (public/sw.js). Yalnız sayfa adresleri döner (veri sayfanın kendisiyle, sayfanın kendi yetki denetiminden geçerek gelir). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { planRaporlari } from "../../raporlar/server/plan-baglanti.ts";

export const PAKET_GUN = 7;

export interface CevrimdisiPaketi { planlar: { id: string; no: string }[]; raporlar: { id: string; no: string }[] }

export async function cevrimdisiPaketi(db: Sorgulayici, kim: { id: string }, bugun: string): Promise<CevrimdisiPaketi> {
  const ben = await hesabinPersoneli(db, kim.id);
  if (!ben) return { planlar: [], raporlar: [] };
  const planlar = (await db.sorgu<{ id: string; no: string }>(
    `SELECT p.id::text, p.no FROM plan p JOIN plan_ekip e ON e.firma_id = p.firma_id AND e.plan_id = p.id
     WHERE e.personel_id = $1 AND p.durum IN ('kabul', 'denetimde') AND p.baslangic <= $2::date + $3::int
     ORDER BY p.baslangic, p.no LIMIT 20`, [ben, bugun, PAKET_GUN])).rows;
  const raporlar: CevrimdisiPaketi["raporlar"] = [];
  for (const p of planlar) {
    for (const r of await planRaporlari(db, p.id)) if (r.hesapId === kim.id && r.durum === "taslak") raporlar.push({ id: r.id, no: r.no });
  }
  return { planlar, raporlar: raporlar.slice(0, 100) };
}
