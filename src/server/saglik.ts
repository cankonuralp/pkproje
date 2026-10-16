/* SAĞLIK (350; 09-G5 duman testi, 06) — /api/saglik ve tools/duman.mjs bunu okur. Her denetim evet / hayır; ayrıntı (tablo adı, sayı) dışarı verilmez.
   · veritabani: bağlanılıp sorgu döndü mü · goc_guncel: veritabanındaki son göç VE göç sayısı kodun beklediği mi (SON_GOC, GOC_SAYISI — 354: arada
     atlanmış göç) · rls: firma_id taşıyan her tabloda RLS açık + zorlanmış + politikalı mı · api_kapali: Supabase API rolleri (anon / authenticated /
     service_role) şemaya giremiyor mu · uygulama_kisitli: BAĞLANAN rol (354: adı sabit rol değil) uygulama rolü ve süper kullanıcı / RLS'yi aşan ya da
     öyle bir rolün üyesi değil mi · isler (383): 1 saatten uzun "çalışıyor"da kalan arka plan işi yok mu. Hepsi doğruysa durum "tamam".
   FIRMA-VT FV7 (2026-10-15, "sağlık her projede"; §5.5):
   · /api/saglik: ilk altı denetim MERKEZİN (bugünkü gibi); yedinci "firma_vt": adres bir firmanınsa O FİRMANIN veritabanı — kiracının havuzu
     (src/server/db/firma-havuzu.ts kiraciHavuzu: ortak firmada merkez, kendi projelide kendi veritabanı), kiracı işleminde vt_firma_dogrula (veritabanı
     kimliği bu firmanın mı) + aynı altı denetim (göç güncel dahil) firmanın veritabanında; hepsi doğruysa doğru. Firma 5 sn'de cevap vermezse yanlış.
     Adres firma değilse (kök, yönetim adresi, bilinmeyen / kapalı firma) denetlenecek firma veritabanı yok → DOĞRU: yanıtın BİÇİMİ adrese göre
     değişmez (yedi anahtar her zaman) — firma listesi ve sayısı bu uçtan okunmaz.
     2026-10-15 (FV7 incelemesi) — iddia daraltıldı: sağlıklı durumda yanıt adrese göre ayırt edilmez; ama firmanın veritabanı düşük ya da göçü
     geride iken o adreste firma_vt=false (merkezin altısı doğru) döner ve bu, adresin kendi veritabanlı bir firma olduğunu ve o anki sorununu ele
     verir (ortak firmanın denetimi merkezde koşar). Firmanın varlığı zaten giriş sayfasından görülür; ikinci veritabanı işinin süresinden de
     ayırt edilebilir. Onaylı tasarım (§5.5) firma_vt'yi bu uçta ister.
     Merkez ve firma denetimi örnek başına TEK UÇUŞ (aynı anda gelen istekler bir sorguyu paylaşır) ve süre sınırı tek uçuşun DIŞINDA: süresi dolan
     iş arkada sürerken gelen istek yeni bağlantı açmaz, aynı işi bekler (örnek başına en çok bir sağlık bağlantısı). Firma sonucu örnek başına
     ÖNBELLEKTE (sağlam SAGLIK.olumluSn, sorunlu SAGLIK.olumsuzSn): oturumsuz uç firmanın veritabanına her istekte gitmez — art arda istekle
     bağlantı, havuz kurulumu (LRU) ve bozuk parolada hatalı parola denemesi (Supabase yasağı) hızlandırılamaz. 2026-10-15 (FV7 incelemesi): önce
     önbellek yoktu ve süre sınırı tek uçuşun içindeydi (süre dolunca anahtar düşüyor, alttaki işlem bağlantıyı tutarken sonraki istek ikinci işlem
     açıyordu). Yazmaz.
   · /api/saglik/projeler (yalnız PROBATA_SAGLIK_SIR ya da CRON_SECRET'le — src/server/is/yetki.ts zamanliYetkili; duman testinin makinesinde YALNIZ
     PROBATA_SAGLIK_SIR durur, gece işlerini açamaz): merkezdeki goc_hedefleri()'ndeki her kendi projeli firmanın veritabanı (kurulumu bitmemiş olan
     yoklanmaz, sayılmaz — bağlantısı yok, FV10'un "dene" adımı denetler; bakımdaki — göç dışı — listede yok; dondurulmuş yoklanır: etkinleşince hemen
     açılır), en çok 4 aynı anda, proje başına 5 sn, projeler evresi en çok 35 sn. Tek bitiş zamanı: proje ancak süresi bitişe sığarsa başlar
     (sığmayan sorunlu sayılır, sonucu yazılmaz); süresi dolan projenin arkadaki işi (bağlantı kapanışı) bitene dek o işçi yeni projeye geçmez —
     açık firma bağlantısı en çok 4. Merkez okuma ve yazma da süre sınırlı (istemcide + sunucuda statement_timeout, SAGLIK.merkezMs): uç en çok
     5 + 35 + 5 = 45 sn sürer (maxDuration 50). Yanıt YALNIZ {toplam, tamam, sorunlu}; proje başına sonuç merkezde firma_vt.son_saglik /
     son_saglik_zaman (sırsız: durum, denetimler, sınıflanmış neden, bulunan göç — biçimi denetlenmiş —, sürüm; hata iletisi, sunucu, parola
     yazılmaz). Göç dağıtıcı (FV4) bu sütunları yazmaz.
   Kilit: tests/saglik-coklu.test.ts (iki küme, üç veritabanı) · tests/saglik-coklu-saf.test.ts · olumsuz kanıt tests/bozan/saglik-coklu.bozan.ts,
   tests/bozan/saglik-coklu-saf.bozan.ts. */
import { anaAnahtar } from "./ayar/sir.ts";
import { kayittanBaglanti, merkezYerelMi } from "./db/baglanti.ts";
import { kiraciHavuzu, type KiraciYeri } from "./db/firma-havuzu.ts";
import { kayitNedeni, nedenMetni } from "./db/goc-dagit.ts";
import { merkezHavuzu } from "./db/havuz.ts";
import type { Havuz, UygulamaBaglantisi } from "./db/kiraci.ts";
import { baglantidanSaglikOku, firmaSaglikOku, projeHedefleri, saglikOku, sonSaglikYaz, type ProjeHedefi, type SaglikVerisi } from "./db/saglik.ts";
import { GOC_SAYISI, SON_GOC } from "./db/son-goc.ts";
import { kayitOnbellegiKur, type KayitOnbellegi } from "./kiraci/kayit-onbellek.ts";

export type DenetimAdi = "veritabani" | "goc_guncel" | "rls" | "api_kapali" | "uygulama_kisitli" | "isler";
export interface Saglik { durum: "tamam" | "sorun"; surum: string; denetimler: Record<DenetimAdi, boolean> }
/** /api/saglik'in yanıtı: merkezin altı denetimi + firma_vt (FV7) — anahtarlar adrese göre DEĞİŞMEZ */
export interface SaglikYaniti { durum: "tamam" | "sorun"; surum: string; denetimler: Record<DenetimAdi | "firma_vt", boolean> }
export interface Beklenen { son: string; sayi: number }

/** firma / proje başına süre · merkez okuma ya da yazma süresi · aynı anda yoklanan proje · projeler evresinin üst sınırı (ms; projeler ucu en çok
    merkezMs + toplamMs + merkezMs = 45 sn — maxDuration 50) · /api/saglik firma sonucunun önbellek süresi (sn: sağlam / sorunlu) */
export const SAGLIK = { firmaMs: 5_000, merkezMs: 5_000, ayniAnda: 4, toplamMs: 35_000, olumluSn: 10, olumsuzSn: 30 } as const;

const surumKodu = () => (process.env.VERCEL_GIT_COMMIT_SHA ?? "yerel").slice(0, 7);

/** saf: veriden denetimler (null = veritabanına ulaşılamadı) */
export function saglikDegerlendir(v: SaglikVerisi | null, beklenen: { son: string; sayi: number } = { son: SON_GOC, sayi: GOC_SAYISI }, surum = "yerel"): Saglik {
  const d = {
    veritabani: v !== null,
    goc_guncel: !!v && v.son_goc === beklenen.son && Number(v.goc_sayisi) === beklenen.sayi,
    rls: !!v && v.kiraci_tablo > 0 && v.rls_eksik === 0 && v.politikasiz === 0,
    api_kapali: !!v && v.api_sema === false,
    uygulama_kisitli: !!v && v.uygulama_ayricalikli === false,
    isler: !!v && Number(v.takili_is) === 0,
  };
  return { durum: Object.values(d).every(Boolean) ? "tamam" : "sorun", surum, denetimler: d };
}

/** saf (FV7): merkezin değerlendirmesi + firma veritabanı → uç yanıtı. Anahtarlar SABİT (firma adresi olmayan istekte firmaVt = true). */
export function saglikYaniti(merkez: Saglik, firmaVt: boolean): SaglikYaniti {
  return {
    durum: merkez.durum === "tamam" && firmaVt ? "tamam" : "sorun",
    surum: merkez.surum,
    denetimler: { ...merkez.denetimler, firma_vt: firmaVt },
  };
}

/* ── firmanın veritabanı (FV7) ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** firma veritabanı sağlığı (sırsız; merkezde firma_vt.son_saglik'e bu yazılır) */
export interface FirmaSagligi {
  durum: "tamam" | "sorun";
  /** altı denetim firmanın veritabanında + kimlik (vt_firma_dogrula geçti: bağlanılan veritabanı bu firmanın) */
  denetimler: Record<DenetimAdi | "kimlik", boolean>;
  /** sorunun SIRSIZ nedeni (düşen denetimlerin adları ya da hata sınıfı + kod; hata iletisi yazılmaz) */
  neden?: string;
  /** firmanın veritabanında bulunan son göç / göç sayısı (veri alınabildiyse; biçimi tutmayan değer null — gocBilgisi) */
  goc?: { son: string | null; sayi: number | null };
}

/** firma denetiminin ham sonucu: veri, bağlantı / sorgu hatası, bağlantı kaydının kullanılamaması (baglanti.ts kayittanBaglanti; ana anahtar) ya da
    merkezdeki kaydın bağlantı alanlarının eksikliği */
export type FirmaYoklamasi = { veri: SaglikVerisi } | { hata: unknown } | { kayitHatasi: unknown } | { kayitYok: true };

const hataKodu = (h: unknown): unknown => (h && typeof h === "object" ? (h as { code?: unknown }).code : undefined);

/** firmanın veritabanından gelen göç bilgisi merkeze yalnız biçimi tutarsa yazılır (2026-10-15, FV7 incelemesi: veritabanının sahibi firma
    olabilir — FV13; merkezin yönetim verisine serbest metin / dev dizi yazdırılmasın): ad göç dosyası biçiminde (firma_vt.son_goc'un CHECK'i +
    uzunluk sınırı), sayı 0–100 000 tam sayı; değilse null */
const GOC_ADI = /^[0-9]{4}_[a-z0-9_]{1,80}\.sql$/;
export function gocBilgisi(v: SaglikVerisi): { son: string | null; sayi: number | null } {
  const g: unknown = v.goc_sayisi;
  const n = typeof g === "number" ? g : typeof g === "string" && /^[0-9]{1,6}$/.test(g) ? Number(g) : Number.NaN;
  return {
    son: typeof v.son_goc === "string" && GOC_ADI.test(v.son_goc) ? v.son_goc : null,
    sayi: Number.isSafeInteger(n) && n >= 0 && n <= 100_000 ? n : null,
  };
}

/** saf (FV7): ham sonuçtan firma sağlığı. Veri varsa kimlik doğru (veri yalnız vt_firma_dogrula'dan SONRA okunur); 42501 = bağlanıldı ama veritabanı
    reddetti (kimlik / yetki); öteki hatalarda bağlantı da yok. Neden metni hata iletisini YAZMAZ (goc-dagit.ts nedenMetni / kayitNedeni: sınıf + kod). */
export function firmaSagligiDegerlendir(y: FirmaYoklamasi, beklenen: Beklenen = { son: SON_GOC, sayi: GOC_SAYISI }): FirmaSagligi {
  if ("veri" in y) {
    const m = saglikDegerlendir(y.veri, beklenen);
    const dusen = Object.entries(m.denetimler).filter(([, ok]) => !ok).map(([ad]) => ad);
    return {
      durum: m.durum, denetimler: { ...m.denetimler, kimlik: true },
      ...(dusen.length ? { neden: `düşen: ${dusen.join(", ")}` } : {}),
      goc: gocBilgisi(y.veri),
    };
  }
  const bos = { veritabani: false, goc_guncel: false, rls: false, api_kapali: false, uygulama_kisitli: false, isler: false, kimlik: false };
  if ("kayitYok" in y) return { durum: "sorun", denetimler: bos, neden: "bağlantı kaydı eksik (kurulum tamam ama sunucu / kapı / ad / kullanıcı / parola yok)" };
  if ("kayitHatasi" in y) return { durum: "sorun", denetimler: bos, neden: kayitNedeni(y.kayitHatasi) };
  return { durum: "sorun", denetimler: { ...bos, veritabani: hataKodu(y.hata) === "42501" }, neden: nedenMetni(y.hata) };
}

/** iş en çok ms sürer; dolarsa zaman aşımı hatası (iş arkada sürer — havuzun / sorgunun kendi sınırı bitirir) */
export function sureli<T>(p: Promise<T>, ms: number): Promise<T> {
  let sayac: ReturnType<typeof setTimeout> | undefined;
  const sure = new Promise<never>((_, reddet) => {
    sayac = setTimeout(() => reddet(new Error(`Sağlık denetimi ${ms} ms'de bitmedi (timeout).`)), ms);
  });
  return Promise.race([p, sure]).finally(() => clearTimeout(sayac));
}

/** aynı havuzda aynı anahtarla aynı anda gelen işler TEK sorguyu paylaşır (iş bitince anahtar düşer; başka havuzun işi paylaşılmaz). Süre sınırı
    DIŞARIDAN konur — sureli(tekUcus(…)): süresi dolan iş arkada sürerken anahtar düşmez, sonraki istek yeni bağlantı açmaz, aynı işi bekler. */
const ucustakiler = new WeakMap<object, Map<string, Promise<unknown>>>();
export function tekUcus<T>(sahip: object, anahtar: string, is: () => Promise<T>): Promise<T> {
  let m = ucustakiler.get(sahip);
  if (!m) { m = new Map(); ucustakiler.set(sahip, m); }
  const varolan = m.get(anahtar) as Promise<T> | undefined;
  if (varolan) return varolan;
  const harita = m;
  const p = (async () => is())().finally(() => { harita.delete(anahtar); });
  harita.set(anahtar, p);
  return p;
}

/* ── /api/saglik ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface SaglikAyari {
  merkez: () => Havuz;
  /** isteğin kiracısı (yayında src/server/kiraci/istek.ts istekKiracisi — yalnız Host'tan; yönetim adresinde ve kökte null) */
  kiraciBul: () => Promise<KiraciYeri | null>;
  /** kiracının havuzu (yayında kiraciHavuzu) */
  havuz: (k: KiraciYeri) => Havuz;
  beklenen?: Beklenen;
  surum?: string;
  /** firma denetiminin üst sınırı (ms; varsayılan SAGLIK.firmaMs) */
  firmaMs?: number;
  /** merkez denetiminin üst sınırı (ms; varsayılan SAGLIK.merkezMs) */
  merkezMs?: number;
  /** firma sonucunun süreli önbelleği (firma kimliğiyle; değer true = sağlam, null = sorunlu). Yayında örnek başına (saglik()); verilmezse her istek
      firmaya sorar (testler) */
  onbellek?: KayitOnbellegi<true>;
}

/** kiracının veritabanı sağlam mı (veritabanı kimliği + altı denetim) — fırlatmaz */
async function firmaYokla(a: SaglikAyari, k: KiraciYeri, beklenen: Beklenen): Promise<boolean> {
  const ms = a.firmaMs ?? SAGLIK.firmaMs;
  const firmaId = k.firmaId;
  try {
    /* ortak firmada merkez, kendi projelide o firmanın havuzu — kiracının işi YALNIZ kiracının havuzundan (tests/havuz-kapsami.test.ts) */
    const havuz = a.havuz(k);
    const veri = await sureli(tekUcus(havuz, `firma:${firmaId}`, () => firmaSaglikOku(havuz, firmaId, ms)), ms);
    return firmaSagligiDegerlendir({ veri }, beklenen).durum === "tamam";
  } catch (h) {
    console.error("[sağlık] firma veritabanı denetimi düştü:", nedenMetni(h));
    return false;
  }
}

/** adresin firması varsa onun veritabanı sağlam mı; firma adresi değilse doğru (denetlenecek firma veritabanı yok). Önbellek verilmişse sonuç firma
    kimliğiyle süreli tutulur (sağlam / sorunlu ayrı süre; aynı anda gelenler tek yoklamayı bekler) */
async function firmaVtDenetle(a: SaglikAyari, beklenen: Beklenen): Promise<boolean> {
  let k: KiraciYeri | null;
  /* kiracının çözümü merkezde (firma_coz, önbellekli) — merkez asılırsa uç da asılmasın: merkez süresi */
  try { k = await sureli(a.kiraciBul(), a.merkezMs ?? SAGLIK.merkezMs); } catch (h) {
    console.error("[sağlık] adresin firması çözülemedi:", nedenMetni(h));
    return false;
  }
  if (!k) return true;
  const kiraci = k;
  if (!a.onbellek) return firmaYokla(a, kiraci, beklenen);
  return (await a.onbellek.getir(kiraci.firmaId, async () => ((await firmaYokla(a, kiraci, beklenen)) ? true : null))) === true;
}

/** /api/saglik'in çekirdeği (bağımlılıklar verilir — testler gerçek kümelerle çağırır). Merkez ve firma aynı anda. Fırlatmaz. */
export async function saglikDenetle(a: SaglikAyari): Promise<SaglikYaniti> {
  const beklenen = a.beklenen ?? { son: SON_GOC, sayi: GOC_SAYISI };
  const merkezVerisi = async (): Promise<SaglikVerisi | null> => {
    try {
      const m = a.merkez();
      return await sureli(tekUcus(m, "merkez", () => saglikOku(m)), a.merkezMs ?? SAGLIK.merkezMs);
    } catch (h) {
      console.error("[sağlık] veritabanı denetimi düştü:", nedenMetni(h));
      return null;
    }
  };
  const [v, firmaVt] = await Promise.all([merkezVerisi(), firmaVtDenetle(a, beklenen)]);
  return saglikYaniti(saglikDegerlendir(v, beklenen, a.surum ?? surumKodu()), firmaVt);
}

/** yayında firma sonuçları: örnek başına, firma kimliğiyle (en çok 2 000 — LRU); yalnız çözülen firmalar girer (bilinmeyen adres yazmaz) */
const firmaSonuclari = kayitOnbellegiKur<true>({ olumluSn: SAGLIK.olumluSn, olumsuzSn: SAGLIK.olumsuzSn });

/** /api/saglik: isteğin kiracısı uçtan verilir (src/app/api/saglik/route.ts → istekKiracisi); verilmezse yalnız merkez */
export function saglik(kiraciBul: () => Promise<KiraciYeri | null> = async () => null): Promise<SaglikYaniti> {
  return saglikDenetle({ merkez: merkezHavuzu, kiraciBul, havuz: kiraciHavuzu, onbellek: firmaSonuclari });
}

/* ── /api/saglik/projeler ──────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface ProjeOzeti { toplam: number; tamam: number; sorunlu: number }

export interface ProjeAyari {
  merkez: Havuz;
  /** ana anahtar (yayında PROBATA_SIR_ANAHTARI) — yalnız yoklanacak proje varsa, bir kez çağrılır */
  anahtar: () => Buffer;
  /** merkez yerelde mi (yerel adresli firma veritabanına yalnız o zaman izin — baglanti.ts) */
  merkezYerel: boolean;
  beklenen?: Beklenen;
  surum?: string;
  /** proje başına üst sınır (ms; varsayılan SAGLIK.firmaMs) */
  projeMs?: number;
  /** projeler evresinin üst sınırı (ms; varsayılan SAGLIK.toplamMs) — tek bitiş zamanı: süresi bitişe sığmayan proje başlamaz, sorunlu sayılır */
  toplamMs?: number;
  /** merkez okumasının ve yazmasının her birinin üst sınırı (ms; varsayılan SAGLIK.merkezMs — istemcide ve sunucuda) */
  merkezMs?: number;
  /** firmanın veritabanını okuyan (varsayılan baglantidanSaglikOku; testler sayar) */
  oku?: (ayar: UygulamaBaglantisi, firmaId: string, ms: number) => Promise<SaglikVerisi>;
}

/** en çok n iş aynı anda; sonuçlar girdinin sırasıyla */
async function sinirli<T, S>(l: readonly T[], n: number, f: (x: T) => Promise<S>): Promise<S[]> {
  const sonuc = new Array<S>(l.length);
  let i = 0;
  const isci = async () => { while (i < l.length) { const j = i++; sonuc[j] = await f(l[j]!); } };
  await Promise.all(Array.from({ length: Math.min(n, l.length) }, isci));
  return sonuc;
}

/** iş bitene (başarı ya da hata) ya da ms dolana dek bekler; fırlatmaz, sayacı temizler */
async function bitmesiniBekle(is: Promise<unknown>, ms: number): Promise<void> {
  let sayac: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([is.then(() => undefined, () => undefined), new Promise<void>((coz) => { sayac = setTimeout(coz, Math.max(0, ms)); })]);
  clearTimeout(sayac);
}

/** bir projeyi yoklar: kayıt denetlenir (izin listesi, TLS, yalnız uygulama rolü — parola ancak sonra, bellekte çözülür), sonra süre sınırlı okuma.
    Sonuç süre dolunca belli olur; ama arkadaki iş (bağlanma / sorgu süresi, ROLLBACK, havuz kapanışı) bitene dek — en çok bitiş zamanına dek —
    dönülmez: işçi yeni projeye geçmez, açık firma bağlantısı en çok SAGLIK.ayniAnda. */
async function projeyiYokla(h: ProjeHedefi, anahtar: Buffer | { hata: unknown }, a: ProjeAyari, beklenen: Beklenen, ms: number, bitis: number): Promise<FirmaSagligi> {
  if (!h.kayit) return firmaSagligiDegerlendir({ kayitYok: true }, beklenen);
  if (!Buffer.isBuffer(anahtar)) return firmaSagligiDegerlendir({ kayitHatasi: anahtar.hata }, beklenen);
  let ayar: UygulamaBaglantisi;
  try { ayar = kayittanBaglanti(h.kayit, anahtar, { merkezYerel: a.merkezYerel, enCok: 1 }); } catch (x) {
    return firmaSagligiDegerlendir({ kayitHatasi: x }, beklenen);
  }
  const oku = a.oku ?? baglantidanSaglikOku;
  const is = (async () => oku(ayar, h.firmaId, ms))();
  let sonuc: FirmaSagligi;
  try {
    sonuc = firmaSagligiDegerlendir({ veri: await sureli(is, ms) }, beklenen);
  } catch (x) {
    sonuc = firmaSagligiDegerlendir({ hata: x }, beklenen);
  }
  await bitmesiniBekle(is, bitis - Date.now());
  return sonuc;
}

/** /api/saglik/projeler'in çekirdeği: merkez okunamazsa / yazılamazsa (süresinde) FIRLATIR (uç 503); proje hataları sayıya ve son_saglik'e girer */
export async function projeleriYokla(a: ProjeAyari): Promise<ProjeOzeti> {
  const beklenen = a.beklenen ?? { son: SON_GOC, sayi: GOC_SAYISI };
  const surum = a.surum ?? surumKodu();
  const toplamMs = a.toplamMs ?? SAGLIK.toplamMs;
  const projeMs = a.projeMs ?? SAGLIK.firmaMs;
  const merkezMs = a.merkezMs ?? SAGLIK.merkezMs;
  const hedefler = (await sureli(projeHedefleri(a.merkez, merkezMs), merkezMs)).filter((h) => h.kurulumTamam);
  let anahtar: Buffer | { hata: unknown } = { hata: new Error("ana anahtar okunmadı") };
  if (hedefler.length) { try { anahtar = a.anahtar(); } catch (h) { anahtar = { hata: h }; } }
  const bitis = Date.now() + toplamMs;
  const sonuclar = await sinirli(hedefler, SAGLIK.ayniAnda, async (h) =>
    (Date.now() + projeMs > bitis ? null : { firmaId: h.firmaId, saglik: await projeyiYokla(h, anahtar, a, beklenen, projeMs, bitis) }));
  const yoklanan = sonuclar.filter((s): s is { firmaId: string; saglik: FirmaSagligi } => s !== null);
  await sureli(sonSaglikYaz(a.merkez, yoklanan.map((s) => ({ firmaId: s.firmaId, son: { ...s.saglik, surum } })), merkezMs), merkezMs);
  const tamam = yoklanan.filter((s) => s.saglik.durum === "tamam").length;
  return { toplam: hedefler.length, tamam, sorunlu: hedefler.length - tamam };
}

/** /api/saglik/projeler: yayındaki bağımlılıklarla; merkez okunamaz / yazılamazsa null (uç 503 — neden günlüğe sırsız) */
export async function projeSagligi(): Promise<ProjeOzeti | null> {
  try {
    return await projeleriYokla({ merkez: merkezHavuzu(), anahtar: () => anaAnahtar(), merkezYerel: merkezYerelMi() });
  } catch (h) {
    console.error("[sağlık] projeler yoklanamadı:", nedenMetni(h));
    return null;
  }
}
