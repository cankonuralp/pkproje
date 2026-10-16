/* OLUMSUZ KANIT — tests/sartli-uygun.test.ts neyi koruyor (sunum 595 madde 12). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup
   geçici klasörden içe aktarılır.
   1. Öneri şartlı uygunu bilmeseydi yalnız hafif kusurlu ekipmana da "Uygun değil" önerilirdi.
   2. Belge sonucun sözcüğünü üç değerden seçmeseydi şartlı uygun raporda sonuç boş ("-") basılırdı.
   3. Seçenek kapanınca sözcüğü kalsaydı format "değişmiş" sayılırdı (Bakanlık formatında boşuna yayın uyarısı).
   4. S.A.Y seçeneğin açık olduğuna bakmasaydı seçeneği olmayan formattaki rapora "şartlı uygun" yazardı (onaya gönderde reddedilecek sonuç). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";
import { sartliYaz } from "../../src/modules/rapor-format/kurucu.ts";
import { ilkCevaplar } from "../../src/modules/raporlar/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "sartli-uygun-bozan-"));
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
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);

test("1: öneri şartlı uygunu bilmeyince hafif kusura da 'Uygun değil' önerir", async () => {
  const m = await bozuk<typeof import("../../src/format/motor.ts")>("src/format/motor.ts",
    "    : sartliAcik(t) && t.kurallar.derece && !kusurlar.some((k) => k.agir) ? \"sartli\" : \"uygun_degil\";", "    : \"uygun_degil\";");
  const t0 = Z2(), lb = t0.bolumler[yer(t0, "liste")] as BolumOf<"liste">, md = lb.gruplar[0].maddeler[0];
  const t = FormatTanimi.parse({ ...sartliYaz(t0, yer(t0, "sonuc"), true), kurallar: { ...t0.kurallar, oneri: true, derece: true } });
  const c = Cevaplar.parse({ ...ilkCevaplar(t), madde: { ...ilkCevaplar(t).madde, [md.id]: { c: lb.cevaplar[1], not: "Deneme", derece: "hafif" } } });
  assert.equal(m.degerlendir(t, c).oneri, "uygun_degil", "bozuk: şartlı önerdi");
});

test("2: belge sözcüğü üç değerden seçmeyince şartlı uygun raporda sonuç boş basılır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "h(\"b\", null, sonucSozcugu(b, v.sonuc) ?? \"-\")",
    "h(\"b\", null, v.sonuc === \"uygun\" ? \"uygundur\" : v.sonuc === \"uygun_degil\" ? \"uygun değildir\" : \"-\")");
  const t = FormatTanimi.parse(sartliYaz(Z2(), yer(Z2(), "sonuc"), true));
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, sonuc: "sartli" }) as never);
  assert.equal(h.includes("şartlı uygundur"), false, "bozuk: sözcük basıldı");
});

test("3: seçenek kapanınca sözcüğü kalırsa tanım eskisine dönmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "  if (acik) y.sartli = true; else { delete y.sartli; delete y.sartliMetin; }", "  if (acik) y.sartli = true; else delete y.sartli;");
  const t = Z2(), s = yer(t, "sonuc");
  const y = m.bolumBasligiYaz(m.sartliYaz(t, s, true), s, "sartli", "ŞARTLI");
  assert.notEqual(JSON.stringify(m.sartliYaz(y, s, false)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});

test("4: S.A.Y seçeneğin açıklığına bakmayınca kapalı formattaki rapora 'şartlı uygun' yazar", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/say-doldur.ts")>("src/modules/raporlar/say-doldur.ts",
    "      if (v === \"sartli\" && sonucVar && !sartliVar) { red(\"bu formatta “şartlı uygun” seçeneği yok\", \"Sonuç\"); continue; }", "");
  const t = Z2();
  const u = m.komutlariUygula({ ekipman: {}, cevaplar: ilkCevaplar(t) }, t, [{ yer: "sonuc", deger: "şartlı uygun" }]);
  assert.equal(u.durum.cevaplar.sonuc, "sartli", "bozuk: yazılmadı");
});
