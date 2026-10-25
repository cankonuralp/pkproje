/* SÖZLEŞME GİRDİLERİ — formun, pencerelerin ve sunucunun TEK şeması (maket sozlesmeler.html denetle / pencere-kaydet). İş sözleşmesi: müşteri,
   en az bir tesis, başlangıç, süre 1–36 ay, ödeme vadesi 0–120 gün, yenileme. İSG-KATİP: tesis + denetçi + sözleşme ID; onay ve bitiş isteğe
   bağlı (boşsa uyarı yalnız eksik ID'de). Bitiş = başlangıç + süre − 1 gün. Dayanak teklif isteğe bağlı (326: aynı müşterinin kabul edilmiş
   teklifi — sunucu ve veritabanı denetler; boşsa "sistem öncesi"). */
import { eposta, tarih, z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);
const UUID = /^[0-9a-f-]{36}$/;
const tamSayi = (en: number, enCok: number, ileti: string) => z.preprocess((s) => (typeof s === "string" ? s.trim() : s),
  z.string({ error: ileti }).regex(/^\d{1,3}$/, ileti).transform(Number).refine((n) => n >= en && n <= enCok, ileti));

export const SozlesmeGirdisi = z.object({
  musteri: z.string({ error: "Müşteri seçilmeli." }).regex(UUID, "Müşteri seçilmeli."),
  tesisler: z.array(z.string().regex(UUID), { error: "En az bir tesis seçilmeli." }).min(1, "En az bir tesis seçilmeli.").max(200).transform((l) => [...new Set(l)]),
  baslangic: tarih,
  sure: tamSayi(1, 36, "1–36 ay."),
  vade: tamSayi(0, 120, "0–120 gün."),
  yenileme: z.enum(["yok", "otomatik"], { error: "Yenileme seçilmeli." }),
  teklif: z.preprocess((s) => (s === undefined || s === "" ? null : s), z.string().regex(UUID, "Teklif seçilmeli.").nullable()).default(null),
});
export type SozlesmeGirdisi = z.output<typeof SozlesmeGirdisi>;

export const IsgGirdisi = z.object({
  tesis: z.string({ error: "Tesis seçilmeli." }).regex(UUID, "Tesis seçilmeli."),
  personel: z.string({ error: "Denetçi seçilmeli." }).regex(UUID, "Denetçi seçilmeli."),
  no: z.preprocess(bos, z.string({ error: "Sözleşme ID yazılmalı." }).max(30, "En çok 30 karakter.")),
  onay: z.preprocess(bos, tarih.nullable()),
  bitis: z.preprocess(bos, tarih.nullable()),
});
export type IsgGirdisi = z.output<typeof IsgGirdisi>;

/** bitiş: başlangıç + ay − 1 gün (ay sonu taşmasında ayın son günü) */
export function bitisHesapla(baslangic: string, ay: number): string {
  const [y, m, g] = baslangic.split("-").map(Number);
  const hedefAy = m - 1 + ay, sonGun = new Date(Date.UTC(y, hedefAy + 1, 0)).getUTCDate();
  const d = new Date(Date.UTC(y, hedefAy, Math.min(g, sonGun)));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type SozlesmeDurumu = "imza" | "yururlukte" | "suresi";
export const sozlesmeDurumu = (musteriImza: string | null, bitis: string, bugun: string): SozlesmeDurumu =>
  !musteriImza ? "imza" : bitis < bugun ? "suresi" : "yururlukte";
export const DURUM_AD: Record<SozlesmeDurumu, string> = { imza: "İmza bekliyor", yururlukte: "Yürürlükte", suresi: "Süresi doldu" };

/* ── MÜŞTERİYE GÖNDER (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı,
   bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim") — sözleşme PDF'i ekli e-posta: alıcı en çok 5
   (başlangıçta müşterinin e-postası, değiştirilebilir); konu sabit kısa; gönderen tuşa basan kişi (sunucuda oturumdan). Saf. ── */
export const GONDER_EN_COK = 5;
export const GonderGirdisi = z.object({
  kime: z.array(eposta, { error: "En az bir e-posta yazılmalı." }).min(1, "En az bir e-posta yazılmalı.").max(GONDER_EN_COK, `En çok ${GONDER_EN_COK} e-posta.`)
    .refine((l) => new Set(l).size === l.length, "Aynı e-posta iki kez yazılmış."),
});
export type GonderGirdisi = z.output<typeof GonderGirdisi>;

export interface SozlesmeEpostaBilgisi {
  firma: string; no: string; unvan: string; baslangic: string; bitis: string; tesisler: readonly string[];
  /** müşteri imzası bekleniyor: imzalı nüsha istenir */
  imzaBekliyor: boolean;
  /** tuşa basan kişinin adı (imza satırı) */
  gonderen: string;
}
const gunYaz = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
/** sözleşme e-postasının konusu ve düz metin gövdesi (ek: sözleşme PDF'i) */
export function sozlesmeEpostasi(p: SozlesmeEpostaBilgisi): { konu: string; govde: string } {
  const satirlar = [
    `Sayın ${p.unvan},`, "",
    `${p.firma} ile aranızdaki ${p.no} numaralı periyodik kontrol hizmet sözleşmesi ektedir.`, "",
    `Sözleşme: ${p.no}`, `Süre: ${gunYaz(p.baslangic)} – ${gunYaz(p.bitis)}`, `Kapsam: ${p.tesisler.join(", ") || "-"}`, "",
    ...(p.imzaBekliyor ? ["İmzalı nüshayı tarafımıza iletmenizi rica ederiz.", ""] : []),
    "Saygılarımızla,", p.gonderen, p.firma,
  ];
  return { konu: `${p.firma} · ${p.no} hizmet sözleşmesi`.slice(0, 300), govde: satirlar.join("\n") };
}
