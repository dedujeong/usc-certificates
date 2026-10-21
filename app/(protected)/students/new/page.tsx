"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Box, Button, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { studentsApi } from "@/lib/api/students";
import { studentCareersApi } from "@/lib/api/studentCareers";
import { careersApi } from "@/lib/api/careers";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";

export default function NewStudentPage() {
  const router = useRouter();
  const { data: careers = [] } = useQuery({ queryKey: queryKeys.careers, queryFn: careersApi.list });
  const { data: nextTuition } = useQuery({
    queryKey: ["students", "next-tuition"],
    queryFn: studentsApi.nextTuition,
  });

  const [form, setForm] = useState({
    firstName: "",
    paternalName: "",
    maternalName: "",
    careerId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const student = await studentsApi.create({
        firstName: form.firstName,
        paternalName: form.paternalName || undefined,
        maternalName: form.maternalName || undefined,
      });
      if (form.careerId && form.endDate) {
        await studentCareersApi.create({
          studentId: student.id,
          careerId: Number(form.careerId),
          startDate: form.startDate,
          endDate: form.endDate,
        });
      }
      setAlert({ message: `Alumno registrado con matrícula ${student.tuition}`, severity: "success" });
      router.push("/students");
    } catch (err) {
      setAlert({ message: err instanceof ApiError ? err.message : "Error al registrar", severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 2, mb: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Registrar alumno
        </Typography>
        {nextTuition && (
          <Typography variant="caption" color="text.secondary">
            Siguiente matrícula sugerida: {nextTuition.tuition} (se asigna de forma atómica al guardar)
          </Typography>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField label="Nombre(s)" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <TextField
            label="Apellido paterno"
            value={form.paternalName}
            onChange={(e) => setForm({ ...form, paternalName: e.target.value })}
          />
          <TextField
            label="Apellido materno"
            value={form.maternalName}
            onChange={(e) => setForm({ ...form, maternalName: e.target.value })}
          />
          <TextField
            select
            label="Carrera (opcional, inscribe de una vez)"
            value={form.careerId}
            onChange={(e) => setForm({ ...form, careerId: e.target.value })}
          >
            <MenuItem value="">Sin inscribir por ahora</MenuItem>
            {careers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          {form.careerId && (
            <>
              <TextField
                label="Fecha de inicio"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha de término"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
          <Button variant="contained" onClick={handleSubmit} disabled={!form.firstName.trim() || isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </Paper>
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
