/* YEDEĞİN KAYITLARI (2026-11-03; göç 0117) — bağlantı, izin ekranı dönüşü, kuyruk, hizmetteki yerler. Hepsi çağıranın kiracı işleminde (RLS).
   Erişim anahtarı firma_sir "bulut_erisimi"de şifreli (sir.ts) — burada yalnız durum ve sayılar. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { sirKullan, sirYaz } from "../ayar/sir.ts";
import { izYaz } from "../db/yazici.ts";

export type BaglantiDurumu = "bagli" | "kopuk" | "dolu" | "kesildi";
export interface Baglanti {
  id: string; saglayici: "gdrive" | "onedrive"; hesap: string; durum: BaglantiDurumu; neden: string | null; bildirildi: boolean; baglandi: Date;
  toplama: Date | null; tam_kopya: Date | null; ay_gonderim: Date | null; son_kopya: Date | null; son_dosya: string | null;
  denetim: Date | null; tasima: Date | null;
}
const SUTUN = `id::text, saglayici, hesap, durum, neden, bildirildi, baglandi, toplama, tam_kopya, ay_gonderim, son_kopya, son_dosya, denetim, tasima`;

export async function baglantiOku(db: Sorgulayici): Promise<Baglanti | null> {
  return (await db.sorgu<Baglanti>(`SELECT ${SUTUN} FROM bulut_baglanti`)).rows[0] ?? null;
}

/** aynı firmada tek gönderim: bağlı (ya da dolu) bağlantıyı 15 dakikalığına alır; başkası alıyorsa null */
export async function baglantiAl(db: Sorgulayici): Promise<Baglanti | null> {
  return (await db.sorgu<Baglanti>(
    `UPDATE bulut_baglanti SET isliyor = now() WHERE durum IN ('bagli', 'dolu') AND (isliyor IS NULL OR isliyor < now() - interval '15 minutes')
     RETURNING ${SUTUN}`)).rows[0] ?? null;
}
export async function baglantiBirak(db: Sorgulayici, id: string): Promise<void> {
  await db.sorgu("UPDATE bulut_baglanti SET isliyor = NULL WHERE id = $1", [id]);
}

export const yenilemeAnahtari = (db: Sorgulayici) => sirKullan(db, "bulut_erisimi");
export async function yenilemeYaz(db: Sorgulayici, yenileme: string | null): Promise<void> {
  await sirYaz(db, "bulut_erisimi", yenileme, { kim: "probata" });
}

/** bağlandı: hesap ya da hizmet değiştiyse gönderilmiş dosyalar yeniden sıraya girer ve yerler unutulur (yeni hesaba baştan, sunum K5) */
export async function baglantiYaz(db: Sorgulayici, b: { saglayici: "gdrive" | "onedrive"; hesap: string; kim: string }): Promise<{ yeni: boolean }> {
  const e = await baglantiOku(db);
  const yeni = !e || e.saglayici !== b.saglayici || e.hesap.toLowerCase() !== b.hesap.toLowerCase();
  if (e && yeni) {
    await db.sorgu("UPDATE bulut_kuyruk SET durum = 'bekliyor', deneme = 0, hata = NULL, gonderildi = NULL, denetlendi = NULL WHERE durum <> 'bekliyor'");
    await db.sorgu("DELETE FROM bulut_yer");
  }
  await db.sorgu(
    `INSERT INTO bulut_baglanti (saglayici, hesap) VALUES ($1, $2)
     ON CONFLICT (firma_id) DO UPDATE SET saglayici = EXCLUDED.saglayici, hesap = EXCLUDED.hesap, durum = 'bagli', neden = NULL, bildirildi = false,
       baglandi = now(), tam_kopya = CASE WHEN $3 THEN NULL ELSE bulut_baglanti.tam_kopya END,
       ay_gonderim = CASE WHEN $3 THEN NULL ELSE bulut_baglanti.ay_gonderim END, surum = bulut_baglanti.surum + 1, degisti = now()`,
    [b.saglayici, b.hesap, yeni]);
  await izYaz(db, { kim: b.kim, ne: "yedek.baglandi", nesne: "bulut_baglanti", ayrinti: { saglayici: b.saglayici } });
  return { yeni };
}
export async function baglantiKesYaz(db: Sorgulayici, kim: string): Promise<void> {
  await db.sorgu("UPDATE bulut_baglanti SET durum = 'kesildi', neden = NULL, isliyor = NULL, surum = surum + 1, degisti = now()");
  await yenilemeYaz(db, null);
  await izYaz(db, { kim, ne: "yedek.kesildi", nesne: "bulut_baglanti" });
}
/** kopuk / dolu / yeniden bağlı; ilk kez sorun çıkınca true döner (bir kez haber verilir) */
export async function durumYaz(db: Sorgulayici, id: string, durum: "bagli" | "kopuk" | "dolu", neden: string | null): Promise<boolean> {
  const e = (await db.sorgu<{ bildirildi: boolean }>("SELECT bildirildi FROM bulut_baglanti WHERE id = $1 AND durum <> 'kesildi' FOR UPDATE", [id])).rows[0];
  if (!e) return false;
  const sorun = durum !== "bagli";
  await db.sorgu("UPDATE bulut_baglanti SET durum = $2, neden = $3, bildirildi = $4, surum = surum + 1, degisti = now() WHERE id = $1",
    [id, durum, neden?.slice(0, 300) ?? null, sorun]);
  return sorun && !e.bildirildi;
}
export async function zamanYaz(db: Sorgulayici, id: string, alan: "toplama" | "tam_kopya" | "ay_gonderim", t: Date): Promise<void> {
  const sutun = { toplama: "toplama", tam_kopya: "tam_kopya", ay_gonderim: "ay_gonderim" }[alan];
  await db.sorgu(`UPDATE bulut_baglanti SET ${sutun} = $2 WHERE id = $1`, [id, t]);
}

/* ── izin ekranına gidiş (tek kullanımlık) ── */
export async function izinYaz(db: Sorgulayici, i: { kod: string; dogrulayici: string; saglayici: "gdrive" | "onedrive"; hesapId: string }): Promise<void> {
  await db.sorgu("DELETE FROM bulut_izin WHERE son < now()");
  await db.sorgu("INSERT INTO bulut_izin (kod, dogrulayici, saglayici, hesap_id) VALUES ($1, $2, $3, $4)", [i.kod, i.dogrulayici, i.saglayici, i.hesapId]);
}
/** dönüşte: kaydı alır VE siler (ikinci kez kullanılamaz); süresi dolmuşsa null */
export async function izinAl(db: Sorgulayici, kod: string): Promise<{ dogrulayici: string; saglayici: "gdrive" | "onedrive"; hesap_id: string; gecerli: boolean } | null> {
  return (await db.sorgu<{ dogrulayici: string; saglayici: "gdrive" | "onedrive"; hesap_id: string; gecerli: boolean }>(
    "DELETE FROM bulut_izin WHERE kod = $1 RETURNING dogrulayici, saglayici, hesap_id::text, son > now() AS gecerli", [kod])).rows[0] ?? null;
}

/* ── kuyruk ── */
export interface KuyrukGirdisi { dosyaId: string; yol: readonly string[]; ad: string }
export async function kuyrugaEkle(db: Sorgulayici, l: readonly KuyrukGirdisi[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < l.length; i += 500) {
    const p = l.slice(i, i + 500);
    n += (await db.sorgu(
      `INSERT INTO bulut_kuyruk (dosya_id, yol, ad)
       SELECT d, string_to_array(y, chr(31)), a FROM unnest($1::uuid[], $2::text[], $3::text[]) AS u(d, y, a)
       ON CONFLICT (firma_id, dosya_id) DO NOTHING`,
      [p.map((x) => x.dosyaId), p.map((x) => x.yol.join("\u001f")), p.map((x) => x.ad)])).rowCount ?? 0;
  }
  return n;
}
export interface KuyrukSatiri { id: string; dosya_id: string; yol: string[]; ad: string }
export async function siradaki(db: Sorgulayici, atla: readonly string[]): Promise<KuyrukSatiri | null> {
  return (await db.sorgu<KuyrukSatiri>(
    `SELECT id::text, dosya_id::text, yol, ad FROM bulut_kuyruk WHERE durum = 'bekliyor' AND NOT (id = ANY ($1::uuid[]))
     ORDER BY deneme, eklendi, id LIMIT 1`, [atla])).rows[0] ?? null;
}
export async function gonderildiYaz(db: Sorgulayici, b: string, k: KuyrukSatiri, boyut: number): Promise<void> {
  await db.sorgu("UPDATE bulut_kuyruk SET durum = 'gonderildi', gonderildi = now(), boyut = $2, hata = NULL WHERE id = $1", [k.id, boyut]);
  await db.sorgu("UPDATE bulut_baglanti SET son_kopya = now(), son_dosya = $2 WHERE id = $1", [b, k.ad.slice(0, 300)]);
}
export async function yokYaz(db: Sorgulayici, id: string): Promise<void> {
  await db.sorgu("UPDATE bulut_kuyruk SET durum = 'yok', hata = 'dosya artık yok' WHERE id = $1", [id]);
}
export async function denemeYaz(db: Sorgulayici, id: string, hata: string): Promise<void> {
  await db.sorgu("UPDATE bulut_kuyruk SET deneme = deneme + 1, hata = $2 WHERE id = $1", [id, hata.slice(0, 300)]);
}
export async function kuyrukSayilari(db: Sorgulayici): Promise<{ gonderildi: number; bekliyor: number; bayt: number }> {
  const r = (await db.sorgu<{ g: number; b: number; bayt: string }>(
    `SELECT count(*) FILTER (WHERE durum = 'gonderildi')::int AS g, count(*) FILTER (WHERE durum = 'bekliyor')::int AS b,
       coalesce(sum(boyut) FILTER (WHERE durum = 'gonderildi'), 0)::text AS bayt FROM bulut_kuyruk`)).rows[0]!;
  return { gonderildi: r.g, bekliyor: r.b, bayt: Number(r.bayt) };
}

/** Google Drive'ın klasör / dosya kimlikleri — kayıtlı yol önekiyle silinir */
export function yerDeposu(db: Sorgulayici): { al(yol: string): Promise<string | null>; koy(yol: string, id: string): Promise<void>; sil(onek: string): Promise<void> } {
  return {
    async al(yol) { return (await db.sorgu<{ u: string }>("SELECT uzak_id AS u FROM bulut_yer WHERE yol = $1", [yol])).rows[0]?.u ?? null; },
    async koy(yol, id) {
      await db.sorgu("INSERT INTO bulut_yer (yol, uzak_id) VALUES ($1, $2) ON CONFLICT (firma_id, yol) DO UPDATE SET uzak_id = EXCLUDED.uzak_id", [yol, id]);
    },
    async sil(onek) { await db.sorgu("DELETE FROM bulut_yer WHERE yol = $1 OR left(yol, length($1) + 1) = $1 || '/'", [onek]); },
  };
}

/* ── Drive denetimi ve Supabase'ten taşıma (2026-11-04; göç 0118) ── */
/** gönderilmiş, en son 30 günden önce (ya da hiç) Drive'da bulunmuş dosyalar — en eski önce; en çok `n` */
export async function denetlenecekler(db: Sorgulayici, n: number): Promise<KuyrukSatiri[]> {
  return (await db.sorgu<KuyrukSatiri>(
    `SELECT id::text, dosya_id::text, yol, ad FROM bulut_kuyruk WHERE durum = 'gonderildi' AND coalesce(denetlendi, gonderildi) < now() - interval '30 days'
     ORDER BY coalesce(denetlendi, gonderildi), id LIMIT $1`, [n])).rows;
}
/** taşınacak raporun Drive'a gönderilmiş dosyaları (yolu ve adıyla) */
export async function dosyaninKuyrugu(db: Sorgulayici, dosyalar: readonly string[]): Promise<(KuyrukSatiri & { durum: string; boyut: string | null })[]> {
  return (await db.sorgu<KuyrukSatiri & { durum: string; boyut: string | null }>(
    "SELECT id::text, dosya_id::text, yol, ad, durum, boyut::text FROM bulut_kuyruk WHERE dosya_id = ANY ($1::uuid[])", [dosyalar])).rows;
}
export async function denetlendiYaz(db: Sorgulayici, id: string): Promise<void> {
  await db.sorgu("UPDATE bulut_kuyruk SET denetlendi = now() WHERE id = $1", [id]);
}
/** Drive'da yok: yeniden sıraya (yeni dosya açılır — kayıtlı kimlik unutulur) */
export async function eksikYaz(db: Sorgulayici, k: KuyrukSatiri): Promise<void> {
  await db.sorgu("UPDATE bulut_kuyruk SET durum = 'bekliyor', deneme = 0, hata = NULL, gonderildi = NULL, denetlendi = NULL WHERE id = $1", [k.id]);
  await db.sorgu("DELETE FROM bulut_yer WHERE yol = $1", [[...k.yol, k.ad].join("/")]);
}
export async function kosuYaz(db: Sorgulayici, id: string, alan: "denetim" | "tasima"): Promise<void> {
  await db.sorgu(`UPDATE bulut_baglanti SET ${alan === "denetim" ? "denetim" : "tasima"} = now() WHERE id = $1`, [id]);
}
