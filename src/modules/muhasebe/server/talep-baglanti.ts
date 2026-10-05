/* MUHASEBE ↔ TALEPLER BAĞLANTISI (modül 21 → 18; 330 — maket talepler.html "Masraf formu → Muhasebe'de 'Onay bekliyor' (plan içinden gönderilenle
   aynı kayıt); iş seçilmezse genel masraf"; KOD-GECIS §3 Talepler "masraf (gider'e yazar)"). Talepler gider tablosuna dokunmaz; buradan: kişinin
   masraf formları, gönder (kaynak "form", onay bekler), onay beklerken geri çek (silinir) ve fişi değiştir. Yetki ÇAĞIRANDA (Talepler: yalnız
   kendi adına); veritabanı da denetler (0040: masraf formu yalnız gönderenin personeli adına, yalnız gönderen geri çeker). */
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope } from "../../../server/dosya/dosya.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, sil } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { dogrula } from "../../../sema/ortak.ts";
import { muhasebePlanlari } from "../../planlar/server/muhasebe-baglanti.ts";
import { GiderGirdisi, para, type GiderDurumu, type GiderTuru } from "../sema.ts";
import { belgeHatasi, belgeYaz, GIDER, type GiderBelgesi } from "./giderler.ts";
import { bugunTr, type Kisi, type Yazma } from "./muhasebe.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface MasrafFormu {
  id: string; no: string; tarih: string; tur: GiderTuru; tutar: number; oran: number; aciklama: string | null; is: { id: string; no: string } | null;
  belge: string | null; durum: GiderDurumu; red: string | null; odeme: string | null; gonderildi: string; surum: number;
}

/** kişinin masraf formları (en yeni üstte) */
export async function masrafFormlari(db: Sorgulayici, personelId: string): Promise<MasrafFormu[]> {
  if (!UUID.test(personelId)) return [];
  const l = (await db.sorgu<{ id: string; no: string; tarih: string; tur: GiderTuru; tutar: string; oran: number; aciklama: string | null; plan_id: string | null;
    belge: string | null; durum: GiderDurumu; red: string | null; odeme: string | null; olustu: Date; surum: number }>(
    `SELECT id::text, no, tarih::text, tur, tutar::text, oran, aciklama, plan_id::text, belge::text, durum, red, odeme::text, olustu, surum FROM gider
     WHERE kaynak = 'form' AND personel_id = $1 ORDER BY olustu DESC`, [personelId])).rows;
  const plan = new Map((await muhasebePlanlari(db, l.map((g) => g.plan_id).filter((x): x is string => !!x))).map((p) => [p.id, p.no]));
  return l.map((g) => ({ id: g.id, no: g.no, tarih: g.tarih, tur: g.tur, tutar: Number(g.tutar), oran: g.oran, aciklama: g.aciklama,
    is: g.plan_id ? { id: g.plan_id, no: plan.get(g.plan_id) ?? "—" } : null, belge: g.belge, durum: g.durum, red: g.red, odeme: g.odeme,
    gonderildi: g.olustu.toISOString(), surum: g.surum }));
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

async function kendiBekleyen(db: Sorgulayici, kim: Kisi, personelId: string, id: string) {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<{ no: string; durum: GiderDurumu; belge: string | null; kaydeden: string | null }>(
    "SELECT no, durum, belge::text, kaydeden::text FROM gider WHERE id = $1 AND kaynak = 'form' AND personel_id = $2 FOR UPDATE", [id, personelId])).rows[0] ?? null;
}
/** onay bekleyen masraf formunu geri çek (silinir; fişi çöpe) */
export async function masrafGeriCek(db: Sorgulayici, kim: Kisi, personelId: string, id: string): Promise<Yazma> {
  const x = await kendiBekleyen(db, kim, personelId, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Karar verilmiş masraf formu geri çekilmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  if (!(await sil(db, GIDER, id, { kim: kim.ad, ne: "gider.masraf_geri", gerekce: x.no }))) return { durum: "yok" };
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: `${x.no} geri çekildi.` };
}
/** onay bekleyen masraf formunun fişini ekle / değiştir / kaldır */
export async function masrafBelgesi(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, personelId: string, id: string, surum: number, belge: GiderBelgesi): Promise<Yazma> {
  const x = await kendiBekleyen(db, kim, personelId, id);
  if (!x) return { durum: "yok" };
  if (x.durum !== "bekliyor") return { durum: "red", neden: "Karar verilmiş masraf formunun fişi değişmez." };
  if (x.kaydeden !== kim.id) return { durum: "yetkisiz" };
  const bh = belgeHatasi(belge);
  if (bh) return { durum: "gecersiz", hatalar: { belge: bh } };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const b = await belgeYaz(db, depo, kim, firmaId, id, surum, belge);
  if (typeof b !== "number") return b;
  if (x.belge) await dosyaCope(db, x.belge, { kim: kim.ad, ne: "dosya.cop", gerekce: x.no });
  return { durum: "tamam", id, no: x.no, bildirim: belge === "kaldir" ? "Fiş kaldırıldı." : "Fiş kaydedildi." };
}
