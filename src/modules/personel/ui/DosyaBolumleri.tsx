"use client";
/* PERSONEL KARTI › DOSYA BÖLÜMLERİ (maket personel.html: Ekipman atamaları, Zimmetindekiler + imzalı zimmet formu, Eğitimler, Maaş ve bordrolar,
   Özlük dosyası). Belge pencereleri tek üreticiden (Pencere); kaldırmak önce sorulur (useOnayla). Tuşlar yalnız "yaz" düzeyine çizilir; karar
   sunucuda (personel/server/dosyalar.ts). Belgeler yalnız PDF, tek dosya yolundan açılır (DosyaAcTusu). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, Liste } from "../../../components/liste/Liste";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { AltSatir, Bolum, DegerYok, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { EgitimKaydi } from "../../egitimler/server/egitimler";
import { OZLUK_TURLERI, ozlukTurAd } from "../sema";
import type { AtamaSatiri, BordroSatiri, OzlukSatiri, PersonelDosyasi } from "../server/dosyalar";
import { BELGE_DURUM, belgeEtkin } from "../../onaylar/sema";
import { bordroOnayaGonderEylemi, personelBelgeDegistirEylemi, personelBelgeEkleEylemi, personelBelgeKaldirEylemi } from "./eylemler";
import { bransAd, tarihYaz } from "./ortak";
import stil from "./personel.module.css";

type Ne = "ozluk" | "atama" | "bordro" | "zimmet";
const ID = {
  tur: "pdw-tur", aciklama: "pdw-aciklama", tarih: "pdw-tarih", ay: "pdw-ay", brut: "pdw-brut", net: "pdw-net", maliyet: "pdw-maliyet", dosya: "pdw-dosya",
} as const;
const BASLIK: Record<Ne, string> = { ozluk: "Özlük belgesi ekle", atama: "Ekipman ataması ekle", bordro: "Bordro yükle", zimmet: "İmzalı zimmet formu yükle" };
const DOSYA_ETIKET: Record<Ne, string> = { ozluk: "Belge (PDF)", atama: "Atama belgesi (PDF)", bordro: "Bordro (PDF)", zimmet: "İmzalı form taraması (PDF)" };
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const ayAd = (ay: string) => `${AYLAR[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;
const para = (kurus: number) => `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100)} TL`;
const zimmetAdres = (anahtar: string) => `/zimmetler/varlik/${anahtar.replace(":", "/")}`;
/** son 24 ay (bu ay dahil): bordro dönemi seçicisi */
function aylar(bugun: string): string[] {
  const l: string[] = [];
  let y = Number(bugun.slice(0, 4)), m = Number(bugun.slice(5, 7));
  for (let i = 0; i < 24; i++) { l.push(`${y}-${String(m).padStart(2, "0")}`); if (--m === 0) { m = 12; y--; } }
  return l;
}

/* ── ortak: yeni kayıt + belge penceresi ── */
function BelgePenceresi({ ne, personelId, turler, bugun, kapat }: { ne: Ne; personelId: string; turler: PersonelDosyasi["turler"]; bugun: string; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ tur: "", aciklama: "", tarih: "", ay: "", brut: "", net: "", maliyet: "" });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, v] of Object.entries(d)) f.set(k, v);
    f.set("ne", ne); f.set("personel", personelId);
    const r = await personelBelgeEkleEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as keyof typeof ID | undefined; if (k && ID[k]) requestAnimationFrame(() => document.getElementById(ID[k])?.focus()); return; }
    kapat(); bildir(r.bildirim ?? (ne === "bordro" ? "Bordro yüklendi." : ne === "atama" ? "Atama eklendi." : ne === "zimmet" ? "İmzalı zimmet formu yüklendi." : "Belge eklendi.")); router.refresh();
  });
  const metin = (k: "aciklama" | "brut" | "net" | "maliyet", etiket: string, zorunlu = true) => (
    <Alan id={ID[k]} etiket={etiket} zorunlu={zorunlu} hata={h[k]} sonuc={k === "aciklama" ? "İsteğe bağlı." : undefined}>
      <Girdi id={ID[k]} hata={!!h[k]} mesajli={k === "aciklama"} inputMode={k === "aciklama" ? undefined : "decimal"} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
    </Alan>
  );
  return (
    <Pencere acik baslik={BASLIK[ne]} onKapat={kapat} odak={`#${ne === "zimmet" ? ID.dosya : ne === "bordro" ? ID.ay : ID.tur}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="upload" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Yükle</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {ne === "zimmet" && <Serit tur="bilgi" ikon="info">Form, şu an zimmetindeki varlıklar için kaydedilir; zimmet sonradan değişirse “eskidi” görünür.</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          {ne === "ozluk" && <>
            <Alan id={ID.tur} etiket="Belge türü" zorunlu hata={h.tur}>
              <SecimAlani id={ID.tur} ad="Belge türü" deger={d.tur} ipucu="Seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(ID.tur) : undefined}
                secenekler={OZLUK_TURLERI.map(([k, a]) => [k, a] as const)} degistir={(x) => setD({ ...d, tur: x })} />
            </Alan>
            {metin("aciklama", "Açıklama", false)}
          </>}
          {ne === "atama" && <>
            <Alan id={ID.tur} etiket="Ekipman türü" zorunlu hata={h.tur}>
              <SecimAlani id={ID.tur} ad="Ekipman türü" deger={d.tur} ipucu="Tür seçin" gecersiz={!!h.tur} tanim={h.tur ? ipucuId(ID.tur) : undefined}
                secenekler={turler.map((t) => [t.id, t.ad, bransAd(t.brans)] as const)} degistir={(x) => setD({ ...d, tur: x })} />
            </Alan>
            <Alan id={ID.tarih} etiket="Atama tarihi" zorunlu hata={h.tarih}>
              <TarihAlani id={ID.tarih} ad="Atama tarihi" deger={d.tarih} degistir={(x) => setD({ ...d, tarih: x })} tanim={h.tarih ? ipucuId(ID.tarih) : undefined} />
            </Alan>
          </>}
          {ne === "bordro" && <>
            <Alan id={ID.ay} etiket="Dönem" zorunlu hata={h.ay}>
              <SecimAlani id={ID.ay} ad="Dönem" deger={d.ay} ipucu="Ay seçin" gecersiz={!!h.ay} tanim={h.ay ? ipucuId(ID.ay) : undefined}
                secenekler={aylar(bugun).map((a) => [a, ayAd(a)] as const)} degistir={(x) => setD({ ...d, ay: x })} />
            </Alan>
            {metin("brut", "Brüt (TL)")}
            {metin("net", "Net (TL)")}
            {metin("maliyet", "İşverene maliyet (TL)")}
          </>}
          <Alan id={ID.dosya} etiket={DOSYA_ETIKET[ne]} zorunlu genis hata={h.dosya}>
            <input id={ID.dosya} className={stil.dosya} name="dosya" type="file" accept="application/pdf" aria-describedby={h.dosya ? ipucuId(ID.dosya) : undefined} />
          </Alan>
        </FormIzgara>
      </form>
    </Pencere>
  );
}

/* ── satır işlemleri: belgeyi değiştir (gizli dosya seçici) + kaldır (onaylı) ── */
function SatirTuslari({ ne, id, surum, dosyaId, ad, degistir = true }: { ne: "ozluk" | "atama" | "bordro"; id: string; surum: number; dosyaId: string | null; ad: string; degistir?: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const secici = useRef<HTMLInputElement>(null);
  const yukle = (f: File) => baslat(async () => {
    const v = new FormData(); v.set("ne", ne); v.set("id", id); v.set("surum", String(surum)); v.set("dosya", f);
    const r = await personelBelgeDegistirEylemi(v);
    if (!r.tamam) { bildir(r.hatalar?.dosya ?? r.genel ?? "Kaydedilemedi."); return; }
    bildir("Belge değiştirildi."); router.refresh();
  });
  const kaldir = async () => {
    if (!(await onayla({ baslik: `${ad} kaldırılsın mı?`, metin: "Kayıt listeden kalkar; belge silinmez, saklanır.", tus: "Kaldır", tehlike: true }))) return;
    baslat(async () => {
      const r = await personelBelgeKaldirEylemi(ne, id, surum);
      if (!r.tamam) { bildir(r.genel ?? "Kaldırılamadı."); return; }
      bildir(r.bildirim ?? "Kaldırıldı."); router.refresh();
    });
  };
  return (
    <span className={stil.satirTus}>
      {dosyaId && <DosyaAcTusu dosyaId={dosyaId}>Görüntüle</DosyaAcTusu>}
      {degistir && <>
        <input ref={secici} type="file" accept="application/pdf" hidden aria-hidden="true" tabIndex={-1} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) yukle(f); }} />
        <Tus tur="ikincil" ikon="upload" disabled={bekliyor} onClick={() => secici.current?.click()} aria-label={`${ad} belgesini değiştir`}>Değiştir</Tus>
      </>}
      <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={kaldir} aria-label={`${ad} kaldır`}>Kaldır</Tus>
    </span>
  );
}

function useBelgePenceresi() {
  const [ne, setNe] = useState<Ne | null>(null);
  return { ne, ac: setNe, kapat: () => setNe(null) };
}

/* ── EKİPMAN ATAMALARI (yalnız denetçi rolündeki kişide; karar L4: atanmadığı türde plan ve rapor yalnız uyarı) ── */
export function AtamaBolumu({ personelId, etkin, dosya, bugun }: { personelId: string; etkin: boolean; dosya: PersonelDosyasi; bugun: string }) {
  const p = useBelgePenceresi();
  const l = dosya.atamalar;
  return (
    <Bolum id="b-per-atama" baslik="Ekipman atamaları" sayac={<><b>{l.length}</b> tür</>}
      tuslar={dosya.yaz && etkin && <Tus tur="ikincil" ikon="plus" onClick={() => p.ac("atama")}>Atama ekle</Tus>}>
      {l.length ? <Liste<AtamaSatiri> baslik="Ekipman atamaları" kayitlar={l} anahtar={(a) => a.id} sutunlar={[
        { k: "tur", genislik: "38%", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: (a) => <span><Kirp>{a.tur}</Kirp><AltSatir>{bransAd(a.brans)}</AltSatir></span> },
        { k: "tarih", genislik: "18%", baslik: "Atama tarihi", kart: "govde", sira: 2, hucre: (a) => <><KartEtiket>Atama tarihi</KartEtiket>{tarihYaz(a.tarih)}</> },
        { k: "eylem", genislik: "44%", baslik: "Atama belgesi", kart: "eylem", sira: 9, hucre: (a) => dosya.yaz
          ? <SatirTuslari ne="atama" id={a.id} surum={a.surum} dosyaId={a.dosyaId} ad={`${a.tur} ataması`} />
          : a.dosyaId ? <DosyaAcTusu dosyaId={a.dosyaId}>Atama belgesi</DosyaAcTusu> : <DegerYok /> },
      ]} />
        : <Serit tur="uyari" ikon="triangle-alert">Hiçbir ekipman türüne atanmamış. Plan ve rapor açılabilir; uyarı görünür.</Serit>}
      {p.ne && <BelgePenceresi ne={p.ne} personelId={personelId} turler={dosya.turler} bugun={bugun} kapat={p.kapat} />}
    </Bolum>
  );
}

/* ── ZİMMETİNDEKİLER + İMZALI ZİMMET FORMU (hareketler ve teslim Zimmetler modülünde) ── */
export function ZimmetBolumu({ personelId, dosya, bugun }: { personelId: string; dosya: PersonelDosyasi; bugun: string }) {
  const p = useBelgePenceresi();
  const z = dosya.zimmet, f = dosya.zimmetFormu;
  const ac = f?.dosyaId && <DosyaAcTusu dosyaId={f.dosyaId}>İmzalı formu aç</DosyaAcTusu>;
  return (
    <Bolum id="b-per-zimmet" baslik="Zimmetindekiler" sayac={<><b>{z.length}</b> varlık</>}
      tuslar={dosya.yaz && z.length > 0 && <Tus tur="ikincil" ikon="file-signature" onClick={() => p.ac("zimmet")}>İmzalı formu yükle</Tus>}>
      {(z.length > 0 || f) && <div className={stil.formDurum}>
        {f && f.guncel ? <Serit tur="onay" ikon="file-check">İmzalı zimmet formu: {tarihYaz(f.tarih)} · {f.kapsam} varlık.</Serit>
          : f ? <Serit tur="uyari" ikon="triangle-alert">İmzalı form ({tarihYaz(f.tarih)}) eskidi: zimmet o tarihten sonra değişti. Yeni formun imzalı taramasını yükleyin.</Serit>
            : <Serit tur="uyari" ikon="triangle-alert">İmzalı zimmet formu yok. Formun ıslak imzalı taramasını yükleyin.</Serit>}
        {ac}
      </div>}
      {z.length ? <Liste baslik="Zimmetindekiler" kayitlar={z} anahtar={(v) => v.anahtar} sutunlar={[
        { k: "varlik", genislik: "55%", baslik: "Varlık", kart: "ust", sira: 1, hucre: (v) => <span className={stil.hucreSatir}>
          <Ikon ad={v.tur === "c" ? "gauge" : v.tur === "a" ? "truck" : "package"} kucuk /><span><Link className={stil.ad} href={zimmetAdres(v.anahtar)}>{v.kod}</Link><AltSatir><Kirp>{v.ad}</Kirp></AltSatir></span></span> },
        { k: "teslim", genislik: "25%", baslik: "Teslim alındı", kart: "govde", sira: 2, hucre: (v) => <><KartEtiket>Teslim alındı</KartEtiket>{v.son ? tarihYaz(v.son.zaman) : "—"}</> },
        { k: "durum", genislik: "20%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (v) => v.bitis && v.bitis < bugun ? <Rozet tur="red">Kalibrasyonu geçti</Rozet> : <Rozet tur="tamam">Kullanımda</Rozet> },
      ]} /> : <p className={stil.bos}>Zimmetinde varlık yok.</p>}
      {p.ne && <BelgePenceresi ne={p.ne} personelId={personelId} turler={dosya.turler} bugun={bugun} kapat={p.kapat} />}
    </Bolum>
  );
}

/* ── EĞİTİMLER (kayıt ekleme ve geçmiş Eğitimler'de; tekrarı geçen ve yaklaşan üstte) ── */
const EGITIM_SIRA = { gecti: 0, yakin: 1, gecerli: 2 } as const;
const EGITIM_DURUM = { gecti: ["red", "Tekrarı geçti"], yakin: ["bekliyor", "Tekrarı yaklaşıyor"], gecerli: ["tamam", "Geçerli"] } as const;
export function EgitimBolumu({ egitimler }: { egitimler: EgitimKaydi[] }) {
  const l = [...egitimler].sort((a, b) => EGITIM_SIRA[a.durum] - EGITIM_SIRA[b.durum] || a.tekrar.localeCompare(b.tekrar));
  return (
    <Bolum id="b-per-egitim" baslik="Eğitimler" sayac={<><b>{l.length}</b> eğitim</>}>
      {l.length ? <Liste baslik="Eğitimler" kayitlar={l} anahtar={(x) => x.id} sutunlar={[
        { k: "egitim", genislik: "34%", baslik: "Eğitim", kart: "ust", sira: 1, hucre: (x) => <span><Kirp>{x.tur}</Kirp><AltSatir>{x.kurum}</AltSatir></span> },
        { k: "tarih", genislik: "16%", baslik: "Alındı", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Alındı</KartEtiket>{tarihYaz(x.tarih)}</> },
        { k: "tekrar", genislik: "16%", baslik: "Tekrar", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Tekrar</KartEtiket>{tarihYaz(x.tekrar)}</> },
        { k: "belge", genislik: "16%", baslik: "Sertifika", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Sertifika</KartEtiket>{x.dosyaId ? <DosyaAcTusu dosyaId={x.dosyaId}>Aç</DosyaAcTusu> : <AltSatir uyari>Yok</AltSatir>}</> },
        { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={EGITIM_DURUM[x.durum][0]}>{EGITIM_DURUM[x.durum][1]}</Rozet> },
      ]} /> : <p className={stil.bos}>Eğitim kaydı yok.</p>}
    </Bolum>
  );
}

/* bordroyu kişinin imzasına gönder (333; maket personel.html bordro-onaya — önce sorulur; Onaylar › Diğer belgeler'e düşer) */
function OnayaGonderTusu({ b, kisi }: { b: BordroSatiri; kisi: string }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const gonder = async () => {
    if (!(await onayla({ baslik: "Bordroyu onaya gönder", metin: <><b>{ayAd(b.ay)}</b> bordrosu {kisi} kişisinin onayına gider; e-imzayla onaylar (Onaylar › Diğer belgeler).</>, tus: "Onaya gönder" }))) return;
    baslat(async () => {
      const r = await bordroOnayaGonderEylemi(b.id);
      if (!r.tamam) { bildir(r.genel ?? "Gönderilemedi."); return; }
      bildir(`${ayAd(b.ay)} bordrosu ${kisi} onayına gönderildi.`); router.refresh();
    });
  };
  return <Tus tur="ikincil" ikon="send" disabled={bekliyor} onClick={gonder} aria-label={`${ayAd(b.ay)} bordrosunu onaya gönder`}>Onaya gönder</Tus>;
}

/* ── MAAŞ VE BORDROLAR (yalnız "yaz"; maaş satırları son bordrodan; günlük maliyet iş kârlılığına girer) ── */
export function BordroBolumu({ personelId, kisi, dosya, bugun, gunluk, isGunu }: { personelId: string; kisi: string; dosya: PersonelDosyasi; bugun: string; gunluk: number; isGunu: number }) {
  const p = useBelgePenceresi();
  const l = dosya.bordrolar ?? [], s = l[0];
  return (
    <Bolum id="b-per-maas" baslik="Maaş ve bordrolar" sayac={<><b>{l.length}</b> bordro</>}
      tuslar={<Tus tur="ikincil" ikon="upload" onClick={() => p.ac("bordro")}>Bordro yükle</Tus>}>
      {s ? <>
        <BilgiListesi>
          <Bilgi etiket="Brüt maaş">{para(s.brut)}</Bilgi>
          <Bilgi etiket="Net maaş">{para(s.net)}</Bilgi>
          <Bilgi etiket="İşverene maliyet">{para(s.maliyet)}<AltSatir>aylık · {ayAd(s.ay)} bordrosu</AltSatir></Bilgi>
          <Bilgi etiket="Günlük maliyet">{para(gunluk)}<AltSatir>{isGunu} iş günü · iş kârlılığına girer</AltSatir></Bilgi>
        </BilgiListesi>
        <Liste<BordroSatiri> baslik="Bordrolar" kayitlar={l} anahtar={(b) => b.id} sutunlar={[
          { k: "ay", genislik: "16%", baslik: "Dönem", kart: "ust", sira: 1, hucre: (b) => <span>{ayAd(b.ay)}<AltSatir>yüklendi {tarihYaz(b.yuklendi)}</AltSatir></span> },
          { k: "brut", genislik: "12%", baslik: "Brüt", kart: "govde", sira: 2, hucre: (b) => <><KartEtiket>Brüt</KartEtiket><span className={stil.sayi}>{para(b.brut)}</span></> },
          { k: "net", genislik: "12%", baslik: "Net", kart: "govde", sira: 3, hucre: (b) => <><KartEtiket>Net</KartEtiket><span className={stil.sayi}>{para(b.net)}</span></> },
          { k: "maliyet", genislik: "14%", baslik: "İşverene maliyet", kart: "govde", sira: 4, hucre: (b) => <><KartEtiket>İşverene maliyet</KartEtiket><span className={stil.sayi}>{para(b.maliyet)}</span></> },
          /* 333 (maket AA3): bordro çalışanın imzasına gönderilir; durum burada */
          { k: "onay", genislik: "14%", baslik: "Onay", kart: "rozet", sira: 1, hucre: (b) => b.onay
            ? <Rozet tur={BELGE_DURUM[b.onay.durum][1]}>{BELGE_DURUM[b.onay.durum][0]}</Rozet> : <Rozet tur="notr">Gönderilmedi</Rozet> },
          { k: "eylem", genislik: "32%", baslik: "Bordro", kart: "eylem", sira: 9, hucre: (b) => <span className={stil.satirTus}>
            <SatirTuslari ne="bordro" id={b.id} surum={b.surum} dosyaId={b.dosyaId} ad={`${ayAd(b.ay)} bordrosu`} degistir={false} />
            {b.dosyaId && !belgeEtkin(b.onay?.durum) && <OnayaGonderTusu b={b} kisi={kisi} />}
          </span> },
        ]} />
      </> : <p className={stil.bos}>Bordro yüklenmedi.</p>}
      {p.ne && <BelgePenceresi ne={p.ne} personelId={personelId} turler={dosya.turler} bugun={bugun} kapat={p.kapat} />}
    </Bolum>
  );
}

/* ── ÖZLÜK DOSYASI (yalnız "yaz"; KVKK: özlük bilgisi) ── */
export function OzlukBolumu({ personelId, dosya, bugun }: { personelId: string; dosya: PersonelDosyasi; bugun: string }) {
  const p = useBelgePenceresi();
  const l = dosya.ozluk ?? [];
  return (
    <Bolum id="b-per-ozluk" baslik="Özlük dosyası" sayac={<><b>{l.length}</b> belge</>}
      tuslar={<Tus tur="ikincil" ikon="plus" onClick={() => p.ac("ozluk")}>Belge ekle</Tus>}>
      {l.length ? <Liste<OzlukSatiri> baslik="Özlük dosyası" kayitlar={l} anahtar={(b) => b.id} sutunlar={[
        { k: "belge", genislik: "44%", baslik: "Belge", kart: "ust", sira: 1, hucre: (b) => <span><Kirp>{ozlukTurAd(b.tur)}</Kirp>{b.aciklama && <AltSatir><Kirp>{b.aciklama}</Kirp></AltSatir>}</span> },
        { k: "tarih", genislik: "16%", baslik: "Eklendi", kart: "govde", sira: 2, hucre: (b) => <><KartEtiket>Eklendi</KartEtiket>{tarihYaz(b.tarih)}</> },
        { k: "eylem", genislik: "40%", baslik: "Belge", kart: "eylem", sira: 9, hucre: (b) => <SatirTuslari ne="ozluk" id={b.id} surum={b.surum} dosyaId={b.dosyaId} ad={ozlukTurAd(b.tur)} /> },
      ]} /> : <p className={stil.bos}>Özlük dosyasında belge yok.</p>}
      {p.ne && <BelgePenceresi ne={p.ne} personelId={personelId} turler={dosya.turler} bugun={bugun} kapat={p.kapat} />}
    </Bolum>
  );
}
