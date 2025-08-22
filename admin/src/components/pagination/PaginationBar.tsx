"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  page: number; // 1-based
  totalPages: number; // >= 1
  onPageChange: (page: number) => void;

  /** Optional: show rows-per-page dropdown when provided */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (n: number) => void;

  /** Optional: show total rows text on the left (e.g., "1,234 total") */
  totalCount?: number;

  /** Optional flags */
  showPageInput?: boolean; // default true
  className?: string;
};

export default function PaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  totalCount,
  showPageInput = true,
  className,
}: Props) {
  const clamp = (n: number) => Math.min(Math.max(1, n), totalPages);

  // Local input state so users can type freely before commit (Enter/blur)
  const [draft, setDraft] = React.useState<string>(String(page));
  React.useEffect(() => setDraft(String(page)), [page]);

  const commitDraft = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(page));
      return;
    }
    const next = clamp(Math.round(n));
    if (next !== page) onPageChange(next);
    else setDraft(String(page));
  };

  const goto = (n: number) => onPageChange(clamp(n));

  return (
    <div
      className={[
        "mt-4 flex w-full flex-wrap items-center justify-between gap-3",
        className ?? "",
      ].join(" ")}
    >
      {/* Left: rows-per-page + total */}
      <div className="flex items-center gap-3">
        {onPageSizeChange && typeof pageSize === "number" && (
          <>
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[82px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {typeof totalCount === "number" && (
          <span className="ml-1 text-sm text-muted-foreground">
            {totalCount.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Right: pager controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(1)}
          disabled={page <= 1}
          aria-label="First page"
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </Button>

        {showPageInput ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="h-8 w-[68px] text-center"
              inputMode="numeric"
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>
        ) : (
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ›
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
        >
          »
        </Button>
      </div>
    </div>
  );
}
