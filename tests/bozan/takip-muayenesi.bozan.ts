/* OLUMSUZ KANIT — tests/takip-muayenesi.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): metinler bellekte bozulur.
   1. Göç "devam"ı vermezse takipte giderilmeyen madde müşteriye "Giderildi" görünür. 2. Ayar imzalı sürümden SONRA konursa tetik görmez — aynı sonuç.
   3. Müşteri listesi "devam"ı süzmezse aynı uygunsuzluk iki satır olur. 4. Saha ekranı durumu canlı kusurdan hesaplamazsa uzman değişikliği görmez. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KURALLAR } from "../takip-muayenesi.test.ts";
import { oku } from "../yardimci/denetimler.ts";

test("1. göçte 'devam' dalı yoksa kilit düşer", () => {
  assert.equal(KURALLAR.goc(oku("src/server/db/gocler/0108_takip_muayenesi.sql").replace("WHEN u.ref = ANY (d) THEN 'devam' ", "")), false);
});
test("2. ayar imzalı sürümden sonra konunca kilit düşer", () => {
  const r = oku("src/modules/raporlar/server/raporlar.ts");
  const satir = r.slice(r.indexOf("  await db.sorgu(\"SELECT set_config('app.devam_ref'"), r.indexOf("\n", r.indexOf("SELECT set_config('app.devam_ref'")) + 1);
  const bozuk = r.replace(satir, "").replace("  if (d) {\n    const blok =", `${satir}  if (d) {\n    const blok =`);
  assert.notEqual(bozuk, r);
  assert.equal(KURALLAR.imza(bozuk), false);
});
test("3. müşteri listesi 'devam'ı süzmeyince kilit düşer", () => {
  assert.equal(KURALLAR.musteri(oku("src/modules/raporlar/server/musteri-baglanti.ts").replace("WHERE u.kapanis IS DISTINCT FROM 'devam'", "")), false);
});
test("4. saha ekranı canlı kusur listesini kullanmayınca kilit düşer", () => {
  assert.equal(KURALLAR.ekran(oku("src/modules/planlar/ui/EkipmanBolumu.tsx"),
    oku("src/modules/raporlar/ui/SahaRaporu.tsx").replace("new Set(d.kusurlar.map((k) => k.ref))", "new Set<string>()")), false);
});
