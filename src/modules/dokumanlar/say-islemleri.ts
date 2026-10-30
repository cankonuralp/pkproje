/* DÖKÜMANLAR — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Dökümanlar ekranıyla aynı yetki ve kural (standart kütüphanesi ve dökümanlar: görebilen;
   kaldır: "yaz" düzeyi — güncel standart sürümü kaldırılınca bir öncekisi güncel olur, dosya saklanır). Girdi ortak şemadan (kimlik, surum) ve liste
   süzgecinden. Standart ve döküman YÜKLEME PDF ister — ekrandan (S.A.Y'da yok). Eğitimler src/modules/egitimler/say-islemleri.ts'te. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { dokumanKaldir, dokumanListesi, standartKaldir, standartKarti, standartListesi } from "./server/dokumanlar.ts";

const MODUL = 4;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "standart_ara", modul: MODUL, tur: "oku", islev: standartListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa, brans: z.enum(["m", "e"]).optional() }),
    tarif: "Standart kütüphanesini arar (20'şer): ara — numara, konu; brans m (mekanik) / e (elektrik); güncel sürüm, yükleme tarihi.",
    calistir: async (b, v) => {
      const l = await standartListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Dökümanlar'ı göremiyor." };
      const s = sayfala(l.filter((x) => (!v.brans || x.brans === v.brans) && trIcerir(`${x.no} ${x.surumAdi} ${x.konu}`, v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, standartlar: s.satirlar.map(({ dosyaId: _d, ...x }) => x) } };
    },
  }),
  islem({
    ad: "standart_getir", modul: MODUL, tur: "oku", girdi: z.object({ standart: kimlik }), kaynak: [kimlik], islev: standartKarti,
    tarif: "Standardın sürümleri (güncel ve öncekiler), sürümü (surum), konusu.",
    calistir: async (b, v) => {
      const s = await standartKarti(b.db, b.kim, v.standart);
      return s ? { tamam: true, sonuc: { ...s } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "standart_kaldir", modul: MODUL, tur: "yaz", girdi: z.object({ standart: kimlik, surum }), kaynak: [kimlik, surum], islev: standartKaldir,
    tarif: "Standart sürümünü kütüphaneden kaldırır (güncel sürümse bir öncekisi güncel olur; dosya saklanır).",
    calistir: async (b, v) => yazmaCevabi(await standartKaldir(b.db, b.kim, v.standart, v.surum), { bildirim: "Standart sürümü kaldırıldı." }),
  }),
  islem({
    ad: "dokuman_ara", modul: MODUL, tur: "oku", islev: dokumanListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Firmanın dökümanlarını arar (20'şer): ara — ad, tür, kod, revizyon.",
    calistir: async (b, v) => {
      const l = await dokumanListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Dökümanlar'ı göremiyor." };
      const s = sayfala(l.filter((x) => trIcerir(`${x.ad} ${x.tur} ${x.kod ?? ""} ${x.rev ?? ""}`, v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, dokumanlar: s.satirlar.map(({ dosyaId: _d, ...x }) => x) } };
    },
  }),
  islem({
    ad: "dokuman_kaldir", modul: MODUL, tur: "yaz", girdi: z.object({ dokuman: kimlik, surum }), kaynak: [kimlik, surum], islev: dokumanKaldir,
    tarif: "Dökümanı listeden kaldırır (dosya saklanır).",
    calistir: async (b, v) => yazmaCevabi(await dokumanKaldir(b.db, b.kim, v.dokuman, v.surum), { bildirim: "Döküman kaldırıldı." }),
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/dokumanlar\/standart\/([0-9a-f-]{36})(?:\/|$)/, tur: "Standart", islem: "standart_getir", girdi: (id) => ({ standart: id }) },
];
