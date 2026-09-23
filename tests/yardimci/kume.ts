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

export async function testKumesi(): Promise<GomuluKume> {
  const klasor = join(mkdtempSync(join(tmpdir(), "probata-test-")), "pg");
  return gomuluBaslat({ klasor, port: await bosKapi(), kalici: false });
}
