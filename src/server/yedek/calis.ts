/* FİRMANIN YEDEĞİNİ ÇALIŞTIRAN (2026-11-03; sunum K1–K6, fotoğraf düzeni A). Bir firmada sırayla:
   1. probata'nın aylık arşivi (arsiv.ts) — Drive bağlı olsun olmasın;
   2. bağlıysa: erişim anahtarı yenilenir → yeni imzalanan raporlar ve yüklenen belgeler kuyruğa (topla.ts) → tam kopya (bağlanınca bir kez, sonra
      yılbaşı) → aylık değişiklik dosyası (o ay değişiklik varsa; ay boyunca aynı dosyanın üstüne) + biten ayların son hâli (arşivden) → kuyruk,
      dosya dosya (her dosya kendi işleminde; süre dolunca kalanı sonraki koşuya).
   Hizmetle konuşurken işlem açık tutulmaz — yalnız bir dosyanın yazıldığı kısa işlem. Aynı firmada aynı anda tek koşu (bağlantı 15 dk alınır).
   Bağlantı koparsa ya da hesap dolarsa durum yazılır, firma yöneticilerine BİR KEZ e-posta gider (K3); sonraki koşular bağlanana kadar göndermez
   (dolu hesapta her koşu bir dosya dener). Geçici hatada (ağ, 429, 5xx) dosya sırada kalır; art arda üç geçici hatada koşu durur. */
import type { Havuz, Sorgulayici } from "../db/kiraci.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import { ayarOku } from "../ayar/ayar.ts";
import { epostaKuyruga } from "../eposta/eposta.ts";
import { firmaGonderimi } from "../eposta/firma.ts";
import { bekleyenleriGonder } from "../eposta/gonder.ts";
import { gonderenListesi } from "../kimlik/hesap.ts";
import { geceFirmalari, isBasla, isBitir } from "../db/is.ts";
import {
  BulutDolu, BulutHatasi, BulutKopuk, BulutYetki, bulutAyari, bulutHizmeti, type BulutHizmeti, type BulutSaglayici, type Yukleme,
} from "../dis/bulut.ts";
import { arsivAdimi, arsivOku, type ArsivOzeti } from "./arsiv.ts";
import {
  baglantiAl, baglantiBirak, denemeYaz, denetlendiYaz, denetlenecekler, dosyaninKuyrugu, durumYaz, eksikYaz, gonderildiYaz, kosuYaz, kuyrukSayilari,
  siradaki, yenilemeAnahtari, yenilemeYaz, yerDeposu, yokYaz, zamanYaz, type Baglanti, type KuyrukSatiri,
} from "./kayit.ts";
import { driveAdaylari } from "../../modules/raporlar/server/yedek-baglanti.ts";
import { kuyrugaTopla } from "./topla.ts";
import { dogrulamaVakti, firmaDogrula } from "./dogrula.ts";
import { ayDosyasi, aydaDegisiklikVar, tamKopya } from "./veri.ts";
import { ayDosyasiAdi, ayKlasoru, donemi, tamKopyaAdi, veriKlasoru } from "./yol.ts";

export type HizmetBul = (s: BulutSaglayici) => BulutHizmeti | null;
/** ortamdaki uygulama kimlikleriyle; hizmet tanımlı değilse null */
export const ortamHizmeti: HizmetBul = (s) => { const a = bulutAyari(s); return a ? bulutHizmeti(a) : null; };
/** ekran: hizmet bağlanabilir mi (uygulama kimliği ortamda) */
export const hizmetHazir = (s: BulutSaglayici): boolean => { try { return !!bulutAyari(s); } catch { return false; } };

export type YedekDurumu = "yok" | "tamam" | "kopuk" | "dolu" | "hizmet_yok" | "gecici";
export interface FirmaYedekOzeti {
  arsiv: ArsivOzeti; gonderilen: number; bayt: number; bekleyen: number; durum: YedekDurumu;
  /** Drive denetimi: bulunan / bulunamayıp yeniden sıraya giren dosya; taşınan: dosyaları Supabase'ten silinen rapor (göç 0118) */
  denetlenen: number; eksik: number; tasinan: number;
}

const ZIP = "application/zip";
const GUVENLIK_MS = 5_000;
/** Drive denetimi ve taşıma günde bir (gece işi; imzadan sonraki kısa koşu da günde birden fazla yapmaz) */
const GUNLUK_MS = 20 * 60 * 60 * 1000;
const TASIMA_PARTI = 25;

export async function firmaYedegi(h: Havuz, firmaId: string, depo: Depo,
  s: { sure: number; simdi?: Date; hizmetBul?: HizmetBul; arsiv?: boolean }): Promise<FirmaYedekOzeti> {
  const bas = Date.now(), simdi = s.simdi ?? new Date(), hb = s.hizmetBul ?? ortamHizmeti;
  const kalan = () => s.sure - (Date.now() - bas);
  const o: FirmaYedekOzeti = { arsiv: { tam: 0, ay: 0, silinen: 0 }, gonderilen: 0, bayt: 0, bekleyen: 0, durum: "yok", denetlenen: 0, eksik: 0, tasinan: 0 };
  if (s.arsiv !== false) o.arsiv = await kiraciIcinde(h, firmaId, (db) => arsivAdimi(db, depo, simdi));
  const al = await kiraciIcinde(h, firmaId, async (db) => {
    const b = await baglantiAl(db);
    return b ? { b, yenileme: await yenilemeAnahtari(db), ayar: (await ayarOku(db, "bulut")).deger } : null;
  });
  if (!al) return o;
  const b: Baglanti = al.b;
  let basari = false;
  try {
    const hz = hb(b.saglayici);
    if (!hz || !al.yenileme) { o.durum = "hizmet_yok"; return o; }
    let erisim = "";
    /* erişim anahtarı (OneDrive yenileme anahtarını da değiştirir: yenisi aynı işlemde saklanır) */
    const yenile = async (db: Sorgulayici) => {
      const k = await hz.yenile(al.yenileme!);
      if (k.yenileme && k.yenileme !== al.yenileme) { al.yenileme = k.yenileme; await yenilemeYaz(db, k.yenileme); }
      erisim = k.erisim;
    };
    const yukle = async (db: Sorgulayici, y: Yukleme) => {
      try { await hz.yukle(erisim, y, yerDeposu(db)); } catch (e) {
        if (!(e instanceof BulutYetki)) throw e;
        await yenile(db);
        try { await hz.yukle(erisim, y, yerDeposu(db)); } catch (e2) { throw e2 instanceof BulutYetki ? new BulutKopuk("İzin geri alınmış.") : e2; }
      }
      basari = true;
    };
    const d = donemi(simdi), kok = al.ayar.kok;
    await kiraciIcinde(h, firmaId, async (db) => {
      await yenile(db);
      await kuyrugaTopla(db, b, { kok, duzen: al.ayar.duzen }, simdi);
    });
    /* tam kopya: bağlanınca bir kez, sonra her yılbaşı */
    if (!b.tam_kopya || donemi(b.tam_kopya).yil < d.yil) {
      await kiraciIcinde(h, firmaId, async (db) => {
        await yukle(db, { yol: veriKlasoru(kok), ad: tamKopyaAdi(d.yil), bayt: (await tamKopya(db, simdi)).bayt, tur: ZIP });
        await zamanYaz(db, b.id, "tam_kopya", simdi);
      });
      b.tam_kopya = simdi;
    }
    /* biten ayların son hâli (probata arşivinden — son gönderimden sonra kapananlar) + bu ayın dosyası (değişiklik varsa) */
    await kiraciIcinde(h, firmaId, async (db) => {
      const esik = b.ay_gonderim ?? b.tam_kopya!;
      const biten = (await db.sorgu<{ donem: string }>("SELECT donem FROM yedek_arsiv WHERE tur = 'ay' AND olustu > $1 ORDER BY donem", [esik])).rows;
      for (const { donem } of biten) {
        const a = await arsivOku(db, depo, "ay", donem);
        if (a) await yukle(db, { yol: ayKlasoru(kok), ad: ayDosyasiAdi(donem), bayt: a.bayt, tur: ZIP });
      }
      let yazildi = biten.length > 0;
      if (await aydaDegisiklikVar(db, d.ay, b.ay_gonderim)) {
        const f = await ayDosyasi(db, d.ay, simdi);
        if (f) { await yukle(db, { yol: ayKlasoru(kok), ad: ayDosyasiAdi(d.ay), bayt: f.bayt, tur: ZIP }); yazildi = true; }
      }
      if (yazildi || !b.ay_gonderim) await zamanYaz(db, b.id, "ay_gonderim", simdi);
    });
    /* kuyruk: dosya dosya */
    const atla: string[] = [];
    for (let ard = 0; kalan() > GUVENLIK_MS;) {
      const r = await kiraciIcinde(h, firmaId, async (db): Promise<"bos" | "tamam" | "gecici"> => {
        const k = await siradaki(db, atla);
        if (!k) return "bos";
        const dz = (await db.sorgu<{ anahtar: string; tur: string }>("SELECT anahtar, tur FROM dosya WHERE id = $1 AND cop IS NULL", [k.dosya_id])).rows[0];
        if (!dz) { await yokYaz(db, k.id); return "tamam"; }
        let bayt: Uint8Array;
        try { bayt = await depo.oku(dz.anahtar, db); } catch { await denemeYaz(db, k.id, "dosya depoda okunamadı"); atla.push(k.id); return "gecici"; }
        try { await yukle(db, { yol: k.yol, ad: k.ad, bayt, tur: dz.tur }); } catch (e) {
          if (!(e instanceof BulutHatasi)) throw e;
          await denemeYaz(db, k.id, e.message); atla.push(k.id); return "gecici";
        }
        await gonderildiYaz(db, b.id, k, bayt.length);
        o.gonderilen++; o.bayt += bayt.length;
        return "tamam";
      });
      if (r === "bos") break;
      if (r === "gecici") { if (++ard >= 3) break; } else ard = 0;
    }
    /* hizmette dosya var mı (erişim anahtarı dolduysa bir kez yenilenir) */
    const bulDene = async (db: Sorgulayici, k: KuyrukSatiri) => {
      try { return await hz.bul(erisim, k, yerDeposu(db)); } catch (e) {
        if (!(e instanceof BulutYetki)) throw e;
        await yenile(db);
        return hz.bul(erisim, k, yerDeposu(db));
      }
    };
    /* yoksa ya da boyutu tutmuyorsa yeniden sıraya; varsa "bulundu" zamanı */
    const denetle = async (db: Sorgulayici, k: KuyrukSatiri & { boyut?: string | null }): Promise<boolean> => {
      const v = await bulDene(db, k);
      if (!v || (k.boyut != null && Number(k.boyut) !== v.boyut)) { await eksikYaz(db, k); o.eksik++; return false; }
      await denetlendiYaz(db, k.id);
      o.denetlenen++;
      return true;
    };
    const gunluk = (t: Date | null) => !t || simdi.getTime() - t.getTime() > GUNLUK_MS;
    /* Drive denetimi (günde bir): her gönderilmiş dosya ayda bir aranır — firma Drive'dan silmişse yeniden gönderilir */
    if (gunluk(b.denetim)) {
      let bitti = false;
      while (kalan() > GUVENLIK_MS) {
        const l = await kiraciIcinde(h, firmaId, (db) => denetlenecekler(db, 20));
        if (!l.length) { bitti = true; break; }
        for (const k of l) {
          if (kalan() <= GUVENLIK_MS) break;
          await kiraciIcinde(h, firmaId, (db) => denetle(db, k));
        }
      }
      if (bitti) await kiraciIcinde(h, firmaId, (db) => kosuYaz(db, b.id, "denetim"));
    }
    /* Supabase'te 1 yıl (günde bir; göç 0118): güncel olmayan, son imzası 1 yıldan eski raporun dosyaları — hepsi ŞİMDİ Drive'da bulunursa —
       Supabase'ten silinir; kayıt kalır. Drive'da olmayan dosya yeniden sıraya girer, rapor sonraki koşuya kalır. */
    if (gunluk(b.tasima)) {
      let bitti = false;
      while (kalan() > GUVENLIK_MS) {
        const adaylar = await kiraciIcinde(h, firmaId, (db) => driveAdaylari(db, TASIMA_PARTI));
        let ilerledi = false;
        for (const a of adaylar) {
          if (kalan() <= GUVENLIK_MS) break;
          const hazir = await kiraciIcinde(h, firmaId, async (db) => {
            const q = await dosyaninKuyrugu(db, a.dosyalar);
            if (q.length < new Set(a.dosyalar).size || q.some((x) => x.durum !== "gonderildi")) return false;
            for (const k of q) if (!(await denetle(db, k))) return false;
            return true;
          });
          if (!hazir) continue;
          await kiraciIcinde(h, firmaId, async (db) => {
            const anahtarlar = (await db.sorgu<{ a: string[] | null }>("SELECT bekletme_sil($1) AS a", [a.rapor])).rows[0]?.a;
            if (!anahtarlar) return;
            for (const k of anahtarlar) await depo.copSil(k, db);
            o.tasinan++;
            ilerledi = true;
          });
        }
        if (adaylar.length < TASIMA_PARTI || !ilerledi) { bitti = true; break; }
      }
      if (bitti) await kiraciIcinde(h, firmaId, (db) => kosuYaz(db, b.id, "tasima"));
    }
    await kiraciIcinde(h, firmaId, async (db) => {
      o.bekleyen = (await kuyrukSayilari(db)).bekliyor;
      if (basari && b.durum !== "bagli") await durumYaz(db, b.id, "bagli", null);
    });
    o.durum = "tamam";
    return o;
  } catch (e) {
    if (e instanceof BulutKopuk || e instanceof BulutDolu || e instanceof BulutYetki) {
      const durum = e instanceof BulutDolu ? "dolu" : "kopuk";
      const neden = e instanceof BulutDolu ? "Hesapta yer kalmadı." : e instanceof BulutYetki ? "İzin geri alınmış." : e.message;
      await kiraciIcinde(h, firmaId, async (db) => { if (await durumYaz(db, b.id, durum, neden)) await sorunBildir(db, b, durum, neden); });
      o.durum = durum;
      return o;
    }
    if (e instanceof BulutHatasi) { o.durum = "gecici"; return o; }
    throw e;
  } finally {
    await kiraciIcinde(h, firmaId, (db) => baglantiBirak(db, b.id));
  }
}

const HIZMET_AD: Record<BulutSaglayici, string> = { gdrive: "Google Drive", onedrive: "OneDrive" };
/** firmanın adresi (e-postadaki bağlantı) — kısa ad + ana alan (src/server/kiraci/istek.ts firmaAdresi ile aynı kural) */
function firmaAdresi(kisaAd: string): string {
  const a = process.env.PROBATA_ANA_ALAN || "localhost";
  return `${a === "localhost" || a.endsWith(".localhost") ? "http" : "https"}://${kisaAd}.${a}`;
}

/** bağlantı koptu / hesap doldu: firma yöneticilerine bir e-posta (kopma başına bir kez — durumYaz söyler) */
async function sorunBildir(db: Sorgulayici, b: Baglanti, durum: "kopuk" | "dolu", neden: string): Promise<void> {
  const kime = (await gonderenListesi(db)).filter((x) => x.roller.includes("firma_yoneticisi")).map((x) => x.eposta);
  if (!kime.length) return;
  const kisa = (await db.sorgu<{ k: string }>("SELECT kisa_ad AS k FROM firma WHERE id = gecerli_firma()")).rows[0]?.k;
  const hz = HIZMET_AD[b.saglayici];
  await epostaKuyruga(db, {
    kime, kaynak: "yedek", kaynakId: b.id,
    konu: durum === "dolu" ? `Yedek gönderilemiyor: ${hz} hesabı dolu` : `Yedek gönderilemiyor: ${hz} bağlantısı koptu`,
    govde: [`Firmanızın yedeği ${hz} hesabına (${b.hesap}) gönderilemiyor.`, neden, "",
      durum === "dolu" ? "Hesapta yer açın ya da Firma ayarları › Yedek'ten başka bir hesap bağlayın." : "Firma ayarları › Yedek'ten yeniden bağlayın; bekleyen dosyalar gönderilir.",
      ...(kisa ? [`${firmaAdresi(kisa)}/firma-ayarlari`] : [])].join("\n"),
  }, { kim: "probata", ne: "yedek.sorun_bildirildi" });
  await bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak: "yedek", kaynakId: b.id });
}

/* ── gece işi: her firma kendi havuzunda, firma başına süre payı ── */
export type YedekIsOzeti = { durum: "tamam" | "hata" | "zaten_calisiyor"; firma: number; gonderilen: number; bayt: number; arsiv: number; kopuk: number;
  kalan: number; hatali_firma: number; ulasilamayan: number; eksik: number; tasinan: number;
  /** 2026-11-04: ayda bir doğrulama (dogrula.ts) — bu gece doğrulanan firma ve sorunlu çıkan */
  dogrulanan: number; dogrulama_sorunlu: number };

export async function yedekIsi(havuz: Havuz, depo: Depo, sure: number, havuzBul?: (firmaId: string) => Promise<Havuz | null>,
  s: { simdi?: Date; hizmetBul?: HizmetBul } = {}): Promise<YedekIsOzeti> {
  const o: YedekIsOzeti = { durum: "tamam", firma: 0, gonderilen: 0, bayt: 0, arsiv: 0, kopuk: 0, kalan: 0, hatali_firma: 0, ulasilamayan: 0, eksik: 0, tasinan: 0, dogrulanan: 0, dogrulama_sorunlu: 0 };
  const id = await isBasla(havuz, "yedek");
  if (!id) return { ...o, durum: "zaten_calisiyor" };
  const bas = Date.now();
  try {
    const firmalar = await geceFirmalari(havuz);
    for (let i = 0; i < firmalar.length; i++) {
      const gecen = Date.now() - bas;
      if (gecen > sure - GUVENLIK_MS) { o.kalan += firmalar.length - i; break; }
      /* süre payı: kalan süre kalan firmalara bölünür (en az 20 sn) — ilk firmanın büyük birikimi ötekileri bekletmez */
      const pay = Math.max(20_000, Math.floor((sure - gecen) / (firmalar.length - i)));
      const f = firmalar[i]!;
      const hf = havuzBul ? await havuzBul(f) : havuz;
      if (!hf) { o.ulasilamayan++; continue; }
      try {
        const r = await firmaYedegi(hf, f, depo, { sure: Math.min(pay, sure - gecen), simdi: s.simdi, hizmetBul: s.hizmetBul });
        o.firma++; o.gonderilen += r.gonderilen; o.bayt += r.bayt; o.arsiv += r.arsiv.tam + r.arsiv.ay; o.eksik += r.eksik; o.tasinan += r.tasinan;
        if (r.durum === "kopuk" || r.durum === "dolu") o.kopuk++;
        if (r.bekleyen > 0) o.kalan++;
        /* ayda bir doğrulama — süre kalırsa (yedeği indirip açar; firmanın payından sonra, en az 60 sn) */
        if (sure - (Date.now() - bas) > 60_000 && await kiraciIcinde(hf, f, (db) => dogrulamaVakti(db, s.simdi ?? new Date()))) {
          try {
            const dr = await firmaDogrula(hf, f, depo, { simdi: s.simdi, hizmetBul: s.hizmetBul ?? ortamHizmeti });
            o.dogrulanan++;
            if (!dr.tamam) o.dogrulama_sorunlu++;
          } catch (h) { console.error("[gece] yedek doğrulaması düştü:", (h as Error).message); }
        }
      } catch (h) {
        o.hatali_firma++;
        console.error("[gece] yedek bir firmada düştü:", (h as Error).message);
      }
    }
  } catch (h) {
    await isBitir(havuz, id, "hata", { ...o, hata: "firma listesi okunamadı" });
    throw h;
  }
  o.durum = o.hatali_firma || o.ulasilamayan ? "hata" : "tamam";
  const { durum, ...sayilar } = o;
  await isBitir(havuz, id, durum === "hata" ? "hata" : "tamam", sayilar);
  return o;
}
