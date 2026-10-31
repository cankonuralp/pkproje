/* BİTİRMEDEN DENETİM (2026-10-31; reisim: "Raporlara yazan iş bitince döngü plan_denetle'yi kendisi çalıştırır. Düzeltebildiğini düzeltir, kalanı
   bildirimin 'Kalan engel' satırına yazar. Bu denemede 8 raporun hiçbiri onaya gidemiyordu ve S.A.Y bunu söylemedi."; sunum L3). SAF.
   Kullanıcının son sorusundan bu yana konuşmada rapora yazan bir işlem varsa ve ondan sonra denetim (plan_denetle ya da sunucunun bu notu) yoksa,
   döngü S.A.Y'ın son cevabından sonra denetimi kendisi çalıştırır ve sonucu konuşmaya ekler; S.A.Y düzeltir ve kısa bildirimi yazar. Bir işte en
   çok iki kez (düzeltmeden sonra bir kez daha) — sonsuz döngü yok. Kilit tests/say-bitis-denetimi.test.ts. */

export const DENETIM_ONEKI = "Sunucunun bitiş denetimi";
/** 2026-10-31 (V21 madde 7): dört satırı aşan bildirim için sunucunun notu (is-siniri.ts bildirimNotu) — soru sayılmaz, iş sınırı değişmez */
export const BILDIRIM_ONEKI = "Sunucunun bildirim notu";
/** sunucunun konuşmaya kullanıcı tarafında eklediği not mu (kullanıcının sorusu değil) */
export const sunucuNotuMu = (t: string): boolean => t.startsWith(DENETIM_ONEKI) || t.startsWith(BILDIRIM_ONEKI);
/** rapor açan ya da rapora yazan işlemler (Raporlar ve Planlar'ın S.A.Y işlemleri) */
export const RAPOR_YAZAN: ReadonlySet<string> = new Set(["rapor_ac", "rapor_yaz", "raporlara_yaz", "rapor_saat_plani", "rapor_foto_ekle", "rapor_foto_kaldir",
  "rapor_format_guncelle", "rapor_kopyala", "rapor_takip_ac", "plan_kunye_guncelle", "say_chat_rapor_yaz"]);
export const DENETIM_EN_COK = 2;

interface Mesaj { role: string; content: unknown }
type Blok = Record<string, unknown>;
const bloklar = (c: unknown): Blok[] => (Array.isArray(c) ? c.filter((b): b is Blok => !!b && typeof b === "object") : typeof c === "string" ? [{ type: "text", text: c }] : []);
const metinler = (m: Mesaj) => bloklar(m.content).filter((b) => b.type === "text").map((b) => String(b.text ?? ""));
const kimlik = (x: unknown): string | null => (typeof x === "string" && /^[0-9a-f-]{36}$/.test(x) ? x : null);

/** kullanıcının sorusu mu: sonuç bloğu taşımayan, sunucunun denetim notu olmayan kullanıcı iletisi */
const soruMu = (m: Mesaj) => m.role === "user" && !bloklar(m.content).some((b) => b.type === "tool_result") && metinler(m).some((t) => !sunucuNotuMu(t));

/** denetim gerekiyorsa denetlenecek plan ve raporlar; gerekmiyorsa null */
export function bitisDenetimi(mesajlar: readonly Mesaj[]): { plan: string | null; raporlar: string[] } | null {
  let bas = 0;
  for (let i = mesajlar.length - 1; i >= 0; i--) if (soruMu(mesajlar[i]!)) { bas = i; break; }
  let sonYazma = -1, sonDenetim = -1, denetim = 0, plan: string | null = null;
  const raporlar = new Set<string>();
  mesajlar.slice(bas).forEach((m, j) => {
    if (m.role === "user" && metinler(m).some((t) => t.startsWith(DENETIM_ONEKI))) { denetim++; sonDenetim = j; }
    if (m.role !== "assistant") return;
    for (const b of bloklar(m.content)) {
      if (b.type !== "tool_use" || b.name !== "islem") continue;
      const g = (b.input && typeof b.input === "object" ? b.input : {}) as { ad?: unknown; girdi?: Record<string, unknown> };
      const ad = String(g.ad ?? ""), x = g.girdi && typeof g.girdi === "object" ? g.girdi : {};
      if (ad === "plan_denetle") { sonDenetim = j; continue; }
      if (!RAPOR_YAZAN.has(ad)) continue;
      sonYazma = j;
      plan ??= kimlik(x.plan);
      const r = kimlik(x.rapor);
      if (r) raporlar.add(r);
      if (Array.isArray(x.raporlar)) for (const y of x.raporlar) { const k = kimlik(y) ?? kimlik((y as { rapor?: unknown } | null)?.rapor); if (k) raporlar.add(k); }
    }
  });
  if (sonYazma < 0 || sonDenetim > sonYazma || denetim >= DENETIM_EN_COK || (!plan && !raporlar.size)) return null;
  return { plan, raporlar: [...raporlar] };
}

/** 2026-10-31 (V21 madde 3; reisim: "Bitiş denetiminin sonucu konuşmaya tam JSON olarak değil özet olarak girer: sayı ve farklı sorunlar"): sorunlu rapor
    sayısı, farklı sorunlar ve her birinin raporları (no; 8'den çoksa yalnız sayı); plan notu sonda */
export function denetimOzeti(sonuc: string | undefined): string {
  if (!sonuc) return "denetim sonucu alınamadı";
  try {
    const x = JSON.parse(sonuc) as { durum?: unknown; neden?: unknown; raporlar?: { no?: unknown; sorunlar?: unknown }[]; plan_notu?: unknown };
    if (x.durum !== "tamam") return `denetim yapılamadı: ${String(x.neden ?? "")}`.trim();
    const l = Array.isArray(x.raporlar) ? x.raporlar : [], sorunlu = l.filter((r) => Array.isArray(r.sorunlar) && r.sorunlar.length);
    const notu = Array.isArray(x.plan_notu) && x.plan_notu.length ? ` Plan notu: ${x.plan_notu.map(String).join("; ")}.` : "";
    if (!sorunlu.length) return `${l.length} rapor denetlendi; sorun yok.${notu}`;
    const m = new Map<string, string[]>();
    for (const r of sorunlu) for (const s of r.sorunlar as unknown[]) { const k = String(s); if (!m.has(k)) m.set(k, []); m.get(k)!.push(String(r.no ?? "?")); }
    const satir = [...m].map(([s, nolar]) => `${s} (${nolar.length} rapor${nolar.length <= 8 ? `: ${nolar.join(", ")}` : ""})`);
    return `${sorunlu.length} / ${l.length} raporda sorun — ${satir.join(" · ")}.${notu}`;
  } catch { return "denetim sonucu okunamadı"; }
}
/** konuşmaya eklenen not: denetimin ÖZETİ + ne yapılacağı (bildirim biçimi talimattadır) */
export const denetimNotu = (sonuc: string) =>
  `${DENETIM_ONEKI} (rapora yazan iş bitti; kullanıcı istemeden de çalışır): ${denetimOzeti(sonuc)}\nDüzeltebildiğin eksikleri şimdi düzelt (sormadan). Düzeltemediğini `
  + "kısa bildirimin \"Kalan engel\" satırına yaz. Bildirim en çok dört satır: ne hazır · varsayımla yazılanlar · \"-\" bırakılanlar · kalan engel.";
/** plan_denetle sonucunda (işlem özeti — JSON metni) sorunlu rapor var mı; okunamayan sonuç sorun sayılır (denetlenemedi) */
export function sorunVar(sonuc: string | undefined): boolean {
  if (!sonuc) return true;
  try {
    const x = JSON.parse(sonuc) as { durum?: unknown; raporlar?: { sorunlar?: unknown[] }[] };
    if (x.durum !== "tamam") return true;
    return (x.raporlar ?? []).some((r) => Array.isArray(r.sorunlar) && r.sorunlar.length > 0);
  } catch { return true; }
}
