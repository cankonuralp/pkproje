/* OLUMSUZ KANIT — tests/saklama.test.ts neyi koruyor (387, göç 0073). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır,
   0073'teki denetimler bellekte kaldırılır, Supabase benzeri veritabanında (göçü koşan rol süper kullanıcı değil, RLS'i aşar). O zaman:
   1) saklama_sil'in ve korumanın süre denetimi kalkınca 1 yıllık imzalı raporun PDF'leri silinir (ENGEL 11: süre dolmadan silinmez);
   2) korumanın silme denetimi kalkınca süper kullanıcı bile süresi dolmamış imzalı PDF'i siler (kim çağırırsa çağırsın);
   3) çöp denetimi kalkınca imzalı PDF çöpe gider — 30 gün sonra çöp temizliği onu kalıcı siler;
   4) firma süzgeci kalkınca A'nın işlemi B'nin imzalı sürümünü görür (NULL yerine hata — başka firmanın kaydına dokunur);
   5) 30 gün payı kalkınca süre kısaltılır kısaltılmaz eski raporlar listeye girmeden silinir;
   6) en az 5 yıl kalkınca 2 yıllık süre geçer;
   7) değişme damgası kalkınca uygulama ayarın değişme zamanını geçmişe yazar (30 gün payını atlatır). */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 saklama_sil süresi */ ["IF NOT FOUND OR saklama_bitisi(f, s.imzalandi) > now() THEN RETURN NULL; END IF;", "IF NOT FOUND THEN RETURN NULL; END IF;"],
  /* 1–2 koruma: silme süresi */ ["  IF saklama_bitisi(OLD.firma_id, i) > now() THEN\n    RAISE EXCEPTION 'imzalı raporun PDF''i saklama süresi dolmadan silinemez' USING ERRCODE = '23514';\n  END IF;\n", ""],
  /* 3 koruma: çöp */ ["  IF TG_OP = 'UPDATE' THEN\n    RAISE EXCEPTION 'imzalı raporun PDF''i çöpe alınamaz (saklama süresi dolunca kendiliğinden silinir)' USING ERRCODE = '23514';\n  END IF;\n",
    "  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;\n"],
  /* 4 firma */ ["FROM rapor_surumu x WHERE x.firma_id = f AND x.id = p_surum FOR SHARE", "FROM rapor_surumu x WHERE x.id = p_surum FOR SHARE"],
  /* 5 30 gün payı */ ["  SELECT GREATEST(p_imzalandi + make_interval(years => saklama_yili(p_firma)),\n    coalesce((SELECT a.degisti + interval '30 days' FROM firma_ayar a WHERE a.firma_id = p_firma AND a.bolum = 'saklama'), '-infinity'::timestamptz))",
    "  SELECT p_imzalandi + make_interval(years => saklama_yili(p_firma))"],
  /* 6 en az 5 yıl */ ["SELECT LEAST(20, GREATEST(5, coalesce((", "SELECT LEAST(20, GREATEST(1, coalesce(("],
  /* 7 damga */ ["  NEW.degisti := now();\n  IF TG_OP = 'INSERT' THEN NEW.olustu := now(); ELSE NEW.olustu := OLD.olustu; END IF;\n", ""],
];
const VT = "saklama_bozuk";
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz;
const gecici = mkdtempSync(join(tmpdir(), "saklama-bozan-"));
let A = "", B = "", sira = 0;

/** ham imzalı sürüm (tetiksiz kurulum, süper kullanıcı): iki PDF'i; imza anı `sure` önce */
async function surum(f: string, sure: string): Promise<{ surum: string; dosyalar: string[] }> {
  const rapor = randomUUID(), s = randomUUID(), dosyalar = [randomUUID(), randomUUID()];
  await supa.sahip.query("SET session_replication_role = replica");
  try {
    for (const [i, d] of dosyalar.entries()) {
      const modul = i ? "rapor_pdf" : "rapor_imzali";
      await supa.sahip.query(`INSERT INTO dosya (id, firma_id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) VALUES ($1, $2, $3, $4, $5, 'b.pdf', 'application/pdf', 4, repeat('0', 64))`,
        [d, f, modul, rapor, `firma/${f}/${modul}/${rapor}/${d}`]);
    }
    await supa.sahip.query(`INSERT INTO rapor_surumu (id, firma_id, rapor_id, revizyon, no, plan_id, ekipman_id, tur_id, format_id, tesis_id, musteri_id, imzasiz_dosya,
      imzali_dosya, imzali_sha256, imza_yontem, imzalandi, kunye, personel, icerik) VALUES ($1, $2, $3, 0, $4, gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $5, $6, repeat('0', 64), 'dosya', now() - $7::interval, '{}', '{}', '{}')`,
      [s, f, rapor, `BZ-0121-${String(++sira).padStart(3, "0")}-00001`, dosyalar[1], dosyalar[0], sure]);
  } finally { await supa.sahip.query("SET session_replication_role = DEFAULT"); }
  return { surum: s, dosyalar };
}
const satirVar = async (id: string) => (await supa.sahip.query("SELECT 1 FROM dosya WHERE id = $1", [id])).rowCount === 1;
const sil = (f: string, id: string) => kiraciIcinde(havuz, f, (db) => db.sorgu<{ a: string[] | null }>("SELECT saklama_sil($1) AS a", [id])).then((r) => r.rows[0].a);

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0073_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  [A, B] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-sak-a', 'Bozuk Saklama A', 'BA'), ('boz-sak-b', 'Bozuk Saklama B', 'BB') RETURNING id::text")).rows.map((r) => r.id);
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) süre denetimi kalkınca 1 yıllık imzalı raporun PDF'leri silinir", async () => {
  const s = await surum(A, "1 year");
  assert.equal((await sil(A, s.surum))?.length, 2, "bozuk: süresi dolmamış sürüm silindi");
  for (const d of s.dosyalar) assert.equal(await satirVar(d), false);
});

test("2) koruma kalkınca süper kullanıcı süresi dolmamış imzalı PDF'i siler", async () => {
  const s = await surum(A, "1 day");
  await supa.sahip.query("DELETE FROM dosya WHERE id = $1", [s.dosyalar[0]]);
  assert.equal(await satirVar(s.dosyalar[0]), false, "bozuk: imzalı PDF silindi");
});

test("3) çöp denetimi kalkınca imzalı PDF çöpe gider (çöp temizliği sonra kalıcı siler)", async () => {
  const s = await surum(A, "1 day");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE dosya SET cop = now() WHERE id = $1", [s.dosyalar[0]]));
  assert.equal(r.rowCount, 1);
  assert.ok((await supa.sahip.query<{ cop: Date | null }>("SELECT cop FROM dosya WHERE id = $1", [s.dosyalar[0]])).rows[0].cop, "bozuk: imzalı PDF çöpte");
});

test("4) firma süzgeci kalkınca A'nın işlemi B'nin sürümünü görür", async () => {
  const s = await surum(B, "7 years");
  await assert.rejects(sil(A, s.surum), /foreign key|yabancı anahtar/i, "bozuk: NULL yerine başka firmanın sürümüne dokundu");
});

test("5) 30 gün payı kalkınca süre değişir değişmez eski rapor silinir; 6) en az 5 yıl kalkar; 7) değişme zamanı geçmişe yazılır", async () => {
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO firma_ayar (bolum, deger) VALUES ('saklama', '{\"yil\":2}')"));
  assert.equal((await kiraciIcinde(havuz, A, (db) => db.sorgu<{ y: number }>("SELECT saklama_yili(gecerli_firma()) AS y"))).rows[0].y, 2, "bozuk: 2 yıl geçti");
  const b = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ b: Date }>("SELECT saklama_bitisi(gecerli_firma(), now() - interval '3 years') AS b"))).rows[0].b;
  assert.ok(b.getTime() < Date.now(), "bozuk: ayar yeni değişti ama 30 gün beklenmedi");
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE firma_ayar SET degisti = now() - interval '10 years' WHERE bolum = 'saklama'"));
  const d = (await supa.sahip.query<{ d: Date }>("SELECT degisti AS d FROM firma_ayar WHERE firma_id = $1 AND bolum = 'saklama'", [A])).rows[0].d;
  assert.ok(Date.now() - d.getTime() > 9 * 365 * 864e5, "bozuk: değişme zamanı geçmişe yazıldı");
});
