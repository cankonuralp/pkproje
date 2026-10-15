/* ÇOKLU VERİTABANI DÜZENEĞİ (FIRMA-VT FV3) — firma başına veritabanını gerçek PostgreSQL'de sınayan testler için (tests/firma-vt.test.ts,
   tests/bozan/firma-vt.bozan.ts). İki küme, üç veritabanı, üç firma:
   · merkez (ortak proje): ilk kümenin "probata" veritabanı; ortak firma O (ortak-o) burada;
   · kendi-A: AYRI kümede (başka sunucu süreci, başka kapı, başka uygulama parolası — gerçekteki ayrı Supabase projesi gibi);
   · kendi-B: merkezle AYNI kümede ikinci veritabanı (aynı sunucu, aynı rol, başka veritabanı — ayrımı veritabanı adı da taşımalı).
   Kendi projeli firma kurulumdaki sırayla (FIRMA-VT §5.12): firma veritabanında göçler → vt_kimlik 'firma' + kimlik → firma satırı (vt 'kendi');
   merkezde firma (vt 'kendi', etkin) + firma_vt (bağlantı; uygulama parolası ŞİFRELİ, ek veri firma + ref + ad — src/server/db/baglanti.ts) +
   firma_kurulum (tamam). Kümeler SIRAYLA açılır (aynı anda boş kapı aranırsa aynı kapı iki kez verilebilir). Bütün veri uydurma (CLAUDE.md §7). */
import { randomBytes, randomUUID } from "node:crypto";
import type pg from "pg";
import { baglantiSifrele } from "../../src/server/db/baglanti.ts";
import { gocleriUygula } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, type Havuz, type UygulamaBaglantisi } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "./kume.ts";

export interface TestFirmasi {
  id: string; kisaAd: string; ad: string; raporKodu: string;
  /** firmanın verisinin durduğu veritabanında sahip (süper kullanıcı) bağlantısı */
  sahip: pg.Client;
  /** firmanın veritabanına uygulama rolüyle doğrudan bağlantı ayarı (merkezdeki kayıtla karşılaştırma için) */
  baglanti: UygulamaBaglantisi;
}

export interface CokluVt {
  /** bağlantı sırlarının ana anahtarı (testin; ortamdaki PROBATA_SIR_ANAHTARI değil) */
  anahtar: Buffer;
  /** merkez, uygulama rolü */
  merkez: Havuz;
  merkezSahip: pg.Client;
  merkezKume: GomuluKume;
  ayriKume: GomuluKume;
  /** ortak firma (merkezde) */
  O: TestFirmasi;
  /** kendi projeli, ayrı kümede */
  A: TestFirmasi;
  /** kendi projeli, merkezle aynı kümede ikinci veritabanı */
  B: TestFirmasi;
  /** firmanın merkezdeki uygulama parolası kaydını değiştirir (sürüm artar) — parola yenileme senaryoları */
  parolaKaydiYaz(f: TestFirmasi, parola: string): Promise<void>;
  kapat(): Promise<void>;
}

export async function cokluVtKur(): Promise<CokluVt> {
  const anahtar = randomBytes(32);
  const merkezKume = await testKumesi();
  const ayriKume = await testKumesi();
  const istemciler: pg.Client[] = [];
  const sahipAc = async (k: GomuluKume, vt?: string) => {
    const c = k.sahipIstemci(vt);
    await c.connect();
    istemciler.push(c);
    return c;
  };
  const merkezSahip = await sahipAc(merkezKume);
  const merkez = havuzKur(merkezKume.uygulama);
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  const oId = (await merkezSahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('ortak-o', 'Ortak O Muayene', 'OO') RETURNING id::text")).rows[0]!.id;
  const O: TestFirmasi = { id: oId, kisaAd: "ortak-o", ad: "Ortak O Muayene", raporKodu: "OO", sahip: merkezSahip, baglanti: merkezKume.uygulama };

  const parolaSifreli = (f: { id: string }, parola: string) => baglantiSifrele(parola, f.id, null, "uygulama_parolasi", anahtar);

  /** kendi projeli firma: veritabanı (yeni ise açılır, göçler), kimlik, firma satırı; merkezde kayıt, bağlantı, kurulum tamam */
  async function kendiFirma(o: { kume: GomuluKume; vtAd: string; yeni: boolean; kisaAd: string; ad: string; raporKodu: string }): Promise<TestFirmasi> {
    if (o.yeni) {
      const y = o.kume.sahipIstemci("postgres");
      await y.connect();
      try { await y.query(`CREATE DATABASE ${o.vtAd} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`); } finally { await y.end(); }
    }
    const sahip = await sahipAc(o.kume, o.vtAd);
    if (o.yeni) await gocleriUygula(sahip);
    const id = randomUUID();
    await sahip.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1 WHERE tur = 'ortak'", [id]);
    await sahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, $2, $3, $4, 'kendi')", [id, o.kisaAd, o.ad, o.raporKodu]);
    const baglanti: UygulamaBaglantisi = { ...o.kume.uygulama, database: o.vtAd };
    await merkezSahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, $2, $3, $4, 'kendi')", [id, o.kisaAd, o.ad, o.raporKodu]);
    await merkezSahip.query(`INSERT INTO firma_vt (firma_id, sunucu, kapi, vt_ad, kullanici, parola_sifreli, surum)
      VALUES ($1, '127.0.0.1', $2, $3, 'probata_uygulama', $4, 1)`, [id, baglanti.port, o.vtAd, parolaSifreli({ id }, baglanti.password)]);
    await merkezSahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum, bitti) VALUES ($1, 'tamam', 'tamam', now())", [id]);
    return { id, kisaAd: o.kisaAd, ad: o.ad, raporKodu: o.raporKodu, sahip, baglanti };
  }

  /* A: ayrı kümenin kendi "probata" veritabanı (göçleri küme açılırken uygulandı); B: merkez kümesinde ikinci veritabanı */
  const A = await kendiFirma({ kume: ayriKume, vtAd: ayriKume.uygulama.database, yeni: false, kisaAd: "kendi-a", ad: "Kendi A Muayene", raporKodu: "KA" });
  const B = await kendiFirma({ kume: merkezKume, vtAd: "probata_kendi_b", yeni: true, kisaAd: "kendi-b", ad: "Kendi B Muayene", raporKodu: "KB" });

  return {
    anahtar, merkez, merkezSahip, merkezKume, ayriKume, O, A, B,
    async parolaKaydiYaz(f, parola) {
      await merkezSahip.query("UPDATE firma_vt SET parola_sifreli = $2, surum = surum + 1, degisti = now() WHERE firma_id = $1", [f.id, parolaSifreli(f, parola)]);
    },
    async kapat() {
      await merkez.end();
      for (const c of istemciler) await c.end();
      await merkezKume.durdur();
      await ayriKume.durdur();
    },
  };
}
