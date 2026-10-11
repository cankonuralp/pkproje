/* YAPAY ZEKÂ ÖNERİLERİ — saf (497 / 498; hata listesi 29 + 46 maketi onaylı, karar K6: "öneri kâğıtta kesik çizgiyle görünür; Ekle / Uygula
   demeden yazılmaz"). Yapay zekânın sade bölümü (src/server/yz/format.ts FORMAT_SEMASI) formatın bölümüne çevrilir ve ŞEMADAN geçer; geçmeyen öneri
   atılır. Öneri iki türlü: "ekle" (yeni bölüm; hangi bölümden sonra — yer her çizimde bölümün kimliğinden bulunur, taslak değişse de kaymaz) ve
   "degistir" (var olan bölümün yeni hâli: kimliği, Bakanlık işareti, üst / alt başlık, doldurma ayarı, tablo hesabı ve cevap seti korunur; adı aynı
   kalan öğe kimliğini ve işaretini korur). Ölçüm cihazları, ekipman bilgileri ve kayıttan gelen bölüm önerilmez, değiştirilmez. Uygulanınca
   kimlikler O ANKİ taslağa göre yeniden verilir (yapboz.ts bolumYerlestir) ve bütün tanım şemadan geçer. */
import { ekipmanBolumuMu, kayittanBolumMu } from "../../format/duzen.ts";
import { FORMUL_EN_UZUN } from "../../format/formul.ts";
import { Bolum, FormatTanimi, SINIRLAR } from "../../format/tanim.ts";
import { yeniKimlik } from "./kurucu.ts";
import { bolumYerlestir } from "./yapboz.ts";

export type Oneri =
  | { id: string; tur: "ekle"; sonra: string | null; aciklama: string; bolum: Bolum }
  | { id: string; tur: "degistir"; hedef: string; aciklama: string; bolum: Bolum };

const BLOKLAR = ["bilgi", "liste", "olcum", "test", "foto", "metin", "not", "kusur", "sonuc", "imza"] as const;
const CEVAPLAR = ["Uygun", "Uygun değil", "Uygulanamaz"];
const nesne = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const yazi = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
const istege = (x: unknown, n: number) => yazi(x, n) || undefined;
const dizi = (x: unknown, n: number) => (Array.isArray(x) ? x.slice(0, n) : []);
const secenekler = (x: unknown) => { const l = [...new Set(dizi(x, 20).map((s) => yazi(s, 60)).filter(Boolean))]; return l.length ? l : undefined; };
const sinir = (o: Record<string, unknown>) => {
  const op = SINIRLAR.find((s) => s === o.op), n = typeof o.sinir === "number" && Number.isFinite(o.sinir) ? o.sinir : undefined;
  return op && n !== undefined ? { op, sinir: n } : {};
};
const formul = (x: unknown) => istege(x, FORMUL_EN_UZUN);
const kucuk = (s: string) => s.trim().toLocaleLowerCase("tr");

/** sade bölüm → formatın bölümü (kimlikler t'ye göre tekil; ek: bu çağrıda verilenler); şemadan geçmezse null */
export function hamdanBolum(t: FormatTanimi, ham: unknown, ek: Set<string> = new Set()): Bolum | null {
  const h = nesne(ham);
  const blok = BLOKLAR.find((b) => b === h.blok);
  const ad = yazi(h.ad, 200);
  if (!blok || !ad) return null;
  const yeni = (onek: "b" | "a" | "g" | "m" | "s" | "d") => { const x = yeniKimlik(t, onek, ek); ek.add(x); return x; };
  const id = yeni("b");
  let b: Record<string, unknown> = { id, ad, blok, kilit: false };
  if (blok === "bilgi") {
    b.alanlar = dizi(h.alanlar, 60).map(nesne).filter((a) => yazi(a.ad, 200)).map((a) => {
      const sec = secenekler(a.secenekler);
      const tur = a.tur === "secim" && !sec ? "metin" : (["metin", "sayi", "tarih", "secim", "evet"] as const).find((x) => x === a.tur) ?? "metin";
      return { id: yeni("a"), ad: yazi(a.ad, 200), tur, zorunlu: a.zorunlu === true, kilit: false, birim: istege(a.birim, 40),
        ...(tur === "secim" ? { secenekler: sec } : {}), ...(tur === "sayi" && formul(a.formul) ? { formul: formul(a.formul) } : {}) };
    });
  } else if (blok === "liste") {
    let gruplar = dizi(h.gruplar, 40).map(nesne).map((g) => ({ ad: yazi(g.ad, 200), maddeler: dizi(g.maddeler, 200).map((m) => yazi(m, 200)).filter(Boolean) }))
      .filter((g) => g.maddeler.length);
    if (!gruplar.length) gruplar = [{ ad: "", maddeler: [] }];
    b = { ...b, cevaplar: [...CEVAPLAR], gruplar: gruplar.map((g) => ({ id: yeni("g"), ad: g.ad, maddeler: g.maddeler.map((m) => ({ id: yeni("m"), metin: m, kilit: false })) })) };
  } else if (blok === "olcum") {
    const gorulen = new Set<string>();
    b = { ...b, satir: "ekle", sutunlar: dizi(h.sutunlar, 20).map(nesne).filter((s) => { const a = kucuk(yazi(s.ad, 200)); if (!a || gorulen.has(a)) return false; gorulen.add(a); return true; }).map((s) => {
      const sec = secenekler(s.secenekler);
      const giris = s.giris === "secim" && !sec ? "metin" : (["sayi", "metin", "secim", "evet"] as const).find((x) => x === s.giris) ?? "sayi";
      return { id: yeni("s"), ad: yazi(s.ad, 200), giris, birim: istege(s.birim, 40), ...(giris === "secim" ? { secenekler: sec } : {}),
        ...(giris === "sayi" ? { ...sinir(s), ...(formul(s.formul) ? { formul: formul(s.formul) } : {}) } : {}) };
    }) };
  } else if (blok === "test") {
    b.degerler = dizi(h.degerler, 40).map(nesne).filter((d) => yazi(d.ad, 200)).map((d) => ({
      id: yeni("d"), ad: yazi(d.ad, 200), birim: istege(d.birim, 40), ...sinir(d), ...(formul(d.formul) ? { formul: formul(d.formul) } : {}) }));
  } else if (blok === "foto") {
    const n = typeof h.enAz === "number" && Number.isFinite(h.enAz) ? Math.min(50, Math.max(0, Math.round(h.enAz))) : 0;
    b.enAz = n;
  } else if (blok === "metin") b.metin = typeof h.metin === "string" ? h.metin.replace(/\r\n?/g, "\n").trim().slice(0, 4000) : "";
  else if (blok === "imza") {
    const l = [...new Set(dizi(h.imzalar, 2).filter((x): x is "uzman" | "teknik" => x === "uzman" || x === "teknik"))];
    b.imzalar = l.length ? l : ["uzman"];
  }
  const r = Bolum.safeParse(b);
  return r.success ? r.data : null;
}

/** değiştirilebilen bölüm: ölçüm cihazları, ekipman bilgileri, kayıttan gelen künye değil */
/* dönüş türü açık: yoksa TypeScript bunu "bilgi değil" diye bir tür daraltması sayar (ekipmanBolumuMu / kayittanBolumMu daraltıcıdır) */
function degisebilir(b: Bolum): boolean {
  if (b.blok === "cihaz") return false;
  return b.blok !== "bilgi" || !(ekipmanBolumuMu(b) || kayittanBolumMu(b));
}

/** yapay zekânın ham önerileri → öneriler (geçmeyen atılır; kaç tanesi atıldı da döner) */
export function onerileriKur(t: FormatTanimi, ham: readonly unknown[]): { oneriler: Oneri[]; atilan: number } {
  const ek = new Set<string>(), oneriler: Oneri[] = [];
  let atilan = 0;
  ham.forEach((x, n) => {
    const o = nesne(x);
    const bolum = hamdanBolum(t, o.bolum, ek);
    const aciklama = yazi(o.aciklama, 300) || (bolum ? bolum.ad : "");
    if (!bolum) { atilan++; return; }
    if (o.tur === "degistir") {
      const hedef = t.bolumler.find((b) => b.id === o.hedef);
      if (!hedef || !degisebilir(hedef) || hedef.blok !== bolum.blok) { atilan++; return; }
      oneriler.push({ id: `o${n + 1}`, tur: "degistir", hedef: hedef.id, aciklama, bolum });
    } else if (o.tur === "ekle") {
      if (bolum.blok === "cihaz") { atilan++; return; }
      const sonra = typeof o.sonra === "string" && t.bolumler.some((b) => b.id === o.sonra) ? o.sonra : null;
      oneriler.push({ id: `o${n + 1}`, tur: "ekle", sonra, aciklama, bolum });
    } else atilan++;
  });
  return { oneriler, atilan };
}

/** "ekle" önerisinin şimdiki taslaktaki yeri (yeni bölümün t.bolumler'deki yeri): verilen bölümden sonra; yoksa kusur / sonuç / imzadan önce */
export function oneriYeri(t: FormatTanimi, o: Extract<Oneri, { tur: "ekle" }>): number {
  const i = o.sonra ? t.bolumler.findIndex((b) => b.id === o.sonra) : -1;
  if (i >= 0) return i + 1;
  const son = t.bolumler.findIndex((b) => b.blok === "kusur" || b.blok === "sonuc" || b.blok === "imza");
  return son >= 0 ? son : t.bolumler.length;
}

/** "Ekle": öneri p. yere — kimlikler şimdiki taslağa göre yeniden; tanım şemadan geçmezse null */
export function oneriEkle(t: FormatTanimi, o: Extract<Oneri, { tur: "ekle" }>, p: number): { t: FormatTanimi; id: string } | null {
  const x = bolumYerlestir(t, o.bolum, p);
  return FormatTanimi.safeParse(x.t).success ? x : null;
}

/** "Uygula": hedef bölüm önerideki hâline gelir — bölümün kimliği, Bakanlık işareti, üst / alt başlık, doldurma, tablo hesabı / notları / satır
    biçimi, cevap seti, fotoğraf üst sınırı, sonuç metinleri korunur; adı aynı kalan öğe kimliğini ve işaretini korur, yeni öğe yeni kimlik alır.
    Hedef yoksa / değiştirilemezse / tanım şemadan geçmezse null */
export function oneriUygula(t: FormatTanimi, o: Extract<Oneri, { tur: "degistir" }>): FormatTanimi | null {
  const i = t.bolumler.findIndex((b) => b.id === o.hedef);
  const eski = t.bolumler[i];
  if (!eski || !degisebilir(eski) || eski.blok !== o.bolum.blok) return null;
  const ek = new Set<string>();
  const kimlikVer = <T extends { id: string; kilit?: boolean }>(l: readonly T[], ad: (x: T) => string, eskiler: readonly T[], onek: "a" | "m" | "s" | "d"): T[] =>
    l.map((x) => {
      const e = eskiler.find((y) => kucuk(ad(y)) === kucuk(ad(x)));
      if (e && !ek.has(e.id)) { ek.add(e.id); return { ...x, id: e.id, ...(e.kilit !== undefined ? { kilit: e.kilit } : {}) }; }
      const id = yeniKimlik(t, onek, ek); ek.add(id); return { ...x, id };
    });
  const korunan = { id: eski.id, kilit: eski.kilit, ust: eski.ust, alt: eski.alt, numarasiz: eski.numarasiz, doldur: eski.doldur };
  let y: Bolum;
  const b = o.bolum;
  if (b.blok === "bilgi" && eski.blok === "bilgi") y = { ...b, ...korunan, alanlar: kimlikVer(b.alanlar, (a) => a.ad, eski.alanlar, "a") };
  else if (b.blok === "liste" && eski.blok === "liste") {
    const eskiMaddeler = eski.gruplar.flatMap((g) => g.maddeler);
    y = { ...b, ...korunan, cevaplar: eski.cevaplar, gruplar: b.gruplar.map((g) => {
      const eg = eski.gruplar.find((x) => kucuk(x.ad) === kucuk(g.ad)) ?? (b.gruplar.length === 1 && eski.gruplar.length === 1 ? eski.gruplar[0] : undefined);
      const gid = eg && !ek.has(eg.id) ? eg.id : yeniKimlik(t, "g", ek);
      ek.add(gid);
      return { ...g, id: gid, talimat: eg?.talimat, maddeler: kimlikVer(g.maddeler, (m) => m.metin, eskiMaddeler, "m").map((m) => {
        const em = eskiMaddeler.find((x) => x.id === m.id);
        return em ? { ...em, ...m, aciklama: em.aciklama, std: em.std, talimat: em.talimat } : m;
      }) };
    }) };
  } else if (b.blok === "olcum" && eski.blok === "olcum") {
    /* sütun kimlikleri tablo içinde tekil — eskiyle eşleşen eskisini, yeni olan bu tabloda boş kimliği alır */
    const tablo = new Set<string>();
    const sutunlar = b.sutunlar.map((s) => {
      const e = eski.sutunlar.find((x) => kucuk(x.ad) === kucuk(s.ad) && !tablo.has(x.id));
      if (e) { tablo.add(e.id); return { ...e, ...s, id: e.id }; }
      return s;
    }).map((s) => {
      if (tablo.has(s.id) && eski.sutunlar.some((x) => x.id === s.id && kucuk(x.ad) === kucuk(s.ad))) return s;
      let n = 1;
      while (tablo.has(`k_s${n}`) || eski.sutunlar.some((x) => x.id === `k_s${n}`)) n++;
      tablo.add(`k_s${n}`);
      return { ...s, id: `k_s${n}` };
    });
    y = { ...b, ...korunan, satir: eski.satir, hesap: eski.hesap, notlar: eski.notlar, enAz: eski.enAz, sutunlar };
  } else if (b.blok === "test" && eski.blok === "test") y = { ...b, ...korunan, degerler: kimlikVer(b.degerler, (d) => d.ad, eski.degerler, "d") };
  else if (b.blok === "foto" && eski.blok === "foto") y = { ...b, ...korunan, enCok: Math.max(eski.enCok, b.enAz || 1) };
  else if (b.blok === "sonuc" && eski.blok === "sonuc") y = { ...b, ...korunan, cumle: eski.cumle, aciklama: eski.aciklama };
  else y = { ...b, ...korunan } as Bolum;
  const r = Bolum.safeParse(y);
  if (!r.success) return null;
  const yeni = { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? r.data : x)) };
  return FormatTanimi.safeParse(yeni).success ? yeni : null;
}
