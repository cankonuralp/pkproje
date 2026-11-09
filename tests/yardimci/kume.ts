/* Testler için geçici gömülü PostgreSQL kümesi: işletim sisteminin geçici klasöründe, boş bir kapıda açılır,
   durdurulunca silinir (kalici: false). Her test dosyası kendi kümesini açar; birbirine dokunmaz. */
import { mkdtempSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gomuluBaslat, type GomuluKume } from "../../src/server/db/gomulu.ts";

export function bosKapi(): Promise<number> {
  return new Promise((coz, reddet) => {
    const s = createServer();
    s.once("error", reddet);
    s.listen(0, "127.0.0.1", () => {
      const adres = s.address();
      const kapi = typeof adres === "object" && adres ? adres.port : 0;
      s.close(() => coz(kapi));
    });
  });
}

/* 2026-11-09: boş kapı bulunup kapatıldıktan sonra PostgreSQL açılana kadar aynı anda koşan başka test dosyası kapıyı alabilir (CI'da kurulum ara ara düşüyordu, hata metni boş). Kurulum yeni kapı ve
   yeni klasörle en çok 3 kez denenir; düşen deneme nedeniyle günlüğe yazılır. Yalnız kurulum — testin kendisi yeniden koşmaz. */
export async function testKumesi(): Promise<GomuluKume> {
  let son: unknown;
  for (let deneme = 1; deneme <= 3; deneme++) {
    const klasor = join(mkdtempSync(join(tmpdir(), "probata-test-")), "pg");
    try {
      return await gomuluBaslat({ klasor, port: await bosKapi(), kalici: false });
    } catch (h) {
      son = h;
      console.error(`[test kümesi] ${deneme}. deneme düştü: ${h instanceof Error ? h.message : String(h)}`);
    }
  }
  throw son instanceof Error ? son : new Error(`Test kümesi açılamadı: ${String(son)}`);
}
