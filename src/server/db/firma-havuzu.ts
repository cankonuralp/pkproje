/* ══ FİRMA BAŞINA HAVUZ VE YÖNLENDİRME (FIRMA-VT §3.4, §5.1–5.2, FV3) ═══════════════════════════════════════════════════════════════════════
   Tek boğaz: istekKiracisi (adresten) → firmaKaydi (önbellekli firma_coz, merkezde) → kiraciHavuzu(kiraci). Modüller ve kiraciIcinde'nin imzası
   değişmez; yalnız hangi havuzun verildiği:
   · ortak firma (vt yok) → merkez havuzu (havuz.ts merkezHavuzu — bugünkü tek havuz);
   · kendi projeli firma (vt: merkezdeki bağlantı kaydı, ŞİFRELİ) → o firmanın havuzu. Kayıt baglanti.ts kayittanBaglanti'dan geçer (sunucu izin
     listesi, TLS + kilitli kök, yalnız uygulama rolü, yerel adres yalnız merkez de yereldeyse); parola YALNIZ havuz kurulurken çözülür (ana anahtar
     PROBATA_SIR_ANAHTARI), istek nesnesinde şifreli kalır, günlüğe / hataya yazılmaz (pg parolayı ayarında numaralanamaz tutar).
   Havuzlar: firma başına en çok PROBATA_FIRMA_HAVUZ (1–5, varsayılan 3) bağlantı, bağlanma ve boşta bekleme 5 sn (kiraci.ts havuzSecenekleri);
   örnek başına PROBATA_FIRMA_HAVUZ_SAYI (1–200, varsayılan 32) havuz. Sınır aşılınca en eski kullanılan BOŞTAKİ havuz düşer (LRU); meşgul havuz
   (açık işlemi ya da sırada bekleyeni olan) atılmaz — sınır geçici aşılır, havuz boşalınca sonraki çağrıda düşer; hepsi meşgulse SERT sınır iki katı
   (orada en eski kullanılan meşgul de olsa düşer). Düşenin end()'i yanıt gittikten sonra da beklenir (Vercel waitUntil — havuz.ts
   istekSonrasinaBirak); her havuz Vercel'in boşta bekleme sayacına takılır (vercelBosBekle).
   Havuzun kimliği firma : ref : sürüm — sürüm (firma_vt.surum, bağlantı her değiştiğinde artar) yalnız İLERİ gider: eski kayıtla gelen istek
   yeni havuzu bozmaz. Düşürülmüş havuzda bağlantı almamış istek (elinde eski nesne kalan ya da SIRADA bekleyen) BEKLEMEDEN firmanın güncel havuzuna
   geçer — pg-pool kapanan havuzun sırasındakine hizmet etmez, bağlanma süresi (5 sn) dolana dek bekletirdi; TEK atlama: geçtiği havuz da düşürülürse
   hata (art arda sekme yok).
   Bağlantı reddi — parola (28P01), yetki tanımı (28000), sunucu reddi (ECONNREFUSED): firmanın kaydı merkezden TAZE okunur (firma başına tek uçuş,
   en çok 5 sn'de bir: art arda düşen istekler merkezi yormaz; sonuç kayıt önbelleğine) ve BİR kez daha bağlanılır — merkezde daha yeni sürüm varsa
   onun havuzuyla. Parola / rol reddinde merkezdeki sürüm aynıysa İKİNCİ DENEME YOK (aynı parolayla ikinci hatalı giriş Supabase'in hatalı parola
   yasağına iki kat yaklaştırırdı), ilk hata yukarı; sunucu reddinde aynı havuzla bir kez daha. Yeniden deneme BAĞLANTI KURMADA (iş başlamadan):
   iş iki kez koşmaz, yan etkili iş tekrarlanmaz. Firma artık çözülmüyorsa (dondu, bakımda) havuzu düşer, ilk hata yukarı.
   2026-10-15 (FV3 incelemesi): önce aynı sürümde de yeni havuz kurulup ikinci kez bağlanılıyordu, merkez her düşen istekte önbelleksiz soruluyordu;
   LRU meşgul havuzu da atıyordu ve sıradaki istek 5 sn bekliyordu.
   Son kapı veritabanında (vt_firma_dogrula, göç 0095): kod yanlış havuzu verse de başka firmanın işi 42501 ile reddedilir.
   Kayıt önbelleği: src/server/kiraci/kayit-onbellek.ts (olumlu 15 sn, olumsuz 5 sn, 2 000); yönetim işlemi aynı örnekte boşaltır (firmaKayitlariniUnut).
   Kilit: tests/firma-vt.test.ts (iki küme, üç veritabanı) · tests/firma-havuzu.test.ts (saf; sahte sunucular) · olumsuz kanıt
   tests/bozan/firma-vt.bozan.ts, tests/bozan/firma-havuzu.bozan.ts. */
import pg from "pg";
import { anaAnahtar } from "../ayar/sir.ts";
import { KAYIT_ONBELLEK, kayitOnbellegiKur, onbellekSuresi, type KayitOnbellegi } from "../kiraci/kayit-onbellek.ts";
import { kayittanBaglanti, merkezYerelMi, type FirmaVtKaydi } from "./baglanti.ts";
import { istekSonrasinaBirak, merkezHavuzu, vercelBosBekle } from "./havuz.ts";
import { havuzHatasiniDinle, havuzSecenekleri, type Havuz } from "./kiraci.ts";
import { firmaCoz, firmaCozId, type FirmaCozumu } from "./merkez.ts";

/** havuzun hangi veritabanına gideceği: kiracının kimliği + (kendi projelide) merkezdeki kayıt — src/server/kiraci/coz.ts IstekKiracisi bunu taşır */
export interface KiraciYeri { firmaId: string; vt?: FirmaVtKaydi }

export const FIRMA_HAVUZ = { baglanti: 3, enCokBaglanti: 5, havuz: 32, enCokHavuz: 200 } as const;

/** ortamdan havuz sınırları: PROBATA_FIRMA_HAVUZ (1–5, varsayılan 3), PROBATA_FIRMA_HAVUZ_SAYI (1–200, varsayılan 32). Geçersiz değer HATA. */
export function firmaHavuzAyari(e: Record<string, string | undefined> = process.env): { firmaHavuz: number; havuzSayisi: number } {
  const sayi = (ad: string, ust: number, varsayilan: number) => {
    const v = e[ad];
    if (v === undefined || v === "") return varsayilan;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > ust) throw new Error(`${ad} 1–${ust} arası tam sayı olmalı.`);
    return n;
  };
  return { firmaHavuz: sayi("PROBATA_FIRMA_HAVUZ", FIRMA_HAVUZ.enCokBaglanti, FIRMA_HAVUZ.baglanti), havuzSayisi: sayi("PROBATA_FIRMA_HAVUZ_SAYI", FIRMA_HAVUZ.enCokHavuz, FIRMA_HAVUZ.havuz) };
}

const hataKodu = (h: unknown): unknown => (h && typeof h === "object" ? (h as { code?: unknown }).code : undefined);
/** bağlanırken kayıt merkezden yenilenip BİR kez daha denenen hatalar: parola (28P01), yetki tanımı (28000 — rol / havuzcu kullanıcısı tanınmadı),
    sunucu bağlantıyı reddetti (ECONNREFUSED — sunucu / kapı değişmiş olabilir) */
const YENIDEN = new Set(["28P01", "28000", "ECONNREFUSED"]);
export const yenidenDenenir = (h: unknown): boolean => { const k = hataKodu(h); return typeof k === "string" && YENIDEN.has(k); };
/** parola / rol reddi: merkezde daha yeni sürüm yoksa aynı bilgiyle ikinci kez denenmez */
const PAROLA_REDDI = new Set(["28P01", "28000"]);
export const parolaReddi = (h: unknown): boolean => { const k = hataKodu(h); return typeof k === "string" && PAROLA_REDDI.has(k); };

/** havuz kimliği (günlük ve test için; sır yok) */
export const havuzKimligi = (k: FirmaVtKaydi): string => `${k.firmaId}:${k.ref ?? "yerel"}:${k.surum}`;

type Geri = (hata: Error | undefined, istemci: pg.PoolClient | undefined, birak: (release?: Error | boolean) => void) => void;
interface Yenileyici {
  /** firmanın şu anki havuzu (düşürülmüş havuzun yerine; gerekirse kurulur) */
  guncel(kayit: FirmaVtKaydi): FirmaHavuzu;
  /** bağlantı reddinde: kayıt merkezden taze okunur; yeniden denenecek havuz — denenmeyecekse ilk hata fırlatılır */
  yenile(eski: FirmaHavuzu, hata: unknown): Promise<FirmaHavuzu>;
}

/** kendi projeli firmanın havuzu: pg havuzu + bağlanırken BİR kez yenileme + düşürülünce sıradakini güncel havuza geçirme. Bağlantı yalnız
    connect'te kurulur (kiraciIcinde, merkezOku, pool.query hepsi oradan geçer); iş (sorgular) bağlantı alındıktan sonra koştuğu için yeniden deneme
    işi tekrarlamaz. */
class FirmaHavuzu extends pg.Pool {
  readonly kayit: FirmaVtKaydi;
  readonly kimlik: string;
  readonly #yenileyici: Yenileyici;
  /** bağlantı bekleyen istekler: havuz düşürülünce (end) hemen bırakılır — bağlanma süresini beklemeden güncel havuza geçerler. İstek başına ayrı
      söz (uzun ömürlü tek söze her istek tepki eklese meşgul havuzda bellek birikirdi); bağlantı alınınca kümeden çıkar. */
  readonly #bekleyenler = new Set<() => void>();

  constructor(secenek: pg.PoolConfig, kayit: FirmaVtKaydi, yenileyici: Yenileyici) {
    super(secenek);
    this.kayit = kayit;
    this.kimlik = havuzKimligi(kayit);
    this.#yenileyici = yenileyici;
  }

  end(): Promise<void>;
  end(geri: () => void): void;
  end(geri?: () => void): Promise<void> | void {
    const r = geri ? super.end(geri) : super.end();
    for (const b of this.#bekleyenler) b();
    this.#bekleyenler.clear();
    return r;
  }

  connect(): Promise<pg.PoolClient>;
  connect(geri: Geri): void;
  connect(geri?: Geri): Promise<pg.PoolClient> | void {
    const p = this.baglan(0, false);
    if (!geri) return p;
    p.then((c) => geri(undefined, c, c.release), (h: Error) => geri(h, undefined, () => {}));
  }

  /** atlama: düşürülmüş havuzdan güncele kaç kez geçildi (en çok 1); yenilendi: kayıt bir kez yenilendi — ikinci kez yenilenmez, hata yukarı */
  async baglan(atlama: number, yenilendi: boolean): Promise<pg.PoolClient> {
    if (this.ending) return this.#guncelden(atlama, yenilendi);
    const istek = super.connect();
    let birak = () => {};
    const dusuruldu = new Promise<undefined>((coz) => { birak = () => coz(undefined); });
    this.#bekleyenler.add(birak);
    let c: pg.PoolClient | undefined;
    try {
      c = await Promise.race([istek, dusuruldu]);
    } catch (h) {
      this.#bekleyenler.delete(birak);
      /* bağlanırken havuz düşürüldüyse (LRU, yeni sürüm) bağlantı hiç alınmadı: firmanın güncel havuzuna */
      if (this.ending) return this.#guncelden(atlama, yenilendi);
      if (yenilendi || !yenidenDenenir(h)) throw h;
      return (await this.#yenileyici.yenile(this, h)).baglan(atlama, true);
    }
    this.#bekleyenler.delete(birak);
    if (c) return c;
    /* sırada beklerken havuz düşürüldü: istek sonradan bağlantı alırsa hemen geri bırakılır (kapanan havuzda bağlantı kapanır), zaman aşımı yutulur */
    istek.then((k) => k.release(), () => {});
    return this.#guncelden(atlama, yenilendi);
  }

  /** düşürülmüş havuz yerine firmanın güncel havuzu (gerekirse kurulur) — tek atlama */
  #guncelden(atlama: number, yenilendi: boolean): Promise<pg.PoolClient> {
    if (atlama >= 1) return Promise.reject(new Error("Firma havuzu art arda düşürüldü; istek yeniden denenmeli."));
    const g = this.#yenileyici.guncel(this.kayit);
    if (g === this) return Promise.reject(new Error("Firma havuzu kapanmış."));
    return g.baglan(atlama + 1, yenilendi);
  }
}

export interface Yonlendirici {
  /** alt alan adındaki kısa addan firma (önbellekli firma_coz) */
  kayit(kisaAd: string): Promise<FirmaCozumu | null>;
  /** firma kimliğinden (önbellekli firma_coz_id — arka plan işleri) */
  kayitKimlikle(id: string): Promise<FirmaCozumu | null>;
  /** kiracının havuzu: ortak firmaya merkez, kendi projeliye kendi havuzu */
  havuz(k: KiraciYeri): Havuz;
  /** kendi projeli firmanın havuzu (kayıttan) */
  firmaHavuzu(kayit: FirmaVtKaydi): Havuz;
  /** kimlikten havuz (firma yok / etkin değil / bakımda → null) */
  havuzKimlikle(id: string): Promise<Havuz | null>;
  /** kayıt önbelleğini boşaltır (havuzlar kalır; bayat kayıtla yeni havuz kurulmaz) */
  unut(): void;
  /** açık firma havuzlarının kimlikleri, en eski kullanılan önde (sır yok) */
  readonly acikHavuzlar: readonly string[];
  /** bütün firma havuzlarını kapatır (test, süreç sonu) */
  kapat(): Promise<void>;
}

export interface YonlendiriciAyari {
  merkez: () => Havuz;
  /** ana anahtar — yalnız havuz kurulurken çağrılır */
  anahtar: () => Buffer;
  /** merkez yerelde mi (yerel adresli firma veritabanına yalnız o zaman izin — baglanti.ts) */
  merkezYerel: boolean;
  /** firma başına bağlantı (1–5) */
  firmaHavuz?: number;
  /** örnek başına havuz (sert sınır iki katı) */
  havuzSayisi?: number;
  onbellek?: KayitOnbellegi<FirmaCozumu>;
  /** merkezin çözücüsü (varsayılan firma_coz / firma_coz_id merkez havuzunda) */
  coz?: { ad(kisaAd: string): Promise<FirmaCozumu | null>; id(id: string): Promise<FirmaCozumu | null> };
  /** düşürülen havuzun kapanışı (yayında waitUntil) */
  birak?: (p: Promise<unknown>) => void;
  /** her firma havuzunun "release"inde (yayında vercelBosBekle) */
  bosBekle?: () => void;
  /** saat (ms) — bağlantı reddinden sonraki taze okumanın 5 sn'si; testte elle ilerletilir */
  simdi?: () => number;
}

export function yonlendiriciKur(a: YonlendiriciAyari): Yonlendirici {
  const firmaHavuz = a.firmaHavuz ?? FIRMA_HAVUZ.baglanti, havuzSayisi = a.havuzSayisi ?? FIRMA_HAVUZ.havuz;
  if (!Number.isInteger(firmaHavuz) || firmaHavuz < 1 || firmaHavuz > FIRMA_HAVUZ.enCokBaglanti) throw new Error("Firma havuzu 1–5 bağlantı olmalı.");
  if (!Number.isInteger(havuzSayisi) || havuzSayisi < 1) throw new Error("Firma havuzu sayısı en az 1 olmalı.");
  const sertSinir = havuzSayisi * 2;
  const onbellek = a.onbellek ?? kayitOnbellegiKur<FirmaCozumu>();
  const coz = a.coz ?? { ad: (k: string) => firmaCoz(a.merkez(), k), id: (i: string) => firmaCozId(a.merkez(), i) };
  const birak = a.birak ?? ((p: Promise<unknown>) => { p.catch(() => {}); });
  /** firma kimliği → havuz; Map sırası kullanım sırası (en eski önde) */
  const havuzlar = new Map<string, FirmaHavuzu>();
  /** bağlantı reddinden sonra merkezden TAZE okuma: firma başına tek uçuş ve en çok 5 sn'de bir (olumsuz sonuç da) */
  const tazeler = kayitOnbellegiKur<FirmaCozumu>({ olumluSn: KAYIT_ONBELLEK.olumsuzSn, olumsuzSn: KAYIT_ONBELLEK.olumsuzSn, simdi: a.simdi });

  /** havuzu listeden çıkarır ve kapatır (açık işlemler bitince bağlantılar kapanır; sıradaki ve yeni istek güncel havuza geçer) */
  const dusur = (h: FirmaHavuzu) => {
    if (havuzlar.get(h.kayit.firmaId) === h) havuzlar.delete(h.kayit.firmaId);
    if (!h.ending) birak(h.end());
  };
  /** açık işlemi (bağlanan, kullanılan bağlantı) ya da sırada bekleyeni olan havuz */
  const mesgul = (h: FirmaHavuzu) => h.waitingCount > 0 || h.totalCount > h.idleCount;
  /** sınır aşıldıysa en eski kullanılan BOŞTAKİ havuzlar düşer (meşgul havuzun işi ve sırası beklemesin); hepsi meşgulse sınır geçici aşılır, sert
      sınırda en eski kullanılan yine düşer. koru: o an verilen havuz. */
  function sinirla(koru: FirmaHavuzu): void {
    if (havuzlar.size <= havuzSayisi) return;
    for (const h of [...havuzlar.values()]) {
      if (havuzlar.size <= havuzSayisi) return;
      if (h !== koru && !mesgul(h)) dusur(h);
    }
    for (const h of [...havuzlar.values()]) {
      if (havuzlar.size <= sertSinir) return;
      if (h !== koru) dusur(h);
    }
  }

  /** kapat'tan sonra havuz kurulmaz (kapanışta bırakılan bekleyen istek yeni havuz açmasın) */
  let kapandi = false;

  function firmaHavuzu(kayit: FirmaVtKaydi): FirmaHavuzu {
    if (kapandi) throw new Error("Firma havuzları kapatıldı.");
    const varolan = havuzlar.get(kayit.firmaId);
    /* sürüm yalnız ileri: eşit ya da daha yeni havuz varsa o (eski kayıtla gelen istek yeni havuzu bozmaz) */
    if (varolan && !varolan.ending && varolan.kayit.surum >= kayit.surum) {
      havuzlar.delete(kayit.firmaId);
      havuzlar.set(kayit.firmaId, varolan);
      sinirla(varolan);
      return varolan;
    }
    /* izin listesi, TLS, rol denetimi parola ÇÖZÜLMEDEN; parola yalnız burada çözülür */
    const ayar = kayittanBaglanti(kayit, a.anahtar(), { merkezYerel: a.merkezYerel, enCok: firmaHavuz });
    const h = new FirmaHavuzu(havuzSecenekleri(ayar), kayit, yenileyici);
    havuzHatasiniDinle(h);
    if (a.bosBekle) h.on("release", a.bosBekle);
    if (varolan) dusur(varolan);
    havuzlar.set(kayit.firmaId, h);
    sinirla(h);
    return h;
  }

  const kayitKimlikle = (id: string) => onbellek.getir(`k:${id}`, () => coz.id(id));
  /** kaydı merkezden taze okur (tek uçuş, 5 sn); firmanın bayat kayıtları önbellekten düşer, tazesi yazılır (kısa ad ve kimlik) */
  const tazele = (id: string) => tazeler.getir(id, async () => {
    const c = await coz.id(id);
    onbellek.kosuldaSil((x) => x.id === id);
    if (c) { onbellek.koy(`k:${id}`, c); onbellek.koy(`a:${c.kisaAd}`, c); } else onbellek.koy(`k:${id}`, null);
    return c;
  });

  const yenileyici: Yenileyici = {
    guncel: (kayit) => firmaHavuzu(kayit),
    async yenile(eski, hata) {
      const c = await tazele(eski.kayit.firmaId);
      /* firma artık çözülmüyorsa (dondu, bakımda, kurulumu bozuldu) ya da ortak veritabanına dönmüşse havuzu düşer, yeniden bağlanılmaz */
      if (!c || c.vt !== "kendi") { dusur(eski); throw hata; }
      /* parola / rol reddi ve merkezde daha yeni kayıt yok: aynı bilgiyle ikinci deneme yok (havuz kalır; kayıt en erken 5 sn sonra yeniden okunur) */
      if (parolaReddi(hata) && c.kayit.surum <= eski.kayit.surum) throw hata;
      return firmaHavuzu(c.kayit);
    },
  };

  return {
    kayit: (kisaAd) => onbellek.getir(`a:${kisaAd}`, () => coz.ad(kisaAd)),
    kayitKimlikle,
    havuz(k) {
      if (!k.vt) return a.merkez();
      if (k.vt.firmaId !== k.firmaId) throw new Error("Kiracının veritabanı kaydı başka bir firmanın.");
      return firmaHavuzu(k.vt);
    },
    firmaHavuzu,
    async havuzKimlikle(id) {
      const c = await kayitKimlikle(id);
      if (!c) return null;
      return c.vt === "kendi" ? firmaHavuzu(c.kayit) : a.merkez();
    },
    unut: () => { onbellek.temizle(); tazeler.temizle(); },
    get acikHavuzlar() { return [...havuzlar.values()].map((h) => h.kimlik); },
    async kapat() {
      kapandi = true;
      const l = [...havuzlar.values()];
      havuzlar.clear();
      await Promise.all(l.filter((h) => !h.ending).map((h) => h.end()));
    },
  };
}

/* ── süreç örneği (yayın, yerel geliştirme) ──────────────────────────────────────────────────────────────────────────────────────────────── */
const g = globalThis as { __probataYonlendirici?: Yonlendirici };
function yonlendirici(): Yonlendirici {
  g.__probataYonlendirici ??= yonlendiriciKur({
    merkez: merkezHavuzu, anahtar: () => anaAnahtar(), merkezYerel: merkezYerelMi(), ...firmaHavuzAyari(process.env),
    onbellek: kayitOnbellegiKur<FirmaCozumu>({ olumluSn: onbellekSuresi(process.env) }), birak: istekSonrasinaBirak, bosBekle: vercelBosBekle,
  });
  return g.__probataYonlendirici;
}

/** alt alan adındaki kısa addan firma — önbellekli (src/server/kiraci/istek.ts istekKiracisi) */
export const firmaKaydi = (kisaAd: string): Promise<FirmaCozumu | null> => yonlendirici().kayit(kisaAd);
/** firma kimliğinden — önbellekli (arka plan işleri: FV5 / FV6) */
export const firmaKaydiKimlikle = (id: string): Promise<FirmaCozumu | null> => yonlendirici().kayitKimlikle(id);
/** kiracının havuzu — kiracının işi YALNIZ bununla (src/server/kimlik/istek.ts oturumIslemi, musteriIslemi …) */
export const kiraciHavuzu = (k: KiraciYeri): Havuz => yonlendirici().havuz(k);
/** kendi projeli firmanın havuzu (merkezdeki kayıttan) */
export const firmaHavuzu = (kayit: FirmaVtKaydi): Havuz => yonlendirici().firmaHavuzu(kayit);
/** firma kimliğinden havuz (arka plan işleri; firma çözülmezse null) */
export const firmaHavuzuKimlikle = (id: string): Promise<Havuz | null> => yonlendirici().havuzKimlikle(id);
/** yönetim işleminden sonra (firma aç, dondur, etkinleştir …): bu örnekteki kayıt önbelleği hemen boşalır. Örnek henüz kurulmadıysa bir şey yapmaz. */
export function firmaKayitlariniUnut(): void {
  g.__probataYonlendirici?.unut();
}
