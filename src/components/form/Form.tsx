/* FORM SAYFASI — tek üreticiler (kalıp 20 b; maketteki .a-form-sayfa / .a-form-bolum / .a-form / MK.alan / MK.girdi / .a-form-eylem).
   · sayfa: başlıklı bölüm kartları kabı doldurur (kalıp 10: genişlik alanlara değil BÖLÜMLERE gider; bölüm en az 440 px, sığmazsa tek sütun);
   · ızgara: iki sütun (telefonda tek), genis alan tam satır;
   · alan: etiket (+ "zorunlu"), girdi, altında YALNIZ hata, kaydı durdurmayan uyarı ya da canlı sonuç (reisim 2026-09-26: "alt tarafa
     yazılmış küçük mesajlar istemiyorum" — açıklayıcı ipucu yok); mesaj girdiye aria-describedby ile bağlı (id-ipucu);
   · eylem çubuğu: sağa yaslı; telefonda altta yapışkan (kalıp 2). */
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import stil from "./Form.module.css";

export function FormSayfa({ children }: { children: ReactNode }) {
  return <div className={stil.sayfa}>{children}</div>;
}

/** genis: sayfa ızgarasında tam satır (maket a-alan-genis — ör. teklif kalemleri) · 444 kaydir: uzun içerik bölümün kendi içinde kayar
    (yan yana dizilen genişlikte en çok 440 px; klavyeyle de kaydırılır — odaklanabilir bölge) */
export function FormBolum({ baslik, children, id, genis = false, kaydir = false }: { baslik: string; children: ReactNode; id?: string; genis?: boolean; kaydir?: boolean }) {
  return (
    <section className={genis ? `${stil.bolum} ${stil.genis}` : stil.bolum} aria-labelledby={id ? `${id}-baslik` : undefined} id={id}>
      <h2 id={id ? `${id}-baslik` : undefined}>{baslik}</h2>
      {kaydir ? <div className={stil.kaydir} role="region" tabIndex={0} aria-label={`${baslik} · liste`}>{children}</div> : children}
    </section>
  );
}

export function FormIzgara({ children }: { children: ReactNode }) {
  return <div className={stil.izgara}>{children}</div>;
}

/** mesajın id'si: girdinin aria-describedby'ı buna bağlanır */
export const ipucuId = (id: string) => `${id}-ipucu`;

export function Alan({ id, etiket, children, zorunlu, hata, uyari, sonuc, genis = false }: {
  /** girdinin id'si (etiket for=) */
  id: string;
  etiket: string;
  children: ReactNode;
  zorunlu?: boolean | string;
  hata?: ReactNode;
  uyari?: ReactNode;
  sonuc?: ReactNode;
  genis?: boolean;
}) {
  const mesaj = hata ? <p className={`${stil.ipucu} ${stil.hata}`} id={ipucuId(id)}>{hata}</p>
    : uyari ? <p className={stil.ipucu} id={ipucuId(id)}><span className={stil.dikkat}>{uyari}</span></p>
    : sonuc ? <p className={stil.ipucu} id={ipucuId(id)}>{sonuc}</p> : null;
  return (
    <div className={genis ? `${stil.alan} ${stil.genis}` : stil.alan}>
      <label className={stil.etiket} htmlFor={id}>
        {etiket}{zorunlu && <> <span className={stil.zorunlu}>{zorunlu === true ? "zorunlu" : zorunlu}</span></>}
      </label>
      {children}
      {mesaj}
    </div>
  );
}

/** yazı alanı (kalıp 3: tür veriye göre — inputMode / autoComplete çağıranın); hata varsa geçersiz işaretli, mesajına bağlı */
export function Girdi({ id, hata = false, mesajli = false, className, ...ozellik }:
  { id: string; hata?: boolean; mesajli?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <input id={id} className={[stil.girdi, className].filter(Boolean).join(" ")} autoComplete="off" aria-invalid={hata || undefined}
    aria-describedby={hata || mesajli ? ipucuId(id) : undefined} {...ozellik} />;
}

export function FormEylem({ children, not }: { children: ReactNode; not?: ReactNode }) {
  /* data-alt-cubuk (380): telefonda altta yapışkan — S.A.Y düğmesi onun üstünde durur */
  return <div className={stil.eylem} data-alt-cubuk="telefon">{not && <span className={stil.eylemNot}>{not}</span>}{children}</div>;
}

/** iki / üç seçenekli seçim (Kapalı · Açık …): yerinde düğmeler, seçilen basılı; seçim yeni alan açmaz (maket a-pk-segment). 2026-10-25: Firma
    ayarlarından ortak bileşene (Yönetim › Firma'nın yapay zekâ bölümü de kullanır) */
export function Segment<K extends string>({ ad, deger, secenekler, kapali, degistir }: {
  ad: string; deger: K; secenekler: readonly (readonly [K, string])[]; kapali: boolean; degistir: (x: K) => void;
}) {
  const id = useId();
  return (
    <div className={stil.segmentKap}>
      <p className={stil.etiket} id={id}>{ad}</p>
      <div className={stil.segment} role="radiogroup" aria-labelledby={id}>
        {secenekler.map(([k, a]) => (
          <button key={k || "bos"} type="button" role="radio" aria-checked={deger === k} className={stil.segmentTus} disabled={kapali} onClick={() => degistir(k)}>{a}</button>
        ))}
      </div>
    </div>
  );
}
