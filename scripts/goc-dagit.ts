/* GÖÇ DAĞITICI — YAYIN KAPISI (FIRMA-VT §5.5, §7.3; FV4, 2026-10-15). Vercel derleme komutu (vercel.json buildCommand):
     node scripts/goc-dagit.ts --zorunlu && node scripts/next.ts build
   Kodun beklediği göç (src/server/db/son-goc.ts) merkezde ve her kendi projeli firmanın veritabanında yoksa çıkış kodu 1 → derleme olmaz, yayın olmaz.
   Kip PROBATA_GOC_DAGIT: boş / "denetle" (salt okunur tanı); "uygula" FV8'de — şimdi açık hata. Ortamda veritabanı ayarı yoksa: "--zorunlu" ya da
   VERCEL varsa 1; ikisi de yoksa (CI, yerel) "atlandı" ve 0. Mantık ve kurallar src/server/db/goc-dagit.ts'te (pg yalnız src/server/db'de); bu dosya
   yalnız çağırır. Çıktı sırsız (sorunlu firmanın kısa adı, beklenen / bulunan göç, hata kodu). */
import { gocDagit } from "../src/server/db/goc-dagit.ts";

const kod = await gocDagit({ ortam: process.env, arguman: process.argv.slice(2), yaz: (s) => console.log(s) });
process.exitCode = kod;
/* açık kalan bir bağlantı (süre dolunca arkada süren iş) derlemeyi bekletmesin: en geç 2 sn sonra çıkılır (unref — bekleyen iş yoksa süreç hemen,
   çıktı boşalarak biter) */
setTimeout(() => process.exit(kod), 2000).unref();
