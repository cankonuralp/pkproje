/* FORMAT MOTORU — tanımı okuyup raporu DEĞERLENDİRİR (RAPOR-FORMAT.md §1: "doğrulamayı, otomatik sonucu ve kusur listesini hesaplar").
   Saf: veritabanına, ağa, saate dokunmaz; saha ekranı (istemci, çevrimdışı) ve sunucu (Onaya gönder, PDF) aynı sonucu verir.
   · eksikler: zorunlu boş alanlar — Onaya gönder UYARIR ve alanı işaretler (kural uyarıdır; tek engel resmî formatın kendisi).
   · kusurlar: liste maddesinde olumsuz cevap (cevap setinin 2. öğesi) · seçilen uygunluk notu kusursa · hesabı ya da sütun sınırı tutmayan satır ·
     sınır dışı test değeri. Kusur açıklamaları bölümü bundan dolar.
   · öneri: kural açıksa herhangi kusur → "uygun_degil", yoksa "uygun". Denetçi sonucu kendisi seçer.
   Yayın denetimi (§5): boş bölüm, cevap seti eksik liste, sınırı / hesabı / notu olmayan ölçüm tablosu, kilitli (Bakanlık) öğenin silinmesi. */
import { linyeHesap, noktaHesap, pdHesap, rcdTestYeter, sayiOku, sinirSonucu, ziHesap } from "./hesap.ts";
import type { Bolum, BolumOf, Cevaplar, FormatTanimi } from "./tanim.ts";

export interface Eksik { bolum: string; alan: string; ad: string }
export interface Kusur { bolum: string; ref: string; metin: string; agir: boolean }
export interface SatirDegerlendirmesi { uygun: boolean | null; neden: string[]; oneriNot: number | null }
export interface Degerlendirme {
  eksikler: Eksik[]; kusurlar: Kusur[]; oneri: "uygun" | "uygun_degil";
  satirlar: Record<string, SatirDegerlendirmesi[]>;
  degerler: Record<string, boolean | null>;
}

const bos = (v: unknown) => (Array.isArray(v) ? v.length === 0 : String(v ?? "").trim() === "");
const virgul = (n: number) => String(n).replace(".", ",");

/** satır anahtarı: "<bölüm>#<sıra>.<sütun>" — ekranda alanı işaretlemek için */
export const satirAnahtari = (bolum: string, i: number, sutun: string) => `${bolum}#${i}.${sutun}`;

function satirDegerlendir(b: BolumOf<"olcum">, s: Record<string, string>, ik3: string): SatirDegerlendirmesi {
  const neden: string[] = [];
  let uygun: boolean | null = null;
  let oneriNot: number | null = null;
  if (b.hesap === "nokta") {
    const h = noktaHesap({ egri: s.egri ?? "", In: s.inom, zx: s.zx, rcd: s.rcd, priz: s.priz === "evet" });
    oneriNot = h.not;
    if (h.zx !== null) { uygun = h.zx <= h.zs; if (!uygun) neden.push(`Zx ${virgul(h.zx)} Ω > Zs ${virgul(h.zs)} Ω`); }
  } else if (b.hesap === "selektivite") {
    const r = rcdTestYeter(s.idn, s.id, s.td);
    if (r !== null) { uygun = r; if (!r) neden.push("RCD testi yetersiz"); }
  } else if (b.hesap) {
    const h = b.hesap === "linye" ? linyeHesap({ akim: s.akim, ib: s.ib, iz: s.iz, faz: s.faz, npen: s.npen, pe: s.pe, icu: s.icu, rcd: s.rcd, id: s.id, td: s.td }, ik3)
      : b.hesap === "pd" ? pdHesap({ kesit: s.kesit, tkesit: s.tkesit }) : ziHesap({ direnc: s.direnc });
    if (h) { uygun = h.uygun; neden.push(...h.neden); }
  }
  for (const c of b.sutunlar) {
    const r = sinirSonucu(c.op, c.sinir, s[c.id]);
    if (r === null) continue;
    if (!r) { neden.push(`${c.ad} ${s[c.id]}${c.birim ? ` ${c.birim}` : ""} (sınır ${c.op === "<=" ? "≤" : "≥"} ${virgul(c.sinir!)})`); uygun = false; }
    else if (uygun === null) uygun = true;
  }
  return { uygun, neden, oneriNot };
}

export function degerlendir(t: FormatTanimi, c: Cevaplar): Degerlendirme {
  const eksikler: Eksik[] = [], kusurlar: Kusur[] = [], satirlar: Record<string, SatirDegerlendirmesi[]> = {}, degerler: Record<string, boolean | null> = {};
  const ik3 = c.deger.ik3 ?? "";
  for (const b of t.bolumler) {
    switch (b.blok) {
      case "bilgi":
        for (const a of b.alanlar) if (a.zorunlu && !a.kaynak && bos(c.alan[a.id])) eksikler.push({ bolum: b.id, alan: a.id, ad: a.ad });
        break;
      case "liste":
        for (const g of b.gruplar) for (const m of g.maddeler) {
          const x = c.madde[m.id];
          if (!x || !b.cevaplar.includes(x.c)) { eksikler.push({ bolum: b.id, alan: m.id, ad: m.metin }); continue; }
          if (x.c !== b.cevaplar[1]) continue;
          kusurlar.push({ bolum: b.id, ref: m.id, metin: x.not?.trim() ? `${m.metin}: ${x.not.trim()}` : m.metin, agir: t.kurallar.derece && x.derece === "agir" });
          if (t.kurallar.derece && !x.derece) eksikler.push({ bolum: b.id, alan: `${m.id}.derece`, ad: `${m.metin} · kusur derecesi` });
        }
        break;
      case "olcum": {
        const l = c.tablo[b.id] ?? [];
        if (l.length < b.enAz) eksikler.push({ bolum: b.id, alan: b.id, ad: `${b.ad} · en az ${b.enAz} satır` });
        satirlar[b.id] = l.map((s, i) => {
          const d = satirDegerlendir(b, s, ik3);
          for (const col of b.sutunlar) if (col.zorunlu && bos(s[col.id])) eksikler.push({ bolum: b.id, alan: satirAnahtari(b.id, i, col.id), ad: `${b.ad} · ${i + 1}. satır · ${col.ad}` });
          const etiket = s[b.sutunlar[0]?.id ?? ""] || `${i + 1}. satır`;
          if (b.notlar?.length) {
            const n = Number(s.not);
            const not = Number.isInteger(n) && n >= 1 ? b.notlar[n - 1] : undefined;
            if (!not) eksikler.push({ bolum: b.id, alan: satirAnahtari(b.id, i, "not"), ad: `${b.ad} · ${i + 1}. satır · uygunluk notu` });
            else if (not.kusur) kusurlar.push({ bolum: b.id, ref: `${b.id}#${i}`, metin: `${etiket}: Not-${n} — ${not.metin}`, agir: not.agir });
          } else if (d.uygun === false) kusurlar.push({ bolum: b.id, ref: `${b.id}#${i}`, metin: `${etiket}: ${d.neden.join("; ")}`, agir: false });
          return d;
        });
        break;
      }
      case "test":
        for (const d of b.degerler) {
          const v = c.deger[d.id];
          const dolu = d.metin ? !bos(v) : !Number.isNaN(sayiOku(v));
          if (d.zorunlu && !dolu) eksikler.push({ bolum: b.id, alan: d.id, ad: d.ad });
          const r = d.metin ? null : sinirSonucu(d.op, d.sinir, v);
          degerler[d.id] = r;
          if (r === false) kusurlar.push({ bolum: b.id, ref: d.id, metin: `${d.ad}: ${v}${d.birim ? ` ${d.birim}` : ""} (sınır ${d.op === "<=" ? "≤" : "≥"} ${virgul(d.sinir!)}${d.birim ? ` ${d.birim}` : ""})`, agir: false });
        }
        break;
      case "cihaz":
        if (c.cihaz < 1) eksikler.push({ bolum: b.id, alan: b.id, ad: "Ölçüm cihazı eklenmedi" });
        break;
      case "foto":
        if (c.foto < b.enAz) eksikler.push({ bolum: b.id, alan: b.id, ad: `En az ${b.enAz} fotoğraf` });
        break;
      case "not":
        if (b.zorunlu && bos(c.yorum)) eksikler.push({ bolum: b.id, alan: b.id, ad: b.ad });
        break;
      case "sonuc":
        if (!c.sonuc) eksikler.push({ bolum: b.id, alan: b.id, ad: "Sonuç seçilmedi" });
        break;
      default:
        break;
    }
  }
  return { eksikler, kusurlar, oneri: t.kurallar.oneri && kusurlar.length > 0 ? "uygun_degil" : "uygun", satirlar, degerler };
}

/** kilitli (Bakanlık) öğelerin kimlikleri — bölüm, alan, madde, değer */
export function kilitliKimlikler(t: FormatTanimi): Set<string> {
  const s = new Set<string>();
  for (const b of t.bolumler) {
    if (b.kilit) s.add(b.id);
    if (b.blok === "bilgi") for (const a of b.alanlar) if (a.kilit) s.add(a.id);
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) if (m.kilit) s.add(m.id);
    if (b.blok === "test") for (const d of b.degerler) if (d.kilit) s.add(d.id);
  }
  return s;
}
function butunKimlikler(t: FormatTanimi): Set<string> {
  const s = new Set<string>();
  for (const b of t.bolumler) {
    s.add(b.id);
    if (b.blok === "bilgi") for (const a of b.alanlar) s.add(a.id);
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) s.add(m.id);
    if (b.blok === "test") for (const d of b.degerler) s.add(d.id);
  }
  return s;
}

/** yayın öncesi denetim (RAPOR-FORMAT §5) — boşsa yayınlanır. kaynak: kilitli alanların geldiği önceki sürüm / hazır şablon */
export function yayinDenetimi(t: FormatTanimi, kaynak?: FormatTanimi | null): string[] {
  const l: string[] = [];
  const bosBolum = (b: Bolum) => l.push(`“${b.ad}” bölümü boş.`);
  for (const b of t.bolumler) {
    if (b.blok === "bilgi" && !b.alanlar.length) bosBolum(b);
    if (b.blok === "liste" && !b.gruplar.some((g) => g.maddeler.length)) bosBolum(b);
    if (b.blok === "test" && !b.degerler.length) bosBolum(b);
    if (b.blok === "olcum") {
      if (!b.sutunlar.length) bosBolum(b);
      else if (!b.hesap && !b.notlar?.length && !b.sutunlar.some((c) => c.op && c.sinir !== undefined)) l.push(`“${b.ad}” tablosunda sınırı olan sütun, hesap ya da uygunluk notu yok.`);
    }
  }
  if (!t.bolumler.some((b) => b.blok === "sonuc")) l.push("Sonuç ve kanaat bölümü yok.");
  if (!t.bolumler.some((b) => b.blok === "imza")) l.push("İmza alanları bölümü yok.");
  if (kaynak) {
    const var_ = butunKimlikler(t);
    for (const k of kilitliKimlikler(kaynak)) if (!var_.has(k)) l.push(`Bakanlık formatının zorunlu öğesi silinmiş: ${k}.`);
  }
  return l;
}
