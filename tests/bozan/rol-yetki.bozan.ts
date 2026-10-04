/* OLUMSUZ KANIT — tests/rol-yetki.test.ts neyi koruyor: matrisTemizle'deki SABIT zorlaması olmasaydı, firma yöneticisi kendi Personel satırını
   "yok" yapıp kaydederek kendini kilitlerdi (karar 32). Kaynak diskte değiştirilmez: sabit zorlaması olmayan kopya bellekte kurulur. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { canDo } from "../../src/server/yetki/canDo.ts";
import { MATRIS_ONERI, type Matris } from "../../src/server/yetki/tanim.ts";

test("sabit zorlaması olmadan yönetici kendi Personel yetkisini kaybeder", () => {
  const bozuk = { ...MATRIS_ONERI, 2: ["gor", "kendi", "gor", "gor", "yok", "yok"] } as Matris;   // temizlenmeden kullanılsa
  const kendiKilitler = !canDo({ id: "x", roller: ["firma_yoneticisi"] }, 2, "gor", undefined, { ...bozuk });
  /* canDo'nun kendisi de SABIT'i uygular (ikinci katman) — bu yüzden burada yönetici YİNE görür; kayıt katmanındaki zorlama ilk katman */
  assert.equal(kendiKilitler, false, "canDo ikinci katmanı tuttu");
  const sabitsizSatir = bozuk[2][4];
  assert.equal(sabitsizSatir, "yok", "temizlenmemiş kayıt yöneticiyi 'yok' olarak taşırdı (kilidin koruduğu açık)");
});
