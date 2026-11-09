/* YAKLAŞAN MUAYENELER — veri (2026-11-09; reisim: "senesi yaklaşan aranması gereken müşteriler için … yaklaşan muayeneler tuşu olsun"). Hesap saf
   (../yaklasan.ts); ekipman, rapor, plan ve müşteri bilgisi o modüllerin okuyucularından. "Gör" düzeyi listeyi görür; balon ve teklif hazırlama yalnız
   "yaz" düzeyine (balon kişinin kendi işi — 339). Açık planı olan tesis listede yok: işi zaten açılmış. */
import { bellekteListele } from "../../../server/liste/liste.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { SunucuListe } from "../../../components/liste/suzgec.ts";
import { etkinEkipmanlar } from "../../ekipman/server/anasayfa-baglanti.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriIletisimleri, musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { acikMi, anaPlanlar } from "../../planlar/server/anasayfa-baglanti.ts";
import { sonrakiKontroller } from "../../raporlar/server/anasayfa-baglanti.ts";
import { yaklasanTanim } from "../liste.ts";
import type { TeklifDurumu } from "../sema.ts";
import { ayEkle, bugunTr, buDonemTeklifi, teklifBekliyor, yaklasanSayilari, yaklasanTesisler } from "../yaklasan.ts";
import { etkinDurum, teklifDegistirir, teklifGorur, type Kisi } from "./teklifler.ts";

export interface YaklasanTemel {
  id: string; musteriId: string; musteri: string; unvan: string; tesis: string; yer: string | null;
  /** en yakın muayene günü; kalan: bugüne göre gün (geçmişse eksi) */
  sonraki: string; kalan: number;
  /** ekipman: aralığa giren · toplam: tesisin etkin ekipmanı */
  ekipman: number; toplam: number; turler: string[];
  teklif: { id: string; no: string; durum: TeklifDurumu } | null; bekliyor: boolean;
}
export interface YaklasanSatiri extends YaklasanTemel { ilgili: string | null; tel: string | null; eposta: string | null }

async function temel(db: Sorgulayici): Promise<YaklasanTemel[]> {
  const bugun = bugunTr();
  const turler = new Map((await turOzetleri(db)).map((t) => [t.id, t]));
  const sonraki = await sonrakiKontroller(db);
  const planli = new Set((await anaPlanlar(db)).filter(acikMi).map((p) => p.tesisId));
  const l = yaklasanTesisler((await etkinEkipmanlar(db)).map((e) => {
    const p = turler.get(e.turId)?.periyot;
    return { tesisId: e.tesisId, turId: e.turId, sonraki: sonraki.get(e.id) ?? (e.disKontrol && p ? ayEkle(e.disKontrol, p) : null) };
  }), bugun, planli);
  if (!l.length) return [];
  const tesis = new Map((await musteriOzetleri(db, { tesisler: l.map((x) => x.tesisId) })).filter((m) => !m.pasif)
    .flatMap((m) => m.tesisler.filter((t) => !t.pasif).map((t) => [t.id, { m, t }] as const)));
  /* tesisin en yeni teklifleri: bu dönemin ilki satıra yazılır */
  const teklifler = (await db.sorgu<{ id: string; no: string; durum: "taslak" | "gonderildi" | "kabul" | "red"; tarih: string; gonderildi: string | null; gecerlilik: number; tesis_id: string }>(
    `SELECT t.id::text, t.no, t.durum, t.tarih::text, t.gonderildi::text, t.gecerlilik, x.tesis_id::text
       FROM teklif t JOIN teklif_tesis x ON x.teklif_id = t.id WHERE x.tesis_id = ANY ($1::uuid[]) ORDER BY t.tarih DESC, t.no DESC`, [l.map((x) => x.tesisId)])).rows;
  return l.flatMap((x): YaklasanTemel[] => {
    const k = tesis.get(x.tesisId);
    if (!k) return [];
    const t = teklifler.find((y) => y.tesis_id === x.tesisId && buDonemTeklifi(y.tarih, x.sonraki));
    const durum = t ? etkinDurum(t, bugun) : null;
    return [{ id: x.tesisId, musteriId: k.m.id, musteri: k.m.kisa, unvan: k.m.unvan, tesis: k.t.ad, yer: [k.t.ilce, k.t.il].filter(Boolean).join(" / ") || null,
      sonraki: x.sonraki, kalan: x.kalan, ekipman: x.ekipman, toplam: x.toplam, turler: x.turler.map((u) => turler.get(u)?.ad ?? "—"),
      teklif: t && durum ? { id: t.id, no: t.no, durum } : null, bekliyor: teklifBekliyor(durum) }];
  });
}

/** Yaklaşan muayeneler listesi (iletişim bilgisiyle); göremeyene null */
export async function yaklasanListesi(db: Sorgulayici, kim: Kisi): Promise<YaklasanSatiri[] | null> {
  if (!teklifGorur(kim)) return null;
  const l = await temel(db);
  const il = await musteriIletisimleri(db, [...new Set(l.map((x) => x.musteriId))]);
  return l.map((x) => { const m = il.get(x.musteriId); return { ...x, ilgili: m?.ilgili ?? null, tel: m?.tel ?? null, eposta: m?.eposta ?? null }; });
}
/** süzgeçten geçenlerin sayfası (süzgeç ekranla aynı tanımla sunucuda — 570); göremeyene null */
export async function yaklasanSayfasi(db: Sorgulayici, kim: Kisi, durum: unknown): Promise<SunucuListe<YaklasanSatiri> | null> {
  const l = await yaklasanListesi(db, kim);
  return l && bellekteListele(yaklasanTanim(), durum, l);
}
/** balonun sayıları: yalnız "yaz" düzeyine (teklifi hazırlayacak kişi); ötekine null */
export async function yaklasanSayisi(db: Sorgulayici, kim: Kisi): Promise<{ gecen: number; yaklasan: number } | null> {
  return teklifDegistirir(kim) ? yaklasanSayilari(await temel(db)) : null;
}
/** tesislerin en yakın muayene günü (aralıktaysa) — teklif e-postasının metni için. Yetki ÇAĞIRANDA. */
export async function tesislerinMuayenesi(db: Sorgulayici, tesisler: readonly string[]): Promise<string | null> {
  if (!tesisler.length) return null;
  return (await temel(db)).filter((x) => tesisler.includes(x.id)).map((x) => x.sonraki).sort()[0] ?? null;
}
