/* KULLANIM METNİ — saf (357; sunucu ve ekran aynı işlevle): kayıt başına kullanım sayımları (src/server/db/silici.ts) → "3 raporda, 1 zimmet hareketinde".
   Silinemezlik nedenini söyler: "<ad> silinemez: 3 raporda kullanıldı." Bilinmeyen sayım türü adıyla yazılır (sessizce düşmez). */
const YER: Record<string, string> = {
  rapor: "raporda",
  zimmet: "zimmet hareketinde",
  zimmet_formu: "zimmet formunda",
  cihaz: "cihazda",
  tamamlanmis_plan: "tamamlanmış planda",
  ekipman: "ekipmanda",
  atama: "personel atamasında",
  teklif: "teklif kaleminde",
  fatura: "fatura satırında",
  km: "kilometre kaydında",
};

export function kullanimMetni(k: Readonly<Record<string, number>>): string {
  return Object.entries(k).filter(([, n]) => n > 0).map(([t, n]) => `${n} ${YER[t] ?? t}`).join(", ");
}
