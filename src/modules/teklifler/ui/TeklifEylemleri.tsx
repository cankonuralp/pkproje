"use client";
/* TEKLİF SAYFASI EYLEMLERİ (maket teklifler.html teklifCiz eylem çubuğu — başlık satırında): PDF (teklif belgesi) · duruma göre — taslak: Düzenle ·
   Gönderildi olarak işaretle; gönderildi: Reddedildi (müşterinin gerekçesi, pencere) · Kabul edildi (onay); kabul edildi: kayıtlı olmayan
   müşteride "Müşteri olarak kaydet" (Müşteriler'in uyarısı gösterilir, onaylanırsa kaydedilir) ve "Var olan müşteriye bağla" (pencere), kayıtlı
   müşteride İş sözleşmesi · Plan aç (hedef modülün yetkisiyle); red ya da süresi doldu: Yeni teklif (kopyala). Teklif müşteriye elle iletilir
   (121). Karar sunucuda; sonuç bildirimle. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus, TusBaglanti, tusSinifi } from "../../../components/tus/Tus";
import type { TeklifKarti } from "../server/teklifler";
import { teklifGonderEylemi, teklifKabulEylemi, teklifMusteriBaglaEylemi, teklifMusteriKaydetEylemi, teklifReddetEylemi, type TeklifYaniti } from "./eylemler";
import stil from "./teklifler.module.css";

const GEREKCE = "w-gerekce";
const BID = { musteri: "w-bagla-musteri", tesis: "w-bagla-tesis" } as const;
export interface BaglaMusterisi { id: string; kisa: string; tesisler: { id: string; ad: string; yer: string }[] }

/** pdf: teklif belgesinin adresi (oturumlu uç; dosya iner — maket "PDF"); musteriler: "Var olan müşteriye bağla"nın seçenekleri (yalnız yetkiliye) */
export function TeklifEylemleri({ t, pdf, musteriler = [] }: { t: TeklifKarti; pdf: string; musteriler?: readonly BaglaMusterisi[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [red, setRed] = useState<{ gerekce: string; hata: string | null } | null>(null);
  const [bag, setBag] = useState<{ musteri: string; tesis: string; hatalar: Record<string, string> } | null>(null);
  const sonuc = (r: TeklifYaniti) => {
    if (r.tamam) { bildir(r.bildirim ?? "Kaydedildi."); router.refresh(); return true; }
    bildir(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "İşlem yapılamadı.");
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
  /* Müşteriler'in uyarısı (ör. aynı vergi no başka müşteride) önce gösterilir; onaylanırsa kaydedilir */
  const musteriKaydet = () => baslat(async () => {
    const r = await teklifMusteriKaydetEylemi(t.id, t.surum, false);
    if (!r.uyarilar) { sonuc(r); return; }
    const evet = await onayla({ baslik: "Müşteri yine de kaydedilsin mi?", metin: `${Object.values(r.uyarilar).join(" ")} Müşteri zaten kayıtlıysa “Var olan müşteriye bağla” ile bağlayın.`,
      tus: "Yine de kaydet" });
    if (evet) sonuc(await teklifMusteriKaydetEylemi(t.id, t.surum, true));
  });
  const bagMusteri = musteriler.find((m) => m.id === bag?.musteri);
  const bagla = () => baslat(async () => {
    if (!bag) return;
    const r = await teklifMusteriBaglaEylemi(t.id, t.surum, { musteri: bag.musteri, tesis: bag.tesis });
    if (r.hatalar) { setBag({ ...bag, hatalar: r.hatalar }); document.getElementById(r.hatalar.musteri ? BID.musteri : BID.tesis)?.focus(); return; }
    if (sonuc(r)) setBag(null);
  });
  const { izin } = t;
  return (
    <>
      <a className={tusSinifi("ikincil")} href={pdf} download><Ikon ad="file-text" kucuk />PDF</a>
      {izin.duzenle && <TusBaglanti ikon="pencil" href={`/teklifler/${t.id}/duzenle`}>Düzenle</TusBaglanti>}
      {izin.duzenle && <Tus ikon="send" disabled={bekliyor || !izin.gonder} onClick={gonder}>Gönderildi olarak işaretle</Tus>}
      {izin.sonuc && <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => setRed({ gerekce: "", hata: null })}>Reddedildi</Tus>}
      {izin.sonuc && <Tus ikon="check" disabled={bekliyor} onClick={() => void kabul()}>Kabul edildi</Tus>}
      {izin.bagla && <Tus tur="ikincil" ikon="building-2" disabled={bekliyor} onClick={() => setBag({ musteri: "", tesis: "", hatalar: {} })}>Var olan müşteriye bağla</Tus>}
      {izin.musteriKaydet && <Tus ikon="user-plus" disabled={bekliyor} onClick={musteriKaydet}>Müşteri olarak kaydet</Tus>}
      {izin.sozlesme && <TusBaglanti ikon="file-signature" href={`/sozlesmeler/yeni?teklif=${t.id}`}>İş sözleşmesi</TusBaglanti>}
      {izin.planAc && t.tesisler[0] && <TusBaglanti tur="birincil" ikon="calendar-check" href={`/planlar/ac?tesis=${t.tesisler[0].id}`}>Plan aç</TusBaglanti>}
      {(t.durum === "red" || t.durum === "suresi") && izin.kopyala && <TusBaglanti tur="birincil" ikon="plus" href={`/teklifler/yeni?kopya=${t.id}`}>Yeni teklif (kopyala)</TusBaglanti>}
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
      <Pencere acik={!!bag} baslik={`Var olan müşteriye bağla · ${t.no}`} onKapat={() => { if (!bekliyor) setBag(null); }} odak={`#${BID.musteri}`}
        alt={<>
          <Tus tur="ikincil" disabled={bekliyor} onClick={() => setBag(null)}>Vazgeç</Tus>
          <Tus ikon="building-2" disabled={bekliyor} onClick={bagla}>Bağla</Tus>
        </>}>
        <p className={pencereMetinSinifi}>{t.aday?.unvan ?? "—"} zaten müşteri olarak kayıtlıysa teklifi o müşteriye ve tesisine bağlayın; teklifteki bilgiler olduğu gibi kalır.</p>
        <Alan id={BID.musteri} etiket="Müşteri" zorunlu hata={bag?.hatalar.musteri}>
          <SecimAlani id={BID.musteri} ad="Müşteri" deger={bag?.musteri ?? ""} ipucu="Müşteri seçin" gecersiz={!!bag?.hatalar.musteri} tanim={ipucuId(BID.musteri)}
            secenekler={musteriler.map((m) => [m.id, m.kisa] as const)} degistir={(v) => setBag((x) => (x ? { musteri: v, tesis: "", hatalar: {} } : x))} />
        </Alan>
        <Alan id={BID.tesis} etiket="Tesis" zorunlu hata={bag?.hatalar.tesis}>
          <SecimAlani id={BID.tesis} ad="Tesis" deger={bag?.tesis ?? ""} ipucu={bagMusteri ? "Tesis seçin" : "Önce müşteri seçin"} gecersiz={!!bag?.hatalar.tesis}
            tanim={ipucuId(BID.tesis)} kapali={!bagMusteri} secenekler={(bagMusteri?.tesisler ?? []).map((y) => [y.id, y.ad, y.yer] as const)}
            degistir={(v) => setBag((x) => (x ? { ...x, tesis: v, hatalar: {} } : x))} />
        </Alan>
      </Pencere>
    </>
  );
}
