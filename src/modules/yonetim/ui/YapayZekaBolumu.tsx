"use client";
/* YÖNETİM › FİRMA › YAPAY ZEKÂ (2026-10-25; reisim: "Yapay zekâ ayarları Firma ayarlarından kalksın, yalnız Yönetim panelinden yönetilsin; firmalar
   kendileri değiştiremesin" — maket onaylı K1–K7). Firma ayarlarındaki bölüm buraya taşındı ve FV9'un "Yapay zekâ anahtarı" bölümü içine katıldı:
   Kapalı · Açık + kişi başı aylık sınır (bölümün Kaydet / Vazgeç'i; göç 0106 firma_yonetim_yz), ücret (model adı yok), API anahtarı (kendi tuşuyla —
   bir daha gösterilmez, yalnız son 4; kaldırma önce sorulur), bu ayın toplamı ve kişi kişi kullanımı. Özet okunamazsa söylenir. */
import { useState, useTransition } from "react";
import { Alan, FormIzgara, Girdi, Segment } from "../../../components/form/Form";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { useOnayla } from "../../../components/pencere/Onay";
import { DegerYok, Rozet, Bolum, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { YZ_FIYAT } from "../sema";
import type { FirmaOzeti } from "../server/firma-tarafi";
import { yzAnahtariKaldirEylemi, yzAnahtariKaydetEylemi, yzAyarKaydetEylemi } from "./eylemler";
import { KOSUL_SURUMU } from "../../say/kosul-metni";
import stil from "./yonetim.module.css";

type Yz = FirmaOzeti["yz"];
type Kisi = Yz["kisiler"][number];
const ID = { anahtar: "y-yz-anahtar", sinir: "y-yz-sinir" } as const;
const dolar = (m: number) => `$${(m / 1e6).toFixed(2).replace(".", ",")}`;
const sinirMetni = (s: number | null) => (s === null ? "" : String(s).replace(".", ","));
const sutunlar = (sinir: number | null): Sutun<Kisi>[] => [
  { k: "kisi", genislik: "32%", baslik: "Kişi", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => x.ad },
  { k: "okuma", genislik: "18%", baslik: "Fotoğraftan okuma", kart: "govde", sira: 2, siralanmaz: true, hucre: (x) => <><KartEtiket>Fotoğraftan okuma</KartEtiket>{x.okuma}</> },
  { k: "mesaj", genislik: "16%", baslik: "S.A.Y mesajı", kart: "govde", sira: 3, siralanmaz: true, hucre: (x) => <><KartEtiket>S.A.Y mesajı</KartEtiket>{x.mesaj}</> },
  { k: "usd", genislik: "16%", baslik: "Harcama", kart: "govde", sira: 4, siralanmaz: true, hucre: (x) => <><KartEtiket>Harcama</KartEtiket>{dolar(x.maliyet)}</> },
  { k: "durum", genislik: "18%", baslik: "Sınır", kart: "rozet", sira: 1, siralanmaz: true, hucre: (x) => {
    if (sinir === null || sinir <= 0) return <DegerYok>sınırsız</DegerYok>;
    const o = x.maliyet / (sinir * 1e6);
    return o >= 1 ? <Rozet tur="red">Doldu</Rozet> : <Rozet tur={o >= 0.8 ? "bekliyor" : "tamam"}>%{Math.round(o * 100)}</Rozet>;
  } },
];

export function YapayZekaBolumu({ id, firmaAd, yz }: { id: string; firmaAd: string; yz: Yz | null }) {
  const onayla = useOnayla();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const ilk = { acik: yz?.acik ?? false, sinir: sinirMetni(yz?.sinir ?? null) };
  const [d, setD] = useState(ilk);
  const [hata, setHata] = useState<{ sinir?: string; genel?: string }>({});
  const [anahtar, setAnahtar] = useState("");
  const [anahtarHata, setAnahtarHata] = useState<string | null>(null);
  const kirli = d.acik !== ilk.acik || d.sinir !== ilk.sinir;

  const kaydet = () => baslat(async () => {
    const r = await yzAyarKaydetEylemi(id, d);
    if (!r.tamam) { setHata({ sinir: r.hatalar?.sinir, genel: r.hatalar?.sinir ? undefined : (r.genel ?? r.hatalar?.genel ?? "Kaydedilemedi.") }); return; }
    setHata({}); bildir(d.acik ? "Yapay zekâ ayarları kaydedildi (açık)." : "Yapay zekâ kapatıldı; firmada fotoğraftan okuma ve S.A.Y görünmez.");
  });
  const anahtarKaydet = () => baslat(async () => {
    const form = new FormData();
    form.set("anahtar", anahtar);
    const r = await yzAnahtariKaydetEylemi(id, form);
    if (!r.tamam) { setAnahtarHata(r.hatalar?.anahtar ?? null); setHata(r.hatalar?.anahtar ? {} : { genel: r.genel ?? "Anahtar kaydedilemedi." }); return; }
    setAnahtar(""); setAnahtarHata(null); setHata({}); bildir(`Yapay zekâ anahtarı kaydedildi (…${r.son4 ?? ""}).`);
  });
  const anahtarKaldir = async () => {
    if (!(await onayla({ baslik: "Yapay zekâ anahtarı kaldırılsın mı?", metin: `${firmaAd} firmasında fotoğraftan okuma ve S.A.Y, yeni anahtar girilene dek çalışmaz.`, tus: "Kaldır", tehlike: true }))) return;
    baslat(async () => {
      const r = await yzAnahtariKaldirEylemi(id);
      if (!r.tamam) { setHata({ genel: r.genel ?? "Anahtar kaldırılamadı." }); return; }
      setHata({}); bildir("Yapay zekâ anahtarı kaldırıldı.");
    });
  };

  return (
    <Bolum id="y-b-yz" baslik="Yapay zekâ">
      {!yz && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Firmanın veritabanına ulaşılamadı; yapay zekâ ayarı ve kullanım okunamadı.</Serit></SeritKap>}
      {hata.genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata.genel}</Serit></SeritKap>}
      {yz && (
        <>
          <Segment ad="Fotoğraftan okuma ve S.A.Y" deger={d.acik ? "1" : "0"} kapali={bekliyor} secenekler={[["0", "Kapalı"], ["1", "Açık"]] as const}
            degistir={(x) => setD({ ...d, acik: x === "1" })} />
          <FormIzgara>
            <Alan id={ID.sinir} etiket="Kişi başı aylık sınır ($)" hata={hata.sinir} sonuc={hata.sinir ? undefined : "Boş: sınırsız."}>
              <Girdi id={ID.sinir} value={d.sinir} inputMode="decimal" maxLength={8} hata={!!hata.sinir} mesajli disabled={bekliyor}
                onChange={(e) => { setD({ ...d, sinir: e.target.value }); setHata({}); }} />
            </Alan>
            <div>
              <p className={stil.etiketUst}>Ücret</p>
              <p className={stil.not}>{YZ_FIYAT}</p>
            </div>
          </FormIzgara>
          <div className={stil.eylemSol}>
            <Tus tur="ikincil" disabled={bekliyor || !kirli} onClick={() => { setD(ilk); setHata({}); }}>Vazgeç</Tus>
            <Tus ikon="check" disabled={bekliyor || !kirli} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet</Tus>
          </div>
          <p className={stil.etiketUst}>Anthropic API anahtarı</p>
          {yz.tanimli && <p className={stil.not}><span className={stil.adresKod}>…{yz.son4}</span> kayıtlı</p>}
          <Alan id={ID.anahtar} etiket={yz.tanimli ? "Yeni anahtar" : "Anahtar"} hata={anahtarHata ?? undefined}>
            <Girdi id={ID.anahtar} type="password" value={anahtar} hata={!!anahtarHata} mesajli={!!anahtarHata} placeholder="sk-ant-…" spellCheck={false}
              onChange={(e) => { setAnahtar(e.target.value); setAnahtarHata(null); }} />
          </Alan>
          <div className={stil.eylemSol}>
            <Tus ikon="key-round" disabled={bekliyor || !anahtar.trim()} onClick={anahtarKaydet}>{yz.tanimli ? "Anahtarı değiştir" : "Anahtarı kaydet"}</Tus>
            {yz.tanimli && <Tus tur="ikincil" ikon="trash-2" disabled={bekliyor} onClick={() => void anahtarKaldir()}>Kaldır</Tus>}
          </div>
          <p className={stil.not}>
            {d.acik && !yz.tanimli ? "Anahtar girilmedi: fotoğraftan okuma ve S.A.Y çalışmaz." : "Fotoğraf ve maskelenmiş rapor bilgisi Anthropic'e (ABD) gider."}
          </p>
          <p className={stil.etiketUst}>{`Bu ay (${yz.ay})`}</p>
          <p className={stil.not}>{`${yz.okuma} fotoğraftan okuma · ${yz.mesaj} S.A.Y mesajı · ${dolar(yz.maliyet)} harcama`}</p>
          {yz.kisiler.length > 0 && <Liste baslik="Yapay zekâ kullanımı" sutunlar={sutunlar(yz.sinir)} kayitlar={yz.kisiler} anahtar={(x) => x.id} />}
          {/* 2026-10-31 (kalem 7 — M6): kullanım koşullarının Yapay zekâ (S.A.Y) maddesi — firmanın ve kullanıcıların kabulü */}
          <p className={stil.etiketUst}>{`Kullanım koşulları (sürüm ${KOSUL_SURUMU})`}</p>
          <p className={stil.not} data-kosul-durum="">
            {yz.kosul?.firma && yz.kosul.firma.surum === KOSUL_SURUMU
              ? `Firma kabulü: ${yz.kosul.firma.ad} · ${new Date(yz.kosul.firma.zaman).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} · kabul eden kullanıcı ${yz.kosul.kullanicilar[KOSUL_SURUMU] ?? 0}`
              : yz.kosul?.firma ? `Firma eski sürümü kabul etti (${yz.kosul.firma.surum}); güncel sürüm kabul edilmedi.` : "Firma yöneticisi henüz kabul etmedi."}
          </p>
        </>
      )}
    </Bolum>
  );
}
