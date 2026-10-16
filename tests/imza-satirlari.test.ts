/* NEREDEN GELDİ: sunum 595 madde 1 (reisim 2026-10-16: "format yapıcıda bu ve benzeri kısımlarda değişiklik yapamıyorum, tıklayıp değiştiremiyorum,
   satır sütun ekleyemiyorum" · K6 "mesela teknik yönetici için unvan diploma no gibi satırlar eklemek istedim ekleyemedim"). İmza bölümünün
   SATIRLARI formatın (adı, sırası, varlığı), değeri kişinin kaydından. Saf (veritabanısız): şema, eski formatın aynı çizilmesi, kurucu işlemleri,
   belge değerleri (teknik yöneticinin personel kaydı, serbest satır, kaçış), Bakanlık uyarısı, S.A.Y'ın format işlemi. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { imzaSatirlari } from "../src/format/duzen.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import {
  eksikImzaAlanlari, imzaKisisiYaz, imzaSatiriEkle, imzaSatiriSil, imzaSatiriTasi, imzaSatiriYaz, kimlikler,
} from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const imzaYeri = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "imza");
const imzaB = (t: FormatTanimi) => t.bolumler[imzaYeri(t)] as BolumOf<"imza">;
const gecerli = (t: unknown) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(!r.success && r.error.issues.slice(0, 3))); return r.success ? r.data : null; };

function veri(t: FormatTanimi, d: Partial<BelgeVerisi> = {}): BelgeVerisi {
  return {
    firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2 }, no: "DA-1026-001-abcde", revizyon: 0, formatSira: 1, durum: "onaylandi",
    tur: { ad: "Hava tankı", kod: "HT", kontrolStd: [] },
    kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: null, sgk: null, isgNo: null },
    tarih: { bas: "2026-10-05T09:00", bit: "2026-10-05T10:30", sonraki: null, takip: null, rapor: "2026-10-05" },
    ekipman: { kod: "HT-1", marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tanim: t, cevaplar: Cevaplar.parse({}), cihazlar: [], fotolar: [], sonuc: "uygun",
    yazan: { ad: "Deneme Bir", meslek: "mak-muh", ekipnet: "123", diploma: "D-1", oda: "O-1", eposta: "bir@deneme.example", tel: "05000000001" },
    onay: { ad: "Deneme Teknik", zaman: "2026-10-05T08:00:00.000Z",
      kisi: { meslek: "diger", meslekMetin: "Teknik Yönetici <b>", ekipnet: "456", diploma: "TD-9", oda: "TO-7", eposta: null, tel: null } },
    imza: null, ...d,
  };
}
const html = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi(veri(t, d)) as never);
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("eski format (satırsız): imzalar'dan bugünkü satırlar; satırları tanıma yazılmış hâli belgede BİREBİR aynı çizilir", () => {
  const t = KOMP();
  assert.deepEqual(imzaSatirlari(imzaB(t)).map((s) => [s.kim, s.alan, s.ad]), [
    ["uzman", "ad", "Adı soyadı"], ["uzman", "meslek", "Mesleği"], ["uzman", "ekipnet", "Yetkili kişi kayıt no (EKİPNET)"], ["uzman", "diploma", "Diploma no"],
    ["uzman", "oda", "Oda sicil no"], ["uzman", "imza", "İmzası"], ["teknik", "ad", "Onaylayan teknik yönetici"], ["teknik", "zaman", "Onay zamanı"],
  ]);
  /* bir satırı aşağı alıp geri yukarı: satırlar tanımda, sıra aynı */
  const i = imzaYeri(t), ilk = imzaSatirlari(imzaB(t))[0].id;
  let y = imzaSatiriTasi(t, i, ilk, 1);
  y = imzaSatiriTasi(y, i, imzaSatirlari(imzaB(y))[1].id, -1);
  assert.ok(imzaB(y).satirlar?.length === 8, "satırlar tanıma yazıldı");
  assert.ok(imzaB(y).satirlar!.every((s) => s.id.startsWith("k_i")), "yeni kimlikler (varsayılanın imz_ kimlikleri tanıma girmez)");
  gecerli(y);
  for (const d of [{}, { imza: { zaman: "2026-10-06T10:00:00.000Z", yontem: "e-imzalı PDF" } }, { onay: null }, { kesin: true }] as Partial<BelgeVerisi>[]) {
    assert.equal(html(y, d), html(t, d), "eski formatla aynı belge");
  }
  assert.deepEqual(kilitDenetimi(y, t), [], "aynı satırlar Bakanlık uyarısı vermez");
});

test("teknik yönetici için meslek / diploma / oda sicil satırları eklenir, değerleri onaylayanın personel kaydından; kaçış; onay yoksa -", () => {
  let t = KOMP();
  const i = imzaYeri(t);
  assert.deepEqual(eksikImzaAlanlari(imzaB(t), "teknik"), ["meslek", "ekipnet", "diploma", "oda", "eposta", "tel", "imza"]);
  for (const a of ["meslek", "diploma", "oda"] as const) t = imzaSatiriEkle(t, i, "teknik", a).t;
  const id = imzaSatiriEkle(t, i, "teknik", "diploma").id;
  assert.ok(id, "aynı bilgi ikinci kez de eklenebilir (kurucu listede eksikleri gösterir)");
  t = gecerli(t)!;
  assert.equal(imzaB(t).satirlar!.filter((s) => s.kim === "teknik").length, 5);
  const m = metin(html(t));
  for (const x of ["Onaylayan teknik yönetici Deneme Teknik", "Mesleği / unvanı Teknik Yönetici <b>", "Diploma no TD-9", "Oda sicil no TO-7", "Diploma no D-1"]) {
    assert.ok(m.includes(x), `belgede yok: ${x}`);
  }
  assert.ok(!html(t).includes("Teknik Yönetici <b>"), "personelden gelen metin kaçışlı");
  const onaysiz = metin(html(t, { onay: null }));
  assert.ok(onaysiz.includes("Diploma no TD-9") === false && onaysiz.includes("Onaylayan teknik yönetici -"));
  /* zaman yalnız teknik yöneticide; bilinmeyen kişi bilgisi eklenmez */
  assert.equal(imzaSatiriEkle(t, i, "uzman", "zaman").id, null);
  assert.equal(imzaSatiriEkle(t, i, "teknik").id, null);
});

test("serbest satır: ad ve sabit yazı formatın, boşsa boş hücre; ad yazılır, tam satır, sıra, çıkar; kişi kaldırılınca satırları gider", () => {
  let t = KOMP();
  const i = imzaYeri(t);
  const y = imzaSatiriEkle(t, i, "diger", undefined, "Tesis yetkilisi");
  t = imzaSatiriYaz(y.t, i, y.id!, { metin: "  Kaşe / imza  " });
  const kase = imzaSatiriEkle(t, i, "diger", undefined, "Kaşe");
  t = imzaSatiriYaz(kase.t, i, kase.id!, { tam: true });
  t = gecerli(t)!;
  let m = metin(html(t));
  assert.ok(m.includes("Tesis yetkilisi Kaşe / imza"), m);
  assert.match(html(t), /<td class="rb-e">Kaşe<\/td><td colspan="3"><\/td>/i, "boş sabit yazı → boş hücre, tam satır");
  /* adı yazılır; boş ad yazılmaz */
  const uzmanAd = imzaSatirlari(imzaB(t)).find((s) => s.kim === "uzman" && s.alan === "ad")!;
  t = imzaSatiriYaz(t, i, uzmanAd.id, { ad: "  Muayene   uzmanı " });
  t = imzaSatiriYaz(t, i, uzmanAd.id, { ad: "   " });
  assert.equal(imzaSatirlari(imzaB(t)).find((s) => s.id === uzmanAd.id)?.ad, "Muayene uzmanı");
  m = metin(html(t));
  assert.ok(m.includes("Muayene uzmanı Deneme Bir") && !m.includes("Adı soyadı Deneme Bir"));
  /* en üstteki yukarı çıkmaz (aynı tanım) */
  const ilk = imzaSatirlari(imzaB(t))[0];
  assert.equal(imzaSatiriTasi(t, i, ilk.id, -1), t);
  /* teknik yönetici kaldırılınca bütün satırları gider, imzalar özeti uzman; en az bir kişi kalır (ekran), uzman kalınca belgede onaylayan yok */
  t = imzaKisisiYaz(t, i, "teknik", false);
  assert.deepEqual(imzaB(t).imzalar, ["uzman"]);
  assert.ok(!metin(html(t)).includes("Deneme Teknik"));
  t = imzaKisisiYaz(t, i, "teknik", true);
  assert.deepEqual(imzaB(t).imzalar, ["uzman", "teknik"]);
  t = imzaSatiriSil(t, i, kase.id!);
  assert.ok(!html(gecerli(t)!).includes(">Kaşe<"), "çıkarılan satır belgede yok");
  assert.equal(new Set(imzaB(t).satirlar!.map((s) => s.id)).size, imzaB(t).satirlar!.length, "kimlikler tekil");
  for (const s of imzaB(t).satirlar!) assert.ok(kimlikler(t).has(s.id), "kurucunun kimlik kümesinde");
});

test("şema: serbest satırda kişi bilgisi, kişi satırında bilgisiz, uzmanda onay zamanı, iki kez kullanılan kimlik reddedilir", () => {
  const t = KOMP(), i = imzaYeri(t);
  const ile = (satirlar: unknown[]) => ({ ...t, bolumler: t.bolumler.map((b, j) => (j === i ? { ...b, satirlar } : b)) });
  assert.ok(FormatTanimi.safeParse(ile([{ id: "k_i1", ad: "Kaşe", kim: "diger" }])).success);
  for (const kotu of [
    [{ id: "k_i1", ad: "X", kim: "diger", alan: "ad" }], [{ id: "k_i1", ad: "X", kim: "teknik" }], [{ id: "k_i1", ad: "X", kim: "uzman", alan: "zaman" }],
    [{ id: "k_i1", ad: "X", kim: "diger" }, { id: "k_i1", ad: "Y", kim: "diger" }], [{ id: t.bolumler[0].id, ad: "X", kim: "diger" }],
  ]) assert.equal(FormatTanimi.safeParse(ile(kotu)).success, false, JSON.stringify(kotu));
});

test("Bakanlık imza bölümünde satır değişince yayın uyarısı (engel değil): ad, yeni satır, çıkarılan satır", () => {
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), i = imzaYeri(z);
  assert.ok(imzaB(z).kilit);
  const ad = imzaSatiriYaz(z, i, imzaSatirlari(imzaB(z))[0].id, { ad: "Ad soyad" });
  const yeni = imzaSatiriEkle(z, i, "teknik", "diploma").t;
  const cikan = imzaSatiriSil(z, i, imzaSatirlari(imzaB(z)).at(-1)!.id);
  for (const y of [ad, yeni, cikan]) assert.ok(kilitDenetimi(y, z).some((x) => x.includes("değiştirilmiş")), JSON.stringify(kilitDenetimi(y, z)));
});

test("S.A.Y: haritada imza satırları; imza_satiri ekle (teknik diploma, serbest yazıyla) / değiştir / yukarı / çıkar; yanlış istek nedeniyle", () => {
  const t0 = KOMP(), once = JSON.stringify(t0);
  assert.match(formatHaritasi(t0), /^- imz_t_ad · Onaylayan teknik yönetici · imza satırı, Teknik yönetici · Adı soyadı$/m);
  const r = formatIslemleri(t0, [
    { islem: "imza_satiri", bolum: "imza", eylem: "ekle", kisi: "teknik", bilgi: "diploma", ad: "Teknik yöneticinin diploma no" },
    { islem: "imza_satiri", bolum: "imza", eylem: "ekle", kisi: "diger", ad: "Tesis yetkilisi", yazi: "Ad soyad / imza" },
    { islem: "imza_satiri", bolum: "imza", eylem: "degistir", oge: "adı soyadı", ad: "Muayene uzmanı" },
    { islem: "imza_satiri", bolum: "imza", eylem: "yukari", oge: "Tesis yetkilisi" },
    { islem: "imza_satiri", bolum: "imza", eylem: "cikar", oge: "Oda sicil no" },
    { islem: "imza_satiri", bolum: "imza", eylem: "ekle", kisi: "uzman", bilgi: "zaman" },
    { islem: "imza_satiri", bolum: "imza", eylem: "ekle", kisi: "biri", bilgi: "ad" },
    { islem: "imza_satiri", bolum: "imza", eylem: "cikar", oge: "olmayan satır" },
  ]);
  assert.equal(JSON.stringify(t0), once, "girdi bozulmaz");
  assert.equal(r.yapilan.length, 5, JSON.stringify(r));
  assert.equal(r.gecersiz.length, 3, JSON.stringify(r.gecersiz));
  const l = imzaSatirlari(imzaB(gecerli(r.t)!));
  assert.deepEqual(l.map((s) => s.ad), ["Muayene uzmanı", "Mesleği", "Yetkili kişi kayıt no (EKİPNET)", "Diploma no", "İmzası", "Onaylayan teknik yönetici",
    "Onay zamanı", "Tesis yetkilisi", "Teknik yöneticinin diploma no"]);
  assert.equal(l.find((s) => s.ad === "Tesis yetkilisi")?.metin, "Ad soyad / imza");
  const m = metin(html(r.t));
  assert.ok(m.includes("Teknik yöneticinin diploma no TD-9") && m.includes("Tesis yetkilisi Ad soyad / imza"), m);
});
