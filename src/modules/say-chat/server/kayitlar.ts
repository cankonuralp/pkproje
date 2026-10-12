/* S.A.Y CHAT KAYITLARI (524; pkproje §3.10 m.1–12, 18–24; maket 521 maket-saychat.js — reisim 2026-10-13: "onayılıyorum, yap bitir"). Göç 0085.
   · Yer: plan içinde; yalnız PLAN EKİBİNDEKİ kişi, plan kabul / denetimde / tamamlandı iken (m.18). Kayıtlar KİŞİYE ÖZEL (m.2; RLS firma + hesap).
   · Bir kayıt = bir ekipman (m.8): "Plandan seç" — plandaki, kişinin branşına uygun (meslekten), pasif olmayan, raporu yazılmamış, kişinin başka
     kaydında olmayan ekipman; "Yeni ekle" — branşındaki, rapor formatı yayında tür (kod rapor yazılırken, m.19). Mesaj satırları ve kaydın tanımı
     (tür ayarı, 523) birlikte saklanır; tanım türün formatıyla denetlenir (ayar değiştiyse kayıt yeniden açılıp gönderilir).
   · Kayıtlar çevrimdışı kuyruktan gelir (m.9; /api/islem, tek seferlik): "saychat.kaydet" (sürüm kilidi — sessiz ezme yok), "saychat.foto" (ekler, ezmez;
     kayıt yoksa fotoğrafla açılır; sürüm önce / sonra döner, kuyruk bekleyen işleri taşır), "saychat.sil". Kayıt cihazın ürettiği kimlikle (cihaz_id).
   · Fotoğraflar dosya modülü "say_chat" (tür baytlardan, EXIF silinir); yalnız sahibi açar. Rapor yazılınca kayıt silinir (525). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import { ekle, guncelle, sil, tablo } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import type { YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { sinirli, yzAyi, yzHazirMi, yzKendiAyi } from "../../../server/yz/kullanim.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { personelBransi } from "../../personel/server/say-chat-baglanti.ts";
import { sayChatPlani, type SayChatPlani } from "../../planlar/server/plan-ici.ts";
import { formatsizTurler } from "../../rapor-format/server/formatlar.ts";
import {
  ChatFotoGirdisi, EKIPMAN_FOTO_EN_COK, KayitGirdisi, OKUNACAK_FOTO_EN_COK, tanimDenetle, type BaslikSecenegi, type ChatFoto, type ChatTanimi,
} from "../sema.ts";
import { chatTuru } from "./ayar.ts";
import { raporKosullari } from "./rapor-yaz.ts";

export const DOSYA_SAY_CHAT = "say_chat";
const KAYIT = tablo({ ad: "say_chat_kayit", sutunlar: ["cihaz_id", "plan_id", "ekipman_id", "tur_id", "mesaj", "tanim", "tanim_surum", "fotolar"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ACIK_DURUMLAR = new Set(["kabul", "denetimde", "tamamlandi"]);
const json = (x: unknown) => JSON.stringify(x);

export interface Kisi extends YetkiHesabi { ad: string }
export interface ChatKaydi {
  /** cihazın ürettiği kimlik (ekran ve kuyruk bununla) */
  id: string; surum: number; zaman: string;
  ekipman: { tip: "plan"; id: string; kod: string; turId: string } | { tip: "yeni"; turId: string } | null;
  mesaj: string[]; tanim: ChatTanimi | null; tanimSurum: number; fotolar: ChatFoto[];
}
export interface ChatTuru { id: string; ad: string; kod: string; tanim: ChatTanimi; surum: number; basliklar: BaslikSecenegi[] }
export interface SayChatPaneli {
  plan: { id: string; no: string; durum: string; baslangic: string };
  brans: "m" | "e" | null;
  kayitlar: ChatKaydi[];
  /** seçilebilir plan ekipmanı (kişinin başka kaydındakiler ekranda düşer) */
  planEkipmani: { id: string; kod: string; turId: string; konum: string | null }[];
  /** "Yeni ekle" türleri (branşındaki, formatı yayında) */
  yeniTurler: string[];
  turler: Record<string, ChatTuru>;
  /** etiketten okuma (m.11): firmada yapay zekâ hazır mı, kişinin bu ayki harcaması / sınırı (metin) */
  yz: { hazir: boolean; kota: string };
  /** 525 "Bekleyenler için rapor yaz" koşulları: engel (tamamlanmış plan, plan günü, günlük süre dolu) ya da günlük süre bilgisi */
  rapor: { engel: string | null; mesai: string };
}

type KayitDb = { id: string; cihaz_id: string; plan_id: string; ekipman_id: string | null; tur_id: string | null; mesaj: string[]; tanim: ChatTanimi | null;
  tanim_surum: number; fotolar: ChatFoto[]; surum: number; olustu: Date };
const SEC = "SELECT id::text, cihaz_id::text, plan_id::text, ekipman_id::text, tur_id::text, mesaj, tanim, tanim_surum, fotolar, surum, olustu FROM say_chat_kayit";
/** cihaz kimliği başka kişinin kaydında (RLS'de görünmez; aynı kimlikle eklemek eşsizlikte düşerdi) */
const baskasinda = async (db: Sorgulayici, cihazId: string) => (await db.sorgu<{ b: boolean }>("SELECT say_chat_cihaz_baskasinda($1) AS b", [cihazId])).rows[0].b;
const KIMLIK_KULLANILDI = { durum: "gecersiz" as const, hatalar: { kayit: "Kaydın kimliği kullanılmış; S.A.Y Chat'te kaydı yeniden oluşturun." } };
const kayitOku = async (db: Sorgulayici, cihazId: string) => (UUID.test(cihazId) ? (await db.sorgu<KayitDb>(`${SEC} WHERE cihaz_id = $1`, [cihazId])).rows[0] ?? null : null);

/** kişi bu planda S.A.Y Chat kullanabilir mi (plan ekibinde, plan kabul / denetimde / tamamlandı) — değilse null */
export async function chatKapisi(db: Sorgulayici, kim: Kisi, planId: string): Promise<SayChatPlani | null> {
  if (!UUID.test(planId)) return null;
  const p = await sayChatPlani(db, kim, planId);
  return p && p.uye && ACIK_DURUMLAR.has(p.durum) ? p : null;
}

const dolar = (milyonda: number) => `${String(Math.round(milyonda / 1e4) / 100).replace(".", ",")} $`;

/** plan içi ekranı (sayfa sunucuda çizer — çevrimdışı açılan sayfada da veri hazır): kişinin kayıtları, seçenekler, türlerin tanımları */
export async function sayChatPaneli(db: Sorgulayici, kim: Kisi, planId: string, simdi = new Date()): Promise<SayChatPaneli | null> {
  const p = await chatKapisi(db, kim, planId);
  if (!p) return null;
  const brans = await personelBransi(db, p.personelId);
  const raporlu = new Set(p.raporlu), formatsiz = new Set(await formatsizTurler(db));
  const tumTurler = await turOzetleri(db);
  const kayitlar = (await db.sorgu<KayitDb>(`${SEC} WHERE plan_id = $1 ORDER BY olustu, id`, [planId])).rows;
  const kod = new Map(p.ekipman.map((e) => [e.id, e]));
  const planEkipmani = p.ekipman.filter((e) => !e.pasif && (!brans || e.brans === brans) && !raporlu.has(e.id) && !formatsiz.has(e.turId))
    .map((e) => ({ id: e.id, kod: e.kod, turId: e.turId, konum: e.konum }));
  const yeniTurler = tumTurler.filter((t) => (!brans || t.brans === brans) && !formatsiz.has(t.id)).sort((a, b) => a.ad.localeCompare(b.ad, "tr")).map((t) => t.id);
  const gerekli = new Set([...planEkipmani.map((e) => e.turId), ...yeniTurler,
    ...kayitlar.map((k) => k.tur_id ?? (k.ekipman_id ? kod.get(k.ekipman_id)?.turId : null)).filter((x): x is string => !!x)]);
  const turBul = new Map(tumTurler.map((t) => [t.id, t]));
  const turler: Record<string, ChatTuru> = {};
  for (const id of gerekli) {
    const t = turBul.get(id), c = t ? await chatTuru(db, id) : null;
    if (t && c) turler[id] = { id, ad: t.ad, kod: t.kod, tanim: c.tanim, surum: c.surum, basliklar: c.basliklar };
  }
  const yz = (await ayarOku(db, "yapay_zeka")).deger, harcanan = await yzKendiAyi(db, yzAyi(simdi));
  return {
    plan: { id: p.id, no: p.no, durum: p.durum, baslangic: p.baslangic }, brans,
    kayitlar: kayitlar.map((k) => kayitGorunumu(k, kod)), planEkipmani: planEkipmani.filter((e) => turler[e.turId]), yeniTurler: yeniTurler.filter((id) => turler[id]), turler,
    yz: { hazir: await yzHazirMi(db), kota: `bu ay ${dolar(harcanan)} / ${sinirli(yz.sinir) ? `${String(yz.sinir).replace(".", ",")} $` : "sınırsız"}` },
    rapor: await raporKosullari(db, p),
  };
}

function kayitGorunumu(k: KayitDb, kod: Map<string, { kod: string; turId: string }>): ChatKaydi {
  const e = k.ekipman_id ? kod.get(k.ekipman_id) : null;
  return {
    id: k.cihaz_id, surum: k.surum, zaman: k.olustu.toISOString(),
    ekipman: k.ekipman_id ? (e ? { tip: "plan", id: k.ekipman_id, kod: e.kod, turId: e.turId } : null) : k.tur_id ? { tip: "yeni", turId: k.tur_id } : null,
    mesaj: k.mesaj, tanim: k.tanim, tanimSurum: k.tanim_surum, fotolar: k.fotolar,
  };
}

export type ChatYazma =
  | { durum: "tamam"; yeniSurum: number }
  | { durum: "gecersiz"; hatalar: Record<string, string> }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
export type ChatFotoYazma = { durum: "tamam"; surum: { once: number; sonra: number }; foto: ChatFoto } | Exclude<ChatYazma, { durum: "tamam" }>;

const KAPALI = "S.A.Y Chat bu planda kapalı: yalnız planın ekibindeki kişi, plan kabul edilmiş / denetimde / tamamlanmışken kayıt yazar.";

/** "saychat.kaydet" — kayıt yoksa açılır (cihazın sürümü 0 olmalı; değilse kayıt başka yerde silinmiştir), varsa sürüm kilidiyle değişir */
export async function chatKaydet(db: Sorgulayici, kim: Kisi, cihazId: string, surum: number, girdi: unknown): Promise<ChatYazma> {
  const g = KayitGirdisi.safeParse(girdi);
  if (!g.success || !UUID.test(cihazId)) return { durum: "gecersiz", hatalar: { kayit: "Kayıt okunamadı; S.A.Y Chat'i yenileyip yeniden gönderin." } };
  const p = await chatKapisi(db, kim, g.data.plan);
  if (!p) return { durum: "red", neden: KAPALI };
  const mevcut = await kayitOku(db, cihazId);
  if (mevcut && mevcut.plan_id !== p.id) return { durum: "gecersiz", hatalar: { kayit: "Kayıt başka bir plana ait." } };
  if (!mevcut && surum !== 0) return { durum: "yok" };
  if (!mevcut && (await baskasinda(db, cihazId))) return KIMLIK_KULLANILDI;
  /* ekipman: plandaki uygun ekipman ya da formatı yayında yeni tür */
  let ekipmanId: string | null = null, turId: string | null = null;
  const brans = await personelBransi(db, p.personelId);
  if (g.data.ekipman?.tip === "plan") {
    const id = g.data.ekipman.id, e = p.ekipman.find((x) => x.id === id);
    if (!e || e.pasif) return { durum: "gecersiz", hatalar: { ekipman: "Ekipman bu planda yok ya da pasif." } };
    if (brans && e.brans !== brans) return { durum: "gecersiz", hatalar: { ekipman: "Bu ekipman sizin branşınızda değil." } };
    if (p.raporlu.includes(e.id)) return { durum: "gecersiz", hatalar: { ekipman: "Bu ekipmanın raporu yazılmış." } };
    if ((await db.sorgu("SELECT 1 FROM say_chat_kayit WHERE ekipman_id = $1 AND cihaz_id <> $2", [e.id, cihazId])).rowCount) {
      return { durum: "gecersiz", hatalar: { ekipman: `${e.kod} başka bir kaydınızda.` } };
    }
    ekipmanId = e.id; turId = e.turId;
  } else if (g.data.ekipman?.tip === "yeni") {
    const t = (await turOzetleri(db)).find((x) => x.id === (g.data.ekipman as { tur: string }).tur);
    if (!t || (brans && t.brans !== brans)) return { durum: "gecersiz", hatalar: { ekipman: "Bu tür sizin branşınızda değil." } };
    turId = t.id;
  }
  /* tanım türün formatıyla (ayar sonradan değişip alan kalktıysa kayıt yeniden açılır) */
  let tanim: ChatTanimi | null = null;
  if (turId) {
    const c = await chatTuru(db, turId);
    if (!c) return { durum: "gecersiz", hatalar: { ekipman: "Bu türün rapor formatı yayında değil." } };
    const d = tanimDenetle(c.format, g.data.tanim);
    if (d.durum === "hata") return { durum: "gecersiz", hatalar: { tanim: "Türün S.A.Y Chat ayarı değişti; kaydı açıp ekipmanı yeniden seçin." } };
    tanim = d.tanim;
  }
  const mesaj = g.data.mesaj.map((x) => x.replace(/[\u0000-\u001f\u007f]/g, " ").trimEnd());
  const iz = { kim: kim.ad, ne: "say_chat.kaydet", gerekce: p.no };
  if (!mevcut) {
    const y = await ekle(db, KAYIT, { cihaz_id: cihazId, plan_id: p.id, ekipman_id: g.data.ekipman?.tip === "plan" ? ekipmanId : null,
      tur_id: g.data.ekipman?.tip === "yeni" ? turId : null, mesaj: json(mesaj), tanim, tanim_surum: g.data.tanimSurum, fotolar: "[]" }, iz);
    return { durum: "tamam", yeniSurum: y.surum };
  }
  const kaldir = new Set(g.data.kaldir), fotolar = mevcut.fotolar.filter((f) => !kaldir.has(f.dosya));
  const r = await guncelle(db, KAYIT, mevcut.id, surum, {
    ekipman_id: g.data.ekipman?.tip === "plan" ? ekipmanId : null, tur_id: g.data.ekipman?.tip === "yeni" ? turId : null, mesaj: json(mesaj), tanim,
    tanim_surum: g.data.tanimSurum, fotolar: json(fotolar),
  }, iz);
  if (r.durum === "cakisma") return { durum: "cakisma" };
  if (r.durum === "yok") return { durum: "yok" };
  for (const f of mevcut.fotolar.filter((x) => kaldir.has(x.dosya))) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_chat.foto_kaldir", gerekce: p.no });
  return { durum: "tamam", yeniSurum: r.surum };
}

/** "saychat.foto" — fotoğraf EKLER (hiçbir şeyi ezmez; kaydın o anki sürümüyle); kayıt yoksa fotoğrafla açılır. Etiket fotoğrafı tektir (yenisi eskisinin
    yerine). Sonuçta sürüm önce / sonra: cihaz aynı kaydın bekleyen Kaydet'ini yalnız sürüm bu fotoğrafla değiştiyse taşır. */
export async function chatFoto(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, cihazId: string, girdi: unknown): Promise<ChatFotoYazma> {
  const g = ChatFotoGirdisi.safeParse(girdi);
  if (!g.success || !UUID.test(cihazId)) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf okunamadı." } };
  const p = await chatKapisi(db, kim, g.data.plan);
  if (!p) return { durum: "red", neden: KAPALI };
  let k = await kayitOku(db, cihazId);
  if (k && k.plan_id !== p.id) return { durum: "gecersiz", hatalar: { foto: "Kayıt başka bir plana ait." } };
  if (!k) {
    if (await baskasinda(db, cihazId)) return KIMLIK_KULLANILDI;
    await ekle(db, KAYIT, { cihaz_id: cihazId, plan_id: p.id, mesaj: "[]", fotolar: "[]" }, { kim: kim.ad, ne: "say_chat.kaydet", gerekce: p.no });
    k = (await kayitOku(db, cihazId))!;
  }
  const { rol } = g.data, bolum = rol === "okunacak" ? g.data.k : null;
  if (rol === "okunacak" && !bolum) return { durum: "gecersiz", hatalar: { foto: "Okunacak fotoğrafın başlığı yok." } };
  if (rol === "ekipman" && k.fotolar.filter((f) => f.rol === "ekipman").length >= EKIPMAN_FOTO_EN_COK) return { durum: "gecersiz", hatalar: { foto: `Kayda en çok ${EKIPMAN_FOTO_EN_COK} ekipman fotoğrafı.` } };
  if (rol === "okunacak" && k.fotolar.filter((f) => f.rol === "okunacak" && f.k === bolum).length >= OKUNACAK_FOTO_EN_COK) return { durum: "gecersiz", hatalar: { foto: `Başlık başına en çok ${OKUNACAK_FOTO_EN_COK} fotoğraf.` } };
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_SAY_CHAT, kayitId: k.id, ad: g.data.ad, bayt: new Uint8Array(Buffer.from(g.data.veri, "base64")),
    izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { foto: y.neden === "tur" ? "Yalnız JPEG ya da PNG fotoğraf." : y.neden === "buyuk" ? "Fotoğraf çok büyük." : "Fotoğraf okunamadı." } };
  const foto: ChatFoto = { dosya: y.id, ad: y.ad, rol, k: bolum };
  const eskiEtiket = rol === "etiket" ? k.fotolar.filter((f) => f.rol === "etiket") : [];
  const fotolar = [...k.fotolar.filter((f) => !eskiEtiket.includes(f)), foto];
  const r = await guncelle(db, KAYIT, k.id, k.surum, { fotolar: json(fotolar) }, { kim: kim.ad, ne: "say_chat.foto", gerekce: `${p.no} · ${y.ad}` });
  if (r.durum !== "tamam") return r.durum === "yok" ? { durum: "yok" } : { durum: "cakisma" };
  for (const f of eskiEtiket) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_chat.foto_kaldir", gerekce: p.no });
  return { durum: "tamam", surum: { once: k.surum, sonra: r.surum }, foto };
}

/** "saychat.sil" (m.10: rapor yazılana kadar kayıt silinir) — kayıt ve fotoğrafları (çöpe) */
export async function chatSil(db: Sorgulayici, kim: Kisi, cihazId: string): Promise<ChatYazma> {
  const k = await kayitOku(db, cihazId);
  if (!k) return { durum: "yok" };
  if (!(await sayChatPlani(db, kim, k.plan_id))) return { durum: "yetkisiz" };
  if (!(await sil(db, KAYIT, k.id, { kim: kim.ad, ne: "say_chat.sil" }))) return { durum: "yok" };
  for (const f of k.fotolar) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_chat.sil" });
  return { durum: "tamam", yeniSurum: 0 };
}

/** çakışmada cihaza kaydın güncel sürümü ("benimkini yaz" yeni kimlikle bununla gider); silinmişte null */
export async function chatGuncelSurum(db: Sorgulayici, cihazId: string): Promise<number | null> {
  return (await kayitOku(db, cihazId))?.surum ?? null;
}

/** dosya erişimi (src/server/dosya/erisim.ts): fotoğrafı yalnız kaydın sahibi açar (RLS: kişi yalnız kendi kaydını görür) */
export async function chatDosyasiGorulur(db: Sorgulayici, kayitId: string): Promise<boolean> {
  return UUID.test(kayitId) && !!(await db.sorgu("SELECT 1 FROM say_chat_kayit WHERE id = $1", [kayitId])).rowCount;
}

/* ── ÇEVRİMDIŞI KUYRUK (/api/islem) ── */
export const CHAT_ISLEM_TURLERI = ["saychat.kaydet", "saychat.foto", "saychat.sil"] as const;
export type ChatIslemTuru = (typeof CHAT_ISLEM_TURLERI)[number];
export const chatIslemTuruMu = (t: string): t is ChatIslemTuru => (CHAT_ISLEM_TURLERI as readonly string[]).includes(t);
export async function chatIslemi(db: Sorgulayici, dosya: { depo: Depo; firmaId: string }, kim: Kisi, tur: ChatIslemTuru, cihazId: string, surum: number,
  girdi: unknown): Promise<ChatYazma | ChatFotoYazma> {
  if (tur === "saychat.kaydet") return chatKaydet(db, kim, cihazId, surum, girdi);
  if (tur === "saychat.foto") return chatFoto(db, dosya.depo, kim, dosya.firmaId, cihazId, girdi);
  return chatSil(db, kim, cihazId);
}
