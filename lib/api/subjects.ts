import { api } from "./apiClient";
import { Career } from "./careers";

export interface Subject {
  id: number;
  careerId: number;
  name: string;
  period: number;
  isActive: boolean;
  career?: Career;
}

export const subjectsApi = {
  list: () => api.get<Subject[]>("/api/subjects"),
  byCareer: (careerId: number) => api.get<Subject[]>(`/api/subjects/career/${careerId}`),
  create: (data: { careerId: number; name: string; period: number }) =>
    api.post<Subject>("/api/subjects", data),
  update: (id: number, data: Partial<{ name: string; period: number; isActive: boolean }>) =>
    api.put<Subject>(`/api/subjects/${id}`, data),
  softDelete: (id: number) => api.delete<Subject>(`/api/subjects/${id}`),
};
