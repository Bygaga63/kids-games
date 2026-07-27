// Рекорды по играм: iu:best:<key>, показываются на карточках хаба.
export function getBest(key: string): number {
  try {
    return parseInt(localStorage.getItem('iu:best:' + key) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(key: string, score: number): void {
  try {
    if (score > getBest(key))
      localStorage.setItem('iu:best:' + key, String(score));
  } catch {}
}
