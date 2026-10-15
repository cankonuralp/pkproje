/* SCRAM-SHA-256 PAROLA ÖZETİ (FIRMA-VT §5.4, FV2) — saf. Firma veritabanında uygulama rolünün parolası kurulumda (FV10) şöyle verilir:
     ALTER ROLE probata_uygulama LOGIN PASSWORD 'SCRAM-SHA-256$4096:<tuz>$<StoredKey>:<ServerKey>'
   Özet burada, istemcide hesaplanır: düz parola Management API'nin günlüğüne ya da sorgu metnine HİÇ gitmez; PostgreSQL bu biçimdeki metni özet olarak
   saklar (yeniden özetlemez) ve istemci düz parolayla SCRAM ile bağlanır. Hesap RFC 5802 §3 + RFC 7677 (SHA-256):
     SaltedPassword = PBKDF2-HMAC-SHA-256(parola, tuz, tekrar) · ClientKey = HMAC(SaltedPassword, "Client Key") · StoredKey = SHA-256(ClientKey)
     ServerKey = HMAC(SaltedPassword, "Server Key")
   Biçim PostgreSQL'in sakladığıyla aynı (src/backend/libpq/auth-scram.c): base64 (dolgulu), tuz 16 bayt, tekrar 4096.
   Parola yazdırılabilir ASCII ile sınırlı: PostgreSQL özetten önce SASLprep uygular; ASCII'de SASLprep metni değiştirmez, öteki harflerde değiştirebilir
   (o zaman burada hesaplanan özet tutmazdı). Kurulumun ürettiği parola base64url — sınır onu kapsar.
   Kilit: tests/firma-baglanti.test.ts (RFC 7677 örneği: sunucu tarafının doğrulaması bu özetle RFC'deki istemci kanıtını kabul eder, RFC'deki sunucu
   imzasını üretir) + tests/merkez-kaydi.test.ts (gerçek PostgreSQL: özet rol parolası olur, düz parolayla girilir). */
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";

const ASCII = /^[\x20-\x7e]{1,1024}$/;
const B64 = "[A-Za-z0-9+/]+={0,2}";
const OZET = new RegExp(`^SCRAM-SHA-256\\$(\\d{4,6}):(${B64})\\$(${B64}):(${B64})$`);

export interface ScramParcalari { tekrar: number; tuz: Buffer; storedKey: Buffer; serverKey: Buffer }

/** rol parolası için SCRAM-SHA-256 özeti (PostgreSQL'in sakladığı biçim) */
export function scramOzeti(parola: string, tuz: Buffer = randomBytes(16), tekrar = 4096): string {
  if (!ASCII.test(parola)) throw new Error("SCRAM parolası yazdırılabilir ASCII olmalı (1–1024 karakter)");
  if (!Number.isInteger(tekrar) || tekrar < 4096 || tekrar > 100_000) throw new Error("SCRAM tekrar sayısı 4096–100000 olmalı");
  if (tuz.length < 16 || tuz.length > 64) throw new Error("SCRAM tuzu 16–64 bayt olmalı");
  const tuzlu = pbkdf2Sync(Buffer.from(parola, "utf8"), tuz, tekrar, 32, "sha256");
  const hmac = (anahtar: Buffer, metin: string) => createHmac("sha256", anahtar).update(metin, "utf8").digest();
  const storedKey = createHash("sha256").update(hmac(tuzlu, "Client Key")).digest();
  const serverKey = hmac(tuzlu, "Server Key");
  return `SCRAM-SHA-256$${tekrar}:${tuz.toString("base64")}$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;
}

/** özet mi (biçim): yalnız base64 harfleri, "$" ve ":" — sorgu metnine tırnak içinde konabilir (FV10 kurulumu bunu denetlemeden göndermez) */
export function scramOzetiMi(metin: string): boolean {
  const m = OZET.exec(metin);
  if (!m) return false;
  return Buffer.from(m[3]!, "base64").length === 32 && Buffer.from(m[4]!, "base64").length === 32 && Buffer.from(m[2]!, "base64").length >= 16;
}

/** özeti parçalarına ayırır (biçim bozuksa hata) */
export function scramAyristir(metin: string): ScramParcalari {
  const m = OZET.exec(metin);
  if (!m || !scramOzetiMi(metin)) throw new Error("Bozuk SCRAM özeti");
  return { tekrar: Number(m[1]), tuz: Buffer.from(m[2]!, "base64"), storedKey: Buffer.from(m[3]!, "base64"), serverKey: Buffer.from(m[4]!, "base64") };
}
