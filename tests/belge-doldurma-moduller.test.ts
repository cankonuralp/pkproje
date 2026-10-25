/* NEREDEN GELDİ: 2026-10-25 — reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için sözleşme
   açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim". Sözleşme dışındaki belgeler de (teklif, zimmet formu, araç tutanağı, eğitim
   katılım formu, izin / masraf talep formu, fatura özeti) firmanın formatındaki elle yerlerle doldurulur; kayıt rapor-format/server/doldurma.ts'te,
   bağ belgenin modülünde. Kilitler (tests/yardimci/belge-doldurma-moduller.ts): belgenin verisi elle değerleri kaydın kimliğiyle okur (okumazsa
   doldurulan yer PDF'te boş basılır) ve imzaya giden form da o veriden kurulur; doldurma işlevi kayıttan ÖNCE modülün yetkisini denetler (teklif
   yalnız taslakta, tutanak imzalanmadan ve yalnız yazan, katılım formu güncel kayıtta ve imzalanmadan, talep yalnız talep edenin karar verilmemiş
   talebinde); eylem modülün işlevini oturumdan çağırır; PDF tuşunun durduğu ekranda "Belgeyi doldur" o belgeyle çizilir. Saf (kaynak denetimi).
   Olumsuz kanıt: tests/bozan/belge-doldurma-moduller.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku } from "./yardimci/denetimler.ts";
import { DOLDURMA_BAGLARI, doldurmaBagiEksikleri } from "./yardimci/belge-doldurma-moduller.ts";

test("belge doldurma: sözleşme dışındaki her belge modülünde bağlı (veri, yetki, eylem, ekran)", () => {
  assert.equal(DOLDURMA_BAGLARI.length, 6);
  assert.deepEqual(doldurmaBagiEksikleri(oku), []);
});

test("belge doldurma: katalogdaki belgelerin hepsi bir modülde ya da sözleşme / plan belgesi", () => {
  const katalog = oku("src/belge/katalog.ts");
  const turler = /BELGE_TURLERI = \[([^\]]+)\]/.exec(katalog)?.[1].match(/"([a-z]+)"/g)?.map((x) => x.slice(1, -1)) ?? [];
  const bagli = new Set(DOLDURMA_BAGLARI.flatMap((x) => x.belge.split(" / ")));
  /* sözleşme Sözleşmeler'de, saha formu ve ön bilgilendirme formu Planlar'da bağlanır (ayrı kalemler) */
  const ayrica = new Set(["sozlesme", "saha", "onbilgi"]);
  assert.ok(turler.length >= 9, turler.join(", "));
  assert.deepEqual(turler.filter((t) => !bagli.has(t) && !ayrica.has(t)), []);
});
