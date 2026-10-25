/* OLUMSUZ KANIT — tests/arayuz-model-adi.test.ts neyi koruyor (2026-10-25). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): gerçek dosyalar bellekte
   bozulur. 1. S.A.Y başlığına model adı geri gelirse denetim yakalar. 2. Firma ayarlarındaki ad geri gelirse yakalar. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { modelAdiBulgulari, oku } from "../yardimci/denetimler.ts";

test("1. S.A.Y başlığına model adı eklenince yakalanır", () => {
  const s = oku("src/modules/say/ui/SayAsistan.tsx").replace('<h2 id="say-baslik">S.A.Y</h2>', '<h2 id="say-baslik">S.A.Y</h2><p>Claude Haiku 5.5</p>');
  assert.ok(modelAdiBulgulari(s).length > 0, "bozuk: model adı geçiyor ama denetim görmüyor");
});

test("2. ayar şemasına model adı eklenince yakalanır", () => {
  const s = oku("src/modules/firma-ayarlari/sema.ts") + '\nexport const YZ_AD = "Claude Haiku 5.5";\n';
  assert.ok(modelAdiBulgulari(s).length > 0, "bozuk: model adı geçiyor ama denetim görmüyor");
});
