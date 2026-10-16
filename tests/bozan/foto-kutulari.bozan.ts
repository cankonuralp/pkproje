/* OLUMSUZ KANIT — tests/foto-kutulari.test.ts neyi koruyor (sunum 595 madde 16). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Belge fotoğraf bölümünde kutunun fotoğrafını almasaydı "Etiket" kutusuna çekilen fotoğraf PDF'te görünmezdi.
   2. Ekteki madde fotoğrafları kutu fotoğrafını ayırmasaydı fotoğraf bir de "Kontrol maddelerinin fotoğrafları" ekinde çıkardı.
   3. Parça kopyası kutulara yeni kimlik vermeseydi kopya eklenince tanım şemadan geçmezdi (aynı kimlik iki kez).
   4. Son kutu çıkınca boş liste kalsaydı format "değişmiş" sayılırdı (Bakanlık formatında boşuna uyarı). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { fotoKutusuEkle } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "foto-kutulari-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "foto");
const kutulu = () => { const t = Z2(), f = yer(t), e = fotoKutusuEkle(t, f, "Etiket"); return { t: e.t, f, id: e.id! }; };
type Belge = typeof import("../../src/belge/belge.ts");

test("1: belge kutunun fotoğrafını almayınca kutuya çekilen fotoğraf PDF'te yok", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", "v.fotolar.filter((f) => f.bolum === b.id && (!f.madde || sira.has(f.madde)))", "v.fotolar.filter((f) => f.bolum === b.id && !f.madde)");
  const { t, f, id } = kutulu();
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, fotolar: [{ ad: "IMG_1.jpg", bolum: t.bolumler[f].id, madde: id, src: null }] }) as never);
  assert.equal(h.includes("<figcaption>Etiket</figcaption>"), false, "bozuk: kutu fotoğrafı basıldı");
});

test("2: ekteki madde fotoğrafları kutu fotoğrafını ayırmayınca fotoğraf ekte de çıkar", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", "  const maddeFotolari = v.fotolar.filter((f) => f.madde && !kutuAdi.has(f.madde));", "  const maddeFotolari = v.fotolar.filter((f) => f.madde);");
  const { t, f, id } = kutulu();
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, fotolar: [{ ad: "IMG_1.jpg", bolum: t.bolumler[f].id, madde: id, src: null }] }) as never);
  assert.ok(h.includes("Kontrol maddelerinin fotoğrafları"), "bozuk: ek çıkmadı");
});

test("3: parça kopyası kutulara yeni kimlik vermeyince kopya tanımdan geçmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/yapboz.ts")>("src/modules/rapor-format/yapboz.ts",
    "  else if (b.blok === \"foto\") k = { ...b, ...(b.kutular ? { kutular: b.kutular.map((x) => ({ ...x, id: yeni(\"k\") })) } : {}) };", "");
  const { t, f } = kutulu();
  const k = m.parcaKopyasi(t, t.bolumler[f]);
  assert.ok(k);
  assert.equal(FormatTanimi.safeParse({ ...t, bolumler: [...t.bolumler, k] }).success, false, "bozuk: geçti");
});

test("4: son kutu çıkınca boş liste kalırsa tanım eskisine dönmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "  if (kutular.length) y.kutular = kutular; else delete y.kutular;", "  y.kutular = kutular;");
  const t = Z2(), f = yer(t), e = m.fotoKutusuEkle(t, f, "Etiket");
  assert.notEqual(JSON.stringify(m.fotoKutusuSil(e.t, f, e.id!)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});
