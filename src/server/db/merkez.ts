/* MERKEZ OKUMALARI (FIRMA-VT §5.1, FV2) — merkez = ortak proje. Kiracı bilinmeden yapılan iki iş burada:
   · firmaCoz / firmaCozId: alt alan adından (ya da kimlikten) firma ve verisinin nerede olduğu — ortak firma { vt: "ortak" }, kendi projeli firma
     { vt: "kendi", kayit } (bağlantı kaydı; şifreli alanlar ŞİFRELİ — çözme src/server/db/baglanti.ts kayittanBaglanti, havuz kurulurken bir kez).
     Veritabanı yalnız ETKİN firmayı, kendi projelide yalnız kurulumu tamam ve "bakımda" değilken verir (firma_coz, göç 0096); öteki her durumda null.
     Merkez olmayan veritabanında (firma veritabanı) çağrı reddedilir — yanlış havuz.
   · merkezOku: kiracısız, salt okunur işlem (duyuru gibi merkezde duran ortak bilgi — FV6).
   FV2'de hiçbir çağrı yeri değişmedi; FV3 (istekKiracisi → firmaCoz → kiraciHavuzu) bunları kullanacak. Dönen değer şemadan denetlenir: bozuk
   kayıt sessizce kullanılmaz (hata). Kilit: tests/merkez-kaydi.test.ts. */
import type { FirmaVtKaydi } from "./baglanti.ts";
import type { Havuz, Sorgulayici } from "./kiraci.ts";

export type { FirmaVtKaydi } from "./baglanti.ts";

export type FirmaCozumu =
  | { id: string; kisaAd: string; vt: "ortak" }
  | { id: string; kisaAd: string; vt: "kendi"; kayit: FirmaVtKaydi };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/* firma.kisa_ad'ın biçimi (0001) — biçim dışı ad veritabanına sorulmaz */
const KISA_AD = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const SIFRELI = /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const bozuk = (neden: string): never => { throw new Error(`Merkezdeki firma kaydı bozuk: ${neden}`); };
function metin(o: Record<string, unknown>, ad: string): string {
  const v = o[ad];
  return typeof v === "string" && v !== "" ? v : bozuk(ad);
}
const metinYaDaYok = (o: Record<string, unknown>, ad: string): string | null => (o[ad] === null || o[ad] === undefined ? null : metin(o, ad));
function tamsayi(o: Record<string, unknown>, ad: string): number {
  const v = o[ad];
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : bozuk(ad);
}

/** firma_coz / firma_coz_id'nin döndürdüğü jsonb → tipli sonuç (null → null; biçim tutmazsa HATA) */
export function cozumOku(s: unknown): FirmaCozumu | null {
  if (s === null || s === undefined) return null;
  if (typeof s !== "object" || Array.isArray(s)) return bozuk("nesne değil");
  const o = s as Record<string, unknown>;
  const id = metin(o, "id");
  if (!UUID.test(id)) bozuk("id");
  const kisaAd = metin(o, "kisa_ad");
  if (o.vt === "ortak") return { id, kisaAd, vt: "ortak" };
  if (o.vt !== "kendi") return bozuk("vt");
  const parolaSifreli = metin(o, "parola");
  if (!SIFRELI.test(parolaSifreli)) bozuk("parola");
  const depoUrl = metinYaDaYok(o, "depo_url"), depoGizli = metinYaDaYok(o, "depo_gizli"), kova = metinYaDaYok(o, "kova");
  if (depoGizli !== null && !SIFRELI.test(depoGizli)) bozuk("depo_gizli");
  /* depo üçü birlikte: ya hepsi ya hiçbiri (yarım depo bilgisiyle dosya yazılmaz) */
  const depoSayisi = [depoUrl, depoGizli, kova].filter((x) => x !== null).length;
  if (depoSayisi !== 0 && depoSayisi !== 3) bozuk("depo");
  return {
    id, kisaAd, vt: "kendi",
    kayit: {
      firmaId: id, ref: metinYaDaYok(o, "ref"), sunucu: metin(o, "sunucu"), kapi: tamsayi(o, "kapi"), vtAd: metin(o, "vt_ad"),
      kullanici: metin(o, "kullanici"), parolaSifreli,
      depo: depoSayisi === 3 ? { url: depoUrl!, gizliSifreli: depoGizli!, kova: kova! } : null,
      surum: tamsayi(o, "surum"),
    },
  };
}

/** alt alan adındaki kısa addan firma (yoksa / etkin değilse / kurulumu bitmediyse / bakımdaysa null) */
export async function firmaCoz(h: Havuz, kisaAd: string): Promise<FirmaCozumu | null> {
  if (!KISA_AD.test(kisaAd)) return null;
  const r = await h.query<{ s: unknown }>("SELECT firma_coz($1) AS s", [kisaAd]);
  return cozumOku(r.rows[0]?.s);
}

/** firma kimliğinden (arka plan işleri, depo yönlendirmesi — FV5 / FV6) */
export async function firmaCozId(h: Havuz, id: string): Promise<FirmaCozumu | null> {
  if (!UUID.test(id)) return null;
  const r = await h.query<{ s: unknown }>("SELECT firma_coz_id($1::uuid) AS s", [id]);
  return cozumOku(r.rows[0]?.s);
}

/** kiracısız, SALT OKUNUR işlem merkezde: kiracı ayarı boş (RLS'li tablolar satır vermez; ortak bilgi SECURITY DEFINER işlevlerle), veritabanı
    merkez değilse RED (vt_merkez_dogrula, ayarla aynı sorguda). Hata geri alınır ve yukarı fırlatılır (yutulmaz). */
export async function merkezOku<T>(h: Havuz, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  const baglanti = await h.connect();
  let kopuk: Error | undefined;
  const dinle = (e: Error) => { kopuk = e; };
  baglanti.on("error", dinle);
  try {
    await baglanti.query("BEGIN READ ONLY");
    await baglanti.query("SELECT set_config('app.firma_id', '', true), set_config('app.hesap_id', '', true), vt_merkez_dogrula()");
    const sonuc = await is({ sorgu: (sql, degerler) => baglanti.query(sql, degerler as unknown[]) });
    await baglanti.query("COMMIT");
    return sonuc;
  } catch (hata) {
    try { await baglanti.query("ROLLBACK"); } catch (e) { kopuk ??= e as Error; }
    throw hata;
  } finally {
    baglanti.off("error", dinle);
    baglanti.release(kopuk);
  }
}
