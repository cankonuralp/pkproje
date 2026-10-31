/* NEREDEN GELDİ: 2026-10-31, lift denemesi (reisim: "S.A.Y durup sormaz, işi bitirir, sonra kısaca bildirir"; sunum L1–L2). 8 raporun hiçbiri onaya
   gidemiyordu: sonuç, bitiş saati, sonraki kontrol, ölçüm cihazı, test yükü boş; seri no null kaldı. Bu kilit tutar: (1) cevapsız madde uygun, sonuç
   önerisi, rapor tarihi, saat planı (bitişi yazılmamış raporda), sonraki kontrol; (2) bilinemeyen METİN "-", sayı / yıl / seçim boş; (3) test değeri
   notundaki katsayıdan (%110 / 1,25 katı), kapasite yoksa engel; (4) dolu ve verilen yere dokunulmaz; (5) cihaz: zimmet → son kullanılan →
   kalibrasyonu en uzun; üçüncüsü bildirilir; (6) bildirim en çok dört satır. Olumsuz kanıt: tests/bozan/say-tamamla.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { grupFormati } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi } from "../src/format/tanim.ts";
import { saatPlani } from "../src/modules/raporlar/saat-plani.ts";
import { cihazSec, isBildirimi, notKatsayisi, raporTamamla, type TamamlaGirdisi } from "../src/modules/raporlar/tamamla.ts";

const t = grupFormati({ ad: "Deneme kaldırma ekipmanı", grup: "kaldirma" });
const durum = (ekipman: Record<string, string> = {}, c: object = {}, tarih: object = { bas: "2026-10-31T16:17", bit: "" }) =>
  ({ ekipman, cevaplar: Cevaplar.parse(c), tarih }) as TamamlaGirdisi["durum"];
const g = (x: Partial<TamamlaGirdisi> = {}): TamamlaGirdisi => ({ tanim: t, durum: durum(), verilen: new Set(), gun: "2026-10-31", saat: null, cihazlar: [], ...x });
const deger = (r: { girisler: { yer: string; deger: string }[] }, yer: string) => r.girisler.find((x) => x.yer === yer)?.deger;

test("maddeler uygun, sonuç önerisi, rapor tarihi, saat planı ve sonraki kontrol", () => {
  const saat = saatPlani({ gun: "2026-10-31", baslangic: "09:00", ara: 0, raporlar: [{ id: "r", sure: 15, periyot: 12 }] })[0]!;
  const r = raporTamamla(g({ saat }));
  const maddeler = t.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((x) => x.maddeler) : []));
  for (const m of maddeler) assert.equal(deger(r, `m:${m.id}`), "Uygun");
  assert.equal(deger(r, "sonuc"), "uygun");
  assert.equal(deger(r, "tarih:rapor"), "31.10.2026");
  assert.deepEqual([deger(r, "tarih:bas"), deger(r, "tarih:bit"), deger(r, "tarih:sonraki")], ["31.10.2026 09:00", "31.10.2026 09:15", "31.10.2027"]);
  assert.ok(r.varsayim.some((x) => x.includes(`${maddeler.length} madde Uygun`)));
  const yazili = raporTamamla(g({ saat, durum: durum({}, {}, { bas: "2026-10-31T10:00", bit: "2026-10-31T10:30", sonraki: "2027-10-31" }) }));
  assert.equal(deger(yazili, "tarih:bit"), undefined, "bitişi yazılmış raporun saati değişmez");
});

test("bilinemeyen metin '-', yıl / sayı boş; dolu ve verilen yer korunur", () => {
  const r = raporTamamla(g({ durum: durum({ marka: "Deneme Marka" }), verilen: new Set(["e:model"]) }));
  assert.equal(deger(r, "e:seri"), "-");
  assert.equal(deger(r, "e:marka"), undefined, "dolu alan");
  assert.equal(deger(r, "e:model"), undefined, "bu çağrıda verilen alan");
  assert.equal(deger(r, "e:imal"), undefined, "yıl alanına '-' yazılmaz");
  assert.equal(deger(r, "e:kapasite"), undefined, "sayı alanına '-' yazılmaz");
  assert.ok(r.tire.includes("Seri no") && !r.tire.includes("Marka"));
  const v = raporTamamla(g({ verilen: new Set(["sonuc"]) }));
  assert.equal(deger(v, "sonuc"), undefined, "verilen sonuç ezilmez");
});

/* 2026-10-31 V21 madde 5 (reisim: "Beyan kapasitesi boşsa etiketten ya da 'MAX' levhasından yazılır"): adında "kapasite" geçen boş sayı alanı / katsayısız test
   değeri ekipmanın kapasitesinden; kapasite bilinmiyorsa boş kalır, engel yok; verilen ve dolu yer korunur */
test("kapasite adlı boş sayı alanı ve test değeri ekipmanın kapasitesinden", () => {
  const t2 = FormatTanimi.parse({ ...t, bolumler: [...t.bolumler,
    { id: "bk", ad: "Beyan", blok: "bilgi", alanlar: [{ id: "beyan_kap", ad: "Beyan kapasitesi", tur: "sayi" }, { id: "beyan_not", ad: "Kapasite notu", tur: "metin" }] },
    { id: "tk", ad: "Kapasite testi", blok: "test", degerler: [{ id: "kap_d", ad: "Beyan kapasitesi (kg)", birim: "kg" }] }] });
  const r = raporTamamla(g({ tanim: t2, durum: durum({}, { alan: { kapasite: "4000" } }) }));
  assert.equal(deger(r, "a:beyan_kap"), "4000");
  assert.equal(deger(r, "d:kap_d"), "4000");
  assert.equal(deger(r, "a:beyan_not"), "-", "metin alanı '-' (kapasiteden değil)");
  assert.ok(r.varsayim.some((x) => x.includes("Beyan kapasitesi ekipmanın kapasitesinden (4000)")));
  assert.ok(r.varsayim.some((x) => x.includes("Beyan kapasitesi (kg) ekipmanın kapasitesinden (4000 kg)")));
  const yok = raporTamamla(g({ tanim: t2 }));
  assert.equal(deger(yok, "a:beyan_kap"), undefined, "kapasite bilinmiyorsa boş");
  assert.ok(!yok.engel.some((x) => x.includes("Beyan kapasitesi")), "engel değil");
  const verili = raporTamamla(g({ tanim: t2, durum: durum({}, { alan: { kapasite: "4000", beyan_kap: "3500" } }), verilen: new Set(["d:kap_d"]) }));
  assert.equal(deger(verili, "a:beyan_kap"), undefined, "dolu alan korunur");
  assert.equal(deger(verili, "d:kap_d"), undefined, "verilen yer korunur");
});

test("test değeri katsayıdan; kapasite yoksa engel", () => {
  assert.equal(notKatsayisi("anma yükünün %110'u"), 1.1);
  assert.equal(notKatsayisi("kapasitenin 1,25 katı"), 1.25);
  assert.equal(notKatsayisi("çalışma basıncını aşmaz"), null);
  const r = raporTamamla(g({ durum: durum({}, { alan: { kapasite: "2000" } }) }));
  const testB = t.bolumler.find((b) => b.blok === "test");
  assert.ok(testB && testB.blok === "test");
  const [din, sta] = testB.degerler;
  assert.deepEqual([deger(r, `d:${din!.id}`), deger(r, `d:${sta!.id}`)], ["2200", "2500"]);
  assert.ok(r.varsayim.some((x) => x.includes("hesaplandı")));
  const yok = raporTamamla(g());
  assert.equal(deger(yok, `d:${din!.id}`), undefined);
  assert.ok(yok.engel.some((x) => x.includes("kapasite bilinmediği")));
});

test("ölçüm cihazı: zimmet → son kullanılan → kalibrasyonu en uzun; üçüncüsü bildirilir; aday yoksa engel", () => {
  const a = (kod: string, zimmette: boolean, sonKullanim: string | null, bitis: string) => ({ id: kod, kod, zimmette, sonKullanim, bitis });
  assert.equal(cihazSec([a("A", false, "2026-10-01", "2027-01-01"), a("B", true, null, "2026-12-01")])?.neden, "zimmet");
  assert.deepEqual(cihazSec([a("A", false, "2026-09-01", "2027-01-01"), a("B", false, "2026-10-01", "2026-12-01")]), { aday: a("B", false, "2026-10-01", "2026-12-01"), neden: "son" });
  assert.deepEqual(cihazSec([a("A", false, null, "2027-01-01"), a("B", false, null, "2027-06-01")])?.aday.kod, "B");
  assert.equal(cihazSec([]), null);
  const r = raporTamamla(g({ cihazlar: [{ turId: "m", turAd: "Metre", secili: false, adaylar: [a("MT-1", false, null, "2027-06-01")] }, { turId: "k", turAd: "Kumpas", secili: false, adaylar: [] }] }));
  assert.equal(deger(r, "cihaz:m"), "MT-1");
  assert.ok(r.varsayim.some((x) => x.includes("MT-1") && x.includes("kalibrasyonu en uzun")));
  assert.ok(r.engel.some((x) => x.includes("Kumpas")));
  assert.equal(deger(raporTamamla(g({ cihazlar: [{ turId: "m", turAd: "Metre", secili: true, adaylar: [a("MT-1", true, null, "2027-06-01")] }] })), "cihaz:m"), undefined, "seçili cihaz kalır");
});

test("bildirim en çok dört satır; aynı varsayım bir kez, kaç raporda olduğu", () => {
  const o = (ad: string, x: object = {}) => ({ ad, yazildi: true, varsayim: ["sonuç uygun (maddelerden)"], tire: [], engel: ["ölçüm cihazı yok"], supheli: [], ...x });
  const l = isBildirimi([o("R1 · K-1", { tire: ["Seri no"] }), o("R2 · K-2", { supheli: ["seri"] }), o("R3 · K-3", { varsayim: [] }), { ad: "R4", yazildi: false, neden: "görünmüyor", varsayim: [], tire: [], engel: [], supheli: [] }],
    { gun: "2026-10-31", bas: "09:00", bit: "09:45" });
  assert.ok(l.length <= 4);
  assert.match(l[0]!, /^3 rapor hazır \(taslak, gönderilmedi\)\. 1 rapora yazılamadı: R4 — görünmüyor\.$/);
  assert.match(l[1]!, /sonuç uygun \(maddelerden\) \(2 raporda\) · kontrol 31\.10\.2026, 09:00–09:45 · R2 · K-2 seri şüpheli/);
  assert.equal(l[2], "'-' bırakılanlar: R1 · K-1 Seri no.");
  assert.equal(l[3], "Kalan engel: ölçüm cihazı yok.");
});
