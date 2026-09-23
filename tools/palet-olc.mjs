/* SALT OKUNUR — docs/assets/tokens.css içindeki GERÇEK renk değişkenlerini okur ve WCAG kontrastını ölçer.
   Neden: sunumdaki ve ileride uygulamadaki kontrast iddiası elle kopyalanmış sayıya değil, dosyanın kendisine dayansın
   (anayasa 0.6: ölç, tahmin etme). İskelet kaleminde bu işlev node --test kilidine dönüşür.
   Kullanım: node tools/palet-olc.mjs            → tablo basar; eşiği geçmeyen çift varsa çıkış kodu 1
             import { paletOlc } from "./palet-olc.mjs" → { acik, koyu, sonuc } döndürür */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KOK = new URL("../", import.meta.url);

export function parlaklik(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function kontrast(a, b) {
  const [x, y] = [parlaklik(a), parlaklik(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/* (ön plan, arka plan, eşik, anlam). 4,5 = normal metin (WCAG AA 1.4.3) · 3,0 = arayüz sınırı/ikon (1.4.11) */
export const CIFTLER = [
  ["yazi", "kart", 4.5, "ana metin / kart"], ["yazi", "zemin", 4.5, "ana metin / zemin"],
  ["yazi2", "kart", 4.5, "ikincil metin / kart"], ["yazi2", "zemin", 4.5, "ikincil metin / zemin"],
  ["yazi3", "kart", 4.5, "ipucu metni / kart"], ["yazi3", "zemin", 4.5, "ipucu metni / zemin"], ["yazi3", "zemin2", 4.5, "ipucu metni / zemin2"],
  ["vurgu-uzeri", "vurgu", 4.5, "Denetimde rozeti (petrol zemin)"], ["onay-uzeri", "onay", 4.5, "birincil tuş (karar A: yeşil zemin, petrol yazı)"],
  ["onay-uzeri", "onay-2", 4.5, "yeşil tuş üzerine gelince"],
  ["onay-yazi", "kart", 4.5, "yeşil metin / kart"], ["onay-yazi", "onay-zemin", 4.5, "Tamamlandı rozeti"],
  ["uyari-yazi", "uyari-zemin", 4.5, "Kabul bekliyor rozeti"], ["hata-yazi", "hata-zemin", 4.5, "Reddedildi rozeti"],
  ["bilgi-yazi", "bilgi-zemin", 4.5, "Kabul edildi rozeti"],
  ["cubuk-yazi", "cubuk-zemin", 4.5, "yan menü yazısı"], ["cubuk-yazi2", "cubuk-zemin", 4.5, "yan menü ikincil"],
  ["cubuk-yazi", "cubuk-secili", 4.5, "yan menü seçili"],
  ["kenar-alan", "kart", 3.0, "form alanı kenarı / kart"], ["kenar-alan", "zemin", 3.0, "form alanı kenarı / zemin"],
  ["odak", "kart", 3.0, "odak halkası / kart"], ["odak", "zemin", 3.0, "odak halkası / zemin"],
  ["onay", "kart", 3.0, "yeşil ikon / kart"],
  /* 2. tur (2026-09-23): yeni yüzeyler + 1. turda kullanılıp ölçülmemiş çıkan bir çift (ön koşul notu: uyari-yazi / kart) */
  ["yazi2", "zemin2", 4.5, "Başlanmadı rozeti (nötr)"], ["onay-yazi", "zemin", 4.5, "proje no / satır üzerine gelince"],
  ["uyari-yazi", "kart", 4.5, "ön koşul notu / kart"], ["yazi", "kenar", 4.5, "sıralanır başlık üzerine gelince"],
  /* 3. tur: kod çakışma mesajı ve "Kusurlu" önceki kontrol sonucu */
  ["hata-yazi", "kart", 4.5, "kod çakışma mesajı · Kusurlu sonuç / kart"],
  /* 4. tur: adım çizelgesi ve sayfalayıcı — grafik öğe, eşik 3 (WCAG 1.4.11); işaretin içindeki yazılar rozet çiftleriyle aynı */
  ["onay-yazi", "zemin", 3.0, "biten adımın çizgisi ve işareti / zemin"], ["vurgu", "zemin", 3.0, "şu anki adım işareti / zemin"],
  ["vurgu", "kart", 3.0, "seçili sayfa tuşu / kart"],
];

function blokDegiskenleri(css, secici) {
  const i = css.indexOf(secici);
  if (i < 0) throw new Error("tokens.css içinde blok bulunamadı: " + secici);
  const bas = css.indexOf("{", i), son = css.indexOf("}", bas);
  const T = {};
  for (const m of css.slice(bas + 1, son).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) T[m[1]] = m[2].toUpperCase();
  return T;
}

export function paletOlc(yol = fileURLToPath(new URL("docs/assets/tokens.css", KOK))) {
  const css = readFileSync(yol, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const acik = blokDegiskenleri(css, ':root, :root[data-tema="acik"]');
  const koyu = blokDegiskenleri(css, ':root[data-tema="koyu"]');
  const marka = blokDegiskenleri(css, ":root {");
  const sonuc = [];
  for (const [tema, T] of [["acik", acik], ["koyu", koyu]]) {
    for (const [on, arka, esik, anlam] of CIFTLER) {
      if (!T[on] || !T[arka]) throw new Error(`${tema}: tanımsız değişken --${!T[on] ? on : arka}`);
      const oran = kontrast(T[on], T[arka]);
      sonuc.push({ tema, on, arka, onRenk: T[on], arkaRenk: T[arka], oran: Math.round(oran * 100) / 100, esik, gecti: oran >= esik, anlam });
    }
  }
  return { marka, acik, koyu, sonuc };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { sonuc } = paletOlc();
  for (const s of sonuc) console.log(`${s.gecti ? "✓" : "✗"} ${s.tema.padEnd(4)} ${s.oran.toFixed(2).padStart(5)} (≥${s.esik})  ${s.anlam}`);
  const kalan = sonuc.filter(s => !s.gecti).length;
  console.log(`\n${sonuc.length} çift · geçmeyen ${kalan}`);
  process.exit(kalan ? 1 : 0);
}
