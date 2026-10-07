/* MÜŞTERİ GİRİŞİ YÖNETİMİ (modül 3 → müşteri paneli 17; 0030; maket musteriler.html "Müşteri girişi" — karar 33 ana giriş müşterinin e-postasıyla,
   44 ek girişler bütün ya da seçili tesisler; L5 parola personel isteyince verilir). Müşteri kartında: ANA giriş (kullanıcı adı müşterinin
   e-postası, bütün tesisler) ve kişiye özel EK girişler. Geçici parola YALNIZ BİR KEZ döner (veritabanında özeti; ize yazılmaz); müşteri ilk
   girişte değiştirebilir. E-postayla gönderim bildirim altyapısıyla gelir (anayasa 1.3 — kurulmadı); şimdilik personel kişiye iletir.
   Yetki her işlevde sunucuda: Müşteriler "yaz" düzeyi (müşteriyi değiştirebilen). Pasif müşterinin girişi açılmaz, parola verilmez. Kullanıcı
   adı firmada tek (personel hesabıyla da çakışmaz — veritabanı tetiği). Parola / durum / e-posta / kapsam değişince açık oturumlar düşer (tetik).
   367 (§9 elli üçüncü tur): müşterinin panele HİÇ girmediği ek giriş yalnız yöneticiye (kayit_sil, modül 3) kesin silinir (göç 0062); ana giriş ve
   girilmiş giriş silinmez — pasife alınır. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { canDoEylem, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { geciciParolaUret } from "../../../server/kimlik/hesapYonetimi.ts";
import { parolaOzeti } from "../../../server/kimlik/parola.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { EkGirisGirdisi } from "../sema.ts";
import { musteriDegistirir, type Kisi } from "./musteriler.ts";

const HESAP = tablo({ ad: "musteri_hesap", sutunlar: ["musteri_id", "ana", "eposta", "ad", "tesisler", "parola_ozeti", "durum", "parola_verildi"], gizli: ["parola_ozeti"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CAKISMA = "Bu e-posta firmada başka bir girişin (personel ya da müşteri) kullanıcı adı ya da başka bir müşterinin e-postası.";

export type GirisDurumu = "hazir" | "ilk" | "etkin" | "pasif";
export interface MusteriGirisi {
  id: string; surum: number; ana: boolean; ad: string; eposta: string; tesisler: string[] | null; durum: GirisDurumu;
  sonGiris: string | null; parolaVerildi: string | null;
}
export interface GirisBilgisi {
  /** müşterinin e-postası (ana girişin kullanıcı adı); yoksa ana giriş açılamaz */
  eposta: string | null; pasif: boolean;
  ana: MusteriGirisi | null; ekler: MusteriGirisi[];
  /** ek giriş kapsamı için müşterinin etkin tesisleri */
  tesisler: { id: string; ad: string }[];
  yaz: boolean;
  /** 367: hiç girilmemiş ek girişi silebilir (yönetici) */
  sil: boolean;
}
export type GirisYazma =
  | { durum: "tamam"; id: string; parola?: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "red"; neden: string }
  | { durum: "yetkisiz" } | { durum: "yok" } | { durum: "cakisma" };

interface Satir { id: string; surum: number; ana: boolean; ad: string; eposta: string; tesisler: string[] | null; durum: GirisDurumu; son_giris: Date | null; parola_verildi: Date | null }
const girisOf = (x: Satir): MusteriGirisi => ({
  id: x.id, surum: x.surum, ana: x.ana, ad: x.ad, eposta: x.eposta, tesisler: x.tesisler, durum: x.durum,
  sonGiris: x.son_giris?.toISOString() ?? null, parolaVerildi: x.parola_verildi?.toISOString() ?? null,
});
const SEC = "SELECT id::text, surum, ana, ad, eposta, tesisler::text[] AS tesisler, durum, son_giris, parola_verildi FROM musteri_hesap";

async function musteriOku(db: Sorgulayici, id: string) {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<{ id: string; kisa: string; ilgili: string | null; eposta: string | null; pasif: string | null }>(
    "SELECT id::text, kisa, ilgili, eposta, pasif FROM musteri WHERE id = $1 FOR UPDATE", [id])).rows[0] ?? null;
}
/** kullanıcı adı başka bir girişte ya da başka bir müşterinin kayıtlı e-postası olarak var mı (veritabanı da ister — 0033; burada alanın
    altında söylenir). haric: denetlenen girişin kendisi; anaMusteri: ana girişse müşterisi (kendi e-postası kullanıcı adıdır) */
async function epostaDolu(db: Sorgulayici, eposta: string, haric: string | null, anaMusteri: string | null): Promise<boolean> {
  const r = await db.sorgu(`SELECT 1 FROM hesap WHERE eposta = $1 UNION ALL SELECT 1 FROM musteri_hesap WHERE eposta = $1 AND id IS DISTINCT FROM $2::uuid
    UNION ALL SELECT 1 FROM musteri WHERE eposta = $1 AND id IS DISTINCT FROM $3::uuid`, [eposta, haric, anaMusteri]);
  return (r.rowCount ?? 0) > 0;
}

/** müşteri kartının "Müşteri girişi" bölümü; Müşteriler'i göremeyene null */
export async function girisBilgisi(db: Sorgulayici, kim: Kisi, musteriId: string): Promise<GirisBilgisi | null> {
  if (!UUID.test(musteriId)) return null;
  const m = (await db.sorgu<{ eposta: string | null; pasif: string | null }>("SELECT eposta, pasif FROM musteri WHERE id = $1", [musteriId])).rows[0];
  if (!m) return null;
  const l = (await db.sorgu<Satir>(`${SEC} WHERE musteri_id = $1 ORDER BY ana DESC, ad`, [musteriId])).rows.map(girisOf);
  const t = (await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM tesis WHERE musteri_id = $1 AND pasif IS NULL ORDER BY ad", [musteriId])).rows;
  return { eposta: m.eposta, pasif: !!m.pasif, ana: l.find((x) => x.ana) ?? null, ekler: l.filter((x) => !x.ana), tesisler: t, yaz: musteriDegistirir(kim), sil: silebilir(kim) };
}

const iz = (kim: Kisi, ne: string, gerekce?: string): Iz => ({ kim: kim.ad, ne, gerekce });
const silebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: 3 });
async function yeniParola(): Promise<{ parola: string; ozet: string }> { const parola = geciciParolaUret(); return { parola, ozet: await parolaOzeti(parola) }; }

/** ANA giriş için geçici parola: giriş yoksa müşterinin e-postasıyla açılır, varsa yeni parola verilir (eski parola ve oturumlar düşer) */
export async function anaGeciciParola(db: Sorgulayici, kim: Kisi, musteriId: string): Promise<GirisYazma> {
  if (!musteriDegistirir(kim)) return { durum: "yetkisiz" };
  const m = await musteriOku(db, musteriId);
  if (!m) return { durum: "yok" };
  if (m.pasif) return { durum: "red", neden: "Müşteri pasif; giriş açılmaz." };
  if (!m.eposta) return { durum: "red", neden: "Müşterinin e-postası yok; ana giriş e-postayla açılır. Önce e-postayı yazın." };
  const ana = (await db.sorgu<Satir>(`${SEC} WHERE musteri_id = $1 AND ana`, [musteriId])).rows[0];
  if (await epostaDolu(db, m.eposta, ana?.id ?? null, musteriId)) return { durum: "red", neden: CAKISMA };
  const p = await yeniParola(), verildi = new Date().toISOString();
  if (!ana) {
    const r = await ekle(db, HESAP, { musteri_id: musteriId, ana: true, eposta: m.eposta, ad: m.ilgili ?? m.kisa, parola_ozeti: p.ozet, durum: "ilk", parola_verildi: verildi },
      iz(kim, "musteri_giris.ac", m.eposta));
    return { durum: "tamam", id: r.id, parola: p.parola };
  }
  const r = await guncelle(db, HESAP, ana.id, ana.surum, { eposta: m.eposta, parola_ozeti: p.ozet, durum: "ilk", parola_verildi: verildi },
    iz(kim, "musteri_giris.gecici_parola", m.eposta));
  if (r.durum === "cakisma") return { durum: "cakisma" };
  if (r.durum === "yok") return { durum: "yok" };
  return { durum: "tamam", id: ana.id, parola: p.parola };
}

/** EK giriş ekle (parolasız açılır; "Geçici parola" ile verilir): ad, e-posta, bütün ya da seçili tesisler (müşterinin kendi etkin tesisleri) */
export async function ekGirisEkle(db: Sorgulayici, kim: Kisi, musteriId: string, girdi: unknown): Promise<GirisYazma> {
  if (!musteriDegistirir(kim)) return { durum: "yetkisiz" };
  const m = await musteriOku(db, musteriId);
  if (!m) return { durum: "yok" };
  if (m.pasif) return { durum: "red", neden: "Müşteri pasif; giriş açılmaz." };
  const g = dogrula(EkGirisGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  if (v.tesisler !== null) {
    const t = (await db.sorgu<{ id: string }>("SELECT id::text FROM tesis WHERE musteri_id = $1 AND pasif IS NULL AND id = ANY ($2::uuid[])", [musteriId, v.tesisler])).rows;
    if (t.length !== v.tesisler.length) return { durum: "gecersiz", hatalar: { tesisler: "Yalnız bu müşterinin etkin tesisleri seçilebilir." } };
  }
  if (await epostaDolu(db, v.eposta, null, null)) return { durum: "gecersiz", hatalar: { eposta: CAKISMA } };
  const r = await ekle(db, HESAP, { musteri_id: musteriId, ana: false, eposta: v.eposta, ad: v.ad, tesisler: v.tesisler, durum: "hazir" }, iz(kim, "musteri_giris.ek_ekle", v.eposta));
  return { durum: "tamam", id: r.id };
}

async function girisOku(db: Sorgulayici, id: string) {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<Satir & { musteri_id: string; musteri_pasif: string | null }>(
    `SELECT h.id::text, h.surum, h.ana, h.ad, h.eposta, h.tesisler::text[] AS tesisler, h.durum, h.son_giris, h.parola_verildi, h.musteri_id::text, m.pasif AS musteri_pasif
     FROM musteri_hesap h JOIN musteri m ON m.id = h.musteri_id WHERE h.id = $1`, [id])).rows[0] ?? null;
}
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;

/** EK giriş için geçici parola (pasif girişe verilmez — önce etkinleştirilir) */
export async function ekGeciciParola(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<GirisYazma> {
  if (!musteriDegistirir(kim)) return { durum: "yetkisiz" };
  const h = await girisOku(db, id);
  if (!h || h.ana) return { durum: "yok" };
  if (h.musteri_pasif) return { durum: "red", neden: "Müşteri pasif; giriş açılmaz." };
  if (h.durum === "pasif") return { durum: "red", neden: "Giriş pasif; önce etkinleştirin." };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const p = await yeniParola();
  const r = await guncelle(db, HESAP, id, surum, { parola_ozeti: p.ozet, durum: "ilk", parola_verildi: new Date().toISOString() }, iz(kim, "musteri_giris.gecici_parola", h.eposta));
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, parola: p.parola };
}

/** girişi pasif yap (açık oturumlar düşer) ya da yeniden etkinleştir (parolasız döner — geçici parola yeniden verilir) */
export async function girisPasif(db: Sorgulayici, kim: Kisi, id: string, surum: number, pasif: boolean): Promise<GirisYazma> {
  if (!musteriDegistirir(kim)) return { durum: "yetkisiz" };
  const h = await girisOku(db, id);
  if (!h) return { durum: "yok" };
  if (!pasif && h.musteri_pasif) return { durum: "red", neden: "Müşteri pasif; önce müşteriyi yeniden etkinleştirin." };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, HESAP, id, surum, pasif ? { durum: "pasif" } : { durum: "hazir", parola_ozeti: null, parola_verildi: null },
    iz(kim, pasif ? "musteri_giris.pasif" : "musteri_giris.etkinlestir", h.eposta));
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** müşterinin e-postası değişince ana girişin kullanıcı adı onunla gider (parola ve oturumlar düşer — yeni adrese yeni parola); e-posta
    silinince ana giriş pasif olur. Müşteri kaydının işleminde çağrılır (musteriKaydet); yetki orada. */
export async function anaGirisEpostasi(db: Sorgulayici, kim: Kisi, musteriId: string, eposta: string | null): Promise<"tamam" | "cakisma"> {
  const ana = (await db.sorgu<Satir>(`${SEC} WHERE musteri_id = $1 AND ana FOR UPDATE`, [musteriId])).rows[0];
  if (!ana || ana.eposta === eposta) return "tamam";
  if (eposta && (await epostaDolu(db, eposta, ana.id, musteriId))) return "cakisma";
  const r = await guncelle(db, HESAP, ana.id, ana.surum, eposta ? { eposta, parola_ozeti: null, durum: "hazir", parola_verildi: null } : { durum: "pasif" },
    iz(kim, "musteri_giris.eposta", eposta ?? "e-posta silindi"));
  return r.durum === "tamam" || r.durum === "degisiklik_yok" ? "tamam" : "cakisma";
}

/** müşteri kaydı e-postayı değiştirmeden önce: ana girişin durumu (satır kilitlenir — aynı işlemde parola / pasif yarışı olmasın); yoksa null */
export async function anaGirisDurumu(db: Sorgulayici, musteriId: string): Promise<GirisDurumu | null> {
  return (await db.sorgu<{ durum: GirisDurumu }>("SELECT durum FROM musteri_hesap WHERE musteri_id = $1 AND ana FOR UPDATE", [musteriId])).rows[0]?.durum ?? null;
}

/** 367 — kesin sil: yalnız yönetici; yalnız müşterinin panele hiç girmediği ek giriş (karar veritabanında, 0062) */
export async function girisSil(db: Sorgulayici, kim: Kisi, id: string): Promise<GirisYazma> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "musteri_hesap", id, kim.ad);
  if (r.durum === "kullanildi") {
    return { durum: "red", neden: r.kullanim.ana ? "Ana giriş silinmez; müşterinin e-postasına bağlı. Pasife alın." : "Müşteri bu girişle panele girdi; silinmez. Pasife alın." };
  }
  return r.durum === "tamam" ? { durum: "tamam", id } : { durum: "yok" };
}
