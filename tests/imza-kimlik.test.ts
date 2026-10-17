/* NEREDEN GELDİ: 2026-10-17 teknik yönetici imzası (reisim önerinin ayrıntılarını onayladı — "İki farklı kişi imzalayacağı için imzanın
   sertifikasındaki adı kişinin adıyla karşılaştırmayı öneriyorum. Tutmazsa yükleme reddedilir"). Saf: imza içeriğinden (CMS) imzalayanın adı —
   SignerInfo'nun gösterdiği sertifika (başka sertifikalar da varken), ad karşılaştırması (Türkçe harf, büyük / küçük, ikinci ad), yalnız EKTEKİ
   imzalar, bozuk girdi. Uydurma sertifikalar tests/yardimci/sahte-imza.ts. Gerçek bir imzalı PDF'te (reisim'in gönderdiği, başka yazılımın) ad
   PC'de okundu — dosya depoya girmedi. Olumsuz kanıt: tests/bozan/imza-kimlik.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ekImzaIcerikleri } from "../src/modules/raporlar/imza-pdf.ts";
import { adUyuyor, imzaciNedeni, imzalayanAdi } from "../src/modules/raporlar/imza-kimlik.ts";
import { sahteImzaIcerigi, sahteImzaSozlugu } from "./yardimci/sahte-imza.ts";

test("imzalayanın adı: SignerInfo'nun gösterdiği sertifikanın CN'i — öteki sertifikalar (zincir) varken de", () => {
  assert.equal(imzalayanAdi(sahteImzaIcerigi("AYŞE ÇELİK")), "AYŞE ÇELİK");
  assert.equal(imzalayanAdi(sahteImzaIcerigi("AYŞE ÇELİK", ["Ara Sertifika", "Kök Sertifika"])), "AYŞE ÇELİK", "sertifika sırası önemli değil");
});

test("bozuk ya da imza olmayan içerik: ad yok (fırlatmaz)", () => {
  for (const x of ["", "00", "00ff", "zz", "3080", "30820001", "3003020101", sahteImzaIcerigi("A B").slice(0, 200), "30".repeat(5000)]) {
    assert.equal(imzalayanAdi(x), null, x.slice(0, 20));
  }
});

test("ad karşılaştırması: büyük / küçük ve Türkçe harf farkı yok; ikinci ad bir tarafta eksik olabilir; başka ad, eksik soyad uyuşmaz", () => {
  assert.equal(adUyuyor("AYŞE ÇELİK", "Ayşe Çelik"), true);
  assert.equal(adUyuyor("IŞIL İNCE", "ışıl ince"), true);
  assert.equal(adUyuyor("ISIL INCE", "Işıl İnce"), true, "sertifikada Türkçe harf yok");
  assert.equal(adUyuyor("AYŞE NUR ÇELİK", "Ayşe Çelik"), true, "ikinci ad yalnız sertifikada");
  assert.equal(adUyuyor("AYŞE ÇELİK", "Ayşe Nur Çelik"), true, "ikinci ad yalnız kayıtta");
  assert.equal(adUyuyor("AYŞE ÇELİK", "Ayşe Kaya"), false);
  assert.equal(adUyuyor("AYŞE ÇELİK", "Mehmet Çelik"), false);
  assert.equal(adUyuyor("AYŞE AYŞE", "Ayşe Çelik"), false, "aynı sözcük iki kez sayılmaz");
  assert.equal(adUyuyor("", "Ayşe Çelik"), false);
});

test("eklenen imzalar: yalnız önekten sonraki /Type /Sig (belge zaman damgası değil); nedeni ekranda", () => {
  const ozgun = "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n";
  const once = ozgun + sahteImzaSozlugu(8, "TEKNİK YÖNETİCİ") + "trailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n";
  const b = (s: string) => new Uint8Array(Buffer.from(s, "latin1"));
  const tam = once + sahteImzaSozlugu(9, "MUAYENE UZMANI")
    + "10 0 obj << /Type /DocTimeStamp /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n";
  const ek = ekImzaIcerikleri(b(once), b(tam));
  assert.equal(ek.length, 1, "öneklerdeki önceki imza ve zaman damgası sayılmaz");
  assert.equal(imzaciNedeni(ek, "Muayene Uzmanı"), null);
  assert.equal(imzaciNedeni(ek, "Teknik Yönetici"), "PDF'teki imza MUAYENE UZMANI adına; bu raporu Teknik Yönetici imzalamalı.");
  assert.equal(imzaciNedeni([], "Teknik Yönetici"), "PDF'te imza bulunamadı.");
  assert.equal(imzaciNedeni(["00ff"], "Teknik Yönetici"), "PDF'teki imzanın sertifikası okunamadı; imzalayan anlaşılamadı.");
  /* iki imza eklenmişse ikisi de kişinin olmalı */
  assert.match(imzaciNedeni(ekImzaIcerikleri(b(ozgun), b(tam)), "Muayene Uzmanı") ?? "", /TEKNİK YÖNETİCİ adına/);
  assert.deepEqual(ekImzaIcerikleri(b(ozgun), b(ozgun)), [], "ek yok");
});
