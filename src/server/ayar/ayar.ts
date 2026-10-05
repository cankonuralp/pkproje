/* FİRMA AYARLARI (KOD-GECIS §7; maket firma-ayarlari) — bölüm başına biçim ve BAŞLANGIÇ DEĞERİ burada, tek kaynak. Okuma: kayıtlı değer başlangıçla
   birleşir ve şemadan geçer (bozuk / eski kayıt uygulamayı düşürmez, başlangıç değerine döner). Yazma: güvenli yazıcı (sürüm kilidi, yalnız değişen,
   denetim izi). Yetki (Firma ayarları modülü, canDo 22) çağıran eylemde. Bölümler modüllerle büyür; sırlar ayrı (sir.ts). */
import { z } from "../../sema/ortak.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../db/yazici.ts";
import { DUZEYLER } from "../yetki/tanim.ts";

const onek = z.string().regex(/^[A-Z]{1,4}$/, "Önek: 1–4 büyük harf");
const gun = (en: number, cok: number) => z.number().int().min(en).max(cok);
/** varsayılan tarafsızlık beyanı (maket planlarim BEYAN; TS EN ISO/IEC 17020) */
export const VARSAYILAN_BEYAN = "Bu planı TS EN ISO/IEC 17020 kurallarına uygun, bağımsız ve tarafsız yürüteceğimi; muayene edilen kuruluşla tarafsızlığımı " +
  "etkileyecek ticari, mali ya da kişisel bir ilişkim ve çıkar çatışmam olmadığını; sonuçları yalnız teknik bulgulara dayanarak doğru ve eksiksiz " +
  "raporlayacağımı beyan ederim.";

export const AYAR_BOLUMLERI = {
  /** Firma bilgileri: belge nüshası (2) */
  firma_bilgileri: z.object({ nusha: gun(1, 5).default(2) }),
  /** İmza yöntemi (mobil / e-imza) */
  imza: z.object({ yontem: z.enum(["mobil", "e_imza"]).default("mobil") }),
  /** Mesai takibi (212, AA2): normal 480 dk, mesai 180 dk, yıllık fazla çalışma ≤ 270 saat, günlük ≤ 660 dk */
  mesai: z.object({
    acik: z.boolean().default(false),
    normal_dk: gun(60, 660).default(480),
    mesai_dk: gun(0, 600).default(180),
    yillik_fazla_saat: gun(0, 270).default(270),
    gunluk_ust_dk: gun(60, 660).default(660),
  }),
  /** Uyarı eşikleri (gün) */
  uyari_esikleri: z.object({
    kalibrasyon: gun(1, 365).default(30),
    kontrolu_yaklasan_tesis: gun(1, 365).default(30),
    plan_kontrolu_geliyor: gun(1, 365).default(30),
    egitim: gun(1, 365).default(60),
  }),
  /** Numara önekleri (§3.7 satır 8; rapor numarasının firma kodu firma kaydında) */
  numara: z.object({ proje: onek.default("P"), teklif: onek.default("T"), sozlesme: onek.default("IS"), gider: onek.default("G"), izin: onek.default("I") }),
  /** Saklama süresi (ENGEL 11): en az 5 yıl, firma 6–20'ye uzatabilir */
  saklama: z.object({ yil: gun(5, 20).default(5) }),
  /** Yapay zekâ (aç / kapa, kişi başı aylık sınır); API anahtarı sırlarda */
  yapay_zeka: z.object({ acik: z.boolean().default(false), kisi_aylik_sinir: gun(0, 100000).default(200) }),
  /** Tarafsızlık ve çıkar çatışması beyanı (§3.7 satır 3; karar 26): kalite el kitabındaki metin; boşsa varsayılan. Kabul anındaki metin plana yazılır */
  beyan: z.object({ metin: z.string().trim().min(20).max(4000).default(VARSAYILAN_BEYAN) }),
  /** Müşteriye açık personel belgeleri (323; maket firma-ayarlari "Müşteriye açık personel belgeleri", P3): müşteri panelinin "Muayene personeli"
      sekmesinde görünen türler — özlük türleri, eğitim sertifikaları (hepsi ya da seçili türler), ekipman atama belgesi. Başlangıç: EKİPNET +
      bütün eğitim sertifikaları (veritabanı işlevi musteri_personel_belgeleri ayar yokken aynısını uygular — 0035, kilit testi) */
  musteri_belge: z.object({
    ozluk: z.array(z.string().regex(/^[a-z0-9]{2,12}$/)).max(30).default(["ekipnet"]),
    egitim: z.union([z.literal("hepsi"), z.array(z.string().regex(/^[0-9a-f-]{36}$/)).max(100)]).default("hepsi"),
    atama: z.boolean().default(false),
  }),
  /** Rol yetkileri (Personel › Rol yetkileri; reisim 32): modül → rol sırasıyla 6 düzey. Boş = önerilen düzen. Okuma / yazma src/server/yetki/matris.ts */
  rol_yetki: z.object({ matris: z.record(z.string().regex(/^(\d{1,2}|hareket)$/), z.array(z.enum(DUZEYLER)).length(6)).default({}) }),
} as const;
export type AyarBolumu = keyof typeof AYAR_BOLUMLERI;
export type Ayar<B extends AyarBolumu> = z.infer<(typeof AYAR_BOLUMLERI)[B]>;

const FIRMA_AYAR = tablo({ ad: "firma_ayar", sutunlar: ["bolum", "deger"] });

/** başlangıç değeri (hiç kaydedilmemiş bölüm) */
export const baslangic = <B extends AyarBolumu>(b: B): Ayar<B> => AYAR_BOLUMLERI[b].parse({}) as Ayar<B>;

/** bölümü okur: kayıtlıyla başlangıç birleşir; şemaya uymayan alan başlangıç değerine döner. surum: kaydedilmemişse -1 */
export async function ayarOku<B extends AyarBolumu>(db: Sorgulayici, b: B): Promise<{ deger: Ayar<B>; surum: number; id: string | null }> {
  if (!Object.hasOwn(AYAR_BOLUMLERI, b)) throw new Error("Bilinmeyen ayar bölümü");
  const r = (await db.sorgu<{ id: string; deger: Record<string, unknown>; surum: number }>("SELECT id::text, deger, surum FROM firma_ayar WHERE bolum = $1", [b])).rows[0];
  const sema = AYAR_BOLUMLERI[b];
  const kayitli = r?.deger ?? {};
  const tam = sema.safeParse(kayitli);
  if (tam.success) return { deger: tam.data as Ayar<B>, surum: r?.surum ?? -1, id: r?.id ?? null };
  /* alan alan kurtar: geçerli alan kalır, bozuk alan başlangıca döner */
  const bas = baslangic(b) as Record<string, unknown>;
  const kurtarilan = Object.fromEntries(Object.keys(bas).map((k) => {
    const deneme = sema.safeParse({ ...bas, [k]: kayitli[k] });
    return [k, deneme.success ? (deneme.data as Record<string, unknown>)[k] : bas[k]];
  }));
  return { deger: kurtarilan as Ayar<B>, surum: r?.surum ?? -1, id: r?.id ?? null };
}

export type AyarYazSonucu = GuncelleSonucu | { durum: "gecersiz"; hatalar: Record<string, string> };

/** bölümü yazar: istemcinin gördüğü sürümle (kaydedilmemişse -1); şemadan geçmeyen değer yazılmaz */
export async function ayarYaz<B extends AyarBolumu>(db: Sorgulayici, b: B, surum: number, yeni: unknown, iz: Iz): Promise<AyarYazSonucu> {
  if (!Object.hasOwn(AYAR_BOLUMLERI, b)) throw new Error("Bilinmeyen ayar bölümü");
  const s = AYAR_BOLUMLERI[b].safeParse(yeni);
  if (!s.success) return { durum: "gecersiz", hatalar: Object.fromEntries(s.error.issues.map((i) => [i.path.join("."), i.message])) };
  const mevcut = await ayarOku(db, b);
  if (mevcut.id === null) {
    if (surum !== -1) return { durum: "cakisma", guncelSurum: -1 };
    try {
      const { surum: yeniSurum } = await ekle(db, FIRMA_AYAR, { bolum: b, deger: s.data }, iz);
      return { durum: "tamam", surum: yeniSurum, degisen: ["deger"] };
    } catch (h) {
      /* aynı anda ilk kez kaydeden ikinci kişi: benzersizlik → çakışma (sessiz ezme yok) */
      if ((h as { code?: string }).code === "23505") return { durum: "cakisma", guncelSurum: 0 };
      throw h;
    }
  }
  if (surum < 0) return { durum: "cakisma", guncelSurum: mevcut.surum };   // ekran "hiç kaydedilmemiş" gördü, bu arada başkası kaydetti
  return guncelle(db, FIRMA_AYAR, mevcut.id, surum, { deger: s.data }, iz);
}

/** belgenin sahibi muayene firması: adı ve rapor kodu (kiracının kendi satırı; RLS firma_kendi) — rapor belgesinin başlığı ve form kodu */
export async function firmaKunyesi(db: Sorgulayici): Promise<{ ad: string; kod: string }> {
  return (await db.sorgu<{ ad: string; kod: string }>("SELECT ad, rapor_kodu AS kod FROM firma")).rows[0] ?? { ad: "-", kod: "XX" };
}
