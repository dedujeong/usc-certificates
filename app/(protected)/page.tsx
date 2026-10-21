"use client";

import { Container, Grid2 } from "@mui/material";
import CardItem from "@/components/CardItem";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/auth/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <PageHeader
        title={`Hola${user ? `, ${user.email.split("@")[0]}` : ""}`}
        subtitle="¿Qué quieres hacer hoy?"
      />
      <Grid2 container spacing={3}>
        <CardItem title="Registrar" caption="Alumnos, administradores y catálogo académico" path="/registrar" />
        <CardItem title="Administrar" caption="Gestiona alumnos, carreras y materias" path="/administrar" />
      </Grid2>
    </Container>
  );
}
