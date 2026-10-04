"use client";
/* EKİPMAN TÜRÜ PENCERELERİ (maket ekipman-turleri.html pencereCiz): tür ekle / düzenle · rapor formatı yükle. Kaydı durduran ad, kod, grup,
   branş (Ek-III dışında), periyot; iletiler alanın altında. Kod yalnız eklerken (düzenlemede salt okunur). Karar ve dosya denetimi sunucuda. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { bransAd, GRUPLAR, grupBul } from "../sema";
import { formatYukleEylemi, turKaydetEylemi } from "./eylemler";
import stil from "./turler.module.css";

const ALAN = ["ad", "kod", "grup", "brans", "periyot", "sure"] as const;
type Alan_ = (typeof ALAN)[number];
/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const ID = Object.fromEntries(ALAN.map((k) => [k, `ew-${k}`])) as Record<Alan_, string>;
const DOSYA_ID = "fw-dosya", NOT_ID = "fw-not";
const GRUP_SEC = GRUPLAR.map((g) => [g.k, g.ad, g.b ? bransAd(g.b) : "branş seçilir"] as const);
const BRANS_SEC = [["m", "Mekanik"], ["e", "Elektrik"]] as const;

export interface TurDegeri { id: string; surum: number; kod: string; ad: string; grup: string; brans: "m" | "e"; periyot: number; sure: number | null }

export function TurPenceresi({ kapat, tur, brans }: { kapat: () => void; tur?: TurDegeri; brans?: "m" | "e" }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState<Record<Alan_, string>>({
    ad: tur?.ad ?? "", kod: tur?.kod ?? "", grup: tur?.grup ?? "", brans: tur?.brans ?? brans ?? "",
    periyot: tur ? String(tur.periyot) : "", sure: tur?.sure ? String(tur.sure) : "",
  });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const ekdisi = !!d.grup && grupBul(d.grup)?.b === null;
  const kaydet = () => baslat(async () => {
    const r = await turKaydetEylemi(tur?.id ?? null, tur?.surum ?? 0, { ...d, brans: ekdisi ? d.brans : "" });
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as Alan_ | undefined; if (k && ID[k]) requestAnimationFrame(() => document.getElementById(ID[k])?.focus()); return; }
    kapat();
    if (tur) { bildir("Tür güncellendi."); router.refresh(); } else { bildir(`${d.ad.trim()} eklendi.`); router.push(`/ekipman-turleri/${r.id}`); }
  });
  const G = (k: "ad" | "kod" | "periyot" | "sure", etiket: string, o: { zorunlu?: boolean; genis?: boolean; sonuc?: string; tip?: React.InputHTMLAttributes<HTMLInputElement> } = {}) => (
    <Alan id={ID[k]} etiket={etiket} zorunlu={o.zorunlu} genis={o.genis} hata={h[k]} sonuc={o.sonuc}>
      <Girdi id={ID[k]} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} hata={!!h[k]} mesajli={!!o.sonuc} {...o.tip} />
    </Alan>
  );
  return (
    <Pencere acik baslik={tur ? `${tur.ad} · düzenle` : "Tür ekle"} onKapat={kapat} odak={`#${ID.ad}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        {G("ad", "Tür adı", { zorunlu: true, genis: true, tip: { maxLength: 60 } })}
        {G("kod", "Kod", { zorunlu: true, sonuc: tur ? "Kod değişmez (ekipman kodlarında kullanılıyor)." : "2–3 harf; ekipman kodu öneki.", tip: { maxLength: 3, readOnly: !!tur, autoCapitalize: "characters" } })}
        <Alan id={ID.grup} etiket="Ek-III grubu" zorunlu genis hata={h.grup} sonuc={ekdisi ? "Ek-III dışı: meslek kuralı uygulanmaz." : "Branş ve onaylayan yönetici gruptan gelir."}>
          <SecimAlani id={ID.grup} ad="Ek-III grubu" deger={d.grup} secenekler={GRUP_SEC} ipucu="Grup seçin" gecersiz={!!h.grup} tanim={ipucuId(ID.grup)}
            degistir={(v) => setD({ ...d, grup: v })} />
        </Alan>
        {ekdisi && (
          <Alan id={ID.brans} etiket="Branş" zorunlu hata={h.brans} sonuc="Onaylayan yönetici branştan gelir.">
            <SecimAlani id={ID.brans} ad="Branş" deger={d.brans} secenekler={BRANS_SEC} ipucu="Branş seçin" gecersiz={!!h.brans} tanim={ipucuId(ID.brans)}
              degistir={(v) => setD({ ...d, brans: v })} />
          </Alan>
        )}
        {G("periyot", "Periyot (ay)", { zorunlu: true, sonuc: "Sonraki kontrol önerisi bununla hesaplanır.", tip: { inputMode: "numeric", maxLength: 3, placeholder: "ör. 12" } })}
        {G("sure", "Tahmini kontrol süresi (dk)", { sonuc: "İsteğe bağlı; plan saat önerisinde kullanılır.", tip: { inputMode: "numeric", maxLength: 3 } })}
      </FormIzgara>
    </Pencere>
  );
}

export function FormatPenceresi({ kapat, turId, turAd, kod, kullanimda }: { kapat: () => void; turId: string; turAd: string; kod: string; kullanimda: number | null }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const yukle = () => baslat(async () => {
    const f = new FormData(form.current!);
    f.set("tur", turId);
    const r = await formatYukleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir(`Rapor formatı yüklendi: sürüm ${r.sira}.`); router.refresh();
  });
  return (
    <Pencere acik baslik={kullanimda ? "Yeni rapor formatı yükle" : "Rapor formatı yükle"} onKapat={kapat} odak={`#${DOSYA_ID}`}
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="upload" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={yukle}>Yükle</Tus></>}>
      <p className={pencereMetinSinifi}><b>{turAd}</b> · kod {kod}{kullanimda ? <><br />Kullanımdaki sürüm {kullanimda}; yeni yüklenen sonraki raporlarda kullanılır.</> : null}</p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); yukle(); }}>
        <FormIzgara>
          <Alan id={DOSYA_ID} etiket="Rapor formatı (PDF)" zorunlu genis hata={h.dosya} sonuc="En çok 25 MB.">
            <input id={DOSYA_ID} className={stil.dosya} name="dosya" type="file" accept="application/pdf,.pdf" aria-invalid={!!h.dosya || undefined} aria-describedby={ipucuId(DOSYA_ID)} />
          </Alan>
          <Alan id={NOT_ID} etiket="Sürüm notu" genis hata={h.not} sonuc="İsteğe bağlı (ör. basınç testi bölümü eklendi).">
            <Girdi id={NOT_ID} name="not" maxLength={120} hata={!!h.not} mesajli />
          </Alan>
        </FormIzgara>
      </form>
    </Pencere>
  );
}
