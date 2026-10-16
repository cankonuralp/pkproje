/* NEREDEN GELDİ: sunum 595 madde 3 (K2 "serbest; SGK ve İSG-KATİP kilitli kalsın"; K6 reisim 2026-10-16: "firma bilgileri kısmında da [satır eklemek
   istedim ekleyemedim]"). 1. bölümün (Firma bilgileri) satırları formatın — adı, sırası, tam satırlığı, varlığı; değeri plandan / kayıttan. Saf
   (veritabanısız): eski formatın aynı çizilmesi, kurucu işlemleri (zorunlular çıkmaz, SGK / İSG-KATİP adı değişmez, aynı bilgi iki kez eklenmez),
   belge değerleri (proje no, müşterinin e-postası, serbest satır, kaçış), şema, Bakanlık uyarısı, S.A.Y'ın işlemi. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { firmaSatirlari } from "../src/format/duzen.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { eksikFirmaKaynaklari, firmaSatiriEkle, firmaSatiriSil, firmaSatiriTasi, firmaSatiriYaz, kimlikler } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const veri = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}): BelgeVerisi => ({
  ...ornekBelge("KOMPRESOR"), tanim: t, planNo: "P-1026-0007", ...d,
  kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1", sgk: "1".repeat(26), isgNo: "ISG-1", eposta: "musteri@deneme.example", tel: "02120000000" },
});
const html = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi(veri(t, d)) as never);
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const gecerli = (t: unknown) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(!r.success && r.error.issues.slice(0, 3))); return r.success ? r.data : null; };
const bul = (t: FormatTanimi, k: string) => firmaSatirlari(t).find((s) => s.kaynak === k)!;

test("eski format: bugünkü 11 satır; satırlar tanıma yazılınca belge BİREBİR aynı; Bakanlık uyarısı yok", () => {
  const t = KOMP();
  assert.deepEqual(firmaSatirlari(t).map((s) => s.kaynak), ["firma", "adres", "rapor_no", "rapor_tarihi", "isg", "sgk", "bas", "bit", "sonraki", "takip", "metot"]);
  let y = firmaSatiriTasi(t, bul(t, "rapor_no").id, 1);
  y = firmaSatiriTasi(y, bul(y, "rapor_no").id, -1);
  assert.ok(y.gorunum.firma?.satirlar.every((s) => s.id.startsWith("k_f")), "yeni kimlikler");
  gecerli(y);
  for (const d of [{}, { kesin: true }] as Partial<BelgeVerisi>[]) assert.equal(html(y, d), html(t, d));
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  let zy = firmaSatiriTasi(z, bul(z, "bas").id, 1);
  zy = firmaSatiriTasi(zy, bul(zy, "bas").id, -1);
  assert.deepEqual(kilitDenetimi(zy, z), []);
});

test("satır eklenir (proje no, müşteri e-postası, serbest), adı yazılır, tam satır, sıra; değerler plandan / kayıttan; kaçış", () => {
  let t = KOMP();
  assert.ok(eksikFirmaKaynaklari(t).includes("plan_no") && !eksikFirmaKaynaklari(t).includes("firma"));
  t = firmaSatiriEkle(t, "plan_no").t;
  t = firmaSatiriEkle(t, "eposta", "Müşteri e-postası").t;
  assert.equal(firmaSatiriEkle(t, "eposta").id, null, "aynı bilgi ikinci kez yok");
  const s = firmaSatiriEkle(t, "serbest", "Kontrol yeri notu");
  t = firmaSatiriYaz(s.t, s.id!, { metin: "  <Kazan> dairesi  ", tam: true });
  t = firmaSatiriYaz(t, bul(t, "rapor_no").id, { ad: " Rapor  no " });
  t = gecerli(t)!;
  const m = metin(html(t));
  for (const x of ["Proje no P-1026-0007", "Müşteri e-postası musteri@deneme.example", "Kontrol yeri notu <Kazan> dairesi", "Rapor no DA-1026-001-abcde"]) {
    assert.ok(m.includes(x), `belgede yok: ${x}`);
  }
  assert.ok(!html(t).includes("<Kazan>"), "sabit yazı kaçışlı");
  assert.ok(!m.includes("Rapor numarası"));
});

test("zorunlular: SGK, İSG-KATİP ve başlangıç çıkmaz; SGK / İSG-KATİP'in adı değişmez; öteki satır çıkar", () => {
  const t = KOMP();
  for (const k of ["sgk", "isg", "bas"]) assert.equal(firmaSatiriSil(t, bul(t, k).id), t, k);
  assert.equal(bul(firmaSatiriYaz(t, bul(t, "sgk").id, { ad: "Başka ad" }), "sgk").ad, "SGK sicil numarası");
  assert.equal(bul(firmaSatiriYaz(t, bul(t, "bas").id, { ad: "Başlangıç" }), "bas").ad, "Başlangıç");
  const y = firmaSatiriSil(t, bul(t, "takip").id);
  assert.equal(firmaSatirlari(y).some((s) => s.kaynak === "takip"), false);
  assert.ok(!metin(html(y)).includes("Takip kontrol tarihi"));
  for (const s of y.gorunum.firma!.satirlar) assert.ok(kimlikler(y).has(s.id), "kurucunun kimlik kümesinde");
});

test("şema: zorunlu satır eksik, aynı bilgi iki kez, bölümle aynı kimlik reddedilir", () => {
  const t = KOMP(), l = firmaSatiriSil(firmaSatiriTasi(t, bul(t, "firma").id, 1), "yok").gorunum.firma!.satirlar;
  const ile = (satirlar: unknown[]) => ({ ...t, gorunum: { ...t.gorunum, firma: { satirlar } } });
  assert.ok(FormatTanimi.safeParse(ile(l)).success);
  assert.equal(FormatTanimi.safeParse(ile(l.filter((s) => s.kaynak !== "sgk"))).success, false, "SGK yok");
  assert.equal(FormatTanimi.safeParse(ile([...l, { id: "k_f99", ad: "X", kaynak: "firma" }])).success, false, "firma iki kez");
  assert.equal(FormatTanimi.safeParse(ile([...l, { id: t.bolumler[0].id, ad: "X", kaynak: "serbest" }])).success, false, "kimlik çakışması");
  assert.ok(FormatTanimi.safeParse(ile([...l, { id: "k_f98", ad: "X", kaynak: "serbest" }, { id: "k_f99", ad: "Y", kaynak: "serbest" }])).success, "serbest birden çok");
});

test("Bakanlık formatında firma bilgileri değişince yayın uyarısı (engel değil); S.A.Y firma_satiri", () => {
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  for (const y of [firmaSatiriEkle(z, "plan_no").t, firmaSatiriSil(z, bul(z, "takip").id), firmaSatiriYaz(z, bul(z, "firma").id, { ad: "Müşteri" })]) {
    assert.ok(kilitDenetimi(y, z).some((x) => x.includes("firma")), JSON.stringify(kilitDenetimi(y, z)));
  }
  const t0 = KOMP();
  assert.match(formatHaritasi(t0), /^- fb_sgk · SGK sicil numarası · SGK sicil numarası$/m);
  const r = formatIslemleri(t0, [
    { islem: "firma_satiri", eylem: "ekle", kaynak: "tel", ad: "Müşteri telefonu" },
    { islem: "firma_satiri", eylem: "ekle", kaynak: "serbest", ad: "Not", yazi: "Deneme notu" },
    { islem: "firma_satiri", eylem: "degistir", oge: "rapor numarası", ad: "Rapor no" },
    { islem: "firma_satiri", eylem: "yukari", oge: "Müşteri telefonu" },
    { islem: "firma_satiri", eylem: "cikar", oge: "SGK sicil numarası" },
    { islem: "firma_satiri", eylem: "ekle", kaynak: "firma" },
    { islem: "firma_satiri", eylem: "ekle", kaynak: "baska" },
  ]);
  assert.deepEqual([r.yapilan.length, r.gecersiz.length], [4, 3], JSON.stringify(r));
  const l = firmaSatirlari(gecerli(r.t)!);
  assert.deepEqual(l.slice(-3).map((s) => s.ad), ["Müşteri telefonu", "Periyodik kontrol metodu ve kapsamı", "Not"]);
  assert.ok(metin(html(r.t)).includes("Müşteri telefonu 02120000000") && metin(html(r.t)).includes("Not Deneme notu"));
});
