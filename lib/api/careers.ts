import { api } from "./apiClient";

export interface Career {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const careersApi = {
  list: () => api.get<Career[]>("/api/careers"),
  create: (name: string) => api.post<Career>("/api/careers", { name }),
  update: (id: number, data: Partial<Pick<Career, "name" | "isActive">>) =>
    api.put<Career>(`/api/careers/${id}`, data),
  softDelete: (id: number) => api.delete<Career>(`/api/careers/${id}`),
};
