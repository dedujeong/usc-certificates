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
          padding: 1,
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(28,27,23,0.08)" },
        }}
      >
        <CardActionArea component={Link} href={path}>
          <CardContent sx={{ display: "flex", flexDirection: "column", minHeight: "3rem" }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button component={Link} href={path} variant="contained" size="small">
            Administrar
          </Button>
        </CardActions>
      </Card>
    </Grid2>
  );
}
