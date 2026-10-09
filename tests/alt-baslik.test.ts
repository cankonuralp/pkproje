/* NEREDEN GELDİ: 461 — reisim 2026-10-09: "üst başlık ekleme olayı kullanımı zorlaştırıyor alt başlık ekleme olayı olmadığı için anlamsız oluyor
   alt başlık ekleme olsun". Bölümün alt bayrağı (src/format/tanim.ts): üstündeki ANA bölümün altında N.1, N.2 … (src/format/duzen.ts); belge
   alt başlığı h3 basar (src/belge/belge.ts); kurucu.ts bolumDuzeni alt başlığı üst başlık grubundan ve numarasızlıktan çıkarır; Bakanlık bölümünün
   alt bayrağı kilitli özün parçası (motor.ts bolumOzu). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { raporDuzeni } from "../src/format/duzen.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type FormatGirdisi } from "../src/format/tanim.ts";
import { bolumDuzeni } from "../src/modules/rapor-format/kurucu.ts";

const not = (id: string, ek: Record<string, unknown> = {}) => ({ id, ad: id.toUpperCase(), blok: "not", ...ek });
const tanim = (bolumler: unknown[]) => FormatTanimi.parse({ sema: 1, bolumler } as FormatGirdisi);
const numaralar = (t: FormatTanimi) => raporDuzeni(t, false).bolumler.map((x) => `${x.no ?? "-"} ${x.b.ad}`);

test("alt başlık üstündeki ana bölümün altında N.1, N.2; ana bölüm yoksa yok sayılır; sonraki ana bölümün numarası kaymaz", () => {
  assert.deepEqual(numaralar(tanim([not("a"), not("b", { alt: true }), not("c", { alt: true }), not("d"), not("e", { alt: true })])),
    ["3 A", "3.1 B", "3.2 C", "4 D", "4.1 E"]);
  /* ilk bölüm alt olamaz (ana yok) — ana numara alır */
  assert.deepEqual(numaralar(tanim([not("a", { alt: true }), not("b", { alt: true })])), ["3 A", "3.1 B"]);
  /* numarasız bölümden ve üst başlıklı gruptan sonra alt başlık olmaz */
  assert.deepEqual(numaralar(tanim([not("a"), not("f", { numarasiz: true }), not("b", { alt: true })])), ["3 A", "- F", "4 B"]);
  assert.deepEqual(numaralar(tanim([not("a", { ust: "Üst" }), not("b", { ust: "Üst" }), not("c", { alt: true }), not("d", { alt: true })])),
    ["3.1 A", "3.2 B", "4 C", "4.1 D"]);
  /* alt bayraksız formatlar eskisi gibi (Bakanlık ZPKR04: 5.1 / 5.2 üst başlıktan) */
  assert.ok(numaralar(SABLONLAR.ZPKR04.tanim).some((x) => x.startsWith("5.1 ")));
});

test("belge: alt başlık h3 'N.k ad', ana bölüm h2 'N. AD'", () => {
  const t = tanim([...SABLONLAR.KOMPRESOR.tanim.bolumler, not("ana"), not("alt1", { alt: true })]);
  const html = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t }) as never);
  const ana = raporDuzeni(t, false).bolumler.find((x) => x.b.id === "ana")!.no;
  assert.match(html, new RegExp(`<h2>${ana}\\. ANA</h2>`));
  assert.match(html, new RegExp(`<h3>${ana}\\.1 ALT1</h3>`));
});

test("kurucu: alt başlık yapılınca üst başlık ve numarasızlık düşer; kilitli bölüm değişmez; Bakanlık bölümünün alt bayrağı kilitli öz", () => {
  const t = tanim([not("a"), not("b", { ust: "Üst", numarasiz: true })]);
  const y = bolumDuzeni(t, 1, { alt: true });
  assert.deepEqual([y.bolumler[1].alt, y.bolumler[1].ust, y.bolumler[1].numarasiz], [true, undefined, undefined]);
  assert.equal(bolumDuzeni(y, 1, { alt: false }).bolumler[1].alt, undefined);
  const z = SABLONLAR.ZPKR02.tanim, k = z.bolumler.findIndex((b) => b.kilit);
  assert.equal(bolumDuzeni(z, k, { alt: true }), z, "kilitli bölüm alt başlık yapılamaz");
  const elle = { ...z, bolumler: z.bolumler.map((b, j) => (j === k ? { ...b, alt: true } : b)) };
  assert.ok(kilitDenetimi(elle, z).some((x) => x.includes("değiştirilmiş")), "istemciden gelen alt bayrağı yayında yakalanır");
});
