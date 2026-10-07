/* NEREDEN GELDİ: KOD-GECIS §4 + 07 + anayasa 7.1 "rol aynaları: rol listesi, düzey tablosu, özel eylemler tek tanımdan; ayrı kopya varsa bir test
   bağlar" · 09-E4 (yetki her istekte sunucuda tek canDo) · reisim 2026-10-04: "kaynak koddan rol değiştirme sızma veri çalma gibi şeylere dikkat et".
   AYNA: src/server/yetki/tanim.ts ↔ veritabanı rol CHECK'i (0002_giris.sql) ↔ onaylı maketin matrisi (MV.MATRIS) ↔ KOD-GECIS §4 tablosu.
   DAVRANIŞ: rollerin birleşimi, kendi / branş kaydı, firma matrisi (bozuk değer kapalı, yönetici kendini kilitleyemez), onay yalnız türün
   branşında (2026-10-05, 314: dört göz kalktı — reisim kararı pkproje §1 "hazırlayanın kendi raporunu onaylaması da engellenmez"), tanımsız rol ve
   eylem adı hiçbir şey vermez. Olumsuz kanıt: tests/bozan/yetki.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { canDo, canDoEylem, duzey, type YetkiHesabi } from "../src/server/yetki/canDo.ts";
import { MATRIS_ONERI, ROLLER, type Matris, type ModulAnahtari, type Rol } from "../src/server/yetki/tanim.ts";
import { oku } from "./yardimci/denetimler.ts";

test("AYNA: rol listesi = veritabanı CHECK'i", () => {
  const sql = oku("src/server/db/gocler/0002_giris.sql");
  const m = /roller\s+text\[\][^\n]*ARRAY\[([^\]]+)\]/.exec(sql);
  assert.ok(m, "rol CHECK'i bulunamadı");
  assert.deepEqual(m[1].split(",").map((s) => s.trim().replace(/'/g, "")), [...ROLLER]);
});

test("AYNA: başlangıç matrisi = onaylı maketin matrisi (MV.MATRIS), rol sırası maketle aynı", () => {
  const js = oku("docs/assets/maket-veri.js");
  const govde = /MV\.MATRIS = (\{[\s\S]*?\n\s*\});/.exec(js);
  assert.ok(govde, "MV.MATRIS bulunamadı");
  /* başka bağlamın dizileri: JSON ile bu bağlama alınır (deepStrictEqual prototipe de bakar) */
  const maket = JSON.parse(JSON.stringify(vm.runInNewContext(`(${govde[1]})`))) as Record<string, string[]>;
  const rolBlok = /MV\.ROLLER = \[([\s\S]*?)\n\s*\];/.exec(js)?.[1] ?? "";
  const roller = [...rolBlok.matchAll(/\{ k: "(\w+)"/g)].map((x) => x[1]);
  assert.deepEqual(roller, ["planlama", "inspector", "mekyon", "elkyon", "yonetici", "muhasebe"], "maketin rol sırası değişti");
  assert.deepEqual(Object.keys(maket).sort(), Object.keys(MATRIS_ONERI).sort());
  for (const k of Object.keys(maket)) assert.deepEqual([...MATRIS_ONERI[(k === "hareket" ? k : Number(k)) as ModulAnahtari]], maket[k], `modül ${k}`);
});

test("AYNA: başlangıç matrisi = KOD-GECIS §4 tablosu", () => {
  const md = oku("KOD-GECIS.md");
  const ADLAR: Record<string, ModulAnahtari> = {
    "Planlar": 13, "Ekipman (plan içinde)": 7, "Raporlar": 14, "Onaylar": 15, "Uyarılar": 20, "Müşteriler": 3, "Teklifler": 11, "Sözleşmeler": 12,
    "Ölçüm cihazları": 8, "Zimmetler": 9, "Araçlar": 23, "Personel": 2, "Talepler": 21, "Muhasebe": 18, "Performans": 19, "Ekipman türleri": 5,
    "Dökümanlar": 4, "Eğitimler (Dökümanlar sekmesi)": 10, "Firma ayarları": 22, "Hareket kaydı": "hareket",
  };
  const DUZEY: Record<string, string> = { "değiştirir": "yaz", "görür": "gor", "branşı": "brans", "kendi": "kendi", "—": "yok" };
  const bolum = md.slice(md.indexOf("## 4 · Yetki"), md.indexOf("## 5 ·"));
  let say = 0;
  for (const satir of bolum.split("\n")) {
    const h = satir.split("|").map((s) => s.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (h.length !== 7 || !(h[0] in ADLAR)) continue;
    assert.deepEqual(h.slice(1).map((d) => DUZEY[d]), [...MATRIS_ONERI[ADLAR[h[0]]]], h[0]);
    say++;
  }
  assert.equal(say, Object.keys(ADLAR).length, "tablodaki bütün satırlar okunmalı");
});

const kisi = (id: string, ...roller: string[]): YetkiHesabi => ({ id, roller: roller as Rol[] });
const DENETCI = kisi("d1", "denetci"), MEKYON = kisi("m1", "mekanik_yonetici"), ELKYON = kisi("e1", "elektrik_yonetici");
const YONETICI = kisi("y1", "firma_yoneticisi"), MUHASEBE = kisi("u1", "muhasebe"), PLANLAMA = kisi("p1", "planlama");

test("düzeyler: denetçi kendi planını görür, başkasınınkini değil; muhasebeye giremez; yönetici her yere", () => {
  assert.equal(canDo(DENETCI, 13, "gor"), true, "Planlar'a girer (liste kendi süzgeciyle)");
  assert.equal(canDo(DENETCI, 13, "gor", { atananlar: ["d1"] }), true);
  assert.equal(canDo(DENETCI, 13, "gor", { atananlar: ["d2"] }), false);
  assert.equal(canDo(DENETCI, 18, "gor"), false);
  assert.equal(canDo(DENETCI, 22, "gor"), false);
  assert.equal(canDo(DENETCI, 3, "gor"), true);
  assert.equal(canDo(DENETCI, 3, "degistir"), false);
  for (const m of Object.keys(MATRIS_ONERI)) {
    const k = (m === "hareket" ? m : Number(m)) as ModulAnahtari;
    assert.equal(canDo(YONETICI, k, "gor"), MATRIS_ONERI[k][4] !== "yok", `yönetici ${m}`);
  }
  assert.equal(canDo(null, 13, "gor"), false, "oturumsuz hiçbir şey");
});

test("branş: mekanik yönetici mekanik raporu görür, elektriği görmez; rollerin birleşimi en yüksek düzey", () => {
  assert.equal(canDo(MEKYON, 14, "gor", { brans: "m" }), true);
  assert.equal(canDo(MEKYON, 14, "gor", { brans: "e" }), false);
  assert.equal(canDo(MEKYON, 14, "degistir", { brans: "m" }), false);
  const ikiRollu = kisi("x", "denetci", "planlama");
  assert.equal(duzey(ikiRollu, 13), "yaz");
  assert.equal(duzey(ikiRollu, 3), "yaz");
});

test("SIZMA: tanımsız rol, bozuk firma matrisi ve bilinmeyen eylem adı hiçbir şey vermez", () => {
  assert.equal(duzey(kisi("x", "tanri", "admin", "__proto__"), 22), "yok");
  assert.equal(canDo(kisi("x", "tanri"), 18, "gor"), false);
  const bozuk = { 18: ["admin", "yaz?", 1, null, "superuser", "yaz2"] } as unknown as Partial<Matris>;
  assert.equal(canDo(PLANLAMA, 18, "gor", undefined, bozuk), false);
  for (const ad of ["toString", "constructor", "__proto__", "hasOwnProperty", "yok_boyle"]) {
    assert.equal(canDoEylem(YONETICI, ad as never), false, ad);
  }
  assert.equal(canDoEylem(null, "plan_ac"), false);
});

test("firma matrisi: firma denetçinin müşterilerini kapatabilir; yönetici Personel / Firma ayarları / Hareket kaydını kendinden alamaz", () => {
  const firma: Partial<Matris> = { 3: ["yaz", "yok", "gor", "gor", "yaz", "gor"], 2: ["gor", "kendi", "gor", "gor", "yok", "yok"], 22: ["yok", "yok", "yok", "yok", "yok", "yok"] };
  assert.equal(canDo(DENETCI, 3, "gor", undefined, firma), false);
  assert.equal(canDo(YONETICI, 2, "degistir", undefined, firma), true);
  assert.equal(canDo(YONETICI, 22, "degistir", undefined, firma), true);
  assert.equal(canDo(YONETICI, "hareket", "gor", undefined, firma), true);
});

test("özel eylemler: onay türün branşında (kendi raporu dahil), vekil, durum kuralları", () => {
  const rapor = { sahip: "d1", brans: "m" as const, durum: "Onayda" };
  assert.equal(canDoEylem(MEKYON, "rapor_onayla", rapor), true);
  assert.equal(canDoEylem(ELKYON, "rapor_onayla", rapor), false, "öteki branş");
  assert.equal(canDoEylem(ELKYON, "rapor_onayla", { ...rapor, vekil: true }), true, "vekil");
  assert.equal(canDoEylem(DENETCI, "rapor_onayla", rapor), false);
  const kendiRaporu = { sahip: "m1", brans: "m" as const, durum: "Onayda" };
  /* 2026-10-05 (314, C1): eskiden false (dört göz, 281'in kod kararı); reisim'in kararı tersi — kendi raporunu onaylamak engellenmez */
  assert.equal(canDoEylem(kisi("m1", "mekanik_yonetici", "denetci"), "rapor_onayla", kendiRaporu), true, "kendi raporunu onaylar (reisim kararı)");
  assert.equal(canDoEylem(kisi("m1", "mekanik_yonetici", "denetci"), "rapor_geri_gonder", kendiRaporu), true);
  assert.equal(canDoEylem(kisi("e1", "elektrik_yonetici", "denetci"), "rapor_onayla", { ...kendiRaporu, sahip: "e1" }), false, "kendi raporu da olsa öteki branş onaylamaz");
  assert.equal(canDoEylem(DENETCI, "rapor_sil", { sahip: "d1", durum: "Yeni" }), true);
  assert.equal(canDoEylem(DENETCI, "rapor_sil", { sahip: "d1", durum: "Onayda" }), false);
  assert.equal(canDoEylem(DENETCI, "rapor_sil", { sahip: "d2", durum: "Yeni" }), false);
  assert.equal(canDoEylem(MEKYON, "rapor_durum_degistir", { ...rapor, durum: "Tamamlandı" }), false);
  assert.equal(canDoEylem(MEKYON, "rapor_revizeye_gonder", { ...rapor, durum: "Tamamlandı" }), true);
  assert.equal(canDoEylem(PLANLAMA, "plan_ac"), true);
  assert.equal(canDoEylem(DENETCI, "plan_ac"), false);
  assert.equal(canDoEylem(DENETCI, "plan_kabul_red", { atananlar: ["d1"] }), true);
  assert.equal(canDoEylem(DENETCI, "plan_kabul_red", { atananlar: ["d2"] }), false);
  assert.equal(canDoEylem(MUHASEBE, "masraf_onayi"), true);
  assert.equal(canDoEylem(MUHASEBE, "rol_yetki_degistir"), false);
  assert.equal(canDoEylem(YONETICI, "rol_yetki_degistir"), true);
});

/* 357 (reisim 2026-10-07 + pkproje §9 "silme işlemi sadece yöneticiler tarafından yapılabilmeli"): kesin silme — kaydın modülünde "yaz" VE yönetici
   rolü; firma matrisi planlamaya / muhasebeye "yaz" verse de silemez; modülsüz kayıt hiç silinmez */
test("kayit_sil: yalnız yönetici rolü ve modülde yaz", () => {
  assert.equal(canDoEylem(YONETICI, "kayit_sil", { modul: 8 }), true);
  assert.equal(canDoEylem(ELKYON, "kayit_sil", { modul: 8 }), true);
  assert.equal(canDoEylem(MEKYON, "kayit_sil", { modul: 8 }), true);
  for (const k of [PLANLAMA, DENETCI, MUHASEBE]) assert.equal(canDoEylem(k, "kayit_sil", { modul: 8 }), false, k.roller[0]);
  const firma: Partial<Matris> = { 8: ["yaz", "yaz", "yaz", "yaz", "yaz", "yaz"] };
  assert.equal(canDoEylem(PLANLAMA, "kayit_sil", { modul: 8 }, firma), false, "matris yaz verse de planlama silemez");
  assert.equal(canDoEylem(MUHASEBE, "kayit_sil", { modul: 8 }, firma), false);
  const kapali: Partial<Matris> = { 8: ["gor", "kendi", "gor", "gor", "gor", "yok"] };
  assert.equal(canDoEylem(YONETICI, "kayit_sil", { modul: 8 }, kapali), false, "modülde yaz değilse yönetici de silemez");
  assert.equal(canDoEylem(YONETICI, "kayit_sil"), false, "modülsüz kayıt");
  assert.equal(canDoEylem(YONETICI, "kayit_sil", {}), false);
  /* 365: plan içi ekipman silme de bu kural (modül 7 Ekipman): varsayılan matriste branş yöneticisi "gör" — silemez */
  assert.equal(canDoEylem(YONETICI, "kayit_sil", { modul: 7 }), true);
  for (const k of [MEKYON, ELKYON]) assert.equal(canDoEylem(k, "kayit_sil", { modul: 7 }), false, k.roller[0]);
  assert.equal(canDoEylem(MEKYON, "kayit_sil", { modul: 7 }, { 7: ["yaz", "yaz", "yaz", "gor", "yaz", "yok"] }), true, "firma matrisle verir");
});
