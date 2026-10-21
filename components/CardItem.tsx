"use client";

import Link from "next/link";
import { Button, Card, CardActionArea, CardActions, CardContent, Grid2, Typography } from "@mui/material";

interface CardItemProps {
  title: string;
  caption: string;
  path: string;
}

export default function CardItem({ title, caption, path }: CardItemProps) {
  return (
    <Grid2 size={4}>
      <Card
        sx={{
          minHeight: "11rem",
          padding: 2,
          transition: "0.2s",
          "&:hover": { transform: "scale(1.05)" },
          borderRadius: "1rem",
          boxShadow: 6,
        }}
      >
        <CardActionArea>
          <CardContent sx={{ display: "flex", flexDirection: "column", minHeight: "2rem" }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="caption">{caption}</Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button component={Link} href={path} variant="contained">
            Administrar
          </Button>
        </CardActions>
      </Card>
    </Grid2>
  );
}
