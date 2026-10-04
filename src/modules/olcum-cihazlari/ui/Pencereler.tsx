"use client";
/* ÖLÇÜM CİHAZI PENCERELERİ (maket olcum-cihazlari.html): cihaz ekle / düzenle (tür listeden ya da "Yeni tür…" — T7) · kalibrasyon kaydı ekle
   (tarih, geçerlilik bitişi, laboratuvar, sertifika no, sonuç, isteğe bağlı sertifika PDF'i). İletiler alanın altında; karar sunucuda. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { YENI_TUR } from "../sema";
import type { CihazTuru } from "../server/cihazlar";
import { cihazKaydetEylemi, kalibrasyonEkleEylemi } from "./eylemler";
import stil from "./cihazlar.module.css";

const C_ALAN = ["kod", "tur", "yeniTur", "marka", "model", "seri", "aralik"] as const;
type CAlan = (typeof C_ALAN)[number];
/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const CID = Object.fromEntries(C_ALAN.map((k) => [k, `cw-${k}`])) as Record<CAlan, string>;
const KID = { tarih: "kw-tarih", bitis: "kw-bitis", lab: "kw-lab", sertifika: "kw-sertifika", sonuc: "kw-sonuc", dosya: "kw-dosya" } as const;
const SONUC_SEC = [["uygun", "Uygun"], ["uygun_degil", "Uygun değil"]] as const;

export interface CihazDegeri { id: string; surum: number; kod: string; turId: string; marka: string | null; model: string | null; seri: string | null; aralik: string | null }

export function CihazPenceresi({ kapat, turler, cihaz }: { kapat: () => void; turler: CihazTuru[]; cihaz?: CihazDegeri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState<Record<CAlan, string>>({
    kod: cihaz?.kod ?? "", tur: cihaz?.turId ?? (turler.length ? "" : YENI_TUR), yeniTur: "", marka: cihaz?.marka ?? "", model: cihaz?.model ?? "", seri: cihaz?.seri ?? "", aralik: cihaz?.aralik ?? "",
  });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await cihazKaydetEylemi(cihaz?.id ?? null, cihaz?.surum ?? 0, d);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as CAlan | undefined; if (k && CID[k]) requestAnimationFrame(() => document.getElementById(CID[k])?.focus()); return; }
    kapat();
    if (cihaz) { bildir("Cihaz güncellendi."); router.refresh(); } else { bildir(`${d.kod.trim().toUpperCase()} eklendi.`); router.push(`/olcum-cihazlari/${r.id}`); }
  });
  const G = (k: Exclude<CAlan, "tur">, etiket: string, o: { zorunlu?: boolean; genis?: boolean; sonuc?: string; tip?: React.InputHTMLAttributes<HTMLInputElement> } = {}) => (
    <Alan id={CID[k]} etiket={etiket} zorunlu={o.zorunlu} genis={o.genis} hata={h[k]} sonuc={o.sonuc}>
      <Girdi id={CID[k]} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} hata={!!h[k]} mesajli={!!o.sonuc} {...o.tip} />
    </Alan>
  );
  return (
    <Pencere acik baslik={cihaz ? `${cihaz.kod} · düzenle` : "Cihaz ekle"} onKapat={kapat} odak={`#${CID.kod}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        {G("kod", "Cihaz kodu", { zorunlu: true, sonuc: "Firmanın etiketi; 3–12 hane (A–Z, 0–9, tire).", tip: { maxLength: 12, autoCapitalize: "characters" } })}
        <Alan id={CID.tur} etiket="Cihaz türü" zorunlu hata={h.tur}>
          <SecimAlani id={CID.tur} ad="Cihaz türü" deger={d.tur} secenekler={[...turler.map((t) => [t.id, t.ad] as const), [YENI_TUR, "Yeni tür…"] as const]}
            ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(CID.tur) : undefined} degistir={(v) => setD({ ...d, tur: v })} />
        </Alan>
        {d.tur === YENI_TUR && G("yeniTur", "Yeni tür adı", { zorunlu: true, genis: true, sonuc: "Firmanın cihaz türü listesine eklenir.", tip: { maxLength: 60 } })}
        {G("marka", "Marka", { tip: { maxLength: 40 } })}
        {G("model", "Model", { tip: { maxLength: 40 } })}
        {G("seri", "Seri no", { tip: { maxLength: 40 } })}
        {G("aralik", "Ölçüm aralığı", { sonuc: "Raporda yazar (ör. 0–2 kΩ).", tip: { maxLength: 60 } })}
      </FormIzgara>
    </Pencere>
  );
}

export function KalibrasyonPenceresi({ kapat, cihazId, baslik }: { kapat: () => void; cihazId: string; baslik: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [tarih, setTarih] = useState("");
  const [bitis, setBitis] = useState("");
  const [sonuc, setSonuc] = useState("uygun");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    f.set("cihaz", cihazId); f.set("tarih", tarih); f.set("bitis", bitis); f.set("sonuc", sonuc);
    const r = await kalibrasyonEkleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir("Kalibrasyon kaydı eklendi."); router.refresh();
  });
  return (
    <Pencere acik baslik="Kalibrasyon kaydı ekle" onKapat={kapat} odak={`#${KID.tarih}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      <p className={pencereMetinSinifi}><b>{baslik}</b></p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={KID.tarih} etiket="Kalibrasyon tarihi" zorunlu hata={h.tarih}>
            <TarihAlani id={KID.tarih} ad="Kalibrasyon tarihi" deger={tarih} degistir={setTarih} tanim={h.tarih ? ipucuId(KID.tarih) : undefined} />
          </Alan>
          <Alan id={KID.bitis} etiket="Geçerlilik bitişi" zorunlu hata={h.bitis}>
            <TarihAlani id={KID.bitis} ad="Geçerlilik bitişi" deger={bitis} degistir={setBitis} tanim={h.bitis ? ipucuId(KID.bitis) : undefined} />
          </Alan>
          <Alan id={KID.lab} etiket="Laboratuvar" zorunlu genis hata={h.lab}><Girdi id={KID.lab} name="lab" maxLength={80} hata={!!h.lab} /></Alan>
          <Alan id={KID.sertifika} etiket="Sertifika no" zorunlu hata={h.sertifika}><Girdi id={KID.sertifika} name="sertifika" maxLength={40} hata={!!h.sertifika} /></Alan>
          <Alan id={KID.sonuc} etiket="Sonuç" zorunlu hata={h.sonuc}>
            <SecimAlani id={KID.sonuc} ad="Sonuç" deger={sonuc} secenekler={SONUC_SEC} degistir={setSonuc} />
          </Alan>
          <Alan id={KID.dosya} etiket="Sertifika (PDF)" genis hata={h.dosya} sonuc="İsteğe bağlı; en çok 25 MB.">
            <input id={KID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf,.pdf" aria-invalid={!!h.dosya || undefined} aria-describedby={ipucuId(KID.dosya)} />
          </Alan>
        </FormIzgara>
      </form>
    </Pencere>
  );
}
