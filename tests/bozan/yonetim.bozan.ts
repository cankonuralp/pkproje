/* OLUMSUZ KANIT — tests/yonetim.test.ts (348) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): giris.ts bellekte bozulup geçici klasörden
   içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir); göçler geçici klasöre kopyalanıp bellekte bozulur.
   1. Yeniden oynatma denetimi kalkınca (son kabul edilen adım yok sayılır) ele geçirilen bir kod aynı adımda ikinci kez geçer.
   2. Dondurma bayrağı firma_bul'dan kalkınca dondurulmuş firmanın alt alan adı yine açılır (kullanıcı ve müşteri girer).
   3. Hesap kilidi kalkınca kilitli yöneticiye doğru parolayla girilir (parola tahmini sınırsız).
   4. Parola adımı hatalı deneme sayacını sıfırlarsa "doğru parola → 4 yanlış kod" döngüsü kilide hiç takılmaz (kod kaba kuvvetle denenir).
   5. Kurulum eski oturumları düşürmezse kurulumdan önce açık kalmış bir oturum kurulumdan sonra geçerli olur.
   6. Dondurma müşteri oturumlarını silmezse dondurulmuş firmanın müşteri oturumu kalır.
   393 (göç 0075, iki adım ayarı; yukarıdakiler ayar AÇIKKEN):
   7. Giriş ayarı okumazsa iki adım açıkken parola tek başına yönetim oturumu açar (doğrulama kodu atlanır).
   8. yonetim_kim ayara bakmazsa iki adım açıkken anahtarı kurulmamış ("ilk") yönetici yönetim işlemi yapar. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { sifrele } from "../../src/server/ayar/sir.ts";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, yonetimIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
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
/** göçlerin kopyası; `dosya` (başlangıç 0050) göçünde `eski` → `yeni` */
function bozukGocler(ad: string, eski: string, yeni: string, dosya = "0050_"): string {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const d of readdirSync(GOC_KLASORU)) {
    if (!d.endsWith(".sql")) continue;
    if (d.startsWith(dosya)) {
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
    /* 393: iki adımlı akışın bozmaları ayar AÇIKKEN (başlangıç kapalı) */
    await s.query("UPDATE yonetim_ayar SET iki_adim = true");
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

test("4. parola adımı sayacı sıfırlarsa doğrulama kodu döngüyle sınırsız denenir (kilidin koruduğu açık)", async () => {
  const g = await bozukGiris("    /* önceki yarım kalmış parola oturumları düşer (aynı anda tek bekleyen adım) */\n",
    "    await db.sorgu(\"UPDATE yonetici SET hatali_deneme = 0, kilit_bitis = NULL WHERE id = $1\", [y.id]);\n    await db.sorgu(\"DELETE FROM yonetim_kilit WHERE ip = $1\", [ip]);\n");
  const t = new Date(T0.getTime() + 3600_000);
  const gecerli = [-1, 0, 1].map((d) => totpKodu(ANAHTAR, zamanAdimi(t) + d));
  const yanlis = ["123456", "654321", "111111"].find((x) => !gecerli.includes(x))!;
  for (let tur = 0; tur < 3; tur++) {
    const p = await g.yoneticiGiris(havuz, { eposta: "y@probata.example", parola: PAROLA, ip: "10.4.0.1", simdi: t });
    assert.ok(p.tamam, "bozuk: döngü sürüyor");
    if (!p.tamam) return;
    for (let i = 0; i < 4; i++) assert.equal((await g.kodDogrula(havuz, { belirtec: p.belirtec, kod: yanlis, ip: "10.4.0.1", simdi: t })).tamam, false);
  }
});

test("5. kurulum eski oturumları düşürmezse önceki oturum kurulumdan sonra geçerli (kilidin koruduğu açık)", async () => {
  const g = await bozukGiris("    await db.sorgu(\"DELETE FROM yonetim_oturum WHERE yonetici_id = $1\", [y.id]);\n", "");
  const s = kume.sahipIstemci(); await s.connect();
  const eski = randomBytes(32).toString("base64url");
  let id = "";
  try {
    id = (await s.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('ilk@probata.example', 'Deneme', $1) RETURNING id::text", [await parolaOzeti("gecici-parola-1")])).rows[0].id;
    await s.query("INSERT INTO yonetim_oturum (ozet, yonetici_id, adim, olustu, son_kullanim, bitis) VALUES ($1, $2, 'tamam', $3, $3, $4)",
      [createHash("sha256").update(eski, "utf8").digest("hex"), id, T0, new Date(T0.getTime() + 12 * 3600_000)]);
  } finally { await s.end(); }
  const p = await g.yoneticiGiris(havuz, { eposta: "ilk@probata.example", parola: "gecici-parola-1", ip: "10.5.0.1", simdi: T0 });
  assert.ok(p.tamam);
  if (!p.tamam) return;
  const k = await g.kurulumBilgisi(havuz, p.belirtec, T0);
  assert.ok(k);
  if (!k) return;
  assert.ok((await g.kurulumTamamla(havuz, { belirtec: p.belirtec, kod: totpKodu(k.anahtar, zamanAdimi(T0)), yeni: "yeni-parola-2026", ip: "10.5.0.1", simdi: T0 })).tamam);
  assert.equal((await g.yonetimOturumOku(havuz, eski, new Date(T0.getTime() + 60_000)))?.id, id, "bozuk: eski oturum kurulumdan sonra geçerli");
});

test("6. dondurma müşteri oturumlarını silmezse dondurulmuş firmanın müşteri oturumu kalır (kilidin koruduğu açık)", async () => {
  const klasor = bozukGocler("g6", "    DELETE FROM musteri_oturum WHERE firma_id = p_firma;\n", "");
  const supa = await supabaseBenzeri(kume, "yonetim_bozuk_6", klasor);
  const h = havuzKur({ ...kume.uygulama, database: "yonetim_bozuk_6" });
  try {
    const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0]?.id;
    const f = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('hedef', 'Hedef', 'HD') RETURNING id::text");
    const m = await q("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Müşteri A.Ş.', 'Deneme') RETURNING id::text", [f]);
    const mh = await q("INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum) VALUES ($1, $2, true, 'm@hedef.example', 'Deneme', $3, 'etkin') RETURNING id::text",
      [f, m, await parolaOzeti("musteri-parola-1")]);
    await supa.sahip.query("INSERT INTO musteri_oturum (ozet, firma_id, musteri_hesap_id, bitis) VALUES ($1, $2, $3, now() + interval '1 day')", ["b".repeat(64), f, mh]);
    const y = await q("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('y6@probata.example', 'Deneme', $1) RETURNING id::text", [await parolaOzeti(PAROLA)]);
    await supa.sahip.query("UPDATE yonetici SET totp_sir = 'v1.x.y.z', durum = 'etkin' WHERE id = $1", [y]);
    const r = (await yonetimIcinde(h, (db) => db.sorgu<{ s: { durum?: string } }>("SELECT yonetim_firma_durum($1, 'dondu') AS s", [f]), { yoneticiId: y })).rows[0].s;
    assert.equal(r.durum, "dondu");
    assert.equal((await supa.sahip.query("SELECT 1 FROM musteri_oturum WHERE firma_id = $1", [f])).rowCount, 1, "bozuk: müşteri oturumu kaldı");
  } finally { await h.end(); await supa.kapat(); }
});

test("7. giriş ayarı okumazsa iki adım açıkken parola tek başına yönetim oturumu açar (kod atlanır)", async () => {
  const g = await bozukGiris("    if (!(await ikiAdim(db))) {\n", "    if (true) {\n");
  const p = await g.yoneticiGiris(havuz, { eposta: "y@probata.example", parola: PAROLA, ip: "10.7.0.1", simdi: new Date(T0.getTime() + 7 * 3600_000) });
  assert.ok(p.tamam && p.sonraki === "tamam", "bozuk: iki adım açıkken kodsuz giriş");
  assert.equal((await g.yonetimOturumOku(havuz, p.tamam ? p.belirtec : "", new Date(T0.getTime() + 7 * 3600_000)))?.id, Y, "bozuk: parola tek başına yönetim oturumu");
});

test("8. yonetim_kim ayara bakmazsa iki adım açıkken anahtarı kurulmamış ('ilk') yönetici yönetim işlemi yapar", async () => {
  const klasor = bozukGocler("g8",
    "    AND (durum = 'etkin' OR (durum = 'ilk' AND NOT coalesce((SELECT a.iki_adim FROM yonetim_ayar a WHERE a.tek), true)));",
    "    AND durum IN ('etkin', 'ilk');", "0075_");
  const supa = await supabaseBenzeri(kume, "yonetim_bozuk_8", klasor);
  const h = havuzKur({ ...kume.uygulama, database: "yonetim_bozuk_8" });
  try {
    await supa.sahip.query("UPDATE yonetim_ayar SET iki_adim = true");
    const y = (await supa.sahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('y8@probata.example', 'Deneme', $1) RETURNING id::text",
      [await parolaOzeti(PAROLA)])).rows[0].id;
    const r = await yonetimIcinde(h, (db) => db.sorgu("SELECT * FROM yonetim_firmalar()"), { yoneticiId: y });
    assert.ok(r.rowCount !== null, "bozuk: 'ilk' yönetici iki adım açıkken yönetim işlemi yaptı");
  } finally { await h.end(); await supa.kapat(); }
});
