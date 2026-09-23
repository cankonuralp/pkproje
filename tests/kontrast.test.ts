/* NEREDEN GELDİ: tools/palet-olc.mjs ("İskelet kaleminde bu işlev node --test kilidine dönüşür") + anayasa 0.6 (ölç,
   tahmin etme) + pkproje.md §8.12 (her yazı/zemin çifti WCAG AA; grafik öğe 3:1). Ölçüm GERÇEK değişken dosyasından;
   iki temanın her çifti eşiği geçer. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { paletOlc } from "../tools/palet-olc.mjs";

test("iki temada her yazı/zemin çifti eşiği geçer", () => {
  // araç düz JavaScript (tools/); dönüş biçimi burada adlandırılır
  const { sonuc } = paletOlc() as unknown as { sonuc: { tema: string; anlam: string; oran: number; esik: number; gecti: boolean }[] };
  assert.ok(sonuc.length >= 62, `yalnız ${sonuc.length} çift ölçüldü`);
  assert.deepEqual(sonuc.filter((s) => !s.gecti).map((s) => `${s.tema} · ${s.anlam}: ${s.oran.toFixed(2)} < ${s.esik}`), []);
});
