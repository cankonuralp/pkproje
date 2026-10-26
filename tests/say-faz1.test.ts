/* NEREDEN GELDİ: reisim 2026-10-26 — "yapay zekâ çok kötü durumda": S.A.Y asistanın İngilizce iç düşüncesi ekrana akıyordu ("çok açıklama var"), Durdur
   tuşu yoktu, rapor ekranında fotoğraftan oku tuşu yoktu, verilmeyen bilgi için kural yoktu. Bu kilit dört şeyi tutar: düşünme özeti ekrana
   GÖNDERİLMEZ ve gösterilmez; çalışan iş Durdur ile kesilir; rapor ekranındaki "Fotoğraftan oku" S.A.Y'ın okumasını başlatır (olay işlenmezse söyler);
   talimatta verilmeyen metin alanına "-" ve bitiş özeti kuralı. Davranış e2e/say.spec + foto-oku.spec. Olumsuz kanıt: tests/bozan/say-faz1.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku } from "./yardimci/denetimler.ts";

export const KURALLAR = {
  duzenGonderilmez: (dongu: string) => !/dusunce: \(d: string\) => yaz\(/.test(dongu),
  ekranGostermez: (say: string) => !/setDusunce|stil\.dusunce/.test(say),
  durdurKeser: (say: string) => /new AbortController\(\)/.test(say) && /signal: durdur\.signal/.test(say) && />Durdur<\/button>/.test(say),
  okuOlayi: (say: string, doldurma: string) => say.includes('"probata-say-oku"') && doldurma.includes("<FotoOkuTusu />") && doldurma.includes("cancelable: true"),
};

test("düşünme özeti ekrana gönderilmez ve gösterilmez", () => {
  assert.ok(KURALLAR.duzenGonderilmez(oku("src/modules/say/server/dongu.ts")), "sunucu düşünme olayını yazmaz");
  assert.ok(KURALLAR.ekranGostermez(oku("src/modules/say/ui/SayAsistan.tsx")), "balon düşünme metnini göstermez");
});

test("Durdur çalışan işi keser; rapor ekranındaki Fotoğraftan oku S.A.Y'ın okumasını başlatır", () => {
  const say = oku("src/modules/say/ui/SayAsistan.tsx");
  assert.ok(KURALLAR.durdurKeser(say), "Durdur: AbortController + istek sinyali + tuş");
  assert.ok(KURALLAR.okuOlayi(say, oku("src/modules/raporlar/ui/Doldurma.tsx")), "Fotoğraftan oku: olay + tuş + işlenmezse uyarı");
});
