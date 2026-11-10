/* ONAYLAR › DİĞER BELGELER — PROBATA SIGN İLE İMZA (2026-11-10, göç 0125; reisim: "1 ve 2 ve 4 5 i yap" — liste 2: "Onaylar › Diğer belgeler probata
   sign ile (zimmet, eğitim, bordro, araç tutanağı)"). Rapor imzasının yolu (raporlar/server/sign.ts) belgeye:
   1) belgeSignHazirla (işlem içinde): yalnız imzalayacak kişi, belge beklerken; sign'da açık istek varsa bağlantıları döner; yoksa gönderilen PDF +
      imzacı (oturumdaki kişi) + anahtar.
   2) signGonder (raporlar — işlem DIŞINDA, ağ): PDF sign'a, imza isteği (e-imza, 7 gün) → bağlantı + gömülü bağlantı.
   3) belgeSignKaydet (işlem içinde): sign kimlikleri + bağlantılar (şifreli — firmaya bağlı) belgeye.
   Tamamlanma: sign webhook'u (belgeSignBildirimi — raporlar signBildirim imza isteği bulamazsa buraya sorar) ya da pencere kapanınca ekranın sorusu
   (belgeSignSonuclandir): sign'dan imzalı PDF alınır, BUGÜNKÜ yükleme yolundan geçer (belgeImzaliYukle — taban, kriptografik imza, nitelikli); iş
   belgenin İMZACISININ hesabıyla (webhook'ta oturum yok; veritabanı kararı yalnız imzacıya yazdırır). Reddedildi / iptal / süresi doldu / denetimden
   geçmedi: belge bekler, sign durumu + nedeni yazılır; "İmzala" yeniden açılır, "PDF ile imzala" ve "Geri gönder" hep açık.
   Kilit tests/belge-onay.test.ts (gerçek PostgreSQL, sign taklit). */
import { coz, sifrele, sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { signIstemcisi, type SignIstemcisi } from "../../../server/dis/sign.ts";
import { baglantiMetni, baglantiOku, signAcik, type IslemCalistir, type SignHazirlik, type SignSonuc } from "../../raporlar/server/sign.ts";
import type { BelgeDurumu } from "../sema.ts";
import { BELGE_DOSYA, belgeImzaliYukle, KARAR_VAR, type BelgeYazma, type Kisi } from "./belgeler.ts";

const BELGE_SIGN = tablo({ ad: "belge_onay", sutunlar: ["sign_belge", "sign_istek", "sign_baglanti", "sign_durum", "sign_neden"] });
/** bağlantının şifreleme adı (firmaya + bu ada bağlı; raporun bağlantısıyla karışmaz) */
const BAGLANTI_AD = "belge_sign_baglanti";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BAGLI_DEGIL = "Bu firmada probata sign bağlı değil.";

interface Satir {
  id: string; surum: number; ad: string; durum: BelgeDurumu; dosya: string | null; personel_id: string;
  sign_belge: string | null; sign_istek: string | null; sign_baglanti: string | null; sign_durum: string | null; sign_neden: string | null;
}
const SUTUN = "id::text, surum, ad, durum, dosya::text, personel_id::text, sign_belge, sign_istek, sign_baglanti, sign_durum, sign_neden";

/** kendi belgesi (yoksa / başkasınınsa null — varlığı sızmaz) */
async function kendi(db: Sorgulayici, kim: Kisi, id: string): Promise<Satir | null> {
  if (!UUID.test(id)) return null;
  const p = await hesabinPersoneli(db, kim.id);
  if (!p) return null;
  return (await db.sorgu<Satir>(`SELECT ${SUTUN} FROM belge_onay WHERE id = $1 AND personel_id = $2`, [id, p])).rows[0] ?? null;
}
const acikIstek = (b: Satir) => !!b.sign_istek && !!b.sign_belge && (b.sign_durum ?? "bekliyor") === "bekliyor";

/** sign'daki rapor no alanı belgeyi tanıtır: belgenin adı + kimliğinin başı (aynı adlı iki belge sign'da karışmasın; en çok 80) */
export const belgeSignNo = (ad: string, id: string): string => `${ad.slice(0, 68)} · ${id.slice(0, 8)}`;

export type BelgeSignHazirlik =
  | { tur: "acik"; baglanti: string | null; gomulu: string | null }
  | { tur: "gonder"; h: Extract<SignHazirlik, { tur: "gonder" }> }
  | { tur: "hata"; y: BelgeYazma };

/** 1 · hazırla: yalnız imzalayacak kişi, belge beklerken */
export async function belgeSignHazirla(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string): Promise<BelgeSignHazirlik> {
  if (!(await signAcik(db))) return { tur: "hata", y: { durum: "red", neden: BAGLI_DEGIL } };
  const b = await kendi(db, kim, id);
  if (!b || !b.dosya) return { tur: "hata", y: { durum: "yok" } };
  if (b.durum !== "bekliyor") return { tur: "hata", y: { durum: "red", neden: KARAR_VAR[b.durum] } };
  let yenile = false;
  if (acikIstek(b)) {
    const l = baglantiOku(b.sign_baglanti ? coz(b.sign_baglanti, firmaId, BAGLANTI_AD) : null);
    if (l.baglanti || l.gomulu) return { tur: "acik", ...l };
    yenile = true;
  }
  const anahtar = await sirKullan(db, "sign_anahtari");
  if (!anahtar) return { tur: "hata", y: { durum: "red", neden: BAGLI_DEGIL } };
  const d = await kayitDosyasi(db, BELGE_DOSYA, id, b.dosya);
  if (!d) return { tur: "hata", y: { durum: "red", neden: "Gönderilen PDF bulunamadı." } };
  const pdf = await depo.oku(d.anahtar, db);
  const e = (await db.sorgu<{ eposta: string; ad: string }>("SELECT eposta, ad FROM hesap WHERE id = $1", [kim.id])).rows[0];
  if (!e?.eposta) return { tur: "hata", y: { durum: "red", neden: "Hesabınızda e-posta yok; probata sign imzacıyı e-postasıyla tanır." } };
  return { tur: "gonder", h: { tur: "gonder", istekId: b.id, istekSurum: b.surum, anahtar, pdf, ad: d.ad || `${b.ad}.pdf`, raporNo: belgeSignNo(b.ad, b.id),
    imzaci: { ad: kim.ad || e.ad, eposta: e.eposta }, oncekiBelge: b.sign_belge, ...(yenile ? { yenile } : {}) } };
}

/** 3 · kaydet: sign kimlikleri + bağlantılar (şifreli) bekleyen belgeye */
export async function belgeSignKaydet(db: Sorgulayici, kim: Kisi, firmaId: string, id: string,
  s: { belge: string; istek: string; baglanti: string | null; gomulu?: string | null }): Promise<boolean> {
  const b = await kendi(db, kim, id);
  if (!b || b.durum !== "bekliyor") return false;
  const metin = baglantiMetni(s.baglanti, s.gomulu ?? null);
  const g = await guncelle(db, BELGE_SIGN, id, b.surum, { sign_belge: s.belge, sign_istek: s.istek, sign_baglanti: metin ? sifrele(metin, firmaId, BAGLANTI_AD) : null,
    sign_durum: "bekliyor", sign_neden: null }, { kim: kim.ad, ne: "belge_onay.sign_istek", gerekce: b.ad });
  return g.durum === "tamam";
}

/** ekranın sorusu: kişinin bu belgesinde sign'a gönderilmiş, bekleyen istek var mı */
export async function belgeSignBekliyor(db: Sorgulayici, kim: Kisi, id: string): Promise<boolean> {
  const b = await kendi(db, kim, id);
  return !!b && b.durum === "bekliyor" && !!b.sign_belge;
}

async function durumYaz(db: Sorgulayici, id: string, durum: "reddedildi" | "iptal" | "hata", neden: string): Promise<void> {
  const b = (await db.sorgu<Satir>(`SELECT ${SUTUN} FROM belge_onay WHERE id = $1 AND durum = 'bekliyor'`, [id])).rows[0];
  if (!b) return;
  await guncelle(db, BELGE_SIGN, id, b.surum, { sign_durum: durum, sign_neden: neden.slice(0, 400) }, { kim: "probata sign", ne: `belge_onay.sign_${durum}`, gerekce: b.ad });
}

/** belgenin sign'daki durumuna göre sonuçlandır — imzacının hesabıyla (calistir: firmanın işlemi) */
export async function belgeSignSonuclandir(calistir: IslemCalistir, depo: Depo, firmaId: string, id: string,
  istemciKur: (anahtar: string) => SignIstemcisi = (a) => signIstemcisi(a)): Promise<SignSonuc> {
  const on = UUID.test(id) ? await calistir(null, async (db) => {
    const b = (await db.sorgu<Satir>(`SELECT ${SUTUN} FROM belge_onay WHERE id = $1`, [id])).rows[0];
    if (!b) return null;
    const h = (await db.sorgu<{ id: string; ad: string; roller: Kisi["roller"] }>(
      "SELECT id::text, ad, roller FROM hesap WHERE personel_id = $1 ORDER BY olustu LIMIT 1", [b.personel_id])).rows[0] ?? null;
    return { b, h, anahtar: await sirKullan(db, "sign_anahtari") };
  }) : null;
  if (!on || !on.b.sign_belge || !on.h) return { durum: "hata", neden: "Bekleyen imza isteği bulunamadı." };
  const { b, h } = on;
  if (b.durum !== "bekliyor") return { durum: "hata", neden: KARAR_VAR[b.durum] };
  if (!on.anahtar) return { durum: "hata", neden: BAGLI_DEGIL };
  const istemci = istemciKur(on.anahtar);
  const s = await istemci.belgeGetir(b.sign_belge!);
  const ist = s.imza_istegi && (!b.sign_istek || s.imza_istegi.id === b.sign_istek) ? s.imza_istegi : null;
  if (s.durum !== "tamamlandi") {
    const kapandi = ist && ["reddedildi", "iptal", "suresi_doldu"].includes(ist.durum) ? ist.durum : s.durum === "reddedildi" ? "reddedildi" : s.durum === "iptal" ? "iptal" : null;
    if (!kapandi) return { durum: "bekliyor" };
    const red = ist?.imzacilar.find((x) => x.red_nedeni)?.red_nedeni;
    const neden = kapandi === "reddedildi" ? `İmzacı reddetti${red ? `: ${red}` : ""}.`
      : kapandi === "suresi_doldu" ? "probata sign'daki imza isteğinin süresi doldu." : "probata sign'daki imza isteği iptal edildi.";
    await calistir(h.id, (db) => durumYaz(db, id, kapandi === "reddedildi" ? "reddedildi" : "iptal", neden));
    return { durum: "kapandi", neden };
  }
  const pdf = await istemci.pdfAl(b.sign_belge!);
  const kim: Kisi = { id: h.id, ad: h.ad, roller: h.roller };
  const y = await calistir(h.id, async (db) => {
    const g = (await db.sorgu<{ surum: number }>("SELECT surum FROM belge_onay WHERE id = $1", [id])).rows[0];
    return g ? belgeImzaliYukle(db, depo, kim, firmaId, id, g.surum, { ad: `${b.ad}-imzali.pdf`, bayt: pdf }) : ({ durum: "yok" } as BelgeYazma);
  });
  if (y.durum === "tamam") return { durum: "tamam", bildirim: y.bildirim };
  const neden = y.durum === "gecersiz" ? y.hatalar.dosya : y.durum === "red" ? y.neden : y.durum === "cakisma" ? "Belge bu arada değişti; yeniden deneyin." : "İmzalı PDF işlenemedi.";
  /* denetimden geçmeyen imza: neden belgeye yazılır (belge bekler) */
  if (y.durum !== "cakisma") await calistir(h.id, (db) => durumYaz(db, id, "hata", neden));
  return { durum: "hata", neden };
}

/** sign'ın bildirimi (raporlar signBildirim imza isteği bulamazsa): bu sign belgesini bekleyen belge varsa sonuçlandırır, yoksa null */
export async function belgeSignBildirimi(calistir: IslemCalistir, depo: Depo, firmaId: string, signBelge: string,
  istemciKur?: (anahtar: string) => SignIstemcisi): Promise<SignSonuc | null> {
  if (!UUID.test(signBelge)) return null;
  const id = await calistir(null, async (db) => (await db.sorgu<{ id: string }>(
    "SELECT id::text FROM belge_onay WHERE sign_belge = $1 AND durum = 'bekliyor' ORDER BY gonderildi DESC LIMIT 1", [signBelge])).rows[0]?.id ?? null);
  return id ? belgeSignSonuclandir(calistir, depo, firmaId, id, istemciKur) : null;
}
