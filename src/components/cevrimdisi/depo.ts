/* ÇEVRİMDIŞI CİHAZ DEPOSU (394; ARKA-UC K4 "çevrimdışı yazılan her şey cihazın kalıcı deposuna yazılır (tarayıcıda IndexedDB), şifreli; RAM yalnız
   ekranda açık olanı tutar", §4.3, maket Z4) — kuyruktaki işler sayfa kapansa, telefon belleği boşaltsa da kalır. İşin içeriği (formun hâli)
   AES-GCM ile şifreli yazılır; anahtar cihazda üretilir, DIŞARI ALINAMAZ (extractable: false — sayfa kodu bile ham anahtarı okuyamaz), aynı
   depoda saklanır. Depo kökene bağlıdır: her firmanın alt alan adı ayrı depo. Tarayıcı depoya izin vermiyorsa (gizli pencere, kapalı site verisi)
   null döner — kuyruk o zaman yalnız bu sayfada bellekte tutar ve kullanıcıya söyler (sessiz kayıp yok).
   2026-11-12 KAYIPSIZ YAZMA (reisim: "çevrimdışı kullanımı kusursuz çalışmalı ve sahada veri fotoğraf yazı vs kaybolmamalı kesinlikle"):
   · yazma, veritabanı işlemi TAMAMLANINCA bitmiş sayılır (isteğin "oldu" demesi yetmez: yer dolduysa işlem sonradan geri alınır) ve diske
     indirilerek yapılır (durability "strict" — telefon kapansa da kalır); geri alınırsa HATA döner, çağıran işi bellekte tutar ve söyler;
   · depo bir kez açılamadıysa sonra yeniden denenir (geçici kilit / dolu disk sayfa boyunca "depo yok" bırakmasın);
   · TASLAK: henüz gönderilmemiş yazı / seçilmiş fotoğraf (S.A.Y Chat, Rapor modu, rapor formu) "durum" bölmesinde şifreli — sekme kapanırsa,
     telefon kamerayı açarken sayfayı bellekten atarsa geri gelir. Şema DEĞİŞMEDİ (sürüm yükseltmesi eski servis çalışanıyla kilitlenirdi);
   · KALICI SAKLAMA: tarayıcıdan "yer daralınca bu sitenin verisini silme" izni istenir (kaliciIste); kullanılan yer yerOku. */

/* ⛔ şema public/sw.js ile ORTAK (servis çalışanı aynı depoyu açar — 395): ad, sürüm ve bölmeler iki yerde aynı (tests/sw.test.ts kilitler) */
const VT = "probata-cevrimdisi";
const SURUM = 2;
const ISLER = "isler";
const ANAHTAR = "anahtar";
/** bağlantısız açılacak sayfalar (395; servis çalışanı yazar, şifreli) · kimin sayfaları olduğu (kişi değişince silinir) */
const SAYFALAR = "sayfalar";
const DURUM = "durum";

/** depodaki iş: görünen alanlar açık, içerik şifreli */
export interface DepoIsi {
  id: string;
  tur: string;
  kayit: string;
  yazan: string;
  surum: number;
  /** cihazda yapıldığı an (ISO) */
  zaman: string;
  /** ekranda: "Rapor kaydı · DA-1026-001" */
  ad: string;
  /** fotoğrafın raporda yeri "bölüm|madde" (398; ekranda bekleyen fotoğraf kendi yerinde görünür — açık, içerik değil); öteki işlerde yok */
  yer?: string | null;
  durum: "bekliyor" | "cakisma" | "eksik" | "hata" | "baska_hesap";
  ileti: string | null;
  /** çakışmada sunucudaki güncel sürüm ("benimkini yaz" bununla yeni kimlikle gider) */
  guncel: number | null;
  /** sıra: önce yazılan önce gider */
  sira: number;
  iv: Uint8Array;
  sifreli: ArrayBuffer;
}

let acik: Promise<IDBDatabase | null> | null = null;
/** açılamayan depo en erken bu kadar sonra yeniden denenir */
const YENIDEN_AC_MS = 5_000;

function istek<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((coz, red) => { r.onsuccess = () => coz(r.result); r.onerror = () => red(r.error); });
}

/** depoyu açar; açılamazsa null (bir kez denenir) */
export function depoAc(): Promise<IDBDatabase | null> {
  if (acik) return acik;
  acik = new Promise((coz) => {
    try {
      if (typeof indexedDB === "undefined") { coz(null); return; }
      const r = indexedDB.open(VT, SURUM);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains(ISLER)) db.createObjectStore(ISLER, { keyPath: "id" });
        if (!db.objectStoreNames.contains(ANAHTAR)) db.createObjectStore(ANAHTAR);
        if (!db.objectStoreNames.contains(SAYFALAR)) db.createObjectStore(SAYFALAR);
        if (!db.objectStoreNames.contains(DURUM)) db.createObjectStore(DURUM);
      };
      r.onsuccess = () => {
        const db = r.result;
        /* tarayıcı depoyu kapatırsa (yer baskısı, başka sekmenin yükseltmesi) sonraki çağrı yeniden açar */
        db.onclose = () => { acik = null; };
        db.onversionchange = () => { db.close(); acik = null; };
        coz(db);
      };
      r.onerror = () => { yenidenDenenir(); coz(null); };
      r.onblocked = () => { yenidenDenenir(); coz(null); };
    } catch { yenidenDenenir(); coz(null); }
  });
  return acik;
}
function yenidenDenenir() { setTimeout(() => { acik = null; }, YENIDEN_AC_MS); }

/** yazma işlemi: diske indirilerek (strict); seçeneği tanımayan tarayıcıda seçeneksiz */
function yazmaIslemi(db: IDBDatabase, bolme: string): IDBTransaction {
  try { return db.transaction(bolme, "readwrite", { durability: "strict" }); } catch { return db.transaction(bolme, "readwrite"); }
}
/** işlem TAMAMLANINCA çözülür; geri alınırsa (yer doldu, hata) reddeder */
function tamamlandi(t: IDBTransaction): Promise<void> {
  return new Promise((coz, red) => {
    t.oncomplete = () => coz();
    t.onabort = () => red(t.error ?? new DOMException("Cihaz deposuna yazılamadı.", "AbortError"));
    t.onerror = () => red(t.error ?? new DOMException("Cihaz deposuna yazılamadı.", "AbortError"));
  });
}

async function anahtar(db: IDBDatabase): Promise<CryptoKey> {
  const var_ = await istek(db.transaction(ANAHTAR, "readonly").objectStore(ANAHTAR).get("ana")) as CryptoKey | undefined;
  if (var_) return var_;
  const yeni = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const t = db.transaction(ANAHTAR, "readwrite");
  /* iki sekme aynı anda üretirse ilk yazılan kalır: yazmadan önce yeniden bakılır */
  const once = await istek(t.objectStore(ANAHTAR).get("ana")) as CryptoKey | undefined;
  if (once) return once;
  await istek(t.objectStore(ANAHTAR).put(yeni, "ana"));
  return yeni;
}

/** içeriği şifreler (anahtar yoksa üretir) */
export async function sifrele(db: IDBDatabase, veri: unknown): Promise<{ iv: Uint8Array; sifreli: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sifreli = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await anahtar(db), new TextEncoder().encode(JSON.stringify(veri)));
  return { iv, sifreli };
}

export async function coz(db: IDBDatabase, i: Pick<DepoIsi, "iv" | "sifreli">): Promise<unknown> {
  const acikMetin = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(i.iv) }, await anahtar(db), i.sifreli);
  return JSON.parse(new TextDecoder().decode(acikMetin));
}

export async function isleriOku(db: IDBDatabase): Promise<DepoIsi[]> {
  const l = await istek(db.transaction(ISLER, "readonly").objectStore(ISLER).getAll()) as DepoIsi[];
  return l.sort((a, b) => a.sira - b.sira);
}

export async function isYaz(db: IDBDatabase, i: DepoIsi): Promise<void> {
  const t = yazmaIslemi(db, ISLER), bitti = tamamlandi(t);
  t.objectStore(ISLER).put(i);
  await bitti;
}

export async function isSil(db: IDBDatabase, id: string): Promise<void> {
  const t = yazmaIslemi(db, ISLER), bitti = tamamlandi(t);
  t.objectStore(ISLER).delete(id);
  await bitti;
}

/* ── TASLAK (2026-11-12): gönderilmemiş yazı / seçilmiş fotoğraf — "durum" bölmesinde "taslak|<ad>" anahtarıyla, şifreli, yazanın etiketiyle
   (cihazda başka kişi girerse onun taslağı görünmez). Yazma başarısızsa false (çağıran söyler); okuma bozuksa null. ── */
const TASLAK = "taslak|";
interface TaslakKaydi { yazan: string; zaman: number; iv: Uint8Array; sifreli: ArrayBuffer }
export async function taslakYaz(yazan: string, ad: string, veri: unknown): Promise<boolean> {
  try {
    const db = await depoAc();
    if (!db || !yazan) return false;
    const k: TaslakKaydi = { yazan, zaman: Date.now(), ...(await sifrele(db, veri)) };
    const t = yazmaIslemi(db, DURUM), bitti = tamamlandi(t);
    t.objectStore(DURUM).put(k, TASLAK + ad);
    await bitti;
    return true;
  } catch { return false; }
}
export async function taslakOku<T>(yazan: string, ad: string): Promise<T | null> {
  try {
    const db = await depoAc();
    if (!db || !yazan) return null;
    const k = await istek(db.transaction(DURUM, "readonly").objectStore(DURUM).get(TASLAK + ad)) as TaslakKaydi | undefined;
    if (!k || k.yazan !== yazan) return null;
    return await coz(db, k) as T;
  } catch { return null; }
}
export async function taslakSil(ad: string): Promise<void> {
  try {
    const db = await depoAc();
    if (!db) return;
    const t = yazmaIslemi(db, DURUM), bitti = tamamlandi(t);
    t.objectStore(DURUM).delete(TASLAK + ad);
    await bitti;
  } catch { /* silinemeyen taslak sonra silinir (30 gün) */ }
}
/** önekle başlayan taslakların adları (önek hariç değil — tam ad) */
export async function taslakAdlari(onek: string): Promise<string[]> {
  try {
    const db = await depoAc();
    if (!db) return [];
    const a = TASLAK + onek;
    const l = await istek(db.transaction(DURUM, "readonly").objectStore(DURUM).getAllKeys(IDBKeyRange.bound(a, a + "\uffff"))) as string[];
    return l.map((x) => x.slice(TASLAK.length));
  } catch { return []; }
}
/** eski taslaklar (geçici kimlikle kalan, yarım bırakılan) gün sayısı dolunca silinir */
export async function eskiTaslaklariSil(gun = 30): Promise<void> {
  try {
    const db = await depoAc();
    if (!db) return;
    const sinir = Date.now() - gun * 86_400_000;
    const t = yazmaIslemi(db, DURUM), bitti = tamamlandi(t), d = t.objectStore(DURUM);
    const k = d.openCursor(IDBKeyRange.bound(TASLAK, TASLAK + "\uffff"));
    k.onsuccess = () => { const c = k.result; if (!c) return; if (((c.value as TaslakKaydi).zaman ?? 0) < sinir) c.delete(); c.continue(); };
    await bitti;
  } catch { /* sonra */ }
}

/* ── KALICI SAKLAMA ve YER (2026-11-12) ── */
/** tarayıcıdan kalıcı saklama izni ister (yer daralınca bu sitenin verisi silinmesin); sonuç: verildi mi (bilinmiyorsa null) */
export async function kaliciIste(): Promise<boolean | null> {
  try {
    const d = navigator.storage;
    if (!d?.persist) return null;
    return (await d.persisted?.()) || (await d.persist());
  } catch { return null; }
}
/** kullanılan yer ve tarayıcının bu siteye ayırdığı yer (bayt); bilinmiyorsa null */
export async function yerOku(): Promise<{ kullanilan: number; kota: number; kalici: boolean | null } | null> {
  try {
    const d = navigator.storage;
    if (!d?.estimate) return null;
    const e = await d.estimate();
    if (typeof e.usage !== "number" || typeof e.quota !== "number" || e.quota <= 0) return null;
    return { kullanilan: e.usage, kota: e.quota, kalici: d.persisted ? await d.persisted() : null };
  } catch { return null; }
}

/** saklanan sayfaları siler (çıkışta; cihazda başka kişi girince) — 395 */
export async function sayfalariSil(): Promise<void> {
  const db = await depoAc();
  if (!db) return;
  const t = db.transaction(SAYFALAR, "readwrite");
  await istek(t.objectStore(SAYFALAR).clear());
}

/** saklanan sayfalar bu kişinin mi: değilse (cihazda başka kişi girdi) silinir, kişi yazılır — 395 */
export async function sayfaSahibi(yazan: string): Promise<void> {
  const db = await depoAc();
  if (!db) return;
  const once = await istek(db.transaction(DURUM, "readonly").objectStore(DURUM).get("yazan")) as string | undefined;
  if (once === yazan) return;
  await sayfalariSil();
  await istek(db.transaction(DURUM, "readwrite").objectStore(DURUM).put(yazan, "yazan"));
}

/** kaç sayfa saklı (pencerede "bağlantısız açılabilir: n sayfa") */
export async function sayfaSayisi(): Promise<number> {
  const db = await depoAc();
  if (!db) return 0;
  return istek(db.transaction(SAYFALAR, "readonly").objectStore(SAYFALAR).count());
}
