/* UZUN İŞ KİLİDİ — saf mantık (kalıp 12, HATA SINIFI: reisim 2026-09-12 "PDF indir'e tekrar bastım, 2 kere indirdi"). Bir tuşa bağlı iş
   sürerken ikinci çağrı SESSİZCE yok sayılır (undefined döner), iş bir kez koşar; iş bitince ya da hata verince kilit açılır.
   Birim testi tests/uzun-is.test.ts. */
export type Ilerle = (adim: string) => void;
export type UzunIs<T> = (ilerle: Ilerle) => Promise<T>;

export function uzunIsKilidi() {
  let mesgul = false;
  return {
    get mesgul() { return mesgul; },
    /** iş sürüyorsa undefined; değilse işin sözü (hata aynen geri atılır, yutulmaz) */
    calistir<T>(is: UzunIs<T>, ilerle: Ilerle = () => {}): Promise<T> | undefined {
      if (mesgul) return undefined;
      mesgul = true;
      return (async () => {
        try { return await is(ilerle); } finally { mesgul = false; }
      })();
    },
  };
}
