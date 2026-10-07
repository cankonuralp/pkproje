"use client";
/* PERSONEL KARTI TUŞLARI (366; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; karar 43 "ayrılan personel silinmez"): Düzenle · çalışan kişide
   "Ayrıldı" (ayrılış tarihiyle; giriş hesabı veritabanı tetiğiyle kapanır) · hiç kullanılmamış (deneme) kişide yalnız yöneticiye "Sil" · ayrılan kişide
   "Ayrılışı geri al" (yanlışlıkla; hesap kapalı kalır). Tuşlar yalnız "yaz" düzeyine; karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { bugunIso } from "../../../components/secim/tarih";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { odakKoru } from "../../../components/sil/odak";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { personelAyrildiEylemi, personelGeriAlEylemi, personelSilEylemi } from "./eylemler";

const TARIH_ID = "pw-ayrildi";

export function PersonelTuslari({ id, ad, surum, ayrildi, sil }: { id: string; ad: string; surum: number; ayrildi: boolean; sil: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const geriAl = async () => {
    if (!(await onayla({ baslik: "Ayrılış geri alınsın mı?", metin: `${ad} yeniden çalışıyor görünür. Giriş hesabı kapalı kalır; gerekirse Giriş hesabı bölümünden yeniden açın.`, tus: "Geri al" }))) return;
    baslat(async () => {
      const r = await personelGeriAlEylemi(id, surum);
      bildir(r.tamam ? `${ad} yeniden çalışıyor.` : r.genel ?? "Kaydedilemedi.");
      router.refresh(); odakKoru();
    });
  };
  return (
    <>
      <TusBaglanti tur="birincil" href={`/personel/${id}/duzenle`} ikon="pencil">Düzenle</TusBaglanti>
      {ayrildi
        ? <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={geriAl}>Ayrılışı geri al</Tus>
        : <>
          <Tus tur="ikincil" ikon="log-out" onClick={() => setAcik(true)}>Ayrıldı</Tus>
          {sil && <SilTusu ad={ad} baslik="Personeli sil" yanEtki="giriş hesabı da silinir" sil={() => personelSilEylemi(id)} donus="/personel" />}
        </>}
      {acik && <AyrildiPenceresi id={id} ad={ad} surum={surum} kapat={() => setAcik(false)} />}
    </>
  );
}

function AyrildiPenceresi({ id, ad, surum, kapat }: { id: string; ad: string; surum: number; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [tarih, setTarih] = useState(bugunIso());
  const [hata, setHata] = useState<string | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await personelAyrildiEylemi(id, surum, tarih);
    setHata(r.hatalar?.ayrildi ?? null); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir(`${ad} ayrıldı; giriş hesabı kapandı, geçmişi duruyor.`); router.refresh(); odakKoru();
  });
  return (
    <Pencere acik baslik="Ayrıldı" onKapat={kapat}
      alt={<>
        <Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus>
        <Tus ikon="log-out" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Ayrıldı olarak kaydet</Tus>
      </>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <p><b>{ad}</b> silinmez: zimmetleri, raporları, özlük dosyası ve geçmişi durur. Listede &quot;Ayrılanlar&quot;da görünür; giriş hesabı kapanır,
        yeni plana atanamaz.</p>
      <Alan id={TARIH_ID} etiket="Ayrılış tarihi" zorunlu hata={hata ?? undefined}>
        <TarihAlani id={TARIH_ID} ad="Ayrılış tarihi" deger={tarih} degistir={setTarih} tanim={hata ? ipucuId(TARIH_ID) : undefined} />
      </Alan>
    </Pencere>
  );
}
