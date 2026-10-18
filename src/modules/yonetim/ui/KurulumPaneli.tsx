"use client";
/* YÖNETİM › FİRMA › KURULUM (FIRMA-VT §5.12; FV10 — 2026-10-16): kendi projeli firmanın Supabase projesi kurulurken firma sayfasında. Sayfa açıkken 3 sn'de bir
   ilerletilir (her ilerletme sunucuda en çok 40 sn; aynı anda tek ilerleten — kira). Adımlar: tamamlandı · sürüyor · hata · bekliyor. Kalıcı hatada
   "Kaldığı yerden sürdür"; proje açılamadıysa (INIT_FAILED) "Projeyi kaldır ve yeniden dene" (önce sorulur). Bitince sayfa sunucudan yenilenir — firma
   etkin, "Yöneticiye yeni geçici parola" tuşu açılır. Sayfa kapanırsa kurulum DURUR (ilerletme yalnız sayfa açıkken — §8 açık soru 3); dönünce sürer. */
import { useEffect, useState, useTransition } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { Bolum, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { ADIM_ADI, adimSirasi, KURULUM, KURULUM_ADIMLARI } from "../kurulum-adim";
import type { KurulumGorunumu } from "../server/kurulum";
import { kurulumBastanEylemi, kurulumIlerletEylemi, kurulumSurdurEylemi } from "./eylemler";
import stil from "./yonetim.module.css";

/** ekranda gösterilen adımlar (kayıt ve "tamam" iç adımlar) */
const GORUNEN = KURULUM_ADIMLARI.filter((a) => a !== "kayit" && a !== "tamam");

export function KurulumPaneli({ id, ilk }: { id: string; ilk: KurulumGorunumu | null }) {
  const [g, setG] = useState<KurulumGorunumu | null>(ilk);
  const [genel, setGenel] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  const onayla = useOnayla();
  const suruyor = !!g && g.durum !== "durdu" && g.durum !== "tamam";

  /* sayfa açıkken ilerlet: yanıt gelince 3 sn sonra yeniden (üst üste binmez) */
  useEffect(() => {
    if (!suruyor) return;
    let iptal = false;
    const t = setTimeout(() => {
      void kurulumIlerletEylemi(id).then((r) => {
        if (iptal) return;
        if (r.kurulum && r.kurulum !== true) setG(r.kurulum);
        setGenel(r.genel ?? null);
      });
    }, KURULUM.aralikMs);
    return () => { iptal = true; clearTimeout(t); };
  }, [g, id, suruyor]);

  if (!g) return <SeritKap><Serit tur="hata" ikon="circle-alert">Kurulum kaydı bulunamadı.</Serit></SeritKap>;
  const simdiki = adimSirasi(g.adim);
  const yap = (eylem: (id: string) => Promise<{ kurulum?: KurulumGorunumu | true; genel?: string }>) => baslat(async () => {
    const r = await eylem(id);
    if (r.kurulum && r.kurulum !== true) setG(r.kurulum);
    setGenel(r.genel ?? null);
  });
  const bastan = async () => {
    if (!(await onayla({ baslik: "Proje kaldırılıp yeniden açılsın mı?", metin: "Supabase'te açılamayan proje silinir; kurulum proje adımından yeniden başlar. Firmanın verisi henüz yok.", tus: "Kaldır ve yeniden dene", tehlike: true }))) return;
    yap(kurulumBastanEylemi);
  };

  return (
    <Bolum id="y-b-kurulum" baslik="Kurulum">
      {genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{genel}</Serit></SeritKap>}
      {g.durum === "durdu" && (
        <SeritKap><Serit tur="hata" ikon="circle-alert">{`Kurulum durdu: ${g.hata ?? "bilinmeyen hata"}`}</Serit></SeritKap>
      )}
      {g.durum === "hata" && g.hata && <SeritKap><Serit tur="uyari" ikon="triangle-alert">{`${g.hata} (deneme ${g.deneme} / ${KURULUM.enCokDeneme})`}</Serit></SeritKap>}
      <p aria-live="polite" className={stil.etiketUst}>{g.durum === "tamam" ? "Kurulum tamamlandı." : g.durum === "durdu" ? "Kurulum durdu." : `Kuruluyor — ${ADIM_ADI[g.adim]}…`}</p>
      <ol className={stil.kurulumAdimlar} aria-label="Kurulum adımları">
        {GORUNEN.map((a) => {
          const i = adimSirasi(a);
          const durum = i < simdiki || g.durum === "tamam" ? "tamam" : i > simdiki ? "bekliyor" : g.durum === "durdu" || g.durum === "hata" ? "hata" : "suruyor";
          return (
            <li key={a} className={stil.kurulumAdim} data-durum={durum}>
              <span className={stil.kurulumIsaret} aria-hidden="true">
                {durum === "tamam" ? <Ikon ad="circle-check" /> : durum === "hata" ? <Ikon ad="circle-alert" /> : durum === "suruyor" ? <Ikon ad="clock" /> : null}
              </span>
              <span>{ADIM_ADI[a]}<span className="gizli">{` — ${{ tamam: "tamamlandı", bekliyor: "bekliyor", hata: "hata", suruyor: "sürüyor" }[durum]}`}</span></span>
            </li>
          );
        })}
      </ol>
      {g.durum === "durdu" && (
        <div className={stil.eylemSol}>
          <Tus ikon="rotate-ccw" disabled={bekliyor} onClick={() => yap(kurulumSurdurEylemi)}>Kaldığı yerden sürdür</Tus>
          {g.kod === "init_failed" && <Tus tur="ikincil" ikon="trash-2" disabled={bekliyor} onClick={() => void bastan()}>Projeyi kaldır ve yeniden dene</Tus>}
        </div>
      )}
      <p className={stil.etiketUst}>Kurulum yalnız bu sayfa açıkken ilerler.</p>
    </Bolum>
  );
}
