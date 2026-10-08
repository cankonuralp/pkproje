/* RAPORLAR — saha raporu (modül 14; maket rapor.html M8; KOD-GECIS §4 rapor_* özel eylemleri, §5 Rapor, §9 ENGEL 1, 2, 5, 6; RAPOR-FORMAT §7).
   Yetki her işlevde SUNUCUDA:
   · Rapor oluştur: yalnız plandaki denetçi (rapor_olustur), plan kabul edilmiş / denetimde / tamamlanmış, plan günü gelmiş (ENGEL 1 — ileri tarihe
     kapalı, geçmiş açık), ekipman planda ve etkin, ekipmanın bu planda etkin raporu yok (203), türün YAYINDA formatı var (rapor o sürümle açılır).
     İlk rapor planı Denetimde yapar (Planlar.denetimeBasla).
   · Görme: Raporlar düzeyi — "gör" hepsi, "branşı" türün branşı, "kendi" yalnız yazdığı rapor; başka firmanınki "yok".
   · Kaydet / Onaya gönder / cihaz: yalnız raporu YAZAN (rapor_yaz) ve rapor Yeni (içerik yalnız Yeni'de değişir — veritabanı da zorlar).
   · Onaya gönder: zorunlu alan eksikse (format + sabit tarihler) ENGEL 5, türün gerekli ölçüm cihazı eksik / kalibrasyonu geçmişse ENGEL 2 —
     rapor yine kaydedilir, eksikler listelenir. Öteki kurallar uyarıdır.
   · Sil: rapor_sil (yazan Yeni raporunu; teknik yönetici) — silme yok, "silindi" damgası (veritabanı zamanıyla).
   · Günlük süre (212, ENGEL 3): mesai takibi açıkken denetçinin bugünkü süresi dolduysa yeni rapor ve kopya açılmaz.
   · Kaydet ve kopyala / Kopyala (204–209): yalnız raporu yazan; yeni ekipman (kod + bölüm) tesise kalıcı kayıt, plana "sonradan" (Planlar'ın kod
     denetimiyle); kopya güncel formatla, Yeni açılır. Kopyalanır: ekipman bilgileri, bilgi alanları (detaylar, tespitler), cihazlar, madde
     seçimleri. Kopyalanmaz: madde açıklaması / derecesi / fotoğrafı, test ve ölçüm değerleri, fotoğraflar, sonuç, yorum.
   · Formatı güncelle (211): yazanın Yeni raporu, daha yeni yayınlanmış sürüm varsa; kimliği eşleşen cevaplar korunur, yeni madde ilk cevapla. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { raporNoAl } from "../../../server/numara/numara.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import { canDo, canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { degerlendir, type Degerlendirme } from "../../../format/motor.ts";
import { Cevaplar, type BolumOf, type FormatTanimi } from "../../../format/tanim.ts";
import { yzHazirMi } from "../../../server/yz/kullanim.ts";
import { ekipmanEtiketi, ekipmanKilitle } from "../../ekipman/server/ekipman.ts";
import { turRaporBilgisi } from "../../ekipman-turleri/server/turler.ts";
import { tesisMusteriIletisim } from "../../musteriler/server/musteriler.ts";
import { raporCihazlari } from "../../olcum-cihazlari/server/cihazlar.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { denetimeBasla, ekipmanEklenebilir, kodDurumu, kunyeGuncelle, plandakiEkipman, raporIcinPlan, yeniEkipman, type Kunye, type RaporPlani } from "../../planlar/server/plan-ici.ts";
import { formatSurumuOku, yayindakiFormat } from "../../rapor-format/server/formatlar.ts";
import { kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { roldekiHesapAdlari } from "../../../server/kimlik/hesap.ts";
import {
  ayEkle, gorunenNo, kalibrasyonGecti, KopyaGirdisi, RAPOR_DURUM, RaporKaydi, RevizeGirdisi, SONUC_AD, type EkipmanBilgisi, type RaporCihazi, type RaporDurumu, type RaporTarihleri,
} from "../sema.ts";
import { istekAc, istekKapat, revizeDurumu } from "./revize.ts";
import { mesaiDurumu } from "./plan-baglanti.ts";
import { raporOzetleri, sonGeriGonderme, type RaporOzeti } from "./onay-baglanti.ts";
import { hesapAdlari } from "../../../server/kimlik/hesap.ts";
import { TANIMLAR } from "../../../tanim/tanimlar.ts";
import { firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import { kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { createHash } from "node:crypto";
import { cihazKalibrasyonlari } from "../../olcum-cihazlari/server/cihazlar.ts";
import { personelBelgeBilgisi } from "../../personel/server/personel.ts";
import type { BelgeVerisi } from "../../../belge/veri.ts";
import { imzaliPdfGecerli } from "../imza-pdf.ts";

const MODUL = 14;
/** rapor fotoğrafının dosya modülü (dosya erişim kaydında: raporu gören açar) */
export const DOSYA_MODULU = "rapor";
/** imzaya hazırlanan kesin imzasız PDF ve yüklenen imzalı PDF (317; kayıt = rapor; raporu gören açar) */
export const PDF_MODULU = "rapor_pdf", IMZALI_MODULU = "rapor_imzali";
/** raporda fotoğraf: fotoğraf bölümüne ya da "Uygun değil" maddeye bağlı (madde fotoğrafı Kusur açıklamalarına düşer — O2) */
export interface RaporFoto { dosya: string; ad: string; bolum: string; madde: string | null }
const FOTO_MADDE_EN_COK = 10;
const RAPOR = tablo({
  ad: "rapor", sutunlar: ["no", "plan_id", "ekipman_id", "tur_id", "format_id", "personel_id", "durum", "kunye", "kunye_surum", "ekipman_bilgi", "bas", "bit",
    "sonraki", "takip", "rapor_tarihi", "cevaplar", "cihazlar", "fotolar", "sonuc", "sonuc_oto", "kopya_kaynak", "silindi"],
  gizli: ["cevaplar"],
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const bugunTr = () => GUN.format(new Date());
const tarihNo = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
/** veritabanı zamanı → ekranın "YYYY-MM-DDTHH:MM" (Türkiye saati) ve geri (Türkiye UTC+3, yaz saati yok — 2016) */
const zamanOku = (d: Date | null) => (d ? ZAMAN.format(d).replace(", ", "T") : null);
const zamanYaz = (s: string | null) => (s ? `${s}:00+03:00` : null);

export interface Kisi extends YetkiHesabi { ad: string }
export type RaporYazma =
  | { durum: "tamam"; id: string; bildirim: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "eksik"; eksikler: { bolum: string; alan: string; ad: string }[] }
  | { durum: "red"; neden: string }
  | { durum: "yetkisiz" } | { durum: "cakisma" } | { durum: "yok" };

/** jsonb dizisi: pg sürücüsü JS dizisini Postgres dizisine çevirir (JSON değil) — dizi JSON metni olarak yollanır */
const jsonDizi = (x: unknown[]) => JSON.stringify(x);

const sonuc = (r: GuncelleSonucu, id: string, bildirim: string): RaporYazma =>
  r.durum === "tamam" || r.durum === "degisiklik_yok" ? { durum: "tamam", id, bildirim } : r.durum === "cakisma" ? { durum: "cakisma" } : { durum: "yok" };

/** yeni raporun başlangıç cevapları: bütün maddeler cevap setinin ilk öğesiyle ("Uygun") dolu (§3.8-3) */
function ilkCevaplar(t: FormatTanimi): Cevaplar {
  const madde: Cevaplar["madde"] = {};
  for (const b of t.bolumler) if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) madde[m.id] = { c: b.cevaplar[0] };
  return Cevaplar.parse({ madde });
}

/* ── RAPOR OLUŞTUR ───────────────────────────────────────────────────────────────────────────────────────────── */
const MESAI_DOLU = "Günlük süre doldu (mesai takibi); bugün yeni rapor oluşturulamaz.";
type Hata = Exclude<RaporYazma, { durum: "tamam" }>;
type AcilanPlan = RaporPlani & { personelId: string };

/** rapor açılabilecek plan (oluştur ve kopya): kişi plandaki denetçi (rapor_olustur), plan kabul edilmiş / denetimde / tamamlanmış, plan günü
    gelmiş (ENGEL 1), kişinin bugünkü süresi dolmamış (ENGEL 3) */
async function acilabilirPlan(db: Sorgulayici, kim: Kisi, planId: string): Promise<{ p: AcilanPlan } | { hata: Hata }> {
  const plan = await raporIcinPlan(db, kim, planId);
  if (!plan) return { hata: { durum: "yok" } };
  const personelId = plan.personelId;
  if (!personelId || duzey(kim, MODUL) === "yok" || !canDoEylem(kim, "rapor_olustur", { atananlar: plan.atananlar })) return { hata: { durum: "yetkisiz" } };
  if (plan.durum !== "kabul" && plan.durum !== "denetimde" && plan.durum !== "tamamlandi") return { hata: { durum: "red", neden: "Rapor yalnız kabul edilmiş planda oluşturulur." } };
  const bugun = bugunTr();
  if (plan.baslangic > bugun) {
    return { hata: { durum: "red", neden: `Plan günü ${tarihNo(plan.baslangic)} henüz gelmedi (bugün ${tarihNo(bugun)}). Rapor plan gününden itibaren oluşturulur; geçmiş günlere açık, ileri tarihe kapalı.` } };
  }
  /* aynı denetçinin eşzamanlı açılışları sıraya girer (işlem sonuna dek): ikinci istek birincinin açtığı raporu sayar — süre yarışla aşılmaz */
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('mesai:' || $1))", [personelId]);
  if ((await mesaiDurumu(db, personelId, bugun)).dolu) return { hata: { durum: "red", neden: MESAI_DOLU } };
  return { p: { ...plan, personelId } };
}

/** kopyanın cevapları (206–207): güncel formatın maddeleri ilk cevapla, kaynakta aynı kimlikli maddenin YALNIZ seçimi (bu formatın cevap setindeyse);
    bilgi alanları (ekipman detayları, tespitler); test / ölçüm değerleri, fotoğraf sayıları, sonuç ve yorum kopyalanmaz */
function kopyaCevaplari(t: FormatTanimi, kaynak: unknown): Cevaplar {
  const c = ilkCevaplar(t), k = Cevaplar.safeParse(kaynak);
  if (!k.success) return c;
  for (const b of t.bolumler) {
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) { const x = k.data.madde[m.id]; if (x && b.cevaplar.includes(x.c)) c.madde[m.id] = { c: x.c }; }
    if (b.blok === "bilgi") for (const a of b.alanlar) if (!a.kaynak && Object.hasOwn(k.data.alan, a.id)) c.alan[a.id] = k.data.alan[a.id];
  }
  return c;
}

/** raporu açar (oluştur ve kopya ortak): ekipman planda ve etkin, bu planda etkin raporu yok (203), türün YAYINDA formatı var; ilk rapor planı
    Denetimde yapar. Kopyada ekipman bilgileri, cihazlar ve cevaplar kaynaktan; künye her zaman denetçinin plandaki gördüğü künye. */
async function raporAc(db: Sorgulayici, kim: Kisi, plan: AcilanPlan, ekipmanId: string, kopya: { r: RaporSatiri; konum: string | null } | null,
  bildirim: (no: string, kod: string) => string): Promise<RaporYazma> {
  if (!(await plandakiEkipman(db, plan.id, ekipmanId))) return { durum: "yok" };
  await ekipmanKilitle(db, ekipmanId);   /* pasife alma ile aynı anda koşmasın: ikisi de ekipmanın satırında sıraya girer */
  const e = await ekipmanEtiketi(db, ekipmanId);
  if (!e) return { durum: "yok" };
  if (e.pasif) return { durum: "red", neden: "Ekipman pasif; rapor açılamaz. Etkinleştir ile geri alınır." };
  if ((await db.sorgu("SELECT 1 FROM rapor WHERE plan_id = $1 AND ekipman_id = $2 AND silindi IS NULL", [plan.id, ekipmanId])).rowCount) {
    return { durum: "red", neden: "Bu ekipmanın bu planda raporu var." };
  }
  const tur = await turRaporBilgisi(db, e.turId);
  if (!tur) return { durum: "yok" };
  const format = await yayindakiFormat(db, tur.id);
  if (!format) return { durum: "red", neden: "Bu türün yayınlanmış rapor formatı yok." };
  const no = await raporNoAl(db);
  const k = kopya?.r;
  const iz: Iz = { kim: kim.ad, ne: k ? "rapor.kopya" : "rapor.olustur", gerekce: `${no} · ${plan.no} · ${e.kod}${k ? ` · kaynak ${k.no}` : ""}` };
  const ortak = { no, plan_id: plan.id, ekipman_id: ekipmanId, tur_id: tur.id, format_id: format.id, personel_id: plan.personelId, durum: "taslak" };
  /* künye her zaman denetçinin plandaki GÖRDÜĞÜ künye (kopyada da): kaynağın eski künyesi taşınmaz, Güncelle tutarlı kalır (çapraz inceleme) */
  const kunye = { ...plan.kunye, eposta: null, tel: null, ...(await iletisimi(db, plan.tesisId)) };
  const r = k ? await ekle(db, RAPOR, {
    ...ortak, kunye, kunye_surum: plan.kunyeSurum,
    /* ekipman bilgileri kaynaktan; seri no yeni ekipmanın (sorulmaz, raporda yazılır), kullanım yeri pencereden (boşsa kaynaktaki) */
    ekipman_bilgi: { ...k.ekipman_bilgi, seri: null, konum: kopya.konum ?? k.ekipman_bilgi.konum },
    cevaplar: kopyaCevaplari(format.tanim, k.cevaplar), cihazlar: jsonDizi(k.cihazlar), kopya_kaynak: k.id,
  }, iz) : await ekle(db, RAPOR, {
    ...ortak, kunye, kunye_surum: plan.kunyeSurum,
    ekipman_bilgi: { marka: e.marka, model: e.model, seri: e.seri, imal: e.imal ? String(e.imal) : null, konum: e.konum, amac: null, bolum: null } satisfies EkipmanBilgisi,
    cevaplar: ilkCevaplar(format.tanim),
  }, iz);
  await denetimeBasla(db, kim.ad, plan.id);
  return { durum: "tamam", id: r.id, bildirim: bildirim(no, e.kod) };
}
const iletisimi = async (db: Sorgulayici, tesisId: string) => {
  const x = await tesisMusteriIletisim(db, tesisId);
  return x ? { eposta: x.eposta, tel: x.tel } : {};
};

export async function raporOlustur(db: Sorgulayici, kim: Kisi, planId: string, ekipmanId: string): Promise<RaporYazma> {
  const a = await acilabilirPlan(db, kim, planId);
  if ("hata" in a) return a.hata;
  return raporAc(db, kim, a.p, ekipmanId, null, (no) => `Rapor oluşturuldu: ${no}. Satırındaki “Raporu düzenle” saha rapor ekranını açar.`);
}

/* ── OKUMA ───────────────────────────────────────────────────────────────────────────────────────────────────── */
interface RaporSatiri {
  id: string; no: string; plan_id: string; ekipman_id: string; tur_id: string; format_id: string; personel_id: string; hesap_id: string | null; durum: RaporDurumu;
  kunye: Kunye & { eposta?: string | null; tel?: string | null }; kunye_surum: number; ekipman_bilgi: EkipmanBilgisi; bas: Date; bit: Date | null;
  sonraki: string | null; takip: string | null; rapor_tarihi: string | null; cevaplar: unknown; cihazlar: RaporCihazi[]; fotolar: RaporFoto[]; sonuc: string | null;
  sonuc_oto: boolean; gonderildi: Date | null; kopya_kaynak: string | null; revizyon: number; onay: Date | null; onay_hesap: string | null;
  surum: number; olustu: Date; degisti: Date;
}
async function raporOku(db: Sorgulayici, id: string, kilitle = false): Promise<RaporSatiri | null> {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<RaporSatiri>(
    `SELECT id::text, no, plan_id::text, ekipman_id::text, tur_id::text, format_id::text, personel_id::text, hesap_id::text, durum, kunye, kunye_surum, ekipman_bilgi,
       bas, bit, sonraki::text, takip::text, rapor_tarihi::text, cevaplar, cihazlar, fotolar, sonuc, sonuc_oto, gonderildi, kopya_kaynak::text, revizyon, onay,
       onay_hesap::text, surum, olustu, degisti
     FROM rapor WHERE id = $1 AND silindi IS NULL${kilitle ? " FOR UPDATE" : ""}`, [id])).rows[0] ?? null;
}

interface Erisim { r: RaporSatiri; tur: NonNullable<Awaited<ReturnType<typeof turRaporBilgisi>>>; sahip: boolean }
/** raporu ve kişinin ona erişimini okur; göremeyene null (var olduğu da söylenmez) */
async function erisim(db: Sorgulayici, kim: Kisi, id: string, kilitle = false): Promise<Erisim | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const r = await raporOku(db, id, kilitle);
  if (!r) return null;
  const tur = await turRaporBilgisi(db, r.tur_id);
  if (!tur) return null;
  if (!canDo(kim, MODUL, "gor", { sahip: r.hesap_id, brans: tur.brans })) return null;
  return { r, tur, sahip: !!r.hesap_id && r.hesap_id === kim.id };
}

/** S.A.Y (384; raporlar/server/say-baglanti.ts'ten): düzenlenen raporun format tanımı ve tür adı — YALNIZ raporu yazan kişinin Yeni raporunda (S.A.Y'ın
    rapor kipiyle aynı; başkasının ya da onaydaki raporun içeriği S.A.Y'a gitmez). Yoksa null. */
export async function raporSayBilgisi(db: Sorgulayici, kim: Kisi, id: string): Promise<{ tanim: FormatTanimi; turAd: string } | null> {
  const e = await erisim(db, kim, id);
  if (!e || !e.sahip || e.r.durum !== "taslak") return null;
  const f = await formatSurumuOku(db, e.r.format_id);
  return f ? { tanim: f.tanim, turAd: e.tur.ad } : null;
}

export interface CihazSatiri {
  turId: string; turAd: string;
  cihaz: { id: string; kod: string; marka: string | null; model: string | null; seri: string | null; bitis: string | null; gecti: boolean; eksik: boolean; lab: boolean } | null;
}
export interface SahaRaporu {
  id: string; no: string; durum: RaporDurumu; surum: number; olustu: string; degisti: string; gonderildi: string | null; bugun: string;
  plan: { id: string; no: string; tesisAd: string; musteriKisa: string };
  ekipman: { id: string; kod: string; onceki: { tarih: string; sonuc: string | null } | null };
  tur: { id: string; ad: string; kod: string; brans: "m" | "e"; kontrolStd: string[]; periyot: number };
  yazan: { ad: string; meslek: string; meslekMetin: string | null; ekipnet: string | null };
  kunye: { firmaAdi: string; adres: string | null; sgk: string | null; isgNo: string | null; eposta: string | null; tel: string | null };
  /** planlamacı künyeyi değiştirdiyse farklı alanlar (yazan denetçi Güncelle ile alır) */
  kunyeFark: string[];
  ekipmanBilgi: EkipmanBilgisi; tarih: RaporTarihleri;
  cevaplar: Cevaplar; tanim: FormatTanimi; formatSira: number;
  cihazlar: CihazSatiri[];
  /** fotoğraflar (bölüme ya da maddeye bağlı); indirme tek uçtan (DosyaAcTusu), raporu görene */
  fotolar: RaporFoto[];
  /** Cihaz ekle penceresi: yazanın zimmetindeki, kalibrasyonu geçerli cihazlar tür başına; tür gerekli cihaz türü vermiyorsa "*" altında hepsi
      (yalnız düzenleyebilene). Seçilen cihaz kendi türünün satırına yazılır. */
  secilebilir: Record<string, { id: string; kod: string; marka: string | null; model: string | null; seri: string | null; bitis: string | null }[]>;
  /** kopyadan açıldıysa kaynak raporun numarası (U7) */
  kopyaKaynak: string | null;
  /** daha yeni yayınlanmış format sürümü (U6; yalnız düzenleyebilene) */
  guncelFormat: number | null;
  /** yazanın bugünkü süresi doldu (ENGEL 3): yeni rapor ve kopya açılmaz */
  mesaiDolu: boolean;
  /** Yeni'ye geri dönmüş raporda son geri gönderme (U8; 314) ya da revizeye gönderme (318: revize = yeni revizyon, "R1"): kim, ne zaman, gerekçe */
  geri: { kim: string; zaman: string; gerekce: string | null; revize: number | null } | null;
  /** tamamlanan raporda yazanın revize isteği (318; maket raporlar.html 192): bekleyen istek (geri çekilir) · son ret · yeni istek açılabilir mi */
  revize: { bekleyen: { id: string; zaman: string; gerekce: string; surum: number } | null; red: { kim: string; zaman: string; gerekce: string | null } | null; iste: boolean } | null;
  /** son imza (317): yazanın onaylanmış raporunda imzasız kesin PDF (hazırlandıysa) · tamamlanan raporda imzalı PDF */
  imza: { hazir: boolean; pdf: string | null } | null;
  imzali: { dosya: string; zaman: string; no: string } | null;
  izin: { duzenle: boolean; sil: boolean; kopyala: boolean };
  /** fotoğraftan okuma (351): düzenleyebilene, firmada yapay zekâ açık ve anahtar girilmişse */
  yz: boolean;
}

const kunyeFarki = (a: Kunye, b: Kunye) => [
  a.firma_adi !== b.firma_adi && "Firma adı", (a.adres ?? null) !== (b.adres ?? null) && "Adres", (a.sgk ?? null) !== (b.sgk ?? null) && "SGK DETSİS NO",
  (a.isg_no ?? null) !== (b.isg_no ?? null) && "İSG-KATİP SÖZLEŞME ID",
].filter((x): x is string => !!x);

async function cihazSatirlari(db: Sorgulayici, r: RaporSatiri, tur: Erisim["tur"], bugun: string): Promise<{ satirlar: CihazSatiri[]; tumu: Awaited<ReturnType<typeof raporCihazlari>> }> {
  /* 358: pasif cihaz da çözülür (raporda zaten olan cihaz "eksik" görünmez); seçime pasif cihaz girmez (aşağıda `benim`) */
  const tumu = await raporCihazlari(db, { pasifDahil: true });
  const turAdi = new Map(tumu.map((c) => [c.turId, c.tur]));
  const gerekli = [...tur.cihazTurleri];
  for (const x of r.cihazlar) if (!gerekli.includes(x.tur)) gerekli.push(x.tur);
  const satirlar = gerekli.map((turId) => {
    const x = r.cihazlar.find((y) => y.tur === turId), c = x ? tumu.find((y) => y.id === x.cihaz) : undefined;
    return {
      turId, turAd: turAdi.get(turId) ?? "Ölçüm cihazı",
      cihaz: x ? (c ? { id: c.id, kod: c.kod, marka: c.marka, model: c.model, seri: c.seri, bitis: c.bitis, gecti: kalibrasyonGecti(c.bitis, bugun), eksik: false, lab: c.konum === "lab" }
        : { id: x.cihaz, kod: "—", marka: null, model: null, seri: null, bitis: null, gecti: true, eksik: true, lab: false }) : null,
    };
  });
  return { satirlar, tumu };
}

/** saha rapor ekranının verisi; göremeyene null */
export async function sahaRaporu(db: Sorgulayici, kim: Kisi, id: string): Promise<SahaRaporu | null> {
  const e = await erisim(db, kim, id);
  if (!e) return null;
  const { r, tur } = e, bugun = bugunTr();
  const plan = await raporIcinPlan(db, kim, r.plan_id);
  const format = await formatSurumuOku(db, r.format_id);
  if (!format) return null;
  const etiket = await ekipmanEtiketi(db, r.ekipman_id);
  const yazan = (await personelOzetleri(db, [r.personel_id]))[0];
  const iletisim = plan ? await tesisMusteriIletisim(db, plan.tesisId) : null;
  const { satirlar, tumu } = await cihazSatirlari(db, r, tur, bugun);
  const duzenle = e.sahip && r.durum === "taslak" && canDoEylem(kim, "rapor_yaz", { sahip: r.hesap_id });
  let secilebilir: SahaRaporu["secilebilir"] = {};
  if (duzenle) {
    const kimde = (await kimdeHaritasi(db)).cihaz;
    /* kalibrasyondaki (lab) cihaz kimsenin zimmetinde sayılmaz (Zimmetler: Kalibrasyonda) */
    const benim = tumu.filter((c) => !c.pasif && c.konum !== "lab" && kimde.get(c.id) === r.personel_id && !kalibrasyonGecti(c.bitis, bugun));
    const ozet = (c: (typeof benim)[number]) => ({ id: c.id, kod: c.kod, marka: c.marka, model: c.model, seri: c.seri, bitis: c.bitis });
    secilebilir = Object.fromEntries(satirlar.map((x) => [x.turId, benim.filter((c) => c.turId === x.turId).map(ozet)]));
    /* tür gerekli cihaz türü vermiyorsa formatın cihaz bölümü için zimmetteki her geçerli cihaz seçilebilir ("*") */
    if (!tur.cihazTurleri.length) secilebilir["*"] = benim.map(ozet);
  }
  /* planlamacının künyesi: yazan denetçinin plandaki güncel künyesiyle karşılaştırılır (yalnız Yeni raporda anlamlı) */
  let kunyeFark: string[] = [];
  if (r.durum === "taslak" && e.sahip) {
    const pk = (await db.sorgu<{ firma_adi: string; adres: string | null; sgk: string | null; isg_no: string | null }>(
      "SELECT p.firma_adi, p.adres, p.sgk, k.isg_no FROM plan p LEFT JOIN plan_ekip k ON k.plan_id = p.id AND k.firma_id = p.firma_id AND k.personel_id = $2 WHERE p.id = $1",
      [r.plan_id, r.personel_id])).rows[0];
    if (pk) kunyeFark = kunyeFarki(r.kunye, pk);
  }
  const cev = Cevaplar.safeParse(r.cevaplar);
  const kk = r.kopya_kaynak ? (await db.sorgu<{ no: string; revizyon: number }>("SELECT no, revizyon FROM rapor WHERE id = $1", [r.kopya_kaynak])).rows[0] : undefined;
  const kopyaKaynak = kk ? gorunenNo(kk.no, kk.revizyon) : null;
  const yeni = duzenle ? await yayindakiFormat(db, r.tur_id) : null;
  /* kopya: yalnız raporu yazan, plandaki kendi personeliyle, rapor açabilen ve plana ekipman ekleyebilen (sunucu kopyada yeniden bakar) */
  const kopyala = e.sahip && !!plan && plan.personelId === r.personel_id && canDoEylem(kim, "rapor_olustur", { atananlar: plan.atananlar })
    && await ekipmanEklenebilir(db, kim, r.plan_id);
  const mesaiDolu = (duzenle || kopyala) && (await mesaiDurumu(db, r.personel_id, bugun)).dolu;
  const sg = r.durum === "taslak" ? await sonGeriGonderme(db, r.id) : null;
  const geri = sg ? { kim: (await hesapAdlari(db, [sg.hesapId])).get(sg.hesapId ?? "") ?? "—", zaman: sg.zaman, gerekce: sg.gerekce, revize: sg.revize } : null;
  /* revize isteği (318): yalnız yazanın tamamlanan raporunda */
  let revize: SahaRaporu["revize"] = null;
  if (r.durum === "imzali" && e.sahip && canDoEylem(kim, "rapor_revize_iste", { sahip: r.hesap_id })) {
    const d = await revizeDurumu(db, r.id, r.revizyon);
    revize = {
      bekleyen: d.bekleyen ? { id: d.bekleyen.id, zaman: d.bekleyen.zaman, gerekce: d.bekleyen.gerekce, surum: d.bekleyen.surum } : null,
      red: d.red ? { kim: (await hesapAdlari(db, [d.red.hesapId])).get(d.red.hesapId ?? "") ?? "—", zaman: d.red.zaman, gerekce: d.red.gerekce } : null,
      iste: !d.bekleyen,
    };
  }
  return {
    id: r.id, no: gorunenNo(r.no, r.revizyon), durum: r.durum, surum: r.surum, olustu: r.olustu.toISOString(), degisti: r.degisti.toISOString(), gonderildi: r.gonderildi?.toISOString() ?? null, bugun,
    plan: { id: r.plan_id, no: plan?.no ?? "—", tesisAd: iletisim?.tesisAd ?? "—", musteriKisa: iletisim?.kisa ?? "—" },
    ekipman: { id: r.ekipman_id, kod: etiket?.kod ?? "—", onceki: etiket?.disKontrol ? { tarih: etiket.disKontrol, sonuc: etiket.disSonuc } : null },
    tur: { id: tur.id, ad: tur.ad, kod: tur.kod, brans: tur.brans, kontrolStd: tur.kontrolStd, periyot: tur.periyot },
    yazan: { ad: yazan?.ad ?? "—", meslek: yazan?.meslek ?? "diger", meslekMetin: yazan?.meslekMetin ?? null, ekipnet: yazan?.ekipnet ?? null },
    kunye: { firmaAdi: r.kunye.firma_adi, adres: r.kunye.adres, sgk: r.kunye.sgk, isgNo: r.kunye.isg_no, eposta: r.kunye.eposta ?? null, tel: r.kunye.tel ?? null },
    kunyeFark,
    ekipmanBilgi: r.ekipman_bilgi,
    tarih: { bas: zamanOku(r.bas)!, bit: zamanOku(r.bit), sonraki: r.sonraki, takip: r.takip, rapor: r.rapor_tarihi },
    cevaplar: cev.success ? cev.data : Cevaplar.parse({}), tanim: format.tanim, formatSira: format.sira,
    cihazlar: satirlar, secilebilir, fotolar: r.fotolar,
    kopyaKaynak, guncelFormat: yeni && yeni.sira > format.sira ? yeni.sira : null, mesaiDolu, geri, revize,
    imza: r.durum === "onaylandi" && e.sahip && canDoEylem(kim, "rapor_son_imza", { sahip: r.hesap_id })
      ? { hazir: true, pdf: (await bekleyenIstek(db, r.id, r.revizyon))?.pdf_dosya ?? null } : null,
    imzali: r.durum === "imzali" ? await imzaliSurum(db, r.id, r.revizyon) : null,
    izin: { duzenle, sil: r.durum === "taslak" && r.revizyon === 0 && canDoEylem(kim, "rapor_sil", { sahip: r.hesap_id, durum: "Yeni", brans: tur.brans }), kopyala },
    yz: duzenle ? await yzHazirMi(db) : false,
  };
}

/* ── YAZMA ───────────────────────────────────────────────────────────────────────────────────────────────────── */
/** yazanın Yeni raporu, kilitli; değilse neden */
async function yazilabilir(db: Sorgulayici, kim: Kisi, id: string): Promise<Erisim | RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_yaz", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "taslak") return { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." };
  return e;
}
const hataMi = (x: Erisim | RaporYazma): x is RaporYazma => "durum" in x;

/** fotoğraftan okuma (351): yazanın Yeni raporundaki ölçüm tablosu. KİLİTLEMEZ — yapay zekâ çağrısı sürerken satır kilidi tutulmaz (okunan değerler
    raporun kendisine yazılmaz; denetçi uygulayınca normal Kaydet'le yazılır). */
export async function okunabilirOlcum(db: Sorgulayici, kim: Kisi, id: string, bolumId: string): Promise<{ raporId: string; bolum: BolumOf<"olcum"> } | RaporYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_yaz", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "taslak") return { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." };
  const b = (await formatSurumuOku(db, e.r.format_id))?.tanim.bolumler.find((x) => x.id === bolumId);
  if (!b || b.blok !== "olcum") return { durum: "gecersiz", hatalar: { foto: "Okunacak tablo bulunamadı." } };
  return { raporId: e.r.id, bolum: b };
}

/** etiket plakasından okuma (385): yazanın Yeni raporu (fotoğraftan okumayla aynı kapı, tablo yerine ekipman bilgileri) */
export async function etiketOkunabilir(db: Sorgulayici, kim: Kisi, id: string): Promise<{ raporId: string } | RaporYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_yaz", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "taslak") return { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." };
  return { raporId: e.r.id };
}

/** cihaz ve fotoğraf sayıları raporun KENDİ listesinden (istemcinin sayısına güvenilmez): bölüm başına fotoğraf, madde başına fotoğraf */
function sayiliCevaplar(c: Cevaplar, r: Pick<RaporSatiri, "cihazlar" | "fotolar">): Cevaplar {
  const bolum: Record<string, number> = {}, madde: Record<string, number> = {};
  for (const f of r.fotolar) { if (f.madde) madde[f.madde] = (madde[f.madde] ?? 0) + 1; else bolum[f.bolum] = (bolum[f.bolum] ?? 0) + 1; }
  return { ...c, cihaz: r.cihazlar.length, foto: bolum, madde: Object.fromEntries(Object.entries(c.madde).map(([k, x]) => [k, { ...x, foto: madde[k] ?? 0 }])) };
}
function degerle(tanim: FormatTanimi, c: Cevaplar, r: Pick<RaporSatiri, "cihazlar" | "fotolar">): Degerlendirme {
  return degerlendir(tanim, sayiliCevaplar(c, r));
}

async function kaydetIc(db: Sorgulayici, kim: Kisi, e: Erisim, surum: number, girdi: unknown): Promise<RaporYazma> {
  const g = dogrula(RaporKaydi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const cevaplar = sayiliCevaplar(v.cevaplar, e.r);
  const r = await guncelle(db, RAPOR, e.r.id, surum, {
    ekipman_bilgi: v.ekipman, bas: zamanYaz(v.tarih.bas), bit: zamanYaz(v.tarih.bit), sonraki: v.tarih.sonraki, takip: v.tarih.takip, rapor_tarihi: v.tarih.rapor,
    cevaplar, sonuc: cevaplar.sonuc || null,
  }, { kim: kim.ad, ne: "rapor.kaydet", gerekce: gorunenNo(e.r.no, e.r.revizyon) });
  return sonuc(r, e.r.id, "Rapor kaydedildi.");
}

export async function raporKaydet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  return kaydetIc(db, kim, e, surum, girdi);
}

/** Onaya gönder: önce kaydeder; zorunlu eksik (ENGEL 5 — sonuç hariç: seçilmediyse önerisi yazılır) ya da cihaz eksik / kalibrasyon geçmiş
    (ENGEL 2) varsa durmaz, eksikleri söyler. Elle seçilmediyse bitiş (gönderme anı), sonraki kontrol (başlangıç + tür periyodu) ve rapor tarihi
    (başlangıç günü) burada yazılır. */
export async function onayaGonder(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const k = await kaydetIc(db, kim, e, surum, girdi);
  if (k.durum !== "tamam") return k;
  const r = (await raporOku(db, id, true))!;
  const format = await formatSurumuOku(db, r.format_id);
  if (!format) return { durum: "yok" };
  const cev = Cevaplar.parse(r.cevaplar);
  const bugun = bugunTr();
  const sonucBolumleri = new Set(format.tanim.bolumler.filter((b) => b.blok === "sonuc").map((b) => b.id));
  const d = degerle(format.tanim, cev, r);
  /* kalibrasyon MUAYENE GÜNÜNE göre (ENGEL 2: cihaz muayenede geçerli olmalı) — aylar sonra revize edilen rapor bugünkü kalibrasyona takılmaz
     (318 incelemesi); cihazın bugün kalibrasyonda (lab) ya da kayıttan kalkmış olması yalnız ilk sürümde engel */
  const muayeneGunu = GUN.format(r.bas);
  const { satirlar } = await cihazSatirlari(db, r, e.tur, muayeneGunu);
  const cihazBolumleri = new Set(satirlar.length ? format.tanim.bolumler.filter((b) => b.blok === "cihaz").map((b) => b.id) : []);
  const eksikler = d.eksikler.filter((x) => !sonucBolumleri.has(x.bolum) && !cihazBolumleri.has(x.bolum));
  for (const s of satirlar) {
    if (!s.cihaz) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.turAd}: ölçüm cihazı eklenmedi` });
    else if (s.cihaz.eksik) { if (r.revizyon === 0) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.turAd}: eklenen cihaz artık kayıtlı değil` }); }
    else if (s.cihaz.lab && r.revizyon === 0) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.cihaz.kod}: kalibrasyonda` });
    else if (s.cihaz.gecti) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.cihaz.kod}: kalibrasyonu geçmiş${s.cihaz.bitis ? ` (${tarihNo(s.cihaz.bitis)})` : ""}` });
  }
  if (eksikler.length) return { durum: "eksik", eksikler };
  /* rapor tarihi muayene gününden önce, bugünden sonra olamaz (ileri tarihli imzalı rapor ekipmanın sonraki uygunsuzluklarını "giderildi"
     kapatırdı — 318 incelemesi; veritabanı da ister, 0031) */
  const raporGunu = r.rapor_tarihi ?? muayeneGunu;
  if (raporGunu > bugun) return { durum: "gecersiz", hatalar: { "tarih.rapor": "Rapor tarihi bugünden sonra olamaz." } };
  if (raporGunu < muayeneGunu) return { durum: "gecersiz", hatalar: { "tarih.rapor": "Rapor tarihi kontrol başlangıcından önce olamaz." } };
  const oto = !cev.sonuc;
  const sonucu: "uygun" | "uygun_degil" = cev.sonuc || d.oneri;
  const basGun = muayeneGunu;
  const g = await guncelle(db, RAPOR, id, r.surum, {
    durum: "onayda", cevaplar: { ...cev, sonuc: sonucu }, sonuc: sonucu, sonuc_oto: oto,
    bit: r.bit ?? new Date(Math.max(Date.now(), r.bas.getTime())), sonraki: r.sonraki ?? ayEkle(basGun, e.tur.periyot), rapor_tarihi: r.rapor_tarihi ?? basGun,
  }, { kim: kim.ad, ne: "rapor.onaya_gonder", gerekce: gorunenNo(r.no, r.revizyon) });
  if (g.durum !== "tamam" && g.durum !== "degisiklik_yok") return sonuc(g, id, "");
  const brans = e.tur.brans === "m" ? "Mekanik" : "Elektrik";
  const yon = await roldekiHesapAdlari(db, e.tur.brans === "m" ? "mekanik_yonetici" : "elektrik_yonetici");
  return { durum: "tamam", id, bildirim: `Onaya gönderildi: ${yon.length ? `${yon.join(", ")}, ` : ""}${brans} branş yöneticisi.${oto ? ` Sonuç kriterlere göre: ${SONUC_AD[sonucu]}.` : ""}` };
}

/** Sil: yazan Yeni raporunu, teknik yönetici (rapor_sil); "silindi" damgası, veri silinmez */
export async function raporSil(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  /* yetki Yeni rapor için sorulur (yazan ya da teknik yönetici); yetkili kişi gönderilmiş raporda açık ileti alır */
  if (!canDoEylem(kim, "rapor_sil", { sahip: e.r.hesap_id, durum: "Yeni", brans: e.tur.brans })) return { durum: "yetkisiz" };
  if (e.r.durum !== "taslak") return { durum: "red", neden: "Yalnız Yeni rapor silinir." };
  if (e.r.revizyon > 0) return { durum: "red", neden: "Revizyondaki rapor silinmez; tamamlanan sürüm saklıdır." };
  const no = gorunenNo(e.r.no, e.r.revizyon);
  const r = await guncelle(db, RAPOR, id, surum, { silindi: new Date() }, { kim: kim.ad, ne: "rapor.sil", gerekce: no });
  return sonuc(r, id, `${no} silindi.`);
}

/** ölçüm cihazı ekle: yazanın zimmetinde, türün gerekli cihaz türünden (tür liste vermiyorsa her tür), kalibrasyonu geçerli; tür başına bir cihaz */
export async function cihazEkle(db: Sorgulayici, kim: Kisi, id: string, surum: number, turId: string, cihazId: string): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const c = (await raporCihazlari(db)).find((x) => x.id === cihazId);
  /* "*": tür gerekli cihaz türü vermiyorsa cihaz kendi türünün satırına yazılır */
  if (turId === "*" && c && !e.tur.cihazTurleri.length) turId = c.turId;
  if (!c || c.turId !== turId || (e.tur.cihazTurleri.length && !e.tur.cihazTurleri.includes(turId))) return { durum: "gecersiz", hatalar: { cihaz: "Cihaz listeden seçilmeli." } };
  if (c.konum === "lab") return { durum: "gecersiz", hatalar: { cihaz: `${c.kod}: kalibrasyonda; rapora eklenmez.` } };
  if ((await kimdeHaritasi(db)).cihaz.get(c.id) !== e.r.personel_id) return { durum: "gecersiz", hatalar: { cihaz: "Cihaz raporu yazanın zimmetinde değil." } };
  if (kalibrasyonGecti(c.bitis, bugunTr())) return { durum: "gecersiz", hatalar: { cihaz: `${c.kod}: kalibrasyonu geçmiş; rapora eklenmez.` } };
  const cihazlar = [...e.r.cihazlar.filter((x) => x.tur !== turId), { tur: turId, cihaz: c.id }];
  const cevaplar = { ...(e.r.cevaplar as object), cihaz: cihazlar.length };
  return sonuc(await guncelle(db, RAPOR, id, surum, { cihazlar: jsonDizi(cihazlar), cevaplar }, { kim: kim.ad, ne: "rapor.cihaz_ekle", gerekce: `${gorunenNo(e.r.no, e.r.revizyon)} · ${c.kod}` }), id, `${c.kod} eklendi.`);
}

export async function cihazKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number, turId: string): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  if (!e.r.cihazlar.some((x) => x.tur === turId)) return { durum: "tamam", id, bildirim: "Cihaz zaten yok." };
  const cihazlar = e.r.cihazlar.filter((x) => x.tur !== turId);
  const cevaplar = { ...(e.r.cevaplar as object), cihaz: cihazlar.length };
  return sonuc(await guncelle(db, RAPOR, id, surum, { cihazlar: jsonDizi(cihazlar), cevaplar }, { kim: kim.ad, ne: "rapor.cihaz_kaldir", gerekce: gorunenNo(e.r.no, e.r.revizyon) }), id, "Cihaz kaldırıldı.");
}

/** raporda "Güncelle": planlamacının yeni künyesi yazanın plan ekranına ve YALNIZ kendi Yeni raporlarına geçer (§3.4; Planlar.kunyeGuncelle) */
export async function raporKunyeGuncelle(db: Sorgulayici, kim: Kisi, id: string): Promise<RaporYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!e.sahip) return { durum: "yetkisiz" };
  const r = await kunyeGuncelle(db, kim, e.r.plan_id);
  return r.durum === "tamam" ? { durum: "tamam", id, bildirim: r.bildirim } : r.durum === "gecersiz" ? { durum: "gecersiz", hatalar: r.hatalar } : r;
}

/* ── FOTOĞRAF (312; maket fotoMenu / fotoSil; 09-A1, A4: tür baytlardan, EXIF silinir, yalnız JPEG / PNG) ─────────────────────────────── */
/** fotoğraf ekle: fotoğraf bölümüne (en çok enCok) ya da kontrol maddesine (en çok 10). Yalnız yazan, Yeni raporda. */
export async function fotoEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number,
  hedef: { bolum: string; madde: string | null }, dosya: { ad: string; bayt: Uint8Array }): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  if (surum !== e.r.surum) return { durum: "cakisma" };
  const format = await formatSurumuOku(db, e.r.format_id);
  if (!format) return { durum: "yok" };
  const b = format.tanim.bolumler.find((x) => x.id === hedef.bolum);
  const fotolar = e.r.fotolar;
  if (hedef.madde) {
    if (b?.blok !== "liste" || !b.gruplar.some((g) => g.maddeler.some((m) => m.id === hedef.madde))) return { durum: "gecersiz", hatalar: { foto: "Fotoğrafın yeri bulunamadı." } };
    if (fotolar.filter((f) => f.madde === hedef.madde).length >= FOTO_MADDE_EN_COK) return { durum: "gecersiz", hatalar: { foto: `Maddeye en çok ${FOTO_MADDE_EN_COK} fotoğraf.` } };
  } else {
    if (b?.blok !== "foto") return { durum: "gecersiz", hatalar: { foto: "Fotoğrafın yeri bulunamadı." } };
    if (fotolar.filter((f) => f.bolum === b.id && !f.madde).length >= b.enCok) return { durum: "gecersiz", hatalar: { foto: `En çok ${b.enCok} fotoğraf.` } };
  }
  /* cevaplar dosyadan ÖNCE okunur: okunamazsa depoya sahipsiz dosya yazılmaz */
  const cev = Cevaplar.safeParse(e.r.cevaplar);
  if (!cev.success) return { durum: "red", neden: "Raporun cevapları okunamadı; raporu yenileyip yeniden deneyin." };
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: id, ad: dosya.ad, bayt: dosya.bayt, izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { foto: y.neden === "tur" ? "Yalnız JPEG ya da PNG fotoğraf." : y.neden === "buyuk" ? "Fotoğraf çok büyük (en çok 8 MB)." : "Fotoğraf okunamadı." } };
  const yeni = [...fotolar, { dosya: y.id, ad: y.ad, bolum: hedef.bolum, madde: hedef.madde }];
  const cevaplar = sayiliCevaplar(cev.data, { cihazlar: e.r.cihazlar, fotolar: yeni });
  return sonuc(await guncelle(db, RAPOR, id, surum, { fotolar: jsonDizi(yeni), cevaplar }, { kim: kim.ad, ne: "rapor.foto_ekle", gerekce: `${gorunenNo(e.r.no, e.r.revizyon)} · ${y.ad}` }), id, `${y.ad} eklendi.`);
}

/** fotoğraftan okunan PANO fotoğrafı rapora (354; pkproje §11 92 "sigorta okununca pano fotoğrafı rapora eklenir", maket sigorta-oku r.pano): formatın
    son fotoğraf bölümüne (termal görüntü bölümü değil, yer varsa), raporun o anki sürümüyle — yazanın kendi okuması, ekran sonra yenilenir. Yer yoksa
    eklenmez, nedeni döner (okunan değerler yine öneri olarak gelir). */
export async function okunanFotografiEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, dosya: { ad: string; bayt: Uint8Array }): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const bolumler = (await formatSurumuOku(db, e.r.format_id))?.tanim.bolumler ?? [];
  const yer = bolumler.filter((b) => b.blok === "foto" && !/termal/i.test(b.ad) && e.r.fotolar.filter((f) => f.bolum === b.id && !f.madde).length < b.enCok).at(-1);
  if (!yer) return { durum: "gecersiz", hatalar: { foto: "Raporda fotoğrafın ekleneceği yer yok (fotoğraf bölümü yok ya da dolu)." } };
  return fotoEkle(db, depo, kim, firmaId, id, e.r.surum, { bolum: yer.id, madde: null }, dosya);
}

/** fotoğraf sil: listeden çıkar, dosya çöpe (indirilemez). Yalnız yazan, Yeni raporda. */
export async function fotoSil(db: Sorgulayici, kim: Kisi, id: string, surum: number, dosyaId: string): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const f = e.r.fotolar.find((x) => x.dosya === dosyaId);
  if (!f) return { durum: "tamam", id, bildirim: "Fotoğraf zaten yok." };
  const yeni = e.r.fotolar.filter((x) => x.dosya !== dosyaId);
  const cevaplar = sayiliCevaplar(Cevaplar.parse(e.r.cevaplar), { cihazlar: e.r.cihazlar, fotolar: yeni });
  const iz = { kim: kim.ad, ne: "rapor.foto_sil", gerekce: `${gorunenNo(e.r.no, e.r.revizyon)} · ${f.ad}` };
  const r = await guncelle(db, RAPOR, id, surum, { fotolar: jsonDizi(yeni), cevaplar }, iz);
  if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") return sonuc(r, id, "");
  await dosyaCope(db, dosyaId, iz);
  return { durum: "tamam", id, bildirim: `${f.ad} silindi.` };
}

/** dosya erişim kaydı için: bu kişi bu raporu görebilir mi (Raporlar düzeyi; başka firmanınki RLS altında yok) */
export async function raporDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, raporId: string): Promise<boolean> {
  return !!(await erisim(db, { ...kisi, ad: "" }, raporId));
}

/* ── KAYDET VE KOPYALA (204–209; maket kopyala, pencereKaydet) ───────────────────────────────────────────────────── */
/** kayit: Yeni raporda ekranın son hâli (önce kaydedilir — "Kaydet ve kopyala"); gönderilmiş raporda null ("Kopyala"). Engeller kayıttan ÖNCE
    denetlenir (plan günü, günlük süre, kod), kopya düşerse rapor yarım kaydedilmiş kalmasın. */
export async function raporKopyala(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown, kayit: unknown): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip) return { durum: "yetkisiz" };
  const a = await acilabilirPlan(db, kim, e.r.plan_id);
  if ("hata" in a) return a.hata;
  if (a.p.personelId !== e.r.personel_id) return { durum: "yetkisiz" };
  if (a.p.durum === "tamamlandi") return { durum: "red", neden: "Plan tamamlandı; tamamlanmış plana ekipman eklenmez, kopya açılamaz." };
  const g = dogrula(KopyaGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const kd = await kodDurumu(db, kim, a.p.id, g.veri.kod);
  if (!kd) return { durum: "yetkisiz" };
  if (kd.tur !== "tamam") return { durum: "gecersiz", hatalar: { kod: kd.metin } };
  if (!(await yayindakiFormat(db, e.r.tur_id))) return { durum: "red", neden: "Bu türün yayınlanmış rapor formatı yok." };
  const kaynakKod = (await ekipmanEtiketi(db, e.r.ekipman_id))?.kod ?? "—";
  let kaydedildi = false, kaynak = e.r;
  if (e.r.durum === "taslak" && kayit != null) {
    if (!canDoEylem(kim, "rapor_yaz", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
    const k = await kaydetIc(db, kim, e, surum, kayit);
    if (k.durum !== "tamam") return k;
    kaydedildi = true;
    kaynak = (await raporOku(db, id)) ?? e.r;
  }
  const y = await yeniEkipman(db, kim, a.p.id, { kod: g.veri.kod, tur: e.r.tur_id, seri: null, konum: g.veri.konum ?? kaynak.ekipman_bilgi.konum });
  if (y.durum !== "tamam" || !y.id) return y.durum === "tamam" ? { durum: "yok" } : y;
  return raporAc(db, kim, a.p, y.id, { r: kaynak, konum: g.veri.konum },
    (no, kod) => `${kaydedildi ? "Rapor kaydedildi; " : ""}${kod} açıldı: ${no}. Bilgiler ${kaynakKod} raporundan kopyalandı.`);
}

/* ── FORMATI GÜNCELLE (211; RAPOR-FORMAT §5: rapor açıldığı sürümle kalır, Yeni raporda yazan güncel sürüme geçirebilir) ───────────── */
/** cevapları yeni sürüme taşır: kimliği eşleşen alan, madde (seçim yeni setteyse), ölçüm tablosu ve test değeri korunur; yeni madde ilk cevapla */
function formataUyarla(t: FormatTanimi, c: Cevaplar): { cevaplar: Cevaplar; eklenen: number; dusen: number } {
  const y = ilkCevaplar(t);
  let eklenen = 0, dusen = 0;
  for (const b of t.bolumler) {
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) {
      const x = c.madde[m.id];
      if (!x) eklenen++;
      else if (b.cevaplar.includes(x.c)) y.madde[m.id] = { ...x };
      /* cevabı yeni sette yok: sessizce ilk cevaba dönmez — seçim boşalır (Onaya gönder yeniden seçtirir), açıklama ve derece kalır */
      else { y.madde[m.id] = { ...x, c: "" }; dusen++; }
    }
    if (b.blok === "bilgi") for (const a of b.alanlar) if (Object.hasOwn(c.alan, a.id)) y.alan[a.id] = c.alan[a.id];
    if (b.blok === "olcum" && Object.hasOwn(c.tablo, b.id)) y.tablo[b.id] = c.tablo[b.id];
    if (b.blok === "test") for (const d of b.degerler) if (Object.hasOwn(c.deger, d.id)) y.deger[d.id] = c.deger[d.id];
  }
  return { cevaplar: { ...y, sonuc: c.sonuc, yorum: c.yorum }, eklenen, dusen };
}
/** fotoğrafların yeri yeni sürümde yoksa (bölüm ya da madde kalktı) formatın ilk fotoğraf bölümüne taşınır — fotoğraf kaybolmaz, silinebilir kalır */
function fotolariUyarla(t: FormatTanimi, l: RaporFoto[]): RaporFoto[] {
  const fotoBolum = new Set(t.bolumler.filter((b) => b.blok === "foto").map((b) => b.id)), ilk = [...fotoBolum][0];
  const maddeBolum = new Map(t.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => [m.id, b.id] as const)) : [])));
  return l.map((f) => {
    if (f.madde && maddeBolum.has(f.madde)) return { ...f, bolum: maddeBolum.get(f.madde)! };
    if (!f.madde && fotoBolum.has(f.bolum)) return f;
    return ilk ? { ...f, bolum: ilk, madde: null } : f;
  });
}
/** kayit: ekranın son hâli (Kaydet gibi doğrulanır; değişiklik kaybolmasın) */
export async function raporFormatGuncelle(db: Sorgulayici, kim: Kisi, id: string, surum: number, kayit: unknown): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const eski = await formatSurumuOku(db, e.r.format_id), yeni = await yayindakiFormat(db, e.r.tur_id);
  if (!eski || !yeni || yeni.sira <= eski.sira) return { durum: "red", neden: "Rapor güncel format sürümünde." };
  const g = dogrula(RaporKaydi, kayit);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const { cevaplar, eklenen, dusen } = formataUyarla(yeni.tanim, v.cevaplar);
  const fotolar = fotolariUyarla(yeni.tanim, e.r.fotolar);
  const c = sayiliCevaplar(cevaplar, { cihazlar: e.r.cihazlar, fotolar });
  const ilk = yeni.tanim.bolumler.find((b) => b.blok === "liste");
  const r = await guncelle(db, RAPOR, id, surum, {
    format_id: yeni.id, ekipman_bilgi: v.ekipman, bas: zamanYaz(v.tarih.bas), bit: zamanYaz(v.tarih.bit), sonraki: v.tarih.sonraki, takip: v.tarih.takip,
    rapor_tarihi: v.tarih.rapor, cevaplar: c, sonuc: c.sonuc || null, fotolar: jsonDizi(fotolar),
  }, { kim: kim.ad, ne: "rapor.format_guncelle", gerekce: `${gorunenNo(e.r.no, e.r.revizyon)} · sürüm ${eski.sira} → ${yeni.sira}` });
  const madde = eklenen ? `${eklenen} yeni madde eklendi (${ilk?.blok === "liste" ? ilk.cevaplar[0] : "Uygun"})` : "madde değişmedi";
  return sonuc(r, id, `Format güncellendi (sürüm ${yeni.sira}): ${madde}; ${dusen ? `${dusen} maddenin cevabı yeni cevap setinde yok, yeniden seçin.` : "cevaplar korundu."}`);
}

/* ── GÖZDEN GEÇİRME (Onaylar'ın onay ekranı; maket onaylar ozet; 17020 kayıt gözden geçirme — pkproje §4.9) ─────────────────────────── */
export interface GozdenGecirmeMaddesi { tamam: boolean; metin: string }
/** onaylayanın göreceği özet: İSG-KATİP, kontrol metodu, kriterler, ölçüm, test, cihaz ve kalibrasyon, fotoğraf, denetçinin mesleği (U1), sonuç
    (U3). Hepsi uyarıdır, engel değil. Raporun kendi kayıtlarından ve açıldığı format sürümünden; yoksa null. Yetki ÇAĞIRANDA. */
export async function gozdenGecirme(db: Sorgulayici, id: string): Promise<GozdenGecirmeMaddesi[] | null> {
  const r = await raporOku(db, id);
  if (!r) return null;
  const tur = await turRaporBilgisi(db, r.tur_id), format = await formatSurumuOku(db, r.format_id);
  if (!tur || !format) return null;
  const c = Cevaplar.safeParse(r.cevaplar);
  const d = degerle(format.tanim, c.success ? c.data : Cevaplar.parse({}), r);
  const bloklar = (b: string) => new Set(format.tanim.bolumler.filter((x) => x.blok === b).map((x) => x.id));
  const kusur = (b: string) => { const l = bloklar(b); return d.kusurlar.filter((k) => l.has(k.bolum)).length; };
  const maddeSay = format.tanim.bolumler.reduce((n, b) => n + (b.blok === "liste" ? b.gruplar.reduce((m, g) => m + g.maddeler.length, 0) : 0), 0);
  const testSay = format.tanim.bolumler.reduce((n, b) => n + (b.blok === "test" ? b.degerler.length : 0), 0);
  const satirSay = Object.values(d.satirlar).reduce((n, l) => n + l.length, 0);
  const { satirlar } = await cihazSatirlari(db, r, tur, bugunTr());
  const cihazlar = satirlar.flatMap((x) => (x.cihaz ? [x.cihaz] : [])), gecti = cihazlar.filter((x) => x.gecti || x.eksik || x.lab);
  const yazan = (await personelOzetleri(db, [r.personel_id]))[0];
  const meslek = TANIMLAR.meslekler.find((m) => m.k === yazan?.meslek), yetkili = !!meslek && meslek.g.includes(tur.grup);
  const l: GozdenGecirmeMaddesi[] = [
    r.kunye.isg_no ? { tamam: true, metin: `İSG-KATİP ${r.kunye.isg_no}` } : { tamam: false, metin: "İSG-KATİP kaydı yok" },
    { tamam: true, metin: `Kontrol metodu: ${tur.kontrolStd.length ? tur.kontrolStd.join(" · ") : "-"}` },
  ];
  if (maddeSay) { const k = kusur("liste"); l.push({ tamam: !k, metin: `${maddeSay} kriter yapıldı · ${k ? `${k} uygun değil madde` : "hepsi uygun"}` }); }
  if (bloklar("olcum").size) { const k = kusur("olcum"); l.push({ tamam: !k, metin: `${satirSay} ölçüm satırı · ${k ? `${k} uygun değil satır` : "hepsi uygun"}` }); }
  if (testSay) { const k = kusur("test"); l.push({ tamam: !k, metin: `${testSay} test değeri · ${k ? `${k} sınır dışı` : "hepsi sınır içinde"}` }); }
  l.push(cihazlar.length
    ? { tamam: !gecti.length, metin: `${cihazlar.length} ölçüm cihazı · ${gecti.length ? `kalibrasyonu geçmiş ya da geçersiz: ${gecti.map((x) => x.kod).join(", ")}` : "kalibrasyonu geçerli"}` }
    : { tamam: !tur.cihazTurleri.length, metin: "Ölçüm cihazı yok" });
  l.push({ tamam: true, metin: `${r.fotolar.length} fotoğraf` });
  l.push({ tamam: yetkili, metin: `Denetçi: ${yazan?.ad ?? "—"} · ${meslek?.ad ?? yazan?.meslekMetin ?? "meslek yok"}${yetkili ? "" : " · bu türe yetkili meslekler arasında değil"}` });
  const sonucAd = r.sonuc ? SONUC_AD[r.sonuc as keyof typeof SONUC_AD] : null;
  l.push({ tamam: r.sonuc !== "uygun_degil", metin: `Sonuç: ${sonucAd ?? "seçilmedi"}${r.sonuc && r.sonuc_oto ? " (kriterlere göre)" : ""}` });
  if (r.sonuc === "uygun" && d.kusurlar.length) l.push({ tamam: false, metin: "Uygun değil madde ya da sınır dışı test değeri varken sonuç “Uygun”." });
  return l;
}

/* ── RAPOR BELGESİ (önizleme ve PDF'in verisi; src/belge) ─────────────────────────────────────────────────────────────────────────── */
export interface RaporBelgesiSayfasi {
  id: string; no: string; plan: { id: string; no: string }; belge: BelgeVerisi;
  /** tamamlanan raporda imzalı PDF (ön izleme onu indirir; imzasız PDF basılmaz — sahte "imzalı" görünmesin) */
  imzaliDosya: string | null;
}
/** raporu görebilene belgenin verisi: raporun kendi kayıtları + açıldığı format sürümü; fotoğraflar raporun kendi dosyalarından okunup veri
    adresi olarak gömülür (yalnız JPEG / PNG — sunucuda denetlenmiş türler). Göremeyene null. */
export async function raporBelgesiVerisi(db: Sorgulayici, depo: Depo, kim: Kisi, id: string): Promise<RaporBelgesiSayfasi | null> {
  const e = await erisim(db, kim, id);
  if (!e) return null;
  const { r, tur } = e;
  const format = await formatSurumuOku(db, r.format_id);
  if (!format) return null;
  const plan = await raporIcinPlan(db, kim, r.plan_id);
  const etiket = await ekipmanEtiketi(db, r.ekipman_id);
  const yazan = await personelBelgeBilgisi(db, r.personel_id);
  /* kalibrasyon: muayene GÜNÜNDE geçerli olan (sonradan girilen yeni kalibrasyon eski raporu değiştirmez — 315–317 incelemesi) */
  const muayeneGunu = zamanOku(r.bas)?.slice(0, 10);
  const tum = await raporCihazlari(db, { pasifDahil: true }), kal = await cihazKalibrasyonlari(db, r.cihazlar.map((x) => x.cihaz), muayeneGunu);
  const cihazlar = r.cihazlar.map((x) => {
    const c = tum.find((y) => y.id === x.cihaz), k = kal.get(x.cihaz);
    return { turAd: c?.tur ?? "Ölçüm cihazı", kod: c?.kod ?? "—", marka: c?.marka ?? null, model: c?.model ?? null, seri: c?.seri ?? null,
      kalTarih: k?.tarih ?? null, kalBitis: k?.bitis ?? null, sertifika: k?.sertifika ?? null };
  });
  const fotolar = [];
  for (const f of r.fotolar) {
    const d = await kayitDosyasi(db, DOSYA_MODULU, r.id, f.dosya);
    const src = d && (d.tur === "image/jpeg" || d.tur === "image/png") ? `data:${d.tur};base64,${Buffer.from(await depo.oku(d.anahtar, db)).toString("base64")}` : null;
    fotolar.push({ ad: f.ad, bolum: f.bolum, madde: f.madde, src });
  }
  const cev = Cevaplar.safeParse(r.cevaplar);
  const onayAd = r.onay ? (await hesapAdlari(db, [r.onay_hesap])).get(r.onay_hesap ?? "") ?? "—" : null;
  /* tamamlanan raporun önizlemesi "imzasız" demez: imza zamanı ve yolu imzalı sürümden */
  const imzali = r.durum === "imzali" ? await imzaliSurum(db, r.id, r.revizyon) : null;
  return {
    id: r.id, no: gorunenNo(r.no, r.revizyon), plan: { id: r.plan_id, no: plan?.no ?? "—" }, imzaliDosya: imzali?.dosya ?? null,
    belge: {
      /* 334: başlıkta ticari ad, adres, akreditasyon no ve logo (Firma ayarları › Firma bilgileri) */
      firma: await firmaBelgeKunyesi(db, depo),
      no: r.no, revizyon: r.revizyon, formatSira: format.sira, durum: r.durum,
      tur: { ad: tur.ad, kod: tur.kod, kontrolStd: tur.kontrolStd },
      kunye: { firmaAdi: r.kunye.firma_adi, adres: r.kunye.adres ?? null, sgk: r.kunye.sgk ?? null, isgNo: r.kunye.isg_no ?? null },
      tarih: { bas: zamanOku(r.bas), bit: zamanOku(r.bit), sonraki: r.sonraki, takip: r.takip, rapor: r.rapor_tarihi },
      ekipman: { kod: etiket?.kod ?? "—", ...r.ekipman_bilgi },
      tanim: format.tanim, cevaplar: cev.success ? cev.data : Cevaplar.parse({}), cihazlar, fotolar,
      sonuc: r.sonuc === "uygun" || r.sonuc === "uygun_degil" ? r.sonuc : null,
      yazan: { ad: yazan?.ad ?? "—", meslek: yazan?.meslek ?? "diger", ekipnet: yazan?.ekipnet ?? null, diploma: yazan?.diploma ?? null, oda: yazan?.oda ?? null },
      onay: r.onay && onayAd ? { ad: onayAd, zaman: r.onay.toISOString() } : null,
      imza: imzali ? { zaman: imzali.zaman, yontem: YONTEM_AD[imzali.yontem] ?? imzali.yontem } : null,
    },
  };
}

/* ── SON İMZA — indir, imzala, yükle (317; göç 0027; karar 99, 104, 114, 187; araştırma §8) ───────────────────────────────────────── */
const ISTEK = tablo({ ad: "imza_istegi", sutunlar: ["rapor_id", "revizyon", "yontem", "durum", "pdf_dosya", "pdf_sha256", "imzali_dosya", "kopya"] });
const YONTEM_AD: Record<string, string> = { dosya: "e-imzalı PDF", mobil: "mobil imza", e_imza: "e-imza" };
/** hazırlık anının kopyası (0028): imzalanan PDF'le aynı kaynaktan yazan ve cihazlar — imzalı sürüm bundan yazılır */
interface IstekKopyasi { yazan?: BelgeVerisi["yazan"]; cihazlar?: BelgeVerisi["cihazlar"] }
const SURUM = tablo({ ad: "rapor_surumu", sutunlar: ["rapor_id", "revizyon", "no", "imzasiz_dosya", "imzali_dosya", "imzali_sha256", "imza_yontem", "kunye", "personel", "cihazlar", "icerik"] });
const UYGUNSUZLUK = tablo({ ad: "uygunsuzluk", sutunlar: ["surum_id", "kaynak", "ref", "kriter", "metin", "agir"] });
async function bekleyenIstek(db: Sorgulayici, raporId: string, revizyon: number) {
  return (await db.sorgu<{ id: string; pdf_dosya: string; pdf_sha256: string; surum: number; kopya: IstekKopyasi }>(
    "SELECT id::text, pdf_dosya::text, pdf_sha256, surum, kopya FROM imza_istegi WHERE rapor_id = $1 AND revizyon = $2 AND durum = 'bekliyor'", [raporId, revizyon])).rows[0] ?? null;
}
async function imzaliSurum(db: Sorgulayici, raporId: string, revizyon: number) {
  const x = (await db.sorgu<{ dosya: string; zaman: Date; no: string; yontem: string }>(
    "SELECT imzali_dosya::text AS dosya, imzalandi AS zaman, no, imza_yontem AS yontem FROM rapor_surumu WHERE rapor_id = $1 AND revizyon = $2", [raporId, revizyon])).rows[0];
  return x ? { dosya: x.dosya, zaman: x.zaman.toISOString(), no: x.no, yontem: x.yontem } : null;
}
const IMZA_GECERSIZ = "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor.";

/** imzaya hazırla: yalnız raporu yazan (rapor_son_imza), rapor onaylanmış. Kesin imzasız PDF bir kez üretilir ve saklanır (SHA-256 istekte);
    bekleyen istek varsa onun PDF'i döner (yeniden üretilmez — imzalanacak bayt değişmesin). uret: belge → PDF (sunucuda başsız Chromium). */
export async function imzaHazirla(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string,
  uret: (v: BelgeVerisi) => Promise<Uint8Array>): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_son_imza", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "onaylandi") return { durum: "red", neden: `Rapor imzaya hazır değil (şu an: ${RAPOR_DURUM[e.r.durum][0]}).` };
  if (await bekleyenIstek(db, id, e.r.revizyon)) return { durum: "tamam", id, bildirim: "İmzasız PDF hazır; indirip imzalayın, imzalı PDF'i yükleyin." };
  const v = await raporBelgesiVerisi(db, depo, kim, id);
  if (!v) return { durum: "yok" };
  /* PDF motoru düşerse rapor ekranı hata sayfasına dönmez: neden şeritte (315–317 incelemesi) */
  let pdf: Uint8Array;
  try { pdf = await uret({ ...v.belge, kesin: true }); } catch { return { durum: "red", neden: "İmzasız PDF üretilemedi; biraz sonra yeniden deneyin." }; }
  const y = await dosyaYukle(db, depo, { firmaId, modul: PDF_MODULU, kayitId: id, ad: `${gorunenNo(e.r.no, e.r.revizyon)}.pdf`, bayt: pdf, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "red", neden: "İmzasız PDF üretilemedi." };
  const kopya: IstekKopyasi = { yazan: v.belge.yazan, cihazlar: v.belge.cihazlar };
  await ekle(db, ISTEK, { rapor_id: id, revizyon: e.r.revizyon, yontem: "dosya", durum: "bekliyor", pdf_dosya: y.id, pdf_sha256: createHash("sha256").update(pdf).digest("hex"),
    kopya },
    { kim: kim.ad, ne: "rapor.imza_hazirla", gerekce: gorunenNo(e.r.no, e.r.revizyon) });
  return { durum: "tamam", id, bildirim: "İmzasız PDF hazır; indirip imzalayın, imzalı PDF'i yükleyin." };
}

/** imzalı PDF'i yükle: yalnız yazan; bekleyen istek olmalı. Kabul: tür baytlardan PDF, İLK BAYTLARI imzaya hazırlanan PDF'in kendisi (PAdES
    artımlı imza özgün baytları korur) ve eklenen kısımda imza sözlüğü (/Type /Sig, /ByteRange, /Contents) — kriptografik zincir doğrulaması
    sonraki fazda. Aynı işlemde: imzalı sürüm (kopyalarla) → uygunsuzluklar (sonuç "Uygun" değilse; aynı ekipmanın önceki açıkları tetikle
    kapanır) → istek tamam → rapor Tamamlandı (müşteriye açılır, 104). */
export async function imzaliYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number,
  dosya: { ad: string; bayt: Uint8Array }): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_son_imza", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "onaylandi") return { durum: "red", neden: `Rapor imzaya hazır değil (şu an: ${RAPOR_DURUM[e.r.durum][0]}).` };
  if (surum !== e.r.surum) return { durum: "cakisma" };
  const istek = await bekleyenIstek(db, id, e.r.revizyon);
  if (!istek) return { durum: "red", neden: "Önce imzasız PDF'i hazırlayıp indirin; imzalı PDF onun imzalanmış hâli olmalı." };
  const ham = await kayitDosyasi(db, PDF_MODULU, id, istek.pdf_dosya);
  if (!ham) return { durum: "red", neden: "İmzaya hazırlanan PDF bulunamadı; yeniden hazırlayın." };
  const imzasiz = await depo.oku(ham.anahtar, db), b = dosya.bayt;
  /* önek + bir nesnedeki imza sözlüğü + ek özgün içeriği değiştirmez (imza-pdf.ts) */
  if (!imzaliPdfGecerli(imzasiz, b)) return { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } };
  const gno = gorunenNo(e.r.no, e.r.revizyon);
  const y = await dosyaYukle(db, depo, { firmaId, modul: IMZALI_MODULU, kayitId: id, ad: `${gno}-imzali.pdf`, bayt: b, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF çok büyük (en çok 25 MB)." : IMZA_GECERSIZ } };
  const v = await raporBelgesiVerisi(db, depo, kim, id);
  if (!v) return { durum: "yok" };
  const iz: Iz = { kim: kim.ad, ne: "rapor.imza", gerekce: gno };
  /* imza anının kopyaları (§3.2-8): künye, yazan, cihazlar (kalibrasyonuyla), içerik — sonradan değişen kayıt imzalı raporu değiştirmez. Yazan ve
     cihazlar imzalanan PDF'in hazırlandığı andan (isteğin kopyası, 0028); içerik raporun kendisinden (onaylanmış rapor değişmez, onaydan
     çıkınca istek iptal olur) */
  const s = await ekle(db, SURUM, {
    rapor_id: id, revizyon: e.r.revizyon, no: e.r.no, imzasiz_dosya: istek.pdf_dosya, imzali_dosya: y.id,
    imzali_sha256: createHash("sha256").update(b).digest("hex"), imza_yontem: "dosya",
    kunye: e.r.kunye, personel: istek.kopya.yazan ?? v.belge.yazan, cihazlar: jsonDizi(istek.kopya.cihazlar ?? v.belge.cihazlar),
    icerik: { cevaplar: v.belge.cevaplar, ekipman_bilgi: e.r.ekipman_bilgi, tarih: v.belge.tarih, format_id: e.r.format_id, format_sira: v.belge.formatSira },
  }, iz);
  /* uygunsuzluk: imzalı ve "Uygun" olmayan rapordan, motorun kusur listesinden */
  if (e.r.sonuc === "uygun_degil") {
    const d = degerle(v.belge.tanim, v.belge.cevaplar, e.r);
    const blok = new Map(v.belge.tanim.bolumler.map((x) => [x.id, x.blok]));
    for (const k of d.kusurlar) {
      const tur = blok.get(k.bolum);
      /* kriter ayrı (müşteri listesinde ve Excel'de Kriter / Açıklama sütunları — 0036); metnin başı değilse (kırpılmış) yazılmaz */
      const metin = k.metin.slice(0, 1200);
      const kriter = k.kriter.length >= 1 && k.kriter.length <= 1000 && (metin === k.kriter || metin.startsWith(`${k.kriter}: `)) ? k.kriter : null;
      await ekle(db, UYGUNSUZLUK, { surum_id: s.id, kaynak: tur === "olcum" ? "olcum" : tur === "test" ? "test" : "madde", ref: k.ref.slice(0, 60), kriter, metin, agir: !!k.agir }, iz);
    }
  }
  const g = await guncelle(db, ISTEK, istek.id, istek.surum, { durum: "tamam", imzali_dosya: y.id }, iz);
  if (g.durum !== "tamam") return { durum: "cakisma" };
  return sonuc(await guncelle(db, RAPOR, id, surum, { durum: "imzali" }, iz), id, `${gno} imzalandı, tamamlandı ve müşteriye açıldı.`);
}

/* ── RAPORLAR LİSTESİ (modül 14 ana sayfası; maket raporlar.html #/ — 318) ─────────────────────────────────────────────────────────────── */
/** listede bir rapor: yazan hesabın kimliği gitmez; benim = isteyenin yazdığı; geri = Yeni'ye geri dönmüş (geri gönderilen ya da revizeye gönderilen) */
export type RaporListeSatiri = Omit<RaporOzeti, "hesapId"> & { benim: boolean; geri: boolean };
/** görebildiği raporlar (denetçi kendi, branş yöneticisi branşı, planlama ve firma yöneticisi hepsi); en yeni üstte. Göremeyene null. */
export async function raporListesi(db: Sorgulayici, kim: Kisi): Promise<RaporListeSatiri[] | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const l = (await raporOzetleri(db)).filter((r) => canDo(kim, MODUL, "gor", { sahip: r.hesapId, brans: r.brans }));
  const taslak = l.filter((r) => r.durum === "taslak").map((r) => r.id);
  const geri = new Set(taslak.length ? (await db.sorgu<{ r: string }>(
    "SELECT DISTINCT rapor_id::text AS r FROM rapor_hareket WHERE ne IN ('geri', 'revize') AND rapor_id = ANY ($1::uuid[])", [taslak])).rows.map((x) => x.r) : []);
  return l.sort((a, b) => b.olustu.localeCompare(a.olustu)).map((r) => {
    const x: Partial<RaporOzeti> = { ...r };
    delete x.hesapId;
    return { ...(x as Omit<RaporOzeti, "hesapId">), benim: !!r.hesapId && r.hesapId === kim.id, geri: r.durum === "taslak" && geri.has(r.id) };
  });
}

/* ── REVİZE İSTEĞİ (318; göç 0029; maket raporlar.html 192 "Revize iste" · "Revize isteğini geri çek") ─────────────────────────────────── */
/** tamamlanan raporda revize iste: yalnız raporu yazan (rapor_revize_iste), gerekçe ≥ 10; rapor başına tek bekleyen istek. Teknik yöneticinin
    Onaylar'ındaki "Revize istekleri"ne düşer; revizeye gönderen yine yönetici. */
export async function revizeIste(db: Sorgulayici, kim: Kisi, id: string, girdi: unknown): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_revize_iste", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  if (e.r.durum !== "imzali") return { durum: "red", neden: "Revize yalnız tamamlanan raporda istenir." };
  const g = dogrula(RevizeGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  if ((await revizeDurumu(db, id, e.r.revizyon)).bekleyen) return { durum: "red", neden: "Bu rapor için bekleyen bir revize isteğiniz var." };
  const no = gorunenNo(e.r.no, e.r.revizyon);
  await istekAc(db, { kim: kim.ad, ne: "rapor.revize_iste", gerekce: no }, id, e.r.revizyon, g.veri.gerekce);
  return { durum: "tamam", id, bildirim: `${no} için revize isteği teknik yöneticiye gitti.` };
}

/** revize isteğini geri çek: yalnız isteyen (veritabanı da ister); istemcinin gördüğü isteğin kimliği ve sürümüyle */
export async function revizeIstegiGeriCek(db: Sorgulayici, kim: Kisi, id: string, istekId: string, surum: number): Promise<RaporYazma> {
  const e = await erisim(db, kim, id, true);
  if (!e) return { durum: "yok" };
  if (!e.sahip || !canDoEylem(kim, "rapor_revize_iste", { sahip: e.r.hesap_id })) return { durum: "yetkisiz" };
  const b = (await revizeDurumu(db, id, e.r.revizyon)).bekleyen;
  if (!b || b.hesapId !== kim.id) return { durum: "red", neden: "Bekleyen revize isteğiniz yok." };
  if (b.id !== istekId || !Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const no = gorunenNo(e.r.no, e.r.revizyon);
  const s = await istekKapat(db, { kim: kim.ad, ne: "rapor.revize_istek_geri", gerekce: no }, { ...b, surum }, "geri_cekildi", null);
  if (s.durum !== "tamam") return { durum: s.durum === "yok" ? "yok" : "cakisma" };
  return { durum: "tamam", id, bildirim: `${no} revize isteği geri çekildi.` };
}
