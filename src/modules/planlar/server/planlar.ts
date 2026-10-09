/* PLANLAR — modülün dışa açılan işlevleri (modül 13; maket plan-ac.html M6, planlarim.html). Sayfalar ve eylemler yalnız buradan geçer.
   · PLAN AÇ yalnız plan açma yetkisi olana (canDoEylem plan_ac = Planlar "yaz": önerilen düzende planlama + firma yöneticisi), sunucuda.
   · Tesis etkin, müşterisi etkin olmalı (karar 48: pasif tesise yeni plan açılmaz); denetçi çalışan ve hesabı açık bir denetçi olmalı.
   · İSG-KATİP SÖZLEŞME ID sözleşmeden gelir (Sözleşmeler'in dışa açtığı kayıt; plan açılınca "kullanıldı" olur — silinmez); yoksa plan açan el
     ile yazar, "sözleşmeye de kaydet" işaretliyse tesisin yürürlükteki iş sözleşmesine Sözleşmeler'in işleviyle eklenir (Sözleşmeler "yaz" ister).
   · Uyarılar ENGEL DEĞİL (sema.ts); engeller: tesis, tarih, bitiş ≥ başlangıç, en az bir denetçi.
   · Proje no sunucuda (P-AAYY-SIRA, açıldığı ay; önek firma ayarı), plan + ekip aynı işlemde; yazmalar güvenli yazıcıdan, denetim izine.
   · Görme: Planlar "gör / yaz" bütün planlar; "kendi" yalnız ekibinde olduğu planlar (hesap → personel). Başka firmanın planı "yok". */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { numaraAl } from "../../../server/numara/numara.ts";
import { canDo, canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { ekipmanEkle, koduKullanan, tesisEkipmanlari } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { atamaHaritasi } from "../../personel/server/dosyalar.ts";
import { denetciAdaylari, personelOzetleri } from "../../personel/server/personel.ts";
import { epostaRehberi, personelHesaplari } from "../../../server/kimlik/hesap.ts";
import { firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import { epostaKuyruga } from "../../../server/eposta/eposta.ts";
import { tesisMusteriIletisim } from "../../musteriler/server/musteriler.ts";
import { isgKaydet, isgKullanildi, sozlesmeDegistirir, tesisIsgKayitlari, tesisSozlesmeleri } from "../../sozlesmeler/server/sozlesmeler.ts";
import {
  adayUyarilari, isgDurumu, kapsamHesapla, PlanAcGirdisi, planEpostasi, sozlesmeUyarisi, turUyarilari,
  type AcikPlan, type Aday, type IsgKaydi, type KapsamSatiri, type PlanDurumu, type Tur,
} from "../sema.ts";

export const MODUL = 13;
export const PLAN = tablo({ ad: "plan", sutunlar: ["no", "tesis_id", "baslangic", "bitis", "aciklama", "durum", "firma_adi", "adres", "sgk", "acan",
  "beyan", "kabul_eden", "red_eden", "red_gerekce", "kontrol_tamam", "kunye_surum", "bilgilendirme"] });
export const EKIP = tablo({ ad: "plan_ekip", sutunlar: ["plan_id", "personel_id", "isg_no", "isg_id", "kunye_surum", "gorulen"] });
export const PLAN_EKIPMAN = tablo({ ad: "plan_ekipman", sutunlar: ["plan_id", "ekipman_id", "sonradan", "ekleyen"] });
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const ACIK: PlanDurumu[] = ["bekliyor", "kabul", "denetimde"];
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** Türkiye'de bugünün takvim günü "YYYY-MM-DD" */
export const bugunTr = (d = new Date()) => GUN.format(d);

export interface Kisi extends YetkiHesabi { ad: string }
export const planAcabilir = (kim: YetkiHesabi) => canDoEylem(kim, "plan_ac");

export type Yazma =
  | { durum: "tamam"; id: string; no: string; eposta?: number }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "yetkisiz" };

export interface PlanAcVerisi {
  musteriler: { id: string; kisa: string; unvan: string; tesisler: { id: string; ad: string; il: string | null; ilce: string | null }[] }[];
  adaylar: Aday[]; turler: Tur[]; atamalar: Record<string, string[]>; acikPlanlar: AcikPlan[]; esik: number; bugun: string;
  /** "sözleşmeye de kaydet" gösterilir mi (Sözleşmeler "yaz") */
  isgYazar: boolean;
  /** 432: bilgilendirme listesi için firmanın açık hesapları (ad + e-posta) */
  rehber: { ad: string; eposta: string }[];
  /** 444: denetçi adayının giriş e-postası (personel → e-posta) — seçilince Bilgilendirme'de görünür (e-posta ekibe kendiliğinden gider) */
  adayEposta: Record<string, string>;
}

export async function acikPlanlar(db: Sorgulayici): Promise<AcikPlan[]> {
  const p = (await db.sorgu<{ id: string; no: string; baslangic: string; bitis: string; tesis_id: string }>(
    "SELECT id::text, no, baslangic::text, bitis::text, tesis_id::text FROM plan WHERE durum = ANY ($1)", [ACIK])).rows;
  const e = (await db.sorgu<{ plan_id: string; personel_id: string }>(
    "SELECT e.plan_id::text, e.personel_id::text FROM plan_ekip e JOIN plan p ON p.id = e.plan_id AND p.firma_id = e.firma_id WHERE p.durum = ANY ($1)", [ACIK])).rows;
  return p.map((x) => ({ id: x.id, no: x.no, baslangic: x.baslangic, bitis: x.bitis, tesis: x.tesis_id, ekip: e.filter((y) => y.plan_id === x.id).map((y) => y.personel_id) }));
}

/** Plan aç formunun verisi; plan açamayana null */
export async function planAcVerisi(db: Sorgulayici, kim: Kisi): Promise<PlanAcVerisi | null> {
  if (!planAcabilir(kim)) return null;
  const musteriler = (await musteriOzetleri(db)).filter((m) => !m.pasif)
    .map((m) => ({ id: m.id, kisa: m.kisa, unvan: m.unvan, tesisler: m.tesisler.filter((t) => !t.pasif).map((t) => ({ id: t.id, ad: t.ad, il: t.il, ilce: t.ilce })) }));
  const adaylar = await denetciAdaylari(db);
  return {
    musteriler, adaylar, turler: (await turOzetleri(db)).map(({ id, ad, brans, grup, periyot }) => ({ id, ad, brans, grup, periyot })),
    atamalar: await atamaHaritasi(db), acikPlanlar: await acikPlanlar(db), esik: (await ayarOku(db, "uyari_esikleri")).deger.plan_kontrolu_geliyor,
    bugun: bugunTr(), isgYazar: sozlesmeDegistirir(kim), rehber: await epostaRehberi(db),
    adayEposta: Object.fromEntries([...(await personelHesaplari(db, adaylar.map((a) => a.id))).values()].map((h) => [h.personelId, h.eposta])),
  };
}

export interface TesisPlanBilgisi {
  isg: IsgKaydi[]; sozlesmeler: { no: string; baslangic: string; bitis: string }[];
  /** 444: kod ve konum da (Plan aç › Ekipmanlar listesi) */
  ekipmanlar: { id: string; kod: string; konum: string | null; turId: string; sonKontrol: string | null; pasif: boolean }[];
  /** "sözleşmeye de kaydet" için bugün yürürlükte iş sözleşmesi var mı */
  yururlukte: boolean;
  /** 432: bilgilendirme listesi önerisi — tesisin müşterisinin e-postası */
  musteriEposta: string | null;
}

/** tesis seçilince: İSG-KATİP ID'leri, iş sözleşmeleri, ekipmanı; plan açamayana ya da tesis yoksa null */
export async function tesisPlanBilgisi(db: Sorgulayici, kim: Kisi, tesisId: string): Promise<TesisPlanBilgisi | null> {
  if (!planAcabilir(kim) || !UUID.test(tesisId)) return null;
  if (!(await musteriOzetleri(db)).some((m) => m.tesisler.some((t) => t.id === tesisId))) return null;
  const soz = await tesisSozlesmeleri(db, tesisId), bugun = bugunTr();
  return {
    isg: await tesisIsgKayitlari(db, tesisId), sozlesmeler: soz.map(({ no, baslangic, bitis }) => ({ no, baslangic, bitis })),
    ekipmanlar: (await tesisEkipmanlari(db, tesisId)).map((e) => ({ id: e.id, kod: e.kod, konum: e.konum, turId: e.turId, sonKontrol: e.disKontrol, pasif: e.pasif })),
    yururlukte: soz.some((s) => s.baslangic <= bugun && s.bitis >= bugun),
    musteriEposta: (await tesisMusteriIletisim(db, tesisId))?.eposta ?? null,
  };
}

/** planı aç: denetim → numara → plan + ekip (+ sözleşmeye kaydedilen ID) aynı işlemde. 432: ekipteki denetçilere ve bilgilendirme listesine
    e-posta aynı işlemde kuyruğa yazılır (gönderim yanıttan sonra — src/server/eposta); kok: firmanın adresi (e-postadaki plan bağlantısı) */
export async function planAc(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, secenek: { kok?: string } = {}): Promise<Yazma> {
  if (!planAcabilir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(PlanAcGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  const m = (await musteriOzetleri(db)).find((x) => x.tesisler.some((t) => t.id === v.tesis));
  const t = m?.tesisler.find((x) => x.id === v.tesis);
  if (!m || !t) return { durum: "gecersiz", hatalar: { tesis: "Tesis seçilmeli." } };
  if (m.pasif || t.pasif) return { durum: "gecersiz", hatalar: { tesis: "Pasif tesise plan açılmaz; önce tesisi yeniden etkinleştirin." } };
  const adaylar = await denetciAdaylari(db);
  if (v.ekip.some((e) => !adaylar.some((a) => a.id === e.personel))) return { durum: "gecersiz", hatalar: { ekip: "Denetçi listeden seçilmeli." } };
  const isg = await tesisIsgKayitlari(db, v.tesis), bugun = bugunTr();
  const kaydedilecek = v.ekip.filter((e) => !isg.some((x) => x.personelId === e.personel) && e.isgNo && e.kaydet);
  let sozlesmeId: string | null = null;
  if (kaydedilecek.length) {
    if (!sozlesmeDegistirir(kim)) return { durum: "gecersiz", hatalar: { ekip: "İSG-KATİP SÖZLEŞME ID'sini sözleşmeye kaydetme yetkiniz yok." } };
    sozlesmeId = (await tesisSozlesmeleri(db, v.tesis)).find((s) => s.baslangic <= bugun && s.bitis >= bugun)?.id ?? null;
    if (!sozlesmeId) return { durum: "gecersiz", hatalar: { ekip: "Tesisin yürürlükte iş sözleşmesi yok; ID sözleşmeye kaydedilemez." } };
  }
  /* 444: elle eklenen ekipman — tür firmada, kod firmada eşsiz (eski kod başkasına verilmez; tesiste kayıtlıysa zaten plana girer) */
  const turIdler = new Set((await turOzetleri(db)).map((x) => x.id)), ekHata: DogrulamaHatalari = {};
  for (const [i, e] of v.yeniEkipman.entries()) {
    if (!turIdler.has(e.tur)) { ekHata[`yeniEkipman.${i}.tur`] = "Ekipman türü seçilmeli."; continue; }
    const u = await koduKullanan(db, e.kod);
    if (!u) continue;
    ekHata[`yeniEkipman.${i}.kod`] = u.eski ? `${e.kod} daha önce başka bir ekipmanın koduydu; eski kod başka ekipmana verilmez.`
      : u.ekipman.tesisId === v.tesis ? `${e.kod} bu tesiste kayıtlı${u.ekipman.pasif ? " ama pasif" : "; zaten plana girer"}.` : `${e.kod} başka bir tesiste kayıtlı; aynı kod iki ekipmana verilemez.`;
  }
  if (Object.keys(ekHata).length) return { durum: "gecersiz", hatalar: ekHata };
  /* ── yazma: buradan sonrası beklenmeyen hata dışında düşmez; düşerse işlem bütünüyle geri alınır ── */
  const onek = (await ayarOku(db, "numara")).deger.proje;
  const no = await numaraAl(db, "proje", { onek });
  const adres = [t.adres, [t.ilce, t.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ") || null;
  const p = await ekle(db, PLAN, { no, tesis_id: v.tesis, baslangic: v.baslangic, bitis: v.bitis, aciklama: v.aciklama, durum: "bekliyor", firma_adi: m.unvan, adres, sgk: t.sgk, acan: kim.ad,
    bilgilendirme: v.bilgilendirme }, { kim: kim.ad, ne: "plan.ac", gerekce: no });
  for (const e of v.ekip) {
    let kayit = isg.find((x) => x.personelId === e.personel);
    if (!kayit && e.isgNo && e.kaydet) {
      const r = await isgKaydet(db, depo, kim, firmaId, sozlesmeId!, null, 0, { tesis: v.tesis, personel: e.personel, no: e.isgNo, onay: "", bitis: "" });
      if (r.durum !== "tamam") throw new Error(`İSG-KATİP ID sözleşmeye kaydedilemedi: ${r.durum}`);
      kayit = { id: r.id, personelId: e.personel, no: e.isgNo, onay: null, bitis: null };
    }
    await ekle(db, EKIP, { plan_id: p.id, personel_id: e.personel, isg_no: kayit?.no ?? e.isgNo, isg_id: kayit?.id ?? null }, { kim: kim.ad, ne: "plan.ekip", gerekce: no });
    if (kayit) await isgKullanildi(db, kim, kayit.id, bugun);
  }
  /* tesisin etkin ekipmanının hepsi plana girer (L6; kapsam seçimi yok) */
  for (const e of (await tesisEkipmanlari(db, v.tesis)).filter((x) => !x.pasif)) {
    await ekle(db, PLAN_EKIPMAN, { plan_id: p.id, ekipman_id: e.id, sonradan: false, ekleyen: kim.ad }, { kim: kim.ad, ne: "plan.ekipman", gerekce: no });
  }
  /* 444: elle eklenenler tesise kalıcı kayıt + plana (açılışta — "sonradan" değil) */
  for (const e of v.yeniEkipman) {
    const iz = { kim: kim.ad, ne: "plan.ekipman_ekle", gerekce: no };
    const ekipmanId = await ekipmanEkle(db, iz, { tesisId: v.tesis, turId: e.tur, kod: e.kod, seri: null, konum: e.konum });
    await ekle(db, PLAN_EKIPMAN, { plan_id: p.id, ekipman_id: ekipmanId, sonradan: false, ekleyen: kim.ad }, iz);
  }
  /* 432 (reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme kısmına elle ya da listeden
     mail girilebilecek"): ekipteki denetçilerin giriş e-postasına ve bilgilendirme listesine; alıcı başına bir e-posta, aynı işlemde kuyruğa */
  const hesap = await personelHesaplari(db, v.ekip.map((e) => e.personel));
  const ekipAd = v.ekip.map((e) => adaylar.find((a) => a.id === e.personel)?.ad ?? "");
  const ekipEposta = v.ekip.map((e) => hesap.get(e.personel)?.eposta).filter((x): x is string => !!x);
  const ortak = { firma: (await firmaBelgeKunyesi(db, null)).ad, no, musteri: m.kisa, tesis: t.ad, adres, baslangic: v.baslangic, bitis: v.bitis, ekip: ekipAd.filter(Boolean),
    aciklama: v.aciklama, baglanti: secenek.kok ? `${secenek.kok}/planlar/${p.id}` : null };
  const iz = { kim: kim.ad, ne: "plan.eposta", gerekce: no };
  const e1 = planEpostasi({ ...ortak, ekipten: true });
  await epostaKuyruga(db, { kime: ekipEposta, konu: e1.konu, govde: e1.govde, kaynak: "plan", kaynakId: p.id }, iz);
  const e2 = planEpostasi({ ...ortak, ekipten: false });
  const bilgi = await epostaKuyruga(db, { kime: v.bilgilendirme.filter((x) => !ekipEposta.includes(x)), konu: e2.konu, govde: e2.govde, kaynak: "plan", kaynakId: p.id }, iz);
  return { durum: "tamam", id: p.id, no, eposta: ekipEposta.length + bilgi.length };
}

export interface PlanKarti {
  id: string; no: string; durum: PlanDurumu; baslangic: string; bitis: string; aciklama: string | null; firmaAdi: string; adres: string | null;
  sgk: string | null; acan: string; olustu: string; surum: number; tesis: { id: string; ad: string }; musteri: { id: string; kisa: string; unvan: string };
  ekip: { personelId: string; ad: string; meslek: string; isgNo: string | null; isgDurum: "tamam" | "gec" | "bitti" | "elle" | "yok"; uyarilar: string[]; cakisma: { no: string; baslangic: string; bitis: string }[] }[];
  kapsam: KapsamSatiri[]; turUyarilari: string[]; sozlesmeUyarisi: string | null; gecmis: boolean; ekipman: number;
}

/** planın bilgisi + uyarıları; görmeyene, başka firmanın planına ya da olmayana null */
export async function planKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<PlanKarti | null> {
  if (!UUID.test(id) || duzey(kim, MODUL) === "yok") return null;
  const p = (await db.sorgu<{ id: string; no: string; durum: PlanDurumu; baslangic: string; bitis: string; aciklama: string | null; firma_adi: string; adres: string | null;
    sgk: string | null; acan: string; olustu: Date; surum: number; tesis_id: string }>(
    "SELECT id::text, no, durum, baslangic::text, bitis::text, aciklama, firma_adi, adres, sgk, acan, olustu, surum, tesis_id::text FROM plan WHERE id = $1", [id])).rows[0];
  if (!p) return null;
  const ekipDb = (await db.sorgu<{ personel_id: string; isg_no: string | null; isg_id: string | null }>(
    "SELECT personel_id::text, isg_no, isg_id::text FROM plan_ekip WHERE plan_id = $1", [id])).rows;
  const hesaplar = await personelHesaplari(db, ekipDb.map((x) => x.personel_id));
  if (!canDo(kim, MODUL, "gor", { atananlar: [...hesaplar.values()].map((h) => h.id) })) return null;
  const m = (await musteriOzetleri(db)).find((x) => x.tesisler.some((t) => t.id === p.tesis_id));
  const t = m?.tesisler.find((x) => x.id === p.tesis_id);
  const adaylar = await denetciAdaylari(db), isg = await tesisIsgKayitlari(db, p.tesis_id), planlar = await acikPlanlar(db);
  const turler: Tur[] = (await turOzetleri(db)).map(({ id: i, ad, brans, grup, periyot }) => ({ id: i, ad, brans, grup, periyot }));
  const ekipmanlar = (await tesisEkipmanlari(db, p.tesis_id)).map((e) => ({ turId: e.turId, sonKontrol: e.disKontrol, pasif: e.pasif }));
  const esik = (await ayarOku(db, "uyari_esikleri")).deger.plan_kontrolu_geliyor;
  const kapsam = kapsamHesapla(ekipmanlar, turler, p.baslangic, esik);
  const kisiler = await personelOzetleri(db, ekipDb.map((x) => x.personel_id));
  const ekipAday: Aday[] = ekipDb.map((e) => {
    const a = adaylar.find((x) => x.id === e.personel_id), k = kisiler.find((x) => x.id === e.personel_id);
    return a ?? { id: e.personel_id, ad: k?.ad ?? "—", meslek: k?.meslek ?? "diger", meslekMetin: k?.meslekMetin ?? null, ekipnet: k?.ekipnet ?? null, hesapDurum: "etkin" };
  });
  return {
    id: p.id, no: p.no, durum: p.durum, baslangic: p.baslangic, bitis: p.bitis, aciklama: p.aciklama, firmaAdi: p.firma_adi, adres: p.adres, sgk: p.sgk, acan: p.acan,
    olustu: p.olustu.toISOString(), surum: p.surum, tesis: { id: p.tesis_id, ad: t?.ad ?? "—" }, musteri: { id: m?.id ?? "", kisa: m?.kisa ?? "—", unvan: m?.unvan ?? p.firma_adi },
    ekip: ekipDb.map((e, i) => {
      const a = ekipAday[i];
      /* sözleşmedeki kayıt hâlâ geçerliyse onun onay / bitiş tarihiyle; yerine yenisi girildiyse planın ID'si el ile yazılmış gibi */
      const durum = isgDurumu(e.isg_id ? isg.find((x) => x.id === e.isg_id) : undefined, e.isg_no, p.baslangic);
      const u = adayUyarilari(a, durum, p.baslangic, p.bitis, planlar, p.id);
      return { personelId: e.personel_id, ad: a.ad, meslek: a.meslek, isgNo: e.isg_no, isgDurum: durum.tur, uyarilar: u.eksik, cakisma: u.cakisma.map(({ no, baslangic, bitis }) => ({ no, baslangic, bitis })) };
    }).sort((x, y) => x.ad.localeCompare(y.ad, "tr")),
    kapsam, turUyarilari: turUyarilari(kapsam, ekipAday, await atamaHaritasi(db)),
    sozlesmeUyarisi: sozlesmeUyarisi(await tesisSozlesmeleri(db, p.tesis_id), p.baslangic), gecmis: p.baslangic < bugunTr(p.olustu),
    ekipman: kapsam.reduce((n, k) => n + k.ekipman, 0),
  };
}
