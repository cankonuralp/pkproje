/* RAPORU TAMAMLAMA — S.A.Y "ÖNCE YAP, SONRA KISACA BİLDİR" (2026-10-31; reisim: "S.A.Y durup sormaz, işi bitirir, sonra kısaca bildirir"; sunum
   yerel/say-arge/2026-10-31-sunum-once-yap-sonra-bildir.md L1). SAF. Kullanıcının verdiği her değer önce gelir: tamamlayıcı yalnız BOŞ ve bu çağrıda
   verilmemiş yeri doldurur, doluya dokunmaz. Kurallar (kullanıcı başka bir şey söylemediyse):
   · uygunsuzluk belirtilmediyse cevapsız kontrol maddeleri cevap setinin ilk seçeneği ("Uygun"); sonuç motorun önerisi (format/motor.ts degerlendir)
     — kusur varken öneri kapalıysa sonuç elle kalır;
   · rapor tarihi = işin günü; başlangıç / bitiş / sonraki kontrol saat planından (saat-plani.ts — bitişi yazılmamış raporda);
   · test değerinin notunda katsayı varsa ("anma yükünün %110'u", "1,25 katı") değer kapasiteden hesaplanır; kapasite yoksa boş kalır;
   · bilinemeyen METİN alanı "-" (ekipman bilgisi, bilgi alanı, metin test değeri, tablonun metin hücresi); sayı / seçim / tarih boş kalır;
   · ölçüm cihazı: kalibrasyonu geçerli adaylardan — yazanın zimmetindeki, yoksa yazanın en son kullandığı, yoksa kalibrasyonu en uzun geçerli olan
     (reisim: "2 önerin uygundur, ama yaptığı işlemi eğer 3. seçenekse kullanıcıya bildirsin"); hiç aday yoksa boş — kalan engel.
   Çıktı: ekranın girişleri (komutlariUygula'nın yer kimlikleri — aynı denetimden geçer) + bildirimin satırları. Kilit tests/say-tamamla.test.ts. */
import { degerlendir } from "../../format/motor.ts";
import type { FormatTanimi } from "../../format/tanim.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari } from "./doldur.ts";
import { saatGirisleri, type SaatSatiri } from "./saat-plani.ts";
import { maddeleriIsaretle, type Durum } from "./say-doldur.ts";

export interface CihazAdayi { id: string; kod: string; zimmette: boolean; sonKullanim: string | null; bitis: string | null }
export type CihazNedeni = "zimmet" | "son" | "kalibrasyon";
export interface CihazSatiri { turId: string; turAd: string; secili: boolean; adaylar: readonly CihazAdayi[] }
export interface TamamlaGirdisi {
  tanim: FormatTanimi;
  durum: Durum;
  /** bu çağrıda kullanıcının / S.A.Y'ın verdiği yerler — tamamlayıcı bunlara dokunmaz */
  verilen: ReadonlySet<string>;
  /** işin günü (YYYY-AA-GG) */
  gun: string;
  /** bu raporun saat planı satırı (bitişi yazılmamış raporda) */
  saat: SaatSatiri | null;
  cihazlar: readonly CihazSatiri[];
}
export interface Tamamlama {
  girisler: { yer: string; deger: string }[];
  /** varsayımla yazılanlar (bildirimin 2. satırı) */
  varsayim: string[];
  /** "-" yazılan alanların adları (3. satır) */
  tire: string[];
  /** doldurulamayan ve onayı engelleyebilecekler (4. satır) */
  engel: string[];
}

const tr = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
const bosMu = (x: unknown) => (typeof x === "string" ? !x.trim() : Array.isArray(x) ? !x.length : x === undefined || x === null);
const gunTr = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
const SONUC_YAZI = { uygun: "uygun", uygun_degil: "uygun değil", sartli: "şartlı uygun" } as const;

/** ölçüm cihazı seçimi: zimmetteki (en son kullanılanı önce) → en son kullanılan → kalibrasyonu en uzun geçerli */
export function cihazSec(adaylar: readonly CihazAdayi[]): { aday: CihazAdayi; neden: CihazNedeni } | null {
  if (!adaylar.length) return null;
  const sonra = (a: CihazAdayi, b: CihazAdayi) => (b.sonKullanim ?? "").localeCompare(a.sonKullanim ?? "") || (b.bitis ?? "").localeCompare(a.bitis ?? "")
    || a.kod.localeCompare(b.kod);
  const zimmet = adaylar.filter((x) => x.zimmette).sort(sonra);
  if (zimmet.length) return { aday: zimmet[0]!, neden: "zimmet" };
  const son = adaylar.filter((x) => x.sonKullanim).sort(sonra);
  if (son.length) return { aday: son[0]!, neden: "son" };
  return { aday: [...adaylar].sort((a, b) => (b.bitis ?? "").localeCompare(a.bitis ?? "") || a.kod.localeCompare(b.kod))[0]!, neden: "kalibrasyon" };
}

/** test değerinin notundaki katsayı: "%110" → 1,1 · "1,25 katı" → 1,25; yoksa null */
export function notKatsayisi(not: string | undefined): number | null {
  if (!not) return null;
  const y = /%\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*%/.exec(not);
  if (y) { const n = Number((y[1] ?? y[2])!.replace(",", ".")) / 100; return n > 0 && n <= 10 ? n : null; }
  const k = /(\d+(?:[.,]\d+)?)\s*kat/i.exec(not);
  if (k) { const n = Number(k[1]!.replace(",", ".")); return n > 0 && n <= 10 ? n : null; }
  return null;
}
const sayiOku = (s: unknown): number | null => {
  if (typeof s !== "string") return null;
  const n = Number(s.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const sayiYaz = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

export function raporTamamla(g: TamamlaGirdisi): Tamamlama {
  const { tanim: t, verilen } = g;
  const girisler: Tamamlama["girisler"] = [], varsayim: string[] = [], tire: string[] = [], engel: string[] = [];
  const ekle = (yer: string, deger: string) => { if (!verilen.has(yer)) girisler.push({ yer, deger }); };

  /* maddeler ve sonuç */
  const m = maddeleriIsaretle(g.durum, t);
  const maddeYerleri = m.geri.flatMap((x) => ("yer" in x && x.yer.tur === "madde" ? [{ yer: `m:${x.yer.id}`, deger: x.yeni }] : []))
    .filter((x) => !verilen.has(x.yer));
  for (const x of maddeYerleri) ekle(x.yer, x.deger);
  if (maddeYerleri.length) varsayim.push(`uygunsuzluk belirtilmediği için ${maddeYerleri.length} madde ${m.geri[0] && "yeni" in m.geri[0] ? m.geri[0].yeni : "uygun"}`);
  const sonucBolumu = t.bolumler.some((b) => b.blok === "sonuc");
  if (sonucBolumu && !verilen.has("sonuc") && bosMu(g.durum.cevaplar.sonuc)) {
    const d = degerlendir(t, m.durum.cevaplar);
    if (d.kusurlar.length && t.kurallar?.oneri === false) engel.push("sonuç: kusur var, formatta öneri kapalı — sonuç elle seçilmeli");
    else { ekle("sonuc", SONUC_YAZI[d.oneri]); varsayim.push(`sonuç ${SONUC_YAZI[d.oneri]} (maddelerden)`); }
  }

  /* tarihler ve saatler */
  if (bosMu(g.durum.tarih?.rapor) && !verilen.has("tarih:rapor")) { ekle("tarih:rapor", gunTr(g.gun)); }
  if (g.saat && bosMu(g.durum.tarih?.bit) && !verilen.has("tarih:bas") && !verilen.has("tarih:bit")) {
    for (const x of saatGirisleri(g.saat)) if (x.yer !== "tarih:sonraki" || bosMu(g.durum.tarih?.sonraki)) ekle(x.yer, x.deger);
  } else if (g.saat && bosMu(g.durum.tarih?.sonraki) && !verilen.has("tarih:sonraki")) {
    ekle("tarih:sonraki", gunTr(g.saat.sonraki));
  }

  /* bilinemeyen metin alanı "-" — ekipman bilgisi ve bilgi bölümleri (kayıttan gelen, çok seçimli, formüllü hariç) */
  const ekipman = ekipmanAlanlari(t);
  const alanDegeri = (id: string) => (ekipmanAnahtari(id) ? g.durum.ekipman[id] : g.durum.cevaplar.alan[id]);
  const alanlar = [...ekipman.alanlar.map((a) => ({ a, yer: `e:${a.id}` })),
    ...t.bolumler.flatMap((b) => (b.blok === "bilgi" && b.id !== ekipman.tam?.id ? bilgiAlanlari(b).map((a) => ({ a, yer: ekipmanAnahtari(a.id) ? `e:${a.id}` : `a:${a.id}` })) : []))];
  const gorulen = new Set<string>();
  for (const { a, yer } of alanlar) {
    if (gorulen.has(yer)) continue;
    gorulen.add(yer);
    if (a.tur !== "metin" || verilen.has(yer) || !bosMu(alanDegeri(a.id))) continue;
    ekle(yer, "-"); tire.push(a.ad);
  }

  /* test değerleri: katsayılı notta kapasiteden; metin değer "-" */
  const kapasite = alanlar.filter(({ a }) => /kapasite|anma yük/.test(tr(a.ad))).map(({ a }) => sayiOku(alanDegeri(a.id))).find((n) => n !== null) ?? null;
  /* 2026-10-31 (V21 madde 5 — reisim: "Beyan kapasitesi boşsa etiketten ya da 'MAX' levhasından yazılır"): adında "kapasite" geçen boş SAYI alanı ya da
     test değeri (katsayısız, formülsüz, seçeneksiz) ekipmanın kapasitesinden — genel kural, türe özgü değil */
  const kapasiteYaz = (yer: string, ad: string, birim?: string) => {
    if (kapasite === null) return;
    ekle(yer, sayiYaz(kapasite)); varsayim.push(`${ad} ekipmanın kapasitesinden (${sayiYaz(kapasite)}${birim ? ` ${birim}` : ""})`);
  };
  const kapasiteGorulen = new Set<string>();
  for (const { a, yer } of alanlar) {
    if (kapasiteGorulen.has(yer) || a.tur !== "sayi" || !/kapasite/.test(tr(a.ad)) || verilen.has(yer) || !bosMu(alanDegeri(a.id))) continue;
    kapasiteGorulen.add(yer);
    kapasiteYaz(yer, a.ad);
  }
  for (const b of t.bolumler) {
    if (b.blok !== "test") continue;
    for (const d of b.degerler) {
      const yer = `d:${d.id}`;
      if (verilen.has(yer) || d.formul?.trim() || d.secenekler?.length || !bosMu(g.durum.cevaplar.deger[d.id])) continue;
      if (d.metin) { ekle(yer, "-"); tire.push(d.ad); continue; }
      const k = notKatsayisi(d.not);
      if (k === null) { if (/kapasite/.test(tr(d.ad))) kapasiteYaz(yer, d.ad, d.birim); continue; }
      if (kapasite === null) { engel.push(`${d.ad}: kapasite bilinmediği için hesaplanamadı`); continue; }
      ekle(yer, sayiYaz(kapasite * k)); varsayim.push(`${d.ad} ${d.not} olarak hesaplandı (${sayiYaz(kapasite * k)}${d.birim ? ` ${d.birim}` : ""})`);
    }
  }

  /* tablonun metin hücreleri "-" (var olan satırlarda) */
  for (const b of t.bolumler) {
    if (b.blok !== "olcum") continue;
    const satirlar = g.durum.cevaplar.tablo[b.id] ?? [];
    const metin = b.sutunlar.filter((s) => s.giris === "metin" && !s.formul?.trim());
    let n = 0;
    satirlar.forEach((r, i) => {
      for (const s of metin) {
        const yer = `t:${b.id}:${i + 1}:${s.id}`;
        if (verilen.has(yer) || !bosMu(r[s.id])) continue;
        ekle(yer, "-"); n++;
      }
    });
    if (n) tire.push(`${b.ad}: ${n} hücre`);
  }

  /* ölçüm cihazı */
  for (const c of g.cihazlar) {
    const yer = `cihaz:${c.turId}`;
    if (c.secili || verilen.has(yer)) continue;
    const s = cihazSec(c.adaylar);
    if (!s) { engel.push(`ölçüm cihazı yok (${c.turAd}: zimmette ya da depoda kalibrasyonu geçerli cihaz kayıtlı değil)`); continue; }
    ekle(yer, s.aday.kod);
    if (s.neden === "kalibrasyon") varsayim.push(`${c.turAd}: ${s.aday.kod} seçildi (zimmetinizde yok, daha önce kullanmadınız — kalibrasyonu en uzun geçerli olan)`);
  }
  return { girisler, varsayim, tire, engel };
}

/* ── BİLDİRİM (reisim: "Bildirim kısa olur; dört satırı geçmesin") — işin bütün raporlarından en çok dört satır ── */
export interface RaporOzeti {
  /** raporun numarası ve ekipmanın kodu ("DM-1026-017 · AKL-0001") */
  ad: string;
  yazildi: boolean;
  neden?: string;
  varsayim: readonly string[];
  tire: readonly string[];
  engel: readonly string[];
  supheli: readonly string[];
}
const say = (l: readonly string[]) => {
  const m = new Map<string, number>();
  for (const x of l) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m];
};
/** satırlar: hazır olanlar · varsayımla yazılanlar (+ saat aralığı, şüpheliler) · "-" bırakılanlar · kalan engel; boş satır yazılmaz */
export function isBildirimi(l: readonly RaporOzeti[], saat: { gun: string; bas: string; bit: string } | null = null): string[] {
  const hazir = l.filter((x) => x.yazildi), olmadi = l.filter((x) => !x.yazildi);
  const satirlar = [`${hazir.length} rapor hazır (taslak, gönderilmedi).${olmadi.length ? ` ${olmadi.length} rapora yazılamadı: ${olmadi.map((x) => `${x.ad} — ${x.neden ?? "?"}`).join(" · ")}.` : ""}`];
  const n = hazir.length;
  const v = say(hazir.flatMap((x) => x.varsayim)).map(([m, k]) => (n > 1 && k < n ? `${m} (${k} raporda)` : m));
  if (saat) v.push(`kontrol ${gunTr(saat.gun)}, ${saat.bas}–${saat.bit}`);
  for (const x of hazir) for (const sp of x.supheli) v.push(`${x.ad} ${sp} şüpheli`);
  if (v.length) satirlar.push(`Varsayımla yazılanlar: ${v.join(" · ")}.`);
  const t = hazir.filter((x) => x.tire.length).map((x) => `${x.ad} ${x.tire.join(", ")}`);
  if (t.length) satirlar.push(`'-' bırakılanlar: ${t.join(" · ")}.`);
  const e = say(hazir.flatMap((x) => x.engel)).map(([m, k]) => (n > 1 && k < n ? `${m} (${k} raporda)` : m));
  if (e.length) satirlar.push(`Kalan engel: ${e.join(" · ")}.`);
  return satirlar;
}
