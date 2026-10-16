/* OLUMSUZ KANIT — tests/goc-dagit-saf.test.ts (FIRMA-VT FV4) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/db/goc-dagit.ts
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak adrese, "pg" çözülmüş adrese çevrilir); vercel.json, betik ve modül
   metni bellekte bozulup kilidin denetim işlevine verilir. Veritabanı gerekmez. Her test önce sağlam kodda neyin geçtiğini gösterir.
   1. Vercel denetimi kalkınca (ayarsız ortamda yalnız --zorunlu) VERCEL'li derleme 0 döner; --zorunlu yok sayılınca Vercel'in sistem değişkeni
      gelmeyen derlemesi 0 döner — yayın kapısı sessizce açılır.
   2. Kip (ve 2026-10-16 FV8'den beri Yönetim API anahtarı), veritabanı ayarından SONRA denetlenince ayarsız derlemede "uygula" 0 olur (anahtarsız
      uygula 1 olmalı).
   3. Kip denetimi gevşeyince (bilinmeyen değer "denetle" sayılır) yanlış yazılmış kip sessizce geçer.
   4. Neden metni hata iletisini yazınca iletideki sır (parola, bağlantı dizesi) çıktıya düşer.
   5. Göç SAYISI karşılaştırması kalkınca arada atlanmış göç "güncel" görünür (354'ün aynısı).
   6. vercel.json'da kapı kalkınca / --zorunlu kalkınca / "&&" yerine ";" olunca / yalnız main kalkınca / kip dosyaya yazılınca / günlük herkese
      açılınca / betik 0 ile çıkınca / betik ortamı ya da bağımsız değişkenleri geçirmeyince yayinKapisiEksikleri yakalar.
   7. Modül merkez havuzunu kullanınca, denetlemede yazınca, READ ONLY kalkınca, firma vt_firma_dogrula'dan geçmeyince, sorgu süre sınırı kalkınca,
      ortam tek kaynak olmayınca gocDagitEksikleri yakalar.
   8. Yeniden deneme kalkınca geçici hata derlemeyi tek denemede düşürür; kalıcı hata geçici sayılınca boşuna yeniden denenir.
   9. Süre sınırı kalkınca cevap vermeyen merkez denetimi bekletir (karar süre dolunca verilmez).
   10. Süre dolduktan sonraki satır süzgeci kalkınca arkada süren işin satırları karardan SONRA günlüğe düşer.
   11. Ana anahtar verilen ortamda yokken process.env'e düşünce ortam tek kaynak olmaz.
   12. Ulaşılamadı / reddetti ayrımında sınıf denetimi kalkınca "sunucu kapanıyor" (57P01) "reddedildi" diye yanlış teşhis edilir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import * as saglam from "../../src/server/db/goc-dagit.ts";
import { GOC_SAYISI, SON_GOC } from "../../src/server/db/son-goc.ts";
import { gocDagitEksikleri, oku, yayinKapisiEksikleri } from "../yardimci/denetimler.ts";

type Modul = typeof import("../../src/server/db/goc-dagit.ts");
const KLASOR = resolve(import.meta.dirname, "../../src/server/db");
const METIN = readFileSync(join(KLASOR, "goc-dagit.ts"), "utf8");
const KAYNAK = METIN
  .replace('from "pg"', `from "${import.meta.resolve("pg")}"`)
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(KLASOR, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "goc-dagit-saf-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.equal(KAYNAK.split(eski).length, 2, `bozulacak satır kaynakta tek değil: ${eski}`);
  const yol = join(gecici, `g${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const kos = async (m: Modul, ortam: saglam.Ortam, arguman: readonly string[] = []) => {
  const s: string[] = [];
  return { kod: await m.gocDagit({ ortam, arguman, yaz: (x) => s.push(x) }), cikti: s.join("\n") };
};
const degistir = (metin: string, eski: string, yeni: string) => {
  assert.ok(metin.includes(eski), `bozulacak satır yok: ${eski}`);
  return metin.replace(eski, () => yeni);
};
const hata = (kod: string) => Object.assign(new Error("ileti"), { code: kod });
function sessizSunucu(): Promise<{ kapi: number; kapat: () => Promise<void> }> {
  return new Promise((coz, reddet) => {
    const soketler = new Set<Socket>();
    const s = createServer((k) => { soketler.add(k); k.on("error", () => {}); k.on("close", () => soketler.delete(k)); });
    s.once("error", reddet);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      coz({
        kapi: typeof a === "object" && a ? a.port : 0,
        kapat: () => new Promise<void>((bitti) => { for (const k of soketler) k.destroy(); s.close(() => bitti()); }),
      });
    });
  });
}
const yerelOrtam = (kapi: number): saglam.Ortam => ({
  PROBATA_VT_SUNUCU: "127.0.0.1", PROBATA_VT_KAPI: String(kapi), PROBATA_VT_AD: "probata", PROBATA_VT_KULLANICI: "probata_uygulama", PROBATA_VT_PAROLA: "x",
});

test("1. Vercel denetimi ya da --zorunlu kalkınca ayarsız yayın derlemesi 0 döner — kapı sessizce açılır (kilidin koruduğu açık)", async () => {
  assert.equal((await kos(saglam, { VERCEL: "1" })).kod, 1, "sağlam: Vercel'de 1");
  assert.equal((await kos(saglam, {}, ["--zorunlu"])).kod, 1, "sağlam: --zorunlu ile 1");
  const vercelsiz = await bozuk("    if (zorunlu || vercelde(e)) {\n", "    if (zorunlu) {\n");
  assert.equal((await kos(vercelsiz, { VERCEL: "1" })).kod, 0, "bozuk: Vercel'de 0 — testin beklentisi (1) düşer");
  const zorunsuz = await bozuk("    if (zorunlu || vercelde(e)) {\n", "    if (vercelde(e)) {\n");
  assert.equal((await kos(zorunsuz, {}, ["--zorunlu"])).kod, 0, "bozuk: --zorunlu ile 0 — testin beklentisi (1) düşer");
});

test("2. kip ayardan sonra denetlenince ayarsız derlemede 'uygula' 0 olur (kilidin koruduğu açık)", async () => {
  assert.equal((await kos(saglam, { PROBATA_GOC_DAGIT: "uygula" })).kod, 1, "sağlam: açık hata");
  const b = await bozuk('  if (kip === "uygula") {\n', '  if (kip === "uygula" && !vtAyariYok(e)) {\n');
  const r = await kos(b, { PROBATA_GOC_DAGIT: "uygula" });
  assert.equal(r.kod, 0, "bozuk: 'uygula' atlandı sayıldı");
  assert.match(r.cikti, /atlandı/);
});

test("3. kip denetimi gevşeyince yanlış yazılmış kip 'denetle' sayılır (kilidin koruduğu açık)", async () => {
  assert.throws(() => saglam.kipOku({ PROBATA_GOC_DAGIT: "UYGULA" }), "sağlam: hata");
  const b = await bozuk('  if (k === "" || k === "denetle") return "denetle";\n', '  if (k !== "uygula") return "denetle";\n');
  assert.equal(b.kipOku({ PROBATA_GOC_DAGIT: "UYGULA" }), "denetle", "bozuk: sessizce denetle — testin assert.throws'u düşer");
});

test("4. neden metni hata iletisini yazınca sır çıktıya düşer (kilidin koruduğu açık)", async () => {
  const SIR = "GIZLI-parola-9f8e7d";
  const h = new Error(`postgres://probata_uygulama:${SIR}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`);
  assert.equal(saglam.nedenMetni(h), "bağlantı kurulamadı", "sağlam: sınıf");
  const b = await bozuk('  return "bağlantı kurulamadı";\n}', '  return ileti || "bağlantı kurulamadı";\n}');
  assert.ok(b.nedenMetni(h).includes(SIR), "bozuk: sır çıktıda");
});

test("5. göç sayısı karşılaştırması kalkınca arada atlanmış göç 'güncel' görünür (kilidin koruduğu açık)", async () => {
  const v = { son_goc: SON_GOC, goc_sayisi: GOC_SAYISI - 1 };
  assert.equal(saglam.karsilastir("a", v).durum, "uyumsuz", "sağlam");
  const b = await bozuk("  if (v.son_goc === beklenen.son && sayi === beklenen.sayi) return", "  if (v.son_goc === beklenen.son) return");
  assert.equal(b.karsilastir("a", v).durum, "guncel", "bozuk: atlanmış göç geçti");
});

test("6. vercel.json / betik bozulunca yayinKapisiEksikleri yakalar (kilidin koruduğu açık)", () => {
  const vercel = oku("vercel.json"), betik = oku("scripts/goc-dagit.ts");
  assert.deepEqual(yayinKapisiEksikleri({ vercel, betik }), [], "sağlam");
  const KOMUT = '"buildCommand": "node scripts/goc-dagit.ts --zorunlu && node scripts/next.ts build"';
  for (const [v, bulgu] of [
    [degistir(vercel, KOMUT, '"buildCommand": "node scripts/next.ts build"'), "derleme komutu göç kapısından geçmiyor"],
    [degistir(vercel, KOMUT, '"buildCommand": "node scripts/goc-dagit.ts && node scripts/next.ts build"'), "derleme komutu göç kapısından geçmiyor"],
    [degistir(vercel, KOMUT, '"buildCommand": "node scripts/goc-dagit.ts --zorunlu; node scripts/next.ts build"'), "derleme komutu göç kapısından geçmiyor"],
    [degistir(vercel, KOMUT, '"buildCommand": "node scripts/next.ts build && node scripts/goc-dagit.ts --zorunlu"'), "derleme komutu göç kapısından geçmiyor"],
    [degistir(vercel, '"main": true', '"main": false'), "yalnız main yayınlanmıyor (git.deploymentEnabled)"],
    [degistir(vercel, '"**": false', '"**": true'), "yalnız main yayınlanmıyor (git.deploymentEnabled)"],
    [degistir(vercel, '"schedule": "15 1 * * *"', '"schedule": "15 1 * * 0"'), "gece işi zamanlaması değişmiş"],
    [degistir(vercel, "{", '{ "build": { "env": { "PROBATA_GOC_DAGIT": "denetle" } },'), "göç kipi vercel.json'da (ortam değişkeni olmalı)"],
    [degistir(vercel, "{", '{ "public": true,'), "derleme günlüğü / kaynak herkese açık (vercel.json public)"],
  ] as const) {
    assert.ok(yayinKapisiEksikleri({ vercel: v, betik }).includes(bulgu), `bozuk vercel.json yakalanmadı: ${bulgu}`);
  }
  for (const [b, bulgu] of [
    [degistir(betik, "process.exitCode = kod;", "process.exitCode = 0;"), "betik 0 ile çıkıyor"],
    [degistir(betik, "setTimeout(() => process.exit(kod), 2000)", "setTimeout(() => process.exit(0), 2000)"), "betik 0 ile çıkıyor"],
    [degistir(betik, "{ ortam: process.env,", "{ ortam: {},"), "betik göç dağıtıcıyı ortamla çağırmıyor"],
    [degistir(betik, "arguman: process.argv.slice(2),", "arguman: [],"), "betik göç dağıtıcıyı ortamla çağırmıyor"],
  ] as const) {
    assert.ok(yayinKapisiEksikleri({ vercel, betik: b }).includes(bulgu), `bozuk betik yakalanmadı: ${bulgu}`);
  }
});

test("7. modül merkez havuzunu kullanınca / yazınca / READ ONLY kalkınca / vt_firma_dogrula'dan geçmeyince / süre sınırı kalkınca / ortam tek kaynak olmayınca yakalanır (kilidin koruduğu açık)", () => {
  assert.deepEqual(gocDagitEksikleri(METIN), [], "sağlam");
  for (const [m, bulgu] of [
    [degistir(METIN, "  const merkez = havuzAc(ayar, 2);", "  const merkez = merkezHavuzu();"), "merkez havuzunu kullanıyor"],
    [degistir(METIN, "    const merkezYerel = merkezYerelMi(e);",
      '    await yonetimIcinde(merkez, (db) => db.sorgu("UPDATE firma_vt SET son_goc = $1", [beklenen.son]));\n    const merkezYerel = merkezYerelMi(e);'),
    "denetlemede yazıyor"],
    [degistir(METIN, '      await db.sorgu("SET TRANSACTION READ ONLY");\n      return (await db.sorgu<{ s: GocDurumu }>', "      return (await db.sorgu<{ s: GocDurumu }>"),
      "hedef / firma işlemi salt okunur değil"],
    [degistir(METIN, "birKezDaha(() => merkezOku(merkez, ", "birKezDaha(() => yonetimIcinde(merkez, "), "merkez merkezOku'dan okunmuyor"],
    [degistir(METIN, "birKezDaha(() => kiraciIcinde(havuz, h.firma_id, ", "birKezDaha(() => merkezOku(havuz, "), "firma vt_firma_dogrula'dan (kiraciIcinde) geçmiyor"],
    [degistir(METIN, ", query_timeout: GOC_DAGIT.sorguMs", ""), "sorgu süre sınırı yok"],
    [degistir(METIN, 'anaAnahtar(e.PROBATA_SIR_ANAHTARI ?? "")', "anaAnahtar(e.PROBATA_SIR_ANAHTARI)"), "ortam tek kaynak değil (process.env ya da ana anahtarın varsayılanı)"],
    [degistir(METIN, "export const vercelde = (e: Ortam): boolean => !!e.VERCEL;", "export const vercelde = (e: Ortam): boolean => !!(e.VERCEL ?? process.env.VERCEL);"),
      "ortam tek kaynak değil (process.env ya da ana anahtarın varsayılanı)"],
  ] as const) {
    assert.ok(gocDagitEksikleri(m).includes(bulgu), `bozuk modül yakalanmadı: ${bulgu}`);
  }
});

test("8. yeniden deneme kalkınca geçici hata tek denemede düşer; kalıcı hata geçici sayılınca boşuna denenir (kilidin koruduğu açık)", async () => {
  const dene = async (m: Modul, kod: string) => {
    let n = 0;
    try { await m.birKezDaha(async () => { n++; if (n === 1) throw hata(kod); return "tamam"; }, 0); } catch { /* sayı yeter */ }
    return n;
  };
  assert.equal(await dene(saglam, "57P01"), 2, "sağlam: geçici hata bir kez daha");
  assert.equal(await dene(saglam, "28P01"), 1, "sağlam: kalıcı hata denenmez");
  const denemesiz = await bozuk("    if (!geciciMi(h)) throw h;\n", "    throw h;\n");
  assert.equal(await dene(denemesiz, "57P01"), 1, "bozuk: geçici hata tek denemede düştü — testin beklentisi (2) düşer");
  const herSey = await bozuk('new Set(["57P01", ', 'new Set(["28P01", "57P01", ');
  assert.equal(await dene(herSey, "28P01"), 2, "bozuk: kalıcı hata yeniden denendi — testin beklentisi (1) düşer");
});

test("9. süre sınırı kalkınca karar süre dolunca verilmez — cevap vermeyen merkez bekletir (kilidin koruduğu açık)", async () => {
  const sunucu = await sessizSunucu();
  try {
    const b = await bozuk("    return await Promise.race([is, sure]);\n", "    return await is;\n");
    const s: string[] = [];
    const is = b.gocDagit({ ortam: yerelOrtam(sunucu.kapi), yaz: (x) => s.push(x), sureMs: 500 });
    /* 1,5 sn sonra bağlantı kesilir (yoksa bozuk kod 5 + 2,5 + 5 sn bekler) — sağlamda karar 0,5 sn'de verilmiş olurdu */
    await new Promise((coz) => setTimeout(coz, 1500));
    await sunucu.kapat();
    const kod = await is;
    assert.equal(kod, 1);
    assert.doesNotMatch(s.at(-1) ?? "", /süre doldu/, "bozuk: son satır süre dolması değil — testin beklentisi düşer");
  } finally { await sunucu.kapat(); }
});

test("10. satır süzgeci kalkınca arkada süren işin satırları karardan SONRA günlüğe düşer (kilidin koruduğu açık)", async () => {
  const sunucu = await sessizSunucu();
  try {
    const b = await bozuk("  const y = (s: string) => { if (!bitti) a.yaz(", "  const y = (s: string) => { a.yaz(");
    const s: string[] = [];
    assert.equal(await b.gocDagit({ ortam: yerelOrtam(sunucu.kapi), yaz: (x) => s.push(x), sureMs: 500 }), 1);
    const n = s.length;
    await sunucu.kapat();
    await new Promise((coz) => setTimeout(coz, 4500));
    assert.ok(s.length > n, "bozuk: süre dolduktan sonra yazıldı — testin beklentisi (satır sayısı aynı) düşer");
  } finally { await sunucu.kapat(); }
});

test("11. ana anahtar process.env'e düşünce ortam tek kaynak olmaz (kilidin koruduğu açık)", async () => {
  const onceki = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = Buffer.alloc(32, 7).toString("base64");
  try {
    assert.throws(() => saglam.anahtarOku({}), "sağlam: ortamda yok → hata");
    const b = await bozuk('anaAnahtar(e.PROBATA_SIR_ANAHTARI ?? "")', "anaAnahtar(e.PROBATA_SIR_ANAHTARI)");
    assert.equal(b.anahtarOku({}).length, 32, "bozuk: süreçteki anahtar kullanıldı — testin assert.throws'u düşer");
  } finally {
    if (onceki === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = onceki;
  }
});

test("12. sınıf denetimi kalkınca 'sunucu kapanıyor' (57P01) 'reddedildi' diye yanlış teşhis edilir (kilidin koruduğu açık)", async () => {
  assert.equal(saglam.reddedildiMi(hata("57P01")), false, "sağlam");
  const b = await bozuk(" && !/^(08|53|57)/.test(kod);", ";");
  assert.equal(b.reddedildiMi(hata("57P01")), true, "bozuk: geçici kapanma 'reddedildi' — testin beklentisi düşer");
});
