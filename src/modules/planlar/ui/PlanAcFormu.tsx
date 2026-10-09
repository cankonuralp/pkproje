"use client";
/* PLAN AÇ (maket plan-ac.html M6 2. tur; L6 kapsam seçimi yok; G1 geçmiş tarih uyarı; Ö5b sözleşme dışı uyarı; L4 atama uyarısı): tek sayfa —
   1 Müşteri ve tesis · 2 Tarihler · 3 Denetçi (İSG-KATİP SÖZLEŞME ID sözleşmeden gelir; yoksa el ile + "sözleşmeye de kaydet") · 4 Bilgilendirme (432:
   ekibe e-posta kendiliğinden; başka alıcılar elle ya da listeden) · 5 Ekipmanlar · 6 Özet ve uyarılar.
   444 (reisim 2026-10-09): kartlar aynı satırda eşit boy, uzun liste kendi içinde kayar (FormBolum kaydir); denetçiler kısa satırlar; seçilen
   denetçinin e-postası Bilgilendirme'de kendiliğinden ("seçilen denetçinin mailleri bilgilendirme maili kısmına otomatik gelsin"); Ekipmanlar:
   tesiste kayıtlılar kendiliğinden + elle satır satır ("el ile de girilebilmeli liste gibi" — açılışta tesise kayıt + plana).
   Uyarılar canlı (sema.ts saf kuralları) ve ENGEL DEĞİL; engel yalnız tesis, tarih, bitiş ≥ başlangıç, en az bir denetçi. Karar ve numara sunucuda. */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BilgiListesi, Bilgi, Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi, ipucuId } from "../../../components/form/Form";
import { DegerYok, Kirinti, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { Ikon } from "../../../components/ikon/Ikon";
import { meslek } from "../../personel/sema";
import { adayUyarilari, isgDurumu, kapsamHesapla, kodBicimi, kodNormal, sozlesmeUyarisi, tarihNo, turUyarilari, type Aday } from "../sema";
import type { PlanAcVerisi, TesisPlanBilgisi } from "../server/planlar";
import { planAcEylemi, tesisPlanBilgisiEylemi } from "./eylemler";
import { KapsamTablosu } from "./KapsamTablosu";
import stil from "./planlar.module.css";

const OZET = "pa-ozet";
const ID = { musteri: "pa-musteri", tesis: "pa-tesis", baslangic: "pa-baslangic", bitis: "pa-bitis", aciklama: "pa-aciklama", bilgilendirme: "pa-eposta", rehber: "pa-rehber" } as const;
const EPOSTA_BICIMI = /^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]{2,}$/;
const EN_COK_BILGI = 20;
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
  /* 432: bilgilendirme listesi (ekibe ayrıca kendiliğinden gider) — elle yazılan ya da listeden seçilen e-postalar */
  const [bilgi_, setBilgi] = useState<string[]>([]);
  const [yeniEposta, setYeniEposta] = useState("");
  /* ekleme hatası formun gönderim hatalarından ayrı: yanlış yazılan adres "Plan açılmadı" şeridi çıkarmaz */
  const [epostaHata, setEpostaHata] = useState<string | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  /* 444: elle eklenen ekipman satırları (tesise kayıtlı olmayan) */
  const [yeni, setYeni] = useState<{ a: number; tur: string; kod: string; konum: string }[]>([]);
  const [sayac, setSayac] = useState(0);

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
  const tesisteki = (bilgi?.ekipmanlar ?? []).filter((e) => !e.pasif);
  const elleTam = yeni.filter((e) => e.tur);
  const kapsam = bilgi ? kapsamHesapla([...bilgi.ekipmanlar, ...elleTam.map((e) => ({ turId: e.tur, sonKontrol: null, pasif: false }))], veri.turler, gun ?? veri.bugun, veri.esik) : [];
  const turAd = (id: string) => veri.turler.find((t) => t.id === id)?.ad ?? "—";
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

  /* 444: denetçi kısa satır — seçim, ad, meslek, durum rozeti; altında İSG-KATİP ID · EKİPNET · aynı gün · uyarı (eski kart hâli bir kişide beş satırdı) */
  const adaySatiri = (a: Aday) => {
    const u = durumlar.get(a.id)!, x = u.isg;
    const isgMetin = x.tur === "yok" ? <span className={stil.uyari}>Yok</span> : x.tur === "elle" ? <span className={stil.kod}>{x.no}</span>
      : <><span className={stil.kod}>{x.kayit.no}</span>{x.tur === "gec" && <span className={stil.uyari}> · geç onay {tarihNo(x.kayit.onay!)}</span>}
        {x.tur === "bitti" && <span className={stil.uyari}> · bitmiş {tarihNo(x.kayit.bitis!)}</span>}</>;
    return (
      <li key={a.id} className={stil.aday}>
        <div className={stil.adayUst}>
          <label className={stil.secim}>
            <input type="checkbox" data-aday={a.id} checked={ekip.includes(a.id)} aria-label={a.ad}
              onChange={(e) => { setEkip(e.target.checked ? [...ekip, a.id] : ekip.filter((y) => y !== a.id)); setH(({ ekip: _, ...r }) => r); }} />
            <span>{a.ad}<span className={stil.altMetin}>{meslekAd(a)}</span></span>
          </label>
          {u.eksik.length ? <Rozet tur="bekliyor">{u.eksik.length} uyarı</Rozet> : <Rozet tur="tamam">Uygun</Rozet>}
        </div>
        <p className={stil.adayAlt}>
          <span>İSG-KATİP ID: {isgMetin}</span>
          <span>EKİPNET: {a.ekipnet ? <span className={stil.kod}>{a.ekipnet}</span> : <span className={stil.uyari}>Eksik</span>}</span>
          {u.cakisma.length > 0 && <span className={stil.uyari}>Aynı gün: {u.cakisma.map((p) => `${p.no} · ${tarihNo(p.baslangic)}`).join(", ")}</span>}
          {u.eksik.length > 0 && <span className={stil.uyari}>{u.eksik.join(" · ")}</span>}
        </p>
      </li>
    );
  };

  const ac = () => baslat(async () => {
    const yerel: Record<string, string> = {};
    if (!d.musteri) yerel.musteri = "Müşteri seçilmeli.";
    const r = await planAcEylemi({ tesis: d.tesis, baslangic: d.baslangic, bitis: d.bitis, aciklama: d.aciklama, ekip: ekip.map((k) => ({ personel: k, isgNo: isg[k] ?? "", kaydet: !!kaydet[k] })),
      bilgilendirme: bilgi_, yeniEkipman: yeni.map(({ tur, kod, konum }) => ({ tur, kod, konum })) });
    const hatalar = { ...yerel, ...(r.hatalar ?? {}) };
    setH(hatalar); setGenel(r.genel ?? null);
    if (!r.tamam) {
      const k = Object.keys(hatalar)[0];
      const ek = /^yeniEkipman\.(\d+)\.(tur|kod)$/.exec(k ?? "");
      const odakId = ek ? `pa-yeni-${ek[2]}-${yeni[Number(ek[1])]?.a}` : k?.startsWith("bilgilendirme") ? ID.bilgilendirme : ID[k as keyof typeof ID];
      requestAnimationFrame(() => (k === "ekip" ? document.querySelector<HTMLInputElement>("[data-aday]") : document.getElementById(odakId ?? OZET))?.focus());
      return;
    }
    bildir(`${r.no} açıldı.${r.eposta ? ` ${r.eposta} kişiye e-posta gönderiliyor.` : ""}`);
    router.push(`/planlar/${r.id}`);
  });
  const hataSayisi = Object.keys(h).length;
  const bilgiEkle = (x: string) => {
    const a = x.trim().toLowerCase();
    if (!a) return;
    if (!EPOSTA_BICIMI.test(a) || a.length > 254) { setEpostaHata("Geçerli bir e-posta adresi yazın."); return; }
    if (bilgi_.includes(a)) { setEpostaHata("Bu e-posta listede var."); return; }
    if (bilgi_.length >= EN_COK_BILGI) { setEpostaHata(`En çok ${EN_COK_BILGI} e-posta.`); return; }
    setBilgi([...bilgi_, a]); setYeniEposta(""); setEpostaHata(null);
  };
  const ekipEposta = ekipAday.length;
  /* 444: seçilen denetçilerin e-postası (giriş hesabı) — e-posta ekibe kendiliğinden gider; listede görünür, kaldırılmaz */
  const ekipAdresleri = ekipAday.map((a) => ({ ad: a.ad, eposta: veri.adayEposta[a.id] })).filter((x): x is { ad: string; eposta: string } => !!x.eposta);
  const yeniDegistir = (a: number, alan: "tur" | "kod" | "konum", deger: string) => {
    setYeni(yeni.map((e) => (e.a === a ? { ...e, [alan]: deger } : e)));
    setH((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith("yeniEkipman."))));
  };
  const rehber = [
    ...(bilgi?.musteriEposta ? [[bilgi.musteriEposta, `${m?.kisa ?? "Müşteri"} (müşteri)`, bilgi.musteriEposta] as const] : []),
    ...veri.rehber.map((x) => [x.eposta, x.ad, x.eposta] as const),
  ].filter((x, i, l) => !bilgi_.includes(x[0]) && !ekipAdresleri.some((e) => e.eposta === x[0]) && l.findIndex((y) => y[0] === x[0]) === i);

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
        <FormBolum baslik="3 · Denetçi" id="pa-b3" kaydir={!!d.tesis}>
          {!d.tesis ? <p className={stil.bosSatir}>Önce tesis seçin.</p> : <>
            {veri.adaylar.length ? <ul className={stil.adaylar} aria-label="Denetçiler">{veri.adaylar.map(adaySatiri)}</ul>
              : <p className={stil.bosSatir}>Denetçi yok: Personel&apos;de denetçi rolünde hesabı olan kişi gerekir.</p>}
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
        <FormBolum baslik="4 · Bilgilendirme (e-posta)" id="pa-b5">
          <p className={stil.bosSatir}>Plan açılınca ekipteki denetçilere e-posta kendiliğinden gider{ekipEposta ? ` (${ekipEposta} kişi)` : ""}. Başkalarını da
            bilgilendirmek için e-posta yazın ya da listeden seçin.</p>
          <FormIzgara>
            <Alan id={ID.bilgilendirme} etiket="E-posta ekle" hata={epostaHata ?? h.bilgilendirme ?? Object.entries(h).find(([k]) => k.startsWith("bilgilendirme."))?.[1]}>
              <div className={stil.epostaEkle}>
                <Girdi id={ID.bilgilendirme} type="email" inputMode="email" autoComplete="off" maxLength={254} value={yeniEposta} placeholder="E-posta adresi yazın"
                  hata={!!(epostaHata ?? h.bilgilendirme)} onChange={(e) => { setYeniEposta(e.target.value); setEpostaHata(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); bilgiEkle(yeniEposta); } }} />
                <Tus tur="ikincil" ikon="plus" onClick={() => bilgiEkle(yeniEposta)}>Ekle</Tus>
              </div>
            </Alan>
            <Alan id={ID.rehber} etiket="Listeden ekle">
              <SecimAlani id={ID.rehber} ad="Listeden ekle" deger="" ipucu={rehber.length ? "Kişi seçin" : "Listede kişi yok"} kapali={!rehber.length}
                secenekler={rehber} degistir={(x) => bilgiEkle(x)} />
            </Alan>
          </FormIzgara>
          {(bilgi_.length > 0 || ekipAdresleri.length > 0) && (
            <ul className={stil.epostaListe} aria-label="Bilgilendirilecekler">
              {ekipAdresleri.map((x) => (
                <li key={`ekip-${x.eposta}`} className={stil.epostaEkip} title={`${x.ad} — denetçi; e-posta kendiliğinden gider`}>
                  <span>{x.eposta}</span><span className={stil.epostaEtiket}>denetçi</span>
                </li>
              ))}
              {bilgi_.map((a) => (
                <li key={a}>
                  <span>{a}</span>
                  <button type="button" className={stil.epostaKaldir} aria-label={`${a} kaldır`} onClick={() => setBilgi(bilgi_.filter((x) => x !== a))}><Ikon ad="x" kucuk /></button>
                </li>
              ))}
            </ul>
          )}
        </FormBolum>
        <FormBolum baslik="5 · Ekipmanlar" id="pa-b6" kaydir={!!d.tesis}>
          {!d.tesis ? <p className={stil.bosSatir}>Önce tesis seçin.</p> : <>
            <p className={stil.bosSatir}>Tesiste kayıtlı ekipmanın hepsi plana girer{tesisteki.length ? ` (${tesisteki.length})` : ""}. Kayıtlı olmayanı aşağıya
              satır satır ekleyin: plan açılınca tesise de kaydedilir.</p>
            {tesisteki.length > 0 && <ul className={stil.ekipmanlar} aria-label="Tesisteki ekipmanlar">
              {tesisteki.map((e) => <li key={e.id}><span className={stil.kod}>{e.kod}</span><span>{turAd(e.turId)}{e.konum ? <span className={stil.altMetin}>{e.konum}</span> : null}</span></li>)}
            </ul>}
            {yeni.length > 0 && <ul className={stil.yeniEkipmanlar} aria-label="Elle eklenecek ekipmanlar">
              {yeni.map((e, i) => {
                const kb = e.kod ? kodBicimi(kodNormal(e.kod)) : null, ht = h[`yeniEkipman.${i}.tur`], hk = h[`yeniEkipman.${i}.kod`] ?? (kb?.tur === "hata" ? kb.metin : undefined);
                return (
                  <li key={e.a} className={stil.yeniSatir}>
                    <Alan id={`pa-yeni-tur-${e.a}`} etiket={`${i + 1}. ekipman türü`} zorunlu hata={ht}>
                      <SecimAlani id={`pa-yeni-tur-${e.a}`} ad={`${i + 1}. ekipman türü`} deger={e.tur} ipucu="Tür seçin" gecersiz={!!ht} tanim={ht ? ipucuId(`pa-yeni-tur-${e.a}`) : undefined}
                        secenekler={veri.turler.map((t) => [t.id, t.ad, t.brans === "e" ? "Elektrik" : "Mekanik"] as const)} degistir={(x) => yeniDegistir(e.a, "tur", x)} />
                    </Alan>
                    <Alan id={`pa-yeni-kod-${e.a}`} etiket={`${i + 1}. ekipman kodu`} zorunlu hata={hk}>
                      <Girdi id={`pa-yeni-kod-${e.a}`} value={e.kod} maxLength={20} placeholder="Etiketteki kod" hata={!!hk} onChange={(x) => yeniDegistir(e.a, "kod", x.target.value)} />
                    </Alan>
                    <Alan id={`pa-yeni-konum-${e.a}`} etiket={`${i + 1}. konum`}>
                      <Girdi id={`pa-yeni-konum-${e.a}`} value={e.konum} maxLength={60} placeholder="ör. Kompresör dairesi" onChange={(x) => yeniDegistir(e.a, "konum", x.target.value)} />
                    </Alan>
                    <Tus tur="ikincil" ikon="x" aria-label={`${i + 1}. ekipmanı listeden çıkar`} onClick={() => setYeni(yeni.filter((y) => y.a !== e.a))}>Çıkar</Tus>
                  </li>
                );
              })}
            </ul>}
            <div className={stil.ekleSatiri}>
              <Tus tur="ikincil" ikon="plus" disabled={yeni.length >= 50} onClick={() => { setYeni([...yeni, { a: sayac, tur: "", kod: "", konum: "" }]); setSayac(sayac + 1);
                requestAnimationFrame(() => document.getElementById(`pa-yeni-tur-${sayac}`)?.focus()); }}>Ekipman ekle (elle)</Tus>
            </div>
          </>}
        </FormBolum>
        <FormBolum baslik="6 · Özet ve uyarılar" id="pa-b4" kaydir={!!d.tesis}>
          {!d.tesis ? <p className={stil.bosSatir}>Önce tesis seçin.</p> : <>
            <BilgiListesi>
              <Bilgi etiket="Başlangıç">{gun ? tarihNo(gun) : <DegerYok>Tarih eksik</DegerYok>}</Bilgi>
              <Bilgi etiket="Bitiş">{bit ? tarihNo(bit) : <DegerYok>Tarih eksik</DegerYok>}</Bilgi>
              <Bilgi etiket="Ekip" genis>{ekipAday.length ? ekipAday.map((a) => a.ad).join(", ") : <DegerYok>Seçilmedi</DegerYok>}</Bilgi>
              <Bilgi etiket="E-posta" genis>{ekipAday.length || bilgi_.length ? `Ekip${bilgi_.length ? ` + ${bilgi_.length} bilgilendirme` : ""}` : <DegerYok>Ekip seçilince</DegerYok>}</Bilgi>
              <Bilgi etiket="Ekipman" genis>{toplam ? `${toplam} ekipman · ${kapsam.length} tür · hepsi plana girer${elleTam.length ? ` (${elleTam.length} elle eklendi)` : ""}`
                : <DegerYok>Tesiste kayıtlı ekipman yok; elle ekleyin ya da denetçi sahada ekler</DegerYok>}</Bilgi>
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
