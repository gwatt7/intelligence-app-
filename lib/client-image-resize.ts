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

/**
 * Average perceptual brightness of an already-loaded image (a data: URI),
 * 0 (darkest) to 1 (lightest) — a cheap downsampled canvas pixel read, not
 * a full-resolution scan, since only a rough "is this photo light or dark
 * overall" signal is needed. Used to automatically pick readable text/scrim
 * colors for whatever's displayed over the photo (see PlayerProfileHero),
 * recomputed every time a background photo is saved so it never goes stale.
 */
export function computeImageBrightness(dataUri: string, sampleSize = 24): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onerror = () => reject(new Error("Could not load that image"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Image analysis isn't supported in this browser"));
        return;
      }
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
      let total = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        count += 1;
      }
      resolve(total / count / 255);
    };
    img.src = dataUri;
  });
}
