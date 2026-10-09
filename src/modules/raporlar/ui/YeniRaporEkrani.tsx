"use client";
/* BAĞLANTISIZ YENİ RAPOR EKRANI (405; ARKA-UC §4.1 "rapor oluşturma (plan günü geldiyse — P1)" çevrimdışı çalışır) — /raporlar/yeni/<plan>#<ekipman>.
   Sayfa plan başına bağlantı varken önceden iner (servis çalışanı saklar); bağlantı yokken plan içindeki "Rapor oluştur" buraya gelir. Rapor
   CİHAZDA, geçici kimlikle, saha rapor ekranının kendisiyle doldurulur (SahaRaporu "yeni" kipi): ilk Kaydet / fotoğraf / Onaya gönder'de raporun
   açılış işi kuyruğa girer; bağlantı gelince sunucu raporu açar (numara, kimlik, kurallar sunucuda) ve ekran raporun kendi sayfasına geçer. Bu
   ekipman için cihazda açılmış rapor varsa aynı geçici kimlikle devam edilir (yazılanlar cihazdan gelir). */
import { useMemo, useState, useSyncExternalStore } from "react";
import { BosDurum } from "../../../components/bos/BosDurum";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import type { SahaRaporu as SahaRaporuVerisi, YeniRaporPaketi } from "../server/raporlar";
import { SahaRaporu } from "./SahaRaporu";

const hashAbone = (f: () => void) => { window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); };
const hashAnlik = () => decodeURIComponent(window.location.hash.slice(1));
const TR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** cihazın şimdiki zamanı Türkiye saatiyle "YYYY-MM-DDTHH:MM" (başlangıç; kullanıcı değiştirebilir, resmî tarihler sunucuda denetlenir) */
const simdi = () => TR.format(new Date()).replace(", ", "T");

export function YeniRaporEkrani({ p }: { p: YeniRaporPaketi }) {
  const ekipmanId = useSyncExternalStore(hashAbone, hashAnlik, () => "");
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const geri = <TusBaglanti tur="ikincil" href={`/planlar/${p.plan.id}`} ikon="arrow-left">Plana dön</TusBaglanti>;
  if (!ekipmanId) return null;   /* adres işaretini (#ekipman) tarayıcı okur — sunucuda boş */
  const e = p.ekipmanlar.find((x) => x.id === ekipmanId);
  if (!e || !p.turler[e.turId]) {
    return <BosDurum ikon="file-question-mark" baslik="Bu ekipmana cihazda rapor açılamaz"
      metin="Ekipmanın bu planda raporu var, ekipman pasif ya da plan bu cihaza indirildiğinden beri değişti. Bağlantı gelince plandan açın." eylemTus={geri} />;
  }
  if (p.neden) return <BosDurum ikon="calendar" baslik="Rapor açılamaz" metin={p.neden} eylemTus={geri} />;
  /* bu ekipmana cihazda daha önce açılmış (sunucuya gitmemiş) rapor: aynı geçici kimlikle devam */
  const onceki = kuyruk.isler.find((x) => x.tur === "rapor.olustur" && x.yer === `${p.plan.id}|${e.id}`)?.kayit ?? null;
  return <YeniIc key={e.id} p={p} e={e} onceki={onceki} />;
}

function YeniIc({ p, e, onceki }: { p: YeniRaporPaketi; e: YeniRaporPaketi["ekipmanlar"][number]; onceki: string | null }) {
  /* geçici kimlik yalnız tarayıcıda (sunucuda çizilmez: adres işareti yalnız tarayıcıda okunur) */
  const [gecici] = useState(() => crypto.randomUUID());
  const [bas] = useState(simdi);
  const id = onceki ?? gecici;
  const t = p.turler[e.turId];
  const v = useMemo((): SahaRaporuVerisi => ({
    id, no: "Yeni rapor", durum: "taslak", surum: 0, olustu: new Date().toISOString(), degisti: new Date().toISOString(), gonderildi: null, bugun: p.bugun,
    plan: p.plan, ekipman: { id: e.id, kod: e.kod, onceki: e.onceki }, tur: t.tur, yazan: p.yazan, kunye: p.kunye, kunyeFark: [],
    ekipmanBilgi: e.ekipmanBilgi, tarih: { bas, bit: null, sonraki: null, takip: null, rapor: null },
    cevaplar: t.ilk, tanim: t.tanim, formatSira: t.formatSira, cihazlar: t.cihazlar, fotolar: [], secilebilir: {},
    kopyaKaynak: null, guncelFormat: null, mesaiDolu: false, geri: null, revize: null, imza: null, imzali: null,
    izin: { duzenle: true, sil: false, kopyala: false }, yz: false, kaynak: { standartlar: p.standartlar, kriterler: t.kriterler },
  }), [id, p, e, t, bas]);
  const yeni = useMemo(() => ({ plan: p.plan.id, ekipman: e.id, kod: e.kod }), [p.plan.id, e.id, e.kod]);
  return (
    <>
      {onceki && <Serit tur="bilgi" ikon="wifi-off">Bu ekipmana bu cihazda daha önce açtığınız rapor gösteriliyor.</Serit>}
      <SahaRaporu key={id} v={v} yeni={yeni} />
    </>
  );
}
