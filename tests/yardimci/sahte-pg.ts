/* SAHTE POSTGRESQL SUNUCULARI (FIRMA-VT FV3, 2026-10-15) — veritabanısız (saf) havuz testleri için: tests/firma-havuzu.test.ts,
   tests/bozan/firma-havuzu.bozan.ts. Gerçek sunucunun yerine yalnız bağlantı aşamasını taklit eder:
   · "asili": bağlantıyı kabul eder, hiç cevap vermez — istemci bağlanırken kalır (havuz MEŞGUL; tek bağlantılı havuzda sonraki istek SIRADA bekler);
   · "parola": açılış iletisine 28P01 (parola doğrulanamadı) hata iletisiyle cevap verip bağlantıyı kapatır — kaç kez parola denendiği sayılır.
   Gelen bağlantılar sayılır; kopar açık bağlantıların hepsini koparır, kapat dinlemeyi de bırakır.
   Bağlantıyı REDDEDEN kapı: KAPALI_KAPI (1) — hiçbir testin dinlemediği ayrıcalıklı kapı. Önceki yol (boş kapı açıp hemen kapatmak) yarışlıydı:
   aynı anda koşan başka bir test dosyası o kapıda PostgreSQL açabilir, ECONNREFUSED yerine 28P01 / 3D000 gelirdi (FV3 incelemesi). Bütün veri uydurma. */
import { createServer, type AddressInfo, type Socket } from "node:net";

export const KAPALI_KAPI = 1;

export interface SahteSunucu {
  kapi: number;
  /** kabul edilen bağlantı sayısı */
  readonly baglanti: number;
  /** açık bağlantıları koparır (bağlanmakta olan istemciler hata alır) */
  kopar(): void;
  kapat(): Promise<void>;
}

/** PostgreSQL ErrorResponse iletisi (FATAL, verilen SQLSTATE) */
function hataIletisi(kod: string, ileti: string): Buffer {
  const alan = (tur: string, deger: string) => Buffer.concat([Buffer.from(tur, "latin1"), Buffer.from(deger, "utf8"), Buffer.from([0])]);
  const govde = Buffer.concat([alan("S", "FATAL"), alan("V", "FATAL"), alan("C", kod), alan("M", ileti), Buffer.from([0])]);
  const bas = Buffer.alloc(5);
  bas.write("E", 0, "latin1");
  bas.writeInt32BE(govde.length + 4, 1);
  return Buffer.concat([bas, govde]);
}

export async function sahteSunucu(tur: "asili" | "parola"): Promise<SahteSunucu> {
  const soketler = new Set<Socket>();
  let baglanti = 0;
  const s = createServer((k) => {
    baglanti++;
    soketler.add(k);
    k.on("close", () => soketler.delete(k));
    k.on("error", () => {});
    if (tur === "parola") k.once("data", () => { k.end(hataIletisi("28P01", "password authentication failed for user \"probata_uygulama\"")); });
  });
  await new Promise<void>((coz, red) => { s.once("error", red); s.listen(0, "127.0.0.1", () => coz()); });
  return {
    kapi: (s.address() as AddressInfo).port,
    get baglanti() { return baglanti; },
    kopar() { for (const k of soketler) k.destroy(); },
    async kapat() {
      for (const k of soketler) k.destroy();
      await new Promise<void>((coz) => s.close(() => coz()));
    },
  };
}

/** koşul doğru olana dek bekler; `sure` ms'de olmazsa HATA (test asılı kalmasın) */
export async function bekle(kosul: () => boolean, ne: string, sure = 3_000): Promise<void> {
  const son = Date.now() + sure;
  while (!kosul()) {
    if (Date.now() > son) throw new Error(`${ne}: ${sure} ms içinde olmadı`);
    await new Promise((c) => setTimeout(c, 10));
  }
}

/** sözün sonucu metin olarak (yakalanmamış ret kalmasın): "geçti" ya da hatanın kodu / iletisi */
export const sonucu = (p: Promise<unknown>): Promise<string> =>
  p.then(() => "geçti", (e: { code?: unknown; message?: unknown }) => (typeof e?.code === "string" ? e.code : String(e?.message ?? e)));
