"use client";
/* MÜŞTERİ GİRİŞİ (maket musteriler.html "Müşteri girişi" bölümü; karar 33, 44, L5; 0030): ANA giriş — kullanıcı adı müşterinin e-postası, bütün
   tesisler · EK girişler — kişiye özel, bütün ya da seçili tesisler. Geçici parola YALNIZ BİR KEZ pencerede gösterilir (sayfa yenilenince yoktur);
   personel müşteriye iletir, müşteri ilk girişte değiştirebilir (e-postayla gönderim bildirim altyapısıyla gelir). Müşteri aynı giriş ekranından
   girer ve yalnız kendi paneline düşer. İşlem tuşları yalnız müşteriyi değiştirebilene çizilir; kural ve yetki sunucuda. 367: müşterinin hiç girmediği
   ek girişte yöneticiye "Sil" (satırda simge). */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi, ipucuId } from "../../../components/form/Form";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Bolum, Kod, Rozet, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import type { GirisBilgisi, GirisDurumu, MusteriGirisi } from "../server/girisler";
import { anaGeciciParolaEylemi, ekGeciciParolaEylemi, ekGirisEkleEylemi, girisPasifEylemi, girisSilEylemi, type GirisYaniti } from "./giris-eylemleri";
import stil from "./musteriler.module.css";

const DURUM: Record<GirisDurumu, readonly [string, RozetTuru]> = {
  hazir: ["Parola verilmedi", "bekliyor"], ilk: ["Geçici parola verildi", "bekliyor"], etkin: ["Etkin", "tamam"], pasif: ["Pasif", "notr"],
};
const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zamanYaz = (z: string | null) => (z ? ZAMAN.format(new Date(z)).replace(",", "") : "—");
const ID = { ad: "mg-ad", eposta: "mg-eposta", kapsam: "mg-kapsam" } as const;

export function GirisBolumu({ musteriId, kisa, b }: { musteriId: string; kisa: string; b: GirisBilgisi }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [pencere, setPencere] = useState<null | "ek" | "parola">(null);
  const [parola, setParola] = useState<{ deger: string; eposta: string } | null>(null);
  const [ek, setEk] = useState<{ ad: string; eposta: string; hepsi: boolean; secili: string[]; hatalar: Record<string, string> }>(
    { ad: "", eposta: "", hepsi: true, secili: [], hatalar: {} });
  const [hata, setHata] = useState<string | null>(null);
  const kopya = useKopyala(parola?.deger ?? null, "mg-parola");
  const tesisAd = new Map(b.tesisler.map((t) => [t.id, t.ad]));
  const kapsam = (g: MusteriGirisi) => (g.tesisler ? g.tesisler.map((t) => tesisAd.get(t) ?? "pasif tesis").join(", ") : "Bütün tesisler");
  const gorunen = (d: GirisDurumu): GirisDurumu => (b.pasif ? "pasif" : d);
  const acik = b.yaz && !b.pasif;

  const sonuc = (r: GirisYaniti, eposta: string, basarili?: () => void) => {
    if (r.genel) { setHata(r.genel); return; }
    if (r.hatalar) { setEk((f) => ({ ...f, hatalar: r.hatalar! })); return; }
    setHata(null);
    if (r.parola) { kopya.sifirla(); setParola({ deger: r.parola, eposta }); setPencere("parola"); } else basarili?.();
    router.refresh();
  };
  const anaParola = () => baslat(async () => sonuc(await anaGeciciParolaEylemi(musteriId), b.eposta ?? ""));
  const ekParola = (g: MusteriGirisi) => baslat(async () => sonuc(await ekGeciciParolaEylemi(g.id, g.surum), g.eposta));
  const pasif = async (g: MusteriGirisi, p: boolean) => {
    if (p && !(await onayla({ baslik: "Giriş pasife alınsın mı?", metin: `${g.ad} (${g.eposta}) artık giremez, açık oturumu sonlanır. Yeniden etkinleştirilince yeni geçici parola verilir.`, tus: "Pasife al" }))) return;
    baslat(async () => sonuc(await girisPasifEylemi(g.id, g.surum, p), g.eposta, () => bildir(p ? `${g.ad}: giriş pasif.` : `${g.ad}: giriş etkin; geçici parola verin.`)));
  };
  const ekKaydet = () => baslat(async () => {
    const r = await ekGirisEkleEylemi(musteriId, { ad: ek.ad, eposta: ek.eposta, tesisler: ek.hepsi ? "hepsi" : ek.secili });
    sonuc(r, ek.eposta, () => { setPencere(null); bildir(`${ek.ad.trim()} için ek giriş açıldı. "Geçici parola" ile parola verin.`); });
  });

  const SUTUNLAR: Sutun<MusteriGirisi>[] = [
    { k: "kisi", genislik: "30%", baslik: "Kişi", kart: "ust", sira: 1, hucre: (g) => <span><Kirp>{g.ad}</Kirp><AltSatir><Kirp>{g.eposta}</Kirp></AltSatir></span> },
    { k: "kapsam", genislik: "26%", baslik: "Gördüğü tesisler", kart: "govde", sira: 2, hucre: (g) => <><KartEtiket>Gördüğü tesisler</KartEtiket><Kirp>{kapsam(g)}</Kirp></> },
    { k: "son", genislik: "18%", baslik: "Son giriş", kart: "govde", sira: 3, hucre: (g) => <><KartEtiket>Son giriş</KartEtiket>{g.sonGiris ? zamanYaz(g.sonGiris) : <AltSatir uyari>Girmedi</AltSatir>}</> },
    { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (g) => <Rozet tur={DURUM[gorunen(g.durum)][1]}>{DURUM[gorunen(g.durum)][0]}</Rozet> },
    ...(acik ? [{ k: "eylem", genislik: "14%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem" as const, sira: 9, hucre: (g: MusteriGirisi) => (
      <div className={stil.girisTuslar}>
        {g.durum === "pasif"
          ? <Tus tur="ikincil" disabled={bekliyor} onClick={() => void pasif(g, false)}>Etkinleştir</Tus>
          : <>
              <Tus tur="ikincil" ikon="key-round" disabled={bekliyor} onClick={() => ekParola(g)}>Geçici parola</Tus>
              <Tus tur="ikincil" disabled={bekliyor} onClick={() => void pasif(g, true)}>Pasife al</Tus>
            </>}
        {b.sil && !g.sonGiris && <SilTusu kucuk ikon="trash-2" ad={g.ad} erisimAdi={`${g.ad} girişini sil`} baslik="Ek girişi sil"
          yanEtki="kullanıcı adı yeniden kullanılabilir" sil={() => girisSilEylemi(g.id)} odak="#b-giris" />}
      </div>
    ) }] : []),
  ];

  const ana = b.ana;
  /* durum metni: pasif müşteride giriş kapalı (maket girisHtml m.pasif); geçici parolayla girdi ama değiştirmedi ("henüz girmedi" değil) */
  const anaDurumMetni = !ana ? "Giriş açılmadı" : b.pasif ? "Müşteri pasif; giriş kapalı"
    : ana.durum === "etkin" ? `Son giriş ${zamanYaz(ana.sonGiris)}`
    : ana.durum === "ilk" ? (ana.sonGiris ? `Son giriş ${zamanYaz(ana.sonGiris)} · geçici parolasını henüz değiştirmedi` : `Geçici parola ${zamanYaz(ana.parolaVerildi)} verildi; henüz girmedi`)
    : DURUM[ana.durum][0];
  return (
    <Bolum id="b-giris" baslik="Müşteri girişi" sayac={ana ? <Rozet tur={DURUM[gorunen(ana.durum)][1]}>{DURUM[gorunen(ana.durum)][0]}</Rozet> : undefined}
      tuslar={acik && b.eposta ? <Tus tur="ikincil" ikon="key-round" disabled={bekliyor} onClick={anaParola}>{!ana || ana.durum === "hazir" || ana.durum === "pasif" ? "Geçici parola oluştur" : "Yeni geçici parola"}</Tus> : undefined}>
      {hata && !pencere && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      {b.pasif && <Serit tur="bilgi" ikon="ban">Müşteri pasif; girişleri kapalı.</Serit>}
      <BilgiListesi>
        <Bilgi etiket="Kullanıcı adı" genis>{b.eposta ?? <AltSatir uyari>E-posta yazılınca ana giriş açılır</AltSatir>}</Bilgi>
        <Bilgi etiket="Durum">{anaDurumMetni}</Bilgi>
        <Bilgi etiket="Gördüğü tesisler">Bütün tesisler</Bilgi>
      </BilgiListesi>
      <div className={stil.girisAltBas}>
        <h3 className={stil.girisAltBaslik}>Ek girişler</h3>
        <span className={stil.girisSayac}><b>{b.ekler.length}</b> kişi</span>
        {acik && <Tus tur="ikincil" ikon="user-plus" onClick={() => { setHata(null); setEk({ ad: "", eposta: "", hepsi: true, secili: [], hatalar: {} }); setPencere("ek"); }}>Ek giriş ekle</Tus>}
      </div>
      {b.ekler.length
        ? <Liste baslik="Ek girişler" sutunlar={SUTUNLAR} kayitlar={b.ekler} anahtar={(g) => g.id} />
        : <p className={stil.bosSatir}>Ek giriş yok.</p>}

      <Pencere acik={pencere === "ek"} baslik={`Ek giriş · ${kisa}`} onKapat={() => setPencere(null)} odak={`#${ID.ad}`}
        alt={<>
          <Tus tur="ikincil" onClick={() => setPencere(null)}>Vazgeç</Tus>
          <Tus ikon="user-plus" disabled={bekliyor} onClick={ekKaydet}>Girişi aç</Tus>
        </>}>
        {hata && pencere === "ek" && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
        <Alan id={ID.ad} etiket="Ad soyad" zorunlu hata={ek.hatalar.ad}>
          <Girdi id={ID.ad} maxLength={200} value={ek.ad} hata={!!ek.hatalar.ad} onChange={(e) => setEk({ ...ek, ad: e.target.value })} />
        </Alan>
        <Alan id={ID.eposta} etiket="E-posta (kullanıcı adı)" zorunlu genis hata={ek.hatalar.eposta}>
          <Girdi id={ID.eposta} type="email" inputMode="email" maxLength={254} value={ek.eposta} hata={!!ek.hatalar.eposta} mesajli
            aria-describedby={ek.hatalar.eposta ? ipucuId(ID.eposta) : undefined} onChange={(e) => setEk({ ...ek, eposta: e.target.value })} />
        </Alan>
        <fieldset className={stil.girisKapsam} id={ID.kapsam}>
          <legend>Gördüğü tesisler</legend>
          <label className={stil.girisSecim}><input type="radio" name={ID.kapsam} checked={ek.hepsi} onChange={() => setEk({ ...ek, hepsi: true })} /><span>Bütün tesisler</span></label>
          <label className={stil.girisSecim}><input type="radio" name={ID.kapsam} checked={!ek.hepsi} disabled={!b.tesisler.length} onChange={() => setEk({ ...ek, hepsi: false })} /><span>Seçili tesisler</span></label>
          {!ek.hepsi && b.tesisler.map((t) => (
            <label key={t.id} className={`${stil.girisSecim} ${stil.girisTesis}`}>
              <input type="checkbox" checked={ek.secili.includes(t.id)}
                onChange={(e) => setEk({ ...ek, secili: e.target.checked ? [...ek.secili, t.id] : ek.secili.filter((x) => x !== t.id) })} />
              <span>{t.ad}</span>
            </label>
          ))}
          {ek.hatalar.tesisler && <p className={stil.girisHata}>{ek.hatalar.tesisler}</p>}
        </fieldset>
      </Pencere>

      <Pencere acik={pencere === "parola"} baslik="Geçici parola" onKapat={() => { setPencere(null); setParola(null); }}
        alt={<>
          {kopya.tus}
          <Tus ikon="check" data-ilk-odak="" onClick={() => { setPencere(null); setParola(null); }}>Tamam</Tus>
        </>}>
        <p className={pencereMetinSinifi}><b>{kisa}</b> · kullanıcı adı {parola?.eposta}</p>
        {/* parola yalnız pencere açıkken DOM'da (kapanınca silinir) */}
        {parola && <p className={stil.geciciParola} id="mg-parola"><Kod>{parola.deger}</Kod></p>}
        {kopya.durum}
        <Serit tur="uyari" ikon="triangle-alert">Bu parola yalnız şimdi gösterilir; müşteriye siz iletin. Müşteri bu adresin giriş ekranından girer ve yalnız kendi raporlarını görür; ilk girişte parolasını değiştirebilir.</Serit>
      </Pencere>
    </Bolum>
  );
}
