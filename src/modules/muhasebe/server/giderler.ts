/* MUHASEBE › GİDERLER (328; maket muhasebe.html #/giderler, gider penceresi; göç 0040). Gider: tarih, tür (varsayılan KDV oranıyla), KDV dahil tutar
   + oran, açıklama, isteğe bağlı iş (plan) ve personel, belge (fiş / fatura — PDF ya da fotoğraf; yoksa uyarı, engel değil). Elle girilen gider
   "ödendi" ya da "ödenecek" doğar; denetçinin masraf formu (Talepler) onay bekler → onaylandı → ödendi, ya da reddedilir (gerekçe). Yetki: modül 18
   (önerilen düzende firma yöneticisi ve muhasebe). Kurallar veritabanında da (gider_koru). Excel'den yükleme satır satır yeniden denetlenir. */
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { SINIR, turBul } from "../../../server/dosya/tur.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri, personelSecenekleri } from "../../personel/server/personel.ts";
import { muhasebePlanlari } from "../../planlar/server/muhasebe-baglanti.ts";
import { muhasebeRaporlari } from "../../raporlar/server/muhasebe-baglanti.ts";
import { GIDER_EXCEL_SINIR, giderSatirlari } from "../excel.ts";
import { GiderGirdisi, GiderRedGirdisi, giderKdv, para, type GiderDurumu, type GiderTuru } from "../sema.ts";
import { bugunTr, type Kisi, type Yazma } from "./muhasebe.ts";

const MODUL = 18;
export const GIDER_DOSYA = "gider";
const GIDER = tablo({ ad: "gider", sutunlar: ["no", "tarih", "tur", "tutar", "oran", "aciklama", "plan_id", "personel_id", "belge", "kaynak", "durum", "red", "odeme"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const yazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
const iz = (kim: Kisi, ne: string, gerekce?: string): Iz => ({ kim: kim.ad, ne, gerekce });

export interface GiderSatiri {
  id: string; no: string; tarih: string; tur: GiderTuru; tutar: number; oran: number; kdv: number; haric: number; aciklama: string | null;
  is: { id: string; no: string; musteri: string } | null; personel: { id: string; ad: string } | null; belge: string | null;
  kaynak: "muhasebe" | "form"; durum: GiderDurumu; red: string | null; odeme: string | null; surum: number;
}
type GiderDb = { id: string; no: string; tarih: string; tur: GiderTuru; tutar: string; oran: number; aciklama: string | null; plan_id: string | null; personel_id: string | null;
  belge: string | null; kaynak: "muhasebe" | "form"; durum: GiderDurumu; red: string | null; odeme: string | null; surum: number };
const SEC = `SELECT id::text, no, tarih::text, tur, tutar::text, oran, aciklama, plan_id::text, personel_id::text, belge::text, kaynak, durum, red, odeme::text, surum FROM gider`;

async function satirlar(db: Sorgulayici, kosul = "", p: unknown[] = []): Promise<GiderSatiri[]> {
  const l = (await db.sorgu<GiderDb>(`${SEC} ${kosul} ORDER BY tarih DESC, no DESC`, p)).rows;
  if (!l.length) return [];
  const planlar = new Map((await muhasebePlanlari(db, l.map((g) => g.plan_id).filter((x): x is string => !!x))).map((x) => [x.id, x]));
  const tesisMusteri = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, m.kisa] as const)));
  const kisi = new Map((await personelOzetleri(db, l.map((g) => g.personel_id).filter((x): x is string => !!x))).map((x) => [x.id, x.ad]));
  return l.map((g) => {
    const tutar = Number(g.tutar), k = giderKdv(tutar, g.oran), pl = g.plan_id ? planlar.get(g.plan_id) : undefined;
    return { id: g.id, no: g.no, tarih: g.tarih, tur: g.tur, tutar, oran: g.oran, kdv: k.kdv, haric: k.haric, aciklama: g.aciklama,
      is: pl ? { id: pl.id, no: pl.no, musteri: tesisMusteri.get(pl.tesisId) ?? "—" } : null, personel: g.personel_id ? { id: g.personel_id, ad: kisi.get(g.personel_id) ?? "—" } : null,
      belge: g.belge, kaynak: g.kaynak, durum: g.durum, red: g.red, odeme: g.odeme, surum: g.surum };
  });
}

/** Giderler listesi (en yeni üstte); göremeyene null */
export async function giderListesi(db: Sorgulayici, kim: Kisi): Promise<GiderSatiri[] | null> {
  return gorur(kim) ? satirlar(db) : null;
}
/** işin giderleri (iş sayfası) */
export async function isGiderleri(db: Sorgulayici, kim: Kisi, planId: string): Promise<GiderSatiri[] | null> {
  return gorur(kim) && UUID.test(planId) ? satirlar(db, "WHERE plan_id = $1", [planId]) : null;
}

export interface GiderSecenekleri { isler: { id: string; no: string; musteri: string; tarih: string }[]; kisiler: { id: string; ad: string }[] }
/** pencerenin seçenekleri: işler (raporu olan planlar, en yeni üstte) ve çalışan personel; yalnız yazana */
export async function giderSecenekleri(db: Sorgulayici, kim: Kisi): Promise<GiderSecenekleri | null> {
  if (!yazar(kim)) return null;
  const planlar = await muhasebePlanlari(db, [...new Set((await muhasebeRaporlari(db, null)).map((r) => r.planId))]);
  const tm = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, m.kisa] as const)));
  return {
    isler: planlar.map((p) => ({ id: p.id, no: p.no, musteri: tm.get(p.tesisId) ?? "—", tarih: p.baslangic })).sort((a, b) => b.tarih.localeCompare(a.tarih) || b.no.localeCompare(a.no)),
    kisiler: (await personelSecenekleri(db)).map(({ id, ad }) => ({ id, ad })),
  };
}

export type GiderBelgesi = { ad: string; bayt: Uint8Array } | null | "kaldir";
const BELGE_TUR = ["pdf", "jpeg", "png"] as const;
/** belge kayıttan ÖNCE denetlenir (tür baytlardan, boyut); geçmezse gider de yazılmaz */
function belgeHatasi(belge: GiderBelgesi): string | null {
  if (!belge || belge === "kaldir") return null;
  const t = belge.bayt.length ? turBul(belge.bayt, BELGE_TUR) : null;
  return !t ? "Belge PDF, JPEG ya da PNG olmalı." : belge.bayt.length > SINIR[t] ? "Belge çok büyük (PDF 25 MB, fotoğraf 8 MB)." : null;
}
/** belgeyi yazar; yeni sürümü döner (belge yoksa aynı sürüm) */
async function belgeYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number, belge: GiderBelgesi): Promise<number | Yazma> {
  if (belge === null) return surum;
  let dosya: string | null = null;
  if (belge !== "kaldir") {
    const y = await dosyaYukle(db, depo, { firmaId, modul: GIDER_DOSYA, kayitId: id, ad: belge.ad, bayt: belge.bayt, izinli: BELGE_TUR, kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) throw new Error(`gider belgesi yüklenemedi: ${y.neden}`);   // tür ve boyut önceden denetlendi; bozuk görsel işlemi geri alır
    dosya = y.id;
  }
  const r = await guncelle(db, GIDER, id, surum, { belge: dosya }, iz(kim, "gider.belge"));
  return r.durum === "tamam" ? r.surum : { durum: r.durum === "yok" ? "yok" : "cakisma" };
}

export type GiderSonra = "onaylandi" | "odendi" | null;
const GECIS: Record<Exclude<GiderSonra, null>, GiderDurumu> = { onaylandi: "bekliyor", odendi: "onaylandi" };
const gecisRed = (sonra: Exclude<GiderSonra, null>): Yazma =>
  ({ durum: "red", neden: sonra === "odendi" ? "Yalnız onaylanmış (ödenecek) gider ödendi olarak işaretlenir." : "Yalnız onay bekleyen gider onaylanır." });

/** gider ekle (id boş; elle — ödendi ya da ödenecek) ya da düzenle (içerik; reddedilen değişmez); belge isteğe bağlı. sonra: aynı işlemde
    onayla (onay bekleyen) ya da ödendi (ödenecek) — maket penceresindeki "Onayla" / "Ödendi" */
export async function giderKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string | null, surum: number, girdi: unknown,
  belge: GiderBelgesi = null, sonra: GiderSonra = null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(GiderGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, h: DogrulamaHatalari = {};
  if (v.tarih > bugunTr()) h.tarih = "İleri tarihli gider kaydedilmez.";
  if (v.is && !(await muhasebePlanlari(db, [v.is])).length) h.is = "İş seçilmeli.";
  if (v.personel && !(await personelOzetleri(db, [v.personel])).length) h.personel = "Personel seçilmeli.";
  const bh = belgeHatasi(belge);
  if (bh) h.belge = bh;
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const icerik = { tarih: v.tarih, tur: v.tur, tutar: v.tutar, oran: v.oran, aciklama: v.aciklama, plan_id: v.is, personel_id: v.personel };
  if (!id) {
    if (sonra) return { durum: "red", neden: "Yeni gider ödendi ya da ödenecek olarak kaydedilir." };
    const onek = (await ayarOku(db, "numara")).deger.gider;
    const no = await numaraAl(db, "gider", { onek, simdi: new Date(`${v.tarih}T12:00:00+03:00`) });
    const r = await ekle(db, GIDER, { ...icerik, no, kaynak: "muhasebe", durum: v.odeme, odeme: v.odeme === "odendi" ? v.tarih : null }, iz(kim, "gider.ekle", no));
    const b = await belgeYaz(db, depo, kim, firmaId, r.id, r.surum, belge);
    if (typeof b !== "number") throw new Error(`gider belgesi yazılamadı: ${b.durum}`);
    return { durum: "tamam", id: r.id, no, bildirim: `${no} kaydedildi: ${para(v.tutar)} (KDV dahil)${v.is ? "" : ", genel gider"}${belge && belge !== "kaldir" ? "." : "; belge eklenmedi."}` };
  }
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<{ no: string; durum: GiderDurumu }>("SELECT no, durum FROM gider WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (x.durum === "red") return { durum: "red", neden: "Reddedilen gider değişmez." };
  if (sonra && x.durum !== GECIS[sonra]) return gecisRed(sonra);
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, GIDER, id, surum, icerik, iz(kim, "gider.duzenle", x.no));
  if (r.durum !== "tamam") return { durum: r.durum === "yok" ? "yok" : "cakisma" };
  const b = await belgeYaz(db, depo, kim, firmaId, id, r.surum, belge);
  if (typeof b !== "number") return b;
  if (sonra) return durumYaz(db, kim, id, b, sonra === "onaylandi" ? "onaylandi" : "odendi", sonra === "odendi" ? { odeme: bugunTr() } : {});
  return { durum: "tamam", id, no: x.no, bildirim: `${x.no} güncellendi.` };
}

async function durumYaz(db: Sorgulayici, kim: Kisi, id: string, surum: number, hedef: GiderDurumu, ek: Record<string, unknown> = {}): Promise<Yazma> {
  const x = (await db.sorgu<{ no: string; tutar: string }>("SELECT no, tutar::text FROM gider WHERE id = $1", [id])).rows[0];
  const r = await guncelle(db, GIDER, id, surum, { durum: hedef, ...ek }, iz(kim, `gider.${hedef}`, (ek.red as string | undefined) ?? undefined));
  if (r.durum !== "tamam") return { durum: r.durum === "yok" ? "yok" : "cakisma" };
  const tl = para(Number(x.tutar));
  return { durum: "tamam", id, no: x.no, bildirim: hedef === "onaylandi" ? `${x.no} onaylandı; ödenecek: ${tl}.` : hedef === "odendi" ? `${x.no} ödendi: ${tl}.` : `${x.no} reddedildi.` };
}
/** onay bekleyen gideri reddet (gerekçe 5–200; denetçi plan içinde görür) */
export async function giderReddet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const g = dogrula(GiderRedGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const x = (await db.sorgu<{ durum: GiderDurumu }>("SELECT durum FROM gider WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Yalnız onay bekleyen gider reddedilir." };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  return durumYaz(db, kim, id, surum, "red", { red: g.veri.gerekce });
}

/** Excel'den yükle: satırlar sunucuda yeniden denetlenir (giderSatirlari), yalnız geçerliler girer (elle, ödendi) */
export async function giderExceliYukle(db: Sorgulayici, kim: Kisi, ham: unknown): Promise<Yazma & { eklenen?: number }> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!Array.isArray(ham) || ham.length > GIDER_EXCEL_SINIR + 1 || !ham.every((r) => Array.isArray(r) && r.length <= 50 && r.every((c) => typeof c === "string" && c.length <= 300))) {
    return { durum: "red", neden: `Dosya okunamadı ya da çok büyük (en çok ${GIDER_EXCEL_SINIR} satır).` };
  }
  const planlar = await muhasebePlanlari(db, [...new Set((await muhasebeRaporlari(db, null)).map((r) => r.planId))]);
  const l = giderSatirlari(ham as string[][], new Map(planlar.map((p) => [p.no, p.id])), bugunTr()).filter((x) => x.ok);
  if (!l.length) return { durum: "red", neden: "Geçerli satır yok." };
  const onek = (await ayarOku(db, "numara")).deger.gider;
  for (const x of l) {
    const no = await numaraAl(db, "gider", { onek, simdi: new Date(`${x.tarih}T12:00:00+03:00`) });
    await ekle(db, GIDER, { no, tarih: x.tarih, tur: x.tur, tutar: x.tutar, oran: x.oran, aciklama: x.aciklama || null, plan_id: x.plan, personel_id: null, kaynak: "muhasebe",
      durum: "odendi", odeme: x.tarih }, iz(kim, "gider.excel", no));
  }
  return { durum: "tamam", id: "", eklenen: l.length, bildirim: `${l.length} gider Excel'den eklendi.` };
}

/** gider belgesi: muhasebeyi gören açar (09-A2 erişim kaydı) */
export async function giderDosyasiGorulur(db: Sorgulayici, kim: YetkiHesabi, kayitId: string): Promise<boolean> {
  return gorur(kim) && UUID.test(kayitId) && !!(await db.sorgu("SELECT 1 FROM gider WHERE id = $1", [kayitId])).rowCount;
}
