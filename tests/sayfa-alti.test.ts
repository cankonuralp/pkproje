/* NEREDEN GELDİ: sunum 595 madde 14 (reisim K1 "Evet, hepsi": "sayfa altı yazısı yazılır — adres, telefon, sayfa no, gizlilik notu"). Saf
   (veritabanısız): sayfa altı yazısında {firma}, {kod}, {adres}, {tel}, {eposta} Firma ayarlarındaki bilgilerle değişir, boş bilgi ayracıyla düşer,
   değerin içindeki "{…}" yeniden çevrilmez; yazısız format bugünkü gibi ("firma · kod", şerit değişmez); formatın kendi yazısı PDF şeridinde her
   sayfada sayfa numarasının yanında (kaçışlı); Firma ayarlarında telefon (yalnız rakam, boşluk, + ( ) -; verilmezse kayıttaki kalır). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { belgeAltYazisi, raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { raporAltBilgisi } from "../src/belge/pdf.ts";
import { altYazisi } from "../src/format/duzen.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { FirmaBilgiGirdisi } from "../src/modules/firma-ayarlari/sema.ts";
import { gorunumBasligiYaz } from "../src/modules/rapor-format/kurucu.ts";
import { AYAR_BOLUMLERI } from "../src/server/ayar/ayar.ts";

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const yazili = (y: string) => gorunumBasligiYaz(KOMP(), "alt_yazi", y);
const FIRMA = { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2, adres: "Deneme Mah. 1. Sok. No 1", tel: "0212 000 00 00", eposta: "rapor@deneme.example" };
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("yer tutucular: firma, kod, adres, telefon, e-posta; boş bilgi ayracıyla düşer; değerdeki {…} yeniden çevrilmez; yazısız format bugünkü gibi", () => {
  assert.equal(altYazisi(yazili("{firma} · {adres} · Tel: {tel} · {eposta} · {kod}"), FIRMA, "DA-FR-01"),
    "Deneme Muayene A.Ş. · Deneme Mah. 1. Sok. No 1 · Tel: 0212 000 00 00 · rapor@deneme.example · DA-FR-01");
  assert.equal(altYazisi(yazili("{firma} · {tel} · {adres} · Gizlidir"), { ad: "Deneme" }, "K"), "Deneme · Gizlidir", "boş bilgi düşer");
  assert.equal(altYazisi(yazili("{adres} · {kod}"), { ad: "D", adres: "{kod} Sokak" }, "K1"), "{kod} Sokak · K1", "değer yeniden çevrilmez");
  assert.equal(altYazisi(KOMP(), FIRMA, "K1"), "Deneme Muayene A.Ş. · K1");
});

test("belge: sonundaki sayfa altı Firma ayarlarındaki bilgilerle; PDF şeridi — yazısız formatta bugünkü gibi, yazılı formatta her sayfada (kaçışlı)", () => {
  const t = yazili("{firma} · Tel: {tel} · Bu rapor <gizlidir>");
  const v = { ...ornekBelge("KOMPRESOR"), tanim: t, firma: FIRMA };
  const h = renderToStaticMarkup(raporBelgesi(v) as never);
  assert.ok(metin(h).includes("Deneme Muayene A.Ş. · Tel: 0212 000 00 00 · Bu rapor <gizlidir>"), metin(h).slice(-300));
  assert.equal(belgeAltYazisi({ ...ornekBelge("KOMPRESOR"), firma: FIRMA }).format, "", "yazısız format: şeritte ek satır yok");
  const a = belgeAltYazisi(v);
  assert.equal(a.format, "Deneme Muayene A.Ş. · Tel: 0212 000 00 00 · Bu rapor <gizlidir>");
  const s = raporAltBilgisi(v);
  assert.ok(s.includes("Tel: 0212 000 00 00 · Bu rapor &lt;gizlidir&gt;") && !s.includes("<gizlidir>"), "şeritte kaçışlı");
  assert.ok(s.includes('class="pageNumber"'), "sayfa numarası yerinde");
  assert.ok(!raporAltBilgisi({ ...ornekBelge("KOMPRESOR"), firma: FIRMA }).includes("line-clamp"), "yazısız formatın şeridi bugünkü gibi");
});

test("Firma ayarları: telefon — başlangıç boş, rakam / boşluk / + ( ) -; harf reddedilir; verilmezse geçerli (kayıttaki kalır)", () => {
  assert.equal(AYAR_BOLUMLERI.firma_bilgileri.parse({}).tel, "");
  const temel = { ad: "", adres: "", eposta: "", akr: "", nusha: "2" };
  assert.equal(FirmaBilgiGirdisi.safeParse({ ...temel, tel: " +90 (212) 000-00-00 " }).data?.tel, "+90 (212) 000-00-00");
  assert.equal(FirmaBilgiGirdisi.safeParse({ ...temel, tel: "ara beni" }).success, false);
  assert.equal(FirmaBilgiGirdisi.safeParse({ ...temel, tel: "1".repeat(31) }).success, false);
  const r = FirmaBilgiGirdisi.safeParse(temel);
  assert.ok(r.success && !("tel" in r.data && r.data.tel !== undefined), "verilmeyen telefon yazılmaz");
});
