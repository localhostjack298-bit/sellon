/**
 * Open-redirect protection for `?next=` parameters: only same-origin, absolute *paths* are allowed.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  let value = next.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  if (/^\/(api|_next)\b/.test(value)) return fallback;
  return value;
}

/** A redirect target is only honoured if it lives inside the portal the user can actually use. */
export function portalForPath(path: string): "admin" | "staff" | "customer" | "public" {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/staff")) return "staff";
  if (path.startsWith("/account")) return "customer";
  return "public";
}
