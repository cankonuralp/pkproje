/* CİHAZ SAATİNİN ÖLÇÜMÜ (2026-11-12, göç 0131; pkproje.md §11 K4 — "bağlantıdan çıkarken ve dönerken cihaz saati sunucuyla karşılaştırılır"):
   cihaz, sunucuyla her konuştuğunda (önceden indirme paketi, kuyruktan giden işin yanıtı) sunucunun saatini ve o andaki kendi saatini yazar — "çapa".
   Bağlantısızken basılan "Kontrole başla" / "Kontrolü bitir" işi, o andaki son çapayı da taşır; sunucu iş geldiğinde iki ölçümü karşılaştırır
   (modules/raporlar/cihaz-saati.ts). Çapa bu cihazda kalır (yerel depo; yazılamazsa yalnız bu sayfada bellekte). Kişisel veri değil: iki an. */
/** sunucunun saati + o andaki cihaz saati (ms) — modules/raporlar/cihaz-saati.ts SaatCapasi ile aynı biçim */
export interface SaatCapasi { sunucu: number; cihaz: number }

const ANAHTAR = "probata-saat-capasi";
/** çapa en çok bu kadar eski olabilir (daha eskisi ölçüm sayılmaz — cihaz saati o arada ayarlanmış olabilir) */
const EN_ESKI_MS = 7 * 864e5;
let bellek: SaatCapasi | null = null;

const gecerli = (c: unknown): c is SaatCapasi => !!c && typeof c === "object" && Number.isFinite((c as SaatCapasi).sunucu) && Number.isFinite((c as SaatCapasi).cihaz);

/** sunucunun saati geldi: şimdiki cihaz saatiyle birlikte yazılır */
export function capaYaz(sunucu: unknown, cihaz = Date.now()): void {
  if (typeof sunucu !== "number" || !Number.isFinite(sunucu) || sunucu <= 0) return;
  bellek = { sunucu: Math.round(sunucu), cihaz: Math.round(cihaz) };
  try { window.localStorage.setItem(ANAHTAR, JSON.stringify(bellek)); } catch { /* yerel depo yok: bellekte */ }
}

/** son ölçüm; yoksa / çok eskiyse / cihaz saati çapadan geriye gitmişse de olduğu gibi döner — karar sunucuda (yalnız çok eski olan atılır) */
export function capaOku(simdi = Date.now()): SaatCapasi | null {
  let c = bellek;
  if (!c) {
    try { const v: unknown = JSON.parse(window.localStorage.getItem(ANAHTAR) ?? "null"); if (gecerli(v)) c = v; } catch { c = null; }
  }
  if (!c || simdi - c.cihaz > EN_ESKI_MS) return null;
  return { sunucu: c.sunucu, cihaz: c.cihaz };
}
