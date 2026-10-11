"use client";
/* ZİMMET PENCERELERİ (maket zimmetler.html pencereCiz): teslim et (varlık · teslim alan: kişi ya da depo · tarih-saat · durum notu · fotoğraflar,
   isteğe bağlı — fotoğrafsızsa uyarı yazar, karar 62; kalibrasyonu geçmiş cihaz kişiye verilirken uyarı, karar 59) · demirbaş ekle. Teslim
   eden sunucuda o anki "kimde"den yazılır. Araç burada seçilmez: teslimi Araçlar'daki teslim tutanağıyla (kilometre, yakıt, açı fotoğrafları). Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { simdiIso } from "../../../components/secim/tarih";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { VarlikSatiri } from "../server/zimmet";
import { demirbasEkleEylemi, teslimEtEylemi } from "./eylemler";
import { kalGecti, kimdeAd } from "./ortak";
import stil from "./zimmet.module.css";

/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const TID = { varlik: "zw-varlik", alan: "zw-alan", zaman: "zw-zaman", notu: "zw-notu", foto: "zw-foto" } as const;
const DID = { kod: "dw-kod", ad: "dw-ad" } as const;

export function TeslimPenceresi({ kapat, varliklar, kisiler, bugun, varlik = "" }:
  { kapat: () => void; varliklar: VarlikSatiri[]; kisiler: { id: string; ad: string }[]; bugun: string; varlik?: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ varlik, alan: "", zaman: simdiIso().slice(0, 16), notu: "" });
  const [fotoSayisi, setFotoSayisi] = useState(0);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const v = varliklar.find((x) => x.anahtar === d.varlik);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    f.set("varlik", d.varlik); f.set("alan", d.alan); f.set("zaman", d.zaman); f.set("notu", d.notu);
    const r = await teslimEtEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    const alanAd = d.alan === "depo" ? "Depo" : kisiler.find((k) => k.id === d.alan)?.ad ?? "";
    kapat();
    bildir(`${v?.kod ?? ""}: ${v ? kimdeAd(v.kimde) : ""} → ${alanAd}${d.alan === "depo" ? "." : "; zimmet formunu imzalatıp personel kartına yükleyin."}`);
    router.push(`/zimmetler/varlik/${d.varlik.replace(":", "/")}`);   // 486: tazeleme sunucuda (eylem refresh)
  });
  return (
    <Pencere acik baslik="Teslim et" onKapat={kapat} odak={`#${TID.varlik}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Teslimi kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={TID.varlik} etiket="Varlık" zorunlu genis hata={h.varlik} sonuc={v ? `Şu an: ${kimdeAd(v.kimde)}` : undefined}>
            <SecimAlani id={TID.varlik} ad="Varlık" deger={d.varlik} ipucu="Varlık seçin" gecersiz={!!h.varlik} tanim={ipucuId(TID.varlik)}
              secenekler={varliklar.filter((x) => x.tur !== "a" && !x.pasif).map((x) => [x.anahtar, `${x.kod} · ${x.ad}`, kimdeAd(x.kimde)] as const)} degistir={(x) => setD({ ...d, varlik: x })} />
          </Alan>
          <Alan id={TID.alan} etiket="Teslim alan" zorunlu hata={h.alan} sonuc={`Teslim eden: ${v ? kimdeAd(v.kimde) : "—"}`}>
            <SecimAlani id={TID.alan} ad="Teslim alan" deger={d.alan} ipucu="Kişi ya da depo" gecersiz={!!h.alan} tanim={ipucuId(TID.alan)}
              secenekler={[["depo", "Depo", "iade"] as const, ...kisiler.map((k) => [k.id, k.ad] as const)]} degistir={(x) => setD({ ...d, alan: x })} />
          </Alan>
          <Alan id={TID.zaman} etiket="Tarih ve saat" zorunlu hata={h.zaman}>
            <TarihAlani id={TID.zaman} ad="Tarih ve saat" saat deger={d.zaman} degistir={(x) => setD({ ...d, zaman: x })} tanim={h.zaman ? ipucuId(TID.zaman) : undefined} />
          </Alan>
          <Alan id={TID.notu} etiket="Durum notu" genis hata={h.notu}>
            <textarea id={TID.notu} className={stil.notAlan} maxLength={300} value={d.notu} placeholder="Eksik parça, hasar, aksesuarlar"
              onChange={(e) => setD({ ...d, notu: e.target.value })} />
          </Alan>
          <Alan id={TID.foto} etiket="Fotoğraflar" genis hata={h.foto} uyari={fotoSayisi ? undefined : "Fotoğraf yok."} sonuc="JPEG ya da PNG; en çok 10.">
            <input id={TID.foto} className={stil.dosya} name="foto" type="file" accept="image/jpeg,image/png" multiple capture="environment"
              aria-describedby={ipucuId(TID.foto)} onChange={(e) => setFotoSayisi(e.target.files?.length ?? 0)} />
          </Alan>
        </FormIzgara>
      </form>
      {v && kalGecti(v, bugun) && d.alan && d.alan !== "depo" &&
        <Serit tur="uyari" ikon="triangle-alert">Bu cihazın kalibrasyonu geçti: teslim alanın raporları, cihaz zimmetinde kaldıkça onaya gönderilemez.</Serit>}
    </Pencere>
  );
}

export function DemirbasPenceresi({ kapat }: { kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ kod: "", ad: "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await demirbasEkleEylemi(d);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir(`${d.kod.trim().toUpperCase()} eklendi; depoda.`); router.refresh();
  });
  return (
    <Pencere acik baslik="Demirbaş ekle" onKapat={kapat} odak={`#${DID.kod}`}
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        <Alan id={DID.kod} etiket="Kod" zorunlu hata={h.kod} sonuc="Firmanın etiketi; 3–12 hane.">
          <Girdi id={DID.kod} value={d.kod} maxLength={12} hata={!!h.kod} mesajli onChange={(e) => setD({ ...d, kod: e.target.value })} />
        </Alan>
        <Alan id={DID.ad} etiket="Ad" zorunlu genis hata={h.ad} sonuc="Ör. emniyet kemeri, merdiven, baret.">
          <Girdi id={DID.ad} value={d.ad} maxLength={80} hata={!!h.ad} mesajli onChange={(e) => setD({ ...d, ad: e.target.value })} />
        </Alan>
      </FormIzgara>
    </Pencere>
  );
}
