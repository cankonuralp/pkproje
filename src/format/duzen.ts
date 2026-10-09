/* RAPOR DÜZENİ — belgenin (src/belge/belge.ts) ve saha ekranının (raporlar/ui/SahaRaporu.tsx) ORTAK bölüm düzeni ve numaraları (427). Önce iki
   yerde ayrı yazılıydı. Saf; tanımdan hesaplanır.
   · 1 Firma bilgileri ve 2 ekipman bölümü sabittir. Formatın ekipman bilgi bölümü (kimliği "ekipman" ya da adında "ekipman" geçen, elle
     sorulan alanı olan bilgi bölümü) 2. bölüme katılır; 2. bölümün BAŞLIĞI o bölümün adıdır (ZPKR04 "Tesis bilgileri"), yoksa
     "Ekipman bilgileri". Yalnız kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyasıdır, çizilmez.
   · Formatta cihaz bölümü yoksa ve rapora cihaz eklendiyse 3 "Ölçüm cihazları" sabit bölümü araya girer.
   · Numaralar: üst başlığı (ust) aynı olan ARDIŞIK bölümler tek numaranın altında N.1, N.2 … (Bakanlık: "Ana başlıklar ve sıralamaları
     değişmeyecek" — ZPKR04 5.1 / 5.2); numarasız bölüm numara almaz (ZPKR04 "Fotoğraflar"), sonrakilerin numarası kaymaz.
   · 461: alt başlık (alt) — üstündeki ANA bölümün (numaralı, üst başlıksız, kendisi alt olmayan) altında N.1, N.2 …; ana bölüm yoksa (ilk
     bölüm, numarasız bölümden sonra, üst başlıklı grubun ardından) alt bayrağı yok sayılır, bölüm ana numarasını alır.
   · 460: "tam" ekipman bölümü varsa 2. bölüme YALNIZ o katılır ve 2. bölümde ekipman kodu ve türü dışında sabit satır yoktur (marka, model …
     onun ekipman kaydına bağlı alanlarıdır). Tam bölümsüz eski formatta 2. bölümün sabit satırları: kod, tür ve formatın aynı adlı alanı
     olmayan marka, model, seri no, imal yılı, kullanım yeri, kullanım amacı (sabitEkipmanAlanlari) — belge ve saha ekranı aynı listeden. */
import { EKIPMAN_ALAN_ADI, type Bolum, type BolumOf, type EkipmanAlani, type FormatTanimi } from "./tanim.ts";

const kucuk = (s: string) => s.toLocaleLowerCase("tr");

export interface DuzenBolumu {
  b: Bolum;
  /** "5" · "5.1" · null (numarasız) */
  no: string | null;
  /** üst başlığın ilk alt bölümünde: üst başlığın numarası ve adı (önce o başlık çizilir) */
  ust: { no: string; ad: string } | null;
}
/** sonraki: formatta imza bölümü yoksa en sona eklenen "Yetkili kişi" bölümünün numarası */
/** tam: formatın tam ekipman bölümü (460) — varsa katilan yalnız odur */
export interface RaporDuzeni { ekipmanBaslik: string; katilan: BolumOf<"bilgi">[]; tam: BolumOf<"bilgi"> | null; cihazNo: string | null; bolumler: DuzenBolumu[]; sonraki: string }

export const ekipmanBolumuMu = (b: Bolum): b is BolumOf<"bilgi"> =>
  b.blok === "bilgi" && (!!b.tam || ((b.id === "ekipman" || kucuk(b.ad).includes("ekipman")) && b.alanlar.some((a) => !a.kaynak)));

/** yalnız kayıttan gelen alanlı bilgi bölümü = 1 · Firma bilgileri'nin kopyası: çizilmez; 447: Format kurucuda SABİT (her formatta aynı, düzenlenmez) */
export const kayittanBolumMu = (b: Bolum): b is BolumOf<"bilgi"> => b.blok === "bilgi" && !b.tam && b.alanlar.length > 0 && b.alanlar.every((a) => a.kaynak);

export const tamBolum = (t: FormatTanimi): BolumOf<"bilgi"> | null => (t.bolumler.find((b) => b.blok === "bilgi" && b.tam) as BolumOf<"bilgi"> | undefined) ?? null;

/* eski formatın 2. bölümdeki sabit satırları: formatta aynı adlı (elle sorulan) alan varsa o satır çizilmez */
const ESKI_SABIT: readonly (readonly [EkipmanAlani, string])[] = [
  ["marka", "marka"], ["model", "model"], ["seri", "seri no"], ["imal", "imal"], ["konum", "kullanım yeri"], ["amac", "kullanım amacı"],
];
/** 2. bölümün kayıttan başlayan sabit satırları (eski format); tam ekipman bölümlü formatta yok */
export function sabitEkipmanAlanlari(t: FormatTanimi): EkipmanAlani[] {
  if (tamBolum(t)) return [];
  const adlar = t.bolumler.flatMap((b) => (b.blok === "bilgi" ? b.alanlar.filter((a) => !a.kaynak).map((a) => kucuk(a.ad)) : []));
  return ESKI_SABIT.filter(([, x]) => !adlar.some((ad) => ad.includes(x))).map(([k]) => k);
}

/* 2. bölümde zaten sabit satırı olan (kod, tür) ya da ekipman kaydına bağlı alanla aynı (seri no, kullanım yeri) kayıttan alanlar */
const EKIPMAN_KAYNAK = new Set(["ekipman_kodu", "ekipman_adi", "seri_no", "kullanim_yeri"]);

/** 460: eski formatı tam ekipman bölümlüye çevirir — Format kurucu açılırken. Belgenin satırları ve sırası aynı kalır: eski sabit satırlar
    (sabitEkipmanAlanlari) ekipman kaydına bağlı alan olur, ardından "Ekipman bölümü", sonra formatın kendi ekipman alanları. 2. bölümde sabit
    satırı olan kayıttan alanlar (kod, tür, seri no, kullanım yeri) kilitli değilse çıkar. Ekipman bölümü yoksa 1. bölümün kopyasından sonra açılır. */
export function ekipmanTamYap(t: FormatTanimi): FormatTanimi {
  if (tamBolum(t)) return t;
  const kimlikler = new Set(t.bolumler.flatMap((b) => [b.id, ...(b.blok === "bilgi" ? b.alanlar.map((a) => a.id) : [])]));
  const tekil = (on: string) => { let id = on; for (let n = 2; kimlikler.has(id); n++) id = `${on}${n}`; kimlikler.add(id); return id; };
  const bagli = (k: EkipmanAlani) => ({ id: tekil(`e_${k}`), ad: EKIPMAN_ALAN_ADI[k], tur: "metin" as const, zorunlu: false, kilit: false, ekipman: k });
  const on = [...sabitEkipmanAlanlari(t).map(bagli), bagli("bolum")];
  /* hedef: formatın ekipman bölümü; yoksa yalnız kayıttan alanlı "Ekipman bilgileri" (boş formatın) */
  const i = t.bolumler.findIndex((b) => ekipmanBolumuMu(b));
  const j = i >= 0 ? i : t.bolumler.findIndex((b) => b.blok === "bilgi" && (b.id === "ekipman" || kucuk(b.ad).includes("ekipman")));
  if (j >= 0) {
    const b = t.bolumler[j] as BolumOf<"bilgi">;
    const kalan = b.alanlar.filter((a) => a.kilit || !a.kaynak || !EKIPMAN_KAYNAK.has(a.kaynak));
    return { ...t, bolumler: t.bolumler.map((x, n) => (n === j ? { ...b, tam: true, alanlar: [...on, ...kalan] } : x)) };
  }
  const yeni: BolumOf<"bilgi"> = { id: tekil("ekipman"), ad: "Ekipman bilgileri", blok: "bilgi", kilit: false, tam: true, alanlar: on };
  const p = t.bolumler.findIndex((b) => kayittanBolumMu(b)) + 1;
  return { ...t, bolumler: [...t.bolumler.slice(0, p), yeni, ...t.bolumler.slice(p)] };
}

/** 459: ölçüm cihazları bölümü SABİT (reisim 2026-10-09: "sabit olan tek şey firma bilgileri, cihazlar ve standartlar") — formatta yoksa Format
    kurucu açılırken 2. bölümden hemen sonra eklenir (3. bölüm; cihazlı raporda belge onu zaten orada basıyordu — raporDuzeni cihazEk). Satırları
    türün ölçüm cihazı türlerinden (tür sayfası), denetçi sahada zimmetindeki cihazı ekler. */
export function cihazBolumuEkle(t: FormatTanimi): FormatTanimi {
  if (t.bolumler.some((b) => b.blok === "cihaz")) return t;
  const ilk = raporDuzeni(t, false).bolumler[0]?.b;
  const p = ilk ? t.bolumler.indexOf(ilk) : t.bolumler.length;
  const kimlikler = new Set(t.bolumler.map((b) => b.id));
  let id = "cihaz";
  for (let n = 2; kimlikler.has(id); n++) id = `cihaz${n}`;
  const yeni: Bolum = { id, ad: "Ölçüm cihazları", blok: "cihaz", kilit: false };
  return { ...t, bolumler: [...t.bolumler.slice(0, p), yeni, ...t.bolumler.slice(p)] };
}
/** Format kurucu açılırken: ekipman bölümü serbest (460), ölçüm cihazları bölümü var (459) */
export const kurucuyaHazirla = (t: FormatTanimi): FormatTanimi => cihazBolumuEkle(ekipmanTamYap(t));

/** cihazEk: formatta cihaz bölümü yok ama rapora cihaz eklendi (sabit "Ölçüm cihazları" bölümü) */
export function raporDuzeni(t: FormatTanimi, cihazEk: boolean): RaporDuzeni {
  const tam = tamBolum(t);
  const katilan = tam ? [tam] : t.bolumler.filter(ekipmanBolumuMu);
  const kalan = t.bolumler.filter((b) => !katilan.includes(b as BolumOf<"bilgi">) && !kayittanBolumMu(b));
  let n = cihazEk ? 3 : 2, alt = 0, sonUst: string | null = null, anaVar = false;
  const bolumler = kalan.map((b): DuzenBolumu => {
    if (b.numarasiz) { sonUst = null; anaVar = false; return { b, no: null, ust: null }; }
    const ust = b.ust?.trim() || null;
    if (ust && ust === sonUst) { alt++; return { b, no: `${n}.${alt}`, ust: null }; }
    if (!ust && b.alt && anaVar) { alt++; return { b, no: `${n}.${alt}`, ust: null }; }
    n++;
    sonUst = ust;
    anaVar = !ust;
    if (ust) { alt = 1; return { b, no: `${n}.1`, ust: { no: String(n), ad: ust } }; }
    alt = 0;
    return { b, no: String(n), ust: null };
  });
  return { ekipmanBaslik: katilan[0]?.ad || "Ekipman bilgileri", katilan, tam, cihazNo: cihazEk ? "3" : null, bolumler, sonraki: String(n + 1) };
}
