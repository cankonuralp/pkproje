/* ══ KİRACI SÜZGEÇLİ TEK VERİ ERİŞİM KATMANI (anayasa 7 · CLAUDE.md §2) ══════════════════════════════════════
   Uygulama veritabanına YALNIZ buradan erişir. Her iş bir işlem (transaction) içinde koşar ve işlemin başında
   `app.firma_id` o kiracıya ayarlanır; satır düzeyi güvenlik (0001_cekirdek.sql) başka firmanın satırını ne
   gösterir ne yazdırır. Ayar işlem sonunda kendiliğinden düşer (set_config(..., true)), havuzdaki bağlantıya
   önceki kiracı sızmaz. `pg` bu klasör dışında içe aktarılmaz (tests/kiraci-suzgeci.test.ts denetler). */
import pg from "pg";

/* takvim tarihi (DATE) metin olarak gelir ("YYYY-MM-DD"): sunucunun saat dilimi günü kaydırmasın, yazıcının "değişti mi" karşılaştırması
   formdan gelen değerle aynı biçimde yapılsın (2026-10-04, personel işe başlama tarihi) */
pg.types.setTypeParser(1082, (v: string) => v);

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
  /** şifreli bağlantı: sunucu sertifikası yalnız bu kökle doğrulanır (yayın, src/server/db/havuz.ts); yoksa yerel (127.0.0.1) */
  kokSertifika?: string;
  /** havuzdaki en çok bağlantı (yayında barındırma örneği başına az tutulur; Supabase havuzlayıcısı paylaşılır) */
  enCok?: number;
}

/** havuz türü dışarıya bu adla açılır: modüller `pg`'yi içe aktarmaz (tests/kiraci-suzgeci.test.ts) */
export type Havuz = pg.Pool;

/** Uygulama rolüyle bağlantı havuzu (süper kullanıcı DEĞİL; RLS'yi aşamaz). Kök sertifika verilmişse bağlantı TLS'li ve sunucu doğrulanır
    (rejectUnauthorized: true — sertifikası tutmayan sunucuya parola gönderilmez).
    2026-10-04 (yayın denetimi): boştaki bağlantı sunucu tarafında koparsa (veritabanı / havuzlayıcı yeniden başladı) havuz 'error' yayar;
    dinleyici yoksa bu yakalanmamış istisna olur ve süreci düşürebilir → günlüğe yazılır, havuz kendini toparlar. Bağlanma 5 sn'de, boştaki
    bağlantı 5 sn'de bırakılır (sunucusuz ortamda askıdaki örnek bağlantı tutmasın). */
export function havuzKur(ayar: UygulamaBaglantisi): pg.Pool {
  const { kokSertifika, enCok, ...baglanti } = ayar;
  const havuz = new pg.Pool({
    ...baglanti, max: enCok ?? 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 5000,
    ssl: kokSertifika ? { ca: kokSertifika, rejectUnauthorized: true } : false,
  });
  havuz.on("error", (e) => { console.error("[veritabanı] boştaki bağlantı koptu:", e.message); });
  return havuz;
}

/** müşteri paneli işlemi (0030): işlemin müşterisi ve tesis kapsamı (null = bütün tesisler) */
export interface MusteriBaglami { id: string; tesisler: readonly string[] | null }

/** İşi verilen kiracının içinde, tek işlemde koşar. Hata geri alınır ve YUKARI fırlatılır (yutulmaz).
    `hesapId` verilirse işlemin bağlamına yazılır (`app.hesap_id`): denetim izinin "kim"i buradan damgalanır (0003), koddan değil.
    `musteri` verilirse (müşteri paneli, 0030) işlemin müşterisi ve tesis kapsamı yazılır ve işlem MÜŞTERİ ROLÜNE geçer (SET LOCAL ROLE
    probata_musteri): yalnız panelin okuduğu tablolar, yalnız okuma, kendi müşterisi / tesis kapsamı / müşteriye açık — kısıtlayıcı politikalar
    veritabanında. Rol işlem bitince düşer (havuzdaki bağlantıya sızmaz). */
export async function kiraciIcinde<T>(havuz: pg.Pool, firmaId: string, is: (db: Sorgulayici) => Promise<T>, secenek: { hesapId?: string; musteri?: MusteriBaglami } = {}): Promise<T> {
  if (!UUID.test(firmaId)) throw new Error("Geçersiz firma kimliği");
  if (secenek.hesapId !== undefined && !UUID.test(secenek.hesapId)) throw new Error("Geçersiz hesap kimliği");
  const m = secenek.musteri;
  if (m && (!UUID.test(m.id) || (m.tesisler !== null && (!m.tesisler.length || !m.tesisler.every((t) => UUID.test(t)))))) throw new Error("Geçersiz müşteri bağlamı");
  const baglanti = await havuz.connect();
  /* ödünçteyken bağlantı koparsa istemci 'error' yayar (havuz o sırada dinlemez) → yakalanmamış istisna olmasın; hata sorgudan zaten döner */
  let kopuk: Error | undefined;
  const dinle = (e: Error) => { kopuk = e; };
  baglanti.on("error", dinle);
  try {
    await baglanti.query("BEGIN");
    await baglanti.query("SELECT set_config('app.firma_id', $1, true), set_config('app.hesap_id', $2, true)", [firmaId, secenek.hesapId ?? ""]);
    if (m) {
      await baglanti.query("SELECT set_config('app.musteri_id', $1, true), set_config('app.musteri_tesisler', $2, true)", [m.id, m.tesisler ? m.tesisler.join(",") : ""]);
      await baglanti.query("SET LOCAL ROLE probata_musteri");
    }
    const sonuc = await is({ sorgu: (metin, degerler) => baglanti.query(metin, degerler as unknown[]) });
    await baglanti.query("COMMIT");
    return sonuc;
  } catch (hata) {
    /* geri alma da düşerse (bağlantı kopmuş) ASIL hata yukarı gider; bozuk bağlantı havuza geri konmaz */
    try { await baglanti.query("ROLLBACK"); } catch (e) { kopuk ??= e as Error; }
    throw hata;
  } finally {
    baglanti.off("error", dinle);
    baglanti.release(kopuk);
  }
}

/** Alt alan adındaki kısa addan firma kimliği; yoksa null. Kiracı bilinmeden çağrılır (0001: firma_bul). */
export async function firmaKimligi(havuz: pg.Pool, kisaAd: string): Promise<string | null> {
  const sonuc = await havuz.query<{ firma_bul: string | null }>("SELECT firma_bul($1)", [kisaAd]);
  return sonuc.rows[0]?.firma_bul ?? null;
}
