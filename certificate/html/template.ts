import { CertificateData } from "@/certificate/render/types";
import {
  translateNumberToWords,
  translateAverageToWords,
  numberToSpanishWords,
  getNameFontSize,
  splitDateUpper,
  splitDateCapitalized,
} from "@/certificate/render/helpers";
import { markupToHtml } from "./markup";
import { loadCertificateAssets } from "./assets";

/**
 * HTML+CSS replacement for the old jsPDF-based renderCertificate.ts
 * (removed). Ported from the same coordinate system (mm positions, pt font
 * sizes — both units CSS supports natively, so the numbers below are the
 * *same* numbers the jsPDF version used), with two real quality upgrades:
 *  - The 3 legal paragraphs (LEGAL_TOP/LEGAL_1/LEGAL_2) use real CSS
 *    `text-align: justify` + `hyphens: auto` with `lang="es"`, instead of
 *    the old hand-rolled word-wrap/justify engine. A real browser's text
 *    shaper also kerns and anti-aliases far better than jsPDF's glyph
 *    rendering.
 *  - Signature/fill-in lines are real CSS borders instead of strings of
 *    "_____" characters.
 * jsPDF's `doc.text(text, x, y)` treats y as the text BASELINE; HTML boxes
 * position from the top, so each positioned item subtracts an approximate
 * ascent offset (see `baselineOffset`) — this is an approximation, not an
 * exact font-metrics calculation, and was visually checked against the old
 * output rather than derived analytically.
 */

const PT_TO_MM = 0.3528;
function baselineOffset(sizePt: number): number {
  return sizePt * PT_TO_MM * 0.82;
}

type FontKey = "arial" | "arialNarrow" | "timesNewRoman" | "sofiaBold";

const FONT_FAMILY: Record<FontKey, string> = {
  arial: "CertArial",
  arialNarrow: "CertArialNarrow",
  timesNewRoman: "CertTimesNewRoman",
  sofiaBold: "CertSofiaBold",
};

interface TextOpts {
  font?: FontKey;
  bold?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  width?: number;
  html?: boolean; // treat `text` as already-escaped HTML (bold/underline markup)
  underline?: boolean;
  whiteSpace?: "nowrap" | "pre" | "normal";
  // jsPDF's `doc.text(text, x, y, { align: "center", maxWidth })` keeps `x`
  // as the CENTER point the text is anchored around — `maxWidth` only caps
  // line-wrapping, it does not turn `x` into a box's left edge the way
  // `width` does above. Use this for ports of that exact call shape; mixing
  // it up with plain box mode displaces the text by half its width.
  anchorAtCenter?: boolean;
}

function textEl(text: string, x: number, y: number, size: number, opts: TextOpts = {}): string {
  const font = opts.font ?? "arial";
  const top = y - baselineOffset(size);
  // Mirrors jsPDF's two distinct `align` semantics, which this used to
  // conflate into one (causing centered text to overflow into its
  // neighbors — see the comment on `getCenteredX`, now removed):
  //  - align + a `width` ("box mode", jsPDF's `{maxWidth, align}`): `x` is
  //    the box's LEFT edge; text centers/right-aligns *within* [x, x+width]
  //    via real `text-align`, so the browser measures it correctly instead
  //    of us estimating a width.
  //  - align with no `width` ("point mode", jsPDF's plain `{align}`): `x`
  //    is the point text centers/right-aligns *around*, via a transform.
  const alignStyles =
    opts.align === "center"
      ? opts.width
        ? opts.anchorAtCenter
          ? `left:${x}mm; width:${opts.width}mm; transform:translateX(-50%); text-align:center;`
          : `left:${x}mm; width:${opts.width}mm; text-align:center;`
        : `left:${x}mm; transform:translateX(-50%); text-align:center;`
      : opts.align === "right"
        ? opts.width
          ? `left:${x}mm; width:${opts.width}mm; text-align:right;`
          : `left:${x}mm; transform:translateX(-100%); text-align:right;`
        : `left:${x}mm;${opts.width ? ` width:${opts.width}mm;` : ""}`;
  const content = opts.html ? text : escapeHtml(text);
  return `<div style="position:absolute; top:${top}mm; ${alignStyles} font-family:'${FONT_FAMILY[font]}'; font-weight:${
    opts.bold ? 700 : 400
  }; font-size:${size}pt; color:${opts.color ?? "#000"}; white-space:${opts.whiteSpace ?? "nowrap"}; ${
    opts.underline ? "text-decoration:underline;" : ""
  }">${content}</div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A horizontal fill-in line, e.g. under a signature or a blank to write on. */
function lineEl(x: number, y: number, width: number): string {
  return `<div style="position:absolute; left:${x}mm; top:${y}mm; width:${width}mm; border-bottom:0.3mm solid #000;"></div>`;
}

function imageEl(src: string, x: number, y: number, w: number, h: number): string {
  return `<img src="${src}" style="position:absolute; left:${x}mm; top:${y}mm; width:${w}mm; height:${h}mm;" />`;
}

interface PeriodTableConfig {
  title: string;
  x: number;
  y: number;
}

// Column widths traced from the old table.png background image (now
// replaced by a real <table> — see renderPeriodTable): title/subject-name
// column, Cifra, Letra, Observaciones, summing to the 96mm box width.
const PERIOD_TABLE_COLS = [55.4, 9.84, 10.26, 20.4] as const;

function renderPeriodTable(data: CertificateData, config: PeriodTableConfig, period: number): string {
  const { title, x, y } = config;
  const subjects = data.subjectScores.filter((s) => s.period === period);
  const narrow = FONT_FAMILY.arialNarrow;
  const border = "0.3mm solid #000";

  const rows = subjects
    .map((s) => {
      const cells =
        s.value !== null
          ? `<td style="border-right:${border}; text-align:center;">${s.value}</td>
             <td style="border-right:${border};">${translateNumberToWords(s.value)}</td>
             <td>${s.observation ?? ""}</td>`
          : `<td style="border-right:${border};"></td><td style="border-right:${border};"></td><td></td>`;
      return `<tr>
        <td style="padding-left:2.5mm; border-right:${border};">${escapeHtml(s.subjectName)}</td>
        ${cells}
      </tr>`;
    })
    .join("");

  return `
    <div style="position:absolute; left:${x}mm; top:${y}mm; width:96mm; height:60mm; border:${border}; border-radius:1.3mm; overflow:hidden; box-sizing:border-box;">
      <table style="width:100%; height:100%; border-collapse:collapse; table-layout:fixed; font-family:'${narrow}'; font-size:9.5pt;">
        <colgroup>
          ${PERIOD_TABLE_COLS.map((w) => `<col style="width:${w}mm;">`).join("")}
        </colgroup>
        <tbody>
          <tr style="height:7.5mm;">
            <td rowspan="2" style="padding-left:2.5mm; border-right:${border}; border-bottom:${border}; font-size:10pt; vertical-align:middle;">${escapeHtml(title)}</td>
            <td colspan="2" style="border-right:${border}; border-bottom:${border}; font-size:9pt; text-align:center; vertical-align:middle;">CALIFICACIÓN</td>
            <td rowspan="2" style="border-bottom:${border}; font-size:10pt; text-align:center; vertical-align:middle; line-height:1.15;">OBSERVA-<br/>CIONES</td>
          </tr>
          <tr style="height:3.8mm;">
            <td style="border-right:${border}; border-bottom:${border}; font-size:9pt; text-align:center; vertical-align:middle;">Cifra</td>
            <td style="border-right:${border}; border-bottom:${border}; font-size:9pt; text-align:center; vertical-align:middle;">Letra</td>
          </tr>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

export async function buildCertificateHtml(data: CertificateData): Promise<string> {
  const { fonts, images } = await loadCertificateAssets();

  const allScored = data.subjectScores.filter((s) => s.value !== null);
  const totalScore = allScored.reduce((acc, s) => acc + (s.value ?? 0), 0);
  // Truncated to 1 decimal, no rounding — matches the "truncar promedio
  // general a 1 decimal sin redondeo" fix from the old system's history.
  const averageScore = allScored.length > 0 ? (Math.floor((totalScore / allScored.length) * 10) / 10).toFixed(1) : "0.0";
  const averageScoreText = translateAverageToWords(averageScore);
  const totalSubjects = new Set(data.subjectScores.map((s) => s.subjectId)).size;
  const totalSubjectsText = numberToSpanishWords(totalSubjects);

  const cityWords = data.schoolCity.split(" ").filter(Boolean);
  const citySplitAt = Math.ceil(cityWords.length / 2);
  const cityLine1 = cityWords.slice(0, citySplitAt).join(" ");
  const cityLine2 = cityWords.slice(citySplitAt).join(" ");

  const vigencia = splitDateUpper(data.vigencia);
  const startPeriod = splitDateUpper(data.studentStartPeriod);
  const endPeriod = splitDateUpper(data.studentEndPeriod);
  const certificateDate = splitDateCapitalized(data.exp);

  // Case-insensitive: stored field values may have been uppercased by the
  // certificate-field save validator, which would otherwise break a literal
  // lowercase `.replace()` match against these placeholder tokens.
  const replacePlaceholder = (text: string, token: string, value: string) =>
    text.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), value);

  const processedLegalTop = [
    ["{totalSubjectsText}", totalSubjectsText],
    ["{totalSubjects}", totalSubjects.toString()],
    ["{dd}", certificateDate.dd],
    ["{monthName}", certificateDate.monthName],
    ["{yyyy}", certificateDate.yyyy],
  ].reduce((text, [token, value]) => replacePlaceholder(text, token, value), data.legalTop);

  // ---------------- Page 1 ----------------
  const page1 = `
    ${imageEl("{{logoMX}}", 9, 8, 28, 29)}
    ${textEl("N°: _________", 175, 30.2, 12, { font: "timesNewRoman", bold: true })}
    ${textEl(data.certificateNumber, 183, 30, 12, { font: "timesNewRoman", bold: true, color: "#c00" })}
    ${textEl("GOBIERNO CONSTITUCIONAL DEL ESTADO DE CHIAPAS", 105, 7, 12, { bold: true, align: "center" })}
    ${textEl("SECRETARÍA DE EDUCACIÓN ESTATAL", 105, 11, 12, { bold: true, align: "center" })}
    ${textEl("SUBSECRETARÍA DE EDUCACIÓN ESTATAL", 105, 15, 12, { bold: true, align: "center" })}
    ${textEl("DIRECCIÓN DE EDUCACIÓN SUPERIOR", 105, 22, 12, { bold: true, align: "center" })}
    ${textEl("DEPARTAMENTO DE SERVICIOS ESCOLARES", 105, 26, 12, { bold: true, align: "center" })}
    ${textEl(data.secl, 200, 12, 10, { align: "right" })}
    ${imageEl("{{pictureSize}}", 9, 45, 37, 50)}

    ${textEl("LA UNIVERSIDAD", 55, 43, 12)}
    ${textEl(`«${data.schoolName}»`, 91, 43, 12, { bold: true })}
    ${textEl("UBICADO EN LA CIUDAD DE", 131, 43, 9)}
    ${textEl(cityLine1, 175, 43, 9, { bold: true, underline: true })}
    ${textEl(cityLine2, 55, 50, 9, { bold: true, underline: true })}
    ${textEl("RÉGIMEN", 114, 50, 9)}
    ${textEl(`${data.regimen},`, 130, 50, 9, { bold: true, underline: true })}
    ${textEl("TURNO:", 181, 50, 9)}
    ${textEl(`${data.turno},`, 195, 50, 9, { bold: true, underline: true })}
    ${textEl("CLAVE:", 55, 57, 9)}
    ${textEl(`${data.clave},`, 68, 57, 12, { bold: true, underline: true })}
    ${textEl("MODALIDAD:", 97, 57, 9)}
    ${textEl(`${data.modalidad},`, 118, 57, 9, { bold: true, underline: true })}
    ${textEl("RVOE:", 131, 57, 12)}
    ${textEl("ACUERDO NUMERO:", 145, 57, 9)}
    ${textEl(`${data.rvoe},`, 178, 57, 12, { bold: true, underline: true })}
    ${textEl("VIGENTE: A PARTIR DEL", 55, 64, 9)}
    ${textEl(vigencia.dd, 95, 64, 9, { bold: true, underline: true })}
    ${textEl("DE", 100, 64, 9)}
    ${textEl(vigencia.monthName, 106, 64, 9, { bold: true, underline: true, align: "center", width: 19 })}
    ${textEl("DEL", 128, 64, 9)}
    ${textEl(vigencia.yyyy, 136, 64, 9, { bold: true, underline: true })}

    ${textEl("C E R T I F I C A", 55, 80, 12, { bold: true })}
    ${textEl("QUE EL (LA) C.", 89, 80, 9)}
    ${textEl(data.studentName, 113, 80, getNameFontSize(data.studentName), { font: "timesNewRoman" })}
    ${lineEl(113, 81, 92)}
    ${textEl("CON NÚMERO DE CONTROL", 55, 87, 9)}
    ${textEl(String(data.studentTuition), 115, 87, 12, { font: "timesNewRoman" })}
    ${lineEl(101, 88, 48)}
    ${textEl("ACREDITÓ", 152, 87, 12, { bold: true })}
    ${textEl("LAS MATERIAS QUE", 175, 87, 9)}
    ${textEl("INTEGRAN EL PLAN DE ESTUDIO DE LA", 55, 94, 9.5, { font: "arialNarrow" })}
    ${textEl(`${data.studentCareer},`, 108, 94, 13, { font: "sofiaBold", bold: true, align: "center", width: 87 })}
    ${textEl("EN EL", 197, 94, 9)}
    ${textEl("PERÍODO DE", 55, 101, 9)}
    ${textEl(startPeriod.monthName, 76, 101, 11, { font: "timesNewRoman", underline: true, align: "center", width: 24 })}
    ${textEl("DE", 104, 101, 9)}
    ${textEl(startPeriod.yyyy, 110, 101, 11, { font: "timesNewRoman", underline: true })}
    ${textEl("A", 121, 101, 9)}
    ${textEl(endPeriod.monthName, 125, 101, 11, { font: "timesNewRoman", underline: true, align: "center", width: 25 })}
    ${textEl("DE", 153, 101, 9)}
    ${textEl(endPeriod.yyyy, 159, 101, 11, { font: "timesNewRoman", underline: true })}
    ${textEl(",", 170, 101, 9)}
    ${textEl("CON LOS RESULTADOS", 171, 101, 9)}
    ${textEl("QUE A CONTINUACIÓN SE ANOTAN.", 55, 108, 9)}

    ${renderPeriodTable(data, { title: "PRIMER CUATRIMESTRE", x: 9, y: 120 }, 1)}
    ${renderPeriodTable(data, { title: "SEGUNDO CUATRIMESTRE", x: 110, y: 120 }, 2)}
    ${renderPeriodTable(data, { title: "TERCER CUATRIMESTRE", x: 9, y: 190 }, 3)}
    ${renderPeriodTable(data, { title: "CUARTO CUATRIMESTRE", x: 110, y: 190 }, 4)}
    ${renderPeriodTable(data, { title: "QUINTO CUATRIMESTRE", x: 9, y: 260 }, 5)}
    ${renderPeriodTable(data, { title: "SEXTO CUATRIMESTRE", x: 110, y: 260 }, 6)}

    ${textEl("Este documento no es válido si presenta raspaduras o enmendaduras.", 105, 328, 11, { font: "arialNarrow", align: "center" })}
  `;

  // ---------------- Page 2 ----------------
  const firstPairY = data.hasNinthPeriod ? 152 : 140;
  const firstPairNameY = data.hasNinthPeriod ? 179 : 165;
  const averageBoxY = data.hasNinthPeriod ? 137 : 74;
  const averageTextY = data.hasNinthPeriod ? 140.5 : 77.5;
  const firstPairLineY = data.hasNinthPeriod ? 174 : 160;

  const ninthPeriodBlock = data.hasNinthPeriod ? renderPeriodTable(data, { title: "NOVENO CUATRIMESTRE", x: 9, y: 74 }, 9) : "";

  const page2Top = `
    ${renderPeriodTable(data, { title: "SÉPTIMO CUATRIMESTRE", x: 9, y: 10 }, 7)}
    ${renderPeriodTable(data, { title: "OCTAVO CUATRIMESTRE", x: 110, y: 10 }, 8)}
    ${ninthPeriodBlock}

    ${imageEl("{{averageSquare}}", 9, averageBoxY, 96, 5)}
    ${textEl("PROMEDIO GENERAL:", 10, averageTextY, 9, { bold: true })}
    ${textEl(`${averageScore}  ( ${averageScoreText} )`, 55, averageTextY, 9, { font: "timesNewRoman", bold: true })}

    ${textEl(`${data.people[1].charge} «${data.schoolName}»`, 55, firstPairY, 9, { bold: true, align: "center", width: 60, whiteSpace: "normal", anchorAtCenter: true })}
    ${lineEl(10, firstPairLineY, 90)}
    ${textEl(data.people[1].name, 10, firstPairNameY, 10, { font: "timesNewRoman", align: "center", width: 90, whiteSpace: "normal" })}

    ${textEl(`${data.people[2].charge} «${data.schoolName}»`, 155, firstPairY, 9, { bold: true, align: "center", width: 50, whiteSpace: "normal", anchorAtCenter: true })}
    ${lineEl(110, firstPairLineY, 90)}
    ${textEl(data.people[2].name, 110, firstPairNameY, 10, { font: "timesNewRoman", align: "center", width: 90, whiteSpace: "normal" })}
  `;

  const page2Legal = `
    ${imageEl("{{square}}", 110, 74, 96, 50)}
    <div style="position:absolute; left:111.5mm; top:78mm; width:93mm; font-family:'${FONT_FAMILY.arial}'; font-size:10.7pt; text-align:justify; hyphens:auto;">${markupToHtml(processedLegalTop)}</div>

    ${textEl(data.people[3].charge, 55, 190, 9, { bold: true, align: "center", width: 60, whiteSpace: "normal", anchorAtCenter: true })}
    ${lineEl(10, 210, 90)}
    ${textEl(data.people[3].name, 10, 215, 10, { font: "timesNewRoman", align: "center", width: 90, whiteSpace: "normal" })}

    ${textEl(data.people[4].charge, 155, 190, 9, { bold: true, align: "center", width: 50, whiteSpace: "normal", anchorAtCenter: true })}
    ${lineEl(110, 210, 90)}
    ${textEl(data.people[4].name, 110, 215, 10, { font: "timesNewRoman", align: "center", width: 90, whiteSpace: "normal" })}

    ${imageEl("{{scholarServicesTable}}", 10, 230, 60, 95)}
    ${textEl("REGISTRADO EN EL DEPARTAMENTO DE SERVICIOS ESCOLARES", 40, 235.5, 8.5, { align: "center", width: 60, whiteSpace: "normal", anchorAtCenter: true })}
    ${textEl("CON Nº:", 12, 252, 10)}
    ${textEl("EN EL LIBRO:", 12, 262, 10)}
    ${textEl("FOJA:", 12, 272, 10)}
    ${textEl("FECHA:", 12, 282, 10)}
    ${lineEl(40, 252.5, 18)}
    ${lineEl(40, 262.5, 18)}
    ${lineEl(40, 272.5, 18)}
    ${lineEl(40, 282.5, 18)}
    ${textEl("C O T E J Ó:", 30, 293, 9, { bold: true })}
    ${textEl(data.people[7].name, 12, 302, 8, { font: "timesNewRoman", align: "center", width: 56 })}
    ${textEl(data.people[5].charge, 27, 312, 9)}
    ${textEl(data.people[5].name, 12, 320, 8, { font: "timesNewRoman", align: "center", width: 56 })}

    <div id="legal-paragraphs" style="position:absolute; left:110mm; top:235mm; width:95mm; font-family:'${FONT_FAMILY.arial}'; font-size:10pt;">
      <p style="margin:0 0 4.5mm 0; text-align:justify; hyphens:auto;">${markupToHtml(data.legal1)}</p>
      <p style="margin:0; text-align:justify; hyphens:auto;">${markupToHtml(data.legal2)}</p>
    </div>

    <div id="closing-signatures" style="position:absolute; left:110mm; top:285mm; width:95mm; font-family:'${FONT_FAMILY.timesNewRoman}'; font-size:10pt;">
      <div style="text-align:center;">${escapeHtml(data.people[4].name)}</div>
      <div style="border-bottom:0.3mm solid #000; margin:1mm 0 11mm 0;"></div>
      <div style="font-family:'${FONT_FAMILY.arial}'; font-size:8pt;">TUXTLA GUTIÉRREZ, CHIAPAS; A ______________________</div>
      <div style="margin-top:8mm; font-family:'${FONT_FAMILY.arial}'; font-size:9pt; text-align:center;">${escapeHtml(data.people[6].charge)}</div>
      <div style="border-bottom:0.3mm solid #000; margin:1mm 0;"></div>
      <div style="text-align:center;">${escapeHtml(data.people[6].name)}</div>
    </div>
  `;

  const fontFaces = Object.entries(fonts)
    .map(([key, dataUri]) => {
      const isBold = key.endsWith("Bold") && key !== "sofiaBold";
      const weight = key === "sofiaBold" || isBold ? 700 : 400;
      return `@font-face { font-family: '${FONT_FAMILY[toFontKey(key)]}'; font-weight: ${weight}; src: url(${dataUri}) format('truetype'); }`;
    })
    .join("\n");

  const imageTags = Object.entries(images).reduce<Record<string, string>>((acc, [key, uri]) => {
    acc[key] = uri;
    return acc;
  }, {});

  let page1Html = page1;
  let page2Html = page2Top + page2Legal;
  for (const [key, uri] of Object.entries(imageTags)) {
    page1Html = page1Html.split(`{{${key}}}`).join(uri);
    page2Html = page2Html.split(`{{${key}}}`).join(uri);
  }

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  ${fontFaces}
  * { box-sizing: border-box; }
  @page { size: 215.9mm 343mm; margin: 0; }
  body { margin: 0; color: #000; }
  .page { position: relative; width: 215.9mm; height: 343mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
</style>
</head>
<body>
  <div class="page">${page1Html}</div>
  <div class="page">${page2Html}</div>
</body>
</html>`;
}

function toFontKey(key: string): FontKey {
  if (key === "arial" || key === "arialBold") return "arial";
  if (key === "arialNarrow" || key === "arialNarrowBold") return "arialNarrow";
  if (key === "timesNewRoman" || key === "timesNewRomanBold") return "timesNewRoman";
  return "sofiaBold";
}
