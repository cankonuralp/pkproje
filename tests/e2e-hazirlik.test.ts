/* NEREDEN GELDİ: 468 (2026-10-10, deneme makinesi 927228e) — uçtan uca hazırlığın elle yazılmış sayfa listesi eksikti: testte ilk kez derlenen
   sayfa (Yeni rapor — çevrimdışı önceden indirme; "bulunamadı" — yönetim adresi ayrımı) geliştirme sunucusunu 30 sn'den uzun meşgul etti, o anki
   istek düştü (masaüstü çevrimdışı, telefon yönetim). Hazırlık artık src/app'teki her page / route dosyasını ister (e2e/rotalar.ts). Kilit:
   1. her page / route dosyası (yönetim grubu hariç) listede, adres bağımsız bir hesapla aynı;
   2. tanımsız rota parametresi hazırlığı durdurur (sessizce atlanmaz);
   3. "bulunamadı" adresi ara katmanınkiyle aynı ve hazırlık listeyi gerçekten kullanıyor. */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { after, test } from "node:test";
import { BOS_KIMLIK, PARAMETRE, uygulamaRotalari, YOK_SAYFASI } from "../e2e/rotalar.ts";

const dosyalar = (k: string): string[] => readdirSync(k, { withFileTypes: true }).flatMap((g) =>
  g.isDirectory() ? dosyalar(join(k, g.name)) : /^(page|route)\.tsx?$/.test(g.name) ? [join(k, g.name)] : []);

test("her page / route dosyası hazırlık listesinde (yönetim grubu kendi adresinde)", () => {
  const bekl = new Set(dosyalar("src/app").map((d) => relative("src/app", d).split(sep)).filter((p) => p[0] !== "(yonetim)")
    .map((p) => "/" + p.slice(0, -1).filter((s) => !/^\(.+\)$/.test(s)).map((s) => s.replace(/^\[(.+)\]$/, (_, a: string) => PARAMETRE[a])).join("/")));
  const l = uygulamaRotalari();
  assert.deepEqual(l, [...bekl].sort());
  assert.ok(l.length >= 80, `rota sayısı ${l.length}`);
  for (const y of [`/raporlar/yeni/${BOS_KIMLIK}`, "/zimmetler/hareketler", "/api/islem", `/zimmetler/varlik/d/${BOS_KIMLIK}`]) assert.ok(l.includes(y), y);
  assert.ok(!l.some((y) => y.startsWith("/yonetim") || y.includes("(") || y.includes("[")), l.join(" "));
});

const klasor = mkdtempSync(join(tmpdir(), "e2e-hazirlik-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

test("tanımsız rota parametresi hazırlığı durdurur", () => {
  /* her parametre ayrı klasörde: ilkinin hatası ötekini gizlemesin (nesnenin kendi adları — constructor, __proto__ — da tanımsız sayılır) */
  for (const k of ["bilinmez", "constructor", "toString", "__proto__"]) {
    const kok = mkdtempSync(join(klasor, "kok-"));
    mkdirSync(join(kok, "(uygulama)", "deneme", `[${k}]`), { recursive: true });
    writeFileSync(join(kok, "(uygulama)", "deneme", `[${k}]`, "page.tsx"), "");
    assert.throws(() => uygulamaRotalari(kok), (h: Error) => h.message.includes(`[${k}] parametresinin değeri yok`), k);
  }
});

test("'bulunamadı' adresi ara katmanınkiyle aynı; hazırlık listeyi ve bulunamadı sayfasını ister", () => {
  assert.match(readFileSync("src/proxy.ts", "utf8"), new RegExp(`const YOK_YOLU = "${YOK_SAYFASI}";`));
  const h = readFileSync("e2e/hazirla.ts", "utf8");
  assert.match(h, /for \(const y of \[\.\.\.uygulamaRotalari\(\), YOK_SAYFASI\]\)/);
});
