/* DEPO ANAHTARI — tek üretici (09-A1). Anahtarda okunur bilgi yok (kişi adı, dosya adı, rapor no): yalnız kimlikler.
   Başka yerde anahtar birleştiren kod yazılmaz (tests/dosya.test.ts taraması). Parçalar sıkı biçimde denetlenir: yol aşma ("..", "/") olamaz. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MODUL = /^[a-z_]{1,30}$/;
const ANAHTAR = /^firma\/[0-9a-f-]{36}\/[a-z_]{1,30}\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/;

export function dosyaAnahtari(p: { firmaId: string; modul: string; kayitId: string; dosyaId: string }): string {
  for (const [ad, deger] of [["firma", p.firmaId], ["kayıt", p.kayitId], ["dosya", p.dosyaId]] as const) {
    if (!UUID.test(deger)) throw new Error(`Geçersiz ${ad} kimliği`);
  }
  if (!MODUL.test(p.modul)) throw new Error("Geçersiz modül adı");
  return `firma/${p.firmaId}/${p.modul}/${p.kayitId}/${p.dosyaId}`;
}

/** depo bağdaştırıcısı yalnız bu biçimdeki anahtarı kabul eder (veritabanından gelen anahtar da yeniden denetlenir) */
export const anahtarGecerli = (a: string) => ANAHTAR.test(a);
