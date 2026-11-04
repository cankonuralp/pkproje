/* YÖNETİM › FİRMA › YEDEK (2026-11-04; reisim: "tamam koda başla" — maket claude.ai THfrK3AzKkg9S7DiRVKKF4 ekran 2–3; sunum K1: geri yükleme
   YALNIZ Yönetim'den). Firmanın yedek durumu (Drive bağlantısı, gönderim, Drive denetimi, son doğrulama, probata arşivi, geri yüklemeler),
   "Şimdi doğrula", geri yükleme denemesi, geri yükleme ve önceki hâle dönüş. İş firmanın kendi işleminde (firmaHavuzuKimlikle — ortak firmada
   merkez, kendi projelide firmanın havuzu); kayıt ve kurallar src/server/yedek/ (hal, dogrula, geri-yukle). Geri yükleme ve dönüş firmanın kısa
   adı yazılmadan yapılmaz (onay sunucuda da denetlenir). */
import "server-only";
import { firmaHavuzuKimlikle } from "../../../server/db/firma-havuzu";
import { kiraciIcinde, type Havuz } from "../../../server/db/kiraci";
import { depo } from "../../../server/dosya/depo";
import { ortamHizmeti } from "../../../server/yedek/calis";
import { firmaDogrula, type DogrulamaOzeti } from "../../../server/yedek/dogrula";
import { geriDon, geriYukle, geriYuklemeDenemesi, type GeriYuklemeDenemesi, type GeriYuklemeSonucu } from "../../../server/yedek/geri-yukle";
import { HalHatasi, type HalKaynagi } from "../../../server/yedek/hal";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface YedekYonetimGorunumu {
  baglanti: { saglayici: "gdrive" | "onedrive"; durum: "bagli" | "kopuk" | "dolu" | "kesildi"; sonKopya: string | null; denetim: string | null;
    bekleyen: number; gonderilen: number } | null;
  tasinan: number;
  dogrulama: { zaman: string; kaynak: "drive" | "arsiv"; tamam: boolean; ozet: DogrulamaOzeti } | null;
  arsiv: { tam: string[]; aylar: string[] };
  geriYuklemeler: { id: string; basladi: string; kim: string; kaynak: HalKaynagi; an: string | null; durum: "suruyor" | "tamam" | "hata";
    ozet: Record<string, unknown>; geriDon: boolean }[];
}

async function havuz(id: string): Promise<Havuz | null> {
  return UUID.test(id) ? firmaHavuzuKimlikle(id) : null;
}
const iso = (t: Date | null | undefined) => (t ? t.toISOString() : null);

export async function yedekYonetimGorunumu(id: string): Promise<YedekYonetimGorunumu | null> {
  const h = await havuz(id);
  if (!h) return null;
  return kiraciIcinde(h, id, async (db) => {
    const b = (await db.sorgu<{ saglayici: "gdrive" | "onedrive"; durum: "bagli" | "kopuk" | "dolu" | "kesildi"; son_kopya: Date | null; denetim: Date | null }>(
      "SELECT saglayici, durum, son_kopya, denetim FROM bulut_baglanti LIMIT 1")).rows[0];
    const q = (await db.sorgu<{ b: number; g: number }>(
      "SELECT count(*) FILTER (WHERE durum = 'bekliyor')::int AS b, count(*) FILTER (WHERE durum = 'gonderildi')::int AS g FROM bulut_kuyruk")).rows[0]!;
    const d = (await db.sorgu<{ zaman: Date; kaynak: "drive" | "arsiv"; tamam: boolean; ozet: DogrulamaOzeti }>(
      "SELECT zaman, kaynak, tamam, ozet FROM yedek_dogrulama ORDER BY zaman DESC LIMIT 1")).rows[0];
    const a = (await db.sorgu<{ tur: "tam" | "ay"; donem: string }>("SELECT tur, donem FROM yedek_arsiv WHERE tur IN ('tam', 'ay') ORDER BY donem")).rows;
    const g = (await db.sorgu<{ id: string; basladi: Date; kim: string; kaynak: HalKaynagi; yedek_ani: Date | null; durum: "suruyor" | "tamam" | "hata";
      ozet: Record<string, unknown>; once: boolean }>(
      `SELECT g.id::text, g.basladi, g.kim, g.kaynak, g.yedek_ani, g.durum, g.ozet,
         EXISTS (SELECT 1 FROM yedek_arsiv a WHERE a.id = g.once_arsiv AND a.tur = 'once') AS once
       FROM yedek_geri_yukleme g ORDER BY g.basladi DESC LIMIT 5`)).rows;
    const tasinan = (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM saklama_silme WHERE neden = 'drive'")).rows[0]!.n;
    return {
      baglanti: b ? { saglayici: b.saglayici, durum: b.durum, sonKopya: iso(b.son_kopya), denetim: iso(b.denetim), bekleyen: q.b, gonderilen: q.g } : null,
      tasinan,
      dogrulama: d ? { zaman: d.zaman.toISOString(), kaynak: d.kaynak, tamam: d.tamam, ozet: d.ozet } : null,
      arsiv: { tam: a.filter((x) => x.tur === "tam").map((x) => x.donem), aylar: a.filter((x) => x.tur === "ay").map((x) => x.donem) },
      geriYuklemeler: g.map((x) => ({ id: x.id, basladi: x.basladi.toISOString(), kim: x.kim, kaynak: x.kaynak, an: iso(x.yedek_ani), durum: x.durum,
        ozet: x.ozet, geriDon: x.once && x.durum === "tamam" })),
    };
  });
}

export type YedekYonetimSonucu<T> = { durum: "tamam"; deger: T } | { durum: "red"; neden: string };
const red = (neden: string) => ({ durum: "red" as const, neden });
const hataMetni = (e: unknown) => (e instanceof HalHatasi ? e.message : e instanceof Error && /zip/i.test(e.message) ? "Yedek dosyası açılamadı." : null);

export async function yedekDogrulaYonet(id: string): Promise<YedekYonetimSonucu<{ tamam: boolean; ozet: DogrulamaOzeti }>> {
  const h = await havuz(id);
  if (!h) return red("Firmanın veritabanına ulaşılamadı.");
  const r = await firmaDogrula(h, id, depo(), { hizmetBul: ortamHizmeti });
  return { durum: "tamam", deger: { tamam: r.tamam, ozet: r.ozet } };
}

const KAYNAK = new Set<HalKaynagi>(["drive", "arsiv"]);

export async function yedekDenemeYonet(id: string, kaynak: string): Promise<YedekYonetimSonucu<GeriYuklemeDenemesi>> {
  if (!KAYNAK.has(kaynak as HalKaynagi)) return red("Kaynak seçin.");
  const h = await havuz(id);
  if (!h) return red("Firmanın veritabanına ulaşılamadı.");
  try { return { durum: "tamam", deger: await geriYuklemeDenemesi(h, id, depo(), { kaynak: kaynak as HalKaynagi, hizmetBul: ortamHizmeti }) }; } catch (e) {
    const m = hataMetni(e);
    if (m) return red(m);
    throw e;
  }
}

/** kısa ad yazılmadan geri yükleme / dönüş yok (ekran da ister; sunucu yeniden denetler) */
export async function yedekGeriYukleYonet(id: string, s: { kaynak: string; onay: string; kisaAd: string; kim: string }): Promise<YedekYonetimSonucu<GeriYuklemeSonucu>> {
  if (!KAYNAK.has(s.kaynak as HalKaynagi)) return red("Kaynak seçin.");
  if (s.onay.trim() !== s.kisaAd) return red(`Onay için firmanın kısa adını yazın: ${s.kisaAd}`);
  const h = await havuz(id);
  if (!h) return red("Firmanın veritabanına ulaşılamadı.");
  try { return { durum: "tamam", deger: await geriYukle(h, id, depo(), { kaynak: s.kaynak as HalKaynagi, kim: s.kim, hizmetBul: ortamHizmeti }) }; } catch (e) {
    const m = hataMetni(e);
    if (m) return red(m);
    throw e;
  }
}

export async function yedekGeriDonYonet(id: string, s: { geriYukleme: string; onay: string; kisaAd: string; kim: string }): Promise<YedekYonetimSonucu<GeriYuklemeSonucu>> {
  if (s.onay.trim() !== s.kisaAd) return red(`Onay için firmanın kısa adını yazın: ${s.kisaAd}`);
  const h = await havuz(id);
  if (!h) return red("Firmanın veritabanına ulaşılamadı.");
  try { return { durum: "tamam", deger: await geriDon(h, id, depo(), { geriYukleme: s.geriYukleme, kim: s.kim, hizmetBul: ortamHizmeti }) }; } catch (e) {
    const m = hataMetni(e);
    if (m) return red(m);
    throw e;
  }
}
