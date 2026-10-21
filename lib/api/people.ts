import { api } from "./apiClient";

export interface Person {
  id: number;
  prefix: string | null;
  name: string;
  charge: string;
  gender: "male" | "female";
}

export const peopleApi = {
  list: () => api.get<Person[]>("/api/people"),
  create: (data: { prefix?: string; name: string; charge: string; gender: "male" | "female" }) =>
    api.post<Person>("/api/people", data),
  update: (id: number, data: Partial<{ prefix: string; name: string; charge: string; gender: "male" | "female" }>) =>
    api.put<Person>(`/api/people/${id}`, data),
  remove: (id: number) => api.delete<Person>(`/api/people/${id}`),
};
