/* NEREDEN GELDİ: sunum 595 madde 13 (reisim K1 "Evet, hepsi": "başlık tablosuna satır eklenir — ör. revizyon, nüsha —; hücrelerin yeri değişir").
   Sayfa başındaki başlık tablosu formatın — doküman bilgisi satırları (adı, sırası, varlığı; değer kayıttan ya da serbest yazı) ve hücrelerin
   sırası (logo · firma · akreditasyon · belge adı · doküman bilgisi). Saf (veritabanısız): eski format BİREBİR aynı çizilir (satırlar tanıma
   yazılınca da), kurucu işlemleri (aynı bilgi iki kez yok, son satır çıkmaz, hücre uçtan taşmaz), belge değerleri (revizyon, nüsha, sonraki
   kontrol, serbest yazı kaçışlı), eski etiket yazımı satırların adına gider, şema, Bakanlık uyarısı, S.A.Y'ın işlemleri. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { basSatirlari, basSirasi } from "../src/format/duzen.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { BAS_HUCRELERI, FormatTanimi } from "../src/format/tanim.ts";
import {
  basHucreTasi, basSatiriEkle, basSatiriSil, basSatiriTasi, basSatiriYaz, eksikBasKaynaklari, gorunumBasligiYaz, kimlikler,
} from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const html = (t: FormatTanimi, d: object = {}) => renderToStaticMarkup(raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t, ...d }) as never);
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const basHtml = (h: string) => h.slice(h.indexOf('<table class="rb-bas"'), h.indexOf("</table>") + 8);
const gecerli = (t: unknown) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(!r.success && r.error.issues.slice(0, 3))); return r.success ? r.data : null; };
const bul = (t: FormatTanimi, k: string) => basSatirlari(t).find((s) => s.kaynak === k)!;

test("eski format: bugünkü dört satır ve hücre sırası; satırlar tanıma yazılınca ve hücre gidip gelince belge BİREBİR aynı; Bakanlık uyarısı yok", () => {
  const t = KOMP();
  assert.deepEqual(basSatirlari(t).map((s) => s.kaynak), ["kod", "surum", "no", "tarih"]);
  assert.deepEqual(basSirasi(t), BAS_HUCRELERI);
  let y = basSatiriTasi(t, bul(t, "no").id, 1);
  y = basSatiriTasi(y, bul(y, "no").id, -1);
  assert.ok(y.gorunum.basSatirlar?.every((s) => s.id.startsWith("k_h")), "yeni kimlikler");
  y = basHucreTasi(basHucreTasi(y, "akr", 1), "akr", -1);
  assert.equal(y.gorunum.basSira, undefined, "bugünkü sıra yazılmaz");
  gecerli(y);
  for (const d of [{}, { kesin: true }]) assert.equal(html(y, d), html(t, d));
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  let zy = basSatiriTasi(z, bul(z, "kod").id, 1);
  zy = basSatiriTasi(zy, bul(zy, "kod").id, -1);
  assert.deepEqual(kilitDenetimi(zy, z), []);
  assert.ok(kilitDenetimi(basSatiriEkle(z, "revizyon").t, z).length > 0, "Bakanlık formatında satır eklemek yayında uyarı");
  assert.ok(kilitDenetimi(basHucreTasi(z, "logo", 1), z).length > 0, "Bakanlık formatında hücre yeri uyarı");
});

test("satır eklenir (revizyon, nüsha, sonraki kontrol, serbest), adı yazılır, sırası değişir; değerler kayıttan; serbest yazı kaçışlı", () => {
  let t = KOMP();
  assert.ok(eksikBasKaynaklari(t).includes("revizyon") && !eksikBasKaynaklari(t).includes("kod"));
  t = basSatiriEkle(t, "revizyon").t;
  t = basSatiriEkle(t, "nusha", "Nüsha").t;
  t = basSatiriEkle(t, "sonraki").t;
  assert.equal(basSatiriEkle(t, "nusha").id, null, "aynı bilgi ikinci kez yok");
  const s = basSatiriEkle(t, "serbest", "Yürürlük");
  t = basSatiriYaz(s.t, s.id!, { metin: "  <01.01.2026>  " });
  t = basSatiriYaz(t, bul(t, "no").id, { ad: "Rapor numarası" });
  t = basSatiriTasi(t, bul(t, "revizyon").id, -1);
  t = gecerli(t)!;
  const m = metin(basHtml(html(t, { revizyon: 2 })));
  for (const x of ["Revizyon : 2", "Nüsha : 2", "Sonraki kontrol : 05.10.2027", "Yürürlük : <01.01.2026>", "Rapor numarası : DA-1026-001-abcde"]) {
    assert.ok(m.includes(x), `başlıkta yok: ${x} — ${m}`);
  }
  assert.ok(m.indexOf("Revizyon") < m.indexOf("Nüsha"), "taşınan satırın yeri");
  assert.ok(!basHtml(html(t)).includes("<01.01.2026>"), "sabit yazı kaçışlı");
  for (const x of t.gorunum.basSatirlar!) assert.ok(kimlikler(t).has(x.id), "kurucunun kimlik kümesinde");
});

test("son satır çıkmaz; hücre uçtan taşmaz; hücre sırası belgede ve sütun genişliği hücreyle gider", () => {
  let t = KOMP();
  for (const k of ["surum", "no", "tarih"]) t = basSatiriSil(t, bul(t, k).id);
  assert.deepEqual(basSatirlari(t).map((s) => s.kaynak), ["kod"]);
  assert.equal(basSatiriSil(t, bul(t, "kod").id), t, "son satır");
  assert.equal(basHucreTasi(t, "logo", -1), t);
  assert.equal(basHucreTasi(t, "dok", 1), t);
  t = basHucreTasi(basHucreTasi(t, "dok", -1), "dok", -1);
  assert.deepEqual(basSirasi(t), ["logo", "firma", "dok", "akr", "ad"]);
  const h = basHtml(html(gecerli(t)!));
  assert.ok(h.indexOf("rb-dok") < h.indexOf("rb-bas-ad"), "doküman bilgisi belge adından önce");
  assert.match(h, /<col style="width:11%"\/><col style="width:27%"\/><col style="width:25%"\/><col style="width:10%"\/><col style="width:27%"\/>/);
});

test("eski etiket yazımı (baslik bas_no) satırları tanımlı formatta satırın adını değiştirir", () => {
  const t = gorunumBasligiYaz(KOMP(), "bas_no", "Belge No");
  assert.equal(bul(t, "no").ad, "Belge No", "satırsız formatta bas etiketi");
  const y = gorunumBasligiYaz(basSatiriEkle(t, "revizyon").t, "bas_no", "Rapor Sıra No");
  assert.equal(bul(y, "no").ad, "Rapor Sıra No");
  assert.equal(y.gorunum.bas, undefined, "satırlar tanımdayken etiketler satırlarda");
});

test("şema: aynı bilgi iki kez, bölümle aynı kimlik, eksik / tekrarlı hücre sırası reddedilir; serbest birden çok olur", () => {
  const t = KOMP(), l = basSatiriEkle(t, "revizyon").t.gorunum.basSatirlar!;
  const ile = (basSatirlar: unknown[], basSira?: unknown[]) => ({ ...t, gorunum: { ...t.gorunum, basSatirlar, ...(basSira ? { basSira } : {}) } });
  assert.ok(FormatTanimi.safeParse(ile(l)).success);
  assert.equal(FormatTanimi.safeParse(ile([...l, { id: "k_h99", ad: "X", kaynak: "no" }])).success, false, "no iki kez");
  assert.equal(FormatTanimi.safeParse(ile([...l, { id: t.bolumler[0].id, ad: "X", kaynak: "serbest" }])).success, false, "kimlik çakışması");
  assert.ok(FormatTanimi.safeParse(ile([...l, { id: "k_h98", ad: "X", kaynak: "serbest" }, { id: "k_h99", ad: "Y", kaynak: "serbest" }])).success);
  assert.equal(FormatTanimi.safeParse(ile(l, ["logo", "logo", "akr", "ad", "dok"])).success, false, "tekrarlı hücre");
  assert.equal(FormatTanimi.safeParse(ile(l, ["logo", "firma", "akr", "ad"])).success, false, "eksik hücre");
});

test("S.A.Y: haritada hücre sırası ve satırlar; bas_satiri ekle / değiştir / çıkar / taşı, bas_hucre — yapılamayan nedeniyle döner", () => {
  const t = KOMP();
  assert.ok(formatHaritasi(t).includes("hücreler soldan sağa: logo · firma · akr · ad · dok"));
  const r = formatIslemleri(t, [
    { islem: "bas_satiri", eylem: "ekle", kaynak: "revizyon", ad: "Rev." },
    { islem: "bas_satiri", eylem: "ekle", kaynak: "revizyon" },
    { islem: "bas_satiri", eylem: "ekle", kaynak: "serbest", ad: "Yürürlük", yazi: "01.01.2026" },
    { islem: "bas_satiri", eylem: "degistir", oge: "Rapor No", ad: "Belge No" },
    { islem: "bas_satiri", eylem: "cikar", oge: "surum" },
    { islem: "bas_satiri", eylem: "yukari", oge: "Rev." },
    { islem: "bas_hucre", alan: "logo", eylem: "asagi" },
    { islem: "bas_hucre", alan: "dok", eylem: "asagi" },
    { islem: "bas_hucre", alan: "yok", eylem: "asagi" },
  ]);
  assert.equal(r.yapilan.length, 6, JSON.stringify(r));
  assert.equal(r.gecersiz.length, 3, JSON.stringify(r.gecersiz));
  const y = gecerli(r.t)!;
  assert.deepEqual(basSatirlari(y).map((s) => s.ad), ["Doküman Kodu", "Belge No", "Rev.", "Rapor Tarihi", "Yürürlük"]);
  assert.equal(basSatirlari(y).some((s) => s.kaynak === "surum"), false);
  assert.ok(basSatirlari(y).findIndex((s) => s.kaynak === "revizyon") < basSatirlari(y).findIndex((s) => s.kaynak === "serbest"));
  assert.equal(basSatirlari(y).find((s) => s.kaynak === "serbest")?.metin, "01.01.2026");
  assert.deepEqual(basSirasi(y), ["firma", "logo", "akr", "ad", "dok"]);
  assert.ok(formatHaritasi(y).includes("Rev. · Revizyon"));
});
