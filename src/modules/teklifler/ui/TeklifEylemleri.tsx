"use client";
/* TEKLİF SAYFASI EYLEMLERİ (maket teklifler.html teklifCiz eylem çubuğu): duruma göre — taslak: Düzenle · Gönderildi olarak işaretle; gönderildi:
   Reddedildi (müşterinin gerekçesi, pencere) · Kabul edildi (onay); kabul edildi: kayıtlı olmayan müşteride "Müşteri olarak kaydet", kayıtlı
   müşteride İş sözleşmesi · Plan aç; red ya da süresi doldu: Yeni teklif (kopyala). Teklif müşteriye elle iletilir (121). Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { TeklifKarti } from "../server/teklifler";
import { teklifGonderEylemi, teklifKabulEylemi, teklifMusteriKaydetEylemi, teklifReddetEylemi, type TeklifYaniti } from "./eylemler";
import stil from "./teklifler.module.css";

const GEREKCE = "w-gerekce";

export function TeklifEylemleri({ t }: { t: TeklifKarti }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [red, setRed] = useState<{ gerekce: string; hata: string | null } | null>(null);
  const sonuc = (r: TeklifYaniti) => {
    if (r.tamam) { setHata(null); bildir(r.bildirim ?? "Kaydedildi."); router.refresh(); return true; }
    setHata(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "İşlem yapılamadı.");
    return false;
  };
  const gonder = () => baslat(async () => { sonuc(await teklifGonderEylemi(t.id, t.surum)); });
  const kabul = async () => {
    if (!(await onayla({ baslik: "Teklif kabul edildi mi?", metin: `${t.no} kabul edildi olarak işaretlenir; sıradaki adım iş sözleşmesi.`, tus: "Kabul edildi" }))) return;
    baslat(async () => { sonuc(await teklifKabulEylemi(t.id, t.surum)); });
  };
  const redKaydet = () => baslat(async () => {
    const r = await teklifReddetEylemi(t.id, t.surum, { gerekce: red?.gerekce ?? "" });
    if (r.hatalar?.gerekce) { setRed((x) => (x ? { ...x, hata: r.hatalar!.gerekce } : x)); document.getElementById(GEREKCE)?.focus(); return; }
    sonuc(r); setRed(null);
  });
  const musteriKaydet = () => baslat(async () => { sonuc(await teklifMusteriKaydetEylemi(t.id, t.surum)); });
  const { izin } = t;
  const kayitliKabul = t.durum === "kabul" && t.musteriKart;
  return (
    <>
      <div className={stil.eylemler}>
        {izin.duzenle && <TusBaglanti ikon="pencil" href={`/teklifler/${t.id}/duzenle`}>Düzenle</TusBaglanti>}
        {izin.duzenle && <Tus ikon="send" disabled={bekliyor || !izin.gonder} onClick={gonder}>Gönderildi olarak işaretle</Tus>}
        {izin.sonuc && <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => setRed({ gerekce: "", hata: null })}>Reddedildi</Tus>}
        {izin.sonuc && <Tus ikon="check" disabled={bekliyor} onClick={() => void kabul()}>Kabul edildi</Tus>}
        {izin.musteriKaydet && <Tus ikon="user-plus" disabled={bekliyor} onClick={musteriKaydet}>Müşteri olarak kaydet</Tus>}
        {kayitliKabul && izin.kopyala && <TusBaglanti ikon="file-signature" href="/sozlesmeler/yeni">İş sözleşmesi</TusBaglanti>}
        {kayitliKabul && izin.kopyala && t.tesisler[0] && <TusBaglanti tur="birincil" ikon="calendar-check" href={`/planlar/ac?tesis=${t.tesisler[0].id}`}>Plan aç</TusBaglanti>}
        {(t.durum === "red" || t.durum === "suresi") && izin.kopyala && <TusBaglanti tur="birincil" ikon="plus" href={`/teklifler/yeni?kopya=${t.id}`}>Yeni teklif (kopyala)</TusBaglanti>}
      </div>
      {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      <Pencere acik={!!red} baslik={`Reddedildi · ${t.no}`} onKapat={() => { if (!bekliyor) setRed(null); }} odak={`#${GEREKCE}`}
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={() => setRed(null)}>Vazgeç</Tus>
          <Tus ikon="ban" disabled={bekliyor} onClick={redKaydet}>Reddedildi olarak kaydet</Tus>
        </>}>
        <Alan id={GEREKCE} etiket="Müşterinin gerekçesi" zorunlu hata={red?.hata ?? undefined} sonuc={red?.hata ? undefined : "Kayıtta kalır; sonraki teklifte görülür."}>
          <textarea id={GEREKCE} className={stil.gerekce} maxLength={300} value={red?.gerekce ?? ""} placeholder="ör. fiyat, zamanlama, başka firma"
            aria-invalid={!!red?.hata || undefined} aria-describedby={ipucuId(GEREKCE)} onChange={(e) => setRed((x) => (x ? { gerekce: e.target.value, hata: null } : x))} />
        </Alan>
      </Pencere>
    </>
  );
}
