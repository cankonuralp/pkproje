/* NEREDEN GELDİ: maket rapor.html M8 (saha raporu: Firma bilgileri künyenin kopyası + kontrol tarihleri, Ekipman bilgileri ekipman kaydından
   başlar, maddeler "Uygun" açılır, Cihaz ekle yalnız zimmetteki ve kalibrasyonu geçerli cihaz, Onaya gönder eksikleri pencerede sayar, sonuç
   seçilmediyse kriterlere göre yazılır, Sil yalnız Yeni) · planlarim.html (plan içi "Rapor oluştur", Raporlar bölümü, raporu olan ekipman pasife
   alınmaz — 203) · KOD-GECIS §4 (rapor_olustur yalnız plandaki denetçi, rapor_yaz yalnız yazan, rapor_sil yazan Yeni raporunu ya da teknik yönetici;
   Raporlar düzeyi: planlama ve firma yöneticisi görür, branş yöneticisi kendi branşını, denetçi kendi raporunu, muhasebe hiç), §5 (Yeni → Teknik
   yönetici onayında; bu kalem yalnız gönderimi açar), §9 ENGEL 1 (ileri tarihli plana rapor yok), 2 (gerekli cihaz / kalibrasyon), 5 (zorunlu
   alan), 6 (tamamlanan rapor değişmez) · RAPOR-FORMAT §5, §7 (rapor türün yayındaki sürümüyle açılır ve onunla kalır) · pkproje §3.4 "Plan künyesi"
   (planlamacının değişikliği denetçiye kendiliğinden geçmez; Güncelle yalnız kendi Yeni raporlarına) · reisim 2026-10-04: "rol değiştirme, sızma,
   veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (311). Olumsuz kanıt: tests/bozan/raporlar.bozan.ts.
   313: maket kopyala / pencereKaydet (Kaydet ve kopyala, karar 204–209, N10), format-guncelle (211), MV.gunlukSure (212, AA2; KOD-GECIS ENGEL 3). */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { degerlendir } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar } from "../src/format/tanim.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { ekipmanPasif, kunyeDuzenle, planIci, planKabul, planReddet } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { tarihNo } from "../src/modules/planlar/sema.ts";
import { taslakBaslat, taslakKaydet, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { ayEkle } from "../src/modules/raporlar/sema.ts";
import {
  cihazEkle, cihazKaldir, fotoEkle, fotoSil, onayaGonder, raporBelgesiVerisi, raporFormatGuncelle, raporKaydet, raporKopyala, raporKunyeGuncelle, raporOlustur,
  raporSil, sahaRaporu, type RaporYazma,
} from "../src/modules/raporlar/server/raporlar.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "raporlar-depo-"));
const depo = klasorDepo(klasor);
const SGK = "2".repeat(26);
const TEL = "0312 000 00 00";
const bugun = bugunTr();
/** bugünden n gün sonra (eksi: önce), "YYYY-MM-DD" */
const gun = (n: number) => new Date(Date.parse(`${bugun}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const dun = gun(-1);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const eksik = (r: RaporYazma) => { assert.equal(r.durum, "eksik", JSON.stringify(r)); return (r as Extract<RaporYazma, { durum: "eksik" }>).eksikler; };

/* KOMPRESOR şablonu (sablonlar.ts): zorunlular ekipman bilgisinde marka / imal / çalışma basıncı, ölçüm cihazı, kriter maddeleri, iki test değeri,
   sonuç (motor.ts degerlendir — sonuç Onaya gönderde eksik sayılmaz, seçilmediyse önerisi yazılır). Raporun sabit bölümleri: ekipman bilgisi (elle)
   + kontrol tarihleri (başlangıç zorunlu). */
const KOMP = SABLONLAR.KOMPRESOR.tanim;
const MADDELER = KOMP.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []));
const SONUC_BOLUMU = new Set(KOMP.bolumler.filter((b) => b.blok === "sonuc").map((b) => b.id));
/** yeni raporun cevapları: bütün maddeler cevap setinin ilk öğesiyle ("Uygun") */
const ILK_CEVAPLAR = Cevaplar.parse({ madde: Object.fromEntries(MADDELER.map((m) => [m.id, { c: "Uygun" }])) });
const girdi = () => ({
  ekipman: { marka: "Deneme Marka", model: "K-100", seri: "S-0001", imal: "2015", konum: "Kazan dairesi", amac: "Basınçlı hava", bolum: "Üretim" },
  tarih: { bas: `${dun}T09:00`, bit: `${dun}T10:30`, sonraki: gun(364), takip: null, rapor: dun },
  cevaplar: {
    alan: { marka: "Deneme Marka K-100", imal: "2015", calisma: "10" },
    madde: Object.fromEntries(MADDELER.map((m) => [m.id, { c: "Uygun" }])),
    deger: { hidro: "17", ventil: "10" }, sonuc: "uygun", yorum: "",
  },
});
/** hiçbir şey dolu değil (başlangıç zorunlu: rapor açılınca yazılır, formda hep dolu) */
const BOS_GIRDI = {
  ekipman: { marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
  tarih: { bas: `${dun}T09:00`, bit: null, sonraki: null, takip: null, rapor: null }, cevaplar: {},
};

interface Firma {
  plan: Kisi; yon: Kisi; mek: Kisi; elk: Kisi; muh: Kisi; den1: Kisi; den2: Kisi; den1P: string; den2P: string;
  tesis: string; tur: string; tur2: string; man: string; ter: string; format: string; format2: string;
  /** ekipman kodu → kimlik; cihaz kodu → kimlik */
  ekp: Record<string, string>; cihaz: Record<string, string>;
}
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', $1, $2) RETURNING id::text", [`iletisim@${ek}.example`, TEL]);
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, SGK]);
    const tesis2 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'mak-muh', '123') RETURNING id::text", [ad]);
    const k = async (eposta: string, rol: string, personel: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol);
    const den1P = await per("Deneme Bir"), den2P = await per("Deneme İki");
    const den1 = await k("den1", "denetci", den1P), den2 = await k("den2", "denetci", den2P);
    const plan = await k("plan", "planlama"), yon = await k("yon", "firma_yoneticisi"), mek = await k("mek", "mekanik_yonetici");
    const elk = await k("elk", "elektrik_yonetici"), muh = await k("muh", "muhasebe");
    /* ölçüm cihazı türleri; Hava tankı türü Manometre ister (0020 cihaz_turleri), Elektrik panosu türünün yayında formatı yok */
    const man = await q("INSERT INTO cihaz_turu (ad) VALUES ('Manometre') RETURNING id::text");
    const ter = await q("INSERT INTO cihaz_turu (ad) VALUES ('Termometre') RETURNING id::text");
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot, cihaz_turleri) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12, $1::uuid[]) RETURNING id::text", [[man]]);
    const tur2 = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    await q(`INSERT INTO ekipman (tesis_id, tur_id, kod, marka, model, seri, imal, konum, dis_kontrol, dis_sonuc, ekleyen)
      VALUES ($1, $2, 'HT-A1', 'Deneme Marka', 'K-100', 'S-0001', 2015, 'Kazan dairesi', '2025-09-01', 'Uygun', 'x') RETURNING id::text`, [tesis, tur]);
    for (const [t, tr, kod] of [[tesis, tur, "HT-A2"], [tesis, tur, "HT-A3"], [tesis, tur, "HT-A4"], [tesis, tur2, "EP-A1"], [tesis2, tur, "HT-B1"]]) {
      await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t, tr, kod]);
    }
    const ekp = Object.fromEntries((await db.sorgu<{ kod: string; id: string }>("SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
    /* cihazlar: kalibrasyon (geçerli ya da geçmiş) + zimmet (kimde: son hareket) */
    const liste: { kod: string; tur: string; gecerli: boolean; kimde: string | null }[] = [
      { kod: "MN-01", tur: man, gecerli: true, kimde: den1P }, { kod: "MN-02", tur: man, gecerli: false, kimde: den1P },
      { kod: "MN-03", tur: man, gecerli: true, kimde: den2P }, { kod: "MN-04", tur: man, gecerli: true, kimde: den1P },
      { kod: "MN-05", tur: man, gecerli: true, kimde: den1P }, { kod: "TM-01", tur: ter, gecerli: true, kimde: den1P },
    ];
    const cihaz: Record<string, string> = {};
    for (const c of liste) {
      const id = await q("INSERT INTO olcum_cihazi (kod, tur_id, marka, model, seri) VALUES ($1, $2, 'Deneme', 'M-1', $1) RETURNING id::text", [c.kod, c.tur]);
      const [tarih, bitis] = c.gecerli ? [gun(-60), gun(300)] : ["2019-01-01", "2020-01-01"];
      await q("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, $2, $3, 'Deneme Lab', $4, 'uygun') RETURNING id::text", [id, tarih, bitis, `K-${c.kod}`]);
      if (c.kimde) await q("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now()) RETURNING id::text", [id, c.kimde]);
      cihaz[c.kod] = id;
    }
    return { plan, yon, mek, elk, muh, den1, den2, den1P, den2P, tesis, tur, tur2, man, ter, ekp, cihaz };
  });
  /* Hava tankı: KOMPRESOR şablonundan yayında format (yayınlayan hesap veritabanında damgalanır → yöneticinin bağlamıyla). Elektrik panosu: yalnız taslak. */
  const { format, format2 } = await kiraciIcinde(havuz, firma, async (db) => {
    const t = tamam(await taslakBaslat(db, f.yon, f.tur, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, f.yon, t.id, t.surum, ""));
    const t2 = tamam(await taslakBaslat(db, f.yon, f.tur2, "sablon:ZPKR02", null));
    return { format: t.id, format2: t2.id };
  }, { hesapId: f.yon.id });
  return { ...f, format, format2 };
}

const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = []) => kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p));
const ici = (k: Kisi, id: string) => a(k, (db) => planIci(db, k, id));
const sr = (k: Kisi, id: string) => a(k, (db) => sahaRaporu(db, k, id));
const olustur = (k: Kisi, planId: string, ekipmanId: string) => a(k, (db) => raporOlustur(db, k, planId, ekipmanId));
const kaydet = (k: Kisi, id: string, surum: number, g: unknown) => a(k, (db) => raporKaydet(db, k, id, surum, g));
const gonder = (k: Kisi, id: string, surum: number, g: unknown) => a(k, (db) => onayaGonder(db, k, id, surum, g));
/* uydurma JPEG (tests/dosya.test.ts ile aynı yapı) — 312 fotoğraf */
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const LISTE = KOMP.bolumler.find((b) => b.blok === "liste")!.id;
const foto = (k: Kisi, id: string, surum: number, hedef: { bolum: string; madde: string | null } = { bolum: "foto", madde: null }, ad = "on.jpg", icerik = JPEG) =>
  a(k, (db) => fotoEkle(db, depo, k, A, id, surum, hedef, { ad, bayt: icerik }));
const sil = (k: Kisi, id: string, surum: number) => a(k, (db) => raporSil(db, k, id, surum));
/** raporun hareket kaydı (yalnız tetik yazar), zaman sırasıyla */
const hareketler = async (id: string) => (await sql<{ ne: string; eski: string | null; yeni: string | null; h: string | null }>(A,
  "SELECT ne, eski, yeni, hesap_id::text AS h FROM rapor_hareket WHERE rapor_id = $1 ORDER BY zaman, ne", [id])).rows.map((x) => [x.ne, x.eski, x.yeni, x.h]);

/** planlamacı tesise plan açar (ekipte verilen denetçiler, ilki den1); kabul: den1 tarafsızlık beyanıyla kabul eder */
async function yeniPlan(o: { baslangic?: string; ekip?: string[]; kabul?: boolean } = {}) {
  const bas = o.baslangic ?? bugun;
  const ekip = (o.ekip ?? [FA.den1P]).map((p, i) => ({ personel: p, isgNo: `ISG-${i + 1}`, kaydet: false }));
  const id = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bas, bitis: bas, ekip }))).id;
  if (o.kabul !== false) {
    const v = (await ici(FA.den1, id))!;
    tamam(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true)));
  }
  return id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("rapor oluştur: yalnız plandaki denetçi, kabul edilmiş planda, plandaki etkin ekipmana, ekipman başına bir rapor, türün yayındaki formatıyla; künye ve ekipman bilgisi kopyalanır, maddeler Uygun açılır, plan Denetimde olur", async () => {
  const id = await yeniPlan({ kabul: false });
  const a1 = FA.ekp["HT-A1"];
  assert.equal((await ici(FA.den1, id))!.izin.raporOlustur, false, "kabul bekleyen planda tuş yok");
  assert.deepEqual(await olustur(FA.den1, id, a1), { durum: "red", neden: "Rapor yalnız kabul edilmiş planda oluşturulur." });
  const v = (await ici(FA.den1, id))!;
  tamam(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true)));
  let p = (await ici(FA.den1, id))!;
  assert.deepEqual([p.izin.raporOlustur, p.erken, p.raporlar], [true, false, []]);
  assert.equal((await ici(FA.plan, id))!.izin.raporOlustur, false, "planlamacı rapor oluşturmaz");
  /* yetki sunucuda */
  assert.equal((await olustur(FA.plan, id, a1)).durum, "yetkisiz", "planı gören ama ekipte olmayan planlamacı");
  assert.equal((await olustur(FA.mek, id, a1)).durum, "yetkisiz", "yönetici planı görür, rapor oluşturmaz");
  assert.equal((await olustur(FA.den2, id, a1)).durum, "yok", "ekipte olmayan denetçi planı görmez");
  assert.equal((await olustur(FA.muh, id, a1)).durum, "yok");
  assert.equal((await b(FB.den1, (db) => raporOlustur(db, FB.den1, id, a1))).durum, "yok", "başka firma");
  /* ekipman ve format */
  assert.equal((await olustur(FA.den1, id, FA.ekp["HT-B1"])).durum, "yok", "planda olmayan ekipman");
  assert.equal((await olustur(FA.den1, id, "kotu")).durum, "yok");
  assert.deepEqual(await olustur(FA.den1, id, FA.ekp["EP-A1"]), { durum: "red", neden: "Bu türün yayınlanmış rapor formatı yok." }, "taslak format yetmez");
  /* oluşur */
  const r = tamam(await olustur(FA.den1, id, a1));
  const s = (await sql<{
    no: string; durum: string; plan_id: string; ekipman_id: string; tur_id: string; format_id: string; personel_id: string; hesap_id: string;
    kunye: unknown; kunye_surum: number; ekipman_bilgi: unknown; cevaplar: unknown; cihazlar: unknown; fotolar: unknown; sonuc: string | null;
    gonderildi: Date | null; bit: Date | null; revizyon: number; yakin: boolean;
  }>(A, `SELECT no, durum, plan_id::text, ekipman_id::text, tur_id::text, format_id::text, personel_id::text, hesap_id::text, kunye, kunye_surum, ekipman_bilgi,
      cevaplar, cihazlar, fotolar, sonuc, gonderildi, bit, revizyon, now() - bas < interval '10 minutes' AS yakin FROM rapor WHERE id = $1`, [r.id])).rows[0];
  assert.match(s.no, /^DA-\d{4}-\d{3,}-[0-9a-f]{5}$/, "XX-AAYY-SIRA-EK, firmanın rapor kodu");
  assert.equal(r.bildirim, `Rapor oluşturuldu: ${s.no}. Satırındaki “Raporu düzenle” saha rapor ekranını açar.`);
  assert.deepEqual([s.durum, s.revizyon, s.plan_id, s.ekipman_id, s.tur_id, s.format_id, s.personel_id, s.hesap_id],
    ["taslak", 0, id, a1, FA.tur, FA.format, FA.den1P, FA.den1.id], "türün yayındaki sürümüyle; yazan hesap veritabanından");
  assert.deepEqual(s.kunye, { firma_adi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1, Çankaya / Ankara", sgk: SGK, isg_no: "ISG-1", eposta: "iletisim@deneme-a.example", tel: TEL },
    "künye denetçinin gördüğü plan künyesi + müşterinin e-posta ve telefonu");
  assert.equal(s.kunye_surum, 0);
  assert.deepEqual(s.ekipman_bilgi, { marka: "Deneme Marka", model: "K-100", seri: "S-0001", imal: "2015", konum: "Kazan dairesi", amac: null, bolum: null },
    "ekipman bilgisi ekipman kaydından başlar");
  assert.deepEqual(s.cevaplar, ILK_CEVAPLAR, "bütün maddeler cevap setinin ilk öğesiyle açılır");
  assert.deepEqual([s.cihazlar, s.fotolar, s.sonuc, s.gonderildi, s.bit, s.yakin], [[], [], null, null, null, true], "başlangıç zamanı açılışta veritabanından");
  assert.deepEqual(await hareketler(r.id), [["olustur", null, "taslak", FA.den1.id]], "hareket kaydı tetikten");
  assert.ok((await sql(A, "SELECT 1 FROM denetim_izi WHERE ne = 'rapor.olustur' AND nesne_id = $1", [r.id])).rowCount, "denetim izi");
  /* plan: ilk rapor Denetimde yapar; Raporlar bölümünde görünür */
  p = (await ici(FA.den1, id))!;
  assert.equal(p.durum, "denetimde"); assert.ok(p.basladi);
  assert.deepEqual(p.raporlar.map((x) => [x.id, x.no, x.ekipmanId, x.durum, x.sonuc, x.surum, x.benim]),
    [[r.id, s.no, a1, "taslak", null, 0, true]]);
  assert.ok(!("hesapId" in p.raporlar[0]) && !("personelId" in p.raporlar[0]), "yazan hesap / personel kimliği istemciye gitmez");
  assert.deepEqual((await ici(FA.mek, id))!.raporlar.map((x) => [x.id, x.benim]), [[r.id, false]], "planı ve branşı gören raporları görür; yazan değil");
  /* 2026-10-05 (311 çapraz inceleme): öteki branşın yöneticisi planı görür ama raporu plan içinden de görmez; tik yine doğru */
  const elk = (await ici(FA.elk, id))!;
  assert.deepEqual([elk.raporlar, elk.raporluEkipman], [[], [a1]], "öteki branş: rapor listede yok, ekipmanın raporu olduğu bilinir");
  /* ekipman başına bir rapor (203); denetimdeki plana başka ekipman */
  assert.deepEqual(await olustur(FA.den1, id, a1), { durum: "red", neden: "Bu ekipmanın bu planda raporu var." });
  tamam(await olustur(FA.den1, id, FA.ekp["HT-A3"]));
  assert.equal((await ici(FA.den1, id))!.durum, "denetimde");
  /* Planlar: raporu olan ekipman pasife alınmaz; pasif ekipmana rapor açılmaz */
  const e1 = p.ekipman.find((x) => x.kod === "HT-A1")!, e2 = p.ekipman.find((x) => x.kod === "HT-A2")!;
  assert.deepEqual(await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, e1.id, e1.surum, true)),
    { durum: "red", neden: "HT-A1 için bu planda rapor var; raporu olan ekipman pasife alınmaz." });
  tamam(await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, e2.id, e2.surum, true)));
  try {
    assert.deepEqual(await olustur(FA.den1, id, e2.id), { durum: "red", neden: "Ekipman pasif; rapor açılamaz. Etkinleştir ile geri alınır." });
  } finally {
    tamam(await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, e2.id, e2.surum + 1, false)));
  }
});

test("ENGEL 1: ileri tarihli plana rapor açılmaz (bugün ve geçmiş açık); reddedilen plana da açılmaz", async () => {
  const a1 = FA.ekp["HT-A1"];
  const ileri = gun(3);
  const id = await yeniPlan({ baslangic: ileri });
  const p = (await ici(FA.den1, id))!;
  assert.deepEqual([p.durum, p.erken, p.izin.raporOlustur], ["kabul", true, false]);
  assert.deepEqual(await olustur(FA.den1, id, a1), {
    durum: "red",
    neden: `Plan günü ${tarihNo(ileri)} henüz gelmedi (bugün ${tarihNo(bugun)}). Rapor plan gününden itibaren oluşturulur; geçmiş günlere açık, ileri tarihe kapalı.`,
  });
  assert.equal((await ici(FA.den1, id))!.durum, "kabul", "plan denetime geçmez");
  assert.equal((await sql(A, "SELECT 1 FROM rapor WHERE plan_id = $1", [id])).rowCount, 0);
  const gecmis = await yeniPlan({ baslangic: gun(-5) });
  const g = (await ici(FA.den1, gecmis))!;
  assert.deepEqual([g.erken, g.izin.raporOlustur], [false, true]);
  tamam(await olustur(FA.den1, gecmis, a1));
  const red = await yeniPlan({ kabul: false });
  const v = (await ici(FA.den1, red))!;
  tamam(await a(FA.den1, (db) => planReddet(db, FA.den1, red, v.surum, { gerekce: "Aynı gün başka denetim" })));
  assert.deepEqual(await olustur(FA.den1, red, a1), { durum: "red", neden: "Rapor yalnız kabul edilmiş planda oluşturulur." });
});

test("saha raporu: yazan görür ve düzenler; başka denetçi, öteki branşın yöneticisi, muhasebe ve başka firma görmez; branş yöneticisi ve planlama görür, düzenlemez", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const d = (await sr(FA.den1, r.id))!;
  assert.ok(d);
  assert.deepEqual([d.durum, d.surum, d.bugun, d.gonderildi, d.formatSira], ["taslak", 0, bugun, null, 1]);
  assert.deepEqual(d.plan, { id, no: (await ici(FA.den1, id))!.kart.no, tesisAd: "Merkez", musteriKisa: "Deneme" });
  assert.deepEqual(d.ekipman, { id: FA.ekp["HT-A1"], kod: "HT-A1", onceki: { tarih: "2025-09-01", sonuc: "Uygun" } });
  assert.deepEqual(d.tur, { id: FA.tur, ad: "Hava tankı", kod: "HT", brans: "m", kontrolStd: [], periyot: 12 });
  assert.deepEqual(d.yazan, { ad: "Deneme Bir", meslek: "mak-muh", meslekMetin: null, ekipnet: "123" });
  assert.deepEqual(d.kunye, { firmaAdi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1, Çankaya / Ankara", sgk: SGK, isgNo: "ISG-1", eposta: "iletisim@deneme-a.example", tel: TEL });
  assert.deepEqual(d.kunyeFark, []);
  assert.equal(d.tanim.gorunum.baslik, "Kompresör Periyodik Kontrol Raporu", "raporun format sürümü");
  assert.deepEqual(d.cevaplar, ILK_CEVAPLAR);
  /* başlangıç: açılış zamanı, Türkiye saatiyle "YYYY-MM-DDTHH:MM" (Türkiye UTC+3) */
  const bas = (await sql<{ b: string }>(A, "SELECT to_char((bas AT TIME ZONE 'UTC') + interval '3 hours', 'YYYY-MM-DD\"T\"HH24:MI') AS b FROM rapor WHERE id = $1", [r.id])).rows[0].b;
  assert.deepEqual(d.tarih, { bas, bit: null, sonraki: null, takip: null, rapor: null });
  assert.deepEqual(d.cihazlar, [{ turId: FA.man, turAd: "Manometre", cihaz: null }], "türün gerekli cihaz türü satırı");
  const sec = (d.secilebilir[FA.man] ?? []).map((c) => c.kod);
  for (const kod of ["MN-01", "MN-04"]) assert.ok(sec.includes(kod), `${kod} zimmetinde, kalibrasyonu geçerli`);
  for (const kod of ["MN-02", "MN-03", "TM-01"]) assert.ok(!sec.includes(kod), `${kod} seçilemez (kalibrasyon geçmiş / başkasının zimmeti / başka tür)`);
  assert.equal(d.secilebilir["*"], undefined, "tür cihaz türü verdiyse yalnız o tür");
  /* 2026-10-05 (313): izne "kopyala" eklendi (Kaydet ve kopyala — yalnız yazan) */
  assert.deepEqual(d.izin, { duzenle: true, sil: true, kopyala: true });
  /* görme */
  assert.equal(await sr(FA.den2, r.id), null, "başka denetçi (Raporlar 'kendi')");
  const mek = (await sr(FA.mek, r.id))!;
  assert.deepEqual([mek.no, mek.izin.duzenle, mek.izin.sil, mek.secilebilir, mek.kunyeFark], [d.no, false, true, {}, []],
    "branş yöneticisi görür, düzenlemez (teknik yönetici Yeni'yi silebilir)");
  assert.equal(await sr(FA.elk, r.id), null, "öteki branşın yöneticisi");
  assert.deepEqual((await sr(FA.plan, r.id))!.izin, { duzenle: false, sil: false, kopyala: false }, "planlama görür");
  assert.deepEqual((await sr(FA.yon, r.id))!.izin, { duzenle: false, sil: false, kopyala: false }, "firma yöneticisi görür");
  assert.equal(await sr(FA.muh, r.id), null);
  assert.equal(await b(FB.den1, (db) => sahaRaporu(db, FB.den1, r.id)), null, "başka firma kimliği bilse de");
  assert.equal(await b(FB.yon, (db) => sahaRaporu(db, FB.yon, r.id)), null);
  assert.equal(await sr(FA.den1, "kotu"), null);
});

test("kaydet: yalnız yazan; alanlar şemadan geçer (imal yılı, başlangıç zorunlu, bitiş ≥ başlangıç); eski sürüm çakışır; cihaz ve fotoğraf sayısı istemciden alınmaz", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const g = girdi();
  assert.equal((await kaydet(FA.mek, r.id, 0, g)).durum, "yetkisiz", "branş yöneticisi görür, yazmaz");
  assert.equal((await kaydet(FA.plan, r.id, 0, g)).durum, "yetkisiz");
  assert.equal((await kaydet(FA.den2, r.id, 0, g)).durum, "yok");
  assert.equal((await kaydet(FA.muh, r.id, 0, g)).durum, "yok");
  assert.equal((await b(FB.den1, (db) => raporKaydet(db, FB.den1, r.id, 0, g))).durum, "yok");
  assert.deepEqual(await kaydet(FA.den1, r.id, 0, { ...g, ekipman: { ...g.ekipman, imal: "19x" } }),
    { durum: "gecersiz", hatalar: { "ekipman.imal": "İmal yılı 4 haneli yıl olmalı." } });
  assert.deepEqual(await kaydet(FA.den1, r.id, 0, { ...g, tarih: { ...g.tarih, bas: `${dun}T10:00`, bit: `${dun}T09:00` } }),
    { durum: "gecersiz", hatalar: { "tarih.bit": "Bitiş başlangıçtan önce." } });
  const basYok = await kaydet(FA.den1, r.id, 0, { ...g, tarih: { ...g.tarih, bas: null } });
  assert.equal(basYok.durum, "gecersiz", JSON.stringify(basYok));
  assert.deepEqual(Object.keys((basYok as Extract<RaporYazma, { durum: "gecersiz" }>).hatalar), ["tarih.bas"], "başlangıç boşaltılamaz");
  assert.equal((await sr(FA.den1, r.id))!.surum, 0, "geçersiz girdi yazılmaz");
  assert.deepEqual(await kaydet(FA.den1, r.id, 0, { ...g, ekipman: { ...g.ekipman, konum: "  Kazan   dairesi " }, cevaplar: { ...g.cevaplar, cihaz: 7, foto: { foto: 9 } } }),
    { durum: "tamam", id: r.id, bildirim: "Rapor kaydedildi." });
  assert.equal((await kaydet(FA.den1, r.id, 0, g)).durum, "cakisma", "eski sürümle yazılamaz");
  const d = (await sr(FA.den1, r.id))!;
  assert.equal(d.surum, 1);
  assert.deepEqual(d.ekipmanBilgi, g.ekipman, "boşluklar kırpılır");
  assert.deepEqual(d.tarih, { bas: `${dun}T09:00`, bit: `${dun}T10:30`, sonraki: gun(364), takip: null, rapor: dun }, "Türkiye saatiyle yazılır ve okunur");
  assert.deepEqual([d.cevaplar.cihaz, d.cevaplar.foto, d.cevaplar.sonuc, d.cevaplar.deger], [0, {}, "uygun", g.cevaplar.deger], "sayılar raporun kendi listesinden");
  const s = (await sql<{ sonuc: string; durum: string; g: Date | null }>(A, "SELECT sonuc, durum, gonderildi AS g FROM rapor WHERE id = $1", [r.id])).rows[0];
  assert.deepEqual([s.sonuc, s.durum, s.g], ["uygun", "taslak", null], "kaydet göndermez");
  assert.deepEqual((await sql<{ e: string }>(A, "SELECT marka AS e FROM ekipman WHERE id = $1", [FA.ekp["HT-A1"]])).rows.map((x) => x.e), ["Deneme Marka"],
    "raporun ekipman bilgisi ekipman kaydını değiştirmez");
  assert.ok((await sql(A, "SELECT 1 FROM denetim_izi WHERE ne = 'rapor.kaydet' AND nesne_id = $1", [r.id])).rowCount);
});

test("ölçüm cihazı: yalnız yazanın zimmetindeki, türün istediği cihaz türünden, kalibrasyonu geçerli cihaz; tür başına bir cihaz; kaldır", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const C = FA.cihaz;
  const ekle = (k: Kisi, surum: number, tur: string, cihaz: string) => a(k, (db) => cihazEkle(db, k, r.id, surum, tur, cihaz));
  const kaldir = (surum: number) => a(FA.den1, (db) => cihazKaldir(db, FA.den1, r.id, surum, FA.man));
  const LISTE = { durum: "gecersiz", hatalar: { cihaz: "Cihaz listeden seçilmeli." } };
  assert.deepEqual(await ekle(FA.den1, 0, FA.man, C["MN-03"]), { durum: "gecersiz", hatalar: { cihaz: "Cihaz raporu yazanın zimmetinde değil." } }, "başkasının zimmeti");
  assert.deepEqual(await ekle(FA.den1, 0, FA.man, C["TM-01"]), LISTE, "cihaz başka türden");
  assert.deepEqual(await ekle(FA.den1, 0, FA.ter, C["TM-01"]), LISTE, "ekipman türü bu cihaz türünü istemiyor");
  assert.deepEqual(await ekle(FA.den1, 0, "*", C["TM-01"]), LISTE, "tür cihaz türü verdiyse '*' yok");
  assert.deepEqual(await ekle(FA.den1, 0, FA.man, C["MN-02"]), { durum: "gecersiz", hatalar: { cihaz: "MN-02: kalibrasyonu geçmiş; rapora eklenmez." } });
  assert.deepEqual(await ekle(FA.den1, 0, FA.man, FB.cihaz["MN-01"]), LISTE, "başka firmanın cihazı");
  assert.equal((await ekle(FA.mek, 0, FA.man, C["MN-01"])).durum, "yetkisiz");
  assert.equal((await ekle(FA.den2, 0, FA.man, C["MN-01"])).durum, "yok");
  assert.equal((await sr(FA.den1, r.id))!.surum, 0, "reddedilen ekleme yazılmaz");
  assert.deepEqual(await ekle(FA.den1, 0, FA.man, C["MN-01"]), { durum: "tamam", id: r.id, bildirim: "MN-01 eklendi." });
  assert.deepEqual(await ekle(FA.den1, 1, FA.man, C["MN-04"]), { durum: "tamam", id: r.id, bildirim: "MN-04 eklendi." });
  assert.equal((await ekle(FA.den1, 1, FA.man, C["MN-01"])).durum, "cakisma");
  let d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(d.cihazlar.map((x) => [x.turId, x.turAd, x.cihaz?.kod, x.cihaz?.gecti, x.cihaz?.eksik]), [[FA.man, "Manometre", "MN-04", false, false]],
    "aynı türün cihazı yerine geçer");
  assert.equal(d.cevaplar.cihaz, 1);
  assert.deepEqual((await sql<{ c: unknown }>(A, "SELECT cihazlar AS c FROM rapor WHERE id = $1", [r.id])).rows[0].c, [{ tur: FA.man, cihaz: C["MN-04"] }]);
  assert.deepEqual(await kaldir(d.surum), { durum: "tamam", id: r.id, bildirim: "Cihaz kaldırıldı." });
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual([d.cihazlar, d.cevaplar.cihaz], [[{ turId: FA.man, turAd: "Manometre", cihaz: null }], 0]);
  assert.deepEqual((await sql<{ c: unknown }>(A, "SELECT cihazlar AS c FROM rapor WHERE id = $1", [r.id])).rows[0].c, []);
  assert.deepEqual(await kaldir(d.surum), { durum: "tamam", id: r.id, bildirim: "Cihaz zaten yok." });
  assert.equal((await a(FA.mek, (db) => cihazKaldir(db, FA.mek, r.id, d.surum, FA.man))).durum, "yetkisiz");
});

test("onaya gönder: eksikler (format zorunluları, gerekli ölçüm cihazı, kalibrasyon) sayılır, rapor kaydedilir ama gönderilmez; tamamsa Teknik yönetici onayında — sonuç, bitiş, sonraki kontrol, rapor tarihi seçilmediyse sunucudan, damgalar veritabanından; sonra içerik değişmez", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const C = FA.cihaz;
  assert.equal((await gonder(FA.mek, r.id, 0, girdi())).durum, "yetkisiz", "yalnız yazan gönderir");
  /* ENGEL 5 + ENGEL 2: hiçbir şey dolu değil — sonuç eksik sayılmaz (seçilmediyse önerisi yazılır) */
  const e = eksik(await gonder(FA.den1, r.id, 0, BOS_GIRDI));
  /* türün gerekli cihaz satırı varken formatın cihaz bölümünün genel eksiği ("Ölçüm cihazı eklenmedi") ayrıca sayılmaz — tek eksik, satırında */
  const CIHAZ_BOLUMU = new Set(KOMP.bolumler.filter((b) => b.blok === "cihaz").map((b) => b.id));
  const beklenen = ["Manometre: ölçüm cihazı eklenmedi", ...degerlendir(KOMP, Cevaplar.parse({})).eksikler.filter((x) => !SONUC_BOLUMU.has(x.bolum) && !CIHAZ_BOLUMU.has(x.bolum)).map((x) => x.ad)];
  assert.deepEqual(e.map((x) => x.ad).sort(), beklenen.sort());
  assert.ok(!e.some((x) => x.ad === "Ölçüm cihazı eklenmedi"), "cihaz eksiği bir kez");
  for (const ad of ["Marka / model", "İmal yılı", "Çalışma basıncı", "Hidrostatik deney basıncı", "Emniyet ventili açma basıncı", MADDELER[0].metin]) {
    assert.ok(e.some((x) => x.ad === ad), `eksik: ${ad}`);
  }
  assert.ok(!e.some((x) => x.ad === "Sonuç seçilmedi"), "sonuç eksik sayılmaz");
  assert.deepEqual(e.find((x) => x.alan === `cihaz.${FA.man}`), { bolum: "cihaz", alan: `cihaz.${FA.man}`, ad: "Manometre: ölçüm cihazı eklenmedi" });
  let d = (await sr(FA.den1, r.id))!;
  assert.deepEqual([d.durum, d.surum, d.gonderildi], ["taslak", 1, null], "eksikte rapor kaydedilir, gönderilmez");
  assert.ok(e.some((x) => x.alan === "foto" && x.ad === "En az 1 fotoğraf"), "312: fotoğraf en az 1 (şablon)");
  tamam(await foto(FA.den1, r.id, d.surum));
  d = (await sr(FA.den1, r.id))!;
  /* ENGEL 2: eklenen cihazın kalibrasyonu sonradan düştü */
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, d.surum, FA.man, C["MN-05"])));
  await sql(A, "UPDATE kalibrasyon SET kaldirildi = now() WHERE cihaz_id = $1", [C["MN-05"]]);
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(await gonder(FA.den1, r.id, d.surum, girdi()), { durum: "eksik", eksikler: [{ bolum: "cihaz", alan: `cihaz.${FA.man}`, ad: "MN-05: kalibrasyonu geçmiş" }] },
    "her şey dolu, yalnız cihazın kalibrasyonu geçmiş");
  /* tamam: sonuç, bitiş, sonraki kontrol ve rapor tarihi boş — sunucu yazar; bir madde Uygun değil → öneri Uygun değil */
  d = (await sr(FA.den1, r.id))!;
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, d.surum, FA.man, C["MN-01"])));
  d = (await sr(FA.den1, r.id))!;
  const g = girdi();
  const son = { ...g, tarih: { ...g.tarih, bit: null, sonraki: null, rapor: null }, cevaplar: { ...g.cevaplar, sonuc: "", madde: { ...g.cevaplar.madde, [MADDELER[0].id]: { c: "Uygun değil", not: "Korozyon" } } } };
  assert.equal((await gonder(FA.den1, r.id, d.surum - 1, son)).durum, "cakisma", "eski sürümle gönderilmez");
  assert.deepEqual(await gonder(FA.den1, r.id, d.surum, son),
    { durum: "tamam", id: r.id, bildirim: "Onaya gönderildi: Deneme, Mekanik branş yöneticisi. Sonuç kriterlere göre: Uygun değil." });
  const s = (await sql<{ durum: string; sonuc: string; oto: boolean; c: string; sonraki: string; rt: string; g: Date; ilk: Date; yakin: boolean }>(A,
    `SELECT durum, sonuc, sonuc_oto AS oto, cevaplar->>'sonuc' AS c, sonraki, rapor_tarihi AS rt, gonderildi AS g, ilk_gonderim AS ilk,
       now() - gonderildi < interval '10 minutes' AND now() - bit < interval '10 minutes' AS yakin FROM rapor WHERE id = $1`, [r.id])).rows[0];
  assert.deepEqual([s.durum, s.sonuc, s.oto, s.c, s.sonraki, s.rt, s.yakin], ["onayda", "uygun_degil", true, "uygun_degil", ayEkle(dun, 12), dun, true],
    "sonuç önerisi, bitiş gönderme anı, sonraki kontrol başlangıç + periyot, rapor tarihi başlangıç günü; gönderme zamanı veritabanından");
  assert.equal(s.ilk.getTime(), s.g.getTime(), "ilk gönderim");
  assert.deepEqual((await hareketler(r.id)).map((x) => x.slice(0, 3)), [["olustur", null, "taslak"], ["gonder", "taslak", "onayda"]]);
  assert.equal((await hareketler(r.id))[1][3], FA.den1.id, "gönderen hesap tetikten");
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual([d.durum, d.izin.duzenle, d.izin.sil, d.gonderildi], ["onayda", false, false, s.g.toISOString()]);
  assert.deepEqual((await ici(FA.den1, id))!.raporlar.map((x) => [x.durum, x.sonuc]), [["onayda", "uygun_degil"]]);
  assert.ok((await sql(A, "SELECT 1 FROM denetim_izi WHERE ne = 'rapor.onaya_gonder' AND nesne_id = $1", [r.id])).rowCount);
  /* gönderildi: düzenlenmez, silinmez */
  const RED = { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." };
  assert.deepEqual(await kaydet(FA.den1, r.id, d.surum, girdi()), RED);
  assert.deepEqual(await gonder(FA.den1, r.id, d.surum, girdi()), RED);
  assert.deepEqual(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, d.surum, FA.man, C["MN-04"])), RED);
  assert.deepEqual(await a(FA.den1, (db) => cihazKaldir(db, FA.den1, r.id, d.surum, FA.man)), RED);
  assert.deepEqual(await sil(FA.den1, r.id, d.surum), { durum: "red", neden: "Yalnız Yeni rapor silinir." }, "yazan yalnız Yeni raporunu siler");
  assert.deepEqual(await sil(FA.mek, r.id, d.surum), { durum: "red", neden: "Yalnız Yeni rapor silinir." }, "teknik yönetici de onaydakini silmez");
  /* veritabanı: içerik yalnız Yeni'de değişir, silme yalnız Yeni'de, gönderme zamanı uydurulamaz */
  await assert.rejects(sql(A, "UPDATE rapor SET cevaplar = '{}'::jsonb WHERE id = $1", [r.id]), /yalnız Yeni rapor düzenlenir/);
  await assert.rejects(sql(A, "UPDATE rapor SET sonuc = 'uygun', sonuc_oto = false WHERE id = $1", [r.id]), /yalnız Yeni rapor düzenlenir/);
  await assert.rejects(sql(A, "UPDATE rapor SET silindi = now() WHERE id = $1", [r.id]), /yalnız Yeni rapor silinir/);
  await sql(A, "UPDATE rapor SET gonderildi = '2000-01-01', ilk_gonderim = '2000-01-01' WHERE id = $1", [r.id]);
  const s2 = (await sql<{ g: Date; ilk: Date }>(A, "SELECT gonderildi AS g, ilk_gonderim AS ilk FROM rapor WHERE id = $1", [r.id])).rows[0];
  assert.deepEqual([s2.g.getTime(), s2.ilk.getTime()], [s.g.getTime(), s.ilk.getTime()], "gönderme zamanı elle değişmez");
});

test("onaya gönder: sonuç elle seçildiyse o yazılır (öneri değil), elle seçilen tarihler korunur", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, 0, FA.man, FA.cihaz["MN-01"])));
  tamam(await foto(FA.den1, r.id, 1));
  const g = girdi();
  const el = { ...g, cevaplar: { ...g.cevaplar, sonuc: "uygun", madde: { ...g.cevaplar.madde, [MADDELER[0].id]: { c: "Uygun değil" } } } };
  /* 312 (§3.8-5): "Uygun değil" maddenin açıklaması zorunlu */
  assert.deepEqual(await gonder(FA.den1, r.id, 2, el), { durum: "eksik", eksikler: [{ bolum: LISTE, alan: `${MADDELER[0].id}.not`, ad: `${MADDELER[0].metin} · kusur açıklaması` }] });
  el.cevaplar.madde[MADDELER[0].id] = { c: "Uygun değil", not: "Korozyon" } as never;
  assert.deepEqual(await gonder(FA.den1, r.id, 3, el), { durum: "tamam", id: r.id, bildirim: "Onaya gönderildi: Deneme, Mekanik branş yöneticisi." });
  const s = (await sql<{ sonuc: string; oto: boolean; sonraki: string; rt: string }>(A,
    "SELECT sonuc, sonuc_oto AS oto, sonraki, rapor_tarihi AS rt FROM rapor WHERE id = $1", [r.id])).rows[0];
  assert.deepEqual([s.sonuc, s.oto, s.sonraki, s.rt], ["uygun", false, gun(364), dun], "denetçinin kararı; uyarı engel değil");
  assert.deepEqual((await sr(FA.den1, r.id))!.tarih, { bas: `${dun}T09:00`, bit: `${dun}T10:30`, sonraki: gun(364), takip: null, rapor: dun });
});

test("sil: yazan Yeni raporunu, teknik yönetici (türün branşı) Yeni raporu siler; silinen görünmez, değişmez, veri kalır; ekipmana yeni rapor açılır; damga veritabanından", async () => {
  const id = await yeniPlan();
  const a1 = FA.ekp["HT-A1"];
  const r = tamam(await olustur(FA.den1, id, a1));
  const no = (await sr(FA.den1, r.id))!.no;
  assert.equal((await sil(FA.plan, r.id, 0)).durum, "yetkisiz", "planlama görür, silmez");
  assert.equal((await sil(FA.yon, r.id, 0)).durum, "yetkisiz", "firma yöneticisi teknik yönetici değil");
  assert.equal((await sil(FA.elk, r.id, 0)).durum, "yok", "öteki branşın yöneticisi görmez");
  assert.equal((await sil(FA.den2, r.id, 0)).durum, "yok");
  assert.equal((await b(FB.den1, (db) => raporSil(db, FB.den1, r.id, 0))).durum, "yok");
  assert.equal((await sil(FA.den1, r.id, 5)).durum, "cakisma");
  assert.deepEqual(await sil(FA.den1, r.id, 0), { durum: "tamam", id: r.id, bildirim: `${no} silindi.` });
  const s = (await sql<{ durum: string; yakin: boolean }>(A, "SELECT durum, now() - silindi < interval '10 minutes' AS yakin FROM rapor WHERE id = $1", [r.id])).rows[0];
  assert.deepEqual([s.durum, s.yakin], ["taslak", true], "veri silinmez, damga");
  assert.deepEqual((await hareketler(r.id)).map((x) => x[0]), ["olustur", "sil"]);
  assert.equal(await sr(FA.den1, r.id), null);
  assert.equal(await sr(FA.mek, r.id), null);
  assert.equal((await kaydet(FA.den1, r.id, 1, girdi())).durum, "yok");
  assert.equal((await sil(FA.den1, r.id, 1)).durum, "yok", "ikinci kez silinmez");
  assert.deepEqual((await ici(FA.den1, id))!.raporlar, [], "plan içinde görünmez");
  await assert.rejects(sql(A, "UPDATE rapor SET sonuc = 'uygun' WHERE id = $1", [r.id]), /silinen rapor değişmez/);
  /* aynı ekipmana yeni rapor; teknik yönetici siler */
  const r2 = tamam(await olustur(FA.den1, id, a1));
  assert.notEqual(r2.id, r.id);
  const no2 = (await sql<{ no: string }>(A, "SELECT no FROM rapor WHERE id = $1", [r2.id])).rows[0].no;
  assert.deepEqual(await sil(FA.mek, r2.id, 0), { durum: "tamam", id: r2.id, bildirim: `${no2} silindi.` });
  /* veritabanı: silme zamanı uydurulamaz */
  const r3 = tamam(await olustur(FA.den1, id, a1));
  await sql(A, "UPDATE rapor SET silindi = '2000-01-01' WHERE id = $1", [r3.id]);
  assert.equal((await sql<{ yakin: boolean }>(A, "SELECT now() - silindi < interval '10 minutes' AS yakin FROM rapor WHERE id = $1", [r3.id])).rows[0].yakin, true);
  assert.equal((await sql(A, "SELECT 1 FROM rapor WHERE plan_id = $1 AND ekipman_id = $2", [id, a1])).rowCount, 3, "hiçbiri silinmedi");
});

test("künye: rapor denetçinin gördüğü künyeyle açılır; planlamacı değiştirince fark görünür; Güncelle yalnız yazanın Yeni raporlarına geçer", async () => {
  const id = await yeniPlan({ ekip: [FA.den1P, FA.den2P] });
  const r1 = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const r2 = tamam(await olustur(FA.den1, id, FA.ekp["HT-A2"]));
  const r3 = tamam(await olustur(FA.den2, id, FA.ekp["HT-A3"]));
  await sql(A, "UPDATE rapor SET durum = 'onayda' WHERE id = $1", [r2.id]);
  const v = (await ici(FA.plan, id))!;
  tamam(await a(FA.plan, (db) => kunyeDuzenle(db, FA.plan, id, v.surum, { firmaAdi: "Yeni Ünvan A.Ş.", adres: "Yeni Cad. 2", sgk: "", isg: { [FA.den1P]: "ISG-YENI" } })));
  const d1 = (await sr(FA.den1, r1.id))!;
  assert.equal(d1.kunye.firmaAdi, "Deneme Sanayi A.Ş.", "raporun künyesi kendiliğinden değişmez");
  assert.deepEqual(d1.kunyeFark, ["Firma adı", "Adres", "SGK DETSİS NO", "İSG-KATİP SÖZLEŞME ID"]);
  assert.deepEqual((await sr(FA.den2, r3.id))!.kunyeFark, ["Firma adı", "Adres", "SGK DETSİS NO"], "her denetçi kendi İSG-KATİP ID'siyle");
  assert.deepEqual((await sr(FA.plan, r1.id))!.kunyeFark, [], "fark yalnız yazana");
  /* Güncelle'siz açılan rapor da denetçinin gördüğü (eski) künyeyle */
  const r4 = tamam(await olustur(FA.den2, id, FA.ekp["HT-A4"]));
  assert.equal((await a(FA.mek, (db) => raporKunyeGuncelle(db, FA.mek, r1.id))).durum, "yetkisiz");
  assert.equal((await a(FA.den2, (db) => raporKunyeGuncelle(db, FA.den2, r1.id))).durum, "yok");
  assert.deepEqual(await a(FA.den1, (db) => raporKunyeGuncelle(db, FA.den1, r1.id)),
    { durum: "tamam", id: r1.id, bildirim: "Plan bilgileri güncellendi; 1 taslak raporunuza da geçti." });
  const g = (await sr(FA.den1, r1.id))!;
  assert.deepEqual(g.kunye, { firmaAdi: "Yeni Ünvan A.Ş.", adres: "Yeni Cad. 2", sgk: null, isgNo: "ISG-YENI", eposta: "iletisim@deneme-a.example", tel: TEL },
    "e-posta ve telefon raporun kendi kopyasında kalır");
  assert.deepEqual(g.kunyeFark, []);
  assert.equal((await ici(FA.den1, id))!.kunye.firmaAdi, "Yeni Ünvan A.Ş.", "plan ekranına da geçti");
  const k = (await sql<{ id: string; f: string; s: number }>(A, "SELECT id::text, kunye->>'firma_adi' AS f, kunye_surum AS s FROM rapor WHERE plan_id = $1", [id])).rows;
  const bul = (x: string) => { const y = k.find((z) => z.id === x)!; return [y.f, y.s]; };
  assert.deepEqual(bul(r1.id), ["Yeni Ünvan A.Ş.", 1]);
  assert.deepEqual(bul(r2.id), ["Deneme Sanayi A.Ş.", 0], "onaydaki rapor açıldığı künyeyle kalır");
  assert.deepEqual(bul(r3.id), ["Deneme Sanayi A.Ş.", 0], "başka denetçinin raporu değişmez");
  assert.deepEqual(bul(r4.id), ["Deneme Sanayi A.Ş.", 0], "Güncelle'siz açılan rapor eski künyeyle");
  assert.deepEqual(await a(FA.den1, (db) => raporKunyeGuncelle(db, FA.den1, r1.id)), { durum: "tamam", id: r1.id, bildirim: "Plan bilgileri zaten güncel." });
});

test("veritabanı: rapor Yeni açılır, türün yayındaki formatıyla, plandaki etkin ekipmana, kabul edilmiş planda ekipteki denetçi adına; plan × ekipman tek rapor; bu kalemde yalnız gönderim geçişi; tamamlanan değişmez; numara / plan / yazan değişmez; hareket kaydı elle yazılmaz; silme hakkı yok; B göremez", async () => {
  const id = await yeniPlan();
  let n = 0;
  const ham = (d: { plan?: string; ekipman?: string; format?: string; personel?: string; durum?: string; hesap?: string }, hesapId?: string) =>
    kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
      `INSERT INTO rapor (no, plan_id, ekipman_id, tur_id, format_id, personel_id, durum, kunye, hesap_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9) RETURNING id::text`,
      [`DA-1010-${900 + n++}-abcde`, d.plan ?? id, d.ekipman ?? FA.ekp["HT-A1"], FA.tur, d.format ?? FA.format, d.personel ?? FA.den1P, d.durum ?? "taslak",
        JSON.stringify({ firma_adi: "Deneme" }), d.hesap ?? null]), hesapId ? { hesapId } : {});
  await assert.rejects(ham({ durum: "onayda" }), /"Yeni" açılır/);
  await assert.rejects(ham({ format: FA.format2 }), /yayındaki formatıyla/, "başka türün formatı");
  const taslak = tamam(await a(FA.yon, (db) => taslakBaslat(db, FA.yon, FA.tur, `surum:${FA.format}`, null))).id;
  await assert.rejects(ham({ format: taslak }), /yayındaki formatıyla/, "türün taslak sürümü");
  await assert.rejects(ham({ ekipman: FA.ekp["HT-B1"] }), /planda değil/, "planda olmayan ekipman");
  await assert.rejects(ham({ ekipman: FA.ekp["EP-A1"] }), /türü uymuyor/, "plandaki ekipmanın türü raporun türü değil");
  await sql(A, "UPDATE ekipman SET pasif = now() WHERE id = $1", [FA.ekp["HT-A4"]]);
  try {
    await assert.rejects(ham({ ekipman: FA.ekp["HT-A4"] }), /pasif/, "pasif ekipman");
  } finally { await sql(A, "UPDATE ekipman SET pasif = NULL WHERE id = $1", [FA.ekp["HT-A4"]]); }
  await assert.rejects(ham({ personel: FA.den2P }), /ekipteki denetçi adına/, "ekipte olmayan denetçi adına");
  await assert.rejects(ham({ plan: await yeniPlan({ kabul: false }) }), /kabul edilmiş planda/, "kabul bekleyen plan");
  const x = (await ham({ hesap: FA.yon.id }, FA.den1.id)).rows[0].id;
  assert.equal((await sql<{ h: string }>(A, "SELECT hesap_id::text AS h FROM rapor WHERE id = $1", [x])).rows[0].h, FA.den1.id, "yazan hesap uydurulamaz");
  await assert.rejects(ham({}), /rapor_plan_ekipman/, "plan × ekipman başına tek etkin rapor");
  const deg = (set: string, p: unknown[] = []) => sql(A, `UPDATE rapor SET ${set} WHERE id = $1`, [x, ...p]);
  await assert.rejects(deg("no = 'DA-1010-999-abcde'"), /değişmez/);
  await assert.rejects(deg("plan_id = gen_random_uuid()"), /değişmez/);
  await assert.rejects(deg("personel_id = $2", [FA.den2P]), /değişmez/);
  await assert.rejects(deg("hesap_id = $2", [FA.yon.id]), /değişmez/);
  await assert.rejects(deg("revizyon = 1"), /değişmez/);
  await assert.rejects(deg("format_id = $2", [FA.format2]), /daha yeni yayınlanmış/);
  await assert.rejects(deg("format_id = $2", [taslak]), /daha yeni yayınlanmış/, "taslak sürüme geçilmez");
  /* geçişler: 311'de yalnız Yeni → onayda açıktı; 2026-10-05 (314, göç 0026) Yeni · onayda · onaylandı arası açıldı (onay, geri gönder,
     durumu değiştir — tests/onaylar.test.ts). Tamamlandı'ya ve imzaya yalnız imza kalemiyle. */
  await assert.rejects(deg("durum = 'imzali'"), /taslak durumundan imzali durumuna geçemez/);
  await assert.rejects(deg("durum = 'imzada'"), /geçemez/);
  await deg("durum = 'onayda'");
  const s = (await sql<{ g: Date | null; ilk: Date | null }>(A, "SELECT gonderildi AS g, ilk_gonderim AS ilk FROM rapor WHERE id = $1", [x])).rows[0];
  assert.ok(s.g && s.ilk, "gönderme zamanı geçişte damgalanır");
  assert.deepEqual((await hareketler(x)).map((y) => y.slice(0, 3)), [["olustur", null, "taslak"], ["gonder", "taslak", "onayda"]]);
  await assert.rejects(deg("ekipman_bilgi = '{\"marka\": \"x\"}'::jsonb"), /yalnız Yeni rapor düzenlenir/);
  await assert.rejects(deg("durum = 'imzali'"), /onayda durumundan imzali durumuna geçemez/);
  await assert.rejects(deg("durum = 'taslak'"), /gerekçe en az 10/, "Yeni'ye dönüş gerekçesiz olmaz (0026)");
  /* tamamlanan (imzalı) rapor değişmez (ENGEL 6): o duruma geçiş sonraki kalemlerde — burada tetiksiz verilir */
  const su = kume.sahipIstemci(); await su.connect();
  try {
    await su.query("SET session_replication_role = replica");
    await su.query("UPDATE rapor SET durum = 'imzali', onay = now() WHERE id = $1", [x]);   // 0026: imzalı raporda onay damgası var (CHECK)
  } finally { await su.end(); }
  await assert.rejects(deg("durum = 'onayda'"), /tamamlanan rapor değişmez/);
  await assert.rejects(deg("sonuc = 'uygun'"), /tamamlanan rapor değişmez/);
  await assert.rejects(deg("kunye = kunye"), /tamamlanan rapor değişmez/);
  /* hareket kaydı yalnız tetikten; değişmez */
  await assert.rejects(sql(A, "INSERT INTO rapor_hareket (rapor_id, ne) VALUES ($1, 'gonder')", [x]), /elle yazılmaz/);
  await assert.rejects(sql(A, "UPDATE rapor_hareket SET ne = 'sil' WHERE rapor_id = $1", [x]), /permission denied|izin/i);
  await assert.rejects(sql(A, "DELETE FROM rapor_hareket WHERE rapor_id = $1", [x]), /permission denied|izin/i);
  /* kiracı ve hak */
  assert.equal((await sql(B, "SELECT 1 FROM rapor WHERE id = $1", [x])).rowCount, 0);
  assert.equal((await sql(B, "SELECT 1 FROM rapor_hareket WHERE rapor_id = $1", [x])).rowCount, 0);
  assert.equal((await sql(B, "UPDATE rapor SET sonuc = 'uygun' WHERE id = $1", [x])).rowCount, 0);
  await assert.rejects(kiraciIcinde(havuz, B, (db) => db.sorgu(
    "INSERT INTO rapor (no, plan_id, ekipman_id, tur_id, format_id, personel_id, kunye) VALUES ('DB-1010-900-abcde', $1, $2, $3, $4, $5, '{}'::jsonb)",
    [id, FA.ekp["HT-A1"], FA.tur, FA.format, FB.den1P])), /yayındaki formatıyla/, "B, A'nın planına rapor yazamaz");
  await assert.rejects(sql(A, "DELETE FROM rapor WHERE id = $1", [x]), /permission denied|izin/i);
});

test("KİRACI + ROL: B'nin kişisi A'nın raporunda hiçbir şey yapamaz; Raporlar kapatılınca ya da rol düşünce rapor görünmez; sahte rol bir şey vermez", async () => {
  const id = await yeniPlan();
  const a1 = FA.ekp["HT-A1"];
  const r = tamam(await olustur(FA.den1, id, a1));
  const g = girdi(), bk = FB.den1;
  assert.equal(await b(bk, (db) => sahaRaporu(db, bk, r.id)), null);
  const isler: ((db: Sorgulayici) => Promise<RaporYazma>)[] = [
    (db) => raporOlustur(db, bk, id, a1), (db) => raporKaydet(db, bk, r.id, 0, g), (db) => onayaGonder(db, bk, r.id, 0, g),
    (db) => cihazEkle(db, bk, r.id, 0, FA.man, FA.cihaz["MN-01"]), (db) => cihazKaldir(db, bk, r.id, 0, FA.man), (db) => raporSil(db, bk, r.id, 0),
    (db) => raporKunyeGuncelle(db, bk, r.id),
  ];
  for (const is of isler) assert.equal((await b(bk, is)).durum, "yok");
  /* rol düzeni: firma denetçiye Raporlar'ı kapatınca yazdığı raporu da görmez, yazamaz */
  const KAPALI: Kisi = { ...FA.den1, matris: { ...MATRIS_ONERI, 14: ["gor", "yok", "brans", "brans", "gor", "yok"] } as never };
  assert.equal(await a(KAPALI, (db) => sahaRaporu(db, KAPALI, r.id)), null);
  assert.equal((await a(KAPALI, (db) => raporKaydet(db, KAPALI, r.id, 0, g))).durum, "yok");
  assert.equal((await a(KAPALI, (db) => raporOlustur(db, KAPALI, id, FA.ekp["HT-A2"]))).durum, "yetkisiz", "Raporlar'ı göremeyen rapor açamaz (planı görse de)");
  /* aynı hesabın rolü muhasebeye çevrilince */
  const MUH: Kisi = { ...FA.den1, roller: ["muhasebe"] };
  assert.equal(await a(MUH, (db) => sahaRaporu(db, MUH, r.id)), null);
  assert.equal((await a(MUH, (db) => raporKaydet(db, MUH, r.id, 0, g))).durum, "yok");
  assert.equal((await a(MUH, (db) => raporOlustur(db, MUH, id, FA.ekp["HT-A2"]))).durum, "yok");
  const SAHTE: Kisi = { ...FA.den1, roller: ["admin", "__proto__"] as never };
  assert.equal(await a(SAHTE, (db) => sahaRaporu(db, SAHTE, r.id)), null);
  assert.equal((await a(SAHTE, (db) => onayaGonder(db, SAHTE, r.id, 0, g))).durum, "yok");
  assert.equal((await a(SAHTE, (db) => raporOlustur(db, SAHTE, id, FA.ekp["HT-A2"]))).durum, "yok");
  /* yönetici, hesabı yazanmış gibi davranamaz: sahiplik veritabanındaki yazan hesaptan */
  assert.equal((await a(FA.mek, (db) => raporKaydet(db, FA.mek, r.id, 0, g))).durum, "yetkisiz");
  const d = (await sr(FA.den1, r.id))!;
  assert.deepEqual([d.surum, d.durum], [0, "taslak"], "hiçbir şey yazılmadı");
  assert.equal((await sql(A, "SELECT 1 FROM rapor WHERE plan_id = $1", [id])).rowCount, 1);
});

/* 2026-10-05 (312; maket fotoMenu / fotoSil; 09-A1, A2, A4; pkproje §3.8-5, O2): fotoğraf yalnız yazanın Yeni raporuna, formatın fotoğraf bölümüne
   ya da kontrol maddesine eklenir; tür baytlardan (JPEG / PNG); sayılar raporun listesinden; dosyayı yalnız raporu gören indirir; silinen çöpe. */
test("fotoğraf: yer, tür, yetki; bölüm ve madde sayıları sunucuda; dosyayı raporu gören indirir; silinen indirilemez; gönderilmiş rapora eklenmez", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  assert.deepEqual(await foto(FA.den1, r.id, 0), { durum: "tamam", id: r.id, bildirim: "on.jpg eklendi." });
  assert.equal((await foto(FA.den1, r.id, 0)).durum, "cakisma", "eski sürümle eklenmez");
  let d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(d.fotolar.map((f) => [f.ad, f.bolum, f.madde]), [["on.jpg", "foto", null]]);
  assert.deepEqual(d.cevaplar.foto, { foto: 1 });
  const dosya = d.fotolar[0].dosya;
  /* yer ve tür */
  assert.deepEqual(await foto(FA.den1, r.id, d.surum, { bolum: "yok", madde: null }), { durum: "gecersiz", hatalar: { foto: "Fotoğrafın yeri bulunamadı." } });
  assert.deepEqual(await foto(FA.den1, r.id, d.surum, { bolum: LISTE, madde: "yok_madde" }), { durum: "gecersiz", hatalar: { foto: "Fotoğrafın yeri bulunamadı." } });
  assert.deepEqual(await foto(FA.den1, r.id, d.surum, undefined, "x.pdf", new TextEncoder().encode("%PDF-1.4 deneme")), { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } });
  /* maddeye fotoğraf (O2) */
  tamam(await foto(FA.den1, r.id, d.surum, { bolum: LISTE, madde: MADDELER[0].id }, "korozyon.jpg"));
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(d.fotolar.map((f) => [f.ad, f.madde]), [["on.jpg", null], ["korozyon.jpg", MADDELER[0].id]]);
  assert.deepEqual(d.cevaplar.foto, { foto: 1 }, "maddenin fotoğrafı bölüm sayısına girmez");
  /* yetki: başka denetçi görmez; branş yöneticisi görür, ekleyemez; B yok */
  assert.equal((await foto(FA.den2, r.id, d.surum)).durum, "yok");
  assert.equal((await foto(FA.mek, r.id, d.surum)).durum, "yetkisiz");
  assert.equal((await b(FB.den1, (db) => fotoEkle(db, depo, FB.den1, B, r.id, d.surum, { bolum: "foto", madde: null }, { ad: "x.jpg", bayt: JPEG }))).durum, "yok");
  /* indirme: raporu gören (yazan, branş yöneticisi) evet; öteki branş ve başka denetçi hayır; başka firma hiç */
  const indir = (k: Kisi) => a(k, (db) => dosyaIndirilebilir(db, k, dosya, DOSYA_ERISIMI));
  assert.ok(await indir(FA.den1)); assert.ok(await indir(FA.mek));
  assert.equal(await indir(FA.elk), null); assert.equal(await indir(FA.den2), null);
  assert.equal(await b(FB.den1, (db) => dosyaIndirilebilir(db, FB.den1, dosya, DOSYA_ERISIMI)), null);
  /* sil: listeden çıkar, dosya çöpe — indirilemez */
  assert.equal((await a(FA.mek, (db) => fotoSil(db, FA.mek, r.id, d.surum, dosya))).durum, "yetkisiz");
  assert.deepEqual(await a(FA.den1, (db) => fotoSil(db, FA.den1, r.id, d.surum, dosya)), { durum: "tamam", id: r.id, bildirim: "on.jpg silindi." });
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual([d.fotolar.length, d.cevaplar.foto], [1, {}]);
  assert.equal(await indir(FA.den1), null, "çöpteki dosya indirilmez");
  assert.ok((await sql(A, "SELECT 1 FROM dosya WHERE id = $1 AND cop IS NOT NULL", [dosya])).rowCount, "dosya silinmez, çöpe alınır");
  /* gönderilmiş rapora fotoğraf eklenmez */
  tamam(await foto(FA.den1, r.id, d.surum));
  d = (await sr(FA.den1, r.id))!;
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, d.surum, FA.man, FA.cihaz["MN-01"])));
  d = (await sr(FA.den1, r.id))!;
  const g = girdi();
  tamam(await gonder(FA.den1, r.id, d.surum, { ...g, cevaplar: { ...g.cevaplar, madde: { ...g.cevaplar.madde, [MADDELER[0].id]: { c: "Uygun değil", not: "Korozyon" } } } }));
  d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(await foto(FA.den1, r.id, d.surum), { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." });
});

/* 2026-10-05 (313; maket kopyala, pencereKaydet; karar 204–209, N10): Kaydet ve kopyala yalnız yazanın; kod Planlar'ın kod denetiminden; engel varken
   rapor kaydedilmez; kopyalanan / kopyalanmayan alanlar 206–207; gönderilmiş raporda "Kopyala" (kayıt yok). */
const kopyala = (k: Kisi, id: string, surum: number, g: unknown, kayit: unknown = null) => a(k, (db) => raporKopyala(db, k, id, surum, g, kayit));
const kodHatasi = (r: RaporYazma) => { assert.equal(r.durum, "gecersiz", JSON.stringify(r)); return (r as Extract<RaporYazma, { durum: "gecersiz" }>).hatalar.kod; };

test("kaydet ve kopyala: yalnız yazan; Yeni rapor önce kaydedilir; yeni ekipman tesise ve plana (sonradan); kopya Yeni, güncel formatla; ekipman bilgileri, bilgi alanları, cihazlar, madde seçimleri kopyalanır — açıklama, test değerleri, fotoğraflar, sonuç, yorum kopyalanmaz; gönderilmiş raporda Kopyala", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A3"]));
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r.id, 0, FA.man, FA.cihaz["MN-01"])));
  tamam(await foto(FA.den1, r.id, 1));
  const g = girdi();
  const kayit = {
    ...g, ekipman: { ...g.ekipman, marka: "Kopya Marka" },
    cevaplar: { ...g.cevaplar, yorum: "Deneme notu", madde: { ...g.cevaplar.madde, [MADDELER[0].id]: { c: "Uygun değil", not: "Korozyon", derece: "agir" } } },
  };
  /* kod (plan içi Ekipman ekle ile aynı denetim); engel varken rapor kaydedilmez */
  assert.equal(kodHatasi(await kopyala(FA.den1, r.id, 2, { kod: "", konum: null }, kayit)), "Etiketteki kodu yazın: harf (A–Z), rakam ve tire. Kod firmada eşsiz olmalı.");
  assert.equal(kodHatasi(await kopyala(FA.den1, r.id, 2, { kod: "a b", konum: null }, kayit)), "Kod 3 ile 20 hane arasında olmalı.");
  assert.match(kodHatasi(await kopyala(FA.den1, r.id, 2, { kod: "ht-a2", konum: null }, kayit)), /^HT-A2 bu planda zaten var/);
  assert.match(kodHatasi(await kopyala(FA.den1, r.id, 2, { kod: "HT-B1", konum: null }, kayit)), /^HT-B1 başka bir tesiste kayıtlı/);
  assert.equal((await sr(FA.den1, r.id))!.surum, 2, "engel varken rapor kaydedilmedi");
  /* yetki sunucuda: başka denetçi görmez, branş yöneticisi ve planlama görür ama kopyalamaz, başka firma yok */
  assert.equal((await kopyala(FA.den2, r.id, 2, { kod: "HT-K1", konum: null })).durum, "yok");
  assert.equal((await kopyala(FA.mek, r.id, 2, { kod: "HT-K1", konum: null })).durum, "yetkisiz");
  assert.equal((await kopyala(FA.plan, r.id, 2, { kod: "HT-K1", konum: null })).durum, "yetkisiz");
  assert.equal((await b(FB.den1, (db) => raporKopyala(db, FB.den1, r.id, 2, { kod: "HT-K1", konum: null }, null))).durum, "yok");
  assert.deepEqual([(await sr(FA.den1, r.id))!.izin.kopyala, (await sr(FA.mek, r.id))!.izin.kopyala], [true, false]);
  /* eski sürümle kayıt çakışır — ekipman da açılmaz */
  assert.equal((await kopyala(FA.den1, r.id, 1, { kod: "HT-K1", konum: null }, kayit)).durum, "cakisma");
  assert.equal((await sql(A, "SELECT 1 FROM ekipman WHERE kod = 'HT-K1'")).rowCount, 0);
  /* kopya */
  const k = tamam(await kopyala(FA.den1, r.id, 2, { kod: "ht-k1", konum: "Arka bahçe" }, kayit));
  const no = (await sql<{ no: string }>(A, "SELECT no FROM rapor WHERE id = $1", [k.id])).rows[0].no;
  assert.equal(k.bildirim, `Rapor kaydedildi; HT-K1 açıldı: ${no}. Bilgiler HT-A3 raporundan kopyalandı.`);
  const kaynak = (await sr(FA.den1, r.id))!;
  assert.deepEqual([kaynak.surum, kaynak.ekipmanBilgi.marka, kaynak.cevaplar.yorum, kaynak.kopyaKaynak], [3, "Kopya Marka", "Deneme notu", null], "kaynak önce kaydedildi");
  const y = (await sr(FA.den1, k.id))!;
  assert.deepEqual([y.durum, y.ekipman.kod, y.kopyaKaynak, y.surum, y.izin.duzenle, y.formatSira], ["taslak", "HT-K1", kaynak.no, 0, true, kaynak.formatSira]);
  assert.deepEqual(y.ekipmanBilgi, { ...kayit.ekipman, seri: null, konum: "Arka bahçe" }, "ekipman bilgileri kaynaktan; seri no yeni ekipmanın, kullanım yeri pencereden");
  assert.deepEqual(y.cevaplar.alan, g.cevaplar.alan, "bilgi alanları (ekipman detayları) kopyalandı");
  assert.deepEqual(y.cevaplar.madde[MADDELER[0].id], { c: "Uygun değil" }, "madde seçimi kopyalanır; açıklama ve derece kopyalanmaz");
  assert.deepEqual(y.cevaplar.madde[MADDELER[1].id], { c: "Uygun" });
  assert.deepEqual([y.cevaplar.deger, y.cevaplar.tablo, y.cevaplar.sonuc, y.cevaplar.yorum, y.cevaplar.foto, y.fotolar], [{}, {}, "", "", {}, []]);
  assert.deepEqual(y.cihazlar.map((x) => x.cihaz?.kod), ["MN-01"], "ölçüm cihazları kopyalandı");
  assert.deepEqual(y.kunye, kaynak.kunye, "kopya kaynağın künyesiyle açılır");
  /* yeni ekipman: tesiste kalıcı kayıt, plana sonradan; tür aynı */
  const e = (await sql<{ konum: string; tur: string; tesis: string; sonradan: boolean }>(A, `SELECT e.konum, e.tur_id::text AS tur, e.tesis_id::text AS tesis, pe.sonradan
    FROM ekipman e JOIN plan_ekipman pe ON pe.ekipman_id = e.id AND pe.plan_id = $1 WHERE e.kod = 'HT-K1'`, [id])).rows[0];
  assert.deepEqual({ ...e }, { konum: "Arka bahçe", tur: FA.tur, tesis: FA.tesis, sonradan: true });
  assert.deepEqual((await sql<{ k: string }>(A, "SELECT kopya_kaynak::text AS k FROM rapor WHERE id = $1", [k.id])).rows[0].k, r.id);
  /* aynı kod ikinci kez verilmez */
  assert.match(kodHatasi(await kopyala(FA.den1, r.id, 3, { kod: "HT-K1", konum: null }, null)), /^HT-K1 bu planda zaten var/);
  /* gönderilmiş raporda "Kopyala": kayıt yok, bölüm boşsa kaynaktaki */
  tamam(await gonder(FA.den1, r.id, 3, kayit));
  const s2 = (await sr(FA.den1, r.id))!;
  assert.deepEqual([s2.durum, s2.izin.duzenle, s2.izin.kopyala], ["onayda", false, true]);
  const k2 = tamam(await kopyala(FA.den1, r.id, s2.surum, { kod: "HT-K2", konum: null }, { ...kayit, ekipman: { ...kayit.ekipman, marka: "Yazılmaz" } }));
  assert.match(k2.bildirim, /^HT-K2 açıldı: DA-\d{4}-\d{3,}-[0-9a-f]{5}\. Bilgiler HT-A3 raporundan kopyalandı\.$/);
  const y2 = (await sr(FA.den1, k2.id))!;
  assert.deepEqual([y2.ekipmanBilgi.konum, y2.ekipmanBilgi.marka, (await sr(FA.den1, r.id))!.surum], ["Kazan dairesi", "Kopya Marka", s2.surum], "gönderilmiş rapor değişmez");
  /* kopyanın kopyası: kaynak kopyanın kendisi */
  const k3 = tamam(await kopyala(FA.den1, k.id, 0, { kod: "HT-K3", konum: null }, null));
  assert.equal((await sr(FA.den1, k3.id))!.kopyaKaynak, no);
});

/* 2026-10-05 (313; maket MV.gunlukSure, plan içi "a-mesai-sebep", rapor ekranı "r-mesai-sebep"; 212, AA2; KOD-GECIS ENGEL 3): günlük süre = denetçinin
   bugün açtığı, silinmemiş raporlarının tür süreleri; hak = günlük mesai ile yıllık kalan fazla çalışmanın küçüğü. */
test("ENGEL 3 günlük süre: mesai açıkken bugünkü raporların tür süreleri normal + hakkı doldurunca yeni rapor ve kopya açılmaz; hak yıllık kalan fazla çalışmayla sınırlı; silinen sayılmaz; kapalıyken sınır yok", async () => {
  /* ayrı denetçi: öteki testlerin bugünkü raporları sayılmasın */
  const [P3, H3] = await kiraciIcinde(havuz, A, async (db) => {
    const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Üç', '2024-01-01', 'mak-muh', '123') RETURNING id::text")).rows[0].id;
    const h = (await db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('den3@deneme-a.example', 'Deneme', $1, 'etkin', $2) RETURNING id::text",
      [["denetci"], p])).rows[0].id;
    return [p, h];
  });
  const den3 = kisi(H3, "denetci");
  const id = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: P3, isgNo: "ISG-3", kaydet: false }] }))).id;
  tamam(await a(den3, async (db) => planKabul(db, den3, id, (await planIci(db, den3, id))!.surum, true)));
  const mesai = (d: object) => a(FA.yon, async (db) => { const m = await ayarOku(db, "mesai"); return ayarYaz(db, "mesai", m.surum, { ...m.deger, ...d }, { kim: "Deneme", ne: "ayar.mesai" }); });
  const ac = (kod: string) => a(den3, (db) => raporOlustur(db, den3, id, FA.ekp[kod]));
  const DOLU = { durum: "red", neden: "Günlük süre doldu (mesai takibi); bugün yeni rapor oluşturulamaz." };
  await sql(A, "UPDATE ekipman_turu SET sure = 60 WHERE id = $1", [FA.tur]);
  try {
    assert.equal((await mesai({ acik: true, normal_dk: 60, mesai_dk: 60, yillik_fazla_saat: 0 })).durum, "tamam");
    assert.equal((await ici(den3, id))!.mesai, null, "henüz rapor yok");
    const r1 = tamam(await ac("HT-A1"));
    /* 60 dk doldu; yıllık fazla çalışma hakkı 0 → mesai eklenmez */
    let p = (await ici(den3, id))!;
    assert.deepEqual(p.mesai, { normal: 60, mesai: 60 });
    assert.deepEqual(await ac("HT-A2"), DOLU);
    const v = (await a(den3, (db) => sahaRaporu(db, den3, r1.id)))!;
    assert.equal(v.mesaiDolu, true);
    assert.deepEqual(await a(den3, (db) => raporKopyala(db, den3, r1.id, v.surum, { kod: "HT-M1", konum: null }, null)), DOLU);
    assert.equal((await sql(A, "SELECT 1 FROM ekipman WHERE kod = 'HT-M1'")).rowCount, 0, "engelde ekipman açılmaz");
    /* yıllık hak açılınca günlük mesai eklenir: 60 + 60 */
    tamam(await mesai({ yillik_fazla_saat: 270 }));
    assert.equal((await ici(den3, id))!.mesai, null);
    const r2 = tamam(await ac("HT-A2"));
    p = (await ici(den3, id))!;
    assert.deepEqual(p.mesai, { normal: 60, mesai: 60 }, "120 dk doldu");
    assert.deepEqual(await ac("HT-A3"), DOLU);
    /* silinen rapor sayılmaz */
    tamam(await a(den3, (db) => raporSil(db, den3, r2.id, 0)));
    assert.equal((await ici(den3, id))!.mesai, null);
    tamam(await ac("HT-A3"));
    /* kapalıyken sınır yok */
    tamam(await mesai({ acik: false }));
    assert.equal((await ici(den3, id))!.mesai, null);
    tamam(await ac("HT-A4"));
  } finally {
    await mesai({ acik: false });
    await sql(A, "UPDATE ekipman_turu SET sure = NULL WHERE id = $1", [FA.tur]);
  }
});

/* 2026-10-05 (313; maket format-guncelle, şerit "r-format-serit"; 211; RAPOR-FORMAT §5): rapor açıldığı sürümle kalır; yazan Yeni raporunu daha
   yeni yayınlanmış sürüme geçirebilir — eşleşen cevaplar korunur, yeni madde ilk cevapla. BU TEST SONDA: türün formatını değiştirir. */
test("formatı güncelle: yalnız yazanın Yeni raporu, daha yeni yayınlanmış sürüm varsa; ekran hâli kaydedilir, eşleşen cevaplar korunur, yeni madde Uygun; fotoğraf yerinde; veritabanı eski sürüme döndürmez; yeni rapor yeni sürümle açılır", async () => {
  const id = await yeniPlan();
  const g = girdi();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const r2 = tamam(await olustur(FA.den1, id, FA.ekp["HT-A2"]));
  tamam(await a(FA.den1, (db) => cihazEkle(db, FA.den1, r2.id, 0, FA.man, FA.cihaz["MN-01"])));
  tamam(await foto(FA.den1, r2.id, 1));
  tamam(await gonder(FA.den1, r2.id, 2, g));
  tamam(await foto(FA.den1, r.id, 0));
  assert.equal((await sr(FA.den1, r.id))!.guncelFormat, null, "güncel sürümde");
  assert.deepEqual(await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r.id, 1, g)), { durum: "red", neden: "Rapor güncel format sürümünde." });
  /* yönetici yeni sürüm yayınlar: bir madde eklenir */
  const yeni = structuredClone(KOMP);
  for (const x of yeni.bolumler) if (x.blok === "liste") x.gruplar[0].maddeler.push({ id: "k_yeni", metin: "Deneme maddesi", kilit: false });
  const sira = await a(FA.yon, async (db) => {
    /* önceki testten kalan taslak varsa onun yerine (gördüğü taslak sürümüyle) */
    const once = (await db.sorgu<{ surum: number }>("SELECT surum FROM rapor_format WHERE tur_id = $1 AND durum = 'taslak'", [FA.tur])).rows[0]?.surum ?? null;
    const t = tamam(await taslakBaslat(db, FA.yon, FA.tur, `surum:${FA.format}`, once));
    const k = tamam(await taslakKaydet(db, FA.yon, t.id, t.surum, yeni));
    return tamam(await yayinla(db, FA.yon, t.id, k.surum, "")).sira;
  });
  let v = (await sr(FA.den1, r.id))!;
  assert.deepEqual([v.formatSira, v.guncelFormat], [1, sira]);
  assert.equal((await sr(FA.den1, r2.id))!.guncelFormat, null, "gönderilmiş raporda yok");
  assert.equal((await sr(FA.mek, r.id))!.guncelFormat, null, "yalnız düzenleyebilene");
  /* yetki ve durum sunucuda */
  assert.equal((await a(FA.mek, (db) => raporFormatGuncelle(db, FA.mek, r.id, v.surum, g))).durum, "yetkisiz");
  assert.equal((await a(FA.den2, (db) => raporFormatGuncelle(db, FA.den2, r.id, v.surum, g))).durum, "yok");
  assert.equal((await b(FB.den1, (db) => raporFormatGuncelle(db, FB.den1, r.id, v.surum, g))).durum, "yok");
  assert.deepEqual(await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r2.id, 3, g)), { durum: "red", neden: "Rapor gönderildi; yalnız Yeni rapor düzenlenir." });
  assert.equal((await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r.id, v.surum - 1, g))).durum, "cakisma");
  /* güncelle: ekranın hâli kaydedilir, eşleşen cevaplar korunur, yeni madde Uygun */
  const el = { ...g, ekipman: { ...g.ekipman, marka: "Güncel Marka" }, cevaplar: { ...g.cevaplar, madde: { ...g.cevaplar.madde, [MADDELER[0].id]: { c: "Uygun değil", not: "Korozyon" } } } };
  assert.deepEqual(await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r.id, v.surum, el)),
    { durum: "tamam", id: r.id, bildirim: `Format güncellendi (sürüm ${sira}): 1 yeni madde eklendi (Uygun); cevaplar korundu.` });
  v = (await sr(FA.den1, r.id))!;
  assert.deepEqual([v.formatSira, v.guncelFormat, v.ekipmanBilgi.marka], [sira, null, "Güncel Marka"]);
  assert.deepEqual(v.cevaplar.madde[MADDELER[0].id], { c: "Uygun değil", not: "Korozyon", foto: 0 });
  assert.deepEqual(v.cevaplar.madde.k_yeni, { c: "Uygun", foto: 0 });
  assert.deepEqual([v.cevaplar.alan, v.cevaplar.deger, v.cevaplar.sonuc], [g.cevaplar.alan, g.cevaplar.deger, "uygun"]);
  assert.deepEqual(v.fotolar.map((f) => [f.bolum, f.madde]), [["foto", null]], "fotoğraf yerinde");
  assert.ok(v.tanim.bolumler.some((x) => x.blok === "liste" && x.gruplar.some((gr) => gr.maddeler.some((m) => m.id === "k_yeni"))), "ekran yeni sürümle çizilir");
  assert.deepEqual(await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r.id, v.surum, el)), { durum: "red", neden: "Rapor güncel format sürümünde." });
  /* veritabanı: eski sürüme dönülmez */
  await assert.rejects(sql(A, "UPDATE rapor SET format_id = $2 WHERE id = $1", [r.id, FA.format]), /daha yeni yayınlanmış sürümüne/);
  /* yeni rapor yeni sürümle açılır */
  const r3 = tamam(await olustur(FA.den1, id, FA.ekp["HT-A3"]));
  const v3 = (await sr(FA.den1, r3.id))!;
  assert.deepEqual([v3.formatSira, v3.guncelFormat, v3.cevaplar.madde.k_yeni], [sira, null, { c: "Uygun" }]);
});

/* 2026-10-05 (315; maket rapor.html "Ön izle", onaylar.html onay ekranı önizlemesi): belgenin verisi yalnız raporu görene; fotoğraf raporun kendi
   dosyasından gömülür (çöptekiler değil); firma künyesi ve nüsha firmanın kendi kaydından. Çizici: tests/belge.test.ts. */
test("belge verisi: raporu gören alır (yazan, branş yöneticisi, planlama); öteki branş, başka denetçi, muhasebe, başka firma alamaz; fotoğraf gömülü; çöpteki gömülmez", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A4"]));
  tamam(await foto(FA.den1, r.id, 0));
  const bv = (k: Kisi) => a(k, (db) => raporBelgesiVerisi(db, depo, k, r.id));
  const v = (await bv(FA.den1))!;
  assert.deepEqual([v.id, v.plan.id, v.belge.firma, v.belge.durum, v.belge.onay, v.belge.imza, v.belge.ekipman.kod], [r.id, id, { ad: "Deneme A", kod: "DA", nusha: 2 }, "taslak", null, null, "HT-A4"]);
  assert.equal(v.belge.fotolar.length, 1);
  assert.match(v.belge.fotolar[0].src!, /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/);
  assert.equal(v.belge.yazan.ad, "Deneme Bir");
  assert.ok(await bv(FA.mek), "branş yöneticisi");
  assert.ok(await bv(FA.plan), "planlama");
  for (const k of [FA.elk, FA.den2, FA.muh]) assert.equal(await bv(k), null);
  assert.equal(await b(FB.den1, (db) => raporBelgesiVerisi(db, depo, FB.den1, r.id)), null, "başka firma");
  const d = (await sr(FA.den1, r.id))!;
  tamam(await a(FA.den1, (db) => fotoSil(db, FA.den1, r.id, d.surum, d.fotolar[0].dosya)));
  assert.equal((await bv(FA.den1))!.belge.fotolar.length, 0, "silinen fotoğraf belgede yok");
});

/* 2026-10-05 (313-314 çapraz inceleme): yeni sürümde cevap seti değişmişse eski cevap sessizce "Uygun"a dönmez — seçim boşalır (Onaya gönder
   yeniden seçtirir), açıklama kalır, bildirim söyler */
test("formatı güncelle: cevabı yeni cevap setinde olmayan madde boşalır, açıklaması kalır; bildirim yeniden seçtirir", async () => {
  const id = await yeniPlan();
  const r = tamam(await olustur(FA.den1, id, FA.ekp["HT-A1"]));
  const sira = await a(FA.yon, async (db) => {
    const y = (await db.sorgu<{ id: string; tanim: unknown }>("SELECT id::text, tanim FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda'", [FA.tur])).rows[0];
    const t = structuredClone(y.tanim) as typeof KOMP;
    for (const x of t.bolumler) if (x.blok === "liste") x.cevaplar = ["Uygun", "Kusurlu", "Uygulanamaz"];
    const once = (await db.sorgu<{ surum: number }>("SELECT surum FROM rapor_format WHERE tur_id = $1 AND durum = 'taslak'", [FA.tur])).rows[0]?.surum ?? null;
    const ts = tamam(await taslakBaslat(db, FA.yon, FA.tur, `surum:${y.id}`, once));
    const k = tamam(await taslakKaydet(db, FA.yon, ts.id, ts.surum, t));
    return tamam(await yayinla(db, FA.yon, ts.id, k.surum, "")).sira;
  });
  const v = (await sr(FA.den1, r.id))!;
  const g = girdi();
  const madde = Object.fromEntries(Object.keys(v.cevaplar.madde).map((m) => [m, { c: "Uygun" }]));
  madde[MADDELER[0].id] = { c: "Uygun değil", not: "Korozyon" } as never;
  const el = { ...g, cevaplar: { ...g.cevaplar, madde } };
  assert.deepEqual(await a(FA.den1, (db) => raporFormatGuncelle(db, FA.den1, r.id, v.surum, el)),
    { durum: "tamam", id: r.id, bildirim: `Format güncellendi (sürüm ${sira}): madde değişmedi; 1 maddenin cevabı yeni cevap setinde yok, yeniden seçin.` });
  const d = (await sr(FA.den1, r.id))!;
  assert.deepEqual(d.cevaplar.madde[MADDELER[0].id], { c: "", not: "Korozyon", foto: 0 }, "seçim boş, açıklama kaldı");
  assert.deepEqual(d.cevaplar.madde[MADDELER[1].id], { c: "Uygun", foto: 0 });
});
