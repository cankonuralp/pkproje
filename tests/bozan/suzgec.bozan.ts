/* OLUMSUZ KANIT — süzgeç mantığı kilidi (tests/suzgec.test.ts) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   src/components/liste/suzgec.ts bellekte okunur, bozulur, geçici klasöre yazılıp içe aktarılır; bozuk sürüm kilidin denetlediği
   davranışı kaybetmeli. K0 (2026-10-03). 2026-11-02: 4–5 tarih aralığı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = readFileSync("src/components/liste/suzgec.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "suzgec-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

type Modul = typeof import("../../src/components/liste/suzgec.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `suzgec-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

interface K { durum: "a" | "b" }
const KAYIT: K[] = [{ durum: "a" }, { durum: "b" }];
const tanim = {
  ad: "", ipucu: "", birim: "kayıt", imkansiz: "", metin: () => "",
  cipler: [{ k: "a", ad: "A", grup: "d", test: (k: K) => k.durum === "a" }, { k: "b", ad: "B", grup: "d", test: (k: K) => k.durum === "b" }],
  seciciler: [{ k: "g", ad: "Görünüm", bas: "a", secenek: () => [["a", "A"], ["hepsi", "Hepsi"]] as const, gecer: (k: K, v: string) => v === "hepsi" || k.durum === v }],
};

test("dürüst sayaç: toplam görünüm anahtarını yok sayınca yakalanır", async () => {
  const m = await bozuk("const toplam = kayitlar.filter((k) => gorunum.every((x) => x.gecer(k, d.sec[x.k]))).length;", "const toplam = kayitlar.length; void gorunum;");
  assert.notEqual(m.listele(tanim, m.yeniDurum(tanim), KAYIT).toplam, 1);
});

test("imkânsız birleşim: grup sayımı bozulunca 've' ile aynı gruptan iki çip yakalanmaz", async () => {
  const m = await bozuk("return Object.values(gruplar).some((n) => n >= 2);", "return Object.values(gruplar).some((n) => n >= 3);");
  const d = { ...m.yeniDurum(tanim), secili: ["a", "b"], kip: "ve" as const };
  assert.equal(m.imkansiz(tanim, d), false);
});

test("Temizle: görünüm anahtarını da sıfırlayınca yakalanır", async () => {
  const m = await bozuk("if (x.siralama || x.bas) y.sec[x.k] = d.sec[x.k];", "void x;");
  const d = { ...m.yeniDurum(tanim), sec: { g: "hepsi" } };
  assert.notEqual(m.temizle(tanim, d).sec.g, "hepsi");
});

interface G { gun: string }
const GUNLER: G[] = [{ gun: "2026-10-31" }, { gun: "2026-11-01" }, { gun: "2026-11-30" }, { gun: "2026-12-01" }];
const tarihTanim = { ad: "", ipucu: "", birim: "rapor", imkansiz: "", metin: () => "", cipler: [], seciciler: [], tarih: { ad: "", gun: (g: G) => g.gun } };

test("4. tarih aralığı: uç gün dışarıda kalınca (< yerine <=) kilit yakalar", async () => {
  const m = await bozuk("if ((d.tarih.bas && g < d.tarih.bas) || (d.tarih.bit && g > d.tarih.bit)) return false;",
    "if ((d.tarih.bas && g <= d.tarih.bas) || (d.tarih.bit && g >= d.tarih.bit)) return false;");
  const d = { ...m.yeniDurum(tarihTanim), tarih: { bas: "2026-11-01", bit: "2026-11-30" } };
  assert.equal(m.listele(tarihTanim, d, GUNLER).adet, 0, "bozuk: iki uç da düşer (kilit 2 bekler)");
});

test("5. hazır aralık: geçen ayın sonu yanlış hesaplanınca kilit yakalar", async () => {
  const m = await bozuk(`{ k: "gecen-ay", ad: "Geçen ay", bas: g(y, a - 1, 1), bit: g(y, a, 0) }`, `{ k: "gecen-ay", ad: "Geçen ay", bas: g(y, a - 1, 1), bit: g(y, a - 1, 30) }`);
  const x = m.hazirAraliklar("2026-11-02").find((h) => h.k === "gecen-ay")!;
  assert.notEqual(x.bit, "2026-10-31", "bozuk: ekim 30'da biter");
});
