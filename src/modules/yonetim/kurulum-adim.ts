/* KURULUM ADIMLARI — SAF (FIRMA-VT §5.12; FV10 — 2026-10-16). Kendi projeli firmanın kurulum makinesinin (server/kurulum.ts) sırası, adları, hata
   sınıfları ve proje adı. Sıra merkezdeki firma_kurulum_ilerlet ile AYNI (0096: adım yalnız aynı kalır ya da bir ileri gider). Ekran (ui/KurulumPaneli.tsx)
   adları buradan okur — bu dosya TARAYICIYA da gider: sunucu modülü içe aktarmaz (hata sınıfı server/kurulum-hata.ts). */

export const KURULUM_ADIMLARI = ["kayit", "proje", "hazir", "ssl", "goc", "vt_kimlik", "rol", "havuzcu", "depo", "dene", "firma", "eposta", "yz", "tamam"] as const;
export type KurulumAdimi = (typeof KURULUM_ADIMLARI)[number];
export type KurulumDurumu = "bekliyor" | "calisiyor" | "hata" | "durdu" | "tamam";

export const ADIM_ADI: Readonly<Record<KurulumAdimi, string>> = {
  kayit: "Firma kaydı", proje: "Supabase projesi açılıyor", hazir: "Proje hazırlanıyor", ssl: "Yalnız şifreli bağlantı", goc: "Veritabanı şeması (göçler)",
  vt_kimlik: "Veritabanı kimliği", rol: "Uygulama rolü ve parolası", havuzcu: "Bağlantı havuzu", depo: "Dosya deposu", dene: "Deneme bağlantısı",
  firma: "Firma ve ilk yönetici", eposta: "E-posta gönderimi", yz: "Yapay zekâ anahtarı", tamam: "Tamam",
};

/** sayfa açıkken ilerletme aralığı · her ilerletmenin bütçesi · yeniden denenen hatanın en çok deneme sayısı (sonra "Sürdür" ister) */
export const KURULUM = { aralikMs: 3_000, butceMs: 40_000, enCokDeneme: 5 } as const;

export function sonrakiAdim(a: KurulumAdimi): KurulumAdimi {
  const i = KURULUM_ADIMLARI.indexOf(a);
  if (i < 0 || i === KURULUM_ADIMLARI.length - 1) throw new Error("Son adımın sonrası yok.");
  return KURULUM_ADIMLARI[i + 1]!;
}
export const adimSirasi = (a: KurulumAdimi): number => KURULUM_ADIMLARI.indexOf(a);

/** Supabase'teki proje adı — yeniden denemede aynı projenin bulunması için ad ile aranır (proje açmada tekrar koruması yok) */
export const kurulumProjeAdi = (kisaAd: string, firmaId: string): string => `probata-${kisaAd}-${firmaId.slice(0, 8)}`;

/** adımın hatası: yeniden denenir mi, kalıcı mı ("Sürdür" ister); kısa kod (yönetim izine yalnız o gider — metin değil) */
export interface KurulumHatasi { sinif: "yeniden" | "kalici"; kod: string }

/** adımın sırsız açıklaması (ekranda ve maskelenerek kayıtta): sınıf + kısa kod; sunucunun iletisi yazılmaz */
export function hataMetni(h: KurulumHatasi): string {
  const A: Record<string, string> = {
    oran_siniri: "Supabase istek sınırı — kısa süre sonra yeniden denenir.", sunucu: "Supabase geçici hata verdi — yeniden denenir.",
    odeme: "Supabase planı / ödemesi yeni proje açmaya izin vermiyor.", yetki: "Supabase yönetim anahtarının yetkisi yetmiyor.",
    bicim: "Supabase'in yanıtı beklenen biçimde değil.", baglanti: "Firmanın veritabanına ulaşılamadı — yeniden denenir.",
    parola: "Uygulama parolası henüz geçmedi — yeniden denenir.", sertifika: "Veritabanı sertifikası doğrulanamadı.",
    sunucu_izin: "Veritabanı sunucusu izin listesinde değil.", goc: "Göçler uygulanamadı.", init_failed: "Supabase projesi açılamadı (INIT_FAILED).",
    zaman: "İstek zaman aşımına uğradı — yeniden denenir.", bilinmeyen: "Beklenmeyen hata — yeniden denenir.",
  };
  if (A[h.kod]) return A[h.kod]!;
  if (h.kod.startsWith("sql_") || h.kod.startsWith("vt_")) return `Veritabanı hatası (${h.kod.slice(h.kod.indexOf("_") + 1).toUpperCase()}).`;
  if (h.kod.startsWith("istek_")) return `Supabase isteği reddetti (${h.kod.slice(6)}).`;
  return `Hata (${h.kod}).`;
}
