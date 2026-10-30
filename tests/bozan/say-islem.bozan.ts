/* OLUMSUZ KANIT — 2026-10-16 (pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a): tests/say-islem-yurutucu.test.ts ve tests/say-islem-katalog.test.ts neyi
   koruyor. Kaynak diskte DEĞİŞTİRİLMEZ: src/server/yz/islem.ts ve src/server/yz/say.ts bellekte bozulur, göreli içe aktarmalar mutlak yola, çıplak
   "zod" projenin node_modules'una çevrilip geçici klasörden içe aktarılır. O zaman:
   1. yürütücü şema doğrulamasını atlarsa şemaya uymayan girdi modül işlevine gider (çalıştırıcı çağrılır);
   2. yürütücü oturum yerine girdideki kimliğe güvenirse yapay zekânın (ya da istemcinin) yazdığı kişi / firma işlemi yapar;
   3. sunucu işleminin sonucu tool_result'a konmazsa S.A.Y bulduğu kayıtları (kimlikler, sürümler) göremez — yalnız sayılar gider;
   4. işlem araçları yalnız rapor açıkken giderse S.A.Y başka sayfada iş yapamaz ("bu sayfa açık değil" — reisim'in şikâyeti). 2026-10-23 (S.A.Y
      baştan): araçların hepsi her istekte (sayAraclari) — işlem araçları düşerse kilit düşer.
   2026-10-16 (2. adım a incelemesi; 2026-10-23: döngü src/modules/say/server/dongu.ts — kaynak bellekte bozulur, kilidin AYNI denetimi
   tests/yardimci/denetimler.ts sayEylemDenetimi uygulanır):
   5. işlemin ortamı oturum yerine girdiden kurulursa (kim: girdideki) denetim düşer;
   6. ekranın gönderdiği adımlar (d.onceki) yürütücüden yeniden geçerse denetim düşer — iş iki kez yapılır;
   7. aynı cevapta ekran komutundan sonraki işlem beklemeden çalışırsa (sıra) denetim düşer;
   8. bir işlemin girdisine modülün şemasının alanları ELLE kopyalanırsa (musteri_kaydet.alanlar) alan denetimi düşer (islemAlanlariDenetimi). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { kimlik, surum, z } from "../../src/sema/ortak.ts";
import type { Sorgulayici } from "../../src/server/db/kiraci.ts";
import { MusteriGirdisi, TesisGirdisi } from "../../src/modules/musteriler/sema.ts";
import { SuzgecDurumuSemasi } from "../../src/server/liste/liste.ts";
import { islemAlanlariDenetimi, oku, SAY_ELLE_ALANLAR, sayEylemDenetimi } from "../yardimci/denetimler.ts";

const klasor = mkdtempSync(join(tmpdir(), "say-islem-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`)
  .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
const ISLEM = kaynak("src/server/yz/islem.ts"), SAY = kaynak("src/server/yz/say.ts");
let sira = 0;
async function bozuk<T>(k: string, eski: string, yeni: string): Promise<T> {
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Islem = typeof import("../../src/server/yz/islem.ts");
type Say = typeof import("../../src/server/yz/say.ts");

const OTURUM = { id: "11111111-1111-4111-8111-111111111111", ad: "Oturumdaki Kişi", roller: ["planlama" as const] };
const FIRMA = "22222222-2222-4222-8222-222222222222";
const SAHTE_DB = { sorgu: async () => ({ rows: [], rowCount: 0 }) } as unknown as Sorgulayici;
const ortam = { islet: async <T,>(is: (db: Sorgulayici) => Promise<T>) => is(SAHTE_DB), kim: OTURUM, firmaId: FIRMA, depo: () => { throw new Error("depo yok"); },
  kok: null, ekrandakiRapor: null, epostaGonder: () => undefined };
function katalog(m: Islem) {
  const cagrilar: { kim: unknown; firmaId: string; veri: unknown }[] = [];
  const l = [m.islem({ ad: "deneme_yaz", modul: 13, tarif: "Deneme.", tur: "yaz", girdi: z.object({ plan: kimlik, adet: z.number().int().min(1) }), kaynak: [kimlik],
    islev: () => undefined, calistir: async (b, veri) => { cagrilar.push({ kim: b.kim, firmaId: b.firmaId, veri }); return { tamam: true, bildirim: "Yapıldı." }; } })];
  return { l, cagrilar };
}

test("1. yürütücü şema doğrulamasını atlarsa şemaya uymayan girdi modül işlevine gider", async () => {
  const m = await bozuk<Islem>(ISLEM, "  if (!g.success) {\n", "  if (!g.success && false) {\n");
  const k = katalog(m);
  await m.islemYurut(k.l, ortam, "deneme_yaz", { plan: "kimlik-degil", adet: 0 });
  assert.equal(k.cagrilar.length, 1, "bozuk: geçersiz girdiyle çalıştırıcı çağrıldı");
});

test("2. yürütücü oturum yerine girdideki kimliğe güvenirse sahte kişi / firma işlemi yapar", async () => {
  const m = await bozuk<Islem>(ISLEM, "kim: o.kim, firmaId: o.firmaId,",
    "kim: (girdi as { kim?: never } | null)?.kim ?? o.kim, firmaId: (girdi as { firmaId?: never } | null)?.firmaId ?? o.firmaId,");
  const k = katalog(m);
  const sahte = { id: "99999999-9999-4999-8999-999999999999", ad: "Sahte", roller: ["firma_yoneticisi"] };
  await m.islemYurut(k.l, ortam, "deneme_yaz", { plan: "33333333-3333-4333-8333-333333333333", adet: 1, kim: sahte, firmaId: "baska-firma" });
  assert.deepEqual([k.cagrilar[0]?.kim, k.cagrilar[0]?.firmaId], [sahte, "baska-firma"], "bozuk: girdideki kimlik kullanıldı");
});

test("3. işlemin sonucu tool_result'a konmazsa S.A.Y kayıtları göremez (yalnız sayılar)", async () => {
  const m = await bozuk<Say>(SAY, "  if (typeof o.sonuc === \"string\") return o.sonuc;\n", "");
  const sonuc = JSON.stringify({ islem: "plan_ara", durum: "tamam", planlar: [{ id: "x", no: "P-1026-001" }] });
  assert.doesNotMatch(m.sonucIcerigi({ yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [], sonuc }), /P-1026-001/, "bozuk: bulunan plan S.A.Y'a gitmedi");
});

test("4. işlem araçları her istekte değilse başka sayfada iş yapılamaz (2026-10-23: araçların hepsi her istekte — sayAraclari)", async () => {
  const m = await bozuk<Say>(SAY, "[...ISLEM_ARACLARI, ...GORSEL_ARACLARI, FORM_ARACI, EKRAN_ARACI, ...RAPOR_ARACLARI, formatAraci, FORMAT_PDF_ARACI, ARAMA_ARACI]", "[...GORSEL_ARACLARI, FORM_ARACI, EKRAN_ARACI, ...RAPOR_ARACLARI, formatAraci, FORMAT_PDF_ARACI, ARAMA_ARACI]");
  const g = m.sayIstegi({ model: "haiku", sistem: "s", araclar: m.sayAraclari({ name: "formati_duzenle" }), mesajlar: [{ role: "user", content: "plan aç" }] })
    .govde as { tools: { name: string }[] };
  assert.ok(!g.tools.some((t) => t.name === "islem"), "bozuk: işlem aracı yok");
});

const EYLEM = oku("src/modules/say/server/dongu.ts"), SUNUCU = oku("src/modules/say/server/say.ts");
const eylemBozuk = (eski: string, yeni: string) => {
  assert.ok(EYLEM.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  assert.deepEqual(sayEylemDenetimi(EYLEM, SUNUCU), [], "bozulmamış kaynak geçer");
  return sayEylemDenetimi(EYLEM.replace(eski, () => yeni), SUNUCU);
};

test("5. işlemin ortamı oturum yerine girdiden kurulursa denetim düşer", () => {
  const b = eylemBozuk("kim: o, firmaId: o.kiraci.firmaId,", "kim: (ham as never as { kim?: never })?.kim ?? o, firmaId: o.kiraci.firmaId,");
  assert.ok(b.some((x) => /oturumdan değil|girdisinden/.test(x)), `bozuk: girdideki kişi kullanıldı — ${b.join(" | ")}`);
});

test("6. ekranın getirdiği sonuçlar yürütücüden geçerse denetim düşer", () => {
  const b = eylemBozuk("  for (const c of komutlar) {", "  for (const c of [...(sonuclarEkran as never[]), ...komutlar]) {");
  assert.ok(b.some((x) => /ekranın sonuçları yeniden/.test(x)), `bozuk: ekranın sonuçları yeniden çalıştı — ${b.join(" | ")}`);
});

test("7. ekran aracından sonraki işlem beklemeden çalışırsa (sıra) denetim düşer", () => {
  const b = eylemBozuk("if (ekranda) { sonuclar[c.id] = sonucIcerigi(islemOzeti(", "if (false) { sonuclar[c.id] = sonucIcerigi(islemOzeti(");
  assert.ok(b.some((x) => /sıra/.test(x)), `bozuk: S.A.Y'ın sırası bozuldu — ${b.join(" | ")}`);
});

test("8. girdiye modülün şemasının alanları elle kopyalanırsa alan denetimi düşer", async () => {
  const MUSTERI = kaynak("src/modules/musteriler/say-islemleri.ts");
  const izinli = [MusteriGirdisi, TesisGirdisi, kimlik, surum, SuzgecDurumuSemasi];
  type Mod = { SAY_ISLEMLERI: readonly { ad: string; girdi: unknown }[] };
  const dogru = await bozuk<Mod>(MUSTERI, "alanlar: MusteriGirdisi.partial(),", "alanlar: MusteriGirdisi.partial(),");
  assert.deepEqual(islemAlanlariDenetimi(dogru.SAY_ISLEMLERI, izinli, SAY_ELLE_ALANLAR), [], "bozulmamış kaynak geçer");
  const m = await bozuk<Mod>(MUSTERI, "alanlar: MusteriGirdisi.partial(),",
    "alanlar: z.object({ unvan: z.string(), kisa: z.string(), vd: z.string(), vno: z.string(), eposta: z.string(), tel: z.string(), ilgili: z.string() }).partial(),");
  const b = islemAlanlariDenetimi(m.SAY_ISLEMLERI, izinli, SAY_ELLE_ALANLAR);
  assert.ok(b.some((x) => x.startsWith("musteri_kaydet.alanlar:")), `bozuk: elle kopyalanan alanlar kilitten geçti — ${b.join(" | ")}`);
});
