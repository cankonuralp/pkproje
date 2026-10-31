/* NEREDEN GELDİ: 2026-10-31 lift denemesi (reisim: "İş ölçümü: her iş için istek sayısı, en büyük istem, süre ve maliyet kaydedilir. Bugün yalnız aylık toplam var;
   bu denemeyi tek başına ölçemedik"; Ar-Ge dökümü: "eğer bize bir handikapı yoksa 30 gün saklansın (b)" — konuşma "Sohbeti temizle" ile silinmişti; sunum L8).
   Bu kilit tutar: (1) Ar-Ge kopyası yalnız metin, araç çağrısı ve sonucu (kırpılmış) — görüntü, belge, düşünce atılır; (2) temizlemeden ÖNCE kaydedilir;
   (3) döngü her isteği işin kimliğiyle ölçer; (4) işin şablonu son sorudan. Olumsuz kanıt: tests/bozan/say-olcum.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isSablonu } from "../src/modules/say/sablonlar.ts";
import { argeIcerigi } from "../src/server/yz/olcum.ts";

test("Ar-Ge kopyası: metin, araç çağrısı, sonuç (kırpılmış); görüntü, belge, düşünce yok", () => {
  const l = argeIcerigi([
    { rol: "user", icerik: [{ type: "text", text: "raporları hazırla" }, { type: "image", source: { type: "file", file_id: "f1" } }, { type: "document", source: {} }] },
    { rol: "system", icerik: "Sayfa: Planlar" },
    { rol: "assistant", icerik: [{ type: "thinking", thinking: "iç düşünce", signature: "x" }, { type: "tool_use", id: "a", name: "islem", input: { ad: "plan_getir" } }] },
    { rol: "user", icerik: [{ type: "tool_result", tool_use_id: "a", content: "x".repeat(5000) }] },
    { rol: "assistant", icerik: [{ type: "redacted_thinking", data: "?" }] },
  ]);
  assert.deepEqual(l.map((m) => m.rol), ["user", "system", "assistant", "user"], "yalnız düşünceden oluşan ileti düşer");
  assert.deepEqual(l[0]!.bloklar, [{ type: "text", text: "raporları hazırla" }]);
  assert.deepEqual(l[2]!.bloklar, [{ type: "tool_use", name: "islem", input: { ad: "plan_getir" } }]);
  assert.ok(String(l[3]!.bloklar[0]!.text).length < 4100 && /kırpıldı/.test(String(l[3]!.bloklar[0]!.text)));
  assert.doesNotMatch(JSON.stringify(l), /iç düşünce|file_id|signature/);
});

test("kaynak kilidi: temizlemeden önce Ar-Ge kaydı; döngü her isteği ölçer", () => {
  const k = readFileSync("src/server/yz/konusma.ts", "utf8"), d = readFileSync("src/modules/say/server/dongu.ts", "utf8");
  const t = k.slice(k.indexOf("export async function konusmaTemizle"));
  assert.ok(t.indexOf("argeKaydiYaz(") > 0 && t.indexOf("argeKaydiYaz(") < t.indexOf("DELETE FROM yz_ek"), "silmeden önce");
  assert.ok(d.includes("istekOlcumuYaz(db, { is: v.is,"), "işin kimliğiyle");
  assert.ok(d.includes("await olc(0, 0);") && d.includes("await olc(r.yazma, r.islem);"), "son cevapta ve araçlardan sonra");
});

test("işin şablonu son sorunun şablon notundan", () => {
  const soru = { role: "user", content: [{ type: "text", text: "x" }] };
  assert.equal(isSablonu([soru, { role: "system", content: "Sayfa: Planlar\nŞablon: S1 Saha bilgisinden raporları hazırla; beceri: B01" }]), "S1");
  assert.equal(isSablonu([soru, { role: "system", content: "Sayfa: Planlar" }]), null);
});
