let flashTimeout = 0;

/** Temporary debug: full-screen flash when ball registers a block hit. */
export function flashHitDebug(kind: 'mint' | 'coral' | 'touch'): void {
  if (import.meta.env.PROD) {
    console.info('[physics hit]', kind);
  } else {
    console.log('[physics hit]', kind);
  }

  const root = document.getElementById('ui-root');
  if (!root) {
    return;
  }

  let flash = root.querySelector('.ui-hit-flash') as HTMLDivElement | null;
  if (!flash) {
    flash = document.createElement('div');
    flash.className = 'ui-hit-flash';
    flash.setAttribute('aria-hidden', 'true');
    root.appendChild(flash);
  }

  flash.dataset.kind = kind;
  flash.classList.remove('ui-hit-flash--active');
  void flash.offsetWidth;
  flash.classList.add('ui-hit-flash--active');

  window.clearTimeout(flashTimeout);
  flashTimeout = window.setTimeout(() => {
    flash?.classList.remove('ui-hit-flash--active');
  }, 120);
}
