/* OLUMSUZ KANIT — tests/yonetim.test.ts (348) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): giris.ts bellekte bozulup geçici klasörden
   içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir); göçler geçici klasöre kopyalanıp bellekte bozulur.
   1. Yeniden oynatma denetimi kalkınca (son kabul edilen adım yok sayılır) ele geçirilen bir kod aynı adımda ikinci kez geçer.
   2. Dondurma bayrağı firma_bul'dan kalkınca dondurulmuş firmanın alt alan adı yine açılır (kullanıcı ve müşteri girer).
   3. Hesap kilidi kalkınca kilitli yöneticiye doğru parolayla girilir (parola tahmini sınırsız). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { sifrele } from "../../src/server/ayar/sir.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, type Havuz } from "../../src/server/db/kiraci.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { totpKodu, yeniAnahtar, zamanAdimi } from "../../src/server/yonetim/totp.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri } from "../yardimci/supabase.ts";

type Giris = typeof import("../../src/server/yonetim/giris.ts");
const KOK = resolve("src/server/yonetim");
const KAYNAK = readFileSync(join(KOK, "giris.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "yonetim-bozan-"));
let sira = 0;
async function bozukGiris(eski: string, yeni: string): Promise<Giris> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `g${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
/** göçlerin kopyası; 0050'de `eski` → `yeni` */
function bozukGocler(ad: string, eski: string, yeni: string): string {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const d of readdirSync(GOC_KLASORU)) {
    if (!d.endsWith(".sql")) continue;
    if (d.startsWith("0050_")) {
      const k = readFileSync(join(GOC_KLASORU, d), "utf8");
      assert.ok(k.includes(eski), `bozulacak satır göçte yok: ${eski}`);
      writeFileSync(join(klasor, d), k.replace(eski, () => yeni));
    } else copyFileSync(join(GOC_KLASORU, d), join(klasor, d));
  }
  return klasor;
}

const ANAHTAR = yeniAnahtar();
const PAROLA = "yonetim-parola-2026";
const T0 = new Date("2026-10-06T10:00:00Z");
let kume: GomuluKume, havuz: Havuz, Y: string;

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    Y = (await s.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('y@probata.example', 'Deneme', $1) RETURNING id::text", [await parolaOzeti(PAROLA)])).rows[0].id;
    await s.query("UPDATE yonetici SET totp_sir = $2, durum = 'etkin' WHERE id = $1", [Y, sifrele(ANAHTAR, "yonetim", `totp:${Y}`)]);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1. yeniden oynatma denetimi kalkınca aynı kod ikinci kez geçer (kilidin koruduğu açık)", async () => {
  const g = await bozukGiris("const adim = totpDogrula(coz(sir, BAG, sirAdi(y.id)), g.kod, simdi, Number(y.totp_son));",
    "const adim = totpDogrula(coz(sir, BAG, sirAdi(y.id)), g.kod, simdi, 0);");
  const kod = totpKodu(ANAHTAR, zamanAdimi(T0));
  for (let i = 0; i < 2; i++) {
    const p = await g.yoneticiGiris(havuz, { eposta: "y@probata.example", parola: PAROLA, ip: "10.0.0.1", simdi: T0 });
    assert.ok(p.tamam);
    if (!p.tamam) return;
    assert.equal((await g.kodDogrula(havuz, { belirtec: p.belirtec, kod, ip: "10.0.0.1", simdi: T0 })).tamam, true, `bozuk: aynı kod ${i + 1}. kez geçti`);
  }
});

test("2. dondurma bayrağı firma_bul'dan kalkınca dondurulmuş firma yine açılır (kilidin koruduğu açık)", async () => {
  const klasor = bozukGocler("g2", "AS $$ SELECT id FROM firma WHERE kisa_ad = p_kisa_ad AND durum = 'etkin' $$;", "AS $$ SELECT id FROM firma WHERE kisa_ad = p_kisa_ad $$;");
  const supa = await supabaseBenzeri(kume, "yonetim_bozuk_2", klasor);
  const h = havuzKur({ ...kume.uygulama, database: "yonetim_bozuk_2" });
  try {
    const id = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu, durum) VALUES ('dondu', 'Dondu', 'DN', 'dondu') RETURNING id::text")).rows[0].id;
    assert.equal(await firmaKimligi(h, "dondu"), id, "bozuk: dondurulmuş firma bulundu");
  } finally { await h.end(); await supa.kapat(); }
});

test("3. hesap kilidi kalkınca 5 hatalı denemeden sonra da doğru parola geçer — parola tahmini sınırsız (kilidin koruduğu açık)", async () => {
  const g = await bozukGiris("    if (y?.kilit_bitis && y.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: \"kilitli\" }; }\n", "");
  for (let i = 0; i < 5; i++) await g.yoneticiGiris(havuz, { eposta: "y@probata.example", parola: `yanlis-${i}-parola`, ip: `10.1.0.${i}`, simdi: T0 });
  const r = await g.yoneticiGiris(havuz, { eposta: "y@probata.example", parola: PAROLA, ip: "10.1.1.1", simdi: new Date(T0.getTime() + 60_000) });
  assert.equal(r.tamam, true, "bozuk: kilitli hesaba doğru parolayla girildi");
});
