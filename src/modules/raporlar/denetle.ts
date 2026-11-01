/* PLAN DENETİMİ — RAPOR BAŞINA SORUNLAR (2026-10-31, kalem 6 — E8; beceri B07). Saf: raporun kayıttaki hâlinden; zorunlu alan / cihaz eksiği Onaya
   gönder'in kuralıyla çağırandan (raporEksikleri). Künyenin DEĞERİ hiçbir sorunda yazılmaz (yalnız "boş"). Kilit tests/say-hesap.test.ts.
   2026-10-31: sonuç maddelerin / ölçümlerin önerisiyle çelişirse (format/motor.ts degerlendir); teklif adedi çağıranda (raporun teklif bağı). */
import { degerlendir } from "../../format/motor.ts";
import type { Cevaplar, FormatTanimi } from "../../format/tanim.ts";
import { ekipmanAlanlari, ekipmanAnahtari } from "./doldur.ts";

const SONUC_AD: Record<string, string> = { uygun: "Uygun", uygun_degil: "Uygun değil", sartli: "Şartlı uygun" };

export interface DenetlenecekRapor {
  durum: string;
  tanim: FormatTanimi;
  cevaplar: Cevaplar;
  fotolar: readonly { bolum: string; madde: string | null; okuma?: boolean }[];
  kunye: { firmaAdi: string; sgk: string | null };
  /** 2026-10-31 (V21 madde 3): raporun kontrol başlangıcı (ISO) — planın günleriyle karşılaştırılır */
  tarih?: { bas: string | null };
  /** 2026-11-01 (V21 T3): ekipman bilgileri (kapasite çelişkisi için) */
  ekipman?: Record<string, unknown>;
}
const sayiOku = (v: unknown): number | null => {
  const s = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  if (!s.trim()) return null;
  const n = Number(s.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
/** 2026-11-01 (V21 T3 — üçüncü koşu: kaldırma kapasitesi 4200, beyan kapasitesi 3500 — başka firmanın eski raporundan): adında "kapasite" geçen SAYI
    alanları ve test değerleri birbirinden farklıysa uyarı (genel kural; uyarı, engel değil) */
export function kapasiteCeliskisi(s: Pick<DenetlenecekRapor, "tanim" | "cevaplar" | "ekipman">): string | null {
  const kapasiteli = (ad: string) => ad.toLocaleLowerCase("tr").includes("kapasite");
  const l: { ad: string; deger: number }[] = [];
  const koy = (ad: string, v: unknown) => { const n = sayiOku(v); if (n !== null) l.push({ ad, deger: n }); };
  const ekipmanAlan = (s.tanim as { gorunum?: unknown }).gorunum ? ekipmanAlanlari(s.tanim).alanlar : [];
  for (const a of ekipmanAlan) if (a.tur === "sayi" && kapasiteli(a.ad)) koy(a.ad, s.ekipman?.[a.id]);
  for (const b of s.tanim.bolumler) {
    if (b.blok === "bilgi") for (const a of b.alanlar) { if (a.tur === "sayi" && kapasiteli(a.ad)) koy(a.ad, ekipmanAnahtari(a.id) ? s.ekipman?.[a.id] : s.cevaplar.alan[a.id]); }
    if (b.blok === "test") for (const d of b.degerler) { if (!d.metin && !d.secenekler?.length && kapasiteli(d.ad)) koy(d.ad, s.cevaplar.deger[d.id]); }
  }
  const tekil = new Map<string, { ad: string; deger: number }>();
  for (const x of l) if (!tekil.has(x.ad)) tekil.set(x.ad, x);
  const farkli = new Set([...tekil.values()].map((x) => x.deger));
  return farkli.size > 1 ? `kapasite değerleri çelişiyor: ${[...tekil.values()].map((x) => `${x.ad} ${String(x.deger).replace(".", ",")}`).join(" ≠ ")}` : null;
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
  const celiski = kapasiteCeliskisi(s);
  if (celiski) l.push(celiski);
  if (!s.kunye.sgk?.trim()) l.push("künye boş: SGK / DETSİS");
  if (!s.kunye.firmaAdi?.trim()) l.push("künye boş: firma adı");
  return l;
}
