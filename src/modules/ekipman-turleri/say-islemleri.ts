/* EKİPMAN TÜRLERİ — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Ekipman türleri ekranıyla aynı yetki ve kural (katalog: görebilen; ekle / düzenle: "yaz"
   düzeyi, kod 2–3 harf firmada eşsiz ve değişmez, branş Ek-III grubundan; sil: hiç kullanılmamış tür, yönetici). Girdi modülün şemasından
   (TurGirdisi); düzenlemede verilmeyen alan kartın değeriyle. Rapor formatı ve hazır şablondan tür: src/modules/rapor-format/say-islemleri.ts.
   Rapor formatı PDF'i yükleme dosya ister — ekrandan (S.A.Y'da format_pdf_kur ekran aracı). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { BaglantiGirdisi, GRUPLAR, TurGirdisi } from "./sema.ts";
import { StandartTanimGirdisi } from "../dokumanlar/sema.ts";
import { yeniTureFormat } from "../rapor-format/server/formatlar.ts";
import { baglantiKaydet, baglantiSecenekleri, standartlariTureBagla, turKarti, turKaydet, turListesi, turSil } from "./server/turler.ts";
import { formatKaldir } from "./server/turler.ts";

const MODUL = 5;
const ALAN = ["ad", "kod", "grup", "brans", "periyot", "sure"] as const;
function alanlar(mevcut: Record<string, unknown> | null, verilen: Record<string, unknown>): Record<string, unknown> {
  const yazi = (x: unknown) => (x === null || x === undefined ? "" : typeof x === "number" ? String(x) : x);
  return Object.fromEntries(ALAN.map((k) => [k, yazi(Object.hasOwn(verilen, k) ? verilen[k] : mevcut?.[k])]));
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "tur_ara", modul: MODUL, tur: "oku", islev: turListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa, brans: z.enum(["m", "e"]).optional() }),
    tarif: "Ekipman türlerini arar (20'şer): ara — ad, kod; brans m / e; Ek-III grubu, periyot (ay), yayındaki rapor formatı sürümü.",
    calistir: async (b, v) => {
      const l = await turListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Ekipman türleri'ni göremiyor." };
      const s = sayfala(l.filter((t) => (!v.brans || t.brans === v.brans) && trIcerir(`${t.ad} ${t.kod}`, v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, turler: s.satirlar } };
    },
  }),
  islem({
    ad: "tur_getir", modul: MODUL, tur: "oku", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: turKarti,
    tarif: "Tür kartı: bilgileri, sürümü (surum), rapor formatı sürümleri, kontrol metodu standartları, ölçüm cihazı türleri; Ek-III grupları.",
    calistir: async (b, v) => {
      const t = await turKarti(b.db, b.kim, v.tur);
      return t ? { tamam: true, sonuc: { ...t, gruplar: GRUPLAR.map((g) => ({ k: g.k, ad: g.ad, brans: g.b })) } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "tur_kaydet", modul: MODUL, tur: "yaz", islev: turKaydet, kaynak: [TurGirdisi, kimlik, surum],
    girdi: z.object({ tur: kimlik.nullable().default(null), surum: surum.default(0), alanlar: z.object(TurGirdisi.shape).partial() }),
    tarif: "Ekipman türü ekler (tur boş — Ek-III grubuna göre hazır rapor formatı da yayınlanır) ya da düzenler (tur + surum; kod değişmez): alanlar { ad, kod (2–3 "
      + "büyük harf), grup (Ek-III grubu anahtarı — tur_getir'deki gruplar), brans (Ek-III dışı grupta m / e), periyot (\"1\"–\"120\" ay), sure (dakika, boş olabilir) }.",
    calistir: async (b, v, ham) => {
      const mevcut = v.tur ? await turKarti(b.db, b.kim, v.tur) : null;
      if (v.tur && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(mevcut as Record<string, unknown> | null, (ham.alanlar ?? {}) as Record<string, unknown>);
      /* tuşun eylemiyle aynı (450): yeni türe Ek-III grubuna göre hazır format, yayında — aynı işlemde */
      const r = await turKaydet(b.db, b.kim, v.tur, v.surum, g);
      if (r.durum === "tamam" && !v.tur) await yeniTureFormat(b.db, b.kim, r.id);
      return yazmaCevabi(r, { bildirim: v.tur ? "Tür güncellendi." : "Tür eklendi; Ek-III grubuna göre hazır rapor formatı yayında." });
    },
  }),
  /* 2026-10-26 (S.A.Y Faz 3 — reisim'in listesi m.10: "standart ve ölçüm cihazı türlerini bağlatma"): Metot ve cihazlar penceresinin işleri */
  islem({
    ad: "tur_baglanti_secenekleri", modul: MODUL, tur: "oku", girdi: z.object({ tur: kimlik.optional() }), kaynak: [kimlik], islev: baglantiSecenekleri,
    tarif: "Kontrol metodu olarak seçilebilen standartlar (no, ad, branş, PDF'i kütüphanede mi) ve firmanın ölçüm cihazı türleri (kimlik, ad); tur verilirse "
      + "türün şu anki seçimi ve sürümü.",
    calistir: async (b, v) => {
      const s = await baglantiSecenekleri(b.db, b.kim);
      if (!s) return { tamam: false, neden: "Bu kullanıcı türün bağlantılarını değiştiremiyor." };
      const t = v.tur ? await turKarti(b.db, b.kim, v.tur) : null;
      return { tamam: true, sonuc: { ...s, ...(t ? { tur: { surum: t.surum, standartlar: t.standartlar.map((x) => x.no), cihazTurleri: t.cihazTurleri.map((x) => x.id) } } : {}) } };
    },
  }),
  islem({
    ad: "tur_baglanti_kaydet", modul: MODUL, tur: "yaz", islev: baglantiKaydet, kaynak: [BaglantiGirdisi, kimlik, surum],
    girdi: z.object({ tur: kimlik, surum, standartlar: BaglantiGirdisi.shape.standartlar, cihazTurleri: BaglantiGirdisi.shape.cihazTurleri }),
    tarif: "Türün kontrol metodu standartlarını (numaralar) ve kullanılacak ölçüm cihazı türlerini (kimlikler) kaydeder — listenin TAMAMI yazılır; surum "
      + "türün sürümü (tur_getir). Listede olmayan standart önce tur_standart_ekle ile.",
    calistir: async (b, v, ham) => yazmaCevabi(await baglantiKaydet(b.db, b.kim, v.tur, v.surum, { standartlar: ham.standartlar, cihazTurleri: ham.cihazTurleri }),
      { bildirim: "Kontrol metodu ve ölçüm cihazları kaydedildi." }),
  }),
  islem({
    ad: "tur_standart_ekle", modul: MODUL, tur: "yaz", islev: standartlariTureBagla, kaynak: [StandartTanimGirdisi, kimlik],
    girdi: z.object({ tur: kimlik, standartlar: z.array(StandartTanimGirdisi).min(1).max(20) }),
    tarif: "Standartları türün kontrol metoduna ekler (var olanlar kalır): standartlar [{ no, konu (adı) }] — kütüphanede ve Bakanlık listesinde olmayan "
      + "Dökümanlar'a elle eklenir (PDF'i sonra yüklenir).",
    calistir: async (b, v, ham) => {
      if (!(await baglantiSecenekleri(b.db, b.kim))) return { tamam: false, neden: "Bu kullanıcı türün bağlantılarını değiştiremiyor." };
      const yeni = await standartlariTureBagla(b.db, b.kim, v.tur, ham.standartlar.map((x) => ({ no: String(x.no ?? ""), konu: String(x.konu ?? "") })));
      return { tamam: true, bildirim: yeni.length ? `Türe bağlandı: ${yeni.join(", ")}.` : "Yeni bağlanan standart yok (zaten bağlı).", sonuc: { baglanan: yeni } };
    },
  }),
  islem({
    ad: "tur_sil", modul: MODUL, tur: "yaz", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: turSil,
    tarif: "Hiç kullanılmamış ekipman türünü kesin siler (yönetici); kullanılmışsa nedeni döner.",
    calistir: async (b, v) => {
      const r = await turSil(b.db, b.kim, v.tur);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
  /* 2026-10-31 (kalem 11 — M5 eksikleri): ekranın tuşunun işlevi */
  islem({
    ad: "tur_format_pdf_kaldir", modul: MODUL, tur: "yaz", islev: formatKaldir, kaynak: [kimlik, surum], girdi: z.object({ format: kimlik, surum }),
    tarif: "Türün basılı format PDF'i sürümlerinden birini kaldırır: format (tur_getir formatlar[].id), surum.",
    calistir: async (b, v) => yazmaCevabi(await formatKaldir(b.db, b.kim, v.format, v.surum), { bildirim: "Format PDF'i kaldırıldı." }),
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/ekipman-turleri\/([0-9a-f-]{36})(?:\/|$)/, tur: "Ekipman türü", islem: "tur_getir", girdi: (id) => ({ tur: id }) },
];
