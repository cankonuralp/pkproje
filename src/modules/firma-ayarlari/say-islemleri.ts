/* FİRMA AYARLARI — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Firma ayarları ekranıyla aynı yetki ve kural (okuma: ayarları gören; kaydetme: firma
   yöneticisi; bölüm şemadan geçer, kaydedilmemiş alan bölümün öteki alanlarıyla kalır, sürüm kilidi). SIR YOK: yapay zekâ anahtarı ve Resend
   anahtarı bu katalogda yazılmaz (girdi sohbet geçmişine ve yapay zekâ sağlayıcısına gider — ekrandan girilir); okumada anahtarın yalnız "tanımlı mı"
   bilgisi döner (son dört hane bile gitmez). Logo / ön bilgilendirme / bordro formatı dosyası ekrandan yüklenir. */
import { surum, z } from "../../sema/ortak.ts";
import { islem, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { AyarSurumu, BelgeTuruGirdisi, EkTurAnahtari, KodGirdisi } from "./sema.ts";
import { ayarKaydet, belgeTuruEkle, belgeTuruKaldir, denemeEpostasi, firmaAyarlari, firmaKoduKaydet } from "./server/ayarlar.ts";

const MODUL = 22;
/** ayarKaydet'in bölümleri (sır bölümü yok — anahtarlar ayrı işlevlerle, bu katalogda değil) */
const KESIMLER = ["firma", "imza", "zimmet", "saklama", "mesai", "esik", "sabit", "fiyat", "yz", "eposta", "bulut", "mbelge"] as const;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "firma_ayarlari", modul: MODUL, tur: "oku", girdi: z.object({ surum: surum.optional() }), kaynak: [surum], islev: firmaAyarlari,
    tarif: "Firma ayarlarının bütün bölümleri ve sürümleri (firma bilgileri, imza yöntemi, zimmet teslim eden, saklama süresi, mesai, uyarı eşikleri, sabit giderler, "
      + "fiyat listesi, yapay zekâ açık / sınır, e-posta gönderimi (alan adı, doğrulandı mı — Yönetim kurar, burada değişmez; gizli kopya), ikinci kopya, müşteriye açık belgeler, firma kodu); anahtarların yalnız tanımlı olup olmadığı.",
    calistir: async (b) => {
      const a = await firmaAyarlari(b.db, b.kim);
      if (!a) return { tamam: false, neden: "Bu kullanıcı Firma ayarları'nı göremiyor." };
      const { dosyalar } = a;
      return { tamam: true, sonuc: { ...a, ice: undefined, ice_aktarim: a.ice.length,
        yz: { ...a.yz, anahtar: { tanimli: a.yz.anahtar.tanimli } },
        dosyalar: { logo: !!dosyalar.logo, on_bilgi: !!dosyalar.on_bilgi, bordro_format: !!dosyalar.bordro_format, surum: dosyalar.surum } } };
    },
  }),
  islem({
    ad: "firma_ayari_kaydet", modul: MODUL, tur: "yaz", girdi: z.object({ kesim: z.enum(KESIMLER), surum: AyarSurumu, deger: z.record(z.string(), z.unknown()) }), kaynak: [AyarSurumu],
    islev: ayarKaydet,
    tarif: "Firma ayarlarının bir bölümünü kaydeder (firma yöneticisi): kesim (firma | imza | zimmet | saklama | mesai | esik | sabit | fiyat | yz | eposta | bulut | "
      + "mbelge), surum (firma_ayarlari'ndaki bölüm sürümü; hiç kaydedilmemiş bölümde -1), deger (bölümün alanları — firma_ayarlari'ndaki biçimle). Anahtarlar burada değil, ekrandan.",
    calistir: async (b, v, ham) => yazmaCevabi(await ayarKaydet(b.db, b.kim, v.kesim, v.surum, ham.deger)),
  }),
  islem({
    ad: "firma_kodu_kaydet", modul: MODUL, tur: "yaz", girdi: z.object(KodGirdisi.shape), kaynak: [KodGirdisi], islev: firmaKoduKaydet,
    tarif: "Firma kodunu (rapor numarasının başı, 2 harf) değiştirir: kod, gorulen (şimdiki kod — firma_ayarlari); açılmış raporların numarası değişmez.",
    calistir: async (b, _v, ham) => yazmaCevabi(await firmaKoduKaydet(b.db, b.kim, ham)),
  }),
  islem({
    ad: "belge_turu_ekle", modul: MODUL, tur: "yaz", girdi: z.object(BelgeTuruGirdisi.shape), kaynak: [BelgeTuruGirdisi], islev: belgeTuruEkle,
    tarif: "Firmaya yeni özlük belge türü ekler (Personel'de belge yüklerken seçilir): ad, kisisel (kişisel veri mi).",
    calistir: async (b, _v, ham) => yazmaCevabi(await belgeTuruEkle(b.db, b.kim, ham)),
  }),
  islem({
    ad: "belge_turu_kaldir", modul: MODUL, tur: "yaz", girdi: z.object({ tur: EkTurAnahtari }), kaynak: [EkTurAnahtari], islev: belgeTuruKaldir,
    tarif: "Firmanın eklediği özlük belge türünü kaldırır (tur: ek1, ek2 … — o türde yüklü belge yokken).",
    calistir: async (b, v) => yazmaCevabi(await belgeTuruKaldir(b.db, b.kim, v.tur)),
  }),
  islem({
    ad: "deneme_epostasi", modul: MODUL, tur: "yaz", girdi: z.object({ surum: surum.optional() }), kaynak: [surum], islev: denemeEpostasi,
    tarif: "Firmanın e-posta ayarıyla kullanıcının KENDİ adresine deneme e-postası gönderir (Resend anahtarı ve alan adı doğru mu).",
    calistir: async (b) => yazmaCevabi(await denemeEpostasi(b.db, b.kim)),
  }),
];
