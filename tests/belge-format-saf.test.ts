/* NEREDEN GELDİ: 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız") — veritabanısız
   parçalar: göç 0104'ün belge listesi src/belge/katalog.ts BELGE_TURLERI ile aynı (yeni belge eklenip göç unutulursa düşer); basılı formdan belge
   şablonu (server/belgeler.ts basiliBelgeye): basili.ts'in rapor için eklediği bölümler (Sonuç, Muayene uzmanı, Fotoğraflar) ve raporun cihaz /
   uygunsuzluk / fotoğraf bölümleri belgeye girmez; başlık belgenin adı; raporun kayıt bilgisi belgenin ortak alanına bağlanır; serbest düzen.
   Veritabanı kısmı: tests/belge-format.test.ts.
   2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı"): belge listesi
   SON göçün kısıtından (0105 "sozlesme"yi ekledi; yeni belge her seferinde yeni göçle) — belge_format ve belge_doldurma kısıtları ikisi de. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { BELGE_TURLERI } from "../src/belge/katalog.ts";
import { FormatTanimi, type Hucre } from "../src/format/tanim.ts";
import { basilidanTanim } from "../src/modules/rapor-format/basili.ts";
import { basiliBelgeye } from "../src/modules/rapor-format/server/belgeler.ts";

/** kısıtı kuran SON göçün belge listesi (göçler sırayla uygulanır — en son kuran geçerli) */
function sonListe(kisit: string): { goc: string; liste: string[] } | null {
  const klasor = fileURLToPath(new URL("../src/server/db/gocler/", import.meta.url));
  const desen = new RegExp(`CONSTRAINT ${kisit}` + String.raw`\s+CHECK \(belge IN \(([^)]*)\)\)`);
  let son: { goc: string; liste: string[] } | null = null;
  for (const goc of readdirSync(klasor).filter((x) => x.endsWith(".sql")).sort()) {
    const m = desen.exec(readFileSync(`${klasor}${goc}`, "utf8"));
    if (m) son = { goc, liste: m[1].split(",").map((x) => x.trim().replace(/^'|'$/g, "")) };
  }
  return son;
}

test("son göçün belge listesi BELGE_TURLERI ile aynı (belge_format ve belge_doldurma)", () => {
  for (const kisit of ["belge_format_belge_check", "belge_doldurma_belge_check"]) {
    const s = sonListe(kisit);
    assert.ok(s, `${kisit} bulunamadı`);
    assert.deepEqual(s.liste, [...BELGE_TURLERI], `${kisit} (${s.goc})`);
  }
  assert.ok(BELGE_TURLERI.includes("sozlesme"), "sözleşme belgesi");
});

const hucre = (metin: string, ek: Partial<Record<string, unknown>> = {}) => ({ metin, tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1, kaynak: "yok", ...ek });
const HAM = {
  cevap: "", baslik: "", formKodu: "", altYazi: "", yazi: { tip: "carlito", boy: 9 },
  bolumler: [
    { ad: "Form", tur: "tablo", yan: false, oran: 0, sutunlar: [40, 60], cevaplar: [], satirlar: [
      { tekrar: false, yukseklik: 0, hucreler: [hucre("Firma"), hucre("", { tur: "kayit", kaynak: "firma" })] },
      { tekrar: false, yukseklik: 0, hucreler: [hucre("Muayene uzmanı"), hucre("", { tur: "kayit", kaynak: "uzman_ad", kalin: true })] },
      { tekrar: false, yukseklik: 0, hucreler: [hucre("Tarih"), hucre("", { tur: "kayit", kaynak: "rapor_tarihi" })] },
    ] },
    { ad: "Ölçüm cihazları", tur: "cihaz", yan: false, oran: 0, sutunlar: [], cevaplar: [], satirlar: [] },
    { ad: "Fotoğraf", tur: "foto", yan: false, oran: 0, sutunlar: [], cevaplar: [], satirlar: [] },
  ],
};

test("basılı formdan belge şablonu: raporun bölümleri çıkar, başlık belgenin adı, kayıt bilgisi belgenin alanına; şemadan geçer", () => {
  const c = basilidanTanim(HAM, "Zimmet Teslim Formu");
  assert.ok(c, "çeviri");
  /* basili.ts rapor için ekledi (önkoşul — değişirse buradaki imza da güncellenir) */
  assert.ok(c.tanim.bolumler.some((b) => b.ad === "Sonuç") && c.tanim.bolumler.some((b) => b.ad === "Muayene uzmanı"), c.tanim.bolumler.map((b) => b.ad).join(", "));
  assert.equal(c.tanim.gorunum.baslik, "Zimmet Teslim Formu Periyodik Kontrol Raporu");

  const t = basiliBelgeye(c.tanim, "Zimmet Teslim Formu");
  assert.deepEqual(t.bolumler.map((b) => [b.ad, b.blok]), [["Form", "tablo"]], "yalnız formun kendi tablosu");
  assert.equal(t.gorunum.baslik, "Zimmet Teslim Formu");
  assert.equal(t.gorunum.serbest, true);
  const tb = t.bolumler[0];
  assert.ok(tb.blok === "tablo");
  const deger = (r: number): Partial<Hucre> | undefined => {
    const h = tb.hucreler.find((x) => x.r === r && x.c === 1);
    return h && { tur: h.tur, kaynak: h.kaynak, veri: h.veri };
  };
  assert.deepEqual(deger(0), { tur: "kayit", kaynak: undefined, veri: "firma_ad" }, "firma → belgenin firma adı");
  assert.deepEqual(deger(1), { tur: "yazi", kaynak: undefined, veri: undefined }, "raporun uzmanı belgede yok → boş hücre");
  assert.equal(tb.hucreler.find((x) => x.r === 1 && x.c === 1)?.s?.k, true, "boş hücre görünümünü korur");
  assert.deepEqual(deger(2), { tur: "kayit", kaynak: undefined, veri: "tarih" });
  const s = FormatTanimi.safeParse(t);
  assert.ok(s.success, s.success ? "" : JSON.stringify(s.error.issues.slice(0, 3)));

  /* formun kendi başlığı korunur */
  const c2 = basilidanTanim({ ...HAM, baslik: "ZİMMET TESLİM TUTANAĞI" }, "Zimmet Teslim Formu")!;
  assert.equal(basiliBelgeye(c2.tanim, "Zimmet Teslim Formu").gorunum.baslik, "ZİMMET TESLİM TUTANAĞI");
});
