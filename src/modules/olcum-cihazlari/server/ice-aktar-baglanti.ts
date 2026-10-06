/* ÖLÇÜM CİHAZLARI ↔ FİRMA AYARLARI (TOPLU İÇE AKTARMA) BAĞLANTISI (337; maket "Toplu içe aktarma (ilk kurulum)" — ölçüm cihazları). Kayıtlı
   kodlar, cihaz türleri ve yeni cihaz buradan. Dosyadaki kalibrasyon bitişi SİSTEM ÖNCESİ bitiştir (göç 0047 ilk_bitis — laboratuvar ve sertifika
   no uydurulmaz): geçerli bitiş, kalibrasyon kaydı açılana kadar ondan. Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { cihazTuruOzetleri } from "./cihazlar.ts";

const CIHAZ = tablo({ ad: "olcum_cihazi", sutunlar: ["kod", "tur_id", "marka", "seri", "aralik", "ilk_bitis"] });

export async function cihazIceAktarimBilgisi(db: Sorgulayici): Promise<{ kodlar: string[]; turler: { id: string; ad: string }[] }> {
  return { kodlar: (await db.sorgu<{ kod: string }>("SELECT kod FROM olcum_cihazi")).rows.map((x) => x.kod), turler: await cihazTuruOzetleri(db) };
}

export async function cihazIceAktar(db: Sorgulayici, iz: Iz, c: { kod: string; turId: string; marka: string | null; seri: string | null; aralik: string | null; bitis: string }): Promise<string> {
  return (await ekle(db, CIHAZ, { kod: c.kod, tur_id: c.turId, marka: c.marka, seri: c.seri, aralik: c.aralik, ilk_bitis: c.bitis }, iz)).id;
}
