/* NEREDEN GELDİ: 2026-11-12 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı" (pkproje.md §11 K8: S.A.Y TÜRKAK'lı firmada saat
   dağıtmaz, kendiliğinden saat yazmaz; kişinin gerekçeli düzeltmesini kişinin gerekçesiyle yapar). Ölçümlü raporda S.A.Y'ın yazma komutu başlangıç
   ve bitişe yazamaz (ekran ve kapalı rapor aynı işlevden: komutlariUygula); öteki tarihler yazılır. Gerekçeli düzeltme ayrı işlem
   (kontrol_saat_duzelt), girdisi modülün şemasından. Olumsuz kanıt: tests/bozan/say-olcumlu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Cevaplar, FormatTanimi } from "../src/format/tanim.ts";
import { komutlariUygula, OLCUMLU_SAAT, type Durum } from "../src/modules/raporlar/say-doldur.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

const T = FormatTanimi.parse({ sema: 1, bolumler: [
  { id: "genel", ad: "Genel", blok: "bilgi", alanlar: [{ id: "kapsam", ad: "Kapsam", tur: "coklu", secenekler: ["Aydınlatma", "Priz"] }] },
] });
const durum = (): Durum => ({ ekipman: {}, cevaplar: Cevaplar.parse({}), tarih: { bas: "2026-11-12T13:30", bit: "", sonraki: "", takip: "", rapor: "" } });
const GIRIS = [{ yer: "tarih:bas", deger: "12.11.2026 10:00" }, { yer: "tarih:bit", deger: "12.11.2026 10:10" },
  { yer: "tarih:rapor", deger: "12.11.2026" }, { yer: "tarih:sonraki", deger: "12.11.2027" }];

test("ölçümlü raporda S.A.Y başlangıç ve bitişe yazamaz (nedeni döner); rapor tarihi ve sonraki kontrol yazılır; ölçümsüz raporda hepsi yazılır", () => {
  const o = komutlariUygula(durum(), T, GIRIS, { olcumlu: true });
  const s = (u: typeof o, yer: string) => u.sonuclar.filter((x) => x.yer === yer).map((x) => `${x.durum}${x.neden ? `: ${x.neden}` : ""}`);
  assert.deepEqual(s(o, "tarih:bas"), [`yazilamadi: ${OLCUMLU_SAAT}`]);
  assert.deepEqual(s(o, "tarih:bit"), [`yazilamadi: ${OLCUMLU_SAAT}`]);
  assert.deepEqual([s(o, "tarih:rapor"), s(o, "tarih:sonraki")], [["yazildi"], ["yazildi"]]);
  assert.deepEqual(o.durum.tarih, { bas: "2026-11-12T13:30", bit: "", sonraki: "2027-11-12", takip: "", rapor: "2026-11-12" }, "ölçülen başlangıç yerinde, bitiş boş");
  const n = komutlariUygula(durum(), T, GIRIS);
  assert.deepEqual(GIRIS.map((g) => s(n, g.yer)), [["yazildi"], ["yazildi"], ["yazildi"], ["yazildi"]]);
  assert.deepEqual([n.durum.tarih?.bas, n.durum.tarih?.bit], ["2026-11-12T10:00", "2026-11-12T10:10"]);
});

test("gerekçeli saat düzeltmesi S.A.Y'da ayrı işlem: yazan türde, tarifi gerekçeyi kullanıcıdan ister", () => {
  const i = ISLEM_KATALOGU.find((x) => x.ad === "kontrol_saat_duzelt");
  assert.ok(i, "kontrol_saat_duzelt kataloğda");
  assert.equal(i.tur, "yaz");
  assert.match(i.tarif, /gerekçeyi sen üretme/);
  assert.match(ISLEM_KATALOGU.find((x) => x.ad === "rapor_saat_plani")!.tarif, /saat/i);
});
