/* PERSONEL GİRDİSİ — formun ve sunucunun TEK şeması (maket personel.html formu; karar 39: zorunlu yalnız ad, işe başlama, meslek). İletiler maketle aynı.
   Ekranda tarih GG.AA.YYYY; şema ISO bekler (dönüşüm formda). Meslek anahtarı sabit tanımlarda olmalı (Ek-III listesi). */
import { tarih, z } from "../../sema/ortak.ts";
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
