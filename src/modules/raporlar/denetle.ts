/* PLAN DENETİMİ — RAPOR BAŞINA SORUNLAR (2026-10-31, kalem 6 — E8; beceri B07). Saf: raporun kayıttaki hâlinden; zorunlu alan / cihaz eksiği Onaya
   gönder'in kuralıyla çağırandan (raporEksikleri). Künyenin DEĞERİ hiçbir sorunda yazılmaz (yalnız "boş"). Kilit tests/say-hesap.test.ts.
   2026-10-31: sonuç maddelerin / ölçümlerin önerisiyle çelişirse (format/motor.ts degerlendir); teklif adedi çağıranda (raporun teklif bağı). */
import { degerlendir } from "../../format/motor.ts";
import type { Cevaplar, FormatTanimi } from "../../format/tanim.ts";

const SONUC_AD: Record<string, string> = { uygun: "Uygun", uygun_degil: "Uygun değil", sartli: "Şartlı uygun" };

export interface DenetlenecekRapor {
  durum: string;
  tanim: FormatTanimi;
  cevaplar: Cevaplar;
  fotolar: readonly { bolum: string; madde: string | null; okuma?: boolean }[];
  kunye: { firmaAdi: string; sgk: string | null };
  /** 2026-10-31 (V21 madde 3): raporun kontrol başlangıcı (ISO) — planın günleriyle karşılaştırılır */
  tarih?: { bas: string | null };
}
/** planın günleri (YYYY-AA-GG) */
export interface PlanGunleri { baslangic: string; bitis: string }
const gunTr = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;

export function raporSorunlari(s: DenetlenecekRapor, eksikler: readonly { ad: string }[], plan?: PlanGunleri | null): string[] {
  const l: string[] = [];
  /* 2026-10-31 (V21 ilk koşu — KOD HATASI: taslağın durumu "taslak"tır, "yeni" değil; her taslak "gönderilmiş" sayılıyordu) */
  if (s.durum !== "taslak") l.push(`gönderilmiş (durum: ${s.durum})`);
  /* 2026-10-31 (V21 madde 3): kontrol günü planın günlerinin dışındaysa (rapor tarihi bugün, plan geçen ay) — uyarı, engel değil */
  const gun = s.tarih?.bas?.slice(0, 10);
  if (plan && gun && /^\d{4}-\d{2}-\d{2}$/.test(gun) && (gun < plan.baslangic || gun > plan.bitis)) {
    l.push(`kontrol günü ${gunTr(gun)} plan günlerinin (${plan.baslangic === plan.bitis ? gunTr(plan.baslangic) : `${gunTr(plan.baslangic)} – ${gunTr(plan.bitis)}`}) dışında`);
  }
  for (const e of eksikler.slice(0, 10)) l.push(`eksik: ${e.ad}`);
  if (eksikler.length > 10) l.push(`ve ${eksikler.length - 10} eksik daha`);
  const fotoBolumleri = new Set(s.tanim.bolumler.filter((b) => b.blok === "foto").map((b) => b.id));
  if (fotoBolumleri.size) {
    const n = s.fotolar.filter((f) => fotoBolumleri.has(f.bolum) && !f.okuma && !f.madde).length;
    if (n === 0) l.push("fotoğraf yok");
    else if (n > 1) l.push(`${n} genel fotoğraf (ekipman başına bir)`);
  }
  for (const b of s.tanim.bolumler) {
    if (b.blok !== "olcum") continue;
    const yazilir = b.sutunlar.filter((x) => !x.formul);
    let bos = 0;
    for (const r of s.cevaplar.tablo[b.id] ?? []) for (const c of yazilir) if (!String(r[c.id] ?? "").trim()) bos++;
    if (bos) l.push(`${b.ad}: ${bos} boş hücre`);
  }
  /* 2026-10-31 (reisim: "önerdiklerini kabul ediyorum" — sonuç–madde denetimi): seçilen sonuç maddelerin / ölçümlerin verdiği öneriyle çelişiyor mu
     (motorun önerisi — Onaya gönder'in gördüğü kural); kural uyarıdır, engel değil */
  if (s.cevaplar.sonuc && s.tanim.kurallar?.oneri !== false) {
    const d = degerlendir(s.tanim, s.cevaplar);
    if (d.oneri && d.oneri !== s.cevaplar.sonuc) {
      l.push(`sonuç “${SONUC_AD[s.cevaplar.sonuc] ?? s.cevaplar.sonuc}” ama maddeler / ölçümler “${SONUC_AD[d.oneri] ?? d.oneri}” diyor${d.kusurlar.length ? ` (${d.kusurlar.length} kusur)` : " (kusur yok)"}`);
    }
  }
  if (!s.kunye.sgk?.trim()) l.push("künye boş: SGK / DETSİS");
  if (!s.kunye.firmaAdi?.trim()) l.push("künye boş: firma adı");
  return l;
}
