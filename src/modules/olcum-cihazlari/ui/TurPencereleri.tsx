"use client";
/* CİHAZ TÜRLERİ PENCERESİ (359; maket olcum-cihazlari.html T7 — maket-cihazlar.js "turler" / "tur", reisim: "ölçüm cihazlarına cihaz türü ekleme"):
   firmanın türleri — ad, "N ekipman türünde · M cihaz", Düzenle (yalnız ad; N3: hangi ekipman türünde kullanılacağı Ekipman türleri'nde seçilir) ve
   cihazı olmayan, raporda geçmeyen türde Sil (yalnız yönetici; onay maketten: "<ad> … ekipman türlerinin kullanacağı cihazlardan da çıkar"). Altta
   "Tür ekle". Ekle / düzenle ayrı pencerede; kaydedince listeye dönülür. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import type { CihazTuruSatiri } from "../server/cihazlar";
import { cihazTuruKaydetEylemi, cihazTuruSilEylemi } from "./eylemler";
import stil from "./cihazlar.module.css";

const AD_ID = "tw-ad";

export function CihazTurleriPenceresi({ acik, kapat, turler }: { acik: boolean; kapat: () => void; turler: CihazTuruSatiri[] }) {
  const [duzen, setDuzen] = useState<null | { id: string | null; surum: number; ad: string }>(null);
  return (
    <>
      <Pencere acik={acik && !duzen} baslik="Cihaz türleri" onKapat={kapat}
        alt={<>
          <Tus tur="ikincil" onClick={kapat}>Kapat</Tus>
          <Tus ikon="plus" data-ilk-odak="" onClick={() => setDuzen({ id: null, surum: 0, ad: "" })}>Tür ekle</Tus>
        </>}>
        {turler.length ? (
          <ul className={stil.turListe}>
            {turler.map((t) => (
              <li key={t.id}>
                <span className={stil.turAd}><b>{t.ad}</b><span className={stil.turAlt}>{t.ekipmanTuru} ekipman türünde · {t.cihaz} cihaz</span></span>
                <span className={stil.turTuslar}>
                  <Tus tur="ikincil" ikon="pencil" aria-label={`${t.ad} türünü düzenle`} onClick={() => setDuzen({ id: t.id, surum: t.surum, ad: t.ad })}>Düzenle</Tus>
                  {t.sil && <SilTusu kucuk ad={t.ad} baslik="Cihaz türünü sil" yanEtki="ekipman türlerinin kullanacağı cihazlardan da çıkar"
                    sil={() => cihazTuruSilEylemi(t.id)} />}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className={stil.bosSatir}>Henüz cihaz türü yok.</p>}
      </Pencere>
      {duzen && <TurPenceresi tur={duzen} kapat={() => setDuzen(null)} />}
    </>
  );
}

function TurPenceresi({ tur, kapat }: { tur: { id: string | null; surum: number; ad: string }; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [ad, setAd] = useState(tur.ad);
  const [hata, setHata] = useState<string | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await cihazTuruKaydetEylemi(tur.id, tur.surum, { ad });
    setHata(r.hatalar?.ad ?? null); setGenel(r.genel ?? null);
    if (!r.tamam) { if (r.hatalar?.ad) requestAnimationFrame(() => document.getElementById(AD_ID)?.focus()); return; }
    kapat(); bildir(tur.id ? "Tür güncellendi." : `${ad.trim()} eklendi.`); router.refresh();
  });
  return (
    <Pencere acik baslik={tur.id ? `${tur.ad} · düzenle` : "Cihaz türü ekle"} onKapat={kapat}
      alt={<>
        <Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus>
        <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus>
      </>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <Alan id={AD_ID} etiket="Tür adı" zorunlu genis hata={hata ?? undefined}>
        <Girdi id={AD_ID} value={ad} maxLength={60} data-ilk-odak="" hata={!!hata} onChange={(e) => setAd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); kaydet(); } }} />
      </Alan>
    </Pencere>
  );
}
