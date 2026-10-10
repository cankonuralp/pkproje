/* ONAYLAR (modül 15; maket onaylar.html M9; KOD-GECIS §4 rapor_onayla / rapor_geri_gonder / rapor_durum_degistir, §5 Rapor; karar 102, 190,
   191; N7 — vekil yok, her yönetici kendi branşını görür). Yetki her işlevde SUNUCUDA:
   · Görme: Onaylar düzeyi — "gör" (firma yöneticisi) hepsi, "branşı" (branş yöneticisi) türün branşı; denetçi "kendi" (C5, 2026-10-05: imzanın
     tek merkezi Onaylar — yalnız İMZASINI BEKLEYEN kendi raporları; kuyruk, tüm raporlar ve onay ekranı yöneticinin); planlama, muhasebe "kendi"
     (477: kendi belgeleri ve karar verebildiği talepler). Göremeyen rapor "yok" (var olduğu söylenmez).
   · 477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 "onay bekleyen her şey Onaylar'da", T2 talep değiştirilmez): Talepler sekmesi — kişinin
     karar verebildiği izin talepleri (firma yöneticisi) ve masraf formları (Muhasebe'yi değiştiren); karar Talepler modülünde (talepKarar).
   · Onayla / Onayı geri al: rapor_onayla — türün branş yöneticisi. Kendi yazdığı raporu da onaylar (C1, reisim kararı pkproje §1: "hazırlayanın
     kendi raporunu onaylaması da engellenmez"). Geri gönder: rapor_geri_gonder, gerekçe ≥ 10. Durumu değiştir: rapor_durum_degistir, Yeni /
     onayda / onaylandı arasında (Tamamlandı'ya yalnız imzayla); Yeni'ye ise gerekçe ≥ 10; Onaylandı'ya almak onay sayılır (191).
   · Kuyruk: branşın onaydaki raporları, en yeni üstte; onaylayınca ya da geri gönderince sıradaki rapor açılır.
   · Revizyon (318; maket 131 V1, 141 W4): tamamlanan raporda Revizeye gönder (rapor_revizeye_gonder — türün branş yöneticisi; gerekçe ≥ 10;
     rapor R1, R2 … olarak denetçiye Yeni döner, imzalı sürüm saklı) · denetçinin "Revize istekleri" (branşın bekleyen istekleri, en yeni üstte):
     Reddet (gerekçe isteğe bağlı) ya da Revizeye gönder (isteğin gerekçesi başlangıç; gönderince istek kapanır).
   Rapor tablosuna dokunulmaz: Raporlar'ın onay-baglanti.ts kapısından okunur ve yazılır; geçiş kuralları ve damgalar veritabanında (0026). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Iz } from "../../../server/db/yazici.ts";
import { canDo, canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import {
  bekleyenRevizeIstegi, raporDurumYaz, raporOzetleri, raporRevizeYaz, revizeIstegiReddet as istekReddet, revizeIstekleri, type OnayGecisi, type RaporOzeti,
} from "../../raporlar/server/onay-baglanti.ts";
import { gozdenGecirme, type GozdenGecirmeMaddesi } from "../../raporlar/server/raporlar.ts";
import { gorunenNo, RAPOR_DURUM, RevizeGirdisi, RevizeRedGirdisi } from "../../raporlar/sema.ts";
import { hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { DurumGirdisi, GeriGirdisi } from "../sema.ts";
import { bekleyenBelgeSayisi } from "./belgeler.ts";
import { onayTalepleri, talepOnaylar, type OnayTalebi } from "../../talepler/server/talepler.ts";
import type { Rol } from "../../../server/yetki/tanim.ts";

const MODUL = 15;
export interface Kisi extends YetkiHesabi { ad: string }
export type OnayYazma =
  | { durum: "tamam"; bildirim: string; sonraki: string | null }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "yetkisiz" } | { durum: "cakisma" } | { durum: "yok" };

export interface OnayIzni { onayla: boolean; geriGonder: boolean; onayGeriAl: boolean; durumDegistir: boolean; revize: boolean }
/** ekrana giden satır: yazan hesabın kimliği gitmez */
export type OnaySatiri = Omit<RaporOzeti, "hesapId"> & { bekleme: string | null; eski: boolean; izin: OnayIzni };
/** 477: Onaylar › Talepler satırı (bekleme sunucuda) */
export type OnayTalebiSatiri = OnayTalebi & { bekleme: string | null; eski: boolean };
/** sahada rapor yazan roller — "İmzamı bekleyen raporlar" sekmesi onların (uygulama düzeninin SAHA_ROLLERI ile aynı) */
const RAPOR_YAZAN: readonly Rol[] = ["denetci", "mekanik_yonetici", "elektrik_yonetici"];

const kayit = (r: RaporOzeti) => ({ sahip: r.hesapId, brans: r.brans, durum: RAPOR_DURUM[r.durum][0] });
const gorur = (kim: Kisi, r: RaporOzeti) => canDo(kim, MODUL, "gor", { sahip: r.hesapId, brans: r.brans });
/** Onaylar menüsü ve sayfaları: düzeyi olan */
export const onaylarGorur = (kim: Kisi) => duzey(kim, MODUL) !== "yok";
/** kuyruk, tüm raporlar ve onay ekranı: yönetici düzeyi (branşı, gör, yaz); "kendi" (denetçi) yalnız imzasını bekleyenleri görür */
const yoneticiMi = (kim: Kisi) => { const d = duzey(kim, MODUL); return d === "brans" || d === "gor" || d === "yaz"; };

function izinler(kim: Kisi, r: RaporOzeti): OnayIzni {
  const k = kayit(r);
  return {
    onayla: r.durum === "onayda" && canDoEylem(kim, "rapor_onayla", k),
    geriGonder: r.durum === "onayda" && canDoEylem(kim, "rapor_geri_gonder", k),
    onayGeriAl: r.durum === "onaylandi" && canDoEylem(kim, "rapor_onayla", k),
    durumDegistir: (r.durum === "taslak" || r.durum === "onayda" || r.durum === "onaylandi") && canDoEylem(kim, "rapor_durum_degistir", k),
    revize: r.durum === "imzali" && canDoEylem(kim, "rapor_revizeye_gonder", k),
  };
}
/** bekleme yazısı (maket bekleme): az önce · N saattir · N gündür; 24 saatten eski işaretli */
function beklemesi(gonderildi: string | null, simdi: number): { bekleme: string | null; eski: boolean } {
  if (!gonderildi) return { bekleme: null, eski: false };
  const h = Math.floor((simdi - Date.parse(gonderildi)) / 36e5);
  return { bekleme: h < 1 ? "az önce" : h < 24 ? `${h} saattir` : `${Math.floor(h / 24)} gündür`, eski: h >= 24 };
}
function satir(kim: Kisi, r: RaporOzeti, simdi: number): OnaySatiri {
  const x: Partial<RaporOzeti> = { ...r };
  delete x.hesapId;
  return { ...(x as Omit<RaporOzeti, "hesapId">), ...beklemesi(r.durum === "onayda" ? r.gonderildi : null, simdi), izin: izinler(kim, r) };
}
const enYeni = (a: RaporOzeti, b: RaporOzeti) => (b.gonderildi ?? "").localeCompare(a.gonderildi ?? "") || b.olustu.localeCompare(a.olustu);

/** kişinin onay kuyruğu (görebildiği onaydaki raporlar, en yeni üstte) */
async function kuyrukOzetleri(db: Sorgulayici, kim: Kisi): Promise<RaporOzeti[]> {
  return (await raporOzetleri(db, { durumlar: ["onayda"] })).filter((r) => gorur(kim, r)).sort(enYeni);
}

export interface OnayListeleri {
  /** yönetici düzeyi (kuyruk ve tüm raporlar onun); değilse yalnız imzasını bekleyen raporlar */
  yonetici: boolean;
  kuyruk: OnaySatiri[]; tumu: OnaySatiri[]; branslar: ("m" | "e")[];
  /** kişinin YAZDIĞI, onaylanmış (son imzasını bekleyen) raporları — maket onaylar.html BB4 "İmzamı bekleyen raporlar"; onay sırasıyla (eski önce) */
  imzaBekleyen: OnaySatiri[];
  /** görebildiği tamamlanan raporlardaki bekleyen revize istekleri (318; yalnız yönetici), en yeni üstte */
  istekler: RevizeIstekSatiri[];
  /** imzasını bekleyen diğer belgeler (333; bordro, eğitim / zimmet formu, araç tutanağı — kişinin kendi) */
  belgeBekleyen: number;
  /** 477: karar verebildiği bekleyen izin talepleri ve masraf formları (eski önce) · karar verebilir mi (sekme boşken de görünür) */
  talepler: OnayTalebiSatiri[]; talepOnaylar: boolean;
  /** rapor yazan (İmzamı bekleyen raporlar sekmesi onun) */
  imzaci: boolean;
}
/** revize isteği: isteyenin adı, zaman, gerekçe; isteğin sürümü (Reddet onunla yazılır) */
export interface RevizeIstekBilgisi { id: string; surum: number; kim: string; zaman: string; gerekce: string }
export type RevizeIstekSatiri = OnaySatiri & { istek: RevizeIstekBilgisi };
/** Onay kuyruğu + Tüm raporlar (branşın bütün raporları; maket 190) + İmzamı bekleyen raporlar (C5); Onaylar'ı göremeyene null */
export async function onayListeleri(db: Sorgulayici, kim: Kisi): Promise<OnayListeleri | null> {
  if (!onaylarGorur(kim)) return null;
  const simdi = Date.now(), yonetici = yoneticiMi(kim);
  const hepsi = await raporOzetleri(db);
  const tum = yonetici ? hepsi.filter((r) => gorur(kim, r)) : [];
  const imzaBekleyen = hepsi.filter((r) => r.durum === "onaylandi" && !!r.hesapId && r.hesapId === kim.id && canDoEylem(kim, "rapor_son_imza", { sahip: r.hesapId }))
    .sort((a, b) => (a.onay ?? "").localeCompare(b.onay ?? "")).map((r) => satir(kim, r, simdi));
  /* revize istekleri: görebildiği tamamlanan raporun şimdiki revizyonundaki bekleyen istek */
  const tamam = new Map(tum.filter((r) => r.durum === "imzali").map((r) => [r.id, r]));
  const ham = yonetici ? (await revizeIstekleri(db)).filter((x) => tamam.has(x.raporId)) : [];
  const adlar = await hesapAdlari(db, ham.map((x) => x.hesapId));
  const istekler = ham.map((x) => ({ ...satir(kim, tamam.get(x.raporId)!, simdi), istek: { id: x.id, surum: x.surum, kim: adlar.get(x.hesapId ?? "") ?? "—", zaman: x.zaman, gerekce: x.gerekce } }));
  return {
    yonetici,
    kuyruk: tum.filter((r) => r.durum === "onayda").sort(enYeni).map((r) => satir(kim, r, simdi)),
    tumu: [...tum].sort((a, b) => b.olustu.localeCompare(a.olustu)).map((r) => satir(kim, r, simdi)),
    branslar: [...new Set(tum.map((r) => r.brans))].sort(),
    imzaBekleyen,
    istekler,
    belgeBekleyen: await bekleyenBelgeSayisi(db, kim),
    talepler: (await onayTalepleri(db, kim)).map((t) => ({ ...t, ...beklemesi(t.gonderildi, simdi) })),
    talepOnaylar: talepOnaylar(kim),
    imzaci: imzaBekleyen.length > 0 || kim.roller.some((r) => RAPOR_YAZAN.includes(r)),
  };
}

export interface OnayEkrani {
  r: OnaySatiri; ozet: GozdenGecirmeMaddesi[]; sira: number | null; kuyrukBoyu: number;
  /** tamamlanan raporda yazanın bekleyen revize isteği (318) */
  istek: RevizeIstekBilgisi | null;
}
/** onay ekranı: gözden geçirme özeti + sıra; göremeyene null */
export async function onayEkrani(db: Sorgulayici, kim: Kisi, id: string): Promise<OnayEkrani | null> {
  if (!yoneticiMi(kim)) return null;
  const r = (await raporOzetleri(db, { id }))[0];
  if (!r || !gorur(kim, r)) return null;
  const q = r.durum === "onayda" ? await kuyrukOzetleri(db, kim) : [];
  const i = q.findIndex((x) => x.id === id);
  const b = r.durum === "imzali" ? await bekleyenRevizeIstegi(db, r.id, r.revizyon) : null;
  const istek = b ? { id: b.id, surum: b.surum, kim: (await hesapAdlari(db, [b.hesapId])).get(b.hesapId ?? "") ?? "—", zaman: b.zaman, gerekce: b.gerekce } : null;
  return { r: satir(kim, r, Date.now()), ozet: (await gozdenGecirme(db, id)) ?? [], sira: i >= 0 ? i + 1 : null, kuyrukBoyu: q.length, istek };
}

/* ── EYLEMLER ────────────────────────────────────────────────────────────────────────────────────────────────── */
async function bul(db: Sorgulayici, kim: Kisi, id: string): Promise<RaporOzeti | null> {
  if (!yoneticiMi(kim)) return null;
  const r = (await raporOzetleri(db, { id }))[0];
  return r && gorur(kim, r) ? r : null;
}
/** kuyrukta bundan sonraki rapor (yoksa baştaki; kendisi değilse) — geçişten ÖNCE bakılır */
async function sonrakiRapor(db: Sorgulayici, kim: Kisi, id: string): Promise<string | null> {
  const q = await kuyrukOzetleri(db, kim), i = q.findIndex((x) => x.id === id);
  const s = q[i + 1] ?? q[0];
  return s && s.id !== id ? s.id : null;
}
const iz = (kim: Kisi, ne: string, r: RaporOzeti): Iz => ({ kim: kim.ad, ne, gerekce: r.no });
async function yaz(db: Sorgulayici, kim: Kisi, r: RaporOzeti, surum: number, hedef: OnayGecisi, gerekce: string | null, ne: string): Promise<"tamam" | "cakisma" | "yok"> {
  const g = await raporDurumYaz(db, iz(kim, ne, r), r.id, surum, hedef, gerekce);
  return g.durum === "tamam" ? "tamam" : g.durum === "cakisma" ? "cakisma" : g.durum === "degisiklik_yok" ? "cakisma" : "yok";
}
const durumAd = (d: keyof typeof RAPOR_DURUM) => RAPOR_DURUM[d][0];

/** Onayla (onayda → onaylandı): muayene uzmanının son imzasına gider; sıradaki rapor açılır */
export async function onayla(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (!canDoEylem(kim, "rapor_onayla", kayit(r))) return { durum: "yetkisiz" };
  if (r.durum !== "onayda") return { durum: "red", neden: `Rapor onay kuyruğunda değil (şu an: ${durumAd(r.durum)}).` };
  const s = await sonrakiRapor(db, kim, id);
  const y = await yaz(db, kim, r, surum, "onaylandi", null, "rapor.onayla");
  if (y !== "tamam") return { durum: y };
  return { durum: "tamam", sonraki: s, bildirim: `${r.no} onaylandı; muayene uzmanı imzasında, ${r.denetci} imzalayınca tamamlanır.${s ? " Sıradaki rapor açıldı." : " Kuyruk boş."}` };
}

/** Geri gönder (onayda → Yeni): gerekçe zorunlu; denetçi raporun üstünde görür; sıradaki rapor açılır */
export async function geriGonder(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (!canDoEylem(kim, "rapor_geri_gonder", kayit(r))) return { durum: "yetkisiz" };
  if (r.durum !== "onayda") return { durum: "red", neden: `Rapor onay kuyruğunda değil (şu an: ${durumAd(r.durum)}).` };
  const g = dogrula(GeriGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const s = await sonrakiRapor(db, kim, id);
  const y = await yaz(db, kim, r, surum, "taslak", g.veri.gerekce, "rapor.geri_gonder");
  if (y !== "tamam") return { durum: y };
  return { durum: "tamam", sonraki: s, bildirim: `${r.no} geri gönderildi; ${r.denetci} raporun üstünde gerekçeyi görür.` };
}

/** Onayı geri al (onaylandı → onayda; 102): rapor yeniden kuyrukta */
export async function onayGeriAl(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (!canDoEylem(kim, "rapor_onayla", kayit(r))) return { durum: "yetkisiz" };
  if (r.durum !== "onaylandi") return { durum: "red", neden: `Rapor onaylanmış değil (şu an: ${durumAd(r.durum)}).` };
  const y = await yaz(db, kim, r, surum, "onayda", null, "rapor.onay_geri_al");
  if (y !== "tamam") return { durum: y };
  return { durum: "tamam", sonraki: null, bildirim: `${r.no} onayı geri alındı; rapor yeniden kuyrukta.` };
}

/** Durumu değiştir (190): tamamlanmamış rapor Yeni / onayda / onaylandı arasında; Yeni'ye gerekçe zorunlu; Onaylandı'ya almak onaydır (191) */
export async function durumDegistir(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (r.durum === "imzali") return { durum: "red", neden: "Tamamlanan raporun durumu değişmez; düzeltme revizyonla." };
  if (r.durum === "imzada") return { durum: "red", neden: "İmzaya gönderilmiş raporun durumu değişmez." };
  if (!canDoEylem(kim, "rapor_durum_degistir", kayit(r))) return { durum: "yetkisiz" };
  const g = dogrula(DurumGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const { hedef, gerekce } = g.veri;
  if (hedef === r.durum) return { durum: "gecersiz", hatalar: { hedef: "Rapor zaten bu durumda." } };
  const y = await yaz(db, kim, r, surum, hedef, gerekce || null, "rapor.durum_degistir");
  if (y !== "tamam") return { durum: y };
  return { durum: "tamam", sonraki: null, bildirim: `${r.no}: ${durumAd(r.durum)} → ${durumAd(hedef)}.` };
}

/** Revizeye gönder (131 V1): tamamlanan rapor R(n+1) olarak denetçiye Yeni döner; gerekçe ≥ 10 (denetçi raporun üstünde görür); tamamlanan
    sürüm ve imzalı PDF saklı; bekleyen revize isteği kapanır (veritabanı tetiği) */
export async function revizeyeGonder(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (r.durum !== "imzali") return { durum: "red", neden: `Revizeye yalnız tamamlanan rapor gönderilir (şu an: ${durumAd(r.durum)}).` };
  if (!canDoEylem(kim, "rapor_revizeye_gonder", kayit(r))) return { durum: "yetkisiz" };
  const g = dogrula(RevizeGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const y = await raporRevizeYaz(db, iz(kim, "rapor.revizeye_gonder", r), r.id, surum, r.revizyon, g.veri.gerekce);
  if (y.durum !== "tamam") return { durum: y.durum === "yok" ? "yok" : "cakisma" };
  return { durum: "tamam", sonraki: null, bildirim: `${gorunenNo(r.kokNo, r.revizyon + 1)} açıldı; ${r.denetci} raporun üstünde gerekçeyi görür. Tamamlanan sürüm saklandı.` };
}

/** Revize isteğini reddet (141 W4): gerekçe isteğe bağlı; denetçi raporunda "Revize isteği reddedildi" şeridini görür, yeniden isteyebilir.
    İstemcinin GÖRDÜĞÜ istek (kimlik + sürüm) reddedilir: o arada geri çekilip yeniden açılan istek eski sayfadan reddedilmez (318 incelemesi). */
export async function revizeIstegiReddet(db: Sorgulayici, kim: Kisi, id: string, istekId: string, istekSurum: number, girdi: unknown): Promise<OnayYazma> {
  const r = await bul(db, kim, id);
  if (!r) return { durum: "yok" };
  if (r.durum !== "imzali") return { durum: "red", neden: "Bu raporda bekleyen revize isteği yok." };
  if (!canDoEylem(kim, "rapor_revizeye_gonder", kayit(r))) return { durum: "yetkisiz" };
  const g = dogrula(RevizeRedGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const b = await bekleyenRevizeIstegi(db, r.id, r.revizyon);
  if (!b) return { durum: "red", neden: "Bu raporda bekleyen revize isteği yok." };
  if (b.id !== istekId || !Number.isSafeInteger(istekSurum) || istekSurum < 0) return { durum: "cakisma" };
  const y = await istekReddet(db, iz(kim, "rapor.revize_istek_red", r), { ...b, surum: istekSurum }, g.veri.gerekce || null);
  if (y.durum !== "tamam") return { durum: y.durum === "yok" ? "yok" : "cakisma" };
  return { durum: "tamam", sonraki: null, bildirim: `${r.no} revize isteği reddedildi.` };
}
