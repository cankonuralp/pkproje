/* AKIŞLI YAPAY ZEKÂ ÇAĞRISI (2026-10-23 — reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız",
   "baştan kurarken herhangi bir kısıt kurma tamamen temiz kurulum yap") — Messages API'nin akışlı cevabı (SSE). Olaylar çözülür, cevap blok blok
   birikir: metin, düşünme ve imzası, araç çağrısının girdisi (JSON parçaları), sunucu araçlarının sonuçları (internet araması); bilinmeyen blok ve
   parça türleri de kaybolmadan biriktirilir (konuşma olduğu gibi geri gönderilir). Metin ve düşünme parçaları geldikçe dinleyiciye iletilir.
   · Ayrıştırıcı ve biriktirici SAF (tests/say-akis.test.ts); ağ çağrısı ayrı (anthropicAkis — uç PROBATA_YZ_UC, yoksa Anthropic).
   · Zaman sınırı yok: çağrı bitene kadar sürer (barındırmanın işlev süresi dolarsa iş kaydedildiği yerden sürer — src/modules/say/server/dongu.ts).
   · Akış yarıda kesilirse (bağlantı, hizmetin akış içi hatası) birikmiş kısım hatayla döner; çağıran konuşmaya YAZMAZ (yarım cevap geri
     gönderilmez), aynı yerden yeniden ister. */
import { anahtarsiz, hizmetNedeni } from "./okuma.ts";

export type Blok = Record<string, unknown> & { type: string };
export interface AkisMesaji { id: string; model: string; content: Blok[]; stop_reason: string | null; usage: Record<string, unknown> }
export interface AkisDinleyici { metin?: (d: string) => void; dusunce?: (d: string) => void; blokBasladi?: (b: Blok) => void }
export type AkisYaniti = { durum: "tamam"; mesaj: AkisMesaji }
  | { durum: "hata"; neden: string; ucret: "yok" | "bilinmiyor"; kod?: number; ileti?: string; mesaj?: AkisMesaji | null };

/** SSE çerçevesi: gelen metin parçası tampona eklenir, tamamlanan olaylar (boş satırla biten) döner, yarım kalan tamponda bekler */
export function sseAyir(tampon: { kalan: string }, parca: string): { olay: string; veri: string }[] {
  tampon.kalan += parca.replace(/\r\n?/g, "\n");
  const l: { olay: string; veri: string }[] = [];
  let i: number;
  while ((i = tampon.kalan.indexOf("\n\n")) >= 0) {
    const ham = tampon.kalan.slice(0, i);
    tampon.kalan = tampon.kalan.slice(i + 2);
    let olay = "message";
    const veri: string[] = [];
    for (const satir of ham.split("\n")) {
      if (satir.startsWith(":")) continue;
      const k = satir.indexOf(":");
      const ad = k < 0 ? satir : satir.slice(0, k), deger = k < 0 ? "" : satir.slice(k + 1).replace(/^ /, "");
      if (ad === "event") olay = deger;
      else if (ad === "data") veri.push(deger);
    }
    if (veri.length) l.push({ olay, veri: veri.join("\n") });
  }
  return l;
}

const nesne = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : {});
const kopya = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** cevabın birikimi: olaylar sırayla verilir; bitti — message_stop geldi; hata — hizmetin akış içi hatası */
export class AkisBirikimi {
  mesaj: AkisMesaji | null = null;
  bitti = false;
  hata: { type: string; message: string } | null = null;
  private json = new Map<number, string>();

  olay(tur: string, veri: unknown, d: AkisDinleyici = {}): void {
    const v = nesne(veri);
    if (tur === "message_start") {
      const m = nesne(v.message);
      this.mesaj = { id: String(m.id ?? ""), model: String(m.model ?? ""), content: [], stop_reason: (m.stop_reason as string | null) ?? null,
        usage: { ...nesne(m.usage) } };
      return;
    }
    if (tur === "error") { const e = nesne(v.error); this.hata = { type: String(e.type ?? "error"), message: String(e.message ?? "") }; return; }
    if (tur === "message_stop") { this.bitti = true; return; }
    const m = this.mesaj;
    if (!m) return;
    if (tur === "content_block_start") {
      const i = Number(v.index), b = kopya(nesne(v.content_block)) as Blok;
      if (!Number.isInteger(i) || i < 0 || typeof b.type !== "string") return;
      m.content[i] = b;
      if (b.type === "tool_use" || b.type === "server_tool_use" || b.type === "mcp_tool_use") this.json.set(i, "");
      d.blokBasladi?.(b);
      return;
    }
    if (tur === "content_block_delta") {
      const i = Number(v.index), b = m.content[i], p = nesne(v.delta);
      if (!b) return;
      if (p.type === "text_delta") { const t = String(p.text ?? ""); b.text = String(b.text ?? "") + t; d.metin?.(t); return; }
      if (p.type === "thinking_delta") { const t = String(p.thinking ?? ""); b.thinking = String(b.thinking ?? "") + t; d.dusunce?.(t); return; }
      if (p.type === "signature_delta") { b.signature = String(b.signature ?? "") + String(p.signature ?? ""); return; }
      if (p.type === "input_json_delta") { this.json.set(i, (this.json.get(i) ?? "") + String(p.partial_json ?? "")); return; }
      if (p.type === "citations_delta") { b.citations = [...(Array.isArray(b.citations) ? b.citations : []), p.citation]; return; }
      /* bilinmeyen parça: metin alanları eklenir, ötekiler yazılır (blok olduğu gibi geri gönderilir) */
      for (const [k, x] of Object.entries(p)) {
        if (k === "type") continue;
        b[k] = typeof x === "string" && typeof b[k] === "string" ? (b[k] as string) + x : x;
      }
      return;
    }
    if (tur === "content_block_stop") {
      const i = Number(v.index), b = m.content[i];
      if (!b || !this.json.has(i)) return;
      const j = this.json.get(i) ?? "";
      this.json.delete(i);
      try { b.input = j.trim() ? JSON.parse(j) : {}; } catch { b.input = {}; b._bozuk_girdi = true; }
      return;
    }
    if (tur === "message_delta") {
      const p = nesne(v.delta);
      if ("stop_reason" in p) m.stop_reason = (p.stop_reason as string | null) ?? null;
      Object.assign(m.usage, nesne(v.usage));
    }
  }

  /** hizmete geri gönderilecek içerik: boş kalan yer (atlanmış dizin) yok, birikim yardımcı alanları yok */
  icerik(): Blok[] {
    return (this.mesaj?.content ?? []).filter((b): b is Blok => !!b).map((b) => {
      const x = { ...b };
      delete x._bozuk_girdi;
      return x;
    });
  }
}

/** akışlı çağrı (yalnız sunucu): anahtar başlıkta; betalar "anthropic-beta" başlığında. Zaman sınırı yok — signal verilirse çağıran keser */
export async function anthropicAkis(govde: Record<string, unknown>, anahtar: string, betalar: readonly string[], d: AkisDinleyici = {},
  signal?: AbortSignal): Promise<AkisYaniti> {
  const uc = (process.env.PROBATA_YZ_UC || "https://api.anthropic.com").replace(/\/$/, "");
  let r: Response;
  try {
    r = await fetch(`${uc}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": anahtar, "anthropic-version": "2023-06-01", ...(betalar.length ? { "anthropic-beta": betalar.join(",") } : {}) },
      body: JSON.stringify({ ...govde, stream: true }),
      signal,
    });
  } catch {
    return { durum: "hata", neden: "Yapay zekâ hizmetine ulaşılamadı. Bağlantıyı kontrol edip yeniden deneyin.", ucret: "yok" };
  }
  if (!r.ok) {
    let tur = "", ileti = "";
    try { const e = (await r.json() as { error?: { type?: unknown; message?: unknown } }).error; tur = String(e?.type ?? ""); ileti = String(e?.message ?? ""); } catch { /* gövde yok */ }
    console.error(`[yapay zekâ] ${r.status} ${tur}: ${anahtarsiz(ileti).slice(0, 300)}`);
    return { durum: "hata", neden: hizmetNedeni(r.status, ileti), ucret: "yok", kod: r.status, ileti: anahtarsiz(ileti).slice(0, 300) };
  }
  const b = new AkisBirikimi(), tampon = { kalan: "" };
  if (!r.body) return { durum: "hata", neden: "Yapay zekâ yanıtı okunamadı.", ucret: "bilinmiyor" };
  const okuyucu = r.body.getReader(), cozucu = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await okuyucu.read();
      const metin = done ? cozucu.decode() : cozucu.decode(value, { stream: true });
      for (const o of sseAyir(tampon, metin)) {
        let veri: unknown;
        try { veri = JSON.parse(o.veri); } catch { continue; }
        b.olay(o.olay === "message" ? String(nesne(veri).type ?? "") : o.olay, veri, d);
      }
      if (done || b.bitti || b.hata) break;
    }
  } catch {
    return { durum: "hata", neden: "Yapay zekâ cevabı yarıda kesildi; kaldığı yerden sürüyor.", ucret: "bilinmiyor", mesaj: b.mesaj };
  }
  if (b.hata) {
    const kod = b.hata.type === "overloaded_error" ? 529 : b.hata.type === "rate_limit_error" ? 429 : 500;
    return { durum: "hata", neden: hizmetNedeni(kod, b.hata.message), ucret: "bilinmiyor", kod, ileti: anahtarsiz(b.hata.message).slice(0, 300), mesaj: b.mesaj };
  }
  if (!b.mesaj || !b.bitti) return { durum: "hata", neden: "Yapay zekâ cevabı yarıda kesildi; kaldığı yerden sürüyor.", ucret: "bilinmiyor", mesaj: b.mesaj };
  return { durum: "tamam", mesaj: { ...b.mesaj, content: b.icerik() } };
}

/** Anthropic Dosya API'si (2026-10-23 — ek konuşmada kalır): yükle → dosya kimliği; sil (Sohbeti temizle). Uç aynı (PROBATA_YZ_UC) */
export async function anthropicDosyaYukle(bayt: Uint8Array, ad: string, mime: string, anahtar: string): Promise<{ durum: "tamam"; id: string } | { durum: "hata"; neden: string }> {
  const uc = (process.env.PROBATA_YZ_UC || "https://api.anthropic.com").replace(/\/$/, "");
  const form = new FormData();
  form.append("file", new Blob([bayt as BlobPart], { type: mime }), ad);
  const istek = (beta: boolean) => fetch(`${uc}/v1/files`, { method: "POST", body: form,
    headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01", ...(beta ? { "anthropic-beta": "files-api-2025-04-14" } : {}) } });
  try {
    let r = await istek(false);
    /* hizmet dosya uçlarını eski beta başlığıyla isterse bir kez onunla */
    if (r.status === 400 || r.status === 404) r = await istek(true);
    if (!r.ok) {
      let ileti = "";
      try { ileti = String((await r.json() as { error?: { message?: unknown } }).error?.message ?? ""); } catch { /* gövde yok */ }
      console.error(`[yapay zekâ dosya] ${r.status}: ${anahtarsiz(ileti).slice(0, 300)}`);
      return { durum: "hata", neden: r.status === 413 ? "Dosya hizmetin kabul ettiğinden büyük." : hizmetNedeni(r.status, ileti) };
    }
    const id = String((await r.json() as { id?: unknown }).id ?? "");
    return id ? { durum: "tamam", id } : { durum: "hata", neden: "Dosya yüklenemedi." };
  } catch {
    return { durum: "hata", neden: "Yapay zekâ hizmetine ulaşılamadı. Bağlantıyı kontrol edip yeniden deneyin." };
  }
}
export async function anthropicDosyaSil(id: string, anahtar: string): Promise<void> {
  const uc = (process.env.PROBATA_YZ_UC || "https://api.anthropic.com").replace(/\/$/, "");
  try {
    const r = await fetch(`${uc}/v1/files/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" } });
    if (r.status === 400 || r.status === 404) {
      await fetch(`${uc}/v1/files/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01", "anthropic-beta": "files-api-2025-04-14" } });
    }
  } catch { /* silinemedi — hizmette kalır; sohbet yine temizlenir */ }
}
