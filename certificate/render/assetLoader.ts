/**
 * jsPDF's addFileToVFS/addImage need base64 content, not a URL. Fonts and
 * images used to be committed as giant base64 string literals inside .ts
 * source files (client/src/utils/fonts/*.ts, pictures/*.ts in the old
 * system), bloating the bundle and the TS compiler's work. They're now
 * real binary files under public/, fetched and base64-encoded once at
 * render time instead.
 */
async function toBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const cache = new Map<string, Promise<string>>();

export function loadAssetAsBase64(url: string): Promise<string> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load certificate asset: ${url}`);
          return res.arrayBuffer();
        })
        .then(toBase64),
    );
  }
  return cache.get(url)!;
}

export const FONT_URLS = {
  arial: "/fonts/arial.ttf",
  arialBold: "/fonts/arial-bold.ttf",
  arialNarrow: "/fonts/arial-narrow.ttf",
  arialNarrowBold: "/fonts/arial-narrow-bold.ttf",
  timesNewRoman: "/fonts/times-new-roman.ttf",
  timesNewRomanBold: "/fonts/times-new-roman-bold.ttf",
  sofiaBold: "/fonts/sofia-bold.ttf",
} as const;

export const IMAGE_URLS = {
  logoMX: "/certificate-assets/logo-mx.png",
  pictureSize: "/certificate-assets/picture-size.png",
  table: "/certificate-assets/table.png",
  square: "/certificate-assets/square.png",
  averageSquare: "/certificate-assets/average-square.png",
  scholarServicesTable: "/certificate-assets/scholar-services-table.png",
} as const;
