/* NEREDEN GELDİ: K2 Personel 4 (2026-10-04) — maket personel.html #/roller; reisim 32: "başlangıç olarak uygun ama admin istediği gibi rollerin
   yetkilerini değiştirebilmeli"; karar 32 "yönetici kendini kilitleyemesin"; reisim: "kaynak koddan rol değiştirme ... gibi şeylere dikkat et".
   GERÇEK PostgreSQL'de: yalnız firma yöneticisi kaydeder; bozuk / bilinmeyen değer önerilen düzene döner; sabit hücreler (yöneticinin Personel,
   Firma ayarları, Hareket kaydı) ezilemez; kaydedilen matris bir sonraki oturum okumasında canDo'yu değiştirir; firma A'nın matrisi B'yi etkilemez.
   Olumsuz kanıt: tests/bozan/rol-yetki.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { girisYap, oturumOku } from "../src/server/kimlik/oturum.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { canDo } from "../src/server/yetki/canDo.ts";
import { matrisKaydet, matrisOku, matrisTemizle } from "../src/server/yetki/matris.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: pg.Pool;
let A: string, B: string;
const P = "dogruParola1";
const yonetici = { id: "00000000-0000-4000-8000-000000000001", roller: ["firma_yoneticisi"] as const, ad: "Deneme Yönetici" };
const denetci = { id: "00000000-0000-4000-8000-000000000002", roller: ["denetci"] as const, ad: "Deneme Denetçi" };

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a','Deneme A','DA'),('deneme-b','Deneme B','DB') RETURNING id")).rows.map((r) => r.id);
  const oz = await parolaOzeti(P);
  for (const f of [A, B]) await s.query("INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum) VALUES ($1,'denetci@deneme.example','Deneme Denetçi',$2,'{denetci}','etkin')", [f, oz]);
  await s.end();
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("matrisTemizle: bilinmeyen modül atılır, bozuk satır önerilene döner, sabit hücre ezilemez", () => {
  const m = matrisTemizle({ "13": ["yok", "yok", "yok", "yok", "yok", "yok"], "2": ["yok", "yok", "yok", "yok", "yok", "yok"], "99": ["yaz"], "14": ["x"] });
  assert.deepEqual(m[13], ["yok", "yok", "yok", "yok", "yok", "yok"]);
  assert.equal(m[2][4], "yaz", "firma yöneticisinin Personel satırı sabit");
  assert.deepEqual(m[14], MATRIS_ONERI[14], "bozuk satır önerilen düzenden");
  assert.equal((m as Record<string, unknown>)["99"], undefined);
  assert.equal(matrisTemizle("saçma")[22][4], "yaz");
});

test("yalnız firma yöneticisi kaydeder; denetçi kendi yetkisini yükseltemez", async () => {
  const r = await kiraciIcinde(havuz, A, (db) => matrisKaydet(db, denetci, -1, { ...MATRIS_ONERI, 18: ["yaz", "yaz", "yaz", "yaz", "yaz", "yaz"] }));
  assert.deepEqual(r, { durum: "yetkisiz" });
  const { surum } = await kiraciIcinde(havuz, A, (db) => matrisOku(db));
  assert.equal(surum, -1, "hiçbir şey yazılmadı");
});

test("kaydedilen matris oturumla gelir ve canDo'yu değiştirir; firma B etkilenmez; sürüm kilidi", async () => {
  const yeni = { ...MATRIS_ONERI, 18: ["yok", "gor", "yok", "yok", "yaz", "yaz"] };
  const r = await kiraciIcinde(havuz, A, (db) => matrisKaydet(db, yonetici, -1, yeni));
  assert.equal(r.durum, "tamam");
  const eski = await kiraciIcinde(havuz, A, (db) => matrisKaydet(db, yonetici, -1, MATRIS_ONERI));
  assert.equal(eski.durum, "cakisma", "eski sürümle yazılamaz");
  for (const [f, gorur] of [[A, true], [B, false]] as const) {
    const g = await girisYap(havuz, f, { eposta: "denetci@deneme.example", parola: P, ip: "10.5.0.1" });
    assert.ok(g.tamam);
    if (!g.tamam) continue;
    const o = await oturumOku(havuz, f, g.belirtec);
    assert.equal(canDo(o, 18, "gor"), gorur, `firma ${f === A ? "A" : "B"}: denetçi Muhasebe'yi ${gorur ? "görür" : "görmez"}`);
    assert.equal(canDo(o, 18, "degistir"), false);
  }
});
