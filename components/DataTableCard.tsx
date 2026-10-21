"use client";

import { Box, Paper, Typography } from "@mui/material";
import { ReactNode } from "react";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { DataGrid, DataGridProps, GridToolbarQuickFilter, GridPagination } from "@mui/x-data-grid";

function TableToolbar({
  hideSearch,
  hidePagination,
  filters,
}: {
  hideSearch: boolean;
  hidePagination: boolean;
  filters?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        px: 2.5,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        {!hideSearch && (
          <GridToolbarQuickFilter
            placeholder="Buscar..."
            variant="outlined"
            size="small"
            sx={{ width: 240, "& .MuiInputBase-root": { borderRadius: 999 } }}
          />
        )}
        {filters}
      </Box>
      {!hidePagination && (
        <GridPagination
          sx={{
            color: "text.secondary",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 13 },
          }}
        />
      )}
    </Box>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1 }}>
      <SearchOffIcon sx={{ color: "text.secondary", fontSize: 32 }} />
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
    </Box>
  );
}

interface DataTableCardProps<T extends { id: number | string }> extends Omit<DataGridProps<T>, "slots" | "autoHeight"> {
  /** Message shown when there are no rows (and no active search). */
  emptyLabel?: string;
  /** Hides the built-in search box, e.g. for very short lists. */
  hideSearch?: boolean;
  /** Extra filter controls (e.g. Selects) rendered in the same toolbar row, next to the search box. */
  filters?: ReactNode;
}

export default function DataTableCard<T extends { id: number | string }>({
  emptyLabel = "No hay registros todavía",
  hideSearch = false,
  hideFooter = false,
  filters,
  rowHeight = 60,
  ...dataGridProps
}: DataTableCardProps<T>) {
  const hideToolbar = hideSearch && hideFooter && !filters;

  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
      <DataGrid
        {...dataGridProps}
        rowHeight={rowHeight}
        columnHeaderHeight={52}
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        hideFooter
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": { px: 2.5, display: "flex", alignItems: "center", overflow: "hidden" },
          "& .MuiDataGrid-columnHeader": { px: 2.5 },
          "& .MuiDataGrid-columnHeaders": { borderBottom: "1px solid", borderColor: "divider" },
          ...dataGridProps.sx,
        }}
        slots={{
          toolbar: hideToolbar
            ? undefined
            : () => <TableToolbar hideSearch={hideSearch} hidePagination={hideFooter} filters={filters} />,
          noRowsOverlay: () => <EmptyState label={emptyLabel} />,
        }}
      />
    </Paper>
  );
}
