/* UYGULAMA DÜZENİ — oturum ister (09-E2/E4). Oturum yoksa girişe; menü yalnız kişinin görebildiği modüller (canDo, sunucuda). Kişinin rolleri
   veritabanından okunur; tarayıcıya yalnız ad, rol ADI ve çevrimdışı kuyruğun yazan etiketi gider (kimlik, e-posta, rol kodu gönderilmez). S.A.Y (380) her firma sayfasında tek
   bileşen: firmada açık mı kendisi sorar (sayfa değişince düşmez, geçmiş kişinin hesabında). */
import type { ReactNode } from "react";
import { Kabuk } from "../../components/kabuk/Kabuk";
import { menuTakipEylemi } from "../../modules/anasayfa/ui/eylemler";
import { cevrimdisiPaketiEylemi } from "../../modules/planlar/ui/eylemler";
import { SayAsistan } from "../../modules/say/ui/SayAsistan";
import { MODULLER } from "../../modules/moduller";
import { yazanEtiketi } from "../../server/islem/yazan";
import { modulGorur, oturumGerekli } from "../../server/kimlik/istek";
import { ROL_ADI, type Rol } from "../../server/yetki/tanim";
import type { ModulAnahtari } from "../../server/yetki/tanim";

/** sahada çalışan roller (denetime çıkar, rapor yazar) */
const SAHA_ROLLERI: readonly Rol[] = ["denetci", "mekanik_yonetici", "elektrik_yonetici"];

export default async function UygulamaDuzeni({ children }: { children: ReactNode }) {
  const o = await oturumGerekli();
  const gorunur = MODULLER.filter((m) => modulGorur(o, m.no as ModulAnahtari)).map((m) => m.no);
  const rol = o.roller.map((r) => ROL_ADI[r]).join(" · ") || "Rolsüz";
  /* 394: çevrimdışı kuyruğun yazan etiketi (kimlik değil, ondan türetilen özet) · 402: sayfa saklama ve önceden indirme yalnız sahada çalışana
     (rapor yazan / denetime çıkan roller) — ofiste cihaz ve sunucu boşuna yorulmaz */
  const saha = o.roller.some((r) => SAHA_ROLLERI.includes(r));
  return <><Kabuk kullanici={{ ad: o.ad, rol, yazan: yazanEtiketi(o.id) }} gorunur={gorunur} takip={menuTakipEylemi} paket={saha ? cevrimdisiPaketiEylemi : undefined}>{children}</Kabuk><SayAsistan /></>;
}
