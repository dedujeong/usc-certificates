import { api } from "./apiClient";
import { Student } from "./students";
import { Career } from "./careers";

export interface StudentCareer {
  id: number;
  studentId: number;
  careerId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  student?: Student;
  career?: Career;
}

export const studentCareersApi = {
  list: () => api.get<StudentCareer[]>("/api/student-careers"),
  activeByStudent: (studentId: number) =>
    api.get<StudentCareer>(`/api/student-careers/active/${studentId}`),
  create: (data: { studentId: number; careerId: number; startDate: string; endDate: string }) =>
    api.post<StudentCareer>("/api/student-careers", data),
  update: (id: number, data: Partial<{ startDate: string; endDate: string; isActive: boolean }>) =>
    api.put<StudentCareer>(`/api/student-careers/${id}`, data),
  softDelete: (id: number) => api.delete<StudentCareer>(`/api/student-careers/${id}`),
};
