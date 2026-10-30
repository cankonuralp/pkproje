/* NEREDEN GELDİ: pkproje §9 "2026-10-15 akşam — S.A.Y CLAUDE GİBİ" (reisim: "zaten kaynak kodun içinde, sayfalarda gezmesine gerek yok", "bu sayfa
   açık değil falan demesin", "sadece site ile alakasız sorulara cevap vermesin … tek sınırımız bu") — 2. adım a (2026-10-16): uygulamanın sunucu
   işlevleri S.A.Y'ın aracı (src/server/yz/islem.ts, src/modules/say/islem-katalogu.ts, src/modules/<modül>/say-islemleri.ts). Kilitler (saf;
   veritabanı yok):
   1. katalog: adlar tekil ve biçimli, tarif tek satır, tür oku / yaz, her girdinin JSON şeması nesne (zod'dan); dizin her işlemi içerir, her
      çağrıda AYNI metin (önbellek öneki);
   2. ŞEMA MODÜLDEN TÜRER: her işlemin kaynağı bir modülün sema.ts'inin, src/sema/ortak.ts'in ya da liste süzgecinin (src/server/liste/liste.ts)
      dışa açtığı zod şeması ve girdinin ağacında — kendisi ya da alanları, AYNI nesne (kopya değil); 2026-10-16 (inceleme): girdinin üst düzey HER
      alanı türer ya da gerekçesiyle elle (tests/yardimci/denetimler.ts islemAlanlariDenetimi, SAY_ELLE_ALANLAR);
   3. ÇALIŞTIRICI MODÜLÜN İŞLEVİNİ ÇAĞIRIR: "islev" modülün server/ dosyasının dışa açtığı işlevin kendisi ve İŞLEMİN KENDİ çalıştırıcısı onu çağırır
      (ya da çağıran yardımcıya devreder);
      katalog dosyalarında ham SQL ya da doğrudan veritabanı sorgusu yok (yetki ve kural modül işlevinde); sır / anahtar yazan işlev kataloğa girmez
      (girdi sohbet geçmişine ve yapay zekâ sağlayıcısına gider);
   4. araçlar: dizin verilince "islemler" / "islem" her istekte EN ÖNDE ve sabit, talimatta dizin; çağrılar sunucu komutu olur (ad / girdi biçimiyle),
      ekranın geri gönderdiği komut aynı denetimden geçer; sonucun metni tool_result olarak olduğu gibi; veri değiştiren işlem "yenile" sayılır;
      açık raporun Kaydet / Onaya gönder'i ekran komutu (rapor araçlarında).
   Olumsuz kanıt: tests/bozan/say-islem.bozan.ts. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { ISLEM_DIZINI, ISLEM_KATALOGU, KATALOG_MODULLERI, modulAdi } from "../src/modules/say/islem-katalogu.ts";
import { islemleriListele, islemSemasi, katalogDizini, katalogKur, type Islem } from "../src/server/yz/islem.ts";
import {
  aracCagrilari, aracCagrisi, EKRAN_ARAC_ADLARI, ISLEM_ARACLARI, komutDenetle, RAPOR_ARACLARI, sayAraclari, sayIstegi, saySistemi, sonucIcerigi, sunucuKomutuMu,
} from "../src/server/yz/say.ts";
import { FORMAT_ARACI } from "../src/modules/rapor-format/say-kurucu.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import { islemAlanlariDenetimi, SAY_ELLE_ALANLAR, zodAgaci as agac } from "./yardimci/denetimler.ts";

const zodMu = (x: unknown): x is { _zod: { def: Record<string, unknown> } } => !!x && typeof x === "object" && "_zod" in x;
const alanlari = (s: unknown): unknown[] => (zodMu(s) && s._zod.def.shape && typeof s._zod.def.shape === "object" ? Object.values(s._zod.def.shape as object) : []);

/** dışa açılmış zod şemaları: bütün modüllerin sema.ts'i + ortak şema + liste süzgeci */
async function izinliSemalar(): Promise<Set<unknown>> {
  const dosyalar = [
    ...readdirSync("src/modules", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join("src/modules", d.name, "sema.ts"))
      .filter((y) => { try { readFileSync(y); return true; } catch { return false; } }),
    "src/sema/ortak.ts", "src/server/liste/liste.ts",
  ];
  const l = new Set<unknown>();
  for (const y of dosyalar) for (const v of Object.values(await import(pathToFileURL(join(process.cwd(), y)).href) as Record<string, unknown>)) if (zodMu(v)) l.add(v);
  return l;
}
/** say-islemleri.ts'teki yardımcı işlevin gövdesi (çalıştırıcı ona devrediyorsa; yoksa boş) */
function yardimciGovdesi(kaynak: string, ad: string): string {
  const i = kaynak.search(new RegExp(`\\bfunction ${ad}\\(`));
  if (i < 0) return "";
  const j = kaynak.indexOf("\n}\n", i);
  return kaynak.slice(i, j < 0 ? undefined : j);
}
/** modülün server/ dosyalarının dışa açtığı değerler */
async function sunucuIhracati(modul: string): Promise<Set<unknown>> {
  const k = join("src/modules", modul, "server"), l = new Set<unknown>();
  for (const a of readdirSync(k).filter((x) => x.endsWith(".ts"))) for (const v of Object.values(await import(pathToFileURL(join(process.cwd(), k, a)).href) as Record<string, unknown>)) l.add(v);
  return l;
}

test("katalog: adlar tekil ve biçimli, tarif tek satır, tür oku / yaz, JSON şeması nesne; dizin her işlemi içerir ve hep aynı", () => {
  assert.ok(ISLEM_KATALOGU.length >= 30, String(ISLEM_KATALOGU.length));
  assert.equal(new Set(ISLEM_KATALOGU.map((t) => t.ad)).size, ISLEM_KATALOGU.length, "adlar tekil");
  for (const t of ISLEM_KATALOGU) {
    assert.match(t.ad, /^[a-z][a-z0-9_]{2,60}$/, t.ad);
    assert.ok(t.tarif.trim() && !t.tarif.includes("\n"), `${t.ad}: tek satır tarif`);
    assert.ok(t.tur === "oku" || t.tur === "yaz", t.ad);
    const s = islemSemasi(t);
    assert.equal(s.type ?? (s.allOf || s.oneOf || s.anyOf ? "object" : undefined), "object", `${t.ad}: girdi nesne`);
    assert.equal(s.$schema, undefined);
    assert.ok(ISLEM_DIZINI.split("\n").some((s) => s.slice(s.indexOf(": ") + 2).split(", ").includes(t.ad)), `${t.ad} dizinde`);
  }
  assert.equal(katalogDizini(ISLEM_KATALOGU, modulAdi), ISLEM_DIZINI, "her çağrıda aynı metin");
  /* 2026-10-26: dizinde yalnız adlar (tarif ve şema islemler aracıyla) — talimat küçük model için kısa */
  assert.ok(ISLEM_DIZINI.length < 6000, `dizin kısa: ${ISLEM_DIZINI.length}`);
  for (const ad of ["Planlar:", "Raporlar:", "Müşteriler:", "Teklifler:", "Onaylar:"]) assert.ok(ISLEM_DIZINI.includes(ad), ad);
  /* 2026-10-16 (2. adım b): kalan modüller (ve Ana sayfa) — modül adıyla, "Modül N" değil */
  for (const ad of ["Ana sayfa:", "Uyarılar:", "Sözleşmeler:", "Ölçüm cihazları:", "Zimmetler:", "Araçlar:", "Personel:", "Talepler:", "Muhasebe:", "Performans:",
    "Ekipman türleri:", "Dökümanlar:", "Firma ayarları:"]) assert.ok(ISLEM_DIZINI.includes(ad), ad);
  assert.doesNotMatch(ISLEM_DIZINI, /Modül \d+:/, "her işlemin modülü menüde");
  /* görevin ilk modülleri: Planlar (aç, ekipman ekle / çıkar, ekip, kabul / red, bul / getir), Raporlar (aç, getir, yaz, onaya gönder, bul),
     Müşteriler + tesis + ekipman kaydı, Teklifler (ara, taslak, gönder), Onaylar (kuyruk, onayla, geri gönder) */
  for (const ad of ["plan_ac", "plan_ekipman_ekle", "plan_kayitli_ekle", "plan_ekipman_pasif", "plan_kunye_duzenle", "plan_kabul", "plan_reddet", "plan_ara",
    "plan_getir", "tesis_ekipmanlari", "rapor_ac", "rapor_getir", "rapor_yaz", "rapor_onaya_gonder", "rapor_ara", "musteri_ara", "musteri_kaydet", "tesis_kaydet",
    "teklif_ara", "teklif_kaydet", "teklif_gonder", "onay_kuyrugu", "rapor_onayla", "rapor_geri_gonder",
    /* 2026-10-16 (2. adım b): kalan modüllerin ve (a)'da eksik kalan tuşların işlemleri */
    "plan_sil", "rapor_sil", "rapor_kopyala", "rapor_format_guncelle", "revize_iste", "revizeye_gonder", "revize_istegi_reddet", "teklif_musteri_kaydet", "teklif_sil",
    "musteri_pasif", "tesis_sil", "personel_kaydet", "personel_ayrildi", "cihaz_kaydet", "kalibrasyon_ekle", "zimmet_teslim", "demirbas_ekle", "arac_kaydet", "arac_km",
    "sozlesme_hazirla", "isg_katip_kaydet", "egitim_kaydet", "fatura_kaydet", "tahsilat_kaydet", "gider_kaydet", "izin_gonder", "masraf_gonder", "talep_karar",
    "tur_kaydet", "sablondan_tur_ekle", "taslak_baslat", "format_taslak_duzenle", "format_yayinla", "firma_ayari_kaydet", "ana_sayfa", "uyari_ara", "performans_panosu"]) {
    assert.ok(ISLEM_KATALOGU.some((t) => t.ad === ad), `${ad} katalogda`);
  }
  /* kayıt bozuk girdiyi reddeder (uygulama açılmaz) */
  const ornek = ISLEM_KATALOGU[0];
  assert.throws(() => katalogKur([ornek, ornek]), /iki kez/);
  assert.throws(() => katalogKur([{ ...ornek, ad: "Kötü Ad" }]), /biçimsiz/);
  assert.throws(() => katalogKur([{ ...ornek, tarif: "iki\nsatır" }]), /tek satır/);
  assert.throws(() => katalogKur([{ ...ornek, kaynak: [] }]), /şemasından/);
});

test("ŞEMA MODÜLDEN TÜRER: her işlemin kaynağı dışa açılmış bir modül şeması ve girdinin ağacında (kendisi ya da alanları — aynı nesne)", async () => {
  const izinli = await izinliSemalar();
  assert.ok(izinli.size > 20, String(izinli.size));
  for (const t of ISLEM_KATALOGU) {
    assert.ok(t.kaynak.length, `${t.ad}: kaynak`);
    const a = agac(t.girdi);
    for (const k of t.kaynak) {
      assert.ok(izinli.has(k), `${t.ad}: kaynak modülün / ortak şemanın dışa açtığı şema olmalı`);
      assert.ok(a.has(k) || alanlari(k).some((f) => a.has(f)), `${t.ad}: kaynak girdinin ağacında (kopya değil)`);
    }
  }
  /* 2026-10-16 (2. adım a incelemesi — kilit iddiasından zayıftı: tek alanın ağaçta olması yetiyordu): girdinin ÜST DÜZEY her alanı modülün şemasından
     türer ya da gerekçesiyle elle yazılmıştır (modül işlevinin konumsal değeri) — olumsuz kanıt tests/bozan/say-islem.bozan.ts */
  assert.deepEqual(islemAlanlariDenetimi(ISLEM_KATALOGU, izinli, SAY_ELLE_ALANLAR), []);
  for (const ad of Object.keys(SAY_ELLE_ALANLAR)) assert.ok(ISLEM_KATALOGU.some((t) => t.ad === ad), `${ad}: elle alan listesindeki işlem katalogda`);
});

test("ÇALIŞTIRICI MODÜL İŞLEVİNİ ÇAĞIRIR: islev modülün sunucu dosyasının işlevi ve say-islemleri.ts onu çağırır; ham SQL ve sır yazan işlev yok", async () => {
  /* 2026-10-16 (FV11, K3): e-posta gönderim anahtarını yazan işlev kalktı (anahtarı Yönetim koyar; uygulama rolü yazamaz — 0099). 2026-10-25
     (göç 0106): yapay zekâ anahtarını firmada yazan işlev de kalktı — Yönetim yazar */
  const sir = new Set<unknown>([sirYaz]);
  for (const m of KATALOG_MODULLERI) {
    const ihracat = await sunucuIhracati(m.modul);
    const kaynak = readFileSync(join("src/modules", m.modul, "say-islemleri.ts"), "utf8");
    for (const t of m.islemler as readonly Islem[]) {
      assert.equal(typeof t.islev, "function", t.ad);
      assert.ok(ihracat.has(t.islev), `${t.ad}: islev src/modules/${m.modul}/server/ dosyasının dışa açtığı işlev olmalı`);
      /* 2026-10-16 (2. adım a incelemesi): İŞLEMİN KENDİ çalıştırıcısı bildirdiği işlevi çağırır (ya da çağıran yardımcıya devreder — rapor_yaz →
         kapaliRaporaYaz → raporKaydet); adın dosyanın başka bir yerinde geçmesi yetmez */
      const cs = t.calistir.toString(), cagri = `${t.islev.name}(`;
      const devredilen = [...cs.matchAll(/\b([A-Za-z_]\w*)\(/g)].map((x) => yardimciGovdesi(kaynak, x[1]));
      assert.ok(cs.includes(cagri) || devredilen.some((g) => g.includes(cagri)), `${t.ad}: çalıştırıcı ${t.islev.name}'i çağırmalı`);
      assert.ok(!sir.has(t.islev), `${t.ad}: sır / anahtar yazan işlev kataloğa girmez`);
      assert.doesNotMatch(t.ad, /anahtar|sir_|parola|sifre/, t.ad);
    }
    /* yetki ve kural modül işlevinde: katalogda ham SQL, doğrudan sorgu, sır okuma / yazma, oturum ya da kiracı okuma yok */
    assert.doesNotMatch(kaynak, /\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bDELETE\s+FROM\b|\bSELECT\b/i, `${m.modul}: SQL yok`);
    assert.doesNotMatch(kaynak, /\.sorgu\(|server\/db\/|ayar\/sir|AnahtarYaz|kimlik\/istek|kiraci\/istek|canDo\(|canDoEylem\(/, `${m.modul}: veritabanı / yetki / oturum doğrudan değil`);
  }
  assert.equal(ISLEM_KATALOGU.length, KATALOG_MODULLERI.reduce((n, m) => n + m.islemler.length, 0));
});

/* 2026-10-23 (S.A.Y baştan — reisim: "direk claude da haiku nasıl çalışıyor ise direk o şekilde"): araçların HEPSİ her istekte aynı sırayla (düşünme
   blokları araç listesi değişmedikçe geçerli); sayfa bilgisi talimatta değil, konuşmada — önceki "sayfaya göre değişen araçlar" testi bu yüzden değişti */
test("araçlar: bütün araçlar her istekte aynı sırayla, işlem araçları önde; talimatta dizin; talimat her çağrıda aynı", () => {
  const g = sayIstegi({ model: "haiku", sistem: saySistemi([], ISLEM_DIZINI), araclar: sayAraclari(FORMAT_ARACI), mesajlar: [{ role: "user", content: "s" }] })
    .govde as { tools: { name: string }[]; system: { text: string }[] };
  /* 2026-10-31 (kalem 3 — E3, reisim onayı): görüntü araçları foto_pafta, foto_goster işlem araçlarının ardında, sabit sırayla */
  assert.deepEqual(g.tools.map((t) => t.name), ["islemler", "islem", "foto_pafta", "foto_goster", "ekran_durumu", "rapora_yaz", "fotograflari_oku", "geri_al", "raporu_kaydet", "onaya_gonder",
    "formati_duzenle", "format_pdf_kur", "web_search"]);
  assert.ok(g.system[0].text.includes(ISLEM_DIZINI) && g.system[0].text.includes("islem aracıyla"), "dizin önbellekli talimatta");
  assert.equal(JSON.stringify(sayAraclari(FORMAT_ARACI)), JSON.stringify(sayAraclari(FORMAT_ARACI)), "araç tanımları her çağrıda aynı");
  assert.equal(saySistemi([], ISLEM_DIZINI), saySistemi([], ISLEM_DIZINI), "talimat her çağrıda aynı");
  assert.deepEqual(ISLEM_ARACLARI.map((t) => t.name), ["islemler", "islem"]);
  assert.ok(RAPOR_ARACLARI.some((t) => t.name === "raporu_kaydet") && RAPOR_ARACLARI.some((t) => t.name === "onaya_gonder"));
  assert.ok(saySistemi([], ISLEM_DIZINI).includes("E-imzayı kullanıcı kendi cihazında atar"));
});

test("çağrılar: islem / islemler sunucu komutu (biçimiyle), Kaydet / Onaya gönder ekran komutu; ekranın gönderdiği aynı denetimden; sonuç olduğu gibi", () => {
  const icerik = [
    { type: "tool_use", id: "t1", name: "islem", input: { ad: "plan_ac", girdi: { tesis: "x" } } },
    { type: "tool_use", id: "t2", name: "islem", input: { ad: 5, girdi: [1, 2] } },
    { type: "tool_use", id: "t3", name: "islemler", input: { adlar: ["plan_ac", 7, ""], modul: "Planlar", ara: "" } },
    { type: "tool_use", id: "t4", name: "raporu_kaydet", input: {} }, { type: "tool_use", id: "t5", name: "onaya_gonder", input: {} },
    { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "x" } },
  ];
  assert.deepEqual(aracCagrilari(icerik).map((c) => c.id), ["t1", "t2", "t3", "t4", "t5"], "sunucu aracı (internet araması) hizmette çalışır");
  const komutlar = aracCagrilari(icerik).map((c) => aracCagrisi({ type: "tool_use", ...c }));
  assert.deepEqual(komutlar, [
    { tur: "islem", ad: "plan_ac", girdi: { tesis: "x" }, id: "t1" }, { tur: "islem", ad: "5", girdi: {}, id: "t2" },
    { tur: "islemler", adlar: ["plan_ac"], modul: "Planlar", id: "t3" }, { tur: "kaydet", id: "t4" }, { tur: "gonder", id: "t5" },
  ]);
  assert.deepEqual(komutlar.map((k) => sunucuKomutuMu(k!)), [true, true, true, false, false]);
  for (const k of komutlar) assert.deepEqual(komutDenetle(k), k, `${k!.tur}: ekranın geri gönderdiği komut aynı`);
  assert.deepEqual(aracCagrilari(icerik).map((c) => EKRAN_ARAC_ADLARI.has(c.name)), [false, false, false, true, true]);
  /* sunucunun sonucu tool_result'a olduğu gibi */
  const sonuc = JSON.stringify({ islem: "plan_ara", durum: "tamam", toplam: 0 });
  assert.equal(sonucIcerigi({ yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [], sonuc }), sonuc);
});

test("islemler aracı: adlarla şemalarıyla (bilinmeyen söylenir); modül / söz az işlem bulursa şemalarıyla, çoksa yalnız tarif", () => {
  const a = islemleriListele(ISLEM_KATALOGU, { adlar: ["plan_ac", "yok_boyle"] }, modulAdi) as { islemler: { ad: string; girdi?: { properties?: Record<string, unknown> } }[]; bilinmeyen?: string[] };
  assert.deepEqual(a.islemler.map((x) => x.ad), ["plan_ac"]);
  assert.ok(a.islemler[0].girdi?.properties && "tesis" in a.islemler[0].girdi.properties && "ekip" in a.islemler[0].girdi.properties);
  assert.deepEqual(a.bilinmeyen, ["yok_boyle"]);
  /* 2026-10-16 (2. adım b): Onaylar'ın işlemi 6'dan 11'e çıktı (revize istekleri, diğer belgeler) — "az" örneği 2 işlemli Performans; Onaylar artık "çok" */
  const b = islemleriListele(ISLEM_KATALOGU, { modul: "Performans" }, modulAdi) as { islemler: { ad: string; modul: string; girdi?: unknown }[] };
  assert.ok(b.islemler.length > 0 && b.islemler.every((x) => x.modul === "Performans" && x.girdi), "az: şemalı");
  const o = islemleriListele(ISLEM_KATALOGU, { modul: "Onaylar" }, modulAdi) as { islemler: { modul: string; girdi?: unknown }[]; not?: string };
  assert.ok(o.islemler.length > 8 && o.islemler.every((x) => x.modul === "Onaylar" && !x.girdi) && o.not, "çok: yalnız ad ve tarif");
  const c = islemleriListele(ISLEM_KATALOGU, {}, modulAdi) as { islemler: { girdi?: unknown }[]; not?: string };
  assert.equal(c.islemler.length, ISLEM_KATALOGU.length);
  assert.ok(c.islemler.every((x) => !x.girdi) && c.not, "süzgeçsiz: yalnız ad ve tarif");
});
