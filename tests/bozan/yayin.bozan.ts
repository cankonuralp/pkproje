/* OLUMSUZ KANIT — tests/yayin.test.ts neyi koruyor:
   1) 0000 ve 0008 OLMADAN, Supabase düzenindeki veritabanında herkese açık API rolü (anon) public şemasını kullanır, göç kaydını okur ve SİLER,
      firma_bul ile firma kimliği öğrenir, hesap tablosuna izin hatası almadan sorgu atar (yalnız RLS satırları gizler — tek savunma kalır).
      Göçler geçici klasöre 0000 ve 0008 hariç kopyalanır; kaynak diskte değiştirilmez.
   2) havuzKur'daki 'error' dinleyicisi OLMADAN, boştaki bağlantı sunucu tarafında kesilince havuz dinleyicisiz 'error' yayar — Node'da bu
      yakalanmamış istisnadır (süreci düşürür). Çıplak pg havuzunun emit'i gözlenir (dinleyici eklenmez). */
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as bekle } from "node:timers/promises";
import pg from "pg";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

let kume: GomuluKume;
let supa: SupabaseBenzeri;

before(async () => {
  kume = await testKumesi();
  const klasor = mkdtempSync(join(tmpdir(), "probata-goc-"));
  for (const ad of readdirSync(GOC_KLASORU)) if (ad.endsWith(".sql") && !ad.startsWith("0000_") && !ad.startsWith("0008_")) copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  supa = await supabaseBenzeri(kume, "supa_bozuk", klasor);
});
after(async () => {
  await supa?.kapat();
  await kume?.durdur();
});

test("0000 ve 0008 olmadan anon şemayı kullanır, göç kaydını okur ve siler, firma_bul çalışır, hesap sorgusu izin hatası vermez", async () => {
  const { sahip } = supa;
  const s = await sahip.query<{ v: boolean }>("SELECT has_schema_privilege('anon', 'public', 'USAGE') AS v");
  assert.equal(s.rows[0].v, true, "anon şemayı kullanabilmeliydi (kilidin koruduğu açık)");
  await sahip.query("BEGIN");
  try {
    await sahip.query("SET LOCAL ROLE anon");
    const goc = await sahip.query("SELECT ad FROM goc");
    assert.ok(goc.rowCount! > 0, "anon göç kaydını okuyabilmeliydi");
    await sahip.query("DELETE FROM goc");
    await sahip.query("SELECT firma_bul('deneme')");
    await sahip.query("SELECT * FROM hesap");
  } finally {
    await sahip.query("ROLLBACK");
  }
});

test("'error' dinleyicisi olmayan havuzda kopan boştaki bağlantı dinleyicisiz 'error' yayar (yakalanmamış istisna olurdu)", async () => {
  const havuz = new pg.Pool({ ...kume.uygulama, database: "supa_bozuk", max: 2 });
  const yayilan: string[] = [];
  const asil = havuz.emit.bind(havuz);
  havuz.emit = ((ad: string | symbol, ...arg: unknown[]) => {
    if (ad === "error") { yayilan.push(String((arg[0] as Error)?.message)); return true; }   // gözle; Node'un fırlatmasına bırakma
    return asil(ad, ...arg);
  }) as typeof havuz.emit;
  try {
    await havuz.query("SELECT 1");
    assert.equal(havuz.listenerCount("error"), 0);
    await supa.sahip.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'probata_uygulama' AND datname = 'supa_bozuk'");
    await bekle(300);
    assert.ok(yayilan.length > 0, "kopan bağlantı havuzda 'error' yaymalıydı (kilidin koruduğu açık)");
  } finally {
    await havuz.end();
  }
});
