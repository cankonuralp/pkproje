/* OLUMSUZ KANIT — tests/foto-oku.test.ts (351) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): foto-oku.ts bellekte bozulup geçici klasörden
   içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir); 0052 göçü geçici kopyada bozulur.
   1. Aylık sınır denetimi kalkınca sınırı dolmuş kişi okumaya devam eder (firmanın Anthropic hesabından sınırsız harcama).
   2. Tetikteki hesap damgası kalkınca kişi kullanımı başkasının hanesine yazar (sınırı başkasına yükler). (Tetiğin tanımı 0053; 2026-10-08 (380) 0071
      tetiği mesaj sayacıyla yeniden tanımlıyor — bozma ikisinde birden, yoksa 0071 düzgün hâli geri kurar.)
   3. (354) Ayırmadaki satır kilidi (FOR UPDATE) kalkınca eşzamanlı ikinci okuma birincinin ayırmasını görmez, sınır aşılır. kullanim.ts bellekte bozulur. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { planKabul, planIci } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../../src/modules/rapor-format/server/formatlar.ts";
import { raporOlustur } from "../../src/modules/raporlar/server/raporlar.ts";
import { ayarOku, ayarYaz } from "../../src/server/ayar/ayar.ts";
import { sirYaz } from "../../src/server/ayar/sir.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { yzAyi } from "../../src/server/yz/kullanim.ts";
import { enCokMaliyet } from "../../src/server/yz/okuma.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri } from "../yardimci/supabase.ts";

type Modul = typeof import("../../src/modules/raporlar/server/foto-oku.ts");
type KullanimModulu = typeof import("../../src/server/yz/kullanim.ts");
/** kaynak dosya, göreli içe aktarmaları mutlak yola çevrilmiş */
const kaynak = (kok: string, ad: string) => readFileSync(join(kok, ad), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
const KAYNAK = kaynak(resolve("src/modules/raporlar/server"), "foto-oku.ts");
const KULLANIM = kaynak(resolve("src/server/yz"), "kullanim.ts");
const gecici = mkdtempSync(join(tmpdir(), "foto-oku-bozan-"));
const depo = klasorDepo(join(gecici, "depo"));
let sira = 0;
async function bozukYaz<T>(metin: string, eski: string, yeni: string): Promise<T> {
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `b${++sira}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const bozuk = (eski: string, yeni: string) => bozukYaz<Modul>(KAYNAK, eski, yeni);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
/* en küçük yapısı doğru JPEG: SOI · DQT · SOS (kalanı görüntü) · EOI */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 3, 1, 0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9]);

let kume: GomuluKume, havuz: Havuz, A: string, den1: Kisi, yon: Kisi, rapor: string;
before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id; } finally { await s.end(); }
  const f = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', 'iletisim@deneme-a.example', '0312 000 00 00') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "2".repeat(26)]);
    const per = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Bir', '2024-01-01', 'elk-muh', '123') RETURNING id::text");
    const per2 = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme İki', '2024-01-01', 'elk-muh', '124') RETURNING id::text");
    const h = (e: string, r: string, p: string | null) => q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [e, [r], p]);
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    const ekp = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-A1', 'x') RETURNING id::text", [tesis, tur]);
    return { tesis, tur, ekp, per, d1: await h("den1@deneme-a.example", "denetci", per), d2: await h("den2@deneme-a.example", "denetci", per2),
      p: await h("plan@deneme-a.example", "planlama", null), y: await h("yon@deneme-a.example", "firma_yoneticisi", null) };
  });
  den1 = kisi(f.d1, "denetci"); yon = kisi(f.y, "firma_yoneticisi");
  const planci = kisi(f.p, "planlama");
  await kiraciIcinde(havuz, A, async (db) => { const t = tamam(await taslakBaslat(db, yon, f.tur, "sablon:ZPKR02", null)); tamam(await yayinla(db, yon, t.id, t.surum, "")); }, { hesapId: yon.id });
  const bugun = bugunTr();
  const plan = tamam(await kiraciIcinde(havuz, A, (db) => planAc(db, depo, planci, A, { tesis: f.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: f.per, isgNo: "ISG-1", kaydet: false }] }), { hesapId: planci.id })).id;
  const v = (await kiraciIcinde(havuz, A, (db) => planIci(db, den1, plan), { hesapId: den1.id }))!;
  tamam(await kiraciIcinde(havuz, A, (db) => planKabul(db, den1, plan, v.surum, true), { hesapId: den1.id }));
  rapor = tamam(await kiraciIcinde(havuz, A, (db) => raporOlustur(db, den1, plan, f.ekp), { hesapId: den1.id })).id;
  await kiraciIcinde(havuz, A, async (db) => {
    const m = await ayarOku(db, "yapay_zeka");
    tamam(await ayarYaz(db, "yapay_zeka", m.surum, { ...m.deger, acik: true, sinir: 1 }, { kim: "Deneme", ne: "ayar.yapay_zeka" }));
    await sirYaz(db, "yapay_zeka_anahtari", "sk-ant-deneme-anahtar-0123456789", { kim: "Deneme" });
  }, { hesapId: yon.id });
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1. aylık sınır denetimi kalkınca sınırı dolmuş kişi okumaya devam eder (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (!(await yzAyir(db, ay, yz.sinir, ust))) {", "  if (false) {");
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO yz_kullanim (ay, okuma, maliyet) VALUES ($1, 9, 5000000)", [yzAyi()]), { hesapId: den1.id });
  const h = await kiraciIcinde(havuz, A, (db) => m.fotoOkuHazirla(db, depo, den1, rapor, "linye", { bayt: JPEG }), { hesapId: den1.id });
  assert.equal(h.durum, "hazir", "bozuk: 5 $ harcamış kişi (sınır 1 $) yine okuyor");
});

test("2. tetikteki hesap damgası kalkınca kullanım başkasının hanesine yazılır (kilidin koruduğu açık)", async () => {
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  const ESKI = "    NEW.hesap_id := ben;\n";
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0053_") || ad.startsWith("0071_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(ESKI), "bozulacak satır göçte yok");
      writeFileSync(join(klasor, ad), k.replace(ESKI, () => ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  const supa = await supabaseBenzeri(kume, "foto_oku_bozuk", klasor);
  const h = havuzKur({ ...kume.uygulama, database: "foto_oku_bozuk" });
  try {
    const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
    const f = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('hedef', 'Hedef', 'HD') RETURNING id::text");
    const ben = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'ben@hedef.example', 'Deneme', '{denetci}', 'etkin') RETURNING id::text", [f]);
    const baska = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'baska@hedef.example', 'Deneme', '{denetci}', 'etkin') RETURNING id::text", [f]);
    await kiraciIcinde(h, f, (db) => db.sorgu("INSERT INTO yz_kullanim (hesap_id, ay, okuma, maliyet) VALUES ($1, '2026-01', 1, 5)", [baska]), { hesapId: ben });
    const r = (await supa.sahip.query<{ h: string }>("SELECT hesap_id::text AS h FROM yz_kullanim WHERE firma_id = $1", [f])).rows[0].h;
    assert.equal(r, baska, "bozuk: kullanım başkasının hanesine yazıldı");
  } finally { await h.end(); await supa.kapat(); }
});

test("3. ayırmadaki satır kilidi kalkınca eşzamanlı ikinci okuma sınırı aşar (kilidin koruduğu açık)", async () => {
  const m = await bozukYaz<KullanimModulu>(KULLANIM, " AND ay = $1 FOR UPDATE`", " AND ay = $1`");
  /* satır önceden var (ayın ilk okuması değil); sınır 0,3 $: ilk ayırma (0,36 $) sığar, ardından sınır dolu — doğru kodda ikinci okuma reddedilir */
  const ay = "2026-03", ust = enCokMaliyet("opus"), sinir = 0.3;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO yz_kullanim (ay) VALUES ($1)", [ay]), { hesapId: den1.id });
  let ayrildi!: () => void, birak!: () => void;
  const ayrildiSoz = new Promise<void>((c) => { ayrildi = c; }), kapi = new Promise<void>((c) => { birak = c; });
  const t1 = kiraciIcinde(havuz, A, async (db) => { const r = await m.yzAyir(db, ay, sinir, ust); ayrildi(); await kapi; return r; }, { hesapId: den1.id });
  await ayrildiSoz;
  const t2 = kiraciIcinde(havuz, A, (db) => m.yzAyir(db, ay, sinir, ust), { hesapId: den1.id });
  const s = kume.sahipIstemci(); await s.connect();
  try {
    for (let i = 0; i < 200; i++) {
      if ((await s.query<{ n: number }>("SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type = 'Lock'")).rows[0].n > 0) break;
      await new Promise((c) => setTimeout(c, 25));
    }
  } finally { await s.end(); }
  birak();
  assert.deepEqual(await Promise.all([t1, t2]), [true, true], "bozuk: ikinci okuma da ayrıldı, sınır aşıldı");
});
