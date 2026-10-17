/* ZAMAN DAMGASI İSTEMCİSİ — RFC 3161 (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). İstek DER'i kurulur, sunucuya HTTP POST (application/timestamp-query),
   cevap çözülür, damga doğrulanır (iz = gönderilen özet, damganın kendi imzası, tek kullanımlık sayı). Sunucunun adresi ve kimlik bilgisi
   dışarıdan (hesap kararı ertelendi — kontörü kim alacak; KamuSM'nin kendine özgü kimlik doğrulaması belgesi okunamadı, IMZA-SERVISI.md §7):
   şimdilik Basic kimlik ya da ek başlık. Ağ çağrısı enjekte edilir (testte taklit sunucu). */
import { createHash, randomBytes } from "node:crypto";
import { bekle, cocuklar, dugum, ic, okuyucu, tum, BozukDer } from "./der.ts";
import { mantiksal, oid, oktet, sira, tamsayi } from "./der.ts";
import { damgaDenetle, imzaliVeriOku, tstOku, OZET_OID } from "./cms.ts";

export type Getir = (adres: string, istek: { method: "POST" | "GET"; headers: Record<string, string>; body?: Buffer; signal?: AbortSignal }) =>
  Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer> }>;

export interface DamgaAyari {
  uc: string;
  kullanici?: string;
  parola?: string;
  /** sunucuya özgü ek başlıklar (istek gövdesinden üretilebilir) */
  basliklar?: (istek: Buffer) => Record<string, string>;
  ozet?: "sha256" | "sha384" | "sha512";
  politika?: string;
  getir?: Getir;
  /** milisaniye */
  sure?: number;
}

export class DamgaHatasi extends Error {}
const SINIR = 64 * 1024;

/** TimeStampReq DER: v1, özet, tek kullanımlık sayı, sertifika istenir */
export function damgaIstegi(ozet: Buffer, ozetAdi: "sha256" | "sha384" | "sha512", nonce: Buffer, politika?: string): Buffer {
  return sira(
    tamsayi(1),
    sira(sira(oid(OZET_OID[ozetAdi]), Buffer.from([0x05, 0x00])), oktet(ozet)),
    ...(politika ? [oid(politika)] : []),
    tamsayi(nonce),
    mantiksal(true),
  );
}

/** TimeStampResp → token (ContentInfo DER); verilmediyse durumuyla hata */
export function damgaCevabi(der: Uint8Array): Buffer {
  try {
    const o = okuyucu(der);
    const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
    const durum = cocuklar(o, bekle(p[0], 0x30));
    const kod = ic(o, bekle(durum[0], 0x02));
    const n = kod.reduce((t, x) => t * 256 + x, 0);
    if (n !== 0 && n !== 1) throw new DamgaHatasi(`zaman damgası verilmedi (durum ${n})`);
    if (!p[1]) throw new DamgaHatasi("cevapta damga yok");
    return Buffer.from(tum(o, bekle(p[1], 0x30)));
  } catch (e) {
    if (e instanceof BozukDer || e instanceof RangeError) throw new DamgaHatasi("zaman damgası cevabı okunamadı");
    throw e;
  }
}

/** TSTInfo'daki tek kullanımlık sayı (yoksa null) */
function tstNonce(token: Uint8Array): string | null {
  const v = imzaliVeriOku(token);
  if (!v.icerik) return null;
  tstOku(v.icerik);
  const o = okuyucu(v.icerik);
  const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
  /* sürüm, politika, iz, seri, zaman, [doğruluk SEQ], [sıra BOOLEAN], [nonce INTEGER] */
  for (const d of p.slice(5)) if (d.tag === 0x02) return Buffer.from(ic(o, d)).toString("hex").replace(/^0+(?=.)/, "");
  return null;
}

/** verinin (parçalar) damgası — doğrulanmış token */
export async function damgaAl(veri: readonly Uint8Array[], a: DamgaAyari): Promise<Buffer> {
  const ozetAdi = a.ozet ?? "sha256";
  const h = createHash(ozetAdi); for (const p of veri) h.update(p);
  const nonce = randomBytes(8); nonce[0] &= 0x7f;
  const istek = damgaIstegi(h.digest(), ozetAdi, nonce, a.politika);
  const basliklar: Record<string, string> = { "content-type": "application/timestamp-query", ...(a.basliklar?.(istek) ?? {}) };
  if (a.kullanici) basliklar.authorization = `Basic ${Buffer.from(`${a.kullanici}:${a.parola ?? ""}`).toString("base64")}`;
  const getir = a.getir ?? (globalThis.fetch as unknown as Getir);
  const c = await getir(a.uc, { method: "POST", headers: basliklar, body: istek, signal: AbortSignal.timeout(a.sure ?? 15_000) });
  if (!c.ok) throw new DamgaHatasi(`zaman damgası sunucusu ${c.status}`);
  const b = Buffer.from(await c.arrayBuffer());
  if (b.length > SINIR) throw new DamgaHatasi("zaman damgası cevabı çok büyük");
  const token = damgaCevabi(b);
  const d = damgaDenetle(token, veri);
  if (d.iz !== "tamam" || d.imza !== "tamam" || d.ozet !== "tamam") throw new DamgaHatasi("zaman damgası doğrulanamadı");
  if (tstNonce(token) !== nonce.toString("hex").replace(/^0+(?=.)/, "")) throw new DamgaHatasi("zaman damgasının tek kullanımlık sayısı tutmuyor");
  return token;
}
