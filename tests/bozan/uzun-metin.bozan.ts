/* OLUMSUZ KANIT — tests/uzun-metin.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosyalar bellekte bozulur.
   1. Satıra girme kuralından [data-kirpik] çıkarsa kırpık metne basınca tıklanır satır açılır, balon görünmez (ölçütle yakalanır).
   2. Rapor belgesine ekran bileşeni girerse PDF'e balon / kırpma sızar (yakalanır). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku } from "../yardimci/denetimler.ts";

const SATIR = /closest\("a, button, label, input, select, textarea, \[data-kirpik\]"\)/;
const BELGE_YASAGI = /components\/liste|\bKirp\b/;

test("1. satıra girme kuralından [data-kirpik] çıkınca kilit düşer", () => {
  const bozuk = oku("src/components/liste/Liste.tsx").replace(', [data-kirpik]"', '"');
  assert.doesNotMatch(bozuk, SATIR, "bozuk: kırpık metne basınca satıra girilir — testin beklentisi düşer");
});

test("2. belge dosyasına Kirp girince kilit düşer", () => {
  const bozuk = oku("src/belge/belge.ts") + '\nimport { Kirp } from "../components/liste/Liste";\n';
  assert.match(bozuk, BELGE_YASAGI, "bozuk: belge ekran bileşenini içe aktarıyor — testin 'kullanmaz' beklentisi düşer");
});
