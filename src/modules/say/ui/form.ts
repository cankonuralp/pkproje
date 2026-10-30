/* 2026-10-31 (kalem 4 — K6): S.A.Y'ın form_goster aracı — ekran, raporun işaretli formunun sayfasını ayrı uçta bastırır (kullanıcının oturumuyla) */
export type FormGoruntusuYaniti = { tamam: true; dosya: string; sayfa: number; sayfaSayisi: number } | { tamam: false; neden: string };

export async function formGoruntusuIste(rapor: string, sayfa: number): Promise<FormGoruntusuYaniti> {
  try {
    const r = await fetch("/api/say/form", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rapor, sayfa }) });
    const y = (await r.json()) as FormGoruntusuYaniti;
    return y && typeof y === "object" && "tamam" in y ? y : { tamam: false, neden: "Formun görüntüsü alınamadı." };
  } catch {
    return { tamam: false, neden: "Formun görüntüsü alınamadı (bağlantı)." };
  }
}
