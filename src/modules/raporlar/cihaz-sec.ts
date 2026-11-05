/* CİHAZIN KENDİLİĞİNDEN SEÇİLMESİ (2026-11-06; reisim: "bir denetçinin 1 kere kullandığı kontrol cihazı ona atalı ise … tekrar her muayene de
   seçmesine gerek kalmasın otomatik seçili gelsin. uygun cihaz otomatik seçili olsun"). SAF: yeni rapor açılırken (raporAc, bağlantısız paket)
   her cihaz türü için bir cihaz önerir —
   · aday: o türden, pasif değil, kalibrasyonda (lab) değil, kalibrasyonu geçmemiş ve YAZANIN ZİMMETİNDE (depodaki ortak cihaz kendiliğinden seçilmez);
   · adaylardan yazanın en son kullandığı; hiç kullanmadıysa ve tek aday varsa o; birden çok kullanılmamış aday varsa seçim denetçinin.
   Kilit tests/cihaz-sec.test.ts. */
import type { RaporCihazi } from "./sema.ts";

export interface OtoAday { id: string; turId: string; pasif: boolean; lab: boolean; gecti: boolean; zimmette: boolean }

export function otomatikCihazlar(turler: readonly string[], adaylar: readonly OtoAday[], sonKullanim: ReadonlyMap<string, string>): RaporCihazi[] {
  const sonuc: RaporCihazi[] = [];
  for (const tur of new Set(turler)) {
    const uygun = adaylar.filter((c) => c.turId === tur && !c.pasif && !c.lab && !c.gecti && c.zimmette);
    const kullanilan = uygun.filter((c) => sonKullanim.has(c.id)).sort((a, b) => sonKullanim.get(b.id)!.localeCompare(sonKullanim.get(a.id)!));
    const sec = kullanilan[0] ?? (uygun.length === 1 ? uygun[0] : undefined);
    if (sec) sonuc.push({ tur, cihaz: sec.id });
  }
  return sonuc;
}
