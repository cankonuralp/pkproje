"use client";
/* ARAÇ PENCERELERİ (maket araclar.html kayitCiz / pencereCiz / tutanak-goster): araç ekle / düzenle (plaka eşsiz; belge bitişleri isteğe
   bağlı; kayıttaki kilometre yalnız eklerken) · teslim tutanağı (araç · teslim alan: kişi ya da depo · tarih-saat · kilometre · yakıt · araçta
   olanlar · hasar · açı açı fotoğraf; işaretlenmeyen kalem tutanağa "yok", fotoğrafsız açı uyarı — kayıt yine yapılır) · tutanak görünümü.
   Teslim eden sunucuda o anki "kimde"den. Karar sunucuda. Teslim alan kişiyse tutanağın PDF'i onun imzasına gider (Onaylar › Diğer belgeler,
   342); tutanak görünümünde imzanın durumu ve PDF. */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { GizliResim } from "../../../components/gizli-resim/GizliResim";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { simdiIso } from "../../../components/secim/tarih";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { BELGE_DURUM } from "../../onaylar/sema";
import { ARAC_FOTO, ARAC_KONTROL, ARAC_TURLERI, kmYaz, seviyeAd, YAKIT_SEVIYE, YAKITLAR } from "../sema";
import type { AracSatiri, TutanakSatiri } from "../server/araclar";
import { aracKaydetEylemi, tutanakKaydetEylemi } from "./eylemler";
import { kimdeAd, zamanYaz } from "./ortak";
import stil from "./araclar.module.css";

const A_ALAN = ["plaka", "tur", "marka", "model", "yil", "yakit", "ilkKm", "bakimKm", "muayene", "sigorta", "kasko"] as const;
type AAlan = (typeof A_ALAN)[number];
/* alan kimlikleri tek yerde (etiket for= ile girdi id= aynı sabitten — çift id kilidi) */
const AID = Object.fromEntries(A_ALAN.map((k) => [k, `aw-${k}`])) as Record<AAlan, string>;
const TID = { arac: "tw-arac", alan: "tw-alan", zaman: "tw-zaman", km: "tw-km", yakit: "tw-yakit", hasar: "tw-hasar" } as const;

export interface AracDegeri { id: string; surum: number; plaka: string; tur: string; marka: string; model: string; yil: number; yakit: string; bakimKm: number | null;
  muayene: string | null; sigorta: string | null; kasko: string | null }

export function AracPenceresi({ kapat, arac }: { kapat: () => void; arac?: AracDegeri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState<Record<AAlan, string>>({
    plaka: arac?.plaka ?? "", tur: arac?.tur ?? "", marka: arac?.marka ?? "", model: arac?.model ?? "", yil: arac ? String(arac.yil) : "", yakit: arac?.yakit ?? "",
    ilkKm: "", bakimKm: arac?.bakimKm != null ? String(arac.bakimKm) : "", muayene: arac?.muayene ?? "", sigorta: arac?.sigorta ?? "", kasko: arac?.kasko ?? "",
  });
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const kaydet = () => baslat(async () => {
    const r = await aracKaydetEylemi(arac?.id ?? null, arac?.surum ?? 0, d);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) { const k = Object.keys(r.hatalar ?? {})[0] as AAlan | undefined; if (k && AID[k]) requestAnimationFrame(() => document.getElementById(AID[k])?.focus()); return; }
    kapat();
    const plaka = d.plaka.toLocaleUpperCase("tr").replace(/\s+/g, " ").trim();
    if (arac) { bildir(`${plaka} bilgileri kaydedildi.`); router.refresh(); } else { bildir(`${plaka} eklendi; depoda. Teslim tutanağıyla kişiye verilir.`); router.push(`/araclar/${r.id}`); }
  });
  const G = (k: "plaka" | "marka" | "model" | "yil" | "ilkKm" | "bakimKm", etiket: string, o: { zorunlu?: boolean; sonuc?: string; tip?: React.InputHTMLAttributes<HTMLInputElement> } = {}) => (
    <Alan id={AID[k]} etiket={etiket} zorunlu={o.zorunlu} hata={h[k]} sonuc={o.sonuc}>
      <Girdi id={AID[k]} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} hata={!!h[k]} mesajli={!!o.sonuc} {...o.tip} />
    </Alan>
  );
  const T = (k: "muayene" | "sigorta" | "kasko", etiket: string) => (
    <Alan id={AID[k]} etiket={etiket} hata={h[k]} sonuc="İsteğe bağlı; boşsa takip edilmez.">
      <TarihAlani id={AID[k]} ad={etiket} deger={d[k]} degistir={(x) => setD({ ...d, [k]: x })} tanim={ipucuId(AID[k])} />
    </Alan>
  );
  const sayisal = { inputMode: "numeric" as const, maxLength: 9 };
  return (
    <Pencere acik baslik={arac ? `Aracı düzenle · ${arac.plaka}` : "Araç ekle"} onKapat={kapat} odak={`#${AID.plaka}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>{arac ? "Kaydet" : "Aracı ekle"}</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <FormIzgara>
        {G("plaka", "Plaka", { zorunlu: true, sonuc: "34 ABC 123 biçiminde; firmada eşsiz.", tip: { maxLength: 12, autoCapitalize: "characters" } })}
        <Alan id={AID.tur} etiket="Araç türü" zorunlu hata={h.tur}>
          <SecimAlani id={AID.tur} ad="Araç türü" deger={d.tur} secenekler={ARAC_TURLERI.map((t) => [t, t] as const)} ipucu="Tür seçin" gecersiz={!!h.tur}
            tanim={h.tur ? ipucuId(AID.tur) : undefined} degistir={(x) => setD({ ...d, tur: x })} />
        </Alan>
        {G("marka", "Marka", { zorunlu: true, tip: { maxLength: 40 } })}
        {G("model", "Model", { zorunlu: true, tip: { maxLength: 40 } })}
        {G("yil", "Model yılı", { zorunlu: true, tip: { inputMode: "numeric", maxLength: 4 } })}
        <Alan id={AID.yakit} etiket="Yakıt" zorunlu hata={h.yakit}>
          <SecimAlani id={AID.yakit} ad="Yakıt" deger={d.yakit} secenekler={YAKITLAR} ipucu="Yakıt seçin" gecersiz={!!h.yakit}
            tanim={h.yakit ? ipucuId(AID.yakit) : undefined} degistir={(x) => setD({ ...d, yakit: x })} />
        </Alan>
        {!arac && G("ilkKm", "Kilometre (kayıt anında)", { sonuc: "İsteğe bağlı; haftalık kilometre bundan küçük yazılamaz.", tip: sayisal })}
        {G("bakimKm", "Sonraki bakım kilometresi", { sonuc: "İsteğe bağlı; 1.000 km kala uyarır.", tip: sayisal })}
        {T("muayene", "Muayene bitişi")}
        {T("sigorta", "Trafik sigortası bitişi")}
        {T("kasko", "Kasko bitişi")}
      </FormIzgara>
    </Pencere>
  );
}

export function TutanakPenceresi({ kapat, araclar, kisiler, arac = "", surucu = false }:
  { kapat: () => void; araclar: AracSatiri[]; kisiler: { id: string; ad: string }[]; arac?: string; surucu?: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [d, setD] = useState({ arac: arac || (surucu ? araclar[0]?.id ?? "" : ""), alan: surucu ? "depo" : "", zaman: simdiIso().slice(0, 16), km: "", yakit: "", hasar: "" });
  const [kontrol, setKontrol] = useState<Set<string>>(new Set());
  const [fotolu, setFotolu] = useState<Set<string>>(new Set());
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const v = araclar.find((x) => x.id === d.arac);
  const eksik = ARAC_KONTROL.length - kontrol.size, fotosuz = ARAC_FOTO.length - fotolu.size;
  const kaydet = () => baslat(async () => {
    const f = new FormData(form.current!);
    for (const [k, x] of Object.entries(d)) f.set(k, x);
    f.delete("kontrol"); for (const k of kontrol) f.append("kontrol", k);
    const r = await tutanakKaydetEylemi(f);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) {
      const k = Object.keys(r.hatalar ?? {})[0];
      const id = k ? (k.startsWith("foto-") ? `tw-${k}` : TID[k as keyof typeof TID]) : null;
      if (id) requestAnimationFrame(() => document.getElementById(id)?.focus());
      return;
    }
    const alanAd = d.alan === "depo" ? "Depo" : kisiler.find((k) => k.id === d.alan)?.ad ?? "";
    kapat();
    bildir(`${v?.plaka ?? ""}: ${v ? kimdeAd(v.kimde) : ""} → ${alanAd}. Tutanak ${r.ileti ?? ""} kaydedildi, zimmet kaydı oluştu${d.alan === "depo" ? "." : r.imzaya ? `; ${alanAd} Onaylar'dan imzalar.` : `; ${alanAd} kişisinin giriş hesabı yok, tutanak imzaya gönderilmedi.`}`);
    router.push(surucu && d.alan !== "depo" ? "/araclar" : `/araclar/${d.arac}`);
    router.refresh();
  });
  return (
    <Pencere acik baslik="Araç teslim tutanağı" onKapat={kapat} odak={surucu ? `#${TID.alan}` : `#${TID.arac}`} genis
      alt={<><Tus tur="ikincil" onClick={kapat}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={kaydet}>Tutanağı kaydet</Tus></>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      <form ref={form} onSubmit={(e) => { e.preventDefault(); kaydet(); }}>
        <FormIzgara>
          <Alan id={TID.arac} etiket="Araç" zorunlu hata={h.arac} sonuc={v ? `Şu an: ${kimdeAd(v.kimde)}${v.km != null ? ` · son ${kmYaz(v.km)} km` : ""}` : undefined}>
            <SecimAlani id={TID.arac} ad="Araç" deger={d.arac} ipucu="Araç seçin" gecersiz={!!h.arac} tanim={ipucuId(TID.arac)} kapali={surucu && araclar.length < 2}
              secenekler={araclar.map((x) => [x.id, `${x.plaka} · ${x.tur}`, kimdeAd(x.kimde)] as const)} degistir={(x) => setD({ ...d, arac: x })} />
          </Alan>
          <Alan id={TID.alan} etiket="Teslim alan" zorunlu hata={h.alan} sonuc={`Teslim eden: ${v ? kimdeAd(v.kimde) : "—"}`}>
            <SecimAlani id={TID.alan} ad="Teslim alan" deger={d.alan} ipucu="Kişi ya da depo" gecersiz={!!h.alan} tanim={ipucuId(TID.alan)}
              secenekler={[["depo", "Depo", "iade"] as const, ...kisiler.map((k) => [k.id, k.ad] as const)]} degistir={(x) => setD({ ...d, alan: x })} />
          </Alan>
          <Alan id={TID.zaman} etiket="Tarih ve saat" zorunlu hata={h.zaman}>
            <TarihAlani id={TID.zaman} ad="Tarih ve saat" saat deger={d.zaman} degistir={(x) => setD({ ...d, zaman: x })} tanim={h.zaman ? ipucuId(TID.zaman) : undefined} />
          </Alan>
          <Alan id={TID.km} etiket="Kilometre" zorunlu hata={h.km}>
            <Girdi id={TID.km} value={d.km} inputMode="numeric" maxLength={9} hata={!!h.km} onChange={(e) => setD({ ...d, km: e.target.value })} />
          </Alan>
          <Alan id={TID.yakit} etiket="Yakıt seviyesi" zorunlu hata={h.yakit}>
            <SecimAlani id={TID.yakit} ad="Yakıt seviyesi" deger={d.yakit} secenekler={YAKIT_SEVIYE} ipucu="Seviye seçin" gecersiz={!!h.yakit}
              tanim={h.yakit ? ipucuId(TID.yakit) : undefined} degistir={(x) => setD({ ...d, yakit: x })} />
          </Alan>
        </FormIzgara>
        <fieldset className={stil.kutular}>
          <legend className={stil.etiket}>Araçta olanlar</legend>
          {ARAC_KONTROL.map(([k, ad]) => (
            <label key={k} className={stil.kutu}>
              <input type="checkbox" checked={kontrol.has(k)} onChange={(e) => { const s = new Set(kontrol); if (e.target.checked) s.add(k); else s.delete(k); setKontrol(s); }} />
              <span>{ad}</span>
            </label>
          ))}
        </fieldset>
        {eksik > 0 && <p className={stil.ipucu}>İşaretlenmeyen {eksik} kalem tutanağa “yok” diye yazılır.</p>}
        <FormIzgara>
          <Alan id={TID.hasar} etiket="Hasar ve notlar" genis hata={h.hasar}>
            <textarea id={TID.hasar} className={stil.notAlan} maxLength={400} value={d.hasar} onChange={(e) => setD({ ...d, hasar: e.target.value })} />
          </Alan>
        </FormIzgara>
        <p className={stil.etiket}>Fotoğraflar</p>
        <ul className={stil.acilar}>
          {ARAC_FOTO.map(([k, ad]) => (
            <li key={k}>
              <label htmlFor={`tw-foto-${k}`}>{ad}</label>
              <input id={`tw-foto-${k}`} className={stil.dosya} name={`foto-${k}`} type="file" accept="image/jpeg,image/png" capture="environment"
                aria-describedby={h[`foto-${k}`] ? `tw-foto-${k}-hata` : undefined}
                onChange={(e) => { const s = new Set(fotolu); if (e.target.files?.length) s.add(k); else s.delete(k); setFotolu(s); }} />
              {h[`foto-${k}`] && <span id={`tw-foto-${k}-hata`} className={stil.ipucuHata}>{h[`foto-${k}`]}</span>}
            </li>
          ))}
        </ul>
        {fotosuz > 0 && <p className={stil.ipucu}>{fotosuz} açı fotoğrafsız; tutanak yine kaydedilir.</p>}
      </form>
      {d.alan && d.alan !== "depo" && <Serit tur="bilgi" ikon="info">Kaydedince zimmet kaydı oluşur; tutanak imzaya gider: {kisiler.find((k) => k.id === d.alan)?.ad ?? ""} › Onaylar › Diğer belgeler.</Serit>}
    </Pencere>
  );
}

export function TutanakGorunumu({ t, kapat }: { t: TutanakSatiri; kapat: () => void }) {
  const kontrol = t.kontrol ? new Set(t.kontrol) : null;
  return (
    <Pencere acik baslik={`Araç teslim tutanağı · ${t.plaka}${t.no ? ` · ${t.no}` : ""}`} onKapat={kapat} genis
      alt={<>{t.no && <a className={tusSinifi("ikincil")} href={`/araclar/tutanak/${t.hareketId}/pdf`} download><Ikon ad="file-text" kucuk />PDF</a>}<Tus tur="ikincil" onClick={kapat}>Kapat</Tus></>}>
      <BilgiListesi>
        <Bilgi etiket="Tarih">{zamanYaz(t.zaman)}</Bilgi>
        <Bilgi etiket="Teslim eden → alan" genis>{t.eden} → {t.alan}</Bilgi>
        <Bilgi etiket="Kilometre">{t.km != null ? kmYaz(t.km) : "—"}</Bilgi>
        <Bilgi etiket="Yakıt">{t.yakit ? seviyeAd(t.yakit) : "Kayıtta yok"}</Bilgi>
        <Bilgi etiket="Teslim alanın imzası">{t.imza ? BELGE_DURUM[t.imza][0] : t.alan === "Depo" ? "Depoya iade (imza yok)" : "Gönderilmedi"}</Bilgi>
        <Bilgi etiket="Hasar ve notlar" genis="tam">{t.hasar ?? "Yok"}</Bilgi>
        <Bilgi etiket="Araçta olanlar" genis="tam">
          {kontrol ? <ul className={stil.liste}>{ARAC_KONTROL.map(([k, ad]) => <li key={k}>{ad}: {kontrol.has(k) ? "var" : "yok"}</li>)}</ul> : "Kayıtta yok"}
        </Bilgi>
      </BilgiListesi>
      {t.fotolar.length > 0
        ? <div className={stil.fotolar}>{t.fotolar.map((f, i) => {
          const ad = ARAC_FOTO.find((x) => x[0] === f.aci)?.[1] ?? `Fotoğraf ${i + 1}`;
          return <span key={f.id} className={stil.fotoKap}><GizliResim dosyaId={f.id} alt={`${t.plaka} ${ad}`} className={stil.foto} />{ad}</span>;
        })}</div>
        : <p className={stil.bosSatir}>Fotoğraf yok.</p>}
    </Pencere>
  );
}
