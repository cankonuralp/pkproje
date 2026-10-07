/* ZİMMETLER — modülün dışa açılan işlevleri (maket zimmetler.html; modül 9). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 9): "gör" ve üstü bütün varlıkları ve hareketleri görür; "kendi" düzeyi (denetçi) yalnız kendi
   zimmetindeki varlıkları ve kendisinin taraf olduğu hareketleri görür; TESLİM ve demirbaş eklemek yalnız "yaz" düzeyinde (karar 63: ayrı depo
   rolü yok). Her teslim ayrı, DEĞİŞMEZ kayıt (veritabanında güncelleme / silme hakkı yok); "kimde" son hareketten okunur. Teslim eden sunucuda
   o anki "kimde"den yazılır (istemciden alınmaz). Fotoğraflar tek dosya yolundan (yalnız JPEG / PNG, EXIF silinir), isteğe bağlı (karar 62).
   Öteki modüllerin tablolarına dokunmaz: cihaz ve personel bilgisi o modüllerin dışa açtığı işlevlerden.
   362 (§9 elli üçüncü tur): PASİF varlıklar da yüklenir (geçmiş hareket adıyla görünür; liste Görünüm: Pasif) ama teslim edilmez. Demirbaş: hiç
   kullanılmamışı yönetici kesin siler (kayit_sil, modül 9; göç 0058), kullanılmışı pasife alınır (depodayken), Etkinleştir geri getirir. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar, type Kullanim } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { aracOzetleri } from "../../araclar/server/araclar.ts";
import { bugunTr, cihazOzetleri } from "../../olcum-cihazlari/server/cihazlar.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import { DemirbasGirdisi, TeslimGirdisi } from "../sema.ts";

const MODUL = 9;
export const DOSYA_MODULU = "zimmet";
const DEMIRBAS = tablo({ ad: "demirbas", sutunlar: ["kod", "ad", "pasif"] });
const HAREKET = tablo({ ad: "zimmet_hareket", sutunlar: ["cihaz_id", "demirbas_id", "arac_id", "eden_personel", "alan_personel", "zaman", "km", "notu"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
/** c ölçüm cihazı · d diğer demirbaş · a araç (Araçlar modülü; teslimi araç tutanağıyla) */
export type VarlikTuru = "c" | "d" | "a";
/** kimde: depo · kalibrasyonda · bir personel */
export type Kimde = { tip: "depo" } | { tip: "lab" } | { tip: "kisi"; id: string; ad: string };
export interface VarlikSatiri { anahtar: string; tur: VarlikTuru; id: string; kod: string; ad: string; kimde: Kimde; bitis: string | null; son: { zaman: string; eden: string; alan: string } | null; pasif: boolean }
export interface HareketSatiri { id: string; varlik: string; varlikKod: string; varlikAd: string; zaman: string; eden: string; alan: string; alanKisi: boolean; km: number | null; notu: string | null; fotolar: string[] }
export interface VarlikKarti extends VarlikSatiri { hareketler: HareketSatiri[] }

export type Yazma =
  | { durum: "tamam"; id: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const zimmetDegistirir = degistirir;

/** son hareketlere göre kimde (cihaz ve demirbaş; değer: alan personel kimliği ya da null = depo). Ölçüm cihazları "kendi" düzeyi bunu kullanır. */
export async function kimdeHaritasi(db: Sorgulayici): Promise<{ cihaz: Map<string, string | null>; demirbas: Map<string, string | null>; arac: Map<string, string | null> }> {
  const c = await db.sorgu<{ id: string; alan: string | null }>(
    "SELECT DISTINCT ON (cihaz_id) cihaz_id::text AS id, alan_personel::text AS alan FROM zimmet_hareket WHERE cihaz_id IS NOT NULL ORDER BY cihaz_id, zaman DESC, olustu DESC");
  const d = await db.sorgu<{ id: string; alan: string | null }>(
    "SELECT DISTINCT ON (demirbas_id) demirbas_id::text AS id, alan_personel::text AS alan FROM zimmet_hareket WHERE demirbas_id IS NOT NULL ORDER BY demirbas_id, zaman DESC, olustu DESC");
  const a = await db.sorgu<{ id: string; alan: string | null }>(
    "SELECT DISTINCT ON (arac_id) arac_id::text AS id, alan_personel::text AS alan FROM zimmet_hareket WHERE arac_id IS NOT NULL ORDER BY arac_id, zaman DESC, olustu DESC");
  return { cihaz: new Map(c.rows.map((x) => [x.id, x.alan])), demirbas: new Map(d.rows.map((x) => [x.id, x.alan])), arac: new Map(a.rows.map((x) => [x.id, x.alan])) };
}

type HareketDb = { id: string; cihaz_id: string | null; demirbas_id: string | null; arac_id: string | null; eden_personel: string | null; alan_personel: string | null; zaman: Date; km: number | null; notu: string | null };

/** bütün varlıklar + hareketler (tek seferde; listeler bundan süzülür) */
async function durum(db: Sorgulayici) {
  const [cihazlar, araclar, demirbaslar, kisiler, hareketler, fotolar] = [
    await cihazOzetleri(db, { pasifDahil: true }),
    await aracOzetleri(db, { pasifDahil: true }),
    (await db.sorgu<{ id: string; kod: string; ad: string; pasif: boolean }>("SELECT id::text, kod, ad, pasif IS NOT NULL AS pasif FROM demirbas")).rows,
    await personelSecenekleri(db),
    (await db.sorgu<HareketDb>("SELECT id::text, cihaz_id::text, demirbas_id::text, arac_id::text, eden_personel::text, alan_personel::text, zaman, km, notu FROM zimmet_hareket ORDER BY zaman DESC, olustu DESC")).rows,
    (await db.sorgu<{ id: string; kayit_id: string }>("SELECT id::text, kayit_id::text FROM dosya WHERE modul = $1 AND cop IS NULL ORDER BY olustu", [DOSYA_MODULU])).rows,
  ];
  const kisiAd = new Map(kisiler.map((k) => [k.id, k.ad]));
  /* ayrılan personelin adı da gerekir (geçmiş kayıtlar) */
  const eksik = [...new Set(hareketler.flatMap((h) => [h.eden_personel, h.alan_personel]).filter((x): x is string => !!x && !kisiAd.has(x)))];
  for (const x of eksik) kisiAd.set(x, "Ayrılan personel");
  const yer = (p: string | null) => (p ? kisiAd.get(p) ?? "—" : "Depo");
  const fotoHaritasi = new Map<string, string[]>();
  for (const f of fotolar) { const l = fotoHaritasi.get(f.kayit_id) ?? []; l.push(f.id); fotoHaritasi.set(f.kayit_id, l); }
  const varlikAdi = new Map<string, { kod: string; ad: string }>([
    ...cihazlar.map((c) => [`c:${c.id}`, { kod: c.kod, ad: c.tur }] as const),
    ...demirbaslar.map((d) => [`d:${d.id}`, { kod: d.kod, ad: d.ad }] as const),
    ...araclar.map((a) => [`a:${a.id}`, { kod: a.plaka, ad: a.ad }] as const),
  ]);
  const hareketSatirlari: (HareketSatiri & { edenId: string | null; alanId: string | null })[] = hareketler.map((h) => {
    const anahtar = h.cihaz_id ? `c:${h.cihaz_id}` : h.arac_id ? `a:${h.arac_id}` : `d:${h.demirbas_id}`;
    const v = varlikAdi.get(anahtar) ?? { kod: "—", ad: "Kaldırılan varlık" };
    return { id: h.id, varlik: anahtar, varlikKod: v.kod, varlikAd: v.ad, zaman: h.zaman.toISOString(), eden: yer(h.eden_personel), alan: yer(h.alan_personel),
      alanKisi: !!h.alan_personel, km: h.km, notu: h.notu, fotolar: fotoHaritasi.get(h.id) ?? [], edenId: h.eden_personel, alanId: h.alan_personel };
  });
  const son = new Map<string, (typeof hareketSatirlari)[number]>();
  for (const h of hareketSatirlari) if (!son.has(h.varlik)) son.set(h.varlik, h);
  const kimde = (anahtar: string, lab: boolean): Kimde => {
    if (lab) return { tip: "lab" };
    const h = son.get(anahtar);
    return h?.alanId ? { tip: "kisi", id: h.alanId, ad: yer(h.alanId) } : { tip: "depo" };
  };
  const varliklar: VarlikSatiri[] = [
    ...cihazlar.map((c) => ({ anahtar: `c:${c.id}`, tur: "c" as const, id: c.id, kod: c.kod, ad: c.tur, bitis: c.bitis, kimde: kimde(`c:${c.id}`, c.konum === "lab"), pasif: c.pasif })),
    ...demirbaslar.map((d) => ({ anahtar: `d:${d.id}`, tur: "d" as const, id: d.id, kod: d.kod, ad: d.ad, bitis: null, kimde: kimde(`d:${d.id}`, false), pasif: d.pasif })),
    ...araclar.map((a) => ({ anahtar: `a:${a.id}`, tur: "a" as const, id: a.id, kod: a.plaka, ad: a.ad, bitis: null, kimde: kimde(`a:${a.id}`, false), pasif: a.pasif })),
  ].map((v) => { const h = son.get(v.anahtar); return { ...v, son: h ? { zaman: h.zaman, eden: h.eden, alan: h.alan } : null }; });
  return { varliklar, hareketler: hareketSatirlari, kisiler };
}

/** "kendi" düzeyinde kişinin personel kimliği (yoksa boş dize: hiçbir kayıt eşleşmez); "gör" ve üstünde null */
async function kendiKisi(db: Sorgulayici, kim: YetkiHesabi): Promise<string | null> {
  return duzey(kim, MODUL) === "kendi" ? ((await hesabinPersoneli(db, kim.id)) ?? "") : null;
}
/** iç alanlar (personel kimlikleri) istemciye gitmez */
const temiz = <T extends object>(h: T) => Object.fromEntries(Object.entries(h).filter(([k]) => k !== "edenId" && k !== "alanId")) as Omit<T, "edenId" | "alanId">;

export async function zimmetListeleri(db: Sorgulayici, kim: Kisi): Promise<{ varliklar: VarlikSatiri[]; hareketler: HareketSatiri[]; kisiler: { id: string; ad: string }[] } | null> {
  const d = duzey(kim, MODUL);
  if (d === "yok" || d === "brans") return d === "yok" ? null : { varliklar: [], hareketler: [], kisiler: [] };
  const k = await kendiKisi(db, kim);
  const s = await durum(db);
  const varliklar = k === null ? s.varliklar : s.varliklar.filter((v) => v.kimde.tip === "kisi" && v.kimde.id === k);
  const hareketler = (k === null ? s.hareketler : s.hareketler.filter((h) => h.edenId === k || h.alanId === k)).map(temiz);
  return { varliklar: varliklar.sort((a, b) => a.kod.localeCompare(b.kod)), hareketler, kisiler: k === null ? s.kisiler.map(({ id, ad }) => ({ id, ad })) : [] };
}

export async function varlikKarti(db: Sorgulayici, kim: Kisi, anahtar: string): Promise<VarlikKarti | null> {
  if (!/^[cda]:[0-9a-f-]{36}$/.test(anahtar)) return null;
  const l = await zimmetListeleri(db, kim);
  const v = l?.varliklar.find((x) => x.anahtar === anahtar);
  if (!v) return null;
  return { ...v, hareketler: l!.hareketler.filter((h) => h.varlik === anahtar) };
}

/** dosya erişimi (src/server/dosya/erisim.ts): hareketi görebilen fotoğraflarını açar */
export async function zimmetDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!UUID.test(kayitId) || duzey(kisi, MODUL) === "yok") return false;
  const k = await kendiKisi(db, kisi);
  const h = (await db.sorgu<{ eden: string | null; alan: string | null }>("SELECT eden_personel::text AS eden, alan_personel::text AS alan FROM zimmet_hareket WHERE id = $1", [kayitId])).rows[0];
  if (!h) return false;
  return k === null ? gorur(kisi) : h.eden === k || h.alan === k;
}

/** teslim et: eden sunucuda o anki "kimde"den; kalibrasyondaki cihaz teslim edilmez; alan, şu anki yerle aynı olamaz; alan personel çalışıyor olmalı */
export async function teslimEt(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, fotolar: { ad: string; bayt: Uint8Array }[] = []): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(TeslimGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const s = await durum(db);
  const varlik = s.varliklar.find((x) => x.anahtar === v.varlik);
  if (!varlik) return { durum: "gecersiz", hatalar: { varlik: "Varlık seçilmeli." } };
  if (varlik.pasif) return { durum: "gecersiz", hatalar: { varlik: `${varlik.kod} pasif; önce etkinleştirin.` } };
  if (varlik.kimde.tip === "lab") return { durum: "gecersiz", hatalar: { varlik: "Varlık kalibrasyonda; dönünce depodan teslim edilir." } };
  const alan = v.alan === "depo" ? null : v.alan;
  if (alan && !s.kisiler.some((k) => k.id === alan)) return { durum: "gecersiz", hatalar: { alan: "Teslim alan seçilmeli." } };
  const eden = varlik.kimde.tip === "kisi" ? varlik.kimde.id : null;
  if (eden === alan) return { durum: "gecersiz", hatalar: { alan: alan ? `Varlık zaten ${varlik.kimde.tip === "kisi" ? varlik.kimde.ad : ""} zimmetinde.` : "Varlık zaten depoda." } };
  if (fotolar.length > 10) return { durum: "gecersiz", hatalar: { foto: "En çok 10 fotoğraf." } };
  const [tur, id] = v.varlik.split(":");
  const r = await ekle(db, HAREKET, {
    cihaz_id: tur === "c" ? id : null, demirbas_id: tur === "d" ? id : null, eden_personel: eden, alan_personel: alan,
    zaman: `${v.zaman}:00+03:00`, notu: v.notu,
  }, { kim: kim.ad, ne: "zimmet.teslim" });
  for (const f of fotolar) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: r.id, ad: f.ad, bayt: f.bayt, izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) throw new FotoHatasi(y.neden === "buyuk" ? "Fotoğraf en çok 8 MB." : "Fotoğraf JPEG ya da PNG olmalı.");
  }
  return { durum: "tamam", id: r.id };
}
/** fotoğraf reddedilirse bütün teslim geri alınır (işlem düşer); eylem bunu alan iletisine çevirir */
export class FotoHatasi extends Error {}

export async function demirbasEkle(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(DemirbasGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  if ((await db.sorgu("SELECT 1 FROM demirbas WHERE kod = $1", [g.veri.kod])).rowCount) return { durum: "gecersiz", hatalar: { kod: `${g.veri.kod} kodu başka bir demirbaşta kullanılıyor.` } };
  return { durum: "tamam", id: (await ekle(db, DEMIRBAS, { kod: g.veri.kod, ad: g.veri.ad }, { kim: kim.ad, ne: "demirbas.ekle" })).id };
}

/** ARAÇ TESLİMİ — Araçlar modülünün teslim tutanağı buradan zimmet hareketi yazar (ikinci liste yok). Yetki, kilometre ve tutanak denetimi
    ÇAĞIRANDA (modül 23; araç satırı çağıranda kilitli). Teslim eden burada, son hareketten; alan çalışan bir personel ya da depo (null). */
export async function aracHareketiYaz(db: Sorgulayici, kim: Kisi, p: { aracId: string; alan: string | null; zaman: string; km: number; notu: string | null }):
  Promise<{ durum: "tamam"; id: string; eden: string | null } | { durum: "gecersiz"; hatalar: DogrulamaHatalari }> {
  if (!UUID.test(p.aracId)) return { durum: "gecersiz", hatalar: { arac: "Araç seçilmeli." } };
  const son = (await db.sorgu<{ alan: string | null }>(
    "SELECT alan_personel::text AS alan FROM zimmet_hareket WHERE arac_id = $1 ORDER BY zaman DESC, olustu DESC LIMIT 1", [p.aracId])).rows[0];
  const eden = son?.alan ?? null;
  if (p.alan && !(await personelSecenekleri(db)).some((k) => k.id === p.alan)) return { durum: "gecersiz", hatalar: { alan: "Teslim alan seçilmeli." } };
  if (eden === p.alan) return { durum: "gecersiz", hatalar: { alan: p.alan ? "Araç zaten bu kişinin zimmetinde." : "Araç zaten depoda." } };
  const r = await ekle(db, HAREKET, { arac_id: p.aracId, eden_personel: eden, alan_personel: p.alan, zaman: `${p.zaman}:00+03:00`, km: p.km, notu: p.notu },
    { kim: kim.ad, ne: "zimmet.arac_teslim" });
  return { durum: "tamam", id: r.id, eden };
}

/** Personel kartı için: o anda kişinin zimmetindeki varlıklar (son hareketten; teslim zamanı son hareketin zamanı). Yetki ÇAĞIRANDA. */
export async function kisininVarliklari(db: Sorgulayici, personelId: string): Promise<VarlikSatiri[]> {
  const s = await durum(db);
  return s.varliklar.filter((v) => v.kimde.tip === "kisi" && v.kimde.id === personelId).sort((a, b) => a.kod.localeCompare(b.kod));
}

/* ── DEMİRBAŞ: KESİN SİLME / PASİF (362; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — Sil yalnız yöneticiye (kayit_sil,
   modül 9) ve hiç kullanılmamış demirbaşa (zimmet hareketi, imzalı zimmet formu yok; tanım veritabanında, göç 0058). Pasife al / Etkinleştir "yaz"
   düzeyi; ENGEL (veri bütünlüğü): demirbaş depoda olmalı — kişinin zimmetindeyken pasife alınırsa geri teslim alınamaz. */
export type SilYaniti = { durum: "tamam"; ad: string } | { durum: "red"; neden: string } | { durum: "yok" } | { durum: "yetkisiz" };
export type PasifYaniti = { durum: "tamam"; id: string; surum: number } | { durum: "red"; neden: string } | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
const silebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });

/** varlık sayfası (demirbaş, "yaz" düzeyi): sürüm, pasif, "Sil" çizilir mi (silebilen + kullanılmamış), kullanım sayımları (Pasife al nedeni) */
export async function demirbasDurumu(db: Sorgulayici, kim: YetkiHesabi, id: string): Promise<{ surum: number; pasif: boolean; sil: boolean; kullanim: Kullanim | null } | null> {
  if (!degistirir(kim) || !UUID.test(id)) return null;
  const d = (await db.sorgu<{ surum: number; pasif: boolean }>("SELECT surum, pasif IS NOT NULL AS pasif FROM demirbas WHERE id = $1", [id])).rows[0];
  if (!d) return null;
  const k = (await kullanimlar(db, "demirbas", [id])).get(id) ?? null;
  return { surum: d.surum, pasif: d.pasif, sil: silebilir(kim) && !k, kullanim: k };
}

export async function demirbasSil(db: Sorgulayici, kim: Kisi, id: string): Promise<SilYaniti> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "demirbas", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Demirbaş silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı.` };
  return r;
}

export async function demirbasPasif(db: Sorgulayici, kim: Kisi, id: string, surum: number, pasif: boolean): Promise<PasifYaniti> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const d = (await db.sorgu<{ kod: string; pasif: string | null }>("SELECT kod, pasif::text FROM demirbas WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!d) return { durum: "yok" };
  if (pasif && !d.pasif && (await kimdeHaritasi(db)).demirbas.get(id)) return { durum: "red", neden: `${d.kod} bir kişinin zimmetinde; önce depoya teslim alın.` };
  const r = await guncelle(db, DEMIRBAS, id, surum, { pasif: pasif ? (d.pasif ?? bugunTr()) : null }, { kim: kim.ad, ne: pasif ? "demirbas.pasif" : "demirbas.etkinlestir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}
