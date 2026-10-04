/* UYGULAMANIN VERİTABANI HAVUZU — tek örnek. Bağlantı bilgisi yalnız ortam değişkenlerinden (PROBATA_VT_*; yerelde scripts/gelistir.ts verir,
   yayında barındırmanın sır ayarı). Koda parola yazılmaz (CLAUDE.md §8). Geliştirmede sıcak yeniden yükleme havuzu çoğaltmasın diye globalThis'te. */
import { havuzKur, type Havuz } from "./kiraci.ts";

const g = globalThis as { __probataHavuz?: Havuz };

export function havuz(): Havuz {
  if (g.__probataHavuz) return g.__probataHavuz;
  const e = process.env;
  if (!e.PROBATA_VT_SUNUCU || !e.PROBATA_VT_AD || !e.PROBATA_VT_KULLANICI || !e.PROBATA_VT_PAROLA) {
    throw new Error("Veritabanı bağlantı ayarı yok (PROBATA_VT_SUNUCU, PROBATA_VT_AD, PROBATA_VT_KULLANICI, PROBATA_VT_PAROLA).");
  }
  g.__probataHavuz = havuzKur({
    host: e.PROBATA_VT_SUNUCU, port: Number(e.PROBATA_VT_KAPI ?? 5432), database: e.PROBATA_VT_AD,
    user: e.PROBATA_VT_KULLANICI, password: e.PROBATA_VT_PAROLA,
  });
  return g.__probataHavuz;
}
