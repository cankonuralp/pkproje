"use client";
/* KAYDET VE KOPYALA / KOPYALA PENCERESİ (204–209; maket pencereCiz "kopya", N10 — reisim: "ekipman kodu ve ekipman bölümü sorsun yeterli"): yeni
   ekipmanın kodu (zorunlu, firmada eşsiz) ve bölümü (kullanım yeri) sorulur; tür aynı, seri no yeni raporda yazılır. Kod biçimi yazarken bakılır
   (Planlar'ın kodNormal / kodBicimi — plan içi "Ekipman ekle" ile tek üretici); eşsizlik, plan günü ve günlük süre sunucuda, hata kodun altında. */
import { useState } from "react";
import { Alan, Girdi } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Kod } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { kodBicimi, kodNormal } from "../../planlar/sema";

const ID = { kod: "r-kopya-kod", konum: "r-kopya-konum" } as const;

export function KopyaPenceresi({ kaydetVe, kaynakKod, turAd, konum, mesgul, onKapat, kopyala }: {
  /** Yeni raporda "Kaydet ve kopyala" (önce kaydedilir), gönderilmişte "Kopyala" */
  kaydetVe: boolean; kaynakKod: string; turAd: string; konum: string; mesgul: boolean; onKapat: () => void;
  /** sunucuya gönderir; hata metni döner (başarıda null — çağıran yeni rapora gider) */
  kopyala: (d: { kod: string; konum: string }) => Promise<string | null>;
}) {
  const [kod, setKod] = useState("");
  const [yer, setYer] = useState(konum);
  const [hata, setHata] = useState<string | null>(null);
  const ad = kaydetVe ? "Kaydet ve kopyala" : "Kopyala";
  const gonder = async () => {
    const b = kodBicimi(kod);
    if (b) { setHata(b.tur === "bos" ? "Ekipman kodunu yazın." : b.metin); document.getElementById(ID.kod)?.focus(); return; }
    const h = await kopyala({ kod, konum: yer });
    if (h) { setHata(h); document.getElementById(ID.kod)?.focus(); }
  };
  return (
    <Pencere acik baslik={`${ad} · yeni ekipman`} onKapat={onKapat} odak={`#${ID.kod}`}
      alt={<>
        <Tus tur="ikincil" onClick={onKapat}>Vazgeç</Tus>
        <Tus ikon="copy" disabled={mesgul} onClick={gonder}>{ad}</Tus>
      </>}>
      <p className={pencereMetinSinifi}>
        <Kod>{kaynakKod}</Kod> · {turAd} raporunun bilgileriyle yeni ekipman ve raporu açılır{kaydetVe ? "; bu rapor önce kaydedilir" : ""}.
        Test değerleri, fotoğraflar ve sonuç kopyalanmaz.
      </p>
      <Alan id={ID.kod} etiket="Ekipman kodu" zorunlu hata={hata}>
        <Girdi id={ID.kod} value={kod} maxLength={20} spellCheck={false} placeholder={`${kaynakKod.replace(/\d+$/, "")}…`} hata={!!hata}
          onChange={(e) => { setKod(kodNormal(e.target.value)); setHata(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !mesgul) { e.preventDefault(); void gonder(); } }} />
      </Alan>
      <Alan id={ID.konum} etiket="Ekipman bölümü (kullanım yeri)">
        <Girdi id={ID.konum} value={yer} maxLength={60} onChange={(e) => setYer(e.target.value)} />
      </Alan>
    </Pencere>
  );
}
