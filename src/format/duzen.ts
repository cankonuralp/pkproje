/* RAPOR DÜZENİ — belgenin (src/belge/belge.ts) ve saha ekranının (raporlar/ui/SahaRaporu.tsx) ORTAK bölüm düzeni ve numaraları (427). Önce iki
   yerde ayrı yazılıydı. Saf; tanımdan hesaplanır.
   · 1 Firma bilgileri ve 2 ekipman bölümü sabittir. Formatın ekipman bilgi bölümü (kimliği "ekipman" ya da adında "ekipman" geçen, elle
     sorulan alanı olan bilgi bölümü) 2. bölüme katılır; 2. bölümün BAŞLIĞI o bölümün adıdır (ZPKR04 "Tesis bilgileri"), yoksa
     "Ekipman bilgileri". Yalnız kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyasıdır, çizilmez.
   · Formatta cihaz bölümü yoksa ve rapora cihaz eklendiyse 3 "Ölçüm cihazları" sabit bölümü araya girer.
   · Numaralar: üst başlığı (ust) aynı olan ARDIŞIK bölümler tek numaranın altında N.1, N.2 … (Bakanlık: "Ana başlıklar ve sıralamaları
     değişmeyecek" — ZPKR04 5.1 / 5.2); numarasız bölüm numara almaz (ZPKR04 "Fotoğraflar"), sonrakilerin numarası kaymaz. */
import type { Bolum, BolumOf, FormatTanimi } from "./tanim.ts";

const kucuk = (s: string) => s.toLocaleLowerCase("tr");

export interface DuzenBolumu {
  b: Bolum;
  /** "5" · "5.1" · null (numarasız) */
  no: string | null;
  /** üst başlığın ilk alt bölümünde: üst başlığın numarası ve adı (önce o başlık çizilir) */
  ust: { no: string; ad: string } | null;
}
/** sonraki: formatta imza bölümü yoksa en sona eklenen "Yetkili kişi" bölümünün numarası */
export interface RaporDuzeni { ekipmanBaslik: string; katilan: BolumOf<"bilgi">[]; cihazNo: string | null; bolumler: DuzenBolumu[]; sonraki: string }

export const ekipmanBolumuMu = (b: Bolum): b is BolumOf<"bilgi"> =>
  b.blok === "bilgi" && (b.id === "ekipman" || kucuk(b.ad).includes("ekipman")) && b.alanlar.some((a) => !a.kaynak);

/** yalnız kayıttan gelen alanlı bilgi bölümü = 1 · Firma bilgileri'nin kopyası: çizilmez; 447: Format kurucuda SABİT (her formatta aynı, düzenlenmez) */
export const kayittanBolumMu = (b: Bolum): b is BolumOf<"bilgi"> => b.blok === "bilgi" && b.alanlar.length > 0 && b.alanlar.every((a) => a.kaynak);

/** cihazEk: formatta cihaz bölümü yok ama rapora cihaz eklendi (sabit "Ölçüm cihazları" bölümü) */
export function raporDuzeni(t: FormatTanimi, cihazEk: boolean): RaporDuzeni {
  const katilan = t.bolumler.filter(ekipmanBolumuMu);
  const kalan = t.bolumler.filter((b) => !katilan.includes(b as BolumOf<"bilgi">) && !kayittanBolumMu(b));
  let n = cihazEk ? 3 : 2, alt = 0, sonUst: string | null = null;
  const bolumler = kalan.map((b): DuzenBolumu => {
    if (b.numarasiz) { sonUst = null; return { b, no: null, ust: null }; }
    const ust = b.ust?.trim() || null;
    if (ust && ust === sonUst) { alt++; return { b, no: `${n}.${alt}`, ust: null }; }
    n++;
    sonUst = ust;
    if (ust) { alt = 1; return { b, no: `${n}.1`, ust: { no: String(n), ad: ust } }; }
    return { b, no: String(n), ust: null };
  });
  return { ekipmanBaslik: katilan[0]?.ad || "Ekipman bilgileri", katilan, cihazNo: cihazEk ? "3" : null, bolumler, sonraki: String(n + 1) };
}
