/* NEREDEN GELDİ: reisim 2026-10-26 — S.A.Y asistan Faz 2: "sürükleyerek dosya bırakmakta olsun toplu dosya yüklemekte zip vs de okusun … zip i
   atayım içerideki raporları incele ve ilgili raporları oluştur diyince direk oluşturup ne yaptığını özet geçsin", "rapor oluşturturken ekipman ekleme
   işini kendisi otomatik yapabilsin, ekipman konumunu verilen donelerden kendisi anlayacak, kodu otomatik kendisi verecek ekipmanın sabit kodu +
   0-1-2", "elektrik raporlarında da linyeler vs düzgün okusun", "pdf i el ile formata eklemeye çalışıyor tek tek çizmeye çalışıyor halbuki format
   pdf i ekle tuşu var bu yolu bilmeli". Bu kilit tutar: sıradaki kod (KMP-0, KMP-1 …, kullanılan atlanır); kodsuz S.A.Y girdisi; format_pdf_kur aracı
   (biçim, ekranın aracı, geri dönüş); talimatın kuralları; panelin bırakma / çoklu / ZIP / PDF'ten şablon yolu; katalogda çok ekipman işlemi.
   Veritabanıyla: tests/plan-ici.test.ts "S.A.Y ekipman ekler". Olumsuz kanıt: tests/bozan/say-faz2.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SayEkipmanGirdisi, siradakiKod } from "../src/modules/planlar/sema.ts";
import { aracCagrisi, EKRAN_ARAC_ADLARI, komutDenetle, saySistemi } from "../src/server/yz/say.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { oku } from "./yardimci/denetimler.ts";

const TUR = "0b6c2f7e-1d2a-4c3b-9e8f-112233445566";

export const KURALLAR = {
  talimat: (t: string) => ["format_pdf_kur", "formatı elle çizme", "KMP-0", "Konumu verilen her şeyden çıkar", "plan_ekipmanlar_ekle", "ZIP",
    "tek bir özet tablo", "linye"].every((x) => t.includes(x)),
  panel: (say: string) => /onDrop=\{/.test(say) && /zipAc\(/.test(say) && (say.match(/type="file"[^>]*multiple/g) ?? []).length >= 2
    && /pdfdenSablonKur\(/.test(say) && /k\.tur === "pdfFormat"/.test(say),
  sablon: (y: string) => /formatYukleEylemi\(/.test(y) && /pdfdenHam\(/.test(y) && /basilidanKurEylemi\(/.test(y),
};

test("sıradaki kod: türün kodu + tire + 0, 1, 2 …; kullanılan (şu anki ya da eski) atlanır", () => {
  assert.equal(siradakiKod("KMP", new Set()), "KMP-0");
  assert.equal(siradakiKod("KMP", new Set(["KMP-0", "KMP-1"])), "KMP-2");
  assert.equal(siradakiKod("KMP", new Set(["KMP-1"])), "KMP-0", "boşluk doldurulur");
  assert.equal(siradakiKod("HT", new Set(["KMP-0"])), "HT-0");
});

test("S.A.Y'ın ekipman girdisi: kod isteğe bağlı (boş = yok), verilirse biçim denetimi aynen", () => {
  assert.equal(SayEkipmanGirdisi.parse({ tur: TUR }).kod, undefined);
  assert.equal(SayEkipmanGirdisi.parse({ tur: TUR, kod: "  " }).kod, undefined);
  assert.equal(SayEkipmanGirdisi.parse({ tur: TUR, kod: " kmp 3 " }).kod, "KMP3");
  assert.equal(SayEkipmanGirdisi.safeParse({ tur: TUR, kod: "A" }).success, false);
  assert.ok(ISLEM_KATALOGU.some((t) => t.ad === "plan_ekipmanlar_ekle"), "çok ekipman tek işlemde");
});

test("format_pdf_kur: ekranın aracı; biçim denetimi; ekranın geri gönderdiği komut aynı", () => {
  assert.ok(EKRAN_ARAC_ADLARI.has("format_pdf_kur"));
  const k = aracCagrisi({ type: "tool_use", id: "t1", name: "format_pdf_kur", input: { tur: TUR, ek: 2, taslak_surum: null } });
  assert.deepEqual(k, { tur: "pdfFormat", turId: TUR, ek: 2, taslakSurumu: null, id: "t1" });
  assert.deepEqual(komutDenetle(k), k);
  assert.equal(aracCagrisi({ type: "tool_use", id: "t2", name: "format_pdf_kur", input: { tur: "x", ek: 1 } }), null, "tür kimliği");
  assert.equal(aracCagrisi({ type: "tool_use", id: "t3", name: "format_pdf_kur", input: { tur: TUR, ek: 0 } }), null, "ek sırası 1'den");
});

test("talimat: PDF'ten şablon yolu, kendiliğinden ekipman / kod / konum, toplu iş özeti, elektrik linyeleri", () => {
  assert.ok(KURALLAR.talimat(saySistemi([], "")));
});

test("panel: dosya bırakma, çoklu seçim, ZIP açma, PDF'ten şablon (tür sayfasındaki yol)", () => {
  assert.ok(KURALLAR.panel(oku("src/modules/say/ui/SayAsistan.tsx")));
  assert.ok(KURALLAR.sablon(oku("src/modules/ekipman-turleri/ui/pdfdenSablon.ts")));
});

/* 2026-10-31 (S.A.Y belge formatları — reisim: "önerdiklerini kabul ediyorum"): aynı araç belgenin formatını da kurar — tur yerine belge; geçersiz belge reddedilir;
   ekran Belge formatları'nın yolunu (pdfdenBelgeKur → belge kurucusu) kullanır */
test("format_pdf_kur belge ile: biçim, geri gönderilen komut aynı, ekranın yolu", () => {
  const k = aracCagrisi({ type: "tool_use", id: "b1", name: "format_pdf_kur", input: { belge: "sozlesme", ek: 1, taslak_surum: 3 } });
  assert.deepEqual(k, { tur: "pdfFormat", turId: "", belge: "sozlesme", ek: 1, taslakSurumu: 3, id: "b1" });
  assert.deepEqual(komutDenetle(k), k);
  assert.equal(aracCagrisi({ type: "tool_use", id: "b2", name: "format_pdf_kur", input: { belge: "olmayan", ek: 1 } }), null);
  const say = oku("src/modules/say/ui/SayAsistan.tsx");
  assert.ok(/pdfdenBelgeKur\(k\.belge, dosya, k\.taslakSurumu\)/.test(say) && say.includes("/firma-ayarlari/belgeler/${b.taslak}/kurucu"));
});
