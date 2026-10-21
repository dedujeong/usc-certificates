import jsPDF from "jspdf";
import { loadAssetAsBase64, FONT_URLS } from "./assetLoader";

export async function addCustomFonts(doc: jsPDF): Promise<void> {
  const [arial, arialBold, arialNarrow, arialNarrowBold, timesNewRoman, timesNewRomanBold, sofiaBold] =
    await Promise.all([
      loadAssetAsBase64(FONT_URLS.arial),
      loadAssetAsBase64(FONT_URLS.arialBold),
      loadAssetAsBase64(FONT_URLS.arialNarrow),
      loadAssetAsBase64(FONT_URLS.arialNarrowBold),
      loadAssetAsBase64(FONT_URLS.timesNewRoman),
      loadAssetAsBase64(FONT_URLS.timesNewRomanBold),
      loadAssetAsBase64(FONT_URLS.sofiaBold),
    ]);

  doc.addFileToVFS("Arial.ttf", arial);
  doc.addFont("Arial.ttf", "Arial", "normal");

  doc.addFileToVFS("ArialBold.ttf", arialBold);
  doc.addFont("ArialBold.ttf", "Arial", "bold");

  doc.addFileToVFS("ArialNarrow.ttf", arialNarrow);
  doc.addFont("ArialNarrow.ttf", "ArialNarrow", "normal");

  doc.addFileToVFS("ArialNarrowBold.ttf", arialNarrowBold);
  doc.addFont("ArialNarrowBold.ttf", "ArialNarrow", "bold");

  doc.addFileToVFS("TimesNewRoman.ttf", timesNewRoman);
  doc.addFont("TimesNewRoman.ttf", "TimesNewRoman", "normal");

  doc.addFileToVFS("TimesNewRomanBold.ttf", timesNewRomanBold);
  doc.addFont("TimesNewRomanBold.ttf", "TimesNewRoman", "bold");

  doc.addFileToVFS("SofiaBold.ttf", sofiaBold);
  doc.addFont("SofiaBold.ttf", "SofiaBold", "bold");
}
