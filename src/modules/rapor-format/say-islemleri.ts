/* RAPOR FORMATI — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Ekipman türleri › Rapor şablonu ekranıyla aynı yetki ve kural (sürümler: görebilen;
   taslak / yayın / geri dönüş: "yaz" düzeyi, tür başına tek taslak, yayınlanan sürüm değişmez, kilitli Bakanlık öğesi ENGEL öteki denetim uyarı;
   sürüm sil: taslak ya da hiç kullanılmamış eski sürüm, yönetici; hazır şablondan tür: tür + taslak tek işlemde). Girdi modülün şemasından
   (BaslatGirdisi, YayinNotu; tür alanları Ekipman türleri'nin TurGirdisi). Taslağı SAYFA AÇMADAN düzenleme: format_taslak_duzenle — Format kurucunun
   işlemleriyle (say-kurucu.ts formatIslemleri: bölüm / öğe / sonuç kuralı), kaydedilen taslağa; Format kurucu ekranda açıksa S.A.Y orada
   formati_duzenle aracını kullanır (kaydedilmemiş değişiklikler ekranda). */
import { kurucuyaHazirla } from "../../format/duzen.ts";
import { SABLONLAR } from "../../format/sablonlar.ts";
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, IslemGeriAl, metinSayfasi, yazmaCevabi, type IslemCevabi, type Islem } from "../../server/yz/islem.ts";
import { TurGirdisi } from "../ekipman-turleri/sema.ts";
import { formatHaritasi, formatIslemleri, type FormatIslemi } from "./say-kurucu.ts";
import { BaslatGirdisi, YayinNotu } from "./sema.ts";
import {
  formatAyrintisi, formatSurumleri, GeriDonusIptal, sablondanTurEkle, sablonKullanimi, surumeGeriDon, surumSil, taslakBaslat, taslakKaydet, yayinDenetle, yayinla,
  type YayinSonucu,
} from "./server/formatlar.ts";

const MODUL = 5;
/** yayın sonucu → S.A.Y'ın cevabı (engel nedenleriyle, uyarılar bilgi) */
function yayinCevabi(r: YayinSonucu | { durum: "yayinda" }): IslemCevabi {
  if (r.durum === "tamam") return { tamam: true, bildirim: `Sürüm ${r.sira} yayında.${r.uyarilar.length ? ` Uyarılar (engel değil): ${r.uyarilar.slice(0, 20).join(" ")}` : ""}` };
  if (r.durum === "engel") return { tamam: false, neden: `Yayınlanamadı: ${r.engeller.slice(0, 20).join(" ")}` };
  if (r.durum === "yayinda") return { tamam: false, neden: "Bu sürüm zaten yayında." };
  return yazmaCevabi(r);
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "format_surumleri", modul: MODUL, tur: "oku", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: formatSurumleri,
    tarif: "Ekipman türünün rapor formatı sürümleri: kimlik, sıra, durum (taslak / yayinda / eski), kaynak şablon, not, sürüm (surum).",
    calistir: async (b, v) => {
      const l = await formatSurumleri(b.db, b.kim, v.tur);
      return l ? { tamam: true, sonuc: { surumler: l } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "format_getir", modul: MODUL, tur: "oku", girdi: z.object({ format: kimlik, sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [kimlik, SuzgecDurumuSemasi],
    islev: formatAyrintisi,
    tarif: "Format sürümünün haritası (bölümler, öğeler, formüller, sınırlar, sonuç kuralları — sayfa sayfa), durumu, sürümü (surum), taslaksa yayın denetimi.",
    calistir: async (b, v) => {
      const f = await formatAyrintisi(b.db, b.kim, v.format);
      if (!f) return { tamam: false, neden: GORUNMEZ };
      const { tanim, ...ozet } = f;
      const m = tanim ? metinSayfasi(formatHaritasi(f.durum === "taslak" ? kurucuyaHazirla(tanim) : tanim), v.sayfa) : null;
      return { tamam: true, sonuc: { ...ozet, harita: m?.metin ?? "Tanım okunamadı.", ...(m ? { harita_sayfa: m.bilgi } : {}) } };
    },
  }),
  islem({
    ad: "hazir_sablonlar", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: sablonKullanimi,
    tarif: "Hazır rapor şablonları (Bakanlık ZPKR… ve genel): anahtar, ad, Bakanlık mı, önerilen tür; firmada hangi türde kullanıldığı.",
    calistir: async (b) => {
      const k = await sablonKullanimi(b.db, b.kim);
      if (!k) return { tamam: false, neden: "Bu kullanıcı rapor formatlarını göremiyor." };
      return { tamam: true, sonuc: { sablonlar: Object.entries(SABLONLAR).map(([anahtar, s]) => ({ anahtar, ad: s.ad, bakanlik: s.bakanlik, tur: s.tur, kullanan: k[anahtar] ?? [] })) } };
    },
  }),
  islem({
    ad: "sablondan_tur_ekle", modul: MODUL, tur: "yaz", girdi: z.object({ sablon: z.string().regex(/^[A-Z][A-Z0-9_]{1,23}$/), tur: z.object(TurGirdisi.shape).partial() }),
    kaynak: [TurGirdisi], islev: sablondanTurEkle,
    tarif: "Hazır şablondan ekipman türü ekler ve o şablondan TASLAK başlatır (tek işlem; yayın ayrı — format_yayinla): sablon (anahtar — hazir_sablonlar), tur { ad, "
      + "kod, grup, periyot … — verilmeyen şablonun önerisinden }.",
    calistir: async (b, v, ham) => {
      const s = Object.hasOwn(SABLONLAR, v.sablon) ? SABLONLAR[v.sablon] : null;
      if (!s) return { tamam: false, neden: "Şablon bulunamadı (hazir_sablonlar)." };
      const t = (ham.tur ?? {}) as Record<string, unknown>, yazi = (x: unknown) => (x === null || x === undefined ? "" : String(x));
      const g = { ad: yazi(t.ad ?? s.tur.ad), kod: yazi(t.kod ?? s.tur.kod), grup: yazi(t.grup ?? s.tur.grup), brans: yazi(t.brans), periyot: yazi(t.periyot ?? s.tur.periyot),
        sure: yazi(t.sure) };
      const r = await sablondanTurEkle(b.db, b.kim, v.sablon, g);
      return r.durum === "tamam" ? { tamam: true, bildirim: "Tür eklendi, şablondan taslak başladı.", sonuc: { tur: r.turId, format: r.formatId } } : yazmaCevabi(r);
    },
  }),
  islem({
    ad: "taslak_baslat", modul: MODUL, tur: "yaz", girdi: z.object({ tur: kimlik, baslangic: BaslatGirdisi, taslak_surum: surum.nullable().default(null) }),
    kaynak: [BaslatGirdisi, kimlik, surum], islev: taslakBaslat,
    tarif: "Türe taslak başlatır: baslangic — \"sablon:<anahtar>\" (hazır şablon), \"surum:<format kimliği>\" (türün yayınlanmış bir sürümü) ya da \"bos\" "
      + "(sıfırdan); açık taslak varsa yerine geçer (taslak_surum: o taslağın sürümü — format_surumleri).",
    calistir: async (b, v, ham) => yazmaCevabi(await taslakBaslat(b.db, b.kim, v.tur, ham.baslangic, v.taslak_surum), { bildirim: "Taslak başladı." }),
  }),
  islem({
    ad: "format_taslak_duzenle", modul: MODUL, tur: "yaz", girdi: z.object({ format: kimlik, surum, islemler: z.array(z.record(z.string(), z.unknown())).min(1).max(100) }),
    kaynak: [kimlik, surum], islev: taslakKaydet,
    tarif: "Kaydedilmiş TASLAĞI sayfa açmadan değiştirir ve kaydeder — işlemler formati_duzenle aracıyla aynı (bolum_ekle, bolum_sil, bolum_adi, grup_ekle, oge_ekle, "
      + "oge_degistir, oge_sil, sonuc_kurali; bölüm / öğe kimlikle ya da adıyla — format_getir haritası); surum: taslağın sürümü. Format kurucu ekranda açıksa onun "
      + "formati_duzenle aracını kullan.",
    calistir: async (b, v, ham) => {
      const f = await formatAyrintisi(b.db, b.kim, v.format);
      if (!f) return { tamam: false, neden: GORUNMEZ };
      if (f.durum !== "taslak" || !f.tanim) return { tamam: false, neden: "Yalnız taslak düzenlenir (yayınlanan sürüm değişmez); önce taslak_baslat." };
      const r = formatIslemleri(kurucuyaHazirla(f.tanim), ham.islemler as FormatIslemi[]);
      if (!r.yapilan.length) return { tamam: false, neden: `Hiçbir değişiklik yapılamadı: ${r.gecersiz.join("; ") || "işlem yok"}` };
      const k = await taslakKaydet(b.db, b.kim, v.format, v.surum, r.t);
      if (k.durum !== "tamam") return yazmaCevabi(k);
      return { tamam: true, bildirim: `Taslak kaydedildi: ${r.yapilan.join("; ")}.${r.gecersiz.length ? ` Yapılamayan: ${r.gecersiz.join("; ")}` : ""}`, sonuc: { id: k.id, surum: k.surum } };
    },
  }),
  islem({
    ad: "format_yayin_denetle", modul: MODUL, tur: "oku", girdi: z.object({ format: kimlik }), kaynak: [kimlik], islev: yayinDenetle,
    tarif: "Taslağın yayın denetimi: engeller (yayını durdurur) ve uyarılar (engel değil).",
    calistir: async (b, v) => {
      const d = await yayinDenetle(b.db, b.kim, v.format);
      return d ? { tamam: true, sonuc: { ...d } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "format_yayinla", modul: MODUL, tur: "yaz", girdi: z.object({ format: kimlik, surum, notu: YayinNotu.optional() }), kaynak: [YayinNotu, kimlik, surum], islev: yayinla,
    tarif: "Taslağı yayınlar (yeni sürüm; yayındaki eskiye düşer; açık raporlar kendi sürümünde kalır): format, surum (taslağın), notu (en çok 200).",
    calistir: async (b, v, ham) => yayinCevabi(await yayinla(b.db, b.kim, v.format, v.surum, ham.notu ?? "")),
  }),
  islem({
    ad: "surume_geri_don", modul: MODUL, tur: "yaz", girdi: z.object({ tur: kimlik, surum_id: kimlik, taslak_surum: surum.nullable().default(null), notu: YayinNotu.optional() }),
    kaynak: [YayinNotu, kimlik, surum], islev: surumeGeriDon,
    tarif: "Eski sürümün içeriğini YENİ sürüm olarak yayınlar (sürümler değişmez): tur, surum_id (eski sürüm), taslak_surum (açık taslak varsa sürümü), notu.",
    calistir: async (b, v, ham) => {
      try { return yayinCevabi(await surumeGeriDon(b.db, b.kim, v.tur, v.surum_id, v.taslak_surum, ham.notu ?? "")); }
      catch (e) { if (e instanceof GeriDonusIptal) throw new IslemGeriAl(yayinCevabi(e.sonuc)); throw e; }
    },
  }),
  islem({
    ad: "format_surum_sil", modul: MODUL, tur: "yaz", girdi: z.object({ format: kimlik }), kaynak: [kimlik], islev: surumSil,
    tarif: "Taslağı ya da hiç kullanılmamış eski sürümü kesin siler (yönetici); yayındaki ya da raporu olan sürüm silinmez.",
    calistir: async (b, v) => {
      const r = await surumSil(b.db, b.kim, v.format);
      if (r.durum === "kullanildi") return { tamam: false, neden: "Bu sürüm kullanıldı (yayında ya da raporu var); silinmez." };
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
];
