// Залп конфетти на весь экран (как в оригинальных играх).
const DEFAULT_COLORS = [
  '#ff5a7a',
  '#3b6cf6',
  '#ffd43b',
  '#40c057',
  '#ff922b',
  '#9775fa',
];

let styleInjected = false;

function ensureStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent =
    '.iu-confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}' +
    '.iu-confetti i{position:absolute;top:-14px;width:10px;height:14px;border-radius:2px;opacity:.95;animation:iu-fall linear forwards}' +
    '@keyframes iu-fall{to{transform:translateY(110vh) rotate(540deg)}}' +
    '@media (prefers-reduced-motion:reduce){.iu-confetti{display:none}}';
  document.head.appendChild(s);
}

export function burstConfetti(
  colors: string[] = DEFAULT_COLORS,
  count = 70,
): void {
  ensureStyle();
  let box = document.querySelector<HTMLElement>('.iu-confetti');
  if (!box) {
    box = document.createElement('div');
    box.className = 'iu-confetti';
    box.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box);
  }
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    p.style.animationDelay = Math.random() * 0.4 + 's';
    box.appendChild(p);
    setTimeout(() => p.remove(), 3600);
  }
}
