"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Chip, Container } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { administratorsApi, Administrator } from "@/lib/api/administrators";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import RequireRole from "@/components/ProtectedRoute";
import StatusChip from "@/components/StatusChip";
import PageHeader from "@/components/PageHeader";
import DataTableCard from "@/components/DataTableCard";

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
    {
      field: "role",
      headerName: "Rol",
      width: 150,
      valueGetter: (_, row) => row.user.role,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === "superAdmin" ? "Super admin" : "Admin"}
          variant={params.value === "superAdmin" ? "filled" : "outlined"}
          color={params.value === "superAdmin" ? "secondary" : "default"}
        />
      ),
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 130,
      renderCell: (p) => <StatusChip active={p.value} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 150,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          color={params.row.isActive ? "error" : "success"}
          onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
        >
          {params.row.isActive ? "Baja" : "Reactivar"}
        </Button>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title="Administradores"
        subtitle="Cuentas con acceso al sistema y sus roles"
        action={
          <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/administradores/new">
            Nuevo administrador
          </Button>
        }
      />
      <DataTableCard
        rows={administrators}
        columns={columns}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyLabel="No hay administradores registrados todavía"
      />
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
