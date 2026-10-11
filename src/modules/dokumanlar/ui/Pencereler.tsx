"use client";
/* DÖKÜMAN PENCERELERİ (maket standartlar.html pencereCiz / dokCiz): standart yükle ya da yeni sürüm (numara ve konu sabit; aynı numarada güncel
   sürüm varsa yüklenince o önceki olur — şerit söyler) · döküman yükle (ad, tür, kod, revizyon, PDF) ya da dosyasını değiştir. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { DOKUMAN_TURLERI } from "../sema";
import type { DokumanSatiri, StandartSatiri } from "../server/dokumanlar";
import { dokumanKaydetEylemi, standartYukleEylemi } from "./eylemler";
import stil from "./dokumanlar.module.css";

const SID = { no: "stw-no", surum: "stw-surum", konu: "stw-konu", brans: "stw-brans", dosya: "stw-dosya" } as const;
const BRANSLAR = [["m", "Mekanik"], ["e", "Elektrik"]] as const;
const DID = { ad: "dkw-ad", tur: "dkw-tur", kod: "dkw-kod", rev: "dkw-rev", dosya: "dkw-dosya" } as const;

/** 437: `oneri` — listedeki hazır Bakanlık standardının "Yükle"si: numara, konu ve branş dolu; yüklenince listede kalınır (satır "Görüntüle" olur)
    · 440: `brans` — açık sekmenin branşı (yeni standardın başlangıç değeri); yeni sürümde güncel sürümünki, değişmez */
export function StandartPenceresi({ kapat, guncel, guncelListe, oneri, brans = "m" }:
  { kapat: () => void; guncel?: StandartSatiri; guncelListe: StandartSatiri[]; oneri?: { no: string; konu: string; brans: "m" | "e" }; brans?: "m" | "e" }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ no: guncel?.no ?? oneri?.no ?? "", surum: "", konu: guncel?.konu ?? oneri?.konu ?? "", brans: guncel?.brans ?? oneri?.brans ?? brans });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const noDuz = d.no.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr");
  const ayni = guncel ?? guncelListe.find((x) => x.guncel && x.no === noDuz);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    const r = await standartYukleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof SID | undefined; if (k && SID[k]) requestAnimationFrame(() => document.getElementById(SID[k])?.focus()); return; }
    kapat();
    bildir(`${noDuz}:${d.surum.trim().toUpperCase()} ${ayni ? "yüklendi; önceki sürüm saklandı." : "kütüphaneye eklendi."}`);
    /* 486: liste sunucuda tazelendi (eylem refresh) — burada yalnız yönlendirme; push + refresh yan yana yarışıyordu */
    if (!oneri) router.push(`/dokumanlar/standart/${r.id}`);
  });
  return (
    <Pencere acik baslik={guncel ? `Yeni sürüm yükle · ${guncel.no}` : oneri ? `Standart yükle · ${oneri.no}` : "Standart yükle"} onKapat={kapat}
      odak={`#${guncel || oneri ? SID.surum : SID.no}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>{guncel ? "Yeni sürümü yükle" : "Yükle"}</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={SID.no} etiket="Standart no" zorunlu={!guncel} hata={h.no} sonuc={guncel ? "Numara aynı kalır." : "ör. TS EN 280"}>
            <Girdi id={SID.no} value={d.no} readOnly={!!guncel} maxLength={40} hata={!!h.no} mesajli onChange={(e) => setD({ ...d, no: e.target.value })} />
          </Alan>
          <Alan id={SID.surum} etiket="Sürüm" zorunlu hata={h.surum} sonuc={guncel ? `Kütüphanedeki: ${guncel.surumAdi}` : "Yıl ve tadil"}>
            <Girdi id={SID.surum} value={d.surum} maxLength={20} hata={!!h.surum} mesajli onChange={(e) => setD({ ...d, surum: e.target.value })} />
          </Alan>
          <Alan id={SID.konu} etiket="Konu" zorunlu genis hata={h.konu} sonuc="Raporun metot alanında numarayla birlikte yazılır.">
            <Girdi id={SID.konu} value={d.konu} maxLength={120} hata={!!h.konu} mesajli onChange={(e) => setD({ ...d, konu: e.target.value })} />
          </Alan>
          <Alan id={SID.brans} etiket="Branş" zorunlu hata={h.brans} sonuc={guncel ? "Sürümler aynı branşta kalır." : "Standartlar'da bu sekmede görünür."}>
            <SecimAlani id={SID.brans} ad="Branş" deger={d.brans} secenekler={BRANSLAR} kapali={!!guncel} gecersiz={!!h.brans} tanim={ipucuId(SID.brans)}
              degistir={(v) => setD({ ...d, brans: v as "m" | "e" })} />
          </Alan>
          <Alan id={SID.dosya} etiket="Dosya (PDF)" zorunlu genis hata={h.dosya}>
            <input id={SID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={h.dosya ? ipucuId(SID.dosya) : undefined} />
          </Alan>
        </FormIzgara>
      </form>
      {ayni && <Serit tur="uyari" ikon="history">{guncel ? "" : `Bu numara kütüphanede var (${ayni.no}:${ayni.surumAdi}). `}Yüklenince {ayni.no}:{ayni.surumAdi} önceki sürüm olur. Yazılmış raporlar eski sürümü göstermeye devam eder.</Serit>}
    </Pencere>
  );
}

export function DokumanPenceresi({ kapat, dokuman }: { kapat: () => void; dokuman?: DokumanSatiri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ ad: dokuman?.ad ?? "", tur: dokuman?.tur ?? "", kod: dokuman?.kod ?? "", rev: dokuman?.rev ?? "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    if (dokuman) { f.set("id", dokuman.id); f.set("surum", String(dokuman.surum)); }
    const r = await dokumanKaydetEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof DID | undefined; if (k && DID[k]) requestAnimationFrame(() => document.getElementById(DID[k])?.focus()); return; }
    kapat(); bildir(dokuman ? `${dokuman.ad} dosyası değiştirildi.` : `${d.ad.trim()} yüklendi.`); router.refresh();
  });
  return (
    <Pencere acik baslik={dokuman ? `Dosyayı değiştir · ${dokuman.ad}` : "Döküman yükle"} onKapat={kapat} odak={`#${dokuman ? DID.dosya : DID.ad}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Yükle</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          {!dokuman && <>
            <Alan id={DID.ad} etiket="Döküman adı" zorunlu genis hata={h.ad}>
              <Girdi id={DID.ad} value={d.ad} maxLength={100} hata={!!h.ad} onChange={(e) => setD({ ...d, ad: e.target.value })} />
            </Alan>
            <Alan id={DID.tur} etiket="Tür" zorunlu hata={h.tur}>
              <SecimAlani id={DID.tur} ad="Tür" deger={d.tur} ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(DID.tur) : undefined}
                secenekler={DOKUMAN_TURLERI.map((t) => [t, t] as const)} degistir={(x) => setD({ ...d, tur: x })} />
            </Alan>
            <Alan id={DID.kod} etiket="Kod" hata={h.kod}><Girdi id={DID.kod} value={d.kod} maxLength={20} hata={!!h.kod} onChange={(e) => setD({ ...d, kod: e.target.value })} /></Alan>
            <Alan id={DID.rev} etiket="Revizyon" hata={h.rev}><Girdi id={DID.rev} value={d.rev} maxLength={20} hata={!!h.rev} onChange={(e) => setD({ ...d, rev: e.target.value })} /></Alan>
          </>}
          <Alan id={DID.dosya} etiket="Dosya (PDF)" zorunlu genis hata={h.dosya}>
            <input id={DID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={h.dosya ? ipucuId(DID.dosya) : undefined} />
          </Alan>
        </FormIzgara>
      </form>
    </Pencere>
  );
}
