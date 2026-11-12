/* SAPMA DENETİMLERİ (2026-11-12, göç 0129; pkproje.md §11 K6 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları düzgün
   olmalı"): ölçümlü (TÜRKAK'lı firmada açılmış) rapor onaya gönderilirken beş denetim yapılır. Sapma KESİN ENGEL DEĞİLDİR: her biri için gerekçe (en
   az 10 karakter) yazılmadan rapor gönderilmez; sapma ve gerekçesi raporda saklanır, teknik yönetici onay ekranında görür.
     kisa     · kontrol, türün en kısa süresinden kısa sürdü (türde süre yoksa denetlenmez)
     cakisma  · aynı kişinin başka raporuyla saat çakışıyor
     gecis    · başka tesisteki kontrolle arası firmanın "iki tesis arası en az süre"sinden kısa (ayar 0 ise denetlenmez)
     gun      · kontrol plan günlerinin dışında
     foto     · fotoğraf kontrol saatlerinin dışında çekilmiş (5 dakika pay; çekim saati olmayan fotoğraf denetlenmez)
   Saf: saatler "YYYY-MM-DDTHH:MM" (Türkiye saati), fotoğrafın çekim anı "YYYY-MM-DD HH:MM" (fotoğrafın kendi saati). */

export const SAPMA_TURLERI = ["kisa", "cakisma", "gecis", "gun", "foto"] as const;
export type SapmaTuru = (typeof SAPMA_TURLERI)[number];
export interface Sapma { tur: SapmaTuru; metin: string }
export interface SapmaKaydi extends Sapma { gerekce: string }
export const SAPMA_GEREKCE_EN_AZ = 10;
/** fotoğrafın saati ile kontrol saati arasındaki pay (telefonun saati sunucudan birkaç dakika kayabilir) */
export const FOTO_PAY_DK = 5;

export interface SapmaGirdisi {
  bas: string; bit: string;
  /** türün en kısa kontrol süresi (dk); yoksa null */
  enKisaDk: number | null;
  /** bu raporun tesisi ve planının günleri */
  tesis: string; planBas: string; planBit: string;
  /** aynı kişinin bitmiş öteki raporları (silinmemiş; bu rapor hariç) */
  digerleri: readonly { no: string; bas: string; bit: string; tesis: string | null }[];
  /** firmanın "iki tesis arası en az süre"si (dk); 0 = denetlenmez */
  tesisArasiDk: number;
  /** belgeye giren fotoğraflar (okuma fotoğrafı hariç) */
  fotolar: readonly { ad: string; cekim?: string | null }[];
}

const an = (s: string) => new Date(`${s.slice(0, 10)}T${s.slice(11, 16)}:00+03:00`).getTime();
const dk = (ms: number) => Math.round(ms / 60_000);
const saat = (s: string) => s.slice(11, 16);
const gunNo = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;

export function sapmalar(g: SapmaGirdisi): Sapma[] {
  const l: Sapma[] = [];
  const bas = an(g.bas), bit = an(g.bit), sure = dk(bit - bas);
  if (g.enKisaDk !== null && sure < g.enKisaDk) l.push({ tur: "kisa", metin: `Kontrol ${sure} dk sürdü. Bu türün en kısa süresi ${g.enKisaDk} dk.` });
  const cakisan = g.digerleri.filter((o) => an(o.bas) < bit && bas < an(o.bit));
  if (cakisan.length) l.push({ tur: "cakisma", metin: `Aynı saatte başka raporunuz var: ${cakisan.slice(0, 3).map((o) => `${o.no} (${saat(o.bas)} – ${saat(o.bit)})`).join(", ")}${cakisan.length > 3 ? " …" : ""}.` });
  if (g.tesisArasiDk > 0) {
    const yakin = g.digerleri.filter((o) => o.tesis !== null && o.tesis !== g.tesis && !cakisan.includes(o)).map((o) => ({ o, ara: an(o.bit) <= bas ? dk(bas - an(o.bit)) : dk(an(o.bas) - bit) }))
      .filter((x) => x.ara >= 0 && x.ara < g.tesisArasiDk).sort((a, b) => a.ara - b.ara)[0];
    if (yakin) l.push({ tur: "gecis", metin: `Başka tesisteki ${yakin.o.no} raporunun kontrolüyle arası ${yakin.ara} dk. İki tesis arası en az süre ${g.tesisArasiDk} dk.` });
  }
  const gun = g.bas.slice(0, 10);
  if (gun < g.planBas || gun > g.planBit) {
    l.push({ tur: "gun", metin: `Kontrol ${gunNo(gun)} günü yapıldı; plan ${g.planBas === g.planBit ? gunNo(g.planBas) : `${gunNo(g.planBas)} – ${gunNo(g.planBit)}`}.` });
  }
  const pay = FOTO_PAY_DK * 60_000;
  const disi = g.fotolar.filter((f) => { if (!f.cekim) return false; const c = an(f.cekim); return c < bas - pay || c > bit + pay; });
  if (disi.length) {
    l.push({ tur: "foto", metin: disi.length === 1 ? `Bir fotoğraf kontrol saatleri dışında çekilmiş (${gunNo(disi[0]!.cekim!)} ${saat(disi[0]!.cekim!)}).`
      : `${disi.length} fotoğraf kontrol saatleri dışında çekilmiş (ilki ${gunNo(disi[0]!.cekim!)} ${saat(disi[0]!.cekim!)}).` });
  }
  return l;
}

/** gönderilen gerekçeler (tür → metin): yalnız bilinen türler, kırpılmış, en çok 500 karakter */
export function sapmaGerekceleri(v: unknown): Partial<Record<SapmaTuru, string>> {
  if (!v || typeof v !== "object") return {};
  const s: Partial<Record<SapmaTuru, string>> = {};
  for (const t of SAPMA_TURLERI) { const x = (v as Record<string, unknown>)[t]; if (typeof x === "string" && x.trim()) s[t] = x.trim().slice(0, 500); }
  return s;
}

/** gerekçesi eksik (ya da kısa) sapmalar; hepsi gerekçeliyse kayıt hâli */
export function sapmaKarari(l: readonly Sapma[], gerekce: Partial<Record<SapmaTuru, string>>): { eksik: Sapma[] } | { kayit: SapmaKaydi[] } {
  const eksik = l.filter((s) => (gerekce[s.tur] ?? "").length < SAPMA_GEREKCE_EN_AZ);
  return eksik.length ? { eksik } : { kayit: l.map((s) => ({ ...s, gerekce: gerekce[s.tur]! })) };
}
