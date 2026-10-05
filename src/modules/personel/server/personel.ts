/* PERSONEL — modülün dışa açılan işlevleri (maket personel.html; modül 2). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 2): Personel'i görebilen listeyi görür; "kendi" düzeyindeki (denetçi) yalnız kendi kaydını görür;
   DEĞİŞTİRMEK yalnız "yaz" düzeyinde (firma yöneticisi; kendi kaydını düzenlemek "kendi" düzeyine verilmez — meslek, sicil numaraları yönetici işi).
   Yazmalar güvenli yazıcıdan (sürüm kilidi + denetim izi). Liste yalnız listenin sütunlarını döndürür (09-B3). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { hesabinPersoneli, hesapEpostaEsitle, personelHesaplari, roldekiHesaplar, type HesapOzeti } from "../../../server/kimlik/hesap.ts";
import { canDo, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import type { Matris } from "../../../server/yetki/tanim.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { PersonelGirdisi, yetkiliOlabilir } from "../sema.ts";

const MODUL = 2;
const PERSONEL = tablo({
  ad: "personel",
  sutunlar: ["ad", "eposta", "imza_tel", "basla", "meslek", "meslek_metin", "diploma", "oda", "ekipnet", "durum", "ayrildi"],
});

export interface Kisi extends YetkiHesabi { ad: string }

export interface PersonelSatiri {
  id: string; ad: string; eposta: string | null; meslek: string; meslekMetin: string | null; ekipnet: string | null;
  durum: "etkin" | "ayrildi"; ayrildi: string | null; hesap: Pick<HesapOzeti, "durum" | "roller"> | null;
}
export interface PersonelKarti extends PersonelSatiri {
  imzaTel: string | null; basla: string; diploma: string | null; oda: string | null; surum: number; hesapAyrinti: HesapOzeti | null;
}

export type Yazma<T = { id: string; surum: number }> =
  | ({ durum: "tamam" } & T) | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const tarihMetni = (d: Date | string | null) => (d === null ? null : typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));

/** eksik bilgi — UYARI, engel değil (karar 38–39; maket MV.eksikBilgi): yalnız denetçi rolündeki kişide */
export function eksikBilgi(p: Pick<PersonelSatiri, "ekipnet" | "meslek" | "hesap">): string[] {
  if (!p.hesap?.roller.includes("denetci")) return [];
  const e: string[] = [];
  if (!p.ekipnet) e.push("EKİPNET kayıt no boş");
  if (!yetkiliOlabilir(p.meslek)) e.push("Meslek yetkili kişi meslekleri arasında değil");
  return e;
}

const degistirebilir = (kim: YetkiHesabi, matris?: Partial<Matris> | null) => duzey(kim, MODUL, matris) === "yaz";

/** liste: görebildiği kişiler (kendi düzeyinde yalnız kendisi); yetkisi yoksa null */
export async function personelListesi(db: Sorgulayici, kim: Kisi, matris?: Partial<Matris> | null): Promise<PersonelSatiri[] | null> {
  if (!canDo(kim, MODUL, "gor", undefined, matris)) return null;
  const d = duzey(kim, MODUL, matris);
  const kendi = d === "kendi" || d === "brans" ? await hesabinPersoneli(db, kim.id) : null;
  if ((d === "kendi" || d === "brans") && !kendi) return [];
  const r = await db.sorgu<{ id: string; ad: string; eposta: string | null; meslek: string; meslek_metin: string | null; ekipnet: string | null; durum: "etkin" | "ayrildi"; ayrildi: Date | null }>(
    `SELECT id::text, ad, eposta, meslek, meslek_metin, ekipnet, durum, ayrildi FROM personel ${kendi ? "WHERE id = $1" : ""} ORDER BY ad COLLATE "C"`,
    kendi ? [kendi] : []);
  const hesaplar = await personelHesaplari(db, r.rows.map((x) => x.id));
  return r.rows
    .map((x) => {
      const h = hesaplar.get(x.id);
      return { id: x.id, ad: x.ad, eposta: x.eposta, meslek: x.meslek, meslekMetin: x.meslek_metin, ekipnet: x.ekipnet, durum: x.durum, ayrildi: tarihMetni(x.ayrildi), hesap: h ? { durum: h.durum, roller: h.roller } : null };
    })
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** kart: görme yetkisi yoksa ya da başka firmanın / olmayan kaydıysa null (ayrım yapılmaz) */
export async function personelKarti(db: Sorgulayici, kim: Kisi, id: string, matris?: Partial<Matris> | null): Promise<PersonelKarti | null> {
  if (!/^[0-9a-f-]{36}$/.test(id) || !canDo(kim, MODUL, "gor", undefined, matris)) return null;
  const d = duzey(kim, MODUL, matris);
  if (d === "kendi" || d === "brans") { if ((await hesabinPersoneli(db, kim.id)) !== id) return null; }
  const x = (await db.sorgu<{ id: string; ad: string; eposta: string | null; imza_tel: string | null; basla: Date; ayrildi: Date | null; durum: "etkin" | "ayrildi"; meslek: string; meslek_metin: string | null; diploma: string | null; oda: string | null; ekipnet: string | null; surum: number }>(
    "SELECT id::text, ad, eposta, imza_tel, basla, ayrildi, durum, meslek, meslek_metin, diploma, oda, ekipnet, surum FROM personel WHERE id = $1", [id])).rows[0];
  if (!x) return null;
  const h = (await personelHesaplari(db, [x.id])).get(x.id) ?? null;
  return {
    id: x.id, ad: x.ad, eposta: x.eposta, imzaTel: x.imza_tel, basla: tarihMetni(x.basla)!, ayrildi: tarihMetni(x.ayrildi), durum: x.durum,
    meslek: x.meslek, meslekMetin: x.meslek_metin, diploma: x.diploma, oda: x.oda, ekipnet: x.ekipnet, surum: x.surum,
    hesap: h ? { durum: h.durum, roller: h.roller } : null, hesapAyrinti: h,
  };
}

const satirDegerleri = (g: PersonelGirdisi) => ({
  ad: g.ad, eposta: g.eposta, imza_tel: g.imzaTel, basla: g.basla, meslek: g.meslek, meslek_metin: g.meslek === "diger" ? g.meslekMetin : null,
  diploma: g.diploma, oda: g.oda, ekipnet: g.ekipnet,
});

/** benzersizlik ihlalini alana çevirir (e-posta başka kişide); öteki hatalar yukarı */
function cakisanEposta(h: unknown): Yazma | null {
  const e = h as { code?: string; constraint?: string };
  if (e.code === "23505" && (e.constraint === "personel_eposta" || e.constraint === "hesap_firma_id_eposta_key")) {
    return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir personelde kayıtlı." } };
  }
  /* 0030: kullanıcı adı firmada tek — müşteri girişinin e-postası personel hesabına verilemez */
  if (e.code === "23505" && e.constraint === "giris_eposta") return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta bir müşteri girişinin kullanıcı adı." } };
  return null;
}

export async function personelEkle(db: Sorgulayici, kim: Kisi, girdi: unknown, matris?: Partial<Matris> | null): Promise<Yazma> {
  if (!degistirebilir(kim, matris)) return { durum: "yetkisiz" };
  const g = dogrula(PersonelGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  try {
    const r = await ekle(db, PERSONEL, satirDegerleri(g.veri), { kim: kim.ad, ne: "personel.ekle" });
    return { durum: "tamam", ...r };
  } catch (h) { return cakisanEposta(h) ?? Promise.reject(h); }
}

export async function personelGuncelle(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown, matris?: Partial<Matris> | null): Promise<Yazma> {
  if (!degistirebilir(kim, matris)) return { durum: "yetkisiz" };
  const g = dogrula(PersonelGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const iz: Iz = { kim: kim.ad, ne: "personel.guncelle" };
  try {
    const r = await guncelle(db, PERSONEL, id, surum, satirDegerleri(g.veri), iz);
    if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
    if (r.durum === "tamam" && r.degisen.includes("eposta") && g.veri.eposta) await hesapEpostaEsitle(db, id, g.veri.eposta, iz);
    return { durum: "tamam", id, surum: r.surum };
  } catch (h) { return cakisanEposta(h) ?? Promise.reject(h); }
}

/** ayrıldı (karar 43: silinmez): tarih işe başlamadan önce olamaz; hesabı veritabanı tetiği kapatır, oturumları düşer */
export async function personelAyrildi(db: Sorgulayici, kim: Kisi, id: string, surum: number, tarih: string, matris?: Partial<Matris> | null): Promise<Yazma> {
  if (!degistirebilir(kim, matris)) return { durum: "yetkisiz" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return { durum: "gecersiz", hatalar: { ayrildi: "Tarih GG.AA.YYYY biçiminde olmalı." } };
  try {
    const r = await guncelle(db, PERSONEL, id, surum, { durum: "ayrildi", ayrildi: tarih }, { kim: kim.ad, ne: "personel.ayrildi" });
    if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
    return { durum: "tamam", id, surum: r.surum };
  } catch (h) {
    if ((h as { code?: string }).code === "23514") return { durum: "gecersiz", hatalar: { ayrildi: "Ayrılış işe başlamadan önce olamaz." } };
    throw h;
  }
}

/** öteki modüller için etkin personel seçenekleri (zimmet teslim alanı, plan denetçisi …): yetki ÇAĞIRANDA, yalnız ad ve meslek */
export async function personelSecenekleri(db: Sorgulayici): Promise<{ id: string; ad: string; meslek: string; meslekMetin: string | null }[]> {
  return (await db.sorgu<{ id: string; ad: string; meslek: string; meslek_metin: string | null }>(
    "SELECT id::text, ad, meslek, meslek_metin FROM personel WHERE durum = 'etkin'")).rows
    .map((x) => ({ id: x.id, ad: x.ad, meslek: x.meslek, meslekMetin: x.meslek_metin })).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** Planlar için (Plan aç): denetçi adayları — çalışan, hesabı açık (ilk ya da etkin) ve rolleri arasında denetçi olan kişiler; eksik bilgi
    (EKİPNET, meslek, ilk giriş) Planlar'da UYARI olarak gösterilir, engel değil (karar 38–39, M6). Yetki ÇAĞIRANDA. */
export async function denetciAdaylari(db: Sorgulayici): Promise<{ id: string; ad: string; meslek: string; meslekMetin: string | null; ekipnet: string | null; hesapDurum: "ilk" | "etkin" }[]> {
  const hesaplar = new Map((await roldekiHesaplar(db, "denetci")).map((h) => [h.personelId, h.durum]));
  if (!hesaplar.size) return [];
  return (await db.sorgu<{ id: string; ad: string; meslek: string; meslek_metin: string | null; ekipnet: string | null }>(
    "SELECT id::text, ad, meslek, meslek_metin, ekipnet FROM personel WHERE durum = 'etkin' AND id = ANY ($1::uuid[])", [[...hesaplar.keys()]])).rows
    .map((x) => ({ id: x.id, ad: x.ad, meslek: x.meslek, meslekMetin: x.meslek_metin, ekipnet: x.ekipnet, hesapDurum: hesaplar.get(x.id)! }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** Planlar için (plan kartı): verilen kişilerin adı ve mesleki bilgisi — ayrılan personel dahil (eski planlarda adı görünsün). Yetki ÇAĞIRANDA. */
/** Raporlar (belge, Yetkili kişi bölümü) için: ad, meslek, EKİPNET, diploma ve oda sicil no; yoksa null. Yetki ÇAĞIRANDA. */
export async function personelBelgeBilgisi(db: Sorgulayici, id: string): Promise<{ ad: string; meslek: string; ekipnet: string | null; diploma: string | null; oda: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return (await db.sorgu<{ ad: string; meslek: string; ekipnet: string | null; diploma: string | null; oda: string | null }>(
    "SELECT ad, meslek, ekipnet, diploma, oda FROM personel WHERE id = $1", [id])).rows[0] ?? null;
}

export async function personelOzetleri(db: Sorgulayici, idler: readonly string[]): Promise<{ id: string; ad: string; meslek: string; meslekMetin: string | null; ekipnet: string | null }[]> {
  const l = idler.filter((x) => /^[0-9a-f-]{36}$/.test(x));
  if (!l.length) return [];
  return (await db.sorgu<{ id: string; ad: string; meslek: string; meslek_metin: string | null; ekipnet: string | null }>(
    "SELECT id::text, ad, meslek, meslek_metin, ekipnet FROM personel WHERE id = ANY ($1::uuid[])", [l])).rows
    .map((x) => ({ id: x.id, ad: x.ad, meslek: x.meslek, meslekMetin: x.meslek_metin, ekipnet: x.ekipnet }));
}
