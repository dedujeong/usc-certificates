// Converts the *bold*/_underline_ markup staff write via LegalTextField
// (see components/certificate/LegalTextField.tsx) into real HTML. Unlike
// the old jsPDF-based renderer (certificate/render/markup.ts, now removed),
// this doesn't need a hand-rolled word-wrap/justify engine — the browser's
// own text layout (text-align: justify + hyphens: auto) handles that, which
// is the actual typography improvement over the previous implementation.
export function markupToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .split(/(\*.*?\*)|(_.*?_)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return `<strong>${part.slice(1, -1)}</strong>`;
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return `<u>${part.slice(1, -1)}</u>`;
      }
      return part;
    })
    .join("");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
