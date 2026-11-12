/* OLUMSUZ KANIT — tests/cihaz-saati.test.ts neyi koruyor (2026-11-12; pkproje.md §11 K4). Kaynak diskte DEĞİŞTİRİLMEZ: cihaz-saati.ts bellekte
   bozulup geçici klasörden içe aktarılır. O zaman:
   1) çıkış / dönüş farkının karşılaştırması kalkınca bağlantısızken geri alınmış saatle yazılan kontrol "tuttu" sayılır (sapma çıkmaz);
   2) "ileri an yazılmaz" sınırı kalkınca ileri alınmış cihaz saati kayda gelecekteki bir an olarak geçer;
   3) sıra denetimi kalkınca saat geri alınıp kontrol yapıldıktan sonra düzeltilen cihaz yakalanmaz;
   4) (Rapor modu) "bitiş başlangıçtan önce" işareti kalkınca ters gelen saatlerle yazılan kayıt tuttu sayılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/cihaz-saati.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-cihaz-saati-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/cihaz-saati.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, metin.replace(eski, () => yeni));
  return import(pathToFileURL(hedef).href);
}
const DK = 60_000, S = Date.parse("2026-11-12T13:00:00+03:00");
const capa = { sunucu: S - 120 * DK, cihaz: S - 120 * DK };

test("1) fark karşılaştırması kalkınca bağlantısızken geri alınmış saat 'tuttu' sayılır", async () => {
  const m = await bozuk("else if (Math.abs(donus - cikis) > SAAT_PAYI_MS)", "else if (false)");
  assert.equal(m.cihazSaati({ an: S - 70 * DK, capa, gonderim: S - 30 * DK }, S).tutmadi, false, "bozuk: 30 dk oynanmış saat işaretsiz");
});

test("2) 'ileri an yazılmaz' sınırı kalkınca kayda gelecekteki bir an geçer", async () => {
  const m = await bozuk("zaman: Math.min(sunucuSimdi, Math.round(o.an + (donus ?? 0)))", "zaman: Math.round(o.an + (donus ?? 0))");
  assert.equal(m.cihazSaati({ an: S + 60 * DK, capa, gonderim: S }, S).zaman, S + 60 * DK, "bozuk: bir saat sonrası yazılır");
});

test("3) sıra denetimi kalkınca saat geri alınıp sonra düzeltilen cihaz yakalanmaz", async () => {
  const m = await bozuk("else if (o.capa && o.an < o.capa.cihaz - SAAT_PAYI_MS)", "else if (false)");
  assert.equal(m.cihazSaati({ an: S - 180 * DK, capa, gonderim: S }, S).tutmadi, false, "bozuk: çapadan önceki olay işaretsiz");
});

test("4) Rapor modunda 'bitiş başlangıçtan önce' işareti kalkınca ters gelen saatler tuttu sayılır", async () => {
  const m = await bozuk("tutmadi: b.tutmadi || s.tutmadi || once,", "tutmadi: b.tutmadi || s.tutmadi,");
  assert.equal(m.kayitKontrolu({ bas: S - 10 * DK, bit: S - 30 * DK, capa }, S, S).tutmadi, false, "bozuk: bitişi başlangıçtan önce olan kayıt işaretsiz");
});
