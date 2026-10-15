/* AES-256-GCM ÇEKİRDEĞİ (FIRMA-VT §5.3, FV2) — saf; veritabanına, ortama dokunmaz. Şifreli metin bir EK DOĞRULAMA VERİSİNE (AAD) bağlıdır: aynı ek
   verilmeden çözülmez (satır başka firmaya / başka ada / başka projeye kopyalansa çözülmez). İki kullanıcı:
   · firma sırları (sir.ts): ek "probata:sir:v1:<firmaId>:<ad>" — bu dosya çıkarılırken sir.ts'in ürettiği metin BİREBİR aynı kaldı (eski kayıtlar
     çözülür; kilit tests/firma-baglanti.test.ts, 6f419e3'teki sir.ts ile üretilmiş metin);
   · firma veritabanı bağlantı sırları (src/server/db/baglanti.ts): ek "probata:baglanti:v1:<firmaId>:<ref>:<ad>".
   Biçim: "v1.<iv>.<etiket>.<gövde>" (base64url; iv 12 bayt rasgele, etiket 16 bayt). Ana anahtar 32 bayt; çağıran verir (sir.ts anaAnahtar). */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function anahtarDenetle(anahtar: Buffer): void {
  if (anahtar.length !== 32) throw new Error("Şifreleme anahtarı 32 bayt olmalı");
}

/** düz metni şifreler; `ek` çözerken aynen verilmeli */
export function aesSifrele(duz: string, ek: string, anahtar: Buffer): string {
  anahtarDenetle(anahtar);
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", anahtar, iv);
  c.setAAD(Buffer.from(ek, "utf8"));
  const govde = Buffer.concat([c.update(duz, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${govde.toString("base64url")}`;
}

/** çözer; biçim bozuksa, ek veri ya da anahtar tutmuyorsa, metin kurcalanmışsa HATA (sessizce boş dönmez) */
export function aesCoz(sifreli: string, ek: string, anahtar: Buffer): string {
  anahtarDenetle(anahtar);
  const [s, iv, etiket, govde, fazla] = sifreli.split(".");
  if (s !== "v1" || !iv || !etiket || !govde || fazla !== undefined) throw new Error("Bozuk şifreli metin");
  /* etiket tam 16 bayt (kısaltılmış etiketle sahte metin denenmesin); eski kayıtların hepsi 16 bayt */
  const d = createDecipheriv("aes-256-gcm", anahtar, Buffer.from(iv, "base64url"), { authTagLength: 16 });
  d.setAAD(Buffer.from(ek, "utf8"));
  d.setAuthTag(Buffer.from(etiket, "base64url"));
  return Buffer.concat([d.update(Buffer.from(govde, "base64url")), d.final()]).toString("utf8");
}
