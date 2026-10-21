"use client";

import { Container, Grid2, Typography } from "@mui/material";
import CardItem from "@/components/CardItem";

export default function AdministratePage() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Administrar
      </Typography>
      <Grid2 container spacing={3}>
        <CardItem title="Alumnos" caption="Consulta, edita y genera certificados" path="/students" />
        <CardItem title="Carreras" caption="Catálogo de carreras" path="/careers" />
        <CardItem title="Materias" caption="Catálogo de materias por carrera" path="/subjects" />
        <CardItem title="Campos de certificado" caption="Textos de la plantilla del certificado" path="/certificate-fields" />
        <CardItem title="Firmantes" caption="Personas que firman el certificado" path="/people" />
      </Grid2>
    </Container>
  );
}
