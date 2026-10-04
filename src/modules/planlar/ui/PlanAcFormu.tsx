"use client";
/* PLAN AÇ (maket plan-ac.html M6 2. tur; L6 kapsam seçimi yok; G1 geçmiş tarih uyarı; Ö5b sözleşme dışı uyarı; L4 atama uyarısı): tek sayfa —
   1 Müşteri ve tesis · 2 Tarihler · 3 Denetçi (İSG-KATİP SÖZLEŞME ID sözleşmeden gelir; yoksa el ile + "sözleşmeye de kaydet") · 4 Özet ve uyarılar.
   Uyarılar canlı (sema.ts saf kuralları) ve ENGEL DEĞİL; engel yalnız tesis, tarih, bitiş ≥ başlangıç, en az bir denetçi. Karar ve numara sunucuda. */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BilgiListesi, Bilgi, Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi, ipucuId } from "../../../components/form/Form";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { DegerYok, Kirinti, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { meslek } from "../../personel/sema";
import { adayUyarilari, isgDurumu, kapsamHesapla, sozlesmeUyarisi, tarihNo, turUyarilari, type Aday } from "../sema";
import type { PlanAcVerisi, TesisPlanBilgisi } from "../server/planlar";
import { planAcEylemi, tesisPlanBilgisiEylemi } from "./eylemler";
import { KapsamTablosu } from "./KapsamTablosu";
import stil from "./planlar.module.css";

const OZET = "pa-ozet";
const ID = { musteri: "pa-musteri", tesis: "pa-tesis", baslangic: "pa-baslangic", bitis: "pa-bitis", aciklama: "pa-aciklama" } as const;
const meslekAd = (a: Aday) => (a.meslek === "diger" ? a.meslekMetin ?? "Diğer" : meslek(a.meslek)?.ad ?? a.meslek);

export function PlanAcFormu({ veri, baslangic }: { veri: PlanAcVerisi; baslangic: { musteri?: string; tesis?: string } }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const ilkMusteri = baslangic.tesis ? veri.musteriler.find((m) => m.tesisler.some((t) => t.id === baslangic.tesis))?.id : baslangic.musteri;
  const [d, setD] = useState({ musteri: ilkMusteri ?? "", tesis: ilkMusteri && baslangic.tesis ? baslangic.tesis : "", baslangic: veri.bugun, bitis: veri.bugun, aciklama: "" });
  const [ekip, setEkip] = useState<string[]>([]);
  const [isg, setIsg] = useState<Record<string, string>>({});
  const [kaydet, setKaydet] = useState<Record<string, boolean>>({});
  const [yuklenen, setYuklenen] = useState<{ tesis: string; bilgi: TesisPlanBilgisi | null } | null>(null);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);

  /* tesis seçilince o tesisin İSG-KATİP ID'leri, sözleşmeleri ve ekipmanı sunucudan; yalnız seçili tesisinki kullanılır */
  useEffect(() => {
    if (!d.tesis) return;
    let iptal = false;
    void tesisPlanBilgisiEylemi(d.tesis).then((b) => { if (!iptal) setYuklenen({ tesis: d.tesis, bilgi: b }); });
    return () => { iptal = true; };
  }, [d.tesis]);
  const bilgi = yuklenen && yuklenen.tesis === d.tesis ? yuklenen.bilgi : null;

  const m = veri.musteriler.find((x) => x.id === d.musteri);
  const gun = d.baslangic || null, bit = d.bitis || null;
  const durumlar = new Map(veri.adaylar.map((a) => {
    const isgD = isgDurumu(bilgi?.isg.find((x) => x.personelId === a.id), isg[a.id]?.trim() || null, gun);
    return [a.id, { isg: isgD, ...adayUyarilari(a, isgD, gun, bit, veri.acikPlanlar) }] as const;
  }));
  const kapsam = bilgi ? kapsamHesapla(bilgi.ekipmanlar, veri.turler, gun ?? veri.bugun, veri.esik) : [];
  const ekipAday = veri.adaylar.filter((a) => ekip.includes(a.id));
  const toplam = kapsam.reduce((n, k) => n + k.ekipman, 0);
  const acik = veri.acikPlanlar.filter((p) => p.tesis === d.tesis);
  const sozUyari = bilgi ? sozlesmeUyarisi(bilgi.sozlesmeler, gun) : null;
  const elle = ekip.filter((k) => !bilgi?.isg.some((x) => x.personelId === k));

  const uyarilar = [
    ...ekipAday.flatMap((a) => {
      const u = durumlar.get(a.id)!;
      return [
        { tur: u.eksik.length ? "eksik" as const : "tamam" as const, metin: u.eksik.length ? `${a.ad} — uyarı: ${u.eksik.join(" · ")}.` : `${a.ad}: uyarı yok.` },
        ...u.cakisma.map((p) => ({ tur: "eksik" as const, metin: `${a.ad} aynı günlerde ${p.no} planında · ${tarihNo(p.baslangic)}.` })),
      ];
    }),
    ...turUyarilari(kapsam, ekipAday, veri.atamalar).map((metin) => ({ tur: "eksik" as const, metin })),
  ];

  const sutunlar: Sutun<Aday>[] = [
    { k: "ad", genislik: "26%", baslik: "Denetçi", kart: "ust", sira: 1, hucre: (a) => (
      <label className={stil.secim}>
        <input type="checkbox" data-aday={a.id} checked={ekip.includes(a.id)} aria-label={a.ad}
          onChange={(e) => { setEkip(e.target.checked ? [...ekip, a.id] : ekip.filter((x) => x !== a.id)); setH(({ ekip: _, ...r }) => r); }} />
        <span>{a.ad}<span className={stil.altMetin}>{meslekAd(a)}</span></span>
      </label>
    ) },
    { k: "isg", genislik: "18%", baslik: "İSG-KATİP SÖZLEŞME ID", kart: "govde", sira: 2, hucre: (a) => {
      const x = durumlar.get(a.id)!.isg;
      return <><KartEtiket>İSG-KATİP SÖZLEŞME ID</KartEtiket>{x.tur === "yok" ? <span className={stil.uyari}>Yok</span> : x.tur === "elle" ? <span className={stil.kod}>{x.no}</span>
        : <span><span className={stil.kod}>{x.kayit.no}</span>{x.tur === "gec" && <span className={`${stil.uyari} ${stil.altMetin}`}>Geç onay · {tarihNo(x.kayit.onay!)}</span>}
          {x.tur === "bitti" && <span className={`${stil.uyari} ${stil.altMetin}`}>Bitmiş · {tarihNo(x.kayit.bitis!)}</span>}</span>}</>;
    } },
    { k: "ekipnet", genislik: "13%", baslik: "EKİPNET", kart: "govde", sira: 3, hucre: (a) => <><KartEtiket>EKİPNET</KartEtiket>{a.ekipnet ? <span className={stil.kod}>{a.ekipnet}</span> : <span className={stil.uyari}>Eksik</span>}</> },
    { k: "gun", genislik: "15%", baslik: "Aynı gün", kart: "govde", sira: 5, hucre: (a) => {
      const c = durumlar.get(a.id)!.cakisma;
      return <><KartEtiket>Aynı gün</KartEtiket>{c.length ? <span>{c.map((p) => <span key={p.id} className={`${stil.uyari} ${stil.altMetin}`}>{p.no} · {tarihNo(p.baslangic)}</span>)}</span> : <DegerYok>Başka plan yok</DegerYok>}</>;
    } },
    { k: "uyari", genislik: "18%", baslik: "Uyarı", kart: "govde", sira: 6, hucre: (a) => {
      const e = durumlar.get(a.id)!.eksik;
      return <><KartEtiket>Uyarı</KartEtiket>{e.length ? <span className={stil.uyari}>{e.join(" · ")}</span> : <DegerYok>Yok</DegerYok>}</>;
    } },
    { k: "durum", genislik: "10%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (a) => {
      const n = durumlar.get(a.id)!.eksik.length;
      return n ? <Rozet tur="bekliyor">{n} uyarı</Rozet> : <Rozet tur="tamam">Uygun</Rozet>;
    } },
  ];

  const ac = () => baslat(async () => {
    const yerel: Record<string, string> = {};
    if (!d.musteri) yerel.musteri = "Müşteri seçilmeli.";
    const r = await planAcEylemi({ tesis: d.tesis, baslangic: d.baslangic, bitis: d.bitis, aciklama: d.aciklama, ekip: ekip.map((k) => ({ personel: k, isgNo: isg[k] ?? "", kaydet: !!kaydet[k] })) });
    const hatalar = { ...yerel, ...(r.hatalar ?? {}) };
    setH(hatalar); setGenel(r.genel ?? null);
    if (!r.tamam) {
      const k = Object.keys(hatalar)[0];
      requestAnimationFrame(() => (k === "ekip" ? document.querySelector<HTMLInputElement>("[data-aday]") : document.getElementById(ID[k as keyof typeof ID] ?? OZET))?.focus());
      return;
    }
    bildir(`${r.no} açıldı.`);
    router.push(`/planlar/${r.id}`);
  });
  const hataSayisi = Object.keys(h).length;

  return (
    <form onSubmit={(e) => { e.preventDefault(); ac(); }} noValidate>
      <Kirinti ogeler={[["Planlar", "/planlar"], ["Plan aç"]]} />
      <SayfaBasi baslik="Plan aç" />
      {(hataSayisi > 0 || genel) && <Serit tur="hata" ikon="circle-alert" id={OZET}>{genel ?? `Plan açılmadı: ${hataSayisi} eksik düzeltilmeli.`}</Serit>}
      <FormSayfa>
        <FormBolum baslik="1 · Müşteri ve tesis" id="pa-b1">
          <FormIzgara>
            <Alan id={ID.musteri} etiket="Müşteri" zorunlu genis hata={h.musteri}>
              <SecimAlani id={ID.musteri} ad="Müşteri" deger={d.musteri} ipucu="Müşteri seçin" gecersiz={!!h.musteri} tanim={ipucuId(ID.musteri)}
                secenekler={veri.musteriler.map((x) => [x.id, x.kisa, `${x.tesisler.length} tesis`] as const)}
                degistir={(x) => { if (x !== d.musteri) { setEkip([]); setIsg({}); setKaydet({}); } setD({ ...d, musteri: x, tesis: x === d.musteri ? d.tesis : "" }); setH(({ musteri: _, ...r }) => r); }} />
            </Alan>
            <Alan id={ID.tesis} etiket="Tesis" zorunlu genis hata={h.tesis}>
              <SecimAlani id={ID.tesis} ad="Tesis" deger={d.tesis} ipucu={m ? "Tesis seçin" : "Önce müşteri seçin"} kapali={!m} gecersiz={!!h.tesis} tanim={ipucuId(ID.tesis)}
                secenekler={(m?.tesisler ?? []).map((t) => [t.id, t.ad, [t.ilce, t.il].filter(Boolean).join(" / ")] as const)}
                degistir={(x) => { if (x !== d.tesis) { setEkip([]); setIsg({}); setKaydet({}); } setD({ ...d, tesis: x }); setH(({ tesis: _, ...r }) => r); }} />
            </Alan>
          </FormIzgara>
          {(acik.length > 0 || (bilgi && !bilgi.isg.length)) && <div className={stil.seritler}>
            {acik.map((p) => <Serit key={p.id} tur="bilgi" ikon="calendar-check">Bu tesiste açık plan var: <b>{p.no}</b> · {tarihNo(p.baslangic)}.</Serit>)}
            {bilgi && !bilgi.isg.length && <Serit tur="uyari" ikon="triangle-alert">Bu tesiste İSG-KATİP SÖZLEŞME ID&apos;si yok.</Serit>}
          </div>}
        </FormBolum>
        <FormBolum baslik="2 · Tarihler" id="pa-b2">
          <FormIzgara>
            <Alan id={ID.baslangic} etiket="Başlangıç" zorunlu hata={h.baslangic}>
              <TarihAlani id={ID.baslangic} ad="Başlangıç" deger={d.baslangic} degistir={(x) => setD({ ...d, baslangic: x })} tanim={h.baslangic ? ipucuId(ID.baslangic) : undefined} />
            </Alan>
            <Alan id={ID.bitis} etiket="Bitiş" zorunlu hata={h.bitis}>
              <TarihAlani id={ID.bitis} ad="Bitiş" deger={d.bitis} degistir={(x) => setD({ ...d, bitis: x })} tanim={h.bitis ? ipucuId(ID.bitis) : undefined} />
            </Alan>
            <Alan id={ID.aciklama} etiket="Açıklama" genis hata={h.aciklama}>
              <textarea id={ID.aciklama} className={stil.not} maxLength={300} value={d.aciklama} placeholder="Giriş izni, refakat, saatler" onChange={(e) => setD({ ...d, aciklama: e.target.value })} />
            </Alan>
          </FormIzgara>
          {((gun && gun < veri.bugun) || sozUyari) && <div className={stil.seritler}>
            {gun && gun < veri.bugun && <Serit tur="uyari" ikon="triangle-alert">Plan günü geçmiş bir tarih: {tarihNo(gun)}.</Serit>}
            {sozUyari && <Serit tur="uyari" ikon="triangle-alert">{sozUyari}</Serit>}
          </div>}
        </FormBolum>
        <FormBolum baslik="3 · Denetçi" id="pa-b3">
          {!d.tesis ? <p className={stil.bosSatir}>Önce tesis seçin.</p> : <>
            <Liste baslik="Denetçiler" sutunlar={sutunlar} kayitlar={veri.adaylar} anahtar={(a) => a.id} />
            {h.ekip && <p className={stil.uyari} id="pa-ekip-ipucu">{h.ekip}</p>}
            {elle.length > 0 && <>
              <h3 className={stil.altBaslik}>İSG-KATİP SÖZLEŞME ID</h3>
              <FormIzgara>
                {elle.map((k) => {
                  const a = veri.adaylar.find((x) => x.id === k)!, i = ekip.indexOf(k), id = `pa-isg-${k}`;
                  return (
                    <div key={k} className={stil.isgSatiri}>
                      <Alan id={id} etiket={a.ad} hata={h[`ekip.${i}.isgNo`]}>
                        <Girdi id={id} value={isg[k] ?? ""} maxLength={30} hata={!!h[`ekip.${i}.isgNo`]} onChange={(e) => setIsg({ ...isg, [k]: e.target.value })} />
                      </Alan>
                      {veri.isgYazar && bilgi?.yururlukte && (
                        <label className={stil.kutu}><input type="checkbox" checked={!!kaydet[k]} onChange={(e) => setKaydet({ ...kaydet, [k]: e.target.checked })} />Sözleşmeye de kaydet</label>
                      )}
                    </div>
                  );
                })}
              </FormIzgara>
            </>}
          </>}
        </FormBolum>
        <FormBolum baslik="4 · Özet ve uyarılar" id="pa-b4">
          {!d.tesis ? <p className={stil.bosSatir}>Önce tesis seçin.</p> : <>
            <BilgiListesi>
              <Bilgi etiket="Başlangıç">{gun ? tarihNo(gun) : <DegerYok>Tarih eksik</DegerYok>}</Bilgi>
              <Bilgi etiket="Bitiş">{bit ? tarihNo(bit) : <DegerYok>Tarih eksik</DegerYok>}</Bilgi>
              <Bilgi etiket="Ekip" genis>{ekipAday.length ? ekipAday.map((a) => a.ad).join(", ") : <DegerYok>Seçilmedi</DegerYok>}</Bilgi>
              <Bilgi etiket="Ekipman" genis>{toplam ? `${toplam} ekipman · ${kapsam.length} tür · hepsi plana girer` : <DegerYok>Tesiste kayıtlı ekipman yok; denetçi sahada ekler</DegerYok>}</Bilgi>
            </BilgiListesi>
            {kapsam.length > 0 && <div className={stil.tablo}><KapsamTablosu kapsam={kapsam} ekip={ekipAday} /></div>}
            {uyarilar.length > 0 && <div className={stil.tablo}><Kosullar ogeler={uyarilar} /></div>}
          </>}
        </FormBolum>
      </FormSayfa>
      <FormEylem>
        <TusBaglanti href="/planlar">Vazgeç</TusBaglanti>
        <Tus type="submit" ikon="calendar-check" disabled={bekliyor} aria-busy={bekliyor || undefined}>Planı aç</Tus>
      </FormEylem>
    </form>
  );
}
