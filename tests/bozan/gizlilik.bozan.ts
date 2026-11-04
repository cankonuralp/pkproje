/* OLUMSUZ KANIT — tests/gizlilik.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ: metinler bellekte bozulur, kilidin denetim işlevine verilir.
   1. Google'ın "Limited Use" cümlesi düşünce · 2. dar izin (drive.file) söylenmeyince · 3. metne e-posta adresi yazılınca · 4. sayfa oturum isteyince
   · 5. giriş ekranındaki bağlantı kalkınca yakalanır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { gizlilikEksikleri, oku } from "../yardimci/denetimler.ts";

const k = { metin: oku("src/tanim/gizlilik.ts"), sayfa: oku("src/app/(acik)/gizlilik/page.tsx"), giris: oku("src/app/(acik)/giris/GirisFormu.tsx") };

test("gizlilik kilidi bozulmayı yakalar (kilidin koruduğu açık)", () => {
  assert.deepEqual(gizlilikEksikleri(k), [], "sağlam");
  const b = (alan: keyof typeof k, eski: string | RegExp, yeni: string) => {
    const m = k[alan].replace(eski, yeni);
    assert.notEqual(m, k[alan], `bozulacak yer kaynakta: ${String(eski)}`);
    return gizlilikEksikleri({ ...k, [alan]: m });
  };
  assert.ok(b("metin", "including the Limited Use requirements", "").some((x) => x.includes("Limited Use")));
  assert.ok(b("metin", /drive\.file/g, "drive").some((x) => x.includes("drive.file")));
  assert.ok(b("metin", "export const GIZLILIK_SURUMU", 'const ADRES = "destek@deneme.example";\nexport const GIZLILIK_SURUMU').some((x) => x.includes("e-posta adresi")));
  assert.ok(b("sayfa", "export default function Sayfa() {", 'import { istekOturumu } from "x";\nexport default function Sayfa() {').some((x) => x.includes("oturum")));
  assert.ok(b("giris", 'href="/gizlilik"', 'href="/baska"').some((x) => x.includes("bağlantı")));
});
