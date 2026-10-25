/* BELGE GÖNDERİMİNİN CHROMIUM LİSTESİ (2026-10-25, belge doldurma) — saf denetim: belgeyi e-postayla gönderen eylemler PDF'i SAYFANIN işlevinde basar;
   o sayfalar next.config.ts outputFileTracingIncludes listesinde olmalı (yoksa yayında Chromium bulunamaz, e-posta gitmez). İki kural:
   1. bilinen gönderim sayfaları listede (Plan aç, plan içi, sözleşme sayfası, sözleşme PDF'i);
   2. modülün ui/eylemler.ts'i PDF basan bir sunucu dosyasını (belge/pdf'i içe aktaran server/<ad>.ts) içe aktarıyorsa modülün sayfası (/<modül> ya
      da /<modül>/[id]) listede. Kullanan: tests/pdf-paket.test.ts; olumsuz kanıt: tests/bozan/belge-gonderim.bozan.ts. */

/** gönderim eylemi PDF basan sayfalar (rota grupları yok) */
export const PDF_GONDEREN_SAYFALAR = ["/planlar/ac", "/planlar/[id]", "/sozlesmeler/[id]", "/sozlesmeler/[id]/pdf"] as const;

/** listedeki biçim: düz yol "…", köşeli ayraçlı yol String.raw`…\[id\]…` — ardından virgül ya da listenin sonu */
export function listedeMi(cfg: string, u: string): boolean {
  const yazim = u.includes("[") ? `String.raw\`${u.replace(/[[\]]/g, (c) => `\\${c}`)}\`` : `"${u}"`;
  return new RegExp(`${yazim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[,\\]]`).test(cfg);
}

/** eksikler (boş: tamam). moduller: src/modules altındaki .ts dosyaları (yol "src/modules/…", içerik) */
export function pdfGonderimEksikleri(cfg: string, moduller: readonly { ad: string; metin: string }[]): string[] {
  const eksik: string[] = PDF_GONDEREN_SAYFALAR.filter((u) => !listedeMi(cfg, u)).map((u) => `${u}: PDF listesinde değil`);
  const metin = new Map(moduller.map((d) => [d.ad, d.metin] as const));
  for (const s of moduller.filter((d) => /^src\/modules\/[^/]+\/server\/[^/]+\.ts$/.test(d.ad) && /from "\.\.\/\.\.\/\.\.\/belge\/pdf(\.ts)?"/.test(d.metin))) {
    const modul = s.ad.split("/")[2], ad = s.ad.split("/").pop()!.replace(/\.ts$/, "");
    const eylem = metin.get(`src/modules/${modul}/ui/eylemler.ts`);
    if (!eylem || !eylem.split("\n").some((x) => x.includes(`from "../server/${ad}"`) || x.includes(`from "../server/${ad}.ts"`))) continue;
    const yol = modul === "egitimler" ? "/dokumanlar/egitimler" : `/${modul}`;
    if (![yol, `${yol}/[id]`].some((u) => listedeMi(cfg, u))) eksik.push(`src/modules/${modul}/ui/eylemler.ts → ${s.ad}: ${yol} sayfası PDF listesinde değil`);
  }
  return eksik;
}
