/* BELGE FORMATLARI (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız") —
   rapor şablonunun aracı (basılı PDF → şablon → Format kurucu → belge o formattan çizilir) programın ürettiği BÜTÜN belgelere bağlanır: zimmet teslim
   formu, araç teslim tutanağı, eğitim katılım formu, izin / masraf talep formu, teklif, fatura özeti, saha formu, ön bilgilendirme formu
   (src/belge/katalog.ts BELGE_TURLERI). Kayıt göç 0104 belge_format — rapor_format'ın (0022) aynısı, tür yerine belge: TASLAK → YAYINDA → ESKİ,
   belge başına tek taslak ve tek yayın; yayınlanan değişmez (tetik), yayın damgası veritabanından. Yayında sürüm yoksa belge temel formatla
   (src/belge/<belge>.ts) çizilir.
   · Yetki rapor formatıyla aynı (formatlar.ts): modül 5 "gör" ve üstü görür, "yaz" değiştirir. yayindakiBelgeFormati YETKİSİZ — belgenin verisini
     kuran modül (kendi yetkisiyle) çağırır.
   · Tanım şemadan geçmeden yazılmaz, okurken de şemadan geçer; belge formatı her zaman SERBEST DÜZENDE (gorunum.serbest — sabit başlık / firma /
     ekipman bölümü yok; belge yalnız bölümlerden çizilir).
   · Aynı belgenin taslak / yayın işlemleri firma × belge danışma kilidiyle sıraya girer (tür satırı yok). */
import { BELGE_KATALOGU, BELGE_TURLERI, belgeTuruMu, type BelgeTuru } from "../../../belge/katalog.ts";
import { bosFormat } from "../../../format/sablonlar.ts";
import { onar, yeniTablo } from "../../../format/tablo.ts";
import { FormatTanimi, type Hucre, type TABLO_KAYNAKLARI } from "../../../format/tanim.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, hatalar, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { YayinNotu } from "../sema.ts";
import { formatDegistirir, TANIM_EN_COK, type Kisi, type Yazma } from "./formatlar.ts";

const MODUL = 5;
/* tanım büyük; yayınlanan sürüm zaten değişmez saklanır → değeri denetim izine yazılmaz, yalnız "değişti" */
const FORMAT = tablo({ ad: "belge_format", sutunlar: ["belge", "durum", "sira", "sema", "tanim", "notu", "olusturan", "yayinlayan"], gizli: ["tanim"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const iso = (d: Date | null) => (d ? d.toISOString() : null);
type Durum = "taslak" | "yayinda" | "eski";

export interface BelgeFormatOzeti {
  belge: BelgeTuru; ad: string;
  yayinda: { id: string; sira: number; yayin: string } | null;
  taslak: { id: string; surum: number; degisti: string } | null;
}
export type BelgeYayinSonucu = { durum: "tamam"; sira: number } | { durum: "yetkisiz" | "yok" | "cakisma" } | { durum: "gecersiz"; hatalar: DogrulamaHatalari };

/** tanımı şemadan geçirir; şema dışı (bozulmuş) kayıt null */
function tanimOku(v: unknown): FormatTanimi | null {
  const r = FormatTanimi.safeParse(v);
  return r.success ? r.data : null;
}
/** belge formatı her zaman serbest düzende */
const serbest = (t: FormatTanimi): FormatTanimi => (t.gorunum.serbest ? t : { ...t, gorunum: { ...t.gorunum, serbest: true } });
const boy = (v: unknown) => { try { return Buffer.byteLength(JSON.stringify(v) ?? ""); } catch { return Infinity; } };
/** firma × belge işlemleri sıraya girer (yayın, taslak açma) */
const belgeKilidi = (db: Sorgulayici, belge: BelgeTuru) =>
  db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended('belge_format:' || gecerli_firma()::text || ':' || $1, 0))", [belge]);

/* ── BASILI FORMDAN BELGE ŞABLONU — basili.ts basilidanTanim rapor için kurar (eksikse sona Sonuç, Muayene uzmanı, Fotoğraflar ekler; başlık
   yoksa "<ad> Periyodik Kontrol Raporu"; tanınan etiketler raporun kayıt bilgisine bağlanır; ölçüm cihazı / uygunsuzluk / fotoğraf bölümü
   tanır). Belgede: raporun bölümleri (eklenenler, cihaz, uygunsuzluk, fotoğraf) çıkar, başlık belgenin adı, raporun kayıt bilgisi belgenin ortak
   alanına (firma, adres, doküman kodu, belge no, tarih) bağlanır — karşılığı olmayan boş hücre olur. Saf. */
const KAYNAK_VERI: Partial<Record<(typeof TABLO_KAYNAKLARI)[number], string>> = {
  firma: "firma_ad", muayene_firmasi: "firma_ad", adres: "firma_adres", muayene_adres: "firma_adres", rapor_no: "belge_no", rapor_tarihi: "tarih",
  form_kod: "form_kod",
};
const imza = (b: FormatTanimi["bolumler"][number]) =>
  b.blok === "tablo" ? b.hucreler.map((h) => `${h.tur}:${h.m ?? ""}:${h.kaynak ?? ""}:${h.kim ?? ""}`).join("|") : "";
/** basili.ts'in rapor için sona eklediği bölümler (aynı biçim) */
const RAPOR_EKI = new Set(["yazi:SONUÇ::|sonuc:::", "yazi:Muayene uzmanı::|kayit::uzman_ad:|imza:::uzman"]);
const RAPOR_BLOKLARI = new Set<string>(["foto", "cihaz", "kusur"]);
export function basiliBelgeye(t: FormatTanimi, ad: string): FormatTanimi {
  const bolumler = t.bolumler.filter((b) => !RAPOR_BLOKLARI.has(b.blok) && !RAPOR_EKI.has(imza(b))).map((b) => {
    if (b.blok !== "tablo") return b;
    const hucreler = b.hucreler.map((h): Hucre => {
      if (h.tur !== "kayit" || !h.kaynak) return h;
      const veri = KAYNAK_VERI[h.kaynak];
      const k: Hucre = { ...h };
      delete k.kaynak;
      if (veri) return { ...k, veri };
      return { r: h.r, c: h.c, ...(h.rs ? { rs: h.rs } : {}), ...(h.cs ? { cs: h.cs } : {}), tur: "yazi", ...(h.s ? { s: h.s } : {}) };
    });
    return { ...b, hucreler };
  });
  const baslik = t.gorunum.baslik === `${ad} Periyodik Kontrol Raporu`.slice(0, 200) ? ad.slice(0, 200) : t.gorunum.baslik;
  return serbest({ ...t, bolumler, gorunum: { ...t.gorunum, baslik } });
}

/** boş belge formatı: serbest düzende tek tablo — ilk satır belgenin adı */
function bosBelge(ad: string): FormatTanimi {
  const t = bosFormat(ad);
  const tb = yeniTablo("b1", ad.slice(0, 200), 4, 2);
  const ilk = onar({ ...tb, hucreler: [{ r: 0, c: 0, cs: 2, tur: "yazi", m: ad, s: { k: true, a: "o" } }] });
  return FormatTanimi.parse({ ...t, gorunum: { ...t.gorunum, serbest: true }, bolumler: [ilk] });
}

/** belgelerin format özeti (katalog sırasıyla; tanımın kendisi inmez). Görmeyene null. */
export async function belgeFormatlari(db: Sorgulayici, kim: YetkiHesabi): Promise<BelgeFormatOzeti[] | null> {
  if (!gorur(kim)) return null;
  const l = (await db.sorgu<{ id: string; belge: string; durum: Durum; sira: number | null; yayin: Date | null; surum: number; degisti: Date }>(
    "SELECT id::text, belge, durum, sira, yayin, surum, degisti FROM belge_format WHERE durum IN ('taslak', 'yayinda')")).rows;
  return BELGE_TURLERI.map((belge) => {
    const y = l.find((x) => x.belge === belge && x.durum === "yayinda");
    const t = l.find((x) => x.belge === belge && x.durum === "taslak");
    return {
      belge, ad: BELGE_KATALOGU[belge].ad,
      yayinda: y ? { id: y.id, sira: y.sira!, yayin: iso(y.yayin)! } : null,
      taslak: t ? { id: t.id, surum: t.surum, degisti: iso(t.degisti)! } : null,
    };
  });
}

/** bir sürümün tanımı (taslak dahil). Görmeyen, yoksa ya da tanım okunamazsa null. */
export async function belgeFormatiOku(db: Sorgulayici, kim: YetkiHesabi, id: string):
  Promise<{ id: string; belge: BelgeTuru; durum: Durum; surum: number; tanim: FormatTanimi } | null> {
  if (!gorur(kim) || !UUID.test(id)) return null;
  const r = (await db.sorgu<{ id: string; belge: string; durum: Durum; surum: number; tanim: unknown }>(
    "SELECT id::text, belge, durum, surum, tanim FROM belge_format WHERE id = $1", [id])).rows[0];
  const t = r ? tanimOku(r.tanim) : null;
  return r && t && belgeTuruMu(r.belge) ? { id: r.id, belge: r.belge, durum: r.durum, surum: r.surum, tanim: t } : null;
}

/** belgenin YAYINDAKİ formatı; yoksa null (belge temel formatla çizilir). YETKİSİZ — belgenin verisini kuran modül çağırır. */
export async function yayindakiBelgeFormati(db: Sorgulayici, belge: BelgeTuru): Promise<FormatTanimi | null> {
  if (!belgeTuruMu(belge)) return null;
  const r = (await db.sorgu<{ tanim: unknown }>("SELECT tanim FROM belge_format WHERE belge = $1 AND durum = 'yayinda'", [belge])).rows[0];
  return r ? tanimOku(r.tanim) : null;
}

/** verilen tanım belgenin taslağı olur (basılı formdan şablon); taslak varsa onun yerine geçer — istemcinin gördüğü taslak sürümüyle */
export async function belgeTaslakYaz(db: Sorgulayici, kim: Kisi, belge: unknown, tanimGirdisi: unknown, nereden: string, taslakSurumu: number | null): Promise<Yazma> {
  if (!formatDegistirir(kim)) return { durum: "yetkisiz" };
  if (!belgeTuruMu(belge)) return { durum: "yok" };
  if (boy(tanimGirdisi) > TANIM_EN_COK) return { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı ya da çok büyük." } };
  const t = FormatTanimi.safeParse(tanimGirdisi);
  if (!t.success) return { durum: "gecersiz", hatalar: hatalar(t.error) };
  await belgeKilidi(db, belge);
  return taslakYerine(db, kim, belge, serbest(t.data), nereden, taslakSurumu);
}

/** taslak aç: boş ("bos") ya da yayındaki sürümün kopyası ("yayindaki" — yayında sürüm yoksa "yok") */
export async function belgeTaslakAc(db: Sorgulayici, kim: Kisi, belge: unknown, kaynak: unknown, taslakSurumu: number | null): Promise<Yazma> {
  if (!formatDegistirir(kim)) return { durum: "yetkisiz" };
  if (!belgeTuruMu(belge)) return { durum: "yok" };
  if (kaynak !== "bos" && kaynak !== "yayindaki") return { durum: "gecersiz", hatalar: { baslangic: "Başlangıç seçilmeli." } };
  await belgeKilidi(db, belge);
  if (kaynak === "bos") return taslakYerine(db, kim, belge, bosBelge(BELGE_KATALOGU[belge].ad), "boş", taslakSurumu);
  const r = (await db.sorgu<{ tanim: unknown; sira: number }>("SELECT tanim, sira FROM belge_format WHERE belge = $1 AND durum = 'yayinda'", [belge])).rows[0];
  const t = r ? tanimOku(r.tanim) : null;
  if (!r || !t) return { durum: "yok" };
  return taslakYerine(db, kim, belge, serbest(t), `sürüm ${r.sira}`, taslakSurumu);
}

async function taslakYerine(db: Sorgulayici, kim: Kisi, belge: BelgeTuru, tanim: FormatTanimi, nereden: string, taslakSurumu: number | null): Promise<Yazma> {
  const mevcut = (await db.sorgu<{ id: string }>("SELECT id::text FROM belge_format WHERE belge = $1 AND durum = 'taslak' FOR UPDATE", [belge])).rows[0];
  const iz = { kim: kim.ad, ne: "belge_format.taslak", gerekce: nereden };
  if (!mevcut) {
    if (taslakSurumu !== null) return { durum: "cakisma" };   // istemci bir taslak gördü, artık yok (yayınlandı)
    return { durum: "tamam", ...(await ekle(db, FORMAT, { belge, durum: "taslak", sema: tanim.sema, tanim, olusturan: kim.ad }, iz)) };
  }
  if (taslakSurumu === null || !Number.isSafeInteger(taslakSurumu) || taslakSurumu < 0) return { durum: "cakisma" };
  const g = await guncelle(db, FORMAT, mevcut.id, taslakSurumu, { sema: tanim.sema, tanim }, iz);
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: g.durum };
  return { durum: "tamam", id: mevcut.id, surum: g.surum };
}

/** taslağı kaydet (Format kurucu): tanım şemadan geçmezse yazılmaz; yayınlanmış sürüm değişmez ("kilitli") */
export async function belgeTaslakKaydet(db: Sorgulayici, kim: Kisi, id: string, surum: number, tanimGirdisi: unknown): Promise<Yazma> {
  if (!formatDegistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const buyuk = { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı ya da çok büyük." } } as const;
  if (!boy(tanimGirdisi) || boy(tanimGirdisi) > TANIM_EN_COK) return buyuk;
  const r = (await db.sorgu<{ durum: Durum }>("SELECT durum FROM belge_format WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!r) return { durum: "yok" };
  if (r.durum !== "taslak") return { durum: "kilitli" };
  const t = FormatTanimi.safeParse(tanimGirdisi);
  if (!t.success) return { durum: "gecersiz", hatalar: hatalar(t.error) };
  if (boy(t.data) > TANIM_EN_COK) return buyuk;
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const tanim = serbest(t.data);
  const g = await guncelle(db, FORMAT, id, surum, { sema: tanim.sema, tanim }, { kim: kim.ad, ne: "belge_format.taslak_kaydet" });
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: g.durum };
  return { durum: "tamam", id, surum: g.surum };
}

/** taslağı yayınla: varsa yayındaki eskiye düşer; yeni sıra en büyük + 1 */
export async function belgeYayinla(db: Sorgulayici, kim: Kisi, id: string, surum: number, notu: unknown): Promise<BelgeYayinSonucu> {
  if (!formatDegistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const n = dogrula(YayinNotu, notu ?? "");
  if (!n.tamam) return { durum: "gecersiz", hatalar: { notu: Object.values(n.hatalar)[0]! } };
  const b = (await db.sorgu<{ belge: string }>("SELECT belge FROM belge_format WHERE id = $1", [id])).rows[0];
  if (!b || !belgeTuruMu(b.belge)) return { durum: "yok" };
  await belgeKilidi(db, b.belge);
  /* kilitten SONRA yeniden oku: beklerken başkası yayınlamış olabilir */
  const r = (await db.sorgu<{ durum: Durum; surum: number; tanim: unknown }>("SELECT durum, surum, tanim FROM belge_format WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!r) return { durum: "yok" };
  if (r.durum !== "taslak" || !Number.isSafeInteger(surum) || r.surum !== surum) return { durum: "cakisma" };
  const t = tanimOku(r.tanim);
  if (!t) return { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı." } };
  const onceki = (await db.sorgu<{ id: string; surum: number }>(
    "SELECT id::text, surum FROM belge_format WHERE belge = $1 AND durum = 'yayinda' FOR UPDATE", [b.belge])).rows[0];
  if (onceki) {
    const e = await guncelle(db, FORMAT, onceki.id, onceki.surum, { durum: "eski" }, { kim: kim.ad, ne: "belge_format.eskidi" });
    if (e.durum !== "tamam") return { durum: "cakisma" };
  }
  const sira = ((await db.sorgu<{ s: number | null }>("SELECT max(sira) AS s FROM belge_format WHERE belge = $1", [b.belge])).rows[0]?.s ?? 0) + 1;
  const g = await guncelle(db, FORMAT, id, surum, { durum: "yayinda", sira, notu: n.veri, yayinlayan: kim.ad },
    { kim: kim.ad, ne: "belge_format.yayinla", gerekce: n.veri ?? undefined });
  if (g.durum !== "tamam") return { durum: "cakisma" };
  return { durum: "tamam", sira };
}

/** temel formata dön: yayındaki sürüm eskiye düşer, belge yeniden temel formatla çizilir (sürümler silinmez; taslak kalır) */
export async function belgeTemeleDon(db: Sorgulayici, kim: Kisi, belge: unknown): Promise<{ durum: "tamam" | "yetkisiz" | "yok" | "cakisma" }> {
  if (!formatDegistirir(kim)) return { durum: "yetkisiz" };
  if (!belgeTuruMu(belge)) return { durum: "yok" };
  await belgeKilidi(db, belge);
  const y = (await db.sorgu<{ id: string; surum: number }>(
    "SELECT id::text, surum FROM belge_format WHERE belge = $1 AND durum = 'yayinda' FOR UPDATE", [belge])).rows[0];
  if (!y) return { durum: "yok" };
  const e = await guncelle(db, FORMAT, y.id, y.surum, { durum: "eski" }, { kim: kim.ad, ne: "belge_format.temele_don" });
  return { durum: e.durum === "tamam" ? "tamam" : "cakisma" };
}
