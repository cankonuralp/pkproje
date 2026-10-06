/* PERSONEL KARTI GÖRME KURALI — tek yer (personelKarti, kart dosyaları ve Onaylar'da imzalanan zimmet formunun dosyası aynı kuralla; 340–345
   incelemesi). "gör" / "yaz" düzeyi herkesin kartını, "kendi" / "branş" düzeyi yalnız kendi kartını görür; kişi bu firmada olmalı. Yalnız Personel
   modülünün kendi tablosunu okur; öteki modüller (Onaylar) buradan sorar. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { canDo, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";

const MODUL = 2;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function personelKartiGorur(db: Sorgulayici, kim: YetkiHesabi, personelId: string): Promise<boolean> {
  if (!UUID.test(personelId) || !canDo(kim, MODUL, "gor")) return false;
  const d = duzey(kim, MODUL);
  if ((d === "kendi" || d === "brans") && (await hesabinPersoneli(db, kim.id)) !== personelId) return false;
  return !!(await db.sorgu("SELECT 1 FROM personel WHERE id = $1", [personelId])).rowCount;
}
