import { api } from "@/lib/api/apiClient";
import { CertificateData } from "./render/types";

export type CertificateDataBase = Omit<CertificateData, "certificateNumber" | "exp">;

export function fetchCertificateData(studentId: number) {
  return api.get<CertificateDataBase>(`/api/certificate/data/${studentId}`);
}
