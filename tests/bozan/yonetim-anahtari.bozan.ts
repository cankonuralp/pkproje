/* OLUMSUZ KANIT — tests/yonetim-anahtari.test.ts (FIRMA-VT FV8) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): gerçek dosyalar bellekte
   okunur, bir satır eklenir, kilidin denetim işlevine verilir; her bozma yakalanmalı.
   1. Bir sayfa / modül yönetim anahtarının ortam adını okuyunca yakalanır (yorumdaki söz sayılmaz).
   2. Bir modül ya da sayfa Yönetim API istemcisini içe aktarınca (statik, dinamik) yakalanır.
   3. İzin listesindeki dosya içe aktarmayı bırakınca yakalanır (liste tam kalır).
   4. Göç dağıtıcı istemciyi / uygula kipini statik içe aktarınca (uygulamanın paketine girer) yakalanır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dagitStatikYukleme, dosyalar, oku, yonetimAnahtariEksikleri } from "../yardimci/denetimler.ts";

const temel = [...dosyalar("src", [".ts", ".tsx", ".mts", ".js", ".mjs"]), ...dosyalar("scripts", [".ts", ".mts", ".js", ".mjs"])].map((ad) => ({ ad, metin: oku(ad) }));
const ekle = (ad: string, satir: string) => {
  assert.ok(temel.some((d) => d.ad === ad), `dosya yok: ${ad}`);
  return temel.map((d) => (d.ad === ad ? { ...d, metin: `${satir}\n${d.metin}` } : d));
};

test("1. sayfa / modül yönetim anahtarının ortam adını okuyunca yakalanır (kilidin koruduğu açık)", () => {
  assert.deepEqual(yonetimAnahtariEksikleri(temel), [], "sağlam");
  for (const [ad, satir] of [
    ["src/modules/firma-ayarlari/server/ayarlar.ts", "const pat = process.env.PROBATA_SUPABASE_YONETIM_ANAHTARI;"],
    ["src/app/api/islem/route.ts", 'const r = process.env["PROBATA_RESEND_ANAHTARI"];'],
  ] as const) {
    assert.ok(yonetimAnahtariEksikleri(ekle(ad, satir)).some((b) => b.startsWith(`${ad}: yönetim anahtarının ortam adı`)), `bozuk: ${ad}`);
  }
  assert.deepEqual(yonetimAnahtariEksikleri(ekle("src/server/db/havuz.ts", "/* PROBATA_SUPABASE_YONETIM_ANAHTARI burada okunmaz */")), [], "yorum sayılmaz");
});

test("2. modül / sayfa Yönetim API istemcisini içe aktarınca yakalanır (kilidin koruduğu açık)", () => {
  for (const [ad, satir] of [
    ["src/modules/yonetim/server/yonetim.ts", 'import { supabaseYonetimi } from "../../../server/dis/supabase-yonetim.ts";'],
    ["src/app/(uygulama)/page.tsx", 'const m = await import("../../server/dis/supabase-yonetim");'],
  ] as const) {
    assert.ok(yonetimAnahtariEksikleri(ekle(ad, satir)).includes(`${ad}: dış hizmet istemcisini izinsiz içe aktarıyor`), `bozuk: ${ad}`);
  }
});

test("3. izin listesindeki dosya içe aktarmayı bırakınca yakalanır (kilidin koruduğu açık)", () => {
  const ad = "src/server/db/goc-uygula.ts";
  const bozuk = temel.map((d) => (d.ad === ad ? { ...d, metin: d.metin.replace(/^import .*supabase-yonetim\.ts";$/m, "") } : d));
  assert.notDeepEqual(bozuk.find((d) => d.ad === ad)!.metin, temel.find((d) => d.ad === ad)!.metin, "bozulacak satır kaynakta");
  assert.ok(yonetimAnahtariEksikleri(bozuk).includes(`${ad}: izin listesinde ama içe aktarmıyor (liste tam olmalı)`), "bozuk: ölü izin");
});

test("4. göç dağıtıcı istemciyi ya da uygula kipini statik içe aktarınca yakalanır (kilidin koruduğu açık)", () => {
  const m = oku("src/server/db/goc-dagit.ts");
  assert.deepEqual(dagitStatikYukleme(m), [], "sağlam");
  const statik = m.replace('import type { SupabaseYonetimi } from "../dis/supabase-yonetim.ts";', 'import { supabaseYonetimi, type SupabaseYonetimi } from "../dis/supabase-yonetim.ts";');
  assert.notEqual(statik, m, "bozulacak satır kaynakta");
  assert.ok(dagitStatikYukleme(statik).includes("statik içe aktarma: ../dis/supabase-yonetim.ts"), "bozuk: statik istemci");
  const dinamiksiz = m.replace('const { gocUygula } = await import("./goc-uygula.ts");', "");
  assert.notEqual(dinamiksiz, m, "bozulacak satır kaynakta");
  assert.ok(dagitStatikYukleme(dinamiksiz).includes("uygula kipi dinamik yüklenmiyor"), "bozuk: dinamik yükleme kalktı");
});
