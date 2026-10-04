/* DÖKÜMAN GİRDİLERİ — pencerelerin ve sunucunun TEK şeması (maket standartlar.html denetle / dok-kaydet). Standart no: "TS EN 280" ya da
   "TS HD 60364-6" biçimi; sürüm: yıl ve varsa tadil ("2016", "2013+A1:2015"); konu raporun metot alanında numarayla birlikte yazılır. */
import { z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);
export const STANDART_NO = /^[A-ZÇĞİÖŞÜ]{2,}[A-ZÇĞİÖŞÜ0-9 /.-]*\d[\d.-]*(-\d+)*$/;
export const SURUM = /^\d{4}(\+[A-Z]\d{1,2}(:\d{4})?)*$/;
export const DOKUMAN_TURLERI = ["Kalite el kitabı", "Prosedür", "Talimat", "Politika", "Form", "Sertifika", "Diğer"] as const;

export const StandartGirdisi = z.object({
  no: z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr") : s),
    z.string({ error: "Standart numarası: ör. TS EN 280 ya da TS HD 60364-6." }).regex(STANDART_NO, "Standart numarası: ör. TS EN 280 ya da TS HD 60364-6.")),
  surum: z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
    z.string({ error: "Yıl ve varsa tadil: ör. 2016 ya da 2013+A1:2015." }).regex(SURUM, "Yıl ve varsa tadil: ör. 2016 ya da 2013+A1:2015.")),
  konu: z.preprocess(bos, z.string({ error: "Konu yazılmalı (raporda standart adı olarak görünür)." }).min(2, "Konu yazılmalı (raporda standart adı olarak görünür).").max(120, "En çok 120 karakter.")),
});
export type StandartGirdisi = z.output<typeof StandartGirdisi>;

export const DokumanGirdisi = z.object({
  ad: z.preprocess(bos, z.string({ error: "Döküman adı yazılmalı." }).min(2, "Döküman adı yazılmalı.").max(100, "En çok 100 karakter.")),
  tur: z.enum(DOKUMAN_TURLERI, { error: "Tür seçilmeli." }),
  kod: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").nullable()),
  rev: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").nullable()),
});
export type DokumanGirdisi = z.output<typeof DokumanGirdisi>;
