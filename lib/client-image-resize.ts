/** Resizes/compresses an image file client-side (canvas re-encode) before it's ever sent to the server — keeps the stored data: URI small regardless of the original file size, and preserves the source aspect ratio exactly (only the longer edge is capped at `maxDim`), so the caller never has to pre-crop anything. Shared by every player-photo upload control (headshot, background). */
export function resizeImageFile(file: File, maxDim = 480, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = document.createElement("img");
      img.onerror = () => reject(new Error("Could not load that image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image resizing isn't supported in this browser"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
