/* NEREDEN GELDİ: 350 — 09-G5 duman testi ("veritabanı bağlantısı, RLS açık mı …"). GERÇEK PostgreSQL: göçleri uygulanmış veritabanında bütün denetimler
   doğru; firma_id taşıyan RLS'siz, zorlanmamış ya da politikasız bir tablo eklenince yakalanır; Supabase taklidinde API rolleri şemaya giremez,
   girebilir olunca yakalanır; uygulama rolü şema bilgisini (goc) doğrudan okuyamaz, yalnız işlevle sayıları alır. 354 (350–351 incelemesi): göç sayısı
   dosyalarla aynı; BAĞLANAN rol ölçülür (sahip / ayrıcalıklı rolle bağlanılınca "ayrıcalıklı"); service_role da sayılır. 383: 1 saatten uzun
   "çalışıyor"da kalan arka plan işi sorun (0072 is_denetimi). Olumsuz kanıt: tests/bozan/saglik.bozan.ts, tests/bozan/is-saglik.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { havuzKur, type Havuz } from "../src/server/db/kiraci.ts";
import { saglikOku } from "../src/server/db/saglik.ts";
import { SON_GOC } from "../src/server/db/son-goc.ts";
import { saglikDegerlendir } from "../src/server/saglik.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "./yardimci/supabase.ts";

let kume: GomuluKume, havuz: Havuz;
before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("göçleri uygulanmış veritabanı: bütün denetimler doğru; uygulama rolü şemayı doğrudan okuyamaz", async () => {
  const v = await saglikOku(havuz);
  assert.equal(v.son_goc, SON_GOC);
  assert.equal(Number(v.goc_sayisi), gocDosyalari().length);
  assert.ok(v.kiraci_tablo >= 30, `kiracı tablosu: ${v.kiraci_tablo}`);
  assert.deepEqual({ rls_eksik: v.rls_eksik, politikasiz: v.politikasiz, uygulama_ayricalikli: v.uygulama_ayricalikli }, { rls_eksik: 0, politikasiz: 0, uygulama_ayricalikli: false });
  assert.equal(saglikDegerlendir(v).durum, "tamam");
  await assert.rejects(havuz.query("SELECT * FROM goc"), /permission denied/);
});

/* 383 (09-G5 "takılı arka plan işi"): 1 saatten uzun "çalışıyor"da kalan iş sağlıkta sorun; yeni başlamış iş sorun değil; bitince düzelir */
test("takılı arka plan işi sağlıkta görünür; yeni başlayan iş görünmez", async () => {
  const s = kume.sahipIstemci(); await s.connect();
  try {
    assert.equal(Number((await saglikOku(havuz)).takili_is), 0);
    await s.query("INSERT INTO is_calisma (ad) VALUES ('yeni_is')");
    assert.equal(Number((await saglikOku(havuz)).takili_is), 0, "yeni başlayan iş takılı değil");
    const id = (await s.query<{ id: string }>("INSERT INTO is_calisma (ad, basladi) VALUES ('asili_is', now() - interval '2 hours') RETURNING id::text")).rows[0].id;
    const v = await saglikOku(havuz);
    assert.equal(Number(v.takili_is), 1);
    assert.deepEqual([saglikDegerlendir(v).denetimler.isler, saglikDegerlendir(v).durum], [false, "sorun"]);
    await s.query("UPDATE is_calisma SET durum = 'takildi', bitti = now() WHERE id = $1", [id]);
    assert.equal(Number((await saglikOku(havuz)).takili_is), 0, "takıldı sayılan iş artık çalışmıyor");
    await s.query("DELETE FROM is_calisma WHERE ad IN ('yeni_is', 'asili_is')");
  } finally { await s.end(); }
});

test("RLS'siz, zorlanmamış ya da politikasız kiracı tablosu yakalanır", async () => {
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("CREATE TABLE sizinti_deneme (id int, firma_id uuid)");
    let v = await saglikOku(havuz);
    assert.deepEqual([v.rls_eksik, v.politikasiz], [1, 1]);
    await s.query("ALTER TABLE sizinti_deneme ENABLE ROW LEVEL SECURITY");
    v = await saglikOku(havuz);
    assert.equal(v.rls_eksik, 1, "açık ama zorlanmamış");
    await s.query("ALTER TABLE sizinti_deneme FORCE ROW LEVEL SECURITY");
    v = await saglikOku(havuz);
    assert.deepEqual([v.rls_eksik, v.politikasiz], [0, 1], "politikasız");
    assert.equal(saglikDegerlendir(v).denetimler.rls, false);
  } finally { await s.query("DROP TABLE IF EXISTS sizinti_deneme"); await s.end(); }
});

test("Supabase taklidi: API rolleri şemaya giremez; girebilir olunca yakalanır", async () => {
  let supa: SupabaseBenzeri | undefined;
  const h = havuzKur({ ...kume.uygulama, database: "saglik_supa" });
  try {
    supa = await supabaseBenzeri(kume, "saglik_supa");
    assert.equal((await saglikOku(h)).api_sema, false);
    await supa.sahip.query("GRANT USAGE ON SCHEMA public TO anon");
    assert.equal((await saglikOku(h)).api_sema, true);
    assert.equal(saglikDegerlendir(await saglikOku(h)).denetimler.api_kapali, false);
  } finally { await h.end(); await supa?.kapat(); }
});

test("bağlanan rol ölçülür: uygulama rolü kısıtlı; ayrıcalıklı rolle (sahip) bağlanılınca ayrıcalıklı", async () => {
  assert.equal((await saglikOku(havuz)).uygulama_ayricalikli, false);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    const v = (await s.query<{ s: { uygulama_ayricalikli: boolean } }>("SELECT saglik_denetimi() AS s")).rows[0].s;
    assert.equal(v.uygulama_ayricalikli, true, "uygulama postgres / sahip ile bağlansa 'kısıtlı' denmez");
  } finally { await s.end(); }
});

test("Supabase taklidi: service_role şemaya girebilirse de yakalanır", async () => {
  let supa: SupabaseBenzeri | undefined;
  const h = havuzKur({ ...kume.uygulama, database: "saglik_supa_sr" });
  try {
    supa = await supabaseBenzeri(kume, "saglik_supa_sr");
    assert.equal((await saglikOku(h)).api_sema, false);
    await supa.sahip.query("GRANT USAGE ON SCHEMA public TO service_role");
    assert.equal((await saglikOku(h)).api_sema, true);
  } finally { await h.end(); await supa?.kapat(); }
});
