/* YÖNETİM GİRİŞİ (348; KOD-GECIS Y1 "ayrı adres + iki adımlı giriş") — yalnız probata ekibi. Veri işlemleri yönetim rolünde (yonetimIcinde, 0050).
   · Birinci adım parola: doğruysa KISA ömürlü (10 dk) "parola" oturumu açılır; bu oturum yalnız ikinci adımı (ya da ilk kurulumu) açar.
   · İkinci adım doğrulama kodu (RFC 6238, src/server/yonetim/totp.ts): doğruysa yönetim oturumu (hareketsizlik 2 saat, mutlak 12 saat).
   · İlk giriş (durum "ilk", geçici parola): anahtar sunucuda üretilir, yalnız o parola oturumunda gösterilir (şifreli saklanır); kişi uygulamasına
     ekler, kodu ve YENİ parolasını yazar → anahtar yöneticiye taşınır, durum "etkin", bütün eski oturumları düşer.
   · Kilit: yönetici başına 5 hata (parola ya da kod, ortak sayaç) → 15 dk; aynı IP'den 5 hata → 15 dk. Kilitliyken denetlenmez bile. Sayaçlar
     yalnız TAM girişte sıfırlanır (parola adımı sıfırlamaz — kod kaba kuvvetle denenemez).
     Yanıt hesabın var olup olmadığını söylemez (tek ileti, eşit süre).
   · Belirteç 32 bayt rasgele; veritabanında yalnız SHA-256 özeti. Anahtar ana anahtarla şifreli, yöneticiye bağlı (başka satıra kopyalansa çözülmez).
   · Her adım yönetim izine (kim veritabanından damgalanır). */
import { createHash, randomBytes } from "node:crypto";
import { coz, sifrele } from "../ayar/sir.ts";
import { yonetimIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";
import { parolaDogru, parolaOzeti, sahteDenetim } from "../kimlik/parola.ts";
import { otpauthAdresi, totpDogrula, yeniAnahtar } from "./totp.ts";

export const Y_KILIT_ESIGI = 5;
export const Y_KILIT_DK = 15;
export const BEKLEYEN_DK = 10;
export const Y_HAREKETSIZ_DK = 120;
export const Y_MUTLAK_SAAT = 12;

const BELIRTEC = /^[A-Za-z0-9_-]{43}$/;
const ozet = (b: string) => createHash("sha256").update(b, "utf8").digest("hex");
const dk = (n: number) => n * 60_000;
/* şifreli anahtarın bağı: yönetici başına (ek doğrulama verisi — src/server/ayar/sir.ts) */
const BAG = "yonetim";
const sirAdi = (yoneticiId: string) => `totp:${yoneticiId}`;

export interface YoneticiOturumu { id: string; ad: string; eposta: string }
export type YGirisSonucu = { tamam: true; belirtec: string; sonraki: "kod" | "kurulum" } | { tamam: false; neden: "hatali" | "kilitli" };
export type YKodSonucu = { tamam: true; belirtec: string } | { tamam: false; neden: "hatali" | "kilitli" | "oturum" | "ayni" };

interface YSatir { id: string; eposta: string; ad: string; durum: "ilk" | "etkin" | "kapali"; parola_ozeti: string; totp_sir: string | null; totp_son: string; hatali_deneme: number; kilit_bitis: Date | null }

async function iz(db: Sorgulayici, kim: string, ne: string, ayrinti: Record<string, unknown> = {}) {
  await db.sorgu("INSERT INTO yonetim_izi (kim, ne, ayrinti) VALUES ($1, $2, $3)", [kim.slice(0, 254) || "bilinmiyor", ne, JSON.stringify(ayrinti)]);
}

/** hatalı deneme: IP sayacı + (varsa) yönetici sayacı; eşiği aşan kilitlenir. Dönen: kilit bitişi (kilitlendiyse) */
async function hataliDeneme(db: Sorgulayici, y: YSatir | undefined, ip: string, simdi: Date, ne: string): Promise<Date | null> {
  const kilit = new Date(simdi.getTime() + dk(Y_KILIT_DK));
  const ipSayi = (await db.sorgu<{ hatali_deneme: number }>(
    `INSERT INTO yonetim_kilit (ip, hatali_deneme, son) VALUES ($1, 1, $2)
     ON CONFLICT (ip) DO UPDATE SET hatali_deneme = CASE WHEN yonetim_kilit.kilit_bitis IS NOT NULL AND yonetim_kilit.kilit_bitis <= $2 THEN 1
       ELSE yonetim_kilit.hatali_deneme + 1 END, kilit_bitis = NULL, son = $2 RETURNING hatali_deneme`, [ip, simdi])).rows[0].hatali_deneme;
  let kilitlendi = false;
  if (ipSayi >= Y_KILIT_ESIGI) {
    await db.sorgu("UPDATE yonetim_kilit SET kilit_bitis = $2, hatali_deneme = 0 WHERE ip = $1", [ip, kilit]);
    await iz(db, y?.eposta ?? "bilinmiyor", "giris.ip_kilitlendi", { ip });
    kilitlendi = true;
  }
  if (y && y.durum !== "kapali") {
    const sayi = (y.kilit_bitis && y.kilit_bitis <= simdi ? 0 : y.hatali_deneme) + 1;
    await db.sorgu("UPDATE yonetici SET hatali_deneme = $2, kilit_bitis = $3 WHERE id = $1",
      [y.id, sayi >= Y_KILIT_ESIGI ? 0 : sayi, sayi >= Y_KILIT_ESIGI ? kilit : null]);
    if (sayi >= Y_KILIT_ESIGI) {
      /* kilitlenen yöneticinin bekleyen (parola) oturumları da düşer: kod denemesi kilitten sonra sürmez */
      await db.sorgu("DELETE FROM yonetim_oturum WHERE yonetici_id = $1 AND adim = 'parola'", [y.id]);
      await iz(db, y.eposta, "giris.hesap_kilitlendi", { ip, ne });
      kilitlendi = true;
    }
  }
  return kilitlendi ? kilit : null;
}

async function ipKilitli(db: Sorgulayici, ip: string, simdi: Date): Promise<boolean> {
  const r = (await db.sorgu<{ kilit_bitis: Date | null }>("SELECT kilit_bitis FROM yonetim_kilit WHERE ip = $1 FOR UPDATE", [ip])).rows[0];
  return !!r?.kilit_bitis && r.kilit_bitis > simdi;
}

const ipTemiz = (ip: string) => ip.slice(0, 64) || "bilinmiyor";

/** birinci adım: e-posta + parola → kısa ömürlü "parola" oturumu (yalnız kod / kurulum adımını açar) */
export async function yoneticiGiris(havuz: Havuz, g: { eposta: string; parola: string; ip: string; simdi?: Date }): Promise<YGirisSonucu> {
  const simdi = g.simdi ?? new Date();
  const eposta = g.eposta.trim().toLowerCase();
  const ip = ipTemiz(g.ip);
  return yonetimIcinde(havuz, async (db) => {
    await db.sorgu("DELETE FROM yonetim_oturum WHERE bitis <= $1", [simdi]);
    if (await ipKilitli(db, ip, simdi)) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli" }; }
    const y = (await db.sorgu<YSatir>(
      "SELECT id, eposta, ad, durum, parola_ozeti, totp_sir, totp_son::text, hatali_deneme, kilit_bitis FROM yonetici WHERE eposta = $1 FOR UPDATE", [eposta])).rows[0];
    if (y?.kilit_bitis && y.kilit_bitis > simdi) { await sahteDenetim(g.parola); return { tamam: false, neden: "kilitli" }; }
    const dogru = y && y.durum !== "kapali" ? await parolaDogru(g.parola, y.parola_ozeti) : (await sahteDenetim(g.parola), false);
    if (!dogru || !y) {
      const k = await hataliDeneme(db, y, ip, simdi, "parola");
      if (y) await iz(db, y.eposta, "giris.parola_hatali", { ip });
      return { tamam: false, neden: k ? "kilitli" : "hatali" };
    }
    /* hatalı deneme sayaçları (yönetici + IP) parola adımında SIFIRLANMAZ — yalnız tam girişte (kod / kurulum) sıfırlanır: parolayı bilen biri
       "doğru parola → 4 yanlış kod → doğru parola …" döngüsüyle kod denemesini sınırsız sürdüremez (347–348 incelemesi) */
    /* önceki yarım kalmış parola oturumları düşer (aynı anda tek bekleyen adım) */
    await db.sorgu("DELETE FROM yonetim_oturum WHERE yonetici_id = $1 AND adim = 'parola'", [y.id]);
    const belirtec = randomBytes(32).toString("base64url");
    await db.sorgu("INSERT INTO yonetim_oturum (ozet, yonetici_id, adim, olustu, son_kullanim, bitis, ip) VALUES ($1, $2, 'parola', $3, $3, $4, $5)",
      [ozet(belirtec), y.id, simdi, new Date(simdi.getTime() + dk(BEKLEYEN_DK)), ip]);
    await db.sorgu("SELECT set_config('app.yonetici_id', $1, true)", [y.id]);
    await iz(db, y.eposta, "giris.parola_dogru", { ip });
    return { tamam: true, belirtec, sonraki: y.durum === "ilk" ? "kurulum" : "kod" };
  });
}

interface Bekleyen { y: YSatir; kurulum_sir: string | null }

async function bekleyenOku(db: Sorgulayici, belirtec: string | undefined, simdi: Date, kilitle: boolean): Promise<Bekleyen | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  const r = (await db.sorgu<YSatir & { kurulum_sir: string | null; bitis: Date }>(
    `SELECT y.id, y.eposta, y.ad, y.durum, y.parola_ozeti, y.totp_sir, y.totp_son::text, y.hatali_deneme, y.kilit_bitis, o.kurulum_sir, o.bitis
     FROM yonetim_oturum o JOIN yonetici y ON y.id = o.yonetici_id WHERE o.ozet = $1 AND o.adim = 'parola'${kilitle ? " FOR UPDATE OF o, y" : ""}`,
    [ozet(belirtec)])).rows[0];
  if (!r) return null;
  if (r.bitis <= simdi || r.durum === "kapali") { await db.sorgu("DELETE FROM yonetim_oturum WHERE ozet = $1", [ozet(belirtec)]); return null; }
  const { kurulum_sir, ...y } = r;
  return { y, kurulum_sir };
}

/** bekleyen (parola) oturumun yöneticisi — kod / kurulum sayfası hangisini çizecek */
export async function bekleyenOturum(havuz: Havuz, belirtec: string | undefined, simdi = new Date()): Promise<{ eposta: string; durum: "ilk" | "etkin" } | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  return yonetimIcinde(havuz, async (db) => {
    const b = await bekleyenOku(db, belirtec, simdi, false);
    return b && b.y.durum !== "kapali" ? { eposta: b.y.eposta, durum: b.y.durum } : null;
  });
}

async function tamOturumAc(db: Sorgulayici, y: YSatir, ip: string, simdi: Date): Promise<string> {
  const belirtec = randomBytes(32).toString("base64url");
  await db.sorgu("INSERT INTO yonetim_oturum (ozet, yonetici_id, adim, olustu, son_kullanim, bitis, ip) VALUES ($1, $2, 'tamam', $3, $3, $4, $5)",
    [ozet(belirtec), y.id, simdi, new Date(simdi.getTime() + Y_MUTLAK_SAAT * 3_600_000), ip]);
  return belirtec;
}

/** ikinci adım: doğrulama kodu → yönetim oturumu (bekleyen parola oturumu silinir) */
export async function kodDogrula(havuz: Havuz, g: { belirtec: string | undefined; kod: string; ip: string; simdi?: Date }): Promise<YKodSonucu> {
  const simdi = g.simdi ?? new Date();
  const ip = ipTemiz(g.ip);
  return yonetimIcinde(havuz, async (db) => {
    const b = await bekleyenOku(db, g.belirtec, simdi, true);
    const sir = b?.y.totp_sir;
    if (!b || b.y.durum !== "etkin" || !sir) return { tamam: false, neden: "oturum" };
    const { y } = b;
    if ((y.kilit_bitis && y.kilit_bitis > simdi) || (await ipKilitli(db, ip, simdi))) return { tamam: false, neden: "kilitli" };
    const adim = totpDogrula(coz(sir, BAG, sirAdi(y.id)), g.kod, simdi, Number(y.totp_son));
    if (adim === null) {
      const k = await hataliDeneme(db, y, ip, simdi, "kod");
      await iz(db, y.eposta, "giris.kod_hatali", { ip });
      return { tamam: false, neden: k ? "kilitli" : "hatali" };
    }
    await db.sorgu("UPDATE yonetici SET totp_son = $2, hatali_deneme = 0, kilit_bitis = NULL WHERE id = $1", [y.id, adim]);
    await db.sorgu("DELETE FROM yonetim_oturum WHERE ozet = $1", [ozet(g.belirtec!)]);
    await db.sorgu("DELETE FROM yonetim_kilit WHERE ip = $1", [ip]);
    const belirtec = await tamOturumAc(db, y, ip, simdi);
    await db.sorgu("SELECT set_config('app.yonetici_id', $1, true)", [y.id]);
    await iz(db, y.eposta, "giris.yapildi", { ip });
    return { tamam: true, belirtec };
  });
}

/** ilk kurulum: bekleyen oturumda anahtarı üretir (bir kez; şifreli saklar) ve gösterilecek bilgiyi döndürür. Yalnız durum "ilk". */
export async function kurulumBilgisi(havuz: Havuz, belirtec: string | undefined, simdi = new Date()): Promise<{ anahtar: string; adres: string; eposta: string } | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  return yonetimIcinde(havuz, async (db) => {
    const b = await bekleyenOku(db, belirtec, simdi, true);
    if (!b || b.y.durum !== "ilk") return null;
    let anahtar: string;
    if (b.kurulum_sir) anahtar = coz(b.kurulum_sir, BAG, sirAdi(b.y.id));
    else {
      anahtar = yeniAnahtar();
      await db.sorgu("UPDATE yonetim_oturum SET kurulum_sir = $2 WHERE ozet = $1", [ozet(belirtec), sifrele(anahtar, BAG, sirAdi(b.y.id))]);
    }
    return { anahtar, adres: otpauthAdresi(anahtar, b.y.eposta), eposta: b.y.eposta };
  });
}

/** ilk kurulumu tamamlar: kod (gösterilen anahtardan) + yeni parola → anahtar yöneticiye, durum "etkin", eski oturumlar düşer, yönetim oturumu */
export async function kurulumTamamla(havuz: Havuz, g: { belirtec: string | undefined; kod: string; yeni: string; ip: string; simdi?: Date }): Promise<YKodSonucu> {
  const simdi = g.simdi ?? new Date();
  const ip = ipTemiz(g.ip);
  const yeniOzet = await parolaOzeti(g.yeni);
  return yonetimIcinde(havuz, async (db) => {
    const b = await bekleyenOku(db, g.belirtec, simdi, true);
    if (!b || b.y.durum !== "ilk" || !b.kurulum_sir) return { tamam: false, neden: "oturum" };
    const { y } = b;
    if ((y.kilit_bitis && y.kilit_bitis > simdi) || (await ipKilitli(db, ip, simdi))) return { tamam: false, neden: "kilitli" };
    const anahtar = coz(b.kurulum_sir, BAG, sirAdi(y.id));
    const adim = totpDogrula(anahtar, g.kod, simdi, Number(y.totp_son));
    if (adim === null) {
      const k = await hataliDeneme(db, y, ip, simdi, "kurulum");
      await iz(db, y.eposta, "giris.kod_hatali", { ip, kurulum: true });
      return { tamam: false, neden: k ? "kilitli" : "hatali" };
    }
    if (await parolaDogru(g.yeni, y.parola_ozeti)) return { tamam: false, neden: "ayni" };
    await db.sorgu("UPDATE yonetici SET parola_ozeti = $2, totp_sir = $3, totp_son = $4, durum = 'etkin', hatali_deneme = 0, kilit_bitis = NULL WHERE id = $1",
      [y.id, yeniOzet, sifrele(anahtar, BAG, sirAdi(y.id)), adim]);
    await db.sorgu("DELETE FROM yonetim_oturum WHERE yonetici_id = $1", [y.id]);
    await db.sorgu("DELETE FROM yonetim_kilit WHERE ip = $1", [ip]);
    const belirtec = await tamOturumAc(db, y, ip, simdi);
    await db.sorgu("SELECT set_config('app.yonetici_id', $1, true)", [y.id]);
    await iz(db, y.eposta, "giris.kuruldu", { ip });
    return { tamam: true, belirtec };
  });
}

/** çerezdeki belirteçten yönetim oturumu (yalnız "tamam" adımı, etkin yönetici); süresi dolan silinir */
export async function yonetimOturumOku(havuz: Havuz, belirtec: string | undefined, simdi = new Date()): Promise<YoneticiOturumu | null> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return null;
  const oz = ozet(belirtec);
  return yonetimIcinde(havuz, async (db) => {
    const r = (await db.sorgu<{ id: string; ad: string; eposta: string; durum: string; son_kullanim: Date; bitis: Date }>(
      `SELECT y.id, y.ad, y.eposta, y.durum, o.son_kullanim, o.bitis FROM yonetim_oturum o JOIN yonetici y ON y.id = o.yonetici_id
       WHERE o.ozet = $1 AND o.adim = 'tamam'`, [oz])).rows[0];
    if (!r) return null;
    if (r.bitis <= simdi || simdi.getTime() - r.son_kullanim.getTime() > dk(Y_HAREKETSIZ_DK) || r.durum !== "etkin") {
      await db.sorgu("DELETE FROM yonetim_oturum WHERE ozet = $1", [oz]);
      return null;
    }
    if (simdi.getTime() - r.son_kullanim.getTime() > 60_000) await db.sorgu("UPDATE yonetim_oturum SET son_kullanim = $2 WHERE ozet = $1", [oz, simdi]);
    return { id: r.id, ad: r.ad, eposta: r.eposta };
  });
}

/** çıkış (ya da bekleyen adımdan vazgeç): o belirtecin oturumu silinir */
export async function yonetimCikis(havuz: Havuz, belirtec: string | undefined): Promise<void> {
  if (!belirtec || !BELIRTEC.test(belirtec)) return;
  await yonetimIcinde(havuz, async (db) => {
    const r = (await db.sorgu<{ eposta: string; id: string }>(
      "DELETE FROM yonetim_oturum o USING yonetici y WHERE o.ozet = $1 AND y.id = o.yonetici_id RETURNING y.eposta, y.id", [ozet(belirtec)])).rows[0];
    if (r) { await db.sorgu("SELECT set_config('app.yonetici_id', $1, true)", [r.id]); await iz(db, r.eposta, "giris.cikis"); }
  });
}
