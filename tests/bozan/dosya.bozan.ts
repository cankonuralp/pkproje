/* OLUMSUZ KANIT — tests/dosya.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tur.ts / anahtar.ts / depo.ts / dosya.ts bellekte
   bozulup geçici klasörden içe aktarılır. Her bozma, kilidin kapattığı açığı geri açar. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "dosya-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const mutlak = (dosya: string) => pathToFileURL(resolve("src/server", dosya)).href;
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  let k = readFileSync(resolve("src/server", dosya), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  k = k.replace(eski, yeni).replace(/from "\.\/([\w.]+)"/g, (_, a) => `from "${mutlak(`dosya/${a}`)}"`).replace(/from "\.\.\/([\w./]+)"/g, (_, a) => `from "${mutlak(a)}"`);
  const yol = join(klasor, `${sira++}-${dosya.split("/").pop()}`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}
const b = (s: string) => new Uint8Array(Buffer.from(s, "latin1"));

test("CSV işaretleme denetimi kalkınca .csv diye SVG yüklenir", async () => {
  const m = await bozuk<typeof import("../../src/server/dosya/tur.ts")>("dosya/tur.ts", "return !/<\\s*(svg|html|script|body|iframe|!doctype|\\?xml)/i.test(yazi);", "return true;");
  assert.equal(m.turBul(b('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), ["csv"]), "csv");
});

test("EXIF ayıklama kalkınca konum bilgisi depoya gider", async () => {
  const m = await bozuk<typeof import("../../src/server/dosya/tur.ts")>("dosya/tur.ts", "const at = isaret === 0xe1 || isaret === 0xed || isaret === 0xfe;", "const at = false;");
  const seg = (i: number, g: string) => [0xff, i, (g.length + 2) >> 8, (g.length + 2) & 0xff, ...Buffer.from(g, "latin1")];
  const jpeg = new Uint8Array([0xff, 0xd8, ...seg(0xe1, "Exif\0\0GPS"), 0xff, 0xda, 0, 2, 0xff, 0xd9]);
  assert.ok(Buffer.from(m.jpegTemizle(jpeg)).toString("latin1").includes("GPS"));
});

test("anahtar denetimi kalkınca modül adıyla yol aşılır", async () => {
  const m = await bozuk<typeof import("../../src/server/dosya/anahtar.ts")>("dosya/anahtar.ts", 'if (!MODUL.test(p.modul)) throw new Error("Geçersiz modül adı");', "");
  const u = "00000000-0000-4000-8000-000000000000";
  assert.match(m.dosyaAnahtari({ firmaId: u, modul: "../../baska", kayitId: u, dosyaId: u }), /\.\./);
});

test("depo yol denetimi kalkınca depo dışındaki dosya okunur", async () => {
  /* iki kat (biçim denetimi + kök dışına çıkma denetimi) birlikte kalkınca açık geri gelir */
  const m2 = await bozuk<typeof import("../../src/server/dosya/depo.ts")>("dosya/depo.ts", `if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    const y = resolve(join(tam, anahtar));
    if (!y.startsWith(tam + sep)) throw new Error("Geçersiz depo anahtarı");`, "const y = resolve(join(tam, anahtar));");
  const kok2 = mkdtempSync(join(tmpdir(), "depo-bozan-"));
  writeFileSync(join(kok2, "disari.txt"), "gizli");
  const sizan = await m2.klasorDepo(join(kok2, "ic")).oku("../disari.txt");
  rmSync(kok2, { recursive: true, force: true });
  assert.equal(Buffer.from(sizan).toString(), "gizli", "bozuk: depo dışı dosya okundu");
});

test("erişim denetimi varsayılanı açık olunca denetimi tanımsız modülün dosyası herkese açılır", async () => {
  const m = await bozuk<typeof import("../../src/server/dosya/dosya.ts")>("dosya/dosya.ts", "if (!denetim || !(await denetim(db, kisi, d.kayit_id))) return null;", "if (denetim && !(await denetim(db, kisi, d.kayit_id))) return null;");
  const db = { sorgu: async () => ({ rows: [{ modul: "personel", kayit_id: "k", anahtar: "a", ad: "ozluk.pdf", tur: "application/pdf", boyut: "1" }] }) } as never;
  assert.ok(await m.dosyaIndirilebilir(db, { id: "x", roller: [] }, "00000000-0000-4000-8000-000000000000", {}), "bozuk: denetimsiz dosya açıldı");
});
