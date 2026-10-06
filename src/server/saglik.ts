/* SAĞLIK (350; 09-G5 duman testi, 06) — /api/saglik ve tools/duman.mjs bunu okur. Her denetim evet / hayır; ayrıntı (tablo adı, sayı) dışarı verilmez.
   · veritabani: bağlanılıp sorgu döndü mü · goc_guncel: veritabanındaki son göç kodun beklediği mi (SON_GOC) · rls: firma_id taşıyan her tabloda RLS
     açık + zorlanmış + politikalı mı · api_kapali: Supabase API rolleri şemaya giremiyor mu · uygulama_kisitli: uygulama rolü süper kullanıcı / RLS'yi
     aşan değil mi. Hepsi doğruysa durum "tamam". */
import { havuz } from "./db/havuz.ts";
import { saglikOku, type SaglikVerisi } from "./db/saglik.ts";
import { SON_GOC } from "./db/son-goc.ts";

export interface Saglik { durum: "tamam" | "sorun"; surum: string; denetimler: Record<"veritabani" | "goc_guncel" | "rls" | "api_kapali" | "uygulama_kisitli", boolean> }

/** saf: veriden denetimler (null = veritabanına ulaşılamadı) */
export function saglikDegerlendir(v: SaglikVerisi | null, sonGoc = SON_GOC, surum = "yerel"): Saglik {
  const d = {
    veritabani: v !== null,
    goc_guncel: v?.son_goc === sonGoc,
    rls: !!v && v.kiraci_tablo > 0 && v.rls_eksik === 0 && v.politikasiz === 0,
    api_kapali: !!v && v.api_sema === false,
    uygulama_kisitli: !!v && v.uygulama_ayricalikli === false,
  };
  return { durum: Object.values(d).every(Boolean) ? "tamam" : "sorun", surum, denetimler: d };
}

export async function saglik(): Promise<Saglik> {
  let v: SaglikVerisi | null = null;
  try { v = await saglikOku(havuz()); } catch (h) { console.error("[sağlık] veritabanı denetimi düştü:", (h as Error).message); }
  return saglikDegerlendir(v, SON_GOC, (process.env.VERCEL_GIT_COMMIT_SHA ?? "yerel").slice(0, 7));
}
