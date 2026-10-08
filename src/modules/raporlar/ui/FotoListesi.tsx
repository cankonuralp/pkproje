"use client";
/* SAHA RAPORU · FOTOĞRAFLAR (312; maket fotoMenu / fotolar / fotoSil; pkproje §3.8-5 "fotoğraf en az 1", O2 "Uygun değil maddenin fotoğrafı Kusur
   açıklamalarına düşer", AA9 maddede fotoğraf kural açıksa zorunlu): fotoğraf bölümünde ya da "Uygun değil" maddede liste + "Fotoğraf ekle"
   (kamera ya da galeri). Ekranda küçük resim yok: ad · Görüntüle · İndir · Sil (maket). Yüklemeden önce cihazda 1600 px JPEG'e küçültülür;
   tür, boyut, EXIF silme ve yetki sunucuda. Yazma üst ekranın işleminde (SahaRaporu: o sürerken Kaydet / Onaya gönder kapalı).
   398 (ARKA-UC §4.1 "fotoğraf çekme" çevrimdışı çalışır): bağlantı yoksa, istek ağda düşerse ya da bu raporun cihazda bekleyen işi varsa (sıra
   korunur) fotoğraf cihaz kuyruğuna şifreli yazılır, bağlantı gelince rapordan önce gider; listede kendi yerinde "Gönderilmedi" olarak görünür,
   kullanıcı kaldırabilir. Kuyruğa en çok 2 MB (küçültülmüş hâli). 405: bağlantısız açılan YENİ raporda (yeniAc) fotoğraf hep kuyruğa; önce raporun
   açılış işi yazılır. */
import { useRef, useSyncExternalStore, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { kuyrugaEkle, kuyrukAbone, kuyrukAnlik, kuyrukGonder, kuyrukSunucuAnlik, kuyruktanCikar } from "../../../components/cevrimdisi/kuyruk";
import { fotografiKucult } from "../../../components/foto/kucult";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { useOnayla } from "../../../components/pencere/Onay";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { FOTO_KUYRUK_EN_BUYUK } from "../sema";
import type { SahaRaporu } from "../server/raporlar";
import { alanId } from "./Bloklar";
import { fotoEkleEylemi, fotoSilEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const cevrimdisiMi = () => typeof navigator !== "undefined" && navigator.onLine === false;
/** dosya → base64 (kuyrukta şifreli saklanır, işlem ucuna JSON içinde gider) */
const metneCevir = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Fotoğraf okunamadı."));
  r.readAsDataURL(d);
});
/** kuyruktaki işin adından fotoğrafın adı ("Fotoğraf · <rapor no> · <ad>") */
const fotoAdi = (ad: string) => ad.split(" · ").slice(2).join(" · ") || ad;

export function FotoListesi({ v, bolumId, madde, oku, gecersiz, mesgul, baslat, yenile, yeniAc }: {
  v: SahaRaporu; bolumId: string; madde: string | null; oku: boolean; gecersiz: boolean; mesgul: boolean;
  baslat: TransitionStartFunction; yenile: () => void;
  /** 405: yeni rapor — açılış işini kuyruğa yazar (fotoğraf hep kuyruğa) */
  yeniAc?: () => Promise<void>;
}) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const girdi = useRef<HTMLInputElement>(null);
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const liste = v.fotolar.filter((f) => f.bolum === bolumId && (madde ? f.madde === madde : !f.madde));
  const yer = `${bolumId}|${madde ?? ""}`;
  const bekleyenler = kuyruk.isler.filter((x) => x.tur === "rapor.foto" && x.kayit === v.id && x.yer === yer);
  const raporBekliyor = kuyruk.isler.some((x) => x.kayit === v.id && x.durum === "bekliyor");
  const id = alanId(madde ? `${madde}.foto` : bolumId);

  const kuyruga = async (d: File) => {
    if (d.size > FOTO_KUYRUK_EN_BUYUK) { bildir("Fotoğraf bağlantısız eklenemeyecek kadar büyük (en çok 2 MB); bağlantı gelince ekleyin."); return; }
    await yeniAc?.();
    await kuyrugaEkle({ tur: "rapor.foto", kayit: v.id, surum: v.surum, girdi: { bolum: bolumId, madde, ad: d.name, veri: await metneCevir(d) },
      ad: `Fotoğraf · ${v.no} · ${d.name}`, yer });
    bildir(cevrimdisiMi() ? "Fotoğraf cihaza kaydedildi; bağlantı gelince gönderilecek." : "Fotoğraf gönderiliyor…");
  };
  const yukle = (dosya: File) => baslat(async () => {
    const kucuk = await fotografiKucult(dosya);
    if (girdi.current) girdi.current.value = "";
    if (yeniAc || cevrimdisiMi() || raporBekliyor) { await kuyruga(kucuk); return; }
    const f = new FormData();
    f.set("id", v.id); f.set("surum", String(v.surum)); f.set("bolum", bolumId); if (madde) f.set("madde", madde);
    f.set("dosya", kucuk);
    let r: Awaited<ReturnType<typeof fotoEkleEylemi>>;
    try { r = await fotoEkleEylemi(f); } catch (e) {
      if (!(e instanceof TypeError) && !cevrimdisiMi()) throw e;
      await kuyruga(kucuk);
      return;
    }
    bildir(r.tamam ? r.bildirim ?? "Fotoğraf eklendi." : r.hatalar?.foto ?? r.genel ?? "Fotoğraf eklenemedi.");
    if (r.tamam) yenile();
  });
  const sil = async (dosya: string, ad: string) => {
    if (!(await onayla({ baslik: "Fotoğrafı sil", metin: `${ad} rapordan çıkarılır.`, tus: "Sil", tehlike: true }))) return;
    baslat(async () => {
      const r = await fotoSilEylemi(v.id, v.surum, dosya);
      bildir(r.tamam ? r.bildirim ?? "Fotoğraf silindi." : r.genel ?? "Fotoğraf silinemedi.");
      if (r.tamam) yenile();
    });
  };
  /* gönderilmemiş fotoğraf: cihazdan silinir (rapora hiç gitmedi) */
  const kaldir = async (isId: string, ad: string) => {
    if (!(await onayla({ baslik: "Fotoğrafı kaldır", metin: `${ad} bu cihazdan silinir, rapora gönderilmez.`, tus: "Kaldır", tehlike: true }))) return;
    await kuyruktanCikar(isId);
    void kuyrukGonder();
    bildir(`${ad} kaldırıldı.`);
  };

  return (
    <div className={gecersiz ? `${stil.fotolar} ${stil.gecersiz}` : stil.fotolar} id={id} tabIndex={-1}>
      {liste.length + bekleyenler.length > 0 ? (
        <ul className={stil.fotoListe}>
          {liste.map((f) => (
            <li key={f.dosya}>
              <span className={stil.fotoAd}>{f.ad}</span>
              <span className={stil.fotoTuslar}>
                <DosyaAcTusu dosyaId={f.dosya}>Görüntüle</DosyaAcTusu>
                <DosyaAcTusu dosyaId={f.dosya} ikon="download" indir>İndir</DosyaAcTusu>
                {!oku && <Tus tur="ikincil" ikon="trash-2" disabled={mesgul} aria-label={`${f.ad} sil`} onClick={() => sil(f.dosya, f.ad)}>Sil</Tus>}
              </span>
            </li>
          ))}
          {bekleyenler.map((x) => (
            <li key={x.id}>
              <span className={stil.fotoAd}>{fotoAdi(x.ad)}</span>
              <Rozet tur={x.durum === "bekliyor" ? "bekliyor" : "red"}>{x.durum === "bekliyor" ? "Gönderilmedi" : "Gönderilemedi"}</Rozet>
              {!oku && (
                <span className={stil.fotoTuslar}>
                  <Tus tur="ikincil" ikon="x" aria-label={`${fotoAdi(x.ad)} kaldır`} onClick={() => void kaldir(x.id, fotoAdi(x.ad))}>Kaldır</Tus>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : <p className={stil.bosSatir}>{madde ? "Fotoğraf yok." : "Fotoğraf eklenmedi."}</p>}
      {!oku && (
        <label className={`${tusSinifi("ikincil")} ${stil.fotoEkle}`} aria-disabled={mesgul || undefined}>
          <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" disabled={mesgul}
            aria-label={madde ? "Maddeye fotoğraf ekle" : "Fotoğraf ekle"} onChange={(e) => { const d = e.target.files?.[0]; if (d) yukle(d); }} />
          Fotoğraf ekle
        </label>
      )}
    </div>
  );
}
