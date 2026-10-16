/* OLUMSUZ KANIT — tests/imza-satirlari.test.ts neyi koruyor (sunum 595 madde 1: imza bölümünün satırları formatın, değeri kişinin kaydından).
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Belgede teknik yönetici satırının değeri onaylayanın kaydı yerine raporu yazanınkinden alınsaydı teknik yöneticinin diploma no satırında
      muayene uzmanının diploma numarası basılırdı (yanlış kişinin bilgisi imzalı belgeye girerdi).
   2. Bakanlık özünde imza satırları olmasaydı Bakanlık imza bölümünün satırı çıkarılınca yayında uyarı çıkmazdı.
   3. Şemanın imza satırı kuralı olmasaydı serbest satıra kişi bilgisi, uzmana onay zamanı yazılabilirdi (değeri olmayan satır). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { imzaSatirlari } from "../../src/format/duzen.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";
import type { BelgeVerisi } from "../../src/belge/veri.ts";
import { imzaSatiriEkle, imzaSatiriSil } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "imza-satirlari-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  /* göreli yol mutlak dosya adresine, paket adı (react, zod) bu dosyanın çözdüğü adrese — geçici klasörde node_modules yok */
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const imzaYeri = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "imza");

test("1: teknik yönetici satırı onaylayanın kaydı yerine yazanınkinden okununca teknik diploma satırında uzmanın numarası basılır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "kisiDegeri(v.onay.kisi, s.alan)", "kisiDegeri(v.yazan, s.alan)");
  const t = imzaSatiriEkle(KOMP(), imzaYeri(KOMP()), "teknik", "diploma", "Teknik yöneticinin diploma no").t;
  const v: BelgeVerisi = {
    firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2 }, no: "DA-1026-001-abcde", revizyon: 0, formatSira: 1, durum: "onaylandi",
    tur: { ad: "Hava tankı", kod: "HT", kontrolStd: [] }, kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: null, sgk: null, isgNo: null },
    tarih: { bas: null, bit: null, sonraki: null, takip: null, rapor: null },
    ekipman: { kod: "HT-1", marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tanim: t, cevaplar: Cevaplar.parse({}), cihazlar: [], fotolar: [], sonuc: "uygun",
    yazan: { ad: "Deneme Bir", meslek: "mak-muh", ekipnet: "123", diploma: "D-1", oda: null },
    onay: { ad: "Deneme Teknik", zaman: "2026-10-05T08:00:00.000Z", kisi: { meslek: "mak-muh", ekipnet: "456", diploma: "TD-9", oda: null } }, imza: null,
  };
  const h = renderToStaticMarkup(m.raporBelgesi(v) as never).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.ok(h.includes("Teknik yöneticinin diploma no D-1") && !h.includes("TD-9"), "bozuk: teknik yöneticinin satırında uzmanın diploması");
});

test("2: Bakanlık özünde imza satırları olmayınca Bakanlık imza bölümünden satır çıkarmak yayında uyarı vermez", async () => {
  const m = await bozuk<typeof import("../../src/format/motor.ts")>("src/format/motor.ts",
    `  ...(b.blok === "imza" ? { imza: imzaSatirlari(b).map((x) => ({ ad: x.ad, kim: x.kim, alan: x.alan, metin: x.metin, tam: x.tam })) } : {}),`, "");
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), i = imzaYeri(z);
  const cikan = imzaSatiriSil(z, i, imzaSatirlari(z.bolumler[i] as BolumOf<"imza">).at(-1)!.id);
  assert.deepEqual(m.kilitDenetimi(cikan, z), [], "bozuk: Bakanlık imza satırı çıktı, uyarı yok");
});

test("3: şemanın imza satırı kuralı kalkınca serbest satıra kişi bilgisi, uzmana onay zamanı yazılır", async () => {
  const m = await bozuk<typeof import("../../src/format/tanim.ts")>("src/format/tanim.ts",
    `      if (s.kim === "diger" ? s.alan !== undefined : s.alan === undefined || !imzaAlanlari(s.kim).includes(s.alan)) {`, "      if (false) {");
  const t = KOMP(), i = imzaYeri(t);
  const ile = (satirlar: unknown[]) => ({ ...t, bolumler: t.bolumler.map((b, j) => (j === i ? { ...b, satirlar } : b)) });
  assert.equal(m.FormatTanimi.safeParse(ile([{ id: "k_i1", ad: "X", kim: "diger", alan: "ad" }, { id: "k_i2", ad: "Y", kim: "uzman", alan: "zaman" }])).success, true,
    "bozuk: değeri olmayan satır şemadan geçti");
});
