import { api } from "./apiClient";

export interface CertificateField {
  id: number;
  name: string;
  value: string;
}

export const certificateFieldsApi = {
  list: () => api.get<CertificateField[]>("/api/certificate-fields"),
  create: (data: { name: string; value: string }) => api.post<CertificateField>("/api/certificate-fields", data),
  update: (id: number, data: Partial<{ name: string; value: string }>) =>
    api.put<CertificateField>(`/api/certificate-fields/${id}`, data),
  remove: (id: number) => api.delete<CertificateField>(`/api/certificate-fields/${id}`),
};
