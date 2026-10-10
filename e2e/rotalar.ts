/* UÇTAN UCA HAZIRLIĞIN ROTA LİSTESİ (468, 2026-10-10) — e2e/hazirla.ts testlerden önce bu adreslerin hepsini bir kez ister (geliştirme sunucusu
   sayfayı ilk istekte derler; testte ilk kez derlenen sayfa sunucuyu 30 sn'den uzun meşgul edip o anki isteği düşürüyordu — deneme makinesi
   927228e). Saf: yalnız klasörü okur. Kilit: tests/e2e-hazirlik.test.ts (her page / route kapsanır, parametresi tanımsız rota yok). */
import { readdirSync } from "node:fs";
import { join } from "node:path";

/* 468: rota parametresinin hazırlık değeri — olmayan kayıt "bulunamadı" çizer, rota yine derlenir */
export const BOS_KIMLIK = "00000000-0000-4000-8000-000000000000";
export const PARAMETRE: Readonly<Record<string, string>> = { id: BOS_KIMLIK, sid: BOS_KIMLIK, plan: BOS_KIMLIK, tur: "d", kod: "ZPKK01", anahtar: "ZPKR01", tip: "izin", dosya: "yok" };
/** ara katmanın yasak adresleri yeniden yazdığı "bulunamadı" (src/proxy.ts YOK_YOLU) — kökün not-found sayfası */
export const YOK_SAYFASI = "/_bulunamadi";

/** src/app altındaki her page / route dosyasının adresi (rota grupları düşer, parametreler PARAMETRE'den); yönetim grubu hariç (kendi adresinde) */
export function uygulamaRotalari(kok = "src/app"): string[] {
  const sonuc: string[] = [];
  const gez = (klasor: string, yol: string[]) => {
    for (const g of readdirSync(klasor, { withFileTypes: true })) {
      if (g.isDirectory()) {
        if (g.name === "(yonetim)" || g.name.startsWith("_") || g.name.startsWith("@")) continue;
        const grup = /^\(.+\)$/.test(g.name);
        const p = /^\[(.+)\]$/.exec(g.name);
        if (p && !Object.hasOwn(PARAMETRE, p[1])) throw new Error(`hazırlık: ${join(klasor, g.name)} parametresinin değeri yok (e2e/rotalar.ts PARAMETRE)`);
        gez(join(klasor, g.name), grup ? yol : [...yol, p ? PARAMETRE[p[1]] : g.name]);
      } else if (/^(page|route)\.tsx?$/.test(g.name)) sonuc.push("/" + yol.join("/"));
    }
  };
  gez(kok, []);
  return [...new Set(sonuc)].sort();
}
