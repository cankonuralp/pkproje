"use client";
/* TÜR BAĞLANTILARI (maket ekipman-turleri.html yirmi dördüncü tur): kontrol metodu standartları (Dökümanlar'daki güncel sürüm raporda yazar) ve
   kullanılacak ölçüm cihazı türleri (raporda her birinden kalibrasyonu geçerli cihaz istenir). "Düzenle" yalnız "değiştirir" düzeyine; karar sunucuda.
   440: standartlar branşa göre (türün branşı önce), kütüphanede olmayan Bakanlık standardı "yüklenmedi" işaretli; türde seçili olup listede
   olmayan da görünür (kaldırılabilsin). */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { baglantiKaydetEylemi } from "./eylemler";
import stil from "./turler.module.css";

export interface BaglantiSecenekleri { standartlar: { no: string; konu: string; brans: "m" | "e"; yuklu: boolean }[]; cihazTurleri: { id: string; ad: string }[] }
const BRANS_AD = { m: "Mekanik standartlar", e: "Elektrik standartlar" } as const;

export function BaglantiTusu({ turId, surum, standartlar, cihazTurleri, secenekler, brans }:
  { turId: string; surum: number; standartlar: string[]; cihazTurleri: string[]; secenekler: BaglantiSecenekleri; brans: "m" | "e" }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [std, setStd] = useState<string[]>(standartlar);
  const [ct, setCt] = useState<string[]>(cihazTurleri);
  const [genel, setGenel] = useState<string | null>(null);
  const isle = (l: string[], x: string, var_: boolean) => (var_ ? [...l, x] : l.filter((y) => y !== x));
  const tum = [...secenekler.standartlar, ...standartlar.filter((n) => !secenekler.standartlar.some((s) => s.no === n))
    .map((no) => ({ no, konu: "Kütüphanede yok", brans, yuklu: false }))];
  const gruplar = ([brans, brans === "e" ? "m" : "e"] as const).map((b) => [b, tum.filter((s) => s.brans === b)] as const).filter(([, l]) => l.length);
  const kaydet = () => baslat(async () => {
    const r = await baglantiKaydetEylemi(turId, surum, std, ct);
    if (!r.tamam) { setGenel(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Kaydedilemedi."); return; }
    setAcik(false); bildir("Kontrol metodu ve ölçüm cihazları kaydedildi."); router.refresh();
  });
  return (
    <>
      <Tus tur="ikincil" ikon="pencil" onClick={() => { setStd(standartlar); setCt(cihazTurleri); setGenel(null); setAcik(true); }}>Metot ve cihazlar</Tus>
      {acik && <Pencere acik baslik="Kontrol metodu ve ölçüm cihazları" onKapat={() => setAcik(false)} genis
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        {gruplar.length ? gruplar.map(([b, l]) => (
          <fieldset key={b} className={stil.kutular}>
            <legend className={stil.etiket}>Kontrol metodu · {BRANS_AD[b]}</legend>
            {l.map((s) => (
              <label key={s.no} className={stil.kutu}><input type="checkbox" checked={std.includes(s.no)} onChange={(e) => setStd(isle(std, s.no, e.target.checked))} />
                <span>{s.no}<span className={stil.altMetin}>{s.konu}{s.yuklu ? "" : " · yüklenmedi (Dökümanlar › Standartlar)"}</span></span></label>
            ))}
          </fieldset>
        )) : <fieldset className={stil.kutular}>
          <legend className={stil.etiket}>Kontrol metodu standartları</legend>
          <p className={stil.altMetin}>Kütüphanede standart yok; Dökümanlar › Standartlar’dan yüklenir.</p>
        </fieldset>}
        <fieldset className={stil.kutular}>
          <legend className={stil.etiket}>Kullanılacak ölçüm cihazları</legend>
          {secenekler.cihazTurleri.length ? secenekler.cihazTurleri.map((c) => (
            <label key={c.id} className={stil.kutu}><input type="checkbox" checked={ct.includes(c.id)} onChange={(e) => setCt(isle(ct, c.id, e.target.checked))} /><span>{c.ad}</span></label>
          )) : <p className={stil.altMetin}>Cihaz türü yok; Ölçüm cihazları’ndan cihaz eklerken tür tanımlanır.</p>}
        </fieldset>
      </Pencere>}
    </>
  );
}
