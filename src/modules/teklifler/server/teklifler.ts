/* TEKLİFLER — modülün dışa açılan işlevleri (maket teklifler.html M12; modül 11; göç 0037). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 11): "gör" düzeyi bütün teklifleri görür; HAZIRLAMAK, düzenlemek, gönderildi / kabul / red
   işaretlemek, kopyalamak ve kayıtlı olmayan müşteriyi kaydetmek yalnız "yaz" düzeyinde (önerilen düzende planlama + firma yöneticisi).
   Kurallar veritabanı tetiğinde de (yalnız taslak düzenlenir; geçişler; süresi dolan kabul / red edilmez). Yazmalar güvenli yazıcıdan.
   Tutarlar KURUŞ, KDV hariç. Rapor ↔ kalem bağı Raporlar'ın teklif-baglanti.ts'inden; ekipman sayıları Ekipman'dan; müşteri kaydı Müşteriler'den. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, sil, tablo, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku, firmaKunyesi } from "../../../server/ayar/ayar.ts";
import { hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { tesisEkipmanlari, tesisTurSayilari } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriIletisim, musteriKaydet, musteriOzetleri, tesisKaydet } from "../../musteriler/server/musteriler.ts";
import { MusteriGirdisi, TesisGirdisi } from "../../musteriler/sema.ts";
import { turBasinaImzaliRapor } from "../../raporlar/server/teklif-baglanti.ts";
import type { TeklifBelgesiVerisi } from "../../../belge/teklif.ts";
import type { ExcelTuru, TeklifEkipmani } from "../excel.ts";
import { bitisGunu, RedGirdisi, TeklifGirdisi, type Aday, type TeklifDurumu } from "../sema.ts";

const MODUL = 11;
const TEKLIF = tablo({ ad: "teklif", sutunlar: ["no", "musteri_id", "aday", "durum", "gerekce", "gecerlilik", "kdv", "notlar", "ekipmanlar", "kopya_kaynak"] });
const KALEM = tablo({ ad: "teklif_kalem", sutunlar: ["teklif_id", "tur_id", "adet", "fiyat", "sira"] });
const TESIS = tablo({ ad: "teklif_tesis", sutunlar: ["teklif_id", "tesis_id", "sira"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const bugunTr = () => GUN.format(new Date());

export interface Kisi extends YetkiHesabi { ad: string }
export type Yazma =
  | { durum: "tamam"; id: string; no?: string; bildirim?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz", "kendi", "brans"].includes(duzey(kim, MODUL));
const yazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const teklifDegistirir = yazar;
const iz = (kim: Kisi, ne: string, gerekce?: string): Iz => ({ kim: kim.ad, ne, gerekce });

export interface TeklifSatiri {
  id: string; no: string; musteriId: string | null; musteri: string; kayitli: boolean; tesis: string; kalemSayisi: number; ekipmanSayisi: number;
  /** KDV hariç toplam, kuruş */
  tutar: number; tarih: string; gonderildi: string | null; sonuc: string | null; durum: TeklifDurumu; bitis: string | null;
}
export interface TeklifKalemi { turId: string; turAd: string; brans: "m" | "e" | null; periyot: number | null; adet: number; fiyat: number; raporlanan: number | null }
export interface TeklifKarti extends TeklifSatiri {
  surum: number; aday: Aday | null; musteriKart: { id: string; unvan: string; kisa: string } | null; tesisler: { id: string; ad: string; il: string | null; ilce: string | null }[];
  kalemler: TeklifKalemi[]; kdv: number; gecerlilik: number; notlar: string | null; gerekce: string | null; hazirlayan: string;
  /** ilgili kişi: kayıtlı müşteride müşteri kartındaki, değilse teklifteki yetkili (maket) */
  ilgili: string | null;
  ekipmanlar: { kod: string; tur: string; konum: string; seri: string }[]; raporlananTutar: number | null; kopyaKaynak: string | null;
  izin: { duzenle: boolean; gonder: boolean; sonuc: boolean; musteriKaydet: boolean; kopyala: boolean };
}

type Satir = { id: string; no: string; musteri_id: string | null; aday: Aday | null; durum: "taslak" | "gonderildi" | "kabul" | "red"; tarih: string; gonderildi: string | null;
  sonuc: string | null; gerekce: string | null; gecerlilik: number; kdv: number; notlar: string | null; ekipmanlar: TeklifKarti["ekipmanlar"]; hazirlayan: string | null;
  kopya_kaynak: string | null; surum: number };
const SEC = `SELECT id::text, no, musteri_id::text, aday, durum, tarih::text, gonderildi::text, sonuc::text, gerekce, gecerlilik, kdv, notlar, ekipmanlar,
  hazirlayan::text, kopya_kaynak::text, surum FROM teklif`;

/** okurken hesaplanan durum: gönderilmiş ve geçerliliği geçmiş → "süresi doldu" (124) */
export function etkinDurum(t: { durum: Satir["durum"]; gonderildi: string | null; gecerlilik: number }, bugun = bugunTr()): TeklifDurumu {
  return t.durum === "gonderildi" && t.gonderildi && bitisGunu(t.gonderildi, t.gecerlilik) < bugun ? "suresi" : t.durum;
}

async function okuIc(db: Sorgulayici, kosul: string, p: unknown[]) {
  const l = (await db.sorgu<Satir>(`${SEC} ${kosul}`, p)).rows;
  if (!l.length) return { l, kalem: [], tesis: [], musteri: new Map<string, { id: string; unvan: string; kisa: string; tesisler: { id: string; ad: string; il: string | null; ilce: string | null }[] }>() };
  const idler = l.map((x) => x.id);
  const kalem = (await db.sorgu<{ teklif_id: string; tur_id: string; adet: number; fiyat: string; sira: number }>(
    "SELECT teklif_id::text, tur_id::text, adet, fiyat::text, sira FROM teklif_kalem WHERE teklif_id = ANY ($1::uuid[]) ORDER BY sira", [idler])).rows;
  const tesis = (await db.sorgu<{ teklif_id: string; tesis_id: string; sira: number }>(
    "SELECT teklif_id::text, tesis_id::text, sira FROM teklif_tesis WHERE teklif_id = ANY ($1::uuid[]) ORDER BY sira", [idler])).rows;
  const musteri = new Map((await musteriOzetleri(db)).map((m) => [m.id, { id: m.id, unvan: m.unvan, kisa: m.kisa, tesisler: m.tesisler.map((t) => ({ id: t.id, ad: t.ad, il: t.il, ilce: t.ilce })) }]));
  return { l, kalem, tesis, musteri };
}

function satirOf(x: Satir, d: Awaited<ReturnType<typeof okuIc>>, bugun: string): TeklifSatiri {
  const m = x.musteri_id ? d.musteri.get(x.musteri_id) : undefined;
  const tl = d.tesis.filter((t) => t.teklif_id === x.id).map((t) => m?.tesisler.find((y) => y.id === t.tesis_id)?.ad ?? "—");
  const k = d.kalem.filter((y) => y.teklif_id === x.id);
  return {
    id: x.id, no: x.no, musteriId: x.musteri_id, musteri: m?.kisa ?? x.aday?.unvan ?? "—", kayitli: !!m,
    tesis: m ? tl.join(", ") || "—" : "Kayıtlı olmayan müşteri", kalemSayisi: k.length, ekipmanSayisi: k.reduce((n, y) => n + y.adet, 0),
    tutar: k.reduce((n, y) => n + y.adet * Number(y.fiyat), 0), tarih: x.tarih, gonderildi: x.gonderildi, sonuc: x.sonuc, durum: etkinDurum(x, bugun),
    bitis: x.gonderildi ? bitisGunu(x.gonderildi, x.gecerlilik) : null,
  };
}

/** Teklifler listesi (en yeni üstte); göremeyene null */
export async function teklifListesi(db: Sorgulayici, kim: Kisi): Promise<TeklifSatiri[] | null> {
  if (!gorur(kim)) return null;
  const d = await okuIc(db, "ORDER BY tarih DESC, no DESC", []);
  const bugun = bugunTr();
  return d.l.map((x) => satirOf(x, d, bugun));
}

/** teklif sayfası; göremeyene ya da yoksa null */
export async function teklifKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<TeklifKarti | null> {
  if (!gorur(kim) || !UUID.test(id)) return null;
  const d = await okuIc(db, "WHERE id = $1", [id]);
  const x = d.l[0];
  if (!x) return null;
  const bugun = bugunTr(), s = satirOf(x, d, bugun), m = x.musteri_id ? d.musteri.get(x.musteri_id) ?? null : null;
  const turler = new Map((await turOzetleri(db)).map((t) => [t.id, t]));
  const tesisler = d.tesis.filter((t) => t.teklif_id === x.id).map((t) => m?.tesisler.find((y) => y.id === t.tesis_id)).filter((t): t is NonNullable<typeof t> => !!t);
  /* kabul edilmiş teklif: kabulden sonra imzalanan raporlar kaleme türüyle bağlanır (adedi aşan "teklif dışı" — muhasebe) */
  const rapor = x.durum === "kabul" && x.sonuc && tesisler.length ? await turBasinaImzaliRapor(db, tesisler.map((t) => t.id), x.sonuc) : null;
  const kalemler: TeklifKalemi[] = d.kalem.filter((k) => k.teklif_id === x.id).map((k) => {
    const t = turler.get(k.tur_id);
    return { turId: k.tur_id, turAd: t?.ad ?? "—", brans: t?.brans ?? null, periyot: t?.periyot ?? null, adet: k.adet, fiyat: Number(k.fiyat), raporlanan: rapor ? rapor.get(k.tur_id) ?? 0 : null };
  });
  const yaz = yazar(kim);
  return {
    ...s, surum: x.surum, aday: x.aday, musteriKart: m ? { id: m.id, unvan: m.unvan, kisa: m.kisa } : null, tesisler, kalemler, kdv: x.kdv, gecerlilik: x.gecerlilik,
    notlar: x.notlar, gerekce: x.gerekce, hazirlayan: x.hazirlayan ? (await hesapAdlari(db, [x.hazirlayan])).get(x.hazirlayan) ?? "—" : "—", ekipmanlar: x.ekipmanlar ?? [],
    ilgili: m ? (await musteriIletisim(db, m.id))?.ilgili ?? null : x.aday?.yetkili ?? null,
    raporlananTutar: rapor ? kalemler.reduce((n, k) => n + Math.min(k.adet, k.raporlanan ?? 0) * k.fiyat, 0) : null,
    kopyaKaynak: x.kopya_kaynak ? (await db.sorgu<{ no: string }>("SELECT no FROM teklif WHERE id = $1", [x.kopya_kaynak])).rows[0]?.no ?? null : null,
    izin: {
      duzenle: yaz && s.durum === "taslak", gonder: yaz && s.durum === "taslak" && kalemler.length > 0, sonuc: yaz && s.durum === "gonderildi",
      musteriKaydet: yaz && s.durum === "kabul" && !m, kopyala: yaz,
    },
  };
}

export interface TeklifSecenekleri {
  musteriler: { id: string; kisa: string; unvan: string; tesisler: { id: string; ad: string; il: string | null; ilce: string | null; ekipman: Record<string, number> }[] }[];
  turler: (ExcelTuru & { periyot: number; fiyat: number | null })[];
}
/** formun seçenekleri: etkin müşteriler ve etkin tesisleri (tür başına etkin ekipman sayısıyla — "tesisteki ekipmandan doldur"), türler ve
    fiyat listesi. Yalnız "yaz" düzeyine. */
export async function teklifSecenekleri(db: Sorgulayici, kim: Kisi): Promise<TeklifSecenekleri | null> {
  if (!yazar(kim)) return null;
  const m = (await musteriOzetleri(db)).filter((x) => !x.pasif);
  const tesisler = m.flatMap((x) => x.tesisler.filter((t) => !t.pasif).map((t) => t.id));
  const sayi = await tesisTurSayilari(db, tesisler);
  const fiyat = new Map((await db.sorgu<{ tur_id: string; fiyat: string }>("SELECT tur_id::text, fiyat::text FROM fiyat_listesi")).rows.map((x) => [x.tur_id, Number(x.fiyat)]));
  return {
    musteriler: m.map((x) => ({ id: x.id, kisa: x.kisa, unvan: x.unvan, tesisler: x.tesisler.filter((t) => !t.pasif).map((t) => ({ id: t.id, ad: t.ad, il: t.il, ilce: t.ilce,
      ekipman: Object.fromEntries(sayi.filter((y) => y.tesisId === t.id).map((y) => [y.turId, y.adet])) })) })),
    turler: (await turOzetleri(db)).map((t) => ({ id: t.id, ad: t.ad, kod: t.kod, brans: t.brans, periyot: t.periyot, fiyat: fiyat.get(t.id) ?? null })),
  };
}

/** teklif hazırla (id boş; kopyaKaynak verilirse "Yeni teklif (kopyala)") ya da TASLAĞI düzenle. Kalemler ve tesisler formdakiyle eşitlenir. */
export async function teklifKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown, kopyaKaynak: string | null = null): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(TeklifGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  /* müşteri ve tesisler: etkin müşterinin etkin tesisleri */
  let musteriId: string | null = null, tesisler: string[] = [];
  if (v.tip === "kayitli") {
    const m = (await musteriOzetleri(db)).find((x) => x.id === v.musteri && !x.pasif);
    if (!m) return { durum: "gecersiz", hatalar: { musteri: "Müşteri seçilmeli." } };
    tesisler = [...new Set([v.tesis, ...v.ekTesisler])];
    if (tesisler.some((t) => !m.tesisler.some((y) => y.id === t && !y.pasif))) return { durum: "gecersiz", hatalar: { tesis: "Tesis seçilmeli." } };
    musteriId = m.id;
  }
  const turler = new Set((await turOzetleri(db)).map((t) => t.id));
  const h: DogrulamaHatalari = {};
  v.kalemler.forEach((k, i) => { if (!turler.has(k.tur)) h[`kalemler.${i}.tur`] = "Tür seçilmeli."; });
  if (v.ekipmanlar.some((e) => !turler.has(e.tur))) h.ekipmanlar = "Ekipman listesinde bilinmeyen tür var.";
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const degerler = { musteri_id: musteriId, aday: v.tip === "aday" ? v.aday : null, gecerlilik: v.gecerlilik, kdv: v.kdv, notlar: v.notlar, ekipmanlar: JSON.stringify(v.ekipmanlar) };
  let teklifId: string, no: string;
  if (!id) {
    let kaynak: string | null = null;
    if (kopyaKaynak) {
      if (!UUID.test(kopyaKaynak) || !(await db.sorgu("SELECT 1 FROM teklif WHERE id = $1", [kopyaKaynak])).rowCount) return { durum: "yok" };
      kaynak = kopyaKaynak;
    }
    const onek = (await ayarOku(db, "numara")).deger.teklif;
    no = await numaraAl(db, "teklif", { onek });
    teklifId = (await ekle(db, TEKLIF, { ...degerler, no, durum: "taslak", kopya_kaynak: kaynak }, iz(kim, "teklif.hazirla", no))).id;
  } else {
    if (!UUID.test(id)) return { durum: "yok" };
    const x = (await db.sorgu<{ no: string; durum: string }>("SELECT no, durum FROM teklif WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!x) return { durum: "yok" };
    if (x.durum !== "taslak") return { durum: "red", neden: "Yalnız taslak teklif düzenlenir; gönderilen teklif değişmez (yenisi kopyalanır)." };
    if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
    const r = await guncelle(db, TEKLIF, id, surum, degerler, iz(kim, "teklif.duzenle", x.no));
    if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
    teklifId = id; no = x.no;
    /* kalemler ve tesisler formdakiyle eşitlenir: eskiler silinir (yalnız taslakta — tetik), yeniler yazılır */
    for (const k of (await db.sorgu<{ id: string }>("SELECT id::text FROM teklif_kalem WHERE teklif_id = $1", [id])).rows) await sil(db, KALEM, k.id, iz(kim, "teklif.kalem_sil", no));
    for (const t of (await db.sorgu<{ id: string }>("SELECT id::text FROM teklif_tesis WHERE teklif_id = $1", [id])).rows) await sil(db, TESIS, t.id, iz(kim, "teklif.tesis_sil", no));
  }
  for (const [i, k] of v.kalemler.entries()) await ekle(db, KALEM, { teklif_id: teklifId, tur_id: k.tur, adet: k.adet, fiyat: k.fiyat, sira: i }, iz(kim, "teklif.kalem", no));
  for (const [i, t] of tesisler.entries()) await ekle(db, TESIS, { teklif_id: teklifId, tesis_id: t, sira: i }, iz(kim, "teklif.tesis", no));
  return { durum: "tamam", id: teklifId, no, bildirim: `${no} kaydedildi (taslak).` };
}

async function durumYaz(db: Sorgulayici, kim: Kisi, id: string, surum: number, hedef: "gonderildi" | "kabul" | "red", gerekce: string | null): Promise<Yazma> {
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<Satir>(`${SEC} WHERE id = $1 FOR UPDATE`, [id])).rows[0];
  if (!x) return { durum: "yok" };
  const d = etkinDurum(x);
  if (hedef === "gonderildi" && d !== "taslak") return { durum: "red", neden: "Yalnız taslak teklif gönderilir." };
  if (hedef !== "gonderildi" && d === "suresi") return { durum: "red", neden: "Teklifin geçerliliği doldu; yenisi kopyalanır." };
  if (hedef !== "gonderildi" && d !== "gonderildi") return { durum: "red", neden: "Yalnız gönderilmiş teklif kabul ya da red edilir." };
  if (hedef === "gonderildi" && !(await db.sorgu("SELECT 1 FROM teklif_kalem WHERE teklif_id = $1", [id])).rowCount) return { durum: "red", neden: "Kalemsiz teklif gönderilmez." };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, TEKLIF, id, surum, { durum: hedef, ...(gerekce ? { gerekce } : {}) }, iz(kim, `teklif.${hedef}`, gerekce ? `${x.no} · ${gerekce}` : x.no));
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  const g = hedef === "gonderildi" ? (await db.sorgu<{ g: string; gec: number }>("SELECT gonderildi::text AS g, gecerlilik AS gec FROM teklif WHERE id = $1", [id])).rows[0] : null;
  const tarihYaz = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
  return {
    durum: "tamam", id, no: x.no,
    bildirim: hedef === "gonderildi" ? `${x.no} gönderildi olarak işaretlendi; geçerlilik ${tarihYaz(bitisGunu(g!.g, g!.gec))} tarihine kadar.`
      : hedef === "kabul" ? `${x.no} kabul edildi. Sıradaki: ${x.musteri_id ? "iş sözleşmesi, sonra plan" : "müşteri olarak kaydet, sonra iş sözleşmesi ve plan"}.`
      : `${x.no} reddedildi olarak kaydedildi.`,
  };
}
/** Gönderildi olarak işaretle (PDF elle iletilir — 121): geçerlilik bugünden sayılır */
export async function teklifGonder(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  return durumYaz(db, kim, id, surum, "gonderildi", null);
}
/** Kabul edildi (panelden kabul yok — 121; firma işaretler) */
export async function teklifKabul(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  return durumYaz(db, kim, id, surum, "kabul", null);
}
/** Reddedildi: müşterinin gerekçesi zorunlu (kayıtta kalır; sonraki teklifte görülür) */
export async function teklifReddet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(RedGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  return durumYaz(db, kim, id, surum, "red", g.veri.gerekce);
}

/** kayıtlı olmayan müşterinin KABUL edilmiş teklifi: müşteri (aday bilgileriyle) ve "Merkez" tesisi açılır, teklif onlara bağlanır (bir kez).
    Müşteri ve tesis Müşteriler modülünün işlevleriyle (kendi kuralları, uyarıları — yetkiyi de o sorar). */
export async function teklifMusteriKaydet(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<Satir>(`${SEC} WHERE id = $1 FOR UPDATE`, [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (x.durum !== "kabul" || x.musteri_id || !x.aday) return { durum: "red", neden: "Yalnız kayıtlı olmayan müşterinin kabul edilmiş teklifi müşteri olarak kaydedilir." };
  if (x.surum !== surum) return { durum: "cakisma" };
  const a = x.aday;
  const mg = { unvan: a.unvan, kisa: "", vd: a.vd ?? "", vno: a.vno ?? "", eposta: a.eposta ?? "", tel: a.tel ?? "", ilgili: a.yetkili ?? "" };
  const tg = { ad: "Merkez", adres: a.adres, il: a.il, ilce: a.ilce ?? "", sgk: "" };
  /* önce iki kayıt da Müşteriler'in şemasından geçer (yazmadan; yarım kayıt kalmasın) */
  const mh = dogrula(MusteriGirdisi, mg), th = dogrula(TesisGirdisi, tg);
  if (!mh.tamam || !th.tamam) return { durum: "red", neden: `Müşteri bilgileri eksik ya da hatalı: ${Object.values({ ...(mh.tamam ? {} : mh.hatalar), ...(th.tamam ? {} : th.hatalar) })[0]}` };
  const m = await musteriKaydet(db, kim, null, 0, mg, true);
  if (m.durum !== "tamam") return m.durum === "gecersiz" ? { durum: "gecersiz", hatalar: m.hatalar } : m.durum === "uyari" ? { durum: "red", neden: Object.values(m.uyarilar)[0] ?? "Müşteri kaydedilemedi." } : m;
  const t = await tesisKaydet(db, kim, m.id, null, 0, tg, true);
  if (t.durum !== "tamam") throw new Error(`teklifin tesisi açılamadı: ${t.durum}`);   // müşteri de geri alınır (işlem)
  const r = await guncelle(db, TEKLIF, id, surum, { musteri_id: m.id }, iz(kim, "teklif.musteri_kaydet", x.no));
  if (r.durum !== "tamam") throw new Error("teklif müşteriye bağlanamadı");
  await ekle(db, TESIS, { teklif_id: id, tesis_id: t.id, sira: 0 }, iz(kim, "teklif.tesis", x.no));
  return { durum: "tamam", id, no: x.no, bildirim: `${a.unvan} müşteri olarak kaydedildi (tesis: Merkez). Sıradaki: iş sözleşmesi, sonra plan.` };
}

/* ── EXCEL VE TEKLİF BELGESİ (325) ─────────────────────────────────────────────────────────────────────────────────────────────────────── */
const UUID_LISTE = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length <= 200 && v.every((x) => typeof x === "string" && UUID.test(x)) ? [...new Set(v as string[])] : null;

/** tesislerin kayıtlı ETKİN ekipmanı (Excel'e aktar — maket excelKaynak "tesisteki kayıtlı ekipman"); göremeyene null */
export async function teklifEkipmanListesi(db: Sorgulayici, kim: Kisi, tesisler: unknown): Promise<TeklifEkipmani[] | null> {
  const l = UUID_LISTE(tesisler);
  if (!gorur(kim) || !l) return null;
  const out: TeklifEkipmani[] = [];
  for (const t of l) for (const e of await tesisEkipmanlari(db, t)) if (!e.pasif) out.push({ kod: e.kod, tur: e.turId, konum: e.konum ?? "", seri: e.seri ?? "" });
  return out;
}

/** teklif sayfasının "Excel'e aktar"ı: yüklenen liste, yoksa (kayıtlı müşteride) tesislerin kayıtlı ekipmanı; türler ve birim fiyat (teklifin kalemi,
    yoksa fiyat listesi). Göremeyene ya da yoksa null */
export async function teklifExcelVerisi(db: Sorgulayici, kim: Kisi, t: TeklifKarti): Promise<{ liste: TeklifEkipmani[]; ne: string; turler: ExcelTuru[];
  fiyat: Record<string, number | null> } | null> {
  if (!gorur(kim)) return null;
  const liste = t.ekipmanlar.length ? t.ekipmanlar : t.musteriKart ? (await teklifEkipmanListesi(db, kim, t.tesisler.map((x) => x.id))) ?? [] : [];
  const fiyat: Record<string, number | null> = Object.fromEntries((await db.sorgu<{ tur_id: string; fiyat: string }>("SELECT tur_id::text, fiyat::text FROM fiyat_listesi")).rows
    .map((x) => [x.tur_id, Number(x.fiyat)]));
  for (const k of t.kalemler) fiyat[k.turId] = k.fiyat;
  return { liste, ne: t.ekipmanlar.length ? "Excel'den yüklenen liste" : "tesisteki kayıtlı ekipman",
    turler: (await turOzetleri(db)).map((x) => ({ id: x.id, ad: x.ad, kod: x.kod, brans: x.brans })), fiyat };
}

/** TEKLİF BELGESİNİN VERİSİ (temel format KM-FR-TKL-01 karşılığı: firma kodu + "-FR-TKL-01"; §3.7 satır 4 — firmaya özel format iskeleti):
    teklifin kendi kayıtlarından; göremeyene ya da yoksa null */
export async function teklifBelgesiVerisi(db: Sorgulayici, kim: Kisi, id: string): Promise<TeklifBelgesiVerisi | null> {
  const t = await teklifKarti(db, kim, id);
  if (!t) return null;
  const firma = await firmaKunyesi(db);
  const m = t.musteriKart ? await musteriIletisim(db, t.musteriKart.id) : null;
  const tesisAdres = t.musteriKart ? new Map((await musteriOzetleri(db)).find((x) => x.id === t.musteriKart!.id)?.tesisler.map((y) => [y.id, y.adres]) ?? []) : new Map<string, string | null>();
  return {
    firma: { ad: firma.ad, kod: firma.kod }, no: t.no, tarih: t.gonderildi ?? t.tarih, gecerlilik: t.gecerlilik, bitis: t.bitis, kdv: t.kdv, notlar: t.notlar,
    hazirlayan: t.hazirlayan, durum: t.durum,
    musteri: m
      ? { unvan: m.unvan, vergi: [m.vd, m.vno].filter(Boolean).join(" · ") || null, eposta: m.eposta, tel: m.tel, ilgili: m.ilgili,
          yerler: t.tesisler.map((x) => ({ ad: x.ad, adres: [tesisAdres.get(x.id), [x.ilce, x.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ") || null })) }
      : { unvan: t.aday?.unvan ?? "—", vergi: [t.aday?.vd, t.aday?.vno].filter(Boolean).join(" · ") || null, eposta: t.aday?.eposta ?? null, tel: t.aday?.tel ?? null,
          ilgili: t.aday?.yetkili ?? null, yerler: t.aday ? [{ ad: null, adres: [t.aday.adres, [t.aday.ilce, t.aday.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ") }] : [] },
    kalemler: t.kalemler.map((k) => ({ turAd: k.turAd, brans: k.brans, periyot: k.periyot, adet: k.adet, fiyat: k.fiyat })),
  };
}
