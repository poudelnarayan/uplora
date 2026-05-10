/**
 * Format post body text into HTML for inline rendering.
 *
 * Used everywhere a post's description / caption appears in read-only form
 * — dashboard cards, video preview, post listings — so users see the same
 * styling regardless of where the content surfaces.
 *
 * Supported syntax (kept tight on purpose — full markdown is overkill for
 * social captions):
 *   - **bold** or *bold*
 *   - _italic_
 *   - https://… auto-links (opens in new tab)
 *   - #hashtags get a chip background
 *   - 1:23 timestamps get a chip background
 *   - newlines become <br>
 *
 * Returns a string of HTML — caller is responsible for using
 * `dangerouslySetInnerHTML`. We escape user input first so this is safe.
 */

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]);
}

export function formatPostContent(input: string | null | undefined): string {
  if (!input) return "";

  // Always escape user input first — every transform below produces trusted
  // tags from server-known patterns, so anything that looks like HTML in the
  // raw input gets neutralized.
  let formatted = escapeHtml(input);

  // Bold: **text**
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // Bold: *text* (not the leftover from above; matches single-asterisk pairs)
  formatted = formatted.replace(/\*([^*\n]+?)\*/g, '<strong class="font-bold">$1</strong>');
  // Italic: _text_
  formatted = formatted.replace(/_([^_\n]+?)_/g, '<em class="italic">$1</em>');

  // Auto-link URLs
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">$1</a>',
  );

  // Hashtags
  formatted = formatted.replace(
    /#([a-zA-Z0-9_¡-￿]+)(?![a-zA-Z0-9_¡-￿])/g,
    '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[0.85em] font-medium">#$1</span>',
  );

  // Timestamps (1:23 / 12:34:56)
  formatted = formatted.replace(
    /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g,
    '<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[0.85em] font-medium">$1</span>',
  );

  // Line breaks
  formatted = formatted.replace(/\n/g, "<br>");

  return formatted;
}

/**
 * Convenience: returns just the plain visible text (no formatting marks)
 * for use in places that only need a clean preview snippet — e.g. browser
 * tabs, OG image alt text. Strips the same syntax `formatPostContent`
 * recognizes but without producing HTML.
 */
export function stripPostMarkup(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*([^*\n]+?)\*/g, "$1")
    .replace(/_([^_\n]+?)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
