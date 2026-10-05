/* PERSONEL › ROL YETKİLERİ (maket personel.html #/roller; reisim 32). Kapı sunucuda (modül 2); düzenleme yalnız firma yöneticisi (canDoEylem). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul, MODUL_GRUPLARI } from "../../../../modules/moduller";
import { RolYetkileri, type MatrisSatiri } from "../../../../modules/personel/ui/RolYetkileri";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { canDoEylem } from "../../../../server/yetki/canDo";
import { matrisOku } from "../../../../server/yetki/matris";
import { MATRIS_ONERI, SABIT } from "../../../../server/yetki/tanim";
import { izinYonetir } from "../../../../modules/talepler/server/talepler";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: "Rol yetkileri" };

/* satırlar maketteki gibi: menüdeki modüller (grubuyla) + hareket kaydı */
const SATIRLAR: MatrisSatiri[] = [
  ...MODUL_GRUPLARI.flatMap((g) => g.moduller.filter((m) => String(m.no) in MATRIS_ONERI).map((m) => ({ no: String(m.no), ad: m.ad, ikon: m.ikon, grup: g.grup }))),
  { no: "hareket", ad: "Hareket kaydı", ikon: "shield-check", grup: "Kim, ne zaman, ne yaptı" },
];

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { matris, surum } = await oturumIslemi(o, (db) => matrisOku(db));
  const sabit = Object.fromEntries(Object.entries(SABIT).map(([k, v]) => [k, Object.keys(v ?? {})]));
  return <RolYetkileri satirlar={SATIRLAR} matris={matris as unknown as Record<string, string[]>} oneri={MATRIS_ONERI as unknown as Record<string, string[]>}
    sabit={sabit} surum={surum} duzenleyebilir={canDoEylem(o, "rol_yetki_degistir")} izinler={izinYonetir(o)} />;
}
