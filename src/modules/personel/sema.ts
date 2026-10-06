/* PERSONEL GİRDİSİ — formun ve sunucunun TEK şeması (maket personel.html formu; karar 39: zorunlu yalnız ad, işe başlama, meslek). İletiler maketle aynı.
   Ekranda tarih GG.AA.YYYY; şema ISO bekler (dönüşüm formda). Meslek anahtarı sabit tanımlarda olmalı (Ek-III listesi). */
import { tarih, tutar, z } from "../../sema/ortak.ts";
import { TANIMLAR } from "../../tanim/veri.ts";

const bos = (s: unknown) => (typeof s === "string" && s.trim() === "" ? null : typeof s === "string" ? s.trim() : s);
const MESLEKLER = TANIMLAR.meslekler.map((m) => m.k);

export const PersonelGirdisi = z.object({
  ad: z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s),
    z.string().max(80, "En çok 80 karakter.").refine((s) => s.split(" ").length >= 2 && s.length >= 3, "Ad ve soyad yazılmalı.")),
  eposta: z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().toLowerCase()) : s),
    z.email({ error: "E-posta biçimi geçersiz." }).max(254).nullable()),
  imzaTel: z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.replace(/\s/g, "")) : s),
    z.string().regex(/^05\d{9}$/, "05XX XXX XX XX biçiminde yazılmalı.").nullable()),
  basla: tarih,
  meslek: z.string({ error: "Meslek seçilmeli." }).refine((m) => MESLEKLER.includes(m), "Meslek seçilmeli."),
  meslekMetin: z.preprocess(bos, z.string().max(60, "En çok 60 karakter.").nullable()),
  diploma: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").nullable()),
  oda: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").nullable()),
  ekipnet: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").nullable()),
}).superRefine((p, bag) => {
  if (p.meslek === "diger" && !p.meslekMetin) bag.addIssue({ code: "custom", path: ["meslekMetin"], message: "Meslek adı yazılmalı." });
});
export type PersonelGirdisi = z.output<typeof PersonelGirdisi>;

export const meslek = (k: string) => TANIMLAR.meslekler.find((m) => m.k === k);
/** yetkili kişi (denetçi) olabilir mi: meslek en az bir Ek-III grubuna izin veriyor (teknisyen / diğer değil) */
export const yetkiliOlabilir = (k: string) => (meslek(k)?.g.length ?? 0) > 0;
export const bransAd = (b: string | null | undefined) => (b === "m" ? "Mekanik" : b === "e" ? "Elektrik" : "—");

/* ── PERSONEL DOSYASI (maket personel.html: özlük, ekipman atamaları, maaş ve bordrolar) ── */
export const OZLUK_TURLERI = [["is", "İş sözleşmesi"], ["diploma", "Diploma"], ["oda", "Oda kaydı"], ["ekipnet", "EKİPNET kayıt belgesi"], ["kimlik", "Kimlik belgesi"],
  ["saglik", "Sağlık raporu"], ["diger", "Diğer"]] as const;
/** firmanın eklediği türler (335; Firma ayarları › Belge türü ekle): anahtar ek1–ek30 */
export type EkTur = { k: string; ad: string };
/** seçilebilir özlük türleri: sabitler, firmanın ekledikleri, "Diğer" hep sonda (maket MV.ozlukTur) */
export const ozlukTurleri = (ek: readonly EkTur[] = []): (readonly [string, string])[] =>
  [...OZLUK_TURLERI.slice(0, -1), ...ek.map((x) => [x.k, x.ad] as const), OZLUK_TURLERI[OZLUK_TURLERI.length - 1]];
export const ozlukTurAd = (k: string, ek: readonly EkTur[] = []) => ozlukTurleri(ek).find((x) => x[0] === k)?.[1] ?? "Diğer";
/** tür seçilenler arasında mı sunucuda (firmanın eklediği türler ayardan) denetlenir */
export const OzlukGirdisi = z.object({
  tur: z.string({ error: "Belge türü seçilmeli." }).regex(/^[a-z0-9]{2,12}$/, "Belge türü seçilmeli."),
  aciklama: z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim()) : s), z.string().max(120, "En çok 120 karakter.").nullable()),
});
export const AtamaGirdisi = z.object({
  tur: z.string({ error: "Ekipman türü seçilmeli." }).regex(/^[0-9a-f-]{36}$/, "Ekipman türü seçilmeli."),
  tarih,
});
export const BordroGirdisi = z.object({
  ay: z.string({ error: "Dönem seçilmeli." }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Dönem seçilmeli."),
  brut: tutar, net: tutar, maliyet: tutar,
}).superRefine((b, bag) => {
  if (b.brut <= 0) bag.addIssue({ code: "custom", path: ["brut"], message: "Brüt sıfırdan büyük olmalı." });
  if (b.net <= 0 || b.net > b.brut) bag.addIssue({ code: "custom", path: ["net"], message: "Net, brütten büyük olamaz." });
  if (b.maliyet < b.brut) bag.addIssue({ code: "custom", path: ["maliyet"], message: "İşverene maliyet brütten küçük olamaz." });
});
