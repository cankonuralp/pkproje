/* S.A.Y SAHA ASİSTANI — modülün sunucu işlevleri (380; maket say.js BB6 — reisim 2026-10-03: "bu say botu plan içinde değil her yer de gözükecek",
   "geçmiş silinmez geçmiş olayı önemli"). Her firma sayfasında sağ altta; firma yapay zekâyı açtıysa görünür.
   2026-10-23 BAŞTAN (reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız", "tamam onaylıyorum …
   herhangi bir kısıt kurma tamamen temiz kurulum yap"): iki kayıt —
   · görünen geçmiş (yz_sohbet — src/server/yz/sohbet.ts): kişinin sorusu, S.A.Y'ın cevapları, ekranın yaptığı işin kısa cevabı; panel bunu çizer;
   · yapay zekâya giden konuşma (yz_konusma — src/server/yz/konusma.ts): Messages API içeriğiyle birebir, yalnız sona eklenir; ekler konuşmada kalır.
   Soru: görünen geçmişe + konuşmaya (ekler, yazı) ve ardından sayfa notu (sistem iletisi: sayfa, roller, bugün, açık rapor / taslak). Ekranın güncel
   hâli (rapor / format haritası) ekran_durumu aracıyla. Döngü src/modules/say/server/dongu.ts'te. Ekranın kuralla yaptığı iş ("Fotoğrafları oku ve
   gir", geri al, üstüne yaz) görünen geçmişe ve konuşmaya not olarak girer (S.A.Y sonra bilir).
   Yetki: kişi ve firma oturumdan; geçmiş ve konuşma kişinin kendisinin (RLS); ekran haritası yalnız raporu yazanın Yeni raporunda, format haritası
   yalnız formatı değiştirebilene ve taslakta (561 / 553 — ekranın gönderdiği kimliğe değil sunucunun bulduğuna bağlanır). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirDurumu, sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ROL_ADI } from "../../../server/yetki/tanim.ts";
import { sinirli, yzAyi, yzAyir, yzAyirmaBirak, yzKendiAyi, yzMesajSay, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type YzModel } from "../../../server/yz/okuma.ts";
import { aracCagrilari, SAY_YANIT_SINIRI } from "../../../server/yz/say.ts";
import { ekleriAl, konusmaEkle, konusmaSonu, konusmaTemizle, kuyrukNotlariniSil, bekleyenAl } from "../../../server/yz/konusma.ts";
import { sohbetGecmisi, sohbetOneriDurumu, sohbetTemizle, sohbetYaz, type SohbetEki, type SohbetIletisi } from "../../../server/yz/sohbet.ts";
import { raporSayBilgisi, raporSayDurumu } from "../../raporlar/server/say-baglanti.ts";
import { acikRaporMetni, raporHaritasi, yoldakiRapor } from "../rapor-haritasi.ts";
import { FormatTanimi } from "../../../format/tanim.ts";
import { formatHaritasi } from "../../rapor-format/say-kurucu.ts";
import { formatAyrintisi, formatDegistirir } from "../../rapor-format/server/formatlar.ts";
import type { Kisi } from "../../anasayfa/server/anasayfa.ts";
import { bugunTr } from "../../planlar/server/planlar.ts";
import { sayfaBilgisi } from "../yardim.ts";
import { ekBloklari } from "./ek.ts";

export interface SayDurum { acik: boolean; anahtar: boolean; sinirDoldu: boolean }

const KAPALI = "S.A.Y firmada kapalı (Firma ayarları › Yapay zekâ).";
export const SINIR_DOLDU = "Bu ay yapay zekâ sınırınız doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir.";
const ANAHTARSIZ = "API anahtarı girilmedi (Firma ayarları › Yapay zekâ): S.A.Y cevap veremez.";
/** iş yarıda bırakıldıysa (ekran kapandı, kullanıcı yeni bir şey istedi) cevapsız kalan araç çağrısının sonucu */
export const YARIDA = "Yapılmadı: iş yarıda bırakıldı (ekran kapandı ya da kullanıcı yeni bir şey istedi).";

/** düğme ve panel için: firmada açık mı, anahtar var mı, kişinin bu ayki sınırı doldu mu */
export async function sayDurumu(db: Sorgulayici, simdi = new Date()): Promise<SayDurum> {
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { acik: false, anahtar: false, sinirDoldu: false };
  const anahtar = (await sirDurumu(db, "yapay_zeka_anahtari")).tanimli;
  const sinirDoldu = sinirli(yz.sinir) && (await yzKendiAyi(db, yzAyi(simdi))) >= yz.sinir * 1e6;
  return { acik: true, anahtar, sinirDoldu };
}

/** kişinin görünen geçmişi, tamamı (yalnız kendisi — RLS); S.A.Y kapalıysa boş */
export async function sayGecmisi(db: Sorgulayici): Promise<SohbetIletisi[]> {
  return (await ayarOku(db, "yapay_zeka")).deger.acik ? sohbetGecmisi(db) : [];
}

/** açık mı + anahtar var mı; açıksa model, kişi başı aylık sınır ve anahtar */
export async function sayKapisi(db: Sorgulayici): Promise<{ durum: "red"; neden: string } | { durum: "acik"; model: YzModel; sinir: number | null; anahtar: string }> {
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: KAPALI };
  if (!(await sirDurumu(db, "yapay_zeka_anahtari")).tanimli) return { durum: "red", neden: ANAHTARSIZ };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: ANAHTARSIZ };
  return { durum: "acik", model: yz.model, sinir: yz.sinir, anahtar };
}

/* ── ekranın hâli: sayfa, açık rapor (561), rapor haritası (550), format taslağı (553) ── */
export type SayCanli = { id: string; cevaplar: unknown; ekipman?: unknown; tarih?: unknown; cihazlar?: unknown };
export type SayKurucu = { id: string; tanim: unknown };
export interface SayEkrani { yol: string; raporNo: string | null; canli: SayCanli | null; kurucu: SayKurucu | null }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RAPOR_NO = /^[\p{L}\p{N}-]{3,40}$/u;
export function canliOku(x: unknown): SayCanli | null {
  const c = (x ?? null) as { id?: unknown; cevaplar?: unknown; ekipman?: unknown; tarih?: unknown; cihazlar?: unknown } | null;
  return c && typeof c === "object" && typeof c.id === "string" ? { id: c.id, cevaplar: c.cevaplar, ekipman: c.ekipman, tarih: c.tarih, cihazlar: c.cihazlar } : null;
}
export function kurucuOku(x: unknown): SayKurucu | null {
  const k = (x ?? null) as { id?: unknown; tanim?: unknown } | null;
  return k && typeof k === "object" && typeof k.id === "string" ? { id: k.id, tanim: k.tanim } : null;
}

export interface SayBaglami {
  yer: string; yardim: string | null; roller: string[];
  /** sayfadaki rapor (künyesiz: numara, tür, durum; yazılamıyorsa nedeni) */
  acikRapor: string | null;
  /** yazılabilir açık raporun haritası ve kimliği (sunucunun doğruladığı) */
  rapor: string | null; raporId: string | null;
  /** format yapıcıdaki taslağın haritası ve kimliği */
  format: string | null; formatId: string | null;
}
/** ekranın hâli — yalnız okuma; kişi / müşteri bilgisi (künye) yok. Haritalar bütünüyle (kısaltma yok) */
export async function sayBaglami(db: Sorgulayici, kim: Kisi, e: SayEkrani): Promise<SayBaglami> {
  const sayfa = sayfaBilgisi(e.yol);
  const yolRaporu = yoldakiRapor(e.yol);
  const acik = yolRaporu ? await raporSayDurumu(db, kim, yolRaporu) : null;
  const yer = acik ? `Rapor ${acik.no}` : e.raporNo && RAPOR_NO.test(e.raporNo) && sayfa.modul === 14 ? `Rapor ${e.raporNo}` : sayfa.yer;
  let rapor: string | null = null, raporId: string | null = null;
  const c = e.canli;
  if (c && UUID.test(c.id) && acik?.yazilabilir && sayfa.modul === 14 && e.yol.split(/[?#]/)[0] === `/raporlar/${c.id}`) {
    const b = await raporSayBilgisi(db, kim, c.id);
    rapor = b ? raporHaritasi(b.tanim, b.turAd, { cevaplar: c.cevaplar, ekipman: c.ekipman ?? {}, tarih: c.tarih, cihazlar: c.cihazlar }, { tumu: true }) : null;
    if (rapor) raporId = c.id;
  }
  let format: string | null = null, formatId: string | null = null;
  const kurucuYolu = /^\/ekipman-turleri\/[0-9a-f-]{36}\/sablon\/([0-9a-f-]{36})\/kurucu$/.exec(e.yol.split(/[?#]/)[0]);
  const k = e.kurucu;
  if (k && UUID.test(k.id) && kurucuYolu?.[1] === k.id && formatDegistirir(kim)) {
    const f = await formatAyrintisi(db, kim, k.id), g = FormatTanimi.safeParse(k.tanim);
    if (f && f.durum === "taslak" && g.success) { format = formatHaritasi(g.data); formatId = k.id; }
  }
  return { yer, yardim: sayfa.yardim, roller: kim.roller.map((r) => ROL_ADI[r]), acikRapor: acik ? acikRaporMetni(acik, !!rapor) : null, rapor, raporId, format, formatId };
}
/** kullanıcının iletisinin ardındaki sayfa notu (kısa; haritalar ekran_durumu ile) */
export function sayfaNotu(b: SayBaglami, simdi = new Date()): string {
  return [
    `Kullanıcı şu sayfada: ${b.yer}.${b.yardim ? ` (${b.yardim})` : ""}`,
    `Kullanıcının rolleri: ${b.roller.join(", ") || "—"}. Bugün: ${bugunTr(simdi)}.`,
    ...(b.acikRapor ? [b.acikRapor] : []),
    ...(b.rapor ? ["Bu rapor ekranda açık ve yazılabilir; güncel haritasını ekran_durumu verir."] : []),
    ...(b.format ? ["Format yapıcıda bir taslak açık; güncel haritasını ekran_durumu verir."] : []),
  ].join("\n");
}
/** ekran_durumu aracının sonucu */
export function ekranDurumuMetni(b: SayBaglami): string {
  return [
    `Sayfa: ${b.yer}.`,
    ...(b.acikRapor ? [b.acikRapor] : []),
    ...(b.rapor ? [`Açık rapor (ekrandaki hâli, kaydedilmemiş değişiklikler dahil):\n${b.rapor}`] : []),
    ...(b.format ? [`Açık format taslağı (format yapıcıda, kaydedilmemiş değişiklikler dahil):\n${b.format}`] : []),
    ...(!b.rapor && !b.format ? ["Ekranda yazılabilir bir rapor ya da format taslağı açık değil."] : []),
  ].join("\n");
}

/* ── konuşmaya kullanıcı iletisi: sondaki cevapsız araç çağrıları önce kapanır (bekleyen sunucu sonucu varsa o, yoksa YARIDA), cevapsız sorunun
   sayfa notu silinir (ardında düşünme bloğu yok); sonra ileti ── */
const dizi = (x: unknown): Record<string, unknown>[] => (Array.isArray(x) ? x.filter((b): b is Record<string, unknown> => !!b && typeof b === "object") : []);
export async function kullaniciIletisiEkle(db: Sorgulayici, bloklar: readonly Record<string, unknown>[]): Promise<void> {
  await kuyrukNotlariniSil(db);
  const son = await konusmaSonu(db);
  const acikta = son?.rol === "assistant" ? aracCagrilari(dizi(son.icerik)) : [];
  const bekleyen = acikta.length ? await bekleyenAl(db) : {};
  const kapanis = acikta.map((a) => (bekleyen[a.id] !== undefined ? { type: "tool_result", tool_use_id: a.id, content: bekleyen[a.id] }
    : { type: "tool_result", tool_use_id: a.id, content: YARIDA, is_error: true }));
  await konusmaEkle(db, "user", [...kapanis, ...bloklar]);
}

/** soru: kapı, ekler (kişinin kendileri), görünen geçmişe, konuşmaya (ekler + yazı) ve sayfa notu. Dönen: görünen ileti ve bağlam */
export async function soruyuEkle(db: Sorgulayici, kim: Kisi, g: { metin: string; ekler: readonly string[]; ekran: SayEkrani }, simdi = new Date()):
  Promise<{ durum: "red"; neden: string } | { durum: "hazir"; ileti: SohbetIletisi; baglam: SayBaglami }> {
  const metin = g.metin.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  const ekler = await ekleriAl(db, g.ekler);
  if (!metin && !ekler.length) return { durum: "red", neden: "Sorunuzu yazın." };
  const k = await sayKapisi(db);
  if (k.durum === "red") return k;
  const b = await sayBaglami(db, kim, g.ekran);
  const soru = metin || (ekler.length === 1 ? "Eki inceler misin?" : "Ekleri inceler misin?");
  const ek: SohbetEki | null = ekler.length || b.raporId ? { ...(b.raporId ? { rapor: b.raporId } : {}), ...(ekler.length ? { ekler: ekler.map((e) => ({ ad: e.ad, boyut: e.boyut, tur: e.tur })) } : {}) } : null;
  const ileti = await gorunenYaz(db, { kim: "ben", metin: soru, yer: b.yer, ek }, simdi);
  await kullaniciIletisiEkle(db, ekBloklari(ekler, soru));
  await konusmaEkle(db, "system", sayfaNotu(b, simdi));
  return { durum: "hazir", ileti, baglam: b };
}

/** görünen geçmişe yazar; dönen ileti (ekran hemen çizer) */
export async function gorunenYaz(db: Sorgulayici, m: { kim: "ben" | "say"; metin: string; yer: string; ek?: SohbetEki | null }, simdi = new Date()): Promise<SohbetIletisi> {
  const id = await sohbetYaz(db, m);
  return { id, kim: m.kim, metin: m.metin, yer: m.yer, ek: m.ek ?? null, zaman: simdi.toISOString() };
}

/* ── maliyet: her yapay zekâ çağrısından önce kişinin aylık sınırı (firma ayarı; boşsa sınırsız) için ayırma, sonra gerçek maliyetle kapanış ── */
/** ayırma: isteğin ölçülen boyu (JSON karakteri / 2) ve modelin cevap sınırı; sınır doluysa null */
export async function cagriAyir(db: Sorgulayici, model: YzModel, sinir: number | null, girisTahmini: number, simdi = new Date()): Promise<{ ay: string; ust: number } | null> {
  const ay = yzAyi(simdi), ust = maliyetHesapla(model, Math.max(100_000, Math.ceil(girisTahmini)), SAY_YANIT_SINIRI);
  return (await yzAyir(db, ay, sinir, ust)) ? { ay, ust } : null;
}
/** kapanış: gerçek maliyet; mesaj 1 — kişinin sorusunun ilk çağrısı (sonrakiler aynı mesajın işi) */
export const cagriKapat = (db: Sorgulayici, a: { ay: string; ust: number }, maliyet: number, mesaj: 0 | 1) => yzSohbetKapat(db, { ay: a.ay, ust: a.ust, maliyet, mesaj });
/** çağrı cevapsız bitti: ücretsizse bırakılır, sonucu bilinmiyorsa ayrılan harcamaya yazılır */
export const cagriBirak = (db: Sorgulayici, a: { ay: string; ust: number }, ucretli: boolean) => yzAyirmaBirak(db, a.ay, a.ust, ucretli, "yok");

/* ── ekranın kuralla yaptığı iş (542: "Fotoğrafları oku ve gir", "geri al", "üstüne yaz") — METNİ sunucu kurar (istemci S.A.Y adına metin yazamaz);
   görünen geçmişe ve konuşmaya not olarak girer ── */
export const SAY_ISLEMLERI = ["oku", "ustune", "geri"] as const;
export type SayIslemi = (typeof SAY_ISLEMLERI)[number];
export interface SayOkumaGirdisi {
  okunan: number; okunamayan: number; neden: string | null;
  bolumler: { ad: string; alan: number; satir: number; belirsiz: number }[];
  dolu: string[];
}
export interface SayIslemGirdisi { istek: SayIslemi; soru: string; sayi: number; okuma?: SayOkumaGirdisi }
export interface SayRaporGirdisi { hizli: "islem"; rapor: { id: string; no: string }; islem: SayIslemGirdisi }
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

/** rapor ekranının yaptığı işin cevabı — kuralla (ücretsiz), metni sunucu kurar; soru ve cevap görünen geçmişe ("Rapor <no>") ve konuşmaya not
    olarak; mesaj sayılır */
export async function sayRaporCevabi(db: Sorgulayici, girdi: unknown, simdi = new Date()): Promise<{ durum: "tamam"; iletiler: SohbetIletisi[] } | { durum: "red"; neden: string }> {
  const g = raporGirdisi(girdi);
  if (!g) return { durum: "red", neden: "Rapor bilgisi okunamadı; sayfayı yenileyip yeniden deneyin." };
  const k = await sayKapisi(db);
  if (k.durum === "red") return k;
  const yer = `Rapor ${g.rapor.no}`, i = g.islem, cevap = islemMetni(i);
  const l = [await gorunenYaz(db, { kim: "ben", metin: i.soru, yer, ek: { rapor: g.rapor.id } }, simdi),
    await gorunenYaz(db, { kim: "say", metin: cevap, yer, ek: { rapor: g.rapor.id, islem: { istek: i.istek, dolu: i.okuma?.dolu.length ?? 0 } } }, simdi)];
  await kullaniciIletisiEkle(db, [{ type: "text", text: `(Ekranda yapıldı — ${yer}: kullanıcı “${i.soru}” dedi; ekranın sonucu:)\n${cevap}` }]);
  await yzMesajSay(db, yzAyi(simdi));
  return { durum: "tamam", iletiler: l };
}

/** öneri kartı: "Uygula" (rapora ekranda uygulandı) ya da "Vazgeç" — kişinin kendi iletisinde, bir kez */
export async function sayOneri(db: Sorgulayici, id: string, durum: "uygulandi" | "vazgecildi"): Promise<boolean> {
  return UUID.test(id) && sohbetOneriDurumu(db, id, durum);
}

/** "Sohbeti temizle": görünen geçmiş + konuşma + ekler (yalnız kişinin kendisi); dönen: silinen ileti sayısı, hizmetten silinecek ek dosyaları ve
    anahtar (silme işlem dışında) */
export async function sayTemizle(db: Sorgulayici): Promise<{ silinen: number; dosyalar: string[]; anahtar: string | null }> {
  const silinen = await sohbetTemizle(db);
  const dosyalar = await konusmaTemizle(db);
  const anahtar = dosyalar.length ? await sirKullan(db, "yapay_zeka_anahtari") : null;
  return { silinen, dosyalar, anahtar };
}
