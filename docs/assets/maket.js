/* ══ probata MAKET — Planlar + plan içi (2026-09-23 · 5. tur; 2026-09-24 ortak üreticilere bağlandı) ════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3); gerçek firma, kişi, tesis, adres, sözleşme ve ekipman kodu yok.
   ⛔ "Bugün" sabit: 2026-09-23, saat 16:40 — ölçüm her açılışta aynı sonucu versin.
   Adres: ?veri=dolu|bos|hata · ?tema=acik|koyu · #/plan/<id> = plan içi ·
          #/plan/<id>/ekle[/<KOD>] = ekipman ekle penceresi (sunum çerçeveleri için).
   2. tur: liste sütunları örnek listeden; satırda tek tuş Kabul et → Denetime başla → Devam et.
   3. tur: ekipman ile rapor ayrı; ekipman kodu personelce girilir, firmada eşsiz, çakışan kod kaydedilmez; her hareket
   kayda geçer; numara sistemi.
   4. tur (reisim 2026-09-23): plan içi bir AKIŞ — dikey adım çizelgesi: Planlandı → Kabul (tarafsızlık beyanı) →
   Denetim (kontrol listesi: ekipmanlar + raporlar) → Tamamlama; her adım kim/ne zaman gösterir, iş adımın içinde yapılır.
   Ekipman ve rapor listeleri SÜZGEÇLİ ve 10'ar kayıtla SAYFALI. Süzgeç satırları tek üreticiden (kalıp 15).
   5. tur (reisim 2026-09-23): hareket listesi plan içinden kalktı (kayıt tutulur, gösterilmez), yerinde yalnız proje
   notları · raporlar 20'şer · yan menüde firma panelindeki BÜTÜN modüller, genel adlarla (Planlar, Raporlar, Zimmetler…);
   kimin hangi modülü göreceği sonra belirlenecek.
   2026-09-24 (toplu maket): kabuk, yan menü (MENU), süzgeç satırı, liste, sayfalayıcı, boş durum, bildirim ve olay dağıtıcısı
   docs/assets/maket-ortak.js'e taşındı (tek üretici, MAKET-PLANI §3.2); burada yalnız Planlar'a özgü veri ve ekranlar. */
(function () {
  "use strict";
  var BUGUN = MK.BUGUN;   /* 2026-09-23; saat MK.SAAT (ortak) */
  var HAFTA = ["2026-09-21", "2026-09-27"];
  var YEDI = ["2026-09-23", "2026-09-29"];
  var FIRMA_KOD = "KM";   /* rapor numarasının başındaki firma kısa kodu (firma ayarı) */
  /* sayfa boyu listeye göre (reisim 2026-09-23): ekipman 10 ("10 taneden sonra diğer sayfaya geçsin"), rapor 20
     ("raporlarda 5 değil 20 rapor alt alta durabilsin") */
  var SAYFA = { e: 10, r: 20 };

  var KISI = {
    mk: { ad: "Mert Kaya", brans: "Mekanik", rol: "Inspector" },
    ea: { ad: "Elif Aydın", brans: "Elektrik", rol: "Inspector" },
    bs: { ad: "Burak Şahin", brans: "Mekanik", rol: "Inspector" },
    za: { ad: "Zeynep Arslan", brans: "", rol: "Planlama" }
  };
  var BEN = "mk";
  /* Ekipman türü kataloğu (modül 5'in maketteki karşılığı). 14 tür > 8 → seçim alanında arama (kalıp 19).
     2026-09-24 (M3): türler ortak katalogdan (maket-veri.js MV.PLAN_KATALOG) — aynı 14 tür, aynı kod, ad, branş ve sıra. */
  var KATALOG = MV.PLAN_KATALOG;
  var MEK = KATALOG.filter(function (t) { return t.b === "m" && t.k !== "BK"; });
  var ELK = KATALOG.filter(function (t) { return t.b === "e" && t.k !== "JN"; });
  var KONUM = ["Üretim holü", "Kompresör odası", "Sevkiyat alanı", "Depo girişi", "Bakım atölyesi", "Ana dağıtım odası", "Yükleme rampası", "Hat 2", "Kazan dairesi", "Çatı"];
  var SONUC = ["Uygun", "Uygun", "Hafif kusurlu", "Uygun", "Uygun", "Kusurlu", "Uygun"];
  /* tarafsızlık beyanı (TS EN ISO/IEC 17020 tarafsızlık ilkesi; kendi metnimiz) */
  var BEYAN = "Bu planı TS EN ISO/IEC 17020 kurallarına uygun, bağımsız ve tarafsız yürüteceğimi; muayene edilen kuruluşla tarafsızlığımı etkileyecek ticari, mali ya da kişisel bir ilişkim ve çıkar çatışmam olmadığını; sonuçları yalnız teknik bulgulara dayanarak doğru ve eksiksiz raporlayacağımı beyan ederim.";

  var PLANLAR = [
    { id: 1, no: "P-0926-031", ad: "Merkez Fabrika", musteri: "Ada Makina San. ve Tic. A.Ş.", adres: "Organize Sanayi Bölgesi 4. Cadde No: 12", ilce: "Gebze", il: "Kocaeli", tarih: "2026-09-23", bas: "09:00", bit: "12:30", ekip: ["mk", "ea"], m: 8, e: 4, yeni: 2, disarida: 2, durum: "denetimde", acildi: "2026-09-15T10:12", kabul: "2026-09-16T08:31", basladi: "2026-09-23T09:04", isg: { no: "S-2026-0412", onay: "2026-09-16" }, rap: { onayda: 3, taslak: 7 }, aciklama: "Kompresör odasına giriş için tesis güvenliğinden refakat istenecek." },
    { id: 2, no: "P-0926-034", ad: "Depo 2", musteri: "Yıldız Ambalaj A.Ş.", adres: "Liman Caddesi No: 7", ilce: "Tuzla", il: "İstanbul", tarih: "2026-09-23", bas: "14:00", bit: "17:00", ekip: ["mk"], m: 5, e: 0, durum: "bekliyor", acildi: "2026-09-17T11:40", isg: { no: "S-2026-0431", onay: "2026-09-19" } },
    { id: 3, no: "P-0926-036", ad: "Aktarma Merkezi ve Soğuk Hava Deposu", musteri: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", adres: "Sanayi Caddesi No: 48, Aktarma Merkezi Girişi", ilce: "Çorlu", il: "Tekirdağ", tarih: "2026-09-24", bas: "08:30", bit: "16:30", ekip: ["mk", "ea", "bs"], m: 14, e: 6, disarida: 1, durum: "bekliyor", acildi: "2026-09-18T09:05", isg: { no: "S-2026-0440", onay: "2026-09-15" } },
    { id: 4, no: "P-0926-038", ad: "Boyahane", musteri: "Mavi Tekstil Ltd.", adres: "Organize Sanayi Bölgesi 2. Sokak No: 5", ilce: "Çerkezköy", il: "Tekirdağ", tarih: "2026-09-25", bas: "09:00", bit: "13:00", ekip: ["mk", "ea"], m: 2, e: 7, durum: "bekliyor", acildi: "2026-09-19T14:22", isg: { no: "S-2026-0447", onay: "2026-09-25" }, eksik: "İSG-KATİP onayı 25 Eyl'de verilmiş; en geç 24 Eyl olmalı." },
    { id: 5, no: "P-0926-039", ad: "Döküm Hattı", musteri: "Akın Döküm San. Ltd.", adres: "Demir Çelik Caddesi No: 21", ilce: "Dilovası", il: "Kocaeli", tarih: "2026-09-26", bas: "10:00", bit: "12:00", ekip: ["mk"], m: 3, e: 0, durum: "bekliyor", acildi: "2026-09-20T10:48", isg: null, eksik: "Bu tesis için İSG-KATİP kaydı yok." },
    { id: 6, no: "P-0926-035", ad: "Üretim Tesisi", musteri: "Ege Plastik A.Ş.", adres: "Organize Sanayi Bölgesi 1. Kısım No: 9", ilce: "Yunusemre", il: "Manisa", tarih: "2026-09-29", bas: "09:00", bit: "15:00", ekip: ["mk", "ea"], m: 7, e: 3, durum: "kabul", acildi: "2026-09-17T15:30", kabul: "2026-09-18T09:12", isg: { no: "S-2026-0436", onay: "2026-09-20" } },
    { id: 7, no: "P-0926-037", ad: "Şantiye Deposu", musteri: "Kaya Yapı Malzemeleri Ltd.", adres: "Çevre Yolu Caddesi No: 3", ilce: "Başakşehir", il: "İstanbul", tarih: "2026-09-30", bas: "09:00", bit: "12:00", ekip: ["mk"], m: 2, e: 0, durum: "red", acildi: "2026-09-18T16:02", reddedildi: "2026-09-19T08:47", isg: { no: "S-2026-0444", onay: "2026-09-21" }, gerekce: "Aynı saatte başka tesiste denetimim var." },
    { id: 8, no: "P-0926-028", ad: "Soğuk Hava Deposu", musteri: "Deniz Gıda Ltd.", adres: "Liman Yolu No: 15", ilce: "Pendik", il: "İstanbul", tarih: "2026-09-22", bas: "09:00", bit: "11:30", ekip: ["mk"], m: 4, e: 0, durum: "tamam", acildi: "2026-09-10T13:15", kabul: "2026-09-11T08:05", basladi: "2026-09-22T09:02", bitti: "2026-09-22T11:52", isg: { no: "S-2026-0405", onay: "2026-09-12" }, rap: { onayda: 3, taslak: 1 } },
    { id: 9, no: "P-0926-025", ad: "Değirmen", musteri: "Başak Un Değirmenleri A.Ş.", adres: "İstasyon Caddesi No: 30", ilce: "Lüleburgaz", il: "Kırklareli", tarih: "2026-09-21", bas: "13:00", bit: "16:00", ekip: ["mk", "ea"], m: 16, e: 8, durum: "tamam", acildi: "2026-09-08T10:30", kabul: "2026-09-09T07:58", basladi: "2026-09-21T13:05", bitti: "2026-09-21T16:20", isg: { no: "S-2026-0398", onay: "2026-09-10" }, rap: { onaylandi: 14, onayda: 8 } }
  ];

  /* ── NUMARA SİSTEMİ (pkproje.md §3.5, reisim kararı 2026-09-23) ────────────────────────────────────────
     Proje no  P-AAYY-SIRA        · planın açıldığı ay+yıl · SIRA firmada o ayın kaçıncı planı · sunucu verir.
     Rapor no  XX-AAYY-SIRA-EK    · XX firma kısa kodu · raporun açıldığı ay+yıl · SIRA firmada kesintisiz · EK 5 hane rasgele.
     Ekipman   personel girer      · A–Z, 0–9, tire; 3–20 hane · FİRMADA eşsiz · çakışırsa kayıt yok · yalnız yönetici değiştirir. */
  var raporSira = 760, eskiSira = 402;
  var ek = function (n) { return ("0000" + ((Math.imul(n, 2654435761) >>> 0) % 1048576).toString(16)).slice(-5); };
  var raporNo = function (aayy, sira) { return FIRMA_KOD + "-" + aayy + "-" + sira + "-" + ek(sira * 7 + 3); };

  /* Firma geneli ekipman sicili (modül 7): kod → kayıt. Plan yalnız KODLARI tutar; ekipman tesise aittir, kalıcıdır. */
  var SICIL = {};
  var kodSira = 1001;
  PLANLAR.forEach(function (p) {
    p.ekp = []; p.sonradan = []; p.rapor = []; p.gecmis = [];
    var toplam = p.m + p.e, yeni = p.yeni || 0, gun = p.tarih.slice(8, 10);
    for (var i = 0; i < toplam + (p.disarida || 0); i++) {
      var b = i < p.m ? "m" : i < toplam ? "e" : "m", havuz = b === "m" ? MEK : ELK, j = b === "m" ? i : i - p.m;
      var tur = havuz[j % havuz.length], konum = KONUM[(i + p.id) % KONUM.length];
      var ilk = i >= toplam - yeni && i < toplam;   /* bu planda ilk kez kaydedilenler: önceki kontrolü yok */
      var onceki = ilk ? null : { tarih: "2025-09-" + gun, sonuc: SONUC[(i + p.id) % SONUC.length], rapor: raporNo("0925", eskiSira++) };
      var kod = tur.k + "-" + (kodSira++);
      SICIL[kod] = { kod: kod, tur: tur, konum: konum, tesis: p.id, onceki: onceki, eklendi: ilk ? "2026-09-23T09:" + (18 + i) : null };
      if (i < toplam) { p.ekp.push(kod); if (ilk) p.sonradan.push(kod); }   /* toplamın ötesi: tesiste kayıtlı, plana alınmamış */
    }
  });
  /* raporlar oluşturulma sırasıyla (21 → 22 → 23 Eyl) numaralanır: sıra firmada kesintisiz artar */
  [9, 8, 1].forEach(function (id) {
    var p = PLANLAR.filter(function (x) { return x.id === id; })[0], dagilim = [];
    ["onaylandi", "onayda", "taslak"].forEach(function (d) { for (var k = 0; k < (p.rap[d] || 0); k++) dagilim.push(d); });
    dagilim.forEach(function (d, k) {
      var dak = 10 + k * 6, saat = p.basladi.slice(0, 11) + ("0" + (+p.basladi.slice(11, 13) + Math.floor(dak / 60))).slice(-2) + ":" + ("0" + (dak % 60)).slice(-2);
      p.rapor.push({ no: raporNo("0926", raporSira++), kod: p.ekp[k], durum: d, olustu: saat, sonuc: d === "taslak" ? null : SONUC[(k + id) % SONUC.length] });
    });
  });
  /* Hareket kaydı (reisim: "istediği zaman istediği tepkiyi verebilsin, bu hareketler kayıt altında kalsın") */
  function kaydet(p, zaman, kim, ne, ayrinti) { p.gecmis.push({ z: zaman, kim: kim, ne: ne, ayrinti: ayrinti || "", s: p.gecmis.length }); }
  PLANLAR.forEach(function (p) {
    kaydet(p, p.acildi, "za", "Plan açıldı", p.ekp.length - p.sonradan.length + " ekipman · " + p.ekip.map(function (k) { return KISI[k].ad; }).join(", "));
    if (p.kabul) kaydet(p, p.kabul, BEN, "Plan kabul edildi", "Tarafsızlık beyanı onaylandı");
    if (p.reddedildi) kaydet(p, p.reddedildi, BEN, "Plan reddedildi", "Gerekçe: " + p.gerekce);
    if (p.basladi) kaydet(p, p.basladi, BEN, "Denetime başlandı");
    p.sonradan.forEach(function (k) { var e = SICIL[k]; kaydet(p, e.eklendi, BEN, "Ekipman eklendi", k + " · " + e.tur.ad); });
    p.rapor.forEach(function (r) { kaydet(p, r.olustu, BEN, "Rapor oluşturuldu", r.no + " · " + r.kod); });
    if (p.bitti) kaydet(p, p.bitti, BEN, "Plan tamamlandı");
  });
  kaydet(PLANLAR[0], "2026-09-22T15:20", "za", "Not", "Tesis 12:00–13:00 arası öğle arası veriyor; bu saatte üretim holüne girilmiyor.");

  var DURUM = {
    bekliyor: { ad: "Kabul bekliyor", rozet: "a-rozet-bekliyor", sira: 0 },
    kabul: { ad: "Kabul edildi", rozet: "a-rozet-kabul", sira: 1 },
    denetimde: { ad: "Denetimde", rozet: "a-rozet-denetimde", sira: 2 },
    tamam: { ad: "Tamamlandı", rozet: "a-rozet-tamam", sira: 3 },
    red: { ad: "Reddedildi", rozet: "a-rozet-red", sira: 4 }
  };
  var RAPOR = {
    taslak: { ad: "Taslak", rozet: "a-rozet-bekliyor" },
    onayda: { ad: "Onayda", rozet: "a-rozet-kabul" },
    onaylandi: { ad: "Onaylandı", rozet: "a-rozet-tamam" },
    yok: { ad: "Rapor yok", rozet: "a-rozet-notr" }
  };

  /* ortak üreticiler (docs/assets/maket-ortak.js) — yerel adlar aynı kalsın diye */
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, gunYaz = MK.gunYaz, gunKisa = MK.gunKisa, ayYil = MK.ayYil, zamanYaz = MK.zamanYaz;
  var simdi = MK.simdi, tr = MK.tr, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, serit = MK.serit, SZ = MK.SZ;
  var bul = function (id) { return PLANLAR.filter(function (x) { return x.id === id; })[0]; };
  var bransAd = function (b) { return b === "m" ? "Mekanik" : "Elektrik"; };
  var raporuVar = function (p, kod) { return p.rapor.filter(function (r) { return r.kod === kod; })[0]; };
  var calisir = function (p) { return p.durum === "denetimde" || p.durum === "tamam"; };   /* rapor oluşturulabilir */

  var q = new URLSearchParams(location.search);
  var VERI = q.get("veri") || "dolu";
  var AKTIF = null;   /* açık plan (plan içi süzgeçleri bu plana bakar) */
  var NOTLAR_ACIK = false;

  /* ══ SÜZGEÇ TANIMLARI (üretici ortak: kalıp 15) ═══════════════════════════════════════════════════════════
     Üç süzgeç: l = Planlar listesi · e = plan içi ekipmanlar · r = plan içi raporlar. */
  var CIP_L = [
    { k: "bekliyor", ad: "Kabul bekliyor", grup: "durum", test: function (p) { return p.durum === "bekliyor"; } },
    { k: "kabul", ad: "Kabul edildi", grup: "durum", test: function (p) { return p.durum === "kabul"; } },
    { k: "denetimde", ad: "Denetimde", grup: "durum", test: function (p) { return p.durum === "denetimde"; } },
    { k: "tamam", ad: "Tamamlandı", grup: "durum", test: function (p) { return p.durum === "tamam"; } },
    { k: "red", ad: "Reddedildi", grup: "durum", test: function (p) { return p.durum === "red"; } },
    { k: "eksik", ad: "Ön koşul eksik", test: function (p) { return p.durum === "bekliyor" && !!p.eksik; } }
  ];
  var CIP_E = [
    { k: "raporsuz", ad: "Raporu yok", grup: "rapor", test: function (e) { return !raporuVar(AKTIF, e.kod); } },
    { k: "raporlu", ad: "Raporu var", grup: "rapor", test: function (e) { return !!raporuVar(AKTIF, e.kod); } },
    { k: "sonradan", ad: "Denetimde eklendi", test: function (e) { return AKTIF.sonradan.indexOf(e.kod) >= 0; } },
    { k: "kusur", ad: "Önceki kontrolde kusur", test: function (e) { return !!e.onceki && e.onceki.sonuc !== "Uygun"; } }
  ];
  var CIP_R = [
    { k: "taslak", ad: "Taslak", grup: "durum", test: function (r) { return r.durum === "taslak"; } },
    { k: "onayda", ad: "Onayda", grup: "durum", test: function (r) { return r.durum === "onayda"; } },
    { k: "onaylandi", ad: "Onaylandı", grup: "durum", test: function (r) { return r.durum === "onaylandi"; } }
  ];
  /* Sıralama (yalnız Planlar): tabloda sütun başlığı, kart kipinde "Sıralama" seçicisi; ikisi de aynı değeri yazar. */
  var SIRA_ANAHTAR = {
    no: function (p) { return p.no; }, ad: function (p) { return p.ad; }, musteri: function (p) { return p.musteri; },
    adres: function (p) { return p.il + " " + p.ilce + " " + p.adres; }, ekip: function (p) { return KISI[p.ekip[0]].ad; },
    baslangic: function (p) { return p.tarih + " " + p.bas; }, durum: function (p) { return DURUM[p.durum].sira; }
  };
  var SIRA_AD = { no: "Proje no", ad: "Proje adı", musteri: "Müşteri", adres: "Adres", ekip: "Inspector", baslangic: "Başlangıç", durum: "Durum" };
  function siraEtiket(v) {
    if (v === "varsayilan") return "Açık işler önce";
    var x = v.split("-"), artan = x[1] === "artan";
    var yon = x[0] === "baslangic" ? (artan ? "yakın → uzak" : "uzak → yakın") : x[0] === "no" ? (artan ? "küçükten büyüğe" : "büyükten küçüğe")
      : x[0] === "durum" ? (artan ? "akış sırası" : "ters akış") : (artan ? "A → Z" : "Z → A");
    return SIRA_AD[x[0]] + ": " + yon;
  }
  var SIRA_TEMEL = ["varsayilan", "baslangic-artan", "baslangic-azalan", "musteri-artan", "no-artan"];
  var SEC_L = [
    { k: "tarih", ad: "Tarih", secenek: function () { return [["tumu", "Tümü"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["yedi", "Önümüzdeki 7 gün"]]; },
      gecer: function (p, v) { return v === "tumu" || (v === "bugun" ? p.tarih === BUGUN : v === "hafta" ? p.tarih >= HAFTA[0] && p.tarih <= HAFTA[1] : p.tarih >= YEDI[0] && p.tarih <= YEDI[1]); } },
    { k: "musteri", ad: "Müşteri", secenek: function () {
      return [["tumu", "Tümü"]].concat(PLANLAR.map(function (p) { return p.musteri; }).filter(function (v, i, a) { return a.indexOf(v) === i; })
        .sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (m) { return [m, m]; }));
    }, gecer: function (p, v) { return v === "tumu" || p.musteri === v; } },
    { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; }, gecer: function (p, v) { return v === "tumu" || !!p[v]; } },
    /* süzgeç değil sıralama: Temizle ve süzgeç rozeti saymaz; satırda yalnız kart kipinde görünür */
    { k: "sira", ad: "Sıralama", siralama: true, secenek: function () {
      var v = SZ.l.sec.sira, l = SIRA_TEMEL.indexOf(v) < 0 ? SIRA_TEMEL.concat([v]) : SIRA_TEMEL;
      return l.map(function (x) { return [x, siraEtiket(x)]; });
    }, gecer: function () { return true; } }
  ];
  var SEC_E = [
    { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; }, gecer: function (e, v) { return v === "tumu" || e.tur.b === v; } },
    { k: "tur", ad: "Tür", secenek: function () {
      return [["tumu", "Tümü"]].concat(AKTIF.ekp.map(function (k) { return SICIL[k].tur.ad; }).filter(function (v, i, a) { return a.indexOf(v) === i; })
        .sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (x) { return [x, x]; }));
    }, gecer: function (e, v) { return v === "tumu" || e.tur.ad === v; } }
  ];
  MK.suzgecTanimla("l", { ad: "Planlarda ara", ipucu: "Proje, müşteri, il", birim: "plan", cipler: CIP_L, seciciler: SEC_L,
    metin: function (p) { return [p.no, p.ad, p.musteri, p.adres, p.ilce, p.il].join(" "); },
    imkansiz: "Bir plan aynı anda iki durumda olamaz" }, function () { ciz(); });
  MK.suzgecTanimla("e", { ad: "Ekipmanlarda ara", ipucu: "Kod, tür, konum", birim: "ekipman", cipler: CIP_E, seciciler: SEC_E, sayfa: SAYFA.e,
    metin: function (e) { return [e.kod, e.tur.ad, e.konum].join(" "); },
    imkansiz: "Bir ekipmanın raporu hem var hem yok olamaz" }, function () { listeCiz("e"); });
  MK.suzgecTanimla("r", { ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", cipler: CIP_R, seciciler: [], sayfa: SAYFA.r,
    metin: function (r) { return [r.no, r.kod, SICIL[r.kod].tur.ad].join(" "); },
    imkansiz: "Bir rapor aynı anda iki durumda olamaz" }, function () { listeCiz("r"); });

  function tus(eylem, p, ad, ik, kapali, sinif, sebepId) {
    return MK.tus({ eylem: eylem, ad: ad, ikon: ik, kapali: kapali, sinif: sinif, sebepId: sebepId, veri: { id: p.id } });
  }
  /* Planlar'a özgü boş durumlar; süzgeç boş / imkânsız ortak üreticiden (MK.bosSuzgec) */
  function bos(tur) {
    var d = {
      yok: { ikon: "inbox", baslik: "Atanmış plan yok", metin: "Planlama ekibi plan açınca burada görünür." },
      hata: { ikon: "refresh-cw", hata: true, baslik: "Planlar yüklenemedi", metin: "Sunucuya bağlanılamadı; liste eski hâliyle gösterilmiyor.", eylem: '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>" },
      plan: { ikon: "circle-alert", baslik: "Plan bulunamadı", metin: "Bu adresteki plan listede yok ya da artık size atanmış değil.", eylem: '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlara dön</a>" },
      /* yükleme hatasında "bulunamadı" denmez — plan var olabilir, yüklenemedi (anayasa 2.8 dürüstlük) */
      planHata: { ikon: "refresh-cw", hata: true, baslik: "Plan yüklenemedi", metin: "Sunucuya bağlanılamadı; plan eski hâliyle gösterilmiyor.", eylem: '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>" }
    }[tur];
    return MK.bos(d);
  }

  /* ── PLANLAR LİSTESİ ────────────────────────────────────────────────────────────────────────────── */
  function sirala(l) {
    var v = SZ.l.sec.sira, zaman = function (p) { return p.tarih + " " + p.bas; };
    if (v === "varsayilan") {   /* açık işler (bekliyor, kabul, denetimde) başlangıca göre ileri; kapanmışlar en yeni önce, sonda */
      var acik = function (p) { return p.durum === "bekliyor" || p.durum === "kabul" || p.durum === "denetimde"; };
      return l.slice().sort(function (a, b) {
        if (acik(a) !== acik(b)) return acik(a) ? -1 : 1;
        var c = zaman(a).localeCompare(zaman(b)); return acik(a) ? c : -c;
      });
    }
    var x = v.split("-"), f = SIRA_ANAHTAR[x[0]], yon = x[1] === "azalan" ? -1 : 1;
    return l.slice().sort(function (a, b) {
      var u = f(a), w = f(b), c = typeof u === "number" ? u - w : String(u).localeCompare(String(w), "tr");
      return c * yon || zaman(a).localeCompare(zaman(b));
    });
  }
  function ekipHtml(p) {
    var tam = p.ekip.map(function (k) { return KISI[k].ad + " (" + KISI[k].brans + ")"; }).join(" · ");
    var fazla = p.ekip.length > 2 ? ' <span class="a-ekip-fazla">+' + (p.ekip.length - 2) + "</span>" : "";
    var adlar = p.ekip.slice(0, 2).map(function (k, i) { return '<span class="a-ekip-ad">' + KISI[k].ad + (i === 1 ? fazla : "") + "</span>"; }).join("");
    return '<span class="a-hucre-satir" title="' + kacis(tam) + '">' + ikon("users", "a-ikon-kucuk a-kart-ikon") + '<span class="a-ekip">' + adlar + "</span></span>";
  }
  /* Satırda TEK eylem tuşu: Kabul et → Denetime başla → Devam et. Denetime başla tarihe bağlı değil (reisim 10);
     Kabul et'in İSG-KATİP ön koşulu durur (reisim 24: öneri kabul). */
  function listeEylem(p) {
    var t = "", not = "", sid = "a-sebep-" + p.id;
    if (p.durum === "bekliyor") {
      t = tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
      if (p.eksik) not = '<div class="a-sebep" id="' + sid + '">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(p.eksik) + "</span></div>";
    } else if (p.durum === "kabul") t = tus("basla", p, "Denetime başla", "play");
    else if (p.durum === "denetimde") t = tus("devam", p, "Devam et", "arrow-right");
    else if (p.durum === "red") not = '<div class="a-not">Gerekçe: ' + kacis(p.gerekce || "") + "</div>";
    if (!t && !not) return "";
    return '<div class="a-eylem">' + (t ? '<div class="a-eylem-tuslar">' + t + "</div>" : "") + not + "</div>";
  }
  var PLAN_SUTUN = [
    { k: "no", baslik: "Proje no", kart: "ust", sira: 1, hucre: function (p) { return '<a class="a-no" href="#/plan/' + p.id + '">' + p.no + "</a>"; } },
    { k: "ad", baslik: "Proje adı", kart: "govde", sira: 2, hucre: function (p) { return kirp(p.ad, "a-proje-ad"); } },
    { k: "musteri", baslik: "Müşteri", kart: "govde", sira: 4, hucre: function (p) { return '<span class="a-hucre-satir">' + ikon("building-2", "a-ikon-kucuk a-kart-ikon") + kirp(p.musteri) + "</span>"; } },
    { k: "adres", baslik: "Adres", kart: "govde", sira: 5, hucre: function (p) {
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' +
        kirp(p.adres, "a-adres-sokak", p.adres + ", " + p.ilce + " / " + p.il) + '<span class="a-adres-il">' + p.ilce + " / " + p.il + "</span></span></span>";
    } },
    { k: "ekip", baslik: "Inspector", kart: "govde", sira: 6, hucre: ekipHtml },
    { k: "baslangic", baslik: "Başlangıç", kart: "govde", sira: 3, hucre: function (p) {
      return '<span class="a-tarih-gun">' + gunYaz(p.tarih) + (p.tarih === BUGUN ? ' <span class="a-bugun">Bugün</span>' : "") + "</span>" +
        '<span class="a-tarih-saat">' + p.bas + " – " + p.bit + "</span>";
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) { return rozet(DURUM[p.durum]); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: listeEylem }
  ];
  function menuSayi() { MK.menuSayi(13, VERI === "dolu" ? PLANLAR.filter(function (p) { return p.durum === "bekliyor"; }).length : 0); }
  function ciz() {
    var hepsi = VERI === "dolu" ? PLANLAR : [], tb = MK.taban("l", hepsi), liste = sirala(tb.filter(function (p) { return MK.cipGecer("l", p); }));
    MK.cipCiz("l", tb); menuSayi();
    if (VERI === "hata") { $("a-sayac").innerHTML = "—"; $("a-liste").innerHTML = bos("hata"); return; }
    $("a-sayac").innerHTML = MK.sayac("l", liste.length, hepsi.length);
    if (!hepsi.length) { $("a-liste").innerHTML = bos("yok"); return; }
    if (!liste.length) { $("a-liste").innerHTML = MK.bosSuzgec("l"); return; }
    $("a-liste").innerHTML = MK.tablo({ baslik: "Planlar", sinif: "a-tablo-plan", sutunlar: PLAN_SUTUN, kayitlar: liste, sz: "l",
      href: function (p) { return "#/plan/" + p.id; } });
    MK.listeKipi("l", "a-liste");
  }

  /* ══ PLAN İÇİ — AKIŞ (4. tur) ════════════════════════════════════════════════════════════════════════
     Dört adım: Planlandı → Kabul → Denetim → Tamamlama. Adım durumu: tamam (✓) · aktif (şu an) · bekliyor (sırada) ·
     red. Her adım kim + ne zaman gösterir; iş adımın içinde yapılır. Masaüstü ve tablette tuşlar adımın içinde,
     telefonda aynı tuşlar altta yapışkan çubukta (kalıp 2). Tek birincil tuş (anayasa 2.7). */
  function planEylem(p) {   /* şu anki adımın tuşları — adımda ve telefonun alt çubuğunda aynı üretici */
    var sid = "a-plan-sebep-" + p.id;
    if (p.durum === "bekliyor") return tus("reddet", p, "Reddet", "", false, "a-tus-ikincil") + tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
    if (p.durum === "kabul") return tus("basla", p, "Denetime başla", "play");
    if (p.durum === "denetimde") return tus("tamamla", p, "Tamamla", "circle-check");
    if (p.durum === "tamam") return tus("geri-al", p, "Tamamlamayı geri al", "undo-2", false, "a-tus-ikincil");
    return "";
  }
  function adim(no, durum, baslik, ozet, icerik) {
    var etiket = { tamam: "Tamamlandı", aktif: "Şu an", bekliyor: "Sırada", red: "Reddedildi" }[durum];
    return '<li class="a-adim a-adim-' + durum + '"' + (durum === "aktif" ? ' aria-current="step"' : "") + '><div class="a-adim-isaret" aria-hidden="true">' +
      (durum === "tamam" ? ikon("check", "a-ikon-kucuk") : durum === "red" ? ikon("x", "a-ikon-kucuk") : no) + "</div>" +
      '<div class="a-adim-govde"><div class="a-adim-bas"><h2 class="a-adim-baslik">' + baslik + '</h2><span class="a-adim-durum">' + etiket + "</span>" +
      (ozet ? '<span class="a-adim-ozet">' + ozet + "</span>" : "") + "</div>" + (icerik ? '<div class="a-adim-icerik">' + icerik + "</div>" : "") + "</div></li>";
  }
  var kimZaman = function (z, k) { return zamanYaz(z) + " · " + KISI[k].ad + ' <span class="a-gecmis-rol">' + KISI[k].rol + "</span>"; };
  var KAPSAM_SUTUN = [
    { k: "tur", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: function (x) { return '<span class="a-ekipman-ad">' + x.ad + "</span>"; } },
    { k: "brans", baslik: "Branş", kart: "rozet", sira: 1, hucre: function (x) { return '<span class="a-hucre-satir">' + ikon(x.b === "m" ? "cog" : "zap", "a-ikon-kucuk") + bransAd(x.b) + "</span>"; } },
    { k: "planlanan", baslik: "Planlanan", kart: "govde", sira: 2, hucre: function (x) { return '<span class="a-sayi"><span class="a-kart-etiket">Planlanan</span>' + x.planlanan + "</span>"; } },
    { k: "planda", baslik: "Planda", kart: "govde", sira: 3, hucre: function (x) { return '<span class="a-sayi"><span class="a-kart-etiket">Planda</span>' + x.planda + (x.planda > x.planlanan ? ' <span class="a-rozet a-rozet-yeni">+' + (x.planda - x.planlanan) + "</span>" : "") + "</span>"; } }
  ];
  function kapsam(p) {
    var g = {};
    p.ekp.forEach(function (k) { var t = SICIL[k].tur; g[t.k] = g[t.k] || { ad: t.ad, b: t.b, planlanan: 0, planda: 0 }; g[t.k].planda++; if (p.sonradan.indexOf(k) < 0) g[t.k].planlanan++; });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.b === b.b ? a.ad.localeCompare(b.ad, "tr") : a.b === "m" ? -1 : 1; });
  }
  function oncekiHtml(e) {
    if (!e.onceki) return '<span class="a-ilk">İlk kontrol</span>';
    var sinif = e.onceki.sonuc === "Uygun" ? "" : e.onceki.sonuc === "Kusurlu" ? " a-sonuc-hata" : " a-sonuc-uyari";
    return '<span class="a-kart-etiket">Önceki kontrol</span><span class="a-onceki' + sinif + '" title="' + e.onceki.rapor + '">' + ayYil(e.onceki.tarih) + " · " + e.onceki.sonuc + "</span>";
  }
  function ekpSutun(p) {
    return [
      { k: "kod", baslik: "Kod", kart: "ust", sira: 1, hucre: function (e) { return '<span class="a-kod">' + e.kod + "</span>" + (e.eklendi ? ' <span class="a-rozet a-rozet-yeni">Yeni</span>' : ""); } },
      { k: "tur", baslik: "Ekipman türü", kart: "govde", sira: 2, hucre: function (e) { return kirp(e.tur.ad, "a-ekipman-ad"); } },
      { k: "konum", baslik: "Konum", kart: "govde", sira: 3, hucre: function (e) { return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + kirp(e.konum) + "</span>"; } },
      { k: "brans", baslik: "Branş", kart: "govde", sira: 4, hucre: function (e) { return '<span class="a-hucre-satir">' + ikon(e.tur.b === "m" ? "cog" : "zap", "a-ikon-kucuk") + bransAd(e.tur.b) + "</span>"; } },
      { k: "onceki", baslik: "Önceki kontrol", kart: "govde", sira: 5, hucre: oncekiHtml },
      { k: "rapor", baslik: "Rapor", kart: "rozet", sira: 1, hucre: function (e) { var r = raporuVar(p, e.kod); return rozet(r ? RAPOR[r.durum] : RAPOR.yok); } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (e) {
        if (!calisir(p) || raporuVar(p, e.kod)) return "";
        return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="rapor-olustur" data-id="' + p.id + '" data-kod="' + e.kod + '">' +
          ikon("file-plus", "a-ikon-kucuk") + "Rapor oluştur</button></div></div>";
      } }
    ];
  }
  var RAP_SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<span class="a-rapor-no">' + r.no + "</span>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { return '<span class="a-hucre-satir"><span class="a-kod">' + r.kod + "</span>" + kirp(SICIL[r.kod].tur.ad) + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "govde", sira: 3, hucre: function (r) {
      var s = r.sonuc; return '<span class="a-kart-etiket">Sonuç</span>' + (s ? '<span class="a-onceki' + (s === "Uygun" ? "" : s === "Kusurlu" ? " a-sonuc-hata" : " a-sonuc-uyari") + '">' + s + "</span>" : '<span class="a-alt-satir">—</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(RAPOR[r.durum]); } },
    { k: "olustu", baslik: "Oluşturuldu", kart: "govde", sira: 4, hucre: function (r) { return '<span class="a-tarih-saat">' + zamanYaz(r.olustu) + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
      var d = r.durum === "taslak" ? ["pencil", "Raporu düzenle"] : ["file-text", "Raporu aç"];
      return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Saha rapor ekranı">' +
        ikon(d[0], "a-ikon-kucuk") + d[1] + "</button></div></div>";
    } }
  ];
  function listeCiz(on) {   /* yalnız liste, çipler, sayaç ve sayfalayıcı çizilir; arama kutusu yerinde kalır (odak çalınmaz) */
    var p = AKTIF; if (!p || !MK.kap(on)) return;
    var hepsi = on === "e" ? p.ekp.map(function (k) { return SICIL[k]; }) : p.rapor.slice().sort(function (a, b) { return a.olustu < b.olustu ? 1 : a.olustu > b.olustu ? -1 : 0; });
    MK.listeCiz({ on: on, kayitlar: hepsi, sayacId: "a-sayac-" + on, listeId: "a-liste-" + on, sayfaId: "a-sayfa-" + on,
      bosVeri: '<p class="a-bos-satir">' + (on === "r" ? (calisir(p) ? "Bu planda henüz rapor yok. Rapor, ekipmanın satırındaki “Rapor oluştur” ile açılır." : "Rapor, denetime başlanınca ekipmanın satırından oluşturulur.") : "Bu planda ekipman yok.") + "</p>",
      tablo: { baslik: on === "e" ? "Plandaki ekipmanlar" : "Bu plandaki raporlar", sinif: on === "e" ? "a-tablo-ekipman" : "a-tablo-rapor", sutunlar: on === "e" ? ekpSutun(p) : RAP_SUTUN } });
  }
  /* eklenen ekipman sayfalı listede görünsün: bulunduğu sayfaya geçilir; süzgeç gizliyorsa bildirim söyler (anayasa 2.8) */
  function kaydaGit(kod) {
    var liste = MK.taban("e", AKTIF.ekp.map(function (k) { return SICIL[k]; })).filter(function (e) { return MK.cipGecer("e", e); });
    var i = liste.map(function (e) { return e.kod; }).indexOf(kod);
    if (i >= 0) SZ.e.sayfa = Math.floor(i / SAYFA.e) + 1;
    return i >= 0;
  }
  function planCiz(p) {
    menuSayi();
    if (!p) { AKTIF = null; $("a-plan").innerHTML = '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlar</a></nav>" +
      '<h1 class="a-gizli" tabindex="-1">' + (VERI === "hata" ? "Plan yüklenemedi" : "Plan bulunamadı") + "</h1>" + bos(VERI === "hata" ? "planHata" : "plan"); return; }
    if (!AKTIF || AKTIF.id !== p.id) { MK.suzgecSifirla("e"); MK.suzgecSifirla("r"); NOTLAR_ACIK = false; }   /* başka plana geçince süzgeçler sıfırlanır */
    AKTIF = p;
    var d = p.durum, eylem = planEylem(p), sid = "a-plan-sebep-" + p.id;
    var isg = !p.isg ? '<span class="a-yuz-uyari">Kayıt yok</span>' : kacis(p.isg.no) + ' <span class="a-alt-inline' + (p.eksik ? " a-yuz-uyari" : "") + '">· onay ' + gunKisa(p.isg.onay) + "</span>";
    var raporsuz = p.ekp.filter(function (k) { return !raporuVar(p, k); }).length;
    /* 1 · Planlandı — plan bilgisi ve kapsam */
    var a1 = adim(1, "tamam", "Planlandı", kimZaman(p.acildi, "za"),
      '<dl class="a-bilgi">' +
        bilgi("Proje no", '<span class="a-kod">' + p.no + "</span>") +
        bilgi("Başlangıç", gunYaz(p.tarih) + " · " + p.bas + " – " + p.bit + (p.tarih === BUGUN ? ' <span class="a-bugun">Bugün</span>' : ""), true) +
        bilgi("Adres", kacis(p.adres) + ", " + p.ilce + " / " + p.il, true) +
        bilgi("Inspector", p.ekip.map(function (k) { return KISI[k].ad + ' <span class="a-alt-inline">' + KISI[k].brans + "</span>"; }).join(" · "), true) +
        bilgi("İSG-KATİP", isg) +
        bilgi("Açıklama", p.aciklama ? kacis(p.aciklama) : '<span class="a-alt-inline">—</span>', true) +
      "</dl>" +
      /* kapsam: kabul bekleyen planda AÇIK (inspector kabulden önce görür), sonra katlı — asıl iş Denetim adımında */
      '<details class="a-ayrinti a-kapsam"' + (d === "bekliyor" ? " open" : "") + "><summary>Kapsam · " + kapsam(p).length + " tür, " + p.ekp.length + " ekipman</summary>" +
        '<div class="a-liste-kap">' + MK.tablo({ baslik: "Plan kapsamı", sinif: "a-tablo-kapsam", sutunlar: KAPSAM_SUTUN, kayitlar: kapsam(p) }) + "</div></details>");
    /* 2 · Kabul (tarafsızlık beyanı) */
    var a2;
    if (d === "bekliyor") a2 = adim(2, "aktif", "Kabul", "",
      '<blockquote class="a-beyan"><p class="a-beyan-baslik">Tarafsızlık ve çıkar çatışması beyanı</p><p>' + BEYAN + "</p></blockquote>" +
      (p.eksik ? serit("uyari", "triangle-alert", kacis(p.eksik), sid) : "") +
      '<div class="a-adim-eylem"><p class="a-adim-not">Kabul ederek bu beyanı onaylamış olursunuz.</p><div class="a-adim-tuslar">' + eylem + "</div></div>");
    else if (d === "red") a2 = adim(2, "red", "Kabul", kimZaman(p.reddedildi, BEN), serit("hata", "circle-x", "Gerekçe: " + kacis(p.gerekce || "")));
    else a2 = adim(2, "tamam", "Kabul", kimZaman(p.kabul, BEN),
      '<details class="a-ayrinti"><summary>Tarafsızlık beyanı onaylandı · beyanı gör</summary><blockquote class="a-beyan"><p>' + BEYAN + "</p></blockquote></details>");
    /* 3 · Denetim — kontrol listesi: ekipmanlar + raporlar (süzgeçli, 10'ar sayfalı) */
    var a3durum = d === "tamam" ? "tamam" : (d === "kabul" || d === "denetimde") ? "aktif" : "bekliyor";
    var a3ozet = p.basladi ? (d === "tamam" ? zamanYaz(p.basladi) + " – " + zamanYaz(p.bitti).slice(-5) : "Başladı: " + zamanYaz(p.basladi)) : "";
    var kontrol = "";
    if (d === "kabul" || calisir(p)) kontrol =
      '<div class="a-alt-bolum"><div class="a-alt-bas"><h3 class="a-alt-baslik" id="a-ekipman-baslik">Ekipmanlar</h3><span class="a-sayac" id="a-sayac-e"></span>' +
        (d === "denetimde" ? '<button class="a-tus a-tus-ikincil a-bolum-tus" type="button" data-eylem="ekle-ac" data-id="' + p.id + '">' + ikon("plus", "a-ikon-kucuk") + "Ekipman ekle</button>" : "") +
        "</div>" + MK.suzgecHtml("e") + '<div class="a-liste-kap" id="a-liste-e"></div><div id="a-sayfa-e"></div></div>' +
      (calisir(p) ? '<div class="a-alt-bolum"><div class="a-alt-bas"><h3 class="a-alt-baslik" id="a-rapor-baslik">Raporlar</h3><span class="a-sayac" id="a-sayac-r"></span></div>' +
        MK.suzgecHtml("r") + '<div class="a-liste-kap" id="a-liste-r"></div><div id="a-sayfa-r"></div></div>' : "");
    var a3 = adim(3, a3durum, "Denetim", a3ozet,
      (d === "bekliyor" ? '<p class="a-adim-not">Plan kabul edilince başlar.</p>' : d === "red" ? '<p class="a-adim-not">Plan reddedildi; denetim yok.</p>' : "") +
      (d === "kabul" ? '<div class="a-adim-eylem"><p class="a-adim-not">Ekipman ekleme ve rapor oluşturma denetime başlayınca açılır.</p><div class="a-adim-tuslar">' + eylem + "</div></div>" : "") +
      kontrol);
    /* 4 · Tamamlama */
    var a4 = adim(4, d === "tamam" ? "tamam" : "bekliyor", "Tamamlama", d === "tamam" ? kimZaman(p.bitti, BEN) : "",
      d === "denetimde" ? '<div class="a-adim-eylem"><p class="a-adim-not">' + (raporsuz ? raporsuz + " ekipmanın bu planda raporu yok; tamamlamak engellenmez." : "Bütün ekipmanların raporu açıldı.") + '</p><div class="a-adim-tuslar">' + eylem + "</div></div>"
      : d === "tamam" ? '<div class="a-adim-eylem"><p class="a-adim-not">Raporlar düzenlenebilir; ekipman eklemek için tamamlama geri alınır.</p><div class="a-adim-tuslar">' + eylem + "</div></div>"
      : '<p class="a-adim-not">Denetim bitince buradan tamamlanır.</p>');
    /* Proje notları (5. tur, reisim: "hareketler kısmını kaldır"): hareket kaydı tutulmaya devam eder (p.gecmis, denetim
       izi) ama plan içinde gösterilmez; burada yalnız notlar. Kim yazar/görür: plandaki inspector'lar + planlama ekibi;
       müşteri görmez; not silinmez (karar 27). */
    var notlar = p.gecmis.filter(function (g) { return g.ne === "Not"; }).sort(function (a, b) { return a.z < b.z ? 1 : a.z > b.z ? -1 : b.s - a.s; });
    var gorunen = NOTLAR_ACIK ? notlar : notlar.slice(0, 6);
    $("a-plan").innerHTML =
      '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlar</a>" +
        ikon("chevron-right", "a-ikon-kucuk") + '<span aria-current="page">' + p.no + "</span></nav>" +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(DURUM[d]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(p.musteri) + "</span></p></div></div>" +
      '<ol class="a-akis" aria-label="Plan akışı">' + a1 + a2 + a3 + a4 + "</ol>" +
      '<section class="a-bolum a-notlar" aria-labelledby="a-not-baslik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-not-baslik">Proje notları</h2>' +
        '<span class="a-sayac"><b>' + notlar.length + "</b> not</span></div>" +
        '<div class="a-not-form"><label class="a-gizli" for="a-not-girdi">Proje notu</label><textarea class="a-alan a-alan-ince" id="a-not-girdi" maxlength="500" placeholder="Proje notu ekleyin" aria-describedby="a-not-ipucu"></textarea>' +
        '<button class="a-tus a-tus-ikincil" type="button" data-eylem="not-ekle" data-id="' + p.id + '" id="a-not-ekle" disabled>' + ikon("plus", "a-ikon-kucuk") + "Notu ekle</button></div>" +
        '<p class="a-ipucu a-not-ipucu" id="a-not-ipucu">Planlama ekibi ve plandaki inspector’lar görür; müşteri görmez. Not silinmez.</p>' +
        (notlar.length ? '<ol class="a-gecmis">' + gorunen.map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + zamanYaz(g.z) + '</span><span class="a-gecmis-ne"><b>' + KISI[g.kim].ad + "</b>" +
            ' <span class="a-gecmis-rol">' + KISI[g.kim].rol + '</span><span class="a-not-metin">' + kacis(g.ayrinti) + "</span></span></li>";
        }).join("") + "</ol>" : "") +
        (notlar.length > 6 ? '<button class="a-tus a-tus-ikincil a-hepsi-tus" type="button" data-eylem="notlar-hepsi">' + (NOTLAR_ACIK ? "Son 6 notu göster" : "Tümünü göster (" + notlar.length + ")") + "</button>" : "") +
      "</section>" +
      (eylem ? '<div class="a-eylem-cubugu a-eylem-cubugu-alt">' + eylem + "</div>" : "");
    ["e", "r"].forEach(function (on) { MK.suzgecKur(on); });
  }

  /* ── EKİPMAN EKLE PENCERESİ (3. tur; reisim 17–19 kabul: kod firma genelinde eşsiz, biçim serbest, yalnız yönetici değiştirir) ──
     İki yol: (1) tesiste KAYITLI ama plana alınmamış ekipmanı seç, (2) YENİ ekipman: kodu personel etiketten yazar.
     Kod: A–Z (Türkçe harf yok), 0–9, tire; 3–20 hane; küçük harf büyüğe (yalnız A–Z; dile bağlı harf katlama YOK, anayasa 5.5). */
  var E = { plan: null, sekme: "yeni", kod: "", tur: null, konum: "", seri: "", secili: [], turAra: "", turAcik: false, turEtkin: 0 };
  function kodNormal(v) { return v.replace(/\s+/g, "").replace(/[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function kodDurum(p, kod) {
    if (!kod) return { tur: "bos", metin: "Etiketteki kodu yazın: harf (A–Z), rakam ve tire. Kod firmada eşsiz olmalı." };
    if (/[^A-Z0-9-]/.test(kod)) return { tur: "hata", metin: "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok)." };
    if (kod.length < 3 || kod.length > 20) return { tur: "hata", metin: "Kod 3 ile 20 hane arasında olmalı." };
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kod)) return { tur: "hata", metin: "Tire başta, sonda ya da art arda olamaz." };
    var v = SICIL[kod];
    if (!v) return { tur: "tamam", metin: "Kod kullanılabilir; bu firmada başka ekipmanda yok." };
    var tp = bul(v.tesis);
    if (p.ekp.indexOf(kod) >= 0) return { tur: "hata", metin: kod + " bu planda zaten var: " + v.tur.ad + " · " + v.konum + ". Aynı kod iki ekipmana verilemez." };
    if (v.tesis === p.id) return { tur: "tesiste", metin: kod + " bu tesiste kayıtlı: " + v.tur.ad + " · " + v.konum + ". Yeni kayıt açılmaz; kayıtlı ekipmanı plana ekleyin.", kod: kod };
    return { tur: "hata", metin: kod + " başka bir tesiste kayıtlı: " + v.tur.ad + " · " + tp.musteri + " / " + tp.ad + ". Aynı kod iki ekipmana verilemez." };
  }
  function turListesi() { var a = tr(E.turAra.trim()); return KATALOG.filter(function (t) { return !a || tr(t.ad).indexOf(a) >= 0 || tr(t.k).indexOf(a) >= 0; }); }
  function ekleCiz(odak, imlec) {
    var p = E.plan, kayitli = Object.keys(SICIL).map(function (k) { return SICIL[k]; }).filter(function (e) { return e.tesis === p.id && p.ekp.indexOf(e.kod) < 0; });
    var sekme = function (k, ad, n) { return '<button type="button" class="a-sekme" data-sekme="' + k + '" aria-pressed="' + (E.sekme === k) + '">' + ad + (n !== undefined ? ' <span class="a-cip-sayi">' + n + "</span>" : "") + "</button>"; };
    var govde = "", alt = "";
    $("a-ekle-ozet").innerHTML = "<b>" + kacis(p.ad) + "</b> · " + p.no + "<br>" + kacis(p.musteri);
    $("a-ekle-sekmeler").innerHTML = sekme("yeni", "Yeni ekipman") + sekme("kayitli", "Tesiste kayıtlı", kayitli.length);
    if (E.sekme === "kayitli") {
      govde = kayitli.length ? '<ul class="a-secim-listesi">' + kayitli.map(function (e) {
        return '<li><label class="a-secim-satir"><input type="checkbox" data-kayitli="' + e.kod + '"' + (E.secili.indexOf(e.kod) >= 0 ? " checked" : "") + ">" +
          '<span class="a-secim-metin"><span><span class="a-kod">' + e.kod + '</span> <span class="a-ekipman-ad">' + e.tur.ad + "</span></span>" +
          '<span class="a-alt-satir">' + kacis(e.konum) + " · " + (e.onceki ? "Önceki kontrol " + ayYil(e.onceki.tarih) + ", " + e.onceki.sonuc : "İlk kontrol") + "</span></span></label></li>";
      }).join("") + "</ul>" : '<p class="a-bos-satir">Bu tesiste plana alınmamış kayıtlı ekipman yok. Yeni ekipmanı "Yeni ekipman" sekmesinden ekleyin.</p>';
      alt = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="ekle-kapat">Vazgeç</button>' +
        '<button class="a-tus a-tus-birincil" type="button" data-eylem="kayitli-ekle"' + (E.secili.length ? "" : " disabled") + ">" + ikon("plus", "a-ikon-kucuk") +
        "Plana ekle" + (E.secili.length ? " (" + E.secili.length + ")" : "") + "</button>";
    } else {
      var d = kodDurum(p, E.kod), turler = turListesi(), tamam = d.tur === "tamam" && !!E.tur;
      govde = '<div class="a-form">' +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-kod">Ekipman kodu <span class="a-zorunlu">zorunlu</span></label>' +
          '<input class="a-girdi a-girdi-kod" id="a-ekle-kod" autocomplete="off" spellcheck="false" maxlength="20" placeholder="HT-2040" value="' + kacis(E.kod) + '" aria-describedby="a-ekle-kod-durum" aria-invalid="' + (d.tur === "hata" || d.tur === "tesiste") + '">' +
          '<p class="a-kod-durum a-kod-durum-' + d.tur + '" id="a-ekle-kod-durum" role="status">' + ikon(d.tur === "tamam" ? "circle-check" : d.tur === "bos" ? "circle-alert" : "triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(d.metin) + "</span></p>" +
          (d.tur === "tesiste" ? '<button class="a-tus a-tus-ikincil a-tus-kucuk-alan" type="button" data-eylem="tesistekini-sec" data-kod="' + d.kod + '">Kayıtlı ekipmanı seç</button>' : "") +
        "</div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-tur">Ekipman türü <span class="a-zorunlu">zorunlu</span></label>' +
          '<div class="a-combo"><input class="a-girdi" id="a-ekle-tur" role="combobox" aria-expanded="' + E.turAcik + '" aria-controls="a-ekle-tur-liste" aria-autocomplete="list" autocomplete="off" placeholder="Türü ara" value="' + kacis(E.tur && !E.turAcik ? E.tur.ad : E.turAra) + '">' +
          '<div class="a-secici-liste a-combo-liste" id="a-ekle-tur-liste" role="listbox" aria-label="Ekipman türü"' + (E.turAcik ? "" : " hidden") + ">" +
          (turler.length ? turler.map(function (t, i) {
            return '<button class="a-secenek' + (i === E.turEtkin ? " a-etkin" : "") + '" type="button" role="option" tabindex="-1" aria-selected="' + (E.tur === t) + '" data-tur="' + t.k + '">' +
              ikon("check", "a-ikon-kucuk") + '<span class="a-kirp">' + t.ad + '</span><span class="a-secenek-ek">' + bransAd(t.b) + "</span></button>";
          }).join("") : '<p class="a-bos-satir">Bu adla tür yok.</p>') + "</div></div>" +
          '<p class="a-ipucu">' + (E.tur ? "Branş: " + bransAd(E.tur.b) + " · onay " + bransAd(E.tur.b) + " yöneticisine gider." : "Branş türden gelir.") + "</p></div>" +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-seri">Seri no</label><input class="a-girdi a-girdi-seri" id="a-ekle-seri" autocomplete="off" maxlength="30" value="' + kacis(E.seri) + '"></div>' +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-konum">Konum / tanım</label><input class="a-girdi" id="a-ekle-konum" autocomplete="off" maxlength="60" placeholder="Kompresör odası" value="' + kacis(E.konum) + '"></div>' +
        "</div>";
      alt = '<button class="a-tus a-tus-ikincil" type="button" data-eylem="ekle-kapat">Vazgeç</button>' +
        '<button class="a-tus a-tus-birincil" type="button" data-eylem="yeni-kaydet"' + (tamam ? "" : " disabled") + ">" + ikon("check", "a-ikon-kucuk") + "Kaydet ve plana ekle</button>";
    }
    $("a-ekle-govde").innerHTML = govde; $("a-ekle-alt").innerHTML = alt;
    /* her tuşta form yeniden çizilir; odak ve imleç yazılan yerde kalır */
    if (odak) { var el = $(odak); if (el) { el.focus(); var n = typeof imlec === "number" ? imlec : el.value.length; if (el.setSelectionRange) el.setSelectionRange(n, n); } }
  }
  function ekleAc(p, kod) {
    E = { plan: p, sekme: "yeni", kod: kod || "", tur: null, konum: "", seri: "", secili: [], turAra: "", turAcik: false, turEtkin: 0 };
    ekleCiz(); if (!$("a-ekle-pencere").open) $("a-ekle-pencere").showModal();
    var k = $("a-ekle-kod"); if (k) k.focus();
  }
  function ekleKapat() { if ($("a-ekle-pencere").open) $("a-ekle-pencere").close(); }

  /* ── GÖRÜNÜM (adres #/plan/<id>[/ekle[/<KOD>]] → plan içi; başka her şey → liste) ─────────────────── */
  function rota() { var m = /^#\/plan\/(\d+)(\/ekle(?:\/([A-Za-z0-9-]*))?)?$/.exec(location.hash); return m ? { id: +m[1], ekle: !!m[2], kod: m[3] || "" } : null; }
  function goster(odakla) {
    var r = rota(), planda = !!r, p = planda && VERI === "dolu" ? bul(r.id) : null;
    $("a-liste-gorunum").hidden = planda; $("a-plan").hidden = !planda;
    if (planda) planCiz(p); else ciz();
    document.title = (p ? p.no + " · " + p.ad : "Planlar") + " · probata maket";
    if (odakla) {
      window.scrollTo(0, 0);
      var h = document.querySelector(planda ? "#a-plan h1" : "#a-liste-gorunum h1");
      if (h) h.focus({ preventScroll: true });
    }
    if (p && r.ekle && p.durum === "denetimde") ekleAc(p, kodNormal(r.kod)); else ekleKapat();
  }
  MK.goster = goster;
  function git(id) { var r = rota(); if (r && r.id === id && !r.ekle) goster(false); else location.hash = "#/plan/" + id; }

  /* ── ETKİLEŞİM (Planlar'a özgü; genel tıklamalar ortak dağıtıcıda) ──────────────────────────────────── */
  var redId = null;
  MK.onTikla = function (e) {
    if (E.turAcik && !e.target.closest(".a-combo")) { E.turAcik = false; ekleCiz(); }
    var el = e.target.closest("[data-sekme],[data-tur]");
    if (!el) return false;
    if (el.dataset.sekme) { E.sekme = el.dataset.sekme; ekleCiz(); return true; }
    E.tur = KATALOG.filter(function (t) { return t.k === el.dataset.tur; })[0]; E.turAcik = false; E.turAra = ""; ekleCiz("a-ekle-seri"); return true;
  };
  var X = MK.eylem, pl = function (el) { return bul(+el.dataset.id); };
  X.tekrar = function () { VERI = "dolu"; goster(false); };
  X.kabul = function (el) { var p = pl(el); if (p && p.durum === "bekliyor" && !p.eksik) { p.durum = "kabul"; p.kabul = simdi(); kaydet(p, simdi(), BEN, "Plan kabul edildi", "Tarafsızlık beyanı onaylandı"); goster(false); MK.bildir("Plan kabul edildi."); } };
  X.basla = function (el) { var p = pl(el); if (p && p.durum === "kabul") { p.durum = "denetimde"; p.basladi = simdi(); kaydet(p, simdi(), BEN, "Denetime başlandı"); MK.bildir("Denetim başladı."); git(p.id); } };
  X.devam = function (el) { var p = pl(el); if (p) git(p.id); };
  X.tamamla = function (el) { var p = pl(el); if (p && p.durum === "denetimde") { p.durum = "tamam"; p.bitti = simdi(); kaydet(p, simdi(), BEN, "Plan tamamlandı"); goster(false); MK.bildir("Plan tamamlandı."); } };
  X["geri-al"] = function (el) { var p = pl(el); if (p && p.durum === "tamam") { p.durum = "denetimde"; p.bitti = null; kaydet(p, simdi(), BEN, "Tamamlama geri alındı"); goster(false); MK.bildir("Tamamlama geri alındı; plan yeniden denetime açıldı."); } };
  X["rapor-olustur"] = function (el) {
    var p = pl(el);
    if (p && calisir(p) && !raporuVar(p, el.dataset.kod)) {
      var r = { no: raporNo("0926", raporSira++), kod: el.dataset.kod, durum: "taslak", olustu: simdi(), sonuc: null };
      p.rapor.push(r); kaydet(p, simdi(), BEN, "Rapor oluşturuldu", r.no + " · " + r.kod); SZ.r.sayfa = 1;
      goster(false); MK.bildir("Rapor oluşturuldu: " + r.no + ". Saha rapor ekranı bu maketin kapsamında değil.");
    }
  };
  X["ekle-ac"] = function (el) { var p = pl(el); if (p && p.durum === "denetimde") ekleAc(p); };
  X["ekle-kapat"] = ekleKapat;
  X["tesistekini-sec"] = function (el) { E.sekme = "kayitli"; E.secili = [el.dataset.kod]; ekleCiz(); };
  X["kayitli-ekle"] = function () {
    if (E.plan && E.secili.length) {
      var p = E.plan, n = E.secili.length;
      E.secili.forEach(function (kod) { p.ekp.push(kod); p.sonradan.push(kod); kaydet(p, simdi(), BEN, "Kayıtlı ekipman plana alındı", kod + " · " + SICIL[kod].tur.ad); });
      var gorunur = kaydaGit(E.secili[0]);
      ekleKapat(); goster(false); MK.bildir(n + " kayıtlı ekipman plana eklendi" + (gorunur ? "." : "; süzgeç yüzünden listede görünmüyor."));
    }
  };
  X["yeni-kaydet"] = function () {
    if (E.plan && E.tur && kodDurum(E.plan, E.kod).tur === "tamam") {   /* kaydetmeden önce yeniden denetlenir */
      var p = E.plan, kod = E.kod;
      SICIL[kod] = { kod: kod, tur: E.tur, konum: E.konum.trim() || "Konum yazılmadı", tesis: p.id, onceki: null, eklendi: simdi(), seri: E.seri.trim() };
      p.ekp.push(kod); p.sonradan.push(kod); kaydet(p, simdi(), BEN, "Ekipman eklendi", kod + " · " + E.tur.ad);
      var gor = kaydaGit(kod);
      ekleKapat(); goster(false); MK.bildir(kod + " plana eklendi" + (gor ? ". Raporu satırındaki “Rapor oluştur” açar." : "; süzgeç yüzünden listede görünmüyor."));
    }
  };
  X["not-ekle"] = function (el) {
    var p = pl(el), ng = $("a-not-girdi"), metin = ng ? ng.value.trim() : "";
    if (p && metin.length >= 3) { kaydet(p, simdi(), BEN, "Not", metin); goster(false); MK.bildir("Not plana eklendi; planlama ekibi görür."); }
  };
  X["notlar-hepsi"] = function () { NOTLAR_ACIK = !NOTLAR_ACIK; goster(false); };
  X.reddet = function (el) {
    var p = pl(el); if (!p) return;
    redId = p.id; $("a-red-gerekce").value = ""; $("a-red-onay").disabled = true;
    $("a-red-ozet").innerHTML = "<b>" + kacis(p.ad) + "</b> · " + p.no + "<br>" + kacis(p.musteri) + "<br>" + gunYaz(p.tarih) + " · " + p.bas + " – " + p.bit;
    $("a-red-ipucu").className = "a-ipucu"; $("a-red-ipucu").hidden = false; $("a-red-pencere").showModal(); $("a-red-gerekce").focus();
  };
  document.addEventListener("change", function (e) {
    var k = e.target.dataset && e.target.dataset.kayitli;
    if (!k) return;
    var i = E.secili.indexOf(k);
    if (e.target.checked && i < 0) E.secili.push(k); else if (!e.target.checked && i >= 0) E.secili.splice(i, 1);
    ekleCiz();
    var geri = document.querySelector('[data-kayitli="' + k + '"]'); if (geri) geri.focus();
  });
  MK.onGirdi = function (e) {
    var t = e.target;
    if (t.id === "a-not-girdi") { $("a-not-ekle").disabled = t.value.trim().length < 3; return; }
    if (t.id === "a-ekle-kod") {
      var ham = t.value, nor = kodNormal(ham), yer = Math.max(0, t.selectionStart - (ham.length - nor.length));
      E.kod = nor; ekleCiz("a-ekle-kod", yer); return;
    }
    if (t.id === "a-ekle-tur") { E.turAra = t.value; E.tur = null; E.turAcik = true; E.turEtkin = 0; ekleCiz("a-ekle-tur", t.selectionStart); return; }
    if (t.id === "a-ekle-konum") { E.konum = t.value; return; }
    if (t.id === "a-ekle-seri") { E.seri = t.value; return; }
  };
  document.addEventListener("focusin", function (e) {
    if (e.target.id === "a-ekle-tur" && !E.turAcik) { E.turAcik = true; E.turAra = ""; E.turEtkin = 0; ekleCiz("a-ekle-tur"); }
  });
  MK.onTus = function (e) {
    if (e.target.id !== "a-ekle-tur" || !E.turAcik) return false;
    var l = turListesi();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); E.turEtkin = (E.turEtkin + (e.key === "ArrowDown" ? 1 : l.length - 1)) % Math.max(l.length, 1); ekleCiz("a-ekle-tur"); return true; }
    if (e.key === "Enter") { e.preventDefault(); if (l[E.turEtkin]) { E.tur = l[E.turEtkin]; E.turAcik = false; E.turAra = ""; ekleCiz("a-ekle-seri"); } return true; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); E.turAcik = false; ekleCiz("a-ekle-tur"); return true; }
    return false;
  };
  $("a-red-gerekce").addEventListener("input", function (e) {
    var yeter = e.target.value.trim().length >= 3;
    $("a-red-onay").disabled = !yeter; $("a-red-ipucu").hidden = yeter;
  });
  $("a-red-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var g = $("a-red-gerekce").value.trim();
    if (g.length < 3) { $("a-red-ipucu").hidden = false; $("a-red-ipucu").className = "a-ipucu a-ipucu-uyari"; return; }
    var p = bul(redId);
    if (p && p.durum === "bekliyor") { p.durum = "red"; p.gerekce = g; p.reddedildi = simdi(); kaydet(p, simdi(), BEN, "Plan reddedildi", "Gerekçe: " + g); }
    $("a-red-pencere").close(); goster(false); MK.bildir("Plan reddedildi; gerekçe planlama ekibine gider.");
  });
  /* pencere kapanınca adres plan içine döner (sunum çerçevesi #/plan/1/ekle ile açar) */
  $("a-ekle-pencere").addEventListener("close", function () { var r = rota(); if (r && r.ekle) history.replaceState(null, "", "#/plan/" + r.id); });

  MK.kabuk({ modul: 13, kullanici: { bas: "MK", ad: "Mert Kaya", rol: "Inspector · Makine Mühendisi" }, sayac: { 13: "Kabul bekleyen plan" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("l");   /* Planlar süzgeci de aynı üreticiden (kalıp 15) */
  MK.seciciCiz("l"); goster(false);
})();
