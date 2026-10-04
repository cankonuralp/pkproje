/* OLUMSUZ KANIT — tests/sozlesmeler.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0017'de
   İSG-KATİP tablosunun tesis / personel bileşik yabancı anahtarları bellekte tek sütuna indirilir. O zaman B firmasının kullanıcısı (ya da hatalı
   bir kod) A firmasının tesisine kendi denetçisini İSG-KATİP ID'siyle bağlar — kiracılar arası sızıntı veritabanında kapanmaz. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const FK = "FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),\n  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),\n  CHECK (kaldirildi";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "soz-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0017_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(FK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(FK, "FOREIGN KEY (tesis_id) REFERENCES tesis (id),\n  FOREIGN KEY (personel_id) REFERENCES personel (id),\n  CHECK (kaldirildi"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "soz_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("bileşik anahtar tek sütuna inince B, A'nın tesisine İSG-KATİP ID'si bağlar (kilidin koruduğu açık)", async () => {
  const [A, B] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "soz_bozuk" });
  try {
    const tA = await kiraciIcinde(havuz, A, async (db) => {
      const m = (await db.sorgu<{ id: string }>("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Müşteri', 'Deneme') RETURNING id::text")).rows[0].id;
      return (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Deneme Tesis') RETURNING id::text", [m])).rows[0].id;
    });
    const r = await kiraciIcinde(havuz, B, async (db) => {
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme B', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      return db.sorgu("INSERT INTO isg_katip (tesis_id, personel_id, no) VALUES ($1, $2, 'SIZINTI')", [tA, p]);
    });
    assert.equal(r.rowCount, 1, "başka firmanın tesisine bağlandı");
  } finally { await havuz.end(); }
});
