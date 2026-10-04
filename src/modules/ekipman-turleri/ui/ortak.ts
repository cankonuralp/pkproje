/* Ekipman türleri ekranlarının ortak parçaları */
export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
