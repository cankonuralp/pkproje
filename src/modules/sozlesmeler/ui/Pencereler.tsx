"use client";
/* SÖZLEŞME PENCERELERİ (maket sozlesmeler.html pencereCiz): İSG-KATİP SÖZLEŞME ID ekle / düzelt (tesis · denetçi · ID · onay ve bitiş isteğe
   bağlı · isteğe bağlı PDF; aynı tesis × denetçide ID varsa yenisi kaydedilince o "önceki" olur) · imzalı sözleşme yükle / değiştir · sözleşme
   şablonu (firmanın PDF'i, sürümlü; kaldırılınca bir önceki, hiç yoksa temel format). Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { IsgSatiri, SablonSatiri } from "../server/sozlesmeler";
import { imzaliYukleEylemi, isgKaydetEylemi, sablonKaldirEylemi, sablonYukleEylemi } from "./eylemler";
import { tarihYaz } from "./ortak";
import stil from "./sozlesmeler.module.css";

const IMZALI_ID = "imw-dosya", SABLON_ID = "sbw-dosya";
const IID = { tesis: "iw-tesis", personel: "iw-personel", no: "iw-no", onay: "iw-onay", bitis: "iw-bitis", dosya: "iw-dosya" } as const;

export function IsgPenceresi({ kapat, sozlesme, sozNo, tesisler, kisiler, mevcutlar, tesis = "", kayit }: {
  kapat: () => void; sozlesme: string; sozNo: string; tesisler: { id: string; ad: string; sgk: string | null }[]; kisiler: { id: string; ad: string }[];
  mevcutlar: IsgSatiri[]; tesis?: string; kayit?: IsgSatiri;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ tesis: kayit?.tesisId ?? (tesis || (tesisler.length === 1 ? tesisler[0].id : "")), personel: kayit?.personelId ?? "", no: kayit?.no ?? "",
    onay: kayit?.onay ?? "", bitis: kayit?.bitis ?? "" });
  const [pdfKaldir, setPdfKaldir] = useState(false);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const t = tesisler.find((x) => x.id === d.tesis);
  const onceki = !kayit && d.tesis && d.personel ? mevcutlar.find((r) => r.tesisId === d.tesis && r.personelId === d.personel) : undefined;
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    f.set("sozlesme", sozlesme); f.set("id", kayit?.id ?? ""); f.set("surum", String(kayit?.surum ?? 0)); if (pdfKaldir) f.set("pdfKaldir", "1");
    const r = await isgKaydetEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof IID | undefined; if (k && IID[k]) requestAnimationFrame(() => document.getElementById(IID[k])?.focus()); return; }
    kapat();
    bildir(kayit ? "İSG-KATİP ID güncellendi." : `${kisiler.find((k) => k.id === d.personel)?.ad ?? ""} için ID eklendi; bu tesiste açılan planlara kendiliğinden gelir.`);
    router.refresh();
  });
  return (
    <Pencere acik baslik={kayit ? "İSG-KATİP SÖZLEŞME ID · düzenle" : "İSG-KATİP SÖZLEŞME ID ekle"} onKapat={kapat} odak={kayit ? `#${IID.no}` : `#${tesisler.length > 1 ? IID.tesis : IID.personel}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus></>}>
      <p className={pencereMetinSinifi}><b>{sozNo}</b></p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={IID.tesis} etiket="Tesis" zorunlu hata={h.tesis} sonuc={t ? `SGK DETSİS NO ${t.sgk ?? "girilmemiş"}` : undefined}>
            <SecimAlani id={IID.tesis} ad="Tesis" deger={d.tesis} ipucu="Tesis seçin" gecersiz={!!h.tesis} tanim={ipucuId(IID.tesis)} kapali={!!kayit || tesisler.length === 1}
              secenekler={tesisler.map((x) => [x.id, x.ad] as const)} degistir={(x) => setD({ ...d, tesis: x })} />
          </Alan>
          <Alan id={IID.personel} etiket="Denetçi" zorunlu hata={h.personel}>
            <SecimAlani id={IID.personel} ad="Denetçi" deger={d.personel} ipucu="Kişi seçin" gecersiz={!!h.personel} tanim={h.personel ? ipucuId(IID.personel) : undefined} kapali={!!kayit}
              secenekler={kayit ? [[kayit.personelId, kayit.personel] as const] : kisiler.map((k) => [k.id, k.ad] as const)} degistir={(x) => setD({ ...d, personel: x })} />
          </Alan>
          <Alan id={IID.no} etiket="İSG-KATİP SÖZLEŞME ID" zorunlu genis hata={h.no} sonuc="İSG-KATİP'teki sözleşme numarası; raporlara buradan geçer.">
            <Girdi id={IID.no} value={d.no} maxLength={30} hata={!!h.no} mesajli onChange={(e) => setD({ ...d, no: e.target.value })} />
          </Alan>
          <Alan id={IID.onay} etiket="Onay tarihi" hata={h.onay} sonuc="İsteğe bağlı; kontrolden sonraki onayda uyarı çıkar.">
            <TarihAlani id={IID.onay} ad="Onay tarihi" deger={d.onay} degistir={(x) => setD({ ...d, onay: x })} tanim={ipucuId(IID.onay)} />
          </Alan>
          <Alan id={IID.bitis} etiket="Bitiş tarihi" hata={h.bitis} sonuc="İsteğe bağlı; plan günü bitişten sonraysa plan açarken uyarı çıkar.">
            <TarihAlani id={IID.bitis} ad="Bitiş tarihi" deger={d.bitis} degistir={(x) => setD({ ...d, bitis: x })} tanim={ipucuId(IID.bitis)} />
          </Alan>
          <Alan id={IID.dosya} etiket="İSG-KATİP sözleşmesi (PDF)" genis hata={h.dosya} sonuc={kayit?.dosyaId && !pdfKaldir ? "Yüklü PDF var; yeni seçilirse değişir." : "İsteğe bağlı."}>
            <input id={IID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={ipucuId(IID.dosya)} />
          </Alan>
        </FormIzgara>
        {kayit?.dosyaId && !pdfKaldir && <div className={stil.secenekler}><DosyaAcTusu dosyaId={kayit.dosyaId}>Yüklü PDF’i aç</DosyaAcTusu>
          <Tus tur="ikincil" ikon="x" onClick={() => setPdfKaldir(true)}>PDF’i kaldır</Tus></div>}
      </form>
      {onceki && <Serit tur="uyari" ikon="history">{onceki.personel} için bu tesiste {onceki.no} var; yenisi kaydedilince o önceki kayıt olur.</Serit>}
    </Pencere>
  );
}

export function ImzaliPenceresi({ kapat, id, surum, no, var: yuklu }: { kapat: () => void; id: string; surum: number; no: string; var: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!); f.set("id", id); f.set("surum", String(surum));
    const r = await imzaliYukleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    kapat(); bildir(yuklu ? "İmzalı sözleşme değiştirildi." : `${no} imzalı sözleşme yüklendi; yürürlükte.`); router.refresh();
  });
  return (
    <Pencere acik baslik={yuklu ? "İmzalı sözleşmeyi değiştir" : "İmzalı sözleşmeyi yükle"} onKapat={kapat} odak={`#${IMZALI_ID}`}
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Yükle</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <Alan id={IMZALI_ID} etiket="İmzalı sözleşme (PDF)" zorunlu hata={h.dosya} sonuc="Müşterinin imzaladığı tarama; yükleyince sözleşme yürürlüğe girer.">
          <input id={IMZALI_ID} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={ipucuId(IMZALI_ID)} />
        </Alan>
      </form>
    </Pencere>
  );
}

export function SablonPenceresi({ kapat, sablonlar }: { kapat: () => void; sablonlar: SablonSatiri[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const yukle = () => baslat(async () => {
    const r = await sablonYukleEylemi(new FormData(form.current!));
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    form.current?.reset(); bildir("Sözleşme şablonu yüklendi; yeni sözleşmeler bu şablondan üretilir."); router.refresh();
  });
  const kaldir = async (x: SablonSatiri, i: number) => {
    if (!(await onayla({ baslik: "Şablonu kaldır", metin: `v${x.surumNo} kaldırılır.${i ? "" : " Kullanımdaki şablon kaldırılınca bir önceki sürüm, o da yoksa temel format kullanılır."}`, tus: "Kaldır" }))) return;
    baslat(async () => { const r = await sablonKaldirEylemi(x.id, x.surum); bildir(r.tamam ? `v${x.surumNo} kaldırıldı.` : r.genel ?? "Kaldırılamadı."); router.refresh(); });
  };
  return (
    <Pencere acik baslik="Sözleşme şablonu" onKapat={kapat} odak={`#${SABLON_ID}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Kapat</Tus><Tus ikon="file-plus" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={yukle}>Yükle</Tus></>}>
      <p className={pencereMetinSinifi}>Kullanımda: <b>{sablonlar.length ? `firmanızın şablonu v${sablonlar[0].surumNo}` : "temel format"}</b></p>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {sablonlar.length > 0 && <ul className={stil.sablonlar}>{sablonlar.map((x, i) => (
        <li key={x.id}><span>v{x.surumNo} · {tarihYaz(x.olustu)}{i ? " · önceki" : " · kullanımda"}</span>
          <span className={stil.secenekler}><DosyaAcTusu dosyaId={x.dosyaId}>Aç</DosyaAcTusu><Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={() => kaldir(x, i)}>Kaldır</Tus></span></li>
      ))}</ul>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); yukle(); }}>
        <Alan id={SABLON_ID} etiket="Firmanın şablonu (PDF)" hata={h.dosya} sonuc="Word şablonu PDF'e çevrilip yüklenir.">
          <input id={SABLON_ID} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={ipucuId(SABLON_ID)} />
        </Alan>
      </form>
    </Pencere>
  );
}
