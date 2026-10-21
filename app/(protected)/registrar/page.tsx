"use client";

import { Container, Grid2, Typography } from "@mui/material";
import CardItem from "@/components/CardItem";
import { useAuth } from "@/lib/auth/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Registrar
      </Typography>
      <Grid2 container spacing={3}>
        <CardItem title="Alumno" caption="Alta de alumno e inscripción a carrera" path="/students/new" />
        <CardItem title="Carrera / Materia" caption="Alta de carrera o materia" path="/careers" />
        {user?.role === "superAdmin" && (
          <CardItem title="Administrador" caption="Alta de administrador" path="/administradores/new" />
        )}
      </Grid2>
    </Container>
  );
}
