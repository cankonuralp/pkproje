"use client";
/* YÖNETİM › FİRMA › PROBATA SIGN (2026-11-05, göç 0122; tasarım 59EF1ZZAJZdg6BztvuiWbr — Yönetim ekranı). Webhook adresi kopyalanır (sign › Geliştirici ›
   Webhook'a girilir), sign'ın verdiği API anahtarı ve webhook sırrı girilir; "Bağlantıyı dene" anahtarı sign'a sorar, "Kaydet ve etkinleştir" ikisini
   şifreli yazar (önce yine dener). Etkinken yalnız son 4 hane; "Anahtarı değiştir" formu yeniden açar, "Kaldır" firmayı bugünkü yola döndürür. */
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi } from "../../../components/form/Form";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Bolum, Rozet, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { SignBaglantisi } from "../server/sign";
import { signDeneEylemi, signKaldirEylemi, signKaydetEylemi } from "./eylemler";
import stil from "./yonetim.module.css";

const ANAHTAR = "y-sign-anahtar", SIR = "y-sign-sir";
const TR = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zaman = (s: string | null) => (s ? TR.format(new Date(s)).replace(",", "") : "—");

export function SignBolumu({ id, s }: { id: string; s: SignBaglantisi | null }) {
  const [duzenle, setDuzenle] = useState(!s?.etkin);
  const [anahtar, setAnahtar] = useState("");
  const [sir, setSir] = useState("");
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [kopya, setKopya] = useState<"tamam" | "hata" | null>(null);
  const [bekliyor, baslat] = useTransition();
  const bildir = useBildir();
  const onayla = useOnayla();
  const form = () => { const f = new FormData(); f.set("anahtar", anahtar); f.set("sir", sir); return f; };
  const hataGoster = (h: Record<string, string>) => { setHatalar(h); requestAnimationFrame(() => document.getElementById(h.anahtar ? ANAHTAR : SIR)?.focus()); };
  const dene = () => baslat(async () => {
    const r = await signDeneEylemi(id, form());
    if (r.hatalar) { hataGoster(r.hatalar); return; }
    if (!r.tamam) { setGenel(r.genel ?? "Denenemedi."); return; }
    setHatalar({}); setGenel(null); bildir("sign anahtarı kabul etti.");
  });
  const kaydet = () => baslat(async () => {
    const r = await signKaydetEylemi(id, form());
    if (r.hatalar) { hataGoster(r.hatalar); return; }
    if (!r.tamam) { setGenel(r.genel ?? "Kaydedilemedi."); return; }
    setHatalar({}); setGenel(null); setAnahtar(""); setSir(""); setDuzenle(false);
    bildir("probata sign etkin: bu firmanın raporları sign ile imzalanır.");
  });
  const kaldir = () => baslat(async () => {
    if (!(await onayla({ baslik: "probata sign bağlantısı kaldırılsın mı?", metin: "Anahtar ve webhook sırrı silinir; firma raporları PDF indirip yükleyerek imzalar.", tus: "Kaldır", tehlike: true }))) return;
    const r = await signKaldirEylemi(id);
    if (!r.tamam) { setGenel(r.genel ?? "Kaldırılamadı."); return; }
    setGenel(null); setDuzenle(true); bildir("probata sign bağlantısı kaldırıldı.");
  });

  if (!s) return <Bolum id="y-b-sign" baslik="probata sign"><p>Bağlantı okunamadı; sayfayı yenileyip yeniden deneyin.</p></Bolum>;
  return (
    <Bolum id="y-b-sign" baslik="probata sign">
      {genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{genel}</Serit></SeritKap>}
      <BilgiListesi>
        <Bilgi etiket="Durum">{s.etkin ? <Rozet tur="tamam">Etkin · e-imza</Rozet> : <Rozet tur="notr">Bağlı değil</Rozet>}</Bilgi>
        <Bilgi etiket="Webhook adresi (sign'a girilir)">
          <span className={stil.dnsDeger}>{s.webhook}</span>
          <AltSatir>olaylar: imza.atildi · imza.reddedildi · belge.tamamlandi · istek.iptal</AltSatir>
        </Bilgi>
        {s.etkin && <Bilgi etiket="API anahtarı">••••{s.anahtar}</Bilgi>}
        {s.etkin && <Bilgi etiket="Webhook sırrı">••••{s.sir}</Bilgi>}
        {s.etkin && <Bilgi etiket="Son değişiklik · son bildirim">{zaman(s.degisti)} · {zaman(s.sonBildirim)}</Bilgi>}
      </BilgiListesi>
      <div className={stil.eylemSol}>
        <Tus tur="ikincil" ikon={kopya === "tamam" ? "check" : "copy"} onClick={() => navigator.clipboard.writeText(s.webhook).then(() => setKopya("tamam"), () => setKopya("hata"))}>
          {kopya === "tamam" ? "Kopyalandı" : kopya === "hata" ? "Elle kopyalayın" : "Webhook adresini kopyala"}
        </Tus>
        {s.etkin && !duzenle && <>
          <Tus tur="ikincil" ikon="pencil" disabled={bekliyor} onClick={() => { setDuzenle(true); requestAnimationFrame(() => document.getElementById(ANAHTAR)?.focus()); }}>Anahtarı değiştir</Tus>
          <Tus tur="tehlike" ikon="trash-2" disabled={bekliyor} onClick={kaldir}>Kaldır</Tus>
        </>}
      </div>
      {duzenle && (
        <>
          <Alan id={ANAHTAR} etiket="API anahtarı" hata={hatalar.anahtar}>
            <Girdi id={ANAHTAR} value={anahtar} maxLength={220} spellCheck={false} placeholder="psk_…" hata={!!hatalar.anahtar} mesajli={!!hatalar.anahtar}
              onChange={(e) => { setAnahtar(e.target.value); setHatalar({}); }} />
          </Alan>
          <Alan id={SIR} etiket="Webhook sırrı" hata={hatalar.sir} sonuc={hatalar.sir ? undefined : "sign webhook eklerken bir kez gösterir"}>
            <Girdi id={SIR} value={sir} maxLength={200} spellCheck={false} hata={!!hatalar.sir} mesajli onChange={(e) => { setSir(e.target.value); setHatalar({}); }} />
          </Alan>
          <div className={stil.eylemSol}>
            <Tus tur="ikincil" ikon="check" disabled={bekliyor || !anahtar.trim()} onClick={dene}>Bağlantıyı dene</Tus>
            <Tus ikon="check" disabled={bekliyor || !anahtar.trim() || !sir.trim()} aria-busy={bekliyor || undefined} onClick={kaydet}>Kaydet ve etkinleştir</Tus>
            {s.etkin && <Tus tur="ikincil" disabled={bekliyor} onClick={() => { setDuzenle(false); setAnahtar(""); setSir(""); setHatalar({}); }}>Vazgeç</Tus>}
          </div>
        </>
      )}
    </Bolum>
  );
}
