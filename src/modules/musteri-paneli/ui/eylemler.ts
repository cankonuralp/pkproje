"use server";
/* MÜŞTERİ PANELİ SUNUCU EYLEMLERİ (577) — müşteri oturumu ve kiracı istekten; veri müşteri işleminde (veritabanında müşteri rolü — kısıtlayıcı
   politikalar). İstemciden gelen süzgeç durumu yalnız değer olarak (biçim denetimi bellekteListele'de); yetki vermez. Oturumsuza / başka kökene null. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { musteriIslemi, musteriIstekOturumu } from "../../../server/kimlik/istek";
import type { Sorgulayici } from "../../../server/db/kiraci";
import type { SunucuListe } from "../../../components/liste/suzgec";
import type { MusteriRaporu, MusteriUygunsuzlukSatiri } from "../../raporlar/server/musteri-baglanti";
import { panelRaporlariSuz, panelRaporSayfasi, panelUygunsuzluklariSuz, panelUygunsuzlukSayfasi } from "../server/panel";

async function musteriyle<T>(is: (db: Sorgulayici) => Promise<T>): Promise<T | null> {
  if (!(await ayniKoken())) return null;
  const o = await musteriIstekOturumu();
  return o ? musteriIslemi(o, is) : null;
}

/** Raporlarınız'ın bir sayfası */
export async function panelRaporSayfasiEylemi(durum: unknown): Promise<SunucuListe<MusteriRaporu> | null> {
  return (await musteriyle((db) => panelRaporSayfasi(db, durum)))?.ilk ?? null;
}
/** Excel / toplu ZIP: süzülen bütün raporlar */
export async function panelRaporlariSuzEylemi(durum: unknown): Promise<MusteriRaporu[] | null> {
  return musteriyle((db) => panelRaporlariSuz(db, durum));
}
/** Uygunsuzluklar'ın bir sayfası */
export async function panelUygunsuzlukSayfasiEylemi(durum: unknown): Promise<SunucuListe<MusteriUygunsuzlukSatiri> | null> {
  return (await musteriyle((db) => panelUygunsuzlukSayfasi(db, durum)))?.ilk ?? null;
}
/** toplu ZIP: süzülen bütün uygunsuzluklar · "acik": Excel penceresi — bütün açık uygunsuzluklar */
export async function panelUygunsuzluklariSuzEylemi(durum: unknown): Promise<MusteriUygunsuzlukSatiri[] | null> {
  return musteriyle((db) => panelUygunsuzluklariSuz(db, durum));
}
