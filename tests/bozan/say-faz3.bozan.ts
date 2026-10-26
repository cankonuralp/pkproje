/* OLUMSUZ KANIT — tests/say-faz3.test.ts neyi koruyor (2026-10-26). Talimat bellekte bozulur (kaynak diskte DEĞİŞTİRİLMEZ, anayasa 13.11).
   1. "Sık işler" bölümünden toplu onaya gönderme çıkarsa S.A.Y "hazır raporları onaya gönder"i yine tek tek sorar. 2. Standart bağlama işlemi
   talimattan düşerse S.A.Y standardı formatı çizerek ekler. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { saySistemi } from "../../src/server/yz/say.ts";
import { DENEME_SETI, talimatKarsilar } from "../say-faz3.test.ts";

const T = saySistemi([], "");
const tutar = (t: string) => DENEME_SETI.every(([, a]) => talimatKarsilar(t, a));

test("0. bozulmamış talimat deneme setini karşılar", () => { assert.equal(tutar(T), true); });
test("1. toplu onaya gönderme talimattan çıkınca kilit düşer", () => {
  assert.equal(tutar(T.replaceAll("rapor_onaya_gonder", "raporu gönder")), false);
});
test("2. standart bağlama işlemi talimattan çıkınca kilit düşer", () => {
  assert.equal(tutar(T.replaceAll("tur_standart_ekle", "standart ekle")), false);
});
