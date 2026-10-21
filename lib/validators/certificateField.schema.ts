import { z } from "zod";

// These fields hold free-form legal paragraphs with embedded {placeholder}
// tokens and natural sentence casing — unlike short admin codes (RÉGIMEN,
// TURNO, CLAVE...), their value must not be forced to uppercase or the
// lowercase placeholder tokens stop matching at substitution time.
const PRESERVE_CASE_FIELDS = new Set(["LEGAL_TOP", "LEGAL_1", "LEGAL_2"]);

// Keys of certificate/html/template.ts's FONT_FAMILY that make sense as
// body text for a legal paragraph (sofiaBold has no regular weight, so
// it's excluded here even though the template embeds it).
const LEGAL_FONT_FAMILIES = ["arial", "arialNarrow", "timesNewRoman"] as const;

const typographyFields = {
  fontFamily: z.enum(LEGAL_FONT_FAMILIES).nullable().optional(),
  lineHeight: z.number().min(1).max(3).nullable().optional(),
};

export const certificateFieldCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).transform((v) => v.toUpperCase()),
    value: z.string().trim().min(1),
    ...typographyFields,
  })
  .transform((data) => ({
    ...data,
    value: PRESERVE_CASE_FIELDS.has(data.name) ? data.value : data.value.toUpperCase(),
  }));

export const certificateFieldUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).transform((v) => v.toUpperCase()).optional(),
    value: z.string().trim().min(1).optional(),
    ...typographyFields,
  })
  .transform((data) => ({
    ...data,
    value:
      data.value === undefined
        ? undefined
        : data.name && PRESERVE_CASE_FIELDS.has(data.name)
          ? data.value
          : data.value.toUpperCase(),
  }));

export type CertificateFieldCreateInput = z.infer<typeof certificateFieldCreateSchema>;
export type CertificateFieldUpdateInput = z.infer<typeof certificateFieldUpdateSchema>;
