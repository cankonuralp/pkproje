/* TALEPLER (maket talepler.html; 330; modül 21): personelin kendi talepleri — yıllık izin özeti, izin talepleri ve masraf formları; "İzin talebi"
   ve "Masraf formu" pencereleri; talep penceresi (belge, geri çekme). Talepler'e giremeyen ya da hesabı bir personele bağlı olmayan: yetkisiz
   ya da boş durum. 477 (Talepler–Onaylar kararları T1 · T3): yalnız kişinin kendi talepleri — onaylayana gelenler Onaylar › Talepler'de. */
import type { Metadata } from "next";
import { BosDurum } from "../../../components/bos/BosDurum";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { bugunTr, taleplerim } from "../../../modules/talepler/server/talepler";
import { TaleplerSayfasi } from "../../../modules/talepler/ui/Talepler";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("talepler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => taleplerim(db, o));
  if (!v) return <BosDurum ikon="user" baslik="Personel kaydı yok" metin="Hesabınız bir personel kaydına bağlı değil; talep gönderilemez." />;
  return <TaleplerSayfasi v={v} bugun={bugunTr()} />;
}
