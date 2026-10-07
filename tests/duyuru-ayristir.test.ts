/* NEREDEN GELDİ: 379 — reisim 2026-09-26: "Ana sayfada isgüm duyurularını gösterebilir miyiz"; 2026-09-27: "Duyurular sanırım doğru çalışmıyor
   eksik duyuru var ve bazı duyurularda tarih varken bazılarında yok" → her duyuruda yayım tarihi, tarihi doğrulanamayan listeye girmez, en yeni
   üstte (pkproje §9 yirmi sekizinci tur). Saf ayrıştırıcı (src/server/duyuru/ayristir.ts), UYDURMA sayfalarla (e2e/duyuru-ornek.ts — Bakanlık
   sayfasının yapısı, içerik uydurma):
   · İSGGM / İSGÜM: gün + Türkçe ay adı + yıl, başlık (varlıklar çözülür), bağlantı Bakanlığın asıl adresinden; başka birimin / sitenin bağlantısı,
     geçersiz / gelecek tarih, tarihsiz öğe girmez; yapı değişince boş liste; aynı bağlantı bir kez; en çok 50;
   · iş ekipmanları portalı: "GG.AA.YYYY >>" ve "GG/AA/YYYY >>", başlık bölüm sonuna ya da bağlantıya kadar ("… için tıklayınız" atılır),
     göreli bağlantı, bağlantısız parça girmez;
   · Ana sayfadaki kaynak bağlantıları okunan adreslerle aynı.
   Olumsuz kanıt: tests/bozan/duyuru.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { csgbOrnek, isekipmanOrnek, ORNEK_DUYURU } from "../e2e/duyuru-ornek.ts";
import { csgbAyristir, EN_COK, isekipmanAyristir, metin, tarihDogrula, varlikCoz } from "../src/server/duyuru/ayristir.ts";
import { DUYURU_KAYNAKLARI } from "../src/server/duyuru/okuma.ts";

const BUGUN = new Date("2026-10-08T09:00:00Z");

test("varlıklar ve düz metin; tarih doğrulama (takvim, 2000 sonrası, en çok yarın)", () => {
  assert.equal(varlikCoz("S&#246;k&#252;m &amp; &#xD6;l&#231;&#252;m &nbsp;&quot;x&quot; &bilinmez; &#55296;"), "Söküm & Ölçüm  \"x\" &bilinmez; &#55296;");
  assert.equal(metin("<em><strong>A</strong></em>&nbsp;&nbsp; <span>B\n\tC</span>"), "A B C");
  assert.equal(tarihDogrula(6, 10, 2026, BUGUN), "2026-10-06");
  assert.equal(tarihDogrula(9, 10, 2026, BUGUN), "2026-10-09", "yarın kabul (saat farkı)");
  assert.equal(tarihDogrula(11, 10, 2026, BUGUN), null, "gelecek");
  assert.equal(tarihDogrula(31, 2, 2026, BUGUN), null, "takvimde yok");
  assert.equal(tarihDogrula(1, 13, 2026, BUGUN), null);
  assert.equal(tarihDogrula(1, 1, 1999, BUGUN), null);
});

test("İSGGM / İSGÜM: tarih, başlık, asıl adres; en yeni önce sıralama veritabanında", () => {
  assert.deepEqual(csgbAyristir(csgbOrnek("isggm"), "isggm", BUGUN), [
    { url: "https://www.csgb.gov.tr/isggm/duyurular/15092026/", baslik: "Deneme İSGGM duyurusu: Örnek sınav takvimi", tarih: "2026-09-15" },
    { url: "https://www.csgb.gov.tr/isggm/duyurular/02092026/", baslik: "Deneme İSGGM duyurusu: eğitim başvuruları", tarih: "2026-09-02" },
    { url: "https://www.csgb.gov.tr/isggm/duyurular/20082026/", baslik: "Deneme İSGGM duyurusu: eski kayıt", tarih: "2026-08-20" },
  ]);
  assert.deepEqual(csgbAyristir(csgbOrnek("isgum"), "isgum", BUGUN).map((d) => [d.url, d.tarih]), [
    ["https://www.csgb.gov.tr/isgum/duyurular/10092026/", "2026-09-10"], ["https://www.csgb.gov.tr/isgum/duyurular/01082026/", "2026-08-01"]]);
});

test("İSGGM / İSGÜM: başka birimin / sitenin bağlantısı, geçersiz / gelecek / eksik tarih, kısa başlık girmez; tekil; en çok 50; yapı değişince boş", () => {
  const o = (x: Partial<(typeof ORNEK_DUYURU.isggm)[number]>) => ({ kod: "01092026", gun: "01", ay: "Eylül", yil: "2026", baslik: "Geçerli duyuru", ...x });
  const html = csgbOrnek("isggm", [
    o({ kod: "a1" }),
    o({ kod: "a1", baslik: "Aynı bağlantı ikinci kez" }),
    o({ kod: "a2", gun: "31", ay: "Şubat" }),
    o({ kod: "a3", gun: "20", ay: "Ekim" }),
    o({ kod: "a4", ay: "Eylülx" }),
    o({ kod: "a5", baslik: "ab" }),
    o({ kod: "a6", gun: "" }),
  ]) + csgbOrnek("isgum", [o({ kod: "b1" })])
    + '<a href="https://kotu.example/isggm/duyurular/x/" class="announcement-item-href"><span class="day">01</span><span class="moon">Eylül</span><span class="year">2026</span><h1 class="title">Dış site</h1></a>'
    + '<a href="/isggm/duyurular/../../x/" class="announcement-item-href"><span class="day">01</span><span class="moon">Eylül</span><span class="year">2026</span><h1 class="title">Yol aşma</h1></a>';
  assert.deepEqual(csgbAyristir(html, "isggm", BUGUN).map((d) => [d.url.slice(-4), d.baslik]), [["/a1/", "Geçerli duyuru"]]);
  /* başlık h1 yoksa title niteliğinden */
  const nitelik = csgbOrnek("isggm", [o({ kod: "c1", baslik: "Nitelikten &#246;rnek" })]).replace(/<h1 class="title">[^<]*<\/h1>/, "");
  assert.equal(csgbAyristir(nitelik, "isggm", BUGUN)[0]?.baslik, "Nitelikten örnek");
  const cok = csgbOrnek("isggm", Array.from({ length: 70 }, (_, i) => o({ kod: `k${i}` })));
  assert.equal(csgbAyristir(cok, "isggm", BUGUN).length, EN_COK);
  assert.deepEqual(csgbAyristir("<html><body><div class='yeni-tasarim'>…</div></body></html>", "isggm", BUGUN), []);
});

test("iş ekipmanları portalı: iki tarih biçimi, başlık bölüm sonuna / bağlantıya kadar, bağlantısız parça girmez, göreli bağlantı", () => {
  assert.deepEqual(isekipmanAyristir(isekipmanOrnek(), BUGUN), [
    { url: "https://isekipmanlari.csgb.gov.tr/detay.aspx?d=9001", baslik: "Deneme portal duyurusu: rapor formatı güncellendi", tarih: "2026-09-12" },
    { url: "https://isekipmanlari.csgb.gov.tr/detay.aspx?d=9002", baslik: "Deneme portal duyurusu: sözleşme süreleri", tarih: "2026-07-03" },
  ]);
  /* eski biçim: başlık bağlantıya kadar, "… için tıklayınız" kuyruğu atılır; göreli bağlantı; &nbsp; tarih ile işaret arasında */
  const eski = "<div>14/05/2026&nbsp;&gt;&gt;&nbsp; Deneme bankalar hakkında duyuru için <a href=\"detay.aspx?d=77\">tıklayınız</a>. "
    + "02/04/2026 &gt;&gt; Deneme yetki talebi&nbsp; detay için tıklayınız. <a href=\"https://isekipmanlari.csgb.gov.tr/detay.aspx?d=78\">x</a> "
    + "01.04.2026 &gt;&gt; Dış bağlantılı <a href=\"https://kotu.example/detay.aspx?d=79\">x</a> 30.02.2026 &gt;&gt; Geçersiz tarih <a href=\"detay.aspx?d=80\">x</a>"
    + " 01.12.2026 &gt;&gt; Gelecek tarih <a href=\"detay.aspx?d=81\">x</a></div>";
  assert.deepEqual(isekipmanAyristir(eski, BUGUN).map((d) => [d.tarih, d.baslik, d.url.slice(-4)]), [
    ["2026-05-14", "Deneme bankalar hakkında", "d=77"], ["2026-04-02", "Deneme yetki talebi", "d=78"]]);
  assert.deepEqual(isekipmanAyristir("<p>Tasarım değişti</p>", BUGUN), []);
});

test("Ana sayfadaki kaynak bağlantıları okunan adreslerle aynı (istemci sunucu dosyasını içe aktarmaz)", () => {
  const ui = readFileSync(new URL("../src/modules/anasayfa/ui/AnaSayfa.tsx", import.meta.url), "utf8");
  for (const k of DUYURU_KAYNAKLARI) assert.ok(ui.includes(`["${k.ad}", "${k.adres}"]`), k.ad);
  assert.deepEqual(DUYURU_KAYNAKLARI.map((k) => k.kaynak), ["isggm", "isgum", "isekipman"]);
});
