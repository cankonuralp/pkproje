"use client";
/* E-POSTA ALICILARI — tek üretici (2026-11-09; sözleşme ve teklif gönderme pencereleri): satır satır adres, Kaldır, Alıcı ekle (en çok n). Sunucunun "kime.N"
   hatası dolu satırların sırasıyla gelir; aliciHatalari girdinin satırına çevirir. */
import { Alan, Girdi } from "../form/Form";
import { Tus } from "../tus/Tus";
import stil from "./eposta.module.css";

export const aliciId = (on: string, i: number) => `${on}-kime-${i}`;

/** boş satırlar gitmez: gönderilecek adresler ve girdideki satırları */
export const doluAlicilar = (l: readonly string[]) => l.map((x, i) => [x.trim(), i] as const).filter(([x]) => x);
/** sunucunun hatalarını satırlara dağıtır */
export function aliciHatalari(dolu: readonly (readonly [string, number])[], hatalar: Readonly<Record<string, string>>): Record<number, string> {
  const yeni: Record<number, string> = {};
  for (const [k, m] of Object.entries(hatalar)) {
    if (k !== "kime" && !k.startsWith("kime.")) continue;
    const n = /^kime\.(\d+)$/.exec(k);
    const satir = n ? dolu[Number(n[1])]?.[1] ?? dolu[0]?.[1] ?? 0 : dolu[0]?.[1] ?? 0;
    yeni[satir] ??= m;
  }
  return yeni;
}

export function Alicilar({ on, liste, hatalar, enCok, degistir, hataTemizle }: {
  on: string; liste: readonly string[]; hatalar: Readonly<Record<number, string>>; enCok: number; degistir: (l: string[]) => void; hataTemizle: (h: Record<number, string>) => void;
}) {
  const odak = (i: number) => requestAnimationFrame(() => document.getElementById(aliciId(on, i))?.focus());
  const sinirId = `${on}-sinir`;
  return (
    <>
      {liste.map((x, i) => (
        <Alan key={i} id={aliciId(on, i)} etiket={liste.length > 1 ? `Alıcı ${i + 1}` : "Alıcı"} zorunlu={i === 0} hata={hatalar[i]}>
          <div className={stil.alici}>
            <Girdi id={aliciId(on, i)} type="email" inputMode="email" maxLength={254} value={x} hata={!!hatalar[i]} placeholder="E-posta adresi"
              onChange={(e) => { degistir(liste.map((y, j) => (j === i ? e.target.value : y))); if (hatalar[i]) { const k = { ...hatalar }; delete k[i]; hataTemizle(k); } }} />
            {liste.length > 1 && <Tus tur="ikincil" ikon="x" onClick={() => { degistir(liste.filter((_, j) => j !== i)); hataTemizle({}); odak(Math.max(0, i - 1)); }} aria-label={`Alıcı ${i + 1} kaldır`}>Kaldır</Tus>}
          </div>
        </Alan>
      ))}
      <div className={stil.alttaki}>
        <Tus tur="ikincil" ikon="plus" disabled={liste.length >= enCok} aria-describedby={liste.length >= enCok ? sinirId : undefined}
          onClick={() => { degistir([...liste, ""]); odak(liste.length); }}>Alıcı ekle</Tus>
        {liste.length >= enCok && <span id={sinirId} className={stil.ipucu}>En çok {enCok} alıcı.</span>}
      </div>
    </>
  );
}
