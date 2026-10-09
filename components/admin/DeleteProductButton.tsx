"use client";

import { deleteProductAction } from "@/app/actions/admin-products";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirm(`¿Eliminar "${name}" permanentemente? Esta acción no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="btn-outline"
        type="submit"
        style={{ borderColor: "#c0392b", color: "#c0392b" }}
      >
        Eliminar
      </button>
    </form>
  );
}
