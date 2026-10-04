"use client";
/* Vitrinin süzgeçli listesi: uydurma 23 kayıt (sayfa boyu 10 → 3 sayfa), çipler, seçiciler, sıralama. e2e/liste.spec.ts ölçer. */
import { useMemo } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Tus } from "../../../components/tus/Tus";
import { KALIP } from "../../../styles/kalip";
import stil from "./vitrin.module.css";

type Durum = "bekliyor" | "denetimde" | "tamam";
interface Kayit { id: string; no: string; musteri: string; il: string; tarih: string; durum: Durum }

const DURUM_AD: Record<Durum, string> = { bekliyor: "Kabul bekliyor", denetimde: "Denetimde", tamam: "Tamamlandı" };
const MUSTERI = ["Örnek Metal", "Deneme Gıda", "Uydurma Tekstil", "Taslak Plastik", "Örnek Lojistik", "Deneme Kimya", "Uydurma Otomotiv",
  "Taslak Ambalaj", "Örnek Enerji", "Deneme Mobilya"];
const IL = ["İzmir", "Manisa", "Aydın"];
const DURUMLAR: Durum[] = ["bekliyor", "denetimde", "tamam"];
const KAYITLAR: Kayit[] = Array.from({ length: 23 }, (_, i) => ({
  id: `v${i + 1}`,
  no: `P-1026-${String(i + 1).padStart(2, "0")}`,
  musteri: MUSTERI[i % MUSTERI.length],
  il: IL[i % IL.length],
  tarih: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
  durum: DURUMLAR[i % 3],
}));

const TANIM: SuzgecTanimi<Kayit> = {
  ad: "Kayıtlarda ara", ipucu: "Proje no, müşteri, il", birim: "kayıt", imkansiz: "Bir kayıt aynı anda iki durumda olamaz",
  metin: (k) => `${k.no} ${k.musteri} ${k.il}`,
  sayfa: KALIP.sayfa.ekipman,
  cipler: DURUMLAR.map((d) => ({ k: d, ad: DURUM_AD[d], grup: "durum", test: (k: Kayit) => k.durum === d })),
  seciciler: [
    { k: "il", ad: "İl", secenek: () => [["tumu", "Tümü"], ...IL.map((x) => [x, x] as const)], gecer: (k, v) => v === "tumu" || k.il === v },
    { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...[...MUSTERI].sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
      gecer: (k, v) => v === "tumu" || k.musteri === v },
    { k: "sira", ad: "Sıralama", siralama: true, gecer: () => true, secenek: () => [
      ["varsayilan", "Varsayılan"], ["no-artan", "Proje no: küçükten büyüğe"], ["no-azalan", "Proje no: büyükten küçüğe"],
      ["musteri-artan", "Müşteri: A → Z"], ["musteri-azalan", "Müşteri: Z → A"]] },
  ],
  siraAnahtari: { no: (k) => k.no, musteri: (k) => k.musteri, tarih: (k) => k.tarih },
};

const SUTUNLAR: Sutun<Kayit>[] = [
  { k: "no", baslik: "Proje no", kart: "ust", sira: 1, genislik: "18%", hucre: (k) => <span className={stil.no}>{k.no}</span> },
  { k: "musteri", baslik: "Müşteri", kart: "govde", sira: 2, genislik: "28%", hucre: (k) => <Kirp>{k.musteri}</Kirp> },
  { k: "il", baslik: "İl", kart: "govde", sira: 3, genislik: "14%", siralanmaz: true, hucre: (k) => <><KartEtiket>İl</KartEtiket>{k.il}</> },
  { k: "tarih", baslik: "Tarih", kart: "govde", sira: 4, genislik: "14%", hucre: (k) => k.tarih.split("-").reverse().join(".") },
  { k: "durum", baslik: "Durum", kart: "rozet", genislik: "14%", siralanmaz: true, hucre: (k) => <span className={`${stil.rozet} ${stil[k.durum]}`}>{DURUM_AD[k.durum]}</span> },
  { k: "eylem", baslik: "İşlem", kart: "eylem", genislik: "12%", gizliBaslik: true, siralanmaz: true,
    hucre: () => <div className={stil.eylem}><Tus tur="ikincil">Görüntüle</Tus></div> },
];

export function VitrinListe() {
  const kayitlar = useMemo(() => KAYITLAR, []);
  const s = useSuzgec(TANIM, kayitlar);
  return (
    <section className={stil.bolum} aria-labelledby="v-liste">
      <div className={stil.listeBas}><h2 id="v-liste">Liste</h2><Sayac s={s} /></div>
      <SuzgecliListe s={s} on="v" baslik="Vitrin kayıtları" sutunlar={SUTUNLAR} anahtar={(k) => k.id} siralanir
        bosVeri={{ ikon: "inbox", baslik: "Henüz kayıt yok", metin: "Kayıt eklenince burada listelenir." }} />
    </section>
  );
}
