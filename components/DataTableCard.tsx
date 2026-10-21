"use client";

import { Box, Paper, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { DataGrid, DataGridProps, GridToolbarQuickFilter, GridPagination } from "@mui/x-data-grid";

function TableToolbar({ hideSearch, hidePagination }: { hideSearch: boolean; hidePagination: boolean }) {
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
      {hideSearch ? (
        <Box />
      ) : (
        <GridToolbarQuickFilter
          placeholder="Buscar..."
          variant="outlined"
          size="small"
          sx={{ width: 280, "& .MuiInputBase-root": { borderRadius: 999 } }}
        />
      )}
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
}

export default function DataTableCard<T extends { id: number | string }>({
  emptyLabel = "No hay registros todavía",
  hideSearch = false,
  hideFooter = false,
  rowHeight = 60,
  ...dataGridProps
}: DataTableCardProps<T>) {
  const hideToolbar = hideSearch && hideFooter;

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
          "& .MuiDataGrid-cell": { px: 2.5 },
          "& .MuiDataGrid-columnHeader": { px: 2.5 },
          "& .MuiDataGrid-columnHeaders": { borderBottom: "1px solid", borderColor: "divider" },
          ...dataGridProps.sx,
        }}
        slots={{
          toolbar: hideToolbar ? undefined : () => <TableToolbar hideSearch={hideSearch} hidePagination={hideFooter} />,
          noRowsOverlay: () => <EmptyState label={emptyLabel} />,
        }}
      />
    </Paper>
  );
}
