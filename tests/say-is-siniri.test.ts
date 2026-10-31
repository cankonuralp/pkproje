/* NEREDEN GELDİ: 2026-10-31 V21 ilk koşu (6 iş · 31 istek · istem 151 bin token · 0,301 $; maliyetin %89'u 100 bin token üstü fiyattan; reisim: "optimize
   etmemiz gerekli", madde 1: konuşma 100 binin altında — "iş bitince eski fotoğraf büyütmeleri ve ilk fotoğraflar ön okuma metnine iner, uzun araç
   sonuçları kısalır"; "aynı fotoğraf ikinci kez büyütülmez"). Bu kilit tutar: (1) kullanıcının son sorusundan ÖNCEKİ iletilerde fotoğraf blokları ve araç
   sonuçlarındaki görüntüler metne iner, uzun sonuçlar kırpılır, düşünme blokları düşer; (2) bu işin iletileri (son sorudan itibaren) AYNEN kalır;
   (3) belirlenimli — aynı girdi aynı çıktı (önbellek öneki iş boyunca sabit); (4) sorusuz / tek sorulu konuşma değişmez; (5) bu işte büyütülen
   fotoğraflar bilinir, önceki işinkiler sayılmaz. Olumsuz kanıt: tests/bozan/say-is-siniri.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DENETIM_ONEKI } from "../src/modules/say/bitis-denetimi.ts";
import { ESKI_SONUC_EN_COK, FOTO_KALDIRILDI, fotoNo, GORUNTU_KALDIRILDI, gosterilenFotolar, konusmaSikistir, sonSoruIndeksi, ZATEN_BUYUTULDU } from "../src/modules/say/is-siniri.ts";

const resim = { type: "image", source: { type: "file", file_id: "f1" } };
const b64 = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "/9j/" } };
const goster = (id: string, foto: string) => ({ type: "tool_use", id, name: "foto_goster", input: { foto, bolge: [0, 0, 1, 0.5] } });
const uzun = "x".repeat(ESKI_SONUC_EN_COK + 100);
const ILK = [
  { role: "user", content: [{ type: "text", text: "Malzeme …" }, { type: "text", text: "M01 · F01 — fotoğraf · a.jpg · ön okuma: etiket / plaka:" }, resim, { type: "text", text: "raporları hazırla" }] },
  { role: "system", content: "Kullanıcı şu sayfada: Planlar." },
  { role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }, goster("g1", "F01"), { type: "tool_use", id: "i1", name: "islem", input: { ad: "plan_getir", girdi: {} } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "g1", content: [b64, { type: "text", text: "F01 · a.jpg · bölge 0, 0, 1, 0.5" }] }, { type: "tool_result", tool_use_id: "i1", content: uzun }] },
  { role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }, { type: "text", text: "8 rapor hazır." }] },
];
const IKINCI = [
  { role: "user", content: [{ type: "text", text: "sen ekle ne lazımsa" }] },
  { role: "system", content: "Kullanıcı şu sayfada: Planlar." },
  { role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }, goster("g2", "F02")] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "g2", content: [b64, { type: "text", text: "F02" }] }] },
];

test("iş sınırı: son soru; denetim notu ve sonuç iletisi soru değil", () => {
  assert.equal(sonSoruIndeksi([...ILK, ...IKINCI]), ILK.length);
  assert.equal(sonSoruIndeksi([...ILK, { role: "user", content: [{ type: "text", text: `${DENETIM_ONEKI} …` }] }]), 0);
  assert.equal(sonSoruIndeksi([{ role: "assistant", content: [{ type: "text", text: "x" }] }]), -1);
});

test("bitmiş iş küçülür: fotoğraf ve büyütme metne, uzun sonuç kırpık, düşünme yok; bu iş aynen; belirlenimli", () => {
  const girdi = [...ILK, ...IKINCI];
  const s = konusmaSikistir(girdi);
  assert.equal(s.sikisan, 4, "ilk kullanıcı iletisi, iki yapay zekâ iletisi, sonuç iletisi");
  const ilk = s.mesajlar[0]!.content as { type: string; text?: string }[];
  assert.deepEqual(ilk.map((b) => b.type), ["text", "text", "text", "text"]);
  assert.equal(ilk[2]!.text, FOTO_KALDIRILDI);
  assert.equal(ilk[1]!.text, "M01 · F01 — fotoğraf · a.jpg · ön okuma: etiket / plaka:", "başlık (ön okuma) kalır");
  const yz = s.mesajlar[2]!.content as { type: string }[];
  assert.deepEqual(yz.map((b) => b.type), ["tool_use", "tool_use"], "düşünme düştü, araç çağrıları kaldı");
  const sonuc = s.mesajlar[3]!.content as { content: unknown }[];
  assert.deepEqual((sonuc[0]!.content as { type: string; text: string }[]).map((b) => b.text), [GORUNTU_KALDIRILDI, "F01 · a.jpg · bölge 0, 0, 1, 0.5"]);
  assert.ok((sonuc[1]!.content as string).length < uzun.length && (sonuc[1]!.content as string).includes("kırpıldı"));
  for (let i = ILK.length; i < girdi.length; i++) assert.deepEqual(s.mesajlar[i], girdi[i], `bu işin iletisi aynen: ${i}`);
  assert.deepEqual(konusmaSikistir(girdi), s, "belirlenimli");
  assert.equal(JSON.stringify(girdi[0]), JSON.stringify(ILK[0]), "girdi değişmedi");
});

test("tek sorulu ya da sorusuz konuşma değişmez; kısa sonuç ve yalnız-düşünme iletisi korunur", () => {
  assert.deepEqual(konusmaSikistir(ILK), { mesajlar: ILK, sikisan: 0 });
  assert.deepEqual(konusmaSikistir([]), { mesajlar: [], sikisan: 0 });
  const yalniz = [{ role: "user", content: [{ type: "text", text: "a" }] }, { role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "k", content: "kısa" }] }, { role: "user", content: [{ type: "text", text: "b" }] }];
  const s = konusmaSikistir(yalniz);
  assert.equal(s.sikisan, 0);
  assert.deepEqual(s.mesajlar, yalniz);
});

test("bu işte büyütülen fotoğraflar; önceki işinkiler sayılmaz; numara ve ret metni", () => {
  assert.deepEqual([...gosterilenFotolar([...ILK, ...IKINCI])], [2]);
  assert.deepEqual([...gosterilenFotolar(ILK)], [1]);
  assert.equal(fotoNo("F11"), 11); assert.equal(fotoNo(" 7 "), 7); assert.equal(fotoNo("x"), null);
  assert.match(ZATEN_BUYUTULDU(11), /^F11 bu işte zaten büyütüldü/);
});
