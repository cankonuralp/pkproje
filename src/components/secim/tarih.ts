/* TARİH — saf yardımcılar (React'siz; birim testi tests/tarih.test.ts). Maketteki MK.tarihNo / tarihOku / zamanIc ile aynı kurallar:
   bütün tarihler GG.AA.YYYY, saatliler GG.AA.YYYY SS:DD (reisim 2026-09-27: "Her yerde aynı 23.09.2026 formatı gibi olsun");
   iç değer ISO ("YYYY-MM-DD" ya da "YYYY-MM-DDTHH:MM"); takvim haftası pazartesi başlar. */

export const iki = (n: number) => String(n).padStart(2, "0");

/** "2026-09-23" ya da "2026-09-23T14:05" → "23.09.2026" */
export const tarihNo = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** "23.09.2026" → "2026-09-23"; takvimde olmayan gün (31.02) ya da biçim dışı → null */
export function tarihOku(metin: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(metin.trim());
  if (!m) return null;
  const [g, a, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(y, a - 1, g));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** yerel saatle bugün ve şimdi (tarayıcının saati) */
export const bugunIso = (d = new Date()) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
export const simdiIso = (d = new Date()) => `${bugunIso(d)}T${iki(d.getHours())}:${iki(d.getMinutes())}`;

export const AY_ADI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"] as const;
export const GUN_KISA = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"] as const;

/** ay ("YYYY-MM") → başta kaç boş hücre (pazartesi başlangıçlı) ve ayın günleri (ISO) */
export function ayGunleri(ay: string): { bosluk: number; gunler: string[] } {
  const y = Number(ay.slice(0, 4)), m = Number(ay.slice(5, 7)) - 1;
  const bosluk = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const say = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return { bosluk, gunler: Array.from({ length: say }, (_, i) => `${ay}-${iki(i + 1)}`) };
}

/** ay ("YYYY-MM") ± n ay */
export function ayKaydir(ay: string, n: number): string {
  const d = new Date(Date.UTC(Number(ay.slice(0, 4)), Number(ay.slice(5, 7)) - 1 + n, 1));
  return `${d.getUTCFullYear()}-${iki(d.getUTCMonth() + 1)}`;
}

export const ayBasligi = (ay: string) => `${AY_ADI[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;

/** saatli değerin bir parçasını değiştirir; eksik parça şimdiden (maket saatliDeger) */
export function saatliKur(deger: string, simdi: string, p: { gun?: string; saat?: string; dakika?: string }): string {
  const d = deger || simdi;
  return `${p.gun ?? d.slice(0, 10)}T${p.saat ?? d.slice(11, 13)}:${p.dakika ?? d.slice(14, 16)}`;
}

/** saat (00–23) ya da dakika (00–59) iki hane ve aralıkta mı */
export const parcaGecerli = (v: string, tur: "saat" | "dakika") => /^\d{2}$/.test(v) && Number(v) < (tur === "saat" ? 24 : 60);
