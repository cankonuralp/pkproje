/* PLAN İÇİ — liste ve plan içi akış (modül 13; maket planlarim.html 4.–5. tur; pkproje §3.4). Yetki her işlevde SUNUCUDA:
   · Görme: Planlar "gör / yaz" bütün planlar; "kendi" yalnız ekibinde olduğu planlar. Başka firmanın planı "yok".
   · Kabul et / Reddet: yalnız plandaki denetçi (özel eylem plan_kabul_red) — tarafsızlık beyanı kişiseldir; kabul anındaki beyan metni plana yazılır.
   · Kontrol listesi, Tamamla, Tamamlamayı geri al: plandaki denetçi ya da Planlar "yaz" (planlama, yönetici).
   · Künye Düzenle: Planlar "yaz"; denetçinin gördüğü künye kendiliğinden değişmez — denetçi Güncelle'ye basar (§3.4 "Plan künyesi").
   · Proje notu: plandaki denetçiler ve Planlar "yaz" yazar ve görür; müşteri ve öteki roller görmez (karar 27); not değişmez, silinmez.
   · Ekipman ekle / kayıtlıyı plana al: plan görülüyor + Ekipman "yaz" + plan Kabul edildi ya da Denetimde (tamamlanmış planda kapalı — 12).
     Pasife al / etkinleştir: özel eylem ekipman_pasif + plan görülüyor; silme yok.
   · Durum geçişleri ve zaman damgaları veritabanında (göç 0024); burada yalnız izinli geçiş istenir. İstemciden gelen sürüm yalnız "hangi
     sürümü gördüm" bilgisidir (iyimser kilit); yetki vermez. */
import { createHash } from "node:crypto";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { personelHesaplari } from "../../../server/kimlik/hesap.ts";
import { canDo, canDoEylem, duzey } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { ekipmanEkle as ekipmanKaydet, ekipmanKilitle, ekipmanKullanimi, ekipmanlar, ekipmanPasif as ekipmanPasifYaz, ekipmanSil as ekipmanSilYaz, koduKullanan, tesisEkipmanlari, type EkipmanOzeti } from "../../ekipman/server/ekipman.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { ekipmanRaporuVar, mesaiDurumu, planRaporlari, raporKunyeleriniYaz, type PlanRaporu } from "../../raporlar/server/plan-baglanti.ts";
import { KunyeGirdisi, kodBicimi, kodNormal, NotGirdisi, RedGirdisi, YeniEkipmanGirdisi, type KodTuru, type PlanDurumu } from "../sema.ts";
import { bugunTr, EKIP, MODUL, PLAN, PLAN_EKIPMAN, planAcabilir, planKarti, UUID, type Kisi, type PlanKarti } from "./planlar.ts";
import { kaynakEpostalari, type EpostaDurumu } from "../../../server/eposta/eposta.ts";

const NOT = tablo({ ad: "plan_not", sutunlar: ["plan_id", "metin", "yazan"] });
const EKIPMAN_MODULU = 7;
const RAPORLAR_MODULU = 14;

export type PlanYazma =
  | { durum: "tamam"; bildirim: string; id?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "yetkisiz" } | { durum: "cakisma" } | { durum: "yok" };

/* ── ortak okuma ─────────────────────────────────────────────────────────────────────────────────────────────── */
interface PlanSatiri {
  id: string; no: string; durum: PlanDurumu; tesis_id: string; baslangic: string; bitis: string; firma_adi: string; adres: string | null; sgk: string | null;
  kunye_surum: number; surum: number; kabul: Date | null; kabul_eden: string | null; beyan: string | null; red: Date | null; red_eden: string | null;
  red_gerekce: string | null; basladi: Date | null; kontrol_tamam: Date | null; bitti: Date | null; olustu: Date;
}
export interface Kunye { firma_adi: string; adres: string | null; sgk: string | null; isg_no: string | null }
interface EkipSatiri { id: string; personel_id: string; isg_no: string | null; isg_id: string | null; kunye_surum: number; gorulen: Kunye | null; surum: number }

async function planOku(db: Sorgulayici, id: string): Promise<PlanSatiri | null> {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<PlanSatiri>(
    `SELECT id::text, no, durum, tesis_id::text, baslangic::text, bitis::text, firma_adi, adres, sgk, kunye_surum, surum, kabul, kabul_eden, beyan, red, red_eden,
      red_gerekce, basladi, kontrol_tamam, bitti, olustu FROM plan WHERE id = $1`, [id])).rows[0] ?? null;
}

interface Erisim { p: PlanSatiri; ekip: EkipSatiri[]; atananlar: string[]; uye: boolean; yazar: boolean; benim: EkipSatiri | undefined }

/** planı ve kişinin bu plandaki yerini okur; göremeyene null (var olduğu da söylenmez) */
async function erisim(db: Sorgulayici, kim: Kisi, id: string): Promise<Erisim | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const p = await planOku(db, id);
  if (!p) return null;
  const ekip = (await db.sorgu<EkipSatiri>(
    "SELECT id::text, personel_id::text, isg_no, isg_id::text, kunye_surum, gorulen, surum FROM plan_ekip WHERE plan_id = $1", [id])).rows;
  const hesaplar = await personelHesaplari(db, ekip.map((e) => e.personel_id));
  const atananlar = [...hesaplar.values()].map((h) => h.id);
  if (!canDo(kim, MODUL, "gor", { atananlar })) return null;
  const benim = ekip.find((e) => hesaplar.get(e.personel_id)?.id === kim.id);
  return { p, ekip, atananlar, uye: !!benim, yazar: duzey(kim, MODUL) === "yaz", benim };
}

/** künye yazmaları planın satırında sıraya girer (Düzenle ile Güncelle aynı anda koşunca denetçinin gördüğü künye kaybolmasın) */
async function kilitliErisim(db: Sorgulayici, kim: Kisi, id: string): Promise<Erisim | null> {
  if (!(await erisim(db, kim, id))) return null;
  await db.sorgu("SELECT 1 FROM plan WHERE id = $1 FOR UPDATE", [id]);
  await db.sorgu("SELECT 1 FROM plan_ekip WHERE plan_id = $1 FOR UPDATE", [id]);
  return erisim(db, kim, id);
}
/** beyan metninin özeti: denetçinin okuduğu metinle kabulde yazılan metin aynı olmalı */
export const beyanOzeti = (metin: string) => createHash("sha256").update(metin, "utf8").digest("hex").slice(0, 16);

const sonuc = (r: GuncelleSonucu, bildirim: string): PlanYazma =>
  r.durum === "tamam" || r.durum === "degisiklik_yok" ? { durum: "tamam", bildirim } : r.durum === "cakisma" ? { durum: "cakisma" } : { durum: "yok" };
const iz = (kim: Kisi, ne: string, p: { no: string }, gerekce?: string): Iz => ({ kim: kim.ad, ne, gerekce: gerekce ? `${p.no} · ${gerekce}` : p.no });

/* ── İZİNLER (ekranın tuşları da buradan; yazma işlevleri aynı kuralla yeniden denetler) ──────────────────────────────── */
export interface PlanIzni {
  kabulRed: boolean; kontrol: boolean; kunyeDuzenle: boolean; kunyeGuncelle: boolean; not: boolean; ekipmanEkle: boolean; ekipmanPasif: boolean;
  /** 360: kullanılmamış ekipmanı kesin silmek — planın durumundan bağımsız. 365 (352–361 incelemesi): kesin silme ilkesiyle aynı kural, canDo kayit_sil
      (Ekipman modülünde "yaz" + yönetici; firma matrisi Ekipman'ı kısıtlarsa silme de kapanır). Eski ekipman_sil yalnız role bakıyordu. */
  ekipmanSil: boolean;
  /** plandaki denetçi, plan kabul edilmiş / denetimde / tamamlanmış, plan günü gelmiş (ENGEL 1: ileri tarihli plana rapor açılmaz) */
  raporOlustur: boolean;
}
function izinler(kim: Kisi, e: Erisim): PlanIzni {
  const d = e.p.durum, isci = e.uye || e.yazar;
  return {
    kabulRed: d === "bekliyor" && canDoEylem(kim, "plan_kabul_red", { atananlar: e.atananlar }),
    kontrol: isci && (d === "denetimde" || d === "tamamlandi"),
    kunyeDuzenle: e.yazar && d !== "reddedildi",
    kunyeGuncelle: !!e.benim && (e.benim.gorulen !== null || e.benim.kunye_surum !== e.p.kunye_surum),
    not: isci,
    ekipmanEkle: isci && duzey(kim, EKIPMAN_MODULU) === "yaz" && (d === "kabul" || d === "denetimde"),
    ekipmanPasif: isci && canDoEylem(kim, "ekipman_pasif") && (d === "kabul" || d === "denetimde" || d === "tamamlandi"),
    ekipmanSil: canDoEylem(kim, "kayit_sil", { modul: EKIPMAN_MODULU }),
    raporOlustur: e.uye && duzey(kim, RAPORLAR_MODULU) !== "yok" && canDoEylem(kim, "rapor_olustur", { atananlar: e.atananlar }) && (d === "kabul" || d === "denetimde" || d === "tamamlandi") && e.p.baslangic <= bugunTr(),
  };
}

/* ── PLANLAR LİSTESİ ─────────────────────────────────────────────────────────────────────────────────────────── */
export interface PlanSatir {
  id: string; no: string; durum: PlanDurumu; ad: string; musteri: string; adres: string | null; il: string | null; ilce: string | null;
  ekip: string[]; baslangic: string; bitis: string; olustu: string; mekanik: boolean; elektrik: boolean;
}

/** kişinin görebildiği planlar (en yeni tarih önce); Planlar'ı göremeyene null */
export async function planListesi(db: Sorgulayici, kim: Kisi): Promise<PlanSatir[] | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  const planlar = (await db.sorgu<{ id: string; no: string; durum: PlanDurumu; tesis_id: string; baslangic: string; bitis: string; olustu: Date }>(
    "SELECT id::text, no, durum, tesis_id::text, baslangic::text, bitis::text, olustu FROM plan ORDER BY baslangic DESC, olustu DESC")).rows;
  if (!planlar.length) return [];
  const ekip = (await db.sorgu<{ plan_id: string; personel_id: string }>("SELECT plan_id::text, personel_id::text FROM plan_ekip")).rows;
  const hesaplar = await personelHesaplari(db, [...new Set(ekip.map((e) => e.personel_id))]);
  const gorunen = planlar.filter((p) => canDo(kim, MODUL, "gor", { atananlar: ekip.filter((e) => e.plan_id === p.id).flatMap((e) => hesaplar.get(e.personel_id)?.id ?? []) }));
  if (!gorunen.length) return [];
  const kisiler = await personelOzetleri(db, [...new Set(ekip.map((e) => e.personel_id))]);
  const tesisler = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, { m, t }] as const)));
  const pe = (await db.sorgu<{ plan_id: string; ekipman_id: string }>("SELECT plan_id::text, ekipman_id::text FROM plan_ekipman WHERE plan_id = ANY ($1::uuid[])",
    [gorunen.map((p) => p.id)])).rows;
  const ekp = new Map((await ekipmanlar(db, [...new Set(pe.map((x) => x.ekipman_id))])).map((e) => [e.id, e]));
  const brans = new Map((await turOzetleri(db)).map((t) => [t.id, t.brans]));
  return gorunen.map((p) => {
    const x = tesisler.get(p.tesis_id), b = pe.filter((y) => y.plan_id === p.id).map((y) => brans.get(ekp.get(y.ekipman_id)?.turId ?? ""));
    return {
      id: p.id, no: p.no, durum: p.durum, ad: x?.t.ad ?? "—", musteri: x?.m.unvan ?? "—", adres: x?.t.adres ?? null, il: x?.t.il ?? null, ilce: x?.t.ilce ?? null,
      ekip: ekip.filter((e) => e.plan_id === p.id).map((e) => kisiler.find((k) => k.id === e.personel_id)?.ad ?? "—").sort((a, c) => a.localeCompare(c, "tr")),
      baslangic: p.baslangic, bitis: p.bitis, olustu: p.olustu.toISOString(), mekanik: b.includes("m"), elektrik: b.includes("e"),
    };
  });
}

/* ── PLAN İÇİ ─────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface PlanEkipmani {
  id: string; kod: string; turId: string; tur: string; brans: "m" | "e"; konum: string | null; seri: string | null; sonradan: boolean; pasif: boolean; surum: number;
  /** 360: silebilen (yönetici) için kullanılmamış — "Sil" çizilir */
  sil: boolean;
  /** önceki kontrol: sistem öncesi (Excel) — sistemdeki raporlar Raporlar kalemiyle */
  onceki: { tarih: string; sonuc: string | null } | null;
}
export interface PlanIci {
  kart: PlanKarti;
  /** 372: planı kesin silebilir (yönetici; raporu, faturası, gideri yok, tamamlanmamış) */
  planSil: boolean;
  surum: number; durum: PlanDurumu; bugun: string;
  kabul: { zaman: string; kim: string; beyan: string } | null;
  red: { zaman: string; kim: string; gerekce: string } | null;
  basladi: string | null; kontrolTamam: string | null; bitti: string | null;
  /** Kabul bekleyen planda okunacak beyan (firma ayarı) ve özeti (Kabul et bunu geri yollar) */
  beyan: string; beyanOzet: string;
  /** kişinin gördüğü künye; denetçi Güncelle'ye basmadıysa eski künye */
  kunye: { firmaAdi: string; adres: string | null; sgk: string | null; isg: { personelId: string; ad: string; no: string | null }[] };
  /** denetçinin gördüğü künye ile güncel künye arasındaki fark (alan adları) */
  kunyeFark: string[];
  /** Düzenle formu için güncel künye (yalnız düzenleyebilene) */
  kunyeGuncel: PlanIci["kunye"] | null;
  teklif: { turId: string; ad: string; brans: "m" | "e"; planlanan: number; planda: number }[];
  ekipman: PlanEkipmani[];
  /** tesiste kayıtlı, plana alınmamış, etkin ekipman (yalnız ekleyebilene) */
  kayitli: { id: string; kod: string; tur: string; konum: string | null; onceki: string | null }[];
  turler: { id: string; ad: string; kod: string; brans: "m" | "e" }[];
  /** planın etkin raporlarından isteyenin Raporlar düzeyinin gördükleri (denetçi kendi, branş yöneticisi branşı; silinen görünmez); benim =
      isteyenin yazdığı rapor (Raporu düzenle / Sil yalnız onda). Yazan hesap / personel kimliği istemciye gitmez. */
  raporlar: (Omit<PlanRaporu, "hesapId" | "personelId"> & { benim: boolean })[];
  /** etkin raporu olan ekipmanlar (görülsün görülmesin): yeşil tik, "Rapor oluştur" gizlenir, raporsuz sayısı */
  raporluEkipman: string[];
  /** plan günü henüz gelmedi (rapor açılmaz; şerit söyler) */
  erken: boolean;
  /** isteyenin bugünkü süresi doldu (mesai açıkken; ENGEL 3): rapor açılmaz, şerit söyler — dolmadıysa null */
  mesai: { normal: number; mesai: number } | null;
  /** proje notları; göremeyene null */
  notlar: { id: string; metin: string; yazan: string; zaman: string }[] | null;
  /** 432: plan açılınca giden e-postalar (alıcı, durum) — yalnız plan açabilene (planlama, yönetici); öteki null */
  epostalar: EpostaDurumu[] | null;
  izin: PlanIzni;
}

const kunyeFarki = (a: Kunye, b: Kunye) => [
  a.firma_adi !== b.firma_adi && "Firma adı", (a.adres ?? null) !== (b.adres ?? null) && "Adres", (a.sgk ?? null) !== (b.sgk ?? null) && "SGK DETSİS NO",
  (a.isg_no ?? null) !== (b.isg_no ?? null) && "İSG-KATİP SÖZLEŞME ID",
].filter((x): x is string => !!x);

/** plan içi ekranın verisi; göremeyene null */
export async function planIci(db: Sorgulayici, kim: Kisi, id: string): Promise<PlanIci | null> {
  const e = await erisim(db, kim, id);
  if (!e) return null;
  const kart = await planKarti(db, kim, id);
  if (!kart) return null;
  const { p } = e, izin = izinler(kim, e);
  const ad = new Map(kart.ekip.map((x) => [x.personelId, x.ad]));
  const guncel = (s: EkipSatiri): Kunye => ({ firma_adi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg_no: s.isg_no });
  const benimKunye = e.benim ? (e.benim.gorulen ?? guncel(e.benim)) : null;
  const isgListesi = (gorulenBenim: boolean) => e.ekip.map((s) => ({ personelId: s.personel_id, ad: ad.get(s.personel_id) ?? "—",
    no: gorulenBenim && s.id === e.benim?.id ? benimKunye!.isg_no : s.isg_no })).sort((x, y) => x.ad.localeCompare(y.ad, "tr"));
  const kunye = benimKunye
    ? { firmaAdi: benimKunye.firma_adi, adres: benimKunye.adres, sgk: benimKunye.sgk, isg: isgListesi(true) }
    : { firmaAdi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg: isgListesi(false) };

  const pe = (await db.sorgu<{ ekipman_id: string; sonradan: boolean }>("SELECT ekipman_id::text, sonradan FROM plan_ekipman WHERE plan_id = $1", [id])).rows;
  const turler = await turOzetleri(db), turBul = new Map(turler.map((t) => [t.id, t]));
  const tumRaporlar = await planRaporlari(db, id);
  const ekp = await ekipmanlar(db, pe.map((x) => x.ekipman_id));
  /* 360: silebilene (yönetici) hiç kullanılmamış ekipman — "Sil" (tanım veritabanında, göç 0056) */
  const kullanim = izin.ekipmanSil ? await ekipmanKullanimi(db, ekp.map((x) => x.id)) : null;
  const silinebilir = new Set(kullanim ? ekp.filter((x) => !kullanim.has(x.id)).map((x) => x.id) : []);
  const ekipman: PlanEkipmani[] = ekp.map((x) => {
    const t = turBul.get(x.turId);
    return { id: x.id, kod: x.kod, turId: x.turId, tur: t?.ad ?? "—", brans: t?.brans ?? "m", konum: x.konum, seri: x.seri, pasif: x.pasif, surum: x.surum, sil: silinebilir.has(x.id),
      sonradan: !!pe.find((y) => y.ekipman_id === x.id)?.sonradan, onceki: x.disKontrol ? { tarih: x.disKontrol, sonuc: x.disSonuc } : null };
  });
  const teklif = new Map<string, PlanIci["teklif"][number]>();
  for (const x of ekipman) {
    const s = teklif.get(x.turId) ?? { turId: x.turId, ad: x.tur, brans: x.brans, planlanan: 0, planda: 0 };
    s.planda++; if (!x.sonradan) s.planlanan++;
    teklif.set(x.turId, s);
  }
  const kayitli = izin.ekipmanEkle ? (await tesisEkipmanlari(db, p.tesis_id)).filter((x) => !x.pasif && !pe.some((y) => y.ekipman_id === x.id))
    .map((x) => ({ id: x.id, kod: x.kod, tur: turBul.get(x.turId)?.ad ?? "—", konum: x.konum, onceki: x.disKontrol })) : [];
  const notlar = izin.not ? (await db.sorgu<{ id: string; metin: string; yazan: string; olustu: Date }>(
    "SELECT id::text, metin, yazan, olustu FROM plan_not WHERE plan_id = $1 ORDER BY olustu DESC, id", [id])).rows
    .map((n) => ({ id: n.id, metin: n.metin, yazan: n.yazan, zaman: n.olustu.toISOString() })) : null;
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  const beyan = p.beyan ?? (await ayarOku(db, "beyan")).deger.metin;
  /* günlük süre (212; ENGEL 3): plandaki denetçinin kendi süresi, rapor açılabilecek planda */
  const m = e.benim && (p.durum === "kabul" || p.durum === "denetimde" || p.durum === "tamamlandi") ? await mesaiDurumu(db, e.benim.personel_id, bugunTr()) : null;
  const planSil = canDoEylem(kim, "kayit_sil", { modul: MODUL }) && !(await kullanimlar(db, "plan", [id])).has(id);
  return {
    kart, planSil, surum: p.surum, durum: p.durum, bugun: bugunTr(),
    kabul: p.kabul && p.kabul_eden && p.beyan ? { zaman: p.kabul.toISOString(), kim: p.kabul_eden, beyan: p.beyan } : null,
    red: p.red && p.red_eden && p.red_gerekce ? { zaman: p.red.toISOString(), kim: p.red_eden, gerekce: p.red_gerekce } : null,
    basladi: iso(p.basladi), kontrolTamam: iso(p.kontrol_tamam), bitti: iso(p.bitti),
    beyan, beyanOzet: beyanOzeti(beyan),
    kunye, kunyeFark: e.benim && benimKunye ? kunyeFarki(benimKunye, guncel(e.benim)) : [],
    kunyeGuncel: izin.kunyeDuzenle ? { firmaAdi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg: isgListesi(false) } : null,
    teklif: [...teklif.values()].sort((a, b) => (a.brans === b.brans ? a.ad.localeCompare(b.ad, "tr") : a.brans === "m" ? -1 : 1)),
    ekipman, kayitli, turler: izin.ekipmanEkle ? turler.map((t) => ({ id: t.id, ad: t.ad, kod: t.kod, brans: t.brans })) : [],
    raporlar: duzey(kim, RAPORLAR_MODULU) === "yok" ? [] : tumRaporlar
      .filter((r) => canDo(kim, RAPORLAR_MODULU, "gor", { sahip: r.hesapId, brans: turBul.get(r.turId)?.brans ?? null }))
      .map(({ hesapId, personelId: _p, ...r }) => ({ ...r, benim: !!hesapId && hesapId === kim.id })),
    raporluEkipman: [...new Set(tumRaporlar.map((r) => r.ekipmanId))], erken: p.baslangic > bugunTr(), mesai: m?.dolu ? { normal: m.normal, mesai: m.mesai } : null, notlar,
    epostalar: planAcabilir(kim) ? await kaynakEpostalari(db, "plan", p.id) : null, izin,
  };
}

/* ── AKIŞ ─────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** Kabul et: beyan okunup onaylanmış olmalı; kabul anındaki firma beyanı plana yazılır. beyanOzet verilirse (ekran verir) okunan metin
    kabulde yazılacak metinle aynı olmalı — arada firma metni değiştiyse kabul edilmez, yeniden okutulur. */
export async function planKabul(db: Sorgulayici, kim: Kisi, id: string, surum: number, beyanOnay: boolean, beyanOzet?: string): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!canDoEylem(kim, "plan_kabul_red", { atananlar: e.atananlar })) return { durum: "yetkisiz" };
  if (e.p.durum !== "bekliyor") return { durum: "red", neden: "Plan kabul bekliyor durumunda değil." };
  if (beyanOnay !== true) return { durum: "gecersiz", hatalar: { beyan: "Tarafsızlık beyanı okunup onaylanmadan plan kabul edilemez." } };
  const beyan = (await ayarOku(db, "beyan")).deger.metin;
  if (beyanOzet !== undefined && beyanOzet !== beyanOzeti(beyan)) return { durum: "red", neden: "Tarafsızlık beyanının metni değişti; sayfayı yenileyip yeni metni okuyun." };
  return sonuc(await guncelle(db, PLAN, id, surum, { durum: "kabul", beyan, kabul_eden: kim.ad }, iz(kim, "plan.kabul", e.p, "tarafsızlık beyanı onaylandı")), "Plan kabul edildi.");
}

/** Reddet: gerekçe zorunlu, değişmez */
export async function planReddet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!canDoEylem(kim, "plan_kabul_red", { atananlar: e.atananlar })) return { durum: "yetkisiz" };
  if (e.p.durum !== "bekliyor") return { durum: "red", neden: "Plan kabul bekliyor durumunda değil." };
  const g = dogrula(RedGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  return sonuc(await guncelle(db, PLAN, id, surum, { durum: "reddedildi", red_eden: kim.ad, red_gerekce: g.veri.gerekce }, iz(kim, "plan.red", e.p, g.veri.gerekce)), "Plan reddedildi.");
}

/** ilk rapor oluşturulunca plan Denetimde olur (Raporlar modülü çağırır; yetki ÇAĞIRANDA). Kabul edilmemiş planda false. */
export async function denetimeBasla(db: Sorgulayici, kimAd: string, id: string): Promise<boolean> {
  const p = await planOku(db, id);
  if (!p || (p.durum !== "kabul" && p.durum !== "denetimde")) return false;
  if (p.durum === "kabul") {
    const r = await guncelle(db, PLAN, id, p.surum, { durum: "denetimde" }, { kim: kimAd, ne: "plan.denetim", gerekce: `${p.no} · ilk rapor oluşturuldu` });
    if (r.durum !== "tamam") throw new Error(`plan denetime geçemedi: ${r.durum}`);
  }
  return true;
}

const isci = (e: Erisim) => e.uye || e.yazar;

/** kontrol listesini tamamla (true) / yeniden aç (false) — yalnız Denetimde */
export async function kontrolListesi(db: Sorgulayici, kim: Kisi, id: string, surum: number, tamam: boolean): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  if (e.p.durum !== "denetimde") return { durum: "red", neden: "Kontrol listesi yalnız denetimdeki planda tamamlanır." };
  if (tamam === !!e.p.kontrol_tamam) return { durum: "tamam", bildirim: tamam ? "Kontrol listesi zaten tamamlandı." : "Kontrol listesi zaten açık." };
  return sonuc(await guncelle(db, PLAN, id, surum, { kontrol_tamam: tamam ? new Date() : null }, iz(kim, tamam ? "plan.kontrol_tamam" : "plan.kontrol_ac", e.p)),
    tamam ? "Kontrol listesi tamamlandı. Planı en alttaki Tamamla ile bitirin." : "Kontrol listesi yeniden açıldı.");
}

/** Tamamla: kontrol listesi tamamlanmış olmalı. Raporu olmayan ekipman engellemez (11). */
export async function planTamamla(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  if (e.p.durum !== "denetimde" || !e.p.kontrol_tamam) return { durum: "red", neden: "Önce kontrol listesi tamamlanmalı." };
  return sonuc(await guncelle(db, PLAN, id, surum, { durum: "tamamlandi" }, iz(kim, "plan.tamamla", e.p)), "Plan tamamlandı.");
}

/** Tamamlamayı geri al: plan yeniden denetime açılır, kontrol listesi yeniden açık */
export async function tamamlamaGeriAl(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  if (e.p.durum !== "tamamlandi") return { durum: "red", neden: "Plan tamamlanmış değil." };
  return sonuc(await guncelle(db, PLAN, id, surum, { durum: "denetimde" }, iz(kim, "plan.tamamla_geri", e.p)), "Tamamlama geri alındı; plan yeniden denetime açıldı.");
}

/* ── KÜNYE ────────────────────────────────────────────────────────────────────────────────────────────────────── */
/** planlamacı Düzenle: firma adı, adres, SGK, denetçi başına İSG-KATİP ID. Denetçinin gördüğü künye korunur (Güncelle'ye kadar). */
export async function kunyeDuzenle(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<PlanYazma> {
  const e = await kilitliErisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).kunyeDuzenle) return { durum: "yetkisiz" };
  const g = dogrula(KunyeGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, { p } = e;
  if (surum !== p.surum) return { durum: "cakisma" };
  const yeniIsg = (s: EkipSatiri) => (Object.hasOwn(v.isg, s.personel_id) ? v.isg[s.personel_id] : s.isg_no);
  const planDegisti = v.firmaAdi !== p.firma_adi || v.adres !== p.adres || v.sgk !== p.sgk;
  const ekipDegisen = e.ekip.filter((s) => yeniIsg(s) !== s.isg_no);
  if (!planDegisti && !ekipDegisen.length) return { durum: "tamam", bildirim: "Değişiklik yok." };
  const r = await guncelle(db, PLAN, id, surum, { firma_adi: v.firmaAdi, adres: v.adres, sgk: v.sgk, kunye_surum: p.kunye_surum + 1 }, iz(kim, "plan.kunye", p));
  if (r.durum !== "tamam") return sonuc(r, "");
  for (const s of e.ekip) {
    const degerler: { gorulen?: Kunye; isg_no?: string | null; isg_id?: null } = {};
    if (s.gorulen === null) degerler.gorulen = { firma_adi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg_no: s.isg_no };
    if (yeniIsg(s) !== s.isg_no) { degerler.isg_no = yeniIsg(s); degerler.isg_id = null; }
    if (!Object.keys(degerler).length) continue;
    const x = await guncelle(db, EKIP, s.id, s.surum, degerler, iz(kim, "plan.kunye", p));
    if (x.durum !== "tamam") throw new Error(`plan ekibi künyesi yazılamadı: ${x.durum}`);
  }
  return { durum: "tamam", bildirim: "Plan bilgileri kaydedildi. Denetçiler Güncelle'ye basınca planlarına ve taslak raporlarına geçer." };
}

/** denetçi Güncelle: güncel künye kendi plan ekranına geçer (taslak raporlara geçişi Raporlar kalemi ekler) */
export async function kunyeGuncelle(db: Sorgulayici, kim: Kisi, id: string): Promise<PlanYazma> {
  const e = await kilitliErisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!e.benim) return { durum: "yetkisiz" };
  if (!izinler(kim, e).kunyeGuncelle) return { durum: "tamam", bildirim: "Plan bilgileri zaten güncel." };
  const z = iz(kim, "plan.kunye_guncelle", e.p);
  const r = await guncelle(db, EKIP, e.benim.id, e.benim.surum, { gorulen: null, kunye_surum: e.p.kunye_surum }, z);
  if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") return sonuc(r, "");
  /* yeni künye denetçinin YALNIZ kendi Yeni raporlarına geçer (onaydaki / imzalı ve başkasının raporu değişmez) */
  const n = await raporKunyeleriniYaz(db, z, id, e.benim.personel_id,
    { firma_adi: e.p.firma_adi, adres: e.p.adres, sgk: e.p.sgk, isg_no: e.benim.isg_no }, e.p.kunye_surum);
  return { durum: "tamam", bildirim: n ? `Plan bilgileri güncellendi; ${n} taslak raporunuza da geçti.` : "Plan bilgileri güncellendi." };
}

/* ── PROJE NOTLARI ───────────────────────────────────────────────────────────────────────────────────────────── */
export async function notEkle(db: Sorgulayici, kim: Kisi, id: string, girdi: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).not) return { durum: "yetkisiz" };
  const g = dogrula(NotGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const r = await ekle(db, NOT, { plan_id: id, metin: g.veri.metin, yazan: kim.ad }, iz(kim, "plan.not", e.p));
  return { durum: "tamam", bildirim: "Not eklendi.", id: r.id };
}

/* ── EKİPMAN ─────────────────────────────────────────────────────────────────────────────────────────────────── */
export interface KodDurumu { tur: KodTuru; metin: string; ekipmanId?: string }

async function kodDurumuOku(db: Sorgulayici, e: Erisim, kod: string): Promise<KodDurumu> {
  const k = kodNormal(kod), b = kodBicimi(k);
  if (b) return b;
  const u = await koduKullanan(db, k);
  if (!u) return { tur: "tamam", metin: "Kod kullanılabilir; bu firmada başka ekipmanda yok." };
  const t = (await turOzetleri(db)).find((x) => x.id === u.ekipman.turId)?.ad ?? "—";
  const tanim = [t, u.ekipman.konum].filter(Boolean).join(" · ");
  if (u.eski) return { tur: "hata", metin: `${k} daha önce başka bir ekipmanın koduydu (şimdiki kodu ${u.ekipman.kod}). Eski kod başka ekipmana verilmez.` };
  const planda = (await db.sorgu("SELECT 1 FROM plan_ekipman WHERE plan_id = $1 AND ekipman_id = $2", [e.p.id, u.ekipman.id])).rowCount;
  if (planda) return { tur: "hata", metin: `${k} bu planda zaten var: ${tanim}. Aynı kod iki ekipmana verilemez.` };
  if (u.ekipman.tesisId === e.p.tesis_id) {
    if (u.ekipman.pasif) return { tur: "hata", metin: `${k} bu tesiste kayıtlı ama pasif: ${tanim}. Aynı kod iki ekipmana verilemez.` };
    return { tur: "tesiste", metin: `${k} bu tesiste kayıtlı: ${tanim}. Yeni kayıt açılmaz; kayıtlı ekipmanı plana ekleyin.`, ekipmanId: u.ekipman.id };
  }
  const yer = (await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((x) => ({ m, x }))).find((y) => y.x.id === u.ekipman.tesisId);
  return { tur: "hata", metin: `${k} başka bir tesiste kayıtlı: ${t}${yer ? ` · ${yer.m.kisa} / ${yer.x.ad}` : ""}. Aynı kod iki ekipmana verilemez.` };
}

/** yazarken kod denetimi (maket kodDurum); ekleyemeyene null */
export async function kodDurumu(db: Sorgulayici, kim: Kisi, id: string, kod: string): Promise<KodDurumu | null> {
  const e = await erisim(db, kim, id);
  if (!e || !izinler(kim, e).ekipmanEkle) return null;
  return kodDurumuOku(db, e, typeof kod === "string" ? kod.slice(0, 40) : "");
}

/** yeni ekipman: tesise kalıcı kayıt + plana "sonradan" */
export async function yeniEkipman(db: Sorgulayici, kim: Kisi, id: string, girdi: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).ekipmanEkle) return e.p.durum === "kabul" || e.p.durum === "denetimde" ? { durum: "yetkisiz" } : { durum: "red", neden: "Bu durumdaki plana ekipman eklenmez." };
  const g = dogrula(YeniEkipmanGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  if (!(await turOzetleri(db)).some((t) => t.id === v.tur)) return { durum: "gecersiz", hatalar: { tur: "Ekipman türü seçilmeli." } };
  const kd = await kodDurumuOku(db, e, v.kod);
  if (kd.tur !== "tamam") return { durum: "gecersiz", hatalar: { kod: kd.metin } };
  const z = iz(kim, "plan.ekipman_ekle", e.p, v.kod);
  const ekipmanId = await ekipmanKaydet(db, z, { tesisId: e.p.tesis_id, turId: v.tur, kod: v.kod, seri: v.seri, konum: v.konum });
  await ekle(db, PLAN_EKIPMAN, { plan_id: id, ekipman_id: ekipmanId, sonradan: true, ekleyen: kim.ad }, z);
  return { durum: "tamam", bildirim: `${v.kod} eklendi.`, id: ekipmanId };
}

/** tesiste kayıtlı ekipmanı plana al */
export async function kayitliEkle(db: Sorgulayici, kim: Kisi, id: string, idler: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).ekipmanEkle) return e.p.durum === "kabul" || e.p.durum === "denetimde" ? { durum: "yetkisiz" } : { durum: "red", neden: "Bu durumdaki plana ekipman eklenmez." };
  const istenen = Array.isArray(idler) ? [...new Set(idler.filter((x): x is string => typeof x === "string" && UUID.test(x)))].slice(0, 500) : [];
  if (!istenen.length) return { durum: "gecersiz", hatalar: { secim: "Plana eklenecek ekipmanı seçin." } };
  const planda = new Set((await db.sorgu<{ ekipman_id: string }>("SELECT ekipman_id::text FROM plan_ekipman WHERE plan_id = $1", [id])).rows.map((x) => x.ekipman_id));
  const tesiste = new Map((await tesisEkipmanlari(db, e.p.tesis_id)).map((x) => [x.id, x]));
  const uygun = istenen.map((x) => tesiste.get(x)).filter((x): x is EkipmanOzeti => !!x && !x.pasif && !planda.has(x.id));
  if (uygun.length !== istenen.length) return { durum: "gecersiz", hatalar: { secim: "Seçilen ekipman bu tesiste kayıtlı ve plana alınmamış olmalı." } };
  for (const x of uygun) await ekle(db, PLAN_EKIPMAN, { plan_id: id, ekipman_id: x.id, sonradan: true, ekleyen: kim.ad }, iz(kim, "plan.ekipman_al", e.p, x.kod));
  return { durum: "tamam", bildirim: uygun.length === 1 ? `${uygun[0].kod} plana eklendi.` : `${uygun.length} ekipman plana eklendi.` };
}

/** pasife al / etkinleştir (yanlış girilen ekipman; geri alınabilir; raporu olan ekipman pasife alınmaz — Raporlar kalemiyle) */
export async function ekipmanPasif(db: Sorgulayici, kim: Kisi, id: string, ekipmanId: string, surum: number, pasif: boolean): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).ekipmanPasif) return { durum: "yetkisiz" };
  if (!UUID.test(ekipmanId) || !(await db.sorgu("SELECT 1 FROM plan_ekipman WHERE plan_id = $1 AND ekipman_id = $2", [id, ekipmanId])).rowCount) return { durum: "yok" };
  await ekipmanKilitle(db, ekipmanId);   /* rapor oluşturma ile aynı anda koşmasın (raporlar.raporOlustur da kilitler) */
  const x = (await ekipmanlar(db, [ekipmanId]))[0];
  if (!x) return { durum: "yok" };
  if (pasif === true && (await ekipmanRaporuVar(db, id, ekipmanId))) return { durum: "red", neden: `${x.kod} için bu planda rapor var; raporu olan ekipman pasife alınmaz.` };
  if (x.pasif === (pasif === true)) return { durum: "tamam", bildirim: pasif ? `${x.kod} zaten pasif.` : `${x.kod} zaten etkin.` };
  const r = await ekipmanPasifYaz(db, iz(kim, pasif ? "plan.ekipman_pasif" : "plan.ekipman_etkin", e.p, x.kod), ekipmanId, surum, pasif === true);
  return sonuc(r, pasif ? `${x.kod} pasife alındı; rapor açılamaz. Etkinleştir ile geri alınır.` : `${x.kod} yeniden etkin.`);
}

/** 360 — kesin sil (yalnız yönetici; ekipman hiç kullanılmamışsa: raporu yok, tamamlanmış planda yok — bütün planlardan çıkar, kodu serbest kalır).
    Rapor oluşturmayla aynı anda koşmasın diye ekipman kilitlenir (raporOlustur da kilitler). */
export async function ekipmanSil(db: Sorgulayici, kim: Kisi, id: string, ekipmanId: string): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!izinler(kim, e).ekipmanSil) return { durum: "yetkisiz" };
  /* 365: ekipman yoksa "Plan bulunamadı" değil (plan duruyor) */
  const yok = { durum: "red", neden: "Ekipman bu planda yok ya da silinmiş." } as const;
  if (!UUID.test(ekipmanId) || !(await db.sorgu("SELECT 1 FROM plan_ekipman WHERE plan_id = $1 AND ekipman_id = $2", [id, ekipmanId])).rowCount) return yok;
  await ekipmanKilitle(db, ekipmanId);
  const r = await ekipmanSilYaz(db, kim.ad, ekipmanId);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Ekipman silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı. Yanlış girildiyse pasife alın.` };
  if (r.durum === "yok") return yok;
  return { durum: "tamam", bildirim: `${r.ad} silindi.` };
}

/* ── RAPORLAR İÇİN (modül 14 bu işlevlerle plana bakar; yetki burada: planı görebilen) ─────────────────────────────── */
export interface RaporPlani {
  id: string; no: string; durum: PlanDurumu; tesisId: string; baslangic: string; atananlar: string[];
  /** isteyenin plandaki personeli (ekipte değilse null) */
  personelId: string | null;
  /** isteyenin gördüğü künye (Güncelle'ye basmadıysa eski) ve sürümü; ekipte değilse güncel künye */
  kunye: Kunye; kunyeSurum: number;
  /** güncel künye (isteyenin İSG-KATİP ID'siyle) ve sürümü */
  guncelKunye: Kunye; guncelSurum: number;
}
/** Raporlar "Kaydet ve kopyala" için: kişi bu plana yeni ekipman ekleyebilir mi (plan içi "Ekipman ekle" ile aynı izin) */
export async function ekipmanEklenebilir(db: Sorgulayici, kim: Kisi, planId: string): Promise<boolean> {
  const e = await erisim(db, kim, planId);
  return !!e && izinler(kim, e).ekipmanEkle;
}
/** planı görebilene planın rapor için gereken bilgisi; göremeyene null */
export async function raporIcinPlan(db: Sorgulayici, kim: Kisi, planId: string): Promise<RaporPlani | null> {
  const e = await erisim(db, kim, planId);
  if (!e) return null;
  const { p, benim } = e;
  const guncelKunye: Kunye = { firma_adi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg_no: benim?.isg_no ?? null };
  return {
    id: p.id, no: p.no, durum: p.durum, tesisId: p.tesis_id, baslangic: p.baslangic, atananlar: e.atananlar, personelId: benim?.personel_id ?? null,
    kunye: benim?.gorulen ?? guncelKunye, kunyeSurum: benim && benim.gorulen ? benim.kunye_surum : p.kunye_surum, guncelKunye, guncelSurum: p.kunye_surum,
  };
}
/** planın ekipmanları (kimlikler; 405 bağlantısız yeni rapor paketi). Yetki ÇAĞIRANDA. */
export async function plandakiEkipmanlar(db: Sorgulayici, planId: string): Promise<string[]> {
  if (!UUID.test(planId)) return [];
  return (await db.sorgu<{ ekipman_id: string }>("SELECT ekipman_id::text FROM plan_ekipman WHERE plan_id = $1", [planId])).rows.map((x) => x.ekipman_id);
}
/** ekipman bu planda mı (rapor yalnız plandaki ekipmana açılır). Yetki ÇAĞIRANDA. */
export async function plandakiEkipman(db: Sorgulayici, planId: string, ekipmanId: string): Promise<boolean> {
  if (!UUID.test(planId) || !UUID.test(ekipmanId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM plan_ekipman WHERE plan_id = $1 AND ekipman_id = $2", [planId, ekipmanId])).rowCount;
}

/* ── PLANI SİL (372; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — yalnız yönetici (kayit_sil, modül 13) ve yalnız hiç
   raporu, faturası, gideri olmayan, tamamlanmamış plan (yanlış tesis / tarih / ekip; veritabanında, göç 0067). Ekip, ekipman satırları ve notlar
   birlikte gider; ekipmanlar tesiste kalır; başka planda kullanılmayan İSG ID yeniden kullanılmamış olur. */
export async function planSil(db: Sorgulayici, kim: Kisi, id: string): Promise<PlanYazma> {
  if (!canDoEylem(kim, "kayit_sil", { modul: MODUL })) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "plan", id, kim.ad);
  if (r.durum === "kullanildi") {
    const { tamamlandi, rapor, ...diger } = r.kullanim;
    return { durum: "red", neden: tamamlandi ? "Tamamlanmış plan silinmez." : rapor ? `Raporu olan plan silinmez (${rapor} rapor; silinmiş taslak dahil).`
      : `Plan silinemez: ${kullanimMetni(diger) || "başka kayıtlarda"} kullanıldı.` };
  }
  return r.durum === "tamam" ? { durum: "tamam", bildirim: `${r.ad} silindi.` } : { durum: "yok" };
}
