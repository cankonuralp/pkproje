/* FİRMANIN FORMAT PARÇALARI (496; hata listesi 29 + 46 maketi onaylı — reisim 2026-10-11) — format kurucunun gelişmiş görünümünde "Parça olarak
   kaydet": bir bölüm firmanın kitaplığına girer, firmanın bütün formatlarında parça kutusundan eklenir (KOPYALANIR — format parçaya bağlanmaz).
   · Tablo format_parca (göç 0080): RLS (firma yalnız kendi parçalarını görür), değişmez, kesin silme yalnız format_parca_sil (silici.ts).
   · Yetki sunucuda (modül 5 Ekipman türleri — format kurucu türün içinde): listeyi "değiştirir" görür (kurucu sayfası da yalnız onun), kaydı
     "değiştirir" yazar, silme yalnız yönetici (kayit_sil). İstemciden gelen bölüm GÜVENİLMEZ: şemadan geçer (tanim.ts Bolum), parça olamayan
     bölüm (ölçüm cihazları, kayıttan gelen, ekipman bilgileri) reddedilir, Bakanlık işareti / üst-alt başlık silinir (yapboz.ts parcaHazirla),
     boyut sınırlı; firma ve kişi oturumdan. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil } from "../../../server/db/silici.ts";
import { ekle, tablo } from "../../../server/db/yazici.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { Bolum } from "../../../format/tanim.ts";
import { parcaHazirla, type FirmaParcasi } from "../yapboz.ts";

const MODUL = 5;
/* bölümün tanımı izde yalnız "değişti" (büyük olabilir) */
const PARCA = tablo({ ad: "format_parca", sutunlar: ["ad", "bolum", "olusturan"], gizli: ["bolum"] });
/** firma başına en çok parça (kitaplık bir liste; sınırsız büyümesin) */
export const PARCA_EN_COK = 200;
/** bir parçanın JSON boyu, bayt (veritabanı CHECK'i 200.000 — jsonb boşluklu yazar, pay bırakılır) */
export const PARCA_BOYU = 150_000;

export interface Kisi extends YetkiHesabi { ad: string }
export type ParcaSonucu =
  | { durum: "tamam"; id: string; ad: string; bolum?: Bolum }
  | { durum: "gecersiz"; neden: string }
  | { durum: "yetkisiz" } | { durum: "yok" };

export const parcaKaydeder = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const parcaSilebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });

/** firmanın parçaları, eskiden yeniye; şemadan geçmeyen (eski şema) parça listelenmez */
export async function firmaParcalari(db: Sorgulayici, kim: YetkiHesabi): Promise<FirmaParcasi[]> {
  if (!parcaKaydeder(kim)) return [];
  const r = await db.sorgu<{ id: string; ad: string; bolum: unknown }>(
    "SELECT id::text, ad, bolum FROM format_parca ORDER BY olustu, id LIMIT $1", [PARCA_EN_COK]);
  const l: FirmaParcasi[] = [];
  for (const x of r.rows) {
    const b = Bolum.safeParse(x.bolum);
    if (b.success) l.push({ id: x.id, ad: x.ad, bolum: b.data });
  }
  return l;
}

/** bölümü parça olarak kaydet: ad (boşsa bölümün adı) + bölüm — şemadan ve parcaHazirla'dan geçer */
export async function parcaKaydet(db: Sorgulayici, kim: Kisi, ad: unknown, bolum: unknown): Promise<ParcaSonucu> {
  if (!parcaKaydeder(kim)) return { durum: "yetkisiz" };
  const b = Bolum.safeParse(bolum);
  if (!b.success) return { durum: "gecersiz", neden: "Bölüm okunamadı." };
  const h = parcaHazirla(b.data);
  if (!h) return { durum: "gecersiz", neden: "Ölçüm cihazları, ekipman bilgileri ve kayıttan gelen bölümler parça olarak kaydedilmez." };
  if (JSON.stringify(h).length > PARCA_BOYU) return { durum: "gecersiz", neden: "Bölüm parça olarak kaydedilemeyecek kadar büyük." };
  const a = (typeof ad === "string" ? ad : "").trim() || h.ad.trim();
  if (!a || a.length > 200) return { durum: "gecersiz", neden: "Parçanın adı 1–200 karakter olmalı." };
  const n = (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM format_parca")).rows[0].n;
  if (n >= PARCA_EN_COK) return { durum: "gecersiz", neden: `Firmanın en çok ${PARCA_EN_COK} parçası olabilir; kullanılmayanı silin.` };
  const kayit: Bolum = { ...h, ad: a };
  const { id } = await ekle(db, PARCA, { ad: a, bolum: kayit, olusturan: kim.ad }, { kim: kim.ad, ne: "format_parca.kaydet" });
  return { durum: "tamam", id, ad: a, bolum: kayit };
}

/** parçayı kesin sil (yalnız yönetici); formatlar etkilenmez — parça formata kopyalanmıştı */
export async function parcaSil(db: Sorgulayici, kim: Kisi, id: string): Promise<ParcaSonucu> {
  if (!parcaSilebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "format_parca", id, kim.ad);
  return r.durum === "tamam" ? { durum: "tamam", id, ad: r.ad } : { durum: "yok" };
}
