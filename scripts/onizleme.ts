/* npm run build:onizleme — GitHub Pages önizlemesini kurar (reisim 2026-09-23: ilk yayın = Pages önizlemesi).
   Önce testler koşar (package.json: "npm test && …" — fail 0 değilse buraya gelinmez, anayasa 0.3).
   site/            ← docs/ (maket + sunum; adresleri değişmez)
   site/uygulama/   ← uygulamanın statik dışa aktarımı (next.config.ts: PROBATA_ONIZLEME=1, alt yol /pkproje/uygulama)
   Pages sunucu çalıştıramaz: veritabanı ve giriş önizlemede YOK; onlar testte doğrulanır. */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
/* 2026-10-03 (reisim: "açtım zaten ama hala sadece rapor ekranında çıkıyor"): tarayıcı eski betiği önbellekten okuyordu (Pages ~10 dk önbellek,
   adres aynı). Maket sayfalarındaki ../assets/*.js|css adreslerine yayın sürümü eklenir; dosyalar ve docs/ değişmez, yalnız yayın kopyası. */
const surum = (process.env.GITHUB_SHA || String(Date.now())).slice(0, 12);
const sayfalar = (kok: string): string[] => readdirSync(kok, { withFileTypes: true }).flatMap((g) =>
  g.isDirectory() ? (g.name === "uygulama" ? [] : sayfalar(join(kok, g.name))) : g.name.endsWith(".html") ? [join(kok, g.name)] : []);
for (const yol of sayfalar("site")) {
  const eski = readFileSync(yol, "utf8");
  const yeni = eski.replace(/((?:src|href)="(?:\.\.\/|\.\/)?assets\/[\w.-]+\.(?:js|css))"/g, `$1?v=${surum}"`);
  if (yeni !== eski) writeFileSync(yol, yeni);
}
console.log("Önizleme hazır: site/ (maket ve sunum kökte, uygulama site/uygulama/).");
