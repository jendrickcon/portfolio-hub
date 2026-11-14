/**
 * DEVPATH // HTML Safety Utilities
 * ------------------------------------------------------------------
 * Every value interpolated into a template string that becomes
 * innerHTML MUST pass through escapeHtml(). This closes the DOM-XSS
 * hole where a project name or node title containing markup would be
 * parsed as HTML.
 *
 * Rule of thumb used across the codebase:
 *   - Static markup + escaped dynamic values  → template string, ok
 *   - Dynamic-only text                       → textContent, preferred
 * ------------------------------------------------------------------
 */

const ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;"
};

/**
 * Escapes a value for safe interpolation into HTML text or a
 * double/single-quoted attribute value.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, ch => ENTITY_MAP[ch]);
}

/**
 * Escapes a value for use inside a CSS class token, stripping anything
 * that could break out of the attribute or inject a selector.
 */
export function escapeClassToken(value) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

/**
 * Escapes a URL for use in an href/src attribute. Rejects javascript:
 * and data: schemes, which are the usual XSS vectors for links.
 */
export function escapeUrl(value) {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (/^(javascript|data|vbscript):/i.test(raw)) return "";
  return escapeHtml(raw);
}

/** Sets text on an element without ever parsing it as HTML. */
export function setText(el, value) {
  if (!el) return;
  el.textContent = value === null || value === undefined ? "" : String(value);
}