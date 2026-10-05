"use client";
/* TEKLİFLER LİSTESİ (maket teklifler.html #/ — SUTUN, suzgecTanimla "t"): en yeni üstte; sütunlar Teklif no (tarih) · Müşteri / tesis · Kalem ·
   Tutar (KDV hariç) · Geçerlilik · Durum. Çipler: Taslak · Gönderildi · Kabul edildi · Red ya da süresi doldu (aynı grup) · Geçerliliği 7 gün
   içinde bitiyor; seçici Müşteri. "Teklif hazırla" yalnız "yaz" düzeyine. Görme ve karar sunucuda. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { TusBaglanti } from "../../../components/tus/Tus";
import { para, TEKLIF_DURUM } from "../sema";
import type { TeklifSatiri } from "../server/teklifler";
import { gunFarki } from "./ortak";
import stil from "./teklifler.module.css";

const SUTUNLAR: Sutun<TeklifSatiri>[] = [
  { k: "no", genislik: "16%", baslik: "Teklif no", kart: "ust", sira: 1, hucre: (t) => <><Link className={stil.no} href={`/teklifler/${t.id}`}>{t.no}</Link><AltSatir>{tarihNo(t.tarih)}</AltSatir></> },
  { k: "musteri", genislik: "26%", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: (t) => <span><Kirp>{t.musteri}</Kirp><AltSatir><Kirp>{t.tesis}</Kirp></AltSatir></span> },
  { k: "kalem", genislik: "14%", baslik: "Kalem", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Kalem</KartEtiket>{t.kalemSayisi} tür · {t.ekipmanSayisi} ekipman</> },
  { k: "tutar", genislik: "16%", baslik: "Tutar (KDV hariç)", kart: "govde", sira: 4, hucre: (t) => <><KartEtiket>Tutar (KDV hariç)</KartEtiket><span className={stil.sayi}>{para(t.tutar)}</span></> },
  { k: "gecerlilik", genislik: "16%", baslik: "Geçerlilik", kart: "govde", sira: 5, hucre: (t) => {
    const k = t.bitis ? gunFarki(t.bitis) : null;
    return <><KartEtiket>Geçerlilik</KartEtiket>{t.durum === "gonderildi" && t.bitis && k !== null
      ? <span><span className={stil.sayi}>{tarihNo(t.bitis)}</span><AltSatir uyari={k <= 7}>{k} gün kaldı</AltSatir></span>
      : (t.durum === "kabul" || t.durum === "red") && t.sonuc ? <AltSatir>{TEKLIF_DURUM[t.durum][0]} {tarihNo(t.sonuc)}</AltSatir> : <span className={stil.yok}>—</span>}</>;
  } },
  { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (t) => <Rozet tur={TEKLIF_DURUM[t.durum][1]}>{TEKLIF_DURUM[t.durum][0]}</Rozet> },
];

function tanim(l: readonly TeklifSatiri[]): SuzgecTanimi<TeklifSatiri> {
  const musteriler = [...new Map(l.filter((t) => t.musteriId).map((t) => [t.musteriId!, t.musteri])).entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  return {
    ad: "Tekliflerde ara", ipucu: "Teklif no, müşteri, tesis", birim: "teklif", sayfa: 20, imkansiz: "Bir teklif aynı anda iki durumda olamaz",
    metin: (t) => [t.no, t.musteri, t.unvan, t.tesis, t.yer ?? ""].join(" "),
    cipler: [
      { k: "taslak", ad: "Taslak", grup: "durum", test: (t) => t.durum === "taslak" },
      { k: "gonderildi", ad: "Gönderildi", grup: "durum", test: (t) => t.durum === "gonderildi" },
      { k: "kabul", ad: "Kabul edildi", grup: "durum", test: (t) => t.durum === "kabul" },
      { k: "kapanan", ad: "Red ya da süresi doldu", grup: "durum", test: (t) => t.durum === "red" || t.durum === "suresi" },
      { k: "yakin", ad: "Geçerliliği 7 gün içinde bitiyor", test: (t) => { const k = t.bitis ? gunFarki(t.bitis) : -1; return t.durum === "gonderildi" && k >= 0 && k <= 7; } },
    ],
    seciciler: [{ k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...musteriler.map(([id, ad]) => [id, ad] as const)], gecer: (t, v) => v === "tumu" || t.musteriId === v }],
  };
}

export function TeklifListesi({ teklifler, yaz }: { teklifler: TeklifSatiri[]; yaz: boolean }) {
  const s = useSuzgec(tanim(teklifler), teklifler);
  return (
    <>
      <SayfaBasi baslik="Teklifler" sayac={<Sayac s={s} />} tuslar={yaz ? <TusBaglanti tur="birincil" ikon="plus" href="/teklifler/yeni">Teklif hazırla</TusBaglanti> : undefined} />
      <SuzgecliListe s={s} on="t" baslik="Teklifler" sutunlar={SUTUNLAR} anahtar={(t) => t.id} href={(t) => `/teklifler/${t.id}`}
        bosVeri={{ ikon: "file-text", baslik: "Teklif yok", metin: "“Teklif hazırla” ile müşteri, tesis ve kalemler seçilir." }} />
    </>
  );
}
