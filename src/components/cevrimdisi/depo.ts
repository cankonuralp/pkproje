/* ÇEVRİMDIŞI CİHAZ DEPOSU (394; ARKA-UC K4 "çevrimdışı yazılan her şey cihazın kalıcı deposuna yazılır (tarayıcıda IndexedDB), şifreli; RAM yalnız
   ekranda açık olanı tutar", §4.3, maket Z4) — kuyruktaki işler sayfa kapansa, telefon belleği boşaltsa da kalır. İşin içeriği (formun hâli)
   AES-GCM ile şifreli yazılır; anahtar cihazda üretilir, DIŞARI ALINAMAZ (extractable: false — sayfa kodu bile ham anahtarı okuyamaz), aynı
   depoda saklanır. Depo kökene bağlıdır: her firmanın alt alan adı ayrı depo. Tarayıcı depoya izin vermiyorsa (gizli pencere, kapalı site verisi)
   null döner — kuyruk o zaman yalnız bu sayfada bellekte tutar ve kullanıcıya söyler (sessiz kayıp yok). */

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
      r.onsuccess = () => coz(r.result);
      r.onerror = () => coz(null);
      r.onblocked = () => coz(null);
    } catch { coz(null); }
  });
  return acik;
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
  const t = db.transaction(ISLER, "readwrite");
  await istek(t.objectStore(ISLER).put(i));
}

export async function isSil(db: IDBDatabase, id: string): Promise<void> {
  const t = db.transaction(ISLER, "readwrite");
  await istek(t.objectStore(ISLER).delete(id));
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
