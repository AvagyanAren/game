import { showToast } from './toast';

const BEST_SCORE_KEY = 'mayatnik-best';

export function getGameShareUrl(): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

export function buildShareText(score: number): string {
  return `Маятник — мой счёт ${score}. Побей?`;
}

export function loadBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveBestScore(score: number): number {
  const best = Math.max(loadBestScore(), score);
  localStorage.setItem(BEST_SCORE_KEY, String(best));
  return best;
}

export async function shareGameResult(
  score: number,
  captureScreenshot?: () => Promise<Blob | null>,
): Promise<void> {
  const url = getGameShareUrl();
  const text = buildShareText(score);
  const payload: ShareData = { title: 'Маятник', text, url };

  if (captureScreenshot) {
    try {
      const blob = await captureScreenshot();
      if (blob && typeof navigator.canShare === 'function') {
        const file = new File([blob], 'mayatnik.png', { type: 'image/png' });
        const withFile: ShareData = { ...payload, files: [file] };
        if (navigator.canShare(withFile)) {
          await navigator.share(withFile);
          return;
        }
      }
    } catch {
      // Fall through to text/url share or clipboard.
    }
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }

  const clipboardText = `${text}\n${url}`;
  try {
    await navigator.clipboard.writeText(clipboardText);
    showToast('Ссылка скопирована');
  } catch {
    showToast('Не удалось поделиться');
  }
}