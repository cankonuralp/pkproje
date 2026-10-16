/* NEREDEN GELDİ: FIRMA-VT.md §5.12, FV10 (2026-10-16) — kurulum makinesinin SAF parçaları (src/modules/yonetim/kurulum-adim.ts, server/kurulum-hata.ts).
   Kilitlenenler: adım sırası merkezdeki firma_kurulum'un CHECK'i ve firma_kurulum_ilerlet'in dizisiyle AYNI (0096 — adım yalnız aynı kalır ya da bir
   ileri); her adımın ekranda adı var; proje adı firmaya özgü ve Supabase'in ad kuralına uyar; hata sınıfı — yeniden denenen (429, 5xx, bağlantı,
   parola henüz geçmedi, zaman aşımı) ile kalıcı ("Sürdür" ister: 402, 401/403, biçim, sertifika, izin dışı sunucu, göç, INIT_FAILED, SQL) ayrımı;
   kayda giden metin SIRSIZ (sunucunun iletisi, anahtar, parola yok) ve veritabanının maskesinden DEĞİŞMEDEN geçer (0096 CHECK hata =
   kurulum_hata_maskele(hata)) — kodu bilinmeyen hata da. Gerçek PostgreSQL ile baştan sona: tests/firma-kurulum.test.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ADIM_ADI, adimSirasi, hataMetni, KURULUM, KURULUM_ADIMLARI, kurulumProjeAdi, sonrakiAdim } from "../src/modules/yonetim/kurulum-adim.ts";
import { hataSinifi } from "../src/modules/yonetim/server/kurulum-hata.ts";
import { BicimHatasi, YonetimHatasi } from "../src/server/dis/supabase-yonetim.ts";
import { maskele } from "../src/server/hata/maske.ts";

const GOC = readFileSync(new URL("../src/server/db/gocler/0096_merkez_kaydi.sql", import.meta.url), "utf8");

test("adım sırası 0096 ile aynı: firma_kurulum CHECK'i ve firma_kurulum_ilerlet dizisi", () => {
  const check = /adim\s+text NOT NULL DEFAULT 'proje' CHECK \(adim IN \(([^)]*)\)\)/.exec(GOC)?.[1];
  const dizi = /v_adimlar text\[\] := ARRAY\[([^\]]*)\]/.exec(GOC)?.[1];
  const ayir = (s: string | undefined) => (s ?? "").split(",").map((x) => x.trim().replace(/^'|'$/g, "")).filter(Boolean);
  assert.deepEqual(ayir(check), [...KURULUM_ADIMLARI]);
  assert.deepEqual(ayir(dizi), [...KURULUM_ADIMLARI]);
});

test("sonraki adım bir ileri; son adımın sonrası yok; her adımın ekranda adı var", () => {
  for (let i = 0; i < KURULUM_ADIMLARI.length - 1; i++) {
    assert.equal(sonrakiAdim(KURULUM_ADIMLARI[i]!), KURULUM_ADIMLARI[i + 1]);
    assert.equal(adimSirasi(KURULUM_ADIMLARI[i]!), i);
  }
  assert.throws(() => sonrakiAdim("tamam"));
  for (const a of KURULUM_ADIMLARI) assert.ok(ADIM_ADI[a]?.length > 2, a);
  assert.ok(KURULUM.butceMs < 60_000, "ilerletme bütçesi işlev süresinin altında");
  assert.ok(KURULUM.aralikMs >= 1_000 && KURULUM.enCokDeneme >= 3);
});

test("proje adı: firmaya özgü (kısa ad + kimliğin ilk 8'i), Supabase ad kuralına uyar", () => {
  const ad = kurulumProjeAdi("deneme-firma", "0f2c9a1e-1111-4222-8333-944444444444");
  assert.equal(ad, "probata-deneme-firma-0f2c9a1e");
  assert.match(ad, /^[a-z0-9-]{3,60}$/);
  assert.notEqual(ad, kurulumProjeAdi("deneme-firma", "1f2c9a1e-1111-4222-8333-944444444444"));
  assert.match(kurulumProjeAdi("a".repeat(30), "0f2c9a1e-1111-4222-8333-944444444444"), /^[a-z0-9-]{3,60}$/, "en uzun kısa adla da sınırda");
});

test("hata sınıfı: yeniden denenen ve kalıcı ayrı; kod kısa ve biçimli", () => {
  const ornek: [unknown, "yeniden" | "kalici", string][] = [
    [new YonetimHatasi(429, null), "yeniden", "oran_siniri"],
    [new YonetimHatasi(503, null), "yeniden", "sunucu"],
    [new YonetimHatasi(500, null), "yeniden", "sunucu"],
    [new YonetimHatasi(402, null), "kalici", "odeme"],
    [new YonetimHatasi(401, null), "kalici", "yetki"],
    [new YonetimHatasi(403, null), "kalici", "yetki"],
    [new YonetimHatasi(400, "42P07"), "kalici", "sql_42p07"],
    [new YonetimHatasi(404, null), "kalici", "istek_404"],
    [new BicimHatasi("havuzcu"), "kalici", "bicim"],
    [Object.assign(new Error("bağlantı reddedildi"), { code: "ECONNREFUSED" }), "yeniden", "baglanti"],
    [Object.assign(new Error("hazır değil"), { code: "57P03" }), "yeniden", "baglanti"],
    [Object.assign(new Error("parola"), { code: "28P01" }), "yeniden", "parola"],
    [Object.assign(new Error("sertifika"), { code: "SELF_SIGNED_CERT_IN_CHAIN" }), "kalici", "sertifika"],
    [Object.assign(new Error("izin"), { code: "42501" }), "kalici", "vt_42501"],
    [new Error("havuzcu izin listesinde değil"), "kalici", "sunucu_izin"],
    [new Error("göç uyumsuz: değiştirilmiş ya da koddan ileride"), "kalici", "goc"],
    [new Error("INIT_FAILED: proje açılamadı"), "kalici", "init_failed"],
    [new DOMException("The operation was aborted due to timeout", "TimeoutError"), "yeniden", "zaman"],
    [new Error("bilinmeyen bir şey"), "yeniden", "bilinmeyen"],
    ["metin hata", "yeniden", "bilinmeyen"],
  ];
  for (const [h, sinif, kod] of ornek) {
    const s = hataSinifi(h);
    assert.deepEqual(s, { sinif, kod }, String(h));
    assert.match(s.kod, /^[a-z0-9_]{1,40}$/, "0096 CHECK hata_kodu");
  }
});

test("hata metni sırsız ve maskeden değişmeden geçer (0096 CHECK); bilinen her kodun metni var; sunucunun iletisi metne girmez", () => {
  const kodlar = ["oran_siniri", "sunucu", "odeme", "yetki", "bicim", "baglanti", "parola", "sertifika", "sunucu_izin", "goc", "init_failed", "zaman",
    "bilinmeyen", "sql_42p07", "vt_42501", "istek_404"];
  for (const kod of kodlar) {
    const m = hataMetni({ sinif: "kalici", kod });
    assert.ok(m.length >= 1 && m.length <= 500, kod);
    assert.equal(maskele(m), m, `maske değiştirmez: ${kod}`);
    assert.doesNotMatch(m, /Hata \(/, `bilinen kodun kendi metni var: ${kod}`);
  }
  assert.equal(hataMetni({ sinif: "kalici", kod: "sql_42p07" }), "Veritabanı hatası (42P07).");
  /* sunucunun iletisi (sır taşıyabilir) hata sınıfından metne geçmez: metin yalnız koddan */
  const sizan = Object.assign(new Error("password authentication failed sbp_uydurmaDegerDegil 0123456789012"), { code: "28P01" });
  const m = hataMetni(hataSinifi(sizan));
  assert.doesNotMatch(m, /sbp_|password|0123456789/);
});
