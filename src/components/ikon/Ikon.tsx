/* İkon = SVG (anayasa 2.5), Lucide 1.47.0 alt kümesi, kendi kökenimizden (anayasa 5.2): public/vendor/lucide-1.47.0.
   Adres next.config.ts'te kurulur: alt yol + içerik özeti (dosya değişince tarayıcı eski dosyayı tutmaz — maketteki
   10 dakikalık önbellek dersi, 2026-09-23). Kullanılan her ad dosyada var mı: tests/ikonlar.test.ts. */
import stil from "./Ikon.module.css";

const IKON_ADRESI = process.env.NEXT_PUBLIC_IKON_ADRESI;

export function Ikon({ ad, kucuk = false }: { ad: string; kucuk?: boolean }) {
  return (
    <svg className={kucuk ? `${stil.ikon} ${stil.kucuk}` : stil.ikon} aria-hidden="true" focusable="false">
      <use href={`${IKON_ADRESI}#i-${ad}`} />
    </svg>
  );
}
