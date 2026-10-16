/* SAHA RAPORUNUN SAYFALARI — saf (React'siz; kilit tests/sayfa.test.ts, olumsuz kanıt tests/bozan/sayfa.bozan.ts). 2026-10-16 (reisim: "herhangi
   bir tabloda 20 den sonrası sayfalı olacak … herhangi bir liste tablo, ekranda çok fazla veri olunca ekran kasacağı için 20 den fazlası sayfalı olsun
   diğer sayfalara doğru aksın"; pkproje §9 2026-10-15 "S.A.Y CLAUDE GİBİ" (3)). Ölçüm tabloları ve kontrol listesi maddeleri 20'şer sayfalı; ekranda
   yalnız açık sayfanın satırları var. Hangi sayfanın açılacağına rapor ekranı (SahaRaporu) karar verir, tek kuralla:
   · tablo değişince (Satır ekle, Son satırı kopyala, Excel'den yükle, S.A.Y'ın yazdığı / eklediği satır, satır silme, Geri al, cihazda bekleyen
     kaydın yüklenmesi) tablonun İLK DEĞİŞEN satırının sayfası açılır — eklenen satır kendi sayfasında, silmede boş sayfada kalınmaz (sayfa sayısıyla
     sınırlanır), yazılan değer görünür;
   · Onaya gönder'in eksiği (506) ve S.A.Y'ın işaretlediği kontrol maddesi: bölüm başına EN ÜSTTEKİ yerin sayfası.
   Alan anahtarları motorunki (format/motor.ts): tablo hücresi satirAnahtari "<bölüm>#<sıra>.<sütun>" (sıra 0'dan), madde kimliği, "<madde>.not",
   "<madde>.derece", "<madde>.foto". */
import { satirSayfasi, TABLO_SAYFA } from "../../components/liste/sayfa.ts";
import type { Cevaplar, FormatTanimi } from "../../format/tanim.ts";

/** sayfalı bölümde yer: bölüm ve satırın / maddenin bölüm içi genel sırası (0'dan) */
export interface SayfaYeri { bolum: string; satir: number }

/** alan anahtarı bir tablo hücresiyse bölümü ve satırın genel sırası (0'dan); değilse null */
export function satirYeri(alan: string): SayfaYeri | null {
  const m = /^([^#.]+)#(\d+)\.[^#]+$/.exec(alan);
  return m ? { bolum: m[1], satir: Number(m[2]) } : null;
}

/** kontrol listesi maddelerinin yeri: madde kimliği → bölümü ve grupları boyunca genel sırası (0'dan; sayfa 20 madde) */
export function maddeSiralari(t: Pick<FormatTanimi, "bolumler">): Map<string, SayfaYeri> {
  const l = new Map<string, SayfaYeri>();
  for (const b of t.bolumler) {
    if (b.blok !== "liste") continue;
    let i = 0;
    for (const g of b.gruplar) for (const m of g.maddeler) l.set(m.id, { bolum: b.id, satir: i++ });
  }
  return l;
}

/** alan anahtarının sayfalı yeri — tablo hücresi ya da kontrol maddesi (cevabı, kusur açıklaması, derecesi, fotoğrafı); öteki alanlar null */
export function alanYeri(alan: string, maddeler: ReadonlyMap<string, SayfaYeri>): SayfaYeri | null {
  return satirYeri(alan) ?? maddeler.get(alan) ?? maddeler.get(alan.replace(/\.(not|derece|foto)$/, "")) ?? null;
}

/** bölüm başına açılacak sayfa: o bölümdeki EN ÜSTTEKİ (en küçük sıralı) yerin sayfası */
export function hedefSayfalari(yerler: readonly SayfaYeri[], boy: number = TABLO_SAYFA): Record<string, number> {
  const ilk: Record<string, number> = {};
  for (const y of yerler) if (!(y.bolum in ilk) || y.satir < ilk[y.bolum]) ilk[y.bolum] = y.satir;
  return Object.fromEntries(Object.entries(ilk).map(([b, i]) => [b, satirSayfasi(i, boy)]));
}

type Satir = Readonly<Record<string, string>>;
/** satır değerce aynı mı (nesne kimliği değil — cihazdaki kayıt yüklenince, geri alınınca satırlar yeni nesne olur) */
function ayniSatir(a: Satir | undefined, b: Satir | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

/** tablo başına İLK değişen satırın sırası (0'dan): eklenen, silinen ya da değeri değişen ilk satır; değişmeyen tablo listede yok */
export function ilkDegisenSatirlar(once: Cevaplar["tablo"], simdi: Cevaplar["tablo"]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const b of new Set([...Object.keys(once), ...Object.keys(simdi)])) {
    const a = once[b] ?? [], y = simdi[b] ?? [];
    if (a === y) continue;
    for (let i = 0; i < Math.max(a.length, y.length); i++) {
      if (i >= a.length || i >= y.length || !ayniSatir(a[i], y[i])) { r[b] = i; break; }
    }
  }
  return r;
}

/** açık sayfalara yenilerini yazar; hiçbiri değişmiyorsa AYNI nesne (durum değişmesin — yazarken her tuşta yeniden çizim olmasın) */
export function sayfalariYaz(s: Readonly<Record<string, number>>, yeni: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  const l = Object.entries(yeni).filter(([b, n]) => s[b] !== n);
  return l.length ? { ...s, ...Object.fromEntries(l) } : s;
}

export interface GrupDilimi<G extends { maddeler: readonly unknown[] }> { g: G; gi: number; maddeler: { m: G["maddeler"][number]; mi: number }[] }
/** kontrol listesinin sayfadaki parçası: genel sırası [bas, son) olan maddeler gruplarıyla — grup sayfaya taşıyorsa başlığı o sayfada da yazılır;
    madde numarası genel kalır (gi: grubun sırası, mi: grup içi sırası). Maddesiz grup, yerinin düştüğü sayfada (sondaysa son sayfada) */
export function maddeDilimi<G extends { maddeler: readonly unknown[] }>(gruplar: readonly G[], bas: number, son: number): GrupDilimi<G>[] {
  const toplam = gruplar.reduce((n, g) => n + g.maddeler.length, 0);
  const r: GrupDilimi<G>[] = [];
  let i = 0;
  gruplar.forEach((g, gi) => {
    const gb = i, gs = i + g.maddeler.length;
    i = gs;
    if (!g.maddeler.length) {
      if (gb >= bas && (gb < son || (son === toplam && gb === toplam))) r.push({ g, gi, maddeler: [] });
      return;
    }
    if (gs <= bas || gb >= son) return;
    const ilk = Math.max(bas, gb) - gb;
    r.push({ g, gi, maddeler: g.maddeler.slice(ilk, Math.min(son, gs) - gb).map((m: G["maddeler"][number], k) => ({ m, mi: ilk + k })) });
  });
  return r;
}
