/* YÖNETİM › FİRMALAR (348; maket yonetim.html) — yalnız yönetim işleminde (yonetimIslemi: veritabanında yönetim rolü). Firmaların tablolarına
   doğrudan dokunulmaz: liste, açma, dondurma ve geçici parola 0050'deki işlevlerle (her biri yöneticiyi işlemin bağlamından okur, firmanın denetim
   izine ve yönetim izine yazar). Geçici parola burada üretilir, yalnız özeti veritabanına gider; düz hâli YALNIZ bir kez, eylemin yanıtında döner. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { geciciParolaUret } from "../../../server/kimlik/hesapYonetimi.ts";
import { parolaOzeti } from "../../../server/kimlik/parola.ts";
import { firmaAcSemasi } from "../sema.ts";

export type FirmaDurumu = "etkin" | "dondu";
export interface FirmaSatiri {
  id: string; ad: string; kisaAd: string; kod: string; durum: FirmaDurumu; acilis: string; kullanici: number;
  yonetici: { ad: string; eposta: string; durum: "ilk" | "etkin" | "pasif" } | null;
}
export type YonetimSonucu<T = Record<never, never>> = ({ durum: "tamam" } & T) | { durum: "gecersiz"; hatalar: Record<string, string> } | { durum: "red"; neden: string } | { durum: "yok" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
interface Ham { id: string; ad: string; kisa_ad: string; rapor_kodu: string; durum: FirmaDurumu; olusturuldu: Date; kullanici: number; yon_ad: string | null; yon_eposta: string | null; yon_durum: "ilk" | "etkin" | "pasif" | null }
const satir = (r: Ham): FirmaSatiri => ({
  id: r.id, ad: r.ad, kisaAd: r.kisa_ad, kod: r.rapor_kodu, durum: r.durum, acilis: r.olusturuldu.toISOString().slice(0, 10), kullanici: r.kullanici,
  yonetici: r.yon_ad && r.yon_eposta && r.yon_durum ? { ad: r.yon_ad, eposta: r.yon_eposta, durum: r.yon_durum } : null,
});

export async function firmalar(db: Sorgulayici): Promise<FirmaSatiri[]> {
  return (await db.sorgu<Ham>("SELECT id::text, ad, kisa_ad, rapor_kodu, durum, olusturuldu, kullanici, yon_ad, yon_eposta, yon_durum FROM yonetim_firmalar()")).rows.map(satir);
}

export async function firma(db: Sorgulayici, id: string): Promise<FirmaSatiri | null> {
  if (!UUID.test(id)) return null;
  return (await firmalar(db)).find((f) => f.id === id) ?? null;
}

/** firma aç: firma + ilk firma yöneticisi (geçici parola). `ekAyrilmis`: yönetim adresinin etiketi (ortamdan) */
export async function firmaAc(db: Sorgulayici, girdi: unknown, ekAyrilmis: readonly string[] = []): Promise<YonetimSonucu<{ id: string; parola: string; eposta: string; alt: string }>> {
  const g = firmaAcSemasi(ekAyrilmis).safeParse(girdi);
  if (!g.success) {
    const hatalar: Record<string, string> = {};
    for (const i of g.error.issues) { const k = String(i.path[0] ?? "genel"); hatalar[k] ??= i.message; }
    return { durum: "gecersiz", hatalar };
  }
  const d = g.data;
  const parola = geciciParolaUret();
  const r = (await db.sorgu<{ s: { id?: string; hata?: string } }>("SELECT yonetim_firma_ac($1, $2, $3, $4, $5, $6) AS s",
    [d.unvan, d.alt, d.kod, d.yon, d.eposta, await parolaOzeti(parola)])).rows[0].s;
  if (r.hata === "kisa_ad") return { durum: "gecersiz", hatalar: { alt: `${d.alt} kullanılıyor.` } };
  if (r.hata === "rapor_kodu") return { durum: "gecersiz", hatalar: { kod: `${d.kod} başka bir firmada.` } };
  if (r.hata === "ayrilmis") return { durum: "gecersiz", hatalar: { alt: `“${d.alt}” bize ayrılmış; başka bir ad seçin.` } };
  if (!r.id) return { durum: "red", neden: "Firma açılamadı: bilgiler geçersiz." };
  return { durum: "tamam", id: r.id, parola, eposta: d.eposta, alt: d.alt };
}

/** dondur / etkinleştir (dondurulunca firmanın kullanıcı ve müşteri oturumları silinir — 0050) */
export async function firmaDurumu(db: Sorgulayici, id: string, durum: FirmaDurumu): Promise<YonetimSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  const r = (await db.sorgu<{ s: { durum?: string; hata?: string } }>("SELECT yonetim_firma_durum($1, $2) AS s", [id, durum])).rows[0].s;
  if (r.hata === "yok") return { durum: "yok" };
  if (r.hata === "ayni") return { durum: "red", neden: durum === "dondu" ? "Firma zaten dondurulmuş." : "Firma zaten etkin." };
  if (r.hata) return { durum: "red", neden: "İşlem yapılamadı." };
  return { durum: "tamam" };
}

/** ilk firma yöneticisine yeni geçici parola (durum "ilk"; açık oturumları düşer). Düz parola yalnız bu yanıtta. */
export async function yoneticiyeGeciciParola(db: Sorgulayici, id: string): Promise<YonetimSonucu<{ parola: string; eposta: string; ad: string }>> {
  if (!UUID.test(id)) return { durum: "yok" };
  const parola = geciciParolaUret();
  const r = (await db.sorgu<{ s: { eposta?: string; ad?: string; hata?: string } }>("SELECT yonetim_gecici_parola($1, $2) AS s", [id, await parolaOzeti(parola)])).rows[0].s;
  if (r.hata === "yok") return { durum: "yok" };
  if (r.hata === "dondu") return { durum: "red", neden: "Dondurulmuş firmada parola verilmez; önce etkinleştirin." };
  if (r.hata === "hesap_yok") return { durum: "red", neden: "Firmanın yönetici hesabı yok." };
  if (r.hata === "pasif") return { durum: "red", neden: "Firma yöneticisinin hesabı kapalı; firma kendi Personel ekranından açar." };
  if (r.hata || !r.eposta || !r.ad) return { durum: "red", neden: "İşlem yapılamadı." };
  return { durum: "tamam", parola, eposta: r.eposta, ad: r.ad };
}
