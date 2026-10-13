"use client";
/* S.A.Y CHAT AYARLARI (523; maket maket-turler.js ekran 12 — pkproje §3.10 m.13–16). 529 (reisim 2026-10-13: "say chat ayarları burda kötü durmuş
   görüpte anlamadım bile … diğer tuşların yanına koy tuşa basınca ilgili sayfaya gitsin ve düzenleme yapalım"): KENDİ SAYFASINDA
   (/ekipman-turleri/<tür>/say-chat — Format kurucunun tuşlarından ve tür sayfasındaki bölümün tuşundan); eskiden tür sayfasında açılır bölümdü.
   Solda iki bölüm kartı (form sayfası, kalıp 20 b): mesaj satırları (sıra · telefonda yazan ad · rapordaki alan · hazır değer · yukarı / aşağı · sil ·
   "Satır ekle") ve okunacak fotoğraf başlıkları (aç / kapa · sil · "Başlık ekle"); sağda "Telefonda böyle görünür"; altta Vazgeç / Kaydet (FormEylem —
   telefonda yapışkan; değişiklik yoksa kapalı). Denetim ekranda (ilk hatalı alana odak) ve sunucuda aynı işlevle (sema.ts tanimDenetle). Yazamayan
   yalnız görür. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, Girdi } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { SayChatAyari } from "../server/ayar";
import { AD_EN_COK, HAZIR_EN_COK, SATIR_EN_COK, secenekleDenetle, type ChatTanimi, type TanimHatasi } from "../sema";
import { chatAyarKaydetEylemi } from "./eylemler";
import stil from "./say-chat.module.css";

const kopya = (t: ChatTanimi): ChatTanimi => ({ satirlar: t.satirlar.map((s) => ({ ...s })), okunacak: t.okunacak.map((o) => ({ ...o })) });
const odakla = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
/** "Başlık ekle" seçiminin kimliği (etiket ve seçim aynı kimlikle bağlanır; silinen başlıktan sonra odak buraya) */
const OK_EKLE = "sca-ok-ekle";

export function ChatAyarlari({ ayar }: { ayar: SayChatAyari }) {
  const router = useRouter();
  const bildir = useBildir();
  const [taslak, setTaslak] = useState<ChatTanimi | null>(null);
  const [hata, setHata] = useState<TanimHatasi | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const a = taslak ?? ayar.tanim, yaz = ayar.yaz;
  const basAd = new Map(ayar.basliklar.map((b) => [b[0], b]));
  const ok = a.okunacak.filter((o) => basAd.has(o.k)), acikSay = ok.filter((o) => o.acik).length;
  const kalan = ayar.basliklar.filter((b) => !a.okunacak.some((o) => o.k === b[0]));
  const degistir = (f: (t: ChatTanimi) => void) => { const t = kopya(a); f(t); setTaslak(t); setHata(null); setGenel(null); };

  const ekle = () => {
    if (a.satirlar.length >= SATIR_EN_COK) { bildir(`En çok ${SATIR_EN_COK} mesaj satırı olur.`); return; }
    degistir((t) => t.satirlar.push({ ad: "", alan: "", hazir: "" }));
    odakla(`sca-ad-${a.satirlar.length}`);
  };
  const sil = (i: number) => {
    const ad = a.satirlar[i].ad || `${i + 1}. satır`;
    degistir((t) => t.satirlar.splice(i, 1));
    odakla(a.satirlar.length > 1 ? `sca-ad-${Math.min(i, a.satirlar.length - 2)}` : "sca-ekle");
    bildir(`${ad} silindi; Kaydet ile geçerli olur.`);
  };
  const tasi = (i: number, y: -1 | 1) => {
    const j = i + y;
    degistir((t) => { const x = t.satirlar[i]; t.satirlar[i] = t.satirlar[j]; t.satirlar[j] = x; });
    odakla(`sca-${y < 0 ? "yukari" : "asagi"}-${j}`);
  };
  const vazgec = () => { setTaslak(null); setHata(null); setGenel(null); bildir("Değişiklikler bırakıldı."); odakla("sca-durum"); };
  const kaydet = async () => {
    if (!taslak || bekliyor) return;
    /* ön denetim sunucunun verdiği seçeneklerle (aynı işlev); karar sunucuda yeniden */
    const d = secenekleDenetle(ayar.alanlar.map(([k]) => k), ayar.basliklar.map(([k]) => k), taslak);
    if (d.durum === "hata") { goster(d.hata); return; }
    setBekliyor(true);
    try {
      const r = await chatAyarKaydetEylemi(ayar.turId, ayar.kayitli?.surum ?? null, taslak);
      if (r.durum === "hata") { goster(r.hata); return; }
      if (r.durum === "red") { setGenel(r.neden); bildir(r.neden); return; }
      setTaslak(null);
      bildir(r.ayni ? "Değişiklik yoktu." : `S.A.Y Chat ayarları kaydedildi (sürüm ${r.surum + 1}); yeni kayıtlarda geçerli.`);
      router.refresh();
      odakla("sca-durum");
    } catch { setGenel("Kaydedilemedi; bağlantıyı kontrol edip yeniden deneyin."); } finally { setBekliyor(false); }
  };
  const goster = (h: TanimHatasi) => {
    setHata(h); bildir(h.neden);
    if (h.i >= 0) odakla(h.ne === "alan" ? `sca-alan-${h.i}` : h.ne === "hazir" ? `sca-hz-${h.i}` : `sca-ad-${h.i}`);
  };
  const hataMi = (i: number, ne: string) => hata?.i === i && hata.ne === ne;

  return (
    <div className={stil.sayfa}>
      <p className={stil.sayac} id="sca-durum" tabIndex={-1}><b>{a.satirlar.length}</b> satır · <b>{acikSay}</b> okunacak fotoğraf
        {taslak ? " · kaydedilmedi" : ayar.kayitli ? ` · sürüm ${ayar.kayitli.surum + 1}` : " · formattan hazır"}</p>
      {!ayar.formatVar && <Serit tur="bilgi" ikon="info">Türün yayında rapor formatı yok: satırlar yalnız ekipman bilgilerine ve uzman yorumuna yazılır; okunacak fotoğraf başlığı yok.</Serit>}
      {ayar.dusen > 0 && !taslak && <Serit tur="uyari" ikon="triangle-alert">Rapor formatında artık olmayan {ayar.dusen} satır / başlık ayardan düştü; gözden geçirip Kaydet&apos;e basın.</Serit>}
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <div className={stil.govde}>
        <div className={stil.sol}>
          <FormBolum id="sca-satirlar" baslik="Mesaj satırları (etiket bilgileri)">
            <div className={stil.ic}>
              <p className={stil.ipucu}>Denetçinin mesajında her satır sırayla bir alana yazılır. Satır adını, sırasını, rapordaki alanını ve hazır değerini değiştirin; satır ekleyin ya da silin.</p>
              <ol className={stil.satirlar} aria-label="Mesaj satırları">
                {a.satirlar.map((s, i) => (
                  <li key={i} className={stil.satir}>
                    <span className={stil.no} aria-hidden="true">{i + 1}</span>
                    <Alan id={`sca-ad-${i}`} etiket={`${i + 1}. satır · telefonda yazan`} hata={hataMi(i, "ad") ? hata?.neden : undefined}>
                      <Girdi id={`sca-ad-${i}`} value={s.ad} maxLength={AD_EN_COK} disabled={!yaz} hata={hataMi(i, "ad")}
                        onChange={(e) => degistir((t) => { t.satirlar[i].ad = e.target.value; })} />
                    </Alan>
                    <Alan id={`sca-alan-${i}`} etiket="Rapordaki alan" hata={hataMi(i, "alan") ? hata?.neden : undefined}>
                      <SecimAlani id={`sca-alan-${i}`} ad={`${i + 1}. satır · rapordaki alan`} deger={s.alan} secenekler={ayar.alanlar} ipucu="Alan seçin" etiketsiz
                        gecersiz={hataMi(i, "alan")} tanim={hataMi(i, "alan") ? `sca-alan-${i}-ipucu` : undefined} kapali={!yaz} degistir={(v) => degistir((t) => { t.satirlar[i].alan = v; })} />
                    </Alan>
                    <Alan id={`sca-hz-${i}`} etiket="Hazır değer (isteğe bağlı)" hata={hataMi(i, "hazir") ? hata?.neden : undefined}>
                      <Girdi id={`sca-hz-${i}`} value={s.hazir} maxLength={HAZIR_EN_COK} placeholder="yok" disabled={!yaz} hata={hataMi(i, "hazir")} aria-label={`${i + 1}. satır · hazır değer`}
                        onChange={(e) => degistir((t) => { t.satirlar[i].hazir = e.target.value; })} />
                    </Alan>
                    {yaz && (
                      <div className={stil.tuslar}>
                        <button className={stil.ikonTus} id={`sca-yukari-${i}`} type="button" onClick={() => tasi(i, -1)} disabled={!i} aria-label={`${i + 1}. satırı yukarı al`} title="Yukarı"><Ikon ad="arrow-up" /></button>
                        <button className={stil.ikonTus} id={`sca-asagi-${i}`} type="button" onClick={() => tasi(i, 1)} disabled={i === a.satirlar.length - 1} aria-label={`${i + 1}. satırı aşağı al`} title="Aşağı"><Ikon ad="arrow-down" /></button>
                        <button className={stil.ikonTus} type="button" onClick={() => sil(i)} disabled={a.satirlar.length === 1} aria-label={`${i + 1}. satırı sil`} title="Sil"><Ikon ad="trash-2" /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {yaz && <Tus tur="ikincil" ikon="plus" id="sca-ekle" onClick={ekle}>Satır ekle</Tus>}
              <p className={stil.ipucu}>Hazır değerli satır mesaj kutusunda dolu gelir; denetçi üstüne yazıp değiştirir. Yönergeden fazla yazılan satırlar nota eklenir. Değişiklik yeni kayıtlarda geçerli; gönderilmiş kayıtlar gönderildikleri andaki sırayla okunur.</p>
            </div>
          </FormBolum>
          <FormBolum id="sca-oklar" baslik="Okunacak fotoğraflar (yapay zekâ)">
            <div className={stil.ic}>
              <p className={stil.ipucu}>Kayıtta bu başlıklar altında fotoğraf eklenir (test tablosu, linye, ölçüm ekranı). Rapor yazılırken yapay zekâ okur, o bölümün boş alanlarına girer. Başlıklar, rapor formatında fotoğraftan doldurması açık bölümlerden seçilir.</p>
              {ok.length ? (
                <ul className={stil.oklar}>
                  {ok.map((o) => { const b = basAd.get(o.k)!; return (
                    <li key={o.k} className={stil.ok}>
                      <span><b>{b[1]}</b><small>{b[2]}</small></span>
                      <button className={stil.cip} type="button" id={`sca-ok-${o.k}`} aria-pressed={o.acik} disabled={!yaz} aria-label={`${b[1]}: ${o.acik ? "açık" : "kapalı"}`}
                        onClick={() => { degistir((t) => { const x = t.okunacak.find((y) => y.k === o.k); if (x) x.acik = !x.acik; }); }}>{o.acik ? "Açık" : "Kapalı"}</button>
                      {yaz && <button className={stil.ikonTus} type="button" aria-label={`${b[1]} başlığını sil`} title="Sil"
                        onClick={() => { degistir((t) => { t.okunacak = t.okunacak.filter((y) => y.k !== o.k); }); odakla(OK_EKLE); }}><Ikon ad="trash-2" /></button>}
                    </li>
                  ); })}
                </ul>
              ) : <p className={stil.bos}>Okunacak fotoğraf başlığı yok.</p>}
              {yaz && (kalan.length ? (
                <div className={stil.okEkle}>
                  <Alan id={OK_EKLE} etiket="Başlık ekle">
                    <SecimAlani id={OK_EKLE} ad="Okunacak fotoğraf başlığı ekle" deger="" ipucu="Başlık seçin" secenekler={kalan.map((b) => [b[0], b[1], b[2]] as const)}
                      degistir={(v) => { degistir((t) => { t.okunacak.push({ k: v, acik: true }); }); odakla(`sca-ok-${v}`); }} />
                  </Alan>
                </div>
              ) : ayar.formatVar ? <p className={stil.ipucu}>Formatta fotoğraftan doldurması açık başka bölüm yok.</p> : null)}
            </div>
          </FormBolum>
        </div>
        <aside className={stil.sag} aria-label="Telefonda böyle görünür">
          <p className={stil.ara}><Ikon ad="smartphone" kucuk /> Telefonda böyle görünür</p>
          <div className={stil.yonerge}>
            <p className={stil.ara}>Her satıra sırayla</p>
            <ol>{a.satirlar.map((s, i) => <li key={i}>{s.ad || <span className={stil.yok}>ad yok</span>}{s.hazir && <span className={stil.alt}> · {s.hazir}</span>}</li>)}</ol>
            <p className={stil.etiket}><Ikon ad="tag" kucuk />Etiket fotoğrafı</p>
            {acikSay > 0 && <>
              <p className={stil.ara}>Okunacak fotoğraflar</p>
              <ul className={stil.onizleOk}>{ok.filter((o) => o.acik).map((o) => <li key={o.k}><Ikon ad="scan-text" kucuk />{basAd.get(o.k)![1]}</li>)}</ul>
            </>}
          </div>
        </aside>
      </div>
      {yaz && (
        <FormEylem not={taslak ? "Kaydedilmedi" : undefined}>
          <Tus tur="ikincil" onClick={vazgec} disabled={!taslak || bekliyor}>Vazgeç</Tus>
          <Tus ikon="check" onClick={() => void kaydet()} disabled={!taslak || bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</Tus>
        </FormEylem>
      )}
    </div>
  );
}
