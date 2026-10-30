import { cn } from "@/lib/utils";

type P = { className?: string };
export function InstagramIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function FacebookIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.5Z" />
    </svg>
  );
}
export function WhatsAppIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.5A8 8 0 0 1 8.2 18.6L4 20l1.4-4A8 8 0 1 1 20 11.5Z" /><path d="M9.2 8.8c.2 2.3 2.7 4.8 5 5l1.2-1.1-1.7-1-.8.6c-.7-.3-1.5-1.1-1.8-1.8l.6-.8-1-1.7-1.5 1.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
