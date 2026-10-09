/* BAKANLIK FORMATLARI HER FİRMADA HAZIR (437; reisim 2026-10-09: "HALA BAKANLIK FORMATLARI YOK DEFAULT OLARAK GELMESİ GEREKİYOR … RAPOR FORMATI
   PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK ŞEKİLDE KONUŞMUŞTUK") — Bakanlığın zorunlu rapor formatlarının (kitaplıkta bakanlik: true —
   ZPKR01–05) her biri için firmada ekipman türü kendiliğinden kurulur:
   · tür: kitaplığın önerdiği ad / kod / grup / periyot (Ekipman türleri'nin kendi şemasından geçer) + kontrol metodu standartları
     (src/tanim/standartlar.ts);
   · rapor formatı: Bakanlığın resmî PDF'i (src/tanim/bakanlik/<form kodu>.pdf), sürüm 1;
   · rapor şablonu: kitaplıktaki şablondan, YAYINDA sürüm 1 — denetçi hemen rapor yazar.
   Firma sonra her şeyi değiştirir (ad, periyot, şablonu kopyalayıp düzenler, kendi PDF'ini yükler) ya da kullanılmamış türü siler; silinen tür
   yeniden kurulmaz. Kayıt firma ayarında ("kurulum": kurulan şablonlar) — kitaplığa yeni Bakanlık formatı girince yalnız o kurulur. Firma o kodu ya
   da o şablonu zaten kullanıyorsa (türü kendisi açmış) yeni tür açılmaz, şablon kurulmuş sayılır.
   Kim: sistem ("probata · hazır kurulum"), kendi işleminde ve hesapsız (yayınlayan hesap boş) — kişinin yetkisine bağlı değil; eylemden çağrılmaz.
   Aynı anda iki istek: firma başına danışma kilidi, ikincisi kayıtta görür ve bir şey yapmaz. Tetik: Ana sayfa ve Ekipman türleri açılınca (ilk
   açılışta kurulur; sonra yalnız ayar okunur, süreçte bellekte de tutulur). Kurulum düşerse sayfa düşmez (kayda yazılır, sonraki açılışta yeniden). */
import { SABLONLAR } from "../../../format/sablonlar.ts";
import { ayarOku, ayarYaz } from "../../../server/ayar/ayar.ts";
import { bakanlikBelgesiMi, bakanlikPdf } from "../../../server/bakanlik.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { formatStandartlari } from "../../../tanim/standartlar.ts";
import { hazirTurKur } from "../../ekipman-turleri/server/turler.ts";
import { hazirFormatYayinla, sablonKullaniliyor } from "./formatlar.ts";

export const KURULUM_KIM = "probata · hazır kurulum";
export const KURULUM_NOTU = "Bakanlık formatı";
/** kurulan şablonlar: kitaplıktaki Bakanlık formatları, kitaplık sırasıyla */
export const HAZIR_SABLONLAR: readonly string[] = Object.entries(SABLONLAR).filter(([, s]) => s.bakanlik).map(([k]) => k);

export interface KurulumSonucu { kurulan: number; atlanan: number }

/** firmanın işleminde: eksik Bakanlık türlerini kurar (yoksa hiçbir şey yazmaz) */
export async function bakanlikKurulumu(db: Sorgulayici, depo: Depo): Promise<KurulumSonucu> {
  const sonuc = { kurulan: 0, atlanan: 0 };
  const eksik = (k: { bakanlik: string[] }) => HAZIR_SABLONLAR.filter((s) => !k.bakanlik.includes(s));
  if (!eksik((await ayarOku(db, "kurulum")).deger).length) return sonuc;
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('probata.kurulum.' || gecerli_firma()::text))");
  const a = await ayarOku(db, "kurulum");   // kilitten SONRA yeniden: beklerken öteki istek kurmuş olabilir
  const kurulacak = eksik(a.deger);
  if (!kurulacak.length) return sonuc;
  const firmaId = (await db.sorgu<{ id: string }>("SELECT gecerli_firma()::text AS id")).rows[0].id;
  for (const k of kurulacak) {
    const s = SABLONLAR[k];
    const form = s.tanim.gorunum.formKodu;
    if (await sablonKullaniliyor(db, k)) { sonuc.atlanan++; continue; }
    const pdf = bakanlikBelgesiMi(form) ? { ad: `${form}.pdf`, bayt: await bakanlikPdf(form) } : null;
    const turId = await hazirTurKur(db, depo, firmaId, KURULUM_KIM, { ...s.tur, standartlar: formatStandartlari(form) }, pdf);
    if (!turId) { sonuc.atlanan++; continue; }
    await hazirFormatYayinla(db, KURULUM_KIM, turId, k, KURULUM_NOTU);
    sonuc.kurulan++;
  }
  const y = await ayarYaz(db, "kurulum", a.surum, { bakanlik: [...a.deger.bakanlik, ...kurulacak] }, { kim: KURULUM_KIM, ne: "firma_ayar.kurulum" });
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
