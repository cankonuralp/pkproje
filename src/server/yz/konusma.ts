/* S.A.Y KONUŞMASI (2026-10-23; göç 0103 yz_konusma, yz_ek, yz_ek_parca, yz_konusma_is) — kişinin konuşmasının yapay zekâya giden hâli, Messages
   API'nin içeriğiyle BİREBİR ve sırasıyla (yalnız sona eklenir; düşünme bloğu kendinden önceki her şey aynı kaldıkça geçerli). RLS firma + hesap;
   hesap veritabanında işlemin bağlamından. Çekirdek: modül (src/modules/say) buradan çağırır. */
import type { Sorgulayici } from "../db/kiraci.ts";

export type KonusmaRolu = "user" | "assistant" | "system";
export interface KonusmaIletisi { id: string; sira: number; rol: KonusmaRolu; icerik: unknown }

/** konuşmanın tamamı, eskiden yeniye */
export async function konusmaOku(db: Sorgulayici): Promise<KonusmaIletisi[]> {
  return (await db.sorgu<{ id: string; sira: string; rol: KonusmaRolu; icerik: unknown }>(
    "SELECT id::text, sira::text, rol, icerik FROM yz_konusma ORDER BY sira")).rows.map((r) => ({ ...r, sira: Number(r.sira) }));
}

/** sona ekler; dönen kimlik */
export async function konusmaEkle(db: Sorgulayici, rol: KonusmaRolu, icerik: unknown): Promise<string> {
  return (await db.sorgu<{ id: string }>("INSERT INTO yz_konusma (rol, icerik) VALUES ($1, $2::jsonb) RETURNING id::text", [rol, JSON.stringify(icerik)])).rows[0].id;
}

/** son yapay zekâ iletisinden SONRAKİ sayfa notlarını siler (cevapsız kalmış sorunun notu — yeni soruyla yenisi gelir); ardında düşünme bloğu
    olmadığı için önceki düşünmeler geçerli kalır. Dönen: silinen sayısı */
export async function kuyrukNotlariniSil(db: Sorgulayici): Promise<number> {
  return (await db.sorgu(
    `DELETE FROM yz_konusma WHERE rol = 'system'
       AND sira > coalesce((SELECT max(sira) FROM yz_konusma WHERE rol = 'assistant'), 0)`)).rowCount ?? 0;
}

/** "Sohbeti temizle": kişinin konuşması, ekleri, yarım yüklemeleri ve işi; dönen: hizmetteki ek dosyalarının kimlikleri (çağıran siler) */
export async function konusmaTemizle(db: Sorgulayici): Promise<string[]> {
  const dosyalar = (await db.sorgu<{ dosya: string }>("DELETE FROM yz_ek RETURNING dosya")).rows.map((r) => r.dosya);
  await db.sorgu("DELETE FROM yz_konusma");
  await db.sorgu("DELETE FROM yz_ek_parca");
  await db.sorgu("DELETE FROM yz_konusma_is");
  return dosyalar;
}

/* ── ekler ── */
export type EkTuru = "foto" | "pdf" | "word" | "metin" | "tablo";
export interface KonusmaEki { id: string; dosya: string; ad: string; tur: EkTuru; mime: string; boyut: number }

export async function ekKaydet(db: Sorgulayici, e: Omit<KonusmaEki, "id">): Promise<string> {
  return (await db.sorgu<{ id: string }>("INSERT INTO yz_ek (dosya, ad, tur, mime, boyut) VALUES ($1, $2, $3, $4, $5) RETURNING id::text",
    [e.dosya, e.ad, e.tur, e.mime, e.boyut])).rows[0].id;
}
/** kişinin kendi ekleri (verilen sırayla; başkasının ya da olmayan kimlik düşer) */
export async function ekleriAl(db: Sorgulayici, idler: readonly string[]): Promise<KonusmaEki[]> {
  if (!idler.length) return [];
  const l = (await db.sorgu<KonusmaEki & { boyut: string }>(
    "SELECT id::text, dosya, ad, tur, mime, boyut::text FROM yz_ek WHERE id = ANY($1::uuid[])", [idler])).rows.map((r) => ({ ...r, boyut: Number(r.boyut) }));
  return idler.flatMap((i) => l.filter((x) => x.id === i));
}

/* ── büyük dosyanın parçaları (barındırmanın istek boyu sınırı) ── */
export async function parcaYaz(db: Sorgulayici, yukleme: string, sira: number, veri: Uint8Array): Promise<void> {
  /* yarıda kalmış eski yüklemeler (bir günden eski) bu kişinin yeni yüklemesinde temizlenir */
  await db.sorgu("DELETE FROM yz_ek_parca WHERE zaman < now() - interval '1 day'");
  await db.sorgu("INSERT INTO yz_ek_parca (yukleme, sira, veri) VALUES ($1, $2, $3) ON CONFLICT (firma_id, hesap_id, yukleme, sira) DO NOTHING", [yukleme, sira, Buffer.from(veri)]);
}
/** yüklemenin parçaları sırasıyla birleşik; eksik parça varsa (0 … adet-1) null */
export async function parcalariBirlestir(db: Sorgulayici, yukleme: string, adet: number): Promise<Uint8Array | null> {
  const l = (await db.sorgu<{ sira: number; veri: Buffer }>("SELECT sira, veri FROM yz_ek_parca WHERE yukleme = $1 ORDER BY sira", [yukleme])).rows;
  if (l.length !== adet || l.some((p, i) => p.sira !== i)) return null;
  return new Uint8Array(Buffer.concat(l.map((p) => p.veri)));
}
export async function parcalariSil(db: Sorgulayici, yukleme: string): Promise<void> {
  await db.sorgu("DELETE FROM yz_ek_parca WHERE yukleme = $1", [yukleme]);
}

/** son yapay zekâ ya da kullanıcı iletisi (sayfa notları hariç) */
export async function konusmaSonu(db: Sorgulayici): Promise<KonusmaIletisi | null> {
  const r = (await db.sorgu<{ id: string; sira: string; rol: KonusmaRolu; icerik: unknown }>(
    "SELECT id::text, sira::text, rol, icerik FROM yz_konusma WHERE rol <> 'system' ORDER BY sira DESC LIMIT 1")).rows[0];
  return r ? { ...r, sira: Number(r.sira) } : null;
}

/* ── kişinin o anki işi: aynı konuşmaya iki pencere aynı anda yazmasın (sıra bozulmasın) ── */
/** işi alır ya da sürdürür (aynı iş kimliği); başka iş sürüyorsa (süresi dolmadıysa) false */
export async function isAl(db: Sorgulayici, isId: string, saniye: number): Promise<boolean> {
  const r = await db.sorgu(
    `INSERT INTO yz_konusma_is (is_id, bitis) VALUES ($1, now() + make_interval(secs => $2))
     ON CONFLICT (firma_id, hesap_id) DO UPDATE SET is_id = EXCLUDED.is_id, bitis = EXCLUDED.bitis
       WHERE yz_konusma_is.is_id = EXCLUDED.is_id OR yz_konusma_is.bitis <= now()`, [isId, saniye]);
  return (r.rowCount ?? 0) > 0;
}
/** iş bitti (ya da ekranın işini bekliyor): başka pencere yazabilir; bekleyen sonuçlar kalır */
export async function isBirak(db: Sorgulayici, isId: string): Promise<void> {
  await db.sorgu("UPDATE yz_konusma_is SET bitis = now() WHERE is_id = $1", [isId]);
}
/** ekranın işinden önce sunucunun yaptığı işlerin sonuçları (araç çağrısı kimliği → sonuç metni) */
export async function bekleyenYaz(db: Sorgulayici, sonuclar: Record<string, string>): Promise<void> {
  await db.sorgu("UPDATE yz_konusma_is SET bekleyen = $1::jsonb", [JSON.stringify(sonuclar)]);
}
/** bekleyen sonuçlar alınır ve silinir */
export async function bekleyenAl(db: Sorgulayici): Promise<Record<string, string>> {
  const r = (await db.sorgu<{ b: Record<string, string> }>("SELECT bekleyen AS b FROM yz_konusma_is FOR UPDATE")).rows[0];
  if (r) await db.sorgu("UPDATE yz_konusma_is SET bekleyen = '{}'::jsonb");
  return r?.b ?? {};
}
