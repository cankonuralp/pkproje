/* MUHASEBE › MAAŞ BORDROSU GÖNDER (333; maket muhasebe.html BB5 — bgAylar, bgGitti, bgHazir, bg-gonder; pkproje §11 265, reisim: "muhasebe kısmında
   maaş bordrosu gönder tuşu olsun … format yoksa el ile yükleyip gönderme seçeneği olsun her personele özel maaş bordrosunu yükleyip imzaya
   yollasın"). Dönem (son 12 ay, varsayılan geçen ay) · çalışan personel · kişinin bu dönem bordro belgesi (gönderildi / imzalandı). Gönder:
   seçilen ve PDF'i yüklenen her kişinin bordrosu imzasına gider (Onaylar › Diğer belgeler) ve Personel kartındaki bordrolara yazılır; bu dönem
   zaten gönderilmiş kişi atlanır. Formattan oluşturma Firma ayarları › Bordro formatı ile gelir (o kalemde). Yetki: Muhasebe "yaz" (modül 18).
   Personel ve belge tablolarına dokunmaz: personel/server/muhasebe-baglanti.ts, onaylar/server/belge-baglanti.ts. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { belgeGonder, belgePdfDenetle, bordroBelgeleri } from "../../onaylar/server/belge-baglanti.ts";
import { bordroBelgeAdi, donemAd, type BelgeDurumu } from "../../onaylar/sema.ts";
import { bordroKisileri, muhasebeBordroYaz } from "../../personel/server/muhasebe-baglanti.ts";

const MODUL = 18;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface Kisi extends YetkiHesabi { ad: string }
export interface BordroGonderimSatiri { id: string; ad: string; meslek: string; belge: BelgeDurumu | null }
export interface BordroGonderimi { ay: string; aylar: string[]; kisiler: BordroGonderimSatiri[] }
export type BordroGonderSonucu =
  | { durum: "tamam"; bildirim: string }
  | { durum: "gecersiz"; hatalar: Record<string, string>; genel?: string }
  | { durum: "yetkisiz" };

const BUGUN_AY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
/** son 12 ay, bu ay başta (maket bgAylar) */
export function bordroAylari(buAy = BUGUN_AY()): string[] {
  const l: string[] = [];
  let y = Number(buAy.slice(0, 4)), m = Number(buAy.slice(5, 7));
  for (let i = 0; i < 12; i++) { l.push(`${y}-${String(m).padStart(2, "0")}`); if (--m === 0) { m = 12; y--; } }
  return l;
}
const yazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
/** tuş yalnız gönderebilene çizilir (karar yine her istekte sunucuda) */
export const bordroGonderebilir = yazar;

/** pencere verisi: dönem (geçersizse geçen ay) ve çalışan personelin bu dönem bordro belgesi; yazamayana null */
export async function bordroGonderimi(db: Sorgulayici, kim: Kisi, ay?: string | null): Promise<BordroGonderimi | null> {
  if (!yazar(kim)) return null;
  const aylar = bordroAylari();
  const secili = ay && aylar.includes(ay) ? ay : aylar[1];
  const kisiler = await bordroKisileri(db);
  const belgeler = await bordroBelgeleri(db, kisiler.map((k) => k.id), [secili]);
  return { ay: secili, aylar, kisiler: kisiler.map((k) => ({ ...k, belge: belgeler.get(`${k.id}|${secili}`)?.durum ?? null })) };
}

/** seçilen kişilerin bordrosunu imzaya gönder. dosyalar: kişi → PDF (elle yükle). Önce HEPSİ denetlenir (biri geçersizse hiçbiri yazılmaz). */
export async function bordroGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, ay: string, secili: readonly string[],
  dosyalar: ReadonlyMap<string, { ad: string; bayt: Uint8Array }>): Promise<BordroGonderSonucu> {
  if (!yazar(kim)) return { durum: "yetkisiz" };
  if (!bordroAylari().includes(ay)) return { durum: "gecersiz", hatalar: { ay: "Dönem son 12 aydan seçilmeli." } };
  const kisiler = new Map((await bordroKisileri(db)).map((k) => [k.id, k]));
  const sec = [...new Set(secili)].filter((id) => UUID.test(id) && kisiler.has(id));
  const belgeler = await bordroBelgeleri(db, sec, [ay]);
  const gitti = (id: string) => { const b = belgeler.get(`${id}|${ay}`); return !!b && b.durum !== "geri"; };
  const gidecek = sec.filter((id) => !gitti(id) && dosyalar.has(id));
  const hatalar: Record<string, string> = {};
  for (const id of gidecek) { const h = belgePdfDenetle(dosyalar.get(id)!.bayt); if (h) hatalar[id] = h; }
  if (Object.keys(hatalar).length) return { durum: "gecersiz", hatalar };
  if (!gidecek.length) return { durum: "gecersiz", hatalar: {}, genel: "Gönderilecek bordro yok: seçili kişilere bordro dosyası yükleyin." };
  let gonderilen = 0;
  for (const id of gidecek) {
    const pdf = dosyalar.get(id)!;
    const ad = `bordro-${ay}.pdf`;
    const kaynak = await muhasebeBordroYaz(db, depo, kim, firmaId, id, ay, { ad, bayt: pdf.bayt });
    const r = await belgeGonder(db, depo, kim, firmaId, { tur: "bordro", ad: bordroBelgeAdi(ay), personelId: id, kaynakId: kaynak, ay, pdf: { ad, bayt: pdf.bayt } });
    if (r.durum === "tamam") gonderilen++;
  }
  const atla = sec.filter((id) => !gitti(id) && !dosyalar.has(id)).length;
  return { durum: "tamam", bildirim: `${gonderilen} kişinin ${donemAd(ay)} bordrosu imzaya gönderildi${atla ? `; ${atla} kişinin bordrosu olmadığı için gönderilmedi` : ""}. Kişiler Onaylar › Diğer belgeler'de imzalar.` };
}
