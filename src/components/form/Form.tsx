/* FORM SAYFASI — tek üreticiler (kalıp 20 b; maketteki .a-form-sayfa / .a-form-bolum / .a-form / MK.alan / MK.girdi / .a-form-eylem).
   · sayfa: başlıklı bölüm kartları kabı doldurur (kalıp 10: genişlik alanlara değil BÖLÜMLERE gider; bölüm en az 440 px, sığmazsa tek sütun);
   · ızgara: iki sütun (telefonda tek), genis alan tam satır;
   · alan: etiket (+ "zorunlu"), girdi, altında YALNIZ hata, kaydı durdurmayan uyarı ya da canlı sonuç (reisim 2026-09-26: "alt tarafa
     yazılmış küçük mesajlar istemiyorum" — açıklayıcı ipucu yok); mesaj girdiye aria-describedby ile bağlı (id-ipucu);
   · eylem çubuğu: sağa yaslı; telefonda altta yapışkan (kalıp 2). */
import type { InputHTMLAttributes, ReactNode } from "react";
import stil from "./Form.module.css";

export function FormSayfa({ children }: { children: ReactNode }) {
  return <div className={stil.sayfa}>{children}</div>;
}

/** genis: sayfa ızgarasında tam satır (maket a-alan-genis — ör. teklif kalemleri) */
export function FormBolum({ baslik, children, id, genis = false }: { baslik: string; children: ReactNode; id?: string; genis?: boolean }) {
  return (
    <section className={genis ? `${stil.bolum} ${stil.genis}` : stil.bolum} aria-labelledby={id ? `${id}-baslik` : undefined} id={id}>
      <h2 id={id ? `${id}-baslik` : undefined}>{baslik}</h2>{children}
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
