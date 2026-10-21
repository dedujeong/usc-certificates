"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { studentsApi, Student } from "@/lib/api/students";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: queryKeys.students,
    queryFn: studentsApi.list,
  });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? studentsApi.update(id, { isActive: true }) : studentsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  const columns: GridColDef<Student>[] = [
    { field: "tuition", headerName: "Matrícula", width: 120 },
    { field: "firstName", headerName: "Nombre", flex: 1 },
    { field: "paternalName", headerName: "Apellido paterno", flex: 1 },
    { field: "maternalName", headerName: "Apellido materno", flex: 1 },
    { field: "isActive", headerName: "Activo", width: 90, renderCell: (p) => (p.value ? "Sí" : "No") },
    {
      field: "actions",
      headerName: "Acciones",
      width: 320,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" component={Link} href={`/students/${params.row.id}/scores`}>
            Calificaciones
          </Button>
          <Button size="small" component={Link} href={`/students/${params.row.id}/certificate`}>
            Certificado
          </Button>
          <Button
            size="small"
            color={params.row.isActive ? "error" : "success"}
            onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
          >
            {params.row.isActive ? "Baja" : "Reactivar"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Alumnos</Typography>
        <Button variant="contained" component={Link} href="/students/new">
          Nuevo alumno
        </Button>
      </Box>
      <DataGrid rows={students} columns={columns} loading={isLoading} autoHeight disableRowSelectionOnClick getRowId={(r) => r.id} />
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
