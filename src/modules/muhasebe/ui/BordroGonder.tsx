"use client";
/* MAAŞ BORDROSU GÖNDER (333; maket muhasebe.html BB5 — bgPencere, BG_SUTUN, bg-yontem, bg-dosya, bg-gonder): Muhasebe'nin her sekmesinde tuş →
   pencere. Dönem (varsayılan geçen ay) · Formattan oluştur / Elle yükle (format Firma ayarları › Bordro formatı ile gelir; yokken şerit) ·
   personel listesi (seç, bordro dosyası, durum: Hazır / Bordro yok / Bu dönem gönderildi / İmzalandı) · İmzaya gönder (n). Veri pencere
   açılınca ve dönem değişince sunucudan; yetki, PDF denetimi ve yazma sunucuda (server/bordro-gonder.ts). */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan } from "../../../components/form/Form";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { donemAd } from "../../onaylar/sema";
import type { BordroGonderimi, BordroGonderimSatiri } from "../server/bordro-gonder";
import { bordroGonderEylemi, bordroGonderimiEylemi } from "./eylemler";
import stil from "./muhasebe.module.css";

const ID = { ay: "w-bg-ay", hata: "w-bg-hata" } as const;
type Yontem = "format" | "elle";
interface Durum { veri: BordroGonderimi; yontem: Yontem; sec: Set<string>; dosya: Map<string, File>; hatalar: Record<string, string>; genel: string | null }

export function BordroGonderTusu() {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState<Durum | null>(null);
  const secici = useRef<HTMLInputElement>(null);
  const hedef = useRef<string | null>(null);
  const yukle = (ay: string, onceki: Durum | null) => baslat(async () => {
    const r = await bordroGonderimiEylemi(ay);
    if (!r.veri) { bildir(r.genel ?? "Açılamadı."); return; }
    const v = r.veri;
    /* varsayılan: bütün çalışanlar seçili (maket); dönem değişince seçim ve dosyalar kalır */
    setD({ veri: v, yontem: onceki?.yontem ?? "elle", sec: onceki?.sec ?? new Set(v.kisiler.map((k) => k.id)), dosya: onceki?.dosya ?? new Map(), hatalar: {}, genel: null });
  });
  const gitti = (k: BordroGonderimSatiri) => !!k.belge && k.belge !== "geri";
  const hazir = (k: BordroGonderimSatiri) => !!d && d.yontem === "elle" && d.dosya.has(k.id);
  const gidecek = d ? d.veri.kisiler.filter((k) => d.sec.has(k.id) && !gitti(k) && hazir(k)) : [];
  const gonder = () => baslat(async () => {
    if (!d) return;
    if (!gidecek.length) { setD({ ...d, genel: d.yontem === "elle" ? "Gönderilecek bordro yok: seçili kişilere bordro dosyası yükleyin." : "Firma ayarlarında bordro formatı yok; bordroları elle yükleyin." }); return; }
    const f = new FormData();
    f.set("ay", d.veri.ay);
    for (const k of d.veri.kisiler) if (d.sec.has(k.id) && !gitti(k)) {
      f.append("secili", k.id);
      const x = d.dosya.get(k.id);
      if (x && d.yontem === "elle") f.set(`dosya-${k.id}`, x);
    }
    try {
      const r = await bordroGonderEylemi(f);
      if (r.tamam) { setD(null); bildir(r.bildirim ?? "Gönderildi."); router.refresh(); return; }
      setD({ ...d, hatalar: r.hatalar ?? {}, genel: r.genel ?? (r.hatalar && Object.keys(r.hatalar).length ? "Bazı dosyalar gönderilemedi; satırlardaki uyarıya bakın." : "Gönderilemedi.") });
    } catch { setD({ ...d, genel: "Bağlantı ya da sunucu hatası; yeniden deneyin (bir seferde en çok 25 MB)." }); }
  });
  const dosyaSec = (id: string) => { hedef.current = id; secici.current?.click(); };
  const sutunlar: Sutun<BordroGonderimSatiri>[] = d ? [
    { k: "sec", genislik: "38%", baslik: "Personel", kart: "ust", sira: 1, hucre: (k) => (
      <label className={stil.bgSec}>
        <input type="checkbox" checked={d.sec.has(k.id) && !gitti(k)} disabled={gitti(k) || bekliyor}
          onChange={(e) => { const s = new Set(d.sec); if (e.target.checked) s.add(k.id); else s.delete(k.id); setD({ ...d, sec: s, genel: null }); }} />
        <span><b>{k.ad}</b><AltSatir>{k.meslek}</AltSatir></span>
      </label>
    ) },
    { k: "bordro", genislik: "40%", baslik: "Bordro", kart: "govde", sira: 2, hucre: (k) => {
      if (gitti(k)) return <><KartEtiket>Bordro</KartEtiket><span>{donemAd(d.veri.ay)} bordrosu</span></>;
      if (d.yontem === "format") return <><KartEtiket>Bordro</KartEtiket><span className={stil.uyariMetin}>Bordro formatı yok; elle yükleyin</span></>;
      const x = d.dosya.get(k.id);
      return <><KartEtiket>Bordro</KartEtiket><span className={stil.bgDosya}>
        {x ? <>
          <span className={stil.dosyaAd}>{x.name}</span>
          <Tus tur="ikincil" ikon="x" disabled={bekliyor} aria-label={`${k.ad} bordro dosyasını kaldır`}
            onClick={() => { const m = new Map(d.dosya); m.delete(k.id); setD({ ...d, dosya: m }); }}>Kaldır</Tus>
        </> : <Tus tur="ikincil" ikon="file-plus" disabled={bekliyor} aria-label={`${k.ad} bordro dosyası seç`} onClick={() => dosyaSec(k.id)}>Dosya seç</Tus>}
        {d.hatalar[k.id] && <span className={stil.uyariMetin} role="alert">{d.hatalar[k.id]}</span>}
      </span></>;
    } },
    { k: "durum", genislik: "22%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (k) => gitti(k)
      ? <Rozet tur={k.belge === "imzali" ? "tamam" : "bekliyor"}>{k.belge === "imzali" ? "İmzalandı" : "Bu dönem gönderildi"}</Rozet>
      : hazir(k) ? <Rozet tur="tamam">Hazır</Rozet> : <Rozet tur="red">Bordro yok</Rozet> },
  ] : [];
  return (
    <>
      <Tus tur="ikincil" ikon="wallet" disabled={bekliyor && !d} onClick={() => yukle("", null)}>Maaş bordrosu gönder</Tus>
      {d && <Pencere acik baslik="Maaş bordrosu gönder" genis onKapat={() => { if (!bekliyor) setD(null); }} odak={`#${ID.ay}`}
        alt={<><Tus tur="ikincil" disabled={bekliyor} onClick={() => setD(null)}>Vazgeç</Tus>
          <Tus ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={gonder}>{gidecek.length ? `İmzaya gönder (${gidecek.length})` : "İmzaya gönder"}</Tus></>}>
        <p className={pencereMetinSinifi}>Seçilen personelin bordrosu imzasına gider; Onaylar › Diğer belgeler&apos;de e-imzayla imzalar ve Personel kartındaki bordrolara yazılır.</p>
        <Alan id={ID.ay} etiket="Dönem" zorunlu>
          <SecimAlani id={ID.ay} ad="Dönem" deger={d.veri.ay} secenekler={d.veri.aylar.map((a) => [a, donemAd(a)] as const)}
            degistir={(a) => { if (a !== d.veri.ay) yukle(a, d); }} />
        </Alan>
        <div className={stil.bgYontem} role="group" aria-label="Bordro nasıl hazırlanır">
          {([["format", "Formattan oluştur"], ["elle", "Elle yükle"]] as const).map(([y, ad]) => (
            <button key={y} type="button" className={stil.bgSekme} aria-pressed={d.yontem === y} onClick={() => setD({ ...d, yontem: y, genel: null })}>{ad}</button>
          ))}
        </div>
        {d.yontem === "format" && <Serit tur="uyari" ikon="triangle-alert">Firma ayarlarında bordro formatı yok; bordroları elle yükleyin ya da formatı Firma ayarları › Bordro formatı&apos;ndan yükleyin.</Serit>}
        <input ref={secici} type="file" accept="application/pdf" hidden aria-hidden="true" tabIndex={-1} onChange={(e) => {
          const f = e.target.files?.[0], id = hedef.current; e.target.value = "";
          if (!f || !id) return;
          const m = new Map(d.dosya); m.set(id, f);
          const h = { ...d.hatalar }; delete h[id];
          setD({ ...d, dosya: m, hatalar: h, genel: null });
        }} />
        <div className={stil.bgListe}><Liste baslik="Personel" sutunlar={sutunlar} kayitlar={d.veri.kisiler} anahtar={(k) => k.id} /></div>
        {d.genel && <p className={stil.bgHata} id={ID.hata} role="alert">{d.genel}</p>}
      </Pencere>}
    </>
  );
}
