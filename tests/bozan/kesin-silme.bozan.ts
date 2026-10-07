/* OLUMSUZ KANIT — tests/kesin-silme.test.ts ve tests/silme-kapsami.test.ts (357) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler
   geçici klasöre kopyalanır, 0054 bellekte bozulur (Supabase taklidinde — göçü süper kullanıcı olmayan sahip koşar):
   1. kullanım işlevinden raporun cihaz listesi denetimi kalkınca rapora girmiş cihaz kesin silinir (raporun kanıtı yetim kalır).
   2. silme işlevinde firma süzgeci kalkınca B firması A'nın cihazını "silindi" sayar (izi B'ye yazılır; tanımlayıcı-yetkili işlev RLS'yi aşar).
   3. uygulama rolüne DELETE hakkı verilince işlevsiz silme açılır — kapsam kilidinin denetimi yakalar.
   4. yeni bir tablo cihaza yabancı anahtarla bağlanıp silici.ts güncellenmezse kapsam kilidinin katalog sorgusu yeni bağı görür.
   5. (359) cihaz türü silinirken ekipman türlerinin cihaz listesinden çıkarma kalkınca silinen tür ekipman türünde kalır (rapor doldurulamayan cihaz
      satırı ister, onaya gönderi kalıcı takılır).
   6. (360) ekipman kullanımından tamamlanmış plan denetimi kalkınca kapanmış bir işin ekipmanı silinir (plan kaydı eksik kalır). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { cihazKaydet, cihazSil, cihazTuruKaydet, cihazTuruSil, type Kisi } from "../../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { ekipmanSil } from "../../src/modules/planlar/server/plan-ici.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { SILINEBILIR } from "../../src/server/db/silici.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { sahaFirmasi } from "../yardimci/saha-firma.ts";
import { supabaseBenzeri } from "../yardimci/supabase.ts";

const RAPOR = "    'rapor', NULLIF((SELECT count(*) FROM rapor r WHERE r.firma_id = c.firma_id AND position(c.id::text IN r.cihazlar::text) > 0), 0),\n";
const FIRMA = "SELECT * INTO c FROM olcum_cihazi WHERE id = p_id AND firma_id = f FOR UPDATE;";
const gecici = mkdtempSync(join(tmpdir(), "kesin-silme-bozan-"));
const depo = klasorDepo(join(gecici, "depo"));
let kume: GomuluKume;
let sira = 0;

/** göçlerin kopyası; `dosya` (varsayılan 0054) `bozan` ile değişir; `ek` verilirse sona ek göç */
function gocler(bozan: (k: string) => string, ek?: string, dosya = "0054_"): string {
  const klasor = join(gecici, `gocler-${++sira}`);
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith(dosya)) writeFileSync(join(klasor, ad), bozan(readFileSync(join(GOC_KLASORU, ad), "utf8")));
    else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  if (ek) writeFileSync(join(klasor, "9999_bozan.sql"), ek);
  return klasor;
}
const degistir = (eski: string, yeni: string) => (k: string) => { assert.ok(k.includes(eski), `bozulacak satır göçte yok: ${eski.slice(0, 60)}`); return k.replace(eski, () => yeni); };
const C = { tur: "yeni", yeniTur: "Topraklama ölçer", marka: "Deneme", model: "M1", seri: "S1", aralik: "0–2 kΩ" };

before(async () => { kume = await testKumesi(); });
after(async () => { await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1. rapor denetimi kalkınca rapora girmiş cihaz silinir (kilidin koruduğu açık)", async () => {
  const supa = await supabaseBenzeri(kume, "silme_bozuk_1", gocler(degistir(RAPOR, "")));
  const h = havuzKur({ ...kume.uygulama, database: "silme_bozuk_1" });
  try {
    const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    const F = await sahaFirmasi(h, depo, A, "deneme-a");
    const id = (await kiraciIcinde(h, A, (db) => cihazKaydet(db, F.yon as Kisi, null, 0, { ...C, kod: "BZ-R" }), { hesapId: F.yon.id }) as { id: string }).id;
    await kiraciIcinde(h, A, (db) => db.sorgu("UPDATE rapor SET cihazlar = $1::jsonb WHERE id = $2", [JSON.stringify([{ tur: "x", cihaz: id }]), F.rapor]), { hesapId: F.den1.id });
    assert.equal((await kiraciIcinde(h, A, (db) => cihazSil(db, F.yon as Kisi, id), { hesapId: F.yon.id })).durum, "tamam", "bozuk: rapordaki cihaz silindi");
  } finally { await h.end(); await supa.kapat(); }
});

test("2. firma süzgeci kalkınca B, A'nın cihazını silindi sayar (kilidin koruduğu açık)", async () => {
  const supa = await supabaseBenzeri(kume, "silme_bozuk_2", gocler(degistir(FIRMA, "SELECT * INTO c FROM olcum_cihazi WHERE id = p_id FOR UPDATE;")));
  const h = havuzKur({ ...kume.uygulama, database: "silme_bozuk_2" });
  try {
    const [A, B] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
    const hesap = async (f: string, e: string) => (await kiraciIcinde(h, f, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [e]))).rows[0].id;
    const ya: Kisi = { id: await hesap(A, "yon@deneme-a.example"), ad: "Deneme", roller: ["firma_yoneticisi"] };
    const yb: Kisi = { id: await hesap(B, "yon@deneme-b.example"), ad: "Deneme", roller: ["firma_yoneticisi"] };
    const id = (await kiraciIcinde(h, A, (db) => cihazKaydet(db, ya, null, 0, { ...C, kod: "BZ-F" }), { hesapId: ya.id }) as { id: string }).id;
    assert.equal((await kiraciIcinde(h, B, (db) => cihazSil(db, yb, id), { hesapId: yb.id })).durum, "tamam", "bozuk: B, A'nın cihazını sildi sayıldı");
  } finally { await h.end(); await supa.kapat(); }
});

test("3–4. DELETE hakkı ve yeni yabancı anahtar kapsam kilidinin sorgusuna yakalanır (kilidin koruduğu açık)", async () => {
  const ek = `GRANT DELETE ON olcum_cihazi TO probata_uygulama;
CREATE TABLE deneme_bag (id uuid PRIMARY KEY, firma_id uuid NOT NULL, cihaz_id uuid, FOREIGN KEY (firma_id, cihaz_id) REFERENCES olcum_cihazi (firma_id, id));`;
  const supa = await supabaseBenzeri(kume, "silme_bozuk_3", gocler((k) => k, ek));
  try {
    assert.equal((await supa.sahip.query<{ d: boolean }>("SELECT has_table_privilege('probata_uygulama', 'public.olcum_cihazi', 'DELETE') AS d")).rows[0].d, true, "bozuk: DELETE hakkı var");
    const bag = (await supa.sahip.query<{ b: string }>(
      `SELECT DISTINCT cl.relname || '.' || a.attname AS b FROM pg_constraint k JOIN pg_class cl ON cl.oid = k.conrelid
         JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)
       WHERE k.contype = 'f' AND k.confrelid = 'public.olcum_cihazi'::regclass AND a.attname <> 'firma_id'`)).rows.map((r) => r.b).sort();
    const t = SILINEBILIR.olcum_cihazi;
    assert.notDeepEqual(bag, [...t.fk.kullanim, ...t.fk.birlikte].sort(), "bozuk: yeni bağ listede yok");
    assert.ok(bag.includes("deneme_bag.cihaz_id"));
  } finally { await supa.kapat(); }
});

test("5. tür silinirken ekipman türlerinden çıkarma kalkınca silinen tür ekipman türünde kalır (kilidin koruduğu açık)", async () => {
  const CIKAR = "      UPDATE ekipman_turu SET cihaz_turleri = array_remove(cihaz_turleri, p_id), surum = surum + 1, degisti = now() WHERE firma_id = f AND id = e.id;\n";
  const supa = await supabaseBenzeri(kume, "silme_bozuk_5", gocler(degistir(CIKAR, ""), undefined, "0055_"));
  const h = havuzKur({ ...kume.uygulama, database: "silme_bozuk_5" });
  try {
    const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    const t = await kiraciIcinde(h, A, async (db) => ({
      yon: (await db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text")).rows[0].id,
      et: (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id,
    }));
    const yon: Kisi = { id: t.yon, ad: "Deneme", roller: ["firma_yoneticisi"] };
    const ct = await kiraciIcinde(h, A, (db) => cihazTuruKaydet(db, yon, null, 0, { ad: "Bozan türü" }), { hesapId: t.yon }) as { id: string };
    await kiraciIcinde(h, A, (db) => db.sorgu("UPDATE ekipman_turu SET cihaz_turleri = ARRAY[$1::uuid] WHERE id = $2", [ct.id, t.et]), { hesapId: t.yon });
    assert.equal((await kiraciIcinde(h, A, (db) => cihazTuruSil(db, yon, ct.id), { hesapId: t.yon })).durum, "tamam");
    const kalan = (await supa.sahip.query<{ c: string[] }>("SELECT cihaz_turleri::text[] AS c FROM ekipman_turu WHERE id = $1", [t.et])).rows[0].c;
    assert.deepEqual(kalan, [ct.id], "bozuk: silinen tür ekipman türünde kaldı");
  } finally { await h.end(); await supa.kapat(); }
});

test("6. tamamlanmış plan denetimi kalkınca kapanmış işin ekipmanı silinir (kilidin koruduğu açık)", async () => {
  const TAM = "    'tamamlanmis_plan', NULLIF((SELECT count(*) FROM plan_ekipman pe JOIN plan p ON p.firma_id = pe.firma_id AND p.id = pe.plan_id";
  const supa = await supabaseBenzeri(kume, "silme_bozuk_6", gocler((k) => {
    assert.ok(k.includes(TAM), "bozulacak satır göçte yok");
    return k.replace(/    'tamamlanmis_plan'[\s\S]*?'tamamlandi'\), 0\)/, "    'tamamlanmis_plan', NULL::int");
  }, undefined, "0056_"));
  const h = havuzKur({ ...kume.uygulama, database: "silme_bozuk_6" });
  try {
    const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    const F = await sahaFirmasi(h, depo, A, "deneme-a");
    const z = await kiraciIcinde(h, A, async (db) => {
      const id = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-TAM', 'Deneme') RETURNING id::text", [F.tesis, F.tur])).rows[0].id;
      await db.sorgu("INSERT INTO plan_ekipman (plan_id, ekipman_id, ekleyen) VALUES ($1, $2, 'Deneme')", [F.planId, id]);
      return id;
    }, { hesapId: F.yon.id });
    await supa.sahip.query("SET session_replication_role = replica");
    await supa.sahip.query("UPDATE plan SET durum = 'tamamlandi', kontrol_tamam = now(), bitti = now() WHERE id = $1", [F.planId]);
    assert.equal((await kiraciIcinde(h, A, (db) => ekipmanSil(db, F.yon, F.planId, z), { hesapId: F.yon.id })).durum, "tamam", "bozuk: tamamlanmış plandaki ekipman silindi");
  } finally { await h.end(); await supa.kapat(); }
});
