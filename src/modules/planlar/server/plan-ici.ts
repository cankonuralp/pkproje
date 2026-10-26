/* PLAN İÇİ — liste ve plan içi akış (modül 13; maket planlarim.html 4.–5. tur; pkproje §3.4). Yetki her işlevde SUNUCUDA:
   · Görme: Planlar "gör / yaz" bütün planlar; "kendi" yalnız ekibinde olduğu planlar. Başka firmanın planı "yok".
   · Kabul et / Reddet: yalnız plandaki denetçi (özel eylem plan_kabul_red) — tarafsızlık beyanı kişiseldir; kabul anındaki beyan metni plana yazılır.
   · Kontrol listesi, Tamamla, Tamamlamayı geri al: plandaki denetçi ya da Planlar "yaz" (planlama, yönetici).
   · Künye Düzenle: Planlar "yaz"; denetçinin gördüğü künye kendiliğinden değişmez — denetçi Güncelle'ye basar (§3.4 "Plan künyesi").
   · Proje notu: plandaki denetçiler ve Planlar "yaz" yazar ve görür; müşteri ve öteki roller görmez (karar 27); not değişmez, silinmez.
   · Ekipman ekle / kayıtlıyı plana al: plan görülüyor + Ekipman "yaz" + plan Kabul edildi ya da Denetimde (tamamlanmış planda kapalı — 12).
     Pasife al / etkinleştir: özel eylem ekipman_pasif + plan görülüyor; silme yok.
   · Rapor oluştur (2026-10-12, karar 12 değişti): tamamlanmış planda yeni rapor (kopya dahil) açılmaz — tuş görünür, izin.raporEngel nedeni söyler;
     açılışın kendisi Raporlar'da (acilabilirPlan) reddedilir.
   · Saha formu (2026-10-12, göç 0082): tamamlanan planda plandaki denetçi ya da Planlar "yaz" oluşturur, müşterinin imzalı taramasını yükler /
     değiştirir / kaldırır; planı gören formu ve taramayı açar.
   · Durum geçişleri ve zaman damgaları veritabanında (göç 0024); burada yalnız izinli geçiş istenir. İstemciden gelen sürüm yalnız "hangi
     sürümü gördüm" bilgisidir (iyimser kilit); yetki vermez. */
import { createHash } from "node:crypto";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";
import { AYAR_DOSYA, ayarOku, firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import type { YetkiHesabi } from "../../../server/yetki/canDo.ts";
import type { SahaFormuVerisi } from "../../../belge/saha.ts";
import type { OnBilgiVerisi } from "../../../belge/onbilgi.ts";
import { hesapGonderen, personelHesaplari } from "../../../server/kimlik/hesap.ts";
import { canDo, canDoEylem, duzey } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { ekipmanEkle as ekipmanKaydet, ekipmanKilitle, ekipmanKullanimi, ekipmanlar, ekipmanPasif as ekipmanPasifYaz, ekipmanSil as ekipmanSilYaz, koduKullanan, tesisEkipmanlari, type EkipmanOzeti } from "../../ekipman/server/ekipman.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri, tesisMusteriIletisim } from "../../musteriler/server/musteriler.ts";
import { personelOzetleri } from "../../personel/server/personel.ts";
import { meslek } from "../../personel/sema.ts";
import { yayindakiBelgeFormati } from "../../rapor-format/server/belgeler.ts";
import { ekipmanRaporuVar, mesaiDurumu, oncekiKontrol, oncekiRaporlar, planRaporlari, raporKunyeleriniYaz, type OncekiKontrol, type PlanRaporu } from "../../raporlar/server/plan-baglanti.ts";
import { KunyeGirdisi, kodBicimi, kodNormal, NotGirdisi, onBilgiDosyaAdi, onBilgiEpostasi, RedGirdisi, TAMAMLANDI_RAPOR, YeniEkipmanGirdisi, type KodTuru, type PlanDurumu } from "../sema.ts";
import { bugunTr, EKIP, MODUL, PLAN, PLAN_EKIPMAN, planAcabilir, planKarti, UUID, type Kisi, type PlanKarti } from "./planlar.ts";
import { adresler, kaynakEpostalari, type EpostaDurumu } from "../../../server/eposta/eposta.ts";
import { belgeEpostala } from "../../../server/eposta/belge-gonder.ts";
import { belgeDoldurmaKaydet, belgeDoldurmasi, type DoldurmaSonucu } from "../../rapor-format/server/doldurma.ts";
import { eksikElleAlanlar, elleAlanlari } from "../../../belge/doldurma.ts";
import { onBilgiDegerleri, sahaDegerleri, type BelgeDegerleri, type BelgeTuru } from "../../../belge/katalog.ts";
import type { FormatTanimi } from "../../../format/tanim.ts";

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
  /** plandaki denetçi, plan kabul edilmiş / denetimde / tamamlanmış, plan günü gelmiş (ENGEL 1: ileri tarihli plana rapor açılmaz) — tuş görünür */
  raporOlustur: boolean;
  /** 2026-10-26: rapor açma YETKİSİ (plandaki denetçi, Raporlar ve rapor_olustur) — plan durumu ve günü hariç; ekran kapıyı cihazda verir
      (ui/cihazKapisi.ts — sayfa bağlantısız açılınca bayat kalmasın) */
  raporYetkili: boolean;
  /** 2026-10-12 (reisim): tamamlanmış planda yeni rapor açılmaz — tuş görünür, basınca bu neden söylenir (null: açılır) */
  raporEngel: string | null;
  /** 2026-10-12: saha formu oluştur ve müşteri taramasını yükle / kaldır — plandaki denetçi ya da Planlar "yaz", plan tamamlanmış */
  sahaFormu: boolean;
}
function izinler(kim: Kisi, e: Erisim): PlanIzni {
  const d = e.p.durum, isci = e.uye || e.yazar;
  const raporYetkili = e.uye && duzey(kim, RAPORLAR_MODULU) !== "yok" && canDoEylem(kim, "rapor_olustur", { atananlar: e.atananlar });
  return {
    kabulRed: d === "bekliyor" && canDoEylem(kim, "plan_kabul_red", { atananlar: e.atananlar }),
    kontrol: isci && (d === "denetimde" || d === "tamamlandi"),
    kunyeDuzenle: e.yazar && d !== "reddedildi",
    kunyeGuncelle: !!e.benim && (e.benim.gorulen !== null || e.benim.kunye_surum !== e.p.kunye_surum),
    not: isci,
    ekipmanEkle: isci && duzey(kim, EKIPMAN_MODULU) === "yaz" && (d === "kabul" || d === "denetimde"),
    ekipmanPasif: isci && canDoEylem(kim, "ekipman_pasif") && (d === "kabul" || d === "denetimde" || d === "tamamlandi"),
    ekipmanSil: canDoEylem(kim, "kayit_sil", { modul: EKIPMAN_MODULU }),
    raporOlustur: raporYetkili && (d === "kabul" || d === "denetimde" || d === "tamamlandi") && e.p.baslangic <= bugunTr(),
    raporYetkili,
    raporEngel: d === "tamamlandi" ? TAMAMLANDI_RAPOR : null,
    sahaFormu: isci && d === "tamamlandi",
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
  /** 2026-10-17 (İ2): önceki kontrol — bu plan dışındaki son tamamlanmış raporun tarihi + sonucu; yoksa sistem öncesi kayıt; ikisi de yoksa null */
  onceki: OncekiKontrol | null;
  /** 2026-10-17 (İ3, göz): önceki raporun imzalı PDF'i — dosya null ise neden (saklama süresi dolduğu için silindi · görme yetkisi yok); önceki
      raporu yoksa null */
  oncekiRapor: { no: string; dosya: string | null; neden: string | null } | null;
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
  /** 432: plan açılınca giden e-postalar (alıcı, durum) — yalnız plan açabilene (planlama, yönetici); öteki null. 2026-10-25: müşteriye giden ön
      bilgilendirme formu e-postaları da (kaynak "onbilgi", PDF ekiyle) */
  epostalar: EpostaDurumu[] | null;
  /** 2026-10-12: oluşturulan saha formları, en yeni üstte (planı gören görür) */
  sahaFormlari: SahaFormuSatiri[];
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

  /* 2026-10-14 (reisim: "YENİ EKLENEN EKİPMANLAR HEP EN ÜSTTE OLSUN"): plana en son eklenen üstte; aynı anda eklenenler (plan açılışı) koda göre */
  const pe = (await db.sorgu<{ ekipman_id: string; sonradan: boolean; o: string }>(
    "SELECT ekipman_id::text, sonradan, to_char(olustu AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') AS o FROM plan_ekipman WHERE plan_id = $1", [id])).rows;
  const turler = await turOzetleri(db), turBul = new Map(turler.map((t) => [t.id, t]));
  const tumRaporlar = await planRaporlari(db, id);
  /* 542: eşit zamanda eklenenler (plan açılışı) koda göre — CI görsel karşılaştırmasında sıra rastgele değişiyordu (540) */
  const eklendi = new Map(pe.map((x) => [x.ekipman_id, x.o]));
  const ekp = (await ekipmanlar(db, pe.map((x) => x.ekipman_id)))
    .sort((x, y) => (eklendi.get(y.id) ?? "").localeCompare(eklendi.get(x.id) ?? "") || (x.kod < y.kod ? -1 : x.kod > y.kod ? 1 : 0));
  /* 360: silebilene (yönetici) hiç kullanılmamış ekipman — "Sil" (tanım veritabanında, göç 0056) */
  const kullanim = izin.ekipmanSil ? await ekipmanKullanimi(db, ekp.map((x) => x.id)) : null;
  const silinebilir = new Set(kullanim ? ekp.filter((x) => !kullanim.has(x.id)).map((x) => x.id) : []);
  /* 2026-10-17 (İ2, İ3): ekipmanın bu plan dışındaki son tamamlanmış raporu (Raporlar'ın okuyucusu) */
  const onc = await oncekiRaporlar(db, ekp.map((x) => x.id), id);
  const ekipman: PlanEkipmani[] = ekp.map((x) => {
    const t = turBul.get(x.turId), r = onc.get(x.id);
    /* göz: ekipteki denetçi (istisna — raporlar.ts oncekiRaporGorulur) ya da Raporlar'ın görme kuralı (kendi / branş / hepsi) */
    const gorur = r && duzey(kim, RAPORLAR_MODULU) !== "yok" && (e.uye || canDo(kim, RAPORLAR_MODULU, "gor", { sahip: r.hesapId, brans: t?.brans ?? "m" }));
    const oncekiRapor = !r ? null : !gorur ? { no: r.no, dosya: null, neden: "bu raporu görme yetkiniz yok" }
      : { no: r.no, dosya: r.dosya, neden: r.dosya ? null : "PDF saklama süresi dolduğu için silindi" };
    return { id: x.id, kod: x.kod, turId: x.turId, tur: t?.ad ?? "—", brans: t?.brans ?? "m", konum: x.konum, seri: x.seri, pasif: x.pasif, surum: x.surum, sil: silinebilir.has(x.id),
      sonradan: !!pe.find((y) => y.ekipman_id === x.id)?.sonradan, onceki: oncekiKontrol(r, x), oncekiRapor };
  });
  const teklif = new Map<string, PlanIci["teklif"][number]>();
  for (const x of ekipman) {
    const s = teklif.get(x.turId) ?? { turId: x.turId, ad: x.tur, brans: x.brans, planlanan: 0, planda: 0 };
    s.planda++; if (!x.sonradan) s.planlanan++;
    teklif.set(x.turId, s);
  }
  const kayitliEkp = izin.ekipmanEkle ? (await tesisEkipmanlari(db, p.tesis_id)).filter((x) => !x.pasif && !pe.some((y) => y.ekipman_id === x.id)) : [];
  const kayitliOnc = await oncekiRaporlar(db, kayitliEkp.map((x) => x.id), id);
  const kayitli = kayitliEkp.map((x) => ({ id: x.id, kod: x.kod, tur: turBul.get(x.turId)?.ad ?? "—", konum: x.konum, onceki: oncekiKontrol(kayitliOnc.get(x.id), x)?.tarih ?? null }));
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
    epostalar: planAcabilir(kim) ? await kaynakEpostalari(db, ["plan", ONBILGI_KAYNAK], p.id) : null, sahaFormlari: await sahaFormlari(db, id), izin,
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
  /** 595 (madde 1): planın ekibi (personel kimlikleri) — raporun ikinci muayene uzmanı bunlardan seçilir */
  ekip: string[];
  /** isteyenin plandaki personeli (ekipte değilse null) */
  personelId: string | null;
  /** isteyenin gördüğü künye (Güncelle'ye basmadıysa eski) ve sürümü; ekipte değilse güncel künye */
  kunye: Kunye; kunyeSurum: number;
  /** güncel künye (isteyenin İSG-KATİP ID'siyle) ve sürümü */
  guncelKunye: Kunye; guncelSurum: number;
}
/** Raporlar "Kaydet ve kopyala" için: kişi bu plana yeni ekipman ekleyebilir mi (plan içi "Ekipman ekle" ile aynı izin) */
export async function ekipmanEklenebilir(db: Sorgulayici, kim: Kisi, planId: string): Promise<boolean> {
  return (await ekipmanEklemeDurumu(db, kim, planId)) === "tamam";
}
/** 2026-10-12 (reisim: "kaydet ve kopyala tuşunu bazı raporlarda göremedim"): eklenebilir mi; eklenemiyorsa YALNIZ plan tamamlandığı için mi
    ("tamamlandi" — karar 12: önce tamamlama geri alınır; kişi Tamamlamayı geri alınca ekleyebilir) — Raporlar kopya tuşunda nedenini söyler */
export async function ekipmanEklemeDurumu(db: Sorgulayici, kim: Kisi, planId: string): Promise<"tamam" | "tamamlandi" | "yok"> {
  const e = await erisim(db, kim, planId);
  if (!e) return "yok";
  if (izinler(kim, e).ekipmanEkle) return "tamam";
  return e.p.durum === "tamamlandi" && izinler(kim, { ...e, p: { ...e.p, durum: "denetimde" } }).ekipmanEkle ? "tamamlandi" : "yok";
}
/** planı görebilene planın rapor için gereken bilgisi; göremeyene null */
export async function raporIcinPlan(db: Sorgulayici, kim: Kisi, planId: string): Promise<RaporPlani | null> {
  const e = await erisim(db, kim, planId);
  if (!e) return null;
  const { p, benim } = e;
  const guncelKunye: Kunye = { firma_adi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg_no: benim?.isg_no ?? null };
  return {
    id: p.id, no: p.no, durum: p.durum, tesisId: p.tesis_id, baslangic: p.baslangic, atananlar: e.atananlar, ekip: e.ekip.map((x) => x.personel_id),
    personelId: benim?.personel_id ?? null,
    kunye: benim?.gorulen ?? guncelKunye, kunyeSurum: benim && benim.gorulen ? benim.kunye_surum : p.kunye_surum, guncelKunye, guncelSurum: p.kunye_surum,
  };
}
/** 2026-10-17 (İ3): ekipmanı içeren ve kişinin EKİBİNDE olduğu planlar (kimlikler) — göz işaretinin imzalı PDF istisnası (raporlar.ts
    oncekiRaporGorulur) bunlardan birinin "önceki raporu" mu diye bakar. İstisna yalnız sahada o ekipmana bakacak denetçi içindir; planı yalnız
    gören (planlama, yöneticiler) Raporlar'ın kendi görme kuralıyla açar — plana tesisin bütün ekipmanı girdiğinden "planı gören" öteki branşın
    raporunu açardı (2026-10-17 deneme makinesi bulgusu). */
export async function ekipmanEkipPlanlari(db: Sorgulayici, kim: Kisi, ekipmanId: string): Promise<string[]> {
  if (!UUID.test(ekipmanId) || duzey(kim, MODUL) === "yok") return [];
  const l = (await db.sorgu<{ plan_id: string }>("SELECT plan_id::text FROM plan_ekipman WHERE ekipman_id = $1 ORDER BY plan_id", [ekipmanId])).rows;
  const ekipte: string[] = [];
  for (const x of l) if ((await erisim(db, kim, x.plan_id))?.uye) ekipte.push(x.plan_id);
  return ekipte;
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

/* ── SAHA FORMU (2026-10-12; reisim: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket planlarim.html saha formu (2026-09-26:
   "plan tamamlandıktan sonra saha formu oluştur tuşu gelsin bu tuşa istenildiği kadar basılsın … yapılan ekipmanlar ve yapıldığına dair firma onayı
   için imza yerleri"), 197 imzalı saha formu yükle; göç 0082). Tamamlanan planda plandaki denetçi ya da Planlar "yaz" istendiği kadar oluşturur:
   numara planın numarası + "-SF" + sıra (plan satırı kilitlenir — aynı anda iki oluşturma aynı sırayı almaz; numara yeniden verilmez). Belge
   basılırken içerik plandan okunur: yapılan ekipmanlar (planın etkin raporlarının ekipmanları, rapor numarası sırasıyla, her ekipman bir kez) ve
   ekip. Müşterinin ıslak imzalı + kaşeli kâğıdının taraması (PDF / JPEG / PNG) aynı kişilerce yüklenir, değiştirilir, kaldırılır; eskisi çöpe (30
   gün). Formu ve taramayı planı gören açar (dosya erişim kaydı: DOSYA_SAHA). Form silinmez (müşteriye verilmiş belge; planı kullanılmış sayar). ── */
export const SAHA = tablo({ ad: "saha_formu", sutunlar: ["plan_id", "sira", "no", "olusturan", "tarama"] });
export const DOSYA_SAHA = "saha_formu";
export interface SahaFormuSatiri { id: string; no: string; olusturan: string; zaman: string; tarama: string | null; surum: number }

async function sahaFormlari(db: Sorgulayici, planId: string): Promise<SahaFormuSatiri[]> {
  return (await db.sorgu<{ id: string; no: string; olusturan: string; olustu: Date; tarama: string | null; surum: number }>(
    "SELECT id::text, no, olusturan, olustu, tarama::text, surum FROM saha_formu WHERE plan_id = $1 ORDER BY sira DESC", [planId])).rows
    .map((x) => ({ id: x.id, no: x.no, olusturan: x.olusturan, zaman: x.olustu.toISOString(), tarama: x.tarama, surum: x.surum }));
}

export async function sahaFormuOlustur(db: Sorgulayici, kim: Kisi, id: string): Promise<PlanYazma> {
  const e = await erisim(db, kim, id);
  if (!e) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  await db.sorgu("SELECT 1 FROM plan WHERE id = $1 FOR UPDATE", [id]);
  const p = await planOku(db, id);
  if (!p || p.durum !== "tamamlandi") return { durum: "red", neden: "Saha formu plan tamamlanınca oluşturulur." };
  const sira = (await db.sorgu<{ n: number }>("SELECT coalesce(max(sira), 0)::int + 1 AS n FROM saha_formu WHERE plan_id = $1", [id])).rows[0].n;
  if (sira > 999) return { durum: "red", neden: "Bir planda en çok 999 saha formu oluşturulur." };
  const no = `${p.no}-SF${sira}`;
  const r = await ekle(db, SAHA, { plan_id: id, sira, no, olusturan: kim.ad }, iz(kim, "saha_formu.olustur", p, no));
  return { durum: "tamam", bildirim: `${no} oluşturuldu. PDF'ini açıp yazdırın; müşterinin imzalı taramasını buraya yükleyin.`, id: r.id };
}

/** saha formunun plandan gelen içeriği (form numarası hariç) — yetki ÇAĞIRANDA */
async function sahaIcerigi(db: Sorgulayici, e: Erisim, kart: PlanKarti, depo: Depo | null): Promise<Omit<SahaFormuVerisi, "no">> {
  const sirali = [...(await planRaporlari(db, e.p.id))].sort((a, b) => a.no.localeCompare(b.no, "tr"));
  const tekil = [...new Map(sirali.map((x) => [x.ekipmanId, x] as const)).values()];
  const ekp = new Map((await ekipmanlar(db, tekil.map((x) => x.ekipmanId))).map((x) => [x.id, x] as const));
  const turAd = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad] as const));
  const firma = await firmaBelgeKunyesi(db, depo);
  return {
    firma: { ad: firma.ad, kod: firma.kod, adres: firma.adres, logo: firma.logo },
    projeNo: kart.no, baslangic: kart.baslangic, bitis: kart.bitis, musteri: kart.musteri.unvan, tesis: kart.tesis.ad, adres: e.p.adres,
    ekipmanlar: tekil.map((x) => { const k = ekp.get(x.ekipmanId); return { kod: k?.kod ?? "—", tur: turAd.get(x.turId) ?? "—", konum: k?.konum ?? null }; }),
    uzmanlar: kart.ekip.map((x) => x.ad),
    /* 2026-10-25 (belge formatları): firmanın yayınladığı saha formu formatı; yoksa temel format */
    format: await yayindakiBelgeFormati(db, "saha"),
  };
}

/** formun belgesi (PDF ucu); planı göremeyene ya da başka planın formuna null. 2026-10-25 (belge doldurma): formun elle doldurulan yerleri
    (Rapor formatı › Belgeler'deki formatın "alan" hücreleri; belge_doldurma, kayıt = form) */
export async function sahaFormuVerisi(db: Sorgulayici, kim: Kisi, planId: string, formId: string, depo: Depo | null): Promise<SahaFormuVerisi | null> {
  if (!UUID.test(formId)) return null;
  const e = await erisim(db, kim, planId);
  if (!e) return null;
  const f = (await db.sorgu<{ no: string }>("SELECT no FROM saha_formu WHERE id = $1 AND plan_id = $2", [formId, planId])).rows[0];
  const kart = f ? await planKarti(db, kim, planId) : null;
  if (!f || !kart) return null;
  const v = await sahaIcerigi(db, e, kart, depo);
  return { ...v, no: f.no, elle: v.format ? (await belgeDoldurmasi(db, "saha", formId))?.degerler ?? null : null };
}

/* ── ÖN BİLGİLENDİRME FORMU (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız"; N1 — "ön bilgilendirme formu her firmanın kendi formatına göre değişir"): planı gören indirir. İçerik plandan: müşteri, tesis,
   adres, başlangıç / bitiş, proje no, ekip, plandaki ekipmanlar (koda göre; pasif hariç). Firmanın yayınladığı format (Rapor formatı › Belgeler)
   önce; yoksa Firma ayarları'na yüklenen PDF (yuklu — uç dosyanın kendisini verir); o da yoksa temel format (src/belge/onbilgi.ts).
   2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için sözleşme
   açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"): formatın elle doldurulan yerleri planı değiştirebilen doldurur
   (onBilgiDoldur; belge_doldurma, kayıt = plan); form müşterinin e-postasına PDF ekiyle gider (plan açılınca yanıttan sonra ve "Ön bilgilendirme
   formunu gönder" ile — onbilgi.ts). Gönderilen PDF tek dosya yolunda saklanır (modül DOSYA_ONBILGI, kayıt = plan; planı gören açar). ── */
export type OnBilgiBelgesi = OnBilgiVerisi & { yuklu: { anahtar: string; ad: string } | null };
export const DOSYA_ONBILGI = "plan_onbilgi";
/** ön bilgilendirme formu e-postalarının kaynağı (plan içi listesi "plan" ile birlikte okur) */
export const ONBILGI_KAYNAK = "onbilgi";

/** planın ön bilgilendirme formu içeriği — yetki ÇAĞIRANDA */
async function onBilgiIcerigi(db: Sorgulayici, e: Erisim, kart: PlanKarti, depo: Depo | null): Promise<OnBilgiBelgesi> {
  const pe = (await db.sorgu<{ ekipman_id: string }>("SELECT ekipman_id::text FROM plan_ekipman WHERE plan_id = $1", [e.p.id])).rows;
  const turAd = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad] as const));
  const format = await yayindakiBelgeFormati(db, "onbilgi");
  const dosyaId = format ? null : (await ayarOku(db, "belge_sablon")).deger.on_bilgi;
  const yuklu = dosyaId ? (await db.sorgu<{ anahtar: string; ad: string }>(
    "SELECT anahtar, ad FROM dosya WHERE id = $1 AND modul = $2 AND tur = 'application/pdf' AND cop IS NULL", [dosyaId, AYAR_DOSYA])).rows[0] ?? null : null;
  const firma = await firmaBelgeKunyesi(db, depo);
  return {
    firma: { ad: firma.ad, kod: firma.kod, adres: firma.adres, logo: firma.logo },
    projeNo: kart.no, tarih: bugunTr(), musteri: kart.musteri.unvan, tesis: kart.tesis.ad, adres: e.p.adres, baslangic: kart.baslangic, bitis: kart.bitis,
    uzmanlar: kart.ekip.map((x) => ({ ad: x.ad, meslek: meslek(x.meslek)?.ad ?? x.meslek })),
    ekipmanlar: (await ekipmanlar(db, pe.map((x) => x.ekipman_id))).filter((x) => !x.pasif).map((x) => ({ kod: x.kod, tur: turAd.get(x.turId) ?? "—", konum: x.konum })),
    format, elle: format ? (await belgeDoldurmasi(db, "onbilgi", e.p.id))?.degerler ?? null : null, yuklu,
  };
}

export async function onBilgiVerisi(db: Sorgulayici, kim: Kisi, planId: string, depo: Depo | null): Promise<OnBilgiBelgesi | null> {
  const e = await erisim(db, kim, planId);
  const kart = e ? await planKarti(db, kim, planId) : null;
  if (!e || !kart) return null;
  return onBilgiIcerigi(db, e, kart, depo);
}

/** dosya erişim kaydı: gönderilen ön bilgilendirme formunu (e-posta eki) planı gören açar */
export async function onBilgiDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, planId: string): Promise<boolean> {
  return !!(await erisim(db, { ...kisi, ad: "" }, planId));
}

/* ── BELGE DOLDURMA (2026-10-25) — plan içinde "Belgeyi doldur": firmanın yayındaki formatında elle doldurulacak yer ("alan" hücresi) varsa.
   Ön bilgilendirme formu: planı değiştirebilen (Planlar "yaz"). Saha formu: saha formunu yazabilen (plandaki denetçi ya da Planlar "yaz"). Değerler
   Rapor formatı modülünün doldurma kaydında (rapor-format/server/doldurma.ts; format sürümü ve iyimser kilitle). ── */
export interface BelgeDoldurmaPaneli {
  tanim: FormatTanimi;
  /** kayıtlı elle değerler (hücre kimliği → değer) ve sürümü (henüz doldurulmadıysa null) */
  degerler: Record<string, string>; surum: number | null;
  /** önizlemenin verisi (kayıttan gelen değerler; elle değerler pencerede girildikçe) */
  onizleme: { firma: { ad: string; kod: string; adres?: string | null; logo?: string | null }; degerler: BelgeDegerleri };
  /** zorunlu olup doldurulmamış (varsayılanı da olmayan) elle yerlerin adları — gönderimde uyarı, engel değil */
  eksik: string[];
}
export interface PlanBelgeleri {
  /** ön bilgilendirme formunun doldurma paneli — planı değiştirebilene, formatında elle yer varsa */
  onBilgiDoldur: BelgeDoldurmaPaneli | null;
  /** "Ön bilgilendirme formunu gönder" — planı değiştirebilene, müşterinin e-postası varsa: alıcılar ve doldurulmamış yerler */
  onBilgiGonder: { alicilar: string[]; eksik: string[] } | null;
  /** saha formlarının doldurma paneli (form kimliği → panel) — saha formunu yazabilene, formatında elle yer varsa */
  sahaDoldur: Record<string, BelgeDoldurmaPaneli>;
}

async function doldurmaPaneli(db: Sorgulayici, belge: BelgeTuru, kayitId: string, tanim: FormatTanimi,
  v: { firma: BelgeDoldurmaPaneli["onizleme"]["firma"] }, degerler: BelgeDegerleri): Promise<BelgeDoldurmaPaneli> {
  const d = await belgeDoldurmasi(db, belge, kayitId);
  const elle = d?.degerler ?? {};
  return {
    tanim, degerler: elle, surum: d?.surum ?? null, onizleme: { firma: v.firma, degerler },
    eksik: eksikElleAlanlar(tanim, elle).map((a) => a.ad),
  };
}

/** plan içi ekranın belge tuşlarının verisi (doldurma, gönderim); göremeyene null */
export async function planBelgeleri(db: Sorgulayici, kim: Kisi, planId: string, depo: Depo | null): Promise<PlanBelgeleri | null> {
  const e = await erisim(db, kim, planId);
  if (!e) return null;
  const sonuc: PlanBelgeleri = { onBilgiDoldur: null, onBilgiGonder: null, sahaDoldur: {} };
  let kart: PlanKarti | null | undefined;
  const kartAl = async () => (kart === undefined ? (kart = await planKarti(db, kim, planId)) : kart);
  if (e.yazar) {
    const f = await yayindakiBelgeFormati(db, "onbilgi");
    if (f && elleAlanlari(f).length && (await kartAl())) {
      const v = await onBilgiIcerigi(db, e, kart!, depo);
      sonuc.onBilgiDoldur = await doldurmaPaneli(db, "onbilgi", planId, f, v, onBilgiDegerleri(v));
    }
    const alicilar = adresler([(await tesisMusteriIletisim(db, e.p.tesis_id))?.eposta]);
    if (alicilar.length) sonuc.onBilgiGonder = { alicilar, eksik: sonuc.onBilgiDoldur?.eksik ?? [] };
  }
  if (isci(e)) {
    const formlar = await sahaFormlari(db, planId);
    const f = formlar.length ? await yayindakiBelgeFormati(db, "saha") : null;
    if (f && elleAlanlari(f).length && (await kartAl())) {
      const v = await sahaIcerigi(db, e, kart!, depo);
      for (const s of formlar) {
        const sv = { ...v, no: s.no };
        sonuc.sahaDoldur[s.id] = await doldurmaPaneli(db, "saha", s.id, f, sv, sahaDegerleri(sv));
      }
    }
  }
  return sonuc;
}

const doldurmaYazmasi = (r: DoldurmaSonucu, ad: string): PlanYazma =>
  r.durum === "tamam" ? { durum: "tamam", bildirim: `${ad} kaydedildi.` }
    : r.durum === "gecersiz" ? { durum: "gecersiz", hatalar: r.hatalar }
    : r.durum === "cakisma" ? { durum: "red", neden: `${ad} siz açtıktan sonra başkası tarafından dolduruldu. Sayfayı yenileyip yeniden deneyin.` }
    : { durum: "red", neden: `${ad} için yayında format yok; doldurulacak yer yok.` };
/** istemciden gelen sürüm: yalnız "hangi sürümü gördüm" (null: henüz doldurulmamıştı; bozuk değer hiçbir sürüme uymaz → çakışma) */
const doldurmaSurumu = (s: unknown) => (s === null || s === undefined ? null : Number.isSafeInteger(s) ? (s as number) : -1);

/** ön bilgilendirme formunun elle yerlerini kaydeder — planı değiştirebilen */
export async function onBilgiDoldur(db: Sorgulayici, kim: Kisi, planId: string, girdi: unknown, surum: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, planId);
  if (!e) return { durum: "yok" };
  if (!e.yazar) return { durum: "yetkisiz" };
  return doldurmaYazmasi(await belgeDoldurmaKaydet(db, { ad: kim.ad }, "onbilgi", planId, girdi, doldurmaSurumu(surum)), "Ön bilgilendirme formu");
}

/** saha formunun elle yerlerini kaydeder — saha formunu yazabilen (plandaki denetçi ya da Planlar "yaz"); form bu planın olmalı */
export async function sahaFormuDoldur(db: Sorgulayici, kim: Kisi, planId: string, formId: string, girdi: unknown, surum: unknown): Promise<PlanYazma> {
  const e = await erisim(db, kim, planId);
  if (!e || !UUID.test(formId)) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  if (!(await db.sorgu("SELECT 1 FROM saha_formu WHERE id = $1 AND plan_id = $2", [formId, planId])).rowCount) return { durum: "yok" };
  return doldurmaYazmasi(await belgeDoldurmaKaydet(db, { ad: kim.ad }, "saha", formId, girdi, doldurmaSurumu(surum)), "Saha formu");
}

/* ── ÖN BİLGİLENDİRME FORMUNU GÖNDER — üç adım (onbilgi.ts onBilgiGonder): hazırla (yetki, alıcı, içerik; işlem) → PDF bas (işlem dışında) →
   kuyruğa yaz (belge tek dosya yolundan + alıcı başına ekli e-posta; işlem). Alıcı: müşterinin e-postası (Müşteriler'in kaydı); yoksa gönderilmez.
   Gönderen tuşa basan / planı açan kişi (hesapGonderen). ── */
export interface OnBilgiGonderimi { v: OnBilgiBelgesi; alicilar: string[]; gonderen: { ad: string; eposta: string } | null; konu: string; govde: string; dosyaAdi: string }
export const MUSTERI_EPOSTASI_YOK = "Müşterinin e-posta adresi yok; müşteri kaydına e-posta ekleyin.";

export async function onBilgiGonderHazirla(db: Sorgulayici, kim: Kisi, planId: string, depo: Depo | null):
  Promise<{ durum: "hazir"; g: OnBilgiGonderimi } | Exclude<PlanYazma, { durum: "tamam" }>> {
  const e = await erisim(db, kim, planId);
  if (!e) return { durum: "yok" };
  if (!e.yazar) return { durum: "yetkisiz" };
  const alicilar = adresler([(await tesisMusteriIletisim(db, e.p.tesis_id))?.eposta]);
  if (!alicilar.length) return { durum: "red", neden: MUSTERI_EPOSTASI_YOK };
  const kart = await planKarti(db, kim, planId);
  if (!kart) return { durum: "yok" };
  const v = await onBilgiIcerigi(db, e, kart, depo);
  const m = onBilgiEpostasi({ firma: v.firma.ad, musteri: kart.musteri.unvan, tesis: kart.tesis.ad, no: kart.no, adres: e.p.adres, baslangic: kart.baslangic, bitis: kart.bitis });
  return { durum: "hazir", g: { v, alicilar, gonderen: await hesapGonderen(db, kim.id), konu: m.konu, govde: m.govde, dosyaAdi: onBilgiDosyaAdi(kart.no) } };
}

export async function onBilgiKuyruga(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, planId: string, g: OnBilgiGonderimi, pdf: Uint8Array): Promise<PlanYazma> {
  const e = await erisim(db, kim, planId);
  if (!e) return { durum: "yok" };
  if (!e.yazar) return { durum: "yetkisiz" };
  await belgeEpostala(db, depo, { ad: kim.ad, id: kim.id }, firmaId, { pdf, dosyaAdi: g.dosyaAdi, modul: DOSYA_ONBILGI, kayitId: planId, kime: g.alicilar,
    konu: g.konu, govde: g.govde, kaynak: ONBILGI_KAYNAK, kaynakId: planId, gonderen: g.gonderen });
  return { durum: "tamam", bildirim: `Ön bilgilendirme formu ${g.alicilar.join(", ")} adresine gönderiliyor.` };
}

/** taramanın formu (yazma öncesi; satır kilitlenir, gördüğü sürüm denetlenir — dosya yüklenmeden önce) */
async function sahaKilitli(db: Sorgulayici, kim: Kisi, planId: string, formId: string, surum: number):
  Promise<{ e: Erisim; f: { no: string; tarama: string | null } } | Exclude<PlanYazma, { durum: "tamam" }>> {
  const e = await erisim(db, kim, planId);
  if (!e || !UUID.test(formId)) return { durum: "yok" };
  if (!isci(e)) return { durum: "yetkisiz" };
  if (e.p.durum !== "tamamlandi") return { durum: "red", neden: "Saha formu taraması tamamlanmış planda yüklenir." };
  const f = (await db.sorgu<{ no: string; tarama: string | null; surum: number }>(
    "SELECT no, tarama::text, surum FROM saha_formu WHERE id = $1 AND plan_id = $2 FOR UPDATE", [formId, planId])).rows[0];
  if (!f) return { durum: "yok" };
  if (!Number.isSafeInteger(surum) || f.surum !== surum) return { durum: "cakisma" };
  return { e, f };
}

export async function sahaTaramaYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, planId: string, formId: string, surum: number,
  belge: { ad: string; bayt: Uint8Array } | null): Promise<PlanYazma> {
  const k = await sahaKilitli(db, kim, planId, formId, surum);
  if ("durum" in k) return k;
  if (!belge) return { durum: "gecersiz", hatalar: { dosya: "Tarama seçilmeli (PDF, JPEG ya da PNG)." } };
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_SAHA, kayitId: formId, ad: belge.ad, bayt: belge.bayt, izinli: ["pdf", "jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "Tarama çok büyük (PDF en çok 25 MB, fotoğraf 8 MB)." : "Dosya PDF, JPEG ya da PNG değil ya da bozuk." } };
  const r = await guncelle(db, SAHA, formId, surum, { tarama: y.id }, iz(kim, k.f.tarama ? "saha_formu.tarama_degistir" : "saha_formu.tarama_yukle", k.e.p, k.f.no));
  if (r.durum !== "tamam") throw new Error("saha formu taraması bağlanamadı");   // satır kilitli ve sürüm denetlendi: beklenmez, işlem geri alınır
  if (k.f.tarama) await dosyaCope(db, k.f.tarama, { kim: kim.ad, ne: "saha_formu.tarama_degistir", gerekce: k.f.no });
  return { durum: "tamam", bildirim: `${k.f.no} imzalı taraması ${k.f.tarama ? "değiştirildi" : "yüklendi"}.` };
}

export async function sahaTaramaKaldir(db: Sorgulayici, kim: Kisi, planId: string, formId: string, surum: number): Promise<PlanYazma> {
  const k = await sahaKilitli(db, kim, planId, formId, surum);
  if ("durum" in k) return k;
  if (!k.f.tarama) return { durum: "red", neden: "Bu formda yüklü tarama yok." };
  const r = await guncelle(db, SAHA, formId, surum, { tarama: null }, iz(kim, "saha_formu.tarama_kaldir", k.e.p, k.f.no));
  if (r.durum !== "tamam") throw new Error("saha formu taraması kaldırılamadı");
  await dosyaCope(db, k.f.tarama, { kim: kim.ad, ne: "saha_formu.tarama_kaldir", gerekce: k.f.no });
  return { durum: "tamam", bildirim: `${k.f.no} taraması kaldırıldı.` };
}

/** dosya erişim kaydı: taramayı planı gören açar */
export async function sahaDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, formId: string): Promise<boolean> {
  if (!UUID.test(formId)) return false;
  const f = (await db.sorgu<{ plan_id: string }>("SELECT plan_id::text FROM saha_formu WHERE id = $1", [formId])).rows[0];
  return !!f && !!(await erisim(db, { ...kisi, ad: "" }, f.plan_id));
}

/* ── 524 S.A.Y CHAT (src/modules/say-chat; pkproje §3.10) ── planın S.A.Y Chat'e açık bilgisi: kişi plan ekibinde mi, durum, plan günü, kişinin
   personeli; plandaki ekipman (tür, branş, konum, pasif) ve raporu olanlar. Planı göremeyene null. Kayıt yazma ve rapor kararları S.A.Y Chat'te. */
export interface SayChatPlani {
  id: string; no: string; durum: PlanDurumu; baslangic: string; uye: boolean; personelId: string | null;
  ekipman: { id: string; kod: string; turId: string; brans: "m" | "e"; konum: string | null; pasif: boolean }[];
  raporlu: string[];
  /** 549 (sunum 546 K2): plandaki raporlar — ekipman, durum, kişinin kendi Yeni raporu mu (kayıt o raporun boş alanlarına girer) */
  raporlar: { ekipmanId: string; id: string; durum: string; benimTaslak: boolean }[];
}
export async function sayChatPlani(db: Sorgulayici, kim: Kisi, id: string): Promise<SayChatPlani | null> {
  const e = await erisim(db, kim, id);
  if (!e) return null;
  const pe = (await db.sorgu<{ ekipman_id: string }>("SELECT ekipman_id::text FROM plan_ekipman WHERE plan_id = $1", [id])).rows;
  const turBul = new Map((await turOzetleri(db)).map((t) => [t.id, t]));
  const ekipman = (await ekipmanlar(db, pe.map((x) => x.ekipman_id))).map((x) => ({
    id: x.id, kod: x.kod, turId: x.turId, brans: turBul.get(x.turId)?.brans ?? "m", konum: x.konum, pasif: x.pasif,
  })).sort((a, b) => a.kod.localeCompare(b.kod, "tr"));
  const raporlar = await planRaporlari(db, id);
  return {
    id, no: e.p.no, durum: e.p.durum, baslangic: e.p.baslangic, uye: e.uye, personelId: e.benim?.personel_id ?? null, ekipman,
    raporlu: [...new Set(raporlar.map((r) => r.ekipmanId))],
    raporlar: raporlar.map((r) => ({ ekipmanId: r.ekipmanId, id: r.id, durum: r.durum, benimTaslak: r.durum === "taslak" && r.hesapId === kim.id })),
  };
}
