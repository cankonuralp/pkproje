/* S.A.Y KONUŞMASI (2026-10-23; göç 0103 yz_konusma, yz_ek, yz_ek_parca, yz_konusma_is) — kişinin konuşmasının yapay zekâya giden hâli, Messages
   API'nin içeriğiyle BİREBİR ve sırasıyla (yalnız sona eklenir; düşünme bloğu kendinden önceki her şey aynı kaldıkça geçerli). RLS firma + hesap;
   hesap veritabanında işlemin bağlamından. Çekirdek: modül (src/modules/say) buradan çağırır. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { hataKaydet } from "../hata/kaydet.ts";
import { argeKaydiYaz } from "./olcum.ts";

export type KonusmaRolu = "user" | "assistant" | "system";
export interface KonusmaIletisi { id: string; sira: number; rol: KonusmaRolu; icerik: unknown }

/** konuşmanın tamamı, eskiden yeniye */
export async function konusmaOku(db: Sorgulayici): Promise<KonusmaIletisi[]> {
  return (await db.sorgu<{ id: string; sira: string; rol: KonusmaRolu; icerik: unknown }>(
    "SELECT id::text, sira::text, rol, icerik FROM yz_konusma ORDER BY sira")).rows.map((r) => ({ ...r, sira: Number(r.sira) }));
}

/** sona ekler; dönen kimlik */
export async function konusmaEkle(db: Sorgulayici, rol: KonusmaRolu, icerik: unknown): Promise<string> {
  return (await db.sorgu<{ id: string }>("INSERT INTO yz_konusma (rol, icerik) VALUES ($1, $2::jsonb) RETURNING id::text", [rol, JSON.stringify(icerik)])).rows[0].id;
}

/** son yapay zekâ iletisinden SONRAKİ sayfa notlarını siler (cevapsız kalmış sorunun notu — yeni soruyla yenisi gelir); ardında düşünme bloğu
    olmadığı için önceki düşünmeler geçerli kalır. Dönen: silinen sayısı */
export async function kuyrukNotlariniSil(db: Sorgulayici): Promise<number> {
  return (await db.sorgu(
    `DELETE FROM yz_konusma WHERE rol = 'system'
       AND sira > coalesce((SELECT max(sira) FROM yz_konusma WHERE rol = 'assistant'), 0)`)).rowCount ?? 0;
}

/** 2026-11-01 (büyük iş şeması): fotoğraf hizmete (Dosya API) yüklenmez, konuşmaya girmez — yz_ek.dosya bu işaret; silinecek hizmet dosyası değildir */
export const DOSYA_YOK = "-";
/** "Sohbeti temizle" ve otomatik kapanış: kişinin konuşması, ekleri (koru: yeni sorunun ekleri kalır — 2026-11-01 V21 B), yarım yüklemeleri ve işi;
    dönen: hizmetteki ek dosyalarının kimlikleri (çağıran siler) */
export async function konusmaTemizle(db: Sorgulayici, koru: readonly string[] = []): Promise<string[]> {
  /* 2026-10-31 (L8 — göç 0112): silmeden önce konuşmanın metni Ar-Ge kaydına (30 gün; ekler ve düşünce yok; yalnız Yönetim okur). 2026-11-02 (reisim:
     "sil tuşuna basıp temizle dediğimde bazen bug da kalıyor"): Ar-Ge kaydı yazılamazsa (sınır, bozuk içerik) temizleme DURMAZ — hata kaydına düşer */
  try { await argeKaydiYaz(db, (await konusmaOku(db)).map((m) => ({ rol: m.rol, icerik: m.icerik }))); }
  catch (e) { void hataKaydet({ kaynak: "sunucu", mesaj: `S.A.Y Ar-Ge kaydı yazılamadı: ${e instanceof Error ? e.message : String(e)}`, yer: "say.arge" }); }
  const dosyalar = (await db.sorgu<{ dosya: string }>("DELETE FROM yz_ek WHERE NOT (id::text = ANY($1::text[])) RETURNING dosya", [koru])).rows
    .map((r) => r.dosya).filter((d) => d !== DOSYA_YOK);
  await db.sorgu("DELETE FROM yz_konusma");
  await db.sorgu("DELETE FROM yz_ek_parca");
  await db.sorgu("DELETE FROM yz_konusma_is");
  return dosyalar;
}

/* ── ekler ── */
/** 2026-10-31 (kalem 2): ekin kopyası firmanın deposunda — dosya modülü (kayıt = yz_ek kimliği); yalnız eki ekleyen açar (yz_ek RLS) */
export const DOSYA_SAY_EK = "say_ek";
export async function sayEkGorulur(db: Sorgulayici, ekId: string): Promise<boolean> {
  return (await db.sorgu("SELECT 1 FROM yz_ek WHERE id::text = $1", [ekId])).rows.length > 0;
}
/** 2026-10-31 (kalem 3): kişinin fotoğraf ekleri, F numarasıyla; depodaki kopyanın anahtarı (kopya yoksa null) */
export interface FotoKopyasi { ekId: string; fno: number; ad: string; anahtar: string | null }
export async function fotoKopyalari(db: Sorgulayici): Promise<FotoKopyasi[]> {
  return (await db.sorgu<{ ek_id: string; fno: string; ad: string; anahtar: string | null }>(
    `SELECT e.id::text AS ek_id, row_number() OVER (ORDER BY e.sira)::text AS fno, e.ad,
            (SELECT d.anahtar FROM dosya d WHERE d.modul = $1 AND d.kayit_id = e.id AND d.cop IS NULL ORDER BY d.id LIMIT 1) AS anahtar
       FROM yz_ek e WHERE e.tur = 'foto' ORDER BY e.sira`, [DOSYA_SAY_EK])).rows.map((r) => ({ ekId: r.ek_id, fno: Number(r.fno), ad: r.ad, anahtar: r.anahtar }));
}
/** F numaralı fotoğrafın depodaki kopyasının adı ve baytları (rapora fotoğraf eklerken); yoksa null */
export async function fotoKopyasiOku(db: Sorgulayici, depo: { oku(anahtar: string, db?: Sorgulayici): Promise<Uint8Array> }, foto: string):
  Promise<{ ad: string; bayt: Uint8Array } | null> {
  const no = Number(/^F?(\d{1,4})$/i.exec(foto.trim())?.[1]);
  const f = (await fotoKopyalari(db)).find((x) => x.fno === no);
  return f?.anahtar ? { ad: f.ad, bayt: await depo.oku(f.anahtar, db) } : null;
}
/** 2026-10-31 (kalem 9 — M2): malzeme numarasıyla ("M03" ya da fotoğrafta "F02") ekin depodaki kopyası — belgeyi kaydın yuvasına koymak için; yoksa null */
export async function ekKopyasiOku(db: Sorgulayici, depo: { oku(anahtar: string, db?: Sorgulayici): Promise<Uint8Array> }, ek: string):
  Promise<{ ad: string; bayt: Uint8Array; tur: EkTuru } | null> {
  const m = /^\s*([MF])(\d{1,4})\s*$/i.exec(ek);
  if (!m) return null;
  const sutun = m[1]!.toUpperCase() === "F" ? "fno" : "no";
  const r = (await db.sorgu<{ ad: string; tur: EkTuru; anahtar: string | null }>(
    `SELECT ad, tur, (SELECT d.anahtar FROM dosya d WHERE d.modul = $1 AND d.kayit_id = n.id AND d.cop IS NULL ORDER BY d.id LIMIT 1) AS anahtar FROM (
       SELECT id, ad, tur, row_number() OVER (ORDER BY sira) AS no,
              CASE WHEN tur = 'foto' THEN count(*) FILTER (WHERE tur = 'foto') OVER (ORDER BY sira) END AS fno FROM yz_ek) n WHERE ${sutun} = $2`,
    [DOSYA_SAY_EK, Number(m[2])])).rows[0];
  return r?.anahtar ? { ad: r.ad, tur: r.tur, bayt: await depo.oku(r.anahtar, db) } : null;
}
/** kişinin eklerinin kopyaları (temizlenince çöpe) */
export async function ekKopyalari(db: Sorgulayici, koru: readonly string[] = []): Promise<string[]> {
  return (await db.sorgu<{ id: string }>(
    "SELECT d.id::text FROM dosya d JOIN yz_ek e ON e.id = d.kayit_id WHERE d.modul = $1 AND d.cop IS NULL AND NOT (e.id::text = ANY($2::text[]))", [DOSYA_SAY_EK, koru])).rows.map((r) => r.id);
}
/** konuşmadaki son iletinin zamanı (otomatik kapanış — 60 dakika kuralı); konuşma boşsa null */
export async function konusmaSonZamani(db: Sorgulayici): Promise<Date | null> {
  const r = (await db.sorgu<{ z: Date | null }>("SELECT max(zaman) AS z FROM yz_konusma")).rows[0];
  return r?.z ? new Date(r.z) : null;
}
/* 2026-11-01 (V21 A1 — göç 0113): işin iş içi küçültme seviyesi, yalnız ileri */
export async function kucultmeOku(db: Sorgulayici): Promise<number> {
  return Number((await db.sorgu<{ k: number }>("SELECT kucultme AS k FROM yz_konusma_is")).rows[0]?.k ?? 0);
}
export async function kucultmeYaz(db: Sorgulayici, seviye: number): Promise<void> {
  await db.sorgu("UPDATE yz_konusma_is SET kucultme = GREATEST(kucultme, $1)", [Math.max(0, Math.min(4, Math.round(seviye)))]);
}
export type EkTuru = "foto" | "pdf" | "word" | "metin" | "tablo";
export interface KonusmaEki { id: string; dosya: string; ad: string; tur: EkTuru; mime: string; boyut: number; cekim?: string | null }
/** 2026-10-31 (kalem 2): malzeme numarası — kişinin eklerinin kalıcı sırasında (yz_ek.sira); no bütün ekler, fno fotoğraflar arasında */
export interface NumaraliEk extends KonusmaEki { cekim: string | null; no: number; fno: number | null; okuma: { sinif: "E" | "T" | "L" | "Y" | "S" | "K" | "D"; yazi: string; tarif: string; alanlar?: { ad: "marka" | "model" | "seri" | "imal" | "kapasite" | "diger"; deger: string; emin: boolean }[] } | null }
/** 2026-10-31 (L4 — göç 0111): fotoğraf ekinin ön okuması, ek başına bir kez (yalnız eklenir); 2026-11-01 (göç 0114): okunan etiket alanları da */
export async function ekOkumaYaz(db: Sorgulayici, ek: string, o: { sinif: string; yazi: string; tarif: string; alanlar?: readonly { ad: string; deger: string; emin: boolean }[] }): Promise<void> {
  await db.sorgu("INSERT INTO yz_ek_okuma (ek_id, sinif, yazi, tarif, alanlar) VALUES ($1, $2, $3, $4, $5::jsonb) ON CONFLICT (ek_id) DO NOTHING",
    [ek, o.sinif, o.yazi.slice(0, 400), o.tarif.slice(0, 160), JSON.stringify(o.alanlar ?? [])]);
}
/* ── 2026-11-02 (reisim: "panel ya da sohbetten bağımsız kullanıcı açsa da açmasa da 60 dakika geçince silinsin"; göç 0116): KAPANIŞ SÜPÜRMESİ VERİTABANINDA
   (say_kapanis_supur — Supabase'de pg_cron 10 dakikada bir). Uygulama ayrıca açılışta kişi için (say_kapanis_kendi), gece işinde firma için (say_kapanis_firma)
   çağırır. Kapanan konuşmanın son bildirimi yz_kapanis'te yeni sorunun başına not olur (okununca silinir); hizmetteki ek dosyaları yz_silinecek_dosya'dan
   Dosya API'siyle silinir. ── */
export async function kapanisKendi(db: Sorgulayici, dakika = 60): Promise<number> {
  return Number((await db.sorgu<{ n: number }>("SELECT say_kapanis_kendi($1) AS n", [dakika])).rows[0]?.n ?? 0);
}
export async function kapanisFirma(db: Sorgulayici, dakika = 60): Promise<number> {
  return Number((await db.sorgu<{ n: number }>("SELECT say_kapanis_firma($1) AS n", [dakika])).rows[0]?.n ?? 0);
}
/** süpürmenin bıraktığı kapanış notu (varsa; okununca silinir) */
export async function kapanisNotuAl(db: Sorgulayici): Promise<{ neden: string; zaman: Date; sonBildirim: string } | null> {
  const r = (await db.sorgu<{ neden: string; zaman: Date; son_bildirim: string }>("SELECT neden, zaman, son_bildirim FROM yz_kapanis")).rows[0];
  if (!r) return null;
  await db.sorgu("DELETE FROM yz_kapanis");
  return { neden: r.neden, zaman: new Date(r.zaman), sonBildirim: r.son_bildirim };
}
/** firmanın hizmetten silinecek ek dosyaları (kapanan konuşmaların PDF / Word / metin ekleri) */
export async function silinecekDosyalar(db: Sorgulayici): Promise<{ id: string; dosya: string }[]> {
  return (await db.sorgu<{ id: string; dosya: string }>("SELECT id::text, dosya FROM yz_silinecek_dosya ORDER BY zaman LIMIT 200")).rows;
}
export async function silinecekDosyaSil(db: Sorgulayici, idler: readonly string[]): Promise<void> {
  if (idler.length) await db.sorgu("DELETE FROM yz_silinecek_dosya WHERE id::text = ANY($1::text[])", [idler]);
}

/** verilen eklerden fotoğraf olanların sayısı (ön okuma ilerlemesi "n / N" için) */
export async function fotoEkSayisi(db: Sorgulayici, idler: readonly string[]): Promise<number> {
  if (!idler.length) return 0;
  return Number((await db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM yz_ek WHERE id::text = ANY($1::text[]) AND tur = 'foto'", [idler])).rows[0]?.n ?? 0);
}
/** ön okuması henüz olmayan fotoğraf ekleri (verilenlerden) */
export async function onOkumaBekleyen(db: Sorgulayici, idler: readonly string[]): Promise<number> {
  if (!idler.length) return 0;
  return Number((await db.sorgu<{ n: string }>("SELECT count(*)::text AS n FROM yz_ek e WHERE e.id::text = ANY($1::text[]) AND e.tur = 'foto' AND e.zaman > now() - interval '5 minutes' AND NOT EXISTS (SELECT 1 FROM yz_ek_okuma o WHERE o.ek_id = e.id)", [idler])).rows[0]?.n ?? 0);
}

/** chatMesaj: 2026-11-07 — S.A.Y Chat'ten okunan mesaj (aynı konuşmada ikinci kez eklenmez — chatEkleri) */
export async function ekKaydet(db: Sorgulayici, e: Omit<KonusmaEki, "id">, chatMesaj: string | null = null): Promise<string> {
  return (await db.sorgu<{ id: string }>("INSERT INTO yz_ek (dosya, ad, tur, mime, boyut, cekim, chat_mesaj) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id::text",
    [e.dosya, e.ad, e.tur, e.mime, e.boyut, e.cekim ?? null, chatMesaj])).rows[0].id;
}
/** S.A.Y Chat mesajı (veritabanı kimliği) → konuşmadaki eki (bu konuşmada eklenmişse) */
export async function chatEkleri(db: Sorgulayici, mesajlar: readonly string[]): Promise<Map<string, string>> {
  if (!mesajlar.length) return new Map();
  return new Map((await db.sorgu<{ id: string; m: string }>("SELECT id::text, chat_mesaj::text AS m FROM yz_ek WHERE chat_mesaj::text = ANY($1::text[])", [mesajlar]))
    .rows.map((r) => [r.m, r.id]));
}
/** kişinin kendi ekleri (verilen sırayla; başkasının ya da olmayan kimlik düşer) */
export async function ekleriAl(db: Sorgulayici, idler: readonly string[]): Promise<NumaraliEk[]> {
  if (!idler.length) return [];
  const l = (await db.sorgu<KonusmaEki & { boyut: string; cekim: string | null; no: string; fno: string | null; okuma: NumaraliEk["okuma"] }>(
    `SELECT n.id, dosya, ad, tur, mime, boyut, cekim, no, fno, CASE WHEN o.ek_id IS NULL THEN NULL ELSE jsonb_build_object('sinif', o.sinif, 'yazi', o.yazi, 'tarif', o.tarif, 'alanlar', o.alanlar) END AS okuma FROM (
       SELECT id::text, id AS kimlik, dosya, ad, tur, mime, boyut::text, cekim, row_number() OVER (ORDER BY sira)::text AS no,
              CASE WHEN tur = 'foto' THEN (count(*) FILTER (WHERE tur = 'foto') OVER (ORDER BY sira))::text END AS fno
         FROM yz_ek) n LEFT JOIN yz_ek_okuma o ON o.ek_id = n.kimlik WHERE n.id = ANY($1::text[])`, [idler])).rows
    .map((r) => ({ ...r, boyut: Number(r.boyut), no: Number(r.no), fno: r.fno === null ? null : Number(r.fno), okuma: r.okuma ?? null }));
  return idler.flatMap((i) => l.filter((x) => x.id === i));
}

/* ── büyük dosyanın parçaları (barındırmanın istek boyu sınırı) ── */
export async function parcaYaz(db: Sorgulayici, yukleme: string, sira: number, veri: Uint8Array): Promise<void> {
  /* yarıda kalmış eski yüklemeler (bir günden eski) bu kişinin yeni yüklemesinde temizlenir */
  await db.sorgu("DELETE FROM yz_ek_parca WHERE zaman < now() - interval '1 day'");
  await db.sorgu("INSERT INTO yz_ek_parca (yukleme, sira, veri) VALUES ($1, $2, $3) ON CONFLICT (firma_id, hesap_id, yukleme, sira) DO NOTHING", [yukleme, sira, Buffer.from(veri)]);
}
/** yüklemenin parçaları sırasıyla birleşik; eksik parça varsa (0 … adet-1) null */
export async function parcalariBirlestir(db: Sorgulayici, yukleme: string, adet: number): Promise<Uint8Array | null> {
  const l = (await db.sorgu<{ sira: number; veri: Buffer }>("SELECT sira, veri FROM yz_ek_parca WHERE yukleme = $1 ORDER BY sira", [yukleme])).rows;
  if (l.length !== adet || l.some((p, i) => p.sira !== i)) return null;
  return new Uint8Array(Buffer.concat(l.map((p) => p.veri)));
}
export async function parcalariSil(db: Sorgulayici, yukleme: string): Promise<void> {
  await db.sorgu("DELETE FROM yz_ek_parca WHERE yukleme = $1", [yukleme]);
}

/** 2026-10-31 (K1): kişinin konuşmasına yazan işlemler sırayla — "son ileti ne?" okuması ile yazma arasına başka işlemin yazısı girmesin (aynı
    çağrıya iki sonuç yarışı). İşlem bitince kendiliğinden bırakılır */
export async function konusmaKilidi(db: Sorgulayici): Promise<void> {
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended('yz_konusma:' || coalesce(current_setting('app.hesap_id', true), ''), 0))");
}

/** son yapay zekâ ya da kullanıcı iletisi (sayfa notları hariç) */
export async function konusmaSonu(db: Sorgulayici): Promise<KonusmaIletisi | null> {
  const r = (await db.sorgu<{ id: string; sira: string; rol: KonusmaRolu; icerik: unknown }>(
    "SELECT id::text, sira::text, rol, icerik FROM yz_konusma WHERE rol <> 'system' ORDER BY sira DESC LIMIT 1")).rows[0];
  return r ? { ...r, sira: Number(r.sira) } : null;
}

/* ── kişinin o anki işi: aynı konuşmaya iki pencere aynı anda yazmasın (sıra bozulmasın) ── */
/** işi alır ya da sürdürür (aynı iş kimliği); başka iş sürüyorsa (süresi dolmadıysa) false */
export async function isAl(db: Sorgulayici, isId: string, saniye: number): Promise<boolean> {
  const r = await db.sorgu(
    `INSERT INTO yz_konusma_is (is_id, bitis) VALUES ($1, now() + make_interval(secs => $2))
     ON CONFLICT (firma_id, hesap_id) DO UPDATE SET is_id = EXCLUDED.is_id, bitis = EXCLUDED.bitis
       WHERE yz_konusma_is.is_id = EXCLUDED.is_id OR yz_konusma_is.bitis <= now()`, [isId, saniye]);
  return (r.rowCount ?? 0) > 0;
}
/** iş bitti (ya da ekranın işini bekliyor): başka pencere yazabilir; bekleyen sonuçlar kalır */
export async function isBirak(db: Sorgulayici, isId: string): Promise<void> {
  await db.sorgu("UPDATE yz_konusma_is SET bitis = now() WHERE is_id = $1", [isId]);
}
/** araç sonucunun içeriği: metin ya da bloklar (2026-10-31 kalem 3: görüntü araçlarının görüntüsü + yazısı) */
export type AracSonucu = string | Record<string, unknown>[];
/** ekranın işinden önce sunucunun yaptığı işlerin sonuçları (araç çağrısı kimliği → sonuç metni) */
export async function bekleyenYaz(db: Sorgulayici, sonuclar: Record<string, AracSonucu>): Promise<void> {
  await db.sorgu("UPDATE yz_konusma_is SET bekleyen = $1::jsonb", [JSON.stringify(sonuclar)]);
}
/** bekleyen sonuçlar alınır ve silinir */
export async function bekleyenAl(db: Sorgulayici): Promise<Record<string, AracSonucu>> {
  const r = (await db.sorgu<{ b: Record<string, AracSonucu> }>("SELECT bekleyen AS b FROM yz_konusma_is FOR UPDATE")).rows[0];
  if (r) await db.sorgu("UPDATE yz_konusma_is SET bekleyen = '{}'::jsonb");
  return r?.b ?? {};
}
