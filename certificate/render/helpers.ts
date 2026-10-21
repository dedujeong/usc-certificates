// Small text-generation helpers for the certificate, ported as-is from the
// old certificatePDF.ts (translateNumberToWords, numberToString, date
// formatting). These are self-contained and easy to unit test.

const DIGIT_WORDS: Record<number, string> = {
  0: "Cero",
  1: "Uno",
  2: "Dos",
  3: "Tres",
  4: "Cuatro",
  5: "Cinco",
  6: "Seis",
  7: "Siete",
  8: "Ocho",
  9: "Nueve",
  10: "Diez",
};

export function translateNumberToWords(num: number): string {
  return DIGIT_WORDS[num] || "";
}

const LOWER_DIGIT_WORDS: Record<number, string> = {
  0: "cero",
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
};

export function translateAverageToWords(numStr: string): string {
  const [wholePart, decimalPart] = numStr.split(".");
  let words = "";

  if (parseInt(wholePart) in LOWER_DIGIT_WORDS) {
    words += LOWER_DIGIT_WORDS[parseInt(wholePart)];
  } else {
    words += "número fuera de rango";
  }

  if (decimalPart) {
    words += " punto ";
    for (const digit of decimalPart) {
      words += LOWER_DIGIT_WORDS[parseInt(digit)] + " ";
    }
  }

  return words.charAt(0).toUpperCase() + words.slice(1).trim();
}

export function numberToSpanishWords(num: number): string {
  const unidades = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const especiales = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];
  const decenas = ["veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

  if (num < 0 || num > 99) return "número fuera de rango";
  if (num === 0) return unidades[0];
  if (num >= 1 && num <= 9) return unidades[num];
  if (num >= 10 && num <= 19) return especiales[num - 10];
  if (num % 10 === 0 && num <= 90) return decenas[Math.floor(num / 10) - 2];
  if (num >= 21 && num <= 99) {
    return `${decenas[Math.floor(num / 10) - 2]} y ${unidades[num % 10]}`;
  }
  return "";
}

export function getNameFontSize(name: string): number {
  const referenceName = "SEBASTIAN ALEXANDER HERNANDEZ PANIAGUA";
  return name.length >= referenceName.length ? 11 : 12;
}

const MONTH_NAMES_UPPER = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

const MONTH_NAMES_CAPITALIZED = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function splitDate(date: string, monthNames: string[]) {
  const [yyyy, mm, dd] = date.split("-");
  return { yyyy, mm, dd, monthName: monthNames[parseInt(mm) - 1] };
}

export const splitDateUpper = (date: string) => splitDate(date, MONTH_NAMES_UPPER);
export const splitDateCapitalized = (date: string) => splitDate(date, MONTH_NAMES_CAPITALIZED);
