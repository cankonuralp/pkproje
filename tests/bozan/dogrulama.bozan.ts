/* OLUMSUZ KANIT — tests/dogrulama.test.ts neyi koruyor (sunum 595 K8). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici
   klasörden içe aktarılır.
   1. Kod firmaya bağlı olmasaydı A firmasının karekodu B firmasının adresinde de açılırdı (başka firmanın rapor kimliğini sorgulatma).
   2. İmza karşılaştırılmasaydı rapor kimliğini bilen herkes uydurma kodla raporun durumunu okurdu (numaralandırma).
   3. Alt şerit adresi kaçırmasaydı adrese gömülen HTML PDF'in alt bilgisine ham girerdi.
   4. (2026-10-17) PDF jetonunun süresi denetlenmeseydi doğrulama sayfasındaki rapor bağlantısı kalıcı herkese açık dosya bağlantısı olurdu. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { ornekBelge } from "../../src/belge/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "dogrulama-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
type D = typeof import("../../src/server/dogrulama.ts");
const K = randomBytes(32);

test("1: kod firmaya bağlı olmayınca başka firmanın adresinde açılır", async () => {
  const m = await bozuk<D>("src/server/dogrulama.ts", "update(`probata-dogrulama:${firmaId}:${raporId}:${revizyon}`)", "update(`probata-dogrulama:${raporId}:${revizyon}`)");
  const kod = m.dogrulamaKodu(randomUUID(), randomUUID(), 0, K);
  assert.ok(m.dogrulamaCoz(kod, randomUUID(), K), "bozuk: başka firmada açılmadı");
});

test("2: imza karşılaştırılmayınca uydurma kod geçer", async () => {
  const m = await bozuk<D>("src/server/dogrulama.ts", "return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen) ? { raporId: p[0], revizyon } : null;",
    "return { raporId: p[0], revizyon };");
  assert.ok(m.dogrulamaCoz(`${randomUUID()}.0.${"A".repeat(22)}`, randomUUID(), K), "bozuk: uydurma kod reddedildi");
});

test("3: alt şerit adresi kaçırmayınca gömülen HTML ham girer", async () => {
  const m = await bozuk<typeof import("../../src/belge/pdf.ts")>("src/belge/pdf.ts",
    "<a href=\"${kac(v.dogrulama)}\" style=\"color:#000;text-decoration:none\">${kac(v.dogrulama)}</a>", "<a>${v.dogrulama}</a>");
  const h = m.raporAltBilgisi({ ...ornekBelge("ZPKR02"), kesin: true, dogrulama: "https://deneme.example/<img src=x>" });
  assert.ok(h.includes("<img src=x>"), "bozuk: kaçırıldı");
});

/* 2026-10-17 (doğrulama sayfasında imzalı rapor): PDF jetonunun süresi denetlenmeseydi eski bağlantı kalıcı herkese açık dosya bağlantısı olurdu */
test("4: PDF jetonunun süresi denetlenmeyince süresi geçmiş bağlantı açılır", async () => {
  const m = await bozuk<D>("src/server/dogrulama.ts", "  if (bitis < dk || bitis > dk + PDF_JETON_DK) return false;\n", "");
  const kod = m.dogrulamaKodu(randomUUID(), randomUUID(), 0, K), F = randomUUID(), simdi = Date.UTC(2026, 9, 17, 12, 0);
  assert.equal(m.pdfJetonuGecerli(m.pdfJetonu(F, kod, simdi, K), F, kod, simdi + 24 * 60 * 60_000, K), true, "bozuk: süresi geçmiş jeton reddedildi");
});
