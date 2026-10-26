/* RAPOR KÜNYESİ (492; reisim 2026-10-11, hata listesi 9: "kayıttan geliyor diye değiştirilemez olmasın kayıttan gelenlerde değiştirilebilir
   olsun sadece sgk no ve isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun") — saf. Künye plandan / kayıttan gelir
   ve raporun kendi kopyasında durur (rapor.kunye); denetçinin değiştirdiği bilgi cevaplar.kunye'de (kayıt değişmez). Formatın gorunum.kilitli
   listesindeki bilgi sahada değişmez: ekranda girdi yok, sunucu reddeder. Saha ekranı, belge (PDF) ve sunucu aynı işlevlerden okur. */
import { KUNYE_ALAN_ADI, KUNYE_ALANLARI, VARSAYILAN_KILITLI, type Cevaplar, type FormatTanimi, type KunyeAlani } from "./tanim.ts";

/** raporun künye kopyası (ekrandaki biçim) */
export interface KunyeKopyasi { firmaAdi: string; adres: string | null; sgk: string | null; isgNo: string | null; eposta?: string | null; tel?: string | null }
/** raporda geçerli künye; metot boş olabilir (belgede "-") */
export type GecerliKunye = { firma: string; metot: string } & Record<Exclude<KunyeAlani, "firma" | "metot">, string | null>;
type KunyeDegisikligi = Cevaplar["kunye"];

/** formatta sahada kilitli künye bilgileri (verilmemişse SGK ve İSG-KATİP). 2026-10-26 (reisim: "başka rapor formatı ekleyince firma bilgileri kısmı
    değiştirilemez dediğimiz için böyle sıçıyor, değiştirilebilir olsun"): firmanın kendi (serbest düzen — basılı formdan) formatında verilmemişse
    hiçbiri kilitli değil; Bakanlık düzenindeki formatlar aynı */
export const kilitliKunye = (t: Pick<FormatTanimi, "gorunum">): ReadonlySet<KunyeAlani> =>
  new Set(t.gorunum.kilitli ?? (t.gorunum.serbest ? [] : VARSAYILAN_KILITLI));

/** kayıttaki metot ve kapsam: formatın dayanağı + türün kontrol metodu standartları (belgedeki satır) */
export const metotMetni = (t: Pick<FormatTanimi, "gorunum">, kontrolStd: readonly string[]) => [...t.gorunum.dayanak, ...kontrolStd].join(" · ");

/** kaydın (raporun kopyasının) künyesi */
export function kayitKunyesi(k: KunyeKopyasi, metot: string): GecerliKunye {
  return { firma: k.firmaAdi, adres: k.adres ?? null, sgk: k.sgk ?? null, isg: k.isgNo ?? null, eposta: k.eposta ?? null, tel: k.tel ?? null, metot };
}

/** geçerli künye: denetçinin değiştirdiği (kilitli değilse) yoksa kayıttaki. Boş yazılan bilgi boştur (firma adı boş olamaz — şema). */
export function gecerliKunye(k: KunyeKopyasi, metot: string, d: KunyeDegisikligi, kilitli: ReadonlySet<KunyeAlani>): GecerliKunye {
  const x = kayitKunyesi(k, metot);
  for (const a of KUNYE_ALANLARI) {
    const v = d[a];
    if (v === undefined || kilitli.has(a)) continue;
    if (a === "firma" || a === "metot") x[a] = v;
    else x[a] = v || null;
  }
  return x;
}

/** sunucu: kilitli bilgiye yazılan değişiklik — ekranda girdisi yok, gelen istek elle kurulmuş; yazılmaz (alan hatası) */
export function kunyeKilitHatalari(t: Pick<FormatTanimi, "gorunum">, d: KunyeDegisikligi): Record<string, string> {
  const k = kilitliKunye(t), h: Record<string, string> = {};
  for (const a of KUNYE_ALANLARI) if (d[a] !== undefined && k.has(a)) h[`cevaplar.kunye.${a}`] = `${KUNYE_ALAN_ADI[a]} bu formatta sahada değiştirilmez.`;
  return h;
}

/** formatın kilitli bilgilerinin değişikliği düşer (rapor yeni format sürümüne geçince — yeni sürümde kilitlenen bilgi kayıttakine döner) */
export function kunyeKilitTemizle(d: KunyeDegisikligi, t: Pick<FormatTanimi, "gorunum">): KunyeDegisikligi {
  const k = kilitliKunye(t);
  return Object.fromEntries(Object.entries(d).filter(([a, v]) => v !== undefined && !k.has(a as KunyeAlani))) as KunyeDegisikligi;
}

/** planlamacının yeni künyesi rapora geçince ("Güncelle"): DEĞİŞEN bilgide denetçinin değişikliği düşer — yeni kayıt görünür; değişmeyende kalır */
export function kunyeFarkTemizle(d: KunyeDegisikligi, eski: KunyeKopyasi, yeni: KunyeKopyasi): KunyeDegisikligi {
  const degisen = new Set<KunyeAlani>();
  if (eski.firmaAdi !== yeni.firmaAdi) degisen.add("firma");
  if ((eski.adres ?? null) !== (yeni.adres ?? null)) degisen.add("adres");
  if ((eski.sgk ?? null) !== (yeni.sgk ?? null)) degisen.add("sgk");
  if ((eski.isgNo ?? null) !== (yeni.isgNo ?? null)) degisen.add("isg");
  return Object.fromEntries(Object.entries(d).filter(([a, v]) => v !== undefined && !degisen.has(a as KunyeAlani))) as KunyeDegisikligi;
}
