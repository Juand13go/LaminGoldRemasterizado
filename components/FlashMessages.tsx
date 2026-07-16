"use client";

import { useSearchParams } from "next/navigation";

export function FlashMessages() {
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");
  const type = searchParams.get("type");

  if (!msg) return null;

  const className =
    type === "success" ? "alert alert-success" : type === "warning" ? "alert alert-warning" : "alert alert-error";

  return (
    <section className="container" style={{ paddingTop: 14 }}>
      <div className={className}>{msg}</div>
    </section>
  );
}
