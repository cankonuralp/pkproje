/* DEPO BAĞDAŞTIRICISI — tek arayüz (CLAUDE.md §2): yerelde klasör (data/depo); deneme yayınında VERİTABANI (347: PROBATA_DEPO=vt — Vercel'in
   klasörü geçici, içerik işlev örnekleri arasında kayboluyordu); 568: SUPABASE STORAGE (PROBATA_DEPO=supabase — supabase.ts; veritabanı deposu
   geçişte yedek: eski nesneler oradan okunur, gece işi taşır).
   FV5 (FIRMA-VT §5.7, 2026-10-16): depo() bir YÖNLENDİRİCİ — dosyanın deposu anahtardaki firmadan: ortak firma → ortamdaki depo (bugünkü),
   kendi projeli firma → o firmanın Supabase Storage'ı (merkezdeki kayıt; gizli anahtar şifreli, yalnız depo kurulurken çözülür; yedek yok —
   kendi projelinin veritabanı deposu boş kalır). KAPALI DÜŞER: firma çözülmezse (yok, dondurulmuş, kurulumda, bakımda) ya da kendi projeli
   firmanın deposu kurulmamışsa hata — ortak depoya düşülmez, bir firmanın dosyası başka firmanın deposuna yazılmaz / oradan okunmaz.
   Yalnız anahtar üreticisinin biçimindeki anahtar kabul edilir (yol aşma olamaz); listeleme arayüzde YOK (A1). Silme YALNIZ gece çöp işinin
   copSil'i (378, A5: dosya satırı çöpte 30 günü doldurup silindikten sonra; veritabanı deposu satır yoksa siler — 0069 depo_nesne_sil). Aynı
   anahtara ikinci kez yazılmaz (dosya değişmez — yeni dosya yeni anahtar).
   db: çağıranın açık işlemi (verilirse veritabanı deposu aynı işlemde yazar / okur — kayıtla birlikte geri alınır, havuzdan ikinci bağlantı
   alınmaz); klasör deposu kullanmaz. */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { anaAnahtar } from "../ayar/sir.ts";
import { depoBaglantisi, type FirmaVtKaydi } from "../db/baglanti.ts";
import { firmaKaydiKimlikle } from "../db/firma-havuzu.ts";
import { merkezHavuzu } from "../db/havuz.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";
import type { FirmaCozumu } from "../db/merkez.ts";
import { anahtarGecerli } from "./anahtar.ts";
import { supabaseDepo, supabaseOrtami } from "./supabase.ts";

/** gece taşımasının sonucu (568) */
export interface TasimaSonucu { tasinan: number; bayt: number; hatali: number; kalan: boolean }

export interface Depo {
  /** tur: içerik türü (Storage onu sunar; klasör ve veritabanı deposu saklamaz — tür dosya satırında) */
  yaz(anahtar: string, bayt: Uint8Array, db?: Sorgulayici, tur?: string): Promise<void>;
  oku(anahtar: string, db?: Sorgulayici): Promise<Uint8Array>;
  /** YALNIZ gece çöp işi (src/server/dosya/cop.ts): dosya satırı silindikten sonra nesneyi siler; nesne yoksa sessiz */
  copSil(anahtar: string, db?: Sorgulayici): Promise<void>;
  /** depoda kaydı olmayan nesne sayısı, oturumdaki firmada (A5: raporlanır, SİLİNMEZ); listelenemeyen depoda null */
  oksuzSay(db: Sorgulayici): Promise<number | null>;
  /** 568: kısa ömürlü imzalı adres (yalnız Storage); nesne Storage'da değilse null — çağıran içeriği kendisi akıtır */
  imzaliAdres?(anahtar: string, saniye: number, indir: string | null): Promise<string | null>;
  /** 568: veritabanı deposundan Storage'a gece taşıması (oturumdaki firmanın işleminde) */
  tasi?(db: Sorgulayici, sinir: { adet: number; bayt: number }): Promise<TasimaSonucu>;
}

export function klasorDepo(kok: string): Depo {
  const tam = resolve(kok);
  const yol = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    const y = resolve(join(tam, anahtar));
    if (!y.startsWith(tam + sep)) throw new Error("Geçersiz depo anahtarı");
    return y;
  };
  return {
    async yaz(anahtar, bayt) {
      const y = yol(anahtar);
      await mkdir(dirname(y), { recursive: true });
      await writeFile(y, bayt, { flag: "wx", mode: 0o600 });   // wx: varsa yazmaz
    },
    async oku(anahtar) {
      return new Uint8Array(await readFile(yol(anahtar)));
    },
    async copSil(anahtar) {
      await rm(yol(anahtar), { force: true });   // force: nesne yoksa (önceki koşu sildi) hata değil
    },
    async oksuzSay() {
      return null;   // klasör listelenmez (A1)
    },
  };
}

/** veritabanı deposu (0049 depo_nesne): anahtardaki firmanın kiracı işleminde; db verilirse onun işleminde (RLS anahtarın firmasını denetler) */
export function vtDepo(h: () => Havuz): Depo {
  const firma = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    return anahtar.split("/")[1];
  };
  const isle = <T,>(anahtar: string, db: Sorgulayici | undefined, is: (d: Sorgulayici) => Promise<T>) =>
    db ? is(db) : kiraciIcinde(h(), firma(anahtar), is);
  return {
    async yaz(anahtar, bayt, db) {
      firma(anahtar);
      await isle(anahtar, db, (d) => d.sorgu("INSERT INTO depo_nesne (anahtar, bayt) VALUES ($1, $2)", [anahtar, Buffer.from(bayt)]));
    },
    async oku(anahtar, db) {
      firma(anahtar);
      const r = await isle(anahtar, db, (d) => d.sorgu<{ bayt: Buffer }>("SELECT bayt FROM depo_nesne WHERE anahtar = $1", [anahtar]));
      if (!r.rows[0]) throw new Error("Depoda böyle bir nesne yok");
      return new Uint8Array(r.rows[0].bayt);
    },
    async copSil(anahtar, db) {
      firma(anahtar);
      await isle(anahtar, db, (d) => d.sorgu("SELECT depo_nesne_sil($1)", [anahtar]));
    },
    async oksuzSay(db) {
      return (await db.sorgu<{ n: number }>(
        "SELECT count(*)::int AS n FROM depo_nesne n WHERE NOT EXISTS (SELECT 1 FROM dosya d WHERE d.anahtar = n.anahtar)")).rows[0].n;
    },
  };
}

/** FV5: yönlendiricinin firmayı ve kendi projeli firmanın deposunu bulduğu yer (saf testte sahteleri verilir) */
export interface DepoYonlendirmeAyari {
  /** ortak firmaların deposu (ortamdan — depoSec) */
  ortak: Depo;
  /** firma kimliğinden çözüm (önbellekli firma_coz_id); null = firma yok, etkin değil, kurulumda ya da bakımda */
  kayit: (firmaId: string) => Promise<FirmaCozumu | null>;
  /** kendi projeli firmanın Storage'ı (kayıttan — gizli anahtar burada çözülür); depo kurulmadıysa null */
  firmaDeposu: (kayit: FirmaVtKaydi) => Depo | null;
  /** örnekte tutulan kendi projeli firma deposu (en eski kullanılan düşer); varsayılan 200 */
  enCok?: number;
}

const TASINACAK_YOK: TasimaSonucu = { tasinan: 0, bayt: 0, hatali: 0, kalan: false };

/** FV5 DEPO YÖNLENDİRİCİ: yaz / oku / copSil / imzaliAdres anahtarın 2. parçasındaki firmadan; oksuzSay / tasi çağıranın işlemindeki firmadan
    (gecerli_firma()). Kendi projeli firmanın deposu örnekte tutulur; sürüm yalnız ileri (bayat kayıtla gelen çağrı yeni depoyu bozmaz). tasi yalnız
    ortak depo taşıyorsa var (gece.ts depoTasimaIsi); kendi projelide taşınacak yok. */
export function yonlendiriciDepo(a: DepoYonlendirmeAyari): Depo {
  const enCok = a.enCok ?? 200;
  if (!Number.isInteger(enCok) || enCok < 1) throw new Error("Firma deposu sayısı en az 1 olmalı.");
  /** firma kimliği → kendi projeli firmanın deposu; Map sırası kullanım sırası (en eski önde) */
  const depolar = new Map<string, { kayit: FirmaVtKaydi; depo: Depo }>();

  async function firmaIcin(firmaId: string): Promise<{ depo: Depo; ortak: boolean }> {
    const c = await a.kayit(firmaId);
    if (!c || c.id !== firmaId) throw new Error("Dosyanın firması çözülemedi; dosya hiçbir depoya yazılmaz, hiçbir depodan okunmaz.");
    if (c.vt === "ortak") return { depo: a.ortak, ortak: true };
    if (c.kayit.firmaId !== firmaId) throw new Error("Firmanın depo kaydı başka bir firmanın.");
    const v = depolar.get(firmaId);
    if (v && v.kayit.surum >= c.kayit.surum) {
      depolar.delete(firmaId);
      depolar.set(firmaId, v);
      return { depo: v.depo, ortak: false };
    }
    const d = a.firmaDeposu(c.kayit);
    if (!d) throw new Error("Firmanın dosya deposu kurulmadı; dosya başka bir depoya yazılmaz.");
    depolar.delete(firmaId);
    depolar.set(firmaId, { kayit: c.kayit, depo: d });
    while (depolar.size > enCok) depolar.delete(depolar.keys().next().value as string);
    return { depo: d, ortak: false };
  }
  const anahtarIcin = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    return firmaIcin(anahtar.split("/")[1]);
  };
  const islemIcin = async (db: Sorgulayici) => {
    const f = (await db.sorgu<{ f: string | null }>("SELECT gecerli_firma()::text AS f")).rows[0]?.f;
    if (!f) throw new Error("Depo işi firma işleminde koşar.");
    return firmaIcin(f);
  };

  const y: Depo = {
    async yaz(anahtar, bayt, db, tur) {
      await (await anahtarIcin(anahtar)).depo.yaz(anahtar, bayt, db, tur);
    },
    async oku(anahtar, db) {
      return (await anahtarIcin(anahtar)).depo.oku(anahtar, db);
    },
    async copSil(anahtar, db) {
      await (await anahtarIcin(anahtar)).depo.copSil(anahtar, db);
    },
    async oksuzSay(db) {
      return (await islemIcin(db)).depo.oksuzSay(db);
    },
    /* depo imzalı adres vermiyorsa (klasör, veritabanı) null — dosya ucu içeriği kendisi akıtır (bugünkü gibi) */
    async imzaliAdres(anahtar, saniye, indir) {
      const d = (await anahtarIcin(anahtar)).depo;
      return d.imzaliAdres ? d.imzaliAdres(anahtar, saniye, indir) : null;
    },
  };
  if (a.ortak.tasi) {
    const ortak = a.ortak;
    y.tasi = async (db, sinir) => {
      const s = await islemIcin(db);
      return s.ortak && ortak.tasi ? ortak.tasi(db, sinir) : { ...TASINACAK_YOK };
    };
  }
  return y;
}

const g = globalThis as { __probataDepo?: Depo };
/** uygulamanın deposu — FV5 yönlendiricisi: ortak firmalara ortamdaki depo (depoSec), kendi projeli firmaya kendi Storage'ı (merkezdeki kayıttan,
    yedeksiz). */
export function depo(): Depo {
  g.__probataDepo ??= yonlendiriciDepo({
    ortak: depoSec(process.env),
    kayit: firmaKaydiKimlikle,
    firmaDeposu: (k) => {
      const b = depoBaglantisi(k, anaAnahtar());
      return b ? supabaseDepo(b, null) : null;
    },
  });
  return g.__probataDepo;
}
/** ortak firmaların deposu (ortamdan): PROBATA_DEPO=supabase → Supabase Storage (yedek veritabanı deposu — geçiş, 568); vt → veritabanı (deneme
    yayını, 347); yoksa klasör (PROBATA_DEPO_KLASOR, yoksa data/depo). Bilinmeyen değer hata (sessiz düşüş yok). */
export function depoSec(e: Record<string, string | undefined>): Depo {
  const t = e.PROBATA_DEPO ?? "";
  if (t === "supabase") return supabaseDepo(supabaseOrtami(e), vtDepo(merkezHavuzu));
  if (t === "vt") return vtDepo(merkezHavuzu);
  if (t === "") return klasorDepo(e.PROBATA_DEPO_KLASOR ?? join(process.cwd(), "data", "depo"));
  throw new Error("PROBATA_DEPO yalnız 'supabase', 'vt' ya da boş olabilir.");
}
