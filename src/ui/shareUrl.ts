import { showToast } from './toast';

export function getPageUrl(): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

export async function copyPageUrl(): Promise<void> {
  const url = getPageUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast('Ссылка скопирована');
  } catch {
    showToast('Не удалось скопировать ссылку');
  }
}
