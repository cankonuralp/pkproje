"use client";
/* YÖNETİM › FİRMA › YEDEK (2026-11-04; reisim: "tamam koda başla" — maket claude.ai THfrK3AzKkg9S7DiRVKKF4 ekran 2–3). Drive bağlantısı, son gönderim,
   Drive denetimi, son doğrulama, Drive'a taşınan, probata arşivi, geri yüklemeler; "Şimdi doğrula" ve "Yedekten geri yükle" (pencere: kaynak →
   deneme → onay → yükleniyor → sonuç; kısa ad yazılmadan tuş açılmaz). Geri yükleme satırında "Geri dön" (önceki hâlin kopyası 30 gün). Karar sunucuda. */
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Bolum, DegerYok, Rozet, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { GeriYuklemeDenemesi, GeriYuklemeSonucu } from "../../../server/yedek/geri-yukle";
import type { YedekYonetimGorunumu } from "../server/yedek";
import { yedekDenemeEylemi, yedekDogrulaEylemi, yedekGeriDonEylemi, yedekGeriYukleEylemi } from "./eylemler";
import stil from "./yonetim.module.css";

const TR = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const GUN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" });
const zaman = (s: string | null) => (s ? TR.format(new Date(s)).replace(",", "") : "—");
const gun = (s: string | null) => (s ? GUN.format(new Date(s)) : "—");
const sayi = (n: number) => n.toLocaleString("tr-TR");
const HIZMET = { gdrive: "Google Drive", onedrive: "OneDrive" } as const;
const KAYNAK_AD = { drive: "Drive", arsiv: "probata arşivi", once: "önceki hâl" } as const;
const DURUM = { bagli: ["bağlı", "tamam"], kopuk: ["bağlantı koptu", "red"], dolu: ["dolu", "red"], kesildi: ["kesildi", "notr"] } as const;

type Adim = 1 | 2 | 3 | 4 | 5;
type Kip = { tur: "yukle" } | { tur: "don"; geriYukleme: string; basladi: string };

export function YedekBolumu({ id, kisaAd, y }: { id: string; kisaAd: string; y: YedekYonetimGorunumu | null }) {
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [kip, setKip] = useState<Kip | null>(null);

  const dogrula = () => baslat(async () => {
    const r = await yedekDogrulaEylemi(id);
    if (!r.tamam) { setHata(r.genel); return; }
    setHata(null);
    bildir(r.deger.tamam ? "Yedek doğrulandı." : `Yedek doğrulamasında ${r.deger.ozet.sorunlar.length} sorun.`);
  });

  const b = y?.baglanti ?? null, d = y?.dogrulama ?? null;
  return (
    <Bolum id="y-b-yedek" baslik="Yedek" tuslar={y && <>
      <Tus tur="ikincil" ikon="shield-check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={dogrula}>Şimdi doğrula</Tus>
      <Tus ikon="history" disabled={bekliyor} onClick={() => setKip({ tur: "yukle" })}>Yedekten geri yükle</Tus>
    </>}>
      {!y && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Firmanın veritabanına ulaşılamadı; yedek bilgisi okunamadı.</Serit></SeritKap>}
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      {y && (
        <BilgiListesi>
          <Bilgi etiket="Drive">{b ? <Rozet tur={DURUM[b.durum][1]}>{`${HIZMET[b.saglayici]} · ${DURUM[b.durum][0]}`}</Rozet> : <Rozet tur="notr">Bağlı değil</Rozet>}</Bilgi>
          <Bilgi etiket="Son gönderim">{b ? `${zaman(b.sonKopya)} · ${sayi(b.bekleyen)} bekliyor` : <DegerYok />}</Bilgi>
          <Bilgi etiket="Drive denetimi">{b?.denetim ? gun(b.denetim) : <DegerYok />}</Bilgi>
          <Bilgi etiket="Son doğrulama" genis="cift">
            {d ? <>
              <Rozet tur={d.tamam ? "tamam" : "bekliyor"}>{`${d.tamam ? "✓" : "Sorunlu"} ${gun(d.zaman)}`}</Rozet>
              {` ${KAYNAK_AD[d.kaynak]} · ${sayi(d.ozet.tablo)} tablo · ${sayi(d.ozet.kayit)} kayıt`}
              {d.ozet.pdf.denenen > 0 && ` · ${d.ozet.pdf.acilan} / ${d.ozet.pdf.denenen} PDF açıldı`}
              {d.ozet.sorunlar.length > 0 && <ul className={stil.yedekSorun}>{d.ozet.sorunlar.map((s) => <li key={s}>{s}</li>)}</ul>}
            </> : <DegerYok>henüz yok</DegerYok>}
          </Bilgi>
          <Bilgi etiket="Drive'a taşınan">{`${sayi(y.tasinan)} rapor sürümü`}</Bilgi>
          <Bilgi etiket="probata arşivi" genis="cift">
            {y.arsiv.tam.length || y.arsiv.aylar.length
              ? `Tam kopya ${y.arsiv.tam.join(", ") || "—"} · ${y.arsiv.aylar.length} aylık dosya${y.arsiv.aylar.length ? ` (${y.arsiv.aylar[0]} – ${y.arsiv.aylar.at(-1)})` : ""}`
              : <DegerYok />}
          </Bilgi>
          <Bilgi etiket="Geri yüklemeler" genis="tam">
            {y.geriYuklemeler.length ? (
              <ul className={stil.yedekListe}>
                {y.geriYuklemeler.map((g) => (
                  <li key={g.id}>
                    <span>{`${zaman(g.basladi)} · ${KAYNAK_AD[g.kaynak]}${g.an ? ` (${zaman(g.an)} hâli)` : ""} · ${g.durum === "tamam" ? `${sayi(Number(g.ozet.kayit ?? 0))} kayıt` : g.durum === "suruyor" ? "sürüyor" : "hata"}`}
                      <span className={stil.vtAciklama}>{g.kim}</span></span>
                    {g.geriDon && <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => setKip({ tur: "don", geriYukleme: g.id, basladi: g.basladi })}>Geri dön</Tus>}
                  </li>
                ))}
              </ul>
            ) : <DegerYok />}
          </Bilgi>
        </BilgiListesi>
      )}
      {kip && <GeriYuklePenceresi id={id} kisaAd={kisaAd} kip={kip} driveVar={b?.durum === "bagli" || b?.durum === "dolu"} kapat={() => setKip(null)} />}
    </Bolum>
  );
}

function GeriYuklePenceresi({ id, kisaAd, kip, driveVar, kapat }: { id: string; kisaAd: string; kip: Kip; driveVar: boolean; kapat: () => void }) {
  const bildir = useBildir();
  const [adim, setAdim] = useState<Adim>(kip.tur === "don" ? 3 : 1);
  const [kaynak, setKaynak] = useState<"drive" | "arsiv">(driveVar ? "drive" : "arsiv");
  const [deneme, setDeneme] = useState<GeriYuklemeDenemesi | null>(null);
  const [sonuc, setSonuc] = useState<GeriYuklemeSonucu | null>(null);
  const [onay, setOnay] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  const oku = () => baslat(async () => {
    const r = await yedekDenemeEylemi(id, kaynak);
    if (!r.tamam) { setHata(r.genel); return; }
    setHata(null); setDeneme(r.deger); setAdim(2);
  });
  const yukle = () => {
    setAdim(4);
    baslat(async () => {
      const r = kip.tur === "don" ? await yedekGeriDonEylemi(id, kip.geriYukleme, onay) : await yedekGeriYukleEylemi(id, kaynak, onay);
      if (!r.tamam) { setHata(r.genel); setAdim(3); return; }
      setHata(null); setSonuc(r.deger); setAdim(5);
      bildir(kip.tur === "don" ? "Önceki hâle dönüldü." : "Geri yükleme bitti.");
    });
  };
  const ADIMLAR = kip.tur === "don" ? [[3, "Onay"], [4, "Yükleniyor"], [5, "Sonuç"]] as const
    : [[1, "Kaynak"], [2, "Deneme"], [3, "Onay"], [4, "Yükleniyor"], [5, "Sonuç"]] as const;
  const alt = adim === 1 ? <><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={oku}>Yedeği oku</Tus></>
    : adim === 2 ? <><Tus tur="ikincil" onClick={() => setAdim(1)}>Geri</Tus><Tus onClick={() => setAdim(3)}>Devam</Tus></>
    : adim === 3 ? <><Tus tur="ikincil" onClick={kip.tur === "don" ? kapat : () => setAdim(2)}>{kip.tur === "don" ? "Vazgeç" : "Geri"}</Tus>
        <Tus tur="tehlike" ikon="history" disabled={onay.trim() !== kisaAd || bekliyor} onClick={yukle}>{kip.tur === "don" ? "Geri dön" : "Geri yükle"}</Tus></>
    : adim === 5 ? <Tus onClick={kapat}>Kapat</Tus> : null;

  return (
    <Pencere acik baslik={kip.tur === "don" ? "Önceki hâle dön" : "Yedekten geri yükle"} onKapat={adim === 4 ? () => undefined : kapat} genis alt={alt}>
      <ol className={stil.yedekAdimlar}>
        {ADIMLAR.map(([n, ad]) => <li key={n} data-durum={n === adim ? "su" : n < adim ? "bitti" : undefined}>{`${n} ${ad}`}</li>)}
      </ol>
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      {adim === 1 && (
        <fieldset className={stil.vtSecim}>
          <legend className="gizli">Kaynak</legend>
          <label className={stil.vtSecenek} data-kapali={driveVar ? undefined : ""}>
            <input type="radio" name="kaynak" value="drive" checked={kaynak === "drive"} disabled={!driveVar} onChange={() => setKaynak("drive")} data-ilk-odak="" />
            <span>Firmanın Drive&apos;ı<span className={stil.vtAciklama}>{driveVar ? "Tam kopya + aylık dosyalar" : "Drive bağlı değil"}</span></span>
          </label>
          <label className={stil.vtSecenek}>
            <input type="radio" name="kaynak" value="arsiv" checked={kaynak === "arsiv"} onChange={() => setKaynak("arsiv")} />
            <span>probata arşivi<span className={stil.vtAciklama}>Son 12 ay · bugünden önceki hâl</span></span>
          </label>
        </fieldset>
      )}
      {adim === 2 && deneme && (
        <>
          <SeritKap><Serit tur="onay" ikon="check">{`Yedek okundu · ${zaman(deneme.an)} hâli`}</Serit></SeritKap>
          <div className={stil.yedekTabloKap}>
            <table className={stil.yedekTablo}>
              <thead><tr><th>Kayıt</th><th>Yedekte</th><th>Şu an</th><th>Gelecek</th><th>Gidecek</th></tr></thead>
              <tbody>
                {deneme.tablolar.filter((t) => t.gelecek || t.gidecek).map((t) => (
                  <tr key={t.tablo}><td>{t.tablo}</td><td>{sayi(t.yedekte)}</td><td>{sayi(t.simdi)}</td><td>{sayi(t.gelecek)}</td><td>{sayi(t.gidecek)}</td></tr>
                ))}
                <tr><th>Toplam</th><th>{sayi(deneme.toplam.yedekte)}</th><th>{sayi(deneme.toplam.simdi)}</th><th>{sayi(deneme.toplam.gelecek)}</th><th>{sayi(deneme.toplam.gidecek)}</th></tr>
              </tbody>
            </table>
          </div>
          {deneme.toplam.gidecek > 0 && <SeritKap><Serit tur="uyari" ikon="triangle-alert">{`Yedekte olmayan ${sayi(deneme.toplam.gidecek)} kayıt geri yüklemeyle silinir.`}</Serit></SeritKap>}
          {deneme.dosya.gelecek > 0 && <p className={stil.not}>{`${sayi(deneme.dosya.gelecek)} dosya Drive'dan geri gelir.`}</p>}
          {deneme.dosya.gelemez.length > 0 && <SeritKap><Serit tur="uyari" ikon="triangle-alert">{`${deneme.dosya.gelemez.length} dosya Drive'da yok: ${deneme.dosya.gelemez.slice(0, 5).join(", ")}${deneme.dosya.gelemez.length > 5 ? " …" : ""}`}</Serit></SeritKap>}
        </>
      )}
      {adim === 3 && (
        <>
          <BilgiListesi>
            <Bilgi etiket="Kaynak">{kip.tur === "don" ? `Önceki hâl · ${zaman(kip.basladi)}` : deneme ? `${KAYNAK_AD[deneme.kaynak]} · ${zaman(deneme.an)}` : KAYNAK_AD[kaynak]}</Bilgi>
            <Bilgi etiket="Önce">Şu anki hâl kopyalanır</Bilgi>
            <Bilgi etiket="Sonra" genis="cift">Parolası olmayan hesaplara geçici parola e-postası; açık oturumlar kapanır</Bilgi>
          </BilgiListesi>
          <Alan id="y-yedek-onay" etiket={`Onay için firmanın kısa adını yazın: ${kisaAd}`}>
            <Girdi id="y-yedek-onay" value={onay} autoComplete="off" spellCheck={false} data-ilk-odak="" onChange={(e) => setOnay(e.target.value)} />
          </Alan>
        </>
      )}
      {adim === 4 && <p className={stil.not} aria-live="polite">Yükleniyor…</p>}
      {adim === 5 && sonuc && (
        <>
          <SeritKap><Serit tur="onay" ikon="check">{`Bitti · ${zaman(sonuc.an)} hâline dönüldü`}</Serit></SeritKap>
          <BilgiListesi>
            <Bilgi etiket="Kayıt">{`${sayi(sonuc.kayit)} kayıt · ${sonuc.tablo} tablo`}</Bilgi>
            <Bilgi etiket="Dosya">{`${sayi(sonuc.dosya.getirilen)} geri geldi${sonuc.dosya.eksik.length ? ` · ${sonuc.dosya.eksik.length} gelmedi` : ""}`}</Bilgi>
            <Bilgi etiket="Geçici parola">{`${sayi(sonuc.parola)} e-posta`}</Bilgi>
          </BilgiListesi>
          {sonuc.dosya.eksik.length > 0 && <p className={stil.not}>{sonuc.dosya.eksik.slice(0, 10).join(", ")}</p>}
        </>
      )}
    </Pencere>
  );
}
