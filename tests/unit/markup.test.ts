import { describe, it, expect } from "vitest";
import { drawFormattedText } from "@/certificate/render/markup";
import { translateAverageToWords, numberToSpanishWords, splitDateUpper } from "@/certificate/render/helpers";

// Minimal fake jsPDF: enough to exercise drawFormattedText's tokenizing,
// wrapping and bold/underline handling without a real PDF canvas. Records
// every text() call so assertions can check what actually got rendered.
function createFakeDoc() {
  const calls: { text: string; x: number; y: number }[] = [];
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let currentFont = { family: "Arial", style: "normal" };

  return {
    calls,
    lines,
    setFont(family: string, style: string) {
      currentFont = { family, style };
    },
    getTextWidth(text: string) {
      // Fixed-width approximation: enough to make wrapping deterministic.
      return text.length * 2;
    },
    text(text: string, x: number, y: number) {
      calls.push({ text, x, y });
    },
    line(x1: number, y1: number, x2: number, y2: number) {
      lines.push({ x1, y1, x2, y2 });
    },
  };
}

describe("certificate markup engine (drawFormattedText)", () => {
  it("renders bold segments marked with *asterisks*", () => {
    const doc = createFakeDoc();
    drawFormattedText(doc as never, "normal *bold* normal", 0, 0, 1000, 5);

    const rendered = doc.calls.map((c) => c.text).join("");
    expect(rendered).toContain("bold");
    expect(rendered).toContain("normal");
  });

  it("draws an underline for segments marked with _underscores_", () => {
    const doc = createFakeDoc();
    drawFormattedText(doc as never, "_underlined_", 0, 0, 1000, 5);

    expect(doc.lines.length).toBeGreaterThan(0);
  });

  it("wraps to a new line when content exceeds maxWidth", () => {
    const doc = createFakeDoc();
    const finalY = drawFormattedText(doc as never, "one two three four five six seven", 0, 0, 20, 5);

    // Multiple lines means the Y cursor advanced beyond the starting line.
    expect(finalY).toBeGreaterThan(0);
  });
});

describe("certificate text helpers", () => {
  it("translates a truncated average to Spanish words", () => {
    expect(translateAverageToWords("8.5")).toBe("Ocho punto cinco");
    expect(translateAverageToWords("10.0")).toBe("Diez punto cero");
  });

  it("translates small counts to Spanish words", () => {
    expect(numberToSpanishWords(0)).toBe("cero");
    expect(numberToSpanishWords(21)).toBe("veinte y uno");
    expect(numberToSpanishWords(100)).toBe("número fuera de rango");
  });

  it("splits an ISO date into day/month-name/year (uppercase)", () => {
    expect(splitDateUpper("2024-03-15")).toEqual({ yyyy: "2024", mm: "03", dd: "15", monthName: "MARZO" });
  });
});
