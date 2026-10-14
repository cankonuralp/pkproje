/* S.A.Y SAHA ASİSTANI (380; maket say.js BB6, ARKA-UC §5.3 — reisim 2026-10-03: "bu say botu plan içinde değil her yer de gözükecek", "geçmiş silinmez
   geçmiş olayı önemli"). Her firma sayfasında sağ altta (müşteri paneli ve Yönetim'de yok); firma yapay zekâyı açtıysa görünür.
   · 550 (sunum 546 — reisim 2026-10-14: "S.A.Y asistanda öneri soruları olarak sadece fotoğrafları oku ve gir kalsın başka bir şey olmasın"):
     "Beni ne bekliyor?", "Bu sayfada ne yapılır?", "Eksik alanlar neler?", "Sonuç ne olmalı?" kuralla cevapları KALKTI — hepsi serbest soru
     (Haiku; bağlamda bekleyen iş sayıları ve rapor haritası var).
   · Serbest soru yapay zekâya (firmanın anahtarı ve model ayarı), fotoğraftan okumayla aynı iki adım: hazırlık (işlem içinde: açık mı, anahtar, sınır
     AYIRMA — satır kilidiyle, soru geçmişe) → çağrı (işlem DIŞINDA) → kayıt (cevap geçmişe, ayırma gerçek maliyetle kapanır). Bağlam yalnız rol adları,
     sayfa ve bekleyen iş sayıları — müşteri / kişi bilgisi gönderilmez (ARKA-UC §5.4).
   · Geçmiş kişinin hesabında, yalnız kendisi görür; "Sohbeti temizle" yalnız kendi geçmişini siler.
   · 550: rapordayken Haiku rapora "rapora_yaz" / "fotograflari_oku" / "geri_al" araçlarıyla girer — işi EKRAN yapar (raporlar/say-doldur.ts),
     sunucu yalnız komutları biçimiyle döner; imza / gönderme / onay / silme yolu yok. Kurallarımız kalktı (src/server/yz/say.ts).
   · 522: serbest soruya fotoğraf / PDF / Word eki (server/ek.ts — tür içerikten, adet ve toplam boy sınırlı); ek yalnız o soruda gider, saklanmaz;
     geçmişte sorunun yanında adı, türü, boyu kalır; ayırma ek sayısıyla büyür. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirDurumu, sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ROL_ADI } from "../../../server/yetki/tanim.ts";
import { sinirli, yzAyi, yzAyir, yzAyirmaBirak, yzKendiAyi, yzMesajSay, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { ARAMA_MALIYETI, SAY_GECMIS, sayEnCokMaliyet, sayIstegi, sayYanitiCoz, SORU_SINIRI, type SayKomutu } from "../../../server/yz/say.ts";
import type { SayEkDosyasi } from "./ek.ts";
import { sohbetGecmisi, sohbetOneriDurumu, sohbetTemizle, sohbetYaz, type SohbetBekleyen, type SohbetIletisi } from "../../../server/yz/sohbet.ts";
import { raporSayBilgisi } from "../../raporlar/server/say-baglanti.ts";
import { raporHaritasi } from "../rapor-haritasi.ts";
import { FormatTanimi } from "../../../format/tanim.ts";
import { FORMAT_ARACI, formatHaritasi } from "../../rapor-format/say-kurucu.ts";
import { formatAyrintisi, formatDegistirir } from "../../rapor-format/server/formatlar.ts";
import type { Kisi } from "../../anasayfa/server/anasayfa.ts";
import { menuTakip } from "../../anasayfa/server/takip.ts";
import { MODULLER } from "../../moduller.ts";
import { SAY_KILAVUZU, sayfaBilgisi } from "../yardim.ts";

export interface SayDurum { acik: boolean; anahtar: boolean; sinirDoldu: boolean }
/** 550: komutlar — S.A.Y'ın rapora yapmak istediği iş (ekran uygular) */
export type SayYaniti = { durum: "tamam"; iletiler: SohbetIletisi[]; komutlar?: SayKomutu[] } | { durum: "red"; neden: string };

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

/* ── rapor ekranı (382 → 550): "Eksik alanlar neler?" / "Sonuç ne olmalı?" kuralla cevapları kalktı (serbest soru); kalan: ekranın yaptığı işin
   (fotoğrafları oku ve gir, geri al, dolu alanları da değiştir) S.A.Y cevabı — METNİ sunucu kurar (istemci S.A.Y adına metin yazamaz). Eski
   iletilerdeki öneri kartı (sonuç) o rapor açıkken uygulanır. */
/* 542 (sunum 541 onaylı — reisim 2026-10-14: "say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap diyeceğim ve yapacak"): S.A.Y
   RAPORA GİRER — iş rapor ekranında (raporlar/say-doldur.ts: okunmamış fotoğrafları okur, boş alanlara girer; maddeler; sonuç; geri al); ekran
   yalnız SAYILARI ve formatın adlarını gönderir, S.A.Y'ın cevabını sunucu kurar (istemci S.A.Y adına serbest metin yazamaz). Kuralla, ücretsiz. */
/* 550: "maddeler" / "sonuc" komutları kalktı — Haiku rapora_yaz aracıyla girer */
export const SAY_ISLEMLERI = ["oku", "ustune", "geri"] as const;
export type SayIslemi = (typeof SAY_ISLEMLERI)[number];
export interface SayOkumaGirdisi {
  okunan: number; okunamayan: number; neden: string | null;
  bolumler: { ad: string; alan: number; satir: number; belirsiz: number }[];
  dolu: string[];
}
export interface SayIslemGirdisi { istek: SayIslemi; soru: string; sayi: number; okuma?: SayOkumaGirdisi }
export interface SayRaporGirdisi { hizli: "islem"; rapor: { id: string; no: string }; islem: SayIslemGirdisi }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RAPOR_NO = /^[\p{L}\p{N}-]{3,40}$/u;
const metinMi = (x: unknown, en: number): x is string => typeof x === "string" && x.length >= 1 && x.length <= en;
const sayiMi = (x: unknown, en = 9999): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= en;

/** 542: ekranın yaptığı işin sayıları (serbest metin yalnız kişinin kendi sorusu ve formatın adları; uzunluklar sınırlı) */
function islemGirdisi(g: unknown): SayIslemGirdisi | null {
  const x = (g ?? {}) as Record<string, unknown>;
  if (!SAY_ISLEMLERI.includes(x.istek as SayIslemi) || !metinMi(x.soru, 300) || !sayiMi(x.sayi)) return null;
  const islem: SayIslemGirdisi = { istek: x.istek as SayIslemi, soru: x.soru, sayi: x.sayi };
  if (x.istek !== "oku") return x.okuma === undefined ? islem : null;
  const o = (x.okuma ?? null) as Record<string, unknown> | null;
  if (!o || !sayiMi(o.okunan, 100) || !sayiMi(o.okunamayan, 100) || (o.neden !== null && !metinMi(o.neden, 300))
    || !Array.isArray(o.bolumler) || o.bolumler.length > 40 || !Array.isArray(o.dolu) || o.dolu.length > 60) return null;
  const bolumler: SayOkumaGirdisi["bolumler"] = [];
  for (const b of o.bolumler as Record<string, unknown>[]) {
    if (!b || !metinMi(b.ad, 120) || !sayiMi(b.alan, 999) || !sayiMi(b.satir, 999) || !sayiMi(b.belirsiz, 999)) return null;
    bolumler.push({ ad: b.ad, alan: b.alan, satir: b.satir, belirsiz: b.belirsiz });
  }
  const dolu: string[] = [];
  for (const d of o.dolu) { if (!metinMi(d, 120)) return null; dolu.push(d); }
  return { ...islem, okuma: { okunan: o.okunan, okunamayan: o.okunamayan, neden: o.neden as string | null, bolumler, dolu } };
}

/** 542: S.A.Y'ın kısa cevabı — ne yaptı (sayılarla), ne yapamadı; dolu alan varsa sorar ("Dolu alanları da değiştir" tuşu ekranda) */
export function islemMetni(i: SayIslemGirdisi): string {
  const kaydet = "Kaydetmeyi unutmayın.";
  switch (i.istek) {
    case "oku": {
      const o = i.okuma!;
      if (!o.okunan && !o.okunamayan) return "Okunacak fotoğraf yok: bölümün başlığındaki “Fotoğraf ekle” ile ekleyin, sonra “Fotoğrafları oku ve gir” deyin.";
      const l: string[] = [];
      if (o.okunan) l.push(`${o.okunan} fotoğrafı okudum.`);
      for (const b of o.bolumler) {
        const n = [b.alan ? `${b.alan} alan` : "", b.satir ? `${b.satir} satır` : ""].filter(Boolean).join(", ");
        l.push(`- ${b.ad}: ${n || "boş alana girecek değer çıkmadı"}${b.belirsiz ? ` (${b.belirsiz} değerden emin değilim, sarı)` : ""}`);
      }
      if (o.dolu.length) l.push(`Dolu olduğu için değiştirmediğim: ${o.dolu.slice(0, 8).join(", ")}${o.dolu.length > 8 ? ` ve ${o.dolu.length - 8} alan daha` : ""}. Değiştireyim mi?`);
      if (o.okunamayan) l.push(`${o.okunamayan} fotoğraf okunamadı${o.neden ? `: ${o.neden}` : "."}`);
      if (o.bolumler.some((b) => b.alan || b.satir)) l.push(kaydet);
      return l.join("\n");
    }
    case "ustune": return i.sayi ? `${i.sayi} dolu alanı okunan değerle değiştirdim. ${kaydet}` : "Değiştirilecek dolu alan kalmadı.";
    default: return i.sayi ? `${i.sayi} girişi geri aldım.` : "Geri alınacak giriş kalmadı (değerler sonradan değişmiş).";
  }
}

/** ekrandan gelen yapının denetimi (alan sayıları ve uzunlukları sınırlı; serbest metin yalnız kişinin sorusu ve formatın adları) */
export function raporGirdisi(g: unknown): SayRaporGirdisi | null {
  const x = (g ?? {}) as Record<string, unknown>;
  const r = (x.rapor ?? {}) as Record<string, unknown>;
  if (x.hizli !== "islem" || typeof r.id !== "string" || !UUID.test(r.id) || typeof r.no !== "string" || !RAPOR_NO.test(r.no)) return null;
  const islem = islemGirdisi(x.islem);
  return islem ? { hizli: "islem", rapor: { id: r.id, no: r.no }, islem } : null;
}

/** rapor ekranının yaptığı işin cevabı — kuralla (ücretsiz), metni sunucu kurar; soru ve cevap geçmişe ("Rapor <no>"), mesaj sayılır */
export async function sayRaporCevabi(db: Sorgulayici, girdi: unknown, simdi = new Date()): Promise<SayYaniti> {
  const g = raporGirdisi(girdi);
  if (!g) return { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." };
  const k = await kapi(db);
  if ("durum" in k) return k;
  const yer = `Rapor ${g.rapor.no}`, i = g.islem;
  await sohbetYaz(db, { kim: "ben", metin: i.soru, yer, ek: { rapor: g.rapor.id } });
  await sohbetYaz(db, { kim: "say", metin: islemMetni(i), yer, ek: { rapor: g.rapor.id, islem: { istek: i.istek, dolu: i.okuma?.dolu.length ?? 0 } } });
  await yzMesajSay(db, yzAyi(simdi));
  return { durum: "tamam", iletiler: await sohbetGecmisi(db, 2) };
}

/** öneri kartı: "Uygula" (rapora ekranda uygulandı) ya da "Vazgeç" — kişinin kendi iletisinde, bir kez */
export async function sayOneri(db: Sorgulayici, id: string, durum: "uygulandi" | "vazgecildi"): Promise<boolean> {
  return UUID.test(id) && sohbetOneriDurumu(db, id, durum);
}

export interface SaySorHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; yer: string; rapor: string | null;
  /** 553: harita gönderilen format taslağı (komut yalnız o zaman döner) */
  format?: string | null }

/** serbest soru, adım 1 (işlem içinde): kapı, soru, ayırma (sınır doluysa soru yazılmaz), soru geçmişe, istek gövdesi */
export async function saySorHazirla(db: Sorgulayici, kim: Kisi, soru: string, yol: string, simdi = new Date(), raporNo: string | null = null,
  canli: { id: string; cevaplar: unknown; ekipman?: unknown } | null = null, ekler: readonly SayEkDosyasi[] = [],
  kurucu: { id: string; tanim: unknown } | null = null): Promise<SaySorHazir | { durum: "red"; neden: string }> {
  /* 522: yalnız ek gönderildiyse soru kendiliğinden ("Eki inceler misin?") */
  const metin = soru.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim() || (ekler.length ? (ekler.length === 1 ? "Eki inceler misin?" : "Ekleri inceler misin?") : "");
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
  const ay = yzAyi(simdi), ust = sayEnCokMaliyet(k.model, ekler.length);
  if (!(await yzAyir(db, ay, k.sinir, ust))) {
    return { durum: "red", neden: "Bu ay yapay zekâ sınırınız doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. Hızlı sorular çalışır." };
  }
  /* 384 → 550: rapor sayfasında açık raporun HARİTASI (yer kimlikleri ve şu anki değerler; künye yok) — yalnız adres o raporsa ve kişi raporu
     yazan, rapor Yeni (raporlar/server/say-baglanti.ts); harita varsa rapora yazma araçları da gider */
  let rapor: string | null = null;
  if (canli && UUID.test(canli.id) && sayfa.modul === 14 && yol.split(/[?#]/)[0] === `/raporlar/${canli.id}`) {
    const b = await raporSayBilgisi(db, kim, canli.id);
    rapor = b ? raporHaritasi(b.tanim, b.turAd, { cevaplar: canli.cevaplar, ekipman: canli.ekipman ?? {} }) : null;
  }
  /* 553: format yapıcıda açık TASLAĞIN haritası — yalnız adres o taslağın kurucusuysa, kişi formatı değiştirebiliyorsa, taslak bu firmanınsa ve
     ekranın gönderdiği tanım şemaya uyuyorsa; harita varsa formati_duzenle aracı gider (değişikliği ekran yapar, Kaydet kişide) */
  let format: string | null = null;
  const kurucuYolu = /^\/ekipman-turleri\/[0-9a-f-]{36}\/sablon\/([0-9a-f-]{36})\/kurucu$/.exec(yol.split(/[?#]/)[0]);
  if (kurucu && UUID.test(kurucu.id) && kurucuYolu?.[1] === kurucu.id && formatDegistirir(kim)) {
    const f = await formatAyrintisi(db, kim, kurucu.id), g = FormatTanimi.safeParse(kurucu.tanim);
    if (f && f.durum === "taslak" && g.success) format = formatHaritasi(g.data);
  }
  const raporEki = rapor && canli ? { rapor: canli.id } : {};
  await sohbetYaz(db, { kim: "ben", metin, yer: s.yer, ek: ekler.length || rapor ? { ...raporEki, ...(ekler.length ? { ekler: ekler.map((e) => e.ad) } : {}) } : null });
  const istek = sayIstegi({ model: k.model, kilavuz: SAY_KILAVUZU, baglam: { roller: kim.roller.map((r) => ROL_ADI[r]), yer: s.yer, yardim: s.yardim, bekleyen, rapor, format },
    gecmis, soru: metin, ekler: ekler.map((e) => e.icerik), formatAraci: [FORMAT_ARACI] });
  return { durum: "hazir", istek, anahtar, model: k.model, ay, ust, yer: s.yer, rapor: rapor && canli ? canli.id : null, format: format && kurucu ? kurucu.id : null };
}

/** serbest soru, adım 2 (kendi işleminde): cevap geçmişe; ayırma gerçek maliyetle kapanır, mesaj sayılır */
export async function saySorKaydet(db: Sorgulayici, h: Pick<SaySorHazir, "model" | "ay" | "ust" | "yer"> & { rapor?: string | null; format?: string | null }, govde: unknown): Promise<SayYaniti> {
  const c = sayYanitiCoz(govde);
  await yzSohbetKapat(db, { ay: h.ay, ust: h.ust, maliyet: maliyetHesapla(h.model, c.giris, c.cikis) + c.arama * ARAMA_MALIYETI });
  /* 550: komutlar yalnız rapordayken (araçlar yalnız o zaman gider) — metin yoksa ne yapılacağı yazılır */
  const komutlar = c.komutlar.filter((k) => (k.tur === "format" ? !!h.format : !!h.rapor));
  const yapilan = komutlar.map((k) => (k.tur === "yaz" ? `${k.girisler.length} giriş yapıyorum` : k.tur === "oku" ? "fotoğrafları okuyorum"
    : k.tur === "format" ? `formatta ${k.islemler.length} değişiklik yapıyorum` : "son girişi geri alıyorum"));
  const metin = c.durum === "ret" ? (c.metin || "Bu isteğe cevap veremiyorum.")
    : !c.metin ? (yapilan.length ? `${yapilan.join(", ")}.` : "Cevap boş geldi; isteğinizi başka türlü yazmayı deneyin.")
    : c.durum === "kesik" ? `${c.metin} …\n\n(Cevap uzunluk sınırında kesildi; devamını isteyebilirsiniz.)` : c.metin;
  await sohbetYaz(db, { kim: "say", metin, yer: h.yer, ek: h.rapor ? { rapor: h.rapor } : h.format ? { format: h.format } : null });
  return { durum: "tamam", iletiler: await sohbetGecmisi(db, 2), ...(komutlar.length ? { komutlar } : {}) };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa (zaman aşımı) harcamaya ve mesaja yazılır. Soru geçmişte kalır. */
export async function sayBirak(db: Sorgulayici, h: Pick<SaySorHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor", "mesaj");
}

/** "Sohbeti temizle": yalnız oturumdaki kişinin geçmişi */
export async function sayTemizle(db: Sorgulayici): Promise<number> {
  return sohbetTemizle(db);
}
