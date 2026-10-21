import puppeteer, { Browser } from "puppeteer";
import { buildCertificateHtml } from "@/certificate/html/template";
import { CertificateData } from "@/certificate/render/types";

// One headless browser instance reused across requests — launching Chromium
// per request would make every certificate generation take seconds longer
// than necessary. It's lazily started on first use and kept alive for the
// life of the server process.
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      // --disable-dev-shm-usage avoids crashes in Docker, where /dev/shm is
      // small by default rather than sized for Chromium's usual needs.
      // --disable-crash-reporter: Chromium's crashpad handler needs a
      // writable database directory, which the Docker image's unprivileged
      // system user doesn't have a $HOME for — not needed for a headless
      // PDF renderer anyway.
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-crash-reporter",
      ],
      // In Docker, Puppeteer's own Chromium download is skipped and the
      // Debian `chromium` package is used instead (see Dockerfile).
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
  }
  return browserPromise;
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  const html = await buildCertificateHtml(data);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // The HTML is fully self-contained (fonts/images inlined as data URIs
    // by buildCertificateHtml), so there's no external network activity to
    // wait for — "load" is enough, and setContent only supports
    // load/domcontentloaded anyway (unlike page.goto's networkidle0).
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      width: "215.9mm",
      height: "343mm",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
