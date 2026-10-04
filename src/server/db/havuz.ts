/* UYGULAMANIN VERİTABANI HAVUZU — tek örnek. Bağlantı bilgisi yalnız ortam değişkenlerinden (PROBATA_VT_*; yerelde scripts/gelistir.ts verir,
   yayında barındırmanın sır ayarı). Koda parola yazılmaz (CLAUDE.md §8). Geliştirmede sıcak yeniden yükleme havuzu çoğaltmasın diye globalThis'te.
   2026-10-04 (yayın, Supabase): ağ üzerinden ŞİFRESİZ bağlantı kurulmaz — sunucu 127.0.0.1 / localhost değilse PROBATA_VT_SSL=dogrula zorunlu;
   o zaman bağlantı TLS'li ve sunucu sertifikası yalnız Supabase kökü ile doğrulanır (kok-sertifika.ts). Bilinmeyen değer = hata (sessiz düşüş yok). */
import { havuzKur, type Havuz, type UygulamaBaglantisi } from "./kiraci.ts";
import { SUPABASE_KOK_2021 } from "./kok-sertifika.ts";

const YEREL = new Set(["127.0.0.1", "localhost", "::1"]);

/** ortam değişkenlerinden bağlantı ayarı (saf; tests/yayin.test.ts) */
export function ortamdanBaglanti(e: Record<string, string | undefined>): UygulamaBaglantisi {
  if (!e.PROBATA_VT_SUNUCU || !e.PROBATA_VT_AD || !e.PROBATA_VT_KULLANICI || !e.PROBATA_VT_PAROLA) {
    throw new Error("Veritabanı bağlantı ayarı yok (PROBATA_VT_SUNUCU, PROBATA_VT_AD, PROBATA_VT_KULLANICI, PROBATA_VT_PAROLA).");
  }
  const ssl = e.PROBATA_VT_SSL ?? "";
  if (ssl !== "" && ssl !== "dogrula") throw new Error("PROBATA_VT_SSL yalnız 'dogrula' olabilir.");
  if (ssl === "" && !YEREL.has(e.PROBATA_VT_SUNUCU)) {
    throw new Error("Veritabanına ağ üzerinden şifresiz bağlanılmaz: PROBATA_VT_SSL=dogrula verin.");
  }
  const kapi = Number(e.PROBATA_VT_KAPI ?? 5432);
  if (!Number.isInteger(kapi) || kapi < 1 || kapi > 65535) throw new Error("PROBATA_VT_KAPI geçersiz.");
  const enCok = e.PROBATA_VT_HAVUZ === undefined ? undefined : Number(e.PROBATA_VT_HAVUZ);
  if (enCok !== undefined && (!Number.isInteger(enCok) || enCok < 1 || enCok > 50)) throw new Error("PROBATA_VT_HAVUZ 1–50 arası olmalı.");
  return {
    host: e.PROBATA_VT_SUNUCU, port: kapi, database: e.PROBATA_VT_AD, user: e.PROBATA_VT_KULLANICI, password: e.PROBATA_VT_PAROLA,
    ...(ssl === "dogrula" ? { kokSertifika: SUPABASE_KOK_2021 } : {}),
    ...(enCok !== undefined ? { enCok } : {}),
  };
}

const g = globalThis as { __probataHavuz?: Havuz };

/* Vercel (sunucusuz): istek bitince örnek askıya alınabilir; askıdaki örnekte havuzun "boştaki bağlantıyı kapat" sayacı işlemez ve bağlantı
   Supabase havuzlayıcısında asılı kalır. Bağlantı havuza her dönüşünde işlev, boşta bekleme süresi kadar (5 sn + pay) açık tutulur (waitUntil).
   Vercel'in @vercel/functions paketindeki attachDatabasePool ile aynı iş; paket komut çalıştıran yan bağımlılıklar getirdiği için alınmadı
   (2026-10-04 yayın denetimi). İstek bağlamı yoksa (yerel, test) hiçbir şey yapmaz. */
type IstekBaglami = { get?: () => { waitUntil?: (p: Promise<unknown>) => void } | undefined };
let bosBekleme: { sayac: ReturnType<typeof setTimeout>; bitir: () => void } | undefined;
function vercelBosBekle(): void {
  if (!process.env.VERCEL_REGION) return;
  if (bosBekleme) { clearTimeout(bosBekleme.sayac); bosBekleme.bitir(); }
  let bitir = () => {};
  const bekle = new Promise<void>((coz) => { bitir = coz; });
  bosBekleme = { sayac: setTimeout(() => bitir(), 5100), bitir };
  (globalThis as Record<symbol, IstekBaglami | undefined>)[Symbol.for("@vercel/request-context")]?.get?.()?.waitUntil?.(bekle);
}

export function havuz(): Havuz {
  if (!g.__probataHavuz) {
    g.__probataHavuz = havuzKur(ortamdanBaglanti(process.env));
    g.__probataHavuz.on("release", vercelBosBekle);
  }
  return g.__probataHavuz;
}
