"use client";
/* RAPORLARINIZ (maket musteri.html #/ — R_SUTUN, suzgecTanimla "m"): imzalı raporların son sürümleri, en yeni üstte, 20'şer. Sütunlar Rapor no ·
   Ekipman (kod + tür) · Tesis · Kontrol · Sonraki kontrol (60 gün içindeyse uyarı) · Sonuç. Çipler Uygunsuz ve Sonraki kontrol 60 gün içinde;
   seçiciler Tesis ve Yıl. Satır rapor sayfasını açar (imzalı PDF orada). Görme sunucuda (müşteri rolü). */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import type { MusteriRaporu } from "../../raporlar/server/musteri-baglanti";
import type { PanelRaporlari } from "../server/panel";
import { gunFarki, SonucYazisi } from "./ortak";
import stil from "./panel.module.css";

const benzersiz = <T,>(l: readonly T[]) => [...new Set(l)];
const YAKIN = 60;

const SUTUNLAR: Sutun<MusteriRaporu>[] = [
  { k: "no", genislik: "22%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => <Link className={stil.kod} href={`/portal/r/${r.id}`}>{r.no}</Link> },
  { k: "ekipman", genislik: "24%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => <span className={stil.hucreSatir}><span className={stil.kod}>{r.ekipmanKod}</span><Kirp>{r.turAd}</Kirp></span> },
  { k: "tesis", genislik: "18%", baslik: "Tesis", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Tesis</KartEtiket><Kirp>{r.tesis}</Kirp></> },
  { k: "kontrol", genislik: "12%", baslik: "Kontrol", kart: "govde", sira: 4, hucre: (r) => <><KartEtiket>Kontrol</KartEtiket>{r.kontrol ? tarihNo(r.kontrol) : "—"}</> },
  { k: "sonraki", genislik: "14%", baslik: "Sonraki kontrol", kart: "govde", sira: 5, hucre: (r) => {
    const k = r.sonraki ? gunFarki(r.sonraki) : null;
    return <><KartEtiket>Sonraki kontrol</KartEtiket><span>{r.sonraki ? tarihNo(r.sonraki) : "—"}{k !== null && k <= YAKIN && <AltSatir uyari>{k < 0 ? `${-k} gün geçti` : `${k} gün`}</AltSatir>}</span></>;
  } },
  { k: "sonuc", genislik: "10%", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: (r) => <SonucYazisi sonuc={r.sonuc} /> },
];

function tanim(l: readonly MusteriRaporu[], tesisler: PanelRaporlari["tesisler"]): SuzgecTanimi<MusteriRaporu> {
  return {
    ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", sayfa: 20, imkansiz: "",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis].join(" "),
    cipler: [
      { k: "uygunsuz", ad: "Uygunsuz", test: (r) => r.sonuc === "uygun_degil" },
      { k: "yakin", ad: `Sonraki kontrol ${YAKIN} gün içinde`, test: (r) => !!r.sonraki && gunFarki(r.sonraki) <= YAKIN },
    ],
    seciciler: [
      { k: "tesis", ad: "Tesis", secenek: () => [["tumu", "Tümü"], ...tesisler.map((t) => [t.id, t.ad] as const)], gecer: (r, v) => v === "tumu" || r.tesisId === v },
      { k: "yil", ad: "Yıl", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => (r.kontrol ?? r.imzalandi).slice(0, 4))).sort().reverse().map((y) => [y, y] as const)],
        gecer: (r, v) => v === "tumu" || (r.kontrol ?? r.imzalandi).startsWith(v) },
    ],
  };
}

export function PanelRaporListesi({ v }: { v: PanelRaporlari }) {
  const s = useSuzgec(tanim(v.raporlar, v.tesisler), v.raporlar);
  return (
    <>
      <SayfaBasi baslik="Raporlarınız" sayac={<Sayac s={s} />} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <SuzgecliListe s={s} on="p" baslik="Raporlarınız" sutunlar={SUTUNLAR} anahtar={(r) => r.id} href={(r) => `/portal/r/${r.id}`}
        bosVeri={{ ikon: "file-text", baslik: "Henüz rapor yok", metin: "Raporlar imzalandığında burada görünür ve indirilebilir." }} />
    </>
  );
}
