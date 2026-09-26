/* ══ probata MAKET — ORTAK UYDURMA VERİ (toplu maket çalışması, 2026-09-24) ══════════════════════════════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3, CLAUDE.md §7): gerçek firma, kişi, tesis, numara yok. E-postalar ayrılmış
   ".example" alan adındadır; telefon yazılmaz. Sicil, diploma ve EKİPNET numaraları rasgele üretilmiş biçimdir (gerçek
   biçim doğrulanmadı — pkproje.md "Maket M1" varsayımları).
   Maketler aynı kişileri, meslekleri ve rolleri buradan okur (toplu bakışta bir maketten ötekine tıklanınca aynı kişi).
   Planlar maketindeki (5. tur, onaylı) dört kişi aynı adlarla burada: mk · ea · bs · za. */
(function () {
  "use strict";
  var MV = window.MV = {};

  /* Ek-III grupları (pkproje.md §4.6) — yetkinlik bu gruplar üzerinden (varsayım: grup düzeyinde yetkilendirme) */
  MV.GRUPLAR = [
    { k: "basincli", ad: "Basınçlı kap ve tesisatlar", b: "m" },
    { k: "kaldirma", ad: "Kaldırma ve iletme", b: "m" },
    { k: "iskele", ad: "İskeleler", b: "m" },
    { k: "diger", ad: "Diğer tesisatlar, tezgâhlar, iş makineleri", b: "m" },
    { k: "elektrik", ad: "Elektrik tesisatları", b: "e" }
  ];
  /* Meslekler ve izin verdikleri gruplar — yürürlükteki Ek-III metninden birebir (pkproje.md §4.6, 2026-09-22).
     ⛔ "Teknisyen" yetkili kişi OLAMAZ (metinde hiç geçmiyor). b: branş (iskele-yalnız meslekler mekanik sayıldı — varsayım). */
  var MBKT = ["basincli", "kaldirma", "diger"];
  MV.MESLEKLER = [
    { k: "mak-muh", ad: "Makine mühendisi", b: "m", g: ["basincli", "kaldirma", "iskele", "diger"] },
    { k: "met-muh", ad: "Metalürji ve malzeme mühendisi", b: "m", g: MBKT },
    { k: "mkt-muh", ad: "Mekatronik mühendisi", b: "m", g: MBKT },
    { k: "ima-muh", ad: "İmalat mühendisi", b: "m", g: MBKT },
    { k: "kim-muh", ad: "Kimya mühendisi", b: "m", g: ["basincli"] },
    { k: "uca-muh", ad: "Uçak mühendisi", b: "m", g: ["basincli"] },
    { k: "ins-muh", ad: "İnşaat mühendisi", b: "m", g: ["iskele"] },
    { k: "mak-tek", ad: "Makine teknikeri", b: "m", g: MBKT },
    { k: "mak-ytek", ad: "Makine yüksek teknikeri", b: "m", g: MBKT },
    { k: "ins-tek", ad: "İnşaat teknikeri", b: "m", g: ["iskele"] },
    { k: "tog-mak", ad: "Teknik öğretmen (makine / metal eğitimi)", b: "m", g: ["basincli", "kaldirma", "iskele", "diger"] },
    { k: "tog-ins", ad: "Teknik öğretmen (inşaat / yapı eğitimi)", b: "m", g: ["iskele"] },
    { k: "elk-muh", ad: "Elektrik mühendisi", b: "e", g: ["elektrik"] },
    { k: "ee-muh", ad: "Elektrik-elektronik mühendisi", b: "e", g: ["elektrik"] },
    { k: "tog-elk", ad: "Teknik öğretmen (elektrik eğitimi)", b: "e", g: ["elektrik"] },
    { k: "elk-tek", ad: "Elektrik teknikeri", b: "e", g: ["elektrik"] },
    { k: "elk-ytek", ad: "Elektrik yüksek teknikeri", b: "e", g: ["elektrik"] },
    { k: "teknisyen", ad: "Teknisyen", b: "", g: [] },
    { k: "diger", ad: "Diğer meslek", b: "", g: [] }
  ];
  MV.meslek = function (k) { return MV.MESLEKLER.filter(function (m) { return m.k === k; })[0]; };
  MV.bransAd = function (b) { return b === "m" ? "Mekanik" : b === "e" ? "Elektrik" : "—"; };

  /* Roller (pkproje.md §2; "firma yöneticisi" taslakta varsayım). Bir kişinin birden çok rolü olabilir; ekran yetkisi birleşim. */
  MV.ROLLER = [
    { k: "planlama", ad: "Planlama ekibi", kisa: "Planlama", acik: "Plan açar, inspector atar; müşteri, tesis ve teklifleri yürütür." },
    { k: "inspector", ad: "Inspector", kisa: "Inspector", acik: "Kendisine atanan planı kabul eder, sahada rapor hazırlar, son imzayı atar." },
    { k: "mekyon", ad: "Mekanik yönetici", kisa: "Mek. yönetici", acik: "Mekanik branş raporlarını onaylar ya da gerekçeyle geri gönderir." },
    { k: "elkyon", ad: "Elektrik yönetici", kisa: "Elk. yönetici", acik: "Elektrik branş raporlarını onaylar ya da gerekçeyle geri gönderir." },
    { k: "yonetici", ad: "Firma yöneticisi", kisa: "Firma yön.", acik: "Personel hesapları, rol yetkileri ve firma ayarları; hareket kaydını görür." }
  ];
  MV.rol = function (k) { return MV.ROLLER.filter(function (r) { return r.k === k; })[0]; };

  /* Rol × modül görünürlüğü — başlangıç düzeni (reisim 2026-09-25, 32: "başlangıç olarak uygun ama admin istediği gibi rollerin
     yetkilerini değiştirebilmeli" → firma yöneticisi Personel › Rol yetkileri'nde değiştirir; MATRIS_ONERI "önerilen düzene dön" içindir).
     Düzey: yaz (görür ve değiştirir) · gor (görür) · brans (yalnız kendi branşı) · kendi (yalnız kendi kayıtları) · yok.
     Sıra: planlama · inspector · mekyon · elkyon · yonetici. "hareket" = Hareket kaydı (denetim izi; karar 30: yöneticiye). */
  MV.MATRIS = {
    13: ["yaz", "kendi", "gor", "gor", "yaz"], 14: ["gor", "kendi", "brans", "brans", "gor"], 15: ["yok", "yok", "brans", "brans", "gor"],
    20: ["gor", "kendi", "gor", "gor", "gor"], 3: ["yaz", "gor", "gor", "gor", "yaz"], 11: ["yaz", "yok", "gor", "gor", "yaz"],
    12: ["yaz", "kendi", "gor", "gor", "yaz"], 7: ["yaz", "yaz", "gor", "gor", "yaz"], 8: ["gor", "kendi", "yaz", "yaz", "yaz"],
    9: ["gor", "kendi", "yaz", "yaz", "yaz"], 2: ["gor", "kendi", "gor", "gor", "yaz"], 10: ["gor", "kendi", "yaz", "yaz", "yaz"],
    18: ["yok", "yok", "yok", "yok", "yaz"], 19: ["gor", "kendi", "brans", "brans", "gor"], 5: ["gor", "gor", "yaz", "yaz", "yaz"],
    4: ["gor", "gor", "yaz", "yaz", "yaz"], hareket: ["yok", "yok", "yok", "yok", "gor"]
  };
  MV.MATRIS_ONERI = JSON.parse(JSON.stringify(MV.MATRIS));
  MV.DUZEY = {
    yaz: { ad: "Değiştirir", rozet: "a-rozet-tamam", sira: 4 }, gor: { ad: "Görür", rozet: "a-rozet-kabul", sira: 3 },
    brans: { ad: "Branşı", rozet: "a-rozet-notr", sira: 2 }, kendi: { ad: "Kendi", rozet: "a-rozet-notr", sira: 1 }, yok: { ad: "—", rozet: "", sira: 0 }
  };

  /* PERSONEL (modül 2) ve hesapları (modül 1; 2026-09-25'ten Personel'in içinde). hesap: null = giriş hesabı yok · durum etkin |
     ilk (yönetici geçici parola verdi, kişi henüz girmedi — reisim 34) | pasif (kapalı).
     yetki: firmanın gruba yetkilendirme tarihi (TS EN ISO/IEC 17020 yetkinlik matrisi) · sayilar: kartın bilgi yüzleri
     (öteki modüllerin maketleri gelince oradan beslenir; şimdilik sabit). */
  var E = "@firma.example";
  MV.PERSONEL = [
    { id: "mk", ad: "Mert Kaya", meslek: "mak-muh", diploma: "2012/04571", oda: "48213", ekipnet: "231847", eposta: "mert.kaya" + E, basla: "2019-02-04", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-23T08:12" }, yetki: { basincli: "2020-03-11", kaldirma: "2020-03-11", diger: "2024-01-22" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2025-06-18" }, sayilar: { isg: 7, zimmet: 3, egitim: 4, egitimYakin: 1, plan: 6 } },
    { id: "ea", ad: "Elif Aydın", meslek: "elk-muh", diploma: "2014/10235", oda: "61390", ekipnet: "240512", eposta: "elif.aydin" + E, basla: "2020-09-14", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-23T07:55" }, yetki: { elektrik: "2021-02-01" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2024-11-05" }, sayilar: { isg: 5, zimmet: 4, egitim: 3, egitimYakin: 0, plan: 5 } },
    { id: "bs", ad: "Burak Şahin", meslek: "mak-tek", diploma: "2016/03312", oda: "", ekipnet: "252206", eposta: "burak.sahin" + E, basla: "2022-05-02", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-22T17:40" }, yetki: { kaldirma: "2022-08-15", diger: "2022-08-15" },
      belge: { diploma: 1, oda: 0, ekipnet: 1, egitim: "2022-06-30" }, sayilar: { isg: 3, zimmet: 2, egitim: 2, egitimYakin: 1, plan: 1 } },
    { id: "za", ad: "Zeynep Arslan", meslek: "diger", meslekMetin: "Endüstri mühendisi", diploma: "", oda: "", ekipnet: "", eposta: "zeynep.arslan" + E, basla: "2018-11-19", durum: "etkin",
      hesap: { durum: "etkin", roller: ["planlama"], son: "2026-09-23T09:02" }, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 1, egitim: 1, egitimYakin: 0, plan: 0 } },
    { id: "sy", ad: "Selin Yıldız", meslek: "mak-muh", diploma: "2008/02214", oda: "39904", ekipnet: "198305", eposta: "selin.yildiz" + E, basla: "2016-01-11", durum: "etkin",
      hesap: { durum: "etkin", roller: ["mekyon", "inspector"], son: "2026-09-23T10:31" }, yetki: { basincli: "2017-04-03", kaldirma: "2017-04-03", iskele: "2019-06-17", diger: "2017-04-03" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2025-02-27" }, sayilar: { isg: 2, zimmet: 2, egitim: 5, egitimYakin: 0, plan: 1 } },
    { id: "co", ad: "Can Öztürk", meslek: "ee-muh", diploma: "2009/07781", oda: "55218", ekipnet: "201144", eposta: "can.ozturk" + E, basla: "2016-03-07", durum: "etkin",
      hesap: { durum: "etkin", roller: ["elkyon"], son: "2026-09-23T11:05" }, yetki: { elektrik: "2017-05-22" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2024-09-12" }, sayilar: { isg: 0, zimmet: 1, egitim: 4, egitimYakin: 0, plan: 0 } },
    { id: "dk", ad: "Deniz Koç", meslek: "elk-tek", diploma: "2017/05509", oda: "", ekipnet: "255630", eposta: "deniz.koc" + E, basla: "2023-03-20", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-21T16:18" }, yetki: { elektrik: "2023-06-05" },
      belge: { diploma: 1, oda: 0, ekipnet: 1, egitim: "2023-04-14" }, sayilar: { isg: 4, zimmet: 3, egitim: 2, egitimYakin: 2, plan: 2 } },
    { id: "ec", ad: "Emre Çelik", meslek: "mak-muh", diploma: "2019/08840", oda: "57120", ekipnet: "", eposta: "emre.celik" + E, basla: "2026-08-03", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector", "planlama"], son: "2026-09-19T14:47" }, yetki: {},
      belge: { diploma: 1, oda: 1, ekipnet: 0, egitim: "" }, sayilar: { isg: 0, zimmet: 0, egitim: 1, egitimYakin: 0, plan: 0 } },
    { id: "ad", ad: "Ayşe Demir", meslek: "diger", meslekMetin: "İşletme yöneticisi", diploma: "", oda: "", ekipnet: "", eposta: "ayse.demir" + E, basla: "2015-06-01", durum: "etkin",
      hesap: { durum: "etkin", roller: ["yonetici"], son: "2026-09-23T16:02" }, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } },
    { id: "ok", ad: "Ozan Kurt", meslek: "tog-elk", diploma: "2011/01963", oda: "47735", ekipnet: "247781", eposta: "ozan.kurt" + E, basla: "2021-10-04", durum: "etkin",
      hesap: { durum: "ilk", roller: ["inspector"], verildi: "2026-09-22T10:15" }, yetki: { elektrik: "2021-12-13" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2021-11-02" }, sayilar: { isg: 1, zimmet: 2, egitim: 2, egitimYakin: 0, plan: 0 } },
    { id: "hp", ad: "Hakan Polat", meslek: "mak-ytek", diploma: "2015/06628", oda: "", ekipnet: "250019", eposta: "hakan.polat" + E, basla: "2021-04-12", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-18T12:26" }, yetki: { basincli: "2021-07-19", kaldirma: "2021-07-19" },
      belge: { diploma: 1, oda: 0, ekipnet: 1, egitim: "2021-05-24" }, sayilar: { isg: 2, zimmet: 1, egitim: 3, egitimYakin: 0, plan: 1 } },
    { id: "ga", ad: "Gizem Aksoy", meslek: "diger", meslekMetin: "İşletme", diploma: "", oda: "", ekipnet: "", eposta: "gizem.aksoy" + E, basla: "2024-02-19", durum: "etkin",
      hesap: { durum: "etkin", roller: ["planlama"], son: "2026-09-23T08:40" }, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } },
    { id: "ta", ad: "Tolga Aslan", meslek: "ins-muh", diploma: "2013/09917", oda: "82406", ekipnet: "244901", eposta: "tolga.aslan" + E, basla: "2022-01-17", durum: "etkin",
      hesap: { durum: "etkin", roller: ["inspector"], son: "2026-09-16T09:03" }, yetki: { iskele: "2022-03-28" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2022-02-08" }, sayilar: { isg: 1, zimmet: 1, egitim: 2, egitimYakin: 0, plan: 0 } },
    { id: "by", ad: "Berk Yalçın", meslek: "mak-muh", diploma: "2020/03377", oda: "60482", ekipnet: "261094", eposta: "berk.yalcin" + E, basla: "2026-09-21", durum: "etkin",
      hesap: null, yetki: { kaldirma: "2026-09-22" }, belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2026-07-10" }, sayilar: { isg: 0, zimmet: 0, egitim: 1, egitimYakin: 0, plan: 0 } },
    { id: "ke", ad: "Kaan Er", meslek: "teknisyen", diploma: "", oda: "", ekipnet: "", eposta: "", basla: "2024-09-02", durum: "etkin",
      hesap: null, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 2, egitim: 1, egitimYakin: 0, plan: 0 } },
    { id: "ns", ad: "Nazlı Şen", meslek: "elk-muh", diploma: "2010/04418", oda: "51176", ekipnet: "205388", eposta: "nazli.sen" + E, basla: "2017-07-03", durum: "ayrildi", ayrildi: "2026-06-30",
      hesap: { durum: "pasif", roller: ["inspector"], son: "2026-06-30T17:12" }, yetki: { elektrik: "2017-09-18" },
      belge: { diploma: 1, oda: 1, ekipnet: 1, egitim: "2018-03-06" }, sayilar: { isg: 0, zimmet: 0, egitim: 3, egitimYakin: 0, plan: 0 } }
  ];
  MV.kisi = function (id) { return MV.PERSONEL.filter(function (p) { return p.id === id; })[0]; };

  /* ── MÜŞTERİ VE TESİS (modül 3; M2, 2026-09-24) ─────────────────────────────────────────────────────────────
     Planlar maketinin (onaylı) 9 müşterisi ve tesisi aynı adlarla (plan: Planlar'daki plan no'su). SGK işyeri sicil no
     TESİSTE (reisim 2026-09-22); 26 hane rasgele (biçim doğrulanmadı). Vergi no 10 hane rasgele. E-postalar ".example". */
  MV.MUSTERILER = [
    { id: "m1", unvan: "Ada Makina San. ve Tic. A.Ş.", kisa: "Ada Makina", vd: "Gebze", vno: "0480215736", eposta: "muhasebe@ada-makina.example", ilgili: "Serkan Ateş · İSG uzmanı", acilis: "2023-02-14", uygunsuz: 3 },
    { id: "m2", unvan: "Yıldız Ambalaj A.Ş.", kisa: "Yıldız Ambalaj", vd: "Tuzla", vno: "9530461182", eposta: "finans@yildiz-ambalaj.example", ilgili: "Oya Kaplan · Tesis müdürü", acilis: "2024-05-06", uygunsuz: 0 },
    { id: "m3", unvan: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", kisa: "Kuzey Lojistik", vd: "Çorlu", vno: "5710938264", eposta: "fatura@kuzey-lojistik.example", ilgili: "Cem Aydoğan · İSG uzmanı", acilis: "2022-11-21", uygunsuz: 1 },
    { id: "m4", unvan: "Mavi Tekstil Ltd.", kisa: "Mavi Tekstil", vd: "Çerkezköy", vno: "6122804975", eposta: "muhasebe@mavi-tekstil.example", ilgili: "Pınar Erdem · İnsan kaynakları", acilis: "2025-03-10", uygunsuz: 0 },
    { id: "m5", unvan: "Akın Döküm San. Ltd.", kisa: "Akın Döküm", vd: "Gebze", vno: "0197352846", eposta: "info@akin-dokum.example", ilgili: "Levent Akın · Fabrika müdürü", acilis: "2026-09-02", uygunsuz: 0 },
    { id: "m6", unvan: "Ege Plastik A.Ş.", kisa: "Ege Plastik", vd: "Manisa", vno: "3308127594", eposta: "muhasebe@ege-plastik.example", ilgili: "Burcu Tan · İSG uzmanı", acilis: "2021-06-28", uygunsuz: 0 },
    { id: "m7", unvan: "Kaya Yapı Malzemeleri Ltd.", kisa: "Kaya Yapı", vd: "İkitelli", vno: "4819036257", eposta: "info@kaya-yapi.example", ilgili: "Hasan Kaya · Şantiye şefi", acilis: "2026-08-19", uygunsuz: 0 },
    { id: "m8", unvan: "Deniz Gıda Ltd.", kisa: "Deniz Gıda", vd: "Pendik", vno: "2946510873", eposta: "muhasebe@deniz-gida.example", ilgili: "Ece Demirtaş · Kalite sorumlusu", acilis: "2024-01-15", uygunsuz: 0 },
    { id: "m9", unvan: "Başak Un Değirmenleri A.Ş.", kisa: "Başak Un", vd: "Lüleburgaz", vno: "1463820597", eposta: "fatura@basak-un.example", ilgili: "Murat Başak · Genel müdür", acilis: "2020-10-05", uygunsuz: 2 },
    { id: "m10", unvan: "Çınar Mobilya Ltd.", kisa: "Çınar Mobilya", vd: "İnegöl", vno: "7702519348", eposta: "muhasebe@cinar-mobilya.example", ilgili: "Aslı Çınar · Muhasebe", acilis: "2025-09-30", uygunsuz: 0 },
    { id: "m11", unvan: "Poyraz Metal San. A.Ş.", kisa: "Poyraz Metal", vd: "Nilüfer", vno: "8850316472", eposta: "finans@poyraz-metal.example", ilgili: "Kerem Sezer · İSG uzmanı", acilis: "2022-04-11", uygunsuz: 1 }
  ];
  var SGK = function (n) { var s = ""; for (var i = 0; i < 26; i++) s += ((n * 7 + i * 3 + (i % 5) * n) % 10); return "2" + s.slice(1); };
  MV.TESISLER = [
    { id: "t1", m: "m1", ad: "Merkez Fabrika", adres: "Organize Sanayi Bölgesi 4. Cadde No: 12", ilce: "Gebze", il: "Kocaeli", ekipman: 14, son: "2025-09-24", sonraki: "2026-09-23", plan: "P-0926-031", pid: 1, pdurum: "denetimde", ptarih: "2026-09-23", pekip: ["mk", "ea"] },
    { id: "t2", m: "m1", ad: "Depo", adres: "Organize Sanayi Bölgesi 7. Cadde No: 3", ilce: "Dilovası", il: "Kocaeli", ekipman: 6, son: "2025-10-14", sonraki: "2026-10-14" },
    { id: "t3", m: "m1", ad: "Ar-Ge Binası", adres: "Bilişim Vadisi Yolu No: 18", ilce: "Gebze", il: "Kocaeli", ekipman: 3, son: "2026-02-10", sonraki: "2027-02-10" },
    { id: "t4", m: "m2", ad: "Depo 2", adres: "Liman Caddesi No: 7", ilce: "Tuzla", il: "İstanbul", ekipman: 5, son: "2025-09-23", sonraki: "2026-09-23", plan: "P-0926-034", pid: 2, pdurum: "bekliyor", ptarih: "2026-09-23", pekip: ["mk"] },
    { id: "t5", m: "m3", ad: "Aktarma Merkezi ve Soğuk Hava Deposu", adres: "Sanayi Caddesi No: 48, Aktarma Merkezi Girişi", ilce: "Çorlu", il: "Tekirdağ", ekipman: 21, son: "2025-09-25", sonraki: "2026-09-24", plan: "P-0926-036", pid: 3, pdurum: "bekliyor", ptarih: "2026-09-24", pekip: ["mk", "ea", "bs"] },
    { id: "t6", m: "m3", ad: "Liman Deposu", adres: "Rıhtım Yolu No: 22", ilce: "Avcılar", il: "İstanbul", ekipman: 9, son: "2025-10-02", sonraki: "2026-10-02" },
    { id: "t7", m: "m4", ad: "Boyahane", adres: "Organize Sanayi Bölgesi 2. Sokak No: 5", ilce: "Çerkezköy", il: "Tekirdağ", ekipman: 9, son: "2025-09-26", sonraki: "2026-09-25", plan: "P-0926-038", pid: 4, pdurum: "bekliyor", ptarih: "2026-09-25", pekip: ["mk", "ea"] },
    { id: "t8", m: "m5", ad: "Döküm Hattı", adres: "Demir Çelik Caddesi No: 21", ilce: "Dilovası", il: "Kocaeli", ekipman: 3, son: "", sonraki: "2026-09-26", plan: "P-0926-039", pid: 5, pdurum: "bekliyor", ptarih: "2026-09-26", pekip: ["mk"] },
    { id: "t9", m: "m6", ad: "Üretim Tesisi", adres: "Organize Sanayi Bölgesi 1. Kısım No: 9", ilce: "Yunusemre", il: "Manisa", ekipman: 10, son: "2025-09-30", sonraki: "2026-09-29", plan: "P-0926-035", pid: 6, pdurum: "kabul", ptarih: "2026-09-29", pekip: ["mk", "ea"] },
    { id: "t10", m: "m7", ad: "Şantiye Deposu", adres: "Çevre Yolu Caddesi No: 3", ilce: "Başakşehir", il: "İstanbul", ekipman: 2, son: "", sonraki: "2026-09-30", plan: "P-0926-037", pid: 7, pdurum: "red", ptarih: "2026-09-30", pekip: ["mk"] },
    { id: "t11", m: "m8", ad: "Soğuk Hava Deposu", adres: "Liman Yolu No: 15", ilce: "Pendik", il: "İstanbul", ekipman: 4, son: "2026-09-22", sonraki: "2027-09-22", plan: "P-0926-028", pid: 8, pdurum: "tamam", ptarih: "2026-09-22", pekip: ["mk"] },
    { id: "t12", m: "m9", ad: "Değirmen", adres: "İstasyon Caddesi No: 30", ilce: "Lüleburgaz", il: "Kırklareli", ekipman: 24, son: "2026-09-21", sonraki: "2027-03-21", plan: "P-0926-025", pid: 9, pdurum: "tamam", ptarih: "2026-09-21", pekip: ["mk", "ea"] },
    { id: "t13", m: "m10", ad: "Fabrika", adres: "Mobilyacılar Sitesi 3. Blok No: 14", ilce: "İnegöl", il: "Bursa", ekipman: 11, son: "2025-10-20", sonraki: "2026-10-20" },
    { id: "t14", m: "m11", ad: "Pres Atölyesi", adres: "Organize Sanayi Bölgesi Mavi Cadde No: 6", ilce: "Nilüfer", il: "Bursa", ekipman: 16, son: "2025-11-05", sonraki: "2026-11-05" },
    { id: "t15", m: "m11", ad: "Kaynakhane", adres: "Organize Sanayi Bölgesi Mavi Cadde No: 8", ilce: "Nilüfer", il: "Bursa", ekipman: 7, son: "2025-11-05", sonraki: "2026-11-05" }
  ];
  MV.TESISLER.forEach(function (t, i) { t.sgk = SGK(i + 3); });
  /* plan saatleri — Planlar maketindeki başlangıç–bitiş (M6 plan açmada aynı gün çakışma denetimi) */
  var PSAAT = { t1: ["09:00", "12:30"], t4: ["14:00", "17:00"], t5: ["08:30", "16:30"], t7: ["09:00", "13:00"], t8: ["10:00", "12:00"],
    t9: ["09:00", "15:00"], t10: ["09:00", "12:00"], t11: ["09:00", "11:30"], t12: ["13:00", "16:00"] };
  MV.TESISLER.forEach(function (t) { if (PSAAT[t.id]) t.psaat = PSAAT[t.id]; });
  /* sıradaki proje no (§3.5: P-AAYY-SIRA, sunucu verir; maket: eylülün en büyük sırası + 1) */
  MV.sonrakiProjeNo = function () {
    var n = MV.TESISLER.filter(function (t) { return t.plan && t.plan.indexOf("P-0926-") === 0; }).reduce(function (m, t) { return Math.max(m, +t.plan.slice(7)); }, 0);
    return "P-0926-" + ("00" + (n + 1)).slice(-3);
  };
  /* plan durumları — Planlar maketiyle aynı ad ve rozet (onaylı 4. tur) */
  MV.PLAN_DURUM = {
    bekliyor: { ad: "Kabul bekliyor", rozet: "a-rozet-bekliyor" }, kabul: { ad: "Kabul edildi", rozet: "a-rozet-kabul" },
    denetimde: { ad: "Denetimde", rozet: "a-rozet-denetimde" }, tamam: { ad: "Tamamlandı", rozet: "a-rozet-tamam" }, red: { ad: "Reddedildi", rozet: "a-rozet-red" }
  };
  MV.musteri = function (id) { return MV.MUSTERILER.filter(function (m) { return m.id === id; })[0]; };
  MV.tesis = function (id) { return MV.TESISLER.filter(function (t) { return t.id === id; })[0]; };
  MV.tesisleri = function (mid) { return MV.TESISLER.filter(function (t) { return t.m === mid; }); };
  /* İSG-KATİP kaydı: kişi × tesis (§4.6), sözleşme no + onay tarihi (§3). Planlar'daki onay tarihleriyle aynı. */
  MV.ISG = [
    { t: "t1", k: "mk", no: "S-2026-0412", onay: "2026-09-16" }, { t: "t1", k: "ea", no: "S-2026-0413", onay: "2026-09-16" },
    { t: "t2", k: "mk", no: "S-2025-0387", onay: "2025-10-06" },
    { t: "t4", k: "mk", no: "S-2026-0431", onay: "2026-09-19" },
    { t: "t5", k: "mk", no: "S-2026-0440", onay: "2026-09-15" }, { t: "t5", k: "ea", no: "S-2026-0441", onay: "2026-09-15" }, { t: "t5", k: "bs", no: "S-2026-0442", onay: "2026-09-15" },
    { t: "t7", k: "mk", no: "S-2026-0447", onay: "2026-09-25" }, { t: "t7", k: "ea", no: "S-2026-0448", onay: "2026-09-20" },
    { t: "t9", k: "mk", no: "S-2026-0436", onay: "2026-09-20" }, { t: "t9", k: "ea", no: "S-2026-0437", onay: "2026-09-20" },
    { t: "t10", k: "mk", no: "S-2026-0444", onay: "2026-09-21" },
    { t: "t11", k: "mk", no: "S-2026-0405", onay: "2026-09-12" },
    { t: "t12", k: "mk", no: "S-2026-0398", onay: "2026-09-10" }, { t: "t12", k: "ea", no: "S-2026-0399", onay: "2026-09-10" },
    { t: "t14", k: "hp", no: "S-2025-0361", onay: "2025-10-28" }, { t: "t15", k: "hp", no: "S-2025-0362", onay: "2025-10-28" }
  ];
  /* 2026-09-26 (M5 2. tur, reisim: "isg katip sözleşmesi pdf olarak isteğe bağlı buraya yüklenebilir olsun"): PDF isteğe bağlı; onay tarihi de
     isteğe bağlı (girilmişse geç onay yalnız uyarı). Kayıt = iş sözleşmesinin içinde tesis başına denetçi → sözleşme ID (no). */
  MV.ISG.forEach(function (x, i) { x.id = "i" + (i + 1); x.girdi = "za"; x.pdf = i % 3 === 0 ? "isg-katip-" + x.no.toLowerCase() + ".pdf" : null;
    /* bitiş tarihi isteğe bağlı (reisim 2026-09-26: "isg katip sözleşmesi bitmişse plan açarken uyarsın"); makette onaydan 1 yıl, t9 · Elif Aydın
       planın gününden önce bitiyor (uyarı örneği) */
    var b = new Date(x.onay + "T12:00:00"); b.setFullYear(b.getFullYear() + 1); b.setDate(b.getDate() - 1); x.bitis = x.t === "t9" && x.k === "ea" ? "2026-09-28" : b.toISOString().slice(0, 10); });
  /* önceki yılın sözleşmeleri (geçmişte kalır; yeni kayıt kişi × tesis için güncel olanı olur) */
  MV.ISG.push({ id: "i90", t: "t12", k: "mk", no: "S-2025-0211", onay: "2025-09-12", girdi: "za", onceki: true }, { id: "i91", t: "t11", k: "mk", no: "S-2025-0230", onay: "2025-09-15", girdi: "za", onceki: true });
  MV.isgTesis = function (tid) { return MV.ISG.filter(function (x) { return x.t === tid && !x.onceki; }); };
  /* plan kabul kuralı (§3.2 2a, §4.4): onay tarihi ≤ kontrol tarihi − 1 gün */
  MV.isgUygun = function (onay, kontrol) { return !onay || MK.gunFarki(onay, kontrol) >= 1; };   /* onay tarihi isteğe bağlı (M5 2. tur): yoksa uyarı yok */
  MV.acikPlan = function (t) { return t.pid && ["bekliyor", "kabul", "denetimde"].indexOf(t.pdurum) >= 0; };
  /* müşteri (portal) kullanıcıları: e-postayla hesap (reisim 2026-09-22); tesis: "hepsi" ya da tesis kimlikleri (soru) */
  MV.MUSTERI_KULLANICI = [
    { m: "m1", ad: "Serkan Ateş", eposta: "serkan.ates@ada-makina.example", tesis: "hepsi", durum: "etkin", son: "2026-09-20T09:14" },
    { m: "m1", ad: "Derya Kılıç", eposta: "derya.kilic@ada-makina.example", tesis: ["t1"], durum: "davet", davet: "2026-09-22T15:40" },
    { m: "m2", ad: "Oya Kaplan", eposta: "oya.kaplan@yildiz-ambalaj.example", tesis: "hepsi", durum: "etkin", son: "2026-08-30T11:02" },
    { m: "m3", ad: "Cem Aydoğan", eposta: "cem.aydogan@kuzey-lojistik.example", tesis: "hepsi", durum: "etkin", son: "2026-09-18T16:45" },
    { m: "m3", ad: "Selim Uçar", eposta: "selim.ucar@kuzey-lojistik.example", tesis: ["t6"], durum: "etkin", son: "2026-07-12T08:20" },
    { m: "m4", ad: "Pınar Erdem", eposta: "pinar.erdem@mavi-tekstil.example", tesis: "hepsi", durum: "etkin", son: "2026-09-01T10:10" },
    { m: "m6", ad: "Burcu Tan", eposta: "burcu.tan@ege-plastik.example", tesis: "hepsi", durum: "etkin", son: "2026-09-10T13:33" },
    { m: "m8", ad: "Ece Demirtaş", eposta: "ece.demirtas@deniz-gida.example", tesis: "hepsi", durum: "etkin", son: "2026-09-23T07:58" },
    { m: "m9", ad: "Murat Başak", eposta: "murat.basak@basak-un.example", tesis: "hepsi", durum: "etkin", son: "2026-09-22T19:05" },
    { m: "m9", ad: "Gül Yurt", eposta: "gul.yurt@basak-un.example", tesis: "hepsi", durum: "pasif", son: "2026-03-02T12:00" },
    { m: "m11", ad: "Kerem Sezer", eposta: "kerem.sezer@poyraz-metal.example", tesis: "hepsi", durum: "etkin", son: "2026-06-18T09:40" }
  ];
  MV.musteriKullanicilari = function (mid) { return MV.MUSTERI_KULLANICI.filter(function (x) { return x.m === mid; }); };
  /* 2026-09-25 (M2 2. tur, reisim 33: "her müşteri için müşteri girişi otomatik oluşacak müşterinin sistemdeki mail adresi ile otomatik
     oluşturulmuş şifre o mail adresine gönderilecek"): müşterinin ANA GİRİŞİ müşteri kaydında (m.giris), e-postası müşterinin e-postası.
     durum: etkin (girdi) · gonderildi (parola gitti, henüz girmedi) · yok (e-posta yazılmamış). Kişiye özel ek girişler
     MV.MUSTERI_KULLANICI'da (M11 paneli onları okur; ana giriş M11'in sırası gelince bağlanır). */
  var GIRIS = { m1: "2026-09-22T08:40", m2: "2026-09-15T10:05", m3: "2026-09-19T14:12", m4: "2026-08-28T09:30", m6: "2026-09-11T16:20",
    m8: "2026-09-23T07:51", m9: "2026-09-21T18:44", m10: "2026-09-05T11:18", m11: "2026-07-02T15:00" };
  MV.MUSTERILER.forEach(function (m) { m.giris = GIRIS[m.id] ? { durum: "etkin", son: GIRIS[m.id] } : { durum: "gonderildi", gonderildi: m.acilis + "T10:15" }; });
  MV.MUSTERI_KULLANICI.forEach(function (k) { if (k.durum === "davet") { k.durum = "gonderildi"; k.gonderildi = k.davet; delete k.davet; } });
  /* 81 il (plaka sırası) ve verideki illerin ilçeleri (reisim 50: aramalı seçim listesi). Maket: ilçe listesi yalnız verideki 6 ilde;
     uygulamada 81 ilin tamamı. */
  MV.ILLER = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl",
    "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum",
    "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu",
    "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
    "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli",
    "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın",
    "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"];
  MV.ILCELER = {
    "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa",
      "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş",
      "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa",
      "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli",
      "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
    "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
    "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl",
      "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
    "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"]
  };

  /* ── STANDART KÜTÜPHANESİ (modül 4; M3'te tür kataloğu için, M7'de ekranı) ────────────────────────────────────
     Her firma kendi standardını yükler (reisim 2026-09-22). Numara ve konular ÖRNEKTİR; türlere atanışları doğrulanmadı —
     firma kendi kütüphanesinden seçer. */
  MV.STANDARTLAR = [
    { k: "s1", no: "TS EN 286-1", konu: "Basit basınçlı kaplar — hava ve azot için" },
    { k: "s2", no: "TS EN 13445-5", konu: "Yakılmayan basınçlı kaplar — muayene ve deney" },
    { k: "s3", no: "TS ISO 5057", konu: "Endüstriyel kamyonlar — kullanımdaki çatal kolların muayenesi" },
    { k: "s4", no: "TS EN ISO 3691-1", konu: "Endüstriyel kamyonlar — güvenlik kuralları ve doğrulama" },
    { k: "s5", no: "TS EN 15011", konu: "Köprülü ve portal krenler" },
    { k: "s6", no: "TS EN 280", konu: "Mobil yükseltilebilir çalışma platformları" },
    { k: "s7", no: "TS EN 14492-2", konu: "Motorlu vinçler ve kaldırma donanımları" },
    { k: "s8", no: "TS EN 81-31", konu: "Yalnız yük taşıyan asansörler" },
    { k: "s9", no: "TS EN 12953", konu: "Silindirik kazanlar" },
    { k: "s10", no: "TS HD 60364-6", konu: "Alçak gerilim tesisleri — doğrulama" },
    { k: "s11", no: "TS HD 60364-5-54", konu: "Alçak gerilim tesisleri — topraklama düzenleri" },
    { k: "s12", no: "TS EN 62305-3", konu: "Yıldırımdan korunma — yapılarda fiziksel hasar" },
    { k: "s13", no: "TS EN 61439-1", konu: "Alçak gerilim anahtarlama ve kontrol düzenleri (panolar)" },
    { k: "s14", no: "TS EN 14439", konu: "Kule krenler" },
    { k: "s15", no: "TS EN 13000", konu: "Mobil krenler" },
    { k: "s16", no: "TS EN 12811-1", konu: "Geçici iş donanımları — iskeleler" },
    { k: "s17", no: "TS EN 115-1", konu: "Yürüyen merdivenler ve yürüyen yollar" },
    { k: "s18", no: "TS EN 1808", konu: "Asılı erişim donanımı" },
    { k: "s19", no: "TS EN 1495", konu: "Direğe tırmanan çalışma platformları" },
    { k: "s20", no: "TS EN 54-14", konu: "Yangın algılama ve alarm sistemleri — planlama, tesis, bakım" },
    { k: "s21", no: "TS EN 60076-1", konu: "Güç transformatörleri — genel" }
  ];
  MV.standart = function (k) { return MV.STANDARTLAR.filter(function (s) { return s.k === k; })[0]; };

  /* ── EKİPMAN TÜRÜ KATALOĞU (modül 5; M3) ─────────────────────────────────────────────────────────────────────
     Planlar maketinin 14 türü aynı kod, ad ve branşla (Planlar bunlardan okur); diğerleri Ek-III ve §4.8'den.
     g: Ek-III grubu (yetkili meslekler buradan, §4.6) · periyot: ay (§4.7: çoğu 12, iskele 6) · std: standart kimlikleri (örnek) ·
     format: Bakanlık rapor formatı (§4.8; zorunlu | taslak) · sablon: rapor şablonu
     sürümü (kodda, §8.3; yoksa rapor açılamaz) · sure: tahmini kontrol süresi, dk (öneri §3.1).
     2026-09-26 (reisim: "Akreditasyon zorunluluğu ile ilgili bir şey yazma, bunu bilmek periyodik kontrol firması yetkililerinin
     sorumluluğu"): akr alanı kalktı. M3 2. tur: sablon olan türde firmanın yüklediği rapor formatı PDF'i var sayılır (maket-turler.js). */
  MV.KATALOG = [
    { k: "HT", ad: "Hava tankı", b: "m", g: "basincli", periyot: 12, std: ["s1", "s2"], format: "KR11", formatDurum: "taslak", sablon: "v3 · 1 Mar 2026", sure: 20 },
    { k: "FL", ad: "Forklift", b: "m", g: "kaldirma", periyot: 12, std: ["s3", "s4"], format: "KR05", formatDurum: "taslak", sablon: "v2 · 15 Oca 2026", sure: 40 },
    { k: "KK", ad: "Köprülü kren", b: "m", g: "kaldirma", periyot: 12, std: ["s5"], format: "KR09", formatDurum: "taslak", sablon: "v2 · 15 Oca 2026", sure: 60 },
    { k: "KP", ad: "Kaldırma platformu", b: "m", g: "kaldirma", periyot: 12, std: ["s6"], sablon: "v1 · 1 Eyl 2025", sure: 45 },
    { k: "TP", ad: "Transpalet", b: "m", g: "kaldirma", periyot: 12, std: ["s4"], format: "KR05", formatDurum: "taslak", sablon: "v2 · 15 Oca 2026", sure: 15 },
    { k: "KS", ad: "Kompresör", b: "m", g: "basincli", periyot: 12, std: ["s1"], sablon: "v1 · 1 Eyl 2025", sure: 25 },
    { k: "ZV", ad: "Zincirli vinç", b: "m", g: "kaldirma", periyot: 12, std: ["s7"], sablon: "v1 · 1 Eyl 2025", sure: 30 },
    { k: "YA", ad: "Yük asansörü", b: "m", g: "kaldirma", periyot: 12, std: ["s8"], sablon: "v1 · 1 Eyl 2025", sure: 60 },
    { k: "BK", ad: "Buhar kazanı", b: "m", g: "basincli", periyot: 12, std: ["s9"], format: "KR07", formatDurum: "taslak", sure: 90 },
    { k: "ET", ad: "Elektrik iç tesisatı", b: "e", g: "elektrik", periyot: 12, std: ["s10"], format: "ZPKR02", formatDurum: "zorunlu", sablon: "v4 · 1 Eyl 2025", sure: 90 },
    { k: "AT", ad: "AG topraklama", b: "e", g: "elektrik", periyot: 12, std: ["s11"], format: "ZPKR01", formatDurum: "zorunlu", sablon: "v3 · 1 Eyl 2025", sure: 45 },
    { k: "YK", ad: "Yıldırımdan korunma", b: "e", g: "elektrik", periyot: 12, std: ["s12"], format: "ZPKR03", formatDurum: "zorunlu", sablon: "v2 · 1 Eyl 2025", sure: 45 },
    { k: "DP", ad: "Dağıtım panosu", b: "e", g: "elektrik", periyot: 12, std: ["s13"], sablon: "v2 · 1 Eyl 2025", sure: 30 },
    { k: "JN", ad: "Jeneratör", b: "e", g: "elektrik", periyot: 12, std: [], sure: 40 },
    { k: "KU", ad: "Kule kren", b: "m", g: "kaldirma", periyot: 12, std: ["s14"], format: "ZPKR06", formatDurum: "zorunlu", sablon: "v1 · 1 Oca 2026", sure: 120 },
    { k: "LP", ad: "LPG tankı", b: "m", g: "basincli", periyot: 12, std: [], format: "ZPMR01", formatDurum: "zorunlu", sure: 60 },
    { k: "YG", ad: "Yangın algılama sistemi", b: "e", g: "elektrik", periyot: 12, std: ["s20"], format: "ZPKR04", formatDurum: "zorunlu", sure: 60 },
    { k: "TR", ad: "Transformatör (1–36 kV)", b: "e", g: "elektrik", periyot: 12, std: ["s21"], format: "ZPKR05", formatDurum: "zorunlu", sure: 60 },
    { k: "IS", ad: "Yapı iskelesi", b: "m", g: "iskele", periyot: 6, std: ["s16"], sure: 60 },
    { k: "MB", ad: "Mobil kren", b: "m", g: "kaldirma", periyot: 12, std: ["s15"], format: "KR02", formatDurum: "taslak", sure: 90 },
    { k: "YM", ad: "Yürüyen merdiven", b: "m", g: "kaldirma", periyot: 12, std: ["s17"], sure: 60 },
    { k: "AE", ad: "Asılı erişim donanımı", b: "m", g: "kaldirma", periyot: 12, std: ["s18"], format: "ZPKR07", formatDurum: "zorunlu", sure: 60 },
    { k: "SP", ad: "Sütunlu çalışma platformu", b: "m", g: "kaldirma", periyot: 12, std: ["s19"], format: "KR03", formatDurum: "taslak", sure: 60 },
    { k: "PR", ad: "Mekanik pres", b: "m", g: "diger", periyot: 12, std: [], sure: 45 }
  ];
  MV.tur = function (k) { return MV.KATALOG.filter(function (t) { return t.k === k; })[0]; };
  MV.grup = function (k) { return MV.GRUPLAR.filter(function (g) { return g.k === k; })[0]; };
  /* türün yetkili meslekleri: grubuna izin veren meslekler (§4.6, birebir) */
  MV.yetkiliMeslekler = function (t) { return MV.MESLEKLER.filter(function (m) { return m.g.indexOf(t.g) >= 0; }); };

  /* ── STANDART KÜTÜPHANESİ bilgisi (M7, 2026-09-24): sürüm, dosya, yükleyen — ÖRNEK (numaralar gerçek standart numaraları,
     sürüm yılları ve atamalar doğrulanmadı; firma kendi satın aldığı kopyayı yükler, dosya firma dışına açılmaz, anayasa 5.1).
     Yükleyen: standardı kullanan türün branş yöneticisi. Yeni sürüm yüklenince eskisi "önceki sürüm" olur; o tarihten önceki
     raporlar eski sürümü gösterir (rapor kullandığı sürümü saklar). */
  var SURUM = ["2014", "2016", "2012", "2018", "2019", "2021", "2023"];
  MV.STANDARTLAR.forEach(function (s, i) {
    var elk = MV.KATALOG.some(function (t) { return t.b === "e" && t.std.indexOf(s.k) >= 0; });
    s.surum = SURUM[i % SURUM.length]; s.yukleyen = elk ? "co" : "sy"; s.tarih = "2025-0" + (1 + i % 8) + "-" + (10 + i % 18);
    s.dosya = { ad: s.no.replace(/\s+/g, "-") + "_" + s.surum + ".pdf", kb: 900 + (i * 437) % 4200 };
  });
  MV.standart("s1").tarih = "2026-03-02";   /* yeni sürüm bu tarihte yüklendi; önceki sürüm aşağıda */
  MV.STANDARTLAR.push(
    { k: "s1e", no: "TS EN 286-1", konu: "Basit basınçlı kaplar — hava ve azot için", surum: "2002", yukleyen: "sy", tarih: "2021-05-10",
      dosya: { ad: "TS-EN-286-1_2002.pdf", kb: 2710 }, yerine: "s1", bitti: "2026-03-02" },
    { k: "s22", no: "TS EN 60204-1", konu: "Makinelerde güvenlik — makinelerin elektrik donanımı", surum: "2018", yukleyen: "co", tarih: "2026-09-18",
      dosya: { ad: "TS-EN-60204-1_2018.pdf", kb: 5120 } });
  MV.standartTurleri = function (k) { return MV.KATALOG.filter(function (t) { return t.std.indexOf(k) >= 0; }); };
  /* ── RAPOR İÇERİĞİ (M7 şablon önizlemesi + M8 saha raporu; TEK KAYNAK) — grup başına ÖRNEK kriter ve test listesi.
     Gerçek şablonda tür ve format başına kodda yazılır (§3, §8.3). Test: op + sınır sayısal (ekranda otomatik değerlendirme). */
  MV.KRITER = {
    kaldirma: ["Taşıyıcı konstrüksiyon: çatlak, deformasyon, korozyon", "Kaldırma elemanları (zincir, halat, çatal): aşınma ve uzama", "Kanca ve emniyet mandalı",
      "Frenler: fonksiyon deneyi", "Sınır anahtarları ve acil durdurma", "Yük diyagramı, etiket ve uyarı işaretleri", "Yük deneyi (dinamik ve statik)"],
    basincli: ["Gövde ve kaynaklar: gözle muayene (korozyon, ezik)", "Emniyet ventili: ayar basıncı ve fonksiyon", "Manometre: okunabilirlik ve kalibrasyon işareti",
      "Tahliye düzeni", "Etiket plakası ve izlenebilirlik", "Hidrostatik deney (deney basıncı)"],
    elektrik: ["Koruma iletkeni sürekliliği", "Topraklama direnci ölçümü", "Kaçak akım koruma: açma akımı ve süresi", "Yalıtım direnci ölçümü",
      "Pano: işaretleme, kapak, kilit, kablo girişleri", "Çevrim (döngü) empedansı"],
    iskele: ["Taban plakaları ve zemin", "Dikme, yatay ve çapraz bağlantılar", "Korkuluk ve topuk levhası", "Ankraj ve duvar bağlantıları", "Erişim merdivenleri"],
    diger: ["Koruyucular ve kilitleme düzenleri", "Acil durdurma", "Kumanda elemanları ve işaretler", "Elektrik donanımı: gözle muayene"]
  };
  MV.TESTLER = {
    kaldirma: [{ ad: "Dinamik yük deneyi", birim: "kg", op: ">=", sinir: 1100, not: "%110 × 1.000 kg anma", ornek: "1100" }, { ad: "Statik yük deneyi", birim: "kg", op: ">=", sinir: 1250, not: "%125 × 1.000 kg anma", ornek: "1250" }],
    basincli: [{ ad: "Hidrostatik deney basıncı", birim: "bar", op: ">=", sinir: 16.5, not: "1,5 × 11 bar çalışma", ornek: "16,5" }, { ad: "Emniyet ventili açma basıncı", birim: "bar", op: "<=", sinir: 11, not: "çalışma basıncı", ornek: "10,8" }],
    elektrik: [{ ad: "Topraklama direnci", birim: "Ω", op: "<=", sinir: 2, ornek: "0,8" }, { ad: "Yalıtım direnci", birim: "MΩ", op: ">=", sinir: 1, ornek: "240" }, { ad: "RCD açma süresi (30 mA)", birim: "ms", op: "<=", sinir: 300, ornek: "22" }],
    iskele: [{ ad: "Dikme düşeylik sapması", birim: "mm/m", op: "<=", sinir: 5, ornek: "4" }],
    diger: [{ ad: "Acil durdurma tepki süresi", birim: "s", op: "<=", sinir: 0.5, ornek: "0,3" }]
  };
  MV.kriterler = function (t) { return MV.KRITER[t.g] || MV.KRITER.diger; };
  MV.testler = function (t) { return MV.TESTLER[t.g] || MV.TESTLER.diger; };
  MV.sinirYaz = function (x) { return (x.op === "<=" ? "≤ " : "≥ ") + String(x.sinir).replace(".", ",") + " " + x.birim + (x.not ? " (" + x.not + ")" : ""); };
  /* hafif / ağır kusur yalnız Bakanlık formatı YÜRÜRLÜKTE olan türde (§4.5, Ek-III 1.9.1) */
  MV.kusurSinifli = function (t) { return !!t.format && t.formatDurum === "zorunlu"; };
  /* kiracı firmanın künyesi (rapor başlığı, §4.2 ve §4.8: akredite kuruluş logosu + ticari ad + TÜRKAK markası) — UYDURMA */
  MV.FIRMA = { ad: "Örnek Muayene ve Kontrol Ltd. Şti.", kisa: "KM", adres: "Örnek Mahallesi Deneme Caddesi No: 1, Gebze / Kocaeli",
    eposta: "rapor@firma.example", akr: "AB-0000-M", nusha: 2 };

  /* ── EKİPMAN SİCİLİ (modül 7; M3) — kalıcı, tesise bağlı, kod firmada eşsiz (§3.5) ─────────────────────────────
     Planlar maketinin plan tesislerindeki ekipmanlar AYNI algoritmayla üretilir (kod HT-1001…, konum, önceki kontrol, rapor no);
     öteki tesisler aynı düzenle devam eder. "Son kontrol" = son İMZALI rapor (2026 planlarının raporları henüz onayda). */
  var PLAN_TUR = ["HT", "FL", "KK", "KP", "TP", "KS", "ZV", "YA", "BK", "ET", "AT", "YK", "DP", "JN"];
  MV.PLAN_KATALOG = PLAN_TUR.map(MV.tur);   /* Planlar maketinin 14 türü, aynı sırayla */
  var MEK = MV.PLAN_KATALOG.filter(function (t) { return t.b === "m" && t.k !== "BK"; });
  var ELK = MV.PLAN_KATALOG.filter(function (t) { return t.b === "e" && t.k !== "JN"; });
  var KONUM = ["Üretim holü", "Kompresör odası", "Sevkiyat alanı", "Depo girişi", "Bakım atölyesi", "Ana dağıtım odası", "Yükleme rampası", "Hat 2", "Kazan dairesi", "Çatı"];
  var SONUC = ["Uygun", "Uygun", "Hafif kusurlu", "Uygun", "Uygun", "Kusurlu", "Uygun"];
  var ekHex = function (n) { return ("0000" + ((Math.imul(n, 2654435761) >>> 0) % 1048576).toString(16)).slice(-5); };
  MV.raporNo = function (aayy, sira) { return "KM-" + aayy + "-" + sira + "-" + ekHex(sira * 7 + 3); };
  /* Planlar'daki planların ekipman parametreleri (id, mekanik, elektrik, bu planda ilk kez kaydedilen, tesiste plana alınmamış, gün) */
  var PLAN_EKP = [[1, 8, 4, 2, 2, "23"], [2, 5, 0, 0, 0, "23"], [3, 14, 6, 1, 0, "24"], [4, 2, 7, 0, 0, "25"], [5, 3, 0, 0, 0, "26"],
    [6, 7, 3, 0, 0, "29"], [7, 2, 0, 0, 0, "30"], [8, 4, 0, 0, 0, "22"], [9, 16, 8, 0, 0, "21"]];
  var MARKA = ["Atlas", "Kuzey Makina", "Delta", "Orion", "Pars", "Vega"];   /* uydurma marka adları */
  MV.EKIPMAN = [];
  var kodSira = 1001, eskiSira = 402;
  function ekipmanEkle(tesis, tur, konum, onceki, ilk, i) {
    var kod = tur.k + "-" + (kodSira++);
    MV.EKIPMAN.push({ kod: kod, tur: tur.k, tesis: tesis, konum: konum, onceki: onceki, ilk: ilk,
      marka: MARKA[(i + kodSira) % MARKA.length], model: tur.k + "-" + (100 + (kodSira * 7) % 900), imal: 2008 + (kodSira * 3) % 16, seri: "SN" + (kodSira * 7919 % 900000 + 100000) });
  }
  PLAN_EKP.forEach(function (p) {
    var tesis = MV.TESISLER.filter(function (t) { return t.pid === p[0]; })[0].id, toplam = p[1] + p[2], yeni = p[3];
    for (var i = 0; i < toplam + p[4]; i++) {
      var b = i < p[1] ? "m" : i < toplam ? "e" : "m", havuz = b === "m" ? MEK : ELK, j = b === "m" ? i : i - p[1];
      var ilk = i >= toplam - yeni && i < toplam;
      ekipmanEkle(tesis, havuz[j % havuz.length], KONUM[(i + p[0]) % KONUM.length],
        ilk ? null : { tarih: "2025-09-" + p[5], sonuc: SONUC[(i + p[0]) % SONUC.length], rapor: MV.raporNo("0925", eskiSira++), kisi: i % 3 === 2 ? "ea" : "mk" }, ilk, i);
      if (i < toplam) MV.EKIPMAN[MV.EKIPMAN.length - 1].plan = p[0];   /* planın kapsamında (toplamın ötesi: tesiste, plana alınmamış) */
    }
  });
  /* plan dışındaki tesisler: son kontrol tesisin son tarihiyle; türler sırayla (öteki türler de görünsün) */
  var DIS_TUR = ["KU", "HT", "FL", "ET", "AT", "PR", "YG", "IS", "TR", "LP", "KS", "DP"];
  MV.TESISLER.filter(function (t) { return !t.pid; }).forEach(function (t, n) {
    for (var i = 0; i < t.ekipman; i++) {
      var tur = MV.tur(DIS_TUR[(i + n * 5) % DIS_TUR.length]);
      ekipmanEkle(t.id, tur, KONUM[(i + n) % KONUM.length], { tarih: t.son, sonuc: SONUC[(i + n + 2) % SONUC.length], rapor: MV.raporNo(t.son.slice(5, 7) + t.son.slice(2, 4), eskiSira++), kisi: tur.b === "e" ? "ea" : "hp" }, false, i);
    }
  });
  /* kod değiştirme yalnız yöneticide, eski kod geçmişte kalır (§3.5 karar 19) — bir örnek */
  MV.EKIPMAN[4].eskiKod = [{ kod: "TP-05", tarih: "2024-02-12", kim: "sy", gerekce: "Etiket yenilendi, firma kod düzenine geçildi" }];   /* TP-1005 */
  MV.ekipman = function (kod) { return MV.EKIPMAN.filter(function (e) { return e.kod === kod; })[0]; };
  /* EKİPMAN KODU KURALI (§3.4–3.5, reisim 17–19): A–Z (Türkçe harf yok), 0–9, tire; 3–20 hane; firmada eşsiz. Planlar'daki
     ekipman ekle penceresiyle aynı kural ve iletiler (orada plan bağlamıyla). */
  MV.kodNormal = function (v) { return v.replace(/\s+/g, "").replace(/[a-z]/g, function (c) { return c.toUpperCase(); }); };
  MV.kodDurum = function (kod, haric) {
    if (!kod) return { tur: "bos", metin: "Etiketteki kodu yazın: harf (A–Z), rakam ve tire. Kod firmada eşsiz olmalı." };
    if (/[^A-Z0-9-]/.test(kod)) return { tur: "hata", metin: "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok)." };
    if (kod.length < 3 || kod.length > 20) return { tur: "hata", metin: "Kod 3 ile 20 hane arasında olmalı." };
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kod)) return { tur: "hata", metin: "Tire başta, sonda ya da art arda olamaz." };
    var v = MV.ekipman(kod);
    if (v && v.kod !== haric) { var t = MV.tesis(v.tesis); return { tur: "hata", metin: kod + " kayıtlı: " + MV.tur(v.tur).ad + " · " + MV.musteri(t.m).kisa + " / " + t.ad + ". Aynı kod iki ekipmana verilemez." }; }
    var eski = MV.EKIPMAN.filter(function (e) { return (e.eskiKod || []).some(function (x) { return x.kod === kod; }); })[0];
    if (eski) return { tur: "hata", metin: kod + " daha önce " + eski.kod + " ekipmanının koduydu; eski kodlar yeniden verilmez." };
    return { tur: "tamam", metin: "Kod kullanılabilir; bu firmada başka ekipmanda yok." };
  };
  /* ── ÖLÇÜM CİHAZI · ZİMMET (modül 8, 9; M4, 2026-09-24) ──────────────────────────────────────────────────────
     Varlık = cihaz · araç · diğer (§3.1 modül 9). Kimde = son teslim hareketinin alanı: kişi · "depo" · "lab" (kalibrasyonda).
     Cihaz türünün ekipman grupları: rapora yalnız ilgili gruptaki zimmetli cihazlar gelsin (açık soru §3'e ÖNERİ).
     Marka, envanter no, sertifika no, plaka UYDURMA (plaka il kodu 00: gerçek olamaz). Laboratuvar adları uydurma. */
  MV.CIHAZ_TURLERI = [
    { k: "topraklama", ad: "Topraklama ölçer", g: ["elektrik"] }, { k: "izolasyon", ad: "İzolasyon direnci ölçer", g: ["elektrik"] },
    { k: "tesisat", ad: "Tesisat test cihazı (çevrim / RCD)", g: ["elektrik"] }, { k: "pens", ad: "Pens ampermetre", g: ["elektrik"] },
    { k: "multimetre", ad: "Multimetre", g: ["elektrik"] }, { k: "termal", ad: "Termal kamera", g: ["elektrik", "basincli"] },
    { k: "kalinlik", ad: "Ultrasonik kalınlık ölçer", g: ["basincli", "kaldirma"] }, { k: "manometre", ad: "Dijital manometre", g: ["basincli"] },
    { k: "dinamometre", ad: "Dinamometre / yük hücresi", g: ["kaldirma"] }, { k: "mesafe", ad: "Lazer mesafe ölçer", g: ["kaldirma", "iskele"] },
    { k: "luksmetre", ad: "Lüksmetre", g: ["elektrik"] }, { k: "kumpas", ad: "Dijital kumpas", g: ["kaldirma", "diger"] }
  ];
  MV.cihazTuru = function (k) { return MV.CIHAZ_TURLERI.filter(function (t) { return t.k === k; })[0]; };
  var LAB = ["Kalibrasyon Laboratuvarı A (akredite)", "Kalibrasyon Laboratuvarı B (akredite)"];
  /* [envanter, tür, marka, bitiş, ara kontrol son, ölçüm aralığı] — kalibrasyon geçerliliği 12 ay, ara kontrol 6 ay (varsayım) */
  var C = [
    ["OC-001", "topraklama", "Vega", "2026-10-10", "2026-04-12", "0–2 kΩ"], ["OC-002", "izolasyon", "Orion", "2027-03-02", "2026-09-01", "0,1 MΩ–10 GΩ"],
    ["OC-003", "tesisat", "Delta", "2026-09-18", "2026-03-20", "0,01–2 kΩ · 10–500 mA"], ["OC-004", "pens", "Pars", "2027-01-15", "2026-07-15", "0–1000 A"],
    ["OC-005", "multimetre", "Vega", "2026-12-20", "2026-06-22", "0–1000 V"], ["OC-006", "termal", "Orion", "2026-10-01", "2026-04-03", "−20…650 °C"],
    ["OC-007", "kalinlik", "Delta", "2027-02-11", "2026-08-10", "1–300 mm"], ["OC-008", "manometre", "Pars", "2026-11-30", "2026-05-28", "0–400 bar"],
    ["OC-009", "dinamometre", "Vega", "2027-04-20", "2026-01-18", "0–5 t"], ["OC-010", "mesafe", "Orion", "2027-05-05", "2026-08-02", "0,05–100 m"],
    ["OC-011", "manometre", "Delta", "2026-10-12", "2026-04-14", "0–250 bar"], ["OC-012", "dinamometre", "Pars", "2027-01-30", "2026-07-29", "0–10 t"],
    ["OC-013", "izolasyon", "Vega", "2026-09-05", "2026-03-06", "0,1 MΩ–10 GΩ"], ["OC-014", "topraklama", "Orion", "2026-09-20", "2026-03-22", "0–2 kΩ"],
    ["OC-015", "luksmetre", "Delta", "2027-06-01", "2026-06-01", "0–200 000 lx"], ["OC-016", "kumpas", "Pars", "2027-02-28", "2026-08-27", "0–300 mm"],
    ["OC-017", "kalinlik", "Vega", "2026-10-20", "2026-04-21", "1–300 mm"], ["OC-018", "multimetre", "Orion", "2027-03-15", "2026-09-14", "0–1000 V"],
    ["OC-019", "tesisat", "Delta", "2027-07-01", "2026-07-01", "0,01–2 kΩ · 10–500 mA"], ["OC-020", "pens", "Pars", "2027-02-02", "2026-08-03", "0–1000 A"]
  ];
  var ARASIZ = ["kumpas", "mesafe", "luksmetre"];
  MV.VARLIKLAR = C.map(function (c, i) {
    var t = MV.cihazTuru(c[1]), bit = c[3], y = +bit.slice(0, 4);
    return { id: "v" + (i + 1), tur: "cihaz", ad: t.ad, cihazTur: c[1], env: c[0], marka: c[2], model: c[0].replace("OC-", "M") + "0", seri: "CS" + (48213 + i * 977),
      /* 2026-09-26 (M4 2. tur, 60: ara kontrol isteğe bağlı): kumpas, mesafe ölçer, lüksmetrede takip edilmiyor */
      aralik: c[5], bitis: bit, araSon: ARASIZ.indexOf(c[1]) >= 0 ? null : c[4], araPeriyot: ARASIZ.indexOf(c[1]) >= 0 ? null : 6,
      kal: [{ tarih: (y - 1) + bit.slice(4), bitis: bit, lab: LAB[i % 2], sertifika: "KL-" + (y - 1) + "-" + (410 + i * 13), sonuc: "Uygun" },
            { tarih: (y - 2) + bit.slice(4), bitis: (y - 1) + bit.slice(4), lab: LAB[(i + 1) % 2], sertifika: "KL-" + (y - 2) + "-" + (300 + i * 11), sonuc: "Uygun" }],
      ara: ARASIZ.indexOf(c[1]) >= 0 ? [] : [{ tarih: c[4], kim: i % 2 ? "co" : "sy", yontem: "Referans değerle karşılaştırma", sonuc: "Uygun" }], rapor: 12 + (i * 7) % 40 };
  }).concat([
    { id: "a1", tur: "arac", ad: "Hafif ticari araç", plaka: "00 MAK 001", marka: "Delta", model: "Van", yil: 2022 },
    { id: "a2", tur: "arac", ad: "Hafif ticari araç", plaka: "00 MAK 002", marka: "Delta", model: "Van", yil: 2023 },
    { id: "a3", tur: "arac", ad: "Binek araç", plaka: "00 MAK 003", marka: "Orion", model: "Sedan", yil: 2021 },
    { id: "d1", tur: "diger", ad: "Saha tableti", env: "TB-01", marka: "Pars", model: "10 inç" }, { id: "d2", tur: "diger", ad: "Saha tableti", env: "TB-02", marka: "Pars", model: "10 inç" },
    { id: "d3", tur: "diger", ad: "Saha tableti", env: "TB-03", marka: "Pars", model: "10 inç" },
    { id: "d4", tur: "diger", ad: "Yüksekte çalışma emniyet seti", env: "KKD-11", marka: "Vega", model: "Tam vücut kemeri + lanyard" },
    { id: "d5", tur: "diger", ad: "Baret ve KKD seti", env: "KKD-12", marka: "Orion", model: "Baret, gözlük, eldiven" }
  ]);
  MV.varlik = function (id) { return MV.VARLIKLAR.filter(function (v) { return v.id === id; })[0]; };
  MV.varlikAdi = function (v) { return v.tur === "arac" ? v.plaka + " · " + v.ad : (v.env ? v.env + " · " : "") + v.ad; };
  /* ZİMMET HAREKETLERİ — her teslim ayrı kayıt: tarih-saat, teslim eden → alan, fotoğraf, not, zimmet formu (onay) */
  var H = [   /* [varlık, tarih, eden, alan, foto, not] ; "depo" / "lab" yer; depo tarafında yetkili Zeynep Arslan (za) */
    ["v1", "2025-10-14T09:10", "depo", "ea", 2, "Çanta, problar ve kazıklar tam."], ["v2", "2026-03-05T08:40", "depo", "ea", 2, "Problar tam."],
    ["v3", "2025-09-22T10:05", "depo", "ea", 2, "Adaptör seti tam."], ["v4", "2026-01-20T09:00", "depo", "dk", 1, ""], ["v5", "2026-01-20T09:02", "depo", "dk", 1, ""],
    ["v6", "2025-10-06T11:30", "depo", "dk", 2, "Kılıf ve şarj aleti tam."], ["v7", "2026-02-16T08:15", "depo", "mk", 1, "Jel ve prob tam."],
    ["v8", "2025-12-05T13:20", "depo", "mk", 1, ""], ["v9", "2026-04-27T08:30", "depo", "mk", 2, "Kalibrasyon etiketi sağlam."],
    ["v10", "2026-05-11T09:45", "depo", "bs", 1, ""], ["v11", "2025-10-15T10:00", "depo", "bs", 1, ""],
    ["v13", "2025-09-08T09:30", "depo", "ok", 1, ""], ["v15", "2026-06-03T14:10", "depo", "ea", 1, ""], ["v16", "2026-03-03T09:00", "depo", "hp", 1, ""],
    ["v17", "2025-10-24T08:50", "depo", "hp", 1, ""], ["v18", "2026-03-18T10:20", "depo", "ta", 1, ""],
    ["v14", "2025-09-24T09:00", "depo", "sy", 1, ""], ["v14", "2026-09-15T16:40", "sy", "lab", 2, "Kalibrasyona gönderildi; kargo takip no formda."],
    ["v20", "2025-02-05T09:00", "depo", "ns", 1, ""], ["v20", "2026-06-30T16:30", "ns", "depo", 2, "Ayrılışta iade; kılıf yıpranmış."],
    ["a1", "2025-06-02T08:00", "depo", "ea", 4, "Km 21.480 · hasar yok."], ["a1", "2026-01-05T08:10", "ea", "mk", 4, "Km 34.905 · arka tamponda çizik (fotoğraf 3)."],
    ["a2", "2026-02-02T08:05", "depo", "ea", 4, "Km 12.310 · hasar yok."], ["a3", "2026-05-18T17:30", "bs", "depo", 3, "Km 58.742 · lastikler değişmeli."],
    ["d1", "2025-11-03T09:00", "depo", "mk", 2, "Kılıf, kalem, şarj aleti."], ["d2", "2025-11-03T09:05", "depo", "ea", 2, "Kılıf, kalem, şarj aleti."],
    ["d3", "2026-05-11T09:50", "depo", "bs", 2, ""], ["d4", "2026-04-01T08:30", "depo", "mk", 3, "Son muayene etiketi 03/2026."], ["d5", "2026-01-20T09:10", "depo", "dk", 1, ""]
  ];
  MV.ZIMMET = H.map(function (h, i) { return { id: "z" + (i + 1), v: h[0], tarih: h[1], eden: h[2], alan: h[3], foto: h[4], not: h[5], onay: h[3] !== "lab" && h[3] !== "depo" ? h[1].slice(0, 10) : null, yetkili: "za" }; });
  MV.hareketler = function (vid) { return MV.ZIMMET.filter(function (z) { return z.v === vid; }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }); };
  MV.kimde = function (vid) { var h = MV.hareketler(vid)[0]; return h ? h.alan : "depo"; };
  MV.yerAdi = function (k) { return k === "depo" ? "Depo" : k === "lab" ? "Kalibrasyonda" : MV.kisi(k).ad; };
  /* belli bir tarihte varlık kimdeydi: o tarihe kadarki son hareketin alanı */
  MV.kimdeTarih = function (vid, t) { var h = MV.hareketler(vid).filter(function (x) { return x.tarih <= t; })[0]; return h ? h.alan : "depo"; };
  MV.zimmetKapsam = function (k, t) { return MV.VARLIKLAR.filter(function (v) { return MV.kimdeTarih(v.id, t) === k; }).map(function (v) { return v.id; }); };
  /* kişinin zimmet geçmişi (reisim 2026-09-25: "o personele hangi tarihte hangi ekipman verilmiş hangi tarihte alınmış görülsün"):
     kişiye yapılan her teslim bir satır; aynı varlığın sonraki hareketi geri alınış (tarih + nereye). Yeniden eskiye. */
  MV.zimmetGecmisi = function (k) {
    var l = [];
    MV.ZIMMET.filter(function (z) { return z.alan === k; }).forEach(function (z) {
      var sonra = MV.hareketler(z.v).filter(function (x) { return x.tarih > z.tarih; }).reverse()[0];
      l.push({ v: MV.varlik(z.v), verildi: z, alindi: sonra || null });
    });
    return l.sort(function (a, b) { return a.verildi.tarih < b.verildi.tarih ? 1 : -1; });
  };
  /* İMZALI ZİMMET TESLİM FORMLARI (2026-09-25, reisim: zimmetlenen varlıklar PDF olarak çıkar, imzalanıp taranır, personel kartına konur;
     "imzalı zimmet formuna tıklayınca açılmalı"). Kişi başına yüklenen formlar, yeniden eskiye; kapsam = form tarihinde kişideki varlıklar.
     En son form bugünkü zimmetle aynı değilse ESKİMİŞTİR (yeni imza gerekir). Örnek: Mert Kaya'nın iki formu, sonuncusu güncel · Elif
     Aydın'ın tek formu eski (sonra araç devredildi, cihaz ve tablet eklendi). */
  MV.ZIMMET_FORMLARI = {};
  [["mk", "ZF-1225-006", "2025-12-06"], ["mk", "ZF-0426-003", "2026-04-28"], ["ea", "ZF-1025-011", "2025-10-15"]].forEach(function (x) {
    (MV.ZIMMET_FORMLARI[x[0]] = MV.ZIMMET_FORMLARI[x[0]] || []).unshift({ no: x[1], tarih: x[2], kapsam: MV.zimmetKapsam(x[0], x[2] + "T23:59"), dosya: "zimmet-formu-imzali.pdf" });
  });
  MV.zimmetFormu = function (k) { return (MV.ZIMMET_FORMLARI[k] || [])[0] || null; };
  MV.zimmetFormuGuncel = function (k, kapsam) {
    var f = MV.zimmetFormu(k); if (!f) return false;
    return f.kapsam.slice().sort().join() === kapsam.slice().sort().join();
  };
  /* kalibrasyon durumu: gecti (bitiş geçti) · yakin (30 gün içinde) · lab (laboratuvarda) · gecerli */
  MV.kalDurum = function (v) {
    if (v.tur !== "cihaz") return null;
    if (MV.kimde(v.id) === "lab") return "lab";
    var k = Math.round((new Date(v.bitis + "T12:00:00") - new Date("2026-09-23T12:00:00")) / 864e5);
    return k < 0 ? "gecti" : k <= 30 ? "yakin" : "gecerli";
  };

  /* sonraki kontrol = son imzalı kontrol + türün periyodu (inspector gerekçeyle değiştirebilir, §4.7) */
  MV.sonrakiKontrol = function (e) {
    if (!e.onceki) return null;
    var d = new Date(e.onceki.tarih + "T12:00:00"); d.setMonth(d.getMonth() + MV.tur(e.tur).periyot);
    return d.toISOString().slice(0, 10);
  };
  MV.meslekAd = function (p) { return p.meslek === "diger" ? p.meslekMetin : MV.meslek(p.meslek).ad; };
  MV.bas = function (ad) { return ad.split(" ").map(function (x) { return x.charAt(0); }).join("").slice(0, 2).toLocaleUpperCase("tr"); };
  /* yetkili kişi (inspector) olabilir mi: meslek en az bir gruba izin veriyor (teknisyen/diğer değil) */
  MV.yetkiliOlabilir = function (p) { return MV.meslek(p.meslek).g.length > 0; };
  /* eksik bilgi — UYARI, engel değil (reisim 2026-09-25, 39: "sadece uyarsın, ama yapılabilir olsun"; 38: grup yetkilendirmesi
     gibi teknik ayrıntı yok). Personel (M1) bunu kullanır; aşağıdaki kabulEksik M6 Plan aç'ın eski kuralı, sırası gelince buna döner. */
  MV.eksikBilgi = function (p) {
    if (!p.hesap || p.hesap.roller.indexOf("inspector") < 0) return [];
    var e = [];
    if (!p.ekipnet) e.push("EKİPNET kayıt no boş");
    if (!MV.yetkiliOlabilir(p)) e.push("Meslek yetkili kişi meslekleri arasında değil");
    return e;
  };
  /* plan kabulü için kişi eksikleri (§3.2 madde 2b–2c; 2a İSG-KATİP plan × tesis başına, burada değil) */
  MV.kabulEksik = function (p) {
    if (!p.hesap || p.hesap.roller.indexOf("inspector") < 0) return null;
    var e = [];
    if (!p.ekipnet) e.push("EKİPNET kayıt numarası yok");
    if (!MV.yetkiliOlabilir(p)) e.push("Meslek yetkili kişi olamaz");
    if (!Object.keys(p.yetki).length) e.push("Hiçbir gruba yetkilendirilmemiş");
    return e;
  };

  /* ── EĞİTİMLER (modül 10; M10 uyarıları + M16 ekranı, 2026-09-24) — personelin eğitim kayıtları ve tekrar tarihleri.
     Eğitim adları ve tekrar süreleri ÖRNEK (mevzuat karşılığı doğrulanmadı; M16 sorusu). Bakanlık yetkili kişi eğitimi burada değil,
     personelin belgesi (M1). Sayılar personel kartındaki eski sabit sayılarla aynı; bir kişide (Kaan Er) tekrar tarihi geçmiş örnek. */
  MV.EGITIM_TURLERI = [
    { k: "isg", ad: "Temel İSG eğitimi", tekrar: 12 }, { k: "yuksek", ad: "Yüksekte çalışma eğitimi", tekrar: 12 },
    { k: "ilkyardim", ad: "İlk yardım", tekrar: 36 }, { k: "17020", ad: "TS EN ISO/IEC 17020 bilgilendirme", tekrar: 24 },
    { k: "elektrik", ad: "Elektrikte güvenli çalışma", tekrar: 12 }, { k: "yangin", ad: "Yangın söndürme ve tahliye", tekrar: 12 }
  ];
  MV.egitimTuru = function (k) { return MV.EGITIM_TURLERI.filter(function (t) { return t.k === k; })[0]; };
  var gunEkle = function (iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  var ayEkle = function (iso, n) { var d = new Date(iso + "T12:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
  MV.EGITIMLER = [];
  MV.PERSONEL.forEach(function (p, pi) {
    var n = p.sayilar.egitim, y = p.sayilar.egitimYakin;
    for (var i = 0; i < n; i++) {
      var t = MV.EGITIM_TURLERI[(i + pi) % MV.EGITIM_TURLERI.length], kalan = p.id === "ke" ? -6 : i < y ? 14 + i * 19 + (pi % 5) * 3 : 95 + ((pi * 37 + i * 53) % 200);
      var tekrar = gunEkle("2026-09-23", kalan);
      MV.EGITIMLER.push({ id: "g" + (MV.EGITIMLER.length + 1), kisi: p.id, k: t.k, tarih: ayEkle(tekrar, -t.tekrar), tekrar: tekrar, belge: (pi + i) % 4 !== 3,
        kurum: i % 2 ? "Dış eğitim kurumu" : "Firma içi" });
    }
  });
  /* tekrar: geçti · 60 gün içinde · geçerli (eşik 60 gün — personel kartındaki "tekrarı 60 gün içinde"le aynı; soru) */
  MV.egitimDurum = function (x) { var k = Math.round((new Date(x.tekrar + "T12:00:00") - new Date("2026-09-23T12:00:00")) / 864e5); return k < 0 ? "gecti" : k <= 60 ? "yakin" : "gecerli"; };
  MV.egitimleri = function (kid) { return MV.EGITIMLER.filter(function (x) { return x.kisi === kid; }); };

  /* ── RAPORLAR (modül 14–16; M9, 2026-09-24) — firma geneli rapor kaydı. Planlar maketindeki plan raporları AYNI numarayla
     (sıra 760'tan: plan 9 → 8 → 1; Planlar'daki dağılım ve sonuç kuralı), geçen yılın imzalı raporları ekipman kaydından.
     Durum: taslak → onayda → onaylandı (son imza bekliyor) → imzalı (müşteriye açık). Planlar'ın "Onaylandı"sı burada onaylandı + imzalı.
     Raporu yazan türün branşından (elektrik Elif Aydın, mekanik Mert Kaya; M8 ile aynı); onaylayan branş yöneticisi. */
  MV.YONETICI = { m: "sy", e: "co" };
  var dk = function (iso, n) { var d = new Date(iso + ":00Z"); d.setUTCMinutes(d.getUTCMinutes() + n); return d.toISOString().slice(0, 16); };
  MV.RAPORLAR = [];
  MV.EKIPMAN.filter(function (e) { return e.onceki; }).forEach(function (e) {   /* geçen yılın imzalı raporları */
    var b = MV.tur(e.tur).b, o = e.onceki.tarih + "T10:00";
    MV.RAPORLAR.push({ no: e.onceki.rapor, kod: e.kod, tesis: e.tesis, plan: null, kisi: e.onceki.kisi, olustu: o, durum: "imzali", sonuc: e.onceki.sonuc,
      gonderildi: dk(o, 50), onay: { kim: MV.YONETICI[b], zaman: dk(o, 300) }, imza: { zaman: dk(o, 420) } });
  });
  var PLAN_RAP = [[9, "2026-09-21T13:05", { onaylandi: 14, onayda: 8 }], [8, "2026-09-22T09:02", { onayda: 3, taslak: 1 }], [1, "2026-09-23T09:04", { onayda: 3, taslak: 7 }]];
  var raporSira = 760;
  PLAN_RAP.forEach(function (pr) {
    var id = pr[0], ekp = MV.EKIPMAN.filter(function (e) { return e.plan === id; }), tesis = ekp[0].tesis, dag = [];
    ["onaylandi", "onayda", "taslak"].forEach(function (d) { for (var i = 0; i < (pr[2][d] || 0); i++) dag.push(d); });
    dag.forEach(function (d, k) {
      var e = ekp[k], b = MV.tur(e.tur).b, o = dk(pr[1], 10 + k * 6), r = { no: MV.raporNo("0926", raporSira++), kod: e.kod, tesis: tesis, plan: id, kisi: b === "e" ? "ea" : "mk",
        olustu: o, durum: d, sonuc: d === "taslak" ? null : SONUC[(k + id) % SONUC.length], gonderildi: d === "taslak" ? null : dk(o, 30 + (k % 4) * 7), onay: null, imza: null };
      if (d === "onaylandi") {   /* plan 9: ilk 10'u imzalandı ve müşteriye açıldı, son 4'ü son imzayı bekliyor */
        r.onay = { kim: MV.YONETICI[b], zaman: k < 10 ? dk("2026-09-22T09:40", k * 11) : dk("2026-09-23T11:20", k * 4) };
        if (k < 10) { r.durum = "imzali"; r.imza = { zaman: dk("2026-09-22T15:05", k * 3) }; }
      }
      MV.RAPORLAR.push(r);
    });
  });
  /* geri gönderilmiş taslak (M8'deki ZV-1007 ile aynı) */
  MV.RAPORLAR.filter(function (r) { return r.kod === "ZV-1007" && r.plan === 1; })[0].geri = { kim: "sy", zaman: "2026-09-23T15:10", gerekce: "Yük deneyi değerleri yazılmamış: dinamik ve statik deney yüklerini girin." };
  MV.rapor = function (no) { return MV.RAPORLAR.filter(function (r) { return r.no === no; })[0]; };
  /* rapor durumunun adı ve rozeti (Planlar'daki Taslak · Onayda · Onaylandı; onaylandı burada "İmza bekliyor" + "Müşteriye açık") */
  MV.RAPOR_DURUM = { taslak: { ad: "Taslak", rozet: "a-rozet-bekliyor" }, geri: { ad: "Geri gönderildi", rozet: "a-rozet-red" }, onayda: { ad: "Onayda", rozet: "a-rozet-kabul" },
    onaylandi: { ad: "İmza bekliyor", rozet: "a-rozet-denetimde" }, imzali: { ad: "Müşteriye açık", rozet: "a-rozet-tamam" } };
  /* sonuç adı §4.5'e göre: hafif / ağır yalnız format yürürlükteki türde; Planlar maketi taslak formatlı türde de "Hafif kusurlu" yazıyor
     (maket tutarsızlığı) → burada "Kusurlu"ya çevrilir */
  MV.sonucAd = function (r) { if (!r.sonuc) return null; return r.sonuc === "Uygun" || MV.kusurSinifli(MV.tur(MV.ekipman(r.kod).tur)) ? r.sonuc : "Kusurlu"; };
  MV.raporDurum = function (r) { return MV.RAPOR_DURUM[r.durum === "taslak" && r.geri ? "geri" : r.durum]; };
  /* UYGUNSUZLUK KAYDI (§3.2 madde 6: ayrı kayıt — rapor, ekipman, kriter, açıklama, sınıf, tarih): imzalı ve sonucu "Uygun" olmayan
     rapordan; aynı ekipmanın SONRAKİ imzalı raporu gelince "giderildi" (sonraki kontrol ya da ikinci kontrol, Ek-III 1.9). Kriter ve açıklama
     rapor belgesindekiyle aynı (MB.belge). Müşteri kartındaki "açık uygunsuzluk" sayısı buradan (M2'deki sabit sayı yerine). */
  MV.uygunsuzluklar = function (mid) {
    var ts = MV.tesisleri(mid).map(function (t) { return t.id; }), l = [];
    MV.RAPORLAR.filter(function (r) { return r.durum === "imzali" && ts.indexOf(r.tesis) >= 0 && r.sonuc && r.sonuc !== "Uygun"; }).forEach(function (r) {
      var e = MV.ekipman(r.kod), t = MV.tur(e.tur), sinifli = MV.kusurSinifli(t), hafif = /Hafif/.test(r.sonuc);
      var sonra = MV.RAPORLAR.filter(function (x) { return x.kod === r.kod && x.durum === "imzali" && x.olustu > r.olustu; })[0];
      l.push({ id: "u-" + r.no, rapor: r, e: e, t: t, tesis: r.tesis, kriter: MV.kriterler(t)[hafif ? 2 : 1], sinif: sinifli ? (hafif ? "Hafif" : "Ağır") : "Kusurlu",
        aciklama: hafif ? "Madde 3'te okunabilirliği azaltan hasar." : "Madde 2'de izin verilen sınırın üstünde aşınma.", tarih: r.olustu.slice(0, 10), durum: sonra ? "giderildi" : "acik", kapatan: sonra || null });
    });
    return l;
  };
  MV.acikUygunsuz = function (mid) { return MV.uygunsuzluklar(mid).filter(function (u) { return u.durum === "acik"; }).length; };
  /* ── TEKLİFLER (modül 11; M12, faz 2, 2026-09-24) — müşteri, tesis, kalem (ekipman türü × adet × birim fiyat), durum (§3.1).
     Fiyat listesi firma ayarı (ÖRNEK tutarlar, TL, KDV hariç); KDV %20. No T-AAYY-SIRA (proje no'nun düzeni; öneri). Plan açılan her tesisin
     kabul edilmiş teklifi var; kalemler tesisin kayıtlı ekipmanından (tür başına adet). Raporlar kalemlere türüyle bağlanır (§3.2 madde 5). */
  MV.FIYAT = { HT: 900, FL: 1250, KK: 2200, KP: 1400, TP: 450, KS: 850, ZV: 1100, YA: 2400, BK: 3200, ET: 3500, AT: 1500, YK: 1500, DP: 650, JN: 1200,
    KU: 4800, LP: 1800, YG: 2600, TR: 2900, IS: 1600, MB: 3900, YM: 2500, AE: 2700, SP: 2300, PR: 1300 };
  MV.KDV = 20;
  var tesisKalemleri = function (tid) {
    var m = {}; MV.EKIPMAN.filter(function (e) { return e.tesis === tid; }).forEach(function (e) { m[e.tur] = (m[e.tur] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { tur: k, adet: m[k], fiyat: MV.FIYAT[k] }; });
  };
  MV.tesisKalemleri = tesisKalemleri;
  /* [tesis, durum, tarih, gönderildi, sonuç tarihi, not] */
  var TK = [["t12", "kabul", "2026-08-10", "2026-08-11", "2026-08-18"], ["t11", "kabul", "2026-08-14", "2026-08-14", "2026-08-21"],
    ["t1", "kabul", "2026-09-01", "2026-09-01", "2026-09-04"], ["t4", "kabul", "2026-09-03", "2026-09-03", "2026-09-08"], ["t5", "kabul", "2026-09-04", "2026-09-05", "2026-09-09"],
    ["t9", "kabul", "2026-09-05", "2026-09-05", "2026-09-10"], ["t7", "kabul", "2026-09-08", "2026-09-08", "2026-09-12"], ["t10", "kabul", "2026-09-09", "2026-09-09", "2026-09-11"],
    ["t8", "kabul", "2026-09-10", "2026-09-10", "2026-09-15"], ["t6", "red", "2026-09-11", "2026-09-11", "2026-09-17", "Fiyat bütçenin üstünde; gelecek yıl yeniden değerlendirilecek."],
    ["t2", "suresi", "2026-08-05", "2026-08-06", null], ["t13", "gonderildi", "2026-09-17", "2026-09-17", null], ["t14", "gonderildi", "2026-09-21", "2026-09-22", null],
    ["t15", "taslak", "2026-09-23", null, null], ["t3", "taslak", "2026-09-22", null, null]];
  var tkSira = {};
  MV.TEKLIFLER = TK.map(function (x) {
    var ay = x[2].slice(5, 7) + x[2].slice(2, 4); tkSira[ay] = (tkSira[ay] || 0) + 1;
    return { no: "T-" + ay + "-" + ("00" + tkSira[ay]).slice(-3), tesis: x[0], m: MV.tesis(x[0]).m, durum: x[1], tarih: x[2], gonderildi: x[3], sonuc: x[4], gerekce: x[5] || "",
      gecerlilik: 30, hazirlayan: "za", kalemler: tesisKalemleri(x[0]) };
  });
  MV.teklif = function (no) { return MV.TEKLIFLER.filter(function (t) { return t.no === no; })[0]; };
  MV.teklifTutar = function (t) { return t.kalemler.reduce(function (n, k) { return n + k.adet * k.fiyat; }, 0); };
  /* teklif kalemine bağlı raporlar: tesisin bu yılki (teklif sonrası) raporları, türüyle (§3.2 madde 5) */
  MV.kalemRaporlari = function (t, tur) { return MV.RAPORLAR.filter(function (r) { return r.tesis === t.tesis && r.olustu.slice(0, 10) >= t.tarih && MV.ekipman(r.kod).tur === tur; }); };
  MV.para = function (n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL"; };

  /* ── İŞ SÖZLEŞMELERİ (modül 12, firmalar arası; M13, faz 2, 2026-09-24) — muayene firması ile müşteri arasında. İSG-KATİP sözleşmesinden
     AYRI (o, işveren ile yetkili kişi arasında; M5). Makette kabul edilen her teklife bir sözleşme (kapsam: teklifin tesisi), süre 12 ay, ödeme
     vadesi 30 gün (VARSAYIM). İmzalı sözleşme dosyası yüklenir (İSG-KATİP'teki "yüklenmez" kararı yalnız onun için; soru). No IS-AAYY-SIRA. */
  var isSira = {};
  var isEkle = function (o) {
    var ay = o.baslangic.slice(5, 7) + o.baslangic.slice(2, 4); isSira[ay] = (isSira[ay] || 0) + 1;
    o.no = "IS-" + ay + "-" + ("00" + isSira[ay]).slice(-3); o.m = MV.tesis(o.tesisler[0]).m; o.vade = o.vade || 30; o.yenileme = o.yenileme || "yok";
    MV.IS_SOZLESMELERI.push(o); return o;
  };
  MV.IS_SOZLESMELERI = [];
  isEkle({ tesisler: ["t6"], teklif: null, baslangic: "2024-10-03", bitis: "2025-10-02", imza: { firma: "2024-09-30", musteri: "2024-10-01" }, dosya: true });
  isEkle({ tesisler: ["t13"], teklif: null, baslangic: "2025-10-01", bitis: "2026-09-30", imza: { firma: "2025-09-26", musteri: "2025-09-29" }, dosya: true });
  isEkle({ tesisler: ["t14", "t15"], teklif: null, baslangic: "2025-11-01", bitis: "2026-10-31", imza: { firma: "2025-10-28", musteri: "2025-10-30" }, dosya: true, yenileme: "otomatik" });
  MV.TEKLIFLER.filter(function (t) { return t.durum === "kabul"; }).forEach(function (t, i) {
    var bas = new Date(t.sonuc + "T12:00:00"); bas.setDate(bas.getDate() + 1 + i % 2);
    var b = bas.toISOString().slice(0, 10), bit = new Date(b + "T12:00:00"); bit.setFullYear(bit.getFullYear() + 1); bit.setDate(bit.getDate() - 1);
    var bekliyor = t.tesis === "t8";   /* en son kabul: müşteri imzası bekleniyor */
    isEkle({ tesisler: [t.tesis], teklif: t.no, baslangic: b, bitis: bit.toISOString().slice(0, 10), imza: { firma: b, musteri: bekliyor ? null : b }, dosya: !bekliyor });
  });
  MV.isDurum = function (x) { return !x.imza.musteri ? "imza" : x.bitis < MK.BUGUN ? "suresi" : "yururlukte"; };
  MV.isSozlesmesi = function (no) { return MV.IS_SOZLESMELERI.filter(function (x) { return x.no === no; })[0]; };
  /* tesisin o tarihte geçerli iş sözleşmesi (ödeme vadesi buradan; yoksa 30 gün) */
  MV.tesisSozlesmesi = function (tid, gun) { return MV.IS_SOZLESMELERI.filter(function (x) { return x.tesisler.indexOf(tid) >= 0 && x.baslangic <= gun && x.bitis >= gun; })[0]; };

  /* ── MUHASEBE (modül 18; M14, faz 2, 2026-09-24) — İŞ = plan (proje no). Akış: rapor imzalandı → müşteriye açıldı → FATURA → TAHSİLAT →
     iş kapandı → arşiv (§3). Rapor birim fiyatı teklif kaleminden (§3.2 madde 5; teklif yoksa fiyat listesi, kalemin adedini aşan rapor
     "teklif dışı"). Fatura imzalı raporlarla kaydedilir (e-Fatura / e-Arşiv firmanın muhasebe programında kesilir, buraya no + tarih;
     VARSAYIM). Geçen yılın işleri raporlardan türer (Planlar'daki eski raporlar; müşteri kaydından önceki iki tesis alınmadı). UYDURMA. */
  var fGun = function (iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  var kurus = function (n) { return Math.round(n * 100) / 100; };
  MV.raporFiyat = function (r) {
    var gun = r.olustu.slice(0, 10), tur = MV.ekipman(r.kod).tur;
    var t = MV.TEKLIFLER.filter(function (x) { return x.durum === "kabul" && x.tesis === r.tesis && x.tarih <= gun; }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; })[0];
    var k = t && t.kalemler.filter(function (x) { return x.tur === tur; })[0];
    if (!k) return { fiyat: MV.FIYAT[tur], kaynak: t ? "disi" : "liste", teklif: t || null };
    var sira = MV.kalemRaporlari(t, tur).sort(function (a, b) { return a.olustu < b.olustu ? -1 : 1; }).indexOf(r);
    return sira >= k.adet ? { fiyat: MV.FIYAT[tur], kaynak: "disi", teklif: t } : { fiyat: k.fiyat, kaynak: "teklif", teklif: t };
  };
  /* fatura kalemleri: faturadaki raporlar türe ve birim fiyata göre toplanır; KDV %20 */
  MV.faturaKalemleri = function (raporlar) {
    var g = {};
    raporlar.forEach(function (no) { var r = MV.rapor(no), f = MV.raporFiyat(r), tur = MV.ekipman(r.kod).tur, k = tur + "|" + f.fiyat;
      g[k] = g[k] || { tur: tur, fiyat: f.fiyat, adet: 0, disi: f.kaynak === "disi" }; g[k].adet++; });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return MV.tur(a.tur).ad.localeCompare(MV.tur(b.tur).ad, "tr"); });
  };
  MV.faturaTutar = function (f) {
    var ara = kurus(MV.faturaKalemleri(f.raporlar).reduce(function (n, k) { return n + k.adet * k.fiyat; }, 0)), kdv = kurus(ara * MV.KDV / 100);
    return { ara: ara, kdv: kdv, toplam: kurus(ara + kdv) };
  };
  MV.ISLER = []; MV.FATURALAR = [];
  var isGrup = {};
  MV.RAPORLAR.filter(function (r) { return !r.plan; }).forEach(function (r) { var k = r.tesis + "|" + r.olustu.slice(0, 10); (isGrup[k] = isGrup[k] || []).push(r); });
  var fSira = { 2025: 212, 2026: 14 }, pSira = {};
  /* tahsilat örnekleri (tesis → [gün farkı faturadan ya da tarih, oran]); verilmeyen: vadeden 3 gün önce, tamamı, havale */
  var TAHSILAT = { t13: [["2025-12-15", 1, "Havale / EFT"]], t14: [[20, 0.5, "Çek"], [33, 1, "Havale / EFT"]], t3: [["2026-03-20", 3000, "Havale / EFT"]] };
  Object.keys(isGrup).sort(function (a, b) { return a.split("|")[1] < b.split("|")[1] ? -1 : a.split("|")[1] > b.split("|")[1] ? 1 : 0; }).forEach(function (k) {
    var tid = k.split("|")[0], gun = k.split("|")[1], ts = MV.tesis(tid), m = MV.musteri(ts.m), rl = isGrup[k];
    if (m.acilis > gun) return;   /* müşteri kaydından önceki rapor (Planlar maketinden; tutarsızlık) → muhasebeye alınmaz */
    var ay = gun.slice(5, 7) + gun.slice(2, 4); pSira[ay] = pSira[ay] ? pSira[ay] + 2 : 11;
    var is = { no: "P-" + ay + "-" + ("00" + pSira[ay]).slice(-3), tesis: tid, m: ts.m, tarih: gun, pid: null, pdurum: "tamam",
      ekip: rl.map(function (r) { return r.kisi; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), raporlar: rl.map(function (r) { return r.no; }), faturalar: [] };
    var soz = MV.tesisSozlesmesi(tid, gun), vade = soz ? soz.vade : 30, yil = +gun.slice(0, 4), ft = fGun(gun, 3);
    var f = { no: "KMF" + yil + ("00000000" + (fSira[yil] += 3)).slice(-9), is: is.no, m: ts.m, tarih: ft, vadeGun: vade, vade: fGun(ft, vade), raporlar: is.raporlar.slice(), kaydeden: "ad", tahsilatlar: [] };
    var top = MV.faturaTutar(f).toplam, odenen = 0;
    (TAHSILAT[tid] || [[vade - 3, 1, "Havale / EFT"]]).forEach(function (x) {
      var tutar = x[1] === 1 ? kurus(top - odenen) : x[1] < 1 ? kurus(top * x[1]) : x[1]; odenen = kurus(odenen + tutar);
      f.tahsilatlar.push({ tarih: typeof x[0] === "number" ? fGun(ft, x[0]) : x[0], tutar: tutar, yontem: x[2], kaydeden: "ad" });
    });
    is.faturalar.push(f.no); MV.FATURALAR.push(f); MV.ISLER.push(is);
  });
  /* bu ayın planları: raporu olanlar (Planlar maketindeki plan 9 · 8 · 1) */
  MV.TESISLER.filter(function (t) { return t.pid && MV.RAPORLAR.some(function (r) { return r.plan === t.pid; }); }).forEach(function (t) {
    MV.ISLER.push({ no: t.plan, tesis: t.id, m: t.m, tarih: t.ptarih, pid: t.pid, pdurum: t.pdurum, ekip: t.pekip.slice(),
      raporlar: MV.RAPORLAR.filter(function (r) { return r.plan === t.pid; }).map(function (r) { return r.no; }), faturalar: [] });
  });
  MV.isKaydi = function (no) { return MV.ISLER.filter(function (x) { return x.no === no; })[0]; };
  MV.fatura = function (no) { return MV.FATURALAR.filter(function (f) { return f.no === no; })[0]; };
  MV.tahsil = function (f) { return kurus(f.tahsilatlar.reduce(function (n, t) { return n + t.tutar; }, 0)); };
  MV.faturaKalan = function (f) { return kurus(MV.faturaTutar(f).toplam - MV.tahsil(f)); };
  MV.faturaDurum = function (f) { var k = MV.faturaKalan(f); return k <= 0 ? "odendi" : f.vade < MK.BUGUN ? "gecikti" : MV.tahsil(f) > 0 ? "kismi" : "bekliyor"; };
  /* işin muhasebe özeti ve durumu: gecikti > hazir (imzalı, faturasız rapor var) > tahsilat > rapor (imza süreci) > kapandi */
  MV.isOzet = function (x) {
    var rl = x.raporlar.map(MV.rapor), fl = x.faturalar.map(MV.fatura), faturali = {};
    fl.forEach(function (f) { f.raporlar.forEach(function (no) { faturali[no] = f.no; }); });
    var hazir = rl.filter(function (r) { return r.durum === "imzali" && !faturali[r.no]; }), surec = rl.filter(function (r) { return r.durum !== "imzali"; });
    var o = { raporlanan: kurus(rl.reduce(function (n, r) { return n + MV.raporFiyat(r).fiyat; }, 0)), imzali: rl.length - surec.length, toplam: rl.length, hazir: hazir, surec: surec, faturali: faturali,
      faturalanan: kurus(fl.reduce(function (n, f) { return n + MV.faturaTutar(f).toplam; }, 0)), tahsil: kurus(fl.reduce(function (n, f) { return n + MV.tahsil(f); }, 0)) };
    o.kalan = kurus(o.faturalanan - o.tahsil);
    o.durum = fl.some(function (f) { return MV.faturaDurum(f) === "gecikti"; }) ? "gecikti" : hazir.length ? "hazir" : o.kalan > 0 ? "tahsilat" : surec.length || x.pdurum !== "tamam" ? "rapor" : "kapandi";
    if (o.durum === "kapandi") o.kapandi = fl.reduce(function (s, f) { return f.tahsilatlar.reduce(function (t, y) { return y.tarih > t ? y.tarih : t; }, s); }, "");
    return o;
  };

  /* belge (MB.belge) için raporun dolu verisi; İSG-KATİP kaydı rapor tarihinde geçerli olan (önceki kayıtlar dahil) */
  MV.raporBelge = function (r) {
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), p = MV.kisi(r.kisi), gun = r.olustu.slice(0, 10);
    var isg = MV.ISG.filter(function (x) { return x.t === ts.id && x.k === p.id && x.onay <= gun; }).sort(function (a, b) { return a.onay < b.onay ? 1 : -1; })[0];
    var s = new Date(gun + "T12:00:00"); s.setMonth(s.getMonth() + t.periyot);
    return { e: e, ts: ts, m: MV.musteri(ts.m), p: p, isg: isg, tarih: gun, bas: r.olustu.slice(11, 16), bit: r.gonderildi ? r.gonderildi.slice(11, 16) : null,
      cihaz: MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz" && MV.kimde(v.id) === p.id && MV.cihazTuru(v.cihazTur).g.indexOf(t.g) >= 0; }),
      sonraki: s.toISOString().slice(0, 10), no: r.no, sonuc: MV.sonucAd(r) || "Uygun", metot: t.std[0] || "uretici", imza: r.imza };
  };
})();
