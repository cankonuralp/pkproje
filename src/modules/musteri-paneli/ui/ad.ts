/* indirilen dosyanın / klasörün adı (321): Windows'un ve ZIP'in sorun çıkardığı karakterler (denetim, / \ : * ? " < > |) boşluk olur, boşluklar
   sadeleşir, baştaki / sondaki nokta ve boşluk atılır (".." yol olmaz), en çok 80 karakter; boş kalırsa "Tesis". Saf (test edilir). */
const YASAK = /[\u0000-\u001f\u007f\\/:*?"<>|]/g;
export const klasorAdi = (s: string) => s.replace(YASAK, " ").replace(/\s+/g, " ").replace(/^[ .]+|[ .]+$/g, "").slice(0, 80).replace(/[ .]+$/, "") || "Tesis";
/** dosya adı parçası: küçük harf (Türkçe), tire */
export const adParcasi = (s: string) => klasorAdi(s).toLocaleLowerCase("tr").replace(/ /g, "-");
