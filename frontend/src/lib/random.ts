export function shuffle<T>(a: readonly T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = r[i];
    r[i] = r[j];
    r[j] = t;
  }
  return r;
}

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function rnd(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
