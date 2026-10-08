/* ÇEVRİMDIŞI ÇIKIŞ KUYRUĞU (394; ARKA-UC §4.3–4.5, 09-D1 / D2, maket Z4 "cihazda yapılan iş hemen uygulanmış görünür ve kuyruğa yazılır; bağlantı
   gelince sırayla gider") — tarayıcıda. İş cihaz deposuna şifreli yazılır (depo.ts); bağlantı gelince /api/islem'e SIRAYLA gider, sunucu her
   kimliği bir kez işler (392). Kurallar:
   · Aynı rapor için tek bekleyen iş: yeni Kaydet / Onaya gönder eskisinin yerine geçer (aynı sayfada aynı sürümden yazılır — ikisi sırayla gitse
     ikincisi kendi kendisiyle çakışırdı). Onaya gönder kaydı da içerir.
   · Sonuçlar görünür, sessiz kayıp yok: tamam → kuyruktan çıkar · eksik (kaydedildi, gönderilmedi) · çakışma (başka yerde değişti — kullanıcı
     "benimkini yaz" ya da "sunucudakini kullan" der; benimkini yaz sunucunun güncel sürümüyle YENİ kimlikle gider) · yetki / kayıt yok · başka
     hesapla yazılmış (o hesapla girilince gider).
   · Ağ yoksa, oturum kapandıysa ya da sunucu düştüyse durur, sonra yeniden dener (bağlantı gelince, sayfa açılınca, dakikada bir).
   Depo yoksa (gizli pencere) iş yalnız bu sayfada bellekte tutulur ve söylenir. */
import { coz, depoAc, isleriOku, isSil, isYaz, sifrele, type DepoIsi } from "./depo.ts";

export type KuyrukTuru = "rapor.kaydet" | "rapor.gonder";
/** gönderilen işin sonucu — window "probata-islem" olayı (ekran tazelenir; eksikse alanlar işaretlenir) */
export interface KuyrukSonucOlayi { kayit: string; tur: KuyrukTuru; durum: string; ileti: string | null; eksikler: { bolum: string; alan: string; ad: string }[] | null }
export type IsDurumu = DepoIsi["durum"];
/** ekranda gösterilen (içeriksiz) */
export interface KuyrukIsi { id: string; tur: KuyrukTuru; kayit: string; ad: string; zaman: string; durum: IsDurumu; ileti: string | null }
export interface KuyrukDurumu {
  isler: readonly KuyrukIsi[];
  /** cihaz deposu yok: bekleyenler yalnız bu sayfada */
  depoYok: boolean;
  /** oturum kapandı: giriş yapınca gider */
  oturum: boolean;
  gonderiliyor: boolean;
  /** cihaz saati sunucudan bu kadar dakika sapıyor (10'dan fazlaysa) */
  saatFarkiDk: number | null;
}

type Bellek = DepoIsi & { girdi?: unknown };
let bellek: Bellek[] = [];
let durum: KuyrukDurumu = { isler: [], depoYok: false, oturum: false, gonderiliyor: false, saatFarkiDk: null };
let yazan = "";
let yuklendi: Promise<void> | null = null;
const dinleyenler = new Set<() => void>();

const yayinla = (d: Partial<KuyrukDurumu> = {}) => {
  durum = { ...durum, ...d, isler: bellek.map(({ id, tur, kayit, ad, zaman, durum: x, ileti }) => ({ id, tur: tur as KuyrukTuru, kayit, ad, zaman, durum: x, ileti })) };
  for (const f of dinleyenler) f();
};
export const kuyrukAbone = (f: () => void) => { dinleyenler.add(f); return () => { dinleyenler.delete(f); }; };
export const kuyrukAnlik = () => durum;
const BOS: KuyrukDurumu = { isler: [], depoYok: false, oturum: false, gonderiliyor: false, saatFarkiDk: null };
export const kuyrukSunucuAnlik = () => BOS;

/** işi yazanın etiketi (oturumdaki kişi — sunucudan; kabuk koyar) */
export function kuyrukYazani(etiket: string) { yazan = etiket; }

function yukle(): Promise<void> {
  yuklendi ??= (async () => {
    const db = await depoAc();
    if (!db) { yayinla({ depoYok: true }); return; }
    bellek = await isleriOku(db);
    yayinla();
  })();
  return yuklendi;
}

/** işi kuyruğa yazar (aynı raporun bekleyen işinin yerine) ve bağlantı varsa göndermeyi dener */
export async function kuyrugaEkle(g: { tur: KuyrukTuru; kayit: string; surum: number; girdi: unknown; ad: string }): Promise<void> {
  await yukle();
  const db = await depoAc();
  const eski = bellek.filter((x) => x.kayit === g.kayit && x.durum !== "baska_hesap");
  const i: Bellek = {
    id: crypto.randomUUID(), tur: g.tur, kayit: g.kayit, yazan, surum: g.surum, zaman: new Date().toISOString(), ad: g.ad, durum: "bekliyor",
    ileti: null, guncel: null, sira: Date.now(), iv: new Uint8Array(0), sifreli: new ArrayBuffer(0),
  };
  if (db) Object.assign(i, await sifrele(db, g.girdi));
  else i.girdi = g.girdi;
  if (db) { await isYaz(db, i); for (const x of eski) await isSil(db, x.id); }
  bellek = [...bellek.filter((x) => !eski.includes(x)), i];
  yayinla();
  void kuyrukGonder();
}

/** kullanıcı kaldırdı (eksik / hata bilgisi okundu, ya da çakışmada "sunucudakini kullan") */
export async function kuyruktanCikar(id: string): Promise<void> {
  const db = await depoAc();
  if (db) await isSil(db, id);
  bellek = bellek.filter((x) => x.id !== id);
  yayinla();
}

/** rapor bağlantılıyken kaydedildi / gönderildi: o kaydın bilgi amaçlı işleri (eksik, yapılamadı) kalkar — çakışma ve bekleyenler kalır */
export async function kayitBilgileriniKapat(kayit: string): Promise<void> {
  await yukle();
  for (const x of bellek.filter((y) => y.kayit === kayit && (y.durum === "eksik" || y.durum === "hata"))) await kuyruktanCikar(x.id);
}

/** çakışmada "benimkini yaz": aynı içerik, sunucunun güncel sürümüyle, yeni kimlikle (açık seçim — sessiz ezme değil) */
export async function benimkiniYaz(id: string): Promise<void> {
  const x = bellek.find((y) => y.id === id);
  if (!x || x.durum !== "cakisma" || x.guncel === null) return;
  const db = await depoAc();
  const girdi = db ? await coz(db, x) : x.girdi;
  await kuyruktanCikar(id);
  await kuyrugaEkle({ tur: x.tur as KuyrukTuru, kayit: x.kayit, surum: x.guncel, girdi, ad: x.ad });
}

/** başka hesapla yazılmış ya da kimliği çakışmış işi yeniden dener (yeni kimlik, aynı sürüm) */
export async function yenidenDene(id: string): Promise<void> {
  const x = bellek.find((y) => y.id === id);
  if (!x) return;
  const db = await depoAc();
  const girdi = db ? await coz(db, x) : x.girdi;
  await kuyruktanCikar(id);
  await kuyrugaEkle({ tur: x.tur as KuyrukTuru, kayit: x.kayit, surum: x.surum, girdi, ad: x.ad });
}

const ILETI: Record<string, string> = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  yok: "Rapor bulunamadı (silinmiş ya da size açık değil).",
  cakisma: "Rapor bu cihazda yazılırken başka yerde değiştirildi.",
  baska_hesap: "Bu iş başka bir hesapla yazıldı; o hesapla girilince gönderilir.",
  kimlik: "İşin kimliği çakıştı; yeniden gönderin.",
};

type Sonuc = { durum: string; hatalar?: Record<string, string>; eksikler?: { bolum: string; alan: string; ad: string }[]; neden?: string };
async function guncelle(x: Bellek, d: Partial<Bellek>) {
  Object.assign(x, d);
  const db = await depoAc();
  if (db) await isYaz(db, x);
}

/** sırayla gönderir; ağ yok / oturum kapalı / sunucu düştüyse durur. Sonuç: gönderilen iş sayısı */
let calisiyor = false;
export async function kuyrukGonder(): Promise<number> {
  await yukle();
  if (calisiyor || (typeof navigator !== "undefined" && navigator.onLine === false)) return 0;
  calisiyor = true;
  yayinla({ gonderiliyor: true });
  let n = 0;
  try {
    const db = await depoAc();
    for (const x of [...bellek]) {
      if (x.durum !== "bekliyor") continue;
      const girdi = db ? await coz(db, x) : x.girdi;
      let y: Response;
      try {
        y = await fetch("/api/islem", {
          method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { "content-type": "application/json", "x-probata-saat": String(Date.now()) },
          body: JSON.stringify({ id: x.id, tur: x.tur, kayit: x.kayit, yazan: x.yazan, surum: x.surum, girdi, zaman: x.zaman }),
        });
      } catch { break; }   // ağ yok: sonra
      if (y.status === 401) { yayinla({ oturum: true }); break; }
      if (y.status === 403 || y.status === 426 || y.status >= 500) break;   // köken / eski sürüm / sunucu: sonra (sayfa yenilenince)
      yayinla({ oturum: false });
      const j = await y.json().catch(() => ({})) as { tekrar?: boolean; sonuc?: Sonuc; guncel?: number | null; saatFarkiDk?: number; hata?: string };
      if (y.status === 409) {
        await guncelle(x, { durum: j.hata === "baska_hesap" ? "baska_hesap" : "hata", ileti: ILETI[j.hata ?? ""] ?? "İş gönderilemedi." });
        continue;
      }
      if (!y.ok || !j.sonuc) { await guncelle(x, { durum: "hata", ileti: "İş gönderilemedi (biçim); raporu açıp yeniden kaydedin." }); continue; }
      if (typeof j.saatFarkiDk === "number") yayinla({ saatFarkiDk: j.saatFarkiDk });
      const s = j.sonuc;
      if (s.durum === "tamam") {
        await kuyruktanCikar(x.id);
        n++;
      } else if (s.durum === "eksik") {
        await guncelle(x, { durum: "eksik", ileti: `Rapor kaydedildi, onaya gönderilmedi: ${s.eksikler?.length ?? 0} zorunlu alan boş.` });
      } else if (s.durum === "cakisma") {
        await guncelle(x, { durum: "cakisma", ileti: ILETI.cakisma, guncel: typeof j.guncel === "number" ? j.guncel : null });
      } else {
        const ilk = s.hatalar ? Object.values(s.hatalar)[0] : undefined;
        await guncelle(x, { durum: "hata", ileti: s.neden ?? ilk ?? ILETI[s.durum] ?? "İş yapılamadı." });
      }
      const olay: KuyrukSonucOlayi = { kayit: x.kayit, tur: x.tur as KuyrukTuru, durum: s.durum, ileti: s.durum === "tamam" ? null : x.ileti, eksikler: s.eksikler ?? null };
      window.dispatchEvent(new CustomEvent("probata-islem", { detail: olay }));
    }
  } finally {
    calisiyor = false;
    yayinla({ gonderiliyor: false });
  }
  return n;
}

/** kabuk açılınca bir kez: depodan yükler, bağlantı gelince ve dakikada bir gönderir */
let basladi = false;
export function kuyrukBaslat(): () => void {
  if (basladi) return () => undefined;
  basladi = true;
  void yukle().then(() => kuyrukGonder());
  const cevrim = () => { void kuyrukGonder(); };
  const durumDegisti = () => yayinla();
  window.addEventListener("online", cevrim);
  window.addEventListener("offline", durumDegisti);
  const zaman = window.setInterval(() => { if (bellek.some((x) => x.durum === "bekliyor")) void kuyrukGonder(); }, 60_000);
  return () => { basladi = false; window.removeEventListener("online", cevrim); window.removeEventListener("offline", durumDegisti); window.clearInterval(zaman); };
}
