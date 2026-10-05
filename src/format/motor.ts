/* FORMAT MOTORU — tanımı okuyup raporu DEĞERLENDİRİR (RAPOR-FORMAT.md §1: "doğrulamayı, otomatik sonucu ve kusur listesini hesaplar").
   Saf: veritabanına, ağa, saate dokunmaz; saha ekranı (istemci, çevrimdışı) ve sunucu (Onaya gönder, PDF) aynı sonucu verir.
   · eksikler: zorunlu boş alanlar — Onaya gönder ENGELLER ve alanı işaretler (§3.8-5, KOD-GECIS ENGEL 5; sonuç hariç — seçilmediyse öneri yazılır).
     Temel zorunlular (§3.8-5): fotoğraf bölümünün en azı, "Uygun değil" maddenin açıklaması (derece kuralı açıksa derecesi), kural açıksa
     maddenin fotoğrafı (AA9, başlangıçta kapalı), türün ölçüm cihazı, test ve ölçüm değerleri.
   · kusurlar: liste maddesinde olumsuz cevap (cevap setinin 2. öğesi) · seçilen uygunluk notu kusursa · hesabı ya da sütun sınırı tutmayan satır ·
     sınır dışı test değeri. Kusur açıklamaları bölümü bundan dolar.
   · öneri: kural açıksa herhangi kusur → "uygun_degil", yoksa "uygun". Denetçi sonucu kendisi seçer.
   Yayın denetimi (§5): boş bölüm, cevap seti eksik liste, sınırı / hesabı / notu olmayan ölçüm tablosu — UYARI (yayın olur).
   Kilitli öğe denetimi (§3, 2026-10-04): kilitli (Bakanlık) öğe silinmiş / değiştirilmiş / kilidi kaldırılmış — ENGEL (yayınlanmaz).
   ⛔ Bu dosya yalnız ./hesap.ts ve ./tanim.ts'i içe aktarır (olumsuz kanıt kopyası bu iki yolu çevirir). */
import { linyeHesap, noktaHesap, pdHesap, rcdTestYeter, sayiOku, sinirSonucu, ziHesap } from "./hesap.ts";
import type { Bolum, BolumOf, Cevaplar, FormatTanimi } from "./tanim.ts";

export interface Eksik { bolum: string; alan: string; ad: string }
/** kriter: kusurun ölçütü (madde metni, ölçüm satırının etiketi, test değerinin adı); metin "kriter: açıklama" ya da yalnız kriter — kriter ayrı
    tutulur, metinden geri ayrıştırılmaz (kriterin kendisinde ": " olabilir; 320–323 incelemesi) */
export interface Kusur { bolum: string; ref: string; kriter: string; metin: string; agir: boolean }
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
          kusurlar.push({ bolum: b.id, ref: m.id, kriter: m.metin, metin: x.not?.trim() ? `${m.metin}: ${x.not.trim()}` : m.metin, agir: t.kurallar.derece && x.derece === "agir" });
          if (!x.not?.trim()) eksikler.push({ bolum: b.id, alan: `${m.id}.not`, ad: `${m.metin} · kusur açıklaması` });
          if (t.kurallar.derece && !x.derece) eksikler.push({ bolum: b.id, alan: `${m.id}.derece`, ad: `${m.metin} · kusur derecesi` });
          if (t.kurallar.foto && !(x.foto && x.foto > 0)) eksikler.push({ bolum: b.id, alan: `${m.id}.foto`, ad: `${m.metin} · fotoğraf` });
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
            else if (not.kusur) kusurlar.push({ bolum: b.id, ref: `${b.id}#${i}`, kriter: etiket, metin: `${etiket}: Not-${n} — ${not.metin}`, agir: not.agir });
          } else if (d.uygun === false) kusurlar.push({ bolum: b.id, ref: `${b.id}#${i}`, kriter: etiket, metin: `${etiket}: ${d.neden.join("; ")}`, agir: false });
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
          if (r === false) kusurlar.push({ bolum: b.id, ref: d.id, kriter: d.ad, metin: `${d.ad}: ${v}${d.birim ? ` ${d.birim}` : ""} (sınır ${d.op === "<=" ? "≤" : "≥"} ${virgul(d.sinir!)}${d.birim ? ` ${d.birim}` : ""})`, agir: false });
        }
        break;
      case "cihaz":
        if (c.cihaz < 1) eksikler.push({ bolum: b.id, alan: b.id, ad: "Ölçüm cihazı eklenmedi" });
        break;
      case "foto":
        if ((c.foto[b.id] ?? 0) < b.enAz) eksikler.push({ bolum: b.id, alan: b.id, ad: `En az ${b.enAz} fotoğraf` });
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

/* ── KİLİTLİ ÖĞE DENETİMİ (RAPOR-FORMAT §1 "Bakanlık formatlı türde zorunlu alanlar kilitli", §3 "silinemez, yalnız sırası / görünümü değişir;
   eksikse yayınlanmaz (bu tek engel: resmî formatın kendisi)"). 2026-10-04 (308): yalnız "silinmiş mi" değil — kilitli öğe yerinde, kilidi
   duruyor ve ÖZÜ aynı (ad, alan türü, seçenekler, kayıttan gelen kaynak, sınır, madde metni, cevap seti, hesap, uygunluk notları, sonuç cümlesi);
   zorunlu olan isteğe bağlıya, en az satır sayısı aşağıya çekilemez. Sırası serbest, kilitli bölüme yeni (kilitsiz) öğe eklenebilir. Kaynak
   SUNUCUDA seçilir (hazır şablon koddan, önceki yayın veritabanından) — istemcinin yolladığı tanımdaki "kilit" bayrağına güvenilmez. */
const oz = (o: Record<string, unknown>) => JSON.stringify(o, (_k, v) => (v === undefined ? undefined : v));
const bolumOzu = (b: Bolum) => oz({
  blok: b.blok, ad: b.ad,
  ...(b.blok === "liste" ? { cevaplar: b.cevaplar } : {}),
  ...(b.blok === "olcum" ? { hesap: b.hesap, notlar: b.notlar, satir: b.satir } : {}),
  ...(b.blok === "sonuc" ? { cumle: b.cumle } : {}),
  ...(b.blok === "imza" ? { imzalar: b.imzalar } : {}),
});
type AlanT = BolumOf<"bilgi">["alanlar"][number];
type MaddeT = BolumOf<"liste">["gruplar"][number]["maddeler"][number];
type DegerT = BolumOf<"test">["degerler"][number];
type SutunT = BolumOf<"olcum">["sutunlar"][number];
const alanOzu = (a: AlanT) => oz({ ad: a.ad, tur: a.tur, secenekler: a.secenekler, kaynak: a.kaynak, birim: a.birim });
const maddeOzu = (m: MaddeT) => oz({ metin: m.metin, std: m.std });
const degerOzu = (d: DegerT) => oz({ ad: d.ad, birim: d.birim, metin: d.metin, op: d.op, sinir: d.sinir });
const sutunOzu = (s: SutunT) => oz({ ad: s.ad, birim: s.birim, giris: s.giris, secenekler: s.secenekler, op: s.op, sinir: s.sinir });

interface Ogeler { bolum: Map<string, Bolum>; alan: Map<string, AlanT>; madde: Map<string, MaddeT>; deger: Map<string, DegerT> }
function ogeler(t: FormatTanimi): Ogeler {
  const o: Ogeler = { bolum: new Map(), alan: new Map(), madde: new Map(), deger: new Map() };
  for (const b of t.bolumler) {
    o.bolum.set(b.id, b);
    if (b.blok === "bilgi") for (const a of b.alanlar) o.alan.set(a.id, a);
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) o.madde.set(m.id, m);
    if (b.blok === "test") for (const d of b.degerler) o.deger.set(d.id, d);
  }
  return o;
}

/** kaynağın kilitli öğeleri taslakta korunmuş mu; boş liste = engel yok */
export function kilitDenetimi(t: FormatTanimi, kaynak: FormatTanimi): string[] {
  const l: string[] = [], y = ogeler(t);
  const sorun = (ne: "silinmiş" | "değiştirilmiş" | "kilidi kaldırılmış" | "zorunluluğu kaldırılmış", id: string, ad: string) =>
    l.push(`Bakanlık formatının zorunlu öğesi ${ne}: ${id} (“${ad}”).`);
  let kilitVar = false;
  for (const b of kaynak.bolumler) {
    if (b.kilit) {
      kilitVar = true;
      const n = y.bolum.get(b.id);
      if (!n) sorun("silinmiş", b.id, b.ad);
      else if (bolumOzu(n) !== bolumOzu(b)) sorun("değiştirilmiş", b.id, b.ad);
      else if (!n.kilit) sorun("kilidi kaldırılmış", b.id, b.ad);
      else if (b.blok === "olcum" && n.blok === "olcum") {
        if (n.enAz < b.enAz) sorun("değiştirilmiş", b.id, `${b.ad} · en az satır`);
        for (const s of b.sutunlar) {
          const ns = n.sutunlar.find((x) => x.id === s.id);
          if (!ns) sorun("silinmiş", `${b.id}.${s.id}`, `${b.ad} · ${s.ad}`);
          else if (sutunOzu(ns) !== sutunOzu(s)) sorun("değiştirilmiş", `${b.id}.${s.id}`, `${b.ad} · ${s.ad}`);
          else if (s.zorunlu && !ns.zorunlu) sorun("zorunluluğu kaldırılmış", `${b.id}.${s.id}`, `${b.ad} · ${s.ad}`);
        }
      }
    }
    const altlar: readonly (readonly [kind: "alan" | "madde" | "deger", id: string, ad: string, kilit: boolean])[] =
      b.blok === "bilgi" ? b.alanlar.map((a) => ["alan", a.id, a.ad, a.kilit] as const)
        : b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => ["madde", m.id, m.metin, m.kilit] as const))
          : b.blok === "test" ? b.degerler.map((d) => ["deger", d.id, d.ad, d.kilit] as const) : [];
    for (const [kind, id, ad, kilit] of altlar) {
      if (!kilit) continue;
      kilitVar = true;
      if (kind === "alan") {
        const e = (b as BolumOf<"bilgi">).alanlar.find((x) => x.id === id)!, n = y.alan.get(id);
        if (!n) sorun("silinmiş", id, ad);
        else if (alanOzu(n) !== alanOzu(e)) sorun("değiştirilmiş", id, ad);
        else if (!n.kilit) sorun("kilidi kaldırılmış", id, ad);
        else if (e.zorunlu && !n.zorunlu) sorun("zorunluluğu kaldırılmış", id, ad);
      } else if (kind === "madde") {
        const e = (b as BolumOf<"liste">).gruplar.flatMap((g) => g.maddeler).find((x) => x.id === id)!, n = y.madde.get(id);
        if (!n) sorun("silinmiş", id, ad);
        else if (maddeOzu(n) !== maddeOzu(e)) sorun("değiştirilmiş", id, ad);
        else if (!n.kilit) sorun("kilidi kaldırılmış", id, ad);
      } else {
        const e = (b as BolumOf<"test">).degerler.find((x) => x.id === id)!, n = y.deger.get(id);
        if (!n) sorun("silinmiş", id, ad);
        else if (degerOzu(n) !== degerOzu(e)) sorun("değiştirilmiş", id, ad);
        else if (!n.kilit) sorun("kilidi kaldırılmış", id, ad);
        else if (e.zorunlu && !n.zorunlu) sorun("zorunluluğu kaldırılmış", id, ad);
      }
    }
  }
  /* resmî formatın kimliği: form kodu ve başlık (PDF üst bilgisi) — kilitli öğesi olan kaynakta değişmez */
  if (kilitVar && kaynak.gorunum.formKodu && (t.gorunum.formKodu !== kaynak.gorunum.formKodu || t.gorunum.baslik !== kaynak.gorunum.baslik)) {
    l.push(`Bakanlık formatının form kodu ve başlığı değiştirilemez: ${kaynak.gorunum.formKodu} (“${kaynak.gorunum.baslik}”).`);
  }
  return l;
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
  if (kaynak) l.push(...kilitDenetimi(t, kaynak));
  return l;
}
