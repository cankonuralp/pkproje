/* npm run dev — yerel geliştirme: gömülü PostgreSQL (data/pg, kalıcı) açılır, göçler uygulanır, sonra Next.js.
   Kurulum yok (CLAUDE.md §2). Kapatınca (Ctrl+C) veritabanı da durur. Bağlantı bilgisi yalnız alt sürece ortam
   değişkeniyle geçer; diske ya da ekrana parola yazılmaz. Firma denemesi: http://<firma>.localhost:3000 */
import { join } from "node:path";
import { gomuluBaslat } from "../src/server/db/gomulu.ts";
import { nextCalistir } from "./next.ts";

const PG_KAPISI = 54320;

const kume = await gomuluBaslat({ klasor: join(process.cwd(), "data", "pg"), port: PG_KAPISI, kalici: true });
console.log(`Gömülü PostgreSQL açık (127.0.0.1:${PG_KAPISI}, veritabanı ${kume.uygulama.database}); göçler uygulandı.`);

let kapaniyor = false;
const kapat = async (kod: number) => {
  if (kapaniyor) return;
  kapaniyor = true;
  await kume.durdur();
  process.exit(kod);
};
process.on("SIGINT", () => { void kapat(0); });
process.on("SIGTERM", () => { void kapat(0); });

const u = kume.uygulama;
// yalnız bu makine (next dev varsayılanı yerel ağa da açar); <firma>.localhost tarayıcıda 127.0.0.1'e çözülür
const kod = await nextCalistir("dev", {
  PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database,
  PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
}, ["--hostname", "127.0.0.1"]);
await kapat(kod);
