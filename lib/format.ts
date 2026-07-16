export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount);
}
