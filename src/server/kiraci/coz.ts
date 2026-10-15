/* ══ KİRACI ÇÖZÜMLEME — istek adresinden (Host) firmanın kısa adı ═══════════════════════════════════════════
   Her firma kendi alt alan adında çalışır: <kisa_ad>.probata.com.tr (pkproje.md §8.8). Yerelde <kisa_ad>.localhost.
   Yalnız TEK düzey alt alan kabul edilir; ana alanın kendisi ve derin alt alanlar kiracı değildir (null).
   ⛔ Dile bağlı harf katlama yok (anayasa 5.5): yalnız A–Z küçültülür; kalan her şey kurala uymazsa null. */
import type { FirmaVtKaydi } from "../db/baglanti.ts";
import type { FirmaCozumu } from "../db/merkez.ts";

const ETIKET = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function kiraciAdiCoz(host: string, anaAlan: string): string | null {
  const ad = host.replace(/:\d+$/, "").replace(/[A-Z]/g, (h) => h.toLowerCase());
  const ana = anaAlan.replace(/[A-Z]/g, (h) => h.toLowerCase());
  if (!ad.endsWith("." + ana)) return null;
  const on = ad.slice(0, -(ana.length + 1));
  if (on.includes(".") || !ETIKET.test(on)) return null;
  return on;
}

/* ══ ADRESTEN KİRACI (FIRMA-VT §5.1, FV3) — kısa ad → merkezdeki kayıt (çözücü verilir: istekte önbellekli firma_coz, src/server/db/firma-havuzu.ts
   firmaKaydi). Kiracı YALNIZ adresten (Host); istemcinin gövdesi, sorgusu ya da başka başlığı yetki vermez (src/server/kiraci/istek.ts başlıktan
   yalnız "host"u okur — kilit tests/kiraci-coz.test.ts, tests/yardimci/denetimler.ts kiraciBasligiEksikleri). */

/** isteğin kiracısı: firma + (kendi projeli firmada) merkezdeki bağlantı kaydı. Kaydın parolası ve Storage anahtarı ŞİFRELİ taşınır; çözme yalnız
    havuz kurulurken (src/server/db/firma-havuzu.ts → baglanti.ts kayittanBaglanti). vt yoksa ortak firma (merkez havuzu). */
export interface IstekKiracisi { firmaId: string; kisaAd: string; vt?: FirmaVtKaydi }

/** merkezin çözümünden kiracı (null → null). vt NUMARALANAMAZ (2026-10-15, FV3 incelemesi): kiracı ya da oturum nesnesi yanlışlıkla bir istemci
    bileşenine / eylem yanıtına girse (JSON, React serileştirmesi yalnız numaralanan alanları taşır) şifreli bağlantı kaydı ve altyapı bilgisi
    (havuzcu sunucusu, kapı, ref, veritabanı adı) tarayıcıya gitmez. Yayılan kopya ({...k}) kaydı kaybeder → merkez havuzuna düşer ve veritabanında
    reddedilir (vt_firma_dogrula — kapalı yön, veri karışmaz). */
export function cozumdenKiraci(c: FirmaCozumu | null): IstekKiracisi | null {
  if (!c) return null;
  const k: IstekKiracisi = { firmaId: c.id, kisaAd: c.kisaAd };
  if (c.vt === "kendi") Object.defineProperty(k, "vt", { value: c.kayit, enumerable: false, writable: false, configurable: false });
  return k;
}

/** adresten kiracı: kısa ad kurala uymazsa çözücü hiç sorulmaz; çözüm başka adın kaydını verirse (olmamalı) kullanılmaz */
export async function hosttanKiraci(host: string, anaAlan: string, coz: (kisaAd: string) => Promise<FirmaCozumu | null>): Promise<IstekKiracisi | null> {
  const kisaAd = kiraciAdiCoz(host, anaAlan);
  if (!kisaAd) return null;
  const k = cozumdenKiraci(await coz(kisaAd));
  return k && k.kisaAd === kisaAd ? k : null;
}
