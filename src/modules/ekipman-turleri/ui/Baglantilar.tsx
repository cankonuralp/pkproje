"use client";
/* TÜR BAĞLANTILARI (maket ekipman-turleri.html yirmi dördüncü tur): kontrol metodu standartları (Dökümanlar'daki güncel sürüm raporda yazar) ve
   kullanılacak ölçüm cihazı türleri (raporda her birinden kalibrasyonu geçerli cihaz istenir). "Düzenle" yalnız "değiştirir" düzeyine; karar sunucuda.
   440: standartlar branşa göre (türün branşı önce), kütüphanede olmayan Bakanlık standardı "yüklenmedi" işaretli; türde seçili olup listede
   olmayan da görünür (kaldırılabilsin). 2026-10-26 (reisim: "bu ekranda sadece dökümanlarda ekli olan standartlar gözüküyor burada el ile ekleme
   olmalı"): listede olmayan standart numarası ve adıyla elle eklenir — Dökümanlar'a "Yüklenmedi" olarak tanımlanır, burada seçili gelir; Kaydet'le türe
   bağlanır. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { baglantiKaydetEylemi, standartElleEkleEylemi } from "./eylemler";
import stil from "./turler.module.css";

export interface BaglantiSecenekleri { standartlar: { no: string; konu: string; brans: "m" | "e"; yuklu: boolean }[]; cihazTurleri: { id: string; ad: string }[] }
const BRANS_AD = { m: "Mekanik standartlar", e: "Elektrik standartlar" } as const;
const STD_NO = "bag-std-no", STD_KONU = "bag-std-konu";

export function BaglantiTusu({ turId, surum, standartlar, cihazTurleri, secenekler, brans }:
  { turId: string; surum: number; standartlar: string[]; cihazTurleri: string[]; secenekler: BaglantiSecenekleri; brans: "m" | "e" }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [std, setStd] = useState<string[]>(standartlar);
  const [ct, setCt] = useState<string[]>(cihazTurleri);
  const [genel, setGenel] = useState<string | null>(null);
  /* elle eklenenler (bu pencerede) ve ekleme formu */
  const [eklenen, setEklenen] = useState<BaglantiSecenekleri["standartlar"]>([]);
  const [yeni, setYeni] = useState({ no: "", konu: "" });
  const [yeniHata, setYeniHata] = useState<Record<string, string>>({});
  const [ekleniyor, ekle] = useTransition();
  const elleEkle = () => ekle(async () => {
    const r = await standartElleEkleEylemi(turId, yeni);
    setYeniHata(r.hatalar ?? (r.genel ? { no: r.genel } : {}));
    if (!r.tamam || !r.secenek) return;
    const x = r.secenek;
    setEklenen((l) => (l.some((y) => y.no === x.no) ? l : [...l, x]));
    setStd((l) => (l.includes(x.no) ? l : [...l, x.no]));
    setYeni({ no: "", konu: "" });
    bildir(`${x.no} eklendi ve seçildi.`);
  });
  const isle = (l: string[], x: string, var_: boolean) => (var_ ? [...l, x] : l.filter((y) => y !== x));
  const liste = [...secenekler.standartlar, ...eklenen.filter((e) => !secenekler.standartlar.some((s) => s.no === e.no))];
  const tum = [...liste, ...standartlar.filter((n) => !liste.some((s) => s.no === n))
    .map((no) => ({ no, konu: "Kütüphanede yok", brans, yuklu: false }))];
  const gruplar = ([brans, brans === "e" ? "m" : "e"] as const).map((b) => [b, tum.filter((s) => s.brans === b)] as const).filter(([, l]) => l.length);
  const kaydet = () => baslat(async () => {
    const r = await baglantiKaydetEylemi(turId, surum, std, ct);
    if (!r.tamam) { setGenel(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Kaydedilemedi."); return; }
    setAcik(false); bildir("Kontrol metodu ve ölçüm cihazları kaydedildi."); router.refresh();
  });
  return (
    <>
      <Tus tur="ikincil" ikon="pencil" onClick={() => { setStd(standartlar); setCt(cihazTurleri); setGenel(null); setYeni({ no: "", konu: "" }); setYeniHata({}); setAcik(true); }}>Metot ve cihazlar</Tus>
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
          <p className={stil.altMetin}>Kütüphanede standart yok.</p>
        </fieldset>}
        <fieldset className={stil.kutular}>
          <legend className={stil.etiket}>Listede olmayan standart</legend>
          <FormIzgara>
            <Alan id={STD_NO} etiket="Standart no" hata={yeniHata.no} sonuc="ör. TS EN 12817">
              <Girdi id={STD_NO} value={yeni.no} maxLength={40} hata={!!yeniHata.no} mesajli onChange={(e) => setYeni({ ...yeni, no: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); elleEkle(); } }} />
            </Alan>
            <Alan id={STD_KONU} etiket="Adı" hata={yeniHata.konu}>
              <Girdi id={STD_KONU} value={yeni.konu} maxLength={120} hata={!!yeniHata.konu} onChange={(e) => setYeni({ ...yeni, konu: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); elleEkle(); } }} />
            </Alan>
          </FormIzgara>
          <div><Tus tur="ikincil" ikon="plus" disabled={ekleniyor} aria-busy={ekleniyor || undefined} onClick={elleEkle}>Standart ekle</Tus></div>
        </fieldset>
        <fieldset className={stil.kutular}>
          <legend className={stil.etiket}>Kullanılacak ölçüm cihazları</legend>
          {secenekler.cihazTurleri.length ? secenekler.cihazTurleri.map((c) => (
            <label key={c.id} className={stil.kutu}><input type="checkbox" checked={ct.includes(c.id)} onChange={(e) => setCt(isle(ct, c.id, e.target.checked))} /><span>{c.ad}</span></label>
          )) : <p className={stil.altMetin}>Cihaz türü yok.</p>}
        </fieldset>
      </Pencere>}
    </>
  );
}
