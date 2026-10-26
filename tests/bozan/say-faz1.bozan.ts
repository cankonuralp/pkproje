/* OLUMSUZ KANIT — tests/say-faz1.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosyalar bellekte bozulur.
   1. Sunucu düşünme olayını yeniden yazarsa İngilizce iç düşünce ekrana akar. 2. Balon düşünme metnini yeniden gösterirse aynı. 3. Durdur tuşu kalkarsa
   çalışan iş kesilemez. 4. Fotoğraftan oku olayı işlenmez bırakılırsa tuş sessiz kalır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KURALLAR } from "../say-faz1.test.ts";
import { oku } from "../yardimci/denetimler.ts";

test("1. sunucu düşünme olayını yazınca kilit düşer", () => {
  assert.equal(KURALLAR.duzenGonderilmez(oku("src/modules/say/server/dongu.ts").replace("metin: (d: string) => yaz({ t: \"metin\", d }),", "metin: (d: string) => yaz({ t: \"metin\", d }), dusunce: (d: string) => yaz({ t: \"dusunce\", d }),")), false);
});
test("2. balon düşünme metnini gösterince kilit düşer", () => {
  assert.equal(KURALLAR.ekranGostermez(oku("src/modules/say/ui/SayAsistan.tsx") + "\nconst x = stil.dusunce;"), false);
});
test("3. Durdur tuşu kalkınca kilit düşer", () => {
  assert.equal(KURALLAR.durdurKeser(oku("src/modules/say/ui/SayAsistan.tsx").replace(">Durdur</button>", ">Dur</button>")), false);
});
test("4. Fotoğraftan oku olayı iptal edilebilir olmaktan çıkınca kilit düşer", () => {
  assert.equal(KURALLAR.okuOlayi(oku("src/modules/say/ui/SayAsistan.tsx"), oku("src/modules/raporlar/ui/Doldurma.tsx").replace("cancelable: true", "")), false);
});
