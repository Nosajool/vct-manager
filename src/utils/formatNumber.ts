/** Round a 0-100 player attribute to a whole number for display. */
export function formatRating(n: number): number {
  return Math.round(n);
}

/** Format K/D ratio to 1 decimal place. */
export function formatKD(n: number): string {
  return n.toFixed(1);
}
