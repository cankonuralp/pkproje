/* ARAÇLAR — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem modülün
   VAR OLAN işlevini oturumdaki kişiyle çağırır — Araçlar ekranıyla aynı yetki ve kural (liste / kart: görebilen, aracı kullanan kendi aracını; araç
   kaydı / pasif: "yaz" düzeyi, plaka firmada eşsiz; haftalık kilometre: aracı kullanan ya da yönetici, geri giden kilometre uyarıdır; pasife alınacak
   araç depoda olmalı; sil: hiç kullanılmamış, yönetici). Girdi modülün şemasından (AracGirdisi, KmGirdisi). Teslim tutanağı açı fotoğrafları ve
   imzaya giden belge ister — ekrandan yazılır (S.A.Y'da yok). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { AracGirdisi, KmGirdisi } from "./sema.ts";
import { aracKarti, aracKaydet, aracListesi, aracPasif, aracSil, kmKaydet } from "./server/araclar.ts";

const MODUL = 23;
const ALAN = ["plaka", "tur", "marka", "model", "yil", "yakit", "ilkKm", "bakimKm", "muayene", "sigorta", "kasko"] as const;
/** pencerenin gönderdiği gibi (sayılar yazı) — verilmeyen alan kartın değeriyle */
function alanlar(mevcut: Record<string, unknown> | null, verilen: Record<string, unknown>): Record<string, unknown> {
  const m = (k: string) => { const x = mevcut?.[k]; return x === null || x === undefined ? "" : typeof x === "number" ? String(x) : x; };
  return Object.fromEntries(ALAN.map((k) => [k, Object.hasOwn(verilen, k) ? (typeof verilen[k] === "number" ? String(verilen[k]) : verilen[k] ?? "") : m(k)]));
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "arac_ara", modul: MODUL, tur: "oku", islev: aracListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa, pasif: z.boolean().default(false) }),
    tarif: "Araçları arar (20'şer): ara — plaka, marka, model, kimde; kilometre, belgeler (muayene / sigorta / kasko) durumu; pasif: true pasifleri listeler.",
    calistir: async (b, v) => {
      const l = await aracListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Araçlar'ı göremiyor." };
      const s = sayfala(l.araclar.filter((a) => !!a.pasif === v.pasif && trIcerir([a.plaka, a.marka, a.model, a.kimde.tip === "kisi" ? a.kimde.ad : ""].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, araclar: s.satirlar } };
    },
  }),
  islem({
    ad: "arac_getir", modul: MODUL, tur: "oku", girdi: z.object({ arac: kimlik }), kaynak: [kimlik], islev: aracKarti,
    tarif: "Araç kartı: bilgileri, sürümü (surum), belgeler, teslim tutanakları, kilometre geçmişi ve bu haftanın kaydı.",
    calistir: async (b, v) => {
      const a = await aracKarti(b.db, b.kim, v.arac);
      return a ? { tamam: true, sonuc: { ...a, tutanaklar: a.tutanaklar.slice(0, 30), kmGecmisi: a.kmGecmisi.slice(0, 30) } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "arac_kaydet", modul: MODUL, tur: "yaz", islev: aracKaydet, kaynak: [AracGirdisi, kimlik, surum],
    girdi: z.object({ arac: kimlik.nullable().default(null), surum: surum.default(0), alanlar: z.object(AracGirdisi.shape).partial() }),
    tarif: "Araç ekler (arac boş) ya da düzenler (arac + surum): alanlar { plaka (34 ABC 123), tur (Binek araç / Hafif ticari araç / Kamyonet / Minibüs / "
      + "Kamyon), marka, model, yil, yakit (benzin / dizel / lpg / elektrik / hibrit), ilkKm, bakimKm, muayene, sigorta, kasko (YYYY-AA-GG) }.",
    calistir: async (b, v, ham) => {
      const mevcut = v.arac ? await aracKarti(b.db, b.kim, v.arac) : null;
      if (v.arac && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(mevcut as Record<string, unknown> | null, (ham.alanlar ?? {}) as Record<string, unknown>);
      return yazmaCevabi(await aracKaydet(b.db, b.kim, v.arac, v.surum, g), { bildirim: v.arac ? "Araç güncellendi." : "Araç eklendi." });
    },
  }),
  islem({
    ad: "arac_km", modul: MODUL, tur: "yaz", girdi: z.object({ arac: kimlik, km: z.union([z.number().int().min(0), KmGirdisi.shape.km]) }), kaynak: [KmGirdisi, kimlik], islev: kmKaydet,
    tarif: "Aracın bu haftaki kilometresini yazar (göstergedeki değer; bu hafta yazıldıysa düzeltir). Geri giden kilometre uyarıyla döner.",
    calistir: async (b, v, ham) => {
      const r = await kmKaydet(b.db, b.kim, v.arac, { km: typeof ham.km === "number" ? String(ham.km) : ham.km });
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.duzeltildi ? "Bu haftanın kilometresi düzeltildi" : "Kilometre yazıldı"}.${r.uyari ? ` ${r.uyari}` : ""}` : undefined });
    },
  }),
  islem({
    ad: "arac_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ arac: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum], islev: aracPasif,
    tarif: "Aracı kullanımdan çeker (pasif: true — depoda olmalı) ya da etkinleştirir (pasif: false).",
    calistir: async (b, v) => yazmaCevabi(await aracPasif(b.db, b.kim, v.arac, v.surum, v.pasif), { bildirim: v.pasif ? "Araç pasife alındı." : "Araç etkinleştirildi." }),
  }),
  islem({
    ad: "arac_sil", modul: MODUL, tur: "yaz", girdi: z.object({ arac: kimlik }), kaynak: [kimlik], islev: aracSil,
    tarif: "Hiç kullanılmamış aracı kesin siler (yönetici); kullanılmışsa nedeni döner.",
    calistir: async (b, v) => {
      const r = await aracSil(b.db, b.kim, v.arac);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
];
