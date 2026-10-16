/* OLUMSUZ KANIT — tests/saglik-coklu-saf.test.ts (FIRMA-VT FV7) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/saglik.ts
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak adrese çevrilir); uçların / çekirdeğin metni bellekte bozulup kilidin
   denetim işlevine (saglikUcuEksikleri) verilir; tools/duman.mjs'nin bozuk kopyası geçici klasörde alt süreçte koşar. Veritabanı gerekmez. Her test
   önce sağlam kodda neyin geçtiğini gösterir; bozuk kodda testin beklentisi düşer.
   1. firma_vt yalnız sorunda yazılınca yanıtın anahtarları adrese göre değişir — kök ile firma adresi sağlıklı durumda da ayırt edilir (biçim sızar).
   2. Firma denetimi kiracının havuzu yerine merkezde yapılınca firmanın veritabanı hiç sorulmaz.
   3. Süre sınırı kalkınca cevap vermeyen firma veritabanı sağlık ucunu asar.
   4. Tek uçuş kalkınca aynı anda gelen her istek firma veritabanına ayrı sorgu açar (açık uç firma veritabanını yorar).
   5. Neden hata iletisini taşıyınca bağlantı dizesindeki sır son_saglik'e düşer.
   6. Firma çözülemeyince hata yakalanmazsa sağlık ucu düşer (yanıt yerine hata).
   7. Kurulum süzgeci kalkınca kurulumu süren firma sayılır ve yazılır.
   8. Eşzamanlılık sınırı kalkınca bütün projeler aynı anda yoklanır.
   9. Tek bitiş zamanı kalkınca süre dolduktan sonra da proje başlatılır.
   10. Uçların / çekirdeğin / veritabanı katmanının metni bozulunca saglikUcuEksikleri yakalar (sırsız istek, yalnız CRON_SECRET, başka ortam sırrı,
       yanıtta fazlası, isteği okuyan sağlık ucu, PDF işlev grubu, kiraciIcinde'siz okuma, fazladan yazma, kısa ad, hata iletisi, önbelleksiz yayın,
       denetimsiz göç bilgisi, arkadaki işi beklemeyen yoklama, süre sınırsız merkez okuma / yazma) — klasörün her düzeyine eklenen dosya da.
   11. duman: sır çıktıya yazılınca, sır yerel olmayan http adrese / ürünün alt adresi olmayan https adrese gönderilince, sorunlu sayısına
       bakılmayınca, sırsız denetim düşen sayılınca, sır her isteğe eklenince, biçim denetimi ve sabit hata metni kalkınca testin beklentisi düşer.
   2026-10-15 (FV7 incelemesi) eklenenler:
   12. Merkez denetiminin tek uçuşu kalkınca aynı anda gelen her istek merkeze ayrı sorgu açar.
   13. Hedef yokken de ana anahtar okunur.
   14. Merkez yazamayınca hata yutulursa uç sayı uydurur (503 yerine 200).
   15. Ana anahtar yokken önce kayıt denetlenir — neden "uygulama parolası çözülemedi" olmaktan çıkar (bağlanmama ayrıca aes.ts'te tutulur).
   16. Önbellek kullanılmayınca süresi dolmamış firma sonucu için yeniden bağlanılır (bozuk parolada her istek bir hatalı parola denemesi).
   17. Süre sınırı tek uçuşun İÇİNE konunca (önceki sıra) süresi dolan iş askıdayken her istek yeni bağlantı / sorgu açar (firma ve merkez).
   18. Arkadaki iş beklenmeyince süresi dolan projelerin bağlantıları açıkken yenileri açılır (4'ü aşar).
   19. Merkez okuması süre sınırsız olunca asılı merkez projeler ucunu asar; merkez sağlık denetimi ya da kiracının çözümü (firma_coz) süre sınırsız
       olunca sağlık ucu asılır.
   20. Göç bilgisi denetimsiz yazılınca firmanın veritabanındaki dev / serbest metin merkezdeki son_saglik'e düşer. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import type { KiraciYeri } from "../../src/server/db/firma-havuzu.ts";
import * as saglam from "../../src/server/saglik.ts";
import { GOC_SAYISI } from "../../src/server/db/son-goc.ts";
import { kayitOnbellegiKur } from "../../src/server/kiraci/kayit-onbellek.ts";
import { dosyalar, KOK, oku, saglikKlasoruEksikleri, saglikUcuEksikleri } from "../yardimci/denetimler.ts";
import { dumanKos, hata, hedefSatiri, IYI, sahteHavuz, sahteSite, saglikCevabi, type SahteHavuz } from "../yardimci/sahte-saglik.ts";

type Modul = typeof import("../../src/server/saglik.ts");
const CEKIRDEK = resolve(import.meta.dirname, "../../src/server/saglik.ts");
const METIN = readFileSync(CEKIRDEK, "utf8");
const gecici = mkdtempSync(join(tmpdir(), "saglik-coklu-saf-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
const degistir = (metin: string, eski: string, yeni: string) => {
  assert.equal(metin.split(eski).length, 2, `bozulacak satır kaynakta tek değil: ${eski}`);
  return metin.replace(eski, () => yeni);
};
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const klasor = dirname(CEKIRDEK);
  const kaynak = degistir(METIN, eski, yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(klasor, y)).href}"`);
  const yol = join(gecici, `s${++sira}.ts`);
  writeFileSync(yol, kaynak);
  return import(pathToFileURL(yol).href);
}
const ANAHTARLAR = ["veritabani", "goc_guncel", "rls", "api_kapali", "uygulama_kisitli", "isler", "firma_vt"];
/* duman sırrın biçimini denetler (en az 32 görünür ASCII karakter): deneme sırrı 36 karakter */
const SIR = `sir-${randomBytes(24).toString("base64url")}`;
function kur(m: Modul, o: { kiraci?: KiraciYeri | null; merkez?: SahteHavuz; firma?: SahteHavuz; firmaMs?: number; ek?: Partial<saglam.SaglikAyari> } = {}) {
  const merkez = o.merkez ?? sahteHavuz(saglikCevabi(IYI));
  const firma = o.firma ?? sahteHavuz(saglikCevabi(IYI));
  const istenen: KiraciYeri[] = [];
  const a = {
    merkez: () => merkez, kiraciBul: async () => o.kiraci ?? null, havuz: (k: KiraciYeri) => { istenen.push(k); return firma; }, surum: "deneme",
    ...(o.firmaMs ? { firmaMs: o.firmaMs } : {}), ...o.ek,
  };
  return { calis: () => m.saglikDenetle(a), merkez, firma, istenen, a };
}
const bekle = (ms: number) => new Promise<"bekledi">((coz) => setTimeout(() => coz("bekledi"), ms));
const sagliklari = (h: SahteHavuz) => h.cagrilar.filter((c) => c.sql.includes("saglik_denetimi()")).length;
const FIRMA_SATIRI = "await sureli(tekUcus(havuz, `firma:${firmaId}`, () => firmaSaglikOku(havuz, firmaId, ms)), ms);";
const MERKEZ_SATIRI = "await sureli(tekUcus(m, \"merkez\", () => saglikOku(m)), a.merkezMs ?? SAGLIK.merkezMs);";

test("1. firma_vt yalnız sorunda yazılınca anahtarlar adrese göre değişir (kilidin koruduğu açık)", async () => {
  const kokS = await kur(saglam).calis();
  const firmaS = await kur(saglam, { kiraci: { firmaId: randomUUID() }, firma: sahteHavuz(saglikCevabi({ ...IYI, goc_sayisi: GOC_SAYISI - 1 })) }).calis();
  assert.deepEqual([Object.keys(kokS.denetimler), Object.keys(firmaS.denetimler)], [ANAHTARLAR, ANAHTARLAR], "sağlam: biçim aynı");
  const b = await bozuk("    denetimler: { ...merkez.denetimler, firma_vt: firmaVt },",
    "    denetimler: (firmaVt ? merkez.denetimler : { ...merkez.denetimler, firma_vt: false }) as SaglikYaniti[\"denetimler\"],");
  const kok = await kur(b).calis();
  assert.notDeepEqual(Object.keys(kok.denetimler), ANAHTARLAR, "bozuk: kökte yedi anahtar yok — testin beklentisi düşer");
});

test("2. firma denetimi merkezde yapılınca firmanın havuzu hiç istenmez (kilidin koruduğu açık)", async () => {
  const kiraci = { firmaId: randomUUID() };
  const s = kur(saglam, { kiraci });
  await s.calis();
  assert.deepEqual(s.istenen, [kiraci], "sağlam: kiracının havuzu");
  const b = kur(await bozuk("    const havuz = a.havuz(k);", "    const havuz = a.merkez();"), { kiraci });
  await b.calis();
  assert.deepEqual([b.istenen.length, b.firma.cagrilar.length], [0, 0], "bozuk: firmanın veritabanı sorulmadı");
  assert.ok(b.merkez.cagrilar.some((c) => c.sql.includes("vt_firma_dogrula")), "bozuk: firma işi merkeze gitti");
});

test("3. süre sınırı kalkınca cevap vermeyen firma veritabanı sağlık ucunu asar (kilidin koruduğu açık)", async () => {
  const asili = () => sahteHavuz(() => undefined, { baglan: () => new Promise<void>(() => {}) });
  const s = await Promise.race([kur(saglam, { kiraci: { firmaId: randomUUID() }, firma: asili(), firmaMs: 200 }).calis(), bekle(1_500)]);
  assert.notEqual(s, "bekledi", "sağlam: süre sınırında döndü");
  const b = await bozuk(FIRMA_SATIRI, "await tekUcus(havuz, `firma:${firmaId}`, () => firmaSaglikOku(havuz, firmaId, ms));");
  const r = await Promise.race([kur(b, { kiraci: { firmaId: randomUUID() }, firma: asili(), firmaMs: 200 }).calis(), bekle(1_500)]);
  assert.equal(r, "bekledi", "bozuk: uç asıldı — testin beklentisi (1,5 sn içinde) düşer");
});

test("4. tek uçuş kalkınca aynı anda gelen her istek firma veritabanına ayrı sorgu açar (kilidin koruduğu açık)", async () => {
  const say = async (m: Modul) => {
    const firma = sahteHavuz(saglikCevabi(IYI, 50));
    const k = kur(m, { kiraci: { firmaId: randomUUID() }, firma });
    await Promise.all(Array.from({ length: 5 }, () => k.calis()));
    return firma.baglanti;
  };
  assert.equal(await say(saglam), 1, "sağlam: tek sorgu");
  const b = await bozuk(FIRMA_SATIRI, "await sureli(firmaSaglikOku(havuz, firmaId, ms), ms);");
  assert.equal(await say(b), 5, "bozuk: beş sorgu — testin beklentisi (1) düşer");
});

test("5. neden hata iletisini taşıyınca bağlantı dizesindeki sır sonuca düşer (kilidin koruduğu açık)", async () => {
  const h = new Error(`postgres://probata_uygulama:${SIR}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres koptu`);
  assert.ok(!JSON.stringify(saglam.firmaSagligiDegerlendir({ hata: h })).includes(SIR), "sağlam: sırsız");
  const b = await bozuk("neden: nedenMetni(y.hata) };", "neden: `${nedenMetni(y.hata)}: ${String(y.hata)}` };");
  assert.ok(JSON.stringify(b.firmaSagligiDegerlendir({ hata: h })).includes(SIR), "bozuk: sır nedende — testin beklentisi düşer");
});

test("6. firma çözülemeyince hata yakalanmazsa sağlık ucu düşer (kilidin koruduğu açık)", async () => {
  const atan = async () => { throw hata("ECONNREFUSED"); };
  const s = await saglam.saglikDenetle({ ...kur(saglam).a, kiraciBul: atan });
  assert.equal(s.denetimler.firma_vt, false, "sağlam: yanıt döndü");
  const b = await bozuk("  try { k = await sureli(a.kiraciBul(), a.merkezMs ?? SAGLIK.merkezMs); } catch (h) {\n    console.error(\"[sağlık] adresin firması çözülemedi:\", nedenMetni(h));\n    return false;\n  }",
    "  k = await a.kiraciBul();");
  await assert.rejects(b.saglikDenetle({ ...kur(b).a, kiraciBul: atan }), "bozuk: uç düştü — testin beklentisi düşer");
});

/** projeler sahte merkezi: goc_hedefleri satırları + yazılanlar */
function merkezSahtesi(satirlar: Record<string, unknown>[], o: { yazmaHatasi?: boolean } = {}) {
  const yazilan: { firma_id: string; s: Record<string, unknown> }[][] = [];
  const h = sahteHavuz((sql, d) => {
    if (sql.includes("goc_hedefleri()")) return { rows: satirlar, rowCount: satirlar.length };
    if (/^\s*UPDATE firma_vt/.test(sql)) {
      if (o.yazmaHatasi) throw hata("42501", "permission denied for table firma_vt");
      const l = JSON.parse(String(d![0])) as { firma_id: string; s: Record<string, unknown> }[];
      yazilan.push(l);
      return { rows: [], rowCount: l.length };
    }
    return undefined;
  });
  return { h, yazilan };
}

test("7. kurulum süzgeci kalkınca kurulumu süren firma sayılır ve yazılır (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const l = [hedefSatiri(anahtar), hedefSatiri(anahtar, { kurulum_durum: "calisiyor", sunucu: null, parola_sifreli: null })];
  const kos = async (m: Modul) => { const s = merkezSahtesi(l); return { r: await m.projeleriYokla({ merkez: s.h, anahtar: () => anahtar, merkezYerel: true, oku: async () => IYI }), s }; };
  const s = await kos(saglam);
  assert.deepEqual([s.r, s.s.yazilan[0]!.length], [{ toplam: 1, tamam: 1, sorunlu: 0 }, 1], "sağlam: kurulumdaki yok");
  const b = await kos(await bozuk(".filter((h) => h.kurulumTamam)", ".filter(() => true)"));
  assert.deepEqual([b.r, b.s.yazilan[0]!.length], [{ toplam: 2, tamam: 1, sorunlu: 1 }, 2], "bozuk: kurulumdaki sayıldı ve yazıldı");
});

test("8. eşzamanlılık sınırı kalkınca bütün projeler aynı anda yoklanır (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const l = Array.from({ length: 7 }, () => hedefSatiri(anahtar));
  const enCok = async (m: Modul) => {
    let acik = 0, en = 0;
    await m.projeleriYokla({
      merkez: merkezSahtesi(l).h, anahtar: () => anahtar, merkezYerel: true,
      oku: async () => { acik++; en = Math.max(en, acik); await bekle(20); acik--; return IYI; },
    });
    return en;
  };
  assert.equal(await enCok(saglam), 4, "sağlam: en çok 4");
  assert.equal(await enCok(await bozuk("await sinirli(hedefler, SAGLIK.ayniAnda, ", "await sinirli(hedefler, hedefler.length, ")), 7, "bozuk: 7 aynı anda");
});

test("9. tek bitiş zamanı kalkınca süre dolduktan sonra da proje başlatılır (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const l = Array.from({ length: 6 }, () => hedefSatiri(anahtar));
  const kos = (m: Modul) => m.projeleriYokla({
    merkez: merkezSahtesi(l).h, anahtar: () => anahtar, merkezYerel: true, projeMs: 200, toplamMs: 300, oku: async () => { await bekle(150); return IYI; },
  });
  assert.deepEqual(await kos(saglam), { toplam: 6, tamam: 4, sorunlu: 2 }, "sağlam: iki projenin süresi bitişe sığmadı, başlatılmadı");
  assert.deepEqual(await kos(await bozuk("(Date.now() + projeMs > bitis ? null :", "(false ? null :")), { toplam: 6, tamam: 6, sorunlu: 0 },
    "bozuk: bitişten sonra da yoklandı — testin beklentisi düşer");
});

test("10. uçların / çekirdeğin / veritabanı katmanının metni bozulunca saglikUcuEksikleri yakalar (kilidin koruduğu açık)", () => {
  const temel = {
    ucu: oku("src/app/api/saglik/route.ts"), projeler: oku("src/app/api/saglik/projeler/route.ts"), cekirdek: oku("src/server/saglik.ts"), vt: oku("src/server/db/saglik.ts"),
  };
  assert.deepEqual(saglikUcuEksikleri(temel), [], "sağlam");
  const yakalar = (ad: keyof typeof temel, eski: string, yeni: string, beklenen: RegExp) => {
    const b = saglikUcuEksikleri({ ...temel, [ad]: degistir(temel[ad], eski, yeni) });
    assert.ok(b.some((x) => beklenen.test(x)), `bozuk ${ad} yakalanmadı: ${eski} → ${b.join(" | ")}`);
  };
  const YETKI = "  const yetki = istek.headers.get(\"authorization\");\n  if (!zamanliYetkili(yetki, process.env.PROBATA_SAGLIK_SIR) && !zamanliYetkili(yetki, process.env.CRON_SECRET)) {\n"
    + "    return Response.json({ hata: \"Yetkisiz.\" }, { status: 401, headers: BASLIK });\n  }\n";
  yakalar("projeler", YETKI, "", /ilk işi zamanliYetkili değil/);
  yakalar("projeler", "!zamanliYetkili(yetki, process.env.PROBATA_SAGLIK_SIR) && ", "", /ilk işi zamanliYetkili değil/);
  yakalar("projeler", "  const o = await projeSagligi();", "  const o = await projeSagligi(); void process.env.PROBATA_SIR_ANAHTARI;", /başka bir ortam sırrını/);
  yakalar("projeler", "{ toplam: o.toplam, tamam: o.tamam, sorunlu: o.sorunlu }", "{ ...o }", /yalnız \{toplam, tamam, sorunlu\}/);
  yakalar("projeler", "{ toplam: o.toplam, tamam: o.tamam, sorunlu: o.sorunlu }", "{ toplam: o.toplam, tamam: o.tamam, sorunlu: o.sorunlu, firmalar: [] }", /yalnız \{toplam/);
  yakalar("projeler", "export const maxDuration = 50;", "export const maxDuration = 60;", /PDF işlev grubunda/);
  yakalar("projeler", "export async function GET(", "export async function POST(", /yalnız GET değil|ilk işi/);
  yakalar("ucu", "export async function GET() {\n  const s = await saglik(istekKiracisi);",
    "export async function GET(istek: Request) {\n  const s = await saglik(async () => ({ firmaId: istek.headers.get(\"x-firma\") ?? \"\" }));", /isteğin kiracısıyla|başlığı okuyor/);
  yakalar("ucu", "const s = await saglik(istekKiracisi);", "const s = await saglik();", /isteğin kiracısıyla/);
  yakalar("ucu", "const s = await saglik(istekKiracisi);", "const s = await saglik(istekKiracisi); void (await headers()).get(\"x-firma\");", /başlığı okuyor/);
  yakalar("cekirdek", "    const havuz = a.havuz(k);", "    const havuz = a.merkez();", /kiracının havuzunda/);
  yakalar("cekirdek", FIRMA_SATIRI, "await tekUcus(havuz, `firma:${firmaId}`, () => sureli(firmaSaglikOku(havuz, firmaId, ms), ms));", /süre sınırı tek uçuşun dışında değil/);
  yakalar("cekirdek", MERKEZ_SATIRI, "await saglikOku(m);", /merkez denetimi tek uçuşta \/ süre sınırlı değil/);
  yakalar("cekirdek", "havuz: kiraciHavuzu, onbellek: firmaSonuclari }", "havuz: kiraciHavuzu }", /önbellekte değil/);
  yakalar("cekirdek", "{ olumluSn: SAGLIK.olumluSn, olumsuzSn: SAGLIK.olumsuzSn }", "{ olumluSn: 1, olumsuzSn: 1 }", /önbellek süreleri/);
  yakalar("cekirdek", "      goc: gocBilgisi(y.veri),", "      goc: { son: y.veri.son_goc, sayi: Number(y.veri.goc_sayisi) },", /göç bilgisi denetimsiz/);
  yakalar("cekirdek", "await sureli(projeHedefleri(a.merkez, merkezMs), merkezMs)", "await projeHedefleri(a.merkez, merkezMs)", /hedeflerin okunması süre sınırlı değil/);
  yakalar("cekirdek", "  await bitmesiniBekle(is, bitis - Date.now());\n", "", /arkadaki işi beklenmiyor/);
  yakalar("cekirdek", "return firmaSagligiDegerlendir({ veri }, beklenen).durum === \"tamam\";", "return firmaSagligiDegerlendir({ veri }, beklenen).durum === \"tamam\" && !!k.kisaAd;", /kısa adı/);
  yakalar("cekirdek", "neden: nedenMetni(y.hata) };", "neden: (y.hata as Error).message };", /hata iletisini/);
  yakalar("cekirdek", ".filter((h) => h.kurulumTamam)", ".filter(() => true)", /kurulumu bitmemiş/);
  yakalar("cekirdek", "  await sureli(sonSaglikYaz(a.merkez, ", "  await sureli(Promise.resolve(a.merkez, ", /merkeze yazılmıyor/);
  yakalar("cekirdek", "  await sureli(sonSaglikYaz(a.merkez, ", "  await (sonSaglikYaz(a.merkez, ", /merkeze yazılmıyor/);
  yakalar("vt", "  return kiraciIcinde(havuz, firmaId, async (db) => {", "  return yonetimIcinde(havuz, async (db) => {", /kiraciIcinde/);
  yakalar("vt", "    await db.sorgu(\"SET TRANSACTION READ ONLY\");\n    await db.sorgu(\"SELECT set_config('statement_timeout'", "    await db.sorgu(\"SELECT set_config('statement_timeout'", /salt okunur/);
  yakalar("vt", "    await db.sorgu(\"SET LOCAL ROLE probata_yonetim\");\n    await db.sorgu(\"SELECT set_config('statement_timeout', $1, true)\", [sureMetni(sureMs)]);\n",
    "    await db.sorgu(\"SET LOCAL ROLE probata_yonetim\");\n", /hedef okuma \/ yazma sunucuda süre sınırlı değil/);
  yakalar("vt", "  const satirlar = await merkezOku(merkez, ", "  const satirlar = await yonetimIcinde(merkez, ", /merkezOku/);
  yakalar("vt", "son_saglik_zaman = now()\n", "son_saglik_zaman = now(), goc_disi = false\n", /dışında yazıyor/);
  yakalar("vt", "  if (!sonuclar.length) return 0;", "  if (!sonuclar.length) return 0;\n  await merkez.query(\"DELETE FROM firma_vt WHERE goc_disi\");", /dışında yazıyor/);

  /* klasör: her düzeye eklenen dosya yakalanır (önceki kilit yalnız ilk düzeydeki klasörlere bakıyordu) */
  const gercek = dosyalar("src/app/api/saglik", [""]);
  assert.deepEqual(saglikKlasoruEksikleri(gercek), [], "sağlam klasör");
  for (const fazla of ["src/app/api/saglik/projeler/liste/route.ts", "src/app/api/saglik/firma/route.ts", "src/app/api/saglik/projeler/page.tsx"]) {
    assert.ok(saglikKlasoruEksikleri([...gercek, fazla]).some((x) => x.includes(fazla)), `derine eklenen ${fazla} yakalanmadı`);
  }
  assert.ok(saglikKlasoruEksikleri(gercek.filter((d) => !d.includes("projeler"))).some((x) => /sağlık ucu yok/.test(x)), "eksik uç yakalanmadı");
});

/* ── 2026-10-15 (FV7 incelemesi) eklenenler ──────────────────────────────────────────────────────────────────────────────────────────── */
test("12. merkez denetiminin tek uçuşu kalkınca aynı anda gelen her istek merkeze ayrı sorgu açar (kilidin koruduğu açık)", async () => {
  const say = async (m: Modul) => {
    const merkez = sahteHavuz(saglikCevabi(IYI, 50));
    const k = kur(m, { merkez });
    await Promise.all(Array.from({ length: 5 }, () => k.calis()));
    return sagliklari(merkez);
  };
  assert.equal(await say(saglam), 1, "sağlam: tek merkez sorgusu");
  assert.equal(await say(await bozuk(MERKEZ_SATIRI, "await sureli(saglikOku(m), a.merkezMs ?? SAGLIK.merkezMs);")), 5, "bozuk: beş — testin beklentisi düşer");
});

test("13. hedef yokken de ana anahtar okunur (kilidin koruduğu açık)", async () => {
  const kos = async (m: Modul) => {
    let okundu = 0;
    await m.projeleriYokla({ merkez: merkezSahtesi([]).h, anahtar: () => { okundu++; return randomBytes(32); }, merkezYerel: true, oku: async () => IYI });
    return okundu;
  };
  assert.equal(await kos(saglam), 0, "sağlam: okunmadı");
  assert.equal(await kos(await bozuk("if (hedefler.length) { try {", "if (true) { try {")), 1, "bozuk: okundu — testin beklentisi düşer");
});

test("14. merkez yazamayınca hata yutulursa uç sayı uydurur (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const kos = (m: Modul) => m.projeleriYokla({ merkez: merkezSahtesi([hedefSatiri(anahtar)], { yazmaHatasi: true }).h, anahtar: () => anahtar, merkezYerel: true, oku: async () => IYI });
  await assert.rejects(kos(saglam), (h: { code?: string }) => h.code === "42501", "sağlam: hata yukarı");
  const b = await bozuk("  await sureli(sonSaglikYaz(a.merkez, yoklanan.map((s) => ({ firmaId: s.firmaId, son: { ...s.saglik, surum } })), merkezMs), merkezMs);",
    "  await sureli(sonSaglikYaz(a.merkez, yoklanan.map((s) => ({ firmaId: s.firmaId, son: { ...s.saglik, surum } })), merkezMs), merkezMs).catch(() => 0);");
  assert.deepEqual(await kos(b), { toplam: 1, tamam: 1, sorunlu: 0 }, "bozuk: yazılamadığı hâlde sayı döndü — testin beklentisi (red) düşer");
});

/* 15: satırın gözlenen etkisi NEDENİN önceliği — ana anahtar yokken asıl neden (anahtar) yazılır, kaydın öteki denetimleri değil. Firmaya bağlanmama ayrıca
   ikinci katla tutulur (src/server/ayar/aes.ts anahtarDenetle: 32 bayt olmayan anahtarla hiçbir parola çözülmez) — yalnız bu satırı kaldırmak
   bağlantı açtıramaz (2026-10-15 FV7 incelemesi: "neden değişir" önerisi denendi, anahtar hatası aes'ten de aynı nedenle geliyor). */
test("15. ana anahtar yokken önce kayıt denetlenir — neden anahtar olmaktan çıkar (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const kos = async (m: Modul) => {
    const s = merkezSahtesi([hedefSatiri(anahtar)]);
    let okundu = 0;
    await m.projeleriYokla({ merkez: s.h, anahtar: () => { throw new Error("Sır anahtarı tanımlı değil (PROBATA_SIR_ANAHTARI, 32 bayt base64)"); }, merkezYerel: false,
      oku: async () => { okundu++; return IYI; } });
    return { neden: String(s.yazilan[0]![0]!.s.neden), okundu };
  };
  assert.deepEqual(await kos(saglam), { neden: "bağlantı kaydı: uygulama parolası çözülemedi (ana anahtar ya da ek veri tutmuyor)", okundu: 0 }, "sağlam: asıl neden anahtar");
  const b = await bozuk("  if (!Buffer.isBuffer(anahtar)) return firmaSagligiDegerlendir({ kayitHatasi: anahtar.hata }, beklenen);\n", "");
  assert.deepEqual(await kos(b), { neden: "bağlantı kaydı: yerel adres (merkez yayında)", okundu: 0 }, "bozuk: neden kaydın denetimine kaydı — testin beklentisi düşer");
});

test("16. önbellek kullanılmayınca süresi dolmamış sonuç için yeniden bağlanılır — bozuk parolada her istek bir deneme (kilidin koruduğu açık)", async () => {
  const kos = async (m: Modul) => {
    const onbellek = kayitOnbellegiKur<true>({ olumluSn: 10, olumsuzSn: 30, simdi: () => 1_000 });
    const bozukParola = sahteHavuz(() => undefined, { baglan: async () => { throw hata("28P01", "password authentication failed"); } });
    const k = kur(m, { kiraci: { firmaId: randomUUID() }, firma: bozukParola, ek: { onbellek } });
    for (let i = 0; i < 5; i++) await k.calis();
    return bozukParola.baglanti;
  };
  assert.equal(await kos(saglam), 1, "sağlam: tek deneme");
  assert.equal(await kos(await bozuk("  if (!a.onbellek) return firmaYokla(a, kiraci, beklenen);", "  if (true) return firmaYokla(a, kiraci, beklenen);")), 5,
    "bozuk: beş deneme — testin beklentisi düşer");
});

test("17. süre sınırı tek uçuşun içine konunca süresi dolan iş askıdayken her istek yeni bağlantı / sorgu açar (kilidin koruduğu açık)", async () => {
  const kos = async (m: Modul) => {
    const firma = sahteHavuz(() => undefined, { baglan: () => new Promise<void>(() => {}) });
    const merkez = sahteHavuz(() => new Promise<never>(() => {}));
    const k = kur(m, { kiraci: { firmaId: randomUUID() }, firma, merkez, ek: { firmaMs: 80, merkezMs: 80 } });
    for (let i = 0; i < 3; i++) await k.calis();
    return [firma.baglanti, sagliklari(merkez)];
  };
  assert.deepEqual(await kos(saglam), [1, 1], "sağlam: askıdaki tek iş");
  const firmaIcte = await bozuk(FIRMA_SATIRI, "await tekUcus(havuz, `firma:${firmaId}`, () => sureli(firmaSaglikOku(havuz, firmaId, ms), ms));");
  assert.deepEqual(await kos(firmaIcte), [3, 1], "bozuk (firma): üç bağlantı — testin beklentisi düşer");
  const merkezIcte = await bozuk(MERKEZ_SATIRI, "await tekUcus(m, \"merkez\", () => sureli(saglikOku(m), a.merkezMs ?? SAGLIK.merkezMs));");
  assert.deepEqual(await kos(merkezIcte), [1, 3], "bozuk (merkez): üç sorgu — testin beklentisi düşer");
});

test("18. arkadaki iş beklenmeyince süresi dolan projelerin bağlantıları açıkken yenileri açılır (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const l = Array.from({ length: 8 }, () => hedefSatiri(anahtar));
  const enCok = async (m: Modul) => {
    let acik = 0, en = 0;
    await m.projeleriYokla({
      merkez: merkezSahtesi(l).h, anahtar: () => anahtar, merkezYerel: true, projeMs: 50, toplamMs: 5_000,
      oku: () => { acik++; en = Math.max(en, acik); return new Promise((coz) => setTimeout(() => { acik--; coz(IYI); }, 250)); },
    });
    return en;
  };
  assert.equal(await enCok(saglam), 4, "sağlam: en çok 4 açık");
  assert.equal(await enCok(await bozuk("  await bitmesiniBekle(is, bitis - Date.now());\n", "")), 8, "bozuk: 8 açık — testin beklentisi düşer");
});

test("19. merkez okuması / merkez sağlık denetimi süre sınırsız olunca asılı merkez ucu asar (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const asili = () => sahteHavuz((sql) => (sql.includes("goc_hedefleri()") ? new Promise<never>(() => {}) : undefined));
  const yokla = (m: Modul) => m.projeleriYokla({ merkez: asili(), anahtar: () => anahtar, merkezYerel: true, merkezMs: 100, oku: async () => IYI }).catch(() => "düştü");
  assert.equal(await Promise.race([yokla(saglam), bekle(1_500)]), "düştü", "sağlam: süresinde düştü (uç 503)");
  const b = await bozuk("await sureli(projeHedefleri(a.merkez, merkezMs), merkezMs)", "await projeHedefleri(a.merkez, merkezMs)");
  assert.equal(await Promise.race([yokla(b), bekle(1_500)]), "bekledi", "bozuk: projeler ucu asıldı — testin beklentisi düşer");

  const ucu = (m: Modul) => kur(m, { merkez: sahteHavuz(() => new Promise<never>(() => {})), ek: { merkezMs: 100 } }).calis();
  assert.notEqual(await Promise.race([ucu(saglam), bekle(1_500)]), "bekledi", "sağlam: sağlık ucu süresinde döndü");
  const b2 = await bozuk(MERKEZ_SATIRI, "await tekUcus(m, \"merkez\", () => saglikOku(m));");
  assert.equal(await Promise.race([ucu(b2), bekle(1_500)]), "bekledi", "bozuk: sağlık ucu asıldı — testin beklentisi düşer");

  /* kiracının çözümü (merkezde firma_coz) asılırsa: sağlamda merkez süresinde firma_vt yanlış; süre sınırı kalkınca uç asılır */
  const cozumAsili = (m: Modul) => m.saglikDenetle({ ...kur(m, { ek: { merkezMs: 100 } }).a, kiraciBul: () => new Promise<never>(() => {}) });
  assert.notEqual(await Promise.race([cozumAsili(saglam), bekle(1_500)]), "bekledi", "sağlam: çözüm asılı da olsa süresinde döndü");
  const b3 = await bozuk("  try { k = await sureli(a.kiraciBul(), a.merkezMs ?? SAGLIK.merkezMs); } catch (h) {", "  try { k = await a.kiraciBul(); } catch (h) {");
  assert.equal(await Promise.race([cozumAsili(b3), bekle(1_500)]), "bekledi", "bozuk: kiracı çözümü uçu astı — testin beklentisi düşer");
});

test("20. göç bilgisi denetimsiz yazılınca firmanın veritabanındaki dev metin merkeze düşer (kilidin koruduğu açık)", async () => {
  const anahtar = randomBytes(32);
  const dev = `x${"y".repeat(50_000)}`;
  const kos = async (m: Modul) => {
    const s = merkezSahtesi([hedefSatiri(anahtar)]);
    await m.projeleriYokla({ merkez: s.h, anahtar: () => anahtar, merkezYerel: true, oku: async () => ({ ...IYI, son_goc: dev, goc_sayisi: -1 }) });
    return JSON.stringify(s.yazilan);
  };
  assert.ok(!(await kos(saglam)).includes(dev), "sağlam: yazılmadı");
  const b = await bozuk("      goc: gocBilgisi(y.veri),", "      goc: { son: y.veri.son_goc, sayi: Number(y.veri.goc_sayisi) },");
  assert.ok((await kos(b)).includes(dev), "bozuk: dev metin merkeze yazıldı — testin beklentisi düşer");
});

/* ── duman ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const DUMAN = readFileSync(join(KOK, "tools", "duman.mjs"), "utf8");
function bozukDuman(...degisiklikler: [string, string][]): string {
  const yol = join(gecici, `d${++sira}.mjs`);
  writeFileSync(yol, degisiklikler.reduce((m, [eski, yeni]) => degistir(m, eski, yeni), DUMAN));
  return yol;
}
const PROJELER_SATIRI = /^✔ proje sağlığı: her kendi projeli firma veritabanı \(sorunlu 0\)$/m;
const YAPILMADI = /^✖ proje sağlığı: .* — istek yapılmadı$/m;

test("11a. duman sırrı çıktıya yazınca yakalanır (kilidin koruduğu açık)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 1, tamam: 1, sorunlu: 0 } });
  try {
    const s = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR);
    assert.ok(!s.cikti.includes(SIR), "sağlam: sır yok");
    const b = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR,
      bozukDuman(["const DUMAN_SIR = (process.env.PROBATA_DUMAN_SIR ?? \"\").trim();", "const DUMAN_SIR = (process.env.PROBATA_DUMAN_SIR ?? \"\").trim(); console.log(\"sır:\", DUMAN_SIR);"]));
    assert.ok(b.cikti.includes(SIR), "bozuk: sır çıktıda — testin beklentisi düşer");
  } finally { await site.kapat(); }
});

test("11b. sır her isteğe eklenince yakalanır; sorunlu sayısına bakılmayınca sorunlu proje geçer (kilidin koruduğu açık)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 2, tamam: 1, sorunlu: 1 } });
  try {
    const s = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR);
    assert.doesNotMatch(s.cikti, PROJELER_SATIRI, "sağlam: sorunlu proje düştü");
    assert.ok(site.istekler.filter((i) => i.yol !== "/api/saglik/projeler").every((i) => i.yetki === undefined), "sağlam: sır yalnız projelere");
    site.istekler.length = 0;
    const her = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR, bozukDuman(["headers: { \"User-Agent\": \"probata-duman/1\", ...basliklar }",
      "headers: { \"User-Agent\": \"probata-duman/1\", ...(DUMAN_SIR ? { Authorization: `Bearer ${DUMAN_SIR}` } : {}), ...basliklar }"]));
    assert.ok(her.kod !== null);
    assert.ok(site.istekler.some((i) => i.yol !== "/api/saglik/projeler" && i.yetki !== undefined), "bozuk: sır başka uçlara da gitti");
    const bakmayan = await dumanKos(`http://127.0.0.1:${site.kapi}`, SIR,
      bozukDuman(["return r.status === 200 && j.sorunlu === 0 && Number.isInteger(j.toplam) && j.tamam === j.toplam", "return r.status === 200"]));
    assert.match(bakmayan.cikti, PROJELER_SATIRI, "bozuk: sorunlu proje geçti — testin beklentisi düşer");
  } finally { await site.kapat(); }
});

test("11c. sırsız denetim düşen sayılınca sayı 11 değil (kilidin koruduğu açık)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  try {
    assert.match((await dumanKos(`http://127.0.0.1:${site.kapi}`, undefined)).cikti, /\/11 denetim/, "sağlam: 11");
    const b = await dumanKos(`http://127.0.0.1:${site.kapi}`, undefined,
      bozukDuman(["} else atlananlar.push(`${PROJELER} — PROBATA_DUMAN_SIR yok`);", "} else sonuclar.push([false, PROJELER, \"sır yok\"]);"]));
    assert.doesNotMatch(b.cikti, /\/11 denetim/, "bozuk: sırsız denetim sayıldı — testin beklentisi düşer");
  } finally { await site.kapat(); }
});

test("11d. adres sınırı kalkınca sır yerel olmayan http adrese gider (kilidin koruduğu açık)", async (t) => {
  let site: Awaited<ReturnType<typeof sahteSite>>;
  try { site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } }, "::1"); } catch {
    t.skip("IPv6 yerel adres yok");
    return;
  }
  try {
    await dumanKos(`http://[::1]:${site.kapi}`, SIR);
    assert.ok(site.istekler.every((i) => i.yetki === undefined), "sağlam: sır gitmedi");
    await dumanKos(`http://[::1]:${site.kapi}`, SIR, bozukDuman(["    if (!SIRLI_ADRES.test(FIRMA)) return", "    if (false) return"]));
    assert.ok(site.istekler.some((i) => i.yetki === `Bearer ${SIR}`), "bozuk: sır şifresiz adrese gitti — testin beklentisi düşer");
  } finally { await site.kapat(); }
});

test("11e. alan sınırı 'her https' olunca sır ürünün alt adresi olmayan https adrese gönderilmeye çalışılır (kilidin koruduğu açık)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  try {
    const s = await dumanKos(`https://127.0.0.1:${site.kapi}`, SIR);
    assert.match(s.cikti, YAPILMADI, "sağlam: istek yapılmadı");
    const b = await dumanKos(`https://127.0.0.1:${site.kapi}`, SIR,
      bozukDuman(["    if (!SIRLI_ADRES.test(FIRMA)) return", "    if (!/^https:\\/\\//.test(FIRMA) && !SIRLI_ADRES.test(FIRMA)) return"]));
    assert.doesNotMatch(b.cikti, YAPILMADI, "bozuk: istek denendi (yabancı https) — testin beklentisi düşer");
    assert.match(b.cikti, /^✖ proje sağlığı: .* — istek gönderilemedi/m);
    assert.ok(!b.cikti.includes(SIR), "sabit hata metni sırrı yine yazmadı");
  } finally { await site.kapat(); }
});

test("11f. biçim denetimi ve sabit hata metni kalkınca satır sonlu sır çıktıya düşer (kilidin koruduğu açık)", async () => {
  const site = await sahteSite({ status: 200, govde: { toplam: 0, tamam: 0, sorunlu: 0 } });
  const on = randomBytes(12).toString("hex"), son = randomBytes(12).toString("hex");
  const sir = `${on}\r\n${son}`;
  const BICIM = ["    if (!SIR_BICIMI.test(DUMAN_SIR)) return", "    if (false) return"] as [string, string];
  const ILETI = ["      return `istek gönderilemedi${", "      return `${h?.message} ${"] as [string, string];
  try {
    const s = await dumanKos(`http://127.0.0.1:${site.kapi}`, sir);
    assert.match(s.cikti, /biçimi geçersiz .* — istek yapılmadı$/m, "sağlam: biçim reddedildi");
    const yalnizBicim = await dumanKos(`http://127.0.0.1:${site.kapi}`, sir, bozukDuman(BICIM));
    assert.doesNotMatch(yalnizBicim.cikti, /biçimi geçersiz/, "bozuk (biçim): istek denendi — testin beklentisi düşer");
    assert.ok(!yalnizBicim.cikti.includes(on), "ikinci kat (sabit hata metni) sırrı tuttu");
    const ikisi = await dumanKos(`http://127.0.0.1:${site.kapi}`, sir, bozukDuman(BICIM, ILETI));
    assert.ok(ikisi.cikti.includes(on), "bozuk (ikisi): fetch'in iletisindeki sır çıktıda — kilidin koruduğu sızıntı");
  } finally { await site.kapat(); }
});
