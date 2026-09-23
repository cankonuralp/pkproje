/* ══ KİRACI SÜZGEÇLİ TEK VERİ ERİŞİM KATMANI (anayasa 7 · CLAUDE.md §2) ══════════════════════════════════════
   Uygulama veritabanına YALNIZ buradan erişir. Her iş bir işlem (transaction) içinde koşar ve işlemin başında
   `app.firma_id` o kiracıya ayarlanır; satır düzeyi güvenlik (0001_cekirdek.sql) başka firmanın satırını ne
   gösterir ne yazdırır. Ayar işlem sonunda kendiliğinden düşer (set_config(..., true)), havuzdaki bağlantıya
   önceki kiracı sızmaz. `pg` bu klasör dışında içe aktarılmaz (tests/kiraci-suzgeci.test.ts denetler). */
import pg from "pg";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Sorgulayici {
  sorgu<S extends pg.QueryResultRow = pg.QueryResultRow>(metin: string, degerler?: readonly unknown[]): Promise<pg.QueryResult<S>>;
}

export interface UygulamaBaglantisi {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/** Uygulama rolüyle bağlantı havuzu (süper kullanıcı DEĞİL; RLS'yi aşamaz). */
export function havuzKur(ayar: UygulamaBaglantisi): pg.Pool {
  return new pg.Pool({ ...ayar, max: 10 });
}

/** İşi verilen kiracının içinde, tek işlemde koşar. Hata geri alınır ve YUKARI fırlatılır (yutulmaz). */
export async function kiraciIcinde<T>(havuz: pg.Pool, firmaId: string, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  if (!UUID.test(firmaId)) throw new Error("Geçersiz firma kimliği");
  const baglanti = await havuz.connect();
  try {
    await baglanti.query("BEGIN");
    await baglanti.query("SELECT set_config('app.firma_id', $1, true)", [firmaId]);
    const sonuc = await is({ sorgu: (metin, degerler) => baglanti.query(metin, degerler as unknown[]) });
    await baglanti.query("COMMIT");
    return sonuc;
  } catch (hata) {
    await baglanti.query("ROLLBACK");
    throw hata;
  } finally {
    baglanti.release();
  }
}

/** Alt alan adındaki kısa addan firma kimliği; yoksa null. Kiracı bilinmeden çağrılır (0001: firma_bul). */
export async function firmaKimligi(havuz: pg.Pool, kisaAd: string): Promise<string | null> {
  const sonuc = await havuz.query<{ firma_bul: string | null }>("SELECT firma_bul($1)", [kisaAd]);
  return sonuc.rows[0]?.firma_bul ?? null;
}
