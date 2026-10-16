/* SAĞLIK SAHTELERİ (FIRMA-VT FV7, 2026-10-15) — veritabanısız sınamalar için (tests/saglik-coklu-saf.test.ts, tests/bozan/saglik-coklu-saf.bozan.ts):
   · sahteHavuz: pg havuzunun kiraciIcinde / merkezOku / yonetimIcinde / havuz.query'nin kullandığı yüzü — her sorgu sırayla kaydedilir, cevabı
     testin işlevi verir (gecikme, hata, asılı kalma dahil); aynı anda açık bağlantı sayısı ölçülür;
   · hedefSatiri: goc_hedefleri()'nin satırı (yerel adres, uygulama rolü, parola testin anahtarıyla ŞİFRELİ — ek veri firma + ad);
   · dumanKos: tools/duman.mjs alt süreçte, sahte HTTP sunucusuna karşı (yalnız 127.0.0.1 / ::1 — dış ağa istek yok); sunucuya gelen istekler (yol +
     Authorization) ve çıktı döner.
   Bütün veri UYDURMA (CLAUDE.md §7). */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join } from "node:path";
import { baglantiSifrele } from "../../src/server/db/baglanti.ts";
import type { Havuz } from "../../src/server/db/kiraci.ts";
import type { SaglikVerisi } from "../../src/server/db/saglik.ts";
import { GOC_SAYISI, SON_GOC } from "../../src/server/db/son-goc.ts";
import { KOK } from "./denetimler.ts";

export const IYI: SaglikVerisi = {
  son_goc: SON_GOC, goc_sayisi: GOC_SAYISI, kiraci_tablo: 40, rls_eksik: 0, politikasiz: 0, api_sema: false, uygulama_ayricalikli: false, takili_is: 0,
};

export interface Cagri { sql: string; degerler?: readonly unknown[] }
export type SahteHavuz = Havuz & { cagrilar: Cagri[]; baglanti: number; enCokAcik: number };

/** sahte havuz: cevap(sql, değerler) satırları / hatayı verir (undefined → boş sonuç); baglan() bağlanmayı geciktirebilir / asabilir */
export function sahteHavuz(cevap: (sql: string, d?: readonly unknown[]) => unknown, o: { baglan?: () => Promise<void> } = {}): SahteHavuz {
  const cagrilar: Cagri[] = [];
  let baglanti = 0, acik = 0, enCokAcik = 0;
  const sorgu = async (sql: string, degerler?: readonly unknown[]) => {
    cagrilar.push({ sql, degerler });
    const r = await cevap(sql, degerler);
    return (r ?? { rows: [], rowCount: 0 }) as { rows: unknown[]; rowCount: number };
  };
  const h = {
    cagrilar,
    get baglanti() { return baglanti; },
    get enCokAcik() { return enCokAcik; },
    query: sorgu,
    async connect() {
      baglanti++;
      await o.baglan?.();
      acik++;
      enCokAcik = Math.max(enCokAcik, acik);
      let birakildi = false;
      return {
        on() {}, off() {},
        query: sorgu,
        release() { if (!birakildi) { birakildi = true; acik--; } },
      };
    },
  };
  return h as unknown as SahteHavuz;
}

/** sağlık sorgusuna veri, öteki sorgulara boş sonuç veren cevap */
export const saglikCevabi = (veri: SaglikVerisi, gecikme = 0) => async (sql: string) => {
  if (!sql.includes("saglik_denetimi()")) return undefined;
  if (gecikme) await new Promise((coz) => setTimeout(coz, gecikme));
  return { rows: [{ s: veri }], rowCount: 1 };
};

export const hata = (kod: string, ileti = "ileti") => Object.assign(new Error(ileti), { code: kod });

/** goc_hedefleri() satırı: yerel adres, uygulama rolü, parola anahtarla şifreli; ek: alanları ezer (kurulum, eksik alan …) */
export function hedefSatiri(anahtar: Buffer, ek: Record<string, unknown> = {}): Record<string, unknown> {
  const id = randomUUID();
  return {
    firma_id: id, ref: null, sunucu: "127.0.0.1", kapi: 5432, vt_ad: "probata", kullanici: "probata_uygulama",
    parola_sifreli: baglantiSifrele(`parola-${id.slice(0, 8)}`, id, null, "uygulama_parolasi", anahtar), surum: 1, kurulum_durum: "tamam", ...ek,
  };
}

/* ── duman testi alt süreçte ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface DumanIstegi { yol: string; yetki: string | undefined }
export interface DumanSonucu { kod: number | null; cikti: string; hata: string; istekler: DumanIstegi[] }

/** sahte site: /api/saglik/projeler → verilen cevap; /api/saglik → tamam; öteki her yol 404. Dinleme adresi 127.0.0.1 ya da ::1 (yalnız yerel). */
export async function sahteSite(projeler: { status: number; govde: unknown }, adres = "127.0.0.1") {
  const istekler: DumanIstegi[] = [];
  const s = createServer((i: IncomingMessage, y: ServerResponse) => {
    const yol = (i.url ?? "").split("?")[0]!;
    istekler.push({ yol, yetki: i.headers.authorization });
    const json = (status: number, govde: unknown) => { y.writeHead(status, { "content-type": "application/json" }); y.end(JSON.stringify(govde)); };
    if (yol === "/api/saglik/projeler") return json(projeler.status, projeler.govde);
    if (yol === "/api/saglik") return json(200, { durum: "tamam", surum: "deneme", denetimler: { veritabani: true, firma_vt: true } });
    return json(404, {});
  });
  await new Promise<void>((coz, reddet) => { s.once("error", reddet); s.listen(0, adres, () => coz()); });
  const a = s.address();
  const kapi = typeof a === "object" && a ? a.port : 0;
  return { istekler, kapi, kapat: () => new Promise<void>((coz) => s.close(() => coz())) };
}

/** tools/duman.mjs (ya da verilen kopyası) alt süreçte: iki adres de verilen site; ortamdan PROBATA_* / VERCEL* gelmez, PROBATA_DUMAN_SIR yalnız verilirse */
export function dumanKos(firma: string, sir: string | undefined, betik = join(KOK, "tools", "duman.mjs")): Promise<Omit<DumanSonucu, "istekler">> {
  const temiz: NodeJS.ProcessEnv = { ...process.env };
  for (const ad of Object.keys(temiz)) if (/^(PROBATA_|VERCEL)/i.test(ad)) delete temiz[ad];
  if (sir !== undefined) temiz.PROBATA_DUMAN_SIR = sir;
  return new Promise((coz, reddet) => {
    const c = spawn(process.execPath, [betik, firma, firma], { cwd: KOK, env: temiz });
    let cikti = "", hataCiktisi = "";
    c.stdout.setEncoding("utf8").on("data", (d: string) => { cikti += d; });
    c.stderr.setEncoding("utf8").on("data", (d: string) => { hataCiktisi += d; });
    const sayac = setTimeout(() => c.kill(), 60_000);
    c.on("error", reddet);
    c.on("close", (kod) => { clearTimeout(sayac); coz({ kod, cikti, hata: hataCiktisi }); });
  });
}
