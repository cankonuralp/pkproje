/* NEREDEN GELDİ: 2026-10-31 (reisim: "onay istemesin, tam yetkili olsun tüm işleri bitirsin., onay beklemesin direk bitirsin tam yetkili olsun, ONAY BEKLEMESİN
   TAM YETKİLİ OLSUN"). Lift denemesinde format yayını ikinci onay istedi; pencere iş sonunda açıldı, dokuz dakika tıklama beklendi ve raporlar eski sürümle
   açıldı. Bu kilit tutar: S.A.Y'ın yolunda hiçbir işlem onay penceresi açmaz — yürütücüde kapı, döngüde onay olayı, katalogda onay listesi, ekranda S.A.Y işi için
   onay penceresi, onay ucu (src/app/api/say/onay) yok. Olumsuz kanıt: tests/bozan/say-tam-yetki.bozan.ts. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { onayKapisiIzleri } from "./yardimci/denetimler.ts";

export const tamYetkiKaynaklari = () => ({ islem: readFileSync("src/server/yz/islem.ts", "utf8"), dongu: readFileSync("src/modules/say/server/dongu.ts", "utf8"),
  ekran: readFileSync("src/modules/say/ui/SayAsistan.tsx", "utf8"), katalog: readFileSync("src/modules/say/islem-katalogu.ts", "utf8") });

test("hiçbir işlem onay istemez; onay kapısının izi yok; onay ucu yok", () => {
  for (const t of ISLEM_KATALOGU) assert.ok(!("ikinciOnay" in t), `${t.ad} onay istiyor`);
  assert.deepEqual(onayKapisiIzleri(tamYetkiKaynaklari()), []);
  assert.ok(!existsSync("src/app/api/say/onay"), "onay ucu kalktı");
  assert.ok(tamYetkiKaynaklari().ekran.includes('await onayla({ baslik: "Sohbeti temizle"'), "kullanıcının kendi tuşu (Sohbeti temizle) sorar");
});
