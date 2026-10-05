"use client";
/* YENİ İŞ SÖZLEŞMESİ (maket sozlesmeler.html #/yeni): müşteri · Dayanak teklif (326: müşterinin kabul edilmiş teklifi, isteğe bağlı — seçilince
   teklifin tesisleri kapsama eklenir; teklif sayfasındaki "İş sözleşmesi" ?teklif= ile müşteri, tesisler ve teklif dolu açar) · kapsamdaki tesisler
   (en az bir) · başlangıç · süre (ay) · ödeme vadesi · yenileme. Numara sunucuda (IS-AAYY-SIRA); bitiş başlangıç + süre − 1 gün. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi, ipucuId } from "../../../components/form/Form";
import { Kirinti, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { sozlesmeHazirlaEylemi } from "./eylemler";
import stil from "./sozlesmeler.module.css";

const OZET = "sf-ozet";
const ID = { musteri: "f-musteri", teklif: "f-teklif", baslangic: "f-baslangic", sure: "f-sure", vade: "f-vade", yenileme: "f-yenileme" } as const;
type Musteri = { id: string; kisa: string; unvan: string; tesisler: { id: string; ad: string; il: string | null; ilce: string | null }[] };
type Teklif = { id: string; no: string; musteri: string; tarih: string; tesisler: string[] };

/** baslangicDegeri: teklif sayfasından gelince (?teklif=) müşteri, teklif ve teklifin (etkin) tesisleri */
export function SozlesmeFormu({ musteriler, teklifler = [], baslangicDegeri }: {
  musteriler: Musteri[]; teklifler?: Teklif[]; baslangicDegeri?: { musteri: string; teklif: string; tesisler: string[] } | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ musteri: baslangicDegeri?.musteri ?? "", teklif: baslangicDegeri?.teklif ?? "", baslangic: "", sure: "", vade: "", yenileme: "yok" });
  const [tesisler, setTesisler] = useState<string[]>(baslangicDegeri?.tesisler ?? []);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const m = musteriler.find((x) => x.id === d.musteri);
  const mTeklifleri = teklifler.filter((t) => t.musteri === d.musteri);
  const kaydet = () => baslat(async () => {
    const r = await sozlesmeHazirlaEylemi({ ...d, tesisler });
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) {
      const k = Object.keys(r.hatalar ?? {})[0];
      requestAnimationFrame(() => (k === "tesisler" ? document.querySelector<HTMLInputElement>("[data-tesis]") : document.getElementById(ID[k as keyof typeof ID] ?? OZET))?.focus());
      return;
    }
    bildir(`${r.no} hazırlandı; müşteri imzası bekleniyor.`);
    router.push(`/sozlesmeler/${r.id}`);
  });
  const hataSayisi = Object.keys(h).length;
  return (
    <form onSubmit={(e) => { e.preventDefault(); kaydet(); }} noValidate>
      <Kirinti ogeler={[["Sözleşmeler", "/sozlesmeler"], ["Yeni sözleşme"]]} />
      <SayfaBasi baslik="Yeni iş sözleşmesi" />
      {(hataSayisi > 0 || genel) && <Serit tur="hata" ikon="circle-alert" id={OZET}>{genel ?? `Kaydedilmedi: ${hataSayisi} eksik düzeltilmeli.`}</Serit>}
      <FormSayfa>
        <FormBolum baslik="Müşteri ve kapsam" id="sf-b1">
          <FormIzgara>
            <Alan id={ID.musteri} etiket="Müşteri" zorunlu genis hata={h.musteri} sonuc={m?.unvan}>
              <SecimAlani id={ID.musteri} ad="Müşteri" deger={d.musteri} ipucu="Müşteri seçin" gecersiz={!!h.musteri} tanim={ipucuId(ID.musteri)}
                secenekler={musteriler.map((x) => [x.id, x.kisa] as const)}
                degistir={(x) => { if (x !== d.musteri) { setTesisler([]); setD({ ...d, musteri: x, teklif: "" }); } }} />
            </Alan>
            <Alan id={ID.teklif} etiket="Dayanak teklif" genis hata={h.teklif} sonuc={h.teklif ? undefined : "Kabul edilen teklif; fiyatlar oradan. Yoksa boş (sistem öncesi)."}>
              {m ? <SecimAlani id={ID.teklif} ad="Dayanak teklif" deger={d.teklif} ipucu={mTeklifleri.length ? "Teklif seçin" : "Kabul edilmiş teklif yok"} gecersiz={!!h.teklif}
                  tanim={ipucuId(ID.teklif)} kapali={!mTeklifleri.length}
                  secenekler={[["", "Yok (sistem öncesi)"], ...mTeklifleri.map((t) => [t.id, t.no, t.tarih.split("-").reverse().join(".")] as const)]}
                  degistir={(x) => {
                    setD({ ...d, teklif: x });
                    /* teklifin (etkin) tesisleri kapsama eklenir */
                    const t = mTeklifleri.find((y) => y.id === x);
                    if (t) setTesisler([...new Set([...tesisler, ...t.tesisler.filter((y) => m.tesisler.some((z) => z.id === y))])]);
                  }} />
                : <Girdi id={ID.teklif} readOnly value="Önce müşteri seçin" aria-describedby={ipucuId(ID.teklif)} />}
            </Alan>
          </FormIzgara>
          <fieldset className={stil.kutular}>
            <legend className={stil.etiket}>Kapsamdaki tesisler (en az bir)</legend>
            {m ? m.tesisler.map((t) => (
              <label key={t.id} className={stil.kutu}>
                <input type="checkbox" data-tesis={t.id} checked={tesisler.includes(t.id)}
                  onChange={(e) => setTesisler(e.target.checked ? [...tesisler, t.id] : tesisler.filter((x) => x !== t.id))} />
                <span>{t.ad}<span className={stil.ipucu}>{[t.ilce, t.il].filter(Boolean).join(" / ")}</span></span>
              </label>
            )) : <p className={stil.ipucu}>Önce müşteri seçin.</p>}
          </fieldset>
          {m && m.tesisler.length === 0 && <p className={stil.ipucu}>Bu müşterinin etkin tesisi yok; önce Müşteriler’den tesis ekleyin.</p>}
          {h.tesisler && <p className={stil.hata}>{h.tesisler}</p>}
        </FormBolum>
        <FormBolum baslik="Süre ve ödeme" id="sf-b2">
          <FormIzgara>
            <Alan id={ID.baslangic} etiket="Başlangıç" zorunlu hata={h.baslangic}>
              <TarihAlani id={ID.baslangic} ad="Başlangıç" deger={d.baslangic} degistir={(x) => setD({ ...d, baslangic: x })} tanim={h.baslangic ? ipucuId(ID.baslangic) : undefined} />
            </Alan>
            <Alan id={ID.sure} etiket="Süre (ay)" zorunlu hata={h.sure} sonuc="Çoğu periyot 12 ay.">
              <Girdi id={ID.sure} value={d.sure} inputMode="numeric" maxLength={2} hata={!!h.sure} mesajli onChange={(e) => setD({ ...d, sure: e.target.value })} />
            </Alan>
            <Alan id={ID.vade} etiket="Ödeme vadesi (gün)" zorunlu hata={h.vade} sonuc="Fatura tarihinden.">
              <Girdi id={ID.vade} value={d.vade} inputMode="numeric" maxLength={3} hata={!!h.vade} mesajli onChange={(e) => setD({ ...d, vade: e.target.value })} />
            </Alan>
            <Alan id={ID.yenileme} etiket="Yenileme" zorunlu hata={h.yenileme}>
              <SecimAlani id={ID.yenileme} ad="Yenileme" deger={d.yenileme} secenekler={[["yok", "Yeni teklifle"], ["otomatik", "Kendiliğinden (fesih yoksa)"]]}
                degistir={(x) => setD({ ...d, yenileme: x })} />
            </Alan>
          </FormIzgara>
        </FormBolum>
      </FormSayfa>
      <FormEylem>
        <TusBaglanti href="/sozlesmeler">Vazgeç</TusBaglanti>
        <Tus type="submit" ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined}>Sözleşmeyi hazırla</Tus>
      </FormEylem>
    </form>
  );
}
