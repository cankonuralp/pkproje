/* RAPORLAR — saha raporu (modül 14; maket rapor.html M8; KOD-GECIS §4 rapor_* özel eylemleri, §5 Rapor, §9 ENGEL 1, 2, 5, 6; RAPOR-FORMAT §7).
   Yetki her işlevde SUNUCUDA:
   · Rapor oluştur: yalnız plandaki denetçi (rapor_olustur), plan kabul edilmiş / denetimde / tamamlanmış, plan günü gelmiş (ENGEL 1 — ileri tarihe
     kapalı, geçmiş açık), ekipman planda ve etkin, ekipmanın bu planda etkin raporu yok (203), türün YAYINDA formatı var (rapor o sürümle açılır).
     İlk rapor planı Denetimde yapar (Planlar.denetimeBasla).
   · Görme: Raporlar düzeyi — "gör" hepsi, "branşı" türün branşı, "kendi" yalnız yazdığı rapor; başka firmanınki "yok".
   · Kaydet / Onaya gönder / cihaz: yalnız raporu YAZAN (rapor_yaz) ve rapor Yeni (içerik yalnız Yeni'de değişir — veritabanı da zorlar).
   · Onaya gönder: zorunlu alan eksikse (format + sabit tarihler) ENGEL 5, türün gerekli ölçüm cihazı eksik / kalibrasyonu geçmişse ENGEL 2 —
     rapor yine kaydedilir, eksikler listelenir. Öteki kurallar uyarıdır.
   · Sil: rapor_sil (yazan Yeni raporunu; teknik yönetici) — silme yok, "silindi" damgası (veritabanı zamanıyla). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { raporNoAl } from "../../../server/numara/numara.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import { canDo, canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { degerlendir, type Degerlendirme } from "../../../format/motor.ts";
import { Cevaplar, type FormatTanimi } from "../../../format/tanim.ts";
import { ekipmanEtiketi, ekipmanKilitle } from "../../ekipman/server/ekipman.ts";
import { turRaporBilgisi } from "../../ekipman-turleri/server/turler.ts";
import { tesisMusteriIletisim } from "../../musteriler/server/musteriler.ts";
import { raporCihazlari } from "../../olcum-cihazlari/server/cihazlar.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { denetimeBasla, kunyeGuncelle, plandakiEkipman, raporIcinPlan, type Kunye } from "../../planlar/server/plan-ici.ts";
import { formatSurumuOku, yayindakiFormat } from "../../rapor-format/server/formatlar.ts";
import { kimdeHaritasi } from "../../zimmetler/server/zimmet.ts";
import { roldekiHesapAdlari } from "../../../server/kimlik/hesap.ts";
import { ayEkle, kalibrasyonGecti, RaporKaydi, SONUC_AD, type EkipmanBilgisi, type RaporCihazi, type RaporDurumu, type RaporTarihleri } from "../sema.ts";

const MODUL = 14;
/** rapor fotoğrafının dosya modülü (dosya erişim kaydında: raporu gören açar) */
export const DOSYA_MODULU = "rapor";
/** raporda fotoğraf: fotoğraf bölümüne ya da "Uygun değil" maddeye bağlı (madde fotoğrafı Kusur açıklamalarına düşer — O2) */
export interface RaporFoto { dosya: string; ad: string; bolum: string; madde: string | null }
const FOTO_MADDE_EN_COK = 10;
const RAPOR = tablo({
  ad: "rapor", sutunlar: ["no", "plan_id", "ekipman_id", "tur_id", "format_id", "personel_id", "durum", "kunye", "kunye_surum", "ekipman_bilgi", "bas", "bit",
    "sonraki", "takip", "rapor_tarihi", "cevaplar", "cihazlar", "fotolar", "sonuc", "sonuc_oto", "silindi"],
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
export async function raporOlustur(db: Sorgulayici, kim: Kisi, planId: string, ekipmanId: string): Promise<RaporYazma> {
  const plan = await raporIcinPlan(db, kim, planId);
  if (!plan) return { durum: "yok" };
  if (!plan.personelId || duzey(kim, MODUL) === "yok" || !canDoEylem(kim, "rapor_olustur", { atananlar: plan.atananlar })) return { durum: "yetkisiz" };
  if (plan.durum !== "kabul" && plan.durum !== "denetimde" && plan.durum !== "tamamlandi") return { durum: "red", neden: "Rapor yalnız kabul edilmiş planda oluşturulur." };
  const bugun = bugunTr();
  if (plan.baslangic > bugun) {
    return { durum: "red", neden: `Plan günü ${tarihNo(plan.baslangic)} henüz gelmedi (bugün ${tarihNo(bugun)}). Rapor plan gününden itibaren oluşturulur; geçmiş günlere açık, ileri tarihe kapalı.` };
  }
  if (!(await plandakiEkipman(db, planId, ekipmanId))) return { durum: "yok" };
  await ekipmanKilitle(db, ekipmanId);   /* pasife alma ile aynı anda koşmasın: ikisi de ekipmanın satırında sıraya girer */
  const e = await ekipmanEtiketi(db, ekipmanId);
  if (!e) return { durum: "yok" };
  if (e.pasif) return { durum: "red", neden: "Ekipman pasif; rapor açılamaz. Etkinleştir ile geri alınır." };
  if ((await db.sorgu("SELECT 1 FROM rapor WHERE plan_id = $1 AND ekipman_id = $2 AND silindi IS NULL", [planId, ekipmanId])).rowCount) {
    return { durum: "red", neden: "Bu ekipmanın bu planda raporu var." };
  }
  const tur = await turRaporBilgisi(db, e.turId);
  if (!tur) return { durum: "yok" };
  const format = await yayindakiFormat(db, tur.id);
  if (!format) return { durum: "red", neden: "Bu türün yayınlanmış rapor formatı yok." };
  const iletisim = await tesisMusteriIletisim(db, plan.tesisId);
  const no = await raporNoAl(db);
  const iz: Iz = { kim: kim.ad, ne: "rapor.olustur", gerekce: `${no} · ${plan.no} · ${e.kod}` };
  const ekipmanBilgi: EkipmanBilgisi = { marka: e.marka, model: e.model, seri: e.seri, imal: e.imal ? String(e.imal) : null, konum: e.konum, amac: null, bolum: null };
  const r = await ekle(db, RAPOR, {
    no, plan_id: planId, ekipman_id: ekipmanId, tur_id: tur.id, format_id: format.id, personel_id: plan.personelId, durum: "taslak",
    kunye: { ...plan.kunye, eposta: iletisim?.eposta ?? null, tel: iletisim?.tel ?? null }, kunye_surum: plan.kunyeSurum, ekipman_bilgi: ekipmanBilgi,
    cevaplar: ilkCevaplar(format.tanim),
  }, iz);
  await denetimeBasla(db, kim.ad, planId);
  return { durum: "tamam", id: r.id, bildirim: `Rapor oluşturuldu: ${no}. Satırındaki “Raporu düzenle” saha rapor ekranını açar.` };
}

/* ── OKUMA ───────────────────────────────────────────────────────────────────────────────────────────────────── */
interface RaporSatiri {
  id: string; no: string; plan_id: string; ekipman_id: string; tur_id: string; format_id: string; personel_id: string; hesap_id: string | null; durum: RaporDurumu;
  kunye: Kunye & { eposta?: string | null; tel?: string | null }; kunye_surum: number; ekipman_bilgi: EkipmanBilgisi; bas: Date; bit: Date | null;
  sonraki: string | null; takip: string | null; rapor_tarihi: string | null; cevaplar: unknown; cihazlar: RaporCihazi[]; fotolar: RaporFoto[]; sonuc: string | null;
  sonuc_oto: boolean; gonderildi: Date | null; surum: number; olustu: Date; degisti: Date;
}
async function raporOku(db: Sorgulayici, id: string, kilitle = false): Promise<RaporSatiri | null> {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<RaporSatiri>(
    `SELECT id::text, no, plan_id::text, ekipman_id::text, tur_id::text, format_id::text, personel_id::text, hesap_id::text, durum, kunye, kunye_surum, ekipman_bilgi,
       bas, bit, sonraki::text, takip::text, rapor_tarihi::text, cevaplar, cihazlar, fotolar, sonuc, sonuc_oto, gonderildi, surum, olustu, degisti
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
  /** fotoğraflar (bölüme ya da maddeye bağlı); indirme tek uçtan (/api/dosya/<id>), raporu görene */
  fotolar: RaporFoto[];
  /** Cihaz ekle penceresi: yazanın zimmetindeki, kalibrasyonu geçerli cihazlar tür başına; tür gerekli cihaz türü vermiyorsa "*" altında hepsi
      (yalnız düzenleyebilene). Seçilen cihaz kendi türünün satırına yazılır. */
  secilebilir: Record<string, { id: string; kod: string; marka: string | null; model: string | null; seri: string | null; bitis: string | null }[]>;
  izin: { duzenle: boolean; sil: boolean };
}

const kunyeFarki = (a: Kunye, b: Kunye) => [
  a.firma_adi !== b.firma_adi && "Firma adı", (a.adres ?? null) !== (b.adres ?? null) && "Adres", (a.sgk ?? null) !== (b.sgk ?? null) && "SGK DETSİS NO",
  (a.isg_no ?? null) !== (b.isg_no ?? null) && "İSG-KATİP SÖZLEŞME ID",
].filter((x): x is string => !!x);

async function cihazSatirlari(db: Sorgulayici, r: RaporSatiri, tur: Erisim["tur"], bugun: string): Promise<{ satirlar: CihazSatiri[]; tumu: Awaited<ReturnType<typeof raporCihazlari>> }> {
  const tumu = await raporCihazlari(db);
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
    const benim = tumu.filter((c) => c.konum !== "lab" && kimde.get(c.id) === r.personel_id && !kalibrasyonGecti(c.bitis, bugun));
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
  return {
    id: r.id, no: r.no, durum: r.durum, surum: r.surum, olustu: r.olustu.toISOString(), degisti: r.degisti.toISOString(), gonderildi: r.gonderildi?.toISOString() ?? null, bugun,
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
    izin: { duzenle, sil: r.durum === "taslak" && canDoEylem(kim, "rapor_sil", { sahip: r.hesap_id, durum: "Yeni", brans: tur.brans }) },
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
  }, { kim: kim.ad, ne: "rapor.kaydet", gerekce: e.r.no });
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
  const { satirlar } = await cihazSatirlari(db, r, e.tur, bugun);
  const cihazBolumleri = new Set(satirlar.length ? format.tanim.bolumler.filter((b) => b.blok === "cihaz").map((b) => b.id) : []);
  const eksikler = d.eksikler.filter((x) => !sonucBolumleri.has(x.bolum) && !cihazBolumleri.has(x.bolum));
  for (const s of satirlar) {
    if (!s.cihaz) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.turAd}: ölçüm cihazı eklenmedi` });
    else if (s.cihaz.eksik) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.turAd}: eklenen cihaz artık kayıtlı değil` });
    else if (s.cihaz.lab) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.cihaz.kod}: kalibrasyonda` });
    else if (s.cihaz.gecti) eksikler.push({ bolum: "cihaz", alan: `cihaz.${s.turId}`, ad: `${s.cihaz.kod}: kalibrasyonu geçmiş${s.cihaz.bitis ? ` (${tarihNo(s.cihaz.bitis)})` : ""}` });
  }
  if (eksikler.length) return { durum: "eksik", eksikler };
  const oto = !cev.sonuc;
  const sonucu: "uygun" | "uygun_degil" = cev.sonuc || d.oneri;
  const basGun = GUN.format(r.bas);
  const g = await guncelle(db, RAPOR, id, r.surum, {
    durum: "onayda", cevaplar: { ...cev, sonuc: sonucu }, sonuc: sonucu, sonuc_oto: oto,
    bit: r.bit ?? new Date(Math.max(Date.now(), r.bas.getTime())), sonraki: r.sonraki ?? ayEkle(basGun, e.tur.periyot), rapor_tarihi: r.rapor_tarihi ?? basGun,
  }, { kim: kim.ad, ne: "rapor.onaya_gonder", gerekce: r.no });
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
  const r = await guncelle(db, RAPOR, id, surum, { silindi: new Date() }, { kim: kim.ad, ne: "rapor.sil", gerekce: e.r.no });
  return sonuc(r, id, `${e.r.no} silindi.`);
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
  return sonuc(await guncelle(db, RAPOR, id, surum, { cihazlar: jsonDizi(cihazlar), cevaplar }, { kim: kim.ad, ne: "rapor.cihaz_ekle", gerekce: `${e.r.no} · ${c.kod}` }), id, `${c.kod} eklendi.`);
}

export async function cihazKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number, turId: string): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  if (!e.r.cihazlar.some((x) => x.tur === turId)) return { durum: "tamam", id, bildirim: "Cihaz zaten yok." };
  const cihazlar = e.r.cihazlar.filter((x) => x.tur !== turId);
  const cevaplar = { ...(e.r.cevaplar as object), cihaz: cihazlar.length };
  return sonuc(await guncelle(db, RAPOR, id, surum, { cihazlar: jsonDizi(cihazlar), cevaplar }, { kim: kim.ad, ne: "rapor.cihaz_kaldir", gerekce: e.r.no }), id, "Cihaz kaldırıldı.");
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
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: id, ad: dosya.ad, bayt: dosya.bayt, izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { foto: y.neden === "tur" ? "Yalnız JPEG ya da PNG fotoğraf." : y.neden === "buyuk" ? "Fotoğraf çok büyük (en çok 8 MB)." : "Fotoğraf okunamadı." } };
  const yeni = [...fotolar, { dosya: y.id, ad: y.ad, bolum: hedef.bolum, madde: hedef.madde }];
  const cevaplar = sayiliCevaplar(Cevaplar.parse(e.r.cevaplar), { cihazlar: e.r.cihazlar, fotolar: yeni });
  return sonuc(await guncelle(db, RAPOR, id, surum, { fotolar: jsonDizi(yeni), cevaplar }, { kim: kim.ad, ne: "rapor.foto_ekle", gerekce: `${e.r.no} · ${y.ad}` }), id, `${y.ad} eklendi.`);
}

/** fotoğraf sil: listeden çıkar, dosya çöpe (indirilemez). Yalnız yazan, Yeni raporda. */
export async function fotoSil(db: Sorgulayici, kim: Kisi, id: string, surum: number, dosyaId: string): Promise<RaporYazma> {
  const e = await yazilabilir(db, kim, id);
  if (hataMi(e)) return e;
  const f = e.r.fotolar.find((x) => x.dosya === dosyaId);
  if (!f) return { durum: "tamam", id, bildirim: "Fotoğraf zaten yok." };
  const yeni = e.r.fotolar.filter((x) => x.dosya !== dosyaId);
  const cevaplar = sayiliCevaplar(Cevaplar.parse(e.r.cevaplar), { cihazlar: e.r.cihazlar, fotolar: yeni });
  const iz = { kim: kim.ad, ne: "rapor.foto_sil", gerekce: `${e.r.no} · ${f.ad}` };
  const r = await guncelle(db, RAPOR, id, surum, { fotolar: jsonDizi(yeni), cevaplar }, iz);
  if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") return sonuc(r, id, "");
  await dosyaCope(db, dosyaId, iz);
  return { durum: "tamam", id, bildirim: `${f.ad} silindi.` };
}

/** dosya erişim kaydı için: bu kişi bu raporu görebilir mi (Raporlar düzeyi; başka firmanınki RLS altında yok) */
export async function raporDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, raporId: string): Promise<boolean> {
  return !!(await erisim(db, { ...kisi, ad: "" }, raporId));
}
