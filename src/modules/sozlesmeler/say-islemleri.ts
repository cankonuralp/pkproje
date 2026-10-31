/* SÖZLEŞMELER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Sözleşmeler ekranıyla aynı yetki ve kural (liste / kart: görebilen, denetçi yalnız kendi
   İSG-KATİP kaydı olan sözleşmeyi; hazırla / İSG-KATİP: "yaz" düzeyi; tesisler müşterinin etkin tesisleri, dayanak teklif aynı müşterinin kabul
   edilmiş teklifi; numara sunucuda; kullanılmış İSG-KATİP ID silinmez; sil: imza bekleyen, faturasız sözleşme, yönetici). Girdi modülün şemasından
   (SozlesmeGirdisi, IsgGirdisi). İmzalı sözleşme PDF'i ve İSG-KATİP belgesi dosya ister — ekrandan yüklenir. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EK_NO, ekBelgesi, GORUNMEZ, islem, sayfaBilgisi, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { IsgGirdisi, SozlesmeGirdisi } from "./sema.ts";
import { imzaliYukle, isgKaldir, isgKaydet, sozlesmeHazirla, sozlesmeKarti, sozlesmeSayfasi, sozlesmeSecenekleri, sozlesmeSil } from "./server/sozlesmeler.ts";

import { doldurmaCevabi, doldurmaHazirla } from "../../server/yz/doldurma.ts";
import { ElleDegerGirdisi } from "../rapor-format/sema.ts";
import { sozlesmeBelgeBolumu, sozlesmeDoldur } from "./server/sozlesmeler.ts";

import { sablonKaldir, sablonYukle } from "./server/sozlesmeler.ts";

const MODUL = 12;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "sozlesme_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: sozlesmeSayfasi,
    tarif: "İş sözleşmelerini arar (20'şer): ara — no, müşteri, tesis; durum (imza bekliyor / yürürlükte / bitiyor / bitti), kalan gün, İSG-KATİP kişileri, sayfa.",
    calistir: async (b, _v, ham) => {
      const l = await sozlesmeSayfasi(b.db, b.kim, ham);
      return l ? { tamam: true, sonuc: { ...sayfaBilgisi(l), sozlesmeler: l.gorunen } } : { tamam: false, neden: "Bu kullanıcı Sözleşmeler'i göremiyor." };
    },
  }),
  islem({
    ad: "sozlesme_getir", modul: MODUL, tur: "oku", girdi: z.object({ sozlesme: kimlik }), kaynak: [kimlik], islev: sozlesmeKarti,
    tarif: "Sözleşme kartı: müşteri, kapsamdaki tesisler, tarihler, vade, yenileme, imza durumu, sürümü (surum), İSG-KATİP SÖZLEŞME ID'leri (tesis × denetçi).",
    calistir: async (b, v) => {
      const s = await sozlesmeKarti(b.db, b.kim, v.sozlesme);
      return s ? { tamam: true, sonuc: { ...s } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "sozlesme_secenekleri", modul: MODUL, tur: "oku", girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, denetci: SuzgecDurumuSemasi.shape.ara }),
    kaynak: [SuzgecDurumuSemasi], islev: sozlesmeSecenekleri,
    tarif: "Sözleşme hazırlamak için seçenekler: etkin müşteriler ve tesisleri (ara: müşteri adı; en çok 40), kabul edilmiş teklifleri; denetçiler (İSG-KATİP ID için — "
      + "denetci: ad; verilmezse liste gelmez).",
    calistir: async (b, v) => {
      const s = await sozlesmeSecenekleri(b.db, b.kim);
      if (!s) return { tamam: false, neden: "Bu işlem için yetkiniz yok." };
      const ic = (x: string, q: string | undefined) => !q?.trim() || x.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr"));
      const musteriler = s.musteriler.filter((m) => ic(`${m.kisa} ${m.unvan}`, v.ara)).slice(0, 40);
      return { tamam: true, sonuc: { musteriler, teklifler: s.teklifler.filter((t) => musteriler.some((m) => m.id === t.musteri)),
        ...(v.denetci?.trim() ? { denetciler: s.kisiler.filter((k) => ic(k.ad, v.denetci)).slice(0, 40) } : {}) } };
    },
  }),
  islem({
    ad: "sozlesme_hazirla", modul: MODUL, tur: "yaz", girdi: z.object(SozlesmeGirdisi.shape), kaynak: [SozlesmeGirdisi], islev: sozlesmeHazirla,
    tarif: "İş sözleşmesi hazırlar (numara sunucuda; müşteri imzası bekler): musteri, tesisler (kimlik listesi), baslangic (YYYY-AA-GG), sure (\"1\"–\"36\" ay), "
      + "vade (\"0\"–\"120\" gün), yenileme (yok | otomatik), teklif (kabul edilmiş teklif, isteğe bağlı).",
    calistir: async (b, _v, ham) => yazmaCevabi(await sozlesmeHazirla(b.db, b.kim, ham), { bildirim: "Sözleşme hazırlandı." }),
  }),
  islem({
    ad: "isg_katip_kaydet", modul: MODUL, tur: "yaz", islev: isgKaydet, kaynak: [IsgGirdisi, kimlik, surum],
    girdi: z.object({ sozlesme: kimlik, isg: kimlik.nullable().default(null), surum: surum.default(0), kayit: z.object(IsgGirdisi.shape) }),
    tarif: "İSG-KATİP SÖZLEŞME ID ekler (isg boş — aynı tesis × denetçinin geçerli kaydı öncekine döner) ya da düzeltir (isg + surum): kayit { tesis (kapsamda), "
      + "personel (denetçi), no, onay, bitis (YYYY-AA-GG, isteğe bağlı) }. Belge PDF'i ekrandan.",
    calistir: async (b, v, ham) => yazmaCevabi(await isgKaydet(b.db, b.depo(), b.kim, b.firmaId, v.sozlesme, v.isg, v.surum, ham.kayit), { bildirim: v.isg ? "İSG-KATİP ID düzeltildi." : "İSG-KATİP ID eklendi." }),
  }),
  islem({
    ad: "isg_katip_kaldir", modul: MODUL, tur: "yaz", girdi: z.object({ isg: kimlik, surum }), kaynak: [kimlik, surum], islev: isgKaldir,
    tarif: "Kullanılmamış İSG-KATİP ID'yi kaldırır (planda kullanılmışsa yalnız düzeltilir).",
    calistir: async (b, v) => yazmaCevabi(await isgKaldir(b.db, b.kim, v.isg, v.surum), { bildirim: "İSG-KATİP ID kaldırıldı." }),
  }),
  islem({
    ad: "sozlesme_sil", modul: MODUL, tur: "yaz", girdi: z.object({ sozlesme: kimlik }), kaynak: [kimlik], islev: sozlesmeSil,
    tarif: "İmza bekleyen, faturasız sözleşmeyi kesin siler (yönetici); imzalı ya da faturalıysa nedeni döner.",
    calistir: async (b, v) => yazmaCevabi(await sozlesmeSil(b.db, b.kim, v.sozlesme), { bildirim: "Sözleşme silindi." }),
  }),
  /* 2026-10-31 (kalem 9 — M1 + M2; beceri B11): konuşmadaki ekin (M / F numarası) depodaki kopyası kaydın belge yuvasına — ekranın yükleme işleviyle */
  islem({
    ad: "sozlesme_imzali_yukle", modul: MODUL, tur: "yaz", islev: imzaliYukle, kaynak: [kimlik, surum],
    girdi: z.object({ sozlesme: kimlik, surum, ek: EK_NO }),
    tarif: "Konuşmadaki imzalı sözleşme PDF'ini (ek: M03) sözleşmeye ekler: sozlesme (sozlesme_ara), surum.",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      return yazmaCevabi(await imzaliYukle(b.db, b.depo(), b.kim, b.firmaId, v.sozlesme, v.surum, belge), { bildirim: `${belge.ad} sözleşmeye eklendi.` });
    },
  }),
  /* 2026-10-31 (S.A.Y belge doldurma): ekranın "Belgeyi doldur"u — yerler ve kayıt modülün işlevleriyle (src/server/yz/doldurma.ts) */
  islem({
    ad: "sozlesme_doldur", modul: MODUL, tur: "yaz", islev: sozlesmeDoldur, kaynak: [kimlik, ElleDegerGirdisi], girdi: z.object({ sozlesme: kimlik, degerler: ElleDegerGirdisi }),
    tarif: "Sözleşme belgesi: elle doldurulan yerlerine yazar — sozlesme, degerler (yerin kimliği ya da adı → değer; \"\" boşaltır). degerler boşsa yazmadan yerleri listeler (ad, tür, zorunlu, dolu mu).",
    calistir: async (b, v) => {
      const x = await sozlesmeKarti(b.db, b.kim, v.sozlesme);
      const h = doldurmaHazirla(x ? (await sozlesmeBelgeBolumu(b.db, b.kim, x, null))?.doldurma ?? null : null, v.degerler);
      return "cevap" in h ? h.cevap : doldurmaCevabi(await sozlesmeDoldur(b.db, b.kim, v.sozlesme, h.degerler, h.surum), "Sözleşme");
    },
  }),
  /* 2026-10-31 (S.A.Y yükleme yuvaları — reisim: "önerdiklerini kabul ediyorum"): ekranın yükleme işlevi, belge konuşmadaki ekin depodaki kopyasından (ekBelgesi) */
  islem({
    ad: "sozlesme_sablon_yukle", modul: MODUL, tur: "yaz", islev: sablonYukle, kaynak: [EK_NO], girdi: z.object({ ek: EK_NO }),
    tarif: "Sözleşme şablonu PDF'i (yayında sözleşme formatı yoksa belge olarak bu verilir): ek (PDF'in M numarası).",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      return yazmaCevabi(await sablonYukle(b.db, b.depo(), b.kim, b.firmaId, belge), { bildirim: "Sözleşme şablonu yüklendi." });
    },
  }),
  islem({
    ad: "sozlesme_sablon_kaldir", modul: MODUL, tur: "yaz", islev: sablonKaldir, kaynak: [kimlik, surum], girdi: z.object({ sablon: kimlik, surum }),
    tarif: "Sözleşme şablonu sürümünü kaldırır: sablon, surum (sozlesme_secenekleri / şablon listesi).",
    calistir: async (b, v) => yazmaCevabi(await sablonKaldir(b.db, b.kim, v.sablon, v.surum), { bildirim: "Sözleşme şablonu kaldırıldı." }),
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/sozlesmeler\/([0-9a-f-]{36})(?:\/|$)/, tur: "Sözleşme", islem: "sozlesme_getir", girdi: (id) => ({ sozlesme: id }) },
];
