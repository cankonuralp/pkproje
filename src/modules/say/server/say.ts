/* S.A.Y SAHA ASİSTANI (380; maket say.js BB6, ARKA-UC §5.3 — reisim 2026-10-03: "bu say botu plan içinde değil her yer de gözükecek", "geçmiş silinmez
   geçmiş olayı önemli"). Her firma sayfasında sağ altta (müşteri paneli ve Yönetim'de yok); firma yapay zekâyı açtıysa görünür.
   · "Beni ne bekliyor?" ve "Bu sayfada ne yapılır?" KURALLA (yapay zekâ çağrısı yok, ücretsiz, anında): yan menü balonları (menuTakip — yetkiye
     duyarlı, kişinin kendi işi) ve sayfa yardımı (yardim.ts).
   · Serbest soru yapay zekâya (firmanın anahtarı ve model ayarı), fotoğraftan okumayla aynı iki adım: hazırlık (işlem içinde: açık mı, anahtar, sınır
     AYIRMA — satır kilidiyle, soru geçmişe) → çağrı (işlem DIŞINDA) → kayıt (cevap geçmişe, ayırma gerçek maliyetle kapanır). Bağlam yalnız rol adları,
     sayfa ve bekleyen iş sayıları — müşteri / kişi bilgisi gönderilmez (ARKA-UC §5.4).
   · Geçmiş kişinin hesabında, yalnız kendisi görür; "Sohbeti temizle" yalnız kendi geçmişini siler.
   · Öneri verir, kendisi yazmaz; imza / gönderme / onay / silme yolu yok (talimatta da yok). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirDurumu, sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ROL_ADI } from "../../../server/yetki/tanim.ts";
import { sinirli, yzAyi, yzAyir, yzAyirmaBirak, yzKendiAyi, yzMesajSay, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { SAY_GECMIS, sayEnCokMaliyet, sayIstegi, sayYanitiCoz, SORU_SINIRI } from "../../../server/yz/say.ts";
import { sohbetGecmisi, sohbetOneriDurumu, sohbetTemizle, sohbetYaz, type SohbetBekleyen, type SohbetEksik, type SohbetIletisi } from "../../../server/yz/sohbet.ts";
import { SONUC_AD } from "../../raporlar/sema.ts";
import type { Kisi } from "../../anasayfa/server/anasayfa.ts";
import { menuTakip } from "../../anasayfa/server/takip.ts";
import { MODULLER } from "../../moduller.ts";
import { SAY_KILAVUZU, sayfaBilgisi } from "../yardim.ts";

export interface SayDurum { acik: boolean; anahtar: boolean; sinirDoldu: boolean }
export type SayYaniti = { durum: "tamam"; iletiler: SohbetIletisi[] } | { durum: "red"; neden: string };
export type SayHizli = "bekleyen" | "sayfa";
export const HIZLI_SORU: Readonly<Record<SayHizli, string>> = { bekleyen: "Beni ne bekliyor?", sayfa: "Bu sayfada ne yapılır?" };

const KAPALI = "S.A.Y firmada kapalı (Firma ayarları › Yapay zekâ).";
const ANAHTARSIZ = "API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.";

/** düğme ve panel için: firmada açık mı, anahtar var mı, kişinin bu ayki sınırı doldu mu */
export async function sayDurumu(db: Sorgulayici, simdi = new Date()): Promise<SayDurum> {
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { acik: false, anahtar: false, sinirDoldu: false };
  const anahtar = (await sirDurumu(db, "yapay_zeka_anahtari")).tanimli;
  const sinirDoldu = sinirli(yz.sinir) && (await yzKendiAyi(db, yzAyi(simdi))) >= yz.sinir * 1e6;
  return { acik: true, anahtar, sinirDoldu };
}

/** kişinin geçmişi (yalnız kendisi — RLS); S.A.Y kapalıysa boş */
export async function sayGecmisi(db: Sorgulayici): Promise<SohbetIletisi[]> {
  return (await ayarOku(db, "yapay_zeka")).deger.acik ? sohbetGecmisi(db) : [];
}

/** yan menü balonlarından bekleyenler: modül adı, adresi ve sayılar (kişi / müşteri bilgisi yok) */
async function bekleyenler(db: Sorgulayici, kim: Kisi): Promise<SohbetBekleyen[]> {
  const t = await menuTakip(db, kim);
  return MODULLER.filter((m) => t[m.no]).map((m) => ({
    ad: m.ad, href: `/${m.yol}`, kirmizi: t[m.no].kirmizi, sari: t[m.no].sari, kirmiziAd: t[m.no].ad.kirmizi, sariAd: t[m.no].ad.sari,
  }));
}

/** açık mı + anahtar var mı (kural ve yapay zekâ cevabı için aynı kapı) */
async function kapi(db: Sorgulayici): Promise<{ durum: "red"; neden: string } | { model: YzModel; sinir: number | null }> {
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: KAPALI };
  if (!(await sirDurumu(db, "yapay_zeka_anahtari")).tanimli) return { durum: "red", neden: ANAHTARSIZ };
  return { model: yz.model, sinir: yz.sinir };
}

/** hızlı soru — kuralla cevaplanır (ücretsiz): soru ve cevap geçmişe, kişinin mesaj sayısı artar */
export async function sayHizli(db: Sorgulayici, kim: Kisi, hizli: SayHizli, yol: string, simdi = new Date()): Promise<SayYaniti> {
  const k = await kapi(db);
  if ("durum" in k) return k;
  const s = sayfaBilgisi(yol);
  let metin: string, ek = null;
  if (hizli === "sayfa") metin = s.yardim ?? "Bu sayfada size uygulamanın kılavuzuna göre yol gösterebilirim; sorunuzu yazın.";
  else {
    const l = await bekleyenler(db, kim);
    metin = l.length ? "Sizi bekleyenler:" : "Şu an sizi bekleyen iş yok.";
    ek = l.length ? { bekleyen: l } : null;
  }
  await sohbetYaz(db, { kim: "ben", metin: HIZLI_SORU[hizli], yer: s.yer });
  await sohbetYaz(db, { kim: "say", metin, yer: s.yer, ek });
  await yzMesajSay(db, yzAyi(simdi));
  return { durum: "tamam", iletiler: await sohbetGecmisi(db, 2) };
}

/* ── rapor ekranı (382; maket say.js HIZLI "Eksik alanlar neler?", "Sonuç ne olmalı?") ──
   Cevap açık raporun CANLI hâlinden (kaydedilmemiş değişiklikler dahil) — ekran yapıyı gönderir, METNİ sunucu kurar (istemci S.A.Y adına metin
   yazamaz); geçmiş kişinin kendisinin. Öneri yalnız o rapor açıkken uygulanır (denetçinin seçimiyle aynı yoldan; Kaydet'le yazılır). */
export type SayRaporHizli = "eksik" | "sonuc";
export const RAPOR_HIZLI_SORU: Readonly<Record<SayRaporHizli, string>> = { eksik: "Eksik alanlar neler?", sonuc: "Sonuç ne olmalı?" };
export interface SayRaporGirdisi {
  hizli: SayRaporHizli;
  rapor: { id: string; no: string };
  eksik?: SohbetEksik[];
  sonuc?: { var: boolean; oneri: "uygun" | "uygun_degil"; secili: "" | "uygun" | "uygun_degil"; kusur: number };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RAPOR_NO = /^[\p{L}\p{N}-]{3,40}$/u;
const metinMi = (x: unknown, en: number): x is string => typeof x === "string" && x.length >= 1 && x.length <= en;
const sonucMu = (x: unknown): x is "uygun" | "uygun_degil" => x === "uygun" || x === "uygun_degil";

/** ekrandan gelen yapının denetimi (alan sayıları ve uzunlukları sınırlı; serbest metin yok) */
export function raporGirdisi(g: unknown): SayRaporGirdisi | null {
  const x = (g ?? {}) as Record<string, unknown>;
  const r = (x.rapor ?? {}) as Record<string, unknown>;
  if ((x.hizli !== "eksik" && x.hizli !== "sonuc") || typeof r.id !== "string" || !UUID.test(r.id) || typeof r.no !== "string" || !RAPOR_NO.test(r.no)) return null;
  const rapor = { id: r.id, no: r.no };
  if (x.hizli === "eksik") {
    if (!Array.isArray(x.eksik) || x.eksik.length > 60) return null;
    const eksik: SohbetEksik[] = [];
    for (const e of x.eksik as Record<string, unknown>[]) {
      if (!e || !metinMi(e.ad, 300) || !metinMi(e.bolumAd, 120) || !metinMi(e.bolum, 60) || !metinMi(e.alan, 120) || !/^[A-Za-z0-9._#-]+$/.test(e.alan) || !/^[A-Za-z0-9_-]+$/.test(e.bolum)) return null;
      eksik.push({ ad: e.ad, bolumAd: e.bolumAd, bolum: e.bolum, alan: e.alan });
    }
    return { hizli: "eksik", rapor, eksik };
  }
  const s = (x.sonuc ?? {}) as Record<string, unknown>;
  if (typeof s.var !== "boolean" || !sonucMu(s.oneri) || (s.secili !== "" && !sonucMu(s.secili)) || !Number.isInteger(s.kusur) || (s.kusur as number) < 0 || (s.kusur as number) > 999) return null;
  return { hizli: "sonuc", rapor, sonuc: { var: s.var, oneri: s.oneri, secili: s.secili as "" | "uygun" | "uygun_degil", kusur: s.kusur as number } };
}

/** rapor ekranının hızlı sorusu — kuralla (ücretsiz), metni sunucu kurar; soru ve cevap geçmişe ("Rapor <no>"), mesaj sayılır */
export async function sayRaporCevabi(db: Sorgulayici, girdi: unknown, simdi = new Date()): Promise<SayYaniti> {
  const g = raporGirdisi(girdi);
  if (!g) return { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." };
  const k = await kapi(db);
  if ("durum" in k) return k;
  const yer = `Rapor ${g.rapor.no}`;
  let metin: string, ek: Record<string, unknown> = { rapor: g.rapor.id };
  if (g.hizli === "eksik") {
    const l = g.eksik ?? [];
    metin = l.length ? `${l.length} zorunlu alan boş:` : "Zorunlu alanların hepsi dolu; raporu onaya gönderebilirsiniz.";
    if (l.length) ek = { ...ek, eksik: l };
  } else {
    const s = g.sonuc!;
    if (!s.var) metin = "Bu raporun formatında sonuç alanı yok.";
    else {
      const neden = s.kusur ? `${s.kusur} kusur var (“Uygun değil” madde ya da sınır dışı değer).`
        : s.oneri === "uygun_degil" ? "Ölçüm ya da test sonuçlarında sınır dışı değer var." : "“Uygun değil” madde ve sınır dışı değer yok.";
      if (s.secili === s.oneri) metin = `${neden} Seçtiğiniz sonuç (${SONUC_AD[s.oneri]}) kriterlerle uyumlu.`;
      else {
        metin = `${neden} Önerim:`;
        ek = { ...ek, oneri: { alan: "sonuc", deger: s.oneri, ad: `Sonuç ve kanaat → ${SONUC_AD[s.oneri]}`, durum: "" } };
      }
    }
  }
  await sohbetYaz(db, { kim: "ben", metin: RAPOR_HIZLI_SORU[g.hizli], yer, ek: { rapor: g.rapor.id } });
  await sohbetYaz(db, { kim: "say", metin, yer, ek });
  await yzMesajSay(db, yzAyi(simdi));
  return { durum: "tamam", iletiler: await sohbetGecmisi(db, 2) };
}

/** öneri kartı: "Uygula" (rapora ekranda uygulandı) ya da "Vazgeç" — kişinin kendi iletisinde, bir kez */
export async function sayOneri(db: Sorgulayici, id: string, durum: "uygulandi" | "vazgecildi"): Promise<boolean> {
  return UUID.test(id) && sohbetOneriDurumu(db, id, durum);
}

export interface SaySorHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; yer: string }

/** serbest soru, adım 1 (işlem içinde): kapı, soru, ayırma (sınır doluysa soru yazılmaz), soru geçmişe, istek gövdesi */
export async function saySorHazirla(db: Sorgulayici, kim: Kisi, soru: string, yol: string, simdi = new Date(), raporNo: string | null = null): Promise<SaySorHazir | { durum: "red"; neden: string }> {
  const metin = soru.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (!metin) return { durum: "red", neden: "Sorunuzu yazın." };
  if (metin.length > SORU_SINIRI) return { durum: "red", neden: `Soru en çok ${SORU_SINIRI} karakter.` };
  const k = await kapi(db);
  if ("durum" in k) return k;
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: ANAHTARSIZ };
  const sayfa = sayfaBilgisi(yol);
  /* rapor ekranında yer "Rapor <no>" (382; numara biçimi denetli — yalnız kişinin kendi geçmişinde etiket) */
  const s = raporNo && RAPOR_NO.test(raporNo) && sayfa.modul === 14 ? { ...sayfa, yer: `Rapor ${raporNo}` } : sayfa;
  const gecmis = (await sohbetGecmisi(db, SAY_GECMIS)).map((m) => ({ kim: m.kim, metin: m.metin }));
  const bekleyen = (await bekleyenler(db, kim)).map((b) => `${b.ad}: ${[b.kirmizi ? `${b.kirmizi} ${b.kirmiziAd}` : "", b.sari ? `${b.sari} ${b.sariAd}` : ""].filter(Boolean).join(", ")}`);
  const ay = yzAyi(simdi), ust = sayEnCokMaliyet(k.model);
  if (!(await yzAyir(db, ay, k.sinir, ust))) {
    return { durum: "red", neden: "Bu ay yapay zekâ sınırınız doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. Hızlı sorular çalışır." };
  }
  await sohbetYaz(db, { kim: "ben", metin, yer: s.yer });
  const istek = sayIstegi({ model: k.model, kilavuz: SAY_KILAVUZU, baglam: { roller: kim.roller.map((r) => ROL_ADI[r]), yer: s.yer, yardim: s.yardim, bekleyen }, gecmis, soru: metin });
  return { durum: "hazir", istek, anahtar, model: k.model, ay, ust, yer: s.yer };
}

/** serbest soru, adım 2 (kendi işleminde): cevap geçmişe; ayırma gerçek maliyetle kapanır, mesaj sayılır */
export async function saySorKaydet(db: Sorgulayici, h: Pick<SaySorHazir, "model" | "ay" | "ust" | "yer">, govde: unknown): Promise<SayYaniti> {
  const c = sayYanitiCoz(govde);
  await yzSohbetKapat(db, { ay: h.ay, ust: h.ust, maliyet: maliyetHesapla(h.model, c.giris, c.cikis) });
  const metin = c.durum === "ret" ? "Bu soruya cevap veremiyorum."
    : !c.metin ? "Cevap boş geldi; sorunuzu başka türlü yazmayı deneyin."
    : c.durum === "kesik" ? `${c.metin} …\n(Cevap yarım kaldı; daha dar bir soru sorun.)` : c.metin;
  await sohbetYaz(db, { kim: "say", metin, yer: h.yer });
  return { durum: "tamam", iletiler: await sohbetGecmisi(db, 2) };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa (zaman aşımı) harcamaya ve mesaja yazılır. Soru geçmişte kalır. */
export async function sayBirak(db: Sorgulayici, h: Pick<SaySorHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor", "mesaj");
}

/** "Sohbeti temizle": yalnız oturumdaki kişinin geçmişi */
export async function sayTemizle(db: Sorgulayici): Promise<number> {
  return sohbetTemizle(db);
}
