/* ONAYLAR'IN RAPORA BAKTIĞI YER (modül 15 → 14; 0026). Onaylar rapor tablosuna dokunmaz: rapor özetlerini buradan okur, durumu buradan yazar.
   Yetki ÇAĞIRANDA (Onaylar: modül 15 düzeyi + canDoEylem rapor_onayla / rapor_geri_gonder / rapor_durum_degistir). Durum geçişinin kuralları,
   onay damgası ve hareket kaydı (gerekçesiyle) veritabanı tetiğinde (0026 rapor_akis, rapor_hareket_yaz). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { ekipmanlar } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import type { RaporDurumu } from "../sema.ts";

const RAPOR = tablo({ ad: "rapor", sutunlar: ["durum"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface RaporOzeti {
  id: string; no: string; durum: RaporDurumu; surum: number; planId: string; ekipmanKod: string; turAd: string; brans: "m" | "e";
  musteri: string; musteriId: string; tesis: string; tesisId: string; il: string | null; personelId: string; denetci: string;
  /** yazan hesap (yetki kaydının sahibi; istemciye gönderilmez) */
  hesapId: string | null;
  sonuc: "uygun" | "uygun_degil" | null; gonderildi: string | null; onay: string | null; olustu: string;
}

/** etkin (silinmemiş) raporların özetleri: durum süzgeci ya da tek rapor. Yetki ÇAĞIRANDA (Onaylar kayıt kayıt canDo ile süzer). */
export async function raporOzetleri(db: Sorgulayici, s: { durumlar?: readonly RaporDurumu[]; id?: string } = {}): Promise<RaporOzeti[]> {
  const kosul: string[] = [], p: unknown[] = [];
  if (s.id !== undefined) { if (!UUID.test(s.id)) return []; p.push(s.id); kosul.push(`id = $${p.length}`); }
  if (s.durumlar) { p.push([...s.durumlar]); kosul.push(`durum = ANY ($${p.length}::text[])`); }
  const l = (await db.sorgu<{
    id: string; no: string; durum: RaporDurumu; surum: number; plan_id: string; ekipman_id: string; tur_id: string; personel_id: string; hesap_id: string | null;
    sonuc: RaporOzeti["sonuc"]; gonderildi: Date | null; onay: Date | null; olustu: Date;
  }>(`SELECT id::text, no, durum, surum, plan_id::text, ekipman_id::text, tur_id::text, personel_id::text, hesap_id::text, sonuc, gonderildi, onay, olustu
      FROM rapor WHERE silindi IS NULL${kosul.map((k) => ` AND ${k}`).join("")}`, p)).rows;
  if (!l.length) return [];
  const ek = new Map((await ekipmanlar(db, [...new Set(l.map((x) => x.ekipman_id))])).map((e) => [e.id, e]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t]));
  const yer = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, { tesis: t.ad, musteri: m.kisa, musteriId: m.id, il: t.il }] as const)));
  const ad = new Map((await personelOzetleri(db, [...new Set(l.map((x) => x.personel_id))])).map((x) => [x.id, x.ad]));
  return l.map((x) => {
    const e = ek.get(x.ekipman_id), t = tur.get(x.tur_id), y = e ? yer.get(e.tesisId) : undefined;
    return {
      id: x.id, no: x.no, durum: x.durum, surum: x.surum, planId: x.plan_id, ekipmanKod: e?.kod ?? "—", turAd: t?.ad ?? "—", brans: t?.brans ?? "m",
      musteri: y?.musteri ?? "—", musteriId: y?.musteriId ?? "", tesis: y?.tesis ?? "—", tesisId: e?.tesisId ?? "", il: y?.il ?? null,
      personelId: x.personel_id, denetci: ad.get(x.personel_id) ?? "—",
      hesapId: x.hesap_id, sonuc: x.sonuc, gonderildi: x.gonderildi?.toISOString() ?? null, onay: x.onay?.toISOString() ?? null, olustu: x.olustu.toISOString(),
    };
  });
}

/** Onaylar'ın açtığı geçişler (gönder, onayla, geri gönder, onayı geri al, durumu değiştir) */
export type OnayGecisi = "taslak" | "onayda" | "onaylandi";
/** raporun durumunu yazar (istemcinin gördüğü sürümle). Gerekçe yalnız bu işlem için tetiğe verilir (Yeni'ye dönüşte en az 10 karakter —
    veritabanı da ister) ve hareket kaydına gerekçesiyle düşer. Yetki ÇAĞIRANDA. */
export async function raporDurumYaz(db: Sorgulayici, iz: Iz, id: string, surum: number, durum: OnayGecisi, gerekce: string | null): Promise<GuncelleSonucu> {
  await db.sorgu("SELECT set_config('app.gerekce', $1, true)", [gerekce ?? ""]);
  const r = await guncelle(db, RAPOR, id, surum, { durum }, gerekce ? { ...iz, gerekce } : iz);
  await db.sorgu("SELECT set_config('app.gerekce', '', true)");
  return r;
}

/** raporun son geri gönderilişi (Yeni'ye dönüş: geri gönder ya da durumu değiştir) — rapor ekranındaki şerit için. Yetki ÇAĞIRANDA. */
export async function sonGeriGonderme(db: Sorgulayici, raporId: string): Promise<{ hesapId: string | null; zaman: string; gerekce: string | null } | null> {
  if (!UUID.test(raporId)) return null;
  const x = (await db.sorgu<{ hesap_id: string | null; zaman: Date; gerekce: string | null }>(
    "SELECT hesap_id::text, zaman, gerekce FROM rapor_hareket WHERE rapor_id = $1 AND ne = 'geri' ORDER BY zaman DESC LIMIT 1", [raporId])).rows[0];
  return x ? { hesapId: x.hesap_id, zaman: x.zaman.toISOString(), gerekce: x.gerekce } : null;
}
