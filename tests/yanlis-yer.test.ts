/* NEREDEN GELDİ: reisim 2026-10-26 — "sohbette birden fazla yanlış var, yanlış yerlere yazmış"; "başka rapor formatı ekleyince firma bilgileri kısmı
   değiştirilemez dediğimiz için böyle sıçıyor, değiştirilebilir olsun yoksa firmanın formatı işlevsiz oluyor ve girdiğimiz veriler nihai pdf te işe
   yaramıyor". Basılı formdan kurulan genleşme tankı formatında "Marka" iki yerdeydi: tank tarafında ekipman kaydından (sahada görünmüyordu), basınç
   kaynağı tarafında boş alan ("Marka") — S.A.Y da kişi de tankın etiketini basınç kaynağına yazdı, PDF'te tank hücresi boş kaldı. Bu kilit tutar:
   (1) ekipman kaydı hücresi sahada kendi yerinde yazılır (değer ekipman bilgisine), (2) aynı etiket iki yerde geçince ad sütun grubunun başlığıyla
   ayrılır, (3) firmanın kendi (serbest) formatında künye kilitli değil; Bakanlık düzeninde SGK / İSG-KATİP kilitli kalır.
   Olumsuz kanıt: tests/bozan/yanlis-yer.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { sanalBolumler } from "../src/format/tablo.ts";
import { kilitliKunye } from "../src/format/kunye.ts";
import { formYerlesimi } from "../src/modules/say/rapor-haritasi.ts";
import type { BolumOf } from "../src/format/tanim.ts";

export const TABLO: BolumOf<"tablo"> = {
  id: "k_b3", ad: "2.TEKNİK ÖZELLİKLER", blok: "tablo", kilit: false, sutun: [25, 25, 25, 25], cevaplar: ["U", "UD", "X"], satirlar: [{}, {}, {}, {}],
  hucreler: [
    { r: 0, c: 0, cs: 4, tur: "yazi", m: "2.TEKNİK ÖZELLİKLER" },
    { r: 1, c: 0, cs: 2, tur: "yazi", m: "TANK BİLGİLERİ" }, { r: 1, c: 2, cs: 2, tur: "yazi", m: "BASINÇ KAYNAĞI BİLGİLERİ" },
    { r: 2, c: 0, tur: "yazi", m: "Marka" }, { r: 2, c: 1, tur: "kayit", kaynak: "marka" }, { r: 2, c: 2, tur: "yazi", m: "Marka" },
    { r: 2, c: 3, tur: "alan", id: "k_c2", ad: "Marka", alan: "metin" },
    { r: 3, c: 0, tur: "yazi", m: "Seri no" }, { r: 3, c: 1, tur: "kayit", kaynak: "seri" }, { r: 3, c: 2, tur: "yazi", m: "Kapasite" },
    { r: 3, c: 3, tur: "alan", id: "k_c3", ad: "Kapasite", alan: "sayi" },
  ],
};
export const alanlar = (b: BolumOf<"tablo">) => {
  const s = sanalBolumler(b).find((x) => x.blok === "bilgi");
  return s && s.blok === "bilgi" ? s.alanlar.map((a) => ({ ad: a.ad, ekipman: a.ekipman ?? null, id: a.id })) : [];
};

test("ekipman kaydı hücresi sahada yazılır; aynı etiket grup başlığıyla ayrılır; tek geçen etiket aynen kalır", () => {
  assert.deepEqual(alanlar(TABLO), [
    { ad: "Marka · TANK BİLGİLERİ", ekipman: "marka", id: "k_b3_emarka" },
    { ad: "Marka · BASINÇ KAYNAĞI BİLGİLERİ", ekipman: null, id: "k_c2" },
    { ad: "Seri no", ekipman: "seri", id: "k_b3_eseri" },
    { ad: "Kapasite", ekipman: null, id: "k_c3" },
  ]);
});

test("künye kilidi: firmanın kendi (serbest) formatında yok, Bakanlık düzeninde SGK / İSG-KATİP, formatın kendi seçimi her zaman geçerli", () => {
  assert.deepEqual([...kilitliKunye({ gorunum: { serbest: true } } as never)], []);
  assert.deepEqual([...kilitliKunye({ gorunum: {} } as never)].sort(), ["isg", "sgk"]);
  assert.deepEqual([...kilitliKunye({ gorunum: { serbest: true, kilitli: ["sgk"] } } as never)], ["sgk"]);
});

/* 2026-10-26 (reisim: "yapay zeka bir insan gibi bakınca neyi nereye yazması gerektiğini anlamalı"): S.A.Y'ın haritasında formun yerleşimi — satır
   satır, hücreler soldan sağa; tankın markası [e:marka] "TANK BİLGİLERİ" sütununda, basınç kaynağınınki [a:k_c2] yanında */
test("formun yerleşimi: satır satır, grup başlıkları ve yerler formdaki sırayla", () => {
  const l = formYerlesimi({ bolumler: [TABLO] } as never);
  assert.ok(l.includes("- TANK BİLGİLERİ │ BASINÇ KAYNAĞI BİLGİLERİ"), l.join("\n"));
  assert.ok(l.includes("- Marka │ [e:marka] │ Marka │ [a:k_c2]"), l.join("\n"));
  assert.ok(l.includes("- Seri no │ [e:seri] │ Kapasite │ [a:k_c3]"), l.join("\n"));
  assert.deepEqual(formYerlesimi({ bolumler: [] } as never), [], "tablosuz formatta yerleşim yok");
});

test("formun yerleşimi değerleriyle: S.A.Y yazdıktan sonra hangi değerin hangi grubun altında olduğunu okur", () => {
  const d: Record<string, string> = { "e:marka": "Aydın Trafo", "a:k_c2": "" };
  const l = formYerlesimi({ bolumler: [TABLO] } as never, (y) => d[y] ?? "");
  assert.ok(l.includes("- Marka │ [e:marka = Aydın Trafo] │ Marka │ [a:k_c2 = —]"), l.join("\n"));
});

export const talimatDenetimli = (t: string) => t.includes("Denetim: rapora yazdıktan sonra") && t.includes("Örnek iş:") && t.includes("e:marka = Aydın Trafo");
test("talimat: denetim adımı ve örnek iş (etiket tankın yerine, basınç kaynağı boş)", async () => {
  const { saySistemi } = await import("../src/server/yz/say.ts");
  const t = saySistemi([], "");
  assert.ok(talimatDenetimli(t), "denetim ve örnek talimatta");
});
