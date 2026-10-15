/* OLUMSUZ KANIT — tests/kiraci-izolasyonu.test.ts'in 564 kilidi (politikada çıplak firma süzgeci yok, her yabancı anahtarın dizini var) neyi koruyor.
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0091 (veritabanı hızı) KOPYAYA alınmaz. O zaman aynı denetimler
   çıplak politikaları ve dizinsiz yabancı anahtarları bulur — kilit gerçek bir kapıdır (göç kalkarsa ya da yeni göç eski biçimle yazılırsa düşer). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";
import { CIPLAK_POLITIKA, DIZINSIZ_YABANCI_ANAHTAR } from "../yardimci/vt-hiz.ts";

const gecici = mkdtempSync(join(tmpdir(), "vt-hiz-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri;

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) if (ad.endsWith(".sql") && !ad.startsWith("0091_")) copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  supa = await supabaseBenzeri(kume, "vt_hiz_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("0091 olmadan politikalar firma süzgecini her satırda hesaplar (kilidin koruduğu açık)", async () => {
  const l = (await supa.sahip.query<{ ad: string }>(CIPLAK_POLITIKA)).rows;
  assert.ok(l.length >= 60, `bozuk: çıplak politika ${l.length}`);
  assert.ok(l.some((x) => x.ad.startsWith("rapor.")), "rapor tablosunun politikası çıplak");
});

test("0091 olmadan yabancı anahtarların dizini yok (kilidin koruduğu açık)", async () => {
  const l = (await supa.sahip.query<{ ad: string }>(DIZINSIZ_YABANCI_ANAHTAR)).rows;
  assert.ok(l.length >= 40, `bozuk: dizinsiz yabancı anahtar ${l.length}`);
});
