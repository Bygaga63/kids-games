// Кошелёк монеток: localStorage + window.name (переживает переходы между страницами,
// даже если предпросмотр изолирует localStorage). e — заработано, s — потрачено, p — питомцы.
export type Wallet = { e: number; s: number; p: string[] };

// ТЕСТОВЫЙ РЕЖИМ: баланс никогда не опускается ниже этого значения (кошелёк
// автоматически пополняется при чтении). Выключить — поставить null.
export const TEST_MIN_COINS: number | null = 10;

export function loadWallet(): Wallet {
  const w: Wallet = { e: 0, s: 0, p: [] };
  try {
    const ls = localStorage.getItem('iu:wallet');
    if (ls) {
      const o = JSON.parse(ls);
      w.e = o.e || 0;
      w.s = o.s || 0;
      w.p = o.p || [];
    } else {
      const lc = parseInt(localStorage.getItem('iu:coins') || '0', 10) || 0;
      const lp = JSON.parse(localStorage.getItem('iu:pets') || '[]');
      if (lc || lp.length) {
        w.e = lc;
        w.p = lp;
      }
    }
  } catch {}
  try {
    if (window.name && window.name.indexOf('IUW:') === 0) {
      const o2 = JSON.parse(window.name.slice(4));
      if ((o2.e || 0) > w.e) w.e = o2.e;
      if ((o2.s || 0) > w.s) w.s = o2.s;
      (o2.p || []).forEach((k: string) => {
        if (w.p.indexOf(k) < 0) w.p.push(k);
      });
    }
  } catch {}
  if (TEST_MIN_COINS != null && (w.e || 0) - (w.s || 0) < TEST_MIN_COINS) {
    w.e = (w.s || 0) + TEST_MIN_COINS;
  }
  return w;
}

export function saveWallet(w: Wallet): void {
  try {
    localStorage.setItem('iu:wallet', JSON.stringify(w));
    localStorage.setItem(
      'iu:coins',
      String(Math.max(0, (w.e || 0) - (w.s || 0))),
    );
    localStorage.setItem('iu:pets', JSON.stringify(w.p || []));
  } catch {}
  try {
    window.name = 'IUW:' + JSON.stringify(w);
  } catch {}
  try {
    window.dispatchEvent(
      new CustomEvent('iu:wallet', { detail: coinBalance() }),
    );
  } catch {}
}

export function coinBalance(): number {
  const w = loadWallet();
  return Math.max(0, (w.e || 0) - (w.s || 0));
}

/** Синхронизировать кошелёк при входе на страницу (localStorage <-> window.name). */
export function syncWallet(): void {
  try {
    saveWallet(loadWallet());
  } catch {}
}

const BADGE_SVG =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8.2v7.6M9.8 10c0-.9 1-1.5 2.2-1.5s2.2.6 2.2 1.5c0 2.3-4.4 1.1-4.4 3.4 0 .9 1 1.5 2.2 1.5s2.2-.6 2.2-1.5"/></svg><span></span>';

/** Начислить монетки и показать/обновить плавающий бейдж с балансом. */
export function addCoins(n: number): void {
  n = Math.max(0, Math.round(n || 0));
  if (!n) return;
  const w = loadWallet();
  w.e = (w.e || 0) + n;
  saveWallet(w);
  const c = Math.max(0, (w.e || 0) - (w.s || 0));
  let b = document.getElementById('coinbadge');
  if (!b) {
    b = document.createElement('div');
    b.id = 'coinbadge';
    b.style.cssText =
      'position:fixed;right:14px;bottom:14px;z-index:70;display:inline-flex;align-items:center;gap:7px;font:900 15px/1 Nunito,system-ui,sans-serif;color:#a86400;background:linear-gradient(135deg,#fff3cd,#ffe49a);border:1px solid #ffd43b;border-radius:999px;padding:9px 14px;box-shadow:0 10px 24px rgba(31,42,68,.18);font-variant-numeric:tabular-nums;transition:transform .15s ease';
    b.innerHTML = BADGE_SVG;
    document.body.appendChild(b);
  }
  b.querySelector('span')!.textContent = String(c);
  b.style.transform = 'scale(1.18)';
  setTimeout(() => {
    b!.style.transform = '';
  }, 170);
}

/** Списать монетки (покупка). Возвращает false, если не хватает. */
export function spendCoins(n: number): boolean {
  n = Math.max(0, Math.round(n || 0));
  const w = loadWallet();
  if (Math.max(0, (w.e || 0) - (w.s || 0)) < n) return false;
  w.s = (w.s || 0) + n;
  saveWallet(w);
  return true;
}
