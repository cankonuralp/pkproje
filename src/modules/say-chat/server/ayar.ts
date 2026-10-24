/* S.A.Y CHAT AYARLARI (523; pkproje §3.10 m.13–16, maket ekran 12) — Ekipman türleri › tür sayfası. Görür: türü görebilen (modül 5 "gör"); değiştirir:
   ekipman türünü düzenleyebilen (modül 5 "yaz" — ekipman-turleri turDegistirir). Kayıtlı ayar yoksa formattan hazır gelir (sema.ts hazirTanim);
   formatın alanları / başlıkları sonradan değiştiyse olmayanlar düşer ve sayısı söylenir. Yazma güvenli yazıcıdan (sürüm kilidi + denetim izi;
   ilk Kaydet satırı ekler, sonrakiler sürümü artırır). Ayar YENİ kayıtlarda geçerli: gönderilmiş S.A.Y Chat kaydı kendi tanımını taşır (524). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { turDegistirir, turGorur, turOzeti } from "../../ekipman-turleri/server/turler.ts";
import type { FormatTanimi } from "../../../format/tanim.ts";
import { sahaTanimi } from "../../../format/tablo.ts";
import { yayindakiFormat } from "../../rapor-format/server/formatlar.ts";
import { chatAlanlari, chatBasliklari, hazirTanim, tanimDenetle, tanimiSuz, type AlanSecenegi, type BaslikSecenegi, type ChatTanimi, type TanimHatasi } from "../sema.ts";

/* 2026-10-24: serbest tablonun alanları sanal bölümlerinden (format/tablo.ts) */
const sahaFormat = async (db: Sorgulayici, turId: string) => { const f = await yayindakiFormat(db, turId); return f ? { ...f, tanim: sahaTanimi(f.tanim) } : null; };
const AYAR = tablo({ ad: "say_chat_ayar", sutunlar: ["tur_id", "tanim"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface SayChatAyari {
  turId: string;
  /** türün yayında formatı var mı (yoksa yalnız ekipman bilgileri ve yorum seçilir) */
  formatVar: boolean;
  tanim: ChatTanimi;
  /** kayıtlı ayar (yoksa formattan hazır) */
  kayitli: { id: string; surum: number } | null;
  /** formatta artık olmayan satır / başlık sayısı (kayıtlı ayardan düştü) */
  dusen: number;
  alanlar: AlanSecenegi[];
  basliklar: BaslikSecenegi[];
  yaz: boolean;
}

type AyarDb = { id: string; surum: number; tanim: ChatTanimi };
const ayarOku = async (db: Sorgulayici, turId: string) =>
  (await db.sorgu<AyarDb>("SELECT id::text, surum, tanim FROM say_chat_ayar WHERE tur_id = $1", [turId])).rows[0] ?? null;

/** S.A.Y Chat'in (524) kullandığı tanım: kayıtlı ya da hazır, formata göre süzülmüş; sürüm 0 = hazır. Yetki ÇAĞIRANDA. */
export async function chatTanimi(db: Sorgulayici, turId: string): Promise<{ tanim: ChatTanimi; surum: number } | null> {
  if (!UUID.test(turId)) return null;
  const f = await sahaFormat(db, turId), a = await ayarOku(db, turId);
  return { tanim: a ? tanimiSuz(f?.tanim ?? null, a.tanim).tanim : hazirTanim(f?.tanim ?? null), surum: a?.surum ?? 0 };
}

/** tür sayfası: ayar, seçenekler, yazabilir mi; görmeyene / olmayan türe null */
export async function sayChatAyari(db: Sorgulayici, kim: YetkiHesabi, turId: string): Promise<SayChatAyari | null> {
  if (!UUID.test(turId) || !turGorur(kim) || !(await turOzeti(db, turId))) return null;
  const f = (await sahaFormat(db, turId))?.tanim ?? null, a = await ayarOku(db, turId);
  const s = a ? tanimiSuz(f, a.tanim) : null;
  return {
    turId, formatVar: !!f, tanim: s ? s.tanim : hazirTanim(f), kayitli: a ? { id: a.id, surum: a.surum } : null, dusen: s?.dusen ?? 0,
    alanlar: chatAlanlari(f), basliklar: chatBasliklari(f), yaz: turDegistirir(kim),
  };
}

export type AyarYazma = { durum: "tamam"; surum: number } | { durum: "degisiklik_yok"; surum: number } | { durum: "hata"; hata: TanimHatasi }
  | { durum: "cakisma" } | { durum: "yetkisiz" } | { durum: "yok" };

/** sıra ve anahtar düzeninden bağımsız karşılaştırma (veritabanı jsonb anahtarları yeniden sıralar) */
const ayni = (a: ChatTanimi, b: ChatTanimi) =>
  JSON.stringify(a.satirlar.map((s) => [s.ad, s.alan, s.hazir])) === JSON.stringify(b.satirlar.map((s) => [s.ad, s.alan, s.hazir]))
  && JSON.stringify(a.okunacak.map((o) => [o.k, o.acik])) === JSON.stringify(b.okunacak.map((o) => [o.k, o.acik]));

/** Kaydet: surum = ekranın gördüğü kayıtlı sürüm (kayıt yoksa null). Denetim sunucuda yeniden (sema.ts tanimDenetle). */
export async function sayChatAyarKaydet(db: Sorgulayici, kim: YetkiHesabi & { ad: string }, turId: string, surum: number | null, girdi: unknown): Promise<AyarYazma> {
  if (!turDegistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(turId) || !(await turOzeti(db, turId, { kilitle: true }))) return { durum: "yok" };
  const f = (await sahaFormat(db, turId))?.tanim ?? null;
  const d = tanimDenetle(f, girdi);
  if (d.durum === "hata") return d;
  const a = await ayarOku(db, turId);
  const iz = { kim: kim.ad, ne: "say_chat_ayar.kaydet" };
  if (!a) {
    if (surum !== null) return { durum: "cakisma" };
    return { durum: "tamam", surum: (await ekle(db, AYAR, { tur_id: turId, tanim: d.tanim }, iz)).surum };
  }
  if (surum === null || surum !== a.surum) return { durum: "cakisma" };
  if (ayni(a.tanim, d.tanim)) return { durum: "degisiklik_yok", surum: a.surum };
  const g = await guncelle(db, AYAR, a.id, surum, { tanim: d.tanim }, iz);
  return g.durum === "tamam" || g.durum === "degisiklik_yok" ? { durum: g.durum, surum: g.surum } : g.durum === "yok" ? { durum: "yok" } : { durum: "cakisma" };
}

/** 524: kayıt ekranı için türün tanımı + açık okunacak başlıkların adları + formatı (yoksa null — o türde kayıt yazılmaz). Yetki ÇAĞIRANDA. */
export async function chatTuru(db: Sorgulayici, turId: string): Promise<{ tanim: ChatTanimi; surum: number; basliklar: BaslikSecenegi[]; format: FormatTanimi } | null> {
  if (!UUID.test(turId)) return null;
  const f = (await sahaFormat(db, turId))?.tanim ?? null;
  if (!f) return null;
  const a = await ayarOku(db, turId);
  const tanim = a ? tanimiSuz(f, a.tanim).tanim : hazirTanim(f);
  const acik = new Set(tanim.okunacak.filter((o) => o.acik).map((o) => o.k));
  return { tanim, surum: a?.surum ?? 0, basliklar: chatBasliklari(f).filter(([k]) => acik.has(k)), format: f };
}
