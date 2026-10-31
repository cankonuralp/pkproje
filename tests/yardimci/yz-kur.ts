/* TEST / UÇTAN UCA KURULUMU: firmada yapay zekâyı aç / kapa, sınır ve anahtar (2026-10-25, göç 0106). Uygulama rolü bunları artık yazamaz (yalnız
   Yönetim — firma_yonetim_yz / firma_yonetim_sir); testler ve e2e tohumu SAHİP bağlantısıyla yazar (göç ve test kurulumu bağlantısı — gömülü
   kümenin sahipIstemci'si). Değerler ayar.ts / sir.ts'in kendi yazıcılarından geçer (şema, şifreleme aynı). */
import { ayarOku, ayarYaz } from "../../src/server/ayar/ayar.ts";
import { sirYaz } from "../../src/server/ayar/sir.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { KOSUL_SURUMU } from "../../src/server/yz/kosul.ts";

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
  /* 2026-10-31 (kalem 7): yapay zekâ açılınca firmanın hesapları koşulları kabul etmiş sayılır (kabul ekranı ayrıca denenir) */
  if (d.acik === true) await kosulKur(kume, firmaId, KOSUL_SURUMU);
}

/** 2026-10-31 (kalem 7 — M6, göç 0110): testlerde ve e2e tohumunda S.A.Y'ın kullanım koşulları kabulü — firmanın her hesabı güncel sürümü kabul etmiş
    (firma kabulü ilk firma yöneticisinden); kabul ekranının kendisini e2e ayrıca dener. Sahip bağlantısıyla, her satır kendi kişisinin bağlamında. */
export async function kosulKur(kume: Pick<GomuluKume, "sahipIstemci">, firmaId: string, surum: string): Promise<void> {
  const s = kume.sahipIstemci();
  await s.connect();
  try {
    await s.query("BEGIN");
    await s.query("SELECT set_config('app.firma_id', $1, true)", [firmaId]);
    const hesaplar = (await s.query<{ id: string; yonetici: boolean }>(
      "SELECT id::text, 'firma_yoneticisi' = ANY (roller) AS yonetici FROM hesap WHERE firma_id = $1 ORDER BY olustu", [firmaId])).rows;
    let firma = (await s.query("SELECT 1 FROM kosul_kabul WHERE firma_id = $1 AND tur = 'firma' AND surum = $2", [firmaId, surum])).rows.length > 0;
    for (const h of hesaplar) {
      await s.query("SELECT set_config('app.hesap_id', $1, true)", [h.id]);
      if (!firma && h.yonetici) { await s.query("INSERT INTO kosul_kabul (tur, surum) VALUES ('firma', $1)", [surum]); firma = true; }
      if (!(await s.query("SELECT 1 FROM kosul_kabul WHERE hesap_id = $1 AND tur = 'kullanici' AND surum = $2", [h.id, surum])).rows.length) {
        await s.query("INSERT INTO kosul_kabul (tur, surum) VALUES ('kullanici', $1)", [surum]);
      }
    }
    if (!firma && hesaplar[0]) {
      await s.query("SELECT set_config('app.hesap_id', $1, true)", [hesaplar[0].id]);
      await s.query("INSERT INTO kosul_kabul (tur, surum) VALUES ('firma', $1)", [surum]);
    }
    await s.query("COMMIT");
  } catch (h) {
    await s.query("ROLLBACK").catch(() => undefined);
    throw h;
  } finally {
    await s.end();
  }
}
