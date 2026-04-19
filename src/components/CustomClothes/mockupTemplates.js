/**
 * Hardcoded garment mockups per category (simulates admin-uploaded catalog images).
 * Replace URLs with `/custom-mockups/...` or API paths when CMS is wired.
 */

const VARIANT_NAMES = [
  "Classic crew",
  "Relaxed fit",
  "Slim tapered",
  "Oversized drop",
  "Contrast panel",
];

const PATH_FRONT =
  "M200 100 C140 100 100 135 92 175 L78 215 L102 232 L138 190 L142 430 L258 430 L262 190 L298 232 L322 215 L308 175 C300 135 260 100 200 100 Z";
const PATH_BACK =
  "M200 92 C138 92 94 130 86 172 L72 212 L96 228 L132 186 L138 432 L262 432 L268 186 L304 228 L328 212 L314 172 C306 130 262 92 200 92 Z";

function buildGarmentSvgDataUrl(view, categoryId, slot) {
  const stroke = "rgba(0,0,0,0.1)";
  const sw = 1.2;
  const h = (categoryId * 23 + slot * 41) % 360;
  const h2 = (h + 28) % 360;
  const baseFill = `hsl(${h} 38% 70%)`;
  const accentFill = `hsl(${h2} 45% 58%)`;
  const d = view === "front" ? PATH_FRONT : PATH_BACK;
  const fid = `ff${categoryId}s${slot}${view === "front" ? "f" : "b"}`;
  const useStripes = slot === 5;

  const defs = useStripes
    ? `<defs>
        <pattern id="p${fid}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="12" height="12" fill="${baseFill}"/>
          <rect x="0" y="0" width="4" height="12" fill="${accentFill}" opacity="0.85"/>
        </pattern>
        <filter id="${fid}" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.14"/>
        </filter>
      </defs>`
    : `<defs>
        <filter id="${fid}" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.14"/>
        </filter>
      </defs>`;

  const fillAttr = useStripes ? `url(#p${fid})` : baseFill;
  const trim =
    slot === 4
      ? `<path fill="none" stroke="${accentFill}" stroke-width="5" stroke-linecap="round" d="M128 188 L272 188"/>`
      : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">${defs}<path filter="url(#${fid})" fill="${fillAttr}" stroke="${stroke}" stroke-width="${sw}" d="${d}"/>${trim}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * @param {number} categoryId
 * @returns {{ id: string, name: string, frontUrl: string, backUrl: string }[]}
 */
export function getMockupsForCategory(categoryId) {
  const id = Number(categoryId);
  if (!Number.isFinite(id) || id < 1) return [];
  return [1, 2, 3, 4, 5].map((slot) => ({
    id: `mockup-c${id}-s${slot}`,
    name: VARIANT_NAMES[slot - 1],
    frontUrl: buildGarmentSvgDataUrl("front", id, slot),
    backUrl: buildGarmentSvgDataUrl("back", id, slot),
  }));
}
