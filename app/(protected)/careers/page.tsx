"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { careersApi, Career } from "@/lib/api/careers";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import StatusChip from "@/components/StatusChip";

export default function CareersPage() {
  const queryClient = useQueryClient();
  const { data: careers = [], isLoading } = useQuery({
    queryKey: queryKeys.careers,
    queryFn: careersApi.list,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [name, setName] = useState("");
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  }

  function openEdit(career: Career) {
    setEditing(career);
    setName(career.name);
    setDialogOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (payload: string) => careersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      setAlert({ message: "Carrera creada", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al crear", severity: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => careersApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      setAlert({ message: "Carrera actualizada", severity: "success" });
      setDialogOpen(false);
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar", severity: "error" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? careersApi.update(id, { isActive: true }) : careersApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      setAlert({ message: "Estado actualizado", severity: "success" });
    },
    onError: (err) => setAlert({ message: err instanceof ApiError ? err.message : "Error al actualizar estado", severity: "error" }),
  });

  function handleSubmit() {
    if (editing) {
      updateMutation.mutate({ id: editing.id, name });
    } else {
      createMutation.mutate(name);
    }
  }

  const columns: GridColDef<Career>[] = [
    { field: "name", headerName: "Carrera", flex: 1 },
    {
      field: "isActive",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => <StatusChip active={params.value} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 220,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", width: "100%" }}>
          <Button size="small" variant="outlined" onClick={() => openEdit(params.row)}>
            Editar
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={params.row.isActive ? "error" : "success"}
            onClick={() => toggleActiveMutation.mutate({ id: params.row.id, isActive: !params.row.isActive })}
          >
            {params.row.isActive ? "Dar de baja" : "Reactivar"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 5, mb: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Carreras
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Catálogo de carreras ofrecidas por la universidad
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva carrera
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <DataGrid
          rows={careers}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          rowHeight={60}
          sx={{ border: "none" }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif' }}>{editing ? "Editar carrera" : "Nueva carrera"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!name.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {alert && (
        <AlertMessage
          open={!!alert}
          message={alert.message}
          severity={alert.severity}
          onClose={() => setAlert(null)}
        />
      )}
    </Container>
  );
}
