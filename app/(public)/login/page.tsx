"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { useAuth } from "@/lib/auth/AuthContext";
import { api, ApiError } from "@/lib/api/apiClient";

interface LoginResponse {
  token: string;
  user: { id: number; email: string; role: "admin" | "superAdmin" };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.post<LoginResponse>("/api/auth/login", { email, password });
      login(result.token, result.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ display: "flex", minHeight: "100vh", alignItems: "center" }}>
      <Paper
        elevation={0}
        sx={{ p: 5, width: "100%", border: "1px solid", borderColor: "divider" }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/usc-logo-positive.svg" alt="USC" width={44} height={44} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: "center" }}>
          Bienvenido
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
          Inicia sesión para continuar
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ mt: 1 }}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
