import { describe, it, expect } from "vitest";
import { markupToHtml } from "@/certificate/html/markup";
import { translateAverageToWords, numberToSpanishWords, splitDateUpper } from "@/certificate/render/helpers";

describe("certificate markup (markupToHtml)", () => {
  it("renders *bold* segments as <strong>", () => {
    expect(markupToHtml("normal *bold* normal")).toBe("normal <strong>bold</strong> normal");
  });

  it("renders _underline_ segments as <u>", () => {
    expect(markupToHtml("_underlined_")).toBe("<u>underlined</u>");
  });

  it("handles mixed bold and underline in the same string", () => {
    expect(markupToHtml("*bold* and _underlined_")).toBe("<strong>bold</strong> and <u>underlined</u>");
  });

  it("escapes HTML-significant characters so stored text can't inject markup", () => {
    expect(markupToHtml("A & B <script>")).toBe("A &amp; B &lt;script&gt;");
  });

  it("leaves plain text untouched", () => {
    expect(markupToHtml("plain text")).toBe("plain text");
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
