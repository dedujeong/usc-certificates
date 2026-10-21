import { SxProps, Theme } from "@mui/material";

/**
 * Style for a filter dropdown (Carrera, Periodo, etc.) placed in a
 * DataTableCard's toolbar next to the search box. Uses a fixed `width`
 * (not minWidth) and truncates the selected value with an ellipsis, so
 * picking a long label (e.g. a full career name) can't grow the toolbar
 * and push the column headers down.
 */
export function FILTER_SELECT_SX(width: number): SxProps<Theme> {
  return {
    width,
    "& .MuiInputBase-root": { borderRadius: 999 },
    "& .MuiSelect-select": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };
}
