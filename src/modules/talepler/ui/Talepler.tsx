"use client";
/* TALEPLERİM (maket talepler.html — SUTUN, ozetCiz, izinCiz, masrafCiz, talepCiz; 330): yıllık izin özeti, izin talepleri ve masraf formları tek
   listede (en yeni üstte; tür ve durum çipleri, yıl seçicisi), "İzin talebi" ve "Masraf formu" pencereleri, talep penceresi (ayrıntı, belge —
   onay beklerken eklenir / değiştirilir / kaldırılır, "Talebi geri çek"). Karar sunucuda; talep yalnız kişinin kendi adına.
   477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 · T3): Talepler = YALNIZ KENDİ TALEPLERİM — onaylayana gelen talepler Onaylar'da (456'nın
   "onayınızı bekleyen" şeridi kalktı; Talepler'de balon yok). Düzeltmeye geri gönderilen talep: şerit + gerekçe; "Düzelt ve yeniden gönder" aynı
   pencereyi talebin değerleriyle açar (ya da geri çekilir). */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { AltSatir, DegerYok, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { tutar as tutarSema } from "../../../sema/ortak";
import { GIDER_DURUM, GIDER_TUR, giderKdv, KDV_ORAN, para, type GiderTuru } from "../../muhasebe/sema";
import type { MasrafFormu } from "../../muhasebe/server/talep-baglanti";
import { isGunu, IZIN_DURUM, IZIN_TUR, type IzinTuru } from "../sema";
import type { IzinTalebi, Taleplerim } from "../server/talepler";
import {
  izinBelgesiEylemi, izinDuzeltEylemi, izinGeriCekEylemi, izinGonderEylemi, masrafBelgesiEylemi, masrafDuzeltEylemi, masrafGeriCekEylemi, masrafGonderEylemi,
  type TalepYaniti,
} from "./eylemler";
import stil from "./talepler.module.css";

type Talep = { tip: "izin"; x: IzinTalebi } | { tip: "masraf"; x: MasrafFormu };
const zamanYaz = (iso: string) => {
  const d = new Date(iso), p = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return p.format(d).replace(/\s/, " ");
};
const turAd = (t: Talep) => (t.tip === "izin" ? "İzin talebi" : "Masraf formu");
/* gönderim yılı Türkiye takvimiyle (UTC değil — 1 Ocak 00:30'da gönderilen önceki yıla düşmesin; 329–332 incelemesi) */
const YIL = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric" });
const yilTr = (iso: string) => YIL.format(new Date(iso));
const aralik = (x: { bas: string; bit: string }) => `${tarihNo(x.bas)}${x.bit !== x.bas ? ` – ${tarihNo(x.bit)}` : ""}`;
const ayrinti = (t: Talep) => (t.tip === "izin" ? `${IZIN_TUR[t.x.tur]} · ${aralik(t.x)} · ${t.x.gun} gün`
  : `${GIDER_TUR[t.x.tur][0]} · ${para(t.x.tutar)} · ${t.x.is ? t.x.is.no : "Genel"}`);
const durumRozet = (t: Talep) => (t.tip === "izin" ? <Rozet tur={IZIN_DURUM[t.x.durum][1]}>{IZIN_DURUM[t.x.durum][0]}</Rozet>
  : <Rozet tur={GIDER_DURUM[t.x.durum][1]}>{GIDER_DURUM[t.x.durum][0]}</Rozet>);
const bekliyor = (t: Talep) => t.x.durum === "bekliyor";
/** 477: düzeltmeye geri gönderilmiş */
const duzeltmede = (t: Talep) => t.x.durum === "duzeltme";
/** karar verilmemiş: onay bekliyor ya da düzeltmede (belge değişir, geri çekilir) */
const kararsiz = (t: Talep) => bekliyor(t) || duzeltmede(t);

function tanim(l: readonly Talep[]): SuzgecTanimi<Talep> {
  const yillar = [...new Set(l.map((t) => yilTr(t.x.gonderildi)))].sort().reverse();
  return {
    ad: "Taleplerde ara", ipucu: "Talep no, tür, açıklama", birim: "talep", sayfa: 20, imkansiz: "Bir talep aynı anda iki türde ya da iki durumda olamaz",
    metin: (t) => [t.x.no, turAd(t), ayrinti(t), t.x.aciklama ?? ""].join(" "),
    cipler: [
      { k: "izin", ad: "İzin", grup: "tip", test: (t) => t.tip === "izin" },
      { k: "masraf", ad: "Masraf", grup: "tip", test: (t) => t.tip === "masraf" },
      { k: "bekliyor", ad: "Onay bekliyor", grup: "durum", test: bekliyor },
      { k: "duzeltme", ad: "Düzeltilecek", grup: "durum", test: duzeltmede },
      { k: "sonuc", ad: "Sonuçlanan", grup: "durum", test: (t) => !kararsiz(t) },
    ],
    seciciler: [{ k: "yil", ad: "Yıl", secenek: () => [["tumu", "Tümü"], ...yillar.map((y) => [y, y] as [string, string])], gecer: (t, v) => v === "tumu" || yilTr(t.x.gonderildi) === v }],
    varsayilanSira: (a, b) => b.x.gonderildi.localeCompare(a.x.gonderildi),
  };
}

type Pen = null | { tip: "izin"; duzelt?: IzinTalebi } | { tip: "masraf"; duzelt?: MasrafFormu } | { tip: "talep"; t: Talep };
export function TaleplerSayfasi({ v, bugun }: { v: Taleplerim; bugun: string }) {
  const l: Talep[] = [...v.izinler.map((x) => ({ tip: "izin" as const, x })), ...v.masraflar.map((x) => ({ tip: "masraf" as const, x }))];
  const s = useSuzgec(tanim(l), l);
  const [p, setP] = useState<Pen>(null);
  const o = v.ozet, bek = l.filter(bekliyor).length, duz = l.filter(duzeltmede);
  const duzelt = (t: Talep) => setP(t.tip === "izin" ? { tip: "izin", duzelt: t.x } : { tip: "masraf", duzelt: t.x });
  const sutunlar: Sutun<Talep>[] = [
    { k: "no", genislik: "18%", baslik: "Talep no", kart: "ust", sira: 1, hucre: (t) => (
      <><button type="button" className={stil.noTus} onClick={() => setP({ tip: "talep", t })}>{t.x.no}</button><AltSatir>{zamanYaz(t.x.gonderildi)}</AltSatir></>
    ) },
    { k: "tur", genislik: "36%", baslik: "Talep", kart: "govde", sira: 2, hucre: (t) => <span><b>{turAd(t)}</b><AltSatir><Kirp>{ayrinti(t)}</Kirp></AltSatir></span> },
    { k: "aciklama", genislik: "28%", baslik: "Açıklama", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Açıklama</KartEtiket>{t.x.aciklama ? <Kirp>{t.x.aciklama}</Kirp> : <DegerYok />}</> },
    { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: durumRozet },
  ];
  return (
    <>
      <SayfaBasi baslik="Talepler" sayac={<Sayac s={s} />} tuslar={<>
        <Tus tur="ikincil" ikon="plus" onClick={() => setP({ tip: "izin" })}>İzin talebi</Tus>
        <Tus ikon="plus" onClick={() => setP({ tip: "masraf" })}>Masraf formu</Tus>
      </>} />
      {/* 477: düzeltmeye geri gönderilen talepler — gerekçe ve düzelt tuşu */}
      {duz.length > 0 && <div className={stil.bekleyen}>{duz.map((t) => (
        <Serit key={`${t.tip}|${t.x.id}`} tur="uyari" ikon="undo-2"
          eylem={<Tus tur="ikincil" ikon="pencil" onClick={() => duzelt(t)} aria-label={`${t.x.no} düzelt ve yeniden gönder`}>Düzelt ve yeniden gönder</Tus>}>
          <b>{t.x.no} düzeltmeye geri gönderildi</b> · {turAd(t)}{t.x.geri ? <>: “{t.x.geri}”</> : null}
        </Serit>
      ))}</div>}
      <Yuzler>
        <Yuz ikon="calendar" ad="Yıllık izin hakkı" sayi={`${o.hak} gün`} not={o.yil} />
        <Yuz ikon="calendar-check" ad="Kullanılan" sayi={`${o.kullanilan} gün`} not={o.bekleyen ? `${o.bekleyen} gün onay bekliyor` : undefined} />
        <Yuz ikon="clock" ad="Kalan" sayi={`${o.kalan} gün`} uyari={o.kalan < 0} />
        <Yuz ikon="inbox" ad="Onay bekleyen talep" sayi={bek} />
      </Yuzler>
      <SuzgecliListe s={s} on="t" baslik="Taleplerim" sutunlar={sutunlar} anahtar={(t) => `${t.tip}|${t.x.id}`}
        bosVeri={{ ikon: "inbox", baslik: "Talep yok", metin: "İzin talebi ya da masraf formu “İzin talebi” ve “Masraf formu” ile gönderilir." }} />
      {p?.tip === "izin" && <IzinPenceresi ozet={o} gelecek={v.gelecekOzet} duzelt={p.duzelt} kapat={() => setP(null)} />}
      {p?.tip === "masraf" && <MasrafPenceresi v={v} bugun={bugun} duzelt={p.duzelt} kapat={() => setP(null)} />}
      {p?.tip === "talep" && <TalepPenceresi t={p.t} kapat={() => setP(null)} duzelt={() => duzelt(p.t)} />}
    </>
  );
}

/* ── İZİN TALEBİ ── */
const IID = { tur: "w-izin-tur", bas: "w-izin-bas", bit: "w-izin-bit", aciklama: "w-izin-aciklama", belge: "w-izin-belge" } as const;
/** duzelt (477): düzeltmeye geri gönderilen talep — pencere onun değerleriyle açılır, "Düzelt ve yeniden gönder" */
function IzinPenceresi({ ozet: buYil, gelecek, duzelt, kapat }: { ozet: Taleplerim["ozet"]; gelecek: Taleplerim["ozet"]; duzelt?: IzinTalebi; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyorMu, baslat] = useTransition();
  const [d, setD] = useState({ tur: duzelt?.tur ?? "", bas: duzelt?.bas ?? "", bit: duzelt?.bit ?? "", aciklama: duzelt?.aciklama ?? "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  /* izin başlangıç yılına sayılır: aşım o yılın kalanıyla */
  const ozet = d.bas && d.bas.slice(0, 4) === gelecek.yil ? gelecek : buYil;
  const g = d.bas && d.bit && d.bit >= d.bas ? isGunu(d.bas, d.bit) : 0, asim = d.tur === "yillik" && g > ozet.kalan;
  const gonder = () => baslat(async () => {
    const f = new FormData();
    for (const [k, x] of Object.entries(d)) f.set(k, x);
    const b = dosya.current?.files?.[0];
    if (b) f.set("belge", b);
    if (duzelt) { f.set("id", duzelt.id); f.set("surum", String(duzelt.surum)); }
    const r: TalepYaniti = await (duzelt ? izinDuzeltEylemi(f) : izinGonderEylemi(f));
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof IID | undefined; if (k && IID[k]) requestAnimationFrame(() => document.getElementById(IID[k])?.focus()); return; }
    kapat(); bildir(r.bildirim ?? "İzin talebi gönderildi."); router.refresh();
  });
  return (
    <Pencere acik baslik={duzelt ? `İzin talebini düzelt · ${duzelt.no}` : "İzin talebi"} onKapat={() => { if (!bekliyorMu) kapat(); }} odak={`#${IID.tur}`} genis
      alt={<><Tus tur="ikincil" disabled={bekliyorMu} onClick={kapat}>Vazgeç</Tus>
        <Tus ikon="send" disabled={bekliyorMu} aria-busy={bekliyorMu || undefined} onClick={gonder}>{duzelt ? "Düzelt ve yeniden gönder" : "Gönder"}</Tus></>}>
      {duzelt?.geri && <Serit tur="uyari" ikon="undo-2"><b>Düzeltme isteği:</b> “{duzelt.geri}”</Serit>}
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <div className={stil.form}>
        <Alan id={IID.tur} etiket="İzin türü" zorunlu hata={h.tur}>
          <SecimAlani id={IID.tur} ad="İzin türü" deger={d.tur} ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(IID.tur) : undefined}
            secenekler={Object.entries(IZIN_TUR).map(([k, ad]) => [k, ad] as const)} degistir={(x) => setD({ ...d, tur: x as IzinTuru })} />
        </Alan>
        <Alan id={IID.bas} etiket="Başlangıç" zorunlu hata={h.bas}>
          <TarihAlani id={IID.bas} ad="İzin başlangıcı" deger={d.bas} degistir={(x) => setD({ ...d, bas: x, bit: !d.bit || d.bit < x ? x : d.bit })} tanim={h.bas ? ipucuId(IID.bas) : undefined} />
        </Alan>
        <Alan id={IID.bit} etiket="Bitiş" zorunlu hata={h.bit} sonuc={!h.bit && g && !asim ? `${g} iş günü` : undefined}
          uyari={!h.bit && asim ? `${g} iş günü · kalan yıllık izin ${ozet.kalan} gün` : undefined}>
          <TarihAlani id={IID.bit} ad="İzin bitişi" deger={d.bit} degistir={(x) => setD({ ...d, bit: x })} tanim={h.bit || g ? ipucuId(IID.bit) : undefined} />
        </Alan>
        <div className={stil.genis}>
          <Alan id={IID.aciklama} etiket="Açıklama" hata={h.aciklama}>
            <Girdi id={IID.aciklama} value={d.aciklama} maxLength={160} hata={!!h.aciklama} mesajli={!!h.aciklama} onChange={(e) => setD({ ...d, aciklama: e.target.value })} />
          </Alan>
        </div>
        {d.tur === "rapor" && <div className={stil.genis}>
          <Alan id={IID.belge} etiket={duzelt?.belge ? "Sağlık raporunu değiştir (PDF ya da fotoğraf)" : "Sağlık raporu (PDF ya da fotoğraf)"} hata={h.belge}
            sonuc={h.belge ? undefined : duzelt?.belge ? "Seçmezseniz eklenmiş belge kalır." : "İsteğe bağlı; sonra da eklenebilir."}>
            <input ref={dosya} id={IID.belge} className={stil.dosya} type="file" accept="application/pdf,image/jpeg,image/png" aria-describedby={ipucuId(IID.belge)}
              aria-invalid={!!h.belge || undefined} />
          </Alan>
        </div>}
      </div>
    </Pencere>
  );
}

/* ── MASRAF FORMU ── */
const MID = { is: "w-masraf-is", tarih: "w-masraf-tarih", tur: "w-masraf-tur", tutar: "w-masraf-tutar", oran: "w-masraf-oran", aciklama: "w-masraf-aciklama",
  belge: "w-masraf-belge" } as const;
const tlYaz = (kurus: number) => (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** duzelt (477): düzeltmeye geri gönderilen masraf formu — pencere onun değerleriyle açılır */
function MasrafPenceresi({ v, bugun, duzelt, kapat }: { v: Taleplerim; bugun: string; duzelt?: MasrafFormu; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyorMu, baslat] = useTransition();
  const [d, setD] = useState({ is: duzelt?.is?.id ?? "", tarih: duzelt?.tarih ?? bugun, tur: duzelt?.tur ?? "", tutar: duzelt ? tlYaz(duzelt.tutar) : "", oran: String(duzelt?.oran ?? 20),
    aciklama: duzelt?.aciklama ?? "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  const tp = tutarSema.safeParse(d.tutar), kdv = tp.success && tp.data > 0 ? giderKdv(tp.data, Number(d.oran)) : null;
  const gonder = () => baslat(async () => {
    const f = new FormData();
    for (const [k, x] of Object.entries(d)) f.set(k, x);
    const b = dosya.current?.files?.[0];
    if (b) f.set("belge", b);
    if (duzelt) { f.set("id", duzelt.id); f.set("surum", String(duzelt.surum)); }
    const r = await (duzelt ? masrafDuzeltEylemi(f) : masrafGonderEylemi(f));
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof MID | undefined; if (k && MID[k]) requestAnimationFrame(() => document.getElementById(MID[k])?.focus()); return; }
    kapat(); bildir(r.bildirim ?? "Masraf formu gönderildi."); router.refresh();
  });
  /* düzeltilen formun işi artık seçeneklerde yoksa kayıttaki korunur */
  const isler = duzelt?.is && !v.isler.some((x) => x.id === duzelt.is!.id) ? [{ id: duzelt.is.id, no: duzelt.is.no, tesis: "—", tarih: "" }, ...v.isler] : v.isler;
  return (
    <Pencere acik baslik={duzelt ? `Masraf formunu düzelt · ${duzelt.no}` : "Masraf formu"} onKapat={() => { if (!bekliyorMu) kapat(); }} odak={`#${MID.tur}`} genis
      alt={<><Tus tur="ikincil" disabled={bekliyorMu} onClick={kapat}>Vazgeç</Tus>
        <Tus ikon="send" disabled={bekliyorMu} aria-busy={bekliyorMu || undefined} onClick={gonder}>{duzelt ? "Düzelt ve yeniden gönder" : "Gönder"}</Tus></>}>
      {duzelt?.geri && <Serit tur="uyari" ikon="undo-2"><b>Düzeltme isteği:</b> “{duzelt.geri}”</Serit>}
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <div className={stil.form}>
        <div className={stil.genis}>
          <Alan id={MID.is} etiket="İş" hata={h.is}>
            <SecimAlani id={MID.is} ad="İş" deger={d.is} gecersiz={!!h.is} tanim={h.is ? ipucuId(MID.is) : undefined}
              secenekler={[["", "Genel (işe bağlı değil)"], ...isler.map((x) => [x.id, `${x.no} · ${x.tesis}`, x.tarih ? tarihNo(x.tarih) : ""] as const)]} degistir={(x) => setD({ ...d, is: x })} />
          </Alan>
        </div>
        <Alan id={MID.tarih} etiket="Tarih" zorunlu hata={h.tarih}>
          <TarihAlani id={MID.tarih} ad="Masraf tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={h.tarih ? ipucuId(MID.tarih) : undefined} />
        </Alan>
        <Alan id={MID.tur} etiket="Tür" zorunlu hata={h.tur}>
          <SecimAlani id={MID.tur} ad="Tür" deger={d.tur} ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(MID.tur) : undefined}
            secenekler={Object.entries(GIDER_TUR).map(([k, [ad]]) => [k, ad] as const)}
            degistir={(x) => setD({ ...d, tur: x, oran: x in GIDER_TUR ? String(GIDER_TUR[x as GiderTuru][1]) : d.oran })} />
        </Alan>
        <Alan id={MID.tutar} etiket="Tutar (KDV dahil)" zorunlu hata={h.tutar}>
          <Girdi id={MID.tutar} value={d.tutar} inputMode="decimal" maxLength={18} hata={!!h.tutar} mesajli={!!h.tutar} onChange={(e) => setD({ ...d, tutar: e.target.value })} />
        </Alan>
        <Alan id={MID.oran} etiket="KDV oranı" hata={h.oran} sonuc={kdv && !h.oran ? `KDV ${para(kdv.kdv)} · KDV hariç ${para(kdv.haric)}` : undefined}>
          <SecimAlani id={MID.oran} ad="KDV oranı" deger={d.oran} gecersiz={!!h.oran} secenekler={KDV_ORAN.map((x) => [String(x), `%${x}`] as const)}
            degistir={(x) => setD({ ...d, oran: x })} tanim={kdv || h.oran ? ipucuId(MID.oran) : undefined} />
        </Alan>
        <div className={stil.genis}>
          <Alan id={MID.aciklama} etiket="Açıklama" hata={h.aciklama}>
            <Girdi id={MID.aciklama} value={d.aciklama} maxLength={120} hata={!!h.aciklama} mesajli={!!h.aciklama} onChange={(e) => setD({ ...d, aciklama: e.target.value })} />
          </Alan>
        </div>
        <div className={stil.genis}>
          <Alan id={MID.belge} etiket={duzelt?.belge ? "Fişi değiştir (PDF ya da fotoğraf)" : "Fiş (PDF ya da fotoğraf)"} hata={h.belge}
            sonuc={h.belge ? undefined : duzelt?.belge ? "Seçmezseniz eklenmiş fiş kalır." : "İsteğe bağlı; yoksa muhasebe “Belge yok” görür."}>
            {/* capture yok: telefonda PDF fiş de seçilebilsin (seçici "kamera / dosya" sunar — 329–332 incelemesi) */}
            <input ref={dosya} id={MID.belge} className={stil.dosya} type="file" accept="application/pdf,image/jpeg,image/png"
              aria-describedby={ipucuId(MID.belge)} aria-invalid={!!h.belge || undefined} />
          </Alan>
        </div>
      </div>
    </Pencere>
  );
}

/* ── TALEP (görünüm; onay beklerken belge ve geri çekme) ── */
const BELGE_ID = "w-talep-belge";
function TalepPenceresi({ t, kapat, duzelt }: { t: Talep; kapat: () => void; duzelt: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyorMu, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  const x = t.x, bek = kararsiz(t), belgeAd = t.tip === "izin" ? "Belge" : "Fiş", belgeyi = t.tip === "izin" ? "Belgeyi" : "Fişi";
  const onayla = useOnayla();
  const sonuc = (r: TalepYaniti, varsayilan: string) => {
    if (!r.tamam) { setHata(r.hatalar?.belge ?? r.genel ?? "Kaydedilemedi."); return; }
    kapat(); bildir(r.bildirim ?? varsayilan); router.refresh();
  };
  const belge = (kaldir: boolean) => baslat(async () => {
    const f = new FormData(); f.set("id", x.id); f.set("surum", String(x.surum));
    if (kaldir) f.set("belgeKaldir", "1"); else { const b = dosya.current?.files?.[0]; if (!b) { setHata(`${belgeAd} seçilmeli.`); return; } f.set("belge", b); }
    sonuc(await (t.tip === "izin" ? izinBelgesiEylemi(f) : masrafBelgesiEylemi(f)), "Kaydedildi.");
  });
  const geriCek = () => baslat(async () => sonuc(await (t.tip === "izin" ? izinGeriCekEylemi(x.id) : masrafGeriCekEylemi(x.id)), `${x.no} geri çekildi.`));
  return (
    <Pencere acik baslik={`${turAd(t)} · ${x.no}`} onKapat={() => { if (!bekliyorMu) kapat(); }} genis
      alt={<>
        {bek && <Tus tur="ikincil" ikon="undo-2" disabled={bekliyorMu} onClick={geriCek}>Talebi geri çek</Tus>}
        {duzeltmede(t) && <Tus ikon="pencil" disabled={bekliyorMu} onClick={duzelt}>Düzelt ve yeniden gönder</Tus>}
        {/* 341: talebin formu (temel format) PDF iner — maket "PDF · e-posta" (e-posta K5) */}
        <a className={tusSinifi("ikincil")} href={`/talepler/pdf/${t.tip}/${x.id}`} download><Ikon ad="file-text" kucuk />PDF</a>
        <Tus disabled={bekliyorMu} onClick={kapat}>Kapat</Tus>
      </>}>
      <BilgiListesi>
        <Bilgi etiket="Durum">{durumRozet(t)}</Bilgi>
        <Bilgi etiket="Gönderildi">{zamanYaz(x.gonderildi)}</Bilgi>
        {t.tip === "izin" ? <>
          <Bilgi etiket="İzin türü">{IZIN_TUR[t.x.tur]}</Bilgi>
          <Bilgi etiket="Tarih">{aralik(t.x)}</Bilgi>
          <Bilgi etiket="Süre">{t.x.gun} iş günü</Bilgi>
          {t.x.kararVeren && <Bilgi etiket={t.x.durum === "red" ? "Reddeden" : t.x.durum === "duzeltme" ? "Geri gönderen" : "Onaylayan"}>{t.x.kararVeren}{t.x.karar && <AltSatir>{zamanYaz(t.x.karar)}</AltSatir>}</Bilgi>}
        </> : <>
          <Bilgi etiket="İş">{t.x.is ? t.x.is.no : "Genel (işe bağlı değil)"}</Bilgi>
          <Bilgi etiket="Tarih">{tarihNo(t.x.tarih)}</Bilgi>
          <Bilgi etiket="Tür">{GIDER_TUR[t.x.tur][0]}</Bilgi>
          <Bilgi etiket="Tutar (KDV dahil)">{para(t.x.tutar)}<AltSatir>%{t.x.oran} KDV</AltSatir></Bilgi>
          {t.x.odeme && <Bilgi etiket="Ödendi">{tarihNo(t.x.odeme)}</Bilgi>}
        </>}
        {x.red && <Bilgi etiket="Red gerekçesi" genis>{x.red}</Bilgi>}
        {x.geri && <Bilgi etiket={duzeltmede(t) ? "Düzeltme isteği" : "Son düzeltme isteği"} genis>{x.geri}</Bilgi>}
        <Bilgi etiket="Açıklama" genis>{x.aciklama ?? <DegerYok />}</Bilgi>
        <Bilgi etiket={belgeAd}>{x.belge ? <DosyaAcTusu dosyaId={x.belge} ikon="file-text">{belgeAd}</DosyaAcTusu> : <DegerYok>Yok</DegerYok>}</Bilgi>
      </BilgiListesi>
      {bek && <div className={stil.belge}>
        <Alan id={BELGE_ID} etiket={x.belge ? `${belgeyi} değiştir (PDF ya da fotoğraf)` : `${belgeAd} ekle (PDF ya da fotoğraf)`} hata={hata ?? undefined}>
          <input ref={dosya} id={BELGE_ID} className={stil.dosya} type="file" accept="application/pdf,image/jpeg,image/png" aria-describedby={hata ? ipucuId(BELGE_ID) : undefined}
            aria-invalid={!!hata || undefined} />
        </Alan>
        <div className={stil.tuslar}>
          {/* önce sorulur (maket talep-belge-sil "Eki sil") */}
          {x.belge && <Tus tur="ikincil" ikon="x" disabled={bekliyorMu} onClick={async () => {
            if (await onayla({ baslik: "Eki sil", metin: `${belgeAd} talepten silinir.`, tus: "Sil", tehlike: true })) belge(true);
          }}>{belgeyi} kaldır</Tus>}
          <Tus tur="ikincil" ikon="upload" disabled={bekliyorMu} onClick={() => belge(false)}>Yükle</Tus>
        </div>
      </div>}
    </Pencere>
  );
}
