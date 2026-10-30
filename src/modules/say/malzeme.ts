/* S.A.Y MALZEMESİ (2026-10-31, kalem 2 — sunum "S.A.Y'a tam yetenek", B02): kullanıcı işi hangi biçimde verirse versin (tek tek fotoğraf, ZIP, PDF,
   Word, Excel, ekran görüntüsü, sohbet dışa aktarımı) S.A.Y malzemeyi numaralı, adlı, saatli ve sıralı görür. Kanala özel akış YOK: sohbet dışa
   aktarımı yalnız bir metin biçimidir — iletiler zamanı ve medyanın dosya adıyla tek düzene çevrilir (gönderen adı çıkar), medya aynı adlı eke
   bağlanır. Saf; kilit tests/say-malzeme.test.ts. */

export interface SohbetIletisi { tarih: string; saat: string; metin: string; medya: string[]; eksikMedya: boolean }

const ILETI = /^‎?\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?(?:\s?([AaPp])\.?[Mm]\.?)?\]?\s*(?:-\s)?([^:\n]{1,60}?):\s(.*)$/;
const EK = /<(?:ekli|attached|ek|anexo|adjunto)\s*:\s*([^>]{1,200})>/gi;
const EK_ANDROID = /([\w.()-]{1,160}\.(?:jpe?g|png|heic|webp|pdf|docx?|xlsx?|opus|mp4|vcf))\s*\((?:dosya ekli|file attached|dosya eklendi)\)/gi;
const EKSIK = /<?\s*(medya dahil edilmedi|media omitted|görüntü dahil edilmedi|image omitted|video omitted|belge dahil edilmedi|document omitted)\s*>?/i;
/** zamanla başlayan satır (göndereni olsun olmasın) */
const BASLIK = /^\[?\d{1,2}[./-]\d{1,2}[./-]\d{2,4},?\s+\d{1,2}[:.]\d{2}/;
const gorunmez = (s: string) => s.replace(/[‎‏‪-‮﻿]/g, "");

/** sohbet dışa aktarımı mı; öyleyse iletileri (sistem iletileri atlanır, çok satırlı ileti birleşir) — değilse null */
export function sohbetIletileri(metin: string): SohbetIletisi[] | null {
  const l: SohbetIletisi[] = [];
  let tanidik = 0, sistem = false;
  for (const satirHam of metin.replace(/\r\n?/g, "\n").split("\n")) {
    const satir = gorunmez(satirHam).trimEnd();
    const m = ILETI.exec(satir);
    if (m) {
      tanidik++;
      sistem = false;
      const [, g, a, y, s, d, ogle, , govde] = m;
      let saat = Number(s);
      if (ogle) saat = (saat % 12) + (/p/i.test(ogle) ? 12 : 0);
      const yil = y!.length === 2 ? `20${y}` : y!;
      /* ay önce yazılmış (ikinci sayı > 12 ya da 12 saatlik ABD biçimi) */
      const ters = Number(a) > 12 || (!!ogle && Number(g) <= 12);
      const [gun, ay] = ters ? [a!, g!] : [g!, a!];
      l.push(ileti(`${gun.padStart(2, "0")}.${ay.padStart(2, "0")}.${yil}`, `${String(saat).padStart(2, "0")}:${d}`, govde!));
    } else if (BASLIK.test(satir)) {
      /* zamanla başlayıp göndereni olmayan satır sistem iletisidir (şifreleme, gruba katılma …): atlanır, ardındaki satırlar da ona aittir */
      sistem = true;
    } else if (l.length && satir.trim() && !sistem) {
      const son = l[l.length - 1]!, ek = ileti(son.tarih, son.saat, satir);
      son.metin = [son.metin, ek.metin].filter(Boolean).join(" ⏎ ");
      son.medya.push(...ek.medya);
      son.eksikMedya ||= ek.eksikMedya;
    }
  }
  return tanidik >= 2 ? l : null;
}
function ileti(tarih: string, saat: string, govde: string): SohbetIletisi {
  const medya: string[] = [];
  let metin = govde.replace(EK, (_, ad: string) => { medya.push(ad.trim()); return ""; }).replace(EK_ANDROID, (_, ad: string) => { medya.push(ad.trim()); return ""; });
  const eksikMedya = EKSIK.test(metin);
  metin = metin.replace(EKSIK, "").replace(/\s+/g, " ").trim();
  return { tarih, saat, metin, medya, eksikMedya };
}

/** sohbet dökümünün S.A.Y'a giden düzeni: "#01 27.10.2026 09:56 [IMG-0012.jpg] metin" — gönderen adı yok */
export function sohbetDuzeni(l: readonly SohbetIletisi[]): string {
  const g = String(l.length).length > 2 ? 3 : 2;
  return [`Sohbet dökümü: ${l.length} ileti (sırası kaynağın sırası; gönderen adları çıkarıldı; [ad] o iletideki medyanın dosya adı — aynı adlı ek odur).`,
    ...l.map((x, i) => `#${String(i + 1).padStart(g, "0")} ${x.tarih} ${x.saat}${x.medya.map((m) => ` [${m}]`).join("")}${x.eksikMedya ? " [medya dışa aktarılmamış]" : ""}${x.metin ? ` ${x.metin}` : ""}`)].join("\n");
}

/* ── ekler: numara, ad, saat, sıra ── */
export interface MalzemeEki { dosya: string; tur: "foto" | "pdf" | "word" | "metin" | "tablo"; ad: string; cekim: string | null; no: number; fno: number | null }
const TUR_ADI: Record<MalzemeEki["tur"], string> = { foto: "fotoğraf", pdf: "PDF", word: "Word belgesinin metni", metin: "metin dosyası", tablo: "Excel tablosu (metin)" };
const iki = (n: number) => String(n).padStart(2, "0");
const saatTr = (c: string) => `${c.slice(8, 10)}.${c.slice(5, 7)}.${c.slice(0, 4)} ${c.slice(11)}`;

/** sıra: eklenme sırası; fotoğrafların hepsinin çekim saati varsa fotoğraflar kendi yerlerinde çekim saatine göre dizilir */
export function malzemeSirasi<T extends { tur: string; cekim: string | null }>(ekler: readonly T[]): T[] {
  const fotolar = ekler.filter((e) => e.tur === "foto");
  if (fotolar.length < 2 || fotolar.some((e) => !e.cekim)) return [...ekler];
  const sirali = [...fotolar].sort((a, b) => (a.cekim! < b.cekim! ? -1 : a.cekim! > b.cekim! ? 1 : 0));
  let k = 0;
  return ekler.map((e) => (e.tur === "foto" ? sirali[k++]! : e));
}
/** ekin başlığı: "M03 · F02 — fotoğraf · komp.jpeg · çekim 27.10.2026 09:56" */
export function ekBasligi(e: MalzemeEki): string {
  return `M${iki(e.no)}${e.fno ? ` · F${iki(e.fno)}` : ""} — ${TUR_ADI[e.tur]} · ${e.ad.slice(0, 80)}${e.cekim ? ` · çekim ${saatTr(e.cekim)}` : ""}`;
}
/** bu iletinin malzeme özeti */
export function malzemeOzeti(ekler: readonly MalzemeEki[]): string {
  const f = ekler.filter((e) => e.fno), say = new Map<string, number>();
  for (const e of ekler) if (!e.fno) say.set(TUR_ADI[e.tur], (say.get(TUR_ADI[e.tur]) ?? 0) + 1);
  const parca = [...(f.length ? [`${f.length} fotoğraf (${f.length > 1 ? `F${iki(Math.min(...f.map((x) => x.fno!)))}–F${iki(Math.max(...f.map((x) => x.fno!)))}` : `F${iki(f[0]!.fno!)}`})`] : []),
    ...[...say].map(([t, n]) => `${n} ${t}`)];
  return `Malzeme (bu iletide ${ekler.length} öğe: ${parca.join(", ")}). Numaralar konuşma boyunca aynı kalır; sıra kaynağın sırası, yoksa çekim saati, yoksa eklenme.`;
}
