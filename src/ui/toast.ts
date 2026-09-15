export function showToast(message: string, durationMs = 2400): void {
  const existing = document.querySelector('.ui-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'ui-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.getElementById('ui-root')?.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, durationMs);
}