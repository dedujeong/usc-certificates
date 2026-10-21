"use client";

import { Alert, AlertColor, Snackbar } from "@mui/material";

interface AlertMessageProps {
  message: string;
  severity: AlertColor;
  open: boolean;
  onClose: () => void;
}

export default function AlertMessage({ message, severity, open, onClose }: AlertMessageProps) {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
