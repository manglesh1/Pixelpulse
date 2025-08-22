"use client";

import React from "react";

export type ConfigForm = {
  configKey: string;
  configValue: string;
  GamesVariantId: number | "";
  isActive: boolean;
};

type VariantOpt = { ID: number; name: string };

type Props = {
  title: string;
  open: boolean;
  values: ConfigForm;
  variants: VariantOpt[];
  onChange: (patch: Partial<ConfigForm>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  readOnly?: boolean;
};

export default function ConfigFormModal({
  title,
  open,
  values,
  variants,
  onChange,
  onClose,
  onSubmit,
  readOnly = false,
}: Props) {
  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-form-title"
      // prevent iOS overscroll bounce peeking content underneath
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Container: full-screen on mobile, centered panel on sm+ */}
      <div
        className="
          mx-auto
          h-[100dvh] w-screen
          sm:h-auto sm:w-full sm:max-w-lg
          flex items-stretch sm:items-center justify-center
          p-0 sm:p-4
        "
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Panel uses a 3-row grid: header / scroll body / footer */}
        <div
          className="
          bg-white rounded-none sm:rounded-lg shadow
          w-full
          grid grid-rows-[auto_1fr_auto]
          h-full sm:h-auto
        "
        >
          {/* Header (sticky) */}
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between gap-3">
              <h5 id="config-form-title" className="font-semibold text-base">
                {title}
              </h5>
              <button
                type="button"
                className="rounded px-3 py-2 text-sm hover:bg-neutral-100"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body (scrollable) */}
          <form
            onSubmit={handleSubmit}
            id="config-form"
            className="overflow-y-auto"
          >
            <div className="p-4 grid grid-cols-1 gap-3">
              <label className="text-sm">
                <div className="mb-1">Config Key</div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={values.configKey}
                  onChange={(e) => onChange({ configKey: e.target.value })}
                  required={!readOnly}
                  disabled={readOnly}
                  inputMode="text"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1">Config Value</div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={values.configValue}
                  onChange={(e) => onChange({ configValue: e.target.value })}
                  required={!readOnly}
                  disabled={readOnly}
                  inputMode="text"
                />
              </label>

              <label className="text-sm">
                <div className="mb-1">Games Variant</div>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={
                    values.GamesVariantId === ""
                      ? ""
                      : Number(values.GamesVariantId)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange({ GamesVariantId: v === "" ? "" : Number(v) });
                  }}
                  disabled={readOnly}
                >
                  <option value="">Select Variant</option>
                  {variants.map((v) => (
                    <option key={v.ID} value={v.ID}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!values.isActive}
                  onChange={(e) => onChange({ isActive: e.target.checked })}
                  disabled={readOnly}
                />
                <span>Active</span>
              </label>
            </div>
          </form>

          {/* Footer (sticky) */}
          <div className="p-4 border-t sticky bottom-0 bg-white z-10">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {readOnly ? (
                <button
                  type="button"
                  className="border px-3 py-2 rounded"
                  onClick={onClose}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="border px-3 py-2 rounded"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="config-form"
                    className="border px-3 py-2 rounded bg-black text-white hover:opacity-90"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
