/* OLUMSUZ KANIT — tests/alan-okuma.test.ts (385 → 484) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): değer denetimi (src/format/deger.ts)
   bellekte bozulup geçici klasörden içe aktarılır. İmal yılı denetimi kalkınca yapay zekânın yanlış okuduğu ya da uydurduğu yıl ("2099", "19x1") ve
   Excel'deki bozuk yıl öneriye / alana girer — denetçi "Önerileri uygula" deyince geçersiz yıl rapora yazılır, Kaydet'te reddedilir ya da (sınırda)
   yanlış kalır. 484: tarih denetimi kalkınca takvimde olmayan gün (31.02) tarih alanına yazılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = readFileSync(resolve("src/format/deger.ts"), "utf8");
const gecici = mkdtempSync(join(tmpdir(), "alan-okuma-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const BUGUN = new Date("2026-10-08T09:00:00Z");

async function bozuk(ad: string, eski: string, yeni: string): Promise<typeof import("../../src/format/deger.ts")> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `${ad}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

test("yıl denetimi kalkınca gelecek ve bozuk yıl öneriye girer (kilidin koruduğu açık)", async () => {
  const m = await bozuk("yil", "      return /^(19|20)\\d{2}$/.test(d) && Number(d) <= bugun.getUTCFullYear() ? d : null;", "      return d;");
  assert.equal(m.alanDegeri({ tur: "yil" }, "2099", BUGUN), "2099", "bozuk: gelecek yıl kabul");
  assert.equal(m.alanDegeri({ tur: "yil" }, "19x1", BUGUN), "19x1", "bozuk: bozuk yıl kabul");
});

test("tarih denetimi kalkınca takvimde olmayan gün yazılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("tarih", "      return t.getUTCFullYear() === Number(y) && t.getUTCMonth() === Number(ay) - 1 && t.getUTCDate() === Number(g) ? `${y}-${ay}-${g}` : null;",
    "      return `${y}-${ay}-${g}`;");
  assert.equal(m.alanDegeri({ tur: "tarih" }, "31.02.2026", BUGUN), "2026-02-31", "bozuk: 31 Şubat kabul");
});

/* 542 (reisim 2026-10-14: "ingilizce olduğu için mi bilinmez okuyamıyor attığım etiketleri ai"): talimattaki yabancı dil karşılıkları kalkınca
   kilit (tests/alan-okuma.test.ts) yakalar — İngilizce etiketteki "Serial No." / "Manufacturer" Türkçe alan adıyla eşleşmez */
test("yabancı dil karşılıkları kalkınca talimat İngilizce etiketi tanımaz (kilidin koruduğu açık)", async () => {
  const kok = resolve("src/server/yz");
  const k = readFileSync(join(kok, "alanlar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
  const eski = `  "Etiket çoğu zaman Türkçe DEĞİLDİR`;
  assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
  const bas = k.indexOf(eski), son = k.indexOf(`].join(" ");`, bas);
  const yol = join(gecici, "alanlar.ts");
  writeFileSync(yol, k.slice(0, bas) + k.slice(son));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/yz/alanlar.ts");
  const g = m.alanIstegi({ model: "haiku", baslik: "Ekipman bilgileri", alanlar: [{ id: "seri", ad: "Seri no", tur: "metin", uzun: 30 }], resim: new Uint8Array([1]), tur: "png" });
  const sistem = String((g.govde as { system: unknown }).system);
  assert.ok(!sistem.includes("Serial No.") && !sistem.includes("Manufacturer"), "bozuk: karşılıklar yok");
});
