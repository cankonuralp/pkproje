/* npm run dev — yerel geliştirme: gömülü PostgreSQL (data/pg, kalıcı) açılır, göçler uygulanır, sonra Next.js.
   Kurulum yok (CLAUDE.md §2). Kapatınca (Ctrl+C) veritabanı da durur. Bağlantı bilgisi yalnız alt sürece ortam
   değişkeniyle geçer; diske ya da ekrana veritabanı parolası yazılmaz. Firma denemesi: http://<firma>.localhost:3000
   K1 (2026-10-04): ilk açılışta UYDURMA bir deneme firması ("deneme") ve firma yöneticisi hesabı kurulur; parolası RASGELE üretilir ve yalnız
   data/gelistirme-hesap.txt'ye yazılır (data/ git dışı). Yalnız yerel geliştirme içindir; yayında böyle bir hesap yoktur. */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gomuluBaslat } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { nextCalistir } from "./next.ts";

const PG_KAPISI = 54320;

const kume = await gomuluBaslat({ klasor: join(process.cwd(), "data", "pg"), port: PG_KAPISI, kalici: true });
console.log(`Gömülü PostgreSQL açık (127.0.0.1:${PG_KAPISI}, veritabanı ${kume.uygulama.database}); göçler uygulandı.`);

/* deneme firması + yönetici hesabı (yalnız ilk açılışta) */
const HESAP_DOSYASI = join(process.cwd(), "data", "gelistirme-hesap.txt");
{
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  const var_ = await sahip.query<{ id: string }>("SELECT id FROM firma WHERE kisa_ad = 'deneme'");
  let firmaId = var_.rows[0]?.id;
  if (!firmaId) firmaId = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme', 'Deneme Muayene', 'DM') RETURNING id")).rows[0].id;
  await sahip.end();
  if (!existsSync(HESAP_DOSYASI)) {
    const parola = randomBytes(9).toString("base64url") + "7";
    const ozet = await parolaOzeti(parola);
    const havuz = havuzKur(kume.uygulama);
    try {
      await kiraciIcinde(havuz, firmaId, (db) => db.sorgu(
        `INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum) VALUES ('yonetici@deneme.example', 'Deneme Yönetici', $1, '{firma_yoneticisi}', 'etkin')
         ON CONFLICT (firma_id, eposta) DO UPDATE SET parola_ozeti = EXCLUDED.parola_ozeti, durum = 'etkin'`, [ozet]));
    } finally { await havuz.end(); }
    writeFileSync(HESAP_DOSYASI, `Yerel deneme girişi (yalnız bu bilgisayar; data/ git dışı)\nAdres: http://deneme.localhost:3000\nE-posta: yonetici@deneme.example\nParola: ${parola}\n`, { mode: 0o600 });
  }
  console.log(`Deneme girişi: http://deneme.localhost:3000 — e-posta ve parola ${HESAP_DOSYASI} dosyasında.`);
}

/* sır ana anahtarı (firma sırlarını şifreler — src/server/ayar/sir.ts): yerelde data/ altında, ilk açılışta rasgele; yayında ortam değişkeni */
const SIR_DOSYASI = join(process.cwd(), "data", "sir-anahtari");
if (!existsSync(SIR_DOSYASI)) writeFileSync(SIR_DOSYASI, randomBytes(32).toString("base64"), { mode: 0o600 });
const sirAnahtari = readFileSync(SIR_DOSYASI, "utf8").trim();

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
  PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password, PROBATA_SIR_ANAHTARI: sirAnahtari,
}, ["--hostname", "127.0.0.1"]);
await kapat(kod);
