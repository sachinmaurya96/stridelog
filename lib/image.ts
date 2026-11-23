export const MAX_EDGE = 1080;
export const THUMB_EDGE = 300;

type Source = ImageBitmap | HTMLImageElement;

async function load(file: Blob): Promise<Source> {
  try {
    // Applies the EXIF orientation so phone photos aren't sideways.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function draw(src: Source, maxEdge: number) {
  const w = src.width, h = src.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** WebP at ~0.8 quality; browsers that can't encode WebP (older Safari) fall back to JPEG. */
async function encode(canvas: HTMLCanvasElement) {
  const webp = await toBlob(canvas, 'image/webp', 0.8);
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.82);
  if (!jpeg) throw new Error('Could not compress the photo.');
  return jpeg;
}

/** Compresses a photo in the browser: max 1080 px long edge, plus a 300 px thumbnail. */
export async function compressImage(file: Blob) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const src = await load(file);
  try {
    const [blob, thumbBlob] = await Promise.all([encode(draw(src, MAX_EDGE)), encode(draw(src, THUMB_EDGE))]);
    return { blob, thumbBlob };
  } finally {
    if ('close' in src) src.close();
  }
}
