/* OLUMSUZ KANIT — tests/yedek-saf.test.ts, tests/bulut-istemci.test.ts ve tests/yedek.test.ts (2026-11-03, firmanın kendi yedeği) neyi koruyor. Kaynak
   diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göç ve liste bellekte bozulur, kilidin denetim işlevine verilir; istemci taklitle bozuk davranışa sokulur.
   1. Göçün tetik listesinden bir tablo düşünce (yedeğe girmeyen tablo) yakalanır.
   2. Gizli sütun (parola özeti) göçten düşünce yakalanır — parola özeti yedeğe girerdi.
   3. Bir tablo hem yedekte hem dışında sayılınca yakalanır.
   4. Yeni bir dosya modülü yedekte sınıflanmayınca yakalanır (dosya ne yedeğe girer ne gerekçesi yazılır).
   5. Google Drive: dosyayı ararken kayıtlı yer olmasa da aynı adlı dosya BULUNMAZSA (bozuk arama) ikinci yükleme kopya dosya açar — kilidin
      "kopya yok" denetimi bunu görür.
   6. İstemci test ucunu yerel olmayan adrese açarsa (anahtar başka sunucuya gider) ayar reddeder.
   7. (2026-11-04, 0118) Drive taşımasının şartlarından biri (Drive bağlı, 1 yıl, güncel değil, Drive'da bulundu) ya da müşteri politikasının güncel
      rapor şartı düşünce yakalanır. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { DOSYA_ERISIMI } from "../../src/server/dosya/erisim.ts";
import { bulutAyari, bulutHizmeti, type YerDeposu } from "../../src/server/dis/bulut.ts";
import { YEDEK_DISI, YEDEK_TABLOLARI } from "../../src/server/yedek/tablolar.ts";
import { BELGE_KLASORU, YEDEK_DISI_DOSYA } from "../../src/server/yedek/yol.ts";
import { bekletmeEksikleri, yedekDosyaFarki, yedekListeFarki } from "../yardimci/denetimler.ts";
import { sahteBulutKur, sahteBulutOrtami, type SahteBulut } from "../yardimci/sahte-bulut.ts";

const goc = readFileSync(new URL("../../src/server/db/gocler/0117_yedek.sql", import.meta.url), "utf8");
let t: SahteBulut;
before(async () => { t = await sahteBulutKur(); });
after(async () => { await t?.kapat(); });

test("1. göçün tetik listesinden tablo düşünce yakalanır (kilidin koruduğu açık)", () => {
  assert.deepEqual(yedekListeFarki(goc, YEDEK_TABLOLARI, YEDEK_DISI), [], "sağlam");
  const bozuk = goc.replace("('rapor_surumu', ''), ", "");
  assert.notEqual(bozuk, goc, "bozulacak satır kaynakta");
  assert.ok(yedekListeFarki(bozuk, YEDEK_TABLOLARI, YEDEK_DISI).includes("rapor_surumu: göçte tetik yok"));
});

test("2. parola özeti gizli sütunlardan düşünce yakalanır (kilidin koruduğu açık)", () => {
  const bozuk = goc.replace("('hesap', 'parola_ozeti')", "('hesap', '')");
  assert.notEqual(bozuk, goc, "bozulacak satır kaynakta");
  assert.ok(yedekListeFarki(bozuk, YEDEK_TABLOLARI, YEDEK_DISI).includes("hesap: gizli sütunlar göçle aynı değil"));
});

test("3. tablo hem yedekte hem dışında sayılınca yakalanır (kilidin koruduğu açık)", () => {
  assert.ok(yedekListeFarki(goc, YEDEK_TABLOLARI, { ...YEDEK_DISI, musteri: "deneme" }).includes("musteri: hem yedekte hem dışında"));
});

test("4. yeni dosya modülü sınıflanmayınca yakalanır (kilidin koruduğu açık)", () => {
  const moduller = Object.keys(DOSYA_ERISIMI);
  assert.deepEqual(yedekDosyaFarki(moduller, Object.keys(BELGE_KLASORU), Object.keys(YEDEK_DISI_DOSYA)), [], "sağlam");
  assert.ok(yedekDosyaFarki([...moduller, "yeni_belge"], Object.keys(BELGE_KLASORU), Object.keys(YEDEK_DISI_DOSYA)).includes("yeni_belge: dosya modülü yedekte sınıflanmamış"));
  const belge = Object.keys(BELGE_KLASORU).filter((x) => x !== "is_sozlesmesi");
  assert.ok(yedekDosyaFarki(moduller, belge, Object.keys(YEDEK_DISI_DOSYA)).includes("is_sozlesmesi: dosya modülü yedekte sınıflanmamış"), "imzalı sözleşme yedekten düşerdi");
});

test("5. Google Drive: aynı adlı dosya bulunmazsa kopya açılır — kilidin 'kopya yok' denetimi görür (kilidin koruduğu açık)", async () => {
  const h = bulutHizmeti(bulutAyari("gdrive", sahteBulutOrtami(t))!, { bekle: async () => undefined });
  const { createHash, randomBytes } = await import("node:crypto");
  const dog = randomBytes(48).toString("base64url");
  const l = new URL((await fetch(h.izinAdresi("deneme.x", createHash("sha256").update(dog).digest("base64url")), { redirect: "manual" })).headers.get("location")!);
  const k = await h.kodTakas(l.searchParams.get("code")!, dog);
  const bos = (): YerDeposu => { const m = new Map<string, string>(); return { async al(y) { return m.get(y) ?? null; }, async koy(y, id) { m.set(y, id); }, async sil() { m.clear(); } }; };
  const y = { yol: ["probata yedek", "Bozan"], ad: "a.pdf", bayt: Buffer.from("x"), tur: "application/pdf" };
  await h.yukle(k.erisim, y, bos());
  /* sağlam: yer deposu boş olsa da Drive'da aranır, kopya yok */
  await h.yukle(k.erisim, y, bos());
  const sayi = () => [...t.drive.values()].filter((x) => x.ad === "a.pdf").length;
  assert.equal(sayi(), 1, "sağlam");
  /* bozuk: taklit aramayı hep boş döndürsün (arama bozulmuş gibi) → ikinci yükleme kopya açar */
  t.hatalar.push({ yontem: "GET", yol: /^\/google\/drive\/v3\/files$/, durum: 200, govde: { files: [] }, kez: 100 });
  try { await h.yukle(k.erisim, y, bos()); } finally { t.hatalar.length = 0; }
  assert.ok(sayi() > 1, "kopya yakalandı");
});

test("6. test ucu yerel olmayan adrese açılınca ayar reddeder (kilidin koruduğu açık)", () => {
  assert.throws(() => bulutAyari("gdrive", { ...sahteBulutOrtami(t), PROBATA_BULUT_UC: "http://saldirgan.example:8080" }), /yalnız yerel/);
});

test("7. (0118) Supabase'ten Drive'a taşımanın bir şartı düşünce yakalanır — Drive'da olmayan / güncel / 1 yıldan yeni raporun dosyası silinirdi", () => {
  const g = readFileSync(new URL("../../src/server/db/gocler/0118_yedek_bekletme.sql", import.meta.url), "utf8");
  assert.deepEqual(bekletmeEksikleri(g), [], "sağlam");
  const boz = (eski: string, yeni: string) => { assert.ok(g.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 50)}`); return bekletmeEksikleri(g.replace(eski, yeni)); };
  assert.ok(boz("AND q.denetlendi > now() - interval '1 hour'))", "))").includes("Drive'da bulunma şartı yok"));
  assert.ok(boz("WHERE b.firma_id = p_firma AND b.durum = 'bagli')", "WHERE b.firma_id = p_firma)").includes("Drive bağlı şartı yok"));
  assert.ok(boz("AND rapor_guncel_mu(s.id))", ")").includes("güncel rapor şartı yok"));
  assert.ok(boz("AND s.imzalandi > now() - interval '1 year')", ")").includes("1 yıl şartı yok"));
  assert.ok(boz("AND rapor_guncel_mu(id));", ");").includes("müşteri güncel rapor şartı yok"));
});
