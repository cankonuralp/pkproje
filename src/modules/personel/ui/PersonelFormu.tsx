"use client";
/* PERSONEL FORMU (maket personel.html #/yeni, #/p/<id>/duzenle) — kalıp 10 bölümler, kalıp 3 veri tipine göre alan, kalıp 19 seçim alanı, kalıp 2
   tuşlar sağda. Karar 39: zorunlu yalnız ad, işe başlama, meslek. Doğrulama sunucuda (aynı şema); iletiler alanın altında, üstte özet şerit. */
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi, ipucuId } from "../../../components/form/Form";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Aciklama, Kirinti, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { TANIMLAR } from "../../../tanim/veri";
import { bransAd, meslek as meslekBul } from "../sema";
import { personelKaydetEylemi, type FormDurumu } from "./eylemler";

export interface FormDegeri {
  id: string | null; surum: number; ad: string; eposta: string; imzaTel: string; basla: string; meslek: string; meslekMetin: string;
  diploma: string; oda: string; ekipnet: string; roller: string | null;
}

/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const ID = Object.fromEntries(["ad", "eposta", "imzaTel", "basla", "meslek", "meslekMetin", "brans", "diploma", "oda", "ekipnet"].map((k) => [k, `f-${k}`])) as Record<"ad" | "eposta" | "imzaTel" | "basla" | "meslek" | "meslekMetin" | "brans" | "diploma" | "oda" | "ekipnet", string>;

const MESLEK_SEC = TANIMLAR.meslekler.map((m) => [m.k, m.ad, bransAd(m.b)] as const);

export function PersonelFormu({ d }: { d: FormDegeri }) {
  const [durum, eylem, gonderiyor] = useActionState<FormDurumu, FormData>(personelKaydetEylemi, {});
  /* React eylem bitince formu sıfırlar (yazılanlar silinirdi) → alanlar durumda tutulur */
  const [v, setV] = useState({ ad: d.ad, eposta: d.eposta, imzaTel: d.imzaTel, meslekMetin: d.meslekMetin, diploma: d.diploma, oda: d.oda, ekipnet: d.ekipnet });
  const al = (k: keyof typeof v) => ({ name: k, value: v[k], onChange: (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) });
  const [basla, setBasla] = useState(d.basla);
  const [meslek, setMeslek] = useState(d.meslek);
  const h = durum.hatalar ?? {};
  const m = meslek ? meslekBul(meslek) : undefined;
  const baslik = d.id ? `${d.ad} · düzenle` : "Yeni personel";
  useEffect(() => {
    if (durum.yonlendir?.startsWith("/") && !durum.yonlendir.startsWith("//")) window.location.assign(durum.yonlendir);
  }, [durum.yonlendir]);
  useEffect(() => { if (durum.hatalar || durum.genel) document.getElementById("f-ozet")?.scrollIntoView({ block: "center" }); }, [durum]);
  const hataSayisi = Object.keys(h).length;
  return (
    <form action={eylem} noValidate>
      <Kirinti ogeler={d.id ? [["Personel", "/personel"], [d.ad, `/personel/${d.id}`], ["Düzenle"]] : [["Personel", "/personel"], ["Yeni personel"]]} />
      <SayfaBasi baslik={baslik} />
      {(hataSayisi > 0 || durum.genel) && <Serit tur="hata" ikon="circle-alert" id="f-ozet">{durum.genel ?? `Kaydedilmedi: ${hataSayisi} alan düzeltilmeli.`}</Serit>}
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <input type="hidden" name="surum" value={d.surum} />
      <input type="hidden" name="basla" value={basla} />
      <input type="hidden" name="meslek" value={meslek} />
      <FormSayfa>
        <FormBolum baslik="Kimlik" id="f-b1">
          <FormIzgara>
            <Alan id={ID.ad} etiket="Ad soyad" zorunlu genis hata={h.ad}><Girdi id={ID.ad} {...al("ad")} maxLength={80} hata={!!h.ad} /></Alan>
            <Alan id={ID.eposta} etiket="İş e-postası" genis hata={h.eposta} sonuc="Giriş hesabı bu adresle açılır.">
              <Girdi id={ID.eposta} {...al("eposta")} type="email" inputMode="email" maxLength={120} hata={!!h.eposta} mesajli />
            </Alan>
            <Alan id={ID.imzaTel} etiket="Mobil imza telefonu" hata={h.imzaTel}>
              <Girdi id={ID.imzaTel} {...al("imzaTel")} type="tel" inputMode="tel" maxLength={14} placeholder="05XX XXX XX XX" hata={!!h.imzaTel} />
            </Alan>
            <Alan id={ID.basla} etiket="İşe başlama" zorunlu hata={h.basla}>
              <TarihAlani id={ID.basla} ad="İşe başlama" deger={basla} degistir={setBasla} tanim={h.basla ? ipucuId(ID.basla) : undefined} />
            </Alan>
          </FormIzgara>
        </FormBolum>
        <FormBolum baslik="Meslek ve sicil" id="f-b2">
          {m && m.g.length === 0 && <Serit tur="uyari" ikon="triangle-alert">Bu meslek yetkili kişi meslekleri arasında değil.</Serit>}
          <FormIzgara>
            <Alan id={ID.meslek} etiket="Meslek" zorunlu genis hata={h.meslek}>
              <SecimAlani id={ID.meslek} ad="Meslek" deger={meslek} secenekler={MESLEK_SEC} degistir={setMeslek} ipucu="Meslek seçin" gecersiz={!!h.meslek}
                tanim={h.meslek ? ipucuId(ID.meslek) : undefined} />
            </Alan>
            {meslek === "diger" && (
              <Alan id={ID.meslekMetin} etiket="Meslek adı" zorunlu genis hata={h.meslekMetin}>
                <Girdi id={ID.meslekMetin} {...al("meslekMetin")} maxLength={60} hata={!!h.meslekMetin} />
              </Alan>
            )}
            <Alan id={ID.brans} etiket="Branş" sonuc="Meslekten gelir.">
              <Girdi id={ID.brans} readOnly value={m ? bransAd(m.b) : "—"} mesajli />
            </Alan>
            <Alan id={ID.diploma} etiket="Diploma no" hata={h.diploma}><Girdi id={ID.diploma} {...al("diploma")} maxLength={20} hata={!!h.diploma} /></Alan>
            <Alan id={ID.oda} etiket="Oda sicil no" hata={h.oda}><Girdi id={ID.oda} {...al("oda")} maxLength={20} inputMode="numeric" hata={!!h.oda} /></Alan>
            <Alan id={ID.ekipnet} etiket="EKİPNET kayıt no" hata={h.ekipnet} sonuc="Denetçide boşsa uyarı görünür.">
              <Girdi id={ID.ekipnet} {...al("ekipnet")} maxLength={20} inputMode="numeric" hata={!!h.ekipnet} mesajli />
            </Alan>
          </FormIzgara>
        </FormBolum>
        <FormBolum baslik="Giriş hesabı" id="f-b4">
          <Aciklama>{d.roller ? `Roller: ${d.roller}` : "Hesap yok"}</Aciklama>
        </FormBolum>
      </FormSayfa>
      <FormEylem>
        <TusBaglanti href={d.id ? `/personel/${d.id}` : "/personel"}>Vazgeç</TusBaglanti>
        <Tus type="submit" ikon="check" disabled={gonderiyor || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Kaydet</Tus>
      </FormEylem>
    </form>
  );
}
