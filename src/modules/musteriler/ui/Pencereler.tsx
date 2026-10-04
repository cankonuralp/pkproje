"use client";
/* MÜŞTERİ / TESİS PENCERELERİ (maket musteriler.html pencereCiz: müşteri ekle / düzenle · tesis ekle / düzenle · pasif yap / yeniden etkinleştir).
   Kaydı durduran yalnız ad ve biçim (alanın altında hata); aynı vergi / SGK no başka kayıtta varsa sunucu UYARI döner: alanın altında uyarı +
   üstte şerit, tuş "Yine de kaydet" olur; ikinci tık onayla kaydeder (karar 45, 46). Uyarılı alan değişince uyarı düşer. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Kosullar } from "../../../components/bilgi/Bilgi";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { musteriKaydetEylemi, musteriPasifEylemi, tesisKaydetEylemi, tesisPasifEylemi, type PencereDurumu } from "./eylemler";
import { IL_SECENEK, ilceSecenek } from "./ortak";

type Harita = Record<string, string>;
const MUSTERI_ALAN = ["unvan", "kisa", "vd", "vno", "eposta", "tel", "ilgili"] as const;
const TESIS_ALAN = ["ad", "adres", "il", "ilce", "sgk"] as const;
/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const MID = Object.fromEntries(MUSTERI_ALAN.map((k) => [k, `mw-${k}`])) as Record<(typeof MUSTERI_ALAN)[number], string>;
const TID = Object.fromEntries(TESIS_ALAN.map((k) => [k, `tw-${k}`])) as Record<(typeof TESIS_ALAN)[number], string>;

export interface MusteriDegeri { id: string; surum: number; unvan: string; kisa: string; vd: string | null; vno: string | null; eposta: string | null; tel: string | null; ilgili: string | null }
export interface TesisDegeri { id: string; surum: number; ad: string; adres: string | null; il: string | null; ilce: string | null; sgk: string | null }

/** pencerenin ortak durumu: değerler, hata, uyarı (görüldü mü), genel ileti */
function useKayit<A extends string>(alanlar: readonly A[], ilk: Partial<Record<A, string | null>> | null) {
  const bas = () => Object.fromEntries(alanlar.map((k) => [k, ilk?.[k] ?? ""])) as Record<A, string>;
  const [d, setD] = useState(bas);
  const [hata, setHata] = useState<Harita>({});
  const [uyari, setUyari] = useState<Harita>({});
  const [genel, setGenel] = useState<string | null>(null);
  const yaz = (k: A, v: string) => { setD((x) => ({ ...x, [k]: v })); if (uyari[k]) setUyari({}); };
  const sifirla = () => { setD(bas()); setHata({}); setUyari({}); setGenel(null); };
  const sonuc = (r: PencereDurumu) => { setHata(r.hatalar ?? {}); setUyari(r.uyarilar ?? {}); setGenel(r.genel ?? null); return !!r.tamam; };
  const odakla = (r: PencereDurumu, id: Record<string, string>) => {
    const k = Object.keys(r.hatalar ?? r.uyarilar ?? {})[0];
    if (k && id[k]) requestAnimationFrame(() => document.getElementById(id[k])?.focus());
  };
  return { d, yaz, hata, uyari, genel, sifirla, sonuc, odakla, uyariVar: Object.keys(uyari).length > 0 };
}

const UyariSeridi = () => <Serit tur="uyari" ikon="triangle-alert">Aynı bilgi başka bir kayıtta da var. Doğruysa “Yine de kaydet”.</Serit>;

export function MusteriPenceresi({ acik, kapat, musteri }: { acik: boolean; kapat: () => void; musteri?: MusteriDegeri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const k = useKayit(MUSTERI_ALAN, musteri ?? null);
  const kapa = () => { k.sifirla(); kapat(); };
  const kaydet = () => baslat(async () => {
    const r = await musteriKaydetEylemi(musteri?.id ?? null, musteri?.surum ?? 0, k.d, k.uyariVar);
    if (!k.sonuc(r)) { k.odakla(r, MID); return; }
    const yeniGiris = !!k.d.eposta.trim() && !musteri?.eposta;
    kapat();
    if (musteri) { bildir(`Müşteri güncellendi.${yeniGiris ? " Müşteri girişi bu e-postayla açılacak." : ""}`); router.refresh(); }
    else { bildir(`${k.d.kisa.trim() || k.d.unvan.trim().split(/\s+/).slice(0, 2).join(" ")} eklendi.${k.d.eposta.trim() ? "" : " E-posta yok; müşteri girişi e-posta yazılınca açılır."}`); router.push(`/musteriler/${r.id}`); }
    k.sifirla();
  });
  const A = (a: (typeof MUSTERI_ALAN)[number], etiket: string, o: { zorunlu?: boolean; genis?: boolean; sonuc?: string; tip?: Partial<React.InputHTMLAttributes<HTMLInputElement>> } = {}) => (
    <Alan id={MID[a]} etiket={etiket} zorunlu={o.zorunlu} genis={o.genis} hata={k.hata[a]} uyari={k.uyari[a]} sonuc={o.sonuc}>
      <Girdi id={MID[a]} value={k.d[a]} onChange={(e) => k.yaz(a, e.target.value)} hata={!!k.hata[a]} mesajli={!!(k.uyari[a] || o.sonuc)} {...o.tip} />
    </Alan>
  );
  return (
    <Pencere acik={acik} baslik={musteri ? "Müşteriyi düzenle" : "Müşteri ekle"} onKapat={kapa} odak={`#${MID.unvan}`} genis
      alt={<>
        <Tus tur="ikincil" onClick={kapa}>Vazgeç</Tus>
        <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>{k.uyariVar ? "Yine de kaydet" : "Kaydet"}</Tus>
      </>}>
      {k.genel && <Serit tur="hata" ikon="circle-alert">{k.genel}</Serit>}
      {k.uyariVar && <UyariSeridi />}
      <FormIzgara>
        {A("unvan", "Ünvan", { zorunlu: true, genis: true, sonuc: "Resmî ünvan; raporun işyeri bölümünde yazar.", tip: { maxLength: 160 } })}
        {A("kisa", "Kısa ad", { sonuc: "Listelerde görünür; boşsa ünvanın ilk iki sözcüğü.", tip: { maxLength: 40 } })}
        {A("vd", "Vergi dairesi", { tip: { maxLength: 40 } })}
        {A("vno", "Vergi no", { sonuc: "Boşsa kayıt olur, müşteri sayfasında hatırlatılır.", tip: { inputMode: "numeric", maxLength: 11 } })}
        {A("eposta", "E-posta", { genis: true, sonuc: musteri ? "Müşteri girişinin kullanıcı adı; faturalar da bu adrese." : "Kaydedince müşteri girişi bu adresle açılır; parola siz gönderince gider.",
          tip: { type: "email", inputMode: "email", maxLength: 120 } })}
        {A("tel", "Telefon", { tip: { type: "tel", inputMode: "tel", maxLength: 20 } })}
        {A("ilgili", "İlgili kişi", { genis: true, sonuc: "Ad ve görev.", tip: { maxLength: 80 } })}
      </FormIzgara>
    </Pencere>
  );
}

export function TesisPenceresi({ acik, kapat, musteriId, unvan, tesis }: { acik: boolean; kapat: () => void; musteriId: string; unvan: string; tesis?: TesisDegeri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const k = useKayit(TESIS_ALAN, tesis ?? null);
  const kapa = () => { k.sifirla(); kapat(); };
  const kaydet = () => baslat(async () => {
    const r = await tesisKaydetEylemi(musteriId, tesis?.id ?? null, tesis?.surum ?? 0, k.d, k.uyariVar);
    if (!k.sonuc(r)) { k.odakla(r, TID); return; }
    kapat();
    if (tesis) { bildir("Tesis güncellendi."); router.refresh(); }
    else { bildir(`${k.d.ad.trim()} eklendi.`); router.push(`/musteriler/tesis/${r.id}`); }
    k.sifirla();
  });
  const A = (a: "ad" | "adres" | "sgk", etiket: string, o: { zorunlu?: boolean; sonuc?: string; tip?: Partial<React.InputHTMLAttributes<HTMLInputElement>> } = {}) => (
    <Alan id={TID[a]} etiket={etiket} zorunlu={o.zorunlu} genis hata={k.hata[a]} uyari={k.uyari[a]} sonuc={o.sonuc}>
      <Girdi id={TID[a]} value={k.d[a]} onChange={(e) => k.yaz(a, e.target.value)} hata={!!k.hata[a]} mesajli={!!(k.uyari[a] || o.sonuc)} {...o.tip} />
    </Alan>
  );
  return (
    <Pencere acik={acik} baslik={tesis ? "Tesisi düzenle" : "Tesis ekle"} onKapat={kapa} odak={`#${TID.ad}`} genis
      alt={<>
        <Tus tur="ikincil" onClick={kapa}>Vazgeç</Tus>
        <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>{k.uyariVar ? "Yine de kaydet" : "Kaydet"}</Tus>
      </>}>
      <p className={pencereMetinSinifi}><b>{unvan}</b></p>
      {k.genel && <Serit tur="hata" ikon="circle-alert">{k.genel}</Serit>}
      {k.uyariVar && <UyariSeridi />}
      <FormIzgara>
        {A("ad", "Tesis adı", { zorunlu: true, sonuc: "Müşterinin kendi kullandığı ad (ör. Merkez Fabrika).", tip: { maxLength: 80 } })}
        {A("adres", "Adres", { sonuc: "Raporda yazar.", tip: { maxLength: 160 } })}
        <Alan id={TID.il} etiket="İl" hata={k.hata.il}>
          <SecimAlani id={TID.il} ad="İl" deger={k.d.il} secenekler={IL_SECENEK} ipucu="İl seçin" gecersiz={!!k.hata.il} tanim={k.hata.il ? ipucuId(TID.il) : undefined}
            degistir={(v) => { if (v !== k.d.il) k.yaz("ilce", ""); k.yaz("il", v); }} />
        </Alan>
        <Alan id={TID.ilce} etiket="İlçe" hata={k.hata.ilce}>
          {k.d.il
            ? <SecimAlani id={TID.ilce} ad="İlçe" deger={k.d.ilce} secenekler={ilceSecenek(k.d.il)} ipucu="İlçe seçin" gecersiz={!!k.hata.ilce}
                tanim={k.hata.ilce ? ipucuId(TID.ilce) : undefined} degistir={(v) => k.yaz("ilce", v)} />
            : <Girdi id={TID.ilce} readOnly value="Önce il seçin" />}
        </Alan>
        {A("sgk", "SGK DETSİS NO", { sonuc: "26 hane. Boşsa kayıt olur; rapor imzalanırken hatırlatılır.", tip: { inputMode: "numeric", maxLength: 26 } })}
      </FormIzgara>
    </Pencere>
  );
}

/** pasif yap / yeniden etkinleştir (karar 48): silinmez, listelerden kalkar; müşteri pasifse tesisleri de */
export function PasifPenceresi({ acik, kapat, tur, id, surum, ad, pasif }:
  { acik: boolean; kapat: () => void; tur: "musteri" | "tesis"; id: string; surum: number; ad: string; pasif: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const kapa = () => { setHata(null); kapat(); };
  const uygula = () => baslat(async () => {
    const r = await (tur === "musteri" ? musteriPasifEylemi(id, surum, !pasif) : tesisPasifEylemi(id, surum, !pasif));
    if (!r.tamam) { setHata(r.genel ?? "Kaydedilemedi."); return; }
    kapa(); bildir(pasif ? "Yeniden etkinleştirildi." : "Pasif yapıldı; kayıtları duruyor."); router.refresh();
  });
  const kosullar = ["Silinmez: raporları, planları ve arşivi olduğu gibi kalır.", "Listelerden kalkar; yeni plan ve teklif açılmaz.",
    ...(tur === "musteri" ? ["Müşteri girişi kapanır; bütün tesisleri de pasif olur."] : []), "İstenince yeniden etkinleştirilir."];
  return (
    <Pencere acik={acik} baslik={pasif ? "Yeniden etkinleştir" : "Pasif yap"} onKapat={kapa}
      alt={<>
        <Tus tur="ikincil" onClick={kapa}>Vazgeç</Tus>
        <Tus ikon={pasif ? "undo-2" : "ban"} disabled={bekliyor} aria-busy={bekliyor || undefined} data-ilk-odak="" onClick={uygula}>{pasif ? "Etkinleştir" : "Pasif yap"}</Tus>
      </>}>
      <p className={pencereMetinSinifi}><b>{ad}</b></p>
      {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      {pasif
        ? <p className={pencereMetinSinifi}>Kayıt listelere geri döner; yeniden plan ve teklif açılabilir.{tur === "musteri" ? " Müşteriyle birlikte pasif olan tesisler de döner." : ""}</p>
        : <Kosullar ogeler={kosullar.map((metin) => ({ tur: "tamam" as const, metin }))} />}
    </Pencere>
  );
}
