/* S.A.Y CHAT TAM SAYFA (2026-11-07; sunum claude.ai 2PiEskE9jDqF5kSefutRBC): kişinin KENDİ sohbeti (RLS) — panelin (her sayfada) tam boyu. Her firma
   kullanıcısı (sohbet kişisel, modül yetkisi istemez). Sayfa sahada çalışanın cihazında saklanır (public/sw.js SAYFA_YOLLARI): bağlantısız açılır,
   yazılanlar kuyruğa. Süresi dolan işlenmiş dosyalar açılışta çöpe (karar 2). */
import type { Metadata } from "next";
import { Kirinti, SayfaBasi } from "../../../../components/sayfa/Sayfa";
import { sohbet } from "../../../../modules/say-chat/server/mesajlar";
import { Sohbet } from "../../../../modules/say-chat/ui/Sohbet";
import { oturumGerekli, oturumIslemi } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "S.A.Y Chat" };

export default async function Sayfa() {
  const o = await oturumGerekli();
  const mesajlar = await oturumIslemi(o, (db) => sohbet(db, o));
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], ["S.A.Y Chat"]]} />
      <SayfaBasi baslik="S.A.Y Chat" />
      <Sohbet ilk={mesajlar} />
    </>
  );
}
