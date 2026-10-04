/* ARAÇLAR — modülün dışa açılan işlevleri (maket araclar.html; modül 23, AA4 + 2026-10-03 haftalık kilometre). Sayfalar ve eylemler yalnız buradan.
   Yetki her işlevde, sunucuda (canDo, modül 23): "gör" ve üstü bütün araçları, kimde olduklarını ve tutanakları görür; "kendi" düzeyi (denetçi =
   sürücü) yalnız kendi zimmetindeki araçları ve kendisinin taraf olduğu tutanakları görür. Araç ekle / düzenle yalnız "yaz" düzeyinde. Teslim
   tutanağı: "yaz" düzeyi her araç için, sürücü yalnız kendi zimmetindeki araç için. Haftalık kilometreyi aracı kullanan kişi (ya da "yaz")
   girer. Kilometre son bilinenden küçük olamaz (ENGEL); haftada 3.000 km'den fazla artış kaydedilir, uyarılır.
   "Kimde" Zimmetler'in hareketlerinden (ikinci liste yok); teslim tutanağı zimmet hareketini Zimmetler'in işleviyle yazar, tutanak eki burada.
   Fotoğraflar tek dosya yolundan (yalnız JPEG / PNG, EXIF silinir), zimmet hareketine bağlı (Zimmetler'in geçmişinde de görünür). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import { aracHareketiYaz, DOSYA_MODULU as ZIMMET_DOSYA, kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { AracGirdisi, ARAC_FOTO, belgeDurumu, haftaBasi, haftaEkle, KmGirdisi, kmYaz, TutanakGirdisi, type BelgeDurumu, type FotoAcisi } from "../sema.ts";

const MODUL = 23;
const ARAC = tablo({ ad: "arac", sutunlar: ["plaka", "tur", "marka", "model", "yil", "yakit", "ilk_km", "bakim_km", "muayene", "sigorta", "kasko", "pasif"] });
const KM = tablo({ ad: "arac_km", sutunlar: ["arac_id", "hafta", "km", "personel_id", "zaman"] });
const TUTANAK = tablo({ ad: "arac_tutanagi", sutunlar: ["hareket_id", "no", "yakit", "kontrol", "hasar"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** haftalık artış bundan fazlaysa kayıt yapılır ama uyarılır (maket km-kaydet) */
export const HAFTALIK_UYARI_KM = 3000;

export interface Kisi extends YetkiHesabi { ad: string }
export type Kimde = { tip: "depo" } | { tip: "kisi"; id: string; ad: string };
export type KmDurumu = "girildi" | "bekliyor" | "eksik" | "depoda";
export interface Belge { ad: string; tarih: string | null; durum: BelgeDurumu }
export interface AracSatiri {
  id: string; plaka: string; tur: string; marka: string; model: string; yil: number; yakit: string;
  kimde: Kimde; km: number | null; bakimKm: number | null; belgeler: Belge[]; kmDurum: KmDurumu; benim: boolean;
}
export interface TutanakSatiri {
  id: string; hareketId: string; no: string | null; aracId: string; plaka: string; zaman: string; eden: string; alan: string; km: number | null;
  yakit: string | null; kontrol: string[] | null; hasar: string | null; fotolar: { aci: FotoAcisi | null; id: string }[];
}
export interface KmSatiri { hafta: string; km: number | null; yol: number | null; giren: string | null; zaman: string | null }
export interface AracKarti extends AracSatiri {
  surum: number; ilkKm: number | null; muayene: string | null; sigorta: string | null; kasko: string | null;
  tutanaklar: TutanakSatiri[]; kmGecmisi: KmSatiri[]; buHafta: { km: number; surum: number } | null; oncekiKm: number | null;
}

export type Yazma<E = object> =
  | ({ durum: "tamam"; id: string } & E)
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const aracDegistirir = degistirir;
export const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** "kendi" düzeyinde kişinin personel kimliği (yoksa boş dize: hiçbir kayıt eşleşmez); "gör" ve üstünde null; "yok" / "brans" kapalı */
async function kendiKisi(db: Sorgulayici, kim: YetkiHesabi): Promise<string | null | false> {
  const d = duzey(kim, MODUL);
  if (d === "yok" || d === "brans") return false;
  return d === "kendi" ? ((await hesabinPersoneli(db, kim.id)) ?? "") : null;
}

/** öteki modüller için araç özeti (yetki ÇAĞIRANDA; Zimmetler kendi düzeyine göre süzer) */
export async function aracOzetleri(db: Sorgulayici): Promise<{ id: string; plaka: string; ad: string }[]> {
  return (await db.sorgu<{ id: string; plaka: string; tur: string; marka: string; model: string }>("SELECT id::text, plaka, tur, marka, model FROM arac WHERE pasif IS NULL"))
    .rows.map((a) => ({ id: a.id, plaka: a.plaka, ad: `${a.tur} · ${a.marka} ${a.model}` }));
}

type AracDb = { id: string; plaka: string; tur: string; marka: string; model: string; yil: number; yakit: string; ilk_km: number | null; bakim_km: number | null;
  muayene: string | null; sigorta: string | null; kasko: string | null; surum: number };
type HareketDb = { id: string; arac_id: string; eden: string | null; alan: string | null; zaman: Date; km: number | null; tutanak: string | null; no: string | null;
  yakit: string | null; kontrol: string[] | null; hasar: string | null };
type KmDb = { id: string; arac_id: string; hafta: string; km: number; personel_id: string | null; zaman: Date; surum: number };

/** bütün araçlar + hareketler + haftalık kilometre (listeler bundan süzülür) */
async function durum(db: Sorgulayici) {
  const araclar = (await db.sorgu<AracDb>(
    "SELECT id::text, plaka, tur, marka, model, yil, yakit, ilk_km, bakim_km, muayene::text, sigorta::text, kasko::text, surum FROM arac WHERE pasif IS NULL")).rows;
  const hareketler = (await db.sorgu<HareketDb>(
    `SELECT h.id::text, h.arac_id::text, h.eden_personel::text AS eden, h.alan_personel::text AS alan, h.zaman, h.km, t.id::text AS tutanak, t.no, t.yakit, t.kontrol, t.hasar
       FROM zimmet_hareket h LEFT JOIN arac_tutanagi t ON t.hareket_id = h.id AND t.firma_id = h.firma_id
      WHERE h.arac_id IS NOT NULL ORDER BY h.zaman DESC, h.olustu DESC`)).rows;
  const km = (await db.sorgu<KmDb>("SELECT id::text, arac_id::text, hafta::text, km, personel_id::text, zaman, surum FROM arac_km ORDER BY hafta DESC")).rows;
  const fotolar = hareketler.length ? (await db.sorgu<{ id: string; kayit_id: string; ad: string }>(
    "SELECT id::text, kayit_id::text, ad FROM dosya WHERE modul = $1 AND cop IS NULL AND kayit_id = ANY($2::uuid[]) ORDER BY olustu", [ZIMMET_DOSYA, hareketler.map((h) => h.id)])).rows : [];
  const kisiler = await personelSecenekleri(db);
  const kisiAd = new Map(kisiler.map((k) => [k.id, k.ad]));
  const yer = (p: string | null) => (p ? kisiAd.get(p) ?? "Ayrılan personel" : "Depo");
  const esik = (await ayarOku(db, "uyari_esikleri")).deger.kalibrasyon;
  return { araclar, hareketler, km, fotolar, kisiler, yer, esik };
}
type Durum = Awaited<ReturnType<typeof durum>>;

const ACILAR = new Set<string>(ARAC_FOTO.map((x) => x[0]));
/** fotoğraf adı "<açı>.<uzantı>" (yükleyen bu işlev); eski ya da adsız dosyada açı yok */
const aciOku = (ad: string): FotoAcisi | null => { const a = ad.split(".")[0]; return ACILAR.has(a) ? (a as FotoAcisi) : null; };

/** son bilinen kilometre: teslim tutanakları ve haftalık kayıtların en yenisi; yoksa kayıttaki kilometre. `haric`: düzeltilen haftanın kendi kaydı */
function sonKm(s: Durum, a: AracDb, haric?: string): number | null {
  const l = [
    ...s.hareketler.filter((h) => h.arac_id === a.id && h.km != null).map((h) => ({ t: h.zaman.getTime(), km: h.km! })),
    ...s.km.filter((k) => k.arac_id === a.id && k.hafta !== haric).map((k) => ({ t: k.zaman.getTime(), km: k.km })),
  ].sort((x, y) => y.t - x.t || y.km - x.km);
  return l.length ? l[0].km : a.ilk_km;
}

function satir(s: Durum, a: AracDb, bugun: string, ben: string | null): AracSatiri {
  const son = s.hareketler.find((h) => h.arac_id === a.id);
  const kimde: Kimde = son?.alan ? { tip: "kisi", id: son.alan, ad: s.yer(son.alan) } : { tip: "depo" };
  const bu = haftaBasi(bugun), gecen = haftaEkle(bu, -1);
  const kmH = (h: string) => s.km.some((k) => k.arac_id === a.id && k.hafta === h);
  const kmDurum: KmDurumu = kimde.tip === "depo" ? "depoda" : kmH(bu) ? "girildi"
    : kmH(gecen) || (son && son.zaman.toISOString().slice(0, 10) >= gecen) ? "bekliyor" : "eksik";
  return {
    id: a.id, plaka: a.plaka, tur: a.tur, marka: a.marka, model: a.model, yil: a.yil, yakit: a.yakit, kimde, km: sonKm(s, a), bakimKm: a.bakim_km, kmDurum,
    belgeler: ([["Muayene", a.muayene], ["Trafik sigortası", a.sigorta], ["Kasko", a.kasko]] as const).map(([ad, t]) => ({ ad, tarih: t, durum: belgeDurumu(t, bugun, s.esik) })),
    benim: !!ben && kimde.tip === "kisi" && kimde.id === ben,
  };
}

function tutanakSatiri(s: Durum, h: HareketDb, plaka: string): TutanakSatiri {
  return {
    id: h.tutanak ?? h.id, hareketId: h.id, no: h.no, aracId: h.arac_id, plaka, zaman: h.zaman.toISOString(), eden: s.yer(h.eden), alan: s.yer(h.alan), km: h.km,
    yakit: h.yakit, kontrol: h.kontrol, hasar: h.hasar, fotolar: s.fotolar.filter((f) => f.kayit_id === h.id).map((f) => ({ aci: aciOku(f.ad), id: f.id })),
  };
}

export async function aracListesi(db: Sorgulayici, kim: Kisi): Promise<{ araclar: AracSatiri[]; kisiler: { id: string; ad: string }[]; kendi: boolean } | null> {
  const k = await kendiKisi(db, kim);
  if (k === false) return duzey(kim, MODUL) === "yok" ? null : { araclar: [], kisiler: [], kendi: true };
  const s = await durum(db), bugun = bugunTr();
  const l = s.araclar.map((a) => satir(s, a, bugun, k)).filter((a) => k === null || a.benim);
  return { araclar: l.sort((a, b) => a.plaka.localeCompare(b.plaka, "tr")), kisiler: s.kisiler.map(({ id, ad }) => ({ id, ad })), kendi: k !== null };
}

export async function tutanakListesi(db: Sorgulayici, kim: Kisi): Promise<TutanakSatiri[] | null> {
  const k = await kendiKisi(db, kim);
  if (k === false) return duzey(kim, MODUL) === "yok" ? null : [];
  const s = await durum(db);
  const plaka = new Map(s.araclar.map((a) => [a.id, a.plaka]));
  return s.hareketler.filter((h) => plaka.has(h.arac_id) && (k === null || h.eden === k || h.alan === k)).map((h) => tutanakSatiri(s, h, plaka.get(h.arac_id)!));
}

export async function aracKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<AracKarti | null> {
  if (!UUID.test(id)) return null;
  const k = await kendiKisi(db, kim);
  if (k === false) return null;
  const s = await durum(db), bugun = bugunTr();
  const a = s.araclar.find((x) => x.id === id);
  if (!a) return null;
  const v = satir(s, a, bugun, k);
  if (k !== null && !v.benim) return null;
  const bu = haftaBasi(bugun);
  const kayitlar = s.km.filter((x) => x.arac_id === id);
  const kmGecmisi: KmSatiri[] = [];
  if (kayitlar.length) {
    const ilk = kayitlar[kayitlar.length - 1].hafta;
    for (let h = bu; h >= ilk && kmGecmisi.length < 104; h = haftaEkle(h, -1)) {
      const x = kayitlar.find((y) => y.hafta === h);
      kmGecmisi.push({ hafta: h, km: x?.km ?? null, yol: null, giren: x ? s.yer(x.personel_id) : null, zaman: x?.zaman.toISOString() ?? null });
    }
    kmGecmisi.forEach((g, i) => { const once = kmGecmisi.slice(i + 1).find((y) => y.km != null); g.yol = g.km != null && once ? g.km - once.km! : null; });
  }
  const buHafta = kayitlar.find((x) => x.hafta === bu);
  return {
    ...v, surum: a.surum, ilkKm: a.ilk_km, muayene: a.muayene, sigorta: a.sigorta, kasko: a.kasko,
    tutanaklar: s.hareketler.filter((h) => h.arac_id === id && (k === null || h.eden === k || h.alan === k)).map((h) => tutanakSatiri(s, h, a.plaka)),
    kmGecmisi, buHafta: buHafta ? { km: buHafta.km, surum: buHafta.surum } : null, oncekiKm: sonKm(s, a, bu),
  };
}

/** araç ekle (id boş) ya da düzenle. Plaka firmada eşsiz (boşluk yok sayılır). Kayıttaki kilometre yalnız eklerken. */
export async function aracKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (id && (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM arac WHERE id = $1", [id])).rowCount)) return { durum: "yok" };
  const g = dogrula(AracGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const ayni = (await db.sorgu("SELECT 1 FROM arac WHERE plaka_duz = $1 AND id <> $2", [v.plaka.replace(/ /g, ""), id ?? "00000000-0000-0000-0000-000000000000"])).rowCount;
  if (ayni) return { durum: "gecersiz", hatalar: { plaka: "Bu plaka kayıtlı; aynı plakayla ikinci araç açılmaz." } };
  const degerler = { plaka: v.plaka, tur: v.tur, marka: v.marka, model: v.model, yil: v.yil, yakit: v.yakit, bakim_km: v.bakimKm, muayene: v.muayene, sigorta: v.sigorta, kasko: v.kasko };
  if (!id) return { durum: "tamam", ...(await ekle(db, ARAC, { ...degerler, ilk_km: v.ilkKm }, { kim: kim.ad, ne: "arac.ekle" })) };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, ARAC, id, surum, degerler, { kim: kim.ad, ne: "arac.guncelle" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** aracı kilitle (aynı anda iki teslim / iki kilometre aynı "son"u okumasın) ve kimde + kişinin hakkını döndür */
async function kilitle(db: Sorgulayici, kim: Kisi, aracId: string) {
  if (!UUID.test(aracId) || !(await db.sorgu("SELECT 1 FROM arac WHERE id = $1 AND pasif IS NULL FOR UPDATE", [aracId])).rowCount) return null;
  const kimde = (await kimdeHaritasi(db)).arac.get(aracId) ?? null;
  const ben = await hesabinPersoneli(db, kim.id);
  return { kimde, ben, surucu: !!ben && kimde === ben };
}

/** haftalık kilometre: bu haftanın kaydı (yoksa ekler, varsa düzeltir). Kişi: aracı kullanan ya da "yaz" düzeyi; kayıt kullanan kişi adına. */
export async function kmKaydet(db: Sorgulayici, kim: Kisi, aracId: string, girdi: unknown): Promise<Yazma<{ duzeltildi: boolean; uyari: string | null }>> {
  if (duzey(kim, MODUL) === "yok") return { durum: "yetkisiz" };
  const k = await kilitle(db, kim, aracId);
  if (!k) return { durum: "yok" };
  if (!k.surucu && !degistirir(kim)) return { durum: "yetkisiz" };
  if (!k.kimde) return { durum: "gecersiz", hatalar: { km: "Araç depoda; haftalık kilometre istenmez." } };
  const g = dogrula(KmGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const s = await durum(db), a = s.araclar.find((x) => x.id === aracId)!;
  const hafta = haftaBasi(bugunTr()), son = sonKm(s, a, hafta), n = g.veri.km;
  if (son != null && n < son) return { durum: "gecersiz", hatalar: { km: `Son bilinen kilometreden (${kmYaz(son)}) küçük olamaz.` } };
  const uyari = son != null && n - son > HAFTALIK_UYARI_KM ? `Dikkat: son kayıttan ${kmYaz(n - son)} km fazla.` : null;
  const var_ = s.km.find((x) => x.arac_id === aracId && x.hafta === hafta);
  const degerler = { km: n, personel_id: k.kimde, zaman: new Date().toISOString() };
  if (!var_) return { durum: "tamam", ...(await ekle(db, KM, { arac_id: aracId, hafta, ...degerler }, { kim: kim.ad, ne: "arac.km" })), duzeltildi: false, uyari };
  const r = await guncelle(db, KM, var_.id, var_.surum, degerler, { kim: kim.ad, ne: "arac.km_duzelt" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id: var_.id, duzeltildi: true, uyari };
}

/** teslim tutanağı: zimmet hareketi (Zimmetler) + tutanak eki + açı açı fotoğraflar. "yaz" her araç; sürücü yalnız kendi zimmetindeki araç. */
export async function tutanakKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown,
  fotolar: { aci: string; ad: string; bayt: Uint8Array }[] = []): Promise<Yazma<{ no: string; aracId: string }>> {
  if (duzey(kim, MODUL) === "yok") return { durum: "yetkisiz" };
  const g = dogrula(TutanakGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const k = await kilitle(db, kim, v.arac);
  if (!k) return { durum: "gecersiz", hatalar: { arac: "Araç seçilmeli." } };
  if (!k.surucu && !degistirir(kim)) return { durum: "yetkisiz" };
  const s = await durum(db), a = s.araclar.find((x) => x.id === v.arac)!;
  const son = sonKm(s, a);
  if (son != null && v.km < son) return { durum: "gecersiz", hatalar: { km: `Son bilinen kilometreden (${kmYaz(son)}) küçük olamaz.` } };
  if (fotolar.some((f) => !ACILAR.has(f.aci)) || new Set(fotolar.map((f) => f.aci)).size !== fotolar.length) return { durum: "gecersiz", hatalar: { foto: "Her açıya bir fotoğraf." } };
  const notu = [`Km ${kmYaz(v.km)}`, v.hasar].filter(Boolean).join(" · ").slice(0, 300);
  const h = await aracHareketiYaz(db, kim, { aracId: v.arac, alan: v.alan === "depo" ? null : v.alan, zaman: v.zaman, km: v.km, notu });
  if (h.durum !== "tamam") return h;
  const no = await numaraAl(db, "tutanak", { simdi: new Date(`${v.zaman}:00+03:00`) });
  await ekle(db, TUTANAK, { hareket_id: h.id, no, yakit: v.yakit, kontrol: v.kontrol, hasar: v.hasar }, { kim: kim.ad, ne: "arac.tutanak" });
  for (const f of fotolar) {
    const uzanti = /\.png$/i.test(f.ad) ? "png" : "jpg";
    const y = await dosyaYukle(db, depo, { firmaId, modul: ZIMMET_DOSYA, kayitId: h.id, ad: `${f.aci}.${uzanti}`, bayt: f.bayt, izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) throw new FotoHatasi(y.neden === "buyuk" ? "Fotoğraf en çok 8 MB." : "Fotoğraf JPEG ya da PNG olmalı.", f.aci);
  }
  return { durum: "tamam", id: h.id, no, aracId: v.arac };
}
/** fotoğraf reddedilirse bütün tutanak geri alınır (işlem düşer); eylem bunu ilgili açının iletisine çevirir */
export class FotoHatasi extends Error { aci: string; constructor(m: string, aci: string) { super(m); this.aci = aci; } }
