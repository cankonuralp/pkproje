"use client";
/* PLAN İÇİ · EKİPMANLAR (maket planlarim.html ekpSutun, ekleCiz; 3.–4. tur): süzgeç alan alan (Ekipman türü, Ekipman kodu — 2026-09-28) + çipler
   (Raporu yok / var, Denetimde eklendi, Önceki kontrolde kusur) + Branş; 10'ar sayfa. Satır: Kod (+ Yeni) · Ekipman türü · Konum · Branş · Önceki
   kontrol · Rapor (tik / Pasif) · İşlem (Pasife al / Etkinleştir — raporu olmayan ekipmanda; rapor oluştur Raporlar kalemiyle).
   Ekipman ekle iki yol: YENİ (kodu personel etiketten yazar; yazarken denetlenir: bu planda var · bu tesiste kayıtlı → "Kayıtlı ekipmanı seç" ·
   başka tesiste · eski kod · kullanılabilir) ya da TESİSTE KAYITLI ekipmanı plana al. Eşsizlik sunucuda ve veritabanında da. */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Pencere } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus } from "../../../components/tus/Tus";
import { KALIP } from "../../../styles/kalip";
import { kodBicimi, kodNormal, tarihNo, type KodTuru } from "../sema";
import type { PlanEkipmani, PlanIci } from "../server/plan-ici";
import { ekipmanPasifEylemi, kayitliEkleEylemi, kodDurumuEylemi, yeniEkipmanEylemi } from "./eylemler";
import stil from "./planlar.module.css";

const bransAd = (b: "m" | "e") => (b === "m" ? "Mekanik" : "Elektrik");
const ayYil = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

function tanim(raporlu: Set<string>): SuzgecTanimi<PlanEkipmani> {
  return {
    ad: "Ekipmanlarda ara", ipucu: "Kod, tür, konum", birim: "ekipman", imkansiz: "Bir ekipmanın raporu hem var hem yok olamaz", sayfa: KALIP.sayfa.ekipman,
    metin: (e) => [e.kod, e.tur, e.konum ?? ""].join(" "),
    alanlar: [
      { k: "tur", ad: "Ekipman türü", ipucu: "ör. kompresör", metin: (e) => e.tur },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. KP-10", metin: (e) => e.kod },
    ],
    cipler: [
      { k: "raporsuz", ad: "Raporu yok", grup: "rapor", test: (e) => !raporlu.has(e.id) },
      { k: "raporlu", ad: "Raporu var", grup: "rapor", test: (e) => raporlu.has(e.id) },
      { k: "sonradan", ad: "Denetimde eklendi", test: (e) => e.sonradan },
      { k: "kusur", ad: "Önceki kontrolde kusur", test: (e) => !!e.onceki?.sonuc && e.onceki.sonuc !== "Uygun" },
    ],
    seciciler: [{ k: "brans", ad: "Branş", secenek: () => [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]], gecer: (e, v) => v === "tumu" || e.brans === v }],
  };
}

interface Ekle { sekme: "yeni" | "kayitli"; kod: string; tur: string; seri: string; konum: string; secili: string[]; hatalar: Record<string, string> }
const ID = { kod: "ekle-kod", durum: "ekle-kod-durum", tur: "ekle-tur", seri: "ekle-seri", konum: "ekle-konum" } as const;
const KOD_SINIF: Record<KodTuru, string> = { bos: stil.kodBos, tamam: stil.kodTamam, hata: stil.kodHata, tesiste: stil.kodHata };
const BOS: Ekle = { sekme: "yeni", kod: "", tur: "", seri: "", konum: "", secili: [], hatalar: {} };

export function EkipmanBolumu({ v }: { v: PlanIci }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const raporlu = new Set(v.raporlar.map((r) => r.ekipmanId));
  const s = useSuzgec(tanim(raporlu), v.ekipman);
  const [ekle, setEkle] = useState<Ekle | null>(null);
  const [kd, setKd] = useState<{ kod: string; tur: KodTuru; metin: string; ekipmanId?: string } | null>(null);
  const planId = v.kart.id;

  /* yazarken kod denetimi: biçim tarayıcıda, eşsizlik sunucuda (300 ms sonra) */
  const kod = ekle?.sekme === "yeni" ? kodNormal(ekle.kod) : "";
  useEffect(() => {
    if (!kod || kodBicimi(kod)) return;
    let iptal = false;
    const t = setTimeout(() => { void kodDurumuEylemi(planId, kod).then((r) => { if (!iptal && r) setKd({ kod, ...r }); }); }, 300);
    return () => { iptal = true; clearTimeout(t); };
  }, [kod, planId]);
  const durum: { tur: KodTuru; metin: string; ekipmanId?: string } = kodBicimi(kod) ?? (kd?.kod === kod ? kd : { tur: "bos", metin: "Kod denetleniyor…" });

  const sutunlar: Sutun<PlanEkipmani>[] = [
    { k: "kod", genislik: "14%", baslik: "Kod", kart: "ust", sira: 1, hucre: (e) => <><span className={stil.kod}>{e.kod}</span>{e.sonradan && <span className={stil.yeni}>Yeni</span>}</> },
    { k: "tur", genislik: "22%", baslik: "Ekipman türü", kart: "govde", sira: 2, hucre: (e) => <Kirp>{e.tur}</Kirp> },
    { k: "konum", genislik: "18%", baslik: "Konum", kart: "govde", sira: 3, hucre: (e) => <span className={stil.hucreSatir}><Ikon ad="map-pin" kucuk /><Kirp>{e.konum ?? "—"}</Kirp></span> },
    { k: "brans", genislik: "11%", baslik: "Branş", kart: "govde", sira: 4, hucre: (e) => <span className={stil.hucreSatir}><Ikon ad={e.brans === "m" ? "cog" : "zap"} kucuk />{bransAd(e.brans)}</span> },
    { k: "onceki", genislik: "14%", baslik: "Önceki kontrol", kart: "govde", sira: 5, hucre: (e) => !e.onceki ? <span className={stil.ilk}>İlk kontrol</span> : (
      <><KartEtiket>Önceki kontrol</KartEtiket><span className={e.onceki.sonuc === "Kusurlu" ? stil.sonucHata : e.onceki.sonuc && e.onceki.sonuc !== "Uygun" ? stil.sonucUyari : undefined}
        title="eski kayıt (Excel)">{ayYil(e.onceki.tarih)}{e.onceki.sonuc && ` · ${e.onceki.sonuc}`}</span></>
    ) },
    { k: "rapor", genislik: "8%", baslik: "Rapor", kart: "rozet", sira: 1, hucre: (e) => e.pasif ? <Rozet tur="notr">Pasif</Rozet>
      : raporlu.has(e.id) ? <span className={stil.hucreSatir} title="Raporu var"><Ikon ad="circle-check" /><span className="gizli">Raporu var</span></span> : null },
    ...(v.izin.ekipmanPasif ? [{ k: "eylem", genislik: "13%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (e: PlanEkipmani) => (
      raporlu.has(e.id) ? null : (
        <div className={stil.eylemTuslar}>
          {e.pasif
            ? <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => pasif(e, false)}>Etkinleştir</Tus>
            : <Tus tur="ikincil" ikon="ban" disabled={bekliyor} aria-label={`${e.kod} pasife al`} onClick={() => pasif(e, true)}>Pasife al</Tus>}
        </div>
      )
    ) } satisfies Sutun<PlanEkipmani>] : []),
  ];

  function pasif(e: PlanEkipmani, p: boolean) {
    baslat(async () => {
      const r = await ekipmanPasifEylemi(planId, e.id, e.surum, p);
      bildir(r.tamam ? r.bildirim ?? "Kaydedildi." : r.genel ?? "Kaydedilemedi.");
      router.refresh();
    });
  }

  const yeniKaydet = () => ekle && baslat(async () => {
    const r = await yeniEkipmanEylemi(planId, { kod: ekle.kod, tur: ekle.tur, seri: ekle.seri, konum: ekle.konum });
    if (r.tamam) { setEkle(null); bildir(r.bildirim ?? "Eklendi."); router.refresh(); return; }
    setEkle({ ...ekle, hatalar: r.hatalar ?? { genel: r.genel ?? "Eklenemedi." } });
  });
  const kayitliKaydet = () => ekle && baslat(async () => {
    const r = await kayitliEkleEylemi(planId, ekle.secili);
    if (r.tamam) { setEkle(null); bildir(r.bildirim ?? "Eklendi."); router.refresh(); return; }
    setEkle({ ...ekle, hatalar: r.hatalar ?? { genel: r.genel ?? "Eklenemedi." } });
  });

  const kodHata = ekle?.hatalar.kod;
  const yeniTamam = durum.tur === "tamam" && !!ekle?.tur;
  return (
    <section className={stil.planBolum} aria-labelledby={`ekipmanlar-${planId}`}>
      <div className={stil.altBas}>
        <h3 id={`ekipmanlar-${planId}`}>Ekipmanlar</h3><Sayac s={s} />
        {v.izin.ekipmanEkle && <div className={stil.bolumTuslar}><Tus tur="ikincil" ikon="plus" onClick={() => { setEkle({ ...BOS }); setKd(null); }}>Ekipman ekle</Tus></div>}
      </div>
      <SuzgecliListe s={s} on="e" baslik="Plandaki ekipmanlar" sutunlar={sutunlar} anahtar={(e) => e.id}
        bosVeri={{ ikon: "inbox", baslik: "Bu planda ekipman yok", metin: v.izin.ekipmanEkle ? "“Ekipman ekle” ile tesisteki ekipman plana eklenir." : "Denetçi sahada ekler." }} />
      {ekle && (
        <Pencere acik baslik="Ekipman ekle" genis onKapat={() => setEkle(null)} odak={ekle.sekme === "yeni" ? `#${ID.kod}` : undefined}
          alt={<>
            <Tus tur="ikincil" onClick={() => setEkle(null)}>Vazgeç</Tus>
            {ekle.sekme === "yeni"
              ? <Tus ikon="check" disabled={!yeniTamam || bekliyor} onClick={yeniKaydet}>Kaydet ve plana ekle</Tus>
              : <Tus ikon="plus" disabled={!ekle.secili.length || bekliyor} onClick={kayitliKaydet}>Plana ekle{ekle.secili.length ? ` (${ekle.secili.length})` : ""}</Tus>}
          </>}>
          <p className={stil.adimNot}><b>{v.kart.tesis.ad}</b> · {v.kart.no}<br />{v.kart.musteri.unvan}</p>
          <div className={stil.sekmeler} role="group" aria-label="Ekleme yolu">
            <Tus tur={ekle.sekme === "yeni" ? "birincil" : "ikincil"} aria-pressed={ekle.sekme === "yeni"} onClick={() => setEkle({ ...ekle, sekme: "yeni", hatalar: {} })}>Yeni ekipman</Tus>
            <Tus tur={ekle.sekme === "kayitli" ? "birincil" : "ikincil"} aria-pressed={ekle.sekme === "kayitli"} onClick={() => setEkle({ ...ekle, sekme: "kayitli", hatalar: {} })}>
              Tesiste kayıtlı ({v.kayitli.length})</Tus>
          </div>
          {ekle.hatalar.genel && <p className={stil.uyari}>{ekle.hatalar.genel}</p>}
          {ekle.sekme === "yeni" ? (
            <FormIzgara>
              <Alan id={ID.kod} etiket="Ekipman kodu" zorunlu hata={kodHata}>
                <Girdi id={ID.kod} value={ekle.kod} maxLength={20} spellCheck={false} placeholder="HT-2040" hata={!!kodHata || durum.tur === "hata" || durum.tur === "tesiste"}
                  onChange={(e) => setEkle({ ...ekle, kod: kodNormal(e.target.value), hatalar: {} })} aria-describedby={kodHata ? ipucuId(ID.kod) : ID.durum} />
                {!kodHata && <p className={`${stil.kodDurum} ${KOD_SINIF[durum.tur]}`} id={ID.durum} role="status">
                  <Ikon ad={durum.tur === "tamam" ? "circle-check" : durum.tur === "bos" ? "circle-alert" : "triangle-alert"} kucuk /><span>{durum.metin}</span>
                </p>}
                {durum.tur === "tesiste" && durum.ekipmanId && (
                  <Tus tur="ikincil" onClick={() => setEkle({ ...ekle, sekme: "kayitli", secili: [durum.ekipmanId!], hatalar: {} })}>Kayıtlı ekipmanı seç</Tus>
                )}
              </Alan>
              <Alan id={ID.tur} etiket="Ekipman türü" zorunlu hata={ekle.hatalar.tur}>
                <SecimAlani id={ID.tur} ad="Ekipman türü" deger={ekle.tur} ipucu="Tür seçin" gecersiz={!!ekle.hatalar.tur} tanim={ekle.hatalar.tur ? ipucuId(ID.tur) : undefined}
                  secenekler={v.turler.map((t) => [t.id, t.ad, bransAd(t.brans)] as const)} degistir={(x) => setEkle({ ...ekle, tur: x, hatalar: {} })} />
              </Alan>
              <Alan id={ID.seri} etiket="Seri no" hata={ekle.hatalar.seri}>
                <Girdi id={ID.seri} value={ekle.seri} maxLength={30} hata={!!ekle.hatalar.seri} onChange={(e) => setEkle({ ...ekle, seri: e.target.value })} />
              </Alan>
              <Alan id={ID.konum} etiket="Konum / tanım" hata={ekle.hatalar.konum}>
                <Girdi id={ID.konum} value={ekle.konum} maxLength={60} placeholder="Kompresör odası" hata={!!ekle.hatalar.konum} onChange={(e) => setEkle({ ...ekle, konum: e.target.value })} />
              </Alan>
            </FormIzgara>
          ) : v.kayitli.length ? (
            <ul className={stil.secimListesi}>
              {v.kayitli.map((x) => (
                <li key={x.id}>
                  <label className={stil.secimSatir}>
                    <input type="checkbox" checked={ekle.secili.includes(x.id)} aria-label={`${x.kod} ${x.tur}`}
                      onChange={(e) => setEkle({ ...ekle, secili: e.target.checked ? [...ekle.secili, x.id] : ekle.secili.filter((y) => y !== x.id), hatalar: {} })} />
                    <span><span className={stil.kod}>{x.kod}</span> {x.tur}
                      <span className={stil.altMetin}>{[x.konum, x.onceki ? `Önceki kontrol ${tarihNo(x.onceki)}` : "İlk kontrol"].filter(Boolean).join(" · ")}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          ) : <p className={stil.bosSatir}>Bu tesiste plana alınmamış kayıtlı ekipman yok.</p>}
          {ekle.hatalar.secim && <p className={stil.uyari}>{ekle.hatalar.secim}</p>}
        </Pencere>
      )}
    </section>
  );
}
