/* NEREDEN GELDİ: 2026-11-12 — reisim: "log kayıtları düzgün olmalı" (pkproje.md §11 K10 / T7; maket yerel/maket/turkak-modeli.html 4. bölüm). Raporun
   zaman çizelgesi denetçiye gösterilen kayıt: durum hareketleri, kontrolün ölçülen başlangıcı / bitişi, gerekçeli saat düzeltmesi, fotoğrafların
   çekim anı ve konumu tek listede, zamana göre; dikkat isteyen satır işaretli. Veritabanı tarafı tests/raporlar.test.ts "kontrol saati (0128)".
   Olumsuz kanıt: tests/bozan/cizelge.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cizelgeTablosu, zamanCizelgesi, type CizelgeGirdisi } from "../src/modules/raporlar/cizelge.ts";

const D = (s: string) => new Date(`2026-11-12T${s}:00+03:00`);
const GIRDI: CizelgeGirdisi = {
  yazan: "Deneme Denetçi",
  hareketler: [
    { zaman: D("13:28"), ne: "olustur", gerekce: null, kim: "Deneme Denetçi" }, { zaman: D("13:29"), ne: "bilinmeyen", gerekce: null, kim: "Deneme Denetçi" },
    { zaman: D("14:05"), ne: "gonder", gerekce: null, kim: "Deneme Denetçi" }, { zaman: D("15:10"), ne: "onay", gerekce: null, kim: "Deneme Yönetici" },
    { zaman: D("15:40"), ne: "imza", gerekce: null, kim: "Deneme Denetçi" },
  ],
  kontrol: { basladi: D("13:30"), bitti: D("14:02"), duzBas: null, duzBit: null, gerekce: null, duzKim: null, duzZaman: null },
  fotolar: [
    { ad: "on.jpg", eklendi: D("13:34").toISOString(), cekim: "2026-11-12 13:33", konum: { e: 39.9, b: 32.8, d: 12 } },
    { ad: "etiket.jpg", eklendi: D("13:52").toISOString(), cekim: "2026-11-12 13:12", konum: null },
    { ad: "eski.jpg" },
  ],
  sapmalar: [{ tur: "foto", metin: "Bir fotoğraf kontrol saatleri dışında çekilmiş (12.11.2026 13:12).", gerekce: "Etiket fotoğrafı girişte çekildi" }],
};

test("zaman çizelgesi: hareketler, kontrol ve fotoğraflar zamana göre tek listede; saat dışı fotoğraf ve sapmalı gönderim işaretli; bilinmeyen hareket ve tarihsiz fotoğraf yok", () => {
  const l = zamanCizelgesi(GIRDI);
  assert.deepEqual(l.map((s) => [s.olay, s.kim, s.kaynak, s.dikkat]), [
    ["Rapor açıldı", "Deneme Denetçi", "Sunucu", false],
    ["Kontrol başladı", "Deneme Denetçi", "Sunucu", false],
    ["Fotoğraf eklendi · on.jpg · çekim 12.11.2026 13:33 · konum kayıtlı", "Deneme Denetçi", "Sunucu", false],
    ["Fotoğraf eklendi · etiket.jpg · çekim 12.11.2026 13:12 (saat dışı) · konum yok", "Deneme Denetçi", "Sunucu", true],
    ["Kontrol bitti · 32 dk", "Deneme Denetçi", "Sunucu", false],
    ["Onaya gönderildi · 1 sapma gerekçeli", "Deneme Denetçi", "Sunucu", true],
    ["Onaylandı", "Deneme Yönetici", "Sunucu", false],
    ["İmzalandı", "Deneme Denetçi", "Sunucu", false],
  ]);
  assert.deepEqual(l.map((s) => s.zaman), [...l.map((s) => s.zaman)].sort(), "zamana göre sıralı");
  assert.deepEqual(cizelgeTablosu(l).slice(0, 2), [["Saat", "Olay", "Kim", "Saatin kaynağı"], ["12.11.2026 13:28", "Rapor açıldı", "Deneme Denetçi", "Sunucu"]]);
});

test("saat düzeltmesi: gerekçesi ve yazanıyla ayrı satır, kaynağı Elle, işaretli; ölçülen satırlar kalır; hiç ölçülmediyse 'yazıldı'; geri gönderme gerekçesiyle", () => {
  const duz = zamanCizelgesi({ ...GIRDI, fotolar: [], sapmalar: [],
    kontrol: { basladi: D("13:30"), bitti: D("13:36"), duzBas: D("13:30"), duzBit: D("14:10"), gerekce: "Tuşa erken basıldı", duzKim: "Deneme Denetçi", duzZaman: D("14:03") } });
  assert.deepEqual(duz.filter((s) => s.olay.startsWith("Kontrol")).map((s) => [s.olay, s.kaynak, s.dikkat]), [
    ["Kontrol başladı", "Sunucu", false], ["Kontrol bitti · 6 dk", "Sunucu", false],
    ["Kontrol saati gerekçeyle düzeltildi: 12.11.2026 13:30 – 14:10 (40 dk) · Tuşa erken basıldı", "Elle", true],
  ]);
  const elle = zamanCizelgesi({ ...GIRDI, hareketler: [{ zaman: D("15:00"), ne: "geri", gerekce: "Ölçüm eksik", kim: "Deneme Yönetici" }], fotolar: [], sapmalar: [],
    kontrol: { basladi: null, bitti: null, duzBas: D("09:00"), duzBit: D("09:40"), gerekce: "Bağlantı yoktu, saat sonradan yazıldı", duzKim: "Deneme Denetçi", duzZaman: D("11:00") } });
  assert.deepEqual(elle.map((s) => [s.olay, s.dikkat]), [
    ["Kontrol saati gerekçeyle yazıldı: 12.11.2026 09:00 – 09:40 (40 dk) · Bağlantı yoktu, saat sonradan yazıldı", true],
    ["Geri gönderildi · Ölçüm eksik", true],
  ]);
  assert.deepEqual(zamanCizelgesi({ yazan: "x", hareketler: [], kontrol: null, fotolar: [], sapmalar: [] }), []);
});
