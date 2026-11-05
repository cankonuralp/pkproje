/* PROBATA SIGN BİLDİRİMLERİNİN TEKRAR KAYDI (2026-11-05, göç 0122 sign_bildirim) — aynı webhook gönderimi (X-Probata-Gonderim) bir kez işlenir.
   Ham yazma çekirdekte (modül ham SQL yazmaz — kilit tests/kiraci-suzgeci.test.ts); firma işlemin bağlamından (RLS). */
import type { Sorgulayici } from "./kiraci.ts";

/** gönderimi kaydeder; ilk kez geldiyse true */
export async function bildirimKaydet(db: Sorgulayici, id: string, olay: string): Promise<boolean> {
  return ((await db.sorgu("INSERT INTO sign_bildirim (id, olay) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, olay])).rowCount ?? 0) > 0;
}
/** geçici hatada kayıt geri alınır (sign yeniden dener) */
export async function bildirimSil(db: Sorgulayici, id: string): Promise<void> {
  await db.sorgu("DELETE FROM sign_bildirim WHERE id = $1", [id]);
}
