/* OLUMSUZ KANIT — tests/duyuru.test.ts ve tests/duyuru-ayristir.test.ts neyi koruyor (379, göç 0070). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   göçler geçici klasöre kopyalanır, 0070'teki üç denetim bellekte kaldırılır; ayristir.ts ve okuma.ts bellekte bozulup geçici klasörden içe aktarılır
   (göreli içe aktarmalar mutlak yola çevrilir). O zaman:
   1) gelecek tarih denetimi kalkınca yarından sonraki tarihli duyuru yazılır (liste başına "gelecekten" kayıt oturur);
   2) bağlantı denetimi kalkınca Bakanlık dışı / betik bağlantısı yazılır ve Ana sayfaya gider;
   3) kaynak başına sınır kalkınca sık duyuru yapan kaynak ötekileri listeden atar;
   4) ayrıştırıcının tarih sınırı kalkınca gelecek tarihli öğe listeye girer;
   5) "duyuru bulunamadı" denetimi kalkınca yapısı değişmiş sayfa sessizce "tamam" sayılır (Ana sayfa "alınamadı" demez). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { ornekSayfa } from "../../e2e/duyuru-ornek.ts";
import { duyuruListesi, duyuruYaz } from "../../src/server/db/duyuru.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { bosKapi, testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 gelecek tarih */ ["  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p) AS x(url text, baslik text, tarih date) WHERE x.tarih IS NULL OR x.tarih > current_date + 1) THEN\n    RAISE EXCEPTION 'duyurunun tarihi geçersiz' USING ERRCODE = '23514';\n  END IF;\n", ""],
  /* 2 bağlantı */ ["url     text PRIMARY KEY CHECK (length(url) <= 300 AND url ~ '^https://(www\\.csgb\\.gov\\.tr|isekipmanlari\\.csgb\\.gov\\.tr)/[A-Za-z0-9/._?=&%-]*$'),", "url     text PRIMARY KEY,"],
  /* 3 kaynak başına */ ["row_number() OVER (PARTITION BY d.kaynak ORDER BY d.tarih DESC, d.url)", "row_number() OVER (ORDER BY d.tarih DESC, d.url)"],
];
const VT = "duyuru_bozuk";
const BUGUN = new Date("2026-10-08T09:00:00Z");
const gecici = mkdtempSync(join(tmpdir(), "duyuru-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, sunucu: Server, uc = "", A = "";

/** kaynağı bellekte bozup geçici klasörden içe aktarır (göreli içe aktarmalar mutlak) */
async function bozukModul<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kok = resolve("src/server/duyuru");
  const k = readFileSync(join(kok, dosya), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`);
  const yol = join(gecici, `${dosya.replace(".ts", "")}-bozuk.ts`);
  writeFileSync(yol, k.replace(eski, yeni));
  return await import(pathToFileURL(yol).href) as T;
}

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0070_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-duyuru', 'Bozuk Duyuru', 'BD') RETURNING id::text")).rows[0].id;
  sunucu = createServer((istek, yanit) => {
    const yol = istek.url ?? "";
    const sayfa = yol === "/isggm/duyurular/" ? "<html><body>yeni tasarım</body></html>" : ornekSayfa(yol);
    yanit.writeHead(sayfa ? 200 : 404, { "content-type": "text/html; charset=utf-8" }).end(sayfa ?? "yok");
  });
  const kapi = await bosKapi();
  await new Promise<void>((coz) => sunucu.listen(kapi, "127.0.0.1", coz));
  uc = `http://127.0.0.1:${kapi}`;
});
after(async () => { sunucu?.close(); await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) gelecek tarih denetimi kalkınca yarından sonraki tarihli duyuru yazılır", async () => {
  assert.equal(await duyuruYaz(havuz, "isggm", [{ url: "https://www.csgb.gov.tr/isggm/duyurular/2099/", baslik: "Gelecekten duyuru", tarih: "2099-01-01" }]), 1,
    "bozuk: gelecek tarihli duyuru yazıldı");
});

test("2) bağlantı denetimi kalkınca betik / Bakanlık dışı bağlantı yazılır ve listeye gider", async () => {
  await duyuruYaz(havuz, "isgum", [{ url: "javascript:alert(document.cookie)", baslik: "Kötü bağlantı", tarih: "2026-09-01" }]);
  const l = await kiraciIcinde(havuz, A, (db) => duyuruListesi(db, 20));
  assert.ok(l.some((d) => d.url.startsWith("javascript:")), "bozuk: betik bağlantısı Ana sayfa listesinde");
});

test("3) kaynak başına sınır kalkınca sık duyuru yapan kaynak ötekileri atar", async () => {
  await duyuruYaz(havuz, "isekipman", [{ url: "https://isekipmanlari.csgb.gov.tr/detay.aspx?d=1", baslik: "Portal duyurusu", tarih: "2026-01-01" }]);
  await duyuruYaz(havuz, "isggm", [1, 2, 3].map((i) => ({ url: `https://www.csgb.gov.tr/isggm/duyurular/s${i}/`, baslik: `Sık duyuru ${i}`, tarih: `2026-09-0${i}` })));
  const l = await kiraciIcinde(havuz, A, (db) => duyuruListesi(db, 2));
  assert.ok(!l.some((d) => d.kaynak === "isekipman"), "bozuk: portal duyurusu listeden düştü");
});

test("4) ayrıştırıcının tarih sınırı kalkınca gelecek tarihli öğe listeye girer", async () => {
  const m = await bozukModul<typeof import("../../src/server/duyuru/ayristir.ts")>("ayristir.ts",
    "  if (t.getTime() > bugun.getTime() + 86_400_000) return null;\n", "");
  assert.equal(m.tarihDogrula(1, 1, 2099, BUGUN), "2099-01-01", "bozuk: gelecek tarih kabul edildi");
});

test("5) 'duyuru bulunamadı' denetimi kalkınca yapısı değişmiş sayfa sessizce 'tamam' sayılır", async () => {
  const m = await bozukModul<typeof import("../../src/server/duyuru/okuma.ts")>("okuma.ts",
    "      if (!liste.length) throw new Error(\"duyuru bulunamadı (sayfa yapısı değişmiş olabilir)\");\n", "");
  const o = await m.duyurulariOku(havuz, uc, BUGUN);
  assert.deepEqual([o.durum, o.hatali_kaynak], ["tamam", 0], "bozuk: yapısı değişen İSGGM sayfası okundu sayıldı, 'alınamadı' çıkmaz");
});
