/* OLUMSUZ KANIT — tests/saglik.test.ts "takılı arka plan işi" (383, göç 0072) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici
   klasöre kopyalanır, 0072'deki "çalışıyor ve 1 saatten eski" koşulu bellekte kaldırılır (hiç sayılmaz). O zaman 2 saattir asılı kalan gece işi
   sağlık ucunda görünmez — duman testi "tamam" der, iş sessizce durur. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur } from "../../src/server/db/kiraci.ts";
import { saglikOku } from "../../src/server/db/saglik.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const KOSUL = "WHERE durum = 'calisiyor' AND basladi < now() - interval '1 hour'";
let kume: GomuluKume, supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "is-saglik-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0072_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(KOSUL), "bozulacak satır göçte yok");
      writeFileSync(join(klasor, ad), k.replace(KOSUL, () => "WHERE false"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "is_saglik_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("takılı iş koşulu kalkınca 2 saattir asılı iş sağlıkta görünmez (kilidin koruduğu açık)", async () => {
  await supa.sahip.query("INSERT INTO is_calisma (ad, basladi) VALUES ('asili_is', now() - interval '2 hours')");
  const h = havuzKur({ ...kume.uygulama, database: "is_saglik_bozuk" });
  try {
    assert.equal(Number((await saglikOku(h)).takili_is), 0, "bozuk: asılı iş sayılmadı");
  } finally { await h.end(); }
});
