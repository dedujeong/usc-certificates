export const queryKeys = {
  careers: ["careers"] as const,
  subjects: ["subjects"] as const,
  subjectsByCareer: (careerId: number) => ["subjects", "by-career", careerId] as const,
  students: ["students"] as const,
  student: (id: number) => ["students", id] as const,
  administrators: ["administrators"] as const,
  scoresByStudent: (studentId: number) => ["scores", "by-student", studentId] as const,
  certificateData: (studentId: number) => ["certificate", "data", studentId] as const,
};
