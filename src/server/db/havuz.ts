/* MERKEZ VERİTABANI HAVUZU — tek örnek (FIRMA-VT FV3, 2026-10-15: kendi projeli firmanın havuzu ayrı — firma-havuzu.ts). Bağlantı bilgisi
   yalnız ortam değişkenlerinden (PROBATA_VT_*; yerelde scripts/gelistir.ts verir, yayında barındırmanın sır ayarı). Koda parola yazılmaz (CLAUDE.md §8). Geliştirmede sıcak yeniden yükleme havuzu çoğaltmasın diye globalThis'te.
   2026-10-04 (yayın, Supabase): ağ üzerinden ŞİFRESİZ bağlantı kurulmaz — sunucu 127.0.0.1 / localhost değilse PROBATA_VT_SSL=dogrula zorunlu;
   o zaman bağlantı TLS'li ve sunucu sertifikası yalnız Supabase kökü ile doğrulanır (kok-sertifika.ts). Bilinmeyen değer = hata (sessiz düşüş yok). */
import { kapiGecerli, sifresizAgDenetle, tlsAyari } from "./baglanti.ts";
import { havuzKur, type Havuz, type UygulamaBaglantisi } from "./kiraci.ts";

/** ortam değişkenlerinden bağlantı ayarı (saf; tests/yayin.test.ts). FIRMA-VT FV2 (2026-10-15): şifresiz ağ denetimi, kapı ve TLS kökü firma
    veritabanı bağlantısıyla ORTAK (baglanti.ts); davranış aynı — merkezde sunucu izin listesi yok (bugünkü gibi) */
export function ortamdanBaglanti(e: Record<string, string | undefined>): UygulamaBaglantisi {
  if (!e.PROBATA_VT_SUNUCU || !e.PROBATA_VT_AD || !e.PROBATA_VT_KULLANICI || !e.PROBATA_VT_PAROLA) {
    throw new Error("Veritabanı bağlantı ayarı yok (PROBATA_VT_SUNUCU, PROBATA_VT_AD, PROBATA_VT_KULLANICI, PROBATA_VT_PAROLA).");
  }
  const ssl = e.PROBATA_VT_SSL ?? "";
  if (ssl !== "" && ssl !== "dogrula") throw new Error("PROBATA_VT_SSL yalnız 'dogrula' olabilir.");
  sifresizAgDenetle(e.PROBATA_VT_SUNUCU, ssl === "dogrula");
  const kapi = Number(e.PROBATA_VT_KAPI ?? 5432);
  if (!kapiGecerli(kapi)) throw new Error("PROBATA_VT_KAPI geçersiz.");
  const enCok = e.PROBATA_VT_HAVUZ === undefined ? undefined : Number(e.PROBATA_VT_HAVUZ);
  if (enCok !== undefined && (!Number.isInteger(enCok) || enCok < 1 || enCok > 50)) throw new Error("PROBATA_VT_HAVUZ 1–50 arası olmalı.");
  return {
    host: e.PROBATA_VT_SUNUCU, port: kapi, database: e.PROBATA_VT_AD, user: e.PROBATA_VT_KULLANICI, password: e.PROBATA_VT_PAROLA,
    ...tlsAyari(ssl === "dogrula"),
    ...(enCok !== undefined ? { enCok } : {}),
  };
}

const g = globalThis as { __probataHavuz?: Havuz };

/* Vercel (sunucusuz): istek bitince örnek askıya alınabilir; askıdaki örnekte havuzun "boştaki bağlantıyı kapat" sayacı işlemez ve bağlantı
   Supabase havuzlayıcısında asılı kalır. Bağlantı havuza her dönüşünde işlev, boşta bekleme süresi kadar (5 sn + pay) açık tutulur (waitUntil).
   Vercel'in @vercel/functions paketindeki attachDatabasePool ile aynı iş; paket komut çalıştıran yan bağımlılıklar getirdiği için alınmadı
   (2026-10-04 yayın denetimi). İstek bağlamı yoksa (yerel, test) hiçbir şey yapmaz. FIRMA-VT FV3 (2026-10-15): firma başına havuzların da
   "release"ine takılır (src/server/db/firma-havuzu.ts) — sayaç ortak, son bırakılan bağlantıdan sonra 5 sn. */
type IstekBaglami = { get?: () => { waitUntil?: (p: Promise<unknown>) => void } | undefined };
const istekBaglami = () => (globalThis as Record<symbol, IstekBaglami | undefined>)[Symbol.for("@vercel/request-context")]?.get?.();
let bosBekleme: { sayac: ReturnType<typeof setTimeout>; bitir: () => void } | undefined;
export function vercelBosBekle(): void {
  if (!process.env.VERCEL_REGION) return;
  if (bosBekleme) { clearTimeout(bosBekleme.sayac); bosBekleme.bitir(); }
  let bitir = () => {};
  const bekle = new Promise<void>((coz) => { bitir = coz; });
  bosBekleme = { sayac: setTimeout(() => bitir(), 5100), bitir };
  istekBaglami()?.waitUntil?.(bekle);
}

/** FIRMA-VT FV3: düşürülen firma havuzunun kapanışı (end — açık işlemler bitince bağlantılar kapanır) istek yanıtlandıktan sonra da beklenir
    (Vercel waitUntil); istek bağlamı yoksa yalnız beklenir. Kapanış hatası günlüğe (sır taşımaz), yukarı gitmez. */
export function istekSonrasinaBirak(p: Promise<unknown>): void {
  const korunan = p.catch((e: unknown) => { console.error("[veritabanı] havuz kapatılamadı:", e instanceof Error ? e.message : String(e)); });
  istekBaglami()?.waitUntil?.(korunan);
}

/** MERKEZ HAVUZU (FIRMA-VT §3: merkez = ortak proje) — ortak firmaların verisi, firma kayıtları (firma_coz), yönetim, hata kaydı, duyuru, gece işinin
    firma listesi, sağlık burada. Kiracının işi KİRACININ havuzundan (src/server/db/firma-havuzu.ts kiraciHavuzu); bu dosyayı içe aktaranlar izin
    listesinde (tests/havuz-kapsami.test.ts). 2026-10-15 (FV3): adı havuz() idi. */
export function merkezHavuzu(): Havuz {
  if (!g.__probataHavuz) {
    g.__probataHavuz = havuzKur(ortamdanBaglanti(process.env));
    g.__probataHavuz.on("release", vercelBosBekle);
  }
  return g.__probataHavuz;
}
