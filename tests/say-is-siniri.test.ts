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
import { BECERI_KALDIRILDI, bildirimNotu, bildirimNotuGerekli, bildirimSatirlari, ESKI_SONUC_EN_COK, FOTO_KALDIRILDI, fotoNo, GORUNTU_KALDIRILDI, gosterilenFotolar,
  isIciKucult, istemTahmini, KAPANIS_BOYU, kapanisNedeni, kapanisNotu, konusmaSikistir, KUCULTME_EN_COK, kucultmeSeviyesi, sonSoruIndeksi, TAVAN, ZATEN_BUYUTULDU } from "../src/modules/say/is-siniri.ts";

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

/* 2026-11-01 V21 A1 (reisim: "100 bin olayını sınırlama şansımız yok mu") — sert tavan: kestirim, iş içi küçültme seviyeleri (tek yönlü, belirlenimli), seviye seçimi */
test("sert tavan: istem kestirimi; iş içi küçültme 1 görüntü · 2 beceri · 3 uzun sonuç; son görüntü ve son iki sonuç korunur; seviye yalnız ileri", () => {
  const uzunMetin = "y".repeat(ESKI_SONUC_EN_COK + 500);
  const K = [
    { role: "user", content: [{ type: "text", text: "raporları hazırla" }, resim] },
    { role: "assistant", content: [{ type: "tool_use", id: "b1", name: "beceri_oku", input: { ad: "B01" } }, { type: "tool_use", id: "x1", name: "islem", input: { ad: "plan_getir", girdi: {} } }, goster("g1", "F01")] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "b1", content: "# B01 …" }, { type: "tool_result", tool_use_id: "x1", content: uzunMetin }, { type: "tool_result", tool_use_id: "g1", content: [b64, { type: "text", text: "F01" }] }] },
    { role: "assistant", content: [{ type: "tool_use", id: "p1", name: "islem", input: { ad: "plan_hazirlik", girdi: {} } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "p1", content: uzunMetin }] },
    { role: "assistant", content: [goster("g2", "F02")] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "g2", content: [b64, { type: "text", text: "F02" }] }] },
  ];
  const t0 = istemTahmini(K);
  assert.ok(t0 > 2 * 2_400 + 650 && t0 < 2 * 2_400 + 650 + 3_000, `kestirim ${t0}: iki büyütme, bir küçük kopya, metinler`);
  assert.deepEqual(isIciKucult(K, 0), { mesajlar: K, degisen: 0 });
  const s1 = isIciKucult(K, 1);
  assert.equal(s1.degisen, 1);
  assert.deepEqual((s1.mesajlar[2]!.content as { content: unknown }[])[2]!.content, [{ type: "text", text: GORUNTU_KALDIRILDI }, { type: "text", text: "F01" }], "eski büyütme metne");
  assert.deepEqual(s1.mesajlar[6], K[6], "son görüntülü sonuç kalır");
  const s2 = isIciKucult(K, 2);
  assert.equal((s2.mesajlar[2]!.content as { content: unknown }[])[0]!.content, BECERI_KALDIRILDI("B01"), "okunmuş beceri nota");
  const s3 = isIciKucult(K, 3);
  const x1 = (s3.mesajlar[2]!.content as { content: string }[])[1]!.content;
  assert.ok(x1.length < uzunMetin.length && x1.includes("kırpıldı"), "eski uzun sonuç kırpık");
  assert.equal((s3.mesajlar[4]!.content as { content: string }[])[0]!.content, uzunMetin, "son iki kullanıcı iletisi kırpılmaz");
  assert.deepEqual(s3.mesajlar[0], K[0], "soru iletisi (malzeme) aynen");
  assert.ok(istemTahmini(s3.mesajlar) < t0);
  assert.deepEqual(isIciKucult(K, 3), s3, "belirlenimli");
  assert.equal(kucultmeSeviyesi(K, 0, 1_000), 0, "tavanın altında seviye 0");
  assert.equal(kucultmeSeviyesi(K, 2, 1_000), 2, "mevcut seviye geri düşmez");
  assert.equal(kucultmeSeviyesi(K, 0, TAVAN), KUCULTME_EN_COK, "aşıyorsa en çok 4");
  assert.equal(kucultmeSeviyesi(K, 0, 1_000, TAVAN + 1), 1, "ölçülen istem aşıyorsa bir basamak");
});

/* 2026-11-01 V21 B (reisim: "müşteriye bırakmadan otomatik geçmiş silme koyalım"): kapanış nedenleri ve not */
test("otomatik kapanış: 60 dakika · başka plan · konuşma büyüdü; iş sürerken / aynı planda / boş konuşmada yok; not dört satır", () => {
  const simdi = new Date("2026-11-01T10:00:00+03:00"), P1 = "11111111-1111-4111-8111-111111111111", P2 = "22222222-2222-4222-8222-222222222222";
  const not = (p: string) => `Kullanıcı şu sayfada: Planlar.\nAçık kayıt: Plan (kimlik ${p}) · no: P-1.`;
  const konusma = (p: string) => [{ role: "user", content: [{ type: "text", text: "a" }] }, { role: "system", content: not(p) }, { role: "assistant", content: [{ type: "text", text: "bitti" }] }];
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: new Date(simdi.getTime() - 61 * 60_000), simdi, yeniNot: not(P1) }), "60 dakika geçti");
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: new Date(simdi.getTime() - 59 * 60_000), simdi, yeniNot: not(P1) }), null, "aynı plan, taze");
  /* 2026-11-01 dördüncü koşu: "başka plan" kuralı kalktı — kullanıcı aynı fotoğraflarla başka planda sorunca ekler gitmişti */
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: simdi, simdi, yeniNot: not(P2) }), null, "başka plan kapatmaz");
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: simdi, simdi, yeniNot: "Kullanıcı şu sayfada: Raporlar." }), null, "plan olmayan sayfa kapatmaz");
  const buyuk = [...konusma(P1), { role: "user", content: [{ type: "text", text: "b" }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "q", content: "z".repeat(KAPANIS_BOYU * 4) }] }, { role: "assistant", content: [{ type: "text", text: "ok" }] }];
  assert.equal(kapanisNedeni({ mesajlar: buyuk, sonZaman: simdi, simdi, yeniNot: not(P1) }), "konuşma büyüdü");
  assert.equal(kapanisNedeni({ mesajlar: [], sonZaman: null, simdi, yeniNot: not(P1) }), null, "boş konuşma");
  const n = kapanisNotu("başka plan", "01.11 10:00", "8 rapor hazır.\n\nVarsayımla: a\n'-': b\nKalan engel: c\nfazla satır");
  assert.ok(n.startsWith("Önceki konuşma kapandı (başka plan; 01.11 10:00)."));
  assert.ok(n.includes("Kalan engel: c") && !n.includes("fazla satır"), "en çok dört dolu satır");
  assert.ok(n.includes("yeniden eklemesini iste"));
});

test("bu işte büyütülen fotoğraflar; önceki işinkiler sayılmaz; numara ve ret metni", () => {
  assert.deepEqual([...gosterilenFotolar([...ILK, ...IKINCI])], [2]);
  assert.deepEqual([...gosterilenFotolar(ILK)], [1]);
  assert.equal(fotoNo("F11"), 11); assert.equal(fotoNo(" 7 "), 7); assert.equal(fotoNo("x"), null);
  assert.match(ZATEN_BUYUTULDU(11), /^F11 bu işte zaten büyütüldü/);
});
