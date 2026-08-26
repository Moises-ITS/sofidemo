/** Client-side image resizing so uploads stay small and fast. */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file"));
    };
    img.src = url;
  });
}

function drawScaled(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
): string {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser");
  context.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Full-size (but compressed) version sent to the vision model. */
export async function compressForUpload(file: File): Promise<string> {
  const img = await loadImage(file);
  return drawScaled(img, 1280, 0.82);
}

/** Small thumbnail stored in localStorage alongside library items. */
export async function createThumbnail(file: File): Promise<string> {
  const img = await loadImage(file);
  return drawScaled(img, 320, 0.7);
}
