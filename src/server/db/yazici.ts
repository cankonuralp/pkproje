/* ══ GÜVENLİ YAZICI + DENETİM İZİ (09-D1, D3 · KOD-GECIS §2 · 07) ═══════════════════════════════════════════════════
   Modüller kayıt eklerken / değiştirirken YALNIZ buradan yazar:
   · Yazılabilir sütunlar tablo tanımında listelidir; liste dışı ad (id, firma_id, surum, olustu, degisti ya da SQL parçası) SQL'e hiç girmez → hata.
   · İyimser kilit: `UPDATE … WHERE id = $1 AND surum = $2`; 0 satır = "başkası değiştirdi" (sessiz ezme yok). Sonuç türü reddi gizleyemez.
   · Yalnız DEĞİŞEN alanlar yazılır ve denetim izine eski / yeni olarak düşer; gizli alanların (parola özeti gibi) değeri ize yazılmaz.
   · Başka firmanın kaydı RLS yüzünden görünmez → "yok" (var olduğu da söylenmez).
   Kim ve ne zaman veritabanında damgalanır (0003_denetim_izi.sql); burada yazılan `kim` yalnız okunur addır. */
import type { Sorgulayici } from "./kiraci.ts";

const AD = /^[a-z_][a-z0-9_]{0,62}$/;
/** hiçbir tanımda yazılabilir olamaz: kimlik, kiracı, sürüm ve zaman damgaları yazıcının / veritabanının işidir */
const KORUNAN = new Set(["id", "firma_id", "surum", "olustu", "degisti"]);

export interface TabloTanimi<S extends string = string> {
  /** tablo adı (küçük harf, alt çizgi) */
  readonly ad: string;
  /** kullanıcı işlemiyle yazılabilen sütunlar */
  readonly sutunlar: readonly S[];
  /** değeri denetim izine yazılmayan sütunlar (yalnız "değişti" bilgisi) */
  readonly gizli?: readonly S[];
}

/** Tanımı bir kez doğrular (modül yüklenirken çağrılır; bozuk tanım uygulamayı açtırmaz). */
export function tablo<const S extends string>(t: TabloTanimi<S>): TabloTanimi<S> {
  if (!AD.test(t.ad)) throw new Error(`Geçersiz tablo adı: ${t.ad}`);
  for (const s of t.sutunlar) {
    if (!AD.test(s)) throw new Error(`Geçersiz sütun adı: ${t.ad}.${s}`);
    if (KORUNAN.has(s)) throw new Error(`Korunan sütun yazılabilir olamaz: ${t.ad}.${s}`);
  }
  for (const g of t.gizli ?? []) if (!t.sutunlar.includes(g)) throw new Error(`Gizli sütun yazılabilir listede yok: ${t.ad}.${g}`);
  return Object.freeze({ ...t, sutunlar: Object.freeze([...t.sutunlar]), gizli: Object.freeze([...(t.gizli ?? [])]) });
}

export interface Iz {
  /** okunur ad (kişi adı); hesap kimliği veritabanında işlem bağlamından damgalanır */
  kim: string;
  /** ne yapıldı: "personel.guncelle", "rapor.onaya_gonder" … */
  ne: string;
  gerekce?: string;
}

export type GuncelleSonucu =
  | { durum: "tamam"; surum: number; degisen: string[] }
  | { durum: "degisiklik_yok"; surum: number }
  | { durum: "cakisma"; guncelSurum: number }
  | { durum: "yok" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Her yazmada yeniden denetlenir: tanım `tablo()`dan geçmemiş elle yazılmış nesne olsa da SQL'e yalnız güvenli ad girer. */
function sutunlariDenetle<S extends string>(t: TabloTanimi<S>, degerler: Partial<Record<S, unknown>>): S[] {
  if (!AD.test(t.ad)) throw new Error(`Geçersiz tablo adı: ${t.ad}`);
  const anahtarlar = Object.keys(degerler) as S[];
  for (const k of anahtarlar) {
    if (!AD.test(k) || KORUNAN.has(k) || !(t.sutunlar as readonly string[]).includes(k)) throw new Error(`Yazılamaz sütun: ${t.ad}.${String(k)}`);
  }
  return anahtarlar.filter((k) => degerler[k] !== undefined);
}

/** JSON'a döküp karşılaştırır (tarih, dizi, nesne); veritabanından gelen değerle formdan geleni aynı biçimde kıyaslar */
function ayni(a: unknown, b: unknown): boolean {
  const n = (v: unknown) => JSON.stringify(v instanceof Date ? v.toISOString() : v ?? null);
  return n(a) === n(b);
}

function izDegeri<S extends string>(t: TabloTanimi<S>, s: S, v: unknown): unknown {
  return (t.gizli as readonly string[]).includes(s) ? "gizli" : v instanceof Date ? v.toISOString() : v ?? null;
}

export async function izYaz(db: Sorgulayici, iz: Iz & { nesne?: string; nesneId?: string; eski?: unknown; yeni?: unknown; ayrinti?: unknown }): Promise<void> {
  if (iz.nesne !== undefined && !AD.test(iz.nesne)) throw new Error(`Geçersiz nesne adı: ${iz.nesne}`);
  await db.sorgu(
    "INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, yeni, gerekce, ayrinti) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [iz.kim, iz.ne, iz.nesne ?? null, iz.nesneId ?? null, iz.eski === undefined ? null : JSON.stringify(iz.eski),
      iz.yeni === undefined ? null : JSON.stringify(iz.yeni), iz.gerekce ?? null, JSON.stringify(iz.ayrinti ?? {})]);
}

/** Yeni kayıt: yalnız tanımlı sütunlar; kimlik ve sürüm veritabanından döner, ize "yeni" olarak düşer. */
export async function ekle<S extends string>(db: Sorgulayici, t: TabloTanimi<S>, degerler: Partial<Record<S, unknown>>, iz: Iz): Promise<{ id: string; surum: number }> {
  const sutun = sutunlariDenetle(t, degerler);
  if (sutun.length === 0) throw new Error(`Boş kayıt eklenemez: ${t.ad}`);
  const r = await db.sorgu<{ id: string; surum: number }>(
    `INSERT INTO ${t.ad} (${sutun.join(", ")}) VALUES (${sutun.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id::text, surum`,
    sutun.map((s) => degerler[s]));
  const { id, surum } = r.rows[0];
  await izYaz(db, { ...iz, nesne: t.ad, nesneId: id, yeni: Object.fromEntries(sutun.map((s) => [s, izDegeri(t, s, degerler[s])])) });
  return { id, surum };
}

/** Var olan kaydı değiştirir: istemcinin gördüğü sürümle; yalnız değişen alanlar yazılır ve ize düşer. */
export async function guncelle<S extends string>(db: Sorgulayici, t: TabloTanimi<S>, id: string, surum: number, degerler: Partial<Record<S, unknown>>, iz: Iz): Promise<GuncelleSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  if (!Number.isSafeInteger(surum) || surum < 0) throw new Error("Geçersiz sürüm");
  const sutun = sutunlariDenetle(t, degerler);
  const mevcut = await db.sorgu<Record<string, unknown> & { surum: number }>(
    `SELECT surum${sutun.map((s) => `, ${s}`).join("")} FROM ${t.ad} WHERE id = $1 FOR UPDATE`, [id]);
  const satir = mevcut.rows[0];
  if (!satir) return { durum: "yok" };
  if (satir.surum !== surum) return { durum: "cakisma", guncelSurum: satir.surum };
  const degisen = sutun.filter((s) => !ayni(satir[s], degerler[s]));
  if (degisen.length === 0) return { durum: "degisiklik_yok", surum };
  const r = await db.sorgu<{ surum: number }>(
    `UPDATE ${t.ad} SET ${degisen.map((s, i) => `${s} = $${i + 3}`).join(", ")}, surum = surum + 1, degisti = now() WHERE id = $1 AND surum = $2 RETURNING surum`,
    [id, surum, ...degisen.map((s) => degerler[s])]);
  if (r.rowCount !== 1) return { durum: "cakisma", guncelSurum: surum + 1 };
  await izYaz(db, {
    ...iz, nesne: t.ad, nesneId: id,
    eski: Object.fromEntries(degisen.map((s) => [s, izDegeri(t, s, satir[s])])),
    yeni: Object.fromEntries(degisen.map((s) => [s, izDegeri(t, s, degerler[s])])),
  });
  return { durum: "tamam", surum: r.rows[0].surum, degisen };
}

/** Kaydı siler — yalnız tanımı olan tablodan, kimlikle; ize düşer. Silinebilirlik kuralı veritabanı tetiğinde ve çağıranda (ör. yalnız taslak
    teklifin kalemi — 0037); silme hakkı olmayan tabloda veritabanı reddeder. Başka firmanın satırı RLS ile görünmez → false. */
export async function sil<S extends string>(db: Sorgulayici, t: TabloTanimi<S>, id: string, iz: Iz): Promise<boolean> {
  if (!AD.test(t.ad)) throw new Error(`Geçersiz tablo adı: ${t.ad}`);
  if (!UUID.test(id)) return false;
  const r = await db.sorgu(`DELETE FROM ${t.ad} WHERE id = $1`, [id]);
  if (r.rowCount !== 1) return false;
  await izYaz(db, { ...iz, nesne: t.ad, nesneId: id });
  return true;
}
