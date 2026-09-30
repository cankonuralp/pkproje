/* ══ probata MAKET — Planlar + plan içi (2026-09-23 · 5. tur; 2026-09-24 ortak üreticilere bağlandı) ════════════
   ⛔ Tüm veri UYDURMADIR (anayasa 10.3); gerçek firma, kişi, tesis, adres, sözleşme ve ekipman kodu yok.
   ⛔ "Bugün" sabit: 2026-09-23, saat 16:40 — ölçüm her açılışta aynı sonucu versin.
   Adres: ?veri=dolu|bos|hata · ?tema=acik|koyu · #/plan/<id> = plan içi ·
          #/plan/<id>/ekle[/<KOD>] = ekipman ekle penceresi (sunum çerçeveleri için).
   2. tur: liste sütunları örnek listeden; satırda tek tuş Kabul et → Denetime başla → Devam et (2026-09-29: Denetime başla kalktı).
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
  var FIRMA_KOD = "KM";   /* örnek verideki numaraların firma kodu; yeni rapor Firma ayarları'ndaki kodla (MV.firmaKodu, 202) */
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

  /* plan listesi ortak veride (MV.PLANLAR, 2026-09-29): yan menü balonu her sayfada aynı listeden sayar (35. tur 163); kalıcılığı ortak veri
     katmanı sağlar (MK.kaliciMV) */
  var PLANLAR = MV.PLANLAR;

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
  /* ⛔ 2026-09-29 (ölçerken bulundu): plan listesi ortak veriye geçince (U4) plan her açılışta örnek veriden yeniden kuruluyordu → plan içinde
     oluşturulan rapor, eklenen ekipman, hareket ve notlar sayfa yenilenince kayboluyordu. Tarayıcıda kayıtlı hâli olan plan (ekipman, rapor,
     hareket listeleri ortak kayıttan geldiyse) yeniden kurulmaz; örnek veri yalnız ilk açılışta. */
  var KAYITLI = {};
  PLANLAR.forEach(function (p) { if (Array.isArray(p.ekp) && Array.isArray(p.rapor) && Array.isArray(p.gecmis)) KAYITLI[p.id] = true; });
  PLANLAR.forEach(function (p) {
    if (KAYITLI[p.id]) { p.sonradan = p.sonradan || []; return; }
    p.ekp = []; p.sonradan = []; p.rapor = []; p.gecmis = [];
    if (p.ortak) {   /* plan 10: ekipman ortak veriden (kod sırası kaymaz) */
      MV.EKIPMAN.filter(function (e) { return e.plan === p.id; }).forEach(function (e, i) {
        var o = e.onceki ? { tarih: e.onceki.tarih, sonuc: e.onceki.sonuc, rapor: e.onceki.rapor } : null;
        SICIL[e.kod] = { kod: e.kod, tur: KATALOG.filter(function (t) { return t.k === e.tur; })[0], konum: e.konum, tesis: p.id, onceki: o, eklendi: e.ilk ? "2026-09-23T13:" + (40 + i) : null };
        p.ekp.push(e.kod); if (e.ilk) p.sonradan.push(e.kod);
      });
      return;
    }
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
    if (KAYITLI[id]) return;
    ["onaylandi", "onayda", "taslak"].forEach(function (d) { for (var k = 0; k < (p.rap[d] || 0); k++) dagilim.push(d); });
    dagilim.forEach(function (d, k) {
      if (d === "onaylandi" && id === 9 && k < 10) d = "imzali";   /* 106 (2026-09-26): Raporlar maketiyle aynı — plan 9'da 10 imzalı */
      var dak = 10 + k * 6, saat = p.basladi.slice(0, 11) + ("0" + (+p.basladi.slice(11, 13) + Math.floor(dak / 60))).slice(-2) + ":" + ("0" + (dak % 60)).slice(-2);
      p.rapor.push({ no: raporNo("0926", raporSira++), kod: p.ekp[k], durum: d, olustu: saat, sonuc: d === "taslak" ? null : SONUC[(k + id) % SONUC.length] });
    });
  });
  /* plan 10 raporları ortak veriden (aynı numara, durum, sonuç) */
  PLANLAR.filter(function (p) { return p.ortak && !KAYITLI[p.id]; }).forEach(function (p) {
    MV.RAPORLAR.filter(function (r) { return r.plan === p.id; }).forEach(function (r) { p.rapor.push({ no: r.no, kod: r.kod, durum: r.durum, olustu: r.olustu, sonuc: r.sonuc }); raporSira++; });
  });   /* sıra kesintisiz: yeni açılan rapor plan 10'un raporlarından sonra numara alır */
  /* Hareket kaydı (reisim: "istediği zaman istediği tepkiyi verebilsin, bu hareketler kayıt altında kalsın") */
  function kaydet(p, zaman, kim, ne, ayrinti) { p.gecmis.push({ z: zaman, kim: kim, ne: ne, ayrinti: ayrinti || "", s: p.gecmis.length }); }
  /* 2026-09-26 (reisim): plan saat taşımaz, başlangıç ve bitiş TARİHİ taşır (plan için belirlenen süre) */
  PLANLAR.forEach(function (p) { p.bitTarih = p.bitTarih || p.tarih; });
  PLANLAR.forEach(function (p) {
    if (KAYITLI[p.id]) return;
    kaydet(p, p.acildi, "za", "Plan açıldı", p.ekp.length - p.sonradan.length + " ekipman · " + p.ekip.map(function (k) { return KISI[k].ad; }).join(", "));
    if (p.kabul) kaydet(p, p.kabul, BEN, "Plan kabul edildi", "Tarafsızlık beyanı onaylandı");
    if (p.reddedildi) kaydet(p, p.reddedildi, BEN, "Plan reddedildi", "Gerekçe: " + p.gerekce);
    if (p.basladi) kaydet(p, p.basladi, BEN, "Denetime başlandı");
    p.sonradan.forEach(function (k) { var e = SICIL[k]; kaydet(p, e.eklendi, BEN, "Ekipman eklendi", k + " · " + e.tur.ad); });
    p.rapor.forEach(function (r) { kaydet(p, r.olustu, BEN, "Rapor oluşturuldu", r.no + " · " + r.kod); });
    if (p.bitti) kaydet(p, p.bitti, BEN, "Plan tamamlandı");
  });
  if (!KAYITLI[PLANLAR[0].id]) kaydet(PLANLAR[0], "2026-09-22T15:20", "za", "Not", "Tesis 12:00–13:00 arası öğle arası veriyor; bu saatte üretim holüne girilmiyor.");

  /* ── SAYFALAR ARASI KALICI (2026-09-28, Kalem M; reisim: "tüm site maket üzerinde aktif çalışabilsin") ─────────────────────────
     Planlar'ın kendi durumu (planlar, sicil, numara sırası) tarayıcıda saklanır (MK.kalici); Plan aç'ta açılan planlar (MV.ACILAN_PLANLAR)
     listeye alınır; burada eklenen ekipman ve oluşturulan rapor ortak kayda (MV.EKIPMAN · MV.RAPORLAR) yazılır → saha raporu, Onaylar,
     Raporlar aynı kaydı görür; rapor durumları ortak kayıttan okunur (onay, geri gönderme, imza başka ekranda olur). */
  MV.PERSONEL.forEach(function (x) { if (!KISI[x.id]) KISI[x.id] = { ad: x.ad, brans: "", rol: "Inspector" }; });
  var turBul = function (k) { return KATALOG.filter(function (t) { return t.k === k; })[0] || MV.tur(k); };
  MK.kalici("planlar", function () {
    return { sicil: Object.keys(SICIL).map(function (k) { return Object.assign({}, SICIL[k], { tur: SICIL[k].tur.k }); }), raporSira: raporSira, kodSira: kodSira };
  }, function (d) {
    Object.keys(SICIL).forEach(function (k) { delete SICIL[k]; }); d.sicil.forEach(function (x) { x.tur = turBul(x.tur); SICIL[x.kod] = x; });
    raporSira = d.raporSira; kodSira = d.kodSira;
  });
  var tesisOf = function (p) { if (p.tesis) return p.tesis; var t = MV.TESISLER.filter(function (x) { return x.pid === p.id; })[0]; return t ? t.id : null; };
  function ortakEkipman(p, kod) {
    var x = SICIL[kod], e = MV.ekipman(kod);
    if (e) { e.plan = p.id; return; }
    MV.EKIPMAN.push({ kod: kod, tur: x.tur.k, tesis: tesisOf(p), konum: x.konum, onceki: null, ilk: true, plan: p.id, marka: "", model: "", imal: "", seri: x.seri || "" });
  }
  function ortakRapor(p, r) {
    if (MV.rapor(r.no)) return;
    var e = MV.ekipman(r.kod), b = MV.tur(e.tur).b, kisi = p.ekip.filter(function (k) { var x = MV.kisi(k), m = x && MV.meslek(x.meslek); return m && m.g.indexOf(MV.tur(e.tur).g) >= 0; })[0] || (b === "e" ? "ea" : "mk");
    MV.RAPORLAR.push({ no: r.no, kod: r.kod, tesis: e.tesis, plan: p.id, kisi: kisi, olustu: r.olustu, durum: r.durum, sonuc: null, gonderildi: null, onay: null, imza: null });
  }
  /* Plan aç'ta açılan planlar: tesisin kayıtlı ekipmanı kapsamda, yeni ekipmanı denetçi sahada ekler */
  MV.ACILAN_PLANLAR.forEach(function (a) {
    if (PLANLAR.some(function (p) { return p.no === a.no; })) return;
    var t = MV.tesis(a.tesis), ekp = a.ekp.map(MV.ekipman).filter(Boolean);
    var p = { id: a.id, no: a.no, ad: t.ad, musteri: MV.musteri(t.m).unvan, adres: t.adres, ilce: t.ilce, il: t.il, tarih: a.tarih, bitTarih: a.bitTarih || a.tarih,
      bas: t.psaat ? t.psaat[0] : "09:00", bit: t.psaat ? t.psaat[1] : "17:00", ekip: a.ekip.slice(), m: ekp.filter(function (e) { return MV.tur(e.tur).b === "m"; }).length,
      e: ekp.filter(function (e) { return MV.tur(e.tur).b === "e"; }).length, durum: "bekliyor", acildi: a.acildi, isg: a.isg ? { no: a.isg, onay: null } : null, aciklama: a.aciklama,
      tesis: a.tesis, ekp: [], sonradan: [], rapor: [], gecmis: [] };
    ekp.forEach(function (e) {
      if (!SICIL[e.kod]) SICIL[e.kod] = { kod: e.kod, tur: turBul(e.tur), konum: e.konum, tesis: p.id, onceki: e.onceki ? { tarih: e.onceki.tarih, sonuc: e.onceki.sonuc, rapor: e.onceki.rapor } : null, eklendi: null };
      p.ekp.push(e.kod); e.plan = p.id;
    });
    kaydet(p, p.acildi, "za", "Plan açıldı", p.ekp.length + " ekipman · " + p.ekip.map(function (k) { return KISI[k].ad; }).join(", "));
    PLANLAR.push(p);
  });
  /* saha rapor ekranında "Kaydet ve kopyala" ile açılan ekipman ve rapor (2026-09-30, 204–209) ortak kayıttan plana girer; plan hangi
     hâlde olursa olsun (örnek veriden kurulmuş ya da tarayıcıda kayıtlı). Rapor sırası ortak kayıttaki en büyük sıranın ardından sürer. */
  var siraOku = function (no) { var m = /^[^-]+-\d{4}-(\d+)-/.exec(no || ""); return m ? +m[1] : 0; };
  PLANLAR.forEach(function (p) {
    MV.EKIPMAN.filter(function (e) { return e.plan === p.id && e.kopyaKaynak && p.ekp.indexOf(e.kod) < 0; }).forEach(function (e) { p.ekp.push(e.kod); p.sonradan.push(e.kod); });
    p.ekp.forEach(function (kod) {
      var e = MV.ekipman(kod);
      if (!SICIL[kod] && e) SICIL[kod] = { kod: kod, tur: turBul(e.tur), konum: e.konum, tesis: p.id, onceki: null, eklendi: e.eklendi || null, seri: e.seri || "" };
    });
    MV.RAPORLAR.filter(function (r) { return r.plan === p.id && !p.rapor.some(function (x) { return x.no === r.no; }); }).forEach(function (r) {
      p.rapor.push({ no: r.no, kod: r.kod, durum: r.durum, olustu: r.olustu, sonuc: r.sonuc });
    });
  });
  MV.RAPORLAR.forEach(function (r) { raporSira = Math.max(raporSira, siraOku(r.no) + 1); });
  /* rapor durumu ortak kayıttan (onay, geri gönderme, imza başka ekranda) */
  /* pasife alınan (inspector) ve yöneticinin sildiği rapor da ortak kayıttan (2026-09-28, T2) */
  PLANLAR.forEach(function (p) {
    p.rapor = p.rapor.filter(function (r) { return !!MV.rapor(r.no); });
    p.rapor.forEach(function (r) { var m = MV.rapor(r.no); r.durum = m.durum === "geri" ? "taslak" : m.durum; r.sonuc = m.sonuc; r.pasif = !!m.pasif; });
  });

  var DURUM = {
    bekliyor: { ad: "Kabul bekliyor", rozet: "a-rozet-bekliyor", sira: 0 },
    kabul: { ad: "Kabul edildi", rozet: "a-rozet-kabul", sira: 1 },
    denetimde: { ad: "Denetimde", rozet: "a-rozet-denetimde", sira: 2 },
    tamam: { ad: "Tamamlandı", rozet: "a-rozet-tamam", sira: 3 },
    red: { ad: "Reddedildi", rozet: "a-rozet-red", sira: 4 }
  };
  var RAPOR = {
    /* reisim 2026-09-26: rapor durumları kronolojik — Yeni · Teknik yönetici onayında · Muayene uzmanı imzası · İmzaya gönderildi · Tamamlandı */
    taslak: { ad: "Yeni", rozet: "a-rozet-bekliyor" },
    onayda: { ad: "Teknik yönetici onayında", rozet: "a-rozet-kabul" },
    onaylandi: { ad: "Muayene uzmanı imzası", rozet: "a-rozet-denetimde" },
    imzada: { ad: "İmzaya gönderildi", rozet: "a-rozet-notr" },
    imzali: { ad: "Tamamlandı", rozet: "a-rozet-tamam" },
    yok: { ad: "Rapor yok", rozet: "a-rozet-notr" }
  };

  /* ortak üreticiler (docs/assets/maket-ortak.js) — yerel adlar aynı kalsın diye */
  var $ = MK.$, kacis = MK.kacis, ikon = MK.ikon, gunYaz = MK.gunYaz, gunKisa = MK.gunKisa, ayYil = MK.ayYil, zamanYaz = MK.zamanYaz;
  var simdi = MK.simdi, tr = MK.tr, kirp = MK.kirp, rozet = MK.rozet, bilgi = MK.bilgi, serit = MK.serit, SZ = MK.SZ;
  var bul = function (id) { return PLANLAR.filter(function (x) { return x.id === id; })[0]; };
  var bransAd = function (b) { return b === "m" ? "Mekanik" : "Elektrik"; };
  var raporlar = function (p) { return p.rapor.filter(function (r) { return !r.pasif; }); };   /* pasif rapor inspector'da görünmez (2026-09-28, T2) */
  var raporuVar = function (p, kod) { return raporlar(p).filter(function (r) { return r.kod === kod; })[0]; };
  /* rapor oluşturulabilir: kabul edilen plan da (2026-09-29, reisim: "Planı kabul ettikten sonra denetime başla tuşu olmasına gerek yok
     gereksiz") — ilk rapor oluşturulunca plan kendiliğinden "Denetimde" olur, başlama zamanı o an */
  var calisir = function (p) { return p.durum === "kabul" || p.durum === "denetimde" || p.durum === "tamam"; };
  var ekipmanAcik = function (p) { return p.durum === "kabul" || p.durum === "denetimde"; };   /* ekipman eklenir, Excel'den yüklenir */

  var q = new URLSearchParams(location.search);
  var VERI = q.get("veri") || "dolu";
  var AKTIF = null;   /* açık plan (plan içi süzgeçleri bu plana bakar) */
  var NOTLAR_ACIK = false;

  /* ══ SÜZGEÇ TANIMLARI (üretici ortak: kalıp 15) ═══════════════════════════════════════════════════════════
     Üç süzgeç: l = Planlar listesi · e = plan içi ekipmanlar · r = plan içi raporlar. */
  /* Planlar listesi (2026-09-28; reisim: "Planlar ekranındaki filtreleme kısmıda yine istediğim gibi değil anlamsız filtreleme tuşları var proje
     için ayrı proje no için ayrı"): durum çipleri ve veya / ve anahtarı kalktı, durum bir seçici; proje adı ve proje no ayrı kutular */
  var CIP_L = [];
  var CIP_E = [
    { k: "raporsuz", ad: "Raporu yok", grup: "rapor", test: function (e) { return !raporuVar(AKTIF, e.kod); } },
    { k: "raporlu", ad: "Raporu var", grup: "rapor", test: function (e) { return !!raporuVar(AKTIF, e.kod); } },
    { k: "sonradan", ad: "Denetimde eklendi", test: function (e) { return AKTIF.sonradan.indexOf(e.kod) >= 0; } },
    { k: "kusur", ad: "Önceki kontrolde kusur", test: function (e) { return !!e.onceki && e.onceki.sonuc !== "Uygun"; } }
  ];
  var CIP_R = [
    { k: "taslak", ad: "Yeni", grup: "durum", test: function (r) { return r.durum === "taslak"; } },
    { k: "onayda", ad: "Teknik yönetici onayında", grup: "durum", test: function (r) { return r.durum === "onayda"; } },
    { k: "onaylandi", ad: "Muayene uzmanı imzası", grup: "durum", test: function (r) { return r.durum === "onaylandi"; } },
    { k: "imzali", ad: "Tamamlandı", grup: "durum", test: function (r) { return r.durum === "imzali"; } }
  ];
  /* Sıralama (yalnız Planlar): tabloda sütun başlığı, kart kipinde "Sıralama" seçicisi; ikisi de aynı değeri yazar. */
  var SIRA_ANAHTAR = {
    no: function (p) { return p.no; }, ad: function (p) { return p.ad; }, musteri: function (p) { return p.musteri; },
    adres: function (p) { return p.il + " " + p.ilce + " " + p.adres; }, ekip: function (p) { return KISI[p.ekip[0]].ad; },
    baslangic: function (p) { return p.tarih + " " + p.bas; }, durum: function (p) { return DURUM[p.durum].sira; }
  };
  var SIRA_AD = { no: "Proje no", ad: "Proje adı", musteri: "Müşteri", adres: "Adres", ekip: "Inspector", baslangic: "Başlangıç", durum: "Durum" };
  function siraEtiket(v) {
    if (v === "varsayilan") return "En yeni tarih önce";
    var x = v.split("-"), artan = x[1] === "artan";
    var yon = x[0] === "baslangic" ? (artan ? "yakın → uzak" : "uzak → yakın") : x[0] === "no" ? (artan ? "küçükten büyüğe" : "büyükten küçüğe")
      : x[0] === "durum" ? (artan ? "akış sırası" : "ters akış") : (artan ? "A → Z" : "Z → A");
    return SIRA_AD[x[0]] + ": " + yon;
  }
  var SIRA_TEMEL = ["varsayilan", "baslangic-artan", "baslangic-azalan", "musteri-artan", "no-artan"];
  var SEC_L = [
    { k: "durum", ad: "Durum", secenek: function () { return [["tumu", "Tümü"]].concat(Object.keys(DURUM).map(function (k) { return [k, DURUM[k].ad]; })); },
      gecer: function (p, v) { return v === "tumu" || p.durum === v; } },
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
    { k: "brans", ad: "Branş", secenek: function () { return [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]]; }, gecer: function (e, v) { return v === "tumu" || e.tur.b === v; } }
  ];
  MK.suzgecTanimla("l", { ad: "Planlarda ara", ipucu: "Proje, müşteri, il", birim: "plan", cipler: CIP_L, seciciler: SEC_L,
    alanlar: [
      { k: "ad", ad: "Proje adı", ipucu: "ör. fabrika", metin: function (p) { return p.ad; } },
      { k: "no", ad: "Proje no", ipucu: "ör. P-0926-03", metin: function (p) { return p.no; } }
    ],
    metin: function (p) { return [p.no, p.ad, p.musteri, p.adres, p.ilce, p.il].join(" "); },
    imkansiz: "Bir plan aynı anda iki durumda olamaz" }, function () { ciz(); });
  /* plan içi süzgeçler alan alan (§3.8 kural 6; reisim 2026-09-28: "ekipman türü, ekipman kodu … rapor numarası … genel ara olmasın") */
  MK.suzgecTanimla("e", { ad: "Ekipmanlarda ara", ipucu: "Kod, tür, konum", birim: "ekipman", cipler: CIP_E, seciciler: SEC_E, sayfa: SAYFA.e,
    alanlar: [
      { k: "tur", ad: "Ekipman türü", ipucu: "ör. kompresör", metin: function (e) { return e.tur.ad; } },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. KP-10", metin: function (e) { return e.kod; } }
    ],
    metin: function (e) { return [e.kod, e.tur.ad, e.konum].join(" "); },
    imkansiz: "Bir ekipmanın raporu hem var hem yok olamaz" }, function () { listeCiz("e"); });
  MK.suzgecTanimla("r", { ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", cipler: CIP_R, seciciler: [], sayfa: SAYFA.r,
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. KM-0926-7", metin: function (r) { return r.no; } },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. ET-10", metin: function (r) { return r.kod; } }
    ],
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
    if (v === "varsayilan") {   /* 2026-09-26 (reisim: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun"); 2026-09-28 (reisim: "en yeni tarihli
      en son açılan plan her zaman en üstte olacak tarihe göre sıralama olacak"): varsayılan sıra planın TARİHİ, en yeni tarih üstte; aynı günde
      en son açılan üstte (açılış zamanına göre sıralama yanlış anlamaydı, kalktı) */
      return l.slice().sort(function (a, b) { return b.tarih.localeCompare(a.tarih) || (b.acildi || "").localeCompare(a.acildi || "") || b.bas.localeCompare(a.bas); });
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
     2026-09-30 (L2, reisim: "isg katip sözleşmesi yok diyipte plan kabul edememezlik olmasın"): İSG-KATİP ön koşulu
     kalktı, eksik yalnız uyarı şeridi; Kabul et'i yalnız okunmamış tarafsızlık beyanı kapatır. */
  /* 2026-09-26 (reisim: "kabul etme işi planın içinde olsun ki denetçi tarafsızlık beyanını okuyarak kabul etsin … kabul et yazan yerde
     sadece görüntüle yazsın daha sonra değişmesin"): listede her durumda tek tuş "Görüntüle" */
  function listeEylem(p) {
    return '<div class="a-eylem"><div class="a-eylem-tuslar"><a class="a-tus a-tus-ikincil" href="#/plan/' + p.id + '">' + ikon("eye", "a-ikon-kucuk") + "Görüntüle</a></div></div>";
  }
  /* kartta (telefon) şirket adı en üstte, işletmesi (proje adı) altında (reisim 2026-09-28: "şirket adı en üstte olsun");
     kalın olan müşteri adı, proje adı normal (reisim 2026-09-29: "Proje adı daha kalın gözüküyor, böyle olmasın Müşteri isimleri kalın olsun") */
  var PLAN_SUTUN = [
    { k: "no", baslik: "Proje no", kart: "ust", sira: 1, hucre: function (p) { return '<a class="a-no" href="#/plan/' + p.id + '">' + p.no + "</a>"; } },
    { k: "ad", baslik: "Proje adı", kart: "govde", sira: 3, hucre: function (p) { return kirp(p.ad); } },
    { k: "musteri", baslik: "Müşteri", kart: "govde", sira: 2, hucre: function (p) { return '<span class="a-hucre-satir">' + ikon("building-2", "a-ikon-kucuk a-kart-ikon") + kirp(p.musteri, "a-musteri-ad") + "</span>"; } },
    { k: "adres", baslik: "Adres", kart: "govde", sira: 5, hucre: function (p) {
      return '<span class="a-hucre-satir">' + ikon("map-pin", "a-ikon-kucuk a-kart-ikon") + '<span class="a-adres">' +
        kirp(p.adres, "a-adres-sokak", p.adres + ", " + p.ilce + " / " + p.il) + '<span class="a-adres-il">' + p.ilce + " / " + p.il + "</span></span></span>";
    } },
    { k: "ekip", baslik: "Inspector", kart: "govde", sira: 6, hucre: ekipHtml },
    { k: "baslangic", baslik: "Başlangıç", kart: "govde", sira: 4, hucre: function (p) {
      return '<span class="a-tarih-gun">' + tno(p.tarih) + "</span>" + (p.bitTarih !== p.tarih ? '<span class="a-tarih-saat">– ' + tno(p.bitTarih) + "</span>" : "");
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (p) { return rozet(DURUM[p.durum]); } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: listeEylem }
  ];
  function ciz() {
    var hepsi = VERI === "dolu" ? PLANLAR : [], tb = MK.taban("l", hepsi), liste = sirala(tb.filter(function (p) { return MK.cipGecer("l", p); }));
    MK.cipCiz("l", tb);
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
    if (p.durum === "bekliyor") return tus("reddet", p, "Reddet", "", false, "a-tus-ikincil") + tus("kabul", p, "Kabul et", "check", !p.beyanOkundu, "", sid);   /* 2026-09-30 (L2): İSG-KATİP eksiği kabulü engellemez, yalnız uyarı */
    /* 2026-09-29 (reisim: "ekipman ekleme kısmında tamamla tuşu olsun diyince kontrol listesi tamamlandı desin sonra en aşağıda tamamla
       yazsın ona tıklayınca komple tamamlandı olsun"): iki adım — Denetim'de kontrol listesi, en altta plan */
    if (p.durum === "denetimde") return p.kontrolTamam ? tus("tamamla", p, "Tamamla", "circle-check") : tus("kontrol-tamamla", p, "Tamamla", "list-checks");
    if (p.durum === "tamam") return tus("geri-al", p, "Tamamlamayı geri al", "undo-2", false, "a-tus-ikincil") + tus("saha-formu", p, "Saha formu oluştur", "file-text");
    return "";
  }
  function adim(no, durum, baslik, ozet, icerik) {
    var etiket = { tamam: "Tamamlandı", aktif: "Şu an", bekliyor: "Sırada", red: "Reddedildi" }[durum];
    return '<li class="a-adim a-adim-' + durum + '"' + (durum === "aktif" ? ' aria-current="step"' : "") + '><div class="a-adim-isaret" aria-hidden="true">' +
      (durum === "tamam" ? ikon("check", "a-ikon-kucuk") : durum === "red" ? ikon("x", "a-ikon-kucuk") : no) + "</div>" +
      '<div class="a-adim-govde"><div class="a-adim-bas"><h2 class="a-adim-baslik">' + baslik + '</h2><span class="a-adim-durum">' + etiket + "</span>" +
      (ozet ? '<span class="a-adim-ozet">' + ozet + "</span>" : "") + "</div>" + (icerik ? '<div class="a-adim-icerik">' + icerik + "</div>" : "") + "</div></li>";
  }
  /* 2026-09-27 (reisim: "Tarih 23.09.2026 formatında yazmalı yanında bu gün vs yazmamalı, … kabul ve başladı kısımlarında sadece tarih
     yazmalı"): plan içinde tarih GG.AA.YYYY; adım başlıklarında yalnız tarih (saat ve kişi yok) */
  var tno = MK.tarihNo;
  var satir = function (etiket, deger) { return '<div class="a-satir"><dt>' + etiket + "</dt><dd>" + deger + "</dd></div>"; };
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
      /* 2026-09-27 (reisim: "ekipmanın raporunda yazması yeterli"): ekipman satırında raporun aşaması (Yeni, Teknik yönetici onayında …)
         yazmaz; yalnız rapor var mı. Aşama Raporlar tablosunda ve raporun kendisinde. */
      /* 2026-09-28 (reisim: "rapor varsa küçük yeşil bir tik"): raporu olan ekipmanda yeşil tik, yoksa boş */
      { k: "rapor", baslik: "Rapor", kart: "rozet", sira: 1, hucre: function (e) {
        if (e.pasif) return rozet({ ad: "Pasif", rozet: "a-rozet-notr" });
        return raporuVar(p, e.kod) ? '<span class="a-rapor-tik" title="Raporu var">' + ikon("circle-check") + '<span class="a-gizli">Raporu var</span></span>' : ""; } },
      /* 2026-09-26 (reisim): yanlış girilen ekipman PASİFE alınır (geri alınabilir); silme yalnız yönetici — maket denetçi gözünden, sil yok.
         2026-09-30 (reisim: "rapor oluştur tuşu gitsin"; 203): raporu olan ekipmanda "Rapor oluştur" yok; rapor silinir ya da pasife alınırsa
         geri gelir (raporuVar pasif ve silinmiş raporu saymaz) */
      { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (e) {
        if (!calisir(p)) return "";
        if (e.pasif) return '<div class="a-eylem"><div class="a-eylem-tuslar"><button class="a-tus a-tus-ikincil" type="button" data-eylem="ekipman-etkin" data-id="' + p.id + '" data-kod="' + e.kod + '">' +
          ikon("undo-2", "a-ikon-kucuk") + "Etkinleştir</button></div></div>";
        return '<div class="a-eylem"><div class="a-eylem-tuslar">' + (raporuVar(p, e.kod) ? "" : '<button class="a-ikon-tus" type="button" data-eylem="ekipman-pasif" data-id="' + p.id + '" data-kod="' + e.kod + '" aria-label="' + e.kod + ' pasife al" title="Pasife al">' + ikon("ban") + "</button>") +
          (raporuVar(p, e.kod) ? "" : '<button class="a-tus a-tus-ikincil" type="button" data-eylem="rapor-olustur" data-id="' + p.id + '" data-kod="' + e.kod + '"' +
            (MV.gunlukSure(BEN).dolu ? ' disabled aria-describedby="a-mesai-sebep"' : "") + ">" +
          ikon("file-plus", "a-ikon-kucuk") + "Rapor oluştur</button>") + "</div></div>";
      } }
    ];
  }
  var RAP_SUTUN = [
    { k: "no", baslik: "Rapor no", kart: "ust", sira: 1, hucre: function (r) { return '<span class="a-rapor-no">' + r.no + "</span>"; } },
    { k: "ekipman", baslik: "Ekipman", kart: "govde", sira: 2, hucre: function (r) { return '<span class="a-hucre-satir"><span class="a-kod">' + r.kod + "</span>" + kirp(SICIL[r.kod].tur.ad) + "</span>"; } },
    { k: "sonuc", baslik: "Sonuç", kart: "govde", sira: 3, hucre: function (r) {
      var s = r.sonuc; return '<span class="a-kart-etiket">Sonuç</span>' + (s ? '<span class="a-onceki' + (s === "Uygun" ? "" : /^(Kusurlu|Ağır)/.test(s) ? " a-sonuc-hata" : " a-sonuc-uyari") + '">' + s + "</span>" : '<span class="a-alt-satir">—</span>');
    } },
    { k: "durum", baslik: "Durum", kart: "rozet", sira: 1, hucre: function (r) { return rozet(RAPOR[r.durum]); } },
    { k: "olustu", baslik: "Oluşturuldu", kart: "govde", sira: 4, hucre: function (r) { return '<span class="a-tarih-saat">' + zamanYaz(r.olustu) + "</span>"; } },
    { k: "eylem", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: function (r) {
      var d = r.durum === "taslak" ? ["pencil", "Raporu düzenle"] : ["file-text", "Raporu aç"];
      /* 2026-09-24 (toplu maket M8): saha rapor ekranı maketi geldi — tuş o ekrana gider (numara ve durum adresle taşınır).
         2026-09-28 (reisim: "rapor pasif … inspector pasife alabilir, pasif raporu görmez; aktif etme ve silme yalnız yönetici"): gönderilmemiş
         (Yeni) raporda "Pasife al"; gönderilen rapor onay akışında, pasife alınmaz */
      /* 2026-09-29 (reisim: "oluşan rapor inspector tarafından da silinebilsin"): Yeni raporda Sil de (onay penceresiyle) */
      return '<div class="a-eylem"><div class="a-eylem-tuslar">' + (r.durum === "taslak" && calisir(AKTIF) ? '<button class="a-ikon-tus" type="button" data-eylem="rapor-pasif-ac" data-no="' + r.no + '" aria-label="' + r.no + ' pasife al" title="Pasife al">' + ikon("ban") + "</button>" +
          '<button class="a-ikon-tus a-tus-sil" type="button" data-eylem="rapor-sil-ac" data-no="' + r.no + '" aria-label="' + r.no + ' sil" title="Sil">' + ikon("trash-2") + "</button>" : "") +
        MK.git({ hedef: "rapor", hash: "#/r/" + r.kod + "?no=" + r.no + "&durum=" + r.durum, ad: d[1], ikon: d[0], ne: "Saha rapor ekranı" }) + "</div></div>";
    } }
  ];
  /* 2026-09-27 (reisim: "raporlandı yazılarından sonra sağ tarafta çok boşluk var"): hiçbir satırda işlem yoksa (plan bitti ya da
     hepsi raporlu) işlem sütunu hiç çizilmez; genişlik öteki sütunlara dağılır */
  var islemVar = function (p) { return calisir(p); };   /* "Rapor oluştur" her satırda (2026-09-28) */
  function listeCiz(on) {   /* yalnız liste, çipler, sayaç ve sayfalayıcı çizilir; arama kutusu yerinde kalır (odak çalınmaz) */
    var p = AKTIF; if (!p || !MK.kap(on)) return;
    var hepsi = on === "e" ? p.ekp.map(function (k) { return SICIL[k]; }) : raporlar(p).sort(function (a, b) { return a.olustu < b.olustu ? 1 : a.olustu > b.olustu ? -1 : 0; });
    MK.listeCiz({ on: on, kayitlar: hepsi, sayacId: "a-sayac-" + on, listeId: "a-liste-" + on, sayfaId: "a-sayfa-" + on,
      bosVeri: '<p class="a-bos-satir">' + (on === "r" ? "Bu planda rapor yok." : "Bu planda ekipman yok.") + "</p>",
      tablo: { baslik: on === "e" ? "Plandaki ekipmanlar" : "Bu plandaki raporlar", sinif: on === "e" ? (islemVar(p) ? "a-tablo-ekipman" : "a-tablo-ekipman a-tablo-sade") : "a-tablo-rapor",
        sutunlar: on === "e" ? ekpSutun(p).filter(function (s) { return s.k !== "eylem" || islemVar(p); }) : RAP_SUTUN } });
  }
  /* eklenen ekipman sayfalı listede görünsün: bulunduğu sayfaya geçilir; süzgeç gizliyorsa bildirim söyler (anayasa 2.8) */
  function kaydaGit(kod) {
    var liste = MK.taban("e", AKTIF.ekp.map(function (k) { return SICIL[k]; })).filter(function (e) { return MK.cipGecer("e", e); });
    var i = liste.map(function (e) { return e.kod; }).indexOf(kod);
    if (i >= 0) SZ.e.sayfa = Math.floor(i / SAYFA.e) + 1;
    return i >= 0;
  }
  function planCiz(p) {
    if (!p) { AKTIF = null; $("a-plan").innerHTML = '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlar</a></nav>" +
      '<h1 class="a-gizli" tabindex="-1">' + (VERI === "hata" ? "Plan yüklenemedi" : "Plan bulunamadı") + "</h1>" + bos(VERI === "hata" ? "planHata" : "plan"); return; }
    if (!AKTIF || AKTIF.id !== p.id) {   /* başka plana geçince süzgeçler sıfırlanır */
      MK.suzgecSifirla("e"); MK.suzgecSifirla("r"); NOTLAR_ACIK = false;
      /* N2 (2026-09-30, reisim: "evet kendi branşıyla açılsın"): ekipman listesi denetçinin branşıyla açılır (planda o branştan ekipman
         varsa); "Tümü" ile bütün ekipman görünür */
      var bb = { Mekanik: "m", Elektrik: "e" }[KISI[BEN].brans];
      if (bb && p.ekp.some(function (k) { return SICIL[k] && SICIL[k].tur.b === bb; })) SZ.e.sec.brans = bb;
    }
    AKTIF = p;
    var d = p.durum, eylem = planEylem(p), sid = "a-plan-sebep-" + p.id;
    var isg = !p.isg ? '<span class="a-yuz-uyari">Yok</span>' : '<span class="a-kod">' + kacis(p.isg.no) + "</span>";
    var raporsuz = p.ekp.filter(function (k) { return !raporuVar(p, k); }).length;
    /* 1 · Planlandı — plan bilgisi ve kapsam */
    var a1 = adim(1, "tamam", "Planlandı", tno(p.acildi),
      /* 2026-09-26 (reisim): İSG-KATİP sözleşme ID (onay tarihi yok) · başlangıç ve bitiş tarihi (plan süresi) · teklif içeriği (tür × adet) ·
         adres · açıklama */
      /* 2026-09-27 (reisim, örnek ekranla: "bu kadar basit aslında istediğim şey bu"): etiket : değer satırları alt alta, altında
         ayrı kutuda teklif içeriği tablosu (muayene alanı · muayene türü · adet), tam genişlik */
      '<dl class="a-satirlar">' +
        satir("Proje no", '<span class="a-kod">' + p.no + "</span>") +
        satir("İSG-KATİP sözleşme ID", isg) +
        satir("Başlangıç tarihi", tno(p.tarih)) +
        satir("Bitiş tarihi", tno(p.bitTarih)) +
        satir("Inspector", p.ekip.map(function (k) { return KISI[k].ad + ' <span class="a-alt-inline">' + KISI[k].brans + "</span>"; }).join(" · ")) +
        satir("Adres", kacis(p.adres) + ", " + p.ilce + " / " + p.il) +
        satir("Açıklama", p.aciklama ? kacis(p.aciklama) : "-") +
      "</dl>" +
      '<section class="a-teklif" aria-labelledby="a-teklif-b"><h3 class="a-teklif-baslik" id="a-teklif-b">Teklif içeriği</h3>' +
        '<div class="a-teklif-kap"><table class="a-duz-tablo"><thead><tr><th scope="col">Muayene alanı</th><th scope="col">Muayene türü</th><th scope="col">Adet</th></tr></thead><tbody>' +
        kapsam(p).filter(function (x) { return x.planlanan; }).map(function (x) { return "<tr><td>" + kacis(x.ad) + "</td><td>Periyodik kontrol</td><td>" + x.planlanan + "</td></tr>"; }).join("") +
        "</tbody></table></div></section>");
    /* 2 · Kabul (tarafsızlık beyanı) */
    var a2;
    if (d === "bekliyor") a2 = adim(2, "aktif", "Kabul", "",
      '<blockquote class="a-beyan"><p class="a-beyan-baslik">Tarafsızlık ve çıkar çatışması beyanı</p><p>' + BEYAN + "</p></blockquote>" +
      (p.eksik ? serit("uyari", "triangle-alert", kacis(p.eksik) + " Plan yine de kabul edilebilir.") : "") +
      '<label class="a-onay-kutusu a-beyan-onay"><input type="checkbox" data-beyan="' + p.id + '"' + (p.beyanOkundu ? " checked" : "") + '><span id="' + sid + '">Tarafsızlık beyanını okudum, kabul ediyorum</span></label>' +
      '<div class="a-adim-eylem"><div class="a-adim-tuslar">' + eylem + "</div></div>");
    else if (d === "red") a2 = adim(2, "red", "Kabul", tno(p.reddedildi), serit("hata", "circle-x", "Gerekçe: " + kacis(p.gerekce || "")));
    else a2 = adim(2, "tamam", "Kabul", tno(p.kabul),
      '<details class="a-ayrinti"><summary>Tarafsızlık beyanı onaylandı · beyanı gör</summary><blockquote class="a-beyan"><p>' + BEYAN + "</p></blockquote></details>");
    /* 3 · Denetim — kontrol listesi: ekipmanlar + raporlar (süzgeçli, 10'ar sayfalı) */
    var kt = d === "denetimde" && !!p.kontrolTamam;   /* kontrol listesi tamamlandı, plan henüz değil */
    var a3durum = d === "tamam" || kt ? "tamam" : (d === "kabul" || d === "denetimde") ? "aktif" : "bekliyor";
    var a3ozet = kt ? "Kontrol listesi tamamlandı · " + tno(p.kontrolTamam)
      : p.basladi ? (d === "tamam" ? tno(p.basladi) + (p.bitti.slice(0, 10) !== p.basladi.slice(0, 10) ? " – " + tno(p.bitti) : "") : "Başladı: " + tno(p.basladi)) : "";
    var kontrol = "";
    if (d === "kabul" || calisir(p)) kontrol =
      /* günlük süre (212): dolunca Rapor oluştur kapalı, sebep çubukta */
      (d !== "tamam" ? MK.mesaiCubugu(BEN, null, "a-mesai-sebep") : "") +
      '<div class="a-alt-bolum a-plan-bolum"><div class="a-alt-bas"><h3 class="a-alt-baslik" id="a-ekipman-baslik">Ekipmanlar</h3><span class="a-sayac" id="a-sayac-e"></span>' +
        /* 2026-09-27 (reisim: "ekipan listesinbi excelden export etme ve inport etme olsun"): Excel'e aktar her zaman; Excel'den yükle
           ekipman eklenebilen durumda (denetimde) */
        '<div class="a-bolum-tuslar">' + MK.tus({ eylem: "excel-disa", ad: "Excel'e aktar", ikon: "download", sinif: "a-tus-ikincil", veri: { id: p.id } }) +
        (ekipmanAcik(p) ? MK.tus({ eylem: "excel-ice", ad: "Excel'den yükle", ikon: "upload", sinif: "a-tus-ikincil", veri: { id: p.id } }) +
          '<button class="a-tus a-tus-ikincil" type="button" data-eylem="ekle-ac" data-id="' + p.id + '">' + ikon("plus", "a-ikon-kucuk") + "Ekipman ekle</button>" : "") + "</div>" +
        "</div>" + MK.suzgecHtml("e") + '<div class="a-liste-kap" id="a-liste-e"></div><div id="a-sayfa-e"></div></div>' +
      (calisir(p) ? '<div class="a-alt-bolum a-plan-bolum"><div class="a-alt-bas"><h3 class="a-alt-baslik" id="a-rapor-baslik" tabindex="-1">Raporlar</h3><span class="a-sayac" id="a-sayac-r"></span>' +
        (raporlar(p).length ? '<div class="a-bolum-tuslar">' + MK.tus({ eylem: "toplu-pdf", ad: "PDF indir", ikon: "download", sinif: "a-tus-ikincil", veri: { id: p.id } }) +
          '<button class="a-ikon-tus" type="button" data-eylem="saat-ac" data-id="' + p.id + '" aria-label="Rapor saatlerini hizala" title="Rapor saatlerini hizala">' + ikon("clock") + "</button></div>" : "") + "</div>" +
        MK.suzgecHtml("r") + '<div class="a-liste-kap" id="a-liste-r"></div><div id="a-sayfa-r"></div></div>' : "");
    var a3 = adim(3, a3durum, "Denetim", a3ozet,
      (d === "red" ? '<p class="a-adim-not">Plan reddedildi; denetim yok.</p>' : "") +
      (d === "kabul" ? '<p class="a-adim-not">İlk rapor oluşturulunca denetim başlar.</p>' : "") +
      kontrol +
      (d === "denetimde" && !kt ? '<div class="a-adim-eylem"><p class="a-adim-not">' + (raporsuz ? raporsuz + " ekipmanın bu planda raporu yok." : "Bütün ekipmanların raporu açıldı.") + '</p><div class="a-adim-tuslar">' + eylem + "</div></div>"
        : kt ? '<div class="a-adim-eylem">' + serit("onay", "circle-check", "Kontrol listesi tamamlandı.") + '<div class="a-adim-tuslar">' + tus("kontrol-geri", p, "Kontrol listesini yeniden aç", "undo-2", false, "a-tus-ikincil") + "</div></div>" : ""));
    /* 4 · Tamamlama */
    var a4 = adim(4, d === "tamam" ? "tamam" : kt ? "aktif" : "bekliyor", "Tamamlama", d === "tamam" ? tno(p.bitti) : "",
      kt ? '<div class="a-adim-eylem"><p class="a-adim-not">Planı tamamlayın; plan Tamamlandı olur.</p><div class="a-adim-tuslar">' + eylem + "</div></div>"
      : d === "denetimde" ? '<p class="a-adim-not">Kontrol listesi tamamlanınca plan buradan tamamlanır.</p>'
      : d === "tamam" ? '<div class="a-adim-eylem"><div class="a-adim-tuslar">' + eylem + "</div></div>" + sahaListe(p)
      : "");
    /* Proje notları (5. tur, reisim: "hareketler kısmını kaldır"): hareket kaydı tutulmaya devam eder (p.gecmis, denetim
       izi) ama plan içinde gösterilmez; burada yalnız notlar. Kim yazar/görür: plandaki inspector'lar + planlama ekibi;
       müşteri görmez; not silinmez (karar 27). */
    /* masraf ve izin plan içinde değil, kullanıcının kendi alanından: üst çubukta ad → Taleplerim (reisim 2026-09-28: "masraf yazmak için
       ilgili tuş planın içinde olmasın … her kullanıcı profilinden yapacak") */
    var notlar = p.gecmis.filter(function (g) { return g.ne === "Not"; }).sort(function (a, b) { return a.z < b.z ? 1 : a.z > b.z ? -1 : b.s - a.s; });
    var gorunen = NOTLAR_ACIK ? notlar : notlar.slice(0, 6);
    $("a-plan").innerHTML =
      '<nav class="a-kirinti" aria-label="Konum"><a href="#/">' + ikon("arrow-left", "a-ikon-kucuk") + "Planlar</a>" +
        ikon("chevron-right", "a-ikon-kucuk") + '<span aria-current="page">' + p.no + "</span></nav>" +
      '<div class="a-nesne-bas"><div class="a-nesne-kimlik"><div class="a-nesne-baslik"><h1 tabindex="-1">' + kacis(p.musteri) + "</h1>" + rozet(DURUM[d]) + "</div>" +
        /* 2026-09-30 (L7, reisim: "firma ismi önde olmalı tesis ismi değil bu her yerde böyle olmalı"): başlıkta firma, altında tesis */
        '<p class="a-nesne-alt">' + ikon("map-pin", "a-ikon-kucuk") + "<span>" + kacis(p.ad) + "</span></p></div></div>" +
      '<ol class="a-akis" aria-label="Plan akışı">' + a1 + a2 + a3 + a4 + "</ol>" +
      '<section class="a-bolum a-notlar" aria-labelledby="a-not-baslik"><div class="a-alt-bas"><h2 class="a-alt-baslik" id="a-not-baslik">Proje notları</h2>' +
        '<span class="a-sayac"><b>' + notlar.length + "</b> not</span></div>" +
        '<div class="a-not-form"><label class="a-gizli" for="a-not-girdi">Proje notu</label><textarea class="a-alan a-alan-ince" id="a-not-girdi" maxlength="500" placeholder="Proje notu ekleyin"></textarea>' +
        '<button class="a-tus a-tus-ikincil" type="button" data-eylem="not-ekle" data-id="' + p.id + '" id="a-not-ekle" disabled>' + ikon("plus", "a-ikon-kucuk") + "Notu ekle</button></div>" +
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
      }).join("") + "</ul>" : '<p class="a-bos-satir">Bu tesiste plana alınmamış kayıtlı ekipman yok.</p>';
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
          "</div>" +
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
    if (p && r.ekle && ekipmanAcik(p)) ekleAc(p, kodNormal(r.kod)); else ekleKapat();
  }
  MK.goster = goster;
  function git(id) { var r = rota(); if (r && r.id === id && !r.ekle) goster(false); else location.hash = "#/plan/" + id; }

  /* ── ETKİLEŞİM (Planlar'a özgü; genel tıklamalar ortak dağıtıcıda) ──────────────────────────────────── */
  var redId = null;
  MK.onTikla = function (e) {
    if (E.turAcik && !e.target.closest(".a-combo")) { E.turAcik = false; ekleCiz(); }
    var ad = e.target.closest("[data-adim]"); if (ad && S && $("a-pencere").open) { S.adim = +ad.dataset.adim; saatCiz('[data-adim="' + S.adim + '"]'); return true; }
    var el = e.target.closest("[data-sekme],[data-tur]");
    if (!el) return false;
    if (el.dataset.sekme) { E.sekme = el.dataset.sekme; ekleCiz(); return true; }
    E.tur = KATALOG.filter(function (t) { return t.k === el.dataset.tur; })[0]; E.turAcik = false; E.turAra = ""; ekleCiz("a-ekle-seri"); return true;
  };
  var X = MK.eylem, pl = function (el) { return bul(+el.dataset.id); };
  X.tekrar = function () { VERI = "dolu"; goster(false); };
  X.kabul = function (el) { var p = pl(el); if (p && p.durum === "bekliyor" && p.beyanOkundu) { p.durum = "kabul"; p.kabul = simdi(); kaydet(p, simdi(), BEN, "Plan kabul edildi", "Tarafsızlık beyanı onaylandı"); goster(false); MK.bildir("Plan kabul edildi."); } };
  X.devam = function (el) { var p = pl(el); if (p) git(p.id); };
  X["kontrol-tamamla"] = function (el) {
    var p = pl(el); if (!p || p.durum !== "denetimde" || p.kontrolTamam) return;
    p.kontrolTamam = simdi(); kaydet(p, simdi(), BEN, "Kontrol listesi tamamlandı"); goster(false);
    var t = document.querySelector('#a-plan .a-adim-tuslar [data-eylem="tamamla"]'); if (t) t.focus();
    MK.bildir("Kontrol listesi tamamlandı. Planı en alttaki Tamamla ile bitirin.");
  };
  X["kontrol-geri"] = function (el) {
    var p = pl(el); if (!p || p.durum !== "denetimde") return;
    p.kontrolTamam = null; kaydet(p, simdi(), BEN, "Kontrol listesi yeniden açıldı"); goster(false);
    var t = document.querySelector('#a-plan .a-adim-tuslar [data-eylem="kontrol-tamamla"]'); if (t) t.focus();
    MK.bildir("Kontrol listesi yeniden açıldı.");
  };
  X.tamamla = function (el) { var p = pl(el); if (p && p.durum === "denetimde" && p.kontrolTamam) { p.durum = "tamam"; p.bitti = simdi(); kaydet(p, simdi(), BEN, "Plan tamamlandı"); goster(false); MK.bildir("Plan tamamlandı."); } };
  X["geri-al"] = function (el) { var p = pl(el); if (p && p.durum === "tamam") { p.durum = "denetimde"; p.bitti = null; kaydet(p, simdi(), BEN, "Tamamlama geri alındı"); goster(false); MK.bildir("Tamamlama geri alındı; plan yeniden denetime açıldı."); } };
  X["rapor-olustur"] = function (el) {
    var p = pl(el);
    if (p && calisir(p) && MV.gunlukSure(BEN).dolu) { MK.bildir("Günlük süre doldu (mesai takibi); bugün yeni rapor oluşturulamaz."); return; }   /* 212 */
    if (p && calisir(p) && !raporuVar(p, el.dataset.kod)) {   /* ekipman başına bir rapor (2026-09-30, 203) */
      var r = { no: raporNo("0926", raporSira++).replace(/^[^-]+/, MV.firmaKodu()), kod: el.dataset.kod, durum: "taslak", olustu: simdi(), sonuc: null };
      if (p.durum === "kabul") { p.durum = "denetimde"; p.basladi = simdi(); kaydet(p, simdi(), BEN, "Denetime başlandı", "ilk rapor oluşturuldu"); }
      p.rapor.push(r); ortakEkipman(p, r.kod); ortakRapor(p, r); kaydet(p, simdi(), BEN, "Rapor oluşturuldu", r.no + " · " + r.kod); SZ.r.sayfa = 1;
      goster(false); MK.bildir("Rapor oluşturuldu: " + r.no + ". Satırındaki “Raporu düzenle” saha rapor ekranını açar.");
    }
  };
  X["ekipman-pasif"] = function (el) { var p = pl(el), e = SICIL[el.dataset.kod]; e.pasif = true; kaydet(p, simdi(), BEN, "Ekipman pasife alındı", e.kod); goster(false); MK.bildir(e.kod + " pasife alındı; rapor açılamaz. Etkinleştir ile geri alınır."); };
  X["ekipman-etkin"] = function (el) { var p = pl(el), e = SICIL[el.dataset.kod]; e.pasif = false; kaydet(p, simdi(), BEN, "Ekipman etkinleştirildi", e.kod); goster(false); MK.bildir(e.kod + " yeniden etkin."); };
  /* rapor pasife alma (2026-09-28, T2): inspector gönderilmemiş raporu pasife alır, pasif rapor listesinden kalkar; aktif etme ve silme
     teknik yöneticide (Onaylar → Pasif raporlar). Ortak kayda yazılır. */
  X["rapor-pasif-ac"] = function (el) {
    $("a-pencere").dataset.kip = "pasif"; $("a-pencere-baslik").textContent = "Raporu pasife al";
    $("a-pencere-govde").innerHTML = '<p class="a-pencere-metin"><span class="a-rapor-no">' + el.dataset.no + "</span> pasife alınır ve listenizden kalkar.</p>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "rapor-pasif", ad: "Pasife al", ikon: "ban", veri: { no: el.dataset.no } });
    $("a-pencere").showModal(); $("a-pencere-alt").querySelector('[data-eylem="pencere-kapat"]').focus();
  };
  X["rapor-sil-ac"] = function (el) {
    var p = AKTIF, no = el.dataset.no, r = p.rapor.filter(function (x) { return x.no === no; })[0]; if (!r || r.durum !== "taslak") return;
    MK.onayla({ baslik: "Raporu sil", metin: '<span class="a-rapor-no">' + no + "</span> · " + kacis(r.kod) + " raporu ve içine yazılan her şey silinir; geri alınamaz.", tus: "Sil", tamam: function () {
      p.rapor.splice(p.rapor.indexOf(r), 1); var i = MV.RAPORLAR.indexOf(MV.rapor(no)); if (i >= 0) MV.RAPORLAR.splice(i, 1);
      kaydet(p, simdi(), BEN, "Rapor silindi", no + " · " + r.kod); goster(false); var b = $("a-rapor-baslik"); if (b) b.focus();
      MK.bildir(no + " silindi.");
    } });
  };
  X["rapor-pasif"] = function (el) {
    var p = AKTIF, r = p.rapor.filter(function (x) { return x.no === el.dataset.no; })[0], m = MV.rapor(r.no);
    r.pasif = true; if (m) { m.pasif = true; m.pasifKim = BEN; m.pasifZaman = simdi(); }
    kaydet(p, simdi(), BEN, "Rapor pasife alındı", r.no + " · " + r.kod);
    $("a-pencere").close(); goster(false); var b = $("a-rapor-baslik"); if (b) b.focus();
    MK.bildir(r.no + " pasife alındı.");
  };
  /* toplu PDF (§3.8 kural 7; reisim 2026-09-28): süzgeçten geçen raporların PDF'i tek dosyada, her rapor kendi sayfalarında; taslağın PDF'i
     yok (Raporlar ile aynı), taslak rapor rapor ekranındaki Ön izle'den */
  X["toplu-pdf"] = function (el) {
    var p = pl(el), l = MK.taban("r", raporlar(p)).filter(function (r) { return MK.cipGecer("r", r) && r.durum !== "taslak"; }).map(function (r) { return MV.rapor(r.no); }).filter(Boolean);
    if (!l.length) { MK.bildir("Süzgeçte gönderilmiş rapor yok; taslak rapor PDF'e girmez."); return; }
    l.sort(function (a, b) { return a.no < b.no ? -1 : 1; });
    MK.pdfGoster({ dosya: p.no + "-raporlar.pdf", baslik: p.no + " · " + l.length + " rapor", icerik: l.map(function (r) { return MB.belge(MV.tur(MV.ekipman(r.kod).tur), MV.raporBelge(r)); }).join("") });
  };
  /* rapor saatlerini hizala (reisim 2026-09-26): ilk raporun saati + süre; her 1 / 2 / 3 raporda bir artar; raporlar numara sırasıyla */
  var S = null;
  function saatCiz(odak) {
    $("a-pencere-baslik").textContent = "Rapor saatlerini hizala";
    $("a-pencere-govde").innerHTML = '<div class="a-form">' +
      MK.alan({ id: "w-ilk", etiket: "İlk raporun saati", zorunlu: true, hata: S.hata.ilk, girdi: MK.girdi({ id: "w-ilk", alan: "ilk", deger: S.ilk, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="5" placeholder="SS:DD"', hata: S.hata.ilk }) }) +
      MK.alan({ id: "w-sure", etiket: "Süre (dk)", zorunlu: true, hata: S.hata.sure, girdi: MK.girdi({ id: "w-sure", alan: "sure", deger: S.sure, sinif: "a-girdi-sicil", ek: ' inputmode="numeric" maxlength="3"', hata: S.hata.sure }) }) +
      '<div class="a-alan-grup a-alan-genis"><p class="a-etiket">Süre kaç raporda bir artsın</p><div class="a-sekmeler" role="group" aria-label="Süre kaç raporda bir artsın">' +
        [1, 2, 3].map(function (n) { return '<button type="button" class="a-sekme" data-adim="' + n + '" aria-pressed="' + (S.adim === n) + '">' + (n === 1 ? "Her rapor" : n + " raporda bir") + "</button>"; }).join("") + "</div></div></div>";
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "saat-uygula", ad: "Hizala", ikon: "clock" });
    if (odak) { var el = document.querySelector(odak); if (el) el.focus(); }
  }
  var sirali = function (p) { return raporlar(p).sort(function (a, b) { return a.no < b.no ? -1 : 1; }); };
  X["saat-ac"] = function (el) {
    var p = pl(el), ilk = sirali(p)[0];
    S = { p: p, ilk: ilk ? ilk.olustu.slice(11, 16) : "09:00", sure: "10", adim: 1, hata: {} };
    $("a-pencere").dataset.kip = "saat"; saatCiz(); $("a-pencere").showModal(); $("w-ilk").focus();
  };
  X["saat-uygula"] = function () {
    var h = {}, m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(S.ilk.trim()), sure = +S.sure;
    if (!m) h.ilk = "SS:DD biçiminde.";
    if (!/^\d{1,3}$/.test(S.sure) || sure < 1) h.sure = "1–999 dakika.";
    S.hata = h; if (Object.keys(h).length) { saatCiz("#w-" + Object.keys(h)[0]); return; }
    var l = sirali(S.p), gun = l[0].olustu.slice(0, 11), bas = +m[1] * 60 + +m[2];
    l.forEach(function (r, i) { var dk = bas + Math.floor(i / S.adim) * sure; r.olustu = gun + ("0" + Math.floor(dk / 60) % 24).slice(-2) + ":" + ("0" + dk % 60).slice(-2); });
    kaydet(S.p, simdi(), BEN, "Rapor saatleri hizalandı", l.length + " rapor · " + S.ilk + " · " + sure + " dk");
    $("a-pencere").close(); goster(false); MK.bildir(l.length + " raporun saati hizalandı.");
  };
  /* saha formu (reisim 2026-09-26): tamamlanan planda istendiği kadar; yapılan ekipmanlar + firma onayı imza yerleri; format firmaya göre */
  X["saha-formu"] = function (el) {
    var p = pl(el); if (!p || p.durum !== "tamam") return;
    p.sahaSayisi = (p.sahaSayisi || 0) + 1;
    var yapilan = raporlar(p).sort(function (a, b) { return a.no < b.no ? -1 : 1; }).map(function (r) { return SICIL[r.kod]; });
    kaydet(p, simdi(), BEN, "Saha formu oluşturuldu", p.no + "-SF" + p.sahaSayisi); goster(false);   /* plan içindeki saha formları listesi (197) */
    SAHA = { p: p, ekipmanlar: yapilan, no: p.no + "-SF" + p.sahaSayisi };
    $("a-pencere").dataset.kip = "saha"; $("a-pencere-baslik").textContent = "Saha formu · " + p.no;
    sahaCiz(); $("a-pencere").showModal(); $("a-pencere-govde").scrollTop = 0; $("a-pencere-alt").querySelector('[data-eylem="saha-indir"]').focus({ preventScroll: true });
  };
  /* oluşturulan saha formları (197, 2026-09-29): her biri açılır; uzmanların imzası (V3) ve müşterinin ıslak imzalı + kaşeli kâğıdının taraması
     (yüklenir, açılır, değiştirilir, silinir — "yüklenilen şeyler düzenlenebilir silinebilir olmalı") */
  function sahaListe(p) {
    var n = p.sahaSayisi || 0, l = []; if (!n) return "";
    for (var i = n; i >= 1; i--) l.push(p.no + "-SF" + i);
    return '<ul class="a-kosullar a-saha-liste" aria-label="Saha formları">' + l.map(function (no) {
      var im = (p.sahaImza || {})[no], tr = (p.sahaTarama || {})[no];
      return '<li class="a-kosul-bilgi">' + ikon("file-text", "a-ikon-kucuk") + '<span><span class="a-kod">' + no + "</span> · uzman " + (im ? MV.IMZA_YONTEM[im.yontem].kisa : "imzasız") +
        " · müşteri " + (tr ? "imzalı tarama yüklü" : "tarama yok") + "</span>" +
        MK.tus({ eylem: "saha-ac", ad: "Formu aç", sinif: "a-tus-ikincil", veri: { id: p.id, no: no } }) +
        (tr ? MK.dosyaAlan({ ad: tr, degistir: "saha-tarama", sil: "saha-tarama-sil", veri: { id: p.id, no: no } })
          : MK.tus({ eylem: "saha-tarama", ad: "İmzalı taramayı yükle", ikon: "upload", sinif: "a-tus-ikincil", veri: { id: p.id, no: no } })) + "</li>";
    }).join("") + "</ul>";
  }
  X["saha-ac"] = function (el) {
    var p = pl(el); if (!p) return;
    SAHA = { p: p, ekipmanlar: raporlar(p).sort(function (a, b) { return a.no < b.no ? -1 : 1; }).map(function (r) { return SICIL[r.kod]; }), no: el.dataset.no };
    $("a-pencere").dataset.kip = "saha"; $("a-pencere-baslik").textContent = "Saha formu · " + el.dataset.no;
    sahaCiz(); $("a-pencere").showModal(); $("a-pencere-govde").scrollTop = 0; $("a-pencere-alt").querySelector('[data-eylem="saha-indir"]').focus({ preventScroll: true });
  };
  X["saha-tarama"] = function (el) {
    var p = pl(el), no = el.dataset.no; if (!p) return;
    MK.dosyaSec({ kabul: ".pdf,image/*", enCokMB: 10, ornek: no.toLowerCase() + "-imzali.pdf" }, function (ad) {
      var t = (p.sahaTarama = p.sahaTarama || {}); if (t[no] && t[no] !== ad) MK.dosyaSil(t[no]); t[no] = ad;
      kaydet(p, simdi(), BEN, "İmzalı saha formu yüklendi", no); goster(false); MK.bildir(no + " imzalı taraması yüklendi.");
    });
  };
  X["saha-tarama-sil"] = function (el) {
    var p = pl(el), no = el.dataset.no; if (!p) return;
    MK.onayla({ baslik: "Taramayı sil", metin: no + " imzalı saha formunun taraması silinir.", tamam: function () {
      MK.dosyaSil(p.sahaTarama[no]); delete p.sahaTarama[no]; kaydet(p, simdi(), BEN, "İmzalı saha formu taraması silindi", no); goster(false); MK.bildir(no + " taraması silindi.");
    } });
  };
  /* 2026-09-29 (V3): muayene uzmanları saha formunu firmanın yöntemiyle (mobil imza / e-imza) imzalar; imza planda form numarasıyla saklanır */
  var SAHA = null;
  function sahaCiz() {
    var p = SAHA.p, im = (p.sahaImza || {})[SAHA.no];
    $("a-pencere-govde").innerHTML = MB.sahaFormu({ p: p, ekipmanlar: SAHA.ekipmanlar, no: SAHA.no, tarih: BUGUN, uzmanlar: p.ekip.map(function (k) { return KISI[k].ad; }), imza: im });
    $("a-pencere-alt").innerHTML = MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "saha-indir", ad: "PDF indir", ikon: "file-text", sinif: im ? "" : "a-tus-ikincil" }) +
      (im ? "" : MK.tus({ eylem: "saha-imzala", ad: "İmzala (" + MV.imzaYontem().kisa + ")", ikon: "file-signature" }));
  }
  X["saha-imzala"] = function () {
    var p = SAHA.p, no = SAHA.no;
    MK.imzaAl({ belge: no + " saha formu", imzacilar: p.ekip.map(function (k) { return KISI[k].ad; }), tamam: function (im) {
      (p.sahaImza = p.sahaImza || {})[no] = im; kaydet(p, simdi(), BEN, "Saha formu imzalandı", no + " · " + MV.IMZA_YONTEM[im.yontem].kisa); goster(false);
      if (SAHA && SAHA.no === no && $("a-pencere").open) { sahaCiz(); $("a-pencere-alt").querySelector('[data-eylem="saha-indir"]').focus(); }
      MK.bildir(no + " " + MV.IMZA_YONTEM[im.yontem].kisa + " ile imzalandı; firma yetkilisinin imzası ve kaşesi kâğıtta.");
    } });
  };
  /* ── EXCEL (reisim 2026-09-27): ekipman listesi dışa aktarılır (önizleme + indir) ve Excel'den yüklenir (şablon, satır satır denetim,
     yalnız geçerli yeni satırlar plana girer). 2026-09-27: gerçek .xlsx / .csv yazılır ve okunur (MK.xlsx, MK.tabloOku). */
  var EXCEL = null;
  function excelPencere(baslik, govde, alt) {
    $("a-pencere").dataset.kip = "excel"; $("a-pencere-baslik").textContent = baslik; $("a-pencere-govde").innerHTML = govde; $("a-pencere-alt").innerHTML = alt;
    if (!$("a-pencere").open) $("a-pencere").showModal(); $("a-pencere-govde").scrollTop = 0;
  }
  var tablo = function (bas, satirlar) {
    return '<table class="a-belge-tablo"><thead><tr>' + bas.map(function (b) { return '<th scope="col">' + b + "</th>"; }).join("") + "</tr></thead><tbody>" +
      satirlar.map(function (r) { return "<tr>" + r.map(function (h) { return "<td>" + h + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  };
  X["excel-disa"] = function (el) {
    var p = pl(el); if (!p) return;
    excelPencere("Excel'e aktar · " + p.no,
      '<p class="a-pencere-ozet"><b>' + p.ekp.length + " ekipman</b> · " + p.no + "-ekipmanlar.xlsx</p>" +
      /* önizleme iki sütun (telefonda da okunur, M11 Excel önizlemesiyle aynı); dosyanın kendisinde her alan ayrı sütun */
      '<div class="a-excel-kap">' + tablo(["Ekipman", "Önceki kontrol · rapor"], p.ekp.map(function (k) {
        var e = SICIL[k]; return ['<span class="a-kod">' + k + "</span> " + kacis(e.tur.ad) + '<span class="a-alt-satir">' + kacis(e.konum) + " · " + bransAd(e.tur.b) + "</span>",
          (e.onceki ? tno(e.onceki.tarih) + " · " + e.onceki.sonuc : "İlk kontrol") + '<span class="a-alt-satir">' + (e.pasif ? "Pasif" : raporuVar(p, k) ? "Raporlandı" : "Rapor yok") + "</span>"];
      })) + "</div>",
      MK.tus({ eylem: "pencere-kapat", ad: "Kapat", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "excel-indir", ad: "İndir", ikon: "download" }));
    $("a-pencere-alt").querySelector(".a-tus-birincil").focus({ preventScroll: true });
  };
  /* 2026-09-27 (reisim: "maket site nasıl çalışması gerekiyorsa çalışsın"): gerçek .xlsx iner */
  X["excel-indir"] = function () {
    var p = AKTIF; if (!p) return;
    MK.indir(p.no + "-ekipmanlar.xlsx", MK.xlsx("Ekipmanlar", [["Kod", "Ekipman türü", "Konum", "Seri no", "Branş", "Önceki kontrol", "Önceki sonuç", "Bu planda"]].concat(p.ekp.map(function (k) {
      var e = SICIL[k]; return [k, e.tur.ad, e.konum || "", e.seri || "", bransAd(e.tur.b), e.onceki ? tno(e.onceki.tarih) : "İlk kontrol", e.onceki ? e.onceki.sonuc : "", e.pasif ? "Pasif" : raporuVar(p, k) ? "Raporlandı" : "Rapor yok"];
    }))));
  };
  function excelIceCiz() {
    var p = EXCEL.p, satirlar = EXCEL.satirlar, gecerli = satirlar.filter(function (x) { return x.ok; });
    excelPencere("Excel'den yükle · " + p.no,
      '<p class="a-pencere-ozet">Sütunlar: Kod · Ekipman türü · Konum · Seri no. Şablonu indirip doldurun; her satır denetlenir, yalnız geçerli yeni satırlar plana girer.</p>' +
      '<div class="a-dosya-sec">' + MK.tus({ eylem: "excel-sablon", ad: "Şablonu indir", ikon: "file-spreadsheet", sinif: "a-tus-ikincil" }) +
        MK.tus({ eylem: "excel-sec", ad: EXCEL.dosya ? "Başka dosya seç" : "Dosya seç", ikon: "upload", sinif: "a-tus-ikincil" }) +
        '<span class="a-dosya-ad">' + (EXCEL.dosya ? kacis(EXCEL.dosya) : '<span class="a-deger-yok">Dosya seçilmedi</span>') + "</span></div>" +
      (EXCEL.dosya ? '<div class="a-excel-kap">' + tablo(["Satır", "Ekipman", "Durum"], satirlar.map(function (x, i) {
        return [String(i + 2), '<span class="a-kod">' + kacis(x.kod) + "</span> " + kacis(x.tur) + '<span class="a-alt-satir">' + kacis(x.konum) + "</span>",
          x.ok ? rozet({ ad: "Eklenecek", rozet: "a-rozet-tamam" }) : '<span class="a-uyari-metin a-hata-metin">' + kacis(x.neden) + "</span>"];
      })) + "</div>" : ""),
      MK.tus({ eylem: "pencere-kapat", ad: "Vazgeç", sinif: "a-tus-ikincil" }) + MK.tus({ eylem: "excel-yukle", ad: "Yükle" + (EXCEL.dosya ? " (" + gecerli.length + ")" : ""), ikon: "upload", kapali: !EXCEL.dosya || !gecerli.length }));
  }
  X["excel-ice"] = function (el) {
    var p = pl(el); if (!p || !ekipmanAcik(p)) return;
    EXCEL = { p: p, dosya: "", satirlar: [] }; excelIceCiz();
    $("a-pencere-alt").querySelector('[data-eylem="pencere-kapat"]').focus({ preventScroll: true }); document.querySelector('#a-pencere [data-eylem="excel-sec"]').focus();
  };
  X["excel-sablon"] = function () { MK.indir("ekipman-yukleme-sablonu.xlsx", MK.xlsx("Ekipmanlar", [["Kod", "Ekipman türü", "Konum", "Seri no"], ["HT-9001", "Hava tankı", "Kazan dairesi", "HT-24-118"]])); };
  /* maket: dosya penceresi yerine örnek dosya; satırlar yeni kayıt denetimiyle aynı kurala göre (kod eşsiz, tür katalogda) */
  /* satırlar denetlenir (kod eşsiz, tür katalogda); gerçek dosyada ilk satır başlıksa atlanır; sütun sırası şablondaki gibi */
  var excelSatirlari = function (p, ham) {
    if (ham.length && /kod/i.test(ham[0][0] || "")) ham = ham.slice(1);
    return ham.map(function (h) {
      var kod = kodNormal(h[0] || ""), t = KATALOG.filter(function (x) { return tr(x.ad) === tr(h[1] || ""); })[0], kd = kodDurum(p, kod), ayni = ham.filter(function (y) { return kodNormal(y[0] || "") === kod; }).length > 1;
      return { kod: kod || "—", tur: h[1] || "", konum: h[2] || "", seri: h[3] || "", t: t, ok: !!kod && !!t && kd.tur === "tamam" && !ayni,
        neden: !kod ? "Kod yok, atlanır" : !t ? "Tür bulunamadı, atlanır" : ayni ? "Dosyada iki kez, atlanır" : kd.tur === "tamam" ? "" : "Planda var, atlanır" };
    });
  };
  X["excel-sec"] = function () {
    var p = EXCEL.p;
    MK.dosyaSec({ kabul: ".xlsx,.csv", ornek: p.no + "-ekipman-yukle.xlsx" }, function (ad, f) {
      if (!f) { EXCEL.dosya = ad; EXCEL.satirlar = excelSatirlari(p, ornekSatirlar(p)); excelSonra(); return; }
      MK.tabloOku(f).then(function (ham) { EXCEL.dosya = ad; EXCEL.satirlar = excelSatirlari(p, ham); excelSonra(); })
        .catch(function () { EXCEL.dosya = ""; EXCEL.satirlar = []; excelIceCiz(); MK.bildir(ad + " okunamadı; .xlsx ya da .csv seçin."); });
    });
  };
  var excelSonra = function () { excelIceCiz(); var y = document.querySelector('#a-pencere [data-eylem="excel-yukle"]'); if (y && !y.disabled) y.focus({ preventScroll: true }); };
  var ornekSatirlar = function (p) {
    return [["HT-9001", "Hava tankı", "Kazan dairesi", "HT-24-118"], ["FL-9002", "Forklift", "Sevkiyat alanı", "FL-22-431"],
      [p.ekp[0], SICIL[p.ekp[0]].tur.ad, SICIL[p.ekp[0]].konum, ""], ["VK-9003", "Vinç kancası", "Depo girişi", ""]];
  };
  X["excel-yukle"] = function () {
    var p = EXCEL.p, ok = EXCEL.satirlar.filter(function (x) { return x.ok; }), atla = EXCEL.satirlar.length - ok.length;
    ok.forEach(function (x) {
      SICIL[x.kod] = { kod: x.kod, tur: x.t, konum: x.konum, tesis: p.id, onceki: null, eklendi: simdi(), seri: x.seri };
      p.ekp.push(x.kod); p.sonradan.push(x.kod); ortakEkipman(p, x.kod);
    });
    kaydet(p, simdi(), BEN, "Excel'den ekipman yüklendi", ok.length + " ekipman · " + EXCEL.dosya);
    $("a-pencere").close(); goster(false);
    MK.bildir(ok.length + " ekipman plana eklendi" + (atla ? "; " + atla + " satır atlandı." : "."));
  };
  X["saha-indir"] = function () { MK.yazdir($("a-pencere-baslik").textContent, $("a-pencere-govde").innerHTML); };
  X["ekle-ac"] = function (el) { var p = pl(el); if (p && ekipmanAcik(p)) ekleAc(p); };
  X["ekle-kapat"] = ekleKapat;
  X["tesistekini-sec"] = function (el) { E.sekme = "kayitli"; E.secili = [el.dataset.kod]; ekleCiz(); };
  X["kayitli-ekle"] = function () {
    if (E.plan && E.secili.length) {
      var p = E.plan, n = E.secili.length;
      E.secili.forEach(function (kod) { p.ekp.push(kod); p.sonradan.push(kod); ortakEkipman(p, kod); kaydet(p, simdi(), BEN, "Kayıtlı ekipman plana alındı", kod + " · " + SICIL[kod].tur.ad); });
      var gorunur = kaydaGit(E.secili[0]);
      ekleKapat(); goster(false); MK.bildir(n + " kayıtlı ekipman plana eklendi" + (gorunur ? "." : "; süzgeç yüzünden listede görünmüyor."));
    }
  };
  X["yeni-kaydet"] = function () {
    if (E.plan && E.tur && kodDurum(E.plan, E.kod).tur === "tamam") {   /* kaydetmeden önce yeniden denetlenir */
      var p = E.plan, kod = E.kod;
      SICIL[kod] = { kod: kod, tur: E.tur, konum: E.konum.trim() || "Konum yazılmadı", tesis: p.id, onceki: null, eklendi: simdi(), seri: E.seri.trim() };
      p.ekp.push(kod); p.sonradan.push(kod); ortakEkipman(p, kod); kaydet(p, simdi(), BEN, "Ekipman eklendi", kod + " · " + E.tur.ad);
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
    $("a-red-ozet").innerHTML = "<b>" + kacis(p.ad) + "</b> · " + p.no + "<br>" + kacis(p.musteri) + "<br>" + gunYaz(p.tarih) + (p.bitTarih !== p.tarih ? " – " + gunYaz(p.bitTarih) : "");
    $("a-red-ipucu").hidden = true; $("a-red-pencere").showModal();   /* kural yalnız hata anında yazılır (§3.8 kural 4) */ $("a-red-gerekce").focus();
  };
  document.addEventListener("change", function (e) {
    var b = e.target.dataset && e.target.dataset.beyan;
    if (b) { var pb = bul(+b); pb.beyanOkundu = e.target.checked; goster(false); var geriB = document.querySelector('[data-beyan="' + b + '"]'); if (geriB) geriB.focus(); return; }
    var k = e.target.dataset && e.target.dataset.kayitli;
    if (!k) return;
    var i = E.secili.indexOf(k);
    if (e.target.checked && i < 0) E.secili.push(k); else if (!e.target.checked && i >= 0) E.secili.splice(i, 1);
    ekleCiz();
    var geri = document.querySelector('[data-kayitli="' + k + '"]'); if (geri) geri.focus();
  });
  MK.onGirdi = function (e) {
    var t = e.target;
    if (S && $("a-pencere").open && (t.id === "w-ilk" || t.id === "w-sure")) { S[t.dataset.alan] = t.value; return; }
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
    $("a-red-onay").disabled = !yeter; if (yeter) $("a-red-ipucu").hidden = true;
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

  MK.kabuk({ modul: 13, kullanici: { bas: "MK", ad: "Mert Kaya", rol: "Inspector · Makine Mühendisi" } });
  $("a-suzgec-kap").innerHTML = MK.suzgecHtml("l");   /* Planlar süzgeci de aynı üreticiden (kalıp 15) */
  MK.seciciCiz("l"); goster(false);
})();
