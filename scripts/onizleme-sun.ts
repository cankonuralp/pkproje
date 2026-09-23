/* Yerel Pages taklidi: site/ klasörünü GitHub Pages'teki gibi /pkproje/ altında sunar (yalnız okuma, yalnız
   127.0.0.1). Önizlemeyi yayından ÖNCE kendi tarayıcı bölmemde ölçmek için (anayasa 11.7–11.8). Kullanım:
   npm run build:onizleme → node scripts/onizleme-sun.ts [kapı] */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const KOK = resolve("site");
const ONEK = "/pkproje";
const KAPI = Number(process.argv[2] ?? 8780);
const TUR: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".png": "image/png", ".ico": "image/x-icon",
};

createServer((istek, yanit) => {
  const adres = decodeURIComponent((istek.url ?? "/").split("?")[0]!);
  if (!adres.startsWith(ONEK + "/")) {
    yanit.writeHead(302, { Location: ONEK + "/" });
    yanit.end();
    return;
  }
  let dosya = normalize(join(KOK, adres.slice(ONEK.length)));
  if (!dosya.startsWith(KOK)) { yanit.writeHead(403); yanit.end(); return; }
  if (existsSync(dosya) && statSync(dosya).isDirectory()) dosya = join(dosya, "index.html");
  if (!existsSync(dosya)) {
    yanit.writeHead(404, { "Content-Type": TUR[".html"] });
    const yok = join(KOK, "404.html");
    if (existsSync(yok)) createReadStream(yok).pipe(yanit); else yanit.end("404");
    return;
  }
  yanit.writeHead(200, { "Content-Type": TUR[extname(dosya)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(dosya).pipe(yanit);
}).listen(KAPI, "127.0.0.1", () => console.log(`Önizleme: http://127.0.0.1:${KAPI}${ONEK}/uygulama/`));
