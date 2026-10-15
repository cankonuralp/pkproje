/* OLUMSUZ KANIT — tests/kayit-onbellek.test.ts (FIRMA-VT FV3) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kayit-onbellek.ts bellekte
   bozulup geçici klasörden içe aktarılır (dosyanın içe aktarması yok). Her test önce sağlam kodda neyin geçtiğini gösterir.
   1. Olumsuz sonuç olumlu süreyle tutulunca yeni açılan firma 15 sn bulunamaz.
   2. Boyut sınırı kalkınca önbellek sınırsız büyür (her olmayan ad bellekte kalır — bellek tüketme).
   3. Okuma "en son kullanılan" yapmayınca (ilk giren düşer) sık kullanılan firmanın kaydı düşer, merkez yeniden sorulur.
   4. Uçuş sahipliği denetimi kalkınca temizlemeden önce başlamış yükleme sonucu (dondurulmadan önce okunmuş "etkin" kayıt) önbelleğe geri yazılır.
      2026-10-15 (FV3 incelemesi): küresel kuşak sayacı yerine uçuş sahipliği — bozma ona taşındı.
   5. Tek uçuş kalkınca aynı anda gelen istekler merkeze ayrı ayrı sorar.
   6. Uçuşa iliştirilen koşul yok sayılınca bağlantı reddinden ÖNCE okunmuş bayat kayıt, kosuldaSil'den sonra önbelleğe geri yazılır (2026-10-15).
   7. kosuldaSil uçuşları düşürünce (önceki küresel davranış) bir firmanın bağlantı reddi öteki firmanın uçuştaki yüklemesini boşa çıkarır (2026-10-15). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { kayitOnbellegiKur } from "../../src/server/kiraci/kayit-onbellek.ts";

type Modul = typeof import("../../src/server/kiraci/kayit-onbellek.ts");
const KAYNAK = readFileSync(resolve("src/server/kiraci/kayit-onbellek.ts"), "utf8");
const gecici = mkdtempSync(join(tmpdir(), "kayit-onbellek-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `o${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
interface K { id: string }
const adim = () => new Promise<void>((c) => setImmediate(c));

test("1. olumsuz sonuç olumlu süreyle tutulunca yeni açılan firma 15 sn bulunamaz (kilidin koruduğu açık)", async () => {
  const dene = async (kur: Modul["kayitOnbellegiKur"]) => {
    const s = { t: 0 };
    const o = kur<K>({ simdi: () => s.t });
    await o.getir("a:yeni", async () => null);
    s.t += 5_000;
    return o.getir("a:yeni", async () => ({ id: "yeni" }));
  };
  assert.deepEqual(await dene(kayitOnbellegiKur), { id: "yeni" }, "sağlam: 5 sn sonra bulunur");
  const b = await bozuk("bitis: simdi() + (deger === null ? olumsuz : olumlu)", "bitis: simdi() + olumlu");
  assert.equal(await dene(b.kayitOnbellegiKur), null, "bozuk: yeni firma 5 sn sonra hâlâ 'yok'");
});

test("2. boyut sınırı kalkınca önbellek sınırsız büyür (kilidin koruduğu açık)", async () => {
  const dene = (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>();
    for (let i = 0; i < 2500; i++) o.koy(`a:olmayan-${i}`, null);
    return o.boyut;
  };
  assert.equal(dene(kayitOnbellegiKur), 2000);
  const b = await bozuk("    while (kayitlar.size > enCok) kayitlar.delete(kayitlar.keys().next().value as string);\n", "");
  assert.equal(dene(b.kayitOnbellegiKur), 2500, "bozuk: sınır yok");
});

test("3. okuma 'en son kullanılan' yapmayınca sık kullanılan kayıt düşer (kilidin koruduğu açık)", async () => {
  const dene = (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>({ enCok: 2 });
    o.koy("a", { id: "a" });
    o.koy("b", { id: "b" });
    o.al("a");
    o.koy("c", { id: "c" });
    return o.al("a");
  };
  assert.deepEqual(dene(kayitOnbellegiKur), { deger: { id: "a" } });
  const b = await bozuk("    kayitlar.delete(anahtar);\n    if (k.bitis <= simdi()) return undefined;\n    kayitlar.set(anahtar, k);   // en son kullanılan sona\n",
    "    if (k.bitis <= simdi()) { kayitlar.delete(anahtar); return undefined; }\n");
  assert.equal(dene(b.kayitOnbellegiKur), undefined, "bozuk: okunan kayıt düştü");
});

test("4. uçuş sahipliği denetimi kalkınca temizlemeden önce başlamış yüklemenin (eski) sonucu önbelleğe geri yazılır (kilidin koruduğu açık)", async () => {
  const dene = async (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>();
    let bitir: (d: K | null) => void = () => {};
    const p = o.getir("a:firma", () => new Promise((c) => { bitir = c; }));
    await adim();
    o.temizle();   // yönetim firmayı dondurdu
    bitir({ id: "etkinken-okunan" });
    await p;
    return o.al("a:firma");
  };
  assert.equal(await dene(kayitOnbellegiKur), undefined);
  const b = await bozuk("          const kayitli = ucan.get(anahtar) === ucus;\n", "          const kayitli = true;\n");
  assert.deepEqual(await dene(b.kayitOnbellegiKur), { deger: { id: "etkinken-okunan" } }, "bozuk: dondurmadan önceki kayıt geri yazıldı");
});

test("5. tek uçuş kalkınca aynı anda gelen istekler merkeze ayrı ayrı sorar (kilidin koruduğu açık)", async () => {
  const dene = async (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>();
    let n = 0;
    await Promise.all(Array.from({ length: 6 }, () => o.getir("a:x", async () => { n++; return { id: "x" }; })));
    return n;
  };
  assert.equal(await dene(kayitOnbellegiKur), 1);
  const b = await bozuk("      if (u) return u.p;\n", "");
  assert.equal(await dene(b.kayitOnbellegiKur), 6, "bozuk: altı ayrı sorgu");
});

test("6. uçuşa iliştirilen koşul yok sayılınca bağlantı reddinden önce okunmuş bayat kayıt geri yazılır (kilidin koruduğu açık)", async () => {
  const dene = async (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>();
    let bitir: (d: K | null) => void = () => {};
    const p = o.getir("a:kendi-a", () => new Promise((c) => { bitir = c; }));
    await adim();
    o.kosuldaSil((k) => k.id === "a-eski");   // bağlantı reddi: A'nın kaydı merkezden yeniden okundu
    bitir({ id: "a-eski" });
    await p;
    return o.al("a:kendi-a");
  };
  assert.equal(await dene(kayitOnbellegiKur), undefined, "sağlam: bayat kayıt yazılmadı");
  const b = await bozuk("          if (kayitli && !(d !== null && ucus.kosullar.some((k) => k(d)))) koy(anahtar, d);\n",
    "          if (kayitli) koy(anahtar, d);\n");
  assert.deepEqual(await dene(b.kayitOnbellegiKur), { deger: { id: "a-eski" } }, "bozuk: bayat kayıt geri yazıldı");
});

test("7. kosuldaSil uçuşları düşürünce (eski küresel davranış) bir firmanın bağlantı reddi öteki firmanın yüklemesini boşa çıkarır (kilidin koruduğu açık)", async () => {
  const dene = async (kur: Modul["kayitOnbellegiKur"]) => {
    const o = kur<K>();
    let n = 0;
    let bitir: (d: K | null) => void = () => {};
    const p = o.getir("a:kendi-b", () => { n++; return new Promise((c) => { bitir = c; }); });
    await adim();
    o.kosuldaSil((k) => k.id === "a");   // A'nın bağlantısı reddedildi
    const p2 = o.getir("a:kendi-b", async () => { n++; return { id: "b" }; });
    bitir({ id: "b" });
    await Promise.all([p, p2]);
    return n;
  };
  assert.equal(await dene(kayitOnbellegiKur), 1, "sağlam: B tek sorgu");
  const b = await bozuk("      for (const u of ucan.values()) u.kosullar.push(kosul);\n", "      ucan.clear();\n");
  assert.equal(await dene(b.kayitOnbellegiKur), 2, "bozuk: A'nın reddi B'nin uçuştaki yüklemesini boşa çıkardı");
});
