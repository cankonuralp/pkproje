/* OLUMSUZ KANIT — tests/say-sinav.test.ts neyi koruyor (2026-11-10). Kaynak diskte DEĞİŞTİRİLMEZ: bellekte bozulur —
   (1) tutarsız kayıt kesilmezse sonuç sayısı çağrıyla eşleşmeyen konuşma yapay zekâya gider (hizmet reddeder, sınav hiç sorulamaz);
   (2) soru karardan sonrasını da taşırsa beklenen cevap soruya sızar, sınav hep geçer;
   (3) yardımcı araçlar atılmazsa dizine bakmadan aynı işe başlayan S.A.Y kalmış sayılır;
   (4) düşen çağrı "kaldı" sayılırsa ağ hatası sınavı düşürür. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-sinav-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Sinav = typeof import("../../src/server/yz/sinav.ts");
async function bozuk(eski: string, yeni: string, ad: string): Promise<Sinav> {
  const kaynak = readFileSync(resolve("src/server/yz/sinav.ts"), "utf8");
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni));
  return import(pathToFileURL(yol).href) as Promise<Sinav>;
}
const u = (text: string) => ({ rol: "user", bloklar: [{ type: "text", text }] });
const a = (...adlar: string[]) => ({ rol: "assistant", bloklar: adlar.map((name) => ({ type: "tool_use", name, input: {} })) });
const sonuc = (...t: string[]) => ({ rol: "user", bloklar: t.map((text) => ({ type: "tool_result", text })) });

test("tutarsız kayıt kesilmeyince eşleşmeyen konuşma kurulur — kilit düşer", async () => {
  const m = await bozuk("if (sonuclar.length !== bekleyen.length) break;", "", "kes");
  const k = m.kayitMesajlari([u("Yaz"), a("rapor_ac", "rapor_yaz"), sonuc("yalnız biri"), a("rapor_yaz")]);
  assert.ok(k.mesajlar.length > 2, "bozuk: eksik sonuçlu konuşma sürdürüldü");
});

test("soru karardan sonrasını taşıyınca beklenen cevap sızar — kilit düşer", async () => {
  const m = await bozuk("mesajlar: mesajlar.slice(0, k.mesaj)", "mesajlar: mesajlar.slice(0, k.mesaj + 1)", "siz");
  const q = m.sinavSorulari([u("Raporları oluştur"), a("plan_hazirlik")])[0]!;
  assert.ok(JSON.stringify(q.mesajlar).includes("plan_hazirlik"), "bozuk: cevap sorunun içinde");
});

test("yardımcı araçlar atılmayınca dizine bakmayan S.A.Y kalır — kilit düşer", async () => {
  const m = await bozuk("const asil = (l: readonly string[]) => l.filter((x) => !YARDIMCI_ARACLAR.has(x));", "const asil = (l: readonly string[]) => [...l];", "yardimci");
  assert.equal(m.karsilastir(["islemler", "plan_hazirlik"], ["plan_hazirlik"]).gecti, false);
});

test("düşen çağrı kaldı sayılınca ağ hatası sınavı düşürür — kilit düşer", async () => {
  const m = await bozuk("gecti: k ? k.gecti : null });", "gecti: k ? k.gecti : false });", "dusen");
  const s = await m.sinavKos([[u("Raporları oluştur"), a("plan_hazirlik")]], async () => null);
  assert.deepEqual([s.sorulan, s.gecti], [1, false], "bozuk: sorulamayan soru kalmış sayıldı");
});
