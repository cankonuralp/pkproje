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
  ilerlemeMetni, isIciKucult, istemTahmini, kapanisNedeni, kapanisNotu, konusmaSikistir, KUCULTME_EN_COK, kucultmeSeviyesi, PARTI_ESIGI, PARTI_YAZAN, partiSonuKucult,
  raporIlerlemesi, sonSoruIndeksi, TAVAN, ZATEN_BUYUTULDU } from "../src/modules/say/is-siniri.ts";

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

/* 2026-11-01 V21 B (reisim: "müşteriye bırakmadan otomatik geçmiş silme koyalım"): kapanış nedeni ve not. Dördüncü koşu: "başka plan" kuralı kalktı; beşinci
   koşu: "konuşma büyüdü" kuralı da kalktı — ikisinde de kullanıcı aynı fotoğraflarla devam sorusu sorunca konuşma kapanıp ekler gitmişti ("fotoğraf yok") */
test("otomatik kapanış: YALNIZ 60 dakika; taze / büyük / boş konuşma kapatmaz; not dört satır", () => {
  const simdi = new Date("2026-11-01T10:00:00+03:00"), P1 = "11111111-1111-4111-8111-111111111111";
  const not = (p: string) => `Kullanıcı şu sayfada: Planlar.\nAçık kayıt: Plan (kimlik ${p}) · no: P-1.`;
  const konusma = (p: string) => [{ role: "user", content: [{ type: "text", text: "a" }] }, { role: "system", content: not(p) }, { role: "assistant", content: [{ type: "text", text: "bitti" }] }];
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: new Date(simdi.getTime() - 61 * 60_000), simdi }), "60 dakika geçti");
  assert.equal(kapanisNedeni({ mesajlar: konusma(P1), sonZaman: new Date(simdi.getTime() - 59 * 60_000), simdi }), null, "taze");
  const buyuk = [...konusma(P1), { role: "user", content: [{ type: "text", text: "b" }] }, { role: "user", content: [{ type: "tool_result", tool_use_id: "q", content: "z".repeat(400_000) }] }, { role: "assistant", content: [{ type: "text", text: "ok" }] }];
  assert.equal(kapanisNedeni({ mesajlar: buyuk, sonZaman: simdi, simdi }), null, "büyüklük kapatmaz");
  assert.equal(kapanisNedeni({ mesajlar: [], sonZaman: null, simdi }), null, "boş konuşma");
  const n = kapanisNotu("60 dakika geçti", "01.11 10:00", "8 rapor hazır.\n\nVarsayımla: a\n'-': b\nKalan engel: c\nfazla satır");
  assert.ok(n.startsWith("Önceki konuşma kapandı (60 dakika geçti; 01.11 10:00)."));
  assert.ok(n.includes("Kalan engel: c") && !n.includes("fazla satır"), "en çok dört dolu satır");
  assert.ok(n.includes("yeniden eklemesini iste"));
});

test("bu işte büyütülen fotoğraflar; önceki işinkiler sayılmaz; numara ve ret metni", () => {
  assert.deepEqual([...gosterilenFotolar([...ILK, ...IKINCI])], [2]);
  assert.deepEqual([...gosterilenFotolar(ILK)], [1]);
  assert.equal(fotoNo("F11"), 11); assert.equal(fotoNo(" 7 "), 7); assert.equal(fotoNo("x"), null);
  assert.match(ZATEN_BUYUTULDU(11), /^F11 bu işte zaten büyütüldü/);
});

/* 2026-11-01 BÜYÜK İŞ ŞEMASI (reisim: "müşteriler 20-25-50-60 fotoğraflı işi de tek te yaptırmak isteyebilir … müşteriye göstermeden"; sunum
   yerel/say-arge/2026-11-01-sunum-buyuk-is-semasi.md, "Evet, başla"): partili yazma — parti yazıldıktan sonra ondan önceki büyütmeler metne iner,
   sonraki partinin büyütmeleri kalır; yapay zekâ iletileri ve önceki işler aynen; belirlenimli. Olumsuz kanıt: bozan 6. */
const R1 = "22222222-2222-4222-8222-222222222222", R2 = "33333333-3333-4333-8333-333333333333", R3 = "44444444-4444-4444-8444-444444444444";
const SORU = { role: "user", content: [{ type: "text", text: "raporları hazırla" }] };
/* 2026-11-02 (altıncı koşu P2): parti yalnız raporlara_yaz / rapor_yaz; yalnız istem kestirimi PARTI_ESIGI'ni aşıyorsa (küçük işte görüntüler kalır — 6. koşuda
   rapor_ac'tan sonraki dönüşüm 21,6 bin yeniden yazdırmıştı) */
test("parti sonu küçültme: büyük işte yazan çağrıdan önceki büyütmeler metne, sonrakiler kalır; rapor_ac parti değil; küçük işte ve yazma yoksa değişmez; belirlenimli", () => {
  const yaz = (id: string, ad = "raporlara_yaz") => ({ type: "tool_use", id, name: "islem", input: { ad, girdi: { raporlar: [{ rapor: R1 }, { rapor: R2 }] } } });
  const dolgu = { role: "user", content: [{ type: "tool_result", tool_use_id: "d0", content: "d".repeat(PARTI_ESIGI * 4) }] };
  const l = [
    SORU, dolgu,
    { role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }, goster("g1", "F01")] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "g1", content: [b64, { type: "text", text: "F01" }] }] },
    { role: "assistant", content: [yaz("y1")] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "y1", content: JSON.stringify({ islem: "raporlara_yaz", durum: "tamam" }) }] },
    { role: "assistant", content: [goster("g2", "F03")] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "g2", content: [b64, { type: "text", text: "F03" }] }] },
  ];
  const once = JSON.stringify(l);
  const k = partiSonuKucult(l);
  assert.equal(k.degisen, 1);
  assert.deepEqual(((k.mesajlar[3]!.content as { content: { type: string; text?: string }[] }[])[0]!.content).map((x) => x.text ?? x.type), [GORUNTU_KALDIRILDI, "F01"]);
  assert.deepEqual(k.mesajlar[7], l[7], "yazmadan sonraki büyütme kalır");
  assert.deepEqual(k.mesajlar[2], l[2], "yapay zekâ iletisi aynen");
  assert.deepEqual(partiSonuKucult(l.slice(0, 4)), { mesajlar: l.slice(0, 4), degisen: 0 }, "yazma yoksa değişmez");
  const kucuk = l.filter((m) => m !== dolgu);
  assert.deepEqual(partiSonuKucult(kucuk), { mesajlar: kucuk, degisen: 0 }, "küçük işte (kestirim ≤ eşik) görüntüler kalır");
  const ac = l.map((m) => (m === l[4] ? { role: "assistant", content: [yaz("y1", "rapor_ac")] } : m));
  assert.equal(partiSonuKucult(ac).degisen, 0, "rapor_ac parti değil");
  assert.deepEqual(partiSonuKucult(l), k, "belirlenimli");
  assert.deepEqual(partiSonuKucult([...ILK, ...l]).mesajlar.slice(0, ILK.length), ILK, "önceki iş dokunulmaz");
  assert.equal(JSON.stringify(l), once, "girdi değişmedi");
  assert.deepEqual([...PARTI_YAZAN], ["raporlara_yaz", "rapor_yaz"]);
});

test("rapor ilerlemesi: bu işte açılan (rapor_ac sonucundan) ve yazılan (raporlara_yaz / rapor_yaz, tekil; hatalı ve sonuçsuz sayılmaz); metni", () => {
  const ac = { role: "assistant", content: [{ type: "tool_use", id: "a1", name: "islem", input: { ad: "rapor_ac", girdi: { plan: "p", ekipman: ["x", "y", "z"] } } }] };
  const acildi = { role: "user", content: [{ type: "tool_result", tool_use_id: "a1", content: JSON.stringify({ islem: "rapor_ac", durum: "tamam", raporlar: [{ ekipman: "x", id: R1 }, { ekipman: "y", id: R2 }, { ekipman: "z", id: R3 }] }) }] };
  const y1 = { role: "assistant", content: [{ type: "tool_use", id: "y1", name: "islem", input: { ad: "raporlara_yaz", girdi: { raporlar: [{ rapor: R1 }, { rapor: R2 }] } } }] };
  const t1 = { role: "user", content: [{ type: "tool_result", tool_use_id: "y1", content: JSON.stringify({ islem: "raporlara_yaz", durum: "tamam" }) }] };
  const y2 = { role: "assistant", content: [{ type: "tool_use", id: "y2", name: "islem", input: { ad: "rapor_yaz", girdi: { rapor: R2 } } }, { type: "tool_use", id: "y3", name: "raporlara_yaz", input: { raporlar: [R3] } }] };
  const t2 = { role: "user", content: [{ type: "tool_result", tool_use_id: "y2", content: JSON.stringify({ durum: "hata", neden: "x" }) }, { type: "tool_result", tool_use_id: "y3", content: "{}" }] };
  assert.deepEqual(raporIlerlemesi([SORU, ac, acildi]), { yazilan: 0, acilan: 3 });
  assert.deepEqual(raporIlerlemesi([SORU, ac, acildi, y1, t1]), { yazilan: 2, acilan: 3 });
  assert.deepEqual(raporIlerlemesi([SORU, ac, acildi, y1, t1, y2, t2]), { yazilan: 3, acilan: 3 }, "R2 yeniden yazma tekil, hatalı sayılmaz; doğrudan araç adıyla çağrı da sayılır");
  assert.deepEqual(raporIlerlemesi([SORU, ac, acildi, y1]), { yazilan: 0, acilan: 3 }, "sonucu olmayan çağrı sayılmaz");
  assert.equal(raporIlerlemesi([SORU, { role: "assistant", content: [{ type: "text", text: "x" }] }]), null);
  assert.deepEqual(raporIlerlemesi([...ILK, SORU, ac, acildi]), { yazilan: 0, acilan: 3 }, "önceki iş sayılmaz");
  assert.equal(ilerlemeMetni({ yazilan: 2, acilan: 3 }), "2 / 3 rapor yazıldı");
  assert.equal(ilerlemeMetni({ yazilan: 2, acilan: 0 }), "2 rapor yazıldı");
  assert.equal(ilerlemeMetni(null), null);
});
