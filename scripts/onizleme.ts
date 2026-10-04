/* npm run build:onizleme — GitHub Pages önizlemesini kurar (reisim 2026-09-23: ilk yayın = Pages önizlemesi).
   Önce testler koşar (package.json: "npm test && …" — fail 0 değilse buraya gelinmez, anayasa 0.3).
   site/ ← docs/ (maket + sunum; adresleri değişmez).
   2026-10-04 (K1, giriş + oturum): uygulamanın statik önizlemesi (site/uygulama/) KALKTI — uygulama artık sunucu ister (giriş, oturum, sunucu
   eylemleri, nonce'lu CSP); statik dışa aktarım bunları desteklemez ve önizleme yalnız boş modül sayfalarıydı. Ekranların görsel önizlemesi maket;
   uygulama deneme ortamında (K7) ya da yerelde (npm run dev) görülür. Güvenlik denetimini atlayan bir "önizleme bayrağı" kodda bulunmaz. */
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

rmSync("site", { recursive: true, force: true });
cpSync("docs", "site", { recursive: true, filter: (yol) => !/[\\/]\.domtest([\\/]|$)/.test(yol) });
writeFileSync("site/.nojekyll", "");
/* 2026-10-03 (reisim: "açtım zaten ama hala sadece rapor ekranında çıkıyor"): tarayıcı eski betiği önbellekten okuyordu (Pages ~10 dk önbellek,
   adres aynı). Maket sayfalarındaki ../assets/*.js|css adreslerine yayın sürümü eklenir; dosyalar ve docs/ değişmez, yalnız yayın kopyası. */
const surum = (process.env.GITHUB_SHA || String(Date.now())).slice(0, 12);
const sayfalar = (kok: string): string[] => readdirSync(kok, { withFileTypes: true }).flatMap((g) =>
  g.isDirectory() ? sayfalar(join(kok, g.name)) : g.name.endsWith(".html") ? [join(kok, g.name)] : []);
for (const yol of sayfalar("site")) {
  const eski = readFileSync(yol, "utf8");
  const yeni = eski.replace(/((?:src|href)="(?:\.\.\/|\.\/)?assets\/[\w.-]+\.(?:js|css))"/g, `$1?v=${surum}"`);
  if (yeni !== eski) writeFileSync(yol, yeni);
}
console.log("Önizleme hazır: site/ (maket ve sunum).");
