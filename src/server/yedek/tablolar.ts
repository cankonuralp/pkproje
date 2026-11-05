/* YEDEĞE GİREN TABLOLAR (2026-11-03; reisim: "her gece tüm siteyi işlemeyelim yeni eklenenler eklensin yedeğe yeter her günün ayrı ayrı yedeği
   olmasın" → sunum K1–K6 kabul). firma_id taşıyan HER tablo ya burada (yedeklenir) ya YEDEK_DISI'nda (gerekçesiyle). Yedeklenen tabloya göç 0117
   değişiklik tetiği (yedek_iz) koyar: her ekleme / değişiklik / silme satırın SON hâliyle yedek_degisiklik'e düşer; gece işi yalnız bunları
   yollar (her gece bütün site işlenmez). Gizli sütun (parola özeti) değişiklik kaydına ve yedeğe hiç girmez — tetik atar.
   Kilit tests/yedek.test.ts (gerçek PostgreSQL): katalogdaki firma_id'li tablolar iki listenin birleşimi, kesişim boş; yedeklenen her tabloda tetik
   ve argümanları (birincil anahtar, gizli sütunlar) bu listeyle aynı; göç metni aynı listeyi taşır (tests/yedek-saf.test.ts). Yeni bir tablo
   eklenip burada sınıflanmazsa kilit düşer. */

/** yedeklenen tablo → gizli sütunlar (yedeğe girmez) */
export const YEDEK_TABLOLARI: Readonly<Record<string, readonly string[]>> = {
  arac: [], arac_km: [], arac_tutanagi: [], belge_doldurma: [], belge_format: [], belge_onay: [], bordro: [], cihaz_turu: [], demirbas: [],
  denetim_izi: [], dokuman: [], dosya: [], egitim_kaydi: [], egitim_turu: [], ekipman: [], ekipman_atamasi: [], ekipman_kodu: [], ekipman_turu: [],
  fatura: [], fatura_rapor: [], firma_ayar: [], fiyat_listesi: [], format_parca: [], gider: [], hesap: ["parola_ozeti"], ice_aktarim: [],
  imza_istegi: [], is_sozlesmesi: [], is_sozlesmesi_tesis: [], isg_katip: [], izin_talebi: [], kalibrasyon: [], kosul_kabul: [], musteri: [],
  musteri_hesap: ["parola_ozeti"], numara_sayaci: [], olcum_cihazi: [], ozluk_belgesi: [], personel: [], plan: [], plan_ekip: [], plan_ekipman: [],
  plan_not: [], rapor: [], rapor_format: [], rapor_hareket: [], rapor_revize_istegi: [], rapor_surumu: [], saha_formu: [], saklama_silme: [],
  say_chat_ayar: [], sozlesme_sablon: [], standart: [], standart_tanim: [], tahsilat: [], teklif: [], teklif_kalem: [], teklif_tesis: [], tesis: [],
  tur_format: [], uygunsuzluk: [], zimmet_formu: [], zimmet_hareket: [],
};

/** firma_id taşıyan ama yedeğe girmeyen tablolar → neden */
export const YEDEK_DISI: Readonly<Record<string, string>> = {
  depo_nesne: "dosyaların içeriği; dosyalar ayrıca, tek tek kopyalanır",
  eposta: "gönderim kuyruğu",
  firma_sir: "şifreli anahtarlar yedeğe girmez",
  giris_kilidi: "giriş denemesi sayacı",
  islem: "çevrimdışı kuyruğun tek seferlik işlem kaydı",
  oturum: "oturum",
  musteri_oturum: "müşteri oturumu",
  rapor_oneri: "yapay zekânın geçici önerisi",
  say_arge: "S.A.Y çalışma kaydı",
  say_istek: "S.A.Y çalışma kaydı",
  say_is: "S.A.Y çalışma kaydı (öğrenme özeti)", sign_bildirim: "probata sign bildirimlerinin tekrar kaydı", say_hafiza: "S.A.Y'ın öğrendikleri (geceleri kurulur)",
  say_chat_kayit: "kişiye özel saha notu (S.A.Y Chat)",
  vt_kimlik: "veritabanının kendi kimliği",
  yz_ek: "S.A.Y eki", yz_ek_okuma: "S.A.Y eki", yz_ek_parca: "S.A.Y eki",
  yz_kapanis: "S.A.Y konuşması", yz_konusma: "S.A.Y konuşması", yz_konusma_is: "S.A.Y konuşması", yz_sohbet: "S.A.Y konuşması",
  yz_silinecek_dosya: "S.A.Y konuşması",
  yz_kullanim: "yapay zekâ kullanım sayacı", yz_okuma: "yapay zekâ okuma kaydı",
  bulut_baglanti: "yedeğin kendi kaydı", bulut_izin: "yedeğin kendi kaydı", bulut_kuyruk: "yedeğin kendi kaydı", bulut_yer: "yedeğin kendi kaydı",
  yedek_degisiklik: "yedeğin kendi kaydı", yedek_arsiv: "yedeğin kendi kaydı",
  yedek_dogrulama: "yedeğin kendi kaydı (aylık doğrulama)", yedek_geri_yukleme: "yedeğin kendi kaydı (geri yüklemeler)",
  /* merkezin kayıtları (FIRMA-VT; firma_id "hangi firma" demek, firmanın verisi değil) ve Yönetim'in kurduğu gönderim ayarı */
  firma_vt: "probata merkez kaydı (firmanın veritabanı bağlantısı)", firma_kurulum: "probata merkez kaydı (kurulum adımları)",
  eposta_alan: "probata merkez kaydı (e-posta alan adı)", firma_gonderim: "Yönetim'in kurduğu e-posta gönderimi (firmada kilitli)",
};

/** tam kopyada Excel listesi de çıkan tablolar (açılıp okunur; yalnız düz sütunlar — iç içe bilgi JSON'da) */
export const EXCEL_TABLOLARI = [
  "musteri", "tesis", "ekipman", "ekipman_turu", "plan", "rapor_surumu", "uygunsuzluk", "personel", "olcum_cihazi", "kalibrasyon", "teklif",
  "is_sozlesmesi", "fatura", "tahsilat", "gider", "arac", "demirbas", "egitim_kaydi",
] as const;
