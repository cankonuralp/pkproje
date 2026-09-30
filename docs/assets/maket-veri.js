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
    { k: "yonetici", ad: "Firma yöneticisi", kisa: "Firma yön.", acik: "Personel hesapları, rol yetkileri ve firma ayarları; hareket kaydını görür." },
    /* 137 (2026-09-26): muhasebeyi firma yöneticisi görür; istenirse birine "Muhasebe" rolü verilir */
    { k: "muhasebe", ad: "Muhasebe", kisa: "Muhasebe", acik: "Fatura ve tahsilat kaydeder; masraf formlarını onaylar; maaş ve bordroları görür." }
  ];
  MV.rol = function (k) { return MV.ROLLER.filter(function (r) { return r.k === k; })[0]; };

  /* Rol × modül görünürlüğü — başlangıç düzeni (reisim 2026-09-25, 32: "başlangıç olarak uygun ama admin istediği gibi rollerin
     yetkilerini değiştirebilmeli" → firma yöneticisi Personel › Rol yetkileri'nde değiştirir; MATRIS_ONERI "önerilen düzene dön" içindir).
     Düzey: yaz (görür ve değiştirir) · gor (görür) · brans (yalnız kendi branşı) · kendi (yalnız kendi kayıtları) · yok.
     Sıra: planlama · inspector · mekyon · elkyon · yonetici · muhasebe. "hareket" = Hareket kaydı (denetim izi; karar 30: yöneticiye). */
  MV.MATRIS = {
    13: ["yaz", "kendi", "gor", "gor", "yaz", "yok"], 14: ["gor", "kendi", "brans", "brans", "gor", "yok"], 15: ["yok", "yok", "brans", "brans", "gor", "yok"],
    20: ["gor", "kendi", "gor", "gor", "gor", "yok"], 3: ["yaz", "gor", "gor", "gor", "yaz", "gor"], 11: ["yaz", "yok", "gor", "gor", "yaz", "gor"],
    12: ["yaz", "kendi", "gor", "gor", "yaz", "gor"], 7: ["yaz", "yaz", "gor", "gor", "yaz", "yok"], 8: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"],
    9: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"], 2: ["gor", "kendi", "gor", "gor", "yaz", "yok"], 10: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"],
    18: ["yok", "yok", "yok", "yok", "yaz", "yaz"], 19: ["gor", "kendi", "brans", "brans", "gor", "yok"], 5: ["gor", "gor", "yaz", "yaz", "yaz", "yok"],
    4: ["gor", "gor", "yaz", "yaz", "yaz", "yok"], 21: ["kendi", "kendi", "kendi", "kendi", "yaz", "kendi"], hareket: ["yok", "yok", "yok", "yok", "gor", "yok"]
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
      /* 2026-09-29 (35. tur 161): Muhasebe rolü de onda — masraf formları ona gider (UYDURMA) */
      hesap: { durum: "etkin", roller: ["planlama", "muhasebe"], son: "2026-09-23T08:40" }, yetki: {}, belge: {}, sayilar: { isg: 0, zimmet: 0, egitim: 0, egitimYakin: 0, plan: 0 } },
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
  /* mobil imza telefonu (195, 2026-09-29): isteğe bağlı; UYDURMA numara (0500 000 00 …), yalnız mobil imza isteği için */
  ["mk", "ea", "sy", "co", "ok", "ta", "hp"].forEach(function (k, i) { var p = MV.kisi(k); if (p) p.imzaTel = "0500 000 00 " + ("0" + (i + 1)).slice(-2); });
  /* ── MAAŞ VE BORDRO (2026-09-27, reisim: "personel ekranında maaşlar ve bordrolarda olacak oraya yüklenebilecek bordrolar") — her ay kişi
     başına bordro yüklenir (PDF) ve tutarları yazılır (brüt, net, işverene maliyet); kişinin maliyeti son bordrodan. İş kârlılığında inspector
     payı = günlük maliyet × işte çalıştığı gün; günlük = aylık işverene maliyet ÷ 22 iş günü (VARSAYIM). Tutarlar UYDURMA (meslek + kıdem);
     işverene maliyet ≈ brüt × 1,2275 (SGK işveren + işsizlik payı, teşvik hariç; VARSAYIM). */
  var BRUT = { "mak-muh": 90000, "elk-muh": 90000, "ee-muh": 104000, "ins-muh": 88000, "tog-elk": 86000, "mak-tek": 66000, "mak-ytek": 70000, "elk-tek": 64000, teknisyen: 52000, diger: 72000 };
  MV.BORDRO_AYLAR = ["2026-06", "2026-07", "2026-08"];
  MV.BORDROLAR = [];
  MV.PERSONEL.forEach(function (p) {
    var brut = (p.id === "ad" ? 135000 : BRUT[p.meslek] || 72000) + Math.max(0, 2026 - +p.basla.slice(0, 4)) * 1500;
    MV.BORDRO_AYLAR.forEach(function (ay) {
      if (p.basla.slice(0, 7) > ay || (p.ayrildi && p.ayrildi.slice(0, 7) < ay)) return;
      var s = new Date(ay + "-01T12:00:00"); s.setMonth(s.getMonth() + 1);
      MV.BORDROLAR.push({ kisi: p.id, ay: ay, brut: brut, net: Math.round(brut * 0.705), maliyet: Math.round(brut * 1.2275), dosya: "bordro-" + ay + "-" + p.id + ".pdf",
        yuklendi: s.toISOString().slice(0, 8) + "03", yukleyen: "ad" });
    });
  });
  MV.kisiBordrolari = function (id) { return MV.BORDROLAR.filter(function (b) { return b.kisi === id; }).sort(function (a, b) { return a.ay < b.ay ? 1 : -1; }); };
  MV.IS_GUNU = 22;
  /* ayın bordrosu; yoksa o aydan önceki son bordro, o da yoksa ilk bordro (tahmini) */
  MV.bordroAy = function (id, ay) { var l = MV.kisiBordrolari(id); return (ay ? l.filter(function (b) { return b.ay <= ay; })[0] : l[0]) || l[l.length - 1] || null; };
  MV.gunlukMaliyet = function (id, ay) { var b = MV.bordroAy(id, ay); return b ? Math.round(b.maliyet / MV.IS_GUNU * 100) / 100 : 0; };
  MV.ayAd = function (ay) { return ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][+ay.slice(5, 7) - 1] + " " + ay.slice(0, 4); };

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
    { id: "t15", m: "m11", ad: "Kaynakhane", adres: "Organize Sanayi Bölgesi Mavi Cadde No: 8", ilce: "Nilüfer", il: "Bursa", ekipman: 7, son: "2025-11-05", sonraki: "2026-11-05" },
    /* 2026-09-28 (reisim: "planlar da en üstte sadece en son attığım PDF formatlara göre açılmış plan olsun"): yalnız elektrik iç tesisatı
       (ZPKR02) ve AG topraklama (ZPKR01) ekipmanıyla açılmış, bugün denetimde olan örnek plan (plan 10) */
    { id: "t16", m: "m1", ad: "Enerji Merkezi", adres: "Organize Sanayi Bölgesi 4. Cadde No: 14", ilce: "Gebze", il: "Kocaeli", ekipman: 5, son: "", sonraki: "2026-09-23", plan: "P-0926-040", pid: 10, pdurum: "denetimde", ptarih: "2026-09-23", pekip: ["mk", "ea"] }
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
    { t: "t14", k: "hp", no: "S-2025-0361", onay: "2025-10-28" }, { t: "t15", k: "hp", no: "S-2025-0362", onay: "2025-10-28" },
    { t: "t16", k: "mk", no: "S-2026-0451", onay: "2026-09-18" }, { t: "t16", k: "ea", no: "S-2026-0452", onay: "2026-09-18" }
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
    { k: "s10", no: "TS HD 60364-6", konu: "Alçak gerilim elektrik tesisatları — doğrulama" },
    { k: "s11", no: "TS HD 60364-4-41", konu: "Alçak gerilim elektrik tesisleri — güvenlik için koruma — elektrik çarpmasına karşı koruma" },
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
    { k: "HT", ad: "Hava tankı", b: "m", g: "basincli", periyot: 12, std: ["s1", "s2"], format: "KR11", formatDurum: "taslak", sablon: "v3 · 01.03.2026", sure: 20 },
    { k: "FL", ad: "Forklift", b: "m", g: "kaldirma", periyot: 12, std: ["s3", "s4"], format: "KR05", formatDurum: "taslak", sablon: "v2 · 15.01.2026", sure: 40 },
    { k: "KK", ad: "Köprülü kren", b: "m", g: "kaldirma", periyot: 12, std: ["s5"], format: "KR09", formatDurum: "taslak", sablon: "v2 · 15.01.2026", sure: 60 },
    { k: "KP", ad: "Kaldırma platformu", b: "m", g: "kaldirma", periyot: 12, std: ["s6"], sablon: "v1 · 01.09.2025", sure: 45 },
    { k: "TP", ad: "Transpalet", b: "m", g: "kaldirma", periyot: 12, std: ["s4"], format: "KR05", formatDurum: "taslak", sablon: "v2 · 15.01.2026", sure: 15 },
    { k: "KS", ad: "Kompresör", b: "m", g: "basincli", periyot: 12, std: ["s1"], sablon: "v1 · 01.09.2025", sure: 25 },
    { k: "ZV", ad: "Zincirli vinç", b: "m", g: "kaldirma", periyot: 12, std: ["s7"], sablon: "v1 · 01.09.2025", sure: 30 },
    { k: "YA", ad: "Yük asansörü", b: "m", g: "kaldirma", periyot: 12, std: ["s8"], sablon: "v1 · 01.09.2025", sure: 60 },
    { k: "BK", ad: "Buhar kazanı", b: "m", g: "basincli", periyot: 12, std: ["s9"], format: "KR07", formatDurum: "taslak", sure: 90 },
    { k: "ET", ad: "Elektrik iç tesisatı", b: "e", g: "elektrik", periyot: 12, std: ["s23", "s10"], format: "ZPKR02", formatDurum: "zorunlu", sablon: "v4 · 01.09.2025", sure: 90 },
    { k: "AT", ad: "AG topraklama", b: "e", g: "elektrik", periyot: 12, std: ["s11", "s10"], format: "ZPKR01", formatDurum: "zorunlu", sablon: "v3 · 01.09.2025", sure: 45 },
    { k: "YK", ad: "Yıldırımdan korunma", b: "e", g: "elektrik", periyot: 12, std: ["s12"], format: "ZPKR03", formatDurum: "zorunlu", sablon: "v2 · 01.09.2025", sure: 45 },
    { k: "DP", ad: "Dağıtım panosu", b: "e", g: "elektrik", periyot: 12, std: ["s13"], sablon: "v2 · 01.09.2025", sure: 30 },
    { k: "JN", ad: "Jeneratör", b: "e", g: "elektrik", periyot: 12, std: [], sure: 40 },
    { k: "KU", ad: "Kule kren", b: "m", g: "kaldirma", periyot: 12, std: ["s14"], format: "ZPKR06", formatDurum: "zorunlu", sablon: "v1 · 01.01.2026", sure: 120 },
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
      dosya: { ad: "TS-EN-60204-1_2018.pdf", kb: 5120 } },
    /* 2026-09-27: ZPKR02'nin dayandığı standart (Bakanlık formatının başlığından) */
    { k: "s23", no: "TS HD 60364-4-43", konu: "Alçak gerilim elektrik tesisatları — güvenlik için koruma — aşırı akıma karşı koruma", surum: "2010", yukleyen: "co", tarih: "2025-08-20",
      dosya: { ad: "TS-HD-60364-4-43_2010.pdf", kb: 2380 } });
  MV.standartTurleri = function (k) { return MV.KATALOG.filter(function (t) { return t.std.indexOf(k) >= 0; }); };

  /* ── KONTROL KRİTERLERİ VE RAPOR FORMATLARI (2026-09-27, reisim: "kriterler de sistem de muhafaza edilecek ve standartlar modülü altında bir
     sekme de onlar da var olsunlar bunlar ilgili ekipmanın muayenesi ile alakalı tariflerdir") — Bakanlığın yayımladığı resmî belgeler
     (isekipmanlari.csgb.gov.tr), reisim'in ilettiği PDF'ler docs/maket/belgeler/ altında (üst verisindeki kişi adı silindi, içerik aynen).
     Maddeler PDF'lerin metninden (başlık · içerik özeti · standart / yönetmelik); kaynak sütunu PDF tablosundaki sıraya göre eşlendi
     (metin çıkarımında sütun hizası kayar; uygulamada belgeyle karşılaştırılarak doğrulanır). Kodda tutulur (şablonlar gibi, §8.3). */
  var ETTY = "Elektrik Tesislerinde Topraklamalar Yönetmeliği", EITY = "Elektrik İç Tesisleri Yönetmeliği";
  MV.KONTROL_BELGELERI = [
    { k: "ZPKK01", ad: "Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Kriterleri", tur: "AT", rapor: "ZPKR01", yayim: "2025-07-18", yururluk: "2025-09-01", dosya: "ZPKK01.pdf",
      kapsam: "Elektrik İç Tesisleri Yönetmeliği kapsamındaki tesislerde bulunan ekipmanların periyodik kontrolleri. Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Raporu bu raporun tamamlayıcısıdır; tek başına uygunluk değerlendirmesi yapılamaz. Rapor her ekipman (pano) için ayrı düzenlenir; grup panolarda tek rapor, bulgular pano numarasıyla notlarda.",
      maddeler: [
        ["0", "Hazırlık", "Ölçüm tarihi, hava durumu, toprak durumu gibi genel bilgiler kontrol edildikten sonra tesisat bilgileri; tesise ait topraklama projesi olup olmadığı sorgulanır.", ETTY + " · TS HD 60364-5-53"],
        ["1", "Ölçüm noktası", "Dokunma gerilimi <1000 V ve >50 V olan tüm noktalardan ölçüm alınır. Enerji altındaki ekipmanlarla 2,5 m ulaşma mesafesindeki enerjisiz metal ekipmanlar arasında potansiyel dengeleme kontrol edilip süreklilik testi yapılır. TN sistemlerde son tüketim noktalarından ayrı ayrı çevrim empedansı (Zx); IT sistemlerde ilk hata için eşpotansiyel toprak barası topraklama direnci (Ra), ikinci hata için bağlantı tipine göre Zx ya da Ra ölçülür.", ETTY + " Madde 10 · TS HD 60364-5-53"],
        ["2", "Koruma kesiti (mm²)", "Koruma iletkeninin kesiti yazılır. Uygunluğu 63 A'dan küçük devrelerde faz kesitine göre tablodan, 63 A'dan büyük devrelerde ısınma kontrolüne göre denetlenir.", ETTY + " Çizelge 4-a ve 4-b · TS HD 60364-5-53"],
        ["3", "Koruma elemanı değerleri", "In (A) · açma eğrisi tipi veya modeli · açma akımı Ia (A) · hesaplanan toprak kısa devre akımı. Hesaplar koruma ekipmanının anma akımı ve açma eğrisi tipine göre yapılır; toprak kısa devre akımı 230 V'un ölçülen çevrim empedansına bölünmesiyle bulunur (ör. 2 Ω için Ik = 115 A).", ETTY + " Çizelge-10 · TS HD 60364-5-53"],
        ["4", "Topraklama ölçülen değerler ve sınır değerler", "Çevrim empedansı, üç uçlu karşılaştırma ya da pens yöntemiyle ölçülen değer Zx (Rx) alanına; topraklama tipine göre koruma elemanının açma akımı üzerinden hesaplanan sınır Zs (Rs) alanına yazılır. Sınırın üstündeki değerde notlara göre uygunluk yazılır. Süreler ETTY Madde 8'de.", ETTY + " Çizelge-10 · TS HD 60364-5-53"],
        ["5", "RCD testleri", "Devresinde RCD bulunan ekipmanlarda RCD açma akımı ve açma zamanı testleri yapılıp yazılır.", ETTY + " Madde 8 · TS HD 60364-5-53"],
        ["6", "30 mA RCD kullanma zorunluluğu", "TT veya TN (TN-S veya TN-CS'nin S bölümü) şebekelerde 32 A'e kadar genel kullanım priz tesisatlarında ve 32 A'e kadar seyyar cihaz prizlerinde 30 mA RCD zorunludur. 32 A üzerindeki devrelerde doğal kaçak akımlar kaçınılmazsa uygun seçilmiş RCD diğer önlemlerle birlikte kullanılır; doğal kaçakların teknik detayı raporda belirtilir.", ETTY + " Madde 8 · TS HD 60364-4-41"],
        ["7", "RCD performans testleri", "Açma akımı cihaz etiketindeki beyan açma akımını, açma zamanı 200 ms'yi geçmemelidir. 1000 mA üzerindeki toroidal akım trafolu RCD'ler test butonuyla denetlenir.", "TS HD 60364-6 · TS EN 61008-1 · TS EN 61009-1 · " + ETTY + " · TS EN 62423 · TS EN IEC 60947-2"],
        ["8", "Notlar", "Korozyon, kopma, kesit sorunları notlara yazılır ve öneride bulunulur. Sınıf II cihazda toprak bağlantısı olmadığı; izolasyon trafosunun sekonderinde toprak bağlantısı olmadığı ölçülerek doğrulanır. Düşük gerilimli tüketim noktalarında gerilimin a.a. 50 V'u, d.a. 42 V'u geçmediği doğrulanır. Projeyi hazırlayan ve onaylayanların bilgileri eklenir.", ETTY + " · TS HD 60364-5-53"]
      ],
      notlar: ["Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
        "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; ilgili imalat mevzuatı / standardına göre riskin bulunmadığı durumda kriter aranmaz. Kriterin listede bulunması her ekipmanda zorunlu olarak aranacağı anlamına gelmez.",
        "Pano dışındaki topraklama kontrollerinde (kablo tavası, buat, yapı bağlantı kutusu, armatür bağlantısı vb.) ölçüm noktası numaralandırılır; mümkünse vaziyet planında işaretlenir.",
        "Isınma ve bağlantı noktası kontrollerinde termal kamera kullanıldığında Bakanlıkça aksi belirtilmedikçe ek eğitim şartı aranmaz."] },
    { k: "ZPKK02", ad: "Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Kriterleri", tur: "ET", rapor: "ZPKR02", yayim: "2025-07-18", yururluk: "2025-09-01", dosya: "ZPKK02.pdf",
      kapsam: "Elektrik İç Tesisleri Yönetmeliği kapsamındaki tesislerde bulunan ekipmanların periyodik kontrolleri. Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Raporu bu raporun tamamlayıcısıdır; tek başına uygunluk değerlendirmesi yapılamaz. Rapor her ekipman (pano) için ayrı; pano dışındaki priz, kablo tavası, buat, eşpotansiyel bara, motor, regülatör gibi ekipmanlar notlarda.",
      maddeler: [
        ["0", "Hazırlık", "İş güvenliği tedbirlerinden sonra mevcut durumun fotoğrafı çekilir; elektrik pano listesi (numara, tanım, göz sayısı, bölüm/yer) oluşturulur, numarası olmayan panoya numara verilir. Havuz, karavan, güneş enerjisi gibi özel tesisatlar TS HD 60364-7 serisine göre kontrol edilir.", "TS HD 60364-4-41 · TS HD 60364-6 · TS HD 60364-7 serisi"],
        ["1", "Panonun 3 faz simetrik kısa devre akımı (Ik) < şalter kısa devre kesme kapasitesi (Icu)", "Projeden kontrol edilir: panodaki tüm devre kesicilerin Icu'su panonun 3 faz simetrik kısa devre akımından büyük olmalıdır.", "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536 · " + EITY + " Madde 57 b-2"],
        ["2", "Tasarım (yük) akımı (Ib)", "Normal işletmede devreden geçmesi öngörülen akım; projeden kontrol edilir, en yüksek yükte ölçülebilir.", "TS HD 60364-6 · TS HD 60364-5-52:2009 Madde 523"],
        ["3", "Devre kesici açma eğrisi tipi / kategori (B=5x C=10x D=15x)", "Koruma süresindeki açma eğrisine göre tip yazılır; bilinmiyorsa üretici kataloğu ya da TS IEC 61439.", "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536"],
        ["4", "Faz kesiti (mm²)", "Ölçülerek yazılır; tasarım akımıyla kesitin akım taşıma kapasitesi tahkik edilir.", "TS HD 60364-6 · TS HD 60364-5-52:2009 Madde 523"],
        ["5", "Devre kesici nominal akımı (In)", "Kesicilerin nominal akımları yazılarak tasarım yük akımına göre tahkik yapılır.", "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536"],
        ["6", "Akım taşıma kapasitesi — ortam sıcaklığına göre r1", "Ortam sıcaklığına göre TS HD 60364-5-52 tablosundan seçilen katsayı.", "TS HD 60364-6 · TS HD 60364-4-43"],
        ["7", "Akım taşıma kapasitesi — döşeme şekline göre r2", "İletkenin döşenme şekline göre TS HD 60364-5-52 tablosundan seçilen katsayı.", "TS HD 60364-6 · TS HD 60364-4-43"],
        ["8", "Akım taşıma kapasitesi Iz (A)", "Döşenme şekli ve sıcaklığa göre tablodan hesaplanan akım.", "TS HD 60364-6 · TS HD 60364-4-43"],
        ["9", "Akım taşıma kapasitesi r1·r2·Iz (A)", "Katsayılarla düzeltilmiş akım taşıma kapasitesi.", "TS HD 60364-6 · TS HD 60364-4-43"],
        ["10", "Nötr kesiti kontrolü", "Nötr, faz kesitine göre tahkik edilir; harmonikli devrelerde ve TN-C / TN-CS'de PEN kesiti faz kesitiyle aynı. PEN kesiti 10 mm²'den küçük olamaz, faz kesitine eşit olmalı (EİTY Md. 57), yangın tehlikeli yerlerden geçirilmez (EİTY Md. 64), patlama tehlikeli Zone-0/1'den geçirilmez; tehlikeli alanda TN-S.", "TS HD 60364-6 · TS EN 60079-14 Madde 6.2.1 · " + EITY + " Madde 36"],
        ["11", "Koruma iletkeni kesiti (PE)", "Faz kesitine göre belirlenir; 63 A'e kadar tablodan, daha büyük devrelerde hesapla (ETTY Md. 9-e).", "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3 · " + ETTY + " Madde 9-e"],
        ["12", "Ek potansiyel dengeleme iletkeni kesiti (PD)", "Yük ve kısa devre akımına göre ETTY'deki en küçük kesitlerde mi bakılır (en az 6 mm², en fazla 25 mm²).", "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3"],
        ["13", "İletken boyu (m)", "Projeden belirlenebiliyorsa yazılır; belirlenemiyorsa linye 20 m alınabilir.", "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3"],
        ["14", "Kablo şalter koordinasyonu Ib < In < Iz", "Her devre kesici için ayrı karşılaştırılır; kablo akım taşıma kapasitesinden büyük şaltere uygunsuzluk verilir.", "TS HD 60364-6 · TS HD 60364-4-43 · TS HD 60364-5-53:2001 Madde 536"],
        ["15", "Yapılacak testler", "Süreklilik (R1+R2) ve R2 · izolasyon direnci faz-faz / faz-toprak (MΩ; periyodik kontrolde yapılmaz) · topraklama çevrim empedansı Zx ve sınır Zs · RCD açma zamanı ve akımı · aşırı gerilim koruma kategorisi ve dayanma akımı. Tava, hava kanalı gibi metal ekipmanlarda eşpotansiyel baraya süreklilik Rc < 0,1 Ω.", "TS HD 60364-6 Madde 6.4.3 · TS HD 60364-4-41"],
        ["16", "Muayenenin sonuçlandırılması", "Muayene edilen öğe teslim alındığı gibi bırakılır ve alandan ayrılmadan önce fotoğraf çekilir. Projeyi onaylayanların bilgileri eklenir.", "TS HD 60364-6"]
      ],
      notlar: ["Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
        "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; riskin bulunmadığı durumda kriter aranmaz. Kriterin listede bulunması her ekipmanda zorunlu olarak aranacağı anlamına gelmez.",
        "Fonksiyon testlerindeki yalıtım direnci ölçümleri yalnız doğrulama kontrollerinde yapılır; periyodik kontrollerde yapılmaz.",
        "Toroid artık akım anahtarlarının testleri test butonuyla yapılabilir.",
        "Toprak çevrim empedansı ölçümlerindeki yalıtım hatasından kaynaklanan belirsizlikler Topraklama Tesisatı Raporunda belirtilir.",
        "Isınma ve bağlantı noktası kontrollerinde termal kamera isteğe bağlıdır; gözle kontrol formunda belirtilmesi yeterlidir; ek eğitim şartı aranmaz."] }
  ];
  MV.RAPOR_FORMATLARI = [
    { k: "ZPKR01", ad: "Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Raporu", tur: "AT", kriter: "ZPKK01", yayim: "2025-07-18", yururluk: "2025-09-01", dosya: "ZPKR01.pdf" },
    { k: "ZPKR02", ad: "Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Raporu", tur: "ET", kriter: "ZPKK02", yayim: "2025-07-18", yururluk: "2025-09-01", dosya: "ZPKR02.pdf" }
  ];
  /* ── FORMAT YAPISI (2026-09-27; ZPKR01 / ZPKR02 PDF'lerinden birebir bölüm ve alanlar) — saha raporu (M8) ve rapor belgesi (MB) bu yapıyla
     çizilir. Alan tipi: secim (tek) · coklu (birden çok) · metin. ornek = belgedeki örnek raporun değeri (UYDURMA). */
  /* 2026-09-28 (reisim: "birebir aynı pdf çıktısı olmalı"): alan adları, seçenekler ve kriter grupları PDF'teki yazımla birebir */
  var VAR_YOK = ["Var", "Yok"], NEDEN = ["Periyodik Kontrol", "İlk Kontrol"], YAPI = ["Ev", "Ticari", "Endüstri", "Diğer"];
  var SEBEKE = ["TT", "IT", "TN-CS", "TN-C", "TN-S"], TOPRAKLAYICI = ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"];
  MV.FORMAT_YAPI = {
    ZPKR01: {
      dayanak: ["TS HD 60364-4-41 Alçak Gerilim Elektrik Tesisleri – Bölüm 4: Güvenlik İçin Koruma – Bölüm 41: Elektrik Çarpmasına Karşı Koruma",
        "TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama", "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
        "Elektrik Tesislerinde Topraklamalar Yönetmeliği", "Elektrik İç Tesisleri Yönetmeliği"],
      bolumler: { firma: 1, ekipman: 2, cihaz: 3, tanim: 4, kontrol: 5, kusur: 6, not: 7, sonuc: 8, yetkili: 9 },
      detay: [
        { k: "kurulus", ad: "Enerji sağlayan kuruluş", tip: "metin", ornek: "Bölge elektrik dağıtım şirketi" },
        { k: "sebeke", ad: "Şebeke tipi", tip: "secim", sec: SEBEKE, ornek: "TN-S" },
        { k: "gerilim", ad: "Şebeke gerilimi", tip: "metin", ornek: "400 / 230 V" },
        { k: "proje", ad: "Tesise ait proje var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "tekhat", ad: "Tek hat şeması var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "neden", ad: "Kontrol nedeni", tip: "secim", sec: NEDEN, ornek: "Periyodik Kontrol" },
        { k: "projeBilgi", ad: "Proje bilgileri", tip: "metin", ornek: "Topraklama projesi, 2019 onaylı" },
        { k: "topraklayici", ad: "Topraklayıcı tipi", tip: "secim", sec: TOPRAKLAYICI, ornek: "Temel" },
        { k: "yapi", ad: "Yapı cinsi", tip: "secim", sec: YAPI, ornek: "Endüstri" },
        { k: "amac", ad: "Ekipmanın kullanım amacı", tip: "metin", ornek: "Üretim tesisi elektrik dağıtımı" },
        { k: "sonKontrol", ad: "Son kontrol tarihi", tip: "metin", ornek: "23.09.2025" },
        { k: "dolayli", ad: "Dolaylı dokunmaya karşı koruma önlemi", tip: "secim", sec: ["Eşpotansiyel topraklama ve beslemenin otomatik kesilmesi (TT, TN, IT)",
          "Koruyucu yalıtma (Sınıf II veya zemin yalıtımı)", "Koruyucu ayırma (İzolasyon trafosu)", "Küçük gerilim <50 V"], ornek: "Eşpotansiyel topraklama ve beslemenin otomatik kesilmesi (TT, TN, IT)" },
        { k: "hava", ad: "Hava durumu ve sıcaklığı", tip: "metin", ornek: "Açık, 21 °C" },
        { k: "zemin", ad: "Zemin nem durumu", tip: "metin", ornek: "Kuru" }
      ],
      tespit: [
        { k: "degisiklik", ad: "Tesisatta kapsamlı değişiklik var mı?", tip: "secim", sec: VAR_YOK, ornek: "Yok" },
        { k: "etiket", ad: "Bir önceki periyodik kontrol etiketi var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "pano", ad: "Pano/Ekipman tanımlaması", tip: "metin", ornek: "Ana dağıtım panosu (ADP) ve tali panolar" }
      ],
      metot: ["Çevrim empedansı", "3 Uçlu topraklama", "Klamp metodu (Çoklu topraklayıcılı)"],
      /* 4 · TEST DEĞERLERİ bölümü: formattaki tanımlar */
      tanimlar: [["Zx", "Ölçülen çevrim empedansı"], ["Zs", "Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır çevrim empedansı"], ["Rx", "Ölçülen topraklama direnci"],
        ["RA", "Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır topraklama direnci"], ["Ik", "Toprak çevrim empedansına göre hesaplanan ya da ölçülen faz-toprak hata akımı"],
        ["Ia", "Açma eğrisi tipine göre ani ya da otomatik açma akımı; RCD'de etiketteki beyan açma akımı (IΔn)"], ["IΔn", "RCD beyan açma akımı"], ["IΔ", "RCD test açma akımı"],
        ["TΔ", "RCD test açma zamanı, en çok 200 ms"], ["50 V", "Dokunma gerilimi sınırı (normal ya da kuru yerler)"], ["25 V", "Dokunma gerilimi sınırı (ıslak hacimler, tarımsal alanlar vb.)"],
        ["230 V", "Hesaplarda faz-toprak ya da faz-nötr gerilimi (Uo)"], ["Zs < 230 V / Ia", "TN şebekede dolaylı dokunmaya karşı güvenlik şartı"], ["RA < 50 V / Ia", "TT şebekede dolaylı dokunmaya karşı güvenlik şartı"]],
      /* 5.1 örnek ölçüm noktaları: [nokta, açma eğrisi, In (A), Zx (Ω), RCD (mA; yoksa "")] */
      noktalar: [["ADP · ana şalter", "C", 63, "0,21", ""], ["Priz hattı P1 — bakım atölyesi", "C", 16, "0,62", "30"], ["Aydınlatma A1 — üretim holü", "B", 16, "0,95", ""],
        ["Kompresör besleme", "C", 32, "0,48", ""], ["Havalandırma motoru", "C", 25, "1,12", "300"], ["Ofis prizleri", "B", 20, "", "30"]],
      /* 5.2 örnek RCD selektivite: [N önceki pano, RCD tipi, In (A), IΔn (mA), IΔ (mA), TΔ (ms), gecikme (ms), son tüketim noktasını besleyen pano] */
      rcd: [["Tali pano TP-1", "A", 40, 30, "21", "24", "", "TP-1 priz tablosu"], ["Tali pano TP-2", "AC", 63, 300, "", "", "60", "TP-2 makine tablosu"]],
      notlar: ["Uygun.", "Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)", "Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)",
        "Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.",
        "TT veya TN (TN-S veya TN-CS'nin S bölümü) şebekelerde 32 A'e kadar genel kullanım priz tesisatlarında ve seyyar cihaz prizlerinde 30 mA RCD kullanımı zorunludur. (Ağır kusur)",
        "32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)",
        "Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.",
        "Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)",
        "TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)",
        "Priz üzerinde nötr-toprak birleşikliği (sıfırlama) tespit edildiğinden yetersiz. (Ağır kusur)", "Pano gövde–kapak köprüsü olmadığından yetersizdir. (Ağır kusur)"],
      sonuc: "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle"
    },
    ZPKR02: {
      dayanak: ["TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları – Bölüm 4: Güvenlik İçin Koruma Grup 43 – Aşırı Akıma Karşı Koruma",
        "TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama", "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
        "Elektrik İç Tesisleri Yönetmeliği", "Elektrik Tesislerinde Topraklamalar Yönetmeliği"],
      bolumler: { firma: 1, ekipman: 2, termal: 3, cihaz: 4, kontrol: 5, fonksiyon: 6, kusur: 7, foto: 8, not: 9, sonuc: 10, yetkili: 11 },
      detay: [
        { k: "kurulus", ad: "Enerji sağlayan kuruluş", tip: "metin", ornek: "Bölge elektrik dağıtım şirketi" },
        { k: "sebeke", ad: "Şebeke tipi", tip: "secim", sec: SEBEKE, ornek: "TN-S" },
        { k: "gerilim", ad: "Şebeke gerilimi", tip: "metin", ornek: "400 / 230 V" },
        { k: "proje", ad: "Tesise ait proje var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "tekhat", ad: "Tek hat şeması var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "neden", ad: "Kontrol nedeni", tip: "secim", sec: NEDEN, ornek: "Periyodik Kontrol" },
        { k: "topraklayici", ad: "Topraklayıcı tipi", tip: "secim", sec: TOPRAKLAYICI, ornek: "Temel" },
        { k: "yapi", ad: "Yapı cinsi", tip: "secim", sec: YAPI, ornek: "Endüstri" },
        { k: "amac", ad: "Ekipmanın kullanım amacı", tip: "metin", ornek: "Aydınlatma, priz ve makine besleme" },
        { k: "sonKontrol", ad: "Son kontrol tarihi", tip: "metin", ornek: "23.09.2025" },
        { k: "faz", ad: "Faz iletkenlerinin sayısı ve tipi", tip: "secim", sec: ["AA · 1 faz, 2 tel", "AA · 1 faz, 3 tel", "AA · 2 faz, 3 tel", "AA · 3 faz, 3 tel", "AA · 3 faz, 4 tel",
          "DA · 2 kutup", "DA · 3 kutup", "Diğer"], ornek: "AA · 3 faz, 4 tel" },
        { k: "temelDirenc", ad: "Temel topraklama direnci (Ω)", tip: "metin", ornek: "0,9" },
        { k: "elektrot", ad: "İlave topraklama elektrotu detayları (varsa)", tip: "metin", ornek: "" },
        { k: "sistemIletken", ad: "Sistem topraklama iletkeni ve kesiti", tip: "metin", ornek: "Cu, 50 mm²" },
        { k: "anaEsp", ad: "Ana eşpotansiyel iletkeni ve kesiti", tip: "metin", ornek: "Cu, 25 mm²" },
        { k: "kaynakU", ad: "Nominal gerilim, U/Uo (kV)", tip: "metin", ornek: "0,4 / 0,23" },
        { k: "kaynakF", ad: "Nominal frekans, f (Hz)", tip: "metin", ornek: "50" },
        { k: "kaynakIF", ad: "Hata akımı olasılığı, IF (kA)", tip: "metin", ornek: "10" },
        { k: "kaynakZE", ad: "Dış çevrim empedansı ZE (Ω)", tip: "metin", ornek: "0,08" },
        { k: "anaRcd", ad: "TT-TN-S şebeke için ana RCD anma akımı", tip: "metin", ornek: "300 mA" },
        { k: "anaKesiciTip", ad: "Ana kesici tipi", tip: "metin", ornek: "C" },
        { k: "anaKesiciAkim", ad: "Ana kesici nominal akım (A)", tip: "metin", ornek: "63" },
        { k: "anaRcdTest", ad: "TT-TNS şebeke için ana RCD test akımı (mA) ve süresi (ms)", tip: "metin", ornek: "280 mA · 42 ms" }
      ],
      tespit: [
        { k: "degisiklik", ad: "Tesisatta kapsamlı değişiklik var mı? (>%20)", tip: "secim", sec: VAR_YOK, ornek: "Yok" },
        { k: "dkd", ad: "Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı?", tip: "secim", sec: ["Evet", "Hayır"], ornek: "Evet" },
        { k: "dogrudan", ad: "Tespit edilen bilgiler (Doğrudan dokunmaya karşı koruma önlemleri)", tip: "coklu", sec: ["Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)",
          "Mahfaza (IPXY, Pano kilidi, tehlike işareti vb.)", "Engel", "El ulaşma uzaklığı dışına yerleştirme", "İlave koruma",
          "30 mA RCD (5xI için 40 ms açma zamanı); devre kesicisi <32 A devreler için (TS HD 60364-4-41)"],
          ornek: ["Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)", "Mahfaza (IPXY, Pano kilidi, tehlike işareti vb.)", "İlave koruma",
            "30 mA RCD (5xI için 40 ms açma zamanı); devre kesicisi <32 A devreler için (TS HD 60364-4-41)"] },
        { k: "etiket", ad: "Bir önceki periyodik kontrol etiketi var mı?", tip: "secim", sec: VAR_YOK, ornek: "Var" },
        { k: "pano", ad: "Pano Adı/Ekipman Tanımlaması", tip: "metin", ornek: "ADP · ana dağıtım panosu" }
      ],
      metot: ["Üç Uçlu Karşılaştırma", "Çevrim Empedansı", "Klamp Yöntemi"],
      /* 6.1 · 6.2 · 6.3 örnek satırları (tamamlanmış örnek raporlar ve boş olmayan önizleme; 2026-09-28 Kalem L) — UYDURMA.
         linye: pano sigortası + etiketten Icu, ölçülen / hesaplanan kesit, Ib, Iz, RCD testi */
      linye: [
        { no: "F1", devre: "Aydınlatma — üretim holü", tip: "B", akim: 16, kutup: 1, rcd: "", icu: "6", faz: "2,5", npen: "2,5", pe: "2,5", ib: "10", iz: "24", id: "", td: "" },
        { no: "F2", devre: "Priz — bakım atölyesi", tip: "C", akim: 16, kutup: 1, rcd: "30", icu: "6", faz: "2,5", npen: "2,5", pe: "2,5", ib: "12", iz: "24", id: "21", td: "18" },
        { no: "F3", devre: "Kompresör", tip: "C", akim: 32, kutup: 3, rcd: "", icu: "10", faz: "6", npen: "6", pe: "6", ib: "25", iz: "41", id: "", td: "" },
        { no: "F4", devre: "Havalandırma", tip: "C", akim: 25, kutup: 3, rcd: "", icu: "10", faz: "4", npen: "4", pe: "4", ib: "18", iz: "32", id: "", td: "" },
        { no: "F5", devre: "Ofis prizleri", tip: "B", akim: 20, kutup: 1, rcd: "30", icu: "6", faz: "2,5", npen: "2,5", pe: "2,5", ib: "14", iz: "24", id: "19", td: "22" }],
      pd: [{ yer: "Ana dağıtım odası metal kapı ve kasası", kesit: "16", sure: "0,04", tkesit: "", tsure: "" }, { yer: "Kompresör şasisi", kesit: "6", sure: "0,07", tkesit: "4", tsure: "0,05" }],
      zi: [{ yer: "ADP önü", en: "1,0", boy: "2,0", direnc: "180" }],
      /* 5 · gözle kontrol: PDF'teki gruplar ve sıra (iki sütunlu tabloda soldan sağa, satır satır); değerlendirme Uygun · Uygun değil · Uygulanamaz */
      gozle: [
        ["PANO VE DİĞER DONANIMLARA GİRİŞİN UYGUNLUĞU", ["Kablo şebeke tarafı", "Kablo donanım tarafı", "Pano sabitlenmesi (Depreme dayanıklılık)", "Dış darbelere karşı koruma önlemi",
          "Elektrik panosu etrafında yabancı malzemeler", "Zemin izolasyonu"]],
        ["TOPRAKLANMIŞ POTANSİYEL DENGELEME VE BESLEMENİN OTOMATİK KESİLMESİ, ELEKTRİK ÇARPMASINA (DOLAYLI DOKUNMAYA) KARŞI KORUMA", ["Topraklama iletkeni", "Ana potansiyel dengeleme iletkeni",
          "Ek Potansiyel dengeleme İletkeni (Tamamlayıcı pot.den)", "Pano kapak bağlantısı kontrolü 6 mm²"]],
        ["KARŞILIKLI ZARARLI ETKİLERİN ÖNLENMESİ", ["Elektriksel olmayan tesislere yaklaşma ve diğer etkilerin kontrolü", "Bant I ve Bant II ayrılması, Bant II yalıtımı",
          "Güvenlik devre ayrılması", "Pano iç kapak, faza erişim engeli veya pleksi koruma"]],
        ["TANIMLAMA", ["Şemalar, talimatlar, devre çizimleri ve kısa bilgiler", "Koruma cihaz ve terminal etiket", "Tehlike işaretleri ve diğer uyarı işaretleri"]],
        ["KABLO ve İLETKENLER", ["Kablo yollarının uygunluğu ve mekanik koruma", "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil", "Tesisat yöntemi",
          "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma"]],
        ["TERMAL KAMERA", ["Kontak gevşekliği ısınması", "Aşırı yük ısınması PVC kablolar için >70 derece"]],
        ["GENEL DEĞERLENDİRMELER", ["Ekipman yakınında elektriksel ekipman yangın söndürme tertibatı", "Ekipman temizlik/bakım durumu", "Pano içi ve bağlantılarının korozyon kontrolü",
          "Ekipman içi veya yakınında acil durum aydınlatma tertibatı"]]
      ],
      agirKusur: ["Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa", "Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa",
        "Pano elemanlarının bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse", "PVC izoleli kablolarda ve dokunulabilen metal olmayan yüzeylerde aşırı ısınma tespit edilmişse",
        "Hesaplanan 3 fazlı kısa devre akımı panodaki herhangi bir koruma cihazının kısa devre kesme kapasitesinden (Icu) fazlaysa", "Aşırı akım koruma elemanı değerleri linye kesitiyle uyumsuzsa",
        "El ulaşma mesafesindeki metal bölümler ekipmanın toprak barasıyla eş potansiyel değilse", "RCD performans testi sonuçları yetersizse", "Ib < In < Iz sağlanmadıysa",
        "El ulaşma mesafesindeki zemin izolasyonu uygun boyutta değilse ya da zemin izolasyon direnci 50 kΩ'dan büyük değilse", "N / PEN iletkeni kesiti ve kullanım yeri kurallarına uyulmadıysa",
        "PE koruma iletkeni kesiti ETTY Md. 9e1i hesabına ve Çizelge 8'e uygun değilse", "Potansiyel dengeleme iletkeni 6 mm² < PD < 25 mm² değilse", "Tamamlayıcı potansiyel dengeleme PD > 4 mm² değilse"],
      sonuc: "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında kullanımı"
    }
  };
  /* ölçüm metodu (formattaki: üç uçlu · çevrim empedansı · klamp) ekipman türünde belirlenir, raporda türden okunur (reisim 2026-09-28:
     "tür de belirlensin"); firma türü düzenlerken seçer */
  MV.tur("ET").olcumMetot = "Üç Uçlu Karşılaştırma"; MV.tur("AT").olcumMetot = "Çevrim empedansı";
  MV.formatYapi = function (t) { return t && t.format ? MV.FORMAT_YAPI[t.format] || null : null; };
  /* açma akımı çarpanı (ZPKK02 madde 3: B=5x C=10x D=15x) · Zs = 230 V / Ia · Ik1 = 230 V / Zx */
  MV.EGRI_KAT = { B: 5, C: 10, D: 15 };
  MV.noktaHesap = function (n) {
    var zx = parseFloat(String(n.zx).replace(",", ".")), ia = (MV.EGRI_KAT[n.egri] || 10) * n.In, zs = Math.round(230 / ia * 1000) / 1000;
    var o = { ia: ia, zs: zs, zx: isNaN(zx) ? null : zx, ik: isNaN(zx) || zx <= 0 ? null : Math.round(230 / zx) };
    /* uygunluk notu (ZPKR01): Zx ≤ Zs → Not-1; aşıyor ama RCD var → Not-4; aşıyor, RCD yok → Not-2 (ağır); 32 A'e kadar prizde RCD yoksa Not-5 */
    o.not = o.zx === null ? null : o.zx <= zs ? (n.priz && !n.rcd ? 5 : 1) : n.rcd ? 4 : 2;
    o.agir = o.not === 2 || o.not === 5;
    return o;
  };
  /* ZPKR02 6.1 · 6.2 · 6.3 satır değerlendirmesi — formatın "Fonksiyon testleri bölümü" ağır kusur tanımlarından (2026-09-28, Kalem L):
     1 Icu < hesaplanan 3 fazlı kısa devre akımı · 4 RCD testi yetersiz (IΔ > IΔn ya da TΔ > 200 ms) · 5 Ib ≤ In ≤ Iz sağlanmıyor ·
     7a N/PEN kesiti faz kesitinden küçük · 8 PE kesiti ETTY Çizelge 8'den küçük (S ≤ 16 → S · 16 < S ≤ 35 → 16 · S > 35 → S/2) ·
     9 PD kesiti 6–25 mm² dışında · 10 tamamlayıcı PD < 4 mm² · 6c zemin izolasyon direnci ≤ 50 kΩ. Boş değer değerlendirilmez.
     Sonuç: null (değer yok) · { uygun: true } · { uygun: false, neden: [...] } */
  var sy = function (v) { var s = String(v === undefined || v === null ? "" : v).trim(); return /^\d+([.,]\d+)?$/.test(s) ? parseFloat(s.replace(",", ".")) : NaN; };
  MV.sayiOku = sy;
  MV.rcdTestYeter = function (idn, id, td) { var i = sy(id), d = sy(td); return isNaN(i) || isNaN(d) ? null : i <= idn && d <= 200; };
  MV.linyeHesap = function (x, ik3) {
    var n = [], dolu = false, In = sy(x.akim), ib = sy(x.ib), iz = sy(x.iz), faz = sy(x.faz), npen = sy(x.npen), pe = sy(x.pe), icu = sy(x.icu), k3 = sy(ik3);
    if (!isNaN(icu) && !isNaN(k3) && icu < k3) n.push("Icu " + x.icu + " kA < kısa devre akımı " + ik3 + " kA");   /* etiketten okunan Icu tek başına sonuç doğurmaz */
    if (!isNaN(ib) || !isNaN(iz)) { dolu = true; if ((!isNaN(ib) && ib > In) || (!isNaN(iz) && In > iz)) n.push("Ib ≤ In ≤ Iz sağlanmıyor"); }
    if (!isNaN(faz) && !isNaN(npen)) { dolu = true; if (npen < faz) n.push("N/PEN kesiti faz kesitinden küçük"); }
    if (!isNaN(faz) && !isNaN(pe)) { dolu = true; if (pe < (faz <= 16 ? faz : faz <= 35 ? 16 : faz / 2)) n.push("PE kesiti yetersiz"); }
    if (x.rcd) { var r = MV.rcdTestYeter(+x.rcd, x.id, x.td); if (r !== null) { dolu = true; if (!r) n.push("RCD testi yetersiz"); } }
    return dolu || n.length ? { uygun: !n.length, neden: n } : null;
  };
  MV.pdHesap = function (x) {
    var n = [], k = sy(x.kesit), t = sy(x.tkesit); if (isNaN(k) && isNaN(t)) return null;
    if (!isNaN(k) && (k < 6 || k > 25)) n.push("PD kesiti 6–25 mm² dışında");
    if (!isNaN(t) && t < 4) n.push("Tamamlayıcı PD kesiti 4 mm²'den küçük");
    return { uygun: !n.length, neden: n };
  };
  MV.ziHesap = function (x) { var d = sy(x.direnc); return isNaN(d) ? null : d > 50 ? { uygun: true, neden: [] } : { uygun: false, neden: ["Zemin izolasyon direnci 50 kΩ'dan büyük değil"] }; };
  /* DİĞER DÖKÜMANLAR (Dökümanlar modülü, 2026-09-28; reisim: "eğitimler, muayene kriterleri, standartlar, ve diğer dökümanlar bu kısımda
     tutulsun"): firmanın kendi belgeleri — kalite el kitabı, prosedür, talimat, politika, form, sertifika. Firma yükler, herkes okur; kalıcı
     herkese açık bağlantı yok. Kodlar firma düzeni (öneri). UYDURMA. */
  MV.DOKUMAN_TUR = ["Kalite el kitabı", "Prosedür", "Talimat", "Politika", "Form", "Sertifika", "Diğer"];
  MV.DOKUMANLAR = [["KM-KEK-01", "Kalite el kitabı", "Kalite el kitabı", "Rev. 4", "2026-03-02"], ["KM-PR-01", "Muayene prosedürü", "Prosedür", "Rev. 6", "2026-01-15"],
    ["KM-PR-04", "Şikâyet ve itiraz prosedürü", "Prosedür", "Rev. 2", "2025-11-20"], ["KM-PL-01", "Tarafsızlık ve gizlilik politikası", "Politika", "Rev. 3", "2025-09-01"],
    ["KM-TL-03", "Ölçüm cihazı kullanım ve ara kontrol talimatı", "Talimat", "Rev. 1", "2026-05-12"], ["KM-FR-12", "Personel yetkinlik değerlendirme formu", "Form", "Rev. 2", "2026-02-03"],
    ["", "Akreditasyon sertifikası", "Sertifika", "—", "2025-06-30"]].map(function (x, i) {
    return { k: "d" + (i + 1), kod: x[0], ad: x[1], tur: x[2], rev: x[3], tarih: x[4], yukleyen: "ad", dosya: (x[0] || "akreditasyon-sertifikasi") + ".pdf" };
  });
  MV.kontrolBelgesi = function (k) { return MV.KONTROL_BELGELERI.filter(function (x) { return x.k === k; })[0]; };
  MV.raporFormati = function (k) { return MV.RAPOR_FORMATLARI.filter(function (x) { return x.k === k; })[0]; };
  /* resmî belgeler gerçek PDF olarak açılır ve iner (sayfalar docs/maket/ altında: "belgeler/…") */
  MV.KONTROL_BELGELERI.concat(MV.RAPOR_FORMATLARI).forEach(function (x) { if (MK.DOSYA) MK.DOSYA[x.dosya] = { url: "belgeler/" + x.dosya, tur: "application/pdf" }; });
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
  /* 2026-09-27: Bakanlık formatı elimizde olan türde kriterler ve ölçümler formattan (ZPKR02 bölüm 5 ve 6; ZPKR01'de gözle liste yok, ölçüm tabloları) */
  MV.TUR_TESTLER = {
    /* 2026-09-28: ZPKR02 6.1'in ölçümleri PDF'teki sırayla; sınırı olmayan değer yalnız kaydedilir (op yok) */
    ET: [{ k: "zx", ad: "Panodan ölçülen faz-toprak çevrim empedansı (Zx)", birim: "Ω", op: "<=", sinir: 0.37, not: "ana kesici C63 · Zs = 230 V / 630 A", ornek: "0,21" },
      { k: "zln", ad: "Panodan ölçülen faz-nötr çevrim empedansı (ZLN)", birim: "Ω", ornek: "0,18" },
      { k: "ff", ad: "Gerilim F-F", birim: "V", ornek: "398" }, { k: "ln", ad: "Gerilim L-N", birim: "V", ornek: "229" },
      { k: "npe", ad: "Gerilim N-PE", birim: "V", op: "<=", sinir: 10, ornek: "1,2" },
      { k: "ik3", ad: "Hesaplanan 3 fazlı kısa devre akımı", birim: "kA", ornek: "4,8" },   /* sınırı her sigortanın Icu değeri: MV.linyeHesap (tek kural) */
      { k: "dkdTip", ad: "Aşırı gerilim koruma (DKD) tipi", birim: "", metin: true, ornek: "Tip 2", istege: true },
      { k: "dkdAkim", ad: "Aşırı gerilim koruma (DKD) dayanma akımı", birim: "kA", ornek: "20", istege: true }],
    AT: []
  };
  MV.kriterGruplari = function (t) { var f = MV.formatYapi(t); return f && f.gozle ? f.gozle : null; };
  /* MADDE AÇIKLAMASI (2026-09-30, 214): maddede neye bakılacağı — firmanın formatında madde başına tanımlanır (kodda, §8.3); tanımlı değilse
     yalnız türün standartları gösterilir. UYDURMA örnek: basınçlı kaplar. */
  MV.KRITER_ACIKLAMA = {
    "Gövde ve kaynaklar: gözle muayene (korozyon, ezik)": "Gövde yüzeyinde korozyon, ezik, çatlak ve şekil bozukluğu; kaynak dikişlerinde gözenek, yarık ve taşma olup olmadığına gözle bakılır.",
    "Emniyet ventili: ayar basıncı ve fonksiyon": "Ventil etiketindeki ayar basıncı kabın çalışma basıncıyla karşılaştırılır; ventilin açtığı ve mühürlü olduğu kontrol edilir.",
    "Manometre: okunabilirlik ve kalibrasyon işareti": "Göstergenin okunaklı, sıfırda dönen ve çalışma basıncının işaretli olduğu; kalibrasyon etiketinin geçerli olduğu kontrol edilir."
  };
  MV.kriterAciklama = function (t, ad) { return MV.KRITER_ACIKLAMA[ad] || ""; };
  MV.kriterler = function (t) {
    var g = MV.kriterGruplari(t); if (g) return g.reduce(function (l, x) { return l.concat(x[1]); }, []);
    if (t && t.k === "AT") return [];
    return MV.KRITER[t.g] || MV.KRITER.diger;
  };
  MV.testler = function (t) { return t && MV.TUR_TESTLER[t.k] || MV.TESTLER[t.g] || MV.TESTLER.diger; };
  MV.sinirYaz = function (x) { if (!x.op) return "—"; return (x.op === "<=" ? "≤ " : "≥ ") + String(x.sinir).replace(".", ",") + " " + x.birim + (x.not ? " (" + x.not + ")" : ""); };
  /* hafif / ağır kusur yalnız Bakanlık formatı YÜRÜRLÜKTE olan türde (§4.5, Ek-III 1.9.1) */
  MV.kusurSinifli = function (t) { return !!t.format && t.formatDurum === "zorunlu"; };
  /* kiracı firmanın künyesi (rapor başlığı, §4.2 ve §4.8: akredite kuruluş logosu + ticari ad + TÜRKAK markası) — UYDURMA */
  MV.FIRMA = { ad: "Örnek Muayene ve Kontrol Ltd. Şti.", kisa: "KM", adres: "Örnek Mahallesi Deneme Caddesi No: 1, Gebze / Kocaeli",
    eposta: "rapor@firma.example", akr: "AB-0000-M", nusha: 2, imza: "mobil" };
  /* imza yöntemi firma ayarı (2026-09-29, §9 otuz altıncı tur 177, 178, 180): raporun son imzası ve iç belgeler bu yöntemle; aracı site yok.
     mobil: her belge için telefona ayrı imza isteği, PIN telefonda (operatöre doğrudan bağlantı) · eimza: bilgisayardaki imza aracımız
     (AKİS kurulu), kart PIN'i bir kez, her belge ayrı imzalanır. "İndir, imzala, yükle" yedek yol her iki yöntemde durur. */
  MV.IMZA_YONTEM = {
    mobil: { k: "mobil", ad: "Mobil imza", kisa: "mobil imza", etiket: "telefonda PIN, her belge ayrı", acik: "Her belge için telefona imza isteği gelir, PIN telefonda girilir." },
    eimza: { k: "eimza", ad: "E-imza", kisa: "e-imza", etiket: "kart ve imza aracı, tek PIN", acik: "Bilgisayardaki imza aracı açılır, kart PIN'i bir kez girilir; her belge ayrı imzalanır." }
  };
  /* 5 yıl dolan raporlar (2026-09-29, §9 otuz altıncı tur 185; reisim: "5 yıl sonra silme olmasın firmaya göre belirlediği bulut sisteminde
     arşive çekilsin isterse istemez ise silinsin" · "isteğe bağlı olsun ister silinsin ister arşivlensin"): firma ayarı. Kendiliğinden silme
     yok; "Sil" seçilirse silinecekler 30 gün önce listelenir, silinen 30 gün geri alınabilir (185 önerisi). Ayar yoksa (eski kayıt) sistemde kalır. */
  MV.SAKLAMA = {
    kalsin: { k: "kalsin", ad: "Sistemde kalsın", etiket: "rapor silinmez, arşive de taşınmaz" },
    arsiv: { k: "arsiv", ad: "Bulut arşivine taşınsın", etiket: "firmanın belirlediği arşive, sistemden kalkar" },
    sil: { k: "sil", ad: "Silinsin", etiket: "30 gün önce liste, silinen 30 gün geri alınabilir" }
  };
  /* uyarı eşikleri (202, 2026-09-29): dağınık sabitler Firma ayarları'nda tek yerde; kayıtta yoksa başlangıç değeri. Eşik uyarıdır, engel değil */
  MV.ESIK = {
    kal: { ad: "Kalibrasyon bitişi", etiket: "cihazın kalibrasyonu bu kadar gün kala uyarı", v: 30, secenek: [15, 30, 45, 60, 90] },
    tesis: { ad: "Kontrolü yaklaşan tesis", etiket: "müşteri listesi ve ana sayfada", v: 30, secenek: [15, 30, 45, 60, 90] },
    plan: { ad: "Plan açarken \u201ckontrolü geliyor\u201d", etiket: "sonraki kontrolü plan gününden en çok bu kadar gün sonra olan ekipman", v: 30, secenek: [15, 30, 45, 60, 90] },
    egitim: { ad: "Eğitim tekrarı", etiket: "tekrar tarihine bu kadar gün kala uyarı", v: 60, secenek: [30, 45, 60, 90, 120] }
  };
  /* "Uygun değil" maddede fotoğraf zorunlu mu (2026-09-30, 213): firma ayarı, başlangıçta zorunlu (§3.7 satır 14) */
  /* MESAİ TAKİBİ (2026-09-30, 212): günlük normal çalışma 480 dk + mesai 220 dk (firma ayarı, aç/kapa; yalnız yönetici). Raporun süresi
     ekipman türünün kontrol süresi (Ekipman türleri, dk). Kişinin o gün oluşturduğu (pasif olmayan) raporların süresi önce normali, sonra
     mesaiyi doldurur; ikisi dolunca yeni rapor oluşturulamaz (reisim'in açık kararı: engel). */
  MV.mesai = function () {
    var x = MV.FIRMA.mesai || {}, n = +x.normal, m = +x.mesai;
    return { acik: x.acik !== false, normal: n > 0 ? n : 480, mesai: x.mesai !== undefined && x.mesai !== "" && m >= 0 ? m : 220 };
  };
  MV.raporSuresi = function (r) { var e = MV.ekipman(r.kod); return e ? MV.tur(e.tur).sure || 0 : 0; };
  MV.gunlukSure = function (kisi, gun) {
    gun = gun || MK.BUGUN;
    var m = MV.mesai(), t = MV.RAPORLAR.filter(function (r) { return r.kisi === kisi && !r.pasif && (r.olustu || "").slice(0, 10) === gun; })
      .reduce(function (n, r) { return n + MV.raporSuresi(r); }, 0);
    return { toplam: t, normal: Math.min(t, m.normal), mesai: Math.min(Math.max(t - m.normal, 0), m.mesai), dolu: m.acik && t >= m.normal + m.mesai, m: m };
  };
  MV.kusurFotoZorunlu = function () { return MV.FIRMA.kusurFoto !== false; };
  MV.esik = function (k) { var x = +((MV.FIRMA.esik || {})[k]); return x > 0 ? x : MV.ESIK[k].v; };
  /* yeni rapor numarasının başındaki firma kodu: 2–4 büyük harf; eski numaralar değişmez */
  MV.firmaKodu = function () { var x = String(MV.FIRMA.raporKod || MV.FIRMA.kisa || "KM"); return /^[A-ZÇĞİÖŞÜ]{2,4}$/.test(x) ? x : "KM"; };
  /* 200 (2026-09-29): süre 5 yıl taban, firma uzatabilir (kısaltamaz) */
  MV.saklama = function () { var x = MV.FIRMA.saklama || {}; return { yontem: MV.SAKLAMA[x.yontem] ? x.yontem : "kalsin", yer: x.yer || "", yil: Math.max(5, +x.yil || 5) }; };
  /* 201 (2026-09-29): arşive taşınan raporun künyesi sistemde kalır (r.arsiv = { yer, zaman }); dosyası arşivde, müşteri portalından kalkar,
     firma geri getirebilir. Künye ve PDF yeri tek üreticiden. */
  MV.arsivSerit = function (r) {
    return r && r.arsiv ? MK.serit("bilgi", "archive", "<b>Arşivde</b> · " + MK.kacis(r.arsiv.yer) + " · " + MK.tarihYaz(r.arsiv.zaman) + ": künye sistemde, dosya arşivde; müşteri portalında görünmez.") : "";
  };
  MV.imzaYontem = function () { return MV.IMZA_YONTEM[MV.FIRMA.imza] || MV.IMZA_YONTEM.mobil; };

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
  /* plan 10 (t16, 2026-09-28): yalnız Bakanlık formatlı türler; kodlar açık yazılır (öteki ekipmanın kod sırası kaymasın). Yeni tesis:
     ilk periyodik kontrol (önceki rapor yok); AT-2005 denetimde eklendi. */
  MV.PLAN10_KODLAR = [["ET-2001", "ET", "Ana dağıtım odası"], ["ET-2002", "ET", "Üretim holü"], ["AT-2003", "AT", "Ana dağıtım odası"], ["ET-2004", "ET", "Kompresör odası"], ["AT-2005", "AT", "Jeneratör odası"]];
  MV.PLAN10_KODLAR.forEach(function (x, i) {
    var ilk = i === 4;
    MV.EKIPMAN.push({ kod: x[0], tur: x[1], tesis: "t16", konum: x[2], ilk: ilk, plan: 10, marka: MARKA[i % MARKA.length], model: x[1] + "-" + (300 + i * 7), imal: 2015 + i, seri: "SN" + (731200 + i * 37),
      onceki: null });
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
  /* EKİPMAN TÜRÜNÜN KULLANACAĞI ÖLÇÜM CİHAZLARI (reisim 2026-09-27: "ekipmana göre hangi cihazların kullanılacağı ekipman türlerinden
     belirlenecek ve ilgili cihaz ekli değil ise veya kalibrasyon tarihi geçmişse rapor gönderilemeyecek"). Tür sayfasında düzenlenir (M7);
     aşağıdaki başlangıç listesi ÖRNEK (firma kendi yöntemine göre belirler). */
  var TUR_CIHAZ = {
    ET: ["topraklama", "izolasyon", "tesisat", "termal"], AT: ["topraklama"], YK: ["topraklama"], DP: ["izolasyon", "termal"], JN: ["multimetre", "izolasyon"],
    YG: ["multimetre"], TR: ["izolasyon", "termal"], HT: ["manometre", "kalinlik"], KS: ["manometre"], BK: ["manometre", "kalinlik", "termal"],
    LP: ["manometre", "kalinlik"], FL: ["dinamometre"], KK: ["dinamometre"], KP: ["dinamometre"], TP: ["dinamometre"], ZV: ["dinamometre"],
    YA: ["dinamometre", "mesafe"], KU: ["dinamometre", "mesafe"], MB: ["dinamometre", "mesafe"], YM: ["mesafe"], AE: ["dinamometre"],
    SP: ["dinamometre"], IS: ["mesafe"], PR: ["kumpas"]
  };
  MV.KATALOG.forEach(function (t) { t.cihaz = (TUR_CIHAZ[t.k] || []).slice(); });
  MV.turCihazlari = function (t) { return t.cihaz || []; };
  /* kontrol metodu (Ek-III 1.7.1.1) YALNIZ ekipman türünde belirlenir (reisim 2026-09-27: "metod kısmı olsun ama sadece ekipman türü eklerken
     belirlene"); raporda seçilmez, türün standartlarından okunur; türde standart yoksa üretici talimatı (karar 82). [{ no, konu }] */
  MV.turMetot = function (t) {
    return t.std.length ? t.std.map(function (k) { var s = MV.standart(k); return { no: s.no + ":" + s.surum, konu: s.konu }; }) : [{ no: "", konu: "Üretici talimatı" }];
  };
  /* 2026-09-27 (reisim: "kontrol metodunda sadece standartlar yazsın açıklaması değil örneğin 'TS EN 1579, TS EN 2134'"): yalnız numara:sürüm */
  MV.metotYazi = function (t) { return MV.turMetot(t).map(function (m) { return m.no || m.konu; }).join(", "); };
  /* raporda eklenebilecek cihazlar: kişinin zimmetinde, türün cihaz türlerinden, kalibrasyonu geçmemiş */
  MV.eklenebilirCihazlar = function (kisi, turler) {
    return MV.VARLIKLAR.filter(function (v) { return v.tur === "cihaz" && MV.kimde(v.id) === kisi && turler.indexOf(v.cihazTur) >= 0 && MV.kalDurum(v) !== "gecti"; });
  };
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
      /* 2026-09-28 (T7): ara kontrol programları sıklıkla (günlük · haftalık · aylık · 6 ayda bir); tohumda 6 ayda bir */
      aralik: c[5], bitis: bit, araSiklik: ARASIZ.indexOf(c[1]) >= 0 ? [] : ["6ay"],
      kal: [{ tarih: (y - 1) + bit.slice(4), bitis: bit, lab: LAB[i % 2], sertifika: "KL-" + (y - 1) + "-" + (410 + i * 13), sonuc: "Uygun" },
            { tarih: (y - 2) + bit.slice(4), bitis: (y - 1) + bit.slice(4), lab: LAB[(i + 1) % 2], sertifika: "KL-" + (y - 2) + "-" + (300 + i * 11), sonuc: "Uygun" }],
      ara: ARASIZ.indexOf(c[1]) >= 0 ? [] : [{ tarih: c[4], siklik: "6ay", kim: i % 2 ? "co" : "sy", yontem: "Referans değerle karşılaştırma", sonuc: "Uygun" }], rapor: 12 + (i * 7) % 40 };
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
    ["v6", "2025-10-06T11:30", "depo", "dk", 2, "Kılıf ve şarj aleti tam."], ["v6", "2026-09-01T09:15", "dk", "ea", 2, "Elektrik iç tesisatı kontrolleri için devredildi; kılıf ve şarj aleti tam."], ["v7", "2026-02-16T08:15", "depo", "mk", 1, "Jel ve prob tam."],
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
    (MV.ZIMMET_FORMLARI[x[0]] = MV.ZIMMET_FORMLARI[x[0]] || []).unshift({ no: x[1], tarih: x[2], kapsam: MV.zimmetKapsam(x[0], x[2] + "T23:59"), dosya: "zimmet-formu-imzali.pdf",
      eden: { ad: MV.kisi("za").ad, alt: "" } });   /* örnek formlar: teslim eden kayıtta (196, 2026-09-29) — başlangıç ayarı değişse de geçmiş form değişmez */
  });
  MV.zimmetFormu = function (k) { return (MV.ZIMMET_FORMLARI[k] || [])[0] || null; };
  MV.zimmetFormuGuncel = function (k, kapsam) {
    var f = MV.zimmetFormu(k); if (!f) return false;
    return f.kapsam.slice().sort().join() === kapsam.slice().sort().join();
  };
  /* kalibrasyon durumu: gecti (bitiş geçti) · yakin (eşik içinde; firma ayarı, başlangıç 30 gün) · lab (laboratuvarda) · gecerli */
  MV.kalDurum = function (v) {
    if (v.tur !== "cihaz") return null;
    if (MV.kimde(v.id) === "lab") return "lab";
    var k = Math.round((new Date(v.bitis + "T12:00:00") - new Date("2026-09-23T12:00:00")) / 864e5);
    return k < 0 ? "gecti" : k <= MV.esik("kal") ? "yakin" : "gecerli";
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
  /* EKİPMAN ATAMALARI (L4, 2026-09-30, reisim: "denetçi hesaplarının profillerinde personel kartlarında yani, ekipman atamaları kısmı olsun
     ekipman ataması yapılsın ve atama belgesi yüklensin görülebilsin indirilebilsin"): denetçinin hangi ekipman TÜRÜNE atandığı + atama
     belgesi (PDF). Atanmadığı türde plan ve rapor yalnız UYARI (engel değil). Örnek atamalar UYDURMA; belgeleri makette yok. */
  MV.ATAMALAR = [];
  [["mk", ["HT", "KS", "FL", "KK", "KP", "TP", "ZV", "YA", "KU", "PR"], "2024-03-11"], ["ea", ["ET", "AT", "YK", "DP", "YG", "TR"], "2024-05-20"],
    ["hp", ["KU", "HT", "FL", "PR", "IS", "KS", "LP"], "2023-11-06"], ["sy", ["HT", "KS", "FL"], "2025-02-17"], ["dk", ["ET", "AT"], "2025-06-02"]].forEach(function (x) {
    x[1].forEach(function (t) { MV.ATAMALAR.push({ id: "at" + (MV.ATAMALAR.length + 1), k: x[0], tur: t, tarih: x[2], dosya: "atama-" + x[0] + "-" + t.toLowerCase() + ".pdf" }); });
  });
  MV.atamalari = function (k) { return MV.ATAMALAR.filter(function (a) { return a.k === k; }); };
  MV.atandi = function (k, tur) { return MV.ATAMALAR.some(function (a) { return a.k === k && a.tur === tur; }); };

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
  /* tekrar: geçti · eşik içinde · geçerli (eşik firma ayarı, başlangıç 60 gün — 202; personel kartı ve Eğitimler aynı eşikle) */
  MV.egitimDurum = function (x) { var k = Math.round((new Date(x.tekrar + "T12:00:00") - new Date("2026-09-23T12:00:00")) / 864e5); return k < 0 ? "gecti" : k <= MV.esik("egitim") ? "yakin" : "gecerli"; };
  MV.egitimleri = function (kid) { return MV.EGITIMLER.filter(function (x) { return x.kisi === kid; }); };
  /* durum adları ve sertifika dosya adı TEK yerde (2026-09-28, T10: Eğitimler ve personel kartı aynısını gösterir) */
  MV.EGITIM_DURUM = { gecti: { ad: "Tekrarı geçti", rozet: "a-rozet-red" }, yakin: { ad: "60 gün içinde", rozet: "a-rozet-bekliyor" }, gecerli: { ad: "Geçerli", rozet: "a-rozet-tamam" } };
  MV.egitimBelgeAdi = function (x) { return typeof x.belge === "string" ? x.belge : "egitim-" + x.kisi + "-" + x.k + "-" + x.tarih.slice(0, 4) + ".pdf"; };   /* yüklenen dosyanın adı, örnek kayıtta üretilen ad */

  /* ── RAPORLAR (modül 14–16; M9, 2026-09-24) — firma geneli rapor kaydı. Planlar maketindeki plan raporları AYNI numarayla
     (sıra 760'tan: plan 9 → 8 → 1; Planlar'daki dağılım ve sonuç kuralı), geçen yılın imzalı raporları ekipman kaydından.
     Durum: taslak → onayda → onaylandı (son imza bekliyor) → imzalı (müşteriye açık). Planlar'ın "Onaylandı"sı burada onaylandı + imzalı.
     Raporu yazan türün branşından (elektrik Elif Aydın, mekanik Mert Kaya; M8 ile aynı); onaylayan branş yöneticisi. */
  MV.YONETICI = { m: "sy", e: "co" };
  var dk = function (iso, n) { var d = new Date(iso + ":00Z"); d.setUTCMinutes(d.getUTCMinutes() + n); return d.toISOString().slice(0, 16); };
  MV.RAPORLAR = [];
  /* açılıştan Tamamlandı'ya süre (saat) — performansın 24 / 48 / 48+ saat ölçüsü için örnek dağılım (2026-09-27): yarıdan çoğu 24 saat
     içinde, dörtte biri 24–48, kalanı 48 saatten uzun. UYDURMA. */
  var tamamSaat = function (i) { var x = i % 20; return x < 11 ? 4 + (x * 7) % 19 : x < 16 ? 26 + (x * 5) % 20 : 54 + (x * 9) % 40; };
  MV.EKIPMAN.filter(function (e) { return e.onceki; }).forEach(function (e, i) {   /* geçen yılın imzalı raporları */
    var b = MV.tur(e.tur).b, o = e.onceki.tarih + "T10:00", sa = tamamSaat(i);
    /* bazı raporlar bir kez geri gönderilip düzeltilmiş (2026-09-29, 35. tur 166 — performansta "Düzeltme" adımı; UYDURMA) */
    var duz = i % 6 === 2 && sa >= 8 ? [{ geri: dk(o, 110), gonderim: dk(o, 110 + 60 + (i % 5) * 25) }] : [];
    MV.RAPORLAR.push({ no: e.onceki.rapor, kod: e.kod, tesis: e.tesis, plan: null, kisi: e.onceki.kisi, olustu: o, durum: "imzali", sonuc: e.onceki.sonuc,
      ilkGonderim: dk(o, 50), gonderildi: duz.length ? duz[0].gonderim : dk(o, 50), duzeltmeler: duz,
      onay: { kim: MV.YONETICI[b], zaman: dk(o, Math.round(sa * 36)) }, imza: { zaman: dk(o, sa * 60) } });
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
        /* son imza açılıştan 21–50 saat sonra (performansın 24 / 48 / 48+ ölçüsü için örnek dağılım; onaydan sonra, bugünden önce) */
        if (k < 10) { r.durum = "imzali"; r.imza = { zaman: dk(o, [22, 23, 21, 30, 22, 40, 23, 50, 22, 28][k] * 60) }; }
      }
      MV.RAPORLAR.push(r);
    });
  });
  /* plan 10 (2026-09-28): son formatlarla örnek — sonuçlar formata göre: Tamamlandı · Uygun, Muayene uzmanı imzası · hafif kusurlu,
     yönetici onayında · ağır kusurlu (topraklamada Not-2), iki taslak. Planlar maketindeki plan 10 ile aynı numara ve durum. */
  [["imzali", "Uygun"], ["onaylandi", "Hafif kusurlu"], ["onayda", "Ağır kusurlu"], ["taslak", null], ["taslak", null]].forEach(function (x, k) {
    var e = MV.ekipman(MV.PLAN10_KODLAR[k][0]), o = dk("2026-09-23T13:10", 10 + k * 6), r = { no: MV.raporNo("0926", raporSira++), kod: e.kod, tesis: "t16", plan: 10, kisi: "ea",
      olustu: o, durum: x[0], sonuc: x[1], gonderildi: x[0] === "taslak" ? null : dk(o, 35), onay: null, imza: null };
    if (x[0] === "imzali" || x[0] === "onaylandi") r.onay = { kim: "co", zaman: dk(o, 70) };
    if (x[0] === "imzali") r.imza = { zaman: dk(o, 150) };
    MV.RAPORLAR.push(r);
  });
  /* geri gönderilmiş taslak (M8'deki ZV-1007 ile aynı) */
  (function (r) { r.ilkGonderim = dk(r.olustu, 45); })(MV.RAPORLAR.filter(function (r) { return r.kod === "ZV-1007" && r.plan === 1; })[0]);
  MV.RAPORLAR.filter(function (r) { return r.kod === "ZV-1007" && r.plan === 1; })[0].geri = { kim: "sy", zaman: "2026-09-23T15:10", gerekce: "Yük deneyi değerleri yazılmamış: dinamik ve statik deney yüklerini girin." };
  MV.rapor = function (no) { return MV.RAPORLAR.filter(function (r) { return r.no === no; })[0]; };
  /* rapor durumları, kronolojik (reisim 2026-09-26): Yeni (denetçi açar, yazar, kaydeder) → Teknik yönetici onayında ("Gönder") → Muayene
     uzmanı imzası (onaydan dönen rapor; denetçi "İmzala" der) → İmzaya gönderildi → Tamamlandı. Geri gönderilen rapor "Yeni"ye döner. */
  MV.RAPOR_DURUM = { taslak: { ad: "Yeni", rozet: "a-rozet-bekliyor" }, geri: { ad: "Yeni", rozet: "a-rozet-bekliyor" }, onayda: { ad: "Teknik yönetici onayında", rozet: "a-rozet-kabul" },
    onaylandi: { ad: "Muayene uzmanı imzası", rozet: "a-rozet-denetimde" }, imzada: { ad: "İmzaya gönderildi", rozet: "a-rozet-notr" }, imzali: { ad: "Tamamlandı", rozet: "a-rozet-tamam" } };
  /* sonuç adı §4.5'e göre: hafif / ağır yalnız format yürürlükteki türde; Planlar maketi taslak formatlı türde de "Hafif kusurlu" yazıyor
     (maket tutarsızlığı) → burada "Kusurlu"ya çevrilir */
  MV.sonucAd = function (r) { if (!r.sonuc) return null; return r.sonuc === "Uygun" || MV.kusurSinifli(MV.tur(MV.ekipman(r.kod).tur)) ? r.sonuc : "Kusurlu"; };
  /* durumu teknik yönetici değiştirdi (191, 2026-09-29): son değişiklik hâlâ geçerliyse raporun üstünde şerit. Yeni'ye alınan rapor zaten "Geri
     gönderildi / Revizeye gönderildi" şeridiyle görünür, onda bu şerit çıkmaz. */
  MV.durumSerit = function (r) {
    var g = r && r.durumGecmis && r.durumGecmis[0]; if (!g || g.yeni !== r.durum || r.durum === "taslak") return "";
    return MK.serit("bilgi", "refresh-cw", "<b>Durum teknik yönetici tarafından değiştirildi</b> · " + MK.kacis(MV.kisi(g.kim).ad) + " · " + MK.zamanYaz(g.zaman) + " · " +
      MK.kacis(MV.RAPOR_DURUM[g.eski === "taslak" ? "taslak" : g.eski].ad) + " → " + MK.kacis(MV.RAPOR_DURUM[g.yeni].ad) + (g.gerekce ? ": “" + MK.kacis(g.gerekce) + "”" : ""));
  };
  MV.raporDurum = function (r) { return MV.RAPOR_DURUM[r.durum === "taslak" && r.geri ? "geri" : r.durum]; };
  /* UYGUNSUZLUK KAYDI (§3.2 madde 6: ayrı kayıt — rapor, ekipman, kriter, açıklama, sınıf, tarih): imzalı ve sonucu "Uygun" olmayan
     rapordan; aynı ekipmanın SONRAKİ imzalı raporu gelince "giderildi" (sonraki kontrol ya da ikinci kontrol, Ek-III 1.9). Kriter ve açıklama
     rapor belgesindekiyle aynı (MB.belge). Müşteri kartındaki "açık uygunsuzluk" sayısı buradan (M2'deki sabit sayı yerine). */
  MV.uygunsuzluklar = function (mid) {
    var ts = MV.tesisleri(mid).map(function (t) { return t.id; }), l = [];
    MV.RAPORLAR.filter(function (r) { return r.durum === "imzali" && ts.indexOf(r.tesis) >= 0 && r.sonuc && r.sonuc !== "Uygun"; }).forEach(function (r) {
      var e = MV.ekipman(r.kod), t = MV.tur(e.tur), sinifli = MV.kusurSinifli(t), hafif = /Hafif/.test(r.sonuc);
      var sonra = MV.RAPORLAR.filter(function (x) { return x.kod === r.kod && x.durum === "imzali" && x.olustu > r.olustu; })[0];
      var ok = MV.ornekKusur(t, hafif);
      l.push({ id: "u-" + r.no, rapor: r, e: e, t: t, tesis: r.tesis, kriter: ok.kriter, sinif: sinifli ? (hafif ? "Hafif" : "Ağır") : "Kusurlu",
        aciklama: ok.aciklama, tarih: r.olustu.slice(0, 10), durum: sonra ? "giderildi" : "acik", kapatan: sonra || null });
    });
    return l;
  };
  /* örnek kusur (uygunsuzluk kaydı ve rapor belgesi aynı metni kullanır): formatlı türde formatın kendi maddesi ve notu */
  MV.ornekKusur = function (t, hafif) {
    var F = MV.formatYapi(t), kr = MV.kriterler(t);
    if (F && F.gozle) return hafif ? { i: 16, kriter: kr[16], aciklama: "Tali pano TP-2 kapağında tehlike işareti yok." }
      : { i: 13, kriter: kr[13], aciklama: "Faza erişim engeli IP2X koruma sınıfını sağlamıyor; pano iç kapağı yok." };
    if (F) return hafif ? { kriter: "Tali pano TP-2 · RCD", aciklama: "Not-7: " + F.notlar[6] } : { kriter: "Kapı motoru — sevkiyat", aciklama: "Not-2: " + F.notlar[1] };
    return hafif ? { i: 2, kriter: kr[2], aciklama: "Madde 3'te okunabilirliği azaltan hasar." } : { i: 1, kriter: kr[1], aciklama: "Madde 2'de izin verilen sınırın üstünde aşınma." };
  };
  /* DEVREDEN HAFİF KUSURLAR (2026-09-29, V4; §3.2 öneri maddesi → karar, §9 otuz altıncı tur 187): ekipmanın bu rapordan önceki son imzalı
     raporu "Hafif kusurlu"ysa kusurları sonraki kontrolde kendiliğinden listelenir (Ek-III 1.9.1: hafif kusur bir sonraki periyodik kontrole
     kadar giderilir); inspector her biri için "Giderildi" / "Giderilmedi" der. Yalnız kusur sınıflı (Bakanlık formatı yürürlükte) türde. */
  /* 199 (2026-09-29): kusur sınıfı olmayan türde önceki rapor "Kusurlu"ysa onun kusuru da listelenir (sinif: "Kusurlu"); sınıflı türde yalnız hafif */
  MV.devredenKusurlar = function (kod, once) {
    var e = MV.ekipman(kod), t = e && MV.tur(e.tur); if (!t) return [];
    var sinifli = MV.kusurSinifli(t);
    var r = MV.RAPORLAR.filter(function (x) { return x.kod === kod && x.durum === "imzali" && x.olustu && (!once || x.olustu < once); })
      .sort(function (a, b) { return a.olustu < b.olustu ? 1 : -1; })[0];
    if (!r || (sinifli ? !/Hafif/.test(r.sonuc || "") : MV.sonucAd(r) === "Uygun" || !r.sonuc)) return [];
    var ok = MV.ornekKusur(t, sinifli);
    return [{ id: r.no + "-1", kriter: ok.kriter, aciklama: ok.aciklama, rapor: r.no, tarih: r.olustu.slice(0, 10), sinif: sinifli ? "Hafif kusur" : "Uygun değil" }];
  };
  /* inspector'ın mesleği türün yetkili meslekleri arasında mı (§3.2 öneri 2c → karar: uyarı, engel değil) */
  MV.meslekYetkili = function (kisi, t) { var p = MV.kisi(kisi), m = p && MV.meslek(p.meslek); return !!m && m.g.indexOf(t.g) >= 0; };
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
  /* 123 (2026-09-26): teklif istenirse çok tesisli (t.tesisler); yoksa tek tesis */
  MV.teklifTesisleri = function (t) { return t.tesisler && t.tesisler.length ? t.tesisler : [t.tesis]; };
  MV.kalemRaporlari = function (t, tur) { return MV.RAPORLAR.filter(function (r) { return MV.teklifTesisleri(t).indexOf(r.tesis) >= 0 && r.olustu.slice(0, 10) >= t.tarih && MV.ekipman(r.kod).tur === tur; }); };
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
  /* plan 10: yeni tesis (t16) müşterinin yürürlükteki iş sözleşmesine eklendi */
  MV.IS_SOZLESMELERI.filter(function (x) { return x.tesisler.indexOf("t1") >= 0; }).forEach(function (x) { x.tesisler.push("t16"); });
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
    var t = MV.TEKLIFLER.filter(function (x) { return x.durum === "kabul" && MV.teklifTesisleri(x).indexOf(r.tesis) >= 0 && x.tarih <= gun; }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; })[0];
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
  /* ── GİDERLER (M14, 2026-09-27; reisim: "Giderleri ekle") — tarih, tür, tutar (fişteki KDV dahil tutar) + KDV oranı, belge (fiş / fatura;
     açılıp incelenir), isteğe bağlı iş (proje no) ve personel. İşin sayfasında o işin gideri ve kârı (raporlanan − gider, KDV hariç).
     No G-AAYY-SIRA (proje no'nun düzeni; firma ayarı, öneri). Tür başına varsayılan KDV oranı, değiştirilebilir. UYDURMA tutarlar. */
  MV.GIDER_TUR = [["yakit", "Yakıt", 20], ["konaklama", "Konaklama", 10], ["yol", "Yol", 20], ["kalibrasyon", "Kalibrasyon", 20], ["sarf", "Sarf malzeme", 20], ["diger", "Diğer", 20]];
  MV.KDV_ORAN = [20, 10, 1, 0];
  MV.giderTur = function (k) { var t = MV.GIDER_TUR.filter(function (x) { return x[0] === k; })[0]; return { k: t[0], ad: t[1], kdv: t[2] }; };
  MV.giderKdv = function (g) { var kdv = kurus(g.tutar * g.oran / (100 + g.oran)); return { kdv: kdv, haric: kurus(g.tutar - kdv) }; };
  /* [tarih, tür, tutar, iş, personel, açıklama, belge var mı] */
  MV.GIDERLER = [["2025-09-24", "yakit", 1460, "P-0925-019", "mk", "", 1], ["2025-11-05", "yakit", 1540, "P-1125-011", "ea", "", 1],
    ["2025-11-05", "konaklama", 3080, "P-1125-011", "hp", "İki gece, iki oda", 1], ["2026-02-10", "yakit", 780, "P-0226-011", "hp", "", 1],
    ["2026-02-10", "yol", 135, "P-0226-011", "hp", "Otoyol", 1], ["2026-08-05", "kalibrasyon", 3600, null, null, "Topraklama ölçer kalibrasyonu", 1],
    ["2026-08-19", "sarf", 920, null, null, "Eldiven ve baret", 1], ["2026-09-02", "kalibrasyon", 4200, null, null, "Yük hücresi kalibrasyonu", 1],
    ["2026-09-08", "sarf", 1380, null, null, "Penetrant seti", 1], ["2026-09-21", "yakit", 1850, "P-0926-025", "mk", "", 1],
    ["2026-09-21", "konaklama", 2640, "P-0926-025", "mk", "Bir gece, iki oda", 1], ["2026-09-21", "yol", 245, "P-0926-025", "ea", "Otoyol ve otopark", 0],
    ["2026-09-22", "yakit", 1120, "P-0926-028", "mk", "", 1], ["2026-09-23", "yakit", 960, "P-0926-031", "ea", "", 0],
    ["2026-09-23", "diger", 350, null, null, "Kargo, cihaz kalibrasyona gönderildi", 1]].map(function (x) {
    return { tarih: x[0], tur: x[1], tutar: x[2], oran: MV.giderTur(x[1]).kdv, is: x[3], kisi: x[4], aciklama: x[5], belge: x[6] ? "fis-" + x[0].replace(/-/g, "") + "-" + x[1] + ".pdf" : "", kaydeden: "ad" };
  });
  /* 2026-09-27 (reisim: "inspector masraf formu ekleyebilsin … muhasebe tarafında onaylanır ödenince ödendi olur, ekstradan muhasebe el ile de
     masraf ekleyebilir"): kaynak "form" (inspector plan içinden gönderir) ya da "muhasebe" (elle); durum bekliyor → onaylandi → odendi, ya da red */
  MV.GIDER_DURUM = { bekliyor: { ad: "Onay bekliyor", rozet: "a-rozet-bekliyor" }, onaylandi: { ad: "Onaylandı", rozet: "a-rozet-kabul" },
    odendi: { ad: "Ödendi", rozet: "a-rozet-tamam" }, red: { ad: "Reddedildi", rozet: "a-rozet-red" } };
  /* örnek: personelli giderler masraf formundan; eylülün son dördü onay / ödeme sürecinde */
  var SUREC = { "2026-09-21|konaklama": ["onaylandi"], "2026-09-21|yol": ["bekliyor"], "2026-09-22|yakit": ["bekliyor"], "2026-09-23|yakit": ["bekliyor"] };
  MV.GIDERLER.forEach(function (g) {
    var d = SUREC[g.tarih + "|" + g.tur];
    g.kaynak = g.kisi ? "form" : "muhasebe"; g.gonderildi = g.tarih + "T18:30";
    g.durum = d ? d[0] : "odendi"; var od = fGun(g.tarih, g.kisi ? 5 : 0); g.odeme = g.durum === "odendi" ? (od > MK.BUGUN ? MK.BUGUN : od) : null; g.onaylayan = g.durum === "bekliyor" ? null : "ad";
  });
  var gSira = {};
  MV.giderNo = function (tarih) { var ay = tarih.slice(5, 7) + tarih.slice(2, 4); gSira[ay] = (gSira[ay] || 0) + 1; return "G-" + ay + "-" + ("00" + gSira[ay]).slice(-3); };
  MV.GIDERLER.forEach(function (g) { g.no = MV.giderNo(g.tarih); });
  /* ── TALEPLER (modül 21, 2026-09-28; reisim: "personelin bireysel olarak isteyeceği şeyler … denetçi izin talebi masraf formu ekleme ve
     ileride ekleyeceğimiz bir şey olursa buradan ekler") — talep türleri (yenisi buraya) · izin talepleri. Masraf formu MV.GIDERLER'e yazar.
     İzin: tür, başlangıç–bitiş, iş günü (hafta sonu sayılmaz; resmî tatil takvimi uygulamada), durum bekliyor → onaylandi / red (onaylayan
     firma yöneticisi, öneri). Yıllık izin hakkı personel kaydında (örnek 14 gün); kalan = hak − onaylanan yıllık izin. UYDURMA. */
  MV.TALEP_TURLERI = [{ k: "izin", ad: "İzin talebi" }, { k: "masraf", ad: "Masraf formu" }];
  MV.IZIN_TUR = [{ k: "yillik", ad: "Yıllık izin" }, { k: "mazeret", ad: "Mazeret izni" }, { k: "rapor", ad: "Hastalık (sağlık raporu)" }, { k: "ucretsiz", ad: "Ücretsiz izin" }];
  MV.izinTur = function (k) { return MV.IZIN_TUR.filter(function (t) { return t.k === k; })[0]; };
  MV.IZIN_DURUM = { bekliyor: { ad: "Onay bekliyor", rozet: "a-rozet-bekliyor" }, onaylandi: { ad: "Onaylandı", rozet: "a-rozet-tamam" }, red: { ad: "Reddedildi", rozet: "a-rozet-red" } };
  MV.isGunu = function (bas, bit) { var n = 0, d = new Date(bas + "T12:00:00"), s = new Date(bit + "T12:00:00"); while (d <= s) { if (d.getDay() % 6) n++; d.setDate(d.getDate() + 1); } return n; };
  var iSira = {};
  MV.izinNo = function (tarih) { var ay = tarih.slice(5, 7) + tarih.slice(2, 4); iSira[ay] = (iSira[ay] || 0) + 1; return "I-" + ay + "-" + ("00" + iSira[ay]).slice(-3); };
  MV.IZIN_HAK = { mk: 14, ea: 14, bs: 14, hp: 20 };
  MV.IZINLER = [["mk", "yillik", "2026-08-10", "2026-08-14", "Yaz izni", "onaylandi", "2026-07-20T10:05", "2026-07-21T09:30"],
    ["mk", "mazeret", "2026-06-05", "2026-06-05", "Taşınma", "onaylandi", "2026-05-28T16:40", "2026-05-29T08:50"],
    ["mk", "yillik", "2026-10-12", "2026-10-16", "", "bekliyor", "2026-09-22T17:10", null],
    ["ea", "yillik", "2026-07-06", "2026-07-10", "", "onaylandi", "2026-06-15T11:00", "2026-06-16T09:00"]].map(function (x) {
    return { no: MV.izinNo(x[2]), kisi: x[0], tur: x[1], bas: x[2], bit: x[3], gun: MV.isGunu(x[2], x[3]), aciklama: x[4], belge: "", durum: x[5], gonderildi: x[6], karar: x[7], onaylayan: x[7] ? "ad" : null };
  });
  MV.izinOzet = function (kisi) {
    var yil = MK.BUGUN.slice(0, 4), l = MV.IZINLER.filter(function (x) { return x.kisi === kisi && x.tur === "yillik" && x.bas.slice(0, 4) === yil; });
    var kul = l.filter(function (x) { return x.durum === "onaylandi"; }).reduce(function (n, x) { return n + x.gun; }, 0), bek = l.filter(function (x) { return x.durum === "bekliyor"; }).reduce(function (n, x) { return n + x.gun; }, 0);
    var hak = MV.IZIN_HAK[kisi] || 14; return { hak: hak, kullanilan: kul, bekleyen: bek, kalan: hak - kul };
  };
  MV.gider = function (no) { return MV.GIDERLER.filter(function (g) { return g.no === no; })[0]; };
  MV.isGiderleri = function (no) { return MV.GIDERLER.filter(function (g) { return g.is === no; }); };

  /* ── KÂRLILIK (2026-09-27, reisim: "plan yapıldığında inspector maaşı yakıt araç kira bedeli ofis giderleri vergiler vb tüm giderler etki
     edecek şekilde kazanç ve gider hesaplanarak kar hesaplanacak kar yüzdesi yazacak iş başına"; iskelet, dağıtım yöntemi VARSAYIM) —
     iş kârı = gelir (raporlanan, KDV hariç) − işe bağlı masraflar (KDV hariç, reddedilen hariç) − inspector maliyeti (günlük maliyet × işte
     rapor yazdığı gün) − genel gider payı. Genel gider = ayın sabit giderleri + işe bağlı olmayan masrafları + inspector olmayan personelin
     maliyeti; inspector-gününe eşit dağıtılır (÷ inspector sayısı ÷ 22 iş günü). Sabit giderler firma ayarı; tutarlar UYDURMA. */
  MV.SABIT_GIDER = [{ k: "arac", ad: "Araç kira", aylik: 42000, not: "2 araç" }, { k: "ofis", ad: "Ofis kirası", aylik: 28000, not: "" },
    { k: "ofisgider", ad: "Ofis giderleri", aylik: 7500, not: "elektrik, su, internet" }, { k: "vergi", ad: "Vergi ve harçlar", aylik: 12000, not: "" }];
  MV.sabitToplam = function () { return MV.SABIT_GIDER.reduce(function (n, x) { return n + x.aylik; }, 0); };
  var inspMi = function (p) { return !!(p.hesap && p.hesap.roller.indexOf("inspector") >= 0); };
  var haricTop = function (l) { return kurus(l.reduce(function (n, g) { return n + MV.giderKdv(g).haric; }, 0)); };
  MV.ayMaliyet = function (ay) {
    var aktif = MV.PERSONEL.filter(function (p) { return p.basla.slice(0, 7) <= ay && !(p.ayrildi && p.ayrildi.slice(0, 7) < ay); });
    var ins = aktif.filter(inspMi), diger = aktif.filter(function (p) { return !inspMi(p); });
    var mal = function (l) { return kurus(l.reduce(function (n, p) { var b = MV.bordroAy(p.id, ay); return n + (b ? b.maliyet : 0); }, 0)); };
    var gl = MV.GIDERLER.filter(function (g) { return g.tarih.slice(0, 7) === ay && g.durum !== "red"; });
    var o = { ay: ay, kisi: aktif.length, insSayi: ins.length, maasIns: mal(ins), maasDiger: mal(diger), sabit: MV.sabitToplam(),
      genel: haricTop(gl.filter(function (g) { return !g.is; })), masraf: haricTop(gl.filter(function (g) { return g.is; })),
      bordroVar: MV.BORDROLAR.some(function (b) { return b.ay === ay; }) };
    o.gunPay = o.insSayi ? kurus((o.maasDiger + o.sabit + o.genel) / o.insSayi / MV.IS_GUNU) : 0;
    return o;
  };
  var gunRapor = function (k, g) { var n = 0; MV.ISLER.forEach(function (y) { y.raporlar.forEach(function (no) { var r = MV.rapor(no); if (r.kisi === k && r.olustu.slice(0, 10) === g) n++; }); }); return n; };
  MV.isKarlilik = function (x) {
    var ay = x.tarih.slice(0, 7), am = MV.ayMaliyet(ay), o = MV.isOzet(x), kg = {};
    /* kişi-gün: kişinin o gün bu işte yazdığı rapor ÷ o gün bütün işlerde yazdığı rapor (aynı gün iki işe giden inspector'ın günü bölünür) */
    x.raporlar.map(MV.rapor).forEach(function (r) { var g = r.olustu.slice(0, 10); (kg[r.kisi] = kg[r.kisi] || {})[g] = (kg[r.kisi][g] || 0) + 1; });
    var kisiler = Object.keys(kg).map(function (k) {
      var gun = Object.keys(kg[k]).reduce(function (n, g) { return n + kg[k][g] / gunRapor(k, g); }, 0);
      return { kisi: k, gun: Math.round(gun * 100) / 100, gunluk: MV.gunlukMaliyet(k, ay) };
    });
    var gun = kisiler.reduce(function (n, k) { return n + k.gun; }, 0);
    var sonuc = { ay: ay, gelir: o.raporlanan, rapor: o.toplam, kisiler: kisiler, gun: gun, gunPay: am.gunPay, tahmini: !am.bordroVar,
      dogrudan: haricTop(MV.isGiderleri(x.no).filter(function (g) { return g.durum !== "red"; })),
      personel: kurus(kisiler.reduce(function (n, k) { return n + k.gun * k.gunluk; }, 0)), genel: kurus(am.gunPay * gun) };
    sonuc.gider = kurus(sonuc.dogrudan + sonuc.personel + sonuc.genel);
    sonuc.kar = kurus(sonuc.gelir - sonuc.gider);
    sonuc.oran = sonuc.gelir ? Math.round(sonuc.kar / sonuc.gelir * 1000) / 10 : 0;
    return sonuc;
  };
  /* firma geneli, ay: gelir (o ay denetlenen işlerin raporlananı) − maaşlar (bordro) − masraflar − sabit giderler */
  MV.ayGelirGider = function (ay) {
    var am = MV.ayMaliyet(ay), isler = MV.ISLER.filter(function (x) { return x.tarih.slice(0, 7) === ay; });
    var gelir = kurus(isler.reduce(function (n, x) { return n + MV.isOzet(x).raporlanan; }, 0));
    var gider = kurus(am.maasIns + am.maasDiger + am.masraf + am.genel + am.sabit);
    return { am: am, isler: isler, gelir: gelir, gider: gider, kar: kurus(gelir - gider), oran: gelir ? Math.round((gelir - gider) / gelir * 1000) / 10 : null };
  };

  /* TOPLAM (L3, 2026-09-30, reisim: "toplam gelir gider bilanço kısmıda olsun şu an ay/ay gösteriyor"): verilen aylar (eskiden yeniye)
     toplanır; her kalem ayların toplamı, sabit giderler ay sayısıyla. Aylar ayrıca tek tek (aylara göre döküm). */
  MV.donemGelirGider = function (aylar) {
    var l = aylar.map(MV.ayGelirGider), top = function (f) { return kurus(l.reduce(function (n, d) { return n + f(d); }, 0)); };
    var gelir = top(function (d) { return d.gelir; }), gider = top(function (d) { return d.gider; });
    return { aylar: l, ay: aylar.length, isler: [].concat.apply([], l.map(function (d) { return d.isler; })), gelir: gelir, gider: gider, kar: kurus(gelir - gider),
      oran: gelir ? Math.round((gelir - gider) / gelir * 1000) / 10 : null,
      maas: top(function (d) { return d.am.maasIns + d.am.maasDiger; }), masraf: top(function (d) { return d.am.masraf; }), genel: top(function (d) { return d.am.genel; }),
      tahmini: l.filter(function (d) { return !d.am.bordroVar; }).length };
  };

  /* belge (MB.belge) için raporun dolu verisi; İSG-KATİP kaydı rapor tarihinde geçerli olan (önceki kayıtlar dahil) */
  MV.raporBelge = function (r) {
    var e = MV.ekipman(r.kod), t = MV.tur(e.tur), ts = MV.tesis(r.tesis), p = MV.kisi(r.kisi), gun = r.olustu.slice(0, 10);
    var isg = MV.ISG.filter(function (x) { return x.t === ts.id && x.k === p.id && x.onay <= gun; }).sort(function (a, b) { return a.onay < b.onay ? 1 : -1; })[0];
    var s = new Date(gun + "T12:00:00"); s.setMonth(s.getMonth() + t.periyot);
    return { e: e, ts: ts, m: MV.musteri(ts.m), p: p, isg: isg, tarih: gun, bas: r.olustu.slice(11, 16), bit: r.gonderildi ? r.gonderildi.slice(11, 16) : null,
      cihaz: MV.turCihazlari(t).map(function (k) { return MV.eklenebilirCihazlar(p.id, [k])[0]; }).filter(Boolean),   /* raporda eklenen: türün cihazları, zimmetten */
      sonraki: s.toISOString().slice(0, 10), no: MV.surumNo(r), sonuc: MV.sonucAd(r) || "Uygun", imza: r.imza };
  };
  /* REVİZE SÜRÜMÜ (193, 2026-09-29): raporun görünen numarası sürümüyle (KM-…-R1). Müşteri yalnız SON İMZALI sürümü görür: revize sürerken önceki
     imzalı sürüm (onay, imza, sonuç ve imzalı PDF sürüm kaydından), yeni sürüm imzalanınca o; eski sürüm firmada saklı kalır. */
  MV.surumNo = function (r) { return r._surumNo || r.no + (r.revizyonlar && r.revizyonlar.length ? "-" + r.revizyonlar[0].ad : ""); };
  MV.musteriSurumu = function (r) {
    if (!r || r.arsiv) return null;   /* arşivdeki rapor müşteride görünmez (201) */
    var rv = r.revizyonlar || [];
    if (r.durum === "imzali") return Object.assign({}, r, { _yerine: rv.length ? (rv[1] ? r.no + "-" + rv[1].ad : r.no) : null });
    var o = rv[0] && rv[0].onceki; if (!o || !o.imza) return null;   /* revize sürüyor: önceki imzalı sürüm */
    return Object.assign({}, r, { durum: "imzali", onay: o.onay, imza: o.imza, imzaDosya: o.imzaDosya, sonuc: o.sonuc, _surumNo: r.no + (rv[1] ? "-" + rv[1].ad : ""),
      _yerine: rv[1] ? (rv[2] ? r.no + "-" + rv[2].ad : r.no) : null, revizyonlar: rv.slice(1) });
  };
  /* sayfalar arası ortak kayıt (2026-09-28, Kalem M): Plan aç'ta açılan planlar — Planlar bunları kendi listesine alır */
  /* PLANLAR (Planlar maketinin tohumu; 2026-09-29'da maket.js'ten taşındı — yan menü balonu her sayfada sayar, 35. tur 163). UYDURMA. */
  MV.PLANLAR = [
    { id: 1, no: "P-0926-031", ad: "Merkez Fabrika", musteri: "Ada Makina San. ve Tic. A.Ş.", adres: "Organize Sanayi Bölgesi 4. Cadde No: 12", ilce: "Gebze", il: "Kocaeli", tarih: "2026-09-23", bas: "09:00", bit: "12:30", ekip: ["mk", "ea"], m: 8, e: 4, yeni: 2, disarida: 2, durum: "denetimde", acildi: "2026-09-15T10:12", kabul: "2026-09-16T08:31", basladi: "2026-09-23T09:04", isg: { no: "S-2026-0412", onay: "2026-09-16" }, rap: { onayda: 3, taslak: 7 }, aciklama: "Kompresör odasına giriş için tesis güvenliğinden refakat istenecek." },
    { id: 2, no: "P-0926-034", ad: "Depo 2", musteri: "Yıldız Ambalaj A.Ş.", adres: "Liman Caddesi No: 7", ilce: "Tuzla", il: "İstanbul", tarih: "2026-09-23", bas: "14:00", bit: "17:00", ekip: ["mk"], m: 5, e: 0, durum: "bekliyor", acildi: "2026-09-17T11:40", isg: { no: "S-2026-0431", onay: "2026-09-19" } },
    { id: 3, no: "P-0926-036", ad: "Aktarma Merkezi ve Soğuk Hava Deposu", musteri: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", adres: "Sanayi Caddesi No: 48, Aktarma Merkezi Girişi", ilce: "Çorlu", il: "Tekirdağ", tarih: "2026-09-24", bitTarih: "2026-09-25", bas: "08:30", bit: "16:30", ekip: ["mk", "ea", "bs"], m: 14, e: 6, disarida: 1, durum: "bekliyor", acildi: "2026-09-18T09:05", isg: { no: "S-2026-0440", onay: "2026-09-15" } },
    { id: 4, no: "P-0926-038", ad: "Boyahane", musteri: "Mavi Tekstil Ltd.", adres: "Organize Sanayi Bölgesi 2. Sokak No: 5", ilce: "Çerkezköy", il: "Tekirdağ", tarih: "2026-09-25", bas: "09:00", bit: "13:00", ekip: ["mk", "ea"], m: 2, e: 7, durum: "bekliyor", acildi: "2026-09-19T14:22", isg: { no: "S-2026-0447", onay: "2026-09-25" }, eksik: "İSG-KATİP onayı 25.09.2026'da verilmiş; en geç 24.09.2026 olmalı." },
    { id: 5, no: "P-0926-039", ad: "Döküm Hattı", musteri: "Akın Döküm San. Ltd.", adres: "Demir Çelik Caddesi No: 21", ilce: "Dilovası", il: "Kocaeli", tarih: "2026-09-26", bas: "10:00", bit: "12:00", ekip: ["mk"], m: 3, e: 0, durum: "bekliyor", acildi: "2026-09-20T10:48", isg: null, eksik: "Bu tesis için İSG-KATİP kaydı yok." },
    { id: 6, no: "P-0926-035", ad: "Üretim Tesisi", musteri: "Ege Plastik A.Ş.", adres: "Organize Sanayi Bölgesi 1. Kısım No: 9", ilce: "Yunusemre", il: "Manisa", tarih: "2026-09-29", bas: "09:00", bit: "15:00", ekip: ["mk", "ea"], m: 7, e: 3, durum: "kabul", acildi: "2026-09-17T15:30", kabul: "2026-09-18T09:12", isg: { no: "S-2026-0436", onay: "2026-09-20" } },
    { id: 7, no: "P-0926-037", ad: "Şantiye Deposu", musteri: "Kaya Yapı Malzemeleri Ltd.", adres: "Çevre Yolu Caddesi No: 3", ilce: "Başakşehir", il: "İstanbul", tarih: "2026-09-30", bas: "09:00", bit: "12:00", ekip: ["mk"], m: 2, e: 0, durum: "red", acildi: "2026-09-18T16:02", reddedildi: "2026-09-19T08:47", isg: { no: "S-2026-0444", onay: "2026-09-21" }, gerekce: "Aynı saatte başka tesiste denetimim var." },
    { id: 8, no: "P-0926-028", ad: "Soğuk Hava Deposu", musteri: "Deniz Gıda Ltd.", adres: "Liman Yolu No: 15", ilce: "Pendik", il: "İstanbul", tarih: "2026-09-22", bas: "09:00", bit: "11:30", ekip: ["mk"], m: 4, e: 0, durum: "tamam", acildi: "2026-09-10T13:15", kabul: "2026-09-11T08:05", basladi: "2026-09-22T09:02", bitti: "2026-09-22T11:52", isg: { no: "S-2026-0405", onay: "2026-09-12" }, rap: { onayda: 3, taslak: 1 } },
    /* 2026-09-28 (reisim: "planlar da en üstte sadece en son attığım PDF formatlara göre açılmış plan olsun"): yalnız elektrik iç tesisatı
       (ZPKR02) ve AG topraklama (ZPKR01); raporları formata göre sonuçlu (Tamamlandı · Uygun, hafif kusurlu, ağır kusurlu, iki taslak).
       Ekipman ve raporlar ortak veriden (MV.PLAN10_KODLAR, MV.RAPORLAR plan 10) — aynı kod, numara, durum. */
    { id: 10, no: "P-0926-040", ad: "Enerji Merkezi", musteri: "Ada Makina San. ve Tic. A.Ş.", adres: "Organize Sanayi Bölgesi 4. Cadde No: 14", ilce: "Gebze", il: "Kocaeli", tarih: "2026-09-23", bas: "13:00", bit: "17:00", ekip: ["mk", "ea"], m: 0, e: 5, yeni: 1, durum: "denetimde", acildi: "2026-09-22T16:30", kabul: "2026-09-23T08:40", basladi: "2026-09-23T13:10", isg: { no: "S-2026-0451", onay: "2026-09-18" }, ortak: true, aciklama: "Yalnız Bakanlık formatlı türler: elektrik iç tesisatı (ZPKR02) ve AG topraklama (ZPKR01)." },
    { id: 9, no: "P-0926-025", ad: "Değirmen", musteri: "Başak Un Değirmenleri A.Ş.", adres: "İstasyon Caddesi No: 30", ilce: "Lüleburgaz", il: "Kırklareli", tarih: "2026-09-21", bas: "13:00", bit: "16:00", ekip: ["mk", "ea"], m: 16, e: 8, durum: "tamam", acildi: "2026-09-08T10:30", kabul: "2026-09-09T07:58", basladi: "2026-09-21T13:05", bitti: "2026-09-21T16:20", isg: { no: "S-2026-0398", onay: "2026-09-10" }, rap: { onaylandi: 14, onayda: 8 } }
  ];
  MV.ACILAN_PLANLAR = [];
  /* ── TAKİP (2026-09-28, T6): süre takibi isteyen işler tek yerde hesaplanır; Uyarılar listesi, Sözleşmeler şeridi ve yan menünün
     renkli balonları aynı hesabı okur. Kırmızı = süresi geçen, sarı = yaklaşan, yeşil = sorunsuz (reisim: "cihazlarda süresi geçen cihaz
     sayısı kırmızı balon, yaklaşan sarı balon, sorunsuz cihazlar yeşil balon … diğer modüllerde de benzer takip"). */
  var gunKalan = function (iso) { return Math.round((new Date(iso + "T12:00:00") - new Date(MK.BUGUN + "T12:00:00")) / 864e5); };
  /* ARA KONTROL (2026-09-28, T7; reisim: "ara kontrollerde … günlük, haftalık, aylık, 6 ayda bir … otomatik bakım oluştur"): cihazın bir ya da
     birkaç programı (sıklık) olur; kayıtlar yapılan (tarih, yapan, yöntem, sonuç) ve planlanan (planli) ara kontrollerdir. Bir programın
     sonraki tarihi: planlanan en erken kayıt, yoksa son yapılan + sıklık (hiç yapılmadıysa bugün). Uyarı eşiği sıklığa göre (esik gün). */
  MV.ARA_SIKLIK = [{ k: "gunluk", ad: "Günlük", gun: 1, esik: 0 }, { k: "haftalik", ad: "Haftalık", gun: 7, esik: 2 },
    { k: "aylik", ad: "Aylık", ay: 1, esik: 7 }, { k: "6ay", ad: "6 ayda bir", ay: 6, esik: 30 }];
  MV.araSiklik = function (k) { return MV.ARA_SIKLIK.filter(function (x) { return x.k === k; })[0]; };
  MV.araIleri = function (iso, k) {
    var s = MV.araSiklik(k), d = new Date(iso + "T12:00:00");
    if (s.gun) d.setDate(d.getDate() + s.gun); else d.setMonth(d.getMonth() + s.ay);
    return d.toISOString().slice(0, 10);
  };
  MV.araProgram = function (v) {
    return (v.araSiklik || []).map(function (k) {
      var plan = v.ara.filter(function (x) { return x.planli && x.siklik === k; }).map(function (x) { return x.tarih; }).sort()[0];
      var son = v.ara.filter(function (x) { return !x.planli && x.siklik === k; }).map(function (x) { return x.tarih; }).sort().pop();
      var sonraki = plan || (son ? MV.araIleri(son, k) : MK.BUGUN), kal = gunKalan(sonraki);
      return { k: k, ad: MV.araSiklik(k).ad, sonraki: sonraki, son: son || null, kalan: kal, durum: kal < 0 ? "gecti" : kal <= MV.araSiklik(k).esik ? "yakin" : "gecerli" };
    });
  };
  /* cihazın ara kontrol durumu: en acil program; kalibrasyonu geçen ya da kalibrasyondaki cihazda sorulmaz */
  MV.araDurum = function (v) {
    if (v.tur !== "cihaz" || !(v.araSiklik || []).length || MV.kalDurum(v) === "gecti" || MV.kimde(v.id) === "lab") return null;
    var sira = { gecti: 0, yakin: 1, gecerli: 2 };
    var p = MV.araProgram(v).sort(function (a, b) { return sira[a.durum] - sira[b.durum] || (a.sonraki < b.sonraki ? -1 : 1); })[0];
    return { tarih: p.sonraki, durum: p.durum, siklik: p.k };
  };
  /* İSG-KATİP (uyarı yalnız İSG-KATİP için, reisim 2026-09-26): bitiş tarihi açık planın gününden (plan yoksa bugünden) önce · açık planda
     görevli olup ID'si olmayan ya da bitmiş denetçiler [tesis, kişi, neden] */
  MV.isgBitti = function (r) { var t = MV.tesis(r.t), gun = MV.acikPlan(t) && (t.pekip || []).indexOf(r.k) >= 0 ? t.ptarih : MK.BUGUN; return !!r.bitis && r.bitis < gun; };
  MV.isgEksik = function (x) {
    var l = [];
    x.tesisler.forEach(function (tid) {
      var t = MV.tesis(tid); if (!MV.acikPlan(t)) return;
      (t.pekip || []).forEach(function (k) {
        var r = MV.isgTesis(tid).filter(function (y) { return y.k === k; })[0];
        if (!r) l.push([t, MV.kisi(k), "ID yok"]); else if (MV.isgBitti(r)) l.push([t, MV.kisi(k), "bitmiş"]);
      });
    });
    return l;
  };
  /* uyarılar kayıtlardan türetilir (ayrı "uyarı" kaydı yok): kalibrasyon ve eğitim tekrarı eşikleri firma ayarı (MV.esik), ara kontrol ≤ 30 gün */
  MV.uyarilar = function () {
    var l = [];
    MV.VARLIKLAR.forEach(function (v) {
      var d = MV.kalDurum(v); if (d !== "gecti" && d !== "yakin") return;
      var k = MV.kimde(v.id);
      l.push({ id: "k-" + v.id, tur: "kal", ikon: "gauge", konu: v.env + " · " + v.ad, alt: "Kalibrasyon", kisi: k, tarih: v.bitis, durum: d,
        href: MK.adres(8, "#/c/" + v.id), sonuc: d === "gecti" ? (k !== "depo" ? MV.kisi(k).ad + " raporlarını onaya gönderemez" : "depoda") : MV.esik("kal") + " gün içinde bitiyor" });
    });
    MV.VARLIKLAR.forEach(function (v) {
      var a = MV.araDurum(v); if (!a || a.durum === "gecerli") return;
      l.push({ id: "a-" + v.id, tur: "ara", ikon: "flask-conical", konu: v.env + " · " + v.ad, alt: "Ara kontrol", kisi: MV.kimde(v.id), tarih: a.tarih, durum: a.durum,
        href: MK.adres(8, "#/c/" + v.id), sonuc: (a.durum === "gecti" ? "gecikti · " : "yaklaşıyor · ") + MV.araSiklik(a.siklik).ad.toLocaleLowerCase("tr") });
    });
    MV.EGITIMLER.forEach(function (x) {
      var d = MV.egitimDurum(x); if (d !== "gecti" && d !== "yakin") return;
      l.push({ id: "e-" + x.id, tur: "egt", ikon: "graduation-cap", konu: MV.egitimTuru(x.k).ad, alt: "Eğitim tekrarı", kisi: x.kisi, tarih: x.tekrar, durum: d,
        href: MK.adres(10, "#/?kisi=" + x.kisi) || MK.adres(2, "#/p/" + x.kisi), sonuc: d === "gecti" ? "tekrar gerekli" : MV.esik("egitim") + " gün içinde" });
    });
    return l;
  };
  /* modül başına takip sayıları (yan menü balonları): { kirmizi, sari, yesil } ve her rengin adı; 0 olan balon çizilmez */
  var say = function (l, d) { return l.filter(function (u) { return u.durum === d; }).length; };
  var saatFarki = function (z) { return (new Date(MK.simdi() + ":00Z") - new Date(z + ":00Z")) / 36e5; };
  MV.TAKIP = {
    8: function () {   /* ölçüm cihazları: kalibrasyon ya da ara kontrol süresi geçen · yaklaşan · sorunsuz (kalibrasyondaki cihaz sayılmaz) */
      var o = { kirmizi: 0, sari: 0, yesil: 0 };
      MV.VARLIKLAR.forEach(function (v) {
        var kd = MV.kalDurum(v); if (!kd || kd === "lab") return;
        var a = MV.araDurum(v), ad = a ? a.durum : "gecerli";
        if (kd === "gecti" || ad === "gecti") o.kirmizi++; else if (kd === "yakin" || ad === "yakin") o.sari++; else o.yesil++;
      });
      return Object.assign(o, { ad: { kirmizi: "süresi geçen cihaz", sari: "süresi yaklaşan cihaz", yesil: "sorunsuz cihaz" } });
    },
    20: function () { var l = MV.uyarilar(); return { kirmizi: say(l, "gecti"), sari: say(l, "yakin"), ad: { kirmizi: "süresi geçen uyarı", sari: "yaklaşan uyarı" } }; },
    2: function () {   /* personel: eğitim tekrarı geçen · yaklaşan */
      var l = MV.EGITIMLER.map(function (x) { return { durum: MV.egitimDurum(x) }; });
      return { kirmizi: say(l, "gecti"), sari: say(l, "yakin"), ad: { kirmizi: "eğitim tekrarı geçen", sari: "eğitim tekrarı yaklaşan" } };
    },
    12: function () {   /* sözleşmeler: açık planda İSG-KATİP ID'si eksik ya da bitmiş */
      return { kirmizi: MV.TESISLER.reduce(function (n, t) { return n + MV.isgEksik({ tesisler: [t.id] }).length; }, 0), ad: { kirmizi: "İSG-KATİP eksik ya da bitmiş" } };
    },
    /* 35. tur 163 (reisim 2026-09-29): bekleyen sarı, süresi geçen kırmızı. Makette firma geneli; uygulamada kişinin kendi işleri
       (planı kabul edecek inspector, imzalayacak inspector, onaylayacak branş yöneticisi). Süre sınırları başlangıç değeri (firma ayarı). */
    13: function () {   /* planlar: kabul bekleyen · plan günü gelmiş / geçmiş ve hâlâ kabul bekleyen */
      var l = MV.PLANLAR.filter(function (p) { return p.durum === "bekliyor"; });
      var gec = l.filter(function (p) { return p.tarih <= MK.BUGUN; }).length;
      return { kirmizi: gec, sari: l.length - gec, ad: { kirmizi: "plan günü gelmiş, kabul bekleyen plan", sari: "kabul bekleyen plan" } };
    },
    14: function () {   /* raporlar: son imza bekleyen · onaydan 24 saati geçmiş */
      var l = MV.RAPORLAR.filter(function (r) { return r.durum === "onaylandi" && !r.pasif; });
      var gec = l.filter(function (r) { return r.onay && saatFarki(r.onay.zaman) > 24; }).length;
      return { kirmizi: gec, sari: l.length - gec, ad: { kirmizi: "son imzası 24 saati geçen rapor", sari: "son imza bekleyen rapor" } };
    },
    15: function () {   /* onaylar: onay bekleyen · gönderimden 24 saati geçmiş */
      var l = MV.RAPORLAR.filter(function (r) { return r.durum === "onayda" && !r.pasif; });
      var gec = l.filter(function (r) { return r.gonderildi && saatFarki(r.gonderildi) > 24; }).length;
      return { kirmizi: gec, sari: l.length - gec, ad: { kirmizi: "onayı 24 saati geçen rapor", sari: "onay bekleyen rapor" } };
    },
    18: function () {   /* muhasebe: vadesi geçen fatura */
      return { kirmizi: (MV.FATURALAR || []).filter(function (f) { return MV.faturaDurum(f) === "gecikti"; }).length, ad: { kirmizi: "vadesi geçen fatura" } };
    }
  };
  MV.takip = function (no) { var f = MV.TAKIP[no]; return f ? f() : null; };
  /* kalıcı maket: tohum kuruldu, bu tarayıcıdaki denemeler yerinde yüklenir (maket-ortak.js KALICI MAKET) */
  if (MK.kaliciMV) MK.kaliciMV(MV);
  MV.EGITIM_DURUM.yakin.ad = MV.esik("egitim") + " gün içinde";   /* kayıtlı eşikle (202) */
})();
