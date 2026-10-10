/* RAPOR ŞABLONU SÜRÜMÜ (RAPOR-FORMAT.md §5–6). 471 (reisim 2026-10-10, maket kararı k5 "evet" — sürüm sayfasında önceki sürüme göre değişenler):
   sayfa formatın KİMLİĞİNİ söyler, teknik listeler kalktı. Başlık + durum (Taslak / Yayında / Eski) · tek Düzenle (taslakta Format kurucu +
   Yayınla; yayındaki sürümde o sürümden taslak — 439; yalnız "değiştirir") · yüzler: yayınlanma (kim, ne zaman), bu sürümle yazılan rapor,
   doküman kodu, bölüm · madde · sürüm notu · taslakta yayın denetimi (uyarılar) · ÖNCEKİ SÜRÜME GÖRE DEĞİŞENLER (rapor-format/fark.ts; taslak
   yayındaki sürümle, sürüm N bir öncekiyle) · önizleme: Belge (PDF'le aynı çizici) ↔ Saha ekranı (örnek raporla, tablet / telefon) · kurallar ·
   öteki sürümler. Görmeyen, başka firmanın ya da başka türün sürümü: bulunamadı. Karar sunucuda. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../../../../belge/belge.css";
import { raporBelgesi } from "../../../../../../belge/belge";
import { Bilgi, BilgiListesi, Kosullar, Yuz, Yuzler } from "../../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../../components/hata/Hata";
import { Ikon } from "../../../../../../components/ikon/Ikon";
import { Bolum, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../../../../components/tus/Tus";
import { Serit } from "../../../../../../components/serit/Serit";
import { kurucuyaHazirla } from "../../../../../../format/duzen";
import { bransAd } from "../../../../../../modules/ekipman-turleri/sema";
import { turKarti } from "../../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../../modules/moduller";
import { surumFarki } from "../../../../../../modules/rapor-format/fark";
import { formatAyrintisi, formatDegistirir, formatSurumleri } from "../../../../../../modules/rapor-format/server/formatlar";
import { kurucuOrnegi } from "../../../../../../modules/rapor-format/ui/kurucuOrnegi";
import { DURUM_ROZET, surumAdi, tarihYaz } from "../../../../../../modules/rapor-format/ui/ortak";
import { SablonTablosu, SurumDuzenleTusu, YayinlaTusu } from "../../../../../../modules/rapor-format/ui/SablonBolumu";
import { SurumOnizleme } from "../../../../../../modules/rapor-format/ui/SurumOnizleme";
import stil from "../../../../../../modules/rapor-format/ui/format.module.css";
import { formatRaporSayilari } from "../../../../../../modules/raporlar/server/format-baglanti";
import { modulOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Rapor şablonu" };
const evet = (b: boolean) => (b ? "Evet" : "Hayır");
const FARK_IKON = { ekle: "plus", cikar: "x", degis: "pencil" } as const;
const FARK_SINIF = { ekle: stil.farkEkle, cikar: stil.farkCikar, degis: stil.farkDegis } as const;

export default async function Sayfa({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id, sid } = await params;
  const v = await oturumIslemi(o, async (db) => {
    const f = await formatAyrintisi(db, o, sid);
    const tur = f && f.turId === id ? await turKarti(db, o, id) : null;
    if (!f || !tur) return null;
    const surumler = (await formatSurumleri(db, o, id)) ?? [];
    /* önceki sürüm: taslak yayındaki sürümle (yoksa son yayınlananla), sürüm N kendinden önceki en yakın sürümle karşılaştırılır */
    const yayinlanan = surumler.filter((x) => x.sira !== null).sort((x, y) => (y.sira ?? 0) - (x.sira ?? 0));
    const onceki = f.sira === null ? yayinlanan.find((x) => x.durum === "yayinda") ?? yayinlanan[0] ?? null : yayinlanan.find((x) => (x.sira ?? 0) < (f.sira ?? 0)) ?? null;
    const oncekiTanim = onceki ? (await formatAyrintisi(db, o, onceki.id))?.tanim ?? null : null;
    const raporlar = await formatRaporSayilari(db, surumler.map((x) => x.id));
    return { f, tur, surumler, onceki, oncekiTanim, raporlar };
  });
  if (!v) notFound();
  const { f, tur, surumler, onceki, oncekiTanim, raporlar } = v;
  const degistirir = formatDegistirir(o), yaz = degistirir && f.durum === "taslak";
  const taslak = surumler.find((x) => x.durum === "taslak") ?? null;
  /* taslak kurucudaki gibi hazırlanır (ekipman bölümü, ölçüm cihazları bölümü) — önizleme kurucuyla aynı görünsün */
  const t = f.tanim && f.durum === "taslak" ? kurucuyaHazirla(f.tanim) : f.tanim;
  const madde = t ? t.bolumler.reduce((n, b) => n + (b.blok === "liste" ? b.gruplar.reduce((k, g) => k + g.maddeler.length, 0) : 0), 0) : 0;
  const fark = t && oncekiTanim ? surumFarki(oncekiTanim, t) : null;
  const [rozetTur, rozetAd] = DURUM_ROZET[f.durum];
  const turBilgi = { ad: tur.ad, kod: tur.kod, std: tur.standartlar.map((s) => s.no), cihaz: tur.cihazTurleri.map((c) => c.ad) };
  const oteki = surumler.filter((x) => x.id !== f.id);
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(tur.brans)}`, tur.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"],
        [tur.ad, `/ekipman-turleri/${tur.id}`], [`Rapor şablonu · ${surumAdi(f)}`]]} />
      <NesneBasi baslik={`Rapor şablonu · ${surumAdi(f)}`} rozet={<Rozet tur={rozetTur}>{rozetAd}</Rozet>} altIkon="layout-list"
        alt={`${tur.ad} · ${f.kaynakAd ?? "Firma formatı"}`} tuslar={yaz ? <>
          <TusBaglanti ikon="pencil" href={`/ekipman-turleri/${tur.id}/sablon/${f.id}/kurucu`}>Düzenle</TusBaglanti>
          <YayinlaTusu format={{ id: f.id, surum: f.surum }} />
        </> : degistirir && f.durum === "yayinda" ? <SurumDuzenleTusu turId={tur.id} surum={f} taslak={taslak} /> : null} />
      <Yuzler>
        <Yuz ikon="calendar" ad={f.yayin ? "Yayınlandı" : "Son değişiklik"} sayi={tarihYaz(f.yayin ?? f.degisti)} not={f.yayinlayan ?? f.olusturan} />
        <Yuz ikon="file-text" ad="Bu sürümle yazılan rapor" sayi={raporlar[f.id] ?? 0} not={f.durum === "taslak" ? "taslakla rapor açılmaz" : undefined} />
        <Yuz ikon="file-check" ad="Doküman kodu" sayi={t?.gorunum.formKodu || "Yok"} />
        <Yuz ikon="list-checks" ad="Bölüm · madde" sayi={`${t?.bolumler.length ?? f.bolum} · ${madde}`} />
      </Yuzler>
      {(!t || f.notu) && (
        <SeritKap>
          {!t && <Serit tur="hata" ikon="circle-x">Bu sürümün tanımı okunamadı.</Serit>}
          {f.notu && <Serit tur="bilgi" ikon="message-square">Sürüm notu: {f.notu}</Serit>}
        </SeritKap>
      )}
      {f.denetim && f.denetim.uyarilar.length > 0 && (
        <Bolum id="b-denetim" baslik="Yayından önce bakılacak">
          <Kosullar ogeler={f.denetim.uyarilar.map((m) => ({ tur: "eksik" as const, metin: m }))} />
        </Bolum>
      )}
      {t && <>
        <Bolum id="b-fark" baslik={onceki ? `${surumAdi(onceki)} ile karşılaştırma — değişenler` : "Değişenler"}
          sayac={fark && fark.length > 0 ? <span className={stil.ogeAlt}><b>{fark.length}</b> değişiklik</span> : undefined}>
          {!onceki ? <p className={stil.bosMetin}>İlk sürüm — karşılaştırılacak önceki sürüm yok.</p>
            : !fark ? <p className={stil.bosMetin}>{surumAdi(onceki)} okunamadı.</p>
            : !fark.length ? <p className={stil.bosMetin}>{surumAdi(onceki)} ile aynı.</p>
            : <ul className={stil.farkListe}>{fark.map((x, i) => <li key={i} className={FARK_SINIF[x.tur]}><Ikon ad={FARK_IKON[x.tur]} kucuk /><span>{x.metin}</span></li>)}</ul>}
        </Bolum>
        <Bolum id="b-onizleme" baslik="Önizleme">
          <SurumOnizleme turId={tur.id} formatId={f.id} t={t} belge={raporBelgesi(kurucuOrnegi(t, turBilgi))} />
        </Bolum>
        <Bolum id="b-kurallar" baslik="Kurallar">
          <BilgiListesi>
            <Bilgi etiket="“Uygun değil” maddede fotoğraf zorunlu">{evet(t.kurallar.foto)}</Bilgi>
            <Bilgi etiket="Kusur derecesi sorulur">{evet(t.kurallar.derece)}</Bilgi>
            <Bilgi etiket="Sonuç önerisi">{t.kurallar.oneri ? "Açık" : "Kapalı"}</Bilgi>
            <Bilgi etiket="Madde cevabı (saha ekranı)">{t.gorunum.cevap === "tus" ? "Yan yana tuşlar" : "Açılır liste"}</Bilgi>
          </BilgiListesi>
        </Bolum>
      </>}
      {oteki.length > 0 && (
        <Bolum id="b-surumler" baslik="Öteki sürümler" sayac={<span className={stil.ogeAlt}><b>{oteki.length}</b> sürüm</span>}>
          <SablonTablosu turId={tur.id} surumler={oteki} yaz={degistirir} raporlar={raporlar} />
        </Bolum>
      )}
    </>
  );
}
