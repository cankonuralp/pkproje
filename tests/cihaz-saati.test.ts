/* NEREDEN GELDİ: 2026-11-12 — pkproje.md §11 K4 (reisim: "say chat ve say asistanı çevrimdışı çalışmayı türkaklıya nasıl entegre edicez" → onaylı
   karar): bağlantısızken kontrol saati cihazdan alınır; bağlantıdan çıkarken ve dönerken cihaz saati sunucuyla karşılaştırılır — arada saat
   oynanmışsa iki ölçüm tutmaz, o kayıt sapmadır; 5 dk'ya kadar fark düzeltilerek kabul. Hesap src/modules/raporlar/cihaz-saati.ts (sunucu ve ekran
   ortak); sapma metni sapma.ts. Veritabanı tarafı tests/raporlar.test.ts "bağlantısız kontrol saati (0131)". Olumsuz kanıt: tests/bozan/cihaz-saati.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cihazSaati, SAAT_PAYI_MS, trDakika, yerelOlcum } from "../src/modules/raporlar/cihaz-saati.ts";
import { sapmalar } from "../src/modules/raporlar/sapma.ts";

const DK = 60_000;
/** sunucu anı (2026-11-12 13:00 TS) */
const S = Date.parse("2026-11-12T13:00:00+03:00");

test("cihaz saati tutuyorsa olayın anı sunucu saatine çevrilir: cihaz 3 dk geri, çıkarken ve dönerken aynı fark", () => {
  const fark = 3 * DK, c = (ms: number) => ms - fark;   // sunucu anı → cihazın gösterdiği
  const capa = { sunucu: S - 120 * DK, cihaz: c(S - 120 * DK) };
  assert.deepEqual(cihazSaati({ an: c(S - 40 * DK), capa, gonderim: c(S) }, S), { zaman: S - 40 * DK, tutmadi: false, neden: null });
  /* 5 dk'ya kadar ayrılık kabul (saat az kaymış): dönüş farkıyla çevrilir */
  const az = cihazSaati({ an: c(S - 40 * DK), capa, gonderim: c(S) - 4 * DK }, S);
  assert.deepEqual([az.zaman, az.tutmadi], [S - 36 * DK, false]);
  assert.equal(SAAT_PAYI_MS, 5 * DK);
});

test("tutmayan saat reddedilmez, işaretlenir: fark değişmiş · saat geri / ileri alınmış · çıkış ölçümü ya da gönderim saati yok; ileri an yazılmaz", () => {
  const capa = { sunucu: S - 120 * DK, cihaz: S - 120 * DK };
  /* bağlantısızken saat 30 dk geri alınmış, öyle kalmış: dönüş farkı 30 dk */
  const degismis = cihazSaati({ an: S - 70 * DK, capa, gonderim: S - 30 * DK }, S);
  assert.deepEqual([degismis.zaman, degismis.tutmadi, degismis.neden], [S - 40 * DK, true, "cihaz saati bağlantısızken değişmiş (çıkarken fark 0 dk, dönerken 30 dk)"]);
  /* saat geri alınıp kontrol yapılmış, sonra düzeltilmiş: olay çapadan önce görünür */
  const geri = cihazSaati({ an: S - 180 * DK, capa, gonderim: S }, S);
  assert.deepEqual([geri.tutmadi, geri.neden], [true, "cihaz saati kontrol sırasında geri alınmış"]);
  /* saat ileri alınıp kontrol yapılmış, sonra düzeltilmiş: olay gönderimden sonra görünür — ileri bir an yazılmaz */
  const ileri = cihazSaati({ an: S + 60 * DK, capa, gonderim: S }, S);
  assert.deepEqual([ileri.zaman, ileri.tutmadi, ileri.neden], [S, true, "cihaz saati kontrol sırasında ileri alınmış"]);
  assert.deepEqual(cihazSaati({ an: S - 10 * DK, capa: null, gonderim: S }, S), { zaman: S - 10 * DK, tutmadi: true, neden: "bağlantıdan çıkmadan önce cihaz saati ölçülmemiş" });
  assert.deepEqual(cihazSaati({ an: S - 10 * DK, capa, gonderim: null }, S), { zaman: S - 10 * DK, tutmadi: true, neden: "işin gönderildiği andaki cihaz saati bilinmiyor" });
});

test("ekrandaki kontrol durumu: cihazda bekleyen başlangıç / bitiş sunucudaki kaydın üstüne (Türkiye saatiyle); bekleyen yoksa olduğu gibi", () => {
  assert.equal(trDakika(S), "2026-11-12T13:00");
  const yok = { durum: "yok" as const, bas: null, bit: null };
  assert.deepEqual(yerelOlcum(yok, { bas: null, bit: null }), { ...yok, bekliyor: false });
  assert.deepEqual(yerelOlcum(yok, { bas: S, bit: null }), { durum: "suruyor", bas: "2026-11-12T13:00", bit: null, bekliyor: true });
  assert.deepEqual(yerelOlcum(yok, { bas: S, bit: S + 32 * DK }), { durum: "bitti", bas: "2026-11-12T13:00", bit: "2026-11-12T13:32", bekliyor: true });
  /* sunucuda başlamış kontrol bağlantısızken bitirildi */
  assert.deepEqual(yerelOlcum({ durum: "suruyor" as const, bas: "2026-11-12T12:50", bit: null }, { bas: null, bit: S }), { durum: "bitti", bas: "2026-11-12T12:50", bit: "2026-11-12T13:00", bekliyor: true });
  /* sunucudaki kayıt geldi: bekleyen iş (henüz kuyruktan çıkmadıysa da) üstüne yazmaz */
  const bitti = { durum: "bitti" as const, bas: "2026-11-12T12:50", bit: "2026-11-12T13:01" };
  assert.deepEqual(yerelOlcum(bitti, { bas: S, bit: S }), { ...bitti, bekliyor: false });
});

test("sapma: tutmayan cihaz saati 'saat' sapması olur (gerekçe ister); tutan / bağlantılı ölçülen kontrolde yok", () => {
  const g = { bas: "2026-11-12T13:00", bit: "2026-11-12T13:40", enKisaDk: null, tesis: "t", planBas: "2026-11-12", planBit: "2026-11-12", digerleri: [], tesisArasiDk: 0, fotolar: [] };
  assert.deepEqual(sapmalar(g), []);
  assert.deepEqual(sapmalar({ ...g, saatTutmadi: null }), []);
  assert.deepEqual(sapmalar({ ...g, saatTutmadi: "cihaz saati kontrol sırasında geri alınmış" }),
    [{ tur: "saat", metin: "Bağlantısızken alınan kontrol saati sunucu saatiyle tutmadı: cihaz saati kontrol sırasında geri alınmış. Saat cihazın saatiyle yazıldı." }]);
});
