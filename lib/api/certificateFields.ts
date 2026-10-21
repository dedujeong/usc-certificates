import { api } from "./apiClient";

export interface CertificateField {
  id: number;
  name: string;
  value: string;
  // Only meaningful for LEGAL_1/LEGAL_2 — see certificate/html/template.ts.
  fontFamily: string | null;
  lineHeight: number | null;
}

export const certificateFieldsApi = {
  list: () => api.get<CertificateField[]>("/api/certificate-fields"),
  create: (data: { name: string; value: string; fontFamily?: string | null; lineHeight?: number | null }) =>
    api.post<CertificateField>("/api/certificate-fields", data),
  update: (id: number, data: Partial<{ name: string; value: string; fontFamily: string | null; lineHeight: number | null }>) =>
    api.put<CertificateField>(`/api/certificate-fields/${id}`, data),
  remove: (id: number) => api.delete<CertificateField>(`/api/certificate-fields/${id}`),
};
