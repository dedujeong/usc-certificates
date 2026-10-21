"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Container, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { administratorsApi, Administrator } from "@/lib/api/administrators";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import RequireRole from "@/components/ProtectedRoute";

function AdministratorsContent() {
  const queryClient = useQueryClient();
  const { data: administrators = [], isLoading } = useQuery({
    queryKey: queryKeys.administrators,
    queryFn: administratorsApi.list,
  });
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? administratorsApi.update(id, { isActive: true }) : administratorsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.administrators });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  const columns: GridColDef<Administrator>[] = [
    { field: "firstName", headerName: "Nombre", flex: 1 },
    { field: "email", headerName: "Correo", flex: 1, valueGetter: (_, row) => row.user.email },
    { field: "role", headerName: "Rol", width: 130, valueGetter: (_, row) => row.user.role },
    { field: "isActive", headerName: "Activo", width: 90, renderCell: (p) => (p.value ? "Sí" : "No") },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          color={params.row.isActive ? "error" : "success"}
          onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
        >
          {params.row.isActive ? "Baja" : "Reactivar"}
        </Button>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Administradores</Typography>
        <Button variant="contained" component={Link} href="/administradores/new">
          Nuevo administrador
        </Button>
      </Box>
      <DataGrid rows={administrators} columns={columns} loading={isLoading} autoHeight disableRowSelectionOnClick getRowId={(r) => r.id} />
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}

export default function AdministratorsPage() {
  return (
    <RequireRole role="superAdmin">
      <AdministratorsContent />
    </RequireRole>
  );
}
