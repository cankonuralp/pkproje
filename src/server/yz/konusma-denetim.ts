/* S.A.Y KONUŞMASININ BÜTÜNLÜĞÜ (2026-10-31, K1 — sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"). 2026-10-28 canlı denemede aynı araç
   çağrısına iki sonuç yazıldı (gerçek sonuç + "iş yarıda bırakıldı"); hizmet sonraki her isteği reddetti, konuşma yalnız sona eklendiği için bozuk
   kaldı. Konuşma değişmez (göç 0103), bu yüzden onarım OKURKEN yapılır: her istekten önce konuşma bu işlevden geçer. Saf ve belirlenimli — aynı
   konuşma her seferinde aynı sonucu verir (önbellek ve düşünme bağı bozulmaz); sağlam konuşma OLDUĞU GİBİ döner.
   Kurallar: her araç çağrısının tek sonucu olur ve sonuç çağrıdan sonraki ilk kullanıcı iletisinin başındadır; fazla ve öksüz sonuç düşer; sonucu
   olmayan çağrıya "yarıda" sonucu girer (konuşmanın sonundaki açık çağrılar hariç — onları döngü kapatır); boşalan ileti düşer. */

export interface KonusmaMesaji { role: string; content: unknown }

type Blok = Record<string, unknown>;
const bloklar = (c: unknown): Blok[] | null => (Array.isArray(c) ? c.filter((b): b is Blok => !!b && typeof b === "object") : null);
const sonucMu = (b: Blok) => b.type === "tool_result" && typeof b.tool_use_id === "string";
const cagrilar = (m: KonusmaMesaji) => (bloklar(m.content) ?? []).filter((b) => b.type === "tool_use" && typeof b.id === "string").map((b) => b.id as string);

/** düzeltilmiş konuşma + ne düzeltildi (yalnız sayılar; içerik yok). Düzeltme yoksa konuşma aynen */
export function konusmaDuzelt(mesajlar: readonly KonusmaMesaji[], yarida: string): { mesajlar: KonusmaMesaji[]; duzeltmeler: string[] } {
  const out: KonusmaMesaji[] = mesajlar.map((m) => ({ role: m.role, content: m.content }));
  let fazla = 0, oksuz = 0, eksik = 0, tasinan = 0;
  /* ilk yapay zekâ iletisinden önceki sonuçlar öksüzdür */
  const ilkA = out.findIndex((m) => m.role === "assistant");
  for (let j = 0; j < (ilkA < 0 ? out.length : ilkA); j++) {
    const b = out[j].role === "user" ? bloklar(out[j].content) : null;
    if (b?.some(sonucMu)) { oksuz += b.filter(sonucMu).length; out[j] = { role: "user", content: b.filter((x) => !sonucMu(x)) }; }
  }
  for (let i = 0; i < out.length; i++) {
    if (out[i].role !== "assistant") continue;
    const idler = cagrilar(out[i]);
    let son = i + 1;
    while (son < out.length && out[son].role !== "assistant") son++;
    let ilkK = -1;
    for (let j = i + 1; j < son; j++) if (out[j].role === "user") { ilkK = j; break; }
    /* konuşmanın sonundaki açık çağrılar (ardında kullanıcı iletisi yok) döngünündür */
    if (ilkK < 0 && son === out.length) continue;
    const kalan = new Set(idler), bulunan: Blok[] = [];
    let bozuk = false;
    for (let j = i + 1; j < son; j++) {
      const b = out[j].role === "user" ? bloklar(out[j].content) : null;
      if (!b?.some(sonucMu)) continue;
      const geri: Blok[] = [];
      for (const x of b) {
        if (!sonucMu(x)) { geri.push(x); continue; }
        const id = x.tool_use_id as string;
        if (kalan.has(id)) { kalan.delete(id); bulunan.push(x); if (j !== ilkK) { tasinan++; bozuk = true; } }
        else { if (idler.includes(id)) fazla++; else oksuz++; bozuk = true; }
      }
      out[j] = { role: "user", content: geri };
    }
    if (kalan.size) { eksik += kalan.size; bozuk = true; for (const id of kalan) bulunan.push({ type: "tool_result", tool_use_id: id, content: yarida, is_error: true }); }
    if (!bozuk) {
      /* sağlam: sonuçlar zaten ilk kullanıcı iletisinde — o ileti olduğu gibi */
      if (ilkK >= 0) out[ilkK] = { role: "user", content: mesajlar[ilkK].content };
      continue;
    }
    if (ilkK < 0) { out.splice(i + 1, 0, { role: "user", content: bulunan }); continue; }
    const ilk = bloklar(out[ilkK].content);
    const yazi = out[ilkK].content;
    out[ilkK] = { role: "user", content: [...bulunan, ...(ilk ?? (typeof yazi === "string" && yazi ? [{ type: "text", text: yazi }] : []))] };
  }
  const duzeltmeler = [
    ...(fazla ? [`${fazla} fazla sonuç düştü`] : []), ...(oksuz ? [`${oksuz} öksüz sonuç düştü`] : []),
    ...(eksik ? [`${eksik} sonuçsuz çağrı kapandı`] : []), ...(tasinan ? [`${tasinan} sonuç yerine taşındı`] : []),
  ];
  if (!duzeltmeler.length) return { mesajlar: mesajlar.map((m) => ({ role: m.role, content: m.content })), duzeltmeler };
  /* boşalan kullanıcı iletisi düşer (boş içerik geçersiz) */
  return { mesajlar: out.filter((m) => !(m.role === "user" && Array.isArray(m.content) && m.content.length === 0)), duzeltmeler };
}

/** konuşmanın son yapay zekâ iletisinde AÇIK olan çağrılara ait sonuçlar (başka yol kapattıysa düşer — iki sonuç yazılmasın) */
export function acikSonuclar<T>(sonIcerik: unknown, sonuclar: Readonly<Record<string, T>>): [string, T][] {
  const acik = new Set(cagrilar({ role: "assistant", content: sonIcerik }));
  return Object.entries(sonuclar).filter(([id]) => acik.has(id));
}
