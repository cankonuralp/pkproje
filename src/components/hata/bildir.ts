/* TARAYICI HATASI BİLDİRİMİ (567; 06-HATA-TAKIBI) — yakalanmayan hata, reddedilen söz (HataDinleyici) ve ekranın hata sınırı (error.tsx) buradan
   /api/hata'ya yollanır. Kısma: aynı mesaj 60 sn'de bir; gürültü (bağlantı kopması, iptal, eski sekme …) burada ve sunucuda elenir (aynı liste —
   server/hata/maske.ts, saf); bağlantı yokken gönderilmez (bellekte kalır). Yazmayan ikinci kanal:
   son 20 hata bellekte (window._istemciHatalari — destekte konsoldan okunur). Kayıt yolu HİÇBİR ZAMAN hata üretmez. Kişi / firma gönderilmez
   (sunucu oturumdan ve adresten alır); adres yalnız yol. */

import { gurultuMu } from "../../server/hata/maske";

export interface IstemciHatasi { mesaj: string; yer: string; yigin?: string; adres: string; zaman: string }
declare global { interface Window { _istemciHatalari?: IstemciHatasi[] } }

const son = new Map<string, number>();
const KISMA = 60_000;

function cozumle(hata: unknown): { mesaj: string; yigin?: string } {
  if (hata instanceof Error) return { mesaj: `${hata.name}: ${hata.message}`, yigin: hata.stack };
  if (typeof hata === "string") return { mesaj: hata };
  try { return { mesaj: JSON.stringify(hata)?.slice(0, 300) ?? String(hata) }; } catch { return { mesaj: String(hata) }; }
}

/** hatayı kaydeder (yer: "pencere", "söz", "sınır:<ad>" …) */
export function hataBildir(hata: unknown, yer: string): void {
  try {
    const { mesaj, yigin } = cozumle(hata);
    if (!mesaj || gurultuMu(mesaj)) return;
    const anahtar = mesaj.slice(0, 80), simdi = Date.now();
    if (simdi - (son.get(anahtar) ?? 0) < KISMA) return;
    son.set(anahtar, simdi);
    const k: IstemciHatasi = { mesaj: mesaj.slice(0, 2000), yer: yer.slice(0, 500), ...(yigin ? { yigin: yigin.slice(0, 8000) } : {}),
      adres: location.pathname.slice(0, 500), zaman: new Date(simdi).toISOString() };
    const l = (window._istemciHatalari ??= []);
    l.push(k);
    if (l.length > 20) l.shift();
    if (navigator.onLine === false) return;
    const govde = JSON.stringify({ mesaj: k.mesaj, yer: k.yer, yigin: k.yigin, adres: k.adres });
    if (navigator.sendBeacon?.("/api/hata", new Blob([govde], { type: "application/json" }))) return;
    fetch("/api/hata", { method: "POST", body: govde, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch { /* kayıt yolu sessizce düşer; asıl işi bozmaz */ }
}
