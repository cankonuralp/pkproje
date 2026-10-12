/* OLUMSUZ KANIT — tests/say-chat-rapor.test.ts (525, göç 0086 rapor_oneri) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici
   klasöre kopyalanır, 0086'daki iki denetim bellekte kaldırılır. O zaman:
   1) politikadan kişi koşulu kalkınca raporu yazmayan (yönetici) yazanın bekleyen önerilerini okur — öneri kişiye özeldir;
   2) tetikten "öneri değişmez" kalkınca okunan değer sonradan değiştirilir (yapay zekânın okuduğu değer denetçiye başka gösterilir). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { planIci, planKabul } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../../src/modules/rapor-format/server/formatlar.ts";
import { raporOneriYaz, raporOnerileri } from "../../src/modules/raporlar/server/oneri.ts";
import { raporOlustur } from "../../src/modules/raporlar/server/raporlar.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 politika */ ["      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)\n", "      USING (firma_id = gecerli_firma())\n"],
  /* 2 değişmez */ ["  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'öneri değişmez' USING ERRCODE = '23514'; END IF;\n", "  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;\n"],
];
const VT = "say_chat_rapor_bozuk";
const gecici = mkdtempSync(join(tmpdir(), "say-chat-rapor-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, A = "", RAPOR = "";
const kisi = (id: string, rol: string): Kisi => ({ id, ad: "Deneme", roller: [rol] as Kisi["roller"] });
let ELK: Kisi, YON: Kisi;
const ile = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0086_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-scr', 'Bozuk Rapor', 'BR') RETURNING id::text")).rows.map((r) => r.id);
  const depo = klasorDepo(join(gecici, "depo"));
  const f = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', 'iletisim@boz-scr.example', '0312 000 00 00') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Deneme Tesis', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "5".repeat(26)]);
    const pe = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Elektrik Denetçi', '2024-01-01', 'elk-muh', '31') RETURNING id::text");
    const h = async (eposta: string, rol: string, per: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@boz-scr.example`, [rol], per]), rol);
    return { tesis, pe, pln: await h("pln", "planlama"), elk: await h("elk", "denetci", pe), yon: await h("yon", "firma_yoneticisi") };
  });
  ELK = f.elk; YON = f.yon;
  const e1 = await ile(YON, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EIT', 'Elektrik iç tesisatı', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const x = tamam(await taslakBaslat(db, YON, id, "sablon:ZPKR02", null));
    tamam(await yayinla(db, YON, x.id, x.surum, ""));
    return (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-21', 'x') RETURNING id::text", [f.tesis, id])).rows[0].id;
  });
  const g = bugunTr();
  const plan = tamam(await ile(f.pln, (db) => planAc(db, depo, f.pln, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.pe, isgNo: "ISG-1", kaydet: false }] }))).id;
  const v = (await ile(ELK, (db) => planIci(db, ELK, plan)))!;
  tamam(await ile(ELK, (db) => planKabul(db, ELK, plan, v.surum, true)));
  RAPOR = tamam(await ile(ELK, (db) => raporOlustur(db, ELK, plan, e1))).id;
  await ile(ELK, (db) => raporOneriYaz(db, ELK, RAPOR, "linye", "tablo", [{ degerler: { no: "F1" }, guven: "yuksek" }]));
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) politikadan kişi koşulu kalkınca yönetici yazanın bekleyen önerisini okur", async () => {
  assert.equal((await ile(YON, (db) => raporOnerileri(db, RAPOR))).length, 1, "bozuk: yönetici öneriyi gördü");
});

test("2) tetikten 'değişmez' kalkınca okunan değer sonradan değiştirilir", async () => {
  await ile(ELK, (db) => db.sorgu("UPDATE rapor_oneri SET okunan = '[]'::jsonb WHERE bolum = 'linye'"));
  assert.deepEqual((await ile(ELK, (db) => raporOnerileri(db, RAPOR))).find((o) => o.bolum === "linye")?.okunan, [], "bozuk: öneri değişti");
});
