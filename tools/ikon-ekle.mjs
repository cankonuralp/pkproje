/* İKON EKLE (2026-09-24, toplu maket M1) — Lucide 1.47.0 (ISC) ikonlarını ikon dosyasına AYNI biçimle ekler:
   <symbol id="i-<ad>" viewBox="0 0 24 24">…çocuklar tek satırda, boşlukla…</symbol>. İki kopya birlikte yazılır
   (docs/vendor maket + public/vendor uygulama; tests/ikonlar.test.ts ikisinin aynı olmasını ister). Sürüm dosya adında
   (anayasa 5.2: kendi kökenimizden, sürümlü); başka sürümden ikon eklenmez.
   Kullanım:  npm pack lucide-static@1.47.0 && tar -xzf lucide-static-1.47.0.tgz   (paket/ klasörü oluşur)
              node tools/ikon-ekle.mjs <package klasörü> ad1 ad2 …
   Var olan ikon atlanır; bulunamayan ad hata verir (hiçbir dosya yazılmaz). --dene: yazmadan, var olan bir ikonun
   yeniden üretilince baytı baytına aynı çıktığını gösterir (biçim kanıtı). */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = fileURLToPath(new URL("..", import.meta.url));
const DOSYALAR = ["docs/vendor/lucide-1.47.0/ikonlar.svg", "public/vendor/lucide-1.47.0/ikonlar.svg"];
const [paket, ...adlar] = process.argv.slice(2).filter(a => a !== "--dene");
const dene = process.argv.includes("--dene");
const paketSurum = JSON.parse(readFileSync(join(paket, "package.json"), "utf8")).version;
if (paketSurum !== "1.47.0") throw new Error("paket sürümü " + paketSurum + " — yalnız 1.47.0");

function sembol(ad) {
  const svg = readFileSync(join(paket, "icons", ad + ".svg"), "utf8");
  const ic = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
  const cocuk = ic.split("\n").map(s => s.trim()).filter(Boolean);
  return `<symbol id="i-${ad}" viewBox="0 0 24 24">${cocuk.join(" ")}</symbol>`;
}

const mevcut = readFileSync(join(KOK, DOSYALAR[0]), "utf8");
if (dene) {
  for (const ad of adlar) { const s = sembol(ad); console.log(ad, mevcut.includes(s) ? "AYNI" : "FARKLI"); }
  process.exit(0);
}
const yeni = adlar.filter(ad => !mevcut.includes(`id="i-${ad}"`)).map(sembol);
for (const d of DOSYALAR) {
  const yol = join(KOK, d), metin = readFileSync(yol, "utf8");
  if (metin !== mevcut) throw new Error(d + " öteki kopyadan farklı");
  writeFileSync(yol, metin.replace(/<\/svg>\s*$/, yeni.join("\n") + (yeni.length ? "\n" : "") + "</svg>\n"));
}
console.log(`${yeni.length} ikon eklendi · toplam ${(readFileSync(join(KOK, DOSYALAR[0]), "utf8").match(/<symbol /g) || []).length}`);
