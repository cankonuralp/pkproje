/* ONAYLAR'IN RAPORA BAKTIĞI YER (modül 15 → 14; 0026, 0029). Onaylar rapor tablosuna dokunmaz: rapor özetlerini buradan okur, durumu buradan yazar.
   Yetki ÇAĞIRANDA (Onaylar: modül 15 düzeyi + canDoEylem rapor_onayla / rapor_geri_gonder / rapor_durum_degistir / rapor_revizeye_gonder). Durum
   geçişinin kuralları, onay damgası, revizyon ve hareket kaydı (gerekçesiyle) veritabanı tetiğinde (0026–0029 rapor_akis, rapor_hareket_yaz). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { ekipmanlar } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { gorunenNo, type RaporDurumu } from "../sema.ts";
import { bekleyenIstekler, istekKapat, revizeDurumu, type RevizeIstegi } from "./revize.ts";

const RAPOR = tablo({ ad: "rapor", sutunlar: ["durum"] });
const RAPOR_REVIZE = tablo({ ad: "rapor", sutunlar: ["durum", "revizyon"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface RaporOzeti {
  /** no: görünen numara (revizyonda "-R1" ekiyle — 193); kokNo: eksiz numara */
  id: string; no: string; kokNo: string; revizyon: number; durum: RaporDurumu; surum: number; planId: string; ekipmanKod: string; turAd: string; brans: "m" | "e";
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
    id: string; no: string; revizyon: number; durum: RaporDurumu; surum: number; plan_id: string; ekipman_id: string; tur_id: string; personel_id: string; hesap_id: string | null;
    sonuc: RaporOzeti["sonuc"]; gonderildi: Date | null; onay: Date | null; olustu: Date;
  }>(`SELECT id::text, no, revizyon, durum, surum, plan_id::text, ekipman_id::text, tur_id::text, personel_id::text, hesap_id::text, sonuc, gonderildi, onay, olustu
      FROM rapor WHERE silindi IS NULL${kosul.map((k) => ` AND ${k}`).join("")}`, p)).rows;
  if (!l.length) return [];
  const ek = new Map((await ekipmanlar(db, [...new Set(l.map((x) => x.ekipman_id))])).map((e) => [e.id, e]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t]));
  const yer = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, { tesis: t.ad, musteri: m.kisa, musteriId: m.id, il: t.il }] as const)));
  const ad = new Map((await personelOzetleri(db, [...new Set(l.map((x) => x.personel_id))])).map((x) => [x.id, x.ad]));
  return l.map((x) => {
    const e = ek.get(x.ekipman_id), t = tur.get(x.tur_id), y = e ? yer.get(e.tesisId) : undefined;
    return {
      id: x.id, no: gorunenNo(x.no, x.revizyon), kokNo: x.no, revizyon: x.revizyon, durum: x.durum, surum: x.surum, planId: x.plan_id, ekipmanKod: e?.kod ?? "—", turAd: t?.ad ?? "—", brans: t?.brans ?? "m",
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

/** raporun son Yeni'ye dönüşü (geri gönder, durumu değiştir ya da revizeye gönder — 318: revize = açılan revizyon) — rapor ekranındaki şerit
    için. Yetki ÇAĞIRANDA. */
export async function sonGeriGonderme(db: Sorgulayici, raporId: string): Promise<{ hesapId: string | null; zaman: string; gerekce: string | null; revize: number | null } | null> {
  if (!UUID.test(raporId)) return null;
  const x = (await db.sorgu<{ hesap_id: string | null; zaman: Date; gerekce: string | null; ne: string; revizyon: number }>(
    "SELECT hesap_id::text, zaman, gerekce, ne, revizyon FROM rapor_hareket WHERE rapor_id = $1 AND ne IN ('geri', 'revize') ORDER BY zaman DESC LIMIT 1", [raporId])).rows[0];
  return x ? { hesapId: x.hesap_id, zaman: x.zaman.toISOString(), gerekce: x.gerekce, revize: x.ne === "revize" ? x.revizyon : null } : null;
}

/* ── REVİZYON (318; göç 0029) ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export type { RevizeIstegi };
/** bekleyen revize istekleri (Onaylar "Revize istekleri"; Onaylar her raporu kendi görme kuralıyla süzer). Yetki ÇAĞIRANDA. */
export const revizeIstekleri = (db: Sorgulayici) => bekleyenIstekler(db);
/** raporun şimdiki revizyonundaki bekleyen isteği. Yetki ÇAĞIRANDA. */
export const bekleyenRevizeIstegi = async (db: Sorgulayici, raporId: string, revizyon: number) => (await revizeDurumu(db, raporId, revizyon)).bekleyen;
/** revize isteğini reddet (gerekçe isteğe bağlı; yazan raporunda görür). Yetki ÇAĞIRANDA (rapor_revizeye_gonder). */
export const revizeIstegiReddet = (db: Sorgulayici, iz: Iz, x: RevizeIstegi, gerekce: string | null) => istekKapat(db, iz, x, "reddedildi", gerekce);
/** Revizeye gönder: tamamlanan rapor Yeni'ye döner, revizyon bir artar (R1, R2 …); gerekçe tetiğe verilir (≥ 10 — veritabanı da ister), hareket
    "revize" gerekçesiyle; bekleyen revize isteği tetikle kapanır; imzalı sürüm değişmeden kalır. Yetki ÇAĞIRANDA. */
export async function raporRevizeYaz(db: Sorgulayici, iz: Iz, id: string, surum: number, revizyon: number, gerekce: string): Promise<GuncelleSonucu> {
  await db.sorgu("SELECT set_config('app.gerekce', $1, true)", [gerekce]);
  const r = await guncelle(db, RAPOR_REVIZE, id, surum, { durum: "taslak", revizyon: revizyon + 1 }, { ...iz, gerekce });
  await db.sorgu("SELECT set_config('app.gerekce', '', true)");
  return r;
}
