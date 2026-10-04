/* YETKİSİZ ve BULUNAMADI ekranları (S2, reisim 2026-09-30: "3 bu ekranları ekle"; maket hata.html). Yol gösteren tek cümle ve iki tuş.
   Hangi kaydın var olduğu SÖYLENMEZ: yetkisiz ekranda kaydın adı / numarası yazmaz (sızma yok). */
import { BosDurum } from "../bos/BosDurum";
import { TusBaglanti } from "../tus/Tus";
import { GeriTus } from "./GeriTus";
import stil from "./Hata.module.css";

const tuslar = <div className={stil.tuslar}><TusBaglanti tur="birincil" href="/" ikon="house">Ana sayfaya dön</TusBaglanti><GeriTus /></div>;

export function Yetkisiz() {
  return <BosDurum ikon="lock" baslik="Bu sayfayı görme yetkiniz yok" metin="Rolünüz bu bölümü kapsamıyor. Gerekiyorsa firma yöneticinizden yetki isteyin." eylemTus={tuslar} />;
}

export function Bulunamadi() {
  return <BosDurum ikon="file-question-mark" baslik="Sayfa bulunamadı" metin="Adres yanlış yazılmış ya da kayıt kaldırılmış olabilir." eylemTus={tuslar} />;
}
