import { api } from "./apiClient";

export interface Student {
  id: number;
  tuition: number;
  firstName: string;
  paternalName: string | null;
  maternalName: string | null;
  isActive: boolean;
}

export const studentsApi = {
  list: () => api.get<Student[]>("/api/students"),
  getById: (id: number) => api.get<Student>(`/api/students/${id}`),
  nextTuition: () => api.get<{ tuition: number }>("/api/students/next-tuition"),
  create: (data: { firstName: string; paternalName?: string; maternalName?: string }) =>
    api.post<Student>("/api/students", data),
  update: (id: number, data: Partial<Pick<Student, "tuition" | "firstName" | "paternalName" | "maternalName" | "isActive">>) =>
    api.put<Student>(`/api/students/${id}`, data),
  softDelete: (id: number) => api.delete<Student>(`/api/students/${id}`),
};
