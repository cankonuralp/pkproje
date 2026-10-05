/* Teklifler ekranlarının ortak küçük parçaları: bugüne gün farkı (Türkiye takvim günü) */
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kaç gün (geçmişse eksi) */
export const gunFarki = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);
