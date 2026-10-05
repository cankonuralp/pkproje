/* OLUMSUZ KANIT — tests/raporlar.test.ts neyi koruyor (311). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası geçici klasöre
   kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0025'teki akış tetiği olmasaydı rapor doğrudan "onayda" açılır, onaydaki (gönderilmiş) raporun içeriği ve sonucu sessizce değişirdi.
   2. Sunucuda ENGEL 1 (plan günü) denetimi olmasaydı ileri tarihli plana rapor açılırdı (KOD-GECIS §9-1).
   3. Sunucuda cihaz eklerken kalibrasyon denetimi olmasaydı kalibrasyonu geçmiş cihaz rapora eklenirdi (ENGEL 2'nin ilk kapısı).
   4. (312) Fotoğraf / cihaz sayısı istemciden alınsaydı fotoğrafsız, cihazsız rapor onaya giderdi.
   5. (313) Sunucuda günlük süre (ENGEL 3) denetimi olmasaydı süre dolmuşken kopya ve yeni rapor açılırdı.
   6. (318) Raporlar listesinde kayıt kayıt görme süzgeci olmasaydı denetçi başka denetçinin raporunu listede görürdü. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { planKabul } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../../src/modules/rapor-format/server/formatlar.ts";
import { ayarYaz } from "../../src/server/ayar/ayar.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const AKIS = "CREATE OR REPLACE TRIGGER rapor_akis BEFORE INSERT OR UPDATE ON rapor FOR EACH ROW EXECUTE FUNCTION rapor_akis();";
const RAPORLAR = "src/modules/raporlar/server/raporlar.ts";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string;
const gecici = mkdtempSync(join(tmpdir(), "raporlar-bozan-"));
const depo = klasorDepo(join(gecici, "depo"));
/** bugünden n gün sonra, "YYYY-MM-DD" */
const gun = (n: number) => new Date(Date.parse(`${bugunTr()}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

let sira = 0;
async function bozukModul<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}

/** firmaya müşteri, tesis, tür (KOMPRESOR şablonundan yayında format), ekipman, denetçi (hesaplı) ve zimmetinde kalibrasyonu GEÇMİŞ bir cihaz;
    plan açılır (ekipte denetçi), denetçi kabul eder */
async function kur(h: Havuz, firma: string, baslangic: string) {
  const q = (sql: string, p: unknown[] = []) => kiraciIcinde(h, firma, async (db) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id);
  const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
  const tesis = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]);
  const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  const ekipman = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-1', 'x') RETURNING id::text", [tesis, tur]);
  const per = await q("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Bir', '2024-01-01', 'mak-muh') RETURNING id::text");
  const hesap = (eposta: string, rol: string, personel: string | null = null) =>
    q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, [rol], personel]);
  const den: Kisi = { id: await hesap("d@deneme.example", "denetci", per), ad: "Deneme", roller: ["denetci"] };
  const plan: Kisi = { id: await hesap("p@deneme.example", "planlama"), ad: "Deneme", roller: ["planlama"] };
  const yon: Kisi = { id: await hesap("y@deneme.example", "firma_yoneticisi"), ad: "Deneme", roller: ["firma_yoneticisi"] };
  const cihazTuru = await q("INSERT INTO cihaz_turu (ad) VALUES ('Manometre') RETURNING id::text");
  const cihaz = await q("INSERT INTO olcum_cihazi (kod, tur_id) VALUES ('MN-01', $1) RETURNING id::text", [cihazTuru]);
  await q("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, '2019-01-01', '2020-01-01', 'Deneme Lab', 'K-1', 'uygun') RETURNING id::text", [cihaz]);
  await q("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now()) RETURNING id::text", [cihaz, per]);
  const is = <T,>(k: Kisi, x: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(h, firma, x, { hesapId: k.id });
  const format = await is(yon, async (db) => {
    const t = await taslakBaslat(db, yon, tur, "sablon:KOMPRESOR", null);
    assert.ok(t.durum === "tamam", JSON.stringify(t));
    const y = await yayinla(db, yon, t.id, t.surum, "");
    assert.ok(y.durum === "tamam", JSON.stringify(y));
    return t.id;
  });
  const r = await is(plan, (db) => planAc(db, depo, plan, firma, { tesis, baslangic, bitis: baslangic, ekip: [{ personel: per }] }));
  assert.ok(r.durum === "tamam", JSON.stringify(r));
  const surum = (await is(den, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM plan WHERE id = $1", [r.id]))).rows[0].surum;
  const k = await is(den, (db) => planKabul(db, den, r.id, surum, true));
  assert.ok(k.durum === "tamam", JSON.stringify(k));
  return { den, id: r.id, ekipman, tur, per, format, cihazTuru, cihaz, is };
}

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0025_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(AKIS), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(AKIS, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "rapor_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "rapor_bozuk" });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("akış tetiği olmayınca rapor doğrudan 'onayda' açılır, onaydaki raporun içeriği ve sonucu değişir (kilidin koruduğu açık)", async () => {
  const k = await kur(havuz, A, bugunTr());
  const id = await kiraciIcinde(havuz, A, async (db) => (await db.sorgu<{ id: string }>(
    `INSERT INTO rapor (no, plan_id, ekipman_id, tur_id, format_id, personel_id, durum, kunye)
     VALUES ('DA-1010-001-abcde', $1, $2, $3, $4, $5, 'onayda', '{"firma_adi": "Deneme"}'::jsonb) RETURNING id::text`,
    [k.id, k.ekipman, k.tur, k.format, k.per])).rows[0].id);
  await kiraciIcinde(havuz, A, (db) => db.sorgu(`UPDATE rapor SET cevaplar = '{"sonuc": "uygun_degil"}'::jsonb, sonuc = 'uygun_degil' WHERE id = $1`, [id]));
  const r = (await supa.sahip.query<{ durum: string; sonuc: string }>("SELECT durum, sonuc FROM rapor WHERE id = $1", [id])).rows[0];
  assert.deepEqual([r.durum, r.sonuc], ["onayda", "uygun_degil"], "gönderilmiş raporun sonucu sessizce değişti");
});

/* 2–3: göçler BOZULMAMIŞ (tetikler yerinde) — kümenin kendi veritabanı; bozulan sunucu kodu */
let firmaSira = 0;
async function saglam(baslangic: string) {
  const s = kume.sahipIstemci(); await s.connect();
  const C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, 'Deneme C', 'DC') RETURNING id", [`deneme-c${firmaSira++}`])
    .finally(() => s.end())).rows[0].id;
  const h = havuzKur(kume.uygulama);
  return { h, ...(await kur(h, C, baslangic)) };
}
type Raporlar = typeof import("../../src/modules/raporlar/server/raporlar.ts");

test("sunucuda ENGEL 1 (plan günü) denetimi kalkınca ileri tarihli plana rapor açılır", async () => {
  const m = await bozukModul<Raporlar>(RAPORLAR, "if (plan.baslangic > bugun) {", "if (false) {");
  const { h, den, id, ekipman, is } = await saglam(gun(3));
  try {
    const r = await is(den, (db) => m.raporOlustur(db, den, id, ekipman));
    assert.equal(r.durum, "tamam", `ileri tarihli plana rapor açıldı: ${JSON.stringify(r)}`);
  } finally { await h.end(); }
});

test("sunucuda kalibrasyon denetimi kalkınca kalibrasyonu geçmiş cihaz rapora eklenir", async () => {
  const m = await bozukModul<Raporlar>(RAPORLAR, "if (kalibrasyonGecti(c.bitis, bugunTr())) return", "if (false) return");
  const { h, den, id, ekipman, cihazTuru, cihaz, is } = await saglam(bugunTr());
  try {
    const r = await is(den, (db) => m.raporOlustur(db, den, id, ekipman));
    assert.ok(r.durum === "tamam", JSON.stringify(r));
    const c = await is(den, (db) => m.cihazEkle(db, den, r.id, 0, cihazTuru, cihaz));
    assert.equal(c.durum, "tamam", `kalibrasyonu geçmiş cihaz eklendi: ${JSON.stringify(c)}`);
    const l = (await is(den, (db) => db.sorgu<{ c: { cihaz: string }[] }>("SELECT cihazlar AS c FROM rapor WHERE id = $1", [r.id]))).rows[0].c;
    assert.deepEqual(l.map((x) => x.cihaz), [cihaz]);
  } finally { await h.end(); }
});

/* 2026-10-05 (312): sunucu fotoğraf ve cihaz sayısını raporun KENDİ listesinden saymasaydı, istemcinin yazdığı sayı (foto: { foto: 1 }, cihaz: 1) ile
   fotoğrafsız ve cihazsız rapor onaya giderdi (ENGEL 5: fotoğraf en az 1; format cihaz bölümü). */
test("sunucu fotoğraf / cihaz sayısını kendi listesinden saymayınca istemcinin sayısıyla fotoğrafsız, cihazsız rapor onaya gider", async () => {
  const m = await bozukModul<Raporlar>(RAPORLAR,
    "  return { ...c, cihaz: r.cihazlar.length, foto: bolum, madde: Object.fromEntries(Object.entries(c.madde).map(([k, x]) => [k, { ...x, foto: madde[k] ?? 0 }])) };",
    "  void bolum; void madde; return c;");
  const { h, den, id, ekipman, is } = await saglam(bugunTr());
  try {
    const r = await is(den, (db) => m.raporOlustur(db, den, id, ekipman));
    assert.ok(r.durum === "tamam", JSON.stringify(r));
    const s = await is(den, (db) => m.sahaRaporu(db, den, r.id));
    const maddeler = Object.fromEntries(Object.keys(s!.cevaplar.madde).map((k) => [k, { c: "Uygun" }]));
    const dun = gun(-1);
    const girdi = {
      ekipman: { marka: "Deneme", model: "K-1", seri: "S-1", imal: "2015", konum: "Kazan dairesi", amac: null, bolum: null },
      tarih: { bas: `${dun}T09:00`, bit: `${dun}T10:00`, sonraki: null, takip: null, rapor: null },
      cevaplar: { alan: { marka: "Deneme K-1", imal: "2015", calisma: "10" }, madde: maddeler, deger: { hidro: "17", ventil: "10" }, sonuc: "uygun", yorum: "",
        foto: { foto: 1 }, cihaz: 1 },
    };
    const g = await is(den, (db) => m.onayaGonder(db, den, r.id, 0, girdi));
    assert.equal(g.durum, "tamam", `fotoğrafsız, cihazsız rapor gönderildi: ${JSON.stringify(g)}`);
  } finally { await h.end(); }
});

/* 2026-10-05 (313): sunucuda günlük süre (ENGEL 3; 212, AA2) denetimi olmasaydı mesai takibi açıkken, süre dolmuş denetçi kopya (ve yeni rapor) açardı. */
test("sunucuda günlük süre denetimi kalkınca süre dolmuşken kopya açılır", async () => {
  const m = await bozukModul<Raporlar>(RAPORLAR, "if ((await mesaiDurumu(db, personelId, bugun)).dolu)", "if (false)");
  const { h, den, id, ekipman, tur, is } = await saglam(bugunTr());
  try {
    await is(den, (db) => db.sorgu("UPDATE ekipman_turu SET sure = 60 WHERE id = $1", [tur]));
    const y = await is(den, (db) => ayarYaz(db, "mesai", -1, { acik: true, normal_dk: 60, mesai_dk: 0, yillik_fazla_saat: 0, gunluk_ust_dk: 660 }, { kim: "Deneme", ne: "ayar.mesai" }));
    assert.equal(y.durum, "tamam", JSON.stringify(y));
    const r = await is(den, (db) => m.raporOlustur(db, den, id, ekipman));
    assert.ok(r.durum === "tamam", JSON.stringify(r));
    const k = await is(den, (db) => m.raporKopyala(db, den, r.id, 0, { kod: "HT-2", konum: null }, null));
    assert.equal(k.durum, "tamam", `süre dolmuşken kopya açıldı: ${JSON.stringify(k)}`);
  } finally { await h.end(); }
});

test("sunucuda listenin görme süzgeci kalkınca denetçi başka denetçinin raporunu listede görür", async () => {
  const m = await bozukModul<Raporlar>(RAPORLAR, `.filter((r) => canDo(kim, MODUL, "gor", { sahip: r.hesapId, brans: r.brans }));`, ";");
  const { h, den, id, ekipman, is } = await saglam(bugunTr());
  try {
    const r = await is(den, (db) => m.raporOlustur(db, den, id, ekipman));
    assert.ok(r.durum === "tamam", JSON.stringify(r));
    const baska: Kisi = { id: (await is(den, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('d2@deneme.example', 'Deneme', '{denetci}', 'etkin') RETURNING id::text"))).rows[0].id, ad: "Deneme", roller: ["denetci"] };
    const l = await is(baska, (db) => m.raporListesi(db, baska));
    assert.ok(l?.some((x) => x.id === r.id), "başka denetçinin raporu listede");
  } finally { await h.end(); }
});
