/* OLUMSUZ KANIT — tests/sign-gomulu.test.ts neyi koruyor (2026-11-07). Kaynak diskte DEĞİŞTİRİLMEZ: bellekte bozulur —
   (1) köken denetimi kalkarsa başka bir sitenin iletisi "imzalandı" sayılır; (2) kaynak denetimi kalkarsa sign dışı ileti geçer;
   (3) adres denetimi alt alan sınırını kaybederse benzer adlı başka site çerçeveye açılır; (4) allow özniteliği değişirse USB imza uygulamasına
   ulaşılamaz — kilitteki eşitlik düşer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-sign-gomulu-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
async function bozuk<T>(dosya: string, eski: string, yeni: string, ad: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Haber = typeof import("../../src/modules/raporlar/sign-haber.ts");
type Adres = typeof import("../../src/server/dis/sign-adres.ts");
const FIRMA = "https://deneme.sign.probata.com.tr";

test("köken denetimi kalkınca başka sitenin iletisi geçer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "if (!beklenenKoken || e.origin !== beklenenKoken) return null;", "", "koken");
  assert.deepEqual(m.signHaberi({ origin: "https://kotu.example", data: { kaynak: "probata-sign", tur: "imzalandi" } }, FIRMA), { tur: "imzalandi" });
});

test("kaynak denetimi kalkınca sign dışı ileti geçer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "if (x.kaynak !== \"probata-sign\") return null;", "", "kaynak");
  assert.deepEqual(m.signHaberi({ origin: FIRMA, data: { kaynak: "baska", tur: "imzalandi" } }, FIRMA), { tur: "imzalandi" });
});

test("alt alan sınırı kalkınca benzer adlı site sign sayılır — kilit düşer", async () => {
  const m = await bozuk<Adres>("src/server/dis/sign-adres.ts", "a.host.endsWith(`.${k.host}`)", "a.host.includes(k.host)", "alt-alan");
  assert.equal(m.signSayfasiMi("https://sign.probata.com.tr.kotu.example/x", "https://sign.probata.com.tr"), true);
});

test("allow özniteliği değişince rehberle eşitlik düşer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "\"local-network-access; local-network; loopback-network\"", "\"local-network-access\"", "allow");
  assert.notEqual(m.GOMULU_IZIN, "local-network-access; local-network; loopback-network");
});

/* 2026-11-10: "kapat" tanınmazsa sign'ın bitiş ekranındaki "Kapat" tuşu pencereyi kapatmaz; bitiş haberi "hemen" olursa bitiş ekranı görünmeden kapanır */
test("kapat haberi tanınmayınca Kapat tuşu işlemez; bitiş haberi hemen kapatınca bitiş ekranı görünmez — kilit düşer", async () => {
  const a = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "case \"kapali\": case \"kapat\": return { tur: x.tur };", "case \"kapali\": return { tur: x.tur };", "kapat");
  assert.equal(a.signHaberi({ origin: FIRMA, data: { kaynak: "probata-sign", tur: "kapat" } }, FIRMA), null, "bozuk: kapat haberi yok sayılır");
  const b = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "case \"toplu_bitti\": return \"gecikmeli\";", "case \"toplu_bitti\": return \"hemen\";", "kapanis");
  assert.equal(b.kapanis("imzalandi"), "hemen", "bozuk: bitiş ekranı görünmeden kapanır");
});

/* 2026-11-08: eski kayıt yenilenmezse 5 Kasım isteği hep yeni sekmede kalır; gömülüsüz kayıt da "eski" sayılırsa her tıklamada imza isteği iptal edilir */
test("eski kayıt yenilenmeyince gömülü bağlantı hiç gelmez; gömülüsüz kayıt düz yazılınca her tıklamada iptal edilir — kilit düşer", async () => {
  type S = { eskiBaglantiMi: (m: string | null) => boolean; baglantiMetni: (b: string | null, g: string | null) => string | null };
  const kaynak = readFileSync(resolve("src/modules/raporlar/server/sign.ts"), "utf8");
  const parca = kaynak.split(String.fromCharCode(10)).filter((x) => x.startsWith("export const baglantiMetni") || x.startsWith("export const eskiBaglantiMi")).join(String.fromCharCode(10));
  assert.ok(parca.includes("eskiBaglantiMi"), "kaynakta bulunmalı");
  const yaz = (ad: string, m: string) => { const y = join(klasor, ad + ".ts"); writeFileSync(y, m); return import(pathToFileURL(y).href) as Promise<S>; };
  const a = await yaz("eski1", parca.replace('!!metin && !metin.startsWith("{")', "false"));
  assert.equal(a.eskiBaglantiMi("https://sign.probata.com.tr/dis#eski"), false, "bozuk: 5 Kasım kaydı yenilenmez");
  const b = await yaz("eski2", parca.replace("(baglanti || gomulu ? JSON.stringify({ b: baglanti, g: gomulu }) : null)", "(gomulu ? JSON.stringify({ b: baglanti, g: gomulu }) : baglanti)"));
  assert.equal(b.eskiBaglantiMi(b.baglantiMetni("https://x/dis", null)), true, "bozuk: gömülüsüz yeni kayıt da eski sayılır");
});

/* 2026-11-09: bağlantısız istek yenilenmezse tek imza toplu sayfaya gider ve programa bağlanamaz */
test("bağlantısız istek yenilenmeyince tek imza toplu sayfaya gider — kilit düşer", async () => {
  const k = readFileSync(resolve("src/modules/raporlar/server/sign.ts"), "utf8").split(String.fromCharCode(10)).find((x) => x.startsWith("export const tekteYenilenir"));
  assert.ok(k, "kaynakta bulunmalı");
  const y = join(klasor, "tekte.ts");
  writeFileSync(y, k.replace("!b.baglanti && !b.gomulu", "false"));
  const m = await import(pathToFileURL(y).href) as { tekteYenilenir: (b: { baglanti: string | null; gomulu: string | null }) => boolean };
  assert.equal(m.tekteYenilenir({ baglanti: null, gomulu: null }), false, "bozuk: yenilenmedi");
});
