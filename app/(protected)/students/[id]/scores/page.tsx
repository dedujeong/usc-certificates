"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Chip, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { studentsApi } from "@/lib/api/students";
import { studentCareersApi } from "@/lib/api/studentCareers";
import { subjectsApi } from "@/lib/api/subjects";
import { scoresApi, Score, ScoreObservation } from "@/lib/api/scores";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

const OBSERVATIONS: ScoreObservation[] = ["EX", "TS", "EQ", "REC"];

export default function StudentScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);
  const queryClient = useQueryClient();

  const { data: student } = useQuery({ queryKey: queryKeys.student(studentId), queryFn: () => studentsApi.getById(studentId) });
  const { data: activeCareer } = useQuery({
    queryKey: ["student-careers", "active", studentId],
    queryFn: () => studentCareersApi.activeByStudent(studentId),
    retry: false,
  });
  const { data: subjects = [] } = useQuery({
    queryKey: queryKeys.subjectsByCareer(activeCareer?.careerId ?? 0),
    queryFn: () => subjectsApi.byCareer(activeCareer!.careerId),
    enabled: !!activeCareer,
  });
  const { data: scores = [] } = useQuery({
    queryKey: queryKeys.scoresByStudent(studentId),
    queryFn: () => scoresApi.byStudent(studentId),
  });

  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const upsertMutation = useMutation({
    mutationFn: ({ subjectId, value, observation }: { subjectId: number; value: string; observation: ScoreObservation | "" }) => {
      const existing = scores.find((s: Score) => s.subjectId === subjectId);
      const payload = { value: Number(value), observation: observation || undefined };
      return existing ? scoresApi.update(existing.id, payload) : scoresApi.create({ studentId, subjectId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scoresByStudent(studentId) });
      setAlert({ message: "Calificación guardada", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al guardar", severity: "error" }),
  });

  const average =
    scores.length > 0
      ? Math.floor((scores.reduce((sum, s) => sum + Number(s.value), 0) / scores.length) * 10) / 10
      : null;

  const columns: GridColDef[] = [
    { field: "name", headerName: "Materia", flex: 1 },
    { field: "period", headerName: "Periodo", width: 100, align: "center", headerAlign: "center" },
    {
      field: "value",
      headerName: "Calificación",
      width: 150,
      renderCell: (params) => {
        const existing = scores.find((s: Score) => s.subjectId === params.row.id);
        return (
          <TextField
            size="small"
            type="number"
            slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
            defaultValue={existing?.value ?? ""}
            onBlur={(e) =>
              e.target.value &&
              upsertMutation.mutate({ subjectId: params.row.id, value: e.target.value, observation: existing?.observation ?? "" })
            }
          />
        );
      },
    },
    {
      field: "observation",
      headerName: "Observación",
      width: 160,
      renderCell: (params) => {
        const existing = scores.find((s: Score) => s.subjectId === params.row.id);
        return (
          <TextField
            select
            size="small"
            fullWidth
            value={existing?.observation ?? ""}
            onChange={(e) =>
              existing && upsertMutation.mutate({ subjectId: params.row.id, value: existing.value, observation: e.target.value as ScoreObservation })
            }
            disabled={!existing}
          >
            <MenuItem value="">—</MenuItem>
            {OBSERVATIONS.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </TextField>
        );
      },
    },
  ];

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Calificaciones"
        subtitle={student ? `${student.firstName} ${student.paternalName ?? ""} — Matrícula ${student.tuition}` : undefined}
        action={
          activeCareer && average !== null ? (
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Promedio general
              </Typography>
              <Chip label={average} color="secondary" sx={{ fontSize: 18, px: 1, height: 36 }} />
            </Box>
          ) : undefined
        }
      />

      {!activeCareer && (
        <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
          <Typography color="text.secondary">Este alumno no tiene una inscripción activa a ninguna carrera.</Typography>
        </Paper>
      )}

      {activeCareer && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Carrera: {activeCareer.career?.name}
          </Typography>
          <DataTableCard rows={subjects} columns={columns} getRowId={(r) => r.id} hideFooter hideSearch emptyLabel="Esta carrera no tiene materias registradas" />
        </>
      )}
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
