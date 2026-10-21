import jsPDF from "jspdf";

/**
 * Hand-rolled rich-text layout engine, ported as-is from the old system's
 * certificatePDF.ts (`drawFormattedText`). It implements a small markup
 * language (`*bold*`, `_underline_`) with manual line-wrap/justify logic.
 * Left untouched intentionally — it's already visually validated against
 * the official certificate format, and reimplementing it risks
 * reintroducing subtle alignment bugs for an uncertain benefit.
 */

export function calculateTextWidth(doc: jsPDF, text: string): number {
  return doc.getTextWidth(text);
}

export function addTextWithUnderscores(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  additionalSpaces: number = 0,
) {
  const textWidth = calculateTextWidth(doc, text);

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  const underscoreWidth = calculateTextWidth(doc, "_");

  const totalUnderscores = Math.ceil(textWidth / underscoreWidth + additionalSpaces);
  const underscores = "_".repeat(totalUnderscores);

  doc.text(underscores, x, y);
}

export function getCenteredX(doc: jsPDF, text: string, xStart: number, xEnd: number): number {
  const textWidth = doc.getTextWidth(text);
  return xStart + (xEnd - xStart - textWidth) / 2;
}

export function drawFormattedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const parts = text
    .trim()
    .split(/(\*.*?\*)|(_.*?_)/g)
    .filter(Boolean);
  const allTokens: {
    text: string;
    width: number;
    isBold: boolean;
    isUnderline: boolean;
    isSpace: boolean;
  }[] = [];

  parts.forEach((part) => {
    const isBold = part.startsWith("*") && part.endsWith("*");
    const isUnderline = part.startsWith("_") && part.endsWith("_");
    let textContent = part;
    if (isBold || isUnderline) {
      textContent = part.slice(1, -1);
    }

    doc.setFont("Arial", isBold ? "bold" : "normal");

    const subTokens = textContent.split(/(\s+)/).filter(Boolean);
    subTokens.forEach((subToken) => {
      allTokens.push({
        text: subToken,
        width: doc.getTextWidth(subToken),
        isBold,
        isUnderline,
        isSpace: /^\s+$/.test(subToken),
      });
    });
  });

  const renderLine = (lineToRender: typeof allTokens, justify: boolean) => {
    while (lineToRender.length > 0 && lineToRender[lineToRender.length - 1].isSpace) {
      lineToRender.pop();
    }
    const words = lineToRender.filter((t) => !t.isSpace);
    if (words.length === 0) return;

    let currentX = x;
    const renderToken = (token: (typeof allTokens)[0], posX: number) => {
      doc.setFont("Arial", token.isBold ? "bold" : "normal");
      doc.text(token.text, posX, currentY);
      if (token.isUnderline) {
        const lineY = currentY + 1;
        doc.line(posX, lineY, posX + token.width, lineY);
      }
    };

    if (!justify || words.length <= 1) {
      lineToRender.forEach((token) => {
        renderToken(token, currentX);
        currentX += token.width;
      });
      return;
    }

    const totalWordWidth = words.reduce((acc, w) => acc + w.width, 0);
    const spaceSlots = lineToRender.filter((t) => t.isSpace).length;

    if (spaceSlots === 0) {
      renderLine(lineToRender, false);
      return;
    }

    const totalSpacing = maxWidth - totalWordWidth;
    const spaceWidth = totalSpacing / spaceSlots;

    lineToRender.forEach((token) => {
      renderToken(token, currentX);
      currentX += token.isSpace ? spaceWidth : token.width;
    });
  };

  let line: typeof allTokens = [];
  let currentY = y;
  let currentWidth = 0;

  for (let i = 0; i < allTokens.length; i++) {
    const token = allTokens[i];
    if (currentWidth + token.width > maxWidth && !token.isSpace) {
      renderLine(line, true);
      line = [token];
      currentWidth = token.width;
      currentY += lineHeight;
    } else {
      line.push(token);
      currentWidth += token.width;
    }
  }

  if (line.length > 0) {
    renderLine(line, false);
  }

  return currentY;
}
