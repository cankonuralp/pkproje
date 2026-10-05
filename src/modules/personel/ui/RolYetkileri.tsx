"use client";
/* PERSONEL › ROL YETKİLERİ (maket personel.html #/roller, maket-personel.js rollerCiz; reisim 32: "başlangıç olarak uygun ama admin istediği gibi
   rollerin yetkilerini değiştirebilmeli"). Modül × rol tablosu (telefonda kart). Firma yöneticisi "Rol yetkilerini düzenle" ile her hücreyi seçer;
   kendini kilitleyemeyeceği hücreler "sabit". Kaydet → sunucu temizler, sürüm kilidiyle yazar; o rollerdeki herkes için bir sonraki istekte geçerli. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { FormEylem } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { DegerYok, Rozet, SayfaBasi, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { PersonelSekmeleri } from "./ortak";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { ROL_ADI, ROLLER } from "../../../server/yetki/tanim";
import { rolYetkiKaydetEylemi } from "./eylemler";
import stil from "./personel.module.css";

export interface MatrisSatiri { no: string; ad: string; ikon: string; grup: string }
type Tablo = Record<string, string[]>;

/* maket MV.DUZEY ile aynı adlar ve rozetler */
const DUZEY: Record<string, { ad: string; tur: RozetTuru; aciklama: string }> = {
  yaz: { ad: "Değiştirir", tur: "tamam", aciklama: "görür ve değiştirir" },
  gor: { ad: "Görür", tur: "kabul", aciklama: "görür" },
  brans: { ad: "Branşı", tur: "notr", aciklama: "yalnız kendi branşının kayıtları" },
  kendi: { ad: "Kendi", tur: "notr", aciklama: "yalnız kendi kayıtları" },
};
const DUZEY_SEC = [["yaz", "Değiştirir"], ["gor", "Görür"], ["brans", "Branşı"], ["kendi", "Kendi"], ["yok", "Görmez"]] as const;
const DuzeyGoster = ({ d }: { d: string }) => (DUZEY[d] ? <Rozet tur={DUZEY[d].tur}>{DUZEY[d].ad}</Rozet> : <DegerYok />);
const kopya = (t: Tablo): Tablo => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, [...v]]));
const ayni = (a: Tablo, b: Tablo) => Object.keys(b).every((k) => a[k]?.every((d, i) => d === b[k][i]));

export function RolYetkileri({ satirlar, matris, oneri, sabit, surum, duzenleyebilir, izinler = false }: {
  satirlar: MatrisSatiri[]; matris: Tablo; oneri: Tablo; sabit: Record<string, string[]>; surum: number; duzenleyebilir: boolean; izinler?: boolean;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [taslak, setTaslak] = useState<Tablo | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const gorunen = taslak ?? matris;
  const kilitli = (no: string, i: number) => !!sabit[no]?.includes(ROLLER[i]);
  const degisen = taslak ? satirlar.reduce((n, s) => n + taslak[s.no].filter((d, i) => d !== matris[s.no][i]).length, 0) : 0;

  const sutunlar: Sutun<MatrisSatiri>[] = [
    { k: "modul", genislik: "22%", baslik: "Modül", kart: "ust", sira: 1, siralanmaz: true, hucre: (m) => (
      <span className={stil.hucreSatir}><Ikon ad={m.ikon} kucuk /><span><span className={stil.rolAd}>{m.ad}</span><span className={stil.altSatir}>{m.grup}</span></span></span>
    ) },
    ...ROLLER.map((r, i): Sutun<MatrisSatiri> => ({
      k: `r${i}`, genislik: "13%", baslik: ROL_ADI[r], kart: "govde", sira: 2 + i, siralanmaz: true, hucre: (m) => {
        const d = gorunen[m.no][i];
        if (!taslak) return <><KartEtiket>{ROL_ADI[r]}</KartEtiket><DuzeyGoster d={d} /></>;
        if (kilitli(m.no, i)) return <><KartEtiket>{ROL_ADI[r]}</KartEtiket><span><DuzeyGoster d={d} /><span className={stil.altSatir}>sabit</span></span></>;
        return <><KartEtiket>{ROL_ADI[r]}</KartEtiket><SecimAlani id={`m-${m.no}-${i}`} ad={`${m.ad} · ${ROL_ADI[r]}`} etiketsiz deger={d} secenekler={DUZEY_SEC}
          degistir={(v) => setTaslak((t) => { const y = kopya(t!); y[m.no][i] = v; return y; })} /></>;
      },
    })),
  ];

  const kaydet = () => baslat(async () => {
    const r = await rolYetkiKaydetEylemi(surum, taslak);
    if (r.genel) { setHata(r.genel); return; }
    setHata(null); setTaslak(null);
    bildir(`Rol yetkileri kaydedildi (${degisen} değişiklik); o rollerdeki kişiler için hemen geçerli.`);
    router.refresh();
  });

  return (
    <>
      <SayfaBasi baslik="Personel" tuslar={duzenleyebilir && !taslak && <Tus ikon="pencil" onClick={() => { setHata(null); setTaslak(kopya(matris)); }}>Rol yetkilerini düzenle</Tus>} />
      <PersonelSekmeleri secili="/personel/roller" izinler={izinler} />
      <Serit tur="bilgi" ikon="circle-alert">{ayni(gorunen, oneri) ? "Önerilen başlangıç düzeni" : "Firmanın kendi düzeni"}</Serit>
      <p className={stil.aciklama}>
        {Object.entries(DUZEY).map(([k, v], i) => <span key={k}>{i > 0 && " · "}<Rozet tur={v.tur}>{v.ad}</Rozet> {v.aciklama}</span>)} · — görmez
      </p>
      {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      {taslak && (
        <div className={stil.matrisArac}>
          <Tus tur="ikincil" ikon="undo-2" disabled={ayni(taslak, oneri)} onClick={() => { setTaslak(kopya(oneri)); bildir("Önerilen düzen yüklendi; kaydedince geçerli olur."); }}>Önerilen düzene dön</Tus>
        </div>
      )}
      <Liste baslik="Rol yetkileri" sutunlar={sutunlar} kayitlar={satirlar} anahtar={(m) => m.no} />
      {taslak && (
        <FormEylem not={degisen ? `${degisen} değişiklik kaydedilmedi.` : "Değişiklik yok."}>
          <Tus tur="ikincil" onClick={() => { setTaslak(null); setHata(null); }}>Vazgeç</Tus>
          <Tus ikon="check" disabled={!degisen || bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus>
        </FormEylem>
      )}
    </>
  );
}
