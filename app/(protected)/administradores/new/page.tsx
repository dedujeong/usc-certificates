"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { administratorsApi } from "@/lib/api/administrators";
import { ApiError } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";
import RequireRole from "@/components/ProtectedRoute";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(10)))
    .map((n) => chars[n % chars.length])
    .join("");
}

function NewAdministratorContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    paternalName: "",
    maternalName: "",
    email: "",
    password: generatePassword(),
    role: "admin" as "admin" | "superAdmin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await administratorsApi.create({
        firstName: form.firstName,
        paternalName: form.paternalName || undefined,
        maternalName: form.maternalName || undefined,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setAlert({ message: "Administrador creado", severity: "success" });
      router.push("/administradores");
    } catch (err) {
      setAlert({ message: err instanceof ApiError ? err.message : "Error al crear", severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 2, mb: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Nuevo administrador
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <TextField
            label="Contraseña generada"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText="Cópiala y entrégasela al administrador; no se puede recuperar después."
          />
          <TextField select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "superAdmin" })}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superAdmin">Super admin</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.firstName.trim() || !form.email.trim() || form.password.length < 8 || isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </Paper>
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}

export default function NewAdministratorPage() {
  return (
    <RequireRole role="superAdmin">
      <NewAdministratorContent />
    </RequireRole>
  );
}
