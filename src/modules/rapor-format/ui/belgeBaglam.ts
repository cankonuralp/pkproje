"use client";
/* BELGE KATALOĞU BAĞLAMI — 2026-10-25 (belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız").
   Belge kurucusu (BelgeKurucu.tsx) kâğıdı bu bağlamla sarar: serbest tablonun kayıt hücresi (TabloDuzenleyici.tsx) bilgisini belgenin
   katalogundan (src/belge/katalog.ts) seçer — hücreye "veri" yazılır ("alan" ya da çoğalan satırda "liste.kolon"). Bağlam yoksa rapor kurucusu:
   hücre rapor kaynaklarından (TABLO_KAYNAKLARI), davranış aynen. Ad / seçenek işlevleri saf. */
import { createContext } from "react";
import type { BelgeKatalogu } from "../../../belge/katalog";

export const BelgeKatalogBaglami = createContext<BelgeKatalogu | null>(null);

/** hücrenin bilgisinin okunur adı: alanın adı ya da "Liste adı · kolon adı"; katalogda yoksa anahtarın kendisi */
export function veriAdi(k: BelgeKatalogu, veri: string): string {
  const [a, b] = veri.split(".");
  if (b === undefined) return k.alanlar.find((x) => x.anahtar === a)?.ad ?? veri;
  const l = k.listeler.find((x) => x.anahtar === a), kol = l?.kolonlar.find((x) => x.anahtar === b);
  return l && kol ? `${l.ad} · ${kol.ad}` : veri;
}

/** kayıt hücresinin seçenekleri: belgenin alanları; hücrenin satırı çoğalan satırsa listelerin kolonları da */
export function veriSecenekleri(k: BelgeKatalogu, tekrar: boolean): (readonly [string, string, string])[] {
  return [
    ...k.alanlar.map((x) => [x.anahtar, x.ad, ""] as const),
    ...(tekrar ? k.listeler.flatMap((l) => l.kolonlar.map((c) => [`${l.anahtar}.${c.anahtar}`, `${l.ad} · ${c.ad}`, ""] as const)) : []),
  ];
}

/** yeni kayıt hücresinin bilgisi: çoğalan satırda ilk listenin ilk kolonu, değilse belgenin ilk alanı */
export function ilkVeri(k: BelgeKatalogu, tekrar: boolean): string | undefined {
  const l = tekrar ? k.listeler.find((x) => x.kolonlar.length) : undefined;
  return l ? `${l.anahtar}.${l.kolonlar[0].anahtar}` : k.alanlar[0]?.anahtar;
}
