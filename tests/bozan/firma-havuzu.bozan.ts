/* OLUMSUZ KANIT — tests/firma-havuzu.test.ts (FIRMA-VT FV3, saf) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): firma-havuzu.ts (ve 12'de
   kiraci/coz.ts) bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak adrese, "pg" çözülmüş adrese çevrilir). Veritabanı yok:
   bağlantı aşaması sahte sunucularla (tests/yardimci/sahte-pg.ts), reddeden kapı 1. Her test önce sağlam kodda neyin geçtiğini gösterir.
   1. Çözücü hep merkez havuzunu verince kendi projeli firmanın işi merkeze gider (gerçek veritabanındaki sonucu — 42501 — tests/bozan/firma-vt.bozan.ts).
   2. Kaydın firması denetlenmeyince A'nın kiracısı B'nin kaydıyla B'nin havuzunu alır.
   3. Sürüm "yalnız ileri" olmayınca eski kayıtla gelen istek yeni havuzu düşürür (parola yenilendikten sonra eski parolalı havuz geri gelir).
   4. Havuz sayısı sınırı kalkınca örnek başına havuz (ve bağlantı) sınırsız büyür.
   5. Bağlantı reddinde yeniden deneme kalkınca kayıt merkezden yeniden okunmaz (parola yenilemesi kesintisiz geçmez).
   6. Düşürülmüş havuzun yönlendirmesi kalkınca elinde eski nesne kalan istek "havuz kapandı" hatasıyla düşer.
   2026-10-15 (FV3 incelemesi) eklenenler:
   7. LRU meşgul havuzu da atınca açık işlemi / sırası olan firmanın havuzu düşer (sırası 5 sn bekler, sekip yeniden bağlanır).
   8. Düşürülen havuzun bekleyenleri bırakılmayınca sıradaki istek bağlanma süresi (5 sn) dolana dek bekler.
   9. Tek atlama sınırı kalkınca düşürülen havuzdan geçtiği havuz da düşen istek yeniden seker (art arda sekme).
   10. Aynı sürümde ikinci parola denemesi yasağı kalkınca her istek iki hatalı parola denemesi yapar (Supabase hatalı parola yasağı iki kat yakın).
   11. Taze okuma tek uçuş / 5 sn olmayınca düşen her istek merkezi önbelleksiz sorar (merkez yükü istek sayısıyla büyür).
   12. Kiracının bağlantı kaydı numaralanınca serileştirmede (istemciye giden nesne) şifreli parola ve altyapı bilgisi görünür. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { baglantiSifrele, type FirmaVtKaydi } from "../../src/server/db/baglanti.ts";
import * as saglam from "../../src/server/db/firma-havuzu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import type { FirmaCozumu } from "../../src/server/db/merkez.ts";
import * as saglamCoz from "../../src/server/kiraci/coz.ts";
import { bekle, KAPALI_KAPI, sahteSunucu, sonucu } from "../yardimci/sahte-pg.ts";

type Modul = typeof import("../../src/server/db/firma-havuzu.ts");
type CozModulu = typeof import("../../src/server/kiraci/coz.ts");
const KOK = resolve("src/server/db");
const KAYNAK = readFileSync(join(KOK, "firma-havuzu.ts"), "utf8")
  .replace('from "pg"', `from "${import.meta.resolve("pg")}"`)
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "firma-havuzu-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `h${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

const ANAHTAR = randomBytes(32);
const A = "00000000-0000-4000-8000-00000000000a", B = "00000000-0000-4000-8000-00000000000b", C = "00000000-0000-4000-8000-00000000000c";
const kayit = (firmaId: string, kapi: number, surum = 1): FirmaVtKaydi => ({
  firmaId, ref: null, sunucu: "127.0.0.1", kapi, vtAd: "probata_firma", kullanici: "probata_uygulama",
  parolaSifreli: baglantiSifrele("parola-uydurma", firmaId, null, "uygulama_parolasi", ANAHTAR), depo: null, surum,
});
const kendi = (k: FirmaVtKaydi): FirmaCozumu => ({ id: k.firmaId, kisaAd: `kendi-${k.firmaId.slice(-1)}`, vt: "kendi", kayit: k });
const merkez: Havuz = havuzKur({ host: "127.0.0.1", port: KAPALI_KAPI, database: "probata", user: "probata_uygulama", password: "merkez-uydurma" });
const acik: { kapat(): Promise<void> }[] = [];
after(async () => {
  for (const y of acik) await y.kapat().catch(() => {});
  await merkez.end();
  rmSync(gecici, { recursive: true, force: true });
});
function kur(m: Modul, ek: { havuzSayisi?: number; firmaHavuz?: number; cozumler?: Map<string, FirmaCozumu | null> } = {}) {
  const sayac = { id: 0 };
  const cozumler = ek.cozumler ?? new Map<string, FirmaCozumu | null>();
  const y = m.yonlendiriciKur({
    merkez: () => merkez, anahtar: () => ANAHTAR, merkezYerel: true, havuzSayisi: ek.havuzSayisi, firmaHavuz: ek.firmaHavuz, birak: (p) => { p.catch(() => {}); },
    coz: { ad: async () => null, id: async (i) => { sayac.id++; return cozumler.get(i) ?? null; } },
  });
  acik.push(y);
  return { y, sayac, cozumler };
}
const firmalar = (y: saglam.Yonlendirici) => y.acikHavuzlar.map((k) => k.split(":")[0]);

test("1. çözücü hep merkez havuzunu verince kendi projeli firmanın işi merkeze gider (kilidin koruduğu açık)", async () => {
  const kA = kayit(A, 6543);
  assert.notEqual(kur(saglam).y.havuz({ firmaId: A, vt: kA }), merkez, "sağlam: kendi havuzu");
  const b = await bozuk("      if (!k.vt) return a.merkez();\n", "      return a.merkez();\n");
  assert.equal(kur(b).y.havuz({ firmaId: A, vt: kA }), merkez, "bozuk: merkez havuzu");
});

test("2. kaydın firması denetlenmeyince A'nın kiracısı B'nin havuzunu alır (kilidin koruduğu açık)", async () => {
  const kB = kayit(B, 6544);
  assert.throws(() => kur(saglam).y.havuz({ firmaId: A, vt: kB }), /başka bir firmanın/);
  const b = await bozuk("      if (k.vt.firmaId !== k.firmaId) throw new Error(\"Kiracının veritabanı kaydı başka bir firmanın.\");\n", "");
  const { y } = kur(b);
  assert.equal(y.havuz({ firmaId: A, vt: kB }), y.havuz({ firmaId: B, vt: kB }), "bozuk: A'nın isteği B'nin havuzunda");
});

test("3. sürüm 'yalnız ileri' olmayınca eski kayıtla gelen istek yeni havuzu düşürür (kilidin koruduğu açık)", async () => {
  const dene = (m: Modul) => {
    const { y } = kur(m);
    const yeni = y.havuz({ firmaId: A, vt: kayit(A, 6543, 2) });
    const eskiIle = y.havuz({ firmaId: A, vt: kayit(A, 6543, 1) });
    return { ayni: eskiIle === yeni, dustu: yeni.ending };
  };
  assert.deepEqual(dene(saglam), { ayni: true, dustu: false });
  const b = await bozuk("varolan.kayit.surum >= kayit.surum", "varolan.kayit.surum === kayit.surum");
  assert.deepEqual(dene(b), { ayni: false, dustu: true }, "bozuk: yeni sürümün havuzu eski kayıtla düştü");
});

test("4. havuz sayısı sınırı kalkınca havuzlar sınırsız büyür (kilidin koruduğu açık)", async () => {
  const dene = (m: Modul) => {
    const { y } = kur(m, { havuzSayisi: 2 });
    for (const f of [A, B, C]) y.havuz({ firmaId: f, vt: kayit(f, 6543) });
    return y.acikHavuzlar.length;
  };
  assert.equal(dene(saglam), 2);
  const b = await bozuk("  function sinirla(koru: FirmaHavuzu): void {\n    if (havuzlar.size <= havuzSayisi) return;\n",
    "  function sinirla(koru: FirmaHavuzu): void {\n    if (koru) return;\n");
  assert.equal(dene(b), 3, "bozuk: sınır yok");
});

test("5. bağlantı reddinde yeniden deneme kalkınca kayıt merkezden yeniden okunmaz (kilidin koruduğu açık)", async () => {
  const dene = async (m: Modul) => {
    const { y, sayac, cozumler } = kur(m);
    cozumler.set(A, kendi(kayit(A, KAPALI_KAPI, 2)));
    await assert.rejects(kiraciIcinde(y.havuz({ firmaId: A, vt: kayit(A, KAPALI_KAPI, 1) }), A, async () => {}), (e: { code?: string }) => e.code === "ECONNREFUSED");
    return { okuma: sayac.id, havuzlar: y.acikHavuzlar };
  };
  assert.deepEqual(await dene(saglam), { okuma: 1, havuzlar: [saglam.havuzKimligi(kayit(A, KAPALI_KAPI, 2))] });
  const b = await bozuk("      if (yenilendi || !yenidenDenenir(h)) throw h;\n", "      throw h;\n");
  assert.deepEqual(await dene(b), { okuma: 0, havuzlar: [saglam.havuzKimligi(kayit(A, KAPALI_KAPI, 1))] }, "bozuk: kayıt yenilenmedi, eski havuz kaldı");
});

test("6. düşürülmüş havuzun yönlendirmesi kalkınca elinde eski nesne kalan istek 'havuz kapandı' ile düşer (kilidin koruduğu açık)", async () => {
  const dene = async (m: Modul) => {
    const { y } = kur(m);
    const eski = y.havuz({ firmaId: A, vt: kayit(A, KAPALI_KAPI, 1) });
    y.havuz({ firmaId: A, vt: kayit(A, KAPALI_KAPI, 2) });
    try { await kiraciIcinde(eski, A, async () => {}); return "geçti"; } catch (e) { return (e as Error).message; }
  };
  assert.match(await dene(saglam), /ECONNREFUSED/, "sağlam: güncel havuza yönlendi (reddeden kapı)");
  const b = await bozuk("    const g = this.#yenileyici.guncel(this.kayit);\n    if (g === this) return Promise.reject(new Error(\"Firma havuzu kapanmış.\"));\n    return g.baglan(atlama + 1, yenilendi);\n",
    "    return super.connect();\n");
  assert.match(await dene(b), /after calling end on the pool/, "bozuk: eski nesne kapanmış havuza bağlanmaya çalıştı");
});

test("7. LRU meşgul havuzu da atınca açık işlemi / sırası olan firmanın havuzu düşer (kilidin koruduğu açık)", async () => {
  const dene = async (m: Modul) => {
    const asili = await sahteSunucu("asili");
    try {
      const { y } = kur(m, { havuzSayisi: 1 });
      const p = sonucu(kiraciIcinde(y.havuz({ firmaId: A, vt: kayit(A, asili.kapi) }), A, async () => {}));
      await bekle(() => asili.baglanti === 1, "A bağlanıyor");
      y.havuz({ firmaId: B, vt: kayit(B, 6544) });
      const l = firmalar(y);
      const k = y.kapat();
      asili.kopar();
      await k;
      await p;
      return l;
    } finally { await asili.kapat(); }
  };
  assert.deepEqual(await dene(saglam), [A, B], "sağlam: meşgul A kaldı");
  const b = await bozuk("      if (h !== koru && !mesgul(h)) dusur(h);\n", "      if (h !== koru) dusur(h);\n");
  assert.deepEqual(await dene(b), [B], "bozuk: meşgul A düştü");
});

/** sıradaki istek havuz düşünce güncel havuza ne zaman geçer: "beklemeden" ya da "bekletildi" (2 sn'de geçmedi); düşen havuzdan geçtiği havuz da
    düşünce ikinci sekme: "hata" (art arda) ya da "sekti" */
async function siraDenemesi(m: Modul): Promise<{ gecis: string; ikinci: string }> {
  const asili = await sahteSunucu("asili");
  try {
    const { y } = kur(m, { firmaHavuz: 1 });
    const h1 = y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 1) });
    const r1 = sonucu(kiraciIcinde(h1, A, async () => {}));
    await bekle(() => asili.baglanti === 1, "ilk istek bağlanıyor");
    const r2 = sonucu(kiraciIcinde(h1, A, async () => {}));
    await bekle(() => h1.waitingCount === 1, "ikinci istek sırada");
    y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 2) });
    const gecis = await bekle(() => asili.baglanti === 2, "geçiş", 2_000).then(() => "beklemeden", () => "bekletildi");
    let ikinci = "sınanmadı";
    if (gecis === "beklemeden") {
      y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 3) });
      const s = await Promise.race([r1, new Promise<string>((c) => setTimeout(() => c("sekti"), 1_500))]);
      ikinci = /art arda/.test(s) ? "hata" : "sekti";
    }
    const k = y.kapat();
    asili.kopar();
    await k;
    await Promise.all([r1, r2]);
    return { gecis, ikinci };
  } finally { await asili.kapat(); }
}

test("8. düşürülen havuzun bekleyenleri bırakılmayınca sıradaki istek bağlanma süresi (5 sn) dolana dek bekler (kilidin koruduğu açık)", async () => {
  assert.deepEqual(await siraDenemesi(saglam), { gecis: "beklemeden", ikinci: "hata" });
  const b = await bozuk("      c = await Promise.race([istek, dusuruldu]);\n", "      c = await istek;\n");
  assert.equal((await siraDenemesi(b)).gecis, "bekletildi", "bozuk: sıradaki istek 2 sn'de geçmedi");
});

test("9. tek atlama sınırı kalkınca geçtiği havuz da düşen istek yeniden seker (kilidin koruduğu açık)", async () => {
  const b = await bozuk("    if (atlama >= 1) return Promise.reject(new Error(\"Firma havuzu art arda düşürüldü; istek yeniden denenmeli.\"));\n", "");
  assert.deepEqual(await siraDenemesi(b), { gecis: "beklemeden", ikinci: "sekti" }, "bozuk: art arda sekti");
});

/** parola reddinde (merkezde aynı sürüm) üç istek: kaç parola denemesi, merkez kaç kez soruldu */
async function parolaDenemesi(m: Modul): Promise<{ deneme: number; merkez: number }> {
  const parola = await sahteSunucu("parola");
  try {
    const k1 = kayit(A, parola.kapi, 1);
    const { y, sayac } = kur(m, { cozumler: new Map([[A, kendi(k1)]]) });
    for (let i = 0; i < 3; i++) assert.equal(await sonucu(kiraciIcinde(y.havuz({ firmaId: A, vt: k1 }), A, async () => {})), "28P01");
    await y.kapat();
    return { deneme: parola.baglanti, merkez: sayac.id };
  } finally { await parola.kapat(); }
}

test("10. aynı sürümde ikinci parola denemesi yasağı kalkınca her istek iki hatalı parola denemesi yapar (kilidin koruduğu açık)", async () => {
  assert.deepEqual(await parolaDenemesi(saglam), { deneme: 3, merkez: 1 });
  const b = await bozuk("      if (parolaReddi(hata) && c.kayit.surum <= eski.kayit.surum) throw hata;\n", "");
  assert.equal((await parolaDenemesi(b)).deneme, 6, "bozuk: istek başına iki hatalı parola");
});

test("11. taze okuma tek uçuş / 5 sn olmayınca düşen her istek merkezi sorar (kilidin koruduğu açık)", async () => {
  const b = await bozuk("      const c = await tazele(eski.kayit.firmaId);\n", "      const c = await coz.id(eski.kayit.firmaId);\n");
  assert.equal((await parolaDenemesi(b)).merkez, 3, "bozuk: merkez her istekte");
});

test("12. kiracının bağlantı kaydı numaralanınca serileştirmede şifreli parola ve altyapı bilgisi görünür (kilidin koruduğu açık)", async () => {
  const k = kayit(A, 6543);
  const dene = (m: CozModulu) => JSON.stringify(m.cozumdenKiraci(kendi(k)));
  assert.ok(!dene(saglamCoz).includes(k.parolaSifreli), "sağlam: kayıt serileşmez");
  const yol = join(gecici, "coz.ts");
  const kaynak = readFileSync(resolve("src/server/kiraci/coz.ts"), "utf8");
  const eski = "  if (c.vt === \"kendi\") Object.defineProperty(k, \"vt\", { value: c.kayit, enumerable: false, writable: false, configurable: false });\n";
  assert.ok(kaynak.includes(eski), "bozulacak satır kaynakta");
  writeFileSync(yol, kaynak.replace(eski, () => "  if (c.vt === \"kendi\") k.vt = c.kayit;\n"));
  const b = await import(pathToFileURL(yol).href) as CozModulu;
  const j = dene(b);
  assert.ok(j.includes(k.parolaSifreli) && j.includes("probata_firma") && j.includes("6543"), "bozuk: şifreli parola ve altyapı bilgisi serileşti");
});
