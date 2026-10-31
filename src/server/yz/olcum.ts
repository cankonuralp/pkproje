/* S.A.Y İŞ ÖLÇÜMÜ VE AR-GE KAYDI (2026-10-31; reisim: "İş ölçümü: her iş için istek sayısı, en büyük istem, süre ve maliyet kaydedilir. Bugün yalnız aylık
   toplam var"; Ar-Ge dökümü: "eğer bize bir handikapı yoksa 30 gün saklansın (b)"; göç 0112, sunum L8).
   · istekOlcumuYaz: döngünün her yapay zekâ isteği (işin kimliği, token, maliyet, süre, yazma adımı, işlem sayısı, şablon, derinlik) — yalnız eklenir.
   · argeIcerigi (SAF): "Sohbeti temizle"den önce konuşmanın metni — kullanıcı / S.A.Y metni, araç çağrıları (ad + girdi), sonuçları (metin, kırpılmış);
     görüntü, belge, düşünce ve imzası ATILIR. argeKaydiYaz bunu ekler, kişinin 30 günü geçen kayıtlarını siler. Okuyan yalnız Yönetim (uygulama rolü okuyamaz).
   Kilit tests/say-olcum.test.ts. */
import type { Sorgulayici } from "../db/kiraci.ts";

export const ARGE_GUN = 30;
const SONUC_EN_COK = 4_000;
type Blok = Record<string, unknown>;
const bloklar = (c: unknown): Blok[] => (Array.isArray(c) ? c.filter((b): b is Blok => !!b && typeof b === "object") : typeof c === "string" ? [{ type: "text", text: c }] : []);
const kirp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)} …(${s.length - n} karakter kırpıldı)` : s);

/** konuşmanın Ar-Ge kopyası: yalnız metin, araç çağrısı ve sonucu */
export function argeIcerigi(mesajlar: readonly { rol: string; icerik: unknown }[]): { rol: string; bloklar: Blok[] }[] {
  const l: { rol: string; bloklar: Blok[] }[] = [];
  for (const m of mesajlar) {
    const b: Blok[] = [];
    for (const x of bloklar(m.icerik)) {
      if (x.type === "text" && typeof x.text === "string") b.push({ type: "text", text: x.text });
      else if (x.type === "tool_use") b.push({ type: "tool_use", name: x.name, input: x.input });
      else if (x.type === "server_tool_use") b.push({ type: "server_tool_use", name: x.name, input: x.input });
      else if (x.type === "tool_result") {
        const ic = typeof x.content === "string" ? x.content : bloklar(x.content).filter((y) => y.type === "text").map((y) => String(y.text ?? "")).join("\n");
        b.push({ type: "tool_result", text: kirp(ic, SONUC_EN_COK), ...(x.is_error ? { hata: true } : {}) });
      }
      /* image, document, thinking, redacted_thinking, web_search_tool_result: atılır */
    }
    if (b.length) l.push({ rol: m.rol, bloklar: b });
  }
  return l;
}

export async function argeKaydiYaz(db: Sorgulayici, mesajlar: readonly { rol: string; icerik: unknown }[]): Promise<void> {
  await db.sorgu(`DELETE FROM say_arge WHERE zaman < now() - make_interval(days => ${ARGE_GUN})`);
  const ic = argeIcerigi(mesajlar);
  if (!ic.length) return;
  await db.sorgu("INSERT INTO say_arge (ileti, icerik) VALUES ($1, $2::jsonb)", [ic.length, JSON.stringify(ic)]);
}

export interface IstekOlcumu {
  is: string; giris: number; okunan: number; yazilan: number; cikis: number; maliyet: number; sureMs: number; yazma: number; islem: number;
  sablon: string | null; derinlik: "high" | "medium";
}
export async function istekOlcumuYaz(db: Sorgulayici, o: IstekOlcumu): Promise<void> {
  await db.sorgu(`INSERT INTO say_istek (is_id, giris, okunan, yazilan, cikis, maliyet, sure_ms, yazma, islem, sablon, derinlik)
    VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
  [o.is, o.giris, o.okunan, o.yazilan, o.cikis, o.maliyet, Math.max(0, Math.round(o.sureMs)), o.yazma, o.islem, o.sablon && /^S\d{1,3}$/.test(o.sablon) ? o.sablon : null, o.derinlik]);
}
