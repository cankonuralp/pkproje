/* RAPORLAR LİSTESİ — SUNUCUDA SAYFALI (566; 09-B3; reisim 2026-10-15 analizi: Raporlar listesi firmanın BÜTÜN raporlarını tarayıcıya indirip
   orada süzüyordu — yılda binlerce raporda telefonda donar). Ekran ve anlam aynı (ui/RaporListesi.tsx tanımı): alan aramaları rapor no · ekipman
   kodu · ekipman türü · tesis (+ müşteri), durum çipleri + Geri gönderilen, seçiciler Müşteri · İl · Sonuç · Yıl, 20'şer, en yeni üstte.
   Görme kuralı canDo ile aynı (gorusKosulu: denetçi kendi, branş yöneticisi branşı + kendi, planlama ve firma yöneticisi hepsi). Başka modülün
   tablosu o modülün okuma parçasıyla (EKIPMAN_SQL, TUR_SQL, TESIS_YER_SQL, PERSONEL_AD_SQL). Onaylar › Tüm raporlar aynı kaynağı kullanır
   (onay-baglanti.ts üzerinden).
   2026-11-02 (liste maketi onaylı — reisim "filtrelemeler daha detaylı olmalı", "her bir başlığa tıklayınca o başlığa göre sıralanıyor"): alan aramaları
   rapor no · ekipman kodu · tesis; seçiciler Ekipman türü · Müşteri · Muayene uzmanı · Branş · İl · İlçe · Sonuç; tarih aralığı (raporun açıldığı gün,
   İstanbul) Yıl seçicisinin yerine; sütun başlığından sıralama (varsayılan yine en yeni üstte). Satırda tamamlanan raporun imzalı PDF'i (toplu indirme). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { listeGetir, type Ekle, type ListeKaynagi } from "../../../server/liste/liste.ts";
import { duzey, gorusKosulu, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import type { SunucuListe } from "../../../components/liste/suzgec.ts";
import { EKIPMAN_SQL } from "../../ekipman/server/ekipman.ts";
import { TUR_SQL } from "../../ekipman-turleri/server/turler.ts";
import { TESIS_YER_SQL } from "../../musteriler/server/musteriler.ts";
import { PERSONEL_AD_SQL } from "../../personel/server/personel.ts";
import { RAPOR_DURUM, type RaporDurumu } from "../sema.ts";
import type { RaporOzeti } from "./onay-baglanti.ts";
import type { RaporListeSatiri } from "./raporlar.ts";

const MODUL = 14;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** görünen numara (sema.ts gorunenNo: revizyonda "-R1") */
const NO = "(r.no || CASE WHEN r.revizyon > 0 THEN '-R' || r.revizyon ELSE '' END)";
/** Yeni'ye geri dönmüş (geri gönderilen ya da revizeye gönderilen) rapor */
const GERI = `(r.durum = 'taslak' AND EXISTS (SELECT 1 FROM rapor_hareket h WHERE h.firma_id = r.firma_id AND h.rapor_id = r.id AND h.ne IN ('geri', 'revize')))`;
/** raporun açıldığı gün (İstanbul) — tarih aralığı süzgeci */
const GUN = "(r.olustu AT TIME ZONE 'Europe/Istanbul')::date";
const DENETCI = "coalesce(pe.ad, '—')";
const DURUM_SIRASI = "CASE r.durum WHEN 'taslak' THEN 1 WHEN 'onayda' THEN 2 WHEN 'onaylandi' THEN 3 WHEN 'imzada' THEN 4 ELSE 5 END";
/** sonuç sırası: sonuçsuz · uygun · şartlı uygun · uygun değil (ui/RaporListesi.tsx SONUC_SIRA ile aynı) */
const SONUC_SIRASI = "CASE r.sonuc WHEN 'uygun' THEN 1 WHEN 'sartli' THEN 2 WHEN 'uygun_degil' THEN 3 ELSE 0 END";
/** tamamlanan raporun imzalı PDF'i (saklama süresi dolup silindiyse yok) — toplu indirme bunu indirir, imzasız kopyayı değil */
const IMZALI = `(SELECT s.imzali_dosya::text FROM rapor_surumu s WHERE r.durum = 'imzali' AND s.firma_id = r.firma_id AND s.rapor_id = r.id AND s.revizyon = r.revizyon
  AND NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = s.firma_id AND k.surum_id = s.id))`;

/** raporun liste satırının kaynağı (silinmiş rapor hiç görünmez) */
export const RAPOR_KAYNAGI = `rapor r
  JOIN ${EKIPMAN_SQL} e ON e.firma_id = r.firma_id AND e.id = r.ekipman_id
  JOIN ${TUR_SQL} t ON t.firma_id = r.firma_id AND t.id = r.tur_id
  JOIN ${TESIS_YER_SQL} y ON y.firma_id = e.firma_id AND y.id = e.tesis_id
  LEFT JOIN ${PERSONEL_AD_SQL} pe ON pe.firma_id = r.firma_id AND pe.id = r.personel_id`;
/** satırın ortak sütunları (RaporOzeti alanları; hesap kimliği istemciye gitmez — "benim" ayrıca) */
export const RAPOR_SECIMI = `r.id::text AS id, ${NO} AS no, r.no AS "kokNo", r.revizyon, r.durum, r.surum, r.plan_id::text AS "planId", e.kod AS "ekipmanKod",
  t.ad AS "turAd", t.brans, y.musteri, y.musteri_id::text AS "musteriId", y.tesis, y.id::text AS "tesisId", y.il, r.personel_id::text AS "personelId",
  coalesce(pe.ad, '—') AS denetci, r.sonuc, r.gonderildi, r.onay, r.olustu, r.hesap_id::text AS "hesapId", ${GERI} AS geri`;

/** Raporlar ekranının süzgeç tanımı (ui/RaporListesi.tsx tanim ile aynı anahtarlar). Görme koşulu listeGetir'e ayrıca (raporGorusu) */
export function raporKaynagi(ekSecim = ""): ListeKaynagi {
  return {
    kaynak: RAPOR_KAYNAGI,
    secim: `${RAPOR_SECIMI}${ekSecim}`,
    metin: [NO, "e.kod", "t.ad", "y.tesis", "y.musteri"],
    alanlar: { no: NO, kod: "e.kod", tesis: "concat_ws(' ', y.tesis, y.musteri)" },
    cipler: {
      ...Object.fromEntries((Object.keys(RAPOR_DURUM) as RaporDurumu[]).map((d) => [d, `r.durum = '${d}'`])),
      geri: GERI,
    },
    seciciler: {
      tur: { kosul: (v, ekle: Ekle) => (UUID.test(v) ? `t.id = ${ekle(v)}::uuid` : "false"), secenek: { deger: "t.id", etiket: "t.ad" } },
      musteri: { kosul: (v, ekle: Ekle) => (UUID.test(v) ? `y.musteri_id = ${ekle(v)}::uuid` : "false"), secenek: { deger: "y.musteri_id", etiket: "y.musteri" } },
      uzman: { kosul: (v, ekle: Ekle) => (UUID.test(v) ? `r.personel_id = ${ekle(v)}::uuid` : "false"), secenek: { deger: "r.personel_id", etiket: DENETCI } },
      brans: { kosul: (v, ekle) => `t.brans = ${ekle(v)}` },
      il: { kosul: (v, ekle) => `y.il = ${ekle(v)}`, secenek: { deger: "y.il", etiket: "y.il" } },
      ilce: { kosul: (v, ekle) => `y.ilce = ${ekle(v)}`, secenek: { deger: "y.ilce", etiket: "y.ilce || coalesce(' (' || y.il || ')', '')" } },
      sonuc: { kosul: (v, ekle) => (v === "yok" ? "r.sonuc IS NULL" : `r.sonuc = ${ekle(v)}`) },
      sira: { kosul: () => null },
    },
    siraSecici: "sira",
    sira: {
      no: { ifade: `tr_sira(${NO})`, metin: true }, tarih: { ifade: "r.olustu" }, ekipman: { ifade: "tr_sira(e.kod)", metin: true },
      tesis: { ifade: "tr_sira(concat_ws(' ', y.musteri, y.tesis))", metin: true }, uzman: { ifade: `tr_sira(${DENETCI})`, metin: true },
      sonuc: { ifade: SONUC_SIRASI }, durum: { ifade: DURUM_SIRASI },
    },
    tarih: GUN,
    varsayilanSira: "r.olustu DESC, r.id",
    sayfa: 20,
  };
}

/** toplu indirme: en çok bu kadar rapor birlikte (müşteri panelinin ZIP sınırıyla aynı — 321) */
export const TOPLU_INDIR_EN_COK = 300;

/** görme koşulu (silinmiş rapor hiç görünmez) — modülün düzeyiyle: Raporlar 14, Onaylar 15 */
export function raporGorusu(kim: YetkiHesabi, modul: 14 | 15): { sql: string; p: unknown[] } {
  const p: unknown[] = [];
  const g = gorusKosulu(kim, modul, { sahip: "r.hesap_id", brans: "t.brans" }, (x) => { p.push(x); return `$${p.length}`; });
  return { sql: `r.silindi IS NULL AND ${g}`, p };
}

type Ham = Omit<RaporOzeti, "gonderildi" | "onay" | "olustu"> & { gonderildi: Date | null; onay: Date | null; olustu: Date; geri: boolean; imzaliDosya?: string | null };
/** pg'nin döndürdüğü satır → ekranın satırı (tarihler ISO) */
export const raporSatiri = (x: Ham): RaporOzeti & { geri: boolean; imzaliDosya?: string | null } => ({
  ...x, gonderildi: x.gonderildi?.toISOString() ?? null, onay: x.onay?.toISOString() ?? null, olustu: x.olustu.toISOString(),
});

/** Raporlar ekranı: görebildiği raporlardan süzgeçten geçenlerin SAYFASI + sayılar; göremeyene null */
export async function raporSayfasi(db: Sorgulayici, kim: YetkiHesabi, durum: unknown): Promise<SunucuListe<RaporListeSatiri> | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const l = await listeGetir<Ham>(db, raporKaynagi(`, ${IMZALI} AS "imzaliDosya"`), raporGorusu(kim, MODUL), durum);
  return {
    ...l,
    gorunen: l.gorunen.map((x) => {
      const r = raporSatiri(x);
      const { hesapId, ...g } = r;
      return { ...g, benim: !!hesapId && hesapId === kim.id };
    }),
  };
}

/** Toplu indir (2026-11-02): süzgeçten geçen BÜTÜN raporlar (sayfasız, listedeki sırayla) — en çok TOPLU_INDIR_EN_COK; aşarsa yalnız sayı döner
    (ekran "süzgeçle daraltın" der). Göremeyene null. PDF'ler tarayıcıda tek tek, oturumlu uçlardan iner (yetki uçta yeniden). */
export async function raporIndirmeListesi(db: Sorgulayici, kim: YetkiHesabi, durum: unknown): Promise<{ adet: number; raporlar: RaporListeSatiri[] } | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const k = { ...raporKaynagi(`, ${IMZALI} AS "imzaliDosya"`), sayfa: TOPLU_INDIR_EN_COK };
  const d = durum && typeof durum === "object" ? { ...(durum as object), sayfa: 1 } : { sayfa: 1 };
  const l = await listeGetir<Ham>(db, k, raporGorusu(kim, MODUL), d);
  if (l.adet > TOPLU_INDIR_EN_COK) return { adet: l.adet, raporlar: [] };
  return { adet: l.adet, raporlar: l.gorunen.map((x) => { const { hesapId, ...g } = raporSatiri(x); return { ...g, benim: !!hesapId && hesapId === kim.id }; }) };
}

/* ── ONAYLAR › TÜM RAPORLAR (maket onaylar.html #/tum — 190; Onaylar onay-baglanti.ts kapısından) ─────────────────────────────────────────
   Ekran ve anlam aynı (onaylar/ui/OnayListesi.tsx tanımı): rapor no ve tesis (+ müşteri) ayrı aranır; seçiciler Durum · Denetçi; sıralama rapor no,
   durum (akış sırası), denetçi; varsayılan en son oluşturulan üstte; 20'şer. */
export function onayTumKaynagi(): ListeKaynagi {
  return {
    kaynak: RAPOR_KAYNAGI,
    secim: RAPOR_SECIMI,
    metin: [NO],
    alanlar: { no: NO, tesis: "concat_ws(' ', y.musteri, y.tesis)" },
    cipler: {},
    seciciler: {
      durum: { kosul: (v, ekle) => `r.durum = ${ekle(v)}` },
      kisi: { kosul: (v, ekle) => `${DENETCI} = ${ekle(v)}`, secenek: { deger: DENETCI, etiket: DENETCI } },
      sira: { kosul: () => null },
    },
    siraSecici: "sira",
    sira: { no: { ifade: `tr_sira(${NO})`, metin: true }, durum: { ifade: DURUM_SIRASI }, denetci: { ifade: `tr_sira(${DENETCI})`, metin: true } },
    varsayilanSira: "r.olustu DESC, r.id",
    sayfa: 20,
  };
}
/** Onaylar › Tüm raporlar: Onaylar düzeyiyle görebildiği raporlardan süzgeçten geçenlerin SAYFASI (yönetici kapısı ÇAĞIRANDA) */
export async function onayTumSayfasi(db: Sorgulayici, kim: YetkiHesabi, durum: unknown): Promise<SunucuListe<RaporOzeti>> {
  const l = await listeGetir<Ham>(db, onayTumKaynagi(), raporGorusu(kim, 15), durum);
  return { ...l, gorunen: l.gorunen.map((x) => { const r: RaporOzeti & { geri?: boolean } = raporSatiri(x); delete r.geri; return r; }) };
}
/** görebildiği raporların sayısı ve branşları (Onaylar sekmesi "Tüm raporlar (n)", kuyruğun branş adı) — bütün raporlar okunmaz */
export async function gorunenRaporOzeti(db: Sorgulayici, kim: YetkiHesabi, modul: 14 | 15): Promise<{ sayi: number; branslar: ("m" | "e")[] }> {
  const g = raporGorusu(kim, modul);
  const x = (await db.sorgu<{ n: number; b: ("m" | "e")[] | null }>(
    `SELECT count(*)::int AS n, array_agg(DISTINCT t.brans ORDER BY t.brans) AS b FROM ${RAPOR_KAYNAGI} WHERE ${g.sql}`, g.p)).rows[0];
  return { sayi: x.n, branslar: x.b ?? [] };
}

/** Raporlar ekranının şeridi: kişinin yazdığı, son imzasını bekleyen rapor sayısı */
export async function imzamiBekleyenSayisi(db: Sorgulayici, kim: YetkiHesabi): Promise<number> {
  return (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM rapor WHERE silindi IS NULL AND durum = 'onaylandi' AND hesap_id = $1::uuid", [kim.id])).rows[0].n;
}
