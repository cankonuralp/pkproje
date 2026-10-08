"use client";
/* PLAN İÇİ · EKİPMANLAR (maket planlarim.html ekpSutun, ekleCiz; 3.–4. tur): süzgeç alan alan (Ekipman türü, Ekipman kodu — 2026-09-28) + çipler
   (Raporu yok / var, Denetimde eklendi, Önceki kontrolde kusur) + Branş; 10'ar sayfa. Satır: Kod (+ Yeni) · Ekipman türü · Konum · Branş · Önceki
   kontrol · Rapor (yeşil tik — 2026-09-28 "rapor varsa küçük yeşil bir tik" / Pasif) · İşlem (raporu olmayan ekipmanda: Pasife al simgesi /
   Etkinleştir + Rapor oluştur — 311; 2026-09-30 203: raporu olan ekipmanda ikisi de yok, rapor silinince geri gelir; 2026-10-03 "tablette pasife al
   tuşu rapor oluştur tuşunu aşağıya taşırıyor" → Pasife al simge, işlem sütunu Rapor sütunundan pay alır). Rapor oluştur yalnız plandaki denetçiye
   (izin sunucuda; plan günü gelmeden kapalı — ENGEL 1, neden plan içinde şeritte); başarıda plan içinde kalınır, bildirim ve Raporlar satırındaki
   "Raporu düzenle" saha rapor ekranını açar (maket rapor-olustur). 360: yöneticiye, hiç kullanılmamış ekipmanda Sil (çöp kutusu simgesi; onay "bütün
   planlardan çıkar, kodu yeniden kullanılabilir. Geri alınamaz.").
   405 (ARKA-UC §4.1): bağlantı yokken (ya da istek ağda düşerse) Rapor oluştur, cihaza önceden inen yeni rapor sayfasını açar
   (/raporlar/yeni/<plan>#<ekipman>); bu ekipmana cihazda açılmış, henüz gitmemiş rapor varsa tuş "Cihazdaki rapor".
   Ekipman ekle iki yol: YENİ (kodu personel etiketten yazar; yazarken denetlenir: bu planda var · bu tesiste kayıtlı → "Kayıtlı ekipmanı seç" ·
   başka tesiste · eski kod · kullanılabilir) ya da TESİSTE KAYITLI ekipmanı plana al. Eşsizlik sunucuda ve veritabanında da. */
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Pencere } from "../../../components/pencere/Pencere";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { SilTusu } from "../../../components/sil/SilTusu";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Tus } from "../../../components/tus/Tus";
import { KALIP } from "../../../styles/kalip";
import { kodBicimi, kodNormal, tarihNo, type KodTuru } from "../sema";
import type { PlanEkipmani, PlanIci } from "../server/plan-ici";
import { raporOlusturEylemi } from "../../raporlar/ui/eylemler";
import { ekipmanPasifEylemi, ekipmanSilEylemi, kayitliEkleEylemi, kodDurumuEylemi, yeniEkipmanEylemi } from "./eylemler";
import stil from "./planlar.module.css";

const bransAd = (b: "m" | "e") => (b === "m" ? "Mekanik" : "Elektrik");
/* 405: bağlantı yok mu · istek ağda mı düştü */
const cevrimdisiMi = () => typeof navigator !== "undefined" && navigator.onLine === false;
/** plan günü gelmedi şeridinin id'si (PlanIciEkrani çizer; kapalı Rapor oluştur sebebini buradan okur) */
export const ERKEN_ID = "plan-erken-sebep";
/** günlük süre doldu şeridi (212): Rapor oluştur kapalı, nedeni bu şerit */
export const MESAI_ID = "plan-mesai-sebep";
/* sütun genişlikleri: Rapor oluştur varken işlem sütunu Rapor sütunundan pay alır (maket .a-tablo-ekipman, 2026-10-03) */
const GENISLIK = {
  sade: { kod: "14%", tur: "22%", konum: "18%", brans: "11%", onceki: "14%", rapor: "8%", eylem: "13%" },
  rapor: { kod: "10%", tur: "15%", konum: "14%", brans: "10.5%", onceki: "17%", rapor: "8%", eylem: "25.5%" },
} as const;
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
  const raporlu = new Set(v.raporluEkipman);
  const s = useSuzgec(tanim(raporlu), v.ekipman);
  const [ekle, setEkle] = useState<Ekle | null>(null);
  const [kd, setKd] = useState<{ kod: string; tur: KodTuru; metin: string; ekipmanId?: string } | null>(null);
  const planId = v.kart.id;
  /* 405: bu planda cihazda açılmış (sunucuya gitmemiş) yeni raporların ekipmanları */
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const cihazda = new Set(kuyruk.isler.filter((x) => x.tur === "rapor.olustur" && x.yer?.startsWith(`${planId}|`)).map((x) => x.yer!.split("|")[1]));
  /* tam sayfa geçişi: bağlantı yokken sayfayı servis çalışanı cihazdan verir */
  const yeniRapor = (e: PlanEkipmani) => window.location.assign(new URL(`/raporlar/yeni/${planId}#${e.id}`, window.location.origin).href);

  /* yazarken kod denetimi: biçim tarayıcıda, eşsizlik sunucuda (300 ms sonra) */
  const kod = ekle?.sekme === "yeni" ? kodNormal(ekle.kod) : "";
  useEffect(() => {
    if (!kod || kodBicimi(kod)) return;
    let iptal = false;
    const t = setTimeout(() => { void kodDurumuEylemi(planId, kod).then((r) => { if (!iptal && r) setKd({ kod, ...r }); }); }, 300);
    return () => { iptal = true; clearTimeout(t); };
  }, [kod, planId]);
  const durum: { tur: KodTuru; metin: string; ekipmanId?: string } = kodBicimi(kod) ?? (kd?.kod === kod ? kd : { tur: "bos", metin: "Kod denetleniyor…" });

  const g = GENISLIK[v.izin.raporOlustur ? "rapor" : "sade"];
  const sutunlar: Sutun<PlanEkipmani>[] = [
    { k: "kod", genislik: g.kod, baslik: "Kod", kart: "ust", sira: 1, hucre: (e) => <><span className={stil.kod}>{e.kod}</span>{e.sonradan && <span className={stil.yeni}>Yeni</span>}</> },
    { k: "tur", genislik: g.tur, baslik: "Ekipman türü", kart: "govde", sira: 2, hucre: (e) => <Kirp>{e.tur}</Kirp> },
    { k: "konum", genislik: g.konum, baslik: "Konum", kart: "govde", sira: 3, hucre: (e) => <span className={stil.hucreSatir}><Ikon ad="map-pin" kucuk /><Kirp>{e.konum ?? "—"}</Kirp></span> },
    { k: "brans", genislik: g.brans, baslik: "Branş", kart: "govde", sira: 4, hucre: (e) => <span className={stil.hucreSatir}><Ikon ad={e.brans === "m" ? "cog" : "zap"} kucuk />{bransAd(e.brans)}</span> },
    { k: "onceki", genislik: g.onceki, baslik: "Önceki kontrol", kart: "govde", sira: 5, hucre: (e) => !e.onceki ? <span className={stil.ilk}>İlk kontrol</span> : (
      <><KartEtiket>Önceki kontrol</KartEtiket><span className={e.onceki.sonuc === "Kusurlu" ? stil.sonucHata : e.onceki.sonuc && e.onceki.sonuc !== "Uygun" ? stil.sonucUyari : undefined}
        title="eski kayıt (Excel)">{ayYil(e.onceki.tarih)}{e.onceki.sonuc && ` · ${e.onceki.sonuc}`}</span></>
    ) },
    { k: "rapor", genislik: g.rapor, baslik: "Rapor", kart: "rozet", sira: 1, hucre: (e) => e.pasif ? <Rozet tur="notr">Pasif</Rozet>
      : raporlu.has(e.id) ? <span className={stil.raporTik} title="Raporu var"><Ikon ad="circle-check" /><span className="gizli">Raporu var</span></span> : null },
    ...(v.izin.ekipmanPasif || v.izin.raporOlustur || v.izin.ekipmanSil ? [{ k: "eylem", genislik: g.eylem, baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (e: PlanEkipmani) => {
      if (raporlu.has(e.id)) return null;
      const olustur = v.izin.raporOlustur && !e.pasif;
      /* 360: yönetici, hiç kullanılmamış ekipman (raporu yok, tamamlanmış planda yok) */
      const sil = v.izin.ekipmanSil && e.sil;
      if (!v.izin.ekipmanPasif && !olustur && !sil) return null;
      return (
        <div className={stil.eylemTuslar}>
          {v.izin.ekipmanPasif && (e.pasif
            ? <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => pasif(e, false)}>Etkinleştir</Tus>
            : <Tus tur="ikincil" ikon="ban" className={stil.ikonTus} disabled={bekliyor} aria-label={`${e.kod} pasife al`} title="Pasife al"
              onClick={() => pasif(e, true)}><span className="gizli">Pasife al</span></Tus>)}
          {sil && <SilTusu kucuk ikon="trash-2" className={stil.ikonTus} ad={e.kod} baslik="Ekipmanı sil" yanEtki="bütün planlardan çıkar, kodu yeniden kullanılabilir"
            sil={() => ekipmanSilEylemi(planId, e.id)} />}
          {olustur && (cihazda.has(e.id)
            ? <Tus tur="ikincil" ikon="file-pen-line" aria-label={`${e.kod} için cihazdaki rapor`} onClick={() => yeniRapor(e)}>Cihazdaki rapor</Tus>
            : <Tus tur="ikincil" ikon="file-plus" disabled={bekliyor || v.erken || !!v.mesai} aria-label={`${e.kod} için rapor oluştur`}
              aria-describedby={v.erken ? ERKEN_ID : v.mesai ? MESAI_ID : undefined} onClick={() => raporAc(e)}>Rapor oluştur</Tus>
          )}
        </div>
      );
    } } satisfies Sutun<PlanEkipmani>] : []),
  ];

  function pasif(e: PlanEkipmani, p: boolean) {
    baslat(async () => {
      const r = await ekipmanPasifEylemi(planId, e.id, e.surum, p);
      bildir(r.tamam ? r.bildirim ?? "Kaydedildi." : r.genel ?? "Kaydedilemedi.");
      router.refresh();
    });
  }

  /* Rapor oluştur (311): sunucu numarayı verir, ilk rapor planı Denetimde yapar; başarıda saha rapor ekranına geçilir */
  function raporAc(e: PlanEkipmani) {
    if (cevrimdisiMi()) { yeniRapor(e); return; }
    baslat(async () => {
      let r: Awaited<ReturnType<typeof raporOlusturEylemi>>;
      try { r = await raporOlusturEylemi(planId, e.id); } catch (h) {
        if (!(h instanceof TypeError) && !cevrimdisiMi()) throw h;
        yeniRapor(e);
        return;
      }
      if (r.tamam) { bildir(r.bildirim ?? "Rapor oluşturuldu."); router.refresh(); return; }
      bildir(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "Rapor oluşturulamadı.");
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
