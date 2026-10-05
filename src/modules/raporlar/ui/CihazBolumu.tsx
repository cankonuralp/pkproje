"use client";
/* SAHA RAPORU · ÖLÇÜM CİHAZLARI (maket maket-rapor.js CIHAZ_SATIR + pencereCiz "cihaz"; reisim 2026-09-28: "hangi cihaz kullanılacaksa o sabit
   yazsın, onun hizasında bilgileri … cihaz yoksa cihaz ekle tuşu olsun, kaldırınca komple satır silinmesin … sadece ilgili satırdaki cihaz").
   Türün her gerekli cihaz türü sabit bir satır: eklenen cihaz hizasında, eklenmemişse o satırda "Cihaz ekle"; kaldırınca satır kalır. Pencerede
   yalnız o türden, raporu yazanın ZİMMETİNDEKİ kalibrasyonu geçerli cihazlar (liste sunucudan — SahaRaporu.secilebilir). Tür gerekli cihaz türü
   vermiyorsa ("*") üstte genel "Cihaz ekle": zimmetteki her geçerli cihaz; seçilen cihaz kendi türünün satırına yazılır (sunucuda).
   Eksik ya da kalibrasyonu geçmiş cihazla rapor onaya gönderilemez (ENGEL 2 — sunucu söyler, satır işaretlenir). */
import { useState, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { DegerYok, Kod } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { CihazSatiri, SahaRaporu } from "../server/raporlar";
import { alanId } from "./Bloklar";
import { cihazEkleEylemi, cihazKaldirEylemi, type RaporYaniti } from "./eylemler";
import stil from "./raporlar.module.css";

/** tür gerekli cihaz türü vermiyorsa seçilebilir cihazların anahtarı (sunucu SahaRaporu.secilebilir) */
const GENEL = "*";
const RADYO = "rapor-cihaz";
const markaModel = (c: { marka: string | null; model: string | null }) => [c.marka, c.model].filter(Boolean).join(" ");
/** pencerede seçeneğin erişilebilir adı: "<kod> · <marka> <model>" */
const cihazAdi = (c: { kod: string; marka: string | null; model: string | null }) => [c.kod, markaModel(c)].filter(Boolean).join(" · ");
const ilkHata = (r: RaporYaniti, yedek: string) => r.genel ?? Object.values(r.hatalar ?? {})[0] ?? yedek;

interface Secim { turId: string; ad: string; secili: string; hata: string | null }

export function CihazBolumu({ v, bolumId, oku, gecersiz, mesgul, baslat, yenile }: {
  v: SahaRaporu; bolumId: string; oku: boolean; gecersiz: (alan: string) => boolean;
  /** üst ekranın işlemi (SahaRaporu useTransition): cihaz yazması sürerken öteki yazan tuşlar da kapalı */
  baslat: TransitionStartFunction;
  /** rapor yazılıyor ya da yeni sürüm bekleniyor (SahaRaporu): tuşlar kapalı */
  mesgul: boolean;
  /** yazdıktan sonra yenile (yeni sürüm gelene kadar SahaRaporu tuşları kapalı tutar) */
  yenile: () => void;
}) {
  const bildir = useBildir();
  const bekliyor = mesgul;   /* ekle / kaldır üst ekranın işleminde: o sürerken Kaydet / Onaya gönder de kapalı */
  const [pencere, setPencere] = useState<Secim | null>(null);
  const genel = !oku && GENEL in v.secilebilir;
  const liste = pencere ? v.secilebilir[pencere.turId] ?? [] : [];

  const kaldir = (x: CihazSatiri) => baslat(async () => {
    const r = await cihazKaldirEylemi(v.id, v.surum, x.turId);
    bildir(r.tamam ? r.bildirim ?? "Cihaz kaldırıldı." : ilkHata(r, "Cihaz kaldırılamadı."));
    yenile();
  });
  const ekle = () => pencere && baslat(async () => {
    const r = await cihazEkleEylemi(v.id, v.surum, pencere.turId, pencere.secili);
    if (r.tamam) { setPencere(null); bildir(r.bildirim ?? "Cihaz eklendi."); yenile(); return; }
    setPencere({ ...pencere, hata: ilkHata(r, "Cihaz eklenemedi.") });
  });
  const ac = (turId: string, ad: string) => setPencere({ turId, ad, secili: "", hata: null });

  const kalibrasyon = (x: CihazSatiri) => !x.cihaz ? <DegerYok />
    : x.cihaz.eksik ? <span className={stil.hataMetin}>kayıtlı değil</span>
    : <span className={x.cihaz.gecti ? stil.hataMetin : undefined}>{x.cihaz.bitis ? tarihNo(x.cihaz.bitis) : "—"}{x.cihaz.gecti && " · geçmiş"}</span>;

  const sutunlar: Sutun<CihazSatiri>[] = [
    { k: "tur", genislik: "24%", baslik: "Gerekli cihaz", kart: "ust", sira: 1, hucre: (x) => <b>{x.turAd}</b> },
    { k: "cihaz", genislik: "30%", baslik: "Cihaz", kart: "govde", sira: 2, hucre: (x) => {
      if (x.cihaz) return <><KartEtiket>Cihaz</KartEtiket><Kod>{x.cihaz.kod}</Kod>{markaModel(x.cihaz) && <> · {markaModel(x.cihaz)}</>}</>;
      if (oku) return <><KartEtiket>Cihaz</KartEtiket><DegerYok /></>;
      return (
        <span className={stil.hucreSatir}>
          <Tus tur="ikincil" ikon="plus" id={alanId(`cihaz.${x.turId}`)} disabled={bekliyor} onClick={() => ac(x.turId, x.turAd)}>Cihaz ekle</Tus>
          {gecersiz(`cihaz.${x.turId}`) && <span className={stil.hataMetin}>Eksik</span>}
        </span>
      );
    } },
    { k: "seri", genislik: "16%", baslik: "Cihaz no", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Cihaz no</KartEtiket>{x.cihaz?.seri ? <Kod>{x.cihaz.seri}</Kod> : <DegerYok />}</> },
    { k: "kal", genislik: "18%", baslik: "Kalibrasyon tarihi", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Kalibrasyon tarihi</KartEtiket>{kalibrasyon(x)}</> },
    ...(oku ? [] : [{ k: "eylem", genislik: "12%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (x: CihazSatiri) => x.cihaz ? (
      <div className={stil.eylemHucre}>
        <button className={stil.ikonTus} type="button" id={alanId(`cihaz.${x.turId}`)} aria-label={`${x.cihaz.eksik ? x.turAd : x.cihaz.kod} kaldır`} title="Kaldır"
          disabled={bekliyor} onClick={() => kaldir(x)}>
          <Ikon ad="x" />
        </button>
      </div>
    ) : null } satisfies Sutun<CihazSatiri>]),
  ];

  /* formatın "Ölçüm cihazı eklenmedi" eksiği bölüme bağlı: genel tuş varsa ona, yoksa listenin kabına gidilir */
  const bosEksik = gecersiz(bolumId);
  return (
    <div className={stil.cihazKap} id={genel ? undefined : alanId(bolumId)} tabIndex={genel ? undefined : -1}>
      {genel && (
        <div className={stil.ustTuslar}>
          <Tus tur="ikincil" ikon="plus" id={alanId(bolumId)} disabled={bekliyor} onClick={() => ac(GENEL, "Ölçüm cihazı")}>Cihaz ekle</Tus>
        </div>
      )}
      {v.cihazlar.length ? <Liste baslik="Ölçüm cihazları" sutunlar={sutunlar} kayitlar={v.cihazlar} anahtar={(x) => x.turId} />
        : <p className={bosEksik ? `${stil.bosSatir} ${stil.hataMetin}` : stil.bosSatir}>Ölçüm cihazı eklenmedi.</p>}
      <Pencere acik={!!pencere} baslik="Cihaz ekle" onKapat={() => setPencere(null)} odak={`input[name="${RADYO}"]`}
        alt={liste.length ? <>
          <Tus tur="ikincil" onClick={() => setPencere(null)}>Vazgeç</Tus>
          <Tus ikon="plus" disabled={!pencere?.secili || bekliyor} onClick={ekle}>Ekle</Tus>
        </> : <Tus tur="ikincil" onClick={() => setPencere(null)} data-ilk-odak="">Kapat</Tus>}>
        {pencere && <>
          <p className={pencereMetinSinifi}><b>{pencere.ad}</b> · zimmetinizdeki, kalibrasyonu geçerli cihazlar</p>
          {pencere.hata && <Serit tur="hata">{pencere.hata}</Serit>}
          {liste.length ? (
            <fieldset className={stil.cihazGrup}>
              <legend className="gizli">{pencere.ad}</legend>
              <ul className={stil.secimListesi}>
                {liste.map((c) => (
                  <li key={c.id}>
                    <label className={stil.secimSatir}>
                      <input type="radio" name={RADYO} value={c.id} checked={pencere.secili === c.id} aria-label={cihazAdi(c)}
                        onChange={() => setPencere({ ...pencere, secili: c.id, hata: null })} />
                      <span><Kod>{c.kod}</Kod>{markaModel(c) && <> · {markaModel(c)}</>}
                        <span className={stil.altMetin}>{[c.seri && `Seri no ${c.seri}`, c.bitis && `kalibrasyon ${tarihNo(c.bitis)} tarihine kadar geçerli`].filter(Boolean).join(" · ") || "—"}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : <p className={stil.bosSatir}>Zimmetinizde bu türden kalibrasyonu geçerli cihaz yok.</p>}
        </>}
      </Pencere>
    </div>
  );
}
