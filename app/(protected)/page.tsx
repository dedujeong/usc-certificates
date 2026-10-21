"use client";

import { Container, Grid2 } from "@mui/material";
import CardItem from "@/components/CardItem";

export default function HomePage() {
  return (
    <Container sx={{ mt: 4 }}>
      <Grid2 container spacing={3}>
        <CardItem title="Registrar" caption="Alumnos, administradores y catálogo académico" path="/registrar" />
        <CardItem title="Administrar" caption="Gestiona alumnos, carreras y materias" path="/administrar" />
      </Grid2>
    </Container>
  );
}
