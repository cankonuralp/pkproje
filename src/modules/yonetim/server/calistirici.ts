/* YÖNETİM İŞLEMLERİNİN ÇALIŞTIRICISI (FIRMA-VT §5.11, FV9 — 2026-10-16): merkezde yönetim işlemi (yonetimIslemi — yönetim rolü + oturumdaki yönetici),
   kendi projeli firmanın veritabanında yönetim işlemi (yonetimFirmadaIcinde — firmanın havuzu, yöneticinin e-postası, vt_firma_dogrula). Yalnız sunucuda,
   yönetim oturumuyla (yönetici istemciden alınmaz). Sıra ve kurallar firma-tarafi.ts'te. */
import "server-only";
import { firmaHavuzu } from "../../../server/db/firma-havuzu";
import { yonetimFirmadaIcinde } from "../../../server/db/kiraci";
import type { YoneticiOturumu } from "../../../server/yonetim/giris";
import { yonetimIslemi } from "../../../server/yonetim/istek";
import type { YonetimCalistirici } from "./firma-tarafi";

export function yonetimCalistirici(o: YoneticiOturumu): YonetimCalistirici {
  return {
    merkez: (is) => yonetimIslemi(o, is),
    firmada: (kayit, firmaId, is) => yonetimFirmadaIcinde(firmaHavuzu(kayit), firmaId, is, { yoneticiEposta: o.eposta }),
  };
}
