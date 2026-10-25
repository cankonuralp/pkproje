/* KURULUM MAKİNESİ (FIRMA-VT §5.12; FV10 — 2026-10-16) — kendi projeli firmanın Supabase projesini Yönetim API'siyle açar ve uygulamaya bağlar. Merkezdeki
   firma_kurulum satırı durumun TEK kaydıdır (0096: kira — aynı anda tek ilerleten, 90 sn; ilerletme — adım aynı kalır ya da BİR ileri). Sayfa açıkken
   3 sn'de bir ilerletilir; her ilerletme en çok 40 sn (bütçe). Sıra (her adım yeniden koşulabilir — kesilip sürdürülebilir):
     proje      Supabase'te "probata-<kısa ad>-<kimlik 8>" adı aranır (proje açmada tekrar koruması yok); yoksa sahip parolası ÖNCE şifreli kayda yazılır,
                sonra AB (eu-central-1) projesi açılır
     hazir      db, pooler, storage ACTIVE_HEALTHY olana dek beklenir (proje INIT_FAILED → kalıcı: "Projeyi kaldır ve yeniden dene")
     ssl        veritabanına yalnız TLS
     goc        göçler Yönetim API'siyle (göç dağıtıcının kilidiyle aynı: goc_dagitim — yayınla çakışmaz); bütçe dolarsa kalanı sonraki ilerletmede
     vt_kimlik  veritabanı bu firmanın (vt_kimlik 'firma')
     rol        uygulama rolüne yeni parola: önce şifreli "bekleyen" merkeze, sonra ALTER ROLE (SCRAM özeti — düz parola API'ye gitmez), sonra onay
     havuzcu    havuzcu (işlem kipi) adresi — izin listesi (yayında yalnız Supabase AB havuzcusu)
     depo       "probata_depo" gizli anahtarı (yoksa açılır), şifreli merkeze; kova ilk yazımda özel kurulur
     dene       çalışan kodun eksik göçü varsa önce o (yayının iki yanına düşen kurulum); uygulama rolüyle firmanın veritabanı: vt_firma_dogrula + sağlık denetimi tamam (göç güncel dahil); Storage'a deneme nesnesi yaz, oku, sil
     firma      sahip olarak firma_kur (0098): firma + ilk yönetici (parolası bilinmeyen rastgele özet — ilk parolayı "Yöneticiye geçici parola" verir)
     eposta     isteğe bağlı — FV11 (şimdi geçilir)
     yz         isteğe bağlı — kurulumda girilen yapay zekâ anahtarı firma tarafına (firma_yonetim_sir), merkezin izi
     tamam      firma etkin, geçici girdi silinir
   HATA: yeniden denenen (429, 5xx, bağlantı, zaman aşımı) en çok 5 kez — sonra "durdu"; kalıcı (402, 401/403, biçim, sertifika, izin dışı sunucu, göç,
   INIT_FAILED) hemen "durdu" — "Kaldığı yerden sürdür" ister. Kayda giden metin sırsız ve maskeli (adımın kısa kodu + açıklama); sırlar (sahip parolası,
   uygulama parolası, gizli anahtar, PAT) hiçbir iletiye, ize, günlüğe düşmez. Yerel taklitte (test) proje ref'siz: "yerel-…" adıyla, adından bulunur. */
import { randomBytes, randomUUID } from "node:crypto";
import { sifrele } from "../../../server/ayar/sir.ts";
import { baglantiSifrele, depoBaglantisi, kurulumCoz, kurulumSifrele, SUPABASE_HAVUZCU, uygulamaKullanicisi, yerelSunucu, type FirmaVtKaydi } from "../../../server/db/baglanti.ts";
import { gocDosyalari, gocFarki, type GocDosyasi } from "../../../server/db/goc.ts";
import type { Havuz, Sorgulayici } from "../../../server/db/kiraci.ts";
import { firmaSaglikOku } from "../../../server/db/saglik.ts";
import { scramOzeti, scramOzetiMi } from "../../../server/db/scram.ts";
import { GOC_SAYISI, SON_GOC } from "../../../server/db/son-goc.ts";
import { yonetimApiYurutucu, type SupabaseYonetimi } from "../../../server/dis/supabase-yonetim.ts";
import { dosyaAnahtari } from "../../../server/dosya/anahtar.ts";
import { supabaseDepo } from "../../../server/dosya/supabase.ts";
import { maskele } from "../../../server/hata/maske.ts";
import { parolaOzeti } from "../../../server/kimlik/parola.ts";
import { hataMetni, KURULUM, kurulumProjeAdi, sonrakiAdim, type KurulumAdimi, type KurulumDurumu } from "../kurulum-adim.ts";
import { hataSinifi } from "./kurulum-hata.ts";
import { AnahtarGirdisi } from "../sema.ts";
import { firmaAcSemasi } from "../sema.ts";
import type { YonetimSonucu } from "./yonetim.ts";
import type { YonetimCalistirici } from "./firma-tarafi.ts";

export interface KurulumOrtami extends YonetimCalistirici {
  api: SupabaseYonetimi;
  /** Yönetim API'si yerel taklit (test): proje ref'siz ("yerel-…"), adres yerel */
  yerel: boolean;
  /** Supabase örgütü (PROBATA_SUPABASE_ORGUT) */
  orgut: string;
  /** ana anahtar (sırları şifreler) */
  anaAnahtar: Buffer;
  merkezYerel: boolean;
  /** yerel taklitte projelerin Storage adresi (yayında https://<ref>.supabase.co) */
  depoUc?: string;
  /** firmanın veritabanı havuzu (kayıttan) — dene adımı */
  firmaHavuzu(kayit: FirmaVtKaydi): Havuz;
  /** göç dağıtıcının kilidi (merkez, goc_dagitim) — alınamazsa null */
  gocKilidi: { al(): Promise<string | null>; birak(id: string, tamam: boolean): Promise<void> };
  /** göç dosyaları (varsayılan src/server/db/gocler — testler verir) */
  gocler?: readonly GocDosyasi[];
  beklenen?: { son: string; sayi: number };
  simdi?: () => number;
  butceMs?: number;
}

export interface KurulumGorunumu {
  adim: KurulumAdimi; durum: KurulumDurumu; deneme: number; hata: string | null; kod: string | null;
}
type Kira = { kira: string; adim: KurulumAdimi; durum: KurulumDurumu; deneme: number; girdi: Record<string, string> | null; yon_ad: string; yon_eposta: string; kisa_ad: string };
type Adim = { sonuc: "ileri"; vt?: Record<string, unknown>; girdi?: Record<string, string | null> } | { sonuc: "bekle" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** SQL metin değeri (standard_conforming_strings açık: yalnız tek tırnak ikilenir); NUL ve ters bölü reddedilir */
const sqlMetni = (s: string): string => {
  if (/[\0\\]/.test(s)) throw new Error("Kurulum girdisinde izin dışı karakter.");
  return `'${s.replace(/'/g, "''")}'`;
};
const rastgele = (n = 32) => randomBytes(n).toString("base64url");

/** kurulumun şu anki görünümü (merkezden) */
export async function kurulumGorunumu(c: YonetimCalistirici, firmaId: string): Promise<KurulumGorunumu | null> {
  if (!UUID.test(firmaId)) return null;
  const r = (await c.merkez((db) => db.sorgu<{ adim: KurulumAdimi; durum: KurulumDurumu; deneme: number; hata: string | null; hata_kodu: string | null }>(
    "SELECT adim, durum, deneme, hata, hata_kodu FROM firma_kurulum WHERE firma_id = $1", [firmaId]))).rows[0];
  return r ? { adim: r.adim, durum: r.durum, deneme: r.deneme, hata: r.hata, kod: r.hata_kodu } : null;
}

/** Firma aç → "Kendi Supabase projesi": merkezde kayıt (0096 yonetim_firma_kayit_ac — firma 'kurulum', bağlantı kaydı, kurulum satırı, niyet izi);
    kurulumda girilen yapay zekâ anahtarı (isteğe bağlı) hemen şifreli geçici girdiye (kurulumun "yz" adımı firmaya yazar). Kurulum sayfada ilerler. */
export async function kurulumBaslat(o: YonetimCalistirici & { anaAnahtar: Buffer }, girdi: unknown, ekAyrilmis: readonly string[], anaAlan: string,
  yz: string | null): Promise<YonetimSonucu<{ id: string; alt: string }>> {
  const g = firmaAcSemasi(ekAyrilmis).safeParse(girdi);
  const hatalar: Record<string, string> = {};
  if (!g.success) for (const i of g.error.issues) { const k = String(i.path[0] ?? "genel"); hatalar[k] ??= i.message; }
  let anahtar: string | null = null;
  if (yz?.trim()) {
    const a = AnahtarGirdisi.safeParse({ anahtar: yz });
    if (!a.success) hatalar.yz = a.error.issues[0]?.message ?? "Anahtar geçersiz."; else anahtar = a.data.anahtar;
  }
  if (!g.success || Object.keys(hatalar).length) return { durum: "gecersiz", hatalar };
  const d = g.data;
  const r = (await o.merkez((db) => db.sorgu<{ s: { id?: string; hata?: string } }>("SELECT yonetim_firma_kayit_ac($1, $2, $3, $4, $5) AS s",
    [d.unvan, d.alt, d.kod, d.yon, d.eposta]))).rows[0]!.s;
  if (r.hata === "kisa_ad") return { durum: "gecersiz", hatalar: { alt: `${d.alt}.${anaAlan} kullanılıyor.` } };
  if (r.hata === "rapor_kodu") return { durum: "gecersiz", hatalar: { kod: `${d.kod} başka bir firmada.` } };
  if (r.hata === "ayrilmis") return { durum: "gecersiz", hatalar: { alt: `“${d.alt}” bize ayrılmış; başka bir ad seçin.` } };
  if (!r.id) return { durum: "red", neden: "Firma kaydı açılamadı: bilgiler geçersiz." };
  if (anahtar) {
    const k = await kiraAl(o, r.id);
    if (k) await ilerlet(o, r.id, k.kira, { girdi: { kurulum_yz: kurulumSifrele(anahtar, r.id, "kurulum_yz", o.anaAnahtar) }, birak: true });
  }
  return { durum: "tamam", id: r.id, alt: d.alt };
}

/** "Kaldığı yerden sürdür": durdu → çalışıyor (deneme sıfırlanır), sonra ilerletilir */
export async function kurulumSurdur(o: KurulumOrtami, firmaId: string): Promise<KurulumGorunumu | null> {
  const k = await kiraAl(o, firmaId);
  if (k && k.durum === "durdu") await ilerlet(o, firmaId, k.kira, { durum: "calisiyor", birak: true });
  else if (k) await ilerlet(o, firmaId, k.kira, { birak: true });
  return kurulumIlerlet(o, firmaId);
}

/** "Projeyi kaldır ve yeniden dene" (proje açılamadı — INIT_FAILED): proje silinir, kurulum "proje" adımına döner */
export async function kurulumBastan(o: KurulumOrtami, firmaId: string): Promise<KurulumGorunumu | null> {
  const k = await kiraAl(o, firmaId);
  if (!k) return kurulumGorunumu(o, firmaId);
  try {
    const p = await projeBul(o, firmaId, k.kisa_ad);
    if (p) await o.api.projeSil(p);
    await o.merkez((db) => db.sorgu("SELECT firma_kurulum_bastan($1, $2::uuid)", [firmaId, k.kira]));
  } finally {
    await ilerlet(o, firmaId, k.kira, { birak: true }).catch(() => {});
  }
  return kurulumGorunumu(o, firmaId);
}

async function kiraAl(o: YonetimCalistirici, firmaId: string): Promise<Kira | null> {
  const r = (await o.merkez((db) => db.sorgu<{ s: Kira & { hata?: string } }>("SELECT firma_kurulum_kira($1) AS s", [firmaId]))).rows[0]?.s;
  return r && !r.hata && r.kira ? r : null;
}
async function ilerlet(o: YonetimCalistirici, firmaId: string, kira: string, d: Record<string, unknown>): Promise<void> {
  const r = (await o.merkez((db) => db.sorgu<{ s: { hata?: string } }>("SELECT firma_kurulum_ilerlet($1, $2::uuid, $3::jsonb) AS s",
    [firmaId, kira, JSON.stringify(d)]))).rows[0]?.s;
  if (r?.hata) throw new Error(`kurulum ilerletilemedi (${r.hata})`);
}
/** merkezdeki bağlantı kaydı (ham — kurulum sürerken alanlar eksik olabilir) */
async function kayitOku(o: YonetimCalistirici, firmaId: string): Promise<Record<string, unknown>> {
  return (await o.merkez((db) => db.sorgu<{ b: Record<string, unknown> }>("SELECT yonetim_firma_baglanti($1) AS b", [firmaId]))).rows[0]?.b ?? {};
}
const metin = (b: Record<string, unknown>, ad: string): string | null => (typeof b[ad] === "string" && b[ad] !== "" ? (b[ad] as string) : null);
function kayitTam(b: Record<string, unknown>, firmaId: string): FirmaVtKaydi {
  const sunucu = metin(b, "sunucu"), vtAd = metin(b, "vt_ad"), kullanici = metin(b, "kullanici"), parola = metin(b, "parola");
  if (!sunucu || typeof b.kapi !== "number" || !vtAd || !kullanici || !parola) throw new Error("bağlantı kaydı henüz eksik");
  const url = metin(b, "depo_url"), gizli = metin(b, "depo_gizli"), kova = metin(b, "kova");
  return { firmaId, ref: metin(b, "ref"), sunucu, kapi: b.kapi, vtAd, kullanici, parolaSifreli: parola,
    depo: url && gizli && kova ? { url, gizliSifreli: gizli, kova } : null, surum: Number(b.surum ?? 0) };
}
/** projenin Yönetim API'sindeki kimliği: kayıttaki ref; ref'siz (yerel taklit) adından */
async function projeBul(o: KurulumOrtami, firmaId: string, kisaAd: string): Promise<string | null> {
  const ref = metin(await kayitOku(o, firmaId), "ref");
  if (ref) return ref;
  const ad = kurulumProjeAdi(kisaAd, firmaId);
  return (await o.api.projeler()).find((p) => p.ad === ad)?.id ?? null;
}

/** eksik göçleri Yönetim API'siyle uygular (göç dağıtıcının kilidiyle: goc_dagitim — yayınla çakışmaz); değiştirilmiş ya da koddan ileride göç
    kalıcı hata. Bütçe dolarsa ya da kilit başkasındaysa false (kalanı sonraki ilerletmede). */
async function goclerUygula(o: KurulumOrtami, p: string, bitis: number): Promise<boolean> {
  const simdi = o.simdi ?? Date.now;
  const kilit = await o.gocKilidi.al();
  if (!kilit) return false;
  let tamam = false;
  try {
    const y = yonetimApiYurutucu(o.api, p);
    const f = gocFarki(await y.kayitli(), o.gocler ?? gocDosyalari());
    if (f.degismis.length || f.fazla.length) throw new Error("göç uyumsuz: değiştirilmiş ya da koddan ileride");
    for (const g of f.eksik) {
      if (simdi() > bitis - 3_000) return false;
      await y.uygula(g);
    }
    tamam = true;
    return true;
  } finally {
    await o.gocKilidi.birak(kilit, tamam).catch(() => {});
  }
}

/** adımları bütçe içinde ilerletir; kira başkasındaysa ya da durduysa yalnız görünümü döner */
export async function kurulumIlerlet(o: KurulumOrtami, firmaId: string): Promise<KurulumGorunumu | null> {
  if (!UUID.test(firmaId)) return null;
  const k = await kiraAl(o, firmaId);
  if (!k) return kurulumGorunumu(o, firmaId);
  const simdi = o.simdi ?? Date.now;
  const bas = simdi(), butce = o.butceMs ?? KURULUM.butceMs;
  let adim = k.adim, deneme = k.deneme;
  let girdi = { ...(k.girdi ?? {}) };
  let biraktim = false;
  try {
    if (k.durum === "durdu") return kurulumGorunumu(o, firmaId);
    while (simdi() - bas < butce && adim !== "tamam") {
      let r: Adim;
      try {
        r = await adimKos(o, firmaId, k, adim, girdi, bas + butce, (g) => { girdi = { ...girdi, ...g } as Record<string, string>; return ilerlet(o, firmaId, k.kira, { girdi: g }); });
      } catch (h) {
        const s = hataSinifi(h);
        deneme++;
        const dur = s.sinif === "kalici" || deneme >= KURULUM.enCokDeneme;
        await ilerlet(o, firmaId, k.kira, { durum: dur ? "durdu" : "hata", hata: maskele(hataMetni(s)), kod: s.kod, birak: true });
        biraktim = true;
        break;
      }
      if (r.sonuc === "bekle") break;
      const sonraki = sonrakiAdim(adim);
      await ilerlet(o, firmaId, k.kira, { adim: sonraki, durum: sonraki === "tamam" ? "tamam" : "calisiyor",
        ...(r.vt ? { vt: r.vt } : {}), ...(r.girdi ? { girdi: r.girdi } : {}) });
      if (r.girdi) for (const [a, d] of Object.entries(r.girdi)) { if (d === null) delete girdi[a]; else girdi[a] = d; }
      adim = sonraki;
      deneme = 0;
      if (sonraki === "tamam") biraktim = true;
    }
  } finally {
    if (!biraktim) await ilerlet(o, firmaId, k.kira, { birak: true }).catch(() => { /* kira 90 sn'de kendiliğinden düşer */ });
  }
  return kurulumGorunumu(o, firmaId);
}

async function adimKos(o: KurulumOrtami, firmaId: string, k: Kira, adim: KurulumAdimi, girdi: Record<string, string>, bitis: number,
  girdiYaz: (g: Record<string, string | null>) => Promise<void>): Promise<Adim> {
  const ana = o.anaAnahtar;
  switch (adim) {
    case "kayit": return { sonuc: "ileri" };
    case "proje": {
      const ad = kurulumProjeAdi(k.kisa_ad, firmaId);
      let p = (await o.api.projeler()).find((x) => x.ad === ad);
      if (!p) {
        let sahip = girdi.kurulum_sahip ? kurulumCoz(girdi.kurulum_sahip, firmaId, "kurulum_sahip", ana) : null;
        if (!sahip) { sahip = rastgele(32); await girdiYaz({ kurulum_sahip: kurulumSifrele(sahip, firmaId, "kurulum_sahip", ana) }); }
        p = await o.api.projeAc({ ad, orgut: o.orgut, sahipParolasi: sahip });
      }
      return { sonuc: "ileri", ...(o.yerel ? {} : { vt: { ref: p.id } }) };
    }
    case "hazir": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje açılamadı — bulunamadı");
      const pr = (await o.api.projeler()).find((x) => x.id === p);
      if (pr?.durum === "INIT_FAILED") throw new Error("INIT_FAILED: proje açılamadı");
      const s = await o.api.saglik(p, ["db", "pooler", "storage"]);
      return s.length >= 3 && s.every((x) => x.durum === "ACTIVE_HEALTHY") ? { sonuc: "ileri" } : { sonuc: "bekle" };
    }
    case "ssl": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      await o.api.sslZorla(p);
      return { sonuc: "ileri" };
    }
    case "goc": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      return (await goclerUygula(o, p, bitis)) ? { sonuc: "ileri" } : { sonuc: "bekle" };
    }
    case "vt_kimlik": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      await o.api.sorgu(p, `UPDATE public.vt_kimlik SET tur = 'firma', firma_id = '${firmaId}' WHERE tur = 'ortak'`);
      const v = (await o.api.sorgu<{ tur: string; firma_id: string | null }>(p, "SELECT tur, firma_id::text AS firma_id FROM public.vt_kimlik"))[0];
      if (v?.tur !== "firma" || v.firma_id !== firmaId) throw new Error("veritabanı başka firmaya bağlı");
      return { sonuc: "ileri" };
    }
    case "rol": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      const ref = o.yerel ? null : p;
      const parola = rastgele(32);
      const ozet = scramOzeti(parola);
      if (!scramOzetiMi(ozet)) throw new Error("SCRAM özeti biçimsiz");
      await ilerlet(o, firmaId, k.kira, { vt: { parola_bekleyen: baglantiSifrele(parola, firmaId, ref, "uygulama_parolasi", ana) } });
      await o.api.sorgu(p, `ALTER ROLE probata_uygulama LOGIN PASSWORD '${ozet}'`);
      return { sonuc: "ileri", vt: { parola_onayla: true } };
    }
    case "havuzcu": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      const h = (await o.api.havuzcu(p)).find((x) => x.kip === "transaction");
      if (!h) throw new Error("havuzcu (işlem kipi) yok — biçim");
      if (yerelSunucu(h.sunucu) ? !o.merkezYerel : !SUPABASE_HAVUZCU.test(h.sunucu)) throw new Error("havuzcu izin listesinde değil");
      if (!Number.isInteger(h.kapi) || h.kapi < 1 || h.kapi > 65535 || !/^[a-z0-9_]{1,63}$/.test(h.vt)) throw new Error("havuzcu biçimsiz");
      return { sonuc: "ileri", vt: { sunucu: h.sunucu, kapi: h.kapi, vt_ad: h.vt, kullanici: uygulamaKullanicisi(o.yerel ? null : p) } };
    }
    case "depo": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      const ref = o.yerel ? null : p;
      const anahtar = await o.api.gizliAnahtar(p, "probata_depo");
      const url = o.yerel ? o.depoUc : `https://${p}.supabase.co`;
      if (!url) throw new Error("yerel taklitte Storage adresi yok");
      return { sonuc: "ileri", vt: { depo_url: url, depo_gizli: baglantiSifrele(anahtar, firmaId, ref, "depo_gizli", ana), kova: "probata" } };
    }
    case "dene": {
      /* kurulum bir yayının iki yanına düştüyse (göç adımından sonra yeni göç geldi): ÇALIŞAN kodun göçleri önce burada tamamlanır — adım geri
         gidemez (0096), firma eski şemayla açılmaz (§6.1) */
      const pr = await projeBul(o, firmaId, k.kisa_ad);
      if (!pr) throw new Error("proje bulunamadı");
      if (!(await goclerUygula(o, pr, bitis))) return { sonuc: "bekle" };
      const kayit = kayitTam(await kayitOku(o, firmaId), firmaId);
      const v = await firmaSaglikOku(o.firmaHavuzu(kayit), firmaId, 10_000);
      const b = o.beklenen ?? { son: SON_GOC, sayi: GOC_SAYISI };
      const iyi = v.son_goc === b.son && Number(v.goc_sayisi) === b.sayi && v.kiraci_tablo > 0 && v.rls_eksik === 0 && v.politikasiz === 0
        && v.api_sema === false && v.uygulama_ayricalikli === false;
      if (!iyi) throw new Error("göç uyumsuz ya da sağlık denetimi geçmedi");
      const d = depoBaglantisi(kayit, ana, { merkezYerel: o.merkezYerel });
      if (!d) throw new Error("depo bağlantısı yok");
      const depo = supabaseDepo(d, null);
      const anahtar = dosyaAnahtari({ firmaId, modul: "kurulum", kayitId: randomUUID(), dosyaId: randomUUID() });
      const icerik = new TextEncoder().encode(`probata kurulum denemesi ${rastgele(8)}`);
      await depo.yaz(anahtar, icerik, undefined, "text/plain");
      const geri = await depo.oku(anahtar);
      await depo.copSil(anahtar);
      if (Buffer.compare(Buffer.from(geri), Buffer.from(icerik)) !== 0) throw new Error("Storage denemesi tutmadı — biçim");
      return { sonuc: "ileri" };
    }
    case "firma": {
      const p = await projeBul(o, firmaId, k.kisa_ad);
      if (!p) throw new Error("proje bulunamadı");
      const f = (await o.merkez((db: Sorgulayici) => db.sorgu<{ ad: string; rapor_kodu: string }>(
        "SELECT ad, rapor_kodu FROM yonetim_firmalar() WHERE id = $1", [firmaId]))).rows[0];
      if (!f) throw new Error("firma merkezde yok");
      const ozet = await parolaOzeti(rastgele(32));
      /* göç yürütücüsü gibi tek işlem: sahip rolüyle (firma_kur yalnız sahibin — 0098) */
      await o.api.sorgu(p, `BEGIN; SET LOCAL ROLE postgres; SELECT firma_kur('${firmaId}', ${sqlMetni(k.kisa_ad)}, ${sqlMetni(f.ad)}, `
        + `${sqlMetni(f.rapor_kodu)}, ${sqlMetni(k.yon_ad)}, ${sqlMetni(k.yon_eposta)}, ${sqlMetni(ozet)}); COMMIT;`);
      return { sonuc: "ileri", girdi: { kurulum_sahip: null } };
    }
    case "eposta": return { sonuc: "ileri" };
    case "yz": {
      if (!girdi.kurulum_yz) return { sonuc: "ileri" };
      const anahtar = kurulumCoz(girdi.kurulum_yz, firmaId, "kurulum_yz", ana);
      const kayit = kayitTam(await kayitOku(o, firmaId), firmaId);
      const sifreli = sifrele(anahtar, firmaId, "yapay_zeka_anahtari", ana);
      await o.firmada(kayit, firmaId, (db) => db.sorgu("SELECT firma_yonetim_sir($1, 'yapay_zeka_anahtari', $2, $3)", [firmaId, sifreli, anahtar.slice(-4)]));
      await o.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, 'ayar.yz_anahtari', $2::jsonb)", [firmaId, JSON.stringify({ son4: anahtar.slice(-4), kurulum: true })]));
      return { sonuc: "ileri", girdi: { kurulum_yz: null } };
    }
    case "tamam": return { sonuc: "ileri" };
  }
}
