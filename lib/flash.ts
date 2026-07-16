export type FlashType = "success" | "error" | "warning";

// Server Actions in this app redirect with ?type=&msg= instead of Flask's session-based
// flash() — App Router Server Actions don't share a request-scoped flash store, and this
// keeps every form a plain <form action={serverAction}> with no client-side state.
export function withFlash(path: string, type: FlashType, message: string): string {
  const params = new URLSearchParams({ type, msg: message });
  return `${path}?${params.toString()}`;
}
