/* S.A.Y CHAT — KİŞİSEL SOHBETİN MESAJLARI (2026-11-07 yeniden; sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"). Göç 0123.
   · Sohbet KİŞİYE ÖZEL (RLS firma + hesap) ve plana bağlı değil; her sayfadan açılır. Mesaj cihazda yazılır, çevrimdışı kuyrukla SIRAYLA gelir
     (/api/islem "chat.mesaj", tek seferlik); saat cihazdaki yazılış anı — sunucu değiştirmez. Fotoğrafın çekim saati cihazda EXIF'ten (silinmeden önce).
   · Dosya önce yüklenir (dosya modülü "say_chat", kaydı mesajın CİHAZ kimliği; tür baytlardan, EXIF silinir), sonra mesaj; ikisi aynı işlemde.
   · Kişi kendi İŞLENMEMİŞ mesajını siler ("chat.sil"); işlenmiş mesaj silinmez (işaret geri alınır). Karar 2: işlenmiş mesajın dosyası 30 gün sonra
     çöpe, yazısı kalır — sahibi sohbeti açınca ya da S.A.Y okuyunca (RLS: başkasının sohbetine gece işi de giremez).
   · Bir sürüm boyunca eski kuyruk işleri ("saychat.kaydet" / "saychat.foto" / "saychat.sil" — cihazda kalmış eski kayıtlar) mesaj olarak kabul edilir. */
import { randomUUID } from "node:crypto";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import type { DosyaTuru } from "../../../server/dosya/tur.ts";
import { ekle, guncelle, sil, tablo } from "../../../server/db/yazici.ts";
import { CHAT_SAYFA, ISLENMIS_DOSYA_GUN, MesajGirdisi, type ChatMesaji, type MesajTuru } from "../sema.ts";

export const DOSYA_SAY_CHAT = "say_chat";
const MESAJ = tablo({ ad: "say_chat_mesaj", sutunlar: ["cihaz_id", "zaman", "sira", "tur", "metin", "dosya", "dosya_ad", "cekim", "on_okuma",
  "islendi", "islendi_plan", "islendi_no", "islendi_rapor", "dosya_silindi"], gizli: ["metin", "dosya_ad", "on_okuma"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FOTO: readonly DosyaTuru[] = ["jpeg", "png"];
const BELGE: readonly DosyaTuru[] = ["pdf", "docx", "xlsx"];

export interface Kisi { id: string; ad: string }
export interface MesajSatiri {
  id: string; cihaz_id: string; zaman: Date; sira: number; tur: MesajTuru; metin: string | null; dosya: string | null; dosya_ad: string | null;
  cekim: string | null; on_okuma: Record<string, unknown> | null; islendi: Date | null; islendi_plan: string | null; islendi_no: string | null;
  islendi_rapor: number | null; dosya_silindi: Date | null; surum: number;
}
const SEC = `SELECT id::text, cihaz_id::text, zaman, sira, tur, metin, dosya::text, dosya_ad, cekim, on_okuma, islendi, islendi_plan::text, islendi_no,
  islendi_rapor, dosya_silindi, surum FROM say_chat_mesaj`;

export const mesajGorunumu = (m: MesajSatiri): ChatMesaji => ({
  id: m.cihaz_id, zaman: m.zaman.toISOString(), sira: m.sira, tur: m.tur, metin: m.metin, ad: m.dosya_ad, cekim: m.cekim,
  dosya: m.dosya_silindi ? null : m.dosya,
  islendi: m.islendi_plan ? { plan: m.islendi_plan, no: m.islendi_no ?? "", rapor: m.islendi_rapor ?? 0 } : null,
});

/** kişinin sohbeti (RLS: yalnız kendisininki) — zaman sırasıyla; tumu: false ise son CHAT_SAYFA mesaj. islenmemis: yalnız işlenmemişler */
export async function mesajlariOku(db: Sorgulayici, s: { tumu?: boolean; islenmemis?: boolean } = {}): Promise<MesajSatiri[]> {
  const kosul = s.islenmemis ? " WHERE islendi IS NULL" : "";
  const l = (await db.sorgu<MesajSatiri>(s.tumu ? `${SEC}${kosul} ORDER BY zaman, sira, olustu`
    : `SELECT * FROM (${SEC}${kosul} ORDER BY zaman DESC, sira DESC, olustu DESC LIMIT ${CHAT_SAYFA}) s ORDER BY zaman, sira`)).rows;
  return l.map((m) => ({ ...m, zaman: new Date(m.zaman) }));
}

/** karar 2: işlenmesinin üstünden ISLENMIS_DOSYA_GUN geçen mesajların dosyası çöpe (yazı ve işaret kalır) — sahibinin işleminde */
export async function eskiDosyalariTemizle(db: Sorgulayici, kim: Kisi, simdi = new Date()): Promise<number> {
  const l = (await db.sorgu<{ id: string; dosya: string; surum: number }>(
    `SELECT id::text, dosya::text, surum FROM say_chat_mesaj WHERE dosya IS NOT NULL AND dosya_silindi IS NULL AND islendi IS NOT NULL
       AND islendi < $1::timestamptz - make_interval(days => $2) LIMIT 200`, [simdi.toISOString(), ISLENMIS_DOSYA_GUN])).rows;
  for (const m of l) {
    const r = await guncelle(db, MESAJ, m.id, m.surum, { dosya_silindi: simdi.toISOString() }, { kim: kim.ad, ne: "say_chat.dosya_sure" });
    if (r.durum === "tamam") await dosyaCope(db, m.dosya, { kim: kim.ad, ne: "say_chat.dosya_sure" });
  }
  return l.length;
}

/** ekran: kişinin sohbeti (önce süresi dolan dosyalar çöpe) */
export async function sohbet(db: Sorgulayici, kim: Kisi): Promise<ChatMesaji[]> {
  await eskiDosyalariTemizle(db, kim);
  return (await mesajlariOku(db)).map(mesajGorunumu);
}

export type ChatYazma =
  | { durum: "tamam"; yeniSurum: number; mesaj?: ChatMesaji }
  | { durum: "gecersiz"; hatalar: Record<string, string> }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const baskasinda = async (db: Sorgulayici, cihazId: string) => (await db.sorgu<{ b: boolean }>("SELECT say_chat_mesaj_baskasinda($1) AS b", [cihazId])).rows[0].b;
const mesajOku = async (db: Sorgulayici, cihazId: string) => (UUID.test(cihazId)
  ? (await db.sorgu<MesajSatiri>(`${SEC} WHERE cihaz_id = $1`, [cihazId])).rows.map((m) => ({ ...m, zaman: new Date(m.zaman) }))[0] ?? null : null);
const temiz = (s: string | null) => (s === null ? null : s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").replace(/\r\n?/g, "\n").trim() || null);

/** "chat.mesaj" — mesajı yazar (cihazın kimliğiyle; aynı kimlik ikinci kez gelirse yazılmış olanı döner — kuyruk tekrarı) */
export async function mesajYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, cihazId: string, girdi: unknown): Promise<ChatYazma> {
  const g = MesajGirdisi.safeParse(girdi);
  if (!g.success || !UUID.test(cihazId)) return { durum: "gecersiz", hatalar: { mesaj: "Mesaj okunamadı; sohbeti yenileyip yeniden gönderin." } };
  const var_ = await mesajOku(db, cihazId);
  if (var_) return { durum: "tamam", yeniSurum: var_.surum, mesaj: mesajGorunumu(var_) };
  if (await baskasinda(db, cihazId)) return { durum: "gecersiz", hatalar: { mesaj: "Mesajın kimliği kullanılmış; mesajı yeniden yazın." } };
  const m = g.data, metin = temiz(m.metin);
  if (m.tur === "yazi" && !metin) return { durum: "gecersiz", hatalar: { mesaj: "Mesaj boş." } };
  let dosya: string | null = null, ad: string | null = null;
  if (m.tur !== "yazi") {
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_SAY_CHAT, kayitId: cihazId, ad: m.ad ?? (m.tur === "foto" ? "foto.jpg" : "belge"),
      bayt: new Uint8Array(Buffer.from(m.veri ?? "", "base64")), izinli: m.tur === "foto" ? FOTO : BELGE, kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) {
      return { durum: "gecersiz", hatalar: { mesaj: y.neden === "tur" ? (m.tur === "foto" ? "Yalnız JPEG ya da PNG fotoğraf." : "Yalnız PDF, Word (.docx) ya da Excel (.xlsx) belge.")
        : y.neden === "buyuk" ? "Dosya çok büyük." : "Dosya okunamadı." } };
    }
    dosya = y.id; ad = y.ad;
  }
  await ekle(db, MESAJ, { cihaz_id: cihazId, zaman: m.zaman, sira: m.sira, tur: m.tur, metin, dosya, dosya_ad: ad, cekim: m.tur === "foto" ? m.cekim : null },
    { kim: kim.ad, ne: "say_chat.mesaj" });
  const yazilan = (await mesajOku(db, cihazId))!;
  return { durum: "tamam", yeniSurum: yazilan.surum, mesaj: mesajGorunumu(yazilan) };
}

/** "chat.sil" — kişinin kendi işlenmemiş mesajı (dosyası çöpe) */
export async function mesajSil(db: Sorgulayici, kim: Kisi, cihazId: string): Promise<ChatYazma> {
  const m = await mesajOku(db, cihazId);
  if (!m) return { durum: "tamam", yeniSurum: 0 };
  if (m.islendi) return { durum: "red", neden: `Mesaj ${m.islendi_no ?? "bir"} planında işlendi; önce işareti geri alın.` };
  if (!(await sil(db, MESAJ, m.id, { kim: kim.ad, ne: "say_chat.sil" }))) return { durum: "yok" };
  if (m.dosya && !m.dosya_silindi) await dosyaCope(db, m.dosya, { kim: kim.ad, ne: "say_chat.sil" });
  return { durum: "tamam", yeniSurum: 0 };
}

/** S.A.Y'ın ilk okumasının sonucu (fotoğraf başına bir kez) */
export async function onOkumaYaz(db: Sorgulayici, kim: Kisi, id: string, okuma: Record<string, unknown>): Promise<void> {
  const m = (await db.sorgu<{ surum: number; on_okuma: unknown }>("SELECT surum, on_okuma FROM say_chat_mesaj WHERE id = $1", [id])).rows[0];
  if (!m || m.on_okuma) return;
  await guncelle(db, MESAJ, id, m.surum, { on_okuma: JSON.stringify(okuma) }, { kim: kim.ad, ne: "say_chat.on_okuma" });
}

/** chat_isle: mesajlar (veritabanı kimliği) plana işlenmiş işaretlenir — yalnız işlenmemişler; dönen: işaretlenen sayısı */
export async function isaretle(db: Sorgulayici, kim: Kisi, idler: readonly string[], plan: { id: string; no: string }, rapor: number): Promise<number> {
  let n = 0;
  const simdi = new Date().toISOString();
  for (const m of (await db.sorgu<{ id: string; surum: number }>("SELECT id::text, surum FROM say_chat_mesaj WHERE id::text = ANY($1::text[]) AND islendi IS NULL", [idler])).rows) {
    const r = await guncelle(db, MESAJ, m.id, m.surum, { islendi: simdi, islendi_plan: plan.id, islendi_no: plan.no, islendi_rapor: rapor },
      { kim: kim.ad, ne: "say_chat.isle", gerekce: plan.no });
    if (r.durum === "tamam") n++;
  }
  return n;
}

/** işaretin geri alınması — YALNIZ o mesaj (2026-11-08, reisim: "bir fotoğraftan işlendi işareti kalkınca hepsinden kalkıyor"); dosyası silinmiş mesaj geri alınmaz. Dönen: geri alınan sayısı */
export async function isaretGeriAl(db: Sorgulayici, kim: Kisi, cihazId: string): Promise<number> {
  const m = await mesajOku(db, cihazId);
  if (!m?.islendi || m.dosya_silindi) return 0;
  const r = await guncelle(db, MESAJ, m.id, m.surum, { islendi: null, islendi_plan: null, islendi_no: null, islendi_rapor: null },
    { kim: kim.ad, ne: "say_chat.isle_geri", gerekce: m.islendi_no ?? undefined });
  return r.durum === "tamam" ? 1 : 0;
}

/** Geçmişi sil (2026-11-08, reisim: "geçmişi silme tuşu yok o da olsun"): kişinin bütün mesajları (RLS: yalnız kendisininki), işlenmişler dahil; dosyaları çöpe. Dönen: silinen sayısı */
export async function gecmisiSil(db: Sorgulayici, kim: Kisi): Promise<number> {
  let n = 0;
  for (const m of await mesajlariOku(db, { tumu: true })) {
    if (!(await sil(db, MESAJ, m.id, { kim: kim.ad, ne: "say_chat.gecmis_sil" }))) continue;
    if (m.dosya && !m.dosya_silindi) await dosyaCope(db, m.dosya, { kim: kim.ad, ne: "say_chat.gecmis_sil" });
    n++;
  }
  return n;
}

/** dosya erişimi (src/server/dosya/erisim.ts): fotoğrafı / belgeyi yalnız mesajın sahibi açar (RLS: kişi yalnız kendi sohbetini görür) */
export async function chatDosyasiGorulur(db: Sorgulayici, kayitId: string): Promise<boolean> {
  return UUID.test(kayitId) && !!(await db.sorgu("SELECT 1 FROM say_chat_mesaj WHERE cihaz_id = $1 OR eski_kayit = $1", [kayitId])).rowCount;
}

/* ── ÇEVRİMDIŞI KUYRUK (/api/islem) ── */
export const CHAT_ISLEM_TURLERI = ["chat.mesaj", "chat.sil", "saychat.kaydet", "saychat.foto", "saychat.sil"] as const;
export type ChatIslemTuru = (typeof CHAT_ISLEM_TURLERI)[number];
export const chatIslemTuruMu = (t: string): t is ChatIslemTuru => (CHAT_ISLEM_TURLERI as readonly string[]).includes(t);

/** bir sürüm boyunca: eski kayıt işinin girdisi → mesaj (eski kaydın satırları yazı, fotoğrafı fotoğraf mesajı; saat işin geldiği an) */
function eskiGirdi(tur: "saychat.kaydet" | "saychat.foto", girdi: unknown): unknown | null {
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const zaman = new Date().toISOString();
  if (tur === "saychat.foto") {
    return typeof g.veri === "string" ? { tur: "foto", zaman, sira: 0, metin: null, cekim: null, ad: typeof g.ad === "string" ? g.ad.slice(0, 200) : "foto.jpg", veri: g.veri } : null;
  }
  const satirlar = Array.isArray(g.mesaj) ? g.mesaj.filter((x): x is string => typeof x === "string" && !!x.trim() && x.trim() !== "-") : [];
  return satirlar.length ? { tur: "yazi", zaman, sira: 0, metin: satirlar.join("\n").slice(0, 4000), cekim: null, ad: null, veri: null } : null;
}

export async function chatIslemi(db: Sorgulayici, dosya: { depo: Depo; firmaId: string }, kim: Kisi, tur: ChatIslemTuru, cihazId: string, _surum: number,
  girdi: unknown): Promise<ChatYazma> {
  if (tur === "chat.mesaj") return mesajYaz(db, dosya.depo, kim, dosya.firmaId, cihazId, girdi);
  if (tur === "chat.sil") return mesajSil(db, kim, cihazId);
  if (tur === "saychat.sil") return { durum: "tamam", yeniSurum: 0 };
  /* eski kayıt işleri: kayıt kimliği aynı kalabilir (kaydet + foto aynı kayıt) — her biri yeni mesaj kimliğiyle */
  const g = eskiGirdi(tur, girdi);
  return g ? mesajYaz(db, dosya.depo, kim, dosya.firmaId, randomUUID(), g) : { durum: "tamam", yeniSurum: 0 };
}
/** çakışma olmaz (mesaj değişmez) — ucun ortak imzası için */
export async function chatGuncelSurum(db: Sorgulayici, cihazId: string): Promise<number | null> {
  return (await mesajOku(db, cihazId))?.surum ?? null;
}
