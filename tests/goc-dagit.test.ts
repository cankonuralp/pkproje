/* NEREDEN GELDİ: FIRMA-VT.md §5.5, §7.3, FV4 (sunum 579, reisim onayı 2026-10-15) — "göç dağıtımı Vercel derleme adımında; varsayılan denetle: merkez
   ve goc_hedefleri() dolaşılır; uygulama rolüyle saglik_denetimi() okunur; son_goc = SON_GOC ve goc_sayisi = GOC_SAYISI değilse çıkış kodu 1."
   GERÇEK PostgreSQL, iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts): merkez + ortak firma O, kendi-A AYRI kümede, kendi-B merkezle aynı kümede
   ikinci veritabanında; ayrıca merkezde kurulumu sürmekte olan "kurulum-c" (bağlantısı yok). Dağıtıcı, betiğin çağırdığı işlevle (gocDagit) ORTAMLA
   çağrılır (PROBATA_VT_* + PROBATA_SIR_ANAHTARI); ayrıca betiğin kendisi alt süreçte, Vercel'deki gibi --zorunlu ile (çıkış kodu sürece geçer).
   Göç kaydı yalnız goc tablosunda silinip geri yazılır (şema aynı kalır). Kilitlenenler:
   · hepsi güncel → 0; kurulumdaki firma atlanır ve SAYILIR; ortak firma ayrıca denetlenmez (verisi merkezde); güncel / kurulumdaki firmanın adı
     derleme günlüğüne yazılmaz (FV4 incelemesi — günlük firma listesi olmasın);
   · bir firma veritabanında son göç yok / göç sayısı eksik → 1, o kısa ad, beklenen / bulunan; öteki firma güncel sayılır; merkez geride → 1;
   · firma veritabanına ulaşılamıyor (kapı kapalı) → 1, ULAŞILAMADI; parola reddi / kayıt merkezi gösteriyor (vt_firma_dogrula 42501) → 1,
     REDDEDİLDİ — yanlış veritabanının göçü "güncel" sayılmaz; ana anahtar yok / yanlış → 1 (ortam TEK kaynak: süreçte anahtar olsa da);
   · ortam merkez yerine bir firma veritabanını gösteriyor → 1, "merkez: REDDEDİLDİ" (vt_merkez_dogrula) — ağ sorunu diye yazılmaz;
   · dondurulmuş firma da denetlenir (etkinleşince hemen açılır); bakımdaki (göç dışı) firma denetlenmez, yayını durdurmaz, SAYISI yazılır;
   · denetle SALT OKUNUR: merkezde firma_vt.son_goc / goc_sayisi / son_saglik yazılmaz;
   · çıktıda SIR YOK: parolalar (merkez, firmalar, denenen yanlış parola), ana anahtar, şifreli metinler — betiğin hata çıktısında da.
   Saf parçalar: tests/goc-dagit-saf.test.ts. Olumsuz kanıt: tests/bozan/goc-dagit.bozan.ts. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type pg from "pg";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { gocDagit, type Ortam } from "../src/server/db/goc-dagit.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { cokluVtKur, type CokluVt } from "./yardimci/coklu-vt.ts";
import { KOK } from "./yardimci/denetimler.ts";
import { bosKapi } from "./yardimci/kume.ts";

let v: CokluVt;
let ortam: Ortam;
const ciktilar: string[] = [];
const hataCiktilari: string[] = [];
const YANLIS = `yanlis-${randomBytes(12).toString("base64url")}`;
const GOCLER = gocDosyalari();
const SON = GOCLER.at(-1)!, ONCEKI = GOCLER.at(-2)!, ILK = GOCLER[0]!;
const re = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const OZET2 = /\(2 veritabanı güncel, 1 kurulumda \(atlandı\)\) — yayın yapılmaz/;

async function kos(ek: Ortam = {}) {
  const satirlar: string[] = [];
  const kod = await gocDagit({ ortam: { ...ortam, ...ek }, yaz: (s) => satirlar.push(s) });
  const cikti = satirlar.join("\n");
  ciktilar.push(cikti);
  return { kod, cikti };
}
/** betiğin kendisi alt süreçte (Vercel derleme komutundaki gibi --zorunlu); ortam: testin ortamı, PROBATA_* / VERCEL* süreçten gelmez */
function betik(ek: Ortam = {}): Promise<{ kod: number | null; cikti: string; hata: string }> {
  const temiz: NodeJS.ProcessEnv = { ...process.env };
  for (const ad of Object.keys(temiz)) if (/^(PROBATA_|VERCEL)/i.test(ad)) delete temiz[ad];
  return new Promise((coz, reddet) => {
    const c = spawn(process.execPath, [join(KOK, "scripts", "goc-dagit.ts"), "--zorunlu"], { cwd: KOK, env: { ...temiz, ...ortam, ...ek } });
    let cikti = "", hata = "";
    c.stdout.setEncoding("utf8").on("data", (d: string) => { cikti += d; });
    c.stderr.setEncoding("utf8").on("data", (d: string) => { hata += d; });
    const sayac = setTimeout(() => c.kill(), 60_000);
    c.on("error", reddet);
    c.on("close", (kod) => {
      clearTimeout(sayac);
      ciktilar.push(cikti.trimEnd());
      hataCiktilari.push(hata);
      coz({ kod, cikti: cikti.trimEnd(), hata });
    });
  });
}
/** göç KAYDINI (yalnız goc satırı; şema aynı) geçici siler, iş bitince aynen geri yazar */
async function gocKaydiOlmadan<T>(sahip: pg.Client, ad: string, is: () => Promise<T>): Promise<T> {
  const r = await sahip.query<{ ad: string; ozet: string; uygulandi: Date }>("DELETE FROM goc WHERE ad = $1 RETURNING ad, ozet, uygulandi", [ad]);
  assert.equal(r.rowCount, 1, `göç kaydı yok: ${ad}`);
  try { return await is(); } finally {
    await sahip.query("INSERT INTO goc (ad, ozet, uygulandi) VALUES ($1, $2, $3)", [r.rows[0]!.ad, r.rows[0]!.ozet, r.rows[0]!.uygulandi]);
  }
}
/** merkezdeki bağlantı kaydında bir sütunu geçici değiştirir (sahip), iş bitince eski değer */
async function kayitla<T>(firmaId: string, sutun: "kapi" | "vt_ad", deger: unknown, is: () => Promise<T>): Promise<T> {
  const once = (await v.merkezSahip.query(`SELECT ${sutun} AS d FROM firma_vt WHERE firma_id = $1`, [firmaId])).rows[0]!.d;
  await v.merkezSahip.query(`UPDATE firma_vt SET ${sutun} = $2 WHERE firma_id = $1`, [firmaId, deger]);
  try { return await is(); } finally { await v.merkezSahip.query(`UPDATE firma_vt SET ${sutun} = $2 WHERE firma_id = $1`, [firmaId, once]); }
}

before(async () => {
  v = await cokluVtKur();
  const u = v.merkezKume.uygulama;
  ortam = {
    PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database, PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
    PROBATA_SIR_ANAHTARI: v.anahtar.toString("base64"),
  };
  /* kurulumu süren kendi projeli firma (FIRMA-VT §5.12 adım 'goc'): proje açıldı (ref), uygulama parolası / havuzcu henüz yok — örnek veri UYDURMA */
  const id = randomUUID();
  await v.merkezSahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt, durum) VALUES ($1, 'kurulum-c', 'Kurulum C Muayene', 'KC', 'kendi', 'kurulum')", [id]);
  await v.merkezSahip.query("INSERT INTO firma_vt (firma_id, ref) VALUES ($1, 'abcdefghij0123456789')", [id]);
  await v.merkezSahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum) VALUES ($1, 'goc', 'calisiyor')", [id]);
});
after(async () => { await v?.kapat(); });

test("hepsi güncel → 0; kurulumdaki firma atlanır ve sayılır; adlar günlüğe yazılmaz; ortak firma ayrıca denetlenmez; merkeze hiçbir şey yazılmaz (salt okunur)", async () => {
  assert.equal(SON.ad, SON_GOC);
  assert.equal(GOCLER.length, GOC_SAYISI);
  const r = await kos();
  assert.equal(r.kod, 0, r.cikti);
  assert.match(r.cikti, new RegExp(`kip: denetle \\(salt okunur\\) · beklenen ${re(SON_GOC)} / ${GOC_SAYISI}`));
  assert.match(r.cikti, /\] merkez: güncel/);
  assert.match(r.cikti, /TAMAM: 3 veritabanı güncel, 1 kurulumda \(atlandı\)\./);
  assert.doesNotMatch(r.cikti, /kendi-a|kendi-b|kurulum-c|ortak-o|bakımda/, "güncel / kurulumdaki firmanın adı derleme günlüğüne yazılmaz");
  const yazilan = (await v.merkezSahip.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM firma_vt WHERE son_goc IS NOT NULL OR goc_sayisi IS NOT NULL OR son_saglik IS NOT NULL OR son_saglik_zaman IS NOT NULL")).rows[0]!.n;
  assert.equal(yazilan, 0, "denetle merkeze yazmaz");
});

test("firma veritabanında son göç yok → 1, o kısa ad, beklenen / bulunan; öteki firma ve merkez güncel sayılır", async () => {
  await gocKaydiOlmadan(v.A.sahip, SON.ad, async () => {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, new RegExp(`firma kendi-a: GÖÇ UYUMSUZ — beklenen ${re(SON_GOC)} / ${GOC_SAYISI}, bulunan ${re(ONCEKI.ad)} / ${GOC_SAYISI - 1}`));
    assert.match(r.cikti, /\] merkez: güncel/);
    assert.doesNotMatch(r.cikti, /kendi-b/);
    assert.match(r.cikti, /DURDU: 1 veritabanı uyumsuz, ulaşılamadı ya da reddetti /);
    assert.match(r.cikti, OZET2);
  });
  assert.equal((await kos()).kod, 0, "geri yazılınca güncel");
});

test("göç SAYISI eksik (arada bir göç kaydı yok, son göç aynı) → 1 ve o kısa ad — aynı kümedeki ikinci veritabanında", async () => {
  await gocKaydiOlmadan(v.B.sahip, ILK.ad, async () => {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, new RegExp(`firma kendi-b: GÖÇ UYUMSUZ — beklenen ${re(SON_GOC)} / ${GOC_SAYISI}, bulunan ${re(SON_GOC)} / ${GOC_SAYISI - 1}`));
    assert.doesNotMatch(r.cikti, /kendi-a/);
    assert.match(r.cikti, OZET2);
  });
});

test("merkez geride → 1 (bugünkü elle akışın kapısı); firmalar yine denetlenir", async () => {
  await gocKaydiOlmadan(v.merkezSahip, SON.ad, async () => {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, new RegExp(`\\] merkez: GÖÇ UYUMSUZ — beklenen ${re(SON_GOC)} / ${GOC_SAYISI}, bulunan ${re(ONCEKI.ad)} / ${GOC_SAYISI - 1}`));
    assert.doesNotMatch(r.cikti, /\] firma /);
    assert.match(r.cikti, OZET2, "iki firma denetlendi, güncel");
  });
});

test("firma veritabanına ulaşılamıyor (kapı kapalı) → 1, ULAŞILAMADI + sınıflanmış neden; öteki firma denetlenir", async () => {
  await kayitla(v.A.id, "kapi", await bosKapi(), async () => {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, /firma kendi-a: ULAŞILAMADI — bağlantı reddedildi \(ECONNREFUSED\)/);
    assert.doesNotMatch(r.cikti, /kendi-b/);
    assert.match(r.cikti, OZET2);
  });
});

test("parola reddi → 1, REDDEDİLDİ (28P01); yanlış parola ve doğru parola çıktıda yok", async () => {
  await v.parolaKaydiYaz(v.B, YANLIS);
  try {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, /firma kendi-b: REDDEDİLDİ — parola reddedildi \(28P01\)/);
    assert.ok(!r.cikti.includes(YANLIS));
  } finally { await v.parolaKaydiYaz(v.B, v.B.baglanti.password); }
  assert.equal((await kos()).kod, 0, "parola geri yazılınca güncel");
});

test("ana anahtar ortamda yok → 1 (firmaya bağlanılmaz) — süreçte GEÇERLİ anahtar olsa da (ortam tek kaynak); yanlış ana anahtar → 1, 'uygulama parolası çözülemedi'", async () => {
  const onceki = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = v.anahtar.toString("base64");
  let yok: Awaited<ReturnType<typeof kos>>;
  try { yok = await kos({ PROBATA_SIR_ANAHTARI: undefined }); } finally {
    if (onceki === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = onceki;
  }
  assert.equal(yok.kod, 1, yok.cikti);
  assert.match(yok.cikti, /HATA: Sır anahtarı tanımlı değil \(PROBATA_SIR_ANAHTARI, 32 bayt base64\) — firma veritabanlarına bağlanılamaz\./);
  assert.doesNotMatch(yok.cikti, /firma kendi-a:|TAMAM/);
  const yanlis = await kos({ PROBATA_SIR_ANAHTARI: randomBytes(32).toString("base64") });
  assert.equal(yanlis.kod, 1, yanlis.cikti);
  for (const ad of ["kendi-a", "kendi-b"]) {
    assert.match(yanlis.cikti, new RegExp(`firma ${ad}: ULAŞILAMADI — bağlantı kaydı: uygulama parolası çözülemedi`));
  }
});

test("kayıt merkezin kendi veritabanını gösteriyor → 1, REDDEDİLDİ (vt_firma_dogrula 42501): yanlış veritabanının göçü 'güncel' sayılmaz", async () => {
  await kayitla(v.B.id, "vt_ad", v.merkezKume.uygulama.database, async () => {
    const r = await kos();
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, /firma kendi-b: REDDEDİLDİ — yetki reddi — yanlış veritabanı ya da eksik hak \(42501\)/);
    assert.doesNotMatch(r.cikti, /TAMAM/);
  });
});

test("ortam merkez yerine bir firma veritabanını gösteriyor → 1, 'merkez: REDDEDİLDİ' (vt_merkez_dogrula 42501) — ağ sorunu diye yazılmaz", async () => {
  const r = await kos({ PROBATA_VT_AD: v.B.baglanti.database });
  assert.equal(r.kod, 1, r.cikti);
  assert.match(r.cikti, /\] merkez: REDDEDİLDİ — yetki reddi — yanlış veritabanı ya da eksik hak \(42501\)/);
  assert.match(r.cikti, /DURDU: merkez denetimi reddetti — ortam \(PROBATA_VT_\*\) merkezi göstermiyor/);
  assert.doesNotMatch(r.cikti, /ULAŞILAMADI|TAMAM|\] firma /);
});

test("dondurulmuş firma da denetlenir (etkinleştirilince hemen çözülür): geride ise 1", async () => {
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.B.id]);
  try {
    await gocKaydiOlmadan(v.B.sahip, SON.ad, async () => {
      const r = await kos();
      assert.equal(r.kod, 1, r.cikti);
      assert.match(r.cikti, /firma kendi-b: GÖÇ UYUMSUZ/);
    });
    assert.equal((await kos()).kod, 0, "dondurulmuş ama güncel firma yayını durdurmaz");
  } finally { await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.B.id]); }
});

test("bakımdaki (göç dışı) firma denetlenmez, geride olsa da yayını durdurmaz; yalnız SAYISI yazılır", async () => {
  await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Deneme: bakımda, göç dışı' WHERE firma_id = $1", [v.B.id]);
  try {
    await gocKaydiOlmadan(v.B.sahip, SON.ad, async () => {
      const r = await kos();
      assert.equal(r.kod, 0, r.cikti);
      assert.doesNotMatch(r.cikti, /kendi-b/);
      assert.match(r.cikti, /\] 1 firma bakımda \(göç dışı\) — denetlenmedi; bakımdan çıkmadan önce göçü kodun beklediğiyle aynı olmalı\./);
      assert.match(r.cikti, /TAMAM: 2 veritabanı güncel, 1 kurulumda \(atlandı\)\./);
    });
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [v.B.id]); }
});

test("betik alt süreçte (Vercel'deki gibi --zorunlu): hepsi güncel → çıkış kodu 0; bir firma geride → çıkış kodu 1 ve o kısa ad", async () => {
  const t = await betik();
  assert.equal(t.kod, 0, t.cikti + t.hata);
  assert.match(t.cikti, /^\[göç dağıtıcı\] TAMAM: 3 veritabanı güncel, 1 kurulumda \(atlandı\)\.$/m);
  await gocKaydiOlmadan(v.A.sahip, SON.ad, async () => {
    const d = await betik();
    assert.equal(d.kod, 1, d.cikti + d.hata);
    assert.match(d.cikti, /^\[göç dağıtıcı\] firma kendi-a: GÖÇ UYUMSUZ/m);
    assert.match(d.cikti, /^\[göç dağıtıcı\] DURDU: 1 veritabanı uyumsuz/m);
  });
});

test("bütün çıktılarda SIR YOK: parolalar, ana anahtar, şifreli metinler (betiğin hata çıktısında da); denetle hiçbir koşuda merkeze yazmadı", async () => {
  const hepsi = ciktilar.join("\n");
  const hatalar = hataCiktilari.join("\n");
  assert.ok(ciktilar.length >= 12);
  const sirlar = [v.merkezKume.uygulama.password, v.ayriKume.uygulama.password, v.A.baglanti.password, v.B.baglanti.password, YANLIS, v.anahtar.toString("base64"),
    ...(await v.merkezSahip.query<{ p: string }>("SELECT parola_sifreli AS p FROM firma_vt WHERE parola_sifreli IS NOT NULL")).rows.map((x) => x.p)];
  assert.ok(sirlar.length >= 8);
  for (const s of sirlar) assert.ok(!hepsi.includes(s) && !hatalar.includes(s), "çıktıda sır");
  for (const metin of [hepsi, hatalar]) assert.doesNotMatch(metin, /v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./, "şifreli metin biçimi");
  for (const satir of hepsi.split("\n")) assert.match(satir, /^\[göç dağıtıcı\] /);
  assert.equal((await v.merkezSahip.query<{ n: number }>("SELECT count(*)::int AS n FROM firma_vt WHERE son_goc IS NOT NULL OR son_saglik IS NOT NULL")).rows[0]!.n, 0);
});
