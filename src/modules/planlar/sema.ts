/* PLAN AÇ — formun ve sunucunun TEK şeması + uyarı kuralları (maket plan-ac.html M6 2. tur, L6, G1, Ö5b, L4; iletiler maketle aynı).
   Uyarılar ENGEL DEĞİL (genel ilke, reisim 38–39; L2 İSG-KATİP de uyarı): plan açılır, uyarılar planın üstünde yazar. Engel yalnız veri bütünlüğü:
   tesis, geçerli tarih, bitiş ≥ başlangıç, en az bir denetçi. Uyarı hesabı SAF (istemci formda canlı, sunucu plan sayfasında aynı sonuç). */
import { meslek, yetkiliOlabilir } from "../personel/sema.ts";
import { tarih, z } from "../../sema/ortak.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const kirp = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);
const bos = (s: unknown) => (s === undefined || s === null || (typeof s === "string" && s.trim() === "") ? null : kirp(s));
const TARIH_ILETI = "GG.AA.YYYY biçiminde geçerli bir tarih.";
const tarihAlani = z.string({ error: TARIH_ILETI }).refine((s) => tarih.safeParse(s).success, TARIH_ILETI);

export const PlanAcGirdisi = z.object({
  tesis: z.string({ error: "Tesis seçilmeli." }).regex(UUID, "Tesis seçilmeli."),
  baslangic: tarihAlani,
  bitis: tarihAlani,
  aciklama: z.preprocess(bos, z.string().max(300, "En çok 300 karakter.").nullable()),
  ekip: z.array(z.object({
    personel: z.string().regex(UUID, "En az bir denetçi seçilmeli."),
    isgNo: z.preprocess(bos, z.string().max(30, "İSG-KATİP SÖZLEŞME ID en çok 30 karakter.").nullable()),
    kaydet: z.boolean().default(false),
  }), { error: "En az bir denetçi seçilmeli." }).min(1, "En az bir denetçi seçilmeli.").max(20, "En çok 20 denetçi."),
}).superRefine((p, bag) => {
  if (tarih.safeParse(p.baslangic).success && tarih.safeParse(p.bitis).success && p.bitis < p.baslangic) bag.addIssue({ code: "custom", path: ["bitis"], message: "Bitiş başlangıçtan önce olamaz." });
  if (new Set(p.ekip.map((e) => e.personel)).size !== p.ekip.length) bag.addIssue({ code: "custom", path: ["ekip"], message: "Aynı denetçi iki kez seçilmiş." });
});
export type PlanAcGirdisi = z.output<typeof PlanAcGirdisi>;

/* ── UYARILAR (saf) ─────────────────────────────────────────────────────────────────────────────────────────────── */
export interface Aday { id: string; ad: string; meslek: string; meslekMetin: string | null; ekipnet: string | null; hesapDurum: "ilk" | "etkin" }
export interface IsgKaydi { id: string; personelId: string; no: string; onay: string | null; bitis: string | null }
export interface AcikPlan { id: string; no: string; baslangic: string; bitis: string; tesis: string; ekip: string[] }
export interface Tur { id: string; ad: string; brans: "m" | "e"; grup: string; periyot: number }
export interface KapsamSatiri { tur: Tur; ekipman: number; geliyor: number }

const gunEkle = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const ayEkle = (iso: string, n: number) => {
  const [y, m, g] = iso.split("-").map(Number);
  const son = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(g, son))).toISOString().slice(0, 10);
};
export const tarihNo = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const TR_ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** zaman damgasının Türkiye'deki günü "GG.AA.YYYY" (sunucu ve tarayıcıda aynı sonuç) */
export const gunNo = (zaman: string) => tarihNo(TR_ZAMAN.format(new Date(zaman)).slice(0, 10));
/** zaman damgası "GG.AA.YYYY SS:DD" (Türkiye saati) */
export const zamanNo = (zaman: string) => { const s = TR_ZAMAN.format(new Date(zaman)); return `${tarihNo(s.slice(0, 10))} ${s.slice(12, 17)}`; };
/* yılın son okunan sözcüğüne göre -de / -da / -te / -ta (maket MK.tarihEk "de"): 2026'da · 2027'de · 2023'te */
const BIRLER = ["", "de", "de", "te", "te", "te", "da", "de", "de", "da"], ONLAR = ["", "da", "de", "da", "ta", "de", "ta", "te", "de", "da"];
export const tarihDe = (iso: string) => {
  const y = Number(iso.slice(0, 4)), ek = y % 10 ? BIRLER[y % 10] : y % 100 ? ONLAR[(y % 100) / 10] : "de";
  return `${tarihNo(iso)}'${ek}`;
};

/** İSG-KATİP onayı: kontrol gününden en geç 1 gün önce (mevzuat 4.4); onay tarihi isteğe bağlı — yoksa uyarı yok (M5 E) */
export const isgUygun = (onay: string | null, gun: string) => !onay || onay <= gunEkle(gun, -1);

/** denetçinin İSG-KATİP durumu: sözleşmeden gelen kayıt ya da el ile yazılan */
export function isgDurumu(kayit: IsgKaydi | undefined, elle: string | null, gun: string | null):
  { tur: "tamam" | "gec" | "bitti"; kayit: IsgKaydi } | { tur: "elle"; no: string } | { tur: "yok" } {
  if (kayit) {
    if (gun && kayit.bitis && kayit.bitis < gun) return { tur: "bitti", kayit };
    if (gun && !isgUygun(kayit.onay, gun)) return { tur: "gec", kayit };
    return { tur: "tamam", kayit };
  }
  return elle ? { tur: "elle", no: elle } : { tur: "yok" };
}

/** iki tarih aralığı kesişiyor mu (kapalı aralıklar) */
const kesisir = (a1: string, a2: string, b1: string, b2: string) => a1 <= b2 && b1 <= a2;

/** denetçinin uyarıları (maket adayDurum): İSG-KATİP yok / geç / bitmiş · EKİPNET · meslek · ilk giriş; aynı günlerde başka açık plan */
export function adayUyarilari(a: Aday, isg: ReturnType<typeof isgDurumu>, gun: string | null, bit: string | null, planlar: readonly AcikPlan[], haric?: string) {
  const eksik: string[] = [];
  if (isg.tur === "yok") eksik.push("İSG-KATİP SÖZLEŞME ID'si yok");
  else if (isg.tur === "gec") eksik.push("İSG-KATİP onayı geç");
  else if (isg.tur === "bitti") eksik.push(`İSG-KATİP sözleşmesi ${tarihDe(isg.kayit.bitis!)} bitmiş`);
  if (!a.ekipnet) eksik.push("EKİPNET kayıt numarası yok");
  if (!yetkiliOlabilir(a.meslek)) eksik.push("Meslek yetkili kişi olamaz");
  if (a.hesapDurum !== "etkin") eksik.push("İlk girişini yapmadı");
  const cakisma = gun ? planlar.filter((p) => p.id !== haric && p.ekip.includes(a.id) && kesisir(gun, bit ?? gun, p.baslangic, p.bitis)) : [];
  return { eksik, cakisma };
}

/** türe yetkili: meslek Ek-III grubuna izin veriyor; Ek-III dışı türde meslek kuralı yok (N4) */
export const turYetkili = (a: Pick<Aday, "meslek">, t: Pick<Tur, "grup">) => t.grup === "ekdisi" || (meslek(a.meslek)?.g ?? []).includes(t.grup);

/** tesisin ekipmanı tür başına (hepsi plana girer — L6); "kontrolü geliyor": sonraki kontrol plan gününden en çok eşik gün sonra (bilinmiyorsa geliyor) */
export function kapsamHesapla(ekipmanlar: readonly { turId: string; sonKontrol: string | null; pasif: boolean }[], turler: readonly Tur[], gun: string, esik: number): KapsamSatiri[] {
  const m = new Map<string, KapsamSatiri>();
  for (const e of ekipmanlar) {
    if (e.pasif) continue;
    const t = turler.find((x) => x.id === e.turId);
    if (!t) continue;
    const s = m.get(t.id) ?? { tur: t, ekipman: 0, geliyor: 0 };
    s.ekipman++;
    if (!e.sonKontrol || ayEkle(e.sonKontrol, t.periyot) <= gunEkle(gun, esik)) s.geliyor++;
    m.set(t.id, s);
  }
  return [...m.values()].sort((a, b) => (a.tur.brans === b.tur.brans ? a.tur.ad.localeCompare(b.tur.ad, "tr") : a.tur.brans === "m" ? -1 : 1));
}

/** ekip × kapsam uyarıları (maket ozetCiz): türe yetkili meslekten kimse yok · yetkili var ama türe atanmış kimse yok (L4) */
export function turUyarilari(kapsam: readonly KapsamSatiri[], ekip: readonly Aday[], atamalar: Readonly<Record<string, string[]>>): string[] {
  if (!ekip.length) return [];
  const l: string[] = [];
  for (const k of kapsam) {
    const yetkili = ekip.filter((a) => turYetkili(a, k.tur));
    if (!yetkili.length) l.push(`${k.tur.ad}: ekipte bu türe yetkili meslekten kimse yok.`);
    else if (!ekip.some((a) => atamalar[a.id]?.includes(k.tur.id))) l.push(`${k.tur.ad}: ekipte bu türe atanmış denetçi yok (Personel › Ekipman atamaları).`);
  }
  return l;
}

/** plan günü iş sözleşmesinin dışında (Ö5b); tesisin hiç sözleşmesi yoksa uyarı yok (teklifsiz eski müşteri) */
export function sozlesmeUyarisi(sozlesmeler: readonly { no: string; baslangic: string; bitis: string }[], gun: string | null): string | null {
  if (!gun || !sozlesmeler.length || sozlesmeler.some((s) => s.baslangic <= gun && s.bitis >= gun)) return null;
  const sonra = sozlesmeler.filter((s) => s.baslangic > gun).sort((a, b) => (a.baslangic < b.baslangic ? -1 : 1))[0];
  if (sonra) return `İş sözleşmesi ${sonra.no} ${tarihDe(sonra.baslangic)} başlıyor; plan günü sözleşmeden önce.`;
  const once = [...sozlesmeler].sort((a, b) => (a.bitis < b.bitis ? 1 : -1))[0];
  return `İş sözleşmesi ${once.no} ${tarihDe(once.bitis)} bitti; plan günü sözleşmenin dışında.`;
}

/** plan durumunun adı ve rozeti (maket MV.PLAN_DURUM) */
export const PLAN_DURUM = {
  bekliyor: ["Kabul bekliyor", "bekliyor"], kabul: ["Kabul edildi", "kabul"], denetimde: ["Denetimde", "denetimde"],
  tamamlandi: ["Tamamlandı", "tamam"], reddedildi: ["Reddedildi", "red"],
} as const;
export type PlanDurumu = keyof typeof PLAN_DURUM;

/* ── PLAN İÇİ (310; maket planlarim.html 4.–5. tur) ─────────────────────────────────────────────────────────────── */
/** Reddet (maket a-red-pencere): gerekçe zorunlu */
export const RedGirdisi = z.object({
  gerekce: z.preprocess(kirp, z.string({ error: "Gerekçe yazılmadan plan reddedilemez." }).min(3, "Gerekçe yazılmadan plan reddedilemez.").max(500, "En çok 500 karakter.")),
});
/** Proje notu (karar 27): değişmez, silinmez */
export const NotGirdisi = z.object({
  metin: z.preprocess((s) => (typeof s === "string" ? s.trim() : s), z.string({ error: "Not boş olamaz." }).min(1, "Not boş olamaz.").max(500, "En çok 500 karakter.")),
});
const SGK = /^[0-9]{26}$/;
/** Plan künyesi (§3.4 "Plan künyesi"): planlamacı Düzenle — firma adı, adres, SGK DETSİS NO, denetçi başına İSG-KATİP SÖZLEŞME ID */
export const KunyeGirdisi = z.object({
  firmaAdi: z.preprocess(kirp, z.string({ error: "Firma adı boş olamaz." }).min(1, "Firma adı boş olamaz.").max(200, "En çok 200 karakter.")),
  adres: z.preprocess(bos, z.string().max(300, "En çok 300 karakter.").nullable()),
  sgk: z.preprocess((s) => { const v = bos(s); return typeof v === "string" ? v.replace(/\s+/g, "") : v; },
    z.string().regex(SGK, "SGK DETSİS NO 26 haneli olmalı.").nullable()),
  isg: z.record(z.string().regex(UUID), z.preprocess(bos, z.string().max(30, "İSG-KATİP SÖZLEŞME ID en çok 30 karakter.").nullable())).default({}),
});
export type KunyeGirdisi = z.output<typeof KunyeGirdisi>;

/** ekipman kodu yazarken: boşluk atılır, küçük harf büyüğe (yalnız a–z; dile bağlı harf katlama yok, anayasa 5.5) */
export const kodNormal = (v: string) => v.replace(/\s+/g, "").replace(/[a-z]/g, (c) => c.toUpperCase());
export type KodTuru = "bos" | "hata" | "tamam" | "tesiste";
/** kodun biçimi (maket kodDurum ilk dört satır); biçim uygunsa null — eşsizlik sunucuda */
export function kodBicimi(kod: string): { tur: KodTuru; metin: string } | null {
  if (!kod) return { tur: "bos", metin: "Etiketteki kodu yazın: harf (A–Z), rakam ve tire. Kod firmada eşsiz olmalı." };
  if (/[^A-Z0-9-]/.test(kod)) return { tur: "hata", metin: "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok)." };
  if (kod.length < 3 || kod.length > 20) return { tur: "hata", metin: "Kod 3 ile 20 hane arasında olmalı." };
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kod)) return { tur: "hata", metin: "Tire başta, sonda ya da art arda olamaz." };
  return null;
}
/** yeni ekipman (maket ekleCiz "Yeni ekipman"): kod + tür zorunlu; seri no, konum isteğe bağlı */
export const YeniEkipmanGirdisi = z.object({
  kod: z.preprocess((s) => (typeof s === "string" ? kodNormal(s) : s), z.string({ error: "Ekipman kodu boş" })
    .superRefine((k, bag) => { const b = kodBicimi(k); if (b) bag.addIssue({ code: "custom", message: b.metin }); })),
  tur: z.string({ error: "Ekipman türü seçilmeli." }).regex(UUID, "Ekipman türü seçilmeli."),
  seri: z.preprocess(bos, z.string().max(30, "En çok 30 karakter.").nullable()),
  konum: z.preprocess(bos, z.string().max(60, "En çok 60 karakter.").nullable()),
});

/** plan akışının adımları (maket adim): tamam ✓ · aktif (şu an) · bekliyor (sırada) · red × */
export type AdimDurumu = "tamam" | "aktif" | "bekliyor" | "red";
export function akisAdimlari(d: PlanDurumu, kontrolTamam: boolean): [AdimDurumu, AdimDurumu, AdimDurumu, AdimDurumu] {
  const kt = d === "denetimde" && kontrolTamam;
  return [
    "tamam",
    d === "bekliyor" ? "aktif" : d === "reddedildi" ? "red" : "tamam",
    d === "tamamlandi" || kt ? "tamam" : d === "kabul" || d === "denetimde" ? "aktif" : "bekliyor",
    d === "tamamlandi" ? "tamam" : kt ? "aktif" : "bekliyor",
  ];
}
