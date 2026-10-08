/* SAĞLIK (350; 09-G5 duman testi, 06) — /api/saglik ve tools/duman.mjs bunu okur. Her denetim evet / hayır; ayrıntı (tablo adı, sayı) dışarı verilmez.
   · veritabani: bağlanılıp sorgu döndü mü · goc_guncel: veritabanındaki son göç VE göç sayısı kodun beklediği mi (SON_GOC, GOC_SAYISI — 354: arada
     atlanmış göç) · rls: firma_id taşıyan her tabloda RLS açık + zorlanmış + politikalı mı · api_kapali: Supabase API rolleri (anon / authenticated /
     service_role) şemaya giremiyor mu · uygulama_kisitli: BAĞLANAN rol (354: adı sabit rol değil) uygulama rolü ve süper kullanıcı / RLS'yi aşan ya da
     öyle bir rolün üyesi değil mi · isler (383): 1 saatten uzun "çalışıyor"da kalan arka plan işi yok mu. Hepsi doğruysa durum "tamam". */
import { havuz } from "./db/havuz.ts";
import { saglikOku, type SaglikVerisi } from "./db/saglik.ts";
import { GOC_SAYISI, SON_GOC } from "./db/son-goc.ts";

export interface Saglik { durum: "tamam" | "sorun"; surum: string; denetimler: Record<"veritabani" | "goc_guncel" | "rls" | "api_kapali" | "uygulama_kisitli" | "isler", boolean> }

/** saf: veriden denetimler (null = veritabanına ulaşılamadı) */
export function saglikDegerlendir(v: SaglikVerisi | null, beklenen: { son: string; sayi: number } = { son: SON_GOC, sayi: GOC_SAYISI }, surum = "yerel"): Saglik {
  const d = {
    veritabani: v !== null,
    goc_guncel: !!v && v.son_goc === beklenen.son && Number(v.goc_sayisi) === beklenen.sayi,
    rls: !!v && v.kiraci_tablo > 0 && v.rls_eksik === 0 && v.politikasiz === 0,
    api_kapali: !!v && v.api_sema === false,
    uygulama_kisitli: !!v && v.uygulama_ayricalikli === false,
    isler: !!v && Number(v.takili_is) === 0,
  };
  return { durum: Object.values(d).every(Boolean) ? "tamam" : "sorun", surum, denetimler: d };
}

export async function saglik(): Promise<Saglik> {
  let v: SaglikVerisi | null = null;
  try { v = await saglikOku(havuz()); } catch (h) { console.error("[sağlık] veritabanı denetimi düştü:", (h as Error).message); }
  return saglikDegerlendir(v, { son: SON_GOC, sayi: GOC_SAYISI }, (process.env.VERCEL_GIT_COMMIT_SHA ?? "yerel").slice(0, 7));
}
