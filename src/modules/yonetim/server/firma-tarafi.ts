/* YÖNETİM › FİRMA TARAFI (FIRMA-VT §5.10, §5.11; FV9 — 2026-10-16). Kendi projeli firmanın verisi KENDİ veritabanında: dondurma kopyası, oturumlar,
   yöneticinin parolası, yapay zekâ anahtarı orada (göç 0097 firma_yonetim_*). Ortak firmada her iş merkezde (0050 / 0096 / 0097 — bugünkü gibi).
   İşlemler dışarıdan verilir (YonetimCalistirici): merkez → yonetimIslemi (yönetim rolü + yönetici kimliği), firmada → yonetimFirmadaIcinde (firmanın
   havuzu, yöneticinin e-postası, vt_firma_dogrula). Böylece veritabanı kilidi (tests/yonetim-firmada.test.ts) aynı işlevleri sınar.
   İKİ VERİTABANINA DOKUNAN İŞLER ATOMİK DEĞİL — sıra KAPALI YÖNDE (§5.11, §8 risk 7):
   · dondur: önce firma tarafı (giriş ve oturum orada kapanır — kimlik/oturum.ts ETKIN_FIRMA firmanın kopyasına bakar), sonra merkez (çözüm kapanır);
     merkez düşerse firma kapalı kalır, yeniden denenir;
   · etkinleştir: önce merkez, sonra firma tarafı; firma tarafı düşerse firma kapalı kalır, yeniden denenir;
   · geçici parola: firma tarafında değişir, merkezin izi ANCAK sonra;
   · yapay zekâ aç / kapa + kişi başı sınır (2026-10-25, göç 0106 firma_yonetim_yz; firma yazamaz): firma tarafına yazılır, merkezin izi sonra;
   · yapay zekâ anahtarı (K4): uygulamada şifrelenir (sir.ts sifrele — firma + ad ek verisi; ana anahtar ortamdan), firma tarafına yazılır, merkezin izi
     sonra (ortak firmada aynı işlevin içinde). Değer hiçbir ize, yanıta düşmez — yalnız son 4.
   Aynı duruma ikinci çağrı hata değil (yeniden denemede kalan adım tamamlanır). */
import { AnahtarGirdisi, YzGirdisi } from "../sema.ts";
import { ayarCoz } from "../../../server/ayar/ayar.ts";
import { sifrele } from "../../../server/ayar/sir.ts";
import type { FirmaVtKaydi } from "../../../server/db/baglanti.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { cozumOku, type FirmaCozumu } from "../../../server/db/merkez.ts";
import { geciciParolaUret } from "../../../server/kimlik/hesapYonetimi.ts";
import { parolaOzeti } from "../../../server/kimlik/parola.ts";
import { firmaDurumu, yoneticiyeGeciciParola, type FirmaDurumu, type YonetimSonucu } from "./yonetim.ts";

export interface YonetimCalistirici {
  /** merkezde yönetim işlemi (yonetimIslemi) */
  merkez<T>(is: (db: Sorgulayici) => Promise<T>): Promise<T>;
  /** kendi projeli firmanın veritabanında yönetim işlemi (yonetimFirmadaIcinde) */
  firmada<T>(kayit: FirmaVtKaydi, firmaId: string, is: (db: Sorgulayici) => Promise<T>): Promise<T>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ULASILAMADI = "Firmanın veritabanına ulaşılamadı; yeniden deneyin.";
const YZ = "yapay_zeka_anahtari";

/** firmanın yeri (merkezdeki kayıttan): ortak, kendi (bağlantı kaydıyla), kurulumda (bağlantı yok) ya da yok */
export type Yer = { vt: "ortak" } | { vt: "kendi"; kayit: FirmaVtKaydi } | { vt: "kurulum" } | null;
export async function yer(c: YonetimCalistirici, id: string): Promise<Yer> {
  const b = (await c.merkez((db) => db.sorgu<{ b: Record<string, unknown> | null }>("SELECT yonetim_firma_baglanti($1) AS b", [id]))).rows[0]?.b ?? null;
  if (!b) return null;
  if (b.vt === "ortak") return { vt: "ortak" };
  let cz: FirmaCozumu | null;
  try { cz = cozumOku(b); } catch { return { vt: "kurulum" }; }
  return cz?.vt === "kendi" ? { vt: "kendi", kayit: cz.kayit } : { vt: "kurulum" };
}
/** firma tarafındaki iş; ulaşılamazsa null (sırrı / iletiyi yazmadan) — FV11 e-posta gönderimi de kullanır */
export async function firmada<T>(c: YonetimCalistirici, kayit: FirmaVtKaydi, id: string, is: (db: Sorgulayici) => Promise<T>): Promise<T | null> {
  try { return await c.firmada(kayit, id, is); } catch (h) {
    console.error("[yönetim] firma veritabanında iş düştü:", (h as { code?: string }).code ?? "kodsuz");
    return null;
  }
}

/** dondur / etkinleştir — ortakta bugünkü gibi; kendi projelide kapalı yönde iki adım */
export async function firmaDurumuYonet(c: YonetimCalistirici, id: string, durum: FirmaDurumu): Promise<YonetimSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  const y = await yer(c, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "ortak") return c.merkez((db) => firmaDurumu(db, id, durum));
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const firmaTarafi = () => firmada(c, y.kayit, id, async (db) =>
    (await db.sorgu<{ s: { durum?: string; hata?: string } }>("SELECT firma_yonetim_durum($1, $2) AS s", [id, durum])).rows[0]!.s);
  const merkez = async () => {
    const r = await c.merkez((db) => firmaDurumu(db, id, durum));
    /* "zaten …": önceki denemede merkez adımı tamamlanmış — sorun değil */
    return r.durum === "tamam" || (r.durum === "red" && /zaten/.test(r.neden)) ? null : r;
  };
  if (durum === "dondu") {
    const f = await firmaTarafi();
    if (!f || f.hata) return { durum: "red", neden: f ? "İşlem yapılamadı." : `${ULASILAMADI} Firma dondurulmadı.` };
    const m = await merkez();
    if (m) return m.durum === "red" ? { durum: "red", neden: `${m.neden} Firmanın girişi kapandı; yeniden deneyin.` } : m;
    return { durum: "tamam" };
  }
  const m = await merkez();
  if (m) return m;
  const f = await firmaTarafi();
  if (!f || f.hata) return { durum: "red", neden: f ? "İşlem yapılamadı." : `${ULASILAMADI} Firmanın girişi hâlâ kapalı.` };
  return { durum: "tamam" };
}

/** firma yöneticisine yeni geçici parola — ortakta bugünkü gibi; kendi projelide firma tarafında, merkezin izi sonra */
export async function geciciParolaYonet(c: YonetimCalistirici, id: string): Promise<YonetimSonucu<{ parola: string; eposta: string; ad: string }>> {
  if (!UUID.test(id)) return { durum: "yok" };
  const y = await yer(c, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "ortak") return c.merkez((db) => yoneticiyeGeciciParola(db, id));
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  /* merkezdeki durum (dondurulmuşsa parola verilmez — ortaktaki kural) */
  const merkezDurumu = (await c.merkez((db) => db.sorgu<{ d: string }>("SELECT durum AS d FROM yonetim_firmalar() WHERE id = $1", [id]))).rows[0]?.d;
  if (merkezDurumu === "dondu") return { durum: "red", neden: "Dondurulmuş firmada parola verilmez; önce etkinleştirin." };
  const parola = geciciParolaUret();
  const ozet = await parolaOzeti(parola);
  const r = await firmada(c, y.kayit, id, async (db) =>
    (await db.sorgu<{ s: { eposta?: string; ad?: string; hata?: string } }>("SELECT firma_yonetim_gecici_parola($1, $2) AS s", [id, ozet])).rows[0]!.s);
  if (!r) return { durum: "red", neden: ULASILAMADI };
  if (r.hata === "yok") return { durum: "yok" };
  if (r.hata === "dondu") return { durum: "red", neden: "Dondurulmuş firmada parola verilmez; önce etkinleştirin." };
  if (r.hata === "hesap_yok") return { durum: "red", neden: "Firmanın açık bir yönetici hesabı yok." };
  if (r.hata || !r.eposta || !r.ad) return { durum: "red", neden: "İşlem yapılamadı." };
  await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'hesap.gecici_parola', $2::jsonb)", [id, JSON.stringify({ eposta: r.eposta })]));
  return { durum: "tamam", parola, eposta: r.eposta, ad: r.ad };
}

export interface FirmaOzeti {
  durum: string; kullanici: number;
  yonetici: { ad: string; eposta: string; durum: "ilk" | "etkin" | "pasif" } | null;
  /** yapay zekâ: açık mı, kişi başı aylık sınır ($; null sınırsız), anahtar tanımlı mı, son 4, bu ay (YYYY-AA) okuma / mesaj / maliyet (milyonda bir $)
      ve kişi kişi kullanım (2026-10-25, göç 0106 — Firma ayarlarından taşındı) */
  yz: { acik: boolean; sinir: number | null; tanimli: boolean; son4: string | null; ay: string; okuma: number; mesaj: number; maliyet: number;
    kisiler: { id: string; ad: string; okuma: number; mesaj: number; maliyet: number }[];
    /** 2026-10-31 (kalem 7 — M6, göç 0110): kullanım koşulları — firma kabulü (kim, ne zaman, sürüm), sürüm başına kabul eden kullanıcı */
    kosul?: { firma: { ad: string; zaman: string; surum: string } | null; kullanicilar: Record<string, number> } };
}
type HamOzet = Omit<FirmaOzeti, "yz"> & { yz: Omit<FirmaOzeti["yz"], "acik" | "sinir" | "kosul"> & { ayar: Record<string, unknown> }; kosul?: FirmaOzeti["yz"]["kosul"] };
/** firma özeti (kendi projelide firmanın veritabanından; ortakta merkezden) — ulaşılamazsa null */
export async function firmaOzetiYonet(c: YonetimCalistirici, id: string): Promise<FirmaOzeti | null> {
  if (!UUID.test(id)) return null;
  const y = await yer(c, id);
  if (!y || y.vt === "kurulum") return null;
  const oku = (db: Sorgulayici) => db.sorgu<{ s: HamOzet }>("SELECT firma_yonetim_ozet($1) AS s", [id]).then((r) => r.rows[0]?.s ?? null);
  const s = y.vt === "ortak" ? await c.merkez(oku) : await firmada(c, y.kayit, id, oku);
  if (!s) return null;
  /* kayıtlı ayar başlangıçla birleşir (kayıtsız firmada kapalı, kişi başı 5 $ — ayar.ts tek kaynak) */
  const { ayar, ...yz } = s.yz, a = ayarCoz("yapay_zeka", ayar ?? {});
  const { kosul, ...gerisi } = s;
  return { ...gerisi, yz: { ...yz, acik: a.acik, sinir: a.sinir, maliyet: Number(yz.maliyet), kosul: kosul ?? { firma: null, kullanicilar: {} },
    kisiler: (yz.kisiler ?? []).map((k) => ({ ...k, maliyet: Number(k.maliyet) })) } };
}

/** 2026-10-25 (göç 0106): yapay zekâyı aç / kapa ve kişi başı aylık sınırı yazar — yalnız yönetim (firmanın uygulama rolü yazamaz) */
export async function yzAyarYonet(c: YonetimCalistirici, id: string, girdi: unknown): Promise<YonetimSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  const g = YzGirdisi.safeParse(girdi);
  if (!g.success) return { durum: "gecersiz", hatalar: Object.fromEntries(g.error.issues.map((i) => [String(i.path[0] ?? "genel"), i.message])) };
  const y = await yer(c, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const yaz = (db: Sorgulayici) => db.sorgu<{ s: { durum?: string; hata?: string } }>("SELECT firma_yonetim_yz($1, $2, $3) AS s",
    [id, g.data.acik, g.data.sinir]).then((r) => r.rows[0]!.s);
  const r = y.vt === "ortak" ? await c.merkez(yaz) : await firmada(c, y.kayit, id, yaz);
  if (!r) return { durum: "red", neden: ULASILAMADI };
  if (r.hata || r.durum !== "tamam") return { durum: "red", neden: "Yapay zekâ ayarı kaydedilemedi." };
  if (y.vt === "kendi") await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'ayar.yz', $2::jsonb)", [id, JSON.stringify(g.data)]));
  return { durum: "tamam" };
}

/** K4: yapay zekâ anahtarını yönetimden yazar (duz) ya da kaldırır (null). Anahtar şemadan (Anthropic: sk-ant-…); şifreleme uygulamada. */
export async function yzAnahtariYonet(c: YonetimCalistirici, id: string, duz: string | null, anaAnahtar: Buffer): Promise<YonetimSonucu<{ son4: string | null }>> {
  if (!UUID.test(id)) return { durum: "yok" };
  let anahtar: string | null = null;
  if (duz !== null) {
    const g = AnahtarGirdisi.safeParse({ anahtar: duz });
    if (!g.success) return { durum: "gecersiz", hatalar: { anahtar: g.error.issues[0]?.message ?? "Anahtar geçersiz." } };
    anahtar = g.data.anahtar;
  }
  const y = await yer(c, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const sifreli = anahtar === null ? null : sifrele(anahtar, id, YZ, anaAnahtar);
  const son4 = anahtar === null ? null : anahtar.slice(-4);
  const yaz = (db: Sorgulayici) => db.sorgu<{ s: { durum?: string; hata?: string; son4?: string | null } }>(
    "SELECT firma_yonetim_sir($1, $2, $3, $4) AS s", [id, YZ, sifreli, son4]).then((r) => r.rows[0]!.s);
  const r = y.vt === "ortak" ? await c.merkez(yaz) : await firmada(c, y.kayit, id, yaz);
  if (!r) return { durum: "red", neden: ULASILAMADI };
  if (r.hata || r.durum !== "tamam") return { durum: "red", neden: "Anahtar kaydedilemedi." };
  if (y.vt === "kendi") {
    await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'ayar.yz_anahtari', $2::jsonb)", [id, JSON.stringify({ son4, kaldirildi: anahtar === null })]));
  }
  return { durum: "tamam", son4 };
}
