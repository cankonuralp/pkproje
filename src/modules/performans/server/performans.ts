/* PERFORMANS (329; modül 19; maket performans.html M15). Tablo yok (KOD-GECIS §3): raporlar ve durum geçişleri Raporlar'ın, planlar Planlar'ın,
   kişiler Personel'in, birim fiyat (kazanç) Teklifler'in bağından okunur; hesap ../hesap.ts'te (saf). Yetki (modül 19, önerilen düzen):
   planlama ve firma yöneticisi hepsini görür; branş yöneticisi yalnız branşının raporlarını ve kişilerini; denetçi ("kendi") yalnız kendi
   sayılarını, KAZANÇSIZ (maket 148); muhasebe göremez. Görünürlük sunucuda süzülür; istemciye görmediği satır gitmez. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { ROL_BRANS } from "../../../server/yetki/tanim.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { performansKisileri } from "../../personel/server/performans-baglanti.ts";
import { muhasebePlanlari } from "../../planlar/server/muhasebe-baglanti.ts";
import { performansRaporlari } from "../../raporlar/server/performans-baglanti.ts";
import { raporBaglari } from "../../teklifler/server/rapor-bagi.ts";
import {
  donemCoz, donemRaporlari, geriSayisi, gunlukIsler, kazancGorunur, kisiGorunur, ozet, raporGorunur, surecAdimlari, zamanGruplari,
  type Brans, type Donem, type Gorunurluk, type Ozet, type PRapor, type SurecAdimi, type ZamanGrubu,
} from "../hesap.ts";

const MODUL = 19;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const bugunTr = () => GUN.format(new Date());
export interface Kisi extends YetkiHesabi { ad: string }

/** kişinin performans kapsamı (yetkiden; istemciden gelmez); göremeyene null */
export async function gorunurluk(db: Sorgulayici, kim: Kisi): Promise<Gorunurluk | null> {
  const d = duzey(kim, MODUL);
  if (d === "yok") return null;
  if (d === "gor" || d === "yaz") return { kapsam: "hepsi" };
  if (d === "brans") return { kapsam: "brans", branslar: [...new Set(kim.roller.map((r) => ROL_BRANS[r]).filter((b): b is Brans => !!b))] };
  return { kapsam: "kendi", personelId: await hesabinPersoneli(db, kim.id) };
}

export interface DonemSecimi { donem?: string; bas?: string; bit?: string; brans?: string }
/** adres parametrelerinden dönem seçimi (yalnız metin değerler; doğrulama donemCoz'da) */
export function donemSecimi(q: Record<string, string | string[] | undefined>): DonemSecimi {
  const tek = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 20) : undefined);
  return { donem: tek(q.donem), bas: tek(q.bas), bit: tek(q.bit), brans: tek(q.brans) };
}
function donemAl(s: DonemSecimi): { d: Donem; hata: string | null } {
  const r = donemCoz(s.donem ?? "ay", bugunTr(), s.bas, s.bit);
  return "hata" in r ? { d: donemCoz("ay", bugunTr()) as Donem, hata: r.hata } : { d: r, hata: null };
}

/** görünür raporlar (dönemin sonuna kadar açılanlar; geri gönderme sayısı için önceki aylar da) ve kişiler */
async function veri(db: Sorgulayici, g: Gorunurluk, d: Donem) {
  const ham = await performansRaporlari(db, d.bas, d.bit);
  const planlar = new Map((await muhasebePlanlari(db, [...new Set(ham.map((r) => r.planId))])).map((p) => [p.id, p]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t.brans]));
  const bag = kazancGorunur(g) ? await raporBaglari(db, [...new Set([...planlar.values()].map((p) => p.tesisId))]) : new Map<string, { fiyat: number | null }>();
  const rl: PRapor[] = ham.map((r) => ({ id: r.id, personelId: r.personelId, planId: r.planId, tesisId: planlar.get(r.planId)?.tesisId ?? "", brans: tur.get(r.turId) ?? null,
    gun: r.gun, olustu: r.olustu, ilkGonderim: r.ilkGonderim, gonderildi: r.gonderildi, onay: r.onay, imza: r.imza, sonImza: r.sonImza, imzali: r.imzali,
    kazanc: kazancGorunur(g) ? bag.get(r.id)?.fiyat ?? 0 : 0, geriler: r.geriler })).filter((r) => raporGorunur(g, r));
  const kisiler = (await performansKisileri(db)).filter((k) => kisiGorunur(g, k));
  return { rl, kisiler, planlar };
}

/* ── PANO ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface PanoKisisi { id: string; ad: string; meslek: string; brans: Brans | null; o: Ozet }
export interface PerformansPanosu {
  donem: Donem; aralikHata: string | null; brans: "tumu" | Brans; bransSecilir: boolean; kazanc: boolean;
  ozet: Ozet; zaman: ZamanGrubu[]; kisiler: PanoKisisi[];
}
/** pano; "kendi" düzeyinde kişinin kendi sayfasına yönlendirilir (personel kimliği döner); göremeyene null */
export async function performansPanosu(db: Sorgulayici, kim: Kisi, s: DonemSecimi): Promise<PerformansPanosu | { kendi: string | null } | null> {
  const g = await gorunurluk(db, kim);
  if (!g) return null;
  if (g.kapsam === "kendi") return { kendi: g.personelId };
  const { d, hata } = donemAl(s);
  const sabit = g.kapsam === "brans" && g.branslar.length === 1 ? g.branslar[0] : null;
  const brans: "tumu" | Brans = sabit ?? (s.brans === "m" || s.brans === "e" ? s.brans : "tumu");
  const { rl, kisiler } = await veri(db, g, d);
  const bransta = rl.filter((r) => brans === "tumu" || r.brans === brans);
  const donemde = donemRaporlari(bransta, d);
  const kisi = kisiler.filter((k) => brans === "tumu" || k.brans === brans);
  const yazan = new Set(donemde.map((r) => r.personelId));
  return {
    donem: d, aralikHata: hata, brans, bransSecilir: !sabit, kazanc: kazancGorunur(g),
    ozet: ozet(donemde, geriSayisi(bransta, d)), zaman: zamanGruplari(donemde, d),
    /* denetçi rolündeki çalışanlar ve dönemde rapor yazan herkes (ayrılan dahil — geçmiş kaybolmasın) */
    kisiler: kisi.filter((k) => (k.denetci && k.etkin) || yazan.has(k.id)).map((k) => ({ id: k.id, ad: k.ad, meslek: k.meslek, brans: k.brans,
      o: ozet(donemde.filter((r) => r.personelId === k.id), geriSayisi(bransta.filter((r) => r.personelId === k.id), d)) })),
  };
}

/* ── KİŞİ ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface KisiGunlugu { gun: string; tesis: string; musteri: string; isler: { id: string; no: string }[]; rapor: number; imzali: number; kazanc: number }
export interface KisiPerformansi {
  kisi: { id: string; ad: string; meslek: string; brans: Brans | null }; kendi: boolean; donem: Donem; aralikHata: string | null; kazanc: boolean;
  ozet: Ozet; zaman: ZamanGrubu[]; surec: SurecAdimi[]; gunluk: KisiGunlugu[];
}
/** kişinin performansı (kişi sayfası; denetçi için kendi sayfası); göremeyene ya da yoksa null */
export async function performansKisi(db: Sorgulayici, kim: Kisi, personelId: string, s: DonemSecimi): Promise<KisiPerformansi | null> {
  const g = await gorunurluk(db, kim);
  if (!g || !UUID.test(personelId)) return null;
  const { d, hata } = donemAl(s);
  const { rl, kisiler, planlar } = await veri(db, g, d);
  const k = kisiler.find((x) => x.id === personelId);
  if (!k) return null;
  const kendi = rl.filter((r) => r.personelId === k.id), donemde = donemRaporlari(kendi, d);
  const tesis = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, { ad: t.ad, musteri: m.kisa }] as const)));
  return {
    kisi: { id: k.id, ad: k.ad, meslek: k.meslek, brans: k.brans }, kendi: g.kapsam === "kendi", donem: d, aralikHata: hata, kazanc: kazancGorunur(g),
    ozet: ozet(donemde, geriSayisi(kendi, d)), zaman: zamanGruplari(donemde, d), surec: surecAdimlari(donemde),
    gunluk: gunlukIsler(donemde).map((x) => ({ gun: x.gun, tesis: tesis.get(x.tesisId)?.ad ?? "—", musteri: tesis.get(x.tesisId)?.musteri ?? "—",
      isler: x.planIdleri.map((id) => ({ id, no: planlar.get(id)?.no ?? "—" })), rapor: x.rapor, imzali: x.imzali, kazanc: x.kazanc })),
  };
}
