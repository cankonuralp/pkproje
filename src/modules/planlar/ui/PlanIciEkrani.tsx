"use client";
/* PLAN İÇİ (maket planlarim.html #/plan/<id>, 4.–5. tur; donmuş referans ekran): dikey akış Planlandı → Kabul → Denetim → Tamamlama. Her adım durum
   (tamamlandı ✓ · şu an · sırada · reddedildi ×) ve yalnız tarih gösterir (2026-09-27). Şu anki adımın tuşları adımın içinde; telefonda altta
   yapışkan çubukta (kalıp 2, tek birincil tuş). Kabul: tarafsızlık beyanı okunmadan Kabul et kapalı (sebebi yazılı); Reddet gerekçe ister.
   Denetim: kontrol listesi = Ekipmanlar + Raporlar (311: Rapor oluştur ekipman satırında, raporlar kendi süzgeçli listesinde); plan günü gelmediyse
   nedeni şeritte (P1 2026-10-01 + 2026-10-03: "geleceğe rapor yazmayı engelle" — geçmiş açık); Tamamla iki adım (kontrol listesi → plan).
   Künye: planlamacı Düzenle; denetçi Güncelle.
   Altta Proje notları (hareket listesi gösterilmez — 5. tur). Yetki ve geçiş kuralı sunucuda; buradaki tuşlar yalnız izinli olanı gösterir. */
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { Ikon } from "../../../components/ikon/Ikon";
import { Pencere } from "../../../components/pencere/Pencere";
import { DegerYok, Kod } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { meslek } from "../../personel/sema";
import { akisAdimlari, gunNo, tarihNo, type AdimDurumu } from "../sema";
import type { PlanIci } from "../server/plan-ici";
import { EkipmanBolumu, ERKEN_ID } from "./EkipmanBolumu";
import {
  kontrolListesiEylemi, kunyeDuzenleEylemi, kunyeGuncelleEylemi, planKabulEylemi, planReddetEylemi, planTamamlaEylemi, tamamlamaGeriAlEylemi, type PlanYaniti,
} from "./eylemler";
import { ProjeNotlari } from "./ProjeNotlari";
import { RaporBolumu } from "./RaporBolumu";
import stil from "./planlar.module.css";

const ETIKET: Record<AdimDurumu, string> = { tamam: "Tamamlandı", aktif: "Şu an", bekliyor: "Sırada", red: "Reddedildi" };
const ADIM_SINIF: Record<AdimDurumu, string> = { tamam: stil.adimTamam, aktif: stil.adimAktif, bekliyor: stil.adimBekliyor, red: stil.adimRed };
const ID = { firma: "kunye-firma", adres: "kunye-adres", sgk: "kunye-sgk", red: "red-gerekce" } as const;

function Adim({ no, durum, baslik, ozet, children }: { no: number; durum: AdimDurumu; baslik: string; ozet?: ReactNode; children?: ReactNode }) {
  return (
    <li className={`${stil.adim} ${ADIM_SINIF[durum]}`} aria-current={durum === "aktif" ? "step" : undefined}>
      <div className={stil.isaret} aria-hidden="true">{durum === "tamam" ? <Ikon ad="check" kucuk /> : durum === "red" ? <Ikon ad="x" kucuk /> : no}</div>
      <div className={stil.adimGovde}>
        <div className={stil.adimBas}>
          <h2 className={stil.adimBaslik}>{baslik}</h2>
          <span className={stil.adimDurum}>{ETIKET[durum]}</span>
          {ozet && <span className={stil.adimOzet}>{ozet}</span>}
        </div>
        {children && <div className={stil.adimIcerik}>{children}</div>}
      </div>
    </li>
  );
}

function Satir({ etiket, children }: { etiket: string; children: ReactNode }) {
  return <div><dt>{etiket}</dt><dd>{children}</dd></div>;
}

export function PlanIciEkrani({ v }: { v: PlanIci }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [beyanOk, setBeyanOk] = useState(false);
  const [red, setRed] = useState<{ gerekce: string; hata: string | null } | null>(null);
  const [duzenle, setDuzenle] = useState<{ firmaAdi: string; adres: string; sgk: string; isg: Record<string, string> } | null>(null);
  const [kunyeHata, setKunyeHata] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const k = v.kart, d = v.durum, adim = akisAdimlari(d, !!v.kontrolTamam), kt = d === "denetimde" && !!v.kontrolTamam;
  const sebepId = `plan-sebep-${k.id}`;

  const calistir = (is: () => Promise<PlanYaniti>, sonra?: () => void) => baslat(async () => {
    const r = await is();
    if (r.tamam) { setGenel(null); sonra?.(); bildir(r.bildirim ?? "Kaydedildi."); router.refresh(); return; }
    setGenel(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "İşlem yapılamadı.");
  });

  /* şu anki adımın tuşları — adımda ve telefonun alt çubuğunda aynı üretici */
  const eylem: ReactNode = d === "bekliyor" && v.izin.kabulRed ? <>
    <Tus tur="ikincil" disabled={bekliyor} onClick={() => setRed({ gerekce: "", hata: null })}>Reddet</Tus>
    <Tus ikon="check" disabled={!beyanOk || bekliyor} aria-describedby={beyanOk ? undefined : sebepId}
      onClick={() => calistir(() => planKabulEylemi(k.id, v.surum, beyanOk, v.beyanOzet))}>Kabul et</Tus>
  </> : d === "denetimde" && v.izin.kontrol ? (kt
    ? <Tus ikon="circle-check" disabled={bekliyor} onClick={() => calistir(() => planTamamlaEylemi(k.id, v.surum))}>Tamamla</Tus>
    : <Tus ikon="list-checks" disabled={bekliyor} onClick={() => calistir(() => kontrolListesiEylemi(k.id, v.surum, true))}>Tamamla</Tus>)
    : d === "tamamlandi" && v.izin.kontrol ? <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => calistir(() => tamamlamaGeriAlEylemi(k.id, v.surum))}>Tamamlamayı geri al</Tus>
    : null;
  const eylemKutusu = (not?: ReactNode) => (eylem || not) && (
    <div className={stil.adimEylem}>{not && <p className={stil.adimNot}>{not}</p>}{eylem && <div className={stil.adimTuslar}>{eylem}</div>}</div>
  );

  /* ── 1 · Planlandı: künye + teklif içeriği ── */
  const K = v.kunye;
  const kunyeKaydet = () => duzenle && baslat(async () => {
    const r = await kunyeDuzenleEylemi(k.id, v.surum, duzenle);
    if (r.tamam) { setDuzenle(null); setKunyeHata({}); bildir(r.bildirim ?? "Kaydedildi."); router.refresh(); return; }
    setKunyeHata(r.hatalar ?? {}); if (r.genel) setGenel(r.genel);
  });
  const g = v.kunyeGuncel;   /* yetki kalkarsa (ör. plan reddedildi) form çizilmez */
  const kunyeFormu = duzenle && g && (
    <div className={stil.kunyeForm} role="group" aria-label="Plan bilgilerini düzenle">
      <FormIzgara>
        <Alan id={ID.firma} etiket="Firma adı" zorunlu genis hata={kunyeHata.firmaAdi}>
          <Girdi id={ID.firma} value={duzenle.firmaAdi} maxLength={200} hata={!!kunyeHata.firmaAdi} onChange={(e) => setDuzenle({ ...duzenle, firmaAdi: e.target.value })} />
        </Alan>
        <Alan id={ID.adres} etiket="Adres" genis hata={kunyeHata.adres}>
          <Girdi id={ID.adres} value={duzenle.adres} maxLength={300} hata={!!kunyeHata.adres} onChange={(e) => setDuzenle({ ...duzenle, adres: e.target.value })} />
        </Alan>
        <Alan id={ID.sgk} etiket="SGK DETSİS NO" hata={kunyeHata.sgk}>
          <Girdi id={ID.sgk} value={duzenle.sgk} inputMode="numeric" maxLength={32} hata={!!kunyeHata.sgk} onChange={(e) => setDuzenle({ ...duzenle, sgk: e.target.value })} />
        </Alan>
        {g.isg.map((x) => {
          const id = `kunye-isg-${x.personelId}`, h = kunyeHata[`isg.${x.personelId}`];
          return (
            <Alan key={x.personelId} id={id} etiket={`İSG-KATİP SÖZLEŞME ID · ${x.ad}`} hata={h}>
              <Girdi id={id} value={duzenle.isg[x.personelId] ?? ""} maxLength={30} hata={!!h} onChange={(e) => setDuzenle({ ...duzenle, isg: { ...duzenle.isg, [x.personelId]: e.target.value } })} />
            </Alan>
          );
        })}
      </FormIzgara>
      <div className={stil.kunyeTuslar}>
        <Tus tur="ikincil" onClick={() => { setDuzenle(null); setKunyeHata({}); }}>Vazgeç</Tus>
        <Tus ikon="check" disabled={bekliyor} onClick={kunyeKaydet}>Kaydet</Tus>
      </div>
    </div>
  );
  const a1 = (
    <Adim no={1} durum={adim[0]} baslik="Planlandı" ozet={gunNo(k.olustu)}>
      {v.kunyeGuncel && !duzenle && (
        <div className={stil.kunyeBas}>
          <Tus tur="ikincil" ikon="pencil" onClick={() => {
            const gk = v.kunyeGuncel!;
            setDuzenle({ firmaAdi: gk.firmaAdi, adres: gk.adres ?? "", sgk: gk.sgk ?? "", isg: Object.fromEntries(gk.isg.map((x) => [x.personelId, x.no ?? ""])) });
          }}>Düzenle</Tus>
        </div>
      )}
      {v.izin.kunyeGuncelle && v.kunyeFark.length > 0 && (
        <Serit tur="uyari" ikon="refresh-cw" eylem={<Tus tur="ikincil" ikon="refresh-cw" disabled={bekliyor} onClick={() => calistir(() => kunyeGuncelleEylemi(k.id))}>Güncelle</Tus>}>
          Planlamacı plan bilgilerini değiştirdi: <b>{v.kunyeFark.join(", ")}</b>. Güncelle&apos;ye basınca planınıza ve taslak raporlarınıza geçer.
        </Serit>
      )}
      {kunyeFormu}
      <dl className={stil.satirlar}>
        <Satir etiket="Proje no"><Kod>{k.no}</Kod></Satir>
        <Satir etiket="Firma adı">{K.firmaAdi}</Satir>
        <Satir etiket="İSG-KATİP SÖZLEŞME ID">
          {K.isg.map((x) => <span key={x.personelId} className={stil.satir}>{K.isg.length > 1 && <>{x.ad}: </>}{x.no ? <Kod>{x.no}</Kod> : <span className={stil.uyari}>Yok</span>}</span>)}
        </Satir>
        <Satir etiket="SGK DETSİS NO">{K.sgk ? <Kod>{K.sgk}</Kod> : <DegerYok>-</DegerYok>}</Satir>
        <Satir etiket="Başlangıç tarihi">{tarihNo(k.baslangic)}</Satir>
        <Satir etiket="Bitiş tarihi">{tarihNo(k.bitis)}</Satir>
        <Satir etiket="Denetçi">
          {k.ekip.map((e, i) => <span key={e.personelId}>{i > 0 && " · "}{e.ad} <span className={stil.altInline}>{meslek(e.meslek)?.ad ?? ""}</span></span>)}
        </Satir>
        <Satir etiket="Adres">{K.adres ?? <DegerYok>-</DegerYok>}</Satir>
        <Satir etiket="Açıklama">{k.aciklama ?? <DegerYok>-</DegerYok>}</Satir>
      </dl>
      <section className={stil.teklif} aria-labelledby={`teklif-${k.id}`}>
        <h3 className={stil.teklifBaslik} id={`teklif-${k.id}`}>Teklif içeriği</h3>
        <div className={stil.teklifKap}>
          {v.teklif.some((t) => t.planlanan) ? (
            <table className={stil.duzTablo}>
              <thead><tr><th scope="col">Muayene alanı</th><th scope="col">Muayene türü</th><th scope="col">Adet</th></tr></thead>
              <tbody>{v.teklif.filter((t) => t.planlanan).map((t) => <tr key={t.turId}><td>{t.ad}</td><td>Periyodik kontrol</td><td>{t.planlanan}</td></tr>)}</tbody>
            </table>
          ) : <p className={stil.bosSatir}>Plan açılırken tesiste kayıtlı ekipman yoktu; denetçi sahada ekler.</p>}
        </div>
      </section>
      {k.turUyarilari.length > 0 && <Kosullar ogeler={k.turUyarilari.map((metin) => ({ tur: "eksik" as const, metin }))} />}
    </Adim>
  );

  /* ── 2 · Kabul: tarafsızlık beyanı ── */
  const a2 = d === "bekliyor" ? (
    <Adim no={2} durum={adim[1]} baslik="Kabul">
      <blockquote className={stil.beyan}><p className={stil.beyanBaslik}>Tarafsızlık ve çıkar çatışması beyanı</p><p>{v.beyan}</p></blockquote>
      {v.izin.kabulRed ? <>
        <label className={stil.secim}>
          <input type="checkbox" checked={beyanOk} onChange={(e) => setBeyanOk(e.target.checked)} />
          <span id={sebepId}>Tarafsızlık beyanını okudum, kabul ediyorum</span>
        </label>
        {eylemKutusu()}
      </> : <p className={stil.adimNot}>Plan, ekipteki denetçinin kabulünü bekliyor.</p>}
    </Adim>
  ) : d === "reddedildi" ? (
    <Adim no={2} durum={adim[1]} baslik="Kabul" ozet={v.red && gunNo(v.red.zaman)}>
      <Serit tur="hata" ikon="circle-x">Gerekçe: {v.red?.gerekce} {v.red && <span className={stil.altInline}>· {v.red.kim}</span>}</Serit>
    </Adim>
  ) : (
    <Adim no={2} durum={adim[1]} baslik="Kabul" ozet={v.kabul && gunNo(v.kabul.zaman)}>
      <details className={stil.ayrinti}>
        <summary>Tarafsızlık beyanı onaylandı · beyanı gör</summary>
        <blockquote className={stil.beyan}><p>{v.kabul?.beyan}</p>{v.kabul && <p className={stil.altInline}>{v.kabul.kim} · {gunNo(v.kabul.zaman)}</p>}</blockquote>
      </details>
    </Adim>
  );

  /* ── 3 · Denetim: kontrol listesi (Ekipmanlar + Raporlar) ── */
  const raporlu = new Set(v.raporluEkipman);
  const raporsuz = v.ekipman.filter((e) => !e.pasif && !raporlu.has(e.id)).length;
  const calisir = d === "kabul" || d === "denetimde" || d === "tamamlandi";
  const a3ozet = kt ? `Kontrol listesi tamamlandı · ${gunNo(v.kontrolTamam!)}`
    : v.basladi ? (d === "tamamlandi" && v.bitti ? `${gunNo(v.basladi)}${gunNo(v.bitti) !== gunNo(v.basladi) ? ` – ${gunNo(v.bitti)}` : ""}` : `Başladı: ${gunNo(v.basladi)}`) : null;
  const a3 = (
    <Adim no={3} durum={adim[2]} baslik="Denetim" ozet={a3ozet}>
      {d === "reddedildi" && <p className={stil.adimNot}>Plan reddedildi; denetim yok.</p>}
      {d === "kabul" && <p className={stil.adimNot}>İlk rapor oluşturulunca denetim başlar.</p>}
      {calisir && v.erken && (
        <Serit tur="uyari" ikon="calendar" id={ERKEN_ID}>
          Plan günü {tarihNo(k.baslangic)} henüz gelmedi (bugün {tarihNo(v.bugun)}). Rapor plan gününden itibaren oluşturulur; geçmiş günlere açık, ileri tarihe kapalı.
        </Serit>
      )}
      {calisir && <EkipmanBolumu v={v} />}
      {calisir && <RaporBolumu v={v} />}
      {d === "denetimde" && !kt && eylemKutusu(raporsuz ? `${raporsuz} ekipmanın bu planda raporu yok.` : "Bütün ekipmanların raporu açıldı.")}
      {kt && <>
        <Serit tur="onay" ikon="circle-check">Kontrol listesi tamamlandı.</Serit>
        {v.izin.kontrol && <div className={stil.kunyeBas}>
          <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => calistir(() => kontrolListesiEylemi(k.id, v.surum, false))}>Kontrol listesini yeniden aç</Tus>
        </div>}
      </>}
    </Adim>
  );

  /* ── 4 · Tamamlama ── */
  const a4 = (
    <Adim no={4} durum={adim[3]} baslik="Tamamlama" ozet={d === "tamamlandi" && v.bitti ? gunNo(v.bitti) : null}>
      {kt ? eylemKutusu("Planı tamamlayın; plan Tamamlandı olur.")
        : d === "denetimde" ? <p className={stil.adimNot}>Kontrol listesi tamamlanınca plan buradan tamamlanır.</p>
        : d === "tamamlandi" ? eylemKutusu() : null}
    </Adim>
  );

  return (
    <>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <ol className={stil.akis} aria-label="Plan akışı">{a1}{a2}{a3}{a4}</ol>
      {v.notlar && <ProjeNotlari planId={k.id} notlar={v.notlar} />}
      {eylem && <div className={stil.cubukAlt}>{eylem}</div>}
      <Pencere acik={!!red} baslik="Planı reddet" onKapat={() => setRed(null)}
        alt={<>
          <Tus tur="ikincil" onClick={() => setRed(null)}>Vazgeç</Tus>
          <Tus tur="tehlike" disabled={!red?.gerekce.trim() || bekliyor} onClick={() => red && baslat(async () => {
            const r = await planReddetEylemi(k.id, v.surum, red.gerekce);
            if (r.tamam) { setRed(null); bildir(r.bildirim ?? "Plan reddedildi."); router.refresh(); return; }
            setRed({ ...red, hata: r.hatalar?.gerekce ?? r.genel ?? "Reddedilemedi." });
          })}>Reddet</Tus>
        </>}>
        <p className={stil.adimNot}><b>{k.no}</b> · {k.musteri.unvan}</p>
        <Alan id={ID.red} etiket="Gerekçe" zorunlu hata={red?.hata}>
          <textarea id={ID.red} className={stil.not} maxLength={500} value={red?.gerekce ?? ""} data-ilk-odak="" aria-invalid={!!red?.hata || undefined}
            aria-describedby={red?.hata ? ipucuId(ID.red) : undefined} onChange={(e) => red && setRed({ ...red, gerekce: e.target.value })} />
        </Alan>
      </Pencere>
    </>
  );
}
