/* KİRACI KAYDI ÖNBELLEĞİ (FIRMA-VT §5.1, FV3) — saf: veritabanına, ağa dokunmaz; ortamı yalnız onbellekSuresi'nin varsayılan değerinde okur.
   Her istekte merkez sorulmasın diye alt alan adının (ve firma kimliğinin) çözümü — firma_coz / firma_coz_id, src/server/db/merkez.ts — süreç içinde
   kısa süre tutulur (src/server/db/firma-havuzu.ts):
   · olumlu sonuç PROBATA_KAYIT_ONBELLEK_SN saniye (5–60, varsayılan 15): dondurulan / bakıma alınan firma bu örnekte en çok bu kadar bayat kalır —
     o pencerede giriş ve oturum yine YOK (dondurmanın ikinci kilidi: src/server/kimlik/oturum.ts ETKIN_FIRMA);
   · olumsuz sonuç ("böyle etkin firma yok") 5 sn: yeni açılan firma en geç 5 sn'de bulunur, olmayan adlar merkezi yormaz;
   · en çok 2 000 kayıt; dolunca en eski KULLANILAN düşer (LRU — Map'in ekleme sırası, okununca sona);
   · aynı anda aynı kayıt için gelen istekler tek yüklemeyi bekler (tek uçuş); yükleme HATASI önbelleğe girmez (yukarı gider);
   · temizle: yönetim işlemi (firma aç, dondur, etkinleştir, geçici parola) aynı örnekte hemen boşaltır; sil: tek anahtar; kosuldaSil: kaydı
     merkezden yeniden okunan firmanın bayat kayıtları (bağlantı reddi — src/server/db/firma-havuzu.ts).
   · Uçuştaki yüklemenin sonucunu YALNIZ hâlâ o anahtarın kayıtlı uçuşu yazar: sil / temizle uçuşu düşürür (dondurmadan önce okunmuş "etkin" kayıt
     geri dönmez). kosuldaSil uçuşları düşürmez — öteki firmaların yüklemesi boşa gitmez —, yalnız sonucu koşulu tutan uçuş yazmaz.
     2026-10-15 (FV3 incelemesi): önce tek bir kuşak sayacı vardı; bir firmanın bağlantı reddi (kosuldaSil) BÜTÜN firmaların uçuştaki yüklemelerini
     boşa çıkarıyordu (komşu firmayı etkileyen bozulma).
   Kilit: tests/kayit-onbellek.test.ts · olumsuz kanıt tests/bozan/kayit-onbellek.bozan.ts. */

export const KAYIT_ONBELLEK = { olumluSn: 15, olumsuzSn: 5, enCok: 2000, enAzSn: 5, enCokSn: 60 } as const;

/** olumlu sonucun süresi (sn): PROBATA_KAYIT_ONBELLEK_SN, 5–60 tam sayı; yoksa 15. Geçersiz değer HATA (sessizce varsayılana düşmez). */
export function onbellekSuresi(e: Record<string, string | undefined> = process.env): number {
  const v = e.PROBATA_KAYIT_ONBELLEK_SN;
  if (v === undefined || v === "") return KAYIT_ONBELLEK.olumluSn;
  const n = Number(v);
  if (!Number.isInteger(n) || n < KAYIT_ONBELLEK.enAzSn || n > KAYIT_ONBELLEK.enCokSn) {
    throw new Error(`PROBATA_KAYIT_ONBELLEK_SN ${KAYIT_ONBELLEK.enAzSn}–${KAYIT_ONBELLEK.enCokSn} arası tam saniye olmalı.`);
  }
  return n;
}

export interface KayitOnbellegi<T> {
  /** süresi dolmamış kayıt: { deger } (olumsuz sonuçta deger null); yoksa undefined. Okunan kayıt "en son kullanılan" olur. */
  al(anahtar: string): { deger: T | null } | undefined;
  koy(anahtar: string, deger: T | null): void;
  /** önbellekte yoksa yükler; aynı anda gelenler tek yüklemeyi bekler; yükleme hatası önbelleğe girmez */
  getir(anahtar: string, yukle: () => Promise<T | null>): Promise<T | null>;
  /** kaydı ve uçuştaki yüklemesini düşürür (yükleme sonucu yazılmaz) */
  sil(anahtar: string): void;
  /** koşulu tutan bütün olumlu kayıtları siler; uçuştaki yüklemeler sürer, sonucu koşulu tutan önbelleğe yazılmaz */
  kosuldaSil(kosul: (deger: T) => boolean): void;
  temizle(): void;
  readonly boyut: number;
}

export interface OnbellekAyari {
  /** olumlu sonucun süresi, sn (varsayılan 15) */
  olumluSn?: number;
  /** olumsuz sonucun süresi, sn (varsayılan 5) */
  olumsuzSn?: number;
  /** en çok kayıt (varsayılan 2 000) */
  enCok?: number;
  /** saat (ms) — testte elle ilerletilir */
  simdi?: () => number;
}

interface Ucus<T> { p: Promise<T | null>; kosullar: ((deger: T) => boolean)[] }

export function kayitOnbellegiKur<T>(a: OnbellekAyari = {}): KayitOnbellegi<T> {
  const olumlu = (a.olumluSn ?? KAYIT_ONBELLEK.olumluSn) * 1000;
  const olumsuz = (a.olumsuzSn ?? KAYIT_ONBELLEK.olumsuzSn) * 1000;
  const enCok = a.enCok ?? KAYIT_ONBELLEK.enCok;
  const simdi = a.simdi ?? Date.now;
  if (!(olumlu > 0) || !(olumsuz > 0) || !Number.isInteger(enCok) || enCok < 1) throw new Error("Kayıt önbelleği ayarı geçersiz.");
  const kayitlar = new Map<string, { deger: T | null; bitis: number }>();
  /** uçuştaki yüklemeler; kosullar: uçuş sürerken kosuldaSil ile silinenler (sonucu tutan yazılmaz) */
  const ucan = new Map<string, Ucus<T>>();

  const al = (anahtar: string): { deger: T | null } | undefined => {
    const k = kayitlar.get(anahtar);
    if (!k) return undefined;
    kayitlar.delete(anahtar);
    if (k.bitis <= simdi()) return undefined;
    kayitlar.set(anahtar, k);   // en son kullanılan sona
    return { deger: k.deger };
  };
  const koy = (anahtar: string, deger: T | null): void => {
    kayitlar.delete(anahtar);
    kayitlar.set(anahtar, { deger, bitis: simdi() + (deger === null ? olumsuz : olumlu) });
    while (kayitlar.size > enCok) kayitlar.delete(kayitlar.keys().next().value as string);
  };

  return {
    al,
    koy,
    getir(anahtar, yukle) {
      const v = al(anahtar);
      if (v) return Promise.resolve(v.deger);
      const u = ucan.get(anahtar);
      if (u) return u.p;
      const ucus: Ucus<T> = { p: Promise.resolve(null), kosullar: [] };
      ucus.p = Promise.resolve().then(yukle)
        .then((d) => {
          const kayitli = ucan.get(anahtar) === ucus;
          if (kayitli && !(d !== null && ucus.kosullar.some((k) => k(d)))) koy(anahtar, d);
          return d;
        })
        .finally(() => { if (ucan.get(anahtar) === ucus) ucan.delete(anahtar); });
      ucan.set(anahtar, ucus);
      return ucus.p;
    },
    sil(anahtar) {
      kayitlar.delete(anahtar);
      ucan.delete(anahtar);
    },
    kosuldaSil(kosul) {
      for (const [anahtar, k] of [...kayitlar]) if (k.deger !== null && kosul(k.deger)) kayitlar.delete(anahtar);
      for (const u of ucan.values()) u.kosullar.push(kosul);
    },
    temizle() {
      kayitlar.clear();
      ucan.clear();
    },
    get boyut() { return kayitlar.size; },
  };
}
