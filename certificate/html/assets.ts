import { readFile } from "node:fs/promises";
import path from "node:path";

// Reads a font/image file from public/ once and caches it as a data URI, so
// the generated HTML is fully self-contained (no network round trip to the
// app's own server needed from inside the headless browser).
const cache = new Map<string, Promise<string>>();

async function toDataUri(publicPath: string, mime: string): Promise<string> {
  if (!cache.has(publicPath)) {
    cache.set(
      publicPath,
      readFile(path.join(process.cwd(), "public", publicPath)).then(
        (buf) => `data:${mime};base64,${buf.toString("base64")}`,
      ),
    );
  }
  return cache.get(publicPath)!;
}

export const FONT_FILES = {
  arial: "fonts/arial.ttf",
  arialBold: "fonts/arial-bold.ttf",
  arialNarrow: "fonts/arial-narrow.ttf",
  arialNarrowBold: "fonts/arial-narrow-bold.ttf",
  timesNewRoman: "fonts/times-new-roman.ttf",
  timesNewRomanBold: "fonts/times-new-roman-bold.ttf",
  sofiaBold: "fonts/sofia-bold.ttf",
} as const;

export const IMAGE_FILES = {
  logoMX: "certificate-assets/logo-mx.png",
  pictureSize: "certificate-assets/picture-size.png",
  table: "certificate-assets/table.png",
  square: "certificate-assets/square.png",
  averageSquare: "certificate-assets/average-square.png",
  scholarServicesTable: "certificate-assets/scholar-services-table.png",
} as const;

export async function loadCertificateAssets() {
  const [fonts, images] = await Promise.all([
    Promise.all(Object.entries(FONT_FILES).map(async ([key, file]) => [key, await toDataUri(file, "font/ttf")] as const)),
    Promise.all(Object.entries(IMAGE_FILES).map(async ([key, file]) => [key, await toDataUri(file, "image/png")] as const)),
  ]);
  return {
    fonts: Object.fromEntries(fonts) as Record<keyof typeof FONT_FILES, string>,
    images: Object.fromEntries(images) as Record<keyof typeof IMAGE_FILES, string>,
  };
}
