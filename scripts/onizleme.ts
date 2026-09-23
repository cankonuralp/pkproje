/* npm run build:onizleme — GitHub Pages önizlemesini kurar (reisim 2026-09-23: ilk yayın = Pages önizlemesi).
   Önce testler koşar (package.json: "npm test && …" — fail 0 değilse buraya gelinmez, anayasa 0.3).
   site/            ← docs/ (maket + sunum; adresleri değişmez)
   site/uygulama/   ← uygulamanın statik dışa aktarımı (next.config.ts: PROBATA_ONIZLEME=1, alt yol /pkproje/uygulama)
   Pages sunucu çalıştıramaz: veritabanı ve giriş önizlemede YOK; onlar testte doğrulanır. */
import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { nextCalistir } from "./next.ts";

const kod = await nextCalistir("build", { PROBATA_ONIZLEME: "1" });
if (kod !== 0) process.exit(kod);
if (!existsSync("out/index.html")) {
  console.error("Önizleme derlemesi out/index.html üretmedi.");
  process.exit(1);
}

rmSync("site", { recursive: true, force: true });
cpSync("docs", "site", { recursive: true, filter: (yol) => !/[\\/]\.domtest([\\/]|$)/.test(yol) });
cpSync("out", "site/uygulama", { recursive: true });
// Pages bilinmeyen HER adrese sitenin kökündeki 404.html'i verir; uygulamanın 404'ü (varlık adresleri mutlak, alt yollu)
cpSync("out/404.html", "site/404.html");
writeFileSync("site/.nojekyll", "");
console.log("Önizleme hazır: site/ (maket ve sunum kökte, uygulama site/uygulama/).");
