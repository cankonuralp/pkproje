"use server";
/* ANA SAYFA / KABUK SUNUCU EYLEMLERİ — yan menü takip balonları (339). Kişi ve kiracı oturumdan; sayılar modüllerin yetkiye duyarlı işlevlerinden
   (server/takip.ts). Sayfa çizimini bekletmez: kabuk sayfa açılınca ister. Oturum yoksa ya da istek başka kökenden gelmişse boş. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { menuTakip, type MenuTakip } from "../server/takip";

export async function menuTakipEylemi(): Promise<MenuTakip> {
  if (!(await ayniKoken())) return {};
  const o = await istekOturumu();
  if (!o) return {};
  return oturumIslemi(o, (db) => menuTakip(db, o));
}
