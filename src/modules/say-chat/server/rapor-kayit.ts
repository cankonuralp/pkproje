/* S.A.Y CHAT RAPOR MODU — SUNUCU (2026-11-09; sunum claude.ai HBwuL3s9G693uopxSzTbjH K1–K6, göç 0124). Kayıtlar KİŞİYE ÖZEL (RLS firma + kişi); yalnız PLAN EKİBİNDEKİ kişi, plan kabul /
   denetimde / tamamlandı iken yazar. Kayıtlar çevrimdışı kuyruktan gelir (/api/islem, tek seferlik): "sayrapor.foto" (kayıt yoksa açar), "sayrapor.kaydet", "sayrapor.sil".
   "Bekleyenler için rapor yaz": kayıt rapor taslağı olur — koşullar raporu açan işlevlerde aynen (plan günü, tamamlanmış plan, günlük süre); kişinin kendi Yeni raporu varsa o raporun BOŞ
   alanlarına girer. K5: kayıt rapor bağlantısıyla kalır, fotoğraflar rapora kopyalanır, kaydın dosyaları çöpe. K2: etiket fotoğrafı yalnız bu anda, mesajda boş satır varsa okunmak üzere
   rapora konur; okuma eylemde (çağrı işlemin DIŞINDA) ve yalnız boş alanlara girer. Kilit tests/raporlar.test.ts (PG), tests/say-rapor-modu.test.ts (saf). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle, kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { ekle, guncelle, sil, tablo } from "../../../server/db/yazici.ts";
import type { YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { yzHazirMi } from "../../../server/yz/kullanim.ts";
import { sahaTanimi } from "../../../format/tablo.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { raporModuPlani, sayEkipmanlarEkle, type RaporModuPlani } from "../../planlar/server/plan-ici.ts";
import { formatsizTurler, formatSurumuOku, yayindakiFormat } from "../../rapor-format/server/formatlar.ts";
import { raporOneriYaz } from "../../raporlar/server/oneri.ts";
import { chatRaporuDoldur, raporOlustur } from "../../raporlar/server/raporlar.ts";
import { okumaHedefleri } from "../../raporlar/say-doldur.ts";
import { dagit, ekipmanDurumu, KAYIT_FOTO_EN_COK, RaporFotoGirdisi, RaporKaydiGirdisi, raporSatirlari, type RaporEkipmani, type RaporFoto, type RaporKaydi, type RaporModuVerisi, type RaporSatiri }
  from "../rapor-modu.ts";
import { DOSYA_SAY_CHAT } from "../sema.ts";

const KAYIT = tablo({ ad: "say_rapor_kayit", sutunlar: ["cihaz_id", "plan_id", "ekipman_id", "tur_id", "satirlar", "mesaj", "fotolar", "rapor_id", "rapor_no"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ACIK = new Set(["kabul", "denetimde", "tamamlandi"]);
const KAPALI = "Rapor modu bu planda kapalı: yalnız planın ekibindeki kişi, plan kabul edilmiş / denetimde / tamamlanmışken kayıt yazar.";
const json = (x: unknown) => JSON.stringify(x);

export interface Kisi extends YetkiHesabi { ad: string }
type KayitDb = { id: string; cihaz_id: string; plan_id: string; ekipman_id: string | null; tur_id: string | null; satirlar: RaporSatiri[]; mesaj: string[]; fotolar: RaporFoto[];
  rapor_id: string | null; rapor_no: string | null; surum: number; olustu: Date };
const SEC = "SELECT id::text, cihaz_id::text, plan_id::text, ekipman_id::text, tur_id::text, satirlar, mesaj, fotolar, rapor_id::text, rapor_no, surum, olustu FROM say_rapor_kayit";
const kayitOku = async (db: Sorgulayici, cihazId: string, kilit = false) => (UUID.test(cihazId)
  ? (await db.sorgu<KayitDb>(`${SEC} WHERE cihaz_id = $1${kilit ? " FOR UPDATE" : ""}`, [cihazId])).rows[0] ?? null : null);
const baskasinda = async (db: Sorgulayici, cihazId: string) => (await db.sorgu<{ b: boolean }>("SELECT say_rapor_kayit_baskasinda($1) AS b", [cihazId])).rows[0]!.b;
const KIMLIK_KULLANILDI = { durum: "gecersiz" as const, hatalar: { kayit: "Kaydın kimliği kullanılmış; kaydı yeniden oluşturun." } };

async function kapi(db: Sorgulayici, kim: Kisi, planId: string): Promise<RaporModuPlani | null> {
  if (!UUID.test(planId)) return null;
  const p = await raporModuPlani(db, kim, planId);
  return p && p.uye && ACIK.has(p.durum) ? p : null;
}

const gorunum = (k: KayitDb): RaporKaydi => ({ id: k.cihaz_id, zaman: k.olustu.toISOString(), ekipmanId: k.ekipman_id, turId: k.tur_id, satirlar: k.satirlar, mesaj: k.mesaj, fotolar: k.fotolar,
  rapor: k.rapor_id ? { id: k.rapor_id, no: k.rapor_no ?? "" } : null });

/** rapor modu ekranı: kişinin bu plandaki kayıtları, plandaki bütün ekipman, türlerin satırları */
export async function raporModuVerisi(db: Sorgulayici, kim: Kisi, planId: string): Promise<RaporModuVerisi | null> {
  const p = await kapi(db, kim, planId);
  if (!p) return null;
  const formatsiz = new Set(await formatsizTurler(db)), tumu = await turOzetleri(db);
  const yeniTurler = tumu.filter((t) => !formatsiz.has(t.id)).map((t) => t.id);
  const gerekli = new Set([...yeniTurler, ...p.ekipman.map((e) => e.turId).filter((id) => !formatsiz.has(id))]);
  const ad = new Map(tumu.map((t) => [t.id, t.ad]));
  const turler: RaporModuVerisi["turler"] = {};
  for (const id of gerekli) {
    const f = await yayindakiFormat(db, id);
    if (f) turler[id] = { ad: ad.get(id) ?? "Ekipman", satirlar: raporSatirlari(f.tanim) };
  }
  const ekipmanlar = p.ekipman.map((e): RaporEkipmani => ({ id: e.id, kod: e.kod, turId: e.turId, konum: e.konum, ...ekipmanDurumu(e, p.raporlar, !!turler[e.turId]) }));
  const kayitlar = (await db.sorgu<KayitDb>(`${SEC} WHERE plan_id = $1 ORDER BY olustu, id`, [planId])).rows;
  return { plan: { id: p.id, no: p.no }, kayitlar: kayitlar.map(gorunum), ekipmanlar, turler, yeniTurler };
}

export type RaporKaydiYazma =
  | { durum: "tamam"; yeniSurum: number }
  | { durum: "gecersiz"; hatalar: Record<string, string> }
  | { durum: "red"; neden: string }
  | { durum: "yok" } | { durum: "cakisma" };

/** "sayrapor.foto" — kayıt yoksa açar; etiket fotoğrafı tektir (yenisi eskisinin yerine) */
export async function raporFotoEkle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, cihazId: string, girdi: unknown): Promise<RaporKaydiYazma> {
  const g = RaporFotoGirdisi.safeParse(girdi);
  if (!g.success || !UUID.test(cihazId)) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf okunamadı." } };
  const p = await kapi(db, kim, g.data.plan);
  if (!p) return { durum: "red", neden: KAPALI };
  let k = await kayitOku(db, cihazId, true);
  if (k && k.plan_id !== p.id) return { durum: "gecersiz", hatalar: { foto: "Kayıt başka bir plana ait." } };
  if (!k) {
    if (await baskasinda(db, cihazId)) return KIMLIK_KULLANILDI;
    await ekle(db, KAYIT, { cihaz_id: cihazId, plan_id: p.id, satirlar: "[]", mesaj: "[]", fotolar: "[]" }, { kim: kim.ad, ne: "say_rapor.kaydet", gerekce: p.no });
    k = (await kayitOku(db, cihazId, true))!;
  }
  if (g.data.rol === "ekipman" && k.fotolar.filter((f) => f.rol === "ekipman").length >= KAYIT_FOTO_EN_COK) return { durum: "gecersiz", hatalar: { foto: `Kayda en çok ${KAYIT_FOTO_EN_COK} fotoğraf eklenir.` } };
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_SAY_CHAT, kayitId: cihazId, ad: g.data.ad, bayt: new Uint8Array(Buffer.from(g.data.veri, "base64")), izinli: ["jpeg", "png"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) return { durum: "gecersiz", hatalar: { foto: y.neden === "tur" ? "Yalnız JPEG ya da PNG fotoğraf." : y.neden === "buyuk" ? "Fotoğraf çok büyük." : "Fotoğraf okunamadı." } };
  const eski = g.data.rol === "etiket" ? k.fotolar.filter((f) => f.rol === "etiket") : [];
  const fotolar = [...k.fotolar.filter((f) => !eski.includes(f)), { dosya: y.id, ad: y.ad, rol: g.data.rol }];
  const r = await guncelle(db, KAYIT, k.id, k.surum, { fotolar: json(fotolar) }, { kim: kim.ad, ne: "say_rapor.foto", gerekce: `${p.no} · ${y.ad}` });
  if (r.durum !== "tamam") return r.durum === "yok" ? { durum: "yok" } : { durum: "cakisma" };
  for (const f of eski) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_rapor.foto_kaldir", gerekce: p.no });
  return { durum: "tamam", yeniSurum: r.surum };
}

/** "sayrapor.kaydet" — ekipman, satırlar, mesaj. Kayıt tek seferde yazılır (sürüm çakışması yok); başka etkin kayıttaki ekipman seçilmez */
export async function raporKaydiKaydet(db: Sorgulayici, kim: Kisi, cihazId: string, girdi: unknown): Promise<RaporKaydiYazma> {
  const g = RaporKaydiGirdisi.safeParse(girdi);
  if (!g.success || !UUID.test(cihazId)) return { durum: "gecersiz", hatalar: { kayit: "Kayıt okunamadı; yeniden oluşturun." } };
  const p = await kapi(db, kim, g.data.plan);
  if (!p) return { durum: "red", neden: KAPALI };
  const k = await kayitOku(db, cihazId, true);
  if (k && k.plan_id !== p.id) return { durum: "gecersiz", hatalar: { kayit: "Kayıt başka bir plana ait." } };
  if (k?.rapor_id) return { durum: "tamam", yeniSurum: k.surum };
  let ekipmanId: string | null = null, turId: string | null = null;
  if (g.data.ekipman.tip === "plan") {
    const id = g.data.ekipman.id, e = p.ekipman.find((x) => x.id === id);
    if (!e) return { durum: "gecersiz", hatalar: { ekipman: "Ekipman bu planda yok." } };
    const d = ekipmanDurumu(e, p.raporlar, true);
    if (d.durum === "kapali") return { durum: "gecersiz", hatalar: { ekipman: `${e.kod}: ${d.neden}.` } };
    if ((await db.sorgu("SELECT 1 FROM say_rapor_kayit WHERE ekipman_id = $1 AND rapor_id IS NULL AND cihaz_id <> $2", [e.id, cihazId])).rowCount) {
      return { durum: "gecersiz", hatalar: { ekipman: `${e.kod} başka bir kaydınızda.` } };
    }
    ekipmanId = e.id; turId = e.turId;
  } else {
    const tur = g.data.ekipman.tur;
    if (!(await turOzetleri(db)).some((t) => t.id === tur)) return { durum: "gecersiz", hatalar: { ekipman: "Tür bulunamadı." } };
    turId = tur;
  }
  const mesaj = g.data.mesaj.map((x) => x.replace(/[\u0000-\u001f\u007f]/g, " ").trimEnd());
  const iz = { kim: kim.ad, ne: "say_rapor.kaydet", gerekce: p.no };
  if (!k) {
    if (await baskasinda(db, cihazId)) return KIMLIK_KULLANILDI;
    const y = await ekle(db, KAYIT, { cihaz_id: cihazId, plan_id: p.id, ekipman_id: ekipmanId, tur_id: turId, satirlar: json(g.data.satirlar), mesaj: json(mesaj), fotolar: "[]" }, iz);
    return { durum: "tamam", yeniSurum: y.surum };
  }
  const r = await guncelle(db, KAYIT, k.id, k.surum, { ekipman_id: ekipmanId, tur_id: turId, satirlar: json(g.data.satirlar), mesaj: json(mesaj) }, iz);
  if (r.durum === "cakisma") return { durum: "cakisma" };
  if (r.durum === "yok") return { durum: "yok" };
  return { durum: "tamam", yeniSurum: r.surum };
}

/** "sayrapor.sil" — kayıt ve (rapora geçmemiş) fotoğrafları çöpe; rapor varsa rapor kalır */
export async function raporKaydiSil(db: Sorgulayici, kim: Kisi, cihazId: string): Promise<RaporKaydiYazma> {
  const k = await kayitOku(db, cihazId, true);
  if (!k) return { durum: "tamam", yeniSurum: 0 };
  if (!(await sil(db, KAYIT, k.id, { kim: kim.ad, ne: "say_rapor.sil" }))) return { durum: "yok" };
  for (const f of k.fotolar) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_rapor.sil" });
  return { durum: "tamam", yeniSurum: 0 };
}

/** dosya erişimi: yalnız kaydın sahibi açar (RLS) */
export async function raporKaydiDosyasiGorulur(db: Sorgulayici, kayitId: string): Promise<boolean> {
  return UUID.test(kayitId) && !!(await db.sorgu("SELECT 1 FROM say_rapor_kayit WHERE cihaz_id = $1", [kayitId])).rowCount;
}

/* ── BEKLEYENLER İÇİN RAPOR YAZ ── */
export type KayitRaporSonucu =
  | { kayit: string; durum: "tamam"; rapor: { id: string; no: string }; okumalar: { bolum: string; dosya: string }[] }
  | { kayit: string; durum: "hata"; neden: string };

/** tek kaydın raporu (kendi işleminde çağrılır; ekran kayıtları SIRAYLA gönderir). Yazılmış kayıt yeniden yazılmaz */
export async function raporKaydiYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, planId: string, cihazId: string): Promise<KayitRaporSonucu> {
  const hata = (neden: string): KayitRaporSonucu => ({ kayit: cihazId, durum: "hata", neden });
  const p = await kapi(db, kim, planId);
  if (!p) return hata(KAPALI);
  const k = await kayitOku(db, cihazId, true);
  if (!k || k.plan_id !== p.id) return hata("Kayıt bulunamadı.");
  if (k.rapor_id) return { kayit: cihazId, durum: "tamam", rapor: { id: k.rapor_id, no: k.rapor_no ?? "" }, okumalar: [] };
  if ((!k.ekipman_id && !k.tur_id) || !k.satirlar.length) return hata("Kaydın ekipmanı seçilmedi.");
  const d = dagit(k.satirlar, k.mesaj), ad = new Map(k.satirlar.map((s) => [s.alan, s.ad]));
  /* yeni ekipman: kodu sunucu verir (tesiste sıradaki), plana eklenir; yeniden denemede ikinci kez eklenmesin diye kayda yazılır */
  let ekipmanId = k.ekipman_id, surum = k.surum;
  if (!ekipmanId) {
    const y = await sayEkipmanlarEkle(db, kim, p.id, [{ tur: k.tur_id, seri: (d.degerler["e:seri"] ?? "").slice(0, 30) || null, konum: (d.degerler["e:konum"] ?? "").slice(0, 60) || null }]);
    if (y.durum !== "tamam") return hata(y.durum === "red" ? y.neden : "Ekipman plana eklenemedi.");
    const yeni = y.eklenen[0];
    if (!yeni) return hata(y.eklenemeyen[0]?.neden ?? "Ekipman plana eklenemedi.");
    const g = await guncelle(db, KAYIT, k.id, surum, { ekipman_id: yeni.id }, { kim: kim.ad, ne: "say_rapor.ekipman", gerekce: `${p.no} · ${yeni.kod}` });
    if (g.durum !== "tamam") return hata("Kayıt bu arada değişti; yeniden deneyin.");
    ekipmanId = yeni.id; surum = g.surum;
  }
  const varOlan = p.raporlar.find((x) => x.ekipmanId === ekipmanId);
  if (varOlan && !varOlan.benimTaslak) return hata("Bu ekipmanın raporu sizin Yeni raporunuz değil.");
  const r = varOlan ? { durum: "tamam" as const, id: varOlan.id } : await raporOlustur(db, kim, p.id, ekipmanId);
  if (r.durum !== "tamam") return hata(r.durum === "red" ? r.neden : r.durum === "gecersiz" ? Object.values(r.hatalar)[0] ?? "Rapor açılamadı." : r.durum === "yetkisiz" ? "Rapor açma yetkiniz yok." : "Rapor açılamadı.");
  const bilgi = (await db.sorgu<{ format_id: string; no: string }>("SELECT format_id::text, no FROM rapor WHERE id = $1", [r.id])).rows[0];
  const ham = bilgi ? (await formatSurumuOku(db, bilgi.format_id))?.tanim ?? null : null;
  const tanim = ham ? sahaTanimi(ham) : null;
  const oku = async (f: RaporFoto) => {
    const x = await kayitDosyasi(db, DOSYA_SAY_CHAT, cihazId, f.dosya);
    return x ? { ad: f.ad, bayt: await depo.oku(x.anahtar, db) } : null;
  };
  const fotolar = (await Promise.all(k.fotolar.filter((f) => f.rol === "ekipman").map(oku))).filter((x): x is { ad: string; bayt: Uint8Array } => !!x);
  /* K2: etiket yalnız mesajda boş bilgi varsa ve formatın ekipman bilgileri fotoğraftan doldurulabiliyorsa */
  const okumalar: { bolum: string; ad: string; bayt: Uint8Array }[] = [];
  const etiket = k.fotolar.find((f) => f.rol === "etiket");
  if (etiket && k.satirlar.some((s) => s.alan !== "yorum" && !d.degerler[s.alan]) && tanim && okumaHedefleri(tanim).has("ekipman")) {
    const x = await oku(etiket);
    if (x) okumalar.push({ ...x, ad: "Etiket fotoğrafı.jpg", bolum: "ekipman" });
  }
  const doldu = await chatRaporuDoldur(db, depo, kim, firmaId, r.id, {
    degerler: Object.entries(d.degerler).map(([anahtar, deger]) => ({ anahtar, ad: ad.get(anahtar) ?? (anahtar === "yorum" ? "Not" : anahtar), deger })),
    fotolar, okumalar, yalnizBos: !!varOlan,
  });
  if (doldu.durum !== "tamam") return hata("Rapor açıldı ama mesaj yazılamadı; raporu açıp elle doldurun.");
  const son = await guncelle(db, KAYIT, k.id, surum, { rapor_id: r.id, rapor_no: bilgi?.no ?? null, fotolar: "[]" }, { kim: kim.ad, ne: "say_rapor.rapor_yazildi", gerekce: bilgi?.no ?? p.no });
  if (son.durum !== "tamam") return hata("Kayıt bu arada değişti; yeniden deneyin.");
  for (const f of k.fotolar) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_rapor.rapor_yazildi" });
  const yz = await yzHazirMi(db);
  const metin = [
    `Mesajdan ${doldu.yazilan} bilgi geldi${doldu.foto ? `, ${doldu.foto} fotoğraf rapora geçti` : ""}.`,
    doldu.dolu.length ? `Dolu olduğu için değişmeyen: ${doldu.dolu.join(", ")}.` : "",
    doldu.fotoBolumuYok ? "Formatta fotoğraf bölümü olmadığı için fotoğraflar eklenmedi." : "",
    doldu.atlanan.length ? `Biçime uymadığı için yazılmayan: ${doldu.atlanan.join(", ")}.` : "",
    doldu.okuma.length ? (yz ? "Etiket okundu: değerler boş alanlara girdi, emin olunmayan sarı." : "Etiket fotoğrafı rapora eklendi.") : "",
  ].filter(Boolean).join(" ");
  await raporOneriYaz(db, kim, r.id, "", "bilgi", { metin });
  return { kayit: cihazId, durum: "tamam", rapor: { id: r.id, no: bilgi?.no ?? "" }, okumalar: yz ? doldu.okuma : [] };
}
