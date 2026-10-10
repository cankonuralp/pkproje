/* MUHASEBE ↔ TALEPLER BAĞLANTISI (modül 21 → 18; 330 — maket talepler.html "Masraf formu → Muhasebe'de 'Onay bekliyor' (plan içinden gönderilenle
   aynı kayıt); iş seçilmezse genel masraf"; KOD-GECIS §3 Talepler "masraf (gider'e yazar)"). Talepler gider tablosuna dokunmaz; buradan: kişinin
   masraf formları, gönder (kaynak "form", onay bekler), onay beklerken geri çek (silinir) ve fişi değiştir. Yetki ÇAĞIRANDA (Talepler: yalnız
   kendi adına); veritabanı da denetler (0040: masraf formu yalnız gönderenin personeli adına, yalnız gönderen geri çeker).
   477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 · T2 · T4): masraf formunun KARARI Onaylar'da (Muhasebe › Giderler'den onay / red
   tuşları kalktı): Onayla · Düzeltmeye geri gönder · Reddet — yetki burada (Muhasebe "değiştirir"); onaylayan formun içeriğini değiştiremez
   (veritabanı 0079). Düzeltmeye geri gönderilen formu gönderen düzeltip yeniden gönderir (masrafDuzelt). */
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope } from "../../../server/dosya/dosya.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, sil } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { dogrula } from "../../../sema/ortak.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { muhasebePlanlari } from "../../planlar/server/muhasebe-baglanti.ts";
import { GiderGirdisi, para, type GiderDurumu, type GiderTuru } from "../sema.ts";
import { belgeHatasi, belgeYaz, GIDER, type GiderBelgesi } from "./giderler.ts";
import { bugunTr, type Kisi, type Yazma } from "./muhasebe.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface MasrafFormu {
  id: string; no: string; tarih: string; tur: GiderTuru; tutar: number; oran: number; aciklama: string | null; is: { id: string; no: string } | null;
  belge: string | null; durum: GiderDurumu; red: string | null; odeme: string | null; gonderildi: string; surum: number;
  /** 477: son düzeltme isteği (düzeltmeye geri gönderildiyse; yeniden gönderince not kalır) */
  geri: string | null;
}
/** 477: masraf formuna karar verir (Muhasebe "değiştirir"; önerilen düzende firma yöneticisi ve muhasebe) */
export const masrafOnaylar = (kim: YetkiHesabi) => duzey(kim, 18) === "yaz";

/** kişinin masraf formları (en yeni üstte) */
export async function masrafFormlari(db: Sorgulayici, personelId: string): Promise<MasrafFormu[]> {
  if (!UUID.test(personelId)) return [];
  const l = (await db.sorgu<{ id: string; no: string; tarih: string; tur: GiderTuru; tutar: string; oran: number; aciklama: string | null; plan_id: string | null;
    belge: string | null; durum: GiderDurumu; red: string | null; odeme: string | null; olustu: Date; surum: number; geri: string | null }>(
    `SELECT id::text, no, tarih::text, tur, tutar::text, oran, aciklama, plan_id::text, belge::text, durum, red, odeme::text, olustu, surum, geri FROM gider
     WHERE kaynak = 'form' AND personel_id = $1 ORDER BY olustu DESC`, [personelId])).rows;
  const plan = new Map((await muhasebePlanlari(db, l.map((g) => g.plan_id).filter((x): x is string => !!x))).map((p) => [p.id, p.no]));
  return l.map((g) => ({ id: g.id, no: g.no, tarih: g.tarih, tur: g.tur, tutar: Number(g.tutar), oran: g.oran, aciklama: g.aciklama,
    is: g.plan_id ? { id: g.plan_id, no: plan.get(g.plan_id) ?? "—" } : null, belge: g.belge, durum: g.durum, red: g.red, odeme: g.odeme,
    gonderildi: g.olustu.toISOString(), surum: g.surum, geri: g.geri }));
}

/* ── 477: ONAYLAR › TALEPLER ── */
export interface OnayBekleyenMasraf {
  id: string; no: string; surum: number; tarih: string; tur: GiderTuru; tutar: number; oran: number; aciklama: string | null;
  is: { no: string; musteri: string } | null; kisi: string; belge: string | null; gonderildi: string; geri: string | null; kendi: boolean;
}
/** karar bekleyen masraf formları (eski önce); karar veremeyene boş */
export async function onayBekleyenMasraflar(db: Sorgulayici, kim: YetkiHesabi): Promise<OnayBekleyenMasraf[]> {
  if (!masrafOnaylar(kim)) return [];
  const l = (await db.sorgu<{ id: string; no: string; surum: number; tarih: string; tur: GiderTuru; tutar: string; oran: number; aciklama: string | null; plan_id: string | null;
    personel_id: string; belge: string | null; olustu: Date; geri: string | null; kaydeden: string | null }>(
    `SELECT id::text, no, surum, tarih::text, tur, tutar::text, oran, aciklama, plan_id::text, personel_id::text, belge::text, olustu, geri, kaydeden::text FROM gider
     WHERE kaynak = 'form' AND durum = 'bekliyor' ORDER BY olustu`)).rows;
  if (!l.length) return [];
  const plan = new Map((await muhasebePlanlari(db, l.map((g) => g.plan_id).filter((x): x is string => !!x))).map((p) => [p.id, p]));
  const tm = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, m.kisa] as const)));
  const kisi = new Map((await personelOzetleri(db, l.map((g) => g.personel_id))).map((p) => [p.id, p.ad]));
  return l.map((g) => {
    const p = g.plan_id ? plan.get(g.plan_id) : undefined;
    return { id: g.id, no: g.no, surum: g.surum, tarih: g.tarih, tur: g.tur, tutar: Number(g.tutar), oran: g.oran, aciklama: g.aciklama,
      is: p ? { no: p.no, musteri: tm.get(p.tesisId) ?? "—" } : null, kisi: kisi.get(g.personel_id) ?? "—", belge: g.belge, gonderildi: g.olustu.toISOString(),
      geri: g.geri, kendi: !!g.kaydeden && g.kaydeden === kim.id };
  });
}

/** karar: onayla (ödenecek) · düzeltmeye geri gönder (gerekçe) · reddet (gerekçe); gerekçeyi Talepler şemasıyla çağıran doğrular, uzunluğu
    veritabanı da denetler. Form DEĞİŞMEZ (T2) — yalnız durum ve gerekçe yazılır */
export async function masrafKarar(db: Sorgulayici, kim: Kisi, id: string, surum: number, karar: "onayla" | "geri" | "red", gerekce: string | null): Promise<Yazma> {
  if (!masrafOnaylar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<{ no: string; durum: GiderDurumu; tutar: string }>("SELECT no, durum, tutar::text FROM gider WHERE id = $1 AND kaynak = 'form' FOR UPDATE", [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") {
    return { durum: "red", neden: x.durum === "duzeltme" ? "Form düzeltmede: gönderen düzeltip yeniden gönderince karar verilir." : "Bu masraf formu için karar verilmiş." };
  }
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  if (karar !== "onayla" && !gerekce) return { durum: "gecersiz", hatalar: { gerekce: "Gerekçe yazılmalı." } };
  const deger = karar === "onayla" ? { durum: "onaylandi" } : karar === "red" ? { durum: "red", red: gerekce } : { durum: "duzeltme", geri: gerekce };
  const r = await guncelle(db, GIDER, id, surum, deger, { kim: kim.ad, ne: karar === "onayla" ? "gider.onaylandi" : karar === "red" ? "gider.red" : "gider.duzeltme", gerekce: gerekce ?? x.no });
  if (r.durum !== "tamam") return { durum: r.durum === "yok" ? "yok" : "cakisma" };
  return { durum: "tamam", id, no: x.no, bildirim: karar === "onayla" ? `${x.no} onaylandı; ödenecek: ${para(Number(x.tutar))} — ödeme Muhasebe › Giderler'de işaretlenir.`
    : karar === "red" ? `${x.no} reddedildi.` : `${x.no} düzeltmeye geri gönderildi; gönderen Talepler'inde görür.` };
}

/** masraf formu belgesinin kaydı (341; talep formu PDF'i): kaynak "form" giderin alanları, personeli, kararı (onaylayan hesap, zaman), işin
    numarası; yoksa null. Yetki ÇAĞIRANDA (Talepler: talep eden ya da Muhasebe'yi gören) */
export async function masrafFormuKaydi(db: Sorgulayici, id: string): Promise<{
  id: string; no: string; tarih: string; tur: GiderTuru; tutar: number; oran: number; aciklama: string | null; isNo: string | null; belge: string | null;
  durum: GiderDurumu; red: string | null; odeme: string | null; personelId: string; onaylayan: string | null; karar: string | null; gonderildi: string;
} | null> {
  if (!UUID.test(id)) return null;
  const g = (await db.sorgu<{ id: string; no: string; tarih: string; tur: GiderTuru; tutar: string; oran: number; aciklama: string | null; plan_id: string | null;
    belge: string | null; durum: GiderDurumu; red: string | null; odeme: string | null; personel_id: string; onaylayan: string | null; karar: Date | null; olustu: Date }>(
    `SELECT id::text, no, tarih::text, tur, tutar::text, oran, aciklama, plan_id::text, belge::text, durum, red, odeme::text, personel_id::text, onaylayan::text, karar, olustu
     FROM gider WHERE id = $1 AND kaynak = 'form' AND personel_id IS NOT NULL`, [id])).rows[0];
  if (!g) return null;
  const isNo = g.plan_id ? (await muhasebePlanlari(db, [g.plan_id]))[0]?.no ?? "—" : null;
  return { id: g.id, no: g.no, tarih: g.tarih, tur: g.tur, tutar: Number(g.tutar), oran: g.oran, aciklama: g.aciklama, isNo, belge: g.belge, durum: g.durum, red: g.red,
    odeme: g.odeme, personelId: g.personel_id, onaylayan: g.onaylayan, karar: g.karar?.toISOString() ?? null, gonderildi: g.olustu.toISOString() };
}

/** masraf formu gönder: kişinin adına, onay bekler; iş verilirse kişinin ekibinde olduğu plan olmalı (izinliIsler — Talepler verir) */
export async function masrafGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, izinliIsler: ReadonlySet<string>, girdi: unknown,
  belge: GiderBelgesi): Promise<Yazma> {
  const ham = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const g = dogrula(GiderGirdisi, { ...ham, personel: personelId, odeme: "odendi" });
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, h: Record<string, string> = {};
  if (v.tarih > bugunTr()) h.tarih = "İleri tarihli masraf gönderilmez.";
  if (v.is && !izinliIsler.has(v.is)) h.is = "İş seçilmeli.";
  const bh = belgeHatasi(belge);
  if (bh) h.belge = bh;
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const onek = (await ayarOku(db, "numara")).deger.gider;
  const no = await numaraAl(db, "gider", { onek, simdi: new Date(`${v.tarih}T12:00:00+03:00`) });
  const r = await ekle(db, GIDER, { no, tarih: v.tarih, tur: v.tur, tutar: v.tutar, oran: v.oran, aciklama: v.aciklama, plan_id: v.is, personel_id: personelId,
    kaynak: "form", durum: "bekliyor" }, { kim: kim.ad, ne: "gider.masraf_formu", gerekce: no });
  const b = await belgeYaz(db, depo, kim, firmaId, r.id, r.surum, belge);
  if (typeof b !== "number") throw new Error(`masraf fişi yazılamadı: ${b.durum}`);
  return { durum: "tamam", id: r.id, no, bildirim: `${no} muhasebeye gönderildi: ${para(v.tutar)} (KDV dahil)${v.is ? "" : ", genel masraf"}; onaylanınca ödenir.` };
}

/** 477: düzeltmeye geri gönderilen masraf formunu düzelt ve yeniden gönder (kendi adına; içerik + durum "bekliyor" tek yazmada, sonra fiş) */
export async function masrafDuzelt(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, izinliIsler: ReadonlySet<string>, id: string, surum: number,
  girdi: unknown, belge: GiderBelgesi): Promise<Yazma> {
  const x = await kendiBekleyen(db, kim, personelId, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "duzeltme") return { durum: "red", neden: "Yalnız düzeltmeye geri gönderilen masraf formu düzeltilir." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  const ham = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const g = dogrula(GiderGirdisi, { ...ham, personel: personelId, odeme: "odendi" });
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, h: Record<string, string> = {};
  if (v.tarih > bugunTr()) h.tarih = "İleri tarihli masraf gönderilmez.";
  if (v.is && !izinliIsler.has(v.is)) h.is = "İş seçilmeli.";
  const bh = belgeHatasi(belge);
  if (bh) h.belge = bh;
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, GIDER, id, surum, { tarih: v.tarih, tur: v.tur, tutar: v.tutar, oran: v.oran, aciklama: v.aciklama, plan_id: v.is, durum: "bekliyor" },
    { kim: kim.ad, ne: "gider.masraf_duzelt", gerekce: x.no });
  if (r.durum !== "tamam") return { durum: r.durum === "yok" ? "yok" : "cakisma" };
  if (belge) {
    const b = await belgeYaz(db, depo, kim, firmaId, id, r.surum, belge);
    if (typeof b !== "number") throw new Error(`masraf fişi yazılamadı: ${b.durum}`);
    if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  }
  return { durum: "tamam", id, no: x.no, bildirim: `${x.no} düzeltildi ve muhasebeye yeniden gönderildi: ${para(v.tutar)} (KDV dahil).` };
}

async function kendiBekleyen(db: Sorgulayici, kim: Kisi, personelId: string, id: string) {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<{ no: string; durum: GiderDurumu; belge: string | null; kaydeden: string | null }>(
    "SELECT no, durum, belge::text, kaydeden::text FROM gider WHERE id = $1 AND kaynak = 'form' AND personel_id = $2 FOR UPDATE", [id, personelId])).rows[0] ?? null;
}
/** onay bekleyen masraf formunu geri çek (silinir; fişi çöpe) */
export async function masrafGeriCek(db: Sorgulayici, kim: Kisi, personelId: string, id: string): Promise<Yazma> {
  const x = await kendiBekleyen(db, kim, personelId, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor" && x.durum !== "duzeltme") return { durum: "red", neden: "Karar verilmiş masraf formu geri çekilmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  if (!(await sil(db, GIDER, id, { kim: kim.ad, ne: "gider.masraf_geri", gerekce: x.no }))) return { durum: "yok" };
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: `${x.no} geri çekildi.` };
}
/** onay bekleyen masraf formunun fişini ekle / değiştir / kaldır */
export async function masrafBelgesi(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, id: string, surum: number, belge: GiderBelgesi): Promise<Yazma> {
  const x = await kendiBekleyen(db, kim, personelId, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor" && x.durum !== "duzeltme") return { durum: "red", neden: "Karar verilmiş masraf formunun fişi değişmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  const bh = belgeHatasi(belge);
  if (bh) return { durum: "gecersiz", hatalar: { belge: bh } };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const b = await belgeYaz(db, depo, kim, firmaId, id, surum, belge);
  if (typeof b !== "number") return b;
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: belge === "kaldir" ? "Fiş kaldırıldı." : "Fiş kaydedildi." };
}
