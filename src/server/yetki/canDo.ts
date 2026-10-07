/* canDo — TEK YETKİ DENETİMİ (07 · 09-E4 · KOD-GECIS §4). Sunucu her istekte buna sorar; istemcinin gizlediği tuş kolaylıktır, kapı değildir.
   · Hesabın rolleri OTURUMDAN değil, veritabanındaki hesaptan gelir (src/server/kimlik/oturum.ts oturumOku) — istemci rol yollayamaz.
   · Ekran yetkisi rollerin BİRLEŞİMİ (en yüksek düzey). Düzey: yaz > gor > brans > kendi > yok.
   · Firmanın değiştirdiği matris (Personel › Rol yetkileri) yalnız tanımlı düzeylerle okunur; bozuk değer "yok" sayılır (varsayılan kapalı).
     Firma yöneticisinin Personel / Firma ayarları / Hareket kaydı satırı değiştirilemez (SABIT).
   · Kayıt bilgisi (sahip, branş, atananlar) çağıranın SUNUCUDA veritabanından okuduğu kayıttan gelir — istemcinin gövdesinden alınmaz. */
import { DUZEYLER, MATRIS_ONERI, ROL_BRANS, ROLLER, SABIT, type Duzey, type Matris, type ModulAnahtari, type Rol } from "./tanim.ts";

/** matris: firmanın kaydettiği rol yetkileri (oturum okunurken veritabanından gelir — src/server/kimlik/oturum.ts); yoksa önerilen düzen */
export interface YetkiHesabi { id: string; roller: readonly Rol[]; matris?: Partial<Matris> | null }
/** kaydın yetkiyi etkileyen alanları (sunucuda okunur) */
export interface YetkiKaydi { sahip?: string | null; brans?: "m" | "e" | null; atananlar?: readonly string[] }

const SIRA: Record<Duzey, number> = { yok: 0, kendi: 1, brans: 2, gor: 3, yaz: 4 };
const gecerliDuzey = (d: unknown): Duzey => (typeof d === "string" && (DUZEYLER as readonly string[]).includes(d) ? (d as Duzey) : "yok");

/** bir rolün bir modüldeki düzeyi (firma matrisi varsa o; sabit satırlar ezilemez) */
export function rolDuzeyi(rol: Rol, modul: ModulAnahtari, matris?: Partial<Matris> | null): Duzey {
  const sabit = SABIT[modul]?.[rol];
  if (sabit) return sabit;
  const i = ROLLER.indexOf(rol);
  if (i < 0) return "yok";
  const satir = matris?.[modul] ?? MATRIS_ONERI[modul];
  return gecerliDuzey(satir?.[i]);
}

/** hesabın modüldeki en yüksek düzeyi (rollerin birleşimi) */
export function duzey(h: YetkiHesabi, modul: ModulAnahtari, matris?: Partial<Matris> | null): Duzey {
  matris ??= h.matris;
  let en: Duzey = "yok";
  for (const r of h.roller) {
    if (!(ROLLER as readonly string[]).includes(r)) continue;   // tanımsız rol hiçbir şey vermez
    const d = rolDuzeyi(r, modul, matris);
    if (SIRA[d] > SIRA[en]) en = d;
  }
  return en;
}

const branslari = (h: YetkiHesabi) => h.roller.map((r) => ROL_BRANS[r]).filter(Boolean) as ("m" | "e")[];
const kendisi = (h: YetkiHesabi, k?: YetkiKaydi) => !!k && (k.sahip === h.id || !!k.atananlar?.includes(h.id));

/** modülde görme / değiştirme. Kayıt verilmezse "modüle girebilir mi" (liste ekranı; liste sonra kayıt kayıt süzülür). */
export function canDo(h: YetkiHesabi | null, modul: ModulAnahtari, eylem: "gor" | "degistir", kayit?: YetkiKaydi, matris?: Partial<Matris> | null): boolean {
  if (!h) return false;
  const d = duzey(h, modul, matris);
  if (d === "yok") return false;
  if (d === "yaz") return true;
  if (d === "gor") return eylem === "gor";
  if (!kayit) return eylem === "gor";   // brans / kendi: modüle girer, liste kendi süzgeciyle gelir
  if (d === "brans") {
    /* branş yöneticisi kendi branşını görür; kendisinin oluşturduğu / atandığı kaydı (denetçi rolü de varsa) ayrıca */
    if (eylem === "gor" && kayit.brans && branslari(h).includes(kayit.brans)) return true;
    return kendisi(h, kayit) && duzeyRolle(h, modul, "kendi", matris);
  }
  return kendisi(h, kayit);   // kendi: yalnız kendi kaydı (gör + değiştir)
}
function duzeyRolle(h: YetkiHesabi, modul: ModulAnahtari, istenen: Duzey, matris?: Partial<Matris> | null) {
  matris ??= h.matris;
  return h.roller.some((r) => SIRA[rolDuzeyi(r, modul, matris)] >= SIRA[istenen]);
}

/* ── ÖZEL EYLEMLER (KOD-GECIS §4; düzeyin üstünde, tek tek) ───────────────────────────────────────────────────────── */
export interface EylemKaydi extends YetkiKaydi {
  /** rapor durumu (Yeni, Onayda, Onaylandı, Tamamlandı …) */
  durum?: string;
  /** rapor türünün branşı; vekil: öteki branşın yöneticisi "Tüm raporlar" yetkisiyle */
  vekil?: boolean;
  /** kesin silmede kaydın modülü (kayit_sil) */
  modul?: ModulAnahtari;
}
const rolu = (h: YetkiHesabi, ...r: Rol[]) => h.roller.some((x) => r.includes(x));
const teknikYonetici = (h: YetkiHesabi, k?: EylemKaydi) => !!k?.brans && (branslari(h).includes(k.brans) || (!!k.vekil && branslari(h).length > 0));

export const OZEL_EYLEMLER = {
  plan_ac: (h: YetkiHesabi, _k?: EylemKaydi, m?: Partial<Matris> | null) => duzey(h, 13, m) === "yaz",
  plan_kabul_red: (h: YetkiHesabi, k?: EylemKaydi) => !!k?.atananlar?.includes(h.id),
  ekipman_pasif: (h: YetkiHesabi, _k?: EylemKaydi, m?: Partial<Matris> | null) => duzey(h, 7, m) === "yaz",
  /* 357 (reisim 2026-10-07 + pkproje §9: "silme işlemi sadece yöneticiler tarafından yapılabilmeli"): hiç kullanılmamış kaydın KESİN silinmesi —
     kaydın modülünde "yaz" VE yönetici rolü; firma matrisi başka bir role "yaz" verse de silme yönetici rolünde kalır. Kullanılmış mı veritabanında
     (src/server/db/silici.ts). */
  kayit_sil: (h: YetkiHesabi, k?: EylemKaydi, m?: Partial<Matris> | null) =>
    k?.modul !== undefined && duzey(h, k.modul, m) === "yaz" && rolu(h, "firma_yoneticisi", "mekanik_yonetici", "elektrik_yonetici"),
  rapor_olustur: (h: YetkiHesabi, k?: EylemKaydi) => !!k?.atananlar?.includes(h.id),
  rapor_yaz: (h: YetkiHesabi, k?: EylemKaydi) => !!k && k.sahip === h.id,
  rapor_sil: (h: YetkiHesabi, k?: EylemKaydi) => (!!k && k.sahip === h.id && k.durum === "Yeni") || teknikYonetici(h, k),
  rapor_pasif: (h: YetkiHesabi, k?: EylemKaydi) => (!!k && k.sahip === h.id) || teknikYonetici(h, k),
  rapor_aktif: (h: YetkiHesabi, k?: EylemKaydi) => teknikYonetici(h, k),
  /* 2026-10-05 (314, C1): dört göz kalktı — reisim kararı (pkproje §1, §9 soru 1): "hazırlayanın kendi raporunu onaylaması da engellenmez" */
  rapor_onayla: (h: YetkiHesabi, k?: EylemKaydi) => teknikYonetici(h, k),
  rapor_geri_gonder: (h: YetkiHesabi, k?: EylemKaydi) => teknikYonetici(h, k),
  rapor_durum_degistir: (h: YetkiHesabi, k?: EylemKaydi) => teknikYonetici(h, k) && k?.durum !== "Tamamlandı",
  rapor_revizeye_gonder: (h: YetkiHesabi, k?: EylemKaydi) => teknikYonetici(h, k) && k?.durum === "Tamamlandı",
  rapor_revize_iste: (h: YetkiHesabi, k?: EylemKaydi) => !!k && k.sahip === h.id,
  rapor_son_imza: (h: YetkiHesabi, k?: EylemKaydi) => !!k && k.sahip === h.id,
  izin_onayi: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  masraf_onayi: (h: YetkiHesabi) => rolu(h, "muhasebe"),
  bordro: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi", "muhasebe"),
  rol_yetki_degistir: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  hesap_ac_kapat: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  gecici_parola: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  firma_ayari: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  arac_duzenle: (h: YetkiHesabi) => rolu(h, "firma_yoneticisi"),
  km_gir: (h: YetkiHesabi, k?: EylemKaydi) => rolu(h, "firma_yoneticisi") || (!!k && k.sahip === h.id),
} as const;
export type OzelEylem = keyof typeof OZEL_EYLEMLER;

/** özel eylem: bilinmeyen eylem adı → false (varsayılan kapalı) */
export function canDoEylem(h: YetkiHesabi | null, eylem: OzelEylem, kayit?: EylemKaydi, matris?: Partial<Matris> | null): boolean {
  if (!h) return false;
  const kural = (OZEL_EYLEMLER as Record<string, (h: YetkiHesabi, k?: EylemKaydi, m?: Partial<Matris> | null) => boolean>)[eylem];
  return typeof kural === "function" && Object.hasOwn(OZEL_EYLEMLER, eylem) ? kural(h, kayit, matris) : false;
}
