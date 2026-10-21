"use client";

import { Container, Grid2 } from "@mui/material";
import CardItem from "@/components/CardItem";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader title="Registrar" subtitle="Alta de alumnos, carreras, materias y administradores" />
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
