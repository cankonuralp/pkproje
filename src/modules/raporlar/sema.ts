/* RAPORLAR — saha raporunun formu ve sunucusu için TEK şema + durum adları (maket rapor.html M8; KOD-GECIS §5 Rapor; RAPOR-FORMAT §7).
   Raporun içeriği iki parça: (1) her raporda aynı sabit bölümler — firma bilgileri (künye raporun kopyası, salt okunur) + kontrol tarihleri,
   ekipman bilgileri (elle; ekipman kaydından başlar), (2) türün format tanımından gelen bölümler — cevaplar kimliklerle (format/tanim.ts Cevaplar).
   Cihaz ve fotoğraf sayısı istemciden alınmaz, sunucu raporun kendi listesinden sayar. */
import { Cevaplar } from "../../format/tanim.ts";
import { kimlik, tarih, zaman, z } from "../../sema/ortak.ts";

/** durum kodları sabit tanımlarla aynı (src/tanim/veri.ts durumlar.rapor; göç 0025): ad ve rozet */
export const RAPOR_DURUM = {
  taslak: ["Yeni", "bekliyor"], onayda: ["Teknik yönetici onayında", "kabul"], onaylandi: ["Muayene uzmanı imzası", "denetimde"],
  imzada: ["İmzaya gönderildi", "notr"], imzali: ["Tamamlandı", "tamam"],
} as const;
export type RaporDurumu = keyof typeof RAPOR_DURUM;
/** 561 (reisim 2026-10-15: "rapor teknik yönetici onayında olduğu için değiştiremiyordu ama açıkta rapor göremiyorum dedi"): rapora yazılamıyorsa
    NEDENİ — S.A.Y kullanıcıya bunu söyler. Elle düzenlemeyle aynı kural (yalnız raporu yazanın Yeni raporu, rapor yazma yetkisiyle); yazılabilirse
    null. Kişi adı yok. */
export const YAZILAMAZ_NEDEN: Record<Exclude<RaporDurumu, "taslak">, string> = {
  onayda: "rapor teknik yönetici onayında; onaylanana ya da geri gönderilene kadar değiştirilemez",
  onaylandi: "rapor teknik yönetici tarafından onaylandı, muayene uzmanının son imzasını bekliyor; değiştirilemez",
  imzada: "rapor imzaya gönderildi; değiştirilemez",
  imzali: "rapor imzalanıp tamamlandı; değişiklik ancak revizeyle yapılır",
};
export function raporYazmaNedeni(durum: RaporDurumu, sahip: boolean, yetkili: boolean): string | null {
  if (durum !== "taslak") return YAZILAMAZ_NEDEN[durum];
  if (!sahip) return "raporu yazan muayene uzmanı değiştirir; bu kullanıcı yalnız görüntüleyebilir";
  return yetkili ? null : "kullanıcının rapor yazma yetkisi yok";
}
export const SONUC_AD = { uygun: "Uygun", uygun_degil: "Uygun değil", sartli: "Şartlı uygun" } as const;

const bos = (s: unknown) => (s === undefined || s === null || (typeof s === "string" && s.trim() === "") ? null : typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);
const metin = (n: number) => z.preprocess(bos, z.string().max(n, `En çok ${n} karakter.`).nullable());

/** ekipman bilgileri (maket "Ekipman bilgileri": elle girilir; ekipman kaydından başlar) */
export const EkipmanBilgisi = z.object({
  marka: metin(40), model: metin(40), seri: metin(30),
  imal: z.preprocess(bos, z.string().regex(/^(19|20)\d{2}$/, "İmal yılı 4 haneli yıl olmalı.").nullable()),
  konum: metin(60), amac: metin(120), bolum: metin(60),
});
export type EkipmanBilgisi = z.output<typeof EkipmanBilgisi>;

/** kontrol tarihleri (maket "Firma bilgileri"): başlangıç rapor açılınca yazılır (zorunlu); bitiş, sonraki kontrol ve rapor tarihi elle seçilmediyse
    Onaya gönderde sunucu yazar (bitiş: gönderme anı · sonraki: başlangıç + tür periyodu · rapor tarihi: başlangıç günü); takip isteğe bağlı */
export const RaporTarihleri = z.object({
  bas: z.preprocess(bos, zaman), bit: z.preprocess(bos, zaman.nullable()),
  sonraki: z.preprocess(bos, tarih.nullable()), takip: z.preprocess(bos, tarih.nullable()), rapor: z.preprocess(bos, tarih.nullable()),
}).superRefine((t, bag) => {
  if (t.bas && t.bit && t.bit < t.bas) bag.addIssue({ code: "custom", path: ["bit"], message: "Bitiş başlangıçtan önce." });
});
export type RaporTarihleri = z.output<typeof RaporTarihleri>;

/** Kaydet ve kopyala penceresi (N10: "ekipman kodu ve ekipman bölümü sorsun yeterli"): yeni ekipmanın kodu (biçim ve eşsizlik Planlar'ın kod
    denetiminde, plan içi "Ekipman ekle" ile tek üretici) ve bölümü (kullanım yeri; boşsa kaynaktaki); tür kaynağınki */
export const KopyaGirdisi = z.object({ kod: z.string({ error: "Ekipman kodunu yazın." }).max(40), konum: metin(60) });

/** Kaydet (ve Onaya gönder öncesi kayıt): istemcinin gördüğü sürümle */
export const RaporKaydi = z.object({ ekipman: EkipmanBilgisi, tarih: RaporTarihleri, cevaplar: Cevaplar });
export type RaporKaydi = z.output<typeof RaporKaydi>;

/** raporda ölçüm cihazı (tür × cihaz) ve fotoğraf (dosya) kayıtları — rapor tablosunda JSON */
export const RaporCihazi = z.object({ tur: z.string().uuid(), cihaz: z.string().uuid() });
export type RaporCihazi = z.output<typeof RaporCihazi>;

/** kalibrasyon durumu: bitiş bugünden önceyse geçmiş */
export const kalibrasyonGecti = (bitis: string | null, bugun: string) => !bitis || bitis < bugun;

/** türün periyodu kadar ay sonrası (sonraki kontrol): ayın son günü taşmaz (31 Ocak + 1 ay = 28/29 Şubat) */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, g] = iso.slice(0, 10).split("-").map(Number);
  const son = new Date(Date.UTC(y, m - 1 + ay + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + ay, Math.min(g, son))).toISOString().slice(0, 10);
}

/* ── REVİZYON (318; göç 0029; maket raporlar.html "Revize iste", onaylar.html "Revizeye gönder" / "Reddet") ─────────────────────────────── */
/** karakter sayısı veritabanıyla aynı ölçüde (kod noktası; PostgreSQL length) */
const kodNoktasi = (s: string) => [...s].length;
const gerekceMetni = z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : ""), z.string().refine((g) => kodNoktasi(g) <= 400, "En çok 400 karakter."));
/** Revize iste (yazan) ve Revizeye gönder (teknik yönetici): gerekçe zorunlu, en az 10 karakter — okuyan neyin düzeltileceğini bilmeli */
export const RevizeGirdisi = z.object({
  gerekce: gerekceMetni.refine((g) => kodNoktasi(g) >= 10, "Gerekçe en az 10 karakter olmalı: neyin düzeltileceği yazılmalı."),
});
/** revize isteğini reddet: gerekçe isteğe bağlı (yazan raporunda görür) */
export const RevizeRedGirdisi = z.object({ gerekce: gerekceMetni });
/** raporun görünen numarası (193): revizyonda "-R1", "-R2" … eki (imzalı sürümün numarasıyla aynı — göç 0027 rapor_surumu.no) */
export const gorunenNo = (no: string, revizyon: number) => (revizyon > 0 ? `${no}-R${revizyon}` : no);

/* ── ÇEVRİMDIŞI FOTOĞRAF (398; ARKA-UC §4.1 "fotoğraf çekme" çevrimdışı çalışır, §4.3 foto.ekle kuyrukta) ─────────────────────────────────────── */
/** cihaz kuyruğundaki fotoğraf en çok 2 MB (cihazda 1600 px'e küçültülmüş hâli; metne çevrilince işlem ucunun 3 MB gövde sınırına sığar) */
export const FOTO_KUYRUK_EN_BUYUK = 2 * 1024 * 1024;
/** kuyruktan gelen fotoğraf: yeri (bölüm, madde), adı, içeriği (base64 — tür ve EXIF sunucuda baytlardan, dosya yolunda) */
/** okuma (542): bölümün OKUMA fotoğrafı (S.A.Y okur; belgede görünmez) — bağlantısız da eklenir, bağlantı gelince gider */
export const FotoIslemGirdisi = z.object({
  bolum: z.string().min(1).max(64), madde: z.string().min(1).max(64).nullable(), ad: z.string().min(1).max(200),
  veri: z.string().min(4).max(Math.ceil(FOTO_KUYRUK_EN_BUYUK / 3) * 4).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  okuma: z.boolean().optional(),
});

/* ── BAĞLANTISIZ YENİ RAPOR (405) ── kuyruktaki "rapor.olustur": hangi planda hangi ekipmana (kayıt = cihazın geçici kimliği; gerçek kimliği ve
   numarayı sunucu verir) */
export const OlusturIslemGirdisi = z.object({ plan: kimlik, ekipman: kimlik });

/** 2026-10-17 (reisim: "rapor isimleri sadece rapor kodlarından oluşuyor bu şekilde klasörde anlaması zor, rapor isimlerinde rapor numarasından sonra
    - ekipman kodu- sonra da ekipmanın adı "kompresör hava tankı" veeya "yangın dolapları" ne ise artık o yazmalı"): raporun PDF dosya adı
    "<rapor no>-<ekipman kodu>-<ekipman türünün adı>[-ek].pdf" (ör. DM-1026-003-cf59e-HT-1-Kompresör hava tankı.pdf). Windows'un ve ZIP'in sorun
    çıkardığı karakterler (denetim, / \ : * ? " < > |) boşluk olur, boşluklar sadeleşir, baştaki / sondaki nokta ve boşluk atılır; parçalar sınırlı
    (dosya kaydı en çok 200). Kod ya da tür yoksa o parça düşer. Saf — sunucu (hazırlanan / imzalı PDF) ve tarayıcı (ZIP'ler) aynı adı kurar. */
const YASAK_KARAKTER = /[\u0000-\u001f\u007f\\/:*?"<>|]/g;
const adParcasi = (s: string | null | undefined, en: number) =>
  (s ?? "").replace(YASAK_KARAKTER, " ").replace(/\s+/g, " ").replace(/^[ .]+|[ .]+$/g, "").slice(0, en).replace(/[ .]+$/, "");
export function raporDosyaAdi(no: string, ekipmanKod?: string | null, turAd?: string | null, ek?: string): string {
  return `${[adParcasi(no, 40) || "rapor", adParcasi(ekipmanKod, 40), adParcasi(turAd, 90), adParcasi(ek, 20)].filter(Boolean).join("-")}.pdf`;
}
