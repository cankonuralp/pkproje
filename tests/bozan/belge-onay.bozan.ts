/* OLUMSUZ KANIT — tests/belge-onay.test.ts neyi koruyor (333; göç 0044). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre
   kopyalanır, bozulacak göç bellekte bozulur, kopyadan koşulur.
   1. İmzacı denetimi olmasaydı belgeyi gönderen (ya da başkası) kişinin yerine geri gönderirdi / imzalardı.
   2. İçerik değişmezliği olmasaydı gönderilen belgenin adı (dönemi, kişisi) sonradan değişirdi.
   3. Ertelenen dosya denetimi olmasaydı dosyasız belge imzaya düşerdi. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

let kume: GomuluKume;
const gecici = mkdtempSync(join(tmpdir(), "belge-onay-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];

/** göçü bozarak Supabase taklidi veritabanı açar; A firması, imzacı ve gönderen (yönetici) personeli ve hesapları */
async function bozuk(ad: string, eski: string, yeni: string) {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith("0044_")) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, () => yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
  const A = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text");
  const ben = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Ben', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
  const yon = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Yönetici', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
  const benH = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'ben@deneme-a.example', 'Deneme Ben', '{denetci}', 'etkin', $2) RETURNING id::text", [A, ben]);
  const yonH = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'yon@deneme-a.example', 'Deneme Yönetici', '{firma_yoneticisi}', 'etkin', $2) RETURNING id::text", [A, yon]);
  /* belge: yönetici gönderir — kayıt → kendi dosyası → bağ (aynı işlemde) */
  const gonder = (db: Sorgulayici) => belgeYaz(db, A, ben);
  const id = await kiraciIcinde(havuz, A, gonder, { hesapId: yonH });
  return { havuz, A, ben, benH, yonH, id };
}
async function belgeYaz(db: Sorgulayici, A: string, personel: string): Promise<string> {
  const id = (await db.sorgu<{ id: string }>("INSERT INTO belge_onay (tur, ad, personel_id, ay) VALUES ('bordro', 'Eylül 2026 maaş bordrosu', $1, '2026-09') RETURNING id::text", [personel])).rows[0].id;
  const d = randomUUID();
  await db.sorgu("INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) VALUES ($1, 'belge_onay', $2, $3, 'bordro.pdf', 'application/pdf', 10, $4)",
    [d, id, `firma/${A}/belge_onay/${id}/${d}`, "0".repeat(64)]);
  await db.sorgu("UPDATE belge_onay SET dosya = $2 WHERE id = $1", [id, d]);
  return id;
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0044'te imzacı denetimi kalkınca belgeyi gönderen, kişinin yerine geri gönderir (kilidin koruduğu açık)", async () => {
  const { havuz, A, yonH, id } = await bozuk("belge_bozuk1",
    "    ELSIF ben IS NULL OR NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN\n      RAISE EXCEPTION 'belgeyi yalnız imzalayacak kişi imzalar ya da geri gönderir' USING ERRCODE = '23514';\n", "");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE belge_onay SET durum = 'geri' WHERE id = $1", [id]), { hesapId: yonH });
  assert.equal(r.rowCount, 1, "gönderen, kişinin yerine karar verdi");
});

test("0044'te içerik değişmezliği kalkınca gönderilen belgenin adı ve dönemi değişir", async () => {
  const { havuz, A, yonH, id } = await bozuk("belge_bozuk2", "    RAISE EXCEPTION 'gönderilen belge değişmez' USING ERRCODE = '23514';\n", "");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE belge_onay SET ad = 'Ekim 2026 maaş bordrosu', ay = '2026-10' WHERE id = $1", [id]), { hesapId: yonH });
  assert.equal(r.rowCount, 1, "gönderilen belge değişti");
});

test("0044'te ertelenen dosya denetimi kalkınca dosyasız belge imzaya düşer", async () => {
  const { havuz, A, ben, yonH } = await bozuk("belge_bozuk3",
    "    CREATE CONSTRAINT TRIGGER belge_onay_dosyali AFTER INSERT ON belge_onay DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION belge_onay_dosyali();\n", "    NULL;\n");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO belge_onay (tur, ad, personel_id) VALUES ('egitim', 'Deneme formu', $1)", [ben]), { hesapId: yonH });
  assert.equal(r.rowCount, 1, "dosyasız belge kaldı");
});
