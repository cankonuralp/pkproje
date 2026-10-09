/* BAKANLIK FORMATLARI HER FİRMADA HAZIR (437; reisim 2026-10-09: "HALA BAKANLIK FORMATLARI YOK DEFAULT OLARAK GELMESİ GEREKİYOR … RAPOR FORMATI
   PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK ŞEKİLDE KONUŞMUŞTUK") — Bakanlığın zorunlu rapor formatlarının (kitaplıkta bakanlik: true —
   ZPKR01–05) her biri için firmada ekipman türü kendiliğinden kurulur:
   · tür: kitaplığın önerdiği ad / kod / grup / periyot (Ekipman türleri'nin kendi şemasından geçer) + kontrol metodu standartları ve 440 ölçüm
     cihazı türleri (src/tanim/standartlar.ts — cihaz türü adıyla bulunur, yoksa Ölçüm cihazları'nda açılır);
   · rapor formatı: Bakanlığın resmî PDF'i (src/tanim/bakanlik/<form kodu>.pdf), sürüm 1;
   · rapor şablonu: kitaplıktaki şablondan, YAYINDA sürüm 1 — denetçi hemen rapor yazar.
   Firma sonra her şeyi değiştirir (ad, periyot, şablonu kopyalayıp düzenler, kendi PDF'ini yükler, metot ve cihazlar) ya da kullanılmamış türü
   siler; silinen tür yeniden kurulmaz. Kayıt firma ayarında ("kurulum": kurulan şablonlar) — kitaplığa yeni Bakanlık formatı girince yalnız o
   kurulur. Firma o kodu ya da o şablonu zaten kullanıyorsa (türü kendisi açmış) yeni tür açılmaz, şablon kurulmuş sayılır.
   Kim: sistem ("probata · hazır kurulum"), kendi işleminde ve hesapsız (yayınlayan hesap boş) — kişinin yetkisine bağlı değil; eylemden çağrılmaz.
   TAMAMLAMA (438 PDF, 440 bağlantı — canlıda firma ZPKR02'yi kendi türünde kullanıyordu: PDF'i, standardı, cihazı yoktu): Bakanlık şablonu kullanan
   (taslak ya da yayında) türde rapor formatı PDF'i hiç yoksa resmî PDF sürüm 1; kontrol metodu standartları boşsa formatın standartları; ölçüm
   cihazı türleri boşsa formatın cihaz türleri. Kurulumda bir kez bütün firmada (ayar "kurulum.pdf", "kurulum.baglanti"), sonra "Şablondan
   başlat" ve "Tür olarak ekle"de o türe (bakanlikTamamla, tür + format yetkisiyle). Firmanın yüklediği / kaldırdığı PDF'e ve seçtiği bağlantıya
   dokunulmaz.
   Aynı anda iki istek: firma başına danışma kilidi, ikincisi kayıtta görür ve bir şey yapmaz. Tetik: Ana sayfa ve Ekipman türleri açılınca (ilk
   açılışta kurulur; sonra yalnız ayar okunur, süreçte bellekte de tutulur). Kurulum düşerse sayfa düşmez (kayda yazılır, sonraki açılışta yeniden). */
import { SABLONLAR } from "../../../format/sablonlar.ts";
import { ayarOku, ayarYaz } from "../../../server/ayar/ayar.ts";
import { bakanlikBelgesiMi, bakanlikPdf } from "../../../server/bakanlik.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { formatCihazTurleri, formatStandartlari } from "../../../tanim/standartlar.ts";
import { hazirBaglantiTamamla, hazirPdfEkle, hazirTurKur, turDegistirir } from "../../ekipman-turleri/server/turler.ts";
import { hazirCihazTuru } from "../../olcum-cihazlari/server/cihazlar.ts";
import { sablonBul } from "../sema.ts";
import { formatDegistirir, hazirFormatYayinla, sablonKullaniliyor, sablonTurleri, turunSablonu, type Kisi } from "./formatlar.ts";

export const KURULUM_KIM = "probata · hazır kurulum";
export const KURULUM_NOTU = "Bakanlık formatı";
/** kurulan şablonlar: kitaplıktaki Bakanlık formatları, kitaplık sırasıyla */
export const HAZIR_SABLONLAR: readonly string[] = Object.entries(SABLONLAR).filter(([, s]) => s.bakanlik).map(([k]) => k);

export interface KurulumSonucu { kurulan: number; atlanan: number; pdf: number; baglanti: number }
export interface Tamamlama { pdf: boolean; baglanti: boolean }

/** şablonun Bakanlık form kodu (ZPKR…; Bakanlık formatı değilse null) */
const bakanlikFormu = (sablon: string | null) => {
  const s = sablon ? sablonBul(sablon) : null;
  return s?.bakanlik ? s.tanim.gorunum.formKodu : null;
};
/** formun resmî PDF'i (PDF'i yoksa null) */
const resmiPdf = async (form: string | null) => (form && bakanlikBelgesiMi(form) ? { ad: `${form}.pdf`, bayt: await bakanlikPdf(form) } : null);
/** formun ölçüm cihazı türlerinin kimlikleri (adıyla bulunur, yoksa açılır) */
const cihazTurleri = async (db: Sorgulayici, form: string) => {
  const l: string[] = [];
  for (const ad of formatCihazTurleri(form)) l.push(await hazirCihazTuru(db, KURULUM_KIM, ad));
  return l;
};

/** türün şablonu Bakanlık formatıysa: PDF'i hiç yoksa resmî PDF, boş standart / cihaz bağlantısı formatınkiyle. YETKİ YOK — kurulum ve
    bakanlikTamamla çağırır. */
async function tamamla(db: Sorgulayici, depo: Depo, firmaId: string, kim: string, turId: string): Promise<Tamamlama> {
  const form = bakanlikFormu(await turunSablonu(db, turId));
  if (!form) return { pdf: false, baglanti: false };
  const pdf = await resmiPdf(form);
  return {
    pdf: pdf ? await hazirPdfEkle(db, depo, firmaId, kim, turId, pdf) : false,
    baglanti: await hazirBaglantiTamamla(db, kim, turId, formatStandartlari(form), () => cihazTurleri(db, form)),
  };
}

/** 438 / 440 · eylemden ("Şablondan başlat", "Tür olarak ekle" başarılı olunca, aynı işlemde): türe Bakanlık varsayılanları — tür ve format
    değiştirebilene (yetkisize hiçbir şey) */
export async function bakanlikTamamla(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, turId: string): Promise<Tamamlama> {
  if (!formatDegistirir(kim) || !turDegistirir(kim)) return { pdf: false, baglanti: false };
  return tamamla(db, depo, firmaId, kim.ad, turId);
}

/** firmanın işleminde: eksik Bakanlık türlerini kurar, Bakanlık şablonlu türleri tamamlar (hepsi yapıldıysa hiçbir şey yazmaz) */
export async function bakanlikKurulumu(db: Sorgulayici, depo: Depo): Promise<KurulumSonucu> {
  const sonuc = { kurulan: 0, atlanan: 0, pdf: 0, baglanti: 0 };
  const eksik = (k: { bakanlik: string[] }) => HAZIR_SABLONLAR.filter((s) => !k.bakanlik.includes(s));
  const bitti = (k: { bakanlik: string[]; pdf: boolean; baglanti: boolean }) => !eksik(k).length && k.pdf && k.baglanti;
  if (bitti((await ayarOku(db, "kurulum")).deger)) return sonuc;
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('probata.kurulum.' || gecerli_firma()::text))");
  const a = await ayarOku(db, "kurulum");   // kilitten SONRA yeniden: beklerken öteki istek kurmuş olabilir
  if (bitti(a.deger)) return sonuc;
  const kurulacak = eksik(a.deger);
  const firmaId = (await db.sorgu<{ id: string }>("SELECT gecerli_firma()::text AS id")).rows[0].id;
  for (const k of kurulacak) {
    const s = SABLONLAR[k];
    const form = s.tanim.gorunum.formKodu;
    if (await sablonKullaniliyor(db, k)) { sonuc.atlanan++; continue; }
    const turId = await hazirTurKur(db, depo, firmaId, KURULUM_KIM,
      { ...s.tur, standartlar: formatStandartlari(form), cihazTurleri: await cihazTurleri(db, form) }, await resmiPdf(form));
    if (!turId) { sonuc.atlanan++; continue; }
    await hazirFormatYayinla(db, KURULUM_KIM, turId, k, KURULUM_NOTU);
    sonuc.kurulan++;
  }
  /* firmanın kendi açtığı (ya da önceki kurulumda açılmış) Bakanlık şablonlu türler: eksik PDF / bağlantı — dolu olana dokunulmaz */
  if (!a.deger.pdf || !a.deger.baglanti) {
    for (const t of await sablonTurleri(db, HAZIR_SABLONLAR)) {
      const x = await tamamla(db, depo, firmaId, KURULUM_KIM, t);
      if (x.pdf) sonuc.pdf++;
      if (x.baglanti) sonuc.baglanti++;
    }
  }
  const y = await ayarYaz(db, "kurulum", a.surum, { bakanlik: [...a.deger.bakanlik, ...kurulacak], pdf: true, baglanti: true },
    { kim: KURULUM_KIM, ne: "firma_ayar.kurulum" });
  if (y.durum !== "tamam") throw new Error(`kurulum kaydı yazılamadı: ${y.durum}`);
  return sonuc;
}

const g = globalThis as unknown as { __probataKurulan?: Set<string> };
/** sayfanın tetiği: firmanın kurulumu (kendi işleminde, hesapsız). Bu süreçte kurulmuş firma bir daha sorgulanmaz; düşerse sayfa düşmez. */
export async function hazirKurulum(havuz: Havuz, depo: Depo, firmaId: string): Promise<void> {
  const kurulan = (g.__probataKurulan ??= new Set());
  if (kurulan.has(firmaId)) return;
  try {
    await kiraciIcinde(havuz, firmaId, (db) => bakanlikKurulumu(db, depo));
    kurulan.add(firmaId);
  } catch (h) {
    console.error("[kurulum] Bakanlık formatları kurulamadı:", (h as Error).message);
  }
}
