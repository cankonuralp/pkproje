"use client";
/* EKİPMAN TÜRÜ PENCERELERİ (maket ekipman-turleri.html pencereCiz): tür ekle / düzenle · basılı format PDF'i yükle (450: isteğe bağlı). Kaydı durduran ad, kod, grup,
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
import { sablondanTurEkleEylemi } from "../../rapor-format/ui/eylemler";
import type { BasiliHam } from "../../rapor-format/pdf-tipler";
import { pdfdenHam, pdfOkumaHatasi } from "../../rapor-format/ui/pdfOku";
import { useBasilidanKur } from "../../rapor-format/ui/SablonBolumu";
import { formatYukleEylemi, turKaydetEylemi } from "./eylemler";
import stil from "./turler.module.css";

const ALAN = ["ad", "kod", "grup", "brans", "periyot", "sure"] as const;
type Alan_ = (typeof ALAN)[number];
/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const ID = Object.fromEntries(ALAN.map((k) => [k, `ew-${k}`])) as Record<Alan_, string>;
const DOSYA_ID = "fw-dosya", NOT_ID = "fw-not", KUR_ID = "fw-kur";
const GRUP_SEC = GRUPLAR.map((g) => [g.k, g.ad, g.b ? bransAd(g.b) : "branş seçilir"] as const);
const BRANS_SEC = [["m", "Mekanik"], ["e", "Elektrik"]] as const;

export interface TurDegeri { id: string; surum: number; kod: string; ad: string; grup: string; brans: "m" | "e"; periyot: number; sure: number | null }
/** 436: hazır şablondan tür — pencere önerilen ad / kod / grup / periyotla açılır; kaydedince tür + şablondan taslak (rapor-format) */
export interface SablonOnerisi { anahtar: string; ad: string; tur: { ad: string; kod: string; grup: string; periyot: number } }

export function TurPenceresi({ kapat, tur, brans, sablon }: { kapat: () => void; tur?: TurDegeri; brans?: "m" | "e"; sablon?: SablonOnerisi }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState<Record<Alan_, string>>({
    ad: tur?.ad ?? sablon?.tur.ad ?? "", kod: tur?.kod ?? sablon?.tur.kod ?? "", grup: tur?.grup ?? sablon?.tur.grup ?? "", brans: tur?.brans ?? brans ?? "",
    periyot: tur ? String(tur.periyot) : sablon ? String(sablon.tur.periyot) : "", sure: tur?.sure ? String(tur.sure) : "",
  });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const ekdisi = !!d.grup && grupBul(d.grup)?.b === null;
  const kaydet = () => baslat(async () => {
    const girdi = { ...d, brans: ekdisi ? d.brans : "" };
    const r = sablon ? await sablondanTurEkleEylemi(sablon.anahtar, girdi) : await turKaydetEylemi(tur?.id ?? null, tur?.surum ?? 0, girdi);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? r.hatalar?.sablon ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as Alan_ | undefined; if (k && ID[k]) requestAnimationFrame(() => document.getElementById(ID[k])?.focus()); return; }
    kapat();
    if (tur) { bildir("Tür güncellendi."); router.refresh(); }
    else if (sablon && "formatId" in r && r.formatId) {
      bildir(`${d.ad.trim()} eklendi; rapor şablonu ${sablon.ad} formatından taslak olarak hazırlandı. Önizleyip yayınlayın.`);
      router.push(`/ekipman-turleri/${r.id}/sablon/${r.formatId}`);
    } else { bildir(`${d.ad.trim()} eklendi; rapor formatı Ek-III grubuna göre hazır, yayında.`); router.push(`/ekipman-turleri/${r.id}`); }
  });
  const G = (k: "ad" | "kod" | "periyot" | "sure", etiket: string, o: { zorunlu?: boolean; genis?: boolean; sonuc?: string; tip?: React.InputHTMLAttributes<HTMLInputElement> } = {}) => (
    <Alan id={ID[k]} etiket={etiket} zorunlu={o.zorunlu} genis={o.genis} hata={h[k]} sonuc={o.sonuc}>
      <Girdi id={ID[k]} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} hata={!!h[k]} mesajli={!!o.sonuc} {...o.tip} />
    </Alan>
  );
  return (
    <Pencere acik baslik={tur ? `${tur.ad} · düzenle` : sablon ? `Tür ekle · ${sablon.ad}` : "Tür ekle"} onKapat={kapat} odak={`#${ID.ad}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {sablon && <p className={pencereMetinSinifi}>Tür eklenir ve rapor şablonu <b>{sablon.ad}</b> formatından taslak olarak hazırlanır.</p>}
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        {G("ad", "Tür adı", { zorunlu: true, genis: true, tip: { maxLength: 60 } })}
        {G("kod", "Kod", { zorunlu: true, sonuc: tur ? "Kod değişmez." : "2–3 harf; ekipman kodu öneki.", tip: { maxLength: 3, readOnly: !!tur, autoCapitalize: "characters" } })}
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
        {G("sure", "Tahmini kontrol süresi (dk)", { sonuc: "İsteğe bağlı.", tip: { inputMode: "numeric", maxLength: 3 } })}
      </FormIzgara>
    </Pencere>
  );
}

/** sablon (2026-10-23 — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum"): rapor
    şablonunu değiştirebilen kişide "Rapor şablonunu bu PDF'e göre kur" (işaretli gelir) — yükleme bitince PDF okunur, şablon yeni taslak olarak kurulur,
    Format kurucu açılır. Kurulamazsa PDF yüklenmiş kalır, neden pencerede; "Yeniden dene". taslak: açık taslak (yerine geçer).
    2026-10-24 yapay zekâsız (reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?", "en baştan beri bunu istedim"):
    seçilen dosyanın baytları tarayıcıda okunur (rapor-format/ui/pdfOku.ts), okunan ızgara sunucuya gider; kutu firmanın ayarına bağlı değil. Aşama
    ayrı durumda (geçişin — useTransition — ilk adımındaki durum ancak iş bitince görünürdü); yeniden denemede okunan ızgara yeniden kullanılır. */
export function FormatPenceresi({ kapat, turId, turAd, kod, kullanimda, sablon = null }: {
  kapat: () => void; turId: string; turAd: string; kod: string; kullanimda: number | null; sablon?: { taslak: { surum: number; degisti: string } | null } | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const kurFn = useBasilidanKur(turId);
  const [bekliyor, baslat] = useTransition();
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [kur, setKur] = useState(true);
  /* yükleme bitti: yüklenen sürüm · şablonun aşaması · kurulamadıysa nedeni */
  const [yuklenen, setYuklenen] = useState<number | null>(null);
  const [asama, setAsama] = useState<"okunuyor" | "kuruluyor" | null>(null);
  const [kurHata, setKurHata] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const dosya = useRef<File | null>(null);
  const okunan = useRef<BasiliHam | null>(null);
  const kurBaslat = async (sira: number) => {
    setKurHata(null);
    if (!okunan.current) {
      setAsama("okunuyor");
      try {
        if (!dosya.current) throw new Error("dosya yok");
        okunan.current = await pdfdenHam(await dosya.current.arrayBuffer());
      } catch (e) { setAsama(null); setKurHata(pdfOkumaHatasi(e)); router.refresh(); return; }
    }
    setAsama("kuruluyor");
    /* kurulunca kurucu açılır — pencere o ana dek "Şablon kuruluyor…" */
    const e = await kurFn(sira, okunan.current, sablon?.taslak?.surum ?? null);
    if (e) { setAsama(null); setKurHata(e); router.refresh(); }
  };
  const yukle = () => baslat(async () => {
    const f = new FormData(form.current!);
    f.set("tur", turId);
    const secilen = f.get("dosya");
    const r = await formatYukleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    if (kur && sablon && secilen instanceof File && r.sira) {
      dosya.current = secilen; okunan.current = null; setYuklenen(r.sira);
      await kurBaslat(r.sira);
      return;
    }
    kapat(); bildir(`Format PDF'i yüklendi: sürüm ${r.sira}.`); router.refresh();
  });
  const calisiyor = bekliyor || asama !== null;
  const tuslar = yuklenen !== null
    ? <><Tus tur="ikincil" disabled={calisiyor} onClick={kapat}>Kapat</Tus>
      {kurHata && <Tus ikon="scan-text" disabled={calisiyor} aria-busy={calisiyor || undefined} onClick={() => void kurBaslat(yuklenen)}>Yeniden dene</Tus>}</>
    : <><Tus tur="ikincil" disabled={calisiyor} onClick={kapat}>Vazgeç</Tus><Tus ikon="upload" disabled={calisiyor} aria-busy={calisiyor || undefined} onClick={yukle}>Yükle</Tus></>;
  return (
    <Pencere acik baslik={kullanimda ? "Yeni PDF yükle" : "Format PDF'i yükle"} onKapat={calisiyor ? () => {} : kapat} odak={`#${DOSYA_ID}`} alt={tuslar}>
      <p className={pencereMetinSinifi}><b>{turAd}</b> · kod {kod}{kullanimda ? <><br />Son yüklenen sürüm {kullanimda}; öncekiler saklanır.</> : null}</p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {yuklenen !== null && !kurHata && <Serit tur="bilgi" ikon="scan-text">PDF yüklendi (sürüm {yuklenen}). {asama === "okunuyor" ? "PDF okunuyor…" : "Şablon kuruluyor…"}</Serit>}
      {yuklenen !== null && kurHata && <Serit tur="hata" ikon="circle-alert">PDF yüklendi (sürüm {yuklenen}). Şablon kurulamadı: {kurHata}</Serit>}
      {yuklenen === null && <form ref={form} onSubmit={(e) => { e.preventDefault(); yukle(); }}>
        <FormIzgara>
          <Alan id={DOSYA_ID} etiket="Format PDF'i" zorunlu genis hata={h.dosya} sonuc="En çok 25 MB.">
            <input id={DOSYA_ID} className={stil.dosya} name="dosya" type="file" accept="application/pdf,.pdf" aria-invalid={!!h.dosya || undefined} aria-describedby={ipucuId(DOSYA_ID)} />
          </Alan>
          <Alan id={NOT_ID} etiket="Sürüm notu" genis hata={h.not} sonuc="İsteğe bağlı (ör. basınç testi bölümü eklendi).">
            <Girdi id={NOT_ID} name="not" maxLength={120} hata={!!h.not} mesajli />
          </Alan>
        </FormIzgara>
        {sablon && <label className={stil.kutu}>
          <input id={KUR_ID} type="checkbox" checked={kur} onChange={(e) => setKur(e.target.checked)} />
          <span>Rapor şablonunu bu PDF&apos;e göre kur{sablon.taslak ? " · açık taslak bununla değiştirilir" : ""}</span>
        </label>}
      </form>}
    </Pencere>
  );
}
