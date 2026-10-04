/* STANDART SAYFASI (maket standartlar.html #/s/<id>): başlık (no:sürüm, durum) + Oku · Yeni sürüm yükle · Kaldır · önceki sürüm şeridi · yüzler
   (dosya, yükleyen) · kullanan ekipman türleri (numarayla bağlı; Ekipman türleri'nden) · sürümler (her biri açılır) · raporda kontrol metodu. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../../components/bilgi/Bilgi";
import { DosyaAcTusu } from "../../../../../components/gizli-resim/GizliResim";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Bolum, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../../components/serit/Serit";
import { modulBul } from "../../../../../modules/moduller";
import { dokumanDegistirir, standartKarti } from "../../../../../modules/dokumanlar/server/dokumanlar";
import { standardiKullananTurler } from "../../../../../modules/ekipman-turleri/server/turler";
import { StandartTuslari } from "../../../../../modules/dokumanlar/ui/Listeler";
import { boyutYaz, tarihYaz } from "../../../../../modules/dokumanlar/ui/ortak";
import stil from "../../../../../modules/dokumanlar/ui/dokumanlar.module.css";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: "Standart" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [s, turler] = await oturumIslemi(o, async (db) => {
    const k = await standartKarti(db, o, id);
    return [k, k ? await standardiKullananTurler(db, k.no) : []] as const;
  });
  if (!s) notFound();
  const guncel = s.surumler.find((x) => x.guncel);
  const ad = `${s.no}:${s.surumAdi}`;
  return (
    <>
      <Kirinti ogeler={[["Standartlar", "/dokumanlar"], [ad]]} />
      <NesneBasi baslik={ad} rozet={s.guncel ? <Rozet tur="tamam">Güncel</Rozet> : <Rozet tur="notr">Önceki sürüm</Rozet>} altIkon="book-open" alt={s.konu}
        tuslar={<StandartTuslari s={s} yaz={dokumanDegistirir(o)} guncelListe={s.surumler} />} />
      {!s.guncel && <SeritKap><Serit tur="bilgi" ikon="history">Önceki sürüm: {tarihYaz(s.bitti)} tarihinde {guncel
        ? <>yerine <Link href={`/dokumanlar/standart/${guncel.id}`}>{guncel.no}:{guncel.surumAdi}</Link> geçti</> : "yerine yenisi geçti"}. O tarihe kadar yazılan raporlar bu sürümü gösterir; dosya saklanır.</Serit></SeritKap>}
      <Yuzler>
        <Yuz ikon="file-text" ad="Dosya" sayi={boyutYaz(s.boyut)} not="PDF" />
        <Yuz ikon="user" ad="Yükleyen" sayi={s.yukleyen} not={tarihYaz(s.tarih)} />
        <Yuz ikon="history" ad="Sürüm" sayi={s.surumler.length} />
        <Yuz ikon="layers" ad="Kullanan tür" sayi={turler.length} not={turler.length ? "kontrol metodu" : "atanmadı"} uyari={s.guncel && !turler.length} />
      </Yuzler>
      <Bolum id="b-std-tur" baslik="Kullanan ekipman türleri" sayac={<><b>{turler.length}</b> tür</>}>
        {turler.length ? <ul className={stil.surumler}>{turler.map((t) => <li key={t.id}><Link href={`/ekipman-turleri/${t.id}`}>{t.ad}</Link></li>)}</ul>
          : <p className={stil.not}>Bu standart henüz hiçbir türde kontrol metodu değil. Atama tür sayfasından yapılır (Ekipman türleri).</p>}
      </Bolum>
      <Bolum id="b-std-surum" baslik="Sürümler" sayac={<><b>{s.surumler.length}</b> sürüm</>}>
        <ol className={stil.surumler}>{s.surumler.map((x) => (
          <li key={x.id}>
            <span className={stil.surumNe}>
              <b>{x.id === s.id ? `${x.no}:${x.surumAdi}` : <Link href={`/dokumanlar/standart/${x.id}`}>{x.no}:{x.surumAdi}</Link>} {x.guncel ? <Rozet tur="tamam">Güncel</Rozet> : <Rozet tur="notr">Önceki</Rozet>}</b>
              <span className={stil.not}>{tarihYaz(x.tarih)} · {boyutYaz(x.boyut)} · yükleyen {x.yukleyen}{x.bitti ? ` · ${tarihYaz(x.bitti)} tarihine kadar` : ""}</span>
            </span>
            <DosyaAcTusu dosyaId={x.dosyaId}>Aç</DosyaAcTusu>
          </li>
        ))}</ol>
      </Bolum>
      <Bolum id="b-std-rapor" baslik="Raporda">
        <BilgiListesi><Bilgi etiket="Kontrol metodu" genis>{guncel ? `${guncel.no}:${guncel.surumAdi} · ${guncel.konu}` : "Güncel sürüm yok"}</Bilgi></BilgiListesi>
      </Bolum>
    </>
  );
}
