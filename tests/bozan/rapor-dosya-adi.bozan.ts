/* OLUMSUZ KANIT — tests/rapor-dosya-adi.test.ts neyi koruyor (2026-10-17). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici
   klasörden içe aktarılır.
   1. Yasak karakterler temizlenmeseydi tür adındaki "/" ZIP'te ve indirmede klasör yolu olur, ":" Windows'ta dosyayı kaydettirmezdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/sema.ts";
const klasor = mkdtempSync(join(tmpdir(), "rapor-dosya-adi-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

test("yasak karakter temizliği kalkınca tür adındaki '/' ve ':' dosya adına girer", async () => {
  const k = resolve(KAYNAK), metin = readFileSync(k, "utf8");
  const eski = '(s ?? "").replace(YASAK_KARAKTER, " ")';
  assert.ok(metin.includes(eski), "bozulacak satır kaynakta yok");
  const hedef = join(klasor, "sema.ts");
  writeFileSync(hedef, metin.replace(eski, '(s ?? "")').replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  const m = (await import(pathToFileURL(hedef).href)) as typeof import("../../src/modules/raporlar/sema.ts");
  assert.equal(m.raporDosyaAdi("DM-1026-003-cf59e", "HT-1", "Tank/Kap: basınçlı"), "DM-1026-003-cf59e-HT-1-Tank/Kap: basınçlı.pdf", "bozuk: yasak karakter kaldı");
});
