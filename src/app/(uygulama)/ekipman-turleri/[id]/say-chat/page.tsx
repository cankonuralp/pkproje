/* S.A.Y CHAT AYARLARI SAYFASI (529; pkproje §3.10 m.13–16, m.26 — reisim 2026-10-13: "say chat ayarları burda kötü durmuş görüpte anlamadım bile ne
   olduğunu … diğer tuşların yanına koy tuşa basınca ilgili sayfaya gitsin ve düzenleme yapalım"). Eskiden tür sayfasında açılır bölümdü; artık kendi
   sayfası: Format kurucunun tuşlarından ("S.A.Y Chat ayarları") ve tür sayfasındaki bölümün tuşundan açılır. Düzenleme say-chat/ui/ChatAyarlari.tsx;
   kapı ve yetki modülde (sayChatAyari: türü gören görür — yazmak ekipman türünü düzenleyebilende). Alanlar yayındaki rapor formatından; taslak
   varsa düzenleyebilen için "Format kurucu"ya dönüş tuşu. Görmeyen / başka firmanın türü: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Kirinti, NesneBasi } from "../../../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../../../components/tus/Tus";
import { bransAd } from "../../../../../modules/ekipman-turleri/sema";
import { turKarti } from "../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../modules/moduller";
import { formatDegistirir, formatSurumleri } from "../../../../../modules/rapor-format/server/formatlar";
import { surumAdi } from "../../../../../modules/rapor-format/ui/ortak";
import { sayChatAyari } from "../../../../../modules/say-chat/server/ayar";
import { ChatAyarlari } from "../../../../../modules/say-chat/ui/ChatAyarlari";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "S.A.Y Chat ayarları" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [t, chat, surumler] = await oturumIslemi(o, async (db) =>
    [await turKarti(db, o, id), await sayChatAyari(db, o, id), (await formatSurumleri(db, o, id)) ?? []] as const);
  if (!t || !chat) notFound();
  const yayinda = surumler.find((x) => x.durum === "yayinda"), taslak = surumler.find((x) => x.durum === "taslak");
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(t.brans)}`, t.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"],
        [t.ad, `/ekipman-turleri/${t.id}`], ["S.A.Y Chat ayarları"]]} />
      <NesneBasi baslik={`S.A.Y Chat ayarları · ${t.ad}`} altIkon="message-square-text"
        alt={yayinda ? `Rapor formatı ${surumAdi(yayinda)}` : "Yayında rapor formatı yok"}
        tuslar={taslak && formatDegistirir(o)
          ? <TusBaglanti tur="ikincil" ikon="pencil" href={`/ekipman-turleri/${t.id}/sablon/${taslak.id}/kurucu`}>Format kurucu</TusBaglanti> : undefined} />
      <ChatAyarlari ayar={chat} />
    </>
  );
}
