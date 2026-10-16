/* ══ GÖÇ DAĞITICI — YAYIN KAPISI (FIRMA-VT §5.5, §7.3; FV4, 2026-10-15) ═══════════════════════════════════════════════════════════════════
   Vercel derleme adımı (vercel.json buildCommand: "node scripts/goc-dagit.ts --zorunlu && node scripts/next.ts build" — betik yalnız bunu çağırır):
   derlenecek kodun beklediği göç (son-goc.ts SON_GOC + GOC_SAYISI) merkezde ve her kendi projeli firmanın veritabanında uygulanmış mı. Değilse çıkış
   kodu 1 → derleme durur, yayın olmaz ("önce göç, sonra kod" — bugünkü elle akışın da kapısı: Supabase'e göç unutulursa main yayınlanmaz).
   Kip PROBATA_GOC_DAGIT: boş ya da "denetle" (varsayılan) — yalnız tanı; "uygula" (FV8, 2026-10-16) — göçleri Supabase Yönetim API'siyle uygular
   (src/server/db/goc-uygula.ts: kilit, önce hepsinde özet denetimi, sırayla uygulama, sonunda bu dosyanın salt okunur denetimi; yazan her şey orada —
   bu dosya salt okunur kalır); Yönetim API anahtarı (PROBATA_SUPABASE_YONETIM_ANAHTARI) yoksa / uç yerel değilse 1. Başka kip değeri hata. Kip ve
   anahtar, veritabanı ayarından ÖNCE denetlenir (ayarsız derlemede "uygula" sessizce "atlandı" olmasın).
   denetle:
   · merkez: ortamdaki bağlantı (havuz.ts ortamdanBaglanti — PROBATA_VT_*; şifresiz ağ bağlantısı yok), uygulama rolü; merkez.ts merkezOku (READ ONLY,
     vt_merkez_dogrula — ortam bir firma veritabanını gösteriyorsa red) içinde saglik_denetimi(). Merkeze ulaşılamazsa ya da merkez reddederse 1;
   · hedefler: goc_hedefleri() (0096; EXECUTE yalnız yönetim rolünde) yöneticisiz yönetim işleminde (kiraci.ts yonetimIcinde — 0050 uygulama rolü
     yönetim rolüne geçer; işlem READ ONLY'ye çevrilir). "Bakımdaki" (göç dışı) firma listede yok: yayını durdurmaz (FIRMA-VT §8 açık soru 1, FV13) —
     aynı işlemde yalnız SAYISI okunur ve yazılır (bakımdan çıkan firma o an çözülür; çıkarmadan önce göçü tutmalı — FIRMA-VT §6.1 FV13);
   · kurulumu bitmemiş firma (firma_kurulum.durum ≠ 'tamam' ya da kaydı yok) ATLANIR ve sayılır: uygulama rolünün parolası / havuzcu adresi kurulumun
     'rol' / 'havuzcu' adımlarında yazılır, o firma henüz çözülmez (firma_coz — kod ona gitmez); göçünü kurulumun 'goc' adımı yapar (FV10'a devir:
     kurulum bitmeden son göçü kodun beklediğiyle karşılaştırır — FIRMA-VT §6.1). Dondurulmuş firma DENETLENİR (etkinleştirilince hemen çözülür);
   · kurulu her firmaya UYGULAMA rolüyle (baglanti.ts kayittanBaglanti: izin listesi, TLS + kilitli kök, yalnız uygulama rolü, yerel adres yalnız merkez
     de yereldeyse — parola ana anahtarla (ortamın PROBATA_SIR_ANAHTARI; sir.ts'in process.env varsayılanına DÜŞMEZ) yalnız burada, bellekte çözülür)
     kiraciIcinde (vt_firma_dogrula: kayıt başka veritabanını gösteriyorsa YANLIŞ veritabanının göçü karşılaştırılmaz, 42501) + READ ONLY içinde
     saglik_denetimi(). En çok 4 firma aynı anda; firma başına tek bağlantı;
   · ulaşılamayan ya da reddeden firma = 1 (atlanmaz — kapalı yön; çaresi yönetimin "bakımda" işareti).
   SÜRELER: bağlanma 5 sn (havuzSecenekleri); sorgu sunucuda 15 sn (uygulama rolünün statement_timeout'u, 0009), istemcide 20 sn (query_timeout — ağ
   asılırsa; pg gönderilmiş sorguyu iptal etmez, ardındaki geri alma da 20 sn'ye kadar bekleyebilir). Geçici hata (57P01, 57P03, 53300, ECONNRESET,
   ETIMEDOUT, bağlanma / sorgu zaman aşımı, kopan bağlantı) merkezde ve her firmada 2,5 sn sonra BİR KEZ yeniden denenir; kalıcı sonuç (parola, yetki,
   eksik işlev, göç farkı) denenmez. Bütün denetim en çok 120 sn (GOC_DAGIT.toplamMs): dolarsa 1, arkada süren işin satırı yazılmaz (betik 2 sn
   sonra süreci kapatır).
   ZORUNLU: Vercel derleme komutu "--zorunlu" verir. Ortamda veritabanı ayarı yoksa (PROBATA_VT_SUNUCU / _AD / _KULLANICI / _PAROLA'nın hiçbiri):
   --zorunlu ya da VERCEL varsa 1 — yayın kapısı sessizce açılmaz (Vercel sistem değişkenlerini açmasa da); ikisi de yoksa (CI, yerel derleme)
   "atlandı" yazılır, 0. Ayar yarımsa ya da geçersizse her yerde 1. Bilinmeyen bağımsız değişken 1.
   YAZMAZ (salt okunur; işlemler veritabanında READ ONLY): firma_vt.son_goc / goc_sayisi'ni yönetim rolü yazabilir (0096) ama denetlemede yazılmaz —
   bu adım her derlemede koşar (sonradan düşen, yarıda kesilen derlemede de); merkezdeki "son göç" UYGULANAN göçün kaydıdır (FV8 uygula, sonundaki
   yeniden denetimle yazar), yoklama sonucu sağlığın işi (FV7, son_saglik). Derleme adımının merkezde iz bırakmaması da güvenlik kazancı.
   Çıktı kısa ve SIRSIZ: adıyla YALNIZ sorunlu firma (uyumsuz, ulaşılamadı, reddetti — yapılacak iş onda); güncel, kurulumdaki ve bakımdaki firmalar
   yalnız sayıyla (derleme günlüğü firma listesi olmasın — FIRMA-VT §5.5); beklenen / bulunan göç, sınıflanmış neden (hata kodu); veritabanının hata
   iletisi, sunucu, parola, şifreli metin, ana anahtar YAZILMAZ (nedenMetni / kayitNedeni iletiyi yazmaz, yalnız sınıflar). Bu modül fırlatmaz: her
   hata satır + çıkış kodu.
   Kilit: tests/goc-dagit.test.ts (PostgreSQL: merkez + iki kendi projeli firma, iki küme; betik alt süreçte) · tests/goc-dagit-saf.test.ts (kip,
   ortam, zorunlu, neden, yeniden deneme, süre sınırı, karşılaştırma, betik alt süreçte, vercel.json) · olumsuz kanıt tests/bozan/goc-dagit.bozan.ts,
   tests/bozan/goc-dagit-saf.bozan.ts. */
import pg from "pg";
import { anaAnahtar } from "../ayar/sir.ts";
/* "uygula" kipinin kodu (Yönetim API istemcisi, yazan kısım) YALNIZ o kipte yüklenir (await import): bu dosyanın saf yardımcılarını sağlık modülü de
   içe aktarır — uygulamanın paketine istemci ve göç yazımı statik girmez (kilit tests/yonetim-anahtari.test.ts) */
import type { SupabaseYonetimi } from "../dis/supabase-yonetim.ts";
import { kayittanBaglanti, merkezYerelMi, type FirmaVtKaydi } from "./baglanti.ts";
import { GOC_KLASORU, gocDosyalari } from "./goc.ts";
import type { DenetimSonucu } from "./goc-uygula.ts";
import { ortamdanBaglanti } from "./havuz.ts";
import { havuzHatasiniDinle, havuzSecenekleri, kiraciIcinde, yonetimIcinde, type Havuz, type UygulamaBaglantisi } from "./kiraci.ts";
import { merkezOku } from "./merkez.ts";
import { GOC_SAYISI, SON_GOC } from "./son-goc.ts";

export type Ortam = Record<string, string | undefined>;
export type GocKipi = "denetle" | "uygula";
export interface Beklenen { son: string; sayi: number }

/** aynı anda denetlenen firma · sorgunun istemci süre sınırı · geçici hatada yeniden denemeden önce bekleme · bütün denetimin üst sınırı (ms) */
export const GOC_DAGIT = { ayniAnda: 4, sorguMs: 20_000, yenidenMs: 2_500, toplamMs: 120_000 } as const;

/** PROBATA_GOC_DAGIT: boş / "denetle" → denetle, "uygula" → uygula (FV8), başka değer HATA (değer iletide yazılmaz) */
export function kipOku(e: Ortam): GocKipi {
  const k = e.PROBATA_GOC_DAGIT ?? "";
  if (k === "" || k === "denetle") return "denetle";
  if (k === "uygula") return "uygula";
  throw new Error("PROBATA_GOC_DAGIT yalnız boş, 'denetle' ya da 'uygula' olabilir.");
}

/** betiğin bağımsız değişkenleri: yok ya da yalnız "--zorunlu" (Vercel derleme komutu) — başka her şey HATA (değer iletide yazılmaz) */
export function argumanOku(arg: readonly string[]): { zorunlu: boolean } {
  if (arg.length === 0) return { zorunlu: false };
  if (arg.length === 1 && arg[0] === "--zorunlu") return { zorunlu: true };
  throw new Error("Göç dağıtıcı yalnız '--zorunlu' bağımsız değişkenini alır.");
}

const VT_AYARI = ["PROBATA_VT_SUNUCU", "PROBATA_VT_AD", "PROBATA_VT_KULLANICI", "PROBATA_VT_PAROLA"] as const;
/** ortamda veritabanı ayarından HİÇBİRİ yok (CI, yerel derleme) — yarım ayar "yok" sayılmaz (ortamdanBaglanti reddeder) */
export const vtAyariYok = (e: Ortam): boolean => VT_AYARI.every((ad) => !e[ad]);
/** Vercel derlemesi mi (Vercel sistem değişkenlerini açıkken VERCEL=1 verir; açmasa da derleme komutu --zorunlu verir) */
export const vercelde = (e: Ortam): boolean => !!e.VERCEL;

/** ana anahtar YALNIZ verilen ortamdan: yoksa boş metin — sir.ts anaAnahtar'ın varsayılanı (process.env) devreye girmez (ortam tek kaynak) */
export const anahtarOku = (e: Ortam): Buffer => anaAnahtar(e.PROBATA_SIR_ANAHTARI ?? "");

/** FV8: merkezin Supabase projesi — havuzcu kullanıcısından ("probata_uygulama.<ref>"); ref'siz (yerel) merkez yalnız yerel Yönetim API taklidiyle
    ("yerel-merkez"); yoksa HATA */
export function merkezProjesi(e: Ortam, yerelApi: boolean): string {
  const m = /^probata_uygulama\.([a-z0-9]{20})$/.exec(e.PROBATA_VT_KULLANICI ?? "");
  if (m) return m[1]!;
  if (yerelApi) return "yerel-merkez";
  throw new Error("Merkezin proje kimliği bulunamadı (PROBATA_VT_KULLANICI 'probata_uygulama.<ref>' biçiminde olmalı).");
}

/* ── sonuç ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** saglik_denetimi()'nin göç alanları (sayı jsonb'den sayı gelir; metin gelse de sayıya çevrilir — saglik.ts saglikDegerlendir ile aynı) */
export interface GocDurumu { son_goc: string | null; goc_sayisi: number | string }

export type HedefSonucu =
  | { ad: string; durum: "guncel" }
  | { ad: string; durum: "uyumsuz"; bulunan: { son: string | null; sayi: number } }
  | { ad: string; durum: "ulasilamadi"; neden: string }
  | { ad: string; durum: "reddedildi"; neden: string }
  | { ad: string; durum: "atlandi"; neden: string };

/** yayını durduran sonuç */
export const sorunluMu = (s: HedefSonucu): boolean => s.durum === "uyumsuz" || s.durum === "ulasilamadi" || s.durum === "reddedildi";

/** son göç VE göç sayısı kodun beklediğiyle AYNI mı (354: arada atlanmış göç son göçün adıyla yakalanmaz; ileride olan veritabanı da uyumsuz) */
export function karsilastir(ad: string, v: GocDurumu, beklenen: Beklenen = { son: SON_GOC, sayi: GOC_SAYISI }): HedefSonucu {
  const sayi = Number(v.goc_sayisi);
  if (v.son_goc === beklenen.son && sayi === beklenen.sayi) return { ad, durum: "guncel" };
  return { ad, durum: "uyumsuz", bulunan: { son: v.son_goc, sayi } };
}

/* ── nedenler (SIRSIZ: hata iletisi yazılmaz, yalnız sınıf + kod) ───────────────────────────────────────────────────────────────────── */
const KOD_NEDENI: Readonly<Record<string, string>> = {
  "28P01": "parola reddedildi",
  "28000": "rol / kullanıcı tanınmadı",
  "42501": "yetki reddi — yanlış veritabanı ya da eksik hak",
  "3D000": "veritabanı yok",
  "42883": "işlev yok — göçler eksik",
  "42P01": "tablo yok — göçler eksik",
  "57014": "sorgu zaman aşımı",
  "57P01": "sunucu kapanıyor",
  "57P03": "sunucu henüz hazır değil",
  "53300": "bağlantı sınırı dolu",
  ECONNREFUSED: "bağlantı reddedildi",
  ECONNRESET: "bağlantı koptu",
  ETIMEDOUT: "bağlantı zaman aşımı",
  ENOTFOUND: "sunucu adı çözülemedi",
  EAI_AGAIN: "sunucu adı çözülemedi",
  EHOSTUNREACH: "sunucuya ulaşılamıyor",
  ENETUNREACH: "ağa ulaşılamıyor",
};
const KOD = /^[A-Z0-9_]{2,40}$/;
/** hatanın kodu (yalnız kod biçimindeyse — kod alanına konmuş başka metin kod sayılmaz) */
const hataKodu = (h: unknown): string | undefined => {
  const kod = h && typeof h === "object" ? (h as { code?: unknown }).code : undefined;
  return typeof kod === "string" && KOD.test(kod) ? kod : undefined;
};

/** bağlantı / sorgu hatasının sırsız açıklaması: bilinen kod → açıklama (kod); sertifika, ağ, veritabanı sınıfı; kodsuzda yalnız zaman aşımı /
    kopma ayırt edilir. İleti (sunucu adı, kullanıcı, ayrıntı taşıyabilir) HİÇ yazılmaz. */
export function nedenMetni(h: unknown): string {
  const kod = hataKodu(h);
  if (kod !== undefined) {
    const n = KOD_NEDENI[kod]
      ?? (/CERT|TLS|SSL/.test(kod) ? "sertifika doğrulanamadı" : /^E[A-Z_]+$/.test(kod) ? "ağ hatası" : /^[0-9A-Z]{5}$/.test(kod) ? "veritabanı hatası" : "bağlantı hatası");
    return `${n} (${kod})`;
  }
  const ileti = h instanceof Error ? h.message : "";
  if (/timeout|timed out/i.test(ileti)) return "bağlanma / sorgu zaman aşımı";
  if (/terminated|closed|ended/i.test(ileti)) return "bağlantı koptu";
  return "bağlantı kurulamadı";
}

/** veritabanı bağlantıyı ya da denetimi REDDETTİ mi: SQLSTATE var ve sınıfı bağlantı (08) / kaynak (53) / işletim (57) değil — parola, rol, yetki
    (yanlış veritabanı), eksik işlev / tablo. Değilse ulaşılamadı (ağ, zaman aşımı, sertifika, sunucu kapanıyor). Yalnız teşhis satırını ayırır;
    ikisi de yayını durdurur. Node'un ağ kodları ("EPIPE" gibi beş harfli olanlar da) SQLSTATE sayılmaz. */
export function reddedildiMi(h: unknown): boolean {
  const kod = hataKodu(h);
  return kod !== undefined && /^[0-9A-Z]{5}$/.test(kod) && !/^E[A-Z_]+$/.test(kod) && !/^(08|53|57)/.test(kod);
}
/** hatanın sonucu: reddedildi ya da ulaşılamadı, sırsız nedenle */
export const hataSonucu = (ad: string, h: unknown): HedefSonucu =>
  (reddedildiMi(h) ? { ad, durum: "reddedildi", neden: nedenMetni(h) } : { ad, durum: "ulasilamadi", neden: nedenMetni(h) });

/** GEÇİCİ hata mı (bir anlık havuzcu kopması, sunucu yeniden başlıyor, bağlantı sınırı dolu, zaman aşımı) — bir kez yeniden denenir. Kalıcı olanlar
    (parola, yetki, eksik işlev, bağlantı reddi, sertifika) denenmez: sonuç değişmez, derleme boşuna bekler. */
const GECICI_KOD: ReadonlySet<string> = new Set(["57P01", "57P03", "53300", "ECONNRESET", "ETIMEDOUT"]);
export function geciciMi(h: unknown): boolean {
  const kod = hataKodu(h);
  if (kod !== undefined) return GECICI_KOD.has(kod);
  const ileti = h instanceof Error ? h.message : "";
  return /timeout|timed out|terminated/i.test(ileti);
}

/** iş GEÇİCİ bir hatayla düşerse bekleyip BİR KEZ daha dener; kalıcı hata ve ikinci düşüş yukarı gider */
export async function birKezDaha<T>(is: () => Promise<T>, bekleMs: number = GOC_DAGIT.yenidenMs): Promise<T> {
  try {
    return await is();
  } catch (h) {
    if (!geciciMi(h)) throw h;
    await new Promise((coz) => setTimeout(coz, bekleMs));
    return is();
  }
}

/** bağlantı kaydının kullanılamama nedeni (baglanti.ts kayittanBaglanti'nın denetimleri; şifre çözme) — ileti yazılmaz, yalnız sınıf */
export function kayitNedeni(h: unknown): string {
  const i = h instanceof Error ? h.message : "";
  if (/izin listesinde/.test(i)) return "bağlantı kaydı: sunucu izin listesinde değil";
  if (/yerel adreste/.test(i)) return "bağlantı kaydı: yerel adres (merkez yayında)";
  if (/uygulama rolüyle/.test(i)) return "bağlantı kaydı: kullanıcı uygulama rolü değil";
  if (/\(ref\)/.test(i)) return "bağlantı kaydı: proje kimliği (ref) eksik ya da geçersiz";
  if (/TLS|şifresiz/.test(i)) return "bağlantı kaydı: TLS yok";
  if (/şifreli metin|authenticate|authentication tag|initialization vector|anahtar/i.test(i)) return "bağlantı kaydı: uygulama parolası çözülemedi (ana anahtar ya da ek veri tutmuyor)";
  return "bağlantı kaydı kullanılamadı";
}

/** sonucun çıktı satırı (sırsız); merkez ayrı adla — "merkez" kısa adlı bir firmayla karışmaz */
export function sonucSatiri(s: HedefSonucu, beklenen: Beklenen, merkez = false): string {
  const ad = merkez ? "merkez" : `firma ${s.ad}`;
  switch (s.durum) {
    case "guncel": return `${ad}: güncel`;
    case "uyumsuz": return `${ad}: GÖÇ UYUMSUZ — beklenen ${beklenen.son} / ${beklenen.sayi}, bulunan ${s.bulunan.son ?? "yok"} / ${s.bulunan.sayi}`;
    case "ulasilamadi": return `${ad}: ULAŞILAMADI — ${s.neden}`;
    case "reddedildi": return `${ad}: REDDEDİLDİ — ${s.neden}`;
    case "atlandi": return `${ad}: atlandı — ${s.neden}`;
  }
}

/* ── veritabanı ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** kısa ömürlü havuz: bağlantı ayarı aynen (TLS kökü, 5 sn bağlanma), az bağlantı, sorgu istemcide süre sınırlı */
function havuzAc(ayar: UygulamaBaglantisi, enCok: number): Havuz {
  const h = new pg.Pool({ ...havuzSecenekleri({ ...ayar, enCok }), query_timeout: GOC_DAGIT.sorguMs });
  havuzHatasiniDinle(h);
  return h;
}
const kapat = async (h: Havuz) => { try { await h.end(); } catch { /* kapanış hatası sonucu değiştirmez */ } };

/** goc_hedefleri() satırı (0096) */
interface HedefSatiri {
  firma_id: string; kisa_ad: string; durum: string; ref: string | null; sunucu: string | null; kapi: number | null; vt_ad: string | null;
  kullanici: string | null; parola_sifreli: string | null; surum: number; kurulum_adim: string | null; kurulum_durum: string | null;
}
const HEDEFLER_SQL = `SELECT firma_id::text, kisa_ad, durum, ref, sunucu, kapi, vt_ad, kullanici, parola_sifreli, surum, kurulum_adim, kurulum_durum
  FROM goc_hedefleri()`;
/** bakımdaki (göç dışı) firma SAYISI — yönetim rolünün firma_vt okuma hakkı ve politikası 0096'da; ad okunmaz */
const BAKIMDA_SQL = "SELECT count(*)::int AS n FROM firma_vt WHERE goc_disi";

async function firmaDenetle(h: HedefSatiri, anahtar: Buffer, merkezYerel: boolean, beklenen: Beklenen): Promise<HedefSonucu> {
  const ad = h.kisa_ad;
  if (h.kurulum_durum !== "tamam") {
    const k = h.kurulum_durum === null ? "kurulum kaydı yok" : `adım ${h.kurulum_adim}, durum ${h.kurulum_durum}`;
    return { ad, durum: "atlandi", neden: `kurulumda (${k}); göçünü kurulum yapar, firma henüz açılmaz` };
  }
  if (!h.sunucu || h.kapi === null || !h.vt_ad || !h.kullanici || !h.parola_sifreli) {
    return { ad, durum: "ulasilamadi", neden: "bağlantı kaydı eksik (kurulum tamam ama sunucu / kapı / ad / kullanıcı / parola yok)" };
  }
  const kayit: FirmaVtKaydi = {
    firmaId: h.firma_id, ref: h.ref, sunucu: h.sunucu, kapi: h.kapi, vtAd: h.vt_ad, kullanici: h.kullanici, parolaSifreli: h.parola_sifreli,
    depo: null, surum: h.surum,
  };
  let ayar: UygulamaBaglantisi;
  try { ayar = kayittanBaglanti(kayit, anahtar, { merkezYerel, enCok: 1 }); } catch (x) { return { ad, durum: "ulasilamadi", neden: kayitNedeni(x) }; }
  const havuz = havuzAc(ayar, 1);
  try {
    /* kiraciIcinde: vt_firma_dogrula(firma) ayarla aynı sorguda — kayıt başka firmanın / merkezin veritabanını gösteriyorsa 42501 */
    const v = await birKezDaha(() => kiraciIcinde(havuz, h.firma_id, async (db) => {
      await db.sorgu("SET TRANSACTION READ ONLY");
      return (await db.sorgu<{ s: GocDurumu }>("SELECT saglik_denetimi() AS s")).rows[0]!.s;
    }));
    return karsilastir(ad, v, beklenen);
  } catch (x) {
    return hataSonucu(ad, x);
  } finally {
    await kapat(havuz);
  }
}

/** en çok n iş aynı anda; sonuçlar girdinin sırasıyla */
async function sinirli<T, S>(l: readonly T[], n: number, f: (x: T) => Promise<S>): Promise<S[]> {
  const sonuc = new Array<S>(l.length);
  let i = 0;
  const isci = async () => { while (i < l.length) { const j = i++; sonuc[j] = await f(l[j]!); } };
  await Promise.all(Array.from({ length: Math.min(n, l.length) }, isci));
  return sonuc;
}

export interface GocDagitAyari {
  ortam: Ortam;
  /** betiğin bağımsız değişkenleri (process.argv.slice(2)): yok ya da "--zorunlu" */
  arguman?: readonly string[];
  /** çıktı satırı (betik: console.log) — SIRSIZ */
  yaz: (satir: string) => void;
  /** kodun beklediği (varsayılan son-goc.ts) */
  beklenen?: Beklenen;
  /** bütün denetimin üst sınırı (ms; varsayılan GOC_DAGIT.toplamMs — testler kısaltır) */
  sureMs?: number;
  /** göç dosyalarının klasörü (varsayılan src/server/db/gocler — testler ek göçlü kopya verir; beklenen verilmezse ondan) */
  klasor?: string;
}

/** göç dağıtıcı: çıkış kodu (0 — yayın sürer, 1 — durur). Fırlatmaz. Süre dolarsa 1; arkada süren işin satırları yazılmaz. */
export async function gocDagit(a: GocDagitAyari): Promise<number> {
  let bitti = false;
  const y = (s: string) => { if (!bitti) a.yaz(`[göç dağıtıcı] ${s}`); };
  const sureMs = a.sureMs ?? GOC_DAGIT.toplamMs;
  let doldu = false;
  const beklenen = a.beklenen ?? (a.klasor ? klasorBeklenen(a.klasor) : { son: SON_GOC, sayi: GOC_SAYISI });
  const is = Promise.resolve()
    .then(() => dagit(a.ortam, a.arguman ?? [], y, beklenen, a.klasor ?? GOC_KLASORU, () => doldu || bitti))
    .catch((h: unknown) => { y(`HATA: beklenmeyen hata — ${nedenMetni(h)}`); return 1; });
  let sayac: ReturnType<typeof setTimeout> | undefined;
  const sure = new Promise<number>((coz) => {
    sayac = setTimeout(() => { doldu = true; y(`DURDU: süre doldu (${Math.ceil(sureMs / 1000)} sn) — denetim bitmedi, yayın yapılmaz.`); coz(1); }, sureMs);
  });
  try {
    return await Promise.race([is, sure]);
  } finally {
    bitti = true;
    clearTimeout(sayac);
  }
}

/** klasördeki göçlerden beklenen (son ad, sayı) */
function klasorBeklenen(klasor: string): Beklenen {
  const d = gocDosyalari(klasor);
  return { son: d.at(-1)?.ad ?? "", sayi: d.length };
}

async function dagit(e: Ortam, arg: readonly string[], y: (s: string) => void, beklenen: Beklenen, klasor: string, durdu: () => boolean): Promise<number> {
  let zorunlu: boolean;
  try { ({ zorunlu } = argumanOku(arg)); } catch (h) { y(`HATA: ${(h as Error).message}`); return 1; }
  let kip: GocKipi;
  try { kip = kipOku(e); } catch (h) { y(`HATA: ${(h as Error).message}`); return 1; }
  /* uygula: Yönetim API anahtarı ve ucu veritabanı ayarından ÖNCE (iletiler sabit metin) */
  let api: SupabaseYonetimi | null = null, yerelApi = false;
  if (kip === "uygula") {
    const { supabaseYonetimi, yonetimAyari } = await import("../dis/supabase-yonetim.ts");
    try { const ya = yonetimAyari(e); api = supabaseYonetimi(ya); yerelApi = ya.yerel; } catch (h) {
      y(`HATA: ${(h as Error).message.replace(/\.$/, "")} — 'uygula' kipi göçleri Supabase Yönetim API'siyle uygular.`);
      return 1;
    }
  }
  if (vtAyariYok(e)) {
    if (zorunlu || vercelde(e)) {
      y("HATA: Vercel derlemesinde veritabanı ayarı yok (PROBATA_VT_*) — yayın kapısı denetlenemedi, yayın yapılmaz.");
      return 1;
    }
    y("atlandı: ortamda veritabanı ayarı yok (CI / yerel derleme) — göç denetimi yapılmadı.");
    return 0;
  }
  /* ortamdanBaglanti'nın iletileri sabit metin (değer taşımaz) */
  let ayar: UygulamaBaglantisi;
  try { ayar = ortamdanBaglanti(e); } catch (h) { y(`HATA: ${(h as Error).message}`); return 1; }

  let merkezProje = "";
  if (api) { try { merkezProje = merkezProjesi(e, yerelApi); } catch (h) { y(`HATA: ${(h as Error).message}`); return 1; } }

  const merkez = havuzAc(ayar, 2);
  try {
    if (api) {
      y(`kip: uygula (Supabase Yönetim API'si) · beklenen ${beklenen.son} / ${beklenen.sayi}`);
      const { gocUygula } = await import("./goc-uygula.ts");
      return await gocUygula({
        merkez, api, yerel: yerelApi, merkezProje, dosyalar: gocDosyalari(klasor), beklenen, yaz: y, durdu,
        hedefler: async () => (await hedefOku(merkez)).hedefler
          .map((h) => ({ firmaId: h.firma_id, kisaAd: h.kisa_ad, ref: h.ref, kurulumTamam: h.kurulum_durum === "tamam" })),
        denetle: () => denetim(merkez, e, beklenen, y),
      });
    }
    y(`kip: denetle (salt okunur) · beklenen ${beklenen.son} / ${beklenen.sayi}`);
    return (await denetim(merkez, e, beklenen, y)).kod;
  } finally {
    await kapat(merkez);
  }
}

/** hedefler + bakımdaki firma sayısı — yöneticisiz yönetim işlemi, READ ONLY */
async function hedefOku(merkez: Havuz): Promise<{ hedefler: HedefSatiri[]; bakimda: number }> {
  return birKezDaha(() => yonetimIcinde(merkez, async (db) => {
    await db.sorgu("SET TRANSACTION READ ONLY");
    return { hedefler: (await db.sorgu<HedefSatiri>(HEDEFLER_SQL)).rows, bakimda: (await db.sorgu<{ n: number }>(BAKIMDA_SQL)).rows[0]!.n };
  }));
}

/** SALT OKUNUR DENETİM (denetle kipi; uygula kipinin sonunda da): merkez, hedefler, firmalar — satırları yazar; çıkış kodu + güncel firmalar */
async function denetim(merkez: Havuz, e: Ortam, beklenen: Beklenen, y: (s: string) => void): Promise<DenetimSonucu> {
  const bir = { kod: 1, guncel: [] as string[] };
  {
    /* 1. merkez — merkezOku: READ ONLY + vt_merkez_dogrula (ortam firma veritabanını gösteriyorsa red) */
    let m: HedefSonucu;
    try {
      const v = await birKezDaha(() => merkezOku(merkez, async (db) => (await db.sorgu<{ s: GocDurumu }>("SELECT saglik_denetimi() AS s")).rows[0]!.s));
      m = karsilastir("merkez", v, beklenen);
    } catch (h) {
      m = hataSonucu("merkez", h);
    }
    y(sonucSatiri(m, beklenen, true));
    if (m.durum === "ulasilamadi") { y("DURDU: merkeze ulaşılamadı — yayın yapılmaz."); return bir; }
    if (m.durum === "reddedildi") {
      y("DURDU: merkez denetimi reddetti — ortam (PROBATA_VT_*) merkezi göstermiyor ya da merkezde göçler eksik; yayın yapılmaz.");
      return bir;
    }

    /* 2. hedefler + bakımdaki firma sayısı */
    let hedefler: HedefSatiri[];
    let bakimda: number;
    try {
      ({ hedefler, bakimda } = await hedefOku(merkez));
    } catch (h) {
      y(`HATA: göç hedefleri okunamadı — ${nedenMetni(h)}`);
      return bir;
    }
    if (!hedefler.length) y("denetlenecek kendi projeli firma yok.");

    /* 3. ana anahtar yalnız denetlenecek firma varsa, yalnız verilen ortamdan (ileti sabit metin) */
    let anahtar: Buffer = Buffer.alloc(0);
    if (hedefler.some((h) => h.kurulum_durum === "tamam")) {
      try { anahtar = anahtarOku(e); } catch (h) { y(`HATA: ${(h as Error).message} — firma veritabanlarına bağlanılamaz.`); return bir; }
    }

    /* 4. firmalar — en çok 4 aynı anda; adıyla yalnız sorunlu olanlar (açılış sırasıyla), öteki sonuçlar sayıyla */
    const merkezYerel = merkezYerelMi(e);
    const sonuclar = await sinirli(hedefler, GOC_DAGIT.ayniAnda, (h) =>
      firmaDenetle(h, anahtar, merkezYerel, beklenen).catch((x: unknown): HedefSonucu => hataSonucu(h.kisa_ad, x)));
    for (const s of sonuclar) if (sorunluMu(s)) y(sonucSatiri(s, beklenen));
    if (bakimda) y(`${bakimda} firma bakımda (göç dışı) — denetlenmedi; bakımdan çıkmadan önce göçü kodun beklediğiyle aynı olmalı.`);

    const hepsi = [m, ...sonuclar];
    const sorunlu = hepsi.filter(sorunluMu).length;
    const atlanan = hepsi.filter((s) => s.durum === "atlandi").length;
    const ozet = `${hepsi.length - sorunlu - atlanan} veritabanı güncel${atlanan ? `, ${atlanan} kurulumda (atlandı)` : ""}`;
    if (sorunlu) {
      y(`DURDU: ${sorunlu} veritabanı uyumsuz, ulaşılamadı ya da reddetti (${ozet}) — yayın yapılmaz. Önce göç (Supabase'e goc kaydıyla), sonra kod; `
        + "ulaşılamayan firma için yönetimde \"bakımda\" (göç dışı).");
      return bir;
    }
    y(`TAMAM: ${ozet}.`);
    return { kod: 0, guncel: hedefler.filter((_, i) => sonuclar[i]!.durum === "guncel").map((h) => h.firma_id) };
  }
}
