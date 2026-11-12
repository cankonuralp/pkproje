/* NEREDEN GELDİ: 2026-11-12 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları düzgün olmalı" (pkproje.md §11 K5).
   Rapora eklenen fotoğrafla saklanan kanıt: eklendiği an (sunucu), çekildiği an (fotoğrafın kendi saati — dosyadaki önce, yoksa cihazın okuduğu;
   HER firmada), konum (YALNIZ ölçümlü raporda; izin yoksa null — "konum yok" da kayıttır). Cihazdan gelen bozuk parça fotoğrafı durdurmaz, yok
   sayılır. Olumsuz kanıt: tests/bozan/foto-kanit.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fotoKaniti } from "../src/modules/raporlar/foto-kanit.ts";

const SIMDI = new Date("2026-11-12T10:41:07.000Z");

test("çekim anı: dosyadaki saat önce, yoksa cihazın okuduğu; biçimsiz değer yok sayılır; eklendiği an sunucudan", () => {
  assert.deepEqual(fotoKaniti("2026-11-12 13:33", { cekim: "2026-11-12 09:00" }, false, SIMDI), { eklendi: "2026-11-12T10:41:07.000Z", cekim: "2026-11-12 13:33" });
  assert.deepEqual(fotoKaniti(null, { cekim: "2026-11-12 13:41" }, false, SIMDI), { eklendi: "2026-11-12T10:41:07.000Z", cekim: "2026-11-12 13:41" });
  for (const bozuk of [null, undefined, "kanit", 5, { cekim: "dün" }, { cekim: 1331 }, { cekim: "2026-11-12T13:41" }]) {
    assert.deepEqual(fotoKaniti(null, bozuk, false, SIMDI), { eklendi: "2026-11-12T10:41:07.000Z", cekim: null }, JSON.stringify(bozuk));
  }
  assert.equal(fotoKaniti("bozuk", { cekim: "2026-11-12 13:41" }, false, SIMDI).cekim, "2026-11-12 13:41", "dosyadan okunan biçimsizse cihazınki");
});

test("konum: yalnız ölçümlü raporda; ≈ 1 m'ye yuvarlanır; izin yoksa / bozuksa null (konum yok da kayıt); ölçümsüz raporda hiç saklanmaz", () => {
  const konum = { e: 39.92077123, b: 32.85411987, d: 12.6 };
  assert.deepEqual(fotoKaniti(null, { konum }, true, SIMDI).konum, { e: 39.92077, b: 32.85412, d: 13 });
  assert.deepEqual(fotoKaniti(null, { konum: { e: 39.9, b: 32.8 } }, true, SIMDI).konum, { e: 39.9, b: 32.8, d: null });
  for (const yok of [undefined, null, {}, { konum: null }, { konum: { e: 139, b: 32 } }, { konum: { e: 39, b: 232 } }, { konum: { e: "39", b: "32" } }, { konum: { e: 39, b: 32, d: -1 } }]) {
    assert.equal(fotoKaniti(null, yok, true, SIMDI).konum, null, JSON.stringify(yok));
  }
  /* ölçümsüz (TÜRKAK'sız) raporda konum gönderilse de saklanmaz — anahtar bile yok */
  assert.equal("konum" in fotoKaniti(null, { konum }, false, SIMDI), false);
});
