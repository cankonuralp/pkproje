"use client";
/* BELGEYİ DOLDUR — 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir
   müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"). Belgenin sayfasında (sözleşme …) tuş; pencerede
   firmanın formatındaki elle doldurulan yerler (src/belge/doldurma.ts elleAlanlari — türüne göre girdi: yazı, sayı, tarih, seçim, evet / hayır),
   altında belgenin önizlemesi girilen değerlerle (src/belge/belge.ts belgeFormu — PDF'le aynı çizici). Kaydet: değerler önce tarayıcıda aynı saf
   denetimden geçer, sonra çağıranın eylemine (kaydet — yetki, kayıt ve sürüm kilidi sunucuda: server/doldurma.ts belgeDoldurmaKaydet). Zorunlu
   yerin boşluğu uyarıdır, kaydı durdurmaz. Formatta elle doldurulan yer yoksa tuş yok. */
import { useRouter } from "next/navigation";
import { useDeferredValue, useId, useMemo, useState, useTransition } from "react";
import "../../../belge/belge.css";
import { belgeFormu } from "../../../belge/belge";
import { eksikElleAlanlar, elleAlanlari, elleDegerleriDenetle, ELLE_DEGER_EN_UZUN, type ElleAlan } from "../../../belge/doldurma";
import type { BelgeDegerleri, BelgeTuru } from "../../../belge/katalog";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import stil from "./doldurma.module.css";

type KaydetYaniti = { tamam?: boolean; genel?: string; hatalar?: Record<string, string> };
const EVET = [["", "Boş", ""], ["evet", "Evet", ""], ["hayir", "Hayır", ""]] as const;

export function BelgeDoldurmaTusu(p: {
  belge: BelgeTuru; baslik: string; tanim: FormatTanimi; degerler: Record<string, string>; surum: number | null;
  kaydet: (degerler: Record<string, string>, surum: number | null) => Promise<KaydetYaniti>;
  onizlemeVerisi: { firma: { ad: string; kod: string; adres?: string | null; logo?: string | null }; degerler: BelgeDegerleri };
}) {
  const router = useRouter();
  const bildir = useBildir();
  const kok = `${p.belge}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const alanlar = useMemo(() => elleAlanlari(p.tanim), [p.tanim]);
  const [acik, setAcik] = useState(false);
  const [girilen, setGirilen] = useState<Record<string, string>>({});
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  /* önizleme yazarken her tuşta değil, boşta çizilir */
  const ertelenen = useDeferredValue(girilen);
  const { firma, degerler: belgeDegerleri } = p.onizlemeVerisi;
  const onizleme = useMemo(() => (acik ? belgeFormu(p.tanim, firma, belgeDegerleri, p.baslik, ertelenen) : null),
    [acik, p.tanim, firma, belgeDegerleri, p.baslik, ertelenen]);
  const eksik = useMemo(() => (acik ? eksikElleAlanlar(p.tanim, girilen).length : 0), [acik, p.tanim, girilen]);
  if (!alanlar.length) return null;

  const id = (a: ElleAlan) => `${kok}-${a.id}`;
  const yaz = (a: ElleAlan, v: string) => {
    setGirilen((g) => ({ ...g, [a.id]: v }));
    if (hatalar[a.id]) setHatalar((h) => Object.fromEntries(Object.entries(h).filter(([k]) => k !== a.id)));
  };
  const ac = () => { setGirilen({ ...p.degerler }); setHatalar({}); setGenel(null); setAcik(true); };
  const ilkHatayaGit = (h: Record<string, string>) => {
    const a = alanlar.find((x) => h[x.id]);
    if (a) requestAnimationFrame(() => document.getElementById(id(a))?.focus());
  };
  const kaydet = () => {
    const d = elleDegerleriDenetle(p.tanim, girilen);
    if (!d.tamam) { setHatalar(d.hatalar); setGenel(d.hatalar.degerler ?? null); ilkHatayaGit(d.hatalar); return; }
    baslat(async () => {
      let r: KaydetYaniti;
      try { r = await p.kaydet(d.degerler, p.surum); } catch { r = { genel: "Kaydedilemedi." }; }
      if (!r.tamam) {
        const h = r.hatalar ?? {};
        setHatalar(h);
        setGenel(r.genel ?? h.degerler ?? (alanlar.some((a) => h[a.id]) ? null : "Kaydedilemedi."));
        ilkHatayaGit(h);
        return;
      }
      setAcik(false); bildir(`${p.baslik} · doldurulan yerler kaydedildi.`); router.refresh();
    });
  };

  const girdi = (a: ElleAlan) => {
    const deger = girilen[a.id] ?? "", hata = hatalar[a.id];
    const ortak = { id: id(a), "aria-invalid": hata ? true : undefined, "aria-describedby": hata ? ipucuId(id(a)) : undefined };
    switch (a.alan) {
      case "tarih": return <TarihAlani id={id(a)} ad={a.ad} deger={deger} degistir={(v) => yaz(a, v)} tanim={hata ? ipucuId(id(a)) : undefined} />;
      case "secim": return <SecimAlani id={id(a)} ad={a.ad} deger={deger} gecersiz={!!hata} tanim={hata ? ipucuId(id(a)) : undefined}
        secenekler={[["", "Boş", ""] as const, ...(a.secenekler ?? []).map((x) => [x, x, ""] as const)]} degistir={(v) => yaz(a, v)} />;
      case "evet": return <SecimAlani id={id(a)} ad={a.ad} deger={deger} gecersiz={!!hata} tanim={hata ? ipucuId(id(a)) : undefined} secenekler={EVET}
        degistir={(v) => yaz(a, v)} />;
      case "sayi": return <Girdi id={id(a)} hata={!!hata} inputMode="decimal" value={deger} placeholder={a.varsayilan} maxLength={60}
        onChange={(e) => yaz(a, e.target.value)} />;
      case "metin": return <textarea {...ortak} className={stil.yazi} value={deger} placeholder={a.varsayilan} maxLength={ELLE_DEGER_EN_UZUN}
        rows={a.varsayilan && a.varsayilan.length > 80 ? 4 : 2} onChange={(e) => yaz(a, e.target.value)} />;
    }
  };

  return (
    <>
      <Tus tur="ikincil" ikon="pencil" onClick={ac} data-belge={p.belge}>Belgeyi doldur</Tus>
      {acik && (
        <Pencere acik genis baslik={`Belgeyi doldur · ${p.baslik}`} onKapat={() => setAcik(false)} odak={`#${id(alanlar[0])}`}
          alt={<>
            <Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus>
            <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus>
          </>}>
          <div className={stil.form}>
            {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
            {eksik > 0 && <Serit tur="uyari" ikon="triangle-alert">{eksik} zorunlu yer boş.</Serit>}
            <FormIzgara>
              {alanlar.map((a) => (
                <Alan key={a.id} id={id(a)} etiket={a.birim ? `${a.ad} (${a.birim})` : a.ad} zorunlu={a.zorunlu} hata={hatalar[a.id]} genis={a.alan === "metin"}>
                  {girdi(a)}
                </Alan>
              ))}
            </FormIzgara>
          </div>
          <p className={stil.onizlemeBas} id={`${kok}-onizleme`}>Belge önizlemesi</p>
          <div className={`rb-onizleme ${stil.onizleme}`} role="region" aria-labelledby={`${kok}-onizleme`} tabIndex={0}>{onizleme}</div>
        </Pencere>
      )}
    </>
  );
}
