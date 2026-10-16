/* ONAYLAR — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır: onay kuyruğu ve imzamı bekleyenler (onayListeleri), tüm raporlar (sayfalı), Onayla / Geri
   gönder / Onayı geri al / Durumu değiştir (teknik yönetici — canDoEylem rapor_onayla …; geçişler veritabanında, 0026). Girdi modülün şemasından
   (GeriGirdisi, DurumGirdisi). Son imza (e-imza) burada yok: kullanıcının cihazında atılır. 2026-10-16 (2. adım a incelemesi): durum değiştirme
   ekranda açık, kaydedilmemiş raporu ezmez (önce ekranın kaydı — EKRAN_KAYDEDILMEMIS). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EKRAN_KAYDEDILMEMIS, ekranRaporuKirli, islem, sayfaBilgisi, sayfala, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { RAPOR_DURUM, RevizeGirdisi, RevizeRedGirdisi } from "../raporlar/sema.ts";
import { BELGE_DURUM, BELGE_TUR, DurumGirdisi, GeriGirdisi } from "./sema.ts";
import { belgeGeriGonder, digerBelgeler } from "./server/belgeler.ts";
import { durumDegistir, geriGonder, onayGeriAl, onayla, onayListeleri, revizeIstegiReddet, revizeyeGonder, tumRaporlarSayfasi, type OnaySatiri } from "./server/onaylar.ts";

const MODUL = 15;
const RAPOR_SURUM = z.object({ rapor: kimlik, surum });
const satir = (r: OnaySatiri) => ({ id: r.id, no: r.no, durum: RAPOR_DURUM[r.durum][0], surum: r.surum, ekipman: r.ekipmanKod, tur: r.turAd, brans: r.brans,
  musteri: r.musteri, tesis: r.tesis, denetci: r.denetci, sonuc: r.sonuc, bekleme: r.bekleme, izin: r.izin });

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "onay_kuyrugu", modul: MODUL, tur: "oku", islev: onayListeleri, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Onay kuyruğu (yöneticinin onayını bekleyen raporlar, 20'şer), imzanı bekleyen raporlar, bekleyen revize isteği / talep / belge sayıları.",
    calistir: async (b, v) => {
      const l = await onayListeleri(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Onaylar'ı göremiyor." };
      const s = sayfala(l.kuyruk, v.sayfa);
      return { tamam: true, sonuc: { yonetici: l.yonetici, ...s.bilgi, kuyruk: s.satirlar.map(satir), imzami_bekleyen: l.imzaBekleyen.map(satir),
        revize_istegi: l.istekler.length, talep: l.talepler.length, belge: l.belgeBekleyen } };
    },
  }),
  islem({
    ad: "onay_tum_raporlar", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: tumRaporlarSayfasi,
    tarif: "Yöneticinin görebildiği bütün raporlar (20'şer): alan.no, alan.tesis, sec.durum (taslak | onayda | onaylandi | imzada | imzali), sayfa.",
    calistir: async (b, _v, ham) => {
      const l = await tumRaporlarSayfasi(b.db, b.kim, ham);
      if (!l) return { tamam: false, neden: "Tüm raporlar yalnız yönetici düzeyinde görünür." };
      return { tamam: true, sonuc: { ...sayfaBilgisi(l), raporlar: l.gorunen.map(satir) } };
    },
  }),
  islem({
    ad: "rapor_onayla", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM, kaynak: [kimlik, surum], islev: onayla,
    tarif: "Onaydaki raporu onaylar (teknik yönetici); rapor muayene uzmanının son imzasına gider.",
    calistir: async (b, v) => yazmaCevabi(await onayla(b.db, b.kim, v.rapor, v.surum)),
  }),
  islem({
    ad: "rapor_geri_gonder", modul: MODUL, tur: "yaz", girdi: GeriGirdisi.extend({ rapor: kimlik, surum }), kaynak: [GeriGirdisi, kimlik, surum], islev: geriGonder,
    tarif: "Onaydaki raporu denetçiye geri gönderir (gerekçe en az 10 karakter: neyin düzeltileceği).",
    calistir: async (b, v, ham) => yazmaCevabi(await geriGonder(b.db, b.kim, v.rapor, v.surum, { gerekce: ham.gerekce })),
  }),
  islem({
    ad: "rapor_onay_geri_al", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM, kaynak: [kimlik, surum], islev: onayGeriAl,
    tarif: "Onaylanmış (imza bekleyen) raporun onayını geri alır; rapor yeniden kuyrukta.",
    calistir: async (b, v) => yazmaCevabi(await onayGeriAl(b.db, b.kim, v.rapor, v.surum)),
  }),
  islem({
    ad: "rapor_durum_degistir", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM.extend({ degisiklik: DurumGirdisi }), kaynak: [DurumGirdisi, kimlik, surum],
    islev: durumDegistir,
    tarif: "Tamamlanmamış raporun durumunu değiştirir: degisiklik { hedef: taslak | onayda | onaylandi, gerekce (Yeni'ye alınırsa en az 10 karakter) }.",
    calistir: async (b, v, ham) => (ekranRaporuKirli(b, [v.rapor]) ? { tamam: false, neden: EKRAN_KAYDEDILMEMIS }
      : yazmaCevabi(await durumDegistir(b.db, b.kim, v.rapor, v.surum, ham.degisiklik))),
  }),
  /* 2026-10-16 (2. adım b): revize istekleri ve diğer belgeler — Onaylar › Revize istekleri / Diğer belgeler tuşlarının işlevleri */
  islem({
    ad: "revize_istekleri", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: onayListeleri,
    tarif: "Tamamlanan raporlardaki bekleyen revize istekleri (teknik yönetici, en yeni üstte): rapor, sürüm, isteğin kimliği / sürümü ve gerekçesi.",
    calistir: async (b, v) => {
      const l = await onayListeleri(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Onaylar'ı göremiyor." };
      const s = sayfala(l.istekler, v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, istekler: s.satirlar.map((r) => ({ ...satir(r), istek: r.istek })) } };
    },
  }),
  islem({
    ad: "revizeye_gonder", modul: MODUL, tur: "yaz", girdi: RevizeGirdisi.extend({ rapor: kimlik, surum }), kaynak: [RevizeGirdisi, kimlik, surum], islev: revizeyeGonder,
    tarif: "Tamamlanan raporu revizeye gönderir (R+1 olarak denetçiye Yeni döner; tamamlanan sürüm ve imzalı PDF saklı): rapor, surum, gerekce (en az 10).",
    calistir: async (b, v, ham) => yazmaCevabi(await revizeyeGonder(b.db, b.kim, v.rapor, v.surum, { gerekce: ham.gerekce })),
  }),
  islem({
    ad: "revize_istegi_reddet", modul: MODUL, tur: "yaz", girdi: RevizeRedGirdisi.extend({ rapor: kimlik, istek: kimlik, istek_surum: surum }),
    kaynak: [RevizeRedGirdisi, kimlik, surum], islev: revizeIstegiReddet,
    tarif: "Bekleyen revize isteğini reddeder (denetçi raporunda görür, yeniden isteyebilir): rapor, istek, istek_surum (revize_istekleri), gerekce (isteğe bağlı).",
    calistir: async (b, v, ham) => yazmaCevabi(await revizeIstegiReddet(b.db, b.kim, v.rapor, v.istek, v.istek_surum, { gerekce: ham.gerekce ?? "" })),
  }),
  islem({
    ad: "diger_belgeler", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: digerBelgeler,
    tarif: "Kullanıcının imzasını bekleyen ve imzaladığı diğer belgeler (bordro, eğitim, zimmet formu, araç tutanağı): tür, durum, sürüm. İmzalı PDF ekrandan yüklenir.",
    calistir: async (b, v) => {
      const d = await digerBelgeler(b.db, b.kim);
      const s = sayfala(d.belgeler.map(({ dosya: _d, imzaliDosya: _i, ...x }) => ({ ...x, tur: BELGE_TUR[x.tur], durum: BELGE_DURUM[x.durum][0] })), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, bekleyen: d.bekleyen, belgeler: s.satirlar } };
    },
  }),
  islem({
    ad: "belge_geri_gonder", modul: MODUL, tur: "yaz", girdi: z.object({ belge: kimlik, surum }), kaynak: [kimlik, surum], islev: belgeGeriGonder,
    tarif: "İmzası beklenen kendi belgesini gönderene geri gönderir (yanlışsa).",
    calistir: async (b, v) => yazmaCevabi(await belgeGeriGonder(b.db, b.kim, v.belge, v.surum), { bildirim: "Belge geri gönderildi." }),
  }),
];
