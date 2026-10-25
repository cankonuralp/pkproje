/* SAHTE E-POSTA KUYRUĞU (2026-10-25, belge doldurma) — gonder.ts'in veritabanısız denetimi için: bekleyen satırlar, dosya kaydı (ekin anahtarı ve
   özeti), güncelleme (güvenli yazıcının SELECT … FOR UPDATE + UPDATE'i) ve iz. Yazılan güncellemeler kaydedilir. Depo ve sağlayıcı da sahte:
   depo anahtara göre bayt verir ya da düşer; sağlayıcı gelen isteği (eki dahil) kaydeder. Gerçek kuyruk + tetik: tests/planlar.test.ts (PG). */
import { createHash } from "node:crypto";
import type { Sorgulayici } from "../../src/server/db/kiraci.ts";
import type { Depo } from "../../src/server/dosya/depo.ts";
import type { FirmaGonderimAyari } from "../../src/server/eposta/firma.ts";
import type { EpostaSaglayici, Gonderim } from "../../src/server/eposta/saglayici.ts";

export interface SahteSatir {
  id: string; kime: string; konu: string; govde: string; deneme: number; son_hata: string | null; surum: number; durum: string; gonderildi: Date | null;
  gonderen_ad: string | null; gonderen_eposta: string | null; ek_dosya: string | null; ek_ad: string | null;
}
export const satir = (id: string, ek: { dosya: string; ad: string } | null, deneme = 0): SahteSatir => ({
  id, kime: `${id.slice(0, 4)}@musteri.example`, konu: "Konu", govde: "Metin", deneme, son_hata: null, surum: 0, durum: "bekliyor", gonderildi: null,
  gonderen_ad: null, gonderen_eposta: null, ek_dosya: ek?.dosya ?? null, ek_ad: ek?.ad ?? null,
});
export const ozet = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

export function sahteKuyruk(satirlar: SahteSatir[], dosyalar: Record<string, { anahtar: string; sha256: string }>) {
  const guncellenen: { id: string; degerler: Record<string, unknown> }[] = [];
  const bos = { rows: [] as unknown[], rowCount: 0, command: "", oid: 0, fields: [] };
  const db: Sorgulayici = {
    async sorgu(metin: string, p: readonly unknown[] = []) {
      const sonuc = (rows: unknown[]) => ({ ...bos, rows, rowCount: rows.length }) as never;
      if (metin.includes("FROM eposta WHERE durum = 'bekliyor'")) return sonuc(satirlar.map((x) => ({ ...x })));
      if (metin.includes("FROM dosya WHERE id = $1")) { const d = dosyalar[p[0] as string]; return sonuc(d ? [d] : []); }
      if (/FROM eposta WHERE id = \$1 FOR UPDATE/.test(metin)) return sonuc(satirlar.filter((x) => x.id === p[0]).map((x) => ({ ...x })));
      const g = /^UPDATE eposta SET (.*), surum = surum \+ 1/.exec(metin);
      if (g) {
        const sutun = g[1].split(", ").map((x) => x.split(" = ")[0]);
        guncellenen.push({ id: p[0] as string, degerler: Object.fromEntries(sutun.map((s, i) => [s, p[i + 2]])) });
        return sonuc([{ surum: (p[1] as number) + 1 }]);
      }
      return sonuc([]);   // denetim izi
    },
  };
  return { db, guncellenen, son: (id: string) => guncellenen.filter((x) => x.id === id).at(-1)?.degerler };
}

/** anahtar → bayt; listede olmayan anahtar okunamaz (depo düştü) */
export const sahteDepo = (icerik: Record<string, Uint8Array>): Depo => ({
  async yaz() { throw new Error("yazılmaz"); },
  async oku(anahtar) { const b = icerik[anahtar]; if (!b) throw new Error("depo okunamadı"); return b; },
  async copSil() {}, async oksuzSay() { return null; },
}) as Depo;

/** gelen istekleri kaydeden sağlayıcı (hep gönderildi) ve doğrulanmış alan adlı firma gönderimi */
export function sahteGonderim(): { ayar: FirmaGonderimAyari; giden: Gonderim[] } {
  const giden: Gonderim[] = [];
  const saglayici: EpostaSaglayici = { async gonder(e) { giden.push(e); return { tamam: true }; } };
  return { giden, ayar: { saglayici, firma: { alan: "deneme.example", genel: "bilgi@deneme.example", dogrulandi: true, firmaAd: "Deneme Muayene", kopya: false, rapor: null } } };
}
