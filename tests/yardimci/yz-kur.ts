/* TEST / UÇTAN UCA KURULUMU: firmada yapay zekâyı aç / kapa, sınır ve anahtar (2026-10-25, göç 0106). Uygulama rolü bunları artık yazamaz (yalnız
   Yönetim — firma_yonetim_yz / firma_yonetim_sir); testler ve e2e tohumu SAHİP bağlantısıyla yazar (göç ve test kurulumu bağlantısı — gömülü
   kümenin sahipIstemci'si). Değerler ayar.ts / sir.ts'in kendi yazıcılarından geçer (şema, şifreleme aynı). */
import { ayarOku, ayarYaz } from "../../src/server/ayar/ayar.ts";
import { sirYaz } from "../../src/server/ayar/sir.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";

export interface YzKurulumu { acik?: boolean; sinir?: number | null; anahtar?: string | null }
export async function yzKur(kume: Pick<GomuluKume, "sahipIstemci">, firmaId: string, d: YzKurulumu): Promise<void> {
  const s = kume.sahipIstemci();
  await s.connect();
  try {
    await s.query("BEGIN");
    await s.query("SELECT set_config('app.firma_id', $1, true)", [firmaId]);
    const db = { sorgu: (metin: string, degerler?: readonly unknown[]) => s.query(metin, degerler as unknown[]) } as Parameters<typeof ayarOku>[0];
    if (d.acik !== undefined || d.sinir !== undefined) {
      const m = await ayarOku(db, "yapay_zeka");
      const r = await ayarYaz(db, "yapay_zeka", m.surum, { ...m.deger, ...(d.acik !== undefined ? { acik: d.acik } : {}), ...(d.sinir !== undefined ? { sinir: d.sinir } : {}) },
        { kim: "Test kurulumu", ne: "ayar.yapay_zeka" });
      if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") throw new Error(`yapay zekâ ayarı yazılamadı: ${JSON.stringify(r)}`);
    }
    if (d.anahtar !== undefined) await sirYaz(db, "yapay_zeka_anahtari", d.anahtar, { kim: "Test kurulumu" });
    await s.query("COMMIT");
  } catch (h) {
    await s.query("ROLLBACK").catch(() => undefined);
    throw h;
  } finally {
    await s.end();
  }
}
