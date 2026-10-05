/* FOTOĞRAF KÜÇÜLTME — tek üretici (09-A4: cihazda en uzun kenar 1600 px, JPEG %75; sahada mobil veri ve depo tasarrufu). Tarayıcı çözemezse
   (ör. HEIC) ya da tuval yoksa dosya olduğu gibi gider; sunucu türü baytlardan denetler, EXIF'i siler, uymayanı reddeder (dosya.ts). */
export async function fotografiKucult(dosya: File, enUzun = 1600, kalite = 0.75): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return dosya;
  try {
    const bmp = await createImageBitmap(dosya, { imageOrientation: "from-image" });
    const oran = Math.min(1, enUzun / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * oran)), h = Math.max(1, Math.round(bmp.height * oran));
    const tuval = document.createElement("canvas");
    tuval.width = w; tuval.height = h;
    const ctx = tuval.getContext("2d");
    if (!ctx) { bmp.close(); return dosya; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((coz) => tuval.toBlob(coz, "image/jpeg", kalite));
    if (!blob || blob.size >= dosya.size && dosya.type === "image/jpeg") return dosya;
    return new File([blob], `${dosya.name.replace(/\.[^.]*$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
  } catch {
    return dosya;
  }
}
