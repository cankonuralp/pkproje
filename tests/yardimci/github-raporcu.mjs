/* GITHUB RAPORCUSU (2026-10-05): düşen testi GitHub Actions'ta NOT (annotation) olarak yazar — CI günlüğü kimliksiz okunamıyor, not okunuyor
   (reisim'in kuralı: PC'de veritabanlı test yok, test kapısı CI). Yalnız GITHUB_ACTIONS ortamında ve yalnız düşen test için yazar; başka yerde
   sessizdir (asıl çıktı "spec" raporcusunda). Kilit gevşemez: test sonucu ve çıkış kodu değişmez. */
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const veri = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const ozellik = (s) => veri(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

export default async function* githubRaporcu(kaynak) {
  for await (const olay of kaynak) {
    if (olay.type !== "test:fail" || !process.env.GITHUB_ACTIONS) continue;
    const d = olay.data;
    if (d.details?.type === "suite") continue;
    const hata = d.details?.error;
    const neden = hata?.cause ?? hata;
    const yigin = String(neden?.stack ?? "").split("\n").slice(0, 8).join("\n");
    const mesaj = `${neden?.message ?? hata?.message ?? "düştü"}${neden?.actual !== undefined ? `\nactual: ${JSON.stringify(neden.actual)?.slice(0, 800)}` : ""}${neden?.expected !== undefined ? `\nexpected: ${JSON.stringify(neden.expected)?.slice(0, 800)}` : ""}\n${yigin}`;
    const dosyaYolu = typeof d.file === "string" ? (d.file.startsWith("file:") ? fileURLToPath(d.file) : d.file) : "";
    const dosya = dosyaYolu ? relative(process.cwd(), dosyaYolu).replace(/\\/g, "/") : "tests";
    yield `::error file=${ozellik(dosya)},line=${d.line ?? 1},title=${ozellik(d.name ?? "test")}::${veri(mesaj.slice(0, 3500))}\n`;
  }
}
