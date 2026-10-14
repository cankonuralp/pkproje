/* S.A.Y CEVABININ BİÇİMİ (550; sunum 546 K6 — reisim 2026-10-14: "aynı claud kullanır gibi"): Haiku Markdown yazar — başlık, kalın / eğik, kod,
   madde (iç içe bir düzey), numaralı liste, alıntı, tablo, çizgi, bağlantı. Saf ayrıştırıcı: metni AĞACA çevirir; ekran (ui/Markdown.tsx) ağacı
   React öğeleriyle çizer — HTML hiç işlenmez (yazılan "<script>" metin olarak görünür), bağlantı yalnız http(s) (yeni sekmede, noopener). */

export type Satir = { t: "y"; m: string } | { t: "b"; ic: Satir[] } | { t: "i"; ic: Satir[] } | { t: "k"; m: string } | { t: "a"; href: string; ic: Satir[] } | { t: "br" };
export interface Madde { ic: Satir[]; alt: Blok | null }
export type Blok =
  | { t: "p"; ic: Satir[] } | { t: "h"; d: number; ic: Satir[] } | { t: "ul"; maddeler: Madde[] } | { t: "ol"; bas: number; maddeler: Madde[] }
  | { t: "kod"; m: string } | { t: "alinti"; bloklar: Blok[] } | { t: "tablo"; bas: Satir[][]; satirlar: Satir[][][] } | { t: "cizgi" };

/** ayrıştırılacak en çok karakter (CEVAP_SINIRI ile aynı) */
const EN_COK = 60_000;
const GUVENLI = /^https?:\/\/[^\s<>"']+$/i;

/** satır içi: `kod`, **kalın**, *eğik* / _eğik_, [ad](https://…); kaçış \x */
export function satirIci(m: string): Satir[] {
  const l: Satir[] = [];
  let y = "";
  const yaz = () => { if (y) { l.push({ t: "y", m: y }); y = ""; } };
  for (let i = 0; i < m.length;) {
    const c = m[i];
    if (c === "\\" && i + 1 < m.length && /[\\`*_[\]()#+\-.!|>]/.test(m[i + 1])) { y += m[i + 1]; i += 2; continue; }
    if (c === "\n") { yaz(); l.push({ t: "br" }); i++; continue; }
    if (c === "`") {
      const s = m.indexOf("`", i + 1);
      if (s > i) { yaz(); l.push({ t: "k", m: m.slice(i + 1, s) }); i = s + 1; continue; }
    }
    if ((c === "*" || c === "_") && m[i + 1] === c) {
      const s = m.indexOf(c + c, i + 2);
      if (s > i + 2) { yaz(); l.push({ t: "b", ic: satirIci(m.slice(i + 2, s)) }); i = s + 2; continue; }
    }
    if ((c === "*" || c === "_") && m[i + 1] && m[i + 1] !== " " && (c === "*" || i === 0 || !/[\p{L}\p{N}]/u.test(m[i - 1]))) {
      const s = m.indexOf(c, i + 1);
      if (s > i + 1 && m[s - 1] !== " " && (c === "*" || !/[\p{L}\p{N}]/u.test(m[s + 1] ?? ""))) { yaz(); l.push({ t: "i", ic: satirIci(m.slice(i + 1, s)) }); i = s + 1; continue; }
    }
    if (c === "[") {
      const kapa = m.indexOf("]", i + 1);
      const b = kapa > i && m[kapa + 1] === "(" ? /^\(([^)\s]+)\)/.exec(m.slice(kapa + 1)) : null;
      if (b) {
        yaz();
        const ic = satirIci(m.slice(i + 1, kapa));
        l.push(GUVENLI.test(b[1]) ? { t: "a", href: b[1], ic } : { t: "y", m: m.slice(i + 1, kapa) });
        i = kapa + 1 + b[0].length;
        continue;
      }
    }
    y += c; i++;
  }
  yaz();
  return l;
}

const hucreler = (s: string) => s.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((h) => h.trim());
const ayirac = (s: string) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(s) && s.includes("-");
const MADDE = /^(\s*)([-*+]|(\d{1,4})[.)])\s+(.*)$/;

/** bloklar: kod çiti, başlık, çizgi, alıntı, tablo, liste (iç içe bir düzey), paragraf */
export function markdown(metin: string): Blok[] {
  const satirlar = metin.slice(0, EN_COK).replace(/\r\n?/g, "\n").split("\n");
  const l: Blok[] = [];
  let i = 0;
  while (i < satirlar.length) {
    const s = satirlar[i];
    if (!s.trim()) { i++; continue; }
    const cit = /^\s*(```|~~~)/.exec(s);
    if (cit) {
      const kod: string[] = [];
      i++;
      while (i < satirlar.length && !satirlar[i].trim().startsWith(cit[1])) kod.push(satirlar[i++]);
      i++;
      l.push({ t: "kod", m: kod.join("\n") });
      continue;
    }
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(s);
    if (h) { l.push({ t: "h", d: h[1].length, ic: satirIci(h[2]) }); i++; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(s)) { l.push({ t: "cizgi" }); i++; continue; }
    if (/^\s{0,3}>/.test(s)) {
      const ic: string[] = [];
      while (i < satirlar.length && /^\s{0,3}>/.test(satirlar[i])) ic.push(satirlar[i++].replace(/^\s{0,3}>\s?/, ""));
      l.push({ t: "alinti", bloklar: markdown(ic.join("\n")) });
      continue;
    }
    if (s.includes("|") && i + 1 < satirlar.length && ayirac(satirlar[i + 1])) {
      const bas = hucreler(s).map(satirIci);
      i += 2;
      const govde: Satir[][][] = [];
      while (i < satirlar.length && satirlar[i].includes("|") && satirlar[i].trim()) govde.push(hucreler(satirlar[i++]).map(satirIci));
      l.push({ t: "tablo", bas, satirlar: govde });
      continue;
    }
    const m = MADDE.exec(s);
    if (m) {
      const sirali = !!m[3], girinti = m[1].length;
      const maddeler: Madde[] = [];
      while (i < satirlar.length) {
        const x = MADDE.exec(satirlar[i]);
        if (x && x[1].length <= girinti && !!x[3] === sirali) { maddeler.push({ ic: satirIci(x[4]), alt: null }); i++; continue; }
        if (x && x[1].length > girinti && maddeler.length) {
          /* iç içe: daha girintili maddeler bir alt liste */
          const alt: string[] = [];
          while (i < satirlar.length) {
            const z = MADDE.exec(satirlar[i]);
            if (!z || z[1].length <= girinti) break;
            alt.push(satirlar[i++].slice(girinti));
          }
          const son = maddeler[maddeler.length - 1], ab = markdown(alt.map((a) => a.replace(/^\s+/, "")).join("\n"))[0];
          if (ab && (ab.t === "ul" || ab.t === "ol")) son.alt = ab;
          continue;
        }
        /* maddenin devam satırı (boş olmayan, madde değil, girintili) */
        if (!x && satirlar[i].trim() && /^\s+/.test(satirlar[i]) && maddeler.length) {
          const son = maddeler[maddeler.length - 1];
          son.ic.push({ t: "br" }, ...satirIci(satirlar[i++].trim()));
          continue;
        }
        break;
      }
      l.push(sirali ? { t: "ol", bas: Number(m[3]), maddeler } : { t: "ul", maddeler });
      continue;
    }
    /* paragraf: boş satıra, başlığa, listeye, alıntıya, kod çitine kadar */
    const p: string[] = [];
    while (i < satirlar.length && satirlar[i].trim() && !/^\s{0,3}(#{1,6}\s|>|```|~~~)/.test(satirlar[i]) && !MADDE.exec(satirlar[i])
      && !(satirlar[i].includes("|") && i + 1 < satirlar.length && ayirac(satirlar[i + 1]))) p.push(satirlar[i++]);
    if (!p.length) { l.push({ t: "p", ic: satirIci(satirlar[i++]) }); continue; }
    l.push({ t: "p", ic: satirIci(p.join("\n")) });
  }
  return l;
}
