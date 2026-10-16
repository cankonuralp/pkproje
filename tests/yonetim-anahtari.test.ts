/* NEREDEN GELDİ: FIRMA-VT.md §7, §8 risk 4, FV8 (2026-10-16) — Supabase Yönetim API'sinin PAT'i ve Resend ana anahtarı Vercel ortamında duruyor
   ("PAT yalnız kurulumda ve göçte kullanılır"); kalem satırı: "ortam adları yalnız src/server/dis/** ve scripts/; istemci zinciri içe aktarmaz". SAF
   (kaynak metni). Kilitlenenler:
   · PROBATA_SUPABASE_YONETIM_ANAHTARI / _UC, PROBATA_SUPABASE_ORGUT, PROBATA_RESEND_ANAHTARI / _YONETIM_UC yorum dışında yalnız src/server/dis/** ve
     scripts/** içinde (uygulamanın başka yeri anahtarı okuyamaz);
   · src/server/dis/** dosyalarını yalnız izin listesindeki dosyalar içe aktarır (tests/yardimci/denetimler.ts DIS_IZNI, gerekçeleriyle) — sayfa,
     modül, istek çekirdeği, tarayıcı bileşeni değil; liste tam;
   · göç dağıtıcı (goc-dagit.ts) istemciyi ve yazan kısmı (goc-uygula.ts) YALNIZ dinamik yükler: o dosyanın saf yardımcılarını sağlık modülü de içe
     aktarır — statik içe aktarma ikisini uygulamanın paketine sokar (2026-10-16 FV8 ilk koşu: deneme makinesinde derleme düştü).
   Olumsuz kanıt: tests/bozan/yonetim-anahtari.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dagitStatikYukleme, DIS_IZNI, dosyalar, oku, yonetimAnahtariEksikleri } from "./yardimci/denetimler.ts";

const kaynaklar = () => [...dosyalar("src", [".ts", ".tsx", ".mts", ".js", ".mjs"]), ...dosyalar("scripts", [".ts", ".mts", ".js", ".mjs"])]
  .map((ad) => ({ ad, metin: oku(ad) }));

test("yönetim anahtarlarının ortam adları yalnız dış hizmet katmanında ve betiklerde; istemciyi yalnız izinli dosyalar içe aktarır (liste tam)", () => {
  const k = kaynaklar();
  assert.ok(k.length > 100);
  assert.deepEqual(yonetimAnahtariEksikleri(k), []);
  for (const [ad, gerekce] of Object.entries(DIS_IZNI)) {
    assert.ok(gerekce.length >= 20, `${ad}: gerekçe`);
    assert.ok(!/^\s*["']use (client|server)["']/m.test(oku(ad)), `${ad}: tarayıcı / sunucu eylemi dosyası değil`);
  }
  assert.deepEqual(dagitStatikYukleme(oku("src/server/db/goc-dagit.ts")), []);
});
