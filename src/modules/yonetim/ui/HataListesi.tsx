"use client";
/* YÖNETİM › HATA KAYDI listesi (567): son görülme (sayı), mesaj + yer, kaynak, firma, sayfa; satırın altında yığın izi, sürüm, cihaz (açılır).
   Süzgeç: arama (mesaj, yer, sayfa, firma), kaynak, firma. Hatalar 30 gün ya da en yeni 2000 tutulur (göç 0093). */
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import type { HataSatiri } from "../server/hatalar";
import stil from "./yonetim.module.css";

const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zamanYaz = (iso: string) => ZAMAN.format(new Date(iso)).replace(",", "");
const KAYNAK = { istemci: ["Tarayıcı", "bekliyor"], sunucu: ["Sunucu", "red"] } as const;

function tanim(l: readonly HataSatiri[]): SuzgecTanimi<HataSatiri> {
  const alanlar = [...new Set(l.map((h) => h.alan).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "tr"));
  return {
    ad: "Hatalarda ara", ipucu: "Mesaj, yer, sayfa, firma", birim: "hata", sayfa: 20, imkansiz: "",
    metin: (h) => [h.mesaj, h.yer ?? "", h.adres ?? "", h.alan ?? ""].join(" "),
    cipler: [],
    seciciler: [
      { k: "kaynak", ad: "Kaynak", secenek: () => [["tumu", "Tümü"], ["istemci", "Tarayıcı"], ["sunucu", "Sunucu"]], gecer: (h, v) => v === "tumu" || h.kaynak === v },
      { k: "alan", ad: "Firma", secenek: () => [["tumu", "Tümü"], ...alanlar.map((a) => [a, a] as const), ["-", "Firmasız"]],
        gecer: (h, v) => v === "tumu" || (v === "-" ? !h.alan : h.alan === v) },
    ],
  };
}

const SUTUN: Sutun<HataSatiri>[] = [
  { k: "son", genislik: "16%", baslik: "Son görülme", kart: "ust", sira: 1, hucre: (h) => (
    <span className={stil.adres}><span className={stil.sayi}>{zamanYaz(h.son)}</span><AltSatir>{h.sayi > 1 ? `${h.sayi} kez · ilk ${zamanYaz(h.ilk)}` : "1 kez"}</AltSatir></span>
  ) },
  { k: "mesaj", genislik: "44%", baslik: "Hata", kart: "govde", sira: 2, hucre: (h) => (
    <span className={stil.adres}>
      <span className={stil.hataMesaj}>{h.mesaj}</span>
      {h.yer && <AltSatir><Kirp>{h.yer}</Kirp></AltSatir>}
      {(h.yigin || h.cihaz || h.surum) && (
        <details className={stil.hataAyrinti}>
          <summary>Ayrıntı</summary>
          {h.yigin && <pre className={stil.hataYigin}>{h.yigin}</pre>}
          <AltSatir>{[h.surum && `sürüm ${h.surum}`, h.oturumlu ? "oturumlu" : "oturumsuz", h.cihaz].filter(Boolean).join(" · ")}</AltSatir>
        </details>
      )}
    </span>
  ) },
  { k: "kaynak", genislik: "12%", baslik: "Kaynak", kart: "rozet", sira: 1, hucre: (h) => <Rozet tur={KAYNAK[h.kaynak][1]}>{KAYNAK[h.kaynak][0]}</Rozet> },
  { k: "firma", genislik: "12%", baslik: "Firma", kart: "govde", sira: 3, hucre: (h) => <><KartEtiket>Firma</KartEtiket><Kirp>{h.alan ?? "—"}</Kirp></> },
  { k: "adres", genislik: "16%", baslik: "Sayfa", kart: "govde", sira: 4, hucre: (h) => <><KartEtiket>Sayfa</KartEtiket><Kirp>{h.adres ?? "—"}</Kirp></> },
];

export function HataListesi({ kayitlar }: { kayitlar: HataSatiri[] }) {
  const s = useSuzgec(tanim(kayitlar), kayitlar);
  return (
    <>
      <SayfaBasi baslik="Hata kaydı" sayac={<Sayac s={s} />} tuslar={<TusBaglanti tur="ikincil" ikon="building-2" href="/yonetim">Firmalar</TusBaglanti>} />
      <SeritKap><Serit tur="bilgi" ikon="shield-check">Yalnız probata ekibine açık. Kişi adı ve sorgu yazılmaz; e-posta, uzun sayı ve anahtarlar maskelenir. Hatalar 30 gün (en çok 2000) tutulur.</Serit></SeritKap>
      <SuzgecliListe s={s} on="h" baslik="Hatalar" sutunlar={SUTUN} anahtar={(h) => h.id}
        bosVeri={{ ikon: "circle-check", baslik: "Hata yok", metin: "Tarayıcıda ya da sunucuda yakalanan hata burada görünür." }} />
    </>
  );
}
