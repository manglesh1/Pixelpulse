"use strict";

/**
 * Merge multiple plain-object layers into one, deep-merging keys that
 * exist in more than one layer. Later arguments override earlier ones.
 *
 * Rules:
 *   - null / undefined / non-object layers are skipped.
 *   - If both sides of a key are plain objects, they are deep-merged.
 *   - Arrays are NOT merged element-wise; the later value replaces earlier.
 *   - For any non-object value, later wins.
 *
 * Example:
 *   deepMerge(
 *     { laserTransport: "udp", limits: { lives: 3 } },
 *     { limits: { lives: 5, timeMs: 30000 } }
 *   )
 *   // => { laserTransport: "udp", limits: { lives: 5, timeMs: 30000 } }
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function deepMerge(...layers) {
  const out = {};

  for (const layer of layers) {
    if (!isPlainObject(layer)) continue;

    for (const [key, value] of Object.entries(layer)) {
      if (isPlainObject(value) && isPlainObject(out[key])) {
        out[key] = deepMerge(out[key], value);
      } else if (value !== undefined) {
        out[key] = value;
      }
    }
  }

  return out;
}

module.exports = { deepMerge };
