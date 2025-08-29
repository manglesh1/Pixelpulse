// src/components/docs/ImageWithLabel.tsx (you can keep your path/name if you want)
import React from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LegendItem, Marker } from "./Helpers";

export type LabelWithMarkerPosition = {
  /** either provide x/y OR top/left; percentages like "12%" work best */
  position:
    | { x: string; y: string }
    | { top: string; left: string };
  title: string;
  description?: string;
  /** override the auto-number (defaults to index + 1) */
  n?: number;
  /** aria-label for the marker (optional) */
  ariaLabel?: string;
};

interface ImageWithLabelProps {
  /** Title shown above the image card */
  title: string;
  /** Image src path */
  image: string;
  /** Alt text for the image (accessibility) */
  alt?: string;
  /** Legend items + marker positions */
  labels: LabelWithMarkerPosition[];
  /** Right-hand card title (defaults to "Legend") */
  rightTitle?: string;
  /** Right-hand card description */
  rightDescription?: string;
  /** Aspect ratio class for the image container (default 16/9) */
  aspectClassName?: string; // e.g., "aspect-[16/9]" | "aspect-[4/3]"
  /** Show subtle grid background behind the image (default true) */
  gridBackground?: boolean;
  /** Optional header description under the main title */
  headerDescription?: string;
  /** Optional header badges (strings) displayed as tiny chips in the header */
  headerBadges?: string[];
}

/**
 * Generic “Image with Markers + Legend” block.
 * - Fully controlled via props (no hardcoded marker positions or legend items).
 * - Keeps your existing LegendItem/Marker components for consistent styling.
 */
const ImageWithLabel = ({
  title,
  image,
  alt = "Labeled diagram",
  labels,
  rightTitle = "Legend",
  rightDescription = "Numbered sections on the screen",
  aspectClassName = "aspect-[16/9]",
  gridBackground = true,
  headerDescription,
  headerBadges,
}: ImageWithLabelProps) => {
  // helper to normalize position prop into x/y strings
  const toXY = (p: LabelWithMarkerPosition["position"]): { x: string; y: string } => {
    if ("x" in p && "y" in p) return p;
    return { x: (p as any).left, y: (p as any).top };
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[20fr_7fr] 2xl:grid-cols-[2fr_1fr]">
      {/* Image + markers */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {headerDescription ? (
            <CardDescription>{headerDescription}</CardDescription>
          ) : null}
          {headerBadges && headerBadges.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
              {headerBadges.map((b) => (
                <span key={b} className="rounded border px-1 py-0.5">
                  {b}
                </span>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div
            className={[
              "relative w-full overflow-hidden rounded-md border",
              aspectClassName,
              gridBackground
                ? "bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]"
                : "bg-muted",
            ].join(" ")}
          >
            <Image src={image} alt={alt} fill className="object-contain" priority />
            {labels.map((item, idx) => {
              const { x, y } = toXY(item.position);
              const n = item.n ?? idx + 1;
              return (
                <Marker
                  key={`${n}-${x}-${y}`}
                  n={n}
                  x={x}
                  y={y}
                  aria-label={item.ariaLabel ?? `Marker ${n}`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{rightTitle}</CardTitle>
          {rightDescription ? (
            <CardDescription>{rightDescription}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {labels.map((item, idx) => {
              const n = item.n ?? idx + 1;
              return (
                <LegendItem key={`${n}-${item.title}`} n={n} title={item.title}>
                  {item.description}
                </LegendItem>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageWithLabel;
