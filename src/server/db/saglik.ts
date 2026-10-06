/* SAĞLIK DENETİMİ OKUYUCUSU (350; 09-G5) — saglik_denetimi() (0051, ikinci hâli 0053): yalnız sayılar ve son göçün adı (firma verisi yok). Uygulama rolüyle, kiracı
   bağlamı gerekmez (işlev tanımlayıcının haklarıyla şema bilgisini okur). pg yalnız src/server/db'de. */
import type { Havuz } from "./kiraci.ts";

export interface SaglikVerisi {
  son_goc: string | null;
  /** uygulanmış göç sayısı (0053) */
  goc_sayisi: number;
  kiraci_tablo: number;
  rls_eksik: number;
  politikasiz: number;
  api_sema: boolean;
  uygulama_ayricalikli: boolean;
}

export async function saglikOku(havuz: Havuz): Promise<SaglikVerisi> {
  return (await havuz.query<{ s: SaglikVerisi }>("SELECT saglik_denetimi() AS s")).rows[0].s;
}
