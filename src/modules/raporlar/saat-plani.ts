/* SAAT PLANI (2026-10-31, kalem 6 — E7; sunum "S.A.Y'a tam yetenek", beceri B06). "10:00'dan 10 dakika arayla", "pompa 14:20–15:00": hesabı sunucu yapar,
   S.A.Y yorumlar. Saf: raporlar sırayla dizilir (bir raporun bitişi sonrakinin başlangıcı + ara), sonraki kontrol = gün + türün periyodu (ay; ayın günü
   taşarsa ayın son günü). Gün dışına taşma ve aynı ekipte çakışma bildirilir (engel değil). Kilit tests/say-hesap.test.ts. */

export interface SaatRaporu { id: string; sure: number; periyot: number }
export interface SaatSatiri { id: string; bas: string; bit: string; sonraki: string; tasma: boolean }

const SAAT = /^([01]\d|2[0-3]):([0-5]\d)$/, GUN = /^(\d{4})-(\d{2})-(\d{2})$/;
const iki = (n: number) => String(n).padStart(2, "0");
const dakika = (s: string) => { const m = SAAT.exec(s)!; return Number(m[1]) * 60 + Number(m[2]); };
const saatYaz = (d: number) => `${iki(Math.floor(d / 60))}:${iki(d % 60)}`;

/** gün + ay (ayın günü taşarsa ayın son günü): "2026-01-31" + 1 → "2026-02-28" */
export function aySonra(gun: string, ay: number): string {
  const m = GUN.exec(gun);
  if (!m) throw new Error("gün YYYY-AA-GG olmalı");
  const t = Number(m[1]) * 12 + (Number(m[2]) - 1) + ay, y = Math.floor(t / 12), a = (t % 12) + 1;
  const son = new Date(Date.UTC(y, a, 0)).getUTCDate();
  return `${y}-${iki(a)}-${iki(Math.min(Number(m[3]), son))}`;
}

/** raporların saatleri: başlangıçtan, sırayla, süre + ara; gece yarısını aşan rapor "tasma" (o günde biter gibi yazılmaz — 23:59'da durur) */
export function saatPlani(g: { gun: string; baslangic: string; ara: number; raporlar: readonly SaatRaporu[] }): SaatSatiri[] {
  if (!GUN.test(g.gun)) throw new Error("gün YYYY-AA-GG olmalı");
  if (!SAAT.test(g.baslangic)) throw new Error("başlangıç SS:DD olmalı");
  let t = dakika(g.baslangic);
  return g.raporlar.map((r) => {
    const bas = t, bit = t + Math.max(1, Math.round(r.sure)), tasma = bit > 23 * 60 + 59;
    t = bit + Math.max(0, Math.round(g.ara));
    return { id: r.id, bas: `${g.gun} ${saatYaz(Math.min(bas, 23 * 60 + 59))}`, bit: `${g.gun} ${saatYaz(Math.min(bit, 23 * 60 + 59))}`, sonraki: aySonra(g.gun, r.periyot), tasma };
  });
}

/** rapor_yaz girişleri: tarih:bas / tarih:bit "GG.AA.YYYY SS:DD", tarih:sonraki "GG.AA.YYYY" */
export function saatGirisleri(s: SaatSatiri): { yer: string; deger: string }[] {
  const tr = (x: string) => `${x.slice(8, 10)}.${x.slice(5, 7)}.${x.slice(0, 4)}${x.length > 10 ? ` ${x.slice(11)}` : ""}`;
  return [{ yer: "tarih:bas", deger: tr(s.bas) }, { yer: "tarih:bit", deger: tr(s.bit) }, { yer: "tarih:sonraki", deger: tr(s.sonraki) }];
}

/** aynı kişinin raporlarında zaman çakışması: [bas, bit) aralıkları kesişen çiftler (kimlikler) */
export function cakismalar(l: readonly { id: string; bas: string | null; bit: string | null }[]): [string, string][] {
  const a = l.filter((x) => x.bas && x.bit && x.bas < x.bit).sort((x, y) => (x.bas! < y.bas! ? -1 : 1));
  const c: [string, string][] = [];
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length && a[j]!.bas! < a[i]!.bit!; j++) c.push([a[i]!.id, a[j]!.id]);
  return c;
}
