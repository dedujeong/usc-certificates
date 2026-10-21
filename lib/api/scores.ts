import { api } from "./apiClient";
import { Subject } from "./subjects";

export type ScoreObservation = "EX" | "TS" | "EQ" | "REC";

export interface Score {
  id: number;
  studentId: number;
  subjectId: number;
  value: string; // Prisma Decimal serializes as a numeric string, e.g. "7.5"
  observation: ScoreObservation | null;
  isActive: boolean;
  subject?: Subject;
}

export const scoresApi = {
  byStudent: (studentId: number) => api.get<Score[]>(`/api/scores/by-student/${studentId}`),
  create: (data: { studentId: number; subjectId: number; value: number; observation?: ScoreObservation }) =>
    api.post<Score>("/api/scores", data),
  update: (id: number, data: Partial<{ value: number; observation: ScoreObservation | null; isActive: boolean }>) =>
    api.put<Score>(`/api/scores/${id}`, data),
  softDelete: (id: number) => api.delete<Score>(`/api/scores/${id}`),
};
