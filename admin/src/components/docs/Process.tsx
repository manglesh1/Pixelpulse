"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export type ProcessStep = {
  title: string;
  img: string; // e.g. /docs/pos/register-process-1.png
  alt?: string;
  caption?: string; // short line under the image
  detail?: string; // optional text block under caption
};

export function ProcessSteps({
  title,
  description,
  steps,
  note,
  startIndex = 0,
}: {
  title: string;
  description?: string;
  steps: ProcessStep[];
  note?: string;
  startIndex?: number;
}) {
  const [i, setI] = useState(
    Math.min(Math.max(startIndex, 0), steps.length - 1)
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const prev = () => setI((v) => (v - 1 + steps.length) % steps.length);
  const next = () => setI((v) => (v + 1) % steps.length);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* VIEWPORT */}
        <div className="relative w-full overflow-hidden rounded-md border bg-muted">
          {/* Step index chip */}
          <div className="pointer-events-none absolute left-2 top-2 z-10">
            <Badge variant="secondary" className="rounded-full">
              Step {i + 1} / {steps.length}
            </Badge>
          </div>

          {/* Zoom button */}
          <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 z-10 h-8 w-8"
                title="Zoom"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-[92vw] lg:max-w-[1100px]">
              <DialogHeader className="px-4 pt-4">
                <DialogTitle>{steps[i]?.title ?? "Step"}</DialogTitle>
              </DialogHeader>
              <div className="relative mx-4 mb-4 h-[34vh] md:h-[70vh]">
                <Image
                  src={steps[i]?.img ?? ""}
                  alt={steps[i]?.alt ?? steps[i]?.title ?? "Step image"}
                  fill
                  className="object-contain bg-muted rounded-md"
                  priority
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Slides track */}
          <div ref={trackRef} className="relative aspect-[16/9] w-full">
            <Image
              key={i}
              src={steps[i]?.img ?? ""}
              alt={steps[i]?.alt ?? steps[i]?.title ?? "Step image"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 900px"
              priority
            />
          </div>

          {/* Prev/Next */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="pointer-events-auto h-8 w-8"
              onClick={prev}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="pointer-events-auto h-8 w-8"
              onClick={next}
              aria-label="Next step"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title + caption + detail */}
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full w-6 h-6 p-0 text-xs justify-center"
            >
              {i + 1}
            </Badge>
            <h4 className="font-medium">{steps[i]?.title}</h4>
          </div>

          {steps[i]?.caption && (
            <p className="mt-2 text-sm text-muted-foreground">
              {steps[i]?.caption}
            </p>
          )}
          {steps[i]?.detail && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {steps[i]?.detail}
            </p>
          )}
        </div>

        {/* Dots */}
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Go to step ${idx + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === idx
                  ? "bg-foreground"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
              }`}
            />
          ))}
        </div>

        {note && (
          <p className="text-xs text-muted-foreground border-t pt-3">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}
