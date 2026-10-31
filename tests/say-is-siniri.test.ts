/* NEREDEN GELDİ: 2026-10-31 V21 ilk koşu (6 iş · 31 istek · istem 151 bin token · 0,301 $; maliyetin %89'u 100 bin token üstü fiyattan; reisim: "optimize
   etmemiz gerekli", madde 1: konuşma 100 binin altında — "iş bitince eski fotoğraf büyütmeleri ve ilk fotoğraflar ön okuma metnine iner, uzun araç
   sonuçları kısalır"; "aynı fotoğraf ikinci kez büyütülmez"). Bu kilit tutar: (1) kullanıcının son sorusundan ÖNCEKİ iletilerde fotoğraf blokları ve araç
   sonuçlarındaki görüntüler metne iner, uzun sonuçlar kırpılır; yapay zekâ iletileri düşünme bloğuyla AYNEN (2026-10-23 "olduğu gibi" — düşürmek maliyeti
   değiştirmez, taklit ister); (2) bu işin iletileri (son sorudan itibaren) AYNEN kalır;
   (3) belirlenimli — aynı girdi aynı çıktı (önbellek öneki iş boyunca sabit); (4) sorusuz / tek sorulu konuşma değişmez; (5) bu işte büyütülen
   fotoğraflar bilinir, önceki işinkiler sayılmaz. Olumsuz kanıt: tests/bozan/say-is-siniri.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DENETIM_ONEKI } from "../src/modules/say/bitis-denetimi.ts";
import { bildirimNotu, bildirimNotuGerekli, bildirimSatirlari, ESKI_SONUC_EN_COK, FOTO_KALDIRILDI, fotoNo, GORUNTU_KALDIRILDI, gosterilenFotolar, konusmaSikistir, sonSoruIndeksi,
  ZATEN_BUYUTULDU } from "../src/modules/say/is-siniri.ts";

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

test("bitmiş iş küçülür: fotoğraf ve büyütme metne, uzun sonuç kırpık; yapay zekâ iletileri (düşünme dahil) ve bu iş aynen; belirlenimli", () => {
  const girdi = [...ILK, ...IKINCI];
  const s = konusmaSikistir(girdi);
  assert.equal(s.sikisan, 2, "ilk kullanıcı iletisi ve sonuç iletisi");
  const ilk = s.mesajlar[0]!.content as { type: string; text?: string }[];
  assert.deepEqual(ilk.map((b) => b.type), ["text", "text", "text", "text"]);
  assert.equal(ilk[2]!.text, FOTO_KALDIRILDI);
  assert.equal(ilk[1]!.text, "M01 · F01 — fotoğraf · a.jpg · ön okuma: etiket / plaka:", "başlık (ön okuma) kalır");
  /* 2026-10-23 "konuşma olduğu gibi": yapay zekâ iletisi düşünme bloğu ve imzasıyla aynen (hizmet önceki turların düşünmesini saymaz; taklit ister) */
  assert.deepEqual(s.mesajlar[2], ILK[2], "yapay zekâ iletisi aynen");
  assert.deepEqual(s.mesajlar[4], ILK[4]);
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

/* 2026-10-31 V21 madde 7 (reisim: "Bildirim en çok dört satır; sunucu da bunu uygular") */
test("bildirim notu: rapora yazan işte dört satırı aşan bildirime bir kez; yazmayan işte ve kısa bildirimde yok", () => {
  const yaz = { role: "assistant", content: [{ type: "tool_use", id: "y", name: "islem", input: { ad: "raporlara_yaz", girdi: {} } }] };
  const oku = { role: "assistant", content: [{ type: "tool_use", id: "o", name: "islem", input: { ad: "plan_getir", girdi: {} } }] };
  const sonuc = (id: string) => ({ role: "user", content: [{ type: "tool_result", tool_use_id: id, content: "{}" }] });
  const uzun = "- Hazır: 8 rapor\n- Varsayım: a\n  - b\n- '-': c\n\n- Kalan engel: d\n- Ayrıca e";
  assert.equal(bildirimSatirlari(uzun), 6);
  assert.equal(bildirimSatirlari("a\n\n---\nb\nc\nd"), 4, "boş satır ve çizgi sayılmaz");
  const soru = { role: "user", content: [{ type: "text", text: "raporları hazırla" }] };
  assert.equal(bildirimNotuGerekli([soru, yaz, sonuc("y")], uzun), true);
  assert.equal(bildirimNotuGerekli([soru, yaz, sonuc("y")], "a\nb\nc\nd"), false, "dört satır");
  assert.equal(bildirimNotuGerekli([soru, oku, sonuc("o")], uzun), false, "yazmayan iş");
  const not = { role: "user", content: [{ type: "text", text: bildirimNotu(6) }] };
  assert.equal(bildirimNotuGerekli([soru, yaz, sonuc("y"), { role: "assistant", content: [{ type: "text", text: uzun }] }, not], uzun), false, "bir kez");
  assert.equal(sonSoruIndeksi([soru, yaz, sonuc("y"), not]), 0, "not soru değil; iş sınırı değişmez");
  assert.equal(bildirimNotuGerekli([{ role: "user", content: [{ type: "text", text: "eski" }] }, yaz, sonuc("y"), soru, oku, sonuc("o")], uzun), false, "önceki işin yazması sayılmaz");
  assert.match(bildirimNotu(6), /^Sunucunun bildirim notu: bildirimin 6 satır/);
});

test("bu işte büyütülen fotoğraflar; önceki işinkiler sayılmaz; numara ve ret metni", () => {
  assert.deepEqual([...gosterilenFotolar([...ILK, ...IKINCI])], [2]);
  assert.deepEqual([...gosterilenFotolar(ILK)], [1]);
  assert.equal(fotoNo("F11"), 11); assert.equal(fotoNo(" 7 "), 7); assert.equal(fotoNo("x"), null);
  assert.match(ZATEN_BUYUTULDU(11), /^F11 bu işte zaten büyütüldü/);
});
