/* NEREDEN GELDİ: reisim 2026-10-26 — S.A.Y asistan Faz 3 (eğitim): "yapay zeka iyi çalışmıyor eğitmemiz gerekli kast ettiğim şeyi iyi anlamıyor",
   "her türlü şeyi anlamalı ben clauda ne desem anlıyor" ve reisim'in Claude'u kullanma biçiminin 14 maddelik özeti (ekipman bilgisi okutma, ekipman
   kaydı, toplu rapor, kontrol saatleri, varsayılan değer, mükerrer kayıt, boş seçim, onaya gönderme ve yayılan yanlış bilgi, Word formu, standart ve
   cihaz türü bağlama, not → istek listesi …). DENEME SETİ: reisim'in sözlerine benzeyen her cümle için S.A.Y'ın kullanacağı araç / işlem hem VAR
   (katalogda ya da ekran aracı) hem talimatta o işle birlikte anılıyor. Modelin gerçek cevabı burada ölçülmez (gerçek hizmete istek gitmez); taklitli
   akış e2e/say.spec. Olumsuz kanıt: tests/bozan/say-faz3.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { EKRAN_ARAC_ADLARI, saySistemi } from "../src/server/yz/say.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

/** reisim'in sözüne benzer cümle → S.A.Y'ın kullanacağı araçlar / işlemler */
export const DENEME_SETI: readonly (readonly [string, readonly string[]])[] = [
  ["Bu etiketteki bilgileri rapora gir", ["rapora_yaz", "rapor_yaz"]],
  ["Plana 3 kompresör ekle, kodlarını sen ver, konumları fotoğraftan anla", ["plan_ekipman_ekle", "plan_ekipmanlar_ekle"]],
  ["Bu planın bütün raporlarını oluştur ve doldur", ["plan_getir", "rapor_ac", "rapor_yaz"]],
  ["Kontrol saatlerini türe göre dağıt, sonraki kontrol tarihlerini yaz", ["rapor_saat_plani"]],
  ["Boş seçimleri uygun yap, varsayılanları uygula", ["rapor_getir", "rapor_yaz"]],
  ["Mükerrer ekipmanları ayıkla", ["plan_getir", "rapor_ara", "plan_ekipman_pasif", "rapor_sil"]],
  ["Hazır raporları onaya gönder", ["rapor_ara", "rapor_onaya_gonder"]],
  ["Bu PDF'ten bu türün formatını kur", ["format_pdf_kur"]],
  ["Word formunu formata çevir", ["format_pdf_kur"]],
  ["TS EN 12817'yi ve manometreyi bu türe bağla", ["tur_baglanti_secenekleri", "tur_standart_ekle", "tur_baglanti_kaydet"]],
  ["ZIP'teki raporları incele ve ilgili raporları oluştur", ["plan_ekipmanlar_ekle", "rapor_ac", "rapor_yaz"]],
  ["Panodaki linyeleri tabloya gir", ["satir_ekle"]],
  ["Bu ekipmana takip muayenesi aç", ["rapor_takip_ac"]],
];

export const talimatKarsilar = (t: string, araclar: readonly string[]) => araclar.every((a) => t.includes(a));

test("deneme seti: her cümlenin aracı var (katalog ya da ekran aracı)", () => {
  const adlar = new Set([...ISLEM_KATALOGU.map((x) => x.ad), ...EKRAN_ARAC_ADLARI, "satir_ekle"]);
  for (const [cumle, araclar] of DENEME_SETI) for (const a of araclar) assert.ok(adlar.has(a), `${cumle}: ${a} yok`);
});

test("deneme seti: talimat her cümlenin işini aracıyla anlatır; notlar konu içinde", () => {
  const t = saySistemi([], "");
  for (const [cumle, araclar] of DENEME_SETI) assert.ok(talimatKarsilar(t, araclar), `${cumle}: talimatta ${araclar.join(", ")}`);
  assert.ok(t.includes("Sık işler") && t.includes("bu işlerle ilgili notları"), "sık işler bölümü ve notlar konu içinde");
});
