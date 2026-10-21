import { api } from "./apiClient";

export interface Administrator {
  id: number;
  firstName: string;
  paternalName: string | null;
  maternalName: string | null;
  userId: number;
  isActive: boolean;
  user: { id: number; email: string; role: "admin" | "superAdmin"; isActive: boolean };
}

export const administratorsApi = {
  list: () => api.get<Administrator[]>("/api/administrators"),
  create: (data: {
    firstName: string;
    paternalName?: string;
    maternalName?: string;
    email: string;
    password: string;
    role: "admin" | "superAdmin";
  }) => api.post<Administrator>("/api/administrators", data),
  update: (
    id: number,
    data: Partial<{
      firstName: string;
      paternalName: string;
      maternalName: string;
      role: "admin" | "superAdmin";
      isActive: boolean;
    }>,
  ) => api.put<Administrator>(`/api/administrators/${id}`, data),
  softDelete: (id: number) => api.delete<Administrator>(`/api/administrators/${id}`),
};
