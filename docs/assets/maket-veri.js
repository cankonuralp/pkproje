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
    { k: "yonetici", ad: "Firma yöneticisi", kisa: "Firma yön.", acik: "Kullanıcılar, roller ve firma ayarları; hareket kaydını görür." }
  ];
  MV.rol = function (k) { return MV.ROLLER.filter(function (r) { return r.k === k; })[0]; };

  /* Rol × modül görünürlüğü — ÖNERİ (reisim 2026-09-23: "kim hangi modülü görebilecek sonradan belirleriz").
     Düzey: yaz (görür ve değiştirir) · gor (görür) · brans (yalnız kendi branşı) · kendi (yalnız kendi kayıtları) · yok.
     Sıra: planlama · inspector · mekyon · elkyon · yonetici. "hareket" = Hareket kaydı (denetim izi; karar 30: yöneticiye). */
  MV.MATRIS = {
    13: ["yaz", "kendi", "gor", "gor", "yaz"], 14: ["gor", "kendi", "brans", "brans", "gor"], 15: ["yok", "yok", "brans", "brans", "gor"],
    20: ["gor", "kendi", "gor", "gor", "gor"], 3: ["yaz", "gor", "gor", "gor", "yaz"], 11: ["yaz", "yok", "gor", "gor", "yaz"],
    12: ["yaz", "kendi", "gor", "gor", "yaz"], 7: ["yaz", "yaz", "gor", "gor", "yaz"], 8: ["gor", "kendi", "yaz", "yaz", "yaz"],
    9: ["gor", "kendi", "yaz", "yaz", "yaz"], 2: ["gor", "kendi", "gor", "gor", "yaz"], 10: ["gor", "kendi", "yaz", "yaz", "yaz"],
    18: ["yok", "yok", "yok", "yok", "yaz"], 19: ["gor", "kendi", "brans", "brans", "gor"], 5: ["gor", "gor", "yaz", "yaz", "yaz"],
    4: ["gor", "gor", "yaz", "yaz", "yaz"], 1: ["yok", "yok", "yok", "yok", "yaz"], hareket: ["yok", "yok", "yok", "yok", "gor"]
  };
  MV.DUZEY = {
    yaz: { ad: "Değiştirir", rozet: "a-rozet-tamam", sira: 4 }, gor: { ad: "Görür", rozet: "a-rozet-kabul", sira: 3 },
    brans: { ad: "Branşı", rozet: "a-rozet-notr", sira: 2 }, kendi: { ad: "Kendi", rozet: "a-rozet-notr", sira: 1 }, yok: { ad: "—", rozet: "", sira: 0 }
  };

  /* PERSONEL (modül 2) ve hesapları (modül 1). hesap: null = giriş hesabı yok · durum etkin | davet | pasif.
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
      hesap: { durum: "davet", roller: ["inspector"], davet: "2026-09-22T10:15" }, yetki: { elektrik: "2021-12-13" },
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
  MV.meslekAd = function (p) { return p.meslek === "diger" ? p.meslekMetin : MV.meslek(p.meslek).ad; };
  MV.bas = function (ad) { return ad.split(" ").map(function (x) { return x.charAt(0); }).join("").slice(0, 2).toLocaleUpperCase("tr"); };
  /* yetkili kişi (inspector) olabilir mi: meslek en az bir gruba izin veriyor (teknisyen/diğer değil) */
  MV.yetkiliOlabilir = function (p) { return MV.meslek(p.meslek).g.length > 0; };
  /* plan kabulü için kişi eksikleri (§3.2 madde 2b–2c; 2a İSG-KATİP plan × tesis başına, burada değil) */
  MV.kabulEksik = function (p) {
    if (!p.hesap || p.hesap.roller.indexOf("inspector") < 0) return null;
    var e = [];
    if (!p.ekipnet) e.push("EKİPNET kayıt numarası yok");
    if (!MV.yetkiliOlabilir(p)) e.push("Meslek yetkili kişi olamaz");
    if (!Object.keys(p.yetki).length) e.push("Hiçbir gruba yetkilendirilmemiş");
    return e;
  };
})();
