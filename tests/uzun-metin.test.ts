/* NEREDEN GELDİ: reisim 2026-10-26 — "uzun cümlelerde … olsun tıklayınca açılsın dedim çünkü sıkıştırırken çok bozuyorsun ekranı"; "bu uygulamalar
   raporlara yansımasın sadece saha ekranında olsun". Kısalan metin (Kirp) tıklanınca tam metin balonu açar; satır bağlantısı kırpık metne basınca
   tetiklenmez; rapor belgesi (src/belge) bu bileşeni kullanmaz. Davranışın kendisi e2e/bilesenler.spec.ts (vitrin). Olumsuz kanıt:
   tests/bozan/uzun-metin.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku } from "./yardimci/denetimler.ts";

test("Kirp: kısalmışsa tıklanır balon açar; bağlantı / tuş içinde tıklama onlarındır; liste satırı kırpık metne basılınca girmez", () => {
  const k = oku("src/components/liste/Kirp.tsx");
  assert.match(k, /scrollWidth > e\.clientWidth \+ 1/, "yalnız gerçekten kısalmış metin tıklanır");
  assert.match(k, /closest\("a, button"\)/, "bağlantı / tuş içinde tıklama onlarındır");
  assert.match(k, /key === "Escape"[\s\S]*stopPropagation/, "Esc yalnız balonu kapatır");
  assert.match(k, /useYuzen\(/, "üst katmanda açılır (sayfayı itmez, kesilmez)");
  assert.match(oku("src/components/liste/Liste.tsx"), /closest\("a, button, label, input, select, textarea, \[data-kirpik\]"\)/, "satıra girme kırpık metne basılınca olmaz");
});

test("rapor belgesi ve PDF kırpma bileşenini kullanmaz (yalnız ekran)", () => {
  for (const d of dosyalar("src/belge", [".ts", ".tsx"])) assert.doesNotMatch(oku(d), /components\/liste|\bKirp\b/, `${d} ekran bileşenini kullanmaz`);
});
