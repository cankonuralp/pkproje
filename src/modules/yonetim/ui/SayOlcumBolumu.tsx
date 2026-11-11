"use client";
/* 2026-11-05 (göç 0121 — S.A.Y kendi işinden öğrenme): işin puanı ve nedeni, son 7 günün özeti, firmanın hafızası (S.A.Y'a konuşmanın başında giden not).
   YÖNETİM › FİRMA › S.A.Y İŞLERİ (2026-10-31; reisim: "İş ölçümü: her iş için istek sayısı, en büyük istem, süre ve maliyet kaydedilir"; Ar-Ge dökümü:
   "30 gün saklansın (b)" — göç 0112, sunum L8). Son 30 günün işleri (en yeni 50): başlangıç, kişi, şablon, istek, en büyük istem, süre, harcama, yazma
   adımı; Ar-Ge kayıtları ("Sohbeti temizle"den önceki metin; ekler yok) — İndir. Salt okunur. */
import { useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { baytIndir } from "../../../components/disa/indir";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { DegerYok, Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import type { SayIsOlcumu, SayIsSinyali, SayOlcumu } from "../server/firma-tarafi";
import { argeKaydiEylemi } from "./eylemler";
import { Cerceve } from "./ortak";
import stil from "./yonetim.module.css";

const zaman = (s: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(s));
const dolar = (m: number) => `$${(m / 1e6).toFixed(3).replace(".", ",")}`;
const sure = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} sn` : `${Math.floor(ms / 60_000)} dk ${Math.round((ms % 60_000) / 1000)} sn`);
const bin = (n: number) => `${Math.round(n / 1000).toLocaleString("tr-TR")} bin`;
function govde(baslik: string, d: (x: SayIsOlcumu) => string) {
  return function Hucre(x: SayIsOlcumu) { return <><KartEtiket>{baslik}</KartEtiket>{d(x)}</>; };
}
const PUAN = { iyi: { ad: "İyi", tur: "tamam" }, kotu: { ad: "Kötü", tur: "red" }, supheli: { ad: "Şüpheli", tur: "bekliyor" } } as const;
/** puanın nedeni (gecenin sinyalleri) */
export function nedenMetni(s: SayIsSinyali | null): string {
  if (!s) return "";
  const l: string[] = [];
  if (s.geri) l.push(`onaydan geri geldi (${s.geri})`);
  if (s.elle) l.push(`elle düzeltildi: ${s.elle_yer.length ? s.elle_yer.join(", ") : s.elle}`);
  if (s.olumsuz) l.push("sonraki istek düzeltme");
  if (s.hata) l.push(`işlem hatası (${s.hata})`);
  if (!l.length && s.rapor) l.push(`${s.onay} / ${s.rapor} rapor onaylandı`);
  return l.join(" · ");
}
const SUTUNLAR: Sutun<SayIsOlcumu>[] = [
  { k: "bas", genislik: "14%", baslik: "Başlangıç", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => zaman(x.bas) },
  { k: "kisi", genislik: "18%", baslik: "Kişi", kart: "govde", sira: 2, siralanmaz: true, hucre: govde("Kişi", (x) => x.kisi) },
  { k: "sablon", genislik: "9%", baslik: "Şablon", kart: "govde", sira: 3, siralanmaz: true, hucre: (x) => (x.sablon ? <><KartEtiket>Şablon</KartEtiket>{x.sablon}</> : <DegerYok>serbest</DegerYok>) },
  { k: "istek", genislik: "9%", baslik: "İstek", kart: "govde", sira: 4, siralanmaz: true, hucre: govde("İstek", (x) => String(x.istek)) },
  { k: "buyuk", genislik: "14%", baslik: "En büyük istem", kart: "govde", sira: 5, siralanmaz: true, hucre: govde("En büyük istem", (x) => `${bin(x.en_buyuk)} token`) },
  { k: "sure", genislik: "12%", baslik: "Süre", kart: "govde", sira: 6, siralanmaz: true, hucre: govde("Süre", (x) => sure(x.sure_ms)) },
  { k: "usd", genislik: "12%", baslik: "Harcama", kart: "govde", sira: 7, siralanmaz: true, hucre: govde("Harcama", (x) => dolar(x.maliyet)) },
  { k: "yazma", genislik: "12%", baslik: "Yazma adımı", kart: "govde", sira: 8, siralanmaz: true, hucre: govde("Yazma adımı", (x) => String(x.yazma)) },
  { k: "puan", genislik: "16%", baslik: "Puan", kart: "govde", sira: 9, siralanmaz: true, hucre: (x) => (x.puan
    ? <><KartEtiket>Puan</KartEtiket><Rozet tur={PUAN[x.puan].tur}>{PUAN[x.puan].ad}</Rozet> {nedenMetni(x.sinyal)}</>
    : <><KartEtiket>Puan</KartEtiket><DegerYok>bekliyor</DegerYok></>) },
];

export function SayOlcumBolumu({ id, firmaKod, olcum, ciplak = false }: { id: string; firmaKod: string; olcum: SayOlcumu | null; ciplak?: boolean }) {
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const indir = (kayit: string, z: string) => baslat(async () => {
    const r = await argeKaydiEylemi(id, kayit);
    if (!r.metin) { bildir(r.genel ?? "Kayıt indirilemedi."); return; }
    baytIndir(`say-arge-${firmaKod}-${z.slice(0, 10)}-${kayit.slice(0, 8)}.json`, new TextEncoder().encode(r.metin), "application/json");
  });
  return (
    <Cerceve ciplak={ciplak} id="y-b-say" baslik="S.A.Y işleri ve öğrenme (son 30 gün)">
      {!olcum ? <p>Ölçüm okunamadı; sayfayı yenileyip yeniden deneyin.</p> : (
        <>
          {olcum.isler.length ? <Liste baslik="S.A.Y işleri" sutunlar={SUTUNLAR} kayitlar={olcum.isler} anahtar={(x) => x.is} /> : <p><DegerYok>Bu dönemde iş yok.</DegerYok></p>}
          <h3>Son 7 gün</h3>
          {olcum.ozet && olcum.ozet.is ? (
            <p>{olcum.ozet.is} iş · {olcum.ozet.iyi} iyi · {olcum.ozet.kotu} kötü · {olcum.ozet.supheli} şüpheli · iş başına ortalama {dolar(olcum.ozet.maliyet)}</p>
          ) : <p><DegerYok>Puanlanmış iş yok.</DegerYok></p>}
          <h3>S.A.Y hafızası{olcum.hafiza ? ` (${olcum.hafiza.ornek} örnek · ${zaman(olcum.hafiza.guncel)})` : ""}</h3>
          {olcum.hafiza?.metin ? <pre className={stil.hafizaMetni}>{olcum.hafiza.metin}</pre> : <p><DegerYok>Henüz yok.</DegerYok></p>}
          <h3>Ar-Ge kayıtları ({olcum.arge.length})</h3>
          {olcum.arge.length ? (
            <ul>
              {olcum.arge.map((a) => (
                <li key={a.id}>{zaman(a.zaman)} · {a.kisi} · {a.ileti} ileti{" "}
                  <Tus tur="ikincil" ikon="download" disabled={bekliyor} onClick={() => indir(a.id, a.zaman)}>İndir</Tus>
                </li>
              ))}
            </ul>
          ) : <p><DegerYok>Kayıt yok.</DegerYok></p>}
        </>
      )}
    </Cerceve>
  );
}
