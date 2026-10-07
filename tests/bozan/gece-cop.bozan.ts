/* OLUMSUZ KANIT — tests/gece-cop.test.ts ve tests/zamanli-yetki.test.ts neyi koruyor (378, göç 0069). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   göçler geçici klasöre kopyalanır, 0069'daki beş denetim bellekte kaldırılır; yetki.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) süre denetimi kalkınca DÜN çöpe atılan dosya kalıcı silinir (A5: 30 gün geri dönüş payı yok olur);
   2) firma süzgeci kalkınca A'nın işlemi B'nin dosyasını siler (kiracı sızıntısı);
   3) "dosya satırı yok" denetimi kalkınca CANLI dosyanın içeriği depodan silinir (ANAYASA 9.4);
   4) etkin süzgeci kalkınca dondurulmuş firmaya gece işi dokunur (E6);
   5) yabancı anahtar emniyeti kalkınca bir kayda bağlı dosya silinmeye çalışılır, firmanın bütün temizliği düşer;
   6) kısa sır denetimi kalkınca tek karakterlik CRON_SECRET'le uç açılır. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { geceFirmalari } from "../../src/server/db/is.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { vtDepo, type Depo } from "../../src/server/dosya/depo.ts";
import { dosyaYukle } from "../../src/server/dosya/dosya.ts";
import { geceIsleri } from "../../src/server/is/gece.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 süre */ ["AND cop IS NOT NULL AND cop < now() - interval '30 days' FOR UPDATE", "AND cop IS NOT NULL FOR UPDATE"],
  /* 2 firma (seçim) */ ["SELECT * INTO d FROM dosya WHERE id = p_id AND firma_id = f AND", "SELECT * INTO d FROM dosya WHERE id = p_id AND"],
  /* 5 yabancı anahtar emniyeti (+ 2 firma, silme) */ ["  BEGIN\n    DELETE FROM dosya WHERE id = p_id AND firma_id = f;\n  EXCEPTION WHEN foreign_key_violation THEN\n    RETURN 'bagli';\n  END;\n",
    "  DELETE FROM dosya WHERE id = p_id;\n"],
  /* 3 canlı nesne */ ["\n    AND NOT EXISTS (SELECT 1 FROM dosya x WHERE x.anahtar = n.anahtar)", ""],
  /* 4 etkin */ ["SELECT id FROM firma WHERE durum = 'etkin' ORDER BY id", "SELECT id FROM firma ORDER BY id"],
];
const VT = "gece_cop_bozuk";
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, vt: Depo;
const gecici = mkdtempSync(join(tmpdir(), "gece-cop-bozan-"));
const PDF = (s: string) => new TextEncoder().encode(`%PDF-1.7\n1 0 obj<<>>endobj\n% ${s}\n%%EOF`);
let A = "", B = "", C = "";

async function dosya(f: string, gun: number | null, modul = "deneme") {
  const y = await kiraciIcinde(havuz, f, (db) => dosyaYukle(db, vt, { firmaId: f, modul, kayitId: randomUUID(), ad: "b.pdf", bayt: PDF(randomUUID()), izinli: ["pdf"], kim: "Deneme" }));
  assert.ok(y.tamam);
  if (gun !== null) await supa.sahip.query("UPDATE dosya SET cop = now() - make_interval(days => $2) WHERE id = $1", [y.id, gun]);
  return { id: y.id, anahtar: (await supa.sahip.query<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id = $1", [y.id])).rows[0].anahtar };
}
const sil = (f: string, id: string) => kiraciIcinde(havuz, f, (db) => db.sorgu<{ s: string }>("SELECT dosya_cop_sil($1) AS s", [id])).then((r) => r.rows[0].s);

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0069_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  vt = vtDepo(() => havuz);
  [A, B, C] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-a', 'Bozuk A', 'BA'), ('boz-b', 'Bozuk B', 'BB'), ('boz-c', 'Bozuk C', 'BC') RETURNING id::text")).rows.map((r) => r.id);
  await supa.sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [C]);
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) süre denetimi kalkınca dün çöpe atılan dosya kalıcı silinir", async () => {
  const d = await dosya(A, 1);
  assert.equal(await sil(A, d.id), "silindi", "bozuk: 1 günlük çöp silindi");
});

test("2) firma süzgeci kalkınca A'nın işlemi B'nin dosyasını siler", async () => {
  const d = await dosya(B, 40);
  assert.equal(await sil(A, d.id), "silindi", "bozuk: başka firmanın dosyası silindi");
});

test("3) canlı dosya denetimi kalkınca canlı dosyanın içeriği depodan silinir", async () => {
  const d = await dosya(A, null);
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ s: boolean }>("SELECT depo_nesne_sil($1) AS s", [d.anahtar]));
  assert.equal(r.rows[0].s, true);
  await assert.rejects(vt.oku(d.anahtar), /Depoda böyle bir nesne yok/, "bozuk: canlı dosyanın içeriği gitti");
});

test("4) etkin süzgeci kalkınca dondurulmuş firma listede, çöpü silinir", async () => {
  assert.ok((await geceFirmalari(havuz)).includes(C), "bozuk: dondurulmuş firma gece işinde");
  const d = await dosya(C, 60);
  await geceIsleri(havuz, vt);
  assert.equal((await supa.sahip.query("SELECT 1 FROM dosya WHERE id = $1", [d.id])).rowCount, 0, "bozuk: dondurulmuş firmanın dosyası silindi");
});

test("5) yabancı anahtar emniyeti kalkınca bağlı dosya firmanın bütün temizliğini düşürür", async () => {
  const bagli = await dosya(A, 40, "ekipman_turu"), komsu = await dosya(A, 45);
  const tur = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO ekipman_turu (firma_id, kod, ad, grup, brans, periyot) VALUES ($1, 'BAG', 'Bağlı Tür', 'basinc', 'm', 12) RETURNING id::text", [A])).rows[0].id;
  await supa.sahip.query("INSERT INTO tur_format (firma_id, tur_id, sira, dosya_id) VALUES ($1, $2, 1, $3)", [A, tur, bagli.id]);
  await assert.rejects(sil(A, bagli.id), /foreign key|yabancı anahtar/i, "bozuk: 'bağlı' yerine hata");
  const o = await geceIsleri(havuz, vt);
  assert.equal(o.durum, "hata");
  assert.equal((await supa.sahip.query("SELECT 1 FROM dosya WHERE id = $1", [komsu.id])).rowCount, 1, "bozuk: süresi dolmuş komşu dosya da temizlenemedi");
});

test("6) kısa sır denetimi kalkınca tek karakterlik sırla uç açılır", async () => {
  const kok = resolve("src/server/is");
  const KAYNAK = readFileSync(join(kok, "yetki.ts"), "utf8");
  const DENETIM = "if (!sir || sir.length < 32 || !baslik) return false;";
  assert.ok(KAYNAK.includes(DENETIM), "bozulacak satır kaynakta yok");
  const yol = join(gecici, "yetki-bozuk.ts");
  writeFileSync(yol, KAYNAK.replace(DENETIM, "if (!sir || !baslik) return false;"));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/is/yetki.ts");
  assert.equal(m.zamanliYetkili("Bearer x", "x"), true, "bozuk: tek karakterlik sır kabul edildi");
});
