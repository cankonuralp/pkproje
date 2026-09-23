/* ══ probata MAKET — Planlarım + plan içi (2026-09-23 · 3. tur) ═══════════════════════════════════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3); gerçek firma, kişi, tesis, adres, sözleşme ve ekipman kodu yok.
   ⛔ "Bugün" sabit: 2026-09-23, saat 16:40 — ölçüm her açılışta aynı sonucu versin.
   Adres: ?veri=dolu|bos|hata · ?tema=acik|koyu · #/plan/<id> = plan içi ·
          #/plan/<id>/ekle = ekipman ekle penceresi · #/plan/<id>/ekle/<KOD> = kodu yazılmış hâli (sunum çerçeveleri için).
   2. tur (reisim): liste sütunları örnek listeden; satırda tek tuş Kabul et → Denetime başla → Devam et; plan içinde
   Tamamla ↔ Tamamlamayı geri al.
   3. tur (reisim): ekipman ile rapor AYRI — plan içinde üstte Ekipmanlar (tesisin kalıcı kayıtları, kodla), altta
   Raporlar (bu plandaki raporlar); seneye aynı ekipmana yeni rapor açılır. Ekipman kodunu personel girer; kod firmada
   eşsizdir, çakışan kod KAYDEDİLMEZ. Denetime başla tarihe bağlı değil; her hareket plan geçmişine yazılır. */
(function () {
  "use strict";
  var IKON = "../vendor/lucide-1.47.0/ikonlar.svg#i-";
  var BUGUN = "2026-09-23", SAAT = "16:40";
  var HAFTA = ["2026-09-21", "2026-09-27"];
  var YEDI = ["2026-09-23", "2026-09-29"];
  var FIRMA_KOD = "KM";   /* rapor numarasının başındaki firma kısa kodu (firma ayarı; uydurma firma "Kalkan Muayene") */

  var KISI = {
    mk: { ad: "Mert Kaya", brans: "Mekanik", rol: "Inspector" },
    ea: { ad: "Elif Aydın", brans: "Elektrik", rol: "Inspector" },
    bs: { ad: "Burak Şahin", brans: "Mekanik", rol: "Inspector" },
    za: { ad: "Zeynep Arslan", brans: "", rol: "Planlama" }
  };
  var BEN = "mk";
  /* Ekipman türü kataloğu (modül 5'in maketteki karşılığı). 14 tür > 8 → seçim alanında arama (kalıp 19). */
  var KATALOG = [
    { k: "HT", ad: "Hava tankı", b: "m" }, { k: "FL", ad: "Forklift", b: "m" }, { k: "KK", ad: "Köprülü kren", b: "m" },
    { k: "KP", ad: "Kaldırma platformu", b: "m" }, { k: "TP", ad: "Transpalet", b: "m" }, { k: "KS", ad: "Kompresör", b: "m" },
    { k: "ZV", ad: "Zincirli vinç", b: "m" }, { k: "YA", ad: "Yük asansörü", b: "m" }, { k: "BK", ad: "Buhar kazanı", b: "m" },
    { k: "ET", ad: "Elektrik iç tesisatı", b: "e" }, { k: "AT", ad: "AG topraklama", b: "e" }, { k: "YK", ad: "Yıldırımdan korunma", b: "e" },
    { k: "DP", ad: "Dağıtım panosu", b: "e" }, { k: "JN", ad: "Jeneratör", b: "e" }
  ];
  var MEK = KATALOG.filter(function (t) { return t.b === "m" && t.k !== "BK"; });
  var ELK = KATALOG.filter(function (t) { return t.b === "e" && t.k !== "JN"; });
  var KONUM = ["Üretim holü", "Kompresör odası", "Sevkiyat alanı", "Depo girişi", "Bakım atölyesi", "Ana dağıtım odası", "Yükleme rampası", "Hat 2", "Kazan dairesi", "Çatı"];
  var SONUC = ["Uygun", "Uygun", "Hafif kusurlu", "Uygun", "Uygun", "Kusurlu", "Uygun"];

  var PLANLAR = [
    { id: 1, no: "P-0926-031", ad: "Merkez Fabrika", musteri: "Ada Makina San. ve Tic. A.Ş.", adres: "Organize Sanayi Bölgesi 4. Cadde No: 12", ilce: "Gebze", il: "Kocaeli", tarih: "2026-09-23", bas: "09:00", bit: "12:30", ekip: ["mk", "ea"], m: 8, e: 4, yeni: 2, disarida: 2, durum: "denetimde", acildi: "2026-09-15T10:12", kabul: "2026-09-16T08:31", basladi: "2026-09-23T09:04", isg: { no: "S-2026-0412", onay: "2026-09-16" }, rap: { onayda: 1, taslak: 4 } },
    { id: 2, no: "P-0926-034", ad: "Depo 2", musteri: "Yıldız Ambalaj A.Ş.", adres: "Liman Caddesi No: 7", ilce: "Tuzla", il: "İstanbul", tarih: "2026-09-23", bas: "14:00", bit: "17:00", ekip: ["mk"], m: 5, e: 0, durum: "bekliyor", acildi: "2026-09-17T11:40", isg: { no: "S-2026-0431", onay: "2026-09-19" } },
    { id: 3, no: "P-0926-036", ad: "Aktarma Merkezi ve Soğuk Hava Deposu", musteri: "Kuzey Lojistik ve Depolama Hizmetleri A.Ş.", adres: "Sanayi Caddesi No: 48, Aktarma Merkezi Girişi", ilce: "Çorlu", il: "Tekirdağ", tarih: "2026-09-24", bas: "08:30", bit: "16:30", ekip: ["mk", "ea", "bs"], m: 14, e: 6, disarida: 1, durum: "bekliyor", acildi: "2026-09-18T09:05", isg: { no: "S-2026-0440", onay: "2026-09-15" } },
    { id: 4, no: "P-0926-038", ad: "Boyahane", musteri: "Mavi Tekstil Ltd.", adres: "Organize Sanayi Bölgesi 2. Sokak No: 5", ilce: "Çerkezköy", il: "Tekirdağ", tarih: "2026-09-25", bas: "09:00", bit: "13:00", ekip: ["mk", "ea"], m: 2, e: 7, durum: "bekliyor", acildi: "2026-09-19T14:22", isg: { no: "S-2026-0447", onay: "2026-09-25" }, eksik: "İSG-KATİP onayı 25 Eyl'de verilmiş; en geç 24 Eyl olmalı." },
    { id: 5, no: "P-0926-039", ad: "Döküm Hattı", musteri: "Akın Döküm San. Ltd.", adres: "Demir Çelik Caddesi No: 21", ilce: "Dilovası", il: "Kocaeli", tarih: "2026-09-26", bas: "10:00", bit: "12:00", ekip: ["mk"], m: 3, e: 0, durum: "bekliyor", acildi: "2026-09-20T10:48", isg: null, eksik: "Bu tesis için İSG-KATİP kaydı yok." },
    { id: 6, no: "P-0926-035", ad: "Üretim Tesisi", musteri: "Ege Plastik A.Ş.", adres: "Organize Sanayi Bölgesi 1. Kısım No: 9", ilce: "Yunusemre", il: "Manisa", tarih: "2026-09-29", bas: "09:00", bit: "15:00", ekip: ["mk", "ea"], m: 7, e: 3, durum: "kabul", acildi: "2026-09-17T15:30", kabul: "2026-09-18T09:12", isg: { no: "S-2026-0436", onay: "2026-09-20" } },
    { id: 7, no: "P-0926-037", ad: "Şantiye Deposu", musteri: "Kaya Yapı Malzemeleri Ltd.", adres: "Çevre Yolu Caddesi No: 3", ilce: "Başakşehir", il: "İstanbul", tarih: "2026-09-30", bas: "09:00", bit: "12:00", ekip: ["mk"], m: 2, e: 0, durum: "red", acildi: "2026-09-18T16:02", reddedildi: "2026-09-19T08:47", isg: { no: "S-2026-0444", onay: "2026-09-21" }, gerekce: "Aynı saatte başka tesiste denetimim var." },
    { id: 8, no: "P-0926-028", ad: "Soğuk Hava Deposu", musteri: "Deniz Gıda Ltd.", adres: "Liman Yolu No: 15", ilce: "Pendik", il: "İstanbul", tarih: "2026-09-22", bas: "09:00", bit: "11:30", ekip: ["mk"], m: 4, e: 0, durum: "tamam", acildi: "2026-09-10T13:15", kabul: "2026-09-11T08:05", basladi: "2026-09-22T09:02", bitti: "2026-09-22T11:52", isg: { no: "S-2026-0405", onay: "2026-09-12" }, rap: { onayda: 3, taslak: 1 } },
    { id: 9, no: "P-0926-025", ad: "Değirmen", musteri: "Başak Un Değirmenleri A.Ş.", adres: "İstasyon Caddesi No: 30", ilce: "Lüleburgaz", il: "Kırklareli", tarih: "2026-09-21", bas: "13:00", bit: "16:00", ekip: ["mk", "ea"], m: 6, e: 2, durum: "tamam", acildi: "2026-09-08T10:30", kabul: "2026-09-09T07:58", basladi: "2026-09-21T13:05", bitti: "2026-09-21T16:20", isg: { no: "S-2026-0398", onay: "2026-09-10" }, rap: { onaylandi: 5, onayda: 3 } }
  ];

  /* ── NUMARA SİSTEMİ (maketteki karşılığı; kuralı pkproje.md §3.5) ────────────────────────────────────────
     Proje no  P-AAYY-SIRA        · planın açıldığı ay+yıl · SIRA firmada o ayın kaçıncı planı · sunucu verir.
     Rapor no  XX-AAYY-SIRA-EK    · XX firma kısa kodu · raporun açıldığı ay+yıl · SIRA firmada kesintisiz artan ·
                                    EK 5 hane rasgele (tahmin edilemez) · sunucu verir.
     Ekipman   personel girer      · A–Z, 0–9, tire; 3–20 hane · FİRMADA eşsiz · çakışırsa kayıt yok. */
  var raporSira = 760, eskiSira = 402;
  var ek = function (n) { return ("0000" + ((Math.imul(n, 2654435761) >>> 0) % 1048576).toString(16)).slice(-5); };
  var raporNo = function (aayy, sira) { return FIRMA_KOD + "-" + aayy + "-" + sira + "-" + ek(sira * 7 + 3); };

  /* Firma geneli ekipman sicili (modül 7): kod → kayıt. Plan yalnız KODLARI tutar; ekipman tesise aittir, kalıcıdır. */
  var SICIL = {};
  var kodSira = 1001;
  function sicileYaz(tur, p, konum, onceki, eklendi) {
    var kod = tur.k + "-" + (kodSira++);
    SICIL[kod] = { kod: kod, tur: tur, konum: konum, tesis: p.id, onceki: onceki, eklendi: eklendi || null };
    return kod;
  }
  PLANLAR.forEach(function (p) {
    p.ekp = []; p.rapor = []; p.gecmis = [];
    var toplam = p.m + p.e, yeni = p.yeni || 0, gun = p.tarih.slice(8, 10);
    for (var i = 0; i < toplam + (p.disarida || 0); i++) {
      var b = i < p.m ? "m" : i < toplam ? "e" : "m", havuz = b === "m" ? MEK : ELK, j = b === "m" ? i : i - p.m;
      var tur = havuz[j % havuz.length], konum = KONUM[(i + p.id) % KONUM.length];
      var ilk = i >= toplam - yeni && i < toplam;   /* bu planda ilk kez eklenenler: önceki kontrolü yok */
      var onceki = ilk ? null : { tarih: "2025-09-" + gun, sonuc: SONUC[(i + p.id) % SONUC.length], rapor: raporNo("0925", eskiSira++) };
      var kod = sicileYaz(tur, p, konum, onceki, ilk ? "2026-09-23T09:" + (18 + i) : null);
      if (i < toplam) p.ekp.push(kod);   /* toplamın ötesi: tesiste kayıtlı ama bu plana alınmamış */
    }
  });
  /* raporlar oluşturulma sırasıyla (21 → 22 → 23 Eyl) numaralanır: sıra firmada kesintisiz artar */
  [9, 8, 1].forEach(function (id) {
    var p = PLANLAR.filter(function (x) { return x.id === id; })[0], dagilim = [];
    ["onaylandi", "onayda", "taslak"].forEach(function (d) { for (var k = 0; k < (p.rap[d] || 0); k++) dagilim.push(d); });
    dagilim.forEach(function (d, k) {
      var dak = 10 + k * 6, saat = p.basladi.slice(0, 11) + ("0" + (+p.basladi.slice(11, 13) + Math.floor(dak / 60))).slice(-2) + ":" + ("0" + (dak % 60)).slice(-2);
      p.rapor.push({ no: raporNo("0926", raporSira++), kod: p.ekp[k], durum: d, olustu: saat });
    });
  });
  /* Plan geçmişi (reisim 2026-09-23: "istediği zaman istediği tepkiyi verebilsin, bu hareketler kayıt altında kalsın") */
  function kaydet(p, zaman, kim, ne, ayrinti) { p.gecmis.push({ z: zaman, kim: kim, ne: ne, ayrinti: ayrinti || "", s: p.gecmis.length }); }
  PLANLAR.forEach(function (p) {
    kaydet(p, p.acildi, "za", "Plan açıldı", p.ekp.length + " ekipman · " + p.ekip.map(function (k) { return KISI[k].ad; }).join(", "));
    if (p.kabul) kaydet(p, p.kabul, BEN, "Plan kabul edildi");
    if (p.reddedildi) kaydet(p, p.reddedildi, BEN, "Plan reddedildi", "Gerekçe: " + p.gerekce);
    if (p.basladi) kaydet(p, p.basladi, BEN, "Denetime başlandı");
    p.ekp.forEach(function (k) { var e = SICIL[k]; if (e.eklendi) kaydet(p, e.eklendi, BEN, "Ekipman eklendi", k + " · " + e.tur.ad); });
    p.rapor.forEach(function (r) { kaydet(p, r.olustu, BEN, "Rapor oluşturuldu", r.no + " · " + r.kod); });
    if (p.bitti) kaydet(p, p.bitti, BEN, "Plan tamamlandı");
  });

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
  /* Yüklem çipleri: beş durum + bir bağımsız yüklem. ve/veya HEPSİNİ yönetir (kalıp 8). */
  var CIPLER = [
    { k: "bekliyor", ad: "Kabul bekliyor", durum: true, test: function (p) { return p.durum === "bekliyor"; } },
    { k: "kabul", ad: "Kabul edildi", durum: true, test: function (p) { return p.durum === "kabul"; } },
    { k: "denetimde", ad: "Denetimde", durum: true, test: function (p) { return p.durum === "denetimde"; } },
    { k: "tamam", ad: "Tamamlandı", durum: true, test: function (p) { return p.durum === "tamam"; } },
    { k: "red", ad: "Reddedildi", durum: true, test: function (p) { return p.durum === "red"; } },
    { k: "eksik", ad: "Ön koşul eksik", durum: false, test: function (p) { return p.durum === "bekliyor" && !!p.eksik; } }
  ];
  /* Sıralama: tabloda sütun başlığı, kart kipinde "Sıralama" seçicisi; ikisi de S.sira'yı yazar. */
  var SIRA_ANAHTAR = {
    no: function (p) { return p.no; },
    ad: function (p) { return p.ad; },
    musteri: function (p) { return p.musteri; },
    adres: function (p) { return p.il + " " + p.ilce + " " + p.adres; },
    ekip: function (p) { return KISI[p.ekip[0]].ad; },
    baslangic: function (p) { return p.tarih + " " + p.bas; },
    durum: function (p) { return DURUM[p.durum].sira; }
  };
  var SIRA_AD = { no: "Proje no", ad: "Proje adı", musteri: "Müşteri", adres: "Adres", ekip: "Inspector", baslangic: "Başlangıç", durum: "Durum" };
  function siraEtiket(v) {
    if (v === "varsayilan") return "Açık işler önce";
    var x = v.split("-"), artan = x[1] === "artan";
    var yon = x[0] === "baslangic" ? (artan ? "yakın → uzak" : "uzak → yakın")
      : x[0] === "no" ? (artan ? "küçükten büyüğe" : "büyükten küçüğe")
      : x[0] === "durum" ? (artan ? "akış sırası" : "ters akış") : (artan ? "A → Z" : "Z → A");
    return SIRA_AD[x[0]] + ": " + yon;
  }
  var SIRA_TEMEL = ["varsayilan", "baslangic-artan", "baslangic-azalan", "musteri-artan", "no-artan"];
  function siraSecenek() {
    var l = SIRA_TEMEL.indexOf(S.sira) < 0 ? SIRA_TEMEL.concat([S.sira]) : SIRA_TEMEL;
    return l.map(function (v) { return [v, siraEtiket(v)]; });
  }
  var SECICI = [
    { k: "tarih", ad: "Tarih", secenek: function () { return [["tumu", "Tümü"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["yedi", "Önümüzdeki 7 gün"]]; } },
    { k: "musteri", ad: "Müşteri", secenek: function () {
      return [["tumu", "Tümü"]].concat(PLANLAR.map(function (p) { return p.musteri; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "tr"); })
        .map(function (m) { return [m, m]; }));
    } },
    { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; } },
    /* süzgeç değil sıralama: Temizle ve süzgeç rozeti saymaz; satırda yalnız kart kipinde görünür (tabloda başlık sıralar) */
    { k: "sira", ad: "Sıralama", siralama: true, secenek: siraSecenek }
  ];

  var q = new URLSearchParams(location.search);
  var S = { veri: q.get("veri") || "dolu", ara: "", secili: [], kip: "veya", tarih: "tumu", musteri: "tumu", brans: "tumu", sira: "varsayilan" };
  var $ = function (id) { return document.getElementById(id); };
  var kacis = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ikon = function (ad, sinif) { return '<svg class="a-ikon' + (sinif ? " " + sinif : "") + '" aria-hidden="true"><use href="' + IKON + ad + '"/></svg>'; };
  var GUN = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  /* tarih bölünmez (gün adı · gün · ay birlikte kalır); "Bugün" ise dar sütunda alt satıra geçebilir (1080 ölçümü) */
  var gunYaz = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return GUN[d.getDay()] + " " + d.getDate() + " " + AY[d.getMonth()]; };
  var gunKisa = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return d.getDate() + " " + AY[d.getMonth()]; };
  var ayYil = function (iso) { var d = new Date(iso.slice(0, 10) + "T12:00:00"); return AY[d.getMonth()] + " " + d.getFullYear(); };
  var zamanYaz = function (z) { return gunKisa(z) + " " + z.slice(11, 16); };
  var simdi = function () { return BUGUN + "T" + SAAT; };
  var tr = function (s) { return s.toLocaleLowerCase("tr"); };
  /* kırpma zinciri (kalıp 4): yaprak blok + üç nokta + tam metin title'da */
  var kirp = function (metin, sinif, baslik) { return '<span class="a-kirp' + (sinif ? " " + sinif : "") + '" title="' + kacis(baslik || metin) + '">' + kacis(metin) + "</span>"; };
  var rozet = function (d) { return '<span class="a-rozet ' + d.rozet + '">' + d.ad + "</span>"; };
  var bul = function (id) { return PLANLAR.filter(function (x) { return x.id === id; })[0]; };
  var bransAd = function (b) { return b === "m" ? "Mekanik" : "Elektrik"; };

  function veri() { return S.veri === "dolu" ? PLANLAR : []; }

  /* Taban: çipler HARİÇ her şey (arama + seçiciler). Çip sayıları buradan sayılır (dürüst sayaç, anayasa 2.8). */
  function taban() {
    var a = tr(S.ara.trim());
    return veri().filter(function (p) {
      if (a && tr([p.no, p.ad, p.musteri, p.adres, p.ilce, p.il].join(" ")).indexOf(a) < 0) return false;
      if (S.tarih === "bugun" && p.tarih !== BUGUN) return false;
      if (S.tarih === "hafta" && (p.tarih < HAFTA[0] || p.tarih > HAFTA[1])) return false;
      if (S.tarih === "yedi" && (p.tarih < YEDI[0] || p.tarih > YEDI[1])) return false;
      if (S.musteri !== "tumu" && p.musteri !== S.musteri) return false;
      if (S.brans === "m" && !p.m) return false;
      if (S.brans === "e" && !p.e) return false;
      return true;
    });
  }
  function cipGecer(p) {
    if (!S.secili.length) return true;
    var sonuc = S.secili.map(function (k) { return CIPLER.filter(function (c) { return c.k === k; })[0].test(p); });
    return S.kip === "ve" ? sonuc.every(Boolean) : sonuc.some(Boolean);
  }
  function imkansiz() {
    return S.kip === "ve" && S.secili.filter(function (k) { return CIPLER.some(function (c) { return c.k === k && c.durum; }); }).length >= 2;
  }
  /* Varsayılan sıra: açık işler (bekliyor, kabul, denetimde) başlangıca göre ileri; kapanmışlar (tamam, red) en yeni önce, sonda. */
  function sirala(l) {
    var zaman = function (p) { return p.tarih + " " + p.bas; };
    if (S.sira === "varsayilan") {
      var acik = function (p) { return p.durum === "bekliyor" || p.durum === "kabul" || p.durum === "denetimde"; };
      return l.slice().sort(function (a, b) {
        if (acik(a) !== acik(b)) return acik(a) ? -1 : 1;
        var c = zaman(a).localeCompare(zaman(b));
        return acik(a) ? c : -c;
      });
    }
    var x = S.sira.split("-"), f = SIRA_ANAHTAR[x[0]], yon = x[1] === "azalan" ? -1 : 1;
    return l.slice().sort(function (a, b) {
      var u = f(a), v = f(b);
      var c = typeof u === "number" ? u - v : String(u).localeCompare(String(v), "tr");
      return c * yon || zaman(a).localeCompare(zaman(b));
    });
  }
  function aktifSecici() { return ["tarih", "musteri", "brans"].filter(function (k) { return S[k] !== "tumu"; }).length; }
  function suzgecVar() { return !!S.ara.trim() || S.secili.length > 0 || aktifSecici() > 0; }

  /* ── TEK LİSTE ÜRETİCİSİ ─────────────────────────────────────────────────────────────────────────────
     Aynı işaretleme: liste kabı eşiğin üstünde tablo, altında kart (maket.css @container liste). Plan listesi, plan
     içindeki ekipman ve rapor listeleri bu üreticiden çıkar (kalıp 16-b: ikinci liste üreticisi açılmaz).
     Sütun: k · baslik · kart (ust | rozet | govde | eylem) · sira (kartta diziliş) · hucre(kayıt) → HTML. */
  function tabloHtml(o) {
    var bas = o.sutunlar.map(function (s) {
      if (s.gizliBaslik) return '<th scope="col"><span class="a-gizli">' + s.baslik + "</span></th>";
      if (!o.siralanir) return '<th scope="col">' + s.baslik + "</th>";
      var yon = S.sira === s.k + "-artan" ? "ascending" : S.sira === s.k + "-azalan" ? "descending" : "";
      return '<th scope="col"' + (yon ? ' aria-sort="' + yon + '"' : "") + '><button class="a-sirala" type="button" data-sirala="' + s.k + '">' +
        s.baslik + ikon(yon === "ascending" ? "arrow-up" : yon === "descending" ? "arrow-down" : "arrow-up-down", "a-ikon-kucuk") + "</button></th>";
    }).join("");
    var govde = o.kayitlar.map(function (r) {
      var href = o.href ? o.href(r) : "";
      return "<tr" + (href ? ' data-href="' + href + '"' : "") + ">" + o.sutunlar.map(function (s) {
        return '<td data-alan="' + s.k + '" data-kart="' + s.kart + '" style="--sira:' + s.sira + '">' + s.hucre(r) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<table class="a-tablo ' + o.sinif + '"><caption class="a-gizli">' + o.baslik + "</caption><colgroup>" +
      o.sutunlar.map(function (s) { return '<col class="a-k-' + s.k + '">'; }).join("") + "</colgroup>" +
      "<thead><tr>" + bas + "</tr></thead><tbody>" + govde + "</tbody></table>";
  }
  function tus(eylem, p, ad, ik, kapali, sinif, sebepId, ek) {
    return '<button class="a-tus ' + (sinif || "a-tus-birincil") + '" type="button" data-eylem="' + eylem + '" data-id="' + p.id + '"' + (ek || "") +
      (kapali ? " disabled" + (sebepId ? ' aria-describedby="' + sebepId + '"' : "") : "") + ">" + (ik ? ikon(ik, "a-ikon-kucuk") : "") + ad + "</button>";
  }

  /* ── PLAN LİSTESİ ─────────────────────────────────────────────────────────────────────────────────── */
  function ekipHtml(p) {
    var tam = p.ekip.map(function (k) { return KISI[k].ad + " (" + KISI[k].brans + ")"; }).join(" · ");
    var fazla = p.ekip.length > 2 ? ' <span class="a-ekip-fazla">+' + (p.ekip.length - 2) + "</span>" : "";
    var adlar = p.ekip.slice(0, 2).map(function (k, i) { return '<span class="a-ekip-ad">' + KISI[k].ad + (i === 1 ? fazla : "") + "</span>"; }).join("");
    return '<span class="a-hucre-satir" title="' + kacis(tam) + '">' + ikon("users", "a-ikon-kucuk a-kart-ikon") + '<span class="a-ekip">' + adlar + "</span></span>";
  }
  /* Satırda TEK eylem tuşu: Kabul et → Denetime başla → Devam et. 3. tur (reisim): Denetime başla TARİHE BAĞLI DEĞİL —
     denetçi istediği an basar, hareket plan geçmişine yazılır. Kabul et'in İSG-KATİP ön koşulu (§3.2 madde 2) durur. */
  function listeEylem(p) {
    var t = "", not = "", sid = "a-sebep-" + p.id;
    if (p.durum === "bekliyor") {
      t = tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
      if (p.eksik) not = '<div class="a-sebep" id="' + sid + '">' + ikon("triangle-alert", "a-ikon-kucuk") + "<span>" + kacis(p.eksik) + "</span></div>";
    } else if (p.durum === "kabul") {
      t = tus("basla", p, "Denetime başla", "play");
    } else if (p.durum === "denetimde") {
      t = tus("devam", p, "Devam et", "arrow-right");
    } else if (p.durum === "red") {
      not = '<div class="a-not">Gerekçe: ' + kacis(p.gerekce || "") + "</div>";
    }
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

  function cizCipler(t) {
    var h = CIPLER.map(function (c) {
      var n = t.filter(c.test).length, bas = S.secili.indexOf(c.k) >= 0;
      return '<button class="a-cip" type="button" data-cip="' + c.k + '" aria-pressed="' + bas + '">' + kacis(c.ad) +
        ' <span class="a-cip-sayi">' + n + "</span></button>";
    }).join("");
    var az = S.secili.length < 2;
    h += '<div class="a-kip" role="group" aria-label="Seçili çipleri birleştirme" aria-disabled="' + az + '"' +
      ' title="veya: seçili çiplerden herhangi birine uyan planlar · ve: hepsine uyan planlar">' +
      '<button type="button" data-kip="veya" aria-pressed="' + (S.kip === "veya") + '"' + (az ? " disabled" : "") + ">veya</button>" +
      '<button type="button" data-kip="ve" aria-pressed="' + (S.kip === "ve") + '"' + (az ? " disabled" : "") + ">ve</button></div>";
    $("a-cipler").innerHTML = h;
  }
  function cizSeciciler() {
    $("a-seciciler").innerHTML = SECICI.map(function (s) {
      var sec = s.secenek(), gor = sec.filter(function (o) { return o[0] === S[s.k]; })[0];
      return '<div class="a-secici' + (s.siralama ? " a-secici-sira" : "") + '" data-secici="' + s.k + '">' +
        '<button class="a-secici-tus" type="button" aria-haspopup="listbox" aria-expanded="false" data-secici-ac="' + s.k + '">' +
        '<span class="a-secici-etiket">' + s.ad + '</span><span class="a-secici-deger">' + kacis(gor[1]) + "</span>" + ikon("chevron-down", "a-ikon-kucuk") + "</button>" +
        '<div class="a-secici-liste" role="listbox" aria-label="' + s.ad + '" hidden>' +
        sec.map(function (o) {
          return '<button class="a-secenek" type="button" role="option" aria-selected="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' +
            ikon("check", "a-ikon-kucuk") + '<span class="a-kirp">' + kacis(o[1]) + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    $("a-levha-govde").innerHTML = SECICI.map(function (s) {
      return '<div class="a-levha-grup"><p class="a-levha-grup-ad">' + s.ad + '</p><div class="a-levha-secenekler">' +
        s.secenek().map(function (o) {
          return '<button class="a-cip" type="button" aria-pressed="' + (o[0] === S[s.k]) + '" data-sec="' + s.k + '" data-deger="' + kacis(o[0]) + '">' + kacis(o[1]) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    var r = $("a-suzgec-rozet"), n = aktifSecici();
    r.hidden = !n; r.textContent = n || "";
  }
  function bos(tur) {
    var d = {
      yok: ["inbox", "Atanmış plan yok", "Planlama ekibi plan açınca burada görünür.", ""],
      suzgec: ["search", "Süzgece uyan plan yok", "Arama ya da süzgeç değiştirilince liste yeniden dolar.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="temizle">Süzgeci temizle</button>'],
      imkansiz: ["circle-alert", "Bir plan aynı anda iki durumda olamaz", "“ve” seçiliyken iki durum çipi birlikte hiçbir plana uymaz. “veya” ile ikisindeki planlar birlikte listelenir.", '<button class="a-tus a-tus-ikincil" type="button" data-kip="veya">“veya”ya geç</button>'],
      hata: ["refresh-cw", "Planlar yüklenemedi", "Sunucuya bağlanılamadı; liste eski hâliyle gösterilmiyor.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>"],
      plan: ["circle-alert", "Plan bulunamadı", "Bu adresteki plan listede yok ya da artık size atanmış değil.", '<a class="a-tus a-tus-ikincil" href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım'a dön</a>"],
      /* ⛔ 2026-09-23 (2. tur): yükleme hatasında plan içi "bulunamadı" diyordu — plan var olabilir, yüklenemedi (anayasa 2.8 dürüstlük) */
      planHata: ["refresh-cw", "Plan yüklenemedi", "Sunucuya bağlanılamadı; plan eski hâliyle gösterilmiyor.", '<button class="a-tus a-tus-ikincil" type="button" data-eylem="tekrar">' + ikon("refresh-cw", "a-ikon-kucuk") + "Tekrar dene</button>"]
    }[tur];
    return '<div class="a-bos' + (tur === "hata" || tur === "planHata" ? " a-bos-hata" : "") + '" role="status"><div class="a-bos-ikon">' + ikon(d[0]) + "</div>" +
      '<p class="a-bos-baslik">' + d[1] + '</p><p class="a-bos-metin">' + d[2] + "</p>" + d[3] + "</div>";
  }
  function menuSayi() {
    var ms = PLANLAR.filter(function (p) { return p.durum === "bekliyor"; }).length;
    $("a-menu-sayi").textContent = ms || ""; $("a-menu-sayi").hidden = !ms || S.veri !== "dolu";
  }
  /* Sıralama seçicisi yalnız KART kipinde satırda görünür: kip CSS'in kendi kararından okunur (kartta başlık yok). */
  function listeKipi() {
    var th = document.querySelector("#a-liste thead");
    if (th) $("a-suzgec").setAttribute("data-liste-kip", getComputedStyle(th).display === "none" ? "kart" : "tablo");
  }
  function ciz() {
    var t = taban(), liste = sirala(t.filter(cipGecer)), toplam = veri().length;
    cizCipler(t);
    $("a-temizle").disabled = !suzgecVar();
    menuSayi();
    if (S.veri === "hata") { $("a-sayac").innerHTML = "—"; $("a-liste").innerHTML = bos("hata"); return; }
    $("a-sayac").innerHTML = suzgecVar() ? "<b>" + liste.length + "</b> / " + toplam + " plan" : "<b>" + toplam + "</b> plan";
    if (!toplam) { $("a-liste").innerHTML = bos("yok"); return; }
    if (!liste.length) { $("a-liste").innerHTML = bos(imkansiz() ? "imkansiz" : "suzgec"); return; }
    $("a-liste").innerHTML = tabloHtml({ baslik: "Planlarım", sinif: "a-tablo-plan", sutunlar: PLAN_SUTUN, kayitlar: liste, siralanir: true,
      href: function (p) { return "#/plan/" + p.id; } });
    listeKipi();
  }

  /* ── PLAN İÇİ (nesne sayfası, anayasa 2.7: kırıntı + kimlik + bilgi yüzleri + tek birincil tuş + araç çubuğu) ──
     3. tur: üstte EKİPMANLAR (tesisin kalıcı kayıtları; bu plana alınanlar), altta RAPORLAR (bu planda açılanlar),
     en altta PLAN GEÇMİŞİ. Ekipman eklemek ile rapor oluşturmak ayrı iştir. */
  function serit(tur, ik, metin, id) {
    return '<div class="a-serit a-serit-' + tur + '"' + (id ? ' id="' + id + '"' : "") + ">" + ikon(ik, "a-ikon-kucuk") + "<span>" + metin + "</span></div>";
  }
  var calisir = function (p) { return p.durum === "denetimde" || p.durum === "tamam"; };   /* rapor oluşturulabilir */
  var raporuVar = function (p, kod) { return p.rapor.filter(function (r) { return r.kod === kod; })[0]; };
  function planEylem(p) {
    var ikincil = [], birincil = "", not = "", sid = "a-plan-sebep-" + p.id;
    var raporsuz = p.ekp.filter(function (k) { return !raporuVar(p, k); }).length;
    if (p.durum === "bekliyor") {
      ikincil.push(tus("reddet", p, "Reddet", "", false, "a-tus-ikincil"));
      birincil = tus("kabul", p, "Kabul et", "check", !!p.eksik, "", sid);
      if (p.eksik) not = serit("uyari", "triangle-alert", kacis(p.eksik), sid);
    } else if (p.durum === "kabul") {
      birincil = tus("basla", p, "Denetime başla", "play");
    } else if (p.durum === "denetimde") {
      birincil = tus("tamamla", p, "Tamamla", "circle-check");
      /* saat sonrasına ek yazılmaz ("09:04'te" / "16:40'ta" ünlü uyumu değişir) → "Denetim başladı: <zaman>." */
      not = serit("bilgi", "clock", "Denetim başladı: " + zamanYaz(p.basladi) + "." + (raporsuz ? " " + raporsuz + " ekipmanın bu planda raporu yok." : ""));
    } else if (p.durum === "tamam") {
      ikincil.push(tus("geri-al", p, "Tamamlamayı geri al", "undo-2", false, "a-tus-ikincil"));
      not = serit("onay", "circle-check", "Tamamlandı: " + zamanYaz(p.bitti) + ". Raporlar düzenlenebilir; ekipman eklemek için tamamlama geri alınır.");
    } else if (p.durum === "red") {
      not = serit("hata", "circle-x", "Gerekçe: " + kacis(p.gerekce || ""));
    }
    return { tuslar: ikincil.join("") + birincil, not: not };
  }
  function yuz(etiket, ik, deger) {
    return '<div class="a-yuz"><p class="a-yuz-etiket">' + ikon(ik, "a-ikon-kucuk") + etiket + '</p><div class="a-yuz-deger">' + deger + "</div></div>";
  }
  function oncekiHtml(e) {
    if (!e.onceki) return '<span class="a-ilk">İlk kontrol</span>' + (e.eklendi ? '<span class="a-alt-satir">Eklendi: ' + zamanYaz(e.eklendi) + "</span>" : "");
    var sinif = e.onceki.sonuc === "Uygun" ? "" : e.onceki.sonuc === "Kusurlu" ? " a-sonuc-hata" : " a-sonuc-uyari";
    /* kartta sütun başlığı yok → "Önceki kontrol" etiketi yalnız kart kipinde görünür (tabloda başlık söylüyor) */
    return '<span class="a-kart-etiket">Önceki kontrol</span><span class="a-onceki' + sinif + '">' + ayYil(e.onceki.tarih) + " · " + e.onceki.sonuc + '</span><span class="a-alt-satir a-rapor-no">' + e.onceki.rapor + "</span>";
  }
  function planCiz(p) {
    menuSayi();
    if (!p) { $("a-plan").innerHTML = '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım</a></nav>" +
      '<h1 class="a-gizli" tabindex="-1">' + (S.veri === "hata" ? "Plan yüklenemedi" : "Plan bulunamadı") + "</h1>" + bos(S.veri === "hata" ? "planHata" : "plan"); return; }
    var ey = planEylem(p), cubuk = ey.tuslar;
    var isg = !p.isg ? '<span class="a-yuz-uyari">Kayıt yok</span>'
      : kacis(p.isg.no) + '<span class="a-yuz-alt' + (p.eksik ? " a-yuz-uyari" : "") + '">Onay ' + gunKisa(p.isg.onay) + "</span>";
    var m = 0, el = 0;
    p.ekp.forEach(function (k) { if (SICIL[k].tur.b === "m") m++; else el++; });
    /* ── Ekipmanlar (üst): ekipman kalıcıdır, kodla tanınır; bu plandaki raporu "Rapor" sütununda ── */
    var ekpSutun = [
      { k: "kod", baslik: "Kod", kart: "ust", sira: 1, hucre: function (e) { return '<span class="a-kod">' + e.kod + "</span>" + (e.eklendi ? ' <span class="a-rozet a-rozet-yeni">Yeni</span>' : ""); } },
      { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (e) { return '<span class="a-ekipman-ad">' + e.tur.ad + "</span>" + kirp(e.konum, "a-alt-satir"); } },
      { k: "brans", baslik: "Branş", kart: "govde", sira: 3, hucre: function (e) { return '<span class="a-hucre-satir">' + ikon(e.tur.b === "m" ? "cog" : "zap", "a-ikon-kucuk") + bransAd(e.tur.b) + "</span>"; } },
      { k: "onceki", baslik: "Önceki kontrol", kart: "govde", sira: 4, hucre: oncekiHtml },
      { k: "rapor", baslik: "Bu plandaki rapor", kart: "rozet", sira: 1, hucre: function (e) { var r = raporuVar(p, e.kod); return rozet(r ? RAPOR[r.durum] : RAPOR.yok); } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (e) {
        if (!calisir(p) || raporuVar(p, e.kod)) return "";
        return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="rapor-olustur" data-id="' + p.id + '" data-kod="' + e.kod + '">' +
          ikon("file-plus", "a-ikon-kucuk") + "Rapor oluştur</button></div></div>";
      } }
    ];
    /* ── Raporlar (alt): yalnız bu planda açılanlar; numara sunucudan ── */
    var rapSutun = [
      { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<span class="a-rapor-no a-rapor-no-ana">' + r.no + "</span>"; } },
      { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { var e = SICIL[r.kod]; return '<span class="a-kod">' + r.kod + '</span> <span class="a-ekipman-ad">' + e.tur.ad + "</span>"; } },
      { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(RAPOR[r.durum]); } },
      { k: "olustu", baslik: "Oluşturuldu", kart: "govde", sira: 3, hucre: function (r) { return '<span class="a-tarih-saat">' + zamanYaz(r.olustu) + "</span>"; } },
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
        var d = r.durum === "taslak" ? ["pencil", "Raporu düzenle"] : ["file-text", "Raporu aç"];
        return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="kapsam-disi" data-ne="Saha rapor ekranı">' +
          ikon(d[0], "a-ikon-kucuk") + d[1] + "</button></div></div>";
      } }
    ];
    var ekpKayit = p.ekp.map(function (k) { return SICIL[k]; });
    var rapSayim = {}; p.rapor.forEach(function (r) { rapSayim[r.durum] = (rapSayim[r.durum] || 0) + 1; });
    var rapDokum = ["taslak", "onayda", "onaylandi"].filter(function (k) { return rapSayim[k]; }).map(function (k) { return rapSayim[k] + " " + RAPOR[k].ad.toLocaleLowerCase("tr"); }).join(" · ");
    /* en yeni üstte; aynı dakikadaki hareketler kayıt sırasıyla (2026-09-23: "eklendi" ile "rapor oluşturuldu" ters çıkıyordu) */
    var gecmis = p.gecmis.slice().sort(function (a, b) { return a.z < b.z ? 1 : a.z > b.z ? -1 : b.s - a.s; });
    $("a-plan").innerHTML =
      '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlarım</a>" +
        ikon("chevron-right", "a-ikon-kucuk") + '<span aria-current="page">' + p.no + "</span></nav>" +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik">' +
        '<div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.ad) + "</h1>" + rozet(DURUM[p.durum]) + "</div>" +
        '<p class="a-nesne-alt">' + ikon("building-2", "a-ikon-kucuk") + "<span>" + kacis(p.musteri) + "</span></p></div>" +
        (cubuk ? '<div class="a-eylem-cubugu a-eylem-cubugu-ust">' + cubuk + "</div>" : "") + "</div>" +
      ey.not +
      '<div class="a-yuzler">' +
        yuz("Başlangıç", "calendar-check", gunYaz(p.tarih) + (p.tarih === BUGUN ? ' <span class="a-bugun">Bugün</span>' : "") + '<span class="a-yuz-alt">' + p.bas + " – " + p.bit + "</span>") +
        yuz("Adres", "map-pin", kacis(p.adres) + '<span class="a-yuz-alt">' + p.ilce + " / " + p.il + "</span>") +
        yuz("Inspector", "users", p.ekip.map(function (k) { return '<span class="a-yuz-satir">' + KISI[k].ad + ' <span class="a-yuz-ek">' + KISI[k].brans + "</span></span>"; }).join("")) +
        yuz("İSG-KATİP", "shield-check", isg) +
        yuz("Ekipman ve rapor", "wrench", p.ekp.length + " ekipman · " + p.rapor.length + " rapor" + '<span class="a-yuz-alt">' +
          [m ? "Mekanik " + m : "", el ? "Elektrik " + el : ""].filter(Boolean).join(" · ") + "</span>") +
      "</div>" +
      '<section class="a-bolum" aria-labelledby="a-ekipman-baslik"><div class="a-bolum-bas"><h2 id="a-ekipman-baslik">Ekipmanlar</h2>' +
        '<span class="a-sayac">' + p.ekp.length + " ekipman" + (calisir(p) ? " · " + p.ekp.filter(function (k) { return !raporuVar(p, k); }).length + " raporsuz" : "") + "</span>" +
        (p.durum === "denetimde" ? '<button class="a-tus a-tus-ikincil a-bolum-tus" type="button" data-eylem="ekle-ac" data-id="' + p.id + '">' + ikon("plus", "a-ikon-kucuk") + "Ekipman ekle</button>" : "") +
        "</div>" + ((p.durum === "bekliyor" || p.durum === "kabul") ? serit("bilgi", "clock", "Ekipman ekleme ve rapor oluşturma denetime başlayınca açılır.") : "") +
        '<div class="a-liste-kap">' + tabloHtml({ baslik: "Plandaki ekipmanlar", sinif: "a-tablo-ekipman", sutunlar: ekpSutun, kayitlar: ekpKayit }) + "</div></section>" +
      '<section class="a-bolum" aria-labelledby="a-rapor-baslik"><div class="a-bolum-bas"><h2 id="a-rapor-baslik">Raporlar</h2>' +
        '<span class="a-sayac">' + (p.rapor.length ? p.rapor.length + " rapor · " + rapDokum : "0 rapor") + "</span></div>" +
        (p.rapor.length ? '<div class="a-liste-kap">' + tabloHtml({ baslik: "Bu plandaki raporlar", sinif: "a-tablo-rapor", sutunlar: rapSutun, kayitlar: p.rapor }) + "</div>"
          : '<p class="a-bos-satir">' + (calisir(p) ? "Bu planda henüz rapor yok. Rapor, yukarıdaki ekipmanın satırından oluşturulur." : "Rapor, denetime başlandıktan sonra ekipmanın satırından oluşturulur.") + "</p>") +
      "</section>" +
      '<section class="a-bolum" aria-labelledby="a-gecmis-baslik"><div class="a-bolum-bas"><h2 id="a-gecmis-baslik">Plan geçmişi</h2>' +
        '<span class="a-sayac">' + gecmis.length + " hareket</span></div>" +
        '<ol class="a-gecmis">' + gecmis.map(function (g) {
          return '<li><span class="a-gecmis-zaman">' + zamanYaz(g.z) + '</span><span class="a-gecmis-ne"><b>' + g.ne + "</b> · " + KISI[g.kim].ad +
            ' <span class="a-gecmis-rol">' + KISI[g.kim].rol + "</span>" + (g.ayrinti ? '<span class="a-alt-satir">' + kacis(g.ayrinti) + "</span>" : "") + "</span></li>";
        }).join("") + "</ol></section>" +
      (cubuk ? '<div class="a-eylem-cubugu a-eylem-cubugu-alt">' + cubuk + "</div>" : "");
  }

  /* ── EKİPMAN EKLE PENCERESİ ──────────────────────────────────────────────────────────────────────────
     İki yol: (1) tesiste KAYITLI ama bu plana alınmamış ekipmanı seç (seneye gidildiğinde ekipman zaten kayıtlıdır),
     (2) YENİ ekipman: kodu personel etiketten yazar. Kod kuralı: A–Z (Türkçe harf yok), 0–9, tire; 3–20 hane; küçük
     harf büyüğe çevrilir (yalnız A–Z; dile bağlı harf katlama YOK, anayasa 5.5); FİRMADA eşsiz. Çakışan kod kaydedilmez.
     Gerçek uygulamada aynı denetim sunucuda ve veritabanında benzersizlik kısıtıyla da yapılır. */
  var E = { plan: null, sekme: "yeni", kod: "", tur: null, konum: "", seri: "", secili: [], turAra: "", turAcik: false, turEtkin: 0 };
  function kodNormal(v) { return v.replace(/\s+/g, "").replace(/[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function kodDurum(p, kod) {
    if (!kod) return { tur: "bos", metin: "Etiketteki kodu yazın: harf (A–Z), rakam ve tire. Kod firmada eşsiz olmalı." };
    if (/[^A-Z0-9-]/.test(kod)) return { tur: "hata", metin: "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok)." };
    if (kod.length < 3 || kod.length > 20) return { tur: "hata", metin: "Kod 3 ile 20 hane arasında olmalı." };
    if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kod)) return { tur: "hata", metin: "Tire başta, sonda ya da art arda olamaz." };
    var var_ = SICIL[kod];
    if (!var_) return { tur: "tamam", metin: "Kod kullanılabilir; bu firmada başka ekipmanda yok." };
    var tp = bul(var_.tesis);
    if (p.ekp.indexOf(kod) >= 0) return { tur: "hata", metin: kod + " bu planda zaten var: " + var_.tur.ad + " · " + var_.konum + ". Aynı kod iki ekipmana verilemez." };
    if (var_.tesis === p.id) return { tur: "tesiste", metin: kod + " bu tesiste kayıtlı: " + var_.tur.ad + " · " + var_.konum + ". Yeni kayıt açılmaz; kayıtlı ekipmanı plana ekleyin.", kod: kod };
    return { tur: "hata", metin: kod + " başka bir tesiste kayıtlı: " + var_.tur.ad + " · " + tp.musteri + " / " + tp.ad + ". Aynı kod iki ekipmana verilemez." };
  }
  function turListesi() {
    var a = tr(E.turAra.trim());
    return KATALOG.filter(function (t) { return !a || tr(t.ad).indexOf(a) >= 0 || tr(t.k).indexOf(a) >= 0; });
  }
  function ekleCiz(odak, imlec) {
    var p = E.plan, kayitli = Object.keys(SICIL).map(function (k) { return SICIL[k]; })
      .filter(function (e) { return e.tesis === p.id && p.ekp.indexOf(e.kod) < 0; });
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
      var d = kodDurum(p, E.kod), turler = turListesi();
      var tamam = d.tur === "tamam" && !!E.tur;
      govde = '<div class="a-form">' +
        '<div class="a-alan-grup a-alan-kod"><label class="a-etiket" for="a-ekle-kod">Ekipman kodu <span class="a-zorunlu">zorunlu</span></label>' +
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
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-seri">Seri no</label>' +
          '<input class="a-girdi a-girdi-seri" id="a-ekle-seri" autocomplete="off" maxlength="30" value="' + kacis(E.seri) + '"></div>' +
        '<div class="a-alan-grup"><label class="a-etiket" for="a-ekle-konum">Konum / tanım</label>' +
          '<input class="a-girdi" id="a-ekle-konum" autocomplete="off" maxlength="60" placeholder="Kompresör odası" value="' + kacis(E.konum) + '"></div>' +
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
    var r = rota(), planda = !!r, p = planda && S.veri === "dolu" ? bul(r.id) : null;
    $("a-liste-gorunum").hidden = planda; $("a-plan").hidden = !planda;
    if (planda) planCiz(p); else ciz();
    document.title = (p ? p.no + " · " + p.ad : "Planlarım") + " · probata maket";
    if (odakla) {
      window.scrollTo(0, 0);
      var h = document.querySelector(planda ? "#a-plan h1" : "#a-liste-gorunum h1");
      if (h) h.focus({ preventScroll: true });
    }
    if (p && r.ekle && p.durum === "denetimde") ekleAc(p, kodNormal(r.kod)); else ekleKapat();
  }
  function git(id) { if (rota() && rota().id === id && !rota().ekle) goster(false); else location.hash = "#/plan/" + id; }

  /* ── ETKİLEŞİM ────────────────────────────────────────────────────────────────────────────────── */
  var bildirimZaman;
  function bildir(m) {
    $("a-bildirim-metin").textContent = m; $("a-bildirim").classList.add("a-gorunur");
    clearTimeout(bildirimZaman); bildirimZaman = setTimeout(function () { $("a-bildirim").classList.remove("a-gorunur"); }, 2800);
  }
  function listeleriKapat(haric) {
    document.querySelectorAll(".a-secici").forEach(function (s) {
      if (s === haric) return;
      s.querySelector(".a-secici-liste").hidden = true; s.querySelector(".a-secici-tus").setAttribute("aria-expanded", "false");
    });
  }
  function cekmece(ac) {
    $("a-kabuk").classList.toggle("a-cekmece-acik", ac);
    document.querySelector(".a-menu-tus").setAttribute("aria-expanded", String(ac));
  }
  /* Temizle yalnız SÜZGECİ sıfırlar; sıralama süzgeç değildir, kalır. */
  function temizle() { S.ara = ""; S.secili = []; S.kip = "veya"; S.tarih = S.musteri = S.brans = "tumu"; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); }
  var redId = null;

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-cip],[data-kip],[data-sec],[data-secici-ac],[data-sirala],[data-sekme],[data-tur],[data-eylem]");
    if (!e.target.closest(".a-secici")) listeleriKapat(null);
    if (E.turAcik && !e.target.closest(".a-combo")) { E.turAcik = false; ekleCiz(); }
    if (!el) {
      /* tıklanır satır / kart: tuşa ya da bağlantıya basılmadıysa plana girer */
      var satir = e.target.closest("tr[data-href]");
      if (satir && !e.target.closest("a, button")) location.hash = satir.getAttribute("data-href");
      return;
    }
    if (el.dataset.cip) {
      var i = S.secili.indexOf(el.dataset.cip);
      if (i >= 0) S.secili.splice(i, 1); else S.secili.push(el.dataset.cip);
      ciz(); return;
    }
    if (el.dataset.kip) { if (!el.disabled) { S.kip = el.dataset.kip; ciz(); } return; }
    if (el.dataset.sirala) {
      var k = el.dataset.sirala;
      S.sira = S.sira === k + "-artan" ? k + "-azalan" : S.sira === k + "-azalan" ? "varsayilan" : k + "-artan";
      cizSeciciler(); ciz();
      var yeni = document.querySelector('[data-sirala="' + k + '"]'); if (yeni) yeni.focus();
      return;
    }
    if (el.dataset.seciciAc) {
      var kap = el.closest(".a-secici"), l = kap.querySelector(".a-secici-liste"), acik = l.hidden;
      listeleriKapat(kap); l.hidden = !acik; el.setAttribute("aria-expanded", String(acik));
      if (acik) (l.querySelector('[aria-selected="true"]') || l.firstElementChild).focus();
      return;
    }
    if (el.dataset.sec) { S[el.dataset.sec] = el.dataset.deger; cizSeciciler(); ciz(); return; }
    if (el.dataset.sekme) { E.sekme = el.dataset.sekme; ekleCiz(); return; }
    if (el.dataset.tur) { E.tur = KATALOG.filter(function (t) { return t.k === el.dataset.tur; })[0]; E.turAcik = false; E.turAra = ""; ekleCiz("a-ekle-seri"); return; }
    var id = +el.dataset.id, p = bul(id);
    switch (el.dataset.eylem) {
      case "cekmece-ac": cekmece(true); break;
      case "cekmece-kapat": cekmece(false); break;
      case "tema":
        var tema = document.documentElement.getAttribute("data-tema") === "koyu" ? "acik" : "koyu";
        document.documentElement.setAttribute("data-tema", tema);
        try { localStorage.setItem("probata-tema", tema); } catch (x) {}
        temaEtiketi(); break;
      case "ara-sil": S.ara = ""; $("a-ara-girdi").value = ""; $("a-ara").classList.remove("a-dolu"); ciz(); $("a-ara-girdi").focus(); break;
      case "temizle": temizle(); cizSeciciler(); ciz(); break;
      case "levha-ac": $("a-levha").showModal(); break;
      case "levha-kapat": $("a-levha").close(); break;
      case "tekrar": S.veri = "dolu"; goster(false); break;
      case "kabul": if (p && p.durum === "bekliyor" && !p.eksik) { p.durum = "kabul"; kaydet(p, simdi(), BEN, "Plan kabul edildi"); goster(false); bildir("Plan kabul edildi."); } break;
      case "basla":
        if (p && p.durum === "kabul") { p.durum = "denetimde"; p.basladi = simdi(); kaydet(p, simdi(), BEN, "Denetime başlandı"); bildir("Denetim başladı."); git(id); }
        break;
      case "devam": if (p) git(id); break;
      case "tamamla": if (p && p.durum === "denetimde") { p.durum = "tamam"; p.bitti = simdi(); kaydet(p, simdi(), BEN, "Plan tamamlandı"); goster(false); bildir("Plan tamamlandı."); } break;
      case "geri-al": if (p && p.durum === "tamam") { p.durum = "denetimde"; kaydet(p, simdi(), BEN, "Tamamlama geri alındı"); goster(false); bildir("Tamamlama geri alındı; plan yeniden denetime açıldı."); } break;
      case "rapor-olustur":
        if (p && calisir(p) && !raporuVar(p, el.dataset.kod)) {
          var r = { no: raporNo("0926", raporSira++), kod: el.dataset.kod, durum: "taslak", olustu: simdi() };
          p.rapor.push(r); kaydet(p, simdi(), BEN, "Rapor oluşturuldu", r.no + " · " + r.kod);
          goster(false); bildir("Rapor oluşturuldu: " + r.no + ". Saha rapor ekranı bu maketin kapsamında değil.");
        }
        break;
      case "ekle-ac": if (p && p.durum === "denetimde") ekleAc(p); break;
      case "ekle-kapat": ekleKapat(); break;
      case "tesistekini-sec": E.sekme = "kayitli"; E.secili = [el.dataset.kod]; ekleCiz(); break;
      case "kayitli-ekle":
        if (E.plan && E.secili.length) {
          var pl = E.plan, n = E.secili.length;
          E.secili.forEach(function (kod) { pl.ekp.push(kod); kaydet(pl, simdi(), BEN, "Kayıtlı ekipman plana alındı", kod + " · " + SICIL[kod].tur.ad); });
          ekleKapat(); goster(false); bildir(n + " kayıtlı ekipman plana eklendi.");
        }
        break;
      case "yeni-kaydet":
        if (E.plan && E.tur && kodDurum(E.plan, E.kod).tur === "tamam") {   /* kaydetmeden önce yeniden denetlenir */
          var pk = E.plan, kod = E.kod;
          SICIL[kod] = { kod: kod, tur: E.tur, konum: E.konum.trim() || "Konum yazılmadı", tesis: pk.id, onceki: null, eklendi: simdi(), seri: E.seri.trim() };
          pk.ekp.push(kod); kaydet(pk, simdi(), BEN, "Ekipman eklendi", kod + " · " + E.tur.ad);
          ekleKapat(); goster(false); bildir(kod + " plana eklendi. Raporu satırındaki “Rapor oluştur” açar.");
        }
        break;
      case "reddet":
        if (!p) break;
        redId = id; $("a-red-gerekce").value = ""; $("a-red-onay").disabled = true;
        $("a-red-ozet").innerHTML = "<b>" + kacis(p.ad) + "</b> · " + p.no + "<br>" + kacis(p.musteri) + "<br>" + gunYaz(p.tarih) + " · " + p.bas + " – " + p.bit;
        $("a-red-ipucu").className = "a-ipucu"; $("a-red-ipucu").hidden = false; $("a-red-pencere").showModal(); $("a-red-gerekce").focus(); break;
      case "pencere-kapat": $("a-red-pencere").close(); break;
      case "kapsam-disi": bildir("Maket: " + el.dataset.ne + " bu maketin kapsamında değil."); break;
    }
  });
  document.addEventListener("change", function (e) {
    var k = e.target.dataset && e.target.dataset.kayitli;
    if (!k) return;
    var i = E.secili.indexOf(k);
    if (e.target.checked && i < 0) E.secili.push(k); else if (!e.target.checked && i >= 0) E.secili.splice(i, 1);
    ekleCiz();
    var geri = document.querySelector('[data-kayitli="' + k + '"]'); if (geri) geri.focus();
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "a-ekle-kod") {
      var ham = t.value, nor = kodNormal(ham), yer = Math.max(0, t.selectionStart - (ham.length - nor.length));
      E.kod = nor; ekleCiz("a-ekle-kod", yer); return;
    }
    if (t.id === "a-ekle-tur") { E.turAra = t.value; E.tur = null; E.turAcik = true; E.turEtkin = 0; ekleCiz("a-ekle-tur", t.selectionStart); return; }
    if (t.id === "a-ekle-konum") { E.konum = t.value; return; }
    if (t.id === "a-ekle-seri") { E.seri = t.value; return; }
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.id === "a-ekle-tur" && !E.turAcik) { E.turAcik = true; E.turAra = ""; E.turEtkin = 0; ekleCiz("a-ekle-tur"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.id === "a-ekle-tur" && E.turAcik) {
      var l = turListesi();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); E.turEtkin = (E.turEtkin + (e.key === "ArrowDown" ? 1 : l.length - 1)) % Math.max(l.length, 1); ekleCiz("a-ekle-tur"); return; }
      if (e.key === "Enter") { e.preventDefault(); if (l[E.turEtkin]) { E.tur = l[E.turEtkin]; E.turAcik = false; E.turAra = ""; ekleCiz("a-ekle-seri"); } return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); E.turAcik = false; ekleCiz("a-ekle-tur"); return; }
    }
    if (e.key !== "Escape") return;
    var acik = document.querySelector('.a-secici-tus[aria-expanded="true"]');
    if (acik) { listeleriKapat(null); acik.focus(); return; }
    if ($("a-kabuk").classList.contains("a-cekmece-acik")) cekmece(false);
  }, true);
  $("a-ara-girdi").addEventListener("input", function (e) {
    S.ara = e.target.value; $("a-ara").classList.toggle("a-dolu", !!S.ara); ciz();   /* girdi yeniden çizilmez: odak çalınmaz */
  });
  $("a-red-gerekce").addEventListener("input", function (e) {
    var yeter = e.target.value.trim().length >= 3;
    $("a-red-onay").disabled = !yeter; $("a-red-ipucu").hidden = yeter;
  });
  $("a-red-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var g = $("a-red-gerekce").value.trim();
    if (g.length < 3) { $("a-red-ipucu").hidden = false; $("a-red-ipucu").className = "a-ipucu a-ipucu-uyari"; return; }
    var p = bul(redId);
    if (p && p.durum === "bekliyor") { p.durum = "red"; p.gerekce = g; kaydet(p, simdi(), BEN, "Plan reddedildi", "Gerekçe: " + g); }
    $("a-red-pencere").close(); goster(false); bildir("Plan reddedildi; gerekçe planlama ekibine gider.");
  });
  /* pencere kapanınca adres plan içine döner (sunum çerçevesi #/plan/1/ekle ile açar) */
  $("a-ekle-pencere").addEventListener("close", function () {
    var r = rota(); if (r && r.ekle) history.replaceState(null, "", "#/plan/" + r.id);
  });
  window.addEventListener("hashchange", function () { goster(true); });
  window.addEventListener("resize", function () { if (!$("a-liste-gorunum").hidden) listeKipi(); });
  function temaEtiketi() {
    var k = document.documentElement.getAttribute("data-tema") === "koyu";
    $("a-tema-tus").setAttribute("aria-label", k ? "Açık temaya geç" : "Koyu temaya geç");
  }

  temaEtiketi(); cizSeciciler(); goster(false);
})();
