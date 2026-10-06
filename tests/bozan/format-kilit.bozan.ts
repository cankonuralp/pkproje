/* OLUMSUZ KANIT — tests/rapor-format.test.ts "istemcinin kilit işareti yazılmadı" neyi koruyor (337–339 incelemesi). Kaynak diskte DEĞİŞTİRİLMEZ
   (anayasa 13.11): formatlar.ts bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir). Kilit düzeltmesi
   kalkınca elle hazırlanmış istekle firmanın kendi bölümü "kilit" işaretiyle kaydedilir; yayınlanınca o bölüm Bakanlık öğesi gibi kalıcı kilitlenir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/rapor-format/server/formatlar.ts");
const KOK = resolve("src/modules/rapor-format/server");
const KAYNAK = readFileSync(join(KOK, "formatlar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-kilit-bozan-"));
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, "f.ts");
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz, A: string, mek: string, tur: string;
before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("SET session_replication_role = replica");
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    mek = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'mek@deneme-a.example', 'Deneme', '{mekanik_yonetici}', 'etkin') RETURNING id::text", [A])).rows[0].id;
    tur = (await s.query<{ id: string }>("INSERT INTO ekipman_turu (firma_id, kod, ad, grup, brans, periyot) VALUES ($1, 'DT', 'Deneme tesisat', 'elektrik', 'e', 12) RETURNING id::text", [A])).rows[0].id;
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kilit düzeltmesi kalkınca istemcinin 'kilit' işareti firmanın kendi bölümüne yazılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  const tanim = kilitNormallestir(t.data, await kilitKaynaklari(db, r.tur_id, r.kaynak, id));\n", "  const tanim = t.data;\n");
  const MEK = { id: mek, ad: "Deneme", roller: ["mekanik_yonetici" as const] };
  const kayitli = await kiraciIcinde(havuz, A, async (db) => {
    const t = await m.taslakBaslat(db, MEK, tur, "sablon:ZPKR02", null);
    assert.equal(t.durum, "tamam", JSON.stringify(t));
    const x = t as { id: string; surum: number };
    const tanim = structuredClone(SABLONLAR.ZPKR02.tanim);
    tanim.bolumler.push({ id: "sahte", ad: "Sahte kilit", blok: "not", kilit: true, zorunlu: false });
    const k = await m.taslakKaydet(db, MEK, x.id, x.surum, tanim);
    assert.equal(k.durum, "tamam", JSON.stringify(k));
    return (await m.formatAyrintisi(db, MEK, x.id))!.tanim!;
  }, { hesapId: mek });
  assert.equal(kayitli.bolumler.find((b) => b.id === "sahte")?.kilit, true, "bozuk: istemcinin kilit işareti yazıldı");
});
