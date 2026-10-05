"use client";
/* PLAN İÇİ · RAPORLAR (311; maket planlarim.html RAP_SUTUN, CIP_R, suzgecTanimla("r"), X["rapor-sil-ac"]): planın raporları (silinen görünmez),
   en yeni üstte, 20'şer sayfa (reisim "5 değil 20"). Süzgeç alan alan (Rapor no, Ekipman kodu — 2026-09-28 "genel ara olmasın") +
   durum çipleri. Satır: Rapor no · Ekipman (kod + tür) · Sonuç · Durum · Oluşturuldu · İşlem: kendi Yeni raporunda "Raporu düzenle" + Sil (2026-09-29
   "oluşan rapor denetçi tarafından da silinebilsin", onay penceresiyle), ötekinde "Raporu aç" — ikisi de saha rapor ekranına (/raporlar/<id>).
   Raporda "Pasife al" yok (2026-09-30 N11: pasife alma ekipman satırında). Yetki sunucuda; Sil sunucuda yeniden denetlenir (rapor_sil). */
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { DegerYok, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { KALIP } from "../../../styles/kalip";
import { RAPOR_DURUM, SONUC_AD } from "../../raporlar/sema";
import { raporSilEylemi } from "../../raporlar/ui/eylemler";
import { zamanNo } from "../sema";
import type { PlanEkipmani, PlanIci } from "../server/plan-ici";
import stil from "./planlar.module.css";

type Rapor = PlanIci["raporlar"][number];
type Ekipmanlar = ReadonlyMap<string, PlanEkipmani>;

function tanim(ekp: Ekipmanlar): SuzgecTanimi<Rapor> {
  const kod = (r: Rapor) => ekp.get(r.ekipmanId)?.kod ?? "";
  return {
    ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", imkansiz: "Bir rapor aynı anda iki durumda olamaz", sayfa: KALIP.sayfa.rapor,
    metin: (r) => [r.no, kod(r), ekp.get(r.ekipmanId)?.tur ?? ""].join(" "),
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DM-1026-001", metin: (r) => r.no },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: kod },
    ],
    cipler: (["taslak", "onayda", "onaylandi", "imzali"] as const).map((d) => ({ k: d, ad: RAPOR_DURUM[d][0], grup: "durum", test: (r: Rapor) => r.durum === d })),
    seciciler: [],
  };
}

export function RaporBolumu({ v }: { v: PlanIci }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const ekp: Ekipmanlar = useMemo(() => new Map(v.ekipman.map((e) => [e.id, e])), [v.ekipman]);
  const t = useMemo(() => tanim(ekp), [ekp]);
  const s = useSuzgec(t, v.raporlar);
  const baslikId = `raporlar-${v.kart.id}`;

  async function sil(r: Rapor) {
    const kod = ekp.get(r.ekipmanId)?.kod ?? "—";
    const evet = await onayla({ baslik: "Raporu sil", metin: <><Kod>{r.no}</Kod> · {kod} raporu ve içine yazılan her şey silinir; geri alınamaz.</>, tus: "Sil", tehlike: true });
    if (!evet) return;
    baslat(async () => {
      const y = await raporSilEylemi(r.id, r.surum);
      bildir(y.tamam ? y.bildirim ?? `${r.no} silindi.` : y.genel ?? "Rapor silinemedi.");
      router.refresh();
      if (y.tamam) document.getElementById(baslikId)?.focus();
    });
  }

  const sutunlar: Sutun<Rapor>[] = [
    { k: "no", genislik: "20%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => <Kod>{r.no}</Kod> },
    { k: "ekipman", genislik: "22%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => {
      const e = ekp.get(r.ekipmanId);
      return <span className={stil.hucreSatir}><span className={stil.kod}>{e?.kod ?? "—"}</span><Kirp>{e?.tur ?? ""}</Kirp></span>;
    } },
    { k: "sonuc", genislik: "12.5%", baslik: "Sonuç", kart: "govde", sira: 3, hucre: (r) => <>
      <KartEtiket>Sonuç</KartEtiket>
      {r.sonuc ? <span className={r.sonuc === "uygun" ? stil.sonucUygun : stil.sonucHata}>{SONUC_AD[r.sonuc]}</span> : <DegerYok />}
    </> },
    { k: "durum", genislik: "15%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
    { k: "olustu", genislik: "11%", baslik: "Oluşturuldu", kart: "govde", sira: 4, hucre: (r) => <><KartEtiket>Oluşturuldu</KartEtiket><span className={stil.zaman}>{zamanNo(r.olustu)}</span></> },
    { k: "eylem", genislik: "19.5%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (r) => {
      const duzenler = r.benim && r.durum === "taslak";
      return (
        <div className={stil.eylemTuslar}>
          {duzenler && (
            <Tus tur="ikincil" ikon="trash-2" className={`${stil.ikonTus} ${stil.silTus}`} disabled={bekliyor} aria-label={`${r.no} sil`} title="Sil"
              onClick={() => void sil(r)}><span className="gizli">Sil</span></Tus>
          )}
          <TusBaglanti ikon={duzenler ? "pencil" : "file-text"} href={`/raporlar/${r.id}`}>{duzenler ? "Raporu düzenle" : "Raporu aç"}</TusBaglanti>
        </div>
      );
    } },
  ];

  return (
    <section className={stil.planBolum} aria-labelledby={baslikId}>
      <div className={stil.altBas}><h3 id={baslikId} tabIndex={-1}>Raporlar</h3><Sayac s={s} /></div>
      <SuzgecliListe s={s} on="r" baslik="Bu plandaki raporlar" sutunlar={sutunlar} anahtar={(r) => r.id}
        bosVeri={{ ikon: "file-text", baslik: "Bu planda rapor yok.", metin: v.izin.raporOlustur ? "Rapor ekipman satırındaki “Rapor oluştur” ile açılır." : "Denetçi sahada rapor oluşturur." }} />
    </section>
  );
}
