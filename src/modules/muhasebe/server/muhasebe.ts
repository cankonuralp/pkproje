/* MUHASEBE — İŞLER, FATURALAR, TAHSİLAT (327; modül 18; maket muhasebe.html M14). İŞ = plan (proje no): raporları, birim fiyatları (teklif kalemi,
   teklif dışı ya da fiyat listesi — Teklifler'in rapor-bagi.ts'i), faturaları ve tahsilatları. Akış: rapor imzalandı → FATURA (imzalı, faturasız
   raporlarla; dış numara ve tarih) → TAHSİLAT (kısmi olabilir, kalanı aşmaz) → iş kendiliğinden kapanır. Yetki her işlevde, sunucuda (modül 18:
   önerilen düzende firma yöneticisi ve muhasebe "yaz"; öteki roller yok). Kurallar veritabanında da (0039: ileri tarih yok, fatura tarihi son
   imzadan önce olamaz, bir rapor tek faturaya, fatura / tahsilat değişmez, tahsilat kalanı aşmaz). Muhasebe öteki modüllerin tablolarına
   dokunmaz: Planlar, Raporlar, Teklifler, Sözleşmeler ve Müşteriler'in dışa açtığı işlevlerden okur. Tutarlar KURUŞ. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { ekipmanlar } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelMaliyetleri } from "../../personel/server/muhasebe-baglanti.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { muhasebePlanlari, type MuhasebePlani } from "../../planlar/server/muhasebe-baglanti.ts";
import { muhasebeRaporlari, type MuhasebeRaporu } from "../../raporlar/server/muhasebe-baglanti.ts";
import { sozlesmeNumaralari, tesisSozlesmesi } from "../../sozlesmeler/server/sozlesmeler.ts";
import { raporBaglari, type FiyatKaynagi } from "../../teklifler/server/rapor-bagi.ts";
import { donemGelirGider, isKarlilik, sonAylar, type DonemGelirGider, type IsKarlilik, type KarVerisi } from "../karlilik.ts";
import { FaturaGirdisi, gunEkle, kdvTutari, para, TahsilatGirdisi, YONTEM, type FaturaDurumu, type IsDurumu, type Yontem } from "../sema.ts";

const MODUL = 18;
const KDV = 20;
const VARSAYILAN_VADE = 30;
const FATURA = tablo({ ad: "fatura", sutunlar: ["no", "musteri_id", "tarih", "vade_gun", "vade", "sozlesme_id", "kdv", "ara", "kdv_tutar", "toplam"] });
const SATIR = tablo({ ad: "fatura_rapor", sutunlar: ["fatura_id", "rapor_id", "plan_id", "tur_id", "fiyat", "kaynak", "teklif_id"] });
const TAHSILAT = tablo({ ad: "tahsilat", sutunlar: ["fatura_id", "tarih", "tutar", "yontem", "aciklama"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
const tarihYaz = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;

export interface Kisi extends YetkiHesabi { ad: string }
export type Yazma =
  | { durum: "tamam"; id: string; no?: string; bildirim?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const yazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const muhasebeDegistirir = yazar;
const iz = (kim: Kisi, ne: string): Iz => ({ kim: kim.ad, ne });

/* ── VERİ: hepsi bir kez okunur (deneme ölçeği; sayfalama listede) ───────────────────────────────────────────────────────────────── */
type FaturaDb = { id: string; no: string; musteri_id: string; tarih: string; vade_gun: number; vade: string; sozlesme_id: string | null; kdv: number; ara: string;
  kdv_tutar: string; toplam: string; kaydeden: string | null; olustu: Date };
type SatirDb = { fatura_id: string; rapor_id: string; plan_id: string; tur_id: string; fiyat: string; kaynak: FiyatKaynagi; teklif_id: string | null };
type TahsilatDb = { id: string; fatura_id: string; tarih: string; tutar: string; yontem: Yontem; aciklama: string | null; kaydeden: string | null; olustu: Date };

async function oku(db: Sorgulayici, planIdleri: string[] | null) {
  const raporlar = await muhasebeRaporlari(db, planIdleri);
  const planlar = await muhasebePlanlari(db, [...new Set(raporlar.map((r) => r.planId))]);
  const musteriler = await musteriOzetleri(db);
  const tesisMusteri = new Map(musteriler.flatMap((m) => m.tesisler.map((t) => [t.id, { musteri: m, tesis: t }] as const)));
  const baglar = await raporBaglari(db, [...new Set(planlar.map((p) => p.tesisId))]);
  const faturalar = (await db.sorgu<FaturaDb>(
    `SELECT id::text, no, musteri_id::text, tarih::text, vade_gun, vade::text, sozlesme_id::text, kdv, ara::text, kdv_tutar::text, toplam::text, kaydeden::text, olustu
     FROM fatura ORDER BY tarih DESC, no DESC`)).rows;
  const satirlar = (await db.sorgu<SatirDb>(
    "SELECT fatura_id::text, rapor_id::text, plan_id::text, tur_id::text, fiyat::text, kaynak, teklif_id::text FROM fatura_rapor")).rows;
  const tahsilatlar = (await db.sorgu<TahsilatDb>(
    "SELECT id::text, fatura_id::text, tarih::text, tutar::text, yontem, aciklama, kaydeden::text, olustu FROM tahsilat ORDER BY tarih, olustu")).rows;
  /* kârlılık (328): giderler, personel maliyetleri (bordro), sabit giderler — iş başına ve dönem gelir-gideri karlilik.ts'te */
  const giderler = (await db.sorgu<{ tarih: string; plan_id: string | null; tutar: string; oran: number; durum: string }>(
    "SELECT tarih::text, plan_id::text, tutar::text, oran, durum FROM gider")).rows.map((g) => ({ tarih: g.tarih, planId: g.plan_id, tutar: Number(g.tutar), oran: g.oran, durum: g.durum }));
  const pm = await personelMaliyetleri(db);
  const sabit = (await ayarOku(db, "sabit_gider")).deger.kalemler;
  const kar: KarVerisi = { raporlar: raporlar.map((r) => ({ planId: r.planId, personelId: r.personelId, gun: r.gun })), giderler, kisiler: pm.kisiler, bordrolar: pm.bordrolar,
    sabitAylik: sabit.reduce((n, x) => n + x.aylik, 0) };
  return { raporlar, planlar, musteriler, tesisMusteri, baglar, faturalar, satirlar, tahsilatlar, bugun: bugunTr(), kar, sabit };
}
type Veri = Awaited<ReturnType<typeof oku>>;

/* ── FATURA ÖZETİ ───────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface FaturaSatiri {
  id: string; no: string; tarih: string; vade: string; vadeGun: number; musteriId: string; musteri: string; unvan: string;
  isler: { id: string; no: string; tesis: string }[]; raporSayisi: number; ara: number; kdv: number; kdvTutar: number; toplam: number;
  tahsil: number; kalan: number; durum: FaturaDurumu; sonOdeme: string | null;
}
function faturaOzet(v: Veri, f: FaturaDb): FaturaSatiri {
  const m = v.musteriler.find((x) => x.id === f.musteri_id);
  const s = v.satirlar.filter((x) => x.fatura_id === f.id), t = v.tahsilatlar.filter((x) => x.fatura_id === f.id);
  const toplam = Number(f.toplam), tahsil = t.reduce((n, x) => n + Number(x.tutar), 0), kalan = toplam - tahsil;
  const isler = [...new Set(s.map((x) => x.plan_id))].map((id) => {
    const p = v.planlar.find((y) => y.id === id);
    return { id, no: p?.no ?? "—", tesis: (p && v.tesisMusteri.get(p.tesisId)?.tesis.ad) ?? "—" };
  });
  return {
    id: f.id, no: f.no, tarih: f.tarih, vade: f.vade, vadeGun: f.vade_gun, musteriId: f.musteri_id, musteri: m?.kisa ?? "—", unvan: m?.unvan ?? "—", isler,
    raporSayisi: s.length, ara: Number(f.ara), kdv: f.kdv, kdvTutar: Number(f.kdv_tutar), toplam, tahsil, kalan,
    durum: kalan <= 0 ? "odendi" : f.vade < v.bugun ? "gecikti" : tahsil > 0 ? "kismi" : "bekliyor",
    sonOdeme: kalan <= 0 && t.length ? t[t.length - 1].tarih : null,
  };
}

/* ── İŞ ÖZETİ ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface IsSatiri {
  id: string; no: string; tarih: string; musteriId: string; musteri: string; unvan: string; tesisId: string; tesis: string;
  imzali: number; toplam: number; faturali: number; hazir: number; surec: number;
  /** KDV hariç, kuruş: raporların birim fiyatları (faturalandıysa faturadaki) */
  raporlanan: number; fiyatsiz: number;
  faturalanan: number; tahsil: number; kalan: number; durum: IsDurumu; kapandi: string | null; faturaNolari: string[];
  /** kâr (KDV hariç, kuruş) ve oranı (%; gelir yoksa 0) — karlilik.ts */
  kar: number; karOran: number;
}
function isOzet(v: Veri, p: MuhasebePlani): IsSatiri & { raporlar: MuhasebeRaporu[]; faturalar: FaturaSatiri[]; karlilik: IsKarlilik } {
  const tm = v.tesisMusteri.get(p.tesisId);
  const raporlar = v.raporlar.filter((r) => r.planId === p.id);
  const faturali = new Map(v.satirlar.filter((s) => s.plan_id === p.id).map((s) => [s.rapor_id, s]));
  const fiyat = (r: MuhasebeRaporu) => { const s = faturali.get(r.id); return s ? Number(s.fiyat) : v.baglar.get(r.id)?.fiyat ?? null; };
  const hazir = raporlar.filter((r) => r.imzaGunu && !faturali.has(r.id)), surec = raporlar.filter((r) => !r.imzaGunu);
  const faturalar = [...new Set([...faturali.values()].map((s) => s.fatura_id))].map((id) => faturaOzet(v, v.faturalar.find((f) => f.id === id)!))
    .sort((a, b) => b.tarih.localeCompare(a.tarih) || b.no.localeCompare(a.no));
  const faturalanan = faturalar.reduce((n, f) => n + f.toplam, 0), tahsil = faturalar.reduce((n, f) => n + f.tahsil, 0), kalan = faturalanan - tahsil;
  const durum: IsDurumu = faturalar.some((f) => f.durum === "gecikti") ? "gecikti" : hazir.length ? "hazir" : kalan > 0 ? "tahsilat"
    : surec.length || p.durum !== "tamamlandi" ? "rapor" : "kapandi";
  const kapandi = durum === "kapandi"
    ? v.tahsilatlar.filter((t) => faturalar.some((f) => f.id === t.fatura_id)).reduce((s, t) => (t.tarih > s ? t.tarih : s), "") || null : null;
  const raporlanan = raporlar.reduce((n, r) => n + (fiyat(r) ?? 0), 0);
  const karlilik = isKarlilik(v.kar, { id: p.id, tarih: p.baslangic, gelir: raporlanan });
  return {
    id: p.id, no: p.no, tarih: p.baslangic, musteriId: tm?.musteri.id ?? "", musteri: tm?.musteri.kisa ?? "—", unvan: tm?.musteri.unvan ?? "—", tesisId: p.tesisId,
    tesis: tm?.tesis.ad ?? "—", imzali: raporlar.length - surec.length, toplam: raporlar.length, faturali: faturali.size, hazir: hazir.length, surec: surec.length,
    raporlanan, fiyatsiz: raporlar.filter((r) => fiyat(r) === null).length,
    faturalanan, tahsil, kalan, durum, kapandi, faturaNolari: faturalar.map((f) => f.no), kar: karlilik.kar, karOran: karlilik.oran, raporlar, faturalar, karlilik,
  };
}
const satirOf = (o: ReturnType<typeof isOzet>): IsSatiri => { const { raporlar: _r, faturalar: _f, karlilik: _k, ...s } = o; void _r; void _f; void _k; return s; };

/** İşler listesi (planın ilk raporu yazılınca iş görünür), en yeni denetim üstte; göremeyene null */
export async function isListesi(db: Sorgulayici, kim: Kisi): Promise<IsSatiri[] | null> {
  if (!gorur(kim)) return null;
  const v = await oku(db, null);
  return v.planlar.map((p) => satirOf(isOzet(v, p))).sort((a, b) => b.tarih.localeCompare(a.tarih) || b.no.localeCompare(a.no));
}

/** Faturalar listesi, en yeni üstte; göremeyene null */
export async function faturaListesi(db: Sorgulayici, kim: Kisi): Promise<FaturaSatiri[] | null> {
  if (!gorur(kim)) return null;
  const v = await oku(db, null);
  return v.faturalar.map((f) => faturaOzet(v, f));
}

/* ── İŞ SAYFASI ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface IsRaporu {
  id: string; no: string; ekipmanKod: string; turAd: string; durum: MuhasebeRaporu["durum"]; imzali: boolean;
  fiyat: number | null; kaynak: FiyatKaynagi; teklif: { id: string; no: string } | null; fatura: { id: string; no: string } | null;
}
export interface FaturaKalemi { turId: string; turAd: string; fiyat: number | null; adet: number; disi: boolean }
export interface FaturaOnizleme {
  isler: { id: string; no: string }[]; raporSayisi: number; kalemler: FaturaKalemi[]; ara: number; kdv: number; kdvTutar: number; toplam: number;
  fiyatsiz: number; surec: number; sonImza: string | null; vadeGun: number; sozlesme: { id: string; no: string } | null;
}
export interface IsKarti extends IsSatiri {
  ekip: string[]; raporlar: IsRaporu[]; faturalar: FaturaSatiri[]; teklif: { id: string; no: string } | null; sozlesme: { id: string; no: string; vade: number } | null;
  gecmis: [tarih: string, ne: string, ayrinti: string][];
  /** fatura: tek işin faturası; toplu: müşterinin faturaya hazır bütün işleri (birden çoksa) */
  onizleme: { tek: FaturaOnizleme | null; toplu: FaturaOnizleme | null };
  acikFatura: string | null;
  /** kârlılık (328): gelir − işe bağlı masraf − denetçi maliyeti − genel gider payı */
  karlilik: IsKarlilik;
  izin: { fatura: boolean; tahsilat: boolean; gider: boolean };
}

async function kalemler(db: Sorgulayici, l: { turId: string; fiyat: number | null; kaynak: FiyatKaynagi }[]): Promise<FaturaKalemi[]> {
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad]));
  const g = new Map<string, FaturaKalemi>();
  for (const x of l) {
    const k = `${x.turId}|${x.fiyat}`;
    const o = g.get(k) ?? { turId: x.turId, turAd: tur.get(x.turId) ?? "—", fiyat: x.fiyat, adet: 0, disi: false };
    o.adet++; o.disi ||= x.kaynak === "disi";
    g.set(k, o);
  }
  return [...g.values()].sort((a, b) => a.turAd.localeCompare(b.turAd, "tr") || (a.fiyat ?? 0) - (b.fiyat ?? 0));
}

/** faturaya girecekler: işin (toplu ise müşterinin faturaya hazır bütün işlerinin) imzalı, faturasız raporları */
async function onizleme(db: Sorgulayici, v: Veri, ana: MuhasebePlani, toplu: boolean): Promise<FaturaOnizleme> {
  const anaMusteri = v.tesisMusteri.get(ana.tesisId)?.musteri.id;
  const planlar = toplu ? v.planlar.filter((p) => v.tesisMusteri.get(p.tesisId)?.musteri.id === anaMusteri) : [ana];
  const faturali = new Set(v.satirlar.map((s) => s.rapor_id));
  const hazir = v.raporlar.filter((r) => planlar.some((p) => p.id === r.planId) && r.imzaGunu && !faturali.has(r.id));
  const isler = planlar.filter((p) => hazir.some((r) => r.planId === p.id)).map((p) => ({ id: p.id, no: p.no }));
  const l = hazir.map((r) => { const b = v.baglar.get(r.id); return { turId: r.turId, fiyat: b?.fiyat ?? null, kaynak: b?.kaynak ?? "liste" as FiyatKaynagi }; });
  const ara = l.reduce((n, x) => n + (x.fiyat ?? 0), 0), kdvTutar = kdvTutari(ara, KDV);
  const soz = await tesisSozlesmesi(db, ana.tesisId, ana.baslangic);
  return {
    isler, raporSayisi: hazir.length, kalemler: await kalemler(db, l), ara, kdv: KDV, kdvTutar, toplam: ara + kdvTutar, fiyatsiz: l.filter((x) => x.fiyat === null).length,
    surec: v.raporlar.filter((r) => planlar.some((p) => p.id === r.planId) && !r.imzaGunu).length,
    sonImza: hazir.reduce<string | null>((s, r) => (r.imzaGunu! > (s ?? "") ? r.imzaGunu : s), null),
    vadeGun: soz?.vade ?? VARSAYILAN_VADE, sozlesme: soz ? { id: soz.id, no: soz.no } : null,
  };
}

/** iş sayfası (planın kimliğiyle); göremeyene ya da işi (raporu) olmayana null */
export async function isKarti(db: Sorgulayici, kim: Kisi, planId: string): Promise<IsKarti | null> {
  if (!gorur(kim) || !UUID.test(planId)) return null;
  const v = await oku(db, null);
  const p = v.planlar.find((x) => x.id === planId);
  if (!p) return null;
  const o = isOzet(v, p);
  const ek = new Map((await ekipmanlar(db, o.raporlar.map((r) => r.ekipmanId))).map((e) => [e.id, e.kod]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad]));
  const faturaNo = new Map(v.faturalar.map((f) => [f.id, f.no]));
  const satir = new Map(v.satirlar.map((s) => [s.rapor_id, s]));
  const raporlar: IsRaporu[] = o.raporlar.map((r) => {
    const s = satir.get(r.id), b = v.baglar.get(r.id);
    return {
      id: r.id, no: r.no, ekipmanKod: ek.get(r.ekipmanId) ?? "—", turAd: tur.get(r.turId) ?? "—", durum: r.durum, imzali: !!r.imzaGunu,
      fiyat: s ? Number(s.fiyat) : b?.fiyat ?? null, kaynak: s ? s.kaynak : b?.kaynak ?? "liste",
      teklif: s?.teklif_id ? { id: s.teklif_id, no: b?.teklif?.id === s.teklif_id ? b.teklif.no : "—" } : b?.teklif ?? null,
      fatura: s ? { id: s.fatura_id, no: faturaNo.get(s.fatura_id) ?? "—" } : null,
    };
  });
  const soz = await tesisSozlesmesi(db, p.tesisId, p.baslangic);
  const ekip = (await personelOzetleri(db, p.ekip)).map((x) => x.ad);
  const kaydeden = await hesapAdlari(db, [...v.faturalar.map((f) => f.kaydeden), ...v.tahsilatlar.map((t) => t.kaydeden)]);
  const gecmis: IsKarti["gecmis"] = [[p.baslangic, "Denetim", ekip.join(", ")]];
  const imzaSon = o.raporlar.reduce<string>((s, r) => (r.imzaGunu && r.imzaGunu > s ? r.imzaGunu : s), "");
  if (imzaSon) gecmis.push([imzaSon, o.imzali === o.toplam ? "Raporların hepsi imzalandı, müşteriye açıldı" : `${o.imzali} rapor imzalandı, müşteriye açıldı`, `${o.imzali} / ${o.toplam}`]);
  for (const f of o.faturalar) {
    const fd = v.faturalar.find((x) => x.id === f.id)!;
    gecmis.push([f.tarih, `Fatura kaydedildi · ${f.no}`, `${para(f.toplam)} · ${fd.kaydeden ? kaydeden.get(fd.kaydeden) ?? "—" : "—"}`]);
    for (const t of v.tahsilatlar.filter((x) => x.fatura_id === f.id)) gecmis.push([t.tarih, `Tahsilat · ${para(Number(t.tutar))}`, YONTEM[t.yontem]]);
  }
  if (o.kapandi) gecmis.push([o.kapandi, "İş kapandı", "arşiv"]);
  gecmis.sort((a, b) => b[0].localeCompare(a[0]));
  const yaz = yazar(kim);
  const tek = o.hazir ? await onizleme(db, v, p, false) : null;
  const toplu = o.hazir ? await onizleme(db, v, p, true) : null;
  return {
    ...satirOf(o), ekip, raporlar, faturalar: o.faturalar, teklif: raporlar.find((r) => r.teklif)?.teklif ?? null, sozlesme: soz, gecmis,
    onizleme: { tek, toplu: toplu && toplu.isler.length > 1 ? toplu : null },
    /* en eski açık fatura (maket isCiz acik[0]; o.faturalar yeniden eskiye — 324–327 incelemesi) */
    acikFatura: [...o.faturalar].reverse().find((f) => f.kalan > 0)?.id ?? null, karlilik: o.karlilik,
    izin: { fatura: yaz && o.hazir > 0, tahsilat: yaz && o.faturalar.some((f) => f.kalan > 0), gider: yaz },
  };
}

/* ── FATURA SAYFASI ─────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface FaturaKarti extends FaturaSatiri {
  vd: string | null; vno: string | null; sozlesme: { id: string; no: string } | null; kaydeden: string; kalemler: FaturaKalemi[];
  tahsilatlar: { id: string; tarih: string; tutar: number; yontem: string; aciklama: string | null; kaydeden: string }[];
  izin: { tahsilat: boolean };
}
export async function faturaKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<FaturaKarti | null> {
  if (!gorur(kim) || !UUID.test(id)) return null;
  const v = await oku(db, null);
  const f = v.faturalar.find((x) => x.id === id);
  if (!f) return null;
  const o = faturaOzet(v, f), m = v.musteriler.find((x) => x.id === f.musteri_id);
  const t = v.tahsilatlar.filter((x) => x.fatura_id === id);
  const ad = await hesapAdlari(db, [f.kaydeden, ...t.map((x) => x.kaydeden)]);
  const soz = f.sozlesme_id ? { no: (await sozlesmeNumaralari(db, [f.sozlesme_id])).get(f.sozlesme_id) } : undefined;
  return {
    ...o, vd: m?.vd ?? null, vno: m?.vno ?? null, sozlesme: f.sozlesme_id ? { id: f.sozlesme_id, no: soz?.no ?? "—" } : null,
    kaydeden: f.kaydeden ? ad.get(f.kaydeden) ?? "—" : "—",
    kalemler: await kalemler(db, v.satirlar.filter((s) => s.fatura_id === id).map((s) => ({ turId: s.tur_id, fiyat: Number(s.fiyat), kaynak: s.kaynak }))),
    tahsilatlar: t.map((x) => ({ id: x.id, tarih: x.tarih, tutar: Number(x.tutar), yontem: YONTEM[x.yontem], aciklama: x.aciklama, kaydeden: x.kaydeden ? ad.get(x.kaydeden) ?? "—" : "—" }))
      .sort((a, b) => b.tarih.localeCompare(a.tarih)),
    izin: { tahsilat: yazar(kim) && o.kalan > 0 },
  };
}

/* ── GELİR-GİDER (328; maket #/gelir-gider): ay ya da "toplam" (ilk işin ayından bu aya; en çok 36 ay) ──────────────────────────────── */
export interface GelirGider {
  /** seçilen: "toplam" ya da YYYY-AA */
  secili: string; secenekler: string[]; aylar: string[]; donem: DonemGelirGider; sabit: { ad: string; aylik: number; not: string }[];
  isler: (IsSatiri & { karlilik: IsKarlilik })[];
}
/** dönem seçenekleri: bu aydan geriye 13 ay (maket ggAylar) */
const GG_AY = 13;
export async function gelirGider(db: Sorgulayici, kim: Kisi, secim: string): Promise<GelirGider | null> {
  if (!gorur(kim)) return null;
  const v = await oku(db, null);
  const buAy = v.bugun.slice(0, 7), secenek = sonAylar(buAy, GG_AY);
  const secili = secenek.includes(secim) ? secim : "toplam";
  const ilk = v.planlar.reduce((s, p) => (p.baslangic.slice(0, 7) < s ? p.baslangic.slice(0, 7) : s), buAy);
  const aylar = secili === "toplam" ? secenek.filter((a) => a >= ilk).reverse() : [secili];
  const ozet = v.planlar.map((p) => isOzet(v, p));
  const donem = donemGelirGider(v.kar, aylar, ozet.map((o) => ({ id: o.id, tarih: o.tarih, gelir: o.raporlanan })));
  const icinde = new Set(donem.isler);
  return {
    secili, secenekler: secenek, aylar, donem, sabit: v.sabit,
    isler: ozet.filter((o) => icinde.has(o.id)).map((o) => ({ ...satirOf(o), karlilik: o.karlilik })).sort((a, b) => b.tarih.localeCompare(a.tarih) || b.no.localeCompare(a.no)),
  };
}

/* ── YAZMA ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** fatura kaydet (iş sayfasından; toplu ise müşterinin faturaya hazır bütün işleri): imzalı, faturasız raporlar; fiyatlar kayıt anında yazılır */
export async function faturaKaydet(db: Sorgulayici, kim: Kisi, planId: string, girdi: unknown): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(planId)) return { durum: "yok" };
  const g = dogrula(FaturaGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const x = g.veri;
  /* aynı işin faturası aynı anda iki kez kaydedilmesin: planlar kilitlenir (rapor tek faturaya — veritabanı da denetler) */
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('fatura:' || gecerli_firma()::text))");
  const v = await oku(db, null);
  const p = v.planlar.find((y) => y.id === planId);
  if (!p) return { durum: "yok" };
  const o = await onizleme(db, v, p, x.toplu);
  if (!o.raporSayisi) return { durum: "red", neden: "Faturaya hazır imzalı rapor yok." };
  if (o.fiyatsiz) return { durum: "red", neden: `${o.fiyatsiz} raporun birim fiyatı yok (teklifte ya da fiyat listesinde değil); fiyat listesine ekleyin.` };
  const h: DogrulamaHatalari = {};
  if ((await db.sorgu("SELECT 1 FROM fatura WHERE no = $1", [x.no])).rowCount) h.no = `${x.no} zaten kayıtlı.`;
  if (x.tarih > v.bugun) h.tarih = "İleri tarihli fatura kaydedilmez.";
  else if (o.sonImza && x.tarih < o.sonImza) h.tarih = `Faturaya giren son rapor ${tarihYaz(o.sonImza)} tarihinde imzalandı; fatura bundan önce olamaz.`;
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const musteri = v.tesisMusteri.get(p.tesisId)!.musteri.id;
  const r = await ekle(db, FATURA, { no: x.no, musteri_id: musteri, tarih: x.tarih, vade_gun: o.vadeGun, vade: gunEkle(x.tarih, o.vadeGun), sozlesme_id: o.sozlesme?.id ?? null,
    kdv: o.kdv, ara: o.ara, kdv_tutar: o.kdvTutar, toplam: o.toplam }, iz(kim, "fatura.kaydet"));
  const faturali = new Set(v.satirlar.map((s) => s.rapor_id)), planlar = new Set(o.isler.map((y) => y.id));
  for (const rp of v.raporlar.filter((y) => planlar.has(y.planId) && y.imzaGunu && !faturali.has(y.id))) {
    const b = v.baglar.get(rp.id)!;
    await ekle(db, SATIR, { fatura_id: r.id, rapor_id: rp.id, plan_id: rp.planId, tur_id: rp.turId, fiyat: b.fiyat, kaynak: b.kaynak, teklif_id: b.teklif?.id ?? null },
      iz(kim, "fatura.rapor"));
  }
  return { durum: "tamam", id: r.id, no: x.no, bildirim: `${x.no} kaydedildi: ${o.raporSayisi} rapor, ${para(o.toplam)} (KDV dahil).` };
}

/** tahsilat ekle: kısmi olabilir, kalanı aşmaz; tarih fatura tarihinden önce ve ileri olamaz */
export async function tahsilatKaydet(db: Sorgulayici, kim: Kisi, faturaId: string, girdi: unknown): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(faturaId)) return { durum: "yok" };
  const g = dogrula(TahsilatGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const x = g.veri;
  /* aynı faturaya aynı anda iki tahsilat: danışma kilidi (veritabanı tetiği de aynı kilidi alır; faturada satır kilidi yok — UPDATE hakkı yok) */
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('tahsilat:' || $1))", [faturaId]);
  const f = (await db.sorgu<{ no: string; tarih: string; toplam: string }>("SELECT no, tarih::text, toplam::text FROM fatura WHERE id = $1", [faturaId])).rows[0];
  if (!f) return { durum: "yok" };
  const odenen = Number((await db.sorgu<{ n: string }>("SELECT coalesce(sum(tutar), 0)::text AS n FROM tahsilat WHERE fatura_id = $1", [faturaId])).rows[0].n);
  const kalan = Number(f.toplam) - odenen;
  const h: DogrulamaHatalari = {};
  if (x.tarih > bugunTr()) h.tarih = "İleri tarihli tahsilat kaydedilmez.";
  else if (x.tarih < f.tarih) h.tarih = `Fatura tarihinden (${tarihYaz(f.tarih)}) önce olamaz.`;
  if (kalan <= 0) return { durum: "red", neden: `${f.no} ödendi; tahsilat eklenmez.` };
  if (x.tutar > kalan) h.tutar = `Kalan ${para(kalan)}; fazlası kaydedilmez.`;
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const r = await ekle(db, TAHSILAT, { fatura_id: faturaId, tarih: x.tarih, tutar: x.tutar, yontem: x.yontem, aciklama: x.aciklama }, iz(kim, "tahsilat.kaydet"));
  const yeniKalan = kalan - x.tutar;
  return { durum: "tamam", id: r.id, no: f.no,
    bildirim: `${para(x.tutar)} tahsilat kaydedildi${yeniKalan <= 0 ? `; ${f.no} ödendi.` : `; kalan ${para(yeniKalan)}.`}` };
}
