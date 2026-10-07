/* NEREDEN GELDİ: 378 — KOD-GECIS K5 (arka plan işleri), 09-A5 "silinen kaydın dosyası çöpe (30 gün) gider; depodan silme yalnız çöp süresi dolunca;
   öksüz nesne raporlanır, silinmez", G1 "iş kiracı bağlamıyla; düşen iş görünür", E6 "dondurulmuş firmaya arka plan işi dokunmaz". GERÇEK PostgreSQL,
   üç firma (biri dondurulmuş). Gece çöp temizliği (göç 0069, src/server/dosya/cop.ts, src/server/is/gece.ts):
   · 30 günü dolan çöp dosyası satırı ve depodaki nesnesiyle silinir; 29 günlük çöp, çöpte olmayan dosya, başka firmanın dosyası kalır;
   · bir kayda hâlâ bağlı dosya silinmez ("bağlı" sayılır), iş düşmez; dondurulmuş firmanın dosyasına dokunulmaz;
   · ikinci koşu bir şey silmez (idempotent); özet yalnız sayılar; iş kaydı (is_calisma) "tamam";
   · aynı iş aynı anda iki kez koşmaz; 1 saattir "çalışıyor"da kalan iş "takıldı" olur;
   · uygulama rolü iş kaydına doğrudan erişemez; silme işlevleri firmasız çağrılamaz; başka firmanın / süresi dolmamış dosyası silinmez; depo
     nesnesi dosya satırı varken silinmez; uygulama rolünün DELETE'i yok;
   · öksüz nesne sayılır, silinmez; klasör deposunda nesne klasörden de gider; sınır dolunca kalan sonraki koşuya.
   Olumsuz kanıt: tests/bozan/gece-cop.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { geceFirmalari, isBasla, isBitir } from "../src/server/db/is.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { copTemizle } from "../src/server/dosya/cop.ts";
import { dosyaAnahtari } from "../src/server/dosya/anahtar.ts";
import { klasorDepo, vtDepo, type Depo } from "../src/server/dosya/depo.ts";
import { dosyaYukle } from "../src/server/dosya/dosya.ts";
import { geceIsleri } from "../src/server/is/gece.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, vt: Depo;
const firma: Record<"A" | "B" | "C" | "D" | "E", string> = { A: "", B: "", C: "", D: "", E: "" };
const klasor = mkdtempSync(join(tmpdir(), "gece-cop-depo-"));
const PDF = (s: string) => new TextEncoder().encode(`%PDF-1.7\n1 0 obj<<>>endobj\n% ${s}\n%%EOF`);

/** dosya yükler; gun verilirse o kadar gün önce çöpe alınmış sayılır */
async function dosya(f: string, gun: number | null, d: Depo = vt, modul = "deneme"): Promise<{ id: string; anahtar: string; boyut: number }> {
  const y = await kiraciIcinde(havuz, f, (db) => dosyaYukle(db, d, { firmaId: f, modul, kayitId: randomUUID(), ad: "belge.pdf", bayt: PDF(randomUUID()), izinli: ["pdf"], kim: "Deneme" }));
  assert.ok(y.tamam);
  const r = (await sahip.query<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id = $1", [y.id])).rows[0];
  if (gun !== null) await sahip.query("UPDATE dosya SET cop = now() - make_interval(days => $2) WHERE id = $1", [y.id, gun]);
  return { id: y.id, anahtar: r.anahtar, boyut: y.boyut };
}
const satirVar = async (id: string) => (await sahip.query("SELECT 1 FROM dosya WHERE id = $1", [id])).rowCount === 1;
const nesneVar = async (anahtar: string) => (await sahip.query("SELECT 1 FROM depo_nesne WHERE anahtar = $1", [anahtar])).rowCount === 1;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  vt = vtDepo(() => havuz);
  sahip = kume.sahipIstemci();
  await sahip.connect();
  const ids = (await sahip.query<{ id: string }>(`INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES
    ('cop-a', 'Çöp A', 'CA'), ('cop-b', 'Çöp B', 'CB'), ('cop-c', 'Çöp C', 'CC'), ('cop-d', 'Çöp D', 'CD'), ('cop-e', 'Çöp E', 'CE') RETURNING id::text`)).rows;
  [firma.A, firma.B, firma.C, firma.D, firma.E] = ids.map((r) => r.id);
  await sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [firma.C]);
});
after(async () => { await sahip?.end(); await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("30 günü dolan çöp silinir (satır + nesne); süresi dolmamış, canlı, bağlı ve dondurulmuş firmanınki kalır; ikinci koşu bir şey silmez", async () => {
  const a1 = await dosya(firma.A, 31), a2 = await dosya(firma.A, 29), a3 = await dosya(firma.A, null), a4 = await dosya(firma.A, 40, vt, "ekipman_turu");
  const b1 = await dosya(firma.B, 45), c1 = await dosya(firma.C, 60);
  /* a4 hâlâ bir kayda bağlı: türün rapor formatı PDF'i (tur_format → dosya yabancı anahtarı) */
  const tur = (await sahip.query<{ id: string }>(
    "INSERT INTO ekipman_turu (firma_id, kod, ad, grup, brans, periyot) VALUES ($1, 'BAG', 'Bağlı Tür', 'basinc', 'm', 12) RETURNING id::text", [firma.A])).rows[0].id;
  await sahip.query("INSERT INTO tur_format (firma_id, tur_id, sira, dosya_id) VALUES ($1, $2, 1, $3)", [firma.A, tur, a4.id]);

  const o = await geceIsleri(havuz, vt);
  /* yalnız sayılar; A ve B (D, E boş; C dondurulmuş — listede yok) */
  assert.deepEqual(o, { durum: "tamam", firma: 4, silinen: 2, bayt: a1.boyut + b1.boyut, bagli: 1, oksuz: 0, kalan: 0, hatali_firma: 0 });
  for (const s of [a1, b1]) { assert.equal(await satirVar(s.id), false); assert.equal(await nesneVar(s.anahtar), false); }
  for (const s of [a2, a3, a4, c1]) { assert.equal(await satirVar(s.id), true); assert.equal(await nesneVar(s.anahtar), true); }
  /* bağlı dosyanın kaydı yerinde */
  assert.equal((await sahip.query("SELECT 1 FROM tur_format WHERE dosya_id = $1", [a4.id])).rowCount, 1);
  /* iş kaydı: tamam, özet aynı sayılar */
  const k = (await sahip.query<{ durum: string; ozet: Record<string, number>; bitti: Date | null }>(
    "SELECT durum, ozet, bitti FROM is_calisma WHERE ad = 'cop_temizligi' ORDER BY basladi DESC LIMIT 1")).rows[0];
  assert.equal(k.durum, "tamam");
  assert.ok(k.bitti);
  assert.deepEqual(k.ozet, { firma: 4, silinen: 2, bayt: a1.boyut + b1.boyut, bagli: 1, oksuz: 0, kalan: 0, hatali_firma: 0 });

  const o2 = await geceIsleri(havuz, vt);
  assert.deepEqual([o2.durum, o2.silinen, o2.bayt, o2.bagli], ["tamam", 0, 0, 1], "ikinci koşu bir şey silmez");
  assert.equal(await satirVar(a2.id), true);
  /* süresi dolunca 29 günlük de gider */
  await sahip.query("UPDATE dosya SET cop = now() - interval '30 days 1 minute' WHERE id = $1", [a2.id]);
  assert.equal((await geceIsleri(havuz, vt)).silinen, 1);
  assert.equal(await satirVar(a2.id), false);
  assert.equal(await nesneVar(a2.anahtar), false);
});

test("aynı iş aynı anda iki kez koşmaz; 1 saattir çalışıyor kalan iş takıldı olur; gece işi ikinci çağrıda zaten_calisiyor döner", async () => {
  const i1 = await isBasla(havuz, "deneme_isi");
  assert.ok(i1);
  assert.equal(await isBasla(havuz, "deneme_isi"), null, "ikinci koşu başlamaz");
  await isBitir(havuz, i1, "tamam", { sayi: 1 });
  const i2 = await isBasla(havuz, "deneme_isi");
  assert.ok(i2 && i2 !== i1);
  await isBitir(havuz, i2, "tamam", {});
  /* takılı iş: 2 saat önce başlamış "çalışıyor" */
  const eski = (await sahip.query<{ id: string }>("INSERT INTO is_calisma (ad, basladi) VALUES ('eski_is', now() - interval '2 hours') RETURNING id::text")).rows[0].id;
  const yeni = await isBasla(havuz, "eski_is");
  assert.ok(yeni);
  assert.equal((await sahip.query<{ durum: string }>("SELECT durum FROM is_calisma WHERE id = $1", [eski])).rows[0].durum, "takildi");
  /* takıldı sayılan iş sonradan bitirilemez (kayıt değişmez) */
  await isBitir(havuz, eski, "tamam", {});
  assert.equal((await sahip.query<{ durum: string }>("SELECT durum FROM is_calisma WHERE id = $1", [eski])).rows[0].durum, "takildi");
  /* çöp temizliği çalışırken ikinci çağrı */
  const calisan = await isBasla(havuz, "cop_temizligi");
  assert.ok(calisan);
  const o = await geceIsleri(havuz, vt);
  assert.equal(o.durum, "zaten_calisiyor");
  assert.equal(o.silinen, 0);
  await isBitir(havuz, calisan, "tamam", {});
  /* geçersiz ad / sonuç reddedilir */
  await assert.rejects(isBasla(havuz, "Kötü Ad"), /iş adı geçersiz/);
  await assert.rejects(isBitir(havuz, yeni, "calisiyor" as "tamam", {}), /iş sonucu geçersiz/);
});

test("GÜVENLİK: iş kaydına doğrudan erişim yok; silme işlevleri firmasız çağrılamaz; başka firmanın ve süresi dolmamış dosya silinmez; canlı nesne silinmez", async () => {
  await assert.rejects(havuz.query("SELECT * FROM is_calisma"), /permission denied|izin/i);
  await assert.rejects(havuz.query("INSERT INTO is_calisma (ad) VALUES ('sizma')"), /permission denied|izin/i);
  const b = await dosya(firma.B, 50), a = await dosya(firma.A, 5), canli = await dosya(firma.A, null);
  /* firmasız (kiracı işlemi dışında) */
  await assert.rejects(havuz.query("SELECT dosya_cop_sil($1)", [b.id]), /firma işleminde/);
  await assert.rejects(havuz.query("SELECT depo_nesne_sil($1)", [b.anahtar]), /firma işleminde/);
  /* A'nın işleminde B'nin süresi dolmuş dosyası: yok; A'nın 5 günlük çöpü: yok */
  const sil = (f: string, id: string) => kiraciIcinde(havuz, f, (db) => db.sorgu<{ s: string }>("SELECT dosya_cop_sil($1) AS s", [id])).then((r) => r.rows[0].s);
  assert.equal(await sil(firma.A, b.id), "yok");
  assert.equal(await sil(firma.A, a.id), "yok");
  assert.equal(await sil(firma.A, canli.id), "yok");
  assert.equal(await satirVar(b.id), true);
  /* depo nesnesi: dosya satırı varken (canlı ya da çöpte) silinmez; başka firmanın nesnesi silinmez */
  const nesneSil = (f: string, k: string) => kiraciIcinde(havuz, f, (db) => db.sorgu<{ s: boolean }>("SELECT depo_nesne_sil($1) AS s", [k])).then((r) => r.rows[0].s);
  assert.equal(await nesneSil(firma.A, canli.anahtar), false);
  assert.equal(await nesneSil(firma.B, b.anahtar), false, "çöpteki dosyanın satırı varken nesnesi silinmez");
  const oksuzB = dosyaAnahtari({ firmaId: firma.B, modul: "deneme", kayitId: randomUUID(), dosyaId: randomUUID() });
  await kiraciIcinde(havuz, firma.B, (db) => vt.yaz(oksuzB, PDF("öksüz"), db));
  assert.equal(await nesneSil(firma.A, oksuzB), false, "başka firmanın nesnesi");
  for (const s of [canli, b]) assert.equal(await nesneVar(s.anahtar), true);
  assert.equal(await nesneVar(oksuzB), true);
  /* uygulama rolünün doğrudan silme hakkı yok */
  await assert.rejects(kiraciIcinde(havuz, firma.A, (db) => db.sorgu("DELETE FROM dosya WHERE id = $1", [a.id])), /permission denied|izin/i);
  await assert.rejects(kiraciIcinde(havuz, firma.A, (db) => db.sorgu("DELETE FROM depo_nesne")), /permission denied|izin/i);
  /* işlevler tanımlayıcı-yetkili, arama yolu sabit, PUBLIC'e kapalı, yalnız uygulama rolüne açık (silme-kapsami.test ile aynı ölçü) */
  for (const islev of ["is_basla", "is_bitir", "gece_firmalari", "dosya_cop_sil", "depo_nesne_sil"]) {
    const r = (await sahip.query<{ guvenli: boolean; yol: boolean; herkes: boolean; uygulama: boolean }>(
      `SELECT p.prosecdef AS guvenli, coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS yol,
         EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE') AS herkes,
         has_function_privilege('probata_uygulama', p.oid, 'EXECUTE') AS uygulama
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = $1`, [islev])).rows;
    assert.equal(r.length, 1, `${islev} tek tanım`);
    assert.deepEqual(r[0], { guvenli: true, yol: true, herkes: false, uygulama: true }, islev);
  }
  assert.equal((await sahip.query<{ d: boolean }>("SELECT has_table_privilege('probata_uygulama', 'public.is_calisma', 'SELECT') AS d")).rows[0].d, false);
  /* firma listesi: yalnız etkin firmalar, yalnız kimlik */
  const liste = await geceFirmalari(havuz);
  assert.ok(liste.includes(firma.A) && liste.includes(firma.B) && !liste.includes(firma.C));
  /* temizlik: B'nin öksüzü sonraki testi etkilemesin diye ayrı sayılır (yalnız B) */
  const o = await kiraciIcinde(havuz, firma.B, (db) => copTemizle(db, vt));
  assert.equal(o.oksuz, 1, "öksüz nesne SAYILIR");
  assert.equal(await nesneVar(oksuzB), true, "öksüz nesne SİLİNMEZ");
});

test("klasör deposu: silinen dosyanın nesnesi klasörden de gider; sınır dolunca kalan sonraki koşuya; öksüz sayılmaz (null)", async () => {
  const kd = klasorDepo(klasor);
  const d1 = await dosya(firma.D, 35, kd), d2 = await dosya(firma.D, 33, kd), d3 = await dosya(firma.D, 31, kd);
  const yol = (k: string) => join(klasor, k);
  for (const s of [d1, d2, d3]) assert.ok(existsSync(yol(s.anahtar)));
  const r1 = await kiraciIcinde(havuz, firma.D, (db) => copTemizle(db, kd, 2));
  assert.deepEqual(r1, { silinen: 2, bayt: d1.boyut + d2.boyut, bagli: 0, kalan: true, oksuz: null }, "en eski önce, sınır kadar");
  assert.equal(existsSync(yol(d1.anahtar)), false);
  assert.equal(existsSync(yol(d2.anahtar)), false);
  assert.equal(existsSync(yol(d3.anahtar)), true);
  const r2 = await kiraciIcinde(havuz, firma.D, (db) => copTemizle(db, kd, 2));
  assert.deepEqual([r2.silinen, r2.kalan], [1, false]);
  assert.equal(existsSync(yol(d3.anahtar)), false);
  /* nesnesi zaten yoksa (önceki koşu sildi, satır kaldı) hata değil */
  const d4 = await dosya(firma.D, 40, kd);
  rmSync(yol(d4.anahtar));
  const r3 = await kiraciIcinde(havuz, firma.D, (db) => copTemizle(db, kd));
  assert.equal(r3.silinen, 1);
  assert.equal(await satirVar(d4.id), false);
});

test("bir firmada düşen iş ötekileri durdurmaz; iş 'hata' ile biter, görünür", async () => {
  const e1 = await dosya(firma.E, 31);
  /* bozuk depo: E'nin nesnesini silerken düşer */
  const bozuk: Depo = { ...vt, async copSil(anahtar, db) { if (anahtar.includes(firma.E)) throw new Error("depo erişilemedi"); return vt.copSil(anahtar, db); } };
  const a = await dosya(firma.A, 32);
  const o = await geceIsleri(havuz, bozuk);
  assert.equal(o.durum, "hata");
  assert.equal(o.hatali_firma, 1);
  assert.equal(await satirVar(a.id), false, "öteki firma temizlendi");
  assert.equal(await satirVar(e1.id), true, "düşen firmanın işlemi geri alındı (satır yerinde)");
  assert.equal(await nesneVar(e1.anahtar), true);
  const k = (await sahip.query<{ durum: string }>("SELECT durum FROM is_calisma WHERE ad = 'cop_temizligi' ORDER BY basladi DESC LIMIT 1")).rows[0];
  assert.equal(k.durum, "hata");
  /* depo düzelince sonraki koşu temizler */
  assert.equal((await geceIsleri(havuz, vt)).durum, "tamam");
  assert.equal(await satirVar(e1.id), false);
});
