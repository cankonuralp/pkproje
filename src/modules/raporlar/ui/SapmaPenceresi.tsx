"use client";
/* SAPMA GEREKÇESİ PENCERESİ (2026-11-12, göç 0129; maket yerel/maket/turkak-modeli.html 2. bölüm "Onaya göndermeden önce" — pkproje.md §11 K6):
   ölçümlü rapor onaya gönderilirken sunucunun bulduğu sapmalar (kısa süre, çakışan saat, tesisler arası geçiş, plan günü dışı, saat dışı fotoğraf)
   tek tek listelenir; her biri için gerekçe (en az 10 karakter) yazılmadan gönderilmez. Sapmayı ve kuralı sunucu belirler (../sapma.ts); pencere
   yalnız gerekçeyi toplar. Gerekçeler raporda saklanır, teknik yönetici onay ekranında görür. */
import { useState } from "react";
import { Alan, ipucuId } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { SAPMA_GEREKCE_EN_AZ } from "../sapma";
import stil from "./raporlar.module.css";

const id = (tur: string) => `r-sapma-${tur}`;

export function SapmaPenceresi({ sapmalar, mesgul, onKapat, gonder }: {
  sapmalar: readonly { tur: string; metin: string }[]; mesgul: boolean; onKapat: () => void;
  gonder: (gerekceler: Record<string, string>) => void;
}) {
  const [g, setG] = useState<Record<string, string>>({});
  const [eksik, setEksik] = useState<Set<string>>(new Set());
  const yolla = () => {
    const e = new Set(sapmalar.filter((s) => (g[s.tur] ?? "").trim().length < SAPMA_GEREKCE_EN_AZ).map((s) => s.tur));
    setEksik(e);
    if (e.size) { document.getElementById(id([...e][0]!))?.focus(); return; }
    gonder(Object.fromEntries(sapmalar.map((s) => [s.tur, (g[s.tur] ?? "").trim()])));
  };
  return (
    <Pencere acik baslik="Onaya göndermeden önce" onKapat={() => { if (!mesgul) onKapat(); }} odak={`#${id(sapmalar[0]?.tur ?? "")}`}
      alt={<>
        <Tus tur="ikincil" disabled={mesgul} onClick={onKapat}>Vazgeç</Tus>
        <Tus ikon="send" disabled={mesgul} onClick={yolla}>Gerekçelerle gönder</Tus>
      </>}>
      {sapmalar.map((s) => {
        const h = eksik.has(s.tur) ? `Gerekçe en az ${SAPMA_GEREKCE_EN_AZ} karakter olmalı.` : undefined;
        return (
          <div key={s.tur} className={stil.sapma}>
            <Serit tur="uyari" ikon="triangle-alert">{s.metin}</Serit>
            <Alan id={id(s.tur)} etiket="Gerekçe" zorunlu hata={h}>
              <textarea id={id(s.tur)} className={stil.metinAlan} maxLength={500} value={g[s.tur] ?? ""} readOnly={mesgul} aria-invalid={!!h || undefined}
                aria-describedby={h ? ipucuId(id(s.tur)) : undefined}
                onChange={(e) => { setG({ ...g, [s.tur]: e.target.value }); if (eksik.size) setEksik(new Set()); }} />
            </Alan>
          </div>
        );
      })}
    </Pencere>
  );
}
