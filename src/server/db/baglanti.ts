/* FİRMA VERİTABANI BAĞLANTISI (FIRMA-VT §5.2–5.3, FV2) — saf; veritabanına bağlanmaz, ortamı yalnız varsayılan değerde okur.
   Kendi projeli firmanın bağlantı kaydı merkezde (firma_vt, göç 0096) ŞİFRELİ durur; firma_coz (src/server/db/merkez.ts) şifreli metni olduğu gibi
   verir, çözme burada, havuz kurulurken bir kez (FV3). Kurallar:
   · uzak sunucu yalnız Supabase AB (Frankfurt) havuzcusu (izin listesi) ve TLS + kilitli Supabase kökü ZORUNLU (şifresiz ağ bağlantısı yok);
   · yerel adres (127.0.0.1 / localhost) yalnız merkez de yerelse (yerel geliştirme, test) — yayında bir kayıt firmayı yerel adrese yöneltemez;
   · kullanıcı yalnız uygulama rolü: havuzcunun biçimiyle "probata_uygulama.<ref>" (yerelde ref yoksa "probata_uygulama") — kayıt sahip ya da başka
     ayrıcalıklı role yöneltilemez (göç 0096'da aynı denetim);
   · sırların ek doğrulama verisi "probata:baglanti:v1:<firmaId>:<ref>:<ad>": satır başka firmaya kopyalanırsa ya da ref değişirse çözülmez;
     kurulumun geçici sırları (kurulum_sahip, kurulum_yz) proje açılmadan yazılır — eklerinde ref HER ZAMAN boş (kurulumSifrele / kurulumCoz);
   · Storage adresi kaydın projesine bağlı (https://<ref>.supabase.co; yerelde yalnız merkez de yerelse): adres tutmazsa gizli anahtar çözülmez
     (depoBaglantisi — anahtar başka adrese gitmez; göç 0096 firma_vt_depo_ref aynı kural).
   Merkez bağlantısı (ortamdan — havuz.ts ortamdanBaglanti) şifresiz ağ denetimini ve TLS kökünü buradan paylaşır; izin listesi yalnız firma
   bağlantısında (merkez bugünkü gibi). Kilit: tests/firma-baglanti.test.ts · olumsuz kanıt tests/bozan/firma-baglanti.bozan.ts. */
import { aesCoz, aesSifrele } from "../ayar/aes.ts";
import type { UygulamaBaglantisi } from "./kiraci.ts";
import { SUPABASE_KOK_2021 } from "./kok-sertifika.ts";

const YEREL = new Set(["127.0.0.1", "localhost", "::1"]);
/** Supabase AB (Frankfurt) havuzcusu — kendi projeli firmanın veritabanı yalnız buradan */
export const SUPABASE_HAVUZCU = /^aws-\d{1,2}-eu-central-1\.pooler\.supabase\.com$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REF = /^[a-z0-9]{20}$/;
const VT_AD = /^[a-z_][a-z0-9_]{0,62}$/;
const UYGULAMA = "probata_uygulama";

export const yerelSunucu = (sunucu: string): boolean => YEREL.has(sunucu);
/** merkez (ortamdaki bağlantı) yerelde mi — yerel firma veritabanına yalnız o zaman izin var */
export const merkezYerelMi = (e: Record<string, string | undefined> = process.env): boolean => yerelSunucu(e.PROBATA_VT_SUNUCU ?? "");
export const kapiGecerli = (kapi: number): boolean => Number.isInteger(kapi) && kapi >= 1 && kapi <= 65535;

/** ağ üzerinden şifresiz bağlantı kurulmaz (merkez ve firma bağlantısı ortak) */
export function sifresizAgDenetle(sunucu: string, tls: boolean, cozum = "PROBATA_VT_SSL=dogrula verin."): void {
  if (!tls && !yerelSunucu(sunucu)) throw new Error(`Veritabanına ağ üzerinden şifresiz bağlanılmaz: ${cozum}`);
}
/** TLS'de sunucu yalnız kilitli Supabase kökü ile doğrulanır (havuzKur: rejectUnauthorized) */
export const tlsAyari = (tls: boolean): { kokSertifika?: string } => (tls ? { kokSertifika: SUPABASE_KOK_2021 } : {});

/** havuzcunun beklediği kullanıcı adı: probata_uygulama.<ref> (yerelde ref yoksa probata_uygulama) */
export const uygulamaKullanicisi = (ref: string | null): string => (ref ? `${UYGULAMA}.${ref}` : UYGULAMA);

/* ── bağlantı sırları ───────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** projeye (ref) bağlı sırlar: firma veritabanının uygulama parolası, Storage gizli anahtarı — ref değişirse çözülmez */
export const BAGLANTI_SIR_ADLARI = ["uygulama_parolasi", "depo_gizli"] as const;
export type BaglantiSirAdi = (typeof BAGLANTI_SIR_ADLARI)[number];
/** kurulumun geçici sırları (firma_kurulum.girdi; "tamam"da silinir): sahip parolası proje AÇILMADAN yazılır, ref o an yok — ek verilerinde ref HER
    ZAMAN boş, yalnız firmaya bağlı; proje açılıp ref kayda yazıldıktan sonra da aynı ekle çözülür. 2026-10-15 (FV2 incelemesi: ref'li ek veriyle
    yazılsaydı, ref kayda girdikten sonra hangi ekle çözüleceği belirsizdi — kurulum "sahip parolası çözülemedi" diye takılırdı) */
export const KURULUM_SIR_ADLARI = ["kurulum_sahip", "kurulum_yz"] as const;
export type KurulumSirAdi = (typeof KURULUM_SIR_ADLARI)[number];

/** ek doğrulama verisinin metni — biçim denetlenir (":" taşıyan bir ref başka bir ekle çakışamasın) */
function ekMetni(firmaId: string, ref: string | null, ad: string): string {
  if (!UUID.test(firmaId)) throw new Error("Geçersiz firma kimliği");
  if (ref !== null && !REF.test(ref)) throw new Error("Geçersiz proje kimliği (ref)");
  return `probata:baglanti:v1:${firmaId}:${ref ?? ""}:${ad}`;
}
/** bağlantı sırrının ek verisi (firma + ref + ad); kurulum sırrının adı burada geçmez (kurulumEki) */
export function baglantiEki(firmaId: string, ref: string | null, ad: BaglantiSirAdi): string {
  if (!(BAGLANTI_SIR_ADLARI as readonly string[]).includes(ad)) throw new Error("Bilinmeyen bağlantı sırrı");
  return ekMetni(firmaId, ref, ad);
}
/** kurulum sırrının ek verisi: firma + ad, ref boş ("probata:baglanti:v1:<firmaId>::<ad>") */
export function kurulumEki(firmaId: string, ad: KurulumSirAdi): string {
  if (!(KURULUM_SIR_ADLARI as readonly string[]).includes(ad)) throw new Error("Bilinmeyen kurulum sırrı");
  return ekMetni(firmaId, null, ad);
}
export const baglantiSifrele = (duz: string, firmaId: string, ref: string | null, ad: BaglantiSirAdi, anahtar: Buffer): string =>
  aesSifrele(duz, baglantiEki(firmaId, ref, ad), anahtar);
export const baglantiCoz = (sifreli: string, firmaId: string, ref: string | null, ad: BaglantiSirAdi, anahtar: Buffer): string =>
  aesCoz(sifreli, baglantiEki(firmaId, ref, ad), anahtar);
export const kurulumSifrele = (duz: string, firmaId: string, ad: KurulumSirAdi, anahtar: Buffer): string =>
  aesSifrele(duz, kurulumEki(firmaId, ad), anahtar);
export const kurulumCoz = (sifreli: string, firmaId: string, ad: KurulumSirAdi, anahtar: Buffer): string =>
  aesCoz(sifreli, kurulumEki(firmaId, ad), anahtar);

/* ── denetim ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface FirmaBaglantiAyari {
  sunucu: string; kapi: number; vtAd: string; kullanici: string; parola: string;
  /** verilmezse uzakta açık, yerelde kapalı; uzakta kapatılamaz */
  tls?: boolean;
  /** firma başına havuz (FV3: PROBATA_FIRMA_HAVUZ, 1–5) */
  enCok?: number;
}

/** sunucu izinli mi: uzakta yalnız izin listesi, yerelde yalnız merkez de yerelse */
function sunucuDenetle(sunucu: string, merkezYerel: boolean): void {
  if (yerelSunucu(sunucu)) {
    if (!merkezYerel) throw new Error("Firma veritabanı yerel adreste olamaz: merkez yayında (yerel adres yalnız yerel geliştirme ve testte).");
  } else if (!SUPABASE_HAVUZCU.test(sunucu)) {
    throw new Error("Firma veritabanı sunucusu izin listesinde değil (yalnız Supabase AB havuzcusu).");
  }
}

/** firma veritabanı bağlantı ayarını denetler, havuzun ayarına çevirir (izin listesi, TLS, kapı, ad, kullanıcı) */
export function baglantiDenetle(a: FirmaBaglantiAyari, o: { merkezYerel: boolean }): UygulamaBaglantisi {
  sunucuDenetle(a.sunucu, o.merkezYerel);
  const tls = a.tls ?? !yerelSunucu(a.sunucu);
  sifresizAgDenetle(a.sunucu, tls, "firma veritabanında TLS zorunlu.");
  if (!kapiGecerli(a.kapi)) throw new Error("Firma veritabanı kapısı geçersiz.");
  if (!VT_AD.test(a.vtAd)) throw new Error("Firma veritabanı adı geçersiz.");
  if (a.kullanici !== UYGULAMA && !(a.kullanici.startsWith(`${UYGULAMA}.`) && REF.test(a.kullanici.slice(UYGULAMA.length + 1)))) {
    throw new Error("Firma veritabanına yalnız uygulama rolüyle bağlanılır.");
  }
  if (!a.parola) throw new Error("Firma veritabanı parolası yok.");
  if (a.enCok !== undefined && (!Number.isInteger(a.enCok) || a.enCok < 1 || a.enCok > 5)) throw new Error("Firma havuzu 1–5 bağlantı olmalı.");
  return {
    host: a.sunucu, port: a.kapi, database: a.vtAd, user: a.kullanici, password: a.parola,
    ...tlsAyari(tls),
    ...(a.enCok !== undefined ? { enCok: a.enCok } : {}),
  };
}

/* ── merkezdeki kayıttan bağlantı ────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** kendi projeli firmanın merkezdeki bağlantı kaydı (firma_coz — göç 0096); şifreli alanlar ŞİFRELİ */
export interface FirmaVtKaydi {
  firmaId: string;
  /** Supabase proje kimliği (yerel geliştirme / testte yok) */
  ref: string | null;
  sunucu: string;
  kapi: number;
  vtAd: string;
  kullanici: string;
  /** ek veri baglantiEki(firmaId, ref, "uygulama_parolasi") */
  parolaSifreli: string;
  /** Storage (FV5): adres, gizli anahtar (ek veri "depo_gizli"), kova — kurulmadıysa yok */
  depo: { url: string; gizliSifreli: string; kova: string } | null;
  /** bağlantı her değiştiğinde artar (havuz anahtarı firma:ref:sürüm — FV3) */
  surum: number;
}

/** kayıttan uygulama bağlantısı: önce sunucu ve kullanıcı denetlenir, sonra parola çözülür (izin dışı sunucuya parola çözülmez) */
export function kayittanBaglanti(kayit: FirmaVtKaydi, anahtar: Buffer, secenek: { merkezYerel: boolean; enCok?: number } = { merkezYerel: merkezYerelMi() }): UygulamaBaglantisi {
  sunucuDenetle(kayit.sunucu, secenek.merkezYerel);
  if (!kayit.ref && !yerelSunucu(kayit.sunucu)) throw new Error("Uzak firma veritabanının proje kimliği (ref) yok.");
  if (kayit.kullanici !== uygulamaKullanicisi(kayit.ref)) throw new Error("Firma veritabanına yalnız uygulama rolüyle bağlanılır.");
  const parola = baglantiCoz(kayit.parolaSifreli, kayit.firmaId, kayit.ref, "uygulama_parolasi", anahtar);
  return baglantiDenetle({ sunucu: kayit.sunucu, kapi: kayit.kapi, vtAd: kayit.vtAd, kullanici: kayit.kullanici, parola, enCok: secenek.enCok }, secenek);
}

/* ── merkezdeki kayıttan Storage (FV5 kullanacak) ────────────────────────────────────────────────────────────────────────────────────── */
const YEREL_DEPO = /^http:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/;
const KOVA = /^[a-z0-9][a-z0-9_-]{2,62}$/;
/** Storage adresi kaydın KENDİ projesinin mi: uzakta yalnız https://<ref>.supabase.co; ref yoksa (yerel geliştirme / test) yalnız yerel adres ve yalnız
    merkez de yerelse (göç 0096 firma_vt_depo_ref ile aynı kural). 2026-10-15 (FV2 incelemesi): adres ek veriye bağlı değildi — kaydın yalnız adresi
    değiştirilirse gerçek gizli anahtar çözülüp yabancı projeye (ya da yayında düz HTTP ile yerel adrese) gidebilirdi. */
export function depoAdresiDenetle(url: string, ref: string | null, merkezYerel: boolean): void {
  if (ref !== null) {
    if (!REF.test(ref) || url !== `https://${ref}.supabase.co`) throw new Error("Firmanın Storage adresi kendi projesinin değil.");
  } else if (!YEREL_DEPO.test(url)) {
    throw new Error("Proje kimliği olmayan firma deposu yalnız yerel adreste olabilir.");
  } else if (!merkezYerel) {
    throw new Error("Firma deposu yerel adreste olamaz: merkez yayında (yerel adres yalnız yerel geliştirme ve testte).");
  }
}
/** kayıttan Storage ayarı (supabaseDepo'nun ayarı): önce adres ve kova denetlenir, SONRA gizli anahtar çözülür; depo kurulmadıysa null */
export function depoBaglantisi(kayit: FirmaVtKaydi, anahtar: Buffer, secenek: { merkezYerel: boolean } = { merkezYerel: merkezYerelMi() }): { url: string; gizli: string; kova: string } | null {
  if (!kayit.depo) return null;
  const { url, gizliSifreli, kova } = kayit.depo;
  depoAdresiDenetle(url, kayit.ref, secenek.merkezYerel);
  if (!KOVA.test(kova)) throw new Error("Firma deposunun kovası geçersiz.");
  return { url, gizli: baglantiCoz(gizliSifreli, kayit.firmaId, kayit.ref, "depo_gizli", anahtar), kova };
}
