import jsPDF from "jspdf";
import { addCustomFonts } from "./fonts";
import { drawFormattedText, addTextWithUnderscores, getCenteredX } from "./markup";
import { loadAssetAsBase64, IMAGE_URLS } from "./assetLoader";
import {
  translateNumberToWords,
  translateAverageToWords,
  numberToSpanishWords,
  getNameFontSize,
  splitDateUpper,
  splitDateCapitalized,
} from "./helpers";
import { CertificateData } from "./types";

/**
 * Ported from the old system's certificatePDF.ts, with two changes:
 *  1. Data is no longer fetched mid-render — `data` already carries
 *     subjectScores, people, and certificate fields (see
 *     certificate/fetchCertificateData.ts and the /api/certificate/data
 *     route), so this module is pure layout.
 *  2. The hardcoded `CAREER_ID === 7` branch (which only "worked" because
 *     it matched one specific legacy database id) is replaced by
 *     `data.hasNinthPeriod`, derived from whether the career's subject
 *     catalog actually has a 9th-period subject.
 *
 * The hand-rolled coordinate layout itself is intentionally left as close
 * to the original as possible — it's already visually validated against
 * the official certificate format, and every `doc.text(..., x, y)` call
 * below is a pixel position tuned against that reference, not something
 * safe to "clean up" without a new round of visual verification.
 */
export async function renderCertificate(data: CertificateData): Promise<void> {
  const doc = new jsPDF("portrait", "mm", [215.9, 343]);

  await addCustomFonts(doc);

  const [logoMX, pictureSize, table, square, averageSquare, schoolarServicesTable] = await Promise.all([
    loadAssetAsBase64(IMAGE_URLS.logoMX),
    loadAssetAsBase64(IMAGE_URLS.pictureSize),
    loadAssetAsBase64(IMAGE_URLS.table),
    loadAssetAsBase64(IMAGE_URLS.square),
    loadAssetAsBase64(IMAGE_URLS.averageSquare),
    loadAssetAsBase64(IMAGE_URLS.scholarServicesTable),
  ]);

  let averageScore = "0.0";
  let totalSubjects = 0;

  const renderPeriodBody = (period: number, x: number, y: number) => {
    const periodSubjects = data.subjectScores.filter((s) => s.period === period);
    const allScored = data.subjectScores.filter((s) => s.value !== null);
    const totalScore = allScored.reduce((acc, s) => acc + (s.value ?? 0), 0);

    // Truncated to 1 decimal, no rounding — matches the "truncar promedio
    // general a 1 decimal sin redondeo" fix from the old system's history.
    averageScore = allScored.length > 0 ? (Math.floor((totalScore / allScored.length) * 10) / 10).toFixed(1) : "0.0";
    totalSubjects = new Set(data.subjectScores.map((s) => s.subjectId)).size;

    let currentY = y;
    if (periodSubjects.length === 0) return;

    const defaultFontSize = 9.5;
    doc.setFontSize(defaultFontSize);

    periodSubjects.forEach((subject) => {
      const splitText: string[] = doc.splitTextToSize(subject.subjectName, 53);
      if (splitText.length > 1) doc.setFontSize(9.5);

      splitText.forEach((line: string) => {
        if (line) {
          doc.text(line, x, currentY);
          currentY += 4;
        }
      });

      if (splitText.length > 1) doc.setFontSize(defaultFontSize);

      if (subject.value !== null) {
        const scoreText = subject.value.toString();
        const scoreTextWidth = doc.getTextWidth(scoreText);
        doc.text(scoreText, x + 58 - scoreTextWidth / 2, currentY - 4);

        if (subject.observation) {
          doc.text(subject.observation, x + 82, currentY - 4);
        }

        const translated = translateNumberToWords(subject.value);
        if (translated) {
          doc.text(translated, x + 66, currentY - 4);
        }
      }

      currentY += 0.5;
    });
  };

  doc.setFont("ArialNarrow", "normal");
  renderPeriodBody(1, 10, 135);
  renderPeriodBody(2, 111, 135);
  renderPeriodBody(3, 10, 205);
  renderPeriodBody(4, 111, 205);
  renderPeriodBody(5, 10, 275);
  renderPeriodBody(6, 111, 275);

  // ---- Header / school info (page 1) ----
  doc.addImage(logoMX, "PNG", 9, 8, 28, 29);

  doc.setFont("TimesNewRoman", "bold");
  doc.setFontSize(12);
  doc.text("N°: _________", 175, 30.2);
  doc.setTextColor("red");
  doc.text(`${data.certificateNumber}`, 183, 30);

  doc.setTextColor("black");
  const infoGobierno = `GOBIERNO CONSTITUCIONAL DEL ESTADO DE CHIAPAS\nSECRETARÍA DE EDUCACIÓN ESTATAL\nSUBSECRETARÍA DE EDUCACIÓN ESTATAL`;
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text(infoGobierno, 105, 10, { align: "center" });

  const infoDireccion = `DIRECCIÓN DE EDUCACIÓN SUPERIOR\nDEPARTAMENTO DE SERVICIOS ESCOLARES`;
  doc.text(infoDireccion, 105, 25, { align: "center" });

  doc.setFont("Arial", "normal");
  doc.setFontSize(10);
  doc.text(`${data.secl}`, 200, 12, { align: "right" });

  doc.addImage(pictureSize, "PNG", 9, 45, 37, 50);

  // The city name used to be two hardcoded literals split across two fixed
  // positions ("SAN CRISTÓBAL DE" / "LAS CASAS, CHIAPAS"). It's now driven
  // by the editable SCHOOL_CITY field, so an arbitrary-length value is
  // split roughly in half by word count across the same two lines instead
  // — not pixel-perfect for very long names, but avoids hardcoding the
  // literal text while keeping the rest of the page's fixed Y positions
  // (which a full re-wrap would otherwise cascade into shifting).
  const cityWords = data.schoolCity.split(" ").filter(Boolean);
  const citySplitAt = Math.ceil(cityWords.length / 2);
  const cityLine1 = cityWords.slice(0, citySplitAt).join(" ");
  const cityLine2 = cityWords.slice(citySplitAt).join(" ");

  doc.setFont("Arial", "normal");
  doc.setFontSize(12);
  doc.text("LA UNIVERSIDAD", 55, 43);
  doc.setFont("Arial", "bold");
  doc.text(`«${data.schoolName}»`, 91, 43);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("UBICADO EN LA CIUDAD DE", 131, 43);
  doc.setFont("Arial", "bold");
  doc.text(cityLine1, 175, 43);
  doc.setFont("Arial", "normal");
  addTextWithUnderscores(doc, cityLine1, 175, 43.5, 0);
  doc.setFont("Arial", "bold");
  doc.text(cityLine2, 55, 50);
  doc.setFont("Arial", "normal");
  addTextWithUnderscores(doc, cityLine2, 55, 50.5, 0);
  doc.text("RÉGIMEN", 114, 50);
  doc.setFont("Arial", "bold");
  doc.text(`${data.regimen},`, 130, 50);
  doc.setFont("Arial", "normal");
  doc.text("____________", 130, 50.5);
  doc.text("TURNO:", 181, 50);
  doc.setFont("Arial", "bold");
  doc.text(`${data.turno},`, 195, 50);
  doc.setFont("Arial", "normal");
  doc.text("______", 195, 50.5);
  doc.text("CLAVE:", 55, 57);
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text(`${data.clave},`, 68, 57);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("_______________", 68, 57.5);
  doc.text("MODALIDAD:", 97, 57);
  doc.setFont("Arial", "bold");
  doc.text(`${data.modalidad},`, 118, 57);
  doc.setFont("Arial", "normal");
  doc.text("______", 118, 57.5);
  doc.setFontSize(12);
  doc.text("RVOE:", 131, 57);
  doc.setFontSize(9);
  doc.text("ACUERDO NUMERO:", 145, 57);
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text(`${data.rvoe},`, 178, 57);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("________________", 178, 57.5);
  doc.text("VIGENTE: A PARTIR DEL", 55, 64);

  const vigencia = splitDateUpper(data.vigencia);
  doc.setFont("Arial", "bold");
  doc.text(`${vigencia.dd}`, 95, 64);
  doc.setFont("Arial", "normal");
  doc.text("__", 95, 64);
  doc.text("DE", 100, 64);

  doc.setFont("Arial", "bold");
  const centeredVigenciaMonth = getCenteredX(doc, vigencia.monthName, 106, 125);
  doc.text(vigencia.monthName, centeredVigenciaMonth, 64);
  addTextWithUnderscores(doc, vigencia.monthName, centeredVigenciaMonth, 64, 0);

  doc.setFont("Arial", "normal");
  doc.text("DEL", 128, 64);
  doc.setFont("Arial", "bold");
  doc.text(`${vigencia.yyyy}`, 136, 64);
  doc.setFont("Arial", "normal");
  doc.text("____", 136, 64);

  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text("C E R T I F I C A", 55, 80);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("QUE EL (LA) C.", 89, 80);

  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(getNameFontSize(data.studentName));
  doc.text(`${data.studentName}`, 113, 80);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("____________________________________________________", 113, 80.5);
  doc.text("CON NÚMERO DE CONTROL", 55, 87);

  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(12);
  doc.text(`${data.studentTuition}`, 115, 87);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("___________________________", 101, 87.5);
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text("ACREDITÓ", 152, 87);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("LAS MATERIAS QUE", 175, 87);

  doc.setFont("ArialNarrow", "normal");
  doc.setFontSize(9.5);
  doc.text("INTEGRAN EL PLAN DE ESTUDIO DE LA", 55, 94);

  doc.setFont("SofiaBold", "bold");
  doc.setFontSize(13);
  const centeredCareer = getCenteredX(doc, data.studentCareer, 108, 195);
  doc.text(`${data.studentCareer},`, centeredCareer, 94);

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("EN EL", 197, 94);
  doc.text("PERÍODO DE", 55, 101);

  const startPeriod = splitDateUpper(data.studentStartPeriod);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(11);
  const centeredStart = getCenteredX(doc, startPeriod.monthName, 76, 100);
  doc.text(startPeriod.monthName, centeredStart, 101);
  addTextWithUnderscores(doc, startPeriod.monthName, centeredStart, 101, 0);

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("DE", 104, 101);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(11);
  doc.text(`${startPeriod.yyyy}`, 110, 101);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("_____", 110, 101);
  doc.text("A", 121, 101);

  const endPeriod = splitDateUpper(data.studentEndPeriod);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(11);
  const centeredEnd = getCenteredX(doc, endPeriod.monthName, 125, 150);
  doc.text(endPeriod.monthName, centeredEnd, 101);
  addTextWithUnderscores(doc, endPeriod.monthName, centeredEnd, 101, 0);

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("DE", 153, 101);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(11);
  doc.text(`${endPeriod.yyyy}`, 159, 101);
  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text("_____,", 159, 101);
  doc.text("CON LOS RESULTADOS", 170, 101);
  doc.text("QUE A CONTINUACIÓN SE ANOTAN.", 55, 108);

  const periodTableHeader = (title: string, x: number, y: number) => {
    doc.addImage(table, "PNG", x, y, 96, 60);
    doc.setFont("ArialNarrow", "normal");
    doc.setFontSize(10);
    doc.text(title, x + 11, y + 7);
    doc.setFontSize(9);
    doc.text("CALIFICACIÓN", x + 56.5, y + 4);
    doc.text("Cifra", x + 57.5, y + 9);
    doc.text("Letra", x + 67.5, y + 9);
    doc.setFontSize(10);
    doc.text(`OBSERVA-\nCIONES`, x + 85, y + 5, { align: "center" });
  };

  periodTableHeader("PRIMER CUATRIMESTRE", 9, 120);
  periodTableHeader("SEGUNDO CUATRIMESTRE", 110, 120);
  periodTableHeader("TERCER CUATRIMESTRE", 9, 190);
  periodTableHeader("CUARTO CUATRIMESTRE", 110, 190);
  periodTableHeader("QUINTO CUATRIMESTRE", 9, 260);
  periodTableHeader("SEXTO CUATRIMESTRE", 110, 260);

  doc.setFont("ArialNarrow", "normal");
  doc.setFontSize(11);
  doc.text("Este documento no es válido si presenta raspaduras o enmendaduras.", 60, 328);

  // ---- Page 2 ----
  doc.addPage();

  periodTableHeader("SÉPTIMO CUATRIMESTRE", 9, 10);
  periodTableHeader("OCTAVO CUATRIMESTRE", 110, 10);

  doc.setFont("ArialNarrow", "normal");
  renderPeriodBody(7, 10, 25);
  renderPeriodBody(8, 111, 25);

  if (data.hasNinthPeriod) {
    periodTableHeader("NOVENO CUATRIMESTRE", 9, 74);
    renderPeriodBody(9, 10, 90);

    const averageScoreText = translateAverageToWords(averageScore);
    doc.addImage(averageSquare, "PNG", 9, 137, 96, 5);
    doc.setFont("Arial", "bold");
    doc.setFontSize(9);
    doc.text("PROMEDIO GENERAL:", 10, 140.5);
    doc.setFont("TimesNewRoman", "bold");
    doc.text(`${averageScore}  ( ${averageScoreText} )`, 55, 140.5);

    doc.setFont("Arial", "bold");
    doc.text(`${data.people[1].charge} «${data.schoolName}»`, 55, 152, { maxWidth: 60, align: "center" });
    doc.text("____________________________________________________", 10, 174);
    doc.setFont("TimesNewRoman", "normal");
    doc.setFontSize(10);
    doc.text(data.people[1].name, getCenteredX(doc, data.people[1].name, 10, 100), 179);

    doc.setFont("Arial", "bold");
    doc.setFontSize(9);
    doc.text(`${data.people[2].charge} «${data.schoolName}»`, 155, 152, { maxWidth: 50, align: "center" });
    doc.text("____________________________________________________", 110, 174);
    doc.setFont("TimesNewRoman", "normal");
    doc.setFontSize(10);
    doc.text(data.people[2].name, getCenteredX(doc, data.people[2].name, 110, 200), 179);
  } else {
    const averageScoreText = translateAverageToWords(averageScore);
    doc.addImage(averageSquare, "PNG", 9, 74, 96, 5);
    doc.setFont("Arial", "bold");
    doc.setFontSize(9);
    doc.text("PROMEDIO GENERAL:", 10, 77.5);
    doc.setFont("TimesNewRoman", "bold");
    doc.text(`${averageScore}  ( ${averageScoreText} )`, 55, 77.5);

    doc.setFont("Arial", "bold");
    doc.text(`${data.people[1].charge} «${data.schoolName}»`, 55, 140, { maxWidth: 60, align: "center" });
    doc.text("____________________________________________________", 10, 160);
    doc.setFont("TimesNewRoman", "normal");
    doc.setFontSize(10);
    doc.text(data.people[1].name, getCenteredX(doc, data.people[1].name, 10, 100), 165);

    doc.setFont("Arial", "bold");
    doc.setFontSize(9);
    doc.text(`${data.people[2].charge} «${data.schoolName}»`, 155, 140, { maxWidth: 50, align: "center" });
    doc.text("____________________________________________________", 110, 160);
    doc.setFont("TimesNewRoman", "normal");
    doc.setFontSize(10);
    doc.text(data.people[2].name, getCenteredX(doc, data.people[2].name, 110, 200), 165);
  }

  // ---- Legal paragraphs & remaining signatures ----
  const totalSubjectsText = numberToSpanishWords(totalSubjects);
  const certificateDate = splitDateCapitalized(data.exp);

  const processedLegalTop = data.legalTop
    .replace("{totalSubjects}", totalSubjects.toString())
    .replace("{totalSubjectsText}", totalSubjectsText)
    .replace("{dd}", certificateDate.dd)
    .replace("{monthName}", certificateDate.monthName)
    .replace("{yyyy}", certificateDate.yyyy);

  doc.addImage(square, "PNG", 110, 74, 96, 50);
  doc.setFont("Arial", "normal");
  doc.setFontSize(10.7);
  drawFormattedText(doc, processedLegalTop, 111.5, 78, 93, 5);

  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text(`${data.people[3].charge}`, 55, 190, { maxWidth: 60, align: "center" });
  doc.text("____________________________________________________", 10, 210);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(10);
  doc.text(data.people[3].name, getCenteredX(doc, data.people[3].name, 10, 100), 215);

  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text(`${data.people[4].charge}`, 155, 190, { maxWidth: 50, align: "center" });
  doc.text("____________________________________________________", 110, 210);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(10);
  doc.text(data.people[4].name, getCenteredX(doc, data.people[4].name, 110, 200), 215);

  doc.addImage(schoolarServicesTable, "PNG", 10, 230, 60, 95);
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  doc.text("REGISTRADO EN EL DEPARTAMENTO DE SERVICIOS ESCOLARES", 40, 235.5, { maxWidth: 60, align: "center" });
  doc.setFontSize(10);
  doc.text("CON Nº:", 12, 252);
  doc.text("EN EL LIBRO:", 12, 262);
  doc.text("FOJA:", 12, 272);
  doc.text("FECHA:", 12, 282);
  doc.text("_____________", 40, 252);
  doc.text("_____________", 40, 262);
  doc.text("_____________", 40, 272);
  doc.text("_____________", 40, 282);
  doc.setFont("Arial", "bold");
  doc.text("C O T E J Ó:", 30, 293);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(8);
  doc.text(data.people[7].name, getCenteredX(doc, data.people[7].name, 12, 68), 302);

  doc.setFont("Arial", "normal");
  doc.text(`${data.people[5].charge}`, 27, 312);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(8);
  doc.text(data.people[5].name, getCenteredX(doc, data.people[5].name, 12, 68), 320);

  doc.setFont("Arial", "normal");
  doc.setFontSize(10);
  const finalYOfLegal1 = drawFormattedText(doc, data.legal1, 110, 235, 95, 4.5);
  const yForLegal2 = finalYOfLegal1 + 4.5 * 2;
  const finalYOfLegal2 = drawFormattedText(doc, data.legal2, 110, yForLegal2, 95, 4.5);

  // The signature block below legal1/legal2 used to sit at fixed Y
  // coordinates (285 onward), which only worked because the legal text was
  // always short enough to end well above them. Since LEGAL_1/LEGAL_2 are
  // now editable admin fields (Administrar > Campos de certificado) and can
  // be any length, the whole block is anchored to where legal2 actually
  // ends instead, with a minimum gap — so it only shifts down when the text
  // grows, and renders identically to before for text that fits the old
  // space. `LEGAL_TEXT_GAP` is the breathing room left between the last
  // line of legal2 and the signature block.
  const LEGAL_TEXT_GAP = 10;
  const DEFAULT_SIGNATURE_BLOCK_Y = 285;
  const signatureBlockY = Math.max(DEFAULT_SIGNATURE_BLOCK_Y, finalYOfLegal2 + LEGAL_TEXT_GAP);
  const signatureShift = signatureBlockY - DEFAULT_SIGNATURE_BLOCK_Y;

  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(10);
  doc.text(data.people[4].name, getCenteredX(doc, data.people[4].name, 110, 200), signatureBlockY);
  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text("____________________________________________________", 110, 286 + signatureShift);
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  doc.text("TUXTLA GUTIÉRREZ, CHIAPAS; A", 110, 298 + signatureShift);
  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text("__________________________", 157, 298 + signatureShift);

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  doc.text(`${data.people[6].charge}`, 156, 320 + signatureShift, { maxWidth: 100, align: "center" });
  doc.text("____________________________________________________", 110, 312 + signatureShift);
  doc.setFont("TimesNewRoman", "normal");
  doc.setFontSize(10);
  doc.text(data.people[6].name, getCenteredX(doc, data.people[6].name, 110, 200), 316 + signatureShift, { maxWidth: 87 });

  if (signatureShift > 0) {
    console.warn(
      `certificate: legal1/legal2 text pushed the signature block down by ${signatureShift.toFixed(1)}mm; ` +
        `verify it still fits above the page break (page 2 ends at y=343mm) before printing.`,
    );
  }

  doc.save(`${data.exp}-${data.studentTuition}-CER-AQ`);
}
