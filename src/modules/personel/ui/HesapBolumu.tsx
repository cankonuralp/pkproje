"use client";
/* GİRİŞ HESABI VE ROLLER (maket personel.html; karar 33–34, 32): hesap aç (e-posta + roller) · yeni geçici parola · hesabı kapat (onay) / yeniden aç ·
   roller (kaydedilmemiş değişiklik söylenir). Geçici parola YALNIZ BİR KEZ, pencerede gösterilir; sayfa yenilenince yoktur. İşlem tuşları yalnız firma
   yöneticisine çizilir; karar yine sunucuda (canDoEylem). Rol listesi rollerin açıklamasıyla; meslek yetkili değilse Denetçi satırında uyarı (engel değil). */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi, ipucuId } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { Bolum, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { ROL_ADI, ROLLER, type Rol } from "../../../server/yetki/tanim";
import { geciciParolaEylemi, hesapAcEylemi, hesapKapatEylemi, hesapYenidenAcEylemi, rolleriKaydetEylemi, type HesapDurumu } from "./eylemler";
import { HESAP_DURUM } from "./ortak";
import stil from "./personel.module.css";

/** rol açıklamaları (maket MV.ROLLER "acik") */
/* pencere alan kimliği tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const EPOSTA_ID = "h-eposta";

const ROL_ACIKLAMA: Record<Rol, string> = {
  planlama: "Plan açar, denetçi atar; müşteri, tesis ve teklifleri yürütür.",
  denetci: "Kendisine atanan planı kabul eder, sahada rapor hazırlar, son imzayı atar.",
  mekanik_yonetici: "Mekanik branş raporlarını onaylar ya da gerekçeyle geri gönderir.",
  elektrik_yonetici: "Elektrik branş raporlarını onaylar ya da gerekçeyle geri gönderir.",
  firma_yoneticisi: "Personel hesapları, rol yetkileri ve firma ayarları; hareket kaydını görür.",
  muhasebe: "Fatura ve tahsilat kaydeder; masraf formlarını onaylar; maaş ve bordroları görür.",
};

export interface HesapBilgisi { durum: "ilk" | "etkin" | "pasif"; roller: Rol[]; eposta: string; zaman: string; gorulen: string }

function RolListesi({ secili, degistir, kapali, meslekAdi, yetkiliOlabilir, onEk }: {
  secili: readonly Rol[]; degistir: (r: Rol[]) => void; kapali: boolean; meslekAdi: string; yetkiliOlabilir: boolean; onEk: string;
}) {
  return (
    <ul className={stil.secimListesi}>
      {ROLLER.map((r) => {
        const uyar = r === "denetci" && !yetkiliOlabilir;
        return (
          <li key={r}>
            <label className={stil.secimSatir}>
              <input type="checkbox" name={`${onEk}-rol`} value={r} checked={secili.includes(r)} disabled={kapali}
                onChange={(e) => degistir(e.target.checked ? ROLLER.filter((x) => x === r || secili.includes(x)) : secili.filter((x) => x !== r))} />
              <span className={stil.secimMetin}>
                <span className={stil.rolAd}>{ROL_ADI[r]}</span>
                <span className={uyar ? stil.uyari : stil.altSatir}>
                  {uyar ? `Uyarı: meslek (${meslekAdi}) yetkili kişi meslekleri arasında değil. Verilebilir; kartta uyarı görünür.` : ROL_ACIKLAMA[r]}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function HesapBolumu({ personelId, ad, meslekAdi, eposta, personelEtkin, hesap, yonetebilir, yetkiliOlabilir }: {
  personelId: string; ad: string; meslekAdi: string; eposta: string | null; personelEtkin: boolean; hesap: HesapBilgisi | null; yonetebilir: boolean; yetkiliOlabilir: boolean;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [secili, setSecili] = useState<Rol[] | null>(null);
  const [pencere, setPencere] = useState<null | "ac" | "yeni" | "parola">(null);
  const [acForm, setAcForm] = useState<{ eposta: string; roller: Rol[]; hatalar: Record<string, string> }>({ eposta: eposta ?? "", roller: [], hatalar: {} });
  const [parola, setParola] = useState<{ deger: string; yeni: boolean } | null>(null);
  const kopya = useKopyala(parola?.deger ?? null, "h-parola");
  const [hata, setHata] = useState<string | null>(null);

  const sonuc = (r: HesapDurumu, basarili: () => void) => {
    if (r.genel) { setHata(r.genel); return; }
    if (r.hatalar) { setAcForm((f) => ({ ...f, hatalar: r.hatalar! })); return; }
    setHata(null); basarili(); router.refresh();
  };
  const sec = secili ?? hesap?.roller ?? [];
  const degisti = !!hesap && [...sec].sort().join() !== [...hesap.roller].sort().join();
  const pasif = hesap?.durum === "pasif";

  const tuslar = yonetebilir && hesap && (pasif
    ? personelEtkin && <Tus tur="ikincil" ikon="refresh-cw" disabled={bekliyor} onClick={() => baslat(async () => sonuc(await hesapYenidenAcEylemi(personelId), () => bildir(`${ad}: hesap yeniden açıldı. Parolasını hatırlamıyorsa yeni geçici parola verin.`)))}>Hesabı yeniden aç</Tus>
    : <>
        <Tus tur="ikincil" ikon="key-round" onClick={() => { setHata(null); setPencere("yeni"); }}>Yeni geçici parola</Tus>
        <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={async () => {
          if (!(await onayla({ baslik: "Hesap kapatılsın mı?", metin: `${ad} artık giriş yapamaz, açık oturumları sonlanır. Kayıtları silinmez; hesap yeniden açılabilir.`, tus: "Hesabı kapat" }))) return;
          baslat(async () => sonuc(await hesapKapatEylemi(personelId), () => { setSecili(null); bildir(`${ad}: hesap kapatıldı, açık oturumları sonlandı.`); }));
        }}>Hesabı kapat</Tus>
      </>);

  return (
    <Bolum id="b-hesap" baslik="Giriş hesabı ve roller" tuslar={tuslar || undefined}>
      {hata && !pencere && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      {!hesap ? (
        <>
          <p className={stil.aciklama}>Giriş hesabı yok.</p>
          {personelEtkin
            ? yonetebilir && <Tus ikon="key-round" onClick={() => { setHata(null); setAcForm({ eposta: eposta ?? "", roller: [], hatalar: {} }); setPencere("ac"); }}>Giriş hesabı aç</Tus>
            : <Serit tur="bilgi" ikon="ban">Ayrılan personele hesap açılmaz.</Serit>}
        </>
      ) : (
        <>
          <BilgiListesi>
            <Bilgi etiket="Durum"><Rozet tur={HESAP_DURUM[hesap.durum].tur}>{HESAP_DURUM[hesap.durum].ad}</Rozet></Bilgi>
            <Bilgi etiket="Giriş e-postası" genis>{hesap.eposta}</Bilgi>
            <Bilgi etiket={hesap.durum === "ilk" ? "Geçici parola verildi" : "Son giriş"}>{hesap.zaman}</Bilgi>
            <Bilgi etiket="Görebildiği modül">{hesap.gorulen}</Bilgi>
          </BilgiListesi>
          {pasif && <div className={stil.bolumSerit}><Serit tur="bilgi" ikon="ban">Hesap kapalı: giriş yapamaz.</Serit></div>}
          <p className={stil.etiketUst}>Roller</p>
          <RolListesi secili={sec} degistir={setSecili} kapali={pasif || !yonetebilir} meslekAdi={meslekAdi} yetkiliOlabilir={yetkiliOlabilir} onEk="kart" />
          {yonetebilir && !pasif && (
            <div className={stil.bolumEylem}>
              <p className={stil.adimNot}>{degisti ? "Kaydedilmemiş değişiklik var." : ""}</p>
              {degisti && <Tus tur="ikincil" onClick={() => setSecili(null)}>Vazgeç</Tus>}
              <Tus ikon="check" disabled={!degisti || !sec.length || bekliyor}
                onClick={() => baslat(async () => sonuc(await rolleriKaydetEylemi(personelId, sec), () => { setSecili(null); bildir("Roller kaydedildi; yeni yetkiler hemen geçerli."); }))}>Rolleri kaydet</Tus>
            </div>
          )}
        </>
      )}

      <Pencere acik={pencere === "ac"} baslik="Giriş hesabı aç" onKapat={() => setPencere(null)} odak={`#${EPOSTA_ID}`}
        alt={<>
          <Tus tur="ikincil" onClick={() => setPencere(null)}>Vazgeç</Tus>
          <Tus ikon="key-round" disabled={bekliyor || !acForm.eposta.trim() || !acForm.roller.length}
            onClick={() => baslat(async () => { const r = await hesapAcEylemi(personelId, acForm.eposta, acForm.roller); sonuc(r, () => { kopya.sifirla(); setParola({ deger: r.parola!, yeni: true }); setPencere("parola"); }); })}>Hesabı aç ve parola oluştur</Tus>
        </>}>
        <p className={pencereMetinSinifi}><b>{ad}</b> · {meslekAdi}</p>
        {hata && pencere === "ac" && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        <Alan id={EPOSTA_ID} etiket="Giriş e-postası" zorunlu genis hata={acForm.hatalar.eposta} sonuc="Kişi bu adresle girer.">
          <Girdi id={EPOSTA_ID} type="email" inputMode="email" maxLength={120} value={acForm.eposta} hata={!!acForm.hatalar.eposta} mesajli
            onChange={(e) => setAcForm({ ...acForm, eposta: e.target.value })} aria-describedby={ipucuId(EPOSTA_ID)} />
        </Alan>
        <p className={stil.etiketUst}>Roller <span className={stil.zorunlu}>en az bir</span></p>
        <RolListesi secili={acForm.roller} degistir={(r) => setAcForm({ ...acForm, roller: r })} kapali={false} meslekAdi={meslekAdi} yetkiliOlabilir={yetkiliOlabilir} onEk="ac" />
        {acForm.hatalar.roller && <p className={stil.uyari}>{acForm.hatalar.roller}</p>}
      </Pencere>

      <Pencere acik={pencere === "yeni"} baslik="Yeni geçici parola" onKapat={() => setPencere(null)}
        alt={<>
          <Tus tur="ikincil" onClick={() => setPencere(null)}>Vazgeç</Tus>
          <Tus ikon="key-round" disabled={bekliyor} data-ilk-odak=""
            onClick={() => baslat(async () => { const r = await geciciParolaEylemi(personelId); sonuc(r, () => { kopya.sifirla(); setParola({ deger: r.parola!, yeni: false }); setPencere("parola"); }); })}>Parola oluştur</Tus>
        </>}>
        <p className={pencereMetinSinifi}><b>{ad}</b> · {hesap?.eposta}</p>
        {hata && pencere === "yeni" && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      </Pencere>

      <Pencere acik={pencere === "parola"} baslik={parola?.yeni ? "Giriş hesabı açıldı" : "Yeni geçici parola"} onKapat={() => { setPencere(null); setParola(null); }}
        alt={<>
          {kopya.tus}
          <Tus ikon="check" data-ilk-odak="" onClick={() => { setPencere(null); setParola(null); }}>Tamam</Tus>
        </>}>
        <p className={pencereMetinSinifi}><b>{ad}</b> · {hesap?.eposta ?? acForm.eposta}</p>
        <p className={stil.etiketUst}>Geçici parola</p>
        {/* parola yalnız pencere açıkken DOM'da (kapanınca silinir) */}
        {parola && <p className={stil.geciciParola} id="h-parola"><Kod>{parola.deger}</Kod></p>}
        {kopya.durum}
        <Serit tur="uyari" ikon="triangle-alert">Bu parola yalnız şimdi gösterilir; kişiye siz iletin. Kişi ilk girişten sonra parolasını değiştirebilir. Unutulursa yeni geçici parola verilir.</Serit>
      </Pencere>
    </Bolum>
  );
}
