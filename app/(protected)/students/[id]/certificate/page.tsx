"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { fetchCertificateData } from "@/certificate/fetchCertificateData";
import { ApiError, apiFetchBlob } from "@/lib/api/apiClient";
import AlertMessage from "@/components/AlertMessage";

export default function StudentCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);

  const { data, isLoading, error } = useQuery({
    queryKey: ["certificate", "data", studentId],
    queryFn: () => fetchCertificateData(studentId),
  });

  const [certificateNumber, setCertificateNumber] = useState("");
  const [exp, setExp] = useState(new Date().toISOString().slice(0, 10));
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  async function handleGenerate() {
    if (!data) return;
    setIsGenerating(true);
    try {
      const { blob, filename } = await apiFetchBlob(`/api/certificate/pdf/${studentId}`, {
        method: "POST",
        body: JSON.stringify({ certificateNumber, exp }),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `${exp}-${data.studentTuition}-CER-AQ.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setAlert({ message: "Certificado generado", severity: "success" });
    } catch (err) {
      setAlert({ message: err instanceof ApiError ? err.message : "Error al generar el certificado", severity: "error" });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 2, mb: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Generar certificado
        </Typography>

        {isLoading && <Typography>Cargando datos del alumno...</Typography>}
        {error && (
          <Typography color="error">
            {error instanceof ApiError ? error.message : "No se pudo cargar la información del certificado."}
          </Typography>
        )}

        {data && (
          <>
            <Typography sx={{ mb: 2 }}>
              {data.studentName} — Matrícula {data.studentTuition} — {data.studentCareer}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Número de certificado"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                required
              />
              <TextField
                label="Fecha de expedición"
                type="date"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" onClick={handleGenerate} disabled={!certificateNumber.trim() || isGenerating}>
                {isGenerating ? "Generando..." : "Generar y descargar PDF"}
              </Button>
            </Box>
          </>
        )}
      </Paper>
      {alert && <AlertMessage open={!!alert} message={alert.message} severity={alert.severity} onClose={() => setAlert(null)} />}
    </Container>
  );
}
