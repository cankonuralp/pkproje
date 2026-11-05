/* YEDEKTEN GERİ YÜKLEME (2026-11-04; reisim: "tamam koda başla" — maket claude.ai THfrK3AzKkg9S7DiRVKKF4 "Yedekten geri yükle", sunum K1 yalnız
   Yönetim, K3 aynı firmanın üstüne + önce şu anki hâl kopyalanır, K4 geçici parola e-postası). Akış:
   · deneme — kaynaktan hâl kurulur (hal.ts), canlıyla birincil anahtar başına karşılaştırılır: tablo başına yedekte / şu an / gelecek / gidecek;
     HİÇBİR ŞEY YAZILMAZ.
   · geriYukle — (1) şu anki hâlin tam kopyası probata arşivine ("once", 30 gün — "Geri dön" ondan kurar); (2) TEK veritabanı işleminde
     yedek_geri_yukle (göç 0119: yarıda kalmaz); parolası olmayan hesaplara geçici parola + e-posta; yılın arşiv tam kopyası yenilenir, Drive'a yeni
     tam kopya gider (bağlantının tam_kopya'sı boşaltılır — sonraki yedek koşusu); (3) yedekte olup şu an olmayan dosyaların içeriği Drive'dan
     depoya (gönderilmiş olanlar; süre yettiğince).
   · geriDon — kayıtlı "once" kopyasından aynı akış.
   Var olan hesapların parolası korunur (yedekte parola yok — göç 0119). Yalnız Yönetim çağırır (modules/yonetim/server/yedek.ts). */
import type { Havuz, Sorgulayici } from "../db/kiraci.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import type { Depo } from "../dosya/depo.ts";
import { epostaKuyruga } from "../eposta/eposta.ts";
import { firmaGonderimi } from "../eposta/firma.ts";
import { bekleyenleriGonder } from "../eposta/gonder.ts";
import { geciciParolaUret } from "../kimlik/hesapYonetimi.ts";
import { parolaOzeti } from "../kimlik/parola.ts";
import type { BulutHizmeti } from "../dis/bulut.ts";
import { arsivSil, arsivYaz } from "./arsiv.ts";
import { anahtar, arsivdenHal, birincilAnahtarlar, driveErisimi, drivedenHal, drivedenIndir, HalHatasi, oncedenHal, type HalKaynagi, type YedekHali } from "./hal.ts";
import { YEDEK_TABLOLARI } from "./tablolar.ts";
import { tamKopya } from "./veri.ts";
import { donemi } from "./yol.ts";

type HizmetBul = (s: "gdrive" | "onedrive") => BulutHizmeti | null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface TabloFarki { tablo: string; yedekte: number; simdi: number; gelecek: number; gidecek: number }
export interface GeriYuklemeDenemesi {
  kaynak: HalKaynagi; an: string; dosyalar: string[];
  tablolar: TabloFarki[];
  toplam: { yedekte: number; simdi: number; gelecek: number; gidecek: number };
  /** yedekte olup şu an olmayan dosya kayıtları: Drive'dan gelecek / hiç gönderilmemiş (gelemez) */
  dosya: { gelecek: number; gelemez: string[] };
}
export interface GeriYuklemeSonucu {
  id: string; kaynak: HalKaynagi; an: string; kayit: number; tablo: number;
  parola: number; dosya: { getirilen: number; eksik: string[] }; once: string;
}

/** hâl, kaynağa göre */
export async function kaynakHali(h: Havuz, firmaId: string, depo: Depo, s: { kaynak: HalKaynagi; donem?: string; hizmetBul: HizmetBul; simdi?: Date }): Promise<YedekHali> {
  const simdi = s.simdi ?? new Date();
  if (s.kaynak === "once") {
    if (!s.donem || !/^\d{8}T\d{6}$/.test(s.donem)) throw new HalHatasi("önceki hâlin kopyası belirtilmedi");
    return oncedenHal(h, firmaId, depo, s.donem);
  }
  if (s.kaynak === "drive") {
    const d = await driveErisimi(h, firmaId, s.hizmetBul);
    if (!d) throw new HalHatasi("Drive bağlı değil");
    return drivedenHal(h, firmaId, d, simdi);
  }
  return arsivdenHal(h, firmaId, depo, simdi);
}

/** canlı birincil anahtarlar (tablo başına) — hâlin anahtarıyla aynı biçim */
async function canliAnahtarlar(db: Sorgulayici, pk: Record<string, string[]>): Promise<Record<string, Set<string>>> {
  const o: Record<string, Set<string>> = {};
  for (const t of Object.keys(YEDEK_TABLOLARI)) {
    const p = pk[t];
    if (!p?.length || !/^[a-z_]{1,40}$/.test(t) || p.some((k) => !/^[a-z_]{1,40}$/.test(k))) throw new HalHatasi(`${t}: birincil anahtar bilinmiyor`);
    const ifade = p.map((k) => `coalesce(${k}::text, '')`).join(" || '|' || ");
    o[t] = new Set((await db.sorgu<{ k: string }>(`SELECT ${ifade} AS k FROM ${t}`)).rows.map((x) => x.k));
  }
  return o;
}

/** dosya kaydı → Drive'daki yeri (gönderilmiş olanlar) */
async function driveYerleri(db: Sorgulayici, idler: readonly string[]): Promise<Map<string, { yol: string[]; ad: string }>> {
  if (!idler.length) return new Map();
  return new Map((await db.sorgu<{ d: string; yol: string[]; ad: string }>(
    "SELECT dosya_id::text AS d, yol, ad FROM bulut_kuyruk WHERE durum = 'gonderildi' AND dosya_id = ANY ($1::uuid[])", [idler])).rows.map((x) => [x.d, { yol: x.yol, ad: x.ad }]));
}

export async function geriYuklemeDenemesi(h: Havuz, firmaId: string, depo: Depo,
  s: { kaynak: HalKaynagi; donem?: string; hizmetBul: HizmetBul; simdi?: Date }): Promise<GeriYuklemeDenemesi> {
  const hal = await kaynakHali(h, firmaId, depo, s);
  return kiraciIcinde(h, firmaId, async (db) => {
    const pk = await birincilAnahtarlar(db);
    const canli = await canliAnahtarlar(db, pk);
    const tablolar: TabloFarki[] = [];
    let yeniDosya: string[] = [];
    for (const t of Object.keys(YEDEK_TABLOLARI).sort()) {
      const y = new Set((hal.tablolar[t] ?? []).map((r) => anahtar(r, pk[t]!))), c = canli[t]!;
      let gelecek = 0, gidecek = 0;
      for (const k of y) if (!c.has(k)) gelecek++;
      for (const k of c) if (!y.has(k)) gidecek++;
      tablolar.push({ tablo: t, yedekte: y.size, simdi: c.size, gelecek, gidecek });
      if (t === "dosya") yeniDosya = (hal.tablolar.dosya ?? []).map((r) => String(r.id)).filter((id) => UUID.test(id) && !c.has(id));
    }
    const yer = await driveYerleri(db, yeniDosya);
    const ad = new Map((hal.tablolar.dosya ?? []).map((r) => [String(r.id), String(r.ad ?? r.id)]));
    const top = tablolar.reduce((a, x) => ({ yedekte: a.yedekte + x.yedekte, simdi: a.simdi + x.simdi, gelecek: a.gelecek + x.gelecek, gidecek: a.gidecek + x.gidecek }),
      { yedekte: 0, simdi: 0, gelecek: 0, gidecek: 0 });
    return {
      kaynak: hal.kaynak, an: hal.an.toISOString(), dosyalar: hal.dosyalar, tablolar, toplam: top,
      dosya: { gelecek: yeniDosya.filter((d) => yer.has(d)).length, gelemez: yeniDosya.filter((d) => !yer.has(d)).map((d) => ad.get(d) ?? d).slice(0, 50) },
    };
  });
}

/** önceki hâl kopyasının dönemi: İstanbul YYYYAAGG"T"SSDDss */
/** önceki hâlin dönemi: aynı saniyede ikinci geri yükleme (ya da geri dönüş) kaydı çakıştırmasın — 2026-11-05 CI 42095671885 — boş saniyeye kayar */
async function bosOnceDonemi(db: Sorgulayici, t: Date): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const d = onceDonemi(new Date(t.getTime() + i * 1000));
    if (!(await db.sorgu("SELECT 1 FROM yedek_arsiv WHERE tur = 'once' AND donem = $1", [d])).rowCount) return d;
  }
  return onceDonemi(new Date(t.getTime() + 60_000));
}
export function onceDonemi(t: Date): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(t).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

function firmaAdresi(kisaAd: string): string {
  const a = process.env.PROBATA_ANA_ALAN || "localhost";
  return `${a === "localhost" || a.endsWith(".localhost") ? "http" : "https"}://${kisaAd}.${a}`;
}

export async function geriYukle(h: Havuz, firmaId: string, depo: Depo,
  s: { kaynak: HalKaynagi; donem?: string; kim: string; hizmetBul: HizmetBul; simdi?: Date; sure?: number }): Promise<GeriYuklemeSonucu> {
  const bas = Date.now(), simdi = s.simdi ?? new Date(), sure = s.sure ?? 200_000;
  const hal = await kaynakHali(h, firmaId, depo, s);
  /* 1 · şu anki hâl */
  const { onceId, canliDosya, once } = await kiraciIcinde(h, firmaId, async (db) => {
    const once = await bosOnceDonemi(db, new Date());
    return { once, onceId: await arsivYaz(db, depo, "once", once, (await tamKopya(db, new Date())).bayt),
      canliDosya: new Set((await db.sorgu<{ id: string }>("SELECT id::text FROM dosya")).rows.map((x) => x.id)) };
  });
  /* 2 · tek işlemde geri yükleme */
  const r = await kiraciIcinde(h, firmaId, async (db) => {
    const id = (await db.sorgu<{ id: string }>(
      "INSERT INTO yedek_geri_yukleme (kim, kaynak, yedek_ani, once_arsiv) VALUES ($1, $2, $3, $4) RETURNING id::text",
      [s.kim.slice(0, 300), hal.kaynak, hal.an, onceId])).rows[0]!.id;
    const g = (await db.sorgu<{ s: { tablolar: Record<string, unknown>; parolasiz: { tablo: string; id: string }[] } }>(
      "SELECT yedek_geri_yukle($1, $2::jsonb) AS s", [id, JSON.stringify(hal.tablolar)])).rows[0]!.s;
    /* parolası olmayan hesaplar: geçici parola + e-posta */
    const kisa = (await db.sorgu<{ k: string }>("SELECT kisa_ad AS k FROM firma WHERE id = gecerli_firma()")).rows[0]?.k;
    for (const p of g.parolasiz) {
      const tablo = p.tablo === "musteri_hesap" ? "musteri_hesap" : "hesap";
      const parola = geciciParolaUret();
      const k = (await db.sorgu<{ eposta: string; ad: string | null }>(
        `UPDATE ${tablo} SET parola_ozeti = $2, durum = 'ilk' WHERE id = $1 RETURNING eposta, ${tablo === "hesap" ? "ad" : "NULL::text AS ad"}`,
        [p.id, await parolaOzeti(parola)])).rows[0];
      if (!k) continue;
      await epostaKuyruga(db, {
        kime: [k.eposta], kaynak: "yedek", kaynakId: id, konu: "probata giriş bilgileriniz yenilendi",
        govde: [`Merhaba${k.ad ? ` ${k.ad}` : ""},`, "", "Firmanızın verileri yedekten geri yüklendi. Eski parolanız artık geçerli değil.", "",
          `Geçici parolanız: ${parola}`, `Giriş: ${kisa ? firmaAdresi(kisa) : ""} — ilk girişte yeni parola belirlersiniz.`].join("\n"),
      }, { kim: "probata", ne: "yedek.gecici_parola" });
    }
    /* yılın arşiv tam kopyası şimdiki (geri yüklenmiş) hâlle yenilenir; Drive'a yeni tam kopya gider */
    const yil = String(donemi(simdi).yil);
    await arsivSil(db, depo, "tam", yil);
    await arsivYaz(db, depo, "tam", yil, (await tamKopya(db, new Date())).bayt);
    await db.sorgu("UPDATE bulut_baglanti SET tam_kopya = NULL, ay_gonderim = NULL");
    await izYaz(db, { kim: s.kim.slice(0, 300), ne: "yedek.geri_yuklendi", nesne: "yedek_geri_yukleme", ayrinti: { kaynak: hal.kaynak, an: hal.an.toISOString() } });
    return { id, parola: g.parolasiz.length };
  });
  await kiraciIcinde(h, firmaId, async (db) => bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak: "yedek", kaynakId: r.id })).catch(() => undefined);
  /* 3 · dosyalar: yedekte olup az önce olmayanlar — içerik depoda yoksa Drive'dan */
  const dosya = { getirilen: 0, eksik: [] as string[] };
  const yeni = (hal.tablolar.dosya ?? []).filter((x) => UUID.test(String(x.id)) && !canliDosya.has(String(x.id)));
  const d = yeni.length ? await driveErisimi(h, firmaId, s.hizmetBul).catch(() => null) : null;
  for (const x of yeni) {
    const id = String(x.id), adi = String(x.ad ?? id), anahtarD = String(x.anahtar ?? "");
    if (Date.now() - bas > sure) { dosya.eksik.push(adi); continue; }
    const varMi = await kiraciIcinde(h, firmaId, async (db) => { try { await depo.oku(anahtarD, db); return true; } catch { return false; } });
    if (varMi) continue;
    const yer = await kiraciIcinde(h, firmaId, (db) => driveYerleri(db, [id])).then((m) => m.get(id));
    const b = d && yer ? await drivedenIndir(h, firmaId, d, yer, 60 * 1024 * 1024).catch(() => null) : null;
    if (!b) { dosya.eksik.push(adi); continue; }
    await kiraciIcinde(h, firmaId, (db) => depo.yaz(anahtarD, b, db, String(x.tur ?? "application/octet-stream")));
    dosya.getirilen++;
  }
  const kayit = Object.values(hal.tablolar).reduce((n, l) => n + l.length, 0);
  const sonuc: GeriYuklemeSonucu = { id: r.id, kaynak: hal.kaynak, an: hal.an.toISOString(), kayit, tablo: Object.keys(hal.tablolar).length,
    parola: r.parola, dosya: { getirilen: dosya.getirilen, eksik: dosya.eksik.slice(0, 50) }, once };
  await kiraciIcinde(h, firmaId, (db) => db.sorgu("UPDATE yedek_geri_yukleme SET durum = 'tamam', bitti = now(), ozet = $2 WHERE id = $1",
    [r.id, { kayit, tablo: sonuc.tablo, parola: r.parola, dosya: sonuc.dosya, once, an: sonuc.an }]));
  return sonuc;
}

/** önceki hâle dön: geri yüklemenin "once" kopyasından aynı akış */
export async function geriDon(h: Havuz, firmaId: string, depo: Depo, s: { geriYukleme: string; kim: string; hizmetBul: HizmetBul }): Promise<GeriYuklemeSonucu> {
  if (!UUID.test(s.geriYukleme)) throw new HalHatasi("geri yükleme bulunamadı");
  const donem = await kiraciIcinde(h, firmaId, async (db) => (await db.sorgu<{ donem: string }>(
    `SELECT a.donem FROM yedek_geri_yukleme g JOIN yedek_arsiv a ON a.id = g.once_arsiv AND a.tur = 'once' WHERE g.id = $1`, [s.geriYukleme])).rows[0]?.donem);
  if (!donem) throw new HalHatasi("önceki hâlin kopyası yok (30 günü dolmuş olabilir)");
  return geriYukle(h, firmaId, depo, { kaynak: "once", donem, kim: s.kim, hizmetBul: s.hizmetBul });
}
