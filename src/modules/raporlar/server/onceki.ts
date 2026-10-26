/* ÖNCEKİ RAPOR (2026-10-17, iş planı İ1–İ3; reisim: "ilerleyen senelerde aynı raporları tekrar rapor oluştur diyerek oluşturup kullanabilmek" ·
   "her ekipmanın satırının başında göz işareti olacak ve tıklayınca geçen seneki (en sonki tamamlanmış imzalı rapor) rapor gözükecek" · "illa
   imzalı rapordan bilgi mi almalıyız … pdfden bilgi almamız gerekir hazır sisteme girili rapor bilgileri varken"). Ekipmanın ÖNCEKİ raporu = başka
   plandaki EN SON TAMAMLANMIŞ (imzalı) raporu: her raporun son imzalı sürümü (yerini yeni revizyona bırakmış sürüm sayılmaz — uygunsuzluk tetiği
   0031 ile aynı kural), en yeni kontrol tarihli (eşitse en son imzalanan). Bilgiler PDF'ten DEĞİL, imzalı sürümün kayıtlı içeriğinden
   (rapor_surumu.icerik — imza anında yazılır, değişmez). Tablonun sahibi bu modül; Planlar ve dosya ucu buradan okur. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { raporSonucuMu, type RaporSonucu } from "../../../format/tanim.ts";
import { SONUC_AD } from "../sema.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** son imzalı sürümler (revizyonu aşılmamış) — en yeni kontrol, eşitse en son imza */
const SON_SURUMLER = `FROM rapor_surumu s LEFT JOIN saklama_silme k ON k.firma_id = s.firma_id AND k.surum_id = s.id
  WHERE s.ekipman_id = ANY($1::uuid[]) AND ($2::uuid IS NULL OR s.plan_id <> $2::uuid)
    AND NOT EXISTS (SELECT 1 FROM rapor_surumu z WHERE z.firma_id = s.firma_id AND z.rapor_id = s.rapor_id AND z.revizyon > s.revizyon)
  ORDER BY s.ekipman_id, s.kontrol_tarihi DESC NULLS LAST, s.imzalandi DESC`;

export interface OncekiRapor {
  raporId: string;
  /** görünen numara (revizyonlu: …-R1) */
  no: string;
  /** muayene (kontrol) tarihi YYYY-AA-GG */
  tarih: string | null;
  sonuc: RaporSonucu | null;
  /** imzalı PDF'in dosya kimliği; saklama süresi dolduğu için silindiyse null */
  dosya: string | null;
  /** PDF'in silindiği an (saklama süresi) */
  silindi: string | null;
  /** raporu yazan hesap (Raporlar'ın görme kuralı — kendi / branş; plan içi göz yetkisi) */
  hesapId: string | null;
}

/** ekipmanların önceki raporları (ekipman → rapor). haricPlan: bu planın raporları sayılmaz (plan içi, yeni rapor). Yetki ÇAĞIRANDA. */
export async function oncekiRaporlar(db: Sorgulayici, ekipmanlar: readonly string[], haricPlan: string | null): Promise<Map<string, OncekiRapor>> {
  const l = ekipmanlar.filter((x) => UUID.test(x));
  if (!l.length || (haricPlan !== null && !UUID.test(haricPlan))) return new Map();
  const r = await db.sorgu<{ ekipman: string; rapor: string; no: string; tarih: string | null; sonuc: string | null; dosya: string; silindi: Date | null; hesap: string | null }>(
    `SELECT DISTINCT ON (s.ekipman_id) s.ekipman_id::text AS ekipman, s.rapor_id::text AS rapor, s.no, s.kontrol_tarihi::text AS tarih, s.sonuc,
       s.imzali_dosya::text AS dosya, k.silindi, (SELECT r.hesap_id::text FROM rapor r WHERE r.firma_id = s.firma_id AND r.id = s.rapor_id) AS hesap
     ${SON_SURUMLER}`, [l, haricPlan]);
  return new Map(r.rows.map((x) => [x.ekipman, {
    raporId: x.rapor, no: x.no, tarih: x.tarih, sonuc: raporSonucuMu(x.sonuc) ? x.sonuc : null,
    dosya: x.silindi ? null : x.dosya, silindi: x.silindi?.toISOString() ?? null, hesapId: x.hesap,
  }]));
}

/** yeni raporun kaynağı (İ1): ekipmanın önceki raporunun imza anındaki kayıtlı içeriği — cevaplar ve ekipman bilgileri (doğrulanmamış; çağıran
    şemadan geçirir). Önceki raporu yoksa null. Yetki ÇAĞIRANDA. */
export async function oncekiRaporIcerigi(db: Sorgulayici, ekipmanId: string, haricPlan: string): Promise<{ no: string; cevaplar: unknown; ekipmanBilgi: unknown } | null> {
  if (!UUID.test(ekipmanId) || !UUID.test(haricPlan)) return null;
  const x = (await db.sorgu<{ no: string; icerik: { cevaplar?: unknown; ekipman_bilgi?: unknown } }>(
    `SELECT DISTINCT ON (s.ekipman_id) s.no, s.icerik ${SON_SURUMLER}`, [[ekipmanId], haricPlan])).rows[0];
  return x ? { no: x.no, cevaplar: x.icerik?.cevaplar ?? null, ekipmanBilgi: x.icerik?.ekipman_bilgi ?? null } : null;
}

/** imzalı sürümü olan raporun ekipmanı (dosya ucunun istisnası için — raporlar.ts oncekiRaporGorulur). Yetki ÇAĞIRANDA. */
export async function surumluRaporEkipmani(db: Sorgulayici, raporId: string): Promise<string | null> {
  if (!UUID.test(raporId)) return null;
  return (await db.sorgu<{ ekipman: string }>("SELECT ekipman_id::text AS ekipman FROM rapor_surumu WHERE rapor_id = $1 LIMIT 1", [raporId])).rows[0]?.ekipman ?? null;
}

/** "Önceki kontrol" (İ2): plan içi ekipman tablosu, rapor ekranı ve Ekipman ekle — önceki raporun kontrol tarihi + sonucu (no: rapor numarası); önceki
    raporu yoksa ekipman kaydındaki sistem öncesi kontrol (dis_kontrol — bugün yalnız deneme verisinde dolu; no null); ikisi de yoksa null ("İlk
    kontrol") */
export interface OncekiKontrol { tarih: string; sonuc: string | null; no: string | null }
export function oncekiKontrol(r: OncekiRapor | undefined, dis: { disKontrol: string | null; disSonuc: string | null } | null): OncekiKontrol | null {
  if (r?.tarih) return { tarih: r.tarih, sonuc: r.sonuc ? SONUC_AD[r.sonuc] : null, no: r.no };
  return dis?.disKontrol ? { tarih: dis.disKontrol, sonuc: dis.disSonuc, no: null } : null;
}

/* ── TAKİP MUAYENESİ (2026-10-26, göç 0108; maket onaylı) ── */
export interface TakipAdayi {
  /** ana rapor: ekipmanın açık uygunsuzluğu olan son imzalı raporu */
  raporId: string;
  /** ana raporun ham numarası (takip numarası bundan — …-T1) ve görünen numarası (revizyonlu) */
  hamNo: string; no: string;
  /** açık uygunsuzluk sayısı */
  acik: number;
  /** ana raporun henüz imzalanmamış takip raporu (varsa yenisi açılmaz) */
  bekleyen: { id: string; no: string } | null;
}
/** ekipmanların takip adayları (ekipman → ana rapor): açık uygunsuzluğu olan EN SON imzalı sürüm (yeni imzalı sürüm öncekilerin uygunsuzluğunu
    kapattığı için açık olan yalnız son raporda kalır). Yetki ÇAĞIRANDA. */
export async function takipAdaylari(db: Sorgulayici, ekipmanlar: readonly string[]): Promise<Map<string, TakipAdayi>> {
  const l = ekipmanlar.filter((x) => UUID.test(x));
  if (!l.length) return new Map();
  const r = await db.sorgu<{ ekipman: string; rapor: string; ham: string; no: string; acik: number; bid: string | null; bno: string | null }>(
    `SELECT DISTINCT ON (u.ekipman_id) u.ekipman_id::text AS ekipman, s.rapor_id::text AS rapor, a.no AS ham, s.no,
       (SELECT count(*)::int FROM uygunsuzluk v WHERE v.firma_id = u.firma_id AND v.surum_id = u.surum_id AND v.kapanis IS NULL) AS acik,
       t.id::text AS bid, t.no AS bno
     FROM uygunsuzluk u JOIN rapor_surumu s ON s.firma_id = u.firma_id AND s.id = u.surum_id JOIN rapor a ON a.firma_id = s.firma_id AND a.id = s.rapor_id
       LEFT JOIN LATERAL (SELECT x.id, x.no FROM rapor x WHERE x.firma_id = a.firma_id AND x.takip_kaynak = a.id AND x.silindi IS NULL AND x.durum <> 'imzali'
         ORDER BY x.olustu DESC LIMIT 1) t ON true
     WHERE u.ekipman_id = ANY ($1::uuid[]) AND u.kapanis IS NULL
     ORDER BY u.ekipman_id, s.kontrol_tarihi DESC NULLS LAST, s.imzalandi DESC`, [l]);
  return new Map(r.rows.map((x) => [x.ekipman, { raporId: x.rapor, hamNo: x.ham, no: x.no, acik: x.acik, bekleyen: x.bid && x.bno ? { id: x.bid, no: x.bno } : null }]));
}

/** takip raporunun kaynağı: ana raporun son imzalı sürümünün içeriği (cevaplar, ekipman bilgileri) ve o sürümün uygunsuzlukları (ref, metin, ağır;
    açık ya da bu takiple kapanmış). Yetki ÇAĞIRANDA. */
export async function takipKaynagi(db: Sorgulayici, anaRapor: string): Promise<{ no: string; tarih: string | null; cevaplar: unknown; ekipmanBilgi: unknown;
  maddeler: { ref: string; metin: string; agir: boolean }[] } | null> {
  if (!UUID.test(anaRapor)) return null;
  const s = (await db.sorgu<{ id: string; no: string; tarih: string | null; icerik: { cevaplar?: unknown; ekipman_bilgi?: unknown } }>(
    `SELECT id::text, no, kontrol_tarihi::text AS tarih, icerik FROM rapor_surumu WHERE rapor_id = $1 ORDER BY revizyon DESC LIMIT 1`, [anaRapor])).rows[0];
  if (!s) return null;
  const m = (await db.sorgu<{ ref: string; metin: string; agir: boolean }>(
    "SELECT ref, metin, agir FROM uygunsuzluk WHERE surum_id = $1 ORDER BY olustu, ref", [s.id])).rows;
  return { no: s.no, tarih: s.tarih, cevaplar: s.icerik?.cevaplar ?? null, ekipmanBilgi: s.icerik?.ekipman_bilgi ?? null, maddeler: m };
}
