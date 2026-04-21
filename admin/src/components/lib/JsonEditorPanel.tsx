"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Reusable right-slide Monaco JSON editor. Used by:
 *   - GameLocationConfigs (LocationVariant.customConfigJson)
 *   - Locations (Location.config)
 *   - GameLocations (GameLocation.config)
 *
 * Caller provides:
 *   - an initial value (object or null)
 *   - a title + optional subtitle/badges
 *   - onSave(parsed) which must return the freshly-saved value (or throw to show error)
 */

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
      Loading editor...
    </div>
  ),
});

export type JsonEditorPanelProps = {
  /** Initial value (object/array/null). Stringified on first render. */
  initialValue: unknown;
  /** Dialog header title. */
  title: string;
  /** Optional subtitle (usually the record being edited). */
  subtitle?: string;
  /** Optional badges shown under the title (status pills etc). */
  headerBadges?: React.ReactNode;
  /** Called on Save. Return the newly-persisted value. Throw/reject to show an error. */
  onSave: (parsed: unknown) => Promise<unknown>;
  onClose: () => void;
};

export default function JsonEditorPanel({
  initialValue,
  title,
  subtitle,
  headerBadges,
  onSave,
  onClose,
}: JsonEditorPanelProps) {
  const initialText = useMemo(
    () =>
      initialValue === null || initialValue === undefined
        ? "{}"
        : JSON.stringify(initialValue, null, 2),
    [initialValue],
  );

  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    try {
      safeJsonParse(text);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  }, [text]);

  const hasChanges = text !== originalText;

  const handleFormat = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(formatPretty(parsed));
      setMessage("Formatted JSON.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot format.");
      setMessage("");
    }
  };

  const handleCompactPatterns = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(stringifyCompactArrays(parsed));
      setMessage("Compacted numeric arrays for readability.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot compact.");
      setMessage("");
    }
  };

  const handleMinify = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(JSON.stringify(parsed));
      setMessage("Minified JSON.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot minify.");
      setMessage("");
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP / restricted environments
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setMessage("Copied to clipboard.");
      setError("");
    } catch {
      setError("Clipboard blocked — copy manually.");
      setMessage("");
    }
  };

  const handleReset = () => {
    setText(originalText);
    setMessage("Reset changes.");
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setMessage("");

    let parsed: unknown;
    try {
      parsed = text.trim() ? JSON.parse(text) : null;
    } catch {
      setError("Invalid JSON.");
      return;
    }

    try {
      setSaving(true);
      const savedValue = await onSave(parsed);
      const formatted =
        savedValue === null || savedValue === undefined
          ? "{}"
          : JSON.stringify(savedValue, null, 2);

      setText(formatted);
      setOriginalText(formatted);
      setMessage("Saved.");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ??
        (e as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ??
        (e as Error)?.message ??
        "Failed to save.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-background shadow-xl">
        <div className="border-b px-6 py-5">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle ? (
            <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {headerBadges}
            <Badge variant={isValidJson ? "default" : "destructive"}>
              {isValidJson ? "Valid JSON" : "Invalid JSON"}
            </Badge>
            {hasChanges ? <Badge variant="secondary">Unsaved Changes</Badge> : null}
          </div>
        </div>

        <div className="border-b px-6 py-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleFormat}>
              Pretty
            </Button>
            <Button type="button" variant="outline" onClick={handleCompactPatterns}>
              Compact JSON
            </Button>
            <Button type="button" variant="outline" onClick={handleMinify}>
              Minify
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}>
              Copy
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={!hasChanges}>
              Reset
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 py-5">
          <div className="h-full overflow-hidden rounded-lg border bg-[#1e1e1e]">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              value={text}
              onChange={(v) => setText(v ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                lineHeight: 24,
                fontFamily:
                  'Consolas, "Cascadia Code", "Fira Code", Menlo, monospace',
                fontLigatures: false,
                wordWrap: "off",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                lineNumbers: "on",
                folding: true,
                glyphMargin: false,
                bracketPairColorization: { enabled: true },
                guides: {
                  indentation: true,
                  bracketPairs: true,
                  highlightActiveIndentation: true,
                },
                renderWhitespace: "boundary",
                renderLineHighlight: "gutter",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                overviewRulerBorder: false,
                occurrencesHighlight: "off",
                selectionHighlight: false,
                stickyScroll: { enabled: true },
                padding: { top: 16, bottom: 16 },
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                  useShadows: false,
                },
              }}
            />
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <span className="text-muted-foreground">
                  {message || "Pretty = indented JSON. Compact = one-line number arrays."}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !isValidJson}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────
function safeJsonParse(text: string): unknown {
  return JSON.parse(text.trim() || "null");
}

function formatPretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Keeps arrays of numbers on one line, useful for pattern matrices. */
function stringifyCompactArrays(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const nextPad = "  ".repeat(indent + 1);

  if (Array.isArray(value)) {
    const isFlat = value.every((v) => typeof v === "number" || v === null);
    if (isFlat) return `[ ${value.join(", ")} ]`;
    if (value.length === 0) return "[]";
    return `[\n${value
      .map((v) => `${nextPad}${stringifyCompactArrays(v, indent + 1)}`)
      .join(",\n")}\n${pad}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return `{\n${entries
      .map(
        ([k, v]) =>
          `${nextPad}${JSON.stringify(k)}: ${stringifyCompactArrays(v, indent + 1)}`,
      )
      .join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}
