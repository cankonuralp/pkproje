"use client";
/* TEKLİF FORMU (maket teklifler.html #/yeni, #/t/<no>/duzenle — formCiz): Müşteri ve tesis (kayıtlı müşteri: müşteri, tesis, "Başka tesisler" —
   123; kayıtlı olmayan müşteri: ünvan, vergi, adres, il / ilçe, e-posta, telefon, yetkili — 2026-09-27) · Koşullar (geçerlilik gün, KDV %,
   not) · Kalemler (ekipman türü × adet × birim fiyat; tür seçilince fiyat listesinden — 119, satırda değişir; "Tesisteki ekipmandan doldur";
   tutar ve toplam canlı). Numara ve kurallar sunucuda; yalnız taslak düzenlenir. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormBolum, FormEylem, FormIzgara, FormSayfa, Girdi, ipucuId } from "../../../components/form/Form";
import { Kirinti, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { tutar } from "../../../sema/ortak";
import { IL_ILCE } from "../../../tanim/iller";
import { kdvli, para, paraGirdi } from "../sema";
import type { TeklifSecenekleri } from "../server/teklifler";
import { teklifKaydetEylemi } from "./eylemler";
import stil from "./teklifler.module.css";

type Kalem = { tur: string; adet: string; fiyat: string };
type Aday = { unvan: string; vd: string; vno: string; adres: string; il: string; ilce: string; eposta: string; tel: string; yetkili: string };
export interface TeklifFormDegeri {
  tip: "kayitli" | "aday"; musteri: string; tesis: string; ekTesisler: string[]; aday: Aday; gecerlilik: string; kdv: string; notlar: string; kalemler: Kalem[];
  ekipmanlar: { kod: string; tur: string; konum: string; seri: string }[];
}
export const BOS_ADAY: Aday = { unvan: "", vd: "", vno: "", adres: "", il: "", ilce: "", eposta: "", tel: "", yetkili: "" };
const OZET = "tf-ozet";
/* alan kimlikleri tek yerde (Alan ve girdisi aynı kimliği paylaşır — tests/ayni-id.test.ts) */
const FID = { musteri: "f-musteri", tesis: "f-tesis", il: "f-a-il", ilce: "f-a-ilce", gecerlilik: "f-gecerlilik", kdv: "f-kdv", not: "f-not" } as const;
const IL_SECENEK = Object.keys(IL_ILCE).map((x) => [x, x] as const);
const kurus = (f: string) => { const r = tutar.safeParse(f); return r.success && r.data > 0 ? r.data : null; };
/** hata anahtarı → alanın kimliği (odak) */
const alanId = (k: string) => {
  const m = /^kalemler\.(\d+)\.(tur|adet|fiyat)$/.exec(k);
  if (m) return `f-${m[2]}-${m[1]}`;
  if (k.startsWith("aday.")) return `f-a-${k.slice(5)}`;
  return ({ musteri: "f-musteri", tesis: "f-tesis", gecerlilik: "f-gecerlilik", kdv: "f-kdv", notlar: "f-not", kalemler: "f-tur-0" } as Record<string, string>)[k] ?? OZET;
};

export function TeklifFormu({ secenekler, deger, id, surum, no, kopyaKaynak }: {
  secenekler: TeklifSecenekleri; deger: TeklifFormDegeri; id?: string; surum?: number; no?: string; kopyaKaynak?: { id: string; no: string } | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [f, setF] = useState<TeklifFormDegeri>(deger);
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const yaz = (p: Partial<TeklifFormDegeri>) => setF((x) => ({ ...x, ...p }));
  const adayYaz = (k: keyof Aday, v: string) => setF((x) => ({ ...x, aday: { ...x.aday, [k]: v, ...(k === "il" ? { ilce: "" } : {}) } }));
  const kalemYaz = (i: number, p: Partial<Kalem>) => setF((x) => ({ ...x, kalemler: x.kalemler.map((k, j) => (j === i ? { ...k, ...p } : k)) }));
  const m = secenekler.musteriler.find((x) => x.id === f.musteri);
  const tur = new Map(secenekler.turler.map((t) => [t.id, t]));
  const oran = /^\d{1,2}$/.test(f.kdv) ? Number(f.kdv) : 20;
  const ara = f.kalemler.reduce((n, k) => { const a = Number(k.adet), p = kurus(k.fiyat); return n + (a > 0 && p ? a * p : 0); }, 0);
  const seciliTesisler = f.tesis ? [f.tesis, ...f.ekTesisler.filter((x) => x !== f.tesis)] : [];

  /* tesisteki ETKİN ekipmandan doldur (çok tesisli teklifte seçili bütün tesislerden toplanır) */
  const doldur = () => {
    const top = new Map<string, number>();
    for (const tid of seciliTesisler) for (const [t, n] of Object.entries(m?.tesisler.find((x) => x.id === tid)?.ekipman ?? {})) top.set(t, (top.get(t) ?? 0) + n);
    const yeni = [...top.entries()].filter(([t]) => tur.has(t)).map(([t, n]) => ({ tur: t, adet: String(n), fiyat: tur.get(t)?.fiyat ? paraGirdi(tur.get(t)!.fiyat!) : "" }));
    if (!yeni.length) { bildir("Seçili tesislerde kayıtlı etkin ekipman yok."); return; }
    yaz({ kalemler: yeni }); setH({});
    bildir(`${yeni.length} tür, tesisteki kayıtlı ekipmandan eklendi.`);
  };
  const kaydet = () => baslat(async () => {
    const girdi = f.tip === "kayitli"
      ? { tip: "kayitli", musteri: f.musteri, tesis: f.tesis, ekTesisler: f.ekTesisler.filter((x) => x !== f.tesis) }
      : { tip: "aday", aday: f.aday };
    const r = await teklifKaydetEylemi(id ?? null, surum ?? 0, { ...girdi, gecerlilik: f.gecerlilik, kdv: f.kdv, notlar: f.notlar, kalemler: f.kalemler, ekipmanlar: f.ekipmanlar },
      kopyaKaynak?.id ?? null);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) {
      const k = Object.keys(r.hatalar ?? {})[0];
      requestAnimationFrame(() => document.getElementById(k ? alanId(k) : OZET)?.focus());
      return;
    }
    bildir(r.bildirim ?? "Kaydedildi.");
    router.push(`/teklifler/${r.id}`);
  });
  const A = (k: keyof Aday, etiket: string, o: { zorunlu?: boolean; genis?: boolean; tip?: Partial<React.InputHTMLAttributes<HTMLInputElement>> } = {}) => (
    <Alan id={`f-a-${k}`} etiket={etiket} zorunlu={o.zorunlu} genis={o.genis} hata={h[`aday.${k}`]}>
      <Girdi id={`f-a-${k}`} value={f.aday[k]} hata={!!h[`aday.${k}`]} onChange={(e) => adayYaz(k, e.target.value)} {...o.tip} />
    </Alan>
  );
  const hataSayisi = Object.keys(h).length;
  const baslik = no ? `${no} · düzenle` : "Yeni teklif";
  return (
    <form onSubmit={(e) => { e.preventDefault(); kaydet(); }} noValidate>
      <Kirinti ogeler={no ? [["Teklifler", "/teklifler"], [no, `/teklifler/${id}`], ["Düzenle"]] : [["Teklifler", "/teklifler"], ["Yeni teklif"]]} />
      <SayfaBasi baslik={baslik} />
      {kopyaKaynak && <Serit tur="bilgi" ikon="copy">{kopyaKaynak.no} teklifinden kopyalanıyor; yeni numarayla taslak açılır.</Serit>}
      {(hataSayisi > 0 || genel) && <Serit tur="hata" ikon="circle-alert" id={OZET}>{genel ?? `Kaydedilmedi: ${hataSayisi} eksik düzeltilmeli.`}</Serit>}
      <FormSayfa>
        <FormBolum baslik="Müşteri ve tesis" id="tf-b1">
          <div className={stil.tip} role="group" aria-label="Müşteri">
            {([["kayitli", "Kayıtlı müşteri"], ["aday", "Kayıtlı olmayan müşteri"]] as const).map(([k, ad]) => (
              <Tus key={k} tur={f.tip === k ? "birincil" : "ikincil"} aria-pressed={f.tip === k} onClick={() => { yaz({ tip: k }); setH({}); }}>{ad}</Tus>
            ))}
          </div>
          {f.tip === "kayitli" ? (
            <>
              <FormIzgara>
                <Alan id={FID.musteri} etiket="Müşteri" zorunlu genis hata={h.musteri} sonuc={m?.unvan}>
                  <SecimAlani id={FID.musteri} ad="Müşteri" deger={f.musteri} ipucu="Müşteri seçin" gecersiz={!!h.musteri} tanim={ipucuId(FID.musteri)}
                    secenekler={secenekler.musteriler.map((x) => [x.id, x.kisa] as const)} degistir={(x) => { if (x !== f.musteri) yaz({ musteri: x, tesis: "", ekTesisler: [] }); }} />
                </Alan>
                <Alan id={FID.tesis} etiket="Tesis" zorunlu genis hata={h.tesis}
                  sonuc={f.tesis ? `${Object.values(m?.tesisler.find((t) => t.id === f.tesis)?.ekipman ?? {}).reduce((n, x) => n + x, 0)} kayıtlı ekipman` : undefined}>
                  {m ? <SecimAlani id={FID.tesis} ad="Tesis" deger={f.tesis} ipucu="Tesis seçin" gecersiz={!!h.tesis} tanim={ipucuId(FID.tesis)}
                    secenekler={m.tesisler.map((t) => [t.id, t.ad, [t.ilce, t.il].filter(Boolean).join(" / ")] as const)}
                    degistir={(x) => yaz({ tesis: x, ekTesisler: f.ekTesisler.filter((y) => y !== x) })} />
                    : <Girdi id={FID.tesis} readOnly value="Önce müşteri seçin" />}
                </Alan>
              </FormIzgara>
              {m && f.tesis && m.tesisler.length > 1 && (
                <fieldset className={stil.kutular}>
                  <legend className={stil.etiket}>Başka tesisler</legend>
                  {m.tesisler.filter((t) => t.id !== f.tesis).map((t) => (
                    <label key={t.id} className={stil.kutu}>
                      <input type="checkbox" checked={f.ekTesisler.includes(t.id)}
                        onChange={(e) => yaz({ ekTesisler: e.target.checked ? [...f.ekTesisler, t.id] : f.ekTesisler.filter((x) => x !== t.id) })} />
                      <span>{t.ad}</span>
                    </label>
                  ))}
                </fieldset>
              )}
            </>
          ) : (
            <FormIzgara>
              {A("unvan", "Firma ünvanı", { zorunlu: true, genis: true, tip: { maxLength: 160 } })}
              {A("vd", "Vergi dairesi", { tip: { maxLength: 40 } })}
              {A("vno", "Vergi no", { tip: { inputMode: "numeric", maxLength: 11 } })}
              {A("adres", "Adres", { zorunlu: true, genis: true, tip: { maxLength: 160 } })}
              <Alan id={FID.il} etiket="İl" zorunlu hata={h["aday.il"]}>
                <SecimAlani id={FID.il} ad="İl" deger={f.aday.il} secenekler={IL_SECENEK} ipucu="İl seçin" gecersiz={!!h["aday.il"]} degistir={(v) => adayYaz("il", v)} />
              </Alan>
              <Alan id={FID.ilce} etiket="İlçe" hata={h["aday.ilce"]}>
                {f.aday.il
                  ? <SecimAlani id={FID.ilce} ad="İlçe" deger={f.aday.ilce} secenekler={(IL_ILCE[f.aday.il] ?? []).map((x) => [x, x] as const)} ipucu="İlçe seçin"
                      gecersiz={!!h["aday.ilce"]} degistir={(v) => adayYaz("ilce", v)} />
                  : <Girdi id={FID.ilce} readOnly value="Önce il seçin" />}
              </Alan>
              {A("eposta", "E-posta", { tip: { type: "email", inputMode: "email", maxLength: 120 } })}
              {A("tel", "Telefon", { tip: { type: "tel", inputMode: "tel", maxLength: 20 } })}
              {A("yetkili", "Yetkili kişi", { genis: true, tip: { maxLength: 80 } })}
            </FormIzgara>
          )}
        </FormBolum>
        <FormBolum baslik="Koşullar" id="tf-b2">
          <FormIzgara>
            <Alan id={FID.gecerlilik} etiket="Geçerlilik (gün)" zorunlu hata={h.gecerlilik} sonuc="Gönderildiği günden">
              <Girdi id={FID.gecerlilik} value={f.gecerlilik} inputMode="numeric" maxLength={3} placeholder="ör. 30" hata={!!h.gecerlilik} mesajli onChange={(e) => yaz({ gecerlilik: e.target.value })} />
            </Alan>
            <Alan id={FID.kdv} etiket="KDV (%)" zorunlu hata={h.kdv}>
              <Girdi id={FID.kdv} value={f.kdv} inputMode="numeric" maxLength={2} hata={!!h.kdv} onChange={(e) => yaz({ kdv: e.target.value })} />
            </Alan>
            <Alan id={FID.not} etiket="Not" genis hata={h.notlar}>
              <Girdi id={FID.not} value={f.notlar} maxLength={300} placeholder="Ödeme, ulaşım, ek koşullar" hata={!!h.notlar} onChange={(e) => yaz({ notlar: e.target.value })} />
            </Alan>
          </FormIzgara>
        </FormBolum>
        <FormBolum baslik="Kalemler" id="tf-b3">
          {f.kalemler.map((k, i) => {
            const a = Number(k.adet), p = kurus(k.fiyat);
            return (
              <div className={stil.kalem} key={i}>
                <Alan id={`f-tur-${i}`} etiket="Ekipman türü" hata={h[`kalemler.${i}.tur`]}>
                  <SecimAlani id={`f-tur-${i}`} ad={`Ekipman türü ${i + 1}`} deger={k.tur} ipucu="Tür seçin" gecersiz={!!h[`kalemler.${i}.tur`]}
                    secenekler={secenekler.turler.map((t) => [t.id, t.ad, t.fiyat !== null ? para(t.fiyat) : "fiyat listesinde yok"] as const)}
                    degistir={(v) => kalemYaz(i, { tur: v, ...(!k.fiyat && tur.get(v)?.fiyat ? { fiyat: paraGirdi(tur.get(v)!.fiyat!) } : {}) })} />
                </Alan>
                <Alan id={`f-adet-${i}`} etiket="Adet" hata={h[`kalemler.${i}.adet`]}>
                  <Girdi id={`f-adet-${i}`} value={k.adet} inputMode="numeric" maxLength={3} hata={!!h[`kalemler.${i}.adet`]} onChange={(e) => kalemYaz(i, { adet: e.target.value })} />
                </Alan>
                <Alan id={`f-fiyat-${i}`} etiket="Birim fiyat (TL)" hata={h[`kalemler.${i}.fiyat`]}>
                  <Girdi id={`f-fiyat-${i}`} value={k.fiyat} inputMode="decimal" maxLength={14} hata={!!h[`kalemler.${i}.fiyat`]} onChange={(e) => kalemYaz(i, { fiyat: e.target.value })} />
                </Alan>
                <div><p className={stil.kalemEtiket}>Tutar</p><p className={stil.kalemTutar} aria-live="polite">{a > 0 && p ? para(a * p) : "—"}</p></div>
                <Tus tur="ikincil" ikon="x" disabled={f.kalemler.length === 1} aria-label={`Kalem ${i + 1} kaldır`}
                  onClick={() => { yaz({ kalemler: f.kalemler.filter((_, j) => j !== i) }); setH({}); }}>Kaldır</Tus>
              </div>
            );
          })}
          {h.kalemler && <p className={stil.hata}>{h.kalemler}</p>}
          <div className={stil.eylemler}>
            {f.tip === "kayitli" && <Tus tur="ikincil" ikon="list-checks" disabled={!f.tesis} onClick={doldur}>Tesisteki ekipmandan doldur</Tus>}
            <Tus tur="ikincil" ikon="plus" onClick={() => yaz({ kalemler: [...f.kalemler, { tur: "", adet: "1", fiyat: "" }] })}>Kalem ekle</Tus>
          </div>
          {f.ekipmanlar.length > 0 && <p className={stil.ipucu}>Excel&apos;den yüklenen ekipman listesi: <b>{f.ekipmanlar.length}</b> ekipman; teklifle saklanır.</p>}
          <dl className={stil.toplam} aria-live="polite">
            <div><dt>Ara toplam</dt><dd>{para(ara)}</dd></div>
            <div><dt>KDV %{oran}</dt><dd>{para(kdvli(ara, oran) - ara)}</dd></div>
            <div><dt>Genel toplam</dt><dd><b>{para(kdvli(ara, oran))}</b></dd></div>
          </dl>
        </FormBolum>
      </FormSayfa>
      <FormEylem>
        <TusBaglanti href={id ? `/teklifler/${id}` : "/teklifler"}>Vazgeç</TusBaglanti>
        <Tus type="submit" ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined}>Kaydet</Tus>
      </FormEylem>
    </form>
  );
}
