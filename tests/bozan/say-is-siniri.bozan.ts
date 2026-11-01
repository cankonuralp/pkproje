/* OLUMSUZ KANIT — tests/say-is-siniri.test.ts neyi koruyor (2026-10-31, V21 madde 1). Kaynak diskte DEĞİŞTİRİLMEZ: is-siniri.ts bellekte bozulur.
   1. Sınır "son soru" yerine "ilk soru" olursa bu işin iletileri de küçülür (büyütülen görüntü aynı işte kaybolur). 2. Fotoğraf bloğu metne inmezse
   bitmiş işin fotoğrafları konuşmada kalır (100 bin aşılır). 3. Büyütülenler önceki işten de sayılırsa yeni işte fotoğrafa bakılamaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-is-siniri-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type M = typeof import("../../src/modules/say/is-siniri.ts");
async function bozuk(eski: string, yeni: string): Promise<M> {
  const k = readFileSync(resolve("src/modules/say/is-siniri.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni).replace(/from "\.\/bitis-denetimi\.ts"/, () => `from "${pathToFileURL(resolve("src/modules/say/bitis-denetimi.ts")).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
const resim = { type: "image", source: { type: "file", file_id: "f1" } };
const goster = (id: string, foto: string) => ({ type: "tool_use", id, name: "foto_goster", input: { foto } });
const K = [
  { role: "user", content: [{ type: "text", text: "a" }, resim] }, { role: "assistant", content: [goster("g1", "F01")] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "g1", content: [{ type: "image", source: {} }, { type: "text", text: "F01" }] }] },
  { role: "assistant", content: [{ type: "text", text: "bitti" }] },
  { role: "user", content: [{ type: "text", text: "b" }] }, { role: "assistant", content: [goster("g2", "F02")] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "g2", content: [{ type: "image", source: {} }, { type: "text", text: "F02" }] }] },
];

test("1. sınır ilk soruya kayınca bu işin görüntüsü de kaybolur", async () => {
  const m = await bozuk("for (let i = mesajlar.length - 1; i >= 0; i--) if (soruMu(mesajlar[i]!)) return i;", "return mesajlar.length;");
  const s = m.konusmaSikistir(K);
  assert.notDeepEqual(s.mesajlar[6], K[6]);
});
test("2. fotoğraf bloğu metne inmezse bitmiş işin fotoğrafı kalır", async () => {
  const m = await bozuk('if (b.type === "image") { degisti = true; return { type: "text", text: FOTO_KALDIRILDI }; }', "");
  const ilk = m.konusmaSikistir(K).mesajlar[0]!.content as { type: string }[];
  assert.ok(ilk.some((b) => b.type === "image"));
});
/* 2026-11-01 V21 A1 + B */
test("4. seviye seçimi tavana bakmazsa istem 100 bini aşar", async () => {
  const m = await bozuk("while (s < KUCULTME_EN_COK && tahmin(s) > TAVAN) s++;", "");
  assert.equal(m.kucultmeSeviyesi(K, 0, m.TAVAN), 0, "bozuk: tavan aşılırken seviye 0 kaldı");
});
test("5. 60 dakika kuralı kalkınca eski konuşma kapanmaz", async () => {
  const m = await bozuk("return `${KAPANIS_DAKIKA} dakika geçti`;", "return null;");
  const simdi = new Date("2026-11-01T10:00:00+03:00");
  const konusma = [{ role: "user", content: [{ type: "text", text: "a" }] }, { role: "assistant", content: [{ type: "text", text: "bitti" }] }];
  assert.equal(m.kapanisNedeni({ mesajlar: konusma, sonZaman: new Date(simdi.getTime() - 120 * 60_000), simdi }), null, "bozuk: iki saat geçmişken kapanmadı");
});
test("3. büyütülenler önceki işten de sayılınca yeni işte fotoğraf kilitlenir", async () => {
  const m = await bozuk("const s = new Set<number>(), b = Math.max(0, sonSoruIndeksi(mesajlar));", "const s = new Set<number>(), b = 0;");
  assert.ok(m.gosterilenFotolar(K).has(1));
});
test("6. parti sonu küçültme kalkınca yazılmış partinin büyütmeleri konuşmada kalır (2026-11-01 büyük iş şeması)", async () => {
  const m = await bozuk("  if (sonYazma < 0) return { mesajlar: [...mesajlar], degisen: 0 };", "  return { mesajlar: [...mesajlar], degisen: 0 };");
  const b64 = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "/9j/" } };
  const l = [
    { role: "user", content: [{ type: "text", text: "raporları hazırla" }] },
    { role: "assistant", content: [{ type: "tool_use", id: "g1", name: "foto_goster", input: { foto: "F01" } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "g1", content: [b64, { type: "text", text: "F01" }] }] },
    { role: "assistant", content: [{ type: "tool_use", id: "y1", name: "islem", input: { ad: "raporlara_yaz", girdi: { raporlar: [] } } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "y1", content: "{}" }] },
  ];
  assert.equal(m.partiSonuKucult(l).degisen, 0, "bozuk: parti yazıldıktan sonra büyütme kaldı");
});
